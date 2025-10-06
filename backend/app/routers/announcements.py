from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.announcement import Announcement
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse,
    AnnouncementWithCreatorResponse
)
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.post("/", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    announcement_data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create a new announcement"""
    
    # Verify property ownership
    property = db.query(Property).filter(
        Property.id == announcement_data.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this property"
        )
    
    # Create announcement
    announcement = Announcement(
        **announcement_data.model_dump(),
        created_by=current_user.id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    
    return announcement


@router.get("/property/{property_id}", response_model=List[AnnouncementWithCreatorResponse])
def get_announcements_by_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all announcements for a property"""
    
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    announcements = (
        db.query(Announcement, User.email)
        .join(User, Announcement.created_by == User.id)
        .filter(Announcement.property_id == property_id)
        .order_by(Announcement.created_at.desc())
        .all()
    )
    
    result = []
    for announcement, email in announcements:
        result.append({
            "id": announcement.id,
            "property_id": announcement.property_id,
            "created_by": announcement.created_by,
            "title": announcement.title,
            "message": announcement.message,
            "priority": announcement.priority,
            "created_at": announcement.created_at,
            "creator_email": email
        })
    
    return result


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: UUID,
    announcement_data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update an announcement"""
    
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    
    # Verify ownership
    property = db.query(Property).filter(
        Property.id == announcement.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Update fields
    update_data = announcement_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(announcement, key, value)
    
    db.commit()
    db.refresh(announcement)
    
    return announcement


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(
    announcement_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete an announcement"""
    
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    
    # Verify ownership
    property = db.query(Property).filter(
        Property.id == announcement.property_id,
        Property.operator_id == current_user.operator.id
    ).first()
    
    if not property:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db.delete(announcement)
    db.commit()
    
    return None
