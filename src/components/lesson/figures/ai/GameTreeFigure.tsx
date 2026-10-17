"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, C, T } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { TREE, trace, type Frame } from "./gameTree";

// ── What this figure shows ────────────────────────────────────────────────────
// Minimax on a three-level game tree, one event at a time: MAX (triangles up)
// picks the largest child value, MIN (triangles down) the smallest. With
// alpha-beta on, each open node shows its window [α, β]; when α ≥ β the rest of
// its children are skipped (grey, dashed) and the root still gets the same
// value, 5, after reading 9 leaves instead of 12.

const W = 640, H = 262;
const Y = [30, 92, 156, 222];
const LX = (i: number) => 34 + i * 52.0;
const NAMES = ["R", "A", "B", "C", "A1", "A2", "B1", "B2", "C1", "C2"];

const pos: { x: number; y: number }[] = (() => {
  const p = Array(TREE.length);
  for (let i = TREE.length - 1; i >= 0; i--) {
    const n = TREE[i];
    const x = n.kind === "leaf" ? LX(i - 10) : n.children.reduce((s, c) => s + p[c].x, 0) / n.children.length;
    p[i] = { x, y: Y[n.depth] };
  }
  return p;
})();

const inf = (v: number) => (v === Infinity ? "∞" : v === -Infinity ? "−∞" : String(v));

