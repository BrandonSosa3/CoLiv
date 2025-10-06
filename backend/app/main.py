from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, properties, units, rooms, tenants

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="CoLiv OS API",
    description="Co-living operations platform with AI roommate matching",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "CoLiv OS API",
        "status": "running",
        "environment": settings.environment,
        "version": "0.1.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.include_router(units.router, prefix="/api/v1")
app.include_router(rooms.router, prefix="/api/v1")
app.include_router(tenants.router, prefix="/api/v1")
