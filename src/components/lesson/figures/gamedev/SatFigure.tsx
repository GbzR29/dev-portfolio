"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, Vec, useDrag, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The Separating Axis Theorem for two convex polygons. The candidate axes are
// the edge normals of both shapes. For each axis, both polygons are projected
// onto it (every vertex dotted with the axis): each projection is an interval.
// If any axis shows a gap between the intervals, the shapes are apart. If no
// axis does, they overlap, and the axis with the smallest overlap gives the
// minimum translation vector. Pick an axis to see its projection.

const W = 560, H = 320;
type Poly = { c: Pt; rot: number; sides: number; r: number };

function verts(p: Poly): Pt[] {
  return Array.from({ length: p.sides }, (_, i) => {
    const a = p.rot + (i / p.sides) * Math.PI * 2;
    return { x: p.c.x + Math.cos(a) * p.r, y: p.c.y + Math.sin(a) * p.r };
  });
}
function normals(vs: Pt[]): Pt[] {
  return vs.map((v, i) => {
    const w = vs[(i + 1) % vs.length], ex = w.x - v.x, ey = w.y - v.y, l = Math.hypot(ex, ey) || 1;
    return { x: ey / l, y: -ex / l };          // perpendicular to the edge
  });
}
const project = (vs: Pt[], n: Pt) => {
  let lo = Infinity, hi = -Infinity, iLo = 0, iHi = 0;
  vs.forEach((v, i) => { const s = v.x * n.x + v.y * n.y; if (s < lo) { lo = s; iLo = i; } if (s > hi) { hi = s; iHi = i; } });
  return { lo, hi, iLo, iHi };
};

