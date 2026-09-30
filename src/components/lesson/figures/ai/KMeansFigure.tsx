"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, C, T, plot, mulberry32, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// k-means on 90 unlabelled points drawn around four hidden centres. "Step"
// alternates the two halves of Lloyd's algorithm: assign every point to its
// nearest centroid (the background shows each centroid's territory), then move
// every centroid to the mean of its points (the trails show where they came
// from). The inertia J, the sum of squared distances to the assigned
// centroid, can only go down. Random starts sometimes put two centroids in
// one blob and none in another, a local minimum; k-means++ starts spread out.
// The small chart is the elbow plot: the best J found for each k.

type V = [number, number];
const P = plot({ W: 620, H: 300, x0: 0, x1: 12.4, y0: 0, y1: 6 });   // 50 units per world unit on both axes
const COLORS = [C.sky, C.amber, C.green, C.pink, C.purple, C.teal];
const CELL = 12;
const d2 = (a: V, b: V) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

const POINTS: V[] = (() => {
  const rnd = mulberry32(21);
  const g = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const centres: [number, number, number, number][] = [[2.2, 1.8, 0.55, 25], [3.0, 4.4, 0.55, 20], [7.4, 4.2, 0.65, 25], [9.6, 1.6, 0.5, 20]];
  return centres.flatMap(([cx, cy, s, n]) => Array.from({ length: n }, () => [cx + s * g(), cy + s * g()] as V));
})();

const nearestIdx = (p: V, cs: V[]) => cs.reduce((b, c, i) => (d2(p, c) < d2(p, cs[b]) ? i : b), 0);
const inertia = (cs: V[], as: number[]) => POINTS.reduce((s, p, i) => s + d2(p, cs[as[i]]), 0);

function initCentroids(k: number, mode: "random" | "pp", seed: number): V[] {
  const rnd = mulberry32(seed * 97 + k);
  if (mode === "random") {                                // k distinct points chosen uniformly
    const idx = new Set<number>();
    while (idx.size < k) idx.add(Math.floor(rnd() * POINTS.length));
    return [...idx].map(i => [...POINTS[i]] as V);
  }
  const cs: V[] = [[...POINTS[Math.floor(rnd() * POINTS.length)]] as V];
  while (cs.length < k) {                                 // k-means++: pick with probability ∝ D(x)²
    const D = POINTS.map(p => Math.min(...cs.map(c => d2(p, c))));
    let r = rnd() * D.reduce((s, v) => s + v, 0), i = 0;
    while (r > D[i] && i < D.length - 1) r -= D[i++];
    cs.push([...POINTS[i]] as V);
  }
  return cs;
}

function update(cs: V[], as: number[]): V[] {
  return cs.map((c, k) => {
    const mine = POINTS.filter((_, i) => as[i] === k);
    if (!mine.length) return c;                           // an empty cluster keeps its centroid
    return [mine.reduce((s, p) => s + p[0], 0) / mine.length, mine.reduce((s, p) => s + p[1], 0) / mine.length];
  });
}

function converge(cs: V[]) {
  let as = POINTS.map(p => nearestIdx(p, cs));
  for (let it = 0; it < 100; it++) {
    const next = update(cs, as);
    const nas = POINTS.map(p => nearestIdx(p, next));
    cs = next;
    if (nas.every((a, i) => a === as[i])) break;
    as = nas;
  }
  return { cs, as };
}

type State = { cs: V[]; as: number[] | null; trails: V[][]; iter: number; phase: "assign" | "update"; done: boolean };
const fresh = (k: number, mode: "random" | "pp", seed: number): State => {
  const cs = initCentroids(k, mode, seed);
  return { cs, as: null, trails: cs.map(c => [c]), iter: 0, phase: "assign", done: false };
};

