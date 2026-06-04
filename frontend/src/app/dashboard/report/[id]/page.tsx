"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { 
  Sparkles, CheckCircle2, AlertTriangle, 
  ChevronDown, BookOpen, UserCheck, ShieldAlert, Award, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getApiUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

interface ReportData {
  id: string;
  resume_id: string;
  model_used: string;
  overall_score: number;
  resume_structure_score: number;
  keyword_coverage_score: number;
  experience_quality_score: number;
  achievement_strength_score: number;
  skills_relevance_score: number;
  readability_score: number;
  scoring_explanations: Record<string, string>;
  top_strengths: string[];
  top_weaknesses: string[];
  missing_keywords: string[];
  recruiter_impression: string;
  job_match_score?: number;
  missing_skills?: string[];
  recommended_improvements?: string[];
  created_at: string;
}

export default function AnalysisReport() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { t, lang } = useTranslation();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Detail popup modal state
  const [activeModalMetric, setActiveModalMetric] = useState<{ label: string; score: number; explKey: string } | null>(null);
  
  // Checkout process
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [snapToken, setSnapToken] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        const token = await getToken();
        const apiBase = getApiUrl();
        
        const r = await fetch(`${apiBase}/analyses/report/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (r.ok) {
          const data = await r.json();
          setReport(data);
        } else {
          setError("Failed to load evaluation report.");
        }
      } catch (err: any) {
        setError("Network error connecting to API server.");
      } finally {
        setLoading(false);
      }
    }
    
    if (id) loadReport();
  }, [id, getToken]);

  const triggerCheckout = async () => {
    if (!report) return;
    setPaymentLoading(true);
    setPaymentError("");
    
    try {
      const token = await getToken();
      const apiBase = getApiUrl();
      
      const r = await fetch(`${apiBase}/payments/checkout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ resume_id: report.resume_id })
      });
      
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.detail || "Checkout session generation failed.");
      }
      
      const checkoutData = await r.json();
      setSnapToken(checkoutData.snap_token);
      setOrderId(checkoutData.order_id);
      
      // Check if Midtrans global snap is loaded
      if (typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(checkoutData.snap_token, {
          onSuccess: (result: any) => {
            router.push(`/dashboard/premium/${report.resume_id}`);
          },
          onPending: (result: any) => {
            setPaymentError("Payment is pending. Please complete transaction in your e-wallet.");
            setPaymentLoading(false);
          },
          onError: (result: any) => {
            setPaymentError("Payment process failed. Please try again.");
            setPaymentLoading(false);
          },
          onClose: () => {
            setPaymentLoading(false);
          }
        });
      } else {
        // Fallback for development if midtrans script failed to load
        throw new Error("Midtrans script failed to load. Use simulator fallback button below.");
      }
    } catch (err: any) {
      setPaymentLoading(false);
      setPaymentError(err.message || "Failed to trigger checkout session.");
    }
  };

  const simulateSuccessPayment = async () => {
    if (!orderId && !report) return;
    setPaymentLoading(true);
    try {
      const token = await getToken();
      const apiBase = getApiUrl();
      
      // If we haven't clicked check out yet, we generate a session first
      let activeOrder = orderId;
      if (!activeOrder) {
        const rCheck = await fetch(`${apiBase}/payments/checkout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ resume_id: report!.resume_id })
        });
        const dataCheck = await rCheck.json();
        activeOrder = dataCheck.order_id;
      }

      // Call simulation success
      const r = await fetch(`${apiBase}/payments/simulate-success/${activeOrder}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (r.ok) {
        router.push(`/dashboard/premium/${report!.resume_id}`);
      } else {
        setPaymentError("Simulation failed. API key or debug setting restriction.");
      }
    } catch (err: any) {
      setPaymentError("Could not connect to database simulator.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="section-container py-12 w-full flex-grow flex flex-col space-y-8 animate-pulse">
        <div className="h-12 bg-surface rounded-xl w-1/3"></div>
        <div className="h-64 bg-surface rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-80 bg-surface rounded-2xl"></div>
          <div className="h-80 bg-surface rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-4">
        <h3 className="text-xl font-display font-medium text-foreground">Oops! Loading report failed</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{error || "Report details not available."}</p>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="px-6 py-2.5 bg-accent rounded-full text-white font-semibold shadow transition hover:bg-accent/90"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Define metric nodes for visual display
  const metrics = [
    { label: lang === "id" ? "Struktur" : "Structure", score: report.resume_structure_score, explKey: "resume_structure" },
    { label: lang === "id" ? "Kata Kunci" : "Keywords", score: report.keyword_coverage_score, explKey: "keyword_coverage" },
    { label: lang === "id" ? "Kualitas Pengalaman" : "Experience", score: report.experience_quality_score, explKey: "experience_quality" },
    { label: lang === "id" ? "Kekuatan Pencapaian" : "Achievements", score: report.achievement_strength_score, explKey: "achievement_strength" },
    { label: lang === "id" ? "Relevansi Keahlian" : "Skills Relevance", score: report.skills_relevance_score, explKey: "skills_relevance" },
    { label: lang === "id" ? "Keterbacaan HR Bot / AI" : "HR Bot / AI Readability", score: report.readability_score, explKey: "readability" }
  ];

  return (
    <div className="section-container py-12 w-full flex-grow flex flex-col space-y-8 text-left">
      
      {/* Midtrans Snap Script Integration */}
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6">
        <div>
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-semibold mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("report.back")}
          </button>
          
          <div className="label-eyebrow text-accent">
            {t("report.eyebrow")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium text-foreground tracking-tight mt-1 font-display">
            {t("report.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 font-mono">
            {t("report.subtitle")}
          </p>
        </div>
        
        {/* Core Score Ring Container - Highlighted & Repositioned */}
        <div className="flex items-center gap-6 bg-surface p-5 rounded-2xl border border-accent/25 shadow-[0_8px_30px_rgb(235,94,40,0.06)] relative overflow-hidden card-3d">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <p className="label-eyebrow text-accent text-[10px] uppercase font-bold tracking-wider">{t("report.overall")}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{t("report.scorer")}</p>
          </div>
          
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-muted-foreground/10"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-accent transition-all duration-1000 ease-out"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - report.overall_score / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-xl font-bold font-display text-foreground font-sans">
              {report.overall_score}
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Impression Block */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-3 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <BookOpen className="w-24 h-24 text-foreground" />
        </div>
        <h3 className="text-lg font-display font-medium text-foreground flex items-center gap-1.5">
          <UserCheck className="w-5 h-5 text-accent" />
          {t("report.recruiter.title")}
        </h3>
        <p className="text-foreground/90 text-sm leading-relaxed max-w-4xl italic font-serif">
          "{report.recruiter_impression}"
        </p>
      </div>

      {/* Scores Breakdown Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-medium text-foreground">{t("report.categories")}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {metrics.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveModalMetric(item)}
              className="group cursor-pointer card-3d p-5 rounded-2xl bg-surface border border-border hover:border-accent hover:shadow-[0_10px_30px_rgba(235,94,40,0.06)] transition flex flex-col justify-between"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-display font-medium text-foreground text-sm">{item.label}</span>
                <span className={`px-2.5 py-0.5 rounded font-mono font-semibold text-xs ${
                  item.score >= 80 ? "bg-emerald-100 text-emerald-800" :
                  item.score >= 50 ? "bg-amber-100 text-amber-800" : "bg-accent-soft text-accent"
                }`}>
                  {item.score}/100
                </span>
              </div>
              
              <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden mb-4">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.score >= 80 ? "bg-emerald-700" :
                    item.score >= 50 ? "bg-amber-500" : "bg-accent"
                  }`} 
                  style={{ width: `${item.score}%` }}
                ></div>
              </div>
              
              <div className="border-t border-border pt-3 flex justify-between items-center text-xs text-muted-foreground font-semibold font-mono">
                <span>{lang === "id" ? "LIHAT PENJELASAN" : "VIEW EXPLANATION"}</span>
                <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        
        {/* Strengths */}
        <div className="p-6 rounded-2xl bg-surface border border-emerald-500/20 space-y-4 shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-display font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            {t("report.strengths.title")}
          </h3>
          <ul className="space-y-3">
            {report.top_strengths.map((str, idx) => (
              <li key={idx} className="flex gap-2.5 text-sm text-foreground/90 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed font-serif">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="p-6 rounded-2xl bg-surface border border-accent/20 space-y-4 shadow-sm hover:shadow-md transition">
          <h3 className="text-lg font-display font-semibold text-accent dark:text-orange-400 flex items-center gap-1.5">
            <AlertTriangle className="w-5 h-5 text-accent dark:text-orange-400" />
            {t("report.weaknesses.title")}
          </h3>
          <ul className="space-y-3">
            {report.top_weaknesses.map((weak, idx) => (
              <li key={idx} className="flex gap-2.5 text-sm text-foreground/90 items-start">
                <span className="w-5 h-5 rounded-full bg-accent-soft/50 dark:bg-orange-500/20 text-accent dark:text-orange-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed font-serif">{weak}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Missing Keywords Block */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
        <h3 className="text-lg font-display font-medium text-foreground flex items-center gap-1.5">
          <Award className="w-5 h-5 text-accent" />
          {t("report.keywords.title")}
        </h3>
        {report.missing_keywords.length === 1 && report.missing_keywords[0] === "ALL_GOOD" ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col space-y-2">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{lang === "id" ? "Semua Bagus! CV kamu sudah sepenuhnya dioptimalkan." : "All Good! Your CV is already fully optimized."}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              {lang === "id" 
                ? "Tidak ditemukan kata kunci target yang hilang. Resume kamu sangat cocok dengan persyaratan posisi dan perusahaan!"
                : "No missing keywords found. Your resume perfectly matches the target role and company requirements!"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              {t("report.keywords.desc")}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {report.missing_keywords.map((kw, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-full bg-muted/40 border border-border text-xs font-mono font-medium text-foreground">
                  + {kw}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Premium Upgrade paywall card */}
      <div className="p-8 rounded-3xl border border-accent/25 bg-surface relative overflow-hidden space-y-6 shadow-[0_20px_50px_-15px_rgba(235,94,40,0.08)]">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Sparkles className="w-32 h-32 text-accent" />
        </div>
        
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-bold uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" /> {t("report.upgrade.eyebrow")}
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-medium text-foreground">
            {t("report.upgrade.title")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl font-sans">
            {t("report.upgrade.desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80 max-w-lg font-sans border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span>{t("report.upgrade.feat1")}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span>{t("report.upgrade.feat2")}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span>{t("report.upgrade.feat3")}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span>{t("report.upgrade.feat4")}</span>
          </div>
        </div>

        {paymentError && (
          <div className="p-4 rounded-xl bg-accent-soft/30 border border-accent/20 text-accent text-xs flex items-center gap-2 max-w-md font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{paymentError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button 
            disabled
            className="px-8 py-3.5 bg-muted text-muted-foreground font-bold rounded-full border border-border cursor-not-allowed transition flex items-center gap-2 justify-center text-sm"
          >
            {lang === "id" ? "Upgrade Premium (Segera Hadir)" : "Upgrade Premium (Coming Soon)"}
          </button>
        </div>
      </div>

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {activeModalMetric && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalMetric(null)}
              className="absolute inset-0 bg-background/30 backdrop-blur-[6px]"
            />
            
            {/* Glow spotlight behind card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute w-80 h-80 rounded-full bg-accent/20 blur-3xl pointer-events-none -z-10"
            />

            {/* Modal Card Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative max-w-lg w-full bg-surface border border-accent/25 rounded-3xl p-8 shadow-2xl flex flex-col space-y-6 card-3d z-10"
            >
              <div className="space-y-1">
                <span className="label-eyebrow text-accent uppercase font-bold text-[10px] tracking-wider">
                  {lang === "id" ? "Metrik Evaluasi" : "Evaluation Metric"}
                </span>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-display font-medium text-foreground">{activeModalMetric.label}</h2>
                  <span className={`px-2.5 py-0.5 rounded font-mono font-semibold text-xs ${
                    activeModalMetric.score >= 80 ? "bg-emerald-100 text-emerald-800" :
                    activeModalMetric.score >= 50 ? "bg-amber-100 text-amber-800" : "bg-accent-soft text-accent"
                  }`}>
                    {activeModalMetric.score}/100
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    activeModalMetric.score >= 80 ? "bg-emerald-700" :
                    activeModalMetric.score >= 50 ? "bg-amber-500" : "bg-accent"
                  }`} 
                  style={{ width: `${activeModalMetric.score}%` }}
                ></div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  {lang === "id" ? "Analisis Detail & Contoh" : "Detail Analysis & Examples"}
                </h4>
                <p className="text-foreground/90 text-sm leading-relaxed font-sans bg-muted/20 p-4 rounded-xl border border-border">
                  {report.scoring_explanations[activeModalMetric.explKey] || "Explanation not generated."}
                </p>
              </div>

              <button 
                onClick={() => setActiveModalMetric(null)}
                className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-full transition shadow-[0_4px_12px_rgba(235,94,40,0.2)] text-sm"
              >
                {lang === "id" ? "Selesai" : "Done"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