export function SatFigure({ t }: { t?: TrackTranslations }) {
  const [A, setA] = useState<Poly>({ c: { x: 200, y: 150 }, rot: 0.2, sides: 5, r: 70 });
  const [B, setB] = useState<Poly>({ c: { x: 330, y: 170 }, rot: 0.6, sides: 3, r: 62 });
  const [pick, setPick] = useState<number | null>(null);

  const va = verts(A), vb = verts(B);
  // Candidate axes: every edge normal of A, then of B (parallel duplicates removed)
  const axes: { n: Pt; from: "A" | "B"; edge: number }[] = [];
  const addAxes = (ns: Pt[], from: "A" | "B") => ns.forEach((n, edge) => {
    if (!axes.some(a => Math.abs(a.n.x * n.y - a.n.y * n.x) < 1e-6)) axes.push({ n, from, edge });
  });
  addAxes(normals(va), "A");
  addAxes(normals(vb), "B");
  const results = axes.map(a => {
    const pa = project(va, a.n), pb = project(vb, a.n);
    const overlap = Math.min(pa.hi, pb.hi) - Math.max(pa.lo, pb.lo);
    return { ...a, pa, pb, overlap };
  });
  const sep = results.findIndex(r => r.overlap <= 0);
  const minI = results.reduce((best, r, i) => (r.overlap < results[best].overlap ? i : best), 0);
  const hit = sep < 0;
  const shown = pick !== null && pick < results.length ? pick : hit ? minI : sep;
  const R = results[shown];

  const inPoly = (p: Pt, vs: Pt[]) => normals(vs).every((n, i) => (p.x - vs[i].x) * n.x + (p.y - vs[i].y) * n.y <= 0);
  const drag = useDrag<"A" | "B">(p => (inPoly(p, vb) ? "B" : inPoly(p, va) ? "A" : null),
    (id, p, s) => {
      const dx = p.x - s.p0.x, dy = p.y - s.p0.y;
      s.p0.x = p.x; s.p0.y = p.y;
      (id === "A" ? setA : setB)(o => ({ ...o, c: { x: clamp(o.c.x + dx, 20, W - 20), y: clamp(o.c.y + dy, 20, H - 20) } }));
    });

  // Draw the axis as a line through a fixed origin near the top-left; projections are measured from there
  const O = { x: 0, y: 0 };
  const axisPt = (s: number, off = 0) => ({ x: O.x + R.n.x * s - R.n.y * off, y: O.y + R.n.y * s + R.n.x * off });
  // Shift the drawn axis sideways so it sits beside the shapes, on whichever side stays in view
  const pcs = [...va, ...vb].map(v => -v.x * R.n.y + v.y * R.n.x);      // each vertex's coordinate across the axis
  const centre = -(W / 2) * R.n.y + (H / 2) * R.n.x;
  const cands = [Math.max(...pcs) + 30, Math.min(...pcs) - 30];
  const off = Math.abs(cands[0] - centre) < Math.abs(cands[1] - centre) ? cands[0] : cands[1];
  const along = (s: number) => axisPt(s, off);
  const mtv = hit ? { x: R.n.x * R.overlap * Math.sign((B.c.x - A.c.x) * R.n.x + (B.c.y - A.c.y) * R.n.y || 1), y: R.n.y * R.overlap * Math.sign((B.c.x - A.c.x) * R.n.x + (B.c.y - A.c.y) * R.n.y || 1) } : null;
  const colA = hit ? C.red : C.sky, colB = hit ? C.red : C.green;
  const P = (vs: Pt[]) => vs.map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(" ");

  return (
    <Figure
      title={tx(t, "figSat_title", "Separating Axis Theorem")}
      head={<>
        <span className="text-[10px] text-[var(--text-muted)] self-center">B:</span>
        <Choice value={String(B.sides)} onChange={v => setB(o => ({ ...o, sides: Number(v) }))} options={[["3", "▲"], ["4", "■"], ["6", "⬢"]] as const} />
      </>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figSat_rotA", "rotate A")} value={A.rot} min={0} max={Math.PI * 2} onChange={v => setA(o => ({ ...o, rot: v }))} fmt={v => `${Math.round(v * 180 / Math.PI)}°`} />
          <Slider label={tx(t, "figSat_rotB", "rotate B")} value={B.rot} min={0} max={Math.PI * 2} onChange={v => setB(o => ({ ...o, rot: v }))} fmt={v => `${Math.round(v * 180 / Math.PI)}°`} />
        </Sliders>
        <Row>
          <span className="text-[10px] text-[var(--text-muted)]">{tx(t, "figSat_axes", "axes")}:</span>
          {results.map((r, i) => (
            <Btn key={i} active={i === shown} onClick={() => setPick(i === pick ? null : i)}>
              <span style={{ color: r.overlap <= 0 ? C.green : undefined }}>{r.from}{r.edge + 1}: {r.overlap <= 0 ? "gap" : r.overlap.toFixed(0)}</span>
            </Btn>
          ))}
        </Row>
        <Row>
          <Readout color={hit ? C.red : C.green}>{hit ? tx(t, "figSat_hit", "no separating axis → overlapping") : tx(t, "figSat_sep", "separating axis found → apart")}</Readout>
          {hit && mtv && <Readout color={C.amber}>MTV = {tx(t, "figSat_axis", "axis")} {results[minI].from}{results[minI].edge + 1} × {results[minI].overlap.toFixed(1)}</Readout>}
          <Readout>{tx(t, "figSat_tests", "axes to test")}: {results.length}</Readout>
        </Row>
      </>}
      note={tx(t, "figSat_note", "Drag the shapes, rotate them, and click an axis to see it. The shapes are \"shadowed\" onto the axis: each shadow is the interval from the smallest to the largest vertex·axis value. Two convex shapes are apart exactly when some line fits between them, and such a line is always parallel to one of their edges, so only the edge normals need testing: the pentagon and the triangle give 8 axes. The first gap ends the test early. If every axis overlaps, the smallest overlap is the shortest way out, and the axis it came from is the collision normal.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab">
        <polygon points={P(va)} fill={colA} fillOpacity={0.16} stroke={colA} strokeWidth={2} />
        <polygon points={P(vb)} fill={colB} fillOpacity={0.16} stroke={colB} strokeWidth={2} />
        <T x={A.c.x - 4} y={A.c.y + 4} size={11} bold color={C.fg}>A</T>
        <T x={B.c.x - 4} y={B.c.y + 4} size={11} bold color={C.fg}>B</T>
        {/* the edge this axis came from */}
        {(() => {
          const vs = R.from === "A" ? va : vb, a = vs[R.edge], b = vs[(R.edge + 1) % vs.length];
          return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.amber} strokeWidth={4} strokeLinecap="round" />;
        })()}
        {/* axis line */}
        {(() => {
          const a0 = along(-2000), a1 = along(2000);
          return <line x1={a0.x} y1={a0.y} x2={a1.x} y2={a1.y} stroke={C.amber} strokeWidth={1} strokeDasharray="6 4" />;
        })()}
        {/* projections */}
        {([[R.pa, va, colA, -5], [R.pb, vb, colB, 5]] as const).map(([pr, vs, col, off], k) => {
          const lo = along(pr.lo), hi = along(pr.hi);
          const sh = { x: -R.n.y * off, y: R.n.x * off };
          return (
            <g key={k}>
              {[pr.iLo, pr.iHi].map((vi, j) => {
                const v = vs[vi], q = along(j ? pr.hi : pr.lo);
                return <line key={j} x1={v.x} y1={v.y} x2={q.x} y2={q.y} stroke={col} strokeDasharray="2 3" opacity={0.6} />;
              })}
              <line x1={lo.x + sh.x} y1={lo.y + sh.y} x2={hi.x + sh.x} y2={hi.y + sh.y} stroke={col} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
            </g>
          );
        })}
        {R.overlap > 0
          ? (() => { const a = along(Math.max(R.pa.lo, R.pb.lo)), b = along(Math.min(R.pa.hi, R.pb.hi)); return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.fg} strokeWidth={2} />; })()
          : (() => { const a = along(Math.min(R.pa.hi, R.pb.hi)), b = along(Math.max(R.pa.lo, R.pb.lo)); const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; return <g><circle cx={m.x} cy={m.y} r={9} fill="none" stroke={C.green} strokeWidth={2} /><T x={m.x + 12} y={m.y + 4} size={9} bold color={C.green}>gap</T></g>; })()}
        {hit && mtv && shown === minI && <Vec a={B.c} b={{ x: B.c.x + mtv.x, y: B.c.y + mtv.y }} color={C.amber} w={3} head={9} />}
      </svg>
    </Figure>
  );
}
