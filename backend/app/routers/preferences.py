from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.operator import Operator
from app.models.tenant_preference import TenantPreference
from app.schemas.tenant_preference import (
    TenantPreferenceCreate,
    TenantPreferenceUpdate,
    TenantPreferenceResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/preferences", tags=["Tenant Preferences"])

def get_current_operator(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Operator:
    """Get the current operator from the authenticated user"""
    if current_user.role != 'operator':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Operator role required."
        )
    
    operator = db.query(Operator).filter(Operator.user_id == current_user.id).first()
    if not operator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operator profile not found"
        )
    
    return operator

# ============ TENANT-SPECIFIC ROUTES ============

@router.get("/me")
def get_my_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current tenant's preferences"""
    
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    preferences = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found. Please complete your profile."
        )
    
    return preferences


@router.put("/me")
def update_my_preferences(
    pref_update: TenantPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current tenant's preferences"""
    
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    preferences = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if not preferences:
        # Create new preferences if they don't exist
        preferences = TenantPreference(tenant_id=tenant.id)
        db.add(preferences)
    
    # Update fields
    update_data = pref_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(preferences, field, value)
    
    db.commit()
    db.refresh(preferences)
    
    return preferences


# ============ OPERATOR ROUTES ============

@router.post("/", response_model=TenantPreferenceResponse)
def create_tenant_preferences(
    tenant_id: str,
    preferences: TenantPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create preferences for a tenant (operator only)"""
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if preferences already exist
    existing = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferences already exist for this tenant"
        )
    
    new_preferences = TenantPreference(
        tenant_id=tenant_id,
        **preferences.model_dump()
    )
    
    db.add(new_preferences)
    db.commit()
    db.refresh(new_preferences)
    
    return new_preferences


@router.get("/{tenant_id}")
def get_tenant_preferences(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get preferences for a specific tenant (operator only)"""
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    preferences = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant_id
    ).first()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    return preferences


@router.put("/{tenant_id}")
def update_tenant_preferences(
    tenant_id: str,
    pref_update: TenantPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Update preferences for a specific tenant (operator only)"""
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    preferences = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant_id
    ).first()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    # Update fields
    update_data = pref_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(preferences, field, value)
    
    db.commit()
    db.refresh(preferences)
    
    return preferences


@router.delete("/{tenant_id}")
def delete_tenant_preferences(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Delete preferences for a specific tenant (operator only)"""
    
    preferences = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant_id
    ).first()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    db.delete(preferences)
    db.commit()
    
    return {"message": "Preferences deleted successfully"}
