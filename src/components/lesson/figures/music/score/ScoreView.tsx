"use client";

// ── Score drawing ─────────────────────────────────────────────────────────────
// The score as SVG, from the model (model.ts) and its layout (layout.ts):
// staff systems with the clef (and, on the guitar, the small 8 under it), the
// time signature on the first one, notes with stems up or down, flags, dots,
// signs, ties and rests, and the bar lines. Colours say what the reader
// should notice: blue the selected item, amber the one sounding, purple a
// note whose sign was written earlier, red a note running over the bar line
// or a tie that cannot hold. Clicks are handed back as (system, x, y).

import type { PointerEvent } from "react";
import { C, T } from "@/components/lesson/kit/figure";
import { Clef, ledgers } from "../staff";
import { RestGlyph } from "../notation";
import { AccidentalGlyph, accOffset } from "../accidentals";
import { lenOf, type Read, type Score } from "./model";
import { SYS_H, X_CLEF, STEP, staffOf, sysTop, yOf, type Layout } from "./layout";

const S = 2 * STEP, STEM = 30;

/** One flag hanging from the end of a stem at (sx, y0), drawn for a stem going up. */
const flag = (sx: number, y0: number) =>
  `M${sx},${y0} C${sx + 1},${y0 + 6} ${sx + 9},${y0 + 8} ${sx + 6},${y0 + 17} C${sx + 7},${y0 + 10} ${sx + 2},${y0 + 9} ${sx},${y0 + 8} Z`;

/** A note head with its stem (up on the right, down on the left), flags and dot. */
function Note({ x, y, v, dot, down, onLine, color }: {
  x: number; y: number; v: number; dot: boolean; down: boolean; onLine: boolean; color: string;
}) {
  const hollow = v <= 2, flags = v === 8 ? 1 : v === 16 ? 2 : 0, sx = down ? -4.7 : 4.7;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={v === 1 ? 6 : 5.2} ry={v === 1 ? 4.2 : 3.8} transform="rotate(-20)"
        fill={hollow ? "none" : color} stroke={color} strokeWidth={hollow ? 1.8 : 1} />
      {v > 1 && (
        // a stem going down is the stem going up, mirrored: flags still curl right
        <g transform={down ? "scale(1 -1)" : undefined}>
          <line x1={sx} x2={sx} y1={-0.8} y2={-STEM} stroke={color} strokeWidth={1.4} />
          {Array.from({ length: flags }, (_, i) => <path key={i} d={flag(sx, -STEM + i * 6)} fill={color} />)}
        </g>
      )}
      {dot && <circle cx={10} cy={onLine ? -STEP : 0} r={1.7} fill={color} />}
    </g>
  );
}

