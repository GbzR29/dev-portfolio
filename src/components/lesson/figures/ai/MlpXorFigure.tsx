"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, C, T, plot, f2 } from "@/components/lesson/kit/figure";
import { contourPaths } from "./contours";
import { forward, netFrom, type Act } from "./mlp";

// ── What this figure shows ────────────────────────────────────────────────────
// The XOR network of the MLP chapter: h₁ = act(k·x₁ + k·x₂ − 0.5k) (a soft
// OR), h₂ = act(−k·x₁ − k·x₂ + 1.5k) (a soft NAND), ŷ = σ(k·h₁ + k·h₂ − 1.5k)
// (a soft AND). Left: the network for the chosen corner, with every value.
// Middle: the input square shaded by ŷ, with the curve ŷ = 0.5. Right: the
// hidden plane (h₁, h₂): where the four corners land, the bent image of the
// input grid, and the output neuron's straight line h₁ + h₂ = 1.5.
// "Break it": with no activation the hidden layer is linear, every point lands
// on one straight line and the middle point cannot be cut off from both ends.

type Mode = "sigmoid" | "none";
const INPUTS: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]];
const TARGET = [0, 1, 1, 0];

const NET_W = 225, NET_H = 230;      // the network drawing
const SQ = plot({ W: 190, H: 190, x0: -0.25, x1: 1.25, y0: -0.25, y1: 1.25 });
const PAD = 4;                        // space above each plane
const GRID = [0, 0.25, 0.5, 0.75, 1];

function makeNet(k: number, mode: Mode) {
  const hidden: Act = mode === "sigmoid" ? "sigmoid" : "linear";
  return netFrom([
    { W: [[k, k], [-k, -k]], b: [-0.5 * k, 1.5 * k], act: hidden },
    { W: [[k, k]], b: [-1.5 * k], act: "sigmoid" },
  ]);
}

