"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, Vec, Handle, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The three overlap tests every 2D game starts with, drawn with the quantity
// each one compares:
//   circle–circle  distance between centres vs sum of radii
//   AABB–AABB      the boxes' shadows (intervals) on the x axis and on the y axis
//   circle–AABB    distance from the centre to the closest point of the box
// When the shapes overlap, the minimum translation vector (MTV) is drawn: the
// shortest push that separates them. "Resolve" applies it to shape B.

type Mode = "cc" | "bb" | "cb";
const W = 560, H = 290;
type Circle = { c: Pt; r: number };
type Box = { c: Pt; h: Pt };        // centre and half extents

function mtvFor(mode: Mode, ca: Circle, cb: Circle, ba: Box, bb: Box) {
  if (mode === "cc") {
    const dx = cb.c.x - ca.c.x, dy = cb.c.y - ca.c.y, d = Math.hypot(dx, dy);
    const pen = ca.r + cb.r - d;
    const n = d > 1e-6 ? { x: dx / d, y: dy / d } : { x: 1, y: 0 };
    return { hit: pen > 0, pen, n, d };
  }
  if (mode === "bb") {
    const ox = Math.min(ba.c.x + ba.h.x, bb.c.x + bb.h.x) - Math.max(ba.c.x - ba.h.x, bb.c.x - bb.h.x);
    const oy = Math.min(ba.c.y + ba.h.y, bb.c.y + bb.h.y) - Math.max(ba.c.y - ba.h.y, bb.c.y - bb.h.y);
    const hit = ox > 0 && oy > 0;
    // Push along the axis that needs the smaller move, away from A's centre
    const n = ox < oy ? { x: Math.sign(bb.c.x - ba.c.x) || 1, y: 0 } : { x: 0, y: Math.sign(bb.c.y - ba.c.y) || 1 };
    return { hit, pen: Math.min(ox, oy), n, ox, oy, d: 0 };
  }
  // circle B against box A
  const q = { x: clamp(cb.c.x, ba.c.x - ba.h.x, ba.c.x + ba.h.x), y: clamp(cb.c.y, ba.c.y - ba.h.y, ba.c.y + ba.h.y) };
  const dx = cb.c.x - q.x, dy = cb.c.y - q.y, d = Math.hypot(dx, dy);
  if (d > 1e-6) return { hit: d < cb.r, pen: cb.r - d, n: { x: dx / d, y: dy / d }, q, d };
  // Centre inside the box: leave through the nearest face
  const fx = ba.h.x - Math.abs(cb.c.x - ba.c.x), fy = ba.h.y - Math.abs(cb.c.y - ba.c.y);
  const n = fx < fy ? { x: Math.sign(cb.c.x - ba.c.x) || 1, y: 0 } : { x: 0, y: Math.sign(cb.c.y - ba.c.y) || 1 };
  return { hit: true, pen: Math.min(fx, fy) + cb.r, n, q, d: 0, inside: true };
}

