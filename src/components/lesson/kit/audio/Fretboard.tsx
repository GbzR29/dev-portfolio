"use client";

// ── Guitar fretboard ──────────────────────────────────────────────────────────
// A clickable guitar neck drawn in SVG, the guitar's twin of PianoKeyboard: it
// reports notes (MIDI numbers) through onDown/onUp and the widget decides what
// sounds. The thin high E string is on top, as in tablature and chord charts;
// the open strings sit in a column on the left.
//
// Frets are spaced like a real neck: fret n sits where the string's sounding
// length is 2^(−n/12) of the whole, so each fret is a little narrower than the
// one before and fret 12 halves the string (an octave).
//
// `first`…`last` is the stretch of neck shown (a phone shows 7 frets at a
// time); the open strings are always there. When `first` > 1 the nut is
// replaced by a gap and the first fret's number.
//
// The same note lives in several places. A place the reader is holding is a
// filled dot; every other place of a sounding note gets a ring. A note lit
// from outside (`pressed`) fills its lowest-fret place on screen and rings the
// rest, so linked widgets (the mini keyboard, a melody playing) show where a
// guitarist would usually play it and where else it is.

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { noteName, pitchClass } from "./notes";

/** Standard tuning, low to high: E2 A2 D3 G3 B3 E4. */
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64] as const;

const OPEN_W = 34;                                         // the open-string column left of the nut
const SP = 22;                                             // between strings
const TOP = 14;                                            // above the high E
const NUMS = 16;                                           // fret numbers under the neck
const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];               // single dots; 12 and 24 get two

export type FretPos = { s: number; f: number };            // string (0 = low E) and fret (0 = open)
const posKey = (p: FretPos) => `${p.s}:${p.f}`;

/** Fraction of the string between the nut and fret n. */
const P = (n: number) => 1 - 2 ** (-n / 12);

/**
 * Where frets sit, in viewBox units, for frets `first`…`last` on a neck
 * `neckW` wide: wire(n) is the x of fret wire n (wire(first − 1) is the nut or
 * the gap), cx(f) the middle of fret f's space (the open column for f = 0).
 */
export function fretLayout(first: number, last: number, neckW = 560, strings = 6) {
  const a = P(first - 1), k = neckW / (P(last) - a);
  const wire = (n: number) => OPEN_W + (P(n) - a) * k;
  const cx = (f: number) => (f === 0 ? OPEN_W / 2 : (wire(f - 1) + wire(f)) / 2);
  const yOf = (s: number) => TOP + (strings - 1 - s) * SP;
  return { wire, cx, yOf, W: OPEN_W + neckW, H: TOP + (strings - 1) * SP + TOP + NUMS };
}

/** Every place note `m` can be played up to fret `last`, low string first. */
export function positionsOf(m: number, tuning: readonly number[] = STANDARD_TUNING, last = 12): FretPos[] {
  return tuning.flatMap((open, s) => (m - open >= 0 && m - open <= last ? [{ s, f: m - open }] : []));
}

/** Where a guitarist would usually play `m`: the place with the lowest fret, among those in `ok`. */
export function homePos(m: number, tuning: readonly number[] = STANDARD_TUNING, last = 12, ok: (p: FretPos) => boolean = () => true) {
  const all = positionsOf(m, tuning, last).filter(ok);
  return all.length ? all.reduce((a, b) => (b.f < a.f ? b : a)) : null;
}

