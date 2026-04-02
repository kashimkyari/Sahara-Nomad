from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography
import uuid
from datetime import datetime
from typing import Optional
from .base import AuditableBase

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
    
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    government_id_nin: Mapped[Optional[str]] = mapped_column(String(11), unique=True, nullable=True)
    loyalty_badge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    otp_code: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    otp_expires_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationships
    runner_profile: Mapped[Optional["RunnerProfile"]] = relationship("RunnerProfile", back_populates="user", uselist=False)
    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="user", uselist=False)
    reviews_given: Mapped[list["Review"]] = relationship("Review", back_populates="reviewer")

class RunnerProfile(AuditableBase):
    __tablename__ = "runner_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    bio: Mapped[Optional[str]] = mapped_column(String)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Numeric(12, 2))
    is_online: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    
    current_location: Mapped[Optional[Geography]] = mapped_column(Geography(geometry_type='POINT', srid=4326), nullable=True)
    
    stats_trips: Mapped[int] = mapped_column(default=0)
    stats_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=5.0)

    user: Mapped["User"] = relationship("User", back_populates="runner_profile")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="runner")
