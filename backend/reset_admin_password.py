"""
Reset superadmin password to fix bcrypt issue
"""
import database
from auth import hash_password, verify_password

def reset_password():
    db = database.get_db()
    
    # Delete existing superadmin
    result = db.admins.delete_many({"username": "superadmin"})
    print(f"Deleted {result.deleted_count} existing superadmin account(s)")
    
    # Create fresh superadmin with properly hashed password
    from datetime import datetime
    
    admin_id = database.get_next_sequence("admin_id")
    password = "admin123"
    hashed_password = hash_password(password)
    
    print(f"Generated hash: {hashed_password[:30]}...")
    
    super_admin = {
        "id": admin_id,
        "username": "superadmin",
        "email": "admin@safetysaas.com",
        "password": hashed_password,
        "full_name": "Super Administrator",
        "role": "super_admin",
        "organization_id": None,
        "created_at": datetime.now(datetime.UTC) if hasattr(datetime, 'UTC') else datetime.utcnow(),
    }
    
    db.admins.insert_one(super_admin)
    print("✅ Superadmin account created successfully")
    
    # Verify the password works
    admin = db.admins.find_one({"username": "superadmin"})
    if verify_password(password, admin["password"]):
        print(f"✅ Password verification successful")
    else:
        print(f"❌ Password verification failed")
    
    print("\n📝 Login credentials:")
    print("   Username: superadmin")
    print("   Password: admin123")

if __name__ == "__main__":
    reset_password()
