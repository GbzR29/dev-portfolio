// ── Practice generators: Arithmetic ───────────────────────────────────────────
// Signed numbers, order of operations, fractions, percent and proportion,
// gcd and lcm, powers and roots, number bases. Each builds its question from a
// chosen answer (see problem.ts); expressions are trees (tree.ts), so their
// worked solution is computed, not typed.

import { fr, gcd, lcm, texFrac } from "./frac";
import { nz, pick, ri, sgn, type Gen, type Level, type Problem } from "./problem";
import { divide, minus, n, over, par, plus, power, tex, times, value, workLines, type Node } from "./tree";

/** "a = b = c" lines: the first as is, the rest starting with "=". */
export const chain = (lines: string[]) => lines.map((l, i) => (i ? `= ${l}` : l));

/** A problem whose answer is the value of an expression, with its worked lines. */
export function exprProblem(key: string, ask: [string, string], e: Node, lowest = false): Problem {
  const v = value(e);
  return {
    key, ask, tex: tex(e), steps: chain(workLines(e)), short: texFrac(v),
    fields: [{ label: "", answer: { kind: "num", value: v, lowest } }],
  };
}
/** Retry `make` until `ok` holds (a whole answer, no fractions on the way…); a draw that divides by 0 is just skipped. */
export function until<T>(make: () => T, ok: (x: T) => boolean): T {
  for (let i = 0; i < 2000; i++) {
    let x: T;
    try { x = make(); } catch (e) { if (e instanceof Error && e.message === "division by zero") continue; throw e; }
    if (ok(x)) return x;
  }
  throw new Error("generator gave up");
}
const wholeWork = (p: Problem) => !p.steps.join(" ").includes("\\frac") && Math.abs(Number(p.short)) <= 999;
const CALC: [string, string] = ["mpr_calc", "Calculate"];

// ── Signed numbers ──
export const signed: Gen = (lv: Level) => until(() => {
  const a = nz(-12, 12), b = nz(-12, 12);
  let e: Node;
  if (lv === 1) e = pick([plus, minus])(n(a), n(b));
  else if (lv === 2) e = Math.random() < 0.5 ? times(n(nz(-9, 9)), n(nz(-9, 9))) : (() => { const d = nz(-9, 9); return divide(n(d * nz(-9, 9)), n(d)); })();
  else e = pick([
    () => plus(minus(n(a), n(b)), n(nz(-9, 9))),
    () => minus(n(a), times(n(nz(-6, 6)), n(nz(-6, 6)))),
    () => times(par(minus(n(a), n(b))), n(nz(-5, 5))),
  ])();
  return exprProblem(`sg:${tex(e)}`, CALC, e);
}, p => wholeWork(p) && (lv > 1 || p.tex.includes("-")));

// ── Order of operations ──
export const order: Gen = (lv: Level) => until(() => {
  const s = () => ri(2, 9), m = () => ri(2, 12);
  const e = lv === 1 ? pick([
    () => plus(n(m()), times(n(s()), n(s()))),
    () => minus(times(n(s()), n(s())), n(m())),
    () => times(par(plus(n(m()), n(s()))), n(s())),
    () => minus(n(ri(20, 40)), divide(n(ri(2, 6) * 4), n(4))),
  ])() : lv === 2 ? pick([
    () => minus(plus(n(m()), times(n(s()), n(s()))), divide(n(s() * 3), n(3))),
    () => plus(times(par(minus(n(ri(8, 15)), n(s()))), n(s())), n(m())),
    () => minus(times(n(s()), power(n(ri(2, 4)), n(2))), n(m())),
    () => divide(par(plus(n(m()), n(m()))), n(pick([2, 3, 4]))),
  ])() : pick([
    () => times(n(s()), par(plus(n(s()), times(n(s()), par(minus(n(ri(6, 12)), n(s()))))))),
    () => minus(power(n(2), n(ri(3, 5))), divide(power(par(minus(n(ri(5, 9)), n(s()))), n(2)), n(pick([2, 4])))),
    () => divide(par(minus(times(n(s()), n(s())), n(m()))), par(minus(n(ri(6, 9)), n(s())))),
    () => minus(n(m()), times(n(s()), par(minus(n(s()), n(ri(8, 14)))))),
  ])();
  return exprProblem(`oo:${tex(e)}`, CALC, e);
}, p => wholeWork(p) && Number(p.short) >= (lv === 3 ? -99 : 0));

