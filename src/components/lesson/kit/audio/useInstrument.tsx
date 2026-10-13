"use client";

// ── Instrument hooks ──────────────────────────────────────────────────────────
// useInstrument: the reader's instrument (piano or guitar), re-rendering when
// it changes anywhere on the page. useNotes: usePiano's twin for whichever
// instrument is chosen. InstrumentChoice: the selector for a widget's head.
// ForInstrument: lesson prose shown only for one instrument.

import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Choice } from "../figure";
import { getInstrument, samplerOf, setInstrument, subscribeInstrument, type Instrument } from "./instrument";
import type { PianoLoad } from "./usePiano";

/** The server and the first client render show the piano; the saved choice follows right after. */
export function useInstrument(): [Instrument, (v: Instrument) => void] {
  const inst = useSyncExternalStore(subscribeInstrument, getInstrument, () => "piano" as const);
  return [inst, setInstrument];
}

/**
 * The chosen instrument's loading state. `ensure()` resolves once its
 * recordings are decoded; call it when the reader reaches for the widget.
 */
export function useNotes() {
  const [inst] = useInstrument();
  // Failures are remembered per instrument; "ready" and "loading" come from the sampler itself
  const [state, setState] = useState<Record<Instrument, PianoLoad>>({ piano: "idle", guitar: "idle" });
  const load: PianoLoad = samplerOf(inst).ready() ? "ready" : state[inst];

  const ensure = useCallback(() => {
    const v = getInstrument(), s = samplerOf(v);
    if (s.ready()) return Promise.resolve();
    setState(st => ({ ...st, [v]: "loading" }));
    return s.load().then(
      () => setState(st => ({ ...st, [v]: "ready" })),
      () => { setState(st => ({ ...st, [v]: "error" })); throw new Error(v); },
    );
  }, []);

  return { inst, load, ensure };
}

/** "loading the guitar (2.1 MB)…" / the error line, or null when there is nothing to say. */
export function loadStatus(t: TrackTranslations | undefined, inst: Instrument, load: PianoLoad) {
  if (load === "loading") return inst === "guitar"
    ? tx(t, "figMus_loadingGuitar", "loading the guitar (2.1 MB)…")
    : tx(t, "figMus_loading", "loading the piano (1.3 MB)…");
  if (load === "error") return inst === "guitar"
    ? tx(t, "figMus_loadErrorGuitar", "the guitar failed to load — click a note to retry")
    : tx(t, "figMus_loadError", "the piano failed to load — click a key to retry");
  return null;
}

/** Piano / guitar buttons for a widget's head; they change the choice for the whole page. */
export function InstrumentChoice({ t, onChange }: { t?: TrackTranslations; onChange?: (v: Instrument) => void }) {
  const [inst, setInst] = useInstrument();
  return (
    <Choice value={inst} onChange={v => { setInst(v); onChange?.(v); }} options={[
      ["piano", tx(t, "figMus_inPiano", "piano")],
      ["guitar", tx(t, "figMus_inGuitar", "guitar")],
    ]} />
  );
}

/** Children shown only while the reader's instrument is `only`. */
export function ForInstrument({ only, children }: { only: Instrument; children: ReactNode }) {
  const [inst] = useInstrument();
  return inst === only ? <>{children}</> : null;
}

/** Credit line for the chosen instrument's recordings (widget notes). */
export function SampleCredit({ t }: { t?: TrackTranslations }) {
  const [inst] = useInstrument();
  return <>{inst === "guitar"
    ? tx(t, "figMus_guitarCredit", "Guitar: ClassicalGuitar-multisampled by quartertone, freesound.org (CC-BY 4.0).")
    : tx(t, "figMus_pianoCredit", "Piano: Salamander Grand Piano by Alexander Holm (CC-BY 3.0).")}</>;
}
