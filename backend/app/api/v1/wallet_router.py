from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.user import User
from ...models.wallet import Wallet, Transaction, Payment, PaymentMethod
from ...schemas import wallet as schemas
from .deps import get_current_user
from uuid import UUID
import uuid

router = APIRouter()

@router.get("/{user_id}/balance")
async def get_balance(
    user_id: UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalars().first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return {"balance": wallet.balance, "currency": wallet.currency}

@router.get("/{user_id}/transactions")
async def get_transactions(
    user_id: UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    result = await db.execute(
        select(Transaction)
        .join(Wallet)
        .where(Wallet.user_id == user_id)
        .order_by(Transaction.created_at.desc())
    )
    return result.scalars().all()

@router.get("/payment-methods", response_model=list[schemas.PaymentMethod])
async def get_payment_methods(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(PaymentMethod)
        .where(
            PaymentMethod.user_id == current_user.id,
            PaymentMethod.is_deleted == False
        )
        .order_by(PaymentMethod.is_default.desc(), PaymentMethod.created_at.desc())
    )
    return result.scalars().all()

@router.post("/payment-methods", response_model=schemas.PaymentMethod)
async def add_payment_method(
    method_in: schemas.PaymentMethodCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If this is set as default, unset others
    if method_in.is_default:
        await db.execute(
            PaymentMethod.__table__.update()
            .where(PaymentMethod.user_id == current_user.id)
            .values(is_default=False)
        )
    
    new_method = PaymentMethod(
        user_id=current_user.id,
        **method_in.model_dump()
    )
    db.add(new_method)
    await db.commit()
    await db.refresh(new_method)
    return new_method

@router.delete("/payment-methods/{method_id}")
async def delete_payment_method(
    method_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(PaymentMethod).where(
            PaymentMethod.id == method_id,
            PaymentMethod.user_id == current_user.id
        )
    )
    method = result.scalars().first()
    if not method or method.is_deleted:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    method.soft_delete()
    await db.commit()
    return {"status": "deleted"}

@router.post("/fund", response_model=schemas.Payment)
async def fund_wallet(
    payment_in: schemas.PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get wallet
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = result.scalars().first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    # Check for existing idempotency key
    result = await db.execute(
        select(Payment).where(Payment.idempotency_key == payment_in.idempotency_key)
    )
    existing_payment = result.scalars().first()
    if existing_payment:
        # Verify it belongs to the same user/wallet
        if existing_payment.wallet_id != wallet.id:
            raise HTTPException(status_code=400, detail="Idempotency key mismatch")
        return existing_payment

    # Start transaction for atomic operations
    # Create Payment (Pending)
    new_payment = Payment(
        wallet_id=wallet.id,
        amount=payment_in.amount,
        currency=payment_in.currency,
        type=payment_in.type,
        idempotency_key=payment_in.idempotency_key,
        method_id=payment_in.method_id,
        status="pending"
    )
    db.add(new_payment)
    await db.flush() # Get ID

    # Simulate provider success for now (In real world, this happens after webhook or redirect)
    # Move to success and create transaction
    new_payment.status = "success"
    new_payment.provider_reference = f"REF-{uuid.uuid4().hex[:12].upper()}"
    
    prev_balance = wallet.balance
    wallet.balance += payment_in.amount
    
    new_txn = Transaction(
        wallet_id=wallet.id,
        payment_id=new_payment.id,
        amount=payment_in.amount,
        type=f"fund_{payment_in.type}",
        reference=new_payment.provider_reference,
        is_completed=True,
        previous_balance=prev_balance,
        new_balance=wallet.balance
    )
    db.add(new_txn)
    
    await db.commit()
    await db.refresh(new_payment)
    return new_payment

@router.get("/transactions/{transaction_id}", response_model=schemas.Transaction)
async def get_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Transaction)
        .join(Wallet)
        .where(
            Transaction.id == transaction_id,
            Wallet.user_id == current_user.id
        )
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn
