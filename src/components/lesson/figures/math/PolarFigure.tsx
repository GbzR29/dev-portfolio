"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, Btn, C, T, Handle, plot, useDrag, nearest } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// curves — polar curves r = f(θ) on a polar grid (rings of equal r, spokes of
//          equal θ). A point sweeps θ and sits at distance f(θ) along it:
//          circle, cardioid, rose and spiral.
// turn   — a heading and a target direction on a dial. The raw difference
//          target − heading can be almost a full turn; wrapped into (−π, π]
//          it is the short way round, which is the turn to make.

type Mode = "curves" | "turn";
type Curve = "circle" | "cardioid" | "rose" | "spiral";
const W = 560, H = 300;
const TAU = Math.PI * 2;
const p = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const n2 = (v: number) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2).replace("-", "−");
const deg = (a: number) => `${(Math.round((a * 180) / Math.PI * 10) / 10).toString().replace("-", "−")}°`;
const wrap = (a: number) => { const w = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; return w === -Math.PI ? Math.PI : w; };

export function PolarFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("curves");
  const [curve, setCurve] = useState<Curve>("rose");
  const [k, setK] = useState(3);
  const [th, setTh] = useState(1);
  const [head, setHead] = useState(2.6), [targ, setTarg] = useState(-2.4);

  const f = (a: number) => curve === "circle" ? 2.2 : curve === "cardioid" ? 1.3 * (1 + Math.cos(a)) : curve === "rose" ? 2.6 * Math.cos(k * a) : 0.2 * a;
  const span = curve === "spiral" ? 2 * TAU : TAU;
  const R0 = 2.4;
  const drag = useDrag<"h" | "g">(
    q => mode === "turn" ? nearest(q, [["h", { x: p.X(R0 * Math.cos(head)), y: p.Y(R0 * Math.sin(head)) }], ["g", { x: p.X(R0 * Math.cos(targ)), y: p.Y(R0 * Math.sin(targ)) }]], 22) : null,
    (id, q) => { const w = p.inv(q), a = Math.atan2(w.y, w.x); (id === "h" ? setHead : setTarg)(a); });

  const grid = <g pointerEvents="none">
    {[0.5, 1, 1.5, 2, 2.5].map(r => <circle key={r} cx={p.X(0)} cy={p.Y(0)} r={r * p.sx} fill="none" stroke={C.grid} strokeWidth={r % 1 === 0 ? 1 : 0.6} />)}
    {Array.from({ length: 12 }, (_, i) => { const a = (i * TAU) / 12; return <line key={i} x1={p.X(0)} y1={p.Y(0)} x2={p.X(2.9 * Math.cos(a))} y2={p.Y(2.9 * Math.sin(a))} stroke={C.grid} strokeWidth={i % 3 === 0 ? 1.1 : 0.6} />; })}
    {[1, 2].map(r => <text key={r} x={p.X(r) + 2} y={p.Y(0) - 3} fontSize={8.5} fill={C.axis} fontFamily="monospace">{r}</text>)}
  </g>;

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "curves") {
    const a = th * (span / TAU), r = f(a);
    const pts = Array.from({ length: 601 }, (_, i) => { const b = (i / 600) * span, rr = f(b); return `${i ? "L" : "M"}${p.X(rr * Math.cos(b)).toFixed(1)},${p.Y(rr * Math.sin(b)).toFixed(1)}`; }).join("");
    const trace = Array.from({ length: 301 }, (_, i) => { const b = (i / 300) * a, rr = f(b); return `${i ? "L" : "M"}${p.X(rr * Math.cos(b)).toFixed(1)},${p.Y(rr * Math.sin(b)).toFixed(1)}`; }).join("");
    const P = { x: r * Math.cos(a), y: r * Math.sin(a) };
    const formula = curve === "circle" ? "r = 2.2" : curve === "cardioid" ? "r = 1.3(1 + cos θ)" : curve === "rose" ? `r = 2.6 cos(${k}θ)` : "r = 0.2 θ";
    svg = <>
      {grid}
      <path d={pts} fill="none" stroke={C.sky} strokeWidth={1.2} opacity={0.35} />
      <path d={trace} fill="none" stroke={C.sky} strokeWidth={2.4} />
      <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(3 * Math.cos(a))} y2={p.Y(3 * Math.sin(a))} stroke={C.purple} strokeWidth={1} strokeDasharray="4 3" />
      <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(P.x)} y2={p.Y(P.y)} stroke={r < 0 ? C.red : C.amber} strokeWidth={2.2} />
      <circle cx={p.X(P.x)} cy={p.Y(P.y)} r={5.5} fill={C.amber} />
      <T x={8} y={16} size={11} color={C.sky} bold>{formula}</T>
    </>;
    controls = <>
      <Row>
        {([["circle", tx(t, "figPol_circle", "circle")], ["cardioid", tx(t, "figPol_cardioid", "cardioid")], ["rose", tx(t, "figPol_rose", "rose")], ["spiral", tx(t, "figPol_spiral", "spiral")]] as const).map(([c, l]) =>
          <Btn key={c} active={curve === c} onClick={() => setCurve(c)}>{l}</Btn>)}
      </Row>
      <Sliders>
        <Slider label="θ" value={th} min={0} max={TAU} step={0.01} onChange={setTh} fmt={v => deg(v * (span / TAU))} />
        {curve === "rose" && <Slider label="k" value={k} min={1} max={7} step={1} onChange={setK} fmt={String} />}
      </Sliders>
      <Row>
        <Readout color={C.amber}>{`r = ${n2(r)}`}</Readout>
        <Readout>{`(x, y) = (r cos θ, r sin θ) = (${n2(P.x)}, ${n2(P.y)})`}</Readout>
        {r < 0 && <Readout color={C.red}>{tx(t, "figPol_neg", "r < 0: plotted on the opposite side")}</Readout>}
      </Row>
    </>;
    note = tx(t, "figPol_noteC", "On a polar grid the rings are distances from the centre and the spokes are angles. A polar curve gives the distance r for each angle θ. Sweep θ and watch the amber point: the circle keeps r fixed, the spiral lets r grow steadily with θ, the cardioid swells and shrinks once per turn, and the rose r = cos(kθ) makes petals (k petals for odd k, 2k for even k). When r comes out negative the point is drawn on the opposite side of the centre, which is how the rose gets its extra petals.");
  } else {
    const raw = targ - head, w = wrap(raw);
    const arc = (r0: number, a0: number, d: number, col: string, wd: number, dash?: string) => {
      const n = 60;
      let path = "";
      for (let i = 0; i <= n; i++) { const b = a0 + (d * i) / n; path += `${i ? "L" : "M"}${p.X(r0 * Math.cos(b))},${p.Y(r0 * Math.sin(b))}`; }
      return <path d={path} fill="none" stroke={col} strokeWidth={wd} strokeDasharray={dash} />;
    };
    svg = <>
      {grid}
      {arc(1.2, head, raw, C.red, 1.5, "4 3")}
      {arc(1.6, head, w, C.green, 3.5)}
      <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(R0 * Math.cos(head))} y2={p.Y(R0 * Math.sin(head))} stroke={C.sky} strokeWidth={3} />
      <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(R0 * Math.cos(targ))} y2={p.Y(R0 * Math.sin(targ))} stroke={C.amber} strokeWidth={2} strokeDasharray="5 3" />
      <Handle x={p.X(R0 * Math.cos(head))} y={p.Y(R0 * Math.sin(head))} color={C.sky} active={drag.dragging === "h"} />
      <Handle x={p.X(R0 * Math.cos(targ))} y={p.Y(R0 * Math.sin(targ))} color={C.amber} active={drag.dragging === "g"} />
      <T x={p.X(2.75 * Math.cos(head))} y={p.Y(2.75 * Math.sin(head)) + 4} size={10} anchor="middle" color={C.sky} bold>{tx(t, "figPol_heading", "heading")}</T>
      <T x={p.X(2.75 * Math.cos(targ))} y={p.Y(2.75 * Math.sin(targ)) + 4} size={10} anchor="middle" color={C.amber} bold>{tx(t, "figPol_target", "target")}</T>
    </>;
    controls = <Row>
      <Readout color={C.sky}>{`${tx(t, "figPol_heading", "heading")} = ${deg(head)}`}</Readout>
      <Readout color={C.amber}>{`${tx(t, "figPol_target", "target")} = ${deg(targ)}`}</Readout>
      <Readout color={C.red}>{`${tx(t, "figPol_raw", "raw difference")} = ${deg(raw)}`}</Readout>
      <Readout color={C.green}>{`${tx(t, "figPol_wrapped", "wrapped")} = ${deg(w)} ${w >= 0 ? "↺" : "↻"}`}</Readout>
    </Row>;
    note = tx(t, "figPol_noteT", "Drag the heading (blue) and the target (amber). atan2 returns angles between −180° and 180°, so simply subtracting them can give almost a full turn (red dashed arc) even when the target is just past the ±180° line. Wrapping the difference back into (−180°, 180°] gives the short way round (green): its sign says which way to turn, anticlockwise or clockwise, and its size how far.");
  }

  return (
    <Figure
      title={tx(t, "figPol_title", "Polar coordinates")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["curves", tx(t, "figPol_mCurves", "polar curves")],
        ["turn", tx(t, "figPol_mTurn", "shortest turn")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
