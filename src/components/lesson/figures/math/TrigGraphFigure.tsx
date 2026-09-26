"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, fnPath, useDrag } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// quadrants — a point at angle θ on the unit circle and its three mirror
//             images. All four share the same reference angle (the acute
//             angle to the x-axis), so their sines and cosines have the same
//             size and differ only in sign, which the quadrant decides.
// graphs    — sin, cos and tan over two full turns in each direction, with a
//             marker at θ: both waves repeat every 2π, tan every π, and tan
//             shoots off to ±∞ where cos = 0.

type Mode = "quadrants" | "graphs";
const W = 560, H = 300;
const TAU = Math.PI * 2;
const n3 = (v: number) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3).replace("-", "−");
/** Angle as a multiple of π, e.g. "0.75π". */
const piFmt = (a: number) => `${(+(a / Math.PI).toFixed(2)).toString().replace("-", "−")}π`;

export function TrigGraphFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("quadrants");
  const [deg, setDeg] = useState(150);
  const [g, setG] = useState(2.3);
  const [show, setShow] = useState({ sin: true, cos: true, tan: false });

  const pc = plot({ W, H, x0: -2.8, x1: 2.8, y0: -1.5, y1: 1.5 });
  const drag = useDrag<"p">(
    () => (mode === "quadrants" ? "p" : null),
    (_, q) => { const w = pc.inv(q); let a = (Math.atan2(w.y, w.x) * 180) / Math.PI; if (a < 0) a += 360; setDeg(Math.round(a)); });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "quadrants") {
    const th = (deg * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
    const quad = deg % 90 === 0 ? 0 : Math.floor(deg / 90) + 1;
    const ref = quad === 1 ? deg : quad === 2 ? 180 - deg : quad === 3 ? deg - 180 : quad === 4 ? 360 - deg : Math.min(deg % 180, 180 - (deg % 180));
    const mirrors = [ref, 180 - ref, 180 + ref, 360 - ref];
    const signs = [["+", "+"], ["+", "−"], ["−", "−"], ["−", "+"]];
    const X = pc.X, Y = pc.Y;
    svg = <>
      <Grid p={pc} step={0.5} labels={false} />
      <circle cx={X(0)} cy={Y(0)} r={pc.sx} fill="none" stroke={C.muted} strokeWidth={1.3} />
      {mirrors.map((m, i) => {
        const a = (m * Math.PI) / 180;
        return <g key={i} opacity={0.35}>
          <line x1={X(0)} y1={Y(0)} x2={X(Math.cos(a))} y2={Y(Math.sin(a))} stroke={C.fg} strokeWidth={1} strokeDasharray="3 3" />
          <circle cx={X(Math.cos(a))} cy={Y(Math.sin(a))} r={4} fill={C.fg} />
        </g>;
      })}
      {[[1.9, 1.2], [-2.6, 1.2], [-2.6, -1.3], [1.9, -1.3]].map(([x, y], i) =>
        <T key={i} x={X(x)} y={Y(y)} size={10} color={quad === i + 1 ? C.fg : C.axis} bold={quad === i + 1}>
          {`${["I", "II", "III", "IV"][i]}  sin ${signs[i][0]}  cos ${signs[i][1]}`}
        </T>)}
      <line x1={X(0)} y1={Y(0)} x2={X(c)} y2={Y(0)} stroke={C.red} strokeWidth={3} />
      <line x1={X(c)} y1={Y(0)} x2={X(c)} y2={Y(s)} stroke={C.green} strokeWidth={3} />
      <line x1={X(0)} y1={Y(0)} x2={X(c)} y2={Y(s)} stroke={C.fg} strokeWidth={1.6} />
      {/* the angle θ from the positive x-axis, and the reference angle to the nearest x-axis */}
      <path d={`M${X(0.25)},${Y(0)} A${0.25 * pc.sx},${0.25 * pc.sy} 0 ${deg > 180 ? 1 : 0} 0 ${X(0.25 * c)},${Y(0.25 * s)}`} fill="none" stroke={C.purple} strokeWidth={2} />
      {quad > 1 && (() => {
        const base = quad === 2 || quad === 3 ? Math.PI : TAU, r0 = 0.45;
        const a0 = base, a1 = th, sweep = a1 > a0 ? 0 : 1;
        return <path d={`M${X(r0 * Math.cos(a0))},${Y(r0 * Math.sin(a0))} A${r0 * pc.sx},${r0 * pc.sy} 0 0 ${sweep} ${X(r0 * c)},${Y(r0 * s)}`} fill="none" stroke={C.amber} strokeWidth={3} />;
      })()}
      <Handle x={X(c)} y={Y(s)} color={C.sky} active={drag.dragging === "p"} />
    </>;
    controls = <>
      <Slider label={tx(t, "figTg_theta", "angle θ")} value={deg} min={0} max={360} step={1} onChange={setDeg} fmt={v => `${v}°`} width="w-16" />
      <Row>
        <Readout color={C.purple}>{`θ = ${deg}° = ${piFmt(th)} rad`}</Readout>
        <Readout color={C.amber}>{`${tx(t, "figTg_ref", "reference angle")} = ${ref}°`}</Readout>
        <Readout color={C.red}>{`cos θ = ${n3(c)}`}</Readout>
        <Readout color={C.green}>{`sin θ = ${n3(s)}`}</Readout>
        <Readout>{`sin ${ref}° = ${n3(Math.sin((ref * Math.PI) / 180))}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figTg_noteQ", "Drag the point around the circle. Its cosine is the red horizontal leg and its sine the green vertical one, with signs: left of the y-axis cos is negative, below the x-axis sin is negative. The amber arc is the reference angle, the sharp angle between the radius and the nearest part of the x-axis. The four faded points (θ reflected in the axes) share that reference angle, so their sines and cosines are the same numbers with different signs. Every angle's values come from an angle between 0° and 90°.");
  } else {
    const pg = plot({ W, H, x0: -2.15 * Math.PI, x1: 2.15 * Math.PI, y0: -2.2, y1: 2.2 });
    const asym = [-1.5, -0.5, 0.5, 1.5].map(k => k * Math.PI);
    svg = <>
      <Grid p={pg} step={Math.PI / 2} labels={false} />
      {[-2, -1, 1, 2].map(k => <T key={k} x={pg.X(k * Math.PI)} y={pg.Y(0) + 13} size={9} anchor="middle" color={C.axis}>{`${k === 1 ? "" : k === -1 ? "−" : k}π`.replace("-", "−")}</T>)}
      <T x={pg.X(0) - 4} y={pg.Y(1) + 3} size={9} anchor="end" color={C.axis}>1</T>
      <T x={pg.X(0) - 4} y={pg.Y(-1) + 3} size={9} anchor="end" color={C.axis}>−1</T>
      {show.tan && asym.map(a => <line key={a} x1={pg.X(a)} y1={0} x2={pg.X(a)} y2={H} stroke={C.amber} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />)}
      {show.tan && <path d={fnPath(pg, Math.tan, pg.x0, pg.x1, 1600)} fill="none" stroke={C.amber} strokeWidth={1.8} />}
      {show.cos && <path d={fnPath(pg, Math.cos)} fill="none" stroke={C.red} strokeWidth={2} />}
      {show.sin && <path d={fnPath(pg, Math.sin)} fill="none" stroke={C.green} strokeWidth={2.2} />}
      <line x1={pg.X(g)} y1={0} x2={pg.X(g)} y2={H} stroke={C.purple} strokeWidth={1.2} />
      {show.sin && <circle cx={pg.X(g)} cy={pg.Y(Math.sin(g))} r={4.5} fill={C.green} />}
      {show.cos && <circle cx={pg.X(g)} cy={pg.Y(Math.cos(g))} r={4.5} fill={C.red} />}
      {show.tan && Math.abs(Math.tan(g)) < 2.2 && <circle cx={pg.X(g)} cy={pg.Y(Math.tan(g))} r={4.5} fill={C.amber} />}
    </>;
    controls = <>
      <Row>
        {(["sin", "cos", "tan"] as const).map(k => <Btn key={k} active={show[k]} onClick={() => setShow(s => ({ ...s, [k]: !s[k] }))}>{k}</Btn>)}
      </Row>
      <Slider label="θ" value={g} min={-2 * Math.PI} max={2 * Math.PI} step={0.01} onChange={setG} fmt={piFmt} width="w-6" />
      <Row>
        <Readout color={C.green}>{`sin = ${n3(Math.sin(g))}`}</Readout>
        <Readout color={C.red}>{`cos = ${n3(Math.cos(g))}`}</Readout>
        <Readout color={C.amber}>{`tan = ${Math.abs(Math.cos(g)) < 1e-3 ? "±∞" : n3(Math.tan(g))}`}</Readout>
        <Readout>{`sin(θ + 2π) = ${n3(Math.sin(g + TAU))}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figTg_noteG", "Unrolled over two turns each way, sine and cosine are the same wave shifted by a quarter turn (π/2), and they repeat every 2π: going once more around the circle brings the point back. Turn on tan: it repeats every π, crosses zero where sine does and has vertical asymptotes (dashed) where cosine is zero, since it divides by the cosine. Negative angles turn clockwise; sine is odd (sin(−θ) = −sin θ) and cosine is even (cos(−θ) = cos θ).");
  }

  return (
    <Figure
      title={tx(t, "figTg_title", "Every angle, every sign")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["quadrants", tx(t, "figTg_mQuad", "quadrants")],
        ["graphs", tx(t, "figTg_mGraphs", "graphs")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
