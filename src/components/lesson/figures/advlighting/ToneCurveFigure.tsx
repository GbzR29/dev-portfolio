"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, Slider, C, T, Handle, useDrag, clamp, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The four ways of turning an HDR value into a displayable one, plotted over a
// logarithmic x axis (each grid line is 10× more light) so shadows and the sun
// fit on one plot. Every curve receives the value already multiplied by the
// exposure. Drag the probe along the axis: the readouts follow one value
// through each operator and into the 8-bit byte the display receives (after
// the 1/2.2 gamma encode). The ticks under the axis are typical values of the
// same scene, to show which ones each operator keeps apart.

const W = 620, H = 260, X0 = 44, X1 = 604, Y0 = 226, Y1 = 18;
const LMIN = -2, LMAX = 2.5;                       // log10 of the HDR value range
const px = (lg: number) => X0 + ((lg - LMIN) / (LMAX - LMIN)) * (X1 - X0);
const py = (v: number) => Y0 - clamp(v, 0, 1.08) * (Y0 - Y1) / 1.08;

type Op = { id: string; en: string; color: string; f: (x: number) => number };
const OPS: Op[] = [
  { id: "clamp", en: "clamp (no tone mapping)", color: C.red, f: x => Math.min(1, x) },
  { id: "reinhard", en: "Reinhard x/(1+x)", color: C.sky, f: x => x / (1 + x) },
  { id: "expo", en: "exposure 1 − e^(−x)", color: C.green, f: x => 1 - Math.exp(-x) },
  { id: "aces", en: "ACES fit (unclamped)", color: C.amber, f: x => (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14) },
];
const MARKS: [string, string, number][] = [
  ["shadow", "shadowed corner", 0.03], ["wall", "lit wall", 0.4], ["white", "white paper in light", 1.5],
  ["lamp", "lamp shade", 12], ["bulb", "bulb", 150],
];

export function ToneCurveFigure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figToneC_${k}`, en);
  const [lg, setLg] = useState(Math.log10(1.5));
  const [ev, setEv] = useState(0);                 // exposure in stops: e = 2^ev
  const e = 2 ** ev;
  const x = 10 ** lg;

  const drag = useDrag<"p">(
    p => (Math.abs(p.x - px(lg)) < 24 ? "p" : null),
    (_, p) => setLg(clamp(LMIN + ((p.x - X0) / (X1 - X0)) * (LMAX - LMIN), LMIN, LMAX)),
  );
  const curve = (f: (x: number) => number) => {
    let d = "";
    for (let i = 0; i <= 200; i++) {
      const l = LMIN + (i / 200) * (LMAX - LMIN);
      d += `${i ? "L" : "M"}${px(l).toFixed(1)},${py(f(e * 10 ** l)).toFixed(1)}`;
    }
    return d;
  };
  const byte = (v: number) => Math.round(clamp(v, 0, 1) ** (1 / 2.2) * 255);

  return (
    <Figure
      title={L("title", "One HDR value through four tone curves")}
      controls={<>
        <Slider label={L("exposure", "exposure (stops)")} value={ev} min={-4} max={4} step={0.25} onChange={setEv}
          fmt={v => `${v > 0 ? "+" : ""}${v}`} width="w-28" />
        <Row>
          <Readout>e = 2^EV = {f2(e, e < 1 ? 3 : 2)}</Readout>
          <Readout>{L("hdr", "HDR value")} x = {f2(x, x < 1 ? 3 : 2)}</Readout>
          <Readout>e·x = {f2(e * x, e * x < 1 ? 3 : 2)}</Readout>
        </Row>
        <Row>
          {OPS.map(o => {
            const v = o.f(e * x);
            return <Readout key={o.id} color={o.color}>{f2(v, 3)} → {L("byte", "byte")} {byte(v)}</Readout>;
          })}
        </Row>
      </>}
      note={L("note", "Drag the probe. The x axis is logarithmic: each grid line is ten times more light. Clamping (red) is exact below 1 and throws everything above it away: the paper, the lamp shade and the bulb all become byte 255. Reinhard (blue) never reaches 1, so it keeps every value distinct, but maps 1.0 to only 0.5 and makes the image flat. The exposure curve (green) starts with slope e, so darks keep their contrast, and saturates smoothly. The ACES fit (amber) has a toe (slightly darker shadows), stronger mid-tone contrast and a shoulder; it passes 1.0 above about e·x = 7.2, so it must be clamped. Change the exposure and every curve slides sideways: exposure picks which part of the scene lands in the steep, contrasty middle.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {[-2, -1, 0, 1, 2].map(l => <g key={l}>
          <line x1={px(l)} x2={px(l)} y1={Y1} y2={Y0} stroke={C.grid} strokeWidth={1} />
          <T x={px(l)} y={Y0 + 12} size={8} anchor="middle">{10 ** l >= 1 ? 10 ** l : (10 ** l).toFixed(l === -2 ? 2 : 1)}</T>
        </g>)}
        {[0, 0.5, 1].map(v => <g key={v}>
          <line x1={X0} x2={X1} y1={py(v)} y2={py(v)} stroke={v === 1 ? C.red : C.grid} strokeDasharray={v === 1 ? "4 3" : undefined} strokeWidth={1} />
          <T x={X0 - 6} y={py(v) + 3} size={8} anchor="end">{v}</T>
        </g>)}
        {OPS.map(o => <path key={o.id} d={curve(o.f)} fill="none" stroke={o.color} strokeWidth={2} />)}
        {OPS.map((o, i) => <g key={`k${o.id}`}>
          <line x1={X1 - 170} x2={X1 - 154} y1={Y0 - 62 + i * 13} y2={Y0 - 62 + i * 13} stroke={o.color} strokeWidth={2.5} />
          <T x={X1 - 149} y={Y0 - 59 + i * 13} size={8.5} color={o.color}>{L(o.id, o.en)}</T>
        </g>)}
        {MARKS.map(([k, en, v]) => <g key={k}>
          <line x1={px(Math.log10(v))} x2={px(Math.log10(v))} y1={Y0 + 16} y2={Y0 + 22} stroke={C.muted} strokeWidth={1.5} />
          <T x={px(Math.log10(v))} y={Y0 + 32} size={7.5} anchor="middle">{L(k, en)}</T>
        </g>)}
        <line x1={px(lg)} x2={px(lg)} y1={Y1} y2={Y0} stroke={C.fg} strokeDasharray="3 3" strokeWidth={1} />
        {OPS.map(o => <circle key={o.id} cx={px(lg)} cy={py(o.f(e * x))} r={3.5} fill={o.color} />)}
        <Handle x={px(lg)} y={Y0} color={C.purple} active={drag.dragging === "p"} />
        <T x={X1} y={Y1 - 4} size={8} anchor="end">{L("axis", "HDR value x (log scale)")}</T>
      </svg>
    </Figure>
  );
}
