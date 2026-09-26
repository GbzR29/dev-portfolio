"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Handle, Vec, plot, Grid, useDrag, nearest, clamp, type Pt, type Plot } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// add      — complex numbers add like vectors: the parallelogram rule.
// multiply — z·w has length |z|·|w| and angle arg z + arg w: multiplying by w
//            scales by |w| and turns by arg w.
// powers   — 1, z, z², z³, … : each step turns by arg z and scales by |z|, so
//            the points spiral out (|z| > 1), in (|z| < 1) or go round (|z| = 1).
// roots    — the n solutions of zⁿ = 1 sit evenly round the unit circle, one
//            n-th of a turn apart.

type Mode = "add" | "multiply" | "powers" | "roots";
const W = 560, H = 300;
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
const cmul = (a: Pt, b: Pt): Pt => ({ x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x });
const n2 = (v: number) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2).replace("-", "−");
const deg = (p: Pt) => (Math.atan2(p.y, p.x) * 180) / Math.PI;
const cstr = (p: Pt) => `${n2(p.x)} ${p.y < -5e-3 ? "−" : "+"} ${n2(Math.abs(p.y))}i`;

export function ComplexFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("multiply");
  const [z, setZ] = useState<Pt>({ x: 1.5, y: 0.5 });
  const [w, setW] = useState<Pt>({ x: 0.5, y: 1 });
  const [zp, setZp] = useState<Pt>({ x: 0.9, y: 0.4 });      // powers get their own z, near the unit circle
  const [n, setN] = useState(6);

  const zoomed = mode === "powers" || mode === "roots";
  const pr = zoomed ? plot({ W, H, x0: -2.8, x1: 2.8, y0: -1.5, y1: 1.5 }) : plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
  const drag = useDrag<"z" | "w">(
    q => (mode === "roots" ? null : mode === "powers" ? nearest<"z" | "w">(q, [["z", S(pr, zp)]], 22) : nearest<"z" | "w">(q, [["z", S(pr, z)], ["w", S(pr, w)]], 18)),
    (id, q) => {
      const p = pr.inv(q);
      if (mode === "powers") { setZp({ x: clamp(Math.round(p.x * 50) / 50, -1.4, 1.4), y: clamp(Math.round(p.y * 50) / 50, -1.4, 1.4) }); return; }
      const s = { x: clamp(Math.round(p.x * 20) / 20, -5.3, 5.3), y: clamp(Math.round(p.y * 20) / 20, -2.8, 2.8) };
      (id === "z" ? setZ : setW)(s);
    });

  const O = S(pr, { x: 0, y: 0 });
  const arc = (r: number, a0: number, a1: number, col: string) => {
    const A0 = (a0 * Math.PI) / 180, A1 = (a1 * Math.PI) / 180;
    return <path d={`M${pr.X(r * Math.cos(A0))},${pr.Y(r * Math.sin(A0))} A${r * pr.sx},${r * pr.sy} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${pr.X(r * Math.cos(A1))},${pr.Y(r * Math.sin(A1))}`} fill="none" stroke={col} strokeWidth={1.8} />;
  };
  const dot = (p: Pt, col: string, label: string, dy = -8) => <>
    <circle cx={pr.X(p.x)} cy={pr.Y(p.y)} r={5} fill={col} />
    <T x={pr.X(p.x) + 8} y={pr.Y(p.y) + dy} size={10.5} color={col} bold>{label}</T>
  </>;
  const handles = (both: boolean, zz = z) => <>
    <Handle x={pr.X(zz.x)} y={pr.Y(zz.y)} color={C.sky} active={drag.dragging === "z"} />
    <T x={pr.X(zz.x) + 10} y={pr.Y(zz.y) + 15} size={10.5} color={C.sky} bold>z</T>
    {both && <>
      <Handle x={pr.X(w.x)} y={pr.Y(w.y)} color={C.pink} active={drag.dragging === "w"} />
      <T x={pr.X(w.x) + 10} y={pr.Y(w.y) + 15} size={10.5} color={C.pink} bold>w</T>
    </>}
  </>;
  const axisNames = <>
    <T x={W - 6} y={pr.Y(0) - 5} size={9} anchor="end" color={C.muted}>{tx(t, "figCx_re", "real")}</T>
    <T x={pr.X(0) + 5} y={11} size={9} color={C.muted}>{tx(t, "figCx_im", "imaginary")}</T>
  </>;

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "add") {
    const s = { x: z.x + w.x, y: z.y + w.y };
    svg = <>
      <Grid p={pr} step={1} />{axisNames}
      <Vec a={O} b={S(pr, z)} color={C.sky} w={2.4} />
      <Vec a={O} b={S(pr, w)} color={C.pink} w={2.4} />
      <Vec a={S(pr, z)} b={S(pr, s)} color={C.pink} w={1.4} dash="4 3" />
      <Vec a={S(pr, w)} b={S(pr, s)} color={C.sky} w={1.4} dash="4 3" />
      <Vec a={O} b={S(pr, s)} color={C.amber} w={3} />
      {dot(s, C.amber, "z + w")}
      {handles(true)}
    </>;
    controls = <Row>
      <Readout color={C.sky}>{`z = ${cstr(z)}`}</Readout>
      <Readout color={C.pink}>{`w = ${cstr(w)}`}</Readout>
      <Readout color={C.amber}>{`z + w = (${n2(z.x)} + ${n2(w.x)}) + (${n2(z.y)} + ${n2(w.y)})i = ${cstr(s)}`}</Readout>
    </Row>;
    note = tx(t, "figCx_noteA", "Drag z and w. A complex number a + bi is the point (a, b): a steps along the real axis, b along the imaginary axis. Adding adds the real parts and the imaginary parts separately, which is exactly vector addition: walk along z, then along w (dashed), and you reach z + w.");
  } else if (mode === "multiply") {
    const p = cmul(z, w);
    const az = deg(z), aw = deg(w);
    svg = <>
      <Grid p={pr} step={1} />{axisNames}
      <circle cx={O.x} cy={O.y} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      {arc(0.45, 0, az, C.sky)}
      {arc(0.7, az, az + aw, C.pink)}
      <Vec a={O} b={S(pr, z)} color={C.sky} w={2.4} />
      <Vec a={O} b={S(pr, w)} color={C.pink} w={2.4} />
      <Vec a={O} b={S(pr, p)} color={C.amber} w={3} />
      {dot(p, C.amber, "z·w")}
      {handles(true)}
    </>;
    controls = <>
      <Row>
        <Readout color={C.sky}>{`z = ${cstr(z)}  |z| = ${n2(Math.hypot(z.x, z.y))}  arg = ${Math.round(az)}°`}</Readout>
        <Readout color={C.pink}>{`w = ${cstr(w)}  |w| = ${n2(Math.hypot(w.x, w.y))}  arg = ${Math.round(aw)}°`}</Readout>
      </Row>
      <Row>
        <Readout color={C.amber}>{`z·w = (${n2(z.x)}·${n2(w.x)} − ${n2(z.y)}·${n2(w.y)}) + (${n2(z.x)}·${n2(w.y)} + ${n2(z.y)}·${n2(w.x)})i = ${cstr(p)}`}</Readout>
        <Readout color={C.amber}>{`|z·w| = ${n2(Math.hypot(p.x, p.y))} = |z|·|w|   arg = ${Math.round(deg(p))}°`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCx_noteM", "Drag z and w. The product's length is the two lengths multiplied, and its angle is the two angles added (blue arc, then pink arc). So multiplying by w is \"scale by |w| and turn by arg w\". Put w on the dashed unit circle and multiplication becomes a pure rotation; put w at i (0, 1) and every z turns a quarter turn, the (x, y) → (−y, x) rule.");
  } else if (mode === "powers") {
    const pts: Pt[] = [{ x: 1, y: 0 }];
    for (let k = 1; k <= 24; k++) pts.push(cmul(pts[k - 1], zp));
    const r = Math.hypot(zp.x, zp.y);
    svg = <>
      <Grid p={pr} step={0.5} labels={false} />{axisNames}
      <circle cx={O.x} cy={O.y} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <polyline points={pts.map(q => `${pr.X(q.x).toFixed(1)},${pr.Y(q.y).toFixed(1)}`).join(" ")} fill="none" stroke={C.amber} strokeWidth={1.4} opacity={0.7} />
      {pts.map((q, k) => Math.abs(q.x) < 3 && Math.abs(q.y) < 1.6 && <g key={k}>
        <circle cx={pr.X(q.x)} cy={pr.Y(q.y)} r={k === 0 ? 4 : 3.5} fill={k === 0 ? C.fg : C.amber} />
        {k <= 6 && <T x={pr.X(q.x) + 6} y={pr.Y(q.y) - 5} size={9.5} color={C.amber}>{k === 0 ? "1" : k === 1 ? "" : `z${"⁰¹²³⁴⁵⁶"[k]}`}</T>}
      </g>)}
      {handles(false, zp)}
    </>;
    controls = <Row>
      <Readout color={C.sky}>{`z = ${cstr(zp)}`}</Readout>
      <Readout color={C.sky}>{`|z| = ${n2(r)}   arg z = ${Math.round(deg(zp))}°`}</Readout>
      <Readout color={C.amber}>{`z⁶ = ${cstr(pts[6])}  (|z|⁶ = ${n2(r ** 6)}, 6·arg = ${Math.round(6 * deg(zp))}°)`}</Readout>
    </Row>;
    note = tx(t, "figCx_noteP", "Drag z. The dots are 1, z, z², z³, …: each is the previous one multiplied by z, so each step turns by the same angle and scales by the same factor |z|. Outside the unit circle the points spiral outward, inside they spiral in to 0, and exactly on it they walk round the circle forever. That is De Moivre's rule: zⁿ has length |z|ⁿ and angle n·arg z.");
  } else {
    const roots = Array.from({ length: n }, (_, k) => ({ x: Math.cos((2 * Math.PI * k) / n), y: Math.sin((2 * Math.PI * k) / n) }));
    svg = <>
      <Grid p={pr} step={0.5} labels={false} />
      <circle cx={pr.X(0)} cy={pr.Y(0)} r={pr.sx} fill="none" stroke={C.muted} strokeWidth={1.2} />
      <polygon points={roots.map(q => `${pr.X(q.x).toFixed(1)},${pr.Y(q.y).toFixed(1)}`).join(" ")} fill={C.amber} fillOpacity={0.1} stroke={C.amber} strokeWidth={1.4} />
      {roots.map((q, k) => <g key={k}>
        <line x1={pr.X(0)} y1={pr.Y(0)} x2={pr.X(q.x)} y2={pr.Y(q.y)} stroke={k === 1 ? C.pink : C.muted} strokeWidth={k === 1 ? 2 : 0.8} />
        <circle cx={pr.X(q.x)} cy={pr.Y(q.y)} r={5} fill={k === 0 ? C.fg : k === 1 ? C.pink : C.amber} />
        <T x={pr.X(q.x * 1.16)} y={pr.Y(q.y * 1.16) + 4} size={9.5} anchor="middle" color={k === 1 ? C.pink : C.muted}>{k === 0 ? "1" : k === 1 ? "ω" : `ω${"⁰¹²³⁴⁵⁶⁷⁸⁹"[k] ?? ""}`}</T>
      </g>)}
    </>;
    controls = <>
      <Slider label="n" value={n} min={2} max={9} step={1} onChange={setN} fmt={v => `${v}`} width="w-4" />
      <Row>
        <Readout color={C.pink}>{`ω = cos(360°/${n}) + i·sin(360°/${n}) = ${cstr(roots[1])}`}</Readout>
        <Readout>{`ω${"⁰¹²³⁴⁵⁶⁷⁸⁹"[n]} = 1`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCx_noteR", "The equation zⁿ = 1 has n complex solutions, the n-th roots of unity. They sit on the unit circle a 1/n turn apart and form a regular n-gon. The pink one, ω, turns by 360°/n; its powers ω, ω², ω³, … visit every corner and ωⁿ is back at 1. For n = 2 the roots are 1 and −1; for n = 4 they are 1, i, −1 and −i.");
  }

  return (
    <Figure
      title={tx(t, "figCx_title", "The complex plane")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["add", tx(t, "figCx_mAdd", "add")],
        ["multiply", tx(t, "figCx_mMul", "multiply")],
        ["powers", tx(t, "figCx_mPow", "powers")],
        ["roots", tx(t, "figCx_mRoots", "roots of 1")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
