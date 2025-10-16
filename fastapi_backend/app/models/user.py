from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class UserRoles(Enum):
    SUPERADMIN = 'Super User'
    FACULTYADMIN = 'Faculty Admin'
    BASIC = 'Basic User'

class User(BaseModel):
    """User model for authentication and user management."""
    
    __tablename__ = "users"
    email = Column(String(100), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(UserRoles, nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id"), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    faculty = relationship("Faculty", back_populates="users")
    templates = relationship("Template", back_populates="created_by_user")
    files = relationship("FileOrFolder", back_populates="created_by_user")
    marking_jobs = relationship("MarkingJob", back_populates="created_by_user")
    template_config_jobs = relationship("TemplateConfigJob", back_populates="created_by_user")
    
    def __repr__(self):
        return f"<User(id={self.id}, first_name='{self.first_name}', last_name='{self.last_name}', email='{self.email}')>"
