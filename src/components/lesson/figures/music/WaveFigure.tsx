"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, Sliders, T, useVisible } from "@/components/lesson/kit/figure";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { playTone, type ToneVoice } from "@/components/lesson/kit/audio/synth";
import { VolumeSlider } from "@/components/lesson/kit/audio/VolumeSlider";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";

// ── What this figure shows ────────────────────────────────────────────────────
// The pressure at one point (your ear) over time for a pure tone:
//   p(t) = A · sin(2π f t)
// drawn and played at the same time. The frequency slider is logarithmic
// (20 Hz … 20 kHz, the range of human hearing) because the ear hears ratios:
// 20 → 200 sounds as big a step as 2 000 → 20 000. The window is either a fixed
// 10 ms, where higher tones pack more cycles in, or exactly four periods, where
// every tone looks alike and only the time axis changes.

const W = 600, H = 210, PAD_L = 34, PAD_R = 10, MID = 100, AMP = 76;
const F_MIN = 20, F_MAX = 20000;
const V_AIR = 343;                                         // m/s, air at 20 °C
const LEVEL = 0.22;                                        // synth level at A = 1; the master volume scales it

type Win = "fixed" | "periods";

const sToF = (s: number) => F_MIN * (F_MAX / F_MIN) ** s;  // slider 0…1 → Hz, logarithmic
const fToS = (f: number) => Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN);

