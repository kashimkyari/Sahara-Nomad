from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import Optional
from .base import AuditableBase

class Wallet(AuditableBase):
    __tablename__ = "wallets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    currency: Mapped[str] = mapped_column(String(3), default="NGN")
    
    virtual_account_number: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True)
    virtual_bank_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="wallet")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="wallet")

class Transaction(AuditableBase):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("wallets.id"))
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    
    type: Mapped[str] = mapped_column(String(50)) # fund_bank, fund_card, fund_ussd, waka_payment, waka_refund
    reference: Mapped[str] = mapped_column(String(100), unique=True)
    
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="transactions")
