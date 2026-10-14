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
import { CLEFS, Clef, StaffNote, ledgers } from "./staff";
import { ACC_TEXT, AccidentalGlyph, keyOf, spelledName, type Acc } from "./accidentals";
import { LETTERS } from "./names";
import { FLAT_D, SHARP_D, majorScale, tonicOf } from "./scales";
import { ScaleArt } from "./practiceArt";

// ── What this figure shows ────────────────────────────────────────────────────
// A practice round (kit/practice) on major keys, three ways:
//   spell  "in D major, degree 3 is…?": pick the note, spelled right (F♯,
//          not G♭); the wrong options keep the letter with another sign, or
//          the right key with another letter.
//   key    a key signature on a treble staff: which major key is it?
//   hear   the tonic chord (1 3 5 8) of a random key, then one note: which
//          degree is it? Hidden until answered, then shown on the staff.
// Levels: keys with up to 2, 4 or 7 signs; for hearing, degrees 1 3 5, then
// 1 to 5, then all seven.

type Mode = "spell" | "key" | "hear";
type Level = "a" | "b" | "c";
type SQ = { key: string; p: number; k: number; options: string[]; right: number };

const W = 460, STEP = 6, PAD = 18, X_CLEF = 40;
const { lines, anchor } = CLEFS.treble;
const dHi = 41, dLo = 27, H = (dHi - dLo) * STEP + 2 * PAD;
const yOf = (d: number) => PAD + (dHi - d) * STEP;
const OK = "#22c55e", BAD = "#ef4444";
const MAX: Record<Level, number> = { a: 2, b: 4, c: 7 };
const HEAR_DEGREES: Record<Level, number[]> = { a: [1, 3, 5], b: [1, 2, 3, 4, 5], c: [1, 2, 3, 4, 5, 6, 7] };
const rnd = (n: number) => Math.floor(Math.random() * n);
const shuffle = <X,>(xs: X[]) => xs.map(x => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(q => q[1]);
const keyName = (p: number) => spelledName(tonicOf(p), false);

export function MusicScaleQuizFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("spell");
  const [level, setLevel] = useState<Level>("a");
  const [given, setGiven] = useState<{ q: string; i: number } | null>(null);
  const { ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  /** The tonic chord, then degree k (when given). */
  const play = useCallback((p: number, k: number | null, delay = 0) => {
    startAudio();
    const sc = majorScale(tonicOf(p)), ks = [0, 2, 4, 7].map(i => keyOf(sc[i]));
    const go = () => setTimeout(() => seq.play(k ? 6 : 5, i =>
      i < 4 ? playNote(ks[i]) : i === 4 ? ks.slice(0, 3).map(m => playNote(m)) : playNote(keyOf(sc[k! - 1])),
    { gap: 0.42, hold: 0.6 }), delay * 1000);
    if (notesReady()) go(); else ensure().then(go, () => {});
  }, [ensure, seq]);

  const make = (avoid: string | null): SQ => {
    for (;;) {
      const max = MAX[level], p = rnd(2 * max + 1) - max;
      if (mode === "spell") {
        const k = 2 + rnd(6), n = majorScale(tonicOf(p))[k - 1], key = `s:${p}:${k}`;
        if (key === avoid) continue;
        const right = spelledName(n, false), L = LETTERS[((n.d % 7) + 7) % 7];
        const pool = new Set<string>([right]);
        for (const a of [-1, 0, 1] as Acc[]) if (a !== n.a) pool.add(L + ACC_TEXT[a]);
        const other = LETTERS[(((n.d + (n.a > 0 ? 1 : -1)) % 7) + 7) % 7];                // the neighbour letter for the same key
        pool.add(other + (n.a >= 0 ? "♭" : "♯"));
        const options = shuffle([...pool].slice(0, 4));
        return { key, p, k, options, right: options.indexOf(right) };
      }
      if (mode === "key") {
        const key = `k:${p}`;
        if (key === avoid) continue;
        const near = shuffle([p - 1, p + 1, -p].filter(x => x !== p && Math.abs(x) <= 7));
        const options = shuffle([p, ...near].slice(0, 4).map(keyName));
        return { key, p, k: 1, options, right: options.indexOf(keyName(p)) };
      }
      const ds = HEAR_DEGREES[level], k = ds[rnd(ds.length)], key = `h:${p}:${k}`;
      if (key === avoid) continue;
      const options = ds.map(String);
      return { key, p, k, options, right: ds.indexOf(k) };
    }
  };

  const stage = (q: SQ, { submit, feedback }: StageApi) => {
    const mine = given?.q === q.key ? given.i : null;
    const tone = feedback ? (feedback.ok ? OK : BAD) : C.amber;
    const sigD = q.p > 0 ? SHARP_D.slice(0, q.p) : FLAT_D.slice(0, -q.p);
    const showSig = mode === "key" || (feedback && mode !== "hear");
    const sc = majorScale(tonicOf(q.p)), target = sc[q.k - 1];
    return (
      <div className="px-3 pb-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none mx-auto" style={{ maxHeight: 190 }}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={W - 30} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {showSig && sigD.map((d, i) => <AccidentalGlyph key={i} a={(q.p > 0 ? 1 : -1) as Acc} x={X_CLEF + 30 + i * 12} y={yOf(d)} s={2 * STEP} color={mode === "key" ? tone : C.fg} />)}
          {mode === "spell" && <T x={W - 40} y={yOf(30)} anchor="end" size={14} bold color={C.sky}>{keyName(q.p)}</T>}
          {mode === "hear" && !feedback && <T x={W / 2} y={yOf(34) + 4} anchor="middle" size={13} bold color={C.muted}>?</T>}
          {feedback && mode !== "key" && (
            <g>
              {mode === "hear" && target.a !== 0 && <AccidentalGlyph a={target.a} x={300 - 20} y={yOf(target.d)} s={2 * STEP} color={tone} />}
              <StaffNote x={300} y={yOf(target.d)} s={2 * STEP} color={tone} ledgerYs={ledgers(target.d, lines).map(yOf)} filled />
              <T x={318} y={yOf(target.d) + 4} size={11} bold color={tone}>{spelledName(target, false)} = {q.k}</T>
            </g>
          )}
        </svg>
        <div className="pt-2">
          <ChoiceButtons options={q.options} right={q.right} picked={mine} feedback={feedback}
            onPick={i => { if (feedback) return; setGiven({ q: q.key, i }); submit(i === q.right); }}
            extra={mode === "hear" ? <button type="button" onClick={() => play(q.p, q.k)} className="h-11 px-3 rounded-xl border-2 border-[var(--border)] text-[15px] flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)]" aria-label={tx(t, "figMus_dqAgain", "hear it again")}><Volume2 size={18} /></button> : undefined} />
        </div>
      </div>
    );
  };

  const settings = <>
    <Choice value={mode} onChange={setMode} options={[
      ["spell", tx(t, "figMus_dqSpell", "spell a degree")], ["key", tx(t, "figMus_dqKey", "read a signature")], ["hear", tx(t, "figMus_dqHear", "hear a degree")],
    ]} />
    <Choice value={level} onChange={setLevel} options={mode === "hear" ? [
      ["a", "1 3 5"], ["b", "1 – 5"], ["c", "1 – 7"],
    ] : [
      ["a", tx(t, "figMus_dqUpTo2", "up to 2 signs")], ["b", tx(t, "figMus_dqUpTo4", "up to 4")], ["c", tx(t, "figMus_dqAll", "all 15 keys")],
    ]} />
  </>;

  const prompt = (q: SQ) => mode === "spell"
    ? <>{keyName(q.p)} {tx(t, "figMus_sbMajor", "major")}: {tx(t, "figMus_dqDegree", "degree")} <span style={{ color: C.amber }}>{q.k}</span>?</>
    : mode === "key" ? tx(t, "figMus_dqWhichKey", "which major key has this signature?") : tx(t, "figMus_dqWhichDeg", "which degree is the last note?");

  return (
    <Figure title={tx(t, "figMus_dqTitle", "Practice: major keys")}
      head={<InstrumentChoice t={t} />}
      controls={<VolumeSlider t={t} />}
      note={tx(t, "figMus_dqNote", "Spelling: the letter is fixed (degree 3 of D is some kind of F, three letters up), so only the sign is in question: count the steps, or use the signature. Signatures: with sharps, the key is one half step above the last sharp (F♯ C♯ → D); with flats, it is the second-to-last flat (B♭ E♭ A♭ → E♭), and one flat is F. Hearing: after the chord, sing down to the tonic from the last note and count the steps.")}>
      <div ref={vis.ref}>
        <Practice<SQ> t={t} id={`music-major-${mode}-${level}`} make={make} settings={settings} art={<ScaleArt />} stage={stage}
          prompt={prompt}
          solution={q => mode === "key" ? `${keyName(q.p)} ${tx(t, "figMus_sbMajor", "major")}` : `${spelledName(majorScale(tonicOf(q.p))[q.k - 1], false)} (${q.k})`}
          onShow={q => { setGiven(null); if (mode === "hear") play(q.p, q.k, 0.25); }}
          onAnswer={(q, ok) => { if (mode === "hear" && !ok) play(q.p, q.k, 0.35); }} />
      </div>
    </Figure>
  );
}
