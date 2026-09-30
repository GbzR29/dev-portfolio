"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, C, T, Handle, plot, useDrag, f2 } from "@/components/lesson/kit/figure";
import { DELIVERY, BEST, mse, mseGrad } from "./data";
import { contourPaths, geoLevels } from "./contours";

// ── What this figure shows ────────────────────────────────────────────────────
// Two views of the same model. Left: the deliveries and the line
// y = w·x + b. Right: parameter space, where every point (w, b) is a whole
// line and the contours join lines with equal MSE. The loss is a bowl with one
// lowest point, the least-squares line. Dragging the point on the right moves
// the line on the left; the arrow is the negative gradient, the direction in
// which the loss falls fastest, which gradient descent will follow.

const DATA = plot({ W: 290, H: 250, x0: -0.9, x1: 6.2, y0: -4, y1: 40 });
const PAR = plot({ W: 300, H: 250, x0: -1, x1: 8, y0: -10, y1: 28 });
const OX = 320;                                                // x offset of the right panel
const LEVELS = geoLevels(0.6, 600, 11);

export function LossSurfaceFigure({ t }: { t?: TrackTranslations }) {
  const [wb, setWb] = useState<[number, number]>([1, 20]);
  const [showGrad, setShowGrad] = useState(true);
  const L = (k: string, en: string) => tx(t, `figAiLoss_${k}`, en);
  const [w, b] = wb;
  const loss = mse(DELIVERY, w, b), [gw, gb] = mseGrad(DELIVERY, w, b);

  const paths = useMemo(() => contourPaths({ X: x => OX + PAR.X(x), Y: PAR.Y }, (x, y) => mse(DELIVERY, x, y), PAR.x0, PAR.x1, PAR.y0, PAR.y1, LEVELS), []);

  const px = OX + PAR.X(w), py = PAR.Y(b);
  const drag = useDrag<"p">(
    p => (Math.hypot(p.x - px, p.y - py) < 22 ? "p" : null),
    (_, p) => {
      const q = PAR.inv({ x: p.x - OX, y: p.y });
      setWb([Math.min(Math.max(q.x, PAR.x0), PAR.x1), Math.min(Math.max(q.y, PAR.y0), PAR.y1)]);
    },
  );
  // Arrow along −∇L, drawn with a fixed on-screen length (the gradient's size is in the readout)
  const gx = -gw * PAR.sx, gy = gb * PAR.sy, gl = Math.hypot(gx, gy) || 1;

  return (
    <Figure
      title={L("title", "The loss surface: every point is a whole line")}
      head={<>
        <Btn active={showGrad} onClick={() => setShowGrad(v => !v)}>{showGrad ? "☑" : "☐"} −∇L</Btn>
        <Btn onClick={() => setWb([BEST.w, BEST.b])}>{L("min", "go to the minimum")}</Btn>
      </>}
      controls={<Row>
        <Readout>w = {f2(w, 2)}</Readout>
        <Readout>b = {f2(b, 2)}</Readout>
        <Readout color={loss < 0.35 ? C.green : C.amber}>L = MSE = {f2(loss, 2)}</Readout>
        <Readout color={C.red}>∂L/∂w = {f2(gw, 1)}</Readout>
        <Readout color={C.red}>∂L/∂b = {f2(gb, 1)}</Readout>
      </Row>}
      note={L("note", "Drag the orange point in the right panel: its coordinates are the slope w and intercept b of the line on the left. Each contour joins parameter pairs with the same loss (levels grow ×2 outward, from 0.6 to 600). The bowl is long and thin because the loss is much more sensitive to w than to b: changing w tilts every prediction, by up to 5 km × Δw. The red arrow points along −∇L = −(∂L/∂w, ∂L/∂b), downhill; at the minimum (w = 3.5, b = 8.5) both partial derivatives are 0.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${OX + PAR.W + 8} ${PAR.H + 18}`} className="w-full h-auto" role="img">
        {/* Left: data and the line */}
        <line x1={DATA.X(0)} x2={DATA.X(0)} y1={0} y2={DATA.H} stroke={C.axis} />
        <line x1={0} x2={DATA.W} y1={DATA.Y(0)} y2={DATA.Y(0)} stroke={C.axis} />
        {[1, 2, 3, 4, 5, 6].map(x => <T key={x} x={DATA.X(x)} y={DATA.Y(0) + 11} size={7.5} anchor="middle">{x}</T>)}
        {[10, 20, 30].map(y => <T key={y} x={DATA.X(0) - 3} y={DATA.Y(y) + 3} size={7.5} anchor="end">{y}</T>)}
        <line x1={DATA.X(DATA.x0)} y1={DATA.Y(w * DATA.x0 + b)} x2={DATA.X(DATA.x1)} y2={DATA.Y(w * DATA.x1 + b)} stroke={C.amber} strokeWidth={2} />
        {DELIVERY.map(([x, y], i) => (
          <g key={i}>
            <line x1={DATA.X(x)} x2={DATA.X(x)} y1={DATA.Y(y)} y2={DATA.Y(w * x + b)} stroke={C.red} strokeWidth={1.3} />
            <circle cx={DATA.X(x)} cy={DATA.Y(y)} r={4.5} fill={C.sky} />
          </g>
        ))}
        <T x={DATA.W / 2} y={DATA.H + 14} size={8.5} anchor="middle">{L("data", "data: km → minutes")}</T>
        {/* Right: parameter space */}
        <rect x={OX} y={0} width={PAR.W} height={PAR.H} fill="none" stroke={C.grid} />
        {paths.map(({ d }, i) => <path key={i} d={d} fill="none" stroke={C.purple} strokeOpacity={0.25 + 0.6 * (1 - i / LEVELS.length)} strokeWidth={1} />)}
        <line x1={OX + PAR.X(0)} x2={OX + PAR.X(0)} y1={0} y2={PAR.H} stroke={C.axis} strokeWidth={0.8} />
        <line x1={OX} x2={OX + PAR.W} y1={PAR.Y(0)} y2={PAR.Y(0)} stroke={C.axis} strokeWidth={0.8} />
        {[2, 4, 6, 8].map(x => <T key={x} x={OX + PAR.X(x)} y={PAR.Y(0) + 11} size={7.5} anchor="middle">{x}</T>)}
        {[10, 20].map(y => <T key={y} x={OX + PAR.X(0) - 3} y={PAR.Y(y) + 3} size={7.5} anchor="end">{y}</T>)}
        <T x={OX + PAR.W - 4} y={PAR.Y(0) - 4} size={8.5} anchor="end" bold color={C.fg}>w</T>
        <T x={OX + PAR.X(0) + 5} y={10} size={8.5} bold color={C.fg}>b</T>
        <circle cx={OX + PAR.X(BEST.w)} cy={PAR.Y(BEST.b)} r={3.5} fill={C.green} />
        {showGrad && gl > 1e-6 && Math.hypot(gw, gb) > 0.05 && (
          <line x1={px} y1={py} x2={px + (gx / gl) * 38} y2={py + (gy / gl) * 38} stroke={C.red} strokeWidth={2} markerEnd="url(#ai-loss-arrow)" />
        )}
        <defs>
          <marker id="ai-loss-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.red} />
          </marker>
        </defs>
        <Handle x={px} y={py} color={C.amber} active={drag.dragging === "p"} />
        <T x={OX + PAR.W / 2} y={PAR.H + 14} size={8.5} anchor="middle">{L("params", "parameters: (w, b), contours of the loss")}</T>
      </svg>
    </Figure>
  );
}
