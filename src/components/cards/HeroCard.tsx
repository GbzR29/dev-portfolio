// components/cards/HeroCard.tsx

import { Card } from "@/components/ui/Card";
import Typewriter from "@/components/Typewriter";
import { MyButton } from "@/components/ui/Button";
import { Download } from "lucide-react";
import { zIndex } from "@/lib/z-index";

export default function HeroCard() {
  const handleDownload = () => {
    window.open('/cv/resume.pdf', '_blank');
  };

  return (
    <Card 
      padding="2xl" 
      className="space-y-6" 
      style={{ zIndex: zIndex.card }}
    >
      <h1 className="text-3xl sm:text-5xl font-bold text-center">
        <Typewriter
          text="Gabriel Carvalho"
          speed={80}
          loop
          pauseDuration={1500}
        />
      </h1>

      <p className="text-blue-400 font-medium text-center">
        Engine Programmer • Game Developer • Fullstack
      </p>

      <p className="text-[var(--text-muted)] max-w-md text-center mx-auto">
        I build systems from scratch. Engines, games and tools that actually work.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center items-center">
        <MyButton text="View projects" className="w-full sm:w-auto" />
        <MyButton text="Contact" className="w-full sm:w-auto" />
        <MyButton 
          text="My CV" 
          variant="outline" 
          onClick={handleDownload} 
          className="w-full sm:w-auto"
        />
      </div>
    </Card>
  );
}