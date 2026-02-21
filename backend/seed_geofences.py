"""Seed demo Delhi geofences into MongoDB (idempotent)."""
from datetime import datetime, timezone
import random

import database
from geofence import DEMO_ZONES

DELHI_LAT_MIN = 28.40
DELHI_LAT_MAX = 28.90
DELHI_LON_MIN = 76.80
DELHI_LON_MAX = 77.35

RANDOM_ZONE_COUNT = 100
RANDOM_SEED = None
RANDOM_PREFIXES = ["Delhi Random Zone", "Delhi Cluster Zone"]

CLUSTER_CENTERS = [
    ("Central Delhi", 28.6315, 77.2167),
    ("Old Delhi", 28.6562, 77.2410),
    ("South Delhi", 28.5494, 77.2383),
    ("South East", 28.6046, 77.3058),
    ("West Delhi", 28.6304, 77.0855),
    ("North Delhi", 28.7334, 77.1213),
    ("North West", 28.8460, 77.0890),
    ("East Delhi", 28.6807, 77.3201),
]


def _rating_for_zone(zone_type: str, risk_level: str | None) -> int:
    if zone_type == "safe" or risk_level == "low":
        return 20
    if zone_type == "caution" or risk_level == "medium":
        return 55
    return 85


def _random_zone_type(rng: random.Random) -> tuple[str, str]:
    roll = rng.random()
    if roll < 0.55:
        return "safe", "low"
    if roll < 0.85:
        return "caution", "medium"
    return "restricted", "high"


def _random_description(zone_type: str) -> str:
    if zone_type == "safe":
        return "Regular patrols and active foot traffic. Generally safe during most hours."
    if zone_type == "caution":
        return "Crowd density can vary; stay alert and keep belongings secure."
    return "Low visibility or limited access. Avoid during late hours and stay on main routes."


def _generate_random_zones() -> list[dict]:
    rng = random.Random()
    if RANDOM_SEED is not None:
        rng.seed(RANDOM_SEED)

    zones = []
    cluster_count = len(CLUSTER_CENTERS)
    per_cluster = max(1, RANDOM_ZONE_COUNT // cluster_count)
    total = 0

    for cluster_name, center_lat, center_lon in CLUSTER_CENTERS:
        for idx in range(1, per_cluster + 1):
            lat = rng.gauss(center_lat, 0.035)
            lon = rng.gauss(center_lon, 0.045)

            if lat < DELHI_LAT_MIN or lat > DELHI_LAT_MAX:
                lat = rng.uniform(DELHI_LAT_MIN, DELHI_LAT_MAX)
            if lon < DELHI_LON_MIN or lon > DELHI_LON_MAX:
                lon = rng.uniform(DELHI_LON_MIN, DELHI_LON_MAX)

            zone_type, risk_level = _random_zone_type(rng)
            radius = rng.uniform(250, 1400)
            total += 1

            zones.append(
                {
                    "name": f"Delhi Cluster Zone {cluster_name} {idx:02d}",
                    "latitude": round(lat, 5),
                    "longitude": round(lon, 5),
                    "radius": round(radius, 1),
                    "zone_type": zone_type,
                    "risk_level": risk_level,
                    "description": _random_description(zone_type),
                }
            )

    while total < RANDOM_ZONE_COUNT:
        lat = rng.uniform(DELHI_LAT_MIN, DELHI_LAT_MAX)
        lon = rng.uniform(DELHI_LON_MIN, DELHI_LON_MAX)
        zone_type, risk_level = _random_zone_type(rng)
        radius = rng.uniform(250, 1400)
        total += 1

        zones.append(
            {
                "name": f"Delhi Cluster Zone Extra {total:02d}",
                "latitude": round(lat, 5),
                "longitude": round(lon, 5),
                "radius": round(radius, 1),
                "zone_type": zone_type,
                "risk_level": risk_level,
                "description": _random_description(zone_type),
            }
        )

    return zones


def seed_geofences() -> dict:
    db = database.get_db()
    inserted = 0
    updated = 0

    for prefix in RANDOM_PREFIXES:
        db.geofences.delete_many({"name": {"$regex": f"^{prefix}"}})

    zones = DEMO_ZONES + _generate_random_zones()

    for zone in zones:
        name = zone.get("name")
        if not name:
            continue

        organization_id = zone.get("organization_id", "default")
        radius_meters = float(zone.get("radius", 0))
        if radius_meters <= 0:
            continue

        zone_type = zone.get("zone_type", "safe")
        risk_level = zone.get("risk_level", "low")
        rating = _rating_for_zone(zone_type, risk_level)

        payload = {
            "name": name,
            "latitude": zone.get("latitude"),
            "longitude": zone.get("longitude"),
            "radius": radius_meters,
            "organization_id": organization_id,
            "zone_type": zone_type,
            "risk_level": risk_level,
            "rating": rating,
            "description": zone.get("description"),
            "created_by": zone.get("created_by", "system"),
            "created_at": zone.get("created_at", datetime.now(timezone.utc)),
        }

        existing = db.geofences.find_one({"name": name, "organization_id": organization_id})
        if existing:
            db.geofences.update_one({"_id": existing["_id"]}, {"$set": payload})
            updated += 1
            continue

        payload["id"] = database.get_next_sequence("geofence_id")
        db.geofences.insert_one(payload)
        inserted += 1

    return {"inserted": inserted, "updated": updated}


if __name__ == "__main__":
    result = seed_geofences()
    print(f"Seed complete. Inserted: {result['inserted']}, Updated: {result['updated']}")
