"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Slider, Sliders, Row, Readout, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Tunnelling: a bullet moves v·dt per step. A discrete test only checks where
// the bullet IS at the end of each step, so a wall thinner than one step can
// fall between two samples. A swept test checks the whole segment travelled
// during the step (here: a ray against the wall's slab), and finds the exact
// fraction of the step at which the bullet touched the wall.

const W = 560, H = 190, Y = 110, X0 = 30;

/** Bullet positions at the end of each step, and what each test concludes. */
function samples(phase: number, step: number, wallX: number, thick: number) {
  const xs: number[] = [];
  for (let x = X0 + phase * step; x < W - 10; x += step) xs.push(x);
  const insideAt = xs.findIndex(x => x >= wallX && x <= wallX + thick);
  // Swept: the first segment [xᵢ, xᵢ₊₁] that crosses the wall's front face
  const sweptSeg = xs.findIndex((x, i) => i + 1 < xs.length && x < wallX && xs[i + 1] >= wallX);
  const tHit = sweptSeg >= 0 ? (wallX - xs[sweptSeg]) / (xs[sweptSeg + 1] - xs[sweptSeg]) : 0;
  return { xs, insideAt, sweptSeg, tHit };
}

export function TunnelFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"discrete" | "swept">("discrete");
  const [speed, setSpeed] = useState(1800);      // px per second
  const [fps, setFps] = useState(60);
  const [thick, setThick] = useState(12);
  const [phase, setPhase] = useState(0.3);        // where the first sample falls within a step
  const dt = 1 / fps, step = speed * dt;
  const wallX = 330;

  const { xs, insideAt, sweptSeg, tHit } = samples(phase, step, wallX, thick);
  const discreteHit = insideAt >= 0;
  const hit = mode === "discrete" ? discreteHit : sweptSeg >= 0;
  const stopAt = mode === "discrete" ? (discreteHit ? insideAt : xs.length - 1) : sweptSeg >= 0 ? sweptSeg + 1 : xs.length - 1;

  return (
    <Figure
      title={tx(t, "figTunnel_title", "Tunnelling: discrete vs swept collision")}
      head={<Choice value={mode} onChange={setMode} options={[["discrete", tx(t, "figTunnel_disc", "discrete (check end positions)")], ["swept", tx(t, "figTunnel_swept", "swept (check the path)")]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figTunnel_speed", "speed")} value={speed} min={200} max={4000} step={50} onChange={setSpeed} fmt={v => `${v} px/s`} />
          <Slider label="FPS" value={fps} min={20} max={240} step={1} onChange={setFps} fmt={v => `${v}`} />
          <Slider label={tx(t, "figTunnel_thick", "wall thickness")} value={thick} min={2} max={80} step={1} onChange={setThick} fmt={v => `${v} px`} />
          <Slider label={tx(t, "figTunnel_phase", "start offset")} value={phase} min={0} max={0.99} step={0.01} onChange={setPhase} />
        </Sliders>
        <Row>
          <Readout>{tx(t, "figTunnel_step", "step")} v·dt = {step.toFixed(1)} px</Readout>
          <Readout color={step > thick ? C.red : C.green}>{step > thick ? tx(t, "figTunnel_risk", "step > wall: can tunnel") : tx(t, "figTunnel_safe", "step ≤ wall: discrete is safe")}</Readout>
          <Readout color={hit ? C.green : C.red}>{hit ? tx(t, "figTunnel_hit", "hit detected") : tx(t, "figTunnel_miss", "passed through!")}</Readout>
          {mode === "swept" && sweptSeg >= 0 && <Readout color={C.amber}>t = {tHit.toFixed(3)} {tx(t, "figTunnel_ofStep", "of step")} {sweptSeg + 1}</Readout>}
        </Row>
      </>}
      note={tx(t, "figTunnel_note", "Each dot is where the bullet is after one step. In discrete mode the wall only notices the bullet if a dot lands inside it, so when one step (v·dt) is longer than the wall is thick, whether it hits depends on luck: slide the start offset. The swept test looks at the segment between consecutive dots and solves for the moment it crosses the wall's face, t ∈ [0, 1] of the step, so it can never miss. Lowering the FPS makes every step longer and tunnelling more likely, one more reason physics should run at a fixed rate.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={wallX} y={30} width={thick} height={140} fill={C.muted} opacity={0.5} stroke={C.fg} strokeOpacity={0.4} />
        <T x={wallX + thick / 2} y={24} size={8.5} anchor="middle">{tx(t, "figTunnel_wall", "wall")}</T>
        <line x1={X0} x2={W - 10} y1={Y} y2={Y} stroke={C.axis} strokeDasharray="2 4" />
        {mode === "swept" && xs.slice(0, stopAt + 1).map((x, i) => i > 0 && (
          <line key={`s${i}`} x1={xs[i - 1]} x2={i === stopAt && sweptSeg >= 0 ? xs[i - 1] + (x - xs[i - 1]) * tHit : x} y1={Y} y2={Y}
            stroke={i === stopAt && sweptSeg >= 0 ? C.amber : C.sky} strokeWidth={3} opacity={0.7} />
        ))}
        {xs.map((x, i) => {
          const after = i > stopAt;
          const inside = x >= wallX && x <= wallX + thick;
          return <circle key={i} cx={x} cy={Y} r={4} fill={inside ? C.green : after ? C.muted : C.sky} opacity={after ? 0.25 : 1} />;
        })}
        {mode === "swept" && sweptSeg >= 0 && <circle cx={xs[sweptSeg] + (xs[sweptSeg + 1] - xs[sweptSeg]) * tHit} cy={Y} r={7} fill="none" stroke={C.amber} strokeWidth={2.2} />}
        {mode === "discrete" && !discreteHit && (() => {
          const i = xs.findIndex(x => x > wallX + thick);
          return i > 0 && <T x={(xs[i - 1] + xs[i]) / 2} y={Y + 30} size={9} anchor="middle" color={C.red}>{tx(t, "figTunnel_gap", "no sample inside the wall")}</T>;
        })()}
        <T x={X0} y={H - 10} size={8.5}>{`●  ${tx(t, "figTunnel_legend", "position at the end of each step")}`}</T>
      </svg>
    </Figure>
  );
}
