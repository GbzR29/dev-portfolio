"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, X, Moon, Sun, Languages, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  const languages = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "pt", label: "Português", flag: "🇧🇷" },
    { code: "zh", label: "中文", flag: "🇨🇳" },
  ];

  useEffect(() => {
    setOpen(false);
    setLangOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = useCallback(() => setOpen((v) => !v), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <>
      <header
        className="sticky top-0 w-full bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--border)] transition-all duration-300"
        style={{ zIndex: 40 }} // Camada inferior ao menu mobile
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo e Nome */}
            <Link
              href="/"
              className="flex items-center gap-3 shrink-0 group"
              onClick={(e) => {
                if (typeof window !== "undefined" && window.location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110">
                <Image src="/logo.png" alt="logo" fill className="object-contain" priority />
              </div>
              <span className="font-bold text-xl tracking-tight text-[var(--text-main)] transition-colors group-hover:text-[var(--primary)]">
                gabrielfc.dev
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <NavLinks />
              <div className="flex items-center gap-4 ml-4 pl-6 border-l border-[var(--border)]">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-[var(--primary-low)] text-[var(--text-main)] transition-all"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="text-[var(--primary)]" size={20} /> : <Moon size={20} />}
                </button>

                <div className="relative" ref={langMenuRef}>
                  <button
                    onClick={() => setLangOpen((s) => !s)}
                    className="p-2 rounded-lg hover:bg-[var(--primary-low)] text-[var(--text-main)]"
                    aria-label="Select language"
                  >
                    <Languages size={20} />
                  </button>

                  {langOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-[var(--surface)] border border-[var(--border-strong)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code as any);
                            setLangOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--primary-low)] ${
                            language === lang.code ? "text-[var(--primary)] font-bold" : "text-[var(--text-main)]"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span>{lang.flag}</span>
                            {lang.label}
                          </span>
                          {language === lang.code && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </nav>

            {/* Botão Hamburger (Mobile) */}
            <button
              onClick={toggleOpen}
              className="lg:hidden p-2 text-[var(--text-main)] hover:text-[var(--primary)] transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu 
        open={open} 
        onClose={closeMenu} 
        languages={languages} 
        currentLang={language} 
        setLanguage={setLanguage} 
      />
    </>
  );
}