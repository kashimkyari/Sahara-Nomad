from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2 import Geography
from ...database import get_db
from ...models.user import RunnerProfile, User
from .deps import get_current_user
import uuid

router = APIRouter()

@router.get("/active-count")
async def get_active_runners_count(
    lat: float = None,
    lng: float = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns number of active runners within 50km of given location."""
    radius_m = 50000.0 # 50km
    
    if lat is None or lng is None:
        result = await db.execute(
            select(func.count(RunnerProfile.id))
            .where(RunnerProfile.is_online == True, RunnerProfile.is_deleted == False)
        )
        return {"count": result.scalar()}

    # PostGIS distance query
    user_point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
    user_geog = func.cast(user_point, Geography)

    result = await db.execute(
        select(func.count(RunnerProfile.id))
        .where(
            RunnerProfile.is_online == True,
            RunnerProfile.is_deleted == False,
            func.ST_DWithin(RunnerProfile.current_location, user_geog, radius_m)
        )
    )
    return {"count": result.scalar()}

@router.get("/{runner_id}")
async def get_runner_profile(
    runner_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(RunnerProfile, User).join(User).where(
        RunnerProfile.id == runner_id,
        RunnerProfile.is_deleted == False
    )
    result = await db.execute(stmt)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Runner not found")
        
    runner_profile, user = row
    
    # Molded response matching runner/[id].tsx expectations
    return {
        "id": str(runner_profile.id),
        "name": user.full_name,
        "rating": float(runner_profile.stats_rating),
        "trips_completed": runner_profile.stats_trips,
        "joined_year": user.created_at.year,
        "bio": runner_profile.bio,
        "hourly_rate": float(runner_profile.hourly_rate) if runner_profile.hourly_rate else 0,
        "is_nin_verified": user.is_verified,
        "recent_reviews": [] # Add relationship fetch if needed
    }
