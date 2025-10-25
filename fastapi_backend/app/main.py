from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import files_router, templates_router, users_router, marking_router, generator_router, auth_router, faculties_router, dashboard_router
from app.database import init_db, close_db, test_database_connection
from app.config import get_app_name, get_app_version, get_debug, get_environment
from app.queue import initialize_queue_system, shutdown_queue_system, rabbitmq_manager
from app.api.deps import initialize_websocket_manager


handlers=[
        logging.StreamHandler(sys.stdout)  # Send logs to stdout
    ]
logging.basicConfig(level=logging.INFO, handlers=handlers)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    print("Starting MCQ Marking System API...")
    
    try:
        # Initialize WebSocket manager first - this must happen before any other operations
        ws_manager = initialize_websocket_manager()
        print(f"WebSocket manager initialized successfully: {id(ws_manager)}")
        
        # Initialize database
        await init_db()
        print("Database initialized successfully")
        
        # Initialize queue system
        await initialize_queue_system()
        print("Queue system initialized successfully")
        
    except Exception as e:
        print(f"Initialization failed: {e}")
        raise e
    
    yield
    
    # Shutdown
    print("Shutting down MCQ Marking System API...")
    
    try:
        # Shutdown queue system
        await shutdown_queue_system()
        print("Queue system shutdown complete")
        
        # Close database
        await close_db()
        print("Database connections closed")
        
    except Exception as e:
        print(f"Shutdown error: {e}")
    
    print("Shutdown complete")


app = FastAPI(
    title=get_app_name(),
    version=get_app_version(),
    description="A comprehensive system for MCQ marking and template management",
    debug=get_debug(),
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(faculties_router)
app.include_router(files_router)
app.include_router(templates_router)
app.include_router(marking_router)
app.include_router(generator_router)
app.include_router(dashboard_router)

@app.get("/health")
async def health_check():
    """Health check endpoint with database and queue connectivity test."""
    db_status = "healthy"
    queue_status = "healthy"
    
    try:
        db_connected = await test_database_connection()
        if not db_connected:
            db_status = "unhealthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    try:
        if not rabbitmq_manager.connection or rabbitmq_manager.connection.is_closed:
            queue_status = "unhealthy: connection not available"
        else:
            queue_status = "healthy"
    except Exception as e:
        queue_status = f"unhealthy: {str(e)}"
    
    overall_status = "healthy"
    if db_status != "healthy" or queue_status != "healthy":
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "database": db_status,
        "queue": queue_status,
        "version": get_app_version(),
        "environment": get_environment()
    }