// ── Fractions ──
const proper = (d: number) => fr(ri(1, d - 1), d);
export const fractions: Gen = (lv: Level) => until(() => {
  const ask: [string, string] = ["mpr_calcLowest", "Calculate, in lowest terms"];
  const f = (d: number) => n(proper(d));
  let e: Node;
  if (lv === 1) {
    // same denominator, or one a multiple of the other (written as given, not reduced: 2/6 stays 2/6)
    const b = ri(2, 6), d = b * pick([1, 1, 2, 3]);
    const g = (den: number): Node => { const k = ri(1, den - 1); return { k: "num", v: fr(k, den), show: [k, den] }; };
    e = pick([plus, minus])(g(b), g(d));
  } else if (lv === 2) {
    e = pick([
      () => pick([plus, minus])(f(ri(2, 9)), f(ri(2, 9))),
      () => times(f(ri(2, 9)), f(ri(2, 9))),
      () => divide(f(ri(2, 9)), f(ri(2, 9))),
    ])();
  } else {
    e = pick([
      () => plus(f(ri(2, 6)), times(f(ri(2, 6)), f(ri(2, 6)))),
      () => divide(par(minus(f(ri(2, 6)), f(ri(2, 6)))), f(ri(2, 6))),
      () => times(par(plus(f(ri(2, 5)), f(ri(2, 5)))), n(ri(2, 12))),
      () => minus(n(ri(1, 3)), divide(f(ri(2, 6)), f(ri(2, 6)))),
    ])();
  }
  return exprProblem(`fr:${tex(e)}`, ask, e, true);
}, p => {
  const v = p.fields[0].answer.kind === "num" ? p.fields[0].answer.value : fr(0);
  return v.n !== 0 && Math.abs(v.n) <= 99 && v.d <= 72;
});

// ── Percent and proportion ──
const P = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80];
export const percent: Gen = (lv: Level) => {
  const kind = lv === 1 ? "of" : lv === 2 ? pick(["of", "what", "change"]) : pick(["change", "back", "prop"]);
  const p = pick(P), unit = 100 / gcd(p, 100);
  const pct = over(n(p), n(100));
  if (kind === "of") {
    const N = unit * ri(1, lv === 1 ? 8 : 20);
    const e = times(pct, n(N)), show = `${p}\\% \\times ${N}`;
    return { ...exprProblem(`pc:of:${p}:${N}`, ["mpr_pctOf", "What is this percentage of the number?"], e), tex: show, steps: chain([show, ...workLines(e)]) };
  }
  if (kind === "what") {
    const b = unit * ri(1, 6), a = b * p / 100;
    const e = times(over(n(a), n(b)), n(100));
    return {
      key: `pc:what:${a}:${b}`, ask: ["mpr_pctWhat", "What percentage of the second number is the first?"],
      tex: `\\frac{${a}}{${b}} = \\;?\\,\\%`, steps: chain(workLines(e)).concat(`= ${p}\\%`), short: `${p}\\%`,
      fields: [{ label: "", suffix: "%", answer: { kind: "num", value: fr(p) } }],
    };
  }
  const up = Math.random() < 0.5, factor = par((up ? plus : minus)(n(1), pct));
  const N = unit * ri(1, 12), M = value(times(factor, n(N)));
  const arrow = `\\xrightarrow{\\ ${up ? "+" : "-"}${p}\\%\\ }`;
  if (kind === "change") {
    const e = times(n(N), factor);
    return { ...exprProblem(`pc:ch:${up}:${p}:${N}`, ["mpr_pctChange", "Apply the change"], e), tex: `${N}\\ ${arrow}\\ ?` };
  }
  if (kind === "back") {
    const e = divide(n(M), factor);
    return { ...exprProblem(`pc:bk:${up}:${p}:${N}`, ["mpr_pctBack", "Find the value before the change"], e), tex: `?\\ ${arrow}\\ ${texFrac(M)}` };
  }
  // a / b = x / c, x whole
  const b = ri(2, 9), a = ri(1, 12), k = ri(2, 6), c = b * k, x = a * k;
  return {
    key: `pc:pr:${a}:${b}:${c}`, ask: ["mpr_solveX", "Solve for x"],
    tex: `\\frac{${a}}{${b}} = \\frac{x}{${c}}`,
    steps: [`\\frac{${a}}{${b}} = \\frac{x}{${c}}`, `x = \\frac{${a} \\times ${c}}{${b}}`, `x = \\frac{${a * c}}{${b}}`, `x = \\amber{${x}}`],
    short: `x = ${x}`, fields: [{ label: "x", answer: { kind: "num", value: fr(x) } }],
  };
};

