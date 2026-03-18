// components/sections/ProjectsSection.tsx
"use client";

import { useState } from "react";
import ProjectCard from "@/components/cards/ProjectCard";
import ProjectModal from "@/components/modals/ProjectModal";
import BinaryDecoration from "../ui/BinaryDecoration";
import GridDecoration from "../ui/GridDecoration";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus = "completed" | "in-progress" | "archived";

export interface Project {
  title: string;
  shortDescription: string;
  longDescription: string;
  github: string;
  image: string;
  tags: string[];
  codeSnippet: string;
  /** Nome do arquivo exibido no header do snippet (ex: "renderer.cpp") */
  codeFilename: string;
  /** Lista de destaques técnicos específicos deste projeto */
  features: string[];
  /** Uma métrica de impacto concreta (ex: "60 FPS com 1.000+ entidades") */
  metric?: string;
  status: ProjectStatus;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROJECTS_DATA: Project[] = [
  {
    title: "Fractal Engine",
    shortDescription:
      "A lightweight C++ game engine built from scratch with OpenGL, focused on real-time rendering and low-level pipeline control.",
    longDescription:
      "A custom-built rendering framework designed to bypass black-box abstractions. It implements a core renderer, compute shader dispatchers for fractal generation, and a dedicated camera system — focusing on maximizing GPU throughput via memory barriers and tight shader control.",
    github: "https://github.com/GbzR29/fractal-engine",
    image: "/projects/fractal-preview.png",
    tags: ["C++", "OpenGL", "GLSL", "Compute Shaders"],
    codeFilename: "fractal_renderer.cpp",
    codeSnippet: `void FractalRenderer::DispatchCompute(int width, int height) {
    m_ComputeShader->Bind();
    m_ComputeShader->SetUniform2d("u_Center", m_Camera.GetCenter());
    m_ComputeShader->SetUniform1d("u_Zoom",   m_Camera.GetZoom());

    // Dispatch 8×8 local work groups
    glDispatchCompute(width / 8, height / 8, 1);

    // Guarantee write-to-texture completion before sampling
    glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);
}`,
    features: [
      "Compute shader pipeline for GPU-side fractal generation",
      "Custom camera system with smooth zoom & pan",
      "Memory barrier synchronization for safe image writes",
      "Hot-reloadable GLSL shaders without engine restart",
    ],
    metric: "Real-time fractal at 60 FPS on integrated GPU",
    status: "in-progress",
  },
  {
    title: "Void Shooter",
    shortDescription:
      "High-performance 2D space shooter utilizing a custom Entity-Component System (ECS) built with Data-Oriented Design.",
    longDescription:
      "A deep exploration of Data-Oriented Design (DOD). The custom ECS stores components in contiguous memory blocks, guaranteeing cache-friendly iteration and deterministic physics. The result is hundreds of simultaneous entities updated with minimal CPU overhead.",
    github: "https://github.com/GbzR29/void-shooter",
    image: "/projects/void-shooter.jpeg",
    tags: ["C++", "SFML", "ECS", "Data-Oriented Design"],
    codeFilename: "system_manager.cpp",
    codeSnippet: `void SystemManager::UpdateAll(float dt) {
    for (auto& [type, system] : m_Systems) {
        if (!system->IsActive()) continue;

        // Iterating contiguous component pools — cache-friendly
        system->Update(m_Registry, dt);
    }
}`,
    features: [
      "Custom ECS with contiguous memory component pools",
      "Deterministic fixed-step physics simulation",
      "Separation between data layout and game logic",
      "500+ simultaneous entities at stable 60 FPS",
    ],
    metric: "500+ entities at a stable 60 FPS",
    status: "completed",
  },
  {
    title: "Neural Foundations",
    shortDescription:
      "Neural network architectures implemented from scratch in C++, focusing on matrix calculus and backpropagation — zero ML libraries.",
    longDescription:
      "A deep dive into the mathematics of Artificial Intelligence. This project implements feed-forward networks, activation functions, and optimizer algorithms using pure C++ with no external ML libraries. The goal is raw performance and a complete understanding of gradient flow.",
    github: "https://github.com/GbzR29/neural-foundations",
    image: "/projects/neural-foundations.png",
    tags: ["C++", "Linear Algebra", "Machine Learning", "Backpropagation"],
    codeFilename: "layer.cpp",
    codeSnippet: `Matrix Layer::Forward(const Matrix& input) {
    m_LastInput = input;

    // output = Activation( W·x + b )
    m_Z = (m_Weights * input) + m_Bias;
    return Activation::Sigmoid(m_Z);
}

Matrix Layer::Backward(const Matrix& grad) {
    Matrix dA = Activation::SigmoidPrime(m_Z) * grad;
    m_GradW   = dA * m_LastInput.Transpose();
    m_GradB   = dA;
    return m_Weights.Transpose() * dA;
}`,
    features: [
      "Feed-forward network with configurable depth & width",
      "Sigmoid, ReLU, and Tanh activations",
      "SGD and mini-batch gradient descent optimizers",
      "Custom Matrix class — no external linear algebra library",
    ],
    metric: "~97% accuracy on MNIST — pure C++, no libraries",
    status: "completed",
  },
  {
    title: "Virtual Machine",
    shortDescription:
      "A process-level VM and bytecode interpreter simulating a custom Instruction Set Architecture (ISA) with a Fetch-Decode-Execute cycle.",
    longDescription:
      "A low-level emulation project that implements a full Fetch-Decode-Execute cycle from scratch. It features custom registers, a software-managed stack, and a bespoke instruction set to understand how hardware actually interprets binary data.",
    github: "https://github.com/GbzR29/virtual-machine",
    image: "/projects/virtual-machine.png",
    tags: ["C++", "Emulation", "ISA Design", "Systems"],
    codeFilename: "vm.cpp",
    codeSnippet: `void VM::Execute() {
    uint8_t opcode = Fetch();

    switch (opcode) {
        case OP_PUSH: Push(Fetch());          break;
        case OP_ADD:  Push(Pop() + Pop());    break;
        case OP_SUB:  { int b=Pop(), a=Pop(); Push(a-b); } break;
        case OP_CALL: CallFrame(Fetch());     break;
        case OP_HLT:  m_Running = false;     break;
        default:      LogUnknown(opcode);
    }
}`,
    features: [
      "Full Fetch-Decode-Execute cycle implementation",
      "Custom ISA with 16 opcodes (arithmetic, control flow, I/O)",
      "Software-managed call stack with frame isolation",
      "Step-by-step debugger with register/memory inspection",
    ],
    metric: "Custom ISA with 16 opcodes — runs Fibonacci iteratively",
    status: "completed",
  },
];

// ─── Section ──────────────────────────────────────────────────────────────────

export function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section
      id="projects"
      className="px-6 sm:px-10 lg:px-20 py-24 border-t border-white/5 relative overflow-hidden"
    >
      {/* Ambient light */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none translate-y-1/4 -translate-x-1/4 z-0" />

      <BinaryDecoration
        className="absolute top-10 left-10"
        text="01101101 01111001 00100000 01110000 01110010 01101111 01101010 01100101 01100011 01110100 01110011 00100001 "
      />

      <GridDecoration />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Header */}
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Featured <span className="text-[var(--primary)]">Projects</span>
          </h2>
          <p className="text-xl text-[var(--text-muted)]">
            Graphics engines, neural networks, and systems programming — all
            built from scratch.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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