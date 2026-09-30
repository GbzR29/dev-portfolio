// ── Swapchain presentation simulator ─────────────────────────────────────────
// Event-driven model of a GPU rendering into swapchain images and a 60 Hz
// display scanning them out, for PresentModeFigure. The GPU takes a free image
// (one that is not being rendered, queued or on screen), renders it for gpuMs,
// then presents it:
//   fifo      queued in order; each vblank shows the oldest queued image
//   mailbox   a queue of one: a newer frame replaces (discards) the waiting one
//   immediate shown at once, even mid-scanout, which tears the picture
// If no image is free the GPU waits: that is the vsync throttle.

export type Mode = "fifo" | "mailbox" | "immediate";
export type ImgState = "render" | "queued" | "shown";
export type Span = { s: number; e: number; img: number; frame: number };
export type StateSpan = Span & { state: ImgState };
export type Screen = Span & { tear: boolean };

export const REFRESH_MS = 1000 / 60;

export interface SimResult {
  gpu: Span[];                 // render blocks
  waits: { s: number; e: number }[];
  states: StateSpan[];         // per image: render / queued / shown intervals
  screen: Screen[];            // what the display shows, from s to e
  stats: { renderedFps: number; shownFps: number; dropped: number; tears: number; latency: number };
}

export function simulate(mode: Mode, images: number, gpuMs: number, total = 1500, warm = 300): SimResult {
  const P = REFRESH_MS;
  const gpu: Span[] = [], waits: { s: number; e: number }[] = [], states: StateSpan[] = [], screen: Screen[] = [];
  const state: (ImgState | null)[] = Array(images).fill(null);
  const since: number[] = Array(images).fill(0);
  const frameOf: number[] = Array(images).fill(-1);
  const startOf = new Map<number, number>();       // frame → render start
  const queue: number[] = [];
  let shown = -1, frameId = 0, dropped = 0, tears = 0;
  // Held in an object so TypeScript sees the closures' writes (a plain `let` narrows to null).
  const cur: { job: { img: number; s: number; e: number; frame: number } | null } = { job: null };
  let waitingSince: number | null = null;
  const latencies: number[] = [];

  const setState = (img: number, st: ImgState | null, now: number) => {
    const old = state[img];
    if (old) states.push({ s: since[img], e: now, img, frame: frameOf[img], state: old });
    state[img] = st; since[img] = now;
  };
  const show = (img: number, now: number, tear: boolean) => {
    if (screen.length) screen[screen.length - 1].e = now;
    if (shown >= 0) setState(shown, null, now);
    shown = img;
    setState(img, "shown", now);
    screen.push({ s: now, e: now, img, frame: frameOf[img], tear });
    if (now >= warm) {
      latencies.push(now - (startOf.get(frameOf[img]) ?? now));
      if (tear) tears++;
    }
  };
  const tryStart = (now: number) => {
    const img = state.findIndex(s => s === null);
    if (img < 0) { if (waitingSince === null) waitingSince = now; return; }
    if (waitingSince !== null && now > waitingSince) waits.push({ s: waitingSince, e: now });
    waitingSince = null;
    frameOf[img] = frameId;
    startOf.set(frameId, now);
    setState(img, "render", now);
    cur.job = { img, s: now, e: now + gpuMs, frame: frameId++ };
  };

  let t = 0, nextV = P;
  tryStart(0);
  while (t < total) {
    const job = cur.job;
    const nextE = job ? job.e : Infinity;
    if (nextE <= nextV) {
      t = nextE;
      const j = job!;
      cur.job = null;
      gpu.push({ s: j.s, e: j.e, img: j.img, frame: j.frame });
      if (mode === "immediate") {
        const mid = t % P > 0.5 && P - (t % P) > 0.5;
        show(j.img, t, mid);
      } else {
        if (mode === "mailbox" && queue.length) {
          const old = queue.shift()!;
          setState(old, null, t);
          if (t >= warm) dropped++;
        }
        queue.push(j.img);
        setState(j.img, "queued", t);
      }
      tryStart(t);
    } else {
      t = nextV;
      nextV += P;
      if (mode !== "immediate" && queue.length) show(queue.shift()!, t, false);
      if (!cur.job) tryStart(t);
    }
  }
  // Close whatever is still open.
  for (let i = 0; i < images; ++i) if (state[i]) setState(i, null, total);
  if (screen.length) screen[screen.length - 1].e = total;
  const last = cur.job;
  if (last) gpu.push({ s: last.s, e: Math.min(last.e, total), img: last.img, frame: last.frame });

  const secs = (total - warm) / 1000;
  const rendered = gpu.filter(g => g.e >= warm && g.e <= total).length;
  const shownN = screen.filter(s => s.s >= warm).length;
  return {
    gpu, waits, states, screen,
    stats: {
      renderedFps: rendered / secs,
      shownFps: shownN / secs,
      dropped,
      tears,
      latency: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
    },
  };
}
