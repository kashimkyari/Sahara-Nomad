from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import Optional
from .base import AuditableBase

class WakaInventoryItem(AuditableBase):
    __tablename__ = "waka_inventory_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    waka_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("wakas.id"))
    
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[float] = mapped_column(Numeric(12, 2))
    photo_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    
    status: Mapped[str] = mapped_column(String(20), default="proposed") # proposed, approved, rejected
    is_ordered: Mapped[bool] = mapped_column(Boolean, default=False)

    waka: Mapped["Waka"] = relationship("Waka", back_populates="inventory_items")

# Add relationship to Waka model later
