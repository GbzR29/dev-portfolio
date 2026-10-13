// ── Measuring syncopation ─────────────────────────────────────────────────────
// The Longuet-Higgins & Lee (1984) count, as the chapter derives it. Every
// position of a 4/4 bar of 16 sixteenths gets a weight from the metrical grid
// (1 + the number of slower levels that start there: 5 on beat 1, 4 on beat
// 3, 3 on beats 2 and 4, 2 on the "&"s, 1 on the "e"s and "a"s). A note
// syncopates when the silence after it, up to the next note, covers a
// position heavier than its own; it scores the difference.

export const STEPS = 16;

/** The metrical weight of sixteenth `p` in a bar of 16 (4/4). */
export const weight = (p: number) => 1 + [16, 8, 4, 2].filter(P => p % P === 0).length;

export type Syncopation = { from: number; to: number; s: number };

/** Every syncopation in a looping bar: the note, the silent heavier position, the score. */
export function syncopations(on: boolean[]): Syncopation[] {
  const notes = on.flatMap((x, p) => (x ? [p] : []));
  return notes.flatMap((p, i) => {
    const next = i + 1 < notes.length ? notes[i + 1] : notes[0] + STEPS;   // the bar loops
    let to = -1;
    for (let q = p + 1; q < next; q++) if (to < 0 || weight(q % STEPS) > weight(to)) to = q % STEPS;
    const s = to < 0 ? 0 : weight(to) - weight(p);
    return s > 0 ? [{ from: p, to, s }] : [];
  });
}

/** A bar from the positions of its notes. */
export const bar = (ps: number[]) => Array.from({ length: STEPS }, (_, p) => ps.includes(p));
