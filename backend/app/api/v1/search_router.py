from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast
from geoalchemy2 import Geography
from ...database import get_db
from ...models.user import User, UserRole
from ...models.search import SearchHistory
from ...models.waka import Waka
from ...schemas.search import SearchResponse, RunnerSearchResponse, SearchRecord, LeaderboardResponse, LeaderboardItem
from ...schemas.waka import WakaResponse
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
    sort: str = None,
    motorcycle: bool = None,
    cooler_bag: bool = None,
    car: bool = None,
    keke: bool = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Base query for runners
    user_location = current_user.last_location
    if not user_location:
         # Fallback to Lagos center if not set
         user_location = func.ST_SetSRID(func.ST_MakePoint(3.3792, 6.5244), 4326)

    city = current_user.city

    # Subquery for active waka count
    active_waka_sq = (
        select(func.count(Waka.id))
        .where(Waka.runner_id == User.id, Waka.is_completed == False)
        .scalar_subquery()
    )

    # Subquery for completed waka count (trips)
    completed_waka_sq = (
        select(func.count(Waka.id))
        .where(Waka.runner_id == User.id, Waka.is_completed == True)
        .scalar_subquery()
    )

    stmt = select(
        User, 
        func.ST_Distance(func.cast(User.last_location, Geography), func.cast(user_location, Geography)).label("distance_m"),
        active_waka_sq.label("active_wakas"),
        completed_waka_sq.label("stats_trips_dynamic")
    ).where(
        User.id != current_user.id,
        User.is_runner == True, 
        User.role == UserRole.USER,
        User.is_user_deleted == False
    )
    
    if q:
        stmt = stmt.where(User.full_name.ilike(f"%{q}%"))
        
    if filter == "available_now":
        pass # All runners shown, but sorted by online Status
    elif filter == "5_star":
        stmt = stmt.where(User.stats_rating >= 4.8)
            
    # Advanced Runner Search (Equipment)
    if motorcycle:
        stmt = stmt.where(User.equipment["motorcycle"].as_boolean() == True)
    if cooler_bag:
        stmt = stmt.where(User.equipment["cooler_bag"].as_boolean() == True)
    if car:
        stmt = stmt.where(User.equipment["car"].as_boolean() == True)
    if keke:
        stmt = stmt.where(User.equipment["keke"].as_boolean() == True)
    
    # Sorting logic
    if sort == "rating":
        stmt = stmt.order_by(User.stats_rating.desc())
    elif sort == "distance":
        stmt = stmt.order_by("distance_m")
    elif sort == "price":
        stmt = stmt.order_by(User.hourly_rate.asc())
    elif sort == "trips":
        stmt = stmt.order_by(completed_waka_sq.desc())
    elif filter == "nearby":
        stmt = stmt.order_by("distance_m")
    else:
        # Default sort
        stmt = stmt.order_by(User.is_available.desc(), User.is_online.desc(), "distance_m")
        
    # Get dynamic markets for user's city
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
    for user, distance_m, active_wakas, stats_trips_dynamic in rows:
        distance_km = round((distance_m or 0) / 1000.0, 1)
        
        runners.append(RunnerSearchResponse(
            id=user.id,
            name=user.full_name,
            rating=float(user.stats_rating),
            distance_km=distance_km,
            is_online=user.is_online,
            avatar_url=user.avatar_url or f"/auth/users/{user.id}/avatar",
            active_waka_count=active_wakas or 0,
            hourly_rate=float(user.hourly_rate or 0),
            bio=user.bio,
            stats_trips=stats_trips_dynamic or 0,
            loyalty_badge=user.loyalty_badge,
            equipment=user.equipment,
            verification_status=user.verification_status
        ))
        
    return SearchResponse(
        runners=runners,
        trending_searches=trending_searches,
        markets=markets
    )

