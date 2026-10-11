"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { playTone } from "@/components/lesson/kit/audio/synth";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";

// ── What this figure shows ────────────────────────────────────────────────────
// Measure your own equal-loudness curve. A 1000 Hz reference tone and a test
// tone take turns; the reader turns the test tone up or down until both sound
// equally loud, for each of six test frequencies. Their settings (dB above or
// below the reference) are the dots; the dashed curve is the standard one for
// a quiet tone (the 40-phon contour of ISO 226:2003, shifted so 1000 Hz is
// 0 dB). Low tones need far more level to sound as loud; 2–5 kHz needs less.
// Small speakers barely make 125 Hz, so the reader's low dots climb higher.

const W = 600, H = 250, X0 = 44, X1 = 584, Y0 = 18, Y1 = 206;
const DB_LO = -15, DB_HI = 30;                              // slider range, dB relative to 1000 Hz
const PLOT_HI = 40;                                         // the plot reaches higher, for the curve
const F_LO = 50, F_HI = 12500;
const REF = 0.03;                                           // reference amplitude: +30 dB still fits under 1
const TESTS = [125, 250, 500, 2000, 4000, 8000];

/** ISO 226:2003, 40 phon: the level (dB SPL) that sounds as loud as 40 dB at 1000 Hz. */
const ISO40: [number, number][] = [
  [20, 99.85], [25, 93.94], [31.5, 88.17], [40, 82.63], [50, 77.78], [63, 73.08], [80, 68.48], [100, 64.37],
  [125, 60.59], [160, 56.7], [200, 53.41], [250, 50.4], [315, 47.58], [400, 44.98], [500, 43.05], [630, 41.34],
  [800, 40.06], [1000, 40.01], [1250, 41.82], [1600, 42.51], [2000, 39.23], [2500, 36.51], [3150, 35.61],
  [4000, 36.65], [5000, 40.01], [6300, 45.83], [8000, 51.8], [10000, 54.28], [12500, 51.49],
];
const isoAt = (f: number) => ISO40.find(([g]) => g === f)![1] - 40;

const xOf = (f: number) => X0 + (Math.log10(f / F_LO) / Math.log10(F_HI / F_LO)) * (X1 - X0);
const yOf = (db: number) => Y0 + ((PLOT_HI - Math.min(PLOT_HI, Math.max(DB_LO, db))) / (PLOT_HI - DB_LO)) * (Y1 - Y0);
const isoPath = ISO40.filter(([g]) => g >= F_LO).map(([f, l], i) => `${i ? "L" : "M"}${xOf(f).toFixed(1)},${yOf(l - 40).toFixed(1)}`).join("");

const ENV = { attack: 0.04, decay: 0.05, sustain: 1, release: 0.06 };
const PAIRS = 4;                                            // reference/test alternations per press

