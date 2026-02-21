"""
Simple password reset using pure bcrypt
"""
import pymongo
import bcrypt
from datetime import datetime

# Connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["smart_tourist_safety"]

# Delete all existing admins
result = db.admins.delete_many({"username": "superadmin"})
print(f"Deleted {result.deleted_count} admin(s)")

# Create new password hash
password = "admin123"
password_bytes = password.encode('utf-8')
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password_bytes, salt)
hashed_str = hashed.decode('utf-8')

print(f"Generated hash: {hashed_str}")

# Get next ID
counter = db.counters.find_one_and_update(
    {"_id": "admin_id"},
    {"$inc": {"seq": 1}},
    upsert=True,
    return_document=pymongo.ReturnDocument.AFTER
)
admin_id = counter["seq"]

# Create admin
admin = {
    "id": admin_id,
    "username": "superadmin",
    "email": "admin@safetysaas.com",
    "password": hashed_str,
    "full_name": "Super Administrator",
    "role": "super_admin",
    "organization_id": None,
    "created_at": datetime.utcnow(),
}

db.admins.insert_one(admin)
print("✅ Admin created")

# Verify it works
test_password = "admin123"
stored_hash = db.admins.find_one({"username": "superadmin"})["password"]
result = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
print(f"✅ Verification test: {result}")

print("\n📝 Login with:")
print("   Username: superadmin")
print("   Password: admin123")
