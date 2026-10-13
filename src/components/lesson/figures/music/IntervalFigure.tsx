"use client";

import { useCallback, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { InstrumentChoice, loadStatus, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { NoteSurface } from "@/components/lesson/kit/audio/NoteSurface";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { CLEFS, Clef, StaffNote, diatonic, ledgers, midiOf } from "./staff";
import { ACC_TEXT, AccidentalGlyph, accOffset, keyOf, letterOf, spelledName, spellings, type Acc, type Spelled } from "./accidentals";
import { LETTERS } from "./names";
import { INVERT, abbr, intervalName, measure, numberName, refSize } from "./intervals";

// ── What this figure shows ────────────────────────────────────────────────────
// Two notes, lower (blue) and upper (amber), written on a treble staff twice:
// one after the other (melodic) and stacked (harmonic). Under the staff, the
// letters from the lower note to the upper one are counted, both ends
// included: that count is the interval's number. Between the letters, the
// size of each step in half steps (2, or 1 at E–F and B–C) adds up to the
// size of the plain-letter interval; the signs then move it. Keys (or frets)
// set the notes, alternately lower and upper; "respell" gives a note its
// other names (C–D♯ and C–E♭ sound alike but are different intervals);
// "invert" moves the lower note up an octave.

type Target = "lo" | "hi";
const W = 600, STEP = 5.5, X_CLEF = 40, X_MEL = [140, 214], X_HARM = 320, XS = 400, X1 = 590, PAD = 18;
const LO = 55, HI = 84;
const { lines, anchor } = CLEFS.treble;
const dLo = 24, dHi = 44, STAFF_H = (dHi - dLo) * STEP + 2 * PAD;
const H = STAFF_H + 70;
const yOf = (d: number) => PAD + (dHi - d) * STEP;

const PRESETS: [string, Spelled, Spelled][] = [
  ["C–G", { d: 28, a: 0 }, { d: 32, a: 0 }],
  ["C–E", { d: 28, a: 0 }, { d: 30, a: 0 }],
  ["D–F", { d: 29, a: 0 }, { d: 31, a: 0 }],
  ["F–B", { d: 31, a: 0 }, { d: 34, a: 0 }],
  ["B–F", { d: 34, a: 0 }, { d: 38, a: 0 }],
  ["C–D♯", { d: 28, a: 0 }, { d: 29, a: 1 }],
  ["C–E♭", { d: 28, a: 0 }, { d: 30, a: -1 }],
  ["C–C♯", { d: 28, a: 0 }, { d: 28, a: 1 }],
  ["C–D♭", { d: 28, a: 0 }, { d: 29, a: -1 }],
  ["C4–D5", { d: 28, a: 0 }, { d: 36, a: 0 }],
];

/** A note for a pressed key: white keys plain, black keys as sharps. */
const spell = (m: number): Spelled => {
  const d = diatonic(m);
  return d !== null ? { d, a: 0 } : spellings(m, 1).find(s => s.a === 1)!;
};

/** Lower note first: by staff position, then by key. */
const order = (a: Spelled, b: Spelled): [Spelled, Spelled] =>
  a.d < b.d || (a.d === b.d && keyOf(a) <= keyOf(b)) ? [a, b] : [b, a];

export function MusicIntervalFigure({ t }: { t?: TrackTranslations }) {
  const [lo, setLo] = useState<Spelled>({ d: 28, a: 0 });
  const [hi, setHi] = useState<Spelled>({ d: 32, a: 0 });
  const [target, setTarget] = useState<Target>("lo");
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const run = useCallback((f: () => void) => { startAudio(); if (notesReady()) f(); else ensure().then(f, () => {}); }, [ensure]);
  const playBoth = (a: Spelled, b: Spelled, together: boolean) => run(() => together
    ? seq.play(1, () => [playNote(keyOf(a)), playNote(keyOf(b))], { hold: 1.8 })
    : seq.play(2, i => playNote(keyOf(i ? b : a)), { gap: 0.6, hold: 0.9 }));

  const set = (a: Spelled, b: Spelled, sound = true) => {
    const [x, y] = order(a, b);
    setLo(x); setHi(y);
    if (sound) playBoth(x, y, false);
  };
  const keyDown = (m: number) => {
    setPressed(s => new Set(s).add(m));
    const n = spell(m);
    if (target === "lo") set(n, hi); else set(lo, n);
    setTarget(x => (x === "lo" ? "hi" : "lo"));
  };
  const keyUp = (m: number) => setPressed(s => { const n = new Set(s); n.delete(m); return n; });

  /** The next spelling of the same key (up to double signs), keeping the same octave region. */
  const respell = (which: Target) => {
    const n = which === "lo" ? lo : hi, all = spellings(keyOf(n), 2);
    const i = all.findIndex(s => s.d === n.d && s.a === n.a), next = all[(i + 1) % all.length];
    if (which === "lo") set(next, hi, false); else set(lo, next, false);
  };
  const invert = () => {
    if (lo.d + 7 <= 42) set(hi, { d: lo.d + 7, a: lo.a });
    else set({ d: hi.d - 7, a: hi.a }, lo);
  };

  const { n, s, q } = measure(lo, hi);
  const name = q ? intervalName(t, q, n) : tx(t, "figMus_ivNoName", "no usual name");
  const white = midiOf(hi.d) - midiOf(lo.d);
  const steps = Array.from({ length: Math.max(0, n - 1) }, (_, i) => midiOf(lo.d + i + 1) - midiOf(lo.d + i));
  const cell = Math.min(34, (X1 - 10 - 10) / Math.max(n, 1));
  const cx = (i: number) => 10 + cell * (i + 0.5) + Math.max(0, (X1 - 20 - cell * n) / 2);
  const keyColor = (m: number) => (m === keyOf(hi) ? C.amber : m === keyOf(lo) ? C.sky : null);
  const second = hi.d - lo.d <= 1;                       // a unison or a second: heads side by side
  const inv = q && n <= 8 ? intervalName(t, INVERT[q], 9 - n) : null;

  const note = (sp: Spelled, x: number, color: string) => (
    <g>
      {sp.a !== 0 && <AccidentalGlyph a={sp.a as Acc} x={x - accOffset(sp.a as Acc) * 2 * STEP} y={yOf(sp.d)} s={2 * STEP} color={color} />}
      <StaffNote x={x} y={yOf(sp.d)} s={2 * STEP} color={color} ledgerYs={ledgers(sp.d, lines).map(yOf)} />
    </g>
  );

  return (
    <Figure title={tx(t, "figMus_ivTitle", "Name an interval: count the letters, then the keys")}
      head={<InstrumentChoice t={t} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_ivNext", "next key sets")}</span>
          <Choice value={target} onChange={setTarget} options={[["lo", tx(t, "figMus_ivLower", "lower note")], ["hi", tx(t, "figMus_ivUpper", "upper note")]]} />
          <Btn onClick={() => respell("lo")}>{tx(t, "figMus_ivRespellLo", "respell lower")}</Btn>
          <Btn onClick={() => respell("hi")}>{tx(t, "figMus_ivRespellHi", "respell upper")}</Btn>
          <Btn onClick={invert}>{tx(t, "figMus_ivInvert", "invert")}</Btn>
        </Row>
        <Row>
          {PRESETS.map(([k, a, b]) => <Btn key={k} active={lo.d === a.d && lo.a === a.a && hi.d === b.d && hi.a === b.a} onClick={() => set(a, b)}>{k}</Btn>)}
        </Row>
        <Row>
          <Readout color={C.sky}>{spelledName(lo)}</Readout>
          <Readout color={C.amber}>{spelledName(hi)}</Readout>
          <Readout>n = {hi.d} − {lo.d} + 1 = {n} ({numberName(t, n)})</Readout>
          <Readout>s = {keyOf(hi)} − {keyOf(lo)} = {s}</Readout>
          <Readout>{tx(t, "figMus_ivRef", "reference")} {refSize(n)} → {s - refSize(n) > 0 ? "+" : ""}{s - refSize(n)}</Readout>
        </Row>
        <Row>
          <Readout color={q ? C.green : C.red}>{q ? `${name} (${abbr(q, n, t)})` : name}</Readout>
          {inv && <Readout color={C.muted}>{tx(t, "figMus_ivInv", "inverted")}: {inv}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_ivNote", "Press two keys: the first sets the lower note, the second the upper one. The number comes from the letters only: count them on the strip, both ends included. The size comes from the keys. Try C–E and D–F: both thirds, but the strip shows a 1 inside D–F (the half step E–F), so it is one key smaller: minor. Then try C–D♯ and C–E♭: the same two keys give a second or a third, depending on the letter. C–C♯ and C–D♭ are the two half steps of chapter 11. Respell any note to see its other names change the interval, and invert to flip it.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={XS - 20} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          <T x={(X_MEL[0] + X_MEL[1]) / 2} y={STAFF_H - 2} anchor="middle" size={8} color={C.muted}>{tx(t, "figMus_ivMel", "one after the other")}</T>
          <T x={X_HARM} y={STAFF_H - 2} anchor="middle" size={8} color={C.muted}>{tx(t, "figMus_ivHarm", "together")}</T>
          {note(lo, X_MEL[0], C.sky)}
          {note(hi, X_MEL[1], C.amber)}
          {note(lo, X_HARM, C.sky)}
          {note(hi, X_HARM + (second ? 2 * STEP * (hi.a ? 3 : 1.25) : 0), C.amber)}

          {/* the big name */}
          <T x={XS} y={46} size={18} bold color={q ? C.fg : C.red}>{q ? abbr(q, n, t) : "?"}</T>
          <T x={XS} y={66} size={11} color={C.fg}>{name}</T>
          <T x={XS} y={88} size={9} color={C.muted}>{n} {tx(t, "figMus_ivLetters", "letters")} · {s} {tx(t, "figMus_ivHalf", "half steps")}</T>
          <T x={XS} y={104} size={9} color={C.muted}>{tx(t, "figMus_ivPlain", "plain letters")}: {white} → {tx(t, "figMus_ivSigns", "signs")} {s - white >= 0 ? "+" : ""}{s - white}</T>

          {/* the letters counted, and the steps between them */}
          {Array.from({ length: n }, (_, i) => {
            const d = lo.d + i, x = cx(i), end = i === 0 || i === n - 1, color = i === 0 ? C.sky : i === n - 1 ? C.amber : C.fg;
            const label = LETTERS[letterOf(d)] + (i === 0 ? ACC_TEXT[lo.a] : i === n - 1 ? ACC_TEXT[hi.a] : "");
            return (
              <g key={i}>
                <rect x={x - cell / 2 + 2} y={STAFF_H + 8} width={cell - 4} height={24} rx={4} fill={end ? color : "transparent"} fillOpacity={0.18} stroke={color} strokeOpacity={end ? 1 : 0.35} />
                <T x={x} y={STAFF_H + 24} anchor="middle" size={cell < 26 ? 8 : 10} bold={end} color={color}>{label}</T>
                <T x={x} y={STAFF_H + 46} anchor="middle" size={8.5} bold color={C.muted}>{i + 1}</T>
              </g>
            );
          })}
          {steps.map((st, i) => (
            <T key={i} x={cx(i) + cell / 2} y={STAFF_H + 62} anchor="middle" size={8} bold={st === 1} color={st === 1 ? C.red : C.muted}>{st === 1 ? "1" : "2"}</T>
          ))}
        </svg>
        <div className="px-3 pb-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <SoundButton on={false} onClick={() => playBoth(lo, hi, false)}>{tx(t, "figMus_ivPlayMel", "one after the other")}</SoundButton>
            <SoundButton on={false} onClick={() => playBoth(lo, hi, true)}>{tx(t, "figMus_ivPlayHarm", "together")}</SoundButton>
          </div>
          <NoteSurface t={t} lo={LO} hi={HI} pressed={pressed} onDown={keyDown} onUp={keyUp} labels="c" keyColor={keyColor}
            ariaLabel={tx(t, "figMus_ivAria", "piano keyboard that sets the two notes of the interval")}
            guitarAriaLabel={tx(t, "figMus_ivNeckAria", "guitar neck that sets the two notes of the interval")} />
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{loadStatus(t, inst, load)}</span>}
        </div>
      </div>
    </Figure>
  );
}
