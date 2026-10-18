"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A mass m of ice at −20 °C heated by a heater of steady power P, until it is
// steam at 120 °C. The graph plots temperature against the heat put in (and
// so against time, t = Q/P). On the sloped stretches the heat raises the
// temperature, Q = m c ΔT, at a rate set by the specific heat c of ice, water
// or steam. On the flat stretches the temperature stops: all the heat goes
// into melting (latent heat L_f = 334 kJ/kg) or boiling (L_v = 2 256 kJ/kg).
// The bar below splits the total heat between the five stages: boiling alone
// takes almost three quarters. The run is shown speeded up; the readout gives
// the real time with the chosen heater.
// "break it: no latent heat" draws the wrong idea that heating always means
// warming: the line would cross 0 °C and 100 °C without a pause, the ice
// would never sit in its meltwater at 0 °C and a pan would never boil steadily.

const W = 560, H = 300;
const C_ICE = 2100, C_WATER = 4186, C_STEAM = 2010, LF = 334000, LV = 2256000;
const GX0 = 230, GX1 = 545, GY0 = 230, GY1 = 30;     // graph: x for Q, y for −20…120 °C

type Stage = { id: string; Q: number; T0: number; T1: number; color: string };

export function HeatingCurveFigure({ t }: { t?: TrackTranslations }) {
  const [m, setM] = useState(1);
  const [P, setP] = useState(1000);
  const [broken, setBroken] = useState(false);
  const [frac, setFrac] = useState(0);                // share of the whole heat already put in
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const stages: Stage[] = [
    { id: "ice", Q: m * C_ICE * 20, T0: -20, T1: 0, color: C.sky },
    { id: "melt", Q: broken ? 0 : m * LF, T0: 0, T1: 0, color: C.teal },
    { id: "water", Q: m * C_WATER * 100, T0: 0, T1: 100, color: C.blue },
    { id: "boil", Q: broken ? 0 : m * LV, T0: 100, T1: 100, color: C.purple },
    { id: "steam", Q: m * C_STEAM * 20, T0: 100, T1: 120, color: C.orange },
  ];
  const total = stages.reduce((s, x) => s + x.Q, 0);
  const label: Record<string, string> = {
    ice: tx(t, "figPhHeat_ice", "warming the ice"), melt: tx(t, "figPhHeat_melt", "melting at 0 °C"),
    water: tx(t, "figPhHeat_water", "warming the water"), boil: tx(t, "figPhHeat_boil", "boiling at 100 °C"),
    steam: tx(t, "figPhHeat_steam", "warming the steam"),
  };

  useFrame(playing && vis.on, dt => {
    if (frac >= 1) { setPlaying(false); return; }
    setFrac(f => Math.min(1, f + dt / 12));
  });

  const Q = frac * total;
  // which stage, and the temperature there
  let acc = 0, cur = stages[0], temp = -20, inStage = 0;
  for (const s of stages) {
    if (Q <= acc + s.Q || s === stages[stages.length - 1]) { cur = s; inStage = s.Q ? Math.min(1, (Q - acc) / s.Q) : 1; temp = s.T0 + (s.T1 - s.T0) * inStage; break; }
    acc += s.Q;
  }
  const gx = (q: number) => GX0 + (q / total) * (GX1 - GX0);
  const gy = (T: number) => GY0 - ((T + 20) / 140) * (GY0 - GY1);
  let line = `M${gx(0)},${gy(-20)}`, a2 = 0;
  for (const s of stages) { a2 += s.Q; line += ` L${gx(a2)},${gy(s.T1)}`; }

  // the beaker: ice cubes shrink while melting; bubbles while boiling; steam above
  const iceLeft = cur.id === "ice" ? 1 : cur.id === "melt" ? 1 - inStage : 0;
  const liquidLeft = cur.id === "boil" ? 1 - inStage : cur.id === "steam" ? 0 : 1;
  const BX = 40, BY = 70, BW = 120, BH = 150;

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* beaker on a heater */}
      <rect x={BX - 10} y={BY + BH + 4} width={BW + 20} height={10} rx={2} fill={C.red} opacity={playing ? 0.85 : 0.4} />
      {(cur.id !== "ice" || iceLeft < 1) && liquidLeft > 0 && (
        <rect x={BX} y={BY + BH - 90 * liquidLeft * (1 - iceLeft * 0.3)} width={BW} height={90 * liquidLeft * (1 - iceLeft * 0.3)} fill={C.blue} opacity={0.35} />
      )}
      {iceLeft > 0 && [0, 1, 2].map(i => {
        const s = 34 * Math.sqrt(iceLeft);
        return <rect key={i} x={BX + 12 + i * 34 + (34 - s) / 2} y={BY + BH - s - 6 - (i % 2) * 22} width={s} height={s} rx={3} fill="#dff1fb" stroke={C.sky} />;
      })}
      {cur.id === "boil" && Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={BX + 12 + ((i * 41) % 96)} cy={BY + BH - 10 - ((frac * 4000 + i * 23) % (80 * liquidLeft + 1))} r={3} fill="none" stroke={C.purple} />
      ))}
      {(cur.id === "boil" || cur.id === "steam") && [0, 1, 2].map(i => (
        <path key={i} d={`M${BX + 25 + i * 35},${BY - 4} q8,-12 0,-24 q-8,-12 0,-24`} fill="none" stroke={C.muted} strokeWidth={2} opacity={0.6} />
      ))}
      <path d={`M${BX},${BY} L${BX},${BY + BH} L${BX + BW},${BY + BH} L${BX + BW},${BY}`} fill="none" stroke={C.fg} strokeWidth={1.8} />
      <T x={BX + BW / 2} y={BY + BH + 30} anchor="middle" color={cur.color} size={9} bold>{label[cur.id]}</T>
      {/* thermometer */}
      <rect x={185} y={40} width={10} height={190} rx={5} fill="none" stroke={C.fg} />
      <rect x={187} y={gy(temp)} width={6} height={230 - gy(temp)} fill={C.red} />
      <T x={190} y={246} anchor="middle" color={C.red} size={9} bold>{`${f2(temp, 1)} °C`}</T>

      {/* graph */}
      <line x1={GX0} y1={GY0} x2={GX1} y2={GY0} stroke={C.axis} />
      <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke={C.axis} />
      {[-20, 0, 50, 100, 120].map(v => <g key={v}>
        <line x1={GX0} y1={gy(v)} x2={GX1} y2={gy(v)} stroke={C.grid} strokeDasharray="2 4" />
        <T x={GX0 - 4} y={gy(v) + 3} anchor="end" color={C.muted} size={7.5}>{`${v}°`}</T>
      </g>)}
      <path d={line} fill="none" stroke={broken ? C.red : C.muted} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.6} />
      <path d={(() => { let d = `M${gx(0)},${gy(-20)}`, q = 0; for (const s of stages) { if (Q <= q) break; const e = Math.min(Q, q + s.Q); const T1 = s.Q ? s.T0 + (s.T1 - s.T0) * ((e - q) / s.Q) : s.T1; d += ` L${gx(e)},${gy(T1)}`; q += s.Q; } return d; })()}
        fill="none" stroke={broken ? C.red : C.amber} strokeWidth={2.2} />
      <circle cx={gx(Q)} cy={gy(temp)} r={4} fill={broken ? C.red : C.amber} />
      <T x={GX1} y={GY0 + 14} anchor="end" color={C.muted} size={8}>{`${tx(t, "figPhHeat_heat", "heat put in")}: ${f2(Q / 1000, 0)} kJ`}</T>
      {/* share of the total heat in each stage */}
      {(() => { let q = 0; return stages.map(s => { const x0 = gx(q); q += s.Q; return s.Q > 0 ? <rect key={s.id} x={x0} y={GY0 + 22} width={gx(q) - x0} height={9} fill={s.color} opacity={0.8} /> : null; }); })()}
      <T x={GX0} y={GY0 + 46} color={C.purple} size={8}>{broken ? tx(t, "figPhHeat_wrong", "no pauses at 0 °C and 100 °C: not what a thermometer shows") : `${tx(t, "figPhHeat_share", "boiling takes")} ${f2((100 * stages[3].Q) / total, 0)}% ${tx(t, "figPhHeat_share2", "of all the heat")}`}</T>
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhHeat_title", "From ice to steam")}
      head={<Btn active={broken} onClick={() => { setBroken(b => !b); setFrac(0); setPlaying(false); }}>{tx(t, "figPhHeat_broken", "break it: no latent heat")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhHeat_m", "mass m")} value={m} min={0.1} max={2} step={0.1} onChange={v => { setM(v); setFrac(0); setPlaying(false); }} fmt={v => `${f2(v, 1)} kg`} />
          <Slider label={tx(t, "figPhHeat_P", "heater power P")} value={P} min={200} max={3000} step={50} onChange={setP} fmt={v => `${v} W`} />
        </Sliders>
        <Row>
          <Readout color={cur.color}>{label[cur.id]}</Readout>
          <Readout>{`${tx(t, "figPhHeat_real", "real time")} t = Q/P = ${f2(Q / P / 60, 1)} min`}</Readout>
          <Readout>{`${tx(t, "figPhHeat_total", "total")} ${f2(total / 1000, 0)} kJ = ${f2(total / P / 60, 0)} min`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhHeat_note", "Press play. The ice warms quickly to 0 °C, and then the thermometer stops: for a long stretch every joule goes into breaking the ice apart, and you see ice and water together at exactly 0 °C. Only when the last cube has melted does the water warm again, more slowly than the ice did, because water's specific heat is twice ice's. At 100 °C the thermometer stops once more, for the longest stretch of all: turning water into steam takes 2 256 kJ per kilogram, more than five times the heat that warmed it from 0 to 100 °C. With a 1 kW heater and 1 kg, that is 38 minutes of boiling. Then break it: without latent heat the temperature would never pause, which every pan of boiling water contradicts.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => { if (frac >= 1) setFrac(0); setPlaying(p => !p); }} onReset={() => { setPlaying(false); setFrac(0); }} />
      </div>
    </Figure>
  );
}
