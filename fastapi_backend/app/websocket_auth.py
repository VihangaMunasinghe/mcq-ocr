"""
WebSocket Authentication Utilities
Handles authentication for WebSocket connections using HttpOnly cookies
"""

from fastapi import WebSocket, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.routes.auth import get_user_from_token
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

def extract_token_from_websocket_cookies(websocket: WebSocket) -> str | None:
    """
    Extract JWT token from WebSocket cookie header
    
    Args:
        websocket: FastAPI WebSocket instance
        
    Returns:
        JWT token string or None if not found
    """
    try:
        cookie_header = websocket.headers.get("cookie", "")
        
        if not cookie_header:
            return None
            
        # Parse cookies to find access_token
        for cookie in cookie_header.split(";"):
            cookie = cookie.strip()
            if cookie.startswith("access_token="):
                token = cookie.split("access_token=", 1)[1]
                return token
                
        return None
        
    except Exception as e:
        logger.error(f"Failed to extract token from WebSocket cookies: {e}")
        return None

async def authenticate_websocket(websocket: WebSocket, db: AsyncSession) -> User | None:
    """
    Authenticate WebSocket connection using HttpOnly cookies
    
    Args:
        websocket: FastAPI WebSocket instance
        db: Database session
        
    Returns:
        User object if authenticated, None otherwise
    """
    try:
        # Extract token from cookies
        token = extract_token_from_websocket_cookies(websocket)
        
        if not token:
            logger.warning("No access token found in WebSocket cookies")
            return None
            
        # Validate token and get user (reuse existing function)
        user = await get_user_from_token(token, db)
        
        if not user:
            logger.warning("Invalid token in WebSocket authentication")
            return None
            
        logger.info(f"WebSocket authenticated for user {user.id}")
        return user
        
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        return None

async def websocket_auth_required(websocket: WebSocket, db: AsyncSession, accept_connection: bool = True) -> User:
    """
    Decorator-like function to require authentication for WebSocket endpoints
    
    Args:
        websocket: FastAPI WebSocket instance  
        db: Database session
        accept_connection: Whether to accept the WebSocket connection
        
    Returns:
        User object if authenticated
        
    Raises:
        Closes WebSocket connection if authentication fails
    """
    # Extract token before accepting connection
    token = extract_token_from_websocket_cookies(websocket)
    
    if not token:
        if accept_connection:
            await websocket.accept()
        await websocket.close(code=1008, reason="Authentication required")
        raise Exception("No authentication token found")
    
    try:
        # Validate token and get user (reuse existing function)
        user = await get_user_from_token(token, db)
        
        if not user:
            if accept_connection:
                await websocket.accept()
            await websocket.close(code=1008, reason="Invalid authentication token")
            raise Exception("Invalid authentication token")
            
        logger.info(f"WebSocket authenticated for user {user.id}")
        
        # Accept connection after successful authentication
        if accept_connection:
            await websocket.accept()
            
        return user
        
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        if accept_connection:
            await websocket.accept()
        await websocket.close(code=1008, reason="Authentication failed")
        raise