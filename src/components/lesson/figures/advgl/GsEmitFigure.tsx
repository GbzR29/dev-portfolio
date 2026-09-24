"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label, pts, type P2 } from "../svg";

// ── What this figure shows ────────────────────────────────────────────────────
// A geometry shader runs once per input primitive and emits vertices one by one.
// Step through the EmitVertex calls: the matching GLSL line lights up, and the
// output primitive is assembled from the vertices emitted so far — every three
// consecutive vertices of a triangle_strip make a triangle; a line_strip joins
// them in order. The input vertices can be dragged.

const W = 420, H = 280;
const MODES = ["point → quad", "line → thick quad", "triangle → wireframe"] as const;

type Emit = { p: P2; line: number; name: string };

const CODE: Record<(typeof MODES)[number], string[]> = {
  "point → quad": [
    "layout (points) in;",
    "layout (triangle_strip, max_vertices = 4) out;",
    "void main() {",
    "  vec4 c = gl_in[0].gl_Position;",
    "  gl_Position = c + vec4(-s, -s, 0, 0); EmitVertex();",
    "  gl_Position = c + vec4( s, -s, 0, 0); EmitVertex();",
    "  gl_Position = c + vec4(-s,  s, 0, 0); EmitVertex();",
    "  gl_Position = c + vec4( s,  s, 0, 0); EmitVertex();",
    "  EndPrimitive();",
    "}",
  ],
  "line → thick quad": [
    "layout (lines) in;",
    "layout (triangle_strip, max_vertices = 4) out;",
    "void main() {",
    "  vec2 a = gl_in[0].gl_Position.xy, b = gl_in[1]...;",
    "  vec2 n = normalize(vec2(a.y - b.y, b.x - a.x)) * w;",
    "  gl_Position = vec4(a - n, 0, 1); EmitVertex();",
    "  gl_Position = vec4(a + n, 0, 1); EmitVertex();",
    "  gl_Position = vec4(b - n, 0, 1); EmitVertex();",
    "  gl_Position = vec4(b + n, 0, 1); EmitVertex();",
    "  EndPrimitive();",
    "}",
  ],
  "triangle → wireframe": [
    "layout (triangles) in;",
    "layout (line_strip, max_vertices = 4) out;",
    "void main() {",
    "  for (int i = 0; i < 4; ++i) {",
    "    gl_Position = gl_in[i % 3].gl_Position;",
    "    EmitVertex();",
    "  }",
    "  EndPrimitive();",
    "}",
  ],
};

