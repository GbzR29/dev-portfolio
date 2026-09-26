"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Choice, C, T, plot, useDrag, clamp, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A pmf on the values 0 … 8 drawn as weights on a see-saw. The mean
// E[X] = Σ x p(x) is the point where the board balances: the triangle under
// it is the fulcrum. The amber band is μ ± σ, one standard deviation each
// side: the variance is the p-weighted average of the squared distances
// (x − μ)², and σ is its square root. Drag any bar up or down; the
// probabilities are rescaled so they always add to 1.

const XS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const PRESETS: Record<string, number[]> = {
  die: [0, 1, 1, 1, 1, 1, 1, 0, 0],
  loaded: [0, 1, 1, 1, 1, 1, 5, 0, 0],
  split: [3, 1, 0, 0, 0, 0, 0, 1, 3],
  peak: [0, 0, 0, 1, 6, 1, 0, 0, 0],
};
type Preset = keyof typeof PRESETS;
const W = 560, H = 250, BASE = 190;

export function ExpectationFigure({ t }: { t?: TrackTranslations }) {
  const [w, setW] = useState<number[]>(PRESETS.die);
  const [preset, setPresetRaw] = useState<Preset | "">("die");
  const setPreset = (k: Preset) => { setPresetRaw(k); setW(PRESETS[k]); };

  const total = w.reduce((s, v) => s + v, 0) || 1;
  const p = w.map(v => v / total);
  const mu = XS.reduce((s, x, i) => s + x * p[i], 0);
  const ex2 = XS.reduce((s, x, i) => s + x * x * p[i], 0);
  const vr = Math.max(0, ex2 - mu * mu), sd = Math.sqrt(vr);

  const top = Math.max(0.3, ...p) * 1.15;
  const pl = plot({ W, H: BASE, x0: -0.8, x1: 8.8, y0: 0, y1: top });

  const drag = useDrag<number>(
    q => { const i = Math.round(pl.inv(q).x); return i >= 0 && i <= 8 && q.y < BASE + 20 ? i : null; },
    (i, q) => {
      setPresetRaw("");
      // Set bar i so that its new probability is the dragged height, keeping the others' ratios.
      const want = clamp(pl.inv(q).y, 0, 0.95);
      setW(old => {
        const rest = old.reduce((s, v, j) => (j === i ? s : s + v), 0);
        const next = [...old];
        next[i] = rest === 0 ? 1 : (want * rest) / (1 - want);
        return next;
      });
    },
  );

  const fx = pl.X(mu);
  return (
    <Figure
      title={tx(t, "figExp_title", "The mean as a balance point")}
      head={<Choice value={preset as Preset} onChange={setPreset} options={[
        ["die", tx(t, "figExp_die", "fair die")],
        ["loaded", tx(t, "figExp_loaded", "loaded die")],
        ["split", tx(t, "figExp_split", "two ends")],
        ["peak", tx(t, "figExp_peak", "narrow")],
      ]} />}
      controls={<Row>
        <Readout color={C.blue}>{`E[X] = Σ x p(x) = ${f2(mu, 3)}`}</Readout>
        <Readout>{`E[X²] = ${f2(ex2, 3)}`}</Readout>
        <Readout color={C.amber}>{`Var = E[X²] − μ² = ${f2(vr, 3)}`}</Readout>
        <Readout color={C.amber}>{`σ = ${f2(sd, 3)}`}</Readout>
      </Row>}
      note={<>
        {tx(t, "figExp_note", "Each bar is a weight p(x) sitting at position x. The board balances at the mean, so a heavy bar far from the rest drags the mean towards it. The standard deviation σ is a typical distance from the mean: \"two ends\" has a large σ even though its mean is central, while \"narrow\" has a small one.")}{" "}
        <span data-mouse-only>{tx(t, "figExp_drag", "Drag a bar up or down to change its probability.")}</span>
        <span data-touch-only>{tx(t, "figExp_dragTouch", "Drag a bar up or down to change its probability.")}</span>
      </>}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-ns-resize">
        <rect x={pl.X(mu - sd)} y={8} width={Math.max(0, pl.X(mu + sd) - pl.X(mu - sd))} height={BASE - 8} fill={C.amber} opacity={0.12} />
        {XS.map((x, i) => {
          const y = pl.Y(p[i]);
          return <g key={x}>
            <rect x={pl.X(x - 0.32)} y={y} width={0.64 * pl.sx} height={BASE - y} fill={C.blue} opacity={0.75} rx={2} />
            {p[i] > 0.004 && <T x={pl.X(x)} y={y - 5} anchor="middle" color={C.blue} size={8.5}>{f2(p[i])}</T>}
            <T x={pl.X(x)} y={BASE + 30} anchor="middle" color={C.axis} size={9}>{x}</T>
          </g>;
        })}
        {/* the see-saw board and the fulcrum under the mean */}
        <rect x={pl.X(-0.5)} y={BASE} width={pl.X(8.5) - pl.X(-0.5)} height={5} fill={C.muted} opacity={0.6} rx={2} />
        <path d={`M${fx},${BASE + 5} L${fx - 11},${BASE + 22} L${fx + 11},${BASE + 22} Z`} fill={C.blue} />
        <T x={fx} y={BASE + 44} anchor="middle" color={C.blue} bold>{`μ = ${f2(mu)}`}</T>
        <T x={pl.X(mu + sd) + 4} y={20} color={C.amber}>{"μ + σ"}</T>
        <T x={pl.X(mu - sd) - 4} y={20} anchor="end" color={C.amber}>{"μ − σ"}</T>
      </svg>
    </Figure>
  );
}
