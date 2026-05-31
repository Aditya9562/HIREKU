from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

import os

db_url = settings.DATABASE_URL
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
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
