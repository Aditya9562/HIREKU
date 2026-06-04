"use client";

import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star, UploadCloud, ChevronDown, Zap, Shield, Target, Sparkles } from "lucide-react";
import { useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0, delayChildren: 0.05 } }
};

// ─── Feature icons ───────────────────────────────────────────────────────────
const featureIcons = [Zap, Target, Sparkles, Shield];

// ─── Company logos via Clearbit (grayscale, sized up) ───────────────────────
const companyLogos = [
  { name: "Telkom", src: "https://cdn.brandfetch.io/telkom.co.id" },
  { name: "Gojek", src: "https://cdn.brandfetch.io/gojek.com" },
  { name: "Tokopedia", src: "https://cdn.brandfetch.io/tokopedia.com" },
  { name: "Shopee", src: "https://cdn.brandfetch.io/shopee.co.id" },
  { name: "Bank Mandiri", src: "https://cdn.brandfetch.io/bankmandiri.co.id" },
  { name: "BCA", src: "https://cdn.brandfetch.io/bca.co.id" },
  { name: "Unilever", src: "https://cdn.brandfetch.io/unilever.com" },
  { name: "Google", src: "https://cdn.brandfetch.io/google.com" },
  { name: "Philip Morris", src: "https://cdn.brandfetch.io/pmi.com" },
  { name: "SLB", src: "https://cdn.brandfetch.io/slb.com" },
  { name: "Pertamina", src: "https://cdn.brandfetch.io/pertamina.com" },
  { name: "BRI", src: "https://cdn.brandfetch.io/bri.co.id" },
  { name: "Grab", src: "https://cdn.brandfetch.io/grab.com" },
  { name: "Lazada", src: "https://cdn.brandfetch.io/lazada.co.id" },
  { name: "Astra", src: "https://cdn.brandfetch.io/astra.co.id" },
];

// ─── Sparkle positions (relative to "dream" word, in px) ─────────────────────
const SPARKLES = [
  { sx: "-52px", sy: "-28px", color: "#eb5e28", size: 8, delay: "0ms" },
  { sx: "50px", sy: "-32px", color: "#f4a261", size: 6, delay: "40ms" },
  { sx: "-38px", sy: "32px", color: "#eb5e28", size: 7, delay: "20ms" },
  { sx: "42px", sy: "30px", color: "#fbbf24", size: 5, delay: "60ms" },
  { sx: "0px", sy: "-48px", color: "#f4a261", size: 5, delay: "10ms" },
  { sx: "60px", sy: "-4px", color: "#eb5e28", size: 4, delay: "50ms" },
  { sx: "-60px", sy: "6px", color: "#fbbf24", size: 6, delay: "30ms" },
  { sx: "20px", sy: "44px", color: "#eb5e28", size: 4, delay: "70ms" },
  { sx: "-22px", sy: "-42px", color: "#fbbf24", size: 3, delay: "15ms" },
  { sx: "-8px", sy: "50px", color: "#f4a261", size: 3, delay: "55ms" },
];

