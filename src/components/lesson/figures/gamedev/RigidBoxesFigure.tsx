"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, Sliders, T, svgPoint, useRaf, useRerender } from "@/components/lesson/kit/figure";
import { corners, makeBox, stepWorld, type Body, type Contact, type WorldParams } from "./rigid2d";

// ── What this figure shows ────────────────────────────────────────────────────
// Boxes that rotate: a ground, a ramp and a few dynamic boxes stepped at 120 Hz
// with the sequential-impulse solver of rigid2d.ts. Contact points (dots) and
// normals are drawn; a box standing on another usually has two. Tap empty space
// to drop a box, drag a box to throw it. Fewer iterations or no warm starting
// make a tower wobble and slump; zero friction makes everything slide off the
// ramp.

const WW = 12, WH = 7, S = 55, W = WW * S, H = WH * S, STEP = 1 / 120;
// The view shows y from −FLOOR to WH − FLOOR, so a strip of the ground stays visible
const FLOOR = 0.5;
const sy = (y: number) => H - (y + FLOOR) * S;
const DEFAULT: WorldParams = { gravity: 9.8, e: 0.1, mu: 0.6, iterations: 10, warmStart: true, beta: 0.2, slop: 0.005, restThreshold: 1 };
const COLS = [C.orange, C.sky, C.green, C.pink, C.purple, C.amber, C.teal];
type Scene = "tower" | "ramp" | "pyramid";

function build(scene: Scene): Body[] {
  const out = [makeBox(WW / 2, -0.5, WW + 4, 1, 0)];                      // the ground, static
  if (scene === "ramp") {
    out.push(makeBox(3.6, 1.2, 6, 0.3, 0, -0.35));                         // a static ramp
    for (let i = 0; i < 4; i++) out.push(makeBox(1.2 + i * 0.9, 3.2 + i * 0.6, 0.6, 0.6, 1, 0));
  } else if (scene === "tower") {
    for (let i = 0; i < 6; i++) out.push(makeBox(WW / 2 + (i % 2) * 0.05, 0.4 + i * 0.8, 1.2, 0.8, 1));
  } else {
    for (let row = 0; row < 5; row++) for (let i = 0; i < 5 - row; i++)
      out.push(makeBox(WW / 2 - (4 - row) * 0.36 + i * 0.72, 0.35 + row * 0.7, 0.7, 0.7, 1));
  }
  return out;
}

