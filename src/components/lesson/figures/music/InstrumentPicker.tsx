"use client";

// ── Instrument picker ─────────────────────────────────────────────────────────
// The card at the start of the Music track (and of the Notes section) that asks
// whether the reader will practise on the piano or on the guitar. The choice
// is the site-wide one (kit/audio/instrument.ts): the selector in each widget's
// head changes the same value, and lesson text in <ForInstrument> follows it.
// Drawn pictures, no emoji: a few piano keys and a stretch of guitar neck.

import { useSyncExternalStore, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C } from "@/components/lesson/kit/figure";
import { instrumentChosen, subscribeInstrument, type Instrument } from "@/components/lesson/kit/audio/instrument";
import { useInstrument } from "@/components/lesson/kit/audio/useInstrument";

/** Five white keys and their black keys, one key lit. */
function PianoArt({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 92 56" className="w-[92px] h-[56px]" aria-hidden>
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} x={4 + i * 17} y={4} width={16} height={48} rx={2.5}
          fill={on && i === 2 ? C.amber : "#fbfbf8"} stroke="#3b3f42" strokeWidth={1} />
      ))}
      {[15, 32, 66].map(x => <rect key={x} x={x} y={4} width={10} height={28} rx={1.8} fill="#1f2326" />)}
    </svg>
  );
}

/** The nut, three frets, six strings, one place held. */
function GuitarArt({ on }: { on: boolean }) {
  const ys = [8, 16, 24, 32, 40, 48];
  return (
    <svg viewBox="0 0 104 56" className="w-[104px] h-[56px]" aria-hidden>
      <rect x={10} y={4} width={92} height={48} rx={2} fill="#3b2a20" />
      <rect x={8} y={4} width={4} height={48} rx={1} fill="#efe9da" />
      {[40, 66, 90].map(x => <line key={x} x1={x} x2={x} y1={4} y2={52} stroke="#b9bcbf" strokeWidth={1.6} />)}
      <circle cx={78} cy={28} r={2.6} fill="#e9e1cf" opacity={0.55} />
      {ys.map((y, s) => <line key={y} x1={2} x2={104} y1={y} y2={y} stroke={s > 2 ? "#c9a46a" : "#e6e2d6"} strokeWidth={s > 2 ? 1.2 + (s - 3) * 0.4 : 0.9} />)}
      <circle cx={53} cy={ys[4]} r={5} fill={on ? C.amber : "#f4efe3"} stroke={on ? "none" : "#8a7d6a"} strokeWidth={0.8} />
    </svg>
  );
}

export function InstrumentPicker({ t }: { t?: TrackTranslations }) {
  const [inst, setInst] = useInstrument();
  // Until the reader picks, neither card looks chosen (the piano is only the default)
  const chosen = useSyncExternalStore(subscribeInstrument, instrumentChosen, () => false);

  const card = (v: Instrument, title: string, body: string, art: ReactNode) => {
    const on = chosen && inst === v;
    return (
      <button type="button" onClick={() => setInst(v)} aria-pressed={on}
        className={`flex-1 min-w-0 flex items-center gap-4 rounded-xl border-2 px-4 py-3 text-left transition-colors ${on
          ? "border-[var(--primary)] bg-[var(--primary-low)]"
          : "border-[var(--border)] hover:border-[var(--primary)]/50"}`}>
        <span className="flex-shrink-0">{art}</span>
        <span className="min-w-0">
          <span className={`block font-semibold text-[15px] ${on ? "text-[var(--primary)]" : "text-[var(--text-main)]"}`}>{title}</span>
          <span className="block text-[13px] leading-snug text-[var(--text-muted)]">{body}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] px-5 py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2">{tx(t, "figMus_ipLabel", "Your instrument")}</p>
      <p className="text-[15px] leading-relaxed text-[var(--text-main)] mb-3">
        {tx(t, "figMus_ipAsk", "Will you practise on the piano or on the guitar? The theory is the same for both. What changes is where each note is: the widgets show the keyboard or the guitar neck, the games are played there, and a few passages of the text are written for your instrument. You can switch at any time with the selector at the top of a widget.")}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {card("piano", tx(t, "figMus_inPianoCap", "Piano"), tx(t, "figMus_ipPiano", "One key for each note, the black keys marking the pattern."), <PianoArt on={chosen && inst === "piano"} />)}
        {card("guitar", tx(t, "figMus_inGuitarCap", "Guitar"), tx(t, "figMus_ipGuitar", "The neck, with a small keyboard under it as a map. Each fret is one half step."), <GuitarArt on={chosen && inst === "guitar"} />)}
      </div>
    </div>
  );
}
