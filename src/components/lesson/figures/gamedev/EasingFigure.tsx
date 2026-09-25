"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T, useRaf, useRerender, fnPath, plot } from "@/components/lesson/kit/figure";
import { IN, ease, type Variant } from "./easings";

// ── What this figure shows ────────────────────────────────────────────────────
// Left: the easing curve f(t), progress against normalised time, with the
// current t marked; optionally its slope f′(t), which is the speed. Right: the
// same f(t) driving a position (with a linear ghost for comparison), a scale
// and a rotation, so the numbers turn into motion.

const NAMES = Object.keys(IN);
const W = 560, H = 236;

export function EasingFigure({ t }: { t?: TrackTranslations }) {
  const [name, setName] = useState("cubic");
  const [variant, setVariant] = useState<Variant>("inOut");
  const [dur, setDur] = useState(1.2);
  const [speed, setSpeed] = useState(false);
  const [running, setRunning] = useState(true);
  const clock = useRef(0);
  const rerender = useRerender();
  const ref = useRaf(running, dt => { clock.current += dt; rerender(); });

  const f = ease(name, variant);
  // Timeline: play for `dur`, hold 0.5 s, play backwards, hold 0.5 s
  const cyc = 2 * dur + 1, c = clock.current % cyc;
  const tt = c < dur ? c / dur : c < dur + 0.5 ? 1 : c < 2 * dur + 0.5 ? 1 - (c - dur - 0.5) / dur : 0;
  const y = f(tt);

  const p = plot({ W: 210, H: 210, x0: -0.08, x1: 1.08, y0: -0.45, y1: 1.45 });
  const ox = 14, oy = 14;
  const dfdt = (x: number) => (f(Math.min(1, x + 1e-3)) - f(Math.max(0, x - 1e-3))) / (Math.min(1, x + 1e-3) - Math.max(0, x - 1e-3));
  const lane = (y0: number) => ({ a: 262, b: 540, y: y0 });
  const L1 = lane(44), px = L1.a + (L1.b - L1.a) * y, pxLin = L1.a + (L1.b - L1.a) * tt;

  return (
    <Figure
      title={tx(t, "figEase_title", "Easing explorer")}
      head={<>
        <Btn active={running} onClick={() => setRunning(r => !r)}>{running ? "❚❚" : "▶"}</Btn>
        <Choice value={variant} onChange={setVariant} options={[["in", "in"], ["out", "out"], ["inOut", "inOut"]] as const} />
      </>}
      controls={<>
        <Row>{NAMES.map(n => <Btn key={n} active={name === n} onClick={() => setName(n)}>{n}</Btn>)}</Row>
        <Row>
          <div className="flex-1 min-w-[220px]"><Slider label={tx(t, "figEase_dur", "duration")} value={dur} min={0.3} max={3} onChange={setDur} fmt={v => `${v.toFixed(1)} s`} /></div>
          <Btn active={speed} onClick={() => setSpeed(s => !s)}>{tx(t, "figEase_speed", "show speed f′(t)")}</Btn>
          <Readout>t = {tt.toFixed(2)}</Readout>
          <Readout color={C.pink}>f(t) = {y.toFixed(3)}</Readout>
        </Row>
      </>}
      note={tx(t, "figEase_note", "The horizontal axis is time, the vertical axis is how far along the motion is. A steep part of the curve is fast motion, a flat part is slow. \"in\" curves start slow and end fast (good for things leaving the screen), \"out\" curves start fast and settle (good for things arriving, which is why ease-out is the default for UI), \"inOut\" does both. back and elastic leave the 0–1 band on purpose: that overshoot is what makes them feel springy. The grey ghost moves linearly for comparison: both arrive at the same moment, only the pacing differs.")}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <g transform={`translate(${ox},${oy})`}>
            <rect x={p.X(0)} y={p.Y(1)} width={p.X(1) - p.X(0)} height={p.Y(0) - p.Y(1)} fill="var(--code-surface)" stroke="var(--code-border)" />
            <line x1={p.X(0)} x2={p.X(1)} y1={p.Y(0)} y2={p.Y(1)} stroke={C.axis} strokeDasharray="3 3" />
            {speed && <path d={fnPath(p, x => dfdt(x) * 0.33, 0, 1, 200)} fill="none" stroke={C.amber} strokeWidth={1.3} opacity={0.9} />}
            <path d={fnPath(p, f, 0, 1, 300)} fill="none" stroke={C.pink} strokeWidth={2.2} />
            <line x1={p.X(tt)} x2={p.X(tt)} y1={p.Y(0)} y2={p.Y(y)} stroke={C.muted} strokeDasharray="2 3" />
            <line x1={p.X(0)} x2={p.X(tt)} y1={p.Y(y)} y2={p.Y(y)} stroke={C.muted} strokeDasharray="2 3" />
            <circle cx={p.X(tt)} cy={p.Y(y)} r={4.5} fill={C.pink} />
            <T x={p.X(0)} y={p.Y(0) + 12} size={8}>0</T>
            <T x={p.X(1)} y={p.Y(0) + 12} size={8} anchor="end">t = 1</T>
            <T x={p.X(0) - 3} y={p.Y(1) + 3} size={8} anchor="end">1</T>
            {speed && <T x={p.X(0.02)} y={p.Y(1.35)} size={8} color={C.amber}>{tx(t, "figEase_speedLbl", "speed f′(t) ÷ 3")}</T>}
          </g>
          {/* position */}
          <T x={L1.a} y={24} size={8.5}>{tx(t, "figEase_pos", "position")}</T>
          <line x1={L1.a} x2={L1.b} y1={L1.y} y2={L1.y} stroke="var(--code-border)" strokeWidth={6} strokeLinecap="round" />
          <circle cx={pxLin} cy={L1.y + 22} r={7} fill={C.muted} opacity={0.35} />
          <circle cx={px} cy={L1.y} r={10} fill={C.pink} />
          <T x={L1.b} y={L1.y + 42} size={8} anchor="end">{tx(t, "figEase_ghost", "grey: linear")}</T>
          {/* scale */}
          <T x={L1.a} y={112} size={8.5}>{tx(t, "figEase_scale", "scale")}</T>
          <g transform={`translate(${L1.a + 55},${170})`}>
            <rect x={-40} y={-40} width={80} height={80} fill="none" stroke="var(--code-border)" strokeDasharray="3 3" />
            <rect x={-40 * Math.max(0, y)} y={-40 * Math.max(0, y)} width={80 * Math.max(0, y)} height={80 * Math.max(0, y)} rx={6} fill={C.sky} opacity={0.85} />
          </g>
          {/* rotation */}
          <T x={L1.a + 150} y={112} size={8.5}>{tx(t, "figEase_rot", "rotation 0 → 180°")}</T>
          <g transform={`translate(${L1.a + 210},${170}) rotate(${-180 * y})`}>
            <circle r={40} fill="none" stroke="var(--code-border)" />
            <line x1={0} y1={0} x2={38} y2={0} stroke={C.green} strokeWidth={4} strokeLinecap="round" />
            <circle r={5} fill={C.green} />
          </g>
        </svg>
      </div>
    </Figure>
  );
}
