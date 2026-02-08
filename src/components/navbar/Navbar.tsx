"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useState } from "react";
import { Menu, X, Moon, Sun, Languages } from "lucide-react";
import Image from "next/image";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";
import { zIndex } from "@/lib/z-index";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <header 
        // Alterado: background usa var(--navbar-bg) e a borda inferior usa var(--border)
        className="fixed w-full top-0 left-0 bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--border)] transition-all duration-300"
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
              {/* O gradiente agora termina em uma cor que faz sentido no light e dark */}
              <span className="text-[var(--primary)] font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--nav-hover)]">
                gabrielfc.dev
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <NavLinks />
              
              {/* Borda lateral agora usa var(--border) */}
              <div className="flex items-center gap-4 ml-4 pl-6 border-l border-[var(--border)]">
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
                
                <button
                  className="p-2 rounded-lg hover:bg-[var(--primary)]/10 transition-all duration-300 transform hover:scale-110"
                  aria-label="Change language"
                >
                  <Languages className="text-[var(--text-muted)] hover:text-[var(--primary)]" size={20} />
                </button>
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