"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// One mole of a monatomic ideal gas (γ = 5/3) taken round a Carnot cycle,
// drawn on a pressure–volume diagram:
//   1→2 isothermal expansion at T_hot: the gas takes heat Q_h = nRT_h ln(V₂/V₁)
//   2→3 adiabatic expansion (no heat): it cools to T_cold, V₃ = V₂ (T_h/T_c)^(3/2)
//   3→4 isothermal compression at T_cold: it gives heat Q_c = nRT_c ln(V₃/V₄)
//   4→1 adiabatic compression back to the start.
// The work done in one cycle is the area enclosed (W = Q_h − Q_c), and the
// efficiency W/Q_h comes out as 1 − T_c/T_h, whatever the expansion ratio.
// "break it: no cold reservoir" tries to return along the hot isotherm
// instead: the path encloses no area, all the work done by the gas on the way
// out must be put back on the way in, and the net work is zero. To turn heat
// into work in a cycle, some heat must be dumped into something colder.

const W = 560, H = 300;
const R = 8.314, GAMMA = 5 / 3, V1 = 0.01;           // m³
const GX0 = 250, GX1 = 545, GY0 = 255, GY1 = 25;

export function CycleFigure({ t }: { t?: TrackTranslations }) {
  const [th, setTh] = useState(600);
  const [tc, setTc] = useState(300);
  const [ratio, setRatio] = useState(2);
  const [broken, setBroken] = useState(false);
  const [u, setU] = useState(0);                      // progress round the cycle, 0…4
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  useFrame(playing && vis.on, dt => setU(v => (v + dt * 0.5) % 4));

  const k = (th / tc) ** (1 / (GAMMA - 1));
  const V2 = V1 * ratio, V3 = V2 * k, V4 = V1 * k;
  const p = (V: number, T: number) => (R * T) / V;
  // each leg: start/end volume and the pressure along it
  const legs = broken
    ? [
        { a: V1, b: V2, P: (V: number) => p(V, th) },
        { a: V2, b: V2, P: (V: number) => p(V, th) },
        { a: V2, b: V1, P: (V: number) => p(V, th) },
        { a: V1, b: V1, P: (V: number) => p(V, th) },
      ]
    : [
        { a: V1, b: V2, P: (V: number) => p(V, th) },
        { a: V2, b: V3, P: (V: number) => p(V2, th) * (V2 / V) ** GAMMA },
        { a: V3, b: V4, P: (V: number) => p(V, tc) },
        { a: V4, b: V1, P: (V: number) => p(V4, tc) * (V4 / V) ** GAMMA },
      ];
  const vMax = (broken ? V2 : V3) * 1.08, pMax = p(V1, th) * 1.1;
  const gx = (V: number) => GX0 + (V / vMax) * (GX1 - GX0);
  const gy = (P: number) => GY0 - (P / pMax) * (GY0 - GY1);
  const along = (leg: typeof legs[0], s: number) => leg.a * (leg.b / leg.a) ** s;
  const path = legs.map((leg, i) => Array.from({ length: 41 }, (_, j) => {
    const V = along(leg, j / 40); return `${i === 0 && j === 0 ? "M" : "L"}${gx(V).toFixed(1)},${gy(leg.P(V)).toFixed(1)}`;
  }).join("")).join("");

  const leg = Math.floor(u) % 4, s = u - Math.floor(u);
  const Vnow = along(legs[leg], s), Pnow = legs[leg].P(Vnow);
  const Qh = R * th * Math.log(ratio), Qc = broken ? Qh : R * tc * Math.log(ratio);
  const Wnet = Qh - Qc, eff = Wnet / Qh;
  const legText = broken
    ? [tx(t, "figPhCyc_b1", "1→2 expansion at T_hot: heat in, work out"), "", tx(t, "figPhCyc_b3", "2→1 compression at T_hot: the same work put back, the same heat given back"), ""][leg]
    : [tx(t, "figPhCyc_l1", "1→2 isothermal expansion: heat Q_h flows in from the hot reservoir"),
       tx(t, "figPhCyc_l2", "2→3 adiabatic expansion: no heat; the gas cools to T_cold"),
       tx(t, "figPhCyc_l3", "3→4 isothermal compression: heat Q_c flows out to the cold reservoir"),
       tx(t, "figPhCyc_l4", "4→1 adiabatic compression: no heat; the gas warms back to T_hot")][leg];
  const BAR = 150, bmax = Qh;

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* reservoirs and the gas */}
      <rect x={20} y={30} width={150} height={34} rx={4} fill={C.red} opacity={leg === 0 ? 0.85 : 0.3} />
      <T x={95} y={51} anchor="middle" color="#fff" size={9} bold>{`${tx(t, "figPhCyc_hot", "hot")} ${th} K`}</T>
      <rect x={20} y={150} width={150} height={34} rx={4} fill={C.blue} opacity={leg === 2 && !broken ? 0.85 : 0.3} />
      <T x={95} y={171} anchor="middle" color="#fff" size={9} bold>{broken ? tx(t, "figPhCyc_none", "no cold reservoir") : `${tx(t, "figPhCyc_cold", "cold")} ${tc} K`}</T>
      <rect x={60} y={86} width={70} height={42} rx={3} fill="none" stroke={C.fg} />
      <rect x={60 + 70 * (Vnow / vMax)} y={84} width={4} height={46} fill={C.muted} />
      <rect x={60} y={86} width={70 * (Vnow / vMax)} height={42} fill={C.amber} opacity={0.25} />
      <T x={95} y={142} anchor="middle" color={C.muted} size={8}>{`${f2(Pnow / 1000, 0)} kPa, ${f2(Vnow * 1000, 1)} L`}</T>

      {/* energy bars */}
      {[[Qh, C.red, "Q_h"], [Wnet, C.green, "W"], [Qc, C.blue, "Q_c"]].map(([q, col, lab], i) => <g key={i}>
        <T x={20} y={214 + i * 22} color={col as string} size={8.5}>{lab as string}</T>
        <rect x={50} y={205 + i * 22} width={((q as number) / bmax) * BAR} height={11} fill={col as string} opacity={0.8} />
        <T x={56 + ((q as number) / bmax) * BAR} y={214 + i * 22} color={col as string} size={8}>{`${f2((q as number) / 1000, 2)} kJ`}</T>
      </g>)}

      {/* p–V diagram */}
      <line x1={GX0} y1={GY0} x2={GX1} y2={GY0} stroke={C.axis} />
      <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke={C.axis} />
      <T x={GX1} y={GY0 + 14} anchor="end" color={C.muted} size={8}>{tx(t, "figPhCyc_V", "volume V")}</T>
      <T x={GX0 + 4} y={GY1 + 4} color={C.muted} size={8}>{tx(t, "figPhCyc_p", "pressure p")}</T>
      <path d={path + "Z"} fill={C.green} opacity={0.18} />
      <path d={path} fill="none" stroke={C.fg} strokeWidth={1.6} />
      {!broken && [[V1, th, "1"], [V2, th, "2"], [V3, tc, "3"], [V4, tc, "4"]].map(([V, T_, n]) => (
        <T key={n as string} x={gx(V as number) + 5} y={gy(p(V as number, T_ as number)) - 5} color={C.muted} size={9}>{n as string}</T>
      ))}
      <circle cx={gx(Vnow)} cy={gy(Pnow)} r={5} fill={C.amber} />
      <T x={GX1} y={GY1 + 4} anchor="end" color={C.green} size={8.5}>{tx(t, "figPhCyc_area", "shaded area = net work W")}</T>
      <T x={GX0} y={H - 4} color={broken ? C.red : C.amber} size={8.5}>{legText}</T>
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhCyc_title", "The Carnot engine")}
      head={<Btn active={broken} onClick={() => { setBroken(b => !b); setU(0); }}>{tx(t, "figPhCyc_broken", "break it: no cold reservoir")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhCyc_th", "hot T_h")} value={th} min={400} max={900} step={10} onChange={setTh} fmt={v => `${v} K`} />
          <Slider label={tx(t, "figPhCyc_tc", "cold T_c")} value={tc} min={200} max={380} step={10} onChange={setTc} fmt={v => `${v} K`} />
          <Slider label={tx(t, "figPhCyc_r", "expansion V₂/V₁")} value={ratio} min={1.5} max={3} step={0.1} onChange={setRatio} fmt={v => `${f2(v, 1)}×`} />
        </Sliders>
        <Row>
          <Readout color={C.green}>{`${tx(t, "figPhCyc_eff", "efficiency")} W/Q_h = ${f2(100 * eff, 1)}%`}</Readout>
          <Readout>{`1 − T_c/T_h = ${broken ? "—" : `${f2(100 * (1 - tc / th), 1)}%`}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhCyc_note", "Press play and follow the gas round the loop. On the top curve it expands while touching the hot reservoir, taking in heat; then, insulated, it expands further and cools; on the bottom curve it is squeezed while touching the cold reservoir and gives heat away; finally, insulated again, it is squeezed back to the start and warms up. The gas does more work expanding (at high pressure) than it takes to compress it (at low pressure): the difference, the shaded area, is the useful work. Change the expansion ratio: the loop and the energies grow, but the efficiency stays at 1 − T_c/T_h. Only the temperatures set it: 600 K and 300 K give 50%. Then break it: with no cold reservoir, the only way back is along the hot curve, the loop has no area, and the engine does no net work at all.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} onReset={() => { setPlaying(false); setU(0); }} />
      </div>
    </Figure>
  );
}
