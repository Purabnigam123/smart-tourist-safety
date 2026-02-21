from datetime import datetime
import time
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_risk import calculate_risk
from geofence import check_geofence
from schemas import (
    RiskRequest, GeoFenceRequest, TouristCreate, TouristResponse, SOSRequest,
    TouristRegister, TouristLogin, AdminLogin, TokenResponse,
    OrganizationCreate, AdminCreate, GeoFenceCreate
)
from auth import (
    generate_tourist_hash, hash_password, verify_password,
    create_access_token, verify_token
)
import database

# Request Models
class StatusUpdate(BaseModel):
    status: str
    
    class Config:
        json_schema_extra = {
            "example": {"status": "RESOLVED"}
        }

app = FastAPI(title="Smart Tourist Safety SaaS Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== DEPENDENCY: GET CURRENT USER ==============

def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract and verify JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload


def get_current_admin(current_user: dict = Depends(get_current_user)):
    """Verify user is an admin"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def get_current_tourist(current_user: dict = Depends(get_current_user)):
    """Verify user is a tourist"""
    if current_user.get("user_type") != "tourist":
        raise HTTPException(status_code=403, detail="Tourist access required")
    return current_user


# ============== STARTUP ==============

@app.on_event("startup")
def setup_indexes():
    """Initialize database indexes and default super admin"""
    try:
        db = database.get_db()
        
        # Drop old conflicting indexes if they exist, then recreate as sparse
        for col_name, field in [("tourists", "email"), ("tourists", "tourist_hash")]:
            try:
                col = db[col_name]
                col.drop_index(f"{field}_1")
            except Exception:
                pass
        
        # Create required indexes
        db.tourists.create_index("email", unique=True, sparse=True)
        db.tourists.create_index("id", unique=True)
        db.admins.create_index("username", unique=True)
        db.admins.create_index("email", unique=True, sparse=True)
        db.organizations.create_index("id", unique=True)
        db.incidents.create_index("id", unique=True)
        db.geofences.create_index("id", unique=True)
        db.audit_logs.create_index("created_at")
        
        # Create default super admin if not exists
        existing_super = db.admins.find_one({"role": "super_admin"})
        if not existing_super:
            admin_id = database.get_next_sequence("admin_id")
            super_admin = {
                "id": admin_id,
                "username": "superadmin",
                "email": "admin@safetysaas.com",
                "password": hash_password("admin123"),  # ⚠️ CHANGE IN PRODUCTION!
                "full_name": "Super Administrator",
                "role": "super_admin",
                "organization_id": None,
                "created_at": datetime.utcnow(),
            }
            db.admins.insert_one(super_admin)
            print("✅ Default super admin created")
        
        print("✅ Database indexes initialized")
    except Exception as e:
        print(f"❌ Startup error: {e}")
        raise


# ============== HEALTH CHECK ==============

@app.get("/")
def root():
    return {"status": "Smart Tourist Safety SaaS Platform - API Running", "version": "2.0"}


@app.get("/test-password")
def test_password_endpoint():
    """Test password verification"""
    from auth import verify_password
    import database
    
    db = database.get_db()
    admin = db.admins.find_one({"username": "superadmin"})
    
    if not admin:
        return {"error": "Admin not found"}
    
    result = verify_password("admin123", admin["password"])
    return {
        "username": admin["username"],
        "hash_preview": admin["password"][:30],
        "verification_result": result
    }


# ============== AUTHENTICATION ROUTES ==============

@app.post("/api/auth/tourist/register", response_model=TokenResponse)
def register_tourist_auth(tourist: TouristRegister):
    """Register a new tourist with authentication"""
    db = database.get_db()
    
    # Check if email already exists
    existing = db.tourists.find_one({"email": tourist.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tourist_id = database.get_next_sequence("tourist_id")
    tourist_hash = generate_tourist_hash(tourist.email + str(time.time()))
    
    new_tourist = {
        "id": tourist_id,
        "name": tourist.name,
        "email": tourist.email,
        "password": hash_password(tourist.password),
        "govt_id": tourist.govt_id,
        "phone": tourist.phone,
        "emergency_contact": tourist.emergency_contact,
        "tourist_hash": tourist_hash,
        "organization_id": tourist.organization_id or "default",
        "created_at": datetime.utcnow(),
    }
    
    db.tourists.insert_one(new_tourist)
    
    # Log audit
    log_audit(db, "tourist_register", tourist_id, "tourist", tourist.organization_id)
    
    # Create JWT token
    access_token = create_access_token({
        "sub": str(tourist_id),
        "email": tourist.email,
        "user_type": "tourist",
        "org_id": tourist.organization_id or "default"
    })
    
    return TokenResponse(
        access_token=access_token,
        user_type="tourist",
        name=tourist.name
    )


@app.post("/api/auth/tourist/login", response_model=TokenResponse)
def login_tourist(credentials: TouristLogin):
    """Tourist login"""
    db = database.get_db()
    
    tourist = db.tourists.find_one({"email": credentials.email})
    if not tourist:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, tourist["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Log audit
    log_audit(db, "tourist_login", tourist["id"], "tourist", tourist.get("organization_id"))
    
    # Create JWT token
    access_token = create_access_token({
        "sub": str(tourist["id"]),
        "email": tourist["email"],
        "user_type": "tourist",
        "org_id": tourist.get("organization_id", "default")
    })
    
    return TokenResponse(
        access_token=access_token,
        user_type="tourist",
        name=tourist["name"]
    )


@app.post("/api/auth/admin/login", response_model=TokenResponse)
def login_admin(credentials: AdminLogin):
    """Admin login"""
    try:
        db = database.get_db()
        
        admin = db.admins.find_one({"username": credentials.username})
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not verify_password(credentials.password, admin["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Log audit
        log_audit(db, "admin_login", admin["id"], "admin", admin.get("organization_id"))
        
        # Create JWT token
        access_token = create_access_token({
            "sub": str(admin["id"]),
            "username": admin["username"],
            "user_type": "admin",
            "role": admin["role"],
            "org_id": admin.get("organization_id")
        })
        
        return TokenResponse(
            access_token=access_token,
            user_type="admin",
            name=admin["full_name"],
            role=admin["role"]
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
        
        # Create JWT token
        access_token = create_access_token({
            "sub": str(admin["id"]),
            "username": admin["username"],
            "user_type": "admin",
            "role": admin["role"],
            "org_id": admin.get("organization_id")
        })
        
        return TokenResponse(
            access_token=access_token,
            user_type="admin",
            name=admin["full_name"],
            role=admin["role"]
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


# ============== TOURIST PROTECTED ROUTES ==============

@app.post("/api/tourist/sos")
def trigger_sos_auth(sos: SOSRequest, current_user: dict = Depends(get_current_tourist)):
    """Trigger SOS (authenticated)"""
    db = database.get_db()
    
    tourist_id = current_user["sub"]
    tourist = db.tourists.find_one({"id": int(tourist_id)})
    
    incident_id = database.get_next_sequence("incident_id")
    incident = {
        "id": incident_id,
        "tourist_id": int(tourist_id),
        "tourist_email": current_user["email"],
        "organization_id": current_user["org_id"],
        "latitude": sos.latitude,
        "longitude": sos.longitude,
        "message": sos.message,
        "status": "PENDING",
        "created_at": datetime.utcnow(),
    }
    
    db.incidents.insert_one(incident)
    
    # Log audit
    log_audit(db, "sos_triggered", tourist_id, "tourist", current_user["org_id"], 
              {"lat": sos.latitude, "lon": sos.longitude})
    
    return {
        "status": "SOS Triggered",
        "incident_id": incident_id,
        "message": "Emergency alert sent to control room"
    }


@app.get("/api/tourist/profile")
def get_tourist_profile(current_user: dict = Depends(get_current_tourist)):
    """Get tourist profile"""
    db = database.get_db()
    tourist = db.tourists.find_one({"id": int(current_user["sub"])})
    
    if not tourist:
        raise HTTPException(status_code=404, detail="Tourist not found")
    
    tourist.pop("_id", None)
    tourist.pop("password", None)
    return jsonable_encoder(tourist)


# ============== ADMIN PROTECTED ROUTES ==============

@app.get("/api/admin/tourists")
def get_admin_tourists(current_user: dict = Depends(get_current_admin)):
    """Get tourists (filtered by organization for org_admin)"""
    db = database.get_db()
    
    query = {}
    if current_user["role"] == "org_admin":
        query["organization_id"] = current_user["org_id"]    
    tourists = list(db.tourists.find(query))
    
    for tourist in tourists:
        tourist.pop("_id", None)
        tourist.pop("password", None)
    
    return jsonable_encoder(tourists)


@app.get("/api/admin/sos-alerts")
def get_admin_sos_alerts(current_user: dict = Depends(get_current_admin)):
    """Get SOS alerts (filtered by organization)"""
    db = database.get_db()
    
    query = {}
    if current_user["role"] == "org_admin":
        query["organization_id"] = current_user["org_id"]
    
    incidents = list(db.incidents.find(query).sort("created_at", -1).limit(100))
    
    for incident in incidents:
        incident.pop("_id", None)
    
    return jsonable_encoder(incidents)


@app.put("/api/admin/sos-alerts/{incident_id}")
def update_sos_status(incident_id: int, status_update: StatusUpdate, current_user: dict = Depends(get_current_admin)):
    """Update SOS alert status"""
    if not status_update.status or status_update.status.strip() == "":
        raise HTTPException(status_code=400, detail="Status cannot be empty")
    
    valid_statuses = ["PENDING", "RESOLVED", "REJECTED"]
    if status_update.status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid_statuses)}")
    
    db = database.get_db()
    
    incident = db.incidents.find_one({"id": incident_id})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Check org permission
    if current_user["role"] == "org_admin" and incident.get("organization_id") != current_user["org_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.incidents.update_one({"id": incident_id}, {"$set": {"status": status_update.status.upper(), "updated_at": datetime.utcnow()}})
    
    # Log audit
    log_audit(db, "sos_status_update", current_user["sub"], "admin", current_user["org_id"],
              {"incident_id": incident_id, "new_status": status_update.status.upper()})
    
    return {"message": "SOS status updated", "incident_id": incident_id, "status": status_update.status.upper()}


@app.get("/api/admin/audit-logs")
def get_audit_logs(current_user: dict = Depends(get_current_admin)):
    """Get audit logs"""
    db = database.get_db()
    
    query = {}
    if current_user["role"] == "org_admin":
        query["organization_id"] = current_user["org_id"]
    
    logs = list(db.audit_logs.find(query).sort("created_at", -1).limit(200))
    
    for log in logs:
        log.pop("_id", None)
    
    return jsonable_encoder(logs)


@app.post("/api/admin/geofence")
def create_geofence(geofence: GeoFenceCreate, current_user: dict = Depends(get_current_admin)):
    """Create geo-fence"""
    db = database.get_db()
    
    # Check permission
    if current_user["role"] == "org_admin" and geofence.organization_id != current_user["org_id"]:
        raise HTTPException(status_code=403, detail="Can only create geo-fences for your organization")
    
    geofence_id = database.get_next_sequence("geofence_id")

    rating = geofence.rating
    if rating <= 30:
        zone_type = "safe"
        risk_level = "low"
    elif rating <= 70:
        zone_type = "caution"
        risk_level = "medium"
    else:
        zone_type = "restricted"
        risk_level = "high"

    radius_meters = geofence.radius_km * 1000
    new_geofence = {
        "id": geofence_id,
        "name": geofence.name,
        "latitude": geofence.latitude,
        "longitude": geofence.longitude,
        "radius": radius_meters,
        "organization_id": geofence.organization_id,
        "zone_type": zone_type,
        "risk_level": risk_level,
        "rating": rating,
        "description": geofence.description,
        "created_by": current_user["sub"],
        "created_at": datetime.utcnow(),
    }
    
    db.geofences.insert_one(new_geofence)
    
    # Log audit
    log_audit(db, "geofence_created", current_user["sub"], "admin", geofence.organization_id, {"geofence_id": geofence_id})
    
    return {"message": "Geo-fence created", "geofence_id": geofence_id}


@app.get("/api/admin/geofences")
def get_geofences(current_user: dict = Depends(get_current_admin)):
    """Get geo-fences"""
    db = database.get_db()
    
    query = {}
    if current_user["role"] == "org_admin":
        query["organization_id"] = current_user["org_id"]
    
    geofences = list(db.geofences.find(query))
    
    for geofence in geofences:
        geofence.pop("_id", None)
    
    return jsonable_encoder(geofences)


@app.delete("/api/admin/geofences/{geofence_id}")
def delete_geofence(geofence_id: int, current_user: dict = Depends(get_current_admin)):
    """Delete geo-fence"""
    db = database.get_db()

    geofence = db.geofences.find_one({"id": geofence_id})
    if not geofence:
        raise HTTPException(status_code=404, detail="Geo-fence not found")

    # Check org permission
    if current_user["role"] == "org_admin" and geofence.get("organization_id") != current_user["org_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    db.geofences.delete_one({"id": geofence_id})

    # Log audit
    log_audit(
        db,
        "geofence_deleted",
        current_user["sub"],
        "admin",
        current_user["org_id"],
        {"geofence_id": geofence_id},
    )

    return {"message": "Geo-fence deleted", "geofence_id": geofence_id}


@app.get("/api/admin/stats")
def get_admin_stats(current_user: dict = Depends(get_current_admin)):
    """Get dashboard statistics"""
    db = database.get_db()
    
    query = {}
    if current_user["role"] == "org_admin":
        query["organization_id"] = current_user["org_id"]
    
    total_tourists = db.tourists.count_documents(query)
    active_sos = db.incidents.count_documents({**query, "status": "PENDING"})
    total_sos = db.incidents.count_documents(query)
    total_geofences = db.geofences.count_documents(query)
    
    return {
        "total_tourists": total_tourists,
        "active_sos_alerts": active_sos,
        "total_sos_alerts": total_sos,
        "total_geofences": total_geofences
    }


@app.get("/api/admin/messages")
def get_admin_messages(current_user: dict = Depends(get_current_admin)):
    """Get all contact admin messages"""
    db = database.get_db()
    
    # For now, all admins can see all messages
    # Future: filter by organization_id if needed
    messages = list(db.messages.find().sort("created_at", -1))
    
    # Convert ObjectId to string and format dates
    for msg in messages:
        msg["_id"] = str(msg["_id"])
        if "created_at" in msg:
            msg["created_at"] = msg["created_at"].isoformat()
    
    return {"messages": messages}


@app.patch("/api/admin/messages/{message_id}/status")
def update_message_status(
    message_id: int,
    status: dict,
    current_user: dict = Depends(get_current_admin)
):
    """Update message status (read/unread)"""
    db = database.get_db()
    
    new_status = status.get("status")
    if new_status not in ["read", "unread"]:
        raise HTTPException(status_code=400, detail="Status must be 'read' or 'unread'")
    
    result = db.messages.update_one(
        {"id": message_id},
        {"$set": {"status": new_status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Log audit
    log_audit(
        db,
        "message_status_updated",
        current_user["sub"],
        "admin",
        current_user["org_id"],
        {"message_id": message_id, "status": new_status}
    )
    
    return {"message": "Status updated successfully", "message_id": message_id, "status": new_status}


# ============== PUBLIC ROUTES (for legacy/testing) ==============

@app.post("/api/geofence/check")
def geofence_check_public(location: GeoFenceRequest):
    """Check if location is in any geofence - validates coordinates"""
    if location.latitude < -90 or location.latitude > 90:
        raise HTTPException(status_code=400, detail="Invalid latitude. Must be between -90 and 90")
    if location.longitude < -180 or location.longitude > 180:
        raise HTTPException(status_code=400, detail="Invalid longitude. Must be between -180 and 180")
    
    return check_geofence(location.latitude, location.longitude)


@app.post("/api/ai/risk")
def evaluate_risk_public(data: RiskRequest):
    """Evaluate risk score - validates coordinates"""
    if data.latitude < -90 or data.latitude > 90:
        raise HTTPException(status_code=400, detail="Invalid latitude. Must be between -90 and 90")
    if data.longitude < -180 or data.longitude > 180:
        raise HTTPException(status_code=400, detail="Invalid longitude. Must be between -180 and 180")
    
    return calculate_risk(
        data.latitude,
        data.longitude,
        data.restricted_zone,
        data.sos_triggered
    )


@app.get("/api/geofences/public")
def get_public_geofences():
    """Get all geofence zones (public — for tourist map overlay)"""
    db = database.get_db()
    zones = list(db.geofences.find())
    for z in zones:
        z.pop("_id", None)

    return jsonable_encoder(zones)


@app.post("/api/tourist/contact-admin")
def contact_admin_public(data: dict):
    """Tourist can send a message to admin (stored in DB) - with validation"""
    if not data:
        raise HTTPException(status_code=400, detail="Request body cannot be empty")
    
    name = data.get("name", "Tourist").strip()
    email = data.get("email", "").strip()
    subject = data.get("subject", "General Inquiry").strip()
    message = data.get("message", "").strip()
    
    if not message or len(message) == 0:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    if len(message) > 5000:
        raise HTTPException(status_code=400, detail="Message cannot exceed 5000 characters")
    
    if email and "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    db = database.get_db()
    msg_id = database.get_next_sequence("message_id")
    message_doc = {
        "id": msg_id,
        "name": name if name else "Tourist",
        "email": email,
        "subject": subject if subject else "General Inquiry",
        "message": message,
        "created_at": datetime.utcnow(),
        "status": "unread",
    }
    
    db.messages.insert_one(message_doc)
    return {"message": "Message sent successfully", "message_id": msg_id}


# ============== HELPER FUNCTIONS ==============

def log_audit(db, action: str, user_id, user_type: str, org_id: str, metadata: dict = None):
    """Log audit trail - with error handling"""
    try:
        if not action or not user_type:
            print("⚠️ Invalid audit log parameters")
            return
        
        audit_id = database.get_next_sequence("audit_id")
        audit_log = {
            "id": audit_id,
            "action": action,
            "user_id": str(user_id),
            "user_type": user_type,
            "organization_id": org_id,
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
        }
        db.audit_logs.insert_one(audit_log)
    except Exception as e:
        print(f"❌ Audit logging error: {e}")


# ============== ORGANIZATION MANAGEMENT (Super Admin) ==============

@app.post("/api/admin/organizations")
def create_organization(org: OrganizationCreate, current_user: dict = Depends(get_current_admin)):
    """Create organization (super admin only)"""
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    db = database.get_db()
    org_id = database.get_next_sequence("organization_id")
    
    new_org = {
        "id": org_id,
        "name": org.name,
        "plan": org.plan,
        "contact_email": org.contact_email,
        "created_at": datetime.utcnow(),
        "active": True
    }
    
    db.organizations.insert_one(new_org)
    
    return {"message": "Organization created", "organization_id": org_id}


@app.get("/api/admin/organizations")
def list_organizations(current_user: dict = Depends(get_current_admin)):
    """List organizations (super admin only)"""
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    db = database.get_db()
    orgs = list(db.organizations.find())
    
    for org in orgs:
        org.pop("_id", None)
    
    return jsonable_encoder(orgs)
