// ── Practice generators: logic ────────────────────────────────────────────────
// A random formula in p, q (and r) built from ¬ ∧ ∨ → ↔; the question is how
// many rows of its truth table make it true. The worked solution is the whole
// table, written with 1 for true and 0 for false so it reads the same in
// every language.

import { fr } from "./frac";
import { pick, ri, type Gen, type Level, type Problem } from "./problem";

type Node =
  | { k: "var"; v: 0 | 1 | 2 }
  | { k: "not"; a: Node }
  | { k: "and" | "or" | "imp" | "iff"; a: Node; b: Node };

const NAMES = ["p", "q", "r"];
const SYM = { and: "\\land", or: "\\lor", imp: "\\to", iff: "\\leftrightarrow" } as const;

function build(depth: number, vars: number): Node {
  if (depth === 0 || Math.random() < 0.2) return { k: "var", v: ri(0, vars - 1) as 0 | 1 | 2 };
  if (Math.random() < 0.25) return { k: "not", a: build(depth - 1, vars) };
  return { k: pick(["and", "or", "imp", "iff"] as const), a: build(depth - 1, vars), b: build(depth - 1, vars) };
}

function evalN(n: Node, s: boolean[]): boolean {
  switch (n.k) {
    case "var": return s[n.v];
    case "not": return !evalN(n.a, s);
    case "and": return evalN(n.a, s) && evalN(n.b, s);
    case "or": return evalN(n.a, s) || evalN(n.b, s);
    case "imp": return !evalN(n.a, s) || evalN(n.b, s);
    case "iff": return evalN(n.a, s) === evalN(n.b, s);
  }
}

function tex(n: Node, top = true): string {
  if (n.k === "var") return NAMES[n.v];
  if (n.k === "not") return `\\neg ${tex(n.a, false)}`;
  const s = `${tex(n.a, false)} ${SYM[n.k]} ${tex(n.b, false)}`;
  return top ? s : `(${s})`;
}

const used = (n: Node, acc = new Set<number>()): Set<number> => {
  if (n.k === "var") acc.add(n.v);
  else if (n.k === "not") used(n.a, acc);
  else { used(n.a, acc); used(n.b, acc); }
  return acc;
};
const ops = (n: Node): number => (n.k === "var" ? 0 : n.k === "not" ? 1 + ops(n.a) : 1 + ops(n.a) + ops(n.b));

export const logicCount: Gen = (lv: Level): Problem => {
  const vars = lv === 3 ? 3 : 2, depth = lv === 1 ? 2 : 3;
  let f: Node;
  do f = build(depth, vars); while (used(f).size < vars || ops(f) < (lv === 1 ? 2 : 3) || ops(f) > (lv === 3 ? 6 : 5));
  const rows = Array.from({ length: 2 ** vars }, (_, i) => i.toString(2).padStart(vars, "0").split("").map(c => c === "0"));
  const vals = rows.map(s => evalN(f, s)), ans = vals.filter(Boolean).length;
  const b = (x: boolean) => (x ? "1" : "0");
  const head = `${NAMES.slice(0, vars).join(" & ")} & \\varphi`;
  const body = rows.map((s, i) => `${s.map(b).join(" & ")} & ${vals[i] ? "\\green{1}" : "\\red{0}"}`).join(" \\\\ ");
  return {
    key: `lg:${tex(f)}`, ask: ["mpr_logicCount", "In how many rows of the truth table is the formula true?"],
    tex: `\\varphi = ${tex(f)}`,
    steps: [
      `\\begin{array}{${"c".repeat(vars)}|c} ${head} \\\\ \\hline ${body} \\end{array}`,
      `${ans} \\text{ / } ${rows.length} = \\amber{${ans}}`,
    ],
    short: `${ans}`, fields: [{ label: "", answer: { kind: "num", value: fr(ans) } }],
  };
};
