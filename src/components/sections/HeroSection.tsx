"use client";

import React, { useState, useEffect } from "react";
import HeroAvatar from "@/components/HeroAvatar";
import HeroCard from "@/components/cards/HeroCard";
import BinaryDecoration from "@/components/ui/BinaryDecoration";
import Card from "@/components/ui/Card";
import GridDecoration from "../ui/GridDecoration";

export default function HeroSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full min-h-[100dvh] px-6 sm:px-10 lg:px-20 pt-32 pb-20 lg:py-0 flex items-center overflow-hidden bg-background"
    >
      <BinaryDecoration
        className="absolute top-10 left-6 sm:left-10 z-0"
        text="01101101 01111001 00100000 01101111 01101110 01101100 01101001 01101110 01100101 00100000 01100011 01101111 01110010 01101110 01100101 01110010 00100001"
      />

      <GridDecoration />

      {/* isMounted para controlar a visibilidade. 
        Se não estiver montado, mantemos opacidade baixa para evitar o flash branco, 
        mas renderizamos a estrutura para o SEO.
      */}
      <div
        className={`
          relative z-10 w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row
          items-center justify-between gap-14 lg:gap-20
          transition-opacity duration-700
          ${isMounted ? "opacity-100" : "opacity-0"}
        `}
      >
        {/* Texto / Card */}
        <div
          className="
            w-full lg:max-w-2xl
            fill-mode-backwards
            animate-in fade-in slide-in-from-bottom-8 lg:slide-in-from-left-8
            duration-1000 delay-200
          "
        >
          <Card
            padding="none"
            glow
            hoverable={false}
            className="bg-transparent border-none shadow-none lg:bg-[var(--card)] lg:border lg:border-white/5 lg:shadow-2xl transition-all duration-500"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
              <div className="relative">
                <HeroCard />
              </div>
            </div>
          </Card>
        </div>

        {/* Avatar */}
        <div
          className="
            w-full max-w-[280px] sm:max-w-md
            flex justify-center lg:justify-end
            fill-mode-backwards
            animate-in fade-in slide-in-from-top-8 lg:slide-in-from-right-8
            duration-1000 delay-500
          "
        >
          <div className="relative group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all duration-1000" />
            <HeroAvatar />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
    </section>
  );
}