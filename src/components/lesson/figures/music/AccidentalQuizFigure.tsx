"use client";

import { useCallback, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Choice, C, Figure, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { isBlack } from "@/components/lesson/kit/audio/notes";
import { pianoReady, playPiano } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { PianoKeyboard } from "@/components/lesson/kit/audio/PianoKeyboard";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { Practice, type StageApi } from "@/components/lesson/kit/practice/Practice";
import { CLEFS, Clef, StaffNote, ledgers } from "./staff";
import { AccidentalGlyph, accOffset, keyOf, spelledName, spelledSolfa, type Acc } from "./accidentals";
import { SharpArt } from "./practiceArt";

// ── What this figure shows ────────────────────────────────────────────────────
// A practice round (kit/practice): a note with a sharp or a flat appears on a
// treble staff, from middle C to the top line; the reader plays it on the
// keyboard, the exact key. Three levels: black keys only; also the white-key
// spellings (E♯, F♭, B♯, C♭); also double sharps and flats. A wrong answer
// paints the right key green and the pressed one red, plays the right one and
// returns in the review round.

type Level = "black" | "tricky" | "double";
type AQ = { key: string; d: number; a: Acc };
const LO = 55, HI = 84, W = 460, STEP = 6, PAD = 22, X_CLEF = 40, X1 = 400, XN = 230;
const OK = "#22c55e", BAD = "#ef4444";                      // the practice kit's right / wrong colours
const { lines, anchor } = CLEFS.treble;

export function MusicAccidentalQuizFigure({ t }: { t?: TrackTranslations }) {
  const [level, setLevel] = useState<Level>("black");
  const [given, setGiven] = useState<{ q: string; m: number } | null>(null);
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { ensure } = usePiano();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);

  const sound = useCallback((m: number, delay = 0) => {
    startAudio();
    const go = () => setTimeout(() => { voices.start(m, playPiano(m)); setTimeout(() => voices.release(m), 900); }, delay * 1000);
    if (pianoReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices]);

  /** A note from C4 to F5 with a sign the level allows. */
  const make = (avoid: string | null): AQ => {
    for (;;) {
      const d = 28 + Math.floor(Math.random() * 11);
      const signs: Acc[] = level === "double" ? [-2, -1, 1, 2] : [-1, 1];
      const a = signs[Math.floor(Math.random() * signs.length)], m = keyOf({ d, a }), key = `${d}:${a}`;
      if (key === avoid || m < LO || m > HI) continue;
      if (level === "black" && !isBlack(m)) continue;
      return { key, d, a };
    }
  };

  const stage = (q: AQ, { submit, feedback }: StageApi) => {
    const right = keyOf(q), mine = given?.q === q.key ? given.m : null;
    const dHi = lines[4] + 4, dLo = lines[0] - 5, H = (dHi - dLo) * STEP + 2 * PAD, yOf = (d: number) => PAD + (dHi - d) * STEP;
    const tone = feedback ? (feedback.ok ? OK : BAD) : C.amber;
    const keyColor = (m: number) => (!feedback ? null : m === right ? OK : m === mine ? BAD : null);
    const down = (m: number) => {
      setPressed(s => new Set(s).add(m));
      sound(m);
      if (feedback) return;
      setGiven({ q: q.key, m });
      submit(m === right);
    };
    return (
      <div className="px-3 pb-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none mx-auto" style={{ maxHeight: 200 }}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={X1} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind="treble" x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          <AccidentalGlyph a={q.a} x={XN - accOffset(q.a) * 2 * STEP} y={yOf(q.d)} s={2 * STEP} color={tone} />
          <StaffNote x={XN} y={yOf(q.d)} s={2 * STEP} color={tone} ledgerYs={ledgers(q.d, lines).map(yOf)} filled={!!feedback} />
          {feedback && <T x={XN + 16} y={yOf(q.d) + 4} size={12} bold color={tone}>{spelledName(q)}</T>}
        </svg>
        <div className="pt-2">
          <PianoKeyboard lo={LO} hi={HI} pressed={pressed} onDown={down}
            onUp={m => setPressed(s => { const n = new Set(s); n.delete(m); return n; })} labels="c" color="#94a3b8" keyColor={keyColor}
            ariaLabel={tx(t, "figMus_aqAria", "piano keyboard for the sharps and flats game")} />
        </div>
      </div>
    );
  };

  const settings = (
    <Choice value={level} onChange={setLevel} options={[
      ["black", tx(t, "figMus_aqBlack", "black keys")],
      ["tricky", tx(t, "figMus_aqTricky", "+ E♯, F♭, B♯, C♭")],
      ["double", tx(t, "figMus_aqDouble", "+ double signs")],
    ]} />
  );

  return (
    <Figure title={tx(t, "figMus_aqTitle", "Practice: play what you read")}
      controls={<VolumeSlider t={t} />}
      note={tx(t, "figMus_aqNote", "Read in two moves. First the letter and its octave, as in the last chapter, ignoring the sign: find that white key. Then the sign: a sharp moves one key to the right, a flat one key to the left, counting black and white keys alike. On the second level some moves land on a white key (E♯ is F, C♭ is B); on the third, the double signs move two keys.")}>
      <div ref={vis.ref}>
        <Practice<AQ> t={t} id={`music-read-accidentals-${level}`} make={make} settings={settings} art={<SharpArt />} stage={stage}
          prompt={() => tx(t, "figMus_aqPrompt", "play this note")}
          solution={q => `${spelledName(q)} (${spelledSolfa(t, q)})`}
          onShow={() => setGiven(null)}
          onAnswer={(q, ok) => { if (!ok) sound(keyOf(q), 0.35); }} />
      </div>
    </Figure>
  );
}
