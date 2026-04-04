from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, or_
from sqlalchemy.orm import selectinload
from ...database import get_db
from ...models.waka import Waka, WakaDecline
from ...models.user import User
from ...schemas.waka import WakaCreate, WakaResponse
from ...schemas.review import ReviewBase, ReviewResponse
from .deps import get_current_user
from ...services.notification_service import notify_user
import uuid
from typing import List

router = APIRouter()

async def get_hydrated_waka(db: AsyncSession, waka_id: uuid.UUID) -> Waka:
    """Fetch waka with employer and runner relationships loaded."""
    stmt = (
        select(Waka)
        .options(selectinload(Waka.employer), selectinload(Waka.runner))
        .where(Waka.id == waka_id)
    )
    result = await db.execute(stmt)
    waka = result.scalars().first()
    if not waka:
        return None
        
    # Check for reviews
    from ...models.review import Review
    emp_rev_stmt = select(func.count(Review.id)).where(Review.waka_id == waka_id, Review.reviewer_id == waka.employer_id)
    run_rev_stmt = select(func.count(Review.id)).where(Review.waka_id == waka_id, Review.reviewer_id == waka.runner_id)
    
    emp_rev_res = await db.execute(emp_rev_stmt)
    run_rev_res = await db.execute(run_rev_stmt)
    
    waka.has_employer_reviewed = emp_rev_res.scalar() > 0
    waka.has_runner_reviewed = (run_rev_res.scalar() or 0) > 0 if waka.runner_id else False
    
    return waka

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
    db_obj.employer = current_user

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
        .options(selectinload(Waka.employer), selectinload(Waka.runner))
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
    """Mark a waka as completed. Requires BOTH runner and employer to confirm."""
    result = await db.execute(select(Waka).where(Waka.id == waka_id))
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    if current_user.id == waka.employer_id:
        waka.completed_by_employer = True
    elif current_user.id == waka.runner_id:
        waka.completed_by_runner = True
    else:
        raise HTTPException(status_code=403, detail="Not a participant in this errand")
    
    # If both confirmed, mark as fully completed
    if waka.completed_by_runner and waka.completed_by_employer:
        waka.is_completed = True
        waka.status = "completed"
        waka.step = 5 # Success state
        
        # Notify Both
        for uid in [waka.employer_id, waka.runner_id]:
            user_res = await db.execute(select(User).where(User.id == uid))
            recipient = user_res.scalars().first()
            if recipient:
                await notify_user(
                    db=db,
                    user=recipient,
                    title="Errand Fully Finalized",
                    body=f"Both parties have confirmed completion for '{waka.item_description[:30]}...'",
                    type="success",
                    linked_entity_id=waka.id,
                    linked_entity_type="waka"
                )
    else:
        # Notify the other party that one person finished
        other_id = waka.runner_id if current_user.id == waka.employer_id else waka.employer_id
        if other_id:
            user_res = await db.execute(select(User).where(User.id == other_id))
            recipient = user_res.scalars().first()
            if recipient:
                await notify_user(
                    db=db,
                    user=recipient,
                    title="Awaiting Your Confirmation",
                    body=f"{current_user.full_name} marked the errand as complete. Please confirm to finalize.",
                    type="info",
                    linked_entity_id=waka.id,
                    linked_entity_type="waka"
                )

    await db.commit()
    return await get_hydrated_waka(db, waka_id)

