"use client";

// ── Accidentals ───────────────────────────────────────────────────────────────
// Spelled notes for the chapters from "sharps and flats" on. A written note is
// a white-key position d (staff.tsx: d = 7·octave + letter, C4 = 28) plus an
// accidental a: −2 double flat, −1 flat, 0 none / natural, +1 sharp, +2 double
// sharp. The key it asks for is midiOf(d) + a. The octave number belongs to
// the letter, so B♯3 is the same key as C4. The signs are drawn as paths (no
// music font), centred on the note's line or space.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { LETTERS, solfa } from "./names";
import { midiOf } from "./staff";

export type Acc = -2 | -1 | 0 | 1 | 2;
export type Spelled = { d: number; a: Acc };

/** The accidental as text (double signs written twice: fonts rarely carry 𝄪 and 𝄫). */
export const ACC_TEXT: Record<Acc, string> = { [-2]: "♭♭", [-1]: "♭", 0: "", 1: "♯", 2: "♯♯" };

export const letterOf = (d: number) => ((d % 7) + 7) % 7;
export const octaveOf = (d: number) => Math.floor(d / 7);
/** The key (MIDI number) a spelled note asks for. */
export const keyOf = ({ d, a }: Spelled) => midiOf(d) + a;
/** "F♯4" (or "F♯" without the octave). */
export const spelledName = ({ d, a }: Spelled, withOctave = true) =>
  LETTERS[letterOf(d)] + ACC_TEXT[a] + (withOctave ? octaveOf(d) : "");

/** The accidental's name in words: "sharp", "double flat"… ("" for none). */
export const accWord = (t: TrackTranslations | undefined, a: Acc, natural = false) => ({
  [-2]: tx(t, "figMus_acWff", "double flat"),
  [-1]: tx(t, "figMus_acWf", "flat"),
  0: natural ? tx(t, "figMus_acWn", "natural") : "",
  1: tx(t, "figMus_acWs", "sharp"),
  2: tx(t, "figMus_acWss", "double sharp"),
})[a];

/** "fa sharp", "si flat": the solfège name in words. */
export const spelledSolfa = (t: TrackTranslations | undefined, sp: Spelled) =>
  `${solfa(t)[letterOf(sp.d)]} ${accWord(t, sp.a)}`.trim();

/** Every spelling of key m with at most `max` signs (1: sharps and flats, 2: doubles too), lowest letter first. */
export function spellings(m: number, max: 1 | 2 = 2): Spelled[] {
  const out: Spelled[] = [];
  const d0 = 7 * (Math.floor(m / 12) - 2);
  for (let d = d0; d < d0 + 21; d++) {
    const a = m - midiOf(d);
    if (Math.abs(a) <= max) out.push({ d, a: a as Acc });
  }
  return out;
}

// ── The signs ─────────────────────────────────────────────────────────────────

/** How far left of the note head the sign's centre goes, in staff spaces. */
export const accOffset = (a: Acc) => (a === -2 ? 2.1 : a === 2 ? 1.6 : 1.7);

/** One accidental sign centred at (x, y); `s` is the gap between two staff lines. A natural is drawn for a = 0. */
export function AccidentalGlyph({ a, x, y, s, color }: { a: Acc; x: number; y: number; s: number; color: string }) {
  const k = s / 10;
  const flat = (dx: number) => (
    <g key={dx}>
      <line x1={dx - 2.6} x2={dx - 2.6} y1={-17} y2={5} strokeWidth={1.3} />
      <path d={`M${dx - 2.6},-1 C${dx + 0.5},-5.5 ${dx + 6.2},-5 ${dx + 4.4},-0.6 C${dx + 3.2},2.2 ${dx},3.8 ${dx - 2.6},5`} fill="none" strokeWidth={1.9} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} stroke={color} fill={color} strokeLinecap="butt">
      {a === 1 && <>
        <line x1={-2.2} x2={-2.2} y1={-12} y2={15} strokeWidth={1.1} />
        <line x1={2.2} x2={2.2} y1={-15} y2={12} strokeWidth={1.1} />
        <line x1={-5} x2={5} y1={-2.6} y2={-5.6} strokeWidth={2.6} />
        <line x1={-5} x2={5} y1={5.6} y2={2.6} strokeWidth={2.6} />
      </>}
      {a === 0 && <>
        <line x1={-2.5} x2={-2.5} y1={-15} y2={4.5} strokeWidth={1.2} />
        <line x1={2.5} x2={2.5} y1={-4.5} y2={15} strokeWidth={1.2} />
        <line x1={-2.5} x2={2.5} y1={-2.8} y2={-4.6} strokeWidth={2.5} />
        <line x1={-2.5} x2={2.5} y1={4.6} y2={2.8} strokeWidth={2.5} />
      </>}
      {a === -1 && flat(0)}
      {a === -2 && [flat(-3.6), flat(3.6)]}
      {a === 2 && <>
        <line x1={-3.4} x2={3.4} y1={-3.4} y2={3.4} strokeWidth={1.5} />
        <line x1={-3.4} x2={3.4} y1={3.4} y2={-3.4} strokeWidth={1.5} />
        {[[-3.4, -3.4], [3.4, -3.4], [-3.4, 3.4], [3.4, 3.4]].map(([cx, cy]) => (
          <rect key={`${cx},${cy}`} x={cx - 1.6} y={cy - 1.6} width={3.2} height={3.2} stroke="none" transform={`rotate(45 ${cx} ${cy})`} />
        ))}
      </>}
    </g>
  );
}
