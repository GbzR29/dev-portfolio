"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, plot, Grid, fnPath, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { fill } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// From series to transform. Top: a pulse (or a bell curve) of half-width a,
// repeated every 2L. Bottom: its Fourier coefficients, scaled by the period
// (2L · c_n), drawn as dots at the frequencies ω_n = nπ/L. They always sit
// exactly on one curve, the Fourier transform F(ω) of a single pulse (dashed).
// Play stretches the period: the copies move apart, the dots crowd together,
// and in the limit L → ∞ (one lonely pulse) they fill the whole curve.
// The width slider shows the trade-off: a narrow pulse has a wide transform.

type Shape = "pulse" | "gauss";
const W = 560, HT = 150, HB = 190;
const PI = Math.PI;
const L_MIN = PI, L_MAX = 14 * PI;
const top = plot({ W, H: HT, x0: -16, x1: 16, y0: -0.25, y1: 1.5 });
const n2 = (v: number) => (+v.toFixed(2)).toString();

/** The single shape, height 1, half-width a. */
const g = (s: Shape, a: number) => (x: number) => (s === "pulse" ? (Math.abs(x) < a ? 1 : 0) : Math.exp(-(x * x) / (2 * a * a)));
/** Its transform F(ω) = ∫ g(x) e^(−iωx) dx (both shapes are even, so it is real). */
const FT = (s: Shape, a: number) => (w: number) =>
  s === "pulse" ? (Math.abs(w) < 1e-9 ? 2 * a : (2 * Math.sin(a * w)) / w) : a * Math.sqrt(2 * PI) * Math.exp(-(a * a * w * w) / 2);

