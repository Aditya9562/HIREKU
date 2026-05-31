"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { 
  Sparkles, FileText, CheckCircle2, Download, Copy, Check, 
  HelpCircle, ArrowLeft, Target, TrendingUp, AlertTriangle, Lightbulb
} from "lucide-react";

interface PremiumReportData {
  id: string;
  resume_id: string;
  model_used: string;
  deep_review: string;
  recruiter_perspective: string;
  company_optimization: string;
  senior_hr_audit?: {
    senior_hr_role: string;
    verdict: string;
    role_alignment: string;
    competency_gaps: string;
    action_plan: string;
  };
  rewritten_resume_json: {
    personal_info: Record<string, string>;
    education: Array<Record<string, string>>;
    experience: Array<Record<string, string>>;
    projects: Array<Record<string, string>>;
    certifications: string[];
    skills: string[];
    top_five_roles?: Array<{ role: string; reason: string }>;
  };
  cover_letter: string;
  interview_questions: Array<{
    question: string;
    model_answer: string;
    tip: string;
  }>;
  optimized_resume_url: string;
  cover_letter_url: string;
  // New HR-expert prompt output fields
  final_cv_text?: string;
  keyword_analysis?: string;
  ats_match_percentage?: number;
  missing_keywords_list?: string[];
  improvement_suggestions?: string[];
  learning_suggestions?: Array<{
    skill: string;
    reason: string;
    resource: string;
  }>;
  created_at: string;
}

const TABS = [
  { id: "cv",        label: "Optimized CV",       icon: FileText     },
  { id: "ats",       label: "ATS Analysis",        icon: Target       },
  { id: "review",    label: "Recruiter Audit",     icon: CheckCircle2 },
  { id: "letter",    label: "Cover Letter",        icon: FileText     },
  { id: "interview", label: "Interview Prep",      icon: HelpCircle   },
];

