"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Slider, Sliders, Readout, Vec, T, C } from "../../kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A cross-section of the surface with an eye under it. The faint fan is the
// sky from horizon to horizon in 15° steps: bent at the surface, all of it
// reaches the eye inside a cone of ±48.6°. The bold ray follows one viewing
// angle: refracted out and partly reflected inside the cone, reflected
// completely outside it. The plot on the right is the exact Fresnel
// reflectance seen from inside the water.

const W = 580, H = 250;
const N_W = 1.333;
const CRIT = Math.asin(1 / N_W);                         // 48.6°
const SURF = 92, EYE = { x: 150, y: SURF + 72 };
const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

/** Exact unpolarised Fresnel reflectance, light going from n1 to n2 = n1 / eta. */
export function fresnelExact(cosi: number, eta: number) {
  const sint2 = eta * eta * (1 - cosi * cosi);
  if (sint2 >= 1) return 1;
  const cost = Math.sqrt(1 - sint2);
  const rs = (eta * cosi - cost) / (eta * cosi + cost), rp = (cosi - eta * cost) / (cosi + eta * cost);
  return 0.5 * (rs * rs + rp * rp);
}

export function SnellWindowFigure({ t }: { t?: TrackTranslations }) {
  const [angle, setAngle] = useState(35);                // viewing angle from the vertical, in water
  const th = rad(angle);
  const F = fresnelExact(Math.cos(th), N_W);
  const tir = th >= CRIT;
  const air = tir ? null : Math.asin(N_W * Math.sin(th));

  // Where a ray at angle a (signed, from the vertical) leaves the eye and meets the surface
  const hit = (a: number) => ({ x: EYE.x + (EYE.y - SURF) * Math.tan(a), y: SURF });
  const out = (p: { x: number; y: number }, a: number, len: number) => ({ x: p.x + Math.sin(a) * len, y: p.y - Math.cos(a) * len });
  const win = (EYE.y - SURF) * Math.tan(CRIT);

  const fan = [-90, -75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75, 90].map(a => {
    const wa = Math.asin(Math.sin(rad(a)) / N_W);
    const h = hit(wa);
    return { a, wa, h, o: out(h, rad(a), 70) };
  });
  const h = hit(th);
  const shown = h.x < 355;                               // the surface point is inside the drawing
  const refl = { x: h.x + Math.sin(th) * 90, y: h.y + Math.cos(th) * 90 };

  // Fresnel plot: angle 0…90° → x, reflectance 0…1 → y
  const P = { x0: 400, x1: 565, y0: 205, y1: 45 };
  const px = (a: number) => P.x0 + (a / 90) * (P.x1 - P.x0), py = (f: number) => P.y0 + f * (P.y1 - P.y0);
  const curve = Array.from({ length: 181 }, (_, i) => {
    const a = i / 2;
    return `${i ? "L" : "M"}${px(a).toFixed(1)},${py(fresnelExact(Math.cos(rad(a)), N_W)).toFixed(1)}`;
  }).join("");

  return (
    <Figure title={tx(t, "figSnell_title", "Snell's window")}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figSnell_angle", "angle in water")} value={angle} min={0} max={70} step={0.5} onChange={setAngle} fmt={v => `${v.toFixed(1)}°`} />
        </Sliders>
        <div className="flex gap-1.5 flex-wrap">
          <Readout>θ<sub>water</sub> = {angle.toFixed(1)}°</Readout>
          <Readout color={tir ? C.red : C.sky}>θ<sub>air</sub> = {air === null ? tx(t, "figSnell_none", "none (TIR)") : `${deg(air).toFixed(1)}°`}</Readout>
          <Readout color={C.amber}>F = {(F * 100).toFixed(1)}%</Readout>
          <Readout>θ<sub>c</sub> = {deg(CRIT).toFixed(1)}°</Readout>
        </div>
      </>}
      note={tx(t, "figSnell_note", "The faint rays are the sky, every 15° from horizon to horizon. Refraction bends each one toward the vertical, so the whole 180° of sky reaches the eye inside a cone only 97° wide: a bright disc overhead whose diameter is 2.27 times the eye's depth. A ray that meets the surface at more than the critical angle θc = arcsin(1/1.333) cannot get out at all and is reflected completely. Even inside the window, Fresnel reflection rises sharply toward the edge.")}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
        {/* Water body, surface and Snell's window */}
        <rect x={0} y={SURF} width={370} height={H - SURF} fill={C.sky} opacity={0.08} />
        <line x1={0} x2={370} y1={SURF} y2={SURF} stroke={C.sky} strokeWidth={1.5} />
        <rect x={EYE.x - win} y={SURF - 3} width={win * 2} height={6} fill={C.amber} opacity={0.5} rx={2} />
        <T x={EYE.x} y={SURF + 16} anchor="middle" color={C.amber}>{tx(t, "figSnell_window", "the window")}</T>
        {/* The cone's edges */}
        {[-1, 1].map(s => (
          <line key={s} x1={EYE.x} y1={EYE.y} x2={EYE.x + s * win} y2={SURF} stroke={C.amber} strokeWidth={1} strokeDasharray="3 3" />
        ))}
        {/* The sky fan */}
        {fan.map(f => (
          <g key={f.a} opacity={0.35}>
            <line x1={EYE.x} y1={EYE.y} x2={f.h.x} y2={f.h.y} stroke={C.sky} strokeWidth={0.8} />
            <line x1={f.h.x} y1={f.h.y} x2={f.o.x} y2={f.o.y} stroke={C.sky} strokeWidth={0.8} />
          </g>
        ))}
        <T x={8} y={16}>{tx(t, "figSnell_air", "air  n = 1.000")}</T>
        <T x={8} y={H - 8}>{tx(t, "figSnell_water", "water  n = 1.333")}</T>
        {/* The chosen ray */}
        {shown ? <>
          <line x1={EYE.x} y1={EYE.y} x2={h.x} y2={h.y} stroke={C.fg} strokeWidth={2} />
          {air !== null && <Vec a={h} b={out(h, air, 75)} color={C.sky} w={2} />}
          <Vec a={h} b={refl} color={C.red} w={0.6 + 2 * F} opacity={0.3 + 0.7 * F} />
          <line x1={h.x} x2={h.x} y1={SURF - 40} y2={SURF + 40} stroke={C.muted} strokeWidth={0.8} strokeDasharray="2 3" />
        </> : <T x={250} y={SURF + 40} color={C.muted}>{tx(t, "figSnell_off", "(the ray meets the surface off the drawing)")}</T>}
        <circle cx={EYE.x} cy={EYE.y} r={4} fill={C.fg} />
        <T x={EYE.x + 8} y={EYE.y + 4}>{tx(t, "figSnell_eye", "eye")}</T>

        {/* Fresnel from inside */}
        <line x1={P.x0} x2={P.x1} y1={P.y0} y2={P.y0} stroke={C.axis} />
        <line x1={P.x0} x2={P.x0} y1={P.y0} y2={P.y1} stroke={C.axis} />
        <line x1={px(deg(CRIT))} x2={px(deg(CRIT))} y1={P.y0} y2={P.y1} stroke={C.amber} strokeDasharray="3 3" />
        <path d={curve} fill="none" stroke={C.red} strokeWidth={1.8} />
        <circle cx={px(angle)} cy={py(F)} r={4} fill={C.amber} />
        <T x={P.x0} y={P.y1 - 8}>{tx(t, "figSnell_plot", "reflected (from below)")}</T>
        <T x={P.x0 - 4} y={P.y1 + 4} anchor="end" size={8}>1</T>
        <T x={P.x0 - 4} y={P.y0 + 3} anchor="end" size={8}>0</T>
        <T x={P.x0} y={P.y0 + 13} size={8}>0°</T>
        <T x={P.x1} y={P.y0 + 13} anchor="end" size={8}>90°</T>
        <T x={px(deg(CRIT))} y={P.y0 + 13} anchor="middle" size={8} color={C.amber}>48.6°</T>
      </svg>
    </Figure>
  );
}
