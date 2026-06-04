from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Resume, JobTarget, Analysis, AuditLog, PremiumReport
from app.schemas import AnalysisResponse, JobTargetCreate
from app.services.scoring import scoring_engine
from app.services.preprocessor import preprocessor_engine
from app.services.ai import ai_service
from app.services.security import encryption_service

router = APIRouter(prefix="/analyses", tags=["Analyses"])

@router.post("/analyze/{resume_id}", response_model=AnalysisResponse)
def analyze_resume(
    resume_id: str,
    target_data: JobTargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a free resume analysis using deterministic scoring and Gemini Flash"""
    
    # 1. Enforce Daily Limit: 1 free analysis per account per day
    # Check if there is an analysis created in the last 24 hours
    day_ago = datetime.utcnow() - timedelta(days=1)
    recent_analysis = db.query(Analysis).join(Resume).filter(
        Resume.user_id == current_user.id,
        Analysis.created_at >= day_ago
    ).first()
    
    # Allow admins to bypass limit for testing
    if recent_analysis and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily limit reached. You can only perform 1 resume analysis per day. Please upgrade to Premium."
        )
        
    # 2. Retrieve Resume
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
        # Decrypt personal info for sending to preprocessor / match engine if needed
        # (Though preprocessor relies mostly on overall text)
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

        # 3. Create and Save Job Target (and infer target details if empty)
        pos = target_data.target_position
        comp = target_data.target_company
        jd = target_data.job_description
        
        # We need decrypted parsed data for target inference and keyword density comparisons
        decrypted_parsed = dict(resume.parsed_json)
        decrypted_parsed["personal_info"] = decrypted_personal
        
        is_empty = not pos or pos.strip().lower() in ("", "general professional")
        if is_empty:
            inferred = ai_service.infer_job_target_from_cv(decrypted_parsed)
            pos = inferred.get("target_position", "Software Engineer")
            comp = inferred.get("target_company", "Top Tech Firm")
            jd = inferred.get("job_description", "")
            
        job_target = JobTarget(
            resume_id=resume.id,
            target_position=pos,
            target_company=comp,
            job_description=jd
        )
        db.add(job_target)
        db.flush() # Populate job_target.id

        # 4. Re-run preprocessing with job targets for keyword density calculations
        target_dict = {
            "target_position": pos,
            "target_company": comp,
            "job_description": jd
        }
        
        preproc_data = preprocessor_engine.preprocess(decrypted_parsed, target_dict)
        
        # Update resume preprocessed_json in DB with fresh keyword densities
        resume.preprocessed_json = preproc_data
        db.flush()

        # 5. Deterministic scoring
        scores = scoring_engine.calculate_scores(preproc_data)

        # 6. Request Gemini AI feedback (passing compact preprocessed JSON to save tokens)
        ai_feedback = ai_service.generate_free_report(
            preproc_data["compact_summary"],
            target_dict,
            language=target_data.language
        )

        # Use dynamic scoring explanations from AI if available
        scoring_exps = ai_feedback.get("scoring_explanations")
        if not scoring_exps or not isinstance(scoring_exps, dict):
            scoring_exps = scores["explanations"]

        # 7. Build Analysis database model
        analysis = Analysis(
            resume_id=resume.id,
            job_target_id=job_target.id,
            model_used="gemini-2.5-flash",
            overall_score=scores["overall_score"],
            resume_structure_score=scores["resume_structure_score"],
            keyword_coverage_score=scores["keyword_coverage_score"],
            experience_quality_score=scores["experience_quality_score"],
            achievement_strength_score=scores["achievement_strength_score"],
            skills_relevance_score=scores["skills_relevance_score"],
            readability_score=scores["readability_score"],
            scoring_explanations=scoring_exps,
            
            top_strengths=ai_feedback.get("top_strengths", []),
            top_weaknesses=ai_feedback.get("top_weaknesses", []),
            missing_keywords=ai_feedback.get("missing_keywords", []),
            recruiter_impression=ai_feedback.get("recruiter_impression", "Fair resume foundation."),
            
            job_match_score=ai_feedback.get("job_match_score", scores["keyword_coverage_score"]),
            missing_skills=ai_feedback.get("missing_skills", []),
            recommended_improvements=ai_feedback.get("recommended_improvements", [])
        )
        
        db.add(analysis)
        
        # Audit logging
        audit = AuditLog(
            user_id=current_user.id,
            action="ANALYZE_RESUME",
            ip_address=current_user.ip_address,
            details={"resume_id": resume_id, "score": scores["overall_score"]}
        )
        db.add(audit)
        
        db.commit()
        db.refresh(analysis)
        
        return analysis
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate analysis: {str(e)}"
        )

@router.get("/my-analyses", response_model=List[AnalysisResponse])
def get_user_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve history of all analyses performed by the user"""
    analyses = db.query(Analysis).join(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).all()
    
    # Get all premium reports for this user to check which resumes are upgraded
    premium_resumes = {r.resume_id for r in db.query(PremiumReport).filter(PremiumReport.user_id == current_user.id).all()}
    
    results = []
    for a in analyses:
        a_dict = {c.name: getattr(a, c.name) for c in a.__table__.columns}
        a_dict["is_premium"] = a.resume_id in premium_resumes
        results.append(a_dict)
    return results

@router.get("/report/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_report(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details of a specific analysis report"""
    analysis = db.query(Analysis).join(Resume).filter(
        Analysis.id == analysis_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not analysis:
        # Admins can view any report
        if current_user.is_admin:
            analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
            
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis report not found or access denied."
        )
        
    is_premium = db.query(PremiumReport).filter(PremiumReport.resume_id == analysis.resume_id).first() is not None
    
    # Return dictionary with is_premium set
    a_dict = {c.name: getattr(analysis, c.name) for c in analysis.__table__.columns}
    a_dict["is_premium"] = is_premium
    return a_dict
