"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, mulberry32 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Three ways to scatter objects (trees, rocks, enemies) over an area:
//   uniform   — every point independent: clumps and holes
//   jittered  — one point per grid cell at a random spot inside it
//   Poisson   — Bridson's algorithm: every point at least r from every other,
//               packed until no more fit ("blue noise")

type Kind = "uniform" | "jitter" | "poisson";
const S = 230;                         // square side in px (and world units)

function uniform(n: number, rnd: () => number) {
  return Array.from({ length: n }, () => [rnd() * S, rnd() * S] as [number, number]);
}
function jittered(n: number, rnd: () => number) {
  const g = Math.round(Math.sqrt(n)), c = S / g, out: [number, number][] = [];
  for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) out.push([(i + rnd()) * c, (j + rnd()) * c]);
  return out;
}
/** Bridson 2007: grid-accelerated dart throwing around active points. */
function poisson(r: number, rnd: () => number, k = 30) {
  const cell = r / Math.SQRT2;              // a cell this size can hold at most one point
  const gw = Math.ceil(S / cell);
  const grid = new Int32Array(gw * gw).fill(-1);
  const pts: [number, number][] = [], active: number[] = [];
  const put = (p: [number, number]) => { pts.push(p); active.push(pts.length - 1); grid[Math.floor(p[1] / cell) * gw + Math.floor(p[0] / cell)] = pts.length - 1; };
  put([rnd() * S, rnd() * S]);
  while (active.length) {
    const ai = Math.floor(rnd() * active.length), [px, py] = pts[active[ai]];
    let found = false;
    for (let tries = 0; tries < k; tries++) {
      // A candidate in the annulus between r and 2r around the active point
      const a = rnd() * Math.PI * 2, d = r * (1 + rnd());
      const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
      if (x < 0 || y < 0 || x >= S || y >= S) continue;
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
      let ok = true;
      for (let j = Math.max(0, gy - 2); j <= Math.min(gw - 1, gy + 2) && ok; j++)
        for (let i = Math.max(0, gx - 2); i <= Math.min(gw - 1, gx + 2); i++) {
          const q = grid[j * gw + i];
          if (q >= 0 && Math.hypot(pts[q][0] - x, pts[q][1] - y) < r) { ok = false; break; }
        }
      if (ok) { put([x, y]); found = true; break; }
    }
    if (!found) active.splice(ai, 1);          // this point is surrounded: retire it
  }
  return pts;
}

function nnStats(p: [number, number][]) {
  let min = Infinity, sum = 0;
  for (let i = 0; i < p.length; i++) {
    let best = Infinity;
    for (let j = 0; j < p.length; j++) if (i !== j) best = Math.min(best, Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1]));
    min = Math.min(min, best); sum += best;
  }
  return { min, mean: sum / p.length };
}

export function ScatterFigure({ t }: { t?: TrackTranslations }) {
  const [kind, setKind] = useState<Kind>("uniform");
  const [r, setR] = useState(18);
  const [seed, setSeed] = useState(3);
  const [discs, setDiscs] = useState(false);

  // All three use the same count, set by how many the Poisson packing fits
  const { sets, stats } = useMemo(() => {
    const p = poisson(r, mulberry32(seed));
    const n = p.length;
    const sets: Record<Kind, [number, number][]> = { poisson: p, uniform: uniform(n, mulberry32(seed + 1)), jitter: jittered(n, mulberry32(seed + 2)) };
    const stats = Object.fromEntries((Object.keys(sets) as Kind[]).map(k => [k, nnStats(sets[k])])) as Record<Kind, { min: number; mean: number }>;
    return { sets, stats };
  }, [r, seed]);

  const W = 560, H = S + 24;
  const kinds: Kind[] = ["uniform", "jitter", "poisson"];
  const cols: Record<Kind, string> = { uniform: C.red, jitter: C.amber, poisson: C.green };
  const pts = sets[kind];

  return (
    <Figure
      title={tx(t, "figScatter_title", "Scattering objects: white noise vs blue noise")}
      head={<Choice value={kind} onChange={setKind} options={[["uniform", tx(t, "figScatter_uni", "uniform random")], ["jitter", tx(t, "figScatter_jit", "jittered grid")], ["poisson", "Poisson disk"]] as const} />}
      controls={<>
        <Row>
          <div className="flex-1 min-w-[220px]"><Slider label={tx(t, "figScatter_r", "min distance r")} value={r} min={10} max={34} step={1} onChange={setR} fmt={v => `${v}`} /></div>
          <Btn active={discs} onClick={() => setDiscs(d => !d)}>{tx(t, "figScatter_discs", "show r/2 discs")}</Btn>
          <Btn onClick={() => setSeed(s => s + 1)}>{tx(t, "figScatter_new", "new seed")}</Btn>
        </Row>
        <Row>
          <Readout>n = {pts.length}</Readout>
          {kinds.map(k => <Readout key={k} color={cols[k]}>{k}: {tx(t, "figScatter_closest", "closest pair")} {stats[k].min.toFixed(1)} · {tx(t, "figScatter_mean", "mean gap")} {stats[k].mean.toFixed(1)}</Readout>)}
        </Row>
      </>}
      note={tx(t, "figScatter_note", "All three show the same number of points. Uniform random points do not spread out: nothing stops two landing on top of each other, so you get clumps and empty holes (its closest pair is often almost 0). A jittered grid guarantees one point per cell but neighbouring cells can still put points nearly touching. Poisson disk sampling guarantees a minimum distance r between every pair and keeps adding points until no gap is large enough, so the result looks natural but evenly spaced, like trees competing for light. Turn on the discs: in the Poisson set, no two discs of radius r/2 overlap.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <g transform={`translate(${(W - S) / 2},12)`}>
          <defs><clipPath id="scatterClip"><rect width={S} height={S} rx={4} /></clipPath></defs>
          <rect width={S} height={S} fill="#1c2b1f" rx={4} />
          <g clipPath="url(#scatterClip)">
            {discs && pts.map(([x, y], j) => <circle key={`d${j}`} cx={x} cy={y} r={r / 2} fill={cols[kind]} opacity={0.14} stroke={cols[kind]} strokeOpacity={0.5} />)}
            {pts.map(([x, y], j) => (
              <g key={j}>
                <circle cx={x} cy={y + 2} r={4.5} fill="#000" opacity={0.25} />
                <circle cx={x} cy={y} r={4.2} fill="#3f9e4d" />
                <circle cx={x - 1.2} cy={y - 1.2} r={1.6} fill="#7bd389" />
              </g>
            ))}
          </g>
        </g>
      </svg>
    </Figure>
  );
}
