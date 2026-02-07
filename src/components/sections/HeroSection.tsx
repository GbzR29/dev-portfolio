import HeroContent from "@/components/HeroContent";
import HeroAvatar from "@/components/HeroAvatar";

export default function HeroSection() {
  return (

    <section className="min-h-screen flex items-center px-6 sm:px-10 lg:px-20 py-24">
      
      <div className="flex flex-1 items-center justify-between gap-16 px-25 max-lg:flex-col-reverse max-lg:justify-center max-lg:gap-12 max-lg:px-6 max-lg:py-12">
        <HeroContent />
        <HeroAvatar />
      </div>

    </section>
  );
}
