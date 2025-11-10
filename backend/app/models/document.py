# Update app/models/document.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.database import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=True)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True)
    
    # Flexible fields
    document_type = Column(String(100), nullable=False)  # Custom category/type
    title = Column(String(255), nullable=False)  # Custom name/label
    description = Column(String(500), nullable=True)  # Optional description
    
    # File info
    filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    
    # Permissions
    visible_to_all_tenants = Column(Boolean, default=False)  # If true, all property tenants can see
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    property = relationship("Property", back_populates="documents")
    tenant = relationship("Tenant", back_populates="documents")