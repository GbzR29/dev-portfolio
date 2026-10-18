"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, useFrame, useVisible, f2, clamp, mulberry32 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Water flowing through a pipe with a narrow throat (a Venturi tube). What
// goes in must come out, so A v is the same everywhere (continuity): where
// the pipe narrows, the water speeds up, and the tracer dots show it.
// Bernoulli: along the flow p + ½ρv² stays the same, so where the water is
// faster its pressure is lower. Three open tubes stand on the pipe; the
// water climbs each to the height p/(ρg) set by the pressure there. The bars
// under the pipe split the constant total p + ½ρv² into pressure (sky) and
// kinetic energy per volume (green). If the throat pressure would drop below
// the air's, the throat sucks air in through its tube instead.
// "break it: faster means more pressure" draws the wrong intuition: the throat
// column higher than the others. Then the bars no longer add up to the same
// total: the water would gain energy from nowhere as it speeds up.

const W = 560, H = 300;
const RHO = 1000, G = 9.81, P1 = 18;                  // kPa gauge pressure in the wide part
const CY = 214, H1 = 34;                                // pipe centre, half-height of the wide part (px)
const MPX = 80;                                         // px per metre of water column
const VPX = 22;                                         // px per second per (m/s) for the tracers
const TUBES = [100, 280, 470];
const N = 70;

/** Half-height of the pipe at x for throat ratio r (smooth cosine joins). */
function half(x: number, r: number) {
  const ease = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
  if (x < 180) return H1;
  if (x < 240) return H1 * (1 - (1 - r) * ease((x - 180) / 60));
  if (x < 320) return H1 * r;
  if (x < 400) return H1 * (r + (1 - r) * ease((x - 320) / 80));
  return H1;
}

