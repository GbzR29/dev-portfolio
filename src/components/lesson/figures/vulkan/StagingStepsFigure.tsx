"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, C, T, hash2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The staging upload as a chain: the CPU array, the staging buffer, the
// device-local buffer and the vertex input that reads it. Every step of
// createDeviceBuffer can be unticked; the broken links turn red, the window
// shows what the quad would look like, and the list gives the message the
// validation layer (or synchronization validation) would print.

type Step = "srcUsage" | "memcpy" | "dstUsage" | "copy" | "barrier" | "fence" | "destroy";
type Look = "ok" | "stale" | "empty" | "garbage";

const STEPS: [Step, string][] = [
  ["srcUsage", "TRANSFER_SRC"], ["memcpy", "memcpy"], ["dstUsage", "TRANSFER_DST"], ["copy", "vkCmdCopyBuffer2"],
  ["barrier", "barrier"], ["fence", "vkWaitForFences"], ["destroy", "destroyBuffer(staging)"],
];

type Msg = { key: string; en: string; kind: "error" | "hazard" | "warn"; look: Look };
const MSGS: Record<Step, Msg> = {
  srcUsage: { key: "mSrc", kind: "error", look: "garbage", en: "vkCmdCopyBuffer2: srcBuffer was not created with VK_BUFFER_USAGE_TRANSFER_SRC_BIT. The copy's result is undefined." },
  memcpy: { key: "mMemcpy", kind: "warn", look: "empty", en: "No error at all: the staging memory held whatever was there, here zeros. All four vertices sit at (0, 0) and every triangle has zero area, so nothing is drawn." },
  dstUsage: { key: "mDst", kind: "error", look: "garbage", en: "vkCmdCopyBuffer2: dstBuffer was not created with VK_BUFFER_USAGE_TRANSFER_DST_BIT. The copy's result is undefined." },
  copy: { key: "mCopy", kind: "warn", look: "garbage", en: "No error: the device buffer was simply never written. Freshly allocated VRAM holds leftovers from earlier allocations, so the quad becomes random triangles, or nothing." },
  barrier: { key: "mBarrier", kind: "hazard", look: "stale", en: "SYNC-HAZARD-READ-AFTER-WRITE: vertex attribute reads of the buffer are not ordered after the copy's writes. On most desktop GPUs this happens to work; elsewhere, once in a while, a vertex is fetched before its new value is visible." },
  fence: { key: "mFence", kind: "error", look: "garbage", en: "vkDestroyBuffer: the staging buffer is in use by a command buffer, and vkFreeCommandBuffers: the command buffer is still pending. The copy reads memory that has already been freed." },
  destroy: { key: "mDestroy", kind: "warn", look: "ok", en: "The quad is fine, but the staging buffer and its memory leak. At vkDestroyDevice the layer lists every VkBuffer and VkDeviceMemory that was never destroyed." },
};
const RANK: Record<Look, number> = { ok: 0, stale: 1, empty: 2, garbage: 3 };

const W = 640, H = 236, BOXW = 128, BOXH = 44, BY = 14;
const BOXES = [{ x: 8, key: "bCpu", en: "kVertices[] (CPU)" }, { x: 176, key: "bStaging", en: "staging (system RAM)" }, { x: 344, key: "bDevice", en: "device buffer (VRAM)" }, { x: 504, key: "bInput", en: "vertex input" }];
const WIN = { x: 232, y: 90, w: 176, h: 132 };

