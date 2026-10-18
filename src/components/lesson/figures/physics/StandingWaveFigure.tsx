"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { playTone, type ToneVoice } from "@/components/lesson/kit/audio/synth";

// ── What this figure shows ────────────────────────────────────────────────────
// A guitar-like string, L = 0.65 m, tied at the right end, with waves at
// v = 286 m/s, so its fundamental is f₁ = v/2L = 220 Hz. A small shaker
// wiggles the left end at the frequency f on the slider. The steady shape
// (the exact solution for a string with one end driven, with a touch of
// damping so the peaks stay finite) is
//   y(x, t) = a sin(k(L − x)) / √(sin²(kL) + ε²) · sin ωt,   k = 2πf / v.
// When kL = nπ, that is f = n v / 2L, the denominator nearly vanishes and the
// string swings hugely: a standing wave with n loops. Between those, the
// string barely moves. The motion is shown slowed down to about one cycle
// per second, whatever f is; "listen" plays the real tone at f.
// "show the two travelling waves" draws the same shape as the sum of a wave
// going right and its reflection going left (each half the size).

const W = 560, H = 250;
const LEN = 0.65, V = 286, EPS = 0.03, A_DRV = 1.6;   // A_DRV: driver amplitude (px)
const X0 = 40, X1 = 520, YM = 118, CAP = 70;

