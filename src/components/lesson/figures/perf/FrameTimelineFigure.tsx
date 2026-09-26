"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// The CPU and the GPU are two workers on an assembly line. The CPU records
// frame i while the GPU executes frame i − 1, and the display flips at vblank.
// This models the rules the driver enforces:
//   • the GPU starts frame i after the CPU submitted it, after it finished
//     frame i − 1, and (double buffering) after frame i − 1 was flipped
//   • the CPU may run at most `ahead` frames in front of the GPU
//   • a readback (glReadPixels, glGetQueryObject without waiting a frame…)
//     blocks the CPU until the GPU has finished that very frame
// From the resulting schedule it measures frame time, latency and who waits.

const FRAMES = 9, VBLANK = 1000 / 60, W = 620, LANE = 30, X0 = 70;
const COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

function schedule(cpu: number, gpu: number, ahead: number, vsync: boolean, readback: boolean) {
  const cS: number[] = [], cE: number[] = [], gS: number[] = [], gE: number[] = [], flip: number[] = [], wait: number[] = [];
  for (let i = 0; i < FRAMES; i++) {
    const prevCpu = i ? cE[i - 1] : 0;
    const throttle = i - ahead >= 0 ? gE[i - ahead] : 0;          // too far ahead: wait for the GPU
    cS[i] = Math.max(prevCpu, throttle);
    wait[i] = cS[i] - prevCpu;
    const submit = cS[i] + cpu;
    gS[i] = Math.max(submit, i ? gE[i - 1] : 0, i ? flip[i - 1] : 0);
    gE[i] = gS[i] + gpu;
    flip[i] = vsync ? Math.ceil(gE[i] / VBLANK - 1e-9) * VBLANK : gE[i];
    cE[i] = readback ? Math.max(submit, gE[i]) + 0.3 : submit;       // readback: sit until this frame is done
  }
  return { cS, cE, gS, gE, flip, wait };
}

