from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.user import User
from ...models.wallet import Wallet
from ...schemas.user import UserCreate, UserResponse, Token, UserLogin
from ...core.security import get_password_hash, create_access_token, verify_password
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.phone_number == user_in.phone_number))
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="The user with this phone number already exists in the system.",
        )
    
    # Create User
    db_obj = User(
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        password_hash=get_password_hash(user_in.password),
        email=user_in.email,
    )
    db.add(db_obj)
    await db.flush() # Get user id

    # Create Wallet
    wallet = Wallet(user_id=db_obj.id)
    db.add(wallet)
    
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone_number == form_data.username))
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
        )
    
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }

@router.post("/token", response_model=Token)
async def login_json(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone_number == user_in.phone_number))
    user = result.scalars().first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
        )
    
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }
