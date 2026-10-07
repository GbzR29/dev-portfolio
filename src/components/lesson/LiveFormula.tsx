"use client";

// ── LiveFormula: a formula with its numbers plugged in, live ──────────────────
// The symbolic formula on top, sliders for its inputs, and underneath the same
// formula with the current values substituted, step by step, down to the
// result. An optional meter shows a result that is a probability. \sym-linked
// symbols work as in <Equation>.

import { useState, type ReactNode } from "react";
import { Slider } from "@/components/lesson/kit/figure";
import { render, useSymbolLinks } from "./Tex";

export type LiveVar = {
  id: string;
  label: ReactNode;
  min: number; max: number; step: number; value: number;
  fmt?: (v: number) => string;
};

export function LiveFormula({ label, tex, vars, compute, note }: {
  label?: string;
  /** The formula in symbols. */
  tex: string;
  vars: LiveVar[];
  /** The substituted formula (TeX) for the current values, and optionally a 0–1 result for the meter. */
  compute: (v: Record<string, number>) => { tex: string; meter?: number; meterLabel?: string };
  note?: ReactNode;
}) {
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(vars.map(v => [v.id, v.value])));
  const links = useSymbolLinks<HTMLDivElement>();
  const out = compute(vals);

  return (
    <div ref={links.ref} {...links.handlers} className="eq-card my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
      {label && <div className="px-4 pt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</div>}
      <div className="px-4 pt-4 pb-2 overflow-x-auto text-[var(--text-main)] text-[1.1rem]" dangerouslySetInnerHTML={{ __html: render(tex, true) }} />
      <div className="px-4 pb-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {vars.map(v => (
          <Slider key={v.id} label={v.label} value={vals[v.id]} min={v.min} max={v.max} step={v.step} fmt={v.fmt}
            onChange={x => setVals(s => ({ ...s, [v.id]: x }))} width="w-36" />
        ))}
      </div>
      <div className="mx-4 mb-4 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary-low)] px-3 py-3 overflow-x-auto text-[var(--text-main)]"
        dangerouslySetInnerHTML={{ __html: render(out.tex, true) }} />
      {out.meter !== undefined && (
        <div className="mx-4 mb-4 flex items-center gap-3">
          <div className="flex-1 h-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-200" style={{ width: `${Math.max(0, Math.min(1, out.meter)) * 100}%` }} />
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] tabular-nums min-w-[5rem] text-right">{out.meterLabel ?? `${(out.meter * 100).toFixed(1)}%`}</span>
        </div>
      )}
      {note && <div className="px-4 pb-3.5 pt-2 border-t border-[var(--separator)] text-[13px] text-[var(--text-muted)] leading-relaxed">{note}</div>}
    </div>
  );
}
