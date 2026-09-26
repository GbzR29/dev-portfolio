"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, plot, Grid, fnPath, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The area between a curve and the x-axis from a to b, approximated by n
// strips of width Δx = (b − a)/n. Each strip's height is read from the curve
// at its left edge, right edge or midpoint; the trapezoid rule joins the two
// edge heights with a slanted top instead. Strips below the axis count as
// negative (red). As n grows, every rule converges on the exact area, the
// definite integral; the midpoint and trapezoid rules get there much faster.

type Rule = "left" | "right" | "mid" | "trap";
type Fn = { key: string; label: string; f: (x: number) => number; a: number; b: number; exact: number; exactLabel: string; view: [number, number, number, number] };

const W = 560, H = 280;
const FNS: Fn[] = [
  { key: "sq", label: "x² on [0, 2]", f: x => x * x, a: 0, b: 2, exact: 8 / 3, exactLabel: "8/3", view: [-0.25, 2.3, -0.5, 4.5] },
  { key: "sin", label: "sin x on [0, π]", f: Math.sin, a: 0, b: Math.PI, exact: 2, exactLabel: "2", view: [-0.25, 3.5, -0.3, 1.3] },
  { key: "signed", label: "x³ − x on [−1, 1.5]", f: x => x ** 3 - x, a: -1, b: 1.5, exact: 25 / 64, exactLabel: "25/64", view: [-1.3, 1.8, -0.8, 2] },
  { key: "recip", label: "1/x on [1, 4]", f: x => 1 / x, a: 1, b: 4, exact: Math.log(4), exactLabel: "ln 4", view: [-0.2, 4.3, -0.2, 1.3] },
];
const n5 = (v: number) => f2(v, 5).replace("-", "−");

/** The rule's estimate plus the polygons to draw. */
function strips(fn: Fn, n: number, rule: Rule) {
  const dx = (fn.b - fn.a) / n, out: { x0: number; x1: number; h0: number; h1: number }[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = fn.a + i * dx, x1 = x0 + dx;
    let h0: number, h1: number;
    if (rule === "trap") { h0 = fn.f(x0); h1 = fn.f(x1); }
    else { const h = fn.f(rule === "left" ? x0 : rule === "right" ? x1 : x0 + dx / 2); h0 = h1 = h; }
    sum += ((h0 + h1) / 2) * dx;
    out.push({ x0, x1, h0, h1 });
  }
  return { dx, sum, out };
}

export function RiemannFigure({ t }: { t?: TrackTranslations }) {
  const [rule, setRule] = useState<Rule>("left");
  const [key, setKey] = useState("sq");
  const [n, setN] = useState(6);

  const fn = FNS.find(e => e.key === key)!;
  const [x0, x1, y0, y1] = fn.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const { dx, sum, out } = strips(fn, n, rule);
  const err = sum - fn.exact;

  return (
    <Figure
      title={tx(t, "figRie_title", "Area by thin strips")}
      head={<Choice value={rule} onChange={setRule} options={[
        ["left", tx(t, "figRie_left", "left")],
        ["right", tx(t, "figRie_right", "right")],
        ["mid", tx(t, "figRie_mid", "midpoint")],
        ["trap", tx(t, "figRie_trap", "trapezoid")],
      ] as const} />}
      controls={<>
        <Row>{FNS.map(e => <Btn key={e.key} active={key === e.key} onClick={() => setKey(e.key)}>{e.label}</Btn>)}</Row>
        <Slider label={tx(t, "figRie_n", "strips n")} value={n} min={1} max={64} step={1} onChange={setN} fmt={v => String(v)} width="w-16" />
        <Row>
          <Readout>{`Δx = ${n5(dx)}`}</Readout>
          <Readout color={C.sky}>{`${tx(t, "figRie_sum", "sum of strips")} = ${n5(sum)}`}</Readout>
          <Readout color={C.green}>{`${tx(t, "figRie_exact", "exact")} = ${fn.exactLabel} = ${n5(fn.exact)}`}</Readout>
          <Readout color={Math.abs(err) < 1e-3 ? C.green : C.amber}>{`${tx(t, "figRie_err", "error")} = ${err.toExponential(2).replace("-", "−")}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figRie_note", "Each strip is Δx wide; its height is the curve's value at the chosen point, so its area is height × Δx. Blue strips sit above the axis and add; red ones sit below and subtract, so the total is a signed area. Drag n upward: the staircase hugs the curve and the error shrinks. With the left and right rules, doubling n roughly halves the error; with the midpoint and trapezoid rules it divides it by about four, because their over- and under-estimates largely cancel.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <Grid p={pr} step={fn.key === "sq" ? 1 : 0.5} labels major={1} />
        {out.map((s, i) => {
          const pos = s.h0 + s.h1 >= 0, col = pos ? C.sky : C.red;
          return <polygon key={i} points={`${pr.X(s.x0)},${pr.Y(0)} ${pr.X(s.x0)},${pr.Y(s.h0)} ${pr.X(s.x1)},${pr.Y(s.h1)} ${pr.X(s.x1)},${pr.Y(0)}`}
            fill={col} fillOpacity={0.25} stroke={col} strokeWidth={n > 40 ? 0.5 : 1} />;
        })}
        {rule !== "trap" && n <= 32 && out.map((s, i) => {
          const px = rule === "left" ? s.x0 : rule === "right" ? s.x1 : (s.x0 + s.x1) / 2;
          return <circle key={i} cx={pr.X(px)} cy={pr.Y(s.h0)} r={2.6} fill={C.amber} />;
        })}
        <path d={fnPath(pr, fn.f, fn.key === "recip" ? 0.2 : x0)} fill="none" stroke={C.fg} strokeWidth={2} />
        <T x={pr.X(fn.a)} y={pr.Y(0) + 22} color={C.purple} anchor="middle" bold>a</T>
        <T x={pr.X(fn.b)} y={pr.Y(0) + 22} color={C.purple} anchor="middle" bold>b</T>
      </svg>
    </Figure>
  );
}
