"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Slider } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { SOURCE, fill, runEager, runLazy, type Mode, type Order, type Stage } from "./pipelineModel";

// ── What this figure shows ────────────────────────────────────────────────────
// A range pipeline, one step at a time. v holds ten ints; the pipeline keeps
// the even ones, squares them and takes the first N. Lazy (views): the loop
// pulls one element at a time through the stages, and the elements after the
// last one needed are never read. Eager (the C++98 way): every stage fills a
// whole temporary vector first. The counters compare the work done. "Break
// it": put take first, and the pipeline answers a different question.

const CODE: Record<Mode, Record<Order, (n: number) => string[]>> = {
  lazy: {
    ftt: n => [
      "auto p = v | std::views::filter(is_even)",
      "           | std::views::transform(square)",
      `           | std::views::take(${n});`,
      "for (int x : p) std::println(\"{}\", x);",
    ],
    tft: n => [
      `auto p = v | std::views::take(${n})`,
      "           | std::views::filter(is_even)",
      "           | std::views::transform(square);",
      "for (int x : p) std::println(\"{}\", x);",
    ],
  },
  eager: {
    ftt: n => [
      "std::vector<int> evens, squares;",
      "std::ranges::copy_if(v, std::back_inserter(evens), is_even);",
      "std::ranges::transform(evens, std::back_inserter(squares), square);",
      `for (int i = 0; i < ${n} && i < squares.size(); ++i) std::println("{}", squares[i]);`,
    ],
    tft: n => [
      "std::vector<int> first, evens, squares;",
      `std::copy_n(v.begin(), ${n}, std::back_inserter(first));`,
      "std::ranges::copy_if(first, std::back_inserter(evens), is_even);",
      "std::ranges::transform(evens, std::back_inserter(squares), square);",
      "for (int x : squares) std::println(\"{}\", x);",
    ],
  },
};

// Which code line each stage lives on.
const LINE: Record<Mode, Record<Order, Partial<Record<Stage, number>>>> = {
  lazy: { ftt: { filter: 0, transform: 1, take: 2, loop: 3 }, tft: { take: 0, filter: 1, transform: 2, loop: 3 } },
  eager: { ftt: { filter: 1, transform: 2, loop: 3 }, tft: { take: 1, filter: 2, transform: 3, loop: 4 } },
};

const MARK_COLOR = { pass: C.green, fail: C.red, read: C.sky } as const;