export function VenturiFigure({ t }: { t?: TrackTranslations }) {
  const [v1, setV1] = useState(1.5);
  const [r, setR] = useState(0.45);
  const [broken, setBroken] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [, setTick] = useState(0);
  const dots = useRef((() => { const rnd = mulberry32(3); return Array.from({ length: N }, () => ({ x: 20 + rnd() * 520, f: rnd() * 2 - 1 })); })());
  const vis = useVisible<HTMLDivElement>();

  useFrame(playing && vis.on, dt => {
    for (const d of dots.current) {
      d.x += (v1 / (half(d.x, r) / H1)) * VPX * dt;
      if (d.x > 540) d.x -= 520;
    }
    setTick(k => k + 1);
  });

  const v2 = v1 / r;
  const kin = (v: number) => (0.5 * RHO * v * v) / 1000;            // kPa
  const dp = kin(v2) - kin(v1);
  const pThroat = broken ? P1 + dp : P1 - dp;
  const pressures = [P1, pThroat, P1];
  const speeds = [v1, v2, v1];
  const col = (p: number) => (Math.max(0, p) * 1000 / (RHO * G)) * MPX;

  let outline = "", outlineB = "";
  for (let x = 20; x <= 540; x += 4) {
    outline += `${x === 20 ? "M" : "L"}${x},${CY - half(x, r)}`;
    outlineB += `${x === 20 ? "M" : "L"}${x},${CY + half(x, r)}`;
  }
  let water = "";
  for (let x = 20; x <= 540; x += 4) water += `${x === 20 ? "M" : "L"}${x},${CY - half(x, r)}`;
  for (let x = 540; x >= 20; x -= 4) water += `L${x},${CY + half(x, r)}`;

  const total = P1 + kin(v1), BW = 64, scale = BW / Math.max(total, P1 + dp + kin(v1), 1);

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <path d={water + "Z"} fill={C.sky} opacity={0.18} />
      {dots.current.map((d, i) => <circle key={i} cx={d.x} cy={CY + d.f * half(d.x, r) * 0.8} r={2} fill={C.sky} />)}
      <path d={outline} fill="none" stroke={C.fg} strokeWidth={1.8} />
      <path d={outlineB} fill="none" stroke={C.fg} strokeWidth={1.8} />
      {TUBES.map((x, i) => {
        const top = CY - half(x, r), hgt = col(pressures[i]);
        const bad = broken && i === 1;
        return <g key={i}>
          <rect x={x - 7} y={14} width={14} height={top - 14} fill="none" stroke={C.fg} strokeWidth={1.2} />
          <rect x={x - 6} y={top - Math.min(hgt, top - 15)} width={12} height={Math.min(hgt, top - 15)} fill={bad ? C.red : C.sky} opacity={0.55} />
          <T x={x + 12} y={pressures[i] < 0 ? top - 24 : top - Math.min(hgt, top - 15) + 4} color={bad ? C.red : C.sky} size={8}>{`${f2(pressures[i], 1)} kPa`}</T>
          {pressures[i] < 0 && <T x={x + 12} y={top - 38} color={C.amber} size={8}>{tx(t, "figPhVen_suck", "sucks air in")}</T>}
          <T x={x} y={CY + half(x, r) + 13} anchor="middle" color={C.muted} size={8}>{`v = ${f2(speeds[i], 2)} m/s`}</T>
          {/* p + ½ρv² bar */}
          <rect x={x - BW / 2} y={H - 22} width={Math.max(0, pressures[i]) * scale} height={10} fill={bad ? C.red : C.sky} opacity={0.8} />
          <rect x={x - BW / 2 + Math.max(0, pressures[i]) * scale} y={H - 22} width={kin(speeds[i]) * scale} height={10} fill={C.green} opacity={0.8} />
          <rect x={x - BW / 2} y={H - 22} width={BW} height={10} fill="none" stroke={C.axis} />
          <T x={x} y={H - 2} anchor="middle" color={bad ? C.red : C.muted} size={7.5}>{`${f2(pressures[i] + kin(speeds[i]), 1)} kPa`}</T>
        </g>;
      })}
      <T x={14} y={H - 14} color={C.muted} size={7.5}>p + ½ρv²</T>
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhVen_title", "Faster flow, lower pressure")}
      head={<Btn active={broken} onClick={() => setBroken(b => !b)}>{tx(t, "figPhVen_broken", "break it: faster means more pressure")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhVen_v1", "speed in the wide part")} value={v1} min={0.2} max={3} step={0.05} onChange={setV1} fmt={v => `${f2(v, 2)} m/s`} />
          <Slider label={tx(t, "figPhVen_r", "throat area ÷ wide area")} value={r} min={0.25} max={1} step={0.01} onChange={setR} fmt={v => f2(v, 2)} />
        </Sliders>
        <Row>
          <Btn active={!playing} onClick={() => setPlaying(p => !p)}>{playing ? tx(t, "figPhVen_pause", "pause the flow") : tx(t, "figPhVen_play", "run the flow")}</Btn>
          <Readout color={C.green}>{`v₂ = v₁ A₁/A₂ = ${f2(v2, 2)} m/s`}</Readout>
          <Readout color={C.sky}>{`Δp = ½ρ(v₂² − v₁²) = ${f2(dp, 2)} kPa`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhVen_note", "Watch the tracer dots: in the throat they race, because the same volume of water must pass every section each second, so half the area means twice the speed. Now look at the tubes: the water stands lower above the throat. The faster water has lower pressure, and the bars show why: pressure (sky) and kinetic energy per cubic metre (green) always add up to the same total, so what the water gains in speed it pays for in pressure. After the throat the pipe widens, the water slows and its pressure comes back. Squeeze the throat hard and speed up the flow: the throat pressure drops below the air's and the tube sucks air in, which is how a scent atomiser and an old carburettor work. Then break it: a higher column over the throat would mean more energy per cubic metre there, created from nothing.")}>
      <div ref={vis.ref}>{view}</div>
    </Figure>
  );
}
