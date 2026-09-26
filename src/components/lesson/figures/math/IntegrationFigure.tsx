"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, plot, Grid, fnPath, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Parts: a rising curve y = g(x) from x = a to x = b. The area under it (blue)
// is ∫ y dx; the area between it and the y-axis (amber) is ∫ x dy. Together
// with the small corner rectangle a·g(a) they fill the big rectangle b·g(b),
// which is integration by parts: ∫ y dx = [xy] − ∫ x dy.
// Tail / spike: improper integrals. The area under 1/x² out to b settles at 1
// while the area under 1/x keeps growing like ln b; near 0, 1/√x has a finite
// area from ε to 1 (it tends to 2) while 1/x again does not.

type Mode = "parts" | "tail" | "spike";
type Curve = "ln" | "sq";
const W = 560, H = 280;
const n3 = (v: number) => f2(v, 3).replace("-", "−");

const CURVES: Record<Curve, { f: (x: number) => number; inv: (y: number) => number; a: number; view: [number, number, number, number]; bMax: number;
  blue: (b: number) => number; amber: (b: number) => number }> = {
  // ∫₁ᵇ ln x dx = b ln b − b + 1; ∫₀^{ln b} eʸ dy = b − 1
  ln: { f: Math.log, inv: Math.exp, a: 1, view: [-0.3, 5.3, -0.4, 1.9], bMax: 5,
    blue: b => b * Math.log(b) - b + 1, amber: b => b - 1 },
  // ∫₀.₅ᵇ x² dx = (b³ − 1/8)/3; ∫_{1/4}^{b²} √y dy = (2/3)(b³ − 1/8)
  sq: { f: x => x * x, inv: Math.sqrt, a: 0.5, view: [-0.2, 2.3, -0.4, 4.6], bMax: 2,
    blue: b => (b ** 3 - 0.125) / 3, amber: b => (2 / 3) * (b ** 3 - 0.125) },
};