export function RigidBoxesFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState<WorldParams>(DEFAULT);
  const [scene, setScene] = useState<Scene>("tower");
  const [playing, setPlaying] = useState(true);
  const [showContacts, setShowContacts] = useState(true);
  const bodies = useRef<Body[]>(build("tower"));
  const contacts = useRef<Contact[]>([]);
  const prev = useRef(new Map<string, Contact>());
  const acc = useRef(0);
  const grab = useRef<{ i: number; x: number; y: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const rerender = useRerender();
  const set = <K extends keyof WorldParams>(k: K, v: WorldParams[K]) => setP(o => ({ ...o, [k]: v }));
  const reset = (s: Scene) => { setScene(s); bodies.current = build(s); prev.current.clear(); rerender(); };

  const rafRef = useRaf(playing, dt => {
    acc.current += Math.min(dt, 0.05);
    while (acc.current >= STEP) {
      acc.current -= STEP;
      // A held box is pulled towards the pointer like a stiff, damped spring
      const g = grab.current;
      if (g) {
        const b = bodies.current[g.i];
        b.vx = (g.x - b.x) * 12; b.vy = (g.y - b.y) * 12 + p.gravity * STEP; b.w *= 0.9;
      }
      contacts.current = stepWorld(bodies.current, p, STEP, prev.current);
    }
    rerender();
  });

  const toWorld = (e: React.PointerEvent) => { const q = svgPoint(svg.current!, e); return { x: q.x / S, y: (H - q.y) / S - FLOOR }; };
  const inside = (b: Body, w: { x: number; y: number }) => {
    const c = Math.cos(-b.angle), s = Math.sin(-b.angle), dx = w.x - b.x, dy = w.y - b.y;
    return Math.abs(c * dx - s * dy) < b.hw && Math.abs(s * dx + c * dy) < b.hh;
  };
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const w = toWorld(e);
    const i = bodies.current.findIndex(b => b.invM > 0 && inside(b, w));
    svg.current!.setPointerCapture(e.pointerId);
    if (i >= 0) { grab.current = { i, ...w }; return; }
    if (w.y > 0.3) {
      const size = 0.4 + Math.random() * 0.6;
      bodies.current.push(makeBox(w.x, w.y, size * (0.8 + Math.random() * 0.8), size, 1, Math.random() - 0.5));
      // Keep at most 40 bodies: the oldest dynamic box goes (contact keys use indices, so start warm starting afresh)
      if (bodies.current.length > 40) { bodies.current.splice(bodies.current.findIndex(b => b.invM > 0), 1); prev.current.clear(); }
    }
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => { if (grab.current) grab.current = { i: grab.current.i, ...toWorld(e) }; };
  const onUp = () => { grab.current = null; };

  const moving = bodies.current.filter(b => b.invM > 0);
  const energy = moving.reduce((s, b) => s + 0.5 * (b.vx ** 2 + b.vy ** 2) / b.invM + 0.5 * b.w ** 2 / b.invI, 0);

  return (
    <Figure
      title={tx(t, "figRb_title", "Rigid boxes with sequential impulses")}
      head={<Choice value={scene} onChange={reset} options={[["tower", tx(t, "figRb_tower", "tower")], ["pyramid", tx(t, "figRb_pyramid", "pyramid")], ["ramp", tx(t, "figRb_ramp", "ramp")]]} />}
      controls={<>
        <Row>
          <Btn active={playing} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</Btn>
          <Btn onClick={() => reset(scene)}>{tx(t, "figRb_reset", "reset")}</Btn>
          <Btn active={p.warmStart} onClick={() => set("warmStart", !p.warmStart)}>{p.warmStart ? "✓ " : ""}{tx(t, "figRb_warm", "warm starting")}</Btn>
          <Btn active={showContacts} onClick={() => setShowContacts(v => !v)}>{showContacts ? "✓ " : ""}{tx(t, "figRb_contacts", "contacts")}</Btn>
          <Btn onClick={() => setP(DEFAULT)}>{tx(t, "figPit_defaults", "defaults")}</Btn>
        </Row>
        <Sliders>
          <Slider label={tx(t, "figPit_iter", "iterations")} value={p.iterations} min={1} max={30} step={1} onChange={v => set("iterations", v)} fmt={v => String(v)} width="w-28" />
          <Slider label={tx(t, "figPit_mu", "friction μ")} value={p.mu} min={0} max={1.2} step={0.05} onChange={v => set("mu", v)} width="w-28" />
          <Slider label={tx(t, "figPit_e", "restitution e")} value={p.e} min={0} max={0.9} step={0.05} onChange={v => set("e", v)} width="w-28" />
          <Slider label={tx(t, "figRb_beta", "position bias β")} value={p.beta} min={0} max={0.8} step={0.05} onChange={v => set("beta", v)} width="w-28" />
        </Sliders>
        <Row>
          <Readout>{tx(t, "figRb_bodies", "boxes")}: {moving.length}</Readout>
          <Readout>{tx(t, "figRb_contactsN", "contact points")}: {contacts.current.length}</Readout>
          <Readout>{tx(t, "figPit_ke", "kinetic energy")}: {energy.toFixed(2)} J</Readout>
        </Row>
      </>}
      note={tx(t, "figRb_note", "Each contact point gets its own normal and friction impulse, applied at that point, so it both pushes the box and turns it. A box resting flat has two contact points; if only one corner touches, the impulse there makes the box tip. Warm starting begins each step with last step's impulses, so a tower that needed large impulses last step starts close to the answer; without it the solver has to rebuild them from zero every step and the tower sways. β is the share of the overlap removed per step by an extra push-out velocity: 0 lets boxes sink into each other, too much makes them jump.")}
    >
      <div ref={rafRef}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full block cursor-crosshair" style={{ touchAction: "none" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {bodies.current.map((b, i) => (
            <polygon key={i} points={corners(b).map(c => `${(c.x * S).toFixed(1)},${sy(c.y).toFixed(1)}`).join(" ")}
              fill={b.invM === 0 ? C.muted : COLS[i % COLS.length]} opacity={b.invM === 0 ? 0.35 : grab.current?.i === i ? 1 : 0.8}
              stroke={grab.current?.i === i ? C.fg : "var(--code-bg)"} strokeWidth={1.2} />
          ))}
          {showContacts && contacts.current.map((c, i) => (
            <g key={`c${i}`}>
              <line x1={c.p.x * S} y1={sy(c.p.y)} x2={(c.p.x + c.n.x * 0.35) * S} y2={sy(c.p.y + c.n.y * 0.35)} stroke={C.red} strokeWidth={1.4} />
              <circle cx={c.p.x * S} cy={sy(c.p.y)} r={3} fill={C.red} />
            </g>
          ))}
          <T x={8} y={16} size={9}>{tx(t, "figRb_hint", "tap empty space to drop a box · drag a box to throw it")}</T>
        </svg>
      </div>
    </Figure>
  );
}
