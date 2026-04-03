from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional

class RunnerSearchResponse(BaseModel):
    id: UUID
    name: str
    rating: float
    distance_km: float
    is_online: bool
    image: str
    active_waka_count: int
    hourly_rate: float
    bio: Optional[str] = None
    stats_trips: int = 0
    loyalty_badge: Optional[str] = None

class SearchRecord(BaseModel):
    query: str

class SearchResponse(BaseModel):
    runners: List[RunnerSearchResponse]
    trending_searches: List[str]
    markets: List[str] = []
