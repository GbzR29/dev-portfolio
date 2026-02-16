"use client";

import Card from "@/components/ui/Card";
import Typewriter from "@/components/Typewriter";
import { MyButton } from "@/components/ui/Button";
import { zIndex } from "@/lib/z-index";
import { useLanguage } from "@/components/providers/LanguageProvider";
import GlitchEffect from "../effects/GlitchEffect";

export default function HeroCard() {
  const { t } = useLanguage();

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
      className="space-y-6 overflow-hidden" // Adicionado overflow-hidden
      style={{ zIndex: zIndex.card }}
    >
      {/* Título com altura fixa para evitar "tremida" vertical no mobile */}
      <h1 className="min-h-[80px] sm:min-h-[120px] text-3xl sm:text-5xl font-bold text-center flex items-center justify-center text-[var(--text-main)]">
        <Typewriter
          text={t?.heroTitle || ""}
          speed={85}
          loop
          pauseDuration={3500}
        >
          {(currentText) => (
            <div className="relative inline-flex items-center justify-center">
              {/* O Glitch agora está isolado para não afetar o fluxo do texto */}
              <GlitchEffect text={currentText} />
              
              {/* Cursor com posição absoluta para não empurrar o texto lateralmente */}
              <span className="absolute -right-4 animate-cursor-blink text-[var(--text-main)] font-bold">
                |
              </span>
            </div>
          )}
        </Typewriter>
      </h1>

      <p className="text-[var(--primary)] font-medium text-center uppercase tracking-[0.3em] text-xs">
        {t.heroSubtitle}
      </p>

      <p className="text-[var(--text-muted)] max-w-md text-center mx-auto leading-relaxed">
        {t.heroDescription}
      </p>

      {/* Botões: Forçando o arredondamento via style ou garantindo a classe */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center items-center">
        <MyButton
          text={t.heroViewProjects}
          className="w-full sm:w-auto rounded-xl" // Forçando a classe aqui
          onClick={() => scrollToSection('projects')}
        />
        <MyButton
          text={t.heroContact}
          className="w-full sm:w-auto rounded-xl"
          onClick={() => scrollToSection('contact')}
        />
        <MyButton
          text={t.heroMyCv}
          variant="outline"
          className="w-full sm:w-auto rounded-xl"
          onClick={() => window.open('/pdf/resume.pdf', '_blank')}
        />
      </div>
    </Card>
  );
}