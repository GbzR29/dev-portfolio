"use client";

import { X, LayoutGrid, User, Briefcase, PenTool, GraduationCap, MessageSquare, ChevronRight, Sun, Moon } from "lucide-react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  languages: { code: string; label: string; flag: string }[];
  currentLang: string;
  setLanguage: (lang: any) => void;
}

export function MobileMenu({ open, onClose, languages, currentLang, setLanguage }: MobileMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex flex-col z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Painel */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        className="
          relative ml-auto h-full w-[85%] max-w-[380px]
          bg-[var(--surface-overlay)] backdrop-blur-2xl
          border-l border-[var(--border)] shadow-2xl
          flex flex-col
          animate-in slide-in-from-right duration-300
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-8">
          <div className="space-y-1">
            <h2 className="text-[var(--text-main)] font-bold text-xl tracking-tight">Menu</h2>
            <div className="h-1 w-8 bg-[var(--primary)] rounded-full" />
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-[var(--primary-low)] text-[var(--primary)] active:scale-90 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto px-4">
          <MobileNavList onClose={onClose} />
        </div>

        {/* Footer */}
        <div className="p-6 space-y-5 border-t border-[var(--border)]">

          {/* Theme toggle */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">
              Appearance
            </span>
            <div className="flex p-1 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
              <button
                onClick={() => theme !== "light" && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${theme === "light"
                    ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border-strong)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
              >
                <Sun size={14} />
                Light
              </button>
              <button
                onClick={() => theme !== "dark" && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${theme === "dark"
                    ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border-strong)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
              >
                <Moon size={14} />
                Dark
              </button>
            </div>
          </div>

          {/* Language selector */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">
              Language
            </span>
            <div className="flex p-1 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); onClose(); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${currentLang === lang.code
                      ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border-strong)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/#contact"
            onClick={onClose}
            className="group flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-[var(--text-main)] text-[var(--text-inverse)] font-bold transition-all hover:opacity-90 active:scale-[0.96]"
          >
            <span>Let&apos;s collaborate</span>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileNavList({ onClose }: { onClose: () => void }) {
  const items = [
    { label: "Home",     href: "/",          icon: LayoutGrid,    sub: "Back to start"   },
    { label: "About",    href: "/#about",     icon: User,          sub: "My journey"      },
    { label: "Projects", href: "/#projects",  icon: Briefcase,     sub: "My work",   badge: "4" },
    { label: "Blog",     href: "/blog",       icon: PenTool,       sub: "Insights & Code" },
    { label: "Learn",    href: "/learn",      icon: GraduationCap, sub: "Resources"       },
    { label: "Contact",  href: "/#contact",   icon: MessageSquare, sub: "Say hello"       },
  ];

  return (
    <nav className="space-y-1">
      {items.map((it, i) => (
        <Link
          key={it.href}
          href={it.href}
          onClick={onClose}
          className="group block animate-in fade-in slide-in-from-right-4 duration-300 fill-mode-backwards"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-[var(--primary-low)] border border-transparent hover:border-[var(--border)]">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:border-[var(--primary)]/30 transition-all">
              <it.icon size={20} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">
                  {it.label}
                </span>
                {it.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--primary-low)] text-[var(--primary)] font-bold border border-[var(--primary)]/20">
                    {it.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-none">{it.sub}</p>
            </div>
          </div>
        </Link>
      ))}
    </nav>
  );
}