@router.patch("/{waka_id}/step", response_model=WakaResponse)
async def update_waka_step(
    waka_id: uuid.UUID,
    step: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update errand progress step (Runner only)."""
    result = await db.execute(select(Waka).where(Waka.id == waka_id))
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    if waka.runner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned runner can update steps")
    
    waka.step = step
    # Map steps to status strings
    if step == 2: waka.status = "assigned"
    elif step == 3: waka.status = "sourcing"
    elif step == 4: waka.status = "delivering"
    
    await db.commit()
    return await get_hydrated_waka(db, waka_id)

@router.get("/mine", response_model=List[WakaResponse])
async def get_my_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all wakas created by the current user (as employer)."""
    result = await db.execute(
        select(Waka)
        .options(selectinload(Waka.employer), selectinload(Waka.runner))
        .where(
            or_(Waka.employer_id == current_user.id, Waka.runner_id == current_user.id),
            Waka.is_deleted == False
        )
        .order_by(Waka.created_at.desc())
    )
    return result.scalars().all()

@router.get("/available", response_model=List[WakaResponse])
async def get_available_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Exclude wakas that this runner has declined
    declined_stmt = select(WakaDecline.waka_id).where(WakaDecline.runner_id == current_user.id)
    declined_res = await db.execute(declined_stmt)
    declined_ids = declined_res.scalars().all()

    stmt = (
        select(Waka)
        .options(selectinload(Waka.employer), selectinload(Waka.runner))
        .where(
            Waka.status == "finding_runner",
            Waka.runner_id == None,
            Waka.is_deleted == False
        )
    )
    
    if declined_ids:
        stmt = stmt.where(~Waka.id.in_(declined_ids))
        
    result = await db.execute(stmt.order_by(Waka.created_at.desc()))
    return result.scalars().all()

@router.get("/runner/active", response_model=List[WakaResponse])
async def get_runner_active_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return non-completed wakas where the current user is the runner."""
    result = await db.execute(
        select(Waka)
        .options(selectinload(Waka.employer), selectinload(Waka.runner))
        .where(
            Waka.runner_id == current_user.id,
            Waka.is_completed == False,
            Waka.is_deleted == False,
            Waka.status != "cancelled"
        )
        .order_by(Waka.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{waka_id}", response_model=WakaResponse)
async def get_waka(
    waka_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Waka)
        .options(selectinload(Waka.employer), selectinload(Waka.runner))
        .where(Waka.id == waka_id, Waka.is_deleted == False)
    )
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    return waka


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
    
    # Return hydrated waka
    stmt = select(Waka).options(selectinload(Waka.employer), selectinload(Waka.runner)).where(Waka.id == waka_id)
    result = await db.execute(stmt)
    return result.scalars().first()

@router.post("/{waka_id}/decline", response_model=WakaResponse)
async def decline_waka(
    waka_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Decline a waka (Hides from available for runner, unassigns if assigned)."""
    result = await db.execute(select(Waka).where(Waka.id == waka_id))
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    # Store decline record so it stays hidden from /available
    decline = WakaDecline(waka_id=waka_id, runner_id=current_user.id)
    db.add(decline)

    if waka.runner_id == current_user.id:
        # Re-broadcast if they were already assigned
        waka.runner_id = None
        waka.status = "finding_runner"
        waka.step = 1
        
        # Notify Employer
        employer_res = await db.execute(select(User).where(User.id == waka.employer_id))
        employer = employer_res.scalars().first()
        if employer:
            await notify_user(
                db=db,
                user=employer,
                title="Runner Unavailable",
                body=f"{current_user.full_name} declined the errand. We're finding a new runner.",
                type="warning",
                linked_entity_id=waka.id,
                linked_entity_type="waka"
            )
    
    await db.commit()
    return await get_hydrated_waka(db, waka_id)

@router.post("/{waka_id}/review", response_model=ReviewResponse)
async def leave_waka_review(
    waka_id: uuid.UUID,
    review_in: ReviewBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Leave a review for another participant of a completed errand."""
    # 1. Fetch Waka
    waka = await get_hydrated_waka(db, waka_id)
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
        
    # 2. Check Completion
    if not waka.is_completed:
        raise HTTPException(status_code=400, detail="Reviews can only be left after mutual completion")
        
    # 3. Check Participation & Identify Target
    if current_user.id == waka.employer_id:
        target_id = waka.runner_id
        if waka.has_employer_reviewed:
            raise HTTPException(status_code=400, detail="You have already reviewed this errand")
    elif current_user.id == waka.runner_id:
        target_id = waka.employer_id
        if waka.has_runner_reviewed:
            raise HTTPException(status_code=400, detail="You have already reviewed this errand")
    else:
        raise HTTPException(status_code=403, detail="Only participants can leave reviews")
        
    if not target_id:
         raise HTTPException(status_code=400, detail="No target user to review")

    # 4. Create Review
    from ...models.review import Review
    review = Review(
        waka_id=waka_id,
        reviewer_id=current_user.id,
        target_user_id=target_id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(review)
    
    # 5. Update target user's stats_rating (Live recalculation)
    # Fetch all ratings for target user
    ratings_stmt = select(func.avg(Review.rating)).where(Review.target_user_id == target_id)
    
    # Note: We commit the review first so the average includes it
    await db.commit() 
    
    avg_res = await db.execute(ratings_stmt)
    new_avg = avg_res.scalar() or 0.0
    
    # Update user model
    from ...models.user import User
    await db.execute(
        update(User).where(User.id == target_id).values(stats_rating=float(new_avg))
    )
    
    # 6. Notify Target User
    recipient_res = await db.execute(select(User).where(User.id == target_id))
    recipient = recipient_res.scalars().first()
    if recipient:
        await notify_user(
            db=db,
            user=recipient,
            title="New Review Received!",
            body=f"{current_user.full_name} left you a {review_in.rating}-star review for the '{waka.category}' errand.",
            type="success",
            linked_entity_id=waka.id,
            linked_entity_type="waka"
        )
    
    await db.commit()
    await db.refresh(review)
    return review
