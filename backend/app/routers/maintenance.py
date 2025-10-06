from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.unit import Unit
from app.models.room import Room
from app.models.tenant import Tenant
from app.models.maintenance import MaintenanceRequest
from app.schemas.maintenance import (
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    MaintenanceRequestResponse,
    MaintenanceRequestWithDetailsResponse
)
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.post("/", response_model=MaintenanceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_request(
    request_data: MaintenanceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create a new maintenance request"""
    
    # Verify property ownership
    property = db.query(Property).filter(
        Property.id == request_data.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this property"
        )
    
    # Verify unit exists
    unit = db.query(Unit).filter(Unit.id == request_data.unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    
    # Create request
    maintenance_request = MaintenanceRequest(**request_data.model_dump())
    db.add(maintenance_request)
    db.commit()
    db.refresh(maintenance_request)
    
    return maintenance_request


@router.get("/property/{property_id}", response_model=List[MaintenanceRequestWithDetailsResponse])
def get_maintenance_requests_by_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all maintenance requests for a property"""
    
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    # Join to get unit and room details
    requests = (
        db.query(
            MaintenanceRequest,
            Unit.unit_number,
            Room.room_number,
            User.email
        )
        .join(Unit, MaintenanceRequest.unit_id == Unit.id)
        .outerjoin(Room, MaintenanceRequest.room_id == Room.id)
        .outerjoin(Tenant, MaintenanceRequest.tenant_id == Tenant.id)
        .outerjoin(User, Tenant.user_id == User.id)
        .filter(MaintenanceRequest.property_id == property_id)
        .order_by(MaintenanceRequest.created_at.desc())
        .all()
    )
    
    result = []
    for req, unit_num, room_num, email in requests:
        result.append({
            "id": req.id,
            "property_id": req.property_id,
            "unit_id": req.unit_id,
            "room_id": req.room_id,
            "tenant_id": req.tenant_id,
            "title": req.title,
            "description": req.description,
            "priority": req.priority,
            "status": req.status,
            "photos": req.photos,
            "assigned_to": req.assigned_to,
            "resolved_at": req.resolved_at,
            "created_at": req.created_at,
            "unit_number": unit_num,
            "room_number": room_num,
            "tenant_email": email
        })
    
    return result


@router.get("/{request_id}", response_model=MaintenanceRequestResponse)
def get_maintenance_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get a specific maintenance request"""
    
    request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    
    # Verify ownership
    property = db.query(Property).filter(
        Property.id == request.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return request


@router.put("/{request_id}", response_model=MaintenanceRequestResponse)
def update_maintenance_request(
    request_id: UUID,
    request_data: MaintenanceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update a maintenance request (change status, assign, etc.)"""
    
    request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    
    # Verify ownership
    property = db.query(Property).filter(
        Property.id == request.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Update fields
    update_data = request_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(request, key, value)
    
    db.commit()
    db.refresh(request)
    
    return request


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete a maintenance request"""
    
    request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    
    # Verify ownership
    property = db.query(Property).filter(
        Property.id == request.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db.delete(request)
    db.commit()
    
    return None
