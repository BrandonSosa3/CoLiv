from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.utils.auth import get_current_user, get_password_hash, verify_password

router = APIRouter(prefix="/tenants/me/profile", tags=["Tenant Profile"])


class ProfileUpdate(BaseModel):
    email: EmailStr


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


def get_current_tenant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Tenant:
    """Get the current tenant from the authenticated user"""
    if current_user.role != 'TENANT':
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
def get_profile(
    current_user: User = Depends(get_current_user),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get tenant profile information"""
    return {
        "id": str(tenant.id),
        "email": current_user.email,
        "status": tenant.status,
        "lease_start": tenant.lease_start.isoformat(),
        "lease_end": tenant.lease_end.isoformat(),
        "rent_amount": str(tenant.rent_amount),
        "created_at": tenant.created_at.isoformat(),
    }


@router.put("/")
def update_profile(
    profile_update: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update tenant profile (email only)"""
    
    # Check if email is already taken
    existing_user = db.query(User).filter(
        User.email == profile_update.email,
        User.id != current_user.id
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )
    
    current_user.email = profile_update.email
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "email": current_user.email
    }


@router.post("/change-password")
def change_password(
    password_change: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change tenant password"""
    
    # Verify current password
    if not verify_password(password_change.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    if len(password_change.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_change.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
