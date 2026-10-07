"use client";

import { C, T } from "@/components/lesson/kit/figure";
import { fIsZero, fNum, fStr, type FMat, type Frac, type Path } from "./model";

// ── The trellis and the running sum ───────────────────────────────────────────
// One column per time 0 … n, one row per state: every path of the walk is a
// route from left to right. The routes from i to j are amber, thicker where
// more probability flows. One path (hovered, or the one being added) is drawn
// on top in pink, or a whole group of them (the paths whose last stop is k).
// Under the trellis, a bar adds the paths' probabilities one by one; it is
// exactly as long as the entry (Pⁿ)ᵢⱼ when every path has been added.

export const STAGE_W = 660;
const PAD_L = 44, PAD_R = 24, PAD_T = 16, ROW = 34;
const BAR_X = 70, BAR_W = 520, BAR_H = 22;
const SEG = [C.amber, "#fbbf24"];

export function PathsStage({ P, pows, from, to, n, paths, entry, focus, group, added, labels }: {
  P: FMat;
  /** P⁰ … Pⁿ, for the probability that flows through each edge. */
  pows: FMat[];
  from: number; to: number; n: number;
  paths: Path[];
  entry: Frac;
  /** One path drawn on top (index into paths), or null. */
  focus: number | null;
  /** Paths whose state at time n − 1 is this one are drawn on top. */
  group: number | null;
  /** How many paths the bar has added so far (fractional while animating). */
  added: number;
  labels: { none: string; sum: string };
}) {
  const S = P.length, k = S - 1;
  const trellisH = PAD_T + S * ROW;
  const barY = trellisH + 44;
  const H = barY + BAR_H + 30;
  const X = (s: number) => PAD_L + (s * (STAGE_W - PAD_L - PAD_R)) / n;
  const Y = (state: number) => PAD_T + (k - state) * ROW + 10;
  const tot = fNum(entry);

  const edges: React.ReactNode[] = [];
  const dim = focus !== null || group !== null;
  for (let s = 0; s < n; s++) for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) {
    if (fIsZero(P[a][b])) continue;
    // Probability that the walk goes i → … → a at time s, then a → b, then b → … → j
    const flow = fNum(pows[s][from][a]) * fNum(P[a][b]) * fNum(pows[n - s - 1][b][to]);
    const on = flow > 0;
    edges.push(
      <line key={`${s}-${a}-${b}`} x1={X(s)} y1={Y(a)} x2={X(s + 1)} y2={Y(b)}
        stroke={on ? C.amber : C.grid} strokeWidth={on ? 1.2 + 7 * (flow / (tot || 1)) : 1}
        opacity={on ? (dim ? 0.25 : 0.85) : 0.7} strokeLinecap="round" />,
    );
  }

  const drawn = focus !== null && paths[focus] ? [paths[focus]]
    : group !== null ? paths.filter(p => p.states[n - 1] === group) : [];

  // The running sum: whole paths, then a growing slice of the current one
  const segs: React.ReactNode[] = [];
  let x = BAR_X;
  const whole = Math.floor(added);
  for (let i = 0; i < Math.min(paths.length, Math.ceil(added)); i++) {
    const part = i < whole ? 1 : added - whole;
    const w = tot > 0 ? (fNum(paths[i].prob) / tot) * BAR_W * part : 0;
    segs.push(<rect key={i} x={x} y={barY} width={Math.max(0, w)} height={BAR_H} fill={SEG[i % 2]} opacity={focus === i ? 1 : 0.8}
      stroke={focus === i ? C.pink : "none"} strokeWidth={2} />);
    x += w;
  }
  const current = paths[Math.min(paths.length - 1, whole)];
  const showing = focus !== null ? paths[focus] : added > 0 && added < paths.length ? current : null;
  const product = (st: number[]) => st.slice(1).map((b, s) => fStr(P[st[s]][b])).join(" · ");

  return (
    <svg viewBox={`0 0 ${STAGE_W} ${H}`} className="w-full block">
      {edges}
      {drawn.map((p, d) => p.states.slice(1).map((b, s) => (
        <line key={`h${d}-${s}`} x1={X(s)} y1={Y(p.states[s])} x2={X(s + 1)} y2={Y(b)} stroke={C.pink} strokeWidth={drawn.length > 1 ? 2.5 : 3.5} strokeLinecap="round" opacity={0.9} />
      )))}
      {Array.from({ length: n + 1 }, (_, s) => (
        <g key={`c${s}`}>
          <T x={X(s)} y={trellisH + 12} anchor="middle" size={9}>{`t=${s}`}</T>
          {Array.from({ length: S }, (_, a) => {
            const isEnd = (s === 0 && a === from) || (s === n && a === to);
            const isGroup = group !== null && s === n - 1 && a === group;
            return <circle key={a} cx={X(s)} cy={Y(a)} r={isEnd ? 7.5 : isGroup ? 6.5 : 4.5}
              fill={isEnd ? C.amber : isGroup ? C.pink : "var(--card)"} stroke={C.muted} strokeWidth={1} />;
          })}
        </g>
      ))}
      {Array.from({ length: S }, (_, a) => <T key={`s${a}`} x={10} y={Y(a) + 4} color={C.fg}>{a}</T>)}

      {/* The path being shown, as a product */}
      {showing && (
        <T x={STAGE_W / 2} y={barY - 12} anchor="middle" size={11} color={C.pink}>
          {`${showing.states.join(" → ")}   ${product(showing.states)} = ${fStr(showing.prob)}`}
        </T>
      )}

      {/* The running sum, against the full entry */}
      <rect x={BAR_X} y={barY} width={BAR_W} height={BAR_H} rx={3} fill="none" stroke={C.axis} strokeDasharray={tot > 0 ? "4 3" : undefined} />
      {segs}
      {tot > 0
        ? <T x={BAR_X + BAR_W} y={barY + BAR_H + 16} anchor="end" size={10.5} color={C.green} bold>{`${labels.sum} = ${fStr(entry)}`}</T>
        : <T x={BAR_X + BAR_W / 2} y={barY + 15} anchor="middle" size={10.5}>{labels.none}</T>}
      <T x={BAR_X} y={barY + BAR_H + 16} size={10}>0</T>
    </svg>
  );
}
