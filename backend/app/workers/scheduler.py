import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import SessionLocal
from ..models.scheduling import ScheduledWaka
from ..models.waka import Waka
from ..schemas.waka import WakaCreate

async def process_scheduled_wakas():
    async with SessionLocal() as db:
        now = datetime.utcnow()
        stmt = select(ScheduledWaka).where(
            ScheduledWaka.next_run <= now,
            ScheduledWaka.is_active == True,
            ScheduledWaka.is_deleted == False
        )
        result = await db.execute(stmt)
        schedules = result.scalars().all()
        
        for sched in schedules:
            # 1. Spawn Waka
            template = sched.waka_template
            new_waka = Waka(
                employer_id=sched.employer_id,
                category=template.get("category"),
                item_description=template.get("item_description"),
                pickup_address=template.get("pickup", {}).get("address"),
                dropoff_address=template.get("dropoff", {}).get("address"),
                urgency=template.get("urgency", "standard"),
                runner_fee=template.get("base_fee"),
                total_price=template.get("total_price"),
                items=template.get("items"),
                status="finding_runner"
            )
            db.add(new_waka)
            
            # 2. Update next_run
            if sched.frequency == "daily":
                sched.next_run += timedelta(days=1)
            elif sched.frequency == "weekly":
                sched.next_run += timedelta(weeks=1)
            elif sched.frequency == "monthly":
                sched.next_run += timedelta(days=30)
            
            sched.last_run = now
            
        await db.commit()

async def scheduler_loop():
    while True:
        await process_scheduled_wakas()
        await asyncio.sleep(60) # Check every minute
