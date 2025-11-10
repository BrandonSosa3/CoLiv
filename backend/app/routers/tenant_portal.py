from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from typing import Optional
from app.models.document import Document  # Add this
from app.services.file_storage import file_storage  # Add this
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.unit import Unit
from app.models.property import Property
from app.models.payment import Payment
from app.models.maintenance import MaintenanceRequest
from app.models.announcement import Announcement
from app.utils.auth import get_current_user

router = APIRouter(prefix="/tenants/me", tags=["Tenant Portal"])


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


@router.get("/")
@router.get("/profile")
def get_my_profile(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get current tenant's profile"""
    user = db.query(User).filter(User.id == tenant.user_id).first()
    
    return {
        "id": str(tenant.id),
        "email": user.email,
        "status": tenant.status,
        "created_at": tenant.created_at.isoformat(),
    }


@router.get("/lease")
def get_my_lease(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get current tenant's lease information"""
    
    if not tenant.room_id:
        # Tenant has no room (moved out)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active lease found. You may have moved out."
        )
    
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
        
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property = db.query(Property).filter(Property.id == unit.property_id).first()
    
    return {
        "property_name": property.name,
        "unit_number": unit.unit_number,
        "room_number": room.room_number,
        "lease_start": tenant.lease_start,
        "lease_end": tenant.lease_end,
        "rent_amount": tenant.rent_amount,
        "status": tenant.status
    }


@router.get("/payments")
def get_my_payments(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get current tenant's payment history with auto-overdue updates"""
    
    from datetime import datetime
    from zoneinfo import ZoneInfo
    
    # Get all payments for this tenant
    payments = db.query(Payment).filter(
        Payment.tenant_id == tenant.id
    ).all()
    
    # Get current PST date
    pst = ZoneInfo("America/Los_Angeles")
    today_pst = datetime.now(pst).date()
    
    # Auto-update overdue payments
    for payment in payments:
        if payment.status == 'PENDING' and payment.due_date < today_pst:
            payment.status = 'OVERDUE'
    
    db.commit()
    
    # Get updated payments sorted by due date
    payments = db.query(Payment).filter(
        Payment.tenant_id == tenant.id
    ).order_by(Payment.due_date.desc()).all()
    
    return [{
        "id": str(payment.id),
        "amount": str(payment.amount),
        "due_date": payment.due_date.isoformat(),
        "paid_date": payment.paid_date.isoformat() if payment.paid_date else None,
        "status": payment.status.lower(),
        "payment_method": payment.payment_method,
        "late_fee": str(payment.late_fee) if payment.late_fee else "0.00",
        "created_at": payment.created_at.isoformat()
    } for payment in payments]


@router.get("/maintenance")
def get_my_maintenance_requests(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get current tenant's maintenance requests"""
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    
    requests = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.room_id == room.id
    ).order_by(MaintenanceRequest.created_at.desc()).all()
    
    return [
        {
            "id": str(request.id),
            "title": request.title,
            "description": request.description,
            "priority": request.priority,
            "status": request.status,
            "created_at": request.created_at.isoformat(),
            "resolved_at": request.resolved_at.isoformat() if request.resolved_at else None,
            "assigned_to": str(request.assigned_to) if request.assigned_to else None,
        }
        for request in requests
    ]


@router.post("/maintenance")
def create_maintenance_request(
    request_data: dict,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create a new maintenance request"""
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    
    # Create maintenance request
    maintenance_request = MaintenanceRequest(
        property_id=unit.property_id,
        unit_id=unit.id,
        room_id=room.id,
        title=request_data.get('title'),
        description=request_data.get('description'),
        priority=request_data.get('priority', 'medium'),
        status='open'
    )
    
    db.add(maintenance_request)
    db.commit()
    db.refresh(maintenance_request)
    
    return {
        "id": str(maintenance_request.id),
        "title": maintenance_request.title,
        "description": maintenance_request.description,
        "priority": maintenance_request.priority,
        "status": maintenance_request.status,
        "created_at": maintenance_request.created_at.isoformat(),
    }


@router.get("/announcements")
def get_my_announcements(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get announcements for tenant's property"""
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    
    announcements = db.query(Announcement).filter(
        Announcement.property_id == unit.property_id
    ).order_by(Announcement.created_at.desc()).limit(20).all()
    
    return [
        {
            "id": str(announcement.id),
            "title": announcement.title,
            "message": announcement.message,
            "priority": announcement.priority,
            "created_at": announcement.created_at.isoformat(),
        }
        for announcement in announcements
    ]
# Add to app/routers/tenant_portal.py
# Add to app/routers/tenant_portal.py
@router.get("/documents")
def get_my_documents(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get documents available to current tenant"""
    
    # Get tenant's room and property info
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    if not room:
        return []
    
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property_id = unit.property_id
    
    # Get documents assigned to this tenant OR visible to all tenants in property
    documents = db.query(Document).filter(
        or_(  # ✅ Correct - use imported or_
            Document.tenant_id == tenant.id,
            (Document.property_id == property_id) & (Document.visible_to_all_tenants == True)
        )
    ).order_by(Document.created_at.desc()).all()
    
    return [{
        "id": str(document.id),
        "title": document.title,
        "document_type": document.document_type,
        "description": document.description,
        "filename": document.filename,
        "file_url": document.file_url,
        "file_size": document.file_size,
        "created_at": document.created_at.isoformat(),
        "is_tenant_specific": document.tenant_id == tenant.id
    } for document in documents]

@router.post("/documents/upload")
async def upload_tenant_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Upload a document as a tenant"""
    
    # Validate file size (10MB limit for tenants)
    max_size = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 10MB"
        )
    
    # Get tenant's property
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    property_id = unit.property_id
    
    try:
        # Upload file to storage
        file.file.seek(0)  # Reset file pointer
        file_info = await file_storage.upload_file(file, folder="tenant-uploads")
        
        # Create document record
        document = Document(
            property_id=property_id,
            tenant_id=tenant.id,
            document_type=document_type,
            title=title,
            description=description,
            filename=file_info["filename"],
            file_url=file_info["file_url"],
            file_size=file_info["file_size"],
            mime_type=file_info["mime_type"],
            visible_to_all_tenants=False  # Tenant uploads are private by default
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return {
            "id": str(document.id),
            "title": document.title,
            "document_type": document.document_type,
            "filename": document.filename,
            "created_at": document.created_at.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )