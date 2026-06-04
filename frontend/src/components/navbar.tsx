"use client";

import Link from "next/link";
import { useUser, UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, ShieldCheck, UploadCloud, User as UserIcon, Sun, Moon, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { getApiUrl } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const { getToken } = useAuth();
  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    if (isSignedIn) {
      const loadProfile = async () => {
        try {
          const token = await getToken();
          const apiBase = getApiUrl();
          const res = await fetch(`${apiBase}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDbUser(data);
          }
        } catch (e) {}
      };
      loadProfile();
    } else {
      setDbUser(null);
    }
  }, [isSignedIn, getToken]);

  const superAdminEmails = [
    "adityaputra.afendi@gmail.com",
    "adityaafendi02@gmail.com",
    "adityaafendi22@gmail.com"
  ];
  const isSuperAdmin = isSignedIn && superAdminEmails.includes(user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "");
  const isAdmin = isSuperAdmin || dbUser?.is_admin;

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Theme persistence
  useEffect(() => {
    const isDark =
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Scroll-spy
  useEffect(() => {
    if (pathname !== "/") return;
    const ids = ["hero", "how", "features", "faq"];
    const observers = ids
      .map((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const obs = new IntersectionObserver(
          ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
          { threshold: 0.2, rootMargin: "-15% 0px -65% 0px" }
        );
        obs.observe(el);
        return { obs, el };
      })
      .filter(Boolean) as { obs: IntersectionObserver; el: Element }[];
    return () => observers.forEach(({ obs, el }) => obs.unobserve(el));
  }, [pathname]);

  const isLanding = pathname === "/";

  const landingLinks = [
    { href: isLanding ? "#how" : "/#how", label: t("nav.method"), id: "how" },
    { href: isLanding ? "#features" : "/#features", label: t("nav.features"), id: "features" },
    { href: isLanding ? "#faq" : "/#faq", label: t("nav.faq"), id: "faq" },
  ];

  const dashLinks = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/new", label: t("nav.analyze"), icon: UploadCloud },
  ];

  const navLinks = isSignedIn
    ? dashLinks.map(l => ({ href: l.href, label: l.label, id: "" }))
    : landingLinks;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 h-16 z-50 flex items-center transition-all duration-300 ${
          scrolled ? "glass-nav shadow-sm" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="section-container w-full flex items-center justify-between">

          {/* Brand */}
          <Link
            href="/"
            className="font-display text-xl font-medium tracking-tight text-foreground lowercase hover:text-accent transition-colors"
          >
            hireku<span className="text-accent font-black">.</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {isSignedIn
              ? dashLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors relative py-1 ${
                      pathname === href ? "text-accent" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    {pathname === href && (
                      <span className="absolute -bottom-0.5 inset-x-0 h-[2px] bg-accent rounded-full" />
                    )}
                  </Link>
                ))
              : landingLinks.map(({ href, label, id }) => (
                  <Link
                    key={id}
                    href={href}
                    className={`text-sm font-medium transition-colors relative py-1 ${
                      activeSection === id && isLanding
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                    {activeSection === id && isLanding && (
                      <span className="absolute -bottom-0.5 inset-x-0 h-[2px] bg-accent rounded-full" />
                    )}
                  </Link>
                ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-[11px] font-mono font-semibold tracking-wider text-accent border border-accent/25 px-2.5 py-1 rounded-full bg-accent/5 uppercase hover:bg-accent/12 transition-all flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" /> Admin
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleDark}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode
                ? <Sun className="w-4 h-4 text-amber-500" />
                : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth */}
            {!isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-muted/40 animate-pulse" />
            ) : isSignedIn ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden lg:block text-right">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{t("nav.scannedAs")}</p>
                  <p className="text-[11px] font-semibold text-foreground truncate max-w-[130px]">
                    {user?.firstName || user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <UserButton afterSignOutUrl="/">
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label={t("nav.profile")}
                      labelIcon={<UserIcon className="w-4 h-4 text-accent" />}
                      href="/dashboard/profile"
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="btn-primary text-[13px] px-5 py-2">
                  {t("nav.login")}
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </button>
              </SignInButton>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              aria-label="Open menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-0 z-40 glass-nav border-b border-border shadow-lg md:hidden py-4"
          >
            <nav className="section-container flex flex-col gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
