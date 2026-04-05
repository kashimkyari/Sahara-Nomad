from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional
from datetime import datetime

class ScheduledWakaBase(BaseModel):
    title: str
    frequency: str # daily, weekly, monthly, custom
    waka_template: dict
    next_run: datetime
    is_active: bool = True

class ScheduledWakaCreate(ScheduledWakaBase):
    pass

class ScheduledWakaUpdate(BaseModel):
    title: Optional[str] = None
    frequency: Optional[str] = None
    waka_template: Optional[dict] = None
    next_run: Optional[datetime] = None
    is_active: Optional[bool] = None

class ScheduledWakaResponse(ScheduledWakaBase):
    id: UUID
    employer_id: UUID
    last_run: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
