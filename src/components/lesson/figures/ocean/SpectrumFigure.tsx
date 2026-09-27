"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Slider, Sliders, Readout, plot, fnPath, T, C } from "../../kit/figure";
import { G, CASCADES, jonswap, seaStats } from "./spectrum";

// ── What this figure shows ────────────────────────────────────────────────────
// The JONSWAP spectrum S(ω) for a wind speed and fetch: how the variance of
// the sea surface is spread over wave frequencies. The dashed curve is the
// same sea with γ = 1 (Pierson–Moskowitz, a fully developed sea); γ sharpens
// the peak. The shaded bands are the frequencies each FFT cascade simulates.

const W = 560, H = 230;

export function SpectrumFigure({ t }: { t?: TrackTranslations }) {
  const [U, setU] = useState(10);
  const [F, setF] = useState(120);
  const [gamma, setGamma] = useState(3.3);
  const s = seaStats({ wind: U, fetch: F, gamma, windDir: 0, spread: 6, short: 1 });
  const S = (w: number) => jonswap(w, U, F * 1000, gamma);
  const peak = S(s.wp);
  const p = plot({ W, H, x0: 0, x1: 5, y0: 0, y1: peak * 1.25 });
  const wOf = (lambda: number) => Math.sqrt((G * 2 * Math.PI) / lambda);   // ω = √(g·2π/λ)
  const bands = CASCADES.map((c, i) => ({ from: wOf(i === 0 ? c.L : CASCADES[i - 1].lMin), to: c.lMin > 0 ? wOf(c.lMin) : 5 }));
  const bandColour = [C.red, C.green, C.blue];

  return (
    <Figure title={tx(t, "figSpectrum_title", "The JONSWAP spectrum")}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figSpectrum_U", "wind U (m/s)")} value={U} min={3} max={20} step={0.5} onChange={setU} fmt={v => v.toFixed(1)} />
          <Slider label={tx(t, "figSpectrum_F", "fetch F (km)")} value={F} min={5} max={2000} step={5} onChange={setF} fmt={v => v.toFixed(0)} />
          <Slider label={tx(t, "figSpectrum_g", "peak γ")} value={gamma} min={1} max={7} step={0.1} onChange={setGamma} fmt={v => v.toFixed(1)} />
        </Sliders>
        <div className="flex gap-1.5 flex-wrap">
          <Readout>ω<sub>p</sub> = {s.wp.toFixed(2)} rad/s</Readout>
          <Readout>λ<sub>p</sub> = {s.lambdaP.toFixed(0)} m</Readout>
          <Readout>T<sub>p</sub> = {s.tp.toFixed(1)} s</Readout>
          <Readout color={C.sky}>H<sub>s</sub> = {s.hs.toFixed(2)} m</Readout>
        </div>
      </>}
      note={tx(t, "figSpectrum_note", "More wind or more fetch moves the peak to lower frequencies (longer, faster waves) and raises the whole curve. The area under the curve is the variance of the surface height, and Hs = 4·√area. The shaded bands are the frequencies each FFT cascade of the Ocean Lab carries: red the 500 m tile, green the 83 m tile, blue the 14 m tile.")}>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full h-auto block">
        {bands.map((b, i) => (
          <rect key={i} x={p.X(b.from)} y={0} width={Math.max(0, p.X(Math.min(b.to, 5)) - p.X(b.from))} height={H}
            fill={bandColour[i]} opacity={0.08} />
        ))}
        {[1, 2, 3, 4].map(x => (
          <g key={x}>
            <line x1={p.X(x)} x2={p.X(x)} y1={0} y2={H} stroke={C.grid} strokeWidth={0.6} />
            <T x={p.X(x)} y={H + 12} anchor="middle" size={9}>{x}</T>
          </g>
        ))}
        <line x1={0} x2={W} y1={H} y2={H} stroke={C.axis} strokeWidth={1.2} />
        <path d={fnPath(p, w => jonswap(w, U, F * 1000, 1), 0.05, 5, 300)} fill="none" stroke={C.muted} strokeWidth={1.3} strokeDasharray="4 3" />
        <path d={fnPath(p, S, 0.05, 5, 300)} fill="none" stroke={C.sky} strokeWidth={2} />
        <line x1={p.X(s.wp)} x2={p.X(s.wp)} y1={p.Y(peak)} y2={H} stroke={C.amber} strokeWidth={1} strokeDasharray="3 3" />
        <T x={p.X(s.wp) + 5} y={p.Y(peak) - 4} color={C.amber}>ω<tspan baselineShift="sub" fontSize={7}>p</tspan></T>
        <T x={W - 4} y={H + 12} anchor="end" size={9}>ω (rad/s)</T>
        <T x={6} y={12}>S(ω)</T>
        <T x={W - 6} y={12} anchor="end" color={C.muted}>{tx(t, "figSpectrum_pm", "dashed: γ = 1 (Pierson–Moskowitz)")}</T>
      </svg>
    </Figure>
  );
}
