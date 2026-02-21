"""
Check the actual stored password hash
"""
import database

def check_hash():
    db = database.get_db()
    
    admin = db.admins.find_one({"username": "superadmin"})
    if not admin:
        print("❌ Admin not found")
        return
    
    stored_hash = admin.get("password")
    print(f"Password hash: {stored_hash}")
    print(f"Hash length: {len(stored_hash)} characters")
    print(f"Hash type: {type(stored_hash)}")
    print(f"Hash bytes: {len(stored_hash.encode('utf-8'))} bytes")
    
    # Check if it looks like a valid bcrypt hash
    if stored_hash.startswith("$2b$") or stored_hash.startswith("$2a$"):
        print("✅ Looks like a valid bcrypt hash")
    else:
        print(f"❌ Doesn't look like a standard bcrypt hash")
        print(f"   Hash prefix: {stored_hash[:10]}")

if __name__ == "__main__":
    check_hash()
