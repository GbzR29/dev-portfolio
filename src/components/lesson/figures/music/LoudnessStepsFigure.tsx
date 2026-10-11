"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { playTone } from "@/components/lesson/kit/audio/synth";
import { playPiano, pianoReady } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";

// ── What this figure shows ────────────────────────────────────────────────────
// Seven tones that get louder, built two ways. "Equal amplitude steps" adds
// the same pressure swing each time (1/7, 2/7 … 7/7 of the top); "equal dB
// steps" multiplies it by 2 each time (+6 dB). Each step is drawn twice: as a
// bar of amplitude (what a meter measures) and on a decibel ruler (equal
// distances = equal ratios, roughly what the ear hears). The amplitude ladder
// is even on the meter but sounds like one big jump and then almost nothing;
// the dB ladder sounds even. The piano plays the seven dynamics ppp … ff,
// also 6 dB apart.

const W = 600, H = 250, X0 = 40, X1 = 580;
const N = 7, TOP = 0.5;                                     // steps; amplitude of the loudest tone
const BAR_TOP = 30, BAR_BOT = 116;                          // amplitude panel
const RULER_Y = 196, DB_MIN = -40;                          // decibel ruler, −40 … 0 dB
const SLOT = (X1 - X0) / N;
const PIANO_KEY = 60;                                       // C4

type Kind = "lin" | "db" | "piano";

/** The amplitude of each step, as a fraction of the top one. */
const STEPS: Record<Kind, number[]> = {
  lin: Array.from({ length: N }, (_, i) => (i + 1) / N),
  db: Array.from({ length: N }, (_, i) => 2 ** (i - (N - 1))),
  piano: Array.from({ length: N }, (_, i) => 2 ** (i - (N - 1))),
};
const DYNAMICS = ["ppp", "pp", "p", "mp", "mf", "f", "ff"];

const dbOf = (a: number) => 20 * Math.log10(a);
const xRuler = (db: number) => X0 + ((db - DB_MIN) / -DB_MIN) * (X1 - X0);

