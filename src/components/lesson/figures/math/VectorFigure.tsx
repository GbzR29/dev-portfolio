"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Vec, Handle, plot, Grid, useDrag, nearest, f2, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The basic vector operations, with draggable arrows:
//   add       a + b: tip to tail, and the parallelogram that shows a + b = b + a
//   subtract  b − a: the arrow from a's tip to b's tip ("from a to b")
//   scale     k·a: same line, length × |k|, flipped when k < 0
//   normalize a / |a|: same direction, length 1 (on the unit circle)
//   target    an enemy moving toward the player: direction = normalize(P − E)

type Mode = "add" | "sub" | "scale" | "norm" | "target";

export function VectorFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("add");
  const [a, setA] = useState<Pt>({ x: 3, y: 1 });
  const [b, setB] = useState<Pt>({ x: 1, y: 2.5 });
  const [k, setK] = useState(1.5);
  const [speed, setSpeed] = useState(1.5);
  const p = plot({ W: 560, H: 300, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
  const S = (v: Pt) => ({ x: p.X(v.x), y: p.Y(v.y) });
  const O = S({ x: 0, y: 0 });

  const handles: [string, Pt][] = mode === "target" ? [["a", a], ["b", b]] : mode === "scale" || mode === "norm" ? [["a", a]] : [["a", a], ["b", b]];
  const drag = useDrag<string>(q => nearest(q, handles.map(([id, v]) => [id, S(v)] as [string, Pt]), 16),
    (id, q) => {
      const w = p.inv(q), v = { x: Math.round(w.x * 10) / 10, y: Math.round(w.y * 10) / 10 };
      (id === "a" ? setA : setB)({ x: Math.max(-5.4, Math.min(5.4, v.x)), y: Math.max(-2.9, Math.min(2.9, v.y)) });
    });

  const len = (v: Pt) => Math.hypot(v.x, v.y);
  const add = { x: a.x + b.x, y: a.y + b.y }, sub = { x: b.x - a.x, y: b.y - a.y };
  const sc = { x: a.x * k, y: a.y * k };
  const la = len(a), nrm = la > 1e-9 ? { x: a.x / la, y: a.y / la } : { x: 0, y: 0 };
  // target mode: a = enemy position, b = player position
  const toP = { x: b.x - a.x, y: b.y - a.y }, dist = len(toP);
  const dir = dist > 1e-9 ? { x: toP.x / dist, y: toP.y / dist } : { x: 0, y: 0 };

  return (
    <Figure
      title={tx(t, "figVec_title", "Vector operations")}
      head={<Choice value={mode} onChange={setMode} options={[["add", "a + b"], ["sub", "b − a"], ["scale", "k · a"], ["norm", "a / |a|"], ["target", tx(t, "figVec_target", "move to target")]] as const} />}
      controls={<>
        {mode === "scale" && <Slider label="k" value={k} min={-2} max={2} step={0.05} onChange={setK} width="w-10" />}
        {mode === "target" && <Slider label={tx(t, "figVec_speed", "speed")} value={speed} min={0.2} max={4} step={0.1} onChange={setSpeed} width="w-16" fmt={v => `${v.toFixed(1)} u/s`} />}
        <Row>
          {mode !== "target" && <Readout color={C.red}>a = ({f2(a.x, 1)}, {f2(a.y, 1)}) · |a| = {f2(la)}</Readout>}
          {(mode === "add" || mode === "sub") && <Readout color={C.sky}>b = ({f2(b.x, 1)}, {f2(b.y, 1)}) · |b| = {f2(len(b))}</Readout>}
          {mode === "add" && <Readout color={C.green}>a + b = ({f2(add.x, 1)}, {f2(add.y, 1)}) · |a + b| = {f2(len(add))}</Readout>}
          {mode === "sub" && <Readout color={C.amber}>b − a = ({f2(sub.x, 1)}, {f2(sub.y, 1)}) · {tx(t, "figVec_dist", "distance")} = {f2(len(sub))}</Readout>}
          {mode === "scale" && <Readout color={C.green}>{f2(k)} · a = ({f2(sc.x)}, {f2(sc.y)}) · |k·a| = {f2(len(sc))}</Readout>}
          {mode === "norm" && <Readout color={C.green}>â = ({f2(nrm.x, 3)}, {f2(nrm.y, 3)}) · |â| = {f2(len(nrm), 3)}</Readout>}
          {mode === "target" && <>
            <Readout color={C.amber}>P − E = ({f2(toP.x, 1)}, {f2(toP.y, 1)})</Readout>
            <Readout>{tx(t, "figVec_dist", "distance")} = {f2(dist)}</Readout>
            <Readout color={C.green}>{tx(t, "figVec_dir", "direction")} = ({f2(dir.x, 3)}, {f2(dir.y, 3)})</Readout>
            <Readout color={C.sky}>{tx(t, "figVec_vel", "velocity")} = {tx(t, "figVec_dir", "direction")} × {speed.toFixed(1)}</Readout>
          </>}
        </Row>
      </>}
      note={{
        add: tx(t, "figVec_noteAdd", "Drag the tips. To add, put b's tail on a's tip: the sum goes from the start of a to the end of b. Doing it the other way round (a on b's tip, dashed) lands in the same place: the two paths form a parallelogram whose diagonal is a + b. In components it is just (aₓ + bₓ, a_y + b_y). Note |a + b| ≤ |a| + |b|: a detour is never shorter."),
        sub: tx(t, "figVec_noteSub", "b − a is the arrow that goes from the tip of a to the tip of b: \"where b is, seen from a\". If a and b are positions, b − a is the displacement between them and its length is their distance. Remember the order: \"to minus from\"."),
        scale: tx(t, "figVec_noteScale", "Multiplying by a number k (a scalar) stretches the vector along its own line: k = 2 doubles it, k = 0.5 halves it, k = −1 reverses it, k = 0 collapses it to the zero vector. Both components are multiplied by k, so the direction (the ratio between them) is kept."),
        norm: tx(t, "figVec_noteNorm", "Dividing a vector by its own length gives a unit vector: same direction, length exactly 1, so its tip is on the unit circle. Unit vectors (written with a hat, â) represent pure directions: facing, surface normals, light directions. Drag a to the origin: the zero vector has no direction and normalising it divides by zero, the most common source of NaN in game code."),
        target: tx(t, "figVec_noteTarget", "The red dot is an enemy E, the blue one the player P. P − E points from the enemy to the player; its length is the distance. Normalising it keeps only the direction, and multiplying by the speed gives a velocity that is the same wherever the player is. Without the normalisation, the enemy would rush when far away and crawl when close."),
      }[mode]}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto cursor-grab">
        <Grid p={p} step={1} />
        {mode === "add" && <>
          <Vec a={S(a)} b={S(add)} color={C.sky} dash="5 4" opacity={0.5} />
          <Vec a={S(b)} b={S(add)} color={C.red} dash="5 4" opacity={0.5} />
          <Vec a={O} b={S(add)} color={C.green} w={2.8} />
          <Vec a={O} b={S(a)} color={C.red} />
          <Vec a={O} b={S(b)} color={C.sky} />
          <T x={S(add).x + 8} y={S(add).y - 6} size={10} bold color={C.green}>a + b</T>
        </>}
        {mode === "sub" && <>
          <Vec a={O} b={S(a)} color={C.red} />
          <Vec a={O} b={S(b)} color={C.sky} />
          <Vec a={S(a)} b={S(b)} color={C.amber} w={2.8} />
          <Vec a={O} b={S(sub)} color={C.amber} dash="4 3" opacity={0.45} />
          <T x={(S(a).x + S(b).x) / 2 + 8} y={(S(a).y + S(b).y) / 2} size={10} bold color={C.amber}>b − a</T>
        </>}
        {mode === "scale" && <>
          <line x1={p.X(-a.x * 3)} y1={p.Y(-a.y * 3)} x2={p.X(a.x * 3)} y2={p.Y(a.y * 3)} stroke={C.muted} strokeDasharray="3 4" opacity={0.5} />
          <Vec a={O} b={S(sc)} color={C.green} w={4} opacity={0.75} />
          <Vec a={O} b={S(a)} color={C.red} />
          <T x={S(sc).x + 8} y={S(sc).y + 14} size={10} bold color={C.green}>{`${f2(k)}·a`}</T>
        </>}
        {mode === "norm" && <>
          <circle cx={O.x} cy={O.y} r={p.sx} fill="none" stroke={C.muted} strokeDasharray="4 3" />
          <Vec a={O} b={S(a)} color={C.red} />
          <Vec a={O} b={S(nrm)} color={C.green} w={3.2} />
          <T x={S(nrm).x + 6} y={S(nrm).y - 8} size={10} bold color={C.green}>â</T>
        </>}
        {mode === "target" && <>
          <Vec a={S(a)} b={S(b)} color={C.amber} dash="5 4" opacity={0.7} />
          <Vec a={S(a)} b={S({ x: a.x + dir.x * speed, y: a.y + dir.y * speed })} color={C.green} w={3} />
          <circle cx={S(b).x} cy={S(b).y} r={9} fill={C.sky} />
          <circle cx={S(a).x} cy={S(a).y} r={9} fill={C.red} />
          <T x={S(b).x + 12} y={S(b).y + 4} size={10} bold color={C.sky}>P</T>
          <T x={S(a).x + 12} y={S(a).y + 4} size={10} bold color={C.red}>E</T>
        </>}
        {mode !== "target" && handles.map(([id, v]) => <Handle key={id} x={S(v).x} y={S(v).y} color={id === "a" ? C.red : C.sky} r={4.5} />)}
        {mode !== "target" && <T x={S(a).x + 8} y={S(a).y + 14} size={10} bold color={C.red}>a</T>}
        {(mode === "add" || mode === "sub") && <T x={S(b).x + 8} y={S(b).y - 6} size={10} bold color={C.sky}>b</T>}
      </svg>
    </Figure>
  );
}
