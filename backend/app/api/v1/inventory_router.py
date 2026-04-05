from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.user import User
from ...models.waka import Waka
from ...models.inventory import WakaInventoryItem
from ...schemas.inventory import InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
from .deps import get_current_user
import uuid
from typing import List

router = APIRouter()

@router.post("/propose", response_model=InventoryItemResponse)
async def propose_item(
    item_in: InventoryItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Runner proposes an item for purchase."""
    waka = await db.get(Waka, item_in.waka_id)
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    
    if waka.runner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned runner can propose items")

    db_obj = WakaInventoryItem(
        waka_id=item_in.waka_id,
        name=item_in.name,
        price=item_in.price,
        photo_url=item_in.photo_url,
        status="proposed"
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    
    # Notify Nomad
    from ...services.notification_service import notify_user
    nomad_stmt = select(User).where(User.id == waka.employer_id)
    nomad_res = await db.execute(nomad_stmt)
    nomad = nomad_res.scalars().first()
    if nomad:
        await notify_user(
            db=db,
            user=nomad,
            title="Price Update: New Item Proposed",
            body=f"Your runner has proposed '{db_obj.name}' for ₦{db_obj.price}. Tap to Approve.",
            type="info",
            linked_entity_id=waka.id,
            linked_entity_type="waka"
        )
    
    return db_obj

@router.get("/waka/{waka_id}", response_model=List[InventoryItemResponse])
async def get_waka_inventory(
    waka_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all inventory items for a waka."""
    stmt = select(WakaInventoryItem).where(WakaInventoryItem.waka_id == waka_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/{item_id}/respond", response_model=InventoryItemResponse)
async def respond_to_bid(
    item_id: uuid.UUID,
    approved: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Nomad approves or rejects a bid."""
    item = await db.get(WakaInventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    waka = await db.get(Waka, item.waka_id)
    if waka.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the nomad who posted the errand can respond to bids")

    item.status = "approved" if approved else "rejected"
    
    if approved:
        if waka.sourcing_budget is None:
            waka.sourcing_budget = 0
        waka.sourcing_budget = float(waka.sourcing_budget) + float(item.price)
        
    await db.commit()
    await db.refresh(item)
    return item
