"use client";

// ── The staff ─────────────────────────────────────────────────────────────────
// Drawing helpers for the staff chapters. Every white key gets a diatonic
// number d = 7·octave + letter (C = 0 … B = 6), so C4 = 28 and each line or
// space of a staff is one step of d. A staff is a list of line d values (the
// treble's lines are E4 G4 B4 D5 F5 = 30 32 34 36 38) plus its clef; the
// widget maps d to a y coordinate. Clefs are drawn as paths (no music font),
// each centred on the line it names: G on G4, F on F3, C on C4.

import { isBlack, octave, pitchClass } from "@/components/lesson/kit/audio/notes";
import { LETTERS, WHITE_PCS } from "./names";

export type ClefKind = "treble" | "bass" | "alto";

/** The diatonic number of a white key (C4 = 28), or null for a black key. */
export const diatonic = (m: number) => (isBlack(m) ? null : 7 * octave(m) + WHITE_PCS.indexOf(pitchClass(m)));
/** The white key with diatonic number d. */
export const midiOf = (d: number) => 12 * (Math.floor(d / 7) + 1) + WHITE_PCS[((d % 7) + 7) % 7];
/** "C4" for diatonic number d. */
export const dName = (d: number) => LETTERS[((d % 7) + 7) % 7] + Math.floor(d / 7);

/** The five lines of each clef (bottom to top) and the line the clef sits on. */
export const CLEFS: Record<ClefKind, { lines: number[]; anchor: number }> = {
  treble: { lines: [30, 32, 34, 36, 38], anchor: 32 },        // E4 … F5, the G clef curls round G4
  bass: { lines: [18, 20, 22, 24, 26], anchor: 24 },          // G2 … A3, the F clef's dots straddle F3
  alto: { lines: [24, 26, 28, 30, 32], anchor: 28 },          // F3 … G4, the C clef points at C4
};

/** The ledger lines a note at d needs, given the staff lines (short lines above or below). */
export function ledgers(d: number, lines: number[]) {
  const lo = Math.min(...lines), hi = Math.max(...lines), out: number[] = [];
  for (let x = lo - 2; x >= d; x -= 2) out.push(x);
  for (let x = hi + 2; x <= d; x += 2) out.push(x);
  // between two staves (a grand staff), the gap's lines that are not staff lines
  if (d > lo && d < hi && !lines.includes(d) && (d - lo) % 2 === 0) out.push(d);
  return out;
}

/** A clef drawn at x with its anchor line at y; `s` is the gap between two lines. */
export function Clef({ kind, x, y, s, color }: { kind: ClefKind; x: number; y: number; s: number; color: string }) {
  const k = s / 10;
  if (kind === "treble") {
    return (
      <g transform={`translate(${x} ${y}) scale(${k})`} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
        <path d="M2,3 C-4,4 -5,-4 1,-5 C8,-6 11,3 6,8 C0,13 -10,9 -11,1 C-12,-8 -2,-14 4,-20 C9,-26 9,-38 4,-40 C-1,-41 -4,-32 -2,-24 L6,22 C7,29 0,31 -3,27" />
        <circle cx={-2} cy={25} r={3} fill={color} stroke="none" />
      </g>
    );
  }
  if (kind === "bass") {
    return (
      <g transform={`translate(${x} ${y}) scale(${k})`} stroke={color} strokeLinecap="round">
        <path d="M-7,-1 C-7,-9 6,-10 8,-2 C10,7 1,17 -11,22" fill="none" strokeWidth={2.8} />
        <circle cx={-6} cy={0} r={3.4} fill={color} stroke="none" />
        <circle cx={14} cy={-5} r={1.9} fill={color} stroke="none" />
        <circle cx={14} cy={5} r={1.9} fill={color} stroke="none" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} stroke={color} strokeLinecap="round">
      <rect x={-12} y={-20} width={4.5} height={40} fill={color} stroke="none" />
      <rect x={-5} y={-20} width={1.6} height={40} fill={color} stroke="none" />
      <path d="M-3,0 L2,-5 C3,-17 13,-21 13,-12 C13,-7 8,-7 7,-10" fill="none" strokeWidth={2.4} />
      <path d="M-3,0 L2,5 C3,17 13,21 13,12 C13,7 8,7 7,10" fill="none" strokeWidth={2.4} />
    </g>
  );
}

/** A whole-note head (hollow oval) at (x, y), with its ledger lines. */
export function StaffNote({ x, y, color, ledgerYs, s, filled = false }: {
  x: number; y: number; color: string; ledgerYs: number[]; s: number; filled?: boolean;
}) {
  return (
    <g>
      {ledgerYs.map((ly, i) => <line key={i} x1={x - s * 1.1} x2={x + s * 1.1} y1={ly} y2={ly} stroke={color} strokeWidth={1.3} />)}
      <ellipse cx={x} cy={y} rx={s * 0.62} ry={s * 0.44} transform={`rotate(-18 ${x} ${y})`}
        fill={filled ? color : "none"} stroke={color} strokeWidth={filled ? 1 : 2} />
    </g>
  );
}
