"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, plot, fnPath, useDrag, clamp, f2, type Plot } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The common named distributions with their parameters on sliders. Discrete
// ones (binomial, geometric, Poisson) are bars P(X = k); continuous ones
// (exponential, normal) are density curves. The blue line is the mean and the
// amber band is mean ± one standard deviation, both from the formulas in the
// chapter. Drag the green line to shade P(X ≤ x). For the binomial, "compare"
// overlays the normal curve with the same mean and variance and the Poisson
// with the same mean: the normal fits when np(1 − p) is large, the Poisson
// when n is large and p small.

type Dist = "binom" | "geom" | "pois" | "exp" | "norm";
const W = 560, H = 230;

const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
const fact = (k: number) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
const normPdf = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const poisPmf = (k: number, l: number) => (Math.exp(-l) * l ** k) / fact(k);

/** Standard normal CDF by the Abramowitz–Stegun 7.1.26 approximation of erf (error < 1.5e-7). */
function Phi(z: number) {
  const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export function DistributionFigure({ t }: { t?: TrackTranslations }) {
  const [dist, setDistRaw] = useState<Dist>("binom");
  const [n, setN] = useState(20);
  const [p, setP] = useState(0.3);
  const [lam, setLam] = useState(3);
  const [mu, setMu] = useState(0);
  const [sd, setSd] = useState(1);
  const [cut, setCut] = useState(6);
  const [compare, setCompare] = useState(false);
  const setDist = (d: Dist) => { setDistRaw(d); setCut(d === "norm" ? 1 : d === "exp" ? 1 : d === "geom" ? 3 : d === "pois" ? 3 : 6); };

  const discrete = dist === "binom" || dist === "geom" || dist === "pois";
  // Mean and variance from the closed-form formulas.
  const [mean, vr] =
    dist === "binom" ? [n * p, n * p * (1 - p)] :
    dist === "geom" ? [1 / p, (1 - p) / (p * p)] :
    dist === "pois" ? [lam, lam] :
    dist === "exp" ? [1 / lam, 1 / (lam * lam)] : [mu, sd * sd];
  const s = Math.sqrt(vr);

  const kMax = dist === "binom" ? n : dist === "geom" ? Math.min(40, Math.ceil(mean + 4 * s) + 1) : Math.ceil(lam + 4 * Math.sqrt(lam)) + 2;
  const pmf = (k: number) => dist === "binom" ? choose(n, k) * p ** k * (1 - p) ** (n - k) : dist === "geom" ? (k >= 1 ? (1 - p) ** (k - 1) * p : 0) : poisPmf(k, lam);
  const dens = (x: number) => dist === "exp" ? (x >= 0 ? lam * Math.exp(-lam * x) : 0) : normPdf(x, mu, sd);
  const cdf = (x: number) => discrete
    ? Array.from({ length: kMax + 1 }, (_, k) => (k <= x + 1e-9 ? pmf(k) : 0)).reduce((a, b) => a + b, 0)
    : dist === "exp" ? (x <= 0 ? 0 : 1 - Math.exp(-lam * x)) : Phi((x - mu) / sd);

  const [x0, x1] = discrete ? [-0.8, kMax + 0.8] : dist === "exp" ? [-0.3, Math.max(4, 5 / lam)] : [-6, 6];
  const bars = discrete ? Array.from({ length: kMax + 1 }, (_, k) => [k, pmf(k)] as const) : [];
  const top = discrete ? Math.max(...bars.map(b => b[1])) : dist === "exp" ? lam : normPdf(mu, mu, sd);
  const pl = plot({ W, H: H - 24, x0, x1, y0: 0, y1: top * 1.2 });
  const c = discrete ? Math.floor(clamp(cut, 0, kMax)) : clamp(cut, x0, x1);

  const drag = useDrag<1>(() => 1, (_, q) => setCut(pl.inv(q).x));
  const ticks = discrete ? bars.filter(([k]) => kMax <= 20 || k % 5 === 0).map(b => b[0]) : dist === "exp" ? [0, 1, 2, 3, 4, 5, 6, 8, 10].filter(v => v < x1) : [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

  const formula =
    dist === "binom" ? `E = np = ${f2(mean)}   Var = np(1 − p) = ${f2(vr)}` :
    dist === "geom" ? `E = 1/p = ${f2(mean)}   Var = (1 − p)/p² = ${f2(vr)}` :
    dist === "pois" ? `E = λ = ${f2(mean)}   Var = λ = ${f2(vr)}` :
    dist === "exp" ? `E = 1/λ = ${f2(mean)}   Var = 1/λ² = ${f2(vr)}` : `E = μ = ${f2(mean)}   Var = σ² = ${f2(vr)}`;

  return (
    <Figure
      title={tx(t, "figDist_title", "The common distributions")}
      head={<Choice value={dist} onChange={setDist} options={[
        ["binom", tx(t, "figDist_binom", "binomial")],
        ["geom", tx(t, "figDist_geom", "geometric")],
        ["pois", tx(t, "figDist_pois", "Poisson")],
        ["exp", tx(t, "figDist_exp", "exponential")],
        ["norm", tx(t, "figDist_norm", "normal")],
      ]} />}
      controls={<>
        {dist === "binom" && <Slider label={tx(t, "figDist_n", "trials n")} value={n} min={1} max={60} step={1} onChange={setN} fmt={v => String(v)} />}
        {(dist === "binom" || dist === "geom") && <Slider label={tx(t, "figDist_p", "success p")} value={p} min={0.02} max={0.98} step={0.01} onChange={setP} fmt={v => f2(v)} />}
        {(dist === "pois" || dist === "exp") && <Slider label={dist === "pois" ? tx(t, "figDist_lam", "mean count λ") : tx(t, "figDist_rate", "rate λ")} value={lam} min={0.2} max={dist === "pois" ? 15 : 4} step={0.1} onChange={setLam} fmt={v => f2(v, 1)} />}
        {dist === "norm" && <>
          <Slider label={tx(t, "figDist_mu", "mean μ")} value={mu} min={-3} max={3} step={0.1} onChange={setMu} fmt={v => f2(v, 1)} />
          <Slider label={tx(t, "figDist_sd", "st. dev. σ")} value={sd} min={0.3} max={2.5} step={0.05} onChange={setSd} fmt={v => f2(v)} />
        </>}
        {dist === "binom" && <Row><Btn active={compare} onClick={() => setCompare(v => !v)}>{tx(t, "figDist_compare", "compare: normal + Poisson")}</Btn></Row>}
        <Row>
          <Readout color={C.blue}>{formula}</Readout>
          <Readout color={C.amber}>{`σ = ${f2(s)}`}</Readout>
          <Readout color={C.green}>{discrete ? `P(X ≤ ${c}) = ${f2(cdf(c), 4)}` : `P(X ≤ ${f2(c)}) = ${f2(cdf(c), 4)}`}</Readout>
        </Row>
      </>}
      note={<>
        {tx(t, "figDist_note", "Watch how the parameters move the mean (blue) and the spread (amber band, mean ± σ). The binomial becomes a symmetric bell as n grows unless p is near 0 or 1; the geometric and exponential always lean right, with their highest point at the start; the Poisson's mean and variance are the same number.")}{" "}
        <span data-mouse-only>{tx(t, "figDist_drag", "Drag in the plot to move the green cut.")}</span>
        <span data-touch-only>{tx(t, "figDist_dragTouch", "Drag in the plot to move the green cut.")}</span>
      </>}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-ew-resize">
        <rect x={pl.X(mean - s)} y={0} width={Math.max(0, pl.X(mean + s) - pl.X(mean - s))} height={pl.Y(0)} fill={C.amber} opacity={0.1} />
        <line x1={0} x2={W} y1={pl.Y(0)} y2={pl.Y(0)} stroke={C.axis} strokeWidth={1.2} />
        {ticks.map(v => <T key={v} x={pl.X(v)} y={pl.Y(0) + 13} anchor="middle" color={C.axis} size={8.5}>{v}</T>)}
        {discrete ? bars.map(([k, pk]) => (
          <rect key={k} x={pl.X(k - 0.35)} y={pl.Y(pk)} width={0.7 * pl.sx} height={pl.Y(0) - pl.Y(pk)} rx={1.5}
            fill={k <= c ? C.green : C.blue} opacity={k <= c ? 0.75 : 0.55} />
        )) : <>
          <path d={shadeUnder(pl, dens, x0, c)} fill={C.green} opacity={0.3} />
          <path d={fnPath(pl, dens, x0, x1, 400)} fill="none" stroke={C.blue} strokeWidth={2.2} />
        </>}
        {dist === "binom" && compare && <>
          <path d={fnPath(pl, x => normPdf(x, mean, Math.max(s, 1e-3)), x0, x1, 300)} fill="none" stroke={C.purple} strokeWidth={1.8} />
          {bars.map(([k]) => <circle key={k} cx={pl.X(k)} cy={pl.Y(poisPmf(k, mean))} r={2.6} fill={C.pink} />)}
          <T x={W - 8} y={14} anchor="end" color={C.purple}>{tx(t, "figDist_normLbl", "normal, same μ and σ")}</T>
          <T x={W - 8} y={28} anchor="end" color={C.pink}>{tx(t, "figDist_poisLbl", "• Poisson, λ = np")}</T>
        </>}
        <line x1={pl.X(mean)} x2={pl.X(mean)} y1={8} y2={pl.Y(0)} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 4" />
        <T x={pl.X(mean) + 4} y={16} color={C.blue} bold>{"E[X]"}</T>
        <line x1={pl.X(discrete ? c + 0.5 : c)} x2={pl.X(discrete ? c + 0.5 : c)} y1={0} y2={pl.Y(0)} stroke={C.green} strokeWidth={1.5} />
      </svg>
    </Figure>
  );
}

/** Closed region under f from a to b. */
function shadeUnder(p: Plot, f: (x: number) => number, a: number, b: number) {
  if (b <= a) return "";
  let d = `M${p.X(a).toFixed(1)},${p.Y(0).toFixed(1)}`;
  for (let i = 0; i <= 160; i++) { const x = a + ((b - a) * i) / 160; d += `L${p.X(x).toFixed(1)},${p.Y(f(x)).toFixed(1)}`; }
  return d + `L${p.X(b).toFixed(1)},${p.Y(0).toFixed(1)}Z`;
}
