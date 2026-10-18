"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A rod 30 cm long, 1 cm² in cross-section, wrapped in insulation, starts at
// 20 °C. At t = 0 its left end is put against a hot plate (T_hot, slider) and
// its right end into ice water (0 °C). Heat flows from hot to cold by
// conduction, and the temperature along the rod obeys the heat equation
//   ∂T/∂t = D ∂²T/∂x²,   D = k / (ρ c)   (thermal diffusivity),
// solved here on 40 cells with an explicit scheme in the scaled time L²/D.
// The bar is coloured by temperature, the graph shows T(x), and the dashed
// line is the final, steady state: a straight line, with the heat flow
// P = k A ΔT / L (Fourier's law) the same through every slice.
// The time readout is real time for the chosen material: copper settles in
// minutes, glass and wood would take days, since D differs a thousandfold.

const W = 560, H = 280;
const L = 0.3, AREA = 1e-4, N = 40, T_START = 20;
const MATERIALS = {
  copper: { k: 401, rho: 8960, c: 385 },
  aluminium: { k: 237, rho: 2700, c: 897 },
  steel: { k: 50, rho: 7850, c: 490 },
  glass: { k: 1.0, rho: 2500, c: 840 },
  wood: { k: 0.15, rho: 600, c: 1700 },
} as const;
type Mat = keyof typeof MATERIALS;
const RX0 = 40, RX1 = 520, RY = 50, RH = 26;          // rod on screen
const GY0 = 250, GY1 = 110;                             // graph y for 0…T_hot

/** Blue → amber → red for 0 °C … tMax. */
function heat(T: number, tMax: number) {
  const u = Math.max(0, Math.min(1, T / tMax));
  const r = Math.round(40 + 215 * Math.min(1, u * 1.6)), g = Math.round(110 + 80 * Math.sin(Math.PI * u) - 60 * u), b = Math.round(230 * (1 - u));
  return `rgb(${r},${g},${b})`;
}

