"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, plot, Grid } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// ratios  — a right triangle with angle θ. Change its size: every side changes
//           but the three ratios (sin, cos, tan) do not, because all right
//           triangles with the same θ are similar. Change θ: the ratios change.
// special — the two triangles whose ratios are exact: half a square (45°) and
//           half an equilateral triangle (30° and 60°), sides by Pythagoras.
// height  — measuring a height from the ground: distance d and the angle up to
//           the top θ give h = d · tan θ.

type Mode = "ratios" | "special" | "height";
const W = 560, H = 300;
const DEG = Math.PI / 180;
const n2 = (v: number) => (+v.toFixed(2)).toString();
const n3 = (v: number) => v.toFixed(3);

export function RightTriangleFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("ratios");
  const [th, setTh] = useState(35);
  const [size, setSize] = useState(5);
  const [d, setD] = useState(6);
  const [el, setEl] = useState(30);

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "ratios") {
    const p = plot({ W, H, x0: -0.8, x1: 8.533, y0: -0.7, y1: 4.3 });
    const s = Math.sin(th * DEG), c = Math.cos(th * DEG);
    const hyp = Math.min(size, 4.1 / s, 7.9 / c);
    const A = { x: 0, y: 0 }, B = { x: hyp * c, y: 0 }, Cc = { x: hyp * c, y: hyp * s };
    const P = (q: { x: number; y: number }) => `${p.X(q.x)},${p.Y(q.y)}`;
    const arc = 0.7;
    svg = <>
      <Grid p={p} step={1} labels={false} />
      <polygon points={[A, B, Cc].map(P).join(" ")} fill={C.sky} fillOpacity={0.12} stroke={C.fg} strokeWidth={2} strokeLinejoin="round" />
      <polygon points={[A, { x: c, y: 0 }, { x: c, y: s }].map(P).join(" ")} fill={C.purple} fillOpacity={0.25} stroke={C.purple} strokeWidth={1.2} strokeDasharray="3 2" />
      <line x1={p.X(A.x)} y1={p.Y(0)} x2={p.X(B.x)} y2={p.Y(0)} stroke={C.red} strokeWidth={3} />
      <line x1={p.X(B.x)} y1={p.Y(0)} x2={p.X(Cc.x)} y2={p.Y(Cc.y)} stroke={C.green} strokeWidth={3} />
      <line x1={p.X(A.x)} y1={p.Y(0)} x2={p.X(Cc.x)} y2={p.Y(Cc.y)} stroke={C.amber} strokeWidth={3} />
      <path d={`M${p.X(B.x) - 10},${p.Y(0)} v-10 h10`} fill="none" stroke={C.fg} strokeWidth={1.1} />
      <path d={`M${p.X(arc)},${p.Y(0)} A${arc * p.sx},${arc * p.sy} 0 0 0 ${p.X(arc * c)},${p.Y(arc * s)}`} fill="none" stroke={C.fg} strokeWidth={1.3} />
      <T x={p.X(arc + 0.15)} y={p.Y(0.18)} size={10} color={C.fg} bold>θ</T>
      <T x={p.X(B.x / 2)} y={p.Y(0) + 15} size={10} anchor="middle" color={C.red} bold>{`${tx(t, "figRt_adj", "adj")} ${n2(B.x)}`}</T>
      <T x={p.X(B.x) + 6} y={p.Y(Cc.y / 2)} size={10} color={C.green} bold>{`${tx(t, "figRt_opp", "opp")} ${n2(Cc.y)}`}</T>
      <T x={p.X(Cc.x / 2) - 8} y={p.Y(Cc.y / 2) - 6} size={10} anchor="end" color={C.amber} bold>{`${tx(t, "figRt_hyp", "hyp")} ${n2(hyp)}`}</T>
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figRt_angle", "angle θ")} value={th} min={5} max={85} step={1} onChange={setTh} fmt={v => `${v}°`} />
        <Slider label={tx(t, "figRt_size", "size")} value={size} min={1.5} max={8} step={0.1} onChange={setSize} fmt={n2} />
      </Sliders>
      <Row>
        <Readout color={C.green}>{`sin θ = ${tx(t, "figRt_opp", "opp")}/${tx(t, "figRt_hyp", "hyp")} = ${n3(s)}`}</Readout>
        <Readout color={C.red}>{`cos θ = ${tx(t, "figRt_adj", "adj")}/${tx(t, "figRt_hyp", "hyp")} = ${n3(c)}`}</Readout>
        <Readout color={C.sky}>{`tan θ = ${tx(t, "figRt_opp", "opp")}/${tx(t, "figRt_adj", "adj")} = ${n3(s / c)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRt_noteR", "Change the size: all three sides grow or shrink together, but the three ratios in the readouts do not move, because every right triangle with the angle θ is similar to every other (AA). The small purple triangle is the one with hypotenuse 1: its sides are exactly cos θ and sin θ. Change θ and the ratios change. So each ratio is a function of the angle alone: that is what sine, cosine and tangent are.");
  } else if (mode === "special") {
    const p = plot({ W, H, x0: -0.5, x1: 8.833, y0: -0.8, y1: 4.2 });
    const k = 3;
    const Q = (x: number, y: number) => `${p.X(x)},${p.Y(y)}`;
    const ox = 4.6;
    svg = <>
      {/* half a square */}
      <polygon points={[Q(0, 0), Q(k, 0), Q(k, k), Q(0, k)].join(" ")} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="4 3" />
      <polygon points={[Q(0, 0), Q(k, 0), Q(k, k)].join(" ")} fill={C.sky} fillOpacity={0.2} stroke={C.sky} strokeWidth={2} strokeLinejoin="round" />
      <T x={p.X(k / 2)} y={p.Y(0) + 15} size={10.5} anchor="middle" color={C.fg} bold>1</T>
      <T x={p.X(k) + 6} y={p.Y(k / 2)} size={10.5} color={C.fg} bold>1</T>
      <T x={p.X(k / 2) - 10} y={p.Y(k / 2) - 4} size={10.5} anchor="end" color={C.amber} bold>√2</T>
      <T x={p.X(0.45)} y={p.Y(0.15)} size={10} color={C.fg}>45°</T>
      <T x={p.X(k) - 26} y={p.Y(k - 0.55)} size={10} color={C.fg}>45°</T>
      {/* half an equilateral triangle with side 2, u view units per unit */}
      {(() => {
        const u = 1.75, hgt = Math.sqrt(3) * u;
        return <>
          <polygon points={[Q(ox, 0), Q(ox + 2 * u, 0), Q(ox + u, hgt)].join(" ")} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="4 3" />
          <polygon points={[Q(ox, 0), Q(ox + u, 0), Q(ox + u, hgt)].join(" ")} fill={C.pink} fillOpacity={0.2} stroke={C.pink} strokeWidth={2} strokeLinejoin="round" />
          <T x={p.X(ox + u / 2)} y={p.Y(0) + 15} size={10.5} anchor="middle" color={C.fg} bold>1</T>
          <T x={p.X(ox + u) + 6} y={p.Y(hgt / 2)} size={10.5} color={C.fg} bold>√3</T>
          <T x={p.X(ox + u / 2) - 8} y={p.Y(hgt / 2)} size={10.5} anchor="end" color={C.amber} bold>2</T>
          <T x={p.X(ox + 0.35)} y={p.Y(0.15)} size={10} color={C.fg}>60°</T>
          <T x={p.X(ox + u) - 22} y={p.Y(hgt - 0.75)} size={10} color={C.fg}>30°</T>
        </>;
      })()}
    </>;
    controls = <Row>
      <Readout color={C.sky}>{`sin 45° = cos 45° = 1/√2 ≈ 0.707`}</Readout>
      <Readout color={C.pink}>{`sin 30° = cos 60° = 1/2`}</Readout>
      <Readout color={C.pink}>{`sin 60° = cos 30° = √3/2 ≈ 0.866`}</Readout>
    </Row>;
    note = tx(t, "figRt_noteS", "Two triangles give exact values. Cut a square with side 1 along its diagonal: two right triangles with 45° angles and legs 1, so the hypotenuse is √2 by Pythagoras. Cut an equilateral triangle with side 2 down the middle: its angles are 60°, the cut makes 30° at the top, the base half is 1, and the height is √(4 − 1) = √3. Read any ratio off the pictures.");
  } else {
    const p = plot({ W, H, x0: -1, x1: 9.333, y0: -0.8, y1: 4.733 });
    const h = d * Math.tan(el * DEG), hs = Math.min(h, 4.6);
    const eye = { x: 0, y: 0 };
    svg = <>
      <line x1={0} y1={p.Y(0)} x2={W} y2={p.Y(0)} stroke={C.axis} strokeWidth={1.4} />
      <line x1={p.X(eye.x)} y1={p.Y(0)} x2={p.X(d)} y2={p.Y(hs)} stroke={C.amber} strokeWidth={2} strokeDasharray="5 3" />
      <line x1={p.X(d)} y1={p.Y(0)} x2={p.X(d)} y2={p.Y(hs)} stroke={C.green} strokeWidth={5} strokeLinecap="round" />
      <circle cx={p.X(d)} cy={p.Y(hs)} r={9} fill={C.green} fillOpacity={0.5} />
      <line x1={p.X(0)} y1={p.Y(0) + 12} x2={p.X(d)} y2={p.Y(0) + 12} stroke={C.red} strokeWidth={1.5} />
      <T x={p.X(d / 2)} y={p.Y(0) + 26} size={10} anchor="middle" color={C.red} bold>{`d = ${n2(d)} m`}</T>
      <T x={p.X(d) + 12} y={p.Y(hs / 2)} size={10} color={C.green} bold>{`h = ${n2(h)} m`}</T>
      <path d={`M${p.X(1)},${p.Y(0)} A${p.sx},${p.sy} 0 0 0 ${p.X(Math.cos(el * DEG))},${p.Y(Math.sin(el * DEG))}`} fill="none" stroke={C.fg} strokeWidth={1.3} />
      <T x={p.X(1.1)} y={p.Y(0.2)} size={10} color={C.fg} bold>{`${el}°`}</T>
      <circle cx={p.X(0)} cy={p.Y(0)} r={5} fill={C.fg} />
      <T x={p.X(0)} y={p.Y(0) + 17} size={9.5} anchor="middle" color={C.fg}>{tx(t, "figRt_you", "you")}</T>
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figRt_dist", "distance d")} value={d} min={1} max={8} step={0.5} onChange={setD} fmt={v => `${n2(v)} m`} />
        <Slider label={tx(t, "figRt_elev", "angle up")} value={el} min={5} max={70} step={1} onChange={setEl} fmt={v => `${v}°`} />
      </Sliders>
      <Row>
        <Readout color={C.sky}>{`tan ${el}° = ${n3(Math.tan(el * DEG))}`}</Readout>
        <Readout color={C.green}>{`h = d · tan θ = ${n2(d)} · ${n3(Math.tan(el * DEG))} = ${n2(h)} m`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRt_noteH", "Stand a distance d from a tower and measure the angle up to its top. The ground, the tower and your line of sight make a right triangle: d is the side adjacent to the angle and the height h is the side opposite it, so tan θ = h/d and h = d · tan θ. Surveyors measure mountains this way; games use the same triangle to aim a turret up at a flying target.");
  }

  return (
    <Figure
      title={tx(t, "figRt_title", "Ratios in a right triangle")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["ratios", tx(t, "figRt_mRatios", "ratios")],
        ["special", tx(t, "figRt_mSpecial", "special angles")],
        ["height", tx(t, "figRt_mHeight", "measure a height")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
