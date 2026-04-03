from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, update
from ...database import get_db
from ...models.support import SupportTicket, SupportMessage
from ...models.user import User
from ...schemas.support import SupportTicketRead, SupportTicketCreate, SupportMessageRead, SupportMessageCreate
from .deps import get_current_user
import uuid
import json
from typing import List

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, ticket_id: str):
        await websocket.accept()
        if ticket_id not in self.active_connections:
            self.active_connections[ticket_id] = []
        self.active_connections[ticket_id].append(websocket)

    def disconnect(self, websocket: WebSocket, ticket_id: str):
        if ticket_id in self.active_connections:
            self.active_connections[ticket_id].remove(websocket)

    async def broadcast(self, message: str, ticket_id: str):
        if ticket_id in self.active_connections:
            for connection in self.active_connections[ticket_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.get("/", response_model=List[SupportTicketRead])
async def list_support_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all support tickets for the current user."""
    stmt = (
        select(SupportTicket)
        .where(SupportTicket.user_id == current_user.id)
        .order_by(desc(SupportTicket.last_message_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=SupportTicketRead)
async def create_support_ticket(
    ticket_in: SupportTicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new support session."""
    # Check if there's already an active ticket
    active_stmt = select(SupportTicket).where(
        SupportTicket.user_id == current_user.id,
        SupportTicket.status == "active"
    )
    active_res = await db.execute(active_stmt)
    active_ticket = active_res.scalar_one_or_none()
    
    if active_ticket:
        return active_ticket
        
    new_ticket = SupportTicket(
        user_id=current_user.id,
        subject=ticket_in.subject,
        last_message_at=func.now()
    )
    db.add(new_ticket)
    await db.commit()
    await db.refresh(new_ticket)
    return new_ticket

@router.get("/{ticket_id}/messages", response_model=List[SupportMessageRead])
async def get_support_messages(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch message history for a specific ticket."""
    ticket_stmt = select(SupportTicket).where(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == current_user.id
    )
    ticket_res = await db.execute(ticket_stmt)
    if not ticket_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Support ticket not found")
        
    msg_stmt = (
        select(SupportMessage)
        .where(SupportMessage.ticket_id == ticket_id)
        .order_by(SupportMessage.created_at.asc())
    )
    result = await db.execute(msg_stmt)
    return result.scalars().all()

@router.post("/messages", response_model=SupportMessageRead)
async def send_support_message(
    msg_in: SupportMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message in a support ticket."""
    ticket_stmt = select(SupportTicket).where(
        SupportTicket.id == msg_in.ticket_id,
        SupportTicket.user_id == current_user.id
    )
    ticket_res = await db.execute(ticket_stmt)
    ticket = ticket_res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")
        
    new_msg = SupportMessage(
        ticket_id=msg_in.ticket_id,
        sender_id=current_user.id,
        content_text=msg_in.content_text,
        attachment_url=msg_in.attachment_url
    )
    db.add(new_msg)
    
    # Update ticket last message info
    ticket.last_message_text = msg_in.content_text
    ticket.last_message_at = func.now()
    
    await db.commit()
    await db.refresh(new_msg)
    
    # Broadcast
    msg_data = SupportMessageRead.model_validate(new_msg).model_dump_json()
    await manager.broadcast(msg_data, str(msg_in.ticket_id))
    
    return new_msg

@router.websocket("/ws/{ticket_id}")
async def support_websocket_endpoint(
    websocket: WebSocket, 
    ticket_id: str,
    token: str = None,
    db: AsyncSession = Depends(get_db)
):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        from .deps import get_user_from_token
        current_user = await get_user_from_token(db, token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    # Check if user owns the ticket
    ticket_stmt = select(SupportTicket).where(
        SupportTicket.id == uuid.UUID(ticket_id),
        SupportTicket.user_id == current_user.id
    )
    ticket_res = await db.execute(ticket_stmt)
    ticket = ticket_res.scalar_one_or_none()
    
    if not ticket:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    await manager.connect(websocket, ticket_id)
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            # User sending message
            content_text = data.get("content_text")
            if not content_text: continue
            
            new_msg = SupportMessage(
                ticket_id=uuid.UUID(ticket_id),
                sender_id=current_user.id,
                content_text=content_text
            )
            db.add(new_msg)
            
            # Update ticket last message
            ticket.last_message_text = content_text
            ticket.last_message_at = func.now()
            
            await db.commit()
            await db.refresh(new_msg)
            
            # Broadcast
            msg_data = SupportMessageRead.model_validate(new_msg).model_dump_json()
            await manager.broadcast(msg_data, ticket_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, ticket_id)
    except Exception as e:
        print(f"WS Support Error: {e}")
        manager.disconnect(websocket, ticket_id)
