"use client";

import { useCallback, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { notesReady, playNote } from "@/components/lesson/kit/audio/instrument";
import { InstrumentChoice, loadStatus, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { cents } from "./tuning";
import { abbr, intervalName, type Quality } from "./intervals";

// ── What this figure shows ────────────────────────────────────────────────────
// The 13 intervals from middle C up to the octave, one column each: a bar as
// tall as its size in half steps (a staircase), coloured by how it sounds
// together (perfect consonance, imperfect consonance, dissonance). Clicking a
// column plays the two notes one after the other, then together; the readouts
// give its name, its size, the pure ratio it stands for (chapter 12) and a
// well-known tune that starts with it, going up or down.

type Kind = "perfect" | "imperfect" | "dissonant";
type Row_ = { q: Quality; n: number; s: number; ratio: [number, number]; kind: Kind; up: [string, string]; down?: [string, string] };

const ROWS: Row_[] = [
  { q: "P", n: 1, s: 0, ratio: [1, 1], kind: "perfect", up: ["figMus_ilUpP1", "the same note twice"] },
  { q: "m", n: 2, s: 1, ratio: [16, 15], kind: "dissonant", up: ["figMus_ilUpm2", "Jaws (the shark theme)"], down: ["figMus_ilDnm2", "Für Elise"] },
  { q: "M", n: 2, s: 2, ratio: [9, 8], kind: "dissonant", up: ["figMus_ilUpM2", "Happy Birthday (\"birth-day\")"], down: ["figMus_ilDnM2", "Mary Had a Little Lamb"] },
  { q: "m", n: 3, s: 3, ratio: [6, 5], kind: "imperfect", up: ["figMus_ilUpm3", "Greensleeves"], down: ["figMus_ilDnm3", "Hey Jude"] },
  { q: "M", n: 3, s: 4, ratio: [5, 4], kind: "imperfect", up: ["figMus_ilUpM3", "When the Saints Go Marching In"], down: ["figMus_ilDnM3", "Swing Low, Sweet Chariot"] },
  { q: "P", n: 4, s: 5, ratio: [4, 3], kind: "perfect", up: ["figMus_ilUpP4", "Here Comes the Bride, Amazing Grace"], down: ["figMus_ilDnP4", "Eine kleine Nachtmusik"] },
  { q: "A", n: 4, s: 6, ratio: [45, 32], kind: "dissonant", up: ["figMus_ilUpA4", "Maria (West Side Story), The Simpsons"] },
  { q: "P", n: 5, s: 7, ratio: [3, 2], kind: "perfect", up: ["figMus_ilUpP5", "Twinkle, Twinkle, Little Star; Star Wars"], down: ["figMus_ilDnP5", "The Flintstones"] },
  { q: "m", n: 6, s: 8, ratio: [8, 5], kind: "imperfect", up: ["figMus_ilUpm6", "The Entertainer (E up to C)"] },
  { q: "M", n: 6, s: 9, ratio: [5, 3], kind: "imperfect", up: ["figMus_ilUpM6", "My Bonnie Lies over the Ocean"], down: ["figMus_ilDnM6", "Nobody Knows the Trouble I've Seen"] },
  { q: "m", n: 7, s: 10, ratio: [16, 9], kind: "dissonant", up: ["figMus_ilUpm7", "Somewhere (West Side Story), Star Trek"] },
  { q: "M", n: 7, s: 11, ratio: [15, 8], kind: "dissonant", up: ["figMus_ilUpM7", "Take On Me (the chorus)"] },
  { q: "P", n: 8, s: 12, ratio: [2, 1], kind: "perfect", up: ["figMus_ilUpP8", "Somewhere over the Rainbow"] },
];
const KIND: Record<Kind, { color: string; key: string; en: string }> = {
  perfect: { color: C.green, key: "figMus_ilPerfect", en: "perfect consonance" },
  imperfect: { color: C.sky, key: "figMus_ilImperfect", en: "imperfect consonance" },
  dissonant: { color: C.orange, key: "figMus_ilDissonant", en: "dissonance" },
};

const W = 600, H = 230, X0 = 14, X1 = 590, BASE = 176, UNIT = 11.5, ROOT = 60;
const CW = (X1 - X0) / ROWS.length;

export function MusicIntervalLadderFigure({ t }: { t?: TrackTranslations }) {
  const [sel, setSel] = useState(7);
  const [dir, setDir] = useState<"up" | "down">("up");
  const [climb, setClimb] = useState(false);
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const run = useCallback((f: () => void) => { startAudio(); if (notesReady()) f(); else ensure().then(f, () => {}); }, [ensure]);
  const pick = (i: number) => {
    setSel(i); setClimb(false);
    const first = dir === "up" ? ROOT : ROOT + ROWS[i].s, second = dir === "up" ? ROOT + ROWS[i].s : ROOT;
    run(() => seq.play(3, k => (k < 2 ? playNote(k ? second : first) : [playNote(ROOT), playNote(ROOT + ROWS[i].s)]), { gap: 0.6, hold: 0.9 }));
  };
  const climbAll = () => {
    if (seq.playing && climb) return seq.stop();
    setClimb(true);
    run(() => seq.play(ROWS.length, i => [playNote(ROOT), playNote(ROOT + ROWS[i].s)], { gap: 0.9, hold: 0.85 }));
  };

  const shown = climb && seq.step !== null ? seq.step : sel;
  const r = ROWS[shown], k = KIND[r.kind], pure = cents(r.ratio[0] / r.ratio[1]);
  const song = dir === "up" ? r.up : r.down;

  return (
    <Figure title={tx(t, "figMus_ilTitle", "The thirteen intervals of the octave")}
      head={<InstrumentChoice t={t} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_ilDir", "melody goes")}</span>
          <Choice value={dir} onChange={setDir} options={[["up", tx(t, "figMus_ilUp", "up")], ["down", tx(t, "figMus_ilDown", "down")]]} />
        </Row>
        <Row>
          <Readout color={k.color}>{abbr(r.q, r.n, t)} · {intervalName(t, r.q, r.n)}</Readout>
          <Readout>{r.s} {tx(t, "figMus_ilHalf", "half steps")} = {100 * r.s} ¢</Readout>
          <Readout>{tx(t, "figMus_ilPure", "pure")} {r.ratio[0]} : {r.ratio[1]} = {pure.toFixed(1)} ¢</Readout>
          <Readout color={k.color}>{tx(t, k.key, k.en)}</Readout>
        </Row>
        <Row>
          <Readout color={C.muted}>{tx(t, "figMus_ilSong", "starts like")}: {song ? tx(t, song[0], song[1]) : "—"}</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_ilNote", "Click a column to hear the interval as a melody, then as a chord. The greens are the perfect consonances (simplest ratios); the blues, the thirds and sixths, are the imperfect consonances, sweet but less still; the oranges are the dissonances, which want to move on. A tune you already know is the fastest way to recognise an interval by ear: sing its first two notes. Switch the melody to go down for tunes that start by falling.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          {[0, 6, 12].map(v => (
            <line key={v} x1={X0} x2={X1} y1={BASE - v * UNIT} y2={BASE - v * UNIT} stroke={C.grid} strokeDasharray={v ? "3 3" : undefined} />
          ))}
          {ROWS.map((row, i) => {
            const x = X0 + i * CW, h = Math.max(row.s * UNIT, 3), on = i === shown, color = KIND[row.kind].color;
            return (
              <g key={i} onClick={() => pick(i)} style={{ cursor: "pointer" }}>
                <rect x={x} y={8} width={CW} height={H - 10} fill="transparent" />
                <rect x={x + 5} y={BASE - h} width={CW - 10} height={h} rx={3} fill={color} fillOpacity={on ? 0.9 : 0.45} stroke={on ? C.fg : "none"} strokeWidth={1.5} />
                <T x={x + CW / 2} y={BASE - h - 5} anchor="middle" size={8} color={C.muted}>{row.s}</T>
                <T x={x + CW / 2} y={BASE + 16} anchor="middle" size={10} bold={on} color={on ? C.fg : C.muted}>{abbr(row.q, row.n, t)}</T>
                <T x={x + CW / 2} y={BASE + 30} anchor="middle" size={7.5} color={C.muted}>{row.ratio[0]}:{row.ratio[1]}</T>
              </g>
            );
          })}
          {(Object.keys(KIND) as Kind[]).map((kd, i) => (
            <g key={kd}>
              <rect x={X0 + i * 150} y={H - 14} width={10} height={10} rx={2} fill={KIND[kd].color} fillOpacity={0.8} />
              <T x={X0 + i * 150 + 15} y={H - 5} size={8.5} color={C.muted}>{tx(t, KIND[kd].key, KIND[kd].en)}</T>
            </g>
          ))}
        </svg>
        <div className="px-3 pb-3 flex flex-wrap items-center gap-3">
          <SoundButton on={seq.playing && climb} onClick={climbAll}>
            {seq.playing && climb ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_ilClimb", "play all thirteen as chords")}
          </SoundButton>
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{loadStatus(t, inst, load)}</span>}
        </div>
      </div>
    </Figure>
  );
}
