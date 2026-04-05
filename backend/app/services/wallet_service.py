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
        reference: str
    ) -> bool:
        """
        Atomically transfers funds between two user wallets.
        Returns True if successful, False if insufficient funds.
        """
        if amount <= 0:
            return True
            
        # 1. Check for existing transaction (Idempotency)
        # Type can be "waka_sourcing" or "waka_fee"
        existing_stmt = select(Transaction).where(Transaction.reference == reference)
        existing_res = await db.execute(existing_stmt)
        if existing_res.scalars().first():
            return True # Already processed

        # 2. Get both wallets
        from_wallet = await WalletService.get_wallet(db, from_user_id)
        to_wallet = await WalletService.get_wallet(db, to_user_id)

        # 3. Check balance
        if from_wallet.balance < amount:
            return False

        # 4. Perform Transfer
        from_prev = from_wallet.balance
        to_prev = to_wallet.balance
        
        from_wallet.balance -= float(amount)
        to_wallet.balance += float(amount)

        # 5. Create Transactions
        # Debit from Nomad
        debit_txn = Transaction(
            wallet_id=from_wallet.id,
            amount=float(amount),
            type=f"{tx_type}_debit",
            reference=f"{reference}_debit",
            is_completed=True,
            previous_balance=from_prev,
            new_balance=from_wallet.balance
        )
        # Credit to Runner
        credit_txn = Transaction(
            wallet_id=to_wallet.id,
            amount=float(amount),
            type=f"{tx_type}_credit",
            reference=f"{reference}_credit",
            is_completed=True,
            previous_balance=to_prev,
            new_balance=to_wallet.balance
        )
        
        db.add(debit_txn)
        db.add(credit_txn)
        
        # We also create a unique constraint transaction for the whole operation if needed,
        # but the unique 'reference' on debit_txn usually suffices.
        # To be extra safe with idempotency:
        idempotency_txn = Transaction(
            wallet_id=from_wallet.id,
            amount=0,
            type="idempotency_marker",
            reference=reference,
            is_completed=True,
            previous_balance=from_prev,
            new_balance=from_prev
        )
        db.add(idempotency_txn)

        await db.flush()
        return True

wallet_service = WalletService()
