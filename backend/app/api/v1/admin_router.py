from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import joinedload
from ...database import get_db
from ...models.user import User, UserRole, RunnerApplication
from ...schemas.user import UserResponse, RunnerApplicationResponse, RoleUpdate, AdminUserResponse
from ...api.v1.deps import get_current_user
from typing import List
import uuid

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have admin permissions"
        )
    return current_user

def require_super_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have super admin permissions"
        )
    return current_user

@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all users in the system."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    # We use the existing hydrate logic from auth_router if needed, 
    # but for bulk list we'll keep it simple or import the util.
    # Note: For now, I'll return simple responses or implement basic hydration here.
    return users

@router.get("/runner-applications", response_model=List[RunnerApplicationResponse])
async def get_runner_applications(
    status_filter: str = "pending",
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all runner applications, filtered by status."""
    result = await db.execute(
        select(RunnerApplication)
        .options(joinedload(RunnerApplication.user))
        .where(RunnerApplication.status == status_filter)
        .order_by(RunnerApplication.created_at.desc())
    )
    apps = result.scalars().all()
    
    # Flatten response to include full_name
    resp = []
    for app in apps:
        resp.append(RunnerApplicationResponse(
            id=app.id,
            user_id=app.user_id,
            full_name=app.user.full_name,
            bvn=app.bvn,
            home_address=app.home_address,
            transport_mode=app.transport_mode,
            hourly_rate=app.hourly_rate,
            verification_method=app.verification_method,
            status=app.status,
            created_at=app.created_at
        ))
    return resp

@router.post("/runner-applications/{app_id}/review")
async def review_runner_application(
    app_id: uuid.UUID,
    approved: bool,
    admin_note: str = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Approve or reject a runner application."""
    result = await db.execute(select(RunnerApplication).where(RunnerApplication.id == app_id))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app.status = "approved" if approved else "rejected"
    app.admin_note = admin_note
    app.reviewed_by = admin.id
    
    if approved:
        # Update user status
        user_result = await db.execute(select(User).where(User.id == app.user_id))
        user = user_result.scalars().first()
        if user:
            user.is_runner = True
            if app.hourly_rate:
                user.hourly_rate = app.hourly_rate
            
    await db.commit()
    return {"status": "success", "application_status": app.status}

@router.post("/users/{user_id}/role")
async def update_user_role(
    user_id: uuid.UUID,
    role_update: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Assign a role to a user (Super Admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if role_update.role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    user.role = role_update.role
    await db.commit()
    return {"status": "success", "new_role": user.role}
