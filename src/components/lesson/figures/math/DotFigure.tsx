"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Vec, Handle, plot, Grid, useDrag, nearest, f2, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// projection — a·b = |a||b|cos θ: the signed length of b's shadow on a, times
//              |a|. The background is split by the sign of x·a.
// facing     — an observer sees a point if the angle between its facing and the
//              direction to the point is within half its field of view:
//              f̂ · normalize(P − O) ≥ cos(fov / 2). No angles are computed.
// reflect    — a ray bouncing off a surface: r = d − 2(d·n̂)n̂. The dot product
//              splits d into the part along the normal (flipped) and the part
//              along the surface (kept).
// The lab: a right angle, a negative shadow, a full shadow, the field-of-view
// test, then a ray sent straight back.

type Mode = "proj" | "facing" | "reflect";
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
const len = (a: Pt) => Math.hypot(a.x, a.y);
const nrm = (a: Pt) => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
const p = plot({ W: 560, H: 300, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const S = (v: Pt) => ({ x: p.X(v.x), y: p.Y(v.y) });
const O = S({ x: 0, y: 0 });
const DEG = 180 / Math.PI;

type DotState = { a: Pt; b: Pt; face: Pt; player: Pt; fov: number; src: Pt; tilt: number };

/** Every number the drawing and the readouts need, from the state. */
function derive({ a, b, face, player, fov, src, tilt }: DotState) {
  const ab = dot(a, b), la = len(a), lb = len(b);
  const cos = ab / (la * lb || 1), theta = Math.acos(Math.max(-1, Math.min(1, cos)));
  const ah = nrm(a), projLen = ab / (la || 1), foot = { x: ah.x * projLen, y: ah.y * projLen };
  const fh = nrm(face), dP = nrm(player);
  const fd = dot(fh, dP), limit = Math.cos((fov / 2) / DEG), sees = fd >= limit;
  // reflect: surface through the origin, normal tilted by 'tilt'
  const n = { x: Math.sin(tilt), y: Math.cos(tilt) };
  const d = nrm({ x: -src.x, y: -src.y });                   // incoming direction: from src toward the origin
  const dn = dot(d, n);
  const rv = { x: d.x - 2 * dn * n.x, y: d.y - 2 * dn * n.y };
  const along = { x: d.x - dn * n.x, y: d.y - dn * n.y };
  return { ab, la, lb, cos, theta, ah, projLen, foot, fh, fd, limit, sees, n, d, dn, rv, along };
}

// ── The drawing ───────────────────────────────────────────────────────────────

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function DotStage({ mode, st, set, t }: {
  mode: Mode; st: DotState; t?: TrackTranslations;
  set: { a: (v: Pt) => void; b: (v: Pt) => void; face: (v: Pt) => void; player: (v: Pt) => void; src: (v: Pt) => void };
}) {
  const { a, b, player, src, fov } = st;
  const { ah, foot, fh, sees, n, d, rv, along } = derive(st);
  const handleList: [string, Pt][] = mode === "proj" ? [["a", a], ["b", b]] : mode === "facing" ? [["f", { x: fh.x * 1.6, y: fh.y * 1.6 }], ["p", player]] : [["s", src]];
  const drag = useDrag<string>(q => nearest(q, handleList.map(([id, v]) => [id, S(v)] as [string, Pt]), 16), (id, q) => {
    const w = p.inv(q), v = { x: Math.max(-5.4, Math.min(5.4, w.x)), y: Math.max(-2.9, Math.min(2.9, w.y)) };
    if (id === "a") set.a(v); else if (id === "b") set.b(v); else if (id === "f") set.face(v); else if (id === "p") set.player(v); else set.src({ x: v.x, y: Math.max(0.3, v.y) });
  });

  // half-plane polygon for the sign regions (projection mode)
  const perp = { x: -ah.y, y: ah.x }, big = 20;
  const half = (s: number) => [
    { x: perp.x * big, y: perp.y * big }, { x: perp.x * big + ah.x * big * s, y: perp.y * big + ah.y * big * s },
    { x: -perp.x * big + ah.x * big * s, y: -perp.y * big + ah.y * big * s }, { x: -perp.x * big, y: -perp.y * big },
  ].map(S).map(q => `${q.x},${q.y}`).join(" ");
  const arc = (from: number, to: number, r: number, col: string) => {
    let dA = to - from; while (dA > Math.PI) dA -= 2 * Math.PI; while (dA < -Math.PI) dA += 2 * Math.PI;
    const p0 = S({ x: Math.cos(from) * r, y: Math.sin(from) * r }), p1 = S({ x: Math.cos(from + dA) * r, y: Math.sin(from + dA) * r });
    return <path d={`M${p0.x},${p0.y} A${r * p.sx},${r * p.sy} 0 0 ${dA > 0 ? 0 : 1} ${p1.x},${p1.y}`} fill="none" stroke={col} strokeWidth={2} />;
  };

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto cursor-grab">
      {mode === "proj" && <>
        <polygon points={half(1)} fill={C.green} opacity={0.07} />
        <polygon points={half(-1)} fill={C.red} opacity={0.06} />
      </>}
      <Grid p={p} step={1} />
      {mode === "proj" && <>
        <line x1={S({ x: -ah.x * 8, y: -ah.y * 8 }).x} y1={S({ x: -ah.x * 8, y: -ah.y * 8 }).y} x2={S({ x: ah.x * 8, y: ah.y * 8 }).x} y2={S({ x: ah.x * 8, y: ah.y * 8 }).y} stroke={C.red} strokeOpacity={0.25} />
        <line x1={S(b).x} y1={S(b).y} x2={S(foot).x} y2={S(foot).y} stroke={C.muted} strokeDasharray="3 3" />
        <line x1={O.x} y1={O.y} x2={S(foot).x} y2={S(foot).y} stroke={C.green} strokeWidth={5} opacity={0.7} strokeLinecap="round" />
        {arc(Math.atan2(a.y, a.x), Math.atan2(b.y, b.x), 0.6, C.purple)}
        <Vec a={O} b={S(a)} color={C.red} />
        <Vec a={O} b={S(b)} color={C.sky} />
        <Handle x={S(a).x} y={S(a).y} color={C.red} r={4.5} active={drag.dragging === "a"} />
        <Handle x={S(b).x} y={S(b).y} color={C.sky} r={4.5} active={drag.dragging === "b"} />
        <T x={S(a).x + 8} y={S(a).y + 14} size={10} bold color={C.red}>a</T>
        <T x={S(b).x + 8} y={S(b).y - 6} size={10} bold color={C.sky}>b</T>
      </>}
      {mode === "facing" && (() => {
        const ang = Math.atan2(fh.y, fh.x), h = (fov / 2) / DEG, R = 6;
        const e1 = S({ x: Math.cos(ang - h) * R, y: Math.sin(ang - h) * R }), e2 = S({ x: Math.cos(ang + h) * R, y: Math.sin(ang + h) * R });
        const fHandle = S({ x: fh.x * 1.6, y: fh.y * 1.6 });
        return <>
          <path d={`M${O.x},${O.y} L${e1.x},${e1.y} A${R * p.sx},${R * p.sy} 0 ${2 * h > Math.PI ? 1 : 0} 0 ${e2.x},${e2.y} Z`} fill={sees ? C.green : C.amber} opacity={0.12} />
          <line x1={O.x} y1={O.y} x2={S(player).x} y2={S(player).y} stroke={sees ? C.green : C.red} strokeDasharray="5 4" />
          <Vec a={O} b={fHandle} color={C.amber} w={3} />
          <circle cx={O.x} cy={O.y} r={10} fill={C.amber} />
          <circle cx={S(player).x} cy={S(player).y} r={9} fill={sees ? C.green : C.red} />
          <Handle x={fHandle.x} y={fHandle.y} color={C.amber} r={4} active={drag.dragging === "f"} />
          <T x={O.x - 14} y={O.y + 24} size={10} bold color={C.amber}>G</T>
          <T x={S(player).x + 12} y={S(player).y + 4} size={10} bold color={sees ? C.green : C.red}>P</T>
        </>;
      })()}
      {mode === "reflect" && (() => {
        const tan = { x: n.y, y: -n.x };
        const s0 = S({ x: -tan.x * 7, y: -tan.y * 7 }), s1 = S({ x: tan.x * 7, y: tan.y * 7 });
        return <>
          <line x1={s0.x} y1={s0.y} x2={s1.x} y2={s1.y} stroke={C.fg} strokeWidth={3} />
          {Array.from({ length: 22 }, (_, i) => { const u = -6 + i * 0.6; const q0 = S({ x: tan.x * u, y: tan.y * u }), q1 = S({ x: tan.x * u - n.x * 0.25 - tan.x * 0.2, y: tan.y * u - n.y * 0.25 - tan.y * 0.2 }); return <line key={i} x1={q0.x} y1={q0.y} x2={q1.x} y2={q1.y} stroke={C.muted} opacity={0.6} />; })}
          <Vec a={O} b={S({ x: n.x * 1.6, y: n.y * 1.6 })} color={C.green} />
          <T x={S({ x: n.x * 1.7, y: n.y * 1.7 }).x + 4} y={S({ x: n.x * 1.7, y: n.y * 1.7 }).y} size={10} bold color={C.green}>n̂</T>
          <Vec a={S(src)} b={O} color={C.sky} w={2.4} />
          <Vec a={O} b={S({ x: rv.x * 3, y: rv.y * 3 })} color={C.amber} w={2.4} />
          {/* d split into its two parts, drawn along the incoming ray (scaled ×2.4) */}
          <Vec a={S({ x: -d.x * 2.4, y: -d.y * 2.4 })} b={S({ x: (along.x - d.x) * 2.4, y: (along.y - d.y) * 2.4 })} color={C.purple} dash="4 3" opacity={0.85} />
          <Vec a={S({ x: (along.x - d.x) * 2.4, y: (along.y - d.y) * 2.4 })} b={O} color={C.red} dash="4 3" opacity={0.85} />
          <Handle x={S(src).x} y={S(src).y} color={C.sky} r={5} active={drag.dragging === "s"} />
          <T x={S(src).x + 8} y={S(src).y - 6} size={10} bold color={C.sky}>d</T>
          <T x={S({ x: rv.x * 3, y: rv.y * 3 }).x + 6} y={S({ x: rv.x * 3, y: rv.y * 3 }).y} size={10} bold color={C.amber}>r</T>
          <T x={8} y={p.H - 22} size={8.5} color={C.purple}>{tx(t, "figDot_along", "- - part along the surface (kept)")}</T>
          <T x={8} y={p.H - 9} size={8.5} color={C.red}>{tx(t, "figDot_normal", "- - part along the normal (reversed)")}</T>
        </>;
      })()}
    </svg>
  );
}

export function DotFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("proj");
  const [a, setA] = useState<Pt>({ x: 3, y: 0.8 });
  const [b, setB] = useState<Pt>({ x: 1.4, y: 2.2 });
  const [face, setFace] = useState<Pt>({ x: 1, y: 0.35 });
  const [player, setPlayer] = useState<Pt>({ x: 3.4, y: 1.6 });
  const [fov, setFov] = useState(70);
  const [src, setSrc] = useState<Pt>({ x: -3.5, y: 2.4 });
  const [tilt, setTilt] = useState(0);
  const lab = useLab("math-dot");

  const st: DotState = { a, b, face, player, fov, src, tilt };
  const { ab, la, lb, cos, theta, projLen, fd, limit, sees, d, dn, rv } = derive(st);
  const set = { a: setA, b: setB, face: setFace, player: setPlayer, src: setSrc };

  const view = <DotStage mode={mode} st={st} set={set} t={t} />;
  const modeChoice = <Choice value={mode} onChange={setMode} options={[["proj", tx(t, "figDot_proj", "projection")], ["facing", tx(t, "figDot_facing", "field of view")], ["reflect", tx(t, "figDot_reflect", "reflection")]] as const} />;
  const controls = <>
    {mode === "facing" && <Slider label={tx(t, "figDot_fov", "field of view")} value={fov} min={10} max={300} step={1} onChange={setFov} fmt={v => `${v}°`} width="w-28" />}
    {mode === "reflect" && <Slider label={tx(t, "figDot_tilt", "surface tilt")} value={tilt} min={-0.8} max={0.8} step={0.01} onChange={setTilt} fmt={v => `${Math.round(v * DEG)}°`} width="w-28" />}
    <Row>
      {mode === "proj" && <>
        <Readout>a·b = aₓbₓ + a_yb_y = {f2(ab)}</Readout>
        <Readout>|a||b|cos θ = {f2(la)} × {f2(lb)} × {f2(cos, 3)}</Readout>
        <Readout color={C.purple}>θ = {(theta * DEG).toFixed(1)}°</Readout>
        <Readout color={C.green}>{tx(t, "figDot_shadow", "shadow of b on a")} = a·b / |a| = {f2(projLen)}</Readout>
      </>}
      {mode === "facing" && <>
        <Readout>f̂ · dir = {f2(fd, 3)}</Readout>
        <Readout>cos(fov/2) = {f2(limit, 3)}</Readout>
        <Readout color={sees ? C.green : C.red}>{sees ? tx(t, "figDot_sees", "seen") : tx(t, "figDot_hidden", "not seen")}</Readout>
      </>}
      {mode === "reflect" && <>
        <Readout>d·n̂ = {f2(dn, 3)}</Readout>
        <Readout color={C.amber}>r = d − 2(d·n̂)n̂ = ({f2(rv.x, 3)}, {f2(rv.y, 3)})</Readout>
      </>}
    </Row>
  </>;
  const note = {
    proj: tx(t, "figDot_noteProj", "Drag a and b. Drop a perpendicular from b's tip onto the line of a: the green segment is b's shadow on a, and a·b is that shadow's signed length times |a|. The sign alone is already useful: positive when b points into a's half of the plane (green background), zero when they are perpendicular, negative when b points away. With unit vectors the dot product is just cos θ, a similarity score from −1 (opposite) to 1 (same direction)."),
    facing: tx(t, "figDot_noteFacing", "Drag the observer's facing handle and the point P. The observer sees P when the angle between the facing and the direction to P is at most half the field of view (a person sees about 180° side to side). Instead of working out that angle with arccos, compare cosines: both vectors are unit length, so their dot product is the cosine of the angle, and a larger cosine means a smaller angle. Past 180° the cone wraps behind the observer and the limit cos(fov/2) becomes negative: the test still works."),
    reflect: tx(t, "figDot_noteReflect", "Drag the light's source. The incoming direction d is split into two parts: (d·n̂)n̂ along the surface normal, and the rest along the surface. A mirror keeps the part along the surface and reverses the part along the normal. Subtracting the normal part twice (once to cancel it, once to reverse it) gives r = d − 2(d·n̂)n̂, the law of reflection. The same formula bounces a ball off a wall."),
  }[mode];

  // ── Lab ──
  const back = dot(rv, d);                                    // −1 when the ray goes straight back
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figDotL1_t", "A right angle"),
      body: <>
        <p>{tx(t, "figDotL1_b1", "The green bar is b's shadow on the line of a. a · b is its signed length times |a|.")}</p>
        <p>{tx(t, "figDotL1_b2", "Drag b until the shadow vanishes.")}</p>
      </>,
      goal: { text: tx(t, "figDotL1_g", "a · b = 0 (θ = 90°, to within 1°)."), done: mode === "proj" && Math.abs(theta * DEG - 90) < 1 },
      hint: tx(t, "figDotL1_h", "a = (3, 0.8). A perpendicular arrow swaps the components and flips one sign: try b near (−0.8, 3)."),
      setup: () => { setMode("proj"); setA({ x: 3, y: 0.8 }); setB({ x: 1.4, y: 2.2 }); },
    },
    {
      title: tx(t, "figDotL2_t", "A negative shadow"),
      body: <>
        <p>{tx(t, "figDotL2_b1", "Past 90° the shadow falls behind the origin, and the product turns negative.")}</p>
        <p>{tx(t, "figDotL2_b2", "Move b into the red half and push a · b below −5.")}</p>
      </>,
      goal: { text: tx(t, "figDotL2_g", "a · b < −5."), done: mode === "proj" && ab < -5 },
      hint: tx(t, "figDotL2_h", "Point b roughly opposite to a, and make it long: the product grows with both lengths."),
    },
    {
      title: tx(t, "figDotL3_t", "The whole length"),
      body: <>
        <p>{tx(t, "figDotL3_b1", "The shadow can never be longer than b itself: |b| cos θ ≤ |b|.")}</p>
        <p>{tx(t, "figDotL3_b2", "Make the shadow as long as b.")}</p>
      </>,
      goal: { text: tx(t, "figDotL3_g", "cos θ > 0.999: b lies along a."), done: mode === "proj" && cos > 0.999 },
    },
    {
      title: tx(t, "figDotL4_t", "Quick check"),
      body: <p>{tx(t, "figDotL4_b", "a = (1, 0, 1) and b = (0, 1, 1), both of length √2.")}</p>,
      quiz: {
        q: tx(t, "figDotL4_q", "What is the angle between them?"),
        options: ["60°", "45°", "90°", "30°"],
        answer: 0,
        why: tx(t, "figDotL4_w", "a · b = 0 + 0 + 1 = 1, so cos θ = 1 / (√2 · √2) = 1/2 and θ = 60°. They are not perpendicular, because they share the z component."),
      },
    },
    {
      title: tx(t, "figDotL5_t", "Out of sight"),
      body: <>
        <p>{tx(t, "figDotL5_b1", "P is seen when f̂ · dir ≥ cos(fov/2). A narrower view raises the limit.")}</p>
        <p>{tx(t, "figDotL5_b2", "Narrow the field of view until P drops out of it.")}</p>
      </>,
      goal: { text: tx(t, "figDotL5_g", "P is not seen."), done: mode === "facing" && !sees },
      hint: tx(t, "figDotL5_h", "P is about 30° off the facing direction, so any view narrower than 60° loses it."),
      setup: () => { setMode("facing"); setFace({ x: 1, y: 0 }); setPlayer({ x: 3, y: 1.73 }); setFov(120); },
    },
    {
      title: tx(t, "figDotL6_t", "Quick check"),
      body: <p>{tx(t, "figDotL6_b", "A guard sees 120° in total. The dot product of their facing with the unit direction to a thief is 0.6.")}</p>,
      quiz: {
        q: tx(t, "figDotL6_q", "Does the guard see the thief?"),
        options: [tx(t, "figDotL6_o1", "Yes: 0.6 ≥ cos 60° = 0.5"), tx(t, "figDotL6_o2", "No: 0.6 < cos 120° = −0.5"), tx(t, "figDotL6_o3", "No: 0.6 is less than 1"), tx(t, "figDotL6_o4", "Only if the thief is closer than 0.6")],
        answer: 0,
        why: tx(t, "figDotL6_w", "Compare with half the field of view: cos 60° = 0.5. A cosine of 0.6 means an angle of about 53°, inside the 60° half-cone. Distance plays no part, because both vectors are unit length."),
      },
    },
    {
      title: tx(t, "figDotL7_t", "Straight back"),
      body: <>
        <p>{tx(t, "figDotL7_b1", "The light comes from the upper left. The mirror keeps the purple part and reverses the red one.")}</p>
        <p>{tx(t, "figDotL7_b2", "Tilt the mirror so the ray bounces straight back to its source.")}</p>
      </>,
      goal: { text: tx(t, "figDotL7_g", "r = −d."), done: mode === "reflect" && back < -0.999 },
      hint: tx(t, "figDotL7_h", "The ray must hit head-on, with no part along the surface: the normal must point at the source. That takes a tilt of −45°."),
      setup: () => { setMode("reflect"); setSrc({ x: -2, y: 2 }); setTilt(0); },
    },
    {
      title: tx(t, "figDotL8_t", "Quick check"),
      body: <p>{tx(t, "figDotL8_b", "A ray d = (3, −4) hits a floor whose normal is n̂ = (0, 1).")}</p>,
      quiz: {
        q: tx(t, "figDotL8_q", "Which way does it leave?"),
        options: ["(3, 4)", "(−3, 4)", "(−3, −4)", "(3, −4)"],
        answer: 0,
        why: tx(t, "figDotL8_w", "d · n̂ = −4, so r = (3, −4) − 2 · (−4) · (0, 1) = (3, −4) + (0, 8) = (3, 4). The part along the floor (3) is kept; only the vertical part flips. (−3, 4) would send it back the way it came."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "perp", tone: "ok", when: mode === "proj" && Math.abs(theta * DEG - 90) < 1,
      title: tx(t, "figDotI1_t", "Perpendicular"),
      body: fill(tx(t, "figDotI1_b", "a · b = {ab}: no shadow at all. The dot product is zero exactly when the two arrows meet at a right angle, which makes it the standard perpendicularity test."), { ab: f2(ab) }),
    },
    {
      id: "neg", tone: "info", when: mode === "proj" && ab < 0 && Math.abs(theta * DEG - 90) >= 1,
      title: tx(t, "figDotI2_t", "Pointing away"),
      body: fill(tx(t, "figDotI2_b", "θ = {th}° is obtuse, so cos θ < 0 and the shadow points backwards along a. The sign alone answers \"same side or opposite?\"."), { th: (theta * DEG).toFixed(0) }),
    },
    {
      id: "full", tone: "ok", when: mode === "proj" && cos > 0.999,
      title: tx(t, "figDotI3_t", "The largest it gets"),
      body: fill(tx(t, "figDotI3_b", "cos θ = 1, so a · b = |a||b| = {ab}. For two given lengths no angle gives more."), { ab: f2(ab) }),
    },
    {
      id: "wide", tone: "info", when: mode === "facing" && fov > 180,
      title: tx(t, "figDotI4_t", "Seeing behind"),
      body: fill(tx(t, "figDotI4_b", "Half of {fov}° is more than 90°, so the limit cos(fov/2) = {lim} is negative: points slightly behind the observer also pass the test."), { fov, lim: f2(limit, 3) }),
    },
    {
      id: "headon", tone: "ok", when: mode === "reflect" && back < -0.999,
      title: tx(t, "figDotI5_t", "Head-on"),
      body: tx(t, "figDotI5_b", "d is parallel to the normal: d · n̂ = −1 and the part along the surface is zero. Reversing the normal part reverses the whole ray."),
    },
    {
      id: "graze", tone: "info", when: mode === "reflect" && Math.abs(dn) < 0.15,
      title: tx(t, "figDotI6_t", "A grazing ray"),
      body: fill(tx(t, "figDotI6_b", "d · n̂ = {dn}: the ray almost skims the surface. The normal part is tiny, so the bounce barely changes its direction."), { dn: f2(dn, 3) }),
    },
  ];

  const title = tx(t, "figDot_title", "The dot product at work");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {view}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figDotR1", "a · b = aₓbₓ + a_yb_y = |a||b| cos θ: the shadow of b on a, times |a|."),
          tx(t, "figDotR2", "Positive: same side. Zero: perpendicular. Negative: pointing away."),
          tx(t, "figDotR3", "With unit vectors the dot product is the cosine, so compare cosines instead of angles."),
          tx(t, "figDotR4", "r = d − 2(d · n̂)n̂ keeps the part along the surface and flips the part along the normal."),
        ]}
      />
    </>
  );
}
