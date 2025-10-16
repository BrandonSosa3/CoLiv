from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    properties,
    units,
    rooms,
    tenants,
    payments,
    dashboard,
    maintenance,
    announcements,
    tenant_portal,
    tenant_profile,
    preferences,
)

app = FastAPI(title="CoLiv OS API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.include_router(units.router, prefix="/api/v1")
app.include_router(rooms.router, prefix="/api/v1")
app.include_router(tenants.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(maintenance.router, prefix="/api/v1")
app.include_router(announcements.router, prefix="/api/v1")
app.include_router(tenant_portal.router, prefix="/api/v1")
app.include_router(tenant_profile.router, prefix="/api/v1")
app.include_router(preferences.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "CoLiv OS API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
