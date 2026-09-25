"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Slider, Sliders, Row, Readout, C, T, useRaf, useRerender, mulberry32 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Three copies of the same object moving right at constant speed, each updated
// by a different loop, all driven by one simulated clock:
//   variable dt      x += v·frameDt every rendered frame
//   fixed dt         an accumulator runs whole physics steps of h = 1/Hz; the
//                    screen shows the state after the last whole step
//   fixed + interp.  same steps, but the screen blends the last two states by
//                    α = accumulator / h
// Each lane keeps a trail of the positions actually shown on screen. Evenly
// spaced dots mean smooth motion; uneven dots are stutter. The timeline under
// the lanes shows, for the fixed loop, when frames were rendered, when physics
// steps ran, and the accumulator filling and draining.

const W = 560, LANE = 34, LANES_Y = 22, TL_Y = 150, TL_H = 86, H = TL_Y + TL_H + 22;
const LEN = W - 40;          // lane length in px; the object wraps around
const SPEED = LEN / 2.4;     // px per simulated second
const WINDOW = 0.5;          // seconds of history on the timeline
const MAX_FRAME = 0.25;      // clamp for one frame's dt (the spiral-of-death guard)

type Sim = {
  t: number; nextR: number; lastR: number; spike: boolean;
  xv: number; acc: number; prev: number; curr: number; physT: number;
  trails: [number[], number[], number[]];
  renders: { t: number; acc: number; steps: number }[];
  steps: number[];
  lastSteps: number;
};

const fresh = (): Sim => ({
  t: 0, nextR: 0, lastR: 0, spike: false,
  xv: 0, acc: 0, prev: 0, curr: 0, physT: 0,
  trails: [[], [], []], renders: [], steps: [], lastSteps: 0,
});

