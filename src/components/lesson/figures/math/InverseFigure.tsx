"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, Vec, plot, Grid, useDrag, useFrame, useVisible, clamp, type Pt, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { type M2, apply, det, inverse, n2 } from "./mat2";

// ── What this figure shows ────────────────────────────────────────────────────
// solve     — Ax = b asks: which recipe x (how many steps along each column)
//             lands on b? Drag b; x = A⁻¹b is read off the warped grid, and
//             the two column steps are drawn. When det A = 0 the columns are
//             parallel, the grid collapses and most b cannot be reached.
// eliminate — Gauss–Jordan elimination on a 3 × 3 system, one row operation
//             per step, until the left block is the identity and the right
//             column is the solution. The Transport plays the steps.
// The lab: two recipes, a collapsed grid, then the elimination to the end.

type Mode = "solve" | "eliminate";
const W = 560, H = 300;
const pr = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
const STEP_S = 1.4;                 // seconds per elimination step while playing

// ── The elimination example ───────────────────────────────────────────────────
//  2x +  y −  z =   8
// −3x −  y + 2z = −11
// −2x +  y + 2z =  −3      solution (2, 3, −1)
type Aug = number[][];
type Op = { kind: "add"; to: number; from: number; k: number } | { kind: "scale"; row: number; k: number };
const START: Aug = [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]];
const OPS: Op[] = [
  { kind: "add", to: 1, from: 0, k: 1.5 },
  { kind: "add", to: 2, from: 0, k: 1 },
  { kind: "add", to: 2, from: 1, k: -4 },
  { kind: "scale", row: 2, k: -1 },
  { kind: "add", to: 1, from: 2, k: -0.5 },
  { kind: "scale", row: 1, k: 2 },
  { kind: "add", to: 0, from: 2, k: 1 },
  { kind: "add", to: 0, from: 1, k: -1 },
  { kind: "scale", row: 0, k: 0.5 },
];
const STATES: Aug[] = OPS.reduce<Aug[]>((acc, op) => {
  const m = acc[acc.length - 1].map(r => [...r]);
  if (op.kind === "add") m[op.to] = m[op.to].map((v, j) => v + op.k * m[op.from][j]);
  else m[op.row] = m[op.row].map(v => v * op.k);
  acc.push(m);
  return acc;
}, [START]);
const LAST = OPS.length;

const fmt = (v: number) => { const r = Math.round(v * 100) / 100; return (Object.is(r, -0) ? 0 : r).toString().replace("-", "−"); };
const opText = (op: Op) => op.kind === "add"
  ? `R${op.to + 1} ← R${op.to + 1} ${op.k < 0 ? "−" : "+"} ${fmt(Math.abs(op.k))}·R${op.from + 1}`
  : `R${op.row + 1} ← ${fmt(op.k)}·R${op.row + 1}`;

// ── The drawings ──────────────────────────────────────────────────────────────

function SolveDrawing({ m, target, active }: { m: M2; target: Pt; active: boolean }) {
  const dm = det(m), inv = inverse(m);
  const x = inv ? apply(inv, target) : null;
  const i1 = { x: m[0], y: m[2] }, j1 = { x: m[1], y: m[3] };
  const lines: React.ReactNode[] = [];
  if (Math.abs(dm) > 0.05) for (let k = -10; k <= 10; k++) {
    const p1 = apply(m, { x: k, y: -10 }), p2 = apply(m, { x: k, y: 10 });
    const q1 = apply(m, { x: -10, y: k }), q2 = apply(m, { x: 10, y: k });
    lines.push(<line key={`v${k}`} x1={pr.X(p1.x)} y1={pr.Y(p1.y)} x2={pr.X(p2.x)} y2={pr.Y(p2.y)} stroke={C.sky} strokeWidth={0.7} opacity={0.4} />);
    lines.push(<line key={`h${k}`} x1={pr.X(q1.x)} y1={pr.Y(q1.y)} x2={pr.X(q2.x)} y2={pr.Y(q2.y)} stroke={C.sky} strokeWidth={0.7} opacity={0.4} />);
  }
  const mid = x ? { x: x.x * i1.x, y: x.x * i1.y } : null;
  return <>
    <Grid p={pr} step={1} />
    <g pointerEvents="none">{lines}</g>
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, i1)} color={C.red} w={3} />
    <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, j1)} color={C.green} w={3} />
    {x && mid && <>
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, mid)} color={C.red} w={1.6} dash="4 3" />
      <Vec a={S(pr, mid)} b={S(pr, target)} color={C.green} w={1.6} dash="4 3" />
    </>}
    <Handle x={pr.X(target.x)} y={pr.Y(target.y)} color={C.amber} active={active} />
    <T x={pr.X(target.x) + 10} y={pr.Y(target.y) - 8} size={10.5} color={C.amber} bold>{`b = (${n2(target.x)}, ${n2(target.y)})`}</T>
  </>;
}

