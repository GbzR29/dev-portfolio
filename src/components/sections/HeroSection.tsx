// components/sections/HeroSection.tsx
"use client";

import HeroAvatar from "@/components/HeroAvatar";
import HeroCard from "@/components/cards/HeroCard";
import { zIndex } from "@/lib/z-index";

export default function HeroSection() {
  return (
    <section 
      // Adicionado: pt-28 no mobile para compensar a navbar (h-20 + um respiro)
      // No lg: (desktop), mantemos o py-24 original ou ajustamos conforme o layout
      className="min-h-screen flex items-center px-6 sm:px-10 lg:px-20 pt-28 pb-12 lg:py-24"
    >
      <div className="
        w-full max-w-full mx-auto 
        flex flex-col-reverse lg:flex-row 
        items-center justify-between 
        gap-8 lg:gap-16
        isolation-isolate
      ">
        
        <div className="w-full flex justify-center lg:justify-start relative" style={{ zIndex: zIndex.content }}>
          <HeroCard />
        </div>

        {/* Dica: Se mesmo com o padding no topo a foto ainda parecer alta, 
           podemos adicionar uma margem negativa ou ajuste específico aqui 
        */}
        <div className="w-full flex justify-center lg:justify-end">
          <HeroAvatar />
        </div>
      </div>
    </section>
  );
}