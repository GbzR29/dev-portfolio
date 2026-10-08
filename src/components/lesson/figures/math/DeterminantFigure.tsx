"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, C, T, Handle, Vec, plot, Grid, useDrag, useFrame, useVisible, nearest, clamp, type Pt, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { type M2, apply, det, rot, n2, F_SHAPE } from "./mat2";

// ── What this figure shows ────────────────────────────────────────────────────
// area — the unit square (area 1) becomes the parallelogram spanned by the
//        matrix's columns; its signed area is det = ad − bc. Blue: orientation
//        kept. Pink: flipped (the F reads backwards). Zero: squashed flat.
//        The Transport swings the green column round the origin, so the
//        determinant goes positive, zero, negative, zero and back.
// bary — a point P in a triangle splits it into three smaller triangles. Each
//        one's share of the total signed area is P's weight for the opposite
//        corner; all three weights ≥ 0 exactly when P is inside. The dot at P
//        is the three corner colours mixed with those weights.
// The lab: an area factor of 2, a flip, a collapse, then P at a corner, at
// the centroid and outside.

type Mode = "area" | "bary";
type Key = "i" | "j" | "P" | "A" | "B" | "C";
type Tri = Record<"A" | "B" | "C" | "P", Pt>;
const W = 560, H = 300;
const STEP = 15;                    // degrees per Transport step
const pr = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const TRI0: Tri = { A: { x: -3.5, y: -2 }, B: { x: 3.5, y: -1.5 }, C: { x: 0, y: 2.5 }, P: { x: 0.3, y: 0 } };

const poly = (p: Plot, pts: Pt[]) => pts.map(q => `${p.X(q.x).toFixed(1)},${p.Y(q.y).toFixed(1)}`).join(" ");
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
/** Twice the signed area of triangle abc (positive when anticlockwise). */
const area2 = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
/** The matrix with its second column turned by `ang` degrees about the origin. */
const swung = (m: M2, ang: number): M2 => { const j = apply(rot(ang), { x: m[1], y: m[3] }); return [m[0], j.x, m[2], j.y]; };
const detCol = (d: number) => (Math.abs(d) < 1e-6 ? C.muted : d > 0 ? C.sky : C.pink);

/** P's weights for the three corners, from signed areas. */
function weights({ A, B, C: Cc, P }: Tri) {
  const tot = area2(A, B, Cc) || 1e-9;
  const u = area2(P, B, Cc) / tot, v = area2(A, P, Cc) / tot, w = area2(A, B, P) / tot;
  return { u, v, w, inside: u >= 0 && v >= 0 && w >= 0 };
}

// ── The drawings ──────────────────────────────────────────────────────────────

function AreaDrawing({ mm, active }: { mm: M2; active: Key | null }) {
  const i1 = { x: mm[0], y: mm[2] }, j1 = { x: mm[1], y: mm[3] };
  const d = det(mm), col = detCol(d);
  const sq = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
  const par = sq.map(q => apply(mm, q));
  const small = F_SHAPE.map(q => ({ x: q.x * 0.35 + 0.3, y: q.y * 0.35 + 0.15 }));
  return <>
    <Grid p={pr} step={1} />
    <polygon points={poly(pr, sq)} fill={C.muted} fillOpacity={0.15} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
    <polygon points={poly(pr, par)} fill={col} fillOpacity={0.28} stroke={col} strokeWidth={1.6} />
    <polygon points={poly(pr, small.map(q => apply(mm, q)))} fill={C.amber} fillOpacity={0.6} stroke={C.amber} strokeWidth={1} />
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, i1)} color={C.red} w={3} />
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, j1)} color={C.green} w={3} />
    <Handle x={pr.X(i1.x)} y={pr.Y(i1.y)} color={C.red} active={active === "i"} />
    <Handle x={pr.X(j1.x)} y={pr.Y(j1.y)} color={C.green} active={active === "j"} />
    <T x={pr.X(par[2].x) + 8} y={pr.Y(par[2].y) + (par[2].y >= 0 ? -8 : 16)} size={11} color={col} bold>{`det = ${n2(d)}`}</T>
  </>;
}

