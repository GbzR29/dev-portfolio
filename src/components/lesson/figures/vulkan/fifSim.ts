// ── Frames-in-flight scheduler ────────────────────────────────────────────────
// The render loop of the Vulkan track as a list of intervals, for the figures
// of the Frames in Flight and Modern Vulkan chapters. Frame k uses slot
// k mod N. The CPU may start recording frame k once it has finished frame
// k − 1 and the fence of slot k mod N, signalled when frame k − N finished on
// the GPU, has been waited on. The GPU runs frames one after another in
// submission order. There is no vsync: the display is assumed not to limit
// the rate (MAILBOX or IMMEDIATE), so the numbers show CPU and GPU alone.

export type FrameTimes = {
  k: number;
  /** When the CPU reached the fence wait for this frame's slot. */
  wait: number;
  /** CPU recording (after the wait). */
  cs: number; ce: number;
  /** GPU execution. */
  gs: number; ge: number;
};

export type ScheduleOpts = {
  frames: number;       // how many frames to schedule
  cpu: number;          // ms of CPU work per frame
  gpu: number;          // ms of GPU work per frame
  inFlight: number;     // N
  /** Extra CPU time before recording frame k (e.g. a swapchain recreate). */
  extraCpu?: (k: number) => number;
  /** Frame k waits for the whole GPU to go idle (vkDeviceWaitIdle) before recording. */
  waitIdle?: (k: number) => boolean;
};

export function schedule(o: ScheduleOpts): FrameTimes[] {
  const out: FrameTimes[] = [];
  for (let k = 0; k < o.frames; k++) {
    const prevCpu = k > 0 ? out[k - 1].ce : 0;
    const fence = k >= o.inFlight ? out[k - o.inFlight].ge : 0;
    const idle = o.waitIdle?.(k) && k > 0 ? out[k - 1].ge : 0;
    const wait = prevCpu;
    const cs = Math.max(prevCpu, fence, idle) + (o.extraCpu?.(k) ?? 0);
    const ce = cs + o.cpu;
    const gs = Math.max(ce, k > 0 ? out[k - 1].ge : 0);
    out.push({ k, wait, cs, ce, gs, ge: gs + o.gpu });
  }
  return out;
}

/** Average frame period over the steady part of a schedule (the last half). */
export function period(f: FrameTimes[]) {
  const a = f[Math.floor(f.length / 2)], b = f[f.length - 1];
  return (b.ge - a.ge) / (b.k - a.k);
}

/** Average time from the start of recording to the end of GPU work. */
export function latency(f: FrameTimes[]) {
  const tail = f.slice(Math.floor(f.length / 2));
  return tail.reduce((s, x) => s + (x.ge - x.cs), 0) / tail.length;
}

/** Colours of the frame slots, reused so a slot keeps its colour on every lane. */
export const SLOT_COLORS = ["#3b82f6", "#f59e0b", "#a855f7"] as const;
