from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

class PaymentMethodBase(BaseModel):
    type: str
    provider: str
    label: str
    last4: Optional[str] = None
    brand: Optional[str] = None
    is_default: bool = False

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethod(PaymentMethodBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaymentBase(BaseModel):
    amount: Decimal
    currency: str = "NGN"
    type: str # funding, waka_payment, refund
    idempotency_key: str

class PaymentCreate(PaymentBase):
    method_id: Optional[UUID] = None

class Payment(PaymentBase):
    id: UUID
    wallet_id: UUID
    status: str
    provider_reference: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class TransactionBase(BaseModel):
    amount: Decimal
    type: str
    reference: str
    is_completed: bool

class Transaction(TransactionBase):
    id: UUID
    wallet_id: UUID
    payment_id: Optional[UUID] = None
    previous_balance: Decimal
    new_balance: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WalletBase(BaseModel):
    balance: Decimal
    currency: str

class Wallet(WalletBase):
    id: UUID
    user_id: UUID
    virtual_account_number: Optional[str] = None
    virtual_bank_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
