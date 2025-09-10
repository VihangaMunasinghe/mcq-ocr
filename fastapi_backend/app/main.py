from fastapi import FastAPI

app = FastAPI(title="MCQ Marking System API", version="0.1.0")

@app.get("/")
async def root():
    return {"message": "MCQ Marking System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
