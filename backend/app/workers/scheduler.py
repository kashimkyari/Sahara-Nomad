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

async def process_escrow_auto_release():
    async with SessionLocal() as db:
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        from ..models.waka import WakaDispute
        from sqlalchemy import func
        from sqlalchemy.orm import selectinload
        
        stmt = select(Waka).options(
            selectinload(Waka.runner), 
            selectinload(Waka.employer)
        ).where(
            Waka.completed_by_runner == True,
            Waka.is_completed == False,
            Waka.updated_at <= twenty_four_hours_ago
        )
        result = await db.execute(stmt)
        pending_wakas = result.scalars().all()
        
        for waka in pending_wakas:
            dispute_stmt = select(func.count(WakaDispute.id)).where(
                WakaDispute.waka_id == waka.id,
                WakaDispute.status.in_(["open", "investigating"])
            )
            dispute_res = await db.execute(dispute_stmt)
            if dispute_res.scalar() > 0:
                continue
                
            waka.completed_by_employer = True
            waka.is_completed = True
            waka.status = "completed"
            waka.step = 5
            
            from ..services.wallet_service import wallet_service
            from decimal import Decimal
            
            commission_rate = Decimal("0.10")
            if waka.runner:
                if waka.runner.stats_trips >= 50: commission_rate = Decimal("0.05")
                elif waka.runner.stats_trips >= 10: commission_rate = Decimal("0.075")

            try:
                await wallet_service.transfer_funds(
                    db=db,
                    from_user_id=waka.employer_id,
                    to_user_id=waka.runner_id,
                    amount=waka.total_price,
                    tx_type="waka_fee",
                    reference=f"escrow_auto_{waka.id}",
                    is_cash=(waka.payment_method == "cash"),
                    commission_rate=commission_rate
                )
            except Exception as e:
                print(f"Failed to auto-release funds for waka {waka.id}: {e}")
                continue
                
            if waka.runner:
                waka.runner.stats_trips += 1
            if waka.employer:
                waka.employer.errands_count += 1
                
            from ..services.notification_service import notify_user
            for recipient in [waka.employer, waka.runner]:
                if recipient:
                    await notify_user(
                        db=db,
                        user=recipient,
                        title="Escrow Auto-Released",
                        body=f"24 hours passed with no disputes. Funds released for '{waka.item_description[:30]}...'",
                        type="success",
                        linked_entity_id=waka.id,
                        linked_entity_type="waka"
                    )
                    
        await db.commit()

async def scheduler_loop():
    while True:
        await process_scheduled_wakas()
        await process_escrow_auto_release()
        await asyncio.sleep(60) # Check every minute
