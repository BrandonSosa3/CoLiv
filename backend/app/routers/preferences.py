from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_preference import TenantPreference
from app.schemas.tenant_preference import (
    TenantPreferenceCreate,
    TenantPreferenceUpdate,
    TenantPreferenceResponse
)
from app.utils.auth import get_current_operator, get_current_user
from app.utils.matching import get_best_matches_for_tenant

router = APIRouter(prefix="/preferences", tags=["Tenant Preferences"])


@router.post("/", response_model=TenantPreferenceResponse)
def create_preference(
    preference: TenantPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create tenant preferences (operator only)"""
    
    # Verify tenant exists and belongs to operator
    tenant = db.query(Tenant).filter(Tenant.id == preference.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if preference already exists
    existing = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == preference.tenant_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferences already exist for this tenant"
        )
    
    db_preference = TenantPreference(**preference.model_dump())
    db.add(db_preference)
    db.commit()
    db.refresh(db_preference)
    
    return db_preference


@router.get("/tenant/{tenant_id}", response_model=TenantPreferenceResponse)
def get_tenant_preference(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get preferences for a specific tenant"""
    
    preference = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant_id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    return preference


@router.put("/{preference_id}", response_model=TenantPreferenceResponse)
def update_preference(
    preference_id: str,
    preference_update: TenantPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update tenant preferences"""
    
    preference = db.query(TenantPreference).filter(
        TenantPreference.id == preference_id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    for key, value in preference_update.model_dump(exclude_unset=True).items():
        setattr(preference, key, value)
    
    db.commit()
    db.refresh(preference)
    
    return preference


@router.get("/matches/{tenant_id}")
def get_roommate_matches(
    tenant_id: str,
    top_n: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Get AI-suggested roommate matches for a tenant"""
    
    # Get tenant's preferences
    tenant_pref = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant_id
    ).first()
    
    if not tenant_pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant preferences not found. Please set preferences first."
        )
    
    # Get all other tenant preferences in the same property/unit
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    # For now, get all tenants' preferences (could filter by property later)
    all_preferences = db.query(TenantPreference).all()
    
    # Calculate matches
    matches = get_best_matches_for_tenant(tenant_pref, all_preferences, top_n)
    
    # Enrich with tenant info
    enriched_matches = []
    for match in matches:
        matched_tenant = db.query(Tenant).filter(
            Tenant.id == match["tenant_id"]
        ).first()
        
        if matched_tenant:
            from app.models.user import User
            user = db.query(User).filter(User.id == matched_tenant.user_id).first()
            
            enriched_matches.append({
                **match,
                "email": user.email,
                "current_room_id": str(matched_tenant.room_id)
            })
    
    return enriched_matches
