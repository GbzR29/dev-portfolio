"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, Sliders, C, T, Vec, plot, f2 } from "@/components/lesson/kit/figure";
import { halfPlane } from "./contours";

// ── What this figure shows ────────────────────────────────────────────────────
// One artificial neuron with two inputs: z = w₁x₁ + w₂x₂ + b, then a step that
// outputs 1 when z ≥ 0 and 0 otherwise. On the left, the neuron computing the
// selected input (click an input or a corner of the square to change it). On
// the right, the four possible inputs as the corners of a unit square,
// coloured by what the chosen logic gate should output. The line is where
// z = 0; the shaded side is where the neuron outputs 1, and the arrow is the
// weight vector (w₁, w₂), which is perpendicular to the line and points to
// that side. AND, OR and NAND each have weights that get all four corners
// right; XOR has none.

type Gate = "and" | "or" | "nand" | "xor";
const TARGET: Record<Gate, number[]> = { and: [0, 0, 0, 1], or: [0, 1, 1, 1], nand: [1, 1, 1, 0], xor: [0, 1, 1, 0] };
const SOLUTION: Partial<Record<Gate, [number, number, number]>> = { and: [1, 1, -1.5], or: [1, 1, -0.5], nand: [-1, -1, 1.5] };
const INPUTS: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]];

const W = 620, H = 250;
const Q = plot({ W: 220, H: 220, x0: -0.3, x1: 1.3, y0: -0.3, y1: 1.3 });   // the square, drawn at (SQ.x, SQ.y)
const SQ = { x: 385, y: 15 };
const step = (z: number) => (z >= 0 ? 1 : 0);

