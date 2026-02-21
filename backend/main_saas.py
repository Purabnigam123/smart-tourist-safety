from datetime import datetime
import time
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
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

app = FastAPI(title="Smart Tourist Safety SaaS Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
     "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
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
    db = database.get_db()
    db.tourists.create_index("email", unique=True)
    db.tourists.create_index("id", unique=True)
    db.admins.create_index("username", unique=True)
    db.admins.create_index("email", unique=True)
    db.organizations.create_index("id", unique=True)
    db.incidents.create_index("id", unique=True)
    db.audit_logs.create_index("created_at")
    
    # Create default super admin if not exists
    existing_super = db.admins.find_one({"role": "super_admin"})
    if not existing_super:
        admin_id = database.get_next_sequence("admin_id")
        super_admin = {
            "id": admin_id,
            "username": "superadmin",
            "email": "admin@safetysaas.com",
            "password": hash_password("admin123"),  # Change in production!
            "full_name": "Super Administrator",
            "role": "super_admin",
            "organization_id": None,
            "created_at": datetime.utcnow(),
        }
        db.admins.insert_one(super_admin)
        print("✅ Default super admin created")


# ============== HEALTH CHECK ==============

@app.get("/")
def root():
    return {"status": "Smart Tourist Safety SaaS Platform - API Running"}


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
def update_sos_status(incident_id: int, status: str, current_user: dict = Depends(get_current_admin)):
    """Update SOS alert status"""
    db = database.get_db()
    
    incident = db.incidents.find_one({"id": incident_id})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Check org permission
    if current_user["role"] == "org_admin" and incident.get("organization_id") != current_user["org_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.incidents.update_one({"id": incident_id}, {"$set": {"status": status, "updated_at": datetime.utcnow()}})
    
    # Log audit
    log_audit(db, "sos_status_update", current_user["sub"], "admin", current_user["org_id"],
              {"incident_id": incident_id, "new_status": status})
    
    return {"message": "SOS status updated"}


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
    new_geofence = {
        "id": geofence_id,
        "name": geofence.name,
        "latitude": geofence.latitude,
        "longitude": geofence.longitude,
        "radius": geofence.radius,
        "organization_id": geofence.organization_id,
        "zone_type": geofence.zone_type,
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


# ============== PUBLIC ROUTES (for legacy/testing) ==============

@app.post("/api/geofence/check")
def geofence_check_public(location: GeoFenceRequest):
    return check_geofence(location.latitude, location.longitude)


@app.post("/api/ai/risk")
def evaluate_risk_public(data: RiskRequest):
    return calculate_risk(
        data.latitude,
        data.longitude,
        data.restricted_zone,
        data.sos_triggered
    )


# ============== HELPER FUNCTIONS ==============

def log_audit(db, action: str, user_id: str, user_type: str, org_id: str, metadata: dict = None):
    """Log audit trail"""
    audit_id = database.get_next_sequence("audit_id")
    audit_log = {
        "id": audit_id,
        "action": action,
        "user_id": user_id,
        "user_type": user_type,
        "organization_id": org_id,
        "metadata": metadata or {},
        "created_at": datetime.utcnow(),
    }
    db.audit_logs.insert_one(audit_log)


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
