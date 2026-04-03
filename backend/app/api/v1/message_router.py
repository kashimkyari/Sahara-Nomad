from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, update, func
from ...database import get_db
from ...models.message import Conversation, Message
from ...models.user import User
from ...models.waka import Waka
from ...schemas.message import ConversationRead, ConversationCreate, MessageRead, MessageCreate, ConversationHistory
from ...schemas.user import UserInfo
from .deps import get_current_user
from ...services.notification_service import notify_user
import json
import uuid
import json

router = APIRouter()

async def enrich_conversation(db: AsyncSession, conv: Conversation, current_user: User) -> ConversationRead:
    """Enrich a conversation with other_user info, unread count, and waka info."""
    other_user_id = conv.runner_id if conv.employer_id == current_user.id else conv.employer_id
    
    # Get other user info
    other_user_stmt = select(User).where(User.id == other_user_id)
    other_user_res = await db.execute(other_user_stmt)
    other_user = other_user_res.scalar_one_or_none()
    
    # Count unread messages (where sender is NOT current_user and is_read is False)
    unread_stmt = (
        select(func.count(Message.id))
        .where(
            and_(
                Message.conversation_id == conv.id,
                Message.sender_id != current_user.id,
                Message.is_read == False
            )
        )
    )
    unread_res = await db.execute(unread_stmt)
    unread_count = unread_res.scalar() or 0
    
    # Get Waka info if available
    waka_title = None
    waka_emoji = None
    if conv.waka_id:
        waka_stmt = select(Waka).where(Waka.id == conv.waka_id)
        waka_res = await db.execute(waka_stmt)
        waka = waka_res.scalar_one_or_none()
        if waka:
            waka_title = waka.item_description
            waka_emoji = "🛒" # Default emoji for errands
    
    # Determine status of the last message (sent by current_user)
    last_msg_status = None
    last_msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    last_msg_res = await db.execute(last_msg_stmt)
    last_msg = last_msg_res.scalar_one_or_none()
    if last_msg and last_msg.sender_id == current_user.id:
        last_msg_status = "read" if last_msg.is_read else "sent"
        
    conv_dict = ConversationRead.model_validate(conv)
    conv_dict.unread_count = unread_count
    conv_dict.waka_title = waka_title
    conv_dict.waka_emoji = waka_emoji
    conv_dict.last_message_status = last_msg_status
    
    if other_user:
        conv_dict.other_user = UserInfo.model_validate(other_user)
    
    # Determine if pinned by current user
    conv_dict.is_pinned = conv.is_pinned_by_employer if conv.employer_id == current_user.id else conv.is_pinned_by_runner
    
    return conv_dict

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return total number of unread messages for the current user."""
    unread_stmt = (
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            and_(
                or_(Conversation.employer_id == current_user.id, Conversation.runner_id == current_user.id),
                Message.sender_id != current_user.id,
                Message.is_read == False
            )
        )
    )
    result = await db.execute(unread_stmt)
    count = result.scalar() or 0
    return {"unread_count": count}

@router.get("/conversations", response_model=list[ConversationRead])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Query conversations where user is either employer or runner
    stmt = (
        select(Conversation)
        .where(or_(Conversation.employer_id == current_user.id, Conversation.runner_id == current_user.id))
        .order_by(desc(Conversation.last_message_at))
    )
    result = await db.execute(stmt)
    conversations = result.scalars().all()
    
    # Enrich with other user info and unread count
    enriched = []
    for conv in conversations:
        enriched.append(await enrich_conversation(db, conv, current_user))
        
    return enriched

@router.get("/conversations/{convo_id}", response_model=ConversationRead)
async def get_conversation(
    convo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return a single enriched conversation."""
    stmt = select(Conversation).where(
        and_(
            Conversation.id == convo_id,
            or_(Conversation.employer_id == current_user.id, Conversation.runner_id == current_user.id)
        )
    )
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or not participant")
        
    return await enrich_conversation(db, conv, current_user)

