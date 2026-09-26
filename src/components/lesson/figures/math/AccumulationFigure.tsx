"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, fnPath, useDrag, clamp, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// accumulate — top: f(t) with the signed area from a to x shaded. Bottom:
//              that area as a function of x, the accumulation function A(x).
//              Drag x: A grows fastest where f is tall, stalls where f = 0 and
//              falls where f < 0. The slope of A at x (its tangent) always
//              equals the height f(x): the fundamental theorem of calculus.
// family     — every antiderivative of f differs by a constant: F(x) + C.
//              The curves are vertical copies of each other, so at any x they
//              all have the same slope f(x). The constant is fixed by one
//              known value, such as a starting position.

type Mode = "accumulate" | "family";
type Fn = { key: string; label: string; f: (x: number) => number; F: (x: number) => number; Flabel: string; view: [number, number, number, number]; Aview: [number, number] };

const W = 560, HT = 160, HB = 140;
const FNS: Fn[] = [
  { key: "const", label: "f(t) = 1", f: () => 1, F: x => x, Flabel: "x", view: [-0.3, 4.3, -1.3, 1.6], Aview: [-0.8, 4.3] },
  { key: "lin", label: "f(t) = t", f: x => x, F: x => (x * x) / 2, Flabel: "x²/2", view: [-0.3, 4.3, -0.8, 4.5], Aview: [-1, 8.5] },
  { key: "cos", label: "f(t) = cos t", f: Math.cos, F: Math.sin, Flabel: "sin x", view: [-0.3, 6.6, -1.4, 1.4], Aview: [-1.4, 1.4] },
  { key: "quad", label: "f(t) = t² − 1", f: x => x * x - 1, F: x => (x ** 3) / 3 - x, Flabel: "x³/3 − x", view: [-0.3, 2.6, -1.4, 5.5], Aview: [-1, 3] },
];
const n3 = (v: number) => f2(v, 3).replace("-", "−");

