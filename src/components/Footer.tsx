"use client";

import { Mail } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--navbar-bg)] backdrop-blur-md py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-8">
        {/* Container principal agora é flex-col e items-center para centralizar tudo verticalmente */}
        <div className="flex flex-col items-center justify-center gap-8 text-center">
          
          {/* Marca e Copyright */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]" />
              <span className="text-xl font-bold text-[var(--text-main)] tracking-tight">
                gabrielfc<span className="text-[var(--primary)]">.dev</span>
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-sm max-w-xs">
              Copyright © {currentYear} Gabriel FC. All rights reserved.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-8">
            <a 
              href="https://github.com/GbzR29" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-all duration-300 hover:scale-110"
              aria-label="GitHub"
            >
              <svg role="img" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>

            <a 
              href="https://www.linkedin.com/in/gabriel-carvalho-479740234" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[#0A66C2] dark:hover:text-[var(--primary)] transition-all duration-300 hover:scale-110"
              aria-label="LinkedIn"
            >
              <svg role="img" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>

            <a 
              href="mailto:gabrielfeliperc@hotmail.com" 
              className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-all duration-300 hover:scale-110"
              aria-label="Email"
            >
              <Mail size={24} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}