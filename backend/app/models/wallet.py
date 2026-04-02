from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from typing import Optional
from .base import AuditableBase
from datetime import datetime

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
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="wallet")

class PaymentMethod(AuditableBase):
    __tablename__ = "payment_methods"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    
    type: Mapped[str] = mapped_column(String(20)) # card, bank_account
    provider: Mapped[str] = mapped_column(String(50)) # paystack, flutterwave, kuda
    
    last4: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # visa, mastercard
    label: Mapped[str] = mapped_column(String(100)) # "Kuda Bank", "GTBank Mastercard"
    
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    provider_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # For recurring charges

    user: Mapped["User"] = relationship("User")

class Payment(AuditableBase):
    """Single source of truth for all fund intents."""
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("wallets.id"), index=True)
    
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="NGN")
    
    status: Mapped[str] = mapped_column(String(20), default="pending") # pending, success, failed
    type: Mapped[str] = mapped_column(String(20)) # funding, waka_payment, refund
    
    idempotency_key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    provider_reference: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    
    method_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("payment_methods.id"), nullable=True)

    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="payments")
    payment_method: Mapped[Optional["PaymentMethod"]] = relationship("PaymentMethod")
    transaction: Mapped[Optional["Transaction"]] = relationship("Transaction", back_populates="payment", uselist=False)

class Transaction(AuditableBase):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("wallets.id"))
    payment_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True)
    
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    
    type: Mapped[str] = mapped_column(String(50)) # fund_bank, fund_card, fund_ussd, waka_payment, waka_refund
    reference: Mapped[str] = mapped_column(String(100), unique=True)
    
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Audit fields for balance tracing
    previous_balance: Mapped[float] = mapped_column(Numeric(12, 2))
    new_balance: Mapped[float] = mapped_column(Numeric(12, 2))

    wallet: Mapped["Wallet"] = relationship("Wallet", back_populates="transactions")
    payment: Mapped[Optional["Payment"]] = relationship("Payment", back_populates="transaction")
