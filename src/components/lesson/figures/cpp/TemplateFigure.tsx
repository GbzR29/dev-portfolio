"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Figure } from "@/components/lesson/kit/figure";
import { CALLS, DEFAULT_ON, MANGLED, build, demangled, sourceLines, type CallId, type TypeName } from "./templateModel";

// ── What this figure shows ────────────────────────────────────────────────────
// A template is a recipe, not a function. Tick calls to max_of in main: each
// one deduces T from its arguments (shown for the selected call), and every
// distinct T makes the compiler write one real function, shown on the right
// with T filled in and the symbol name the linker sees. "Break it": a call
// whose arguments disagree on T, a type without operator<, and moving the
// body into max.cpp, which turns every use into a linker error.

const TYPE_COL: Record<TypeName, string> = { int: C.sky, double: C.green, "std::string": C.purple, Mesh: C.red };

export function TemplateFigure({ t }: { t?: TrackTranslations }) {
  const [on, setOn] = useState<Set<CallId>>(new Set(DEFAULT_ON));
  const [sel, setSel] = useState<CallId>("i37");
  const [split, setSplit] = useState(false);
  const b = build(on, split);
  const call = CALLS.find(c => c.id === sel)!;
  const nCalls = CALLS.filter(c => on.has(c.id)).length;

  const toggle = (id: CallId) => {
    const next = new Set(on);
    if (next.has(id)) next.delete(id); else { next.add(id); setSel(id); }
    setOn(next);
  };

  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const codeBox = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 font-mono text-[11.5px] leading-[1.55] overflow-x-auto";

  const deduction = () => {
    if (call.explicit) return tx(t, "figCppTpl_dedExplicit", "T is written in the angle brackets, so nothing is deduced: T = double, and the int 1 is converted to 1.0 like any function argument.");
    if (!call.T) return tx(t, "figCppTpl_dedConflict", "a says T is int, b says T is double. Deduction never converts: two different answers, so it fails.");
    return `${tx(t, "figCppTpl_dedSame", "Both arguments agree, so")} T = ${call.T}.`;
  };

  return (
    <Figure
      title={tx(t, "figCppTpl_title", "One template, many functions: what the compiler writes")}
      controls={
        <label className="flex items-center gap-2 text-[12px] text-[var(--text-main)] cursor-pointer select-none">
          <input type="checkbox" checked={split} onChange={e => setSplit(e.target.checked)} className="accent-[var(--primary)]" />
          {tx(t, "figCppTpl_split", "Break it: keep only the declaration in max.h and move the body to max.cpp")}
        </label>
      }
      note={tx(t, "figCppTpl_note", "Tick and untick calls, and click one to see how its T is found. Two calls with the same T share one function. Break it: tick max_of(1, 2.5), then max_of(m1, m2), then move the body to max.cpp and watch the Mesh error move from the compiler to the linker.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Source and calls ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <div>
            {label(tx(t, "figCppTpl_source", "the template"))}
            <pre className={codeBox + " text-[var(--text-muted)]"}>{sourceLines(split, on.has("mesh")).join("\n")}</pre>
          </div>
          <div>
            {label(tx(t, "figCppTpl_calls", "calls in main.cpp"))}
            <div className="flex flex-col gap-1">
              {CALLS.map(c => {
                const active = on.has(c.id);
                return (
                  <div key={c.id} className="flex items-center gap-2 rounded-md px-1.5 py-0.5"
                    style={{ background: sel === c.id ? "var(--primary-low)" : undefined }}>
                    <input type="checkbox" checked={active} onChange={() => toggle(c.id)} className="accent-[var(--primary)] shrink-0"
                      aria-label={c.code} />
                    <button type="button" onClick={() => setSel(c.id)} className="font-mono text-[11.5px] text-left min-w-0 break-all"
                      style={{ color: active ? "var(--text-main)" : "var(--text-muted)", opacity: active ? 1 : 0.6 }}>
                      {c.code};
                    </button>
                    <span className="ml-auto font-mono text-[11px] shrink-0" style={{ color: c.T ? TYPE_COL[c.T] : C.red }}>
                      {c.T ? `T = ${c.T}` : "T = ?"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={codeBox} aria-live="polite">
            {label(tx(t, "figCppTpl_deduce", "how T is found for the selected call"))}
            <div className="font-mono text-[12px] text-[var(--text-main)] mb-1">{call.code}</div>
            {call.args.map(([arg, ty], i) => (
              <div key={i} className="font-mono text-[11.5px] flex gap-2">
                <span className="text-[var(--text-muted)]">{i === 0 ? "a" : "b"} ←</span>
                <span className="text-[var(--text-main)] min-w-0 break-all">{arg}</span>
                <span className="ml-auto shrink-0" style={{ color: !call.T && i === 1 ? C.red : C.amber }}>{ty}</span>
              </div>
            ))}
            <p className="font-sans text-[12.5px] leading-relaxed text-[var(--text-main)] mt-1.5">{deduction()}</p>
            {call.result && on.has(call.id) && b.stage === "ok" && (
              <div className="font-mono text-[11.5px] mt-1" style={{ color: C.green }}>→ {call.result}</div>
            )}
          </div>
        </div>

        {/* ── Generated functions and the build ── */}
        <div className="p-3 min-w-0 flex flex-col gap-3">
          <div>
            {label(`${tx(t, "figCppTpl_generated", "functions the compiler writes")} · ${nCalls} ${tx(t, "figCppTpl_callsN", "calls")} → ${split ? 0 : b.types.filter(T => T !== "Mesh" || b.stage !== "compile").length} ${tx(t, "figCppTpl_fnN", "functions")}`)}
            {b.types.length === 0 && <div className="text-[12px] text-[var(--text-muted)]">{tx(t, "figCppTpl_none", "None: a template that is never used produces no code at all.")}</div>}
            <div className="grid md:grid-cols-2 gap-2">
              {b.types.map(T => {
                const failed = T === "Mesh" && !split;
                return (
                  <div key={T} className="rounded-lg border bg-[var(--code-surface)] px-2.5 py-2 font-mono text-[11.5px] min-w-0"
                    style={{ borderColor: failed ? C.red : TYPE_COL[T], opacity: split ? 0.55 : 1, borderStyle: split ? "dashed" : "solid" }}>
                    <div className="flex justify-between gap-2 text-[11px] mb-1">
                      <span className="font-bold" style={{ color: TYPE_COL[T] }}>T = {T}</span>
                      <span className="text-[var(--text-muted)]">{(b.uses[T] ?? []).length}× {tx(t, "figCppTpl_used", "used")}</span>
                    </div>
                    <div className="whitespace-pre text-[var(--text-main)] overflow-x-auto">
                      {`${T} max_of(${T} a, ${T} b) {\n    return a < b ? b : a;\n}`}
                    </div>
                    <div className="mt-1.5 text-[10.5px] text-[var(--text-muted)] break-all">
                      {split
                        ? tx(t, "figCppTpl_noBody", "not written: main.cpp cannot see the body")
                        : failed ? <span style={{ color: C.red }}>{tx(t, "figCppTpl_failed", "fails: Mesh has no <")}</span>
                        : <>{demangled(T)}<br />{MANGLED[T]}</>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 font-mono text-[11px] leading-[1.5]">
            {label(b.stage === "link" ? tx(t, "figCppTpl_linker", "g++ main.cpp max.cpp: the linker") : tx(t, "figCppTpl_compiler", "g++ -std=c++23: the compiler"))}
            {b.stage === "ok"
              ? <div style={{ color: C.green }}>{tx(t, "figCppTpl_ok", "builds without errors")}</div>
              : b.errors.map((e, i) => <pre key={i} className="whitespace-pre-wrap break-words mb-1" style={{ color: C.red }}>{e}</pre>)}
            {b.stage === "link" && (
              <p className="font-sans text-[12.5px] leading-relaxed text-[var(--text-main)] mt-1">
                {tx(t, "figCppTpl_linkWhy", "main.cpp compiled fine against the declaration and left a call to each max_of<T> for the linker to resolve. max.cpp has the body, but nothing there uses it, so it writes no function at all. Nobody writes them: undefined reference.")}
              </p>
            )}
          </div>
        </div>
      </div>
    </Figure>
  );
}
