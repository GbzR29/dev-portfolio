"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Slider, Sliders, Row, Readout, Btn, C, T, plot, Grid, fnPath, useRaf, useRerender, useDrag, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A damped spring x″ = −ω²(x − target) − 2ζω·x′, parameterised the way game
// code should: ω = 2π·f (how fast it oscillates, in Hz) and ζ (damping ratio:
// < 1 bounces, = 1 settles fastest without overshoot, > 1 creeps). Top: drag
// the target; the block follows through the spring, integrated with
// semi-implicit Euler at a fixed 120 Hz. Bottom: the exact response to a unit
// step for the current f and ζ.

const W = 560, X0 = 40, X1 = 520;

/** Exact unit-step response of the damped oscillator starting at rest at 0. */
function stepResponse(tt: number, w: number, z: number) {
  if (z < 0.999) {
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * tt) * (Math.cos(wd * tt) + (z * w / wd) * Math.sin(wd * tt));
  }
  if (z < 1.001) return 1 - Math.exp(-w * tt) * (1 + w * tt);
  const s = Math.sqrt(z * z - 1), r1 = -w * (z - s), r2 = -w * (z + s);
  return 1 - (r2 * Math.exp(r1 * tt) - r1 * Math.exp(r2 * tt)) / (r2 - r1);
}

export function SpringFigure({ t }: { t?: TrackTranslations }) {
  const [f, setF] = useState(2);
  const [z, setZ] = useState(0.35);
  const target = useRef(0.75);
  const st = useRef({ x: 0.25, v: 0, acc: 0, trail: [] as number[] });
  const rerender = useRerender();
  const w = 2 * Math.PI * f;

  const ref = useRaf(true, dt => {
    const s = st.current, h = 1 / 120;
    s.acc += dt;
    while (s.acc >= h) {
      s.acc -= h;
      const a = -w * w * (s.x - target.current) - 2 * z * w * s.v;
      s.v += a * h;          // semi-implicit Euler: velocity first,
      s.x += s.v * h;        // then position with the new velocity
    }
    s.trail.push(s.x);
    if (s.trail.length > 160) s.trail.shift();
    rerender();
  });

  const LX = (u: number) => X0 + u * (X1 - X0);
  const drag = useDrag<"t">(p => (Math.abs(p.x - LX(target.current)) < 20 ? "t" : null),
    (_, p) => { target.current = clamp((p.x - X0) / (X1 - X0), 0, 1); });

  const pl = plot({ W, H: 160, x0: -0.05, x1: 2.05, y0: -0.15, y1: 1.75 });
  const regime = z < 0.999 ? tx(t, "figSpring_under", "under-damped: overshoots and rings") : z < 1.001 ? tx(t, "figSpring_crit", "critically damped: fastest without overshoot") : tx(t, "figSpring_over", "over-damped: slow, no overshoot");
  const overshoot = z < 1 ? Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z)) : 0;
  const s = st.current;
  const blockX = LX(s.x);
  // Spring zig-zag from the target to the block
  const tX = LX(target.current), coils = 12;
  let zig = `M${tX},62`;
  for (let i = 1; i < coils; i++) zig += ` L${tX + ((blockX - tX) * i) / coils},${62 + (i % 2 ? -7 : 7)}`;
  zig += ` L${blockX},62`;

  return (
    <Figure
      title={tx(t, "figSpring_title", "Damped spring: frequency and damping ratio")}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figSpring_f", "frequency f")} value={f} min={0.3} max={6} step={0.1} onChange={setF} fmt={v => `${v.toFixed(1)} Hz`} />
          <Slider label={tx(t, "figSpring_z", "damping ζ")} value={z} min={0} max={2.5} step={0.01} onChange={setZ} />
        </Sliders>
        <Row>
          {[[0.15, "ζ = 0.15"], [0.5, "ζ = 0.5"], [1, "ζ = 1"], [2, "ζ = 2"]].map(([v, l]) => (
            <Btn key={l as string} active={Math.abs(z - (v as number)) < 0.005} onClick={() => setZ(v as number)}>{l as string}</Btn>
          ))}
          <span className="ml-auto flex gap-1.5 flex-wrap">
            <Readout>ω = 2πf = {w.toFixed(1)} rad/s</Readout>
            <Readout color={C.amber}>{tx(t, "figSpring_os", "overshoot")} {(overshoot * 100).toFixed(0)}%</Readout>
          </span>
        </Row>
      </>}
      note={<>{regime}. {tx(t, "figSpring_note", "Drag the white target. f sets how quickly the spring reacts (the time scale), ζ sets the character. The two are independent, which is the point of this parameterisation: you can make a camera snappier by raising f without making it bouncier. The curve below is the exact solution for a jump of the target from 0 to 1; its first peak is the overshoot, e^(−πζ/√(1−ζ²)).")}</>}
    >
      <div ref={ref}>
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} 110`} className="w-full h-auto cursor-ew-resize">
          <line x1={X0} x2={X1} y1={84} y2={84} stroke="var(--code-border)" strokeWidth={3} />
          {s.trail.map((x, i) => i % 4 === 0 && <circle key={i} cx={LX(x)} cy={98} r={1.4} fill={C.sky} opacity={i / s.trail.length} />)}
          <path d={zig} fill="none" stroke={C.muted} strokeWidth={1.4} />
          <rect x={blockX - 13} y={49} width={26} height={26} rx={5} fill={C.sky} />
          <line x1={tX} x2={tX} y1={20} y2={96} stroke={C.fg} strokeWidth={2} />
          <circle cx={tX} cy={20} r={6} fill={C.fg} />
          <T x={tX + 9} y={23} size={8.5}>target</T>
        </svg>
        <svg viewBox={`0 0 ${W} 160`} className="w-full h-auto border-t border-[var(--border)]">
          <Grid p={pl} step={0.25} major={1} labels={false} />
          <line x1={0} x2={W} y1={pl.Y(1)} y2={pl.Y(1)} stroke={C.fg} strokeDasharray="4 3" opacity={0.6} />
          <path d={fnPath(pl, tt => stepResponse(Math.max(0, tt), w, z), 0, 2, 400)} fill="none" stroke={C.sky} strokeWidth={2} />
          {[0.5, 1, 1.5, 2].map(x => <T key={x} x={pl.X(x)} y={pl.Y(0) + 11} size={8} anchor="middle">{`${x} s`}</T>)}
          <T x={pl.X(0.02)} y={13} size={8.5}>{tx(t, "figSpring_plot", "exact step response x(t), target jumps 0 → 1 at t = 0")}</T>
        </svg>
      </div>
    </Figure>
  );
}
