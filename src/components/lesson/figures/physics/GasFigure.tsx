"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T, useFrame, useVisible, f2, mulberry32 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A flat (2D) box of 80 gas molecules, closed on the right by a piston. The
// molecules fly in straight lines and bounce off the walls; they take up no
// room and do not attract each other, which is what "ideal gas" means. Their
// collisions with one another are stood in for by now and then turning a
// molecule's velocity in a random direction, keeping its speed. Each bounce
// gives the wall a push 2 m v (v across the wall); adding the pushes on all
// four walls over the last 3 s and dividing by the time and the perimeter
// gives the pressure (force per unit length in 2D; it is the same on every
// wall, and more bounces make a steadier reading). Temperature is the average kinetic energy:
// in 2D, k T = ⟨½ m v²⟩ (shown scaled so that the starting gas is 300 K).
// The readouts compare the measured pressure with the ideal gas law,
// P = N k T / V (V is the area in 2D): they agree within the noise.
// Moving the piston matters: a molecule that bounces off a piston coming
// towards it comes back faster (v' = 2u − v), so pushing the piston in heats
// the gas and pulling it out cools it — adiabatic compression and expansion.
// "heat" and "cool" scale every speed, like touching the box to a hot or cold
// plate. "break it: sticky walls" makes every bounce lose 10% of its speed:
// the gas cools and its pressure fades, unlike a real gas in a box at the
// same temperature as its walls.

const W = 560, H = 290;
const BX0 = 30, BY0 = 30, BY1 = 250, N = 80, R = 3;
const KT0 = 40000, T0 = 300;                         // k T of the starting gas (px²/s², ≈ 200 px/s per axis) ↔ 300 K
const WINDOW = 3;                                     // s of wall pushes averaged for the pressure
const PISTON = 50;                                    // top piston speed (px/s), a quarter of the molecules' typical speed

type Mol = { x: number; y: number; vx: number; vy: number };

