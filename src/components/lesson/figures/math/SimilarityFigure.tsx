"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// scale    — a dilation: every corner of a shape slides along the ray from a
//            centre O to k times its distance. Lengths scale by k, angles stay,
//            area scales by k².
// parallel — a line parallel to one side of a triangle cuts off a smaller,
//            similar triangle; the two other sides are cut in the same ratio.
// project  — side view of a pinhole camera: the eye, a picture plane at
//            distance d and an object at depth z form two similar triangles,
//            so the object's height in the picture is d · y / z.
// The lab: shrink, pin a corner, cut at the midpoints, and halve an image by
// doubling the distance.

type Mode = "scale" | "parallel" | "project";
type Id = "O" | "A" | "obj";
const W = 560, H = 300;
const p = plot({ W, H, x0: -4, x1: 14.667, y0: -1.5, y1: 8.5 });
const pp = plot({ W, H, x0: -1.5, x1: 17.167, y0: -5, y1: 5 });
const n2 = (v: number) => (+v.toFixed(2)).toString();
const pts = (q: Pt[], pl = p) => q.map(v => `${pl.X(v.x)},${pl.Y(v.y)}`).join(" ");
const HOUSE: Pt[] = [{ x: 1, y: 0.5 }, { x: 4, y: 0.5 }, { x: 4, y: 2.5 }, { x: 2.5, y: 3.7 }, { x: 1, y: 2.5 }];
const HOUSE_AREA = 3 * 2 + (3 * 1.2) / 2;
const B: Pt = { x: -2, y: 0 }, Cc: Pt = { x: 11, y: 0 };
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const len = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const cutPoints = (A: Pt, f: number) => ({
  D: { x: A.x + f * (B.x - A.x), y: A.y + f * (B.y - A.y) },
  E: { x: A.x + f * (Cc.x - A.x), y: A.y + f * (Cc.y - A.y) },
});

// ── The drawings ──────────────────────────────────────────────────────────────

function ScaleDrawing({ O, k, dragging }: { O: Pt; k: number; dragging: Id | null }) {
  const img = HOUSE.map(v => ({ x: O.x + k * (v.x - O.x), y: O.y + k * (v.y - O.y) }));
  return <>
    <Grid p={p} step={1} labels={false} />
    {HOUSE.map((v, i) => {
      const far = k >= 1 ? img[i] : v;
      return <line key={i} x1={p.X(O.x)} y1={p.Y(O.y)} x2={p.X(far.x)} y2={p.Y(far.y)} stroke={C.muted} strokeWidth={0.8} strokeDasharray="3 3" />;
    })}
    <polygon points={pts(img)} fill={C.amber} fillOpacity={0.2} stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
    <polygon points={pts(HOUSE)} fill={C.sky} fillOpacity={0.3} stroke={C.sky} strokeWidth={2} strokeLinejoin="round" />
    <T x={p.X(mid(HOUSE[0], HOUSE[1]).x)} y={p.Y(HOUSE[0].y) + 13} size={9.5} anchor="middle" color={C.sky} bold>3</T>
    <T x={p.X(mid(img[0], img[1]).x)} y={p.Y(img[0].y) + 13} size={9.5} anchor="middle" color={C.amber} bold>{n2(3 * k)}</T>
    <Handle x={p.X(O.x)} y={p.Y(O.y)} color={C.green} active={dragging === "O"} />
    <T x={p.X(O.x) - 9} y={p.Y(O.y) + 4} size={11} anchor="end" color={C.green} bold>O</T>
  </>;
}

