"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A tall tank filled to 1.2 m with a small hole in its side at height y_h
// (slider). Torricelli: the water leaves the hole at v = √(2 g h), where h is
// the depth of the hole below the surface: the same speed as a stone falling
// from the surface to the hole. The jet is a projectile: it flies
// x = v t, falls y_h − ½ g t², and lands at R = 2 √(h y_h), farthest when the
// hole is halfway down. As the tank drains, h shrinks, the jet slows and the
// level falls more and more slowly: A dh/dt = −a √(2 g h), with the hole 1/60
// of the tank's cross-section, so the level follows h(t) = (√h₀ − (a/A)√(g/2) t)².
// "break it: jet speed set by the hole" keeps the speed fixed as if it
// depended on the hole only: the jet would never weaken and the tank would
// empty at a steady rate, unlike any real bottle or barrel.

const W = 560, H = 300;
const G = 9.81, H0 = 1.2, RATIO = 1 / 60;
const PX = 200, FLOOR = 285, TX0 = 60, TX1 = 140;     // px per metre, floor y, tank walls

export function DrainFigure({ t }: { t?: TrackTranslations }) {
  const [yh, setYh] = useState(0.3);
  const [broken, setBroken] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const h0 = H0 - yh;                                   // starting depth of the hole
  const k = RATIO * Math.sqrt(G / 2);
  const vFixed = Math.sqrt(2 * G * h0);
  const hNow = broken
    ? Math.max(0, h0 - RATIO * vFixed * time)
    : Math.max(0, Math.sqrt(h0) - k * time) ** 2;
  const tEnd = broken ? h0 / (RATIO * vFixed) : Math.sqrt(h0) / k;
  const v = hNow > 0 ? (broken ? vFixed : Math.sqrt(2 * G * hNow)) : 0;
  const range = v * Math.sqrt((2 * yh) / G);

  useFrame(playing && vis.on, dt => {
    if (time >= tEnd) { setPlaying(false); return; }
    setTime(s => Math.min(tEnd, s + dt * 2));                // shown at double speed
  });
  const restart = (f: () => void) => { f(); setTime(0); setPlaying(false); };

  const level = FLOOR - (yh + hNow) * PX, holeY = FLOOR - yh * PX;
  let jet = "";
  if (v > 0.01) {
    const tf = Math.sqrt((2 * yh) / G);
    for (let i = 0; i <= 40; i++) {
      const s = (tf * i) / 40;
      jet += `${i ? "L" : "M"}${(TX1 + v * s * PX).toFixed(1)},${(holeY + 0.5 * G * s * s * PX).toFixed(1)}`;
    }
  }
  // the best hole for the current level: halfway down
  const best = (yh + hNow) / 2;
  const bestRange = 2 * Math.sqrt((yh + hNow - best) * best);

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={10} y1={FLOOR} x2={W - 10} y2={FLOOR} stroke={C.fg} strokeWidth={1.5} />
      <rect x={TX0} y={level} width={TX1 - TX0} height={FLOOR - level} fill={C.sky} opacity={0.35} />
      <path d={`M${TX0},${FLOOR - H0 * PX - 12} L${TX0},${FLOOR} L${TX1},${FLOOR} L${TX1},${FLOOR - H0 * PX - 12}`} fill="none" stroke={C.fg} strokeWidth={1.8} />
      <circle cx={TX1} cy={holeY} r={3} fill={C.bg} stroke={C.fg} />
      {hNow > 0 && <>
        <line x1={TX1 + 6} y1={level} x2={TX1 + 6} y2={holeY} stroke={C.amber} strokeDasharray="2 3" />
        <T x={TX1 + 10} y={(level + holeY) / 2 + 3} color={C.amber} size={8.5}>{`h = ${f2(hNow, 2)} m`}</T>
      </>}
      <T x={TX0 - 4} y={holeY + 3} anchor="end" color={C.muted} size={8}>{`y = ${f2(yh, 2)}`}</T>
      {jet && <path d={jet} fill="none" stroke={broken ? C.red : C.sky} strokeWidth={3} opacity={0.75} strokeLinecap="round" />}
      {v > 0.01 && <>
        <line x1={TX1 + range * PX} y1={FLOOR - 6} x2={TX1 + range * PX} y2={FLOOR + 6} stroke={C.green} strokeWidth={2} />
        <T x={TX1 + range * PX} y={FLOOR + 14} anchor="middle" color={C.green} size={8}>{`R = ${f2(range, 2)} m`}</T>
      </>}
      {!broken && hNow > 0.02 && <>
        <line x1={TX1 + bestRange * PX} y1={FLOOR - 4} x2={TX1 + bestRange * PX} y2={FLOOR + 4} stroke={C.purple} />
        <T x={W - 12} y={24} anchor="end" color={C.purple} size={8.5}>{`${tx(t, "figPhDrain_best", "farthest possible now: hole halfway down")}, R = ${f2(bestRange, 2)} m`}</T>
      </>}
      {broken && <T x={W - 12} y={24} anchor="end" color={C.red} size={8.5}>{tx(t, "figPhDrain_wrong", "a jet that never weakens: the level falls at a steady rate")}</T>}
      {hNow <= 0 && <T x={W - 12} y={44} anchor="end" color={C.muted} size={8.5}>{tx(t, "figPhDrain_done", "down to the hole: the flow stops")}</T>}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhDrain_title", "A leaking tank")}
      head={<Btn active={broken} onClick={() => restart(() => setBroken(b => !b))}>{tx(t, "figPhDrain_broken", "break it: jet speed set by the hole")}</Btn>}
      controls={<>
        <Slider label={tx(t, "figPhDrain_yh", "height of the hole")} value={yh} min={0.05} max={1.1} step={0.05} onChange={v => restart(() => setYh(v))} fmt={v => `${f2(v, 2)} m`} width="w-32" />
        <Row>
          <Readout color={C.sky}>{`v = √(2gh) = ${f2(v, 2)} m/s`}</Readout>
          <Readout color={C.green}>{`R = 2√(h·y) = ${f2(range, 2)} m`}</Readout>
          <Readout>{`${tx(t, "figPhDrain_empty", "drained to the hole in")} ${f2(tEnd, 0)} s`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhDrain_note", "Press play (shown at double speed). The water shoots out at the speed a stone would reach falling from the surface to the hole, v = √(2gh). As the level drops, h shrinks, the jet slows and lands closer, and the level falls ever more slowly: the last few centimetres take the longest. Move the hole: near the top the water barely spurts, near the bottom it spurts fast but has no time to fly; the longest jet comes from a hole halfway down (purple mark). Then break it: if the jet speed depended only on the hole, the jet would keep its reach to the very end and the tank would empty at a steady rate, faster than real tanks do.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => { if (time >= tEnd) setTime(0); setPlaying(p => !p); }} onReset={() => restart(() => {})}
          readout={`t = ${f2(time, 1)} s`} />
      </div>
    </Figure>
  );
}
