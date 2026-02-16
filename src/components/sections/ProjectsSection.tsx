// components/sections/ProjectsSection.tsx
"use client";

import { useState } from "react";
import ProjectCard from "@/components/cards/ProjectCard";
import ProjectModal from "@/components/modals/ProjectModal"; // Ajuste o import conforme onde criou
import BinaryDecoration from "../ui/BinaryDecoration";
import GridDecoration from "../ui/GridDecoration";

// Types
export interface Project {
  title: string;
  shortDescription: string;
  longDescription: string;
  github: string;
  image: string; // Caminho da imagem na pasta public
  tags: string[];
  codeSnippet: string; // O código C++ para mostrar
}

const PROJECTS_DATA: Project[] = [
  {
    title: "Fractal Engine",
    shortDescription: "A lightweight C++ game engine built from scratch with OpenGL, focused on real-time rendering and low-level pipeline control.",
    longDescription: "A custom-built rendering framework designed to bypass black-box abstractions. It implements a core renderer, compute shader dispatchers for fractal generation, and a dedicated camera system, focusing on maximizing GPU throughput and memory barriers.",
    github: "https://github.com/GbzR29/fractal-engine",
    image: "/projects/fractal-preview.png", 
    tags: ["C++", "OpenGL", "GLSL", "Compute Shaders"],
    codeSnippet: `void FractalRenderer::DispatchCompute(int width, int height) {
    m_ComputeShader->Bind();
    m_ComputeShader->SetUniform2d("u_Center", m_Camera.GetCenter());
    m_ComputeShader->SetUniform1d("u_Zoom", m_Camera.GetZoom());
    
    // Dispatch work groups (8x8 local size)
    glDispatchCompute(width / 8, height / 8, 1);
    
    // Ensure write-to-texture completion before sampling
    glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);
}`
  },
  {
    title: "Void Shooter",
    shortDescription: "High-performance 2D space shooter utilizing a custom Entity-Component System (ECS).",
    longDescription: "A project exploring Data-Oriented Design (DOD). By using a custom ECS, the game ensures cache-friendly component updates and deterministic physics, handling hundreds of entities with minimal CPU overhead.",
    github: "https://github.com/GbzR29/void-shooter",
    image: "/projects/void-shooter.jpeg",
    tags: ["C++", "SFML", "ECS", "Data-Oriented Design"],
    codeSnippet: `void SystemManager::UpdateAll(float dt) {
    for (auto& [type, system] : m_Systems) {
        if (system->IsActive()) {
            // Processing contiguous memory blocks for cache efficiency
            system->Update(m_Registry, dt);
        }
    }
}`
  },
  {
    title: "Neural Foundations",
    shortDescription: "Neural network architectures implemented from scratch in C++, focusing on matrix calculus and backpropagation.",
    longDescription: "A deep dive into the mathematics of Artificial Intelligence. This project implements feed-forward networks, activation functions, and optimizer algorithms using pure C++ without external ML libraries, focusing on raw performance and logic.",
    github: "https://github.com/GbzR29/neural-foundations",
    image: "/projects/neural-foundations.png",
    tags: ["C++", "Linear Algebra", "Machine Learning", "Optimization"],
    codeSnippet: `Matrix Layer::Forward(const Matrix& inputs) {
    m_LastInput = inputs;
    // Layer transformation: output = Activation(Weights * Input + Bias)
    m_Z = (m_Weights * inputs) + m_Bias;
    return Activation::Sigmoid(m_Z);
}`
  },
  {
    title: "Virtual Machine",
    shortDescription: "A process-level VM and bytecode interpreter simulating a custom Instruction Set Architecture (ISA).",
    longDescription: "A low-level emulation project that implements a full Fetch-Decode-Execute cycle. It features custom registers, a software-managed stack, and a bespoke instruction set to understand how hardware interprets binary data.",
    github: "https://github.com/GbzR29/virtual-machine",
    image: "/projects/virtual-machine.png",
    tags: ["C++", "Emulation", "Assembly", "Architecture"],
    codeSnippet: `void VM::Execute() {
    uint8_t opcode = m_Memory[m_PC++];
    switch (opcode) {
        case OP_PUSH: Push(m_Memory[m_PC++]); break;
        case OP_ADD:  int a = Pop(); int b = Pop(); Push(a + b); break;
        case OP_HLT:  m_Running = false; break;
        default:      LogUnknownOp(opcode);
    }
}`
  },
];

export function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section 
      id="projects" 
      className="px-6 sm:px-10 lg:px-20 py-24 border-t border-white/5 relative overflow-hidden"
    >      
      {/* Luz no Canto Inferior Esquerdo */}
      <div 
        className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none translate-y-1/4 -translate-x-1/4 z-0" 
      />
      {/* ------------------------------------- */}

      <BinaryDecoration 
        className="absolute top-10 left-10" 
        text="01101101 01111001 00100000 01110000 01110010 01101111 01101010 01100101 01100011 01110100 01110011 00100001 " 
      />
      
      <GridDecoration />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        
        {/* Cabeçalho da Seção */}
        <div className="space-y-4 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Featured <span className="text-[var(--primary)]">Projects</span>
            </h2>
            <p className="text-xl text-[var(--text-muted)]">
                A collection of graphics engines, neural networks, and system architecture experiments implemented from scratch.
            </p>
        </div>

        {/* Grid de Projetos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
          {PROJECTS_DATA.map((project) => (
            <ProjectCard 
                key={project.title} 
                project={project} 
                onClick={() => setSelectedProject(project)} 
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedProject && (
        <ProjectModal 
            project={selectedProject} 
            isOpen={!!selectedProject} 
            onClose={() => setSelectedProject(null)} 
        />
      )}
    </section>
  );
}