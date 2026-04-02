from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2 import Geography
from ...database import get_db
from ...models.user import RunnerProfile, User
from ...models.review import Review
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
    
    # Fetch active wakas for THIS runner
    active_stmt = select(func.count(Waka.id)).where(
        Waka.runner_id == user.id,
        Waka.is_completed == False
    )
    active_res = await db.execute(active_stmt)
    active_count = active_res.scalar() or 0

    # Fetch last 5 reviews
    reviews_stmt = select(Review, User).join(User, Review.reviewer_id == User.id).where(
        Review.target_user_id == user.id
    ).order_by(Review.created_at.desc()).limit(5)
    reviews_result = await db.execute(reviews_stmt)
    reviews_rows = reviews_result.all()

    # Molded response matching runner/[id].tsx expectations
    return {
        "id": str(runner_profile.id),
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
        "runner_profile": {
            "id": str(runner_profile.id),
            "bio": runner_profile.bio,
            "hourly_rate": float(runner_profile.hourly_rate) if runner_profile.hourly_rate else 0,
            "stats_rating": float(runner_profile.stats_rating),
            "stats_trips": runner_profile.stats_trips,
            "active_wakas": active_count,
            "reviews": [
                {
                    "id": str(r.id),
                    "reviewer_name": u.full_name,
                    "comment": r.comment,
                    "rating": r.rating,
                    "created_at": r.created_at.isoformat()
                } for r, u in reviews_rows
            ]
        }
    }
