"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, fnPath, useDrag, clamp, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// secant — a draggable point P = (a, f(a)) and a second point Q a distance h
//          to the right (or left, for negative h). The amber line through both
//          is a secant; its slope is rise over run. Shrinking h turns it into
//          the purple tangent, whose slope is the derivative f′(a). On |x|
//          at a = 0 the left and right secants disagree: no derivative.
// graph  — top: f with its tangent at a. Bottom: the slope of that tangent
//          plotted as a new function, f′. Drag along the top and watch the
//          bottom curve being traced: rising parts of f give positive f′,
//          the tops and bottoms of f give f′ = 0.

type Mode = "secant" | "graph";
type Fn = {
  key: string; label: string; f: (x: number) => number; d: (x: number) => number;
  view: [number, number, number, number]; dview: [number, number]; dstep: number;
};

const W = 560;
const FNS: Fn[] = [
  { key: "sq", label: "x²", f: x => x * x, d: x => 2 * x, view: [-2.5, 2.5, -1.5, 5], dview: [-5.5, 5.5], dstep: 2 },
  { key: "cubic", label: "x³ − 3x", f: x => x ** 3 - 3 * x, d: x => 3 * x * x - 3, view: [-2.6, 2.6, -4, 4], dview: [-4, 8], dstep: 2 },
  { key: "sin", label: "sin x", f: Math.sin, d: Math.cos, view: [-4, 4, -1.8, 1.8], dview: [-1.5, 1.5], dstep: 1 },
  { key: "exp", label: "eˣ", f: Math.exp, d: Math.exp, view: [-3, 2, -1, 6], dview: [-1, 6], dstep: 1 },
  { key: "abs", label: "|x|", f: Math.abs, d: x => (x === 0 ? NaN : Math.sign(x)), view: [-2.5, 2.5, -1, 3], dview: [-1.8, 1.8], dstep: 1 },
];
const n3 = (v: number) => (Number.isFinite(v) ? f2(v, 3) : "—").replace("-", "−");

