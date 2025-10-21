"""
Configuration management for MCQ OCR System.
"""

import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    
    database_url: str = Field(
        default="postgresql://mcq_user:mcq_password@localhost:5432/mcq_database",
        env="DATABASE_URL",
        description="PostgreSQL database connection URL"
    )
    
    database_host: str = Field(
        default="localhost",
        env="DATABASE_HOST"
    )
    
    database_port: int = Field(
        default=5432,
        env="DATABASE_PORT"
    )
    
    database_name: str = Field(
        default="mcq_database",
        env="DATABASE_NAME"
    )
    
    database_user: str = Field(
        default="mcq_user",
        env="DATABASE_USER"
    )
    
    database_password: str = Field(
        default="mcq_password",
        env="DATABASE_PASSWORD"
    )
    
    # Database pool settings
    database_pool_size: int = Field(
        default=10,
        env="DATABASE_POOL_SIZE"
    )
    
    database_max_overflow: int = Field(
        default=20,
        env="DATABASE_MAX_OVERFLOW"
    )
    
    database_pool_recycle: int = Field(
        default=300,
        env="DATABASE_POOL_RECYCLE"
    )
    
    database_echo: bool = Field(
        default=False,
        env="DATABASE_ECHO"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


class AppSettings(BaseSettings):
    """Application configuration settings."""
    
    app_name: str = Field(
        default="MCQ OCR System",
        env="APP_NAME"
    )
    
    app_version: str = Field(
        default="1.0.0",
        env="APP_VERSION"
    )
    
    debug: bool = Field(
        default=True,
        env="DEBUG"
    )
    
    environment: str = Field(
        default="development",
        env="ENVIRONMENT"
    )
    
    # CORS settings
    allowed_hosts: list = Field(
        default=["*"],
        env="ALLOWED_HOSTS"
    )
    
    # File upload settings
    max_upload_size: int = Field(
        default=100 * 1024 * 1024,  # 100MB
        env="MAX_UPLOAD_SIZE"
    )
    
    upload_dir: str = Field(
        default="uploads",
        env="UPLOAD_DIR"
    )
    
    # NFS/Shared storage settings
    nfs_shared_path: str = Field(
        default="/shared",
        env="NFS_SHARED_PATH"
    )



    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


class RabbitMQSettings(BaseSettings):
    """RabbitMQ configuration settings."""
    
    rabbitmq_url: str = Field(
        default="amqp://admin:secret@localhost:5673",
        env="RABBITMQ_URL"
    )
    
    rabbitmq_host: str = Field(
        default="localhost",
        env="RABBITMQ_HOST"
    )
    
    rabbitmq_port: int = Field(
        default=5672,
        env="RABBITMQ_PORT"
    )
    
    rabbitmq_user: str = Field(
        default="admin",
        env="RABBITMQ_USER"
    )
    
    rabbitmq_password: str = Field(
        default="secret",
        env="RABBITMQ_PASSWORD"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

class AuthSettings(BaseSettings):
    """Authentication settings."""
    
    secret_key: str = Field(
        default="your-secret-key-change-this-in-production",
        env="SECRET_KEY",
        description="Secret key for JWT token signing"
    )
    
    algorithm: str = Field(
        default="HS256",
        env="JWT_ALGORITHM",
        description="JWT signing algorithm"
    )
    
    access_token_expire_minutes: int = Field(
        default=30,
        env="ACCESS_TOKEN_EXPIRE_MINUTES",
        description="Access token expiration time in minutes"
    )
    
    refresh_token_expire_days: int = Field(
        default=7,
        env="REFRESH_TOKEN_EXPIRE_DAYS",
        description="Refresh token expiration time in days"
    )
    
    # Super user settings
    super_user_email: str = Field(
        default="superadmin@uom.lk",
        env="SUPER_USER_EMAIL",
        description="Super user email for initial admin access"
    )
    
    super_user_password_hashed: str = Field(
        default="$2b$12$default_hashed_password_change_this",
        env="SUPER_USER_PASSWORD_HASHED",
        description="Super user hashed password"
    )
    
    # Cookie settings
    cookie_secure: bool = Field(
        default=True,
        env="COOKIE_SECURE",
        description="Use secure cookies (HTTPS only)"
    )
    
    cookie_samesite: str = Field(
        default="none",
        env="COOKIE_SAMESITE",
        description="SameSite cookie policy"
    )
    
    cookie_httponly: bool = Field(
        default=True,
        env="COOKIE_HTTPONLY",
        description="Use HttpOnly cookies"
    )

    super_user_email: str = Field(
        default="superuser@uom.lk",
        env="SUPER_USER_EMAIL",
        description="Super user email"
    )

    super_user_password_hashed: str = Field(
        default="$2a$12$qAMxLPnimk9bnf8zEINXD.2wWdMJmtHTUmKINN2bjc8pDtr9/T4Ne",
        env="SUPER_USER_EMAIL",
        description="Super user hashed password"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    

class Settings(BaseSettings):
    """Main settings class combining all configuration."""
    
    # Initialize sub-settings
    database: DatabaseSettings = DatabaseSettings()
    app: AppSettings = AppSettings()
    rabbitmq: RabbitMQSettings = RabbitMQSettings()
    auth: AuthSettings = AuthSettings()
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Create global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings


# Database URL construction
def get_database_url() -> str:
    """Construct database URL from settings."""
    return (
        f"postgresql://{settings.database.database_user}:"
        f"{settings.database.database_password}@"
        f"{settings.database.database_host}:"
        f"{settings.database.database_port}/"
        f"{settings.database.database_name}"
    )


def get_async_database_url() -> str:
    """Construct async database URL from settings."""
    return (
        f"postgresql+asyncpg://{settings.database.database_user}:"
        f"{settings.database.database_password}@"
        f"{settings.database.database_host}:"
        f"{settings.database.database_port}/"
        f"{settings.database.database_name}"
    )

def get_super_user_creds() -> dict:
    """Return super user email and password"""
    return ({
        "email": settings.auth.super_user_email,
        "super_user_password_hashed": settings.auth.super_user_password_hashed
    })