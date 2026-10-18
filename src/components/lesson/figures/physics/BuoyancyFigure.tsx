"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, C, T, Vec, f2, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A cube 20 cm on a side hangs from a spring scale over a tank. The slider
// lowers the scale. As the cube goes in, it pushes liquid aside and the
// liquid pushes back up with the buoyant force B = ρ_liquid g V_under
// (Archimedes), where V_under is the part of the cube below the surface. The
// scale reads what is left of the weight, T = W − B. A cube less dense than
// the liquid stops sinking when B = W: it floats with the fraction
// ρ_object / ρ_liquid of itself under the surface, and the string goes slack.
// Once the cube is fully under, lowering it further changes nothing: the
// liquid pushes harder on the bottom face, but just as much harder on the top.
// "break it: buoyancy grows with depth" lets B keep growing as the cube goes
// deeper, the common wrong guess; the scale reading would keep falling and
// even a block of aluminium would eventually be pushed back up.

const W = 560, H = 300;
const G = 9.81, A = 0.2, PX = 200;                    // cube side (m), px per metre
const TX0 = 200, TX1 = 440, FLOOR = 288, SURF = 128;  // tank walls, floor and resting surface (y px)
const CX = 320, TANK_AREA = 0.6;                       // cube centre x; tank cross-section (m²)
const NPX = 0.2;                                      // px per newton for the arrows
const OBJECTS = { cork: 240, wood: 500, ice: 917, aluminium: 2700 } as const;
const LIQUIDS = { water: 1000, sea: 1025, mercury: 13600 } as const;
type Obj = keyof typeof OBJECTS;
type Liq = keyof typeof LIQUIDS;

