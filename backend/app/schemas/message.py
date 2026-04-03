from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from .user import UserInfo

class MessageBase(BaseModel):
    content_text: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_metadata: Optional[dict] = None

class MessageCreate(MessageBase):
    conversation_id: UUID

class MessageRead(MessageBase):
    id: UUID
    sender_id: UUID
    is_delivered: bool
    is_read: bool
    read_at: Optional[datetime] = None
    is_deleted: bool = False
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ConversationBase(BaseModel):
    waka_id: Optional[UUID] = None
    employer_id: UUID
    runner_id: UUID

class ConversationCreate(ConversationBase):
    pass

class ConversationRead(ConversationBase):
    id: UUID
    last_message_text: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    other_user: Optional[UserInfo] = None
    is_pinned: bool = False
    last_message_status: Optional[str] = None # 'sent' or 'read'
    waka_title: Optional[str] = None
    waka_emoji: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class ConversationHistory(BaseModel):
    conversation: ConversationRead
    messages: list[MessageRead]