@router.get("/heatmap")
async def get_runner_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregate runner and destination locations for demand visualization."""
    # 1. Current Runner Locations (Online runners)
    runners_stmt = select(func.ST_AsGeoJSON(User.last_location)).where(
        User.is_runner == True,
        User.is_online == True,
        User.last_location != None
    )
    runners_res = await db.execute(runners_stmt)
    runner_points = [row[0] for row in runners_res.all()]

    # 2. Active Destination Clusters (Pending/Active Wakas)
    waka_stmt = select(func.ST_AsGeoJSON(Waka.dropoff_location)).where(
        Waka.is_completed == False,
        Waka.status != 'cancelled',
        Waka.dropoff_location != None
    )
    waka_res = await db.execute(waka_stmt)
    destination_points = [row[0] for row in waka_res.all()]

    return {
        "runners": runner_points,
        "demand": destination_points,
        "resolution": "high",
        "description": "Corridors with high demand and low runner density are highlighted."
    }

@router.get("/batching-suggestions")
async def get_batching_suggestions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Suggest nearby errand batches for runners to maximize earnings."""
    if not current_user.is_runner:
        return []

    # Find available wakas using postgis ST_ClusterDBSCAN
    # 30km distance = 30000 meters for geography
    # Using a subquery to cluster available wakas
    cluster_sq = (
        select(
            Waka.id,
            func.ST_ClusterDBSCAN(func.cast(Waka.pickup_location, Geography), eps=30000, minpoints=2).over().label("cluster_id")
        )
        .where(
            Waka.status == 'finding_runner',
            Waka.runner_id == None,
            Waka.pickup_location != None
        )
        .subquery()
    )

    stmt = (
        select(Waka, cluster_sq.c.cluster_id)
        .join(cluster_sq, Waka.id == cluster_sq.c.id)
        .where(cluster_sq.c.cluster_id != None)
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    batches = []
    grouped = {}
    for w, c_id in rows:
        if c_id not in grouped: grouped[c_id] = []
        grouped[c_id].append(w)
    
    for c_id, wakas in grouped.items():
        if len(wakas) >= 2:
            batches.append({
                "id": str(uuid.uuid4()),
                "area": wakas[0].pickup_address.split(',')[0],
                "count": len(wakas),
                "total_reward": sum(w.runner_fee for w in wakas),
                "waka_ids": [str(w.id) for w in wakas],
                "efficiency_bonus": round(sum(w.runner_fee for w in wakas) * 0.05, 2)
            })

    return batches

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Top 50 runners in the user's city ranked by rating and trip count."""
    city = current_user.city or "Lagos"
    
    stmt = (
        select(User)
        .where(
            User.is_runner == True,
            User.city == city,
            User.is_user_deleted == False
        )
        .order_by(User.stats_rating.desc(), User.stats_trips.desc())
        .limit(50)
    )
    
    result = await db.execute(stmt)
    runners = result.scalars().all()
    
    top_runners = []
    for i, runner in enumerate(runners):
        top_runners.append(LeaderboardItem(
            id=runner.id,
            name=runner.full_name,
            avatar_url=runner.avatar_url or f"/auth/users/{runner.id}/avatar",
            rating=float(runner.stats_rating),
            stats_trips=runner.stats_trips,
            streak_count=runner.streak_count,
            rank=i + 1
        ))
        
    return LeaderboardResponse(
        top_runners=top_runners,
        city=city
    )

@router.get("/shared-errands", response_model=List[WakaResponse])
async def get_shared_errands(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List online shared errands that have available spots near the user."""
    user_location = current_user.last_location
    
    stmt = (
        select(Waka)
        .where(
            Waka.is_shared == True,
            Waka.parent_waka_id == None,
            Waka.is_completed == False,
            Waka.status.notin_(['cancelled', 'completed'])
        )
    )

    if user_location:
         # Filter within 50km radius
         from geoalchemy2 import Geography
         stmt = stmt.where(
             func.ST_Distance(func.cast(Waka.pickup_location, Geography), func.cast(user_location, Geography)) <= 50000
         )
    
    result = await db.execute(stmt)
    parents = result.scalars().all()
    
    av_groups = []
    for p in parents:
        # Check current spots
        s_stmt = select(func.count(Waka.id)).where(Waka.parent_waka_id == p.id)
        s_res = await db.execute(s_stmt)
        count = s_res.scalar() or 0
        
        if (count + 1) < p.max_spots:
            av_groups.append(p)
            
    return av_groups