export function StandingWaveFigure({ t }: { t?: TrackTranslations }) {
  const [f, setF] = useState(220);
  const [parts, setParts] = useState(false);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [sound, setSound] = useState(false);
  const voice = useRef<ToneVoice | null>(null);
  const vis = useVisible<HTMLDivElement>();

  useFrame(playing && vis.on, dt => setPhase(p => (p + dt * 2 * Math.PI * 0.9) % (2 * Math.PI)));

  // the tone follows the slider and stops off screen or on unmount
  useEffect(() => { voice.current?.setFreq(f); }, [f]);
  useEffect(() => { if (!vis.on && voice.current) { voice.current.stop(); voice.current = null; setSound(false); } }, [vis.on]);
  useEffect(() => () => voice.current?.stop(), []);
  const toggleSound = () => {
    if (voice.current) { voice.current.stop(); voice.current = null; setSound(false); return; }
    startAudio();
    voice.current = playTone(f, { wave: "sine", level: 0.25 });
    setSound(true);
  };

  const k = (2 * Math.PI * f) / V, D = Math.sqrt(Math.sin(k * LEN) ** 2 + EPS * EPS);
  const gain = Math.min(CAP / A_DRV, 1 / D);
  const f1 = V / (2 * LEN), nNear = Math.max(1, Math.round(f / f1)), lam = V / f;
  const onPeak = Math.abs(f - nNear * f1) < f1 * 0.012;
  const px = (x: number) => X0 + (x / LEN) * (X1 - X0);
  const shape = (x: number) => A_DRV * gain * Math.sin(k * (LEN - x));
  const path = (y: (x: number) => number) => Array.from({ length: 301 }, (_, i) => {
    const x = (LEN * i) / 300; return `${i ? "L" : "M"}${px(x).toFixed(1)},${(YM - y(x)).toFixed(1)}`;
  }).join("");
  const now = (x: number) => shape(x) * Math.sin(phase);
  // sin(k(L−x)) sin ωt = ½[cos(k(L−x) − ωt) − cos(k(L−x) + ωt)]: the first moves left, the second right
  const half = A_DRV * gain * 0.5;
  const leftGoing = (x: number) => half * Math.cos(k * (LEN - x) - phase);
  const rightGoing = (x: number) => -half * Math.cos(k * (LEN - x) + phase);

  // nodes: where sin(k(L − x)) = 0, i.e. x = L − mλ/2, shown when a standing wave is clear
  const nodes: number[] = [];
  if (onPeak) for (let m = 0; m <= nNear; m++) nodes.push(LEN - (m * LEN) / nNear);

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={X0} y1={YM} x2={X1} y2={YM} stroke={C.grid} strokeDasharray="3 4" />
      <rect x={X0 - 18} y={YM - 14 + A_DRV * Math.sin(phase)} width={14} height={28} rx={2} fill={C.purple} opacity={0.75} />
      <T x={X0 - 11} y={YM + 34} anchor="middle" color={C.purple} size={8}>{tx(t, "figPhStand_shaker", "shaker")}</T>
      <line x1={X1} y1={YM - 80} x2={X1} y2={YM + 80} stroke={C.fg} strokeWidth={3} />
      <path d={path(x => shape(x))} fill="none" stroke={C.sky} strokeWidth={1} opacity={0.25} />
      <path d={path(x => -shape(x))} fill="none" stroke={C.sky} strokeWidth={1} opacity={0.25} />
      {parts && <>
        <path d={path(leftGoing)} fill="none" stroke={C.pink} strokeWidth={1.3} strokeDasharray="5 3" opacity={0.85} />
        <path d={path(rightGoing)} fill="none" stroke={C.amber} strokeWidth={1.3} strokeDasharray="5 3" opacity={0.85} />
      </>}
      <path d={path(now)} fill="none" stroke={C.sky} strokeWidth={2.4} />
      {nodes.map((x, i) => <circle key={i} cx={px(x)} cy={YM} r={4} fill={C.green} />)}
      {onPeak && <T x={X0} y={22} color={C.green} size={9} bold>{`${tx(t, "figPhStand_harm", "harmonic")} n = ${nNear}: ${nNear} ${nNear === 1 ? tx(t, "figPhStand_loop", "loop") : tx(t, "figPhStand_loops", "loops")}, ${nodes.length} ${tx(t, "figPhStand_nodes", "nodes (green)")}`}</T>}
      {!onPeak && <T x={X0} y={22} color={C.muted} size={9}>{tx(t, "figPhStand_off", "between harmonics: the reflections do not line up, the string barely moves")}</T>}
      {parts && <T x={X1} y={H - 30} anchor="end" color={C.pink} size={8}>{tx(t, "figPhStand_left", "reflected wave, moving left")}</T>}
      {parts && <T x={X1} y={H - 16} anchor="end" color={C.amber} size={8}>{tx(t, "figPhStand_right", "wave from the shaker, moving right")}</T>}
      <T x={X0} y={H - 16} color={C.muted} size={8}>{tx(t, "figPhStand_slow", "slowed down to about one cycle per second")}</T>
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhStand_title", "Standing waves on a string")}
      head={<Btn active={parts} onClick={() => setParts(p => !p)}>{tx(t, "figPhStand_parts", "show the two travelling waves")}</Btn>}
      controls={<>
        <Slider label={tx(t, "figPhStand_f", "shaker frequency f")} value={f} min={60} max={1150} step={1} onChange={setF} fmt={v => `${v} Hz`} width="w-36" />
        <Row>
          {[1, 2, 3, 4, 5].map(n => <Btn key={n} active={f === n * 220} onClick={() => setF(n * 220)}>{`f${"₁₂₃₄₅"[n - 1]} = ${n * 220}`}</Btn>)}
        </Row>
        <Row>
          <SoundButton on={sound} onClick={toggleSound}>{tx(t, "figPhStand_listen", "listen")}</SoundButton>
          <Readout color={C.green}>{`f₁ = v/2L = ${f2(f1, 0)} Hz`}</Readout>
          <Readout>{`λ = v/f = ${f2(lam * 100, 1)} cm`}</Readout>
          <Readout color={C.sky}>{`2L/λ = ${f2((2 * LEN) / lam, 2)}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhStand_note", "The shaker on the left moves only a hair. At most frequencies the waves it sends and their reflections from the far end meet out of step and mostly cancel: the string hardly moves. Slide to 220 Hz and the string suddenly swings in one big loop: a wave going there and back now arrives in step with the next push, exactly the resonance of the last chapter. The same happens at 440, 660, 880 Hz: two, three, four loops, with points that never move (nodes, green) between them. The readout 2L/λ is a whole number exactly at those frequencies: a whole number of half-wavelengths fits on the string. Show the two travelling waves to see the standing wave as a right-moving and a left-moving wave added together. Press listen to hear the tone at each harmonic: the octave, then the fifth above it, the notes of a guitar string's natural harmonics.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} />
      </div>
    </Figure>
  );
}
