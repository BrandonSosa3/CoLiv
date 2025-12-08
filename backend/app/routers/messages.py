from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.operator import Operator
from app.models.message import Message
from app.models.room import Room
from app.models.unit import Unit
from app.models.property import Property
from app.schemas.message import MessageCreate, MessageResponse, ConversationResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

def get_current_tenant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Tenant:
    """Get the current tenant from the authenticated user"""
    if current_user.role != 'tenant':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Tenant role required."
        )
    
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found"
        )
    
    return tenant

def get_current_operator(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Operator:
    """Get the current operator from the authenticated user"""
    if current_user.role != 'operator':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Operator role required."
        )
    
    operator = db.query(Operator).filter(Operator.user_id == current_user.id).first()
    if not operator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operator profile not found"
        )
    
    return operator


@router.post("/send", response_model=MessageResponse)
def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message to another user"""
    
    # Get receiver
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Get tenant info
    tenant = db.query(Tenant).filter(Tenant.id == message_data.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Create message
    new_message = Message(
        sender_id=current_user.id,
        sender_role=current_user.role,
        receiver_id=message_data.receiver_id,
        receiver_role=receiver.role,
        tenant_id=message_data.tenant_id,
        subject=message_data.subject,
        message=message_data.message
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Get sender and receiver names
    sender_name = f"{current_user.first_name} {current_user.last_name}" if current_user.first_name else current_user.email
    receiver_name = f"{receiver.first_name} {receiver.last_name}" if receiver.first_name else receiver.email
    
    return MessageResponse(
        id=new_message.id,
        sender_id=new_message.sender_id,
        sender_role=new_message.sender_role,
        sender_name=sender_name,
        sender_email=current_user.email,
        receiver_id=new_message.receiver_id,
        receiver_role=new_message.receiver_role,
        receiver_name=receiver_name,
        receiver_email=receiver.email,
        tenant_id=new_message.tenant_id,
        subject=new_message.subject,
        message=new_message.message,
        is_read=new_message.is_read,
        created_at=new_message.created_at,
        read_at=new_message.read_at
    )


@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    
    if current_user.role == 'tenant':
        # Tenant sees their conversation with their operator
        tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Get all messages for this tenant
        messages = db.query(Message).filter(
            Message.tenant_id == tenant.id
        ).order_by(Message.created_at.asc()).all()
        
        if not messages:
            return []
        
        # Get tenant info
        room = db.query(Room).filter(Room.id == tenant.room_id).first()
        unit = db.query(Unit).filter(Unit.id == room.unit_id).first() if room else None
        property_obj = db.query(Property).filter(Property.id == unit.property_id).first() if unit else None
        
        # Get unread count
        unread_count = db.query(func.count(Message.id)).filter(
            and_(
                Message.tenant_id == tenant.id,
                Message.receiver_id == current_user.id,
                Message.is_read == False
            )
        ).scalar()
        
        # Format messages
        formatted_messages = []
        for msg in messages:
            sender = db.query(User).filter(User.id == msg.sender_id).first()
            receiver = db.query(User).filter(User.id == msg.receiver_id).first()
            
            sender_name = f"{sender.first_name} {sender.last_name}" if sender.first_name else sender.email
            receiver_name = f"{receiver.first_name} {receiver.last_name}" if receiver.first_name else receiver.email
            
            formatted_messages.append(MessageResponse(
                id=msg.id,
                sender_id=msg.sender_id,
                sender_role=msg.sender_role,
                sender_name=sender_name,
                sender_email=sender.email,
                receiver_id=msg.receiver_id,
                receiver_role=msg.receiver_role,
                receiver_name=receiver_name,
                receiver_email=receiver.email,
                tenant_id=msg.tenant_id,
                subject=msg.subject,
                message=msg.message,
                is_read=msg.is_read,
                created_at=msg.created_at,
                read_at=msg.read_at
            ))
        
        return [ConversationResponse(
            tenant_id=tenant.id,
            tenant_name=f"{current_user.first_name} {current_user.last_name}" if current_user.first_name else current_user.email,
            tenant_email=current_user.email,
            property_name=property_obj.name if property_obj else "N/A",
            unit_number=unit.unit_number if unit else "N/A",
            room_number=room.room_number if room else "N/A",
            last_message=messages[-1].message,
            last_message_time=messages[-1].created_at,
            unread_count=unread_count,
            messages=formatted_messages
        )]
    
    else:  # operator
        # Operator sees all conversations with their tenants
        operator = db.query(Operator).filter(Operator.user_id == current_user.id).first()
        if not operator:
            raise HTTPException(status_code=404, detail="Operator not found")
        
        # Get all tenants for this operator's properties
        properties = db.query(Property).filter(Property.operator_id == operator.id).all()
        property_ids = [p.id for p in properties]
        
        units = db.query(Unit).filter(Unit.property_id.in_(property_ids)).all()
        unit_ids = [u.id for u in units]
        
        rooms = db.query(Room).filter(Room.unit_id.in_(unit_ids)).all()
        room_ids = [r.id for r in rooms]
        
        tenants = db.query(Tenant).filter(
            and_(
                Tenant.room_id.in_(room_ids),
                Tenant.status == 'active'
            )
        ).all()
        
        conversations = []
        for tenant in tenants:
            # Get messages for this tenant
            messages = db.query(Message).filter(
                Message.tenant_id == tenant.id
            ).order_by(Message.created_at.asc()).all()
            
            if not messages:
                continue
            
            # Get tenant user info
            tenant_user = db.query(User).filter(User.id == tenant.user_id).first()
            
            # Get property info
            room = db.query(Room).filter(Room.id == tenant.room_id).first()
            unit = db.query(Unit).filter(Unit.id == room.unit_id).first() if room else None
            property_obj = db.query(Property).filter(Property.id == unit.property_id).first() if unit else None
            
            # Get unread count
            unread_count = db.query(func.count(Message.id)).filter(
                and_(
                    Message.tenant_id == tenant.id,
                    Message.receiver_id == current_user.id,
                    Message.is_read == False
                )
            ).scalar()
            
            # Format messages
            formatted_messages = []
            for msg in messages:
                sender = db.query(User).filter(User.id == msg.sender_id).first()
                receiver = db.query(User).filter(User.id == msg.receiver_id).first()
                
                sender_name = f"{sender.first_name} {sender.last_name}" if sender.first_name else sender.email
                receiver_name = f"{receiver.first_name} {receiver.last_name}" if receiver.first_name else receiver.email
                
                formatted_messages.append(MessageResponse(
                    id=msg.id,
                    sender_id=msg.sender_id,
                    sender_role=msg.sender_role,
                    sender_name=sender_name,
                    sender_email=sender.email,
                    receiver_id=msg.receiver_id,
                    receiver_role=msg.receiver_role,
                    receiver_name=receiver_name,
                    receiver_email=receiver.email,
                    tenant_id=msg.tenant_id,
                    subject=msg.subject,
                    message=msg.message,
                    is_read=msg.is_read,
                    created_at=msg.created_at,
                    read_at=msg.read_at
                ))
            
            conversations.append(ConversationResponse(
                tenant_id=tenant.id,
                tenant_name=f"{tenant_user.first_name} {tenant_user.last_name}" if tenant_user.first_name else tenant_user.email,
                tenant_email=tenant_user.email,
                property_name=property_obj.name if property_obj else "N/A",
                unit_number=unit.unit_number if unit else "N/A",
                room_number=room.room_number if room else "N/A",
                last_message=messages[-1].message,
                last_message_time=messages[-1].created_at,
                unread_count=unread_count,
                messages=formatted_messages
            ))
        
        # Sort by last message time
        conversations.sort(key=lambda x: x.last_message_time, reverse=True)
        
        return conversations


@router.post("/mark-read/{message_id}")
def mark_message_as_read(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a message as read"""
    
    message = db.query(Message).filter(
        and_(
            Message.id == message_id,
            Message.receiver_id == current_user.id
        )
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.is_read = True
    message.read_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success"}


@router.post("/mark-all-read/{tenant_id}")
def mark_all_messages_read(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all messages in a conversation as read"""
    
    db.query(Message).filter(
        and_(
            Message.tenant_id == tenant_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        )
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    
    db.commit()
    
    return {"status": "success"}
