from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.user import User
# Assuming we have an InAppNotification model in models/user.py or similar
from ...models.notification import InAppNotification 
from .deps import get_current_user
from typing import List
import uuid

router = APIRouter()

@router.get("/", response_model=List[dict]) # Use dict or proper schema if created
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(InAppNotification)
        .where(InAppNotification.user_id == current_user.id, InAppNotification.is_deleted == False)
        .order_by(InAppNotification.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(InAppNotification).where(
            InAppNotification.id == notification_id, 
            InAppNotification.user_id == current_user.id
        )
    )
    notification = result.scalars().first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_unread = False
    await db.commit()
    return {"status": "success"}
