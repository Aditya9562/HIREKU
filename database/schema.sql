-- Enums
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'settlement', 'expire', 'deny', 'cancel');
CREATE TYPE resume_status_enum AS ENUM ('raw', 'processed', 'failed');

-- Users Table (Synced from Clerk via webhooks or lazy creation)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- Clerk User ID
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45) -- For rate limiting / registration limit checks
);

-- Resumes Table (Encrypted fields stored securely)
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    storage_path VARCHAR(512) NOT NULL, -- Supabase Storage key (private)
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    parsed_json JSONB,                 -- Raw structured schema parsed from PDF/Docx
    preprocessed_json JSONB,           -- Structured metrics and summary
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Job Targets Table
CREATE TABLE job_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    target_position VARCHAR(255),
    target_company VARCHAR(255),
    job_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analyses Table (Free Report - Gemini Flash)
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    job_target_id UUID REFERENCES job_targets(id) ON DELETE CASCADE,
    model_used VARCHAR(50) DEFAULT 'gemini-2.5-flash',
    overall_score INT NOT NULL,
    resume_structure_score INT NOT NULL,
    keyword_coverage_score INT NOT NULL,
    experience_quality_score INT NOT NULL,
    achievement_strength_score INT NOT NULL,
    skills_relevance_score INT NOT NULL,
    readability_score INT NOT NULL,
    scoring_explanations JSONB NOT NULL,
    top_strengths JSONB NOT NULL,    -- Array of strings
    top_weaknesses JSONB NOT NULL,   -- Array of strings
    missing_keywords JSONB NOT NULL, -- Array of strings
    recruiter_impression TEXT NOT NULL,
    job_match_score INT,
    missing_skills JSONB,
    recommended_improvements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table (Midtrans integration)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(255) UNIQUE NOT NULL, -- Midtrans order ID format: order_uuid
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 19900.00,
    status transaction_status_enum DEFAULT 'pending',
    payment_type VARCHAR(50),
    transaction_id VARCHAR(255), -- Midtrans native ID
    snap_token VARCHAR(255),
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Premium Reports Table (Claude Sonnet)
CREATE TABLE premium_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    model_used VARCHAR(50) DEFAULT 'claude-3-5-sonnet',
    deep_review TEXT NOT NULL,
    recruiter_perspective TEXT NOT NULL,
    company_optimization TEXT NOT NULL,
    rewritten_resume_json JSONB NOT NULL, -- Structured rewrite info
    cover_letter TEXT NOT NULL,
    interview_questions JSONB NOT NULL,   -- Array of {question, model_answer, tip}
    optimized_resume_path VARCHAR(512),   -- Private Supabase Storage PDF path
    cover_letter_path VARCHAR(512),       -- Private Supabase Storage PDF path
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
