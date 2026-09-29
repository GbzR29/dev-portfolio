"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, Sliders, T } from "../../kit/figure";
import { blackbodyCss, blackbodyRGB } from "./blackbody";
import { omega, orbitSpeed } from "./geodesic";

// ── What this figure shows ────────────────────────────────────────────────────
// One ring of the disk seen from above, turning counter-clockwise, with a
// distant observer below the picture. Each piece of the ring is drawn in the
// colour the observer receives: a blackbody at g·T, where g combines the
// Doppler shift of the orbit and the gravitational redshift. Light bending is
// ignored here: the photon leaves every piece straight towards the observer.

const W = 660, H = 330, CX = 200, CY = 165, RING = 120;
const N = 90;
const Y_LUM = (T: number) => { const c = blackbodyRGB(T); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };

export function DopplerFigure({ t }: { t?: TrackTranslations }) {
  const [r, setR] = useState(3);
  const [incl, setIncl] = useState(75);
  const [temp, setTemp] = useState(6500);
  const [doppler, setDoppler] = useState(true);
  const [grav, setGrav] = useState(true);

  const lapse = Math.sqrt(1 - 1 / r);
  const sinI = Math.sin((incl * Math.PI) / 180);
  // ℓ for the piece at angle θ (x = r·cos θ): the photon heads to the observer, ℓ = −x·sin i / √(1 − 1/r)
  const gAt = (th: number) => {
    const ell = (-r * Math.cos(th) * sinI) / lapse;
    const dop = Math.sqrt((1 - 1.5 / r) / (1 - 1 / r)) / (1 - omega(r) * ell);
    return (grav ? lapse : 1) * (doppler ? dop : 1);
  };
  const gain = 0.9 / Y_LUM(temp);
  const segs = Array.from({ length: N }, (_, i) => {
    const a0 = (i / N) * 2 * Math.PI, a1 = ((i + 1) / N) * 2 * Math.PI, g = gAt((a0 + a1) / 2);
    // θ is measured from +x towards the observer (down the page)
    const pt = (a: number, rr: number) => `${CX + Math.cos(a) * rr},${CY + Math.sin(a) * rr}`;
    return { d: `M${pt(a0, RING - 16)} L${pt(a0, RING + 16)} L${pt(a1, RING + 16)} L${pt(a1, RING - 16)} Z`, fill: blackbodyCss(g * temp, gain), g };
  });
  const gMax = Math.max(...segs.map(s => s.g)), gMin = Math.min(...segs.map(s => s.g));

  const swatch = (x: number, label: string, g: number) => (
    <g>
      <rect x={x} y={70} width={58} height={58} rx={8} fill={blackbodyCss(g * temp, gain)} stroke="var(--border)" />
      <T x={x + 29} y={146} anchor="middle" color={C.fg}>{label}</T>
      <T x={x + 29} y={161} anchor="middle">g = {g.toFixed(2)}</T>
      <T x={x + 29} y={176} anchor="middle">{Math.round(g * temp)} K</T>
      <T x={x + 29} y={191} anchor="middle">{(Y_LUM(g * temp) / Y_LUM(temp)).toFixed(2)}×</T>
    </g>
  );

  return (
    <Figure
      title={tx(t, "figBhDop_title", "Doppler beaming around one ring")}
      head={<>
        <Btn active={doppler} onClick={() => setDoppler(v => !v)}>{doppler ? "✓ " : ""}Doppler</Btn>
        <Btn active={grav} onClick={() => setGrav(v => !v)}>{grav ? "✓ " : ""}{tx(t, "figBh_grav", "gravitational redshift")}</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figBhDop_r", "ring radius r")} value={r} min={1.6} max={30} step={0.1} onChange={setR} fmt={v => `${v.toFixed(1)} rₛ`} width="w-28" />
          <Slider label={tx(t, "figBhDop_incl", "inclination i")} value={incl} min={0} max={90} step={1} onChange={setIncl} fmt={v => `${v}°`} width="w-28" />
          <Slider label={tx(t, "figBhDop_temp", "temperature T")} value={temp} min={2500} max={20000} step={100} onChange={setTemp} fmt={v => `${Math.round(v)} K`} width="w-28" />
        </Sliders>
        <Row>
          <Readout>{tx(t, "figBhDop_speed", "orbital speed")} β = {orbitSpeed(r).toFixed(3)} c</Readout>
          <Readout>{tx(t, "figBhDop_clock", "clock rate")} √(1 − rₛ/r) = {lapse.toFixed(3)}</Readout>
          <Readout>g⁴: {(gMax ** 4 / gMin ** 4).toFixed(1)}× {tx(t, "figBhDop_ratio", "brighter side to dimmer side")}</Readout>
        </Row>
      </>}
      note={tx(t, "figBhDop_note", "The gas on the left comes towards the observer and arrives blueshifted and brighter; the gas on the right recedes, redder and dimmer. At the inner edge, 3 rₛ, the gas moves at half the speed of light and the bright side outshines the dim one many times over. Face-on (i = 0) the orbit moves across the line of sight and only the slower clock remains: the whole ring is evenly reddened. The last line under each swatch is its visible brightness compared with gas at rest far from the hole.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
        {segs.map((s, i) => <path key={i} d={s.d} fill={s.fill} stroke={s.fill} strokeWidth={0.8} />)}
        <circle cx={CX} cy={CY} r={RING * 0.3} fill="#000" stroke={C.muted} />
        {/* Direction of the orbit */}
        {[0.25, 0.75, 1.25, 1.75].map(k => {
          const a = k * Math.PI, rr = RING + 30, x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr;
          const tx0 = Math.sin(a), ty0 = -Math.cos(a);     // counter-clockwise on screen
          return <path key={k} d={`M${x - tx0 * 10},${y - ty0 * 10} L${x + tx0 * 10},${y + ty0 * 10}`} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#bhDopArrow)" />;
        })}
        <defs>
          <marker id="bhDopArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.muted} />
          </marker>
        </defs>
        <T x={CX} y={H - 8} anchor="middle">▼ {tx(t, "figBhDop_obs", "to the observer")}</T>
        <T x={CX - RING + 20} y={CY + 4} size={9} color={C.sky}>{tx(t, "figBhDop_app", "approaching")}</T>
        <T x={CX + RING - 20} y={CY + 4} size={9} anchor="end" color={C.red}>{tx(t, "figBhDop_rec", "receding")}</T>
        {swatch(400, tx(t, "figBhDop_app", "approaching"), gMax)}
        {swatch(485, tx(t, "figBhDop_rest", "at rest"), 1)}
        {swatch(570, tx(t, "figBhDop_rec", "receding"), gMin)}
      </svg>
    </Figure>
  );
}