export function AccumulationFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("accumulate");
  const [key, setKey] = useState("cos");
  const [x, setX] = useState(1.2);
  const [c, setC] = useState(0);

  const fn = FNS.find(e => e.key === key)!;
  const [x0, x1, y0, y1] = fn.view;
  const a = 0;
  const pt = plot({ W, H: HT, x0, x1, y0, y1 });
  const pb = plot({ W, H: HB, x0, x1, y0: fn.Aview[0] - (mode === "family" ? 2 : 0), y1: fn.Aview[1] + (mode === "family" ? 2 : 0) });
  const move = (vx: number) => setX(+clamp(pt.inv({ x: vx, y: 0 }).x, a, x1 - 0.1).toFixed(2));
  const drag = useDrag<"x">(p => { move(p.x); return "x"; }, (_, p) => move(p.x));

  const A = (s: number) => fn.F(s) - fn.F(a);
  const fx = fn.f(x), Ax = A(x);
  const area = (lo: number, hi: number, pos: boolean) => {
    // the region between the curve and the axis, clipped to one sign
    const N = 120, pts: string[] = [`${pt.X(lo)},${pt.Y(0)}`];
    for (let i = 0; i <= N; i++) {
      const s = lo + ((hi - lo) * i) / N, v = fn.f(s);
      pts.push(`${pt.X(s)},${pt.Y(pos ? Math.max(v, 0) : Math.min(v, 0))}`);
    }
    pts.push(`${pt.X(hi)},${pt.Y(0)}`);
    return pts.join(" ");
  };
  const top = <>
    <Grid p={pt} step={1} />
    {mode === "accumulate" && x > a && <>
      <polygon points={area(a, x, true)} fill={C.sky} fillOpacity={0.3} />
      <polygon points={area(a, x, false)} fill={C.red} fillOpacity={0.3} />
    </>}
    <path d={fnPath(pt, fn.f)} fill="none" stroke={C.fg} strokeWidth={2} />
    <line x1={pt.X(x)} x2={pt.X(x)} y1={pt.Y(0)} y2={pt.Y(fx)} stroke={C.amber} strokeWidth={2.5} />
    <Handle x={pt.X(x)} y={pt.Y(fx)} color={C.amber} active={drag.dragging === "x"} />
    <T x={6} y={14} color={C.fg} bold>{fn.label}</T>
  </>;

  let bottom: React.ReactNode, controls: React.ReactNode, note: string;
  const tangent = (y: number) =>
    <line x1={pb.X(x - 0.7)} y1={pb.Y(y - 0.7 * fx)} x2={pb.X(x + 0.7)} y2={pb.Y(y + 0.7 * fx)} stroke={C.amber} strokeWidth={1.8} />;

  if (mode === "accumulate") {
    bottom = <>
      <Grid p={pb} step={1} />
      <path d={fnPath(pb, A, x0, x1)} fill="none" stroke={C.purple} strokeWidth={1.2} opacity={0.3} />
      <path d={fnPath(pb, A, a, x)} fill="none" stroke={C.purple} strokeWidth={2.4} />
      {tangent(Ax)}
      <circle cx={pb.X(x)} cy={pb.Y(Ax)} r={4.5} fill={C.purple} />
      <T x={6} y={14} color={C.purple} bold>{`A(x): ${tx(t, "figAcc_areaSoFar", "the area from 0 to x")}`}</T>
    </>;
    controls = <>
      <Row>{FNS.map(e => <Btn key={e.key} active={key === e.key} onClick={() => setKey(e.key)}>{e.label}</Btn>)}</Row>
      <Row>
        <Readout>{`x = ${n3(x)}`}</Readout>
        <Readout color={C.purple}>{`A(x) = ${n3(Ax)}`}</Readout>
        <Readout color={C.amber}>{`${tx(t, "figAcc_slopeA", "slope of A at x")} = ${n3(fx)}`}</Readout>
        <Readout color={C.fg}>{`f(x) = ${n3(fx)}`}</Readout>
        <Readout color={C.green}>{`F(x) − F(0) = ${fn.Flabel.replace(/x/g, n3(x))} − ${n3(fn.F(a))} = ${n3(Ax)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figAcc_noteA", "Drag anywhere to move x. The shaded region is the area under f from 0 to x (red parts count negative), and the bottom curve records it: A(x). Watch the amber pieces: the height of f at x (top) always equals the slope of A at x (bottom). Where f is big, the area grows fast; where f = 0, it momentarily stops growing (A has a flat tangent); where f < 0, the area shrinks. The green readout gets the same number without adding any strips: an antiderivative F evaluated at the two ends.");
  } else {
    const Cs = [-2, -1, 0, 1, 2];
    bottom = <>
      <Grid p={pb} step={1} />
      {Cs.map(k => <path key={k} d={fnPath(pb, s => fn.F(s) + k)} fill="none" stroke={C.purple} strokeWidth={1.1} opacity={0.3} />)}
      <path d={fnPath(pb, s => fn.F(s) + c)} fill="none" stroke={C.purple} strokeWidth={2.4} />
      {Cs.map(k => <g key={k} opacity={0.5}>{tangent(fn.F(x) + k)}</g>)}
      {tangent(fn.F(x) + c)}
      <circle cx={pb.X(x)} cy={pb.Y(fn.F(x) + c)} r={4.5} fill={C.purple} />
      <T x={6} y={14} color={C.purple} bold>{`F(x) + C = ${fn.Flabel} + C`}</T>
    </>;
    controls = <>
      <Row>{FNS.map(e => <Btn key={e.key} active={key === e.key} onClick={() => setKey(e.key)}>{e.label}</Btn>)}</Row>
      <Slider label={tx(t, "figAcc_const", "constant C")} value={c} min={-2} max={2} step={0.1} onChange={setC} width="w-20" />
      <Row>
        <Readout color={C.purple}>{`F(0) + C = ${n3(fn.F(0) + c)}`}</Readout>
        <Readout color={C.amber}>{`${tx(t, "figAcc_slopeAll", "slope of every curve at x")} = f(x) = ${n3(fx)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figAcc_noteF", "The bottom curves are F(x) + C for several constants C: the same curve slid up or down. Sliding does not change steepness, so at any x all of them have the same tangent slope f(x) (the parallel amber pieces). Knowing only f therefore fixes F up to that shift. One extra fact pins it down: if you know the value at x = 0 (a starting position, say), the slider C is set by it.");
  }

  return (
    <Figure
      title={tx(t, "figAcc_title", "Area that accumulates")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["accumulate", tx(t, "figAcc_mA", "accumulate")],
        ["family", tx(t, "figAcc_mF", "plus C")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${HT + HB}`} className="w-full h-auto">
        {top}
        <g transform={`translate(0 ${HT})`}>
          <rect x={0} y={0} width={W} height={HB} fill={C.bg} />
          <line x1={0} x2={W} y1={0} y2={0} stroke={C.axis} />
          {bottom}
        </g>
      </svg>
    </Figure>
  );
}
