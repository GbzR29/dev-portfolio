"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, T, Handle, Vec, mulberry32, useDrag, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { add, arrive, flee, flockForces, integrate, len, mul, seek, sub, wander, wanderTarget, type Agent, type FlockWeights, type V2 } from "./steer";

// ── What this figure shows ────────────────────────────────────────────────────
// Steering behaviours. One agent with seek, arrive, flee or wander: drag the
// target and watch three arrows, the velocity (blue), the desired velocity
// (green) and the steering force between them (red). Seek overshoots and
// circles the target; arrive slows down inside its radius and stops. Flock
// runs 40 boids with Reynolds' three rules; the sliders weight them, and
// separation 0 collapses the flock onto single points.

const W = 600, H = 300;
type Mode = "seek" | "arrive" | "flee" | "wander" | "flock";
const ONE = { maxSpeed: 150, maxForce: 400 };
const FLOCK = { maxSpeed: 90, maxForce: 300 };

const makeBoids = () => {
  const rng = mulberry32(3);
  return Array.from({ length: 40 }, (): Agent => { const a = rng() * Math.PI * 2; return { p: { x: rng() * W, y: rng() * H }, v: { x: Math.cos(a) * 60, y: Math.sin(a) * 60 }, wander: 0 }; });
};
const wrap = (a: Agent) => { a.p = { x: (a.p.x + W) % W, y: (a.p.y + H) % H }; };

