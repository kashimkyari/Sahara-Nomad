from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional
from datetime import datetime

class InventoryItemBase(BaseModel):
    name: str
    price: float
    photo_url: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    waka_id: UUID

class InventoryItemUpdate(BaseModel):
    status: Optional[str] = None # approved, rejected
    is_ordered: Optional[bool] = None

class InventoryItemResponse(InventoryItemBase):
    id: UUID
    waka_id: UUID
    status: str
    is_ordered: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
