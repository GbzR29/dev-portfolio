"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Slider, Sliders, Row, Readout, C, T, plot, Grid, useRaf, useRerender, useDrag, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// "x = lerp(x, target, k)" every frame is the most common smoothing line in
// games, and it runs at a different speed at every frame rate: k is a fraction
// per FRAME. The fix is to make the fraction depend on dt: 1 − e^(−λ·dt). Top:
// drag the target; four followers chase it, two with the naive line and two
// with the corrected one, each at its own frame rate. Bottom: the response to
// a jump of the target from 0 to 1, computed exactly for both frame rates.

const W = 560, LANE_A = 58, LANE_B = 108, X0 = 30, X1 = 530;

export function SmoothingFigure({ t }: { t?: TrackTranslations }) {
  const [k, setK] = useState(0.1);
  const [fpsA, setFpsA] = useState(20);
  const [fpsB, setFpsB] = useState(144);
  const target = useRef(0.8);
  const st = useRef({ x: [0.1, 0.1, 0.1, 0.1], acc: [0, 0, 0, 0] });
  const rerender = useRerender();
  // The rate that makes the corrected version match the naive one at 60 FPS
  const lambda = -Math.log(1 - k) * 60;

  const ref = useRaf(true, dt => {
    const s = st.current, fps = [fpsA, fpsB, fpsA, fpsB];
    for (let i = 0; i < 4; i++) {
      s.acc[i] += dt;
      const h = 1 / fps[i];
      while (s.acc[i] >= h) {
        s.acc[i] -= h;
        const a = i < 2 ? k : 1 - Math.exp(-lambda * h);
        s.x[i] += (target.current - s.x[i]) * a;
      }
    }
    rerender();
  });

  const LX = (u: number) => X0 + u * (X1 - X0);
  const drag = useDrag<"t">(p => (Math.abs(p.x - LX(target.current)) < 18 && p.y > 20 && p.y < 140 ? "t" : null),
    (_, p) => { target.current = clamp((p.x - X0) / (X1 - X0), 0, 1); });

  // Step response over 1.2 s, exact per frame
  const pl = plot({ W, H: 170, x0: -0.04, x1: 1.25, y0: -0.08, y1: 1.12 });
  const steps = (fps: number, corrected: boolean) => {
    const h = 1 / fps, a = corrected ? 1 - Math.exp(-lambda * h) : k;
    let x = 0, d = `M${pl.X(0)},${pl.Y(0)}`;
    for (let tt = 0; tt < 1.25; tt += h) {
      const nx = x + (1 - x) * a;
      d += ` L${pl.X(tt + h).toFixed(1)},${pl.Y(x).toFixed(1)} L${pl.X(tt + h).toFixed(1)},${pl.Y(nx).toFixed(1)}`;
      x = nx;
    }
    return d;
  };
  const s = st.current;

  return (
    <Figure
      title={tx(t, "figSmooth_title", "Following a target: per-frame lerp vs exponential decay")}
      controls={<>
        <Sliders>
          <Slider label="k" value={k} min={0.02} max={0.5} step={0.01} onChange={setK} />
          <Slider label={tx(t, "figSmooth_fpsA", "FPS A")} value={fpsA} min={10} max={60} step={1} onChange={setFpsA} fmt={v => `${v}`} />
          <Slider label={tx(t, "figSmooth_fpsB", "FPS B")} value={fpsB} min={60} max={240} step={1} onChange={setFpsB} fmt={v => `${v}`} />
        </Sliders>
        <Row>
          <Readout>λ = −ln(1 − k)·60 = {lambda.toFixed(2)} /s</Readout>
          <Readout>{tx(t, "figSmooth_half", "half-life")} ln2/λ = {((Math.LN2 / lambda) * 1000).toFixed(0)} ms</Readout>
        </Row>
      </>}
      note={tx(t, "figSmooth_note", "Drag the white target. In the top lane the follower at the higher frame rate catches up much faster, because it takes a k-sized bite more often per second: at 144 FPS it is about seven times quicker than at 20 FPS. In the lower lane both followers use 1 − e^(−λ·dt), and they move together: a frame twice as long takes a bigger bite by exactly the right amount. The plot shows the same thing for a jump of the target from 0 to 1: the naive staircases separate, the corrected staircases sit on one curve, 1 − e^(−λt).")}
    >
      <div ref={ref}>
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} 138`} className="w-full h-auto cursor-ew-resize">
          {[[LANE_A, tx(t, "figSmooth_naive", "x += (target − x)·k   (per frame)")], [LANE_B, tx(t, "figSmooth_fixed", "x += (target − x)·(1 − e^(−λ·dt))")]].map(([y, label], i) => (
            <g key={i}>
              <T x={X0} y={(y as number) - 22} size={8.5} color={i ? C.green : C.red}>{label as string}</T>
              <line x1={X0} x2={X1} y1={y as number} y2={y as number} stroke="var(--code-border)" strokeWidth={5} strokeLinecap="round" />
              <circle cx={LX(s.x[i * 2])} cy={(y as number) - 7} r={6} fill={C.amber} />
              <circle cx={LX(s.x[i * 2 + 1])} cy={(y as number) + 7} r={6} fill={C.sky} />
            </g>
          ))}
          <line x1={LX(target.current)} x2={LX(target.current)} y1={24} y2={126} stroke={C.fg} strokeWidth={2} />
          <circle cx={LX(target.current)} cy={24} r={6} fill={C.fg} />
          <T x={X1} y={134} size={8} anchor="end" color={C.amber}>{`● ${fpsA} FPS`}</T>
          <T x={X1 - 70} y={134} size={8} anchor="end" color={C.sky}>{`● ${fpsB} FPS`}</T>
        </svg>
        <svg viewBox={`0 0 ${W} 170`} className="w-full h-auto border-t border-[var(--border)]">
          <Grid p={pl} step={0.1} major={0.5} labels={false} />
          <path d={steps(fpsA, false)} fill="none" stroke={C.red} strokeWidth={1.5} />
          <path d={steps(fpsB, false)} fill="none" stroke={C.red} strokeWidth={1.5} opacity={0.55} strokeDasharray="4 2" />
          <path d={steps(fpsA, true)} fill="none" stroke={C.green} strokeWidth={1.5} />
          <path d={steps(fpsB, true)} fill="none" stroke={C.green} strokeWidth={1.5} opacity={0.6} strokeDasharray="4 2" />
          <T x={pl.X(0.01)} y={14} size={8.5}>{tx(t, "figSmooth_plot", "response to a jump 0 → 1 over 1.2 s · solid: FPS A · dashed: FPS B")}</T>
          {[0.5, 1].map(x => <T key={x} x={pl.X(x)} y={pl.Y(0) + 11} size={8} anchor="middle">{`${x} s`}</T>)}
        </svg>
      </div>
    </Figure>
  );
}