export function ConductionFigure({ t }: { t?: TrackTranslations }) {
  const [mat, setMat] = useState<Mat>("copper");
  const [tHot, setTHot] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [tau, setTau] = useState(0);                   // time in units of L²/D
  const temps = useRef<number[]>(Array.from({ length: N + 1 }, (_, i) => (i === 0 ? 100 : i === N ? 0 : T_START)));
  const vis = useVisible<HTMLDivElement>();

  const { k, rho, c } = MATERIALS[mat];
  const D = k / (rho * c), tScale = (L * L) / D;        // seconds per unit of τ
  const power = (k * AREA * tHot) / L;

  const reset = (hot = tHot) => {
    setPlaying(false); setTau(0);
    temps.current = Array.from({ length: N + 1 }, (_, i) => (i === 0 ? hot : i === N ? 0 : T_START));
  };
  const advance = (dTau: number) => {
    const dx = 1 / N, dt = 0.4 * dx * dx, n = Math.ceil(dTau / dt), h = dTau / n;
    let cur = temps.current;
    for (let s = 0; s < n; s++) {
      const next = cur.slice();
      for (let i = 1; i < N; i++) next[i] = cur[i] + (h / (dx * dx)) * (cur[i - 1] - 2 * cur[i] + cur[i + 1]);
      cur = next;
    }
    temps.current = cur;
    setTau(v => v + dTau);
  };
  // about 12 s of watching covers the approach to the steady state (τ ≈ 0.6)
  useFrame(playing && vis.on, dt => { if (tau > 0.8) { setPlaying(false); return; } advance(dt * 0.05); });

  const temp = temps.current;
  const px = (i: number) => RX0 + (i / N) * (RX1 - RX0);
  const gy = (v: number) => GY0 - (v / tHot) * (GY0 - GY1);
  const curve = temp.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${gy(v).toFixed(1)}`).join("");
  // flow through the middle slice right now, from the local slope
  const mid = N / 2, slope = (temp[mid - 1] - temp[mid + 1]) / (2 * (L / N));
  const flowNow = k * AREA * slope;
  const seconds = tau * tScale;
  const timeText = seconds < 120 ? `${f2(seconds, 0)} s` : seconds < 7200 ? `${f2(seconds / 60, 1)} min` : seconds < 172800 ? `${f2(seconds / 3600, 1)} h` : `${f2(seconds / 86400, 1)} ${tx(t, "figPhCond_days", "days")}`;

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <rect x={RX0 - 30} y={RY - 10} width={30} height={RH + 20} rx={3} fill={C.red} opacity={0.85} />
      <T x={RX0 - 15} y={RY - 16} anchor="middle" color={C.red} size={8}>{`${tHot} °C`}</T>
      <rect x={RX1} y={RY - 10} width={30} height={RH + 20} rx={3} fill={C.sky} opacity={0.6} />
      <T x={RX1 + 15} y={RY - 16} anchor="middle" color={C.sky} size={8}>0 °C</T>
      {temp.slice(0, N).map((v, i) => <rect key={i} x={px(i)} y={RY} width={px(i + 1) - px(i) + 0.5} height={RH} fill={heat((v + temp[i + 1]) / 2, tHot)} />)}
      <rect x={RX0} y={RY} width={RX1 - RX0} height={RH} fill="none" stroke={C.fg} />
      <T x={(RX0 + RX1) / 2} y={RY + RH + 16} anchor="middle" color={C.muted} size={8}>{tx(t, "figPhCond_rod", "insulated rod, 30 cm long, 1 cm² cross-section")}</T>

      <line x1={RX0} y1={GY0} x2={RX1} y2={GY0} stroke={C.axis} />
      <line x1={RX0} y1={GY0} x2={RX0} y2={GY1} stroke={C.axis} />
      {[0, 0.5, 1].map(u => <T key={u} x={RX0 - 4} y={gy(u * tHot) + 3} anchor="end" color={C.muted} size={7.5}>{`${f2(u * tHot, 0)}°`}</T>)}
      {[0, 10, 20, 30].map(cm => <T key={cm} x={RX0 + (cm / 30) * (RX1 - RX0)} y={GY0 + 12} anchor="middle" color={C.muted} size={7.5}>{`${cm} cm`}</T>)}
      <line x1={RX0} y1={gy(tHot)} x2={RX1} y2={gy(0)} stroke={C.green} strokeDasharray="4 3" />
      <T x={RX1} y={GY1 - 6} anchor="end" color={C.green} size={8}>{tx(t, "figPhCond_steady", "steady state: a straight line")}</T>
      <path d={curve} fill="none" stroke={C.amber} strokeWidth={2} />
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhCond_title", "Heat flowing along a rod")}
      controls={<>
        <Row>
          <Choice value={mat} onChange={m => { setMat(m); reset(); }} options={[
            ["copper", tx(t, "figPhCond_cu", "copper")],
            ["aluminium", tx(t, "figPhCond_al", "aluminium")],
            ["steel", tx(t, "figPhCond_steel", "steel")],
            ["glass", tx(t, "figPhCond_glass", "glass")],
            ["wood", tx(t, "figPhCond_wood", "wood")],
          ]} />
        </Row>
        <Slider label={tx(t, "figPhCond_hot", "hot plate")} value={tHot} min={40} max={200} step={5} onChange={v => { setTHot(v); reset(v); }} fmt={v => `${v} °C`} width="w-28" />
        <Row>
          <Readout>{`k = ${k} W/(m·K)`}</Readout>
          <Readout>{`D = k/ρc = ${(D * 1e6).toPrecision(3)} mm²/s`}</Readout>
          <Readout color={C.green}>{`${tx(t, "figPhCond_final", "final flow")} P = kAΔT/L = ${power < 0.1 ? power.toPrecision(2) : f2(power, 2)} W`}</Readout>
          <Readout color={C.amber}>{`${tx(t, "figPhCond_now", "through the middle now")} ${flowNow < 0.1 && flowNow > -0.1 ? flowNow.toPrecision(2) : f2(flowNow, 2)} W`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhCond_note", "Press play. Heat soaks in from the hot end; at first the far half of the rod has not noticed anything. Slowly the curve straightens until it lies on the dashed line: then every slice passes on exactly the heat it receives, and the flow through the middle equals k A ΔT / L. Switch materials and watch the time readout: copper settles in about eight minutes and carries 13 W at 100 °C; steel takes about an hour and carries an eighth of that; glass would take a day or two and carry 0.03 W, which is why pot handles are wood and plastic. The shape of the approach is the same for all of them; only the clock changes, through the diffusivity D = k/(ρc).")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => { if (tau > 0.8) reset(); setPlaying(p => !p); }} onReset={() => reset()}
          readout={`t = ${timeText}`} />
      </div>
    </Figure>
  );
}
