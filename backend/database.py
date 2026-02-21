import os
from pymongo import MongoClient, ReturnDocument
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "smart_tourist_safety")

try:
    _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Validate connection
    _client.admin.command('ping')
    _db = _client[MONGODB_DB]
    print("✅ MongoDB connected successfully")
except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    print(f"❌ MongoDB connection failed: {e}")
    raise


def get_db():
    """Get database instance with connection validation"""
    try:
        _client.admin.command('ping')
    except Exception as e:
        print(f"❌ Database connection lost: {e}")
        raise
    return _db


def get_collection(name: str):
    return _db[name]


def get_next_sequence(name: str) -> int:
    counters = _db["counters"]
    doc = counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(doc["seq"])
