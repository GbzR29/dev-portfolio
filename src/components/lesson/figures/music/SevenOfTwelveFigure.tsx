"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { isBlack, noteName } from "@/components/lesson/kit/audio/notes";
import { playNote } from "@/components/lesson/kit/audio/instrument";
import { loadStatus, useNotes } from "@/components/lesson/kit/audio/useInstrument";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { PianoKeyboard } from "@/components/lesson/kit/audio/PianoKeyboard";
import { euclid } from "./EuclidFigure";

// ── What this figure shows ────────────────────────────────────────────────────
// The twelve keys of an octave on a clock face, C at the top. A set of them is
// picked (the white keys to start); the gaps between neighbours are written
// round the outside, and the readouts count the steps of 2 and of 1 and check
// whether the set is spread as evenly as 12 allows (every "skip j notes" step
// takes at most two sizes, one apart). The white keys pass: they are the 7 in
// 12 of the last chapter's Euclidean rhythm. The black keys (5 in 12) pass
// too. Shifting the whole set moves it onto other keys, black ones included.

const W = 600, H = 236, CX = 124, CY = 118, R = 86;
const C4 = 60;

type Preset = [key: string, en: string, pcs: number[]];
const PRESETS: Preset[] = [
  ["figMus_s7White", "white keys", [0, 2, 4, 5, 7, 9, 11]],
  ["figMus_s7Black", "black keys", [1, 3, 6, 8, 10]],
  ["figMus_s7Euclid", "E(7,12)", euclid(12, 7).flatMap((x, p) => (x ? [p] : []))],
  ["figMus_s7Whole", "every other key", [0, 2, 4, 6, 8, 10]],
  ["figMus_s7Lump", "7 in a row", [0, 1, 2, 3, 4, 5, 6]],
];

const gapsOf = (ps: number[]) => ps.map((p, i) => (i + 1 < ps.length ? ps[i + 1] : ps[0] + 12) - p);

/** Spread as evenly as possible: for every j, the steps that skip j notes take at most two sizes, one apart. */
function maximallyEven(ps: number[]) {
  const k = ps.length;
  if (k < 2) return true;
  return Array.from({ length: k - 1 }, (_, j) => j + 1).every(j => {
    const sizes = ps.map((p, i) => (ps[(i + j) % k] - p + 12) % 12);
    return Math.max(...sizes) - Math.min(...sizes) <= 1;
  });
}

