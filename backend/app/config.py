import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # FastAPI
    PORT: int = 8000
    DEBUG: bool = True
    
    # Security
    ENCRYPTION_SECRET_KEY: str = Field(default="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef") # 32 bytes hex
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./resumeiq.db") # Fallback to sqlite for ease of local testing
    
    # Clerk Authentication
    CLERK_API_URL: str = Field(default="https://api.clerk.com/v1")
    CLERK_SECRET_KEY: str = Field(default="")
    
    # Supabase Storage
    SUPABASE_URL: str = Field(default="")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="")
    SUPABASE_BUCKET_NAME: str = Field(default="resumes")
    
    # Midtrans Payment
    MIDTRANS_SERVER_KEY: str = Field(default="")
    MIDTRANS_CLIENT_KEY: str = Field(default="")
    MIDTRANS_IS_PRODUCTION: bool = False
    
    # Google Gemini API
    GEMINI_API_KEY: str = Field(default="")
    
    # Anthropic Claude API
    ANTHROPIC_API_KEY: str = Field(default="")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
