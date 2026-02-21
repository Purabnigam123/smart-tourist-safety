"""
Test admin login directly
"""
import database
from auth import verify_password, create_access_token

def test_login():
    db = database.get_db()
    
    username = "superadmin"
    password = "admin123"
    
    print(f"Testing login for: {username}")
    
    # Find admin
    admin = db.admins.find_one({"username": username})
    if not admin:
        print("❌ Admin not found")
        return
    
    print(f"✅ Admin found: {admin.get('username')}")
    print(f"   ID: {admin.get('id')}")
    print(f"   Role: {admin.get('role')}")
    print(f"   Org ID: {admin.get('organization_id')}")
    
    # Verify password
    if not verify_password(password, admin["password"]):
        print("❌ Password verification failed")
        return
    
    print("✅ Password verified")
    
    # Try to create token
    try:
        access_token = create_access_token({
            "sub": str(admin["id"]),
            "username": admin["username"],
            "user_type": "admin",
            "role": admin["role"],
            "org_id": admin.get("organization_id")
        })
        print(f"✅ Token created successfully")
        print(f"   Token: {access_token[:50]}...")
    except Exception as e:
        print(f"❌ Token creation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_login()
