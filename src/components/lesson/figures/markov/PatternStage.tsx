"use client";

import { C, T } from "@/components/lesson/kit/figure";
import { fNum, fStr, type Frac } from "./model";
import type { Flip, Overlap } from "./patternModel";

// ── Waiting for a pattern: the flips, the prefix chain, the overlaps ──────────
// Top: the flips of the current run as coins, the ending that counts as
// progress underlined. Middle: the prefix chain, one node per beginning of the
// pattern (∅, H, HT, …) with its exact expected time t; the right flip moves
// one node forward (arrow above), a wrong flip falls back along an arc below,
// or loops over the node when the progress survives it. Bottom: the overlap
// test, first k letters against last k, and the sum of 1/P over the matches.

export const STAGE_W = 660;
const H = 400, CY = 165, NR = 25, OV_Y = 296;

export const LETTER: Record<Flip, string> = { H: C.blue, T: C.orange };
const MAX_COINS = 19;

/** A fraction as text, or a decimal once the denominator gets long. */
export const showF = (f: Frac) => (f.d < BigInt(100) ? fStr(f) : String(+fNum(f).toFixed(2)));

function Head({ x, y, ux, uy, color }: { x: number; y: number; ux: number; uy: number; color: string }) {
  const h = 7;
  return <polygon fill={color} points={`${x},${y} ${x - ux * h - uy * h * 0.45},${y - uy * h + ux * h * 0.45} ${x - ux * h + uy * h * 0.45},${y - uy * h - ux * h * 0.45}`} />;
}

