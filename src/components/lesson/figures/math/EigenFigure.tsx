"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, C, T, Handle, Vec, plot, Grid, useDrag, type Pt, type Plot } from "@/components/lesson/kit/figure";
import { type M2, apply, det, eigen, eigvec, rot, n2 } from "./mat2";

// ── What this figure shows ────────────────────────────────────────────────────
// hunt    — a unit vector v (drag it round the circle) and its image Av.
//           Most directions get turned; along an eigenvector Av is parallel
//           to v, and the stretch factor is the eigenvalue λ. The dashed
//           lines are the eigen-directions found from det(A − λI) = 0; the
//           ellipse is where the whole unit circle goes.
// iterate — power iteration: apply A again and again (rescaling to length 1
//           each time). The vector swings round to the eigenvector with the
//           largest |λ|. A rotation has no real eigenvector, so it never
//           settles.

type Mode = "hunt" | "iterate";
const W = 560, H = 300;
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
const MATS: [string, string, M2][] = [
  ["sym", "symmetric", [1.5, 0.5, 0.5, 1]],
  ["gen", "general", [1.25, 0.75, 0.25, 0.75]],
  ["shear", "shear", [1, 0.75, 0, 1]],
  ["flip", "mirror", [0, 1, 1, 0]],
  ["rot", "rotation", rot(40)],
];

