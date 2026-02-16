"use client";

import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import Card from "@/components/ui/Card";
import { MyButton } from "@/components/ui/Button";
import TriangleParticles from "@/components/particles/TriangleParticles";
import { BookOpen, Code2, Cpu, Globe, Zap } from "lucide-react";



import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function LearnPage() {
  const { t } = useLanguage();

  if (!t) return null;

  const TRACKS = [
    {
      id: "cpp", // Pasta: /learn/C++
      path: "C++", 
      title: "Modern C++",
      description: t.trackCppDesc,
      icon: <Code2 className="text-[var(--primary)]" size={32} />,
      level: t.begAdv, // Nível traduzido
      lessons: `15 ${t.lessons}`
    },
    {
      id: "opengl", // Pasta: /learn/OpenGL
      path: "OpenGL",
      title: "OpenGL 4.6",
      description: t.trackOpenglDesc,
      icon: <Zap className="text-[var(--primary)]" size={32} />,
      level: t.intermediate, // Nível traduzido
      lessons: `22 ${t.lessons}`
    },
    {
      id: "vulkan", // Pasta: /learn/Vulkan
      path: "Vulkan",
      title: "Vulkan API",
      description: t.trackVulkanDesc,
      icon: <Cpu className="text-[var(--primary)]" size={32} />,
      level: t.advanced, // Nível traduzido
      lessons: `12 ${t.lessons}`
    },
    {
      id: "sdl3", // Pasta: /learn/SDL3
      path: "SDL3",
      title: "SDL3 Framework",
      description: t.trackSdlDesc,
      icon: <Globe className="text-[var(--primary)]" size={32} />,
      level: t.beginner, // Nível traduzido
      lessons: `8 ${t.lessons}`
    }
  ];

  

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
      <TriangleParticles />
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <section className="container mx-auto px-6 lg:px-20">
          
          <div className="max-w-3xl mb-16">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
              {t.learnTitle} <span className="text-[var(--primary)]">{t.learnEngine}</span>
            </h1>
            <p className="text-xl text-[var(--text-muted)] leading-relaxed">
              {t.learnSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TRACKS.map((track) => (
              <Card key={track.id} padding="lg" className="flex flex-col h-full border border-[var(--border)]">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                    {track.icon}
                  </div>
                  <Badge text={track.level} />
                </div>

                <h3 className="text-2xl font-bold mb-3 text-[var(--text-main)]">{track.title}</h3>
                <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed flex-grow">
                  {track.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
                    <BookOpen size={16} className="text-[var(--primary)]" />
                    <span>{track.lessons}</span>
                  </div>
                  
                  {/* Redirecionamento para a pasta correta (Case Sensitive conforme você pediu) */}
                  <Link href={`/learn/${track.path}`}>
                    <MyButton text={t.startTrack} className="group flex items-center gap-2" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Banner de IA */}
          <Card padding="lg" className="mt-16 bg-gradient-to-br from-[var(--card)] to-[var(--bg)] border border-[var(--primary)]/20 overflow-hidden relative">
             {/* Efeito de brilho sutil ao fundo */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[var(--primary)] opacity-10 blur-3xl" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="p-5 bg-[var(--primary)] rounded-2xl text-white shadow-lg shadow-[var(--primary)]/30">
                <Zap size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">{t.aiTitle}</h4>
                <p className="text-[var(--text-muted)] max-w-xl">
                  {t.aiDesc}
                </p>
              </div>
              <div className="md:ml-auto">
                <MyButton text={t.notifyMe} variant="outline" />
              </div>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--text-muted)] whitespace-nowrap">
      {text}
    </span>
  );
}