export function PipelineFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("lazy");
  const [order, setOrder] = useState<Order>("ftt");
  const [n, setN] = useState(3);
  const snaps = useMemo(() => (mode === "lazy" ? runLazy(order, n) : runEager(order, n)), [mode, order, n]);
  const s = useStepper(snaps.length - 1, 900, 350);
  const k = Math.max(0, Math.min(snaps.length - 1, Math.floor(s.raw + 1e-9)));
  const snap = snaps[k];
  const code = CODE[mode][order](n);
  const cur = snap.stage ? LINE[mode][order][snap.stage] : undefined;

  const pickMode = (m: Mode) => { setMode(m); s.restart(); };
  const pickOrder = (o: Order) => { setOrder(o); s.restart(); };
  const pickN = (v: number) => { setN(v); s.restart(); };

  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const box = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2";

  const stages: Stage[] = order === "ftt" ? ["filter", "transform", "take"] : ["take", "filter", "transform"];
  const stageName: Record<Stage, string> = { filter: "filter(is_even)", transform: "transform(square)", take: `take(${n})`, loop: "for" };

  const counters: [string, number, string][] = [
    [tx(t, "figCppPipe_cReads", "elements of v read"), snap.count.reads, C.sky],
    [tx(t, "figCppPipe_cPreds", "is_even calls"), snap.count.preds, C.amber],
    [tx(t, "figCppPipe_cSquares", "square calls"), snap.count.squares, C.purple],
    [tx(t, "figCppPipe_cVectors", "temporary vectors"), snap.count.vectors, snap.count.vectors ? C.red : C.green],
  ];

  return (
    <Figure
      title={tx(t, "figCppPipe_title", "A range pipeline, one element at a time")}
      head={<Choice value={mode} onChange={pickMode} options={[
        ["lazy", tx(t, "figCppPipe_lazy", "views (lazy)")],
        ["eager", tx(t, "figCppPipe_eager", "vectors (eager)")],
      ]} />}
      controls={
        <div className="flex flex-col gap-3">
          <div className="flex gap-1.5 items-center" style={{ flexWrap: "wrap" }}>
            <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppPipe_order", "Order")}</span>
            <Choice value={order} onChange={pickOrder} options={[
              ["ftt", "filter | transform | take"],
              ["tft", `take | filter | transform · ${tx(t, "figCppPipe_breakIt", "break it")}`],
            ]} />
          </div>
          <Slider label="take N" value={n} min={1} max={5} step={1} onChange={pickN} fmt={v => String(v)} />
        </div>
      }
      note={tx(t, "figCppPipe_note", "Press play and follow the colours on v: blue is read, green passed the filter, red was rejected, grey was never touched. Compare the counters of the two modes. Break it: put take first. It now takes the first N elements of v, not the first N even ones, and the output changes.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Code and explanation ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <ol className="font-mono text-[11.5px] leading-[1.55] overflow-x-auto">
            {code.map((ln, i) => (
              <li key={i} className={`flex items-start gap-2 rounded px-1 ${i === cur ? "bg-[var(--primary-low)]" : ""}`}>
                <span className="w-4 shrink-0 text-right text-[var(--text-muted)] opacity-60 select-none">{i + 1}</span>
                <span className={`whitespace-pre flex-1 ${i === cur ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{ln}</span>
              </li>
            ))}
          </ol>
          <p className="text-[13px] leading-relaxed text-[var(--text-main)] min-h-[4.5rem]" aria-live="polite">
            {fill(tx(t, `figCppPipe_ev_${snap.kind}`, snap.en), snap)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {counters.map(([name, v, col]) => (
              <div key={name} className={box}>
                <div className="text-[10px] text-[var(--text-muted)] leading-tight">{name}</div>
                <div className="font-mono text-[18px] font-bold" style={{ color: col }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── v, the stages, the output ── */}
        <div className="min-w-0 flex flex-col">
          <div className="p-3 flex-1 flex flex-col gap-3">
            <div>
              {label("std::vector<int> v")}
              <div className="grid grid-cols-10 gap-1 font-mono">
                {SOURCE.map((x, i) => {
                  const m = snap.marks[i];
                  const col = m ? MARK_COLOR[m] : undefined;
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-full rounded-md border-2 text-center text-[13px] py-1 transition-colors"
                        style={{
                          borderColor: snap.at === i ? "var(--text-main)" : col ?? "var(--code-border)",
                          background: col ? `color-mix(in srgb, ${col} 18%, transparent)` : "var(--code-surface)",
                          color: col ? "var(--text-main)" : "var(--text-muted)",
                          opacity: m || !snap.done ? 1 : 0.45,
                        }}>{x}</div>
                      <span className="text-[9px] text-[var(--text-muted)] mt-0.5">{i}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {mode === "lazy" ? (
              <div className="flex flex-col gap-1.5">
                {label(tx(t, "figCppPipe_stages", "the view's stages, inner to outer"))}
                {stages.map(st => {
                  const on = snap.stage === st;
                  const last = snap.last[st];
                  return (
                    <div key={st} className="flex items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 font-mono text-[12px] bg-[var(--code-surface)]"
                      style={{ borderColor: on ? "var(--primary)" : "var(--code-border)" }}>
                      <span className="text-[var(--text-main)]">{stageName[st]}</span>
                      {st === "take" && snap.left !== null && order === "ftt" &&
                        <span className="text-[11px] text-[var(--text-muted)]">{tx(t, "figCppPipe_left", "counter, lowered at each ++")}: <b style={{ color: C.amber }}>{snap.left}</b></span>}
                      {last !== undefined && <span className="ml-auto text-[11px]" style={{ color: C.sky }}>→ {last}</span>}
                    </div>
                  );
                })}
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {tx(t, "figCppPipe_noStore", "A view stores no elements: only a reference to v, the functions and a counter. Each value exists only while it travels to the loop.")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {label(tx(t, "figCppPipe_temps", "temporary vectors on the heap"))}
                {snap.temps.length === 0 && <span className="text-[12px] text-[var(--text-muted)]">—</span>}
                {snap.temps.map(tm => (
                  <div key={tm.name} className="flex items-center gap-2 font-mono text-[12px] flex-wrap">
                    <span className="w-16 text-[var(--text-main)]">{tm.name}</span>
                    {tm.items.map((x, i) => (
                      <span key={i} className="rounded border px-1.5 py-0.5" style={{ borderColor: C.red, color: "var(--text-main)", background: `color-mix(in srgb, ${C.red} 10%, transparent)` }}>{x}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className={box + " font-mono text-[12px] min-h-[3rem]"}>
              {label(tx(t, "figCppPipe_output", "output"))}
              {snap.out.length ? <span style={{ color: C.green }}>{snap.out.join("  ")}</span> : <span className="text-[var(--text-muted)]">—</span>}
            </div>
          </div>
          <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
            readout={`${tx(t, "figCppPipe_step", "step")} ${k + 1} / ${snaps.length}`} />
        </div>
      </div>
    </Figure>
  );
}
