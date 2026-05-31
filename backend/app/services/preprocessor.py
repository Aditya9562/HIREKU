import re
from typing import Dict, Any, List, Optional

# List of typical resume action verbs
ACTION_VERBS = {
    "led", "managed", "optimized", "implemented", "delivered", "built", "engineered",
    "designed", "created", "spearheaded", "accelerated", "boosted", "saved", "increased",
    "reduced", "coordinated", "collaborated", "developed", "executed", "formulated",
    "introduced", "launched", "minimized", "pioneered", "restructured", "upgraded"
}

# Standard resume keywords for match engine
INDUSTRY_KEYWORDS = {
    # Tech & DevOps
    "python", "javascript", "typescript", "react", "next.js", "node.js", "fastapi", "golang",
    "postgresql", "mongodb", "mysql", "redis", "docker", "kubernetes", "aws", "gcp", "azure",
    "agile", "scrum", "git", "ci/cd", "rest api", "graphql", "microservices", "machine learning",
    "data science", "analytics", "sql", "excel", "product management", "ui/ux", "figma",
    "devops", "cloud", "security", "testing", "qa", "django", "flask",
    # HR & Recruiting
    "recruitment", "recruiter", "sourcing", "onboarding", "hris", "payroll", "talent", "acquisition",
    "interpersonal", "compensation", "benefits", "relations",
    # Finance, Accounting & Audit
    "finance", "banking", "auditing", "audit", "accounting", "budgeting", "forecasting", "compliance",
    "taxation", "risk", "ledger",
    # Sales & Marketing
    "sales", "marketing", "seo", "sem", "crm", "branding", "advertising", "social", "campaign",
    # Consulting, Operations & Management
    "strategy", "operations", "stakeholder", "process", "improvement", "kpi", "okr", "project", 
    "program", "management", "business", "supply", "chain", "vendor",
    # General & Soft Skills
    "leadership", "communication", "teamwork", "solving", "negotiation", "collaboration", "planning"
}