export function StagingStepsFigure({ t }: { t?: TrackTranslations }) {
  const [on, setOn] = useState<Record<Step, boolean>>({ srcUsage: true, memcpy: true, dstUsage: true, copy: true, barrier: true, fence: true, destroy: true });
  const L = (k: string, en: string) => tx(t, `figVkStg_${k}`, en);

  const broken = STEPS.map(([s]) => s).filter(s => !on[s]);
  const look = broken.reduce<Look>((w, s) => (RANK[MSGS[s].look] > RANK[w] ? MSGS[s].look : w), "ok");
  const linkOk = [on.memcpy, on.copy && on.srcUsage && on.dstUsage && on.fence, on.barrier];

  // ── The picture in the window ──
  const px = (x: number) => WIN.x + (x + 1) / 2 * WIN.w, py = (y: number) => WIN.y + (y + 1) / 2 * WIN.h;
  const quad = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  if (look === "stale") quad[2] = [0.12, 0.2];                    // one vertex fetched before it was visible
  const cols = [C.red, C.green, C.blue, "#e5e7eb"];
  const poly = (idx: number[]) => idx.map(i => `${px(quad[i][0])},${py(quad[i][1])}`).join(" ");

  const colorFor = (m: Msg) => (m.kind === "warn" ? C.amber : C.red);
  const prefix = (m: Msg) => (m.kind === "error" ? "Validation Error: " : "");

  return (
    <Figure
      title={L("title", "Break the upload: untick a step")}
      controls={<>
        <Row>{STEPS.map(([s, label]) => <Btn key={s} active={on[s]} onClick={() => setOn(v => ({ ...v, [s]: !v[s] }))}>{on[s] ? "☑" : "☐"} {label}</Btn>)}</Row>
        {broken.length === 0
          ? <p className="text-[12.5px] leading-relaxed" style={{ color: C.green }}>{L("ok", "Every step is in place: the bytes reach VRAM, the barrier makes them visible to vertex input, the CPU waits before freeing the staging buffer, and nothing leaks. The validation layer is silent.")}</p>
          : broken.map(s => (
            <p key={s} className="text-[12.5px] leading-relaxed font-mono" style={{ color: colorFor(MSGS[s]) }}>
              {prefix(MSGS[s])}{L(MSGS[s].key, MSGS[s].en)}
            </p>
          ))}
      </>}
      note={L("note", "The top row is the path the vertices take; the window shows the frame drawn with the result. Some mistakes are loud (a validation error names the missing usage bit or the buffer still in use), some are silent (a skipped memcpy or copy gives no error at all, only a wrong picture), and one is intermittent: without the barrier the picture is usually right, and the error only appears with synchronization validation turned on. Untick several at once to see that the worst one decides the picture.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <defs>
          <marker id="vkstg-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.axis} />
          </marker>
        </defs>
        {BOXES.map((b, i) => (
          <g key={b.key}>
            <rect x={b.x} y={BY} width={BOXW} height={BOXH} rx={6} fill={C.bg} stroke={i === 2 ? C.green : C.axis} />
            <T x={b.x + BOXW / 2} y={BY + 26} size={8.5} anchor="middle" color={C.fg} bold>{L(b.key, b.en)}</T>
          </g>
        ))}
        {[["memcpy", 0], ["vkCmdCopyBuffer2", 1], [L("barrierLink", "barrier → read"), 2]].map(([label, i]) => {
          const a = BOXES[i as number].x + BOXW, b = BOXES[(i as number) + 1].x, ok = linkOk[i as number];
          return (
            <g key={i}>
              <line x1={a + 2} y1={BY + BOXH / 2} x2={b - 3} y2={BY + BOXH / 2} stroke={ok ? C.axis : C.red} strokeWidth={ok ? 1.4 : 2} strokeDasharray={ok ? undefined : "4 3"} markerEnd="url(#vkstg-arrow)" />
              <T x={(a + b) / 2} y={BY + BOXH + 14} size={7.5} anchor="middle" color={ok ? C.muted : C.red} bold={!ok}>{label}</T>
            </g>
          );
        })}
        {!on.destroy && <T x={BOXES[1].x + BOXW / 2} y={BY + BOXH + 26} size={7.5} anchor="middle" color={C.amber} bold>{L("leaked", "never freed")}</T>}

        {/* ── The frame ── */}
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={4} fill="#05060d" stroke={look === "ok" ? C.axis : look === "stale" ? C.amber : C.red} strokeWidth={look === "ok" ? 1 : 1.8} />
        {(look === "ok" || look === "stale") && (
          <g>
            <defs>
              <linearGradient id="vkstg-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={cols[0]} /><stop offset="0.5" stopColor={cols[1]} /><stop offset="1" stopColor={cols[2]} /></linearGradient>
              <linearGradient id="vkstg-g2" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stopColor={cols[2]} /><stop offset="0.5" stopColor={cols[3]} /><stop offset="1" stopColor={cols[0]} /></linearGradient>
            </defs>
            <polygon points={poly([0, 1, 2])} fill="url(#vkstg-g1)" opacity={0.9} />
            <polygon points={poly([2, 3, 0])} fill="url(#vkstg-g2)" opacity={0.9} />
          </g>
        )}
        {look === "garbage" && Array.from({ length: 7 }, (_, k) => {
          const p = (j: number) => `${WIN.x + hash2(k, j, 3) * WIN.w},${WIN.y + hash2(k, j, 9) * WIN.h}`;
          return <polygon key={k} points={`${p(0)} ${p(1)} ${p(2)}`} fill={[C.red, C.purple, C.teal, C.amber][k % 4]} opacity={0.55} />;
        })}
        <T x={WIN.x + WIN.w / 2} y={WIN.y - 6} size={8} anchor="middle">{L("frame", "the frame")}</T>
        <T x={WIN.x + WIN.w + 10} y={WIN.y + WIN.h / 2} size={9} bold color={look === "ok" ? C.green : look === "stale" ? C.amber : C.red}>
          {L(`look_${look}`, { ok: "correct", stale: "usually correct, sometimes not", empty: "nothing drawn", garbage: "undefined" }[look])}
        </T>
      </svg>
    </Figure>
  );
}
