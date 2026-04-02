from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from typing import Optional
from .base import AuditableBase

class Conversation(AuditableBase):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    waka_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("wakas.id"), nullable=True)
    
    employer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    runner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    is_pinned_by_employer: Mapped[bool] = mapped_column(default=False)
    is_pinned_by_runner: Mapped[bool] = mapped_column(default=False)
    
    last_message_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_message_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)

    messages: Mapped[list["Message"]] = relationship("Message", back_populates="conversation")

class Message(AuditableBase):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id"))
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    content_text: Mapped[Optional[str]] = mapped_column(String(1500), nullable=True)
    attachment_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    
    is_delivered: Mapped[bool] = mapped_column(default=False)
    is_read: Mapped[bool] = mapped_column(default=False)
    read_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    is_deleted_by_sender: Mapped[bool] = mapped_column(default=False)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
