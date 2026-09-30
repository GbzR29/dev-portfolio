"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, Sliders, C, T, plot, mulberry32, f2 } from "@/components/lesson/kit/figure";
import { DELIVERY, mse, mseGrad } from "./data";
import { contourPaths, geoLevels } from "./contours";

// ── What this figure shows ────────────────────────────────────────────────────
// Gradient descent on both parameters of the delivery model, drawn as a path
// over the contours of the loss. With the raw distance the bowl is a long,
// thin valley: a learning rate small enough not to blow up across it crawls
// along it. Standardising the feature (x′ = (x − 3) / √2) makes the bowl
// round, and the same number of steps reaches the bottom. Mini-batch and
// stochastic gradient descent use a few examples per step: cheaper steps,
// noisier path.

type Space = "raw" | "std";
type Algo = "batch" | "mini" | "sgd";
const MEAN = 3, SD = Math.SQRT2;
const STD: [number, number][] = DELIVERY.map(([x, y]) => [(x - MEAN) / SD, y]);
// The standardised view uses the same scale on both axes, so its round bowl looks round.
const VIEW = {
  raw: plot({ W: 620, H: 280, x0: -1, x1: 8, y0: -6, y1: 28 }),
  std: plot({ W: 620, H: 280, x0: 4.95 - 31, x1: 4.95 + 31, y0: -3, y1: 25 }),
};
const LEVELS = geoLevels(0.6, 600, 11);

function run(space: Space, algo: Algo, lr: number, epochs: number, seed: number) {
  const data = space === "raw" ? DELIVERY : STD;
  const rnd = mulberry32(seed);
  let w = 0, b = 0;
  const path: [number, number][] = [[0, 0]];
  const size = algo === "batch" ? data.length : algo === "mini" ? 2 : 1;
  for (let ep = 0; ep < epochs; ep++) {
    const order = data.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    for (let s = 0; s < order.length; s += size) {
      const batch = order.slice(s, s + size).map(i => data[i]);
      const [gw, gb] = mseGrad(batch, w, b);           // gradient of the loss on this batch only
      w -= lr * gw; b -= lr * gb;
      path.push([w, b]);
      if (!Number.isFinite(w) || Math.abs(w) > 1e6) return { path, w, b, loss: Infinity, data };
    }
  }
  return { path, w, b, loss: mse(data, w, b), data };
}

