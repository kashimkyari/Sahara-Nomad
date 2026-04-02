from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from ...database import get_db
from ...models.user import User, RunnerProfile
from ...models.wallet import Wallet, Transaction
from ...models.waka import Waka
from ...models.review import Review
from ...schemas.user import UserCreate, UserResponse, Token, UserLogin, OTPVerify, UserUpdate
from ...schemas.review import ReviewBase, ReviewCreate, ReviewResponse
from ...core.security import get_password_hash, create_access_token, verify_password
from .deps import get_current_user
from fastapi.security import OAuth2PasswordRequestForm

from datetime import datetime, timedelta
import random
import uuid
import os
import shutil
from fastapi import File, UploadFile
from fastapi.responses import FileResponse

UPLOAD_DIR = "uploads/avatars"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

router = APIRouter()

@router.post("/signup")
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.phone_number == user_in.phone_number))
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="The user with this phone number already exists in the system.",
        )
    
    # Create User (unverified)
    db_obj = User(
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        password_hash=get_password_hash(user_in.password),
        email=user_in.email,
        is_otp_verified=False,
        is_verified=False,
        otp_code="123456",
        otp_expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(db_obj)
    await db.flush()
    # Set default avatar url based on id
    db_obj.avatar_url = f"/auth/users/{db_obj.id}/avatar"

    # Create Wallet
    wallet = Wallet(user_id=db_obj.id)
    db.add(wallet)
    
    await db.commit()
    return {"status": "otp_sent", "phone_number": user_in.phone_number}

@router.post("/token", response_model=dict)
async def login_json(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone_number == user_in.phone_number))
    user = result.scalars().first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
        )
    
    if user.is_user_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deleted",
        )
    
    if user.is_otp_verified:
        return {
            "access_token": create_access_token(user.id),
            "token_type": "bearer",
        }
    
    # Trigger OTP
    user.otp_code = "123456"
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    await db.commit()
    
    return {"status": "otp_sent", "phone_number": user_in.phone_number}

@router.post("/request-otp")
async def request_otp(phone_number: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone_number == phone_number))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.otp_code = "123456"
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    await db.commit()
    return {"status": "otp_sent", "phone_number": phone_number}

@router.post("/verify-otp", response_model=Token)
async def verify_otp(verify_in: OTPVerify, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone_number == verify_in.phone_number))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_user_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deleted",
        )
    
    if user.otp_code != verify_in.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    if user.otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP code expired")
    
    # Success
    user.is_otp_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
    
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }

async def _hydrate_user_response(user: User, db: AsyncSession) -> UserResponse:
    # Ensure relationships are loaded to avoid MissingGreenlet errors in Pydantic from_orm
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.runner_profile),
            selectinload(User.reviews_received).selectinload(Review.reviewer)
        )
        .where(User.id == user.id)
    )
    user = result.scalars().first()
    
    # Explicitly fetch wallet
    wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    wallet = wallet_result.scalars().first()
    
    spent_total = 0.0
    if wallet:
        # Calculate spent_total
        spent_result = await db.execute(
            select(func.sum(Transaction.amount))
            .where(Transaction.wallet_id == wallet.id)
            .where(Transaction.type == "waka_payment")
            .where(Transaction.is_completed == True)
        )
        spent_total = spent_result.scalar() or 0.0
    
    # Calculate errands_count
    errands_result = await db.execute(
        select(func.count(Waka.id))
        .where(Waka.employer_id == user.id)
    )
    errands_count = errands_result.scalar() or 0
    
    # Now that everything is loaded, safe to call from_orm
    resp = UserResponse.from_orm(user)
    resp.spent_total = float(spent_total)
    resp.errands_count = errands_count
    resp.wallet_balance = float(wallet.balance) if wallet else 0.0
    
    # Populate reviewer names for user reviews if they exist
    if user.reviews_received:
        for review in user.reviews_received:
            if hasattr(review, 'reviewer') and review.reviewer:
                review.reviewer_name = review.reviewer.full_name
    
    return resp

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.runner_profile),
            selectinload(User.reviews_received).selectinload(Review.reviewer)
        )
        .where(User.id == current_user.id)
    )
    current_user = result.scalars().first()
        
    return await _hydrate_user_response(current_user, db)

@router.get("/runners/{runner_id}", response_model=UserResponse)
async def get_runner_profile(runner_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.runner_profile),
            selectinload(User.reviews_received).selectinload(Review.reviewer)
        )
        .where(User.id == runner_id)
    )
    user = result.scalars().first()
    if not user or not user.runner_profile:
        raise HTTPException(status_code=404, detail="Runner not found")
        
    return await _hydrate_user_response(user, db)

@router.post("/users/{user_id}/reviews", response_model=ReviewResponse)
async def create_review(
    user_id: uuid.UUID,
    review_in: ReviewBase,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if target user exists
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    review = Review(
        target_user_id=target_user.id,
        reviewer_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(review)
    
    # Update target user average rating
    result = await db.execute(
        select(func.avg(Review.rating)).where(Review.target_user_id == target_user.id)
    )
    avg_rating = result.scalar() or review_in.rating
    target_user.stats_rating = avg_rating
    
    await db.commit()
    await db.refresh(review)
    
    review.reviewer_name = current_user.full_name
    return review

@router.patch("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    update_data = user_update.dict(exclude_unset=True)
    
    # Update User fields
    for field in ["full_name", "email", "push_notifications_enabled", "location_services_enabled", "is_dark_mode", "language", "region"]:
        if field in update_data:
            setattr(current_user, field, update_data[field])
    
    # Update RunnerProfile if bio or hourly_rate is provided
    if "bio" in update_data or "hourly_rate" in update_data:
        if not current_user.runner_profile:
            # Create runner profile if it doesn't exist (though it should be created via different flow usually, but for UX we can auto-create)
            current_user.runner_profile = RunnerProfile(user_id=current_user.id)
            db.add(current_user.runner_profile)
        
        if "bio" in update_data:
            current_user.runner_profile.bio = update_data["bio"]
        if "hourly_rate" in update_data:
            current_user.runner_profile.hourly_rate = update_data["hourly_rate"]
            
    await db.commit()
    await db.refresh(current_user)
    return await _hydrate_user_response(current_user, db)

@router.delete("/me", response_model=dict)
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Permanently delete user account (soft delete) and cancel active wakas."""
    current_user.is_user_deleted = True
    current_user.soft_delete() # sets is_deleted=True and deleted_at
    
    # Cancel all active wakas for this user
    await db.execute(
        update(Waka)
        .where(Waka.employer_id == current_user.id, Waka.is_completed == False)
        .values(status="cancelled", updated_at=func.now())
    )
    
    await db.commit()
    return {"status": "account_deleted"}

@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{current_user.id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    current_user.avatar_url = f"/auth/users/{current_user.id}/avatar"
    await db.commit()
    return {"status": "ok", "avatar_url": current_user.avatar_url}

@router.get("/users/{user_id}/avatar")
async def get_user_avatar(user_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    # Find the file that starts with user id
    for f in os.listdir(UPLOAD_DIR):
        if f.startswith(str(user_id)):
            return FileResponse(os.path.join(UPLOAD_DIR, f))
    
    raise HTTPException(status_code=404, detail="Avatar not found")

@router.get("/me/avatarurl")
async def get_avatar(current_user: User = Depends(get_current_user)):
    return await get_user_avatar(current_user.id, current_user)
