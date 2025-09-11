"""
Database models for MCQ OCR System.
"""

from .base import BaseModel
from .user import User
from .template import Template
from .file import File

__all__ = ["BaseModel", "User", "Template", "File"]
