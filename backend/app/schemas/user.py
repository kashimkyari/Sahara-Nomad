from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID
from typing import Optional, List
from datetime import datetime
from .review import ReviewResponse

class UserBase(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[EmailStr] = None

class UserInfo(BaseModel):
    id: UUID
    full_name: str
    avatar_url: Optional[str] = None
    is_online: bool = False
    
    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str
    referral_code: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    push_notifications_enabled: Optional[bool] = None
    location_services_enabled: Optional[bool] = None
    is_dark_mode: Optional[bool] = None
    language: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    is_online: Optional[bool] = None
    is_available: Optional[bool] = None
    equipment: Optional[dict] = None
    verification_status: Optional[str] = None
    verification_ref: Optional[str] = None
    expo_push_token: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RunnerProfileResponse(BaseModel):
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    stats_trips: int = 0
    stats_rating: float = 2.5
    active_wakas: int = 0
    is_online: bool = False
    is_available: bool = False
    equipment: Optional[dict] = None

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: UUID
    is_otp_verified: bool
    is_verified: bool
    is_runner: bool
    role: str
    loyalty_badge: Optional[str] = None
    referral_code: Optional[str] = None
    stats_rating: float = 2.5
    created_at: datetime
    avatar_url: Optional[str] = None
    push_notifications_enabled: bool
    location_services_enabled: bool
    is_dark_mode: bool
    is_online: bool = False
    is_available: bool = False
    verification_status: str = "unverified"
    verification_ref: Optional[str] = None
    language: str
    region: str
    city: Optional[str] = None
    spent_total: float = 0.0
    errands_count: int = 0
    wallet_balance: float = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    runner_profile: Optional[RunnerProfileResponse] = None
    reviews_received: List[ReviewResponse] = []

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    phone_number: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    type: Optional[str] = None

class TokenRefresh(BaseModel):
    refresh_token: str

class OTPVerify(BaseModel):
    phone_number: str
    otp_code: str

class RoleUpdate(BaseModel):
    role: str

class AdminUserResponse(BaseModel):
    id: UUID
    full_name: str
    phone_number: str
    email: Optional[EmailStr] = None
    role: str
    is_runner: bool
    is_verified: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class RunnerApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    bvn: Optional[str]
    home_address: str
    transport_mode: str
    hourly_rate: Optional[float] = None
    verification_method: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserAddressCreate(BaseModel):
    label: str # Home, Office, etc.
    address: str
    lat: float
    lng: float
    is_default: bool = False

class UserAddressResponse(UserAddressCreate):
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
