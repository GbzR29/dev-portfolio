import Navbar from "@/components/navbar/Navbar";
import AboutSection from "@/components/sections/AboutSection";

import HeroSection from "@/components/sections/HeroSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ContactSection } from "@/components/sections/ContactSection";

import TriangleParticles from "@/components/particles/TriangleParticles";
import HeroCard from "@/components/cards/HeroCard";



export default function Home() {
  return (
      
    <main className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-main)]">

      <TriangleParticles />  

      <Navbar/>
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ContactSection />      

    </main>
  );
}
