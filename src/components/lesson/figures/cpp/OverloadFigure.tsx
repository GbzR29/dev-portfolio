"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Row } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Overload resolution for one call, print(arg), against four overloads. For
// each overload the compiler finds the cheapest way to turn the argument into
// the parameter type, and ranks it: exact match < promotion < standard
// conversion < user-defined conversion (through a constructor) < not viable.
// The single best overload wins; two tied at the best rank make the call
// ambiguous; none viable is "no matching function". Overloads can be switched
// off ("break it") to show the surprises: 'x' with no print(int), and "hi"
// picking print(bool) over print(const std::string&).

type Rank = 0 | 1 | 2 | 3 | 4;                   // exact, promotion, conversion, user-defined, not viable
type OverloadId = "int" | "double" | "string" | "bool";
type ArgId = "i42" | "chx" | "btrue" | "l42" | "d35" | "f35" | "hi" | "name";

const OVERLOADS: { id: OverloadId; sig: string }[] = [
  { id: "int", sig: "void print(int n);" },
  { id: "double", sig: "void print(double x);" },
  { id: "string", sig: "void print(const std::string& s);" },
  { id: "bool", sig: "void print(bool b);" },
];

// The argument, its type, and how it reaches each parameter type: [rank, how]
const ARGS: Record<ArgId, { code: string; type: string; to: Record<OverloadId, [Rank, string]> }> = {
  i42: { code: "42", type: "int", to: {
    int: [0, "int → int"], double: [2, "int → double"], string: [4, "—"], bool: [2, "int → bool"] } },
  chx: { code: "'x'", type: "char", to: {
    int: [1, "char → int"], double: [2, "char → double"], string: [4, "—"], bool: [2, "char → bool"] } },
  btrue: { code: "true", type: "bool", to: {
    int: [1, "bool → int"], double: [2, "bool → double"], string: [4, "—"], bool: [0, "bool → bool"] } },
  l42: { code: "42L", type: "long", to: {
    int: [2, "long → int"], double: [2, "long → double"], string: [4, "—"], bool: [2, "long → bool"] } },
  d35: { code: "3.5", type: "double", to: {
    int: [2, "double → int"], double: [0, "double → double"], string: [4, "—"], bool: [2, "double → bool"] } },
  f35: { code: "3.5f", type: "float", to: {
    int: [2, "float → int"], double: [1, "float → double"], string: [4, "—"], bool: [2, "float → bool"] } },
  hi: { code: "\"hi\"", type: "const char[3]", to: {
    int: [4, "—"], double: [4, "—"], string: [3, "std::string(\"hi\")"], bool: [2, "const char* → bool"] } },
  name: { code: "name", type: "std::string", to: {
    int: [4, "—"], double: [4, "—"], string: [0, "std::string&"], bool: [4, "—"] } },
};

const RANK_EN = ["exact match", "promotion", "conversion", "user-defined conversion", "not viable"];
const RANK_COL = [C.green, C.teal, C.amber, C.orange, C.muted];

