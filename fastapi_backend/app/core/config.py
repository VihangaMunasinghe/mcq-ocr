import os

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://mcq_user:mcq_password@localhost:5432/mcq_database")

# Other Configuration
DEBUG = os.getenv("DEBUG", "False").lower() == "true"