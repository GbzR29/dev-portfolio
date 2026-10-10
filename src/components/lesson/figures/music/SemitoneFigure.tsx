"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { noteName } from "@/components/lesson/kit/audio/notes";
import { playTone } from "@/components/lesson/kit/audio/synth";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// The octave from A3 (220 Hz) to A4 (440 Hz) cut into 12 steps in two ways:
//   equal ratios       f_i = 220 · 2^(i/12)   (the piano's semitones)
//   equal differences  f_i = 220 + i · 220/12
// Top: the 13 frequencies in hertz. Bottom: the size of every step as the ear
// hears it, in semitones, 12 · log2(f_i / f_(i−1)). Equal ratios give 12 equal
// heard steps whose hertz gaps grow; equal differences give equal hertz gaps
// whose heard steps shrink from 1.39 to 0.74 semitones.

const W = 600, H = 278, X0 = 70, X1 = 574;
const F_LO = 200, F_HI = 450, Y_LO = 178, Y_HI = 28;       // hertz axis of the top chart
const STRIP = 252, UNIT = 24;                              // bottom strip baseline; px per semitone
const STEPS = 12, BASE = 220;
const ROOT = 57;                                           // A3 as a MIDI number

type Mode = "ratio" | "diff";

const freqsOf = (mode: Mode) => Array.from({ length: STEPS + 1 }, (_, i) =>
  mode === "ratio" ? BASE * 2 ** (i / STEPS) : BASE + (i * BASE) / STEPS);

const xOf = (i: number) => X0 + (i / STEPS) * (X1 - X0);
const yOf = (f: number) => Y_LO + ((f - F_LO) / (F_HI - F_LO)) * (Y_HI - Y_LO);
const semis = (a: number, b: number) => 12 * Math.log2(b / a);

export function MusicSemitoneFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("ratio");
  const [sel, setSel] = useState<number | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const freqs = freqsOf(mode);
  const lit = sel ?? seq.step;                             // a clicked step, else the one the run is playing
  const running = seq.playing && sel === null;

  const tone = (i: number) => playTone(freqs[i], { level: 0.3, env: { attack: 0.015, decay: 0.05, sustain: 0.85, release: 0.1 } });
  const playRun = () => {
    if (running) return seq.stop();
    startAudio();
    setSel(null);
    seq.play(STEPS + 1, tone, { gap: 0.34, hold: 0.31 });
  };
  const playStep = (i: number) => { startAudio(); setSel(i); seq.play(1, () => tone(i), { hold: 0.7 }); };
  const changeMode = (m: Mode) => { seq.stop(); setSel(null); setMode(m); };

  const f = lit !== null ? freqs[lit] : null;
  const how = lit === null ? ""
    : mode === "ratio" ? `${noteName(ROOT + lit)} = 220 × 1.0595^${lit} = ${f!.toFixed(2)} Hz`
    : `220 + ${lit} × 18.33 = ${f!.toFixed(2)} Hz`;

  return (
    <Figure title={tx(t, "figMus_semiTitle", "Twelve steps from A3 to A4")}
      head={<Choice value={mode} onChange={changeMode} options={[
        ["ratio", tx(t, "figMus_semiRatio", "equal ratios ×1.0595")],
        ["diff", tx(t, "figMus_semiDiff", "equal gaps +18.33 Hz")],
      ]} />}
      controls={<>
        <Row>
          {lit === null
            ? <Readout>{tx(t, "figMus_semiPick", "play the run, or click a step")}</Readout>
            : <Readout color="#f43f5e">{how}</Readout>}
          {lit !== null && lit > 0 && (
            <Readout>
              {tx(t, "figMus_semiStep", "step")}: +{(freqs[lit] - freqs[lit - 1]).toFixed(2)} Hz = {semis(freqs[lit - 1], freqs[lit]).toFixed(2)} {tx(t, "figMus_semitones", "semitones")}
            </Readout>
          )}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_semiNote", "Play both runs. With equal ratios every step sounds the same size, even though the gaps in hertz grow from 13.1 to 24.7 Hz. With equal gaps in hertz, the first steps sound too big and the last ones too small: the bottom bars shrink from 1.39 to 0.74 of a semitone.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {/* hertz axis */}
          {[220, 330, 440].map(hz => (
            <g key={hz}>
              <line x1={X0 - 8} x2={X1} y1={yOf(hz)} y2={yOf(hz)} stroke={C.grid} />
              <T x={X0 - 12} y={yOf(hz) + 3} anchor="end" size={8}>{hz} Hz</T>
            </g>
          ))}
          {/* the 13 tones */}
          {freqs.map((hz, i) => {
            const x = xOf(i), on = i === lit;
            return (
              <g key={i} onClick={() => playStep(i)} style={{ cursor: "pointer" }}>
                <rect x={x - 18} y={Y_HI - 14} width={36} height={Y_LO - Y_HI + 30} fill="transparent" />
                <line x1={x} x2={x} y1={yOf(F_LO)} y2={yOf(hz)} stroke={on ? "#f43f5e" : C.sky} strokeWidth={on ? 4 : 3} strokeLinecap="round" />
                <circle cx={x} cy={yOf(hz)} r={on ? 5 : 3.5} fill={on ? "#f43f5e" : C.sky} />
                <T x={x} y={yOf(hz) - 8} anchor="middle" size={7.5} color={on ? "#f43f5e" : C.muted} bold={on}>{hz.toFixed(0)}</T>
                {mode === "ratio" && <T x={x} y={Y_LO + 14} anchor="middle" size={8.5} color={on ? "#f43f5e" : C.fg}>{noteName(ROOT + i)}</T>}
              </g>
            );
          })}
          {/* how big each step sounds */}
          <T x={4} y={STRIP - UNIT - 20} size={8} bold color={C.purple}>{tx(t, "figMus_semiHeard", "step as")}</T>
          <T x={4} y={STRIP - UNIT - 10} size={8} bold color={C.purple}>{tx(t, "figMus_semiHeard2", "heard")}</T>
          <line x1={X0 - 8} x2={X1} y1={STRIP} y2={STRIP} stroke={C.axis} />
          <line x1={X0 - 8} x2={X1} y1={STRIP - UNIT} y2={STRIP - UNIT} stroke={C.purple} strokeDasharray="3 3" />
          <T x={X0 - 12} y={STRIP - UNIT + 3} anchor="end" size={7.5} color={C.purple}>{tx(t, "figMus_oneSemi", "1 semitone")}</T>
          {freqs.slice(1).map((hz, k) => {
            const i = k + 1, x = (xOf(i - 1) + xOf(i)) / 2, h = semis(freqs[k], hz) * UNIT, on = i === lit;
            return (
              <g key={i}>
                <rect x={x - 9} y={STRIP - h} width={18} height={h} rx={2} fill={on ? "#f43f5e" : C.purple} fillOpacity={on ? 0.85 : 0.45} />
                <T x={x} y={STRIP + 11} anchor="middle" size={7} color={on ? "#f43f5e" : C.muted}>+{(hz - freqs[k]).toFixed(1)}</T>
              </g>
            );
          })}
        </svg>
        <div className="px-3 pb-3">
          <SoundButton on={running} onClick={playRun}>
            {running ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_playRun", "play the 13 notes")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
