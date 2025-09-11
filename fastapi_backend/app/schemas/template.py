from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    template_type: str
    file_path: str

class TemplateResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
