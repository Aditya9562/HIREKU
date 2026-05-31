import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Numeric, Text, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(255), primary_key=True) # Clerk ID
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_admin = Column(Boolean, default=False)
    ip_address = Column(String(45), nullable=True)
    
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    premium_reports = relationship("PremiumReport", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    storage_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    parsed_json = Column(JSON, nullable=True)
    preprocessed_json = Column(JSON, nullable=True)
    is_encrypted = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    user = relationship("User", back_populates="resumes")
    job_targets = relationship("JobTarget", back_populates="resume", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="resume", cascade="all, delete-orphan")
    premium_reports = relationship("PremiumReport", back_populates="resume", cascade="all, delete-orphan")

class JobTarget(Base):
    __tablename__ = "job_targets"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    target_position = Column(String(255), nullable=True)
    target_company = Column(String(255), nullable=True)
    job_description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    resume = relationship("Resume", back_populates="job_targets")
    analyses = relationship("Analysis", back_populates="job_target")

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_target_id = Column(String(36), ForeignKey("job_targets.id", ondelete="CASCADE"), nullable=False)
    model_used = Column(String(50), default="gemini-2.5-flash")
    overall_score = Column(Integer, nullable=False)
    resume_structure_score = Column(Integer, nullable=False)
    keyword_coverage_score = Column(Integer, nullable=False)
    experience_quality_score = Column(Integer, nullable=False)
    achievement_strength_score = Column(Integer, nullable=False)
    skills_relevance_score = Column(Integer, nullable=False)
    readability_score = Column(Integer, nullable=False)
    scoring_explanations = Column(JSON, nullable=False)
    top_strengths = Column(JSON, nullable=False)
    top_weaknesses = Column(JSON, nullable=False)
    missing_keywords = Column(JSON, nullable=False)
    recruiter_impression = Column(Text, nullable=False)
    job_match_score = Column(Integer, nullable=True)
    missing_skills = Column(JSON, nullable=True)
    recommended_improvements = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    resume = relationship("Resume", back_populates="analyses")
    job_target = relationship("JobTarget", back_populates="analyses")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(255), unique=True, nullable=False)
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(12, 2), default=19900.00, nullable=False)
    status = Column(String(50), default="pending") # pending, settlement, expire, deny, cancel
    payment_type = Column(String(50), nullable=True)
    transaction_id = Column(String(255), nullable=True)
    snap_token = Column(String(255), nullable=True)
    raw_response = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="transactions")
    premium_reports = relationship("PremiumReport", back_populates="transaction", cascade="all, delete-orphan")

class PremiumReport(Base):
    __tablename__ = "premium_reports"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    transaction_id = Column(String(36), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    model_used = Column(String(50), default="claude-3-5-sonnet")
    deep_review = Column(Text, nullable=False)
    recruiter_perspective = Column(Text, nullable=False)
    company_optimization = Column(Text, nullable=False)
    rewritten_resume_json = Column(JSON, nullable=False)
    cover_letter = Column(Text, nullable=False)
    interview_questions = Column(JSON, nullable=False)
    optimized_resume_path = Column(String(512), nullable=True)
    cover_letter_path = Column(String(512), nullable=True)
    # New fields: HR-expert prompt output
    final_cv_text = Column(Text, nullable=True)
    keyword_analysis = Column(Text, nullable=True)
    ats_match_percentage = Column(Integer, nullable=True)
    missing_keywords_list = Column(JSON, nullable=True)
    improvement_suggestions = Column(JSON, nullable=True)
    learning_suggestions = Column(JSON, nullable=True)   # [{skill, reason, resource}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="premium_reports")
    resume = relationship("Resume", back_populates="premium_reports")
    transaction = relationship("Transaction", back_populates="premium_reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