export function MlpXorFigure({ t }: { t?: TrackTranslations }) {
  const [k, setK] = useState(10);
  const [mode, setMode] = useState<Mode>("sigmoid");
  const [sel, setSel] = useState(2);
  const L = (key: string, en: string) => tx(t, `figAiMlp_${key}`, en);

  const net = useMemo(() => makeNet(k, mode), [k, mode]);
  const runs = INPUTS.map(x => forward(net, x));
  const outs = runs.map(c => c.a[2][0]);
  const correct = outs.filter((p, i) => (p >= 0.5 ? 1 : 0) === TARGET[i]).length;
  const c = runs[sel];

  // ── input square: shading and the ŷ = 0.5 curve ──
  const cells = useMemo(() => {
    const n = 24, out: { x: number; y: number; p: number }[] = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = SQ.x0 + ((i + 0.5) * (SQ.x1 - SQ.x0)) / n, y = SQ.y0 + ((j + 0.5) * (SQ.y1 - SQ.y0)) / n;
      out.push({ x, y, p: forward(net, [x, y]).a[2][0] });
    }
    return out;
  }, [net]);
  const cellW = SQ.W / 24;
  const boundary = useMemo(() => contourPaths(SQ, (x, y) => forward(net, [x, y]).a[2][0], SQ.x0, SQ.x1, SQ.y0, SQ.y1, [0.5], 48, 48)[0].d, [net]);

  // ── hidden plane: where the grid lines of the square land ──
  const hid = (x: number, y: number) => { const a = forward(net, [x, y]).a[1]; return [a[0], a[1]] as [number, number]; };
  const lines = useMemo(() => {
    const ls: [number, number][][] = [];
    for (const g of GRID) {
      ls.push(Array.from({ length: 41 }, (_, i) => hid(g, i / 40)));
      ls.push(Array.from({ length: 41 }, (_, i) => hid(i / 40, g)));
    }
    return ls;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net]);
  // the hidden view: [0, 1]² for sigmoids, the span of the points for the linear layer
  const hv = useMemo(() => {
    if (mode === "sigmoid") return plot({ W: 190, H: 190, x0: -0.1, x1: 1.1, y0: -0.1, y1: 1.1 });
    const all = lines.flat();
    const lo = Math.min(...all.flat()), hi = Math.max(...all.flat()), pad = (hi - lo) * 0.08 + 0.1;
    return plot({ W: 190, H: 190, x0: lo - pad, x1: hi + pad, y0: lo - pad, y1: hi + pad });
  }, [mode, lines]);
  // the output neuron's line k·h₁ + k·h₂ − 1.5k = 0, i.e. h₁ + h₂ = 1.5
  const oLine = (() => {
    const a = hv.x0, b = hv.x1;
    return { x1: hv.X(a), y1: hv.Y(1.5 - a), x2: hv.X(b), y2: hv.Y(1.5 - b) };
  })();

  // ── network diagram ──
  const NX = { in: 30, hid: 112, out: 192 };
  const nodes = {
    x1: { x: NX.in, y: 70 }, x2: { x: NX.in, y: 170 },
    h1: { x: NX.hid, y: 70 }, h2: { x: NX.hid, y: 170 }, y: { x: NX.out, y: 120 },
  };
  const edge = (w: number) => ({ stroke: w >= 0 ? C.sky : C.orange, strokeWidth: 1 + Math.min(Math.abs(w), 10) * 0.25 });
  const edges: [keyof typeof nodes, keyof typeof nodes, number][] = [
    ["x1", "h1", k], ["x2", "h1", k], ["x1", "h2", -k], ["x2", "h2", -k], ["h1", "y", k], ["h2", "y", k],
  ];
  const val = { x1: c.a[0][0], x2: c.a[0][1], h1: c.a[1][0], h2: c.a[1][1], y: c.a[2][0] };

  const cornerColor = (i: number) => (TARGET[i] ? C.green : C.red);

  return (
    <Figure
      title={L("title", "A hidden layer bends the square")}
      head={<Choice value={mode} onChange={setMode} options={[["sigmoid", L("sig", "sigmoid hidden layer")], ["none", L("none", "no activation (break it)")]] as const} />}
      controls={<>
        <Slider label={L("k", "steepness k")} value={k} min={1} max={12} step={0.5} onChange={setK} fmt={v => f2(v, 1)} />
        <Row>
          <Readout>x = ({INPUTS[sel].join(", ")})</Readout>
          <Readout>h = ({f2(val.h1, 3)}, {f2(val.h2, 3)})</Readout>
          <Readout>ŷ = {f2(val.y, 3)}</Readout>
          <Readout color={correct === 4 ? C.green : C.red}>{L("correct", "correct")} {correct} / 4</Readout>
        </Row>
      </>}
      note={L("note", "Left: the network for the chosen corner (click a corner of the square). Blue edges have weight +k, orange −k. Middle: the input square shaded by the output ŷ (green near 1, red near 0); the purple curve is where ŷ = 0.5. Right: the hidden plane. Each corner lands at its (h₁, h₂), and the faint lines are the grid of the square after the hidden layer has bent it. In this plane the output neuron is a plain straight line, h₁ + h₂ = 1.5. With the sigmoids, (0, 1) and (1, 0) both land near (1, 1), on the far side of that line from the two red corners. Lower k: the sigmoids get soft, the corners slide towards the middle, and below about k = 2.2 the network gets XOR wrong. Now remove the activation: the hidden layer becomes linear, the whole square is flattened onto one straight line, the green corners land between the red ones, and no k helps.")}
    >
      {/* phones: the network on top, the two planes side by side below; wider screens: three in a row */}
      <div className="grid grid-cols-2 sm:grid-cols-[1.15fr_1fr_1fr] gap-2 p-2 items-center">
      <svg viewBox={`0 0 ${NET_W} ${NET_H}`} className="w-full h-auto col-span-2 sm:col-span-1 max-w-[320px] mx-auto" role="img">
        {/* network */}
        {edges.map(([a, b, w], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} {...edge(w)} opacity={0.75} />
        ))}
        {(Object.keys(nodes) as (keyof typeof nodes)[]).map(id => {
          const n = nodes[id], v = val[id];
          const isOut = id === "y", isHid = id === "h1" || id === "h2";
          return (
            <g key={id}>
              <circle cx={n.x} cy={n.y} r={19} fill="var(--card)" stroke={isOut ? C.purple : isHid ? C.teal : C.muted} strokeWidth={1.8} />
              <T x={n.x} y={n.y - 2} size={9} anchor="middle" bold color={C.fg}>{id === "y" ? "ŷ" : id.replace("1", "₁").replace("2", "₂")}</T>
              <T x={n.x} y={n.y + 10} size={8.5} anchor="middle" color={isOut ? C.purple : C.fg}>{f2(v, Math.abs(v) >= 10 ? 1 : 2)}</T>
            </g>
          );
        })}
        <T x={NX.hid} y={30} size={8.5} anchor="middle">{mode === "sigmoid" ? "σ" : L("linear", "linear")}</T>
        <T x={NX.hid} y={214} size={8} anchor="middle">h₁ OR · h₂ NAND</T>
        <T x={NX.out} y={160} size={8} anchor="middle">AND</T>
        </svg>

        {/* input square */}
        <svg viewBox={`0 0 ${SQ.W} ${SQ.H + 30}`} className="w-full h-auto" role="img">
        <g transform={`translate(0,${PAD})`}>
          {cells.map((q, i) => (
            <rect key={i} x={SQ.X(q.x) - cellW / 2} y={SQ.Y(q.y) - cellW / 2} width={cellW + 0.4} height={cellW + 0.4}
              fill={q.p >= 0.5 ? C.green : C.red} fillOpacity={0.05 + 0.3 * Math.abs(q.p - 0.5) * 2} />
          ))}
          <path d={boundary} stroke={C.purple} strokeWidth={2} fill="none" />
          <rect x={SQ.X(0)} y={SQ.Y(1)} width={SQ.X(1) - SQ.X(0)} height={SQ.Y(0) - SQ.Y(1)} fill="none" stroke={C.axis} strokeDasharray="3 3" />
          {INPUTS.map(([x, y], i) => (
            <g key={i} onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
              <circle cx={SQ.X(x)} cy={SQ.Y(y)} r={13} fill="transparent" />
              {i === sel && <circle cx={SQ.X(x)} cy={SQ.Y(y)} r={11} fill="none" stroke={C.amber} strokeWidth={2} />}
              <circle cx={SQ.X(x)} cy={SQ.Y(y)} r={6.5} fill={cornerColor(i)}
                stroke={(outs[i] >= 0.5 ? 1 : 0) !== TARGET[i] ? C.fg : "var(--code-bg)"} strokeWidth={(outs[i] >= 0.5 ? 1 : 0) !== TARGET[i] ? 2.4 : 1.6} />
            </g>
          ))}
          <T x={SQ.W / 2} y={SQ.H + 20} size={9} anchor="middle" bold color={C.fg}>{L("inputs", "inputs (x₁, x₂)")}</T>
        </g>
        </svg>

        {/* hidden plane */}
        <svg viewBox={`0 0 ${hv.W} ${hv.H + 30}`} className="w-full h-auto" role="img">
        <defs><clipPath id="mlpxor-hidden"><rect x={0} y={0} width={hv.W} height={hv.H} /></clipPath></defs>
        <g transform={`translate(0,${PAD})`}>
          <rect x={0} y={0} width={hv.W} height={hv.H} fill="none" stroke={C.grid} />
          <g clipPath="url(#mlpxor-hidden)">
          {lines.map((ln, i) => (
            <polyline key={i} points={ln.map(([a, b]) => `${hv.X(a).toFixed(1)},${hv.Y(b).toFixed(1)}`).join(" ")}
              fill="none" stroke={C.teal} strokeOpacity={0.35} strokeWidth={1} />
          ))}
          <line {...oLine} stroke={C.purple} strokeWidth={2} />
          {runs.map((r, i) => (
            <circle key={i} cx={hv.X(r.a[1][0])} cy={hv.Y(r.a[1][1])} r={i === sel ? 7.5 : 6} fill={cornerColor(i)}
              stroke={i === sel ? C.amber : "var(--code-bg)"} strokeWidth={i === sel ? 2.4 : 1.6} />
          ))}
          </g>
          <T x={hv.W / 2} y={hv.H + 20} size={9} anchor="middle" bold color={C.fg}>{L("hidden", "hidden layer (h₁, h₂)")}</T>
          <T x={6} y={hv.H - 6} size={8.5} color={C.purple}>{L("outLine", "output line")}: h₁ + h₂ = 1.5</T>
        </g>
        </svg>
      </div>
    </Figure>
  );
}
