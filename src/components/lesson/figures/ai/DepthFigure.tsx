"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T } from "@/components/lesson/kit/figure";
import type { Act, Init } from "./mlp";
import { DEPTH, depthStats } from "./depth";

// ── What this figure shows ────────────────────────────────────────────────────
// A 10-layer network, 100 neurons per layer, fed 200 random inputs (no
// training). Left: how big each layer's outputs are (their root mean square).
// Right: how big each layer's weight gradient is after one backward pass.
// Both on a log scale, with the healthy band 0.1 – 10 shaded. Small weights
// make the signal shrink 10× per layer; large tanh weights saturate every
// neuron; sigmoid layers shrink the gradient about 4× per layer on its way
// back; Xavier (tanh) and He (ReLU) keep both roughly level.

const W = 300, H = 170, LO = -11, HI = 10;
const Y = (v: number) => {
  const e = Math.log10(Math.max(v, 1e-30));
  return H - ((Math.min(Math.max(e, LO), HI) - LO) / (HI - LO)) * H;
};
const sup = (e: number) => String(e).split("").map(ch => (ch === "-" ? "⁻" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[+ch])).join("");

function Bars({ values, color, title, layerLabel }: { values: number[]; color: string; title: string; layerLabel: string }) {
  const bw = W / DEPTH;
  return (
    <svg viewBox={`-34 -18 ${W + 40} ${H + 48}`} className="w-full h-auto" role="img">
      <rect x={0} y={Y(10)} width={W} height={Y(0.1) - Y(10)} fill={C.green} fillOpacity={0.08} />
      {[-9, -6, -3, 0, 3, 6, 9].map(e => <g key={e}>
        <line x1={0} x2={W} y1={Y(10 ** e)} y2={Y(10 ** e)} stroke={C.grid} />
        <T x={-4} y={Y(10 ** e) + 3} size={8} anchor="end">{e === 0 ? "1" : `10${sup(e)}`}</T>
      </g>)}
      {values.map((v, i) => (
        <rect key={i} x={i * bw + 4} y={Y(v)} width={bw - 8} height={Math.max(0, H - Y(v))} fill={color} fillOpacity={0.75} rx={2} />
      ))}
      {values.map((_, i) => <T key={i} x={i * bw + bw / 2} y={H + 11} size={8} anchor="middle">{i + 1}</T>)}
      <T x={W / 2} y={H + 24} size={8.5} anchor="middle">{layerLabel}</T>
      <T x={0} y={-6} size={9} bold color={C.fg}>{title}</T>
    </svg>
  );
}

const fmt = (v: number) => (v >= 0.01 && v < 1000 ? v.toPrecision(2) : `${(v / 10 ** Math.floor(Math.log10(v))).toFixed(1)}·10${sup(Math.floor(Math.log10(v)))}`);

export function DepthFigure({ t }: { t?: TrackTranslations }) {
  const [act, setAct] = useState<Act>("tanh");
  const [init, setInit] = useState<Init>("small");
  const L = (k: string, en: string) => tx(t, `figAiDepth_${k}`, en);
  const st = useMemo(() => depthStats(act, init), [act, init]);
  const ratio = st.grad[DEPTH - 1] / st.grad[0];
  // unhealthy: the gradient changes over 100× across the layers, or every layer's gradient is tiny
  const bad = ratio > 100 || ratio < 0.01 || Math.max(...st.grad) < 1e-4;

  return (
    <Figure
      title={L("title", "A signal through ten layers")}
      head={<Choice value={act} onChange={setAct} options={[["tanh", "tanh"], ["sigmoid", "sigmoid"], ["relu", "ReLU"]] as const} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{L("init", "starting weights")}</span>
          <Choice value={init} onChange={setInit} options={[
            ["small", L("small", "tiny: σ = 0.01")], ["xavier", "Xavier: σ² = 2/(n+m)"], ["he", "He: σ² = 2/n"], ["large", L("large", "large: σ = 1")],
          ] as const} />
        </Row>
        <Row>
          <Readout>{L("first", "layer 1 output")} {fmt(st.act[0])}</Readout>
          <Readout>{L("last", "layer 10 output")} {fmt(st.act[DEPTH - 1])}</Readout>
          <Readout color={bad ? C.red : C.green}>{L("ratio", "gradient, layer 10 ÷ layer 1")} {fmt(ratio)}</Readout>
        </Row>
      </>}
      note={L("note", "No training happens here: 200 random inputs go forward through 10 layers of 100 neurons, and one backward pass comes back. Left, the size of each layer's outputs; right, the size of each layer's weight gradient. The green band is the healthy range. Tiny weights: every layer multiplies the signal by about 0.1, so layer 10 outputs about 10⁻¹⁰ and every gradient is below 10⁻⁹: nothing learns. Large weights with tanh: every neuron is pinned at ±1, and the gradient grows about 2.3× per layer on its way down. Xavier keeps tanh level. Sigmoid with Xavier: the outputs look fine, but the gradient shrinks by about 4× per layer, so layer 1 learns 200 000 times slower than layer 10. ReLU with He keeps both level; with Xavier its signal halves every two layers, because ReLU zeroes half of every layer.")}
    >
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <Bars values={st.act} color={C.sky} title={L("fwd", "forward: output size per layer")} layerLabel={L("layer", "layer")} />
        <Bars values={st.grad} color={C.orange} title={L("bwd", "backward: gradient size per layer")} layerLabel={L("layer", "layer")} />
      </div>
    </Figure>
  );
}
