from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from datetime import datetime, timedelta
from typing import Dict, Any, List

from app.database import get_db
from app.auth import get_current_admin, get_current_super_admin
from app.models import User, Resume, Analysis, Transaction, JobTarget, PremiumReport
from app.schemas import AdminMetrics, ActiveUserDetail

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/metrics", response_model=AdminMetrics)
def get_admin_metrics(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Retrieve comprehensive SaaS metrics and logs for the admin dashboard"""
    
    # 1. Basic counts
    total_users = db.query(User).count()
    total_uploads = db.query(Resume).count()
    total_analyses = db.query(Analysis).count()

    # 2. Revenue calculation
    # Sum settled transactions
    revenue_query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "settlement"
    ).scalar()
    total_revenue = float(revenue_query) if revenue_query else 0.0

    # 3. Premium Conversion Rate
    # Unique users who have paid / total users * 100
    paying_users = db.query(Transaction.user_id).filter(
        Transaction.status == "settlement"
    ).distinct().count()
    
    premium_conversion_rate = 0.0
    if total_users > 0:
        premium_conversion_rate = round((paying_users / total_users) * 100, 2)

    # 4. Most Targeted Companies
    company_stats = db.query(
        JobTarget.target_company,
        func.count(JobTarget.id).label("count")
    ).filter(JobTarget.target_company != "").group_by(
        JobTarget.target_company
    ).order_by(desc("count")).limit(5).all()
    
    most_targeted_companies = [
        {"name": row[0], "value": row[1]} for row in company_stats
    ]

    # 5. Most Targeted Positions
    position_stats = db.query(
        JobTarget.target_position,
        func.count(JobTarget.id).label("count")
    ).filter(JobTarget.target_position != "").group_by(
        JobTarget.target_position
    ).order_by(desc("count")).limit(5).all()
    
    most_targeted_positions = [
        {"name": row[0], "value": row[1]} for row in position_stats
    ]

    # 6. Common Missing Skills (aggregated from JSON list in analyses table)
    # We load analyses and count occurrences in python to ensure cross-database compatibility
    analyses = db.query(Analysis.missing_skills).filter(Analysis.missing_skills != None).all()
    skills_counts = {}
    for a in analyses:
        skills = a[0]
        if isinstance(skills, list):
            for s in skills:
                skills_counts[s] = skills_counts.get(s, 0) + 1
                
    sorted_skills = sorted(skills_counts.items(), key=lambda x: x[1], reverse=True)[:6]
    most_common_missing_skills = [
        {"name": skill, "value": count} for skill, count in sorted_skills
    ]

    # 7. Daily Active Users (DAU) over past 7 days
    # (Based on active uploads or analyses per day)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # Cast date grouping
    # Since sqlite and postgres treat date cast differently, we do standard date casting
    # We query the analyses created_at field
    is_sqlite = db.bind.dialect.name == "sqlite"
    if is_sqlite:
        day_expr = func.strftime('%Y-%m-%d', Analysis.created_at)
    else:
        day_expr = cast(Analysis.created_at, Date)

    dau_stats = db.query(
        day_expr.label("day"),
        func.count(func.distinct(Resume.user_id)).label("users_count")
    ).join(Resume).filter(
        Analysis.created_at >= seven_days_ago
    ).group_by(
        day_expr
    ).order_by(day_expr).all()

    daily_active_users = []
    # Fill gaps for days with 0 activities
    date_map = {}
    for row in dau_stats:
        if row[0]:
            day_str = row[0] if isinstance(row[0], str) else row[0].strftime("%Y-%m-%d")
            date_map[day_str] = row[1]
    for i in range(7):
        d = (datetime.utcnow() - timedelta(days=i)).date()
        d_str = d.strftime("%Y-%m-%d")
        daily_active_users.append({
            "date": d_str,
            "users": date_map.get(d_str, 0)
        })
    daily_active_users.reverse()

    # 8. User list
    all_users = db.query(User).order_by(User.created_at.desc()).limit(50).all()
    users_list = []
    for u in all_users:
        p_count = db.query(PremiumReport).filter(PremiumReport.user_id == u.id).count()
        users_list.append(
            ActiveUserDetail(
                id=u.id,
                email=u.email,
                created_at=u.created_at,
                is_admin=u.is_admin,
                premium_count=p_count
            )
        )

    return AdminMetrics(
        total_users=total_users,
        total_uploads=total_uploads,
        total_analyses=total_analyses,
        premium_conversion_rate=premium_conversion_rate,
        total_revenue=total_revenue,
        most_targeted_companies=most_targeted_companies,
        most_targeted_positions=most_targeted_positions,
        most_common_missing_skills=most_common_missing_skills,
        daily_active_users=daily_active_users,
        users_list=users_list
    )

# ─── Administrative Action Endpoints ──────────────────────────────────────────

@router.post("/users/{user_id}/promote")
def promote_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    is_super = user.email.lower() == "adityaputra.afendi@gmail.com"
    if is_super:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify a Super Admin account")
        
    user.is_admin = True
    db.commit()
    return {"message": f"User {user.email} promoted to Admin successfully"}

@router.post("/users/{user_id}/demote")
def demote_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    is_super = user.email.lower() == "adityaputra.afendi@gmail.com"
    if is_super:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify a Super Admin account")
        
    user.is_admin = False
    db.commit()
    return {"message": f"Admin {user.email} demoted to regular user successfully"}

@router.post("/users/{user_id}/reset-limit")
def reset_user_limit(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    day_ago = datetime.utcnow() - timedelta(days=1)
    recent_analyses = db.query(Analysis).join(Resume).filter(
        Resume.user_id == user_id,
        Analysis.created_at >= day_ago
    ).all()
    
    for analysis in recent_analyses:
        analysis.created_at = analysis.created_at - timedelta(days=1, minutes=1)
        
    db.commit()
    return {"message": f"Daily limit for user {user.email} reset successfully"}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    target_is_super = user.email.lower() == "adityaputra.afendi@gmail.com"
    current_is_super = current_admin.email.lower() == "adityaputra.afendi@gmail.com"
    
    if target_is_super:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete a Super Admin account")
        
    if user.is_admin and not current_is_super:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Super Admins can delete Admin accounts")
        
    # Get all resumes for user to clean up local storage files first
    resumes = db.query(Resume).filter(Resume.user_id == user_id).all()
    from app.services.storage import storage_service
    for r in resumes:
        try:
            storage_service.delete_file(r.storage_path)
        except Exception:
            pass
            
    db.delete(user)
    db.commit()
    return {"message": f"User {user.email} deleted successfully"}

