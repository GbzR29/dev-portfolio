"use client";

import React, { memo } from "react";
import dynamic from "next/dynamic";

// GlitchEffect pode ser pesado — carregamos dinamicamente se estiver em Next.js
const GlitchEffect = dynamic(() => import("../effects/GlitchEffect"), { ssr: false });

interface BinaryDecorationProps {
  className?: string;
  text: string;
  repeat?: number; // quantas linhas de binário mostrar
}

const BinaryDecorationInner = ({ className = "", text, repeat = 1 }: BinaryDecorationProps) => {
  // limitar repetição para evitar overdraw
  const items = Array.from({ length: Math.min(Math.max(repeat, 1), 4) });

  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none font-mono text-[10px] leading-4 text-[var(--primary)] opacity-20 ${className}`}
    >
      {items.map((_, i) => (
        <div key={i} className="mb-1">
          {/* O GlitchEffect já recebe o texto e faz a animação */}
          <GlitchEffect text={text} />
        </div>
      ))}
    </div>
  );
};

export default memo(BinaryDecorationInner);