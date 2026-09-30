"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T, mulberry32, useRaf } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The particle compute shader of the chapter, run on the CPU: every particle
// orbits the origin under an inverse-square pull, integrated with
// semi-implicit Euler, seen from above. The simulation is split into
// workgroups of 256 exactly like the dispatch. Two things can be broken:
// without the barrier after the dispatch, the vertex fetch starts while
// some workgroups have not written yet, and those particles are drawn at
// last frame's positions (red, so they can be seen); without the bounds
// check, the invocations of the last workgroup past `count` write beyond the
// end of the buffer (the bar underneath).

const LOCAL = 256, K = 1, SOFT = 0.02, CW = 360, CH = 220, VIEW = 2.1;
const MAX = 10000;

type Sim = { pos: Float32Array; vel: Float32Array; old: Float32Array; stale: Uint8Array; rnd: () => number };

function seed(): Sim {
  const rnd = mulberry32(7);
  const pos = new Float32Array(MAX * 2), vel = new Float32Array(MAX * 2);
  for (let i = 0; i < MAX; i++) {
    const r = 0.55 + rnd() * 1.1, a = rnd() * Math.PI * 2, v = Math.sqrt(K / r) * (0.92 + rnd() * 0.16);
    pos[2 * i] = r * Math.cos(a); pos[2 * i + 1] = r * Math.sin(a);
    vel[2 * i] = -v * Math.sin(a); vel[2 * i + 1] = v * Math.cos(a);   // tangential: a near-circular orbit
  }
  return { pos, vel, old: new Float32Array(MAX * 2), stale: new Uint8Array(MAX), rnd };
}

// One dispatch: the body of particles.comp for every invocation i < count
function step(s: Sim, count: number, dt: number) {
  s.old.set(s.pos.subarray(0, count * 2));
  for (let i = 0; i < count; i++) {
    const x = s.pos[2 * i], z = s.pos[2 * i + 1];
    const d2 = x * x + z * z + SOFT, inv = K / (d2 * Math.sqrt(d2));
    s.vel[2 * i] -= x * inv * dt; s.vel[2 * i + 1] -= z * inv * dt;   // v += a · dt first...
    s.pos[2 * i] += s.vel[2 * i] * dt; s.pos[2 * i + 1] += s.vel[2 * i + 1] * dt;   // ...then x += v · dt
  }
}

function draw(ctx: CanvasRenderingContext2D, s: Sim, count: number, barrier: boolean) {
  ctx.fillStyle = "#0b0d16";
  ctx.fillRect(0, 0, CW, CH);
  const sc = CH / (2 * VIEW), cx = CW / 2, cy = CH / 2;
  // Without the barrier, the vertex fetch overtakes the dispatch: the workgroups
  // that have not finished yet still hold last frame's positions.
  const groups = Math.ceil(count / LOCAL), done = barrier ? groups : Math.floor(groups * (0.3 + 0.6 * s.rnd()));
  for (let i = 0; i < count; i++) {
    const stale = Math.floor(i / LOCAL) >= done;
    const src = stale ? s.old : s.pos;
    const x = src[2 * i], z = src[2 * i + 1];
    const sp = Math.hypot(s.vel[2 * i], s.vel[2 * i + 1]);
    const f = Math.min(Math.max((sp - 0.75) / 0.6, 0), 1);          // orbit speeds here span ≈ 0.78 … 1.35
    ctx.fillStyle = stale ? "#ef4444" : `rgb(${Math.round(50 + 205 * f)},${Math.round(100 + 104 * f)},${Math.round(255 - 180 * f)})`;
    ctx.fillRect(cx + x * sc - 0.75, cy + z * sc - 0.75, 1.5, 1.5);
  }
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(cx - 2, cy - 2, 4, 4);                                  // the attractor: the cubes sit here
}