function EliminateDrawing({ step, t }: { step: number; t?: TrackTranslations }) {
  const cur = STATES[step], prev = step > 0 ? OPS[step - 1] : null;
  const hot = prev ? (prev.kind === "add" ? prev.to : prev.row) : -1;
  const src = prev && prev.kind === "add" ? prev.from : -1;
  const cellW = 74, x0 = W / 2 - cellW * 2, y0 = 70, rowH = 52;
  return <>
    {cur.map((row, i) => <g key={i}>
      <rect x={x0 - 12} y={y0 + i * rowH - 30} width={cellW * 4 + 24} height={44} rx={8}
        fill={i === hot ? C.amber : i === src ? C.sky : "none"} fillOpacity={0.14}
        stroke={i === hot ? C.amber : i === src ? C.sky : "none"} strokeWidth={1.2} />
      <T x={x0 - 26} y={y0 + i * rowH} size={11} anchor="end" color={C.muted}>{`R${i + 1}`}</T>
      {row.map((v, j) => <T key={j} x={x0 + j * cellW + cellW / 2} y={y0 + i * rowH} size={16} anchor="middle"
        color={j === 3 ? C.amber : Math.abs(v) < 1e-9 ? C.muted : C.fg} bold={j === 3}>{fmt(v)}</T>)}
    </g>)}
    <line x1={x0 + cellW * 3} x2={x0 + cellW * 3} y1={y0 - 34} y2={y0 + 2 * rowH + 18} stroke={C.axis} strokeWidth={1.2} />
    {["x", "y", "z"].map((s, j) => <T key={s} x={x0 + j * cellW + cellW / 2} y={y0 - 38} size={10} anchor="middle" color={C.muted}>{s}</T>)}
    <T x={W / 2} y={H - 30} size={12} anchor="middle" color={hot >= 0 ? C.amber : C.muted} bold>
      {prev ? opText(prev) : tx(t, "figInv_start", "the system as a table of numbers")}
    </T>
    {step === LAST && <T x={W / 2} y={H - 10} size={11} anchor="middle" color={C.green} bold>x = 2, y = 3, z = −1</T>}
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function InvStage({ mode, m, target, setTarget, step, t }: {
  mode: Mode; m: M2; target: Pt; setTarget: (v: Pt) => void; step: number; t?: TrackTranslations;
}) {
  const drag = useDrag<"b">(
    () => (mode === "solve" ? "b" : null),
    (_, q) => { const w = pr.inv(q); setTarget({ x: clamp(Math.round(w.x * 4) / 4, -5, 5), y: clamp(Math.round(w.y * 4) / 4, -2.75, 2.75) }); });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "solve" ? <SolveDrawing m={m} target={target} active={drag.dragging === "b"} /> : <EliminateDrawing step={step} t={t} />}
    </svg>
  );
}

