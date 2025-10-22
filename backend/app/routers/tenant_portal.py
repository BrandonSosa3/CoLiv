from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

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
    """Get current tenant's payment history"""
    payments = db.query(Payment).filter(
        Payment.tenant_id == tenant.id
    ).order_by(Payment.due_date.desc()).all()
    
    return [
        {
            "id": str(payment.id),
            "amount": str(payment.amount),
            "due_date": payment.due_date.isoformat(),
            "paid_date": payment.paid_date.isoformat() if payment.paid_date else None,
            "status": payment.status,
            "payment_method": payment.payment_method,
            "late_fee": str(payment.late_fee) if payment.late_fee else "0.00",
        }
        for payment in payments
    ]


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

