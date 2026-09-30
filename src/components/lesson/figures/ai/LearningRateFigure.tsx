"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, plot, fnPath, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Gradient descent on one parameter: the delivery loss as a function of the
// slope w, with b held at its best value 8.5. There it is exactly the parabola
// L(w) = 11 (w − 3.5)² + 0.3, whose derivative is 22 (w − 3.5). Each step
// multiplies the distance to the minimum by r = 1 − 22·η, so the learning
// rate η alone decides whether the steps creep, land in one step, zigzag or
// fly off.

const P = plot({ W: 620, H: 250, x0: -2, x1: 9, y0: -10, y1: 190 });
const WS = 3.5, A = 11, LMIN = 0.3;
const loss = (w: number) => A * (w - WS) ** 2 + LMIN;

/** w₀ = 0, then w ← w − η · L′(w), `steps` times. */
function descend(lr: number, steps: number) {
  const ws = [0];
  for (let k = 0; k < steps; k++) ws.push(ws[k] - lr * 2 * A * (ws[k] - WS));
  return ws;
}

export function LearningRateFigure({ t }: { t?: TrackTranslations }) {
  const [lr, setLr] = useState(0.01);
  const [steps, setSteps] = useState(8);
  const L = (k: string, en: string) => tx(t, `figAiLr_${k}`, en);

  const r = 1 - 2 * A * lr;
  const ws = descend(lr, steps);
  const regime = r > 1e-3 ? L("slow", "creeping: every step keeps the same side, shrinking the gap by r")
    : Math.abs(r) <= 1e-3 ? L("one", "one step: η = 1/22 lands exactly on the minimum")
      : r > -1 + 1e-3 ? L("zig", "zigzag: every step overshoots to the other side, but the gap still shrinks")
        : r >= -1 - 1e-3 ? L("stuck", "stuck: bouncing between two points forever (|r| = 1)")
          : L("div", "diverging: every overshoot is bigger than the last; the loss explodes");
  const inPlot = (w: number) => w >= P.x0 && w <= P.x1 && loss(w) <= P.y1;
  const last = ws[ws.length - 1];

  return (
    <Figure
      title={L("title", "The learning rate decides everything")}
      head={<>{[0.01, 0.03, 0.0455, 0.08, 0.095].map(v => <Btn key={v} active={Math.abs(lr - v) < 1e-4} onClick={() => setLr(v)}>η = {v}</Btn>)}</>}
      controls={<>
        <Sliders>
          <Slider label={L("lr", "learning rate η")} value={lr} min={0.001} max={0.1} step={0.0005} onChange={setLr} fmt={v => f2(v, 4)} />
          <Slider label={L("steps", "steps")} value={steps} min={1} max={25} step={1} onChange={setSteps} fmt={v => `${v}`} />
        </Sliders>
        <Row>
          <Readout>r = 1 − 22η = {f2(r, 3)}</Readout>
          <Readout>w<sub>{steps}</sub> = {Math.abs(last) < 1e6 ? f2(last, 3) : "∞"}</Readout>
          <Readout color={Math.abs(r) < 1 ? C.green : C.red}>L(w<sub>{steps}</sub>) = {loss(last) < 1e6 ? f2(loss(last), 2) : "∞"}</Readout>
        </Row>
        <p className="text-[12.5px] leading-relaxed" style={{ color: Math.abs(r) < 1 - 1e-3 ? "var(--text-main)" : C.red }}>{regime}</p>
      </>}
      note={L("note", "Start at w = 0 and repeat w ← w − η · L′(w). Since L′(w) = 22 (w − 3.5), the gap to the minimum after one step is (1 − 22η) times the gap before. For η < 1/22 ≈ 0.0455 the factor is between 0 and 1: safe but slow. At exactly 1/22 one step is enough. Between 1/22 and 2/22 ≈ 0.0909 the factor is negative: the steps jump across the valley but still converge. Above 2/22 each jump lands higher up the other side, and the loss grows without limit.")}
    >
      <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto" role="img">
        <line x1={0} x2={P.W} y1={P.Y(0)} y2={P.Y(0)} stroke={C.axis} />
        <line x1={P.X(0)} x2={P.X(0)} y1={0} y2={P.H} stroke={C.axis} />
        {[-2, 0, 2, 4, 6, 8].map(x => <T key={x} x={P.X(x)} y={P.Y(0) + 11} size={8} anchor="middle">{x}</T>)}
        <T x={P.W - 6} y={P.Y(0) - 5} size={9} anchor="end" bold color={C.fg}>w</T>
        <T x={P.X(0) + 5} y={11} size={9} bold color={C.fg}>L(w)</T>
        <path d={fnPath(P, loss)} fill="none" stroke={C.purple} strokeWidth={2} />
        <line x1={P.X(WS)} x2={P.X(WS)} y1={P.Y(0)} y2={P.Y(LMIN)} stroke={C.green} strokeDasharray="3 2" />
        {ws.slice(0, -1).map((w, k) => {
          const w2 = ws[k + 1];
          if (!inPlot(w) || !inPlot(w2)) return null;
          return <line key={k} x1={P.X(w)} y1={P.Y(loss(w))} x2={P.X(w2)} y2={P.Y(loss(w2))} stroke={C.amber} strokeWidth={1.3} strokeOpacity={0.8} />;
        })}
        {ws.map((w, k) => inPlot(w) && (
          <circle key={k} cx={P.X(w)} cy={P.Y(loss(w))} r={k === 0 ? 5 : 3.8} fill={k === ws.length - 1 ? C.red : C.amber} stroke="var(--code-bg)" strokeWidth={1} />
        ))}
        {!inPlot(last) && <T x={P.W / 2} y={16} size={10} anchor="middle" bold color={C.red}>{L("out", "the steps have left the plot")} ↑</T>}
      </svg>
    </Figure>
  );
}
