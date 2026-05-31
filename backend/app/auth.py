import httpx
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User
import logging

logger = logging.getLogger(__name__)
security_bearer = HTTPBearer(auto_error=False)

# In-memory cache for JWKS
_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    try:
        # Clerk publish JWKS publicly or via API
        # We try to fetch the JWKS using Clerk Secret Key
        headers = {}
        if settings.CLERK_SECRET_KEY:
            headers["Authorization"] = f"Bearer {settings.CLERK_SECRET_KEY}"
        
        # If we have secret key, we can fetch from Clerk endpoint
        # For sandbox, Clerk JWKS can also be retrieved from the issuer URL
        # For simplicity and offline development fallback, we use clerk API if available
        r = httpx.get("https://api.clerk.com/v1/jwks", headers=headers, timeout=5.0)
        if r.status_code == 200:
            _jwks_cache = r.json()
            return _jwks_cache
    except Exception as e:
        logger.warning(f"Failed to fetch Clerk JWKS: {e}")
    return None

def fetch_user_from_clerk(user_id: str) -> Optional[dict]:
    """Fetch user details directly from Clerk API using Secret Key"""
    if not settings.CLERK_SECRET_KEY:
        return None
    try:
        headers = {"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"}
        r = httpx.get(f"{settings.CLERK_API_URL}/users/{user_id}", headers=headers, timeout=5.0)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        logger.error(f"Error fetching user from Clerk: {e}")
    return None

def verify_token(token: str) -> Optional[dict]:
    """Decode and verify Clerk JWT token"""
    # For local testing and debug convenience
    if settings.DEBUG:
        if token == "mock-admin-token":
            return {"sub": "clerk_admin_123", "email": "adityaputra.afendi@gmail.com"}
        if token == "mock-user-token":
            return {"sub": "clerk_user_123", "email": "testuser@gmail.com"}
            
    jwks = get_jwks()
    if not jwks:
        # Fallback decode without signature verification if JWKS is unreachable in local dev mode
        if settings.DEBUG:
            try:
                return jwt.get_unverified_claims(token)
            except Exception:
                return None
        return None
        
    try:
        # Verify and decode JWT token
        # Clerk JWTs are signed with RS256
        # Learn keys from JWKS
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False} # Set to false to allow Clerk dynamic client aud
        )
        return payload
    except Exception as e:
        logger.error(f"JWT Verification failed: {e}")
        # Final fallback for offline local testing
        if settings.DEBUG:
            try:
                return jwt.get_unverified_claims(token)
            except Exception:
                return None
        return None

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to retrieve and sync the current authenticated user from Clerk"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization credentials"
        )
        
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )
        
    clerk_id = payload.get("sub")
    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject parameter missing"
        )
        
    # Check if user exists in database
    user = db.query(User).filter(User.id == clerk_id).first()
    
    if not user:
        # lazy creation of user in PostgreSQL. Fetch email from token or from Clerk API.
        email = payload.get("email")
        
        if not email:
            # Check other common Clerk email fields in token claims
            email = payload.get("primary_email_address")
            
        if not email:
            # Fallback: Query Clerk API directly
            clerk_user = fetch_user_from_clerk(clerk_id)
            if clerk_user:
                email_addresses = clerk_user.get("email_addresses", [])
                if email_addresses:
                    email = email_addresses[0].get("email_address")
                    
        # Final fallback for testing
        if not email:
            email = f"clerk_{clerk_id}@placeholder.com"
            
        email_clean = email.lower()
        
        # Check if user already exists by email (to handle legacy/mock entries)
        existing_user = db.query(User).filter(User.email == email_clean).first()
        if existing_user:
            # Update the ID to the new Clerk ID
            db.query(User).filter(User.email == email_clean).update({User.id: clerk_id})
            db.commit()
            user = db.query(User).filter(User.id == clerk_id).first()
        else:
            # Check if this email is the target admin email
            is_admin = False
            if email_clean in ["adityaputra.afendi@gmail.com", "adityaafendi02@gmail.com", "adityaafendi22@gmail.com"]:
                is_admin = True
                
            user = User(
                id=clerk_id,
                email=email_clean,
                is_admin=is_admin
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    else:
        # Check if email matches target admin email and is not yet admin
        if user.email.lower() in ["adityaputra.afendi@gmail.com", "adityaafendi02@gmail.com", "adityaafendi22@gmail.com"] and not user.is_admin:
            user.is_admin = True
            db.commit()
            db.refresh(user)
            
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to retrieve and verify administrative permissions"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource"
        )
    return current_user
