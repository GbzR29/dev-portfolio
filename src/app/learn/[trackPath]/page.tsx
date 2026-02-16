"use client";

import Navbar from "@/components/navbar/Navbar";
import { LessonSidebar } from "@/components/sidebar/LessonSidebar";
import Card from "@/components/ui/Card";
import { useParams, useRouter } from "next/navigation"; 
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useEffect } from "react";

// Definimos os dados das trilhas. 
// O campo 'renderContent' é uma função que retorna o JSX da aula.
const TRACK_DATA: Record<string, any> = {
    "C++": {
        title: "Modern C++",
        chapters: [
            { id: "intro", title: "Memory Management" }, 
            { id: "templates", title: "Templates" }
        ],
        renderContent: () => (
            <article className="prose prose-invert max-w-none space-y-8 text-[var(--text-muted)]">
                <p className="text-lg leading-relaxed">
                    Welcome to the Modern C++ track. Here we will explore memory safety, 
                    RAII, and high-performance computing.
                </p>
            </article>
        )
    },
    "OpenGL": {
        title: "OpenGL 4.6",
        chapters: [
            { id: "intro", title: "Hello Triangle" }, 
            { id: "vbo", title: "Vertex Buffer Objects" },
            { id: "vao", title: "Vertex Array Objects" },
            { id: "shaders", title: "First Shaders" },
            { id: "draw", title: "Drawing the Triangle" },
        ],
        renderContent: () => (
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

                <div className="bg-[#0d1117] p-4 rounded-xl font-mono text-sm border border-[var(--border)]">
                    <span className="text-gray-500">// Triangle vertices</span><br/>
                    <span className="text-[#ff7b72]">float</span> vertices[] = &#123; <br/>
                    &nbsp;&nbsp;<span className="text-[#79c0ff]">-0.5f, -0.5f, 0.0f</span>,<br/>
                    &nbsp;&nbsp;<span className="text-[#79c0ff]"> 0.5f, -0.5f, 0.0f</span>,<br/>
                    &nbsp;&nbsp;<span className="text-[#79c0ff]"> 0.0f,  0.5f, 0.0f</span><br/>
                    &#125;;
                </div>
            </article>
        )
    }
};

export default function LessonPage() {
    const router = useRouter();
    const params = useParams();
    const { t } = useLanguage();

    // Decodifica o path (ex: C%2B%2B -> C++)
    const trackPath = params?.trackPath ? decodeURIComponent(params.trackPath as string) : "";
    const currentTrack = TRACK_DATA[trackPath];

    // Redirecionamento caso a trilha não exista (ex: Vulkan ainda não mapeado)
    useEffect(() => {
        if (!currentTrack && trackPath !== "undefined") {
            router.push("/status?type=development&from=learn");
        }
    }, [currentTrack, router, trackPath]);

    if (!currentTrack) return null;

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)]">
            <Navbar />
            
            <div className="container mx-auto px-6 lg:px-20 pt-32 pb-20">
                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* Sidebar dinâmica com os capítulos da trilha atual */}
                    <LessonSidebar chapters={currentTrack.chapters} />

                    <main className="flex-1 max-w-4xl">
                        <header className="mb-10">
                            <span className="text-[var(--primary)] font-bold text-sm uppercase tracking-widest">
                                {currentTrack.title}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-extrabold mt-2">
                                {/* Mostra o título do primeiro capítulo como título da página por enquanto */}
                                {currentTrack.chapters[0].title}
                            </h1>
                        </header>

                        {/* Chama a função de renderização do conteúdo */}
                        {currentTrack.renderContent()}
                    </main>

                </div>
            </div>
        </div>
    );
}