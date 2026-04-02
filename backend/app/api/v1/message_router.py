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
import uuid
import json

router = APIRouter()

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
                waka_title = waka.title
                # Assuming waka might have an emoji or we use a default based on category
                # For now, let's just use the title if it starts with an emoji or just the title
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
        
        enriched.append(conv_dict)
        
    return enriched

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
        return ConversationRead.model_validate(existing)
        
    # Create new
    new_conv = Conversation(
        employer_id=conv_in.employer_id,
        runner_id=conv_in.runner_id,
        waka_id=conv_in.waka_id
    )
    db.add(new_conv)
    await db.commit()
    await db.refresh(new_conv)
    return ConversationRead.model_validate(new_conv)

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

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == convo_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    
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
        attachment_url=msg_in.attachment_url
    )
    db.add(new_msg)
    
    # Update conversation last message
    conv.last_message_text = msg_in.content_text or "[Attachment]"
    conv.last_message_at = func.now()
    
    await db.commit()
    await db.refresh(new_msg)
    
    # Broadcast via WebSocket (simplified broadcast to all subscribers of this convo)
    msg_data = MessageRead.model_validate(new_msg).model_dump_json()
    await manager.broadcast(msg_data, str(msg_in.conversation_id))
    
    return new_msg

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
    db: AsyncSession = Depends(get_db)
):
    # Note: In FastAPI WebSockets, Depends(get_current_user) is tricky due to auth headers.
    # For now, we assume the client sends the token in the first message or query param.
    # Simplified for this task.
    
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
            msg_data = MessageRead.model_validate(new_msg).model_dump_json()
            await manager.broadcast(msg_data, convo_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, convo_id)
    except Exception as e:
        print(f"WS Error: {e}")
        manager.disconnect(websocket, convo_id)
