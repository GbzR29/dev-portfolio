"use client";

import React from "react";

export default function GridDecoration() {
  // Cor das linhas (mesmo cinza sutil do seu original)
  const strokeColor = "rgba(128,128,128,0.1)";

  // SVG de um hexágono desenhado para se encaixar perfeitamente em repetição
  const hexPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100' fill='none' stroke='${encodeURIComponent(strokeColor)}' stroke-width='1'/%3E%3C/svg%3E")`;

  return (
    <div aria-hidden className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
      {/* Glow central suave (seu código original) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.04),transparent_60%)]" />

      {/* Padrão Honeycomb */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: hexPattern,
          backgroundSize: '56px 100px', // Proporção matemática para o hexágono não esticar
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, black 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, black 70%, transparent 100%)'
        }}
      />
    </div>
  );
}