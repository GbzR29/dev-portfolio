"use client";

import ProjectCard from "@/components/cards/ProjectCard";

export function ProjectsSection() {
  const projects = [
    {
      title: "Fractal Engine",
      description:
        "A minimal C++ rendering engine focused on real time fractal generation, clean architecture, and low level control using OpenGL.",
      github: "https://github.com/gabrielzin/fractal-engine",
    },
    {
      title: "Void Shooter",
      description:
        "A minimal 2D space shooter in C++ and SFML exploring entity component design, deterministic game loops, and real time state management.",
      github: "https://github.com/gabrielzin/void-shooter",
    },
    {
      title: "Neural Foundations",
      description:
        "A collection of neural network architectures implemented from scratch in C++, focusing on pure mathematical logic and performance.",
      github: "https://github.com/gabrielzin/neural-foundations",
    },
    {
      title: "Virtual Machine",
      description:
        "A minimal C++ virtual machine and bytecode interpreter focused on CPU emulation, memory management, and custom instruction set design.",
      github: "https://github.com/gabrielzin/vm-project",
    },
  ];

  return (
    <section
      id="projects"
      className="
        px-6 sm:px-10 lg:px-20
        py-24
        border-t border-white/5
      "
    >
      <div className="max-w-6xl mx-auto space-y-12">

        <h2 className="text-4xl font-bold">Projects</h2>

        {/* grid 2 colunas como na imagem */}
        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>

      </div>
    </section>
  );
}
