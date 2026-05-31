from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Resume
from app.schemas import UserProfile, UserDeletionStatus
from app.services.storage import storage_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user"""
    return current_user

@router.post("/sync", response_model=UserProfile)
def sync_user(current_user: User = Depends(get_current_user)):
    """Sync user state from Clerk token and return user profile"""
    return current_user

@router.delete("/delete-account", response_model=UserDeletionStatus)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user profile, all uploaded resumes, generated analyses, and transactions"""
    try:
        # Get all resumes for user to clean up storage
        resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
        for r in resumes:
            storage_service.delete_file(r.storage_path)
            
        # Delete user from DB (Cascades delete to resumes, job targets, analyses, premium reports, transactions)
        db.delete(current_user)
        db.commit()
        
        return UserDeletionStatus(
            success=True,
            message="Your account and all associated data have been permanently deleted."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting your account: {str(e)}"
        )
