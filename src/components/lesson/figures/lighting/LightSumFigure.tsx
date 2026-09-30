"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, C, T, Handle, useDrag, nearest, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Four point lights hanging half a metre above a 20 m floor, seen from the
// side. Each curve is one light's diffuse contribution along the floor:
// intensity × attenuation(d) × (N·L). The thick curve is their sum, which is
// what the multi-light shader computes for every fragment. The strip below is
// what the screen shows: the sum clipped to 1. The dashed brackets mark each
// light's radius, where its contribution drops below 5/256; a renderer that
// culls lights by radius only evaluates the lights whose bracket covers the
// fragment.

const W = 620, H = 250, X0 = 20, X1 = 600, FLOOR = 170, TOP = 28, HANDLE_Y = 12;   // the lamps hang above the plot
const LEN = 20, HEIGHT = 0.5;
const px = (x: number) => X0 + (x / LEN) * (X1 - X0);
const py = (v: number, vmax: number) => FLOOR - (Math.min(v, vmax) / vmax) * (FLOOR - TOP - 10);
const COLS = [C.amber, C.sky, C.pink, C.green];
type Range = "7" | "13" | "20";
const ATT: Record<Range, [number, number, number]> = { "7": [1, 0.7, 1.8], "13": [1, 0.35, 0.44], "20": [1, 0.22, 0.2] };

/** Distance at which I / (c + l·d + q·d²) falls to 5/256. */
function radius(I: number, [c, l, q]: [number, number, number]) {
  const k = c - (256 / 5) * I;
  return k >= 0 ? 0 : (-l + Math.sqrt(l * l - 4 * q * k)) / (2 * q);
}

