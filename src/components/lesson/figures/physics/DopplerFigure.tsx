"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A source moving to the right at Mach M (its speed divided by the speed of
// sound) sends out a wavefront every period. Each wavefront is a circle that
// grows at the speed of sound around the point where it was emitted, not
// around where the source is now. So the circles crowd together ahead of the
// source (shorter wavelength, higher pitch) and spread out behind it.
// The readouts give the pitch a listener at rest would hear from a 440 Hz
// source, f' = f / (1 ∓ M), with c = 343 m/s. At M = 1 the wavefronts pile up
// into a wall; above it they form a cone of half-angle θ, sin θ = 1/M: the
// sonic boom, heard as the cone sweeps past.
// "break it: waves carried by the source" centres every circle on the moving
// source, the wrong idea that sound travels with whatever made it: the
// circles stay evenly spaced all round and the pitch never changes.
// Drawing in "screen units": sound moves at 90 px/s, one wavefront per 0.3 s.

const W = 560, H = 280;
const CPX = 90, TE = 0.3, Y = 140, XS0 = 40;
const F = 440, CS = 343;

export function DopplerFigure({ t }: { t?: TrackTranslations }) {
  const [mach, setMach] = useState(0.5);
  const [broken, setBroken] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const vpx = mach * CPX;
  const loop = mach > 0.02 ? Math.min(12, (W + 40 - XS0) / vpx) : 8;   // restart once the source has left the view
  useFrame(playing && vis.on, dt => setTime(s => (s + dt) % loop));

  const xs = (s: number) => XS0 + vpx * s;
  const now = xs(time);
  const fronts: { cx: number; r: number }[] = [];
  for (let n = 0; n * TE <= time; n++) {
    const te = n * TE, r = CPX * (time - te);
    if (r < 650) fronts.push({ cx: broken ? now : xs(te), r });
  }
  const ahead = mach < 1 ? F / (1 - mach) : Infinity, behind = F / (1 + mach);
  const theta = mach > 1 ? Math.asin(1 / mach) : 0;

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <g>
        <line x1={0} y1={Y} x2={W} y2={Y} stroke={C.grid} strokeDasharray="3 4" />
        {fronts.map((c, i) => <circle key={i} cx={c.cx} cy={Y} r={c.r} fill="none" stroke={C.sky} strokeWidth={1.3} opacity={Math.max(0.15, 1 - c.r / 650)} />)}
        {mach > 1 && !broken && [1, -1].map(sg => (
          <line key={sg} x1={now} y1={Y} x2={now - 700 * Math.cos(theta)} y2={Y + sg * 700 * Math.sin(theta)} stroke={C.red} strokeWidth={2} opacity={0.75} />
        ))}
        <circle cx={now} cy={Y} r={8} fill={C.amber} />
        <path d={`M${now + 19},${Y} l-8,-4 l0,8 z`} fill={C.amber} />
      </g>
      <T x={W - 10} y={20} anchor="end" color={C.muted} size={8.5}>{tx(t, "figPhDop_ahead", "listener ahead")}</T>
      <T x={10} y={20} color={C.muted} size={8.5}>{tx(t, "figPhDop_behind", "listener behind")}</T>
      {mach > 1 && !broken && <T x={W - 10} y={H - 12} anchor="end" color={C.red} size={8.5}>{`${tx(t, "figPhDop_cone", "shock cone")}: sin θ = 1/M, θ = ${f2((theta * 180) / Math.PI, 0)}°`}</T>}
      {broken && <T x={10} y={H - 12} color={C.red} size={8.5}>{tx(t, "figPhDop_wrong", "evenly spaced all round: no change of pitch, which is not what we hear")}</T>}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhDop_title", "A moving source of sound")}
      head={<Btn active={broken} onClick={() => setBroken(b => !b)}>{tx(t, "figPhDop_broken", "break it: waves carried by the source")}</Btn>}
      controls={<>
        <Slider label={tx(t, "figPhDop_M", "source speed (Mach)")} value={mach} min={0} max={1.8} step={0.05} onChange={v => { setMach(v); setTime(0); }} fmt={v => `M ${f2(v, 2)}`} width="w-36" />
        <Row>
          <Readout>{`v = ${f2(mach * CS, 0)} m/s = ${f2(mach * CS * 3.6, 0)} km/h`}</Readout>
          <Readout color={C.pink}>{`${tx(t, "figPhDop_hAhead", "ahead")}: ${broken ? `${F} Hz` : ahead === Infinity ? tx(t, "figPhDop_silent", "silence, then the boom") : `${f2(ahead, 0)} Hz`}`}</Readout>
          <Readout color={C.sky}>{`${tx(t, "figPhDop_hBehind", "behind")}: ${broken ? F : f2(behind, 0)} Hz`}</Readout>
          <Readout color={C.amber}>{`${tx(t, "figPhDop_src", "source")}: ${F} Hz`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhDop_note", "Press play. With the source at rest the circles are evenly spaced. Give it speed: each circle is centred where the source was when it sent it out, so they bunch up in front and spread out behind. A listener ahead gets crests more often (higher pitch), one behind less often (lower pitch); at Mach 0.5 that is 880 Hz and 293 Hz from a 440 Hz siren. Push to Mach 1: the source keeps up with its own sound and the fronts pile up into a wall in front of it. Beyond Mach 1 it outruns them, and they make a cone: no sound reaches a listener ahead until the cone edge sweeps by as a bang. A faster source makes a narrower cone. Then break it: if sound were carried along by its source, the circles would stay centred on it, evenly spaced, and a passing siren would never change its note.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} onReset={() => { setPlaying(false); setTime(0); }}
          readout={`t = ${f2(time, 1)} s`} />
      </div>
    </Figure>
  );
}
