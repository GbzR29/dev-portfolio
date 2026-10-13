"use client";

import { useCallback, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { pianoReady, playPiano } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { Practice, type StageApi } from "@/components/lesson/kit/practice/Practice";
import { ChoiceButtons } from "@/components/lesson/kit/practice/ChoiceButtons";
import { CLEFS, Clef, StaffNote, dName, ledgers, midiOf, type ClefKind } from "./staff";
import { LETTERS, solfa } from "./names";

// ── What this figure shows ────────────────────────────────────────────────────
// A practice round for reading the staff (kit/practice). A note appears on a
// treble or bass staff (or either, mixed), anywhere from two ledger lines
// below to two above; the reader names it with a letter or solfège button
// (the octave is not asked). The note sounds after the answer; a wrong one
// shows its full name under the note and returns in the review round.
// "Show the landmarks" marks the clef's own line and middle C.

type Pick = ClefKind | "both";
type Style = "letter" | "solfa";
type SQ = { key: string; clef: ClefKind; d: number };
const W = 460, STEP = 6, PAD = 22, X_CLEF = 40, X1 = 400, XN = 230;

export function MusicStaffQuizFigure({ t }: { t?: TrackTranslations }) {
  const [pick, setPick] = useState<Pick>("treble");
  const [style, setStyle] = useState<Style>("letter");
  const [marks, setMarks] = useState(false);
  const [picked, setPicked] = useState<{ q: string; i: number } | null>(null);
  const { ensure } = usePiano();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);
  const names = style === "letter" ? LETTERS : solfa(t);
  const letter = (d: number) => ((d % 7) + 7) % 7;

  const sound = useCallback((m: number) => {
    startAudio();
    const go = () => { voices.start(m, playPiano(m)); setTimeout(() => voices.release(m), 900); };
    if (pianoReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices]);

  /** A note within two ledger lines of the staff. */
  const make = (avoid: string | null): SQ => {
    for (;;) {
      const clef: ClefKind = pick === "both" ? (Math.random() < 0.5 ? "treble" : "bass") : pick;
      const d = CLEFS[clef].lines[0] - 4 + Math.floor(Math.random() * 17), key = `${clef}:${d}`;
      if (key !== avoid) return { key, clef, d };
    }
  };

  const stage = (q: SQ, { submit, feedback }: StageApi) => {
    const { lines, anchor } = CLEFS[q.clef], dHi = lines[4] + 5, dLo = lines[0] - 5;
    const H = (dHi - dLo) * STEP + 2 * PAD, yOf = (d: number) => PAD + (dHi - d) * STEP;
    const tone = feedback ? (feedback.ok ? "#22c55e" : "#ef4444") : C.amber;
    const marksAt = q.clef === "treble" ? [32, 28] : [24, 28];
    return (
      <div className="px-3 pb-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none mx-auto" style={{ maxHeight: 230 }}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={X1} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind={q.clef} x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {marks && marksAt.map(d => (
            <g key={d}>
              <line x1={X1 + 6} x2={X1 + 22} y1={yOf(d)} y2={yOf(d)} stroke={C.sky} strokeWidth={2} />
              <T x={X1 + 26} y={yOf(d) + 3.5} size={10} bold color={C.sky}>{dName(d)}{d === 28 ? ` · ${tx(t, "figMus_stMiddleC", "middle C")}` : ""}</T>
            </g>
          ))}
          <StaffNote x={XN} y={yOf(q.d)} s={2 * STEP} color={tone} ledgerYs={ledgers(q.d, lines).map(yOf)} filled={!!feedback} />
          {feedback && <T x={XN + 16} y={yOf(q.d) + 4} size={12} bold color={tone}>{names[letter(q.d)]} ({dName(q.d)})</T>}
        </svg>
        <div className="pt-2">
          <ChoiceButtons options={names} right={letter(q.d)} picked={picked?.q === q.key ? picked.i : null} feedback={feedback}
            onPick={i => { setPicked({ q: q.key, i }); submit(i === letter(q.d)); }} />
        </div>
      </div>
    );
  };

  const settings = <>
    <Choice value={pick} onChange={setPick} options={[
      ["treble", tx(t, "figMus_stTreble", "treble (G)")], ["bass", tx(t, "figMus_stBass", "bass (F)")], ["both", tx(t, "figMus_sqBoth", "both, mixed")],
    ]} />
    <Choice value={style} onChange={setStyle} options={[["letter", tx(t, "figMus_knLetter", "letters")], ["solfa", tx(t, "figMus_knSolfa", "do re mi")]]} />
    <Btn active={marks} onClick={() => setMarks(m => !m)}>{tx(t, "figMus_sqMarks", "show the landmarks")}</Btn>
  </>;

  return (
    <Figure title={tx(t, "figMus_sqTitle", "Practice: read the staff")}
      controls={<VolumeSlider t={t} />}
      note={tx(t, "figMus_sqNote", "Don't count from the bottom line every time: learn a few landmarks and count from the nearest one. In treble clef, the G clef's curl marks G4 on line 2, and middle C hangs on one ledger line below. In bass clef, the F clef's dots mark F3 on line 4, and middle C sits one ledger line above. Then line to line is a skip of two letters, line to the next space a single step. A few minutes a day for a week works better than an hour once.")}>
      <div ref={vis.ref}>
        <Practice<SQ> t={t} id={`music-read-staff-${pick}`} make={make} settings={settings} stage={stage}
          prompt={() => tx(t, "figMus_sqPrompt", "which note is this?")}
          solution={q => `${names[letter(q.d)]} (${dName(q.d)})`}
          onShow={() => setPicked(null)}
          onAnswer={q => sound(midiOf(q.d))} />
      </div>
    </Figure>
  );
}