export function LightSumFigure({ t }: { t?: TrackTranslations }) {
  const [xs, setXs] = useState([3, 4.5, 11, 17]);          // lamps 1 and 2 close enough to overlap and clip
  const [on, setOn] = useState([true, true, true, false]);
  const [I, setI] = useState(2);
  const [range, setRange] = useState<Range>("7");
  const [ambient, setAmbient] = useState(false);
  const L = (k: string, en: string) => tx(t, `figLsum_${k}`, en);
  const [c, l, q] = ATT[range];

  const contrib = (i: number, x: number) => {
    const d = Math.hypot(x - xs[i], HEIGHT);
    return (I / (c + l * d + q * d * d)) * (HEIGHT / d);   // intensity · attenuation · N·L (floor normal is up)
  };
  const nOn = on.filter(Boolean).length;
  const amb = ambient ? 0.05 * nOn : 0;
  const SAMPLES = 200;
  const xsS = Array.from({ length: SAMPLES + 1 }, (_, k) => (k / SAMPLES) * LEN);
  const sum = xsS.map(x => amb + on.reduce((s, o, i) => s + (o ? contrib(i, x) : 0), 0));
  const vmax = Math.max(1.4, ...sum) * 1.05;
  const r = radius(I, ATT[range]);
  const reach = xsS.map(x => on.filter((o, i) => o && Math.hypot(x - xs[i], HEIGHT) < r).length);
  const avgReach = reach.reduce((a, b) => a + b, 0) / reach.length;
  const clippedFrac = sum.filter(v => v > 1).length / sum.length;

  const handles: ["0" | "1" | "2" | "3", { x: number; y: number }][] = xs.map((x, i) => [`${i}` as "0", { x: px(x), y: HANDLE_Y }]);
  const drag = useDrag<"0" | "1" | "2" | "3">(
    p => nearest(p, handles.filter(([k]) => on[+k]), 20),
    (k, p) => setXs(v => v.map((x, i) => (i === +k ? Math.min(LEN, Math.max(0, ((p.x - X0) / (X1 - X0)) * LEN)) : x))),
  );
  const path = (vals: number[]) => vals.map((v, k) => `${k ? "L" : "M"}${px(xsS[k]).toFixed(1)},${py(v, vmax).toFixed(1)}`).join("");

  return (
    <Figure
      title={L("title", "Adding lights along a floor")}
      head={<>
        {on.map((o, i) => <Btn key={i} active={o} onClick={() => setOn(v => v.map((x, j) => (j === i ? !x : x)))}>
          <span style={{ color: COLS[i] }}>●</span> {i + 1}
        </Btn>)}
        <Btn active={ambient} onClick={() => setAmbient(v => !v)}>{ambient ? "☑" : "☐"} {L("ambient", "0.05 ambient per light")}</Btn>
      </>}
      controls={<>
        <Slider label={L("intensity", "intensity")} value={I} min={0.2} max={4} step={0.05} onChange={setI} />
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{L("range", "attenuation for range")}</span>
          <Choice value={range} onChange={setRange} options={[["7", "7 m"], ["13", "13 m"], ["20", "20 m"]] as const} />
        </Row>
        <Row>
          <Readout>(c, l, q) = ({c}, {l}, {q})</Readout>
          <Readout color={C.purple}>{L("radius", "radius")} {f2(r, 2)} m</Readout>
          <Readout>{L("forward", "lights evaluated per fragment")} {nOn}</Readout>
          <Readout color={C.green}>{L("culled", "with radius culling, on average")} {f2(avgReach, 2)}</Readout>
          <Readout color={clippedFrac > 0 ? C.red : C.muted}>{L("clipped", "floor clipped at 1")} {Math.round(clippedFrac * 100)}%</Readout>
        </Row>
      </>}
      note={L("note", "Drag the lamps along the floor and switch them on and off. Where two lamps are close their curves overlap and the sum rises above 1: the strip goes flat white there (clipping), and details in that region are lost; HDR rendering, later, keeps those values instead. Each lamp's own curve peaks right under it (N·L = 1 and the shortest distance) and falls off with both the attenuation and the slanting angle. The radius is where one lamp's contribution drops below 5/256, too little to change an 8-bit pixel much: with range 7 and intensity 2 it is about 7.3 m (6.3 m at intensity 1.5), so a fragment at one end of the floor never needs the lamps at the other end. The ambient option adds 0.05 per lamp everywhere, even in the dark gaps between the lamps.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <line x1={X0} x2={X1} y1={py(1, vmax)} y2={py(1, vmax)} stroke={C.red} strokeDasharray="4 3" strokeWidth={1} />
        <T x={X1} y={py(1, vmax) - 4} size={8} anchor="end" color={C.red}>1.0</T>
        {on.map((o, i) => o && <g key={i}>
          <path d={path(xsS.map(x => contrib(i, x)))} fill="none" stroke={COLS[i]} strokeWidth={1.3} strokeOpacity={0.9} />
          <line x1={px(Math.max(0, xs[i] - r))} x2={px(Math.min(LEN, xs[i] + r))} y1={FLOOR + 8 + i * 4} y2={FLOOR + 8 + i * 4} stroke={COLS[i]} strokeDasharray="3 2" strokeWidth={1.5} />
        </g>)}
        <path d={path(sum)} fill="none" stroke={C.fg} strokeWidth={2.4} />
        <line x1={X0} x2={X1} y1={FLOOR} y2={FLOOR} stroke={C.axis} strokeWidth={1.5} />
        {xsS.slice(0, -1).map((x, k) => <rect key={k} x={px(x)} y={FLOOR + 26} width={(X1 - X0) / SAMPLES + 0.5} height={14}
          fill={`rgb(${[0.9, 0.85, 0.75].map(a => Math.round(Math.min(1, a * sum[k]) ** (1 / 2.2) * 255)).join(",")})`} />)}
        {[0, 5, 10, 15, 20].map(x => <T key={x} x={px(x)} y={H - 4} size={8} anchor="middle">{x} m</T>)}
        {on.map((o, i) => o && <g key={`h${i}`}>
          <line x1={px(xs[i])} x2={px(xs[i])} y1={HANDLE_Y + 6} y2={FLOOR} stroke={COLS[i]} strokeOpacity={0.25} strokeDasharray="2 3" />
          <Handle x={px(xs[i])} y={HANDLE_Y} color={COLS[i]} active={drag.dragging === `${i}`} />
        </g>)}
      </svg>
    </Figure>
  );
}
