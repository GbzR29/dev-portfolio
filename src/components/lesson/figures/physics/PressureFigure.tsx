"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, C, T, Handle, useDrag, f2, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Three vessels of very different shapes, joined at the bottom by a pipe and
// filled with the same liquid, 1 m deep. Drag the probe anywhere in the
// liquid: the gauge reads p = p₀ + ρ g h, where h is the depth below the
// surface. Only the depth matters, not the shape of the vessel or how much
// liquid sits above the probe, which is why the levels in connected vessels
// are always equal (the "hydrostatic paradox").
// "break it: pressure = weight ÷ base" uses the tempting rule that the
// pressure at the bottom of each vessel is the weight of all the liquid in it
// divided by its base. The wide vessel would then press harder than the
// others, the liquid would flow along the pipe for ever, and the levels could
// never be level: a perpetual-motion machine, which is why the rule is wrong.

const W = 560, H = 300;
const G = 9.81, P0 = 101.3;                           // kPa
const WL = 70, BOT = 250, CH = 20, PX = 180;          // surface y, vessel bottoms y, pipe height, px per metre
type Pt = [number, number];
// vessel outlines: [top-left, top-right, bottom-right, bottom-left], tops at y = 50
const VESSELS: Pt[][] = [
  [[60, 50], [130, 50], [130, BOT], [60, BOT]],
  [[180, 50], [340, 50], [280, BOT], [240, BOT]],
  [[410, 50], [430, 50], [490, BOT], [470, BOT]],
];
const LIQUIDS = { water: 1000, sea: 1025, oil: 900, mercury: 13600 } as const;
type Liquid = keyof typeof LIQUIDS;

/** x of a vessel's left/right wall at height y (walls are straight lines). */
const wallX = (v: Pt[], side: 0 | 1, y: number) => {
  const top = side ? v[1] : v[0], bot = side ? v[2] : v[3];
  return top[0] + ((y - top[1]) / (bot[1] - top[1])) * (bot[0] - top[0]);
};
const inside = (x: number, y: number) =>
  (y >= WL && y <= BOT && VESSELS.some(v => x >= wallX(v, 0, y) && x <= wallX(v, 1, y))) ||
  (y >= BOT && y <= BOT + CH && x >= 60 && x <= 490);

