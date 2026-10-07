"use client";

// ── Transport: the playback bar of an animated figure ─────────────────────────
// A media-player row that sits inside the drawing area, right under the
// drawing: a big round play / pause button with smaller back, forward and
// restart buttons around it, and an optional readout on the right. Only the
// buttons a figure passes are drawn. Each button carries data-transport="…"
// so a lab step can make the one it asks for pulse (see LabStep.focus and
// src/styles/lab.css).

import type { ReactNode } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

const SMALL = "h-9 w-9 rounded-full flex items-center justify-center border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-all disabled:opacity-35 disabled:pointer-events-none";

export function Transport({ playing, onPlay, onStep, onBack, onReset, readout, playLabel, t }: {
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
  t?: TrackTranslations;
}) {
  const play = playLabel ?? tx(t, "figT_play", "play");
  return (
    <div className="flex items-center justify-center gap-2.5 px-3 pb-3 pt-1 select-none">
      {onReset && (
        <button type="button" data-transport="reset" className={SMALL} onClick={onReset}
          aria-label={tx(t, "figT_reset", "restart")} title={tx(t, "figT_reset", "restart")}>
          <RotateCcw size={15} />
        </button>
      )}
      {onBack && (
        <button type="button" data-transport="back" className={SMALL} onClick={onBack}
          aria-label={tx(t, "figT_back", "step back")} title={tx(t, "figT_back", "step back")}>
          <SkipBack size={15} />
        </button>
      )}
      <button type="button" data-transport="play" onClick={onPlay}
        aria-label={playing ? tx(t, "figT_pause", "pause") : play} title={playing ? tx(t, "figT_pause", "pause") : play}
        className="h-12 w-12 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--bg)] shadow-md hover:scale-105 active:scale-95 transition-transform">
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
      </button>
      {onStep && (
        <button type="button" data-transport="step" className={SMALL} onClick={onStep}
          aria-label={tx(t, "figT_step", "one step")} title={tx(t, "figT_step", "one step")}>
          <SkipForward size={15} />
        </button>
      )}
      {readout !== undefined && (
        <span className="ml-1 min-w-[4.5rem] text-[11px] font-mono text-[var(--text-muted)] tabular-nums">{readout}</span>
      )}
    </div>
  );
}