export function EigenFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("hunt");
  const [mk, setMk] = useState("sym");
  const [phi, setPhi] = useState(100);
  const [trail, setTrail] = useState<Pt[]>([{ x: -0.2, y: 1 }]);

  const m = MATS.find(e => e[0] === mk)![2];
  const pr = plot({ W, H, x0: -3.73, x1: 3.73, y0: -2, y1: 2 });
  const v = { x: Math.cos((phi * Math.PI) / 180), y: Math.sin((phi * Math.PI) / 180) };
  const drag = useDrag<"v">(
    () => (mode === "hunt" ? "v" : null),
    (_, q) => { const w = pr.inv(q); setPhi(Math.round((Math.atan2(w.y, w.x) * 180) / Math.PI)); });

  const ev = eigen(m);
  const dirs = ev.real ? [eigvec(m, ev.l1), eigvec(m, ev.l2)] : [];
  const eigLine = (e: Pt, col: string, k: number) =>
    <line key={k} x1={pr.X(-4 * e.x)} y1={pr.Y(-4 * e.y)} x2={pr.X(4 * e.x)} y2={pr.Y(4 * e.y)} stroke={col} strokeWidth={1.2} strokeDasharray="6 4" opacity={0.8} />;
  const ellipse = Array.from({ length: 73 }, (_, k) => apply(m, { x: Math.cos(k * Math.PI / 36), y: Math.sin(k * Math.PI / 36) }))
    .map((q, k) => `${k ? "L" : "M"}${pr.X(q.x).toFixed(1)},${pr.Y(q.y).toFixed(1)}`).join("");
  const eigText = ev.real
    ? `λ₁ = ${n2(ev.l1)}   λ₂ = ${n2(ev.l2)}`
    : `λ = ${n2(ev.re)} ± ${n2(ev.im)}i  (${tx(t, "figEig_complex", "no real eigenvector")})`;

  const matButtons = <Row>{MATS.map(([k, label]) =>
    <Btn key={k} active={mk === k} onClick={() => { setMk(k); setTrail([{ x: -0.2, y: 1 }]); }}>{tx(t, `figEig_m_${k}`, label)}</Btn>)}</Row>;

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "hunt") {
    const Av = apply(m, v);
    const cr = v.x * Av.y - v.y * Av.x, lam = v.x * Av.x + v.y * Av.y;
    const aligned = Math.abs(cr) < 0.04 && Math.hypot(Av.x, Av.y) > 1e-6;
    svg = <>
      <Grid p={pr} step={1} />
      {dirs.map((e, k) => eigLine(e, C.purple, k))}
      <circle cx={pr.X(0)} cy={pr.Y(0)} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <path d={ellipse} fill={C.amber} fillOpacity={0.08} stroke={C.amber} strokeWidth={1.2} />
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, Av)} color={aligned ? C.green : C.amber} w={3} />
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, v)} color={C.sky} w={2.4} />
      <Handle x={pr.X(v.x)} y={pr.Y(v.y)} color={C.sky} active={drag.dragging === "v"} />
      <T x={pr.X(v.x) + 10} y={pr.Y(v.y) + 14} size={10.5} color={C.sky} bold>v</T>
      <T x={pr.X(Av.x) + 8} y={pr.Y(Av.y) - 6} size={10.5} color={aligned ? C.green : C.amber} bold>Av</T>
    </>;
    controls = <>
      {matButtons}
      <Row>
        <Readout>{`A = [ ${n2(m[0])}  ${n2(m[1])} ; ${n2(m[2])}  ${n2(m[3])} ]`}</Readout>
        <Readout>{`v = (${n2(v.x)}, ${n2(v.y)})`}</Readout>
        <Readout color={aligned ? C.green : C.amber}>{`Av = (${n2(Av.x)}, ${n2(Av.y)})`}</Readout>
        <Readout color={aligned ? C.green : C.muted}>{aligned
          ? `${tx(t, "figEig_found", "eigenvector!")}  Av = ${n2(lam)}·v`
          : tx(t, "figEig_turned", "Av points elsewhere")}</Readout>
      </Row>
      <Row>
        <Readout color={C.purple}>{`tr = ${n2(m[0] + m[3])}   det = ${n2(det(m))}`}</Readout>
        <Readout color={C.purple}>{eigText}</Readout>
      </Row>
    </>;
    note = tx(t, "figEig_noteH", "Drag v round the dashed unit circle and watch Av. For most directions the matrix turns v as well as stretching it. Only along the dashed purple lines does Av stay on v's own line; there Av turns green and the readout shows the stretch factor λ, the eigenvalue. A negative λ means Av points the opposite way along the same line. The amber ellipse is where the whole unit circle lands. Try the rotation: no direction survives, and the eigenvalues come out as complex numbers.");
  } else {
    const last = trail[trail.length - 1];
    const next = () => {
      const q = apply(m, last), l = Math.hypot(q.x, q.y) || 1;
      setTrail(tr => [...tr.slice(-24), { x: q.x / l, y: q.y / l }]);
    };
    svg = <>
      <Grid p={pr} step={1} />
      {dirs.map((e, k) => eigLine(e, k === 0 ? C.purple : C.muted, k))}
      <circle cx={pr.X(0)} cy={pr.Y(0)} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      {trail.map((q, k) => k < trail.length - 1 &&
        <Vec key={k} a={S(pr, { x: 0, y: 0 })} b={S(pr, q)} color={C.sky} w={1.4} opacity={0.15 + 0.6 * (k / trail.length)} />)}
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, last)} color={C.amber} w={3} />
    </>;
    controls = <>
      {matButtons}
      <Row>
        <Btn active onClick={next}>{tx(t, "figEig_apply", "apply A")}</Btn>
        <Btn onClick={() => setTrail([{ x: -0.2, y: 1 }])}>{tx(t, "figEig_reset", "reset")}</Btn>
        <Readout>{`${tx(t, "figEig_steps", "steps")}: ${trail.length - 1}`}</Readout>
        <Readout color={C.amber}>{`v = (${n2(last.x)}, ${n2(last.y)})`}</Readout>
        <Readout color={C.purple}>{eigText}</Readout>
      </Row>
    </>;
    note = tx(t, "figEig_noteI", "Press \"apply A\" repeatedly. Each press multiplies the vector by A and rescales it to length 1 (older positions fade). The part of the vector along the eigenvector with the biggest |λ| grows fastest, so after a few presses the vector lines up with the purple line. That is power iteration, the simplest way to find a dominant eigenvector. With the rotation it circles forever, and with the mirror (λ = 1 and −1, equal sizes) it flips back and forth without settling.");
  }

  return (
    <Figure
      title={tx(t, "figEig_title", "Directions a matrix only stretches")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["hunt", tx(t, "figEig_mHunt", "find them")],
        ["iterate", tx(t, "figEig_mIter", "power iteration")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
