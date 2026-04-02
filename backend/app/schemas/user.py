from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from .review import ReviewResponse

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
    is_dark_mode: Optional[bool] = None
    language: Optional[str] = None
    region: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None

class RunnerProfileResponse(BaseModel):
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    stats_trips: int = 0
    stats_rating: float = 5.0
    is_online: bool = False
    reviews: List[ReviewResponse] = []

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: UUID
    is_otp_verified: bool
    is_verified: bool
    loyalty_badge: Optional[str] = None
    stats_rating: float = 5.0
    created_at: datetime
    avatar_url: Optional[str] = None
    push_notifications_enabled: bool
    location_services_enabled: bool
    is_dark_mode: bool
    language: str
    region: str
    spent_total: float = 0.0
    errands_count: int = 0
    wallet_balance: float = 0.0
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
