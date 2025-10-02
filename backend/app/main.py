from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="CoLiv OS API",
    description="Co-living operations platform with AI roommate matching",
    version="0.1.0"
)

# Configure CORS (for frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "CoLiv OS API",
        "status": "running",
        "environment": settings.environment
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# We'll add routers here as we build features
# from app.routers import properties, units, rooms, tenants
# app.include_router(properties.router)
# app.include_router(units.router)
# app.include_router(rooms.router)
# app.include_router(tenants.router)