export function InverseFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("solve");
  const [a, setA] = useState(1.5), [b, setB] = useState(0.5), [c, setC] = useState(0.5), [d, setD] = useState(1);
  const [target, setTarget] = useState<Pt>({ x: 3, y: 2 });
  const [step, setStep] = useState(0);
  const [clock, setClock] = useState(0);            // seconds since the last elimination step, while playing
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-inverse");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && mode === "eliminate" && (vis.on || lab.open), dt => {
    const now = clock + dt;
    if (now < STEP_S) { setClock(now); return; }
    setClock(0);
    setStep(Math.min(LAST, step + 1));
    if (step + 1 >= LAST) setPlaying(false);
  });

  const goTo = (s: number) => { setPlaying(false); setClock(0); setStep(clamp(s, 0, LAST)); };
  const pick = (k: Mode) => { setMode(k); setPlaying(false); };
  const setAll = (m: M2) => { setA(m[0]); setB(m[1]); setC(m[2]); setD(m[3]); };

  const m: M2 = [a, b, c, d];
  const dm = det(m), inv = inverse(m);
  const x = inv ? apply(inv, target) : null;

  const view = (
    <div>
      <InvStage mode={mode} m={m} target={target} setTarget={setTarget} step={step} t={t} />
      {mode === "eliminate" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (!playing && step >= LAST) setStep(0); setClock(0); setPlaying(q => !q); }}
          playLabel={tx(t, "figInv_play", "eliminate")}
          onStep={() => goTo(step + 1)}
          onBack={() => goTo(step - 1)}
          onReset={() => goTo(0)}
          readout={`${step} / ${LAST} · ${step <= 3 ? tx(t, "figInv_phase1", "forward: zeros below the diagonal") : tx(t, "figInv_phase2", "backward: zeros above, ones on the diagonal")}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["solve", tx(t, "figInv_mSolve", "solve Ax = b")],
    ["eliminate", tx(t, "figInv_mElim", "elimination")],
  ] as const} />;
  const controls = mode === "solve" ? <>
    <Sliders>
      <Slider label="a" value={a} min={-2} max={2} step={0.25} onChange={setA} width="w-4" />
      <Slider label="b" value={b} min={-2} max={2} step={0.25} onChange={setB} width="w-4" />
      <Slider label="c" value={c} min={-2} max={2} step={0.25} onChange={setC} width="w-4" />
      <Slider label="d" value={d} min={-2} max={2} step={0.25} onChange={setD} width="w-4" />
    </Sliders>
    <Row>
      <Readout>{`A = [ ${n2(a)}  ${n2(b)} ; ${n2(c)}  ${n2(d)} ]`}</Readout>
      <Readout color={Math.abs(dm) < 1e-9 ? C.pink : undefined}>{`det A = ${n2(dm)}`}</Readout>
      {inv
        ? <Readout>{`A⁻¹ = (1/${n2(dm)})·[ ${n2(d)}  ${n2(-b)} ; ${n2(-c)}  ${n2(a)} ]`}</Readout>
        : <Readout color={C.pink}>{tx(t, "figInv_none", "det = 0: no inverse")}</Readout>}
      {x && <Readout color={C.amber}>{`x = A⁻¹b = (${n2(x.x)}, ${n2(x.y)})`}</Readout>}
    </Row>
  </> : null;
  const note = mode === "solve"
    ? tx(t, "figInv_noteS", "Drag b. Solving Ax = b means finding the recipe x: how many red column steps and how many green column steps reach b (dashed arrows). The blue lines are the square grid after A, so x is simply b's position counted in that warped grid, and A⁻¹ is the matrix that reads it off. Now make the columns parallel with the sliders (for example a = 1, b = 2, c = 0.5, d = 1): the determinant becomes 0, the grid collapses onto a line, there is no inverse, and a b off that line cannot be reached at all.")
    : tx(t, "figInv_noteE2", "Each row is one equation: the coefficients of x, y, z, then the right-hand side (amber). Press play, or ⏭ for one step. Every step does one of the moves that never change the solutions: add a multiple of one row to another, or multiply a row by a non-zero number. The highlighted row is the one that changed; the blue row is the one that was added. The first three steps clear everything below the diagonal; the rest clear above it and turn the diagonal into ones. When the left block reads like the identity matrix, the right column is the answer.");

  // ── Lab ──
  const solve = mode === "solve";
  const isX = (p: Pt) => !!x && Math.abs(x.x - p.x) < 1e-6 && Math.abs(x.y - p.y) < 1e-6;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figInvL1_t", "One of each"),
      body: <>
        <p>{tx(t, "figInvL1_b1", "x is the recipe: x₁ red steps, then x₂ green steps, landing on b.")}</p>
        <p>{tx(t, "figInvL1_b2", "Place b where one red step plus one green step lands.")}</p>
      </>,
      goal: { text: tx(t, "figInvL1_g", "x = (1, 1)."), done: solve && isX({ x: 1, y: 1 }) },
      hint: tx(t, "figInvL1_h", "Add the columns: (1.5, 0.5) + (0.5, 1) = (2, 1.5)."),
      setup: () => { pick("solve"); setAll([1.5, 0.5, 0.5, 1]); setTarget({ x: 3, y: 2 }); },
    },
    {
      title: tx(t, "figInvL2_t", "A step backwards"),
      body: <>
        <p>{tx(t, "figInvL2_b1", "Recipes can use negative amounts: a step against a column.")}</p>
        <p>{tx(t, "figInvL2_b2", "Place b so that x = (2, −1).")}</p>
      </>,
      goal: { text: tx(t, "figInvL2_g", "x = (2, −1)."), done: solve && isX({ x: 2, y: -1 }) },
      hint: tx(t, "figInvL2_h", "2 · (1.5, 0.5) − (0.5, 1) = (2.5, 0)."),
    },
    {
      title: tx(t, "figInvL3_t", "Quick check"),
      body: <p>{tx(t, "figInvL3_b", "For [ a  b ; c  d ] the inverse is 1/(ad − bc) · [ d  −b ; −c  a ].")}</p>,
      quiz: {
        q: tx(t, "figInvL3_q", "What is the inverse of [ 2  1 ; 1  1 ]?"),
        options: ["[ 1  −1 ; −1  2 ]", "[ 1  1 ; 1  2 ]", "[ ½  1 ; 1  1 ]", "[ 2  −1 ; −1  1 ]"],
        answer: 0,
        why: tx(t, "figInvL3_w", "det = 2 · 1 − 1 · 1 = 1. Swap the diagonal (2 and 1), negate the other two, divide by 1: [ 1  −1 ; −1  2 ]. Check: the product with the original gives [ 1  0 ; 0  1 ]."),
      },
    },
    {
      title: tx(t, "figInvL4_t", "No way back"),
      body: <>
        <p>{tx(t, "figInvL4_b1", "With the sliders, change the matrix so that the columns become parallel.")}</p>
        <p>{tx(t, "figInvL4_b2", "Watch the grid and the inverse.")}</p>
      </>,
      goal: { text: tx(t, "figInvL4_g", "det A = 0."), done: solve && Math.abs(dm) < 1e-9 },
      hint: tx(t, "figInvL4_h", "Make the second column twice the first: a = 1, c = 0.5, b = 2, d = 1."),
    },
    {
      title: tx(t, "figInvL5_t", "Elimination"),
      body: <>
        <p>{tx(t, "figInvL5_b1", "The same question with three unknowns, solved by row operations on the table of numbers.")}</p>
        <p>{tx(t, "figInvL5_b2", "Step through until the left block is the identity.")}</p>
      </>,
      goal: { text: tx(t, "figInvL5_g", "All 9 steps: x = 2, y = 3, z = −1."), done: !solve && step === LAST },
      focus: "step",
      setup: () => { pick("eliminate"); goTo(0); },
    },
    {
      title: tx(t, "figInvL6_t", "Quick check"),
      body: <p>{tx(t, "figInvL6_b", "Row operations must never change the solutions.")}</p>,
      quiz: {
        q: tx(t, "figInvL6_q", "Which of these is not allowed?"),
        options: [tx(t, "figInvL6_o1", "multiply a row by 0"), tx(t, "figInvL6_o2", "add 3 times row 1 to row 2"), tx(t, "figInvL6_o3", "multiply a row by −½"), tx(t, "figInvL6_o4", "swap two rows")],
        answer: 0,
        why: tx(t, "figInvL6_w", "Multiplying by 0 wipes out an equation: 0 = 0 says nothing, and the system loses information. Every other move can be undone, so it keeps the solutions."),
      },
    },
    {
      title: tx(t, "figInvL7_t", "Quick check"),
      body: <p>{tx(t, "figInvL7_b", "To undo putting on socks and then shoes, you take off the shoes first.")}</p>,
      quiz: {
        q: tx(t, "figInvL7_q", "What is (AB)⁻¹?"),
        options: ["B⁻¹A⁻¹", "A⁻¹B⁻¹", "1 / (AB)", "BA"],
        answer: 0,
        why: tx(t, "figInvL7_w", "AB applies B first, then A. Undoing it removes A first, then B: B⁻¹A⁻¹. Check: (AB)(B⁻¹A⁻¹) = A(BB⁻¹)A⁻¹ = AA⁻¹ = I."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "zero", tone: "warn", when: solve && Math.abs(dm) < 1e-9,
      title: tx(t, "figInvI1_t", "Nothing to undo with"),
      body: tx(t, "figInvI1_b", "The columns are parallel: every recipe lands on one line. A point off it cannot be reached, and a point on it can be reached in endless ways. Either way there is no single answer, so A has no inverse."),
    },
    {
      id: "thin", tone: "info", when: solve && Math.abs(dm) >= 1e-9 && Math.abs(dm) < 0.3,
      title: tx(t, "figInvI2_t", "Nearly flat"),
      body: fill(tx(t, "figInvI2_b", "det A = {d} is small, so A⁻¹ has the large factor 1/{d}. Small moves of b now change the recipe a lot: the system is close to having no answer."), { d: n2(dm) }),
    },
    {
      id: "id", tone: "info", when: solve && a === 1 && b === 0 && c === 0 && d === 1,
      title: tx(t, "figInvI3_t", "The identity"),
      body: tx(t, "figInvI3_b", "A = I leaves the grid square, so the recipe is b itself: x = b, and I⁻¹ = I."),
    },
    {
      id: "tri", tone: "info", when: !solve && step === 3,
      title: tx(t, "figInvI4_t", "Triangular"),
      body: tx(t, "figInvI4_b", "Everything below the diagonal is 0. The last row now reads −z = 1 on its own, so z = −1; back-substitution could finish from here, and the next steps do exactly that."),
    },
    {
      id: "done", tone: "ok", when: !solve && step === LAST,
      title: tx(t, "figInvI5_t", "Solved"),
      body: tx(t, "figInvI5_b", "The left block is the identity, so each row reads \"one unknown = a number\": x = 2, y = 3, z = −1. Check in the first equation: 2·2 + 3 − (−1) = 8."),
    },
  ];

  const title = tx(t, "figInv_title", "Undoing a matrix");
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
          tx(t, "figInvR1", "Solving Ax = b finds the recipe of column steps that lands on b; A⁻¹ reads it off."),
          tx(t, "figInvR2", "A⁻¹ = 1/(ad − bc) · [ d  −b ; −c  a ]; with det A = 0 there is none."),
          tx(t, "figInvR3", "Elimination uses moves that can be undone until the left block is I."),
          tx(t, "figInvR4", "(AB)⁻¹ = B⁻¹A⁻¹: undo in the reverse order."),
        ]}
      />
    </>
  );
}