export function OverlapFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("cc");
  const [ca, setCa] = useState<Circle>({ c: { x: 210, y: 150 }, r: 62 });
  const [cb, setCb] = useState<Circle>({ c: { x: 320, y: 130 }, r: 48 });
  const [ba, setBa] = useState<Box>({ c: { x: 220, y: 150 }, h: { x: 90, y: 55 } });
  const [bb, setBb] = useState<Box>({ c: { x: 330, y: 115 }, h: { x: 60, y: 45 } });

  const aIsCircle = mode === "cc", bIsCircle = mode !== "bb";
  type K = "a" | "b" | "ra" | "rb";
  const handleA = aIsCircle ? { x: ca.c.x + ca.r, y: ca.c.y } : { x: ba.c.x + ba.h.x, y: ba.c.y + ba.h.y };
  const handleB = bIsCircle ? { x: cb.c.x + cb.r, y: cb.c.y } : { x: bb.c.x + bb.h.x, y: bb.c.y + bb.h.y };
  const inside = (p: Pt, isC: boolean, c: Circle, b: Box) => isC ? Math.hypot(p.x - c.c.x, p.y - c.c.y) < c.r : Math.abs(p.x - b.c.x) < b.h.x && Math.abs(p.y - b.c.y) < b.h.y;
  const drag = useDrag<K>(p => nearest<K>(p, [["ra", handleA], ["rb", handleB]], 12)
    ?? (inside(p, bIsCircle, cb, bb) ? "b" : inside(p, aIsCircle, ca, ba) ? "a" : null),
    (id, p, s) => {
      const dx = p.x - s.p0.x, dy = p.y - s.p0.y;
      s.p0.x = p.x; s.p0.y = p.y;
      const mv = (q: Pt) => ({ x: clamp(q.x + dx, 10, W - 10), y: clamp(q.y + dy, 10, H - 10) });
      const size = (o: Pt, q: Pt) => ({ x: clamp(q.x - o.x, 10, 160), y: clamp(q.y - o.y, 10, 120) });
      const rad = (o: Pt) => clamp(Math.hypot(p.x - o.x, p.y - o.y), 12, 120);
      if (id === "a") { if (aIsCircle) setCa(o => ({ ...o, c: mv(o.c) })); else setBa(o => ({ ...o, c: mv(o.c) })); }
      if (id === "b") { if (bIsCircle) setCb(o => ({ ...o, c: mv(o.c) })); else setBb(o => ({ ...o, c: mv(o.c) })); }
      if (id === "ra") { if (aIsCircle) setCa(o => ({ ...o, r: rad(o.c) })); else setBa(o => ({ ...o, h: size(o.c, p) })); }
      if (id === "rb") { if (bIsCircle) setCb(o => ({ ...o, r: rad(o.c) })); else setBb(o => ({ ...o, h: size(o.c, p) })); }
    });

  const m = mtvFor(mode, ca, cb, ba, bb);
  const resolve = () => {
    if (!m.hit) return;
    const push = (q: Pt) => ({ x: q.x + m.n.x * m.pen, y: q.y + m.n.y * m.pen });
    if (bIsCircle) setCb(o => ({ ...o, c: push(o.c) })); else setBb(o => ({ ...o, c: push(o.c) }));
  };
  const colA = m.hit ? C.red : C.sky, colB = m.hit ? C.red : C.green;
  const bCentre = bIsCircle ? cb.c : bb.c;
  const aCentre = aIsCircle ? ca.c : ba.c;

  return (
    <Figure
      title={tx(t, "figOverlap_title", "Overlap tests and the minimum translation vector")}
      head={<Choice value={mode} onChange={setMode} options={[["cc", tx(t, "figOverlap_cc", "circle–circle")], ["bb", "AABB–AABB"], ["cb", tx(t, "figOverlap_cb", "AABB–circle")]] as const} />}
      controls={<Row>
        <Btn onClick={resolve}>{tx(t, "figOverlap_resolve", "resolve (move B by the MTV)")}</Btn>
        <span className="ml-auto flex gap-1.5 flex-wrap">
          <Readout color={m.hit ? C.red : C.green}>{m.hit ? tx(t, "figOverlap_hit", "overlapping") : tx(t, "figOverlap_free", "separate")}</Readout>
          {mode === "cc" && <Readout>d = {m.d.toFixed(1)} · r₁ + r₂ = {(ca.r + cb.r).toFixed(1)}</Readout>}
          {mode === "bb" && <Readout>{tx(t, "figOverlap_ov", "overlap")} x = {(m as { ox: number }).ox.toFixed(1)} · y = {(m as { oy: number }).oy.toFixed(1)}</Readout>}
          {mode === "cb" && <Readout>|c − q| = {m.d.toFixed(1)} · r = {cb.r.toFixed(1)}</Readout>}
          {m.hit && <Readout color={C.amber}>MTV = ({(m.n.x * m.pen).toFixed(1)}, {(m.n.y * m.pen).toFixed(1)})</Readout>}
        </span>
      </Row>}
      note={mode === "cc"
        ? tx(t, "figOverlap_noteCC", "Two circles overlap when the distance between their centres is less than the sum of their radii. The MTV points along the line between the centres and its length is the penetration depth, r₁ + r₂ − d. In code, compare squared distances to skip the square root until you actually need the normal.")
        : mode === "bb"
          ? tx(t, "figOverlap_noteBB", "Axis-aligned boxes overlap only if their shadows overlap on the x axis AND on the y axis (the coloured intervals on the edges). One gap on either axis is enough to prove they are apart. When both overlap, the box is pushed out along the axis with the smaller overlap, which is the shortest way out.")
          : tx(t, "figOverlap_noteCB", "Clamp the circle's centre to the box: the result q is the point of the box closest to the circle. The shapes touch when the distance from the centre to q is less than the radius, and the push direction is from q to the centre. Drag the circle's centre inside the box: q equals the centre, the direction is undefined, and the code has to fall back to leaving through the nearest face.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab">
        {/* shapes */}
        {aIsCircle
          ? <circle cx={ca.c.x} cy={ca.c.y} r={ca.r} fill={colA} fillOpacity={0.18} stroke={colA} strokeWidth={2} />
          : <rect x={ba.c.x - ba.h.x} y={ba.c.y - ba.h.y} width={ba.h.x * 2} height={ba.h.y * 2} fill={colA} fillOpacity={0.18} stroke={colA} strokeWidth={2} />}
        {bIsCircle
          ? <circle cx={cb.c.x} cy={cb.c.y} r={cb.r} fill={colB} fillOpacity={0.18} stroke={colB} strokeWidth={2} />
          : <rect x={bb.c.x - bb.h.x} y={bb.c.y - bb.h.y} width={bb.h.x * 2} height={bb.h.y * 2} fill={colB} fillOpacity={0.18} stroke={colB} strokeWidth={2} />}
        <T x={aCentre.x - 4} y={aCentre.y + 4} size={11} bold color={C.fg}>A</T>
        <T x={bCentre.x - 4} y={bCentre.y + 4} size={11} bold color={C.fg}>B</T>
        <Handle x={handleA.x} y={handleA.y} color={colA} r={4} />
        <Handle x={handleB.x} y={handleB.y} color={colB} r={4} />

        {mode === "cc" && <line x1={ca.c.x} y1={ca.c.y} x2={cb.c.x} y2={cb.c.y} stroke={C.fg} strokeDasharray="4 3" opacity={0.7} />}
        {mode === "bb" && (() => {
          const ax0 = ba.c.x - ba.h.x, ax1 = ba.c.x + ba.h.x, bx0 = bb.c.x - bb.h.x, bx1 = bb.c.x + bb.h.x;
          const ay0 = ba.c.y - ba.h.y, ay1 = ba.c.y + ba.h.y, by0 = bb.c.y - bb.h.y, by1 = bb.c.y + bb.h.y;
          return (
            <g>
              <line x1={0} x2={W} y1={H - 12} y2={H - 12} stroke={C.axis} />
              <line x1={W - 12} x2={W - 12} y1={0} y2={H} stroke={C.axis} />
              <line x1={ax0} x2={ax1} y1={H - 16} y2={H - 16} stroke={colA} strokeWidth={5} strokeLinecap="round" />
              <line x1={bx0} x2={bx1} y1={H - 8} y2={H - 8} stroke={colB} strokeWidth={5} strokeLinecap="round" />
              <line x1={W - 16} x2={W - 16} y1={ay0} y2={ay1} stroke={colA} strokeWidth={5} strokeLinecap="round" />
              <line x1={W - 8} x2={W - 8} y1={by0} y2={by1} stroke={colB} strokeWidth={5} strokeLinecap="round" />
              {[ax0, ax1].map((x, i) => <line key={`a${i}`} x1={x} x2={x} y1={ba.c.y + ba.h.y} y2={H - 16} stroke={colA} strokeDasharray="2 4" opacity={0.5} />)}
              {[bx0, bx1].map((x, i) => <line key={`b${i}`} x1={x} x2={x} y1={bb.c.y + bb.h.y} y2={H - 8} stroke={colB} strokeDasharray="2 4" opacity={0.5} />)}
              <T x={6} y={H - 18} size={8}>{tx(t, "figOverlap_xs", "shadows on x")}</T>
              <T x={W - 20} y={12} size={8} anchor="end">{tx(t, "figOverlap_ys", "shadows on y →")}</T>
            </g>
          );
        })()}
        {mode === "cb" && "q" in m && m.q && (
          <g>
            <line x1={cb.c.x} y1={cb.c.y} x2={m.q.x} y2={m.q.y} stroke={C.fg} strokeDasharray="4 3" />
            <circle cx={m.q.x} cy={m.q.y} r={4.5} fill={C.amber} />
            <T x={m.q.x + 7} y={m.q.y - 6} size={9.5} bold color={C.amber}>q</T>
          </g>
        )}
        {m.hit && m.pen > 0.5 && (
          <Vec a={bCentre} b={{ x: bCentre.x + m.n.x * m.pen, y: bCentre.y + m.n.y * m.pen }} color={C.amber} w={3} head={9} />
        )}
        <T x={8} y={16} size={8.5}>{tx(t, "figOverlap_hint", "drag a shape to move it · drag its small dot to resize")}</T>
      </svg>
    </Figure>
  );
}