export function NeuronFigure({ t }: { t?: TrackTranslations }) {
  const [gate, setGate] = useState<Gate>("and");
  const [w1, setW1] = useState(0.5);
  const [w2, setW2] = useState(0.5);
  const [b, setB] = useState(-0.2);
  const [sel, setSel] = useState(3);
  const L = (k: string, en: string) => tx(t, `figAiNeuron_${k}`, en);

  const z = (x: [number, number]) => w1 * x[0] + w2 * x[1] + b;
  const outs = INPUTS.map(x => step(z(x)));
  const correct = outs.filter((o, i) => o === TARGET[gate][i]).length;
  const [x1, x2] = INPUTS[sel];
  const zs = z(INPUTS[sel]);

  // square → figure coordinates
  const X = (x: number) => SQ.x + Q.X(x), Y = (y: number) => SQ.y + Q.Y(y);
  // the half-plane where z ≥ 0 and the z = 0 line, clipped to the square's view
  const n = Math.hypot(w1, w2);
  const { poly, ends } = halfPlane((a, c) => w1 * a + w2 * c + b, Q.x0, Q.x1, Q.y0, Q.y1);
  // foot of the perpendicular from the square's centre to the line: where the weight arrow starts
  const foot = n > 1e-6 ? { x: 0.5 - (z([0.5, 0.5]) * w1) / (n * n), y: 0.5 - (z([0.5, 0.5]) * w2) / (n * n) } : null;
  const footIn = foot && foot.x > Q.x0 && foot.x < Q.x1 && foot.y > Q.y0 && foot.y < Q.y1;

  // neuron diagram
  const IN1 = { x: 40, y: 60 }, IN2 = { x: 40, y: 150 }, BIAS = { x: 40, y: 220 }, SUM = { x: 175, y: 120 }, OUT = { x: 330, y: 120 };
  const edge = (w: number) => ({ stroke: w >= 0 ? C.sky : C.orange, strokeWidth: 1 + Math.min(Math.abs(w), 3) * 1.4 });

  return (
    <Figure
      title={L("title", "One neuron, four inputs, one logic gate")}
      head={<Choice value={gate} onChange={setGate} options={[["and", "AND"], ["or", "OR"], ["nand", "NAND"], ["xor", "XOR"]] as const} />}
      controls={<>
        <Sliders>
          <Slider label="w₁" value={w1} min={-3} max={3} step={0.1} onChange={setW1} />
          <Slider label="w₂" value={w2} min={-3} max={3} step={0.1} onChange={setW2} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
        </Sliders>
        <Row>
          {SOLUTION[gate]
            ? <Btn onClick={() => { const s = SOLUTION[gate]!; setW1(s[0]); setW2(s[1]); setB(s[2]); }}>{L("solution", "show a solution")}</Btn>
            : <Readout color={C.red}>{L("noLine", "no line can do XOR")}</Readout>}
          {INPUTS.map((x, i) => (
            <Readout key={i} color={outs[i] === TARGET[gate][i] ? C.green : C.red}>
              ({x[0]},{x[1]}) → {outs[i]} {outs[i] === TARGET[gate][i] ? "✓" : "✗"}
            </Readout>
          ))}
          <Readout color={correct === 4 ? C.green : C.fg}>{L("correct", "correct")} {correct} / 4</Readout>
        </Row>
      </>}
      note={L("note", "Left: the neuron multiplies each input by its weight (blue edges are positive weights, orange negative, thicker means larger), adds the bias b, and outputs 1 if the sum z is at least 0. Click x₁, x₂ or a corner of the square to change the input. Right: the four inputs as corners of a square, filled green where the chosen gate should output 1 and red where it should output 0; a corner with a dark outline is one the neuron gets wrong. The neuron outputs 1 on the shaded side of the line z = 0, and the arrow (w₁, w₂) always points to that side. Try to get 4 / 4 for AND, then OR, then NAND. For XOR the two green corners sit diagonally opposite, and no straight line puts them on one side and the two red corners on the other.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {/* ── the neuron ── */}
        <line x1={IN1.x} y1={IN1.y} x2={SUM.x} y2={SUM.y} {...edge(w1)} />
        <line x1={IN2.x} y1={IN2.y} x2={SUM.x} y2={SUM.y} {...edge(w2)} />
        <line x1={BIAS.x} y1={BIAS.y} x2={SUM.x} y2={SUM.y} {...edge(b)} strokeDasharray="4 3" />
        <T x={105} y={78} size={9} anchor="middle" color={C.fg}>w₁ = {f2(w1, 1)}</T>
        <T x={105} y={128} size={9} anchor="middle" color={C.fg}>w₂ = {f2(w2, 1)}</T>
        <T x={105} y={190} size={9} anchor="middle" color={C.fg}>b = {f2(b, 1)}</T>
        {[[IN1, x1, "x₁", 0], [IN2, x2, "x₂", 1]].map(([p, v, name, k]) => {
          const q = p as { x: number; y: number };
          return (
            <g key={name as string} style={{ cursor: "pointer" }}
              onClick={() => setSel(k === 0 ? ((1 - x1) * 2 + x2) : (x1 * 2 + (1 - x2)))}>
              <circle cx={q.x} cy={q.y} r={17} fill={v ? C.green : "var(--surface)"} fillOpacity={v ? 0.35 : 1} stroke={C.fg} strokeWidth={1.4} />
              <T x={q.x} y={q.y + 4} size={11} anchor="middle" bold color={C.fg}>{v as number}</T>
              <T x={q.x} y={q.y - 22} size={9} anchor="middle">{name as string}</T>
            </g>
          );
        })}
        <circle cx={BIAS.x} cy={BIAS.y} r={13} fill="var(--surface)" stroke={C.muted} strokeWidth={1.2} />
        <T x={BIAS.x} y={BIAS.y + 4} size={10} anchor="middle" color={C.fg}>1</T>
        <circle cx={SUM.x} cy={SUM.y} r={30} fill="var(--surface)" stroke={C.purple} strokeWidth={2} />
        <T x={SUM.x} y={SUM.y - 6} size={14} anchor="middle" bold color={C.purple}>Σ</T>
        <T x={SUM.x} y={SUM.y + 14} size={9} anchor="middle" color={C.fg}>z = {f2(zs, 1)}</T>
        {/* the step function */}
        <Vec a={{ x: SUM.x + 31, y: SUM.y }} b={{ x: 228, y: SUM.y }} color={C.muted} w={1.4} head={6} />
        <rect x={230} y={SUM.y - 25} width={56} height={50} rx={6} fill="var(--surface)" stroke={C.grid} />
        <polyline points={`236,${SUM.y + 15} 258,${SUM.y + 15} 258,${SUM.y - 15} 280,${SUM.y - 15}`} fill="none" stroke={C.fg} strokeWidth={1.6} />
        <circle cx={zs >= 0 ? 269 : 247} cy={zs >= 0 ? SUM.y - 15 : SUM.y + 15} r={3.5} fill={C.amber} />
        <T x={258} y={SUM.y + 38} size={8} anchor="middle">{L("stepLabel", "step: z ≥ 0 → 1")}</T>
        <Vec a={{ x: 287, y: SUM.y }} b={{ x: OUT.x - 19, y: OUT.y }} color={C.muted} w={1.4} head={6} />
        <circle cx={OUT.x} cy={OUT.y} r={18} fill={outs[sel] ? C.green : C.red} fillOpacity={0.3}
          stroke={outs[sel] === TARGET[gate][sel] ? C.green : C.red} strokeWidth={2} />
        <T x={OUT.x} y={OUT.y + 4} size={12} anchor="middle" bold color={C.fg}>{outs[sel]}</T>
        <T x={OUT.x} y={OUT.y - 24} size={9} anchor="middle">ŷ</T>

        {/* ── the square of inputs ── */}
        <rect x={SQ.x} y={SQ.y} width={Q.W} height={Q.H} fill="none" stroke={C.grid} />
        {poly.length >= 3 && <polygon points={poly.map(([a, c]) => `${X(a)},${Y(c)}`).join(" ")} fill={C.green} fillOpacity={0.12} />}
        {ends.length >= 2 && <line x1={X(ends[0][0])} y1={Y(ends[0][1])} x2={X(ends[1][0])} y2={Y(ends[1][1])} stroke={C.purple} strokeWidth={2} />}
        {footIn && foot && <Vec a={{ x: X(foot.x), y: Y(foot.y) }} b={{ x: X(foot.x) + (w1 / n) * 34, y: Y(foot.y) - (w2 / n) * 34 }} color={C.purple} w={1.8} />}
        <line x1={X(0)} y1={Y(-0.2)} x2={X(0)} y2={Y(1.2)} stroke={C.axis} strokeWidth={0.8} />
        <line x1={X(-0.2)} y1={Y(0)} x2={X(1.2)} y2={Y(0)} stroke={C.axis} strokeWidth={0.8} />
        <T x={X(1.22)} y={Y(0) - 5} size={8.5} anchor="end">x₁</T>
        <T x={X(0) + 5} y={Y(1.24)} size={8.5}>x₂</T>
        {INPUTS.map((x, i) => {
          const target = TARGET[gate][i], ok = outs[i] === target;
          return (
            <g key={i} style={{ cursor: "pointer" }} onClick={() => setSel(i)}>
              <circle cx={X(x[0])} cy={Y(x[1])} r={i === sel ? 13 : 0} fill="none" stroke={C.amber} strokeWidth={1.5} strokeDasharray="3 2" />
              <circle cx={X(x[0])} cy={Y(x[1])} r={8} fill={target ? C.green : C.red} stroke={ok ? "var(--code-bg)" : C.fg} strokeWidth={ok ? 1.8 : 2.6} />
              <T x={X(x[0]) + (x[0] ? 12 : -12)} y={Y(x[1]) + (x[1] ? -9 : 16)} size={8} anchor={x[0] ? "start" : "end"}>({x[0]},{x[1]})</T>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
