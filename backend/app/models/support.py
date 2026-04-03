from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey, Text, DateTime, func, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import Optional
from .base import AuditableBase

class SupportTicket(AuditableBase):
    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active") # active, resolved, closed
    
    last_message_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_message_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)

    messages: Mapped[list["SupportMessage"]] = relationship("SupportMessage", back_populates="ticket", cascade="all, delete-orphan")
    user: Mapped["User"] = relationship("User")

class SupportMessage(AuditableBase):
    __tablename__ = "support_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("support_tickets.id"))
    
    # If sender_id is NULL, it's from a Support Agent (System)
    sender_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    content_text: Mapped[str] = mapped_column(Text)
    attachment_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    attachment_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    is_deleted: Mapped[bool] = mapped_column(default=False)
    is_read: Mapped[bool] = mapped_column(default=False)
    read_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)

    ticket: Mapped["SupportTicket"] = relationship("SupportTicket", back_populates="messages")
