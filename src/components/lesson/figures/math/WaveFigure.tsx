"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, plot, Grid, fnPath, useRaf, useRerender } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// y(t) = A · sin(2π f t + φ) + C: amplitude A (height), frequency f (cycles per
// second), phase φ (shift along the cycle, in radians) and offset C (the level
// it oscillates around). A second wave can be added: the sum shows beats when
// the frequencies are close, and interference when the phases differ.

export function WaveFigure({ t }: { t?: TrackTranslations }) {
  const [A, setA] = useState(1);
  const [f, setF] = useState(1);
  const [ph, setPh] = useState(0);
  const [off, setOff] = useState(0);
  const [two, setTwo] = useState(false);
  const [f2_, setF2] = useState(1.2);
  const [run, setRun] = useState(false);
  const clock = useRef(0);
  const rerender = useRerender();
  const ref = useRaf(run, dt => { clock.current += dt; rerender(); });

  const p = plot({ W: 560, H: 250, x0: 0, x1: 4, y0: -2.6, y1: 2.6 });
  const w1 = (x: number) => A * Math.sin(2 * Math.PI * f * x + ph) + off;
  const w2 = (x: number) => 0.8 * Math.sin(2 * Math.PI * f2_ * x);
  const now = clock.current % 4;
  const period = 1 / f;

  return (
    <Figure
      title={tx(t, "figWave_title", "Anatomy of a sine wave")}
      head={<>
        <Btn active={run} onClick={() => setRun(r => !r)}>{run ? "❚❚" : "▶ time"}</Btn>
        <Btn active={two} onClick={() => setTwo(v => !v)}>{tx(t, "figWave_add", "+ second wave")}</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figWave_A", "amplitude A")} value={A} min={0} max={2} step={0.05} onChange={setA} width="w-28" />
          <Slider label={tx(t, "figWave_f", "frequency f")} value={f} min={0.25} max={4} step={0.05} onChange={setF} fmt={v => `${v.toFixed(2)} Hz`} width="w-28" />
          <Slider label={tx(t, "figWave_phi", "phase φ")} value={ph} min={-Math.PI} max={Math.PI} step={0.05} onChange={setPh} fmt={v => `${(v / Math.PI).toFixed(2)}π`} width="w-28" />
          <Slider label={tx(t, "figWave_C", "offset C")} value={off} min={-1} max={1} step={0.05} onChange={setOff} width="w-28" />
          {two && <Slider label={tx(t, "figWave_f2", "2nd wave f")} value={f2_} min={0.25} max={4} step={0.05} onChange={setF2} fmt={v => `${v.toFixed(2)} Hz`} width="w-28" />}
        </Sliders>
        <Row>
          <Readout>{tx(t, "figWave_period", "period")} T = 1/f = {period.toFixed(3)} s</Readout>
          <Readout>ω = 2πf = {(2 * Math.PI * f).toFixed(2)} rad/s</Readout>
          <Readout>{tx(t, "figWave_shift", "time shift")} −φ/ω = {(-ph / (2 * Math.PI * f)).toFixed(3)} s</Readout>
        </Row>
      </>}
      note={tx(t, "figWave_note", "A scales the height, C moves the centre line, f squeezes more cycles into each second (the period, the length of one cycle, is 1/f), and φ slides the wave along: a phase of π/2 turns sine into cosine, π flips it upside down. Inside the sine, 2πf converts seconds into radians: after one period the angle has gone once round the circle. Add a second wave with a slightly different frequency: the sum swells and fades at the difference frequency |f₁ − f₂|, the \"beats\" you hear when two strings are slightly out of tune.")}
    >
      <div ref={ref}>
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
          {two && <path d={fnPath(p, w2, 0, 4, 500)} fill="none" stroke={C.purple} strokeWidth={1.3} opacity={0.7} />}
          <path d={fnPath(p, w1, 0, 4, 500)} fill="none" stroke={C.green} strokeWidth={two ? 1.3 : 2.4} opacity={two ? 0.7 : 1} />
          {two && <path d={fnPath(p, x => w1(x) + w2(x), 0, 4, 800)} fill="none" stroke={C.pink} strokeWidth={2.2} />}
          {run && <>
            <line x1={p.X(now)} x2={p.X(now)} y1={0} y2={p.H} stroke={C.fg} opacity={0.3} />
            <circle cx={p.X(now)} cy={p.Y(two ? w1(now) + w2(now) : w1(now))} r={5} fill={two ? C.pink : C.green} />
          </>}
          <T x={6} y={14} size={9} color={C.green}>{`A·sin(2πft + φ) + C`}</T>
          {two && <T x={6} y={27} size={9} color={C.pink}>{tx(t, "figWave_sum", "sum of both")}</T>}
        </svg>
      </div>
    </Figure>
  );
}
