"""
Template model for MCQ templates.
"""

from enum import Enum
from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.models.template_config_job import TemplateConfigType
from .base import BaseModel



class Template(BaseModel):
    """Template model for MCQ templates."""
    
    __tablename__ = "templates"
    
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    template_config_type = Column(Enum(TemplateConfigType), nullable=False)
    
    # Template configuration
    total_questions = Column(Integer, nullable=False, default=0)
    options_per_question = Column(Integer, nullable=False, default=4)
    
    # Template configuration as JSON
    configuration = Column(String(255), nullable=True)
    
    # File references
    template_file_path = Column(String(255), nullable=True)
    preview_image_path = Column(String(255), nullable=True)
    
    # Foreign keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User", back_populates="templates")
    files = relationship("File", back_populates="template")
    marking_jobs = relationship("MarkingJob", back_populates="template")
    template_config_jobs = relationship("TemplateConfigJob", back_populates="template")
    
    def __repr__(self):
        return f"<Template(id={self.id}, name='{self.name}', type='{self.template_type}')>"
