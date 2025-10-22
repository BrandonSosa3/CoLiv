from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_preference import TenantPreference
from app.schemas.tenant_preference import (
    TenantPreferenceCreate,
    TenantPreferenceUpdate,
    TenantPreferenceResponse,
    TenantPreferenceBase
)
from app.utils.auth import get_current_user, get_current_tenant
from app.utils.matching import calculate_compatibility_score, find_roommate_matches

router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.get("/me", response_model=TenantPreferenceResponse)
def get_my_preferences(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get current tenant's preferences"""
    preference = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    return preference


@router.post("/me", response_model=TenantPreferenceResponse)
def create_my_preferences(
    preference: TenantPreferenceBase,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create preferences for current tenant"""
    # Check if preferences already exist
    existing = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferences already exist for this tenant"
        )
    
    # Create new preferences
    db_preference = TenantPreference(
        tenant_id=tenant.id,
        **preference.model_dump()
    )
    db.add(db_preference)
    db.commit()
    db.refresh(db_preference)
    
    return db_preference


@router.put("/me", response_model=TenantPreferenceResponse)
def update_my_preferences(
    preference_update: TenantPreferenceUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Update current tenant's preferences"""
    preference = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    # Update fields
    for field, value in preference_update.model_dump(exclude_unset=True).items():
        setattr(preference, field, value)
    
    db.commit()
    db.refresh(preference)
    
    return preference


@router.get("/matches", response_model=List[dict])
def get_my_matches(
    top_n: int = 5,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get roommate matches for current tenant"""
    # Get tenant's preferences
    tenant_pref = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if not tenant_pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found. Please set your preferences first."
        )
    
    # Get all other tenants with preferences
    other_tenants = db.query(Tenant).filter(
        Tenant.id != tenant.id,
        Tenant.status == 'active'
    ).all()
    
    tenant_ids = [t.id for t in other_tenants]
    all_preferences = db.query(TenantPreference).filter(
        TenantPreference.tenant_id.in_(tenant_ids)
    ).all()
    
    # Calculate matches
    matches = find_roommate_matches(tenant_pref, all_preferences, top_n)
    
    return matches


@router.post("/", response_model=TenantPreferenceResponse)
def create_preferences(
    preference: TenantPreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create preferences for a tenant (operator only)"""
    # Check if tenant exists
    tenant = db.query(Tenant).filter(Tenant.id == preference.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if preferences already exist
    existing = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == preference.tenant_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferences already exist for this tenant"
        )
    
    # Create preferences
    db_preference = TenantPreference(**preference.model_dump())
    db.add(db_preference)
    db.commit()
    db.refresh(db_preference)
    
    return db_preference


@router.get("/tenant/{tenant_id}", response_model=TenantPreferenceResponse)
def get_tenant_preferences(
    tenant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get preferences for a specific tenant (operator only)"""
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
def update_preferences(
    preference_id: str,
    preference_update: TenantPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update preferences (operator only)"""
    preference = db.query(TenantPreference).filter(
        TenantPreference.id == preference_id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    # Update fields
    for field, value in preference_update.model_dump(exclude_unset=True).items():
        setattr(preference, field, value)
    
    db.commit()
    db.refresh(preference)
    
    return preference


@router.get("/matches/{tenant_id}", response_model=List[dict])
def get_tenant_matches(
    tenant_id: str,
    top_n: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get roommate matches for a specific tenant (operator only)"""
    # Get tenant's preferences
    tenant_pref = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant_id
    ).first()
    
    if not tenant_pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found for this tenant"
        )
    
    # Get all other tenants with preferences
    other_tenants = db.query(Tenant).filter(
        Tenant.id != tenant_id,
        Tenant.status == 'active'
    ).all()
    
    other_tenant_ids = [t.id for t in other_tenants]
    all_preferences = db.query(TenantPreference).filter(
        TenantPreference.tenant_id.in_(other_tenant_ids)
    ).all()
    
    # Calculate matches
    matches = find_roommate_matches(tenant_pref, all_preferences, top_n)
    
    return matches
