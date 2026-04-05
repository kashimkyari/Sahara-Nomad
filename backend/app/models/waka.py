from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Numeric, ForeignKey, Text, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography
import uuid
from typing import Optional, TYPE_CHECKING
from .base import AuditableBase

if TYPE_CHECKING:
    from .user import User

class Waka(AuditableBase):
    __tablename__ = "wakas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    runner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    category: Mapped[str] = mapped_column(String(50)) # package, market, food, custom
    item_description: Mapped[str] = mapped_column(Text)
    
    pickup_address: Mapped[str] = mapped_column(String(512))
    pickup_location: Mapped[Optional[Geography]] = mapped_column(Geography(geometry_type='POINT', srid=4326), nullable=True)
    
    dropoff_address: Mapped[str] = mapped_column(String(512))
    dropoff_location: Mapped[Optional[Geography]] = mapped_column(Geography(geometry_type='POINT', srid=4326), nullable=True)
    
    urgency: Mapped[str] = mapped_column(String(20)) # standard, flash
    
    runner_fee: Mapped[float] = mapped_column(Numeric(12, 2))
    flash_incentive: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    total_price: Mapped[float] = mapped_column(Numeric(12, 2))
    
    step: Mapped[int] = mapped_column(Integer, default=1) # 1:Finding, 2:EnRoute, 3:Sourcing, 4:Delivering, 5:Completed
    status: Mapped[Optional[str]] = mapped_column(String(50), default="finding_runner", nullable=True)
    
    # Sourcing / Payment Details
    items: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True) # Bullet point list of items
    sourcing_budget: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True) # Cost of items
    sourcing_status: Mapped[Optional[str]] = mapped_column(String(20), default="pending", nullable=True) # pending, approved, rejected
    budget_min: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    budget_max: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    
    sourcing_bank_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sourcing_account_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sourcing_account_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_sourcing_funded: Mapped[bool] = mapped_column(Boolean, server_default='false', default=False, nullable=False)
    
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_by_runner: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_by_employer: Mapped[bool] = mapped_column(Boolean, default=False)

    payment_method: Mapped[str] = mapped_column(String(20), server_default='wallet', default='wallet', nullable=False) # wallet, cash
    insurance_opt_in: Mapped[bool] = mapped_column(Boolean, server_default='false', default=False, nullable=False)
    pod_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True) # Proof of Delivery Image URL

    # Relationships
    employer: Mapped["User"] = relationship("User", foreign_keys=[employer_id])
    runner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[runner_id])

class WakaDecline(AuditableBase):
    __tablename__ = "waka_declines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    waka_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("wakas.id"))
    runner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))

class WakaDispute(AuditableBase):
    __tablename__ = "waka_disputes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    waka_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("wakas.id"))
    creator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    reason: Mapped[str] = mapped_column(String(50)) # payment, items, behavior, other
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open") # open, investigating, resolved, closed
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    waka: Mapped["Waka"] = relationship("Waka")
    creator: Mapped["User"] = relationship("User", foreign_keys=[creator_id])
