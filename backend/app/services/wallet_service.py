from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..models.wallet import Wallet, Transaction
from ..models.user import User
from decimal import Decimal
import uuid
from typing import Optional
from fastapi import HTTPException

class WalletService:
    @staticmethod
    async def get_wallet(db: AsyncSession, user_id: uuid.UUID) -> Wallet:
        result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
        wallet = result.scalars().first()
        if not wallet:
            # Fallback: create wallet if missing (shouldn't happen with signup logic)
            wallet = Wallet(user_id=user_id)
            db.add(wallet)
            await db.flush()
        return wallet

    @staticmethod
    async def transfer_funds(
        db: AsyncSession,
        from_user_id: uuid.UUID,
        to_user_id: uuid.UUID,
        amount: Decimal,
        tx_type: str,
        reference: str,
        is_cash: bool = False,
        commission_rate: Decimal = Decimal("0.0")
    ) -> bool:
        """
        Atomically transfers funds between two user wallets, optionally taking commission.
        """
        if amount <= 0:
            return True
            
        # 1. Check for existing transaction (Idempotency)
        existing_stmt = select(Transaction).where(Transaction.reference == reference)
        existing_res = await db.execute(existing_stmt)
        if existing_res.scalars().first():
            return True

        # 2. Calculate split
        platform_fee = (amount * commission_rate).quantize(Decimal("0.01"))
        net_amount = amount - platform_fee

        # 3. Get wallets
        from_wallet = await WalletService.get_wallet(db, from_user_id)
        to_wallet = await WalletService.get_wallet(db, to_user_id)
        
        # System wallet for revenue
        from ..core.config import settings
        system_user_id = uuid.UUID(settings.SYSTEM_USER_ID)
        system_wallet = await WalletService.get_wallet(db, system_user_id)

        # 4. Check balance
        if not is_cash and from_wallet.balance < amount:
            return False
            
        # 5. Perform Transfer
        from_prev = from_wallet.balance
        to_prev = to_wallet.balance
        sys_prev = system_wallet.balance
        
        if not is_cash:
            from_wallet.balance -= float(amount)
            to_wallet.balance += float(net_amount)
            system_wallet.balance += float(platform_fee)
            
        # 6. Create Transactions
        # Debit from Nomad
        db.add(Transaction(
            wallet_id=from_wallet.id,
            amount=float(amount),
            type=f"{tx_type}_debit",
            reference=f"{reference}_debit",
            is_completed=True,
            is_cash=is_cash,
            previous_balance=from_prev,
            new_balance=from_wallet.balance if not is_cash else from_prev
        ))
        
        # Credit to Runner (Net)
        db.add(Transaction(
            wallet_id=to_wallet.id,
            amount=float(net_amount),
            type=f"{tx_type}_credit",
            reference=f"{reference}_credit",
            is_completed=True,
            is_cash=is_cash,
            previous_balance=to_prev,
            new_balance=to_wallet.balance if not is_cash else to_prev
        ))
        
        # Credit to System (Commission)
        if platform_fee > 0:
            db.add(Transaction(
                wallet_id=system_wallet.id,
                amount=float(platform_fee),
                type="platform_commission",
                reference=f"{reference}_commission",
                is_completed=True,
                is_cash=is_cash,
                previous_balance=sys_prev,
                new_balance=system_wallet.balance if not is_cash else sys_prev
            ))
        
        # Idempotency marker
        db.add(Transaction(
            wallet_id=from_wallet.id,
            amount=0,
            is_cash=is_cash,
            type="idempotency_marker",
            reference=reference,
            is_completed=True,
            previous_balance=from_prev,
            new_balance=from_prev
        ))
        
    @staticmethod
    async def release_milestone(
        db: AsyncSession,
        waka_id: uuid.UUID,
        milestone_index: int,
        employer_id: uuid.UUID,
        runner_id: uuid.UUID,
        amount: float,
        reference: str
    ) -> bool:
        """
        Releases a milestone payment from employer to runner.
        """
        return await WalletService.transfer_funds(
            db=db,
            from_user_id=employer_id,
            to_user_id=runner_id,
            amount=Decimal(str(amount)),
            tx_type="milestone_release",
            reference=f"{reference}_milestone_{milestone_index}",
            commission_rate=Decimal("0.1") # 10% platform commission on each milestone
        )

wallet_service = WalletService()
