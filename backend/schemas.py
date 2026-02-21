from pydantic import BaseModel, EmailStr, validator
from typing import Optional

# ============== AUTHENTICATION ==============

class TouristRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    govt_id: str
    phone: str
    emergency_contact: str
    organization_id: Optional[str] = "default"


class TouristLogin(BaseModel):
    email: EmailStr
    password: str


class AdminLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str  # "tourist" or "admin"
    name: str
    role: Optional[str] = None  # for admin: "super_admin" or "org_admin"


# ============== LEGACY (keep for compatibility) ==============

class TouristCreate(BaseModel):
    name: str
    govt_id: str
    phone: str
    emergency_contact: str


class TouristResponse(BaseModel):
    tourist_hash: str
    message: str


# ============== SOS & SAFETY ==============

class SOSRequest(BaseModel):
    latitude: float
    longitude: float
    message: str
    tourist_id: Optional[str] = None


class GeoFenceRequest(BaseModel):
    latitude: float
    longitude: float


class RiskRequest(BaseModel):
    latitude: float
    longitude: float
    restricted_zone: bool
    sos_triggered: bool = False


# ============== ADMIN ==============
class OrganizationCreate(BaseModel):
    name: str
    plan: str = "free"  # free, pro, enterprise
    contact_email: EmailStr


class AdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: str = "org_admin"  # org_admin or super_admin
    organization_id: Optional[str] = None
    
    @validator("role")
    def validate_role(cls, v):
        if v not in ["org_admin", "super_admin"]:
            raise ValueError("Role must be 'org_admin' or 'super_admin'")
        return v


class GeoFenceCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    radius_km: float  # in kilometers
    organization_id: str
    rating: int  # 0-100
    description: Optional[str] = None
    
    @validator("name")
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Zone name cannot be empty")
        if len(v) > 100:
            raise ValueError("Zone name cannot exceed 100 characters")
        return v.strip()
    
    @validator("radius_km")
    def validate_radius_km(cls, v):
        if v <= 0:
            raise ValueError("Radius must be greater than 0")
        if v > 100:
            raise ValueError("Radius cannot exceed 100 km")
        return v

    @validator("rating")
    def validate_rating(cls, v):
        if v < 0 or v > 100:
            raise ValueError("Rating must be between 0 and 100")
        return v

    @validator("description")
    def validate_description(cls, v):
        if v is None:
            return v
        if len(v.strip()) == 0:
            raise ValueError("Description cannot be empty")
        if len(v) > 500:
            raise ValueError("Description cannot exceed 500 characters")
        return v.strip()
    
    @validator("latitude")
    def validate_latitude(cls, v):
        if v < -90 or v > 90:
            raise ValueError("Latitude must be between -90 and 90")
        return v
    
    @validator("longitude")
    def validate_longitude(cls, v):
        if v < -180 or v > 180:
            raise ValueError("Longitude must be between -180 and 180")
        return v