export function PatternStage({ pat, next, time, overlaps, total, chance, flips, state, last, done, labels }: {
  pat: string;
  next: { H: number; T: number }[];
  /** Exact expected flips still to go from each state (the last one is 0). */
  time: Frac[];
  overlaps: Overlap[];
  total: Frac;
  /** The chance of each letter as text, e.g. { H: "1/2", T: "1/2" }. */
  chance: Record<Flip, string>;
  flips: Flip[];
  state: number;
  /** The transition just taken, drawn thicker. */
  last: { from: number; to: number; c: Flip } | null;
  done: boolean;
  labels: { flips: string; chain: string; overlaps: string; found: string; chainSays: string };
}) {
  const m = pat.length;
  const gap = Math.min(120, 560 / m);
  const nx = (k: number) => 330 - (gap * m) / 2 + k * gap;
  const shown = flips.slice(-MAX_COINS);
  const cut = flips.length - shown.length;
  const name = (k: number) => (k === 0 ? "∅" : pat.slice(0, k));
  const isLast = (from: number, to: number, c: Flip) => !!last && last.from === from && last.to === to && last.c === c;

  return (
    <svg viewBox={`0 0 ${STAGE_W} ${H}`} className="w-full block">
      {/* ── The flips ── */}
      <T x={20} y={20} size={10} bold color={C.muted}>{labels.flips}</T>
      {cut > 0 && <T x={20} y={52} size={12} color={C.muted}>…</T>}
      {shown.map((c, i) => {
        const x = 46 + i * 31;
        const inMatch = i >= shown.length - state;
        return (
          <g key={cut + i}>
            <circle cx={x} cy={48} r={13} fill={LETTER[c]} opacity={inMatch ? 1 : 0.45} />
            <T x={x} y={52.5} anchor="middle" size={12} bold color="#ffffff">{c}</T>
          </g>
        );
      })}
      {state > 0 && shown.length > 0 && (() => {
        const n = Math.min(state, shown.length);
        const x0 = 46 + (shown.length - n) * 31 - 14, x1 = 46 + (shown.length - 1) * 31 + 14;
        const col = done ? C.green : C.amber;
        return (
          <g>
            <path d={`M${x0},68 L${x0},73 L${x1},73 L${x1},68`} fill="none" stroke={col} strokeWidth={2} />
            <T x={(x0 + x1) / 2} y={88} anchor="middle" size={10} bold color={col}>{done ? labels.found : name(state)}</T>
          </g>
        );
      })()}

      {/* ── The prefix chain ── */}
      <T x={20} y={104} size={10} bold color={C.muted}>{labels.chain}</T>
      {/* Wrong flips: arcs below, or a loop when the progress survives */}
      {next.map((n, k) => (["H", "T"] as Flip[]).map(c => {
        const j = n[c];
        if (j === k + 1) return null;
        const col = LETTER[c], on = isLast(k, j, c);
        const sw = on ? 3 : 1.6, op = on ? 1 : 0.6;
        if (j === k) {
          const x = nx(k), y = CY - NR + 2;
          return (
            <g key={`${k}${c}`} opacity={op}>
              <path d={`M${x - 9},${y} C${x - 26},${y - 34} ${x + 26},${y - 34} ${x + 9},${y - 2}`} fill="none" stroke={col} strokeWidth={sw} />
              <Head x={x + 9} y={y - 2} ux={-0.45} uy={0.9} color={col} />
              <T x={x - 24} y={y - 18} anchor="end" size={10} bold color={col}>{c}</T>
            </g>
          );
        }
        const xa = nx(k) - 8, xb = nx(j) + 8, y = CY + NR - 3;
        const cy = y + 62 + 16 * (k - j);
        const my = (y + 2 * cy + y) / 4;
        const ux = (xb - (xa + xb) / 2), uy = y - cy, len = Math.hypot(ux, uy);
        return (
          <g key={`${k}${c}`} opacity={op}>
            <path d={`M${xa},${y} Q${(xa + xb) / 2},${cy} ${xb},${y}`} fill="none" stroke={col} strokeWidth={sw} />
            <Head x={xb} y={y} ux={ux / len} uy={uy / len} color={col} />
            <T x={(xa + xb) / 2} y={my + 13} anchor="middle" size={10} bold color={col}>{c}</T>
          </g>
        );
      }))}
      {/* Right flips: one node forward */}
      {Array.from({ length: m }, (_, k) => {
        const c = pat[k] as Flip, col = LETTER[c], on = isLast(k, k + 1, c);
        const x0 = nx(k) + NR + 2, x1 = nx(k + 1) - NR - 2;
        return (
          <g key={`f${k}`}>
            <line x1={x0} y1={CY} x2={x1 - 5} y2={CY} stroke={col} strokeWidth={on ? 3.2 : 2} />
            <Head x={x1} y={CY} ux={1} uy={0} color={col} />
            <T x={(x0 + x1) / 2} y={CY - 7} anchor="middle" size={gap < 80 ? 9 : 10} bold color={col}>{`${c} ${chance[c]}`}</T>
          </g>
        );
      })}
      {/* Nodes */}
      {Array.from({ length: m + 1 }, (_, k) => {
        const x = nx(k), on = k === state, end = k === m;
        const lab = name(k);
        return (
          <g key={`n${k}`}>
            {on && <circle cx={x} cy={CY} r={NR + 6} fill={done ? C.green : C.amber} opacity={0.3} />}
            <circle cx={x} cy={CY} r={NR} fill="var(--card)" stroke={end ? C.green : on ? C.amber : C.fg} strokeWidth={on || end ? 2.4 : 1.4} />
            <T x={x} y={CY - 2} anchor="middle" size={lab.length > 4 ? 9.5 : lab.length > 2 ? 11 : 13} bold color={C.fg}>{lab}</T>
            <T x={x} y={CY + 13} anchor="middle" size={9.5} bold color={end ? C.green : C.purple}>{end ? "✓" : `t=${showF(time[k])}`}</T>
          </g>
        );
      })}

      {/* ── The overlaps ── */}
      <T x={20} y={OV_Y} size={10} bold color={C.muted}>{labels.overlaps}</T>
      {overlaps.map((o, i) => {
        const x = i < 3 ? 20 : 345, y = OV_Y + 22 + (i % 3) * 20;
        return (
          <T key={o.k} x={x} y={y} size={11} bold={o.ok} color={o.ok ? C.green : C.muted}>
            {`k=${o.k}  ${o.first} ${o.ok ? "=" : "≠"} ${o.last}${o.ok ? `  → 1/P = ${showF(o.term!)}` : ""}`}
          </T>
        );
      })}
      {(() => {
        const terms = overlaps.filter(o => o.ok).map(o => showF(o.term!));
        const sum = terms.length > 1 && terms.join(" + ").length < 44 ? `${terms.join(" + ")} = ` : "";
        return (
          <>
            <T x={20} y={H - 14} size={12.5} bold color={C.fg}>{`E[T] = ${sum}${showF(total)}`}</T>
            <T x={STAGE_W - 20} y={H - 14} anchor="end" size={10.5} color={C.purple}>{`${labels.chainSays} t(∅) = ${showF(time[0])} ✓`}</T>
          </>
        );
      })()}
    </svg>
  );
}
