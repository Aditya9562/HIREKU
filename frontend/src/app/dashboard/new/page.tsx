"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, ArrowRight, AlertCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { getApiUrl } from "@/lib/api";

export default function NewAnalysis() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  
  // Step manager
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  
  // Job Target States
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState("");

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError("");
      setStep(2); // Auto proceed
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const triggerUploadAndAnalysis = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    
    try {
      const token = await getToken();
      const apiBase = getApiUrl();

      // Stage 1: Uploading
      setLoadingStage("Uploading resume to secure storage...");
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadResponse = await fetch(`${apiBase}/resumes/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json();
        throw new Error(errData.detail || "Failed to upload resume.");
      }
      
      const resumeData = await uploadResponse.json();
      const resumeId = resumeData.id;
      
      // Stage 2: Processing scoring
      setLoadingStage("Parsing structural nodes & calculating scores...");
      
      const targetPayload = {
        target_position: position || "General Professional",
        target_company: company || "Target Employer",
        job_description: jd || ""
      };
      
      // Stage 3: Querying AI
      setLoadingStage("Sending preprocessed summary to AI engine...");
      
      const analyzeResponse = await fetch(`${apiBase}/analyses/analyze/${resumeId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(targetPayload)
      });
      
      if (!analyzeResponse.ok) {
        const errData = await analyzeResponse.json();
        throw new Error(errData.detail || "Failed to analyze resume.");
      }
      
      const analysisData = await analyzeResponse.json();
      
      setLoadingStage("Compiling recruiter feedback report...");
      setTimeout(() => {
        router.push(`/dashboard/report/${analysisData.id}`);
      }, 800);
      
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="section-container py-12 w-full flex-grow flex flex-col justify-center max-w-4xl">
      
      {/* Step Indicators */}
      {!loading && (
        <div className="flex items-center justify-center gap-4 mb-12 select-none">
          <div className={`flex items-center gap-2 text-sm font-semibold transition-colors ${step >= 1 ? "text-accent" : "text-muted-foreground"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono border transition-all ${step >= 1 ? "border-accent bg-accent-soft text-accent" : "border-border text-muted-foreground"}`}>
              1
            </span>
            {t("new.step1")}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 text-sm font-semibold transition-colors ${step >= 2 ? "text-accent" : "text-muted-foreground"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono border transition-all ${step >= 2 ? "border-accent bg-accent-soft text-accent" : "border-border text-muted-foreground"}`}>
              2
            </span>
            {t("new.step2")}
          </div>
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          // Beautiful editorial loading state
          <motion.div 
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface border border-border rounded-3xl p-12 text-center space-y-8 relative overflow-hidden shadow-[0_30px_60px_-20px_rgba(20,15,8,0.1)] max-w-3xl mx-auto w-full card-3d"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-muted/40 overflow-hidden">
              <div className="bg-accent h-full w-[80%] rounded-r-full animate-pulse"></div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-accent-soft"></div>
                <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-display font-medium text-foreground">{t("new.loading.title")}</h3>
              <p className="text-muted-foreground text-sm font-mono animate-pulse">{loadingStage}</p>
            </div>
          </motion.div>
        ) : error ? (
          // Error state
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface border border-accent/20 rounded-3xl p-8 text-center space-y-6 shadow-[0_20px_50px_-20px_rgba(20,15,8,0.05)] max-w-2xl mx-auto w-full card-3d"
          >
            <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center text-accent mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-medium text-foreground">Processing Failed</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={() => { setError(""); setStep(1); setFile(null); }}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent/90 rounded-full transition shadow-[0_4px_12px_rgba(235,94,40,0.2)]"
            >
              Try Again
            </button>
          </motion.div>
        ) : step === 1 ? (
          // Step 1: Upload file
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="bg-surface border border-border rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.03)] max-w-3xl mx-auto w-full card-3d"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-medium text-foreground">{t("new.title")}</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">{t("new.subtitle")}</p>
            </div>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${isDragActive ? "border-accent bg-accent-soft" : "border-border-strong bg-muted/10 hover:border-foreground/30 hover:bg-muted/20"}`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center border border-border text-muted-foreground shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Drag & drop files here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse local files</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" /> PDF, DOCX (Max 5MB)
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Step 2: Target Settings
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-surface border border-border rounded-3xl p-8 md:p-12 text-left space-y-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.03)] w-full card-3d"
          >
            <div className="space-y-2 border-b border-border pb-4">
              <h2 className="text-3xl font-display font-medium text-foreground">{t("new.target.title")}</h2>
              <p className="text-muted-foreground text-sm">{t("new.target.subtitle")}</p>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-eyebrow text-muted-foreground">{t("new.target.position")}</label>
                  <input 
                    type="text" 
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder={t("new.target.position.placeholder")}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/20 border border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-background outline-none transition text-sm font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="label-eyebrow text-muted-foreground">{t("new.target.company")}</label>
                  <input 
                    type="text" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder={t("new.target.company.placeholder")}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/20 border border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-background outline-none transition text-sm font-medium"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="label-eyebrow text-muted-foreground">{t("new.target.jd")}</label>
                <textarea 
                  rows={6}
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder={t("new.target.jd.placeholder")}
                  className="w-full px-4 py-3 rounded-xl bg-muted/20 border border-border text-foreground placeholder:text-muted-foreground focus:border-accent focus:bg-background outline-none resize-none transition text-sm leading-relaxed"
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 border-t border-border">
              <button 
                onClick={() => { setStep(1); setFile(null); }}
                className="px-6 py-3 border border-border-strong hover:bg-muted rounded-full text-foreground font-semibold transition text-sm"
              >
                {t("new.btn.back")}
              </button>
              <button 
                onClick={triggerUploadAndAnalysis}
                className="px-6 py-3 bg-accent hover:bg-accent/90 rounded-full text-white font-semibold transition text-sm shadow-[0_4px_12px_rgba(235,94,40,0.2)] flex items-center gap-2 flex-grow justify-center"
              >
                {t("new.btn.start")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
