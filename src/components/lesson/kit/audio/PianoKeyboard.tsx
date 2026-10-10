"use client";

// ── Piano keyboard ────────────────────────────────────────────────────────────
// A clickable keyboard drawn in SVG. It only reports key presses (onDown/onUp);
// the widget decides what sounds. Every finger or the mouse is tracked on its
// own, so chords work on touch screens, and dragging across the keys plays a
// glissando. When focused, the computer keyboard plays it too: the row
// A S D F G H J K L ; are the white keys from the first C, W E T Y U O P the
// black ones between them.
//
// `lo` and `hi` should be white keys (a black key at an end would be cut off).

import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { isBlack, noteName, pitchClass } from "./notes";

const WW = 24, WH = 120;                                   // white key, viewBox units
const BW = 14, BH = 74;                                    // black key
// Where a black key's centre sits, as a fraction of a white key from the
// left edge of the white key to its right: C♯ and D♯ lean apart, F♯ G♯ A♯ spread.
const BLACK_SHIFT: Record<number, number> = { 1: -0.1, 3: 0.1, 6: -0.12, 8: 0, 10: 0.12 };

const KEYMAP = "awsedftgyhujkolp;";                       // C D♭ D E♭ E F G♭ G A♭ A B♭ B C D♭ D E♭ E

export type KeyLabels = "none" | "c" | "white";

/** White keys side by side; each black key straddles the line before the white key above it. */
function layout(lo: number, hi: number) {
  const keys = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const whites = keys.filter(m => !isBlack(m));
  const xOf = new Map(whites.map((m, i) => [m, i * WW]));
  const blacks = keys.filter(m => isBlack(m) && m > lo && m < hi)
    .map(m => [m, xOf.get(m + 1)! + BLACK_SHIFT[pitchClass(m)] * WW - BW / 2] as const);
  return { whites, xOf, blacks, W: whites.length * WW };
}

export function PianoKeyboard({ lo, hi, pressed, onDown, onUp, labels = "c", color = "#f43f5e", ariaLabel }: {
  lo: number;
  hi: number;
  /** Keys drawn as pressed: the ones being played, or a chord to show. */
  pressed: ReadonlySet<number>;
  onDown: (m: number) => void;
  onUp: (m: number) => void;
  labels?: KeyLabels;
  color?: string;
  ariaLabel?: string;
}) {
  // Each pointer (finger, mouse) holds at most one key
  const pointers = useRef(new Map<number, number>());
  const keys = useRef(new Map<string, number>());
  const handlers = useRef({ onDown, onUp });
  useEffect(() => { handlers.current = { onDown, onUp }; });

  const { whites, xOf, blacks, W } = layout(lo, hi);
  const firstC = lo + ((12 - pitchClass(lo)) % 12);

  const keyAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    const m = el instanceof Element ? el.getAttribute("data-m") : null;
    return m === null ? null : Number(m);
  };

  const press = useCallback((id: number, m: number | null) => {
    const prev = pointers.current.get(id);
    if (prev === m) return;
    if (prev !== undefined) { pointers.current.delete(id); handlers.current.onUp(prev); }
    if (m !== null) { pointers.current.set(id, m); handlers.current.onDown(m); }
  }, []);

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    press(e.pointerId, keyAt(e.clientX, e.clientY));
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) press(e.pointerId, keyAt(e.clientX, e.clientY));
  };
  const up = (e: PointerEvent<SVGSVGElement>) => press(e.pointerId, null);

  const keyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const i = KEYMAP.indexOf(e.key.toLowerCase());
    if (i < 0) return;
    e.preventDefault();
    if (e.repeat || keys.current.has(e.key.toLowerCase())) return;
    const m = firstC + i;
    if (m < lo || m > hi) return;
    keys.current.set(e.key.toLowerCase(), m);
    handlers.current.onDown(m);
  };
  const keyUp = (e: KeyboardEvent<SVGSVGElement>) => {
    const m = keys.current.get(e.key.toLowerCase());
    if (m === undefined) return;
    keys.current.delete(e.key.toLowerCase());
    handlers.current.onUp(m);
  };
  const blur = () => {
    for (const m of keys.current.values()) handlers.current.onUp(m);
    keys.current.clear();
  };

  return (
    <svg viewBox={`-1 -1 ${W + 2} ${WH + 2}`} className="w-full h-auto block outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
      style={{ touchAction: "none", maxHeight: 220 }} tabIndex={0} role="group" aria-label={ariaLabel}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onKeyDown={keyDown} onKeyUp={keyUp} onBlur={blur}>
      {whites.map(m => {
        const on = pressed.has(m);
        const label = labels === "white" || (labels === "c" && pitchClass(m) === 0) ? noteName(m) : null;
        return (
          <g key={m}>
            <rect data-m={m} x={xOf.get(m)} y={0} width={WW} height={WH} rx={2.5}
              fill={on ? color : "#fbfbf8"} fillOpacity={on ? 0.85 : 1} stroke="#3b3f42" strokeWidth={0.8} />
            {label && (
              <text x={xOf.get(m)! + WW / 2} y={WH - 7} textAnchor="middle" fontSize={8.5}
                fill={on ? "#fff" : "#55595c"} pointerEvents="none" fontFamily="var(--font-mono, monospace)">{label}</text>
            )}
          </g>
        );
      })}
      {blacks.map(([m, x]) => (
        <rect key={m} data-m={m} x={x} y={0} width={BW} height={BH} rx={2}
          fill={pressed.has(m) ? color : "#1f2326"} stroke="#0d0f10" strokeWidth={0.8} />
      ))}
    </svg>
  );
}