export function GsEmitFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<(typeof MODES)[number]>("point → quad");
  const [step, setStep] = useState(4);
  const [wrongOrder, setWrongOrder] = useState(false);
  const [size, setSize] = useState(55);
  const [pt, setPt] = useState<P2>({ x: 210, y: 140 });
  const [line, setLine] = useState<[P2, P2]>([{ x: 90, y: 190 }, { x: 330, y: 90 }]);
  const [tri, setTri] = useState<[P2, P2, P2]>([{ x: 110, y: 220 }, { x: 320, y: 200 }, { x: 200, y: 60 }]);
  const [drag, setDrag] = useState<number | null>(null);

  // Emissions for the current mode
  let emits: Emit[] = [];
  let inputs: P2[] = [];
  if (mode === "point → quad") {
    inputs = [pt];
    const s = size;
    const corners: [number, number, string][] = [[-s, s, "BL"], [s, s, "BR"], [-s, -s, "TL"], [s, -s, "TR"]];   // SVG y points down
    const order = wrongOrder ? [0, 1, 3, 2] : [0, 1, 2, 3];
    emits = order.map(c => ({ p: { x: pt.x + corners[c][0], y: pt.y + corners[c][1] }, line: 4 + c, name: corners[c][2] }));
  } else if (mode === "line → thick quad") {
    inputs = line;
    const [a, b] = line;
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const w = size * 0.35;
    const n = { x: ((a.y - b.y) / l) * w, y: ((b.x - a.x) / l) * w };
    emits = [
      { p: { x: a.x - n.x, y: a.y - n.y }, line: 5, name: "a−n" }, { p: { x: a.x + n.x, y: a.y + n.y }, line: 6, name: "a+n" },
      { p: { x: b.x - n.x, y: b.y - n.y }, line: 7, name: "b−n" }, { p: { x: b.x + n.x, y: b.y + n.y }, line: 8, name: "b+n" },
    ];
  } else {
    inputs = tri;
    emits = [0, 1, 2, 3].map(i => ({ p: tri[i % 3], line: 5, name: `v${i % 3}` }));
  }
  const k = Math.min(step, emits.length);
  const shown = emits.slice(0, k);
  const strip = mode !== "triangle → wireframe";
  const tris = strip ? shown.slice(2).map((_, i) => [shown[i].p, shown[i + 1].p, shown[i + 2].p]) : [];
  const code = CODE[mode];
  const curLine = k === 0 ? 3 : emits[k - 1].line;

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag === null) return;
    const r = e.currentTarget.getBoundingClientRect();
    const p = { x: Math.max(10, Math.min(W - 10, ((e.clientX - r.left) / r.width) * W)), y: Math.max(10, Math.min(H - 10, ((e.clientY - r.top) / r.height) * H)) };
    if (mode === "point → quad") setPt(p);
    else if (mode === "line → thick quad") setLine(l => { const n: [P2, P2] = [...l]; n[drag] = p; return n; });
    else setTri(tv => { const n: [P2, P2, P2] = [...tv]; n[drag] = p; return n; });
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const triColors = ["#3b82f6", "#a855f7", "#22c55e"];

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figGsEmit_title", "One Primitive In, New Primitives Out")}
        </span>
        <div className="flex gap-1.5 flex-wrap">{MODES.map(m => <button key={m} className={btn(mode === m)} onClick={() => { setMode(m); setStep(4); }}>{m}</button>)}</div>
      </div>
      <div className="grid md:grid-cols-[1.15fr_1fr] bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none touch-none" role="img" aria-label="Geometry shader emission"
          onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 52 + 2} y1={0} x2={i * 52 + 2} y2={H} stroke="var(--code-line)" strokeWidth={0.6} />)}
          {Array.from({ length: 6 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 52 + 10} x2={W} y2={i * 52 + 10} stroke="var(--code-line)" strokeWidth={0.6} />)}

          {tris.map((tr, i) => (
            <polygon key={i} points={pts(tr)} fill={triColors[i % 3]} fillOpacity={0.28} stroke={triColors[i % 3]} strokeWidth={1.4} />
          ))}
          {!strip && shown.length > 1 && <polyline points={pts(shown.map(e => e.p))} fill="none" stroke="#22c55e" strokeWidth={2.2} />}
          {mode === "line → thick quad" && <line x1={line[0].x} y1={line[0].y} x2={line[1].x} y2={line[1].y} stroke="var(--code-muted)" strokeDasharray="4 3" />}

          {shown.map((e, i) => (
            <g key={i}>
              <circle cx={e.p.x} cy={e.p.y} r={4} fill={i === k - 1 ? "#ef4444" : "var(--code-text)"} />
              <Label x={e.p.x + 6} y={e.p.y - 5} color={i === k - 1 ? "#ef4444" : "var(--code-text)"} bold={i === k - 1}>{`${i}: ${e.name}`}</Label>
            </g>
          ))}
          {inputs.map((p, i) => (
            <g key={i} style={{ cursor: "grab" }} onPointerDown={e => { (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(e.pointerId); setDrag(i); }}>
              <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
              <rect x={p.x - 5} y={p.y - 5} width={10} height={10} fill="#f59e0b" stroke="var(--code-bg)" strokeWidth={1.5} transform={`rotate(45 ${p.x} ${p.y})`} />
            </g>
          ))}
        </svg>
        <pre className="m-0 p-3 text-[10.5px] leading-[1.65] font-mono text-[var(--code-text)] overflow-x-auto border-t md:border-t-0 md:border-l border-[var(--code-border)]">
          {code.map((l, i) => (
            <div key={i} className={`px-1.5 rounded ${i === curLine ? "bg-[var(--primary-low)] text-[var(--primary)]" : ""}`}>{l}</div>
          ))}
        </pre>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <label className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">EmitVertex ×</span>
          <input type="range" min={0} max={emits.length} step={1} value={k} onChange={e => setStep(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{k}/{emits.length}</span>
        </label>
        {mode !== "triangle → wireframe" && (
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{mode === "point → quad" ? "size s" : "width w"}</span>
            <input type="range" min={15} max={90} step={1} value={size} onChange={e => setSize(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{size}</span>
          </label>
        )}
        {mode === "point → quad" && (
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
            <input type="checkbox" checked={wrongOrder} onChange={e => setWrongOrder(e.target.checked)} className="accent-[var(--primary)]" />
            {tx(t, "figGsEmit_wrong", "emit corners in circular order (BL, BR, TR, TL)")}
          </label>
        )}
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {mode === "point → quad"
            ? wrongOrder
              ? tx(t, "figGsEmit_wrongNote", "A strip makes triangle i from vertices i, i+1, i+2. In circular order the second triangle (BR, TR, TL) overlaps the first and the bottom-left half of the quad is never covered. Strips want a zig-zag: BL, BR, TL, TR.")
              : tx(t, "figGsEmit_quadNote", "One point becomes a camera-facing quad: the particle and billboard trick. After the third EmitVertex the first triangle appears; the fourth adds a second triangle sharing the last two vertices.")
            : mode === "line → thick quad"
              ? tx(t, "figGsEmit_lineNote", "glLineWidth above 1 is not supported in core profile, so thick lines are made by hand: offset both endpoints along the line's perpendicular. Doing the offset in screen space, after the divide, gives a width in pixels.")
              : tx(t, "figGsEmit_wireNote", "The output topology does not have to match the input. Here each triangle becomes a closed line strip of its three edges: four emits, since the first vertex repeats to close the loop.")}
        </p>
      </div>
    </figure>
  );
}
