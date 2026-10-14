"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Row } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// One call, take(expr), against the two overloads every movable class has:
// take(const Buf&) (copies) and take(Buf&&) (may steal). Picking an expression
// shows its value category in the standard's three-box picture (lvalue |
// xvalue | prvalue, with "has a name / identity" over the first two and "may
// be moved from / rvalue" over the last two), which overloads can bind to it
// and which one wins. Break it: switch an overload off, to see rvalues fall
// back to the copy, and lvalues refuse to bind to Buf&&.

type Cat = "lvalue" | "xvalue" | "prvalue";
type ExprId = "a" | "moveA" | "make" | "temp" | "c" | "moveC" | "param";
type Ov = "copy" | "move";

// The expression, its category, whether each overload can take it
const EXPRS: Record<ExprId, { code: string; cat: Cat; copy: boolean; move: boolean; en: string }> = {
  a: { code: "a", cat: "lvalue", copy: true, move: false,
    en: "a has a name and will still be used after the call, so it is an lvalue. Buf&& refuses it: nobody may rob an object that is still in use. The copy is the only choice." },
  moveA: { code: "std::move(a)", cat: "xvalue", copy: true, move: true,
    en: "std::move(a) is the same object, now marked as expiring: an xvalue. Both overloads could take it; Buf&& is the better match for an rvalue, so take(Buf&&) wins and may steal a's block." },
  make: { code: "make_buf()", cat: "prvalue", copy: true, move: true,
    en: "A function returning Buf by value gives a temporary with no name: a prvalue. Nobody can use it after this line, so stealing from it is safe: take(Buf&&) wins." },
  temp: { code: "Buf{5}", cat: "prvalue", copy: true, move: true,
    en: "An object built on the spot, without a name, is a prvalue too: take(Buf&&)." },
  c: { code: "c", cat: "lvalue", copy: true, move: false,
    en: "c is a const lvalue: it has a name, and it may not be changed. Only the const& overload fits." },
  moveC: { code: "std::move(c)", cat: "xvalue", copy: true, move: false,
    en: "The trap: std::move(c) is an xvalue of type const Buf. Buf&& would let take change c, which const forbids, so it cannot bind. The call quietly copies instead: no error, no warning, no move." },
  param: { code: "b", cat: "lvalue", copy: true, move: false,
    en: "Inside take(Buf&& b), the parameter b has a name, so b is an lvalue, although its type is Buf&&. Passing b on copies it; to keep moving, write std::move(b)." },
};

const CATS: Cat[] = ["lvalue", "xvalue", "prvalue"];
const CAT_COL: Record<Cat, string> = { lvalue: C.sky, xvalue: C.purple, prvalue: C.orange };
const CAT_EN: Record<Cat, string> = {
  lvalue: "has a name; still in use",
  xvalue: "has a name; marked as expiring",
  prvalue: "a temporary with no name",
};

