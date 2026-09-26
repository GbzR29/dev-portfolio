"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Completing the square as a picture. x² + b·x is an x-by-x square plus a
// strip x wide and b long. Cut the strip in half and put one half on the
// right and one below: the shape is almost a square of side x + b/2, missing
// only a corner of (b/2)². So x² + bx = (x + b/2)² − (b/2)². Solving
// x² + bx = k then only needs a square root.

const n = (v: number) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(3)).toString().replace("-", "−");

export function CompleteSquareFigure({ t }: { t?: TrackTranslations }) {
  const [b, setB] = useState(6);
  const [x, setX] = useState(4);
  const [split, setSplit] = useState(true);
  const [fill, setFill] = useState(false);

  const W = 560, H = 260, S = 22, X0 = 40, Y0 = 24;
  const h = b / 2;
  const box = (x0: number, y0: number, w: number, hh: number, col: string, label: string, dashed = false, key?: string) => (
    <g key={key}>
      <rect x={x0} y={y0} width={w * S} height={hh * S} fill={col} fillOpacity={dashed ? 0.08 : 0.24} stroke={col} strokeWidth={1.4} strokeDasharray={dashed ? "4 3" : undefined} />
      {w * S > 26 && hh * S > 14 && <T x={x0 + (w * S) / 2} y={y0 + (hh * S) / 2 + 4} size={10} anchor="middle" color={col} bold>{label}</T>}
    </g>
  );

  return (
    <Figure
      title={tx(t, "figCSq_title", "Completing the square")}
      head={<>
        <Btn active={split} onClick={() => setSplit(v => !v)}>{tx(t, "figCSq_split", "split the strip")}</Btn>
        <Btn active={fill} onClick={() => setFill(v => !v)}>{tx(t, "figCSq_fill", "add the corner")}</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label="b" value={b} min={1} max={8} step={1} onChange={setB} fmt={n} />
          <Slider label="x" value={x} min={1} max={6} step={0.5} onChange={setX} fmt={n} />
        </Sliders>
        <Row>
          <Readout>{`x² + ${n(b)}x = (x + ${n(h)})² − ${n(h * h)}`}</Readout>
          <Readout color={C.amber}>{`x = ${n(x)}: ${n(x * x + b * x)} = ${n((x + h) ** 2)} − ${n(h * h)}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figCSq_note", "The purple square is x², the blue strip is b·x. Split the strip into two halves of b/2 and move one below the square: you get an L shape that is a big square of side x + b/2 with one corner missing. The missing corner is (b/2)², so x² + bx equals the big square minus that corner. Adding the corner to both sides of an equation is exactly the step called completing the square.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {box(X0, Y0, x, x, C.purple, "x²")}
        {split ? <>
          {box(X0 + x * S, Y0, h, x, C.sky, `${n(h)}x`)}
          {box(X0, Y0 + x * S, x, h, C.sky, `${n(h)}x`)}
          {box(X0 + x * S, Y0 + x * S, h, h, C.amber, `${n(h * h)}`, !fill)}
          <T x={X0 + ((x + h) * S) / 2} y={Y0 - 8} size={10} anchor="middle" color={C.fg}>{`x + ${n(h)}`}</T>
          <line x1={X0} x2={X0 + (x + h) * S} y1={Y0 - 4} y2={Y0 - 4} stroke={C.axis} />
          {!fill && <T x={X0 + (x + h) * S + 8} y={Y0 + (x + h / 2) * S + 4} size={9.5} color={C.amber}>{tx(t, "figCSq_missing", "← missing (b/2)²")}</T>}
        </> : <>
          {box(X0 + x * S, Y0, b, x, C.sky, `${n(b)}x`)}
          <T x={X0 + (x * S) / 2} y={Y0 - 8} size={10} anchor="middle" color={C.fg}>x</T>
          <T x={X0 + (x + b / 2) * S} y={Y0 - 8} size={10} anchor="middle" color={C.fg}>{n(b)}</T>
        </>}
        <T x={X0 - 8} y={Y0 + (x * S) / 2 + 4} size={10} anchor="end" color={C.fg}>x</T>
      </svg>
    </Figure>
  );
}
