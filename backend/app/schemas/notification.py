from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    body: str
    time: str
    type: str
    unread: bool
    linked_entity_id: Optional[str] = None
    linked_entity_type: Optional[str] = None
