from exponent_server_sdk import PushClient, PushMessage, PushServerError
from typing import List, Optional
from ..core.config import settings

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