function spawn(xMax: number, kT: number, seed: number): Mol[] {
  const rnd = mulberry32(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const s = Math.sqrt(kT);                            // each velocity component has variance kT/m
  return Array.from({ length: N }, () => ({
    x: BX0 + R + rnd() * (xMax - BX0 - 2 * R), y: BY0 + R + rnd() * (BY1 - BY0 - 2 * R), vx: s * gauss(), vy: s * gauss(),
  }));
}

export function GasFigure({ t }: { t?: TrackTranslations }) {
  const [target, setTarget] = useState(400);
  const [broken, setBroken] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [, setTick] = useState(0);
  const sim = useRef({ mols: spawn(400, KT0, 7), xp: 400, hits: [] as { t: number; J: number }[], time: 0, rnd: mulberry32(11) });
  const vis = useVisible<HTMLDivElement>();

  const step = (dt: number) => {
    const s = sim.current, e = broken ? 0.9 : 1;
    // piston follows the slider gently; u is its velocity this step
    const move = Math.max(-PISTON * dt, Math.min(PISTON * dt, target - s.xp));
    const u = move / dt;
    s.xp += move;
    // every bounce pushes its wall with the momentum it reverses, (1 + e)|v| for m = 1;
    // the pressure is the same on every wall, so all four are added up for a steadier reading
    let J = 0;
    for (const m of s.mols) {
      // stand-in for collisions between molecules: now and then a molecule's direction is reshuffled,
      // keeping its speed (and so the energy); this keeps the gas the same in every direction
      if (m.x > BX0 + 12 && m.x < s.xp - 12 && s.rnd() < 3 * dt) {
        const sp = Math.hypot(m.vx, m.vy), a = 2 * Math.PI * s.rnd();
        m.vx = sp * Math.cos(a); m.vy = sp * Math.sin(a);
      }
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < BX0 + R && m.vx < 0) { m.x = BX0 + R; J += (1 + e) * -m.vx; m.vx = -m.vx * e; }
      if (m.y < BY0 + R && m.vy < 0) { m.y = BY0 + R; J += (1 + e) * -m.vy; m.vy = -m.vy * e; }
      if (m.y > BY1 - R && m.vy > 0) { m.y = BY1 - R; J += (1 + e) * m.vy; m.vy = -m.vy * e; }
      if (m.x > s.xp - R) {
        m.x = s.xp - R;
        if (m.vx > u) {                                  // bounce off the moving piston: relative velocity reverses
          J += (1 + e) * (m.vx - u);
          m.vx = u - (m.vx - u) * e;
        }
      }
    }
    if (J > 0) s.hits.push({ t: s.time, J });
    s.time += dt;
    while (s.hits.length && s.hits[0].t < s.time - WINDOW) s.hits.shift();
  };
  useFrame(playing && vis.on, dt => {
    const n = Math.ceil(dt / 0.004);
    for (let i = 0; i < n; i++) step(dt / n);
    setTick(k => k + 1);
  });
  const scaleSpeeds = (f: number) => { for (const m of sim.current.mols) { m.vx *= f; m.vy *= f; } setTick(k => k + 1); };
  const reset = () => { setPlaying(false); setTarget(400); setBroken(false); sim.current = { mols: spawn(400, KT0, 7), xp: 400, hits: [], time: 0, rnd: mulberry32(11) }; setTick(k => k + 1); };

  const s = sim.current;
  const kT = s.mols.reduce((a, m) => a + 0.5 * (m.vx * m.vx + m.vy * m.vy), 0) / N;
  // the molecules' centres move in a box R smaller on every side: use it for both readings
  const lx = s.xp - BX0 - 2 * R, ly = BY1 - BY0 - 2 * R, area = lx * ly;
  const span = Math.min(WINDOW, s.time);
  const pMeas = span > 0.5 ? s.hits.reduce((a, h) => a + h.J, 0) / (span * 2 * (lx + ly)) : NaN;
  const pIdeal = (N * kT) / area;
  const TK = (kT / KT0) * T0;
  const vmax = Math.sqrt(KT0) * 3;

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <rect x={BX0} y={BY0} width={s.xp - BX0} height={BY1 - BY0} fill={C.bg} stroke={broken ? C.red : C.fg} strokeWidth={1.8} />
      {s.mols.map((m, i) => {
        const u = Math.min(1, Math.hypot(m.vx, m.vy) / vmax);
        return <circle key={i} cx={m.x} cy={m.y} r={R} fill={u > 0.55 ? C.red : u > 0.3 ? C.amber : C.sky} />;
      })}
      <rect x={s.xp} y={BY0 - 6} width={12} height={BY1 - BY0 + 12} rx={2} fill={C.muted} opacity={0.8} />
      <rect x={s.xp + 12} y={(BY0 + BY1) / 2 - 4} width={W - s.xp - 24} height={8} fill={C.muted} opacity={0.5} />
      <T x={BX0} y={BY1 + 18} color={C.muted} size={8}>{tx(t, "figPhGas_colour", "colour = speed: slow (sky), medium (amber), fast (red)")}</T>
      <T x={BX0} y={BY1 + 32} color={C.muted} size={8}>{`N = ${N}   V = ${f2(area / 1000, 1)} ${tx(t, "figPhGas_units", "thousand px²")}`}</T>
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhGas_title", "A gas made of molecules")}
      head={<Btn active={broken} onClick={() => setBroken(b => !b)}>{tx(t, "figPhGas_broken", "break it: sticky walls")}</Btn>}
      controls={<>
        <Slider label={tx(t, "figPhGas_piston", "piston position")} value={target} min={160} max={530} step={1} onChange={setTarget} fmt={v => `${v - BX0} px`} width="w-28" />
        <Row>
          <Btn onClick={() => scaleSpeeds(1.15)}>{tx(t, "figPhGas_heat", "heat")}</Btn>
          <Btn onClick={() => scaleSpeeds(0.87)}>{tx(t, "figPhGas_cool", "cool")}</Btn>
          <Readout color={C.red}>{`T = ${f2(TK, 0)} K`}</Readout>
          <Readout color={C.amber}>{`${tx(t, "figPhGas_meas", "measured")} P = ${Number.isNaN(pMeas) ? "…" : f2(pMeas, 1)}`}</Readout>
          <Readout color={C.green}>{`N k T / V = ${f2(pIdeal, 1)}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhGas_note", "Press play and wait a second or two for the pressure reading: it is just the molecules' pushes on the walls, added up. It matches N k T / V within a few per cent, jiggling because only 80 molecules do the pushing. Press heat: every molecule speeds up, they hit harder and more often, and the pressure rises in proportion to T. Pull the piston out: the same molecules spread over more room and hit it less often, so the pressure falls as 1/V. Watch the temperature as you move the piston: pushing it in makes the gas warmer, since molecules bounce off the advancing piston faster than they arrived, and pulling it out cools it. That is how a bicycle pump warms up. Then break it: if the walls absorbed a bit of every bounce, the gas would cool by itself and its pressure would die away.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} onReset={reset} readout={`t = ${f2(s.time, 1)} s`} />
      </div>
    </Figure>
  );
}
