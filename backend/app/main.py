from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    auth, properties, units, rooms, tenants, 
    payments, dashboard, maintenance, announcements
)

settings = get_settings()

app = FastAPI(
    title="CoLiv OS API",
    description="Co-living operations platform with room-level tracking",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "CoLiv OS API",
        "status": "running",
        "version": "1.0.0",
        "description": "MVP Backend Complete"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Include all routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.include_router(units.router, prefix="/api/v1")
app.include_router(rooms.router, prefix="/api/v1")
app.include_router(tenants.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(maintenance.router, prefix="/api/v1")
app.include_router(announcements.router, prefix="/api/v1")
