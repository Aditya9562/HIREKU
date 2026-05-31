import fitz
import re
import json

sections_config = {
    "education": ["education", "academic history", "academic background", "study", "studies", "kuliah"],
    "experience": ["experience", "employment history", "work history", "professional experience", "career", "pengalaman kerja", "work experience", "additional leadership & organizational experience", "additional leadership and organizational experience", "leadership experience", "leadership"],
    "projects": ["projects", "personal projects", "key projects", "proyek", "notable projects"],
    "certifications": ["certifications", "certificates", "licenses", "sertifikasi", "sertifikat", "key certifications", "notable achievements", "achievements"],
    "skills": ["skills", "technical skills", "core competencies", "expertise", "keahlian", "skills & interests", "skills and interests"]
}

def parse_items_by_bullet(lines):
    items = []
    current_item = {"title": "", "description": []}
    header_lines_count = 0
    has_bullets = False
    
    n = len(lines)
    for idx in range(n):
        line = lines[idx]
        is_bullet = line.startswith("•") or line.startswith("-") or line.startswith("*") or line.startswith("▪") or line.startswith("–")
        clean_line = re.sub(r'^[•\-\*▪–]\s*', '', line).strip()
        
        if is_bullet:
            if current_item["title"]:
                current_item["description"].append(clean_line)
                has_bullets = True
            else:
                current_item["title"] = clean_line
                header_lines_count = 1
                has_bullets = True
        else:
            # Non-bullet line
            if not current_item["title"]:
                current_item["title"] = clean_line
                header_lines_count = 1
            else:
                # If we already have a description block, this must be a new item
                if current_item["description"]:
                    # Determine if this starts a new item or is a continuation of the last bullet
                    is_capitalized = clean_line[0].isupper() if clean_line else False
                    has_date = bool(re.search(r'(20\d\d|19\d\d|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|current)', clean_line, re.IGNORECASE))
                    is_separator = any(sep in clean_line for sep in ["|", "@", "—", " - ", " – "]) or (" at " in f" {clean_line.lower()} ")
                    
                    # Lookahead to see if next line has a date (common for titles followed by date line)
                    next_has_date = False
                    if idx + 1 < n:
                        next_line = lines[idx + 1]
                        next_has_date = bool(re.search(r'(20\d\d|19\d\d|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|current)', next_line, re.IGNORECASE))
                        
                    if is_capitalized and (has_date or is_separator or next_has_date):
                        # Save current item
                        items.append({
                            "title": current_item["title"],
                            "description": "\n".join(current_item["description"])
                        })
                        current_item = {"title": clean_line, "description": []}
                        header_lines_count = 1
                        has_bullets = False
                    else:
                        # Continuation of the last bullet
                        if current_item["description"]:
                            current_item["description"][-1] += " " + clean_line
                        else:
                            current_item["description"].append(clean_line)
                else:
                    # If we have less than 3 header lines, append to title
                    has_date = bool(re.search(r'(20\d\d|19\d\d|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|current)', clean_line, re.IGNORECASE))
                    is_header_like = (len(clean_line) < 60) or has_date or ("|" in clean_line)
                    
                    if header_lines_count < 3 and is_header_like:
                        current_item["title"] += " - " + clean_line
                        header_lines_count += 1
                    else:
                        current_item["description"].append(clean_line)
                        
    if current_item["title"]:
        items.append({
            "title": current_item["title"],
            "description": "\n".join(current_item["description"])
        })
        
    return items

def run_test():
    doc = fitz.open(r"C:\Users\aditya\OneDrive - Universitas Diponegoro\CV\DOCS\MANDIRI ODP\Aditya_Putra_Afendi_ODP_IT_BankMandiri.pdf")
    text = ""
    for page in doc:
        text += page.get_text()
        
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    current_section = None
    section_texts = {sec: [] for sec in sections_config}
    
    for line in lines:
        lower_line = line.lower().strip()
        normalized_line = re.sub(r'[^a-z0-9]', '', lower_line)
        
        found = False
        for sec, keywords in sections_config.items():
            normalized_keywords = [re.sub(r'[^a-z0-9]', '', kw) for kw in keywords]
            if normalized_line in normalized_keywords:
                current_section = sec
                found = True
                break
        if not found and current_section:
            section_texts[current_section].append(line)
            
    # Process experiences
    exp_items = parse_items_by_bullet(section_texts["experience"])
    with open("tests/test_output.txt", "w", encoding="utf-8") as f:
        f.write(f"Total Experience parsed: {len(exp_items)}\n")
        for idx, e in enumerate(exp_items):
            f.write(f"\nItem {idx+1}:\n")
            f.write(f"Title: {e['title']}\n")
            f.write("Bullets:\n")
            for b in e['description'].split('\n'):
                f.write(f"  - {b}\n")
    print("Successfully wrote parsed results to tests/test_output.txt")

if __name__ == '__main__':
    run_test()
