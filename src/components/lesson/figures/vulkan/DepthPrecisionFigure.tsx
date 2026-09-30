"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// How far apart two surfaces must be, at distance d from the camera, to get
// different depth values: Δd = (spacing of representable depths at z) / |dz/dd|.
// z = f(d − n) / ((f − n) d) is the value GLM's zero-to-one perspective writes;
// reversed Z stores 1 − z (computed directly, so it keeps its precision).
// Log–log plot for D16, D24 and D32_SFLOAT (standard and reversed). Where a
// curve rises above the "gap" line, two surfaces that far apart z-fight.

const W = 640, H = 270, PL = 58, PR = 12, PT = 14, PB = 34;
const YMIN = -8, YMAX = 3;                                   // log10 of Δd, in scene units

const zStd = (d: number, n: number, f: number) => (f * (d - n)) / ((f - n) * d);
const zRev = (d: number, n: number, f: number) => (n * (f - d)) / ((f - n) * d);
/** Distance between neighbouring float32 values near z (normal range, clamped for tiny z). */
const ulpF32 = (z: number) => 2 ** (Math.floor(Math.log2(Math.max(z, 1e-38))) - 23);

type Scheme = { key: string; en: string; col: string; dash?: string; step: (d: number, n: number, f: number) => number };
const SCHEMES: Scheme[] = [
  { key: "d16", en: "D16_UNORM", col: C.pink, step: () => 1 / 65535 },
  { key: "d24", en: "D24_UNORM", col: C.amber, step: () => 1 / 16777215 },
  { key: "d32", en: "D32_SFLOAT", col: C.sky, dash: "6 4", step: (d, n, f) => ulpF32(zStd(d, n, f)) },
  { key: "rev", en: "D32_SFLOAT, reversed Z", col: C.green, step: (d, n, f) => ulpF32(zRev(d, n, f)) },
];
const slope = (d: number, n: number, f: number) => (f * n) / ((f - n) * d * d);    // |dz/dd|, same for both directions
const resolve = (s: Scheme, d: number, n: number, f: number) => s.step(d, n, f) / slope(d, n, f);