export default function PremiumReport() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<PremiumReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingStage, setLoadingStage] = useState("Authenticating session...");
  const [activeTab, setActiveTab] = useState("cv");
  const [copiedCV, setCopiedCV] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  useEffect(() => {
    async function loadPremium() {
      try {
        const token = await getToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        setLoadingStage("Claude Sonnet 4 is crafting your HR-expert CV package...");
        const r = await fetch(`${apiBase}/premium/generate/${id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          setReport(await r.json());
        } else {
          setError(r.status === 402
            ? "Payment not completed. Please purchase premium first."
            : "Failed to generate premium report. Ensure your payment went through.");
        }
      } catch {
        setError("Network error connecting to API server.");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadPremium();
  }, [id, getToken]);

  const copyText = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  /* ─── Loading ─────────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[60vh] space-y-10 text-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-accent/10"/>
        <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"/>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-accent animate-pulse"/>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-display font-medium text-foreground">Building Your Premium Package</h3>
        <p className="text-muted-foreground text-sm font-mono animate-pulse">{loadingStage}</p>
        <p className="text-xs text-muted-foreground/60">This may take 60–90 seconds. Claude Sonnet 4 reads your raw CV and crafts a fully tailored package.</p>
      </div>
      {/* Progress steps */}
      <div className="w-full max-w-sm space-y-2">
        {["Reading raw CV text", "Analysing job requirements", "Writing optimized CV", "Generating cover letter & interview prep"].map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}/>
            {step}
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Error ───────────────────────────────────────────────────────────── */
  if (error || !report) return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
      <h3 className="text-2xl font-display font-medium text-foreground">Premium Unlock Failed</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{error || "Premium report not available."}</p>
      <div className="flex gap-4 justify-center pt-4">
        <button onClick={() => router.push("/dashboard")}
          className="px-6 py-2.5 bg-surface border border-border-strong rounded-full text-foreground font-semibold text-sm transition hover:bg-muted">
          Back to Dashboard
        </button>
        <button onClick={() => router.push("/dashboard")}
          className="px-6 py-2.5 bg-accent rounded-full text-white font-bold text-sm transition hover:bg-accent/90 shadow">
          Try Again
        </button>
      </div>
    </div>
  );

  const matchPct = report.ats_match_percentage ?? null;

  /* ─── Main Render ─────────────────────────────────────────────────────── */
  return (
    <div className="section-container py-12 w-full flex-grow flex flex-col space-y-8 text-left">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6">
        <div>
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-semibold mb-2 font-mono">
            <ArrowLeft className="w-3.5 h-3.5"/> BACK TO DASHBOARD
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
              Premium Package Ready
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-accent-soft border border-accent/20 text-accent text-xs font-mono font-bold uppercase">
              <Sparkles className="w-3 h-3"/> {report.model_used || "Claude Sonnet 4"}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1.5">
            HR-expert optimized CV, ATS keyword analysis, cover letter &amp; interview prep — all in one package.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          {report.optimized_resume_url && (
            <a href={report.optimized_resume_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-xs font-semibold text-white transition hover:bg-accent/90 shadow-[0_4px_12px_rgba(235,94,40,0.2)]">
              <Download className="w-4 h-4"/> Resume PDF
            </a>
          )}
          {report.cover_letter_url && (
            <a href={report.cover_letter_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-5 py-3 text-xs font-semibold text-foreground transition hover:bg-muted">
              <FileText className="w-4 h-4 text-muted-foreground"/> Cover Letter PDF
            </a>
          )}
        </div>
      </div>

      {/* ATS match banner — prominent callout */}
      {matchPct !== null && (
        <div className={`flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl border ${matchPct >= 80 ? "bg-emerald-500/5 border-emerald-500/20" : matchPct >= 60 ? "bg-accent-soft border-accent/20" : "bg-red-500/5 border-red-500/20"}`}>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-display font-bold tabular-nums ${matchPct >= 80 ? "text-emerald-500" : matchPct >= 60 ? "text-accent" : "text-red-400"}`}>
              {matchPct}%
            </div>
            <div>
              <div className="font-display font-medium text-foreground text-sm">ATS Match Score</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {matchPct >= 80 ? "Excellent — your CV is well-aligned." : matchPct >= 60 ? "Good — a few key gaps to fix." : "Needs work — see ATS Analysis tab."}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex-1 sm:ml-auto w-full sm:max-w-xs">
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${matchPct >= 80 ? "bg-emerald-500" : matchPct >= 60 ? "bg-accent" : "bg-red-400"}`}
                style={{ width: `${matchPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border select-none overflow-x-auto pb-0 scrollbar-none">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition shrink-0 ${
                activeTab === tab.id
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-3.5 h-3.5"/>{tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: Optimized CV ───────────────────────────────────────────── */}
      {activeTab === "cv" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-display font-medium text-foreground">Your Optimized CV</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crafted by Claude Sonnet 4 as an HR expert. ATS-optimized and tailored to your target role. Ready to copy-paste.
              </p>
            </div>
            {report.final_cv_text && (
              <button
                onClick={() => copyText(report.final_cv_text!, setCopiedCV)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-foreground bg-muted/40 border border-border hover:bg-muted rounded-full transition shrink-0">
                {copiedCV ? <><Check className="w-3.5 h-3.5 text-emerald-500"/> Copied!</> : <><Copy className="w-3.5 h-3.5 text-muted-foreground"/> Copy CV</>}
              </button>
            )}
          </div>

          {report.final_cv_text ? (
            <div className="relative">
              <pre className="p-6 rounded-2xl bg-surface border border-border font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap overflow-x-auto shadow-inner max-h-[70vh] overflow-y-auto">
                {report.final_cv_text}
              </pre>
              {/* sticky copy button inside scroll area */}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-surface border border-border text-center text-muted-foreground text-sm">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30"/>
              Optimized CV text not available. Download the PDF above.
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ATS Analysis ───────────────────────────────────────────── */}
      {activeTab === "ats" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Keyword matching analysis */}
            {report.keyword_analysis && (
              <div className="p-6 rounded-2xl bg-surface border border-border space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent"/>
                  <h3 className="text-lg font-display font-medium text-foreground">Keyword Matching Analysis</h3>
                </div>
                <p className="text-foreground/85 text-sm leading-relaxed font-serif">
                  {report.keyword_analysis}
                </p>
              </div>
            )}

            {/* Improvement suggestions */}
            {report.improvement_suggestions && report.improvement_suggestions.length > 0 && (
              <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-accent"/>
                  <h3 className="text-lg font-display font-medium text-foreground">Specific Improvement Actions</h3>
                </div>
                <ol className="space-y-3">
                  {report.improvement_suggestions.map((sug, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent-soft text-accent font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground/90 leading-relaxed">{sug}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Sidebar: Missing keywords + match score */}
          <div className="space-y-5">
            {/* Match circle */}
            {matchPct !== null && (
              <div className="p-6 rounded-2xl bg-surface border border-border text-center space-y-3 shadow-sm">
                <p className="label-eyebrow text-center">ATS Match Score</p>
                <div className="relative w-28 h-28 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="hsl(var(--muted)/0.4)" strokeWidth="2.5"/>
                    <circle cx="18" cy="18" r="15.9155" fill="none"
                      stroke={matchPct >= 80 ? "#10b981" : matchPct >= 60 ? "hsl(var(--accent))" : "#f87171"}
                      strokeWidth="2.5"
                      strokeDasharray={`${matchPct} ${100 - matchPct}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-display font-bold tabular-nums ${matchPct >= 80 ? "text-emerald-500" : matchPct >= 60 ? "text-accent" : "text-red-400"}`}>
                      {matchPct}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {matchPct >= 80 ? "Strong alignment with job requirements" : matchPct >= 60 ? "Good match — close the gaps below" : "Significant gaps found — review missing keywords"}
                </p>
              </div>
            )}

            {/* Missing keywords */}
            {report.missing_keywords_list && report.missing_keywords_list.length > 0 && (
              <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400"/>
                  <h3 className="text-base font-display font-medium text-foreground">Missing Keywords</h3>
                </div>
                <p className="text-xs text-muted-foreground">Add these to your CV to improve your ATS pass rate:</p>
                <div className="flex flex-wrap gap-2">
                  {report.missing_keywords_list.map((kw, i) => (
                    <span key={i} className="px-3 py-1 text-xs rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-500 font-mono font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Recruiter Audit ─────────────────────────────────────────── */}
      {activeTab === "review" && (
        <div className="space-y-8 w-full max-w-5xl">
          {/* Strategic Premium Review */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent"/> Strategic Premium Review
            </h3>
            <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line font-serif">{report.deep_review}</p>
          </div>

          {/* Target Company Optimization */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-accent"/> Target Company Optimization
            </h3>
            <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line font-serif">{report.company_optimization}</p>
          </div>

          {/* Recommended Roles */}
          {report.rewritten_resume_json?.top_five_roles && (
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm hover:shadow-md transition">
              <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent"/> Recommended Roles
              </h3>
              <p className="text-xs text-muted-foreground">Top career paths based on your actual experience and skills profile.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {report.rewritten_resume_json.top_five_roles.map((r, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-background border border-border space-y-1 hover:border-accent/40 transition">
                    <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">#{idx + 1} {r.role}</span>
                    <p className="text-xs text-muted-foreground font-serif leading-relaxed">{r.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recruiter Perspective */}
          <div className="p-6 rounded-2xl bg-accent-soft/30 border border-accent/20 space-y-4 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent"/> Recruiter Perspective
            </h3>
            <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line font-serif italic">
              "{report.recruiter_perspective}"
            </p>
          </div>

          {/* Learning Suggestions (Saran Pembelajaran) */}
          {report.learning_suggestions && report.learning_suggestions.length > 0 && (
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm hover:shadow-md transition">
              <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent"/> Saran Pembelajaran (Recommended Learning Paths)
              </h3>
              <p className="text-xs text-muted-foreground">Pelajari keahlian berikut untuk memperbesar peluang karir Anda di perusahaan tujuan:</p>
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/40">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Keahlian / Alat (Skill)</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Alasan Penting (Why it Matters)</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Rekomendasi Sumber Belajar (Resource)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-border font-sans text-sm">
                    {report.learning_suggestions.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground font-mono">{item.skill}</td>
                        <td className="px-6 py-4 text-foreground/80 leading-relaxed max-w-xs whitespace-normal font-serif">{item.reason}</td>
                        <td className="px-6 py-4 text-accent hover:text-accent-hover font-medium">
                          {item.resource.startsWith("http") ? (
                            <a href={item.resource} target="_blank" rel="noopener noreferrer" className="underline">{item.resource}</a>
                          ) : (
                            <span>{item.resource}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Executive HR Audit if available */}
          {report.senior_hr_audit && (
            <div className="p-6 rounded-2xl bg-surface border border-accent/20 space-y-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="w-24 h-24 text-accent"/>
              </div>
              <div className="border-b border-border pb-3">
                <h3 className="text-xl font-display font-medium text-foreground">Executive HR Audit</h3>
                <p className="text-xs text-accent font-mono mt-0.5 uppercase tracking-wider font-semibold">
                  Persona: {report.senior_hr_audit.senior_hr_role || "Senior HR Manager"}
                </p>
              </div>
              <div className="space-y-4 text-sm">
                {[
                  { label: "Verdict", value: report.senior_hr_audit.verdict, accent: false },
                  { label: "Role Alignment", value: report.senior_hr_audit.role_alignment, accent: false },
                  { label: "Competency Gaps", value: report.senior_hr_audit.competency_gaps, accent: true },
                  { label: "Action Plan", value: report.senior_hr_audit.action_plan, accent: "orange" as const },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${item.accent === "orange" ? "bg-accent-soft/30 border-accent/15" : "bg-background border-border"}`}>
                    <span className={`font-bold block mb-1 uppercase text-xs tracking-wider font-mono ${item.accent === "orange" ? "text-accent" : item.accent ? "text-accent" : "text-foreground"}`}>
                      {item.label}
                    </span>
                    <p className="text-foreground/90 font-serif leading-relaxed whitespace-pre-line">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Cover Letter ─────────────────────────────────────────────── */}
      {activeTab === "letter" && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h3 className="text-lg font-display font-medium text-foreground">Tailored Cover Letter</h3>
            <button onClick={() => copyText(report.cover_letter, setCopiedLetter)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-foreground bg-muted/40 border border-border hover:bg-muted rounded-full transition">
              {copiedLetter ? <><Check className="w-3.5 h-3.5 text-emerald-700"/> Copied!</> : <><Copy className="w-3.5 h-3.5 text-muted-foreground"/> Copy Letter</>}
            </button>
          </div>
          <div className="p-6 rounded-xl bg-background/50 border border-border font-serif text-[15px] text-foreground/90 whitespace-pre-line leading-relaxed max-w-3xl shadow-inner">
            {report.cover_letter}
          </div>
        </div>
      )}

      {/* ── TAB: Interview Prep ───────────────────────────────────────────── */}
      {activeTab === "interview" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-display font-medium text-foreground">Targeted Interview Questions</h3>
            <p className="text-xs text-muted-foreground mt-1">10 customized STAR-method questions based on your role and experience.</p>
          </div>
          <div className="space-y-4">
            {report.interview_questions.map((q, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-surface border border-border space-y-3 shadow-sm hover:border-border-strong transition">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    Q{idx + 1}
                  </span>
                  <h4 className="font-display font-medium text-foreground text-base">{q.question}</h4>
                </div>
                <div className="pl-8 space-y-3">
                  <div className="p-4 rounded-xl bg-background border border-border text-sm text-foreground/80 leading-relaxed font-serif">
                    <span className="font-semibold text-foreground block mb-1 font-display">Model Answer:</span>
                    {q.model_answer}
                  </div>
                  <div className="text-xs text-accent italic flex items-center gap-1.5 font-mono">
                    <HelpCircle className="w-3.5 h-3.5"/>
                    <span>Pro-Tip: {q.tip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
