"use client";

import React from "react";
import HeroAvatar from "@/components/HeroAvatar";
import HeroCard from "@/components/cards/HeroCard";
import BinaryDecorations from "@/components/ui/BinaryDecoration";
import { Card } from "@/components/ui/Card";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="
        w-full
        min-h-[100dvh]
        px-6 sm:px-10 lg:px-20
        pt-32 pb-20 lg:py-0
        flex flex-col justify-center
        relative overflow-hidden
        bg-background
      "
    >
      <BinaryDecorations text="01001101 01111001 00100000 01101111 01101110 01101100 01101001 01101110 01100101 00100000 01100011 01101111 01110010 01101110 01100101 01110010 00100001" />

      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.05),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="
        w-full max-w-7xl mx-auto
        /* Inverte no mobile (Avatar sobe), volta ao normal no desktop */
        flex flex-col-reverse lg:flex-row 
        items-center
        justify-between 
        gap-12 lg:gap-16
        relative z-10
      ">
        
        <div className="
          w-full lg:max-w-2xl 
          animate-in fade-in slide-in-from-bottom-8 lg:slide-in-from-left-8 duration-1000
        ">
          <Card 
            padding="none" 
            glow={true} 
            hoverable={false}
            className="bg-transparent border-none shadow-none lg:bg-[var(--card)] lg:border lg:border-white/5 lg:shadow-xl"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative">
                <HeroCard />
              </div>
            </div>
          </Card>
        </div>

        <div className="
          w-full max-w-[280px] sm:max-w-md
          flex justify-center lg:justify-end 
          animate-in fade-in slide-in-from-top-8 lg:slide-in-from-right-8 duration-1000
        ">
          <div className="relative group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000" />
            <HeroAvatar />
          </div>
        </div>
        
      </div>

      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
    </section>
  );
}