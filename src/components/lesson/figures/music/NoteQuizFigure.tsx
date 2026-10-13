"use client";

import { useCallback, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { isBlack, octave } from "@/components/lesson/kit/audio/notes";
import { pianoReady, playPiano } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { PianoKeyboard } from "@/components/lesson/kit/audio/PianoKeyboard";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { Practice, type StageApi } from "@/components/lesson/kit/practice/Practice";
import { ChoiceButtons } from "@/components/lesson/kit/practice/ChoiceButtons";
import { LETTERS, letterIndex, solfa } from "./names";

// ── What this figure shows ────────────────────────────────────────────────────
// A practice round for the white keys (kit/practice). Two kinds of question,
// alone or mixed: "find the G" (press the key; with octave numbers on, the
// exact one, C3–B5) and "which note is this?" (a key lights up and sounds;
// pick its name). Letters or solfège. A wrong answer paints the right key
// green and the pressed one red, plays the right one, and comes back in the
// review round. Only white keys: black keys are named two chapters later.

type Kind = "find" | "name";
type Mode = Kind | "mixed";
type Style = "letter" | "solfa";
type NQ = { key: string; kind: Kind; m: number };

const ONE: [number, number] = [60, 71], THREE: [number, number] = [48, 83];   // C4–B4, C3–B5
const whitesIn = ([lo, hi]: [number, number]) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(m => !isBlack(m));
const OK = "#22c55e", BAD = "#ef4444";                      // the practice kit's right / wrong colours

export function MusicNoteQuizFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("mixed");
  const [style, setStyle] = useState<Style>("letter");
  const [octaves, setOctaves] = useState(false);
  const [given, setGiven] = useState<{ q: string; m?: number; i?: number } | null>(null);
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { ensure } = usePiano();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const held = useRef(new Set<number>());

  const syl = solfa(t), names = style === "letter" ? LETTERS : syl;
  const range = octaves ? THREE : ONE;
  const nameOf = (m: number, withOct: boolean) => names[letterIndex(m)] + (withOct ? octave(m) : "");

  const sound = useCallback((m: number, delay = 0) => {
    startAudio();
    const go = () => setTimeout(() => { voices.start(m, playPiano(m)); setTimeout(() => voices.release(m), 900); }, delay * 1000);
    if (pianoReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices]);

  const make = (avoid: string | null): NQ => {
    const pool = whitesIn(range);
    for (;;) {
      const kind: Kind = mode === "mixed" ? (Math.random() < 0.5 ? "find" : "name") : mode;
      const m = pool[Math.floor(Math.random() * pool.length)], key = `${kind}:${m}`;
      if (key !== avoid) return { key, kind, m };
    }
  };

  const stage = (q: NQ, { submit, feedback }: StageApi) => {
    const mine = given?.q === q.key ? given : null;
    const keyColor = (m: number) => (!feedback ? null : m === q.m ? OK : mine?.m === m ? BAD : null);
    const down = (m: number) => {
      held.current.add(m);
      setPressed(s => new Set(s).add(m));
      sound(m);
      if (q.kind !== "find" || isBlack(m)) return;
      setGiven({ q: q.key, m });
      submit(octaves ? m === q.m : letterIndex(m) === letterIndex(q.m));
    };
    const up = (m: number) => { held.current.delete(m); setPressed(s => { const n = new Set(s); n.delete(m); return n; }); };
    return (
      <div className="px-3 pb-4">
        <PianoKeyboard lo={range[0]} hi={range[1]} pressed={q.kind === "name" ? new Set([q.m, ...pressed]) : pressed}
          onDown={down} onUp={up} labels="none" color={q.kind === "name" ? C.amber : "#94a3b8"} keyColor={keyColor}
          ariaLabel={tx(t, "figMus_nqAria", "piano keyboard for the note game")} />
        {q.kind === "name" && (
          <div className="pt-3">
            <ChoiceButtons options={names} right={letterIndex(q.m)} picked={mine?.i ?? null} feedback={feedback}
              onPick={i => { setGiven({ q: q.key, i }); submit(i === letterIndex(q.m)); }}
              extra={<button type="button" onClick={() => sound(q.m)} className="h-11 px-3 rounded-xl border-2 border-[var(--border)] text-[15px]" aria-label={tx(t, "figMus_nqAgain", "hear it again")}>🔊</button>} />
          </div>
        )}
      </div>
    );
  };

  const settings = <>
    <Choice value={mode} onChange={setMode} options={[
      ["mixed", tx(t, "figMus_nqMixed", "mixed")], ["find", tx(t, "figMus_nqFind", "name → key")], ["name", tx(t, "figMus_nqName", "key → name")],
    ]} />
    <Choice value={style} onChange={setStyle} options={[["letter", tx(t, "figMus_knLetter", "letters")], ["solfa", tx(t, "figMus_knSolfa", "do re mi")]]} />
    <Btn active={octaves} onClick={() => setOctaves(o => !o)}>{tx(t, "figMus_nqOctaves", "with octave numbers (3 octaves)")}</Btn>
  </>;

  return (
    <Figure title={tx(t, "figMus_nqTitle", "Practice: find the note")}
      controls={<VolumeSlider t={t} />}
      note={tx(t, "figMus_nqNote", "Use the landmarks: C just left of the two black keys, F just left of the three. From C count up D E; from F count up G A B. With octave numbers on, find the C first (C4 is the middle one here), then walk up to the letter. In \"key → name\", the lit key also sounds; try naming it from the picture first, and later with your eyes closed (the next chapters show why that is much harder).")}>
      <div ref={vis.ref}>
        <Practice<NQ> t={t} id={`music-find-note-${mode}-${octaves ? 3 : 1}`} make={make} settings={settings}
          prompt={q => q.kind === "find"
            ? <>{tx(t, "figMus_nqPress", "find")} <span style={{ color: C.amber }}>{nameOf(q.m, octaves)}</span></>
            : tx(t, "figMus_nqWhich", "which note is lit?")}
          stage={stage}
          solution={q => nameOf(q.m, q.kind === "find" && octaves)}
          onShow={q => { setGiven(null); if (q.kind === "name") sound(q.m, 0.25); }}
          onAnswer={(q, ok) => { if (q.kind === "name" || !ok) sound(q.m, 0.35); }} />
      </div>
    </Figure>
  );
}
