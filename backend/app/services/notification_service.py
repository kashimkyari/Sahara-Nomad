from exponent_server_sdk import PushClient, PushMessage, PushServerError
from typing import List, Optional
from ..core.config import settings
from ..models.notification import InAppNotification
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

def send_push_notification(token: str, title: str, body: str, data: Optional[dict] = None):
    try:
        response = PushClient().publish(
            PushMessage(to=token,
                        title=title,
                        body=body,
                        data=data)
        )
    except PushServerError as exc:
        # Enforce error logging in production
        print(f"Push Notification Error: {exc}")
    except Exception as exc:
        print(f"Unknown Push Error: {exc}")

def broadcast_to_runners(tokens: List[str], title: str, body: str, waka_id: str):
    for token in tokens:
        send_push_notification(token, title, body, {"waka_id": waka_id})

from ..models.user import User

async def create_in_app_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    body: str,
    type: str = "info",
    linked_entity_id: uuid.UUID = None,
    linked_entity_type: str = None
):
    note = InAppNotification(
        user_id=user_id,
        title=title,
        body=body,
        type=type,
        linked_entity_id=linked_entity_id,
        linked_entity_type=linked_entity_type
    )
    db.add(note)
    await db.flush()
    return note

async def notify_user(
    db: AsyncSession,
    user: User,
    title: str,
    body: str,
    type: str = "info",
    linked_entity_id: uuid.UUID = None,
    linked_entity_type: str = None,
    send_push: bool = True,
    send_in_app: bool = True
):
    """Unified notification dispatcher. Creates in-app record and optionally sends push."""
    # 1. Conditionally create in-app notification
    if send_in_app:
        await create_in_app_notification(
            db, user.id, title, body, type, linked_entity_id, linked_entity_type
        )
    
    # 2. Conditional Push Notification
    if send_push and user.push_notifications_enabled and user.expo_push_token:
        send_push_notification(
            user.expo_push_token,
            title,
            body,
            {
                "type": type,
                "linked_entity_id": str(linked_entity_id) if linked_entity_id else None,
                "linked_entity_type": linked_entity_type
            }
        )
