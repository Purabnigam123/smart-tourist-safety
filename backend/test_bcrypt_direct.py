"""
Test password verification with new bcrypt-direct approach
"""
import database
import bcrypt

def test_verify():
    db = database.get_db()
    
    admin = db.admins.find_one({"username": "superadmin"})
    if not admin:
        print("❌ Admin not found")
        return
    
    password = "admin123"
    stored_hash = admin["password"]
    
    print(f"Testing password: '{password}'")
    print(f"Stored hash: {stored_hash[:30]}...")
    
    try:
        result = bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        print(f"✅ Verification result: {result}")
    except Exception as e:
        print(f"❌ Verification error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_verify()
