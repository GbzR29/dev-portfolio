"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Btn, Choice, C, T, plot, useDrag, nearest, clamp, f2, Handle } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A scatter plot of draggable points. "Least squares" draws the line
// ŷ = a + bx that minimises the sum of squared residuals: each residual is
// the vertical gap from a point to the line, and its square is drawn as a
// square with that gap as its side. "Your line" gives the line two
// handles to move by hand; try to make the total area of the squares, SSE,
// as small as the least-squares value. The readouts show the correlation r,
// the slope and intercept, SSE and R² = 1 − SSE/SST.

type Pt = [number, number];
type Mode = "ls" | "mine";
const PRESETS: Record<string, Pt[]> = {
  positive: [[1, 1.8], [2, 2.6], [3, 3.1], [4, 4.4], [5, 4.6], [6, 5.9], [7, 6.2], [8, 7.5], [9, 7.9]],
  negative: [[1, 8.2], [2, 7.9], [3, 6.4], [4, 6.6], [5, 5.1], [6, 4.2], [7, 4.4], [8, 2.9], [9, 2.2]],
  none: [[1, 5.5], [2, 3.2], [3, 7.1], [4, 4.8], [5, 6.3], [6, 3.9], [7, 6.8], [8, 4.1], [9, 5.6]],
  curve: [[1, 8.5], [2, 5.8], [3, 3.9], [4, 2.8], [5, 2.5], [6, 2.9], [7, 3.8], [8, 5.9], [9, 8.4]],
  outlier: [[1, 2], [2, 2.4], [3, 3.1], [4, 3.3], [5, 4.1], [6, 4.4], [7, 5.1], [8, 5.3], [9, 0.8]],
};
type Preset = keyof typeof PRESETS;
const W = 560, H = 330;

/** Least-squares slope, intercept and correlation from the sums of the chapter. */
function fit(ps: Pt[]) {
  const n = ps.length, mx = ps.reduce((s, p) => s + p[0], 0) / n, my = ps.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of ps) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  const b = sxx ? sxy / sxx : 0;
  return { mx, my, b, a: my - b * mx, r: sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0, sst: syy };
}

