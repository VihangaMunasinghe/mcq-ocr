from pydantic import BaseModel
from datetime import datetime
    

class FileDownloadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int = None
    file_type: str
    created_by: int
    created_at: datetime
    updated_at: datetime

class FileResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int = None
    file_type: str
    status: str
    deletion_date: datetime
    created_by: int
    created_at: datetime
    updated_at: datetime