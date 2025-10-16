from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRoles


class UserCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str
    role: UserRoles
    faculty_id: int

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    faculty_id: Optional[int] = None

class UserRoleUpdate(BaseModel):
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: UserRoles
    faculty_id: int
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True