// ─── Step Card Mini-Animations ───────────────────────────────────────────────
function UploadAnim({ active }: { active: boolean }) {
  return (
    <div className="relative w-full h-16 flex flex-col items-center justify-end overflow-hidden">
      {/* Dropzone box */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-14 h-10 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors duration-300 ${active ? "card-anim-zone" : "border-muted-foreground/20"}`}>
        <svg viewBox="0 0 20 14" className={`w-4 h-4 transition-opacity duration-300 ${active ? "opacity-100 text-accent" : "opacity-20 text-muted-foreground"}`} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10 1 L10 9M7 4 L10 1 L13 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 10 Q3 13 6 13 L14 13 Q17 13 17 10" strokeLinecap="round" />
        </svg>
      </div>
      {/* File icon */}
      <div className={`w-9 h-11 bg-surface border border-border-strong rounded-md flex flex-col items-center justify-center gap-1 shadow-sm mb-0 ${active ? "card-anim-file" : ""}`}>
        <div className="w-5 h-0.5 bg-muted-foreground/30 rounded" />
        <div className="w-5 h-0.5 bg-muted-foreground/30 rounded" />
        <div className="text-[7px] font-mono text-muted-foreground font-bold">.pdf</div>
      </div>
    </div>
  );
}

function DecodeAnim({ active }: { active: boolean }) {
  const bars = [
    { w: "78%", label: "ATS Match", delay: "0ms" },
    { w: "62%", label: "Keywords", delay: "100ms" },
    { w: "91%", label: "Structure", delay: "200ms" },
  ];
  return (
    <div className="w-full space-y-2 mt-auto">
      {bars.map((b, i) => (
        <div key={i} className="space-y-0.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono text-muted-foreground">{b.label}</span>
            <span className="text-[9px] font-mono text-accent">{b.w}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: active ? b.w : "0%", transitionDelay: active ? b.delay : "0ms" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function OptimizeAnim({ active }: { active: boolean }) {
  return (
    <div className="w-full mt-auto space-y-2">
      <div className="flex items-start gap-2">
        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
        <p className="text-[9px] text-muted-foreground leading-tight line-through opacity-60">Led team projects effectively</p>
      </div>
      <div className={`flex items-start gap-2 ${active ? "opacity-100" : "opacity-0"} transition-opacity duration-500`} style={{ transitionDelay: active ? "200ms" : "0ms" }}>
        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <p className="text-[9px] text-accent leading-tight">
          Led 14-person team, cutting deployment time by 40%
          {active && <span className="card-anim-cursor inline-block w-0.5 h-2.5 bg-accent ml-0.5 align-middle" />}
        </p>
      </div>
    </div>
  );
}

function LandOffersAnim({ active }: { active: boolean }) {
  const dots = [
    { color: "#eb5e28", left: "25%", delay: "0ms" },
    { color: "#fbbf24", left: "45%", delay: "80ms" },
    { color: "#f4a261", left: "65%", delay: "40ms" },
    { color: "#eb5e28", left: "35%", delay: "120ms" },
    { color: "#fbbf24", left: "55%", delay: "160ms" },
  ];
  return (
    <div className="w-full mt-auto flex flex-col items-center gap-2 relative">
      {/* Confetti dots */}
      {active && dots.map((d, i) => (
        <span
          key={i}
          className="card-anim-confetti absolute top-0 w-2 h-2 rounded-sm"
          style={{ backgroundColor: d.color, left: d.left, animationDelay: d.delay }}
        />
      ))}
      {/* Check */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${active ? "bg-accent/10 border-2 border-accent card-anim-check" : "bg-muted/40 border-2 border-border"}`}>
        <svg viewBox="0 0 20 20" className={`w-6 h-6 transition-colors duration-300 ${active ? "text-accent" : "text-muted-foreground/30"}`} fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 10 L8 14 L16 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className={`text-[10px] font-semibold font-mono transition-all duration-300 ${active ? "text-accent" : "text-muted-foreground/30"}`}>
        {active ? "Offer Received!" : "...waiting"}
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Home() {
  const { isSignedIn } = useUser();
  const { t, lang } = useTranslation();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [sparkleKey, setSparkleKey] = useState(0);
  const [dreamHovered, setDreamHovered] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const handleDreamEnter = useCallback(() => {
    setDreamHovered(true);
    setSparkleKey(k => k + 1);
  }, []);
  const handleDreamLeave = useCallback(() => setDreamHovered(false), []);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); window.location.href = "/dashboard/new"; };

  const stepList = [
    {
      n: "01",
      title: lang === "id" ? "Unggah" : "Upload",
      body: lang === "id"
        ? "PDF atau DOCX. Terenkripsi penuh. Otomatis dihapus dalam 24 jam."
        : "Drop your PDF or DOCX. Fully encrypted and auto-deleted after processing.",
      Anim: UploadAnim,
    },
    {
      n: "02",
      title: lang === "id" ? "Pindai" : "Decode",
      body: lang === "id"
        ? "Gemini Flash memindai CV Anda seperti ATS sungguhan. Skor instan dalam 60 detik."
        : "Gemini Flash scans your CV like a real ATS scanner — scores appear in under 60s.",
      Anim: DecodeAnim,
    },
    {
      n: "03",
      title: lang === "id" ? "Optimalkan" : "Optimize",
      body: lang === "id"
        ? "Claude 3.5 Sonnet menulis ulang bullet Anda dengan formula XYZ dan merekomendasikan peran terbaik."
        : "Claude 3.5 Sonnet rewrites your bullets with Google XYZ formulas and recommends top roles.",
      Anim: OptimizeAnim,
    },
    {
      n: "04",
      title: lang === "id" ? "Raih Tawaran" : "Land Offers",
      body: lang === "id"
        ? "Lamar dengan surat lamaran khusus dan 10 draf wawancara STAR terarah."
        : "Apply with a tailored cover letter and 10 targeted STAR interview prep questions.",
      Anim: LandOffersAnim,
    },
  ];

  const featuresList = [
    {
      title: lang === "id" ? "Evaluasi Instan" : "Instant Evaluation",
      desc: lang === "id"
        ? "Laporan audit mendalam dalam waktu kurang dari 60 detik."
        : "Get a high-fidelity audit report in under 60 seconds from upload to score."
    },
    {
      title: lang === "id" ? "Pemindaian ATS Akurat" : "Precision ATS Scan",
      desc: lang === "id"
        ? "Deteksi kata kunci menggunakan kamus multi-domain yang cerdas."
        : "Detect ATS keyword gaps using multi-domain intelligent dictionary logic."
    },
    {
      title: lang === "id" ? "Tulis Ulang Rekruter" : "Expert Rewriting",
      desc: lang === "id"
        ? "Tulis ulang bullet CV menggunakan formula dampak Google XYZ."
        : "Tailored bullet rewrites using the Google XYZ impact metric formula."
    },
    {
      title: lang === "id" ? "Persiapan Wawancara" : "Interview Ready",
      desc: lang === "id"
        ? "10 draf Q&A STAR khusus yang disesuaikan dengan profil Anda."
        : "10 customized behavioral STAR Q&As built from your unique resume data."
    }
  ];

  const faqsList = [
    {
      q: lang === "id" ? "Apakah data CV saya aman?" : "Is my CV data safe?",
      a: lang === "id"
        ? "Ya. CV Anda dienkripsi penuh, hanya digunakan untuk analisis Anda, dan dihapus otomatis dalam 24 jam."
        : "Yes. Files are fully encrypted, processed privately, and permanently deleted within 24 hours. We never train on your data."
    },
    {
      q: lang === "id" ? "Bagaimana dengan CV hasil scan?" : "What about scanned image CVs?",
      a: lang === "id"
        ? "Sistem kami mendeteksi CV hasil scan secara otomatis dan menjalankan Gemini Vision OCR untuk mengekstrak isi teks dengan akurasi tinggi."
        : "Our parser automatically detects scanned PDFs and runs high-fidelity Gemini Vision OCR to extract all text content accurately."
    },
    {
      q: lang === "id" ? "Apa yang membedakan Hireku?" : "What makes Hireku different?",
      a: lang === "id"
        ? "Fokus pada kesederhanaan ekstrim, harga sangat terjangkau (Rp19.900), dan menggunakan model terbaik seperti Claude 3.5 Sonnet untuk hasil nyata."
        : "We combine extreme simplicity, affordable premium pricing (Rp19.900), and state-of-the-art models like Claude 3.5 Sonnet for real, measurable results."
    },
    {
      q: lang === "id" ? "Berapa lama proses analisisnya?" : "How long does analysis take?",
      a: lang === "id"
        ? "Analisis dasar selesai dalam waktu kurang dari 60 detik. Analisis premium dengan Claude biasanya memakan waktu 90–120 detik."
        : "Free analysis completes in under 60 seconds. Premium analysis with Claude Sonnet typically takes 90–120 seconds."
    }
  ];

  return (
    <div className="w-full flex flex-col text-foreground bg-background">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative overflow-hidden pt-10 pb-20 md:pt-14 md:pb-28 section-border-bottom"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="section-container relative z-10"
        >
          {/* Eyebrow row — tight to top */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between pb-6 border-b border-border"
          >
            <span className="label-eyebrow">{t("hero.eyebrow")}</span>
            <span className="label-eyebrow hidden sm:block">{t("hero.locations")}</span>
          </motion.div>

          {/* Hero grid */}
          <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">

            {/* Left — headline + CTAs */}
            <motion.div variants={stagger} className="flex flex-col space-y-8">
              <motion.div variants={fadeUp} className="space-y-5">
                <h1 className="font-display text-[50px] font-medium leading-[1.04] tracking-tight sm:text-[64px] lg:text-[72px] text-foreground">
                  {lang === "id" ? (
                    <>
                      Raih{" "}
                      <span
                        className="relative inline-block cursor-default"
                        onMouseEnter={handleDreamEnter}
                        onMouseLeave={handleDreamLeave}
                      >
                        <span className="font-serif-italic whitespace-nowrap">pekerjaan impian,</span>
                        {/* Sparkle fireworks */}
                        <AnimatePresence>
                          {dreamHovered && SPARKLES.map((s, i) => (
                            <motion.span
                              key={`${sparkleKey}-${i}`}
                              className="sparkle-particle"
                              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                              animate={{ x: s.sx, y: s.sy, scale: 0, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: parseFloat(s.delay) / 1000 }}
                              style={{
                                left: "50%", top: "50%",
                                width: s.size, height: s.size,
                                backgroundColor: s.color,
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </span>
                      <br />
                      dengan CV yang{" "}
                      <span className="font-serif-italic text-accent">berhasil.</span>
                    </>
                  ) : (
                    <>
                      Land your{" "}
                      <span
                        className="relative inline-block cursor-default"
                        onMouseEnter={handleDreamEnter}
                        onMouseLeave={handleDreamLeave}
                      >
                        <span className="font-serif-italic whitespace-nowrap">dream job,</span>
                        {/* Sparkle fireworks */}
                        <AnimatePresence>
                          {dreamHovered && SPARKLES.map((s, i) => (
                            <motion.span
                              key={`${sparkleKey}-${i}`}
                              className="sparkle-particle"
                              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                              animate={{ x: s.sx, y: s.sy, scale: 0, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: parseFloat(s.delay) / 1000 }}
                              style={{
                                left: "50%", top: "50%",
                                width: s.size, height: s.size,
                                backgroundColor: s.color,
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </span>
                      <br />
                      with a CV that{" "}
                      <span className="font-serif-italic text-accent">works.</span>
                    </>
                  )}
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg">
                  {t("hero.desc")}
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
                {isSignedIn ? (
                  <Link href="/dashboard/new" className="btn-accent text-sm">
                    {t("nav.analyze")} <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <SignInButton mode="modal">
                    <button className="btn-accent text-sm">
                      {lang === "id" ? "Mulai Gratis" : "Start Free"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </SignInButton>
                )}
                <Link href="#how" className="btn-ghost text-sm">
                  {lang === "id" ? "Lihat Cara Kerja" : "How it works"}
                </Link>
              </motion.div>

              {/* Trust */}
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map(i => <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />)}
                  </div>
                  <span className="text-sm font-semibold text-foreground">4.9/5</span>
                  <span className="text-xs text-muted-foreground">· {t("hero.rating")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono">Encrypted &amp; Private</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — upload widget */}
            <motion.div variants={fadeUp}>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => window.location.href = "/dashboard/new"}
                className="card-3d cursor-pointer rounded-2xl border border-dashed border-border-strong bg-surface overflow-hidden shadow-[0_24px_60px_-12px_hsl(var(--foreground)/0.06)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] relative group"
              >
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
                  <span className="label-eyebrow-accent">Free CV Analyze</span>
                  <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Scanner Active
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center py-14 px-8 space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center text-accent group-hover:scale-105 group-hover:shadow-[0_8px_24px_rgba(235,94,40,0.2)] transition-all duration-500">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-display text-xl font-medium text-foreground">{t("hero.dropzone.title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("hero.dropzone.desc")}</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border text-[11px] text-muted-foreground font-mono tracking-wide">
                    {t("hero.dropzone.format")}
                  </div>
                </div>
                <div className="px-6 pb-5 flex items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-border pt-4">
                  <span>ATS · new advanced claude sonnet 4.5</span>
                  <span>SECURE &amp; ENCRYPTED</span>
                </div>
              </div>

              {/* Stat cards — 24hr replaced */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { val: "60s", label: lang === "id" ? "Waktu Analisis" : "Analysis Time" },
                  { val: "Rp0", label: lang === "id" ? "Biaya Dasar" : "Base Cost" },
                  { val: "10×", label: lang === "id" ? "Lebih Banyak Wawancara" : "More Interviews" },
                ].map((stat, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-3.5 text-center">
                    <div className="font-display text-xl font-medium text-foreground">{stat.val}</div>
                    <div className="label-eyebrow mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── SOCIAL PROOF MARQUEE ─────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8 }}
        className="pt-10 pb-20 section-border-bottom bg-surface overflow-hidden"
      >
        <div className="section-container mb-10">
          <p className="label-eyebrow text-center tracking-[0.18em] !text-lg">{t("hero.trusted")}</p>
        </div>
        <div className="marquee-track relative overflow-hidden w-full flex items-center">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 sm:w-56 bg-gradient-to-r from-surface to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 sm:w-56 bg-gradient-to-l from-surface to-transparent" />
          <div className="animate-marquee flex items-center gap-10 px-6">
            {[...companyLogos, ...companyLogos].map((logo, i) => (
              <div key={i} className="shrink-0 flex items-center justify-center">
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="marquee-logo"
                  draggable="false"
                  onError={(e) => {
                    // Fallback to text if logo fails to load
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = "none";
                    const span = document.createElement("span");
                    span.textContent = logo.name;
                    span.className = "text-sm font-bold font-mono text-muted-foreground/50 tracking-wider uppercase";
                    el.parentElement?.appendChild(span);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── HOW IT WORKS — Interactive Step Cards ────────────────────────── */}
      <section id="how" className="py-24 md:py-32 section-border-bottom bg-background">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="section-container"
        >
          <motion.div variants={fadeUp} className="grid lg:grid-cols-12 gap-8 items-end mb-16">
            <div className="lg:col-span-7 space-y-4">
              <span className="label-eyebrow">{t("hero.method.title")}</span>
              <h2 className="font-display text-4xl font-medium leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {lang === "id" ? (
                  <>Langkah mudah <span className="font-serif-italic">menuju tawaran kerja.</span></>
                ) : (
                  <>A four-step path <span className="font-serif-italic">to the offer.</span></>
                )}
              </h2>
            </div>
            <p className="lg:col-span-5 text-muted-foreground text-base leading-relaxed">
              {t("hero.method.desc")}
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stepList.map((s, i) => {
              const isActive = hoveredStep === i;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`group relative p-6 rounded-2xl border flex flex-col transition-all duration-400 cursor-pointer min-h-[260px] ${isActive
                    ? "bg-surface border-accent/30 shadow-[0_12px_32px_-8px_hsl(var(--accent)/0.15)]"
                    : "bg-surface border-border hover:border-border-strong"
                    }`}
                  style={{ transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease" }}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                  whileHover={{ y: -4 }}
                >
                  {/* Step number */}
                  <div className={`font-display text-[68px] font-bold leading-none transition-colors duration-500 ${isActive ? "text-accent/20" : "text-foreground/5"}`}>
                    {s.n}
                  </div>

                  {/* Mini interaction animation — fills middle space */}
                  <div className="flex-grow flex items-end py-3">
                    <s.Anim active={isActive} />
                  </div>

                  {/* Label */}
                  <div className="border-t border-border pt-4 mt-2">
                    <h3 className={`font-display text-lg font-medium transition-colors duration-300 ${isActive ? "text-accent" : "text-foreground"}`}>
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>

                  {/* Hover hint */}
                  {!isActive && (
                    <p className="absolute bottom-3 right-4 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      hover to preview
                    </p>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 section-border-bottom bg-surface">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="section-container"
        >
          <motion.div variants={fadeUp} className="grid lg:grid-cols-12 gap-8 items-end mb-16">
            <div className="lg:col-span-7 space-y-4">
              <span className="label-eyebrow">{t("hero.features.title")}</span>
              <h2 className="font-display text-4xl font-medium leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {lang === "id" ? (
                  <>Analisis rekruter senior, <span className="font-serif-italic">dalam hitungan detik.</span></>
                ) : (
                  <>Recruiter-grade analysis, <span className="font-serif-italic">in under a minute.</span></>
                )}
              </h2>
            </div>
            <p className="lg:col-span-5 text-muted-foreground text-base leading-relaxed">
              {t("hero.features.desc")}
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuresList.map((f, i) => {
              const Icon = featureIcons[i];
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="card-lift p-6 rounded-2xl bg-background border border-border flex flex-col gap-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center text-accent">
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-lg font-medium text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 md:py-32 section-border-bottom bg-background">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="section-container"
        >
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <motion.div variants={fadeUp} className="lg:col-span-4 space-y-5">
              <span className="label-eyebrow">{t("hero.faq.title")}</span>
              <h2 className="font-display text-4xl font-medium leading-[1.06] tracking-tight text-foreground sm:text-5xl">
                {lang === "id"
                  ? <><span className="font-serif-italic">Pertanyaan</span> umum.</>
                  : <>Have any <span className="font-serif-italic">questions?</span></>
                }
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">{t("hero.faq.desc")}</p>
            </motion.div>

            <motion.div variants={stagger} className="lg:col-span-8 space-y-3 select-none">
              {faqsList.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <motion.div
                    key={idx}
                    variants={fadeUp}
                    className={`rounded-xl border bg-surface overflow-hidden cursor-pointer transition-colors duration-200 ${isOpen ? "border-border-strong" : "border-border hover:border-border-strong"}`}
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                  >
                    <div className="flex justify-between items-center px-6 py-5">
                      <h4 className="font-display text-base font-medium text-foreground pr-4">{faq.q}</h4>
                      <span className={`text-muted-foreground shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-surface overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[800px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="section-container relative z-10 text-center space-y-8"
        >
          <div className="space-y-4 max-w-3xl mx-auto">
            <span className="label-eyebrow">{lang === "id" ? "Mulai Sekarang" : "Get Started"}</span>
            <h2 className="font-display text-4xl font-medium leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {lang === "id"
                ? <><span className="font-serif-italic">CV Anda</span> layak lebih baik dari ini.</>
                : <>Your CV deserves <span className="font-serif-italic text-accent">better.</span></>
              }
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              {lang === "id"
                ? "Unggah CV Anda sekarang dan dapatkan analisis mendalam secara gratis dalam 60 detik."
                : "Upload your CV now and get a detailed free audit in under 60 seconds."
              }
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {isSignedIn ? (
              <Link href="/dashboard/new" className="btn-accent text-sm px-8 py-3.5">
                {lang === "id" ? "Analisis CV Saya" : "Analyze My CV"} <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-accent text-sm px-8 py-3.5">
                  {lang === "id" ? "Mulai Gratis — Sekarang" : "Start Free — Right Now"} <ArrowRight className="w-4 h-4" />
                </button>
              </SignInButton>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono tracking-wide">
            {lang === "id" ? "Tidak perlu kartu kredit. Analisis dasar gratis selamanya." : "No credit card required. Free analysis, always."}
          </p>
        </motion.div>
      </section>

    </div>
  );
}
