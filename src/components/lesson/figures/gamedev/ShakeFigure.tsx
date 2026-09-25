"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Slider, Sliders, Row, Readout, C, T, useRaf, useRerender } from "@/components/lesson/kit/figure";
import { perlin1 } from "@/components/lesson/kit/noise";

// ── What this figure shows ────────────────────────────────────────────────────
// Trauma-based camera shake (Eiserloh, GDC 2016). Hits add "trauma" in [0, 1],
// which decays linearly over time. The shake amount is trauma², so small hits
// barely move the camera and big ones move it a lot. Offset and roll are
// shake × max × a noise signal in [−1, 1]: either a new random number every
// frame (jittery, frame-rate dependent) or smooth 1D noise sampled at
// time × frequency (continuous, the same at every frame rate).

const W = 560, VIEW_W = 300, VIEW_H = 170, HIST = 180;

export function ShakeFigure({ t }: { t?: TrackTranslations }) {
  const [source, setSource] = useState<"random" | "noise">("noise");
  const [maxOff, setMaxOff] = useState(22);
  const [maxRoll, setMaxRoll] = useState(6);
  const [freq, setFreq] = useState(12);
  const [decay, setDecay] = useState(1.1);
  const [power, setPower] = useState(2);
  const st = useRef({ trauma: 0, time: 0, ox: 0, oy: 0, roll: 0, hist: [] as [number, number][] });
  const rerender = useRerender();

  const ref = useRaf(true, dt => {
    const s = st.current;
    s.time += dt;
    s.trauma = Math.max(0, s.trauma - decay * dt);      // linear decay, trauma per second
    const shake = s.trauma ** power;
    const n = (seed: number) => source === "noise"
      ? perlin1(s.time * freq, seed) * 2.2                  // ≈ [−1, 1]: 1D gradient noise peaks near ±0.5
      : Math.random() * 2 - 1;
    s.ox = maxOff * shake * n(1);
    s.oy = maxOff * shake * n(2);
    s.roll = maxRoll * shake * n(3);
    s.hist.push([s.trauma, s.ox / Math.max(1, maxOff)]);
    if (s.hist.length > HIST) s.hist.shift();
    rerender();
  });
  const hit = (a: number) => { st.current.trauma = Math.min(1, st.current.trauma + a); };

  const s = st.current;
  const cx = 16 + VIEW_W / 2, cy = 16 + VIEW_H / 2;
  const hx = 340, hw = W - hx - 14, hy = 30, hh = 150;
  const HX = (i: number) => hx + (i / HIST) * hw;
  const trPath = s.hist.map(([tr], i) => `${i ? "L" : "M"}${HX(i).toFixed(1)},${(hy + hh - tr * hh).toFixed(1)}`).join("");
  const offPath = s.hist.map(([, o], i) => `${i ? "L" : "M"}${HX(i).toFixed(1)},${(hy + hh / 2 - o * hh * 0.45).toFixed(1)}`).join("");

  return (
    <Figure
      title={tx(t, "figShake_title", "Screen shake with trauma")}
      head={<Choice value={source} onChange={setSource} options={[["random", tx(t, "figShake_rand", "random each frame")], ["noise", tx(t, "figShake_noise", "smooth noise")]] as const} />}
      controls={<>
        <Row>
          <Btn onClick={() => hit(0.3)}>{tx(t, "figShake_hit", "hit  +0.3")}</Btn>
          <Btn onClick={() => hit(0.6)}>{tx(t, "figShake_big", "explosion  +0.6")}</Btn>
          <Btn onClick={() => hit(1)}>{tx(t, "figShake_max", "max  1.0")}</Btn>
          <span className="ml-auto flex gap-1.5">
            <Readout color={C.red}>trauma {s.trauma.toFixed(2)}</Readout>
            <Readout color={C.amber}>shake = trauma^{power} = {(s.trauma ** power).toFixed(2)}</Readout>
          </span>
        </Row>
        <Sliders>
          <Slider label={tx(t, "figShake_off", "max offset")} value={maxOff} min={0} max={40} step={1} onChange={setMaxOff} fmt={v => `${v} px`} />
          <Slider label={tx(t, "figShake_roll", "max roll")} value={maxRoll} min={0} max={15} step={0.5} onChange={setMaxRoll} fmt={v => `${v}°`} />
          <Slider label={tx(t, "figShake_freq", "noise freq")} value={freq} min={1} max={40} step={1} onChange={setFreq} fmt={v => `${v} Hz`} />
          <Slider label={tx(t, "figShake_decay", "decay")} value={decay} min={0.2} max={3} step={0.1} onChange={setDecay} fmt={v => `${v.toFixed(1)}/s`} />
          <Slider label={tx(t, "figShake_pow", "exponent")} value={power} min={1} max={3} step={1} onChange={setPower} fmt={v => `${v}`} />
        </Sliders>
      </>}
      note={tx(t, "figShake_note", "Press hit a few times. Trauma (red) stacks up and drains in a straight line; the actual shake uses trauma², so it falls off quickly at the end instead of fizzling out. With random each frame the image jitters harshly and the look changes with the frame rate. Smooth noise gives a continuous wobble whose speed is the frequency slider, independent of FPS. Rotation (roll) sells the effect more than translation, and it should stay small: a few degrees.")}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} 202`} className="w-full h-auto">
          <defs><clipPath id="shakeClip"><rect x={16} y={16} width={VIEW_W} height={VIEW_H} rx={6} /></clipPath></defs>
          <rect x={16} y={16} width={VIEW_W} height={VIEW_H} rx={6} fill="#0b1220" />
          <g clipPath="url(#shakeClip)">
            <g transform={`translate(${s.ox},${s.oy}) rotate(${s.roll} ${cx} ${cy})`}>
              {/* a tiny level, deliberately larger than the view so edges never show */}
              <rect x={-40} y={-40} width={VIEW_W + 120} height={VIEW_H + 120} fill="#16213a" />
              {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={30 + ((i * 97) % 380)} cy={24 + ((i * 53) % 90)} r={1.2} fill="#cbd5e1" opacity={0.6} />)}
              <rect x={-40} y={150} width={420} height={80} fill="#334155" />
              <rect x={60} y={110} width={70} height={10} rx={2} fill="#475569" />
              <rect x={200} y={90} width={80} height={10} rx={2} fill="#475569" />
              <rect x={150} y={128} width={16} height={22} rx={3} fill={C.orange} />
              <circle cx={158} cy={124} r={6} fill="#fcd34d" />
              <circle cx={250} cy={134} r={12 + s.trauma * 18} fill={C.amber} opacity={0.25 * s.trauma} />
            </g>
          </g>
          <rect x={16} y={16} width={VIEW_W} height={VIEW_H} rx={6} fill="none" stroke="var(--code-border)" />
          <line x1={cx - 6} x2={cx + 6} y1={cy} y2={cy} stroke={C.fg} opacity={0.4} />
          <line x1={cx} x2={cx} y1={cy - 6} y2={cy + 6} stroke={C.fg} opacity={0.4} />
          {/* history */}
          <T x={hx} y={20} size={8.5}>{tx(t, "figShake_hist", "last 3 s")}</T>
          <rect x={hx} y={hy} width={hw} height={hh} rx={4} fill="var(--code-surface)" stroke="var(--code-border)" />
          <line x1={hx} x2={hx + hw} y1={hy + hh / 2} y2={hy + hh / 2} stroke={C.grid} />
          <path d={offPath} fill="none" stroke={C.amber} strokeWidth={1.2} />
          <path d={trPath} fill="none" stroke={C.red} strokeWidth={1.8} />
          <T x={hx} y={hy + hh + 14} size={8} color={C.red}>trauma</T>
          <T x={hx + 50} y={hy + hh + 14} size={8} color={C.amber}>{tx(t, "figShake_offx", "offset x / max")}</T>
        </svg>
      </div>
    </Figure>
  );
}
