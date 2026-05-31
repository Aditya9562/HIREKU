from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Resume, Transaction, PremiumReport, AuditLog
from app.schemas import PremiumResponse
from app.services.ai import ai_service
from app.services.pdf import pdf_service
from app.services.storage import storage_service
from app.services.security import encryption_service

router = APIRouter(prefix="/premium", tags=["Premium Analysis"])

@router.post("/generate/{resume_id}", response_model=PremiumResponse)
def generate_premium_report(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Claude Sonnet premium report, rewrites, cover letter, and PDFs (only after payment settled)"""
    
    # 1. Verify Payment status: must have a settled transaction for this resume
    transaction = db.query(Transaction).filter(
        Transaction.resume_id == resume_id,
        Transaction.user_id == current_user.id,
        Transaction.status == "settlement"
    ).first()
    
    if not transaction:
        # Check if admin is bypassing payment for testing
        if current_user.is_admin:
            # Pick any mock transaction or create one
            transaction = db.query(Transaction).filter(Transaction.resume_id == resume_id).first()
            if not transaction:
                # Create a placeholder transaction to satisfy foreign key constraints
                transaction = Transaction(
                    order_id=f"admin_bypass_{resume_id[:8]}",
                    user_id=current_user.id,
                    resume_id=resume_id,
                    amount=19900.00,
                    status="settlement"
                )
                db.add(transaction)
                db.flush()
        else:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Payment required. Please complete checkout to unlock premium features."
            )

    # 2. Check if Premium Report already exists
    report = db.query(PremiumReport).filter(
        PremiumReport.resume_id == resume_id
    ).first()
    
    if report:
        # Report already generated. Return with fresh signed URLs.
        res = PremiumResponse(
            id=report.id,
            resume_id=report.resume_id,
            model_used=report.model_used,
            deep_review=report.deep_review,
            recruiter_perspective=report.recruiter_perspective,
            company_optimization=report.company_optimization,
            rewritten_resume_json=report.rewritten_resume_json,
            cover_letter=report.cover_letter,
            interview_questions=report.interview_questions,
            optimized_resume_url=storage_service.get_signed_url(report.optimized_resume_path),
            cover_letter_url=storage_service.get_signed_url(report.cover_letter_path),
            final_cv_text=report.final_cv_text,
            keyword_analysis=report.keyword_analysis,
            ats_match_percentage=report.ats_match_percentage,
            missing_keywords_list=report.missing_keywords_list,
            improvement_suggestions=report.improvement_suggestions,
            learning_suggestions=report.learning_suggestions,
            created_at=report.created_at
        )
        return res

    # 3. Retrieve Resume
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
        # Decrypt raw contact details for sending to Claude
        decrypted_personal = {}
        if resume.parsed_json and "personal_info" in resume.parsed_json:
            encrypted_p = resume.parsed_json["personal_info"]
            decrypted_personal = {
                "name": encryption_service.decrypt(encrypted_p.get("name", "")),
                "email": encryption_service.decrypt(encrypted_p.get("email", "")),
                "phone": encryption_service.decrypt(encrypted_p.get("phone", "")),
                "linkedin": encryption_service.decrypt(encrypted_p.get("linkedin", "")),
                "portfolio": encryption_service.decrypt(encrypted_p.get("portfolio", "")),
                "location": encryption_service.decrypt(encrypted_p.get("location", ""))
            }
            
        decrypted_resume = dict(resume.parsed_json)
        decrypted_resume["personal_info"] = decrypted_personal

        # Extract raw CV text (stored from original upload, not Gemini-processed)
        # This is the plain text that was directly extracted from the user's PDF/DOCX
        raw_cv_text = decrypted_resume.pop("raw_text", None)

        # Retrieve job target details if available
        job_target = resume.job_targets[0] if resume.job_targets else None
        target_dict = None
        if job_target:
            target_dict = {
                "target_position": job_target.target_position,
                "target_company": job_target.target_company,
                "job_description": job_target.job_description
            }

        # 4. Invoke Claude with raw CV text + expert HR prompt
        claude_report = ai_service.generate_premium_report(
            decrypted_resume, 
            target_dict,
            raw_cv_text=raw_cv_text
        )

        # 5. Compile Optimized Resume PDF & Cover Letter PDF via ReportLab
        rewritten_json = claude_report.get("rewritten_resume_json", decrypted_resume)
        cover_letter_text = claude_report.get("cover_letter", "Dear Hiring Manager...")
        
        resume_pdf_bytes = pdf_service.generate_optimized_resume(rewritten_json)
        letter_pdf_bytes = pdf_service.generate_cover_letter(cover_letter_text, rewritten_json.get("personal_info", decrypted_personal))

        # 6. Upload PDFs to secure storage
        resume_pdf_path = f"users/{current_user.id}/optimized_{resume.id}.pdf"
        letter_pdf_path = f"users/{current_user.id}/cover_letter_{resume.id}.pdf"
        
        stored_resume_path = storage_service.upload_file(resume_pdf_bytes, resume_pdf_path, "application/pdf")
        stored_letter_path = storage_service.upload_file(letter_pdf_bytes, letter_pdf_path, "application/pdf")

        # 7. Save Premium Report in DB (including new HR-expert output fields)
        report = PremiumReport(
            user_id=current_user.id,
            resume_id=resume.id,
            transaction_id=transaction.id,
            model_used="claude-sonnet-4",
            deep_review=claude_report.get("deep_review", "Strategic review compiled."),
            recruiter_perspective=claude_report.get("recruiter_perspective", "Recruiter impressions generated."),
            company_optimization=claude_report.get("company_optimization", "Company-specific recommendations compiled."),
            rewritten_resume_json=rewritten_json,
            cover_letter=cover_letter_text,
            interview_questions=claude_report.get("interview_questions", []),
            optimized_resume_path=stored_resume_path,
            cover_letter_path=stored_letter_path,
            # New HR-expert fields
            final_cv_text=claude_report.get("final_cv_text"),
            keyword_analysis=claude_report.get("keyword_analysis"),
            ats_match_percentage=claude_report.get("ats_match_percentage"),
            missing_keywords_list=claude_report.get("missing_keywords_list"),
            improvement_suggestions=claude_report.get("improvement_suggestions"),
            learning_suggestions=claude_report.get("learning_suggestions"),
        )
        db.add(report)
        
        # Audit Log
        audit = AuditLog(
            user_id=current_user.id,
            action="GENERATE_PREMIUM_REPORT",
            ip_address=current_user.ip_address,
            details={"resume_id": resume_id}
        )
        db.add(audit)
        
        db.commit()
        db.refresh(report)

        return PremiumResponse(
            id=report.id,
            resume_id=report.resume_id,
            model_used=report.model_used,
            deep_review=report.deep_review,
            recruiter_perspective=report.recruiter_perspective,
            company_optimization=report.company_optimization,
            rewritten_resume_json=report.rewritten_resume_json,
            cover_letter=report.cover_letter,
            interview_questions=report.interview_questions,
            optimized_resume_url=storage_service.get_signed_url(report.optimized_resume_path),
            cover_letter_url=storage_service.get_signed_url(report.cover_letter_path),
            final_cv_text=report.final_cv_text,
            keyword_analysis=report.keyword_analysis,
            ats_match_percentage=report.ats_match_percentage,
            missing_keywords_list=report.missing_keywords_list,
            improvement_suggestions=report.improvement_suggestions,
            learning_suggestions=report.learning_suggestions,
            created_at=report.created_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while generating premium report: {str(e)}"
        )

@router.get("/report/{resume_id}", response_model=PremiumResponse)
def get_premium_report(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve already generated premium details and refresh signed URLs"""
    report = db.query(PremiumReport).filter(
        PremiumReport.resume_id == resume_id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Premium report not found for this resume. Ensure you have completed the checkout and generated it."
        )
        
    # Check authorization
    if report.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this premium report."
        )
        
    return PremiumResponse(
        id=report.id,
        resume_id=report.resume_id,
        model_used=report.model_used,
        deep_review=report.deep_review,
        recruiter_perspective=report.recruiter_perspective,
        company_optimization=report.company_optimization,
        rewritten_resume_json=report.rewritten_resume_json,
        cover_letter=report.cover_letter,
        interview_questions=report.interview_questions,
        optimized_resume_url=storage_service.get_signed_url(report.optimized_resume_path),
        cover_letter_url=storage_service.get_signed_url(report.cover_letter_path),
        final_cv_text=report.final_cv_text,
        keyword_analysis=report.keyword_analysis,
        ats_match_percentage=report.ats_match_percentage,
        missing_keywords_list=report.missing_keywords_list,
        improvement_suggestions=report.improvement_suggestions,
        learning_suggestions=report.learning_suggestions,
        created_at=report.created_at
    )