// ── gcd and lcm ──
function euclid(a: number, b: number) {
  const lines: string[] = [];
  let [x, y] = a >= b ? [a, b] : [b, a];
  while (y) { lines.push(`${x} = ${Math.floor(x / y)} \\times ${y} + ${x % y === 0 ? `\\amber{0}` : x % y}`); [x, y] = [y, x % y]; }
  return { g: x, lines };
}
export const gcdLcm: Gen = (lv: Level) => {
  const doLcm = lv === 2 || (lv === 3 && Math.random() < 0.5);
  const [lo, hi] = lv === 1 ? [2, 8] : [2, lv === 2 ? 12 : 30];
  let a = 0, b = 0;
  do {
    const g = ri(lo, hi), p = ri(2, lv === 1 ? 9 : 12), q = ri(2, lv === 1 ? 9 : 12);
    [a, b] = doLcm ? [p * ri(1, 3), q * ri(1, 3)] : [g * p, g * q];
  } while (a === b || gcd(a, b) === Math.min(a, b) || (doLcm && lcm(a, b) > 400));
  const { g, lines } = euclid(a, b);
  if (!doLcm) return {
    key: `gc:${a}:${b}`, ask: ["mpr_gcd", "Find the greatest common divisor"], tex: `\\gcd(${a},\\ ${b})`,
    steps: [...lines, `\\gcd(${a},\\ ${b}) = \\amber{${g}}`], short: `${g}`, fields: [{ label: "", answer: { kind: "num", value: fr(g) } }],
  };
  const L = lcm(a, b);
  return {
    key: `lc:${a}:${b}`, ask: ["mpr_lcm", "Find the least common multiple"], tex: `\\operatorname{lcm}(${a},\\ ${b})`,
    steps: [...lines, `\\gcd = ${g}`, g === 1
      ? `\\operatorname{lcm} = ${a} \\times ${b} = \\amber{${L}}`
      : `\\operatorname{lcm} = \\frac{${a} \\times ${b}}{${g}} = \\frac{${a * b}}{${g}} = \\amber{${L}}`],
    short: `${L}`, fields: [{ label: "", answer: { kind: "num", value: fr(L) } }],
  };
};

