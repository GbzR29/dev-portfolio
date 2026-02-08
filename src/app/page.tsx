import Navbar from "@/components/navbar/Navbar";
import AboutSection from "@/components/sections/AboutSection";

import HeroSection from "@/components/sections/HeroSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ContactSection } from "@/components/sections/ContactSection";

import TriangleParticles from "@/components/particles/TriangleParticles";


export const metadata = {
  title: 'Gabriel Carvalho | My web portfolio', 
  description: 'Welcome to my online corner, ',
  
  openGraph: {
    title: 'Seu Nome | Portfolio & UI Design',
    description: 'Welcome to my digital corner!',
    url: 'https://www.gabrielfrc.dev/',
    siteName: 'GabrielFRC.dev',
    images: [
      {
        url: '/logo.png', // Deve estar na pasta /public
        width: 1200,
        height: 630,
        alt: 'Banner preview',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },

  /*twitter: {
    card: 'summary_large_image',
    title: 'Seu Nome | Portfolio & UI Design',
    description: 'Portfolio focado em interfaces modernas e animações fluidas.',
    images: ['/banner.png'], // Opcional: pode ser uma imagem diferente para o Twitter
  },*/
};

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
