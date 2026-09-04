// src/components/lesson/LessonComponents.tsx
"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useTheme } from "@/components/providers/ThemeProvider";
import { lessonSyntaxTheme } from "@/lib/syntaxTheme";

// ─── Helper ───────────────────────────────────────────────────────────────────
// Always returns a non-empty string. Falls back to `fallback` if t is missing
// or the key doesn't exist.
function tx(t: any, key: string, fallback: string): string {
  const val = t?.[key];
  return val && val.length > 0 ? val : fallback;
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────

export function CodeBlock({
  children, lang = "cpp", filename, t,
}: {
  children: string;
  lang?: string;
  filename?: string;
  t?: any;
}) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] my-6">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          <span className="ml-2 font-mono text-[11px] text-[var(--text-muted)]">
            {filename ?? lang}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors px-2 py-1 rounded border border-transparent hover:border-[var(--border)]"
        >
          {copied ? tx(t, "codeCopied", "✓ copied") : tx(t, "codeCopy", "copy")}
        </button>
      </div>
      <div className="overflow-auto bg-[var(--code-bg)]">
        <SyntaxHighlighter
          language={lang}
          style={lessonSyntaxTheme(theme)}
          showLineNumbers
          lineNumberStyle={{ color: "var(--code-gutter)", fontSize: "0.7rem", minWidth: "2.5em", userSelect: "none" }}
          customStyle={{
            margin: 0,
            padding: "1.25rem 1.25rem 1.25rem 0",
            fontSize: "0.82rem",
            lineHeight: "1.75",
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

// ─── Callout ──────────────────────────────────────────────────────────────────

type CalloutType = "info" | "warn" | "tip";

export function Callout({
  type = "info", children, t,
}: {
  type?: CalloutType;
  children: React.ReactNode;
  t?: any;
}) {
  const config = {
    info: { border: "border-blue-500/30",   bg: "bg-blue-500/5",   labelKey: "calloutNote",    fallback: "NOTE",    color: "text-blue-400"   },
    warn: { border: "border-yellow-500/30", bg: "bg-yellow-500/5", labelKey: "calloutWarning", fallback: "WARNING", color: "text-yellow-400" },
    tip:  { border: "border-green-500/30",  bg: "bg-green-500/5",  labelKey: "calloutTip",     fallback: "TIP",     color: "text-green-400"  },
  }[type];

  return (
    <div className={`my-6 p-4 rounded-xl border ${config.border} ${config.bg}`}>
      <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${config.color} block mb-2`}>
        {tx(t, config.labelKey, config.fallback)}
      </span>
      <div className="text-[var(--text-muted)] text-sm leading-relaxed">{children}</div>
    </div>
  );
}

// ─── InlineCode ───────────────────────────────────────────────────────────────

export function IC({ children }: { children: string }) {
  return (
    <code className="bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--primary)] font-mono text-[0.85em]">
      {children}
    </code>
  );
}

// ─── H2 / H3 ─────────────────────────────────────────────────────────────────
// scroll-mt-28 offsets the fixed navbar so headings aren't hidden when jumped to.

function slug(text: React.ReactNode): string {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      id={slug(children)}
      className="text-2xl font-bold text-[var(--text-main)] pt-6 pb-1 border-b border-[var(--separator)] scroll-mt-28"
    >
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      id={slug(children)}
      className="text-lg font-semibold text-[var(--text-main)] pt-4 scroll-mt-28"
    >
      {children}
    </h3>
  );
}

// ─── Pipeline Diagram ─────────────────────────────────────────────────────────
// Responsive: scrolls horizontally on mobile, fits on desktop.
// Proper English fallbacks so key names never appear.

const PIPELINE_STAGES = [
  { labelKey: "pipelineStageVertex",       labelFallback: "Vertex\nData",        descKey: "pipelineCpuSide",  descFallback: "CPU side",  programmable: false },
  { labelKey: "pipelineStageVShader",      labelFallback: "Vertex\nShader",      descKey: "pipelineGlsl",     descFallback: "GLSL",      programmable: true  },
  { labelKey: "pipelineStagePrimAssembly", labelFallback: "Primitive\nAssembly", descKey: "pipelineDriver",   descFallback: "driver",    programmable: false },
  { labelKey: "pipelineStageGShader",      labelFallback: "Geometry\nShader",    descKey: "pipelineGlslOpt",  descFallback: "GLSL opt",  programmable: true  },
  { labelKey: "pipelineStageRaster",       labelFallback: "Raster\nization",     descKey: "pipelineDriver",   descFallback: "driver",    programmable: false },
  { labelKey: "pipelineStageFShader",      labelFallback: "Fragment\nShader",    descKey: "pipelineGlsl",     descFallback: "GLSL",      programmable: true  },
  { labelKey: "pipelineStageOutput",       labelFallback: "Output\nMerge",       descKey: "pipelineDriver",   descFallback: "driver",    programmable: false },
];

export function PipelineDiagram({ t }: { t?: any }) {
  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-x-auto">
      <div className="flex items-center p-5 gap-1 w-max mx-auto">
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.labelKey} className="flex items-center gap-1">
            {/* Stage box */}
            <div className="relative flex flex-col items-center">
              {/* Programmable badge */}
              {stage.programmable && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-[7px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
                  {tx(t, "pipelineProgrammable", "programmable")}
                </div>
              )}
              <div className={`
                px-3 py-3 rounded-lg border text-center w-[80px] min-h-[64px]
                flex flex-col items-center justify-center
                ${stage.programmable
                  ? "bg-[var(--primary)]/10 border-[var(--primary)]/30"
                  : "bg-[var(--surface)] border-[var(--border)]"
                }
              `}>
                <span className={`
                  text-[9px] font-bold leading-tight whitespace-pre-line text-center
                  ${stage.programmable ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}
                `}>
                  {tx(t, stage.labelKey, stage.labelFallback)}
                </span>
                <div className="text-[7px] text-[var(--text-muted)] opacity-50 mt-1">
                  {tx(t, stage.descKey, stage.descFallback)}
                </div>
              </div>
            </div>
            {/* Arrow between stages */}
            {i < PIPELINE_STAGES.length - 1 && (
              <ChevronRight size={12} className="text-[var(--text-muted)]/40 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NDC Diagram ──────────────────────────────────────────────────────────────

export function NDCDiagram() {
  return (
    <div className="my-6 flex justify-center">
      <div className="relative w-52 h-52 border-2 border-[var(--code-line)] rounded bg-[var(--code-bg)]">
        {/* Grid lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-px bg-[var(--code-line)]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-full w-px bg-[var(--code-line)]" />
        </div>
        {/* Axis labels */}
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-blue-400">+1.0</span>
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-[var(--code-muted)]">-1.0</span>
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 font-mono text-[9px] text-[var(--code-muted)]">-1.0</span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[9px] text-blue-400">+1.0</span>
        <span className="absolute top-1.5 right-2 font-mono text-[8px] text-[var(--code-muted)]">Y</span>
        <span className="absolute bottom-2 right-2 font-mono text-[8px] text-[var(--code-muted)]">X</span>
        {/* Triangle SVG */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
          <polygon
            points="100,30 165,165 35,165"
            fill="rgba(59,130,246,0.12)"
            stroke="rgba(59,130,246,0.7)"
            strokeWidth="1.5"
          />
          <circle cx="100" cy="30"  r="3.5" fill="#3b82f6" />
          <circle cx="165" cy="165" r="3.5" fill="#3b82f6" />
          <circle cx="35"  cy="165" r="3.5" fill="#3b82f6" />
          <text x="104" y="26"  fill="#60a5fa" fontSize="7" fontFamily="monospace">( 0.0, 0.5)</text>
          <text x="168" y="170" fill="#60a5fa" fontSize="7" fontFamily="monospace">( 0.5,-0.5)</text>
          <text x="5"   y="170" fill="#60a5fa" fontSize="7" fontFamily="monospace">(-0.5,-0.5)</text>
        </svg>
      </div>
    </div>
  );
}

// ─── VBO Flow Diagram ─────────────────────────────────────────────────────────

export function VBOFlowDiagram({ t }: { t?: any }) {
  return (
    <div className="my-6 rounded-xl border border-[var(--code-border)] bg-[var(--code-bg)] p-6 overflow-x-auto">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-max mx-auto sm:w-auto">

        <div className="flex flex-col items-center gap-2">
          <div className="text-[9px] font-mono font-bold text-[var(--code-muted)] uppercase tracking-widest mb-1">
            {tx(t, "vboFlowCpuRam", "CPU RAM")}
          </div>
          <div className="border border-[var(--code-border)] rounded-lg px-4 py-3 bg-[var(--code-surface)] text-center">
            <div className="font-mono text-[10px] text-[var(--code-muted)]">float vertices[]</div>
            <div className="font-mono text-[11px] text-[var(--code-text)] mt-1">{"{ -0.5, -0.5, 0.5..."}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-[9px] font-mono text-[var(--primary)] whitespace-nowrap">glBufferData()</div>
          <div className="flex items-center gap-1">
            <div className="h-px w-10 bg-[var(--primary)]/40" />
            <ChevronRight size={12} className="text-[var(--primary)]" />
          </div>
          <div className="text-[8px] font-mono text-[var(--code-muted)] opacity-80">
            {tx(t, "vboFlowUpload", "upload")}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-[9px] font-mono font-bold text-[var(--primary)] uppercase tracking-widest mb-1">
            {tx(t, "vboFlowGpuVram", "GPU VRAM")}
          </div>
          <div className="border border-[var(--primary)]/30 rounded-lg px-4 py-3 bg-[var(--primary)]/5 text-center">
            <div className="font-mono text-[10px] text-[var(--primary)]">VBO #1</div>
            <div className="font-mono text-[11px] text-[var(--code-text)] mt-1">[ vertex buffer ]</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-[9px] font-mono text-green-400 whitespace-nowrap">glDrawArrays()</div>
          <div className="flex items-center gap-1">
            <div className="h-px w-10 bg-green-500/40" />
            <ChevronRight size={12} className="text-green-400" />
          </div>
          <div className="text-[8px] font-mono text-[var(--code-muted)] opacity-80">
            {tx(t, "vboFlowDrawCall", "draw call")}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-[9px] font-mono font-bold text-green-400 uppercase tracking-widest mb-1">
            {tx(t, "vboFlowVertexShader", "Vertex Shader")}
          </div>
          <div className="border border-green-500/30 rounded-lg px-4 py-3 bg-green-500/5 text-center">
            <div className="font-mono text-[10px] text-green-400">gl_Position</div>
            <div className="font-mono text-[11px] text-[var(--code-text)] mt-1">
              {tx(t, "vboFlowVertexPos", "= vertex pos")}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── VAO Diagram ──────────────────────────────────────────────────────────────

export function VAODiagram({ t }: { t?: any }) {
  return (
    <div className="my-6 rounded-xl border border-[var(--code-border)] bg-[var(--code-bg)] p-5">
      <div className="text-[9px] font-mono font-bold text-[var(--code-muted)] uppercase tracking-widest text-center mb-4">
        {tx(t, "vaoDiagramTitle", "VAO records bindings so you can replay them with one call")}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

        <div className="border-2 border-[var(--primary)]/40 rounded-xl p-4 bg-[var(--primary)]/5 text-center min-w-[130px]">
          <div className="font-mono text-[10px] font-bold text-[var(--primary)] mb-3">VAO</div>
          <div className="space-y-1.5">
            <div className="text-[9px] font-mono text-[var(--code-muted)] text-left">
              {tx(t, "vaoAttrib0", "attrib 0 → VBO #1")}
            </div>
            <div className="text-[9px] font-mono text-[var(--code-muted)] text-left">
              {tx(t, "vaoAttrib1", "attrib 1 → VBO #1")}
            </div>
            <div className="text-[9px] font-mono text-[var(--code-muted)] text-left">
              {tx(t, "vaoIndices", "indices → EBO #1")}
            </div>
          </div>
        </div>

        <div className="font-mono text-[var(--code-muted)] text-xs">
          {tx(t, "vaoBindOnce", "bind once")}
        </div>

        <div className="flex flex-col gap-2">
          <div className="border border-[var(--code-border)] rounded-lg px-4 py-2 bg-[var(--code-surface)] font-mono text-[10px] text-[var(--code-text)] text-center">
            {tx(t, "vaoVboPositions", "VBO #1 (positions)")}
          </div>
          <div className="border border-[var(--code-border)] rounded-lg px-4 py-2 bg-[var(--code-surface)] font-mono text-[10px] text-[var(--code-text)] text-center">
            {tx(t, "vaoVboTexCoords", "VBO #2 (tex coords)")}
          </div>
          <div className="border border-[var(--code-border)] rounded-lg px-4 py-2 bg-[var(--code-surface)] font-mono text-[10px] text-[var(--code-text)] text-center">
            {tx(t, "vaoEboIndices", "EBO #1 (indices)")}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── LessonTable ──────────────────────────────────────────────────────────────

export function LessonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-widest">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--separator)]">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 text-xs ${j === 0 ? "font-mono text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MathBlock ─────────────────────────────────────────────────────────────────
// Renders a mathematical formula with optional GLSL and GLM code equivalents.

export function MathBlock({
  children,
  label,
  glsl,
  glm,
}: {
  children: React.ReactNode;
  label?: string;
  glsl?: string;
  glm?: string;
}) {
  return (
    <div className="my-5 rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 bg-[var(--surface)]">
        <span className="text-[var(--primary)] font-mono text-base flex-shrink-0 mt-0.5 opacity-50 select-none">∑</span>
        <div className="min-w-0 flex-1">
          {label && (
            <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">{label}</div>
          )}
          <div className="font-mono text-[var(--text-main)] text-sm leading-loose">{children}</div>
        </div>
      </div>
      {(glsl || glm) && (
        <div className="border-t border-[var(--code-border)] bg-[var(--code-bg)] px-5 py-3 space-y-1.5">
          {glsl && (
            <div className="flex items-baseline gap-3">
              <span className="text-[9px] font-mono text-emerald-400/60 uppercase tracking-widest flex-shrink-0 w-10">GLSL</span>
              <code className="font-mono text-[11px] text-[var(--code-text)]">{glsl}</code>
            </div>
          )}
          {glm && (
            <div className="flex items-baseline gap-3">
              <span className="text-[9px] font-mono text-blue-400/60 uppercase tracking-widest flex-shrink-0 w-10">GLM</span>
              <code className="font-mono text-[11px] text-[var(--code-text)]">{glm}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Matrix4x4 ────────────────────────────────────────────────────────────────
// Visual 4×4 matrix for math explanations.

export function Matrix4x4({
  data,
  label,
}: {
  data: (string | number)[][];
  label?: string;
}) {
  return (
    <div className="inline-flex flex-col items-center">
      {label && (
        <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2 text-center">
          {label}
        </span>
      )}
      <div className="flex items-stretch gap-0">
        {/* Left bracket via borders */}
        <div className="border-l-2 border-t-2 border-b-2 border-[var(--border-strong)] w-2.5 rounded-l" />
        <div className="px-3 py-2 flex flex-col gap-0.5">
          {data.map((row, i) => (
            <div key={i} className="flex gap-3">
              {row.map((cell, j) => (
                <span
                  key={j}
                  className={`font-mono text-[11px] text-right leading-5 min-w-[3ch] ${
                    cell === 0 || cell === "0"
                      ? "text-[var(--text-muted)] opacity-25"
                      : cell === 1 || cell === "1"
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-main)]"
                  }`}
                >
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
        {/* Right bracket */}
        <div className="border-r-2 border-t-2 border-b-2 border-[var(--border-strong)] w-2.5 rounded-r" />
      </div>
    </div>
  );
}