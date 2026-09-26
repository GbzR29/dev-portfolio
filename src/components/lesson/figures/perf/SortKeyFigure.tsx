"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// One frame's draw list: each draw needs a pass, a shader program, a material
// (textures + material constants) and a mesh (VAO), and has a view depth.
// Drawn in scene order, almost every draw changes some state. Sorted by a
// packed 64-bit key the list groups itself: one program change per shader,
// one material bind per material, and opaque objects front to back (so early-Z
// rejects hidden pixels) while transparent ones go back to front.
// State costs are relative weights in the usual order of expense.

type Draw = { id: number; pass: 0 | 1; shader: number; material: number; mesh: number; depth: number };
const SHADERS = ["lit", "skinned", "foliage"];
const SH_COL = ["#3b82f6", "#a855f7", "#22c55e"];
const MAT_COL = ["#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#ec4899", "#eab308"];
const COST = { program: 30, material: 10, mesh: 4, draw: 1 };

const DRAWS: Draw[] = (() => {
  let s = 5;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return Array.from({ length: 26 }, (_, i) => {
    const pass = (rnd() < 0.2 ? 1 : 0) as 0 | 1;
    const shader = pass ? 0 : Math.floor(rnd() * 3);
    return { id: i, pass, shader, material: shader * 2 + Math.floor(rnd() * 2), mesh: Math.floor(rnd() * 5), depth: 1 + rnd() * 99 };
  });
})();

/** pass(1) | opaque: shader(3) material(8) mesh(8) depth(16) | transparent: inverted depth(16) shader material mesh */
function key(d: Draw) {
  const B = BigInt, depth16 = Math.min(65535, Math.floor((d.depth / 100) * 65535));
  const sh = (v: number, bits: number) => B(v) << B(bits);
  if (d.pass === 0) return sh(d.shader, 60) | sh(d.material, 52) | sh(d.mesh, 44) | sh(depth16, 28);
  return sh(1, 63) | sh(65535 - depth16, 47) | sh(d.shader, 44) | sh(d.material, 36) | sh(d.mesh, 28);
}

const MODES = ["scene order", "by shader", "sort key"] as const;

