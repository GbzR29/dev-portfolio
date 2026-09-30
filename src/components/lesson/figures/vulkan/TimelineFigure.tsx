"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, C, T, f2 } from "@/components/lesson/kit/figure";
import { schedule, SLOT_COLORS } from "./fifSim";

// ── What this figure shows ────────────────────────────────────────────────────
// The same render loop as the Frames in Flight figure, synchronised by one
// timeline semaphore instead of one fence per slot. Frame k's submit signals
// the value k + 1 when it finishes, so the counter (top) climbs by one per
// finished frame and never goes back. Before recording frame m the CPU waits
// for the value m − N + 1. The time cursor reads the counter and shows, for
// comparison, the state the per-slot fences would be in at that moment.

const W = 640, X0 = 60, X1 = 628, T_WIN = 56, LANE = 20;
const PLOT = { top: 14, h: 70 };
const Y = { cpu: PLOT.top + PLOT.h + 16, gpu: PLOT.top + PLOT.h + 16 + LANE + 8 };
const H = Y.gpu + LANE + 24;
const x = (ms: number) => X0 + (Math.min(Math.max(ms, 0), T_WIN) / T_WIN) * (X1 - X0);

export function TimelineFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState<"2" | "3">("2");
  const [at, setAt] = useState(23);
  const L = (k: string, en: string) => tx(t, `figVkTl_${k}`, en);

  const N = Number(n);
  const f = schedule({ frames: 14, cpu: 4, gpu: 7, inFlight: N });
  const vis = f.filter(fr => fr.wait < T_WIN);
  const maxV = f.filter(fr => fr.ge <= T_WIN).length + 1;
  const vy = (v: number) => PLOT.top + PLOT.h - (v / maxV) * PLOT.h;

  // ── State at the cursor ──
  const counter = f.filter(fr => fr.ge <= at).length;               // frame k signals k + 1 on completion
  const cur = f.find(fr => fr.wait <= at && at < fr.ce);
  const waitingFor = cur && at < cur.cs && cur.k >= N ? cur.k - N + 1 : null;
  const fences = Array.from({ length: N }, (_, s) => !f.some(fr => fr.k % N === s && fr.cs <= at && at < fr.ge));

  // Counter as a step line
  let d = `M${x(0)} ${vy(0)}`, v = 0;
  for (const fr of f) {
    if (fr.ge > T_WIN) break;
    d += ` L${x(fr.ge)} ${vy(v)} L${x(fr.ge)} ${vy(++v)}`;
  }
  d += ` L${x(T_WIN)} ${vy(v)}`;

  const blk = (s: number, e: number, y: number, color: string, label: string, key: string, dim = false) => {
    if (s >= T_WIN) return null;
    const a = x(s), w = x(e) - a;
    return (
      <g key={key}>
        <rect x={a} y={y + 1} width={Math.max(w, 0.8)} height={LANE - 2} rx={2.5} fill={color} fillOpacity={dim ? 0.12 : 0.3} stroke={color} strokeWidth={1} />
        {w > label.length * 4.4 + 4 && <T x={a + w / 2} y={y + LANE / 2 + 3} size={7.5} anchor="middle" color={C.fg}>{label}</T>}
      </g>
    );
  };

  return (
    <Figure
      title={L("title", "A timeline semaphore: one counter instead of a fence per frame")}
      head={<>
        <span className="text-[10px] font-mono text-[var(--text-muted)] self-center">kFramesInFlight</span>
        <Choice value={n} onChange={setN} options={[["2", "2"], ["3", "3"]] as const} />
      </>}
      controls={<>
        <Slider label={L("time", "time")} value={at} min={0} max={T_WIN} step={0.25} onChange={setAt} fmt={v => `${f2(v, 1)} ms`} />
        <Row>
          <Readout color={C.green}>{L("counter", "counter")} = {counter}</Readout>
          <Readout>{waitingFor !== null
            ? `CPU: vkWaitSemaphores(≥ ${waitingFor})`
            : cur && at >= cur.cs ? `CPU: ${L("recording", "recording frame")} ${cur.k}` : `CPU: ${L("idle", "idle")}`}</Readout>
          <Readout color={C.muted}>{L("fences", "the fences would be")}: {fences.map((s, i) => `${i}${s ? "●" : "○"}`).join("  ")}</Readout>
        </Row>
      </>}
      note={L("note", "Top: the value of the timeline semaphore over time. Frame k's submit signals k + 1 when the GPU finishes it, so the value is always the number of finished frames. Frame m waits for m − N + 1 (the dashed levels), which is the moment frame m − N finished: the same wait the per-slot fence gave, expressed as one number. No reset is needed and any number of waits can refer to the same counter, from the CPU (vkWaitSemaphores) or from other submits. The fence readout shows what N fences would say at the cursor (● signalled, ○ not): N objects to keep track of instead of one value.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={6} y={PLOT.top + 10} size={8} bold color={C.fg}>{L("value", "value")}</T>
        {Array.from({ length: maxV + 1 }, (_, i) => (
          <g key={i}>
            <line x1={X0} x2={X1} y1={vy(i)} y2={vy(i)} stroke={C.grid} strokeWidth={0.6} />
            {i % 2 === 0 && <T x={X0 - 6} y={vy(i) + 3} size={7} anchor="end">{i}</T>}
          </g>
        ))}
        {vis.filter(fr => fr.k >= N && fr.cs > fr.wait + 0.05).map(fr => (
          <g key={`w${fr.k}`}>
            <line x1={x(fr.wait)} x2={x(fr.cs)} y1={vy(fr.k - N + 1)} y2={vy(fr.k - N + 1)} stroke={SLOT_COLORS[fr.k % N]} strokeWidth={1.4} strokeDasharray="3 2" />
          </g>
        ))}
        <path d={d} fill="none" stroke={C.green} strokeWidth={2} />
        <T x={6} y={Y.cpu + 13} size={9} bold color={C.fg}>CPU</T>
        <T x={6} y={Y.gpu + 13} size={9} bold color={C.fg}>GPU</T>
        {vis.map(fr => {
          const col = SLOT_COLORS[fr.k % N];
          return (
            <g key={fr.k}>
              {fr.cs - fr.wait > 0.05 && blk(fr.wait, fr.cs, Y.cpu, "#94a3b8", `≥ ${fr.k - N + 1}`, `wt${fr.k}`, true)}
              {blk(fr.cs, fr.ce, Y.cpu, col, `${fr.k}`, `c${fr.k}`)}
              {blk(fr.gs, fr.ge, Y.gpu, col, `${fr.k} → ${fr.k + 1}`, `g${fr.k}`)}
            </g>
          );
        })}
        <line x1={x(at)} x2={x(at)} y1={PLOT.top - 4} y2={Y.gpu + LANE + 2} stroke={C.amber} strokeWidth={1.5} />
        {[0, 14, 28, 42, 56].map(ms => <T key={ms} x={x(ms)} y={H - 6} size={7.5} anchor="middle">{ms} ms</T>)}
      </svg>
    </Figure>
  );
}
