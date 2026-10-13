"use client";

import { useCallback, useState } from "react";
import { Volume2 } from "lucide-react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { InstrumentChoice, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { Practice, type StageApi } from "@/components/lesson/kit/practice/Practice";
import { ChoiceButtons } from "@/components/lesson/kit/practice/ChoiceButtons";
import { CLEFS, Clef, StaffNote, ledgers, midiOf } from "./staff";
import { AccidentalGlyph, accOffset, keyOf, spelledName, type Acc, type Spelled } from "./accidentals";
import { intervalName, numberName, type Quality } from "./intervals";
import { IntervalArt } from "./practiceArt";

// ── What this figure shows ────────────────────────────────────────────────────
// A practice round (kit/practice) on intervals, in two ways:
//   read  two notes stacked on a treble staff; name the interval. Levels:
//         the number only (white keys); the full name (white keys, so the
//         thirds, sixths and sevenths come major and minor, and F–B / B–F);
//         the full name with sharps and flats on either note.
//   hear  the interval is played (one note, the other, then together) and
//         the notes stay hidden until the answer; levels widen the set of
//         intervals from three (M3, P5, P8) to all twelve.
// Every question is a real spelled pair: the upper note's letter is counted
// from the lower one, and the sign is whatever the size then asks for.

type Mode = "read" | "hear";
type Level = "a" | "b" | "c";
type IQ = { key: string; lo: Spelled; hi: Spelled; iv: [Quality, number]; options: [Quality, number][]; right: number };

