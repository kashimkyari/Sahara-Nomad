from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class RunnerApplicationCreate(BaseModel):
    bvn: Optional[str] = None          # masked in transit; store hashed
    home_address: str
    transport_mode: str                 # Motorcycle | Keke Napep | Car | On Foot
    hourly_rate: Optional[float] = 3500.0
    verification_method: str = "otp"   # otp | liveness


class RunnerApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    home_address: str
    transport_mode: str
    hourly_rate: Optional[float] = None
    verification_method: str
    status: str                         # pending | approved | rejected
    admin_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RunnerApplicationAdminUpdate(BaseModel):
    status: str          # approved | rejected
    admin_note: Optional[str] = None
