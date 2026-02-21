from datetime import datetime
import time
from fastapi import FastAPI, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from ai_risk import calculate_risk
from geofence import check_geofence
from schemas import RiskRequest, GeoFenceRequest, TouristCreate, TouristResponse, SOSRequest
from auth import generate_tourist_hash
import database

app = FastAPI(title="Smart Tourist Safety System")

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


@app.on_event("startup")
def setup_indexes():
    db = database.get_db()
    db.tourists.create_index("tourist_hash", unique=True)
    db.tourists.create_index("id", unique=True)
    db.incidents.create_index("id", unique=True)

@app.get("/")
def root():
    return {"status": "API Running Successfully"}

# 🧾 Tourist Registration
@app.post("/api/tourist/register", response_model=TouristResponse)
def register_tourist(tourist: TouristCreate):
    raw_data = tourist.name + tourist.govt_id + str(time.time())
    tourist_hash = generate_tourist_hash(raw_data)

    db = database.get_db()
    tourist_id = database.get_next_sequence("tourist_id")
    new_tourist = {
        "id": tourist_id,
        "name": tourist.name,
        "govt_id": tourist.govt_id,
        "phone": tourist.phone,
        "emergency_contact": tourist.emergency_contact,
        "tourist_hash": tourist_hash,
        "created_at": datetime.utcnow(),
    }

    db.tourists.insert_one(new_tourist)

    return {
        "message": "Tourist registered successfully",
        "tourist_hash": tourist_hash
    }

# 🚨 SOS API
@app.post("/api/sos")
def trigger_sos(sos: SOSRequest):
    db = database.get_db()
    incident_id = database.get_next_sequence("incident_id")
    incident = {
        "id": incident_id,
        "tourist_hash": "UNKNOWN",
        "latitude": sos.latitude,
        "longitude": sos.longitude,
        "status": "PENDING",
        "created_at": datetime.utcnow(),
    }

    db.incidents.insert_one(incident)

    return {
        "status": "SOS Triggered",
        "incident_id": incident_id
    }

# 📍 Geo-fence check API
@app.post("/api/geofence/check")
def geofence_check(location: GeoFenceRequest):
    return check_geofence(location.latitude, location.longitude)
@app.post("/api/ai/risk")
def evaluate_risk(data: RiskRequest):
    return calculate_risk(
        data.latitude,
        data.longitude,
        data.restricted_zone,
        data.sos_triggered
    )
@app.post("/api/admin/login")
def admin_login(data: dict):
    # Hardcoded admin for college demo
    if data.get("username") == "admin" and data.get("password") == "admin123":
        return {"message": "Admin login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")
@app.get("/api/admin/tourists")
def get_all_tourists():
    db = database.get_db()
    tourists = list(db.tourists.find())
    for tourist in tourists:
        tourist.pop("_id", None)
    return jsonable_encoder(tourists)
@app.get("/api/admin/incidents")
def get_all_incidents():
    db = database.get_db()
    incidents = list(db.incidents.find())
    for incident in incidents:
        incident.pop("_id", None)
    return jsonable_encoder(incidents)
@app.put("/api/admin/incidents/{incident_id}")
def update_incident_status(incident_id: int, status: str):
    db = database.get_db()
    incident = db.incidents.find_one({"id": incident_id})

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    db.incidents.update_one({"id": incident_id}, {"$set": {"status": status}})
    return {"message": "Incident status updated"}
