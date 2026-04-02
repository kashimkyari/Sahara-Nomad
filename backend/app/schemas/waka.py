from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List
from datetime import datetime

class LocationSchema(BaseModel):
    address: str
    lat: float
    lng: float

class WakaCreate(BaseModel):
    category: str # package | market | food | custom
    item_description: str
    pickup: LocationSchema
    dropoff: LocationSchema
    urgency: str # standard | flash
    base_fee: float
    flash_incentive: float = 0
    total_price: float

class WakaResponse(BaseModel):
    id: UUID
    employer_id: UUID
    runner_id: Optional[UUID] = None
    category: str
    item_description: str
    pickup_address: str
    dropoff_address: str
    urgency: str
    runner_fee: float
    flash_incentive: float
    total_price: float
    step: int
    status: str
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
