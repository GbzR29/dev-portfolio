"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, C, T, Handle, Vec, plot, Grid, useDrag, useFrame, useVisible, nearest, clamp, type Pt, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { type M2, I2, apply, mul, rot, det, n2, F_SHAPE } from "./mat2";

// ── What this figure shows ────────────────────────────────────────────────────
// columns — a 2 × 2 matrix is fully described by where it sends the two unit
//           steps: its first column is the new (1, 0), its second the new
//           (0, 1). Drag their tips; the whole grid, the letter F and the
//           vector v = (2, 1) follow, because every point is x·column 1 +
//           y·column 2. The Transport applies the matrix gradually, sliding
//           the plane from the identity to A.
// compose — two matrices applied one after the other. Rotating then shearing
//           is not the same as shearing then rotating: matrix products depend
//           on order. The Transport plays the first matrix, then the second.
// The lab: watch a matrix act, build a quarter turn from its columns, a
// mirror image, a flattened plane, then the order of a product.

type Mode = "columns" | "compose";
const W = 560, H = 300;
const V: Pt = { x: 2, y: 1 };
const PRESETS: [string, string, M2][] = [
  ["id", "identity", I2],
  ["rot", "rotate 30°", rot(30)],
  ["scale", "scale", [1.5, 0, 0, 0.75]],
  ["shear", "shear", [1, 1, 0, 1]],
  ["flip", "mirror", [-1, 0, 0, 1]],
  ["proj", "flatten", [1, 0, 0, 0]],
];
const SHEAR: M2 = [1, 1, 0, 1], TURN: M2 = rot(90);
const pr = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const pl = plot({ W: W / 2, H, x0: -3.2, x1: 3.2, y0: -2.6, y1: 4.26 });

const poly = (p: Plot, pts: Pt[]) => pts.map(q => `${p.X(q.x).toFixed(1)},${p.Y(q.y).toFixed(1)}`).join(" ");
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
/** The matrix a fraction s of the way from m to n. */
const mix = (m: M2, n: M2, s: number): M2 => [0, 1, 2, 3].map(i => m[i] + (n[i] - m[i]) * s) as M2;
const fmtM = (m: M2) => `[ ${n2(m[0])}  ${n2(m[1])} ; ${n2(m[2])}  ${n2(m[3])} ]`;
const same = (m: M2, n: M2) => m.every((v, i) => Math.abs(v - n[i]) < 1e-6);

/** The integer grid after the matrix: lines x = k and y = k mapped through m. */
function WarpedGrid({ p, m, color }: { p: Plot; m: M2; color: string }) {
  const L: React.ReactNode[] = [];
  for (let k = -8; k <= 8; k++) {
    const a = apply(m, { x: k, y: -8 }), b = apply(m, { x: k, y: 8 });
    const c = apply(m, { x: -8, y: k }), d = apply(m, { x: 8, y: k });
    L.push(<line key={`v${k}`} x1={p.X(a.x)} y1={p.Y(a.y)} x2={p.X(b.x)} y2={p.Y(b.y)} stroke={color} strokeWidth={k === 0 ? 1.4 : 0.7} opacity={k === 0 ? 0.8 : 0.4} />);
    L.push(<line key={`h${k}`} x1={p.X(c.x)} y1={p.Y(c.y)} x2={p.X(d.x)} y2={p.Y(d.y)} stroke={color} strokeWidth={k === 0 ? 1.4 : 0.7} opacity={k === 0 ? 0.8 : 0.4} />);
  }
  return <g pointerEvents="none">{L}</g>;
}

// ── The drawings ──────────────────────────────────────────────────────────────

