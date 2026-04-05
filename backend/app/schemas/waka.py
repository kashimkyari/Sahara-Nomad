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
    target_runner_id: Optional[UUID] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    items: Optional[list[str]] = None
    payment_method: str = "wallet" # wallet, cash

class WakaSourcingRequest(BaseModel):
    sourcing_budget: float
    bank_name: str
    account_number: str
    account_name: str

class SourcingRejection(BaseModel):
    item_list: Optional[list[str]] = None

class WakaUser(BaseModel):
    id: UUID
    full_name: str
    avatar_url: Optional[str] = None
    phone_number: Optional[str] = None
    is_runner: bool = False
    stats_rating: float = 5.0

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
    completed_by_runner: bool
    completed_by_employer: bool
    
    # Sourcing Details
    sourcing_budget: Optional[float] = None
    sourcing_bank_name: Optional[str] = None
    sourcing_account_number: Optional[str] = None
    sourcing_account_name: Optional[str] = None
    is_sourcing_funded: bool = False
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    items: Optional[list[str]] = None
    sourcing_status: Optional[str] = "pending"
    
    has_employer_reviewed: bool = False
    has_runner_reviewed: bool = False
    payment_method: str = "wallet"
    created_at: datetime
    
    employer: Optional[WakaUser] = None
    runner: Optional[WakaUser] = None

    class Config:
        from_attributes = True
