"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, Slider, Sliders, C, T, f2 } from "@/components/lesson/kit/figure";
import { schedule, period, latency, SLOT_COLORS } from "./fifSim";

// ── What this figure shows ────────────────────────────────────────────────────
// The render loop on two lanes, CPU and GPU, for 1, 2 or 3 frames in flight.
// Each block is one frame, coloured by the slot (FrameData) it uses; grey
// stretches on the CPU lane are fence waits. With one frame the CPU and GPU
// take turns; with two they overlap and the period drops to the slower of
// the two. Switching per-frame resources off keeps two frames in flight but
// one command buffer and one uniform buffer: every place where the CPU
// writes them while the GPU is still reading them is marked in red.

const W = 640, X0 = 44, X1 = 628, T_WIN = 64, LANE = 24;
const Y = { cpu: 22, gpu: 22 + LANE + 16 };
const H = Y.gpu + LANE + 26;
const x = (ms: number) => X0 + (Math.min(ms, T_WIN) / T_WIN) * (X1 - X0);

export function FramesInFlightFigure({ t }: { t?: TrackTranslations }) {
  const [cpu, setCpu] = useState(6);
  const [gpu, setGpu] = useState(10);
  const [n, setN] = useState<"1" | "2" | "3">("1");
  const [perFrame, setPerFrame] = useState(true);
  const L = (k: string, en: string) => tx(t, `figVkFif_${k}`, en);

  const N = Number(n);
  const f = schedule({ frames: 40, cpu, gpu, inFlight: N });
  const per = period(f), lat = latency(f);
  const busy = (gpu / per) * 100;

  // Shared resources: the CPU records frame k (and writes the UBO at its start)
  // while the GPU may still be executing an earlier frame that uses the same ones.
  const hazards = !perFrame && N > 1
    ? f.flatMap(a => f.filter(b => b.k < a.k && b.ge > a.cs && b.gs < a.ce).map(b => ({ s: Math.max(a.cs, b.gs), e: Math.min(a.ce, b.ge) })))
    : [];
  const visible = f.filter(fr => fr.cs < T_WIN);

  const block = (s: number, e: number, y: number, color: string, label: string, key: string, dim = false) => {
    if (s >= T_WIN) return null;
    const a = x(s), w = x(e) - a;
    return (
      <g key={key}>
        <rect x={a} y={y + 2} width={Math.max(w, 0.8)} height={LANE - 4} rx={2.5} fill={color} fillOpacity={dim ? 0.12 : 0.3} stroke={color} strokeWidth={1} />
        {w > label.length * 4.4 + 4 && <T x={a + w / 2} y={y + 15.5} size={7.5} anchor="middle" color={C.fg}>{label}</T>}
      </g>
    );
  };

  return (
    <Figure
      title={L("title", "Frames in flight: CPU and GPU, overlapped")}
      head={<>
        <span className="text-[10px] font-mono text-[var(--text-muted)] self-center">kFramesInFlight</span>
        <Choice value={n} onChange={setN} options={[["1", "1"], ["2", "2"], ["3", "3"]] as const} />
      </>}
      controls={<>
        <Sliders>
          <Slider label={L("cpu", "CPU ms / frame")} value={cpu} min={1} max={20} step={0.5} onChange={setCpu} fmt={v => `${f2(v, 1)} ms`} />
          <Slider label={L("gpu", "GPU ms / frame")} value={gpu} min={1} max={20} step={0.5} onChange={setGpu} fmt={v => `${f2(v, 1)} ms`} />
        </Sliders>
        <Row>
          <Btn active={perFrame} onClick={() => setPerFrame(v => !v)}>{perFrame ? "☑" : "☐"} {L("perFrame", "per-frame command buffer, fence, UBO")}</Btn>
        </Row>
        <Row>
          <Readout>{L("period", "frame time")} {f2(per, 1)} ms</Readout>
          <Readout>{f2(1000 / per, 0)} fps</Readout>
          <Readout>{L("latency", "record → GPU done")} {f2(lat, 1)} ms</Readout>
          <Readout color={busy > 99 ? C.green : C.amber}>{L("busy", "GPU busy")} {f2(Math.min(busy, 100), 0)}%</Readout>
        </Row>
        {hazards.length > 0 && (
          <p className="text-[12.5px] leading-relaxed" style={{ color: C.red }}>
            {L("hazard", "Two frames in flight but one set of resources: the CPU re-records the only command buffer and rewrites the only uniform buffer while the GPU is still executing the previous frame from them (red). vkBeginCommandBuffer on a pending command buffer is a validation error; the uniform write is a silent race, and the cubes jump between two camera positions.")}
          </p>
        )}
      </>}
      note={L("note", "Time runs left to right over 64 ms; block colours are the frame slots. With one frame in flight the CPU waits for the GPU to finish before recording the next frame, and the GPU waits for the CPU to finish recording, so the frame time is CPU + GPU. With two, the CPU records frame k + 1 while the GPU runs frame k, and the frame time falls to the slower of the two. A third frame helps only when the times jitter; with steady times it adds latency, because the CPU runs further ahead of the GPU. Make the GPU slower than the CPU and watch the fence waits (grey) appear.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={6} y={Y.cpu + 15} size={9} bold color={C.fg}>CPU</T>
        <T x={6} y={Y.gpu + 15} size={9} bold color={C.fg}>GPU</T>
        {[0, 16, 32, 48, 64].map(ms => (
          <g key={ms}>
            <line x1={x(ms)} y1={Y.cpu - 2} x2={x(ms)} y2={Y.gpu + LANE + 2} stroke={C.grid} strokeWidth={0.8} />
            <T x={x(ms)} y={H - 8} size={7.5} anchor="middle">{ms} ms</T>
          </g>
        ))}
        {visible.map(fr => {
          const col = SLOT_COLORS[fr.k % N];
          return (
            <g key={fr.k}>
              {fr.cs - fr.wait > 0.05 && block(fr.wait, fr.cs, Y.cpu, "#94a3b8", L("wait", "wait"), `w${fr.k}`, true)}
              {block(fr.cs, fr.ce, Y.cpu, col, `${fr.k}`, `c${fr.k}`)}
              {block(fr.gs, fr.ge, Y.gpu, col, `${fr.k}`, `g${fr.k}`)}
            </g>
          );
        })}
        {hazards.filter(h => h.s < T_WIN).map((h, i) => (
          <rect key={i} x={x(h.s)} y={Y.cpu} width={Math.max(x(h.e) - x(h.s), 1)} height={Y.gpu + LANE - Y.cpu} fill={C.red} fillOpacity={0.22} stroke={C.red} strokeWidth={1} />
        ))}
      </svg>
    </Figure>
  );
}
