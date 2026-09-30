"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// One frame of the render loop on three lanes: the CPU, the GPU's graphics
// queue, and the swapchain image being drawn (who owns it at each moment).
// The fence and the two semaphores each prevent one specific overlap. Turn
// one off and the schedule is recomputed without that wait: the overlap it
// prevented appears in red, with what would go wrong on a real machine.

type Block = { s: number; e: number; label: string; color: string; hazard?: boolean };

const W = 620, X0 = 104, X1 = 608, T_END = 34, LANE = 26;
const VBLANKS = [14, 30];
const x = (ms: number) => X0 + (ms / T_END) * (X1 - X0);
const Y = { cpu: 30, gpu: 30 + LANE + 14, img: 30 + 2 * (LANE + 14) };
const H = Y.img + LANE + 34;

export function FrameSyncFigure({ t }: { t?: TrackTranslations }) {
  const [fence, setFence] = useState(true);
  const [acq, setAcq] = useState(true);
  const [rel, setRel] = useState(true);
  const L = (k: string, en: string) => tx(t, `figVkSync_${k}`, en);

  // ── The schedule ──
  const colorStart = acq ? 14 : 11;              // imageAvailable signals at the vblank (14)
  const gpuDone = colorStart + 10;
  const shownAt = rel ? 30 : 14;                 // first vblank after the image is handed over

  const cpu: Block[] = [
    { s: 0, e: 1, label: "", color: C.muted },
    { s: 1, e: 2, label: "", color: C.sky },
    { s: 2, e: 6, label: L("record", "record"), color: C.sky },
    { s: 6, e: 7, label: "", color: C.sky },
    { s: 7, e: 8, label: "", color: C.sky },
    ...(fence
      ? [{ s: 8, e: gpuDone, label: L("waitFence", "wait for fence"), color: C.muted },
         { s: gpuDone, e: gpuDone + 4, label: L("recordNext", "record N+1"), color: C.sky }]
      : [{ s: 8, e: 12, label: L("recordNext", "record N+1"), color: C.red, hazard: true }]),
  ];
  const gpu: Block[] = [
    { s: 7, e: 11, label: L("vertex", "vertex"), color: C.green },
    ...(acq ? [{ s: 11, e: 14, label: L("wait", "wait"), color: C.muted }] : []),
    { s: colorStart, e: gpuDone, label: L("color", "colour output"), color: C.green },
  ];
  const img: Block[] = [
    { s: 0, e: 14, label: L("scanPrev", "on screen (previous frame)"), color: C.purple },
    ...(!acq ? [{ s: 11, e: 14, label: "", color: C.red, hazard: true }] : []),
    { s: 14, e: gpuDone, label: rel ? L("rendering", "rendering") : "", color: C.amber },
    ...(!rel ? [{ s: 14, e: gpuDone, label: L("halfDrawn", "on screen, half drawn"), color: C.red, hazard: true }] : []),
    ...(rel ? [{ s: gpuDone, e: shownAt, label: L("queued", "queued"), color: C.amber }] : []),
    { s: Math.max(shownAt, gpuDone), e: T_END, label: L("shown", "on screen"), color: C.purple },
  ];

  const hazards = [
    !fence && L("hFence", "No fence wait: the CPU re-records the command buffer while the GPU is still executing it (the red block). That is undefined behaviour: the GPU may read half-written commands. The CPU also runs ahead without limit, queueing frame after frame."),
    !acq && L("hAcq", "No imageAvailable wait: colour output starts while the presentation engine is still scanning the image out. The screen shows pixels of the new frame mixed into the old one."),
    !rel && L("hRel", "No renderFinished wait: the presentation engine takes the image as soon as vkQueuePresentKHR is called and shows it at the next vblank, while the GPU is still drawing into it."),
  ].filter(Boolean) as string[];

  const lane = (y: number, blocks: Block[]) => blocks.map((b, k) => {
    const a = x(b.s), w = x(b.e) - a;
    return (
      <g key={k}>
        <rect x={a} y={y + 2} width={Math.max(w, 1)} height={LANE - 4} rx={3}
          fill={b.color} fillOpacity={b.hazard ? 0.45 : 0.25} stroke={b.hazard ? C.red : b.color} strokeWidth={b.hazard ? 1.8 : 1} />
        {b.label && w > 30 && <T x={a + w / 2} y={y + 17} size={8} anchor="middle" color={C.fg} bold={b.hazard}>{b.label}</T>}
      </g>
    );
  });
  const signal = (x1: number, y1: number, x2: number, y2: number, color: string, label: string) => (
    <g>
      <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#vksync-arrow)" />
      <T x={(x1 + x2) / 2 + 4} y={(y1 + y2) / 2 + 3} size={7.5} color={color} bold>{label}</T>
    </g>
  );

  return (
    <Figure
      title={L("title", "One frame: what each wait prevents")}
      head={<>
        <Btn active={fence} onClick={() => setFence(v => !v)}>inFlight fence</Btn>
        <Btn active={acq} onClick={() => setAcq(v => !v)}>imageAvailable</Btn>
        <Btn active={rel} onClick={() => setRel(v => !v)}>renderFinished</Btn>
      </>}
      controls={<>
        <Row>
          {["vkWaitForFences", "vkAcquireNextImageKHR", L("record", "record"), "vkQueueSubmit2", "vkQueuePresentKHR"].map((k, i) => (
            <span key={i} className="text-[10px] font-mono text-[var(--text-muted)]">{i + 1}. {k}</span>
          ))}
        </Row>
        {hazards.length === 0
          ? <p className="text-[12.5px] leading-relaxed" style={{ color: C.green }}>{L("ok", "Every overlap is prevented. The GPU waits only where it must (grey), the image is never written while it is on screen, never shown before it is finished, and the CPU never touches a command buffer the GPU is using.")}</p>
          : hazards.map((h, i) => <p key={i} className="text-[12.5px] leading-relaxed" style={{ color: C.red }}>{h}</p>)}
      </>}
      note={L("note", "Time runs left to right over two refreshes of a 60 Hz display (dashed lines are vblanks). CPU steps 1 to 5 are: wait for the previous frame's fence, acquire an image, record, submit, present. The submit tells the GPU to wait for imageAvailable only at the colour-output stage, so the vertex work starts early and only the pixel writes wait (grey). renderFinished holds the present back until the drawing is done, and the fence tells the CPU when the command buffer is free again. Turn the three off one by one.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <defs>
          <marker id="vksync-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.fg} />
          </marker>
        </defs>
        <T x={8} y={Y.cpu + 17} size={9} bold color={C.fg}>CPU</T>
        <T x={8} y={Y.gpu + 17} size={9} bold color={C.fg}>{L("gpuLane", "GPU queue")}</T>
        <T x={8} y={Y.img + 17} size={9} bold color={C.fg}>{L("imgLane", "swap image")}</T>
        {VBLANKS.map(v => (
          <g key={v}>
            <line x1={x(v)} y1={18} x2={x(v)} y2={Y.img + LANE + 4} stroke={C.axis} strokeDasharray="3 3" />
            <T x={x(v)} y={H - 16} size={7.5} anchor="middle">vblank</T>
          </g>
        ))}
        {[1, 2, 3, 4, 5].map((n, i) => <T key={n} x={x(i === 0 ? 0.5 : i === 1 ? 1.5 : i === 2 ? 4 : i === 3 ? 6.5 : 7.5)} y={Y.cpu - 3} size={7.5} anchor="middle" color={C.sky} bold>{n}</T>)}
        {lane(Y.cpu, cpu)}
        {lane(Y.gpu, gpu)}
        {lane(Y.img, img)}
        {acq && signal(x(14), Y.img + 2, x(14), Y.gpu + LANE - 2, C.purple, "imageAvailable")}
        {rel && signal(x(gpuDone), Y.gpu + LANE - 2, x(gpuDone) + 0.01, Y.img + 2, C.amber, "renderFinished")}
        {fence && signal(x(gpuDone) - 8, Y.gpu + 2, x(gpuDone) - 8, Y.cpu + LANE - 2, C.green, "fence")}
        <T x={X0} y={H - 4} size={7.5}>0 ms</T>
        <T x={X1} y={H - 4} size={7.5} anchor="end">{T_END} ms</T>
      </svg>
    </Figure>
  );
}
