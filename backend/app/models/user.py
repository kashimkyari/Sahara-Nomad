from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Numeric, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography
import uuid
from datetime import datetime
from typing import Optional
import enum
from .base import AuditableBase

class UserRole(str, enum.Enum):
    USER = "user"
    SUPPORT_ADMIN = "support_admin"
    SUPER_ADMIN = "super_admin"

class User(AuditableBase):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(255))
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    
    push_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    location_services_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_dark_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    language: Mapped[str] = mapped_column(String(10), default="en")
    region: Mapped[str] = mapped_column(String(10), default="NG")
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expo_push_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_location: Mapped[Optional[Geography]] = mapped_column(Geography(geometry_type='POINT', srid=4326), nullable=True)
    
    is_otp_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_runner: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[UserRole] = mapped_column(String(20), default=UserRole.USER)
    government_id_nin: Mapped[Optional[str]] = mapped_column(String(11), unique=True, nullable=True)
    loyalty_badge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    stats_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=5.0)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_user_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Referral System
    referral_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=True)
    referred_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Runner-specific fields (Unified)
    bio: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    stats_trips: Mapped[int] = mapped_column(Integer, default=0)
    errands_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Gamification & Milestones
    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    last_streak_update: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    platform_fee_discount: Mapped[float] = mapped_column(Numeric(4, 2), server_default="0.0") # e.g. 0.05 for 5% off

    otp_code: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    otp_expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Advanced Trust & Logistics (V2.5)
    equipment: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # e.g. {"motorcycle": true, "cooler_bag": true}
    verification_status: Mapped[str] = mapped_column(String(20), default="unverified") # unverified, pending, verified
    verification_ref: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    @property
    def runner_tier(self) -> str:
        if self.stats_trips >= 50: return "gold"
        if self.stats_trips >= 10: return "silver"
        return "bronze"

    # Relationships
    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="user", uselist=False)
    reviews_given: Mapped[list["Review"]] = relationship("Review", foreign_keys="[Review.reviewer_id]", back_populates="reviewer")
    reviews_received: Mapped[list["Review"]] = relationship("Review", foreign_keys="[Review.target_user_id]", back_populates="target_user")
    addresses: Mapped[list["UserAddress"]] = relationship("UserAddress", back_populates="user")
    bookmarks: Mapped[list["UserBookmark"]] = relationship("UserBookmark", foreign_keys="[UserBookmark.user_id]", back_populates="user")

class RunnerApplication(AuditableBase):
    """Tracks a user's request to become a runner. Admin sets status to 'approved' | 'rejected'."""
    __tablename__ = "runner_applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)

    # Collected during the application wizard
    bvn: Mapped[Optional[str]] = mapped_column(String(11), nullable=True)          # masked/hashed in prod
    home_address: Mapped[str] = mapped_column(String(512))
    transport_mode: Mapped[str] = mapped_column(String(50))                         # Motorcycle / Keke / Car / On Foot
    hourly_rate: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    verification_method: Mapped[str] = mapped_column(String(20), default="otp")    # otp | liveness

    # Admin workflow
    status: Mapped[str] = mapped_column(String(20), default="pending")              # pending | approved | rejected
    admin_note: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

class UserBookmark(AuditableBase):
    """Allows users to 'favorite' runners for quick access."""
    __tablename__ = "user_bookmarks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    target_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="bookmarks")
    target_user: Mapped["User"] = relationship("User", foreign_keys=[target_user_id])

class UserAddress(AuditableBase):
    """Commonly used addresses for errand creation."""
    __tablename__ = "user_addresses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    
    label: Mapped[str] = mapped_column(String(50)) # Home, Office, Gym, etc.
    address: Mapped[str] = mapped_column(String(512))
    lat: Mapped[float] = mapped_column(Numeric(12, 8))
    lng: Mapped[float] = mapped_column(Numeric(12, 8))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship("User", back_populates="addresses")
