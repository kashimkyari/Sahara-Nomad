from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from ...database import get_db
from ...models.user import User
from ...models.wallet import Wallet, Transaction
from ...models.waka import Waka
from ...models.review import Review
from ...schemas.user import UserCreate, UserResponse, Token, UserLogin, OTPVerify, UserUpdate, TokenRefresh
from ...schemas.review import ReviewBase, ReviewCreate, ReviewResponse
from ...core.security import get_password_hash, create_access_token, create_refresh_token, verify_password
from .deps import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from geoalchemy2 import Geometry

from datetime import datetime, timedelta
import random
import uuid
import os
import shutil
from fastapi import File, UploadFile
from fastapi.responses import FileResponse, RedirectResponse

UPLOAD_DIR = "uploads/avatars"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

from ...services.market_service import MarketService

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
    
    # Referral tracking
    referred_by_id = None
    if user_in.referral_code:
        referrer_stmt = select(User).where(User.referral_code == user_in.referral_code)
        referrer = (await db.execute(referrer_stmt)).scalars().first()
        if referrer:
            referred_by_id = referrer.id

    # Create User (unverified)
    db_obj = User(
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        password_hash=get_password_hash(user_in.password),
        email=user_in.email,
        is_otp_verified=False,
        is_verified=False,
        otp_code="123456",
        otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
        referral_code=uuid.uuid4().hex[:8].upper(),
        referred_by_id=referred_by_id
    )
    db.add(db_obj)
    await db.flush()
    # No default avatar url anymore, let frontend fallback handle it if none uploaded

    # Create Wallet
    wallet = Wallet(user_id=db_obj.id)
    db.add(wallet)
    
    await db.commit()
    await db.refresh(db_obj)

    # Welcome Notification
    from ...services.notification_service import notify_user
    await notify_user(
        db=db,
        user=db_obj,
        title="Welcome to SendAm!",
        body="Your account is ready. Start posting errands or apply to be a runner!",
        type="info"
    )
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
            "refresh_token": create_refresh_token(user.id),
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
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }

async def _hydrate_user_response(user: User, db: AsyncSession) -> UserResponse:
    # Ensure relationships are loaded and fetch lat/lng
    result = await db.execute(
        select(
            User,
            func.ST_Y(func.cast(User.last_location, Geometry)).label("lat"),
            func.ST_X(func.cast(User.last_location, Geometry)).label("lng")
        )
        .options(
            selectinload(User.reviews_received).selectinload(Review.reviewer)
        )
        .where(User.id == user.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
        
    user, lat, lng = row
    
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
    resp.latitude = lat
    resp.longitude = lng
    
    # Populate runner_profile if is_runner
    from ...schemas.user import RunnerProfileResponse
    if user.is_runner:
        # Dynamically calculate stats_trips (completed) and active_wakas (not completed)
        trips_result = await db.execute(
            select(func.count(Waka.id))
            .where(Waka.runner_id == user.id, Waka.is_completed == True)
        )
        stats_trips = trips_result.scalar() or 0

        active_result = await db.execute(
            select(func.count(Waka.id))
            .where(Waka.runner_id == user.id, Waka.is_completed == False)
        )
        active_wakas = active_result.scalar() or 0

        resp.runner_profile = RunnerProfileResponse(
            bio=user.bio,
            hourly_rate=float(user.hourly_rate) if user.hourly_rate else 0.0,
            stats_trips=stats_trips,
            stats_rating=float(user.stats_rating),
            active_wakas=active_wakas,
            is_online=user.is_online
        )

    # Populate reviewer names for user reviews if they exist
    if user.reviews_received:
        for review in user.reviews_received:
            if hasattr(review, 'reviewer') and review.reviewer:
                review.reviewer_name = review.reviewer.full_name
    
    return resp

@router.post("/refresh-token", response_model=Token)
async def refresh_token(token_in: TokenRefresh, db: AsyncSession = Depends(get_db)):
    """Refresh access token using a refresh token."""
    from jose import jwt, JWTError
    from ...core.config import settings
    
    try:
        payload = jwt.decode(
            token_in.refresh_token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM]
        )
        token_type = payload.get("type")
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token",
        )
    
    # Check if user exists and is not deleted
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or user.is_user_deleted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deleted",
        )
    
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": token_in.refresh_token, # Keep using the same refresh token or issue a new one
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User)
        .options(
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
            selectinload(User.reviews_received).selectinload(Review.reviewer)
        )
        .where(User.id == runner_id)
    )
    user = result.scalars().first()
    if not user or not user.is_runner:
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
    for field in ["full_name", "email", "push_notifications_enabled", "location_services_enabled", "is_dark_mode", "language", "region", "city", "expo_push_token", "bio", "hourly_rate", "is_online", "is_available"]:
        if field in update_data:
            setattr(current_user, field, update_data[field])
            
    # Handle Location Updates
    if "latitude" in update_data and "longitude" in update_data:
        lat = update_data["latitude"]
        lng = update_data["longitude"]
        if lat is not None and lng is not None:
            point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
            current_user.last_location = point
            
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

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Log out the current user."""
    # Since we are using stateless JWT, we just return success.
    # In the future, we could add the token to a denylist.
    return {"status": "logged_out"}

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
async def get_user_avatar(user_id: uuid.UUID):
    # Find the file that starts with user id
    if os.path.exists(UPLOAD_DIR):
        for f in os.listdir(UPLOAD_DIR):
            if f.startswith(str(user_id)):
                return FileResponse(os.path.join(UPLOAD_DIR, f))
    
    # Fallback: Redirect to a high-quality placeholder if no file found
    return RedirectResponse(url=f"https://i.pravatar.cc/150?u={user_id}")

@router.get("/me/avatarurl")
async def get_avatar(current_user: User = Depends(get_current_user)):
    return await get_user_avatar(current_user.id, current_user)

# --- SAVED ADDRESSES ---
from ...schemas.user import UserAddressCreate, UserAddressResponse
from ...models.user import UserAddress

@router.get("/addresses", response_model=list[UserAddressResponse])
async def get_saved_addresses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns list of saved addresses for the user."""
    result = await db.execute(
        select(UserAddress).where(UserAddress.user_id == current_user.id)
    )
    return result.scalars().all()

@router.post("/addresses", response_model=UserAddressResponse)
async def add_saved_address(
    address_in: UserAddressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adds a new saved address."""
    # If set as default, unset others
    if address_in.is_default:
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == current_user.id)
            .values(is_default=False)
        )
    
    new_address = UserAddress(
        user_id=current_user.id,
        label=address_in.label,
        address=address_in.address,
        lat=address_in.lat,
        lng=address_in.lng,
        is_default=address_in.is_default
    )
    db.add(new_address)
    await db.commit()
    await db.refresh(new_address)
    return new_address

@router.delete("/addresses/{address_id}")
async def delete_saved_address(
    address_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a saved address."""
    stmt = select(UserAddress).where(
        UserAddress.id == address_id,
        UserAddress.user_id == current_user.id
    )
    result = await db.execute(stmt)
    address = result.scalar_one_or_none()
    
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
        
    await db.delete(address)
    await db.commit()
    return {"status": "deleted"}
