import HeroAvatar from "@/components/HeroAvatar";
import HeroCard from "@/components/cards/HeroCard";

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center px-6 sm:px-10 lg:px-20 py-12 lg:py-24">
      <div className="
        w-full max-w-7xl mx-auto 
        flex flex-col-reverse lg:flex-row 
        items-center justify-between 
        gap-12 lg:gap-16
        isolation-isolate
      ">
        
        {/* ESQUERDA (Desktop) / BAIXO (Mobile) */}
        <div className="w-full flex justify-center lg:justify-start relative z-50">
          <HeroCard />
        </div>

        {/* DIREITA (Desktop) / CIMA (Mobile) */}
        <div className="w-full flex justify-center lg:justify-end">
          <HeroAvatar />
        </div>

      </div>
    </section>
  );
}