"use client";

import { C, T, f2 } from "@/components/lesson/kit/figure";
import { fNum, fStr, type Frac } from "./model";

// ── Absorbing walk: chances, times and a crowd of walkers ─────────────────────
// Top: one bar per start state, either the chance h_j of ending at k or the
// expected number of steps t_j. For the chosen inner state f, the first-step
// picture: a chord joins the tops of its neighbours' bars, and the point p of
// the way along it is q·(left) + p·(right), exactly the top of f's bar in
// "chance" mode, and one unit below it in "time" mode (the +1 is the step just
// taken). Middle: the states; the ends are squares because they are absorbing.
// Bottom: a crowd of walkers released together, piled under their states.
// In the "given a win / given ruin" modes the bars are E[T | end] and the chord
// uses the conditioned weights p′, q′ of each state instead of p, q.

/** hit: chance of reaching k; time: expected steps; win / ruin: expected steps given that ending. */
export type Mode = "hit" | "time" | "win" | "ruin";

export const STAGE_W = 660;
const H = 330, BAR_BASE = 158, BAR_MAX = 118, ROW_Y = 186, CROWD_Y = 212, DOT = 5, PER_ROW = 8;

/** Where each walker is drawn: piled in rows under its state. */
export function crowdLayout(pos: number[], X: (i: number) => number) {
  const count = new Map<number, number>();
  return pos.map(s => {
    const r = count.get(s) ?? 0;
    count.set(s, r + 1);
    return { x: X(s) - ((PER_ROW - 1) * DOT) / 2 + (r % PER_ROW) * DOT, y: CROWD_Y + Math.floor(r / PER_ROW) * DOT };
  });
}

export const stateX = (k: number) => (i: number) => 64 + (i * (STAGE_W - 128)) / k;

