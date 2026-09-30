"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T, mulberry32, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The curse of dimensionality. 500 random points fill the unit cube in d
// dimensions; the histogram shows their distances from one random query
// point, divided by the largest. In 2D the distances spread from near 0 to 1:
// some points are clearly near, others clearly far. As d grows the histogram
// squeezes into a narrow spike: the nearest and the farthest point are almost
// equally far, and "nearest neighbour" stops meaning much.

const N = 500, BINS = 40;
const W = 620, H = 200, PAD = 24;

export function DimensionFigure({ t }: { t?: TrackTranslations }) {
  const [d, setD] = useState(2);
  const [seed, setSeed] = useState(3);
  const L = (k: string, en: string) => tx(t, `figAiDim_${k}`, en);

  const { hist, ratio, peak } = useMemo(() => {
    const rnd = mulberry32(seed * 1000 + d);
    const q = Array.from({ length: d }, rnd);
    const dist = Array.from({ length: N }, () => {
      let s = 0;
      for (let j = 0; j < d; j++) { const v = rnd() - q[j]; s += v * v; }
      return Math.sqrt(s);
    });
    const max = Math.max(...dist), min = Math.min(...dist);
    const h = new Array<number>(BINS).fill(0);
    for (const v of dist) h[Math.min(BINS - 1, Math.floor((v / max) * BINS))]++;
    return { hist: h, ratio: min / max, peak: Math.max(...h) };
  }, [d, seed]);

  const bw = (W - 2 * PAD) / BINS;
  return (
    <Figure
      title={L("title", "The curse of dimensionality")}
      head={<Btn onClick={() => setSeed(s => s + 1)}>{L("resample", "new points")}</Btn>}
      controls={<>
        <Slider label={L("dims", "dimensions d")} value={Math.log2(d)} min={0} max={10} step={1} onChange={v => setD(2 ** v)} fmt={() => `${d}`} />
        <Row>
          <Readout>{L("ratio", "nearest / farthest")} = {f2(ratio, 3)}</Readout>
          <Readout color={C.muted}>{L("side", "cube side holding 1% of the points")} = {f2(0.01 ** (1 / d), 3)}</Readout>
        </Row>
      </>}
      note={L("note", "Each bar counts how many of the 500 points lie at that distance from the query, as a fraction of the farthest distance. In 1 or 2 dimensions the ratio nearest/farthest is close to 0: neighbours really are near. In 16 dimensions it is already about 0.4, and in 1024 about 0.9, so the \"nearest\" point is barely nearer than any other. The second readout is the side of a small cube that contains 1% of uniformly spread data: 0.1 of the range in 2D, 0.63 in 10D, 0.955 in 100D, so a \"neighbourhood\" must span almost the whole range of every feature.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke={C.axis} />
        {hist.map((c, i) => {
          const h = (c / peak) * (H - 2 * PAD);
          return <rect key={i} x={PAD + i * bw + 1} y={H - PAD - h} width={bw - 2} height={h} fill={C.purple} fillOpacity={0.75} />;
        })}
        {[0, 0.25, 0.5, 0.75, 1].map(v => <T key={v} x={PAD + v * (W - 2 * PAD)} y={H - 8} size={8} anchor="middle">{v}</T>)}
        <T x={W - PAD} y={16} size={9} anchor="end" bold color={C.fg}>d = {d}</T>
        <T x={PAD} y={16} size={8.5}>{L("axis", "distance / farthest distance →")}</T>
      </svg>
    </Figure>
  );
}
