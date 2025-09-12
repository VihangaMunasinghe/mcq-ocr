"""
Database models for MCQ OCR System.
"""

from .base import BaseModel
from .user import User
from .template import Template
from .file import File
from .marking_job import MarkingJob
from .template_config_job import TemplateConfigJob

__all__ = [
    "BaseModel", 
    "User", 
    "Template", 
    "File", 
    "MarkingJob", 
    "TemplateConfigJob"
]
