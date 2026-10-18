"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, Slider, Sliders, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { SoundButton } from "@/components/lesson/kit/audio/SoundButton";
import { startAudio } from "@/components/lesson/kit/audio/context";
import { playTone, type ToneVoice } from "@/components/lesson/kit/audio/synth";

// ── What this figure shows ────────────────────────────────────────────────────
// Two pure tones of nearly the same frequency, f₁ and f₂ = f₁ + Δf, played
// together. Top: a 10 ms window of each tone (sky and pink) at the moment the
// cursor marks; as time runs, one slowly slides past the other, in step
// (they add) and out of step (they cancel) by turns. Middle: their sum in
// the same window. Bottom: two seconds of the sum, so dense that only its
// outline shows: the loudness swells and fades |Δf| times a second, inside
// the envelope 2 cos(π Δf t). "listen" plays both tones at once, for real.
// sin a + sin b = 2 cos((a − b)/2) sin((a + b)/2): a tone at the average
// frequency whose size is slowly changed by the cosine.

const W = 560, H = 300;
const GX0 = 40, GX1 = 545;
const WIN = 0.01, SPAN = 2;

export function BeatsFigure({ t }: { t?: TrackTranslations }) {
  const [f1, setF1] = useState(440);
  const [df, setDf] = useState(3);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const voices = useRef<ToneVoice[]>([]);
  const vis = useVisible<HTMLDivElement>();
  const f2v = f1 + df;

  useFrame(playing && vis.on, dt => setTime(s => (s + dt) % SPAN));

  useEffect(() => { voices.current[0]?.setFreq(f1); voices.current[1]?.setFreq(f1 + df); }, [f1, df]);
  const stopSound = () => { voices.current.forEach(v => v.stop()); voices.current = []; setSound(false); };
  useEffect(() => { if (!vis.on && voices.current.length) stopSound(); }, [vis.on]);
  useEffect(() => () => voices.current.forEach(v => v.stop()), []);
  const toggleSound = () => {
    if (voices.current.length) { stopSound(); return; }
    startAudio();
    voices.current = [playTone(f1, { level: 0.2 }), playTone(f1 + df, { level: 0.2 })];
    setSound(true);
    setPlaying(true);
  };

  const gx = (s: number, a: number, b: number) => GX0 + ((s - a) / (b - a)) * (GX1 - GX0);
  const wave = (fn: (s: number) => number, a: number, b: number, y0: number, h: number, n: number) =>
    Array.from({ length: n + 1 }, (_, i) => { const s = a + ((b - a) * i) / n; return `${i ? "L" : "M"}${gx(s, a, b).toFixed(1)},${(y0 - h * fn(s)).toFixed(2)}`; }).join("");
  // the short window is drawn in tone 1's own rhythm: tone 1 always starts the same way and
  // tone 2 is ahead of it by the phase 2π Δf t it has gained so far (no strobing at 60 frames/s)
  const lead = 2 * Math.PI * df * time;
  const s1 = (s: number) => Math.sin(2 * Math.PI * f1 * s), s2 = (s: number) => Math.sin(2 * Math.PI * f2v * s + lead);
  const a = 0, b = WIN;
  const env = (s: number) => Math.abs(Math.cos(Math.PI * df * s));
  const inStep = env(time);
  // the region between the envelopes ±2 cos(π Δf t): top edge left to right, bottom edge back
  const edge = Array.from({ length: 401 }, (_, i) => (SPAN * i) / 400);
  const band = [...edge.map(s => [s, 2 * env(s)]), ...edge.reverse().map(s => [s, -2 * env(s)])]
    .map(([s, y], i) => `${i ? "L" : "M"}${gx(s, 0, SPAN).toFixed(1)},${(250 - 18 * y).toFixed(1)}`).join("") + "Z";

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <T x={GX0} y={14} color={C.muted} size={8.5}>{tx(t, "figPhBeat_top", "each tone, 10 ms around the cursor")}</T>
      <line x1={GX0} y1={58} x2={GX1} y2={58} stroke={C.grid} />
      <path d={wave(s1, a, b, 58, 32, 300)} fill="none" stroke={C.sky} strokeWidth={1.6} />
      <path d={wave(s2, a, b, 58, 32, 300)} fill="none" stroke={C.pink} strokeWidth={1.6} opacity={0.85} />
      <T x={GX1} y={14} anchor="end" color={inStep > 0.7 ? C.green : inStep < 0.3 ? C.red : C.muted} size={8.5} bold>
        {inStep > 0.7 ? tx(t, "figPhBeat_in", "in step: they add") : inStep < 0.3 ? tx(t, "figPhBeat_out", "out of step: they cancel") : ""}
      </T>
      <T x={GX0} y={110} color={C.muted} size={8.5}>{tx(t, "figPhBeat_mid", "their sum")}</T>
      <line x1={GX0} y1={148} x2={GX1} y2={148} stroke={C.grid} />
      <path d={wave(s => s1(s) + s2(s), a, b, 148, 16, 300)} fill="none" stroke={C.purple} strokeWidth={1.8} />
      <T x={GX0} y={196} color={C.muted} size={8.5}>{tx(t, "figPhBeat_bottom", "the sum over 2 s: only the outline shows")}</T>
      <line x1={GX0} y1={250} x2={GX1} y2={250} stroke={C.grid} />
      <path d={band} fill={C.purple} opacity={0.3} />
      <path d={wave(s => 2 * env(s), 0, SPAN, 250, 18, 400)} fill="none" stroke={C.amber} strokeWidth={1.4} strokeDasharray="4 3" />
      <path d={wave(s => -2 * env(s), 0, SPAN, 250, 18, 400)} fill="none" stroke={C.amber} strokeWidth={1.4} strokeDasharray="4 3" />
      <line x1={gx(time, 0, SPAN)} y1={206} x2={gx(time, 0, SPAN)} y2={292} stroke={C.fg} strokeWidth={1.2} />
      {[0, 0.5, 1, 1.5, 2].map(s => <T key={s} x={gx(s, 0, SPAN)} y={298} anchor="middle" color={C.muted} size={7.5}>{`${s} s`}</T>)}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhBeat_title", "Beats: two almost equal notes")}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhBeat_f1", "tone 1")} value={f1} min={200} max={600} step={1} onChange={setF1} fmt={v => `${v} Hz`} />
          <Slider label={tx(t, "figPhBeat_df", "tone 2 − tone 1")} value={df} min={-8} max={8} step={0.5} onChange={setDf} fmt={v => `${v > 0 ? "+" : ""}${v} Hz`} />
        </Sliders>
        <Row>
          <SoundButton on={sound} onClick={toggleSound}>{tx(t, "figPhBeat_listen", "listen to both")}</SoundButton>
          <Readout color={C.pink}>{`f₂ = ${f2(f2v, 1)} Hz`}</Readout>
          <Readout color={C.amber}>{`${tx(t, "figPhBeat_beat", "beats")} |f₁ − f₂| = ${f2(Math.abs(df), 1)} /s`}</Readout>
          <Readout color={C.purple}>{`${tx(t, "figPhBeat_heard", "pitch heard")} (f₁ + f₂)/2 = ${f2(f1 + df / 2, 1)} Hz`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhBeat_note", "Press listen (use headphones or speakers at a gentle volume). With 3 Hz between the tones you hear one note that swells and fades three times a second. In the top panel the pink wave slides past the sky one: when crest meets crest the sum is big, when crest meets trough it nearly vanishes. Make the difference smaller: the beats slow down, and at 0 Hz they stop. This is how a guitarist tunes two strings, and how a piano tuner tunes the three strings of one note: turn the peg until the beating stops. Above about 15 Hz of difference the ear stops hearing a single beating note and starts hearing roughness, then two separate notes.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} onReset={() => { setPlaying(false); setTime(0); }}
          readout={`t = ${f2(time, 2)} s`} />
      </div>
    </Figure>
  );
}
