"use client";

// ── Note surface ──────────────────────────────────────────────────────────────
// Where a widget's notes are played: the piano keyboard, or (on the guitar)
// the fretboard with a small keyboard under it as a map. Both report the same
// MIDI numbers and share `pressed`, so a fret lights its key and a key lights
// every place of its note on the neck. Widgets use this instead of naming
// PianoKeyboard, and follow the reader's instrument (useInstrument) for free.
//
// `lo`/`hi` are the piano's range (white keys); the mini keyboard widens it to
// the neck's range too (E2 up to the last fret), so every note either can
// sound is on it.
//
// A whole neck on a phone would leave the strings a few pixels apart, so a
// phone shows 7 frets at a time, with buttons to move along the neck.

import { useCallback, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn } from "../figure";
import { PHONE, useMediaQuery } from "../media";
import { PianoKeyboard, type KeyLabels } from "./PianoKeyboard";
import { Fretboard, STANDARD_TUNING, type FretPos } from "./Fretboard";
import { isBlack } from "./notes";
import { useInstrument } from "./useInstrument";

const SPAN = 7;                                            // frets per window on a phone

/** The phone windows over frets 1…last: 1–7, 6–12, 11–17… with the last one ending at `last`. */
function windows(last: number) {
  const out: [number, number][] = [];
  for (let a = 1; a + SPAN - 1 < last; a += 5) out.push([a, a + SPAN - 1]);
  out.push([Math.max(1, last - SPAN + 1), last]);
  return out;
}

export function NoteSurface({ t, lo, hi, pressed, onDown, onUp, labels = "c", labelOf, keyColor, color, frets = 12, ariaLabel,
  guitarAriaLabel }: {
  t?: TrackTranslations;
  lo: number;
  hi: number;
  pressed: ReadonlySet<number>;
  /** A note was pressed; on the neck, `p` also says which string and fret. */
  onDown: (m: number, p?: FretPos) => void;
  onUp: (m: number) => void;
  labels?: KeyLabels;
  labelOf?: (m: number) => string | null;
  keyColor?: (m: number) => string | null;
  color?: string;
  /** The last fret shown on the guitar. */
  frets?: number;
  ariaLabel?: string;
  guitarAriaLabel?: string;
}) {
  const [inst] = useInstrument();
  const phone = useMediaQuery(PHONE);
  const [win, setWin] = useState(0);

  // The same note may be held on the neck and on the mini keyboard at once: count holds per note,
  // so the widget hears one onDown when the first starts and one onUp when the last ends
  const holds = useRef(new Map<number, number>());
  const down = useCallback((m: number, p?: FretPos) => {
    const n = holds.current.get(m) ?? 0;
    holds.current.set(m, n + 1);
    if (n === 0) onDown(m, p);
  }, [onDown]);
  const up = useCallback((m: number) => {
    const n = holds.current.get(m) ?? 0;
    if (n <= 1) { holds.current.delete(m); if (n === 1) onUp(m); }
    else holds.current.set(m, n - 1);
  }, [onUp]);

  if (inst === "piano") return (
    <PianoKeyboard lo={lo} hi={hi} pressed={pressed} onDown={onDown} onUp={onUp} labels={labels} labelOf={labelOf}
      keyColor={keyColor} color={color} ariaLabel={ariaLabel} />
  );

  const miniLo = Math.min(lo, STANDARD_TUNING[0]);
  let miniHi = Math.max(hi, STANDARD_TUNING[5] + frets);
  if (isBlack(miniHi)) miniHi++;
  const wins = windows(frets);
  const [first, last] = phone ? wins[Math.min(win, wins.length - 1)] : [1, frets];

  return (
    <div className="flex flex-col gap-2">
      {phone && (
        <div className="flex gap-1.5 items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_frets", "frets")}</span>
          {wins.map(([a, b], i) => (
            <Btn key={a} active={Math.min(win, wins.length - 1) === i} onClick={() => setWin(i)}>{a}–{b}</Btn>
          ))}
        </div>
      )}
      <Fretboard pressed={pressed} onDown={down} onUp={up} first={first} last={last} neckW={phone ? 270 : 560}
        labels={labels === "none" ? "none" : "c"} labelOf={labelOf} keyColor={keyColor} color={color} ariaLabel={guitarAriaLabel} />
      <div className="mx-auto w-full" style={{ maxWidth: 420 }}>
        <PianoKeyboard lo={miniLo} hi={miniHi} pressed={pressed} onDown={down} onUp={up} labels={labels}
          labelOf={labelOf} keyColor={keyColor} color={color} ariaLabel={ariaLabel} />
      </div>
    </div>
  );
}
