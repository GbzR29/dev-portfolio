"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, T, clamp, mulberry32, useDrag, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { freqToMidi, noteName } from "@/components/lesson/kit/audio/notes";
import { playTone, type ToneVoice } from "@/components/lesson/kit/audio/synth";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// Additive synthesis: a tone built from its first ten harmonics on 220 Hz.
// Drag a bar to set harmonic n's amplitude; the wave below is the sum
//   p(t) = Σ aₙ · sin(2π·n·f·t + φₙ),
// scaled to the same height (the browser scales the sound the same way), and
// it plays live. The presets are the textbook recipes (square: odd harmonics
// at 1/n; sawtooth: all at 1/n; triangle: odd at 1/n² with every other one
// flipped). "Shuffle phases" slides each harmonic in time: the shape changes
// completely, the sound barely at all. With harmonic 1 removed, the wave still
// repeats every 1/220 s, and you still hear A3: the missing fundamental.

const W = 600, H = 272, X0 = 36, X1 = 586;
const N = 10, F = 220;
const BAR_TOP = 22, BAR_BOT = 132;                          // bar area; amplitude 1 reaches BAR_TOP
const WAVE_Y = 222, WAVE_A = 40;
const SLOT = (X1 - X0) / N;
const LEVEL = 0.3;

type Recipe = { amps: number[]; phases: number[] };

const zeros = () => Array<number>(N).fill(0);
const recipe = (amp: (n: number) => number, flip: (n: number) => boolean = () => false): Recipe => ({
  amps: Array.from({ length: N }, (_, k) => amp(k + 1)),
  phases: Array.from({ length: N }, (_, k) => (flip(k + 1) ? Math.PI : 0)),
});
const odd = (n: number) => n % 2 === 1;

const PRESETS: [string, string, Recipe][] = [
  ["sine", "sine", recipe(n => (n === 1 ? 1 : 0))],
  ["square", "square", recipe(n => (odd(n) ? 1 / n : 0))],
  ["saw", "sawtooth", recipe(n => 1 / n)],
  ["tri", "triangle", recipe(n => (odd(n) ? 1 / (n * n) : 0), n => n % 4 === 3)],
  ["nofund", "no fundamental", recipe(n => (n === 1 ? 0 : 1 / n))],
];

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** The summed wave over two periods of 220 Hz, scaled so its peak fills WAVE_A. */
function wavePath({ amps, phases }: Recipe) {
  const n = 600;
  const ys = Array.from({ length: n + 1 }, (_, i) =>
    amps.reduce((s, a, k) => s + a * Math.sin(2 * Math.PI * (k + 1) * (2 * i / n) + phases[k]), 0));
  const peak = Math.max(1e-9, ...ys.map(Math.abs));
  return ys.map((y, i) => `${i ? "L" : "M"}${(X0 + (i / n) * (X1 - X0)).toFixed(1)},${(WAVE_Y - (WAVE_A * y) / peak).toFixed(1)}`).join("");
}

