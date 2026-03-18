// components/modals/ProjectModal.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Terminal, GitBranch, Zap, CheckCircle2, Clock, Archive } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { Project, ProjectStatus } from "@/components/sections/ProjectsSection";
import { MyButton } from "@/components/ui/Button";
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
    icon: <CheckCircle2 size={12} />,
  },
  "in-progress": {
    label: "In Progress",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: <Clock size={12} />,
  },
  archived: {
    label: "Archived",
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/20",
    icon: <Archive size={12} />,
  },
};

// ─── Screenshot Placeholder ────────────────────────────────────────────────────
// Visually compelling placeholder shown when no real screenshot exists yet.
// Uses SVG patterns + project metadata so each project looks unique.

function ScreenshotPlaceholder({ project }: { project: Project }) {
  // Pick a deterministic "primary tag" for display
  const primaryTag = project.tags[0] ?? "C++";
  const initials = project.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);

  return (
    <div className="relative w-full h-full bg-[#0a0e1a] overflow-hidden flex flex-col items-center justify-center gap-3 select-none">
      {/* Grid pattern background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`grid-${project.title}`}
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${project.title})`} />
      </svg>

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500/40" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500/40" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500/40" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500/40" />

      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(59,130,246,0.08),transparent)]" />

      {/* Monogram */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex items-center justify-center">
          <span className="font-mono text-xl font-bold text-blue-400/80">
            {initials}
          </span>
        </div>
        <span className="font-mono text-[10px] text-blue-400/60 uppercase tracking-[0.25em]">
          {primaryTag}
        </span>
        <span className="font-mono text-[9px] text-white/20 tracking-wider">
          PREVIEW UNAVAILABLE
        </span>
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

export default function ProjectModal({
  project,
  isOpen,
  onClose,
}: ProjectModalProps) {
  // Lock scroll + ESC key
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const status = STATUS_CONFIG[project.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] flex flex-col md:flex-row bg-[var(--bg)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── LEFT: Visual + Code ─────────────────────────────────────────── */}
        <div className="w-full md:w-[45%] flex-shrink-0 bg-black/30 border-b md:border-b-0 md:border-r border-white/10 flex flex-col overflow-hidden">

          {/* Screenshot */}
          <div className="h-44 sm:h-52 md:h-[45%] flex-shrink-0 relative">
            <ScreenshotPlaceholder project={project} />
          </div>

          {/* Code snippet (desktop only) */}
          <div className="hidden md:flex flex-col flex-1 overflow-hidden bg-[#0d1117]">
            {/* Snippet header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.03] flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Terminal size={13} className="text-blue-400/70" />
                <span className="font-mono">{project.codeFilename}</span>
              </div>
              {/* Faux traffic lights */}
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
              </div>
            </div>
            {/* Code */}
            <div className="flex-1 overflow-auto">
              <SyntaxHighlighter
                language="cpp"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "1.25rem",
                  fontSize: "0.78rem",
                  lineHeight: "1.6",
                  backgroundColor: "transparent",
                }}
              >
                {project.codeSnippet}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Content ──────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-6 md:p-7 pb-4 flex-shrink-0">
            <div className="space-y-3 flex-1 min-w-0 pr-4">
              {/* Status badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${status.bg} ${status.color}`}
              >
                {status.icon}
                {status.label}
              </div>

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {project.title}
              </h3>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[10px] font-mono font-medium rounded border border-[var(--primary)]/25 text-[var(--primary)] bg-[var(--primary)]/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Close button (desktop) */}
            <button
              onClick={onClose}
              className="hidden md:flex p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <X size={22} className="text-gray-400" />
            </button>
          </div>

          {/* Close button (mobile) */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-50 p-2 bg-black/50 backdrop-blur-md rounded-full text-white md:hidden border border-white/10"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col flex-1 px-6 md:px-7 gap-5 pb-6 md:pb-7">
            {/* Metric card — only shown if project has a concrete metric */}
            {project.metric && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                  <Zap size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/70 mb-0.5">
                    Key Result
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {project.metric}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              {project.longDescription}
            </p>

            {/* Features */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GitBranch size={15} className="text-[var(--primary)]" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Technical Highlights
                </h4>
              </div>
              <ul className="space-y-2">
                {project.features.map((feat, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]"
                  >
                    {/* Monospaced index */}
                    <span className="font-mono text-[10px] text-blue-400/50 mt-0.5 flex-shrink-0 w-4">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* GitHub button — pinned to bottom */}
            <div className="mt-auto pt-4 border-t border-white/5">
              <Link href={project.github} target="_blank" rel="noopener noreferrer">
                <MyButton
                  text="View on GitHub"
                  icon={<SiGithub size={17} />}
                  className="w-full justify-center py-5"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}