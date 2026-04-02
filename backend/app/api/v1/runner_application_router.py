from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.user import User, RunnerApplication, RunnerProfile
from ...schemas.runner_application import (
    RunnerApplicationCreate,
    RunnerApplicationResponse,
    RunnerApplicationAdminUpdate,
)
from .deps import get_current_user
from ...services.notification_service import notify_user
import uuid
from typing import List

router = APIRouter()


@router.post("/apply", response_model=RunnerApplicationResponse)
async def apply_to_become_runner(
    app_in: RunnerApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a runner application. Users may only have one pending application."""
    # Block if already a runner
    if current_user.is_runner:
        raise HTTPException(status_code=400, detail="You are already a runner.")

    # Block duplicate pending applications
    existing = await db.execute(
        select(RunnerApplication).where(
            RunnerApplication.user_id == current_user.id,
            RunnerApplication.status == "pending",
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="You already have a pending application.")

    application = RunnerApplication(
        user_id=current_user.id,
        bvn=app_in.bvn,
        home_address=app_in.home_address,
        transport_mode=app_in.transport_mode,
        verification_method=app_in.verification_method,
        status="pending",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    # Notify User
    await notify_user(
        db=db,
        user=current_user,
        title="Application Received",
        body="We've received your runner application and will review it soon.",
        type="info",
        linked_entity_id=application.id,
        linked_entity_type="runner_application"
    )
    await db.commit()
    return application


@router.get("/my-application", response_model=RunnerApplicationResponse)
async def get_my_application(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's most recent runner application."""
    result = await db.execute(
        select(RunnerApplication)
        .where(RunnerApplication.user_id == current_user.id)
        .order_by(RunnerApplication.created_at.desc())
    )
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="No application found.")
    return application


# ── Admin endpoint ──────────────────────────────────────────────────────────

@router.patch("/{application_id}/review", response_model=RunnerApplicationResponse)
async def review_application(
    application_id: uuid.UUID,
    update: RunnerApplicationAdminUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    # TODO: replace with is_admin dependency when admin system is implemented
):
    """Admin-only: approve or reject a runner application.
    On approval → sets user.is_runner = True and creates a RunnerProfile if missing.
    """
    result = await db.execute(
        select(RunnerApplication).where(RunnerApplication.id == application_id)
    )
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    application.status = update.status
    application.admin_note = update.admin_note
    application.reviewed_by = current_user.id

    if update.status == "approved":
        # Flip the is_runner flag on the user
        user_result = await db.execute(select(User).where(User.id == application.user_id))
        user = user_result.scalars().first()
        if user:
            user.is_runner = True

            # Auto-create a RunnerProfile if one doesn't exist yet
            profile_result = await db.execute(
                select(RunnerProfile).where(RunnerProfile.user_id == user.id)
            )
            if not profile_result.scalars().first():
                db.add(RunnerProfile(user_id=user.id))

        # Notify User of Status Update
        title = "Application Approved! 🎉" if update.status == "approved" else "Application Update"
        body = "Congratulations! You are now a SendAm runner." if update.status == "approved" else f"Your application status is now: {update.status}."
        if update.admin_note:
            body += f" Note: {update.admin_note}"
            
        await notify_user(
            db=db,
            user=user,
            title=title,
            body=body,
            type="success" if update.status == "approved" else "warning",
            linked_entity_id=application.id,
            linked_entity_type="runner_application"
        )

    await db.commit()
    await db.refresh(application)
    return application


@router.get("/pending", response_model=List[RunnerApplicationResponse])
async def list_pending_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin-only: list all pending applications."""
    result = await db.execute(
        select(RunnerApplication)
        .where(RunnerApplication.status == "pending")
        .order_by(RunnerApplication.created_at.asc())
    )
    return result.scalars().all()
