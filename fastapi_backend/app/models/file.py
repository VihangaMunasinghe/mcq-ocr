"""
File model for uploaded files and documents.
"""

from datetime import datetime, timedelta
from sqlalchemy import Column, DateTime, String, Integer, BigInteger, ForeignKey, Enum
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from .base import BaseModel


class FileAndFolderType(PyEnum):
    """Enum for file types."""
    TEMPLATE = "template"
    TEMPLATE_CONFIG = "template_config"
    ANSWER_SHEETS_FOLDER = "answer_sheets_folder"
    MARKING_SCHEME = "marking_scheme"
    MARKING_CONFIG = "marking_config"
    RESULT = "result"
    REPORT = "report"
    OTHER = "other"


class FileAndFolderStatus(PyEnum):
    """Enum for file processing status."""
    PENDING = "pending"
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    FAILED = "failed"
    DELETED = "deleted"


class FileAndFolder(BaseModel):
    """File model for uploaded files and documents."""
    
    __tablename__ = "files_and_folders"
    
    # File metadata
    name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=True)
    path = Column(String(500), nullable=False)
    size = Column(BigInteger, nullable=True)
    extension = Column(String(100), nullable=True)
    
    # File categorization
    file_type = Column(Enum(FileAndFolderType), nullable=False, default=FileAndFolderType.OTHER)
    status = Column(Enum(FileAndFolderStatus), nullable=False, default=FileAndFolderStatus.PENDING)
    
    # File organization
    deletion_date = Column(DateTime, nullable=False, default=datetime.now() + timedelta(days=7))
    
    # Foreign keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User", back_populates="files_and_folders")
    
    def __repr__(self):
        return f"<FileAndFolder(id={self.id}, name='{self.name}', type='{self.file_type}', status='{self.status}')>"
    
    @property
    def file_size_mb(self) -> float:
        """Get file size in megabytes."""
        return self.size / (1024 * 1024) if self.size else 0.0
    
    @property
    def file_size_kb(self) -> float:
        """Get file size in kilobytes."""
        return self.size / 1024 if self.size else 0.0
