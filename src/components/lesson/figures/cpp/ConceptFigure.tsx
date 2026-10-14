"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Row } from "@/components/lesson/kit/figure";
import {
  AMBIGUOUS, DEFS, OVERLOADS, REPORT_SRC, REQS, TYPES, isShape, isSolid, pick, reportError, req,
  type ReqState, type TypeId,
} from "./conceptModel";

// ── What this figure shows ────────────────────────────────────────────────────
// A concept is a checklist the compiler runs on a type. Pick a type: each
// requirement of Shape and Solid is ticked or crossed (with why), describe()
// picks the most constrained overload that accepts it, and report_all() shows
// the error you get for a non-Shape, with or without the constraint. "Break
// it": write Solid by copying Shape's lines instead of naming Shape, and the
// Sphere call becomes ambiguous.

const STATE_COL: Record<ReqState, string> = { ok: C.green, invalid: C.red, rtype: C.amber };

export function ConceptFigure({ t }: { t?: TrackTranslations }) {
  const [T, setT] = useState<TypeId>("Text");
  const [copied, setCopied] = useState(false);
  const [constrained, setConstrained] = useState(true);
  const p = pick(T, copied);
  const err = reportError(T, constrained);

  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const codeHead = (code: string, rest?: string) => (
    <div className="text-[11.5px] mb-1 whitespace-pre">
      <span className="text-[var(--text-main)]">{code}</span>
      {rest && <span className="font-sans text-[11px] text-[var(--text-muted)]">  {rest}</span>}
    </div>
  );
  const box = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 font-mono text-[11.5px] leading-[1.55] overflow-x-auto";
  const stateText = (s: ReqState) => s === "ok" ? tx(t, "figCppCpt_ok", "satisfied")
    : s === "invalid" ? tx(t, "figCppCpt_invalid", "does not compile") : tx(t, "figCppCpt_rtype", "compiles, but gives void");
  const verdict = (yes: boolean, name: string) => (
    <span className="font-bold" style={{ color: yes ? C.green : C.red }}>
      {T} {yes ? tx(t, "figCppCpt_is", "is a") : tx(t, "figCppCpt_isNot", "is not a")} {name}
    </span>
  );

  const reqRow = (id: (typeof REQS)[number]) => {
    const s = req(T, id.id);
    return (
      <div key={id.id} className="flex items-start gap-2">
        <span className="w-3 shrink-0 font-bold" style={{ color: STATE_COL[s] }}>{s === "ok" ? "✓" : "✗"}</span>
        <div className="flex-1 flex items-start gap-x-2" style={{ flexWrap: "wrap" }}>
          <span className="text-[var(--text-main)] whitespace-pre">{id.code}</span>
          <span className="ml-auto shrink-0 font-sans text-[11px]" style={{ color: STATE_COL[s] }}>{stateText(s)}</span>
        </div>
      </div>
    );
  };

  return (
    <Figure
      title={tx(t, "figCppCpt_title", "Concepts: the compiler's checklist for a type")}
      head={<Choice value={T} onChange={setT} options={TYPES.map(x => [x, x] as [TypeId, string])} />}
      controls={<>
        <Row>
          <label className="flex items-center gap-2 text-[12px] text-[var(--text-main)] cursor-pointer select-none">
            <input type="checkbox" checked={constrained} onChange={e => setConstrained(e.target.checked)} className="accent-[var(--primary)]" />
            {tx(t, "figCppCpt_swConstrained", "report_all is constrained with Shape")}
          </label>
        </Row>
        <Row>
          <label className="flex items-center gap-2 text-[12px] text-[var(--text-main)] cursor-pointer select-none">
            <input type="checkbox" checked={copied} onChange={e => setCopied(e.target.checked)} className="accent-[var(--primary)]" />
            {tx(t, "figCppCpt_swCopied", "Break it: write Solid by copying Shape's two lines instead of naming Shape<T>")}
          </label>
        </Row>
      </>}
      note={tx(t, "figCppCpt_note", "Try every type. Text and int fail Shape outright; Blob is the sneaky one: it has an area(), but area() gives nothing. Untick the constraint to see where the same mistake is reported without it. Then break it with Sphere selected.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── The type and the checklist ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <div>
            {label(tx(t, "figCppCpt_type", "the type"))}
            <pre className={box + " text-[var(--text-muted)]"}>{DEFS[T].join("\n")}</pre>
          </div>
          <div className={box}>
            {codeHead("concept Shape = requires(const T& s) {")}
            {REQS.slice(0, 2).map(reqRow)}
            <div className="mt-1 text-[12px]">→ {verdict(isShape(T), "Shape")}</div>
          </div>
          <div className={box}>
            {codeHead(copied ? "concept Solid = requires(const T& s) {   // copied" : "concept Solid = Shape<T> && requires(const T& s) {")}
            {copied ? REQS.map(reqRow) : <>
              <div className="flex items-start gap-2">
                <span className="w-3 shrink-0 font-bold" style={{ color: isShape(T) ? C.green : C.red }}>{isShape(T) ? "✓" : "✗"}</span>
                <span className="text-[var(--text-main)]">Shape&lt;T&gt;</span>
              </div>
              {reqRow(REQS[2])}
            </>}
            <div className="mt-1 text-[12px]">→ {verdict(isSolid(T), "Solid")}</div>
          </div>
        </div>

        {/* ── Overloads and errors ── */}
        <div className="p-3 min-w-0 flex flex-col gap-3">
          <div className={box}>
            {codeHead(`describe(${T === "int" ? "42" : `${T}{…}`});`, tx(t, "figCppCpt_which", "which overload?"))}
            {OVERLOADS.map((o, i) => {
              const win = p.winner === i;
              // 3 beats 1 even when copied (any constraint beats none): the tie is between 2 and 3.
              const amb = p.winner === null && i > 0;
              return (
                <div key={i} className="flex items-start gap-x-2 rounded px-1" style={{ background: win ? "var(--primary-low)" : undefined, flexWrap: "wrap" }}>
                  <span className="whitespace-pre" style={{ color: p.viable[i] ? "var(--text-main)" : "var(--text-muted)", opacity: p.viable[i] ? 1 : 0.5, textDecoration: p.viable[i] ? undefined : "line-through" }}>{o}</span>
                  <span className="ml-auto pl-2 shrink-0 font-sans text-[11px]" style={{ color: win ? C.green : amb ? C.red : "var(--text-muted)" }}>
                    {win ? tx(t, "figCppCpt_wins", "chosen") : amb ? tx(t, "figCppCpt_tie", "tie") : p.viable[i] ? tx(t, "figCppCpt_viable", "viable") : tx(t, "figCppCpt_out", "rejected")}
                  </span>
                </div>
              );
            })}
            <p className="font-sans text-[12.5px] leading-relaxed text-[var(--text-main)] mt-1.5" aria-live="polite">
              {p.winner === null
                ? tx(t, "figCppCpt_ambWhy", "Overloads 2 and 3 both accept a Sphere. The compiler prefers the more constrained one only when it can prove that one includes the other, and it proves that by matching concept names, not by comparing text. Solid no longer mentions Shape, so neither wins.")
                : p.winner === 2
                  ? tx(t, "figCppCpt_solidWhy", "All three accept a Sphere. Solid is defined as Shape<T> plus more, so 3 is more constrained than 2, and 2 more than 1: the most specific one wins.")
                  : p.winner === 1
                    ? tx(t, "figCppCpt_shapeWhy", "3 is rejected (no volume). 2 and 1 both accept it, and 2 has a constraint while 1 has none, so 2 wins.")
                    : tx(t, "figCppCpt_anyWhy", "Only the unconstrained overload accepts this type, so it is chosen. A failed concept is not an error here: it just removes a candidate.")}
            </p>
            {p.winner === null
              ? <pre className="whitespace-pre-wrap break-words text-[11px] mt-1" style={{ color: C.red }}>{AMBIGUOUS}</pre>
              : <div className="mt-1" style={{ color: C.green }}>→ {p.out}</div>}
          </div>
          <div className={box}>
            {codeHead(`report_all(std::vector<${T}>{…});`)}
            <pre className="text-[var(--text-muted)] whitespace-pre overflow-x-auto mb-1.5">{REPORT_SRC(constrained).join("\n")}</pre>
            {err
              ? <>
                <pre className="whitespace-pre-wrap break-words text-[11px]" style={{ color: C.red }}>{err}</pre>
                <p className="font-sans text-[12.5px] leading-relaxed text-[var(--text-main)] mt-1.5">
                  {constrained
                    ? tx(t, "figCppCpt_errC", "The error is at your call in main.cpp, and its last line names the broken promise: the requirement this type does not meet.")
                    : tx(t, "figCppCpt_errU", "No promise was made, so the compiler accepts the call, starts writing the functions, and fails deep inside a helper you never called directly. You must read the chain of \"required from\" lines backwards to find your own line.")}
                </p>
              </>
              : <div style={{ color: C.green }}>{tx(t, "figCppCpt_builds", "builds: every element is printed with its name and area")}</div>}
          </div>
        </div>
      </div>
    </Figure>
  );
}
