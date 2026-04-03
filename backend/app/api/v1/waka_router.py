from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.waka import Waka
from ...models.user import User
from ...schemas.waka import WakaCreate, WakaResponse
from .deps import get_current_user
from ...services.notification_service import notify_user
import uuid
from typing import List

router = APIRouter()

@router.post("/", response_model=WakaResponse)
async def create_waka(
    waka_in: WakaCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employer_id = current_user.id
    
    status = "assigned" if waka_in.target_runner_id else "finding_runner"
    runner_id = waka_in.target_runner_id
    
    db_obj = Waka(
        employer_id=employer_id,
        runner_id=runner_id,
        category=waka_in.category,
        item_description=waka_in.item_description,
        pickup_address=waka_in.pickup.address,
        dropoff_address=waka_in.dropoff.address,
        urgency=waka_in.urgency,
        runner_fee=waka_in.base_fee,
        flash_incentive=waka_in.flash_incentive,
        total_price=waka_in.total_price,
        status=status,
        step=1
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)

    # Initial Notification for Employer
    await notify_user(
        db=db,
        user=current_user,
        title="Errand Posted",
        body=f"Your request for '{db_obj.category}' has been posted and we're finding a runner." if not runner_id else f"Your request has been sent to the runner.",
        type="info",
        linked_entity_id=db_obj.id,
        linked_entity_type="waka"
    )
    
    # Notification for Runner
    if runner_id:
        runner_res = await db.execute(select(User).where(User.id == runner_id))
        runner = runner_res.scalars().first()
        if runner:
            await notify_user(
                db=db,
                user=runner,
                title="New Direct Booking!",
                body=f"{current_user.full_name} has hired you for a '{db_obj.category}' errand.",
                type="success",
                linked_entity_id=db_obj.id,
                linked_entity_type="waka"
            )
    await db.commit()

    return db_obj

@router.get("/active", response_model=List[WakaResponse])
async def get_active_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return non-completed, non-cancelled wakas created by the current user."""
    result = await db.execute(
        select(Waka)
        .where(
            Waka.employer_id == current_user.id, 
            Waka.is_completed == False,
            Waka.is_deleted == False,
            Waka.status != "cancelled"
        )
        .order_by(Waka.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{waka_id}/cancel", response_model=WakaResponse)
async def cancel_waka(
    waka_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a waka as cancelled."""
    result = await db.execute(
        select(Waka).where(Waka.id == waka_id, Waka.employer_id == current_user.id)
    )
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    if waka.is_completed:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed waka")
    
    waka.status = "cancelled"
    await db.commit()
    await db.refresh(waka)

    # Cancellation Notification
    await notify_user(
        db=db,
        user=current_user,
        title="Errand Cancelled",
        body=f"Your errand for '{waka.category}' has been successfully cancelled.",
        type="warning",
        linked_entity_id=waka.id,
        linked_entity_type="waka"
    )
    await db.commit()

    return waka

@router.post("/{waka_id}/complete", response_model=WakaResponse)
async def complete_waka(
    waka_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a waka as completed."""
    result = await db.execute(
        select(Waka).where(Waka.id == waka_id, Waka.employer_id == current_user.id)
    )
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    waka.status = "completed"
    waka.is_completed = True
    waka.step = 4
    await db.commit()
    await db.refresh(waka)

    # Completion Notification
    await notify_user(
        db=db,
        user=current_user,
        title="Errand Completed",
        body=f"Your errand for '{waka.category}' is finished. Thanks for using SendAm!",
        type="success",
        linked_entity_id=waka.id,
        linked_entity_type="waka"
    )
    await db.commit()

    return waka

@router.get("/mine", response_model=List[WakaResponse])
async def get_my_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all wakas created by the current user (as employer)."""
    result = await db.execute(
        select(Waka)
        .where(Waka.employer_id == current_user.id, Waka.is_deleted == False)
        .order_by(Waka.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{waka_id}", response_model=WakaResponse)
async def get_waka(
    waka_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Waka).where(Waka.id == waka_id, Waka.is_deleted == False))
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    return waka

@router.get("/available", response_model=List[WakaResponse])
async def get_available_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all wakas that are broadcasted and looking for a runner."""
    result = await db.execute(
        select(Waka)
        .where(
            Waka.status == "finding_runner",
            Waka.runner_id == None,
            Waka.is_deleted == False
        )
        .order_by(Waka.created_at.desc())
    )
    return result.scalars().all()

@router.get("/runner/active", response_model=List[WakaResponse])
async def get_runner_active_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return non-completed wakas where the current user is the runner."""
    result = await db.execute(
        select(Waka)
        .where(
            Waka.runner_id == current_user.id,
            Waka.is_completed == False,
            Waka.is_deleted == False,
            Waka.status != "cancelled"
        )
        .order_by(Waka.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{waka_id}/accept", response_model=WakaResponse)
async def accept_waka(
    waka_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a waka as a runner."""
    result = await db.execute(select(Waka).where(Waka.id == waka_id))
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    if waka.runner_id and waka.runner_id != current_user.id:
        raise HTTPException(status_code=400, detail="Waka already assigned to another runner")
    
    waka.runner_id = current_user.id
    waka.status = "assigned"
    waka.step = 2 # En-route or Assigned
    await db.commit()
    await db.refresh(waka)

    # Notify Employer
    employer_res = await db.execute(select(User).where(User.id == waka.employer_id))
    employer = employer_res.scalars().first()
    if employer:
        await notify_user(
            db=db,
            user=employer,
            title="Runner Found!",
            body=f"{current_user.full_name} has accepted your '{waka.category}' errand.",
            type="success",
            linked_entity_id=waka.id,
            linked_entity_type="waka"
        )
    await db.commit()
    return waka

@router.post("/{waka_id}/decline", response_model=WakaResponse)
async def decline_waka(
    waka_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Decline a waka (mostly for direct bookings)."""
    result = await db.execute(select(Waka).where(Waka.id == waka_id))
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    if waka.runner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to you")
    
    # Reset to finding_runner if it was a direct hire
    waka.runner_id = None
    waka.status = "finding_runner"
    await db.commit()
    await db.refresh(waka)

    # Notify Employer
    employer_res = await db.execute(select(User).where(User.id == waka.employer_id))
    employer = employer_res.scalars().first()
    if employer:
        await notify_user(
            db=db,
            user=employer,
            title="Runner Declined",
            body=f"{current_user.full_name} is unavailable for your '{waka.category}' errand. We're looking for another runner.",
            type="warning",
            linked_entity_id=waka.id,
            linked_entity_type="waka"
        )
    await db.commit()
    return waka
