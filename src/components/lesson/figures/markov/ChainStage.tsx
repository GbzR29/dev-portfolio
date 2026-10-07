"use client";

import { C, T } from "@/components/lesson/kit/figure";
import { fIsZero, fNum, fStr, type FMat } from "./model";

// ── The walk, drawn ───────────────────────────────────────────────────────────
// Top: the history, past states faded, the present one lit (the only one the
// next step reads). Middle: the chain as a graph; the arrows that leave the
// walker's state are bright, every other arrow is faded. Under the states: the
// share of time spent in each one, with the stationary distribution as green
// ticks. Bottom: the row of P being read, as a strip of length 1 cut into
// pieces as long as its probabilities. A step drops a random needle u ∈ [0, 1)
// on the strip; the piece it lands in is where the walker goes.

export const STAGE_W = 660;
const H = 322, Y = 122, R = 22;
const STRIP_X = 150, STRIP_W = 360, STRIP_Y = 286, STRIP_H = 20;
const BAR_BASE = 252, BAR_MAX = 44;

/** A step in progress: t runs 0 → 1 (needle falls until 0.45, then the walker travels). */
export type Move = { from: number; to: number; u: number; t: number };
export const NEEDLE_END = 0.45;

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const dirColor = (a: number, b: number) => (b > a ? C.sky : b < a ? C.pink : C.purple);

