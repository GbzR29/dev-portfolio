"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, C, mulberry32 } from "@/components/lesson/kit/figure";
import { Lab, LabButton, useLab, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A proof puzzle (a "Parsons problem"): the lines of a real proof, shuffled,
// plus one trap line that must NOT be used (an example passed off as a proof,
// the converse, a false claim). Tap lines to build the proof in order; tap a
// placed line to send it back. "Check" marks each line: green where it is in
// the right place, red where it is not, and the trap if it was used.
// Five proofs, one per method of the chapter.

type ProofId = "direct" | "contra" | "sqrt2" | "primes" | "cases";
type Proof = { claim: [string, string]; method: [string, string]; lines: [string, string][]; trap: [string, string]; swap?: [number, number] };

const PROOFS: Record<ProofId, Proof> = {
  direct: {
    claim: ["figPrf_dC", "The sum of two odd numbers is even."],
    method: ["figPrf_mDirect", "direct proof"],
    lines: [
      ["figPrf_d0", "Let a and b be odd numbers."],
      ["figPrf_d1", "Then a = 2m + 1 and b = 2n + 1 for some integers m and n."],
      ["figPrf_d2", "So a + b = 2m + 2n + 2."],
      ["figPrf_d3", "That is, a + b = 2(m + n + 1)."],
      ["figPrf_d4", "m + n + 1 is an integer, so a + b is even."],
    ],
    trap: ["figPrf_dT", "For example 3 + 5 = 8 is even, so the claim is true."],
  },
  contra: {
    claim: ["figPrf_cC", "If n² is even, then n is even."],
    method: ["figPrf_mContra", "proof by contrapositive"],
    lines: [
      ["figPrf_c0", "We prove the contrapositive: if n is odd, then n² is odd."],
      ["figPrf_c1", "Suppose n is odd, so n = 2k + 1 for some integer k."],
      ["figPrf_c2", "Then n² = 4k² + 4k + 1."],
      ["figPrf_c3", "So n² = 2(2k² + 2k) + 1, which is odd."],
      ["figPrf_c4", "The contrapositive is true, so the original statement is true."],
    ],
    trap: ["figPrf_cT", "Suppose n is even, n = 2k; then n² = 4k² is even."],
  },
  sqrt2: {
    claim: ["figPrf_sC", "√2 is irrational."],
    method: ["figPrf_mContradiction", "proof by contradiction"],
    lines: [
      ["figPrf_s0", "Suppose √2 is rational: √2 = p/q with p/q in lowest terms."],
      ["figPrf_s1", "Squaring gives 2 = p²/q², so p² = 2q²."],
      ["figPrf_s2", "So p² is even, and therefore p is even: p = 2r."],
      ["figPrf_s3", "Then 4r² = 2q², so q² = 2r², and q is even too."],
      ["figPrf_s4", "Both p and q are even, so p/q was not in lowest terms."],
      ["figPrf_s5", "This contradiction shows that √2 is irrational."],
    ],
    trap: ["figPrf_sT", "√2 = 1.41421356…, and its decimals do not seem to repeat."],
  },
  primes: {
    claim: ["figPrf_pC", "There are infinitely many primes."],
    method: ["figPrf_mContradiction", "proof by contradiction"],
    lines: [
      ["figPrf_p0", "Suppose there are only finitely many primes: p₁, p₂, …, pₖ."],
      ["figPrf_p1", "Let N = p₁ · p₂ · … · pₖ + 1."],
      ["figPrf_p2", "N is greater than 1, so it has a prime factor p."],
      ["figPrf_p3", "Dividing N by any pᵢ leaves remainder 1, so p is not on the list."],
      ["figPrf_p4", "So the list was not complete: a contradiction."],
    ],
    trap: ["figPrf_pT", "So N itself is a prime number."],
  },
  cases: {
    claim: ["figPrf_kC", "n² + n is even for every integer n."],
    method: ["figPrf_mCases", "proof by cases"],
    lines: [
      ["figPrf_k0", "Write n² + n = n(n + 1)."],
      ["figPrf_k1", "Case 1: n is even. Then the factor n is even, so n(n + 1) is even."],
      ["figPrf_k2", "Case 2: n is odd. Then n + 1 is even, so n(n + 1) is even."],
      ["figPrf_k3", "Every integer is even or odd, so n² + n is always even."],
    ],
    trap: ["figPrf_kT", "Case 2: n is odd. Then n² is odd, so n² + n is odd."],
    swap: [1, 2],
  },
};
const IDS: ProofId[] = ["direct", "contra", "sqrt2", "primes", "cases"];
const TAB: Record<ProofId, string> = { direct: "odd + odd", contra: "n² even", sqrt2: "√2", primes: "primes", cases: "n² + n" };
const TRAP = -1;

/** The proof's line indices plus the trap, in a fixed shuffled order (same on server and client). */
function shuffled(id: ProofId) {
  const n = PROOFS[id].lines.length, xs = [...Array.from({ length: n }, (_, i) => i), TRAP];
  const rnd = mulberry32(IDS.indexOf(id) * 7919 + 17);
  for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; }
  return xs;
}

