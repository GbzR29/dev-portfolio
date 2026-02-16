"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useState, useRef, useEffect } from "react";
import { Menu, X, Moon, Sun, Languages, Check } from "lucide-react";
import Image from "next/image";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";
import { zIndex } from "@/lib/z-index";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const langMenuRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  // Fecha o menu de idiomas ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 w-full bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--border)] transition-all duration-300"
        style={{ zIndex: zIndex.navbar }}
      >

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-[var(--primary)] font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--nav-hover)]">
                gabrielfc.dev
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <NavLinks />

              <div className="flex items-center gap-4 ml-4 pl-6 border-l border-[var(--border)]">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-[var(--primary)]/10 transition-all duration-300 transform hover:scale-110"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="text-[var(--primary)]" size={20} />
                  ) : (
                    <Moon className="text-[var(--text-muted)] hover:text-[var(--primary)]" size={20} />
                  )}
                </button>

                {/* Language Selector */}
                <div className="relative" ref={langMenuRef}>
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${langOpen ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "hover:bg-[var(--primary)]/10 text-[var(--text-muted)] hover:text-[var(--primary)]"
                      }`}
                    aria-label="Change language"
                  >
                    <Languages size={20} />
                  </button>

                  {/* Dropdown Menu */}
                  {langOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-[var(--card)] backdrop-blur-2xl border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="py-2">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code as any);
                              setLangOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-[var(--primary)]/10 ${language === lang.code ? "text-[var(--primary)] font-bold" : "text-[var(--text-main)]"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base">{lang.flag}</span>
                              <span>{lang.label}</span>
                            </div>
                            {language === lang.code && <Check size={14} className="text-[var(--primary)]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--primary)]/10 transition-all duration-300"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? (
                <X className="text-[var(--primary)]" size={28} />
              ) : (
                <Menu className="text-[var(--text-muted)] hover:text-[var(--primary)]" size={28} />
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}