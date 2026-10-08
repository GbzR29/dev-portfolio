"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, plot, Grid, fnPath, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// y(t) = A · sin(2π f t + φ) + C: amplitude A (height), frequency f (cycles per
// second), phase φ (shift along the cycle, in radians) and offset C (the level
// it oscillates around). The Transport runs time; each step is a quarter
// period, the five landmarks of a hand sketch. A second wave can be added:
// the sum shows beats when the frequencies are close.
// The lab: amplitude, period, phase, quarter periods, then beats.

const p = plot({ W: 560, H: 250, x0: 0, x1: 4, y0: -2.6, y1: 2.6 });
const SPAN = 4;                     // seconds shown
const n2 = (v: number) => (+v.toFixed(2)).toString().replace("-", "−");
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) < tol;

type Wave = { A: number; f: number; ph: number; off: number; two: boolean; f2: number };

/** The svg of the wave and the moving instant. */
function WaveDrawing({ w, time, t }: { w: Wave; time: number; t?: TrackTranslations }) {
  const { A, f, ph, off, two, f2 } = w;
  const w1 = (x: number) => A * Math.sin(2 * Math.PI * f * x + ph) + off;
  const w2 = (x: number) => 0.8 * Math.sin(2 * Math.PI * f2 * x);
  const period = 1 / f;
  const yNow = two ? w1(time) + w2(time) : w1(time);
  return (
    <svg viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
      <Grid p={p} step={0.25} major={1} labels={false} />
      {[1, 2, 3].map(x => <T key={x} x={p.X(x)} y={p.Y(0) + 12} size={8} anchor="middle">{`${x} s`}</T>)}
      <line x1={0} x2={p.W} y1={p.Y(off)} y2={p.Y(off)} stroke={C.sky} strokeDasharray="4 4" opacity={0.6} />
      <line x1={0} x2={p.W} y1={p.Y(off + A)} y2={p.Y(off + A)} stroke={C.muted} strokeDasharray="2 4" opacity={0.6} />
      <line x1={0} x2={p.W} y1={p.Y(off - A)} y2={p.Y(off - A)} stroke={C.muted} strokeDasharray="2 4" opacity={0.6} />
      {period <= 3.6 && (() => {
        // mark one period, starting at the first upward zero crossing
        let x0 = (-ph / (2 * Math.PI)) / f;
        while (x0 < 0.05) x0 += period;
        return (
          <g>
            <line x1={p.X(x0)} x2={p.X(x0 + period)} y1={p.Y(off - A) + 14} y2={p.Y(off - A) + 14} stroke={C.amber} strokeWidth={1.5} />
            <T x={p.X(x0 + period / 2)} y={p.Y(off - A) + 26} size={8.5} anchor="middle" color={C.amber}>T</T>
          </g>
        );
      })()}
      {two && <path d={fnPath(p, w2, 0, SPAN, 500)} fill="none" stroke={C.purple} strokeWidth={1.3} opacity={0.7} />}
      <path d={fnPath(p, w1, 0, SPAN, 500)} fill="none" stroke={C.green} strokeWidth={two ? 1.3 : 2.4} opacity={two ? 0.7 : 1} />
      {two && <path d={fnPath(p, x => w1(x) + w2(x), 0, SPAN, 800)} fill="none" stroke={C.pink} strokeWidth={2.2} />}
      <line x1={p.X(time)} x2={p.X(time)} y1={0} y2={p.H} stroke={C.fg} opacity={0.3} />
      <circle cx={p.X(time)} cy={p.Y(yNow)} r={5} fill={two ? C.pink : C.green} />
      <T x={6} y={14} size={9} color={C.green}>{`A·sin(2πft + φ) + C`}</T>
      {two && <T x={6} y={27} size={9} color={C.pink}>{tx(t, "figWave_sum", "sum of both")}</T>}
    </svg>
  );
}

