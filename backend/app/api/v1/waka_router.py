from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.waka import Waka
from ...schemas.waka import WakaCreate, WakaResponse
import uuid

router = APIRouter()

@router.post("/", response_model=WakaResponse)
async def create_waka(waka_in: WakaCreate, db: AsyncSession = Depends(get_db)):
    # In a real app, employer_id would come from the current user token
    # For now, using a placeholder if not provided or just demonstrating logic
    employer_id = uuid.uuid4() # Placeholder
    
    db_obj = Waka(
        employer_id=employer_id,
        category=waka_in.category,
        item_description=waka_in.item_description,
        pickup_address=waka_in.pickup.address,
        # pickup_location = ST_GeomFromText(...) logic here
        dropoff_address=waka_in.dropoff.address,
        urgency=waka_in.urgency,
        runner_fee=waka_in.base_fee,
        flash_incentive=waka_in.flash_incentive,
        total_price=waka_in.total_price,
        status="finding_runner",
        step=1
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("/{waka_id}", response_model=WakaResponse)
async def get_waka(waka_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Waka).where(Waka.id == waka_id, Waka.is_deleted == False))
    waka = result.scalars().first()
    if not waka:
        raise HTTPException(status_code=404, detail="Waka not found")
    return waka