export function ValueCategoryFigure({ t }: { t?: TrackTranslations }) {
  const [id, setId] = useState<ExprId>("a");
  const [on, setOn] = useState<Record<Ov, boolean>>({ copy: true, move: true });
  const e = EXPRS[id];
  const fits = { copy: on.copy && e.copy, move: on.move && e.move };
  const winner: Ov | null = fits.move ? "move" : fits.copy ? "copy" : null;
  const lost = e.move && !on.move && fits.copy;   // an rvalue that falls back to the copy

  const ovs: { id: Ov; sig: string; does: string }[] = [
    { id: "copy", sig: "void take(const Buf& b);", does: tx(t, "figCppVc_copyDoes", "reads b; keeping it means copying") },
    { id: "move", sig: "void take(Buf&& b);", does: tx(t, "figCppVc_moveDoes", "may steal b's block") },
  ];

  const errorLine = !on.copy && !on.move ? "error: no matching function for call to 'take(Buf)'"
    : id === "c" || id === "moveC" ? "error: binding reference of type 'Buf&&' to 'const Buf' discards qualifiers"
      : "error: cannot bind rvalue reference of type 'Buf&&' to lvalue of type 'Buf'";

  return (
    <Figure
      title={tx(t, "figCppVc_title", "Value categories: who may be robbed?")}
      controls={<>
        <Row>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppVc_call", "Call")} <code className="font-mono">take(…)</code> {tx(t, "figCppVc_with", "with")}</span>
          <Choice value={id} onChange={setId} options={(Object.keys(EXPRS) as ExprId[]).map(k =>
            [k, k === "param" ? `b ${tx(t, "figCppVc_inside", "inside take(Buf&& b)")}` : EXPRS[k].code] as [ExprId, string])} />
        </Row>
      </>}
      note={tx(t, "figCppVc_note", "Setup: Buf a{3}; const Buf c{3}; Buf make_buf(); Break it: untick take(Buf&&) and call with std::move(a) (it still compiles, and copies: that is what happens with a class that has no move constructor); untick take(const Buf&) and call with a.")}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* ── The three categories ── */}
        <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
          <div className="col-span-2 text-center rounded-t-md border-t border-x border-[var(--code-border)] text-[var(--text-muted)] py-0.5">
            {tx(t, "figCppVc_identity", "has a name (glvalue)")}
          </div>
          <div />
          {CATS.map(c => {
            const hit = c === e.cat;
            return (
              <div key={c} className="rounded-lg px-2 py-2 text-center bg-[var(--code-surface)] transition-colors"
                style={{ border: `${hit ? 2 : 1}px solid ${hit ? CAT_COL[c] : "var(--code-border)"}`, opacity: hit ? 1 : 0.6 }}>
                <div className="font-bold text-[12.5px]" style={{ color: CAT_COL[c] }}>{c}</div>
                <div className="text-[10.5px] text-[var(--text-muted)] leading-snug mt-0.5">{tx(t, `figCppVc_cat_${c}`, CAT_EN[c])}</div>
              </div>
            );
          })}
          <div />
          <div className="col-span-2 text-center rounded-b-md border-b border-x border-[var(--code-border)] text-[var(--text-muted)] py-0.5">
            {tx(t, "figCppVc_movable", "may be moved from (rvalue)")}
          </div>
        </div>

        {/* ── The two overloads ── */}
        <div className="flex flex-col gap-1.5">
          {ovs.map(o => {
            const win = winner === o.id;
            const can = (o.id === "copy" ? e.copy : e.move);
            return (
              <div key={o.id} className="flex items-center gap-3 flex-wrap rounded-lg border px-3 py-2 bg-[var(--code-surface)]"
                style={{ borderColor: win ? C.green : "var(--code-border)", opacity: on[o.id] ? 1 : 0.45 }}>
                <input type="checkbox" checked={on[o.id]} onChange={ev => setOn({ ...on, [o.id]: ev.target.checked })}
                  className="accent-[var(--primary)]" aria-label={o.sig} />
                <code className={`font-mono text-[12px] ${on[o.id] ? "text-[var(--text-main)]" : "line-through text-[var(--text-muted)]"}`}>{o.sig}</code>
                <span className="text-[11px] text-[var(--text-muted)]">{o.does}</span>
                <span className="ml-auto font-mono text-[11px] font-bold" style={{ color: win ? C.green : can ? "var(--text-muted)" : C.red }}>
                  {win ? tx(t, "figCppVc_chosen", "chosen") : can ? tx(t, "figCppVc_could", "could bind") : tx(t, "figCppVc_cannot", "cannot bind")}
                </span>
              </div>
            );
          })}
        </div>

        <pre className="rounded-lg bg-[var(--code-bg)] border border-[var(--code-border)] px-3 py-2 font-mono text-[12px] leading-[1.6] overflow-x-auto whitespace-pre-wrap" aria-live="polite">
          <div className="text-[var(--text-muted)]">take({e.code});</div>
          {winner
            ? <div style={{ color: winner === "move" ? C.green : lost ? C.amber : C.sky }}>
                → {winner === "move" ? "take(Buf&&): " + tx(t, "figCppVc_moves", "moves") : "take(const Buf&): " + tx(t, "figCppVc_copies", "copies")}
              </div>
            : <div style={{ color: C.red }}>{errorLine}</div>}
          <div className="text-[var(--text-main)] font-sans text-[12.5px] mt-1">
            {lost ? tx(t, "figCppVc_lost", "With no take(Buf&&), an rvalue binds to const Buf& instead. The code still compiles, and copies: this is why a class without a move constructor works everywhere, only slower.")
              : !winner ? tx(t, "figCppVc_none", "No overload can bind this expression: compile error.")
                : tx(t, `figCppVc_e_${id}`, e.en)}
          </div>
        </pre>
      </div>
    </Figure>
  );
}
