"use client";

// ── MatrixProduct: A · B filled in one entry at a time ────────────────────────
// A formula card (like LiveFormula) for multiplying matrices by hand. The
// playback bar fills the product entry by entry, in reading order; for the
// entry being made, its row of A and its column of B light up, and the pairs
// that get multiplied share a colour (first pair amber, second green, …), the
// same colours as the sum written out underneath. Every number of A and B can
// be typed over, presets load the chapter's examples, and "BA" swaps the order
// when the sizes allow it. Clicking an entry of the product jumps to it.

import { useEffect, useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Transport } from "@/components/lesson/kit/Transport";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { render } from "./Tex";

export type MatrixPreset = { name: string; A: number[][]; B: number[][]; names?: [string, string] };

// Colours of the multiplied pairs: a class for the cells, the macro for the TeX
const PAIRS = ["amber", "green", "blue", "purple"] as const;

const fmt = (v: number) => String(Math.round(v * 1000) / 1000).replace("-", "−");
const par = (v: number) => (v < 0 ? `(${fmt(v)})` : fmt(v));
const toText = (M: number[][]) => M.map(row => row.map(fmt));
const toNum = (s: string) => {
  const v = parseFloat(s.replace("−", "-").replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};

/** One bracketed grid of cells. */
function Grid({ name, rows, cols, cell }: {
  name: string; rows: number; cols: number;
  cell: (i: number, j: number) => ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-[11px] text-[var(--text-muted)]">{name}</span>
      <div className="mxp-grid" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
        {Array.from({ length: rows * cols }, (_, k) => cell(Math.floor(k / cols), k % cols))}
      </div>
    </div>
  );
}

export function MatrixProduct({ t, label, presets, note }: {
  t?: TrackTranslations;
  label?: string;
  presets: MatrixPreset[];
  note?: ReactNode;
}) {
  const [preset, setPreset] = useState(0);
  const [A, setA] = useState(() => toText(presets[0].A));
  const [B, setB] = useState(() => toText(presets[0].B));
  const [names, setNames] = useState<[string, string]>(presets[0].names ?? ["A", "B"]);
  const [k, setK] = useState(1);                 // entries filled so far (1 … m·p)
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();

  const m = A.length, n = B.length, p = B[0].length;
  const total = m * p;
  const a = A.map(row => row.map(toNum)), b = B.map(row => row.map(toNum));
  const entry = (i: number, j: number) => a[i].reduce((s, x, l) => s + x * b[l][j], 0);
  const ci = Math.floor((k - 1) / p), cj = (k - 1) % p;     // the entry being made
  const canSwap = p === m;                                   // BA needs B's rows as long as A's columns

  // Playing fills the next entry every ~1.3 s (scaled by the shared speed)
  useEffect(() => {
    if (!playing) return;
    if (k >= total) { setPlaying(false); return; }
    const id = setTimeout(() => setK(s => Math.min(total, s + 1)), scaledMs(1300, speed));
    return () => clearTimeout(id);
  }, [playing, k, total, speed]);

  const load = (idx: number) => {
    const pr = presets[idx];
    setPreset(idx); setA(toText(pr.A)); setB(toText(pr.B)); setNames(pr.names ?? ["A", "B"]);
    setK(1); setPlaying(false);
  };
  const swap = () => {
    setA(B); setB(A); setNames(([x, y]) => [y, x]);
    setK(1); setPlaying(false);
  };
  const play = () => {
    if (playing) { setPlaying(false); return; }
    if (k >= total) setK(1);
    setPlaying(true);
  };
  const edit = (which: "A" | "B", i: number, j: number, v: string) =>
    (which === "A" ? setA : setB)(M => M.map((row, r) => (r === i ? row.map((c, s) => (s === j ? v : c)) : row)));

  const input = (which: "A" | "B", M: string[][], i: number, j: number, pair: number) => (
    <input key={`${i}-${j}`} value={M[i][j]} inputMode="decimal" aria-label={`${which === "A" ? names[0] : names[1]} ${i + 1},${j + 1}`}
      onChange={e => edit(which, i, j, e.target.value)}
      className={`mxp-cell mxp-in ${pair >= 0 ? `mxp-pair tx-${PAIRS[pair % PAIRS.length]}` : "mxp-dim"}`} />
  );

  // The sum for the entry being made, its pairs in their colours
  const terms = a[ci].map((x, l) => `\\${PAIRS[l % PAIRS.length]}{${par(x)}\\cdot ${par(b[l][cj])}}`).join(" + ");
  const sum = `(${names[0]}${names[1]})_{${ci + 1}${cj + 1}} = ${terms} = \\mathbf{${fmt(entry(ci, cj))}}`;
  const rowCol = tx(t, "lxMat_rowCol", "row {i} of {A} · column {j} of {B}")
    .replace("{i}", String(ci + 1)).replace("{j}", String(cj + 1)).replace("{A}", names[0]).replace("{B}", names[1]);

  return (
    <div className="eq-card my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
      {label && <div className="px-4 pt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</div>}
      <div className="px-4 pt-3 flex flex-wrap gap-1.5">
        {presets.map((pr, idx) => (
          <button key={idx} type="button" onClick={() => load(idx)} aria-pressed={preset === idx}
            className={`px-2 py-0.5 rounded-md border text-[11.5px] transition-colors ${preset === idx
              ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
            {pr.name}
          </button>
        ))}
        {canSwap && (
          <button type="button" onClick={swap} title={tx(t, "lxMat_swapTip", "multiply in the other order")}
            className="ml-auto px-2 py-0.5 rounded-md border border-[var(--border)] text-[11.5px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors">
            ⇄ {names[1]}{names[0]}
          </button>
        )}
      </div>

      <div className="px-4 pt-4 pb-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-[var(--text-main)]">
        <Grid name={names[0]} rows={m} cols={n} cell={(i, j) => input("A", A, i, j, i === ci ? j : -1)} />
        <span className="text-[var(--text-muted)]">·</span>
        <Grid name={names[1]} rows={n} cols={p} cell={(i, j) => input("B", B, i, j, j === cj ? i : -1)} />
        <span className="text-[var(--text-muted)]">=</span>
        <Grid name={names[0] + names[1]} rows={m} cols={p} cell={(i, j) => {
          const idx = i * p + j;
          const state = idx === k - 1 ? "mxp-now" : idx < k ? "" : "mxp-todo";
          return (
            <button key={`${i}-${j}`} type="button" onClick={() => { setPlaying(false); setK(idx + 1); }}
              className={`mxp-cell mxp-out ${state}`}>
              {idx < k ? fmt(entry(i, j)) : "?"}
            </button>
          );
        }} />
      </div>

      <div key={k} className="eq-words mx-4 mb-2 rounded-lg border-l-[3px] border-[var(--primary)] bg-[var(--primary-low)] px-3 py-2 overflow-x-auto">
        <div className="text-[12px] font-mono text-[var(--primary)] mb-1">{rowCol}</div>
        <div className="text-[var(--text-main)]" dangerouslySetInnerHTML={{ __html: render(sum, false) }} />
      </div>
      <Transport t={t} speed playing={playing} onPlay={play}
        onStep={k < total ? () => { setPlaying(false); setK(s => s + 1); } : undefined}
        onBack={k > 1 ? () => { setPlaying(false); setK(s => s - 1); } : undefined}
        onReset={() => { setPlaying(false); setK(1); }}
        readout={`${k} / ${total}`} />
      <div className="px-4 pb-3.5 pt-2 border-t border-[var(--separator)] text-[13px] text-[var(--text-muted)] leading-relaxed">
        {note ?? tx(t, "lxMat_hint", "Type any number in either matrix. Click an entry of the product to see how it is made.")}
      </div>
    </div>
  );
}
