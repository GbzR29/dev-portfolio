"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Slider, Sliders, Readout, Btn, Row, T, C, useRaf, useRerender, svgPoint } from "../../kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The pool's update rule on a 1D row of 120 cells, so every cell is visible:
// velocity += C²·(left + right − 2·height), then height += velocity. Click to
// drop a bump. Above C² = 1 (the 1D limit; 0.5 in 2D) the shortest wave the
// grid holds grows every step instead of travelling, and the row blows up.

const N = 120, W = 560, H = 190, MID = H / 2, SCALE = 70;
const STEPS_PER_S = 60;

export function WaveStringFigure({ t }: { t?: TrackTranslations }) {
  const [c2, setC2] = useState(0.8);
  const [damping, setDamping] = useState(0.998);
  const [playing, setPlaying] = useState(true);
  // Starts with one bump in the middle
  const h = useRef(Float64Array.from({ length: N }, (_, i) => {
    const r = Math.abs(i - N / 2) / 6;
    return r < 1 ? 0.5 + 0.5 * Math.cos(Math.PI * r) : 0;
  }));
  const v = useRef(new Float64Array(N));
  const acc = useRef(0);
  const rerender = useRerender();

  const bump = (at: number, width = 6, amp = 1) => {
    for (let i = 0; i < N; i++) {
      const r = Math.abs(i - at) / width;
      if (r < 1) h.current[i] += amp * (0.5 + 0.5 * Math.cos(Math.PI * r));
    }
  };
  const reset = () => { h.current.fill(0); v.current.fill(0); bump(N / 2); rerender(); };

  const ref = useRaf(playing, dt => {
    acc.current += dt * STEPS_PER_S;
    const H0 = h.current, V = v.current;
    while (acc.current >= 1) {
      acc.current -= 1;
      for (let i = 0; i < N; i++) {
        // Outside the row, the neighbour is the end cell itself: the ends reflect
        const l = H0[Math.max(i - 1, 0)], r = H0[Math.min(i + 1, N - 1)];
        V[i] = (V[i] + c2 * (l + r - 2 * H0[i])) * damping;
      }
      for (let i = 0; i < N; i++) H0[i] += V[i];
    }
    rerender();
  });

  const x = (i: number) => 10 + (i / (N - 1)) * (W - 20);
  const peak = h.current.reduce((m, y) => Math.max(m, Math.abs(y)), 0);
  const blown = !Number.isFinite(peak) || peak > 50;
  const y = (v: number) => MID - Math.max(-1.3, Math.min(1.3, v)) * SCALE;

  return (
    <Figure title={tx(t, "figString_title", "The update rule, in one dimension")}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figString_c2", "C² = c²Δt²/Δx²")} value={c2} min={0.05} max={1.2} step={0.01} onChange={setC2} width="w-32" />
          <Slider label={tx(t, "figString_damp", "damping")} value={damping} min={0.97} max={1} step={0.001} onChange={setDamping} fmt={v => v.toFixed(3)} width="w-32" />
        </Sliders>
        <Row>
          <Btn active={playing} onClick={() => setPlaying(p => !p)}>{playing ? "❚❚ pause" : "▶ play"}</Btn>
          <Btn onClick={reset}>{tx(t, "figString_reset", "reset")}</Btn>
          <Readout color={c2 > 1 ? C.red : C.green}>
            {c2 > 1 ? tx(t, "figString_unstable", "unstable: C² > 1") : tx(t, "figString_stable", "stable: C² ≤ 1")}
          </Readout>
          <Readout>{tx(t, "figString_speed", "speed")} = √C² = {Math.sqrt(c2).toFixed(2)} {tx(t, "figString_cells", "cells per step")}</Readout>
        </Row>
      </>}
      note={tx(t, "figString_note", "Click the row to drop a bump. Each bump splits into two halves running apart at √C² cells per step, and they bounce off the ends. Push C² past 1 and a zigzag one cell wide appears and grows, whatever the damping: each step now overshoots more than the last. In 2D each cell has four neighbours instead of two, and the limit is C² ≤ 0.5.")}>
      <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block cursor-crosshair"
        onPointerDown={e => {
          const pt = svgPoint(e.currentTarget, e);
          if (blown) { h.current.fill(0); v.current.fill(0); }
          bump(((pt.x - 10) / (W - 20)) * (N - 1));
          rerender();
        }}>
        <line x1={0} x2={W} y1={MID} y2={MID} stroke={C.grid} />
        {Array.from(h.current, (hv, i) => (
          <line key={i} x1={x(i)} x2={x(i)} y1={MID} y2={y(hv)} stroke={C.sky} strokeWidth={2} opacity={0.35} />
        ))}
        <polyline fill="none" stroke={blown ? C.red : C.sky} strokeWidth={1.8}
          points={Array.from(h.current, (hv, i) => `${x(i).toFixed(1)},${y(Number.isFinite(hv) ? hv : 0).toFixed(1)}`).join(" ")} />
        {blown && <T x={W / 2} y={24} anchor="middle" color={C.red}>{tx(t, "figString_blown", "blown up: click to start again")}</T>}
      </svg>
      </div>
    </Figure>
  );
}
