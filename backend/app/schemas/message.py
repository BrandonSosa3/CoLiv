from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class MessageCreate(BaseModel):
    receiver_id: UUID
    tenant_id: UUID
    subject: Optional[str] = None
    message: str

class MessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    sender_role: str
    sender_name: str
    sender_email: str
    receiver_id: UUID
    receiver_role: str
    receiver_name: str
    receiver_email: str
    tenant_id: UUID
    subject: Optional[str]
    message: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    tenant_id: UUID
    tenant_name: str
    tenant_email: str
    property_name: str
    unit_number: str
    room_number: str
    last_message: str
    last_message_time: datetime
    unread_count: int
    messages: list[MessageResponse]