function ParallelDrawing({ A, f, dragging }: { A: Pt; f: number; dragging: Id | null }) {
  const { D, E } = cutPoints(A, f);
  return <>
    <Grid p={p} step={1} labels={false} />
    <polygon points={pts([A, B, Cc])} fill={C.sky} fillOpacity={0.12} stroke={C.sky} strokeWidth={2} strokeLinejoin="round" />
    <polygon points={pts([A, D, E])} fill={C.amber} fillOpacity={0.3} stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
    <line x1={p.X(D.x - (E.x - D.x) * 0.25)} y1={p.Y(D.y)} x2={p.X(E.x + (E.x - D.x) * 0.25)} y2={p.Y(E.y)} stroke={C.amber} strokeWidth={1} strokeDasharray="4 3" />
    {([["A", A, 0, -9], ["B", B, -8, 12], ["C", Cc, 8, 12], ["D", D, -9, -6], ["E", E, 9, -6]] as const).map(([n, q, dx, dy]) =>
      <T key={n} x={p.X(q.x) + dx} y={p.Y(q.y) + dy} size={11} anchor={dx < 0 ? "end" : dx > 0 ? "start" : "middle"} color={C.fg} bold>{n}</T>)}
    <Handle x={p.X(A.x)} y={p.Y(A.y)} color={C.pink} active={dragging === "A"} />
  </>;
}

