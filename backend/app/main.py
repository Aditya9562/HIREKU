from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import auth, resumes, analyses, payments, premium, admin, jobs

# Create database tables automatically (for rapid local developer onboarding)
try:
    Base.metadata.create_all(bind=engine)
except Exception as db_err:
    import logging
    logging.getLogger("app.main").error(f"Failed to create database tables: {db_err}")

import os

root_path = "/_/backend" if os.getenv("VERCEL") else ""

app = FastAPI(
    title="ResumeIQ API",
    description="Backend services for ResumeIQ resume analysis SaaS",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    root_path=root_path
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to capture client IP address and user-agent
@app.middleware("http")
async def add_client_ip_to_state(request: Request, call_next):
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Get first IP in chain
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "127.0.0.1"
        
    request.state.client_ip = ip
    
    # Sync IP to user context in endpoints by intercepting
    # (or let the endpoint fetch it from request.state.client_ip)
    response = await call_next(request)
    return response

# Mount APIs
api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(resumes.router, prefix=api_prefix)
app.include_router(analyses.router, prefix=api_prefix)
app.include_router(payments.router, prefix=api_prefix)
app.include_router(premium.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(jobs.router, prefix=api_prefix)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "app": "ResumeIQ API Gateway",
        "debug_mode": settings.DEBUG
    }
