"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// Every frame the CPU writes new per-frame data (instances, particles, UI
// vertices) into a buffer, and the GPU reads it later while executing that
// frame. If the CPU overwrites memory the GPU has not finished reading, the
// driver must make the CPU wait (implicit synchronisation):
//   same buffer   — frame i's write waits for the GPU to finish frame i − 1
//   orphaning     — glBufferData(NULL) hands out fresh storage: no wait, a
//                   little allocation work inside the driver
//   ring of N     — one persistently mapped buffer split into N regions; the
//                   CPU writes region i mod N after a fence says frame i − N is done
// Colours mark which region of memory each frame uses.

const FRAMES = 8, W = 620, LANE = 30, X0 = 70;
const REGION_COL = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
const MODES = ["same buffer", "orphaning", "persistent ring"] as const;

function schedule(mode: (typeof MODES)[number], cpu: number, gpu: number, ring: number) {
  const cS: number[] = [], wS: number[] = [], cE: number[] = [], gS: number[] = [], gE: number[] = [], region: number[] = [];
  const AHEAD = 3;
  for (let i = 0; i < FRAMES; i++) {
    const prev = i ? cE[i - 1] : 0;
    cS[i] = Math.max(prev, i >= AHEAD ? gE[i - AHEAD] : 0);                // driver's frame queue limit
    let free = 0;
    if (mode === "same buffer") free = i ? gE[i - 1] : 0;                   // the one buffer is still being read
    if (mode === "persistent ring") free = i >= ring ? gE[i - ring] : 0;    // glClientWaitSync on that region's fence
    wS[i] = Math.max(cS[i], free);
    const extra = mode === "orphaning" ? 0.4 : 0;                           // driver allocates / recycles storage
    cE[i] = wS[i] + cpu + extra;
    gS[i] = Math.max(cE[i], i ? gE[i - 1] : 0);
    gE[i] = gS[i] + gpu;
    region[i] = mode === "same buffer" ? 0 : mode === "orphaning" ? i % 4 : i % ring;
  }
  return { cS, wS, cE, gS, gE, region };
}

export function StreamingFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<(typeof MODES)[number]>("same buffer");
  const [cpu, setCpu] = useState(7);
  const [gpu, setGpu] = useState(9);
  const [ring, setRing] = useState(3);

  const s = schedule(mode, cpu, gpu, ring);
  const end = s.gE[FRAMES - 1] + 2;
  const X = (ms: number) => X0 + (ms / end) * (W - X0 - 10);
  const k = 3;
  const frameMs = (s.gE[FRAMES - 1] - s.gE[k]) / (FRAMES - 1 - k);
  const stall = s.wS.reduce((a, w, i) => a + (w - s.cS[i]), 0) / FRAMES;
  const lanes = [{ y: 18, label: "CPU" }, { y: 18 + LANE + 16, label: "GPU" }];
  const H = lanes[1].y + LANE + 26;

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figStream_title", "Writing Per-Frame Data Without Stalling")}
        </span>
        <div className="flex gap-1.5">{MODES.map(m => <button key={m} className={btn(mode === m)} onClick={() => setMode(m)}>{m}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Buffer streaming timeline">
          <defs>
            <pattern id="strWait" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#ef4444" strokeWidth="2" opacity="0.55" />
            </pattern>
          </defs>
          {lanes.map(l => (
            <g key={l.label}>
              <rect x={X0} y={l.y} width={W - X0 - 10} height={LANE} fill="var(--code-line)" opacity={0.35} rx={3} />
              <text x={X0 - 8} y={l.y + LANE / 2 + 3} textAnchor="end" fontSize="10" fontFamily="monospace" fill="var(--code-text)">{l.label}</text>
            </g>
          ))}
          {Array.from({ length: FRAMES }, (_, i) => {
            const c = REGION_COL[s.region[i]];
            return (
              <g key={i}>
                {s.wS[i] - s.cS[i] > 0.05 && <rect x={X(s.cS[i])} y={lanes[0].y} width={X(s.wS[i]) - X(s.cS[i])} height={LANE} fill="url(#strWait)" />}
                <rect x={X(s.wS[i])} y={lanes[0].y + 2} width={Math.max(1, X(s.cE[i]) - X(s.wS[i]))} height={LANE - 4} fill={c} rx={2} opacity={0.9} />
                <text x={X(s.wS[i]) + 3} y={lanes[0].y + LANE / 2 + 3} fontSize="9" fontFamily="monospace" fill="white">{i}</text>
                <rect x={X(s.gS[i])} y={lanes[1].y + 2} width={Math.max(1, X(s.gE[i]) - X(s.gS[i]))} height={LANE - 4} fill={c} rx={2} opacity={0.9} />
                <text x={X(s.gS[i]) + 3} y={lanes[1].y + LANE / 2 + 3} fontSize="9" fontFamily="monospace" fill="white">{i}</text>
              </g>
            );
          })}
          <text x={X0} y={H - 4} fontSize="8.5" fontFamily="monospace" fill="var(--code-muted)">0 ms</text>
          <text x={W - 10} y={H - 4} fontSize="8.5" fontFamily="monospace" fill="var(--code-muted)" textAnchor="end">{end.toFixed(0)} ms</text>
          <rect x={X0 + 60} y={H - 12} width={10} height={8} fill="url(#strWait)" />
          <text x={X0 + 74} y={H - 4} fontSize="8.5" fontFamily="monospace" fill="var(--code-muted)">{tx(t, "figStream_wait", "CPU waiting for the buffer")}</text>
          <text x={W - 70} y={H - 4} fontSize="8.5" fontFamily="monospace" fill="var(--code-muted)" textAnchor="end">{tx(t, "figStream_colour", "colour = memory region")}</text>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["CPU ms", cpu, setCpu, 1, 20, 0.5], ["GPU ms", gpu, setGpu, 1, 20, 0.5], ...(mode === "persistent ring" ? [["ring regions", ring, setRing, 1, 4, 1] as const] : [])] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {mode === "same buffer"
              ? tx(t, "figStream_sameNote", "Overwriting the buffer the GPU is still reading forces the driver to wait until the previous frame is done. CPU and GPU take turns instead of overlapping, and the frame costs roughly CPU + GPU. Some drivers hide it by secretly copying the data, which costs memory bandwidth instead.")
              : mode === "orphaning"
                ? tx(t, "figStream_orphanNote", "glBufferData with a null pointer detaches the old storage, which the GPU keeps until it is done, and gives you a fresh block. The overlap is back. The price is a little driver work per frame and no control over how many copies exist.")
                : ring === 1
                  ? tx(t, "figStream_ring1Note", "A ring with one region is just the same-buffer case done by hand: the fence wait blocks exactly like the driver did.")
                  : tx(t, "figStream_ringNote", "With a persistently mapped buffer of N regions, the CPU writes region i mod N and waits on the fence placed after frame i − N. With 3 regions that fence has almost always signalled already, so the wait costs nothing, and there is no driver work and no copy. This is the AZDO way (GL 4.4 glBufferStorage).")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[200px]">
          <div>frame time = <span className="text-[var(--primary)]">{frameMs.toFixed(1)} ms</span></div>
          <div>{tx(t, "figStream_avgStall", "avg CPU stall")} = <span className={stall > 0.5 ? "text-red-400" : "text-[#22c55e]"}>{stall.toFixed(1)} ms</span></div>
          <div>{tx(t, "figStream_ideal", "ideal (overlap)")} = {Math.max(cpu, gpu).toFixed(1)} ms</div>
        </div>
      </div>
    </figure>
  );
}
