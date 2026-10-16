"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, T, mulberry32 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// How much of the gradient at the last step survives k steps back in time.
// In a one-unit RNN, h_t = f(w·h_{t−1} + 0.5·x_t), each step back multiplies
// the gradient by w·f′(z_t); after k steps it has been multiplied by k such
// factors. In an LSTM the cell state's path multiplies it only by the forget
// gate f at each step. The plot is logarithmic: each grid line is ×10.

const K = 50;
const XS = (() => { const r = mulberry32(5); return Array.from({ length: K + 1 }, () => (r() < 0.5 ? -1 : 1)); })();

/** factors[k] = the product of the last k per-step factors of the RNN. */
function rnnFactors(w: number, act: "tanh" | "none") {
  const step: number[] = [];
  let h = 0;
  for (let t = 0; t <= K; t++) {
    const z = w * h + 0.5 * XS[t];
    h = act === "tanh" ? Math.tanh(z) : z;
    step.push(w * (act === "tanh" ? 1 - h * h : 1));
  }
  const out = [1];
  for (let k = 1; k <= K; k++) out.push(out[k - 1] * step[K - k + 1]);
  return out;
}

const W = 560, H = 250, PL = 46, PR = 14, PT = 14, PB = 30;
const LO = -10, HI = 4;
const px = (k: number) => PL + (k / K) * (W - PL - PR);
const py = (v: number) => {
  const l = Math.max(LO, Math.min(HI, Math.log10(Math.max(v, 1e-300))));
  return PT + ((HI - l) / (HI - LO)) * (H - PT - PB);
};
const fmt = (v: number) => (v >= 0.01 && v < 1000 ? v.toPrecision(2) : v.toExponential(0).replace("e", "·10^").replace("+", ""));

export function VanishFigure({ t }: { t?: TrackTranslations }) {
  const [w, setW] = useState(0.9);
  const [f, setF] = useState(0.97);
  const [act, setAct] = useState<"tanh" | "none">("tanh");
  const L = (k: string, en: string) => tx(t, `figAiVan_${k}`, en);

  const rnn = rnnFactors(w, act);
  const lstm = Array.from({ length: K + 1 }, (_, k) => f ** k);
  const path = (vs: number[]) => vs.map((v, k) => `${k ? "L" : "M"}${px(k).toFixed(1)},${py(v).toFixed(1)}`).join("");

  return (
    <Figure
      title={L("title", "How much gradient survives k steps back")}
      head={<Choice value={act} onChange={setAct} options={[["tanh", "tanh"], ["none", L("none", "no activation")]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={L("w", "RNN weight w")} value={w} min={0.5} max={1.5} step={0.05} onChange={setW} width="w-32" />
          <Slider label={L("f", "LSTM forget gate f")} value={f} min={0.5} max={1} step={0.01} onChange={setF} width="w-32" />
        </Sliders>
        <Row>
          {[10, 20, 50].map(k => (
            <Readout key={k}>{k} {L("back", "steps back")}: <span style={{ color: C.purple }}>RNN ×{fmt(rnn[k])}</span> · <span style={{ color: C.teal }}>LSTM ×{fmt(lstm[k])}</span></Readout>
          ))}
        </Row>
      </>}
      note={L("note", "Backpropagation through time multiplies the gradient by one factor per step. For the RNN that factor is w times the slope of tanh at that step, which is at most 1 and often far less, so with w = 0.9 almost nothing is left 20 steps back: the first inputs barely move the weights, and the network cannot learn to remember them. Raise w and tanh saturates (its slope falls towards 0), so the gradient still vanishes. Switch the activation off: the factor is exactly w at every step, so w = 0.9 still vanishes, and w = 1.1 explodes (1.1⁵⁰ ≈ 117), which is why RNN training clips gradients. The LSTM's cell state is multiplied only by its forget gate f, which the network itself sets close to 1 when it needs to remember: with f = 0.97, 22 % of the gradient is still there 50 steps back.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {Array.from({ length: HI - LO + 1 }, (_, i) => HI - i).map(e => (
          <g key={e}>
            <line x1={PL} y1={py(10 ** e)} x2={W - PR} y2={py(10 ** e)} stroke={C.grid} strokeOpacity={e === 0 ? 1 : 0.6} strokeWidth={e === 0 ? 1.4 : 1} />
            {e % 2 === 0 && <T x={PL - 6} y={py(10 ** e) + 3} size={8} anchor="end">{e === 0 ? "1" : `10^${e}`}</T>}
          </g>
        ))}
        {[0, 10, 20, 30, 40, 50].map(k => (
          <g key={k}>
            <line x1={px(k)} y1={PT} x2={px(k)} y2={H - PB} stroke={C.grid} strokeOpacity={0.5} />
            <T x={px(k)} y={H - PB + 13} size={8} anchor="middle">{k}</T>
          </g>
        ))}
        <T x={(PL + W - PR) / 2} y={H - 3} size={8.5} anchor="middle">{L("axis", "steps back in time, k")}</T>
        <path d={path(rnn)} fill="none" stroke={C.purple} strokeWidth={2.2} />
        <path d={path(lstm)} fill="none" stroke={C.teal} strokeWidth={2.2} />
        <T x={W - PR - 4} y={Math.min(H - PB - 6, Math.max(PT + 10, py(rnn[K]) - 6))} size={9} anchor="end" color={C.purple} bold>RNN</T>
        <T x={W - PR - 4} y={Math.min(H - PB - 6, Math.max(PT + 10, py(lstm[K]) - 6))} size={9} anchor="end" color={C.teal} bold>{L("cell", "LSTM cell")}</T>
      </svg>
    </Figure>
  );
}
