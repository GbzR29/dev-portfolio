"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, Sliders, T, f2, mulberry32, svgPoint, useRaf, useRerender } from "@/components/lesson/kit/figure";
import { PIT_H, PIT_W, makeBalls, stepPit, type Ball, type PitParams } from "./ballPit";

// ── What this figure shows ────────────────────────────────────────────────────
// Balls of different sizes (mass ∝ area) in a box, resolved with impulses at a
// fixed 120 Hz step. The restitution sets how bouncy they are, friction how
// much they slide, and the iteration count how many times per step the solver
// sweeps over all contacts: with 1 iteration a pile cannot pass forces down
// through itself and sags into the floor. Switch positional correction off and
// the small overlaps each step leaves behind are never undone: the pile sinks.
// Drag a ball to throw it.

const S = 80, W = PIT_W * S, H = PIT_H * S, STEP = 1 / 120;
const DEFAULT: PitParams = { gravity: 9.8, e: 0.5, mu: 0.3, iterations: 8, correction: true, percent: 0.8, slop: 0.01, restThreshold: 0.5 };

export function BallPitFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState<PitParams>(DEFAULT);
  const [playing, setPlaying] = useState(true);
  const balls = useRef<Ball[]>(makeBalls(16, mulberry32(3)));
  const acc = useRef(0);
  const worst = useRef(0);
  const grab = useRef<{ i: number; x: number; y: number; t: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const rerender = useRerender();
  const set = <K extends keyof PitParams>(k: K, v: PitParams[K]) => setP(o => ({ ...o, [k]: v }));

  const rafRef = useRaf(playing, dt => {
    acc.current += dt;
    while (acc.current >= STEP) {
      acc.current -= STEP;
      const g = grab.current;
      if (g) { const b = balls.current[g.i]; b.x = g.x; b.y = g.y; }
      worst.current = stepPit(balls.current, p, STEP);
      // A held ball follows the pointer; its velocity is kept from the drag
      if (g) { const b = balls.current[g.i]; b.x = g.x; b.y = g.y; }
    }
    rerender();
  });

  const toWorld = (e: React.PointerEvent) => { const q = svgPoint(svg.current!, e); return { x: q.x / S, y: (H - q.y) / S }; };
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const w = toWorld(e);
    const i = balls.current.findIndex(b => Math.hypot(b.x - w.x, b.y - w.y) < b.r + 0.1);
    if (i < 0) return;
    svg.current!.setPointerCapture(e.pointerId);
    grab.current = { i, ...w, t: performance.now() };
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = grab.current;
    if (!g) return;
    const w = toWorld(e), now = performance.now(), dt = Math.max(1, now - g.t) / 1000;
    const b = balls.current[g.i];
    b.vx = (w.x - g.x) / dt; b.vy = (w.y - g.y) / dt;
    grab.current = { i: g.i, x: Math.min(PIT_W - b.r, Math.max(b.r, w.x)), y: Math.min(PIT_H - b.r, Math.max(b.r, w.y)), t: now };
  };
  const onUp = () => { grab.current = null; };

  const ke = balls.current.reduce((s, b) => s + (0.5 * (b.vx * b.vx + b.vy * b.vy)) / b.invM, 0);

  return (
    <Figure
      title={tx(t, "figPit_title", "Impulses in a ball pit")}
      head={<>
        <Btn active={playing} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</Btn>
        <Btn onClick={() => { balls.current = makeBalls(16, mulberry32(Math.floor(Math.random() * 1e6))); rerender(); }}>{tx(t, "figPit_reset", "new balls")}</Btn>
        <Btn onClick={() => { for (const b of balls.current) { b.vx += (Math.random() - 0.5) * 8; b.vy += 4 + Math.random() * 4; } }}>{tx(t, "figPit_shake", "shake")}</Btn>
      </>}
      controls={<>
        <Row>
          <Btn active={p.correction} onClick={() => set("correction", !p.correction)}>{p.correction ? "✓ " : ""}{tx(t, "figPit_corr", "positional correction")}</Btn>
          <Btn active={p.gravity > 0} onClick={() => set("gravity", p.gravity > 0 ? 0 : 9.8)}>{p.gravity > 0 ? "✓ " : ""}{tx(t, "figPit_grav", "gravity")}</Btn>
          <Btn onClick={() => setP(DEFAULT)}>{tx(t, "figPit_defaults", "defaults")}</Btn>
        </Row>
        <Sliders>
          <Slider label={tx(t, "figPit_e", "restitution e")} value={p.e} min={0} max={1} step={0.05} onChange={v => set("e", v)} width="w-28" />
          <Slider label={tx(t, "figPit_mu", "friction μ")} value={p.mu} min={0} max={1} step={0.05} onChange={v => set("mu", v)} width="w-28" />
          <Slider label={tx(t, "figPit_iter", "iterations")} value={p.iterations} min={1} max={20} step={1} onChange={v => set("iterations", v)} fmt={v => String(v)} width="w-28" />
          <Slider label={tx(t, "figPit_pct", "correction %")} value={p.percent} min={0.1} max={1} step={0.05} onChange={v => set("percent", v)} fmt={v => `${Math.round(v * 100)}%`} width="w-28" />
        </Sliders>
        <Row>
          <Readout>{tx(t, "figPit_ke", "kinetic energy")}: {f2(ke, 1)} J</Readout>
          <Readout color={worst.current > 0.05 ? C.red : C.green}>{tx(t, "figPit_overlap", "deepest overlap")}: {f2(worst.current * 100, 1)} cm</Readout>
        </Row>
      </>}
      note={tx(t, "figPit_note", "Every step finds all contacts, then sweeps over them several times, each time applying the impulse that fixes that one contact with the latest velocities. A contact can only push, so the accumulated normal impulse is clamped at zero, and friction can remove at most μ times it along the surface. Try 1 iteration: the bottom balls cannot hold the weight above them in a single sweep, and the pile squashes. Turn positional correction off: gravity pulls a little into the floor every step and nothing pushes back, so the pile slowly sinks. Contacts slower than 0.5 m/s get e = 0, otherwise resting balls would buzz on the floor.")}
    >
      <div ref={rafRef}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full block cursor-grab" style={{ touchAction: "none" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <rect x={0} y={0} width={W} height={H} fill="none" stroke={C.axis} strokeWidth={2} />
          {balls.current.map((b, i) => (
            <g key={i}>
              <circle cx={b.x * S} cy={H - b.y * S} r={b.r * S} fill={[C.orange, C.sky, C.green, C.pink, C.purple, C.amber][i % 6]}
                opacity={grab.current?.i === i ? 1 : 0.8} stroke={grab.current?.i === i ? C.fg : "none"} strokeWidth={2} />
            </g>
          ))}
          <T x={8} y={16} size={9}>{tx(t, "figPit_hint", "drag a ball to throw it")}</T>
        </svg>
      </div>
    </Figure>
  );
}
