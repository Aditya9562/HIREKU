import { useState, useEffect } from "react";

export const translations: Record<string, Record<string, string>> = {
  en: {
    // Navbar & Common
    "nav.dashboard": "Dashboard",
    "nav.analyze": "Analyze New",
    "nav.method": "Method",
    "nav.features": "Features",
    "nav.faq": "FAQ",
    "nav.login": "Analyze CV",
    "nav.profile": "Profile",
    "nav.scannedAs": "Scanned as",
    
    // Hero & Landing
    "hero.eyebrow": "№ 01 — CV intelligence for ambitious careers",
    "hero.locations": "Jakarta · Singapore · Manila · Bangkok",
    "hero.title": "Land your dream job, with a CV that actually works.",
    "hero.desc": "A brutally honest, recruiter-grade analysis in under a minute. Supported by Gemini & Claude AI models. Directly optimize your CV for ATS systems and hiring filters.",
    "hero.dropzone.title": "Drop your CV here",
    "hero.dropzone.desc": "or click to upload",
    "hero.dropzone.format": "PDF or DOCX (Max 5MB)",
    "hero.rating": "4.9 · 1,200+ professionals got offers at",
    "hero.trusted": "Our users have landed offers at",
    "hero.method.title": "№ 02 — The Method",
    "hero.method.desc": "How we turn basic CVs into high-yield job magnets.",
    "hero.features.title": "№ 03 — System Features",
    "hero.features.desc": "Smarter screening built to outpace recruiter filters.",
    "hero.faq.title": "№ 04 — Frequently Asked Questions",
    "hero.faq.desc": "Everything you need to know about Hireku.",

    // New Scan Page
    "new.title": "Upload your resume",
    "new.subtitle": "Select a PDF or DOCX file up to 5MB in size.",
    "new.step1": "Upload CV",
    "new.step2": "Target Job",
    "new.target.title": "Where are you applying?",
    "new.target.subtitle": "Enter your target details to scan for keyword relevancy.",
    "new.target.position": "Target Position",
    "new.target.position.placeholder": "e.g. Senior Frontend Engineer",
    "new.target.company": "Target Company",
    "new.target.company.placeholder": "e.g. GoTo, Bank Mandiri, Telkom",
    "new.target.jd": "Job Description / Requirements (Optional)",
    "new.target.jd.placeholder": "Paste the target job description or requirements list to analyze keyword gaps...",
    "new.btn.back": "Back",
    "new.btn.start": "Start Free Resume Audit",
    "new.loading.upload": "Uploading resume to secure storage...",
    "new.loading.parse": "Parsing structural nodes & calculating scores...",
    "new.loading.ai": "Sending preprocessed summary to AI engine...",
    "new.loading.report": "Compiling recruiter feedback report...",
    "new.loading.title": "Analyzing Resume",

    // Dashboard
    "dash.welcome": "Welcome back",
    "dash.subtitle": "Manage your resumes and check hiring readiness scores.",
    "dash.btn.analyze": "Analyze Resume",
    "dash.history.title": "Scanned History",
    "dash.history.empty.title": "No Resumes Audited Yet",
    "dash.history.empty.desc": "Upload your first resume and see what gets flagged by recruitment filters.",
    "dash.history.empty.btn": "Upload Your Resume",
    "dash.status.complete": "Report Complete",
    "dash.score.prefix": "Score:",
    "dash.score.suffix": "/100",
    "dash.btn.report": "Report",
    "dash.btn.premium": "Premium",
    "dash.btn.unlock": "Unlock",
    "dash.filter.all": "All Roles",
    "dash.filter.mt": "Management Trainee (MT)",
    "dash.filter.odp": "ODP / BDP",
    "dash.filter.intern": "Internships",
    "dash.filter.tech": "Tech / Engineer",
    "dash.filter.professional": "Full-Time Roles",

    // Free Report
    "report.back": "Back to Dashboard",
    "report.eyebrow": "Hiring Readiness Assessment",
    "report.title": "Audit Report Review",
    "report.subtitle": "Generated using Gemini Flash and rule-based preprocessing.",
    "report.overall": "Overall Score",
    "report.scorer": "Deterministic Scorer",
    "report.recruiter.title": "See your resume through recruiter eyes",
    "report.categories": "Evaluation Metric Categories",
    "report.accordion.trigger": "SCORE EXPLANATION",
    "report.strengths.title": "Top 3 Strengths",
    "report.weaknesses.title": "Top 3 Critical Weaknesses",
    "report.keywords.title": "Missing Target Keywords",
    "report.keywords.desc": "These essential skills and terms are absent from your resume description. Integrating them will double your parsing matching score.",
    "report.upgrade.eyebrow": "Premium Optimization",
    "report.upgrade.title": "Your resume can be improved.",
    "report.upgrade.desc": "Upgrade your resume audit to the Premium Tier. Let Claude 3.5 Sonnet perform a deep rewrite, optimize achievements with impact metrics, draft a tailored cover letter, and provide downloadable PDFs.",
    "report.upgrade.feat1": "Claude 3.5 Results-oriented rewrite",
    "report.upgrade.feat2": "ATS-friendly PDF & Letter downloads",
    "report.upgrade.feat3": "Targeted Cover Letter draft",
    "report.upgrade.feat4": "10 custom STAR Interview questions",
    "report.upgrade.btn": "Upgrade for Rp19.900",

    // Premium Report
    "premium.title": "Premium Upgrade Complete",
    "premium.subtitle": "Review your tailored resume rewrite, cover letter, and download PDFs.",
    "premium.btn.resume": "Download Resume PDF",
    "premium.btn.letter": "Download Cover Letter",
    "premium.tab.audit": "Recruiter Audit",
    "premium.tab.letter": "Tailored Cover Letter",
    "premium.tab.interview": "Interview Prep",
    "premium.audit.review": "Strategic Premium Review",
    "premium.audit.opt": "Target Company Optimization",
    "premium.audit.perspective": "Recruiter Perspective",
    "premium.letter.title": "Tailored Cover Letter Draft",
    "premium.letter.copy": "Copy Letter",
    "premium.letter.copied": "Copied!",
    "premium.interview.title": "Targeted Interview Questions",
    "premium.interview.subtitle": "Prepare for interviews with questions customized for your experience and target role.",
    "premium.interview.tip": "Pro-Tip",
    "premium.roles.title": "Top 5 Recommended Roles For You",
    "premium.roles.subtitle": "Based on your CV skills, we recommend targeting these roles:"
  },
  id: {
    // Navbar & Common
    "nav.dashboard": "Dasbor",
    "nav.analyze": "Analisis Baru",
    "nav.method": "Metode",
    "nav.features": "Fitur",
    "nav.faq": "FAQ",
    "nav.login": "Analisis CV",
    "nav.profile": "Profil Saya",
    "nav.scannedAs": "Dipindai sebagai",

    // Hero & Landing
    "hero.eyebrow": "№ 01 — Kecerdasan CV untuk karier ambisius",
    "hero.locations": "Jakarta · Singapura · Manila · Bangkok",
    "hero.title": "Raih pekerjaan impian, dengan CV yang benar-benar berhasil.",
    "hero.desc": "Analisis jujur setingkat rekruter senior dalam waktu kurang dari satu menit. Didukung oleh Gemini & Claude AI. Optimalkan CV Anda langsung untuk sistem filter ATS.",
    "hero.dropzone.title": "Letakkan CV Anda di sini",
    "hero.dropzone.desc": "atau klik untuk memilih file",
    "hero.dropzone.format": "PDF atau DOCX (Maks 5MB)",
    "hero.rating": "4.9 · 1,200+ profesional meraih tawaran di",
    "hero.trusted": "Pengguna kami telah diterima bekerja di",
    "hero.method.title": "№ 02 — Metode Kami",
    "hero.method.desc": "Bagaimana kami mengubah CV biasa menjadi magnet kerja bernilai tinggi.",
    "hero.features.title": "№ 03 — Fitur Sistem",
    "hero.features.desc": "Penyaringan lebih cerdas yang dirancang melampaui filter rekruter.",
    "hero.faq.title": "№ 04 — Tanya Jawab Umum",
    "hero.faq.desc": "Semua yang perlu Anda ketahui tentang Hireku.",

    // New Scan Page
    "new.title": "Unggah CV Anda",
    "new.subtitle": "Pilih file PDF atau DOCX dengan ukuran maksimal 5MB.",
    "new.step1": "Unggah CV",
    "new.step2": "Pekerjaan Tujuan",
    "new.target.title": "Di mana Anda melamar?",
    "new.target.subtitle": "Masukkan rincian target posisi Anda untuk memindai relevansi kata kunci.",
    "new.target.position": "Posisi yang Dituju",
    "new.target.position.placeholder": "contoh: Senior Frontend Engineer",
    "new.target.company": "Perusahaan yang Dituju",
    "new.target.company.placeholder": "contoh: GoTo, Bank Mandiri, Telkom",
    "new.target.jd": "Deskripsi Pekerjaan / Persyaratan (Opsional)",
    "new.target.jd.placeholder": "Tempel deskripsi pekerjaan atau daftar persyaratan untuk menganalisis celah kata kunci...",
    "new.btn.back": "Kembali",
    "new.btn.start": "Mulai Audit CV Gratis",
    "new.loading.upload": "Mengunggah CV ke penyimpanan aman...",
    "new.loading.parse": "Memilah struktur data & menghitung skor...",
    "new.loading.ai": "Mengirimkan ringkasan ke mesin AI...",
    "new.loading.report": "Menyusun laporan umpan balik rekruter...",
    "new.loading.title": "Menganalisis CV Anda",

    // Dashboard
    "dash.welcome": "Selamat datang kembali",
    "dash.subtitle": "Kelola resume Anda dan periksa skor kesiapan rekrutmen.",
    "dash.btn.analyze": "Analisis CV Baru",
    "dash.history.title": "Riwayat Pemindaian",
    "dash.history.empty.title": "Belum Ada CV yang Diaudit",
    "dash.history.empty.desc": "Unggah resume pertama Anda dan lihat apa yang terdeteksi oleh filter rekrutmen.",
    "dash.history.empty.btn": "Unggah CV Anda Sekarang",
    "dash.status.complete": "Laporan Selesai",
    "dash.score.prefix": "Skor:",
    "dash.score.suffix": "/100",
    "dash.btn.report": "Laporan",
    "dash.btn.premium": "Premium",
    "dash.btn.unlock": "Buka Kunci",
    "dash.filter.all": "Semua Posisi",
    "dash.filter.mt": "Management Trainee (MT)",
    "dash.filter.odp": "ODP / BDP",
    "dash.filter.intern": "Magang (Internship)",
    "dash.filter.tech": "Teknologi / Engineering",
    "dash.filter.professional": "Pekerjaan Tetap",

    // Free Report
    "report.back": "Kembali ke Dasbor",
    "report.eyebrow": "Penilaian Kesiapan Rekrutmen",
    "report.title": "Tinjauan Laporan Audit",
    "report.subtitle": "Dibuat menggunakan Gemini Flash dan pemrosesan berbasis aturan.",
    "report.overall": "Skor Keseluruhan",
    "report.scorer": "Sistem Penilai Deterministik",
    "report.recruiter.title": "Lihat resume Anda melalui mata rekruter",
    "report.categories": "Kategori Metrik Evaluasi",
    "report.accordion.trigger": "PENJELASAN SKOR",
    "report.strengths.title": "3 Kekuatan Utama",
    "report.weaknesses.title": "3 Kelemahan Kritis",
    "report.keywords.title": "Kata Kunci Target yang Hilang",
    "report.keywords.desc": "Keahlian dan istilah penting ini tidak ada dalam deskripsi resume Anda. Mengintegrasikannya akan melipatgandakan skor kecocokan parsing Anda.",
    "report.upgrade.eyebrow": "Optimasi Premium",
    "report.upgrade.title": "Resume Anda dapat ditingkatkan.",
    "report.upgrade.desc": "Tingkatkan audit resume Anda ke Tingkat Premium. Biarkan Claude 3.5 Sonnet menulis ulang secara mendalam, mengoptimalkan pencapaian dengan metrik dampak, menyusun surat lamaran khusus, dan menyediakan unduhan PDF.",
    "report.upgrade.feat1": "Tulis ulang berorientasi hasil Claude 3.5",
    "report.upgrade.feat2": "Unduhan PDF & Surat Lamaran ramah ATS",
    "report.upgrade.feat3": "Draf Surat Lamaran yang disesuaikan",
    "report.upgrade.feat4": "10 pertanyaan Interview metode STAR khusus",
    "report.upgrade.btn": "Tingkatkan seharga Rp19.900",

    // Premium Report
    "premium.title": "Peningkatan Premium Selesai",
    "premium.subtitle": "Tinjau tulis ulang resume, surat lamaran yang disesuaikan, dan unduh PDF.",
    "premium.btn.resume": "Unduh PDF Resume",
    "premium.btn.letter": "Unduh Surat Lamaran",
    "premium.tab.audit": "Audit Rekruter",
    "premium.tab.letter": "Surat Lamaran Khusus",
    "premium.tab.interview": "Persiapan Wawancara",
    "premium.audit.review": "Tinjauan Premium Strategis",
    "premium.audit.opt": "Optimasi Perusahaan Tujuan",
    "premium.audit.perspective": "Pandangan Rekruter",
    "premium.letter.title": "Draf Surat Lamaran Khusus",
    "premium.letter.copy": "Salin Surat",
    "premium.letter.copied": "Tersalin!",
    "premium.interview.title": "Pertanyaan Wawancara Terarah",
    "premium.interview.subtitle": "Persiapkan wawancara dengan pertanyaan yang disesuaikan dengan pengalaman dan target posisi Anda.",
    "premium.interview.tip": "Tips Pro",
    "premium.roles.title": "5 Peran Paling Cocok Untuk Anda",
    "premium.roles.subtitle": "Berdasarkan keahlian CV Anda, kami merekomendasikan peran berikut:"
  }
};

export function useTranslation() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    if (typeof window !== "undefined" && window.navigator) {
      const browserLang = window.navigator.language || (window.navigator as any).userLanguage;
      if (browserLang && browserLang.toLowerCase().startsWith("id")) {
        setLang("id");
      }
    }
  }, []);

  const t = (key: string) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  return { t, lang, setLang };
}
