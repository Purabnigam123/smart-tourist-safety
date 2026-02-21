"""
Verify and reset superadmin account
"""
import database
from auth import hash_password, verify_password
from datetime import datetime

def verify_admin():
    db = database.get_db()
    
    # Find superadmin
    admin = db.admins.find_one({"username": "superadmin"})
    
    if not admin:
        print("❌ Superadmin not found in database")
        print("Creating superadmin account...")
        
        admin_id = database.get_next_sequence("admin_id")
        super_admin = {
            "id": admin_id,
            "username": "superadmin",
            "email": "admin@safetysaas.com",
            "password": hash_password("admin123"),
            "full_name": "Super Administrator",
            "role": "super_admin",
            "organization_id": None,
            "created_at": datetime.utcnow(),
        }
        db.admins.insert_one(super_admin)
        print("✅ Superadmin account created")
        print("   Username: superadmin")
        print("   Password: admin123")
    else:
        print("✅ Superadmin found:")
        print(f"   ID: {admin.get('id')}")
        print(f"   Username: {admin.get('username')}")
        print(f"   Email: {admin.get('email')}")
        print(f"   Role: {admin.get('role')}")
        
        # Test password verification
        test_password = "admin123"
        if verify_password(test_password, admin.get("password")):
            print(f"✅ Password verification successful for '{test_password}'")
        else:
            print(f"❌ Password verification failed for '{test_password}'")
            print("   Resetting password to 'admin123'...")
            db.admins.update_one(
                {"username": "superadmin"},
                {"$set": {"password": hash_password("admin123")}}
            )
            print("✅ Password reset complete")
    
    print("\n📝 Login credentials:")
    print("   Username: superadmin")
    print("   Password: admin123")
    print("\n🌐 Admin login URL: http://localhost:5173/admin/login")

if __name__ == "__main__":
    verify_admin()
