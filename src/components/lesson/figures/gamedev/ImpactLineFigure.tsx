"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, Sliders, T, Vec, f2, useRaf } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Two balls on a line collide head on. The impulse j along the normal is
// computed from their masses, their approach speed and the restitution e, then
// applied in opposite directions. The readouts check the two laws: total
// momentum is the same before and after for any e, while kinetic energy is
// kept only when e = 1. "B is a wall" gives B zero inverse mass (infinite
// mass), which turns the formula into the bounce-off-a-wall rule.

const W = 660, H = 170, Y = 95, SCALE = 42;   // pixels per metre

export function ImpactLineFigure({ t }: { t?: TrackTranslations }) {
  const [ma, setMa] = useState(1);
  const [mb, setMb] = useState(1);
  const [ua, setUa] = useState(3);
  const [ub, setUb] = useState(-1);
  const [e, setE] = useState(1);
  const [wall, setWall] = useState(false);
  const [time, setTime] = useState(-1.5);
  const [playing, setPlaying] = useState(true);

  const ra = 0.25 * Math.cbrt(ma) + 0.15, rb = wall ? 0.4 : 0.25 * Math.cbrt(mb) + 0.15;
  const invA = 1 / ma, invB = wall ? 0 : 1 / mb;
  const vbIn = wall ? 0 : ub;
  // Normal from A to B is +x; the relative velocity of B with respect to A along it
  const vn = vbIn - ua;
  const approaching = vn < 0;
  const j = approaching ? (-(1 + e) * vn) / (invA + invB) : 0;
  const va = ua - j * invA, vb = vbIn + j * invB;

  const pBefore = ma * ua + (wall ? 0 : mb * vbIn), pAfter = ma * va + (wall ? 0 : mb * vb);
  const kBefore = 0.5 * ma * ua ** 2 + (wall ? 0 : 0.5 * mb * vbIn ** 2);
  const kAfter = 0.5 * ma * va ** 2 + (wall ? 0 : 0.5 * mb * vb ** 2);

  // They touch at t = 0 with the contact point at x = 0
  const tRef = useRef(time); tRef.current = time;
  const rafRef = useRaf(playing, dt => setTime(tRef.current + dt > 1.6 ? -1.6 : tRef.current + dt));
  const xa = -ra + (time < 0 || !approaching ? ua : va) * time;
  const xb = rb + (time < 0 || !approaching ? vbIn : vb) * time;
  const X = (x: number) => W / 2 + x * SCALE;
  const vA = time < 0 ? ua : va, vB = time < 0 ? vbIn : vb;

  return (
    <Figure
      title={tx(t, "figImp_title", "A head-on collision and its impulse")}
      head={<Btn active={wall} onClick={() => setWall(v => !v)}>{wall ? "✓ " : ""}{tx(t, "figImp_wall", "B is a wall")}</Btn>}
      controls={<>
        <Row>
          <Btn active={playing} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</Btn>
          <Btn onClick={() => { setMa(1); setMb(1); setUa(3); setUb(-1); setE(1); setWall(false); }}>{tx(t, "figImp_equal", "equal masses, e = 1")}</Btn>
          <Btn onClick={() => { setMa(1); setMb(5); setUa(4); setUb(0); setE(0.8); setWall(false); }}>{tx(t, "figImp_heavy", "light hits heavy")}</Btn>
          <Btn onClick={() => { setMa(2); setMb(2); setUa(3); setUb(-3); setE(0); setWall(false); }}>{tx(t, "figImp_clay", "clay, e = 0")}</Btn>
        </Row>
        <Sliders>
          <Slider label={tx(t, "figImp_ma", "mass A")} value={ma} min={0.5} max={5} step={0.1} onChange={setMa} fmt={v => `${v.toFixed(1)} kg`} width="w-24" />
          <Slider label={tx(t, "figImp_mb", "mass B")} value={mb} min={0.5} max={5} step={0.1} onChange={setMb} fmt={v => `${v.toFixed(1)} kg`} width="w-24" />
          <Slider label={tx(t, "figImp_ua", "speed A")} value={ua} min={-5} max={5} step={0.1} onChange={setUa} fmt={v => `${v.toFixed(1)} m/s`} width="w-24" />
          <Slider label={tx(t, "figImp_ub", "speed B")} value={ub} min={-5} max={5} step={0.1} onChange={setUb} fmt={v => `${v.toFixed(1)} m/s`} width="w-24" />
          <Slider label={tx(t, "figImp_e", "restitution e")} value={e} min={0} max={1} step={0.05} onChange={setE} width="w-24" />
        </Sliders>
        <Row>
          <Readout color={C.amber}>j = {f2(j)} N·s</Readout>
          <Readout>{tx(t, "figImp_after", "after")}: v_A = {f2(va)}, v_B = {f2(vb)} m/s</Readout>
          <Readout color={C.green}>p: {f2(pBefore)} → {f2(pAfter)}</Readout>
          <Readout color={kAfter < kBefore - 1e-6 ? C.red : C.green}>KE: {f2(kBefore)} → {f2(kAfter)} J</Readout>
        </Row>
        {!approaching && <p className="text-[11px] font-mono text-[var(--text-muted)]">{tx(t, "figImp_apart", "v_rel · n ≥ 0: they are not approaching, so no impulse is applied")}</p>}
      </>}
      note={tx(t, "figImp_note", "The impulse is equal and opposite: A loses j/m_A of speed, B gains j/m_B. Momentum (p) is therefore always conserved, whatever e is. Kinetic energy (KE) is conserved only at e = 1; with e = 0 the two stick together and move at their common speed, and the missing energy went into heat, sound and dents. With equal masses and e = 1 the balls swap velocities, which is how Newton's cradle works. Make B a wall and A simply bounces back at e times its speed: the rule from the Collision Shapes chapter.")}
    >
      <div ref={rafRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
          <line x1={10} x2={W - 10} y1={Y + 45} y2={Y + 45} stroke={C.axis} />
          <line x1={X(0)} x2={X(0)} y1={Y - 60} y2={Y + 50} stroke={C.grid} strokeDasharray="3 4" />
          {wall ? (
            <rect x={X(xb - rb)} y={Y - 60} width={24} height={105} fill={C.muted} opacity={0.5} />
          ) : (
            <circle cx={X(xb)} cy={Y} r={rb * SCALE} fill={C.sky} opacity={0.85} />
          )}
          <circle cx={X(xa)} cy={Y} r={ra * SCALE} fill={C.orange} opacity={0.85} />
          <T x={X(xa)} y={Y + 4} anchor="middle" bold color="#1f1300">A</T>
          {!wall && <T x={X(xb)} y={Y + 4} anchor="middle" bold color="#001526">B</T>}
          {Math.abs(vA) > 0.05 && <Vec a={{ x: X(xa), y: Y - ra * SCALE - 12 }} b={{ x: X(xa) + vA * 14, y: Y - ra * SCALE - 12 }} color={C.orange} />}
          {!wall && Math.abs(vB) > 0.05 && <Vec a={{ x: X(xb), y: Y - rb * SCALE - 12 }} b={{ x: X(xb) + vB * 14, y: Y - rb * SCALE - 12 }} color={C.sky} />}
          <T x={12} y={18}>{time < 0 ? tx(t, "figImp_before", "before") : tx(t, "figImp_afterW", "after")} · t = {f2(time, 2)} s</T>
        </svg>
      </div>
    </Figure>
  );
}
