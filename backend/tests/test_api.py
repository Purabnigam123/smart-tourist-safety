import mongomock
import pytest
from fastapi.testclient import TestClient
from pymongo import ReturnDocument
import database
from main import app
from auth import hash_password


# --------------- fixtures ---------------

@pytest.fixture()
def client():
    mock_client = mongomock.MongoClient()
    test_db = mock_client["test_db"]

    def get_test_db():
        return test_db

    def get_test_sequence(name: str) -> int:
        counters = test_db["counters"]
        doc = counters.find_one_and_update(
            {"_id": name},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return int(doc["seq"])

    database.get_db = get_test_db
    database.get_next_sequence = get_test_sequence

    # Seed a super-admin so admin-protected routes can be tested
    test_db.admins.insert_one({
        "id": 1,
        "username": "superadmin",
        "email": "admin@test.com",
        "password": hash_password("admin123"),
        "full_name": "Super Admin",
        "role": "super_admin",
        "organization_id": None,
    })

    return TestClient(app)


def _register_tourist(client, email="tourist@test.com"):
    """Helper: register a tourist and return (response_json, token)."""
    payload = {
        "name": "Test User",
        "email": email,
        "password": "password123",
        "govt_id": "ID12345",
        "phone": "9999999999",
        "emergency_contact": "8888888888",
    }
    res = client.post("/api/auth/tourist/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    return data, data["access_token"]


def _admin_token(client):
    """Helper: login as superadmin and return the JWT token."""
    res = client.post(
        "/api/auth/admin/login",
        json={"username": "superadmin", "password": "admin123"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# --------------- tests ---------------

def test_register_tourist(client):
    data, token = _register_tourist(client)
    assert "access_token" in data
    assert data["user_type"] == "tourist"
    assert data["name"] == "Test User"


def test_tourist_login(client):
    _register_tourist(client, email="login@test.com")

    res = client.post(
        "/api/auth/tourist/login",
        json={"email": "login@test.com", "password": "password123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user_type"] == "tourist"
    assert "access_token" in data


def test_tourist_login_wrong_password(client):
    _register_tourist(client, email="wrong@test.com")

    res = client.post(
        "/api/auth/tourist/login",
        json={"email": "wrong@test.com", "password": "wrongpass"},
    )
    assert res.status_code == 401


def test_admin_login(client):
    token = _admin_token(client)
    assert token


def test_geofence_and_risk(client):
    gf = client.post(
        "/api/geofence/check", json={"latitude": 12.0, "longitude": 77.0}
    )
    assert gf.status_code == 200
    gf_data = gf.json()

    risk = client.post(
        "/api/ai/risk",
        json={
            "latitude": 12.0,
            "longitude": 77.0,
            "restricted_zone": gf_data.get("alert", False),
            "sos_triggered": False,
        },
    )
    assert risk.status_code == 200
    risk_data = risk.json()
    assert "risk_level" in risk_data
    assert "risk_score" in risk_data


def test_sos_requires_auth(client):
    """SOS endpoint should reject unauthenticated requests."""
    res = client.post(
        "/api/tourist/sos",
        json={
            "latitude": 12.9716,
            "longitude": 77.5946,
            "message": "SOS without token",
        },
    )
    assert res.status_code == 401


def test_sos_and_admin_incident_flow(client):
    # Register tourist & get token
    _, tourist_token = _register_tourist(client, email="sos@test.com")
    admin_token = _admin_token(client)

    # Trigger SOS (authenticated)
    res = client.post(
        "/api/tourist/sos",
        json={
            "latitude": 12.9716,
            "longitude": 77.5946,
            "message": "Emergency SOS from Tourist Dashboard",
        },
        headers=_auth_header(tourist_token),
    )
    assert res.status_code == 200
    incident_id = res.json()["incident_id"]

    # Admin fetches SOS alerts
    alerts = client.get(
        "/api/admin/sos-alerts", headers=_auth_header(admin_token)
    )
    assert alerts.status_code == 200
    assert any(item["id"] == incident_id for item in alerts.json())

    # Admin resolves the alert
    update = client.put(
        f"/api/admin/sos-alerts/{incident_id}",
        params={"status": "RESOLVED"},
        headers=_auth_header(admin_token),
    )
    assert update.status_code == 200


def test_admin_tourists(client):
    _register_tourist(client, email="listed@test.com")
    admin_token = _admin_token(client)

    res = client.get(
        "/api/admin/tourists", headers=_auth_header(admin_token)
    )
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_admin_stats(client):
    admin_token = _admin_token(client)

    res = client.get(
        "/api/admin/stats", headers=_auth_header(admin_token)
    )
    assert res.status_code == 200
    data = res.json()
    assert "total_tourists" in data
    assert "active_sos_alerts" in data


def test_admin_audit_logs(client):
    # Register a tourist to generate an audit log entry
    _register_tourist(client, email="audit@test.com")
    admin_token = _admin_token(client)

    res = client.get(
        "/api/admin/audit-logs", headers=_auth_header(admin_token)
    )
    assert res.status_code == 200
    assert len(res.json()) >= 1
