from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database - Pydantic will look for DATABASE_URL env var
    database_url: str
    
    # Security - Pydantic will look for SECRET_KEY, ALGORITHM, etc.
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Environment
    environment: str = "development"
    
    # Frontend URLs (optional, for CORS)
    frontend_url: str = "http://localhost:5173"
    tenant_frontend_url: str = "http://localhost:5174"
    
    class Config:
        env_file = ".env"
        case_sensitive = False  # This allows lowercase field names to read UPPERCASE env vars

@lru_cache()
def get_settings():
    return Settings()

    # Stripe Configuration
