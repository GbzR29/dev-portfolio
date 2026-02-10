"use client";

import { Card } from "@/components/ui/Card";
import { ArrowUpRight } from "lucide-react";
import { Project } from "../sections/ProjectsSection";
import Image from "next/image";

interface Props {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: Props) {
  return (
    <div onClick={onClick} className="group cursor-pointer h-full">
      <Card 
        padding="none" 
        className="h-full flex flex-col overflow-hidden border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors bg-[var(--card)]"
      >
        <div className="h-48 relative overflow-hidden border-b border-[var(--border)]">
          
          <Image 
            src={project.image}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          <div className="absolute inset-0 bg-black/40 group-hover:bg-[var(--primary)]/10 transition-colors z-10" />

          <div className="absolute bottom-2 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[var(--primary)] text-[10px] font-mono bg-black/80 px-2 py-1 rounded border border-[var(--primary)]/30">
              EXEC: {project.title.toUpperCase()}.EXE
            </span>
          </div>
        </div>


        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white group-hover:text-[var(--primary)] transition-colors">
              {project.title}
            </h3>
            <ArrowUpRight className="text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" size={20} />
          </div>

          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 line-clamp-2">
            {project.shortDescription}
          </p>

          <div className="mt-auto flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs font-mono text-[var(--text-muted)] bg-white/5 px-2 py-1 rounded border border-white/5">
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-xs font-mono text-[var(--text-muted)] px-2 py-1">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}