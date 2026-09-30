"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, C, T, f2, useDrag, nearest, Handle, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Rasterization on a 16 × 10 pixel framebuffer. A pixel becomes a fragment
// when its centre lies inside the triangle, which is tested with three edge
// functions (signed areas). The same three numbers, divided by the whole
// triangle's area, are the barycentric weights that mix the vertex colours:
// that is how an "out" variable of the vertex shader reaches the fragment
// shader smoothly interpolated. Pixel rows are numbered from the bottom, as in
// OpenGL's window coordinates.

const GW = 16, GH = 10, CELL = 30, W = GW * CELL, H = GH * CELL;
const COLS: [number, number, number][] = [[239, 68, 68], [34, 197, 94], [59, 130, 246]];
const HEX = [C.red, C.green, C.blue];

/** Twice the signed area of triangle (a, b, p): positive when p is left of a→b (y up). */
const edge = (a: Pt, b: Pt, p: Pt) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);

const PIXELS = Array.from({ length: GW * GH }, (_, k) => ({ i: k % GW, j: Math.floor(k / GW) }));

/** Edge values, barycentric weights and the inside test for pixel (i, j)'s centre. */
function sample(v: Pt[], i: number, j: number) {
  const area = edge(v[0], v[1], v[2]);
  const p = { x: i + 0.5, y: j + 0.5 };
  const e = [edge(v[1], v[2], p), edge(v[2], v[0], p), edge(v[0], v[1], p)];   // weight of v0, v1, v2
  const inside = area !== 0 && e.every(x => (area > 0 ? x >= 0 : x <= 0));
  return { p, e, w: e.map(x => x / area), inside };
}

function colour(w: number[], smooth: boolean) {
  const c = smooth ? [0, 1, 2].map(k => w[0] * COLS[0][k] + w[1] * COLS[1][k] + w[2] * COLS[2][k]) : COLS[0];
  return `rgb(${c.map(x => Math.round(clamp(x, 0, 255))).join(",")})`;
}

export function RasterFigure({ t }: { t?: TrackTranslations }) {
  // Vertices in pixel units, y up (0 at the bottom edge).
  const [v, setV] = useState<Pt[]>([{ x: 2.3, y: 1.4 }, { x: 13.6, y: 2.2 }, { x: 6.8, y: 8.7 }]);
  const [sel, setSel] = useState<{ i: number; j: number } | null>({ i: 7, j: 4 });
  const [smooth, setSmooth] = useState(true);

  const toSvg = (p: Pt) => ({ x: p.x * CELL, y: H - p.y * CELL });
  const fromSvg = (p: Pt) => ({ x: clamp(p.x / CELL, 0, GW), y: clamp((H - p.y) / CELL, 0, GH) });

  const drag = useDrag<number>(
    p => {
      const k = nearest(p, v.map((q, i) => [i, toSvg(q)] as [number, Pt]), 18);
      if (k === null) {
        const q = fromSvg(p);
        setSel({ i: Math.min(GW - 1, Math.floor(q.x)), j: Math.min(GH - 1, Math.floor(q.y)) });
      }
      return k;
    },
    (k, p) => setV(vs => vs.map((q, i) => (i === k ? fromSvg(p) : q))),
  );

  const area = edge(v[0], v[1], v[2]);
  const colourOf = (w: number[]) => colour(w, smooth);
  const all = PIXELS.map(({ i, j }) => ({ i, j, ...sample(v, i, j) }));
  const covered = all.filter(s => s.inside).length;
  const cells = all.map(s => (
    <rect key={`${s.i}-${s.j}`} x={s.i * CELL} y={H - (s.j + 1) * CELL} width={CELL} height={CELL}
      fill={s.inside ? colourOf(s.w) : "transparent"} stroke={C.grid} strokeWidth={0.8} />
  ));
  const cur = sel && sample(v, sel.i, sel.j);
  const sv = v.map(toSvg);

  return (
    <Figure
      title={tx(t, "figGlRaster_title", "Rasterization: which pixels a triangle covers")}
      head={<Btn active={smooth} onClick={() => setSmooth(s => !s)}>{tx(t, "figGlRaster_interp", "interpolate colours")}</Btn>}
      controls={<>
        <Row>
          <Readout>{tx(t, "figGlRaster_fragments", "fragments")}: {covered}</Readout>
          <Readout>{tx(t, "figGlRaster_area", "triangle area")}: {f2(Math.abs(area) / 2, 1)} px²</Readout>
          {cur && <Readout color={cur.inside ? C.green : C.muted}>{tx(t, "figGlRaster_pixel", "pixel")} ({sel!.i}, {sel!.j}) → {cur.inside ? tx(t, "figGlRaster_in", "inside") : tx(t, "figGlRaster_out", "outside")}</Readout>}
        </Row>
        {cur && (
          <div className="font-mono text-[11.5px] leading-relaxed text-[var(--text-main)]">
            <div>{tx(t, "figGlRaster_centre", "centre")} = ({f2(cur.p.x, 1)}, {f2(cur.p.y, 1)}) · {tx(t, "figGlRaster_edges", "edge values")} = {cur.e.map(x => f2(x, 1)).join(", ")} · 2·area = {f2(area, 1)}</div>
            <div>
              w = (<span style={{ color: C.red }}>{f2(cur.w[0])}</span>, <span style={{ color: C.green }}>{f2(cur.w[1])}</span>, <span style={{ color: C.blue }}>{f2(cur.w[2])}</span>)
              {" "}· w₀ + w₁ + w₂ = {f2(cur.w[0] + cur.w[1] + cur.w[2])}
              {cur.inside && <> · {tx(t, "figGlRaster_colour", "colour")} = <span className="inline-block w-3 h-3 align-middle rounded-sm" style={{ background: colourOf(cur.w) }} /></>}
            </div>
          </div>
        )}
      </>}
      note={tx(t, "figGlRaster_note", "Drag the three vertices; click any pixel to inspect it. The rasterizer tests each pixel's centre (the dot), not its whole square: a pixel only half covered by the triangle becomes a fragment only if its centre is inside. For the test it computes three edge values, one per side, each the signed area of the small triangle formed by that side and the centre. The centre is inside when all three have the same sign as the whole triangle. Divided by the whole area, the same numbers are the barycentric weights: how close the centre is to each vertex. They always add up to 1, and they mix the vertex colours, which is why a triangle with a red, a green and a blue vertex comes out as a smooth gradient.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`-2 -2 ${W + 4} ${H + 4}`} className="w-full h-auto cursor-crosshair" role="img">
        {cells}
        {Array.from({ length: GW * GH }, (_, k) => {
          const i = k % GW, j = Math.floor(k / GW);
          return <circle key={k} cx={(i + 0.5) * CELL} cy={H - (j + 0.5) * CELL} r={1.6} fill={C.muted} opacity={0.6} pointerEvents="none" />;
        })}
        {sel && <rect x={sel.i * CELL} y={H - (sel.j + 1) * CELL} width={CELL} height={CELL} fill="none" stroke={C.amber} strokeWidth={2.5} pointerEvents="none" />}
        <polygon points={sv.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={C.fg} strokeWidth={1.5} pointerEvents="none" />
        {sv.map((p, k) => <Handle key={k} x={p.x} y={p.y} color={HEX[k]} active={drag.dragging === k} />)}
        {sv.map((p, k) => <T key={`l${k}`} x={p.x + 9} y={p.y - 8} size={10} bold color={HEX[k]}>v{k}</T>)}
      </svg>
    </Figure>
  );
}
