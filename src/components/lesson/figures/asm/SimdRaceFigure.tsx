"use client";

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Figure } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// The same sum of 32 ints done three ways at once, one trip of the loop per
// step: scalar (one add per trip), SSE (paddd adds 4 lanes per trip) and AVX2
// (vpaddd adds 8). Each row shows the array, with the elements already added
// filled in, and the accumulator register split into its lanes, each holding a
// partial sum. After the last trip the vector rows fold their lanes together
// (shift and add, as gcc -O3 does) until one number is left. The measured
// times come from summing 4,096 ints on a Ryzen 5 5600X with gcc 14.

const N = 32;
const DATA = Array.from({ length: N }, (_, i) => (i * 5) % 9 + 1);
const TOTAL = DATA.reduce((a, b) => a + b, 0);
const mono = "font-mono tabular-nums";

type Row = { name: string; w: number; color: string; ns: string; op: string };
const ROWS: Row[] = [
  { name: "scalar", w: 1, color: C.muted, ns: "0.268", op: "add" },
  { name: "SSE", w: 4, color: C.sky, ns: "0.052", op: "paddd" },
  { name: "AVX2", w: 8, color: C.purple, ns: "0.025", op: "vpaddd" },
];

/** The lanes of a w-wide accumulator after `trips` trips, then `folds` folding steps. */
function lanes(w: number, trips: number, folds: number) {
  const acc = Array.from({ length: w }, (_, l) => {
    let s = 0;
    for (let k = 0; k < trips; k++) s += DATA[k * w + l];
    return s;
  });
  let live = w;
  for (let f = 0; f < folds; f++) {
    live /= 2;
    for (let l = 0; l < live; l++) acc[l] += acc[l + live];
    for (let l = live; l < live * 2; l++) acc[l] = 0;
  }
  return { acc, live };
}

export function SimdRaceFigure({ t }: { t?: TrackTranslations }) {
  const maxSteps = N;                                // the scalar row is the longest
  const s = useStepper(maxSteps, 700, 300);
  const k = Math.max(0, Math.min(maxSteps, Math.floor(s.raw + 1e-9)));

  return (
    <Figure
      title={tx(t, "figAsmSimd_title", "One add per trip, or four, or eight")}
      note={tx(t, "figAsmSimd_how", "Press play: each step is one trip round each loop. The vector rows finish their trips early, then fold their lanes into one sum. The times on the right were measured for 4,096 ints.")}
    >
      <div className="flex flex-col">
        <div className="p-3 sm:p-4 flex flex-col gap-4">
          {ROWS.map(r => {
            const trips = N / r.w, folds = Math.log2(r.w), total = trips + folds;
            const tr = Math.min(k, trips), fo = Math.max(0, Math.min(k - trips, folds));
            const { acc, live } = lanes(r.w, tr, fo);
            const done = k >= total;
            const status = done
              ? tx(t, "figAsmSimd_done", "done in {n} steps").replace("{n}", String(total))
              : k < trips || r.w === 1
                ? tx(t, "figAsmSimd_trip", "trip {k} of {n}").replace("{k}", String(tr)).replace("{n}", String(trips))
                : tx(t, "figAsmSimd_fold", "folding the lanes");
            return (
              <div key={r.name} className="flex flex-col gap-1.5">
                <div className="flex items-baseline gap-2" style={{ flexWrap: "wrap" }}>
                  <span className={`${mono} text-[12px] font-bold`} style={{ color: r.color === C.muted ? "var(--text-main)" : r.color }}>{r.w === 1 ? tx(t, "figAsmSimd_scalar", "scalar") : r.name}</span>
                  <span className={`${mono} text-[11px] text-[var(--text-muted)]`}>{r.op} · {r.w} {r.w === 1 ? tx(t, "figAsmSimd_lane", "lane") : tx(t, "figAsmSimd_lanes", "lanes")}</span>
                  <span className={`${mono} text-[11px] ml-auto`} style={{ color: done ? C.green : "var(--text-muted)" }}>{status}</span>
                </div>
                <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
                  {DATA.map((v, i) => {
                    const used = i < tr * r.w;
                    const now = k > 0 && k <= trips && i >= (k - 1) * r.w && i < k * r.w;
                    return (
                      <span key={i} className={`${mono} h-6 rounded-sm flex items-center justify-center text-[9px] sm:text-[10px]`}
                        style={{
                          background: used ? (r.color === C.muted ? "var(--code-line)" : r.color) : "transparent",
                          opacity: used && !now ? 0.45 : 1,
                          border: `1px solid ${used ? "transparent" : "var(--code-border)"}`,
                          color: used && r.color !== C.muted ? "#0b1220" : "var(--text-muted)",
                        }}>{v}</span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5" style={{ flexWrap: "wrap" }}>
                  <span className={`${mono} text-[10.5px] text-[var(--text-muted)] w-14`}>{r.w === 1 ? "eax" : r.w === 4 ? "xmm0" : "ymm0"}</span>
                  {acc.map((v, l) => (
                    <span key={l} className={`${mono} min-w-[2.2rem] px-1.5 py-0.5 rounded border text-center text-[11.5px]`}
                      style={{ borderColor: l < live ? (r.color === C.muted ? "var(--border)" : r.color) : "var(--code-border)", color: l < live ? "var(--text-main)" : "var(--text-muted)", opacity: l < live ? 1 : 0.4 }}>
                      {v}
                    </span>
                  ))}
                  <span className={`${mono} text-[11px] ml-auto text-[var(--text-muted)]`}>{r.ns} ns / {tx(t, "figAsmSimd_elem", "element")}</span>
                </div>
              </div>
            );
          })}
          <p className={`${mono} text-[11px] text-[var(--text-muted)]`}>{tx(t, "figAsmSimd_total", "the right answer: {n}").replace("{n}", String(TOTAL))}</p>
        </div>
        <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
          readout={`${tx(t, "figAsmCpu_step", "step")} ${k} / ${maxSteps}`} />
      </div>
    </Figure>
  );
}
