"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, plot, Grid, mulberry32 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The same jump (v0 = 8 m/s up, g = 20 m/s²) integrated with different frame
// times. The exact peak is v0²/2g = 1.6 m. Explicit Euler overshoots,
// semi-implicit Euler undershoots, and both by an amount that depends on dt:
// with a variable timestep the jump height changes with the frame rate, and
// with random frame times it changes from one jump to the next.

const V0 = 8, G = 20, PEAK = (V0 * V0) / (2 * G);
const DTS = [1 / 10, 1 / 20, 1 / 30, 1 / 60, 1 / 144];
const COLS = [C.red, C.orange, C.amber, C.green, C.sky];
type Method = "explicit" | "semi";

function jump(dts: () => number, method: Method) {
  let y = 0, v = V0, t = 0;
  const pts: [number, number][] = [[0, 0]];
  let peak = 0;
  for (let i = 0; i < 400; i++) {
    const dt = dts();
    if (method === "explicit") { y += v * dt; v -= G * dt; }     // position uses the old velocity
    else { v -= G * dt; y += v * dt; }                           // velocity first, then position
    t += dt;
    peak = Math.max(peak, y);
    pts.push([t, Math.max(y, -0.05)]);
    if (y < 0) break;
  }
  return { pts, peak };
}

export function JumpFigure({ t }: { t?: TrackTranslations }) {
  const [method, setMethod] = useState<Method>("semi");
  const [random, setRandom] = useState(false);
  const [seed, setSeed] = useState(1);
  const p = plot({ W: 560, H: 220, x0: -0.03, x1: 0.95, y0: -0.12, y1: 2.15 });

  const runs = useMemo(() => {
    if (random) {
      const rng = mulberry32(seed);
      return Array.from({ length: 5 }, () => jump(() => 1 / 144 + rng() * (1 / 20 - 1 / 144), method));
    }
    return DTS.map(dt => jump(() => dt, method));
  }, [method, random, seed]);

  const exact = Array.from({ length: 81 }, (_, i) => { const tt = (i / 80) * 0.8; return [tt, V0 * tt - 0.5 * G * tt * tt] as const; });
  const path = (pts: readonly (readonly [number, number])[]) => pts.map(([a, b], i) => `${i ? "L" : "M"}${p.X(a).toFixed(1)},${p.Y(b).toFixed(1)}`).join("");

  return (
    <Figure
      title={tx(t, "figJump_title", "One jump, five frame rates")}
      head={<Choice value={method} onChange={setMethod} options={[["explicit", tx(t, "figJump_exp", "explicit Euler")], ["semi", tx(t, "figJump_semi", "semi-implicit Euler")]] as const} />}
      controls={<>
        <Row>
          <Btn active={!random} onClick={() => setRandom(false)}>{tx(t, "figJump_fixed", "fixed dt per run")}</Btn>
          <Btn active={random} onClick={() => setRandom(true)}>{tx(t, "figJump_rand", "random frame times (20–144 FPS)")}</Btn>
          {random && <Btn onClick={() => setSeed(s => s + 1)}>{tx(t, "figJump_again", "jump again")}</Btn>}
        </Row>
        <Row>
          <Readout color={C.muted}>{tx(t, "figJump_exact", "exact peak")} {PEAK.toFixed(3)} m</Readout>
          {runs.map((r, i) => (
            <Readout key={i} color={COLS[i]}>
              {random ? `#${i + 1}` : `${Math.round(1 / DTS[i])} fps`}: {r.peak.toFixed(3)} m
            </Readout>
          ))}
        </Row>
      </>}
      note={tx(t, "figJump_note", "The dashed curve is the exact parabola y = v₀t − ½gt². Each coloured curve is the same jump stepped with one frame time. At 10 FPS semi-implicit Euler peaks at 1.2 m, almost 40 cm lower than at 144 FPS (explicit Euler overshoots to 2.0 m), which in a platformer is the difference between reaching a ledge and not. With random frame times, the same player input gives a different jump every time. A fixed physics step makes every run produce exactly the same numbers, whatever the display does.")}
    >
      <svg viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
        <Grid p={p} step={0.1} major={0.5} labels={false} />
        {[0.5, 1, 1.5, 2].map(y => <T key={y} x={p.X(0) + 3} y={p.Y(y) - 2} size={8}>{`${y} m`}</T>)}
        {[0.2, 0.4, 0.6, 0.8].map(x => <T key={x} x={p.X(x)} y={p.Y(0) + 11} size={8} anchor="middle">{`${x} s`}</T>)}
        <line x1={0} x2={p.W} y1={p.Y(PEAK)} y2={p.Y(PEAK)} stroke={C.muted} strokeDasharray="2 4" />
        <path d={path(exact)} fill="none" stroke={C.fg} strokeWidth={1.4} strokeDasharray="5 4" />
        {runs.map((r, i) => (
          <g key={i}>
            <path d={path(r.pts)} fill="none" stroke={COLS[i]} strokeWidth={1.8} />
            {r.pts.length < 60 && r.pts.map(([a, b], k) => <circle key={k} cx={p.X(a)} cy={p.Y(b)} r={1.8} fill={COLS[i]} />)}
          </g>
        ))}
      </svg>
    </Figure>
  );
}
