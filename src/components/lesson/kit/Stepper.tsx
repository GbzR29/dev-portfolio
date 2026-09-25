"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ── Step-by-step playback for illustrated figures ─────────────────────────────
// A figure is a function of one number, `p`, that runs from 0 to `steps`.
// Integer values are the resting states (step 0, step 1, ...); the fractional
// part is how far the transition into the next step has gone. Figures draw
// from `p` and never keep their own animation state.

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// ── Playback speed, shared by every figure on the page ────────────────────────
// Kept in localStorage as a per-viewer preference. The base durations are
// already on the slow side; 1× is meant to be comfortable for a first read.
export const SPEEDS = [0.25, 0.5, 1, 1.5, 2] as const;
const SLOWDOWN = 1.6;                     // every figure's ms-per-step is scaled by this at 1×
let speedValue = 1;
const speedListeners = new Set<(v: number) => void>();
let speedLoaded = false;

function loadSpeed() {
  if (speedLoaded) return;
  speedLoaded = true;
  try {
    const v = Number(localStorage.getItem("fig-speed"));
    if ((SPEEDS as readonly number[]).includes(v)) speedValue = v;
  } catch { /* storage blocked: keep the default */ }
}

/** The shared playback speed and a setter that updates every figure. */
export function useFigureSpeed(): [number, (v: number) => void] {
  const [speed, setLocal] = useState(1);
  useEffect(() => {
    loadSpeed();
    setLocal(speedValue);
    speedListeners.add(setLocal);
    return () => { speedListeners.delete(setLocal); };
  }, []);
  const set = useCallback((v: number) => {
    speedValue = v;
    try { localStorage.setItem("fig-speed", String(v)); } catch { /* ignore */ }
    speedListeners.forEach(f => f(v));
  }, []);
  return [speed, set];
}

/** Scales a duration in ms by the shared speed (and the base slowdown). */
export const scaledMs = (ms: number, speed: number) => (ms * SLOWDOWN) / speed;

export function useStepper(steps: number, msPerStep = 1100, holdMs = 450) {
  const [raw, setRaw]         = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed]     = useFigureSpeed();
  const rawRef = useRef(0);
  const raf    = useRef<number | null>(null);
  // Read inside the animation loop, so changing speed mid-play takes effect at once
  const speedRef = useRef(speed); speedRef.current = speed;

  const cancel = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };
  useEffect(() => cancel, []);

  const commit = useCallback((r: number) => {
    const safe = Number.isFinite(r) ? Math.max(0, Math.min(steps, r)) : 0;
    rawRef.current = safe; setRaw(safe);
  }, [steps]);

  /** Runs toward `to`. With holds, it pauses briefly on every step it reaches. */
  const runTo = useCallback((to: number, withHolds: boolean) => {
    cancel();
    const dir = Math.sign(to - rawRef.current);
    if (!dir) { setPlaying(false); return; }
    let last = performance.now();
    let hold = 0;

    const tick = (now: number) => {
      // rAF hands over the frame's start time, which can be earlier than the
      // performance.now() taken when play was pressed: never step backwards.
      const dt = Math.max(0, now - last); last = Math.max(last, now);
      let r = rawRef.current;
      if (hold > 0) {
        hold -= dt;
      } else {
        const next = r + (dir * dt) / scaledMs(msPerStep, speedRef.current);
        const boundary = dir > 0 ? Math.floor(r + 1e-9) + 1 : Math.ceil(r - 1e-9) - 1;
        const crossed = dir > 0 ? next >= boundary : next <= boundary;
        r = crossed ? boundary : next;
        if (dir > 0 ? r >= to : r <= to) r = to;
        if (crossed && withHolds && r !== to) hold = scaledMs(holdMs, speedRef.current);
        commit(r);
      }
      if (r === to) { raf.current = null; setPlaying(false); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [msPerStep, holdMs, commit]);

  const play = () => {
    if (playing) { cancel(); setPlaying(false); return; }
    if (rawRef.current >= steps) commit(0);
    setPlaying(true);
    runTo(steps, true);
  };
  const next    = () => { setPlaying(false); runTo(Math.min(steps, Math.floor(rawRef.current + 1e-9) + 1), false); };
  const prev    = () => { setPlaying(false); runTo(Math.max(0, Math.ceil(rawRef.current - 1e-9) - 1), false); };
  const restart = () => { cancel(); setPlaying(false); commit(0); };
  const scrub   = (v: number) => { cancel(); setPlaying(false); commit(Math.max(0, Math.min(steps, v))); };

  // Eased progress: each step accelerates out of rest and settles into the next.
  // Clamped again here so figures can index arrays with it safely.
  const r   = Math.max(0, Math.min(steps, raw));
  const seg = Math.max(0, Math.min(steps - 1, Math.floor(r)));
  const p   = steps === 0 ? 0 : seg + ease(r - seg);

  return { p, raw, steps, playing, play, next, prev, restart, scrub, speed, setSpeed };
}

export type Stepper = ReturnType<typeof useStepper>;

/** Amount (0..1) of step `i` (1-based) that has been applied at progress p. */
export const stepAmount = (p: number, i: number) => Math.max(0, Math.min(1, p - (i - 1)));

// ── Controls ──────────────────────────────────────────────────────────────────
export function StepperControls({ s, labels }: { s: Stepper; labels?: string[] }) {
  const btn = "h-7 min-w-7 px-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 text-[11px] font-mono flex items-center justify-center transition-all disabled:opacity-35 disabled:pointer-events-none";
  const current = Math.round(s.raw);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5">
        <button className={btn} onClick={s.restart} aria-label="Restart" title="Restart">⟲</button>
        <button className={btn} onClick={s.prev} disabled={s.raw <= 0} aria-label="Previous step">⟨</button>
        <button
          className={`${btn} min-w-[74px] ${s.playing ? "" : "!text-[var(--primary)] !border-[var(--primary)]/50 bg-[var(--primary-low)]"}`}
          onClick={s.play}
        >
          {s.playing ? "❚❚ pause" : s.raw >= s.steps ? "▶ replay" : "▶ play"}
        </button>
        <button className={btn} onClick={s.next} disabled={s.raw >= s.steps} aria-label="Next step">⟩</button>
        <input
          type="range" min={0} max={s.steps} step={0.01} value={s.raw}
          onChange={e => s.scrub(Number(e.target.value))}
          aria-label="Scrub through the steps"
          className="flex-1 ml-2 accent-[var(--primary)]"
        />
      </div>
      <SpeedControl speed={s.speed} setSpeed={s.setSpeed} />
      {labels && (
        <div className="flex gap-1.5 flex-wrap">
          {labels.map((l, i) => (
            <button
              key={i}
              onClick={() => s.scrub(i)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono border transition-all ${
                current === i
                  ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"
              }`}
            >
              {i}. {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Speed buttons; any figure can show them, they all share one value. */
export function SpeedControl({ speed, setSpeed }: { speed: number; setSpeed: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-mono text-[var(--text-muted)] mr-1">speed</span>
      {SPEEDS.map(v => (
        <button
          key={v}
          onClick={() => setSpeed(v)}
          aria-pressed={speed === v}
          className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all ${
            speed === v
              ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"
          }`}
        >
          {v}×
        </button>
      ))}
    </div>
  );
}
