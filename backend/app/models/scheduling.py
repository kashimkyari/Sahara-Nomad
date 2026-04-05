from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Text, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from typing import Optional
from .base import AuditableBase

class ScheduledWaka(AuditableBase):
    __tablename__ = "scheduled_wakas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    title: Mapped[str] = mapped_column(String(255))
    frequency: Mapped[str] = mapped_column(String(50)) # daily, weekly, monthly, custom
    
    # Template data identical to WakaCreate schema
    waka_template: Mapped[dict] = mapped_column(JSON)
    
    next_run: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_run: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(default=True)

    employer: Mapped["User"] = relationship("User")