export function OverloadFigure({ t }: { t?: TrackTranslations }) {
  const [arg, setArg] = useState<ArgId>("i42");
  const [on, setOn] = useState<Record<OverloadId, boolean>>({ int: true, double: true, string: true, bool: false });
  const a = ARGS[arg];

  const live = OVERLOADS.filter(o => on[o.id]);
  const best = Math.min(4, ...live.map(o => a.to[o.id][0]));
  const winners = best < 4 ? live.filter(o => a.to[o.id][0] === best) : [];
  const result = winners.length === 1 ? "ok" : winners.length > 1 ? "ambiguous" : "none";
  const rankName = (r: Rank) => tx(t, `figCppOv_rank${r}`, RANK_EN[r]);

  const message = result === "ok"
    ? tx(t, "figCppOv_ok", "The call goes to the only overload with the best rank.")
    : result === "ambiguous"
      ? tx(t, "figCppOv_amb", "Two or more overloads tie for the best rank, and C++ will not guess between them: compile error. Add an exact overload, or convert the argument yourself, e.g. print(static_cast<double>(x)).")
      : tx(t, "figCppOv_none", "No overload can accept this argument: compile error.");

  const errorLine = result === "ambiguous"
    ? `error: call of overloaded 'print(${a.type === "const char[3]" ? "const char [3]" : a.type})' is ambiguous`
    : `error: no matching function for call to 'print(${a.type === "const char[3]" ? "const char [3]" : a.type})'`;

  return (
    <Figure
      title={tx(t, "figCppOv_title", "Overload resolution: which print does the call pick?")}
      controls={<>
        <Row>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppOv_call", "Call")} <code className="font-mono">print(…)</code> {tx(t, "figCppOv_with", "with")}</span>
          <Choice value={arg} onChange={setArg} options={(Object.keys(ARGS) as ArgId[]).map(k => [k, ARGS[k].code] as [ArgId, string])} />
        </Row>
        <div className="flex gap-x-4 gap-y-1 flex-wrap text-[11px] font-mono">
          {RANK_EN.map((_, r) => (
            <span key={r} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: RANK_COL[r] }} />
              <span className="text-[var(--text-muted)]">{r + 1}. {rankName(r as Rank)}</span>
            </span>
          ))}
        </div>
      </>}
      note={tx(t, "figCppOv_note", "Ranks go from best (1) to worst. Break it: switch print(bool) on and call with \"hi\"; switch print(int) off and call with 'x'; try 42L. Each of these surprises is a reason to keep overload sets small and their types far apart.")}
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="font-mono text-[13px] text-[var(--text-main)]">
          <span className="text-[var(--text-muted)]">{tx(t, "figCppOv_argIs", "argument")}:</span> {a.code}
          <span className="text-[var(--text-muted)]">  ·  {tx(t, "figCppOv_type", "type")}:</span> {a.type}
        </div>

        <div className="flex flex-col gap-1.5">
          {OVERLOADS.map(o => {
            const [r, how] = a.to[o.id];
            const win = winners.includes(o);
            const tie = win && result === "ambiguous";
            return (
              <div key={o.id} className="grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1 items-center rounded-lg border px-3 py-2 bg-[var(--code-surface)]"
                style={{ borderColor: win ? (tie ? C.red : C.green) : "var(--code-border)", opacity: on[o.id] ? 1 : 0.45 }}>
                <input type="checkbox" checked={on[o.id]} onChange={e => setOn({ ...on, [o.id]: e.target.checked })}
                  className="accent-[var(--primary)]" aria-label={o.sig} />
                <code className={`font-mono text-[12px] ${on[o.id] ? "text-[var(--text-main)]" : "line-through text-[var(--text-muted)]"}`}>{o.sig}</code>
                <div className="col-start-2 sm:col-start-3 flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] font-mono min-w-0">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: RANK_COL[r] }} />
                  <span style={{ color: r === 4 ? "var(--text-muted)" : "var(--text-main)" }}>{rankName(r)}</span>
                  {win && <span className="ml-auto font-bold" style={{ color: tie ? C.red : C.green }}>
                    {tie ? tx(t, "figCppOv_tie", "tie") : tx(t, "figCppOv_chosen", "chosen")}
                  </span>}
                  {r < 4 && <span className="text-[var(--text-muted)] basis-full pl-[1.125rem]">{how}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <pre className="rounded-lg bg-[var(--code-bg)] border border-[var(--code-border)] px-3 py-2 font-mono text-[12px] leading-[1.6] overflow-x-auto whitespace-pre-wrap" aria-live="polite">
          <div className="text-[var(--text-muted)]">print({a.code});</div>
          {result === "ok"
            ? <div style={{ color: C.green }}>→ {winners[0].sig.replace(";", "")}</div>
            : <div style={{ color: C.red }}>{errorLine}</div>}
          <div className="text-[var(--text-main)] font-sans text-[12.5px] mt-1">{message}</div>
        </pre>
      </div>
    </Figure>
  );
}
