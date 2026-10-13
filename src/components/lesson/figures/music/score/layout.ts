// ── Score layout ──────────────────────────────────────────────────────────────
// Where everything of the score goes in the SVG. Items take room by length
// (a whole note is wider than a sixteenth, a sign adds room in front), bars
// are kept whole and flow onto new systems (staff lines) like text onto new
// lines, and every full system is stretched to the right margin. The free
// slot at the very end is where a click writes the next note.

import { CLEFS } from "../staff";
import { barLen, lenOf, totalLen, type Read, type Score } from "./model";

export const STEP = 5, PAD = 14, X_CLEF = 30;
/** The drawing's width: 600 units on a wide screen, fewer on a phone, so the notes are big enough to tap. */
export const WIDE = 600, NARROW = 340;
export const LEDGER_ROOM = 6;                              // diatonic steps of room above and below the staff
const BAR_GAP = 12, SLOT = 46;

export const staffOf = (s: Score) => CLEFS[s.clef];
export const SYS_H = (CLEFS.treble.lines[4] - CLEFS.treble.lines[0] + 2 * LEDGER_ROOM) * STEP + 2 * PAD;

/** The highest and lowest positions a click can write on this staff. */
export function rangeOf(s: Score) {
  const { lines } = staffOf(s);
  return { lo: lines[0] - LEDGER_ROOM, hi: lines[4] + LEDGER_ROOM };
}

export const sysTop = (sys: number) => sys * SYS_H;
export const yOf = (s: Score, d: number, sys: number) => sysTop(sys) + PAD + (rangeOf(s).hi - d) * STEP;
/** The position under a y coordinate of system `sys` (not clamped). */
export const dAt = (s: Score, y: number, sys: number) => Math.round(rangeOf(s).hi - (y - sysTop(sys) - PAD) / STEP);

const widthOf = (s: Score, i: number) => 14 + 10 * Math.sqrt(lenOf(s.items[i])) + (s.items[i].acc !== null ? ACC_ROOM : 0);
const ACC_ROOM = 17;                                       // room for a sign in front of its note
const startX = (sys: number) => (sys === 0 ? 84 : 54);

export type Placed = { x: number; sys: number; x0: number; x1: number };
export type Layout = {
  width: number;                                      // the viewBox width
  x1: number;                                         // where the staff lines end
  items: Placed[];
  bars: { x: number; sys: number; bad: boolean }[];  // bar lines (bad: the bar holds a note that runs over it)
  firstBar: number[];                                 // the number of each system's first bar (printed over its clef)
  slot: Placed;                                       // the free place for the next note
  systems: number;
  height: number;
};

export function layout(s: Score, reads: Read[], width = WIDE): Layout {
  const X1 = width - 10;
  // Group the items by the bar they start in; the open last bar takes the free slot too
  const groups: number[][] = [];
  reads.forEach((r, i) => { (groups[r.bar] ??= []).push(i); });
  const bars = groups.filter(Boolean);
  const total = totalLen(s), lastOpen = total % barLen(s) !== 0;

  type Box = { idx: number[]; w: number[]; slot: boolean };
  const boxes: Box[] = bars.map(idx => ({ idx, w: idx.map(i => widthOf(s, i)), slot: false }));
  if (lastOpen && boxes.length) boxes[boxes.length - 1].slot = true;
  else boxes.push({ idx: [], w: [], slot: true });

  // Flow the bars onto systems
  const lines: Box[][] = [[]];
  let x = startX(0);
  boxes.forEach(b => {
    const bw = b.w.reduce((a, c) => a + c, 0) + (b.slot ? SLOT : 0) + BAR_GAP;
    const line = lines[lines.length - 1];
    if (line.length && x + bw > X1) { lines.push([]); x = startX(lines.length - 1); }
    lines[lines.length - 1].push(b);
    x += bw;
  });

  const out: Layout = { width, x1: X1, items: [], bars: [], firstBar: [], slot: { x: 0, sys: 0, x0: 0, x1: 0 }, systems: lines.length, height: lines.length * SYS_H };
  lines.forEach((line, sys) => {
    out.firstBar.push(line[0].idx.length ? reads[line[0].idx[0]].bar + 1 : Math.floor(total / barLen(s)) + 1);
    const x0 = startX(sys), used = line.reduce((a, b) => a + b.w.reduce((p, c) => p + c, 0) + (b.slot ? SLOT : 0) + BAR_GAP, 0);
    // Full systems reach the right margin; the last one keeps its natural spacing
    const k = sys < lines.length - 1 ? Math.max(1, (X1 - x0) / used) : 1;
    let cx = x0;
    line.forEach(b => {
      b.idx.forEach((i, j) => {
        const w = b.w[j] * k, accRoom = s.items[i].acc !== null ? ACC_ROOM * k : 0;
        out.items[i] = { x: cx + accRoom + (w - accRoom) * 0.4, sys, x0: cx, x1: cx + w };
        cx += w;
      });
      if (b.slot) { out.slot = { x: cx + SLOT * 0.4, sys, x0: cx, x1: Math.max(cx + SLOT, X1) }; cx += SLOT * k; }
      cx += BAR_GAP * k;
      if (!b.slot) out.bars.push({ x: cx - BAR_GAP * k * 0.45, sys, bad: b.idx.some(i => reads[i].crosses) });
    });
  });
  return out;
}
