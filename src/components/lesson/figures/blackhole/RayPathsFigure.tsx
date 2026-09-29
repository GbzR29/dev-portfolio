"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, T, clamp, plot, useDrag, type Pt } from "../../kit/figure";
import { B_CRIT, PHOTON_SPHERE, trace2D, weakDeflection, type Bending } from "./geodesic";

// ── What this figure shows ────────────────────────────────────────────────────
// Parallel rays of light coming from the left past a black hole, each traced
// with the same equation the shader integrates. Rays aimed inside the critical
// impact parameter b_c fall in; rays just outside it loop round the photon
// sphere before escaping. The highlighted ray can be dragged up and down.

const P = plot({ W: 660, H: 380, x0: -11, x1: 11, y0: -6.33, y1: 6.33 });
const X_START = -10.6;
const FAN = Array.from({ length: 25 }, (_, i) => -6 + i * 0.5);
const MODES: readonly Bending[] = ["none", "newton", "einstein"];

const path = (pts: [number, number][]) =>
  pts.map((q, i) => `${i ? "L" : "M"}${P.X(q[0]).toFixed(1)},${P.Y(q[1]).toFixed(1)}`).join("");

export function RayPathsFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Bending>("einstein");
  const [b, setB] = useState(3.2);
  const [compare, setCompare] = useState(true);

  const fan = useMemo(() => FAN.map(y => trace2D([X_START, y], [1, 0], mode)), [mode]);
  const main = useMemo(() => trace2D([X_START, b], [1, 0], mode), [b, mode]);
  const newton = useMemo(() => (compare && mode === "einstein" ? trace2D([X_START, b], [1, 0], "newton") : null), [b, mode, compare]);

  const drag = useDrag<"b">(
    q => (Math.abs(q.x - P.X(X_START)) < 24 && Math.abs(q.y - P.Y(b)) < 24 ? "b" : null),
    (_, q: Pt) => setB(clamp(P.inv(q).y, -6, 6)),
  );

  const deg = (a: number) => ((a * 180) / Math.PI).toFixed(1);
  const fate = main.fate === "captured" ? tx(t, "figBhRays_captured", "falls in")
    : main.fate === "escaped" ? tx(t, "figBhRays_escaped", "escapes") : tx(t, "figBhRays_orbiting", "still circling");
  const R = (r: number) => r * P.sx;

  return (
    <Figure
      title={tx(t, "figBhRays_title", "Light paths past a black hole")}
      head={MODES.map(m => <Btn key={m} active={mode === m} onClick={() => setMode(m)}>{m}</Btn>)}
      controls={<>
        <Slider label={tx(t, "figBhRays_b", "impact b")} value={b} min={-6} max={6} step={0.001} onChange={setB} fmt={v => `${v.toFixed(3)} rₛ`} width="w-24" />
        <Row>
          <Btn onClick={() => setB(B_CRIT + 0.002)}>b = b_c + 0.002</Btn>
          <Btn onClick={() => setB(B_CRIT - 0.002)}>b = b_c − 0.002</Btn>
          <Btn active={compare} onClick={() => setCompare(v => !v)}>{compare ? "✓ " : ""}{tx(t, "figBhRays_compare", "Newton's path too")}</Btn>
        </Row>
        <Row>
          <Readout color={C.amber}>{fate}</Readout>
          {main.fate === "escaped" && <Readout>{tx(t, "figBhRays_defl", "deflection")} {deg(main.deflection)}°</Readout>}
          {mode !== "none" && <Readout>{tx(t, "figBhRays_weak", "weak-field")} {mode === "newton" ? "rₛ/b" : "2rₛ/b"} = {deg(weakDeflection(Math.abs(b), mode))}°</Readout>}
          <Readout>r min = {main.rMin.toFixed(3)} rₛ</Readout>
        </Row>
      </>}
      note={tx(t, "figBhRays_note", "Drag the orange ray's start up and down. Far out, the bending matches 2rₛ/b, twice what Newton's gravity gives a particle moving at c. Inside b_c ≈ 2.598 rₛ every ray falls in, which is why the shadow is 2.6 times wider than the horizon. Just outside b_c a ray winds round the photon sphere (dashed, r = 1.5 rₛ) before it leaves, in any direction at all.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${P.W} ${P.H}`} className="w-full block">
        {/* The capture band: rays from the left inside it fall in */}
        {mode === "einstein" && (
          <rect x={0} y={P.Y(B_CRIT)} width={P.X(0)} height={P.Y(-B_CRIT) - P.Y(B_CRIT)} fill={C.red} opacity={0.07} />
        )}
        {fan.map((tr, i) => (
          <path key={i} d={path(tr.pts)} fill="none" strokeWidth={1.1}
            stroke={tr.fate === "captured" ? C.red : C.sky} opacity={0.45} />
        ))}
        {newton && <path d={path(newton.pts)} fill="none" stroke={C.fg} strokeWidth={1.4} strokeDasharray="5 4" opacity={0.7} />}
        <path d={path(main.pts)} fill="none" stroke={C.amber} strokeWidth={2.4} />
        <circle cx={P.X(0)} cy={P.Y(0)} r={R(PHOTON_SPHERE)} fill="none" stroke={C.purple} strokeWidth={1.2} strokeDasharray="4 4" />
        <circle cx={P.X(0)} cy={P.Y(0)} r={R(1)} fill="#000" stroke={C.muted} strokeWidth={1} />
        {mode === "einstein" && <>
          <line x1={0} x2={P.X(0)} y1={P.Y(B_CRIT)} y2={P.Y(B_CRIT)} stroke={C.red} strokeDasharray="3 5" opacity={0.6} />
          <line x1={0} x2={P.X(0)} y1={P.Y(-B_CRIT)} y2={P.Y(-B_CRIT)} stroke={C.red} strokeDasharray="3 5" opacity={0.6} />
          <T x={6} y={P.Y(B_CRIT) - 5} color={C.red}>b_c = 2.598 rₛ</T>
        </>}
        <T x={P.X(0) + R(PHOTON_SPHERE) + 4} y={P.Y(0) - R(PHOTON_SPHERE) + 2} color={C.purple}>{tx(t, "figBhRays_ps", "photon sphere")}</T>
        <T x={P.X(0) + R(1) + 4} y={P.Y(0) + R(1) + 12}>{tx(t, "figBhRays_horizon", "horizon rₛ")}</T>
        <circle cx={P.X(X_START)} cy={P.Y(b)} r={drag.dragging ? 8 : 6} fill={C.amber} stroke="var(--code-bg)" strokeWidth={1.5} style={{ cursor: "ns-resize" }} />
      </svg>
    </Figure>
  );
}
