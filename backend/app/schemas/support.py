from pydantic import BaseModel, ConfigDict
from datetime import datetime
import uuid
from typing import Optional, List

class SupportMessageBase(BaseModel):
    content_text: str
    attachment_url: Optional[str] = None

class SupportMessageCreate(SupportMessageBase):
    ticket_id: uuid.UUID

class SupportMessageRead(SupportMessageBase):
    id: uuid.UUID
    sender_id: Optional[uuid.UUID] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SupportTicketBase(BaseModel):
    subject: Optional[str] = "Live Support Session"

class SupportTicketCreate(SupportTicketBase):
    pass

class SupportTicketRead(SupportTicketBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    last_message_text: Optional[str] = None
    last_message_at: Optional[datetime] = None
    created_at: datetime
    
    messages: Optional[List[SupportMessageRead]] = []
    
    model_config = ConfigDict(from_attributes=True)
