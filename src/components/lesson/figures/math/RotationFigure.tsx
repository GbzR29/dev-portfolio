"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, Vec, plot, Grid, useDrag, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// rotate — a point P = (x, y) is x steps along the x-axis plus y steps up.
//          Rotating by θ turns the two unit steps into (cos θ, sin θ) and
//          (−sin θ, cos θ); taking the same x and y steps along the turned
//          directions lands on the rotated point. That is the rotation formula.
// sum    — the point at angle α on the unit circle, rotated by β, is the point
//          at angle α + β. Writing the rotation out with the formula gives the
//          angle-sum identities for cos(α + β) and sin(α + β).

type Mode = "rotate" | "sum";
const W = 560, H = 300;
const DEG = Math.PI / 180;
const n2 = (v: number) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2).replace("-", "−");
const n3 = (v: number) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3).replace("-", "−");

export function RotationFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("rotate");
  const [P, setP] = useState<Pt>({ x: 3, y: 1 });
  const [th, setTh] = useState(40);
  const [al, setAl] = useState(30), [be, setBe] = useState(45);

  const pr = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
  const drag = useDrag<"P">(
    () => (mode === "rotate" ? "P" : null),
    (_, q) => { const w = pr.inv(q); setP({ x: clamp(Math.round(w.x * 2) / 2, -5, 5), y: clamp(Math.round(w.y * 2) / 2, -2.5, 2.5) }); });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;
  const O = (pl: typeof pr, v: Pt) => ({ x: pl.X(v.x), y: pl.Y(v.y) });

  if (mode === "rotate") {
    const c = Math.cos(th * DEG), s = Math.sin(th * DEG);
    const e1 = { x: c, y: s }, e2 = { x: -s, y: c };
    const mid = { x: P.x * e1.x, y: P.x * e1.y };
    const Pr = { x: P.x * c - P.y * s, y: P.x * s + P.y * c };
    svg = <>
      <Grid p={pr} step={1} />
      {/* the original point as x steps right, then y steps up */}
      <Vec a={O(pr, { x: 0, y: 0 })} b={O(pr, { x: P.x, y: 0 })} color={C.red} w={1.6} dash="4 3" opacity={0.6} />
      <Vec a={O(pr, { x: P.x, y: 0 })} b={O(pr, P)} color={C.green} w={1.6} dash="4 3" opacity={0.6} />
      {/* the turned unit steps and the same x, y steps along them */}
      <Vec a={O(pr, { x: 0, y: 0 })} b={O(pr, e1)} color={C.red} w={3} />
      <Vec a={O(pr, { x: 0, y: 0 })} b={O(pr, e2)} color={C.green} w={3} />
      <Vec a={O(pr, { x: 0, y: 0 })} b={O(pr, mid)} color={C.red} w={2} />
      <Vec a={O(pr, mid)} b={O(pr, Pr)} color={C.green} w={2} />
      <path d={`M${pr.X(0.8)},${pr.Y(0)} A${0.8 * pr.sx},${0.8 * pr.sy} 0 0 ${th >= 0 ? 0 : 1} ${pr.X(0.8 * c)},${pr.Y(0.8 * s)}`} fill="none" stroke={C.purple} strokeWidth={1.6} />
      <T x={pr.X(0.95 * Math.cos((th * DEG) / 2))} y={pr.Y(0.95 * Math.sin((th * DEG) / 2)) + 4} size={10} color={C.purple} bold>θ</T>
      <circle cx={pr.X(Pr.x)} cy={pr.Y(Pr.y)} r={6} fill={C.amber} />
      <T x={pr.X(Pr.x) + 9} y={pr.Y(Pr.y) - 7} size={10.5} color={C.amber} bold>{`P' (${n2(Pr.x)}, ${n2(Pr.y)})`}</T>
      <Handle x={pr.X(P.x)} y={pr.Y(P.y)} color={C.sky} active={drag.dragging === "P"} />
      <T x={pr.X(P.x) + 9} y={pr.Y(P.y) + 15} size={10.5} color={C.sky} bold>{`P (${n2(P.x)}, ${n2(P.y)})`}</T>
    </>;
    controls = <>
      <Slider label={tx(t, "figRot_theta", "angle θ")} value={th} min={-180} max={180} step={1} onChange={setTh} fmt={v => `${v}°`} width="w-16" />
      <Row>
        <Readout color={C.red}>{`x·(cos θ, sin θ) = ${n2(P.x)}·(${n3(c)}, ${n3(s)})`}</Readout>
        <Readout color={C.green}>{`y·(−sin θ, cos θ) = ${n2(P.y)}·(${n3(-s)}, ${n3(c)})`}</Readout>
        <Readout color={C.amber}>{`P' = (x cos θ − y sin θ, x sin θ + y cos θ) = (${n2(Pr.x)}, ${n2(Pr.y)})`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRot_noteR", "Drag P and turn θ. The faded arrows build P from the origin: x steps along the x-axis (red), then y steps up (green). Rotating the whole picture turns the unit step right, (1, 0), into (cos θ, sin θ), and the unit step up, (0, 1), into (−sin θ, cos θ), a quarter turn further. Taking the same x and y steps along the turned directions (solid arrows) ends exactly at the rotated point P'. Add the two steps coordinate by coordinate and you have the rotation formula.");
  } else {
    const pu = plot({ W, H, x0: -2.8, x1: 2.8, y0: -1.5, y1: 1.5 });
    const a = al * DEG, b = be * DEG;
    const Pa = { x: Math.cos(a), y: Math.sin(a) }, Pab = { x: Math.cos(a + b), y: Math.sin(a + b) };
    const e1 = { x: Math.cos(b), y: Math.sin(b) };            // the turned unit step right
    const mid = { x: Pa.x * e1.x, y: Pa.x * e1.y };
    const arc = (r0: number, a0: number, a1: number, col: string) =>
      <path d={`M${pu.X(r0 * Math.cos(a0))},${pu.Y(r0 * Math.sin(a0))} A${r0 * pu.sx},${r0 * pu.sy} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 > a0 ? 0 : 1} ${pu.X(r0 * Math.cos(a1))},${pu.Y(r0 * Math.sin(a1))}`} fill="none" stroke={col} strokeWidth={2} />;
    svg = <>
      <Grid p={pu} step={0.5} labels={false} />
      <circle cx={pu.X(0)} cy={pu.Y(0)} r={pu.sx} fill="none" stroke={C.muted} strokeWidth={1.2} />
      {arc(0.3, 0, a, C.sky)}
      {arc(0.45, a, a + b, C.pink)}
      <line x1={pu.X(0)} y1={pu.Y(0)} x2={pu.X(Pa.x)} y2={pu.Y(Pa.y)} stroke={C.sky} strokeWidth={1.6} />
      <line x1={pu.X(0)} y1={pu.Y(0)} x2={pu.X(Pab.x)} y2={pu.Y(Pab.y)} stroke={C.amber} strokeWidth={1.6} />
      <Vec a={O(pu, { x: 0, y: 0 })} b={O(pu, mid)} color={C.red} w={2.2} />
      <Vec a={O(pu, mid)} b={O(pu, Pab)} color={C.green} w={2.2} />
      <circle cx={pu.X(Pa.x)} cy={pu.Y(Pa.y)} r={5} fill={C.sky} />
      <circle cx={pu.X(Pab.x)} cy={pu.Y(Pab.y)} r={6} fill={C.amber} />
      <T x={pu.X(Pa.x * 1.12)} y={pu.Y(Pa.y * 1.12) + 4} size={10} anchor="middle" color={C.sky} bold>α</T>
      <T x={pu.X(Pab.x * 1.14)} y={pu.Y(Pab.y * 1.14) + 4} size={10} anchor="middle" color={C.amber} bold>α + β</T>
    </>;
    controls = <>
      <Sliders>
        <Slider label="α" value={al} min={0} max={180} step={1} onChange={setAl} fmt={v => `${v}°`} width="w-6" />
        <Slider label="β" value={be} min={0} max={180} step={1} onChange={setBe} fmt={v => `${v}°`} width="w-6" />
      </Sliders>
      <Row>
        <Readout color={C.amber}>{`cos(α + β) = ${n3(Math.cos(a + b))}`}</Readout>
        <Readout>{`cos α cos β − sin α sin β = ${n3(Math.cos(a) * Math.cos(b) - Math.sin(a) * Math.sin(b))}`}</Readout>
      </Row>
      <Row>
        <Readout color={C.amber}>{`sin(α + β) = ${n3(Math.sin(a + b))}`}</Readout>
        <Readout>{`sin α cos β + cos α sin β = ${n3(Math.sin(a) * Math.cos(b) + Math.cos(a) * Math.sin(b))}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRot_noteS", "The blue point sits at angle α, so it is (cos α, sin α). Rotate it by β and it lands at angle α + β (amber), which by definition is (cos(α + β), sin(α + β)). But the rotation formula says the same point is cos α steps along the turned x direction (red) plus sin α steps along the turned y direction (green). Both descriptions name one point, so their coordinates agree, and that is the pair of angle-sum formulas in the readouts.");
  }

  return (
    <Figure
      title={tx(t, "figRot_title", "Rotating by any angle")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["rotate", tx(t, "figRot_mRot", "rotate a point")],
        ["sum", tx(t, "figRot_mSum", "angle sum")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
