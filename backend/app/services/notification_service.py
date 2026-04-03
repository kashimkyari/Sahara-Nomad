from typing import List, Optional
from ..core.config import settings
from ..models.notification import InAppNotification
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import requests
import json

def send_push_notification(token: str, title: str, body: str, data: Optional[dict] = None, category_id: Optional[str] = None):
    try:
        # Expo Push API URL
        url = "https://exp.host/--/api/v2/push/send"
        
        # Prepare payload
        payload = {
            "to": token,
            "title": title,
            "body": body,
            "data": data,
            "sound": "default"
        }
        
        if category_id:
            payload["categoryId"] = category_id
            payload["mutableContent"] = True
            
        # Support image/avatar
        if data and "sender_avatar_url" in data:
            avatar_url = data["sender_avatar_url"]
            if avatar_url:
                # Prepend API URL if it's a relative path
                full_avatar_url = avatar_url if avatar_url.startswith('http') else f"{settings.API_BASE_URL}{avatar_url}"
                payload["image"] = full_avatar_url
                # iOS requires 'attachments' for rich notifications
                payload["attachments"] = [{"url": full_avatar_url}]
                # Redundantly add to data for certain frontend listeners/extensions
                if data is not None:
                    data["image"] = full_avatar_url
                    data["avatar_url"] = full_avatar_url
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate",
        }
        
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        
        print(f"Push Notification Sent Success: {title} -> {token}")
        return response.json()

    except Exception as exc:
        print(f"Push Notification Dispatch Error: {exc}")
        return None

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
    send_in_app: bool = True,
    category_id: Optional[str] = None,
    extra_data: Optional[dict] = None
):
    """Unified notification dispatcher. Creates in-app record and optionally sends push."""
    # 1. Conditionally create in-app notification
    if send_in_app:
        await create_in_app_notification(
            db, user.id, title, body, type, linked_entity_id, linked_entity_type
        )
    
    # 2. Conditional Push Notification
    if send_push and user.push_notifications_enabled and user.expo_push_token:
        # Merge data
        payload = {
            "type": type,
            "linked_entity_id": str(linked_entity_id) if linked_entity_id else None,
            "linked_entity_type": linked_entity_type
        }
        if extra_data:
            payload.update(extra_data)

        send_push_notification(
            user.expo_push_token,
            title,
            body,
            payload,
            category_id=category_id
        )