export function DescentPathFigure({ t }: { t?: TrackTranslations }) {
  const [space, setSpace] = useState<Space>("raw");
  const [algo, setAlgo] = useState<Algo>("batch");
  const [lg, setLg] = useState(Math.log10(0.02));
  const [epochs, setEpochs] = useState(30);
  const [seed, setSeed] = useState(1);
  const L = (k: string, en: string) => tx(t, `figAiPath_${k}`, en);

  const lr = 10 ** lg;
  const P = VIEW[space];
  const res = run(space, algo, lr, epochs, seed);
  const paths = useMemo(() => contourPaths(P, (w, b) => mse(space === "raw" ? DELIVERY : STD, w, b), P.x0, P.x1, P.y0, P.y1, LEVELS), [P, space]);
  const best = space === "raw" ? [3.5, 8.5] : [3.5 * SD, 19];
  const clip = (w: number, b: number) => [Math.min(Math.max(w, P.x0 - 1), P.x1 + 1), Math.min(Math.max(b, P.y0 - 3), P.y1 + 3)];
  const d = res.path.map(([w, b], i) => { const [cw, cb] = clip(w, b); return `${i ? "L" : "M"}${P.X(cw).toFixed(1)},${P.Y(cb).toFixed(1)}`; }).join("");
  const limit = space === "raw" ? 0.0845 : 1;

  return (
    <Figure
      title={L("title", "Gradient descent in two parameters")}
      head={<>
        <Choice value={space} onChange={setSpace} options={[["raw", L("raw", "raw km")], ["std", L("std", "standardised km")]] as const} />
        <span className="w-2" />
        <Choice value={algo} onChange={setAlgo} options={[["batch", "batch"], ["mini", "mini-batch (2)"], ["sgd", "SGD (1)"]] as const} />
      </>}
      controls={<>
        <Sliders>
          <Slider label={L("lr", "learning rate η")} value={lg} min={-3} max={0.1} step={0.01} onChange={setLg} fmt={v => f2(10 ** v, 4)} />
          <Slider label={L("epochs", "epochs")} value={epochs} min={1} max={80} step={1} onChange={setEpochs} fmt={v => `${v}`} />
        </Sliders>
        <Row>
          <Readout>{L("updates", "updates")} {res.path.length - 1}</Readout>
          <Readout>w = {Number.isFinite(res.loss) ? f2(res.w, 2) : "∞"}, b = {Number.isFinite(res.loss) ? f2(res.b, 2) : "∞"}</Readout>
          <Readout color={!Number.isFinite(res.loss) ? C.red : res.loss < 0.35 ? C.green : C.amber}>MSE = {Number.isFinite(res.loss) && res.loss < 1e5 ? f2(res.loss, 3) : L("diverged", "diverged")}</Readout>
          <Readout color={lr < limit ? C.muted : C.red}>{L("limit", "stable while η <")} {limit}</Readout>
          {algo !== "batch" && <Btn onClick={() => setSeed(s => s + 1)}>{L("shuffle", "new shuffle")}</Btn>}
        </Row>
      </>}
      note={L("note", "The path starts at w = b = 0; each segment is one update w ← w − η ∂L/∂w, b ← b − η ∂L/∂b. With raw distances the valley is about 70 times steeper across than along (the eigenvalues of the loss's curvature are 23.7 and 0.34), so η must stay below 2 / 23.7 ≈ 0.085, and along the valley each step then shrinks the gap by only 1 − 0.34η. Standardise and both curvatures become 2: η up to 1 is stable and η = 0.5 lands on the minimum in one update. An epoch is one pass over the five deliveries: one update for batch, three for mini-batches of 2 (2 + 2 + 1), five for SGD, each computed from its own examples only, which is why those paths wobble and never settle exactly.")}
    >
      <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto" role="img">
        <defs><clipPath id="ai-path-clip"><rect x={0} y={0} width={P.W} height={P.H} /></clipPath></defs>
        {paths.map(({ d: pd }, i) => <path key={i} d={pd} fill="none" stroke={C.purple} strokeOpacity={0.25 + 0.6 * (1 - i / LEVELS.length)} strokeWidth={1} />)}
        <line x1={P.X(0)} x2={P.X(0)} y1={0} y2={P.H} stroke={C.axis} strokeWidth={0.8} />
        <line x1={0} x2={P.W} y1={P.Y(0)} y2={P.Y(0)} stroke={C.axis} strokeWidth={0.8} />
        <T x={P.W - 6} y={P.Y(0) - 5} size={9} anchor="end" bold color={C.fg}>{space === "raw" ? "w" : "w′"}</T>
        <T x={P.X(0) + 5} y={11} size={9} bold color={C.fg}>{space === "raw" ? "b" : "b′"}</T>
        <g clipPath="url(#ai-path-clip)">
          <path d={d} fill="none" stroke={C.amber} strokeWidth={1.4} strokeLinejoin="round" />
          {res.path.length < 90 && res.path.map(([w, b], i) => { const [cw, cb] = clip(w, b); return <circle key={i} cx={P.X(cw)} cy={P.Y(cb)} r={i === 0 ? 4 : 2.2} fill={C.amber} />; })}
        </g>
        <circle cx={P.X(best[0])} cy={P.Y(best[1])} r={4} fill={C.green} stroke="var(--code-bg)" />
        <T x={P.X(best[0]) + 7} y={P.Y(best[1]) + 4} size={8.5} color={C.green}>{L("min", "minimum")}</T>
      </svg>
    </Figure>
  );
}
