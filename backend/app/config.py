from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