function ColumnsDrawing({ mm, active }: { mm: M2; active: string | null }) {
  const i1 = { x: mm[0], y: mm[2] }, j1 = { x: mm[1], y: mm[3] };
  const v1 = apply(mm, V), step = { x: V.x * i1.x, y: V.x * i1.y };
  return <>
    <Grid p={pr} step={1} />
    <WarpedGrid p={pr} m={mm} color={C.sky} />
    <polygon points={poly(pr, F_SHAPE)} fill={C.muted} fillOpacity={0.12} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
    <polygon points={poly(pr, F_SHAPE.map(q => apply(mm, q)))} fill={C.amber} fillOpacity={0.3} stroke={C.amber} strokeWidth={1.6} />
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, step)} color={C.red} w={1.6} dash="4 3" opacity={0.7} />
    <Vec a={S(pr, step)} b={S(pr, v1)} color={C.green} w={1.6} dash="4 3" opacity={0.7} />
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, v1)} color={C.purple} w={2.2} />
    <T x={pr.X(v1.x) + 8} y={pr.Y(v1.y) - 6} size={10} color={C.purple} bold>{`Av = (${n2(v1.x)}, ${n2(v1.y)})`}</T>
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, i1)} color={C.red} w={3} />
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, j1)} color={C.green} w={3} />
    <Handle x={pr.X(i1.x)} y={pr.Y(i1.y)} color={C.red} active={active === "i"} />
    <Handle x={pr.X(j1.x)} y={pr.Y(j1.y)} color={C.green} active={active === "j"} />
  </>;
}

function ComposeDrawing({ shearFirst, s, t }: { shearFirst: boolean; s: number; t?: TrackTranslations }) {
  const first = shearFirst ? SHEAR : TURN, second = shearFirst ? TURN : SHEAR;
  const both = mul(second, first);
  const cur = s <= 1 ? mix(I2, first, s) : mix(first, both, s - 1);
  const mid = F_SHAPE.map(q => apply(first, q));
  const now = F_SHAPE.map(q => apply(cur, q));
  const end = F_SHAPE.map(q => apply(both, q));
  const other = F_SHAPE.map(q => apply(mul(first, second), q));
  const panel = (dx: number, title: string, body: React.ReactNode) =>
    <g transform={`translate(${dx},0)`}>
      <Grid p={pl} step={1} labels={false} />
      {body}
      <T x={8} y={16} size={10} color={C.fg} bold>{title}</T>
    </g>;
  return <>
    {panel(0, tx(t, "figMat_steps", "one step at a time"), <>
      <polygon points={poly(pl, F_SHAPE)} fill={C.muted} fillOpacity={0.12} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      {s > 1 && <polygon points={poly(pl, mid)} fill={C.sky} fillOpacity={0.2} stroke={C.sky} strokeWidth={1.2} />}
      <polygon points={poly(pl, now)} fill={s > 1 ? C.amber : C.sky} fillOpacity={0.35} stroke={s > 1 ? C.amber : C.sky} strokeWidth={1.6} />
    </>)}
    <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke={C.axis} strokeWidth={1} />
    {panel(W / 2, tx(t, "figMat_swapped", "the other order"), <>
      <polygon points={poly(pl, F_SHAPE)} fill={C.muted} fillOpacity={0.12} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <polygon points={poly(pl, end)} fill="none" stroke={C.amber} strokeWidth={1} strokeDasharray="4 3" />
      <polygon points={poly(pl, other)} fill={C.pink} fillOpacity={0.35} stroke={C.pink} strokeWidth={1.6} />
    </>)}
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function MatStage({ mode, mm, setCol, shearFirst, s, t }: {
  mode: Mode; mm: M2; setCol: (id: "i" | "j", v: Pt) => void; shearFirst: boolean; s: number; t?: TrackTranslations;
}) {
  const snap = (v: number, lim: number) => clamp(Math.round(v * 4) / 4, -lim, lim);
  const drag = useDrag<"i" | "j">(
    q => (mode === "columns" ? nearest(q, [["i", S(pr, { x: mm[0], y: mm[2] })], ["j", S(pr, { x: mm[1], y: mm[3] })]], 18) : null),
    (id, q) => { const w = pr.inv(q); setCol(id, { x: snap(w.x, 3), y: snap(w.y, 2.5) }); });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "columns" ? <ColumnsDrawing mm={mm} active={drag.dragging} /> : <ComposeDrawing shearFirst={shearFirst} s={s} t={t} />}
    </svg>
  );
}

