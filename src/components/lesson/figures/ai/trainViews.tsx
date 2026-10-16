"use client";

// ── Drawings shared by the live training figures ──────────────────────────────
// DecisionMap: the plane [−1.2, 1.2]² shaded by the network's output p
// (green where it says class 1, red where it says 0), with the data on top.
// LossCurve: one or two loss histories against the epoch, with an optional
// marker (the early-stopping epoch).

import { C, T, plot } from "@/components/lesson/kit/figure";
import { output, type Net } from "./mlp";
import type { Pts } from "./nnData";

const GRID = 36;
export const MAP = plot({ W: 300, H: 300, x0: -1.2, x1: 1.2, y0: -1.2, y1: 1.2 });

export function DecisionMap({ net, train, val, size = 300 }: { net: Net; train: Pts; val?: Pts; size?: number }) {
  const cell = MAP.W / GRID;
  const cells = [];
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
    const x = MAP.x0 + ((i + 0.5) * (MAP.x1 - MAP.x0)) / GRID, y = MAP.y0 + ((j + 0.5) * (MAP.y1 - MAP.y0)) / GRID;
    const p = output(net, [x, y]);
    cells.push(<rect key={`${i}-${j}`} x={i * cell} y={MAP.H - (j + 1) * cell} width={cell + 0.3} height={cell + 0.3}
      fill={p >= 0.5 ? C.green : C.red} fillOpacity={0.06 + 0.42 * Math.abs(p - 0.5)} />);
  }
  return (
    <svg viewBox={`0 0 ${MAP.W} ${MAP.H}`} className="w-full h-auto" style={{ maxWidth: size }} role="img">
      {cells}
      {val && val.X.map(([x, y], i) => (
        <circle key={`v${i}`} cx={MAP.X(x)} cy={MAP.Y(y)} r={2.6} fill="none" stroke={val.Y[i] ? C.green : C.red} strokeOpacity={0.55} strokeWidth={1} />
      ))}
      {train.X.map(([x, y], i) => (
        <circle key={i} cx={MAP.X(x)} cy={MAP.Y(y)} r={3.6} fill={train.Y[i] ? C.green : C.red} stroke="var(--code-bg)" strokeWidth={1} />
      ))}
    </svg>
  );
}

export function LossCurve({ series, marker, epochs, label }: {
  series: { values: number[]; color: string; name: string }[];
  /** An epoch to mark with a dashed vertical line. */
  marker?: { epoch: number; label: string };
  /** Width of the x axis in epochs (at least the data's length). */
  epochs: number;
  label: string;
}) {
  const top = Math.min(2, Math.max(0.8, ...series.map(s => Math.max(...s.values.filter(Number.isFinite)))));
  const P = plot({ W: 300, H: 150, x0: 0, x1: Math.max(epochs, ...series.map(s => s.values.length - 1)), y0: 0, y1: top });
  const step = Math.max(1, Math.floor(P.x1 / 300));
  return (
    <svg viewBox={`-26 -10 ${P.W + 34} ${P.H + 30}`} className="w-full h-auto" role="img">
      {[0, top / 2, top].map(v => <g key={v}>
        <line x1={0} x2={P.W} y1={P.Y(v)} y2={P.Y(v)} stroke={C.grid} />
        <T x={-4} y={P.Y(v) + 3} size={8} anchor="end">{v.toFixed(1)}</T>
      </g>)}
      {marker && marker.epoch > 0 && <g>
        <line x1={P.X(marker.epoch)} x2={P.X(marker.epoch)} y1={0} y2={P.H} stroke={C.amber} strokeDasharray="4 3" />
        <T x={P.X(marker.epoch) + 3} y={8} size={8} color={C.amber}>{marker.label}</T>
      </g>}
      {series.map(s => (
        <polyline key={s.name} fill="none" stroke={s.color} strokeWidth={1.8}
          points={s.values.filter((_, i) => i % step === 0).map((v, i) => `${P.X(i * step).toFixed(1)},${P.Y(Math.min(v, top)).toFixed(1)}`).join(" ")} />
      ))}
      {series.map((s, i) => <T key={s.name} x={P.W - 2} y={P.H - 8 - 12 * i} size={8.5} anchor="end" color={s.color} bold>{s.name}</T>)}
      <T x={P.W / 2} y={P.H + 16} size={8.5} anchor="middle">{label}</T>
    </svg>
  );
}