export function MusicLoudnessStepsFigure({ t }: { t?: TrackTranslations }) {
  const [kind, setKind] = useState<Kind>("lin");
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);
  const piano = usePiano();
  const amps = STEPS[kind];

  // playPiano's gain is velocity², so velocity = √amplitude gives the wanted amplitude
  const make = (i: number) => kind === "piano"
    ? playPiano(PIANO_KEY, { velocity: Math.sqrt(amps[i]) })
    : playTone(440, { level: TOP * amps[i], env: { attack: 0.02, decay: 0.05, sustain: 1, release: 0.1 } });
  const run = () => {
    if (seq.playing) return seq.stop();
    startAudio();
    if (kind === "piano" && !pianoReady()) { piano.ensure().then(() => seq.play(N, make, { gap: 0.7, hold: 0.65 }), () => {}); return; }
    seq.play(N, make, { gap: 0.7, hold: 0.6 });
  };
  const playOne = (i: number) => {
    startAudio();
    if (kind === "piano" && !pianoReady()) { piano.ensure().catch(() => {}); return; }
    seq.play(1, () => make(i), { hold: 0.8 });
  };
  const change = (k: Kind) => { seq.stop(); setKind(k); if (k === "piano") piano.ensure().catch(() => {}); };

  const lit = seq.step;
  const label = (i: number) => kind === "piano" ? DYNAMICS[i] : `${i + 1}`;

  return (
    <Figure title={tx(t, "figMus_lsTitle", "Even steps for the meter, even steps for the ear")}
      head={<Choice value={kind} onChange={change} options={[
        ["lin", tx(t, "figMus_lsLin", "+ same amplitude")],
        ["db", tx(t, "figMus_lsDb", "× 2 (+6 dB)")],
        ["piano", tx(t, "figMus_lsPiano", "🎹 ppp → ff")],
      ]} />}
      controls={<>
        <Row>
          {lit === null
            ? <Readout>{tx(t, "figMus_lsPick", "play the steps, or click a bar")}</Readout>
            : <Readout color="#f43f5e">{label(lit)}: {tx(t, "figMus_lsAmp", "amplitude")} {amps[lit].toFixed(3)} · {dbOf(amps[lit]).toFixed(1)} dB</Readout>}
          {lit !== null && lit > 0 && <Readout>{tx(t, "figMus_lsStep", "from the previous step")}: ×{(amps[lit] / amps[lit - 1]).toFixed(2)} = +{(dbOf(amps[lit]) - dbOf(amps[lit - 1])).toFixed(1)} dB</Readout>}
          {kind === "piano" && piano.load === "loading" && <Readout>{tx(t, "figMus_loading", "loading the piano (1.3 MB)…")}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_lsNote", "Play \"+ same amplitude\": the first step is a huge jump (×2), the last ones barely change anything (×1.17). Then play \"× 2\": the amplitude bars explode, yet every step sounds about the same size. The piano's dynamics ppp to ff are spaced the same way. (These recordings were made at one strength and simply turned down; a real piano struck harder also gets brighter.)")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          <T x={X0} y={BAR_TOP - 12} size={9.5} bold color={C.fg}>{tx(t, "figMus_lsBars", "amplitude: the pressure swing a meter measures")}</T>
          <line x1={X0} x2={X1} y1={BAR_BOT} y2={BAR_BOT} stroke={C.axis} />
          {amps.map((a, i) => {
            const x = X0 + SLOT * i, h = a * (BAR_BOT - BAR_TOP), on = i === lit;
            return (
              <g key={i} onClick={() => playOne(i)} style={{ cursor: "pointer" }}>
                <rect x={x + 6} y={BAR_TOP} width={SLOT - 12} height={BAR_BOT - BAR_TOP} rx={3} fill={C.grid} opacity={0.3} />
                <rect x={x + 6} y={BAR_BOT - h} width={SLOT - 12} height={Math.max(h, 1)} rx={3} fill={on ? "#f43f5e" : C.sky} fillOpacity={on ? 1 : 0.8} />
                <T x={x + SLOT / 2} y={BAR_BOT + 13} anchor="middle" size={9.5} bold color={on ? "#f43f5e" : C.fg}>{label(i)}</T>
              </g>
            );
          })}

          <T x={X0} y={RULER_Y - 38} size={9.5} bold color={C.fg}>{tx(t, "figMus_lsRuler", "level in decibels: closer to what the ear hears")}</T>
          <line x1={X0} x2={X1} y1={RULER_Y} y2={RULER_Y} stroke={C.axis} strokeWidth={1.5} />
          {[-40, -30, -20, -10, 0].map(db => (
            <g key={db}>
              <line x1={xRuler(db)} x2={xRuler(db)} y1={RULER_Y - 4} y2={RULER_Y + 4} stroke={C.axis} />
              <T x={xRuler(db)} y={RULER_Y + 16} anchor="middle" size={8}>{db === 0 ? "0 dB" : db}</T>
            </g>
          ))}
          {amps.slice(1).map((a, i) => (
            <T key={`s${i}`} x={(xRuler(dbOf(a)) + xRuler(dbOf(amps[i]))) / 2} y={RULER_Y - 10} anchor="middle" size={8}
              bold color={i + 1 === lit ? "#f43f5e" : C.purple}>+{(dbOf(a) - dbOf(amps[i])).toFixed(1)}</T>
          ))}
          {amps.map((a, i) => (
            <g key={`d${i}`} onClick={() => playOne(i)} style={{ cursor: "pointer" }}>
              <circle cx={xRuler(dbOf(a))} cy={RULER_Y} r={11} fill="transparent" />
              <circle cx={xRuler(dbOf(a))} cy={RULER_Y} r={i === lit ? 6.5 : 4.5} fill={i === lit ? "#f43f5e" : C.sky} stroke="var(--card)" strokeWidth={1.5} />
            </g>
          ))}
          <T x={X0} y={RULER_Y + 34} size={8}>{tx(t, "figMus_lsRulerNote", "0 dB = the loudest step; every −6 dB halves the amplitude")}</T>
        </svg>
        <div className="px-3 pb-3">
          <SoundButton on={seq.playing} onClick={run}>
            {seq.playing ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_lsPlay", "play the seven steps")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
