"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, mulberry32 } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// The branch of `if (p[i] >= 128)` run over 32 bytes, and a predictor guessing
// each outcome before it is known. The simple predictor is one 2-bit
// saturating counter: two wrong guesses in a row are needed to change its
// mind. The history predictor keeps one such counter for each combination of
// the last two outcomes, so it can learn a repeating pattern. Every cell is
// one branch: filled if taken (byte ≥ 128), outlined green or red for a right
// or wrong guess. The data patterns match the ones timed in the lesson.

type Pattern = "sorted" | "random" | "alternating";
type Kind = "counter" | "history";
const N = 32;

function outcomes(p: Pattern): boolean[] {
  if (p === "sorted") return Array.from({ length: N }, (_, i) => i >= N / 2);
  if (p === "alternating") return Array.from({ length: N }, (_, i) => i % 2 === 1);
  const r = mulberry32(5);
  return Array.from({ length: N }, () => r() < 0.5);
}

type Step = { guess: boolean; counters: number[]; used: number };

function simulate(out: boolean[], kind: Kind): Step[] {
  const counters = kind === "counter" ? [1] : [1, 1, 1, 1];
  let hist = 0;
  return out.map(taken => {
    const used = kind === "counter" ? 0 : hist;
    const guess = counters[used] >= 2;
    counters[used] = taken ? Math.min(3, counters[used] + 1) : Math.max(0, counters[used] - 1);
    hist = ((hist << 1) | (taken ? 1 : 0)) & 3;
    return { guess, counters: [...counters], used };
  });
}

const mono = "font-mono tabular-nums";
const STATE = ["strongly not taken", "weakly not taken", "weakly taken", "strongly taken"];

export function BranchPredictorFigure({ t }: { t?: TrackTranslations }) {
  const [pattern, setPattern] = useState<Pattern>("random");
  const [kind, setKind] = useState<Kind>("counter");
  const out = useMemo(() => outcomes(pattern), [pattern]);
  const steps = useMemo(() => simulate(out, kind), [out, kind]);
  const s = useStepper(N, 450, 200);
  const k = Math.max(0, Math.min(N, Math.floor(s.raw + 1e-9)));
  const wrong = steps.slice(0, k).filter((st, i) => st.guess !== out[i]).length;
  const counters = k === 0 ? (kind === "counter" ? [1] : [1, 1, 1, 1]) : steps[k - 1].counters;
  const lastUsed = k === 0 ? -1 : steps[k - 1].used;

  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); s.restart(); };
  const histName = (h: number) => `${h & 2 ? "T" : "N"}${h & 1 ? "T" : "N"}`;

  return (
    <Figure
      title={tx(t, "figAsmBp_title", "Guessing a branch before it is decided")}
      head={<Choice value={kind} onChange={reset(setKind)} options={[["counter", tx(t, "figAsmBp_counter", "2-bit counter")], ["history", tx(t, "figAsmBp_history", "with history")]] as const} />}
      note={tx(t, "figAsmBp_how", "Each cell is one run of the branch: filled when taken. The outline shows whether the predictor guessed right (green) or wrong (red). Change the data and the predictor.")}
    >
      <div className="flex flex-col">
        <div className="p-3 sm:p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5" style={{ flexWrap: "wrap" }}>
            <span className="text-[11px] text-[var(--text-muted)] mr-1">{tx(t, "figAsmBp_data", "data")}</span>
            <Choice value={pattern} onChange={reset(setPattern)} options={[
              ["random", tx(t, "figAsmBp_random", "random")], ["sorted", tx(t, "figAsmBp_sorted", "sorted")], ["alternating", tx(t, "figAsmBp_alt", "alternating")],
            ] as const} />
          </div>
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(16, minmax(0, 1fr))` }}>
            {out.map((taken, i) => {
              const shown = i < k;
              const ok = shown && steps[i].guess === taken;
              return (
                <span key={i} className={`${mono} h-7 rounded-sm flex items-center justify-center text-[10px]`}
                  style={{
                    background: shown && taken ? "var(--code-line)" : "transparent",
                    border: `2px solid ${shown ? (ok ? C.green : C.red) : "var(--code-border)"}`,
                    color: shown ? "var(--text-main)" : "var(--text-muted)",
                    outline: i === k - 1 ? "1px solid var(--text-main)" : undefined, outlineOffset: 1,
                  }}>
                  {shown ? (taken ? "T" : "N") : ""}
                </span>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5">
            {counters.map((c, h) => (
              <div key={h} className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                <span className={`${mono} text-[11px] w-20 text-[var(--text-muted)]`}>
                  {kind === "counter" ? tx(t, "figAsmBp_one", "counter") : tx(t, "figAsmBp_after", "after {h}").replace("{h}", histName(h))}
                </span>
                <span className="grid grid-cols-4 gap-[2px] w-40">
                  {[0, 1, 2, 3].map(v => (
                    <span key={v} className="h-3 rounded-sm" style={{ background: v === c ? (v >= 2 ? C.sky : C.amber) : "var(--code-border)", opacity: v === c ? 1 : 0.5 }} />
                  ))}
                </span>
                <span className={`${mono} text-[11px]`} style={{ color: h === lastUsed ? "var(--text-main)" : "var(--text-muted)" }}>
                  {tx(t, `figAsmBp_s${c}`, STATE[c])}
                </span>
              </div>
            ))}
          </div>
          <p className={`${mono} text-[12px]`} style={{ color: wrong ? C.red : "var(--text-muted)" }}>
            {tx(t, "figAsmBp_score", "wrong guesses: {w} of {n}").replace("{w}", String(wrong)).replace("{n}", String(k))}
          </p>
        </div>
        <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
          readout={`${k} / ${N}`} />
      </div>
    </Figure>
  );
}
