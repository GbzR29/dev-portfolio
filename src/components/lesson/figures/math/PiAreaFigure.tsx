"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, plot, useRaf, useRerender, mulberry32, lerp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Why the area of a circle is πr²:
// pizza — cut the circle into n equal slices and lay them in a row, points
//         alternately up and down. The row is about r tall and half the
//         circumference (πr) long; with more slices it becomes a rectangle
//         of area πr · r.
// darts — throw random points at a 2 × 2 square with a circle of radius 1
//         inside. The share that lands in the circle approaches π/4 (circle
//         area over square area), so 4 × inside / total estimates π.

type Mode = "pizza" | "darts";
const W = 560, H = 300;
const TAU = Math.PI * 2;
const R = 2;
const MAX_DARTS = 20000;

/** Shortest signed turn from angle a to angle b. */
const turnTo = (a: number, b: number) => ((b - a + 3 * Math.PI) % TAU) - Math.PI;

export function PiAreaFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("pizza");
  const [n, setN] = useState(8);
  const [k, setK] = useState(0);
  const [raining, setRaining] = useState(false);
  const darts = useRef<{ xs: number[]; ys: number[]; inside: number; rng: () => number }>({ xs: [], ys: [], inside: 0, rng: mulberry32(7) });
  const rerender = useRerender();

  const throwDarts = (count: number) => {
    const d = darts.current;
    for (let i = 0; i < count && d.xs.length < MAX_DARTS; i++) {
      const x = d.rng() * 2 - 1, y = d.rng() * 2 - 1;
      d.xs.push(x); d.ys.push(y);
      if (x * x + y * y <= 1) d.inside++;
    }
    if (d.xs.length >= MAX_DARTS) setRaining(false);
    rerender();
  };
  const ref = useRaf(raining && mode === "darts", () => throwDarts(40));

  // ── pizza ──
  const pz = plot({ W, H, x0: -1.3, x1: 7.6, y0: -1.3, y1: 3.469 });
  const slices = useMemo(() => {
    const s = (TAU * R) / n, half = n / 2, out: { a0: number; ax: number; ay: number; phi: number; top: boolean }[] = [];
    for (let q = 0; q < half; q++) {
      // Top half, left to right: crust up, point down on the base line
      out.push({ a0: Math.PI - (q + 0.5) * (TAU / n), ax: (q + 1) * s, ay: 0, phi: Math.PI / 2, top: true });
      // Bottom half, left to right: crust down, point up at height r
      out.push({ a0: Math.PI + (q + 0.5) * (TAU / n), ax: (q + 0.5) * s, ay: R, phi: -Math.PI / 2, top: false });
    }
    return out;
  }, [n]);

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "pizza") {
    const h = Math.PI / n, cx = Math.PI, cy = 1;
    svg = <>
      <line x1={pz.X(-1.3)} y1={pz.Y(0)} x2={pz.X(7.6)} y2={pz.Y(0)} stroke={C.grid} strokeWidth={1} />
      {slices.map((sl, i) => {
        const ax = lerp(cx, sl.ax, k), ay = lerp(cy, sl.ay, k);
        const phi = sl.a0 + turnTo(sl.a0, sl.phi) * k;
        let d = `M${pz.X(ax)},${pz.Y(ay)}`;
        for (let j = 0; j <= 12; j++) {
          const a = phi - h + (2 * h * j) / 12;
          d += `L${pz.X(ax + R * Math.cos(a))},${pz.Y(ay + R * Math.sin(a))}`;
        }
        return <path key={i} d={d + "Z"} fill={sl.top ? C.amber : C.sky} fillOpacity={0.4} stroke={sl.top ? C.amber : C.sky} strokeWidth={1.3} strokeLinejoin="round" />;
      })}
      {k > 0.97 && <>
        <line x1={pz.X(0)} y1={pz.Y(-0.45)} x2={pz.X(Math.PI * R)} y2={pz.Y(-0.45)} stroke={C.pink} strokeWidth={1.4} />
        <T x={pz.X(Math.PI)} y={pz.Y(-0.45) + 14} size={10.5} anchor="middle" color={C.pink} bold>{tx(t, "figPiA_half", "half the crust = πr")}</T>
        <line x1={pz.X(-0.35)} y1={pz.Y(0)} x2={pz.X(-0.35)} y2={pz.Y(R)} stroke={C.green} strokeWidth={1.4} />
        <T x={pz.X(-0.45)} y={pz.Y(1) + 4} size={10.5} anchor="end" color={C.green} bold>r</T>
      </>}
    </>;
    controls = <>
      <Slider label={tx(t, "figPiA_n", "slices")} value={n} min={4} max={48} step={2} onChange={setN} fmt={v => String(v)} width="w-20" />
      <Slider label={tx(t, "figPiA_k", "rearrange")} value={k} min={0} max={1} step={0.01} onChange={setK} fmt={v => `${Math.round(v * 100)}%`} width="w-20" />
      <Row>
        <Readout color={C.pink}>{tx(t, "figPiA_w", "width ≈ half of 2πr = πr")}</Readout>
        <Readout color={C.green}>{tx(t, "figPiA_h", "height ≈ r")}</Readout>
        <Readout>{tx(t, "figPiA_a", "area ≈ πr · r = πr²")}</Readout>
      </Row>
    </>;
    note = tx(t, "figPiA_noteZ", "Cut the circle into equal slices and lay them side by side, crust up and crust down alternately. Half the slices carry the top half of the crust, so the row's wavy top is half the circumference, πr; the bottom is the other half. Each slice is r long, so the row is r tall. Few slices give a bumpy parallelogram; add slices and the bumps flatten into a rectangle πr wide and r tall. Nothing was added or removed, so the circle's area is πr · r = πr².");
  } else {
    const p = plot({ W, H, x0: -2.867, x1: 2.867, y0: -1.536, y1: 1.536 });
    const d = darts.current, total = d.xs.length;
    const est = total ? (4 * d.inside) / total : 0;
    let inP = "", outP = "";
    for (let i = 0; i < total; i++) {
      const x = p.X(d.xs[i]).toFixed(1), y = p.Y(d.ys[i]).toFixed(1);
      const dot = `M${x},${y}h2.4v2.4h-2.4z`;
      if (d.xs[i] * d.xs[i] + d.ys[i] * d.ys[i] <= 1) inP += dot; else outP += dot;
    }
    svg = <>
      <rect x={p.X(-1)} y={p.Y(1)} width={2 * p.sx} height={2 * p.sx} fill="none" stroke={C.fg} strokeWidth={1.6} />
      <path d={outP} fill={C.pink} />
      <path d={inP} fill={C.sky} />
      <circle cx={p.X(0)} cy={p.Y(0)} r={p.sx} fill="none" stroke={C.fg} strokeWidth={1.6} />
      <T x={p.X(1.12)} y={p.Y(0.9)} size={10} color={C.muted}>{tx(t, "figPiA_sq", "square: 2 × 2 = 4")}</T>
      <T x={p.X(1.12)} y={p.Y(0.9) + 15} size={10} color={C.muted}>{tx(t, "figPiA_circ", "circle: π · 1² = π")}</T>
      <T x={p.X(1.12)} y={p.Y(0.9) + 30} size={10} color={C.muted}>{tx(t, "figPiA_share", "share inside → π/4")}</T>
      <T x={p.X(-2.8)} y={p.Y(0.9)} size={12} color={C.fg} bold>{`π ≈ ${est.toFixed(4)}`}</T>
      <T x={p.X(-2.8)} y={p.Y(0.9) + 16} size={9.5} color={C.muted}>{`${tx(t, "figPiA_err", "error")} ${total ? Math.abs(est - Math.PI).toFixed(4) : "–"}`}</T>
    </>;
    controls = <>
      <Row>
        <Btn active={raining} onClick={() => setRaining(v => !v)}>{raining ? tx(t, "figPiA_stop", "stop") : tx(t, "figPiA_rain", "rain darts")}</Btn>
        <Btn onClick={() => throwDarts(1)}>+1</Btn>
        <Btn onClick={() => throwDarts(100)}>+100</Btn>
        <Btn onClick={() => throwDarts(1000)}>+1000</Btn>
        <Btn onClick={() => { setRaining(false); darts.current = { xs: [], ys: [], inside: 0, rng: mulberry32(Math.floor(Math.random() * 1e9)) }; rerender(); }}>{tx(t, "figPi_reset", "reset")}</Btn>
      </Row>
      <Row>
        <Readout color={C.sky}>{`${tx(t, "figPiA_in", "inside")} = ${d.inside}`}</Readout>
        <Readout>{`${tx(t, "figPiA_total", "total")} = ${total}`}</Readout>
        <Readout color={C.green}>{`4 · ${d.inside} / ${total || 1} = ${est.toFixed(4)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figPiA_noteD", "Throw darts that land anywhere in the square with equal chance. The circle (radius 1, area π) covers π/4 ≈ 78.5% of the square (area 4), so about that share of the darts land inside, and four times that share estimates π. A dart is inside when x² + y² ≤ 1, which is Pythagoras again. The estimate wobbles and improves slowly: 100 times more darts give only about 10 times less error. This is the Monte Carlo method, and path tracers estimate lighting in exactly this way.");
  }

  return (
    <Figure
      title={tx(t, "figPiA_title", "The area of a circle")}
      head={<Choice value={mode} onChange={v => { setMode(v); setRaining(false); }} options={[
        ["pizza", tx(t, "figPiA_mPizza", "pizza")],
        ["darts", tx(t, "figPiA_mDarts", "darts")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
      </div>
    </Figure>
  );
}