export function MusicEqualLoudnessFigure({ t }: { t?: TrackTranslations }) {
  const [test, setTest] = useState(1);                      // index into TESTS
  const [gains, setGains] = useState<number[]>(() => TESTS.map(() => 0));
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);
  const gain = useRef(0);                                   // the sequence reads the slider live
  useEffect(() => { gain.current = gains[test]; }, [gains, test]);

  const f = TESTS[test];
  const compare = () => {
    if (seq.playing) return seq.stop();
    startAudio();
    seq.play(2 * PAIRS, i => i % 2 === 0
      ? playTone(1000, { level: REF, env: ENV })
      : playTone(f, { level: REF * 10 ** (gain.current / 20), env: ENV }), { gap: 0.7, hold: 0.55 });
  };
  const pick = (i: number) => { seq.stop(); setTest(i); };
  const setGain = (g: number) => setGains(gs => gs.map((x, i) => (i === test ? g : x)));

  const testing = seq.playing ? (seq.step! % 2 === 0 ? "ref" : "test") : null;

  return (
    <Figure title={tx(t, "figMus_elTitle", "Measure your own equal-loudness curve")}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_elTest", "test tone:")}</span>
          {TESTS.map((g, i) => <Btn key={g} active={i === test} onClick={() => pick(i)}>{g} Hz</Btn>)}
        </Row>
        <Slider label={`${f} Hz ${tx(t, "figMus_elLevel", "level vs 1000 Hz")}`} value={gains[test]} min={DB_LO} max={DB_HI} step={0.5}
          onChange={setGain} fmt={v => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`} width="w-40" />
        <Row>
          <Readout color="#f43f5e">{tx(t, "figMus_elYours", "yours")}: {gains[test] > 0 ? "+" : ""}{gains[test].toFixed(1)} dB</Readout>
          <Readout color={C.purple}>{tx(t, "figMus_elStandard", "standard ear")}: {isoAt(f) > 0 ? "+" : ""}{isoAt(f).toFixed(1)} dB</Readout>
          {testing && <Readout>{testing === "ref" ? tx(t, "figMus_elNowRef", "now: 1000 Hz reference") : `${tx(t, "figMus_elNowTest", "now: test tone")} ${f} Hz`}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_elNote", "Press compare: the 1000 Hz reference and the test tone take turns. Move the slider until the two sound equally loud, then pick the next test tone. Use headphones if you can: laptop and phone speakers hardly make 125 Hz, so your low dots will land above the curve. That is the speaker, not your ear.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {[-10, 0, 10, 20, 30, 40].map(db => (
            <g key={db}>
              <line x1={X0} x2={X1} y1={yOf(db)} y2={yOf(db)} stroke={db === 0 ? C.axis : C.grid} />
              <T x={X0 - 5} y={yOf(db) + 3} anchor="end" size={8}>{db > 0 ? `+${db}` : db}</T>
            </g>
          ))}
          {[63, 125, 250, 500, 1000, 2000, 4000, 8000].map(g => (
            <g key={g}>
              <line x1={xOf(g)} x2={xOf(g)} y1={Y0} y2={Y1} stroke={C.grid} opacity={0.6} />
              <T x={xOf(g)} y={Y1 + 13} anchor="middle" size={8}>{g >= 1000 ? `${g / 1000}k` : g}</T>
            </g>
          ))}
          <T x={X1} y={Y1 + 28} anchor="end" size={8}>{tx(t, "figMus_elAxisF", "frequency (Hz)")}</T>
          <T x={X0} y={Y1 + 28} size={8}>{tx(t, "figMus_elAxisDb", "dB needed to sound as loud as 1000 Hz")}</T>
          <path d={isoPath} fill="none" stroke={C.purple} strokeWidth={1.6} strokeDasharray="5 4" />
          <T x={xOf(315) + 6} y={yOf(isoAt(315)) - 8} size={8.5} color={C.purple} bold>{tx(t, "figMus_elCurve", "standard ear")}</T>
          {/* the reference itself */}
          <circle cx={xOf(1000)} cy={yOf(0)} r={5} fill={C.amber} stroke="var(--card)" strokeWidth={1.5} />
          <T x={xOf(1000)} y={yOf(0) + 16} anchor="middle" size={8} color={C.amber} bold>{tx(t, "figMus_elRef", "reference")}</T>
          {gains.map((g, i) => (
            <g key={TESTS[i]} onClick={() => pick(i)} style={{ cursor: "pointer" }}>
              <line x1={xOf(TESTS[i])} x2={xOf(TESTS[i])} y1={yOf(g)} y2={yOf(isoAt(TESTS[i]))} stroke="#f43f5e" strokeOpacity={0.35} strokeDasharray="2 3" />
              <circle cx={xOf(TESTS[i])} cy={yOf(g)} r={12} fill="transparent" />
              <circle cx={xOf(TESTS[i])} cy={yOf(g)} r={i === test ? 6.5 : 4.5} fill="#f43f5e" fillOpacity={i === test ? 1 : 0.7} stroke="var(--card)" strokeWidth={1.5} />
            </g>
          ))}
        </svg>
        <div className="px-3 pb-3">
          <SoundButton on={seq.playing} onClick={compare}>
            {seq.playing ? tx(t, "figMus_stop", "stop") : `${tx(t, "figMus_elCompare", "compare")}: 1000 Hz ↔ ${f} Hz`}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
