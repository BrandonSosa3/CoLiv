from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import logging

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
)

app = FastAPI(title="CoLiv OS API", version="1.0.0")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods
    allow_headers=["*"],  # allow all headers
)

# ✅ Exception handler for validation errors
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# ✅ Include routers
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

# ✅ Root endpoint
@app.get("/")
def root():
    return {"message": "CoLiv OS API"}

# ✅ Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}