export function ScoreView({ score, reads, lay, sel, sounding, ghost, octaveClef, onPointerDown, onPointerMove, onPointerLeave, svgRef, emptyHint }: {
  score: Score;
  reads: Read[];
  lay: Layout;
  sel: number | null;
  sounding: number | null;
  ghost: { d: number } | null;
  octaveClef: boolean;
  onPointerDown: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerLeave: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  emptyHint: string;
}) {
  const { lines, anchor } = staffOf(score);
  const mid = lines[2], X1 = lay.x1;

  const colorOf = (i: number) => {
    const r = reads[i];
    if (i === sounding) return C.amber;
    if (r.crosses || r.tieBad) return C.red;
    if (i === sel) return C.blue;
    return r.carried ? C.purple : C.fg;
  };

  const tie = (i: number) => {
    const a = lay.items[i], b = lay.items[i + 1], it = score.items[i];
    if (!b || it.d === null) return null;
    const up = it.d >= mid, dy = up ? -7 : 7, color = reads[i].tieBad ? C.red : colorOf(i);
    const arc = (x0: number, x1: number, sys: number) => {
      const y = yOf(score, it.d!, sys) + dy, bend = (up ? -1 : 1) * Math.min(9, 3 + (x1 - x0) / 12);
      return <path key={`${x0}`} d={`M${x0},${y} Q${(x0 + x1) / 2},${y + bend} ${x1},${y}`} fill="none" stroke={color} strokeWidth={1.4} />;
    };
    // a tie onto the next system is drawn as two halves
    return a.sys === b.sys ? arc(a.x + 4, b.x - 4, a.sys) : [arc(a.x + 4, X1, a.sys), arc(lay.items[i + 1].x0 - 8, b.x - 4, b.sys)];
  };

  return (
    <svg ref={svgRef} viewBox={`0 0 ${lay.width} ${lay.height}`} className="w-full h-auto block select-none"
      style={{ cursor: "crosshair", touchAction: "manipulation" }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      {Array.from({ length: lay.systems }, (_, sys) => (
        <g key={sys}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={X1} y1={yOf(score, d, sys)} y2={yOf(score, d, sys)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.1} />)}
          <line x1={X1} x2={X1} y1={yOf(score, lines[4], sys)} y2={yOf(score, lines[0], sys)} stroke={C.fg} strokeOpacity={0.4} strokeWidth={1} />
          <Clef kind={score.clef} x={X_CLEF} y={yOf(score, anchor, sys)} s={S} color={C.fg} />
          {octaveClef && <T x={X_CLEF - 3} y={yOf(score, lines[0], sys) + 31} anchor="middle" size={9} bold color={C.fg}>8</T>}
          {sys === 0 && <>
            <T x={66} y={yOf(score, lines[3], 0) + 5} anchor="middle" size={15} bold color={C.fg}>{score.meter}</T>
            <T x={66} y={yOf(score, lines[1], 0) + 5} anchor="middle" size={15} bold color={C.fg}>4</T>
          </>}
          {sys > 0 && <T x={X_CLEF - 20} y={yOf(score, lines[4], sys) - 26} size={9} color={C.muted}>{lay.firstBar[sys]}</T>}
        </g>
      ))}

      {lay.bars.map((b, i) => (
        <line key={i} x1={b.x} x2={b.x} y1={yOf(score, lines[4], b.sys)} y2={yOf(score, lines[0], b.sys)}
          stroke={b.bad ? C.red : C.fg} strokeOpacity={b.bad ? 1 : 0.8} strokeWidth={b.bad ? 2 : 1.2} />
      ))}

      {score.items.map((it, i) => {
        const p = lay.items[i], color = colorOf(i);
        if (!p) return null;
        const selBox = i === sel && (
          <rect x={p.x0 + 1} y={sysTop(p.sys) + 4} width={p.x1 - p.x0 - 2} height={SYS_H - 12} rx={5}
            fill="var(--primary)" fillOpacity={0.08} stroke="var(--primary)" strokeOpacity={0.4} />
        );
        if (it.d === null) {
          const yMid = yOf(score, mid, p.sys);
          const y = it.v === 1 ? yOf(score, lines[3], p.sys) + 5 : yMid;
          return <g key={i}>{selBox}<RestGlyph x={p.x} y={y} value={it.v} dots={it.dot ? 1 : 0} color={color} /></g>;
        }
        const y = yOf(score, it.d, p.sys), down = it.d >= mid;
        return (
          <g key={i}>
            {selBox}
            {ledgers(it.d, lines).map(ld => <line key={ld} x1={p.x - 9} x2={p.x + 9} y1={yOf(score, ld, p.sys)} y2={yOf(score, ld, p.sys)} stroke={C.fg} strokeWidth={1.1} />)}
            {it.acc !== null && <AccidentalGlyph a={it.acc} x={p.x - accOffset(it.acc) * S - 2} y={y} s={S} color={color} />}
            <Note x={p.x} y={y} v={it.v} dot={it.dot} down={down} onLine={(it.d - lines[0]) % 2 === 0} color={color} />
          </g>
        );
      })}
      {score.items.map((it, i) => (it.tie ? <g key={`t${i}`}>{tie(i)}</g> : null))}

      {/* the free slot: a faint note shows where a click would write */}
      <rect x={lay.slot.x0 + 2} y={sysTop(lay.slot.sys) + 6} width={Math.min(42, lay.slot.x1 - lay.slot.x0 - 4)} height={SYS_H - 16} rx={5}
        fill="none" stroke={C.muted} strokeOpacity={0.35} strokeDasharray="3 3" />
      {ghost && (
        <g opacity={0.45}>
          {ledgers(ghost.d, lines).map(ld => <line key={ld} x1={lay.slot.x - 9} x2={lay.slot.x + 9} y1={yOf(score, ld, lay.slot.sys)} y2={yOf(score, ld, lay.slot.sys)} stroke={C.fg} strokeWidth={1.1} />)}
          <ellipse cx={lay.slot.x} cy={yOf(score, ghost.d, lay.slot.sys)} rx={5.2} ry={3.8} transform={`rotate(-20 ${lay.slot.x} ${yOf(score, ghost.d, lay.slot.sys)})`} fill={C.blue} />
        </g>
      )}
      {score.items.length === 0 && (
        <T x={lay.slot.x0 + 52} y={yOf(score, mid, 0) + 3} size={10} color={C.muted}>{emptyHint}</T>
      )}
    </svg>
  );
}

/** Beats, as a musician says them: 3, 2½, ¾. */
export function beatsText(sixteenths: number) {
  const whole = Math.floor(sixteenths / 4), q = sixteenths % 4;
  const frac = ["", "¼", "½", "¾"][q];
  return whole === 0 && frac ? frac : `${whole}${frac}`;
}

export const lenBeats = (v: Parameters<typeof lenOf>[0]) => beatsText(lenOf(v));
