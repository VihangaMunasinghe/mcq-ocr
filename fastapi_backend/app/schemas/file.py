from pydantic import BaseModel
from datetime import datetime

class File(BaseModel):
    file_path: str
    file_type: str
    file_name: str
    file_size: int
    file_content: bytes
    file_metadata: dict

class FileCreate(File):
    pass

class FileUpdate(File):
    pass

class FileDelete(BaseModel):
    file_path: str
    

class FileGet(File):
    created_at: datetime
    updated_at: datetime

class FileResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    content_type: str
    created_at: datetime

class FileUploadResponse(BaseModel):
    message: str
    filename: str
    file_id: str
    path: str
    file_size: int = None