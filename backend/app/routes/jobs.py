from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Resume, AuditLog
from app.services.storage import storage_service

router = APIRouter(prefix="/jobs", tags=["Background Jobs"])

@router.post("/cleanup", status_code=status.HTTP_200_OK)
def run_cleanup_job(db: Session = Depends(get_db)):
    """Find and delete all resumes and storage files that have expired (older than 30 days)"""
    now = datetime.utcnow()
    
    # Query resumes past their expiration date
    expired_resumes = db.query(Resume).filter(Resume.expires_at <= now).all()
    count = len(expired_resumes)
    
    if count == 0:
        return {"status": "success", "message": "No expired resumes found."}
        
    deleted_paths = []
    try:
        for resume in expired_resumes:
            # Delete physical file from Supabase storage
            storage_service.delete_file(resume.storage_path)
            deleted_paths.append(resume.storage_path)
            
            # Delete the database entry (cascades to analyses and reports)
            db.delete(resume)
            
        # Log to audit trail
        audit = AuditLog(
            action="AUTO_CLEANUP_EXPIRED_RESUMES",
            details={
                "count_deleted": count,
                "deleted_paths": deleted_paths
            }
        )
        db.add(audit)
        
        db.commit()
        return {
            "status": "success", 
            "message": f"Successfully deleted {count} expired resumes and files."
        }
    except Exception as e:
        db.rollback()
        return {
            "status": "failed", 
            "message": f"An error occurred during cleanup: {str(e)}"
        }
