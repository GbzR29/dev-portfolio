"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { playTone } from "@/components/lesson/kit/audio/synth";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { useSequence } from "@/components/lesson/kit/audio/useSequence";

// ── What this figure shows ────────────────────────────────────────────────────
// Two ladders of six tones from 110 Hz: one adds 110 Hz per rung, the other
// doubles. Each rung is drawn twice: on a ruler in hertz (equal distances =
// equal differences) and on a ruler of pitch as the ear hears it (equal
// distances = equal ratios, so every octave is the same width). The adding
// ladder is even in hertz but its steps shrink to the ear; the doubling ladder
// explodes in hertz but climbs in equal steps to the ear.

const W = 600, H = 236, X0 = 30, X1 = 570;
const Y_LIN = 62, Y_LOG = 172;                             // the two rulers
const BASE = 110, RUNGS = 6;
const LIN_MAX = 3600;                                      // Hz at the right end of the hertz ruler
const LOG_MIN = 55, LOG_OCT = 6.25;                        // pitch ruler: 55 Hz plus 6.25 octaves (≈ 4.2 kHz)

type Kind = "add" | "mul";

const LADDER: Record<Kind, number[]> = {
  add: Array.from({ length: RUNGS }, (_, i) => BASE * (i + 1)),
  mul: Array.from({ length: RUNGS }, (_, i) => BASE * 2 ** i),
};

const xLin = (f: number) => X0 + (f / LIN_MAX) * (X1 - X0);
const xLog = (f: number) => X0 + (Math.log2(f / LOG_MIN) / LOG_OCT) * (X1 - X0);
/** High sine tones sound much louder than low ones at the same level: soften them a little. */
const levelOf = (f: number) => 0.3 / Math.max(1, Math.sqrt(f / 660));
const fmtRatio = (x: number) => `×${x.toFixed(x === Math.round(x) ? 0 : 2).replace(/0$/, "")}`;

export function MusicLadderFigure({ t }: { t?: TrackTranslations }) {
  const [kind, setKind] = useState<Kind>("add");
  const [sel, setSel] = useState<number | null>(null);
  const vis = useVisible<HTMLDivElement>();
  const seq = useSequence(vis.on);

  const freqs = LADDER[kind];
  const lit = sel ?? seq.step;                             // a clicked rung, else the one the ladder is playing
  const running = seq.playing && sel === null;

  const tone = (i: number) => playTone(freqs[i], { level: levelOf(freqs[i]), env: { attack: 0.02, decay: 0.05, sustain: 0.9, release: 0.12 } });
  const playLadder = () => {
    if (running) return seq.stop();
    startAudio();
    setSel(null);
    seq.play(RUNGS, tone, { gap: 0.55, hold: 0.5 });
  };
  const playRung = (i: number) => {
    startAudio();
    setSel(i);
    seq.play(1, () => tone(i), { hold: 0.7 });
  };
  const changeKind = (k: Kind) => { seq.stop(); setSel(null); setKind(k); };

  const step = lit !== null && lit > 0
    ? { diff: freqs[lit] - freqs[lit - 1], ratio: freqs[lit] / freqs[lit - 1] }
    : null;

  return (
    <Figure title={tx(t, "figMus_ladderTitle", "Adding hertz vs multiplying hertz")}
      head={<Choice value={kind} onChange={changeKind} options={[
        ["add", tx(t, "figMus_ladderAdd", "+110 Hz each rung")],
        ["mul", tx(t, "figMus_ladderMul", "×2 each rung")],
      ]} />}
      controls={<>
        <Row>
          {lit === null
            ? <Readout>{tx(t, "figMus_ladderPick", "play the ladder, or click a dot")}</Readout>
            : <Readout color="#f43f5e">{tx(t, "figMus_rung", "rung")} {lit + 1}: {freqs[lit]} Hz</Readout>}
          {step && <Readout>{tx(t, "figMus_fromPrev", "from the previous rung")}: +{step.diff} Hz = {fmtRatio(step.ratio)}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_ladderNote", "Play both ladders. The +110 Hz ladder is evenly spaced in hertz, yet its steps sound smaller and smaller: ×2, then ×1.5, ×1.33, ×1.25, ×1.2. The ×2 ladder runs off the hertz ruler, yet every step sounds the same size: one octave. Your ear measures ratios.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {/* hertz ruler */}
          <T x={X0} y={Y_LIN - 30} size={9.5} bold color={C.fg}>{tx(t, "figMus_rulerHz", "frequency in hertz: what a meter measures")}</T>
          <line x1={X0} x2={X1} y1={Y_LIN} y2={Y_LIN} stroke={C.axis} strokeWidth={1.5} />
          {[0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map(f => (
            <g key={f}>
              <line x1={xLin(f)} x2={xLin(f)} y1={Y_LIN - 4} y2={Y_LIN + 4} stroke={C.axis} />
              <T x={xLin(f)} y={Y_LIN + 15} anchor="middle" size={8}>{f}</T>
            </g>
          ))}
          {/* pitch ruler: one tick per octave of A */}
          <T x={X0} y={Y_LOG - 30} size={9.5} bold color={C.fg}>{tx(t, "figMus_rulerPitch", "pitch: what your ear hears (every octave the same width)")}</T>
          <line x1={X0} x2={X1} y1={Y_LOG} y2={Y_LOG} stroke={C.axis} strokeWidth={1.5} />
          {[55, 110, 220, 440, 880, 1760, 3520].map(f => (
            <g key={f}>
              <line x1={xLog(f)} x2={xLog(f)} y1={Y_LOG - 4} y2={Y_LOG + 4} stroke={C.axis} />
              <T x={xLog(f)} y={Y_LOG + 15} anchor="middle" size={8}>{f}</T>
            </g>
          ))}
          <T x={X1} y={Y_LOG + 28} anchor="end" size={8}>Hz</T>

          {/* the same rung on both rulers, joined */}
          {freqs.map((f, i) => (
            <line key={`j${f}`} x1={xLin(f)} y1={Y_LIN + 22} x2={xLog(f)} y2={Y_LOG - 20}
              stroke={i === lit ? "#f43f5e" : C.grid} strokeWidth={i === lit ? 1.4 : 1} />
          ))}
          {/* step sizes as the ear hears them */}
          {freqs.slice(1).map((f, i) => (
            <T key={`r${f}`} x={(xLog(f) + xLog(freqs[i])) / 2} y={Y_LOG - 9} anchor="middle" size={8}
              color={i + 1 === lit ? "#f43f5e" : C.purple} bold>{fmtRatio(f / freqs[i])}</T>
          ))}
          {freqs.map((f, i) => (
            <g key={`d${f}`} onClick={() => playRung(i)} style={{ cursor: "pointer" }}>
              {[[xLin(f), Y_LIN], [xLog(f), Y_LOG]].map(([x, y]) => (
                <g key={y}>
                  <circle cx={x} cy={y} r={12} fill="transparent" />
                  <circle cx={x} cy={y} r={i === lit ? 6.5 : 4.5} fill={i === lit ? "#f43f5e" : C.sky} stroke="var(--card)" strokeWidth={1.5} />
                </g>
              ))}
              {i === lit && <T x={xLin(f)} y={Y_LIN - 11} anchor="middle" size={9} bold color="#f43f5e">{f} Hz</T>}
            </g>
          ))}
        </svg>
        <div className="px-3 pb-3">
          <SoundButton on={running} onClick={playLadder}>
            {running ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_playLadder", "play the ladder")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
