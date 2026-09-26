"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// cosines — any triangle ABC with draggable corners. Dropping the height from
//           B onto side CA splits it into two right triangles; Pythagoras on
//           one of them gives c² = a² + b² − 2ab·cos C.
// sines   — the same triangle with its circumscribed circle: each side divided
//           by the sine of the opposite angle is the circle's diameter 2R.
// ssa     — two sides and an angle not between them: the circle of radius a
//           around C can cut the ray from A twice, once or never.
// ik      — a two-bone arm (upper arm, forearm) reaching for a draggable
//           target; the law of cosines gives the elbow and shoulder angles.

type Mode = "cosines" | "sines" | "ssa" | "ik";
const W = 560, H = 300;
const p = plot({ W, H, x0: -1.2, x1: 8.133, y0: -1, y1: 4 });
const DEG = 180 / Math.PI;
const n2 = (v: number) => (+v.toFixed(2)).toString().replace("-", "−");
const X = (q: Pt) => p.X(q.x), Y = (q: Pt) => p.Y(q.y);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
/** Interior angle at q between rays to a and b, in radians. */
const angleAt = (q: Pt, a: Pt, b: Pt) => {
  const ux = a.x - q.x, uy = a.y - q.y, vx = b.x - q.x, vy = b.y - q.y;
  return Math.acos(clamp((ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1), -1, 1));
};
const tri = (q: Pt[], col: string, op = 0.14) =>
  <polygon points={q.map(v => `${X(v)},${Y(v)}`).join(" ")} fill={col} fillOpacity={op} stroke={col} strokeWidth={2} strokeLinejoin="round" />;

