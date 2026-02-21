"""
Debug the password verification issue
"""
import database
from auth import verify_password
import sys

def debug_password():
    db = database.get_db()
    
    admin = db.admins.find_one({"username": "superadmin"})
    if not admin:
        print("❌ Admin not found")
        return
    
    print(f"✅ Admin found: {admin.get('username')}")
    print(f"   Password hash: {admin.get('password')[:50]}...")
    print(f"   Hash length: {len(admin.get('password'))}")
    print(f"   Hash type: {type(admin.get('password'))}")
    
    password = "admin123"
    print(f"\nTesting password: '{password}'")
    print(f"Password length: {len(password)} bytes")
    
    # Test verification
    try:
        result = verify_password(password, admin["password"])
        print(f"✅ Verification successful: {result}")
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Also test with wrong password
    print(f"\nTesting wrong password...")
    try:
        result = verify_password("wrongpassword", admin["password"])
        print(f"Result: {result}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_password()
