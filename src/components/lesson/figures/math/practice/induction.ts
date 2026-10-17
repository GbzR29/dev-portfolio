// ── Practice generators: induction ────────────────────────────────────────────
// Two skills the chapter drills. "Use the hypothesis": P(k) gives the value of
// a sum up to k; find the sum up to k + 1 by adding one term (the move every
// induction step makes). "Where to start": the smallest n₀ from which an
// inequality aⁿ ≥ nᵇ holds for every n (checked far beyond the crossing).

import { fr } from "./frac";
import { pick, ri, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const num = (x: number) => ({ label: "", answer: { kind: "num" as const, value: fr(x) } });

// ── Use the hypothesis ──
const SUMS = [
  { term: (i: number) => i, tex: "i", S: (k: number) => (k * (k + 1)) / 2, formula: "\\frac{k(k+1)}{2}" },
  { term: (i: number) => 2 * i - 1, tex: "(2i - 1)", S: (k: number) => k * k, formula: "k^2" },
  { term: (i: number) => i * i, tex: "i^2", S: (k: number) => (k * (k + 1) * (2 * k + 1)) / 6, formula: "\\frac{k(k+1)(2k+1)}{6}" },
  { term: (i: number) => i ** 3, tex: "i^3", S: (k: number) => ((k * (k + 1)) / 2) ** 2, formula: "\\left(\\frac{k(k+1)}{2}\\right)^2" },
];

export const indStep: Gen = (lv: Level): Problem => {
  const s = lv === 1 ? SUMS[pick([0, 1])] : lv === 2 ? SUMS[2] : SUMS[3];
  const k = lv === 1 ? ri(10, 60) : ri(6, 25), Sk = s.S(k), next = s.term(k + 1), ans = Sk + next;
  return {
    key: `is:${SUMS.indexOf(s)}:${k}`,
    ask: ["mpr_indStep", "P(k) gives the sum up to k. Use it to find the sum up to k + 1"],
    tex: `\\sum_{i=1}^{${k}} ${s.tex} = ${Sk} \\quad\\Rightarrow\\quad \\sum_{i=1}^{${k + 1}} ${s.tex} = \\,?`,
    steps: [
      `\\sum_{i=1}^{${k + 1}} ${s.tex} = \\sum_{i=1}^{${k}} ${s.tex} + ${s.tex.replace(/i/g, `(${k + 1})`)}`,
      `= ${Sk} + ${next} = ${amber(ans)}`,
      `${s.formula.replace(/k/g, `${k + 1}`)} = ${s.S(k + 1)}\\ \\checkmark`,
    ],
    short: `${ans}`, fields: [num(ans)],
  };
};

// ── Where to start ──
/** The smallest n₀ ≥ 1 with aⁿ ≥ nᵇ (or >) for every n ≥ n₀, checked up to 400. */
function start(a: number, b: number, strict: boolean) {
  const holds = (n: number) => { const l = n * Math.log(a), r = b * Math.log(n); return strict ? l > r + 1e-12 : l >= r - 1e-12; };
  let n0 = 400;
  while (n0 > 1 && holds(n0 - 1)) n0--;
  return n0;
}

export const indStart: Gen = (lv: Level): Problem => {
  type Ineq = readonly [number, number, boolean];       // aⁿ ≥ nᵇ, or > when strict
  const opts: readonly Ineq[] = lv === 1 ? [[2, 2, false], [2, 2, true], [3, 2, false]]
    : lv === 2 ? [[2, 3, false], [3, 3, true], [3, 3, false], [2, 2, true]]
      : [[2, 4, false], [3, 4, false], [2, 5, true], [5, 5, true]];
  const [a, b, strict] = pick(opts), n0 = start(a, b, strict), rel = strict ? ">" : "\\ge";
  const show = (n: number) => `${a}^{${n}} = ${a ** n} ${a ** n > n ** b ? ">" : a ** n === n ** b ? "=" : "<"} ${n ** b} = ${n}^{${b}}`;
  const fail = n0 - 1;
  return {
    key: `st:${a}:${b}:${strict}`,
    ask: ["mpr_indStart", "Find the smallest n₀ such that the inequality holds for every n ≥ n₀"],
    tex: `${a}^n ${rel} n^{${b}}`,
    steps: [
      fail >= 1 ? `n = ${fail}:\\ ${show(fail)}\\ \\red{\\times}` : `n = 1:\\ ${show(1)}`,
      `n = ${n0}:\\ ${show(n0)}\\ \\checkmark`,
      `n_0 = ${amber(n0)}`,
    ],
    short: `${n0}`, fields: [num(n0)],
  };
};
