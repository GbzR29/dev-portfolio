"use client";

// ── Note and rest glyphs ──────────────────────────────────────────────────────
// Hand-drawn SVG versions of the rhythm symbols, so the widgets do not depend
// on a music font. A note value is named by the fraction of a whole note it
// lasts: 1 whole, 2 half, 4 quarter, 8 eighth, 16 sixteenth. The head is
// hollow for 1 and 2 and filled from 4 on; every value from 2 on has a stem;
// each flag halves the value again (8 has one, 16 two). A dot after the note
// adds half its value. (x, y) is the centre of the note head, or of the rest.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export type NoteValue = 1 | 2 | 4 | 8 | 16;

export const VALUES: NoteValue[] = [1, 2, 4, 8, 16];

/** Beats a value lasts when the beat is a quarter note: 4 / value, times the dots' extra. */
export const beatsOf = (v: NoteValue, dots = 0) => (4 / v) * (2 - 1 / 2 ** dots);

/** The (US) name of a value: "quarter note"…; PT in components/lesson/i18n/pt/music.ts. */
export const valueName = (t: TrackTranslations | undefined, v: NoteValue) => ({
  1: tx(t, "figMus_nv1", "whole note"),
  2: tx(t, "figMus_nv2", "half note"),
  4: tx(t, "figMus_nv4", "quarter note"),
  8: tx(t, "figMus_nv8", "eighth note"),
  16: tx(t, "figMus_nv16", "sixteenth note"),
})[v];

const STEM = 26;

/** One flag hanging from the top of a stem at (sx, y0). */
const flag = (sx: number, y0: number) =>
  `M${sx},${y0} C${sx + 1},${y0 + 6} ${sx + 9},${y0 + 8} ${sx + 6},${y0 + 17} C${sx + 7},${y0 + 10} ${sx + 2},${y0 + 9} ${sx},${y0 + 8} Z`;

export function NoteGlyph({ x, y, value, dots = 0, color, scale = 1 }: {
  x: number; y: number; value: NoteValue; dots?: number; color: string; scale?: number;
}) {
  const hollow = value <= 2, sx = 4.7, flags = value === 8 ? 1 : value === 16 ? 2 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={0} rx={value === 1 ? 6 : 5.2} ry={value === 1 ? 4.2 : 3.8} transform="rotate(-20)"
        fill={hollow ? "none" : color} stroke={color} strokeWidth={hollow ? 1.8 : 1} />
      {value > 1 && <line x1={sx} x2={sx} y1={-0.8} y2={-STEM} stroke={color} strokeWidth={1.4} />}
      {Array.from({ length: flags }, (_, i) => <path key={i} d={flag(sx, -STEM + i * 6)} fill={color} />)}
      {Array.from({ length: dots }, (_, i) => <circle key={i} cx={10 + i * 5} cy={-1.5} r={1.7} fill={color} />)}
    </g>
  );
}

/** The rest that lasts as long as `value`. */
export function RestGlyph({ x, y, value, dots = 0, color, scale = 1 }: {
  x: number; y: number; value: NoteValue; dots?: number; color: string; scale?: number;
}) {
  const hooks = value === 8 ? 1 : value === 16 ? 2 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* whole rest hangs below its line, half rest sits on it */}
      {value === 1 && <><line x1={-8} x2={8} y1={-5} y2={-5} stroke={color} strokeWidth={1.2} /><rect x={-5} y={-5} width={10} height={4.5} fill={color} /></>}
      {value === 2 && <><line x1={-8} x2={8} y1={0} y2={0} stroke={color} strokeWidth={1.2} /><rect x={-5} y={-4.5} width={10} height={4.5} fill={color} /></>}
      {value === 4 && (
        <path d="M-2,-12 L3,-6 L-1.5,-1 L3.5,5 C-2,3 -3,7 0,10" fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {hooks > 0 && (
        <>
          <line x1={4} y1={-9} x2={-1 - (hooks - 1) * 2} y2={9} stroke={color} strokeWidth={1.4} />
          {Array.from({ length: hooks }, (_, i) => (
            <g key={i}>
              <circle cx={-3 - i * 2} cy={-7 + i * 6} r={2.3} fill={color} />
              <path d={`M${-3 - i * 2},${-6 + i * 6} Q${0 - i * 2},${-5 + i * 6} ${4 - i * 2},${-9 + i * 6}`} fill="none" stroke={color} strokeWidth={1.2} />
            </g>
          ))}
        </>
      )}
      {Array.from({ length: dots }, (_, i) => <circle key={i} cx={10 + i * 5} cy={-1.5} r={1.7} fill={color} />)}
    </g>
  );
}
