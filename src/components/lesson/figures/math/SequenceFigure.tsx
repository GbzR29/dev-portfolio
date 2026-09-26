"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Btn, Row, Readout, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The first terms of an arithmetic sequence (add d each step) or a geometric
// one (multiply by r each step) as bars, with the running sum S_n as an
// optional amber line. Arithmetic terms grow by a constant step, so the bars
// rise like a ramp; geometric terms grow (or shrink) by a constant factor.
// With |r| < 1 the sums level off toward a₁ / (1 − r).

type Mode = "arith" | "geo";
const N = 12;
const n = (v: number) => (Math.abs(v) < 1e-9 ? 0 : Math.abs(v) >= 1e5 ? v.toExponential(1) : +v.toFixed(3)).toString().replace("-", "−");

export function SequenceFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("arith");
  const [a1, setA1] = useState(1);
  const [d, setD] = useState(2);
  const [r, setR] = useState(0.5);
  const [sums, setSums] = useState(true);

  const terms = Array.from({ length: N }, (_, i) => (mode === "arith" ? a1 + i * d : a1 * r ** i));
  const partial = terms.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], []);
  const shown = sums ? [...terms, ...partial] : terms;
  const top = Math.max(1, ...shown), bot = Math.min(0, ...shown);

  const W = 560, H = 250, L = 36, R = 16, TOP = 14, BOT = 26;
  const bw = (W - L - R) / N;
  const Y = (v: number) => TOP + ((top - v) / (top - bot)) * (H - TOP - BOT);
  const limit = mode === "geo" && Math.abs(r) < 1 ? a1 / (1 - r) : NaN;

  const nth = mode === "arith" ? `aₙ = ${n(a1)} + (n − 1)·${n(d)}` : `aₙ = ${n(a1)} · ${n(r)}ⁿ⁻¹`;
  const S = partial[N - 1];
  const sumText = mode === "arith"
    ? `S₁₂ = 12·(${n(terms[0])} + ${n(terms[N - 1])})/2 = ${n(S)}`
    : Math.abs(r - 1) < 1e-9 ? `S₁₂ = 12·${n(a1)} = ${n(S)}` : `S₁₂ = ${n(a1)}·(1 − ${n(r)}¹²)/(1 − ${n(r)}) = ${n(S)}`;

  return (
    <Figure
      title={tx(t, "figSeq_title", "Sequences and their sums")}
      head={<>
        <Choice value={mode} onChange={setMode} options={[["arith", tx(t, "figSeq_arith", "arithmetic")], ["geo", tx(t, "figSeq_geo", "geometric")]] as const} />
        <Btn active={sums} onClick={() => setSums(v => !v)}>{tx(t, "figSeq_sums", "running sum")}</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label="a₁" value={a1} min={-3} max={5} step={0.5} onChange={setA1} fmt={n} />
          {mode === "arith"
            ? <Slider label="d" value={d} min={-2} max={3} step={0.5} onChange={setD} fmt={n} />
            : <Slider label="r" value={r} min={-1.2} max={1.4} step={0.05} onChange={setR} fmt={n} />}
        </Sliders>
        <Row>
          <Readout color={C.sky}>{nth}</Readout>
          <Readout color={C.amber}>{sumText}</Readout>
          {Number.isFinite(limit) && <Readout color={C.green}>{`S∞ = ${n(a1)}/(1 − ${n(r)}) = ${n(limit)}`}</Readout>}
        </Row>
      </>}
      note={mode === "arith"
        ? tx(t, "figSeq_noteArith", "Each bar is one term; each is d more than the one before, so the tops lie on a straight line. The amber line is the running total a₁ + a₂ + … + aₙ. It curves upward because every new term is bigger than the last (for d > 0), and its value after 12 terms is 12 times the average of the first and last term.")
        : tx(t, "figSeq_noteGeo", "Each bar is r times the one before. With r > 1 the bars explode; with 0 < r < 1 they shrink toward zero and the running total levels off at the green limit a₁/(1 − r); with a negative r the bars alternate in sign. Try r = 0.5 with a₁ = 1: the sums approach 2, the classic 1 + ½ + ¼ + … = 2.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1={L} x2={W - R} y1={Y(0)} y2={Y(0)} stroke={C.axis} strokeWidth={1.2} />
        <T x={L - 6} y={Y(top) + 4} size={8.5} anchor="end" color={C.axis}>{n(top)}</T>
        {bot < 0 && <T x={L - 6} y={Y(bot) + 4} size={8.5} anchor="end" color={C.axis}>{n(bot)}</T>}
        {Number.isFinite(limit) && sums && <>
          <line x1={L} x2={W - R} y1={Y(limit)} y2={Y(limit)} stroke={C.green} strokeDasharray="5 4" />
          <T x={W - R} y={Y(limit) - 5} size={9} anchor="end" color={C.green}>{`${tx(t, "figSeq_limit", "limit")} ${n(limit)}`}</T>
        </>}
        {terms.map((v, i) => {
          const x = L + i * bw + bw * 0.18, y = Math.min(Y(v), Y(0)), h = Math.abs(Y(v) - Y(0));
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw * 0.64} height={Math.max(h, 0.5)} rx={2} fill={v >= 0 ? C.sky : C.red} fillOpacity={0.5} stroke={v >= 0 ? C.sky : C.red} />
              <T x={x + bw * 0.32} y={H - 8} size={8.5} anchor="middle" color={C.muted}>{i + 1}</T>
            </g>
          );
        })}
        {sums && <>
          <polyline points={partial.map((s, i) => `${L + (i + 0.5) * bw},${Y(s)}`).join(" ")} fill="none" stroke={C.amber} strokeWidth={2} />
          {partial.map((s, i) => <circle key={i} cx={L + (i + 0.5) * bw} cy={Y(s)} r={3} fill={C.amber} />)}
        </>}
      </svg>
    </Figure>
  );
}
