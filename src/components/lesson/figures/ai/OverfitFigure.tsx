"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T, plot, fnPath, mulberry32, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Ten noisy training points drawn from a smooth hidden curve (dashed), and a
// polynomial of the chosen degree fitted to them by least squares. Below, the
// training and validation errors for every degree. Low degrees underfit (both
// errors high); the right degree follows the trend; high degrees chase the
// noise, so the training error keeps falling while the validation error, on
// thirty fresh points from the same curve, shoots up. "New sample" draws
// another ten points: the high-degree curves change wildly (high variance).

const TOP = plot({ W: 620, H: 230, x0: 0, x1: 1, y0: -1.9, y1: 1.9 });
const BOT = { x: 40, y: 250, w: 560, h: 110 };            // the error chart, in viewBox units
const MAXDEG = 9, NOISE = 0.3;
const truth = (x: number) => Math.sin(2 * Math.PI * x);
const gauss = (rnd: () => number) => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

function sample(n: number, seed: number, even: boolean): [number, number][] {
  const rnd = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => {
    const x = even ? (i + rnd()) / n : rnd();              // one point somewhere in each tenth of [0, 1]
    return [x, truth(x) + NOISE * gauss(rnd)] as [number, number];
  });
}

/** Least-squares polynomial of degree `deg` in u = 2x − 1 (better conditioned than x), via the normal equations. */
function polyfit(pts: [number, number][], deg: number) {
  const m = deg + 1;
  const A = Array.from({ length: m }, () => new Array<number>(m + 1).fill(0));
  for (const [x, y] of pts) {
    const u = 2 * x - 1;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) A[i][j] += u ** (i + j);
      A[i][m] += y * u ** i;
    }
  }
  for (let i = 0; i < m; i++) A[i][i] += 1e-10;             // tiny ridge: keeps the solve stable at interpolation
  for (let i = 0; i < m; i++) {                              // Gaussian elimination with partial pivoting
    let p = i;
    for (let k = i + 1; k < m; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    [A[i], A[p]] = [A[p], A[i]];
    for (let k = i + 1; k < m; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j <= m; j++) A[k][j] -= f * A[i][j]; }
  }
  const c = new Array<number>(m).fill(0);
  for (let i = m - 1; i >= 0; i--) { let s = A[i][m]; for (let j = i + 1; j < m; j++) s -= A[i][j] * c[j]; c[i] = s / A[i][i]; }
  return (x: number) => { const u = 2 * x - 1; let s = 0; for (let i = m - 1; i >= 0; i--) s = s * u + c[i]; return s; };
}

const mseOf = (f: (x: number) => number, pts: [number, number][]) => pts.reduce((s, [x, y]) => s + (f(x) - y) ** 2, 0) / pts.length;
const VAL = sample(30, 991, false);