type Iv = [Quality, number, number];                        // quality, number, half steps
const ALL: Iv[] = [["m", 2, 1], ["M", 2, 2], ["m", 3, 3], ["M", 3, 4], ["P", 4, 5], ["A", 4, 6], ["d", 5, 6], ["P", 5, 7], ["m", 6, 8], ["M", 6, 9], ["m", 7, 10], ["M", 7, 11], ["P", 8, 12]];
const pick = <X,>(xs: X[]) => xs[Math.floor(Math.random() * xs.length)];
const shuffle = <X,>(xs: X[]) => xs.map(x => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(p => p[1]);

const HEAR_SETS: Record<Level, string[]> = {
  a: ["M3", "P5", "P8"],
  b: ["m3", "M3", "P4", "P5", "M6", "P8"],
  c: ["m2", "M2", "m3", "M3", "P4", "A4", "P5", "m6", "M6", "m7", "M7", "P8"],
};
const ivOf = (code: string) => ALL.find(([q, n]) => `${q}${n}` === code)!;

const W = 460, STEP = 6, PAD = 22, X_CLEF = 40, X1 = 400, XN = 230;
const OK = "#22c55e", BAD = "#ef4444";
const { lines, anchor } = CLEFS.treble;
const dLo = lines[0] - 5, dHi = lines[4] + 5, H = (dHi - dLo) * STEP + 2 * PAD;
const yOf = (d: number) => PAD + (dHi - d) * STEP;

/** The upper note of interval iv above lo, spelled by counting letters; null if it needs more than one sign. */
function above(lo: Spelled, [, n, s]: Iv): Spelled | null {
  const d = lo.d + n - 1, a = keyOf(lo) + s - midiOf(d);
  return Math.abs(a) <= 1 ? { d, a: a as Acc } : null;
}

export function MusicIntervalQuizFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("read");
  const [level, setLevel] = useState<Level>("a");
  const [given, setGiven] = useState<{ q: string; i: number } | null>(null);
  const { ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const play = useCallback((q: IQ, delay = 0) => {
    startAudio();
    const go = () => setTimeout(() => seq.play(3, k => (k < 2 ? playNote(keyOf(k ? q.hi : q.lo)) : [playNote(keyOf(q.lo)), playNote(keyOf(q.hi))]), { gap: 0.65, hold: 0.95 }), delay * 1000);
    if (notesReady()) go(); else ensure().then(go, () => {});
  }, [ensure, seq]);

  const make = (avoid: string | null): IQ => {
    for (;;) {
      const signs = mode === "read" && level === "c";
      const lo: Spelled = { d: 27 + Math.floor(Math.random() * 6), a: signs ? pick([-1, 0, 0, 1] as Acc[]) : 0 };
      let iv: Iv, hi: Spelled | null;
      if (mode === "hear") { iv = ivOf(pick(HEAR_SETS[level])); hi = above(lo, iv); }
      else if (signs) { iv = pick(ALL); hi = above(lo, iv); }
      else {                                                  // white keys: any letter above, the size decides the name
        const n = 2 + Math.floor(Math.random() * 7);
        hi = { d: lo.d + n - 1, a: 0 };
        const s = keyOf(hi) - keyOf(lo);
        iv = ALL.find(([, nn, ss]) => nn === n && ss === s)!;
      }
      if (!hi || !iv) continue;
      const key = `${mode}:${lo.d}${lo.a}:${hi.d}${hi.a}`;
      if (key === avoid) continue;
      let options: [Quality, number][];
      if (mode === "read" && level === "a") options = [2, 3, 4, 5, 6, 7, 8].map(n => ["P", n]);
      else if (mode === "hear") options = HEAR_SETS[level].map(c => { const [q, n] = ivOf(c); return [q, n]; });
      else {
        const same = ALL.filter(x => x !== iv && x[1] === iv[1]), rest = shuffle(ALL.filter(x => x !== iv && x[1] !== iv[1]));
        options = shuffle([iv, ...(same.length ? [pick(same)] : []), ...rest].slice(0, 4)).map(([q, n]) => [q, n]);
        if (!options.some(([q, n]) => q === iv[0] && n === iv[1])) options[0] = [iv[0], iv[1]];
      }
      const right = mode === "read" && level === "a" ? iv[1] - 2 : options.findIndex(([q, n]) => q === iv[0] && n === iv[1]);
      return { key, lo, hi, iv: [iv[0], iv[1]], options, right };
    }
  };

  const label = (q: Quality, n: number) => (mode === "read" && level === "a" ? numberName(t, n) : intervalName(t, q, n));

  const stage = (q: IQ, { submit, feedback }: StageApi) => {
    const mine = given?.q === q.key ? given.i : null;
    const hidden = mode === "hear" && !feedback;
    const tone = feedback ? (feedback.ok ? OK : BAD) : C.amber;
    const second = q.hi.d - q.lo.d <= 1, xHi = XN + (second ? 2 * STEP * (q.hi.a ? 3 : 1.25) : 0);
    const note = (sp: Spelled, x: number, color: string) => (
      <g>
        {sp.a !== 0 && <AccidentalGlyph a={sp.a as Acc} x={x - accOffset(sp.a as Acc) * 2 * STEP} y={yOf(sp.d)} s={2 * STEP} color={color} />}
        <StaffNote x={x} y={yOf(sp.d)} s={2 * STEP} color={color} ledgerYs={ledgers(sp.d, lines).map(yOf)} filled={!!feedback} />
      </g>
    );
    return (
      <div className="px-3 pb-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none mx-auto" style={{ maxHeight: 200 }}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={X1} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {hidden
            ? <T x={XN} y={yOf(34) + 4} anchor="middle" size={13} bold color={C.muted}>?</T>
            : <>{note(q.lo, XN, mode === "hear" ? tone : C.sky)}{note(q.hi, xHi, tone)}</>}
          {feedback && <T x={xHi + 30} y={yOf(q.hi.d) + 4} size={11} bold color={tone}>{spelledName(q.lo, false)}–{spelledName(q.hi, false)}</T>}
        </svg>
        <div className="pt-2">
          <ChoiceButtons options={q.options.map(([qq, n]) => label(qq, n))} right={q.right} picked={mine} feedback={feedback}
            onPick={i => { if (feedback) return; setGiven({ q: q.key, i }); submit(i === q.right); }}
            extra={<button type="button" onClick={() => play(q)} className="h-11 px-3 rounded-xl border-2 border-[var(--border)] text-[15px] flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)]" aria-label={tx(t, "figMus_iqAgain", "hear it again")}><Volume2 size={18} /></button>} />
        </div>
      </div>
    );
  };

  const settings = <>
    <Choice value={mode} onChange={setMode} options={[["read", tx(t, "figMus_iqRead", "read")], ["hear", tx(t, "figMus_iqHear", "hear")]]} />
    <Choice value={level} onChange={setLevel} options={mode === "read" ? [
      ["a", tx(t, "figMus_iqNum", "number only")],
      ["b", tx(t, "figMus_iqWhite", "full name, white keys")],
      ["c", tx(t, "figMus_iqSigns", "full name, ♯ and ♭")],
    ] : [
      ["a", tx(t, "figMus_iqH3", "M3, P5, P8")],
      ["b", tx(t, "figMus_iqH6", "six intervals")],
      ["c", tx(t, "figMus_iqH12", "all twelve")],
    ]} />
  </>;

  return (
    <Figure title={tx(t, "figMus_iqTitle", "Practice: name the interval")}
      head={<InstrumentChoice t={t} />}
      controls={<VolumeSlider t={t} />}
      note={tx(t, "figMus_iqNote", "Reading: count the letters first, both ends included, for the number; then the half steps for the quality, or use a landmark: on white keys every third, sixth and seventh is minor if it contains E–F or B–C once more than the major one, and every fourth and fifth is perfect except F–B and B–F. Signs on both notes that move the same way change nothing. Hearing: hum the first two notes of a tune you know (the list in the figure above) and compare.")}>
      <div ref={vis.ref}>
        <Practice<IQ> t={t} id={`music-intervals-${mode}-${level}`} make={make} settings={settings} art={<IntervalArt />} stage={stage}
          prompt={() => (mode === "read" ? tx(t, "figMus_iqPromptRead", "which interval is this?") : tx(t, "figMus_iqPromptHear", "which interval do you hear?"))}
          solution={q => `${spelledName(q.lo, false)}–${spelledName(q.hi, false)}: ${intervalName(t, q.iv[0], q.iv[1])}`}
          onShow={q => { setGiven(null); if (mode === "hear") play(q, 0.25); }}
          onAnswer={(q, ok) => { if (mode === "read" || !ok) play(q, 0.35); }} />
      </div>
    </Figure>
  );
}
