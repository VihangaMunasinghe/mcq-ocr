"""
TemplateConfigJob model for handling template configuration operations.
"""

from sqlalchemy import Column, String, Text, Integer, Float, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from .base import BaseModel


class TemplateConfigJobStatus(PyEnum):
    """Enum for template configuration job status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TemplateConfigJobPriority(PyEnum):
    """Enum for template configuration job priority."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class TemplateConfigType(PyEnum):
    """Enum for template configuration type."""
    GRID_BASED = "grid_based"
    CLUSTERING_BASED = "clustering_based"


class TemplateConfigJob(BaseModel):
    """
    TemplateConfigJob model for handling template configuration operations.
    
    This model tracks jobs that process template images to extract bubble
    configurations and generate template configuration files.
    """
    
    __tablename__ = "template_config_jobs"
    
    # Basic job information
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    config_type = Column(Enum(TemplateConfigType), nullable=False)
    
    # Job status and priority
    status = Column(Enum(TemplateConfigJobStatus), nullable=False, default=TemplateConfigJobStatus.PENDING)
    priority = Column(Enum(TemplateConfigJobPriority), nullable=False, default=TemplateConfigJobPriority.NORMAL)
    
    # File paths (relative to NFS storage)
    template_path = Column(String(500), nullable=False)  # Input template image
    template_config_path = Column(String(500), nullable=False)  # Output config JSON
    output_image_path = Column(String(500), nullable=False)  # Warped/processed image
    result_image_path = Column(String(500), nullable=True)  # Debug/result image with annotations
    
    # Processing settings
    save_intermediate_results = Column(Boolean, default=False, nullable=False)
    
    # Image processing metrics
    original_image_width = Column(Integer, nullable=True)
    original_image_height = Column(Integer, nullable=True)
    processed_image_width = Column(Integer, nullable=True)
    processed_image_height = Column(Integer, nullable=True)
    
    # Processing time tracking
    processing_started_at = Column(String(50), nullable=True)  # ISO datetime string
    processing_completed_at = Column(String(50), nullable=True)  # ISO datetime string
    
    # Foreign keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    
    # Relationships
    created_by_user = relationship("User", back_populates="template_config_jobs")
    template = relationship("Template", back_populates="template_config_jobs")
    
    def __repr__(self):
        return f"<TemplateConfigJob(id={self.id}, name='{self.name}', status='{self.status}')>"
    
    @property
    def is_completed(self) -> bool:
        """Check if the job is completed."""
        return self.status == TemplateConfigJobStatus.COMPLETED
    
    @property
    def is_failed(self) -> bool:
        """Check if the job has failed."""
        return self.status == TemplateConfigJobStatus.FAILED
    
    @property
    def can_retry(self) -> bool:
        """Check if the job can be retried."""
        return (
            self.auto_retry and 
            self.current_retry_count < self.max_retry_attempts and 
            self.status == TemplateConfigJobStatus.FAILED
        )
    
    @property
    def has_valid_config(self) -> bool:
        """Check if the job has produced a valid configuration."""
        return (
            self.is_completed and 
            self.template_config_data is not None and 
            self.detected_bubbles_count is not None and 
            self.detected_bubbles_count > 0
        )
    
    def to_job_data(self) -> dict:
        """Convert to job data format for RabbitMQ processing."""
        return {
            'id': self.id,
            'name': self.name,
            'template_path': self.template_path,
            'template_config_path': self.template_config_path,
            'output_image_path': self.output_image_path,
            'result_image_path': self.result_image_path,
            'save_intermediate_results': self.save_intermediate_results,
            'detect_bubbles': self.detect_bubbles,
            'detect_rectangles': self.detect_rectangles,
            'min_bubble_radius': self.min_bubble_radius,
            'max_bubble_radius': self.max_bubble_radius
        }
    
    def update_detection_results(self, 
                               bubble_configs: dict, 
                               bubbles_count: int = None, 
                               rectangles_count: int = None,
                               confidence_score: float = None):
        """Update the job with detection results."""
        self.template_config_data = bubble_configs
        
        if bubbles_count is not None:
            self.detected_bubbles_count = bubbles_count
            
        if rectangles_count is not None:
            self.detected_rectangles_count = rectangles_count
            
        if confidence_score is not None:
            self.confidence_score = confidence_score
            
        # Extract metadata from configuration if available
        if bubble_configs and 'metadata' in bubble_configs:
            self.config_metadata = bubble_configs['metadata']
    
    def update_image_dimensions(self, 
                              original_width: int, 
                              original_height: int,
                              processed_width: int = None, 
                              processed_height: int = None):
        """Update image dimension information."""
        self.original_image_width = original_width
        self.original_image_height = original_height
        
        if processed_width is not None:
            self.processed_image_width = processed_width
            
        if processed_height is not None:
            self.processed_image_height = processed_height
    
    def mark_as_failed(self, error_message: str, error_details: dict = None):
        """Mark the job as failed with error information."""
        self.status = TemplateConfigJobStatus.FAILED
        self.error_message = error_message
        if error_details:
            self.error_details = error_details
            
        # Increment retry count
        self.current_retry_count += 1
    
    def mark_as_completed(self):
        """Mark the job as completed."""
        self.status = TemplateConfigJobStatus.COMPLETED
