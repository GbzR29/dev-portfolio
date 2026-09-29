"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, T, Vec, f2, svgPoint, useRaf } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A box floating in space (no gravity) is struck by an impulse J at a point.
// Drag from a point on the box to aim and size the impulse; on release the box
// moves off with v = J/m and spins with ω = (r × J)/I, where r runs from the
// centre of mass to the hit point. The faded copies show the box every 0.3 s,
// and the dotted line the path of the point that was hit. Through the centre,
// r × J = 0: pure translation. The same J further out spins it faster, while
// the centre moves at exactly the same velocity.

const W = 660, H = 300, S = 50;                       // pixels per metre
const HW = 1.2, HH = 0.6, M = 2;                      // half extents (m) and mass (kg)
const I = (M * ((2 * HW) ** 2 + (2 * HH) ** 2)) / 12; // m(w² + h²)/12
const X0 = 2.2, Y0 = 3;                               // start of the centre (m)
const JSCALE = 0.02;                                  // N·s per pixel of drag

type Hit = { r: { x: number; y: number }; J: { x: number; y: number } };

export function ImpulsePointFigure({ t }: { t?: TrackTranslations }) {
  const [hit, setHit] = useState<Hit>({ r: { x: -0.9, y: 0.5 }, J: { x: 1.6, y: 0.4 } });
  const [aim, setAim] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  const [time, setTime] = useState(0);
  const svg = useRef<SVGSVGElement>(null);
  const tRef = useRef(time); tRef.current = time;
  const rafRef = useRaf(aim === null, dt => setTime(tRef.current + dt > 4 ? 0 : tRef.current + dt));

  const v = { x: hit.J.x / M, y: hit.J.y / M };
  const torque = hit.r.x * hit.J.y - hit.r.y * hit.J.x;           // r × J
  const w = torque / I;
  const keT = 0.5 * M * (v.x ** 2 + v.y ** 2), keR = 0.5 * I * w * w;

  // Pose at time s: the centre moves in a straight line, the box turns at ω
  const pose = (s: number) => ({ cx: X0 + v.x * s, cy: Y0 + v.y * s, a: w * s });
  const toPx = (x: number, y: number) => ({ x: x * S, y: H - y * S });
  const boxPts = (s: number) => {
    const { cx, cy, a } = pose(s), c = Math.cos(a), sn = Math.sin(a);
    return [[-HW, -HH], [HW, -HH], [HW, HH], [-HW, HH]].map(([lx, ly]) => {
      const q = toPx(cx + c * lx - sn * ly, cy + sn * lx + c * ly);
      return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
    }).join(" ");
  };
  const pointAt = (s: number) => {
    const { cx, cy, a } = pose(s), c = Math.cos(a), sn = Math.sin(a);
    return toPx(cx + c * hit.r.x - sn * hit.r.y, cy + sn * hit.r.x + c * hit.r.y);
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const q = svgPoint(svg.current!, e);
    // Only the resting box can be aimed at; the point is clamped onto it
    const lx = Math.max(-HW, Math.min(HW, q.x / S - X0)), ly = Math.max(-HH, Math.min(HH, (H - q.y) / S - Y0));
    const from = toPx(X0 + lx, Y0 + ly);
    svg.current!.setPointerCapture(e.pointerId);
    setAim({ from, to: from });
    setTime(0);
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => { if (aim) setAim({ from: aim.from, to: svgPoint(svg.current!, e) }); };
  const onUp = () => {
    if (!aim) return;
    const J = { x: (aim.to.x - aim.from.x) * JSCALE, y: -(aim.to.y - aim.from.y) * JSCALE };
    if (Math.hypot(J.x, J.y) > 0.05) setHit({ r: { x: aim.from.x / S - X0, y: (H - aim.from.y) / S - Y0 }, J });
    setAim(null); setTime(0);
  };

  const hitPx = toPx(X0 + hit.r.x, Y0 + hit.r.y);
  const trail = Array.from({ length: 81 }, (_, i) => pointAt((i / 80) * Math.min(time, 4))).map(q => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");

  return (
    <Figure
      title={tx(t, "figImpPt_title", "An impulse at a point: push and spin")}
      controls={<>
        <Row>
          <Btn onClick={() => { setHit({ r: { x: 0, y: 0 }, J: { x: 1.6, y: 0 } }); setTime(0); }}>{tx(t, "figImpPt_centre", "through the centre")}</Btn>
          <Btn onClick={() => { setHit({ r: { x: -HW, y: HH }, J: { x: 1.6, y: 0 } }); setTime(0); }}>{tx(t, "figImpPt_corner", "same J at a corner")}</Btn>
          <Btn onClick={() => { setHit({ r: { x: HW, y: 0 }, J: { x: 0, y: 1.6 } }); setTime(0); }}>{tx(t, "figImpPt_end", "upwards at the end")}</Btn>
        </Row>
        <Row>
          <Readout color={C.sky}>v = ({f2(v.x)}, {f2(v.y)}) m/s</Readout>
          <Readout color={C.pink}>r × J = {f2(torque, 3)} · ω = {f2(w)} rad/s</Readout>
          <Readout>½mv² = {f2(keT, 3)} J</Readout>
          <Readout>½Iω² = {f2(keR, 3)} J</Readout>
        </Row>
      </>}
      note={tx(t, "figImpPt_note", "Press on the box and drag to aim an impulse; release to strike. The centre of mass always moves off at J/m, wherever you hit. Where you hit only decides the spin: ω = (r × J)/I, the 2D cross product of the lever arm with the impulse, divided by the moment of inertia (here m(w² + h²)/12 = 2 · (2.4² + 1.2²)/12 = 1.2 kg·m²). The same impulse at a corner therefore gives the box more total kinetic energy than at the centre: the extra goes into the rotation. That is why a contact impulse in a rigid-body solver has the terms (r × n)²/I in its denominator: part of the push is spent turning the body.")}
    >
      <div ref={rafRef}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full block cursor-crosshair" style={{ touchAction: "none" }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {aim === null && [0.9, 1.8, 2.7, 3.6].filter(s => s < time).map(s => (
            <polygon key={s} points={boxPts(s)} fill="none" stroke={C.muted} strokeWidth={1} opacity={0.5} />
          ))}
          {aim === null && <polyline points={trail} fill="none" stroke={C.pink} strokeDasharray="3 3" strokeWidth={1.3} />}
          <polygon points={boxPts(aim ? 0 : time)} fill={C.sky} opacity={0.35} stroke={C.sky} strokeWidth={1.5} />
          {(() => { const c = toPx(pose(aim ? 0 : time).cx, pose(aim ? 0 : time).cy); return <circle cx={c.x} cy={c.y} r={4} fill={C.fg} />; })()}
          {aim ? (
            <Vec a={aim.from} b={aim.to} color={C.amber} w={2.5} />
          ) : time < 0.4 && (
            <Vec a={hitPx} b={{ x: hitPx.x + hit.J.x / JSCALE, y: hitPx.y - hit.J.y / JSCALE }} color={C.amber} w={2.5} />
          )}
          <T x={8} y={16} size={9}>{tx(t, "figImpPt_hint", "press on the box and drag to aim the impulse")}</T>
        </svg>
      </div>
    </Figure>
  );
}
