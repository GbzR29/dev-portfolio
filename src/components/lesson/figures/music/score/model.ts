// ── Score model ───────────────────────────────────────────────────────────────
// The data behind the score editor. A score is a clef, a meter (quarter-note
// beats per bar), a tempo and a list of items; an item is a note or a rest
// with a value (notation.tsx: 1 whole … 16 sixteenth), an optional dot, a
// white-key position d (staff.tsx: C4 = 28) and the sign written before it
// (accidentals.tsx; null when none is written). Time is counted in
// sixteenths: a value v lasts 16/v of them, a dot adds half (no dotted
// sixteenths, so every length is a whole number).
//
// `analyse` reads the score the way a musician does: which bar each item
// starts in, whether it runs over the bar line, which sign it really has
// (a sign holds for its line or space until the bar line; a tie carries it
// over) and which key that asks for.

import type { NoteValue } from "../notation";
import type { Acc } from "../accidentals";
import { midiOf } from "../staff";

export type ClefKind = "treble" | "bass";
export type Meter = 2 | 3 | 4;
export type Item = { v: NoteValue; dot: boolean; d: number | null; acc: Acc | null; tie: boolean };
export type Score = { clef: ClefKind; meter: Meter; bpm: number; items: Item[] };

export const METERS: Meter[] = [2, 3, 4];

/** Sixteenths an item lasts. */
export const lenOf = (it: Pick<Item, "v" | "dot">) => (16 / it.v) * (it.dot && it.v !== 16 ? 1.5 : 1);
/** Sixteenths in one bar. */
export const barLen = (s: Score) => s.meter * 4;

export type Read = {
  start: number;            // sixteenths from the beginning
  bar: number;              // the bar it starts in (0-based)
  crosses: boolean;         // runs past the bar line
  a: Acc;                   // the sign it really has
  carried: boolean;         // that sign was written earlier (in the bar, or through a tie)
  key: number | null;       // the key it asks for (null for a rest)
  tieOk: boolean;           // its tie lands on the same key
  tieBad: boolean;          // a tie that does not
};

export function analyse(s: Score): Read[] {
  const bl = barLen(s);
  let pos = 0, bar = -1, held = new Map<number, Acc>();
  const out: Read[] = [];
  s.items.forEach((it, i) => {
    const b = Math.floor(pos / bl), len = lenOf(it);
    if (b !== bar) { bar = b; held = new Map(); }
    let a: Acc = 0, carried = false;
    if (it.d !== null) {
      if (it.acc !== null) { a = it.acc; held.set(it.d, a); }
      else if (held.has(it.d)) { a = held.get(it.d)!; carried = a !== 0; }
    }
    out.push({
      start: pos, bar: b, crosses: pos + len > (b + 1) * bl, a, carried,
      key: it.d === null ? null : midiOf(it.d) + a, tieOk: false, tieBad: false,
    });
    pos += len;
    // The tie of the previous item is now known to land (or not)
    const p = out[i - 1], pIt = s.items[i - 1];
    if (p && pIt.tie && pIt.d !== null) {
      // a tie keeps the sign, so a tied note without a sign of its own counts as the same key
      const same = it.d === pIt.d && (it.acc === null || it.acc === p.a);
      p.tieOk = same; p.tieBad = !same;
      if (same && it.acc === null) { out[i].a = p.a; out[i].carried = p.a !== 0; out[i].key = midiOf(it.d!) + p.a; }
    }
  });
  const last = s.items[s.items.length - 1], lr = out[out.length - 1];
  if (last?.tie && lr) lr.tieBad = true;                // a tie to nothing
  return out;
}

/** Total length in sixteenths. */
export const totalLen = (s: Score) => s.items.reduce((n, it) => n + lenOf(it), 0);

/** The sign a note at d gets from earlier in its bar, if it stands at item i (or at the end): for spelling a pressed key. */
export function heldBefore(s: Score, reads: Read[], i: number, d: number): Acc {
  const bar = i < s.items.length ? reads[i].bar : Math.floor(totalLen(s) / barLen(s));
  let a: Acc = 0;
  for (let j = 0; j < i; j++) if (reads[j].bar === bar && s.items[j].d === d) a = reads[j].a;
  return a;
}

// ── Playing it ────────────────────────────────────────────────────────────────

/** Notes in quarter-note beats; tied notes merge into one sound. */
export function eventsOf(s: Score, reads: Read[], shift = 0) {
  const out: { at: number; len: number; midi: number | null }[] = [];
  s.items.forEach((it, i) => {
    const r = reads[i], len = lenOf(it) / 4, prev = reads[i - 1];
    if (prev?.tieOk && r.key !== null && out.length) { out[out.length - 1].len += len; return; }
    out.push({ at: r.start / 4, len, midi: r.key === null ? null : r.key + shift });
  });
  return out;
}

