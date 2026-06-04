from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    id: str
    email: str
    is_admin: bool

class UserCreate(BaseModel):
    id: str
    email: str
    ip_address: Optional[str] = None

class UserProfile(UserBase):
    created_at: datetime
    ip_address: Optional[str]

    class Config:
        from_attributes = True

# Job Target Schemas
class JobTargetCreate(BaseModel):
    target_position: Optional[str] = None
    target_company: Optional[str] = None
    job_description: Optional[str] = None

class JobTargetResponse(BaseModel):
    id: str
    target_position: Optional[str]
    target_company: Optional[str]
    job_description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Resume Schemas
class ResumeResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_size: int
    file_type: str
    created_at: datetime
    expires_at: datetime
    preprocessed_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Analysis Report Schemas
class AnalysisResponse(BaseModel):
    id: str
    resume_id: str
    job_target_id: str
    model_used: str
    overall_score: int
    resume_structure_score: int
    keyword_coverage_score: int
    experience_quality_score: int
    achievement_strength_score: int
    skills_relevance_score: int
    readability_score: int
    scoring_explanations: Dict[str, str]
    top_strengths: List[str]
    top_weaknesses: List[str]
    missing_keywords: List[str]
    recruiter_impression: str
    job_match_score: Optional[int] = None
    missing_skills: Optional[List[str]] = None
    recommended_improvements: Optional[List[str]] = None
    is_premium: Optional[bool] = False
    created_at: datetime

    class Config:
        from_attributes = True

# Midtrans checkout Schemas
class CheckoutRequest(BaseModel):
    resume_id: str

class CheckoutResponse(BaseModel):
    order_id: str
    amount: float
    snap_token: str
    redirect_url: str

class WebhookResponse(BaseModel):
    status: str
    message: str

# Premium Report Schemas
class PremiumResponse(BaseModel):
    id: str
    resume_id: str
    model_used: str
    deep_review: str
    recruiter_perspective: str
    company_optimization: str
    rewritten_resume_json: Dict[str, Any]
    cover_letter: str
    interview_questions: List[Dict[str, Any]]
    optimized_resume_url: Optional[str] = None
    cover_letter_url: Optional[str] = None
    # New HR-expert prompt output fields
    final_cv_text: Optional[str] = None
    keyword_analysis: Optional[str] = None
    ats_match_percentage: Optional[int] = None
    missing_keywords_list: Optional[List[str]] = None
    improvement_suggestions: Optional[List[str]] = None
    learning_suggestions: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Admin Metrics Schemas
class ActiveUserDetail(BaseModel):
    id: str
    email: str
    created_at: datetime
    is_admin: bool
    premium_count: int

class AdminMetrics(BaseModel):
    total_users: int
    total_uploads: int
    total_analyses: int
    premium_conversion_rate: float
    total_revenue: float
    most_targeted_companies: List[Dict[str, Any]]
    most_targeted_positions: List[Dict[str, Any]]
    most_common_missing_skills: List[Dict[str, Any]]
    daily_active_users: List[Dict[str, Any]]
    users_list: List[ActiveUserDetail]

# Privacy schemas
class UserDeletionStatus(BaseModel):
    success: bool
    message: str
