from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from app.routers import (
    auth,
    dashboard,
    properties,
    units,
    rooms,
    tenants,
    payments,
    maintenance,
    announcements,
    preferences,
    tenant_portal,
    tenant_auth
)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CoLiv API",
    description="Co-living property management platform",
    version="1.0.0"
)

# Environment-based CORS configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # Production: Only allow specific domains
    allowed_origins = [
        os.getenv("FRONTEND_URL"),
        os.getenv("TENANT_FRONTEND_URL"),
    ]
    # Remove None values
    allowed_origins = [origin for origin in allowed_origins if origin]
else:
    # Development: Allow all localhost ports
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "message": "CoLiv API is running"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.include_router(units.router, prefix="/api/v1")
app.include_router(rooms.router, prefix="/api/v1")
app.include_router(tenants.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(maintenance.router, prefix="/api/v1")
app.include_router(announcements.router, prefix="/api/v1")
app.include_router(preferences.router, prefix="/api/v1")
app.include_router(tenant_portal.router, prefix="/api/v1")
app.include_router(tenant_auth.router, prefix="/api/v1")
