"use client";

// ── Derivation: an equation built one step at a time ──────────────────────────
// A textbook chain of equalities, revealed line by line with the playback bar
// the figures use (kit/Transport.tsx). Each line carries the reason for the
// step ("law of total probability", "Markov property"); the newest line is lit
// and its reason shows in a caption under the lines, older lines fade a
// little, and clicking any line lights it and shows its reason instead. The "=" signs line up: the
// first line is the left-hand side, the next ones start with "=" (or ⇒, …),
// and a line can span the whole width instead (`full`) for a derivation made of
// separate statements. \sym-linked symbols work as in <Equation>; the "where"
// legend sits under it, as there.

import { useEffect, useState, type ReactNode } from "react";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Transport } from "@/components/lesson/kit/Transport";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { render, symColors, useSymbolLinks, WhereList } from "./Tex";

export type DerivationStep = {
  tex: string;
  /** Why this line follows from the one before. */
  why?: ReactNode;
  /** Spans both columns (a statement of its own, not "= …"). */
  full?: boolean;
};

export function Derivation({ label, steps, where, note, t }: {
  label?: string;
  steps: DerivationStep[];
  where?: [string, ReactNode][];
  note?: ReactNode;
  t?: TrackTranslations;
}) {
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);   // a line the reader clicked
  const [speed] = useFigureSpeed();
  const links = useSymbolLinks<HTMLDivElement>();
  const colors = symColors(where);
  const n = steps.length;
  const focus = picked !== null && picked < shown ? picked : shown - 1;
  // A new line takes the light back from a clicked one
  useEffect(() => setPicked(null), [shown]);

  // Playing reveals the next line every ~2 s (scaled by the shared speed)
  useEffect(() => {
    if (!playing) return;
    if (shown >= n) { setPlaying(false); return; }
    const id = setTimeout(() => setShown(s => Math.min(n, s + 1)), scaledMs(1300, speed));
    return () => clearTimeout(id);
  }, [playing, shown, n, speed]);

  const play = () => {
    if (playing) { setPlaying(false); return; }
    if (shown >= n) setShown(1);
    setPlaying(true);
  };

  return (
    <div ref={links.ref} {...links.handlers} className="eq-card my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
      {label && (
        <div className="px-4 pt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</div>
      )}
      <div className="px-4 pt-4 pb-2 overflow-x-auto">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-1.5 gap-y-1 w-max min-w-full text-[var(--text-main)] text-[1.05rem]">
          {steps.slice(0, shown).map((s, i) => {
            const lit = i === focus;
            const col = s.full ? "col-span-2" : i === 0 ? "col-start-1 justify-self-end" : "col-start-2";
            return (
              <div key={i} className="contents">
                <button type="button" onClick={() => setPicked(i)} aria-pressed={lit}
                  className={`${col} text-left rounded-md px-1.5 py-1 transition-opacity ${lit ? "deriv-current" : "opacity-55 hover:opacity-90"}`}>
                  <span className="deriv-num">{i + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: render(`\\displaystyle ${s.tex}`, false, colors) }} />
                </button>
                {/* The first line stands alone on the left: keep the right column empty beside it */}
                {i === 0 && !s.full && <div className="col-start-2" />}
              </div>
            );
          })}
        </div>
      </div>
      {/* Why the lit line follows from the one before; click any line to see its reason */}
      {steps[focus]?.why && (
        <div key={focus} className="eq-words mx-4 mb-1 rounded-lg border-l-[3px] border-[var(--primary)] bg-[var(--primary-low)] px-3 py-2 text-[13px] leading-relaxed text-[var(--text-main)]">
          <span className="font-mono text-[11px] text-[var(--primary)] mr-2">{focus + 1}</span>{steps[focus].why}
        </div>
      )}
      <Transport t={t} speed playing={playing} onPlay={play}
        onStep={shown < n ? () => { setPlaying(false); setShown(s => Math.min(n, s + 1)); } : undefined}
        onBack={shown > 1 ? () => { setPlaying(false); setShown(s => Math.max(1, s - 1)); } : undefined}
        onReset={() => { setPlaying(false); setShown(1); }}
        readout={`${shown} / ${n}`} />
      <WhereList where={where} colors={colors} />
      {note && (
        <div className="px-4 pb-3.5 pt-2 border-t border-[var(--separator)] text-[13px] text-[var(--text-muted)] leading-relaxed">{note}</div>
      )}
    </div>
  );
}
