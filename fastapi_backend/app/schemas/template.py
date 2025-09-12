from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.models.template import TemplateConfigType

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    config_type: TemplateConfigType
    template_path: str
    save_intermediate_results: bool = False
    
    # Additional fields for clustering-based configuration
    num_of_columns: Optional[int] = None
    num_of_rows_per_column: Optional[int] = None
    num_of_options_per_question: Optional[int] = 4

class TemplateResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    config_type: TemplateConfigType
    configuration_path: str
    template_file_path: str
    total_questions: int
    options_per_question: int
    save_intermediate_results: bool
    created_at: datetime
    updated_at: datetime
    created_by: str