"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// midpoint — two draggable points, their midpoint and the point a fraction t
//            of the way from A to B (the same lerp as in the ratios chapter).
// perp     — a line through A and B with its rise/run step, and the same step
//            turned a quarter turn: (run, rise) → (−rise, run). The turned
//            step is perpendicular, so its slope is −run/rise and the product
//            of the two slopes is −1.
// circle   — a circle and a line y = mx + b. Substituting the line into the
//            circle's equation gives a quadratic; its discriminant says
//            whether they cross twice, touch once (tangent) or miss.

type Mode = "midpoint" | "perp" | "circle";
const W = 560, H = 300;
const p = plot({ W, H, x0: -7.467, x1: 7.467, y0: -4, y1: 4 });
const n2 = (v: number) => (+v.toFixed(2)).toString().replace("-", "−");
/** " + 2" or " − 2": a term with its sign as the operator. */
const plus = (v: number) => (v < 0 ? ` − ${n2(-v)}` : ` + ${n2(v)}`);
const par = (v: number) => (v < 0 ? `(${n2(v)})` : n2(v));
const snap = (q: Pt): Pt => ({ x: clamp(Math.round(p.inv(q).x * 2) / 2, -7, 7), y: clamp(Math.round(p.inv(q).y * 2) / 2, -3.5, 3.5) });
const X = (q: Pt) => p.X(q.x), Y = (q: Pt) => p.Y(q.y);
/** A long segment through q with direction d, clipped by the SVG itself. */
const longLine = (q: Pt, d: Pt) => ({ x1: p.X(q.x - d.x * 40), y1: p.Y(q.y - d.y * 40), x2: p.X(q.x + d.x * 40), y2: p.Y(q.y + d.y * 40) });