export function TriangleLawFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("cosines");
  const [A, setA] = useState<Pt>({ x: 0, y: 0 }), [B, setB] = useState<Pt>({ x: 2.2, y: 3.2 }), [Cp, setCp] = useState<Pt>({ x: 6, y: 0 });
  const [sa, setSa] = useState(4), [alpha, setAlpha] = useState(35);
  const [l1, setL1] = useState(3), [l2, setL2] = useState(2.5);
  const [target, setTarget] = useState<Pt>({ x: 4, y: 2 });
  const S = { x: 1, y: 0.5 };                                   // the arm's shoulder

  const drag = useDrag<"A" | "B" | "C" | "T">(
    q => mode === "ik" ? nearest(q, [["T", { x: X(target), y: Y(target) }]], 22)
      : mode === "ssa" ? null
      : nearest(q, [["A", { x: X(A), y: Y(A) }], ["B", { x: X(B), y: Y(B) }], ["C", { x: X(Cp), y: Y(Cp) }]], 20),
    (id, q) => {
      const w = p.inv(q), s = { x: clamp(w.x, -1, 7.9), y: clamp(w.y, -0.8, 3.8) };
      if (id === "A") setA(s); else if (id === "B") setB(s); else if (id === "C") setCp(s); else setTarget(s);
    });

  const names = (q: [string, Pt, Pt][]) => q.map(([n, v, c]) => {
    const dx = v.x - c.x, dy = v.y - c.y, l = Math.hypot(dx, dy) || 1;
    return <T key={n} x={X(v) + (dx / l) * 14} y={Y(v) - (dy / l) * 14 + 4} size={11} anchor="middle" color={C.fg} bold>{n}</T>;
  });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "cosines" || mode === "sines") {
    const a = dist(B, Cp), b = dist(Cp, A), c = dist(A, B);
    const aA = angleAt(A, B, Cp), aB = angleAt(B, A, Cp), aC = angleAt(Cp, A, B);
    const G = { x: (A.x + B.x + Cp.x) / 3, y: (A.y + B.y + Cp.y) / 3 };
    const mid = (u: Pt, v: Pt, lab: string, col: string) => {
      const m = { x: (u.x + v.x) / 2, y: (u.y + v.y) / 2 }, dx = m.x - G.x, dy = m.y - G.y, l = Math.hypot(dx, dy) || 1;
      const nx = dx / l, ny = dy / l, anchor = nx > 0.35 ? "start" : nx < -0.35 ? "end" : "middle";
      return <T x={X(m) + nx * 10} y={Y(m) - ny * 12 + 4} size={10.5} anchor={anchor} color={col} bold>{lab}</T>;
    };
    if (mode === "cosines") {
      // Foot of the height from B onto the line through C and A
      const ux = (A.x - Cp.x) / b, uy = (A.y - Cp.y) / b;
      const proj = (B.x - Cp.x) * ux + (B.y - Cp.y) * uy;
      const D = { x: Cp.x + ux * proj, y: Cp.y + uy * proj };
      const corr = 2 * a * b * Math.cos(aC);
      svg = <>
        <Grid p={p} step={1} labels={false} />
        <line x1={X(Cp)} y1={Y(Cp)} x2={X(D)} y2={Y(D)} stroke={C.muted} strokeWidth={1} strokeDasharray="2 3" />
        {tri([A, B, Cp], C.sky)}
        <line x1={X(B)} y1={Y(B)} x2={X(D)} y2={Y(D)} stroke={C.purple} strokeWidth={1.6} strokeDasharray="5 3" />
        <circle cx={X(D)} cy={Y(D)} r={3.5} fill={C.purple} />
        <T x={X(D)} y={Y(D) + 15} size={10} anchor="middle" color={C.purple} bold>D</T>
        {mid(B, Cp, `a = ${n2(a)}`, C.red)}
        {mid(Cp, A, `b = ${n2(b)}`, C.green)}
        {mid(A, B, `c = ${n2(c)}`, C.amber)}
        {names([["A", A, G], ["B", B, G], ["C", Cp, G]])}
        {(["A", "B", "C"] as const).map(k => { const v = k === "A" ? A : k === "B" ? B : Cp; return <Handle key={k} x={X(v)} y={Y(v)} color={C.pink} active={drag.dragging === k} />; })}
      </>;
      controls = <Row>
        <Readout>{`C = ${(aC * DEG).toFixed(1)}°`}</Readout>
        <Readout color={C.amber}>{`c² = ${n2(c * c)}`}</Readout>
        <Readout>{`a² + b² = ${n2(a * a + b * b)}`}</Readout>
        <Readout color={C.purple}>{`2ab·cos C = ${n2(corr)}`}</Readout>
        <Readout color={C.green}>{`a² + b² − 2ab·cos C = ${n2(a * a + b * b - corr)}`}</Readout>
      </Row>;
      note = tx(t, "figTl_noteC", "Drag the corners. The dashed purple height from B meets the line CA at D, at a right angle. In the right triangle BDC, CD = a·cos C and BD = a·sin C; the rest of the base, DA, is b − a·cos C. Pythagoras on the right triangle BDA gives c² = (a sin C)² + (b − a cos C)², which simplifies to a² + b² − 2ab cos C. Make C a right angle: the correction 2ab cos C becomes 0 and it is Pythagoras. Make C obtuse: the cosine turns negative, D falls outside the triangle and c² is bigger than a² + b².");
    } else {
      // Circumcentre: where the perpendicular bisectors of the sides meet
      const d2 = 2 * (A.x * (B.y - Cp.y) + B.x * (Cp.y - A.y) + Cp.x * (A.y - B.y));
      const sq = (v: Pt) => v.x * v.x + v.y * v.y;
      const O = Math.abs(d2) < 1e-9 ? G : {
        x: (sq(A) * (B.y - Cp.y) + sq(B) * (Cp.y - A.y) + sq(Cp) * (A.y - B.y)) / d2,
        y: (sq(A) * (Cp.x - B.x) + sq(B) * (A.x - Cp.x) + sq(Cp) * (B.x - A.x)) / d2,
      };
      const R = dist(O, A);
      svg = <>
        <Grid p={p} step={1} labels={false} />
        <circle cx={X(O)} cy={Y(O)} r={R * p.sx} fill="none" stroke={C.purple} strokeWidth={1.5} />
        <line x1={X(O)} y1={Y(O)} x2={X(A)} y2={Y(A)} stroke={C.purple} strokeWidth={1} strokeDasharray="3 3" />
        <circle cx={X(O)} cy={Y(O)} r={3} fill={C.purple} />
        {tri([A, B, Cp], C.sky)}
        {mid(B, Cp, "a", C.red)}
        {mid(Cp, A, "b", C.green)}
        {mid(A, B, "c", C.amber)}
        {names([["A", A, G], ["B", B, G], ["C", Cp, G]])}
        {(["A", "B", "C"] as const).map(k => { const v = k === "A" ? A : k === "B" ? B : Cp; return <Handle key={k} x={X(v)} y={Y(v)} color={C.pink} active={drag.dragging === k} />; })}
      </>;
      controls = <Row>
        <Readout color={C.red}>{`a / sin A = ${n2(a)} / ${(Math.sin(aA)).toFixed(3)} = ${n2(a / Math.sin(aA))}`}</Readout>
        <Readout color={C.green}>{`b / sin B = ${n2(b / Math.sin(aB))}`}</Readout>
        <Readout color={C.amber}>{`c / sin C = ${n2(c / Math.sin(aC))}`}</Readout>
        <Readout color={C.purple}>{`2R = ${n2(2 * R)}`}</Readout>
      </Row>;
      note = tx(t, "figTl_noteS", "Each side is opposite the corner with the same letter: a faces A. Drag the corners: the three ratios side / sine of the opposite angle stay equal to one another, and equal to the diameter of the circle through the three corners (purple). A long side must face a large angle, and the law of sines says exactly how large.");
    }
  } else if (mode === "ssa") {
    const b = 5.5, al = (alpha * Math.PI) / 180;
    const A0 = { x: 0, y: 0 }, C0 = { x: b, y: 0 };
    const h = b * Math.sin(al);
    // Points on the ray t(cos α, sin α) at distance sa from C: t² − 2tb cos α + b² − a² = 0
    const disc = (b * Math.cos(al)) ** 2 - (b * b - sa * sa);
    const ts = disc < -1e-9 ? [] : [b * Math.cos(al) - Math.sqrt(Math.max(0, disc)), b * Math.cos(al) + Math.sqrt(Math.max(0, disc))]
      .filter((v, i, arr) => v > 1e-6 && (i === 0 || Math.abs(v - arr[0]) > 1e-6));
    const Bs = ts.map(v => ({ x: v * Math.cos(al), y: v * Math.sin(al) }));
    const ray = { x: 9 * Math.cos(al), y: 9 * Math.sin(al) };
    const verdict = Bs.length === 2 ? tx(t, "figTl_two", "two triangles") : Bs.length === 1 ? tx(t, "figTl_one", "one triangle") : tx(t, "figTl_none", "no triangle");
    svg = <>
      <Grid p={p} step={1} labels={false} />
      <line x1={X(A0)} y1={Y(A0)} x2={X(ray)} y2={Y(ray)} stroke={C.muted} strokeWidth={1.2} strokeDasharray="5 3" />
      <circle cx={X(C0)} cy={Y(C0)} r={sa * p.sx} fill="none" stroke={C.red} strokeWidth={1.2} strokeDasharray="4 3" />
      {Bs.map((Bv, i) => <g key={i}>{tri([A0, Bv, C0], i === 0 ? C.amber : C.sky, 0.18)}
        <line x1={X(C0)} y1={Y(C0)} x2={X(Bv)} y2={Y(Bv)} stroke={C.red} strokeWidth={2.5} />
        <T x={X(Bv) - 6} y={Y(Bv) - 8} size={11} anchor="end" color={i === 0 ? C.amber : C.sky} bold>{`B${Bs.length > 1 ? (i ? "₂" : "₁") : ""}`}</T>
      </g>)}
      <line x1={X(A0)} y1={Y(A0)} x2={X(C0)} y2={Y(C0)} stroke={C.green} strokeWidth={3} />
      <T x={X(A0) - 10} y={Y(A0) + 4} size={11} anchor="end" color={C.fg} bold>A</T>
      <T x={X(C0) + 10} y={Y(C0) + 4} size={11} color={C.fg} bold>C</T>
      <T x={X({ x: b / 2, y: 0 })} y={Y(A0) + 15} size={10} anchor="middle" color={C.green} bold>{`b = ${b}`}</T>
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figTl_a", "side a")} value={sa} min={1} max={7} step={0.05} onChange={setSa} fmt={n2} />
        <Slider label={tx(t, "figTl_alpha", "angle A")} value={alpha} min={10} max={80} step={1} onChange={setAlpha} fmt={v => `${v}°`} />
      </Sliders>
      <Row>
        <Readout>{`b · sin A = ${n2(h)}`}</Readout>
        <Readout color={C.red}>{`a = ${n2(sa)}`}</Readout>
        <Readout color={C.pink}>{verdict}</Readout>
      </Row>
    </>;
    note = tx(t, "figTl_noteA", "You know side b (green), the angle A, and side a, which is not next to A. Corner B must lie on the dashed ray from A and at distance a from C, so on the red circle. If a is shorter than the distance from C to the ray, b · sin A, the circle misses and no triangle exists. If a lies between b · sin A and b, the circle cuts the ray twice: two different triangles fit the data. That is why SSA proves nothing, as the triangles chapter warned.");
  } else {
    const d0 = dist(S, target), reach = clamp(d0, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
    const base = Math.atan2(target.y - S.y, target.x - S.x);
    // Angle at the shoulder between the shoulder→target line and the upper arm
    const sh = Math.acos(clamp((l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach), -1, 1));
    const elbowAng = Math.acos(clamp((l1 * l1 + l2 * l2 - reach * reach) / (2 * l1 * l2), -1, 1));
    const E = { x: S.x + l1 * Math.cos(base + sh), y: S.y + l1 * Math.sin(base + sh) };
    const hand = { x: S.x + reach * Math.cos(base), y: S.y + reach * Math.sin(base) };
    const out = d0 > l1 + l2;
    svg = <>
      <Grid p={p} step={1} labels={false} />
      <circle cx={X(S)} cy={Y(S)} r={(l1 + l2) * p.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="4 4" />
      <line x1={X(S)} y1={Y(S)} x2={X(target)} y2={Y(target)} stroke={C.muted} strokeWidth={1} strokeDasharray="2 3" />
      <line x1={X(S)} y1={Y(S)} x2={X(E)} y2={Y(E)} stroke={C.sky} strokeWidth={8} strokeLinecap="round" />
      <line x1={X(E)} y1={Y(E)} x2={X(hand)} y2={Y(hand)} stroke={C.teal} strokeWidth={6} strokeLinecap="round" />
      <circle cx={X(S)} cy={Y(S)} r={7} fill={C.fg} />
      <circle cx={X(E)} cy={Y(E)} r={6} fill={C.fg} />
      <circle cx={X(hand)} cy={Y(hand)} r={5} fill={C.green} />
      <Handle x={X(target)} y={Y(target)} color={out ? C.red : C.amber} active={drag.dragging === "T"} />
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figTl_l1", "upper arm")} value={l1} min={1} max={4} step={0.1} onChange={setL1} fmt={n2} />
        <Slider label={tx(t, "figTl_l2", "forearm")} value={l2} min={1} max={4} step={0.1} onChange={setL2} fmt={n2} />
      </Sliders>
      <Row>
        <Readout>{`d = ${n2(d0)}`}</Readout>
        <Readout color={C.sky}>{`${tx(t, "figTl_elbow", "elbow")} = acos((l₁² + l₂² − d²)/(2l₁l₂)) = ${(elbowAng * DEG).toFixed(1)}°`}</Readout>
        <Readout color={C.teal}>{`${tx(t, "figTl_shoulder", "shoulder")} = ${((base + sh) * DEG).toFixed(1)}°`}</Readout>
        {out && <Readout color={C.red}>{tx(t, "figTl_out", "out of reach: arm stretched")}</Readout>}
      </Row>
    </>;
    note = tx(t, "figTl_noteK", "Drag the target. Upper arm, forearm and the line from shoulder to target form a triangle with three known sides, so the law of cosines gives every angle: the elbow angle directly, and the shoulder angle as the angle between the target line and the upper arm. When the target is further than l₁ + l₂ (outside the dashed circle) no triangle exists; the code clamps the distance so the arm simply stretches towards it instead of producing NaN.");
  }

  return (
    <Figure
      title={tx(t, "figTl_title", "Solving any triangle")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["cosines", tx(t, "figTl_mCos", "law of cosines")],
        ["sines", tx(t, "figTl_mSin", "law of sines")],
        ["ssa", tx(t, "figTl_mSsa", "ambiguous case")],
        ["ik", tx(t, "figTl_mIk", "two-bone IK")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