export function DepthPrecisionFigure({ t }: { t?: TrackTranslations }) {
  const [nearL, setNearL] = useState(-1);          // log10 of the near plane
  const [farL, setFarL] = useState(3);             // log10 of the far plane
  const [probeT, setProbeT] = useState(0.7);       // probe position along the log axis
  const [gapL, setGapL] = useState(-2);            // log10 of the gap between two surfaces
  const L = (k: string, en: string) => tx(t, `figVkPrec_${k}`, en);

  const n = 10 ** nearL, f = 10 ** farL, gap = 10 ** gapL;
  const lx0 = nearL, lx1 = farL;
  const X = (ld: number) => PL + ((ld - lx0) / (lx1 - lx0)) * (W - PL - PR);
  const Y = (lv: number) => PT + ((YMAX - Math.max(YMIN, Math.min(YMAX, lv))) / (YMAX - YMIN)) * (H - PT - PB);
  const dProbe = 10 ** (lx0 + probeT * (lx1 - lx0));

  const path = (s: Scheme) => {
    const pts: string[] = [];
    for (let k = 1; k < 200; k++) {
      const ld = lx0 + (k / 200) * (lx1 - lx0), d = 10 ** ld;
      pts.push(`${k === 1 ? "M" : "L"}${X(ld).toFixed(1)},${Y(Math.log10(resolve(s, d, n, f))).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const fmt = (v: number) => (v >= 1 ? v.toPrecision(3) : v >= 1e-3 ? v.toFixed(4) : v.toExponential(1));

  return (
    <Figure
      title={L("title", "Depth precision: the smallest gap that still sorts")}
      controls={<>
        <Sliders>
          <Slider label={`near n = ${fmt(n)}`} value={nearL} min={-2} max={0} step={0.1} onChange={setNearL} fmt={() => ""} width="w-28" />
          <Slider label={`far f = ${fmt(f)}`} value={farL} min={1} max={5} step={0.1} onChange={setFarL} fmt={() => ""} width="w-28" />
          <Slider label={`d = ${fmt(dProbe)}`} value={probeT} min={0.02} max={0.98} step={0.01} onChange={setProbeT} fmt={() => ""} width="w-28" />
          <Slider label={`${L("gap", "gap")} = ${fmt(gap)}`} value={gapL} min={-5} max={1} step={0.1} onChange={setGapL} fmt={() => ""} width="w-28" />
        </Sliders>
        <Row>
          <Readout>z = {zStd(dProbe, n, f).toFixed(7)}</Readout>
          <Readout>{L("zRev", "reversed")} z = {zRev(dProbe, n, f).toPrecision(4)}</Readout>
          {SCHEMES.map(s => {
            const r = resolve(s, dProbe, n, f);
            return <Readout key={s.key} color={r > gap ? C.red : s.col}>{L(s.key, s.en)}: Δd = {fmt(r)} {r > gap ? L("fight", "z-fights") : "✓"}</Readout>;
          })}
        </Row>
      </>}
      note={L("note", "x is the distance from the camera, y the smallest separation Δd two surfaces need for their depths to differ, both on log scales. Every standard curve rises with d², because the perspective depth z = f(d − n) / ((f − n) d) spends half its range between n and 2n. D16 and D24 have evenly spaced values, so their Δd follows that curve. A standard float is dense near 0 and sparse near 1, exactly where distant surfaces are, so D32_SFLOAT is no better than D24 far away. Reversed Z stores 1 − z: now the far surfaces get the values near 0, where floats are dense, and the two effects cancel into an almost flat curve. Push the near plane out: every curve drops, because n is in the slope.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {Array.from({ length: YMAX - YMIN + 1 }, (_, k) => YMIN + k).map(e => (
          <g key={e}>
            <line x1={PL} x2={W - PR} y1={Y(e)} y2={Y(e)} stroke={C.grid} strokeWidth={0.6} />
            <T x={PL - 6} y={Y(e) + 3} size={7.5} anchor="end">{`1e${e}`}</T>
          </g>
        ))}
        {Array.from({ length: Math.floor(lx1) - Math.ceil(lx0) + 1 }, (_, k) => Math.ceil(lx0) + k).map(e => (
          <g key={e}>
            <line x1={X(e)} x2={X(e)} y1={PT} y2={H - PB} stroke={C.grid} strokeWidth={0.6} />
            <T x={X(e)} y={H - PB + 13} size={7.5} anchor="middle">{`1e${e}`}</T>
          </g>
        ))}
        <T x={(PL + W - PR) / 2} y={H - 4} size={8} anchor="middle">{L("xAxis", "distance d from the camera")}</T>
        <T x={4} y={PT + 4} size={8}>Δd</T>
        <line x1={PL} x2={W - PR} y1={Y(gapL)} y2={Y(gapL)} stroke={C.red} strokeWidth={1} strokeDasharray="5 4" />
        <T x={W - PR - 4} y={Y(gapL) - 4} size={7.5} anchor="end" color={C.red}>{L("gapLine", "gap between two surfaces")}</T>
        {/* D32 is dashed: far away it lies exactly on top of D24 */}
        {SCHEMES.map(s => <path key={s.key} d={path(s)} fill="none" stroke={s.col} strokeWidth={2} strokeDasharray={s.dash} />)}
        <line x1={X(Math.log10(dProbe))} x2={X(Math.log10(dProbe))} y1={PT} y2={H - PB} stroke={C.fg} strokeWidth={1} strokeDasharray="2 3" />
        {SCHEMES.map((s, i) => (
          <g key={s.key}>
            <line x1={PL + 8} x2={PL + 22} y1={PT + 7.5 + i * 13} y2={PT + 7.5 + i * 13} stroke={s.col} strokeWidth={3} strokeDasharray={s.dash ? "4 2" : undefined} />
            <T x={PL + 25} y={PT + 10 + i * 13} size={8} color={C.fg}>{L(s.key, s.en)}</T>
          </g>
        ))}
      </svg>
    </Figure>
  );
}
