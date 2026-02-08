"use client";

import { Moon, Sun, Languages, X } from "lucide-react";
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
      {/* Overlay adaptável ao tema */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 backdrop-blur-xl
          transition-all duration-500 ease-out
          ${open 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 -translate-y-full pointer-events-none"}
        `}
        style={{ 
          zIndex: zIndex.mobileMenuOverlay,
          // Agora usa uma cor baseada no tema para o fundo do overlay
          background: theme === 'dark' 
            ? 'linear-gradient(to bottom, rgba(11, 18, 32, 0.9) 0%, rgba(11, 18, 32, 0.7) 100%)'
            : 'linear-gradient(to bottom, rgba(246, 248, FB, 0.9) 0%, rgba(246, 248, FB, 0.7) 100%)'
        }}
      />

      <div 
        className={`
          fixed top-0 left-0 right-0
          transform transition-all duration-500 ease-out
          ${open ? "translate-y-0" : "-translate-y-full"}
        `}
        style={{ zIndex: zIndex.mobileMenu }}
      >
        <div className="min-h-screen pt-24 pb-12 px-6">
          <div className="max-w-2xl mx-auto">
            {/* Card principal seguindo as cores do seu CSS */}
            <div
              className={`
                bg-[var(--card)]
                backdrop-blur-2xl
                rounded-3xl
                border border-[var(--border)]
                shadow-2xl
                p-8
                animate-fade-in-up
                transition-colors duration-300
              `}
            >
              {/* Header do menu mobile */}
              <div className="flex justify-end mb-10 pb-6 border-b border-[var(--border)]">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--primary)]/10 transition-all duration-300"
                  aria-label="Close menu"
                >
                  <X className="text-[var(--text-muted)] hover:text-[var(--primary)]" size={28} />
                </button>
              </div>

              {/* Links de navegação */}
              <div className="space-y-3 mb-12">
                <NavLinks vertical onClick={onClose} />
              </div>

              {/* Divider gradiente que se adapta */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-8" />

              {/* Ações de tema e idioma */}
              <div className="flex items-center justify-between p-4 bg-[var(--primary)]/5 rounded-xl border border-[var(--border)]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-[var(--primary)]/10 transition-all duration-300 group"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? (
                      <Sun className="text-[var(--primary)]" size={24} />
                    ) : (
                      <Moon className="text-[var(--text-muted)] group-hover:text-[var(--primary)]" size={24} />
                    )}
                  </button>
                  
                  <button
                    className="p-2 rounded-lg hover:bg-[var(--primary)]/10 transition-all duration-300 group"
                    aria-label="Change language"
                  >
                    <Languages className="text-[var(--text-muted)] group-hover:text-[var(--primary)]" size={24} />
                  </button>
                </div>

                <div className="text-sm font-medium text-[var(--text-muted)]">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
              </div>

              {/* Footer informativo */}
              <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
                <p className="text-[var(--text-muted)] text-sm opacity-70">
                  Scroll to navigate • Click to jump
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }
      `}</style>
    </>
  );
}