from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ...database import get_db
from ...models.user import User
from ...models.notification import InAppNotification 
from ...schemas.notification import NotificationRead
from .deps import get_current_user
from typing import List
import uuid
import arrow

router = APIRouter()

@router.get("/", response_model=List[NotificationRead])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(InAppNotification)
        .where(InAppNotification.user_id == current_user.id, InAppNotification.is_deleted == False)
        .order_by(InAppNotification.created_at.desc())
    )
    notes = result.scalars().all()
    
    formatted_notes = []
    for note in notes:
        # Format time as human-readable (e.g., "10 mins ago")
        time_human = arrow.get(note.created_at).humanize()
        
        formatted_notes.append(NotificationRead(
            id=str(note.id),
            title=note.title,
            body=note.body,
            time=time_human,
            type=note.type,
            unread=note.is_unread,
            linked_entity_id=str(note.linked_entity_id) if note.linked_entity_id else None,
            linked_entity_type=note.linked_entity_type
        ))
        
    return formatted_notes

@router.get("/{notification_id}", response_model=NotificationRead)
async def get_notification(
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
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    time_human = arrow.get(note.created_at).humanize()
    return NotificationRead(
        id=str(note.id),
        title=note.title,
        body=note.body,
        time=time_human,
        type=note.type,
        unread=note.is_unread,
        linked_entity_id=str(note.linked_entity_id) if note.linked_entity_id else None,
        linked_entity_type=note.linked_entity_type
    )

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

@router.post("/clear-all")
async def clear_all_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(InAppNotification)
        .where(InAppNotification.user_id == current_user.id)
        .values(is_deleted=True, deleted_at=arrow.now().datetime)
    )
    await db.commit()
    return {"status": "success"}

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(InAppNotification.id))
        .where(
            InAppNotification.user_id == current_user.id,
            InAppNotification.is_unread == True,
            InAppNotification.is_deleted == False
        )
    )
    count = result.scalar()
    return {"unread_count": count}