export function Fretboard({ pressed, onDown, onUp, first = 1, last = 12, neckW = 560, tuning = STANDARD_TUNING, labels = "c",
  labelOf, keyColor, color = "#f43f5e", ariaLabel }: {
  /** Notes drawn as sounding (MIDI numbers), from this neck or from outside. */
  pressed: ReadonlySet<number>;
  /** A place was pressed: its note, and which string and fret (for tablature). */
  onDown: (m: number, p: FretPos) => void;
  onUp: (m: number) => void;
  /** First and last fret shown (the open strings always are). */
  first?: number;
  last?: number;
  /** Width of the fretted part, viewBox units (the height is fixed): smaller = bigger on a phone. */
  neckW?: number;
  tuning?: readonly number[];
  /** "c": name the C's (like the piano); "none": no names. */
  labels?: "none" | "c";
  /** A label for any note (null for none); replaces `labels` when given. */
  labelOf?: (m: number) => string | null;
  /** A colour for any note (null for the usual look); fills all its places, wins over `pressed`. */
  keyColor?: (m: number) => string | null;
  color?: string;
  ariaLabel?: string;
}) {
  // Each pointer (finger, mouse) holds at most one place
  const pointers = useRef(new Map<number, FretPos>());
  const [held, setHeld] = useState<ReadonlyMap<string, FretPos>>(new Map());
  const handlers = useRef({ onDown, onUp });
  useEffect(() => { handlers.current = { onDown, onUp }; });

  const { wire, cx, yOf, W, H } = fretLayout(first, last, neckW, tuning.length);
  const noteAt = (p: FretPos) => tuning[p.s] + p.f;
  const shown = (p: FretPos) => p.f === 0 || (p.f >= first && p.f <= last);
  const fretsShown = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  const placeAt = (px: number, py: number): FretPos | null => {
    const el = document.elementFromPoint(px, py);
    const v = el instanceof Element ? el.getAttribute("data-pos") : null;
    if (v === null) return null;
    const [s, f] = v.split(":").map(Number);
    return { s, f };
  };

  const press = useCallback((id: number, p: FretPos | null) => {
    const prev = pointers.current.get(id);
    if (prev && p && posKey(prev) === posKey(p)) return;
    if (prev) {
      pointers.current.delete(id);
      setHeld(h => { const n = new Map(h); n.delete(posKey(prev)); return n; });
      handlers.current.onUp(tuning[prev.s] + prev.f);
    }
    if (p) {
      pointers.current.set(id, p);
      setHeld(h => new Map(h).set(posKey(p), p));
      handlers.current.onDown(tuning[p.s] + p.f, p);
    }
  }, [tuning]);

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    press(e.pointerId, placeAt(e.clientX, e.clientY));
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) press(e.pointerId, placeAt(e.clientX, e.clientY));
  };
  const up = (e: PointerEvent<SVGSVGElement>) => press(e.pointerId, null);

  const heldNotes = new Set([...held.values()].map(noteAt));
  const label = (m: number) => (labelOf ? labelOf(m) : labels === "c" && pitchClass(m) === 0 ? noteName(m) : null);
  const bottom = yOf(0), top = yOf(tuning.length - 1), mid = (top + bottom) / 2;
  const x0 = wire(first - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
      style={{ touchAction: "none", maxHeight: 240 }} tabIndex={0} role="group" aria-label={ariaLabel}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {/* The neck: rosewood, with the inlay dots */}
      <rect x={x0} y={top - SP / 2} width={W - x0} height={bottom - top + SP} rx={3} fill="#3b2a20" />
      {fretsShown.map(f => f % 12 === 0
        ? <g key={f} fill="#e9e1cf" opacity={0.55}><circle cx={cx(f)} cy={mid - SP} r={4} /><circle cx={cx(f)} cy={mid + SP} r={4} /></g>
        : INLAYS.includes(f) ? <circle key={f} cx={cx(f)} cy={mid} r={4} fill="#e9e1cf" opacity={0.55} /> : null)}

      {/* The nut (or, further up the neck, a gap), then the fret wires */}
      {first === 1
        ? <rect x={x0 - 4} y={top - SP / 2} width={5} height={bottom - top + SP} rx={1} fill="#efe9da" />
        : <line x1={x0 - 6} x2={x0 - 6} y1={top - SP / 2} y2={bottom + SP / 2} stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="2 3" />}
      {fretsShown.map(f => (
        <line key={f} x1={wire(f)} x2={wire(f)} y1={top - SP / 2} y2={bottom + SP / 2} stroke="#b9bcbf" strokeWidth={2} />
      ))}

      {/* Strings: the three low ones are wound (bronze), the three high ones plain nylon */}
      {tuning.map((_, s) => (
        <line key={s} x1={4} x2={W} y1={yOf(s)} y2={yOf(s)}
          stroke={s < 3 ? "#c9a46a" : "#e6e2d6"} strokeWidth={s < 3 ? 2.6 - s * 0.4 : 1.6 - (s - 3) * 0.25} />
      ))}

      {/* Fret numbers: the usual dotted frets, and the first one shown when it is not by the nut */}
      {fretsShown.filter(f => [3, 5, 7, 9, 12, 15, 17, 19].includes(f) || (f === first && first > 1)).map(f => (
        <text key={f} x={cx(f)} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--text-muted)"
          fontFamily="var(--font-mono, monospace)">{f}</text>
      ))}

      {/* Places: an invisible hit area each, and a dot when the note sounds or is named */}
      {tuning.map((open, s) => [0, ...fretsShown].map(f => {
        const m = open + f, k = `${s}:${f}`;
        const paint = keyColor?.(m) ?? null;
        const mine = held.has(k);
        const home = homePos(m, tuning, last, shown);
        const lit = heldNotes.has(m) || pressed.has(m);
        // Filled: held here, painted, or lit from outside at its home place; ringed: lit elsewhere
        const fill = paint !== null || mine || (lit && !heldNotes.has(m) && home !== null && posKey(home) === k);
        const ring = !fill && lit;
        const name = label(m);
        const a = f === 0 ? 0 : wire(f - 1), b = f === 0 ? x0 - 6 : wire(f);
        return (
          <g key={k}>
            <rect data-pos={k} x={a} y={yOf(s) - SP / 2} width={b - a} height={SP} fill="transparent" />
            {(fill || ring || name) && (
              <g pointerEvents="none">
                <circle cx={cx(f)} cy={yOf(s)} r={8}
                  fill={fill ? paint ?? color : ring ? "#3b2a20" : "#f4efe3"}
                  stroke={ring ? paint ?? color : fill ? "none" : "#8a7d6a"} strokeWidth={ring ? 2 : 0.8} />
                {name && (
                  <text x={cx(f)} y={yOf(s) + 2.6} textAnchor="middle" fontSize={name.length > 3 ? 5.6 : 7}
                    fill={fill ? "#fff" : ring ? "#f4efe3" : "#3b2a20"} fontFamily="var(--font-mono, monospace)">{name}</text>
                )}
              </g>
            )}
          </g>
        );
      }))}
    </svg>
  );
}
