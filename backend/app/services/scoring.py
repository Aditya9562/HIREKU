from typing import Dict, Any, List

class ScoringEngine:
    def calculate_scores(self, preprocessed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate weighted, deterministic scores and generate detailed explanations"""
        metrics = preprocessed_data.get("metrics", {})
        
        # 1. Resume Structure Score (20%)
        # Check presence of 5 core sections: Edu, Exp, Proj, Certs, Skills
        sec = metrics.get("sections", {})
        structure_components = [
            sec.get("education_exists", False),
            sec.get("experience_exists", False),
            sec.get("skills_exists", False),
            sec.get("projects_exists", False),
            sec.get("certifications_exists", False)
        ]
        structure_score = int(sum(structure_components) * 20)
        
        # 2. Keyword Coverage Score (20%)
        kw = metrics.get("keywords", {})
        matched_kw_count = len(kw.get("matched", []))
        missing_kw_count = len(kw.get("missing", []))
        total_kws = matched_kw_count + missing_kw_count
        if total_kws > 0:
            keyword_score = int((matched_kw_count / total_kws) * 100)
        else:
            keyword_score = 50 # Default middle score
            
        # 3. Experience Quality Score (20%)
        qual = metrics.get("quality", {})
        verb_count = qual.get("action_verb_count", 0)
        if sec.get("experience_exists", False):
            # 10 points per action verb, up to 100
            experience_score = min(100, 30 + (verb_count * 8))
        else:
            experience_score = 0
            
        # 4. Achievement Strength Score (15%)
        quantified_count = qual.get("quantified_achievements_count", 0)
        if sec.get("experience_exists", False) or sec.get("projects_exists", False):
            # 20 points per quantified metric, up to 100
            achievement_score = min(100, 30 + (quantified_count * 15))
        else:
            achievement_score = 0
            
        # 5. Skills Relevance Score (15%)
        # Evaluated based on the volume and breadth of skills provided
        skills_count = len(preprocessed_data.get("compact_summary", {}).get("extracted_skills", []))
        skills_score = min(100, skills_count * 8)
        
        # 6. Readability Score (10%)
        word_count = qual.get("word_count", 0)
        # Optimal word count for standard 1-page ATS resumes is 400 - 800 words
        if 400 <= word_count <= 800:
            readability_score = 100
        elif 200 <= word_count < 400:
            readability_score = 70
        elif 800 < word_count <= 1200:
            readability_score = 80
        else:
            readability_score = 40 # Too short or too long
            
        # Overall Score Calculation
        overall_score = int(
            (0.20 * structure_score) +
            (0.20 * keyword_score) +
            (0.20 * experience_score) +
            (0.15 * achievement_score) +
            (0.15 * skills_score) +
            (0.10 * readability_score)
        )
        
        # Generate explanations for each score
        explanations = {
            "resume_structure": self._explain_structure(structure_score, sec),
            "keyword_coverage": self._explain_keywords(keyword_score, matched_kw_count, missing_kw_count),
            "experience_quality": self._explain_experience(experience_score, verb_count),
            "achievement_strength": self._explain_achievement(achievement_score, quantified_count),
            "skills_relevance": self._explain_skills(skills_score, skills_count),
            "readability": self._explain_readability(readability_score, word_count)
        }
        
        return {
            "overall_score": overall_score,
            "resume_structure_score": structure_score,
            "keyword_coverage_score": keyword_score,
            "experience_quality_score": experience_score,
            "achievement_strength_score": achievement_score,
            "skills_relevance_score": skills_score,
            "readability_score": readability_score,
            "explanations": explanations
        }
        
    def _explain_structure(self, score: int, sec: Dict[str, bool]) -> str:
        missing = []
        if not sec.get("education_exists"): missing.append("Education")
        if not sec.get("experience_exists"): missing.append("Experience")
        if not sec.get("skills_exists"): missing.append("Skills")
        if not sec.get("projects_exists"): missing.append("Projects")
        if not sec.get("certifications_exists"): missing.append("Certifications")
        
        if score == 100:
            return "Perfect structure! All key resume sections (Education, Experience, Skills, Projects, and Certifications) are present."
        elif score >= 60:
            return f"Good layout, but missing some optional sections: {', '.join(missing)}. Adding them will improve your score."
        else:
            return f"Critical sections are missing: {', '.join(missing)}. ATS checkers and recruiters will immediately filter out resumes lacking these elements."
            
    def _explain_keywords(self, score: int, matched: int, missing: int) -> str:
        if score >= 80:
            return f"Excellent keyword density! You matched {matched} core industry terms, indicating your resume aligns well with target criteria."
        elif score >= 50:
            return f"Moderate match. You matched {matched} keywords but missed {missing}. Adding these missing keywords will significantly boost match scores."
        else:
            return f"Weak keyword match. Missing {missing} critical skills/terms. The system will likely reject this resume due to lack of keyword relevance."
            
    def _explain_experience(self, score: int, verb_count: int) -> str:
        if score >= 80:
            return f"Strong experience description. You used {verb_count} dynamic action verbs (e.g. led, optimized, designed) showing active contribution."
        elif score >= 50:
            return f"Fair description. Used {verb_count} action verbs. Try replacing passive phrases like 'responsible for' with stronger action verbs."
        else:
            return "Missing or weak experience description. Make sure to define roles clearly and begin bullet points with strong action verbs."
            
    def _explain_achievement(self, score: int, quantified_count: int) -> str:
        if score >= 80:
            return f"Great results-driven formatting! You included {quantified_count} quantified achievements (using metrics or percentages) demonstrating your impact."
        elif score >= 50:
            return f"Some results shown. Found {quantified_count} metrics. Add numerical facts (e.g., revenue increase, time saved) to make your resume impactful."
        else:
            return "No quantified achievements found. Recruiters prefer seeing measurable impact rather than just a list of daily responsibilities."
            
    def _explain_skills(self, score: int, skills_count: int) -> str:
        if score >= 80:
            return f"Strong skills display. You listed {skills_count} skills, showing a comprehensive and varied technical or professional skillset."
        elif score >= 50:
            return f"Listed {skills_count} skills. Consider categorizing and expanding your skills section to cover more tools and sub-skills."
        else:
            return f"Only {skills_count} skills found. Your skills profile is too sparse. Add more industry-specific technical and soft skills."
            
    def _explain_readability(self, score: int, word_count: int) -> str:
        if score == 100:
            return f"Ideal resume length ({word_count} words). Your resume is concise, fits the 1-2 page standard, and remains highly readable."
        elif score >= 70:
            return f"Sub-optimal length ({word_count} words). Keep the word count between 400 and 800 words to prevent reader fatigue."
        else:
            return f"Unfavorable word count ({word_count} words). Resumes that are too short or overly verbose are ignored by system parsers."

scoring_engine = ScoringEngine()
