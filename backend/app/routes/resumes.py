import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import json

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Resume, AuditLog
from app.schemas import ResumeResponse, UserDeletionStatus
from app.services.storage import storage_service, LOCAL_STORAGE_DIR
from app.services.parser import resume_parser
from app.services.preprocessor import preprocessor_engine
from app.services.security import encryption_service

router = APIRouter(prefix="/resumes", tags=["Resumes"])

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream" # some browsers use this for docx
}
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5MB

@router.post("/upload", response_model=ResumeResponse)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. IP Registration limit validation (Max 3 accounts per IP per day)
    # Check if this IP created too many users today
    if current_user.ip_address:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        same_ip_users = db.query(User).filter(
            User.ip_address == current_user.ip_address,
            User.created_at >= today_start
        ).count()
        if same_ip_users > 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Registration rate limit exceeded for this network. Please contact support."
            )

    # 2. File validation
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Only {', '.join(ALLOWED_EXTENSIONS)} are accepted."
        )

    # Read bytes to check file size and validate content
    file_bytes = file.file.read()
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too large. Maximum size allowed is 5MB."
        )

    content_type = file.content_type
    # Simple mime check
    if content_type not in ALLOWED_MIME_TYPES and ext == ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF MIME type detected."
        )

    try:
        # 3. Parse resume text
        parsed_json = resume_parser.parse_resume(file_bytes, ext)
        
        # 4. Preprocess resume
        preproc_data = preprocessor_engine.preprocess(parsed_json)
        
        # 5. Security: Encrypt sensitive fields before saving in DB
        # personal_info structure is encrypted
        personal_info = parsed_json.get("personal_info", {})
        encrypted_personal = {
            "name": encryption_service.encrypt(personal_info.get("name", "")),
            "email": encryption_service.encrypt(personal_info.get("email", "")),
            "phone": encryption_service.encrypt(personal_info.get("phone", "")),
            "linkedin": encryption_service.encrypt(personal_info.get("linkedin", "")),
            "portfolio": encryption_service.encrypt(personal_info.get("portfolio", "")),
            "location": encryption_service.encrypt(personal_info.get("location", ""))
        }
        parsed_json["personal_info"] = encrypted_personal
        
        # 6. Upload file to private storage
        storage_path = f"users/{current_user.id}/{uuid.uuid4()}{ext}"
        actual_path = storage_service.upload_file(file_bytes, storage_path, content_type)

        # 7. Save to DB
        expires_at = datetime.utcnow() + timedelta(days=30)
        resume = Resume(
            user_id=current_user.id,
            storage_path=actual_path,
            file_name=filename,
            file_size=file_size,
            file_type=content_type,
            parsed_json=parsed_json,
            preprocessed_json=preproc_data,
            is_encrypted=True,
            expires_at=expires_at
        )
        db.add(resume)
        
        # Add Audit Log
        audit = AuditLog(
            user_id=current_user.id,
            action="UPLOAD_RESUME",
            ip_address=current_user.ip_address,
            details={"file_name": filename, "file_size": file_size}
        )
        db.add(audit)
        
        db.commit()
        db.refresh(resume)
        
        # Decrypt fields for response payload
        response_json = dict(parsed_json)
        response_json["personal_info"] = personal_info # Return decrypted to user
        
        # Build response schema
        res_schema = ResumeResponse(
            id=resume.id,
            user_id=resume.user_id,
            file_name=resume.file_name,
            file_size=resume.file_size,
            file_type=resume.file_type,
            created_at=resume.created_at,
            expires_at=resume.expires_at,
            preprocessed_json=resume.preprocessed_json
        )
        return res_schema

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during resume processing: {str(e)}"
        )

@router.delete("/delete/{resume_id}", response_model=UserDeletionStatus)
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Secure deletion of resume from both DB and private storage"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied."
        )
        
    try:
        # Delete from storage
        storage_service.delete_file(resume.storage_path)
        
        # Delete from DB
        db.delete(resume)
        
        # Add Audit Log
        audit = AuditLog(
            user_id=current_user.id,
            action="DELETE_RESUME",
            ip_address=current_user.ip_address,
            details={"resume_id": resume_id}
        )
        db.add(audit)
        
        db.commit()
        return UserDeletionStatus(success=True, message="Resume deleted successfully.")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete resume: {str(e)}"
        )

@router.get("/local-download/{file_path:path}")
def local_download(file_path: str):
    """Internal API helper to serve binary assets for local development mocks"""
    local_filename = file_path.replace("/", "_")
    full_path = os.path.join(LOCAL_STORAGE_DIR, local_filename)
    if not os.path.exists(full_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in local dev storage."
        )
    return FileResponse(full_path)
