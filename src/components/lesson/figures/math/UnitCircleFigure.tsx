"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, useDrag, useRaf } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The unit circle definition of sine and cosine: a point at angle θ on a
// circle of radius 1 has coordinates (cos θ, sin θ). Drag it around (or let
// it spin). The right panel unrolls the angle along the horizontal axis, so
// the point's height traces the sine wave and its x traces the cosine wave.
// tan θ = sin θ / cos θ is the height where the ray meets the line x = 1.

const W = 560, H = 250, R = 90, CX = 115, CY = 125;
const WX0 = 250, WX1 = 545;         // the unrolled wave panel spans θ ∈ [0, 2π]

export function UnitCircleFigure({ t }: { t?: TrackTranslations }) {
  const [theta, setTheta] = useState(0.7);
  const [spin, setSpin] = useState(false);
  const [showTan, setShowTan] = useState(false);
  const ref = useRaf(spin, dt => setTheta(a => (a + dt * 0.8) % (Math.PI * 2)));

  const drag = useDrag<"p">(() => "p", (_, q) => {
    let a = Math.atan2(-(q.y - CY), q.x - CX);
    if (q.x > WX0 - 10) a = ((q.x - WX0) / (WX1 - WX0)) * Math.PI * 2;      // dragging in the wave panel scrubs θ
    if (a < 0) a += Math.PI * 2;
    setTheta(Math.max(0, Math.min(Math.PI * 2, a)));
  });

  const c = Math.cos(theta), s = Math.sin(theta);
  const px = CX + c * R, py = CY - s * R;
  const WX = (a: number) => WX0 + (a / (Math.PI * 2)) * (WX1 - WX0);
  const wave = (fn: (a: number) => number) => Array.from({ length: 121 }, (_, i) => { const a = (i / 120) * Math.PI * 2; return `${i ? "L" : "M"}${WX(a).toFixed(1)},${(CY - fn(a) * R).toFixed(1)}`; }).join("");
  const tanV = s / c, tanOk = Math.abs(c) > 0.06;
  const deg = (theta * 180) / Math.PI;
  const large = theta > Math.PI ? 1 : 0;

  return (
    <Figure
      title={tx(t, "figUnit_title", "The unit circle: sine and cosine")}
      head={<>
        <Btn active={spin} onClick={() => setSpin(v => !v)}>{spin ? "❚❚" : "▶ spin"}</Btn>
        <Btn active={showTan} onClick={() => setShowTan(v => !v)}>tan θ</Btn>
      </>}
      controls={<Row>
        <Readout>θ = {deg.toFixed(1)}° = {theta.toFixed(3)} rad = {(theta / Math.PI).toFixed(3)}π</Readout>
        <Readout color={C.red}>cos θ = {c.toFixed(3)}</Readout>
        <Readout color={C.green}>sin θ = {s.toFixed(3)}</Readout>
        {showTan && <Readout color={C.amber}>tan θ = {tanOk ? tanV.toFixed(3) : "±∞"}</Readout>}
        <Readout color={C.muted}>cos² + sin² = {(c * c + s * s).toFixed(3)}</Readout>
      </Row>}
      note={tx(t, "figUnit_note", "Drag the point around the circle, or drag in the wave panel. The angle θ is measured from the positive x axis, counter-clockwise. The point's x coordinate is cos θ (red), its y coordinate is sin θ (green). Because the radius is 1, Pythagoras gives cos²θ + sin²θ = 1 at every angle. Unrolling the angle along a line turns the circular motion into the familiar waves: sine starts at 0, cosine at 1, a quarter turn (π/2) apart. The arc length from the x axis to the point equals θ in radians, which is exactly what a radian is.")}
    >
      <div ref={ref}>
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab">
          {/* circle */}
          <line x1={CX - R - 20} x2={CX + R + 20} y1={CY} y2={CY} stroke={C.axis} />
          <line x1={CX} x2={CX} y1={CY - R - 20} y2={CY + R + 20} stroke={C.axis} />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.muted} strokeWidth={1.3} />
          <path d={`M${CX + 22},${CY} A22,22 0 ${large} 0 ${CX + 22 * c},${CY - 22 * s}`} fill="none" stroke={C.purple} strokeWidth={2} />
          <path d={`M${CX + R},${CY} A${R},${R} 0 ${large} 0 ${px},${py}`} fill="none" stroke={C.purple} strokeWidth={3} opacity={0.45} />
          <T x={CX + 26 * Math.cos(theta / 2) + 2} y={CY - 26 * Math.sin(theta / 2) + 3} size={9.5} color={C.purple}>θ</T>
          <line x1={CX} y1={CY} x2={px} y2={py} stroke={C.fg} strokeWidth={1.6} />
          <line x1={CX} y1={CY} x2={px} y2={CY} stroke={C.red} strokeWidth={3} />
          <line x1={px} y1={CY} x2={px} y2={py} stroke={C.green} strokeWidth={3} />
          {showTan && tanOk && (
            <g>
              <line x1={CX + R} x2={CX + R} y1={CY - R - 20} y2={CY + R + 20} stroke={C.amber} strokeDasharray="3 3" opacity={0.5} />
              <line x1={CX} y1={CY} x2={CX + R} y2={CY - tanV * R} stroke={C.amber} strokeDasharray="4 3" />
              <line x1={CX + R} y1={CY} x2={CX + R} y2={CY - Math.max(-1.4, Math.min(1.4, tanV)) * R} stroke={C.amber} strokeWidth={3} />
            </g>
          )}
          <circle cx={px} cy={py} r={10} fill={C.sky} opacity={0.2} />
          <circle cx={px} cy={py} r={5.5} fill={C.sky} />
          <T x={CX + R + 4} y={CY + 12} size={8.5}>1</T>
          {/* waves */}
          <line x1={WX0} x2={WX1} y1={CY} y2={CY} stroke={C.axis} />
          {[0.5, 1, 1.5, 2].map(k => (
            <g key={k}>
              <line x1={WX(k * Math.PI)} x2={WX(k * Math.PI)} y1={CY - R} y2={CY + R} stroke={C.grid} />
              <T x={WX(k * Math.PI)} y={CY + R + 14} size={8.5} anchor="middle">{k === 1 ? "π" : k === 2 ? "2π" : `${k}π`}</T>
            </g>
          ))}
          <path d={wave(Math.sin)} fill="none" stroke={C.green} strokeWidth={1.8} />
          <path d={wave(Math.cos)} fill="none" stroke={C.red} strokeWidth={1.4} opacity={0.75} />
          <line x1={px} y1={py} x2={WX(theta)} y2={py} stroke={C.green} strokeDasharray="2 3" opacity={0.6} />
          <line x1={WX(theta)} x2={WX(theta)} y1={CY - R - 6} y2={CY + R + 4} stroke={C.purple} opacity={0.6} />
          <circle cx={WX(theta)} cy={CY - s * R} r={4.5} fill={C.green} />
          <circle cx={WX(theta)} cy={CY - c * R} r={4} fill={C.red} />
          <T x={WX1} y={CY - R - 8} size={9} anchor="end" color={C.green}>sin θ</T>
          <T x={WX1 - 44} y={CY - R - 8} size={9} anchor="end" color={C.red}>cos θ</T>
        </svg>
      </div>
    </Figure>
  );
}
