// app/page.tsx

import Navbar from "@/components/navbar/Navbar";
import AboutSection from "@/components/sections/AboutSection";
import HeroSection from "@/components/sections/HeroSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import Footer from "@/components/Footer";
import TriangleParticles from "@/components/particles/TriangleParticles";

export const metadata = {
  title: 'Gabriel Carvalho | My web portfolio', 
  description: 'Welcome to my online corner',
  
  openGraph: {
    title: 'Gabriel Carvalho | Portfolio & Game Development',
    description: 'Welcome to my digital corner!',
    url: 'https://www.gabrielfrc.dev/',
    siteName: 'GabrielFRC.dev',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Banner preview',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-main)]">
      <TriangleParticles />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}