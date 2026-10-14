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
import { AccidentalGlyph, accOffset, keyOf, spelledName, type Acc, type Spelled } from "./accidentals";
import { FLAT_D, MAJOR, MINOR, SHARP_D, scaleOn, tonicOf } from "./scales";
import { MinorArt } from "./practiceArt";

// ── What this figure shows ────────────────────────────────────────────────────
// A practice round (kit/practice) on minor keys, three ways:
//   hear  a scale plays up from a random tonic: major, or which minor?
//         (levels: major / natural; + harmonic; + melodic). Shown on the
//         staff once answered.
//   sig   a key signature: which MINOR key is it? The relative major is
//         among the options, the usual slip.
//   rel   "the relative minor of E♭ major?" or "the relative major of F♯
//         minor?"; the options hold the parallel key and the third counted
//         the wrong way.
// Levels for sig and rel: keys with up to 2, 4 or 7 signs.

type Mode = "hear" | "sig" | "rel";
type Level = "a" | "b" | "c";
type Kind = "major" | "natural" | "harmonic" | "melodic";
type MQ = { key: string; p: number; kind: Kind; toMinor: boolean; options: string[]; right: number };

const W = 460, STEP = 6, PAD = 18, X_CLEF = 40;
const { lines, anchor } = CLEFS.treble;
const dHi = 42, dLo = 26, H = (dHi - dLo) * STEP + 2 * PAD;
const yOf = (d: number) => PAD + (dHi - d) * STEP;
const OK = "#22c55e", BAD = "#ef4444";
const MAX: Record<Level, number> = { a: 2, b: 4, c: 7 };
const KINDS: Record<Level, Kind[]> = { a: ["major", "natural"], b: ["major", "natural", "harmonic"], c: ["major", "natural", "harmonic", "melodic"] };
const SIZES: Record<Kind, number[]> = { major: MAJOR, ...MINOR };
const rnd = (n: number) => Math.floor(Math.random() * n);
const shuffle = <X,>(xs: X[]) => xs.map(x => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(q => q[1]);
const uniq = (xs: number[]) => xs.filter((x, i) => xs.indexOf(x) === i);

export function MusicMinorQuizFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("hear");
  const [level, setLevel] = useState<Level>("a");
  const [given, setGiven] = useState<{ q: string; i: number } | null>(null);
  const { ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const kindName = (k: Kind) => ({
    major: tx(t, "figMus_mqMajor", "major"), natural: tx(t, "figMus_mqNatural", "natural minor"),
    harmonic: tx(t, "figMus_mqHarmonic", "harmonic minor"), melodic: tx(t, "figMus_mqMelodic", "melodic minor"),
  })[k];
  const majKey = (p: number) => `${spelledName(tonicOf(p), false)} ${tx(t, "figMus_sbMajor", "major")}`;
  const minKey = (r: number) => `${spelledName(tonicOf(r), false)} ${tx(t, "figMus_mnMinor", "minor")}`;
  const scaleOf = (q: MQ): Spelled[] => scaleOn(tonicOf(q.p), SIZES[q.kind]);

  const play = useCallback((notes: Spelled[], delay = 0) => {
    startAudio();
    const go = () => setTimeout(() => seq.play(8, i => playNote(keyOf(notes[i])), { gap: 0.34, hold: 0.5 }), delay * 1000);
    if (notesReady()) go(); else ensure().then(go, () => {});
  }, [ensure, seq]);

  const make = (avoid: string | null): MQ => {
    for (;;) {
      if (mode === "hear") {
        const ks = KINDS[level], kind = ks[rnd(ks.length)], p = rnd(9) - 3, key = `h:${p}:${kind}`;   // tonics E♭ … B
        if (key === avoid) continue;
        const options = ks.map(kindName);
        return { key, p, kind, toMinor: false, options, right: ks.indexOf(kind) };
      }
      const max = MAX[level], sig = rnd(2 * max + 1) - max;
      if (mode === "sig") {
        const r = sig + 3, key = `s:${sig}`;
        if (key === avoid) continue;
        const wrong = shuffle(uniq([r - 1, r + 1, r - 2, r + 2]).filter(x => x >= -4 && x <= 10)).slice(0, 2).map(minKey);
        const options = shuffle([minKey(r), majKey(sig), ...wrong]);
        return { key, p: sig, kind: "natural", toMinor: true, options, right: options.indexOf(minKey(r)) };
      }
      // rel: from a major key to its relative minor, or back
      const toMinor = Math.random() < 0.5, key = `r:${sig}:${toMinor}`;
      if (key === avoid) continue;
      if (toMinor) {
        const p = sig, right = minKey(p + 3);
        const pool = uniq([p, p - 3, p + 4, p + 2].filter(x => x >= -4 && x <= 10)).map(minKey).filter(n => n !== right);
        const options = shuffle([right, ...shuffle(pool).slice(0, 3)]);
        return { key, p, kind: "major", toMinor, options, right: options.indexOf(right) };
      }
      const r = sig + 3, right = majKey(r - 3);
      const pool = uniq([r, r + 3, r - 2, r - 4].filter(x => x >= -7 && x <= 7)).map(majKey).filter(n => n !== right);
      const options = shuffle([right, ...shuffle(pool).slice(0, 3)]);
      return { key, p: r, kind: "natural", toMinor, options, right: options.indexOf(right) };
    }
  };

  const stage = (q: MQ, { submit, feedback }: StageApi) => {
    const mine = given?.q === q.key ? given.i : null;
    const tone = feedback ? (feedback.ok ? OK : BAD) : C.amber;
    // the signature drawn: sig mode always; rel mode once answered (it is shared by both keys)
    const sig = mode === "sig" ? q.p : q.toMinor ? q.p : q.p - 3;
    const sigD = sig > 0 ? SHARP_D.slice(0, sig) : FLAT_D.slice(0, -sig);
    const showSig = mode === "sig" || (mode === "rel" && feedback);
    const notes = mode === "hear" && feedback ? scaleOf(q) : [];
    const nx = (k: number) => 150 + k * 36;
    return (
      <div className="px-3 pb-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none mx-auto" style={{ maxHeight: 190 }}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={W - 12} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {showSig && sigD.map((d, i) => <AccidentalGlyph key={i} a={(sig > 0 ? 1 : -1) as Acc} x={X_CLEF + 30 + i * 12} y={yOf(d)} s={2 * STEP} color={mode === "sig" ? tone : C.fg} />)}
          {mode === "rel" && <T x={W - 24} y={yOf(40) + 2} anchor="end" size={14} bold color={q.toMinor ? C.sky : C.purple}>{q.toMinor ? majKey(q.p) : minKey(q.p)}</T>}
          {mode === "hear" && !feedback && <T x={W / 2} y={yOf(34) + 4} anchor="middle" size={13} bold color={C.muted}>?</T>}
          {notes.map((n, k) => (
            <g key={k}>
              {n.a !== 0 && <AccidentalGlyph a={n.a} x={nx(k) - accOffset(n.a) * 2 * STEP} y={yOf(n.d)} s={2 * STEP} color={tone} />}
              <StaffNote x={nx(k)} y={yOf(n.d)} s={2 * STEP} color={k === 0 || k === 7 ? tone : C.fg} ledgerYs={ledgers(n.d, lines).map(yOf)} filled={k === 0 || k === 7} />
            </g>
          ))}
        </svg>
        <div className="pt-2">
          <ChoiceButtons options={q.options} right={q.right} picked={mine} feedback={feedback}
            onPick={i => { if (feedback) return; setGiven({ q: q.key, i }); submit(i === q.right); }}
            extra={mode === "hear" ? <button type="button" onClick={() => play(scaleOf(q))} className="h-11 px-3 rounded-xl border-2 border-[var(--border)] text-[15px] flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)]" aria-label={tx(t, "figMus_dqAgain", "hear it again")}><Volume2 size={18} /></button> : undefined} />
        </div>
      </div>
    );
  };

  const settings = <>
    <Choice value={mode} onChange={setMode} options={[
      ["hear", tx(t, "figMus_mqHear", "hear the scale")], ["sig", tx(t, "figMus_mqSig", "minor key of a signature")], ["rel", tx(t, "figMus_mqRel", "relative keys")],
    ]} />
    <Choice value={level} onChange={setLevel} options={mode === "hear" ? [
      ["a", tx(t, "figMus_mqLvA", "major or minor")], ["b", tx(t, "figMus_mqLvB", "+ harmonic")], ["c", tx(t, "figMus_mqLvC", "+ melodic")],
    ] : [
      ["a", tx(t, "figMus_dqUpTo2", "up to 2 signs")], ["b", tx(t, "figMus_dqUpTo4", "up to 4")], ["c", tx(t, "figMus_mqAll", "all 15 keys")],
    ]} />
  </>;

  const prompt = (q: MQ) => mode === "hear" ? tx(t, "figMus_mqWhichScale", "which scale was that?")
    : mode === "sig" ? tx(t, "figMus_mqWhichMinor", "which minor key has this signature?")
    : q.toMinor ? tx(t, "figMus_mqRelMinor", "its relative minor?") : tx(t, "figMus_mqRelMajor", "its relative major?");

  const solution = (q: MQ) => mode === "hear" ? `${spelledName(tonicOf(q.p), false)} ${kindName(q.kind)}`
    : mode === "sig" ? minKey(q.p + 3) : q.toMinor ? minKey(q.p + 3) : majKey(q.p - 3);

  return (
    <Figure title={tx(t, "figMus_mqTitle", "Practice: minor keys")}
      head={<InstrumentChoice t={t} />}
      controls={<VolumeSlider t={t} />}
      note={tx(t, "figMus_mqNote", "Hearing: listen to the third note first, a major or a minor third above the start; then to the top: a natural minor creeps up to the octave a whole step away, the harmonic minor leaps a step and a half and then leans in, the melodic minor climbs smoothly like the top of a major scale. Signatures: find the major key as in the last chapter, then go down a minor third (three half steps, three letters counting both ends): two sharps is D major, so B minor. Or directly: with sharps, the minor tonic is a whole step below the last sharp; with flats, a major third above the last flat.")}>
      <div ref={vis.ref}>
        <Practice<MQ> t={t} id={`music-minor-${mode}-${level}`} make={make} settings={settings} art={<MinorArt />} stage={stage}
          prompt={prompt} solution={solution}
          onShow={q => { setGiven(null); if (mode === "hear") play(scaleOf(q), 0.25); }}
          onAnswer={(q, ok) => { if (mode === "hear" && !ok) play(scaleOf(q), 0.35); }} />
      </div>
    </Figure>
  );
}
