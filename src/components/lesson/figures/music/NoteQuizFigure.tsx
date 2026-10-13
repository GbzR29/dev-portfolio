"use client";

import { useCallback, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { isBlack, octave } from "@/components/lesson/kit/audio/notes";
import { pianoReady, playPiano } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { PianoKeyboard } from "@/components/lesson/kit/audio/PianoKeyboard";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { LETTERS, letterIndex, solfa } from "./names";

// ── What this figure shows ────────────────────────────────────────────────────
// A little practice game for the white keys. "Name → key": a name is shown
// (letter or solfège, with the octave number if octaves are on) and the
// reader presses that key. "Key → name": a key lights up and sounds, and the
// reader picks its name. A wrong answer shows the right one; the score and
// the current streak are counted. Only white keys: the black ones get their
// names (sharps and flats) two chapters later.

type Mode = "find" | "name";
type Style = "letter" | "solfa";

const ONE: [number, number] = [60, 71], THREE: [number, number] = [48, 83];   // C4–B4, C3–B5
const whitesIn = ([lo, hi]: [number, number]) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(m => !isBlack(m));

export function MusicNoteQuizFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("find");
  const [style, setStyle] = useState<Style>("letter");
  const [octaves, setOctaves] = useState(false);
  const [target, setTarget] = useState(64);                          // E4 to begin with
  const [result, setResult] = useState<{ ok: boolean; said: string; right: string } | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const { load, ensure } = usePiano();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const held = useRef(new Set<number>());

  const range = mode === "find" && octaves ? THREE : ONE, syl = solfa(t);
  const nameOf = (m: number, withOct = octaves && mode === "find") =>
    (style === "letter" ? LETTERS : syl)[letterIndex(m)] + (withOct ? octave(m) : "");

  const sound = useCallback((m: number, hold = false) => {
    startAudio();
    const go = () => { if (!hold || held.current.has(m)) voices.start(m, playPiano(m)); if (!hold) setTimeout(() => voices.release(m), 700); };
    if (pianoReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices]);

  /** Scores an answer and moves on to a new key. */
  const answer = (ok: boolean, said: string, right: string) => {
    setResult({ ok, said, right });
    setScore(s => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1, streak: ok ? s.streak + 1 : 0 }));
    const pool = whitesIn(range).filter(m => m !== target);
    const next = pool[Math.floor(Math.random() * pool.length)];
    setTarget(next);
    if (mode === "name") setTimeout(() => sound(next), 450);
  };

  const down = useCallback((m: number) => {
    held.current.add(m);
    setPressed(s => new Set(s).add(m));
    sound(m, true);
    if (mode === "find" && !isBlack(m)) {
      const ok = octaves ? m === target : letterIndex(m) === letterIndex(target);
      answer(ok, nameOf(m, octaves), nameOf(target));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, octaves, target, style, sound]);
  const up = useCallback((m: number) => {
    held.current.delete(m);
    setPressed(s => { const n = new Set(s); n.delete(m); return n; });
    voices.release(m);
  }, [voices]);

  const switchMode = (v: Mode) => { setMode(v); setResult(null); setTarget(64); };
  const shown = mode === "name" ? new Set([target, ...pressed]) : pressed;

  return (
    <Figure title={tx(t, "figMus_nqTitle", "Practice: find the note")}
      head={<Choice value={mode} onChange={switchMode}
        options={[["find", tx(t, "figMus_nqFind", "name → key")], ["name", tx(t, "figMus_nqName", "key → name")]]} />}
      controls={<>
        <Row>
          <Choice value={style} onChange={setStyle} options={[["letter", tx(t, "figMus_knLetter", "letters")], ["solfa", tx(t, "figMus_knSolfa", "do re mi")]]} />
          {mode === "find" && <Btn active={octaves} onClick={() => { setOctaves(o => !o); setResult(null); }}>{tx(t, "figMus_nqOctaves", "with octave numbers (3 octaves)")}</Btn>}
        </Row>
        {mode === "name" && (
          <Row>
            {LETTERS.map((_, i) => (
              <Btn key={i} onClick={() => answer(i === letterIndex(target), (style === "letter" ? LETTERS : syl)[i], nameOf(target))}>
                {(style === "letter" ? LETTERS : syl)[i]}
              </Btn>
            ))}
          </Row>
        )}
        <Row>
          <Readout color={C.amber}>{score.right} / {score.total}</Readout>
          <Readout>{tx(t, "figMus_nqStreak", "streak")}: {score.streak}</Readout>
          {result && (
            <Readout color={result.ok ? C.green : C.red}>
              {result.ok ? `✓ ${result.right}` : `✗ ${result.said} · ${tx(t, "figMus_nqWas", "it was")} ${result.right}`}
            </Readout>
          )}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_nqNote", "Use the landmarks: C just left of the two black keys, F just left of the three. From C count up D E; from F count up G A B. With octave numbers on, find the C first (C4 is the middle one here), then walk up to the letter. In \"key → name\", the lit key also sounds; try naming it from the picture first, and later with your eyes closed (the next chapters show why that is much harder).")}>
      <div ref={vis.ref} className="px-3 pt-3 pb-3">
        <div className="text-center mb-2 font-mono">
          {mode === "find"
            ? <span className="text-[13px] text-[var(--text-muted)]">{tx(t, "figMus_nqPress", "press")} <span className="text-[26px] font-bold" style={{ color: C.amber }}>{nameOf(target)}</span></span>
            : <span className="text-[13px] text-[var(--text-muted)]">{tx(t, "figMus_nqWhich", "which note is lit?")}</span>}
        </div>
        <PianoKeyboard lo={range[0]} hi={range[1]} pressed={shown} onDown={down} onUp={up} labels="none" color={mode === "name" ? C.amber : "#f43f5e"}
          ariaLabel={tx(t, "figMus_nqAria", "piano keyboard for the note game")} />
        <div className="pt-3 flex items-center gap-3">
          {mode === "name" && <SoundButton on={false} onClick={() => sound(target)}>{tx(t, "figMus_nqAgain", "hear it again")}</SoundButton>}
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</span>}
        </div>
      </div>
    </Figure>
  );
}
