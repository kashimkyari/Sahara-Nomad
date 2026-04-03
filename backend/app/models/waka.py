from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Numeric, ForeignKey, Text, Integer
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
    
    step: Mapped[int] = mapped_column(Integer, default=1) # 1:Finding, 2:EnRoute, 3:Sourcing, 4:Delivered
    status: Mapped[Optional[str]] = mapped_column(String(50), default="finding_runner", nullable=True)
    
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    employer: Mapped["User"] = relationship("User", foreign_keys=[employer_id])
    runner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[runner_id])
