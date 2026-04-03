import asyncio
import uuid
from app.database import SessionLocal
from app.models.waka import Waka
from app.models.user import User
from sqlalchemy import select

async def create_test_wakas():
    async with SessionLocal() as db:
        # Find any employer
        res = await db.execute(select(User).where(User.is_runner == False).limit(1))
        employer = res.scalars().first()
        if not employer:
            print("No employer found. Creating one.")
            employer = User(
                id=uuid.uuid4(),
                full_name="Test Employer",
                phone_number="+2348000000001",
                password_hash="...",
                is_otp_verified=True,
                is_verified=True
            )
            db.add(employer)
            await db.commit()
            await db.refresh(employer)

        # Create 3 available wakas
        categories = ["package", "market", "food"]
        descriptions = [
            "Pick up laptop from Ikeja City Mall",
            "Buy 2 baskets of tomatoes from Mile 12",
            "Pick up 4 orders of Suya from University Road"
        ]
        
        for i in range(3):
            waka = Waka(
                id=uuid.uuid4(),
                employer_id=employer.id,
                category=categories[i],
                item_description=descriptions[i],
                pickup_address="Ikeja, Lagos",
                dropoff_address="Surulere, Lagos",
                urgency="standard",
                runner_fee=1200.0,
                flash_incentive=0.0,
                total_price=1200.0,
                status="finding_runner",
                step=1
            )
            db.add(waka)
        
        await db.commit()
        print("Created 3 available wakas successfully.")

if __name__ == "__main__":
    asyncio.run(create_test_wakas())