export function ParticleFigure({ t }: { t?: TrackTranslations }) {
  const [count, setCount] = useState(6000);
  const [barrier, setBarrier] = useState(true);
  const [bounds, setBounds] = useState(true);
  const [playing, setPlaying] = useState(true);
  const L = (k: string, en: string) => tx(t, `figVkPart_${k}`, en);

  const canvas = useRef<HTMLCanvasElement>(null);
  const sim = useRef<Sim | null>(null);
  const opts = useRef({ count, barrier });
  opts.current = { count, barrier };

  const redraw = () => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    sim.current ??= seed();
    draw(ctx, sim.current, opts.current.count, opts.current.barrier);
  };
  useEffect(redraw);
  const ref = useRaf(playing, dt => {
    sim.current ??= seed();
    for (let k = 0; k < 4; k++) step(sim.current, opts.current.count, dt * 0.35 / 4);
    redraw();
  });

  const groups = Math.ceil(count / LOCAL), launched = groups * LOCAL, extra = launched - count;
  const BW = 560, bx = 40, bar = (n: number) => bx + (n / (MAX + LOCAL)) * BW;

  return (
    <Figure
      title={L("title", "The particle compute shader, and what its barriers and bounds check prevent")}
      head={<>
        <Btn active={barrier} onClick={() => setBarrier(v => !v)}>{barrier ? "☑" : "☐"} {L("barrier", "barrier after dispatch")}</Btn>
        <Btn active={bounds} onClick={() => setBounds(v => !v)}>{bounds ? "☑" : "☐"} if (i ≥ count) return;</Btn>
      </>}
      controls={<>
        <Row>
          <Btn active={playing} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚" : "▶"} {L("play", "run")}</Btn>
          <div className="flex-1 min-w-[200px]"><Slider label="count" value={count} min={250} max={MAX} step={250} onChange={setCount} fmt={v => `${v}`} /></div>
        </Row>
        <Row>
          <Readout color={C.sky}>vkCmdDispatch({groups}, 1, 1)</Readout>
          <Readout>{L("launched", "invocations")} {launched}</Readout>
          <Readout color={extra ? C.amber : C.green}>{L("extra", "past count")} {extra}</Readout>
        </Row>
        {!barrier && <p className="text-[12.5px] leading-relaxed" style={{ color: C.red }}>{L("noBarrier", "No barrier between the dispatch and the draw: nothing makes the vertex fetch wait for the compute writes. Particles of workgroups that had not finished are drawn from last frame's data (red here; on screen they jitter), and a particle read while it is being written can mix old and new fields. Synchronization validation reports a read-after-write hazard.")}</p>}
        {!bounds && extra > 0 && <p className="text-[12.5px] leading-relaxed" style={{ color: C.red }}>{L("noBounds", "No bounds check: the last workgroup's {n} extra invocations read and write p[{a}] to p[{b}], {bytes} bytes past the end of the buffer. With robustBufferAccess the writes are discarded; without it they corrupt whatever the allocation next to the buffer holds.").replace("{n}", String(extra)).replace("{a}", String(count)).replace("{b}", String(launched - 1)).replace("{bytes}", String(extra * 32))}</p>}
      </>}
      note={L("note", "Each dot is one particle, seen from above: position and velocity in a storage buffer, 32 bytes each. Every frame one invocation per particle adds the pull towards the centre to the velocity, then the velocity to the position (semi-implicit Euler), and the same buffer is then read as a vertex buffer to draw the points. Colour is speed: inner particles orbit faster. The bar shows the buffer (blue) and the invocations the dispatch launches, rounded up to whole workgroups of 256.")}
    >
      <div ref={ref} className="p-2">
        <canvas ref={canvas} width={CW} height={CH} className="w-full h-auto block rounded-md" style={{ aspectRatio: `${CW} / ${CH}` }} />
      </div>
      <svg viewBox="0 0 640 44" className="w-full h-auto" role="img">
        <T x={6} y={20} size={8} bold color={C.fg}>{L("buffer", "buffer")}</T>
        <rect x={bx} y={10} width={bar(count) - bx} height={14} fill={C.sky} fillOpacity={0.35} stroke={C.sky} />
        {extra > 0 && <rect x={bar(count)} y={10} width={bar(launched) - bar(count)} height={14}
          fill={bounds ? "#64748b" : C.red} fillOpacity={bounds ? 0.2 : 0.5} stroke={bounds ? "#64748b" : C.red} strokeDasharray={bounds ? "3 2" : undefined} />}
        <T x={bx} y={37} size={7.5}>p[0]</T>
        <T x={bar(count)} y={37} size={7.5} anchor="middle">p[{count}]</T>
        {extra > 0 && <T x={bar(launched) + 4} y={21} size={7.5} color={bounds ? C.muted : C.red}>{bounds ? L("returns", "return early") : L("overflow", "written past the end")}</T>}
      </svg>
    </Figure>
  );
}