export function FrameTimelineFigure({ t }: { t?: TrackTranslations }) {
  const [cpu, setCpu] = useState(6);
  const [gpu, setGpu] = useState(11);
  const [ahead, setAhead] = useState(2);
  const [vsync, setVsync] = useState(true);
  const [readback, setReadback] = useState(false);

  const s = schedule(cpu, gpu, ahead, vsync, readback);
  const end = s.flip[FRAMES - 1] + 4;
  const X = (ms: number) => X0 + (ms / end) * (W - X0 - 10);

  // Steady state from the last few frames
  const k = FRAMES - 4;
  const frameMs = (s.flip[FRAMES - 1] - s.flip[k]) / (FRAMES - 1 - k);
  const latency = s.flip[FRAMES - 1] - s.cS[FRAMES - 1];
  const cpuBusy = (cpu * (FRAMES - 1 - k)) / (s.cS[FRAMES - 1] - s.cS[k]);
  const gpuBusy = (gpu * (FRAMES - 1 - k)) / (s.gS[FRAMES - 1] - s.gS[k]);
  const bound = readback ? "sync (CPU waits for GPU)" : vsync && frameMs > Math.max(cpu, gpu) + 0.5 ? "vsync" : gpu >= cpu ? "GPU" : "CPU";

  const lanes = [
    { y: 20, label: "CPU" },
    { y: 20 + LANE + 14, label: "GPU" },
    { y: 20 + 2 * (LANE + 14), label: "display" },
  ];
  const H = lanes[2].y + LANE + 26;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figFrameTl_title", "CPU, GPU and Display — Who Waits for Whom")}
        </span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Frame timeline">
          <defs>
            <pattern id="ftlWait" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
            </pattern>
          </defs>
          {lanes.map(l => (
            <g key={l.label}>
              <rect x={X0} y={l.y} width={W - X0 - 10} height={LANE} fill="var(--code-line)" opacity={0.35} rx={3} />
              <text x={X0 - 8} y={l.y + LANE / 2 + 3} textAnchor="end" fontSize="10" fontFamily="monospace" fill="var(--code-text)">{l.label}</text>
            </g>
          ))}
          {vsync && Array.from({ length: Math.floor(end / VBLANK) + 1 }, (_, i) => (
            <line key={i} x1={X(i * VBLANK)} y1={12} x2={X(i * VBLANK)} y2={H - 16} stroke="var(--code-muted)" strokeDasharray="2 3" opacity={0.5} />
          ))}
          {Array.from({ length: FRAMES }, (_, i) => {
            const c = COLORS[i % COLORS.length];
            const shownUntil = i + 1 < FRAMES ? s.flip[i + 1] : end;
            return (
              <g key={i}>
                {s.wait[i] > 0.05 && <rect x={X(s.cS[i] - s.wait[i])} y={lanes[0].y} width={X(s.cS[i]) - X(s.cS[i] - s.wait[i])} height={LANE} fill="url(#ftlWait)" />}
                <rect x={X(s.cS[i])} y={lanes[0].y + 2} width={Math.max(1, X(s.cS[i] + cpu) - X(s.cS[i]))} height={LANE - 4} fill={c} rx={2} />
                {readback && s.cE[i] - (s.cS[i] + cpu) > 0.05 && (
                  <rect x={X(s.cS[i] + cpu)} y={lanes[0].y} width={X(s.cE[i]) - X(s.cS[i] + cpu)} height={LANE} fill="url(#ftlWait)" />
                )}
                <text x={X(s.cS[i]) + 3} y={lanes[0].y + LANE / 2 + 3} fontSize="9" fontFamily="monospace" fill="white">{i}</text>
                <rect x={X(s.gS[i])} y={lanes[1].y + 2} width={Math.max(1, X(s.gE[i]) - X(s.gS[i]))} height={LANE - 4} fill={c} rx={2} />
                <text x={X(s.gS[i]) + 3} y={lanes[1].y + LANE / 2 + 3} fontSize="9" fontFamily="monospace" fill="white">{i}</text>
                <line x1={X(s.cS[i] + cpu)} y1={lanes[0].y + LANE} x2={X(s.gS[i])} y2={lanes[1].y} stroke={c} strokeWidth={0.8} opacity={0.6} />
                <rect x={X(s.flip[i])} y={lanes[2].y + 2} width={Math.max(1, X(shownUntil) - X(s.flip[i]))} height={LANE - 4} fill={c} opacity={0.55} rx={2} />
                <text x={X(s.flip[i]) + 3} y={lanes[2].y + LANE / 2 + 3} fontSize="9" fontFamily="monospace" fill="white">{i}</text>
              </g>
            );
          })}
          <text x={X0} y={H - 4} fontSize="8.5" fontFamily="monospace" fill="var(--code-muted)">0 ms</text>
          <text x={W - 10} y={H - 4} fontSize="8.5" fontFamily="monospace" fill="var(--code-muted)" textAnchor="end">{end.toFixed(0)} ms</text>
          <rect x={X0 + 60} y={H - 12} width={10} height={8} fill="url(#ftlWait)" />
          <text x={X0 + 74} y={H - 4} fontSize="8.5" fontFamily="monospace" fill="var(--code-muted)">{tx(t, "figFrameTl_waiting", "CPU blocked")}</text>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["CPU ms/frame", cpu, setCpu, 1, 30, 0.5], ["GPU ms/frame", gpu, setGpu, 1, 30, 0.5], ["frames ahead", ahead, setAhead, 1, 3, 1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
          <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={vsync} onChange={e => setVsync(e.target.checked)} className="accent-[var(--primary)]" />vsync 60 Hz</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={readback} onChange={e => setReadback(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figFrameTl_readback", "read a GPU result back every frame")}</label>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {readback
              ? tx(t, "figFrameTl_readNote", "A readback forces the CPU to wait for the GPU to finish the frame it just submitted, so the two can no longer overlap: the frame costs CPU + GPU instead of the larger of the two. This is the most common way to halve a frame rate without noticing.")
              : tx(t, "figFrameTl_note", "The two processors overlap: while the GPU draws frame i, the CPU already prepares i + 1. The frame rate is set by the slower one (the bottleneck) and making the other faster changes nothing. With vsync the result is also snapped to multiples of 16.7 ms: at 17 ms of GPU work you drop straight to 30 fps. More frames ahead smooths hitches but adds latency.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[210px]">
          <div>frame time = <span className="text-[var(--primary)]">{frameMs.toFixed(1)} ms</span></div>
          <div>fps = <span className="text-[var(--primary)]">{(1000 / frameMs).toFixed(1)}</span></div>
          <div>{tx(t, "figFrameTl_latency", "input → screen")} = {latency.toFixed(1)} ms</div>
          <div>CPU busy {Math.min(100, cpuBusy * 100).toFixed(0)}% · GPU busy {Math.min(100, gpuBusy * 100).toFixed(0)}%</div>
          <div className="mt-1">bound: <span className="text-amber-400">{bound}</span></div>
        </div>
      </div>
    </FigureShell>
  );
}