const fmtHz = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 1 : 2)} kHz` : `${f.toFixed(f < 100 ? 1 : 0)} Hz`);
const fmtTime = (s: number) => (s >= 1e-3 ? `${(s * 1e3).toFixed(s >= 0.01 ? 1 : 2)} ms` : `${(s * 1e6).toFixed(0)} µs`);
const fmtLen = (m: number) => (m >= 1 ? `${m.toFixed(2)} m` : `${(m * 100).toFixed(1)} cm`);

const PRESETS: [number, string][] = [[20, "20 Hz"], [110, "110 Hz"], [440, "440 Hz"], [1000, "1 kHz"], [8000, "8 kHz"], [16000, "16 kHz"]];

export function MusicWaveFigure({ t }: { t?: TrackTranslations }) {
  const [f, setF] = useState(440);
  const [A, setA] = useState(0.7);
  const [win, setWin] = useState<Win>("fixed");
  const [sounding, setSounding] = useState(false);
  const voice = useRef<ToneVoice | null>(null);
  const vis = useVisible<HTMLDivElement>();

  const stop = () => { voice.current?.stop(); voice.current = null; setSounding(false); };
  const toggle = () => {
    if (voice.current) return stop();
    startAudio();
    voice.current = playTone(f, { level: A * LEVEL, env: { attack: 0.03, decay: 0.01, sustain: 1, release: 0.08 } });
    setSounding(true);
  };

  // The tone follows the sliders while it sounds
  useEffect(() => { voice.current?.setFreq(f); }, [f]);
  useEffect(() => { voice.current?.setLevel(A * LEVEL); }, [A]);
  // Silence off screen and on unmount
  useEffect(() => { if (!vis.on && voice.current) { voice.current.stop(); voice.current = null; setSounding(false); } }, [vis.on]);
  useEffect(() => () => voice.current?.stop(), []);

  const period = 1 / f;
  const span = win === "fixed" ? 0.01 : 4 * period;       // seconds across the plot
  const plotW = W - PAD_L - PAD_R;
  const X = (s: number) => PAD_L + (s / span) * plotW;
  const cycles = span * f;
  // Enough points for smooth curves; past ~2 px per cycle the curve becomes a solid band, which is the honest picture
  const n = Math.min(4000, Math.max(400, Math.ceil(cycles * 24)));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const s = (span * i) / n;
    d += `${i ? "L" : "M"}${X(s).toFixed(2)},${(MID - AMP * A * Math.sin(2 * Math.PI * f * s)).toFixed(2)}`;
  }
  const showT = X(period) - PAD_L > 14;

  return (
    <Figure title={tx(t, "figMus_waveTitle", "A pure tone: pressure at your ear over time")}
      head={<Choice value={win} onChange={setWin} options={[
        ["fixed", tx(t, "figMus_win10", "10 ms window")],
        ["periods", tx(t, "figMus_win4", "4 periods")],
      ]} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figMus_freq", "frequency f")} value={fToS(f)} min={0} max={1} step={0.001}
            onChange={s => setF(sToF(s))} fmt={() => fmtHz(f)} />
          <Slider label={tx(t, "figMus_amp", "amplitude A")} value={A} min={0} max={1} step={0.01} onChange={setA} />
        </Sliders>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figMus_try", "try:")}</span>
          {PRESETS.map(([hz, label]) => <Btn key={hz} active={Math.abs(f - hz) < 0.5} onClick={() => setF(hz)}>{label}</Btn>)}
        </Row>
        <Row>
          <Readout color="#f43f5e">f = {fmtHz(f)}</Readout>
          <Readout>T = 1/f = {fmtTime(period)}</Readout>
          <Readout>λ = v/f = 343/{f.toFixed(0)} = {fmtLen(V_AIR / f)}</Readout>
          {win === "fixed" && <Readout>{tx(t, "figMus_cycles", "cycles in 10 ms")}: {cycles.toFixed(cycles < 10 ? 1 : 0)}</Readout>}
        </Row>
        <VolumeSlider t={t} />
      </>}
      note={tx(t, "figMus_waveNote", "Press listen and sweep the frequency. Start with the volume low: high tones sound louder than they look. Below about 60 Hz, laptop and phone speakers barely move air, so you may see a wave you cannot hear. The top of hearing drops with age: most adults stop hearing somewhere between 14 and 17 kHz.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          <line x1={PAD_L} x2={W - PAD_R} y1={MID} y2={MID} stroke={C.axis} />
          <line x1={PAD_L} x2={PAD_L} y1={MID - AMP - 8} y2={MID + AMP + 8} stroke={C.axis} />
          {[0.25, 0.5, 0.75, 1].map(k => <line key={k} x1={PAD_L + k * plotW} x2={PAD_L + k * plotW} y1={MID - AMP - 8} y2={MID + AMP + 8} stroke={C.grid} />)}
          {[0, 0.5, 1].map(k => <T key={k} x={PAD_L + k * plotW} y={H - 6} anchor={k === 0 ? "start" : k === 1 ? "end" : "middle"} size={8.5}>{fmtTime(k * span).replace("0 µs", "0")}</T>)}
          <T x={PAD_L - 4} y={MID - AMP + 3} anchor="end" size={8.5}>+1</T>
          <T x={PAD_L - 4} y={MID + 3} anchor="end" size={8.5}>0</T>
          <T x={PAD_L - 4} y={MID + AMP + 3} anchor="end" size={8.5}>−1</T>
          <T x={PAD_L + 4} y={12} size={8.5}>{tx(t, "figMus_pAxis", "pressure (above / below normal)")}</T>

          <path d={d} fill="none" stroke="#f43f5e" strokeWidth={cycles > 150 ? 0.8 : 2} strokeLinejoin="round" />

          {/* amplitude marker */}
          {A > 0.05 && <g>
            <line x1={W - PAD_R - 4} x2={W - PAD_R - 4} y1={MID} y2={MID - AMP * A} stroke={C.green} strokeWidth={1.5} />
            <T x={W - PAD_R - 8} y={MID - AMP * A / 2 + 3} anchor="end" color={C.green} size={10} bold>A</T>
          </g>}
          {/* one period */}
          {showT && <g>
            <line x1={X(0)} x2={X(period)} y1={MID + AMP + 4} y2={MID + AMP + 4} stroke={C.purple} strokeWidth={1.2} />
            {[0, period].map(s => <line key={s} x1={X(s)} x2={X(s)} y1={MID + AMP} y2={MID + AMP + 8} stroke={C.purple} strokeWidth={1.2} />)}
            <T x={(X(0) + X(period)) / 2} y={MID + AMP + 16} anchor="middle" color={C.purple} size={10} bold>T</T>
          </g>}
        </svg>
        <div className="px-3 pb-3 flex items-center gap-3">
          <SoundButton on={sounding} onClick={toggle}>
            {sounding ? tx(t, "figMus_stop", "stop") : tx(t, "figMus_listen", "listen")}
          </SoundButton>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            p(t) = {A.toFixed(2)} · sin(2π · {f.toFixed(f < 100 ? 1 : 0)} · t)
          </span>
        </div>
      </div>
    </Figure>
  );
}