export function RegressionFigure({ t }: { t?: TrackTranslations }) {
  const [pts, setPts] = useState<Pt[]>(PRESETS.positive);
  const [preset, setPresetRaw] = useState<Preset | "">("positive");
  const [mode, setMode] = useState<Mode>("ls");
  const [mine, setMine] = useState<[number, number]>([3, 6]); // heights of your line at x = 1 and x = 9
  const [squares, setSquares] = useState(true);
  const setPreset = (k: Preset) => { setPresetRaw(k); setPts(PRESETS[k]); };

  const pl = plot({ W, H, x0: 0, x1: 10, y0: 0, y1: 10 });
  const F = fit(pts);
  const [a, b] = mode === "ls" ? [F.a, F.b] : [mine[0] - (mine[1] - mine[0]) / 8, (mine[1] - mine[0]) / 8];
  const line = (x: number) => a + b * x;
  const sse = pts.reduce((s, [x, y]) => s + (y - line(x)) ** 2, 0);
  const sseLs = pts.reduce((s, [x, y]) => s + (y - F.a - F.b * x) ** 2, 0);

  type Id = number | "h0" | "h1";
  const drag = useDrag<Id>(
    q => {
      const cands: [Id, { x: number; y: number }][] = pts.map((p, i) => [i, { x: pl.X(p[0]), y: pl.Y(p[1]) }]);
      if (mode === "mine") cands.push(["h0", { x: pl.X(1), y: pl.Y(mine[0]) }], ["h1", { x: pl.X(9), y: pl.Y(mine[1]) }]);
      return nearest(q, cands, 16);
    },
    (id, q) => {
      const w = pl.inv(q), y = clamp(w.y, 0, 10);
      if (id === "h0") setMine(m => [y, m[1]]);
      else if (id === "h1") setMine(m => [m[0], y]);
      else { setPresetRaw(""); setPts(ps => ps.map((p, j) => (j === id ? [clamp(w.x, 0.2, 9.8), y] : p))); }
    },
  );

  return (
    <Figure
      title={tx(t, "figReg_title", "Least squares: fitting a line")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["ls", tx(t, "figReg_ls", "least squares")],
        ["mine", tx(t, "figReg_mine", "your line")],
      ]} />}
      controls={<>
        <Row><Choice value={preset as Preset} onChange={setPreset} options={[
          ["positive", tx(t, "figReg_positive", "rising")],
          ["negative", tx(t, "figReg_negative", "falling")],
          ["none", tx(t, "figReg_none", "no relation")],
          ["curve", tx(t, "figReg_curve", "curve")],
          ["outlier", tx(t, "figReg_outlier", "one outlier")],
        ]} /></Row>
        <Row>
          <Btn active={squares} onClick={() => setSquares(v => !v)}>{tx(t, "figReg_squares", "show squared residuals")}</Btn>
          <Btn onClick={() => { setPresetRaw(""); setPts(ps => (ps.length < 20 ? [...ps, [0.5 + 9 * Math.random(), 1 + 8 * Math.random()]] : ps)); }}>{tx(t, "figReg_add", "add a point")}</Btn>
          <Btn onClick={() => { setPresetRaw(""); setPts(ps => (ps.length > 3 ? ps.slice(0, -1) : ps)); }}>{tx(t, "figReg_remove", "remove a point")}</Btn>
        </Row>
        <Row>
          <Readout color={C.blue}>{`ŷ = ${f2(a)} ${b < 0 ? "−" : "+"} ${f2(Math.abs(b))}x`}</Readout>
          <Readout color={C.purple}>{`r = ${f2(F.r, 3)}`}</Readout>
          <Readout color={C.amber}>{`SSE = ${f2(sse)}${mode === "mine" ? `  (${tx(t, "figReg_best", "best")} ${f2(sseLs)})` : ""}`}</Readout>
          <Readout>{`R² = 1 − SSE/SST = ${f2(1 - sse / (F.sst || 1), 3)}`}</Readout>
        </Row>
      </>}
      note={<>
        {tx(t, "figReg_note", "The least-squares line always passes through the point of means (x̄, ȳ), marked by the cross. On \"curve\" r is close to 0 although x and y are closely related: r only measures straight-line association. On \"one outlier\" a single point drags the whole line. In \"your line\" no position of the handles beats the least-squares SSE.")}{" "}
        <span data-mouse-only>{tx(t, "figReg_drag", "Drag the points (and, in \"your line\", the two blue handles).")}</span>
        <span data-touch-only>{tx(t, "figReg_dragTouch", "Drag the points (and, in \"your line\", the two blue handles).")}</span>
      </>}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-move">
        {[0, 2, 4, 6, 8, 10].map(v => <g key={v}>
          <line x1={pl.X(v)} x2={pl.X(v)} y1={0} y2={H} stroke={C.grid} strokeWidth={0.6} />
          <line x1={0} x2={W} y1={pl.Y(v)} y2={pl.Y(v)} stroke={C.grid} strokeWidth={0.6} />
          <T x={pl.X(v) + 3} y={H - 4} color={C.axis} size={8.5}>{v}</T>
        </g>)}
        {squares && pts.map(([x, y], i) => {
          const e = y - line(x), side = Math.abs(e) * pl.sy;
          return <rect key={i} x={pl.X(x)} y={Math.min(pl.Y(y), pl.Y(line(x)))} width={side} height={side}
            fill={C.amber} opacity={0.18} stroke={C.amber} strokeWidth={0.8} />;
        })}
        {pts.map(([x, y], i) => <line key={i} x1={pl.X(x)} x2={pl.X(x)} y1={pl.Y(y)} y2={pl.Y(line(x))} stroke={C.amber} strokeWidth={1.4} />)}
        <line x1={pl.X(0)} x2={pl.X(10)} y1={pl.Y(line(0))} y2={pl.Y(line(10))} stroke={C.blue} strokeWidth={2.2} />
        {mode === "mine" && <line x1={pl.X(0)} x2={pl.X(10)} y1={pl.Y(F.a)} y2={pl.Y(F.a + 10 * F.b)} stroke={C.blue} strokeWidth={1} strokeDasharray="4 5" opacity={0.5} />}
        <g stroke={C.purple} strokeWidth={1.5}>
          <line x1={pl.X(F.mx) - 7} x2={pl.X(F.mx) + 7} y1={pl.Y(F.my)} y2={pl.Y(F.my)} />
          <line x1={pl.X(F.mx)} x2={pl.X(F.mx)} y1={pl.Y(F.my) - 7} y2={pl.Y(F.my) + 7} />
        </g>
        <T x={pl.X(F.mx) + 8} y={pl.Y(F.my) - 8} color={C.purple}>{"(x̄, ȳ)"}</T>
        {pts.map(([x, y], i) => <circle key={i} cx={pl.X(x)} cy={pl.Y(y)} r={4.5} fill={C.fg} opacity={drag.dragging === i ? 1 : 0.8} />)}
        {mode === "mine" && <>
          <Handle x={pl.X(1)} y={pl.Y(mine[0])} color={C.blue} active={drag.dragging === "h0"} />
          <Handle x={pl.X(9)} y={pl.Y(mine[1])} color={C.blue} active={drag.dragging === "h1"} />
        </>}
      </svg>
    </Figure>
  );
}
