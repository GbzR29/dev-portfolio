"use client";

import { Construction, Wrench, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

interface StatusPageProps {
  type?: "development" | "maintenance";
}

export default function StatusPage({ type = "development" }: StatusPageProps) {
  const isDev = type === "development";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-6 pt-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          
          {/* animated icon*/}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[var(--primary)] opacity-20 blur-3xl rounded-full" />
            <div className="relative bg-[var(--card)] border border-[var(--border)] p-8 rounded-3xl shadow-2xl">
              {isDev ? (
                <Construction size={64} className="text-[var(--primary)] animate-bounce" />
              ) : (
                <Wrench size={64} className="text-[var(--primary)] animate-spin-slow" />
              )}
            </div>
          </div>

          {/* texts */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {isDev ? "Under construction" : "Quick Maintenance"}
              <span className="text-[var(--primary)]">.</span>
            </h1>
            <p className="text-[var(--text-muted)] text-lg md:text-xl max-w-md mx-auto leading-relaxed">
              {isDev 
                ? "I'm working on something amazing for this section. Check back later to see it!"
                : "I'm making a few adjustments, it won't take long..."}
            </p>
          </div>

          {/* back button */}
          <div className="pt-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Return to main page
            </Link>
          </div>

          {/* decorative progress bar */}
          <div className="max-w-xs mx-auto pt-8">
            <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary)] w-2/3 rounded-full animate-pulse" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] mt-3 opacity-50">
              {isDev ? "Coding in progress" : "System Updating"}
            </p>
          </div>

        </div>
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}