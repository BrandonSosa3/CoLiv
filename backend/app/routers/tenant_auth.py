from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.user import User
from app.utils.auth import get_password_hash, create_access_token
from typing import Optional

router = APIRouter(prefix="/tenant-auth", tags=["Tenant Authentication"])

class CheckEmailRequest(BaseModel):
    email: EmailStr

class CheckEmailResponse(BaseModel):
    eligible: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    message: str

class TenantSignupRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

class TenantSignupResponse(BaseModel):
    message: str
    access_token: str
    token_type: str

@router.post("/check-email", response_model=CheckEmailResponse)
def check_tenant_eligibility(
    request: CheckEmailRequest,
    db: Session = Depends(get_db)
):
    """Check if email is eligible for tenant signup"""
    
    user = db.query(User).filter(
        User.email == request.email,
        User.role == 'tenant'
    ).first()
    
    if not user:
        return CheckEmailResponse(
            eligible=False,
            message="Email not found. Please contact your property manager to be added as a tenant."
        )
    
    if user.is_activated and user.password_hash:
        return CheckEmailResponse(
            eligible=False,
            message="Account already activated. Please use the login page."
        )
    
    return CheckEmailResponse(
        eligible=True,
        first_name=user.first_name,
        last_name=user.last_name,
        message="Email found! You can create your account."
    )

@router.post("/signup", response_model=TenantSignupResponse)
def tenant_signup(
    signup_data: TenantSignupRequest,
    db: Session = Depends(get_db)
):
    """Allow tenant to create password and activate account"""
    
    if signup_data.password != signup_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    if len(signup_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Find pending tenant user
    user = db.query(User).filter(
        User.email == signup_data.email,
        User.role == 'tenant',
        User.is_activated == False
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found or already activated"
        )
    
    # Activate the account
    user.password_hash = get_password_hash(signup_data.password)
    user.is_activated = True
    
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return TenantSignupResponse(
        message="Account activated successfully",
        access_token=access_token,
        token_type="bearer"
    )
