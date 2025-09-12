"""
File model for uploaded files and documents.
"""

from sqlalchemy import Column, String, Integer, BigInteger, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from .base import BaseModel


class FileType(PyEnum):
    """Enum for file types."""
    TEMPLATE = "template"
    ANSWER_SHEET = "answer_sheet"
    MARKING_SCHEME = "marking_scheme"
    RESULT = "result"
    REPORT = "report"
    OTHER = "other"


class FileStatus(PyEnum):
    """Enum for file processing status."""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class File(BaseModel):
    """File model for uploaded files and documents."""
    
    __tablename__ = "files"
    
    # File metadata
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=True)
    
    # File categorization
    file_type = Column(Enum(FileType), nullable=False, default=FileType.OTHER)
    status = Column(Enum(FileStatus), nullable=False, default=FileStatus.UPLOADED)
    
    # Processing information
    processing_notes = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Metadata
    file_metadata = Column(Text, nullable=True)  # JSON string for additional metadata
    
    # File organization
    is_archived = Column(Boolean, default=False, nullable=False)
    archive_reason = Column(String(255), nullable=True)
    
    # Foreign keys
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    
    # Relationships
    uploaded_by_user = relationship("User", back_populates="files")
    template = relationship("Template", back_populates="files")
    
    def __repr__(self):
        return f"<File(id={self.id}, filename='{self.filename}', type='{self.file_type}', status='{self.status}')>"
    
    @property
    def file_size_mb(self) -> float:
        """Get file size in megabytes."""
        return self.file_size / (1024 * 1024) if self.file_size else 0.0
    
    @property
    def file_size_kb(self) -> float:
        """Get file size in kilobytes."""
        return self.file_size / 1024 if self.file_size else 0.0
