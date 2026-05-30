// components/modals/ProjectModal.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X, Terminal, Zap, CheckCircle2, Clock, Archive,
  Code2, BookOpen, Wrench, ExternalLink,
} from "lucide-react";
import { SiGithub, SiCplusplus, SiOpengl, SiVulkan } from "react-icons/si";
import { Project, ProjectStatus } from "@/components/sections/ProjectsSection";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: <CheckCircle2 size={11} />,
  },
  "in-progress": {
    label: "In Progress",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: <Clock size={11} />,
  },
  archived: {
    label: "Archived",
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/20",
    icon: <Archive size={11} />,
  },
};

// ─── Tech icon map ─────────────────────────────────────────────────────────────

const TECH_ICONS: Record<string, React.ReactNode> = {
  "C++":    <SiCplusplus size={13} />,
  "OpenGL": <SiOpengl    size={13} />,
  "Vulkan": <SiVulkan    size={13} />,
};

// ─── Screenshot with fallback ──────────────────────────────────────────────────

function ScreenshotPlaceholder({ project }: { project: Project }) {
  const initials = project.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
  const primaryTag = project.tags[0] ?? "C++";

  return (
    <div className="absolute inset-0 bg-[var(--code-bg)] flex flex-col items-center justify-center gap-3 select-none">
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`modal-grid-${project.title}`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#modal-grid-${project.title})`} />
      </svg>
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-blue-500/30" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-blue-500/30" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-blue-500/30" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-blue-500/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(59,130,246,0.08),transparent)]" />
      <div className="relative z-10 flex flex-col items-center gap-2.5">
        <div className="w-14 h-14 rounded-2xl border border-blue-500/25 bg-blue-500/5 flex items-center justify-center">
          <span className="font-mono text-lg font-bold text-blue-400/70">{initials}</span>
        </div>
        <span className="font-mono text-[9px] text-blue-400/50 uppercase tracking-[0.25em]">{primaryTag}</span>
        <span className="font-mono text-[8px] text-white/15 tracking-wider">PREVIEW UNAVAILABLE</span>
      </div>
    </div>
  );
}

function ProjectImage({ project }: { project: Project }) {
  const [error, setError] = useState(false);
  if (error) return <ScreenshotPlaceholder project={project} />;
  return (
    <Image
      src={project.image}
      alt={project.title}
      fill
      onError={() => setError(true)}
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 45vw"
    />
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

type TabId = "overview" | "code" | "technical";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "Overview",  icon: <BookOpen size={12} /> },
  { id: "code",      label: "Code",      icon: <Terminal size={12} /> },
  { id: "technical", label: "Technical", icon: <Wrench   size={12} /> },
];

// ─── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ project }: { project: Project }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 md:p-7">

      {/* Screenshot */}
      <div className="w-full md:w-[42%] flex-shrink-0">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[var(--border)]">
          <ProjectImage project={project} />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Description */}
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          {project.longDescription}
        </p>

        {/* Key result */}
        {project.metric && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--highlight-low)] border border-[var(--highlight)]/20">
            <div className="p-1.5 rounded-lg bg-[var(--highlight)]/10 flex-shrink-0">
              <Zap size={14} className="text-[var(--highlight)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--highlight)]/60 mb-0.5">
                Key Result
              </p>
              <p className="text-sm font-semibold text-[var(--text-main)]">{project.metric}</p>
            </div>
          </div>
        )}

        {/* Tech stack */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2.5">
            Stack
          </p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-lg border border-[var(--primary)]/20 text-[var(--primary)] bg-[var(--primary)]/5"
              >
                {TECH_ICONS[tag] ?? null}
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Code tab ──────────────────────────────────────────────────────────────────

function CodeTab({ project }: { project: Project }) {
  return (
    <div className="flex flex-col h-full min-h-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Terminal size={12} className="text-blue-400/70" />
            <span className="font-mono">{project.codeFilename}</span>
          </div>
        </div>
        <Code2 size={13} className="text-white/20" />
      </div>

      {/* Syntax highlighted code */}
      <div className="overflow-auto bg-[var(--code-bg)]">
        <SyntaxHighlighter
          language="cpp"
          style={vscDarkPlus}
          showLineNumbers
          lineNumberStyle={{ color: "#4b5563", fontSize: "0.7rem", minWidth: "2.5em" }}
          customStyle={{
            margin: 0,
            padding: "1.5rem 1.5rem 1.5rem 0",
            fontSize: "0.82rem",
            lineHeight: "1.75",
            backgroundColor: "transparent",
          }}
        >
          {project.codeSnippet}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

// ─── Technical tab ─────────────────────────────────────────────────────────────

function TechnicalTab({ project }: { project: Project }) {
  return (
    <div className="p-6 md:p-7 space-y-6">
      <p className="text-[var(--text-muted)] text-sm leading-relaxed">
        {project.longDescription}
      </p>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4">
          Technical Highlights
        </p>
        <ul className="space-y-3">
          {project.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-3 group/feat">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[var(--primary)]/8 border border-[var(--primary)]/20 flex items-center justify-center font-mono text-[9px] font-bold text-[var(--primary)] mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-[var(--text-muted)] leading-relaxed group-hover/feat:text-[var(--text-main)] transition-colors">
                {feat}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────

interface ProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Lock scroll + ESC key
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // Reset to overview when project changes
  useEffect(() => { setActiveTab("overview"); }, [project.title]);

  if (!isOpen) return null;

  const status = STATUS_CONFIG[project.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 md:px-7 pt-6 pb-4 flex-shrink-0 border-b border-[var(--separator)]">
          <div className="space-y-2 flex-1 min-w-0 pr-4">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${status.bg} ${status.color}`}>
              {status.icon}
              {status.label}
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)] leading-tight">
              {project.title}
            </h3>
            <p className="text-sm text-[var(--text-muted)] line-clamp-1">
              {project.shortDescription}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--primary-low)] transition-colors flex-shrink-0 mt-1"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 px-6 md:px-7 pt-3 flex-shrink-0 border-b border-[var(--separator)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg
                transition-all border-b-2 -mb-px
                ${activeTab === tab.id
                  ? "text-[var(--primary)] border-[var(--primary)] bg-[var(--primary)]/5"
                  : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)] hover:bg-[var(--surface)]"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "overview"  && <OverviewTab  project={project} />}
          {activeTab === "code"      && <CodeTab      project={project} />}
          {activeTab === "technical" && <TechnicalTab project={project} />}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 md:px-7 py-4 border-t border-[var(--separator)] flex-shrink-0 bg-[var(--surface)]/40">
          <Link href={project.github} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold text-[var(--text-main)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)] transition-all">
              <SiGithub size={16} />
              GitHub
            </button>
          </Link>

          {project.demoUrl && (
            <Link href={project.demoUrl} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                <ExternalLink size={14} />
                Live Demo
              </button>
            </Link>
          )}

          {/* Tags — só desktop, pinned right */}
          <div className="ml-auto hidden sm:flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-mono rounded border border-[var(--primary)]/15 text-[var(--primary)]/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
