"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, C, T, Vec, Handle, plot, useDrag, clamp, f2, type Plot } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A function of two variables drawn as a contour map: each coloured line joins
// the points where f has one particular value (blue low, orange high). At the
// draggable point P the gradient ∇f = (∂f/∂x, ∂f/∂y) is drawn in red: it points
// straight uphill and crosses the contour at a right angle. A chosen direction
// u (purple) gives the directional derivative ∇f · u, the slope felt walking
// that way; it is largest along ∇f and zero along the contour (green).

type Key = "bowl" | "saddle" | "hills" | "waves";
const FNS: Record<Key, { label: string; f: (x: number, y: number) => number }> = {
  bowl: { label: "x² + y²", f: (x, y) => x * x + y * y },
  saddle: { label: "x² − y²", f: (x, y) => x * x - y * y },
  hills: { label: "two hills", f: (x, y) => 3 * Math.exp(-((x - 1.2) ** 2 + (y - 0.3) ** 2)) + 2 * Math.exp(-((x + 1.4) ** 2 + (y + 0.5) ** 2) / 0.7) },
  waves: { label: "sin x · cos y", f: (x, y) => Math.sin(x) * Math.cos(y) },
};

const W = 560, H = 300, NX = 70, NY = 38, LEVELS = 14;
const s2 = (v: number) => f2(v, 2).replace("-", "−");

/** Contour segments by marching squares, each tagged with its level (0..1). */
function contours(pr: Plot, f: (x: number, y: number) => number) {
  const xs = Array.from({ length: NX + 1 }, (_, i) => pr.x0 + ((pr.x1 - pr.x0) * i) / NX);
  const ys = Array.from({ length: NY + 1 }, (_, j) => pr.y0 + ((pr.y1 - pr.y0) * j) / NY);
  const v = ys.map(y => xs.map(x => f(x, y)));
  let lo = Infinity, hi = -Infinity;
  for (const row of v) for (const z of row) { lo = Math.min(lo, z); hi = Math.max(hi, z); }
  const segs: { d: string; s: number }[] = [];
  for (let k = 1; k < LEVELS; k++) {
    const c = lo + ((hi - lo) * k) / LEVELS;
    let d = "";
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      // corners counter-clockwise from bottom-left, and the edges between them
      const q: [number, number, number][] = [[xs[i], ys[j], v[j][i]], [xs[i + 1], ys[j], v[j][i + 1]], [xs[i + 1], ys[j + 1], v[j + 1][i + 1]], [xs[i], ys[j + 1], v[j + 1][i]]];
      const pts: [number, number][] = [];
      for (let e = 0; e < 4; e++) {
        const [ax, ay, az] = q[e], [bx, by, bz] = q[(e + 1) % 4];
        if ((az < c) !== (bz < c)) { const u = (c - az) / (bz - az); pts.push([ax + (bx - ax) * u, ay + (by - ay) * u]); }
      }
      for (let p = 0; p + 1 < pts.length; p += 2)
        d += `M${pr.X(pts[p][0]).toFixed(1)},${pr.Y(pts[p][1]).toFixed(1)}L${pr.X(pts[p + 1][0]).toFixed(1)},${pr.Y(pts[p + 1][1]).toFixed(1)}`;
    }
    segs.push({ d, s: k / LEVELS });
  }
  return segs;
}