export function FourierTransformFigure({ t }: { t?: TrackTranslations }) {
  const [shape, setShape] = useState<Shape>("pulse");
  const [a, setA] = useState(1);
  const [L, setL] = useState(2 * PI);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  useFrame(playing && vis.on, dt => {
    const next = Math.min(L_MAX, L * Math.exp(dt * 0.45));
    setL(next);
    if (next >= L_MAX) setPlaying(false);
  });

  const f = g(shape, a), F = FT(shape, a), F0 = F(0);
  const bot = plot({ W, H: HB, x0: -10, x1: 10, y0: -0.3 * F0, y1: 1.12 * F0 });
  const periodic = (x: number) => { let s = 0; for (let k = -6; k <= 6; k++) s += f(x - 2 * k * L); return Math.min(1, s); };
  const pulseFits = shape === "gauss" || a < L;
  const dots: number[] = [];
  for (let k = -Math.floor(10 * L / PI); k <= Math.floor(10 * L / PI); k++) dots.push((k * PI) / L);

  const view = (
    <div ref={vis.ref}>
      <svg viewBox={`0 0 ${W} ${HT}`} className="w-full h-auto">
        <Grid p={top} step={2} labels={false} />
        {[-2, -1, 1, 2].map(k => Math.abs(2 * k * L) < 16 && (
          <line key={k} x1={top.X(2 * k * L)} y1={top.Y(1.2)} x2={top.X(2 * k * L)} y2={top.Y(-0.05)} stroke={C.muted} strokeWidth={1} strokeDasharray="2 3" />
        ))}
        <path d={fnPath(top, periodic, -16, 16, 1600)} fill="none" stroke={C.sky} strokeWidth={2.2} />
        {Math.abs(2 * L) < 16 && <>
          <line x1={top.X(0)} y1={top.Y(1.17)} x2={top.X(2 * L)} y2={top.Y(1.17)} stroke={C.amber} strokeWidth={1.3} />
          <T x={top.X(L)} y={top.Y(1.17) - 4} size={9.5} anchor="middle" color={C.amber}>{`2L = ${n2(2 * L)}`}</T>
        </>}
        <T x={8} y={HT - 8} size={10} color={C.sky} bold>f(x)</T>
      </svg>
      <svg viewBox={`0 0 ${W} ${HB}`} className="w-full h-auto" style={{ borderTop: "1px solid var(--border)" }}>
        <Grid p={bot} step={1} labels={false} />
        {[-8, -4, 4, 8].map(w => <T key={w} x={bot.X(w)} y={bot.Y(0) + 12} size={9} anchor="middle">{String(w).replace("-", "−")}</T>)}
        <path d={fnPath(bot, F, -10, 10, 800)} fill="none" stroke={C.purple} strokeWidth={1.4} strokeDasharray="5 3" />
        {pulseFits && dots.map(w => (
          <g key={w}>
            <line x1={bot.X(w)} y1={bot.Y(0)} x2={bot.X(w)} y2={bot.Y(F(w))} stroke={C.amber} strokeWidth={1.2} opacity={0.6} />
            <circle cx={bot.X(w)} cy={bot.Y(F(w))} r={dots.length > 120 ? 1.8 : 3} fill={C.amber} />
          </g>
        ))}
        <T x={8} y={16} size={10} color={C.purple} bold>F(ω)</T>
        <T x={W - 8} y={16} size={9.5} anchor="end" color={C.amber}>{tx(t, "figFt_dots", "dots: 2L · cₙ at ω = nπ/L")}</T>
        <T x={W - 8} y={HB - 6} size={9.5} anchor="end">ω</T>
      </svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (playing) { setPlaying(false); return; } if (L >= L_MAX - 1e-6) setL(L_MIN); setPlaying(true); }}
        playLabel={tx(t, "figFt_play", "stretch the period")}
        onReset={() => { setPlaying(false); setL(2 * PI); }}
        readout={fill(tx(t, "figFt_spacing", "spacing π/L = {d}"), { d: n2(PI / L) })} />
    </div>
  );

  const controls = <>
    <Row>
      <Btn active={shape === "pulse"} onClick={() => setShape("pulse")}>{tx(t, "figFt_pulse", "rectangular pulse")}</Btn>
      <Btn active={shape === "gauss"} onClick={() => setShape("gauss")}>{tx(t, "figFt_gauss", "bell curve")}</Btn>
    </Row>
    <Sliders>
      <Slider label={tx(t, "figFt_width", "half-width a")} value={a} min={0.25} max={3} step={0.05} onChange={setA} fmt={n2} />
      <Slider label={tx(t, "figFt_half", "half-period L")} value={L} min={L_MIN} max={L_MAX} step={0.05} onChange={v => { setPlaying(false); setL(v); }} fmt={n2} />
    </Sliders>
    <Row>
      {shape === "pulse"
        ? <Readout color={C.purple}>{`F(ω) = 2 sin(aω)/ω,  ${tx(t, "figFt_zero", "first zero at")} ω = π/a = ${n2(PI / a)}`}</Readout>
        : <Readout color={C.purple}>{`F(ω) = a√(2π) e^(−a²ω²/2),  ${tx(t, "figFt_sd", "spread")} 1/a = ${n2(1 / a)}`}</Readout>}
      <Readout>{shape === "pulse"
        ? tx(t, "figFt_prodP", "width × lobe = 2a × 2π/a = 4π, whatever a is")
        : tx(t, "figFt_prodG", "spread in x × spread in ω = a × 1/a = 1")}</Readout>
    </Row>
    {!pulseFits && <Row><Readout color={C.red}>{tx(t, "figFt_overlap", "the pulses overlap (a ≥ L): make the period longer")}</Readout></Row>}
  </>;
  const note = tx(t, "figFt_note", "A function that repeats every 2L has frequencies only at the multiples of π/L: those are the dots. Press play to stretch the period. The copies of the pulse move apart, the dots crowd closer together, and they always lie on the same dashed curve. When the period is infinite there is a single pulse, the dots merge into the whole curve, and the series has become the Fourier transform. Now drag the width: a narrow pulse spreads its transform wide, a wide pulse squeezes it near ω = 0. You can never make both narrow at once.");

  return (
    <Figure title={tx(t, "figFt_title", "From Fourier series to Fourier transform")} controls={controls} note={note}>
      {view}
    </Figure>
  );
}
