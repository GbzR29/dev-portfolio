"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// Monte Carlo integration of f(x) = π/2·sin(πx) on [0, 1] (exact value 1).
// Each sample adds f(x)/p(x); the running average converges with an error
// that shrinks like 1/√N. Importance sampling draws x from p(x) = 6x(1−x),
// shaped like f, and the estimate becomes far less noisy.

const f = (x: number) => (Math.PI / 2) * Math.sin(Math.PI * x);
const pImp = (x: number) => 6 * x * (1 - x);
// Sample from p(x) = 6x(1−x): the median of three uniforms has exactly this density
const sampleImp = () => { const a = [Math.random(), Math.random(), Math.random()].sort((u, v) => u - v); return a[1]; };

const W = 520, PH = 150, CH = 150;

export function MonteCarloFigure({ t }: { t?: TrackTranslations }) {
  const [imp, setImp] = useState(false);
  const [samples, setSamples] = useState<number[]>([]);        // x values
  const [history, setHistory] = useState<number[]>([]);        // running estimate after each sample
  const [auto, setAuto] = useState(false);
  const sum = useRef(0);

  const reset = () => { sum.current = 0; setSamples([]); setHistory([]); };
  useEffect(reset, [imp]);
  const addN = (n: number) => {
    const xs: number[] = [], hs: number[] = [];
    let s = sum.current, count = history.length;
    for (let i = 0; i < n; i++) {
      const x = imp ? sampleImp() : Math.random();
      s += f(x) / (imp ? pImp(x) : 1);                          // the estimator: f(x) / p(x)
      count++;
      xs.push(x); hs.push(s / count);
    }
    sum.current = s;
    setSamples(o => [...o, ...xs].slice(-400));
    setHistory(o => [...o, ...hs].slice(-2000));
  };
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => addN(5), 60);
    return () => clearInterval(id);
  });

  const N = history.length, est = N ? history[N - 1] : 0;
  const px = (x: number) => 30 + x * (W - 50);
  const py = (y: number) => PH - 12 - (y / 1.8) * (PH - 24);
  const curve = Array.from({ length: 101 }, (_, i) => `${px(i / 100)},${py(f(i / 100))}`).join(" ");
  const pdfCurve = Array.from({ length: 101 }, (_, i) => `${px(i / 100)},${py(pImp(i / 100))}`).join(" ");
  // Convergence chart: estimate vs log N, with the ±σ/√N band of each method
  const sigma = imp ? 0.049 : 0.483;                            // standard deviation of one sample (computed numerically)
  const lx = (n: number) => 30 + (Math.log10(Math.max(1, n)) / 3.3) * (W - 50);
  const ly = (v: number) => CH / 2 - (v - 1) * (CH / 2 - 10) * 1.6;
  const band = Array.from({ length: 60 }, (_, i) => 10 ** ((i / 59) * 3.3));
  const upper = band.map(n => `${lx(n)},${ly(1 + sigma / Math.sqrt(n))}`).join(" ");
  const lower = band.map(n => `${lx(n)},${ly(1 - sigma / Math.sqrt(n))}`).join(" ");
  const step = Math.max(1, Math.floor(N / 400));
  const path = history.filter((_, i) => i % step === 0 || i === N - 1).map((v, i, a) => `${lx((i === a.length - 1 ? N : i * step + 1))},${ly(Math.max(0, Math.min(2, v)))}`).join(" ");
  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figMC_title", "Monte Carlo — Integrating with Random Samples")}</span>
        <div className="flex gap-1.5">
          <button className={btn(!imp)} onClick={() => setImp(false)}>{tx(t, "figMC_uni", "uniform samples")}</button>
          <button className={btn(imp)} onClick={() => setImp(true)}>{tx(t, "figMC_imp", "importance sampling")}</button>
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${PH}`} className="w-full h-auto">
          <polyline points={curve} fill="none" stroke="#38bdf8" strokeWidth={2} />
          {imp && <polyline points={pdfCurve} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />}
          {samples.map((x, i) => <line key={i} x1={px(x)} y1={py(0)} x2={px(x)} y2={py(f(x))} stroke="#e2e8f0" strokeOpacity={0.25} />)}
          <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(0)} stroke="#64748b" />
          <text x={px(0.02)} y={14} fontSize={10} fill="#38bdf8" fontFamily="monospace">f(x) = π/2 · sin(πx)   ∫₀¹ f = 1</text>
          {imp && <text x={px(0.62)} y={14} fontSize={10} fill="#f59e0b" fontFamily="monospace">p(x) = 6x(1 − x)</text>}
        </svg>
        <svg viewBox={`0 0 ${W} ${CH}`} className="w-full h-auto border-t border-[var(--border)]">
          <polygon points={`${upper} ${lower.split(" ").reverse().join(" ")}`} fill="#38bdf8" fillOpacity={0.12} />
          <line x1={30} y1={ly(1)} x2={W - 20} y2={ly(1)} stroke="#22c55e" strokeDasharray="3 3" />
          {N > 0 && <polyline points={path} fill="none" stroke="#f8fafc" strokeWidth={1.5} />}
          {[1, 10, 100, 1000].map(n => <text key={n} x={lx(n)} y={CH - 4} fontSize={9} fill="#64748b" fontFamily="monospace" textAnchor="middle">{n}</text>)}
          <text x={34} y={12} fontSize={10} fill="#94a3b8" fontFamily="monospace">estimate vs N (log scale) · band = ±σ/√N</text>
        </svg>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(false)} onClick={() => addN(1)}>+1</button>
          <button className={btn(false)} onClick={() => addN(10)}>+10</button>
          <button className={btn(false)} onClick={() => addN(100)}>+100</button>
          <button className={btn(auto)} onClick={() => setAuto(a => !a)}>{auto ? "❚❚ stop" : "▶ auto"}</button>
          <button className={btn(false)} onClick={reset}>↻ reset</button>
          <span className="ml-auto text-[11px] font-mono text-[var(--text-main)]">N = {N} · {tx(t, "figMC_est", "estimate")} = {N ? est.toFixed(4) : "—"} · {tx(t, "figMC_err", "error")} = {N ? Math.abs(est - 1).toFixed(4) : "—"}</span>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figMC_note", "Each vertical line is one sample: a random x and the value f(x). With uniform samples, the estimate is just the average of f(x). The chart shows it wandering toward 1, inside a band that narrows like 1/√N: four times the samples for half the noise. Switch to importance sampling: x is drawn more often where f is large, each sample is divided by how likely it was, and the same N gives an estimate about ten times closer (σ drops from 0.48 to 0.05), which would take a hundred times more uniform samples.")}
        </p>
      </div>
    </figure>
  );
}
