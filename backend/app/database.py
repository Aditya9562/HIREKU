from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

import os

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if os.getenv("VERCEL") and db_url.startswith("sqlite:///"):
    if "./" in db_url:
        db_url = db_url.replace("sqlite:///./", "sqlite:////tmp/")
    else:
        db_url = db_url.replace("sqlite:///", "sqlite:////tmp/")

# Determine database engine settings based on dialect
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = None
    try:
        db = SessionLocal()
        yield db
    except Exception as e:
        import logging
        logging.getLogger("app.database").error(f"Database session creation failed: {e}")
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )
    finally:
        if db is not None:
            db.close()