export function DerivativeFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("secant");
  const [key, setKey] = useState("sq");
  const [a, setA] = useState(1);
  const [h, setH] = useState(1);

  const fn = FNS.find(e => e.key === key)!;
  const [x0, x1, y0, y1] = fn.view;
  const HT = mode === "secant" ? 290 : 180, HB = 130;
  const pr = plot({ W, H: HT, x0, x1, y0, y1 });
  const pd = plot({ W, H: HB, x0, x1, y0: fn.dview[0], y1: fn.dview[1] });
  const H = mode === "secant" ? HT : HT + HB;
  const setX = (vx: number) => setA(+clamp(pr.inv({ x: vx, y: 0 }).x, x0 + 0.1, x1 - 0.1).toFixed(2));
  const drag = useDrag<"a">(p => { setX(p.x); return "a"; }, (_, p) => setX(p.x));

  const fa = fn.f(a), slope = fn.d(a);
  const line = (x: number, y: number, m: number, col: string, dash?: string, half = 99) =>
    <line x1={pr.X(x - half)} y1={pr.Y(y - m * half)} x2={pr.X(x + half)} y2={pr.Y(y + m * half)} stroke={col} strokeWidth={1.8} strokeDasharray={dash} />;
  const pick = <Row>{FNS.map(e => <Btn key={e.key} active={key === e.key} onClick={() => setKey(e.key)}>{e.label}</Btn>)}</Row>;

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "secant") {
    const tiny = Math.abs(h) < 0.005;
    const b = a + h, fb = fn.f(b), sec = (fb - fa) / h;    svg = <>
      <Grid p={pr} step={1} />
      <path d={fnPath(pr, fn.f)} fill="none" stroke={C.sky} strokeWidth={2.2} />
      {Number.isFinite(slope) && line(a, fa, slope, C.purple, "6 4")}
      {!tiny && <>
        {line(a, fa, sec, C.amber)}
        <line x1={pr.X(a)} y1={pr.Y(fa)} x2={pr.X(b)} y2={pr.Y(fa)} stroke={C.green} strokeWidth={1.6} strokeDasharray="3 3" />
        <line x1={pr.X(b)} y1={pr.Y(fa)} x2={pr.X(b)} y2={pr.Y(fb)} stroke={C.pink} strokeWidth={1.6} strokeDasharray="3 3" />
        <T x={(pr.X(a) + pr.X(b)) / 2} y={pr.Y(fa) + (fb >= fa ? 13 : -6)} color={C.green} anchor="middle" bold>h</T>
        <T x={pr.X(b) + (h > 0 && pr.X(b) < W - 110 ? 5 : -5)} y={(pr.Y(fa) + pr.Y(fb)) / 2 + 3} color={C.pink}
          anchor={h > 0 && pr.X(b) < W - 110 ? "start" : "end"} bold>{"f(a+h) − f(a)"}</T>
        <circle cx={pr.X(b)} cy={pr.Y(fb)} r={4.5} fill={C.amber} />
        <T x={pr.X(b) + 6} y={pr.Y(fb) - 7} color={C.amber} bold>Q</T>
      </>}
      <Handle x={pr.X(a)} y={pr.Y(fa)} color={C.sky} active={drag.dragging === "a"} />
      <T x={pr.X(a) - 8} y={pr.Y(fa) - 9} color={C.sky} anchor="end" bold>P</T>
    </>;
    controls = <>
      {pick}
      <Slider label={tx(t, "figDer_step", "step h")} value={h} min={-2} max={2} step={0.01} onChange={setH} width="w-16" />
      <Row>
        <Readout>{`a = ${n3(a)}`}</Readout>
        <Readout color={C.amber}>{tiny
          ? tx(t, "figDer_zero", "h = 0: rise/run is 0/0")
          : `${tx(t, "figDer_secant", "secant slope")} = (${n3(fb)} − ${n3(fa)}) / ${n3(h)} = ${n3(sec)}`}</Readout>
        <Readout color={C.purple}>{Number.isFinite(slope)
          ? `f′(a) = ${n3(slope)}`
          : tx(t, "figDer_corner", "corner: left slope −1, right slope +1, no f′(0)")}</Readout>
      </Row>
    </>;
    note = tx(t, "figDer_noteS", "Drag P along the curve and move the slider. The amber secant joins P to Q; its slope is the rise (pink) over the run h (green): an average rate of change. As h shrinks toward 0 from either side, Q slides into P and the secant swings onto the dashed purple tangent. The slope it settles on is the derivative f′(a). At h = 0 itself the formula is 0/0: the derivative is the limit, never the value at 0. On |x| at a = 0, positive and negative h give slopes +1 and −1, which never meet.");
  } else {
    const dCurve = fn.key === "abs"
      ? fnPath(pd, fn.d, x0, -1e-9) + fnPath(pd, fn.d, 1e-9, x1)
      : fnPath(pd, fn.d);
    const traced = fn.key === "abs" && a > 0
      ? fnPath(pd, fn.d, x0, -1e-9) + fnPath(pd, fn.d, 1e-9, a)
      : fnPath(pd, fn.d, x0, a);
    const sign = !Number.isFinite(slope) ? C.muted : slope > 0.01 ? C.green : slope < -0.01 ? C.red : C.amber;
    svg = <>
      <Grid p={pr} step={1} />
      <path d={fnPath(pr, fn.f)} fill="none" stroke={C.sky} strokeWidth={2.2} />
      {Number.isFinite(slope) && line(a, fa, slope, sign, undefined, 0.7)}
      <line x1={pr.X(a)} x2={pr.X(a)} y1={pr.Y(fa)} y2={HT + pd.Y(clamp(slope || 0, pd.y0, pd.y1))} stroke={C.muted} strokeDasharray="3 4" />
      <Handle x={pr.X(a)} y={pr.Y(fa)} color={C.sky} active={drag.dragging === "a"} />
      <T x={6} y={14} color={C.sky} bold>f(x)</T>
      <g transform={`translate(0 ${HT})`}>
        <rect x={0} y={0} width={W} height={HB} fill={C.bg} />
        <line x1={0} x2={W} y1={0} y2={0} stroke={C.axis} />
        <Grid p={pd} step={fn.dstep} />
        <path d={dCurve} fill="none" stroke={C.purple} strokeWidth={1.2} opacity={0.3} />
        <path d={traced} fill="none" stroke={C.purple} strokeWidth={2.4} />
        {Number.isFinite(slope) && <circle cx={pd.X(a)} cy={pd.Y(slope)} r={4.5} fill={sign} />}
        <T x={6} y={14} color={C.purple} bold>{`f′(x): ${tx(t, "figDer_slopeOf", "the slope of f")}`}</T>
      </g>
    </>;
    controls = <>
      {pick}
      <Row>
        <Readout>{`a = ${n3(a)}`}</Readout>
        <Readout color={C.sky}>{`f(a) = ${n3(fa)}`}</Readout>
        <Readout color={sign}>{Number.isFinite(slope) ? `f′(a) = ${n3(slope)}` : tx(t, "figDer_noD", "f′(0) does not exist")}</Readout>
        <Readout color={sign}>{!Number.isFinite(slope) ? tx(t, "figDer_cornerS", "corner")
          : slope > 0.01 ? tx(t, "figDer_up", "rising") : slope < -0.01 ? tx(t, "figDer_down", "falling") : tx(t, "figDer_flat", "flat")}</Readout>
      </Row>
    </>;
    note = tx(t, "figDer_noteG", "Drag anywhere to move a. The top curve is f with its tangent at a (green while f rises, red while it falls). The bottom curve records the tangent's slope at every x: that new function is the derivative f′. Where f climbs steeply, f′ is large; where f has a peak or a valley, f′ crosses zero. Look at the special cases: sin x produces cos x, and eˣ produces itself.");
  }

  return (
    <Figure
      title={tx(t, "figDer_title", "From secant to tangent")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["secant", tx(t, "figDer_mS", "secant → tangent")],
        ["graph", tx(t, "figDer_mG", "slope graph")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
