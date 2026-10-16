"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, C, T, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { useStepper, stepAmount } from "@/components/lesson/kit/Stepper";
import { applyStep, backward, cloneNet, forward, makeOpt, netFrom, zeroGrads } from "./mlp";

// ── What this figure shows ────────────────────────────────────────────────────
// Backpropagation on the worked example of the chapter, one step at a time:
// a 2-2-1 sigmoid network (W⁽¹⁾ = [[0.5, −0.5], [0.3, 0.8]], b⁽¹⁾ = (0.1, −0.2),
// W⁽²⁾ = [0.7, −0.6], b⁽²⁾ = 0.2) and one XOR example. Steps 1–5 run the
// forward pass (values in blue under each node), steps 6–10 the backward pass
// (deltas in orange, weight gradients on the edges), step 11 takes one
// gradient-descent step (η = 1) and shows the new weights and the lower loss.

const X: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]];
const Y = [0, 1, 1, 0];
const START = () => netFrom([
  { W: [[0.5, -0.5], [0.3, 0.8]], b: [0.1, -0.2], act: "sigmoid" },
  { W: [[0.7, -0.6]], b: [0.2], act: "sigmoid" },
]);
const STEPS = 11;

const W = 640, H = 270;
const N = {
  x1: { x: 42, y: 62 }, x2: { x: 42, y: 196 },
  h1: { x: 262, y: 62 }, h2: { x: 262, y: 196 },
  y: { x: 462, y: 129 }, L: { x: 590, y: 129 },
};
type Id = keyof typeof N;

