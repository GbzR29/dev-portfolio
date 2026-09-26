"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, Slider, Sliders, C, T, Handle, Vec, plot, Grid, useDrag, clamp, type Pt, type Plot } from "@/components/lesson/kit/figure";
import { type M2, apply, det, inverse, n2 } from "./mat2";

// ── What this figure shows ────────────────────────────────────────────────────
// solve     — Ax = b asks: which recipe x (how many steps along each column)
//             lands on b? Drag b; x = A⁻¹b is read off the warped grid, and
//             the two column steps are drawn. When det A = 0 the columns are
//             parallel, the grid collapses and most b cannot be reached.
// eliminate — Gauss–Jordan elimination on a 3 × 3 system, one row operation
//             per step, until the left block is the identity and the right
//             column is the solution.

type Mode = "solve" | "eliminate";
const W = 560, H = 300;
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });

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

const fmt = (v: number) => { const r = Math.round(v * 100) / 100; return (Object.is(r, -0) ? 0 : r).toString().replace("-", "−"); };
const opText = (op: Op) => op.kind === "add"
  ? `R${op.to + 1} ← R${op.to + 1} ${op.k < 0 ? "−" : "+"} ${fmt(Math.abs(op.k))}·R${op.from + 1}`
  : `R${op.row + 1} ← ${fmt(op.k)}·R${op.row + 1}`;

export function InverseFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("solve");
  const [a, setA] = useState(1.5), [b, setB] = useState(0.5), [c, setC] = useState(0.5), [d, setD] = useState(1);
  const [target, setTarget] = useState<Pt>({ x: 3, y: 2 });
  const [step, setStep] = useState(0);

  const pr = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
  const drag = useDrag<"b">(
    () => (mode === "solve" ? "b" : null),
    (_, q) => { const w = pr.inv(q); setTarget({ x: clamp(Math.round(w.x * 4) / 4, -5, 5), y: clamp(Math.round(w.y * 4) / 4, -2.75, 2.75) }); });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "solve") {
    const m: M2 = [a, b, c, d];
    const dm = det(m), inv = inverse(m);
    const x = inv ? apply(inv, target) : null;
    const i1 = { x: a, y: c }, j1 = { x: b, y: d };
    const lines: React.ReactNode[] = [];
    if (Math.abs(dm) > 0.05) for (let k = -10; k <= 10; k++) {
      const p1 = apply(m, { x: k, y: -10 }), p2 = apply(m, { x: k, y: 10 });
      const q1 = apply(m, { x: -10, y: k }), q2 = apply(m, { x: 10, y: k });
      lines.push(<line key={`v${k}`} x1={pr.X(p1.x)} y1={pr.Y(p1.y)} x2={pr.X(p2.x)} y2={pr.Y(p2.y)} stroke={C.sky} strokeWidth={0.7} opacity={0.4} />);
      lines.push(<line key={`h${k}`} x1={pr.X(q1.x)} y1={pr.Y(q1.y)} x2={pr.X(q2.x)} y2={pr.Y(q2.y)} stroke={C.sky} strokeWidth={0.7} opacity={0.4} />);
    }
    const mid = x ? { x: x.x * i1.x, y: x.x * i1.y } : null;
    svg = <>
      <Grid p={pr} step={1} />
      <g pointerEvents="none">{lines}</g>
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, i1)} color={C.red} w={3} />
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, j1)} color={C.green} w={3} />
      {x && mid && <>
        <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, mid)} color={C.red} w={1.6} dash="4 3" />
        <Vec a={S(pr, mid)} b={S(pr, target)} color={C.green} w={1.6} dash="4 3" />
      </>}
      <Handle x={pr.X(target.x)} y={pr.Y(target.y)} color={C.amber} active={drag.dragging === "b"} />
      <T x={pr.X(target.x) + 10} y={pr.Y(target.y) - 8} size={10.5} color={C.amber} bold>{`b = (${n2(target.x)}, ${n2(target.y)})`}</T>
    </>;
    controls = <>
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
    </>;
    note = tx(t, "figInv_noteS", "Drag b. Solving Ax = b means finding the recipe x: how many red column steps and how many green column steps reach b (dashed arrows). The blue lines are the square grid after A, so x is simply b's position counted in that warped grid, and A⁻¹ is the matrix that reads it off. Now make the columns parallel with the sliders (for example a = 1, b = 2, c = 0.5, d = 1): the determinant becomes 0, the grid collapses onto a line, there is no inverse, and a b off that line cannot be reached at all.");
  } else {
    const cur = STATES[step], prev = step > 0 ? OPS[step - 1] : null;
    const hot = prev ? (prev.kind === "add" ? prev.to : prev.row) : -1;
    const src = prev && prev.kind === "add" ? prev.from : -1;
    const cellW = 74, x0 = W / 2 - cellW * 2, y0 = 70, rowH = 52;
    svg = <>
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
      {step === OPS.length && <T x={W / 2} y={H - 10} size={11} anchor="middle" color={C.green} bold>x = 2, y = 3, z = −1</T>}
    </>;
    controls = <Row>
      <Btn onClick={() => setStep(0)}>{tx(t, "figInv_reset", "reset")}</Btn>
      <Btn onClick={() => setStep(s => Math.max(0, s - 1))}>{tx(t, "figInv_back", "◀ back")}</Btn>
      <Btn active onClick={() => setStep(s => Math.min(OPS.length, s + 1))}>{tx(t, "figInv_next", "next step ▶")}</Btn>
      <Readout>{`${step} / ${OPS.length}`}</Readout>
      <Readout color={C.muted}>{step <= 3 ? tx(t, "figInv_phase1", "forward: zeros below the diagonal") : tx(t, "figInv_phase2", "backward: zeros above, ones on the diagonal")}</Readout>
    </Row>;
    note = tx(t, "figInv_noteE", "Each row is one equation: the coefficients of x, y, z, then the right-hand side (amber). Every step does one of the moves that never change the solutions: add a multiple of one row to another, or multiply a row by a non-zero number. The highlighted row is the one that changed; the blue row is the one that was added. The first three steps clear everything below the diagonal; the rest clear above it and turn the diagonal into ones. When the left block reads like the identity matrix, the right column is the answer.");
  }

  return (
    <Figure
      title={tx(t, "figInv_title", "Undoing a matrix")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["solve", tx(t, "figInv_mSolve", "solve Ax = b")],
        ["eliminate", tx(t, "figInv_mElim", "elimination")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
