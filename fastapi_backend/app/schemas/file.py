from pydantic import BaseModel
from datetime import datetime
from typing import Optional
    

class FileDownloadResponse(BaseModel):
    file_id: int
    filename: str
    file_size: Optional[int] = None
    file_type: str
    status: str
    deletion_date: datetime
    created_by: int
    created_at: datetime
    updated_at: datetime

class FileResponse(BaseModel):
    file_id: int
    filename: str
    file_size: Optional[int] = None
    file_type: str
    status: str
    deletion_date: datetime
    created_by: int
    created_at: datetime
    updated_at: datetime