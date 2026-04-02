from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast
from geoalchemy2 import Geography
from ...database import get_db
from ...models.user import RunnerProfile, User
from ...models.waka import Waka
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
    # Base query for runners
    user_location = current_user.last_location
    if not user_location:
         # Fallback to Lagos center if not set
         user_location = func.ST_SetSRID(func.ST_MakePoint(3.3792, 6.5244), 4326)

    # Subquery for active waka count
    active_waka_sq = (
        select(func.count(Waka.id))
        .where(Waka.runner_id == User.id, Waka.is_completed == False)
        .scalar_subquery()
    )

    stmt = select(
        RunnerProfile, 
        User, 
        func.ST_Distance(func.cast(RunnerProfile.current_location, Geography), func.cast(user_location, Geography)).label("distance_m"),
        active_waka_sq.label("active_wakas")
    ).join(User).where(RunnerProfile.is_deleted == False)
    
    if q:
        stmt = stmt.where(User.full_name.ilike(f"%{q}%"))
        
    if filter == "available_now":
        stmt = stmt.where(RunnerProfile.is_online == True)
    elif filter == "5_star":
        stmt = stmt.where(RunnerProfile.stats_rating >= 4.8)
    elif filter == "nearby":
        stmt = stmt.order_by("distance_m")
        
    # Get dynamic markets for user's city
    city = current_user.city
    markets = MarketService.get_popular_markets(city)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    runners = []
    for runner_profile, user, distance_m, active_wakas in rows:
        distance_km = round((distance_m or 0) / 1000.0, 1)
        img = user.avatar_url if user.avatar_url else f"https://i.pravatar.cc/150?u={user.id}"
        
        runners.append(RunnerSearchResponse(
            id=runner_profile.id,
            name=user.full_name,
            rating=float(runner_profile.stats_rating),
            distance_km=distance_km,
            is_online=runner_profile.is_online,
            image=img,
            active_waka_count=active_wakas or 0
        ))
        
    return SearchResponse(
        runners=runners,
        trending_searches=["Fresh Tomatoes", "Macbook charger", "Market Run"],
        markets=markets
    )