class PreprocessingEngine:
    def preprocess(self, parsed_json: Dict[str, Any], job_target: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Perform rule-based checks and generate metrics and a compact summary"""
        
        # 1. Contact Scans
        personal = parsed_json.get("personal_info", {})
        email_exists = bool(personal.get("email"))
        phone_exists = bool(personal.get("phone"))
        linkedin_exists = bool(personal.get("linkedin"))
        portfolio_exists = bool(personal.get("portfolio"))

        # 2. Section Exists Checks
        education_exists = len(parsed_json.get("education", [])) > 0
        experience_exists = len(parsed_json.get("experience", [])) > 0
        projects_exists = len(parsed_json.get("projects", [])) > 0
        certifications_exists = len(parsed_json.get("certifications", [])) > 0
        skills_exists = len(parsed_json.get("skills", [])) > 0

        # Combine all description texts to count metrics & verbs
        full_text_list = []
        for exp in parsed_json.get("experience", []):
            full_text_list.append(exp.get("title", ""))
            full_text_list.append(exp.get("description", ""))
        for proj in parsed_json.get("projects", []):
            full_text_list.append(proj.get("title", ""))
            full_text_list.append(proj.get("description", ""))
        for edu in parsed_json.get("education", []):
            full_text_list.append(edu.get("title", ""))
            full_text_list.append(edu.get("description", ""))
        for cert in parsed_json.get("certifications", []):
            full_text_list.append(str(cert))
        
        skills_text = " ".join(parsed_json.get("skills", []))
        full_text_list.append(skills_text)
        
        full_text = " ".join(full_text_list)
        full_text_lower = full_text.lower()

        # 3. Action Verbs Count
        words = re.findall(r'\b[a-zA-Z]+\b', full_text_lower)
        found_verbs = [w for w in words if w in ACTION_VERBS]
        verb_count = len(found_verbs)
        unique_verbs = set(found_verbs)

        # 4. Quantified Achievements Count
        # Scan for numbers followed by percentage signs, currency, words like %, $, Rp, USD, million, etc.
        # e.g., "15%", "Rp 15.000.000", "$50k", "increase of 20", "saved 10 hours"
        metric_patterns = [
            r'\b\d+(?:[\.,]\d+)?\s*(?:%|percent|\b[xX]\b)',
            r'(?:\$|Rp|¥|€|£|USD|IDR)\s*\d+(?:[\.,]\d+)*(?:\s*[kKmM]|\s*million|\s*billion)?',
            r'\b\d+(?:[\.,]\d+)*\s*(?:\$|Rp|USD|IDR|million|billion|users|customers|clients|leads|hours|days|weeks|months|years|pages|lines)\b',
            r'\b(?:increase|reduc|decrease|sav|grow|boost|cut)(?:e|ed|es|ing|n|t|ting)?\b.*?\b\d+\b'
        ]
        
        metrics_found = []
        for pattern in metric_patterns:
            matches = re.findall(pattern, full_text, re.IGNORECASE)
            metrics_found.extend(matches)
        
        quantified_count = len(metrics_found)

        # 5. Length & Readability Calculations
        word_count = len(words)
        char_count = len(full_text)
        
        # 6. Keyword Matches
        # Extract terms from target job description
        target_keywords = set()
        if job_target:
            jd_text = (job_target.get("job_description") or "") + " " + (job_target.get("target_position") or "")
            jd_text_lower = jd_text.lower()
            jd_words = re.findall(r'\b[a-zA-Z\.\-\#\+]{2,15}\b', jd_text_lower)
            # Find which industry keywords exist in JD
            target_keywords = {w for w in jd_words if w in INDUSTRY_KEYWORDS}
            
        if not target_keywords:
            # Fallback to general industry keywords if no JD is provided
            target_keywords = INDUSTRY_KEYWORDS

        # Check density of matches in the resume
        matched_keywords = []
        missing_keywords = []
        for kw in target_keywords:
            # Match word boundary
            escaped = re.escape(kw)
            if re.search(rf'\b{escaped}\b', full_text_lower):
                matched_keywords.append(kw)
            else:
                missing_keywords.append(kw)
                
        # Limit missing keywords returned
        missing_keywords = missing_keywords[:12]

        # Compile metrics
        metrics = {
            "contact": {
                "email_exists": email_exists,
                "phone_exists": phone_exists,
                "linkedin_exists": linkedin_exists,
                "portfolio_exists": portfolio_exists,
                "score": sum([email_exists, phone_exists, linkedin_exists, portfolio_exists]) * 25
            },
            "sections": {
                "education_exists": education_exists,
                "experience_exists": experience_exists,
                "projects_exists": projects_exists,
                "certifications_exists": certifications_exists,
                "skills_exists": skills_exists,
                "score": sum([education_exists, experience_exists, projects_exists, certifications_exists, skills_exists]) * 20
            },
            "quality": {
                "action_verb_count": verb_count,
                "unique_action_verbs": list(unique_verbs),
                "quantified_achievements_count": quantified_count,
                "quantified_examples": metrics_found[:5],
                "word_count": word_count,
                "char_count": char_count
            },
            "keywords": {
                "matched_count": len(matched_keywords),
                "missing_count": len(missing_keywords),
                "matched": matched_keywords[:10],
                "missing": missing_keywords
            }
        }

        # Create Compact JSON summary to minimize AI tokens
        compact_summary = {
            "personal": {
                "has_email": email_exists,
                "has_phone": phone_exists,
                "has_linkedin": linkedin_exists,
                "has_portfolio": portfolio_exists
            },
            "structure": {
                "has_education": education_exists,
                "has_experience": experience_exists,
                "has_projects": projects_exists,
                "has_certifications": certifications_exists,
                "has_skills": skills_exists
            },
            "stats": {
                "word_count": word_count,
                "verb_count": verb_count,
                "quantified_achievements": quantified_count
            },
            "extracted_skills": parsed_json.get("skills", [])[:20],
            "education_summary": [edu.get("title", "") for edu in parsed_json.get("education", [])],
            "experience_summary": [exp.get("title", "") for exp in parsed_json.get("experience", [])],
            "keywords": {
                "matched": matched_keywords[:8],
                "missing": missing_keywords[:8]
            }
        }

        return {
            "metrics": metrics,
            "compact_summary": compact_summary
        }

preprocessor_engine = PreprocessingEngine()
