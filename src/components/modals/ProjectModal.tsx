"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Code2, Terminal } from "lucide-react"; 
import { SiGithub } from "react-icons/si"; 
import { Project } from "../sections/ProjectsSection";
import { MyButton } from "@/components/ui/Button";

// Importações para o tema de código
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Botão Fechar (Mobile Float) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 md:hidden border border-white/10"
        >
          <X size={20} />
        </button>

        {/* LADO ESQUERDO: Mídia e Código */}
        <div className="w-full md:w-1/2 bg-black/40 border-b md:border-b-0 md:border-r border-[var(--border)] flex flex-col overflow-hidden">
          {/* Screenshot - Reduzido no Mobile */}
          <div className="h-48 sm:h-64 md:h-1/2 w-full bg-gradient-to-br from-gray-900 to-black relative flex-shrink-0">
             <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-sm px-4 text-center">
                [ Screenshot: {project.title} ]
             </div>
          </div>

          {/* Área de Código - Oculta em celulares pequenos para priorizar texto */}
          <div className="hidden md:flex flex-1 overflow-hidden flex-col bg-[#1e1e1e]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Terminal size={14} />
                    <span>main.cpp</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
              <SyntaxHighlighter
                language="cpp"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "1.5rem",
                  fontSize: "0.875rem",
                  backgroundColor: "transparent",
                  lineHeight: "1.5",
                }}
              >
                {project.codeSnippet}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Conteúdo */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto bg-[var(--bg)]">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{project.title}</h3>
                    <div className="flex flex-wrap gap-2">
                        {project.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 text-[10px] md:text-xs font-medium border border-[var(--primary)]/30 text-[var(--primary)] rounded bg-[var(--primary)]/5">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <button 
                  onClick={onClose}
                  className="hidden md:flex p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={24} className="text-[var(--text-muted)]" />
                </button>
            </div>

            <div className="prose prose-invert max-w-none text-[var(--text-muted)] text-sm md:text-base flex-grow">
                <p className="leading-relaxed">{project.longDescription}</p>
                
                <h4 className="text-white text-lg font-semibold mt-6 mb-3 flex items-center gap-2">
                    <Code2 size={20} className="text-[var(--primary)]" />
                    Key Features
                </h4>
                <ul className="list-disc pl-4 space-y-2 mb-4">
                    <li>Custom Memory Allocator</li>
                    <li>Hot-reloading shaders</li>
                    <li>Data-oriented design</li>
                </ul>
            </div>

            {/* Footer / Botão Fixo na base no mobile */}
            <div className="mt-auto pt-6 border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg)] md:relative">
                <Link href={project.github} target="_blank">
                    <MyButton 
                      text="View on GitHub" 
                      icon={<SiGithub size={18} />} 
                      className="w-full justify-center py-6 md:py-4" 
                    />
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}