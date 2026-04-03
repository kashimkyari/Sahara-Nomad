from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ReviewBase(BaseModel):
    rating: int
    comment: str

class ReviewCreate(ReviewBase):
    waka_id: UUID

class ReviewResponse(ReviewBase):
    id: UUID
    reviewer_id: UUID
    waka_id: UUID
    reviewer_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
