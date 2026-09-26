"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Handle, plot, Grid, fnPath, useDrag, nearest, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A polynomial built from its roots: p(x) = a(x − r₁)(x − r₂)…(x − rₙ).
// Drag the roots along the x axis; the curve always passes through zero at
// each of them. Where two roots meet (a double root) the curve touches the
// axis instead of crossing it. The expanded form shows the coefficients the
// factors multiply out to, and the leading coefficient a with the degree
// decides where the ends of the curve go.

const n = (v: number) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(2)).toString().replace("-", "−");
const SUP = ["", "", "²", "³", "⁴"];

/** Coefficients (highest power first) of a·∏(x − r). */
function expand(a: number, roots: number[]) {
  let c = [a];
  for (const r of roots) {
    const next = new Array(c.length + 1).fill(0);
    c.forEach((v, i) => { next[i] += v; next[i + 1] -= v * r; });
    c = next;
  }
  return c;
}

function expandedText(c: number[]) {
  const deg = c.length - 1;
  const parts: string[] = [];
  c.forEach((v, i) => {
    const p = deg - i;
    if (Math.abs(v) < 1e-9) return;
    const abs = Math.abs(v);
    const coef = abs === 1 && p > 0 ? "" : n(abs);
    const body = `${coef}${p > 0 ? "x" : ""}${SUP[p] ?? ""}`;
    parts.push(parts.length ? `${v < 0 ? " − " : " + "}${body}` : `${v < 0 ? "−" : ""}${body}`);
  });
  return parts.join("") || "0";
}

export function PolynomialFigure({ t }: { t?: TrackTranslations }) {
  const [deg, setDeg] = useState<"1" | "2" | "3" | "4">("3");
  const [all, setAll] = useState([-2.5, 0.5, 2.5, 4]);
  const [a, setA] = useState(0.5);
  const roots = all.slice(0, Number(deg));
  const p = plot({ W: 560, H: 280, x0: -5.5, x1: 5.5, y0: -5.5, y1: 5.5 });

  const drag = useDrag<number>(
    q => nearest(q, roots.map((r, i) => [i, { x: p.X(r), y: p.Y(0) }] as [number, { x: number; y: number }]), 20),
    (i, q) => setAll(old => old.map((r, j) => (j === i ? clamp(Math.round(p.inv(q).x * 4) / 4, -5, 5) : r))));

  const f = (x: number) => roots.reduce((acc, r) => acc * (x - r), a);
  const coef = expand(a, roots);
  const factored = `${a === 1 ? "" : n(a)}${roots.map(r => `(x ${r < 0 ? "+" : "−"} ${n(Math.abs(r))})`).join("")}`;
  const counts = new Map<number, number>();
  roots.forEach(r => counts.set(r, (counts.get(r) ?? 0) + 1));
  const d = roots.length;
  const leftUp = (d % 2 === 0) === (a > 0);
  const rightUp = a > 0;

  return (
    <Figure
      title={tx(t, "figPoly_title", "A polynomial from its roots")}
      head={<Choice value={deg} onChange={setDeg} options={[["1", tx(t, "figPoly_d1", "degree 1")], ["2", "2"], ["3", "3"], ["4", "4"]] as const} />}
      controls={<>
        <Slider label={tx(t, "figPoly_lead", "leading a")} value={a} min={-1.5} max={1.5} step={0.05} onChange={v => setA(Math.abs(v) < 0.05 ? 0.05 : v)} fmt={n} />
        <Row>
          <Readout color={C.amber}>p(x) = {factored}</Readout>
          <Readout>= {expandedText(coef)}</Readout>
        </Row>
        <Row>
          <Readout color={C.muted}>{`${tx(t, "figPoly_ends", "ends:")} ${leftUp ? "↖" : "↙"} … ${rightUp ? "↗" : "↘"}`}</Readout>
          {[...counts].filter(([, k]) => k > 1).map(([r, k]) => (
            <Readout key={r} color={C.pink}>{`x = ${n(r)}: ${k === 2 ? tx(t, "figPoly_double", "double root, touches") : tx(t, "figPoly_multi", "root of multiplicity") + " " + k}`}</Readout>
          ))}
        </Row>
      </>}
      note={tx(t, "figPoly_note", "Each amber handle is a root: drag it along the axis and the curve follows, always passing through zero there, because one factor (x − r) becomes 0. Drag two roots onto the same spot: the curve now touches the axis and turns back instead of crossing it (a double root). Change the degree and the sign of a to see the ends: an even degree sends both ends the same way, an odd degree sends them opposite ways. The expanded form below the factored one is the same polynomial multiplied out.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
        <Grid p={p} step={1} />
        <path d={fnPath(p, f, p.x0, p.x1, 400)} fill="none" stroke={C.sky} strokeWidth={2.4} />
        {roots.map((r, i) => <Handle key={i} x={p.X(r)} y={p.Y(0)} color={(counts.get(r) ?? 0) > 1 ? C.pink : C.amber} active={drag.dragging === i} />)}
        <T x={p.X(0) + 6} y={p.Y(clamp(f(0), p.y0, p.y1)) - 6} size={9} color={C.muted}>{`p(0) = ${n(f(0))}`}</T>
      </svg>
    </Figure>
  );
}
