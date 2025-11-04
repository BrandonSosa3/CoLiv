from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.operator import Operator
from app.models.tenant import Tenant
from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    print(f"DEBUG: Received token: {token[:20]}...")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_email: str = payload.get("sub")
        print(f"DEBUG: Decoded email from token: {user_email}")
        if user_email is None:
            print("DEBUG: No sub in payload")
            raise credentials_exception
    except JWTError as e:
        print(f"DEBUG: JWT decode error: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.email == user_email).first()
    print(f"DEBUG: Found user: {user.email if user else 'None'}")
    if user is None:
        print("DEBUG: User not found in database")
        raise credentials_exception
    
    print(f"DEBUG: User role: {user.role}")
    return user


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


def get_current_operator(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Get current operator user"""
    if current_user.role != 'operator':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Operator access required."
        )
    
    # Ensure operator profile exists
    operator = db.query(Operator).filter(Operator.user_id == current_user.id).first()
    if not operator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operator profile not found"
        )
    
    # Attach operator to user object for easy access
    current_user.operator = operator
    return current_user
