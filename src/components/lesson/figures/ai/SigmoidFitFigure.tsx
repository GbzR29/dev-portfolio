"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, plot, fnPath, f2 } from "@/components/lesson/kit/figure";
import { EXAM, sigmoid, crossEntropy } from "./data";

// ── What this figure shows ────────────────────────────────────────────────────
// Six students: hours studied on x, failed (0) or passed (1) on y. The model
// p = σ(w·x + b) is an S-curve from 0 to 1, read as the probability of
// passing. Each student pays −ln of the probability the model gave to what
// really happened, drawn as a bar: small when the curve is near the point,
// huge when the model was confident and wrong. The mean of those costs is the
// cross-entropy loss; "gradient step" moves (w, b) by one step of gradient
// descent on it.

const P = plot({ W: 620, H: 260, x0: -0.2, x1: 7.2, y0: -0.18, y1: 1.18 });
const BEST = { w: 1.2140, b: -4.2491 };
const LR = 0.5;

export function SigmoidFitFigure({ t }: { t?: TrackTranslations }) {
  const [w, setW] = useState(0.5);
  const [b, setB] = useState(-1);
  const L = (k: string, en: string) => tx(t, `figAiSig_${k}`, en);

  const loss = crossEntropy(EXAM, w, b);
  const boundary = w !== 0 ? -b / w : NaN;
  const correct = EXAM.filter(([x, y]) => (sigmoid(w * x + b) >= 0.5) === (y === 1)).length;
  const step = () => {
    let gw = 0, gb = 0;
    for (const [x, y] of EXAM) { const e = sigmoid(w * x + b) - y; gw += e * x; gb += e; }   // (p − y)·x and (p − y)
    setW(w - LR * gw / EXAM.length);
    setB(b - LR * gb / EXAM.length);
  };
  const H = 44;                                          // pixels per unit of −ln p in the cost bars

  return (
    <Figure
      title={L("title", "The sigmoid and the cross-entropy cost")}
      head={<>
        <Btn onClick={step}>{L("step", "gradient step")}</Btn>
        <Btn onClick={() => { setW(BEST.w); setB(BEST.b); }}>{L("best", "best fit")}</Btn>
        <Btn onClick={() => { setW(0); setB(0); }}>w = b = 0</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label="w" value={w} min={-1} max={4} step={0.01} onChange={setW} />
          <Slider label="b" value={b} min={-14} max={4} step={0.01} onChange={setB} />
        </Sliders>
        <Row>
          <Readout color={loss < 0.42 ? C.green : loss < 0.7 ? C.amber : C.red}>{L("loss", "cross-entropy")} = {f2(loss, 3)}</Readout>
          <Readout color={C.muted}>{L("bestIs", "best possible")} 0.413</Readout>
          <Readout>{L("boundary", "boundary")} x = {Number.isFinite(boundary) && Math.abs(boundary) < 100 ? f2(boundary, 2) : "—"} h</Readout>
          <Readout>{L("correct", "correct")} {correct} / {EXAM.length}</Readout>
        </Row>
      </>}
      note={L("note", "The curve is the model's probability of passing after x hours. It crosses 0.5 at the boundary x = −b/w: to the right the model predicts \"pass\". w sets how steep the S is, b slides it sideways. Each red bar is one student's cost −ln(probability given to the real outcome): a pass at the bottom of the curve, or a fail at the top, costs a lot. No curve can make all six bars vanish, because the student who studied 3 h passed and the one who studied 4 h failed; the best curve (w ≈ 1.21, b ≈ −4.25) puts the boundary exactly between them, at 3.5 h, and gives each of them about 35%.")}
    >
      <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto" role="img">
        {[0, 0.5, 1].map(y => <g key={y}>
          <line x1={0} x2={P.W} y1={P.Y(y)} y2={P.Y(y)} stroke={y === 0.5 ? C.axis : C.grid} strokeDasharray={y === 0.5 ? "4 4" : undefined} />
          <T x={4} y={P.Y(y) - 3} size={8}>{y === 0.5 ? "p = 0.5" : `${y}`}</T>
        </g>)}
        {[1, 2, 3, 4, 5, 6, 7].map(x => <T key={x} x={P.X(x)} y={P.H - 3} size={8} anchor="middle">{x} h</T>)}
        {Number.isFinite(boundary) && boundary > P.x0 && boundary < P.x1 &&
          <line x1={P.X(boundary)} x2={P.X(boundary)} y1={0} y2={P.H - 12} stroke={C.purple} strokeWidth={1.2} strokeDasharray="5 3" />}
        {EXAM.map(([x, y], i) => {
          const p = sigmoid(w * x + b), cost = -Math.log(Math.max(y ? p : 1 - p, 1e-9));
          const dir = y ? 1 : -1;                              // passes draw their bar downwards, fails upwards
          return <line key={i} x1={P.X(x) + 7} x2={P.X(x) + 7} y1={P.Y(y)} y2={P.Y(y) + dir * Math.min(cost * H, 190)}
            stroke={C.red} strokeWidth={4} strokeOpacity={0.55} />;
        })}
        <path d={fnPath(P, x => sigmoid(w * x + b))} fill="none" stroke={C.amber} strokeWidth={2.2} />
        {EXAM.map(([x, y], i) => <circle key={i} cx={P.X(x)} cy={P.Y(y)} r={5.5} fill={y ? C.green : C.red} stroke="var(--code-bg)" strokeWidth={1.5} />)}
        {EXAM.map(([x, y], i) => {
          const p = sigmoid(w * x + b);
          return <T key={i} x={P.X(x)} y={y ? P.Y(1) - 10 : P.Y(0) + 17} size={8} anchor="middle" color={C.fg}>{f2(p, 2)}</T>;
        })}
      </svg>
    </Figure>
  );
}
