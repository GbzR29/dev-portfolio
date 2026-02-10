"use client";

import HeroAvatar from "@/components/HeroAvatar";
import HeroCard from "@/components/cards/HeroCard";
import BinaryDecorations from "@/components/ui/BinaryDecoration";

export default function HeroSection() {
  return (
    // Alterado de py-20 para pt-32 (topo) e pb-20 (baixo) no mobile
    // lg:py-20 mantém o padrão original em telas grandes
    <section className="relative min-h-[100dvh] w-full flex items-center justify-center px-6 pt-32 pb-20 lg:py-20 lg:px-20 overflow-hidden bg-background">
      
      {/* --- CAMADA DECORATIVA (BACKGROUND) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.05),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Adicionado gap-20 no mobile para separar o Avatar do Card abaixo dele */}
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-20 lg:gap-8">
          
          {/* Lado Esquerdo: Card de Informações */}
          <div className="w-full lg:flex-1 flex justify-center lg:justify-start animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <HeroCard />
            </div>
          </div>

          {/* Lado Direito: Avatar/Imagem */}
          <div className="w-full lg:flex-1 flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-1000">
             <div className="relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <HeroAvatar />
             </div>
          </div>

        </div>
      </div>

      {/* Decorativo de rodapé da seção */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent z-20" />
    </section>
  );
}