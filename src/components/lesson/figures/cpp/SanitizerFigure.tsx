"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure } from "@/components/lesson/kit/figure";
import { BUGS, NOTES, RESULTS, TOOLS, type BugId, type ToolId, type Verdict } from "./sanitizerData";

// ── What this figure shows ────────────────────────────────────────────────────
// Five programs with one bug each, built five ways: plain, with warnings, and
// with the address, undefined-behaviour and thread sanitizers. The grid shows
// at a glance who catches what; clicking a cell shows that build's real
// output (gcc 14.2 on Linux, through Compiler Explorer) and what to notice.

const VERDICT_COLOR: Record<Verdict, string> = { caught: C.green, silent: C.red, na: "var(--text-muted)" };
const TOOL_NAMES: Record<ToolId, string> = { plain: "plain", warn: "warnings", asan: "ASan", ubsan: "UBSan", tsan: "TSan" };

export function SanitizerFigure({ t }: { t?: TrackTranslations }) {
  const [bug, setBug] = useState<BugId>("overflow");
  const [tool, setTool] = useState<ToolId>("plain");
  const prog = BUGS.find(b => b.id === bug)!;
  const cell = RESULTS[bug][tool];
  const flags = TOOLS.find(x => x.id === tool)!.flags;

  const box = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2";
  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const verdictText = (v: Verdict) =>
    v === "caught" ? tx(t, "figCppSan_caught", "caught") : v === "silent" ? tx(t, "figCppSan_silent", "silent") : tx(t, "figCppSan_na", "not its job");

  return (
    <Figure
      title={tx(t, "figCppSan_title", "Five bugs, five builds: who notices?")}
      head={<Choice value={tool} onChange={setTool} options={TOOLS.map(x => [x.id, tx(t, `figCppSan_tool_${x.id}`, TOOL_NAMES[x.id])] as [ToolId, string])} />}
      controls={
        <div className="flex gap-1.5 items-center" style={{ flexWrap: "wrap" }}>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppSan_bug", "The bug")}</span>
          <Choice value={bug} onChange={setBug} options={BUGS.map(b => [b.id, tx(t, `figCppSan_bug_${b.id}`, b.name)] as [BugId, string])} />
        </div>
      }
      note={tx(t, "figCppSan_note", "Pick a bug and a build, or click a square in the grid. Every output is real: gcc 14.2 on Linux, run through Compiler Explorer. Notice how often the plain build prints a believable number and exits normally.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Program and the grid ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <ol className="font-mono text-[11.5px] leading-[1.55] overflow-x-auto">
            {prog.code.map((ln, i) => (
              <li key={i} className={`flex items-start gap-2 rounded px-1 ${cell.line === i ? "bg-[var(--primary-low)]" : ""}`}>
                <span className="w-4 shrink-0 text-right text-[var(--text-muted)] opacity-60 select-none">{i + 1}</span>
                <span className={`whitespace-pre flex-1 ${cell.line === i ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{ln}</span>
              </li>
            ))}
          </ol>
          <div>
            {label(tx(t, "figCppSan_grid", "who catches what"))}
            <div className="grid gap-1 text-[10.5px]" style={{ gridTemplateColumns: "minmax(0,1.6fr) repeat(5, minmax(0,1fr))" }}>
              <span />
              {TOOLS.map(x => <span key={x.id} className="text-center text-[var(--text-muted)] truncate">{tx(t, `figCppSan_tool_${x.id}`, TOOL_NAMES[x.id])}</span>)}
              {BUGS.map(b => [
                <span key={b.id} className="truncate text-[var(--text-main)] self-center">{tx(t, `figCppSan_bug_${b.id}`, b.name)}</span>,
                ...TOOLS.map(x => {
                  const v = RESULTS[b.id][x.id].verdict;
                  const sel = b.id === bug && x.id === tool;
                  return (
                    <button key={b.id + x.id} type="button" onClick={() => { setBug(b.id); setTool(x.id); }}
                      title={`${b.name} · ${TOOL_NAMES[x.id]}: ${verdictText(v)}`}
                      className="h-6 rounded-md border-2 flex items-center justify-center"
                      style={{ borderColor: sel ? "var(--text-main)" : "transparent", background: `color-mix(in srgb, ${VERDICT_COLOR[v]} ${v === "na" ? 10 : 28}%, transparent)` }}>
                      <span className="block w-2 h-2 rounded-full" style={{ background: VERDICT_COLOR[v] }} />
                    </button>
                  );
                }),
              ])}
            </div>
            <div className="flex gap-3 mt-1.5 text-[10.5px] text-[var(--text-muted)]" style={{ flexWrap: "wrap" }}>
              {(["caught", "silent", "na"] as Verdict[]).map(v => (
                <span key={v} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: VERDICT_COLOR[v] }} />{verdictText(v)}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Output of the selected build ── */}
        <div className="p-3 flex flex-col gap-3 min-w-0">
          <div className="font-mono text-[11.5px] text-[var(--text-muted)]">$ {flags} example.cpp && ./a.out</div>
          <div className={box}>
            {label(tx(t, "figCppSan_stdout", "printed"))}
            <div className="font-mono text-[12px]" style={{ color: C.amber }}>{cell.out ?? "—"}</div>
            {cell.exit !== undefined && <div className="font-mono text-[10.5px] text-[var(--text-muted)] mt-1">{tx(t, "figCppSan_exit", "exit code")} {cell.exit}</div>}
          </div>
          <div className={box}>
            {label(tool === "warn" ? tx(t, "figCppSan_compiler", "compiler messages") : tx(t, "figCppSan_report", "report"))}
            {cell.report
              ? <pre className="font-mono text-[10.5px] leading-[1.5] overflow-x-auto whitespace-pre" style={{ color: cell.verdict === "caught" ? C.red : "var(--text-muted)" }}>{cell.report.join("\n")}</pre>
              : <span className="text-[12px] text-[var(--text-muted)]">{cell.verdict === "na" ? tx(t, "figCppSan_noRun", "(not shown: see below)") : tx(t, "figCppSan_nothing", "(nothing)")}</span>}
          </div>
          <p className="text-[12.5px] leading-relaxed text-[var(--text-main)]" aria-live="polite">
            <b style={{ color: VERDICT_COLOR[cell.verdict] }}>{verdictText(cell.verdict)}.</b>{" "}
            {tx(t, `figCppSan_n_${bug}_${tool}`, NOTES[`${bug}.${tool}`] ?? "")}
          </p>
        </div>
      </div>
    </Figure>
  );
}
