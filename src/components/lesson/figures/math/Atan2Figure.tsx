"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, C, T, plot, Grid, Handle, useDrag, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A turret at the origin aims at a draggable target. atan(y / x) only knows the
// ratio, so it cannot tell (1, 1) from (−1, −1): in the left half-plane it aims
// exactly the wrong way. atan2(y, x) looks at both signs and returns the full
// angle in (−π, π]. The point's polar coordinates (r, θ) are shown as well.

export function Atan2Figure({ t }: { t?: TrackTranslations }) {
  const [q, setQ] = useState({ x: -2.2, y: 1.4 });
  const p = plot({ W: 560, H: 300, x0: -4.7, x1: 4.7, y0: -2.5, y1: 2.5 });
  const drag = useDrag<"q">(() => "q", (_, s) => { const w = p.inv(s); setQ({ x: clamp(w.x, -4.5, 4.5), y: clamp(w.y, -2.4, 2.4) }); });

  const a2 = Math.atan2(q.y, q.x);
  const a1 = Math.abs(q.x) < 1e-9 ? Math.sign(q.y) * Math.PI / 2 : Math.atan(q.y / q.x);
  const r = Math.hypot(q.x, q.y);
  const deg = (a: number) => `${((a * 180) / Math.PI).toFixed(1)}°`;
  const wrong = Math.abs(a1 - a2) > 1e-6;
  const barrel = (a: number, len: number) => ({ x: p.X(Math.cos(a) * len), y: p.Y(Math.sin(a) * len) });
  const quad = q.x >= 0 ? (q.y >= 0 ? "I" : "IV") : q.y >= 0 ? "II" : "III";
  const arcR = 0.7, large = a2 < 0 ? 0 : a2 > Math.PI ? 1 : 0;

  return (
    <Figure
      title={tx(t, "figAtan_title", "Aiming: atan vs atan2")}
      controls={<Row>
        <Readout>({q.x.toFixed(2)}, {q.y.toFixed(2)}) · {tx(t, "figAtan_quad", "quadrant")} {quad}</Readout>
        <Readout color={wrong ? C.red : C.muted}>atan(y/x) = {deg(a1)}</Readout>
        <Readout color={C.green}>atan2(y, x) = {deg(a2)}</Readout>
        <Readout color={C.purple}>r = √(x² + y²) = {r.toFixed(2)}</Readout>
      </Row>}
      note={tx(t, "figAtan_note", "Drag the target. In quadrants I and IV (x > 0) both functions agree. Move it to the left half and atan(y/x) points the red barrel straight away from the target: y/x is the same number for (x, y) and (−x, −y), so the division has thrown away the information about which side the target is on. atan2 takes y and x separately, checks their signs, and returns the correct angle anywhere, including straight up or down where x = 0 and the division would fail. Together with r it converts Cartesian (x, y) to polar (r, θ); the way back is x = r cos θ, y = r sin θ.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto cursor-grab">
        <Grid p={p} step={1} />
        {(["I", "II", "III", "IV"] as const).map((n, i) => (
          <T key={n} x={p.X([3.9, -4.4, -4.4, 3.9][i])} y={p.Y([2.1, 2.1, -2.2, -2.2][i])} size={10} color={n === quad ? C.fg : C.axis}>{n}</T>
        ))}
        <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(q.x)} y2={p.Y(q.y)} stroke={C.purple} strokeDasharray="4 3" />
        <line x1={p.X(q.x)} y1={p.Y(0)} x2={p.X(q.x)} y2={p.Y(q.y)} stroke={C.muted} strokeDasharray="2 3" opacity={0.6} />
        <path d={`M${p.X(arcR)},${p.Y(0)} A${arcR * p.sx},${arcR * p.sy} 0 ${large} ${a2 < 0 ? 1 : 0} ${p.X(Math.cos(a2) * arcR)},${p.Y(Math.sin(a2) * arcR)}`} fill="none" stroke={C.green} strokeWidth={2} />
        {/* turret */}
        {wrong && <line x1={p.X(0)} y1={p.Y(0)} x2={barrel(a1, 1.2).x} y2={barrel(a1, 1.2).y} stroke={C.red} strokeWidth={7} strokeLinecap="round" opacity={0.45} />}
        <line x1={p.X(0)} y1={p.Y(0)} x2={barrel(a2, 1.2).x} y2={barrel(a2, 1.2).y} stroke={C.green} strokeWidth={7} strokeLinecap="round" />
        <circle cx={p.X(0)} cy={p.Y(0)} r={16} fill="var(--code-surface)" stroke={C.fg} strokeWidth={1.5} />
        {wrong && <T x={barrel(a1, 1.45).x} y={barrel(a1, 1.45).y} size={9} anchor="middle" color={C.red}>atan</T>}
        <T x={barrel(a2, 1.5).x} y={barrel(a2, 1.5).y} size={9} anchor="middle" color={C.green}>atan2</T>
        <Handle x={p.X(q.x)} y={p.Y(q.y)} color={C.amber} r={7} active />
      </svg>
    </Figure>
  );
}
