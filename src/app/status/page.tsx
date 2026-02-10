"use client";

import { useSearchParams } from "next/navigation"; // Hook para ler a URL
import { Construction, Wrench, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

export default function StatusPage() {
  const searchParams = useSearchParams();
  
  // Pegamos o contexto da URL. Ex: ?type=maintenance&from=blog
  const type = searchParams.get("type") || "development";
  const from = searchParams.get("from") || "home";
  
  const isDev = type === "development";

  // Mapeamento de destinos de retorno
  const backDestinations: Record<string, { label: string; href: string }> = {
    blog: { label: "Return to Blog", href: "/blog" },
    learn: { label: "Return to Modules", href: "/learn" },
    home: { label: "Return to Main Page", href: "/" },
  };

  const backTo = backDestinations[from] || backDestinations.home;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-6 pt-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          
          {/* Ícone Animado (Seu código original) */}
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

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {/* Título Dinâmico baseado na origem */}
              {from.toUpperCase()} {isDev ? "Under Construction" : "Maintenance"}
              <span className="text-[var(--primary)]">.</span>
            </h1>
            <p className="text-[var(--text-muted)] text-lg md:text-xl max-w-md mx-auto leading-relaxed">
              {isDev 
                ? `I'm working on something amazing for the ${from} section. Check back later!`
                : `I'm making a few adjustments to the ${from}, it won't take long...`}
            </p>
          </div>

          {/* Botão de Voltar DINÂMICO */}
          <div className="pt-4">
            <Link 
              href={backTo.href}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              {backTo.label}
            </Link>
          </div>

          {/* Barra de progresso (Seu código original) */}
          <div className="max-w-xs mx-auto pt-8">
            <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary)] w-2/3 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}