export function OverfitFigure({ t }: { t?: TrackTranslations }) {
  const [deg, setDeg] = useState(3);
  const [seed, setSeed] = useState(1);
  const [showVal, setShowVal] = useState(false);
  const L = (k: string, en: string) => tx(t, `figAiOver_${k}`, en);

  const train = useMemo(() => sample(10, seed, true), [seed]);
  const errs = useMemo(() => Array.from({ length: MAXDEG + 1 }, (_, d) => {
    const f = polyfit(train, d);
    return { tr: mseOf(f, train), va: mseOf(f, VAL) };
  }), [train]);
  const f = useMemo(() => polyfit(train, deg), [train, deg]);
  const bestDeg = errs.reduce((b, e, d) => (e.va < errs[b].va ? d : b), 0);

  // error chart: log10 of the MSE from 10⁻³ to 10¹
  const ex = (d: number) => BOT.x + (d / MAXDEG) * BOT.w;
  const ey = (v: number) => BOT.y + BOT.h - ((Math.log10(Math.max(v, 1e-3)) + 3) / 4) * BOT.h;
  const line = (k: "tr" | "va") => errs.map((e, d) => `${d ? "L" : "M"}${ex(d).toFixed(1)},${Math.max(ey(e[k]), BOT.y).toFixed(1)}`).join("");
  // "about right" while the validation error stays within 50% of the best degree's
  const near = errs[deg].va < 1.5 * errs[bestDeg].va;
  const verdict = near ? L("good", "about right") : deg < bestDeg ? L("under", "underfitting") : L("over", "overfitting");

  return (
    <Figure
      title={L("title", "Underfitting and overfitting")}
      head={<>
        <Btn active={showVal} onClick={() => setShowVal(v => !v)}>{showVal ? "☑" : "☐"} {L("val", "validation points")}</Btn>
        <Btn onClick={() => setSeed(s => s + 1)}>{L("resample", "new sample")}</Btn>
      </>}
      controls={<>
        <Slider label={L("degree", "degree")} value={deg} min={0} max={MAXDEG} step={1} onChange={setDeg} fmt={v => `${v}`} />
        <Row>
          <Readout color={C.sky}>{L("train", "training MSE")} {f2(errs[deg].tr, 3)}</Readout>
          <Readout color={C.amber}>{L("valid", "validation MSE")} {errs[deg].va < 100 ? f2(errs[deg].va, 3) : "> 100"}</Readout>
          <Readout color={C.muted}>{L("noise", "noise floor")} {f2(NOISE * NOISE, 2)}</Readout>
          <Readout color={deg === bestDeg ? C.green : C.fg}>{verdict}</Readout>
        </Row>
      </>}
      note={L("note", "The dashed curve is the truth the data comes from, sin(2πx), plus random noise with standard deviation 0.3, so even the perfect model has an MSE of about 0.09 (the noise floor). Degree 0 and 1 cannot bend enough: both errors stay high (high bias). Around degree 3 to 5 the curve follows the trend and the validation error is lowest. By degree 9 the polynomial has 10 coefficients for 10 points and passes through every one of them: training error 0, validation error huge, and each \"new sample\" gives a completely different curve (high variance). The chart below shows both errors for every degree, on a log scale: blue for training, orange for validation; the dashed line is the noise floor.")}
    >
      <svg viewBox={`0 0 ${TOP.W} 376`} className="w-full h-auto" role="img">
        <defs><clipPath id="ai-over-clip"><rect x={0} y={0} width={TOP.W} height={TOP.H} /></clipPath></defs>
        <line x1={0} x2={TOP.W} y1={TOP.Y(0)} y2={TOP.Y(0)} stroke={C.axis} strokeWidth={0.8} />
        <path d={fnPath(TOP, truth)} fill="none" stroke={C.muted} strokeWidth={1.2} strokeDasharray="5 4" />
        <g clipPath="url(#ai-over-clip)">
          <path d={fnPath(TOP, f, 0, 1, 400)} fill="none" stroke={C.purple} strokeWidth={2.2} />
        </g>
        {showVal && VAL.map(([x, y], i) => <circle key={`v${i}`} cx={TOP.X(x)} cy={TOP.Y(y)} r={3.5} fill="none" stroke={C.amber} strokeWidth={1.4} />)}
        {train.map(([x, y], i) => <circle key={i} cx={TOP.X(x)} cy={TOP.Y(y)} r={5} fill={C.sky} stroke="var(--code-bg)" strokeWidth={1.5} />)}
        <T x={TOP.W - 6} y={14} size={9} anchor="end" color={C.purple} bold>{L("degree", "degree")} {deg}</T>

        <line x1={BOT.x} x2={BOT.x + BOT.w} y1={BOT.y + BOT.h} y2={BOT.y + BOT.h} stroke={C.axis} />
        {[-3, -2, -1, 0, 1].map(k => <g key={k}>
          <line x1={BOT.x} x2={BOT.x + BOT.w} y1={ey(10 ** k)} y2={ey(10 ** k)} stroke={C.grid} strokeWidth={0.6} />
          <T x={BOT.x - 4} y={ey(10 ** k) + 3} size={7.5} anchor="end">{`10${["⁻³", "⁻²", "⁻¹", "⁰", "¹"][k + 3]}`}</T>
        </g>)}
        <line x1={BOT.x} x2={BOT.x + BOT.w} y1={ey(NOISE * NOISE)} y2={ey(NOISE * NOISE)} stroke={C.muted} strokeDasharray="3 3" />
        <rect x={ex(deg) - 9} y={BOT.y} width={18} height={BOT.h} fill="var(--primary)" fillOpacity={0.12} />
        <path d={line("tr")} fill="none" stroke={C.sky} strokeWidth={2} />
        <path d={line("va")} fill="none" stroke={C.amber} strokeWidth={2} />
        {errs.map((_, d) => <T key={d} x={ex(d)} y={BOT.y + BOT.h + 10} size={7.5} anchor="middle">{d}</T>)}
      </svg>
    </Figure>
  );
}
