from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.user import User
from ...models.scheduling import ScheduledWaka
from ...schemas.scheduling import ScheduledWakaCreate, ScheduledWakaUpdate, ScheduledWakaResponse
from .deps import get_current_user
import uuid
from typing import List

router = APIRouter()

@router.post("/", response_model=ScheduledWakaResponse)
async def create_scheduled_waka(
    sched_in: ScheduledWakaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Nomad schedules a recurring errand."""
    db_obj = ScheduledWaka(
        employer_id=current_user.id,
        title=sched_in.title,
        frequency=sched_in.frequency,
        waka_template=sched_in.waka_template,
        next_run=sched_in.next_run,
        is_active=sched_in.is_active
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[ScheduledWakaResponse])
async def list_scheduled_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all scheduled errands for the nomad."""
    stmt = select(ScheduledWaka).where(
        ScheduledWaka.employer_id == current_user.id,
        ScheduledWaka.is_deleted == False
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/{sched_id}", response_model=ScheduledWakaResponse)
async def update_scheduled_waka(
    sched_id: uuid.UUID,
    sched_in: ScheduledWakaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update or toggle a scheduled errand."""
    sched = await db.get(ScheduledWaka, sched_id)
    if not sched or sched.employer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    update_data = sched_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sched, field, value)
        
    await db.commit()
    await db.refresh(sched)
    return sched
