// src/components/lesson/LessonComponents.tsx
"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

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

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 my-6">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/10">
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
          className="text-[10px] font-mono text-[var(--text-muted)] hover:text-white transition-colors px-2 py-1 rounded border border-transparent hover:border-white/10"
        >
          {copied ? tx(t, "codeCopied", "✓ copied") : tx(t, "codeCopy", "copy")}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto bg-[#0d1117] text-sm leading-relaxed">
        <code className="font-mono text-[#e6edf3] whitespace-pre">{children}</code>
      </pre>
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
    <code className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-blue-300 font-mono text-[0.85em]">
      {children}
    </code>
  );
}

// ─── H2 / H3 ─────────────────────────────────────────────────────────────────

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-[var(--text-main)] pt-6 pb-1 border-b border-white/5">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-[var(--text-main)] pt-4">{children}</h3>
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
    <div className="my-6 rounded-xl border border-white/10 bg-white/[0.02] overflow-x-auto">
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
                  : "bg-white/[0.04] border-white/10"
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
              <ChevronRight size={12} className="text-white/20 flex-shrink-0" />
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
      <div className="relative w-52 h-52 border-2 border-white/20 rounded bg-[#0d1117]">
        {/* Grid lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-px bg-white/10" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-full w-px bg-white/10" />
        </div>
        {/* Axis labels */}
        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-blue-400">+1.0</span>
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-[var(--text-muted)]">-1.0</span>
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 font-mono text-[9px] text-[var(--text-muted)]">-1.0</span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[9px] text-blue-400">+1.0</span>
        <span className="absolute top-1.5 right-2 font-mono text-[8px] text-[var(--text-muted)]">Y</span>
        <span className="absolute bottom-2 right-2 font-mono text-[8px] text-[var(--text-muted)]">X</span>
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
    <div className="my-6 rounded-xl border border-white/10 bg-[#0d1117] p-6 overflow-x-auto">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-max mx-auto sm:w-auto">

        <div className="flex flex-col items-center gap-2">
          <div className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
            {tx(t, "vboFlowCpuRam", "CPU RAM")}
          </div>
          <div className="border border-white/20 rounded-lg px-4 py-3 bg-white/[0.03] text-center">
            <div className="font-mono text-[10px] text-[var(--text-muted)]">float vertices[]</div>
            <div className="font-mono text-[11px] text-white mt-1">{"{ -0.5, -0.5, 0.5..."}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-[9px] font-mono text-[var(--primary)] whitespace-nowrap">glBufferData()</div>
          <div className="flex items-center gap-1">
            <div className="h-px w-10 bg-[var(--primary)]/40" />
            <ChevronRight size={12} className="text-[var(--primary)]" />
          </div>
          <div className="text-[8px] font-mono text-[var(--text-muted)] opacity-60">
            {tx(t, "vboFlowUpload", "upload")}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-[9px] font-mono font-bold text-[var(--primary)] uppercase tracking-widest mb-1">
            {tx(t, "vboFlowGpuVram", "GPU VRAM")}
          </div>
          <div className="border border-[var(--primary)]/30 rounded-lg px-4 py-3 bg-[var(--primary)]/5 text-center">
            <div className="font-mono text-[10px] text-[var(--primary)]">VBO #1</div>
            <div className="font-mono text-[11px] text-white mt-1">[ vertex buffer ]</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-[9px] font-mono text-green-400 whitespace-nowrap">glDrawArrays()</div>
          <div className="flex items-center gap-1">
            <div className="h-px w-10 bg-green-500/40" />
            <ChevronRight size={12} className="text-green-400" />
          </div>
          <div className="text-[8px] font-mono text-[var(--text-muted)] opacity-60">
            {tx(t, "vboFlowDrawCall", "draw call")}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-[9px] font-mono font-bold text-green-400 uppercase tracking-widest mb-1">
            {tx(t, "vboFlowVertexShader", "Vertex Shader")}
          </div>
          <div className="border border-green-500/30 rounded-lg px-4 py-3 bg-green-500/5 text-center">
            <div className="font-mono text-[10px] text-green-400">gl_Position</div>
            <div className="font-mono text-[11px] text-white mt-1">
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
    <div className="my-6 rounded-xl border border-white/10 bg-[#0d1117] p-5">
      <div className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest text-center mb-4">
        {tx(t, "vaoDiagramTitle", "VAO records bindings so you can replay them with one call")}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

        <div className="border-2 border-[var(--primary)]/40 rounded-xl p-4 bg-[var(--primary)]/5 text-center min-w-[130px]">
          <div className="font-mono text-[10px] font-bold text-[var(--primary)] mb-3">VAO</div>
          <div className="space-y-1.5">
            <div className="text-[9px] font-mono text-[var(--text-muted)] text-left">
              {tx(t, "vaoAttrib0", "attrib 0 → VBO #1")}
            </div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] text-left">
              {tx(t, "vaoAttrib1", "attrib 1 → VBO #1")}
            </div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] text-left">
              {tx(t, "vaoIndices", "indices → EBO #1")}
            </div>
          </div>
        </div>

        <div className="font-mono text-[var(--text-muted)] text-xs">
          {tx(t, "vaoBindOnce", "bind once")}
        </div>

        <div className="flex flex-col gap-2">
          <div className="border border-white/10 rounded-lg px-4 py-2 bg-white/[0.03] font-mono text-[10px] text-white text-center">
            {tx(t, "vaoVboPositions", "VBO #1 (positions)")}
          </div>
          <div className="border border-white/10 rounded-lg px-4 py-2 bg-white/[0.03] font-mono text-[10px] text-white text-center">
            {tx(t, "vaoVboTexCoords", "VBO #2 (tex coords)")}
          </div>
          <div className="border border-white/10 rounded-lg px-4 py-2 bg-white/[0.03] font-mono text-[10px] text-white text-center">
            {tx(t, "vaoEboIndices", "EBO #1 (indices)")}
          </div>
        </div>

      </div>
    </div>
  );
}