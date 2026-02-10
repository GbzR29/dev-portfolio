"use client";

import { Moon, Sun, Languages, X, ChevronRight } from "lucide-react";
import { NavLinks } from "./NavLinks";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { zIndex } from "@/lib/z-index";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
      document.body.style.overflow = open ? "hidden" : "auto";
      
      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay com blur mais denso e transição suave */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 backdrop-blur-md
          transition-opacity duration-500 ease-in-out
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        style={{ 
          zIndex: zIndex.mobileMenuOverlay,
          background: theme === 'dark' 
            ? 'rgba(2, 6, 23, 0.8)' 
            : 'rgba(255, 255, 255, 0.7)'
        }}
      />

      <div 
        className={`
          fixed top-0 left-0 right-0
          transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
          ${open ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0 pointer-events-none"}
        `}
        style={{ zIndex: zIndex.mobileMenu }}
      >
        {/* Ajuste de PT-16 para subir o menu na tela */}
        <div className="pt-16 pb-8 px-4 sm:px-6">
          <div className="max-w-lg mx-auto">
            <div
              className={`
                relative overflow-hidden
                bg-[var(--card)]
                backdrop-blur-2xl
                rounded-[2.5rem]
                border border-white/10
                shadow-[0_20px_50px_rgba(0,0,0,0.3)]
                p-6 sm:p-8
                transition-colors duration-300
              `}
            >
              {/* Detalhe Decorativo de Background */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[var(--primary)]/10 blur-[60px] rounded-full" />

              {/* Header: Título e Close */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                  </div>
                  <span className="font-semibold text-[var(--text-muted)] text-sm tracking-wider uppercase">Menu</span>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-[var(--primary)]/10 transition-all active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="text-[var(--text-muted)]" size={20} />
                </button>
              </div>

              {/* Links de Navegação */}
              <nav className="mb-8">
                {/* Aqui você pode passar uma prop para NavLinks estilizar os itens individualmente */}
                <div className="grid gap-2">
                   <NavLinks vertical onClick={onClose} />
                </div>
              </nav>

              {/* Container de Ações (Ajustado para design mais moderno) */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={toggleTheme}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-[var(--primary)]/10 transition-all"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="text-yellow-400" size={20} />
                      <span className="text-xs font-medium text-[var(--text-muted)]">Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="text-blue-400" size={20} />
                      <span className="text-xs font-medium text-[var(--text-muted)]">Dark</span>
                    </>
                  )}
                </button>

                <button
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-[var(--primary)]/10 transition-all"
                >
                  <Languages className="text-[var(--primary)]" size={20} />
                  <span className="text-xs font-medium text-[var(--text-muted)]">English</span>
                </button>
              </div>

              {/* Status Bar / Footer */}
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
                  Ready to collaborate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}