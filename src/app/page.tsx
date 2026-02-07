import Navbar from "@/components/navbar/Navbar";
import AboutSection from "@/components/sections/AboutSection";

import HeroSection from "@/components/sections/HeroSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ContactSection } from "@/components/sections/ContactSection";

import TriangleParticles from "@/components/particles/TriangleParticles";



export default function Home() {
  return (
      
    <main className="min-h-screen bg-[#0B1220] text-white flex flex-col">

      <TriangleParticles />  

      <Navbar/>

      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ContactSection />      

    </main>
  );
}
