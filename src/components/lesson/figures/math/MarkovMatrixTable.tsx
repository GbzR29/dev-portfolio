"use client";

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fIsZero, fStr, type FMat } from "./markovModel";

// ── A transition matrix as a table of exact fractions ─────────────────────────
// Used by the Markov-chain figures. One row can be tinted (the state the walk
// is in), one cell lit (the step just taken, or the entry being explained),
// and the cells can be made clickable.

export function MarkovMatrixTable({ P, row, cell, t, label, onPick }: {
  P: FMat;
  /** Row to tint, or null. */
  row: number | null;
  /** Cell to light up as [row, column], or null. */
  cell: [number, number] | null;
  t?: TrackTranslations;
  /** Text of the corner cell (default "from ↓ to →"). */
  label?: string;
  /** Makes the cells clickable: picks (row, column). */
  onPick?: (i: number, j: number) => void;
}) {
  const base = "px-2 py-1 text-center font-mono text-[11px] tabular-nums";
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto border-collapse">
        <thead>
          <tr>
            <th className={`${base} text-[var(--text-muted)] font-normal`}>{label ?? tx(t, "figMk_fromTo", "from ↓ to →")}</th>
            {P.map((_, j) => <th key={j} className={`${base} text-[var(--text-muted)]`}>{j}</th>)}
          </tr>
        </thead>
        <tbody>
          {P.map((r, i) => (
            <tr key={i} className={i === row ? "bg-[var(--primary-low)]" : ""}>
              <th className={`${base} text-[var(--text-muted)]`}>{i}</th>
              {r.map((v, j) => {
                const lit = cell !== null && cell[0] === i && cell[1] === j;
                const tone = lit ? "text-[#1f1300] bg-[#f59e0b] font-bold" : fIsZero(v) ? "text-[var(--text-muted)] opacity-50" : "text-[var(--text-main)]";
                const click = onPick ? "cursor-pointer hover:outline hover:outline-1 hover:outline-[var(--primary)]" : "";
                return (
                  <td key={j} onClick={onPick ? () => onPick(i, j) : undefined} className={`${base} border border-[var(--border)] ${click} ${tone}`}>
                    {fStr(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
