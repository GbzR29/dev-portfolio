"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// One instanced draw of a 3-vertex triangle. Two per-instance buffers feed it:
// offsets[] with divisor 1 (each instance its own slot) and colors[] with a
// divisor you choose. The element an instance reads is
//   floor(gl_InstanceID / divisor) + baseInstance
// so divisor 2 makes pairs of instances share a colour, and baseInstance
// shifts where both buffers start reading without changing gl_InstanceID.
// Tap an instance to see the indices it fetches.

const N_SLOTS = 16, COLS = 8;
const PALETTE = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#14b8a6", "#0ea5e9", "#3b82f6",
  "#6366f1", "#a855f7", "#ec4899", "#f43f5e", "#a3a3a3", "#78716c", "#facc15", "#2dd4bf"];
const W = 620, CW = 62, CH = 46, GX = 62, GY = 8, SX = 70, SW = 34, SY0 = 126, SY1 = 168;

export function DivisorFigure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figDivisor_${k}`, en);
  const [n, setN] = useState(8);
  const [div, setDiv] = useState(2);
  const [base, setBase] = useState(0);
  const [sel, setSel] = useState(5);
  const s = Math.min(sel, n - 1);

  const offIdx = (i: number) => i + base;
  const colIdx = (i: number) => Math.floor(i / div) + base;
  const usedOff = new Set(Array.from({ length: n }, (_, i) => offIdx(i)));
  const usedCol = new Set(Array.from({ length: n }, (_, i) => colIdx(i)));

  const tri = (cx: number, cy: number) => `${cx},${cy - 15} ${cx - 15},${cy + 12} ${cx + 15},${cy + 12}`;

  const strip = (y: number, label: string, used: Set<number>, pick: number, fill: (k: number) => string, text: (k: number) => string) => (
    <g>
      <T x={SX - 6} y={y + 15} size={9} anchor="end" color={C.fg}>{label}</T>
      {Array.from({ length: N_SLOTS }, (_, k) => (
        <g key={k} opacity={used.has(k) ? 1 : 0.3}>
          <rect x={SX + k * SW} y={y} width={SW - 3} height={22} rx={3} fill={fill(k)} fillOpacity={0.85}
            stroke={k === pick ? C.fg : "none"} strokeWidth={2} />
          <T x={SX + k * SW + (SW - 3) / 2} y={y + 14.5} size={8.5} anchor="middle" color="#fff" bold>{text(k)}</T>
        </g>
      ))}
    </g>
  );

  return (
    <Figure
      title={L("title", "Which element does each instance read?")}
      controls={<>
        <Sliders>
          <Slider label={L("count", "instances")} value={n} min={1} max={12} step={1} onChange={setN} fmt={v => `${v}`} />
          <Slider label={L("div", "colors divisor")} value={div} min={1} max={4} step={1} onChange={setDiv} fmt={v => `${v}`} />
          <Slider label={L("base", "baseInstance")} value={base} min={0} max={4} step={1} onChange={setBase} fmt={v => `${v}`} />
        </Sliders>
        <Row>
          <Readout>gl_InstanceID = {s}</Readout>
          <Readout color={C.sky}>offsets[{s} + {base}] = offsets[{offIdx(s)}]</Readout>
          <Readout color={PALETTE[colIdx(s)]}>colors[⌊{s}/{div}⌋ + {base}] = colors[{colIdx(s)}]</Readout>
          <Readout>{L("vs", "vertex shader runs")}: 3 × {n} = {3 * n}</Readout>
        </Row>
      </>}
      note={L("note", "One draw call, glDrawArraysInstancedBaseInstance(GL_TRIANGLES, 0, 3, count, baseInstance). The three vertex positions are read per vertex (divisor 0) and are the same for every instance. offsets[] has divisor 1, so instance i reads element i + baseInstance and every triangle lands in its own cell. colors[] advances only every divisor instances: with divisor 2, instances 0 and 1 share colors[0], 2 and 3 share colors[1]. baseInstance shifts where both per-instance buffers start reading, which lets many draws share one big buffer, but gl_InstanceID itself still counts from 0 (GLSL 4.60 adds gl_BaseInstance if the shader needs it). Faded cells are never read by this draw.")}
    >
      <svg viewBox={`0 0 ${W} 196`} className="w-full h-auto" role="img">
        {Array.from({ length: N_SLOTS }, (_, k) => {
          const x = GX + (k % COLS) * CW, y = GY + Math.floor(k / COLS) * (CH + 6);
          return <rect key={k} x={x} y={y} width={CW - 4} height={CH} rx={4} fill="none" stroke="var(--border)" strokeDasharray="3 3" />;
        })}
        {Array.from({ length: n }, (_, i) => {
          const k = offIdx(i), x = GX + (k % COLS) * CW + (CW - 4) / 2, y = GY + Math.floor(k / COLS) * (CH + 6) + CH / 2 + 2;
          return <g key={i} onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
            <rect x={x - (CW - 4) / 2} y={y - CH / 2 - 2} width={CW - 4} height={CH} fill="transparent" />
            <polygon points={tri(x, y)} fill={PALETTE[colIdx(i)]} stroke={i === s ? C.fg : "none"} strokeWidth={2.5} />
            <T x={x + 17} y={y - 10} size={8}>{i}</T>
          </g>;
        })}
        {strip(SY0, "offsets[]", usedOff, offIdx(s), () => C.sky, k => `${k}`)}
        {strip(SY1, "colors[]", usedCol, colIdx(s), k => PALETTE[k], k => `${k}`)}
      </svg>
    </Figure>
  );
}
