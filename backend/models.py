from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Tourist:
    id: int
    name: str
    govt_id: str
    phone: str
    emergency_contact: str
    tourist_hash: str
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Incident:
    id: int
    tourist_hash: str
    latitude: float
    longitude: float
    status: str = "PENDING"
    created_at: datetime = field(default_factory=datetime.utcnow)
