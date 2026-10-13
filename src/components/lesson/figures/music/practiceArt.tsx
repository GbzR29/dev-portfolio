"use client";

// ── Start-card pictures for the Music practice rounds ─────────────────────────
// Drawn SVG vignettes (no emoji): a few piano keys with one picked out, and a
// scrap of staff with a clef and a note.

import { C } from "@/components/lesson/kit/figure";
import { Clef } from "./staff";

/** Four white keys (C D E F) and their two black keys, the E lit. */
export function KeysArt() {
  return (
    <svg viewBox="0 0 76 52" className="w-[88px] h-[60px]" aria-hidden>
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x={4 + i * 17} y={4} width={16} height={44} rx={2.5}
          fill={i === 2 ? C.amber : "#fbfbf8"} stroke="#3b3f42" strokeWidth={1} />
      ))}
      {/* C D E F: black keys between C–D and D–E, none between E and F */}
      {[15, 32].map(x => <rect key={x} x={x} y={4} width={10} height={26} rx={1.8} fill="#1f2326" />)}
    </svg>
  );
}

/** Five lines, a treble clef and a whole note. */
export function StaffArt() {
  return (
    <svg viewBox="0 0 96 56" className="w-[96px] h-[56px]" aria-hidden>
      {[0, 1, 2, 3, 4].map(i => <line key={i} x1={4} x2={92} y1={12 + i * 8} y2={12 + i * 8} stroke={C.fg} strokeOpacity={0.55} strokeWidth={1.1} />)}
      <Clef kind="treble" x={18} y={36} s={8} color={C.fg} />
      <ellipse cx={58} cy={24} rx={5.6} ry={4} transform="rotate(-18 58 24)" fill="none" stroke={C.amber} strokeWidth={2.2} />
      <ellipse cx={76} cy={32} rx={5.6} ry={4} transform="rotate(-18 76 32)" fill="none" stroke={C.fg} strokeOpacity={0.6} strokeWidth={2} />
    </svg>
  );
}
