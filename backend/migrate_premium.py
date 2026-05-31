from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("PRAGMA table_info(premium_reports)"))
    existing = [row[1] for row in result]
    print("Existing columns:", existing)
    
    new_cols = {
        "final_cv_text": "TEXT",
        "keyword_analysis": "TEXT",
        "ats_match_percentage": "INTEGER",
        "missing_keywords_list": "JSON",
        "improvement_suggestions": "JSON",
        "learning_suggestions": "JSON",
    }
    
    for col, dtype in new_cols.items():
        if col not in existing:
            conn.execute(text(f"ALTER TABLE premium_reports ADD COLUMN {col} {dtype}"))
            print(f"Added column: {col}")
        else:
            print(f"Already exists: {col}")
    
    conn.commit()
    print("Migration complete.")
