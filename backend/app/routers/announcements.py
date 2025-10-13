from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app.models.user import User
from app.models.announcement import Announcement
from app.models.property import Property
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from app.utils.auth import get_current_operator

router = APIRouter(prefix="/announcements", tags=["Announcements"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=AnnouncementResponse)
def create_announcement(
    announcement: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create a new announcement"""
    logger.info(f"Creating announcement with data: {announcement.model_dump()}")

    # Verify property ownership
    property = db.query(Property).filter(
        Property.id == announcement.property_id,
        Property.operator_id == current_user.operator.id
    ).first()

    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )

    try:
        # Create announcement with created_by field
        db_announcement = Announcement(
            property_id=announcement.property_id,
            title=announcement.title,
            message=announcement.message,
            priority=announcement.priority,
            created_by=current_user.id
        )
        db.add(db_announcement)
        db.commit()
        db.refresh(db_announcement)

        return db_announcement
    except Exception as e:
        logger.error(f"Error creating announcement: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create announcement: {str(e)}"
        )


@router.get("/property/{property_id}")
def get_announcements_by_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get all announcements for a property"""
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

    # Get announcements
    announcements = db.query(Announcement).filter(
        Announcement.property_id == property_id
    ).order_by(Announcement.created_at.desc()).all()

    return [
        {
            "id": str(a.id),
            "property_id": str(a.property_id),
            "title": a.title,
            "message": a.message,
            "priority": a.priority,
            "created_at": a.created_at.isoformat(),
            "updated_at": a.updated_at.isoformat() if a.updated_at else a.created_at.isoformat(),
            "property_name": property.name,
        }
        for a in announcements
    ]


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: str,
    announcement_update: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update an announcement"""
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id
    ).first()

    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )

    # Verify ownership
    property = db.query(Property).filter(Property.id == announcement.property_id).first()
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Update fields
    for key, value in announcement_update.model_dump(exclude_unset=True).items():
        setattr(announcement, key, value)

    db.commit()
    db.refresh(announcement)

    return announcement


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete an announcement"""
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id
    ).first()

    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )

    # Verify ownership
    property = db.query(Property).filter(Property.id == announcement.property_id).first()
    if property.operator_id != current_user.operator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    db.delete(announcement)
    db.commit()

    return {"message": "Announcement deleted successfully"}
