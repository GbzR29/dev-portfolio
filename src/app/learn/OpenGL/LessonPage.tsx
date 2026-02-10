"use client";

import Navbar from "@/components/navbar/Navbar";
import { LessonSidebar } from "@/components/sidebar/LessonSidebar";
import { Card } from "@/components/ui/Card";

// Mock de capítulos (isso viria do seu MDX ou Database)
const CHAPTERS = [
  { id: "intro", title: "Introduction" },
  { id: "vbo", title: "Vertex Buffer Objects" },
  { id: "vao", title: "Vertex Array Objects" },
  { id: "shaders", title: "First Shaders" },
  { id: "draw", title: "Drawing the Triangle" },
];

export default function LessonPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)]">
      <Navbar />

      <div className="container mx-auto px-6 lg:px-20 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* 1. Sidebar (Esquerda) */}
          <LessonSidebar chapters={CHAPTERS} />

          {/* 2. Conteúdo Principal (Direita) */}
          <main className="flex-1 max-w-4xl">
            <header className="mb-10">
              <span className="text-[var(--primary)] font-bold text-sm uppercase tracking-widest">
                OpenGL 4.6
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold mt-2">
                Hello Triangle
              </h1>
            </header>

            <article className="prose prose-invert max-w-none space-y-8 text-[var(--text-muted)]">
              <p className="text-lg leading-relaxed">
                In OpenGL, everything is in 3D space, but the screen is a 2D pixel array. 
                The process of transforming 3D coordinates to 2D pixels is managed by the 
                <strong> Graphics Pipeline</strong>.
              </p>

              <Card padding="lg" className="border border-[var(--border)]">
                <h3 className="text-xl font-bold mb-4 text-[var(--text-main)]">The Pipeline Flow</h3>
                <p className="mb-4">
                  Before we draw, we must understand how data travels from our C++ code to the GPU.
                </p>
                
              </Card>

              <h2 className="text-2xl font-bold text-[var(--text-main)] pt-6">Vertex Input</h2>
              <p>
                To start drawing, we first have to give OpenGL some input vertex data. 
                OpenGL is a 3D graphics library, so all coordinates are in 3D (x, y, and z).
              </p>

              {/* Aqui você usaria o CodeSnippet que criamos antes */}
              <div className="bg-[#0d1117] p-4 rounded-xl font-mono text-sm border border-[var(--border)]">
                <span className="text-gray-500">// Triangle vertices</span><br/>
                float vertices[] = &#123; <br/>
                &nbsp;&nbsp;-0.5f, -0.5f, 0.0f,<br/>
                &nbsp;&nbsp; 0.5f, -0.5f, 0.0f,<br/>
                &nbsp;&nbsp; 0.0f,  0.5f, 0.0f<br/>
                &#125;;
              </div>
            </article>
          </main>

        </div>
      </div>
    </div>
  );
}