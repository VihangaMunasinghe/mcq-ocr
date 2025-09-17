"""
MarkingJob model for handling MCQ answer sheet marking operations.
"""

from sqlalchemy import Column, String, Text, Integer, Float, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from .base import BaseModel


class MarkingJobStatus(PyEnum):
    """Enum for marking job status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class MarkingJobPriority(PyEnum):
    """Enum for marking job priority."""
    NORMAL = "normal"
    URGENT = "urgent"


class MarkingJob(BaseModel):
    """
    MarkingJob model for handling MCQ answer sheet marking operations.
    
    This model tracks marking jobs that process answer sheets against templates
    and marking schemes to produce scores and results.
    """
    
    __tablename__ = "marking_jobs"

    # Basic job information
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Job status and priority
    status = Column(Enum(MarkingJobStatus), nullable=False, default=MarkingJobStatus.PENDING)
    priority = Column(Enum(MarkingJobPriority), nullable=False, default=MarkingJobPriority.NORMAL)

    # File references and paths
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    marking_scheme_path = Column(String(500), nullable=False)
    answer_sheets_folder_path = Column(String(500), nullable=False)

    # Output paths
    output_path = Column(String(500), nullable=False)
    intermediate_results_path = Column(String(500), nullable=False)

    # Processing settings
    save_intermediate_results = Column(Boolean, default=False, nullable=False)

    # Job metrics and results
    total_answer_sheets = Column(Integer, nullable=True)
    processed_answer_sheets = Column(Integer, default=0, nullable=True)
    failed_answer_sheets = Column(Integer, default=0, nullable=True)

    # Processing time tracking
    processing_started_at = Column(String(50), nullable=True)  # ISO datetime string
    processing_completed_at = Column(String(50), nullable=True)  # ISO datetime string

    # Error handling
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)  # Store structured error information

    # Results summary
    results_summary = Column(JSON, nullable=True)  # Store aggregate results

    # Foreign keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User", back_populates="marking_jobs")
    template = relationship("Template", back_populates="marking_jobs")
    
    def __repr__(self):
        return f"<MarkingJob(id={self.id}, name='{self.name}', status='{self.status}')>"
    
    @property
    def completion_percentage(self) -> float:
        """Calculate completion percentage."""
        if not self.total_answer_sheets or self.total_answer_sheets == 0:
            return 0.0
        return (self.processed_answer_sheets / self.total_answer_sheets) * 100
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate of processed answer sheets."""
        total_processed = self.processed_answer_sheets + self.failed_answer_sheets
        if total_processed == 0:
            return 0.0
        return (self.processed_answer_sheets / total_processed) * 100
    
    @property
    def is_completed(self) -> bool:
        """Check if the job is completed."""
        return self.status == MarkingJobStatus.COMPLETED
    
    @property
    def is_failed(self) -> bool:
        """Check if the job has failed."""
        return self.status == MarkingJobStatus.FAILED
    
    @property
    def can_retry(self) -> bool:
        """Check if the job can be retried."""
        return self.status == MarkingJobStatus.FAILED
    
    def to_job_data(self) -> dict:
        """Convert to job data format for RabbitMQ processing."""
        return {
            'id': self.id,
            'name': self.name,
            'template_id': self.template_id,
            'marking_path': self.marking_scheme_path,
            'answers_folder_path': self.answer_sheets_folder_path,
            'output_path': self.output_path,
            'intermediate_results_path': self.intermediate_results_path,
            'save_intermediate_results': self.save_intermediate_results
        }
    
    def update_progress(self, processed: int, failed: int = 0):
        """Update job progress."""
        self.processed_answer_sheets = processed
        self.failed_answer_sheets = failed
        
        # Update status based on progress
        if self.total_answer_sheets and processed + failed >= self.total_answer_sheets:
            if failed == 0:
                self.status = MarkingJobStatus.COMPLETED
            else:
                # Determine if we should mark as completed or failed based on success rate
                success_rate = (processed / (processed + failed)) * 100
                if success_rate >= 50:  # At least 50% success rate
                    self.status = MarkingJobStatus.COMPLETED
                else:
                    self.status = MarkingJobStatus.FAILED
