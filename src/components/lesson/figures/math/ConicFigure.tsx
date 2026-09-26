"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, plot, Grid, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Each conic drawn from its distance rule, with a point P that walks along it
// and the distances that stay constant:
// parabola  — distance to the focus = distance to the directrix. Rays coming
//             straight down bounce off it into the focus.
// ellipse   — distance to F₁ + distance to F₂ = 2a (the string-and-pins
//             construction).
// hyperbola — |distance to F₁ − distance to F₂| = 2a, with its asymptotes.

type Mode = "parabola" | "ellipse" | "hyperbola";
const W = 560, H = 300;
const p = plot({ W, H, x0: -7.467, x1: 7.467, y0: -4, y1: 4 });
const n2 = (v: number) => (+v.toFixed(2)).toString().replace("-", "−");
const X = (q: Pt) => p.X(q.x), Y = (q: Pt) => p.Y(q.y);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const path = (q: Pt[]) => q.map((v, i) => `${i ? "L" : "M"}${X(v).toFixed(1)},${Y(v).toFixed(1)}`).join("");
const V0 = -2.5;                                    // the parabola's vertex height

export function ConicFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("ellipse");
  const [pf, setPf] = useState(1);
  const [a, setA] = useState(4), [c, setC] = useState(2.5);
  const [ha, setHa] = useState(1.5), [hc, setHc] = useState(2.5);
  const [s, setS] = useState(0.35);

  let svg: React.ReactNode, controls: React.ReactNode, note: string, e = 0;
  const foci = (F1: Pt, F2: Pt) => <>
    <circle cx={X(F1)} cy={Y(F1)} r={4.5} fill={C.amber} />
    <circle cx={X(F2)} cy={Y(F2)} r={4.5} fill={C.amber} />
    <T x={X(F1)} y={Y(F1) + 16} size={10} anchor="middle" color={C.amber} bold>F₁</T>
    <T x={X(F2)} y={Y(F2) + 16} size={10} anchor="middle" color={C.amber} bold>F₂</T>
  </>;
  const Pdot = (P: Pt) => <>
    <circle cx={X(P)} cy={Y(P)} r={5.5} fill={C.pink} />
    <T x={X(P) + 9} y={Y(P) - 8} size={11} color={C.pink} bold>P</T>
  </>;

  if (mode === "parabola") {
    const f = (x: number) => V0 + (x * x) / (4 * pf);
    const F = { x: 0, y: V0 + pf }, dy = V0 - pf;
    const x = s * 12 - 6, P = { x, y: f(x) };
    const curve = Array.from({ length: 121 }, (_, i) => { const xx = -7.5 + i * 0.125; return { x: xx, y: f(xx) }; });
    svg = <>
      <Grid p={p} step={1} labels={false} />
      {[-5, -3.5, -2, 2, 3.5, 5].map(rx => {
        const hit = { x: rx, y: f(rx) };
        return hit.y < 4 && <path key={rx} d={path([{ x: rx, y: 4 }, hit, F])} fill="none" stroke={C.teal} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />;
      })}
      <line x1={0} y1={p.Y(dy)} x2={W} y2={p.Y(dy)} stroke={C.purple} strokeWidth={2} />
      <T x={8} y={p.Y(dy) - 5} size={9.5} color={C.purple} bold>{tx(t, "figCon_directrix", "directrix")}</T>
      <path d={path(curve)} fill="none" stroke={C.sky} strokeWidth={2.4} />
      <line x1={X(P)} y1={Y(P)} x2={X(F)} y2={Y(F)} stroke={C.green} strokeWidth={2} />
      <line x1={X(P)} y1={Y(P)} x2={X(P)} y2={p.Y(dy)} stroke={C.green} strokeWidth={2} strokeDasharray="5 3" />
      <circle cx={X(F)} cy={Y(F)} r={4.5} fill={C.amber} />
      <T x={X(F) + 8} y={Y(F) + 4} size={10} color={C.amber} bold>F</T>
      {Pdot(P)}
    </>;
    e = 1;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figCon_p", "focus distance p")} value={pf} min={0.25} max={1.5} step={0.05} onChange={setPf} fmt={n2} />
        <Slider label={tx(t, "figCon_move", "move P")} value={s} min={0} max={1} step={0.005} onChange={setS} fmt={v => n2(v * 12 - 6)} />
      </Sliders>
      <Row>
        <Readout color={C.green}>{`PF = ${n2(dist(P, F))}`}</Readout>
        <Readout color={C.green}>{`${tx(t, "figCon_pd", "P to directrix")} = ${n2(P.y - dy)}`}</Readout>
        <Readout color={C.sky}>{`y + 2.5 = x² / ${n2(4 * pf)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCon_noteP", "A parabola is every point that is as far from a point, the focus F, as from a line, the directrix. Move P: the solid and the dashed green segments are always equal. The dashed teal rays show why dishes and headlights are parabolic: every ray coming straight down bounces off the curve into the focus, and a lamp at the focus sends its light out in a parallel beam. Moving the focus closer to the directrix makes the parabola narrower.");
  } else if (mode === "ellipse") {
    const cc = clamp(c, Math.sqrt(Math.max(0, a * a - 3.8 * 3.8)), a - 0.05);
    const b = Math.sqrt(a * a - cc * cc), F1 = { x: -cc, y: 0 }, F2 = { x: cc, y: 0 };
    const ang = s * Math.PI * 2, P = { x: a * Math.cos(ang), y: b * Math.sin(ang) };
    e = cc / a;
    svg = <>
      <Grid p={p} step={1} labels={false} />
      <ellipse cx={p.X(0)} cy={p.Y(0)} rx={a * p.sx} ry={b * p.sy} fill={C.sky} fillOpacity={0.07} stroke={C.sky} strokeWidth={2.4} />
      <line x1={p.X(-a)} y1={p.Y(0)} x2={p.X(a)} y2={p.Y(0)} stroke={C.muted} strokeWidth={0.8} strokeDasharray="4 3" />
      <line x1={p.X(0)} y1={p.Y(-b)} x2={p.X(0)} y2={p.Y(b)} stroke={C.muted} strokeWidth={0.8} strokeDasharray="4 3" />
      <T x={p.X(a / 2)} y={p.Y(0) - 5} size={9.5} anchor="middle" color={C.muted}>a</T>
      <T x={p.X(0) + 5} y={p.Y(b / 2)} size={9.5} color={C.muted}>b</T>
      <path d={path([F1, P, F2])} fill="none" stroke={C.green} strokeWidth={2} strokeLinejoin="round" />
      {foci(F1, F2)}
      {Pdot(P)}
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figCon_a", "half-width a")} value={a} min={1} max={6} step={0.1} onChange={setA} fmt={n2} />
        <Slider label={tx(t, "figCon_c", "focus distance c")} value={c} min={0} max={6} step={0.1} onChange={setC} fmt={() => n2(cc)} />
        <Slider label={tx(t, "figCon_move", "move P")} value={s} min={0} max={1} step={0.005} onChange={setS} fmt={v => `${Math.round(v * 360)}°`} />
      </Sliders>
      <Row>
        <Readout color={C.green}>{`PF₁ + PF₂ = ${n2(dist(P, F1))} + ${n2(dist(P, F2))} = ${n2(dist(P, F1) + dist(P, F2))} = 2a`}</Readout>
        <Readout color={C.sky}>{`x²/${n2(a * a)} + y²/${n2(b * b)} = 1`}</Readout>
        <Readout>{`b = √(a² − c²) = ${n2(b)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCon_noteE", "Pin a loop of string at the two foci F₁ and F₂ and pull it tight with a pencil: the pencil traces an ellipse, because the two pieces of string always add up to the same length, 2a. Move P and check the sum. Push the foci together (c = 0) and you get a circle; pull them apart and the ellipse flattens. Planets orbit the Sun on ellipses with the Sun at one focus.");
  } else {
    const cc = Math.max(hc, ha + 0.1);
    const b = Math.sqrt(cc * cc - ha * ha), F1 = { x: -cc, y: 0 }, F2 = { x: cc, y: 0 };
    const yP = (s - 0.5) * 7.6, P = { x: ha * Math.sqrt(1 + (yP / b) ** 2), y: yP };
    const branch = (sg: number) => Array.from({ length: 121 }, (_, i) => { const y = -4.2 + i * 0.07; return { x: sg * ha * Math.sqrt(1 + (y / b) ** 2), y }; });
    e = cc / ha;
    svg = <>
      <Grid p={p} step={1} labels={false} />
      <line {...{ x1: p.X(-8), y1: p.Y((-8 * b) / ha), x2: p.X(8), y2: p.Y((8 * b) / ha) }} stroke={C.muted} strokeWidth={1} strokeDasharray="5 4" />
      <line {...{ x1: p.X(-8), y1: p.Y((8 * b) / ha), x2: p.X(8), y2: p.Y((-8 * b) / ha) }} stroke={C.muted} strokeWidth={1} strokeDasharray="5 4" />
      <path d={path(branch(1))} fill="none" stroke={C.sky} strokeWidth={2.4} />
      <path d={path(branch(-1))} fill="none" stroke={C.sky} strokeWidth={2.4} />
      <line x1={X(P)} y1={Y(P)} x2={X(F1)} y2={Y(F1)} stroke={C.green} strokeWidth={2} />
      <line x1={X(P)} y1={Y(P)} x2={X(F2)} y2={Y(F2)} stroke={C.green} strokeWidth={2} strokeDasharray="5 3" />
      {foci(F1, F2)}
      {Pdot(P)}
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figCon_a", "half-width a")} value={ha} min={0.5} max={3.5} step={0.1} onChange={setHa} fmt={n2} />
        <Slider label={tx(t, "figCon_c", "focus distance c")} value={hc} min={0.6} max={6} step={0.1} onChange={setHc} fmt={() => n2(cc)} />
        <Slider label={tx(t, "figCon_move", "move P")} value={s} min={0} max={1} step={0.005} onChange={setS} fmt={v => n2((v - 0.5) * 7.6)} />
      </Sliders>
      <Row>
        <Readout color={C.green}>{`PF₁ − PF₂ = ${n2(dist(P, F1))} − ${n2(dist(P, F2))} = ${n2(dist(P, F1) - dist(P, F2))} = 2a`}</Readout>
        <Readout color={C.sky}>{`x²/${n2(ha * ha)} − y²/${n2(b * b)} = 1`}</Readout>
        <Readout>{`${tx(t, "figCon_asym", "asymptotes")} y = ±${n2(b / ha)}x`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCon_noteH", "A hyperbola is every point whose distances to two foci differ by the same amount, 2a. It has two separate branches, one near each focus, and far away each branch runs alongside a straight dashed line, an asymptote, without ever touching it. Hyperbolas locate things from timing: if a sound reaches two microphones 1 ms apart, the source lies on a hyperbola with the microphones as foci.");
  }

  return (
    <Figure
      title={tx(t, "figCon_title", "Conics from distances")}
      head={<Choice value={mode} onChange={v => { setMode(v); setS(0.35); }} options={[
        ["parabola", tx(t, "figCon_mPar", "parabola")],
        ["ellipse", tx(t, "figCon_mEll", "ellipse")],
        ["hyperbola", tx(t, "figCon_mHyp", "hyperbola")],
      ] as const} />}
      controls={<>{controls}<Row><Readout color={C.amber}>{`${tx(t, "figCon_e", "eccentricity")} e = ${e === 1 ? "1" : n2(e)}`}</Readout></Row></>}
      note={note}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