export function GameTreeFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"mm" | "ab">("ab");
  const frames = useMemo(() => trace(mode === "ab"), [mode]);
  const s = useStepper(frames.length - 1, 700, 350);
  const k = Math.min(frames.length - 1, Math.round(s.raw));
  const f: Frame = frames[k];
  const L = (key: string, en: string) => tx(t, `figAiTree_${key}`, en);
  const ab = mode === "ab";

  const name = (id: number) => NAMES[id] ?? "";
  const who = (id: number) => (TREE[id].kind === "max" ? "MAX" : "MIN");
  const w = f.window[f.node];

  // ── the caption for this frame ──
  let cap = "";
  switch (f.kind) {
    case "start": cap = L("cStart", "MAX moves at the root (triangles pointing up), MIN replies (pointing down), then MAX again. The bottom row holds the final scores, for MAX. Press play or step."); break;
    case "enter": cap = ab && w
      ? L("cEnterAb", "Enter {n} ({who}) with the window α = {a}, β = {b}: MAX is already sure of at least α elsewhere, MIN of at most β.").replace("{n}", name(f.node)).replace("{who}", who(f.node)).replace("{a}", inf(w[0])).replace("{b}", inf(w[1]))
      : L("cEnter", "Enter {n}, a {who} node: look at its children one by one.").replace("{n}", name(f.node)).replace("{who}", who(f.node)); break;
    case "leaf": cap = L("cLeaf", "A leaf: the game is over and the score for MAX is {v}.").replace("{v}", String(f.value[f.node])); break;
    case "better": {
      const v = String(f.value[f.node]);
      cap = (TREE[f.node].kind === "max"
        ? L("cBetterMax", "{n} (MAX) takes {v}: the largest value seen so far.")
        : L("cBetterMin", "{n} (MIN) takes {v}: the smallest value seen so far.")).replace("{n}", name(f.node)).replace("{v}", v);
      if (ab && w) cap += " " + (TREE[f.node].kind === "max" ? L("cRaiseA", "So α = {a}.") : L("cLowerB", "So β = {b}.")).replace("{a}", inf(w[0])).replace("{b}", inf(w[1]));
      break;
    }
    case "cut": cap = (TREE[f.node].kind === "min"
      ? L("cCutMin", "Cut-off at {n}: α = {a} ≥ β = {b}. MAX already has a move worth {a} higher up, and here MIN can already hold MAX to {b} or less. MAX will never choose this branch, so the remaining children cannot matter: skip them.")
      : L("cCutMax", "Cut-off at {n}: α = {a} ≥ β = {b}. MIN already has a reply worth {b} higher up, and here MAX can already get {a} or more. MIN will never allow this position, so the remaining children cannot matter: skip them."))
      .replace("{n}", name(f.node)).replaceAll("{a}", inf(w ? w[0] : 0)).replaceAll("{b}", inf(w ? w[1] : 0)); break;
    case "done": cap = (f.node === 0
      ? L("cRoot", "Finished: the root's value is {v}. MAX's best first move is the branch that gave it.")
      : L("cDone", "{n} is finished: its value is {v}, reported to its parent.")).replace("{n}", name(f.node)).replace("{v}", String(f.value[f.node])); break;
  }

  const tri = (x: number, y: number, up: boolean, r = 17) => up
    ? `${x},${y - r} ${x + r * 1.05},${y + r * 0.72} ${x - r * 1.05},${y + r * 0.72}`
    : `${x},${y + r} ${x + r * 1.05},${y - r * 0.72} ${x - r * 1.05},${y - r * 0.72}`;

  return (
    <Figure
      title={L("title", "Minimax and alpha-beta on a small game tree")}
      head={<Choice value={mode} onChange={v => { setMode(v); s.restart(); }} options={[["mm", "minimax"], ["ab", "alpha-beta"]] as const} />}
      note={L("note", "Each triangle is a position. MAX (pointing up) wants the score high and takes the largest of its children's values; MIN (pointing down) wants it low and takes the smallest. The search goes depth first, left to right, and a value climbs up as soon as a node is finished. Plain minimax reads all 12 leaves. With alpha-beta each open node carries a window: α is the score MAX is already sure of somewhere above, β the score MIN is already sure of. When α ≥ β the node cannot affect the result and its remaining children are skipped (dashed). The root gets 5 either way, after 9 leaves instead of 12.")}
    >
      <div className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {TREE.map(n => n.children.map(c => {
            const a = pos[n.id], b = pos[c];
            const hot = f.open[n.id] && f.open[c];
            return <line key={`${n.id}-${c}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={f.pruned[c] ? C.muted : hot ? C.amber : C.axis} strokeOpacity={f.pruned[c] ? 0.35 : 1}
              strokeDasharray={f.pruned[c] ? "4 4" : undefined} strokeWidth={hot ? 2.2 : 1.3} />;
          }))}
          {TREE.map(n => {
            const p = pos[n.id], v = f.value[n.id], focus = f.node === n.id && f.kind !== "start";
            const dim = f.pruned[n.id] ? 0.35 : 1;
            const col = n.kind === "max" ? C.sky : n.kind === "min" ? C.red : C.fg;
            if (n.kind === "leaf") {
              const read = v !== null;
              return (
                <g key={n.id} opacity={dim}>
                  <rect x={p.x - 15} y={p.y - 13} width={30} height={26} rx={4} fill={read ? "var(--card)" : "transparent"}
                    stroke={focus ? C.amber : C.muted} strokeWidth={focus ? 2.2 : 1} strokeDasharray={f.pruned[n.id] ? "3 3" : undefined} />
                  <T x={p.x} y={p.y + 4.5} size={12} anchor="middle" bold={read} color={read ? C.fg : C.muted}>{n.leaf}</T>
                </g>
              );
            }
            const win = f.window[n.id];
            return (
              <g key={n.id} opacity={dim}>
                <polygon points={tri(p.x, p.y, n.kind === "max")} fill="var(--card)" stroke={focus ? C.amber : col} strokeWidth={focus ? 2.6 : 1.6}
                  strokeDasharray={f.pruned[n.id] ? "3 3" : undefined} />
                <T x={p.x} y={p.y + (n.kind === "max" ? 7 : 2)} size={11.5} anchor="middle" bold color={v === null ? C.muted : C.fg}>{v === null ? "·" : v}</T>
                {/* MIN names go on the side away from the edge that climbs to the root */}
                {(() => {
                  const right = n.kind === "max" || p.x > pos[0].x;
                  return <T x={right ? p.x + 20 : p.x - 22} y={p.y - (n.kind === "max" ? 10 : 6)} size={8.5} color={col} bold anchor={right ? "start" : "end"}>{NAMES[n.id]}</T>;
                })()}
                {ab && win && <T x={p.x + 20} y={p.y + 12} size={8.5} color={C.amber}>{`[${inf(win[0])}, ${inf(win[1])}]`}</T>}
              </g>
            );
          })}
        </svg>
        <div className="px-4 pb-1 min-h-[3.6rem]">
          <p className="text-[12.5px] text-[var(--text-main)] leading-snug">{cap}</p>
        </div>
        <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
          readout={`${L("leaves", "leaves read")} ${f.leaves} / 12`} />
      </div>
    </Figure>
  );
}