/** Whether the line at position i of `placed` is right, allowing the proof's interchangeable pair. */
function rightAt(p: Proof, placed: number[], i: number) {
  const x = placed[i];
  if (x === TRAP) return false;
  if (x === i) return true;
  if (p.swap) { const [a, b] = p.swap; if ((x === a && i === b) || (x === b && i === a)) return true; }
  return false;
}

export function ProofOrderFigure({ t }: { t?: TrackTranslations }) {
  const [id, setId] = useState<ProofId>("direct");
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState<ProofId[]>([]);
  const lab = useLab("math-proofs");

  const p = PROOFS[id];
  const pool = shuffled(id).filter(x => !placed.includes(x));
  const text = (x: number) => (x === TRAP ? tx(t, p.trap[0], p.trap[1]) : tx(t, p.lines[x][0], p.lines[x][1]));
  const complete = placed.length === p.lines.length && placed.every((_, i) => rightAt(p, placed, i));
  const pick = (k: ProofId) => { setId(k); setPlaced([]); setChecked(false); };
  const check = () => { setChecked(true); if (complete && !solved.includes(id)) setSolved(s => [...s, id]); };

  const lineBox = "w-full text-left rounded-lg border px-3 py-2 text-[13.5px] leading-snug transition-all";
  const view = (
    <div className="px-4 py-5 space-y-4">
      <div className="text-center">
        <p className="text-[15px] text-[var(--text-main)] font-semibold">{tx(t, "figPrf_claim", "Claim")}: {tx(t, p.claim[0], p.claim[1])}</p>
        <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted)] mt-1">{tx(t, p.method[0], p.method[1])}</p>
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figPrf_proof", "Proof")}</p>
        {placed.length === 0 && <p className="text-[12px] text-[var(--text-muted)] italic">{tx(t, "figPrf_empty", "Tap the lines below in the right order.")}</p>}
        {placed.map((x, i) => {
          const ok = rightAt(p, placed, i), col = !checked ? "var(--border)" : ok ? C.green : C.red;
          return (
            <button key={`${x}`} type="button" onClick={() => { setChecked(false); setPlaced(ps => ps.filter(y => y !== x)); }}
              className={lineBox} style={{ borderColor: col, background: checked && !ok ? "rgba(239,68,68,0.08)" : "var(--card)", color: "var(--text-main)" }}>
              <span className="font-mono text-[11px] mr-2" style={{ color: "var(--primary)" }}>{i + 1}</span>{text(x)}
              {checked && x === TRAP && <span className="block text-[11px] mt-1" style={{ color: C.red }}>{tx(t, "figPrf_trapUsed", "This line does not belong in the proof.")}</span>}
            </button>
          );
        })}
        {complete && checked && <p className="text-right text-[13px] font-semibold" style={{ color: C.green }}>■ {tx(t, "figPrf_done", "Proof complete.")}</p>}
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figPrf_pool", "Available lines")}</p>
        {pool.map(x => (
          <button key={`${x}`} type="button" onClick={() => { setChecked(false); setPlaced(ps => [...ps, x]); }}
            className={`${lineBox} border-dashed hover:border-[var(--primary)]`} style={{ borderColor: "var(--border)", background: "transparent", color: "var(--text-muted)" }}>
            {text(x)}
          </button>
        ))}
      </div>
    </div>
  );

  const proofChoice = <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><Choice value={id} onChange={pick} options={IDS.map(k => [k, `${tx(t, `figPrf_tab_${k}`, TAB[k])}${solved.includes(k) ? " ■" : ""}`] as const)} /></div>;
  const controls = <>
    {proofChoice}
    <Row>
      <Btn onClick={check}>{tx(t, "figPrf_check", "check")}</Btn>
      <Btn onClick={() => { setPlaced([]); setChecked(false); }}>{tx(t, "figPrf_reset", "start over")}</Btn>
      <Btn onClick={() => { setPlaced(p.lines.map((_, i) => i)); setChecked(true); }}>{tx(t, "figPrf_show", "show the proof")}</Btn>
    </Row>
  </>;
  const note = tx(t, "figPrf_note", "Each tab is a theorem from the chapter, proved by a different method. Its lines are shuffled, and one extra line is a trap: something that sounds convincing but is not a valid step. Tap the lines in order to build the proof, tap a placed line to send it back, and press check. Green lines are in the right place, red ones are not. The two cases of a proof by cases may come in either order.");

  // ── Lab ──
  const solvedNow = (k: ProofId) => id === k && complete && checked;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figPrfL1_t", "A direct proof"),
      body: <p>{tx(t, "figPrfL1_b", "Start from what you know (a and b odd), write it in algebra, and push the algebra towards what you want (a + b = 2 × integer).")}</p>,
      goal: { text: tx(t, "figPrfL1_g", "The odd-sum proof built and checked."), done: solvedNow("direct") },
      setup: () => pick("direct"),
    },
    {
      title: tx(t, "figPrfL2_t", "Quick check"),
      body: <p>{tx(t, "figPrfL2_b", "The trap line said: 3 + 5 = 8 is even, so the claim is true.")}</p>,
      quiz: {
        q: tx(t, "figPrfL2_q", "Why is that not a proof?"),
        options: [tx(t, "figPrfL2_o1", "One example says nothing about all the other pairs"), tx(t, "figPrfL2_o2", "8 is not even"), tx(t, "figPrfL2_o3", "3 and 5 are prime, not odd")],
        answer: 0,
        why: tx(t, "figPrfL2_w", "A claim about every pair of odd numbers needs an argument that works for every pair. An example can only disprove a \"for all\" (a counterexample), never prove it."),
      },
    },
    {
      title: tx(t, "figPrfL3_t", "The contrapositive"),
      body: <p>{tx(t, "figPrfL3_b", "\"n² even ⇒ n even\" is hard to attack directly. Its contrapositive, \"n odd ⇒ n² odd\", is easy, and means the same thing.")}</p>,
      goal: { text: tx(t, "figPrfL3_g", "The contrapositive proof built and checked."), done: solvedNow("contra") },
      setup: () => pick("contra"),
    },
    {
      title: tx(t, "figPrfL4_t", "√2"),
      body: <p>{tx(t, "figPrfL4_b", "Assume the opposite of the claim and follow it until something impossible happens. The previous proof is used in the middle: p² even ⇒ p even.")}</p>,
      goal: { text: tx(t, "figPrfL4_g", "The √2 proof built and checked."), done: solvedNow("sqrt2") },
      setup: () => pick("sqrt2"),
    },
    {
      title: tx(t, "figPrfL5_t", "Quick check"),
      body: <p>{tx(t, "figPrfL5_b", "Euclid's proof builds N = p₁ · … · pₖ + 1.")}</p>,
      quiz: {
        q: tx(t, "figPrfL5_q", "With the primes 2, 3, 5, 7, 11, 13, N = 30031. Is N prime?"),
        options: [tx(t, "figPrfL5_o1", "No: 30031 = 59 × 509"), tx(t, "figPrfL5_o2", "Yes, always"), tx(t, "figPrfL5_o3", "It is even")],
        answer: 0,
        why: tx(t, "figPrfL5_w", "N need not be prime: the proof only says its prime factors (here 59 and 509) are not on the list. That is why \"N itself is prime\" is the trap line."),
      },
      setup: () => pick("primes"),
    },
    {
      title: tx(t, "figPrfL6_t", "Two cases"),
      body: <p>{tx(t, "figPrfL6_b", "Split every integer into even and odd, prove the claim in each case, and say why the cases cover everything.")}</p>,
      goal: { text: tx(t, "figPrfL6_g", "The proof by cases built and checked."), done: solvedNow("cases") },
      setup: () => pick("cases"),
    },
  ];

  const title = tx(t, "figPrf_title", "Build the proof");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<LabButton lab={lab} t={t} />} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title} steps={labSteps} stage={view} controls={controls}
        recap={[
          tx(t, "figPrfR1", "Direct: start from the hypothesis and calculate your way to the conclusion."),
          tx(t, "figPrfR2", "Contrapositive: prove ¬q ⇒ ¬p instead of p ⇒ q; it is the same statement."),
          tx(t, "figPrfR3", "Contradiction: assume the claim is false and derive something impossible."),
          tx(t, "figPrfR4", "Cases: split into cases that cover everything and prove each. Examples never prove a \"for all\"."),
        ]} />
    </>
  );
}