export function KMeansFigure({ t }: { t?: TrackTranslations }) {
  const [k, setK] = useState(4);
  const [mode, setMode] = useState<"random" | "pp">("random");
  const [seed, setSeed] = useState(1);                     // this random start ends in a local minimum (J ≈ 103)
  const [st, setSt] = useState<State>(() => fresh(4, "random", 1));
  const L = (key: string, en: string) => tx(t, `figAiKm_${key}`, en);

  const restart = (k2 = k, m2 = mode, s2 = seed) => { setK(k2); setMode(m2); setSeed(s2); setSt(fresh(k2, m2, s2)); };
  const step = () => setSt(s => {
    if (s.done) return s;
    if (s.phase === "assign") {
      const as = POINTS.map(p => nearestIdx(p, s.cs));
      const same = s.as !== null && as.every((a, i) => a === s.as![i]);
      return { ...s, as, phase: "update", done: same };
    }
    const cs = update(s.cs, s.as!);
    return { ...s, cs, trails: s.trails.map((tr, i) => [...tr, cs[i]]), iter: s.iter + 1, phase: "assign" };
  });
  const run = () => setSt(s => {                          // the same two steps as "step", repeated until nothing changes
    let { cs, as, trails, iter } = s;
    if (!as) as = POINTS.map(p => nearestIdx(p, cs));
    for (let it = 0; it < 100; it++) {
      cs = update(cs, as);
      trails = trails.map((tr, i) => [...tr, cs[i]]);
      iter++;
      const next = POINTS.map(p => nearestIdx(p, cs));
      const same = next.every((a, i) => a === as![i]);
      as = next;
      if (same) break;
    }
    return { cs, as, trails, iter, phase: "update", done: true };
  });

  const elbow = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const kk = i + 1;
    let best = Infinity;
    for (let r = 0; r < 6; r++) { const { cs, as } = converge(initCentroids(kk, "pp", 500 + r)); best = Math.min(best, inertia(cs, as)); }
    return best;
  }), []);

  const cells = useMemo(() => {
    if (!st.as) return [];
    const out: { x: number; y: number; c: number }[] = [];
    for (let x = 0; x < P.W; x += CELL)
      for (let y = 0; y < P.H; y += CELL) {
        const w = P.inv({ x: x + CELL / 2, y: y + CELL / 2 });
        out.push({ x, y, c: nearestIdx([w.x, w.y], st.cs) });
      }
    return out;
  }, [st.cs, st.as]);

  const J = st.as ? inertia(st.cs, st.as) : null;
  const E = { x: 470, y: 14, w: 140, h: 80 };
  const ex = (kk: number) => E.x + ((kk - 1) / 7) * E.w, ey = (v: number) => E.y + E.h - (v / elbow[0]) * E.h;

  return (
    <Figure
      title={L("title", "k-means, one step at a time")}
      head={<>
        <Choice value={mode} onChange={m => restart(k, m)} options={[["random", L("random", "random start")], ["pp", "k-means++"]] as const} />
      </>}
      controls={<>
        <Slider label="k" value={k} min={1} max={6} step={1} onChange={v => restart(v)} fmt={v => `${v}`} />
        <Row>
          <Btn onClick={step}>{st.phase === "assign" ? L("assign", "step: assign") : L("move", "step: move centroids")}</Btn>
          <Btn onClick={run}>{L("run", "run to the end")}</Btn>
          <Btn onClick={() => restart(k, mode, seed + 1)}>{L("newStart", "new start")}</Btn>
          <Readout>{L("iter", "updates")} {st.iter}</Readout>
          <Readout color={st.done ? C.green : C.fg}>J = {J === null ? "—" : f2(J, 1)}{st.done ? ` · ${L("converged", "converged")}` : ""}</Readout>
        </Row>
      </>}
      note={L("note", "The points have no labels; the four blobs are only visible to us. Each \"assign\" step colours every point like its nearest centroid (the crosses) and shades each centroid's territory; each \"move\" step puts every centroid at the average of its points. J, the sum of squared distances from each point to its centroid, falls at every step until nothing changes. The first random start with k = 4 ends with two centroids sharing one blob and another centroid covering two blobs: converged, but with J ≈ 103 instead of ≈ 42. Here most random starts end in a poor local minimum like that. k-means++ spreads the starting centroids and finds the four blobs almost every time. The elbow chart (top right) shows the best J for k = 1…8: it drops steeply up to k = 4, then only slowly.")}
    >
      <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto" role="img">
        {cells.map((c, i) => <rect key={i} x={c.x} y={c.y} width={CELL} height={CELL} fill={COLORS[c.c]} fillOpacity={0.1} />)}
        {POINTS.map((p, i) => <circle key={i} cx={P.X(p[0])} cy={P.Y(p[1])} r={3.6}
          fill={st.as ? COLORS[st.as[i]] : C.muted} fillOpacity={st.as ? 0.9 : 0.6} />)}
        {st.trails.map((tr, i) => <polyline key={i} points={tr.map(c => `${P.X(c[0])},${P.Y(c[1])}`).join(" ")} fill="none" stroke={COLORS[i]} strokeWidth={1.4} strokeDasharray="3 2" />)}
        {st.cs.map((c, i) => <g key={i} transform={`translate(${P.X(c[0])},${P.Y(c[1])})`}>
          <path d="M-7,-7L7,7M-7,7L7,-7" stroke="var(--code-bg)" strokeWidth={5} />
          <path d="M-7,-7L7,7M-7,7L7,-7" stroke={COLORS[i]} strokeWidth={2.6} />
        </g>)}

        <rect x={E.x - 8} y={E.y - 6} width={E.w + 16} height={E.h + 26} rx={6} fill="var(--code-bg)" fillOpacity={0.85} stroke={C.grid} />
        <polyline points={elbow.map((v, i) => `${ex(i + 1)},${ey(v)}`).join(" ")} fill="none" stroke={C.purple} strokeWidth={1.6} />
        {elbow.map((v, i) => <circle key={i} cx={ex(i + 1)} cy={ey(v)} r={i + 1 === k ? 4 : 2.2} fill={i + 1 === k ? C.amber : C.purple} />)}
        {elbow.map((_, i) => <T key={i} x={ex(i + 1)} y={E.y + E.h + 12} size={7.5} anchor="middle">{i + 1}</T>)}
        <T x={E.x} y={E.y + 4} size={7.5}>{L("elbow", "best J for each k")}</T>
      </svg>
    </Figure>
  );
}
