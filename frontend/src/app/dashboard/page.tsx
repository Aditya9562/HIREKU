"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Plus, FileText, ArrowRight, Eye, Calendar, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisItem {
  id: string;
  resume_id: string;
  target_position?: string;
  target_company?: string;
  overall_score: number;
  is_premium?: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();
  
  // Filtering tab state: all, mt, odp, intern, tech, professional
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const token = await getToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        
        // Sync user details on backend
        await fetch(`${apiBase}/auth/sync`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const r = await fetch(`${apiBase}/analyses/my-analyses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (r.ok) {
          const data = await r.json();
          setAnalyses(data);
        } else {
          setError("Failed to retrieve dashboard history.");
        }
      } catch (err: any) {
        setError("Network error connecting to backend API.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [getToken]);

  // Client side categorization and filtering logic
  const filteredAnalyses = analyses.filter((item) => {
    const pos = (item.target_position || "").toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "mt") {
      return pos.includes("trainee") || pos.includes("mt");
    }
    if (activeTab === "odp") {
      return pos.includes("odp") || pos.includes("bdp") || pos.includes("pps") || pos.includes("development program");
    }
    if (activeTab === "intern") {
      return pos.includes("intern") || pos.includes("magang") || pos.includes("internship");
    }
    if (activeTab === "tech") {
      return pos.includes("software") || pos.includes("engineer") || pos.includes("developer") || pos.includes("tech") || pos.includes("data") || pos.includes("programmer") || pos.includes("it");
    }
    if (activeTab === "professional") {
      // Exclude ODP, MT, Intern, and Tech
      const isSpecial = pos.includes("trainee") || pos.includes("mt") || pos.includes("odp") || pos.includes("bdp") || pos.includes("pps") || pos.includes("development program") || pos.includes("intern") || pos.includes("magang") || pos.includes("internship") || pos.includes("software") || pos.includes("engineer") || pos.includes("developer") || pos.includes("tech") || pos.includes("data") || pos.includes("programmer") || pos.includes("it");
      return !isSpecial;
    }
    return true;
  });

  return (
    <div className="section-container py-12 w-full flex-grow flex flex-col space-y-8 text-left">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium text-foreground tracking-tight font-display">
            {t("dash.welcome")}, <span className="font-serif-italic">{user?.firstName || "Job Seeker"}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 font-sans">
            {t("dash.subtitle")}
          </p>
        </div>
        <Link 
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-foreground/90 shadow hover:shadow-md"
        >
          <Plus className="w-4 h-4" /> {t("dash.btn.analyze")}
        </Link>
      </div>

      {/* History Tabs / Filters */}
      {analyses.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border pb-4 select-none">
          {[
            { id: "all", label: t("dash.filter.all") },
            { id: "mt", label: t("dash.filter.mt") },
            { id: "odp", label: t("dash.filter.odp") },
            { id: "intern", label: t("dash.filter.intern") },
            { id: "tech", label: t("dash.filter.tech") },
            { id: "professional", label: t("dash.filter.professional") }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${
                activeTab === tab.id 
                  ? "bg-accent border-accent text-white" 
                  : "bg-surface border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-surface/50 border border-border animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-accent-soft/30 border border-accent/20 text-foreground text-sm text-center">
          {error}
        </div>
      ) : analyses.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-border-strong rounded-2xl bg-surface/30 space-y-6">
          <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center text-accent">
            <FileText className="w-8 h-8" />
          </div>
          <div className="text-center max-w-sm space-y-2">
            <h3 className="text-xl font-display font-medium text-foreground">{t("dash.history.empty.title")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("dash.history.empty.desc")}
            </p>
          </div>
          <Link 
            href="/dashboard/new"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 shadow-[0_4px_12px_rgba(235,94,40,0.15)]"
          >
            {t("dash.history.empty.btn")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No CV records match this role category filter.
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredAnalyses.map((analysis) => {
              const dateStr = new Date(analysis.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              });
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={analysis.id}
                  className="card-3d p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between h-48 shadow-[0_10px_30px_rgba(0,0,0,0.01)]"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="label-eyebrow text-accent">
                        {t("dash.status.complete")}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr}
                      </span>
                    </div>
                    <h4 className="font-display font-medium text-foreground text-xl mt-3 truncate">
                      {analysis.target_position || "General Assessment"}
                    </h4>
                    <p className="text-xs text-muted-foreground font-sans truncate mt-0.5">
                      Target: {analysis.target_company || "Standard Evaluation"}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                    <div className="flex items-baseline gap-0.5 font-sans">
                      <span className="text-3xl font-bold text-foreground">
                        {analysis.overall_score}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">/100</span>
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        href={`/dashboard/report/${analysis.id}`}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-border-strong bg-transparent text-xs font-semibold text-foreground hover:bg-muted transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" /> {t("dash.btn.report")}
                      </Link>
                      
                      {analysis.is_premium ? (
                        <Link 
                          href={`/dashboard/premium/${analysis.resume_id}`}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t("dash.btn.premium")}
                        </Link>
                      ) : (
                        <Link 
                          href={`/dashboard/report/${analysis.id}`}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-accent/10 border border-accent/25 text-xs font-bold text-accent hover:bg-accent/20 transition"
                        >
                          <Lock className="w-3.5 h-3.5" /> {t("dash.btn.unlock")}
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
      
    </div>
  );
}