export function LoopFigure({ t }: { t?: TrackTranslations }) {
  const [fps, setFps] = useState(50);
  const [hz, setHz] = useState(30);
  const [jitter, setJitter] = useState(false);
  const [slow, setSlow] = useState(false);
  const [running, setRunning] = useState(true);
  const sim = useRef<Sim>(fresh());
  const rng = useRef(mulberry32(7));
  const rerender = useRerender();

  const ref = useRaf(running, (dt) => {
    const s = sim.current, h = 1 / hz;
    s.t += dt * (slow ? 0.2 : 1);
    while (s.t >= s.nextR) {
      // ── one rendered frame ──
      let frameDt = s.nextR - s.lastR;
      s.lastR = s.nextR;
      const base = 1 / fps;
      s.nextR += s.spike ? 0.3 : jitter ? base * (0.55 + rng.current() * 0.9) : base;
      s.spike = false;

      // variable timestep
      s.xv += SPEED * frameDt;

      // fixed timestep with accumulator
      frameDt = Math.min(frameDt, MAX_FRAME);
      s.acc += frameDt;
      let steps = 0;
      while (s.acc >= h) {
        s.prev = s.curr;
        s.curr += SPEED * h;
        s.acc -= h;
        s.physT += h;
        s.steps.push(s.physT);
        steps++;
      }
      s.lastSteps = steps;
      const alpha = s.acc / h;
      const interp = s.prev + (s.curr - s.prev) * alpha;

      const push = (arr: number[], v: number) => { arr.push(v); if (arr.length > 14) arr.shift(); };
      push(s.trails[0], s.xv);
      push(s.trails[1], s.curr);
      push(s.trails[2], interp);
      s.renders.push({ t: s.lastR, acc: s.acc, steps });
    }
    const cut = s.t - WINDOW - 0.1;
    while (s.renders.length && s.renders[0].t < cut) s.renders.shift();
    while (s.steps.length && s.steps[0] < cut) s.steps.shift();
    rerender();
  });

  const s = sim.current, h = 1 / hz;
  const wrap = (x: number) => 20 + (((x % LEN) + LEN) % LEN);
  const lanes = [
    { label: tx(t, "figLoop_var", "variable dt"), color: C.amber },
    { label: tx(t, "figLoop_fix", "fixed dt"), color: C.red },
    { label: tx(t, "figLoop_int", "fixed dt + interpolation"), color: C.green },
  ];
  // Timeline: x = time within the last WINDOW seconds
  const tx0 = s.t - WINDOW;
  const TX = (tt: number) => 20 + ((tt - tx0) / WINDOW) * LEN;
  const accY = (a: number) => TL_Y + TL_H - 6 - (a / h) * (TL_H - 34);
  let accPath = "";
  const vis = s.renders.filter(r => r.t >= tx0 - 0.05);
  vis.forEach((r, i) => {
    // acc jumps up by frameDt on each frame then drops by h per step; draw the level after the frame
    const x = TX(r.t);
    if (i > 0) accPath += ` L${x.toFixed(1)},${accY(vis[i - 1].acc).toFixed(1)}`;
    accPath += `${i ? " L" : "M"}${x.toFixed(1)},${accY(r.acc).toFixed(1)}`;
  });
  if (vis.length) accPath += ` L${TX(s.t).toFixed(1)},${accY(vis[vis.length - 1].acc).toFixed(1)}`;

  return (
    <Figure
      title={tx(t, "figLoop_title", "Game loop lab — variable vs fixed timestep")}
      head={<>
        <Btn active={running} onClick={() => setRunning(r => !r)}>{running ? "❚❚" : "▶"}</Btn>
        <Btn active={slow} onClick={() => setSlow(v => !v)}>{tx(t, "figLoop_slow", "slow motion ×0.2")}</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figLoop_fps", "render FPS")} value={fps} min={10} max={165} step={1} onChange={setFps} fmt={v => `${v}`} />
          <Slider label={tx(t, "figLoop_hz", "physics Hz")} value={hz} min={5} max={120} step={1} onChange={setHz} fmt={v => `${v}`} />
        </Sliders>
        <Row>
          <Btn active={jitter} onClick={() => setJitter(j => !j)}>{tx(t, "figLoop_jitter", "uneven frame times")}</Btn>
          <Btn onClick={() => { sim.current.spike = true; }}>{tx(t, "figLoop_spike", "inject a 300 ms hitch")}</Btn>
          <Btn onClick={() => { sim.current = fresh(); rerender(); }}>↻</Btn>
          <span className="ml-auto flex gap-1.5 flex-wrap">
            <Readout>h = {(h * 1000).toFixed(1)} ms</Readout>
            <Readout>{tx(t, "figLoop_steps", "steps last frame")}: {s.lastSteps}</Readout>
            <Readout color={C.green}>α = {(s.acc / h).toFixed(2)}</Readout>
          </span>
        </Row>
      </>}
      note={tx(t, "figLoop_note", "Each dot is a position that was actually shown on screen; the lane keeps the last 14. Try 50 FPS with 30 Hz physics: the red lane gets one step on some frames and none on others (and at 20 FPS, sometimes two), so its dots bunch and gap, which reads as stutter. The green lane runs exactly the same steps but blends the last two states by α, so its dots are even again, one physics step behind. Turn on uneven frame times: the amber lane stays smooth (its step is the frame time), but that is also why its physics would change with the frame rate. The hitch button makes one frame take 300 ms: the fixed loop clamps it to 250 ms and catches up with several steps in one frame instead of spiralling.")}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {lanes.map((l, i) => {
            const y = LANES_Y + i * (LANE + 6);
            const trail = s.trails[i];
            const cur = trail.length ? trail[trail.length - 1] : 0;
            return (
              <g key={i}>
                <rect x={20} y={y} width={LEN} height={LANE} rx={6} fill="var(--code-surface)" stroke="var(--code-border)" />
                <T x={24} y={y + 11} size={8.5} color={l.color}>{l.label}</T>
                {trail.map((x, k) => (
                  <circle key={k} cx={wrap(x)} cy={y + LANE / 2 + 4} r={2.4} fill={l.color} opacity={0.15 + (k / trail.length) * 0.6} />
                ))}
                <rect x={wrap(cur) - 7} y={y + LANE / 2 - 3} width={14} height={14} rx={3} fill={l.color} />
              </g>
            );
          })}
          {/* timeline */}
          <T x={20} y={TL_Y - 6} size={8.5}>{tx(t, "figLoop_tl", "fixed loop, last 0.5 s:  │ rendered frame   ▪ physics step   ─ accumulator (0 … h)")}</T>
          <rect x={20} y={TL_Y} width={LEN} height={TL_H} rx={6} fill="var(--code-surface)" stroke="var(--code-border)" />
          <defs><clipPath id="loopTl"><rect x={20} y={TL_Y} width={LEN} height={TL_H} rx={6} /></clipPath></defs>
          <g clipPath="url(#loopTl)">
          <line x1={20} x2={20 + LEN} y1={accY(1)} y2={accY(1)} stroke={C.green} strokeDasharray="3 3" opacity={0.5} />
          <T x={24 + LEN - 60} y={accY(1) - 3} size={8} color={C.green}>acc = h</T>
          {vis.map((r, i) => r.t >= tx0 && (
            <line key={`r${i}`} x1={TX(r.t)} x2={TX(r.t)} y1={TL_Y + 3} y2={TL_Y + 20} stroke={C.blue} strokeWidth={1.6} />
          ))}
          {s.steps.filter(p => p >= tx0).map((p, i) => (
            <rect key={`p${i}`} x={TX(p) - 2} y={TL_Y + 23} width={4} height={6} fill={C.amber} />
          ))}
          <path d={accPath} fill="none" stroke={C.green} strokeWidth={1.5} />
          </g>
          <T x={20} y={H - 6} size={8}>{tx(t, "figLoop_tlNote", "physics steps sit at whole multiples of h in simulation time; frames land wherever the display is ready")}</T>
        </svg>
      </div>
    </Figure>
  );
}
