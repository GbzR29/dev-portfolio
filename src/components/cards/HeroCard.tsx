"use client";

import { Card } from "@/components/ui/Card";
import Typewriter from "@/components/Typewriter";
import { MyButton } from "@/components/ui/Button";
import { zIndex } from "@/lib/z-index";
import { useLanguage } from "@/components/providers/LanguageProvider"; // Importe o hook

export default function HeroCard() {
  const { t } = useLanguage(); // Acesse as traduções

  const handleDownload = () => {
    window.open('/cv/resume.pdf', '_blank');
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
      <h1 className="text-3xl sm:text-5xl font-bold text-center">
        <Typewriter
          text={t.heroTitle} // Traduzido
          speed={80}
          loop
          pauseDuration={1500}
        />
      </h1>

      <p className="text-[var(--primary)] font-medium text-center">
        {t.heroSubtitle} {/* Traduzido */}
      </p>

      <p className="text-[var(--text-muted)] max-w-md text-center mx-auto leading-relaxed">
        {t.heroDescription} {/* Traduzido (certifique-se de adicionar no translations.ts) */}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center items-center">
        <MyButton 
          text={t.heroViewProjects} // Traduzido
          className="w-full sm:w-auto" 
          onClick={() => scrollToSection('projects')}
        />
        <MyButton 
          text={t.heroContact} // Traduzido
          className="w-full sm:w-auto" 
          onClick={() => scrollToSection('contact')}
        />
        <MyButton 
          text={t.heroMyCv} // Traduzido
          variant="outline" 
          onClick={handleDownload} 
          className="w-full sm:w-auto"
        />
      </div>
    </Card>
  );
}