export function CoordFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("midpoint");
  const [A, setA] = useState<Pt>({ x: -4, y: -2 }), [B, setB] = useState<Pt>({ x: 3, y: 2.5 });
  const [f, setF] = useState(0.25);
  const [m, setM] = useState(0.5), [b, setB0] = useState(1);
  const [Ctr, setCtr] = useState<Pt>({ x: 1, y: 0 });
  const R = 2.5;

  const drag = useDrag<"A" | "B" | "C">(
    q => mode === "circle" ? nearest(q, [["C", { x: X(Ctr), y: Y(Ctr) }]], 20)
      : nearest(q, [["A", { x: X(A), y: Y(A) }], ["B", { x: X(B), y: Y(B) }]], 20),
    (id, q) => { if (id === "A") setA(snap(q)); else if (id === "B") setB(snap(q)); else setCtr(snap(q)); });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;
  const pointLabel = (q: Pt, name: string, col: string, dy = -9) =>
    <T x={X(q) + 8} y={Y(q) + dy} size={9.5} color={col} bold>{`${name} (${n2(q.x)}, ${n2(q.y)})`}</T>;

  if (mode === "midpoint") {
    const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    const P = { x: A.x + f * (B.x - A.x), y: A.y + f * (B.y - A.y) };
    svg = <>
      <Grid p={p} step={1} />
      <line x1={X(A)} y1={Y(A)} x2={X(B)} y2={Y(B)} stroke={C.fg} strokeWidth={2} />
      <line x1={X(A)} y1={Y(M)} x2={X(M)} y2={Y(M)} stroke={C.sky} strokeWidth={1} strokeDasharray="3 3" />
      <line x1={X(M)} y1={Y(A)} x2={X(M)} y2={Y(M)} stroke={C.sky} strokeWidth={1} strokeDasharray="3 3" />
      <circle cx={X(M)} cy={Y(M)} r={5} fill={C.amber} />
      <circle cx={X(P)} cy={Y(P)} r={4.5} fill={C.purple} />
      {pointLabel(M, "M", C.amber, 16)}
      <T x={X(P) - 8} y={Y(P) - 8} size={9.5} anchor="end" color={C.purple} bold>{`P (${n2(P.x)}, ${n2(P.y)})`}</T>
      <Handle x={X(A)} y={Y(A)} color={C.green} active={drag.dragging === "A"} />
      <Handle x={X(B)} y={Y(B)} color={C.pink} active={drag.dragging === "B"} />
      {pointLabel(A, "A", C.green, 16)}
      {pointLabel(B, "B", C.pink)}
    </>;
    controls = <>
      <Slider label={tx(t, "figCo_t", "fraction t")} value={f} min={0} max={1} step={0.05} onChange={setF} fmt={n2} width="w-20" />
      <Row>
        <Readout color={C.amber}>{`M = ((${n2(A.x)} + ${n2(B.x)})/2, (${n2(A.y)} + ${n2(B.y)})/2) = (${n2(M.x)}, ${n2(M.y)})`}</Readout>
        <Readout color={C.purple}>{`P = A + ${n2(f)}·(B − A) = (${n2(P.x)}, ${n2(P.y)})`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCo_noteM", "Drag A and B. The midpoint M is the average of the two points, coordinate by coordinate: its x is halfway between the two x values, its y halfway between the two y values (the dashed lines). The purple point is a fraction t of the way from A to B; t = 0.5 is the midpoint, t = 0 is A and t = 1 is B.");
  } else if (mode === "perp") {
    const run = B.x - A.x, rise = B.y - A.y;
    const slope = run !== 0 ? rise / run : NaN, slopeP = rise !== 0 ? -run / rise : NaN;
    const Q = { x: B.x - rise, y: B.y + run };            // B + the turned step
    svg = <>
      <Grid p={p} step={1} />
      <line {...longLine(A, { x: run, y: rise })} stroke={C.sky} strokeWidth={2} />
      <line {...longLine(B, { x: -rise, y: run })} stroke={C.amber} strokeWidth={2} />
      <path d={`M${X(A)},${Y(A)} L${p.X(B.x)},${Y(A)} L${X(B)},${Y(B)}`} fill={C.sky} fillOpacity={0.12} stroke={C.sky} strokeWidth={1.2} strokeDasharray="4 3" />
      <path d={`M${X(B)},${Y(B)} L${p.X(B.x)},${p.Y(B.y + run)} L${X(Q)},${Y(Q)}`} fill={C.amber} fillOpacity={0.12} stroke={C.amber} strokeWidth={1.2} strokeDasharray="4 3" />
      <T x={p.X((A.x + B.x) / 2)} y={Y(A) + (rise >= 0 ? 14 : -6)} size={9.5} anchor="middle" color={C.sky}>{`run ${n2(run)}`}</T>
      <T x={p.X(B.x) + 6} y={p.Y((A.y + B.y) / 2)} size={9.5} color={C.sky}>{`rise ${n2(rise)}`}</T>
      <Handle x={X(A)} y={Y(A)} color={C.green} active={drag.dragging === "A"} />
      <Handle x={X(B)} y={Y(B)} color={C.pink} active={drag.dragging === "B"} />
    </>;
    controls = <Row>
      <Readout color={C.sky}>{`m₁ = ${n2(rise)}/${par(run)} = ${Number.isFinite(slope) ? n2(slope) : "∞"}`}</Readout>
      <Readout color={C.amber}>{`m₂ = −${par(run)}/${par(rise)} = ${Number.isFinite(slopeP) ? n2(slopeP) : "∞"}`}</Readout>
      <Readout color={C.green}>{Number.isFinite(slope) && Number.isFinite(slopeP) && slope !== 0 ? `m₁ · m₂ = ${n2(slope * slopeP)}` : tx(t, "figCo_vert", "one line is vertical")}</Readout>
    </Row>;
    note = tx(t, "figCo_noteP", "The blue line goes through A and B; its step from A to B is run across and rise up (the blue triangle). Turn that triangle a quarter turn about B and you get the amber one: its run is −rise and its rise is run. The turned step is at 90° to the first, so the amber line is perpendicular to the blue one. Its slope is run/(−rise), the negative reciprocal, and the two slopes multiply to −1.");
  } else {
    // (x − h)² + (y − k)² = R² with y = m x + b: a x² + b' x + c = 0
    const h = Ctr.x, k = Ctr.y, e = b - k;
    const qa = 1 + m * m, qb = 2 * (m * e - h), qc = h * h + e * e - R * R;
    const disc = qb * qb - 4 * qa * qc;
    const xs = disc > 1e-9 ? [(-qb - Math.sqrt(disc)) / (2 * qa), (-qb + Math.sqrt(disc)) / (2 * qa)] : Math.abs(disc) <= 1e-9 ? [-qb / (2 * qa)] : [];
    const verdict = xs.length === 2 ? tx(t, "figCo_two", "2 crossings") : xs.length === 1 ? tx(t, "figCo_one", "1 point: tangent") : tx(t, "figCo_none", "no crossing");
    svg = <>
      <Grid p={p} step={1} />
      <circle cx={X(Ctr)} cy={Y(Ctr)} r={R * p.sx} fill={C.sky} fillOpacity={0.08} stroke={C.sky} strokeWidth={2} />
      <line {...longLine({ x: 0, y: b }, { x: 1, y: m })} stroke={C.amber} strokeWidth={2} />
      {xs.map((x, i) => <circle key={i} cx={p.X(x)} cy={p.Y(m * x + b)} r={5} fill={C.pink} />)}
      <Handle x={X(Ctr)} y={Y(Ctr)} color={C.sky} active={drag.dragging === "C"} />
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figCo_m", "slope m")} value={m} min={-3} max={3} step={0.1} onChange={setM} fmt={n2} />
        <Slider label={tx(t, "figCo_b", "intercept b")} value={b} min={-4} max={4} step={0.1} onChange={setB0} fmt={n2} />
      </Sliders>
      <Row>
        <Readout color={C.sky}>{`(x${plus(-h)})² + (y${plus(-k)})² = ${n2(R * R)}`}</Readout>
        <Readout color={C.amber}>{`y = ${n2(m)}x${plus(b)}`}</Readout>
        <Readout>{`${n2(qa)}x²${plus(qb)}x${plus(qc)} = 0`}</Readout>
        <Readout color={C.pink}>{`Δ = ${n2(disc)} → ${verdict}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCo_noteC", "Drag the centre and change the line. Putting y = mx + b into the circle's equation leaves one unknown, x, in a quadratic. Its discriminant Δ decides everything: positive, the line cuts the circle at two points; zero, it touches at exactly one (a tangent); negative, the line misses. This is the same test as a ray against a sphere in the quadratics chapter.");
  }

  return (
    <Figure
      title={tx(t, "figCo_title", "Geometry with coordinates")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["midpoint", tx(t, "figCo_mMid", "midpoint")],
        ["perp", tx(t, "figCo_mPerp", "perpendicular")],
        ["circle", tx(t, "figCo_mCircle", "line & circle")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
