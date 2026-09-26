"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, plot, Grid, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Where the area formulas come from, one shape at a time, over a grid of unit
// squares:
// rect          — b × h unit squares, counted row by row.
// parallelogram — cut the triangle off one end and slide it to the other: a
//                 rectangle with the same base and height.
// triangle      — a second copy, turned half a turn, completes a
//                 parallelogram; the triangle is half of it.
// trapezoid     — the same trick: two copies make a parallelogram whose base
//                 is the two parallel sides added together.
// The "rearrange" slider performs the move.

type Mode = "rect" | "para" | "tri" | "trap";
const p = plot({ W: 560, H: 238, x0: -3.5, x1: 16.5, y0: -1.25, y1: 7.25 });
const n1 = (v: number) => (+v.toFixed(2)).toString();
const pts = (ps: Pt[]) => ps.map(q => `${p.X(q.x)},${p.Y(q.y)}`).join(" ");
/** Half-turn rotation of a point about m, k = 0 … 1 of the way. */
const turn = (q: Pt, m: Pt, k: number): Pt => {
  const c = Math.cos(Math.PI * k), s = Math.sin(Math.PI * k), dx = q.x - m.x, dy = q.y - m.y;
  return { x: m.x + c * dx - s * dy, y: m.y + s * dx + c * dy };
};

