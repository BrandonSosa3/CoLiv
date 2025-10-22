from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant, TenantStatus
from app.models.property import Property
from app.models.unit import Unit
from app.models.room import Room
from app.models.tenant_preference import TenantPreference
from app.schemas.tenant_preference import (
    TenantPreferenceCreate,
    TenantPreferenceUpdate,
    TenantPreferenceResponse,
    TenantPreferenceBase
)
from app.utils.auth import get_current_operator, get_current_user
from app.utils.matching import get_best_matches_for_tenant

router = APIRouter(prefix="/preferences", tags=["Tenant Preferences"])


# ============ TENANT-SPECIFIC ROUTES (must come first) ============

@router.get("/me", response_model=TenantPreferenceResponse)
def get_my_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current tenant's preferences"""
    
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant record not found"
        )
    
    preference = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not set yet"
        )
    
    return preference


@router.post("/me", response_model=TenantPreferenceResponse)
def create_my_preferences(
    preference: TenantPreferenceBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create preferences for current tenant"""
    
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant record not found"
        )
    
    existing = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferences already exist. Use PUT to update."
        )
    
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current tenant's preferences"""
    
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant record not found"
        )
    
    preference = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found. Create them first."
        )
    
    for key, value in preference_update.model_dump(exclude_unset=True).items():
        setattr(preference, key, value)
    
    db.commit()
    db.refresh(preference)
    
    return preference


@router.get("/my-matches")
def get_my_roommate_matches(
    top_n: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-suggested roommate matches for current tenant"""
    
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant record not found"
        )
    
    tenant_pref = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant.id
    ).first()
    
    if not tenant_pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please set your preferences first"
        )
    
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    
    all_rooms_in_property = db.query(Room).join(Unit).filter(
        Unit.property_id == unit.property_id
    ).all()
    room_ids = [r.id for r in all_rooms_in_property]
    
    other_tenants = db.query(Tenant).filter(
        Tenant.room_id.in_(room_ids),
        Tenant.id != tenant.id,
        Tenant.status == TenantStatus.ACTIVE
    ).all()
    
    tenant_ids = [t.id for t in other_tenants]
    all_preferences = db.query(TenantPreference).filter(
        TenantPreference.tenant_id.in_(tenant_ids)
    ).all()
    
    if not all_preferences:
        return []
    
    matches = get_best_matches_for_tenant(tenant_pref, all_preferences, top_n)
    
    enriched_matches = []
    for match in matches:
        other_tenant = db.query(Tenant).filter(Tenant.id == match['tenant_id']).first()
        user = db.query(User).filter(User.id == other_tenant.user_id).first()
        
        enriched_matches.append({
            **match,
            'email': user.email[:3] + '***@' + user.email.split('@')[1],
        })
    
    return enriched_matches


# ============ OPERATOR ROUTES (parameterized routes come after) ============

@router.post("/", response_model=TenantPreferenceResponse)
def create_preference(
    preference: TenantPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Create tenant preferences (operator only)"""
    
    tenant = db.query(Tenant).filter(Tenant.id == preference.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
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
def get_preference_by_tenant(
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
    current_user: User = Depends(get_current_operator)
):
    """Update tenant preferences (operator only)"""
    
    preference = db.query(TenantPreference).filter(
        TenantPreference.id == preference_id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference not found"
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
    """Get AI-suggested roommate matches for a tenant (operator only)"""
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    tenant_pref = db.query(TenantPreference).filter(
        TenantPreference.tenant_id == tenant_id
    ).first()
    
    if not tenant_pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant preferences not found"
        )
    
    room = db.query(Room).filter(Room.id == tenant.room_id).first()
    unit = db.query(Unit).filter(Unit.id == room.unit_id).first()
    
    all_rooms_in_property = db.query(Room).join(Unit).filter(
        Unit.property_id == unit.property_id
    ).all()
    room_ids = [r.id for r in all_rooms_in_property]
    
    other_tenants = db.query(Tenant).filter(
        Tenant.room_id.in_(room_ids),
        Tenant.id != tenant_id,
        Tenant.status == TenantStatus.ACTIVE
    ).all()
    
    tenant_ids = [t.id for t in other_tenants]
    all_preferences = db.query(TenantPreference).filter(
        TenantPreference.tenant_id.in_(tenant_ids)
    ).all()
    
    if not all_preferences:
        return []
    
    matches = get_best_matches_for_tenant(tenant_pref, all_preferences, top_n)
    
    enriched_matches = []
    for match in matches:
        other_tenant = db.query(Tenant).filter(Tenant.id == match['tenant_id']).first()
        user = db.query(User).filter(User.id == other_tenant.user_id).first()
        
        enriched_matches.append({
            **match,
            'email': user.email,
        })
    
    return enriched_matches