export function MusicSevenOfTwelveFigure({ t }: { t?: TrackTranslations }) {
  const [set, setSet] = useState<number[]>(PRESETS[0][2]);
  const { inst, load, ensure } = useNotes();
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const ps = [...set].sort((a, b) => a - b), gaps = gapsOf(ps), k = ps.length;
  const twos = gaps.filter(g => g === 2).length, ones = gaps.filter(g => g === 1).length;
  const even = maximallyEven(ps), named = PRESETS.find(p => p[2].length === k && p[2].every(x => ps.includes(x)));
  const toggle = (p: number) => setSet(s => (s.includes(p) ? s.filter(x => x !== p) : [...s, p]));
  const shift = (d: number) => setSet(s => s.map(p => (p + d + 12) % 12));
  const ang = (p: number) => -Math.PI / 2 + (2 * Math.PI * p) / 12;
  const pt = (p: number, rad = R) => [CX + rad * Math.cos(ang(p)), CY + rad * Math.sin(ang(p))] as const;
  const scale = [...ps.map(p => C4 + p), ...(ps.includes(0) ? [C4 + 12] : [])];
  const lit = seq.step !== null ? scale[seq.step] : null;

  const play = async () => {
    startAudio();
    if (seq.playing) { seq.stop(); return; }
    try { await ensure(); } catch { return; }
    seq.play(scale.length, i => playNote(scale[i], { velocity: 0.6 }), { gap: 0.36, hold: 0.5 });
  };

  return (
    <Figure title={tx(t, "figMus_s7Title", "Why 7 white keys and 5 black ones")}
      controls={<>
        <Row>
          {PRESETS.map(p => <Btn key={p[0]} active={named === p} onClick={() => setSet(p[2])}>{tx(t, p[0], p[1])}</Btn>)}
          <Btn onClick={() => shift(-1)}>− 1</Btn>
          <Btn onClick={() => shift(1)}>+ 1</Btn>
        </Row>
        <Row>
          <Readout color={C.amber}>{k} {tx(t, "figMus_s7Notes", "notes")}: {tx(t, "figMus_s7Gaps", "gaps")} {gaps.join(" ")}</Readout>
          <Readout>{twos} × 2 + {ones} × 1{gaps.some(g => g > 2) ? " + …" : ""} = {gaps.reduce((s, g) => s + g, 0)}</Readout>
          <Readout color={even ? C.green : C.muted}>{even ? tx(t, "figMus_s7Even", "spread as evenly as possible ✓") : tx(t, "figMus_s7NotEven", "not evenly spread")}</Readout>
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_s7Note", "Start with the white keys and read the gaps round the clock from C: 2 2 1 2 2 2 1. Five gaps of 2, each with a black key inside it, and two gaps of 1, E–F and B–C, with none. Try \"7 in a row\" and play it: the same number of notes, bunched up, and it sounds like nothing in particular. E(7,12), the West African bell of the last chapter, is the white-key pattern started on F. Then use + 1 to shift the white keys up a step: the pattern stays and moves onto black keys, which is the next chapters' story. Click the clock to build any set.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.grid} strokeWidth={1.5} />
          {k > 1 && <polygon points={ps.map(p => pt(p).join(",")).join(" ")} fill={C.amber} fillOpacity={0.12} stroke={C.amber} strokeWidth={1.6} />}
          {ps.map((p, i) => {
            const [x, y] = pt(p + gaps[i] / 2, R + 17);
            return <T key={p} x={x} y={y + 4} anchor="middle" size={11} bold color={gaps[i] === 1 ? C.sky : C.amber}>{gaps[i]}</T>;
          })}
          {Array.from({ length: 12 }, (_, p) => {
            const [x, y] = pt(p), on = ps.includes(p), black = isBlack(p), [lx, ly] = pt(p, R - 24), here = lit !== null && lit % 12 === p;
            return (
              <g key={p} onClick={() => toggle(p)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={13} fill="transparent" />
                <circle cx={x} cy={y} r={(on ? 9 : 6) + (here ? 3 : 0)} fill={on ? C.amber : black ? "#1f2326" : "#fbfbf8"} stroke={here ? C.fg : C.axis} strokeWidth={here ? 2 : 1} />
                <T x={lx} y={ly + 3.5} anchor="middle" size={9.5} bold={on} color={on ? C.fg : C.muted}>{noteName(p, { withOctave: false })}</T>
              </g>
            );
          })}

          {/* the gaps as a row of steps */}
          <T x={262} y={44} size={10} color={C.muted}>{tx(t, "figMus_s7Row", "the steps, from the lowest note round to the octave")}</T>
          {gaps.map((g, i) => {
            const x0 = 262 + gaps.slice(0, i).reduce((s, x) => s + x, 0) * 26;
            return (
              <g key={i}>
                <rect x={x0 + 1.5} y={56} width={g * 26 - 3} height={28} rx={5} fill={g === 1 ? C.sky : C.amber} opacity={0.75} />
                <T x={x0 + (g * 26) / 2} y={75} anchor="middle" size={12} bold color={C.fg}>{g}</T>
              </g>
            );
          })}
          <T x={262} y={112} size={10} color={C.amber}>2 = {tx(t, "figMus_s7Whole2", "whole step (a key skipped)")}</T>
          <T x={262} y={130} size={10} color={C.sky}>1 = {tx(t, "figMus_s7Half1", "half step (next key)")}</T>
          <T x={262} y={160} size={10} color={C.fg}>{tx(t, "figMus_s7Sum", "the steps add up to")} 12 = {tx(t, "figMus_s7Octave", "one octave")}</T>
        </svg>
        <div className="px-3 pb-2 max-w-xs">
          <PianoKeyboard lo={C4} hi={C4 + 12} pressed={new Set(lit !== null ? [lit] : scale)} onDown={() => {}} onUp={() => {}}
            labelOf={m => noteName(m, { withOctave: false })} color={lit !== null ? C.green : C.amber}
            ariaLabel={tx(t, "figMus_s7Aria", "one octave showing the chosen keys")} />
        </div>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={seq.playing} onClick={play}>
            {seq.playing ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_s7Play", "play them, low to high")}
          </SoundButton>
          {load === "loading" && <span className="text-[11px] font-mono text-[var(--text-muted)]">{loadStatus(t, inst, load)}</span>}
        </div>
      </div>
    </Figure>
  );
}
