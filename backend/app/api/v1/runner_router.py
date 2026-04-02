from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.user import RunnerProfile, User
import uuid

router = APIRouter()

@router.get("/{runner_id}")
async def get_runner_profile(runner_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
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
