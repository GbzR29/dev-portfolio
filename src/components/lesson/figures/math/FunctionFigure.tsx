"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, plot, Grid, fnPath, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Every graph transformation is one of four knobs in y = a·f(b·(x − c)) + d:
//   c shifts right, d shifts up, a stretches vertically (negative flips it),
//   b squeezes horizontally (negative mirrors it). The dashed curve is the
//   untouched f; the solid one is the transformed version.

const BASES: Record<string, { f: (x: number) => number; label: string }> = {
  square: { f: x => x * x, label: "x²" },
  cube: { f: x => x * x * x, label: "x³" },
  abs: { f: x => Math.abs(x), label: "|x|" },
  sqrt: { f: x => (x >= 0 ? Math.sqrt(x) : NaN), label: "√x" },
  sin: { f: x => Math.sin(x), label: "sin x" },
  recip: { f: x => (Math.abs(x) < 1e-3 ? NaN : 1 / x), label: "1/x" },
  step: { f: x => (x < 0 ? 0 : 1), label: "step(x)" },
  smooth: { f: x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); }, label: "smoothstep(x)" },
};

export function FunctionFigure({ t }: { t?: TrackTranslations }) {
  const [base, setBase] = useState("square");
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [c, setC] = useState(0);
  const [d, setD] = useState(0);
  const p = plot({ W: 560, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
  const f = BASES[base].f;
  const g = (x: number) => a * f(b * (x - c)) + d;
  const sgn = (v: number) => (v < 0 ? "−" : "+");

  return (
    <Figure
      title={tx(t, "figFunc_title", "Moving and stretching a graph")}
      controls={<>
        <Row>{Object.entries(BASES).map(([k, v]) => <Btn key={k} active={base === k} onClick={() => setBase(k)}>{v.label}</Btn>)}</Row>
        <Sliders>
          <Slider label={<span style={{ color: C.red }}>a · {tx(t, "figFunc_vert", "vertical")}</span>} value={a} min={-3} max={3} step={0.05} onChange={setA} width="w-28" />
          <Slider label={<span style={{ color: C.amber }}>b · {tx(t, "figFunc_horiz", "horizontal")}</span>} value={b} min={-3} max={3} step={0.05} onChange={setB} width="w-28" />
          <Slider label={<span style={{ color: C.green }}>c · {tx(t, "figFunc_shiftX", "shift x")}</span>} value={c} min={-5} max={5} step={0.1} onChange={setC} width="w-28" />
          <Slider label={<span style={{ color: C.sky }}>d · {tx(t, "figFunc_shiftY", "shift y")}</span>} value={d} min={-3} max={3} step={0.1} onChange={setD} width="w-28" />
        </Sliders>
        <Row>
          <Readout>y = {f2(a)} · {BASES[base].label.replace("x", `(${f2(b)}(x ${sgn(-c)} ${f2(Math.abs(c))}))`)} {sgn(d)} {f2(Math.abs(d))}</Readout>
          <Btn onClick={() => { setA(1); setB(1); setC(0); setD(0); }}>↻ reset</Btn>
        </Row>
      </>}
      note={tx(t, "figFunc_note", "Move one slider at a time. d and c move the whole curve, up and right; c appears with a minus sign because to see at x what f showed at 0, you need x − c = 0, that is x = c. a scales heights: a = 2 makes it twice as tall, a = −1 flips it upside down. b scales the input: b = 2 makes everything happen twice as fast, so the curve is squeezed to half its width, and b = −1 mirrors it left–right. The same four knobs appear everywhere: a wave's amplitude and frequency, remapping a range, positioning an easing curve.")}
    >
      <svg viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
        <Grid p={p} step={1} />
        <path d={fnPath(p, f, p.x0, p.x1, 600)} fill="none" stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 4" />
        <path d={fnPath(p, g, p.x0, p.x1, 600)} fill="none" stroke={C.pink} strokeWidth={2.4} />
        {/* the image of f's origin point (0, f(0)) */}
        {Number.isFinite(f(0)) && Math.abs(b) > 1e-6 && (
          <g>
            <circle cx={p.X(0)} cy={p.Y(f(0))} r={3.5} fill={C.muted} />
            <circle cx={p.X(c)} cy={p.Y(a * f(0) + d)} r={4.5} fill={C.pink} />
            <line x1={p.X(0)} y1={p.Y(f(0))} x2={p.X(c)} y2={p.Y(a * f(0) + d)} stroke={C.pink} strokeDasharray="2 3" opacity={0.6} />
          </g>
        )}
        <T x={8} y={14} size={9} color={C.muted}>{`- - f(x) = ${BASES[base].label}`}</T>
        <T x={8} y={27} size={9} color={C.pink}>{tx(t, "figFunc_trans", "—— transformed")}</T>
      </svg>
    </Figure>
  );
}
