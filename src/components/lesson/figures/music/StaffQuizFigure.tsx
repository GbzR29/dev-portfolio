"use client";

import { useCallback, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { pianoReady, playPiano } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { useVoices } from "@/components/lesson/kit/audio/useVoices";
import { CLEFS, Clef, StaffNote, dName, ledgers, midiOf, type ClefKind } from "./staff";
import { LETTERS, solfa } from "./names";

// ── What this figure shows ────────────────────────────────────────────────────
// Reading practice. A note appears on a treble or bass staff (or either, at
// random), anywhere from two ledger lines below to two above; the reader
// names it with a letter or a solfège button. The answer is checked by letter
// (the octave is not asked), then the note sounds and a new one appears.
// Score and streak are counted; "show the landmarks" marks the lines the
// clefs name (G4, F3) and middle C, the anchors to count from.

type Pick = ClefKind | "both";
type Style = "letter" | "solfa";
const W = 600, STEP = 6, PAD = 22, X_CLEF = 60, X1 = 400, XN = 250;

/** A random note (and its clef) within two ledger lines of the staff, never the same as `not`. */
function draw(pick: Pick, not: number | null): { clef: ClefKind; d: number } {
  const clef: ClefKind = pick === "both" ? (Math.random() < 0.5 ? "treble" : "bass") : pick;
  const lo = CLEFS[clef].lines[0] - 4, span = 8 + 8 + 1;
  for (;;) {
    const d = lo + Math.floor(Math.random() * span);
    if (d !== not) return { clef, d };
  }
}

export function MusicStaffQuizFigure({ t }: { t?: TrackTranslations }) {
  const [pick, setPick] = useState<Pick>("treble");
  const [style, setStyle] = useState<Style>("letter");
  const [marks, setMarks] = useState(false);
  const [q, setQ] = useState<{ clef: ClefKind; d: number }>({ clef: "treble", d: 34 });   // B4 to begin
  const [result, setResult] = useState<{ ok: boolean; said: string; right: string } | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });
  const { ensure } = usePiano();
  const vis = useVisible<HTMLDivElement>();
  const voices = useVoices(vis.on);

  const names = style === "letter" ? LETTERS : solfa(t);
  const { lines, anchor } = CLEFS[q.clef], dHi = lines[4] + 5, dLo = lines[0] - 5;
  const H = (dHi - dLo) * STEP + 2 * PAD;
  const yOf = (d: number) => PAD + (dHi - d) * STEP;

  const sound = useCallback((m: number) => {
    startAudio();
    const go = () => { voices.start(m, playPiano(m)); setTimeout(() => voices.release(m), 800); };
    if (pianoReady()) go(); else ensure().then(go, () => {});
  }, [ensure, voices]);

  const answer = (i: number) => {
    const right = ((q.d % 7) + 7) % 7;
    setResult({ ok: i === right, said: names[i], right: `${names[right]} (${dName(q.d)})` });
    setScore(s => ({ right: s.right + (i === right ? 1 : 0), total: s.total + 1, streak: i === right ? s.streak + 1 : 0 }));
    sound(midiOf(q.d));
    setQ(draw(pick, q.d));
  };
  const choose = (p: Pick) => { setPick(p); setQ(draw(p, null)); setResult(null); };
  const landmark = q.clef === "treble" ? [32, 28] : [24, 28];       // the clef's own line, and middle C

  return (
    <Figure title={tx(t, "figMus_sqTitle", "Practice: read the staff")}
      head={<Choice value={pick} onChange={choose} options={[
        ["treble", tx(t, "figMus_stTreble", "treble (G)")], ["bass", tx(t, "figMus_stBass", "bass (F)")], ["both", tx(t, "figMus_sqBoth", "both, mixed")],
      ]} />}
      controls={<>
        <Row>
          <Choice value={style} onChange={setStyle} options={[["letter", tx(t, "figMus_knLetter", "letters")], ["solfa", tx(t, "figMus_knSolfa", "do re mi")]]} />
          <Btn active={marks} onClick={() => setMarks(m => !m)}>{tx(t, "figMus_sqMarks", "show the landmarks")}</Btn>
        </Row>
        <Row>
          {names.map((n, i) => <Btn key={i} onClick={() => answer(i)}>{n}</Btn>)}
        </Row>
        <Row>
          <Readout color={C.amber}>{score.right} / {score.total}</Readout>
          <Readout>{tx(t, "figMus_nqStreak", "streak")}: {score.streak}</Readout>
          {result && <Readout color={result.ok ? C.green : C.red}>{result.ok ? `✓ ${result.right}` : `✗ ${result.said} · ${tx(t, "figMus_nqWas", "it was")} ${result.right}`}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_sqNote", "Don't count from the bottom line every time: learn a few landmarks and count from the nearest one. In treble clef, the G clef's curl marks G4 on line 2, and middle C hangs on one ledger line below. In bass clef, the F clef's dots mark F3 on line 4, and middle C sits one ledger line above. Then line to line is a skip of two letters, line to the next space a single step. A few minutes a day for a week works better than an hour once.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none" style={{ maxHeight: 260 }}>
          {lines.map(d => <line key={d} x1={X_CLEF - 22} x2={X1} y1={yOf(d)} y2={yOf(d)} stroke={C.fg} strokeOpacity={0.75} strokeWidth={1.2} />)}
          <Clef kind={q.clef} x={X_CLEF} y={yOf(anchor)} s={2 * STEP} color={C.fg} />
          {marks && landmark.map(d => (
            <g key={d}>
              <line x1={X1 + 6} x2={X1 + 22} y1={yOf(d)} y2={yOf(d)} stroke={C.sky} strokeWidth={2} />
              <T x={X1 + 26} y={yOf(d) + 3.5} size={10} bold color={C.sky}>{dName(d)}{d === 28 ? ` · ${tx(t, "figMus_stMiddleC", "middle C")}` : ""}</T>
            </g>
          ))}
          <StaffNote x={XN} y={yOf(q.d)} s={2 * STEP} color={C.amber} ledgerYs={ledgers(q.d, lines).map(yOf)} />
        </svg>
      </div>
    </Figure>
  );
}
