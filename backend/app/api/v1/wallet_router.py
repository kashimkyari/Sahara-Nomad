from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.wallet import Wallet, Transaction
from uuid import UUID

router = APIRouter()

@router.get("/{user_id}/balance")
async def get_balance(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalars().first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return {"balance": wallet.balance, "currency": wallet.currency}

@router.get("/{user_id}/transactions")
async def get_transactions(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transaction)
        .join(Wallet)
        .where(Wallet.user_id == user_id)
        .order_by(Transaction.created_at.desc())
    )
    return result.scalars().all()
