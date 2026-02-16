"use client";

import HeroImage from "@/components/HeroImage";

export default function HeroAvatar() {
  return (
    <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] group isolate">
      
      {/* 1. Glow de fundo ultra-difuso */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 via-blue-500/20 to-purple-500/30 blur-[80px] animate-pulse group-hover:scale-125 transition-transform duration-1000" />
      
      {/* 2. Anéis Orbitais Duplos (Estáticos em posição, mas giratórios) */}
      {/* Anel Externo (Horário) */}
      <div className="absolute inset-[-15px] rounded-full border-[1.5px] border-dashed border-primary/30 animate-[spin_30s_linear_infinite] opacity-40 group-hover:opacity-100 transition-opacity" />
      
      {/* Anel Interno (Anti-horário) */}
      <div className="absolute inset-[-5px] rounded-full border border-dotted border-blue-400/20 animate-[spin_20s_linear_reverse_infinite] opacity-50" />

      {/* 3. Container Principal (Removida animação float) */}
      <div className="relative h-full w-full rounded-full p-3 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-md border border-white/20 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Overlay de Vinheta para Profundidade */}
        <div className="absolute inset-0 z-10 rounded-full shadow-[inset_0_0_60px_rgba(0,0,0,0.6)] pointer-events-none" />

        {/* Container da Imagem com Zoom e Filtro no Hover */}
        <div className="relative h-full w-full rounded-full overflow-hidden bg-muted">
          <div className="h-full w-full grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out">
            <HeroImage
              path="/perfil.jpeg"
              alt="Gabriel profile picture"
              width={400}
              height={400}
              className="object-cover h-full w-full"
            />
          </div>
        </div>
      </div>
      
      {/* 4. Badge de Status com Efeito Ping */}
      <div className="absolute bottom-6 -right-2 bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-2xl z-20 shadow-2xl flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-bold font-mono text-white tracking-[0.15em] uppercase">
          Available
        </span>
      </div>
    </div>
  );
}