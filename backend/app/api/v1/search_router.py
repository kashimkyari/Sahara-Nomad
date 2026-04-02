from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ...database import get_db
from ...models.user import RunnerProfile, User
from ...schemas.search import SearchResponse, RunnerSearchResponse
from .deps import get_current_user
from typing import List

from ...services.market_service import MarketService

router = APIRouter()

@router.get("/runners", response_model=SearchResponse)
async def search_runners(
    q: str = None,
    filter: str = "available_now",
    market: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Base query for runners who are online and NOT deleted
    stmt = select(RunnerProfile, User).join(User).where(
        RunnerProfile.is_deleted == False,
        User.is_deleted == False
    )
    
    if filter == "available_now":
        stmt = stmt.where(RunnerProfile.is_online == True)
    elif filter == "5_star":
        stmt = stmt.where(RunnerProfile.stats_rating >= 4.8)
        
    # Get dynamic markets for user's city
    city = current_user.city
    markets = MarketService.get_popular_markets(city)
    
    # In a real PostGIS app, we would use ST_Distance or ST_DWithin here
    # Example: .where(func.ST_DWithin(RunnerProfile.current_location, user_location, 5000))

    result = await db.execute(stmt)
    rows = result.all()
    
    runners = []
    for runner_profile, user in rows:
        runners.append(RunnerSearchResponse(
            id=runner_profile.id,
            name=user.full_name,
            rating=float(runner_profile.stats_rating),
            distance_km=0.8, # Mock distance for now
            is_online=runner_profile.is_online,
            image=f"https://i.pravatar.cc/150?u={runner_profile.id}",
            active_waka_count=0
        ))
        
    return SearchResponse(
        runners=runners,
        trending_searches=["Fresh Tomatoes", "Macbook charger", "Market Run"],
        markets=markets
    )
