// src/components/lesson/LessonComponents.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Prism as SyntaxHighlighter, createElement } from "react-syntax-highlighter";
import { lessonSyntaxTheme } from "@/lib/syntaxTheme";
import { RefToken, useReference, useRefEntry } from "@/components/reference/RefToken";
import { referenceIndex, type RefEntry } from "@/lib/reference";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ─── Reference linking ────────────────────────────────────────────────────────
// The highlighter hands its renderer a HAST-like tree. We split text nodes on
// known API names and swap each match for a RefToken element; createElement
// accepts a component as tagName, so the rest of the pipeline is untouched.

type HastNode = {
  type: string;
  tagName?: unknown;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function linkifyNode(node: HastNode, pattern: RegExp, index: Map<string, RefEntry>): HastNode[] {
  // Line-number nodes carry a numeric value — only real strings are scanned.
  if (node.type === "text" && typeof node.value === "string") {
    const out: HastNode[] = [];
    let last = 0;
    for (const m of node.value.matchAll(pattern)) {
      const entry = index.get(m[0]);
      if (!entry || m.index === undefined) continue;
      if (m.index > last) out.push({ type: "text", value: node.value.slice(last, m.index) });
      out.push({
        type: "element",
        tagName: RefToken,
        properties: { className: [], entry },
        children: [{ type: "text", value: m[0] }],
      });
      last = m.index + m[0].length;
    }
    if (last === 0) return [node];
    if (last < node.value.length) out.push({ type: "text", value: node.value.slice(last) });
    return out;
  }
  if (node.children) {
    return [{ ...node, children: node.children.flatMap((c) => linkifyNode(c, pattern, index)) }];
  }
  return [node];
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────

export function CodeBlock({
  children, lang = "cpp", filename, t,
}: {
  children: string;
  lang?: string;
  filename?: string;
  t?: TrackTranslations;
}) {
  const [copied, setCopied] = useState(false);
  const reference = useReference();

  const renderer = useMemo(() => {
    if (!reference) return undefined;
    const index = referenceIndex(reference);
    return ({ rows, stylesheet, useInlineStyles }: {
      rows: HastNode[];
      stylesheet: { [key: string]: React.CSSProperties };
      useInlineStyles: boolean;
    }) =>
      rows.map((row, i) =>
        createElement({
          node: linkifyNode(row, reference.tokenPattern, index)[0] as never,
          stylesheet,
          useInlineStyles,
          key: `row-${i}`,
        }),
      );
  }, [reference]);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)] !my-8">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--code-bg)] border-b border-[var(--border)]">
        <span className="font-mono text-[11.5px] text-[var(--text-muted)]">
          {filename ?? lang}
        </span>
        <button
          onClick={handleCopy}
          className="text-[11.5px] font-mono text-[var(--primary)] hover:underline underline-offset-4 px-1 py-1"
        >
          {copied ? tx(t, "codeCopied", "copied") : tx(t, "codeCopy", "copy")}
        </button>
      </div>
      <div className="overflow-auto bg-[var(--code-bg)]">
        <SyntaxHighlighter
          language={lang}
          style={lessonSyntaxTheme()}
          showLineNumbers
          renderer={renderer as never}
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
  t?: TrackTranslations;
}) {
  // A rule down the left edge and a faint tint: note = the page accent,
  // warning = amber, tip = green. Colours come from the theme tokens.
  const config = {
    info: { tone: "var(--primary)",   tint: "var(--primary-low)",   labelKey: "calloutNote",    fallback: "NOTE"    },
    warn: { tone: "var(--highlight)", tint: "var(--highlight-low)", labelKey: "calloutWarning", fallback: "WARNING" },
    tip:  { tone: "var(--success)",   tint: "color-mix(in srgb, var(--success) 8%, transparent)", labelKey: "calloutTip", fallback: "TIP" },
  }[type];

  return (
    <div className="!my-8 py-4 px-5 border-l-2" style={{ borderColor: config.tone, background: config.tint }}>
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] block mb-1.5" style={{ color: config.tone }}>
        {tx(t, config.labelKey, config.fallback)}
      </span>
      <div className="text-[var(--text-main)] opacity-90 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

// ─── InlineCode ───────────────────────────────────────────────────────────────

export function IC({ children }: { children: string }) {
  const entry = useRefEntry(children);
  const cls = "bg-[var(--primary-low)] px-1.5 py-0.5 rounded-sm text-[var(--text-main)] font-mono text-[0.85em]";
  return (
    <code className={cls}>
      {entry ? <RefToken entry={entry}>{children}</RefToken> : children}
    </code>
  );
}

// ─── H2 / H3 ─────────────────────────────────────────────────────────────────
// scroll-margin offsets the sticky top bar so headings aren't hidden when jumped to.

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
      className="font-display text-[1.85rem] leading-tight font-normal text-[var(--text-main)] !mt-16 scroll-mt-[calc(var(--nav-h,81px)+24px)] [text-wrap:balance]"
    >
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      id={slug(children)}
      className="font-display text-[1.3rem] font-medium text-[var(--text-main)] !mt-10 scroll-mt-[calc(var(--nav-h,81px)+24px)]"
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

export function PipelineDiagram({ t }: { t?: TrackTranslations }) {
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

export function VBOFlowDiagram({ t }: { t?: TrackTranslations }) {
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

export function VAODiagram({ t }: { t?: TrackTranslations }) {
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
    <div className="overflow-x-auto my-6 border-t border-[var(--border-strong)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-strong)]">
            {headers.map((h, i) => (
              <th key={i} className="text-left pl-0 pr-4 pt-2.5 pb-2 font-mono font-medium text-[11px] text-[var(--text-muted)] uppercase tracking-[0.06em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] border-b border-[var(--border)]">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`pl-0 pr-4 py-2.5 text-[13.5px] align-baseline ${j === 0 ? "font-mono text-[var(--primary)]" : "text-[var(--text-main)] opacity-90"}`}>
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
    <div className="my-5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          {label && (
            <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2">{label}</div>
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