import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt

# JWT Configuration
SECRET_KEY = "your-secret-key-change-in-production-2026"  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def generate_tourist_hash(data: str):
    return hashlib.sha256(data.encode()).hexdigest()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using bcrypt"""
    try:
        if not isinstance(plain_password, str) or not isinstance(hashed_password, str):
            return False
        
        # Ensure password is not too long for bcrypt (max 72 bytes)
        plain_bytes = plain_password.encode('utf-8')
        if len(plain_bytes) > 72:
            plain_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
            plain_bytes = plain_password.encode('utf-8')
        
        hash_bytes = hashed_password.encode('utf-8')
        result = bcrypt.checkpw(plain_bytes, hash_bytes)
        return result
    except ValueError as e:
        if "password cannot be longer than 72 bytes" in str(e):
            return False
        return False
    except Exception as e:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
