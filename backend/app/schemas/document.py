# Update app/schemas/document.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid

class DocumentCreate(BaseModel):
    property_id: Optional[uuid.UUID] = None
    tenant_id: Optional[uuid.UUID] = None
    document_type: str  # Custom category
    title: str  # Custom name/label
    description: Optional[str] = None
    visible_to_all_tenants: bool = False

class DocumentResponse(BaseModel):
    id: uuid.UUID
    property_id: Optional[uuid.UUID]
    tenant_id: Optional[uuid.UUID]
    document_type: str
    title: str
    description: Optional[str]
    filename: str
    file_url: str
    file_size: Optional[int]
    mime_type: Optional[str]
    visible_to_all_tenants: bool
    created_at: datetime
    
    # Include property/tenant names for display
    property_name: Optional[str] = None
    tenant_name: Optional[str] = None
    
    class Config:
        from_attributes = True