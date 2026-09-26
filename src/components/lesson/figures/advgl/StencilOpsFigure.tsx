"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A tiny 8-bit stencil buffer and colour buffer, and two draw calls. Each draw
// has its own glStencilFunc / glStencilOp / glColorMask state, run exactly as
// the GPU does per fragment:
//   pass = (ref & 0xFF) FUNC (stencil & 0xFF)
//   fail → sfail op, pass → dppass op   (the depth test always passes here)
// Presets rebuild the classic recipes: outline, mask, overlap counting, cut-out.

const COLS = 18, ROWS = 11, CELL = 17;
const FUNCS = ["ALWAYS", "NEVER", "EQUAL", "NOTEQUAL", "LESS", "LEQUAL", "GREATER", "GEQUAL"] as const;
const OPS = ["KEEP", "ZERO", "REPLACE", "INCR", "DECR", "INVERT"] as const;
const SHAPES = ["circle", "circle ×1.3", "rect"] as const;
type Func = (typeof FUNCS)[number];
type Op = (typeof OPS)[number];
type Shape = (typeof SHAPES)[number];
type Draw = { shape: Shape; func: Func; ref: number; sfail: Op; dppass: Op; color: boolean };

const COLORS = ["#f59e0b", "#3b82f6"];

function covers(shape: Shape, x: number, y: number) {
  const cx = x + 0.5, cy = y + 0.5;
  if (shape === "rect") return cx > 7.5 && cx < 16 && cy > 1.5 && cy < 9;
  const r = shape === "circle" ? 3.6 : 3.6 * 1.3;
  return Math.hypot(cx - 7, cy - 5.5) < r;
}

function test(func: Func, ref: number, s: number) {
  switch (func) {
    case "ALWAYS": return true;
    case "NEVER": return false;
    case "EQUAL": return ref === s;
    case "NOTEQUAL": return ref !== s;
    case "LESS": return ref < s;
    case "LEQUAL": return ref <= s;
    case "GREATER": return ref > s;
    case "GEQUAL": return ref >= s;
  }
}

function apply(op: Op, ref: number, s: number) {
  switch (op) {
    case "KEEP": return s;
    case "ZERO": return 0;
    case "REPLACE": return ref;
    case "INCR": return Math.min(255, s + 1);       // GL_INCR clamps; GL_INCR_WRAP would wrap to 0
    case "DECR": return Math.max(0, s - 1);
    case "INVERT": return ~s & 0xff;
  }
}

const PRESETS: { id: string; label: string; draws: [Draw, Draw]; note: string }[] = [
  {
    id: "outline", label: "outline",
    draws: [
      { shape: "circle", func: "ALWAYS", ref: 1, sfail: "KEEP", dppass: "REPLACE", color: true },
      { shape: "circle ×1.3", func: "NOTEQUAL", ref: 1, sfail: "KEEP", dppass: "KEEP", color: true },
    ],
    note: "Draw 1 writes 1 wherever the object lands. Draw 2 is a bigger copy that only passes where the stencil is not 1, so only a ring around the object gets through: the outline.",
  },
  {
    id: "mask", label: "mask / portal",
    draws: [
      { shape: "rect", func: "ALWAYS", ref: 1, sfail: "KEEP", dppass: "REPLACE", color: false },
      { shape: "circle", func: "EQUAL", ref: 1, sfail: "KEEP", dppass: "KEEP", color: true },
    ],
    note: "Draw 1 writes only to the stencil (colour mask off), marking a window. Draw 2 passes only inside it. Mirrors, portals and scopes all start this way.",
  },
  {
    id: "count", label: "count overlap",
    draws: [
      { shape: "circle", func: "ALWAYS", ref: 0, sfail: "KEEP", dppass: "INCR", color: true },
      { shape: "rect", func: "ALWAYS", ref: 0, sfail: "KEEP", dppass: "INCR", color: true },
    ],
    note: "INCR counts how many times each pixel was touched. The value 2 marks the overlap. This is how overdraw debuggers and shadow volumes count.",
  },
  {
    id: "cutout", label: "cut-out",
    draws: [
      { shape: "circle", func: "ALWAYS", ref: 1, sfail: "KEEP", dppass: "REPLACE", color: false },
      { shape: "rect", func: "NOTEQUAL", ref: 1, sfail: "KEEP", dppass: "KEEP", color: true },
    ],
    note: "The inverse of a mask: the rectangle is drawn everywhere except where the invisible circle marked the stencil.",
  },
];

