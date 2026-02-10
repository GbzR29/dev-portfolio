"use client";

import { Card } from "@/components/ui/Card";
import Typewriter from "@/components/Typewriter";
import { MyButton } from "@/components/ui/Button";
import { zIndex } from "@/lib/z-index";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function HeroCard() {
  const { t } = useLanguage();

  const handleDownload = () => {
    window.open('/pdf/resume.pdf', '_blank');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Card
      padding="2xl"
      className="space-y-6"
      style={{ zIndex: zIndex.card }}
    >
      <h1 className="text-3xl sm:text-5xl font-bold text-center flex justify-center">
        <div className="relative inline-block">

          {/* Camada Principal Branca */}
          <span className="relative glitch-base text-white">
            <Typewriter text={t.heroTitle} speed={85} loop pauseDuration={3500} />
          </span>

          {/* Camada Cyan */}
          <span className="absolute inset-0 glitch-cyan opacity-90 select-none" aria-hidden="true">
            <Typewriter text={t.heroTitle} speed={85} loop pauseDuration={3500} />
          </span>

          {/* Camada Vermelha */}
          <span className="absolute inset-0 glitch-red opacity-90 select-none" aria-hidden="true">
            <Typewriter text={t.heroTitle} speed={85} loop pauseDuration={3500} />
          </span>
        </div>
      </h1>

      <p className="text-[var(--primary)] font-medium text-center uppercase tracking-[0.3em] text-xs">
        {t.heroSubtitle}
      </p>

      <p className="text-[var(--text-muted)] max-w-md text-center mx-auto leading-relaxed">
        {t.heroDescription}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center items-center">
        <MyButton
          text={t.heroViewProjects}
          className="w-full sm:w-auto"
          onClick={() => scrollToSection('projects')}
        />
        <MyButton
          text={t.heroContact}
          className="w-full sm:w-auto"
          onClick={() => scrollToSection('contact')}
        />
        <MyButton
          text={t.heroMyCv}
          variant="outline"
          onClick={handleDownload}
          className="w-full sm:w-auto"
        />
      </div>
    </Card>
  );
}