export function AreaFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("rect");
  const [b, setB] = useState(6), [h, setH] = useState(4), [sh, setSh] = useState(2), [top, setTop] = useState(3);
  const [k, setK] = useState(0);
  const s = clamp(sh, -b, b);

  const fillA = { fill: C.sky, fillOpacity: 0.25, stroke: C.sky, strokeWidth: 2 };
  const fillB = { fill: C.amber, fillOpacity: 0.3, stroke: C.amber, strokeWidth: 2 };
  let shapes: React.ReactNode, formula: string, note: string, hx = 0;

  if (mode === "rect") {
    shapes = <>
      <polygon points={pts([{ x: 0, y: 0 }, { x: b, y: 0 }, { x: b, y: h }, { x: 0, y: h }])} {...fillA} />
      {Array.from({ length: Math.floor(b) * Math.floor(h) }, (_, i) => {
        const x = i % Math.floor(b), y = Math.floor(i / Math.floor(b));
        return <T key={i} x={p.X(x + 0.5)} y={p.Y(y + 0.5) + 3} size={8} anchor="middle" color={C.sky}>{i + 1}</T>;
      })}
    </>;
    formula = `A = b · h = ${n1(b)} · ${n1(h)} = ${n1(b * h)}`;
    note = tx(t, "figArea_noteR", "Area counts unit squares. A rectangle b units wide and h units tall has h rows of b squares each, so b · h squares. With a fractional side the last row or column holds pieces of squares, and the formula still counts them exactly.");
  } else if (mode === "para") {
    const tri = s >= 0 ? [{ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: h }] : [{ x: b + s, y: 0 }, { x: b, y: 0 }, { x: b + s, y: h }];
    const rest = s >= 0 ? [{ x: s, y: 0 }, { x: b, y: 0 }, { x: b + s, y: h }, { x: s, y: h }] : [{ x: 0, y: 0 }, { x: b + s, y: 0 }, { x: b + s, y: h }, { x: s, y: h }];
    const dx = (s >= 0 ? b : -b) * k;
    shapes = <>
      <polygon points={pts(rest)} {...fillA} />
      <polygon points={pts(tri.map(q => ({ x: q.x + dx, y: q.y })))} {...fillB} />
    </>;
    hx = s >= 0 ? s : b + s;
    formula = `A = b · h = ${n1(b)} · ${n1(h)} = ${n1(b * h)}`;
    note = tx(t, "figArea_noteP", "A parallelogram leans, but slide the rearrange slider: the triangle cut from one end fits exactly onto the other end, and the shape becomes a rectangle with the same base b and the same height h. No area was added or lost, so the parallelogram's area is b · h too. The height is the straight up-and-down distance (dashed), not the slanted side. Change the lean: the area never changes.");
  } else if (mode === "tri") {
    const A = { x: 0, y: 0 }, B = { x: b, y: 0 }, Cc = { x: s, y: h };
    const m = { x: (b + s) / 2, y: h / 2 };
    shapes = <>
      {k > 0 && <polygon points={pts([A, B, Cc].map(q => turn(q, m, k)))} {...fillB} strokeDasharray="5 4" />}
      <polygon points={pts([A, B, Cc])} {...fillA} />
    </>;
    hx = s;
    formula = `A = b · h / 2 = ${n1(b)} · ${n1(h)} / 2 = ${n1((b * h) / 2)}`;
    note = tx(t, "figArea_noteT", "Turn a copy of the triangle half a turn around the middle of its right side (rearrange slider). The two copies fit together into a parallelogram with base b and height h, whose area is b · h. The triangle is exactly half of it: ½ · b · h. Any side can be the base, as long as the height is measured perpendicular to that side, from the opposite corner.");
  } else {
    const a = Math.min(top, b + 4);
    const P = [{ x: 0, y: 0 }, { x: b, y: 0 }, { x: s + a, y: h }, { x: s, y: h }];
    const m = { x: (b + s + a) / 2, y: h / 2 };
    shapes = <>
      {k > 0 && <polygon points={pts(P.map(q => turn(q, m, k)))} {...fillB} strokeDasharray="5 4" />}
      <polygon points={pts(P)} {...fillA} />
      <T x={p.X(s + a / 2)} y={p.Y(h) - 8} size={10} anchor="middle" color={C.pink} bold>{`a = ${n1(a)}`}</T>
    </>;
    hx = s;
    formula = `A = (a + b) · h / 2 = (${n1(a)} + ${n1(b)}) · ${n1(h)} / 2 = ${n1(((a + b) * h) / 2)}`;
    note = tx(t, "figArea_noteZ", "A trapezoid has two parallel sides, a and b. A half-turned copy, placed against its slanted side, completes a parallelogram. Its base is a + b (the copy's short side continues the original's long side) and its height is h, so the two copies have area (a + b) · h and one of them has half of that.");
  }

  return (
    <Figure
      title={tx(t, "figArea_title", "Where area formulas come from")}
      head={<Choice value={mode} onChange={v => { setMode(v); setK(0); }} options={[
        ["rect", tx(t, "figArea_mRect", "rectangle")],
        ["para", tx(t, "figArea_mPara", "parallelogram")],
        ["tri", tx(t, "figArea_mTri", "triangle")],
        ["trap", tx(t, "figArea_mTrap", "trapezoid")],
      ] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figArea_b", "base b")} value={b} min={1} max={8} step={0.5} onChange={setB} fmt={n1} />
          <Slider label={tx(t, "figArea_h", "height h")} value={h} min={1} max={6} step={0.5} onChange={setH} fmt={n1} />
          {mode !== "rect" && <Slider label={tx(t, "figArea_s", "lean")} value={sh} min={-3} max={3} step={0.5} onChange={setSh} fmt={n1} />}
          {mode === "trap" && <Slider label={tx(t, "figArea_a", "top a")} value={top} min={0.5} max={5} step={0.5} onChange={setTop} fmt={n1} />}
          {mode !== "rect" && <Slider label={tx(t, "figArea_k", "rearrange")} value={k} min={0} max={1} step={0.01} onChange={setK} fmt={v => `${Math.round(v * 100)}%`} />}
        </Sliders>
        <Row><Readout color={C.green}>{formula}</Readout></Row>
      </>}
      note={note}
    >
      <svg viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
        <Grid p={p} step={1} labels={false} />
        {shapes}
        {mode !== "rect" && <line x1={p.X(hx)} y1={p.Y(0)} x2={p.X(hx)} y2={p.Y(h)} stroke={C.green} strokeWidth={1.6} strokeDasharray="4 3" />}
        {mode !== "rect" && <path d={`M${p.X(hx) + 8},${p.Y(0)} v-8 h-8`} fill="none" stroke={C.green} strokeWidth={1.2} />}
        <T x={mode === "rect" ? p.X(0) - 6 : p.X(hx) + 5} y={p.Y(h / 2)} size={10} anchor={mode === "rect" ? "end" : "start"} color={C.green} bold>{`h = ${n1(h)}`}</T>
        <T x={p.X(b / 2)} y={p.Y(0) + 15} size={10} anchor="middle" color={C.sky} bold>{`b = ${n1(b)}`}</T>
      </svg>
    </Figure>
  );
}
