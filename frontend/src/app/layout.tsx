import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Hireku | Land Your Dream Job, Faster.",
  description: "Upload your CV and discover exactly why you're getting filtered out before recruiters ever see it. Optimize your resume with AI score check and premium Claude rewrites.",
  keywords: ["CV analysis", "ATS compatibility", "hiring readiness score", "CV audit", "job application tracker"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased min-h-screen flex flex-col bg-background text-foreground selection:bg-accent-soft selection:text-foreground">
          {/* Subtle background grid */}
          <div className="fixed inset-0 bg-grid-dots pointer-events-none z-0 opacity-60" />

          {/* Ambient orbs — soft, below navbar level */}
          <div className="fixed pointer-events-none z-0">
            <div className="bg-orb animate-float-1 absolute top-[15vh] left-[-10vw] w-[min(60vw,600px)] h-[min(60vw,600px)] bg-[hsl(var(--accent)/0.08)] blur-[140px] rounded-full" />
            <div className="bg-orb animate-float-2 absolute bottom-[-15vh] right-[-12vw] w-[min(70vw,700px)] h-[min(70vw,700px)] bg-[hsl(40,80%,65%,0.06)] blur-[150px] rounded-full" />
          </div>

          <Navbar />

          <main className="relative z-1 w-full flex-grow flex flex-col mt-5">
            {children}
          </main>

          {/* Footer */}
          <footer className="relative z-10 w-full border-t border-border bg-background">
            <div className="section-container py-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1.5">
                  <Link href="/" className="font-display text-xl font-medium tracking-tight text-foreground lowercase inline-block">
                    hireku<span className="text-accent font-black">.</span>
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono">
                    © {new Date().getFullYear()} Hireku — All rights reserved.
                  </p>
                </div>
                <nav className="flex gap-6 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
                  <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                  <Link href="#" className="hover:text-foreground transition-colors">Support</Link>
                </nav>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
