"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { useState } from "react";
import StackCard from "@/components/cards/StackCard";
import ReadMoreButton from "@/components/ui/ReadMoreButton";

import BinaryDecorations from "@/components/ui/BinaryDecoration";

export default function AboutSection() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <section
      id="about"
      className="
        w-full
        py-24
        px-6 sm:px-10 lg:px-20
        border-t border-white/5
        flex flex-col justify-center
        lg:min-h-screen lg:flex-row lg:items-center
        relative
      "
    >
      <BinaryDecorations/>

      <div className="
        w-full max-w-7xl mx-auto
        flex flex-col lg:flex-row 
        lg:items-start
        justify-between 
        gap-16 lg:gap-12
        relative z-10
      ">
        
        {/* LADO ESQUERDO: Texto */}
        <div className="w-full lg:max-w-xl space-y-8">
          <div className="space-y-2">
            {/* Removido o comentário // 01. About me */}
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              {t.aboutTitle}
            </h2>
          </div>

          <div className="relative">
            <div
              className={`
                space-y-8 text-[var(--text-muted)] leading-relaxed text-lg
                overflow-hidden transition-all duration-700 ease-in-out
                ${open ? "max-h-[1200px] opacity-100" : "max-h-[160px] opacity-80"}
              `}
            >
              <p>{t.aboutPara1}</p>
              <p>{t.aboutPara2}</p>
              <p>{t.aboutPara3}</p>
              
              {/* Quick Tech Stats */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                <div className="space-y-1">
                  <span className="block text-white font-mono text-xs uppercase italic opacity-70">Core Focus:</span>
                  <span className="text-[var(--primary)] text-sm font-medium">Engine Dev & Graphics</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-white font-mono text-xs uppercase italic opacity-70">Main Stack:</span>
                  <span className="text-[var(--primary)] text-sm font-medium">C++, OpenGL, TS</span>
                </div>
              </div>
            </div>

            {/* Fade out effect */}
            {!open && (
              <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />
            )}
          </div>

          <div className="pt-2">
            <ReadMoreButton
              open={open}
              onToggle={() => setOpen(!open)}
            />
          </div>
        </div>

        {/* LADO DIREITO: StackCard */}
        <div className="
          w-full max-w-sm
          flex justify-center lg:justify-end
          lg:sticky lg:top-32
        ">
          <div className="relative group">
             {/* Brilho atrás do card */}
             <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
             <StackCard />
          </div>
        </div>
      </div>
    </section>
  );
}