// ── Powers and roots ──
export const powers: Gen = (lv: Level) => {
  if (lv === 1) {
    if (Math.random() < 0.3) {
      const r = ri(2, 15);
      return { key: `pw:sq:${r}`, ask: CALC, tex: `\\sqrt{${r * r}}`, steps: [`\\sqrt{${r * r}} = \\amber{${r}}`, `${r} \\times ${r} = ${r * r}`], short: `${r}`, fields: [{ label: "", answer: { kind: "num", value: fr(r) } }] };
    }
    return until(() => {
      const b = pick([2, 3, 4, 5, 10, -2, -3]), k = ri(2, b === 2 ? 8 : 4);
      const e = power(n(b), n(k));
      const p = exprProblem(`pw:${b}^${k}`, CALC, e);
      return { ...p, steps: [p.tex, `= ${Array(k).fill(b < 0 ? `(${b})` : `${b}`).join(" \\times ")}`, `= \\amber{${p.short}}`] };
    }, p => Math.abs(Number(p.short)) <= 1000);
  }
  if (lv === 2) {
    const kind = pick(["neg", "frac", "law"]);
    if (kind === "neg") {
      const b = pick([2, 3, 4, 5, 10]), k = ri(1, b === 2 ? 5 : 3), e = power(n(b), n(-k));
      const v = value(e);
      return { ...exprProblem(`pw:${b}^-${k}`, CALC, e), steps: [tex(e), `= \\frac{1}{${b}^{${k}}}`, `= \\amber{${texFrac(v)}}`] };
    }
    if (kind === "frac") {
      const e = power(n(proper(ri(2, 5))), n(ri(2, 3)));
      return exprProblem(`pw:${tex(e)}`, CALC, e);
    }
    const b = ri(2, 7), x = ri(2, 9), y = ri(2, 9);
    const [lhs, k, rule] = pick([
      [`${b}^{${x}} \\cdot ${b}^{${y}}`, x + y, `${b}^{${x} + ${y}}`],
      [`(${b}^{${x}})^{${y}}`, x * y, `${b}^{${x} \\times ${y}}`],
      [`\\frac{${b}^{${x + y}}}{${b}^{${y}}}`, x, `${b}^{${x + y} - ${y}}`],
    ] as [string, number, string][]);
    return {
      key: `pw:law:${lhs}`, ask: ["mpr_powLaw", "Find the exponent n"], tex: `${lhs} = ${b}^{n}`,
      steps: [`${lhs} = ${rule}`, `= ${b}^{\\amber{${k}}}`], short: `n = ${k}`, fields: [{ label: "n", answer: { kind: "num", value: fr(k) } }],
    };
  }
  // fractional exponents: (r^q)^(p/q) = r^p
  const r = pick([2, 3, 4, 5]), q = r <= 3 ? ri(2, 3) : 2, p = ri(1, 3) * sgn(), b = r ** q;
  const v = p > 0 ? fr(r ** p) : fr(1, r ** -p), root = q === 2 ? `\\sqrt{${b}}` : `\\sqrt[${q}]{${b}}`;
  const ap = Math.abs(p);
  return {
    key: `pw:${b}^${p}/${q}`, ask: CALC, tex: `${b}^{${p < 0 ? "-" : ""}\\frac{${ap}}{${q}}}`,
    steps: [
      `${b}^{${p < 0 ? "-" : ""}\\frac{${ap}}{${q}}}`,
      p < 0 ? `= \\frac{1}{(${root})^{${ap}}}` : `= (${root})^{${ap}}`,
      p < 0 ? `= \\frac{1}{${r}^{${ap}}}` : `= ${r}^{${ap}}`,
      `= \\amber{${texFrac(v)}}`,
    ],
    short: texFrac(v), fields: [{ label: "", answer: { kind: "num", value: v } }],
  };
};

// ── Number bases ──
const toBase = (x: number, b: number) => x.toString(b);
export const bases: Gen = (lv: Level) => {
  const b = lv === 3 ? pick([3, 5, 8]) : 2;
  const toDec = lv === 1 || (lv === 3 && Math.random() < 0.5);
  const x = lv === 1 ? ri(9, 63) : lv === 2 ? ri(10, 100) : ri(b === 8 ? 20 : 10, b === 3 ? 80 : 200);
  const s = toBase(x, b);
  if (toDec) {
    const ds = s.split("").map(Number), L = ds.length;
    const terms = ds.map((d, i) => `${d} \\cdot ${b}^{${L - 1 - i}}`);
    const vals = ds.map((d, i) => d * b ** (L - 1 - i)).filter(Boolean);
    return {
      key: `bs:${s}_${b}`, ask: ["mpr_toDec", "Write in base 10"], tex: `${s}_{${b}} = \\;?_{10}`,
      steps: [`${s}_{${b}}`, `= ${terms.join(" + ")}`, `= ${vals.join(" + ")}`, `= \\amber{${x}}`],
      short: `${x}`, fields: [{ label: "", answer: { kind: "num", value: fr(x) } }],
    };
  }
  const lines: string[] = [];
  for (let y = x; y > 0; y = Math.floor(y / b)) lines.push(`${y} = ${b} \\times ${Math.floor(y / b)} + \\amber{${y % b}}`);
  return {
    key: `bs:${x}->${b}`, ask: ["mpr_toBase", "Write in the base shown"], tex: `${x}_{10} = \\;?_{${b}}`,
    steps: [...lines, `\\uparrow\\ ${s}_{${b}}`], short: `${s}_{${b}}`,
    fields: [{ label: "", suffix: `(${b})`, answer: { kind: "digits", value: s } }],
  };
};
