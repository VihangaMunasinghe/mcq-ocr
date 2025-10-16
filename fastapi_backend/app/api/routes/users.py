from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.schemas.user import UserResponse, UserRoleUpdate, UserUpdate
from app.database import get_async_db
from app.models.user import User, VerifyStatus

router = APIRouter(prefix="/api/users", tags=["users"])

logger = logging.getLogger(__name__)

@router.get("/", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_async_db)
):
    """List all users"""
    try:
        result = await db.execute(select(User).order_by(User.created_at.desc()))
        users = result.scalars().all()
        return [UserResponse.from_orm(user) for user in users]
    except Exception as e:
        logger.error(f"Failed to list users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list users")

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """Get user details by ID"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse.from_orm(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    db: AsyncSession = Depends(get_async_db)
):
    """Update a user by ID"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update fields if provided
        if user_update.first_name is not None:
            user.first_name = user_update.first_name
        if user_update.last_name is not None:
            user.last_name = user_update.last_name
        if user_update.faculty_id is not None:
            user.faculty_id = user_update.faculty_id
            
        await db.commit()
        await db.refresh(user)
        
        return UserResponse.from_orm(user)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update user")
    
@router.patch("/{user_id}/verify", response_model=UserResponse)
async def verify_user(
    user_id: int, 
    db: AsyncSession = Depends(get_async_db)
):
    """Verify a user by setting their verify status to admin verified"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update verify status to admin verified
        user.verify_status = VerifyStatus.ADMINVERIFIED
        
        await db.commit()
        await db.refresh(user)
        
        return UserResponse.from_orm(user)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to verify user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to verify user")

@router.patch("/{user_id}/update-role", response_model=UserResponse)
async def update_role(
    user_id: int, 
    user_role_update: UserRoleUpdate, 
    db: AsyncSession = Depends(get_async_db)
):
    """Update a user's role by ID"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.role = user_role_update.role
        
        await db.commit()
        await db.refresh(user)
        
        return UserResponse.from_orm(user)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update user role: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update user role")
    

@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: int, 
    db: AsyncSession = Depends(get_async_db)
):
    """Delete a user by ID"""
    try:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Store user data before deletion for response
        user_response = UserResponse.from_orm(user)
        
        await db.delete(user)
        await db.commit()
        
        return user_response
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user")