export function BackpropFigure({ t }: { t?: TrackTranslations }) {
  const [ex, setEx] = useState(2);                         // (1, 0), the example worked in the text
  const s = useStepper(STEPS, 1300, 900);
  const k = Math.min(STEPS, Math.floor(s.p + 1e-6));
  const show = (i: number) => stepAmount(s.p, i);         // 0 → 1 as step i is reached
  const L = (key: string, en: string) => tx(t, `figAiBp_${key}`, en);

  const run = useMemo(() => {
    const net = START(), x = X[ex], y = Y[ex];
    const c = forward(net, x);
    const g = zeroGrads(net);
    const d = backward(net, c, y, g);
    const after = cloneNet(net);
    applyStep(after, makeOpt(after, "sgd", 1), g);
    const p2 = forward(after, x).a[2][0];
    const loss = (p: number) => -(y ? Math.log(p) : Math.log(1 - p));
    const back = [0, 1].map(i => net[1].W[i] * d[1][0]);    // W⁽²⁾ᵀ δ⁽²⁾, before the slope
    const slope = [0, 1].map(i => c.a[1][i] * (1 - c.a[1][i]));
    return { net, x, y, c, g, d, after, p: c.a[2][0], p2, L1: loss(c.a[2][0]), L2: loss(p2), back, slope };
  }, [ex]);

  const { net, c, g, d, after } = run;
  const w1 = (o: number, i: number) => net[0].W[o * 2 + i];
  const fmt = (v: number) => f2(v, Math.abs(v) < 0.01 && v !== 0 ? 4 : 3);

  // ── step captions: what happens, then the arithmetic ──
  const cap: [string, string][] = [
    [L("s0", "Start: the weights are set, nothing is computed yet. Press play, or step."), ""],
    [L("s1", "Forward 1. Each hidden neuron adds up its weighted inputs and its bias: z⁽¹⁾ = W⁽¹⁾x + b⁽¹⁾."),
      `z₁ = ${w1(0, 0)}·${run.x[0]} + (${w1(0, 1)})·${run.x[1]} + ${net[0].b[0]} = ${fmt(c.z[0][0])}    z₂ = ${w1(1, 0)}·${run.x[0]} + ${w1(1, 1)}·${run.x[1]} + (${net[0].b[1]}) = ${fmt(c.z[0][1])}`],
    [L("s2", "Forward 2. Each hidden neuron applies the sigmoid: h = σ(z⁽¹⁾)."),
      `h₁ = σ(${fmt(c.z[0][0])}) = ${fmt(c.a[1][0])}    h₂ = σ(${fmt(c.z[0][1])}) = ${fmt(c.a[1][1])}`],
    [L("s3", "Forward 3. The output neuron adds up the hidden values with its weights."),
      `z⁽²⁾ = 0.7·${fmt(c.a[1][0])} + (−0.6)·${fmt(c.a[1][1])} + 0.2 = ${fmt(c.z[1][0])}`],
    [L("s4", "Forward 4. The sigmoid turns it into a probability: the network's answer."),
      `p = σ(${fmt(c.z[1][0])}) = ${fmt(run.p)}`],
    [L("s5", "Forward 5. The loss compares the answer with the label (cross-entropy)."),
      run.y ? `L = −ln p = −ln ${fmt(run.p)} = ${fmt(run.L1)}` : `L = −ln(1 − p) = −ln ${fmt(1 - run.p)} = ${fmt(run.L1)}`],
    [L("s6", "Backward 1. With a sigmoid output and cross-entropy, the output's delta is simply p − y: how much the loss moves per unit of z⁽²⁾."),
      `δ⁽²⁾ = p − y = ${fmt(run.p)} − ${run.y} = ${fmt(d[1][0])}`],
    [L("s7", "Backward 2. Each output weight's gradient is the delta times the input on that edge; the bias's gradient is the delta itself."),
      `∂L/∂w⁽²⁾₁ = δ⁽²⁾·h₁ = ${fmt(g.W[1][0])}    ∂L/∂w⁽²⁾₂ = δ⁽²⁾·h₂ = ${fmt(g.W[1][1])}    ∂L/∂b⁽²⁾ = ${fmt(g.b[1][0])}`],
    [L("s8", "Backward 3. The delta travels back along each edge, multiplied by the edge's weight (W⁽²⁾ᵀδ⁽²⁾)."),
      `0.7·${fmt(d[1][0])} = ${fmt(run.back[0])}    (−0.6)·${fmt(d[1][0])} = ${fmt(run.back[1])}`],
    [L("s9", "Backward 4. Each hidden neuron multiplies what arrived by the slope of its sigmoid, σ' = h(1 − h): that is its delta."),
      `δ₁ = ${fmt(run.back[0])}·${fmt(run.slope[0])} = ${fmt(d[0][0])}    δ₂ = ${fmt(run.back[1])}·${fmt(run.slope[1])} = ${fmt(d[0][1])}`],
    [L("s10", "Backward 5. Same rule as step 7, one layer down: weight gradient = delta × input. An input of 0 gives a gradient of 0."),
      `∂L/∂W⁽¹⁾ = [[${fmt(g.W[0][0])}, ${fmt(g.W[0][1])}], [${fmt(g.W[0][2])}, ${fmt(g.W[0][3])}]]    ∂L/∂b⁽¹⁾ = (${fmt(g.b[0][0])}, ${fmt(g.b[0][1])})`],
    [L("s11", "Update. Every parameter moves against its gradient (η = 1). Run the same example again: the loss went down."),
      `p: ${fmt(run.p)} → ${fmt(run.p2)}    L: ${fmt(run.L1)} → ${fmt(run.L2)}`],
  ];

  // ── drawing helpers ──
  const fwd = (step: number, id: Id, v: string) => {
    const a = show(step);
    if (a <= 0) return null;
    const n = N[id];
    return <g opacity={a}><rect x={n.x - 30} y={n.y + 24} width={60} height={16} rx={4} fill={C.sky} fillOpacity={0.15} stroke={C.sky} strokeOpacity={0.6} />
      <T x={n.x} y={n.y + 35.5} size={9} anchor="middle" color={C.sky} bold>{v}</T></g>;
  };
  const bwd = (step: number, id: Id, v: string) => {
    const a = show(step);
    if (a <= 0) return null;
    const n = N[id];
    return <g opacity={a}><rect x={n.x - 32} y={n.y + 43} width={64} height={16} rx={4} fill={C.orange} fillOpacity={0.15} stroke={C.orange} strokeOpacity={0.6} />
      <T x={n.x} y={n.y + 54.5} size={9} anchor="middle" color={C.orange} bold>δ {v}</T></g>;
  };
  const edges: { a: Id; b: Id; l: number; j: number; name: string }[] = [
    { a: "x1", b: "h1", l: 0, j: 0, name: "w₁₁" }, { a: "x2", b: "h1", l: 0, j: 1, name: "w₁₂" },
    { a: "x1", b: "h2", l: 0, j: 2, name: "w₂₁" }, { a: "x2", b: "h2", l: 0, j: 3, name: "w₂₂" },
    { a: "h1", b: "y", l: 1, j: 0, name: "w₁" }, { a: "h2", b: "y", l: 1, j: 1, name: "w₂" },
  ];
  const updated = show(11);
  const backFlow = k >= 6;

  return (
    <Figure
      title={L("title", "Backpropagation, one step at a time")}
      head={<Choice value={String(ex)} onChange={v => { setEx(Number(v)); s.restart(); }}
        options={X.map((x, i) => [String(i), `x = (${x.join(", ")})`] as const)} />}
      note={L("note", "Blue boxes are values from the forward pass; orange boxes are deltas, the derivative of the loss with respect to each neuron's z. The orange numbers on the edges are the weight gradients. Notice the order: the forward pass must finish first, because every gradient uses a value it stored (h for the output weights, x for the hidden weights, h(1 − h) for the slopes). The backward pass then reuses each delta for everything below it, which is why it costs about as much as the forward pass instead of one pass per weight. Choose another example: for (0, 0) every hidden weight gradient is 0, because both inputs are 0.")}
    >
      <div className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {edges.map((e, i) => {
            const A = N[e.a], B = N[e.b];
            // the two crossing edges get their labels near the inputs, away from the crossing
            const at = e.l === 0 && e.j % 3 !== 0 ? 0.24 : 0.42;
            const mx = A.x + (B.x - A.x) * at, my = A.y + (B.y - A.y) * at;
            const wOld = net[e.l].W[e.j], wNew = after[e.l].W[e.j], gr = g.W[e.l][e.j];
            const gShow = show(e.l === 1 ? 7 : 10);
            const active = backFlow && ((e.l === 1 && k >= 6 && k <= 8) || (e.l === 0 && k >= 9 && k <= 10));
            return (
              <g key={i}>
                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={active ? C.orange : wOld >= 0 ? C.sky : C.muted} strokeOpacity={active ? 0.9 : 0.5} strokeWidth={active ? 2.4 : 1.6} />
                <rect x={mx - 27} y={my - 18} width={54} height={14} rx={3} fill="var(--code-bg)" />
                <T x={mx} y={my - 7.5} size={8.5} anchor="middle" color={C.fg}>
                  {e.name} {updated > 0.5 ? f2(wNew, 3) : f2(wOld, 2)}
                </T>
                {gShow > 0 && <T x={mx} y={my + 7} size={8.5} anchor="middle" color={C.orange}>
                  <tspan opacity={gShow}>∂ {fmt(gr)}</tspan>
                </T>}
              </g>
            );
          })}
          <line x1={N.y.x} y1={N.y.y} x2={N.L.x} y2={N.L.y} stroke={C.muted} strokeDasharray="4 3" />
          {(Object.keys(N) as Id[]).map(id => {
            const n = N[id];
            const label = { x1: "x₁", x2: "x₂", h1: "h₁", h2: "h₂", y: "p", L: "L" }[id];
            const ring = id === "L" ? C.red : id === "y" ? C.purple : id.startsWith("h") ? C.teal : C.muted;
            return (
              <g key={id}>
                <circle cx={n.x} cy={n.y} r={20} fill="var(--card)" stroke={ring} strokeWidth={1.8} />
                <T x={n.x} y={n.y + 4} size={11} anchor="middle" bold color={C.fg}>{label}</T>
              </g>
            );
          })}
          {/* inputs, and the label next to the loss */}
          <T x={N.x1.x} y={N.x1.y + 36} size={9} anchor="middle" color={C.fg}>{run.x[0]}</T>
          <T x={N.x2.x} y={N.x2.y + 36} size={9} anchor="middle" color={C.fg}>{run.x[1]}</T>
          <T x={N.L.x} y={N.L.y - 28} size={9} anchor="middle">y = {run.y}</T>
          <T x={N.h1.x} y={N.h1.y - 30} size={8.5} anchor="middle">b {updated > 0.5 ? f2(after[0].b[0], 3) : f2(net[0].b[0], 2)}</T>
          <T x={N.h2.x} y={N.h2.y - 30} size={8.5} anchor="middle">b {updated > 0.5 ? f2(after[0].b[1], 3) : f2(net[0].b[1], 2)}</T>
          <T x={N.y.x} y={N.y.y - 30} size={8.5} anchor="middle">b {updated > 0.5 ? f2(after[1].b[0], 3) : f2(net[1].b[0], 2)}</T>
          {/* forward values */}
          {show(2) > 0 ? fwd(2, "h1", `h ${fmt(c.a[1][0])}`) : fwd(1, "h1", `z ${fmt(c.z[0][0])}`)}
          {show(2) > 0 ? fwd(2, "h2", `h ${fmt(c.a[1][1])}`) : fwd(1, "h2", `z ${fmt(c.z[0][1])}`)}
          {show(4) > 0 ? fwd(4, "y", `p ${fmt(run.p)}`) : fwd(3, "y", `z ${fmt(c.z[1][0])}`)}
          {fwd(5, "L", updated > 0.5 ? fmt(run.L2) : fmt(run.L1))}
          {/* backward deltas */}
          {bwd(6, "y", fmt(d[1][0]))}
          {bwd(9, "h1", fmt(d[0][0]))}
          {bwd(9, "h2", fmt(d[0][1]))}
          {show(8) > 0 && show(9) < 1 && <g opacity={show(8) * (1 - show(9))}>
            <T x={N.h1.x + 40} y={N.h1.y - 6} size={8.5} color={C.orange}>← {fmt(run.back[0])}</T>
            <T x={N.h2.x + 40} y={N.h2.y + 14} size={8.5} color={C.orange}>← {fmt(run.back[1])}</T>
          </g>}
          <T x={W - 24} y={H - 8} size={9} anchor="end" color={k >= 6 && k <= 10 ? C.orange : k >= 1 && k <= 5 ? C.sky : C.green} bold>
            {k === 0 ? "" : k <= 5 ? L("fwdTag", "forward pass →") : k <= 10 ? L("bwdTag", "← backward pass") : L("updTag", "update")}
          </T>
        </svg>
        <div className="px-4 pb-1 min-h-[4.5rem]">
          <p className="text-[12.5px] text-[var(--text-main)] leading-snug">{cap[k][0]}</p>
          {cap[k][1] && <p className="text-[11.5px] font-mono text-[var(--primary)] mt-1 break-words" style={{ whiteSpace: "pre-wrap" }}>{cap[k][1]}</p>}
        </div>
        <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
          readout={`${L("step", "step")} ${k} / ${STEPS}`} />
      </div>
    </Figure>
  );
}
