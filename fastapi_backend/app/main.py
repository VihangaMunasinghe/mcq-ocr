from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import files_router, templates_router, users_router

app = FastAPI(title="MCQ Marking System API", version="0.1.0")

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
    return {"status": "healthy"}

# Include routers
app.include_router(files_router)
app.include_router(templates_router)
app.include_router(users_router)

