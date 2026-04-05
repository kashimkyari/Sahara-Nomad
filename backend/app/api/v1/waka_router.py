from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
import os
import shutil
from sqlalchemy import select, func, update, or_
from sqlalchemy.orm import selectinload
from ...database import get_db
from ...models.waka import Waka, WakaDecline
from ...models.user import User
from ...schemas.waka import WakaCreate, WakaResponse, WakaSourcingRequest, SourcingRejection, WakaTipRequest, DisputeCreate, DisputeResponse, WakaComplete
from ...schemas.review import ReviewBase, ReviewResponse
from .deps import get_current_user
from ...services.notification_service import notify_user
from ...services.watermark_service import apply_pod_watermark
from ...services.surge_service import calculate_environmental_surge
import uuid
from typing import List, Optional, Dict, Any

router = APIRouter()

POD_UPLOAD_DIR = "uploads/pod"
if not os.path.exists(POD_UPLOAD_DIR):
    os.makedirs(POD_UPLOAD_DIR)

@router.post("/{waka_id}/pod", response_model=Dict[str, Any])
async def upload_waka_pod(
    waka_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assigned runner uploads proof of delivery photo."""
    waka = await db.get(Waka, waka_id)
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
        
    if waka.runner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned runner can upload POD")
        
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{waka_id}{file_ext}"
    file_path = os.path.join(POD_UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Apply watermark
    lat = lng = None
    if current_user.last_location:
        try:
            from geoalchemy2.shape import to_shape
            pt = to_shape(current_user.last_location)
            lat, lng = pt.y, pt.x
        except Exception:
            pass
            
    apply_pod_watermark(file_path, current_user.full_name, lat, lng)
        
    waka.pod_url = f"/api/v1/waka/{waka_id}/pod_image"
    await db.commit()
    return {"status": "success", "pod_url": waka.pod_url}

@router.get("/{waka_id}/pod_image")
async def get_waka_pod_image(waka_id: uuid.UUID):
    """Retrieve proof of delivery photo."""
    if os.path.exists(POD_UPLOAD_DIR):
        for f in os.listdir(POD_UPLOAD_DIR):
            if f.startswith(str(waka_id)):
                from fastapi.responses import FileResponse
                return FileResponse(os.path.join(POD_UPLOAD_DIR, f))
    raise HTTPException(status_code=404, detail="POD image not found")

async def get_hydrated_waka(db: AsyncSession, waka_id: uuid.UUID) -> Waka:
    """Fetch waka with employer, runner and inventory relationships loaded."""
    stmt = (
        select(Waka)
        .options(
            selectinload(Waka.employer), 
            selectinload(Waka.runner),
            selectinload(Waka.inventory_items)
        )
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

@router.post("/{waka_id}/invite")
async def invite_friend(
    waka_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Invite a friend to join a shared errand."""
    waka = await get_hydrated_waka(db, waka_id)
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    if not waka.is_shared:
        raise HTTPException(status_code=400, detail="This errand is not set for sharing")
    
    if waka.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can invite friends")

    # Check if friend exists
    friend_stmt = select(User).where(User.id == user_id, User.is_user_deleted == False)
    friend = (await db.execute(friend_stmt)).scalars().first()
    if not friend:
        raise HTTPException(status_code=404, detail="Friend not found")

    return {"status": "invited", "friend_name": friend.full_name}

@router.post("/", response_model=WakaResponse)
async def create_waka(
    waka_in: WakaCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employer_id = current_user.id
    
    status = "assigned" if waka_in.target_runner_id else "finding_runner"
    runner_id = waka_in.target_runner_id
    
    surge = calculate_environmental_surge(waka_in.pickup.lat, waka_in.pickup.lng)
    
    safe_drop_pin = None
    import random
    if waka_in.drop_type == "locker":
        safe_drop_pin = str(random.randint(100000, 999999))
        
    db_obj = Waka(
        employer_id=employer_id,
        runner_id=runner_id,
        category=waka_in.category,
        item_description=waka_in.item_description,
        pickup_address=waka_in.pickup.address,
        pickup_location=f"SRID=4326;POINT({waka_in.pickup.lng} {waka_in.pickup.lat})" if waka_in.pickup.lng and waka_in.pickup.lat else None,
        dropoff_address=waka_in.dropoff.address,
        dropoff_location=f"SRID=4326;POINT({waka_in.dropoff.lng} {waka_in.dropoff.lat})" if waka_in.dropoff.lng and waka_in.dropoff.lat else None,
        drop_type=waka_in.drop_type,
        safe_drop_pin=safe_drop_pin,
        urgency=waka_in.urgency,
        surge_multiplier=surge.multiplier,
        surge_reason=surge.reason,
        runner_fee=waka_in.base_fee * float(surge.multiplier),
        flash_incentive=waka_in.flash_incentive,
        total_price=waka_in.total_price * float(surge.multiplier),
        status=status,
        step=1,
        budget_min=waka_in.budget_min,
        budget_max=waka_in.budget_max,
        items=waka_in.items,
        insurance_opt_in=waka_in.insurance_opt_in,
        is_shared=waka_in.is_shared,
        parent_waka_id=waka_in.parent_waka_id,
        max_spots=waka_in.max_spots,
        original_runner_fee=waka_in.base_fee if waka_in.is_shared else None
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

    # Waka-Share logic: Recalculate fees for all participants
    if db_obj.parent_waka_id:
        parent_stmt = select(Waka).where(Waka.id == db_obj.parent_waka_id)
        parent_res = await db.execute(parent_stmt)
        parent = parent_res.scalars().first()
        if parent:
            # Find all siblings
            siblings_stmt = select(Waka).where(Waka.parent_waka_id == parent.id)
            siblings_res = await db.execute(siblings_stmt)
            siblings = siblings_res.scalars().all()
            participants = [parent] + siblings
            num_participants = len(participants)
            
            # Robust splitting logic: original_base_fee / num_participants
            # We use parent.original_runner_fee to avoid halving issues
            base_fee = float(parent.original_runner_fee or parent.runner_fee)
            split_fee = base_fee / num_participants
            
            for p in participants:
                p.runner_fee = split_fee
                p.total_price = split_fee + float(p.flash_incentive)
            
            await db.commit()

    return db_obj

@router.post("/{waka_id}/milestones/{index}/release", response_model=Dict[str, Any])
async def release_waka_milestone(
    waka_id: uuid.UUID,
    index: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    waka = await get_hydrated_waka(db, waka_id)
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
        
    if current_user.id != waka.employer_id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only the employer or admin can release milestones")
        
    if not waka.milestones or index >= len(waka.milestones):
        raise HTTPException(status_code=400, detail="Invalid milestone index")
        
    milestone = waka.milestones[index]
    if milestone.get("status") == "released":
        raise HTTPException(status_code=400, detail="Milestone already released")
        
    # Release funds
    from ...services.wallet_service import WalletService
    success = await WalletService.release_milestone(
        db=db,
        waka_id=waka_id,
        milestone_index=index,
        employer_id=waka.employer_id,
        runner_id=waka.runner_id,
        amount=milestone["amount"],
        reference=str(waka_id)
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Insufficient funds in employer wallet")
        
    # Update milestone status
    milestone["status"] = "released"
    waka.milestones[index] = milestone # Ensure JSON update is detected
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(waka, "milestones")
    
    await db.commit()
    return {"status": "success", "milestone": milestone}

@router.post("/{waka_id}/tip", response_model=Dict[str, Any])
async def tip_waka(
    waka_id: uuid.UUID,
    tip_in: WakaTipRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Nomad sends a voluntary tip to the runner."""
    waka = await get_hydrated_waka(db, waka_id)
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
        
    if waka.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the nomad can send a tip")
        
    if not waka.runner_id:
        raise HTTPException(status_code=400, detail="No runner assigned to this errand yet")

    from ...services.wallet_service import wallet_service
    from decimal import Decimal
    amount = Decimal(str(tip_in.amount))
    
    # Simplified transfer for tips (no commission, direct user-to-user)
    success = await wallet_service.simple_transfer(
        db=db,
        from_user_id=current_user.id,
        to_user_id=waka.runner_id,
        amount=amount,
        tx_type="waka_tip",
        reference=f"tip_{waka.id}_{uuid.uuid4().hex[:8]}"
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance for this tip")
        
    # Notify Runner
    await notify_user(
        db=db,
        user=waka.runner,
        title="Extra Love! 💖",
        body=f"{current_user.full_name} sent you a ₦{amount:,.2f} tip for your errand!",
        type="success",
        linked_entity_id=waka.id,
        linked_entity_type="waka"
    )
    
    await db.commit()
    return {"status": "success", "amount": float(amount), "recipient": waka.runner.full_name}

@router.post("/{waka_id}/dispute", response_model=DisputeResponse)
async def dispute_waka(
    waka_id: uuid.UUID,
    dispute_in: DisputeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Participant raises a dispute for an errand."""
    waka = await db.scalar(select(Waka).where(Waka.id == waka_id))
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
        
    if current_user.id not in [waka.employer_id, waka.runner_id]:
        raise HTTPException(status_code=403, detail="Only participants can raise a dispute")
        
    from ...models.waka import WakaDispute
    dispute = WakaDispute(
        waka_id=waka_id,
        creator_id=current_user.id,
        reason=dispute_in.reason,
        description=dispute_in.description
    )
    db.add(dispute)
    
    # Notify the other party
    other_id = waka.runner_id if current_user.id == waka.employer_id else waka.employer_id
    if other_id:
        recipient = await db.get(User, other_id)
        if recipient:
            await notify_user(
                db=db,
                user=recipient,
                title="Dispute Raised ⚠️",
                body=f"{current_user.full_name} has raised a dispute for your errand. Our team will investigate.",
                type="warning",
                linked_entity_id=waka.id,
                linked_entity_type="waka"
            )
            
    await db.commit()
    await db.refresh(dispute)
    return dispute

@router.get("/active", response_model=List[WakaResponse])
async def get_active_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return non-completed, non-cancelled wakas created by the current user."""
    result = await db.execute(
        select(Waka)
        .options(selectinload(Waka.employer), selectinload(Waka.runner), selectinload(Waka.inventory_items))
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

@router.patch("/{waka_id}/payment_method", response_model=WakaResponse)
async def update_waka_payment_method(
    waka_id: uuid.UUID,
    payment_method: str, # wallet | cash
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    waka = await get_hydrated_waka(db, waka_id)
    
    if not waka:
        raise HTTPException(status_code=404, detail="Errand not found")
        
    if waka.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the nomad can change payment method")
        
    if waka.is_completed or waka.is_sourcing_funded:
        raise HTTPException(status_code=400, detail="Cannot change payment method after funding or completion")
        
    waka.payment_method = payment_method
    await db.commit()
    await db.refresh(waka)
    return waka

@router.post("/{waka_id}/complete", response_model=WakaResponse)
async def complete_waka(
    waka_id: uuid.UUID,
    complete_in: Optional[WakaComplete] = None,
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
        if complete_in and complete_in.pod_url:
            waka.pod_url = complete_in.pod_url
    else:
        raise HTTPException(status_code=403, detail="Not a participant in this errand")
    
    # If both confirmed, mark as fully completed
    if waka.completed_by_runner and waka.completed_by_employer:
        waka.is_completed = True
        waka.status = "completed"
        waka.step = 5
        
        # --- AUTOMATED RUNNER FEE PAYOUT ---
        from ...services.wallet_service import wallet_service
        from decimal import Decimal
        
        # --- DYNAMIC COMMISSION BASED ON RUNNER TIER ---
        # Bronze: 10%, Silver: 7.5%, Gold: 5%
        commission_rate = Decimal("0.10")
        if waka.runner:
            if waka.runner.stats_trips >= 50: commission_rate = Decimal("0.05")
            elif waka.runner.stats_trips >= 10: commission_rate = Decimal("0.075")
            
            # Apply temporary streak-based discount (Phase 8)
            discount = Decimal(str(waka.runner.platform_fee_discount or 0))
            commission_rate = max(Decimal("0.0"), commission_rate - discount)

        success = await wallet_service.transfer_funds(
            db=db,
            from_user_id=waka.employer_id,
            to_user_id=waka.runner_id,
            amount=total_payout,
            tx_type="waka_fee",
            reference=f"waka_fee_{waka.id}",
            is_cash=(waka.payment_method == "cash"),
            commission_rate=commission_rate
        )
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient wallet balance to pay the runner fee. Total needed: ₦{total_payout:,.2f}"
            )
            
        # Notify both about payment success
        await notify_user(
            db=db,
            user=waka.runner,
            title="Payment Received! 💰" if waka.payment_method == "wallet" else "Cash Payment Recorded! 💵",
            body=f"You've received ₦{total_payout:,.2f} for completing the errand '{waka.category}'." if waka.payment_method == "wallet" else f"A cash payment of ₦{total_payout:,.2f} has been recorded for your completed errand.",
            type="success",
            linked_entity_id=waka.id,
            linked_entity_type="waka"
        )
        waka.step = 5 # Success state
        
        # Increment Runner & Employer Counts
        if waka.runner:
            waka.runner.stats_trips += 1
            
            # --- RUNNER STREAK & FEE DISCOUNT (Phase 8) ---
            now = datetime.utcnow()
            if waka.runner.last_streak_update:
                # Reset streak if last update was more than 7 days ago
                if now - waka.runner.last_streak_update > timedelta(days=7):
                    waka.runner.streak_count = 1
                else:
                    waka.runner.streak_count += 1
            else:
                waka.runner.streak_count = 1
            
            waka.runner.last_streak_update = now
            
            # Unlock 5% discount if streak hits 10
            if waka.runner.streak_count >= 10:
                waka.runner.platform_fee_discount = float(0.05)
                # Notify about milestone
                await notify_user(
                    db=db,
                    user=waka.runner,
                    title="STREAK MASTER! 🔥",
                    body="You've completed 10 errands this week! You now have a temporary 5% platform fee reduction.",
                    type="success",
                    linked_entity_id=waka.id,
                    linked_entity_type="waka"
                )
        waka.employer.errands_count += 1
            
        # --- REFERRAL REWARD (₦500 for first errand) ---
        if waka.employer.errands_count == 1 and waka.employer.referred_by_id:
            # Credit User
            await wallet_service.transfer_funds(
                db=db,
                from_user_id=uuid.UUID(settings.SYSTEM_USER_ID),
                to_user_id=waka.employer_id,
                amount=Decimal("500.00"),
                tx_type="referral_bonus",
                reference=f"ref_bonus_user_{waka.id}",
                is_cash=False
            )
            # Credit Referrer
            await wallet_service.transfer_funds(
                db=db,
                from_user_id=uuid.UUID(settings.SYSTEM_USER_ID),
                to_user_id=waka.employer.referred_by_id,
                amount=Decimal("500.00"),
                tx_type="referral_bonus",
                reference=f"ref_bonus_referral_{waka.id}",
                is_cash=False
            )
            # Notify Referrer
            referrer = await db.get(User, waka.employer.referred_by_id)
            if referrer:
                await notify_user(
                    db=db,
                    user=referrer,
                    title="Referral Bonus! 🎁",
                    body=f"You've received ₦500 because {waka.employer.full_name} completed their first errand!",
                    type="success"
                )
        
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

@router.post("/{waka_id}/sourcing", response_model=WakaResponse)
async def submit_waka_sourcing(
    waka_id: uuid.UUID,
    sourcing_in: WakaSourcingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Runner submits sourcing details (budget + bank info)."""
    waka = await get_hydrated_waka(db, waka_id)
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    if waka.runner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned runner can submit sourcing details")
    
    # Validate budget range if set
    if waka.budget_min is not None and sourcing_in.sourcing_budget < waka.budget_min:
        raise HTTPException(status_code=400, detail=f"Amount too low. Minimum allowed: ₦{waka.budget_min:,.2f}")
    if waka.budget_max is not None and sourcing_in.sourcing_budget > waka.budget_max:
        raise HTTPException(status_code=400, detail=f"Amount too high. Maximum allowed: ₦{waka.budget_max:,.2f}")

    waka.sourcing_budget = sourcing_in.sourcing_budget
    waka.sourcing_bank_name = sourcing_in.bank_name
    waka.sourcing_account_number = sourcing_in.account_number
    waka.sourcing_account_name = sourcing_in.account_name
    waka.status = "sourcing_submitted"
    
    await db.commit()
    
    # Find conversation for notification linking
    conv_stmt = select(Conversation).where(Conversation.waka_id == waka.id)
    conv_res = await db.execute(conv_stmt)
    conv = conv_res.scalar_one_or_none()
    
    # Notify Employer
    await notify_user(
        db=db,
        user=waka.employer,
        title="Sourcing Bill Received",
        body=f"{current_user.full_name} has updated the errand costs. Total: ₦{sourcing_in.sourcing_budget:,.2f}. Please review and fund.",
        type="info",
        linked_entity_id=conv.id if conv else waka.id,
        linked_entity_type="conversation" if conv else "waka"
    )
    
    await db.commit()
    await db.refresh(waka)

    # --- AUTO-POST TO CHAT ---
    try:
        from ...models.message import Conversation, Message
        from ...schemas.message import MessageRead
        from .message_router import manager
        import json

        conv_stmt = select(Conversation).where(Conversation.waka_id == waka.id)
        conv_res = await db.execute(conv_stmt)
        conv = conv_res.scalar_one_or_none()
        
        if conv:
            action_msg = Message(
                conversation_id=conv.id,
                sender_id=waka.runner_id,
                content_text=f"🛒 Sourcing Request: ₦{waka.sourcing_budget:,.2f}",
                attachment_metadata={
                    "type": "sourcing_request",
                    "waka_id": str(waka.id),
                    "amount": float(waka.sourcing_budget),
                    "items": waka.items,
                    "waka_status": waka.status,
                    "bank": {
                        "name": waka.sourcing_bank_name,
                        "number": waka.sourcing_account_number,
                        "account_name": waka.sourcing_account_name
                    }
                }
            )
            db.add(action_msg)
            conv.last_message_text = action_msg.content_text
            conv.last_message_at = func.now()
            await db.commit()
            await db.refresh(action_msg)
            
            # Broadcast via WebSocket
            msg_data = {
                "type": "NEW_MESSAGE",
                "message": MessageRead.model_validate(action_msg).model_dump(mode='json')
            }
            await manager.broadcast(json.dumps(msg_data), str(conv.id))
    except Exception as e:
        print(f"Error posting sourcing action to chat: {e}")

    return await get_hydrated_waka(db, waka_id)

@router.post("/{waka_id}/fund_sourcing", response_model=WakaResponse)
async def fund_waka_sourcing(
    waka_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Employer confirms they have funded the sourcing budget."""
    waka = await get_hydrated_waka(db, waka_id)
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    if waka.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the employer can fund the sourcing budget")
    
    waka.is_sourcing_funded = True
    waka.status = "sourcing_funded"
    
    # --- AUTOMATED WALLET TRANSFER ---
    from ...services.wallet_service import wallet_service
    from decimal import Decimal
    
    # --- AUTOMATED TRANSFER (Wallet or Virtual Cash Audit) ---
    from ...services.wallet_service import wallet_service
    from decimal import Decimal
    
    success = await wallet_service.transfer_funds(
        db=db,
        from_user_id=waka.employer_id,
        to_user_id=waka.runner_id,
        amount=Decimal(str(waka.sourcing_budget)),
        tx_type="waka_sourcing",
        reference=f"waka_sourcing_{waka.id}",
        is_cash=(waka.payment_method == "cash")
    )
    
    # --- OPTIONAL INSURANCE FEE (2%) ---
    if success and waka.insurance_opt_in:
        insurance_fee = (Decimal(str(waka.sourcing_budget)) * Decimal("0.02")).quantize(Decimal("0.01"))
        if insurance_fee > 0:
            await wallet_service.transfer_funds(
                db=db,
                from_user_id=waka.employer_id,
                to_user_id=uuid.UUID(settings.SYSTEM_USER_ID),
                amount=insurance_fee,
                tx_type="waka_insurance",
                reference=f"waka_insurance_{waka.id}",
                is_cash=False # Insurance must be digital
            )
    
    if not success:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient wallet balance to fund this bill. Total needed: ₦{waka.sourcing_budget:,.2f}"
        )

    await db.commit()
    
    # Find conversation for notification linking
    conv_stmt = select(Conversation).where(Conversation.waka_id == waka.id)
    conv_res = await db.execute(conv_stmt)
    conv = conv_res.scalar_one_or_none()

    # Notify Runner
    await notify_user(
        db=db,
        user=waka.runner,
        title="Sourcing Budget Funded!",
        body=f"{current_user.full_name} has funded the groceries budget. You can now proceed with the purchase.",
        type="success",
        linked_entity_id=conv.id if conv else waka.id,
        linked_entity_type="conversation" if conv else "waka"
    )
    
    await db.commit()
    await db.refresh(waka)

    # --- AUTO-POST TO CHAT ---
    try:
        from ...models.message import Conversation, Message
        from ...schemas.message import MessageRead
        from .message_router import manager
        import json

        conv_stmt = select(Conversation).where(Conversation.waka_id == waka.id)
        conv_res = await db.execute(conv_stmt)
        conv = conv_res.scalar_one_or_none()
        
        if conv:
            action_msg = Message(
                conversation_id=conv.id,
                sender_id=waka.employer_id,
                content_text=f"✅ Bill Approved & Funded (₦{waka.sourcing_budget:,.2f})",
                attachment_metadata={
                    "type": "sourcing_resolved",
                    "waka_id": str(waka.id),
                    "status": "funded"
                }
            )
            db.add(action_msg)
            conv.last_message_text = action_msg.content_text
            conv.last_message_at = func.now()
            await db.commit()
            await db.refresh(action_msg)
            
            # Broadcast via WebSocket
            msg_data = {
                "type": "NEW_MESSAGE",
                "message": MessageRead.model_validate(action_msg).model_dump(mode='json')
            }
            await manager.broadcast(json.dumps(msg_data), str(conv.id))
    except Exception as e:
        print(f"Error posting funding action to chat: {e}")

    return await get_hydrated_waka(db, waka_id)

@router.post("/{waka_id}/reject_sourcing", response_model=WakaResponse)
async def reject_waka_sourcing(
    waka_id: uuid.UUID,
    rejection: SourcingRejection,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Employer rejects the runner's sourcing bill/items."""
    waka = await get_hydrated_waka(db, waka_id)
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    if waka.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the employer can reject sourcing")
    
    if waka.status != "sourcing_submitted":
        raise HTTPException(status_code=400, detail="No active sourcing request to reject")
    
    waka.status = "sourcing_rejected"
    if rejection.item_list is not None:
        waka.items = rejection.item_list
    
    # Find conversation for notification linking
    conv_stmt = select(Conversation).where(Conversation.waka_id == waka.id)
    conv_res = await db.execute(conv_stmt)
    conv = conv_res.scalar_one_or_none()

    # Notify runner
    if waka.runner:
        await notify_user(
            db=db,
            user=waka.runner,
            title="Bill Declined ❌",
            body=f"The employer declined your bill for '{waka.category}'. Items have been adjusted.",
            type="warning",
            linked_entity_id=conv.id if conv else waka.id,
            linked_entity_type="conversation" if conv else "waka"
        )
    
    await db.commit()
    await db.refresh(waka)

    # --- AUTO-POST TO CHAT ---
    try:
        from ...models.message import Conversation, Message
        from ...schemas.message import MessageRead
        from .message_router import manager
        import json

        conv_stmt = select(Conversation).where(Conversation.waka_id == waka.id)
        conv_res = await db.execute(conv_stmt)
        conv = conv_res.scalar_one_or_none()
        
        if conv:
            action_msg = Message(
                conversation_id=conv.id,
                sender_id=waka.employer_id,
                content_text="❌ Sourcing Bill Declined",
                attachment_metadata={
                    "type": "sourcing_resolved",
                    "waka_id": str(waka.id),
                    "status": "rejected"
                }
            )
            db.add(action_msg)
            conv.last_message_text = action_msg.content_text
            conv.last_message_at = func.now()
            await db.commit()
            await db.refresh(action_msg)
            
            # Broadcast via WebSocket
            msg_data = {
                "type": "NEW_MESSAGE",
                "message": MessageRead.model_validate(action_msg).model_dump(mode='json')
            }
            await manager.broadcast(json.dumps(msg_data), str(conv.id))
    except Exception as e:
        print(f"Error posting rejection action to chat: {e}")

    return await get_hydrated_waka(db, waka_id)

@router.get("/mine", response_model=List[WakaResponse])
async def get_my_wakas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all wakas created by the current user (as employer)."""
    result = await db.execute(
        select(Waka)
        .options(
            selectinload(Waka.employer), 
            selectinload(Waka.runner),
            selectinload(Waka.inventory_items)
        )
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
        .options(selectinload(Waka.employer), selectinload(Waka.runner), selectinload(Waka.inventory_items))
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
        .options(selectinload(Waka.employer), selectinload(Waka.runner), selectinload(Waka.inventory_items))
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
        .options(selectinload(Waka.employer), selectinload(Waka.runner), selectinload(Waka.inventory_items))
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
    stmt = select(Waka).options(selectinload(Waka.employer), selectinload(Waka.runner), selectinload(Waka.inventory_items)).where(Waka.id == waka_id)
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

@router.post("/join/{parent_id}", response_model=WakaResponse)
async def join_shared_errand(
    parent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """A nomad joins an existing shared errand."""
    # 1. Fetch Parent
    parent = await db.get(Waka, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent errand not found")
        
    if not parent.is_shared:
        raise HTTPException(status_code=400, detail="This errand is not shareable")
        
    if parent.parent_waka_id:
        raise HTTPException(status_code=400, detail="Cannot join a child errand. Join the parent.")
        
    # 2. Check Capacity
    siblings_stmt = select(func.count(Waka.id)).where(Waka.parent_waka_id == parent.id)
    s_res = await db.execute(siblings_stmt)
    count = s_res.scalar() or 0
    if (count + 1) >= parent.max_spots:
        raise HTTPException(status_code=400, detail="This group is full")
        
    # 3. Create Child Waka
    child = Waka(
        employer_id=current_user.id,
        runner_id=parent.runner_id,
        category=parent.category,
        item_description=f"Joining: {parent.item_description}",
        pickup_address=parent.pickup_address,
        dropoff_address=current_user.address or parent.dropoff_address, # Use joining nomad's address if available
        urgency=parent.urgency,
        runner_fee=parent.runner_fee, # Will be recalculated
        total_price=parent.runner_fee, # Will be recalculated
        status=parent.status,
        step=parent.step,
        items=[], # Joining nomad adds their own items later
        is_shared=True,
        parent_waka_id=parent.id,
        original_runner_fee=parent.original_runner_fee or parent.runner_fee
    )
    db.add(child)
    await db.commit()
    await db.refresh(child)
    
    # 4. Trigger Fee Recalculation
    # Find all siblings (including the new child)
    all_participants_stmt = select(Waka).where(
        (Waka.id == parent.id) | (Waka.parent_waka_id == parent.id)
    )
    p_res = await db.execute(all_participants_stmt)
    participants = p_res.scalars().all()
    num_p = len(participants)
    
    base_fee = float(parent.original_runner_fee or parent.runner_fee)
    split_fee = base_fee / num_p
    
    for p in participants:
        p.runner_fee = split_fee
        p.total_price = split_fee + float(p.flash_incentive or 0)
        
    await db.commit()
    
    # 5. Notify Parent Nomad & Runner
    await notify_user(
        db=db,
        user=parent.employer,
        title="Someone Joined Your Group! 🤝",
        body=f"{current_user.full_name} has joined your shared errand to {parent.category}. Your fee is now ₦{split_fee:,.2f}!",
        type="success"
    )
    if parent.runner:
        await notify_user(
            db=db,
            user=parent.runner,
            title="Group Size Increased!",
            body=f"{current_user.full_name} joined the errand to {parent.category}. More delivery stops added!",
            type="info"
        )
        
    return await get_hydrated_waka(db, child.id)
