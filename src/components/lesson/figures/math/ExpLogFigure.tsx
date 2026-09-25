"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, plot, Grid, fnPath, useDrag, clamp, type Plot } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// mirror   — y = bˣ and y = log_b(x) are reflections of each other across the
//            line y = x, because each undoes the other. Drag the point on the
//            exponential; its mirror image lies on the logarithm.
// compound — why e ≈ 2.71828 is special: growing by 100% in one year, split
//            into n compounding steps, gives (1 + 1/n)ⁿ, which approaches e as
//            n grows. The staircase approaches the smooth curve eˣ.

/** Compound growth with n steps per year over two years, as an SVG path. */
function staircase(pc: Plot, n: number) {
  let d = `M${pc.X(0)},${pc.Y(1)}`, v = 1;
  for (let k = 0; k < 2 * n; k++) {
    const x1 = (k + 1) / n;
    d += ` L${pc.X(x1)},${pc.Y(v)}`;
    v *= 1 + 1 / n;
    d += ` L${pc.X(x1)},${pc.Y(v)}`;
  }
  return d;
}

export function ExpLogFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"mirror" | "compound">("mirror");
  const [base, setBase] = useState(2);
  const [px, setPx] = useState(1.5);
  const [n, setN] = useState(4);

  const p = plot({ W: 560, H: 300, x0: -4.2, x1: 6.2, y0: -3, y1: 6.2 });
  const lb = Math.log(base);
  const expF = (x: number) => base ** x;
  const logF = (x: number) => (x > 0 ? Math.log(x) / lb : NaN);
  const py = expF(px);
  const drag = useDrag<"p">(q => (Math.hypot(q.x - p.X(px), q.y - p.Y(py)) < 16 ? "p" : null),
    (_, q) => setPx(clamp(p.inv(q).x, -4, Math.log(6) / lb)));

  // compound: over x ∈ [0, 2] years, n steps per year
  const pc = plot({ W: 560, H: 300, x0: -0.1, x1: 2.1, y0: -0.4, y1: 8 });
  const stair = staircase(pc, n);
  const oneYear = (1 + 1 / n) ** n;

  return (
    <Figure
      title={tx(t, "figExp_title", "Exponentials and logarithms")}
      head={<Choice value={mode} onChange={setMode} options={[["mirror", tx(t, "figExp_mirror", "bˣ and log_b x")], ["compound", tx(t, "figExp_compound", "where e comes from")]] as const} />}
      controls={mode === "mirror" ? <>
        <Slider label={tx(t, "figExp_base", "base b")} value={base} min={1.1} max={5} step={0.05} onChange={setBase} width="w-20" />
        <Row>
          <Readout color={C.sky}>{base.toFixed(2)}^{px.toFixed(2)} = {py.toFixed(3)}</Readout>
          <Readout color={C.amber}>log_{base.toFixed(2)}({py.toFixed(3)}) = {px.toFixed(2)}</Readout>
          <Readout>{tx(t, "figExp_doubling", "multiplies by b every +1 in x")}</Readout>
        </Row>
      </> : <>
        <Slider label={tx(t, "figExp_steps", "steps per year n")} value={n} min={1} max={60} step={1} onChange={setN} fmt={v => `${v}`} width="w-32" />
        <Row>
          <Readout>(1 + 1/{n})^{n} = {oneYear.toFixed(5)}</Readout>
          <Readout color={C.green}>e = 2.71828…</Readout>
          <Readout color={C.muted}>{tx(t, "figExp_gap", "gap")} {(Math.E - oneYear).toFixed(5)}</Readout>
        </Row>
      </>}
      note={mode === "mirror"
        ? tx(t, "figExp_noteMirror", "Drag the blue point along bˣ. Swapping its coordinates, (x, y) → (y, x), reflects it across the dashed line y = x, and the reflected point always lands on the amber logarithm: log_b undoes b to the power of. The exponential passes through (0, 1) for every base because b⁰ = 1, the logarithm through (1, 0). The exponential is always positive, so the logarithm only exists for positive inputs. Every step of +1 to the right multiplies the exponential's height by b: slow at first, then explosive.")
        : tx(t, "figExp_noteCompound", "Start with 1 and grow by 100% per year. Adding the whole 100% once gives 2. Adding 50% twice (compounding) gives 1.5 × 1.5 = 2.25, because the second half-step grows the first one's gain too. Four steps of 25% give 2.44, twelve monthly steps 2.61. More, smaller steps approach a limit: e = 2.71828…, the result of growing continuously. The staircase approaches the smooth curve eˣ, which is the only exponential whose slope at every point equals its own height.")}
    >
      {mode === "mirror" ? (
        <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
          <Grid p={p} step={1} />
          <line x1={p.X(-3)} y1={p.Y(-3)} x2={p.X(6.2)} y2={p.Y(6.2)} stroke={C.muted} strokeDasharray="5 4" />
          <path d={fnPath(p, expF, p.x0, p.x1, 400)} fill="none" stroke={C.sky} strokeWidth={2.4} />
          <path d={fnPath(p, logF, 0.001, p.x1, 600)} fill="none" stroke={C.amber} strokeWidth={2.4} />
          <line x1={p.X(px)} y1={p.Y(py)} x2={p.X(py)} y2={p.Y(px)} stroke={C.fg} strokeDasharray="2 3" opacity={0.6} />
          <circle cx={p.X(py)} cy={p.Y(px)} r={5} fill={C.amber} />
          <circle cx={p.X(px)} cy={p.Y(py)} r={9} fill={C.sky} opacity={0.2} />
          <circle cx={p.X(px)} cy={p.Y(py)} r={5.5} fill={C.sky} />
          <T x={p.X(-4)} y={p.Y(5.7)} size={10} color={C.sky}>{`y = ${base.toFixed(2)}ˣ`}</T>
          <T x={p.X(3.6)} y={p.Y(-1.2)} size={10} color={C.amber}>{`y = log_${base.toFixed(2)} x`}</T>
          <T x={p.X(4.2)} y={p.Y(5.2)} size={9}>y = x</T>
        </svg>
      ) : (
        <svg viewBox={`0 0 ${pc.W} ${pc.H}`} className="w-full h-auto">
          <Grid p={pc} step={0.25} major={1} labels={false} />
          {[1, 2, 3, 4, 5, 6, 7].map(y => <T key={y} x={pc.X(0) - 4} y={pc.Y(y) + 3} size={8} anchor="end">{`${y}`}</T>)}
          {[1, 2].map(x => <T key={x} x={pc.X(x)} y={pc.Y(0) + 12} size={8} anchor="middle">{`${x} ${tx(t, "figExp_year", "yr")}`}</T>)}
          <path d={fnPath(pc, Math.exp, 0, 2, 200)} fill="none" stroke={C.green} strokeWidth={2} />
          <path d={stair} fill="none" stroke={C.sky} strokeWidth={1.8} />
          <line x1={pc.X(1)} x2={pc.X(1)} y1={pc.Y(0)} y2={pc.Y(Math.E)} stroke={C.muted} strokeDasharray="3 3" />
          <circle cx={pc.X(1)} cy={pc.Y(oneYear)} r={4.5} fill={C.sky} />
          <circle cx={pc.X(1)} cy={pc.Y(Math.E)} r={4.5} fill="none" stroke={C.green} strokeWidth={2} />
          <T x={pc.X(1.03)} y={pc.Y(Math.E) - 6} size={9} color={C.green}>e</T>
        </svg>
      )}
    </Figure>
  );
}
