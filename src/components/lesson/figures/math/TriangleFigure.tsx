"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// classify   — drag the three corners of a triangle on a grid. Each corner's
//              angle is drawn and measured, the sides are measured, and the
//              triangle is named by its sides and by its angles. Top right,
//              the three angles are copied side by side onto a straight line:
//              they always fill it exactly, 180°.
// inequality — choose three side lengths. Side c lies flat; the arcs are
//              every point at distance b from its left end and at distance a
//              from its right end. The third corner must be on both arcs, so
//              the triangle exists only when they cross: when each side is
//              shorter than the other two together.
// The lab: build a right, an isosceles and an obtuse triangle, collapse one,
// then find side lengths that do and do not close.

type Mode = "classify" | "inequality";
type Id = "A" | "B" | "C";
type Pts = Record<Id, Pt>;
const IDS: Id[] = ["A", "B", "C"];
const COL: Record<Id, string> = { A: C.sky, B: C.pink, C: C.amber };
const deg = (r: number) => (r * 180) / Math.PI;
const n1 = (v: number) => (+v.toFixed(1)).toString();
const p = plot({ W: 560, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
const q = plot({ W: 560, H: 300, x0: -1.5, x1: 12.5, y0: -2.5, y1: 5 });
const V = (u: Pt) => ({ x: p.X(u.x), y: p.Y(u.y) });

/** Interior angle at p between the directions to q and s, in degrees. */
function angleAt(a: Pt, b: Pt, s: Pt) {
  const u = Math.atan2(b.y - a.y, b.x - a.x), v = Math.atan2(s.y - a.y, s.x - a.x);
  let d = Math.abs(u - v);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return deg(d);
}

/** Wedge (in viewBox units) at a towards b and s, radius r. */
function wedge(a: Pt, b: Pt, s: Pt, r: number) {
  const u = Math.atan2(b.y - a.y, b.x - a.x), v = Math.atan2(s.y - a.y, s.x - a.x);
  let d = v - u;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const e = { x: a.x + r * Math.cos(v), y: a.y + r * Math.sin(v) };
  return `M${a.x},${a.y} L${a.x + r * Math.cos(u)},${a.y + r * Math.sin(u)} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${e.x},${e.y} Z`;
}

/** Angles, sides and names of the triangle with corners pts. */
function classify(pts: Pts) {
  const S = { A: V(pts.A), B: V(pts.B), C: V(pts.C) };
  const ang = { A: angleAt(S.A, S.B, S.C), B: angleAt(S.B, S.C, S.A), C: angleAt(S.C, S.A, S.B) };
  const len = (u: Pt, v: Pt) => Math.hypot(u.x - v.x, u.y - v.y);
  // Side a is opposite corner A, and so on
  const side = { a: len(pts.B, pts.C), b: len(pts.C, pts.A), c: len(pts.A, pts.B) };
  const area2 = Math.abs((pts.B.x - pts.A.x) * (pts.C.y - pts.A.y) - (pts.C.x - pts.A.x) * (pts.B.y - pts.A.y));
  const same = (x: number, y: number) => Math.abs(x - y) < 1e-6;
  const equal = [same(side.a, side.b), same(side.b, side.c), same(side.c, side.a)].filter(Boolean).length;
  const big = Math.max(ang.A, ang.B, ang.C);
  const byAngles: "right" | "obtuse" | "acute" = Math.abs(big - 90) < 0.05 ? "right" : big > 90 ? "obtuse" : "acute";
  return { S, ang, side, flat: area2 < 1e-9, equal, byAngles, rounded: IDS.map(k => Math.round(ang[k])) };
}

/** Does a triangle with sides a, b, c exist, and is it flat? */
function closes(sa: number, sb: number, sc: number) {
  const ok = sa + sb > sc && sa + sc > sb && sb + sc > sa;
  const flat = !ok && (Math.abs(sa + sb - sc) < 1e-9 || Math.abs(sa + sc - sb) < 1e-9 || Math.abs(sb + sc - sa) < 1e-9);
  return { ok, flat };
}

// ── The drawings (the stage owns its drag: it is mounted twice while the lab is open) ──

function ClassifyDrawing({ pts, dragging }: { pts: Pts; dragging: Id | null }) {
  const { S, ang, side, flat } = classify(pts);
  // The three angles laid side by side on a line, top right
  const L = { x: 470, y: 62 }, rr = 38;
  let start = 0;
  const fan = IDS.map(k => {
    const a0 = start, a1 = start + ang[k]; start = a1;
    const e0 = { x: L.x + rr * Math.cos((a0 * Math.PI) / 180), y: L.y - rr * Math.sin((a0 * Math.PI) / 180) };
    const e1 = { x: L.x + rr * Math.cos((a1 * Math.PI) / 180), y: L.y - rr * Math.sin((a1 * Math.PI) / 180) };
    return <path key={k} d={`M${L.x},${L.y} L${e0.x},${e0.y} A${rr},${rr} 0 0 0 ${e1.x},${e1.y} Z`} fill={COL[k]} fillOpacity={0.45} stroke={COL[k]} />;
  });
  return <>
    <Grid p={p} step={1} labels={false} />
    <rect x={L.x - rr - 10} y={L.y - rr - 14} width={2 * rr + 20} height={rr + 30} rx={6} fill="var(--surface)" stroke={C.grid} />
    {!flat && fan}
    <line x1={L.x - rr - 4} y1={L.y} x2={L.x + rr + 4} y2={L.y} stroke={C.fg} strokeWidth={1.6} />
    <T x={L.x} y={L.y + 12} size={8.5} anchor="middle" color={C.fg}>{`A + B + C = 180°`}</T>
    {!flat && IDS.map(k => {
      const [u, s] = k === "A" ? [S.B, S.C] : k === "B" ? [S.C, S.A] : [S.A, S.B];
      return <path key={k} d={wedge(S[k], u, s, 22)} fill={COL[k]} fillOpacity={0.3} stroke={COL[k]} />;
    })}
    <polygon points={`${S.A.x},${S.A.y} ${S.B.x},${S.B.y} ${S.C.x},${S.C.y}`} fill={C.fg} fillOpacity={0.05} stroke={C.fg} strokeWidth={2} strokeLinejoin="round" />
    {(["a", "b", "c"] as const).map(k => {
      const [u, v] = k === "a" ? [S.B, S.C] : k === "b" ? [S.C, S.A] : [S.A, S.B];
      return <T key={k} x={(u.x + v.x) / 2 + 6} y={(u.y + v.y) / 2 - 6} size={9.5} color={C.fg}>{`${k} = ${n1(side[k])}`}</T>;
    })}
    {IDS.map(k => <g key={k}>
      <T x={S[k].x + (S[k].x < 280 ? -30 : 12)} y={S[k].y + (S[k].y < 150 ? -10 : 18)} size={10} color={COL[k]} bold>{`${k} ${Math.round(ang[k])}°`}</T>
      <Handle {...S[k]} color={COL[k]} active={dragging === k} />
    </g>)}
  </>;
}

function InequalityDrawing({ sa, sb, sc }: { sa: number; sb: number; sc: number }) {
  const { ok, flat } = closes(sa, sb, sc);
  const cx = (sb * sb - sa * sa + sc * sc) / (2 * sc), cy = Math.sqrt(Math.max(0, sb * sb - cx * cx));
  const Cp = { x: q.X(cx), y: q.Y(cy) };
  const arc = (c: Pt, rad: number) => <circle cx={q.X(c.x)} cy={q.Y(c.y)} r={rad * q.sx} fill="none" strokeDasharray="4 4" />;
  return <>
    <Grid p={q} step={1} labels={false} />
    <g stroke={C.sky}>{arc({ x: 0, y: 0 }, sb)}</g>
    <g stroke={C.pink}>{arc({ x: sc, y: 0 }, sa)}</g>
    {(ok || flat) && <polygon points={`${q.X(0)},${q.Y(0)} ${q.X(sc)},${q.Y(0)} ${Cp.x},${Cp.y}`} fill={C.green} fillOpacity={0.12} stroke={C.green} strokeWidth={2} />}
    {(ok || flat) && <><line x1={q.X(0)} y1={q.Y(0)} x2={Cp.x} y2={Cp.y} stroke={C.sky} strokeWidth={3} /><line x1={q.X(sc)} y1={q.Y(0)} x2={Cp.x} y2={Cp.y} stroke={C.pink} strokeWidth={3} /></>}
    {!ok && !flat && <>
      <line x1={q.X(0)} y1={q.Y(0)} x2={q.X(0) + sb * q.sx * 0.8} y2={q.Y(0) - sb * q.sx * 0.6} stroke={C.sky} strokeWidth={3} />
      <line x1={q.X(sc)} y1={q.Y(0)} x2={q.X(sc) - sa * q.sx * 0.8} y2={q.Y(0) - sa * q.sx * 0.6} stroke={C.pink} strokeWidth={3} />
    </>}
    <line x1={q.X(0)} y1={q.Y(0)} x2={q.X(sc)} y2={q.Y(0)} stroke={C.amber} strokeWidth={3} />
    <T x={q.X(sc / 2)} y={q.Y(0) + 16} size={10} anchor="middle" color={C.amber} bold>{`c = ${sc}`}</T>
    {(ok || flat) && <circle cx={Cp.x} cy={Cp.y} r={5} fill={C.green} />}
    <T x={q.X(0) - 6} y={q.Y(0) + 4} size={9} anchor="end" color={C.fg}>A</T>
    <T x={q.X(sc) + 6} y={q.Y(0) + 4} size={9} color={C.fg}>B</T>
  </>;
}

function TriStage({ mode, pts, setPts, sa, sb, sc }: { mode: Mode; pts: Pts; setPts: (f: (o: Pts) => Pts) => void; sa: number; sb: number; sc: number }) {
  const drag = useDrag<Id>(
    u => mode === "classify" ? nearest(u, IDS.map(k => [k, V(pts[k])] as [Id, Pt]), 20) : null,
    (id, u) => {
      const w = p.inv(u);
      const s = { x: clamp(Math.round(w.x * 2) / 2, -6.5, 6.5), y: clamp(Math.round(w.y * 2) / 2, -3.5, 3.5) };
      setPts(o => IDS.some(k => k !== id && o[k].x === s.x && o[k].y === s.y) ? o : { ...o, [id]: s });
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox="0 0 560 300" className="w-full h-auto">
      {mode === "classify" ? <ClassifyDrawing pts={pts} dragging={drag.dragging} /> : <InequalityDrawing sa={sa} sb={sb} sc={sc} />}
    </svg>
  );
}

const START: Pts = { A: { x: -5, y: -2.5 }, B: { x: 4, y: -2.5 }, C: { x: -1, y: 3 } };

export function TriangleFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("classify");
  const [pts, setPts] = useState<Pts>(START);
  const [sa, setSa] = useState(5), [sb, setSb] = useState(4), [sc, setSc] = useState(6);
  const lab = useLab("math-triangle");

  const cl = classify(pts);
  const cs = closes(sa, sb, sc);
  const bySides = cl.equal === 3 ? tx(t, "figTri_equi", "equilateral") : cl.equal >= 1 ? tx(t, "figTri_iso", "isosceles") : tx(t, "figTri_scal", "scalene");
  const byAngles = cl.byAngles === "right" ? tx(t, "figTri_rightT", "right") : cl.byAngles === "obtuse" ? tx(t, "figTri_obtuseT", "obtuse") : tx(t, "figTri_acuteT", "acute");
  const toClassify = (P: Pts) => { setMode("classify"); setPts(() => P); };
  const toSides = (a: number, b: number, c: number) => { setMode("inequality"); setSa(a); setSb(b); setSc(c); };

  const stage = <TriStage mode={mode} pts={pts} setPts={setPts} sa={sa} sb={sb} sc={sc} />;
  const modeChoice = <Choice value={mode} onChange={setMode} options={[["classify", tx(t, "figTri_mClass", "angles & names")], ["inequality", tx(t, "figTri_mIneq", "can it close?")]] as const} />;
  const checks = [[sa, sb, sc, "a + b", "c"], [sb, sc, sa, "b + c", "a"], [sa, sc, sb, "a + c", "b"]] as const;
  const controls = mode === "classify" ? <>
    <Row>
      {IDS.map((k, i) => <Readout key={k} color={COL[k]}>{`${k} ≈ ${cl.rounded[i]}°`}</Readout>)}
      <Readout>{`${cl.rounded.join("° + ")}° ≈ 180°`}</Readout>
    </Row>
    <Row>
      {cl.flat
        ? <Readout color={C.red}>{tx(t, "figTri_flat", "the corners are collinear: no triangle")}</Readout>
        : <>
          <Readout color={C.green}>{`${tx(t, "figTri_bySides", "by sides:")} ${bySides}`}</Readout>
          <Readout color={C.green}>{`${tx(t, "figTri_byAngles", "by angles:")} ${byAngles}`}</Readout>
        </>}
    </Row>
  </> : <>
    <Sliders>
      <Slider label={tx(t, "figTri_sa", "side a (from B)")} value={sa} min={1} max={10} step={0.5} onChange={setSa} fmt={n1} width="w-28" />
      <Slider label={tx(t, "figTri_sb", "side b (from A)")} value={sb} min={1} max={10} step={0.5} onChange={setSb} fmt={n1} width="w-28" />
      <Slider label={tx(t, "figTri_sc", "side c (base)")} value={sc} min={1} max={10} step={0.5} onChange={setSc} fmt={n1} width="w-28" />
    </Sliders>
    <Row>
      {checks.map(([x, y, z, l, r]) => <Readout key={l} color={x + y > z ? C.green : C.red}>{`${l} = ${n1(x + y)} ${x + y > z ? ">" : x + y === z ? "=" : "<"} ${r} = ${n1(z)}`}</Readout>)}
      <Readout color={cs.ok ? C.green : cs.flat ? C.amber : C.red}>{cs.ok ? tx(t, "figTri_ok", "a triangle exists") : cs.flat ? tx(t, "figTri_degen", "flat: the corners are on one line") : tx(t, "figTri_no", "the sides cannot meet")}</Readout>
    </Row>
  </>;
  const note = mode === "classify"
    ? tx(t, "figTri_noteC", "Drag the corners A, B and C. Side a is opposite corner A, b opposite B, c opposite C. However you shape the triangle, its three angles laid side by side (top right) exactly fill a straight line, 180°. Try the named shapes: two equal sides (isosceles) also give two equal angles; a 90° corner makes a right triangle; one corner above 90° makes it obtuse. Line the three corners up and the triangle collapses.")
    : tx(t, "figTri_noteI", "Choose three lengths. The blue arc is every point at distance b from A, the pink arc every point at distance a from B; the third corner has to be on both. When one side is at least as long as the other two together, the arcs never cross (or only touch on the base line) and no triangle can be built. The rule is the triangle inequality: every side must be shorter than the sum of the other two.");

  // ── Lab ──
  const isClass = mode === "classify" && !cl.flat;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figTriL1_t", "A square corner"),
      body: <>
        <p>{tx(t, "figTriL1_b1", "Drag the corners on the grid. Top right, the three angles are laid side by side: whatever you do, they fill the straight line.")}</p>
        <p>{tx(t, "figTriL1_b2", "Move one corner so that the triangle gets a 90° angle.")}</p>
      </>,
      goal: { text: tx(t, "figTriL1_g", "Make a right triangle."), done: isClass && cl.byAngles === "right" },
      hint: tx(t, "figTriL1_h", "Put C straight above A: drag it to the same grid column as A."),
      setup: () => toClassify(START),
    },
    {
      title: tx(t, "figTriL2_t", "Quick check"),
      body: <p>{tx(t, "figTriL2_b", "The three angles always fill 180°.")}</p>,
      quiz: {
        q: tx(t, "figTriL2_q", "Two angles of a triangle are 48° and 67°. What is the third?"),
        options: ["65°", "115°", "75°", "245°"],
        answer: 0,
        why: tx(t, "figTriL2_w", "180° − (48° + 67°) = 180° − 115° = 65°. 115° is the exterior angle at that corner, A + B."),
      },
    },
    {
      title: tx(t, "figTriL3_t", "Two equal sides"),
      body: <>
        <p>{tx(t, "figTriL3_b1", "Make two sides the same length. Then look at the angles that face them.")}</p>
      </>,
      goal: { text: tx(t, "figTriL3_g", "Make an isosceles triangle."), done: isClass && cl.equal >= 1 },
      hint: tx(t, "figTriL3_h", "Put C on the vertical line exactly halfway between A and B."),
      setup: () => toClassify(START),
    },
    {
      title: tx(t, "figTriL4_t", "A blunt corner"),
      body: <p>{tx(t, "figTriL4_b", "Drag C down towards side AB, keeping it between A and B. The angle at C opens up.")}</p>,
      goal: { text: tx(t, "figTriL4_g", "Make an obtuse triangle."), done: isClass && cl.byAngles === "obtuse" },
      setup: () => toClassify(START),
    },
    {
      title: tx(t, "figTriL5_t", "Collapse it"),
      body: <p>{tx(t, "figTriL5_b", "Keep going until C lies on the line through A and B. What is left?")}</p>,
      goal: { text: tx(t, "figTriL5_g", "Put the three corners on one line."), done: mode === "classify" && cl.flat },
    },
    {
      title: tx(t, "figTriL6_t", "Sticks that do not meet"),
      body: <>
        <p>{tx(t, "figTriL6_b1", "Now choose lengths instead of corners. With 2, 3 and 10 the blue and pink arcs never cross: the two short sticks cannot reach each other over the long one.")}</p>
        <p>{tx(t, "figTriL6_b2", "Change only the base c until a triangle exists.")}</p>
      </>,
      goal: { text: tx(t, "figTriL6_g", "a = 2, b = 3, and a triangle."), done: mode === "inequality" && sa === 2 && sb === 3 && cs.ok },
      hint: tx(t, "figTriL6_h", "c must be shorter than 2 + 3 = 5 (and longer than 3 − 2 = 1)."),
      setup: () => toSides(2, 3, 10),
    },
    {
      title: tx(t, "figTriL7_t", "Exactly flat"),
      body: <p>{tx(t, "figTriL7_b", "Find the one base length where the arcs only touch, on the base itself.")}</p>,
      goal: { text: tx(t, "figTriL7_g", "A flat, degenerate triangle."), done: mode === "inequality" && cs.flat },
      hint: tx(t, "figTriL7_h", "Make one side exactly the sum of the other two."),
    },
    {
      title: tx(t, "figTriL8_t", "Quick check"),
      body: <p>{tx(t, "figTriL8_b", "Only the longest side needs testing.")}</p>,
      quiz: {
        q: tx(t, "figTriL8_q", "Which three lengths make a triangle?"),
        options: ["5, 8, 12", "4, 7, 12", "4, 8, 12", "3, 3, 7"],
        answer: 0,
        why: tx(t, "figTriL8_w", "5 + 8 = 13 > 12 ✓. 4 + 7 = 11 < 12 ✗, 4 + 8 = 12 is flat, and 3 + 3 = 6 < 7 ✗."),
      },
    },
  ];

  const big = cl.ang.A >= cl.ang.B && cl.ang.A >= cl.ang.C ? "A" : cl.ang.B >= cl.ang.C ? "B" : "C";
  const insights: Insight[] = [
    {
      id: "iso", tone: "ok", when: isClass && cl.equal >= 1 && cl.equal < 3,
      title: tx(t, "figTriI1_t", "Equal sides, equal angles"),
      body: tx(t, "figTriI1_b", "Two sides are equal, and so are the angles that face them. It works both ways: equal angles face equal sides."),
    },
    {
      id: "obt", tone: "info", when: isClass && cl.byAngles !== "acute",
      title: tx(t, "figTriI2_t", "Only one big angle"),
      body: fill(tx(t, "figTriI2_b", "Corner {k} has {a}°. The other two must share the remaining {rest}°, so neither can be 90° or more: a triangle has at most one right or obtuse angle."), { k: big, a: Math.round(cl.ang[big]), rest: 180 - Math.round(cl.ang[big]) }),
    },
    {
      id: "flat", tone: "warn", when: mode === "classify" && cl.flat,
      title: tx(t, "figTriI3_t", "No triangle left"),
      body: tx(t, "figTriI3_b", "The three corners are collinear. The angles are 0°, 0° and 180°, and the shape encloses no area."),
    },
    {
      id: "gap", tone: "warn", when: mode === "inequality" && !cs.ok && !cs.flat,
      title: tx(t, "figTriI4_t", "The arcs miss each other"),
      body: fill(tx(t, "figTriI4_b", "The longest side, {l}, is longer than the other two together, {s}. The two shorter sides lie flat along it and still do not reach."), { l: Math.max(sa, sb, sc), s: sa + sb + sc - Math.max(sa, sb, sc) }),
    },
  ];

  const title = tx(t, "figTri_title", "Triangles");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figTriR1", "The three angles of every triangle add up to 180°, so at most one of them is 90° or more."),
          tx(t, "figTriR2", "Equal sides face equal angles; the longest side faces the largest angle."),
          tx(t, "figTriR3", "Three lengths make a triangle only if the longest is shorter than the other two together; equal means flat."),
        ]}
      />
    </>
  );
}