function BaryDrawing({ tri, active }: { tri: Tri; active: Key | null }) {
  const { A, B, C: Cc, P } = tri;
  const { u, v, w } = weights(tri);
  const ch = (k: number) => Math.round(clamp(k, 0, 1) * 255);
  const mix = `rgb(${ch(u)},${ch(v)},${ch(w)})`;
  return <>
    <Grid p={pr} step={1} />
    <polygon points={poly(pr, [P, B, Cc])} fill={C.red} fillOpacity={0.22} stroke={C.red} strokeWidth={0.8} />
    <polygon points={poly(pr, [A, P, Cc])} fill={C.green} fillOpacity={0.22} stroke={C.green} strokeWidth={0.8} />
    <polygon points={poly(pr, [A, B, P])} fill={C.blue} fillOpacity={0.22} stroke={C.blue} strokeWidth={0.8} />
    <polygon points={poly(pr, [A, B, Cc])} fill="none" stroke={C.fg} strokeWidth={1.6} />
    {(["A", "B", "C"] as const).map((k, i) => {
      const col = [C.red, C.green, C.blue][i];
      return <g key={k}>
        <Handle x={pr.X(tri[k].x)} y={pr.Y(tri[k].y)} color={col} active={active === k} />
        <T x={pr.X(tri[k].x) + 9} y={pr.Y(tri[k].y) - 7} size={11} color={col} bold>{k}</T>
      </g>;
    })}
    <circle cx={pr.X(P.x)} cy={pr.Y(P.y)} r={11} fill={mix} stroke={C.fg} strokeWidth={1.2} pointerEvents="none" />
    <T x={pr.X(P.x) + 14} y={pr.Y(P.y) + 4} size={11} color={C.fg} bold>P</T>
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function DetStage({ mode, mm, tri, setCol, setPt }: {
  mode: Mode; mm: M2; tri: Tri; setCol: (id: "i" | "j", v: Pt) => void; setPt: (id: keyof Tri, v: Pt) => void;
}) {
  const snap = (v: number, lim: number) => clamp(Math.round(v * 4) / 4, -lim, lim);
  const drag = useDrag<Key>(
    q => mode === "area"
      ? nearest<Key>(q, [["i", S(pr, { x: mm[0], y: mm[2] })], ["j", S(pr, { x: mm[1], y: mm[3] })]], 18)
      : nearest<Key>(q, (["P", "A", "B", "C"] as const).map(k => [k, S(pr, tri[k])] as [Key, Pt]), 18),
    (id, q) => {
      const w = pr.inv(q);
      if (id === "i" || id === "j") setCol(id, { x: snap(w.x, 3), y: snap(w.y, 2.5) });
      else setPt(id, { x: clamp(Math.round(w.x * 10) / 10, -5.3, 5.3), y: clamp(Math.round(w.y * 10) / 10, -2.8, 2.8) });
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "area" ? <AreaDrawing mm={mm} active={drag.dragging} /> : <BaryDrawing tri={tri} active={drag.dragging} />}
    </svg>
  );
}

export function DeterminantFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("area");
  const [m, setRawM] = useState<M2>([2, 0.5, 0.5, 1.25]);
  const [rawAng, setAng] = useState(0);             // how far the green column has been swung, in degrees
  const [playing, setPlaying] = useState(false);
  const [tri, setTri] = useState<Tri>(TRI0);
  const lab = useLab("math-determinant");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && mode === "area" && (vis.on || lab.open), dt => setAng(a => (a + dt * 40) % 360));

  const ang = Math.round(rawAng);
  const mm = swung(m, ang);
  const setM = (v: M2) => { setRawM(v); setAng(0); setPlaying(false); };
  // Dragging a column keeps the picture as it is: the swing is folded into the stored matrix
  const setCol = (id: "i" | "j", v: Pt) => setM(id === "i" ? [v.x, mm[1], v.y, mm[3]] : [mm[0], v.x, mm[2], v.y]);
  const setPt = (id: keyof Tri, v: Pt) => setTri(cur => ({ ...cur, [id]: v }));
  const swingTo = (a: number) => { setPlaying(false); setAng(((a % 360) + 360) % 360); };
  const pick = (k: Mode) => { setMode(k); setPlaying(false); };

  const d = det(mm), col = detCol(d);
  const i1 = { x: mm[0], y: mm[2] }, j1 = { x: mm[1], y: mm[3] };
  const { u, v, w, inside } = weights(tri);

  const view = (
    <div>
      <DetStage mode={mode} mm={mm} tri={tri} setCol={setCol} setPt={setPt} />
      {mode === "area" && (
        <Transport t={t} playing={playing}
          onPlay={() => setPlaying(q => !q)}
          playLabel={tx(t, "figDet_swing", "swing the green column")}
          onStep={() => swingTo((Math.floor(ang / STEP) + 1) * STEP)}
          onBack={() => swingTo((Math.ceil(ang / STEP) - 1) * STEP)}
          onReset={() => swingTo(0)}
          readout={`${tx(t, "figDet_turned", "turned")} ${ang}° · det = ${n2(d)}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["area", tx(t, "figDet_mArea", "area scale")],
    ["bary", tx(t, "figDet_mBary", "barycentric")],
  ] as const} />;
  const controls = mode === "area" ? <>
    <Row>
      <Btn onClick={() => setM(rot(35))}>{tx(t, "figDet_pRot", "rotation")}</Btn>
      <Btn onClick={() => setM([1, 1, 0, 1])}>{tx(t, "figDet_pShear", "shear")}</Btn>
      <Btn onClick={() => setM([2, 0, 0, 1.5])}>{tx(t, "figDet_pScale", "scale 2 × 1.5")}</Btn>
      <Btn onClick={() => setM([0, 1, 1, 0])}>{tx(t, "figDet_pSwap", "swap x and y")}</Btn>
      <Btn onClick={() => setM([1, 2, 0.5, 1])}>{tx(t, "figDet_pFlat", "squash")}</Btn>
    </Row>
    <Row>
      <Readout>{`A = [ ${n2(mm[0])}  ${n2(mm[1])} ; ${n2(mm[2])}  ${n2(mm[3])} ]`}</Readout>
      <Readout color={col}>{`det A = ad − bc = ${n2(mm[0])}·${n2(mm[3])} − ${n2(mm[1])}·${n2(mm[2])} = ${n2(d)}`}</Readout>
      <Readout color={col}>{Math.abs(d) < 1e-6
        ? tx(t, "figDet_flat", "squashed onto a line: no area left")
        : d > 0 ? tx(t, "figDet_kept", "orientation kept") : tx(t, "figDet_flip", "orientation flipped")}</Readout>
    </Row>
  </> : <Row>
    <Readout color={C.red}>{`u = area(PBC)/area(ABC) = ${n2(u)}`}</Readout>
    <Readout color={C.green}>{`v = area(APC)/area(ABC) = ${n2(v)}`}</Readout>
    <Readout color={C.blue}>{`w = area(ABP)/area(ABC) = ${n2(w)}`}</Readout>
    <Readout>{`u + v + w = ${n2(u + v + w)}`}</Readout>
    <Readout color={inside ? C.green : C.pink}>{inside ? tx(t, "figDet_in", "all ≥ 0: P is inside") : tx(t, "figDet_out", "a weight < 0: P is outside")}</Readout>
  </Row>;
  const note = mode === "area"
    ? tx(t, "figDet_noteA2", "Drag the column tips. The dashed unit square has area 1; after the matrix it becomes the parallelogram spanned by the two columns, and its area is |det|. Every shape is scaled by the same factor, so the small F grows or shrinks just as much. Press play to swing the green column round: as it passes the red one the determinant goes through 0 and changes sign, and the F reads backwards (blue turns pink). Line the columns up and the determinant is 0: the plane collapses onto a line.")
    : tx(t, "figDet_noteB", "Drag P (and the corners). P cuts the triangle into three smaller ones, each opposite one corner. Its share of the whole area is P's weight for that corner: u for A (red), v for B (green), w for C (blue). The weights always add up to 1, and P = uA + vB + wC. Move P outside and one small triangle turns inside out, so its signed area and weight go negative. The circle at P is red, green and blue mixed in those amounts, a weighted average of the three corner colours.");

  // ── Lab ──
  const area = mode === "area", bary = mode === "bary";
  const len = (p: Pt) => Math.hypot(p.x, p.y);
  const third = Math.abs(u - 1 / 3) < 0.03 && Math.abs(v - 1 / 3) < 0.03 && Math.abs(w - 1 / 3) < 0.03;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figDetL1_t", "Double every area"),
      body: <>
        <p>{tx(t, "figDetL1_b1", "The dashed unit square has area 1. After the matrix it is the coloured parallelogram, and its area is the determinant.")}</p>
        <p>{tx(t, "figDetL1_b2", "Drag the columns so that every area doubles.")}</p>
      </>,
      goal: { text: tx(t, "figDetL1_g", "det = 2."), done: area && Math.abs(d - 2) < 1e-6 },
      hint: tx(t, "figDetL1_h", "Stretch one direction only: red at (2, 0), green left at (0, 1)."),
      setup: () => { pick("area"); setM([1, 0, 0, 1]); },
    },
    {
      title: tx(t, "figDetL2_t", "Swing past"),
      body: <>
        <p>{tx(t, "figDetL2_b1", "Now swing the green column round the origin, 15° at a time, and watch the number.")}</p>
        <p>{tx(t, "figDetL2_b2", "Keep going until the parallelogram turns pink.")}</p>
      </>,
      goal: { text: tx(t, "figDetL2_g", "det < 0: the F reads backwards."), done: area && d < -1e-6 && ang > 0 },
      hint: tx(t, "figDetL2_h", "At 90° the green column lies on the red one's line, pointing the other way, and det = 0. One step further and the sign flips."),
      focus: "step",
      setup: () => { pick("area"); setM([2, 0, 0, 1]); },
    },
    {
      title: tx(t, "figDetL3_t", "Quick check"),
      body: <p>{tx(t, "figDetL3_b", "A = [ 3  1 ; 1  2 ], row by row.")}</p>,
      quiz: {
        q: tx(t, "figDetL3_q", "A circle of area 2 goes through A. What is the area of the ellipse that comes out?"),
        options: ["10", "5", "14", "7"],
        answer: 0,
        why: tx(t, "figDetL3_w", "det A = 3 · 2 − 1 · 1 = 5, and every area is multiplied by 5: 2 · 5 = 10. 7 = 3·2 + 1·1 adds the diagonals instead of subtracting."),
      },
    },
    {
      title: tx(t, "figDetL4_t", "Nothing left"),
      body: <>
        <p>{tx(t, "figDetL4_b1", "A determinant of zero means the square has no area left at all.")}</p>
        <p>{tx(t, "figDetL4_b2", "Flatten the parallelogram, with both columns longer than zero.")}</p>
      </>,
      goal: { text: tx(t, "figDetL4_g", "det = 0, neither column zero."), done: area && Math.abs(d) < 1e-6 && len(i1) > 0.1 && len(j1) > 0.1 },
      hint: tx(t, "figDetL4_h", "Put both columns on one line through the origin, for example red (1, 1) and green (2, 2)."),
      setup: () => { pick("area"); setM([2, 0.5, 0.5, 1.25]); },
    },
    {
      title: tx(t, "figDetL5_t", "Quick check"),
      body: <p>{tx(t, "figDetL5_b", "A is a 2 × 2 matrix with det A = 3.")}</p>,
      quiz: {
        q: tx(t, "figDetL5_q", "What is det(2A)?"),
        options: ["12", "6", "9", "3"],
        answer: 0,
        why: tx(t, "figDetL5_w", "2A doubles both columns, so the parallelogram is twice as wide and twice as tall: 2 · 2 · 3 = 12. In n dimensions the factor is 2ⁿ."),
      },
    },
    {
      title: tx(t, "figDetL6_t", "All weight on one corner"),
      body: <>
        <p>{tx(t, "figDetL6_b1", "P's weight for a corner is the share of the area of the small triangle opposite that corner.")}</p>
        <p>{tx(t, "figDetL6_b2", "Drag P onto corner B.")}</p>
      </>,
      goal: { text: tx(t, "figDetL6_g", "v = 1 (to 0.03): P is at B."), done: bary && v > 0.97 && v < 1.03 },
      setup: () => { pick("bary"); setTri(TRI0); },
    },
    {
      title: tx(t, "figDetL7_t", "The centre"),
      body: <p>{tx(t, "figDetL7_b", "Find the point that gives all three corners the same weight.")}</p>,
      goal: { text: tx(t, "figDetL7_g", "u = v = w = ⅓ (to 0.03)."), done: bary && third },
      hint: tx(t, "figDetL7_h", "It is the centroid, the average of the corners: ((−3.5 + 3.5 + 0)/3, (−2 − 1.5 + 2.5)/3) ≈ (0, −0.3)."),
    },
    {
      title: tx(t, "figDetL8_t", "Step outside"),
      body: <p>{tx(t, "figDetL8_b", "Drag P out of the triangle and watch which weight goes negative.")}</p>,
      goal: { text: tx(t, "figDetL8_g", "One weight < 0."), done: bary && !inside },
    },
    {
      title: tx(t, "figDetL9_t", "Quick check"),
      body: <p>{tx(t, "figDetL9_b", "A = (0, 0), B = (4, 0), C = (0, 4), P = (1, 1). area(ABC) = 8 and area(PBC) = 4.")}</p>,
      quiz: {
        q: tx(t, "figDetL9_q", "What is P's weight u for corner A?"),
        options: ["0.5", "0.25", "4", "1"],
        answer: 0,
        why: tx(t, "figDetL9_w", "u = area(PBC) / area(ABC) = 4 / 8 = 0.5. The other two share the rest: v = w = 0.25, and 0.5 + 0.25 + 0.25 = 1."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "rigid", tone: "ok", when: area && Math.abs(d - 1) < 1e-6 && Math.abs(len(i1) - 1) < 1e-6 && Math.abs(len(j1) - 1) < 1e-6 && Math.abs(i1.x - 1) > 1e-6,
      title: tx(t, "figDetI1_t", "Area kept"),
      body: tx(t, "figDetI1_b", "Both columns have length 1 and meet at a right angle: a rotation. It turns shapes without changing their size, so det = 1."),
    },
    {
      id: "shear", tone: "ok", when: area && Math.abs(d - 1) < 1e-6 && (Math.abs(len(i1) - 1) > 1e-6 || Math.abs(len(j1) - 1) > 1e-6),
      title: tx(t, "figDetI2_t", "Same area, new shape"),
      body: tx(t, "figDetI2_b", "det = 1 but the columns are not perpendicular unit vectors: the square has been sheared or stretched one way and squeezed the other, yet its area is still 1."),
    },
    {
      id: "neg", tone: "info", when: area && d < -1e-6,
      title: tx(t, "figDetI3_t", "Flipped over"),
      body: fill(tx(t, "figDetI3_b", "det = {d}: areas are scaled by {a} and the plane is mirrored. Going from red to green now turns clockwise."), { d: n2(d), a: n2(-d) }),
    },
    {
      id: "zero", tone: "warn", when: area && Math.abs(d) < 1e-6,
      title: tx(t, "figDetI4_t", "Collapsed"),
      body: tx(t, "figDetI4_b", "The columns lie on one line, so the whole plane lands on that line. Areas become 0, and different points share an image: this matrix cannot be undone."),
    },
    {
      id: "edge", tone: "info", when: bary && inside && Math.min(u, v, w) < 0.02 && Math.max(u, v, w) < 0.97,
      title: tx(t, "figDetI5_t", "On an edge"),
      body: tx(t, "figDetI5_b", "One weight is (almost) 0: the small triangle opposite that corner has no area, so P sits on the edge facing the corner."),
    },
    {
      id: "centroid", tone: "ok", when: bary && third,
      title: tx(t, "figDetI6_t", "The centroid"),
      body: tx(t, "figDetI6_b", "Equal weights, ⅓ each: P is the average of the three corners, where the medians meet. The colour at P is an even mix of red, green and blue."),
    },
    {
      id: "out", tone: "warn", when: bary && !inside,
      title: tx(t, "figDetI7_t", "Outside"),
      body: fill(tx(t, "figDetI7_b", "The triangle opposite {k} has turned inside out, so its signed area and P's weight for {k} are negative. The weights still add up to 1."), { k: u < 0 ? "A" : v < 0 ? "B" : "C" }),
    },
  ];

  const title = tx(t, "figDet_title", "What the determinant measures");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figDetR1", "det A = ad − bc is the signed area of the parallelogram of the columns: the factor for every area."),
          tx(t, "figDetR2", "Negative: the plane is mirrored. Zero: it collapses onto a line and cannot be undone."),
          tx(t, "figDetR3", "Scaling a 2 × 2 matrix by k scales its determinant by k²."),
          tx(t, "figDetR4", "Barycentric weights are area shares; all ≥ 0 exactly when P is inside, and they always sum to 1."),
        ]}
      />
    </>
  );
}