export function StencilOpsFigure({ t }: { t?: TrackTranslations }) {
  const [draws, setDraws] = useState<[Draw, Draw]>(PRESETS[0].draws);
  const [preset, setPreset] = useState<string | null>("outline");
  const [upTo, setUpTo] = useState(2);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  // Run the draws cell by cell, exactly like the per-fragment test
  const stencil = new Array(COLS * ROWS).fill(0);
  const color: (string | null)[] = new Array(COLS * ROWS).fill(null);
  const trace: string[][] = Array.from({ length: COLS * ROWS }, () => []);
  draws.slice(0, upTo).forEach((d, di) => {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (!covers(d.shape, x, y)) continue;
      const i = y * COLS + x, s = stencil[i];
      const pass = test(d.func, d.ref, s);
      const ns = apply(pass ? d.dppass : d.sfail, d.ref, s);
      trace[i].push(`draw ${di + 1}: ${d.ref} ${d.func} ${s} → ${pass ? "pass" : "fail"}, ${pass ? d.dppass : d.sfail} → ${ns}${pass && d.color ? ", colour written" : ""}`);
      stencil[i] = ns;
      if (pass && d.color) color[i] = COLORS[di];
    }
  });

  const set = (di: 0 | 1, patch: Partial<Draw>) => {
    const next: [Draw, Draw] = [{ ...draws[0] }, { ...draws[1] }];
    next[di] = { ...next[di], ...patch };
    setDraws(next); setPreset(null);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const sel = "bg-[var(--code-bg)] border border-[var(--border)] rounded px-1 py-0.5 text-[10px] font-mono text-[var(--text-main)]";

  const W = COLS * CELL, H = ROWS * CELL, GAP = 26;
  const stencilFill = (v: number) => v === 0 ? "transparent" : `hsla(${(v * 67) % 360}, 70%, 55%, ${Math.min(0.85, 0.35 + v * 0.18)})`;
  const hi = hover ? hover.y * COLS + hover.x : -1;
  const cur = PRESETS.find(p => p.id === preset);

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figStencilOps_title", "The Stencil Test, Fragment by Fragment")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map(p => <button key={p.id} className={btn(preset === p.id)} onClick={() => { setDraws(p.draws); setPreset(p.id); setUpTo(2); }}>{p.label}</button>)}
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-3">
        <svg viewBox={`-2 -16 ${W * 2 + GAP + 4} ${H + 20}`} className="w-full h-auto select-none" role="img" aria-label="Stencil buffer simulation"
          onPointerLeave={() => setHover(null)}>
          {[0, 1].map(panel => (
            <g key={panel} transform={`translate(${panel * (W + GAP)}, 0)`}>
              <text x={0} y={-5} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">
                {panel === 0 ? tx(t, "figStencilOps_color", "colour buffer") : tx(t, "figStencilOps_stencil", "stencil buffer (8-bit)")}
              </text>
              {Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => {
                const i = y * COLS + x;
                return (
                  <g key={i} onPointerEnter={() => setHover({ x, y })}>
                    <rect x={x * CELL} y={y * CELL} width={CELL} height={CELL}
                      fill={panel === 0 ? (color[i] ?? "var(--code-line)") : stencilFill(stencil[i])}
                      stroke={i === hi ? "var(--primary)" : "var(--code-border)"} strokeWidth={i === hi ? 1.6 : 0.5} />
                    {panel === 1 && (
                      <text x={x * CELL + CELL / 2} y={y * CELL + CELL / 2 + 3} textAnchor="middle" fontSize="8" fontFamily="monospace"
                        fill={stencil[i] ? "var(--code-text)" : "var(--code-muted)"} opacity={stencil[i] ? 1 : 0.45}>{stencil[i]}</text>
                    )}
                  </g>
                );
              }))}
            </g>
          ))}
        </svg>
        <div className="mt-2 min-h-[34px] font-mono text-[10px] text-[var(--code-text)] leading-relaxed">
          {hover
            ? (trace[hi].length ? trace[hi].map((l, k) => <div key={k}>({hover.x}, {hover.y}) {l}</div>) : <div className="text-[var(--code-muted)]">({hover.x}, {hover.y}) {tx(t, "figStencilOps_noFrag", "no fragment from either draw")}</div>)
            : <div className="text-[var(--code-muted)]">{tx(t, "figStencilOps_hover", "hover a cell to see the test run for it")}</div>}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {([0, 1] as const).map(di => {
            const d = draws[di];
            return (
              <div key={di} className={`rounded-lg border p-3 space-y-2 ${upTo > di ? "border-[var(--border)]" : "border-dashed border-[var(--border)] opacity-50"}`}>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[di] }} />
                  <span className="font-bold text-[var(--text-main)]">draw {di + 1}</span>
                  <select className={sel} value={d.shape} onChange={e => set(di, { shape: e.target.value as Shape })}>
                    {SHAPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <label className="flex items-center gap-1 ml-auto text-[var(--text-muted)]">
                    <input type="checkbox" checked={d.color} onChange={e => set(di, { color: e.target.checked })} className="accent-[var(--primary)]" />
                    colour write
                  </label>
                </div>
                <div className="font-mono text-[10px] text-[var(--text-muted)] leading-loose">
                  glStencilFunc(GL_<select className={sel} value={d.func} onChange={e => set(di, { func: e.target.value as Func })}>
                    {FUNCS.map(f => <option key={f}>{f}</option>)}
                  </select>, <select className={sel} value={d.ref} onChange={e => set(di, { ref: Number(e.target.value) })}>
                    {[0, 1, 2, 3].map(v => <option key={v}>{v}</option>)}
                  </select>, 0xFF);<br />
                  glStencilOp(GL_<select className={sel} value={d.sfail} onChange={e => set(di, { sfail: e.target.value as Op })}>
                    {OPS.map(o => <option key={o}>{o}</option>)}
                  </select>, GL_KEEP, GL_<select className={sel} value={d.dppass} onChange={e => set(di, { dppass: e.target.value as Op })}>
                    {OPS.map(o => <option key={o}>{o}</option>)}
                  </select>);
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figStencilOps_run", "run")}</span>
          {[0, 1, 2].map(n => <button key={n} className={btn(upTo === n)} onClick={() => setUpTo(n)}>{n === 0 ? "clear only" : n === 1 ? "draw 1" : "draw 1 + 2"}</button>)}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {cur
            ? tx(t, `figStencilOps_${cur.id}`, cur.note)
            : tx(t, "figStencilOps_custom", "Custom state. The middle op (dpfail) is fixed to KEEP because this figure has no depth test; in a real scene it decides what happens when the stencil passes but the depth test fails.")}
        </p>
      </div>
    </FigureShell>
  );
}