export function MatrixFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("columns");
  const [m, setRawM] = useState<M2>([1, 0.5, 0.25, 1]);
  const [shearFirst, setShearFirst] = useState(false);
  const [s, setS] = useState(1);                 // columns: 0 = identity … 1 = A; compose: 0 … 2 (two matrices)
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-matrix");
  const vis = useVisible<HTMLDivElement>();

  const end = mode === "columns" ? 1 : 2;
  useFrame(playing && (vis.on || lab.open), dt => {
    const next = s + dt * 0.6;
    if (next >= end) { setS(end); setPlaying(false); } else setS(next);
  });

  const setM = (v: M2) => { setRawM(v); setS(1); setPlaying(false); };
  const setCol = (id: "i" | "j", v: Pt) => setM(id === "i" ? [v.x, m[1], v.y, m[3]] : [m[0], v.x, m[2], v.y]);
  const pick = (k: Mode) => { setMode(k); setPlaying(false); setS(k === "columns" ? 1 : 2); };
  const order = (sf: boolean) => { setShearFirst(sf); setPlaying(false); setS(2); };
  const stepTo = (v: number) => { setPlaying(false); setS(clamp(v, 0, end)); };
  const quarter = mode === "columns" ? 0.25 : 1;          // one ⏭ press

  const mm = mode === "columns" ? mix(I2, m, s) : m;
  const i1 = { x: m[0], y: m[2] }, j1 = { x: m[1], y: m[3] };
  const d = det(m);
  const first = shearFirst ? SHEAR : TURN, second = shearFirst ? TURN : SHEAR;
  const prod = mul(second, first), otherProd = mul(first, second);

  const view = (
    <div>
      <MatStage mode={mode} mm={mm} setCol={setCol} shearFirst={shearFirst} s={s} t={t} />
      <Transport t={t} playing={playing}
        onPlay={() => { if (!playing && s >= end) setS(0); setPlaying(q => !q); }}
        playLabel={mode === "columns" ? tx(t, "figMat_apply", "apply the matrix") : tx(t, "figMat_play2", "apply one, then the other")}
        onStep={() => stepTo((Math.floor(s / quarter + 1e-6) + 1) * quarter)}
        onBack={() => stepTo((Math.ceil(s / quarter - 1e-6) - 1) * quarter)}
        onReset={() => stepTo(0)}
        readout={mode === "columns"
          ? `${Math.round(s * 100)}% · ${fmtM(mm)}`
          : s <= 0 ? tx(t, "figMat_st0", "the letter F") : s <= 1 ? fill(tx(t, "figMat_st1", "after {m}"), { m: shearFirst ? "S" : "R" }) : fill(tx(t, "figMat_st2", "after {a}, then {b}"), { a: shearFirst ? "S" : "R", b: shearFirst ? "R" : "S" })} />
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["columns", tx(t, "figMat_mCols", "columns")],
    ["compose", tx(t, "figMat_mComp", "order matters")],
  ] as const} />;
  const controls = mode === "columns" ? <>
    <Row>{PRESETS.map(([k, label, pm]) =>
      <Btn key={k} onClick={() => setM(pm)}>{tx(t, `figMat_p_${k}`, label)}</Btn>)}</Row>
    <Row>
      <Readout>{`A = ${fmtM(m)}`}</Readout>
      <Readout color={C.red}>{`A(1, 0) = (${n2(i1.x)}, ${n2(i1.y)})`}</Readout>
      <Readout color={C.green}>{`A(0, 1) = (${n2(j1.x)}, ${n2(j1.y)})`}</Readout>
      <Readout color={C.purple}>{`A(2, 1) = 2·(${n2(i1.x)}, ${n2(i1.y)}) + 1·(${n2(j1.x)}, ${n2(j1.y)})`}</Readout>
    </Row>
  </> : <>
    <Row>
      <Btn active={!shearFirst} onClick={() => order(false)}>{tx(t, "figMat_turnFirst", "turn, then shear")}</Btn>
      <Btn active={shearFirst} onClick={() => order(true)}>{tx(t, "figMat_shearFirst", "shear, then turn")}</Btn>
    </Row>
    <Row>
      <Readout>{`R = ${fmtM(TURN)}`}</Readout>
      <Readout>{`S = ${fmtM(SHEAR)}`}</Readout>
      <Readout color={C.amber}>{`${shearFirst ? "R·S" : "S·R"} = ${fmtM(prod)}`}</Readout>
      <Readout color={C.pink}>{`${shearFirst ? "S·R" : "R·S"} = ${fmtM(otherProd)}`}</Readout>
    </Row>
  </>;
  const note = mode === "columns"
    ? tx(t, "figMat_noteC2", "Drag the red and green tips. They are the matrix's two columns: where the unit step right (1, 0) and the unit step up (0, 1) end up. Everything else follows from them. The blue grid is the old square grid after the matrix, the amber F is the grey F after the matrix, and the purple vector is v = (2, 1) after the matrix: 2 red steps plus 1 green step (dashed). Press play to watch the plane slide from where it was to where A sends it. Try the presets, and notice that grid lines stay straight, parallel and evenly spaced, and the origin never moves.")
    : tx(t, "figMat_noteM2", "R turns a quarter turn, S shears (it slides each point sideways by its height). Left: press play to apply the first matrix to the grey F (blue), then the second (amber). Right: the same two matrices in the other order (pink), with the amber result dashed for comparison. They differ, and so do the two products in the readouts. The product written first is applied last: S·R means R first, then S, because (S·R)v = S(Rv).");

  // ── Lab ──
  const cols = mode === "columns";
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figMatL1_t", "Watch a matrix act"),
      body: <>
        <p>{tx(t, "figMatL1_b1", "A is a shear: (1, 0) stays put and (0, 1) leans over to (1, 1). The plane starts untouched.")}</p>
        <p>{tx(t, "figMatL1_b2", "Press play and watch every point slide to where A sends it.")}</p>
      </>,
      goal: { text: tx(t, "figMatL1_g", "Apply A all the way (100%)."), done: cols && s >= 1 && same(m, SHEAR) },
      focus: "play",
      setup: () => { pick("columns"); setRawM(SHEAR); setS(0); },
    },
    {
      title: tx(t, "figMatL2_t", "Build a quarter turn"),
      body: <>
        <p>{tx(t, "figMatL2_b1", "A matrix is just its two columns: where (1, 0) lands (red) and where (0, 1) lands (green).")}</p>
        <p>{tx(t, "figMatL2_b2", "Drag the tips to make A turn the plane a quarter turn counter-clockwise.")}</p>
      </>,
      goal: { text: tx(t, "figMatL2_g", "Red at (0, 1), green at (−1, 0)."), done: cols && s >= 1 && same(m, [0, -1, 1, 0]) },
      hint: tx(t, "figMatL2_h", "Turning (1, 0) a quarter turn gives (0, 1); turning (0, 1) gives (−1, 0)."),
      setup: () => { pick("columns"); setM(I2); },
    },
    {
      title: tx(t, "figMatL3_t", "Quick check"),
      body: <p>{tx(t, "figMatL3_b", "A = [ 2  0 ; 0  3 ], written row by row.")}</p>,
      quiz: {
        q: tx(t, "figMatL3_q", "Where does A send (1, 1)?"),
        options: ["(2, 3)", "(5, 5)", "(3, 2)", "(2, 0)"],
        answer: 0,
        why: tx(t, "figMatL3_w", "1 · (first column) + 1 · (second column) = (2, 0) + (0, 3) = (2, 3). Row by row: 2 · 1 + 0 · 1 = 2 and 0 · 1 + 3 · 1 = 3."),
      },
    },
    {
      title: tx(t, "figMatL4_t", "A mirror image"),
      body: <>
        <p>{tx(t, "figMatL4_b1", "Some matrices flip the plane over: the F comes out back to front, like in a mirror.")}</p>
        <p>{tx(t, "figMatL4_b2", "Move the columns until the amber F reads backwards.")}</p>
      </>,
      goal: { text: tx(t, "figMatL4_g", "The F is mirrored."), done: cols && s >= 1 && d < -1e-6 },
      hint: tx(t, "figMatL4_h", "Swap the roles of the columns: red at (0, 1), green at (1, 0) mirrors the plane in the diagonal."),
      setup: () => { pick("columns"); setM(I2); },
    },
    {
      title: tx(t, "figMatL5_t", "Flatten the plane"),
      body: <>
        <p>{tx(t, "figMatL5_b1", "If both columns lie on one line, every x·red + y·green does too.")}</p>
        <p>{tx(t, "figMatL5_b2", "Make the whole grid collapse onto a line, with neither column zero.")}</p>
      </>,
      goal: { text: tx(t, "figMatL5_g", "The columns are parallel."), done: cols && s >= 1 && Math.abs(d) < 1e-6 && Math.hypot(i1.x, i1.y) > 0.1 && Math.hypot(j1.x, j1.y) > 0.1 },
      hint: tx(t, "figMatL5_h", "Put green at twice red, for example red (1, 0.5) and green (2, 1)."),
    },
    {
      title: tx(t, "figMatL6_t", "One, then the other"),
      body: <>
        <p>{tx(t, "figMatL6_b1", "R turns a quarter turn, S shears. On the left the F goes through them one at a time.")}</p>
        <p>{tx(t, "figMatL6_b2", "Choose \"shear, then turn\" and step through both stages.")}</p>
      </>,
      goal: { text: tx(t, "figMatL6_g", "Shear first, both stages shown."), done: !cols && shearFirst && s >= 2 },
      focus: "step",
      setup: () => { pick("compose"); setShearFirst(false); setS(2); },
    },
    {
      title: tx(t, "figMatL7_t", "Quick check"),
      body: <p>{tx(t, "figMatL7_b", "(S·R)v = S(Rv): the matrix nearest to v acts first.")}</p>,
      quiz: {
        q: tx(t, "figMatL7_q", "Which product means \"shear first, then turn\"?"),
        options: ["R·S", "S·R", tx(t, "figMatL7_o3", "both, since they are equal"), "S + R"],
        answer: 0,
        why: tx(t, "figMatL7_w", "In R·S the S sits next to v, so it acts first and R turns the result. The readouts show R·S and S·R are different matrices."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "id", tone: "info", when: cols && s >= 1 && same(m, I2),
      title: tx(t, "figMatI1_t", "The identity"),
      body: tx(t, "figMatI1_b", "Both columns are the unit steps themselves, so nothing moves: Iv = v for every v."),
    },
    {
      id: "rigid", tone: "ok", when: cols && s >= 1 && !same(m, I2) && Math.abs(Math.hypot(i1.x, i1.y) - 1) < 1e-6 && Math.abs(i1.x * j1.x + i1.y * j1.y) < 1e-6 && d > 0,
      title: tx(t, "figMatI2_t", "A pure rotation"),
      body: tx(t, "figMatI2_b", "The columns have length 1 and meet at a right angle, turning the same way as (1, 0) and (0, 1): the matrix turns the plane without stretching it."),
    },
    {
      id: "mirror", tone: "info", when: cols && s >= 1 && d < -1e-6,
      title: tx(t, "figMatI3_t", "Flipped over"),
      body: fill(tx(t, "figMatI3_b", "Going from the red column to the green one now turns clockwise, the opposite of (1, 0) to (0, 1). The plane has been flipped, and the F reads backwards. The number ad − bc = {d} is negative; the next chapter calls it the determinant."), { d: n2(d) }),
    },
    {
      id: "flat", tone: "warn", when: cols && s >= 1 && Math.abs(d) < 1e-6 && (Math.hypot(i1.x, i1.y) > 0.1 || Math.hypot(j1.x, j1.y) > 0.1),
      title: tx(t, "figMatI4_t", "Squashed onto a line"),
      body: tx(t, "figMatI4_b", "The columns are parallel, so every point lands on one line and the F has no area left. Many points now share the same image: there is no way to undo this matrix."),
    },
    {
      id: "order", tone: "info", when: !cols && s >= 2,
      title: tx(t, "figMatI5_t", "Different results"),
      body: fill(tx(t, "figMatI5_b", "{a} first gives {p}; the other order gives {q}. Matrix products do not commute."), { a: shearFirst ? "S" : "R", p: fmtM(prod), q: fmtM(otherProd) }),
    },
  ];

  const title = tx(t, "figMatx_title", "A matrix moves the whole plane");
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
          tx(t, "figMatR1", "The columns of a matrix are where (1, 0) and (0, 1) land."),
          tx(t, "figMatR2", "Av = x · (column 1) + y · (column 2): lines stay straight, parallel and evenly spaced."),
          tx(t, "figMatR3", "Some matrices flip the plane; parallel columns squash it onto a line."),
          tx(t, "figMatR4", "S·R means R first, then S; the order changes the result."),
        ]}
      />
    </>
  );
}
