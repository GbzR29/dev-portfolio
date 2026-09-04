"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import { ArrowUpRight, CheckCircle2, Clock, Archive, Zap } from "lucide-react";
import { Project, ProjectStatus } from "../sections/ProjectsSection";
import Image from "next/image";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-black/60 border-emerald-500/30",
    icon: <CheckCircle2 size={10} />,
  },
  "in-progress": {
    label: "In Progress",
    color: "text-blue-400",
    bg: "bg-black/60 border-blue-500/30",
    icon: <Clock size={10} />,
  },
  archived: {
    label: "Archived",
    color: "text-gray-400",
    bg: "bg-black/60 border-gray-500/30",
    icon: <Archive size={10} />,
  },
};

// ─── Image placeholder ─────────────────────────────────────────────────────────

function CardPlaceholder({ project }: { project: Project }) {
  const initials = project.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);

  return (
    <div className="absolute inset-0 bg-[var(--code-bg)] flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`card-grid-${project.title}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#card-grid-${project.title})`} />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(59,130,246,0.07),transparent)]" />
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-xl border border-blue-500/25 bg-blue-500/5 flex items-center justify-center">
          <span className="font-mono text-base font-bold text-blue-400/70">{initials}</span>
        </div>
        <span className="font-mono text-[8px] text-[var(--code-muted)] opacity-60 tracking-widest uppercase">preview unavailable</span>
      </div>
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────

interface Props {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: Props) {
  const [imgError, setImgError] = useState(false);
  const status = STATUS_CONFIG[project.status];

  return (
    <div onClick={onClick} className="group cursor-pointer h-full">
      <Card
        padding="none"
        className="h-full flex flex-col overflow-hidden border border-[var(--border)] hover:border-[var(--primary)]/40 transition-all duration-300 bg-[var(--card)]"
      >
        {/* Image area */}
        <div className="h-48 relative overflow-hidden border-b border-[var(--border)]">

          {!imgError ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              onError={() => setImgError(true)}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <CardPlaceholder project={project} />
          )}

          {/* Hover tint */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-[var(--primary)]/10 transition-colors duration-300 z-10" />

          {/* Status badge — top right */}
          <div className={`absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 px-2 py-1 rounded-full border backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest ${status.bg} ${status.color}`}>
            {status.icon}
            {status.label}
          </div>

          {/* EXEC label on hover */}
          <div className="absolute bottom-2 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[var(--primary)] text-[9px] font-mono bg-black/80 px-2 py-1 rounded border border-[var(--primary)]/30 backdrop-blur-sm">
              EXEC: {project.title.toUpperCase().replace(/ /g, "_")}.EXE
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors leading-tight pr-2">
              {project.title}
            </h3>
            <ArrowUpRight
              className="text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"
              size={18}
            />
          </div>

          <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4 line-clamp-2">
            {project.shortDescription}
          </p>

          <div className="mt-auto space-y-3">
            {/* Tech tags */}
            <div className="flex flex-wrap gap-1.5">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-[11px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 opacity-60">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>

            {/* Key metric */}
            {project.metric && (
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--separator)]">
                <Zap size={11} className="text-[var(--highlight)] flex-shrink-0" />
                <span className="text-[11px] font-mono text-[var(--highlight)] line-clamp-1 opacity-80">
                  {project.metric}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