@router.post("/conversations", response_model=ConversationRead)
async def create_or_get_conversation(
    conv_in: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure current user is part of the conversation
    if current_user.id not in [conv_in.employer_id, conv_in.runner_id]:
        raise HTTPException(status_code=403, detail="Not authorized to create this conversation")
        
    # Check if conversation already exists (for same participants and same waka)
    stmt = (
        select(Conversation)
        .where(
            and_(
                Conversation.employer_id == conv_in.employer_id,
                Conversation.runner_id == conv_in.runner_id,
                Conversation.waka_id == conv_in.waka_id
            )
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        return await enrich_conversation(db, existing, current_user)
        
    # Create new
    new_conv = Conversation(
        employer_id=conv_in.employer_id,
        runner_id=conv_in.runner_id,
        waka_id=conv_in.waka_id
    )
    db.add(new_conv)
    await db.commit()
    await db.refresh(new_conv)
    return await enrich_conversation(db, new_conv, current_user)

@router.get("/{convo_id}/history", response_model=list[MessageRead])
async def get_chat_history(
    convo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify user is participant
    conv_stmt = select(Conversation).where(Conversation.id == convo_id)
    conv_res = await db.execute(conv_stmt)
    conv = conv_res.scalar_one_or_none()
    if not conv or current_user.id not in [conv.employer_id, conv.runner_id]:
        raise HTTPException(status_code=403, detail="Not authorized to view this chat history")

    # Mark messages from other user as read when history is requested
    await db.execute(
        update(Message)
        .where(
            and_(
                Message.conversation_id == convo_id,
                Message.sender_id != current_user.id,
                Message.is_read == False
            )
        )
        .values(is_read=True, read_at=func.now())
    )
    await db.commit()

    # Now fetch messages (after update and commit)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == convo_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    
    return messages

@router.post("/messages", response_model=MessageRead)
async def send_message_http(
    msg_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify participant
    conv_stmt = select(Conversation).where(Conversation.id == msg_in.conversation_id)
    conv_res = await db.execute(conv_stmt)
    conv = conv_res.scalar_one_or_none()
    if not conv or current_user.id not in [conv.employer_id, conv.runner_id]:
        raise HTTPException(status_code=403, detail="Not authorized to send messages here")
        
    new_msg = Message(
        conversation_id=msg_in.conversation_id,
        sender_id=current_user.id,
        content_text=msg_in.content_text,
        attachment_url=msg_in.attachment_url,
        attachment_metadata=msg_in.attachment_metadata
    )
    db.add(new_msg)
    
    # Update conversation last message
    conv.last_message_text = msg_in.content_text or "[Attachment]"
    conv.last_message_at = func.now()
    
    await db.commit()
    await db.refresh(new_msg)
    
    # Broadcast via WebSocket
    msg_data = {
        "type": "NEW_MESSAGE",
        "message": MessageRead.model_validate(new_msg).model_dump(mode='json')
    }
    await manager.broadcast(json.dumps(msg_data), str(msg_in.conversation_id))
    
    # Notify recipient
    recipient_id = conv.runner_id if current_user.id == conv.employer_id else conv.employer_id
    recipient = await db.get(User, recipient_id)
    if recipient:
        await notify_user(
            db=db,
            user=recipient,
            title=current_user.full_name,
            body=msg_in.content_text or "Sent an attachment",
            type="message",
            linked_entity_id=conv.id,
            linked_entity_type="conversation",
            send_in_app=False
        )
        await db.commit()
    
    return new_msg

@router.delete("/messages/{message_id}", response_model=MessageRead)
async def delete_message(
    message_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft-delete a message (only sender can delete)."""
    stmt = select(Message).where(Message.id == message_id)
    result = await db.execute(stmt)
    msg = result.scalar_one_or_none()
    
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the sender can delete this message")
        
    msg.is_deleted = True
    await db.commit()
    await db.refresh(msg)
    
    # Broadcast deletion
    msg_data = {
        "type": "DELETE_MESSAGE",
        "message_id": str(message_id)
    }
    await manager.broadcast(json.dumps(msg_data), str(msg.conversation_id))
    
    return msg

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
async def websocket_endpoint(
    websocket: WebSocket, 
    convo_id: str,
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
        
    # Check if user is part of the conversation
    conv_stmt = select(Conversation).where(Conversation.id == uuid.UUID(convo_id))
    conv_res = await db.execute(conv_stmt)
    conv = conv_res.scalar_one_or_none()
    
    if not conv or current_user.id not in [conv.employer_id, conv.runner_id]:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    await manager.connect(websocket, convo_id)
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            # Expecting { "sender_id": "...", "content_text": "..." }
            sender_id = uuid.UUID(data["sender_id"])
            content_text = data["content_text"]
            
            # Save to DB
            new_msg = Message(
                conversation_id=uuid.UUID(convo_id),
                sender_id=sender_id,
                content_text=content_text
            )
            db.add(new_msg)
            
            # Update last message in Conversation
            stmt = select(Conversation).where(Conversation.id == uuid.UUID(convo_id))
            res = await db.execute(stmt)
            conv = res.scalar_one_or_none()
            if conv:
                conv.last_message_text = content_text
                conv.last_message_at = func.now()
            
            await db.commit()
            await db.refresh(new_msg)
            
            # Broadcast
            msg_data = {
                "type": "NEW_MESSAGE",
                "message": MessageRead.model_validate(new_msg).model_dump(mode='json')
            }
            await manager.broadcast(json.dumps(msg_data), convo_id)
            
            # Notify recipient
            recipient_id = conv.runner_id if sender_id == conv.employer_id else conv.employer_id
            recipient = await db.get(User, recipient_id)
            if recipient:
                await notify_user(
                    db=db,
                    user=recipient,
                    title=current_user.full_name,
                    body=content_text or "Sent a message",
                    type="message",
                    linked_entity_id=conv.id,
                    linked_entity_type="conversation",
                    send_in_app=False
                )
                await db.commit()
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, convo_id)
    except Exception as e:
        print(f"WS Error: {e}")
        manager.disconnect(websocket, convo_id)
