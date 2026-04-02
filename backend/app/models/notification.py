from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import Optional
from .base import AuditableBase

class InAppNotification(AuditableBase):
    __tablename__ = "in_app_notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(20)) # success, warning, info
    is_unread: Mapped[bool] = mapped_column(Boolean, default=True)
    
    linked_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    linked_entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # waka, transaction
