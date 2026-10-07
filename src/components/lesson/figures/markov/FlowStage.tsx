"use client";

import { C, T, f2 } from "@/components/lesson/kit/figure";

// ── Probability as a fluid ────────────────────────────────────────────────────
// Bars: the distribution πₙ, one bar per state, with the stationary π as green
// ticks. During a step every bar splits into pieces πₙ(i)·p_ij, one per arrow
// leaving i; the pieces travel to their states and stack there, still coloured
// by where they came from, then take their new state's colour. What lands on j
// is Σᵢ πₙ(i)·p_ij = πₙ₊₁(j). Below: each state's probability over time.

export const STAGE_W = 660;
export const COLS = [C.sky, C.pink, C.amber, C.green, C.purple, C.teal, C.orange];
const BASE = 196, BAR_H = 160, PLOT_T = 236, PLOT_H = 96, H = PLOT_T + PLOT_H + 22;

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const smooth = (a: number, b: number, x: number) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

function mix(c1: string, c2: string, u: number) {
  const p = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(",")})`;
}

export function FlowStage({ P, dists, n, u, pi, tMax, labels }: {
  /** Transition matrix in numbers. */
  P: number[][];
  /** π₀ … π_tMax in numbers. */
  dists: number[][];
  n: number;
  /** Progress of the step n → n + 1 (0 at rest). */
  u: number;
  pi: number[] | null;
  tMax: number;
  labels: { time: string };
}) {
  const S = P.length, k = S - 1;
  const bx = (i: number) => 80 + (i * (STAGE_W - 160)) / k;
  const bw = Math.min(50, ((STAGE_W - 160) / S) * 0.55);
  const col = (i: number) => COLS[i % COLS.length];
  const px = (s: number) => 44 + (s * (STAGE_W - 70)) / tMax;
  const py = (v: number) => PLOT_T + PLOT_H - v * PLOT_H;
  const cur = dists[n];

  // ── Bars, or the pieces in flight ──
  const shapes: React.ReactNode[] = [];
  if (u > 0 && n < dists.length - 1) {
    const e = ease(u), recolour = smooth(0.78, 1, u);
    const dstOff = Array(S).fill(0);
    const pieces: { i: number; j: number; a: number; s0: number; d0: number }[] = [];
    for (let i = 0; i < S; i++) {
      let srcOff = 0;
      for (let j = 0; j < S; j++) {
        const a = cur[i] * P[i][j];
        if (a <= 0) continue;
        pieces.push({ i, j, a, s0: srcOff, d0: 0 });
        srcOff += a;
      }
    }
    // Stack at the destination in the order of the source states
    for (let j = 0; j < S; j++) for (const p of pieces) if (p.j === j) { p.d0 = dstOff[j]; dstOff[j] += p.a; }
    for (const p of pieces) {
      const x = bx(p.i) + (bx(p.j) - bx(p.i)) * e;
      const lift = p.i === p.j ? 0 : Math.sin(Math.PI * e) * 26;
      const y0 = BASE - (p.s0 + (p.d0 - p.s0) * e) * BAR_H - lift;
      const h = p.a * BAR_H;
      shapes.push(<rect key={`${p.i}-${p.j}`} x={x - bw / 2} y={y0 - h} width={bw} height={h}
        fill={mix(col(p.i), col(p.j), recolour)} opacity={0.85} stroke="var(--code-bg)" strokeWidth={h > 3 ? 1 : 0} />);
    }
  } else {
    for (let i = 0; i < S; i++) {
      const h = cur[i] * BAR_H;
      shapes.push(<rect key={i} x={bx(i) - bw / 2} y={BASE - h} width={bw} height={h} fill={col(i)} opacity={0.85} rx={1.5} />);
    }
  }

  return (
    <svg viewBox={`0 0 ${STAGE_W} ${H}`} className="w-full block">
      <line x1={30} x2={STAGE_W - 20} y1={BASE} y2={BASE} stroke={C.axis} />
      {shapes}
      {Array.from({ length: S }, (_, i) => (
        <g key={i}>
          {pi && <line x1={bx(i) - bw / 2 - 7} x2={bx(i) + bw / 2 + 7} y1={BASE - pi[i] * BAR_H} y2={BASE - pi[i] * BAR_H} stroke={C.green} strokeWidth={2} />}
          <T x={bx(i)} y={BASE + 15} anchor="middle" bold size={11} color={C.fg}>{i}</T>
          {u === 0 && <T x={bx(i)} y={BASE - cur[i] * BAR_H - 5} anchor="middle" size={9.5}>{f2(cur[i], 3)}</T>}
        </g>
      ))}

      {/* Each state's probability over time */}
      <line x1={44} x2={STAGE_W - 20} y1={py(0)} y2={py(0)} stroke={C.axis} />
      <line x1={44} x2={44} y1={py(0)} y2={py(1)} stroke={C.axis} />
      <T x={38} y={py(1) + 4} anchor="end" size={8.5}>1</T>
      <T x={38} y={py(0.5) + 4} anchor="end" size={8.5}>½</T>
      {Array.from({ length: S }, (_, i) => (
        <polyline key={`l${i}`} fill="none" stroke={col(i)} strokeWidth={1.6} strokeLinejoin="round"
          points={dists.slice(0, n + 1).map((d, s) => `${px(s)},${py(d[i])}`).join(" ")} />
      ))}
      <line x1={px(n + ease(u))} x2={px(n + ease(u))} y1={py(0)} y2={py(1)} stroke={C.fg} strokeDasharray="3 3" />
      <T x={STAGE_W - 20} y={py(0) + 15} anchor="end" size={9}>{labels.time} →</T>
    </svg>
  );
}
