"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
// The kit's text component is imported as Label: T is the jump's time to apex here
import { C, Figure, Readout, Row, Slider, Sliders, T as Label, f2, plot } from "@/components/lesson/kit/figure";
import { jumpPhysics } from "./platformer";

// ── What this figure shows ────────────────────────────────────────────────────
// A jump designed the way level designers think: how high (H) and how long it
// takes to get there (T). From those two numbers follow the gravity and the
// take-off speed. The arcs are drawn while running at a constant speed: the
// dashed one falls with the same gravity it rose with (a plain parabola), the
// solid one falls k times harder, and the short one lets go of the button at
// the release time, which multiplies the upward speed by the cut factor.

const P = plot({ W: 660, H: 260, x0: 0, x1: 14, y0: -0.3, y1: 5.6 });

/** Height over time: rise with g, then fall with k·g; an optional release at tr cuts the speed once. */
function arc(H: number, T: number, k: number, vx: number, tr: number | null, cut: number) {
  const { g, v0 } = jumpPhysics(H, T);
  const pts: [number, number][] = [];
  let y = 0, v = v0, t = 0, cutDone = false;
  const h = 1 / 240;
  while (t < 5) {
    if (tr !== null && !cutDone && t >= tr && v > 0) { v *= cut; cutDone = true; }
    const gg = v < 0 ? g * k : g;
    v -= gg * h; y += v * h; t += h;
    if (y < 0) { pts.push([vx * t, 0]); break; }
    pts.push([vx * t, y]);
  }
  return pts;
}
const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${P.X(x).toFixed(1)},${P.Y(y).toFixed(1)}`).join("");

export function JumpDesignFigure({ t }: { t?: TrackTranslations }) {
  const [H, setH] = useState(3.2);
  const [T, setT] = useState(0.38);
  const [k, setK] = useState(1.8);
  const [vx, setVx] = useState(7);
  const [tr, setTr] = useState(0.12);
  const [cut, setCut] = useState(0.45);

  const { g, v0 } = jumpPhysics(H, T);
  const tDown = T / Math.sqrt(k);
  // Releasing at tr: speed there is v₀ − g·tr; cut, it then climbs a further (c·v)²/2g
  const vAt = Math.max(0, v0 - g * tr), yAt = v0 * Math.min(tr, T) - 0.5 * g * Math.min(tr, T) ** 2;
  const hop = tr >= T ? H : yAt + (cut * vAt) ** 2 / (2 * g);

  return (
    <Figure
      title={tx(t, "figJumpD_title", "Designing a jump from height and time")}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figJumpD_H", "height H")} value={H} min={1} max={5} step={0.1} onChange={setH} fmt={v => `${v.toFixed(1)} tiles`} width="w-28" />
          <Slider label={tx(t, "figJumpD_T", "time to apex T")} value={T} min={0.2} max={0.8} step={0.01} onChange={setT} fmt={v => `${v.toFixed(2)} s`} width="w-28" />
          <Slider label={tx(t, "figJumpD_k", "fall gravity × k")} value={k} min={1} max={3} step={0.1} onChange={setK} width="w-28" />
          <Slider label={tx(t, "figJumpD_vx", "run speed")} value={vx} min={2} max={12} step={0.5} onChange={setVx} fmt={v => `${v.toFixed(1)} tiles/s`} width="w-28" />
          <Slider label={tx(t, "figJumpD_tr", "release at")} value={tr} min={0} max={0.8} step={0.01} onChange={setTr} fmt={v => `${v.toFixed(2)} s`} width="w-28" />
          <Slider label={tx(t, "figJumpD_cut", "cut factor c")} value={cut} min={0} max={1} step={0.05} onChange={setCut} width="w-28" />
        </Sliders>
        <Row>
          <Readout color={C.amber}>g = 2H/T² = {f2(g, 1)} tiles/s²</Readout>
          <Readout color={C.amber}>v₀ = 2H/T = {f2(v0, 1)} tiles/s</Readout>
          <Readout>{tx(t, "figJumpD_down", "fall time")} T/√k = {f2(tDown)} s</Readout>
          <Readout>{tx(t, "figJumpD_len", "jump length")} = {f2(vx * (T + tDown), 1)} tiles</Readout>
          <Readout color={C.sky}>{tx(t, "figJumpD_hop", "short hop")} = {f2(hop)} tiles</Readout>
        </Row>
      </>}
      note={tx(t, "figJumpD_note", "Choose the height and the rise time; the gravity and the take-off speed follow, so the jump always reaches exactly H at exactly T whatever you pick. A plain parabola (dashed) spends as long falling as rising, which feels floaty. Falling k times harder shortens the descent to T/√k and makes landings crisp without changing the height. Releasing the button early cuts the upward speed: the blue arc shows the hop you get by letting go at the release time, and the readout its height.")}
    >
      <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full block">
        {[0, 1, 2, 3, 4, 5].map(v => (
          <g key={v}>
            <line x1={P.X(0)} x2={P.X(14)} y1={P.Y(v)} y2={P.Y(v)} stroke={v === 0 ? C.axis : C.grid} />
            <Label x={P.X(0) + 3} y={P.Y(v) - 3} size={8.5}>{v}</Label>
          </g>
        ))}
        {/* A tile-sized ruler along the ground */}
        {Array.from({ length: 15 }, (_, i) => <line key={i} x1={P.X(i)} x2={P.X(i)} y1={P.Y(0)} y2={P.Y(0) + 5} stroke={C.axis} />)}
        <line x1={P.X(0)} x2={P.X(14)} y1={P.Y(H)} y2={P.Y(H)} stroke={C.amber} strokeDasharray="2 4" />
        <Label x={P.X(14) - 4} y={P.Y(H) - 4} anchor="end" color={C.amber}>H</Label>
        <line x1={P.X(vx * T)} x2={P.X(vx * T)} y1={P.Y(0)} y2={P.Y(H)} stroke={C.amber} strokeDasharray="2 4" />
        <Label x={P.X(vx * T) + 4} y={P.Y(0) - 6} color={C.amber}>{`T = ${f2(T)} s`}</Label>
        <path d={path(arc(H, T, 1, vx, null, 1))} fill="none" stroke={C.fg} strokeDasharray="5 4" opacity={0.6} strokeWidth={1.5} />
        <path d={path(arc(H, T, k, vx, null, 1))} fill="none" stroke={C.orange} strokeWidth={2.5} />
        {tr < T && <path d={path(arc(H, T, k, vx, tr, cut))} fill="none" stroke={C.sky} strokeWidth={2} />}
      </svg>
    </Figure>
  );
}