export function GradientFigure({ t }: { t?: TrackTranslations }) {
  const [key, setKey] = useState<Key>("hills");
  const [p, setP] = useState({ x: 0.2, y: -0.4 });
  const [ang, setAng] = useState(30);

  const pr = useMemo(() => plot({ W, H, x0: -3.5, x1: 3.5, y0: -1.875, y1: 1.875 }), []);
  const f = FNS[key].f;
  const segs = useMemo(() => contours(pr, f), [pr, f]);
  const drag = useDrag<"p">(q => { const w = pr.inv(q); setP({ x: clamp(w.x, -3.3, 3.3), y: clamp(w.y, -1.7, 1.7) }); return "p"; },
    (_, q) => { const w = pr.inv(q); setP({ x: clamp(w.x, -3.3, 3.3), y: clamp(w.y, -1.7, 1.7) }); });

  const h = 1e-4;
  const fx = (f(p.x + h, p.y) - f(p.x - h, p.y)) / (2 * h);
  const fy = (f(p.x, p.y + h) - f(p.x, p.y - h)) / (2 * h);
  const g = Math.hypot(fx, fy);
  const th = (ang * Math.PI) / 180, ux = Math.cos(th), uy = Math.sin(th);
  const du = fx * ux + fy * uy;
  const P = { x: pr.X(p.x), y: pr.Y(p.y) };
  const gs = g > 1e-6 ? Math.min(1.4, 0.35 + 0.35 * g) / g : 0;          // arrow length in world units, capped
  const tip = (dx: number, dy: number) => ({ x: pr.X(p.x + dx), y: pr.Y(p.y + dy) });

  return (
    <Figure
      title={tx(t, "figGrad_title", "Contours and the gradient")}
      head={<>{(Object.keys(FNS) as Key[]).map(k => <Btn key={k} active={key === k} onClick={() => setKey(k)}>{k === "hills" ? tx(t, "figGrad_hills", "two hills") : FNS[k].label}</Btn>)}</>}
      controls={<>
        <Slider label={tx(t, "figGrad_dir", "direction u")} value={ang} min={-180} max={180} step={1} onChange={setAng} fmt={v => `${v}°`} />
        <Row>
          <Readout>{`P = (${s2(p.x)}, ${s2(p.y)})  f = ${s2(f(p.x, p.y))}`}</Readout>
          <Readout color={C.red}>{`∇f = (${s2(fx)}, ${s2(fy)})  |∇f| = ${s2(g)}`}</Readout>
          <Readout color={C.purple}>{`∇f · u = ${s2(du)}`}</Readout>
        </Row>
      </>}
      note={<>
        {tx(t, "figGrad_note", "Each line is a level curve: f has the same value all along it, like a contour line on a hiking map. The red gradient arrow points uphill by the steepest route and always crosses the contour at a right angle; its length is the steepest slope. Turn the purple direction u: the slope ∇f · u is largest along the gradient, zero along the green contour direction, and most negative straight downhill. Where contours crowd together the gradient is long; at a top, a bottom or a saddle it shrinks to zero.")}{" "}
        <span data-mouse-only>{tx(t, "figGrad_drag", "Click or drag to move P.")}</span>
        <span data-touch-only>{tx(t, "figGrad_dragTouch", "Tap or drag to move P.")}</span>
      </>}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair">
        <line x1={0} x2={W} y1={pr.Y(0)} y2={pr.Y(0)} stroke={C.axis} strokeWidth={1} />
        <line y1={0} y2={H} x1={pr.X(0)} x2={pr.X(0)} stroke={C.axis} strokeWidth={1} />
        {segs.map((sg, i) => <path key={i} d={sg.d} fill="none" stroke={`hsl(${205 - 180 * sg.s} 80% 52%)`} strokeWidth={1.3} opacity={0.85} />)}
        {g > 1e-6 && <line x1={pr.X(p.x - (0.9 * -fy) / g)} y1={pr.Y(p.y - (0.9 * fx) / g)} x2={pr.X(p.x + (0.9 * -fy) / g)} y2={pr.Y(p.y + (0.9 * fx) / g)} stroke={C.green} strokeWidth={2} strokeDasharray="5 4" />}
        <Vec a={P} b={tip(ux * 0.9, uy * 0.9)} color={C.purple} w={2} />
        {g > 1e-6 && <Vec a={P} b={tip(fx * gs, fy * gs)} color={C.red} w={2.6} />}
        <Handle x={P.x} y={P.y} color={C.fg} active={drag.dragging === "p"} />
        <T x={P.x + 8} y={P.y + 16} color={C.fg} bold>P</T>
        {g > 1e-6 && <T x={pr.X(p.x + fx * gs) + 4} y={pr.Y(p.y + fy * gs) - 4} color={C.red} bold>∇f</T>}
      </svg>
    </Figure>
  );
}