export function AbsorbStage({ k, p, values, mode, focus, onFocus, dots, labels }: {
  k: number;
  /** Weight of the right-hand neighbour in the focused state's first step (p, or p′ when conditioned). */
  p: number;
  values: Frac[];
  mode: Mode;
  focus: number | null;
  onFocus: (i: number) => void;
  /** Walker positions, already laid out and interpolated. */
  dots: { x: number; y: number }[];
  labels: { ruin: string; win: string; formula: string };
}) {
  const X = stateX(k);
  const nums = values.map(fNum);
  const top = mode === "hit" ? 1 : Math.max(1, ...nums);
  const Y = (v: number) => BAR_BASE - (v / top) * BAR_MAX;
  const bw = Math.min(40, ((STAGE_W - 128) / (k + 1)) * 0.6);
  const col = mode === "hit" ? C.green : mode === "time" ? C.purple : mode === "win" ? C.teal : C.red;
  const f = focus !== null && focus > 0 && focus < k ? focus : null;
  // Given a win, the walk never sits at 0 (and given ruin, never at k): no bar there
  const hidden = mode === "win" ? 0 : mode === "ruin" ? k : -1;
  const prime = mode === "win" || mode === "ruin" ? "′" : "";

  let chord: React.ReactNode = null;
  if (f !== null) {
    const a = { x: X(f - 1), y: Y(nums[f - 1]) }, b = { x: X(f + 1), y: Y(nums[f + 1]) };
    const m = { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
    const target = Y(nums[f]);
    chord = (
      <g pointerEvents="none">
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.fg} strokeWidth={1.3} strokeDasharray="4 3" />
        <circle cx={a.x} cy={a.y} r={3.5} fill={C.fg} />
        <circle cx={b.x} cy={b.y} r={3.5} fill={C.fg} />
        {/* Where the chord passes over state f: the weighted average of the neighbours */}
        <line x1={X(f)} x2={X(f)} y1={Math.min(m.y, target) - 4} y2={BAR_BASE} stroke={C.fg} strokeWidth={0.8} opacity={0.4} />
        <circle cx={X(f)} cy={m.y} r={4.5} fill={C.amber} stroke="var(--code-bg)" strokeWidth={1.5} />
        {mode !== "hit" && Math.abs(target - m.y) > 4 && (
          <g>
            <line x1={X(f) + 10} x2={X(f) + 10} y1={m.y} y2={target + 4} stroke={C.amber} strokeWidth={1.8} />
            <path d={`M${X(f) + 6},${target + 8} L${X(f) + 10},${target + 1} L${X(f) + 14},${target + 8}`} fill="none" stroke={C.amber} strokeWidth={1.8} />
            <T x={X(f) + 17} y={(m.y + target) / 2 + 4} size={11} bold color={C.amber}>+1</T>
          </g>
        )}
        {/* A conditioned weight can be 0 or 1: no label on a segment too short to hold one */}
        {Math.abs(m.x - a.x) > 24 && <T x={(a.x + m.x) / 2} y={(a.y + m.y) / 2 - 7} anchor="middle" size={10} color={C.pink}>p{prime}</T>}
        {Math.abs(b.x - m.x) > 24 && <T x={(m.x + b.x) / 2} y={(m.y + b.y) / 2 - 7} anchor="middle" size={10} color={C.sky}>q{prime}</T>}
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${STAGE_W} ${H}`} className="w-full block">
      <line x1={30} x2={STAGE_W - 30} y1={BAR_BASE} y2={BAR_BASE} stroke={C.axis} />
      {nums.map((v, i) => {
        const h = BAR_BASE - Y(v);
        const on = i === f;
        if (i === hidden) return <T key={i} x={X(i)} y={BAR_BASE - 6} anchor="middle" size={9.5} color={C.muted}>–</T>;
        return (
          <g key={i} onClick={() => onFocus(i)} style={{ cursor: i > 0 && i < k ? "pointer" : "default" }}>
            <rect x={X(i) - bw / 2 - 6} y={BAR_BASE - BAR_MAX - 6} width={bw + 12} height={BAR_MAX + 6} fill="transparent" />
            <rect x={X(i) - bw / 2} y={BAR_BASE - h} width={bw} height={h} rx={2} fill={col} opacity={on ? 0.95 : 0.55} />
            <T x={X(i)} y={BAR_BASE - h - 6} anchor="middle" size={9.5} color={on ? C.fg : C.muted} bold={on}>
              {values[i].d < BigInt(1000) ? fStr(values[i]) : f2(v, 2)}
            </T>
          </g>
        );
      })}
      {chord}
      {f !== null && <T x={STAGE_W - 24} y={20} anchor="end" size={11} color={C.fg}>{labels.formula}</T>}

      {/* The states; ends are absorbing */}
      <line x1={X(0)} x2={X(k)} y1={ROW_Y} y2={ROW_Y} stroke={C.axis} />
      {Array.from({ length: k + 1 }, (_, i) => {
        const end = i === 0 || i === k;
        return (
          <g key={`s${i}`}>
            {end
              ? <rect x={X(i) - 12} y={ROW_Y - 12} width={24} height={24} rx={4} fill={i === 0 ? C.red : C.green} opacity={0.85} />
              : <circle cx={X(i)} cy={ROW_Y} r={11} fill="var(--card)" stroke={i === f ? C.amber : C.muted} strokeWidth={i === f ? 2 : 1.2} />}
            <T x={X(i)} y={ROW_Y + 4} anchor="middle" size={11} bold color={end ? "#fff" : C.fg}>{i}</T>
          </g>
        );
      })}
      <T x={X(0) - 16} y={ROW_Y + 4} anchor="end" size={9} color={C.red}>{labels.ruin}</T>
      <T x={X(k) + 16} y={ROW_Y + 4} size={9} color={C.green}>{labels.win}</T>

      {/* The crowd */}
      {dots.map((d, w) => <circle key={w} cx={d.x} cy={d.y} r={1.9} fill={C.amber} />)}
    </svg>
  );
}
