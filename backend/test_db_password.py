import pymongo
import bcrypt

client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['smart_tourist_safety']
admin = db.admins.find_one({'username': 'superadmin'})

print(f"User: {admin['username']}")
print(f"Hash: {admin['password']}")
print(f"Hash length: {len(admin['password'])}")

test_result = bcrypt.checkpw(b'admin123', admin['password'].encode('utf-8'))
print(f"Verify 'admin123': {test_result}")

# Try with wrong password
test_wrong = bcrypt.checkpw(b'wrongpass', admin['password'].encode('utf-8'))
print(f"Verify 'wrongpass': {test_wrong}")
