from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.user import User
from ...models.wallet import Wallet
from ...schemas.user import UserCreate, UserResponse, Token, UserLogin, OTPVerify
from ...core.security import get_password_hash, create_access_token, verify_password
from .deps import get_current_user
from fastapi.security import OAuth2PasswordRequestForm

from datetime import datetime, timedelta
import random

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
        is_verified=False,
        otp_code="123456", # Fixed for dev, replace with random.randint(100000, 999999) later
        otp_expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(db_obj)
    await db.flush()

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
    
    # Trigger OTP
    user.otp_code = "123456"
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    await db.commit()
    
    return {"status": "otp_sent", "phone_number": user_in.phone_number}

@router.post("/verify-otp", response_model=Token)
async def verify_otp(verify_in: OTPVerify, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone_number == verify_in.phone_number))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.otp_code != verify_in.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    if user.otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP code expired")
    
    # Success
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
    
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
