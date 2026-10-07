"use client";

// ── Transport: the playback bar of an animated figure ─────────────────────────
// A media-player row that sits inside the drawing area, right under the
// drawing: a big round play / pause button with smaller back, forward and
// restart buttons around it, an optional speed chip (the speed every figure on
// the page shares, see Stepper.tsx) and an optional readout on the right. Only
// the buttons a figure passes are drawn.
//   • Each button carries data-transport="…" so a lab step can make the one it
//     asks for pulse (LabStep.focus, src/styles/lab.css).
//   • Inside an open lab the keyboard drives it: Space plays / pauses,
//     → steps forward, ← steps back.

import { useEffect, useRef, type ReactNode } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { SPEEDS, useFigureSpeed } from "./Stepper";

const SMALL = "h-9 w-9 rounded-full flex items-center justify-center border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-all disabled:opacity-35 disabled:pointer-events-none";

export function Transport({ playing, onPlay, onStep, onBack, onReset, readout, playLabel, speed = false, t }: {
  playing: boolean;
  onPlay: () => void;
  /** Forward one step (the next stage of the animation). */
  onStep?: () => void;
  /** Back one step, for figures whose state can go back. */
  onBack?: () => void;
  onReset?: () => void;
  /** Small text on the right, e.g. "steps: 12". */
  readout?: ReactNode;
  /** Replaces "play" in the tooltip (e.g. "add up the paths"). */
  playLabel?: string;
  /** Shows the shared playback-speed chip. */
  speed?: boolean;
  t?: TrackTranslations;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [rate, setRate] = useFigureSpeed();
  const handlers = useRef({ onPlay, onStep, onBack });
  handlers.current = { onPlay, onStep, onBack };

  // Keyboard, only while this bar is inside an open lab (the inline copy stays quiet)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!root.current?.closest(".lab-root") || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const h = handlers.current;
      if (e.key === " ") { e.preventDefault(); h.onPlay(); }
      else if (e.key === "ArrowRight" && h.onStep) { e.preventDefault(); h.onStep(); }
      else if (e.key === "ArrowLeft" && h.onBack) { e.preventDefault(); h.onBack(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const play = playLabel ?? tx(t, "figT_play", "play");
  const tip = (label: string, key: string) => `${label} (${key})`;
  const nextRate = SPEEDS[(SPEEDS.indexOf(rate as (typeof SPEEDS)[number]) + 1) % SPEEDS.length];

  return (
    <div ref={root} className="flex items-center justify-center gap-2.5 px-3 pb-3 pt-1 select-none">
      {onReset && (
        <button type="button" data-transport="reset" className={SMALL} onClick={onReset}
          aria-label={tx(t, "figT_reset", "restart")} title={tx(t, "figT_reset", "restart")}>
          <RotateCcw size={15} />
        </button>
      )}
      {onBack && (
        <button type="button" data-transport="back" className={SMALL} onClick={onBack}
          aria-label={tx(t, "figT_back", "step back")} title={tip(tx(t, "figT_back", "step back"), "←")}>
          <SkipBack size={15} />
        </button>
      )}
      <button type="button" data-transport="play" onClick={onPlay}
        aria-label={playing ? tx(t, "figT_pause", "pause") : play}
        title={tip(playing ? tx(t, "figT_pause", "pause") : play, tx(t, "figT_space", "space"))}
        className="h-12 w-12 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--bg)] shadow-md hover:scale-105 active:scale-95 transition-transform">
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
      </button>
      {onStep && (
        <button type="button" data-transport="step" className={SMALL} onClick={onStep}
          aria-label={tx(t, "figT_step", "one step")} title={tip(tx(t, "figT_step", "one step"), "→")}>
          <SkipForward size={15} />
        </button>
      )}
      {speed && (
        <button type="button" data-transport="speed" onClick={() => setRate(nextRate)}
          aria-label={`${tx(t, "figT_speed", "speed")}: ${rate}×`} title={`${tx(t, "figT_speed", "speed")}: ${rate}× → ${nextRate}×`}
          className="h-7 min-w-[2.75rem] px-2 rounded-full border border-[var(--border)] bg-[var(--card)] text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-all">
          {rate}×
        </button>
      )}
      {readout !== undefined && (
        <span className="ml-1 min-w-[4.5rem] text-[11px] font-mono text-[var(--text-muted)] tabular-nums">{readout}</span>
      )}
    </div>
  );
}