// ── Fixing a note that crosses the bar line ───────────────────────────────────

const PIECES: { len: number; v: NoteValue; dot: boolean }[] = [
  { len: 16, v: 1, dot: false }, { len: 12, v: 2, dot: true }, { len: 8, v: 2, dot: false },
  { len: 6, v: 4, dot: true }, { len: 4, v: 4, dot: false }, { len: 3, v: 8, dot: true },
  { len: 2, v: 8, dot: false }, { len: 1, v: 16, dot: false },
];

/** n sixteenths as written values, longest first. */
export function decompose(n: number) {
  const out: { v: NoteValue; dot: boolean }[] = [];
  while (n > 0) {
    const p = PIECES.find(q => q.len <= n)!;
    out.push({ v: p.v, dot: p.dot });
    n -= p.len;
  }
  return out;
}

/** Item i cut at every bar line it crosses; the pieces of a note are tied (the tie carries the sign). */
export function splitAtBars(s: Score, reads: Read[], i: number): Item[] {
  const it = s.items[i], bl = barLen(s);
  let pos = reads[i].start, left = lenOf(it);
  const pieces: Item[] = [];
  while (left > 0) {
    const room = Math.min(left, (Math.floor(pos / bl) + 1) * bl - pos);
    decompose(room).forEach(p => pieces.push({ ...it, v: p.v, dot: p.dot, acc: null, tie: it.d !== null }));
    pos += room; left -= room;
  }
  pieces[0].acc = it.acc;
  pieces[pieces.length - 1].tie = it.tie;
  return [...s.items.slice(0, i), ...pieces, ...s.items.slice(i + 1)];
}

// ── Saving it as text (links and the browser's storage) ───────────────────────
// "t4-96:q30_qd32s_er_..." — clef t/b, meter, tempo, then one token per item:
// value w h q e s, d for a dot, the position or r for a rest, the sign
// (F ♭♭, f ♭, n ♮, s ♯, S ♯♯) and t for a tie.

const VCH: Record<NoteValue, string> = { 1: "w", 2: "h", 4: "q", 8: "e", 16: "s" };
const ACH: Record<Acc, string> = { [-2]: "F", [-1]: "f", 0: "n", 1: "s", 2: "S" };

export function encode(s: Score) {
  const tok = (it: Item) => VCH[it.v] + (it.dot ? "d" : "") + (it.d === null ? "r" : it.d) + (it.acc === null ? "" : ACH[it.acc]) + (it.tie ? "t" : "");
  return `${s.clef[0]}${s.meter}-${s.bpm}:${s.items.map(tok).join("_")}`;
}

export function decode(text: string): Score | null {
  const m = /^([tb])([234])-(\d{2,3}):(.*)$/.exec(text);
  if (!m) return null;
  const items: Item[] = [];
  for (const tok of m[4] ? m[4].split("_") : []) {
    const k = /^([whqes])(d?)(r|\d{1,2})([FfnsS]?)(t?)$/.exec(tok);
    if (!k) return null;
    const v = Number(Object.keys(VCH).find(x => VCH[Number(x) as NoteValue] === k[1])) as NoteValue;
    const acc = k[4] ? Number(Object.keys(ACH).find(x => ACH[Number(x) as Acc] === k[4])) as Acc : null;
    items.push({ v, dot: k[2] === "d" && v !== 16, d: k[3] === "r" ? null : Number(k[3]), acc, tie: k[5] === "t" });
  }
  if (items.length > 400) return null;
  return { clef: m[1] === "b" ? "bass" : "treble", meter: Number(m[2]) as Meter, bpm: Math.min(200, Math.max(40, Number(m[3]))), items };
}

// ── Starting points ───────────────────────────────────────────────────────────

const n = (v: NoteValue, d: number | null, extra: Partial<Item> = {}): Item => ({ v, dot: false, d, acc: null, tie: false, ...extra });

export const PRESETS: Record<"ode" | "twinkle" | "blank", Score> = {
  // Beethoven, "Ode to Joy": E E F G | G F E D | C C D E | E. D D
  ode: { clef: "treble", meter: 4, bpm: 100, items: [
    ...[30, 30, 31, 32, 32, 31, 30, 29, 28, 28, 29, 30].map(d => n(4, d)),
    n(4, 30, { dot: true }), n(8, 29), n(2, 29),
  ] },
  // "Twinkle, Twinkle, Little Star": C C G G | A A G | F F E E | D D C
  twinkle: { clef: "treble", meter: 4, bpm: 96, items: [
    n(4, 28), n(4, 28), n(4, 32), n(4, 32), n(4, 33), n(4, 33), n(2, 32),
    n(4, 31), n(4, 31), n(4, 30), n(4, 30), n(4, 29), n(4, 29), n(2, 28),
  ] },
  blank: { clef: "treble", meter: 4, bpm: 96, items: [] },
};
