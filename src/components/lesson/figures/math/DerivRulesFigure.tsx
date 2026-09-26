"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// product — a rectangle u × v whose sides grow by Δu and Δv. The new area is
//           the old one plus two strips (v·Δu and u·Δv) plus a corner Δu·Δv.
//           Shrink the nudges: the corner vanishes much faster than the
//           strips, leaving (uv)′ = u′v + uv′.
// chain   — three number lines with the same scale: x, u = x², y = sin u.
//           A small piece dx is stretched by g′(x) = 2x on its way to the
//           u-line, then by f′(u) = cos u on its way to the y-line. The
//           stretch factors multiply: that is the chain rule.
// sine    — a point on the unit circle moves a tiny arc dθ. The arc is
//           perpendicular to the radius, so its little triangle is the big
//           one turned a quarter turn: it rises cos θ · dθ. The sine graph
//           on the right (same scale) therefore has slope cos θ.

type Mode = "product" | "chain" | "sine";
const W = 560, H = 280;
const n3 = (v: number) => f2(v, 3).replace("-", "−");

export function DerivRulesFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("product");
  const [u, setU] = useState(2.4);
  const [v, setV] = useState(1.6);
  const [du, setDu] = useState(0.5);
  const [dv, setDv] = useState(0.4);
  const [x, setX] = useState(1);
  const [dx, setDx] = useState(0.15);
  const [th, setTh] = useState(0.8);
  const [dth, setDth] = useState(0.35);

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "product") {
    const s = 70, ox = 40, oy = H - 30;                     // 70 px per unit, origin bottom-left
    const R = (x0: number, y0: number, w: number, h: number, col: string, op: number, key: string) =>
      <rect key={key} x={ox + x0 * s} y={oy - (y0 + h) * s} width={w * s} height={h * s} fill={col} fillOpacity={op} stroke={col} strokeWidth={1.2} />;
    const dA = (u + du) * (v + dv) - u * v;
    svg = <>
      {R(0, 0, u, v, C.sky, 0.18, "uv")}
      {R(u, 0, du, v, C.amber, 0.35, "vdu")}
      {R(0, v, u, dv, C.green, 0.35, "udv")}
      {R(u, v, du, dv, C.red, 0.55, "c")}
      <T x={ox + (u * s) / 2} y={oy - (v * s) / 2} color={C.sky} anchor="middle" size={12} bold>u · v</T>
      <T x={ox + (u + du / 2) * s} y={oy - (v * s) / 2} color={C.amber} anchor="middle" bold>{"v·Δu"}</T>
      <T x={ox + (u * s) / 2} y={oy - (v + dv / 2) * s + 4} color={C.green} anchor="middle" bold>{"u·Δv"}</T>
      <T x={ox + (u + du) * s + 6} y={oy - (v + dv) * s + 10} color={C.red} bold>{"Δu·Δv"}</T>
      <T x={ox + (u * s) / 2} y={oy + 16} color={C.muted} anchor="middle">u</T>
      <T x={ox - 8} y={oy - (v * s) / 2} color={C.muted} anchor="end">v</T>
    </>;
    controls = <>
      <Sliders>
        <Slider label="u" value={u} min={1} max={3.6} step={0.1} onChange={setU} />
        <Slider label="v" value={v} min={0.8} max={2.2} step={0.1} onChange={setV} />
        <Slider label="Δu" value={du} min={0.02} max={1.5} step={0.02} onChange={setDu} />
        <Slider label="Δv" value={dv} min={0.02} max={1} step={0.02} onChange={setDv} />
      </Sliders>
      <Row>
        <Readout>{`ΔA = ${n3(dA)}`}</Readout>
        <Readout color={C.amber}>{`v·Δu = ${n3(v * du)}`}</Readout>
        <Readout color={C.green}>{`u·Δv = ${n3(u * dv)}`}</Readout>
        <Readout color={C.red}>{`Δu·Δv = ${n3(du * dv)}  (${((100 * du * dv) / dA).toFixed(1)}%)`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRule_noteP", "The blue rectangle has area u·v. Grow the sides by Δu and Δv: the extra area is an amber strip v·Δu, a green strip u·Δv and a red corner Δu·Δv. Now shrink both nudges. Halving them halves each strip but quarters the corner, so the corner's share of the growth (the percentage) heads to zero. Dividing by the time the growth took and letting it shrink leaves only the strips: (uv)′ = u′v + uv′.");
  } else if (mode === "chain") {
    const s = 150, L = 50;                                  // same px per unit on all three lines
    const u0 = x * x, u1 = (x + dx) ** 2, y0 = Math.sin(u0), y1 = Math.sin(u1);
    const lines: [string, number, number, number, number, string, number, number][] = [
      // label, row y, range start, value, value after nudge, colour, range lo, range hi
      ["x", 50, 0, x, x + dx, C.sky, 0, 2],
      ["u = x²", 140, 0, u0, u1, C.amber, 0, 3.2],
      ["y = sin u", 230, -1, y0, y1, C.green, -1, 1],
    ];
    const P = (lo: number, val: number) => L + (val - lo) * s;
    svg = <>
      {lines.map(([label, yy, lo, a, b, col, r0, r1], i) => <g key={i}>
        <line x1={P(lo, r0)} x2={P(lo, r1)} y1={yy} y2={yy} stroke={C.axis} strokeWidth={1.2} />
        {Array.from({ length: Math.round((r1 - r0) * 2) + 1 }, (_, k) => r0 + k / 2).map(v =>
          <g key={v}><line x1={P(lo, v)} x2={P(lo, v)} y1={yy - 4} y2={yy + 4} stroke={C.axis} />
            <T x={P(lo, v)} y={yy + 16} size={8.5} anchor="middle" color={C.axis}>{String(v).replace("-", "−")}</T></g>)}
        <line x1={P(lo, a)} x2={P(lo, b)} y1={yy} y2={yy} stroke={col} strokeWidth={7} strokeLinecap="butt" opacity={0.85} />
        <T x={6} y={yy - 10} color={col} bold>{label}</T>
      </g>)}
      {[0, 1].map(i => {
        const [, ya, la, a0, b0] = lines[i], [, yb, lb, a1, b1] = lines[i + 1];
        return <g key={i} opacity={0.5}>
          <line x1={P(la, a0)} y1={ya + 4} x2={P(lb, a1)} y2={yb - 4} stroke={C.muted} strokeDasharray="3 3" />
          <line x1={P(la, b0)} y1={ya + 4} x2={P(lb, b1)} y2={yb - 4} stroke={C.muted} strokeDasharray="3 3" />
        </g>;
      })}
    </>;
    const g1 = 2 * x, f1 = Math.cos(u0);
    controls = <>
      <Sliders>
        <Slider label="x" value={x} min={0.2} max={1.7} step={0.01} onChange={setX} />
        <Slider label="dx" value={dx} min={0.005} max={0.2} step={0.005} onChange={setDx} fmt={v => v.toFixed(3)} />
      </Sliders>
      <Row>
        <Readout color={C.amber}>{`du ≈ g′(x)·dx = ${n3(g1)} · ${n3(dx)} = ${n3(g1 * dx)}   (${tx(t, "figRule_actual", "actual")} ${n3(u1 - u0)})`}</Readout>
        <Readout color={C.green}>{`dy ≈ f′(u)·du = ${n3(f1)} · ${n3(u1 - u0)} = ${n3(f1 * (u1 - u0))}   (${tx(t, "figRule_actual", "actual")} ${n3(y1 - y0)})`}</Readout>
      </Row>
      <Row>
        <Readout>{`dy/dx ≈ ${n3((y1 - y0) / dx)}`}</Readout>
        <Readout color={C.purple}>{`f′(u)·g′(x) = cos(x²)·2x = ${n3(f1 * g1)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRule_noteC", "All three lines use the same scale, so the length of each coloured piece is honest. The blue piece dx is squared on its way to the middle line: near x it is stretched by the factor g′(x) = 2x. The middle piece goes through sine on its way down: it is stretched (or shrunk, or flipped) by f′(u) = cos u. Two stretches in a row multiply, so the total rate is cos(x²) · 2x. Shrink dx and the approximations match the actual changes better and better. Past x ≈ 1.25, cos u is negative and the bottom piece flips direction.");
  } else {
    const R = 90, cx = 120, cy = 140, gx = 250, gs = 290 / (2 * Math.PI);
    const P = (a: number) => ({ x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) });
    const p0 = P(th), p1 = P(th + dth);
    const tip = { x: p0.x - R * dth * Math.sin(th), y: p0.y - R * dth * Math.cos(th) };   // along the tangent
    const G = (a: number) => ({ x: gx + a * gs, y: cy - R * Math.sin(a) });
    const sinPath = Array.from({ length: 121 }, (_, k) => G((k / 120) * 2 * Math.PI))
      .map((q, k) => `${k ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join("");
    const g0 = G(th), rise = Math.sin(th + dth) - Math.sin(th);
    const m = Math.cos(th);
    svg = <>
      <line x1={cx - R - 12} x2={cx + R + 12} y1={cy} y2={cy} stroke={C.axis} />
      <line x1={cx} x2={cx} y1={cy - R - 12} y2={cy + R + 12} stroke={C.axis} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.muted} strokeDasharray="3 3" />
      <line x1={cx} y1={cy} x2={p0.x} y2={p0.y} stroke={C.sky} strokeWidth={2} />
      <line x1={p0.x} y1={cy} x2={p0.x} y2={p0.y} stroke={C.sky} strokeDasharray="3 3" />
      <path d={`M${p0.x},${p0.y} A${R},${R} 0 0 0 ${p1.x},${p1.y}`} fill="none" stroke={C.amber} strokeWidth={3} />
      <polygon points={`${p0.x},${p0.y} ${tip.x},${p0.y} ${tip.x},${tip.y}`} fill={C.green} fillOpacity={0.2} stroke={C.green} strokeWidth={1.2} />
      <line x1={tip.x} y1={p0.y} x2={tip.x} y2={tip.y} stroke={C.green} strokeWidth={2.5} />
      <circle cx={p0.x} cy={p0.y} r={4} fill={C.sky} />
      <T x={cx + 14} y={cy - 6} color={C.sky}>θ</T>
      <T x={tip.x + (tip.x < p0.x ? -6 : 6)} y={(p0.y + tip.y) / 2 + 3} color={C.green} anchor={tip.x < p0.x ? "end" : "start"} bold>{"cos θ · dθ"}</T>
      <line x1={gx} x2={gx + 2 * Math.PI * gs} y1={cy} y2={cy} stroke={C.axis} />
      <path d={sinPath} fill="none" stroke={C.sky} strokeWidth={2} />
      <line x1={g0.x - 40} y1={g0.y + 40 * m * (R / gs)} x2={g0.x + 40} y2={g0.y - 40 * m * (R / gs)} stroke={C.purple} strokeWidth={1.8} strokeDasharray="5 3" />
      <line x1={p0.x} y1={p0.y} x2={g0.x} y2={g0.y} stroke={C.muted} strokeDasharray="2 4" />
      <circle cx={g0.x} cy={g0.y} r={4} fill={C.sky} />
      <T x={gx + 2 * Math.PI * gs} y={cy + 14} anchor="end">2π</T>
      <T x={gx + Math.PI * gs} y={cy + 14} anchor="middle">π</T>
    </>;
    controls = <>
      <Sliders>
        <Slider label="θ" value={th} min={0} max={6.28} step={0.01} onChange={setTh} />
        <Slider label="dθ" value={dth} min={0.01} max={0.6} step={0.01} onChange={setDth} />
      </Sliders>
      <Row>
        <Readout color={C.amber}>{`Δ(sin θ) = ${n3(rise)}`}</Readout>
        <Readout color={C.green}>{`cos θ · dθ = ${n3(m * dth)}`}</Readout>
        <Readout>{`Δ(sin θ)/dθ = ${n3(rise / dth)}`}</Readout>
        <Readout color={C.purple}>{`cos θ = ${n3(m)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figRule_noteS", "Move the point round the circle by a small arc dθ (amber; its length is dθ because the radius is 1). A tiny arc is almost a straight step along the tangent, and the tangent is perpendicular to the radius. So the green step triangle is the blue radius triangle turned a quarter turn: its rise is cos θ times its length dθ. The rise is the change in sin θ, so sin θ changes at the rate cos θ. The graph on the right uses the same scale: its tangent (purple) has slope cos θ. Shrink dθ and the actual change matches cos θ · dθ ever more closely.");
  }

  return (
    <Figure
      title={tx(t, "figRule_title", "Why the rules are true")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["product", tx(t, "figRule_mP", "product")],
        ["chain", tx(t, "figRule_mC", "chain")],
        ["sine", tx(t, "figRule_mS", "sine")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
