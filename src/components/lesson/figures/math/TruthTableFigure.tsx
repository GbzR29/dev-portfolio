"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C } from "@/components/lesson/kit/figure";
import { Lab, LabButton, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// table — the truth table of two formulas side by side, one row per way of
//         making p, q (and r) true or false. Rows where the two columns
//         disagree are marked; when no row disagrees the formulas are
//         logically equivalent. The menu holds the classic pairs: p → q against
//         its converse, inverse and contrapositive, De Morgan's laws, a
//         tautology and a contradiction.
// cards — Wason's four-card task: "if a card shows a vowel, its other side
//         shows an even number". Pick the cards you must turn over to test the
//         rule; the answer is p and not-q, the contrapositive at work.

type F = { id: string; tex: string; vars: 2 | 3; f: (p: boolean, q: boolean, r: boolean) => boolean };
const imp = (a: boolean, b: boolean) => !a || b;
const FORMULAS: F[] = [
  { id: "p", tex: "p", vars: 2, f: p => p },
  { id: "notp", tex: "¬p", vars: 2, f: p => !p },
  { id: "and", tex: "p ∧ q", vars: 2, f: (p, q) => p && q },
  { id: "or", tex: "p ∨ q", vars: 2, f: (p, q) => p || q },
  { id: "xor", tex: "p ⊕ q", vars: 2, f: (p, q) => p !== q },
  { id: "imp", tex: "p → q", vars: 2, f: (p, q) => imp(p, q) },
  { id: "conv", tex: "q → p", vars: 2, f: (p, q) => imp(q, p) },
  { id: "inv", tex: "¬p → ¬q", vars: 2, f: (p, q) => imp(!p, !q) },
  { id: "contra", tex: "¬q → ¬p", vars: 2, f: (p, q) => imp(!q, !p) },
  { id: "orimp", tex: "¬p ∨ q", vars: 2, f: (p, q) => !p || q },
  { id: "iff", tex: "p ↔ q", vars: 2, f: (p, q) => p === q },
  { id: "nand", tex: "¬(p ∧ q)", vars: 2, f: (p, q) => !(p && q) },
  { id: "dm1", tex: "¬p ∨ ¬q", vars: 2, f: (p, q) => !p || !q },
  { id: "nor", tex: "¬(p ∨ q)", vars: 2, f: (p, q) => !(p || q) },
  { id: "dm2", tex: "¬p ∧ ¬q", vars: 2, f: (p, q) => !p && !q },
  { id: "taut", tex: "p ∨ ¬p", vars: 2, f: p => p || !p },
  { id: "contr", tex: "p ∧ ¬p", vars: 2, f: p => p && !p },
  { id: "dist", tex: "p ∧ (q ∨ r)", vars: 3, f: (p, q, r) => p && (q || r) },
  { id: "dist2", tex: "(p ∧ q) ∨ (p ∧ r)", vars: 3, f: (p, q, r) => (p && q) || (p && r) },
  { id: "chain", tex: "((p → q) ∧ (q → r)) → (p → r)", vars: 3, f: (p, q, r) => imp(imp(p, q) && imp(q, r), imp(p, r)) },
];
const byId = (id: string) => FORMULAS.find(f => f.id === id)!;

/** Every assignment of p, q (and r), T before F as in textbooks. */
const truthRows = (vars: 2 | 3): [boolean, boolean, boolean][] =>
  Array.from({ length: 2 ** vars }, (_, i) => {
    const bits = i.toString(2).padStart(vars, "0").split("").map(c => c === "0");
    return [bits[0], bits[1], vars === 3 ? bits[2] : false];
  });

// ── Wason's cards ──
const CARDS = [
  { face: "E", must: true },                         // a vowel: the rule applies, check the back
  { face: "K", must: false },                        // a consonant: the rule says nothing
  { face: "4", must: false },                        // even: the rule does not say only vowels have even backs
  { face: "7", must: true },                         // odd: if the back were a vowel, the rule would be broken
];

export function TruthTableFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"table" | "cards">("table");
  const [left, setLeft] = useState("imp");
  const [right, setRight] = useState("conv");
  const [picked, setPicked] = useState<boolean[]>([false, false, false, false]);
  const [checked, setChecked] = useState(false);
  const lab = useLab("math-logic");

  const TV = (b: boolean) => (b ? tx(t, "figTT_T", "T") : tx(t, "figTT_F", "F"));
  const A = byId(left), B = byId(right), vars = Math.max(A.vars, B.vars) as 2 | 3;
  const rows = truthRows(vars);
  const diff = rows.filter(([p, q, r]) => A.f(p, q, r) !== B.f(p, q, r)).length;
  const allA = rows.every(([p, q, r]) => A.f(p, q, r)), noneA = rows.every(([p, q, r]) => !A.f(p, q, r));
  const cardsRight = picked.every((s, i) => s === CARDS[i].must);

  const cell = "px-3 py-1.5 text-center font-mono text-[13px]";
  const tableView = (
    <div className="px-3 py-5 overflow-x-auto">
      <table className="mx-auto border-collapse">
        <thead>
          <tr className="text-[var(--text-muted)]">
            {["p", "q", ...(vars === 3 ? ["r"] : [])].map(v => <th key={v} className={cell}>{v}</th>)}
            <th className={`${cell} text-[#0ea5e9]`}>{A.tex}</th>
            <th className={`${cell} text-[#f59e0b]`}>{B.tex}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([p, q, r], i) => {
            const a = A.f(p, q, r), b = B.f(p, q, r), bad = a !== b;
            return (
              <tr key={i} className="border-t border-[var(--border)]" style={bad ? { background: "rgba(239,68,68,0.12)" } : undefined}>
                {[p, q, ...(vars === 3 ? [r] : [])].map((v, k) => <td key={k} className={`${cell} text-[var(--text-muted)]`}>{TV(v)}</td>)}
                <td className={cell} style={{ color: a ? C.green : C.red, fontWeight: 700 }}>{TV(a)}</td>
                <td className={cell} style={{ color: b ? C.green : C.red, fontWeight: 700 }}>{TV(b)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-center mt-4 text-[13px] font-mono" style={{ color: diff ? C.red : C.green }}>
        {diff === 0
          ? tx(t, "figTT_equiv", "equivalent: the columns agree on every row")
          : `${tx(t, "figTT_differ", "not equivalent: they differ on")} ${diff} ${diff === 1 ? tx(t, "figTT_row", "row") : tx(t, "figTT_rows", "rows")}`}
      </p>
    </div>
  );

  const cardsView = (
    <div className="px-4 py-6">
      <p className="text-center text-[14px] text-[var(--text-main)] mb-5">{tx(t, "figTT_rule", "Rule: if a card shows a vowel on one side, it shows an even number on the other.")}</p>
      <div className="flex justify-center gap-3 flex-wrap">
        {CARDS.map((c, i) => {
          const sel = picked[i], show = checked;
          const border = !show ? (sel ? "var(--primary)" : "var(--border)") : c.must === sel ? C.green : C.red;
          return (
            <button key={i} type="button" onClick={() => { setChecked(false); setPicked(ps => ps.map((s, k) => (k === i ? !s : s))); }}
              className="w-16 h-24 rounded-xl text-[28px] font-mono font-bold transition-all"
              style={{ border: `2px solid ${border}`, background: sel ? "var(--primary-low)" : "var(--card)", color: "var(--text-main)" }}>
              {c.face}
            </button>
          );
        })}
      </div>
      <p className="text-center mt-4 text-[12px] text-[var(--text-muted)]">{tx(t, "figTT_pick", "Tap the cards you must turn over to check the rule, then press check.")}</p>
      {checked && (
        <p className="text-center mt-2 text-[13px]" style={{ color: cardsRight ? C.green : C.red }}>
          {cardsRight ? tx(t, "figTT_cardsOk", "Right: E (the vowel, p) and 7 (the odd number, not q).") : tx(t, "figTT_cardsBad", "Not quite. Which cards could break the rule? Only a vowel with an odd back.")}
        </p>
      )}
    </div>
  );

  const view = mode === "table" ? tableView : cardsView;
  const opts2 = FORMULAS.map(f => [f.id, f.tex] as const);
  const wrap = { display: "flex", flexWrap: "wrap" as const, gap: 6, alignItems: "center" };
  const controls = mode === "table" ? <>
    <div style={wrap}><span className="text-[10px] font-mono text-[#0ea5e9] w-14">{tx(t, "figTT_left", "left")}</span><Choice value={left} onChange={setLeft} options={opts2} /></div>
    <div style={wrap}><span className="text-[10px] font-mono text-[#f59e0b] w-14">{tx(t, "figTT_right", "right")}</span><Choice value={right} onChange={setRight} options={opts2} /></div>
    <Row>
      <Readout color={C.sky}>{allA ? tx(t, "figTT_taut", "left: a tautology (always true)") : noneA ? tx(t, "figTT_contr", "left: a contradiction (always false)") : `${A.tex}: ${rows.filter(([p, q, r]) => A.f(p, q, r)).length} / ${rows.length} ${TV(true)}`}</Readout>
    </Row>
  </> : <Row>
    <Btn onClick={() => setChecked(true)}>{tx(t, "figTT_check", "check")}</Btn>
    <Btn onClick={() => { setPicked([false, false, false, false]); setChecked(false); }}>{tx(t, "figTT_clear", "clear")}</Btn>
  </Row>;
  const note = mode === "table"
    ? tx(t, "figTT_noteT", "Each row is one way to make p and q (and r) true or false; T is true, F is false. Pick a formula for each column. Rows where the two columns disagree turn red; with no red row, the formulas say the same thing in every situation: they are logically equivalent. Start with p → q against its converse q → p, then against its contrapositive ¬q → ¬p.")
    : tx(t, "figTT_noteC", "Each card has a letter on one side and a number on the other. You see E, K, 4 and 7. Which cards must you turn over to find out whether the rule is broken? Most people pick E and 4. Think about which hidden sides could possibly break an \"if… then…\".");
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["table", tx(t, "figTT_mTable", "truth table")],
    ["cards", tx(t, "figTT_mCards", "four cards")],
  ] as const} />;

  // ── Lab ──
  const pair = (a: string, b: string) => mode === "table" && ((left === a && right === b) || (left === b && right === a));
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figTTL1_t", "When is a promise broken?"),
      body: <>
        <p>{tx(t, "figTTL1_b1", "\"If it rains (p), I take an umbrella (q).\" Look at the column p → q.")}</p>
      </>,
      quiz: {
        q: tx(t, "figTTL1_q", "In which row is p → q false?"),
        options: [tx(t, "figTTL1_o1", "p true, q false"), tx(t, "figTTL1_o2", "p false, q true"), tx(t, "figTTL1_o3", "p false, q false"), tx(t, "figTTL1_o4", "never")],
        answer: 0,
        why: tx(t, "figTTL1_w", "Only rain without an umbrella breaks the promise. If it does not rain, the promise says nothing, so it counts as kept: that is why p → q is true whenever p is false."),
      },
      setup: () => { setMode("table"); setLeft("imp"); setRight("p"); },
    },
    {
      title: tx(t, "figTTL2_t", "The converse"),
      body: <p>{tx(t, "figTTL2_b", "Compare p → q with its converse q → p.")}</p>,
      goal: { text: tx(t, "figTTL2_g", "p → q against q → p."), done: pair("imp", "conv") },
    },
    {
      title: tx(t, "figTTL3_t", "An equivalent form"),
      body: <p>{tx(t, "figTTL3_b", "Find a formula in the menu that agrees with p → q on every row (there are two).")}</p>,
      goal: { text: tx(t, "figTTL3_g", "p → q against an equivalent formula."), done: mode === "table" && (pair("imp", "contra") || pair("imp", "orimp")) },
      hint: tx(t, "figTTL3_h", "Try the contrapositive ¬q → ¬p, or ¬p ∨ q."),
    },
    {
      title: tx(t, "figTTL4_t", "De Morgan"),
      body: <p>{tx(t, "figTTL4_b", "Put ¬(p ∧ q) on the left. Which formula on the right matches it?")}</p>,
      goal: { text: tx(t, "figTTL4_g", "¬(p ∧ q) shown equivalent to ¬p ∨ ¬q."), done: pair("nand", "dm1") },
      setup: () => { setMode("table"); setLeft("nand"); setRight("dm2"); },
    },
    {
      title: tx(t, "figTTL5_t", "Quick check"),
      body: <p>{tx(t, "figTTL5_b", "A tautology is true on every row, whatever p and q are.")}</p>,
      quiz: {
        q: tx(t, "figTTL5_q", "Which of these is a tautology?"),
        options: ["((p → q) ∧ (q → r)) → (p → r)", "p → q", "p ∧ ¬p", "p ⊕ q"],
        answer: 0,
        why: tx(t, "figTTL5_w", "That is the chain rule of reasoning: if p leads to q and q leads to r, then p leads to r. Check it in the table: all 8 rows are T."),
      },
    },
    {
      title: tx(t, "figTTL6_t", "Four cards"),
      body: <>
        <p>{tx(t, "figTTL6_b1", "Rule: vowel on one side ⇒ even number on the other. You may only turn the cards that could break it.")}</p>
        <p>{tx(t, "figTTL6_b2", "Pick exactly the cards you must turn, and press check.")}</p>
      </>,
      goal: { text: tx(t, "figTTL6_g", "The right cards picked and checked."), done: mode === "cards" && checked && cardsRight },
      hint: tx(t, "figTTL6_h", "The rule is p → q. It fails only when p is true and q is false: a vowel (p) with an odd back, or an odd number (not q) with a vowel behind."),
      setup: () => { setMode("cards"); setPicked([false, false, false, false]); setChecked(false); },
    },
  ];
  const insights: Insight[] = [
    {
      id: "conv", tone: "warn", when: pair("imp", "conv"),
      title: tx(t, "figTTI1_t", "The converse is a different claim"),
      body: tx(t, "figTTI1_b", "\"If it rains, I take an umbrella\" does not mean \"if I take an umbrella, it rains\". They disagree when exactly one of p, q is true."),
    },
    {
      id: "contra", tone: "ok", when: pair("imp", "contra"),
      title: tx(t, "figTTI2_t", "The contrapositive is the same claim"),
      body: tx(t, "figTTI2_b", "\"If no umbrella, then no rain\" says exactly what \"if rain, then umbrella\" says. Proving one proves the other: that is proof by contrapositive."),
    },
    {
      id: "cards", tone: "ok", when: mode === "cards" && checked && cardsRight,
      title: tx(t, "figTTI3_t", "p and not q"),
      body: tx(t, "figTTI3_b", "The 4 cannot break the rule: the rule never said only vowels have even backs. That would be the converse."),
    },
  ];

  const title = tx(t, "figTT_title", "Truth tables");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<>{modeChoice}<LabButton lab={lab} t={t} /></>} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title} steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figTTR1", "p → q is false only when p is true and q is false."),
          tx(t, "figTTR2", "The contrapositive ¬q → ¬p is equivalent to p → q; the converse q → p is not."),
          tx(t, "figTTR3", "De Morgan: ¬(p ∧ q) ≡ ¬p ∨ ¬q and ¬(p ∨ q) ≡ ¬p ∧ ¬q."),
          tx(t, "figTTR4", "To test \"if p then q\", look for p with not q: turn the vowel and the odd number."),
        ]} />
    </>
  );
}
