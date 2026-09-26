"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Vec, Handle, plot, useDrag, nearest, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The number line as the picture behind the four sign rules.
// add      — a + b is "start at a, move b steps"; a negative b moves left, which
//            is why a − b and a + (−b) are the same move. Drag a and the tip.
// multiply — a × b stretches the arrow 0→a by |b|; a negative b also flips it
//            to the other side of 0, which is where "minus times minus is
//            plus" comes from (two flips).
// distance — |a − b| is the distance between two points, never negative;
//            |a| is the distance from a to 0.

type Mode = "add" | "mul" | "dist";
const snap = (v: number) => clamp(Math.round(v * 2) / 2, -10, 10);
const n = (v: number) => (Object.is(v, -0) ? 0 : v).toString().replace("-", "−");
const paren = (v: number) => (v < 0 ? `(${n(v)})` : n(v));

export function NumberLineFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("add");
  const [a, setA] = useState(3);
  const [b, setB] = useState(-5);
  const [k, setK] = useState(-2);
  const p = plot({ W: 560, H: 150, x0: -10.8, x1: 10.8, y0: 0, y1: 1 });
  const LY = 100;                                   // y of the number line

  const tip = mode === "add" ? a + b : b;           // second handle: the sum's tip, or point b
  const drag = useDrag<"a" | "b">(
    q => nearest(q, mode === "mul" ? [["a", { x: p.X(a), y: 62 }]] : [["a", { x: p.X(a), y: LY }], ["b", { x: p.X(tip), y: mode === "add" ? 62 : LY }]], 22),
    (id, q) => {
      const v = snap(p.inv(q).x);
      if (id === "a") setA(v);
      else if (mode === "add") setB(clamp(v - a, -20, 20));
      else setB(v);
    });

  const ticks = Array.from({ length: 21 }, (_, i) => i - 10);
  const col = (v: number) => (v >= 0 ? C.green : C.red);
  const prod = a * k;
  const X = (v: number) => p.X(clamp(v, -10.6, 10.6));

  return (
    <Figure
      title={tx(t, "figNL_title", "The number line")}
      head={<Choice value={mode} onChange={setMode} options={[["add", tx(t, "figNL_add", "add / subtract")], ["mul", tx(t, "figNL_mul", "multiply")], ["dist", tx(t, "figNL_dist", "distance")]] as const} />}
      controls={<>
        {mode === "mul" && <Slider label={tx(t, "figNL_factor", "factor b")} value={k} min={-3} max={3} step={0.5} onChange={setK} fmt={n} />}
        <Row>
          {mode === "add" && <>
            <Readout>{n(a)} + {paren(b)} = {n(a + b)}</Readout>
            <Readout color={col(b)}>{b < 0 ? `${n(a)} − ${n(-b)} = ${n(a + b)}` : `${n(a + b)} − ${n(b)} = ${n(a)}`}</Readout>
          </>}
          {mode === "mul" && <>
            <Readout>{paren(a)} × {paren(k)} = {n(prod)}</Readout>
            <Readout color={k < 0 ? C.red : C.green}>{k < 0 ? tx(t, "figNL_flip", "negative factor: flipped to the other side of 0") : k === 0 ? tx(t, "figNL_zero", "factor 0: squashed onto 0") : tx(t, "figNL_same", "positive factor: same side of 0")}</Readout>
          </>}
          {mode === "dist" && <>
            <Readout color={C.amber}>|{n(a)} − {paren(b)}| = |{n(a - b)}| = {n(Math.abs(a - b))}</Readout>
            <Readout color={C.sky}>|{n(a)}| = {n(Math.abs(a))}</Readout>
            <Readout color={C.purple}>|{n(b)}| = {n(Math.abs(b))}</Readout>
          </>}
        </Row>
      </>}
      note={mode === "add"
        ? tx(t, "figNL_noteAdd", "Drag the blue point to choose where you start (a) and the arrow's tip to choose where you land. Adding a positive number moves right, adding a negative number moves left. Subtracting b is the same move as adding its opposite −b, so 3 − 5 and 3 + (−5) land on the same point, −2.")
        : mode === "mul"
          ? tx(t, "figNL_noteMul", "The blue arrow goes from 0 to a; drag its tip. Multiplying by b stretches it |b| times (b = 0.5 halves it). A negative b also flips it through 0 to the other side. Flip twice and you are back where you started, which is why a negative times a negative is positive.")
          : tx(t, "figNL_noteDist", "Drag both points. The amber bracket is the distance between them, |a − b|. Swapping the points changes the sign of a − b but not the distance, so |a − b| = |b − a|. The absolute value |x| is the distance from x to 0: the sign is thrown away, the size is kept.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
        <line x1={p.X(-10.6)} x2={p.X(10.6)} y1={LY} y2={LY} stroke={C.axis} strokeWidth={1.4} />
        {ticks.map(v => (
          <g key={v}>
            <line x1={p.X(v)} x2={p.X(v)} y1={LY - (v === 0 ? 7 : 4)} y2={LY + (v === 0 ? 7 : 4)} stroke={v === 0 ? C.fg : C.axis} strokeWidth={v === 0 ? 1.6 : 1} />
            <T x={p.X(v)} y={LY + 18} size={8.5} anchor="middle" color={v === 0 ? C.fg : C.axis}>{n(v)}</T>
          </g>
        ))}
        <T x={p.X(-10.4)} y={LY + 36} size={8.5} color={C.red}>{tx(t, "figNL_neg", "← negative")}</T>
        <T x={p.X(10.4)} y={LY + 36} size={8.5} anchor="end" color={C.green}>{tx(t, "figNL_pos", "positive →")}</T>

        {mode === "add" && <>
          <line x1={p.X(a)} x2={p.X(a)} y1={62} y2={LY} stroke={C.sky} strokeDasharray="3 3" />
          <line x1={X(a + b)} x2={X(a + b)} y1={62} y2={LY} stroke={col(b)} strokeDasharray="3 3" />
          <Vec a={{ x: p.X(a), y: 62 }} b={{ x: X(a + b), y: 62 }} color={col(b)} w={2.4} />
          <T x={(p.X(a) + X(a + b)) / 2} y={52} size={10} anchor="middle" color={col(b)} bold>{b >= 0 ? `+${n(b)}` : n(b)}</T>
          <circle cx={X(a + b)} cy={LY} r={5} fill={col(b)} />
          <Handle x={p.X(a)} y={LY} color={C.sky} active={drag.dragging === "a"} />
          <Handle x={X(a + b)} y={62} color={col(b)} r={4.5} active={drag.dragging === "b"} />
          <T x={p.X(a) + 9} y={LY - 10} size={9} color={C.sky}>a</T>
        </>}

        {mode === "mul" && <>
          <Vec a={{ x: p.X(0), y: 62 }} b={{ x: p.X(a), y: 62 }} color={C.sky} w={2.4} />
          <Vec a={{ x: p.X(0), y: 84 }} b={{ x: X(prod), y: 84 }} color={C.amber} w={3} />
          <T x={p.X(a)} y={50} size={9} anchor="middle" color={C.sky}>a</T>
          <T x={X(prod)} y={LY - 22} size={9} anchor={prod < 0 ? "end" : "start"} color={C.amber}>{`  a × b = ${n(prod)}  `}</T>
          {Math.abs(prod) > 10.6 && <T x={X(prod)} y={LY - 34} size={8} anchor="middle" color={C.amber}>{tx(t, "figNL_off", "(off the line)")}</T>}
          <Handle x={p.X(a)} y={62} color={C.sky} active={drag.dragging === "a"} />
        </>}

        {mode === "dist" && <>
          <line x1={p.X(Math.min(a, b))} x2={p.X(Math.max(a, b))} y1={60} y2={60} stroke={C.amber} strokeWidth={2} />
          <line x1={p.X(a)} x2={p.X(a)} y1={54} y2={LY} stroke={C.amber} strokeDasharray="3 3" />
          <line x1={p.X(b)} x2={p.X(b)} y1={54} y2={LY} stroke={C.amber} strokeDasharray="3 3" />
          <T x={p.X((a + b) / 2)} y={50} size={10} anchor="middle" color={C.amber} bold>{n(Math.abs(a - b))}</T>
          <line x1={p.X(0)} x2={p.X(a)} y1={LY + 46} y2={LY + 46} stroke={C.sky} strokeWidth={1.6} opacity={0.7} />
          <T x={p.X(a / 2)} y={LY + 42} size={8} anchor="middle" color={C.sky}>{`|a|`}</T>
          <Handle x={p.X(a)} y={LY} color={C.sky} active={drag.dragging === "a"} />
          <Handle x={p.X(b)} y={LY} color={C.purple} active={drag.dragging === "b"} />
          <T x={p.X(a) + 9} y={LY - 10} size={9} color={C.sky}>a</T>
          <T x={p.X(b) + 9} y={LY - 10} size={9} color={C.purple}>b</T>
        </>}
      </svg>
    </Figure>
  );
}
