"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// CPU time spent submitting one frame's draw calls. OpenGL: every draw goes
// through the driver on the one thread that owns the context, and the driver
// validates state, tracks hazards and may compile a shader variant on the spot.
// Vulkan: the application records command buffers on several threads with a
// thin driver underneath, then submits once; pipelines were compiled at load
// time. The per-draw costs are illustrative round numbers, not measurements.

const GL_US = 5;          // µs per draw: validation, state tracking, hazard checks
const VK_US = 1;          // µs per draw recorded into a command buffer
const VK_SUBMIT_US = 150; // one vkQueueSubmit + bookkeeping per frame
const HITCH_MS = 40;      // a shader variant compiled inside the draw call

const W = 600, BAR_H = 16, X0 = 110, X1 = 580, BUDGET = 1000 / 60;

export function DriverCostFigure({ t }: { t?: TrackTranslations }) {
  const [draws, setDraws] = useState(2000);
  const [threads, setThreads] = useState(4);
  const [hitch, setHitch] = useState(false);

  const glMs = (draws * GL_US) / 1000 + (hitch ? HITCH_MS : 0);
  const perThread = Math.ceil(draws / threads);
  const vkThread = (i: number) => (Math.min(perThread, Math.max(0, draws - i * perThread)) * VK_US) / 1000;
  const vkMs = vkThread(0) + VK_SUBMIT_US / 1000;
  const scale = Math.max(glMs, vkMs, BUDGET) * 1.08;
  const x = (ms: number) => X0 + (ms / scale) * (X1 - X0);

  const rows = 1 + threads;
  const H = 46 + rows * (BAR_H + 8) + 26;
  const vkY = 40 + BAR_H + 22;

  return (
    <Figure
      title={tx(t, "figVkCost_title", "CPU time to submit one frame")}
      head={<Btn active={hitch} onClick={() => setHitch(h => !h)}>{tx(t, "figVkCost_hitch", "new material this frame")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figVkCost_draws", "draw calls")} value={draws} min={100} max={20000} step={100} onChange={setDraws} fmt={v => String(v)} />
          <Slider label={tx(t, "figVkCost_threads", "Vulkan threads")} value={threads} min={1} max={8} step={1} onChange={setThreads} fmt={v => String(v)} />
        </Sliders>
        <Row>
          <Readout color={glMs > BUDGET ? C.red : C.green}>OpenGL {f2(glMs, 1)} ms</Readout>
          <Readout color={vkMs > BUDGET ? C.red : C.green}>Vulkan {f2(vkMs, 1)} ms</Readout>
          <Readout>{tx(t, "figVkCost_budget", "60 fps budget")} 16.7 ms</Readout>
        </Row>
      </>}
      note={tx(t, "figVkCost_note", "Illustrative costs: 5 µs per OpenGL draw, 1 µs per recorded Vulkan draw, 0.15 ms for one submit. Real numbers depend on the driver and on how much state changes between draws, but the shape is the point. OpenGL's work sits on one thread and grows with every draw; Vulkan's is smaller per draw and splits across threads. Turn on \"new material\": in OpenGL the driver may have to compile a shader variant in the middle of the frame, a visible hitch. In Vulkan that compilation happened when the pipeline was created, at load time.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <line x1={x(BUDGET)} y1={14} x2={x(BUDGET)} y2={H - 18} stroke={C.red} strokeDasharray="4 3" />
        <T x={x(BUDGET)} y={H - 6} size={8.5} anchor="middle" color={C.red}>16.7 ms</T>
        <T x={12} y={24} size={9} bold color={C.fg}>OpenGL</T>
        <T x={12} y={40 + 12} size={8}>{tx(t, "figVkCost_ctx", "context thread")}</T>
        <rect x={X0} y={40} width={x((draws * GL_US) / 1000) - X0} height={BAR_H} rx={3} fill={C.purple} fillOpacity={0.75} />
        {hitch && <rect x={x((draws * GL_US) / 1000 / 2)} y={40} width={x(HITCH_MS) - X0} height={BAR_H} rx={3} fill={C.red} fillOpacity={0.85} />}
        {hitch && <T x={x((draws * GL_US) / 1000 / 2) + 4} y={40 + 11.5} size={8} color="#fff" bold>{tx(t, "figVkCost_compile", "shader compile")}</T>}
        {hitch && <rect x={x((draws * GL_US) / 1000 / 2 + HITCH_MS)} y={40} width={x((draws * GL_US) / 1000 / 2) - X0} height={BAR_H} rx={3} fill={C.purple} fillOpacity={0.75} />}
        <T x={12} y={vkY - 6} size={9} bold color={C.fg}>Vulkan</T>
        {Array.from({ length: threads }, (_, i) => {
          const y = vkY + i * (BAR_H + 8), rec = vkThread(i);
          return (
            <g key={i}>
              <T x={12} y={y + 12} size={8}>{tx(t, "figVkCost_thread", "thread")} {i + 1}</T>
              {rec > 0 && <rect x={X0} y={y} width={x(rec) - X0} height={BAR_H} rx={3} fill={C.sky} fillOpacity={0.75} />}
              {i === 0 && <rect x={x(rec)} y={y} width={Math.max(2, x(VK_SUBMIT_US / 1000) - X0)} height={BAR_H} rx={2} fill={C.amber} />}
            </g>
          );
        })}
        <T x={X0} y={vkY - 6} size={8} color={C.amber}>{tx(t, "figVkCost_submit", "amber: vkQueueSubmit")}</T>
      </svg>
    </Figure>
  );
}
