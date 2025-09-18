from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.marking_job import MarkingJobPriority, MarkingJobStatus

class MarkingResponse(BaseModel):
    id: int
    name: str
    description: str
    status: MarkingJobStatus
    priority: MarkingJobPriority
    template_id: int
    marking_scheme_path: str
    answer_sheets_folder_path: str
    intermediate_results_path: str
    output_path: str
    save_intermediate_results: bool
    total_answer_sheets: Optional[int]
    processed_answer_sheets: Optional[int]
    failed_answer_sheets: Optional[int]
    processing_started_at: Optional[datetime]
    processing_completed_at: Optional[datetime]
    results_summary: Optional[dict]
    created_at: datetime
    updated_at: datetime
    created_by: int

class MarkingCreate(BaseModel):
    name: str
    description: str
    template_id: int
    marking_scheme_path: str
    answer_sheets_folder_path: str
    save_intermediate_results: bool
    priority: MarkingJobPriority