export function SortKeyFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<(typeof MODES)[number]>("scene order");
  const [hover, setHover] = useState<number | null>(null);

  const list = [...DRAWS];
  if (mode === "by shader") list.sort((a, b) => a.shader - b.shader);
  if (mode === "sort key") list.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));

  let prog = 0, mat = 0, mesh = 0;
  const changes = list.map((d, i) => {
    const p = list[i - 1];
    const c = { program: !p || p.shader !== d.shader || p.pass !== d.pass, material: !p || p.material !== d.material, mesh: !p || p.mesh !== d.mesh };
    prog += +c.program; mat += +c.material; mesh += +c.mesh;
    return c;
  });
  const total = prog * COST.program + mat * COST.material + mesh * COST.mesh + list.length * COST.draw;
  const worst = DRAWS.length * (COST.program + COST.material + COST.mesh + COST.draw);

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const hd = hover !== null ? list[hover] : null;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSortKey_title", "One Frame's Draw List, Sorted Three Ways")}
        </span>
        <div className="flex gap-1.5">{MODES.map(m => <button key={m} className={btn(mode === m)} onClick={() => setMode(m)}>{m}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-3 overflow-x-auto">
        <div className="min-w-[520px] font-mono text-[10px] text-[var(--code-text)]" onPointerLeave={() => setHover(null)}>
          <div className="grid grid-cols-[28px_70px_64px_50px_56px_1fr] gap-x-2 text-[var(--code-muted)] pb-1 border-b border-[var(--code-border)]">
            <span>#</span><span>pass</span><span>shader</span><span>mat</span><span>mesh</span><span>depth</span>
          </div>
          {list.map((d, i) => {
            const c = changes[i];
            return (
              <div key={d.id} onPointerEnter={() => setHover(i)}
                className={`grid grid-cols-[28px_70px_64px_50px_56px_1fr] gap-x-2 items-center h-[17px] ${hover === i ? "bg-[var(--primary-low)]" : ""}`}>
                <span className="text-[var(--code-muted)]">{i}</span>
                <span className={d.pass ? "text-cyan-400" : ""}>{d.pass ? "transparent" : "opaque"}</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SH_COL[d.shader], outline: c.program ? "2px solid #ef4444" : "none", outlineOffset: 1 }} />
                  {SHADERS[d.shader]}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: MAT_COL[d.material], outline: c.material ? "2px solid #f59e0b" : "none", outlineOffset: 1 }} />
                  m{d.material}
                </span>
                <span className={c.mesh ? "text-amber-300" : "text-[var(--code-muted)]"}>vao {d.mesh}</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 rounded-sm bg-[var(--code-muted)]" style={{ width: `${d.depth * 0.9}px`, opacity: 0.7 }} />
                  {d.depth.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 font-mono text-[10px] text-[var(--code-text)]">
          <div className="text-[var(--code-muted)] mb-1">{hd ? `key(draw ${hover}) = 0x${key(hd).toString(16).padStart(16, "0")}` : tx(t, "figSortKey_hover", "hover a row to see its 64-bit key")}</div>
          <div className="flex h-5 rounded overflow-hidden border border-[var(--code-border)] text-[9px]">
            {(hd && hd.pass === 1
              ? [["pass", 1, "#06b6d4"], ["depth (inverted)", 16, "#64748b"], ["shader", 3, SH_COL[0]], ["material", 8, MAT_COL[0]], ["mesh", 8, "#f59e0b"], ["unused", 28, "transparent"]]
              : [["pass", 1, "#06b6d4"], ["shader", 3, SH_COL[0]], ["material", 8, MAT_COL[0]], ["mesh", 8, "#f59e0b"], ["depth", 16, "#64748b"], ["unused", 28, "transparent"]]
            ).map(([name, bits, col]) => (
              <div key={name as string} className="flex items-center justify-center border-r border-[var(--code-border)] text-white/90 truncate"
                style={{ flex: bits as number, minWidth: (bits as number) > 2 ? 66 : 8, background: col as string, opacity: col === "transparent" ? 1 : 0.75 }}>{bits as number > 2 ? `${name} (${bits})` : ""}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {mode === "scene order"
            ? tx(t, "figSortKey_sceneNote", "In the order the scene graph happens to walk, nearly every draw switches program, material or mesh: red outlines mark program changes, amber material binds. Each switch makes the driver re-validate state, which is where CPU time per draw call goes.")
            : mode === "by shader"
              ? tx(t, "figSortKey_shaderNote", "Grouping by shader removes most program switches, but materials inside each group are still interleaved, and the transparent draws got mixed into the opaque ones, which is wrong: they must come last and back to front.")
              : tx(t, "figSortKey_keyNote", "One integer sort does everything. The most significant bits are the most expensive state, so equal programs end up adjacent, then equal materials inside them. The pass bit puts transparent draws last, and inside that pass the inverted depth comes first, so they sort back to front. Opaque draws with the same state are ordered front to back, which helps early-Z.")}
        </p>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[220px]">
          <div><span className="text-red-400">{tx(t, "figSortKey_prog", "program changes")}</span>: {prog} × {COST.program}</div>
          <div><span className="text-amber-400">{tx(t, "figSortKey_mat", "material binds")}</span>: {mat} × {COST.material}</div>
          <div>{tx(t, "figSortKey_mesh", "VAO binds")}: {mesh} × {COST.mesh}</div>
          <div>draws: {list.length} × {COST.draw}</div>
          <div className="mt-1.5 h-2 rounded bg-[var(--code-line)] overflow-hidden"><div className="h-full bg-[var(--primary)]" style={{ width: `${(total / worst) * 100}%` }} /></div>
          <div className="mt-1">{tx(t, "figSortKey_cost", "relative CPU cost")}: <span className="text-[var(--primary)]">{total}</span></div>
        </div>
      </div>
    </FigureShell>
  );
}
