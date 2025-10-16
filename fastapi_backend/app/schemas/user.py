from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRoles, VerifyStatus

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    faculty_id: Optional[int] = None

class UserRoleUpdate(BaseModel):
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: UserRoles
    verify_status: VerifyStatus
    faculty_id: Optional[int]  # Made optional to support super user
    last_login: Optional[datetime]
    created_at: Optional[datetime]  # Made optional to support super user
    updated_at: Optional[datetime]  # Made optional to support super user
    
    class Config:
        from_attributes = True