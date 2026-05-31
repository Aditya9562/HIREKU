import io
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from typing import Dict, Any, Tuple, List

# ── Page Constants ──────────────────────────────────────────
PAGE_WIDTH, PAGE_HEIGHT = A4  # 595.27 x 841.89
MARGIN = 41
CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN  # ~513.27 pt


def space_out(text: str) -> str:
    """Add spaces between letters for elegant spaced-out headings.
    E.g. 'EDUCATION' -> 'E D U C A T I O N'
    Preserves word boundaries with wider gaps.
    """
    words = text.upper().split()
    spaced_words = [" ".join(list(w)) for w in words]
    return "   ".join(spaced_words)


class PDFService:
    # ── Name Cleaning ───────────────────────────────────────
    def _clean_name(self, name: str) -> str:
        """Collapse spaced-out names like 'A D I T Y A  P U T R A  A F E N D I' 
        to 'Aditya Putra Afendi', and also title-case them."""
        if not name:
            return name
        tokens = name.split()
        if len(tokens) > 4:
            single_chars = sum(1 for t in tokens if len(t) == 1)
            if single_chars > len(tokens) * 0.5:
                word_groups = re.split(r'\s{2,}', name.strip())
                collapsed_words = []
                for group in word_groups:
                    letters = group.replace(' ', '')
                    if letters:
                        collapsed_words.append(letters.title())
                if collapsed_words:
                    return ' '.join(collapsed_words)
        return name

    # ── Title Parser ────────────────────────────────────────
    def _parse_item_title(self, title_text: str) -> Tuple[str, str, str, str]:
        """Parse a compound title into (role, date, organization, location).
        
        Handles formats like:
        - "Role — Context - Sep 2024 – Jan 2025 - Organization  |  Location"
        - "Degree — Field - Aug 2022 – Mar 2026 - University  |  City"
        - "Role (Jan–Mar 2024)"
        """
        if not title_text:
            return "", "", "", ""

        # 1. Full month-year range: "Sep 2024 – Jan 2025"
        date_pat = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[–—\-]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present)\s*\d{0,4})'
        m = re.search(date_pat, title_text, re.IGNORECASE)

        # 2. Parenthesized short date: "(Jan–Mar 2024)"
        if not m:
            paren_pat = r'\(((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[–—\-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\)'
            pm = re.search(paren_pat, title_text, re.IGNORECASE)
            if pm:
                date = pm.group(1).strip()
                role = title_text[:pm.start()].strip()
                role = re.sub(r'\s*[-–—]\s*$', '', role).strip()
                return role, date, "", ""

        # 3. Year-only range: "2023 - 2024" or "2023 – Present"
        if not m:
            year_pat = r'(\d{4}\s*[–—\-]\s*(?:\d{4}|Present))'
            m = re.search(year_pat, title_text, re.IGNORECASE)

        if m:
            date = m.group(0).strip()
            before = title_text[:m.start()].strip()
            after = title_text[m.end():].strip()

            before = re.sub(r'\s*[-–—]\s*$', '', before).strip()
            after = re.sub(r'^\s*[-–—]\s*', '', after).strip()

            role = before
            org_location = after

            location = ""
            org = org_location
            if '|' in org_location:
                parts = org_location.split('|', 1)
                org = parts[0].strip()
                location = parts[1].strip()

            return role, date, org, location

        # Fallback
        return title_text, "", "", ""

    # ── Resume PDF Generator ────────────────────────────────
    def generate_optimized_resume(self, resume_data: Dict[str, Any]) -> bytes:
        """Generate a premium ATS-compliant resume PDF matching reference CV layout.
        
        Layout matches: A4 page, 41pt margins, spaced-out headings, 
        role/date/org structured items, en-dash bullets.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=MARGIN,
            leftMargin=MARGIN,
            topMargin=30,
            bottomMargin=30
        )

        styles = getSampleStyleSheet()

        # ── Typography System ───────────────────────────────
        name_style = ParagraphStyle(
            'ResumeName', parent=styles['Normal'],
            fontName='Helvetica-Bold', fontSize=24, leading=30,
            alignment=TA_CENTER, textColor=colors.black,
            spaceAfter=2
        )

        contact_style = ParagraphStyle(
            'ResumeContact', parent=styles['Normal'],
            fontName='Helvetica', fontSize=8.52, leading=11.5,
            alignment=TA_CENTER, textColor=colors.HexColor('#444444'),
            spaceAfter=1
        )

        tagline_style = ParagraphStyle(
            'ResumeTagline', parent=styles['Normal'],
            fontName='Helvetica-Oblique', fontSize=8.52, leading=11.5,
            alignment=TA_CENTER, textColor=colors.HexColor('#888888'),
            spaceAfter=4
        )

        section_heading_style = ParagraphStyle(
            'SectionHeading', parent=styles['Normal'],
            fontName='Helvetica-Bold', fontSize=9.48, leading=13,
            textColor=colors.black, spaceAfter=0,
            keepWithNext=True
        )

        summary_body = ParagraphStyle(
            'SummaryBody', parent=styles['Normal'],
            fontName='Helvetica', fontSize=9.0, leading=12.5,
            textColor=colors.black, spaceAfter=2
        )

        competency_style = ParagraphStyle(
            'CompetencyLine', parent=styles['Normal'],
            fontName='Helvetica', fontSize=8.52, leading=11.5,
            textColor=colors.black, spaceAfter=1
        )

        item_role_style = ParagraphStyle(
            'ItemRole', parent=styles['Normal'],
            fontName='Helvetica-Bold', fontSize=9.48, leading=12.5,
            textColor=colors.black, alignment=TA_LEFT
        )

        item_date_style = ParagraphStyle(
            'ItemDate', parent=styles['Normal'],
            fontName='Helvetica', fontSize=8.52, leading=12,
            textColor=colors.HexColor('#888888'), alignment=TA_RIGHT
        )

        item_org_style = ParagraphStyle(
            'ItemOrg', parent=styles['Normal'],
            fontName='Helvetica-Oblique', fontSize=8.52, leading=11,
            textColor=colors.HexColor('#444444'), alignment=TA_LEFT
        )

        bullet_style = ParagraphStyle(
            'BulletItem', parent=styles['Normal'],
            fontName='Helvetica', fontSize=8.52, leading=11.5,
            textColor=colors.black, spaceAfter=1.5,
            leftIndent=12, firstLineIndent=-12
        )

        cert_style = ParagraphStyle(
            'CertItem', parent=styles['Normal'],
            fontName='Helvetica', fontSize=8.52, leading=11.5,
            textColor=colors.black, spaceAfter=1
        )

        skills_style = ParagraphStyle(
            'SkillsText', parent=styles['Normal'],
            fontName='Helvetica', fontSize=8.52, leading=12,
            textColor=colors.black, leftIndent=0
        )

        story = []

        # ── 1. HEADER ──────────────────────────────────────
        personal = resume_data.get("personal_info", {})
        raw_name = personal.get("name", "Candidate Name")
        name = self._clean_name(raw_name)
        spaced_name = space_out(name)
        story.append(Paragraph(spaced_name, name_style))

        # Contact line 1: field/degree, university | location (if available)
        # Contact line 2: phone | email | linkedin
        contact_parts_line2 = []
        if personal.get("phone"):
            contact_parts_line2.append(personal["phone"])
        if personal.get("email"):
            contact_parts_line2.append(personal["email"])
        if personal.get("linkedin"):
            contact_parts_line2.append(personal["linkedin"])
        if personal.get("portfolio"):
            contact_parts_line2.append(personal["portfolio"])

        # If location is present, show it as a separate contact line or merged
        if personal.get("location"):
            story.append(Paragraph(personal["location"], contact_style))

        if contact_parts_line2:
            story.append(Paragraph("  |  ".join(contact_parts_line2), contact_style))

        # Tagline (e.g. "Product Management • Digital Innovation • Agile Execution")
        tagline = resume_data.get("tagline", "")
        if tagline:
            story.append(Paragraph(tagline, tagline_style))

        story.append(Spacer(1, 4))

        # ── Section Divider Helper ──────────────────────────
        def add_section(heading_text: str):
            story.append(Spacer(1, 5))
            spaced = space_out(heading_text)
            story.append(Paragraph(spaced, section_heading_style))
            story.append(HRFlowable(
                width="100%", thickness=0.75,
                color=colors.HexColor('#AAAAAA'),
                spaceAfter=4, spaceBefore=2
            ))

        # ── Experience Item Helper ──────────────────────────
        def add_item(title_text: str, desc_text: str):
            role, date, org, location = self._parse_item_title(title_text)

            # Row 1: Role (bold, left) | Date (gray, right)
            row1 = [
                Paragraph(role, item_role_style),
                Paragraph(date, item_date_style)
            ]
            rows = [row1]

            # Row 2: Organization | Location (italic, dark gray)
            if org:
                org_loc = org
                if location:
                    org_loc += "  |  " + location
                rows.append([
                    Paragraph(org_loc, item_org_style),
                    Paragraph("", item_org_style)
                ])

            col_widths = [CONTENT_WIDTH * 0.72, CONTENT_WIDTH * 0.28]
            t = Table(rows, colWidths=col_widths)
            t.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
                ('TOPPADDING', (0, 0), (-1, -1), 1),
            ]))
            story.append(t)

            # Bullet points (en-dash style)
            if desc_text:
                bullets = [b.strip() for b in desc_text.split("\n") if b.strip()]
                for b in bullets:
                    clean = re.sub(r'^[•\-\*▪–]\s*', '', b).strip()
                    if clean:
                        story.append(Paragraph(f"– {clean}", bullet_style))

            story.append(Spacer(1, 3))

        # ── 2. PROFESSIONAL SUMMARY ────────────────────────
        summary = resume_data.get("professional_summary", "")
        if summary:
            add_section("PROFESSIONAL SUMMARY")
            for para in summary.split("\n\n"):
                clean = para.strip().replace("\n", " ")
                if clean:
                    story.append(Paragraph(clean, summary_body))
            story.append(Spacer(1, 2))

        # ── 3. CORE COMPETENCIES ───────────────────────────
        competencies = resume_data.get("core_competencies", {})
        if competencies:
            add_section("CORE COMPETENCIES")
            for category, items in competencies.items():
                if isinstance(items, list):
                    skills_text = " · ".join(items)
                else:
                    skills_text = str(items)
                line = f"<b>{category}:</b> {skills_text}"
                story.append(Paragraph(line, competency_style))
            story.append(Spacer(1, 2))

        # ── 4. PROFESSIONAL EXPERIENCE ─────────────────────
        exp_list = resume_data.get("experience", [])
        if exp_list:
            add_section("PROFESSIONAL EXPERIENCE")
            for exp in exp_list:
                add_item(exp.get("title", ""), exp.get("description", ""))

        # ── 5. PROJECTS ────────────────────────────────────
        proj_list = resume_data.get("projects", [])
        if proj_list:
            add_section("PROJECTS")
            for proj in proj_list:
                add_item(proj.get("title", ""), proj.get("description", ""))

        # ── 6. EDUCATION ───────────────────────────────────
        edu_list = resume_data.get("education", [])
        if edu_list:
            add_section("EDUCATION")
            for edu in edu_list:
                add_item(edu.get("title", ""), edu.get("description", ""))

        # ── 7. KEY CERTIFICATIONS ──────────────────────────
        cert_list = resume_data.get("certifications", [])
        if cert_list:
            # Filter out noise: only keep items > 5 chars that aren't just dates
            filtered_certs = []
            for c in cert_list:
                clean = re.sub(r'^[•\-\*▪–]\s*', '', c).strip()
                if len(clean) > 5 and not re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$', clean, re.I):
                    filtered_certs.append(clean)
            if filtered_certs:
                add_section("KEY CERTIFICATIONS")
                for cert in filtered_certs:
                    story.append(Paragraph(cert, cert_style))
                story.append(Spacer(1, 2))

        # ── 8. NOTABLE ACHIEVEMENTS ────────────────────────
        achievements = resume_data.get("notable_achievements", [])
        if achievements:
            add_section("NOTABLE ACHIEVEMENTS")
            for ach in achievements:
                clean = re.sub(r'^[•\-\*▪–]\s*', '', ach).strip()
                if clean:
                    story.append(Paragraph(f"– {clean}", bullet_style))
            story.append(Spacer(1, 2))

        # ── 9. SKILLS & INTERESTS ──────────────────────────
        skills_list = resume_data.get("skills", [])
        if skills_list and not competencies:
            add_section("SKILLS & INTERESTS")
            skills_text = ", ".join(skills_list)
            story.append(Paragraph(skills_text, skills_style))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    # ── Cover Letter Generator ──────────────────────────────
    def generate_cover_letter(self, cover_letter_text: str, personal_info: Dict[str, Any]) -> bytes:
        """Generate a professionally formatted cover letter PDF."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=MARGIN + 13,
            leftMargin=MARGIN + 13,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()

        name = personal_info.get("name", "Candidate Name")
        name = self._clean_name(name)

        name_style = ParagraphStyle(
            'LetterName', parent=styles['Normal'],
            fontName='Helvetica-Bold', fontSize=16, leading=20,
            alignment=TA_LEFT, textColor=colors.black,
            spaceAfter=4
        )

        contact_style = ParagraphStyle(
            'LetterContact', parent=styles['Normal'],
            fontName='Helvetica', fontSize=8.52, leading=12,
            alignment=TA_LEFT, textColor=colors.HexColor('#444444'),
            spaceAfter=8
        )

        body_style = ParagraphStyle(
            'LetterBody', parent=styles['Normal'],
            fontName='Helvetica', fontSize=9.5, leading=14.5,
            textColor=colors.HexColor('#222222'),
            spaceAfter=10
        )

        story = []
        story.append(Paragraph(name, name_style))

        contact_parts = []
        if personal_info.get("email"):
            contact_parts.append(personal_info["email"])
        if personal_info.get("phone"):
            contact_parts.append(personal_info["phone"])
        if personal_info.get("location"):
            contact_parts.append(personal_info["location"])

        contact_text = "  |  ".join(contact_parts)
        story.append(Paragraph(contact_text, contact_style))

        story.append(HRFlowable(
            width="100%", thickness=0.75,
            color=colors.HexColor('#AAAAAA'),
            spaceAfter=16, spaceBefore=4
        ))

        paragraphs = cover_letter_text.split("\n\n")
        for para in paragraphs:
            clean_para = para.strip().replace("\n", "<br/>")
            if clean_para:
                story.append(Paragraph(clean_para, body_style))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes


pdf_service = PDFService()
