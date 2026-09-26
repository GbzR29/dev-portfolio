"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, useDrag, nearest, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The linear inequality a·x + b ? c (with ? one of < ≤ > ≥) and its solution
// set on the number line. Solving divides by a; when a is negative that flips
// the sign, and the shaded ray visibly jumps to the other side. The draggable
// test point shows the inequality's truth value for any single x, so the rule
// can be checked instead of memorised. The endpoint is a hollow circle for
// strict (< >) and a filled one for ≤ ≥.

type Op = "<" | "≤" | ">" | "≥";
const FLIP: Record<Op, Op> = { "<": ">", "≤": "≥", ">": "<", "≥": "≤" };
const n = (v: number) => (Object.is(v, -0) ? 0 : +v.toFixed(2)).toString().replace("-", "−");
const test = (l: number, op: Op, r: number) => op === "<" ? l < r : op === "≤" ? l <= r + 1e-9 : op === ">" ? l > r : l >= r - 1e-9;

export function InequalityFigure({ t }: { t?: TrackTranslations }) {
  const [op, setOp] = useState<Op>("<");
  const [a, setA] = useState(-2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(7);
  const [x, setX] = useState(0);
  const p = plot({ W: 560, H: 150, x0: -10.8, x1: 10.8, y0: 0, y1: 1 });
  const LY = 92;

  const drag = useDrag<"x">(q => nearest(q, [["x", { x: p.X(x), y: LY - 34 }], ["x", { x: p.X(x), y: LY }]], 24),
    (_, q) => setX(clamp(Math.round(p.inv(q).x * 2) / 2, -10, 10)));

  const a0 = a === 0;
  const bound = (c - b) / a;
  const solOp: Op = a < 0 ? FLIP[op] : op;
  const lhs = a * x + b;
  const ok = test(lhs, op, c);
  const right = solOp === ">" || solOp === "≥";
  const closed = solOp === "≤" || solOp === "≥";
  const always = a0 && test(b, op, c);
  const B = clamp(bound, -10.6, 10.6);
  const interval = right ? `${closed ? "[" : "("}${n(bound)}, ∞)` : `(−∞, ${n(bound)}${closed ? "]" : ")"}`;
  const ticks = Array.from({ length: 21 }, (_, i) => i - 10);
  const lhsText = `${a === 1 ? "" : a === -1 ? "−" : n(a)}x ${b < 0 ? "−" : "+"} ${n(Math.abs(b))}`;

  return (
    <Figure
      title={tx(t, "figIneq_title", "Solving an inequality")}
      head={<Choice value={op} onChange={setOp} options={(["<", "≤", ">", "≥"] as const).map(o => [o, o] as const)} />}
      controls={<>
        <Sliders>
          <Slider label="a" value={a} min={-3} max={3} step={0.5} onChange={setA} fmt={n} />
          <Slider label="b" value={b} min={-6} max={6} step={1} onChange={setB} fmt={n} />
          <Slider label="c" value={c} min={-8} max={8} step={1} onChange={setC} fmt={n} />
        </Sliders>
        <Row>
          <Readout>{lhsText} {op} {n(c)}</Readout>
          {!a0 && <>
            <Readout>{a === 1 ? "" : `${n(a)}x ${op} ${n(c - b)}  →  `}x {solOp} {n(bound)}</Readout>
            <Readout color={a < 0 ? C.red : C.muted}>{a < 0 ? `${tx(t, "figIneq_flipped", "÷ a negative number: the sign flips")} ${op} → ${solOp}` : tx(t, "figIneq_kept", "÷ a positive number: the sign stays")}</Readout>
            <Readout color={C.amber}>x ∈ {interval}</Readout>
          </>}
        </Row>
        <Readout color={ok ? C.green : C.red}>
          {`${tx(t, "figIneq_test", "test x =")} ${n(x)}: ${n(lhs)} ${op} ${n(c)} ${ok ? tx(t, "figIneq_true", "is true") : tx(t, "figIneq_false", "is false")}`}
        </Readout>
      </>}
      note={tx(t, "figIneq_note", "The amber ray is every x that makes the inequality true. Drag the test point along the line: it turns green inside the ray and red outside, so you can check the answer instead of trusting a rule. Now drag a below zero. Dividing by a negative number reverses the order of the number line (3 < 5 but −3 > −5), so the sign must flip, and the ray jumps to the other side of the boundary. A hollow endpoint means the boundary itself is excluded (< or >), a filled one that it is included (≤ or ≥). With a = 0 there is no x left: the statement is then either always true or never true.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
        {!a0 && Math.abs(bound) <= 12 && (
          <rect x={right ? p.X(B) : p.X(-10.6)} width={right ? p.X(10.6) - p.X(B) : p.X(B) - p.X(-10.6)}
            y={LY - 7} height={14} rx={3} fill={C.amber} opacity={0.35} />
        )}
        {!a0 && Math.abs(bound) > 12 && (bound > 0) !== right && <rect x={p.X(-10.6)} width={p.X(10.6) - p.X(-10.6)} y={LY - 7} height={14} rx={3} fill={C.amber} opacity={0.35} />}
        {always && <rect x={p.X(-10.6)} width={p.X(10.6) - p.X(-10.6)} y={LY - 7} height={14} rx={3} fill={C.amber} opacity={0.35} />}
        <line x1={p.X(-10.6)} x2={p.X(10.6)} y1={LY} y2={LY} stroke={C.axis} strokeWidth={1.4} />
        {ticks.map(v => (
          <g key={v}>
            <line x1={p.X(v)} x2={p.X(v)} y1={LY - 4} y2={LY + 4} stroke={v === 0 ? C.fg : C.axis} strokeWidth={v === 0 ? 1.6 : 1} />
            <T x={p.X(v)} y={LY + 20} size={8.5} anchor="middle" color={v === 0 ? C.fg : C.axis}>{n(v)}</T>
          </g>
        ))}
        {!a0 && Math.abs(bound) <= 10.6 && <>
          <circle cx={p.X(bound)} cy={LY} r={6} fill={closed ? C.amber : "var(--code-bg)"} stroke={C.amber} strokeWidth={2.2} />
          <T x={p.X(bound)} y={LY + 38} size={9.5} anchor="middle" color={C.amber} bold>{`x ${solOp} ${n(bound)}`}</T>
        </>}
        {a0 && <T x={p.W / 2} y={LY + 42} size={10} anchor="middle" color={always ? C.green : C.red}>
          {always ? tx(t, "figIneq_always", "a = 0: true for every x") : tx(t, "figIneq_never", "a = 0: true for no x")}
        </T>}
        <line x1={p.X(x)} x2={p.X(x)} y1={LY - 34} y2={LY} stroke={ok ? C.green : C.red} strokeDasharray="3 3" />
        <T x={p.X(x)} y={LY - 44} size={9.5} anchor="middle" color={ok ? C.green : C.red} bold>{`${n(lhs)} ${op} ${n(c)} ${ok ? "✓" : "✗"}`}</T>
        <Handle x={p.X(x)} y={LY - 34} color={ok ? C.green : C.red} active={drag.dragging === "x"} />
      </svg>
    </Figure>
  );
}