export function SteeringFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("arrive");
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(100);
  const [w, setW] = useState<FlockWeights>({ separation: 1.5, alignment: 1, cohesion: 1, radius: 50 });
  const agent = useRef<Agent>({ p: { x: 80, y: 150 }, v: { x: 0, y: 0 }, wander: 0 });
  const target = useRef<V2>({ x: 460, y: 150 });
  const boids = useRef<Agent[]>(makeBoids());
  const rng = useRef(mulberry32(9));
  const trail = useRef<V2[]>([]);
  const vis = useVisible<HTMLDivElement>();
  const rerender = useRerender();
  const L = (k: string, en: string) => tx(t, `figAiSteer_${k}`, en);

  const drag = useDrag<"target">(
    p => (mode !== "wander" && mode !== "flock" && Math.hypot(p.x - target.current.x, p.y - target.current.y) < 26 ? "target" : null),
    (_, p) => { target.current = { x: Math.max(8, Math.min(W - 8, p.x)), y: Math.max(8, Math.min(H - 8, p.y)) }; rerender(); },
  );

  const force = (a: Agent): V2 => {
    switch (mode) {
      case "seek": return seek(a, target.current, ONE);
      case "arrive": return arrive(a, target.current, ONE, slow);
      case "flee": return flee(a, target.current, ONE);
      default: return wander(a, ONE, rng.current, 0.35);
    }
  };

  useFrame(playing && vis.on, dt => {
    if (mode === "flock") {
      const B = boids.current, F = B.map((_, i) => flockForces(B, i, w, FLOCK).total);
      B.forEach((b, i) => { integrate(b, F[i], FLOCK, dt); wrap(b); });
    } else {
      const a = agent.current;
      integrate(a, force(a), ONE, dt);
      if (mode === "flee" || mode === "wander") wrap(a);
      trail.current.push({ ...a.p });
      if (trail.current.length > 160) trail.current.shift();
    }
    rerender();
  });

  const reset = (m = mode) => {
    agent.current = { p: { x: 80, y: 150 }, v: { x: m === "wander" ? 60 : 0, y: 0 }, wander: 0 };
    target.current = { x: m === "flee" ? 200 : 460, y: 150 };
    boids.current = makeBoids();
    trail.current = [];
    setMode(m);
  };

  const a = agent.current, tg = target.current;
  const single = mode !== "flock";
  // the arrows, scaled so 150 px/s draws 60 px
  const k = 0.4;
  // desired = velocity + steering; wander's is read from its circle point without nudging the angle again
  const desired = !single ? { x: 0, y: 0 } : mode === "wander" ? add(a.v, seek(a, wanderTarget(a, 50, 25), ONE)) : add(a.v, force(a));
  const steer = sub(desired, a.v);
  const dist = len(sub(tg, a.p));

  // nearest-neighbour spacing of the flock, for the readout
  let spacing = 0;
  if (!single) {
    const B = boids.current;
    for (let i = 0; i < B.length; i++) {
      let m = Infinity;
      for (let j = 0; j < B.length; j++) if (i !== j) {
        const dx = Math.abs(B[i].p.x - B[j].p.x), dy = Math.abs(B[i].p.y - B[j].p.y);
        m = Math.min(m, Math.hypot(Math.min(dx, W - dx), Math.min(dy, H - dy)));
      }
      spacing += m / B.length;
    }
  }

  return (
    <Figure
      title={L("title", "Steering behaviours and a flock")}
      head={<Choice value={mode} onChange={m => reset(m)} options={[["seek", "seek"], ["arrive", "arrive"], ["flee", "flee"], ["wander", "wander"], ["flock", L("flock", "flock")]] as const} />}
      controls={<>
        {mode === "arrive" && <Slider label={L("slow", "slowing radius")} value={slow} min={10} max={200} step={5} onChange={setSlow} fmt={v => v.toFixed(0)} />}
        {mode === "flock" && <Sliders>
          <Slider label={L("sep", "separation")} value={w.separation} min={0} max={3} step={0.1} onChange={v => setW(o => ({ ...o, separation: v }))} />
          <Slider label={L("ali", "alignment")} value={w.alignment} min={0} max={3} step={0.1} onChange={v => setW(o => ({ ...o, alignment: v }))} />
          <Slider label={L("coh", "cohesion")} value={w.cohesion} min={0} max={3} step={0.1} onChange={v => setW(o => ({ ...o, cohesion: v }))} />
          <Slider label={L("radius", "neighbour radius")} value={w.radius} min={20} max={120} step={5} onChange={v => setW(o => ({ ...o, radius: v }))} fmt={v => v.toFixed(0)} />
        </Sliders>}
        <Row>
          {single && <Readout>{L("speed", "speed")} {len(a.v).toFixed(0)}</Readout>}
          {single && mode !== "wander" && <Readout>{L("dist", "distance to target")} {dist.toFixed(0)}</Readout>}
          {!single && <Readout>{L("spacing", "average gap to nearest boid")} {spacing.toFixed(1)}</Readout>}
        </Row>
      </>}
      note={L("note", "Press play. In every mode the agent computes a desired velocity (green), and the steering force (red) is simply the desired velocity minus the current one (blue): the agent turns its velocity toward what it wants, limited by a maximum force, so it moves in curves rather than snapping. Seek always wants full speed toward the target, so it arrives fast, overshoots by about 28 pixels, turns and overshoots again, circling for ever. Arrive wants a speed proportional to the distance once inside the slowing radius (the dashed circle) and stops without overshooting; drag the target and watch it glide in. Flee is seek turned around. Wander seeks a point that drifts at random on a small circle ahead of the agent, which gives smooth, natural meandering. Flock: each of 40 boids steers by three rules over the neighbours within the radius: separation (move away from boids that are too close), alignment (match their heading) and cohesion (move toward their centre). Set separation to 0 and the boids pile onto each other; set alignment to 0 and the flock stops travelling together.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          <rect x={1} y={1} width={W - 2} height={H - 2} rx={6} fill="none" stroke={C.axis} />
          {single ? <g>
            {trail.current.length > 1 && <polyline points={trail.current.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={C.muted} strokeOpacity={0.35}
              strokeDasharray="2 3" />}
            {mode === "arrive" && <circle cx={tg.x} cy={tg.y} r={slow} fill="none" stroke={C.green} strokeOpacity={0.5} strokeDasharray="5 4" />}
            {mode === "wander" && (() => {
              const h = Math.atan2(a.v.y, a.v.x), c = add(a.p, { x: Math.cos(h) * 50, y: Math.sin(h) * 50 }), wt = wanderTarget(a, 50, 25);
              return <g><circle cx={c.x} cy={c.y} r={25} fill="none" stroke={C.muted} strokeDasharray="3 3" /><circle cx={wt.x} cy={wt.y} r={4} fill={C.green} /></g>;
            })()}
            {mode !== "wander" && <Handle x={tg.x} y={tg.y} r={7} color={mode === "flee" ? C.red : C.green} active={drag.dragging === "target"} />}
            {len(a.v) > 1 && <Vec a={a.p} b={add(a.p, mul(a.v, k))} color={C.sky} w={2.4} />}
            {len(desired) > 1 && <Vec a={a.p} b={add(a.p, mul(desired, k))} color={C.green} w={2} dash="5 3" />}
            {len(steer) > 1 && <Vec a={add(a.p, mul(a.v, k))} b={add(a.p, mul(desired, k))} color={C.red} w={2} />}
            <circle cx={a.p.x} cy={a.p.y} r={9} fill={C.purple} />
            <T x={10} y={18} size={9} color={C.sky}>{L("vel", "velocity")}</T>
            <T x={70} y={18} size={9} color={C.green}>{L("desired", "desired")}</T>
            <T x={124} y={18} size={9} color={C.red}>{L("steer", "steering = desired − velocity")}</T>
          </g> : <g>
            {boids.current.map((b, i) => {
              const h = Math.atan2(b.v.y, b.v.x), c = Math.cos(h), s = Math.sin(h);
              const pts = [[9, 0], [-6, 4.5], [-6, -4.5]].map(([x, y]) => `${b.p.x + x * c - y * s},${b.p.y + x * s + y * c}`).join(" ");
              return <polygon key={i} points={pts} fill={i === 0 ? C.amber : C.sky} fillOpacity={0.85} />;
            })}
            {(() => { const b = boids.current[0]; return <circle cx={b.p.x} cy={b.p.y} r={w.radius} fill="none" stroke={C.amber} strokeOpacity={0.5} strokeDasharray="4 3" />; })()}
          </g>}
        </svg>
        <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)} onReset={() => reset()} />
      </div>
    </Figure>
  );
}
