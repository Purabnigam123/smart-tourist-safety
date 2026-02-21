# Simple geo-fencing logic (no paid APIs)
import math

import database

RESTRICTED_ZONES = [
    {
        "name": "Restricted Forest Area",
        "lat_min": 27.100,
        "lat_max": 27.120,
        "lon_min": 93.600,
        "lon_max": 93.620
    }
]

# Demo circle-based zones shown on the tourist map
DEMO_ZONES = []

def _distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Haversine distance in meters
    r = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _load_circle_zones():
    db = database.get_db()
    db_zones = list(db.geofences.find())
    for z in db_zones:
        z.pop("_id", None)

    return db_zones


def check_geofence(lat: float, lon: float):
    # Legacy restricted rectangles
    for zone in RESTRICTED_ZONES:
        if (
            zone["lat_min"] <= lat <= zone["lat_max"]
            and zone["lon_min"] <= lon <= zone["lon_max"]
        ):
            return {
                "alert": True,
                "zone": zone["name"],
                "zone_type": "restricted",
                "risk_level": "high",
                "description": None,
                "rating": None,
            }

    # Circle zones from demo + database
    for zone in _load_circle_zones():
        zone_lat = zone.get("latitude")
        zone_lon = zone.get("longitude")
        radius = zone.get("radius")

        if zone_lat is None or zone_lon is None or radius is None:
            continue

        if _distance_meters(lat, lon, zone_lat, zone_lon) <= float(radius):
            zone_type = zone.get("zone_type", "safe")
            return {
                "alert": zone_type == "restricted",
                "zone": zone.get("name"),
                "zone_type": zone_type,
                "risk_level": zone.get("risk_level", "low"),
                "description": zone.get("description"),
                "rating": zone.get("rating"),
            }

    return {
        "alert": False,
        "zone": None,
        "zone_type": "safe",
        "risk_level": "low",
        "description": None,
        "rating": None,
    }