function ProjectDrawing({ d, obj, dragging, t }: { d: number; obj: Pt; dragging: Id | null; t?: TrackTranslations }) {
  const ys = (d * obj.y) / obj.x;
  const X = pp.X, Y = pp.Y;
  return <>
    <Grid p={pp} step={1} labels={false} />
    <polygon points={pts([{ x: 0, y: 0 }, { x: obj.x, y: 0 }, obj], pp)} fill={C.sky} fillOpacity={0.14} stroke="none" />
    <polygon points={pts([{ x: 0, y: 0 }, { x: d, y: 0 }, { x: d, y: ys }], pp)} fill={C.amber} fillOpacity={0.35} stroke="none" />
    <line x1={X(0)} y1={Y(0)} x2={X(obj.x)} y2={Y(obj.y)} stroke={C.amber} strokeWidth={1.5} strokeDasharray="5 3" />
    <line x1={X(d)} y1={Y(-4.5)} x2={X(d)} y2={Y(4.5)} stroke={C.purple} strokeWidth={2.5} />
    <line x1={X(d)} y1={Y(0)} x2={X(d)} y2={Y(ys)} stroke={C.amber} strokeWidth={4} />
    <line x1={X(obj.x)} y1={Y(0)} x2={X(obj.x)} y2={Y(obj.y)} stroke={C.sky} strokeWidth={4} />
    <circle cx={X(0)} cy={Y(0)} r={5} fill={C.fg} />
    <T x={X(0)} y={Y(0) + 17} size={10} anchor="middle" color={C.fg} bold>{tx(t, "figSim_eye", "eye")}</T>
    <T x={X(d)} y={Y(-4.5) + 14} size={9.5} anchor="middle" color={C.purple} bold>{tx(t, "figSim_screen", "picture")}</T>
    <T x={X(d / 2)} y={Y(0) + 13} size={9.5} anchor="middle" color={C.purple}>{`d = ${n2(d)}`}</T>
    <T x={X(obj.x / 2 + d / 2)} y={Y(0) + 26} size={9.5} anchor="middle" color={C.sky}>{`z = ${n2(obj.x)}`}</T>
    <T x={X(obj.x) + 8} y={Y(obj.y / 2)} size={10} color={C.sky} bold>{`y = ${n2(obj.y)}`}</T>
    <T x={X(d) - 6} y={Y(ys) - 6} size={10} anchor="end" color={C.amber} bold>{`y' = ${n2(ys)}`}</T>
    <Handle x={X(obj.x)} y={Y(obj.y)} color={C.sky} active={dragging === "obj"} />
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function SimStage({ mode, O, setO, k, A, setA, f, d, obj, setObj, t }: {
  mode: Mode; O: Pt; setO: (v: Pt) => void; k: number; A: Pt; setA: (v: Pt) => void; f: number;
  d: number; obj: Pt; setObj: (v: Pt) => void; t?: TrackTranslations;
}) {
  const drag = useDrag<Id>(
    q => mode === "scale" ? nearest(q, [["O", { x: p.X(O.x), y: p.Y(O.y) }]], 20)
      : mode === "parallel" ? nearest(q, [["A", { x: p.X(A.x), y: p.Y(A.y) }]], 20)
        : nearest(q, [["obj", { x: pp.X(obj.x), y: pp.Y(obj.y) }]], 20),
    (id, q) => {
      if (id === "O") { const w = p.inv(q); setO({ x: clamp(Math.round(w.x * 2) / 2, -3.5, 6), y: clamp(Math.round(w.y * 2) / 2, -1, 3) }); }
      else if (id === "A") { const w = p.inv(q); setA({ x: clamp(Math.round(w.x * 2) / 2, -3, 13), y: clamp(Math.round(w.y * 2) / 2, 2, 8) }); }
      else { const w = pp.inv(q); setObj({ x: clamp(Math.round(w.x * 2) / 2, d + 1, 16), y: clamp(Math.round(w.y * 2) / 2, 0.5, 4.5) }); }
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "scale" ? <ScaleDrawing O={O} k={k} dragging={drag.dragging} />
        : mode === "parallel" ? <ParallelDrawing A={A} f={f} dragging={drag.dragging} />
          : <ProjectDrawing d={d} obj={obj} dragging={drag.dragging} t={t} />}
    </svg>
  );
}

export function SimilarityFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("scale");
  const [O, setO] = useState<Pt>({ x: -2, y: 0 });
  const [k, setK] = useState(2);
  const [A, setA] = useState<Pt>({ x: 3, y: 7 });
  const [f, setF] = useState(0.5);
  const [d, setD] = useState(3);
  const [obj, setObj] = useState<Pt>({ x: 12, y: 3 });
  const lab = useLab("math-similarity");

  const ys = (d * obj.y) / obj.x;
  const { D, E } = cutPoints(A, f);
  const stage = <SimStage mode={mode} O={O} setO={setO} k={k} A={A} setA={setA} f={f} d={d} obj={obj} setObj={setObj} t={t} />;
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["scale", tx(t, "figSim_mScale", "scale")],
    ["parallel", tx(t, "figSim_mPar", "parallel cut")],
    ["project", tx(t, "figSim_mProj", "projection")],
  ] as const} />;

  const controls = mode === "scale" ? <>
    <Slider label={tx(t, "figSim_k", "scale factor k")} value={k} min={0.25} max={2.5} step={0.05} onChange={setK} fmt={n2} width="w-28" />
    <Row>
      <Readout color={C.amber}>{`${tx(t, "figSim_side", "base")}: 3 · ${n2(k)} = ${n2(3 * k)}`}</Readout>
      <Readout>{tx(t, "figSim_angles", "angles: unchanged")}</Readout>
      <Readout color={C.green}>{`${tx(t, "figSim_areaR", "area")}: ${n2(HOUSE_AREA)} · ${n2(k)}² = ${n2(HOUSE_AREA * k * k)}`}</Readout>
    </Row>
  </> : mode === "parallel" ? <>
    <Slider label={tx(t, "figSim_cut", "cut at AD/AB")} value={f} min={0.1} max={0.95} step={0.05} onChange={setF} fmt={n2} width="w-28" />
    <Row>
      <Readout>{`AD/AB = ${n2(len(A, D))}/${n2(len(A, B))} = ${n2(f)}`}</Readout>
      <Readout>{`AE/AC = ${n2(len(A, E))}/${n2(len(A, Cc))} = ${n2(f)}`}</Readout>
      <Readout color={C.amber}>{`DE/BC = ${n2(len(D, E))}/${n2(len(B, Cc))} = ${n2(f)}`}</Readout>
    </Row>
  </> : <>
    <Slider label={tx(t, "figSim_d", "picture distance d")} value={d} min={1} max={6} step={0.5} onChange={v => { setD(v); setObj(o => ({ ...o, x: Math.max(o.x, v + 1) })); }} fmt={n2} width="w-32" />
    <Row>
      <Readout>{`y'/d = y/z`}</Readout>
      <Readout color={C.amber}>{`y' = d · y / z = ${n2(d)} · ${n2(obj.y)} / ${n2(obj.x)} = ${n2(ys)}`}</Readout>
    </Row>
  </>;
  const note = mode === "scale"
    ? tx(t, "figSim_noteS", "Every corner of the blue shape slides along the dashed ray from O until it is k times as far from O as before. The amber result has the same angles and every length multiplied by k, so it is similar to the original. Drag O: the copy moves but its size does not change. Watch the area: it grows by k², not k, because it is length times length.")
    : mode === "parallel"
      ? tx(t, "figSim_noteP", "The amber line DE is always parallel to BC. It makes the same angles with the sides that BC does (corresponding angles), and A is shared, so the small triangle ADE is similar to ABC. That forces all three ratios to be the same number. Drag A to any shape of triangle and move the cut: the three readouts never disagree. At 0.5 the line joins the midpoints and is exactly half of BC.")
      : tx(t, "figSim_noteJ", "Seen from the side, a ray of light goes from the top of the object to the eye and crosses the picture plane on the way. The small amber triangle and the big blue one share the angle at the eye and both have a right angle on the ground line, so they are similar: y' / d = y / z. Drag the object away (bigger z) and its image shrinks; that division by depth is perspective, the reason far things look small.");

  // ── Lab ──
  const pinned = HOUSE.some(v => v.x === O.x && v.y === O.y);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figSimL1_t", "Shrink it"),
      body: <>
        <p>{tx(t, "figSimL1_b1", "Each corner of the blue house slides along its dashed ray from O to k times its distance. The amber house is the result.")}</p>
        <p>{tx(t, "figSimL1_b2", "Make the copy half the size of the original.")}</p>
      </>,
      goal: { text: tx(t, "figSimL1_g", "k = 0.5."), done: mode === "scale" && Math.abs(k - 0.5) < 1e-9 },
      setup: () => { setMode("scale"); setO({ x: -2, y: 0 }); setK(2); },
    },
    {
      title: tx(t, "figSimL2_t", "Quick check"),
      body: <p>{tx(t, "figSimL2_b", "Lengths are multiplied by k. Areas are length times length.")}</p>,
      quiz: {
        q: tx(t, "figSimL2_q", "The house is scaled by k = 3. How many times bigger is its area?"),
        options: ["9", "3", "6", "27"],
        answer: 0,
        why: tx(t, "figSimL2_w", "Areas scale by k² = 3² = 9. 27 = 3³ would be a volume."),
      },
    },
    {
      title: tx(t, "figSimL3_t", "The point that stays"),
      body: <p>{tx(t, "figSimL3_b", "O is the only point a dilation does not move. Drag O onto one corner of the blue house and watch that corner.")}</p>,
      goal: { text: tx(t, "figSimL3_g", "Put O on a corner of the house."), done: mode === "scale" && pinned },
      hint: tx(t, "figSimL3_h", "The bottom-left corner is at (1, 0.5)."),
      setup: () => { setMode("scale"); setO({ x: -2, y: 0 }); setK(2); },
    },
    {
      title: tx(t, "figSimL4_t", "Cut through the middle"),
      body: <>
        <p>{tx(t, "figSimL4_b1", "DE is always parallel to BC, so the small triangle ADE is similar to ABC and all three ratios agree.")}</p>
        <p>{tx(t, "figSimL4_b2", "Move the cut so that D and E are the midpoints of the two sides.")}</p>
      </>,
      goal: { text: tx(t, "figSimL4_g", "AD/AB = 0.5."), done: mode === "parallel" && Math.abs(f - 0.5) < 1e-9 },
      setup: () => { setMode("parallel"); setA({ x: 3, y: 7 }); setF(0.2); },
    },
    {
      title: tx(t, "figSimL5_t", "Quick check"),
      body: <p>{tx(t, "figSimL5_b", "In a triangle ABC, DE ∥ BC with AD/AB = 0.4 and BC = 10.")}</p>,
      quiz: {
        q: tx(t, "figSimL5_q", "How long is DE?"),
        options: ["4", "6", "25", "0.4"],
        answer: 0,
        why: tx(t, "figSimL5_w", "DE/BC = AD/AB = 0.4, so DE = 0.4 · 10 = 4. 6 is what is left of BC, which has no meaning here."),
      },
    },
    {
      title: tx(t, "figSimL6_t", "Twice as far, half as big"),
      body: <>
        <p>{tx(t, "figSimL6_b1", "A 3 m object stands 6 m from the eye; its image on the picture plane is 1.5 tall.")}</p>
        <p>{tx(t, "figSimL6_b2", "Drag the object away, keeping its height, until its image is half as tall.")}</p>
      </>,
      goal: { text: tx(t, "figSimL6_g", "y = 3 and y' = 0.75."), done: mode === "project" && obj.y === 3 && Math.abs(ys - 0.75) < 1e-9 },
      hint: tx(t, "figSimL6_h", "y' = d · y / z: doubling z halves y'. Try z = 12."),
      setup: () => { setMode("project"); setD(3); setObj({ x: 6, y: 3 }); },
    },
    {
      title: tx(t, "figSimL7_t", "Quick check"),
      body: <p>{tx(t, "figSimL7_b", "A 1 m ball 5 m from a camera.")}</p>,
      quiz: {
        q: tx(t, "figSimL7_q", "How big must a ball 10 m away be to look exactly the same in the photo?"),
        options: ["2 m", "1 m", "4 m", "0.5 m"],
        answer: 0,
        why: tx(t, "figSimL7_w", "The picture only sees y / z: 1 / 5 = 2 / 10. That is forced perspective, and why a camera alone cannot tell size from distance."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "congruent", tone: "info", when: mode === "scale" && Math.abs(k - 1) < 1e-9,
      title: tx(t, "figSimI1_t", "k = 1: congruent"),
      body: tx(t, "figSimI1_b", "With k = 1 every point stays where it is: the copy is the original. Congruence is similarity without a change of size."),
    },
    {
      id: "shrink", tone: "info", when: mode === "scale" && k < 1 - 1e-9,
      title: tx(t, "figSimI2_t", "A reduction"),
      body: fill(tx(t, "figSimI2_b", "With k = {k} every length shrinks, and the area shrinks faster: {k}² = {k2}, so the copy covers only {pc}% of the original's area."), { k: n2(k), k2: n2(k * k), pc: n2(k * k * 100) }),
    },
    {
      id: "pinned", tone: "ok", when: mode === "scale" && pinned,
      title: tx(t, "figSimI3_t", "A fixed corner"),
      body: tx(t, "figSimI3_b", "The centre does not move, so the two houses share this corner. Every other corner slides along a ray that starts there."),
    },
    {
      id: "mid", tone: "ok", when: mode === "parallel" && Math.abs(f - 0.5) < 1e-9,
      title: tx(t, "figSimI4_t", "The midsegment"),
      body: tx(t, "figSimI4_b", "D and E are the midpoints, so DE is parallel to BC and exactly half as long, whatever the shape of the triangle."),
    },
  ];

  const title = tx(t, "figSim_title", "Same shape, different size");
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
          tx(t, "figSimR1", "Similar figures have equal angles and every length multiplied by the same k; areas by k²."),
          tx(t, "figSimR2", "A line parallel to one side of a triangle cuts the other two sides in the same ratio."),
          tx(t, "figSimR3", "A camera divides by depth: y' = d · y / z, so twice as far looks half as big."),
        ]}
      />
    </>
  );
}