export function WaveFigure({ t }: { t?: TrackTranslations }) {
  const [A, setA] = useState(1);
  const [f, setF] = useState(1);
  const [ph, setPh] = useState(0);
  const [off, setOff] = useState(0);
  const [two, setTwo] = useState(false);
  const [f2, setF2] = useState(1.2);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-wave");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && (vis.on || lab.open), dt => setTime(v => (v + dt * 0.5) % SPAN));

  const period = 1 / f, quarter = period / 4;
  const w: Wave = { A, f, ph, off, two, f2 };
  const yNow = A * Math.sin(2 * Math.PI * f * time + ph) + off;
  const stepTo = (v: number) => { setPlaying(false); setTime(Math.max(0, Math.min(SPAN, v))); };
  const qIndex = Math.round(time / quarter);
  const onQuarter = near(time, qIndex * quarter, 1e-6);

  const view = (
    <div>
      <WaveDrawing w={w} time={time} t={t} />
      <Transport t={t} playing={playing}
        onPlay={() => setPlaying(v => !v)}
        playLabel={tx(t, "figWave_play", "run time")}
        onStep={time + quarter <= SPAN + 1e-9 ? () => stepTo((Math.floor(time / quarter + 1e-6) + 1) * quarter) : undefined}
        onBack={time > 0 ? () => stepTo((Math.ceil(time / quarter - 1e-6) - 1) * quarter) : undefined}
        onReset={() => stepTo(0)}
        readout={`t = ${time.toFixed(2)} s · y = ${n2(yNow)}`} />
    </div>
  );
  const twoBtn = <Btn active={two} onClick={() => setTwo(v => !v)}>{tx(t, "figWave_add", "+ second wave")}</Btn>;
  const controls = <>
    <Sliders>
      <Slider label={tx(t, "figWave_A", "amplitude A")} value={A} min={0} max={2} step={0.05} onChange={setA} width="w-28" />
      <Slider label={tx(t, "figWave_f", "frequency f")} value={f} min={0.25} max={4} step={0.05} onChange={setF} fmt={v => `${v.toFixed(2)} Hz`} width="w-28" />
      <Slider label={tx(t, "figWave_phi", "phase φ")} value={ph} min={-Math.PI} max={Math.PI} step={0.05} onChange={setPh} fmt={v => `${(v / Math.PI).toFixed(2)}π`} width="w-28" />
      <Slider label={tx(t, "figWave_C", "offset C")} value={off} min={-1} max={1} step={0.05} onChange={setOff} width="w-28" />
      {two && <Slider label={tx(t, "figWave_f2", "2nd wave f")} value={f2} min={0.25} max={4} step={0.05} onChange={setF2} fmt={v => `${v.toFixed(2)} Hz`} width="w-28" />}
    </Sliders>
    <Row>
      <Readout>{tx(t, "figWave_period", "period")} T = 1/f = {period.toFixed(3)} s</Readout>
      <Readout>ω = 2πf = {(2 * Math.PI * f).toFixed(2)} rad/s</Readout>
      <Readout>{tx(t, "figWave_shift", "time shift")} −φ/ω = {(-ph / (2 * Math.PI * f)).toFixed(3)} s</Readout>
    </Row>
  </>;

  // ── Lab ──
  const beat = Math.abs(f - f2);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figWaveL1_t", "Amplitude"),
      body: <>
        <p>{tx(t, "figWaveL1_b1", "The wave swings between C − A and C + A, the two faint dashed lines.")}</p>
        <p>{tx(t, "figWaveL1_b2", "Make it twice as tall.")}</p>
      </>,
      goal: { text: tx(t, "figWaveL1_g", "A = 2."), done: near(A, 2) },
      setup: () => { setPlaying(false); setA(1); setF(1); setPh(0); setOff(0); setTwo(false); setTime(0); },
    },
    {
      title: tx(t, "figWaveL2_t", "Period"),
      body: <p>{tx(t, "figWaveL2_b", "The amber bar marks one period T, the time for one full cycle. T = 1/f. Make each cycle last half a second.")}</p>,
      goal: { text: tx(t, "figWaveL2_g", "T = 0.5 s."), done: near(f, 2) },
      hint: tx(t, "figWaveL2_h", "Half a second per cycle is two cycles per second: f = 2 Hz."),
    },
    {
      title: tx(t, "figWaveL3_t", "Quick check"),
      body: <p>{tx(t, "figWaveL3_b", "Frequency counts cycles per second; period counts seconds per cycle.")}</p>,
      quiz: {
        q: tx(t, "figWaveL3_q", "A wave repeats every 0.25 s. What is its frequency?"),
        options: ["4 Hz", "0.25 Hz", "2.5 Hz", "π/2 Hz"],
        answer: 0,
        why: tx(t, "figWaveL3_w", "f = 1/T = 1/0.25 = 4 cycles per second."),
      },
    },
    {
      title: tx(t, "figWaveL4_t", "Phase"),
      body: <p>{tx(t, "figWaveL4_b", "φ slides the wave along its cycle. A quarter turn of head start turns the sine into a cosine: it starts at its top instead of at the centre line.")}</p>,
      goal: { text: tx(t, "figWaveL4_g", "φ = π/2 (0.50π)."), done: Math.abs(ph - Math.PI / 2) < 0.03 },
      setup: () => { setPlaying(false); setA(1); setF(1); setPh(0); setOff(0); setTime(0); },
    },
    {
      title: tx(t, "figWaveL5_t", "Quarter periods"),
      body: <>
        <p>{tx(t, "figWaveL5_b1", "Each ⏭ moves time by a quarter period. A sine passes five landmarks per cycle: centre, top, centre, bottom, centre.")}</p>
        <p>{tx(t, "figWaveL5_b2", "Step through one full period and watch y.")}</p>
      </>,
      goal: { text: tx(t, "figWaveL5_g", "t = T, after four steps."), done: time >= period - 1e-6 && onQuarter },
      focus: "step",
      setup: () => { setPlaying(false); setA(1); setF(1); setPh(0); setOff(0); setTime(0); },
    },
    {
      title: tx(t, "figWaveL6_t", "Beats"),
      body: <>
        <p>{tx(t, "figWaveL6_b1", "Add a second wave. When the two frequencies are close, the pink sum swells and fades.")}</p>
        <p>{tx(t, "figWaveL6_b2", "Make the sum swell exactly once per second.")}</p>
      </>,
      goal: { text: tx(t, "figWaveL6_g", "Second wave on, |f₁ − f₂| = 1 Hz."), done: two && near(beat, 1, 1e-6) },
      hint: tx(t, "figWaveL6_h", "The beat frequency is the difference: with f = 2, set the second wave to 1 or 3 Hz."),
      setup: () => { setPlaying(false); setF(2); setPh(0); setTwo(true); setF2(2.5); },
    },
    {
      title: tx(t, "figWaveL7_t", "Quick check"),
      body: <p>{tx(t, "figWaveL7_b", "Beats come at the difference of the two frequencies.")}</p>,
      quiz: {
        q: tx(t, "figWaveL7_q", "Tuning forks at 440 Hz and 443 Hz ring together. How often does the sound swell?"),
        options: [tx(t, "figWaveL7_o1", "3 times per second"), tx(t, "figWaveL7_o2", "883 times per second"), tx(t, "figWaveL7_o3", "441.5 times per second"), tx(t, "figWaveL7_o4", "never")],
        answer: 0,
        why: tx(t, "figWaveL7_w", "|443 − 440| = 3 Hz. Tuners listen for these beats and turn the peg until they slow down and stop."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "flat", tone: "warn", when: A === 0,
      title: tx(t, "figWaveI1_t", "No wave left"),
      body: tx(t, "figWaveI1_b", "With A = 0 the sine is multiplied by zero: only the centre line C remains."),
    },
    {
      id: "cos", tone: "ok", when: A > 0 && Math.abs(ph - Math.PI / 2) < 0.03,
      title: tx(t, "figWaveI2_t", "A cosine"),
      body: tx(t, "figWaveI2_b", "sin(x + π/2) = cos x: a quarter cycle of head start makes the wave start at its top."),
    },
    {
      id: "flip", tone: "info", when: A > 0 && Math.abs(Math.abs(ph) - Math.PI) < 0.03,
      title: tx(t, "figWaveI3_t", "Upside down"),
      body: tx(t, "figWaveI3_b", "A phase of π, half a cycle, gives sin(x + π) = −sin x: the same wave flipped."),
    },
    {
      id: "same", tone: "info", when: two && near(f, f2),
      title: tx(t, "figWaveI4_t", "Same frequency"),
      body: tx(t, "figWaveI4_b", "Two waves with one frequency add up to one wave of that frequency, with a new amplitude and phase. No beats."),
    },
    {
      id: "beats", tone: "ok", when: two && beat > 1e-6 && beat <= 1.5,
      title: tx(t, "figWaveI5_t", "Beats"),
      body: fill(tx(t, "figWaveI5_b", "The waves drift in and out of step {b} times per second: the sum swells every {T} s."), { b: n2(beat), T: n2(1 / beat) }),
    },
  ];

  const title = tx(t, "figWave_title", "Anatomy of a sine wave");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{twoBtn}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={tx(t, "figWave_note2", "A scales the height, C moves the centre line, f squeezes more cycles into each second (the period, the length of one cycle, is 1/f), and φ slides the wave along: a phase of π/2 turns sine into cosine, π flips it upside down. Inside the sine, 2πf converts seconds into radians: after one period the angle has gone once round the circle. Press play to run time, or step a quarter period at a time. Add a second wave with a slightly different frequency: the sum swells and fades at the difference frequency |f₁ − f₂|, the \"beats\" you hear when two strings are slightly out of tune.")}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{twoBtn}</Row>{controls}</>}
        recap={[
          tx(t, "figWaveR1", "A sets the height, C the centre line, f how many cycles per second, φ where the cycle starts."),
          tx(t, "figWaveR2", "T = 1/f; a quarter period moves the wave from one landmark to the next."),
          tx(t, "figWaveR3", "A phase of π/2 turns sine into cosine; π flips it."),
          tx(t, "figWaveR4", "Two close frequencies beat at their difference, |f₁ − f₂|."),
        ]}
      />
    </>
  );
}
