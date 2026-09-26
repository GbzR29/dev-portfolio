"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// scale    — a dilation: every corner of a shape slides along the ray from a
//            centre O to k times its distance. Lengths scale by k, angles stay,
//            area scales by k².
// parallel — a line parallel to one side of a triangle cuts off a smaller,
//            similar triangle; the two other sides are cut in the same ratio.
// project  — side view of a pinhole camera: the eye, a screen at distance d
//            and an object at depth z form two similar triangles, so the
//            object's height on screen is d · y / z.

type Mode = "scale" | "parallel" | "project";
const W = 560, H = 300;
const p = plot({ W, H, x0: -4, x1: 14.667, y0: -1.5, y1: 8.5 });
const pp = plot({ W, H, x0: -1.5, x1: 17.167, y0: -5, y1: 5 });
const n2 = (v: number) => (+v.toFixed(2)).toString();
const pts = (q: Pt[], pl = p) => q.map(v => `${pl.X(v.x)},${pl.Y(v.y)}`).join(" ");
const HOUSE: Pt[] = [{ x: 1, y: 0.5 }, { x: 4, y: 0.5 }, { x: 4, y: 2.5 }, { x: 2.5, y: 3.7 }, { x: 1, y: 2.5 }];
const HOUSE_AREA = 3 * 2 + (3 * 1.2) / 2;
const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function SimilarityFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("scale");
  const [O, setO] = useState<Pt>({ x: -2, y: 0 });
  const [k, setK] = useState(2);
  const [A, setA] = useState<Pt>({ x: 3, y: 7 });
  const [f, setF] = useState(0.5);
  const [d, setD] = useState(3);
  const [obj, setObj] = useState<Pt>({ x: 12, y: 3 });

  const B = { x: -2, y: 0 }, Cc = { x: 11, y: 0 };
  const drag = useDrag<"O" | "A" | "obj">(
    q => mode === "scale" ? nearest(q, [["O", { x: p.X(O.x), y: p.Y(O.y) }]], 20)
      : mode === "parallel" ? nearest(q, [["A", { x: p.X(A.x), y: p.Y(A.y) }]], 20)
      : nearest(q, [["obj", { x: pp.X(obj.x), y: pp.Y(obj.y) }]], 20),
    (id, q) => {
      if (id === "O") { const w = p.inv(q); setO({ x: clamp(Math.round(w.x * 2) / 2, -3.5, 6), y: clamp(Math.round(w.y * 2) / 2, -1, 3) }); }
      else if (id === "A") { const w = p.inv(q); setA({ x: clamp(Math.round(w.x * 2) / 2, -3, 13), y: clamp(Math.round(w.y * 2) / 2, 2, 8) }); }
      else { const w = pp.inv(q); setObj({ x: clamp(Math.round(w.x * 2) / 2, d + 1, 16), y: clamp(Math.round(w.y * 2) / 2, 0.5, 4.5) }); }
    });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "scale") {
    const img = HOUSE.map(v => ({ x: O.x + k * (v.x - O.x), y: O.y + k * (v.y - O.y) }));
    svg = <>
      <Grid p={p} step={1} labels={false} />
      {HOUSE.map((v, i) => {
        const far = k >= 1 ? img[i] : v;
        return <line key={i} x1={p.X(O.x)} y1={p.Y(O.y)} x2={p.X(far.x)} y2={p.Y(far.y)} stroke={C.muted} strokeWidth={0.8} strokeDasharray="3 3" />;
      })}
      <polygon points={pts(img)} fill={C.amber} fillOpacity={0.2} stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
      <polygon points={pts(HOUSE)} fill={C.sky} fillOpacity={0.3} stroke={C.sky} strokeWidth={2} strokeLinejoin="round" />
      <T x={p.X(mid(HOUSE[0], HOUSE[1]).x)} y={p.Y(HOUSE[0].y) + 13} size={9.5} anchor="middle" color={C.sky} bold>3</T>
      <T x={p.X(mid(img[0], img[1]).x)} y={p.Y(img[0].y) + 13} size={9.5} anchor="middle" color={C.amber} bold>{n2(3 * k)}</T>
      <Handle x={p.X(O.x)} y={p.Y(O.y)} color={C.green} active={drag.dragging === "O"} />
      <T x={p.X(O.x) - 9} y={p.Y(O.y) + 4} size={11} anchor="end" color={C.green} bold>O</T>
    </>;
    controls = <>
      <Slider label={tx(t, "figSim_k", "scale factor k")} value={k} min={0.25} max={2.5} step={0.05} onChange={setK} fmt={n2} width="w-28" />
      <Row>
        <Readout color={C.amber}>{`${tx(t, "figSim_side", "base")}: 3 · ${n2(k)} = ${n2(3 * k)}`}</Readout>
        <Readout>{tx(t, "figSim_angles", "angles: unchanged")}</Readout>
        <Readout color={C.green}>{`${tx(t, "figSim_areaR", "area")}: ${n2(HOUSE_AREA)} · ${n2(k)}² = ${n2(HOUSE_AREA * k * k)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figSim_noteS", "Every corner of the blue shape slides along the dashed ray from O until it is k times as far from O as before. The amber result has the same angles and every length multiplied by k, so it is similar to the original. Drag O: the copy moves but its size does not change. Watch the area: it grows by k², not k, because it is length times length.");
  } else if (mode === "parallel") {
    const D = { x: A.x + f * (B.x - A.x), y: A.y + f * (B.y - A.y) };
    const E = { x: A.x + f * (Cc.x - A.x), y: A.y + f * (Cc.y - A.y) };
    const len = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
    svg = <>
      <Grid p={p} step={1} labels={false} />
      <polygon points={pts([A, B, Cc])} fill={C.sky} fillOpacity={0.12} stroke={C.sky} strokeWidth={2} strokeLinejoin="round" />
      <polygon points={pts([A, D, E])} fill={C.amber} fillOpacity={0.3} stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
      <line x1={p.X(D.x - (E.x - D.x) * 0.25)} y1={p.Y(D.y)} x2={p.X(E.x + (E.x - D.x) * 0.25)} y2={p.Y(E.y)} stroke={C.amber} strokeWidth={1} strokeDasharray="4 3" />
      {([["A", A, 0, -9], ["B", B, -8, 12], ["C", Cc, 8, 12], ["D", D, -9, -6], ["E", E, 9, -6]] as const).map(([n, q, dx, dy]) =>
        <T key={n} x={p.X(q.x) + dx} y={p.Y(q.y) + dy} size={11} anchor={dx < 0 ? "end" : dx > 0 ? "start" : "middle"} color={C.fg} bold>{n}</T>)}
      <Handle x={p.X(A.x)} y={p.Y(A.y)} color={C.pink} active={drag.dragging === "A"} />
    </>;
    controls = <>
      <Slider label={tx(t, "figSim_cut", "cut at AD/AB")} value={f} min={0.1} max={0.95} step={0.05} onChange={setF} fmt={n2} width="w-28" />
      <Row>
        <Readout>{`AD/AB = ${n2(len(A, D))}/${n2(len(A, B))} = ${n2(f)}`}</Readout>
        <Readout>{`AE/AC = ${n2(len(A, E))}/${n2(len(A, Cc))} = ${n2(f)}`}</Readout>
        <Readout color={C.amber}>{`DE/BC = ${n2(len(D, E))}/${n2(len(B, Cc))} = ${n2(f)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figSim_noteP", "The amber line DE is always parallel to BC. It makes the same angles with the sides that BC does (corresponding angles), and A is shared, so the small triangle ADE is similar to ABC. That forces all three ratios to be the same number. Drag A to any shape of triangle and move the cut: the three readouts never disagree. At 0.5 the line joins the midpoints and is exactly half of BC.");
  } else {
    const ys = (d * obj.y) / obj.x;
    const X = pp.X, Y = pp.Y;
    svg = <>
      <Grid p={pp} step={1} labels={false} />
      <polygon points={pts([{ x: 0, y: 0 }, { x: obj.x, y: 0 }, obj], pp)} fill={C.sky} fillOpacity={0.14} stroke="none" />
      <polygon points={pts([{ x: 0, y: 0 }, { x: d, y: 0 }, { x: d, y: ys }], pp)} fill={C.amber} fillOpacity={0.35} stroke="none" />
      <line x1={X(0)} y1={Y(0)} x2={X(obj.x)} y2={Y(obj.y)} stroke={C.amber} strokeWidth={1.5} strokeDasharray="5 3" />
      <line x1={X(d)} y1={Y(-4.5)} x2={X(d)} y2={Y(4.5)} stroke={C.purple} strokeWidth={2.5} />
      <line x1={X(d)} y1={Y(0)} x2={X(d)} y2={Y(ys)} stroke={C.amber} strokeWidth={4} />
      <line x1={X(obj.x)} y1={Y(0)} x2={X(obj.x)} y2={Y(obj.y)} stroke={C.sky} strokeWidth={4} />
      <circle cx={X(0)} cy={Y(0)} r={5} fill={C.fg} />
      <T x={X(0)} y={Y(0) + 17} size={10} anchor="middle" color={C.fg} bold>{tx(t, "figSim_eye", "eye")}</T>
      <T x={X(d)} y={Y(-4.5) + 14} size={9.5} anchor="middle" color={C.purple} bold>{tx(t, "figSim_screen", "screen")}</T>
      <T x={X(d / 2)} y={Y(0) + 13} size={9.5} anchor="middle" color={C.purple}>{`d = ${n2(d)}`}</T>
      <T x={X(obj.x / 2 + d / 2)} y={Y(0) + 26} size={9.5} anchor="middle" color={C.sky}>{`z = ${n2(obj.x)}`}</T>
      <T x={X(obj.x) + 8} y={Y(obj.y / 2)} size={10} color={C.sky} bold>{`y = ${n2(obj.y)}`}</T>
      <T x={X(d) - 6} y={Y(ys) - 6} size={10} anchor="end" color={C.amber} bold>{`y' = ${n2(ys)}`}</T>
      <Handle x={X(obj.x)} y={Y(obj.y)} color={C.sky} active={drag.dragging === "obj"} />
    </>;
    controls = <>
      <Slider label={tx(t, "figSim_d", "screen distance d")} value={d} min={1} max={6} step={0.5} onChange={v => { setD(v); setObj(o => ({ ...o, x: Math.max(o.x, v + 1) })); }} fmt={n2} width="w-32" />
      <Row>
        <Readout>{`y'/d = y/z`}</Readout>
        <Readout color={C.amber}>{`y' = d · y / z = ${n2(d)} · ${n2(obj.y)} / ${n2(obj.x)} = ${n2(ys)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figSim_noteJ", "Seen from the side, a ray of light goes from the top of the object to the eye and crosses the screen on the way. The small amber triangle and the big blue one share the angle at the eye and both have a right angle on the ground line, so they are similar: y' / d = y / z. Drag the object away (bigger z) and its image shrinks; that division by depth is perspective, the reason far things look small.");
  }

  return (
    <Figure
      title={tx(t, "figSim_title", "Same shape, different size")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["scale", tx(t, "figSim_mScale", "scale")],
        ["parallel", tx(t, "figSim_mPar", "parallel cut")],
        ["project", tx(t, "figSim_mProj", "projection")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