function PartsPlot({ curve, b }: { curve: Curve; b: number }) {
  const cv = CURVES[curve];
  const [x0, x1, y0, y1] = cv.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const a = cv.a, ga = cv.f(a), gb = cv.f(b);
  const N = 80, xs = Array.from({ length: N + 1 }, (_, i) => a + ((b - a) * i) / N);
  const curvePts = xs.map(x => `${pr.X(x)},${pr.Y(cv.f(x))}`).join(" ");
  const blue = `${pr.X(a)},${pr.Y(0)} ${curvePts} ${pr.X(b)},${pr.Y(0)}`;
  const amber = `${pr.X(0)},${pr.Y(ga)} ${curvePts} ${pr.X(0)},${pr.Y(gb)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <Grid p={pr} step={curve === "sq" ? 0.5 : 1} labels major={1} />
      <polygon points={blue} fill={C.sky} fillOpacity={0.28} stroke="none" />
      <polygon points={amber} fill={C.amber} fillOpacity={0.28} stroke="none" />
      {ga > 0 && <rect x={pr.X(0)} y={pr.Y(ga)} width={pr.X(a) - pr.X(0)} height={pr.Y(0) - pr.Y(ga)} fill={C.muted} fillOpacity={0.18} stroke={C.muted} strokeDasharray="3 3" />}
      <rect x={pr.X(0)} y={pr.Y(gb)} width={pr.X(b) - pr.X(0)} height={pr.Y(0) - pr.Y(gb)} fill="none" stroke={C.green} strokeWidth={1.5} strokeDasharray="5 4" />
      <path d={fnPath(pr, cv.f, curve === "ln" ? 0.05 : x0)} fill="none" stroke={C.fg} strokeWidth={2} />
      <T x={pr.X((a + b) / 2)} y={pr.Y(0) - 8} color={C.sky} anchor="middle" bold>∫ y dx</T>
      <T x={pr.X(0) + 8} y={pr.Y((ga + gb) / 2) + (curve === "ln" ? -4 : 0)} color={C.amber} bold>∫ x dy</T>
      <T x={pr.X(b) + 4} y={pr.Y(gb) - 5} color={C.green} bold>{`(b, g(b))`}</T>
    </svg>
  );
}

function ImproperPlot({ mode, lim }: { mode: "tail" | "spike"; lim: number }) {
  const tail = mode === "tail";
  const pr = tail ? plot({ W, H, x0: -0.4, x1: 10.4, y0: -0.25, y1: 1.6 }) : plot({ W, H, x0: -0.08, x1: 1.25, y0: -1, y1: 12 });
  const good = tail ? (x: number) => 1 / (x * x) : (x: number) => 1 / Math.sqrt(x);
  const bad = (x: number) => 1 / x;
  const lo = tail ? 1 : lim, hi = tail ? Math.min(lim, pr.x1) : 1;
  const area = (f: (x: number) => number, top: number) => {
    const N = 120, pts = Array.from({ length: N + 1 }, (_, i) => { const x = lo + ((hi - lo) * i) / N; return `${pr.X(x)},${pr.Y(Math.min(f(x), top))}`; });
    return `${pr.X(lo)},${pr.Y(0)} ${pts.join(" ")} ${pr.X(hi)},${pr.Y(0)}`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <Grid p={pr} step={1} labels major={1} />
      <polygon points={area(bad, pr.y1 + 5)} fill={C.red} fillOpacity={0.16} />
      <polygon points={area(good, pr.y1 + 5)} fill={C.sky} fillOpacity={0.3} />
      <path d={fnPath(pr, bad, tail ? 0.3 : 0.004)} fill="none" stroke={C.red} strokeWidth={1.8} />
      <path d={fnPath(pr, good, tail ? 0.3 : 0.004)} fill="none" stroke={C.sky} strokeWidth={2} />
      {tail && lim > pr.x1 && <T x={pr.X(pr.x1) - 4} y={pr.Y(0) - 8} color={C.muted} anchor="end">{`→ b = ${f2(lim, 0)}`}</T>}
      <T x={pr.X(tail ? 2.2 : 0.5)} y={pr.Y(tail ? 0.6 : 2.6)} color={C.red} bold>1/x</T>
      <T x={pr.X(tail ? 1.3 : 0.3)} y={pr.Y(tail ? 1.1 : 1.1)} color={C.sky} bold>{tail ? "1/x²" : "1/√x"}</T>
    </svg>
  );
}

export function IntegrationFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("parts");
  const [curve, setCurve] = useState<Curve>("ln");
  const [b, setB] = useState(3.5);
  const [s, setS] = useState(1);            // tail: b = 10^s; spike: ε = 10^(−s)

  const cv = CURVES[curve];
  const bb = Math.min(b, cv.bMax);
  const big = bb * cv.f(bb), small = cv.a * cv.f(cv.a);
  const lim = mode === "tail" ? 10 ** s : 10 ** -s;

  return (
    <Figure
      title={tx(t, "figIbp_title", "Areas that trade places")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["parts", tx(t, "figIbp_parts", "by parts")],
        ["tail", tx(t, "figIbp_tail", "to infinity")],
        ["spike", tx(t, "figIbp_spike", "near zero")],
      ] as const} />}
      controls={mode === "parts" ? <>
        <Row>
          <Btn active={curve === "ln"} onClick={() => { setCurve("ln"); setB(3.5); }}>y = ln x</Btn>
          <Btn active={curve === "sq"} onClick={() => { setCurve("sq"); setB(1.6); }}>y = x²</Btn>
        </Row>
        <Slider label="b" value={bb} min={cv.a + 0.05} max={cv.bMax} step={0.01} onChange={setB} width="w-10" />
        <Row>
          <Readout color={C.sky}>{`∫ y dx = ${n3(cv.blue(bb))}`}</Readout>
          <Readout color={C.amber}>{`∫ x dy = ${n3(cv.amber(bb))}`}</Readout>
          <Readout color={C.green}>{`b·g(b) − a·g(a) = ${n3(big)} − ${n3(small)} = ${n3(big - small)}`}</Readout>
        </Row>
      </> : <>
        <Slider label={mode === "tail" ? "b" : "ε"} value={s} min={0.05} max={mode === "tail" ? 3 : 4} step={0.01} onChange={setS}
          fmt={() => (mode === "tail" ? f2(lim, lim < 10 ? 2 : 0) : lim.toExponential(1).replace("-", "−"))} width="w-10" />
        <Row>
          {mode === "tail" ? <>
            <Readout color={C.sky}>{`∫₁ᵇ dx/x² = 1 − 1/b = ${n3(1 - 1 / lim)}`}</Readout>
            <Readout color={C.red}>{`∫₁ᵇ dx/x = ln b = ${n3(Math.log(lim))}`}</Readout>
          </> : <>
            <Readout color={C.sky}>{`∫ε¹ dx/√x = 2 − 2√ε = ${n3(2 - 2 * Math.sqrt(lim))}`}</Readout>
            <Readout color={C.red}>{`∫ε¹ dx/x = −ln ε = ${n3(-Math.log(lim))}`}</Readout>
          </>}
        </Row>
      </>}
      note={mode === "parts"
        ? tx(t, "figIbp_noteParts", "The blue area under the curve and the amber area beside it fill the big dashed rectangle, b × g(b), except for the small grey corner a × g(a). So one area is the rectangle minus the other: ∫ y dx = [xy] − ∫ x dy. That is integration by parts. For y = ln x the amber area is easy (sideways the curve is x = eʸ), which is how ∫ ln x dx is found.")
        : mode === "tail"
          ? tx(t, "figIbp_noteTail", "Move b to the right. Both curves shrink toward the axis, but at different speeds. The area under 1/x² approaches 1 and never passes it, so ∫₁^∞ dx/x² = 1. The area under 1/x grows without bound, only slowly: each time b is multiplied by 10 it gains another ln 10 ≈ 2.3.")
          : tx(t, "figIbp_noteSpike", "Push ε toward 0. Both curves shoot up to infinity at x = 0, yet the area under 1/√x from ε to 1 approaches 2: the spike is tall but thin enough. The area under 1/x grows without bound, like −ln ε.")}
    >
      {mode === "parts" ? <PartsPlot curve={curve} b={bb} /> : <ImproperPlot mode={mode} lim={lim} />}
    </Figure>
  );
}