export function MusicHarmonicBuilderFigure({ t }: { t?: TrackTranslations }) {
  const [rec, setRec] = useState<Recipe>(PRESETS[2][2]);
  const [sounding, setSounding] = useState(false);
  const voice = useRef<ToneVoice | null>(null);
  const vis = useVisible<HTMLDivElement>();

  const setAmp = (k: number, y: number) => setRec(r => {
    const amps = [...r.amps];
    amps[k] = Math.round(clamp((BAR_BOT - y) / (BAR_BOT - BAR_TOP), 0, 1) * 100) / 100;
    return { ...r, amps };
  });
  const drag = useDrag<number>(
    p => {
      if (p.x < X0 || p.x > X1 || p.y < BAR_TOP - 14 || p.y > BAR_BOT + 24) return null;
      const k = Math.min(N - 1, Math.floor((p.x - X0) / SLOT));
      setAmp(k, p.y);
      return k;
    },
    (k, p) => setAmp(k, p.y),
  );

  const silent = rec.amps.every(a => a === 0);
  const stop = () => { voice.current?.stop(); voice.current = null; setSounding(false); };
  const toggle = () => {
    if (voice.current) return stop();
    startAudio();
    voice.current = playTone(F, { wave: silent ? { amps: [1] } : rec, level: silent ? 0 : LEVEL, env: { attack: 0.03, decay: 0.01, sustain: 1, release: 0.1 } });
    setSounding(true);
  };
  // The sound follows the bars while it plays; all bars at zero is silence
  useEffect(() => {
    if (!voice.current) return;
    if (silent) voice.current.setLevel(0);
    else { voice.current.setHarmonics(rec); voice.current.setLevel(LEVEL); }
  }, [rec, silent]);
  useEffect(() => { if (!vis.on && voice.current) { voice.current.stop(); voice.current = null; setSounding(false); } }, [vis.on]);
  useEffect(() => () => voice.current?.stop(), []);

  const shuffle = () => {
    const rnd = mulberry32(Math.floor(Math.random() * 1e9));
    setRec(r => ({ ...r, phases: r.phases.map(() => rnd() * 2 * Math.PI) }));
  };
  const phased = rec.phases.some(p => p !== 0 && p !== Math.PI);

  // Which harmonics sound, and the rate at which their sum repeats
  const on = rec.amps.flatMap((a, k) => (a > 0 ? [k + 1] : []));
  const g = on.reduce(gcd, 0);
  const heard = g ? F * g : null;

  return (
    <Figure title={tx(t, "figMus_hbTitle", "Build a timbre from harmonics")}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_hbRecipes", "recipes:")}</span>
          {PRESETS.map(([id, label, r]) => (
            <Btn key={id} active={rec.amps.every((a, k) => Math.abs(a - Math.round(r.amps[k] * 100) / 100) < 0.011) && !phased} onClick={() => setRec({ amps: r.amps.map(a => Math.round(a * 100) / 100), phases: r.phases })}>
              {tx(t, `figMus_hb_${id}`, label)}
            </Btn>
          ))}
          <Btn onClick={() => setRec({ amps: zeros(), phases: zeros() })}>{tx(t, "figMus_hbClear", "clear")}</Btn>
        </Row>
        <Row>
          <Btn active={phased} onClick={shuffle}>{tx(t, "figMus_hbShuffle", "shuffle phases")}</Btn>
          {phased && <Btn onClick={() => setRec(r => ({ ...r, phases: zeros() }))}>{tx(t, "figMus_hbAlign", "line phases up again")}</Btn>}
        </Row>
        <Row>
          <Readout>{tx(t, "figMus_hbOn", "harmonics on")}: {on.length ? on.join(", ") : "—"}</Readout>
          {heard && <Readout color="#f43f5e">{tx(t, "figMus_hbRepeats", "repeats")} {heard} {tx(t, "figMus_hbTimes", "times a second")} → {noteName(Math.round(freqToMidi(heard)))}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={<>
        <span data-mouse-only>{tx(t, "figMus_hbNoteMouse", "Drag the bars up and down.")}</span>
        <span data-touch-only>{tx(t, "figMus_hbNoteTouch", "Slide a finger up and down the bars.")}</span>
        {" "}{tx(t, "figMus_hbNote", "Press listen, then switch recipes: same pitch, different colour. Try \"shuffle phases\": the wave changes shape completely, yet it sounds almost the same. Try \"no fundamental\": the 220 Hz bar is gone, but the wave still repeats 220 times a second and you still hear A3.")}
      </>}>
      <div ref={vis.ref}>
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block select-none">
          <T x={X0} y={12} size={9} bold color={C.fg}>{tx(t, "figMus_hbBars", "amplitude of each harmonic (drag)")}</T>
          <line x1={X0} x2={X1} y1={BAR_BOT} y2={BAR_BOT} stroke={C.axis} />
          {rec.amps.map((a, k) => {
            const x = X0 + SLOT * k, h = a * (BAR_BOT - BAR_TOP);
            return (
              <g key={k} style={{ cursor: "ns-resize" }}>
                <rect x={x + 3} y={BAR_TOP} width={SLOT - 6} height={BAR_BOT - BAR_TOP} rx={3} fill={C.grid} opacity={0.35} />
                <rect x={x + 3} y={BAR_BOT - h} width={SLOT - 6} height={h} rx={3} fill={k === 0 ? "#f43f5e" : C.sky} fillOpacity={drag.dragging === k ? 1 : 0.8} />
                <T x={x + SLOT / 2} y={BAR_BOT + 12} anchor="middle" size={9.5} bold color={C.fg}>{k + 1}</T>
                <T x={x + SLOT / 2} y={BAR_BOT + 23} anchor="middle" size={7.5}>{F * (k + 1)}</T>
              </g>
            );
          })}
          <line x1={X0} x2={X1} y1={WAVE_Y} y2={WAVE_Y} stroke={C.grid} />
          <line x1={(X0 + X1) / 2} x2={(X0 + X1) / 2} y1={WAVE_Y - WAVE_A - 6} y2={WAVE_Y + WAVE_A + 6} stroke={C.muted} strokeDasharray="3 4" />
          <T x={X0} y={WAVE_Y - WAVE_A - 8} size={8.5}>{tx(t, "figMus_hbWave", "the sum: pressure over two periods (2 × 4.55 ms)")}</T>
          {!silent && <path d={wavePath(rec)} fill="none" stroke="#f43f5e" strokeWidth={1.8} strokeLinejoin="round" />}
        </svg>
        <div className="px-3 pb-3">
          <SoundButton on={sounding} onClick={toggle}>
            {sounding ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_listen", "listen")}
          </SoundButton>
        </div>
      </div>
    </Figure>
  );
}
