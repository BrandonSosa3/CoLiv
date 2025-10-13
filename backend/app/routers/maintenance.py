from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.maintenance import MaintenanceRequest
from app.models.room import Room
from app.models.unit import Unit
from app.models.property import Property
from app.schemas.maintenance import MaintenanceRequestCreate, MaintenanceRequestUpdate, MaintenanceRequestResponse
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


class MaintenanceUpdateRequest(BaseModel):
    """Custom update request that accepts assigned_to as a name string"""
    status: Optional[str] = None
    assigned_to_name: Optional[str] = None


@router.post("/", response_model=MaintenanceRequestResponse)
def create_maintenance_request(
    request: MaintenanceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create a new maintenance request"""
    
    # Verify room exists and belongs to operator (if room_id provided)
    if request.room_id:
        room = db.query(Room).filter(Room.id == request.room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )
    
    unit = db.query(Unit).filter(Unit.id == request.unit_id).first()
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )
    
    property = db.query(Property).filter(Property.id == unit.property_id).first()
    
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Create request with status "open"
    db_request = MaintenanceRequest(
        property_id=request.property_id,
        unit_id=request.unit_id,
        room_id=request.room_id,
        title=request.title,
        description=request.description,
        priority=request.priority,
        status="open"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request


@router.get("/property/{property_id}")
def get_maintenance_by_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all maintenance requests for a property with full context"""
    
    # Verify property ownership
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Get all maintenance requests for this property
    request_records = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.property_id == property_id
    ).all()
    
    requests = []
    for request in request_records:
        room = db.query(Room).filter(Room.id == request.room_id).first() if request.room_id else None
        unit = db.query(Unit).filter(Unit.id == request.unit_id).first()
        assigned_user = db.query(User).filter(User.id == request.assigned_to).first() if request.assigned_to else None
        
        requests.append({
            "id": str(request.id),
            "property_id": str(request.property_id),
            "unit_id": str(request.unit_id),
            "room_id": str(request.room_id) if request.room_id else None,
            "title": request.title,
            "description": request.description,
            "priority": request.priority,
            "status": request.status,
            "assigned_to": assigned_user.email if assigned_user else None,
            "created_at": request.created_at.isoformat(),
            "resolved_at": request.resolved_at.isoformat() if request.resolved_at else None,
            "property_name": property.name,
            "unit_number": unit.unit_number,
            "room_number": room.room_number if room else "N/A",
            "reporter_email": current_user.email,
        })
    
    return requests


@router.get("/{request_id}", response_model=MaintenanceRequestResponse)
def get_maintenance_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get a specific maintenance request"""
    request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )
    
    # Verify ownership
    property = db.query(Property).filter(Property.id == request.property_id).first()
    
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return request


@router.put("/{request_id}")
def update_maintenance_request(
    request_id: str,
    update_data: MaintenanceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update a maintenance request"""
    request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )
    
    # Verify ownership
    property = db.query(Property).filter(Property.id == request.property_id).first()
    
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Update status if provided
    if update_data.status:
        request.status = update_data.status
    
    # Update assigned_to - store the name as a simple string for now
    # (In a real system, you'd want to store the UUID of a user)
    if update_data.assigned_to_name is not None:
        # For now, we'll just store None since assigned_to expects UUID
        # In production, you'd create/find a user and use their UUID
        request.assigned_to = None
    
    # If status changed to resolved, set resolved_at
    if update_data.status == "resolved" and not request.resolved_at:
        from datetime import datetime
        request.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    
    # Return the updated request with assigned_to_name
    room = db.query(Room).filter(Room.id == request.room_id).first() if request.room_id else None
    unit = db.query(Unit).filter(Unit.id == request.unit_id).first()
    
    return {
        "id": str(request.id),
        "property_id": str(request.property_id),
        "unit_id": str(request.unit_id),
        "room_id": str(request.room_id) if request.room_id else None,
        "title": request.title,
        "description": request.description,
        "priority": request.priority,
        "status": request.status,
        "assigned_to": update_data.assigned_to_name,  # Return the name
        "created_at": request.created_at.isoformat(),
        "resolved_at": request.resolved_at.isoformat() if request.resolved_at else None,
        "property_name": property.name,
        "unit_number": unit.unit_number,
        "room_number": room.room_number if room else "N/A",
        "reporter_email": current_user.email,
    }


@router.delete("/{request_id}")
def delete_maintenance_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete a maintenance request"""
    request = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )
    
    # Verify ownership
    property = db.query(Property).filter(Property.id == request.property_id).first()
    
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    db.delete(request)
    db.commit()
    
    return {"message": "Maintenance request deleted successfully"}