export function ChainStage({ P, state, hist, move, share, pi, labels }: {
  P: FMat;
  state: number;
  /** Visited states, oldest first; the last one is the present. */
  hist: number[];
  move: Move | null;
  share: number[];
  pi: number[] | null;
  labels: { history: string; onlyThis: string; row: string; time: string };
}) {
  const n = P.length, k = n - 1;
  const X = (i: number) => 70 + (i * (STAGE_W - 140)) / k;
  // While a step is under way the walker has left `from` but not reached `to`
  const reading = move ? move.from : state;
  const travel = move && move.t > NEEDLE_END ? ease((move.t - NEEDLE_END) / (1 - NEEDLE_END)) : null;
  const here = move ? (travel === null ? move.from : -1) : state;

  // ── Arrows ──
  const arrows: React.ReactNode[] = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    if (fIsZero(P[a][b])) continue;
    const lit = a === reading;
    const taken = !!move && move.from === a && move.to === b && move.t > 0.3;
    arrows.push(a === b
      ? <SelfLoop key={`${a}-${b}`} x={X(a)} label={fStr(P[a][a])} lit={lit} taken={taken} />
      : <Arc key={`${a}-${b}`} x0={X(a)} x1={X(b)} label={fStr(P[a][b])} lit={lit} taken={taken} />);
  }

  // ── The travelling walker ──
  let dot: { x: number; y: number } | null = null;
  if (move && travel !== null) {
    if (move.from === move.to) {
      const x = X(move.from);
      dot = cubic([x - 12, Y - R + 4], [x - 26, Y - R - 26], [x + 26, Y - R - 26], [x + 12, Y - R + 4], travel);
    } else {
      const g = arcGeom(X(move.from), X(move.to));
      dot = quad(g.s, g.c, g.e, travel);
    }
  }

  // ── History chips: the present last ──
  const chips = hist.slice(-9);
  const chipX = (i: number) => 128 + i * 30;

  // ── The row strip ──
  const row = P[reading];
  let acc = 0;
  const pieces = row.map((v, j) => {
    const w = fNum(v) * STRIP_W, x = STRIP_X + acc;
    acc += w;
    return { j, x, w, v };
  }).filter(p => p.w > 0);
  const needleX = move ? STRIP_X + move.u * STRIP_W : 0;
  const needleY = move ? STRIP_Y - 18 + 16 * ease(Math.min(1, move.t / 0.3)) : 0;
  const landed = !!move && move.t >= 0.3;

  return (
    <svg viewBox={`0 0 ${STAGE_W} ${H}`} className="w-full block">
      <defs>
        {([["R", C.sky], ["L", C.pink], ["S", C.purple], ["A", C.amber]] as const).map(([id, col]) => (
          <marker key={id} id={`mkArrow${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={col} />
          </marker>
        ))}
      </defs>

      {/* History */}
      <T x={16} y={30} size={9.5}>{labels.history}</T>
      {chips.map((s, i) => {
        const now = i === chips.length - 1 && !move;
        return (
          <g key={`${hist.length}-${i}`} opacity={now ? 1 : 0.28 + (0.4 * i) / chips.length}>
            <rect x={chipX(i) - 11} y={16} width={22} height={20} rx={6} fill={now ? C.amber : "var(--card)"} stroke={now ? C.amber : C.muted} strokeWidth={1} />
            <T x={chipX(i)} y={30} anchor="middle" size={11} bold color={now ? "#1f1300" : C.fg}>{s}</T>
            {i < chips.length - 1 && <T x={chipX(i) + 15} y={30} anchor="middle" size={9}>›</T>}
          </g>
        );
      })}
      {!move && <T x={chipX(chips.length - 1) + 20} y={30} size={9.5} color={C.amber}>← {labels.onlyThis}</T>}

      {arrows}

      {/* States */}
      {P.map((_, i) => {
        const on = i === here;
        return (
          <g key={i}>
            <circle cx={X(i)} cy={Y} r={R} fill={on ? C.amber : "var(--card)"} stroke={on || i === reading ? C.amber : C.muted} strokeWidth={on || i === reading ? 2 : 1.3} />
            <T x={X(i)} y={Y + 5} anchor="middle" size={14} bold color={on ? "#1f1300" : C.fg}>{i}</T>
          </g>
        );
      })}
      {dot && <circle cx={dot.x} cy={dot.y} r={8} fill={C.amber} stroke="var(--code-bg)" strokeWidth={2} />}

      {/* Share of time spent in each state, and π */}
      <T x={16} y={BAR_BASE + 14} size={9}>{labels.time}</T>
      {P.map((_, i) => {
        const scale = BAR_MAX * 1.6;
        const h = Math.min(share[i] * scale, BAR_MAX + 4);
        return (
          <g key={`b${i}`}>
            <line x1={X(i) - 24} x2={X(i) + 24} y1={BAR_BASE} y2={BAR_BASE} stroke={C.axis} />
            <rect x={X(i) - 14} y={BAR_BASE - h} width={28} height={h} rx={2} fill={C.amber} opacity={0.65} />
            {pi && <line x1={X(i) - 20} x2={X(i) + 20} y1={BAR_BASE - pi[i] * scale} y2={BAR_BASE - pi[i] * scale} stroke={C.green} strokeWidth={2.2} />}
          </g>
        );
      })}

      {/* The row being read */}
      <T x={STRIP_X - 10} y={STRIP_Y + 14} anchor="end" size={10} color={C.fg}>{labels.row.replace("{i}", String(reading))}</T>
      {pieces.map(p => {
        const col = dirColor(reading, p.j);
        const hit = landed && move!.to === p.j;
        return (
          <g key={p.j}>
            <rect x={p.x} y={STRIP_Y} width={p.w} height={STRIP_H} fill={col} opacity={hit ? 0.95 : 0.35} stroke={hit ? C.amber : "var(--code-bg)"} strokeWidth={hit ? 2.5 : 1.5} />
            <T x={p.x + p.w / 2} y={STRIP_Y + 14} anchor="middle" size={10} bold={hit} color={C.fg}>
              {p.w > 52 ? `→${p.j}  ${fStr(p.v)}` : `→${p.j}`}
            </T>
          </g>
        );
      })}
      <T x={STRIP_X} y={STRIP_Y + STRIP_H + 13} anchor="middle" size={8.5}>0</T>
      <T x={STRIP_X + STRIP_W} y={STRIP_Y + STRIP_H + 13} anchor="middle" size={8.5}>1</T>
      {move && (
        <g>
          <path d={`M${needleX - 5},${needleY - 9} L${needleX + 5},${needleY - 9} L${needleX},${needleY}`} fill={C.fg} />
          <line x1={needleX} x2={needleX} y1={needleY} y2={landed ? STRIP_Y + STRIP_H : needleY} stroke={C.fg} strokeWidth={1.5} />
          <T x={needleX + 8} y={needleY - 2} size={9.5} color={C.fg}>u = {move.u.toFixed(2)}</T>
        </g>
      )}
    </svg>
  );
}

// ── Arrow geometry ────────────────────────────────────────────────────────────

type P2 = [number, number];
const quad = (s: P2, c: P2, e: P2, t: number) => ({
  x: (1 - t) ** 2 * s[0] + 2 * (1 - t) * t * c[0] + t * t * e[0],
  y: (1 - t) ** 2 * s[1] + 2 * (1 - t) * t * c[1] + t * t * e[1],
});
const cubic = (a: P2, b: P2, c: P2, d: P2, t: number) => {
  const u = 1 - t;
  return {
    x: u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    y: u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  };
};

/** A move between neighbours: above the row when it goes right, below when it goes left. */
function arcGeom(x0: number, x1: number) {
  const up = x1 > x0, dy = up ? -1 : 1, side = up ? 0.6 : -0.6;
  return {
    up, dy,
    s: [x0 + side * R, Y + dy * 0.8 * R] as P2,
    e: [x1 - side * R, Y + dy * 0.8 * R] as P2,
    c: [(x0 + x1) / 2, Y + dy * 62] as P2,
  };
}

function Arc({ x0, x1, label, lit, taken }: { x0: number; x1: number; label: string; lit: boolean; taken: boolean }) {
  const { up, dy, s, e, c } = arcGeom(x0, x1);
  const col = up ? C.sky : C.pink;
  return (
    <g opacity={lit ? 1 : 0.22} style={{ transition: "opacity 0.25s" }}>
      <path d={`M${s[0]},${s[1]} Q${c[0]},${c[1]} ${e[0]},${e[1]}`} fill="none" stroke={taken ? C.amber : col}
        strokeWidth={taken ? 3 : lit ? 2 : 1.4} markerEnd={`url(#mkArrow${taken ? "A" : up ? "R" : "L"})`} />
      {/* The quadratic's apex is half-way to its control point; the label sits just beyond it */}
      <T x={c[0]} y={Y + dy * (up ? 45 : 53)} anchor="middle" color={col} size={lit ? 11.5 : 10.5} bold={lit}>{label}</T>
    </g>
  );
}

/** Staying put: a small loop on top of the state, between the arcs that leave it. */
function SelfLoop({ x, label, lit, taken }: { x: number; label: string; lit: boolean; taken: boolean }) {
  return (
    <g opacity={lit ? 1 : 0.22} style={{ transition: "opacity 0.25s" }}>
      <path d={`M${x - 12},${Y - R + 4} C${x - 26},${Y - R - 26} ${x + 26},${Y - R - 26} ${x + 12},${Y - R + 4}`}
        fill="none" stroke={taken ? C.amber : C.purple} strokeWidth={taken ? 2.8 : lit ? 1.8 : 1.3} markerEnd={`url(#mkArrow${taken ? "A" : "S"})`} />
      <T x={x} y={Y - R - 24} anchor="middle" color={C.purple} size={10.5} bold={lit}>{label}</T>
    </g>
  );
}
