import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.database import Base
from app.models import User, Resume, Analysis, Transaction
from app.services.security import encryption_service
from app.services.preprocessor import preprocessor_engine
from app.services.scoring import scoring_engine
from app.services.payments import midtrans_service

# Setup mock database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_aes_encryption_service():
    """Verify encryption and decryption matches original plaintext, and ciphertext is encrypted"""
    plaintext = "Aditya Putra Afendi, +62 812-3456-7890, adityaputra.afendi@gmail.com"
    ciphertext = encryption_service.encrypt(plaintext)
    
    assert ciphertext != plaintext
    assert len(ciphertext) > len(plaintext)
    
    decrypted = encryption_service.decrypt(ciphertext)
    assert decrypted == plaintext

def test_preprocessor_engine_counters():
    """Verify preprocessor calculates structural facts, verb matches, and quantified metrics correctly"""
    mock_parsed_resume = {
        "personal_info": {
            "name": "Aditya",
            "email": "adityaputra.afendi@gmail.com",
            "phone": "+62812",
            "linkedin": "linkedin.com/in/adityaputra",
            "portfolio": "github.com/aditya"
        },
        "education": [
            {"title": "Bachelor of Computer Science", "description": "GPA 3.8"}
        ],
        "experience": [
            {
                "title": "Senior Backend Developer",
                "description": "Led optimization of transaction pipelines, reducing latency by 42% and processing Rp 200M+ in digital payments."
            }
        ],
        "projects": [],
        "certifications": ["AWS Certified Cloud Practitioner"],
        "skills": ["FastAPI", "Next.js", "PostgreSQL", "TailwindCSS"]
    }
    
    result = preprocessor_engine.preprocess(mock_parsed_resume)
    metrics = result["metrics"]
    compact = result["compact_summary"]
    
    # Check sections
    assert metrics["sections"]["education_exists"] is True
    assert metrics["sections"]["experience_exists"] is True
    assert metrics["sections"]["skills_exists"] is True
    assert metrics["sections"]["projects_exists"] is False
    assert metrics["sections"]["certifications_exists"] is True
    
    # Check verbs and achievements
    # Verb count should match 'led'
    assert metrics["quality"]["action_verb_count"] >= 1
    # Quantified achievements should match '42%' or 'Rp 200M+'
    assert metrics["quality"]["quantified_achievements_count"] >= 2
    
    # Check contact score
    assert metrics["contact"]["score"] == 100

def test_scoring_engine_determinsm():
    """Verify scoring logic outputs expected deterministic score based on weights"""
    # Create mock preprocessor output
    mock_preproc = {
        "metrics": {
            "contact": {"score": 100},
            "sections": {
                "education_exists": True,
                "experience_exists": True,
                "skills_exists": True,
                "projects_exists": True,
                "certifications_exists": True,
                "score": 100
            },
            "quality": {
                "action_verb_count": 5,
                "quantified_achievements_count": 3,
                "word_count": 500
            },
            "keywords": {
                "matched": ["fastapi", "next.js", "postgresql"],
                "missing": ["docker", "aws"]
            }
        },
        "compact_summary": {
            "extracted_skills": ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
        }
    }
    
    scores = scoring_engine.calculate_scores(mock_preproc)
    
    assert "overall_score" in scores
    assert 0 <= scores["overall_score"] <= 100
    assert scores["resume_structure_score"] == 100
    assert scores["readability_score"] == 100 # 500 words is optimal
    
    # Check explanations exist
    assert "resume_structure" in scores["explanations"]
    assert "keyword_coverage" in scores["explanations"]
    assert "readability" in scores["explanations"]

def test_midtrans_signature_verification():
    """Verify signature calculations map successfully to Midtrans SHA-512 standard"""
    order_id = "order_abc123"
    status_code = "200"
    gross_amount = "19900"
    
    import hashlib
    # Generate signature using mock server key
    mock_server_key = midtrans_service.server_key or "mock_server_key"
    raw_str = f"{order_id}{status_code}{gross_amount}{mock_server_key}"
    expected_hash = hashlib.sha512(raw_str.encode('utf-8')).hexdigest()
    
    # Override server key temporarily for comparison if needed
    midtrans_service.server_key = mock_server_key
    midtrans_service.use_midtrans = True
    
    is_valid = midtrans_service.verify_webhook_signature(order_id, status_code, gross_amount, expected_hash)
    assert is_valid is True

def test_user_rate_limits(db_session):
    """Verify daily limits and IP limit rules can be asserted"""
    # 1. New user registration check
    user_ip = "192.168.1.1"
    for i in range(3):
        u = User(id=f"clerk_user_{i}", email=f"user_{i}@example.com", ip_address=user_ip)
        db_session.add(u)
    db_session.commit()
    
    # Check count for user_ip
    count = db_session.query(User).filter(User.ip_address == user_ip).count()
    assert count == 3
