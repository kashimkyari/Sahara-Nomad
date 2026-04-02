from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    push_notifications_enabled: Optional[bool] = None
    location_services_enabled: Optional[bool] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None

class RunnerProfileResponse(BaseModel):
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    stats_trips: int = 0
    stats_rating: float = 5.0
    is_online: bool = False

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: UUID
    is_verified: bool
    loyalty_badge: Optional[str] = None
    created_at: datetime
    runner_profile: Optional[RunnerProfileResponse] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    phone_number: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID] = None

class OTPVerify(BaseModel):
    phone_number: str
    otp_code: str
