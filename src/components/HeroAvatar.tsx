"use client";

import HeroImage from "@/components/HeroImage";

export default function HeroAvatar() {
  return (
    <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] group">
      
      {/* 1. Glow de fundo pulsante e dinâmico */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/40 to-blue-500/40 blur-3xl animate-pulse group-hover:scale-110 transition-transform duration-700" />

      {/* 2. Anel rotativo */}
      <div className="absolute inset-[-10px] rounded-full border border-dashed border-primary/20 animate-[spin_20s_linear_infinite] opacity-35" />

      {/* 3. Container da Imagem */}
      <div className="relative h-full w-full rounded-full p-2 bg-background/50 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
        
        {/* Overlay interno para profundidade */}
        <div className="absolute inset-0 z-10 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none" />

        <div className="relative h-full w-full rounded-full overflow-hidden grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105">
          <HeroImage
            path="/perfil.jpeg"
            alt="Gabriel profile picture"
            width={350}
            height={350}
            fill={false}
            className="object-cover h-full w-full"
          />
        </div>
      </div>

      {/* 4. Badge Tech com bolinha verde individualizada */}
      <div className="absolute -bottom-2 -right-2 bg-background/80 backdrop-blur-md border border-primary/30 px-4 py-1 rounded-full z-20 shadow-xl flex items-center gap-2">
        <span className="text-emerald-500 animate-pulse font-bold">
          ●
        </span>
        <span className="text-[10px] font-mono text-foreground/80 uppercase tracking-wider">
          Online
        </span>
      </div>
    </div>
  );
}