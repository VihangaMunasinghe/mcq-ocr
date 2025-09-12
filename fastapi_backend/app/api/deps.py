"""
Dependency injection for FastAPI routes.
"""

from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_async_db
from ..config import get_settings

# Settings dependency
def get_app_settings():
    """Get application settings."""
    return get_settings()

# Database dependency
async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    async for session in get_async_db():
        yield session

# You can add more dependencies here as needed, for example:
# - Authentication dependencies
# - Authorization dependencies  
# - Rate limiting dependencies
# - Logging dependencies
