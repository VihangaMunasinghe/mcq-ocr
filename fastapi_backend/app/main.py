from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import files_router, templates_router, users_router
from app.database import init_db, close_db, test_database_connection
from app.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    print("🚀 Starting MCQ Marking System API...")
    
    try:
        # Initialize database
        await init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise e
    
    yield
    
    # Shutdown
    print("🔄 Shutting down MCQ Marking System API...")
    await close_db()
    print("✅ Shutdown complete")


app = FastAPI(
    title=settings.app.app_name,
    version=settings.app.app_version,
    description="A comprehensive system for MCQ marking and template management",
    debug=settings.app.debug,
    lifespan=lifespan
)

# Configure CORS for large file uploads
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "MCQ Marking System API"}

@app.get("/health")
async def health_check():
    """Health check endpoint with database connectivity test."""
    db_status = "healthy"
    try:
        db_connected = await test_database_connection()
        if not db_connected:
            db_status = "unhealthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": settings.app.app_version,
        "environment": settings.app.environment
    }

# Include routers
app.include_router(files_router)
app.include_router(templates_router)
app.include_router(users_router)

