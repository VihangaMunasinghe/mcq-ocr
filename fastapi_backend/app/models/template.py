"""
Template model for MCQ templates.
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel


class Template(BaseModel):
    """Template model for MCQ templates."""
    
    __tablename__ = "templates"
    
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    template_type = Column(String(50), nullable=False)  # e.g., 'mcq', 'fill_in_blanks', etc.
    
    # Template configuration
    total_questions = Column(Integer, nullable=False, default=0)
    questions_per_page = Column(Integer, nullable=False, default=1)
    options_per_question = Column(Integer, nullable=False, default=4)
    
    # Template settings
    is_active = Column(Boolean, default=True, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    
    # Template configuration as JSON
    configuration = Column(JSON, nullable=True)
    
    # File references
    template_file_path = Column(String(255), nullable=True)
    preview_image_path = Column(String(255), nullable=True)
    
    # Foreign keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User", back_populates="templates")
    files = relationship("File", back_populates="template")
    
    def __repr__(self):
        return f"<Template(id={self.id}, name='{self.name}', type='{self.template_type}')>"