export function BuoyancyFigure({ t }: { t?: TrackTranslations }) {
  const [d, setD] = useState(-0.15);                  // depth of the cube's bottom face set by the scale (m)
  const [obj, setObj] = useState<Obj>("aluminium");
  const [liq, setLiq] = useState<Liq>("water");
  const [broken, setBroken] = useState(false);
  const rhoO = OBJECTS[obj], rhoL = LIQUIDS[liq];

  const weight = rhoO * G * A ** 3;
  const floatDepth = rhoO < rhoL ? (A * rhoO) / rhoL : Infinity;
  const floating = !broken && d > floatDepth;
  const depth = floating ? floatDepth : d;              // where the bottom face really is
  const under = clamp(depth, 0, A);
  const B = broken ? rhoL * G * A * A * Math.max(0, depth) : rhoL * G * A * A * under;
  const tension = weight - B;
  const rise = ((A * A * under) / TANK_AREA) * PX;      // the surface climbs as liquid is pushed aside

  const surf = SURF - rise;
  const bottomY = SURF + depth * PX, topY = bottomY - A * PX, half = (A * PX) / 2;
  const fill = liq === "mercury" ? "#a8b3c2" : C.sky;
  const objColor = { cork: "#c08552", wood: "#a0703c", ice: "#cfe8f5", aluminium: "#9aa5b1" }[obj];
  const slack = floating || tension < 0;

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* the scale */}
      <line x1={CX} y1={0} x2={CX} y2={10} stroke={C.fg} />
      <rect x={CX - 26} y={10} width={52} height={30} rx={4} fill={C.bg} stroke={C.fg} />
      <T x={CX} y={29} anchor="middle" color={slack ? C.muted : C.amber} size={10} bold>{`${f2(Math.max(0, tension), 1)} N`}</T>
      {slack
        ? <path d={`M${CX},40 C${CX + 18},${(40 + topY) / 2 - 10} ${CX - 18},${(40 + topY) / 2 + 10} ${CX},${topY}`} fill="none" stroke={C.muted} strokeDasharray="3 2" />
        : <line x1={CX} y1={40} x2={CX} y2={topY} stroke={C.fg} />}

      {/* tank and liquid */}
      <rect x={TX0} y={surf} width={TX1 - TX0} height={FLOOR - surf} fill={fill} opacity={0.3} />
      <line x1={TX0} y1={surf} x2={TX1} y2={surf} stroke={fill} strokeWidth={1.5} />
      <path d={`M${TX0},${SURF - 70} L${TX0},${FLOOR} L${TX1},${FLOOR} L${TX1},${SURF - 70}`} fill="none" stroke={C.fg} strokeWidth={1.8} />

      {/* cube, with the part under the surface outlined */}
      <rect x={CX - half} y={topY} width={2 * half} height={2 * half} fill={objColor} stroke={C.fg} strokeWidth={1} />
      {under > 0 && <rect x={CX - half} y={Math.max(topY, surf)} width={2 * half} height={bottomY - Math.max(topY, surf)} fill="none" stroke={C.sky} strokeWidth={2} strokeDasharray="4 2" />}

      {/* forces, drawn from the cube's centre */}
      <Vec a={{ x: CX - 60, y: (topY + bottomY) / 2 }} b={{ x: CX - 60, y: (topY + bottomY) / 2 + weight * NPX }} color={C.red} w={2.5} />
      <T x={CX - 66} y={(topY + bottomY) / 2 + weight * NPX + 12} anchor="middle" color={C.red} size={8.5}>{`W ${f2(weight, 0)} N`}</T>
      {B > 0.05 && <>
        <Vec a={{ x: CX + 60, y: (topY + bottomY) / 2 }} b={{ x: CX + 60, y: (topY + bottomY) / 2 - B * NPX }} color={broken && depth > A ? C.red : C.sky} w={2.5} />
        <T x={CX + 66} y={(topY + bottomY) / 2 - B * NPX - 5} anchor="middle" color={broken && depth > A ? C.red : C.sky} size={8.5}>{`B ${f2(B, 0)} N`}</T>
      </>}

      <T x={14} y={H - 30} color={C.muted} size={8.5}>{`${tx(t, "figPhBuoy_under", "under the surface")}: ${f2((100 * under) / A, 0)}%`}</T>
      {floating && <T x={14} y={H - 16} color={C.green} size={8.5} bold>{`${tx(t, "figPhBuoy_floats", "it floats")}: ρ_obj / ρ_liq = ${f2(rhoO / rhoL, 2)}`}</T>}
      {broken && depth > A && <T x={TX1 + 8} y={FLOOR - 4} color={C.red} size={8}>{tx(t, "figPhBuoy_wrong", "B still growing?")}</T>}
      {broken && tension < 0 && <T x={14} y={H - 16} color={C.red} size={8.5} bold>{tx(t, "figPhBuoy_up", "B > W: pushed back up")}</T>}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhBuoy_title", "Weighing a block under water")}
      head={<Btn active={broken} onClick={() => setBroken(b => !b)}>{tx(t, "figPhBuoy_broken", "break it: buoyancy grows with depth")}</Btn>}
      controls={<>
        <Slider label={tx(t, "figPhBuoy_lower", "lower the scale")} value={d} min={-0.3} max={0.6} step={0.01} onChange={setD} fmt={v => `${f2(v * 100, 0)} cm`} width="w-32" />
        <Row>
          <Choice value={obj} onChange={setObj} options={[
            ["cork", tx(t, "figPhBuoy_cork", "cork")],
            ["wood", tx(t, "figPhBuoy_wood", "pine")],
            ["ice", tx(t, "figPhBuoy_ice", "ice")],
            ["aluminium", tx(t, "figPhBuoy_al", "aluminium")],
          ]} />
        </Row>
        <Row>
          <Choice value={liq} onChange={setLiq} options={[
            ["water", tx(t, "figPhBuoy_water", "fresh water")],
            ["sea", tx(t, "figPhBuoy_sea", "sea water")],
            ["mercury", tx(t, "figPhBuoy_hg", "mercury")],
          ]} />
          <Readout>{`ρ = ${rhoO} / ${rhoL} kg/m³`}</Readout>
          <Readout color={C.amber}>{`${tx(t, "figPhBuoy_reading", "scale")} = W − B = ${f2(Math.max(0, tension), 1)} N`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhBuoy_note", "Lower the aluminium cube into the water. As soon as it touches, the reading starts to fall: the water pushes up on it. Fully under, the scale shows 212 − 78.5 = 133 N, and lowering further changes nothing. The cube has pushed aside 8 litres of water, which weigh 78 N: that is the buoyant force, as Archimedes said. Try pine or ice: the reading drops to zero before the cube is fully under, the string goes slack and the block floats, with exactly the fraction ρ_obj / ρ_liq of itself submerged (92% for ice: the iceberg rule). Put the aluminium in mercury and it floats too. Then break it: if buoyancy kept growing with depth, a deep enough tank would push any metal back up, which never happens.")}>
      {view}
    </Figure>
  );
}
