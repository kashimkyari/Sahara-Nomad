from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast
from geoalchemy2 import Geography
from ...database import get_db
from ...models.user import User
from ...models.search import SearchHistory
from ...models.waka import Waka
from ...schemas.search import SearchResponse, RunnerSearchResponse, SearchRecord
from .deps import get_current_user
from typing import List
from datetime import datetime, timedelta

from ...services.market_service import MarketService

router = APIRouter()

@router.post("/record")
async def record_search(
    record: SearchRecord,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a search query to history."""
    history = SearchHistory(
        user_id=current_user.id,
        query=record.query.strip().lower(),
        city=current_user.city
    )
    db.add(history)
    await db.commit()
    return {"status": "ok"}

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
        User, 
        func.ST_Distance(func.cast(User.last_location, Geography), func.cast(user_location, Geography)).label("distance_m"),
        active_waka_sq.label("active_wakas")
    ).where(User.is_runner == True, User.is_user_deleted == False)
    
    if q:
        stmt = stmt.where(User.full_name.ilike(f"%{q}%"))
        
    if filter == "available_now":
        stmt = stmt.where(User.is_online == True)
    elif filter == "5_star":
        stmt = stmt.where(User.stats_rating >= 4.8)
    elif filter == "nearby":
        stmt = stmt.order_by("distance_m")
        
    # Get dynamic markets for user's city
    city = current_user.city
    markets = MarketService.get_popular_markets(city)
    
    # Get real trending searches for the city (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    trending_stmt = (
        select(SearchHistory.query, func.count(SearchHistory.id).label("count"))
        .where(SearchHistory.city == city, SearchHistory.created_at >= seven_days_ago)
        .group_by(SearchHistory.query)
        .order_by(func.count(SearchHistory.id).desc())
        .limit(5)
    )
    trending_result = await db.execute(trending_stmt)
    trending_searches = [row[0] for row in trending_result.all()]
    
    # Fallback trending searches if none in city
    if not trending_searches:
        trending_searches = ["Food delivery", "Laundry", "Market run", "Groceries", "Pharmacy"]

    result = await db.execute(stmt)
    rows = result.all()
    
    runners = []
    for user, distance_m, active_wakas in rows:
        distance_km = round((distance_m or 0) / 1000.0, 1)
        img = user.avatar_url if user.avatar_url else f"https://i.pravatar.cc/150?u={user.id}"
        
        runners.append(RunnerSearchResponse(
            id=user.id,
            name=user.full_name,
            rating=float(user.stats_rating),
            distance_km=distance_km,
            is_online=user.is_online,
            image=img,
            active_waka_count=active_wakas or 0,
            hourly_rate=float(user.hourly_rate or 0),
            bio=user.bio
        ))
        
    return SearchResponse(
        runners=runners,
        trending_searches=trending_searches,
        markets=markets
    )