export function PressureFigure({ t }: { t?: TrackTranslations }) {
  const [probe, setProbe] = useState<{ x: number; y: number }>({ x: 95, y: 200 });
  const [liquid, setLiquid] = useState<Liquid>("water");
  const [broken, setBroken] = useState(false);
  const rho = LIQUIDS[liquid];

  const drag = useDrag<"p">(
    p => (Math.hypot(p.x - probe.x, p.y - probe.y) < 18 ? "p" : null),
    (_k, p) => {
      const x = clamp(p.x, 40, 520), y = clamp(p.y, WL, BOT + CH - 2);
      if (inside(x, y)) setProbe({ x, y });
    });

  const h = (probe.y - WL) / PX;
  const pg = (rho * G * h) / 1000, pAbs = P0 + pg;

  // broken rule: bottom pressure of each vessel = weight of its liquid ÷ its base
  const area = (v: Pt[]) => {                                   // liquid area below the surface, px²
    const wTop = wallX(v, 1, WL) - wallX(v, 0, WL), wBot = v[2][0] - v[3][0];
    return ((wTop + wBot) / 2) * (BOT - WL);
  };
  const wrongBottom = VESSELS.map(v => (rho * G * (area(v) / (v[2][0] - v[3][0])) / PX) / 1000);
  const rightBottom = (rho * G * ((BOT - WL) / PX)) / 1000;

  const poly = (v: Pt[]) => {
    const pts = [[wallX(v, 0, WL), WL], [wallX(v, 1, WL), WL], v[2], v[3]];
    return pts.map(p => p.join(",")).join(" ");
  };
  const fill = liquid === "mercury" ? "#a8b3c2" : liquid === "oil" ? C.amber : C.sky;

  const view = (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <rect x={60} y={BOT} width={430} height={CH} fill={fill} opacity={0.35} />
      {VESSELS.map((v, i) => <polygon key={i} points={poly(v)} fill={fill} opacity={0.35} />)}
      {VESSELS.map((v, i) => <g key={`w${i}`}>
        <line x1={v[0][0]} y1={v[0][1]} x2={v[3][0]} y2={v[3][1]} stroke={C.fg} strokeWidth={1.5} />
        <line x1={v[1][0]} y1={v[1][1]} x2={v[2][0]} y2={v[2][1]} stroke={C.fg} strokeWidth={1.5} />
      </g>)}
      <path d={`M60,${BOT} L60,${BOT + CH} L490,${BOT + CH} L490,${BOT}`} fill="none" stroke={C.fg} strokeWidth={1.5} />
      {[[130, 240], [280, 470]].map(([a, b], i) => <line key={i} x1={a} y1={BOT} x2={b} y2={BOT} stroke={C.fg} strokeWidth={1.5} />)}
      <line x1={30} y1={WL} x2={530} y2={WL} stroke={C.green} strokeDasharray="4 4" opacity={0.7} />
      <T x={530} y={38} anchor="end" color={C.green} size={8}>{tx(t, "figPhPres_level", "same level in every vessel")}</T>

      {/* the probe and its depth */}
      <line x1={probe.x} y1={WL} x2={probe.x} y2={probe.y} stroke={C.amber} strokeDasharray="2 3" />
      <T x={probe.x + 6} y={(WL + probe.y) / 2 + 3} color={C.amber} size={8.5}>{`h = ${f2(h, 2)} m`}</T>
      <Handle x={probe.x} y={probe.y} color={C.amber} r={5} active={drag.dragging === "p"} />

      {broken && <>
        {VESSELS.map((v, i) => <T key={i} x={(v[2][0] + v[3][0]) / 2} y={BOT + CH + 13} anchor="middle" color={C.red} size={8} bold>{`${f2(wrongBottom[i], 1)} kPa`}</T>)}
        <path d={`M245,${BOT + 10} L150,${BOT + 10}`} stroke={C.red} strokeWidth={2} />
        <polygon points={`142,${BOT + 10} 152,${BOT + 6} 152,${BOT + 14}`} fill={C.red} />
        <path d={`M285,${BOT + 10} L440,${BOT + 10}`} stroke={C.red} strokeWidth={2} />
        <polygon points={`448,${BOT + 10} 438,${BOT + 6} 438,${BOT + 14}`} fill={C.red} />
        <T x={280} y={H - 4} anchor="middle" color={C.red} size={8.5}>{tx(t, "figPhPres_wrong", "the liquid would flow from the wide vessel for ever: impossible")}</T>
      </>}
      {!broken && <T x={280} y={H - 4} anchor="middle" color={C.muted} size={8.5}>{`${tx(t, "figPhPres_bottom", "pressure at every bottom")}: ${f2(P0 + rightBottom, 1)} kPa`}</T>}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhPres_title", "Pressure depends only on depth")}
      head={<Btn active={broken} onClick={() => setBroken(b => !b)}>{tx(t, "figPhPres_broken", "break it: pressure = weight ÷ base")}</Btn>}
      controls={<>
        <Row>
          <Choice value={liquid} onChange={setLiquid} options={[
            ["water", tx(t, "figPhPres_water", "fresh water")],
            ["sea", tx(t, "figPhPres_sea", "sea water")],
            ["oil", tx(t, "figPhPres_oil", "oil")],
            ["mercury", tx(t, "figPhPres_hg", "mercury")],
          ]} />
        </Row>
        <Row>
          <Readout>{`ρ = ${rho} kg/m³`}</Readout>
          <Readout color={C.amber}>{`ρ g h = ${f2(pg, 2)} kPa`}</Readout>
          <Readout color={C.sky}>{`p = p₀ + ρ g h = ${f2(pAbs, 2)} kPa`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhPres_note", "Drag the amber probe around. Its gauge only cares how far below the surface it is: at the same depth it reads the same in the narrow tube, the wide funnel and the slanted pipe, even though very different amounts of liquid sit above it. Every metre of water adds 9.8 kPa, almost a tenth of the air pressure p₀ pressing on the surface. Switch to mercury, 13.6 times denser: the same depth now adds 13.6 times the pressure. Then break it: if the bottom pressure were the weight of each vessel's liquid divided by its base, the funnel would press harder than its neighbours, liquid would rush along the pipe and never stop. Connected vessels always settle at one level, so pressure must depend on depth alone.")}>
      {view}
    </Figure>
  );
}
