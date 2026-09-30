"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T, f2 } from "@/components/lesson/kit/figure";
import { schedule } from "./fifSim";

// ── What this figure shows ────────────────────────────────────────────────────
// A window resize in the middle of the render loop, with two frames in
// flight. Frame R's acquire returns OUT_OF_DATE, so the CPU recreates the
// swapchain before recording it. Three ways to get rid of the old swapchain:
// wait for the whole device first (correct, but the GPU runs dry), destroy it
// at once (the GPU is still drawing frame R − 1 into one of its images), or
// retire it and destroy it when the fence proves the last frame that used it
// has finished (correct and no stall).

type Mode = "idle" | "now" | "retire";

const W = 640, X0 = 70, X1 = 628, T_WIN = 64, LANE = 22, R = 3, RECREATE = 3, N = 2;
const Y = { cpu: 20, gpu: 20 + LANE + 12, old: 20 + 2 * (LANE + 12), neu: 20 + 2 * (LANE + 12) + 18 };
const H = Y.neu + 16 + 24;
const x = (ms: number) => X0 + (Math.min(ms, T_WIN) / T_WIN) * (X1 - X0);
const OLD = C.purple, NEW = C.teal;

export function SwapchainRetireFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("retire");
  const L = (k: string, en: string) => tx(t, `figVkRetire_${k}`, en);

  const f = schedule({
    frames: 12, cpu: 5, gpu: 8, inFlight: N,
    extraCpu: k => (k === R ? RECREATE : 0),
    waitIdle: k => mode === "idle" && k === R,
  });
  const recreateEnd = f[R].cs;                                   // the new swapchain exists from here
  const destroyAt = mode === "retire" ? f[R - 1 + N].cs          // right after frame R + 1's fence wait
    : recreateEnd;
  const hazard = mode === "now" && f[R - 1].ge > destroyAt ? { s: destroyAt, e: f[R - 1].ge } : null;
  const gpuGap = f[R].gs - f[R - 1].ge;

  const blk = (s: number, e: number, y: number, h: number, color: string, label: string, key: string, dim = false) => {
    if (s >= T_WIN) return null;
    const a = x(s), w = x(e) - a;
    return (
      <g key={key}>
        <rect x={a} y={y + 1} width={Math.max(w, 0.8)} height={h - 2} rx={2.5} fill={color} fillOpacity={dim ? 0.12 : 0.3} stroke={color} strokeWidth={1} />
        {w > label.length * 4.4 + 4 && <T x={a + w / 2} y={y + h / 2 + 3} size={7.5} anchor="middle" color={C.fg}>{label}</T>}
      </g>
    );
  };

  return (
    <Figure
      title={L("title", "Resizing: when may the old swapchain go?")}
      head={<Choice value={mode} onChange={setMode} options={[["idle", "vkDeviceWaitIdle"], ["now", L("now", "destroy at once")], ["retire", L("retire", "retire, destroy later")]] as const} />}
      controls={<>
        <Row>
          <Readout color={gpuGap > 0.05 ? C.amber : C.green}>{L("gap", "GPU idle during the resize")} {f2(Math.max(gpuGap, 0), 1)} ms</Readout>
          <Readout color={hazard ? C.red : C.green}>{hazard ? L("bad", "old swapchain destroyed while in use") : L("ok", "no use after destroy")}</Readout>
        </Row>
        <p className="text-[12.5px] leading-relaxed" style={{ color: hazard ? C.red : "var(--text-main)" }}>
          {mode === "idle" && L("mIdle", "vkDeviceWaitIdle blocks the CPU until frame R − 1 has finished on the GPU. Safe, but the GPU then sits idle while the CPU recreates the swapchain and records frame R: the stall shows as a gap on the GPU lane, and during a drag-resize it happens on every frame.")}
          {mode === "now" && L("mNow", "The old swapchain and its image views are destroyed right after the new one is created, while the GPU is still drawing frame R − 1 into one of its images (red). The validation layer reports the views as in use by a command buffer; without it the result is undefined, often a device-lost error while resizing.")}
          {mode === "retire" && L("mRetire", "The old swapchain, its views, its semaphores and the depth image go into a retired list tagged with the last frame that may use them, R − 1. They are destroyed at the start of frame R + 1, right after the fence wait that proves frame R − 1 has finished. The GPU never stops.")}
        </p>
      </>}
      note={L("note", "Two frames in flight, 5 ms of CPU and 8 ms of GPU work per frame. Frame R = 3 finds the swapchain out of date and spends 3 ms recreating it before it records. Frames before R draw into the old swapchain (purple), frames from R on into the new one (teal). The bars below show how long each swapchain exists; the old one must outlive every frame that uses it.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={6} y={Y.cpu + 14} size={9} bold color={C.fg}>CPU</T>
        <T x={6} y={Y.gpu + 14} size={9} bold color={C.fg}>GPU</T>
        <T x={6} y={Y.old + 11} size={8} color={OLD}>{L("oldSc", "old swapchain")}</T>
        <T x={6} y={Y.neu + 11} size={8} color={NEW}>{L("newSc", "new swapchain")}</T>
        {[0, 16, 32, 48, 64].map(ms => (
          <g key={ms}>
            <line x1={x(ms)} y1={Y.cpu - 2} x2={x(ms)} y2={Y.neu + 16} stroke={C.grid} strokeWidth={0.8} />
            <T x={x(ms)} y={H - 8} size={7.5} anchor="middle">{ms} ms</T>
          </g>
        ))}
        {f.map(fr => {
          const col = fr.k < R ? OLD : NEW;
          return (
            <g key={fr.k}>
              {fr.k === R && blk(fr.cs - RECREATE, fr.cs, Y.cpu, LANE, C.amber, "", "rc")}
              {fr.k === R && <T x={x(fr.cs - RECREATE / 2)} y={Y.cpu - 3} size={7.5} anchor="middle" color={C.amber} bold>{L("recreate", "recreate")}</T>}
              {fr.k !== R && fr.cs - fr.wait > 0.05 && blk(fr.wait, fr.cs, Y.cpu, LANE, "#94a3b8", L("wait", "wait"), `w${fr.k}`, true)}
              {fr.k === R && fr.cs - RECREATE - fr.wait > 0.05 && blk(fr.wait, fr.cs - RECREATE, Y.cpu, LANE, "#94a3b8", mode === "idle" ? L("idleWait", "wait idle") : L("wait", "wait"), "wR", true)}
              {blk(fr.cs, fr.ce, Y.cpu, LANE, col, `${fr.k}`, `c${fr.k}`)}
              {blk(fr.gs, fr.ge, Y.gpu, LANE, col, `${fr.k}`, `g${fr.k}`)}
            </g>
          );
        })}
        {blk(0, destroyAt, Y.old, 16, OLD, "", "old")}
        {blk(recreateEnd, T_WIN, Y.neu, 16, NEW, "", "new")}
        <line x1={x(destroyAt)} y1={Y.cpu} x2={x(destroyAt)} y2={Y.old + 16} stroke={hazard ? C.red : OLD} strokeWidth={1.5} strokeDasharray="3 2" />
        <T x={x(destroyAt) + 3} y={Y.old + 11} size={7.5} color={hazard ? C.red : OLD} bold>{L("destroy", "destroy old")}</T>
        {hazard && <rect x={x(hazard.s)} y={Y.gpu} width={Math.max(x(hazard.e) - x(hazard.s), 1)} height={LANE} fill={C.red} fillOpacity={0.3} stroke={C.red} strokeWidth={1.2} />}
      </svg>
    </Figure>
  );
}
