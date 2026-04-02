from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...database import get_db
from ...models.message import Conversation, Message
from ...models.user import User
from .deps import get_current_user
import uuid
import json

router = APIRouter()

# Basic In-Memory Connection Manager for demo (Prod should use Redis as per plan)
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, convo_id: str):
        await websocket.accept()
        if convo_id not in self.active_connections:
            self.active_connections[convo_id] = []
        self.active_connections[convo_id].append(websocket)

    def disconnect(self, websocket: WebSocket, convo_id: str):
        if convo_id in self.active_connections:
            self.active_connections[convo_id].remove(websocket)

    async def broadcast(self, message: str, convo_id: str):
        if convo_id in self.active_connections:
            for connection in self.active_connections[convo_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{convo_id}")
async def websocket_endpoint(websocket: WebSocket, convo_id: str):
    await manager.connect(websocket, convo_id)
    try:
        while True:
            data = await websocket.receive_text()
            # In real impl, parse JSON, save to DB, and broadcast
            await manager.broadcast(f"Message in {convo_id}: {data}", convo_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, convo_id)

@router.get("/{convo_id}/history")
async def get_chat_history(
    convo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == convo_id, Message.is_deleted == False)
        .order_by(Message.created_at.asc())
    )
    return result.scalars().all()
