// ── Practice generators: Algebra ──────────────────────────────────────────────
// Evaluating and collecting expressions, linear equations, 2×2 systems,
// quadratics, exponents and logarithms, arithmetic and geometric sequences.
// Same rule as arithmetic.ts: the answer is chosen first, the question is
// built around it, and the worked lines are computed from the same numbers.

import { fr, gcd, texFrac, type Frac } from "./frac";
import { nz, pick, ri, type Gen, type Level, type Problem } from "./problem";
import { chain, until } from "./arithmetic";
import { imp, minus, n, over, par, plus, power, subst, tex, v, value, workLines, type Node } from "./tree";

/** A sum of terms with its signs: [[3,"x"],[-12,""]] → "3x - 12"; zero terms are left out. */
export function terms(cs: [number, string][]): string {
  let s = "";
  for (const [c, x] of cs) {
    if (!c) continue;
    const a = Math.abs(c), body = x && a === 1 ? x : `${a}${x}`;
    s += s ? ` ${c < 0 ? "-" : "+"} ${body}` : `${c < 0 ? "-" : ""}${body}`;
  }
  return s || "0";
}
/** A number as a factor: 3, (-3). */
const fac = (c: number) => (c < 0 ? `(${c})` : `${c}`);
const amber = (s: string) => `\\amber{${s}}`;
const num = (label: string, x: Frac, lowest = false) => ({ label, answer: { kind: "num" as const, value: x, lowest } });

// ── Evaluating an expression ──
/** a·xⁿ… as a tree with minus signs in place of negative coefficients. */
function polyNode(cs: [number, number][], x: string): Node {
  let e: Node | null = null;
  for (const [c, p] of cs) {
    if (!c) continue;
    const xp: Node = p === 0 ? n(Math.abs(c)) : p === 1 ? v(x) : power(v(x), n(p));
    const k: number = e ? Math.abs(c) : c;                    // after the first term the sign goes into + / −
    const t: Node = p === 0 ? n(k) : k === 1 ? xp : imp(n(k), xp);
    e = e ? (c < 0 ? minus : plus)(e, t) : t;
  }
  return e ?? n(0);
}

export const evaluate: Gen = (lv: Level) => until(() => {
  let e: Node, vals: Record<string, number>;
  if (lv === 1) { e = polyNode([[nz(-9, 9), 1], [nz(-15, 15), 0]], "x"); vals = { x: ri(1, 9) }; }
  else if (lv === 2) { e = polyNode([[nz(-4, 5), 2], [nz(-9, 9), 1], [ri(-9, 9), 0]], "x"); vals = { x: nz(-4, 4) }; }
  else {
    const a = ri(2, 5), b = nz(-6, 6);
    e = pick([
      () => minus(power(v("x"), n(2)), imp(n(a), v("y"))),
      () => imp(par(minus(v("x"), v("y"))), par(plus(v("x"), v("y")))),
      () => over(minus(imp(n(a), v("x")), v("y")), plus(v("x"), n(b))),
      () => minus(power(par(plus(v("x"), v("y"))), n(2)), imp(n(a), imp(v("x"), v("y")))),
    ])();
    vals = { x: nz(-6, 6), y: nz(-6, 6) };
  }
  const sub = subst(e, Object.fromEntries(Object.entries(vals).map(([k, x]) => [k, n(x)])));
  const ans = value(sub), given = Object.entries(vals).map(([k, x]) => `${k} = ${x}`).join(",\\ ");
  const p: Problem = {
    key: `ev:${tex(e)}:${given}`, ask: ["mpr_eval", "Evaluate the expression"], tex: `${tex(e)},\\quad ${given}`,
    steps: chain(workLines(sub)), short: texFrac(ans), fields: [num("", ans)],
  };
  return p;
}, p => p.fields[0].answer.kind === "num" && Math.abs(p.fields[0].answer.value.n) <= 999 && p.fields[0].answer.value.d <= 20);

// ── Collecting like terms ──
type Part = { k: number; m: number; c: number };            // k(mx + c)
export const collect: Gen = (lv: Level) => until(() => {
  const ask: [string, string] = ["mpr_collect", "Simplify to the form ax + b"];
  if (lv === 1) {
    const p = nz(-6, 7), q = nz(-9, 9), r = nz(-6, 6), s = nz(-9, 9);
    const order: [number, string][] = pick([[[p, "x"], [q, ""], [r, "x"], [s, ""]], [[q, ""], [p, "x"], [s, ""], [r, "x"]], [[p, "x"], [q, ""], [s, ""], [r, "x"]]]);
    const a = p + r, b = q + s, show = terms(order);
    return {
      key: `co:${show}`, ask, tex: show,
      steps: [show, `= (${p} ${r < 0 ? "-" : "+"} ${Math.abs(r)})x + (${q} ${s < 0 ? "-" : "+"} ${Math.abs(s)})`, `= ${amber(terms([[a, "x"], [b, ""]]))}`],
      short: terms([[a, "x"], [b, ""]]), fields: [num("a", fr(a)), num("b", fr(b))],
    };
  }
  const parts: Part[] = [{ k: nz(-5, 5), m: lv === 2 ? 1 : nz(-3, 4), c: nz(-7, 7) }, { k: nz(-5, 5), m: lv === 2 ? 1 : nz(-3, 4), c: nz(-7, 7) }];
  const loose = lv === 3 ? nz(-5, 5) : 0;
  const partTex = (p: Part, first: boolean) => {
    const inner = `(${terms([[p.m, "x"], [p.c, ""]])})`, a = Math.abs(p.k);
    const coef = a === 1 ? "" : `${a}`;
    return first ? `${p.k < 0 ? "-" : ""}${coef}${inner}` : ` ${p.k < 0 ? "-" : "+"} ${coef}${inner}`;
  };
  const show = parts.map((p, i) => partTex(p, i === 0)).join("") + (loose ? ` ${loose < 0 ? "-" : "+"} ${Math.abs(loose) === 1 ? "" : Math.abs(loose)}x` : "");
  const expanded: [number, string][] = parts.flatMap(p => [[p.k * p.m, "x"], [p.k * p.c, ""]] as [number, string][]).concat(loose ? [[loose, "x"]] : []);
  const a = expanded.filter(t => t[1]).reduce((s, t) => s + t[0], 0), b = expanded.filter(t => !t[1]).reduce((s, t) => s + t[0], 0);
  return {
    key: `co:${show}`, ask, tex: show,
    steps: [show, `= ${terms(expanded)}`, `= ${amber(terms([[a, "x"], [b, ""]]))}`],
    short: terms([[a, "x"], [b, ""]]), fields: [num("a", fr(a)), num("b", fr(b))],
  };
}, p => p.fields.every(f => f.answer.kind === "num" && f.answer.value.n !== 0));

// ── Linear equations ──
export const linear: Gen = (lv: Level) => {
  const ask: [string, string] = ["mpr_solveX", "Solve for x"];
  const done = (key: string, show: string, lines: string[], x: Frac): Problem => ({
    key, ask, tex: show, steps: [show, ...lines, `x = ${amber(texFrac(x))}`], short: `x = ${texFrac(x)}`, fields: [num("x", x, true)],
  });
  const kind = lv === 1 ? "axb" : lv === 2 ? pick(["axb", "paren", "both"]) : pick(["bothFrac", "overA", "overC"]);
  const x = nz(-10, 10);
  if (kind === "axb") {
    const a = pick([2, 3, 4, 5, 6, 7, 8, 9, -2, -3, -4, -5]), b = nz(-15, 15), c = a * x + b;
    return done(`li:${a}:${b}:${c}`, `${terms([[a, "x"], [b, ""]])} = ${c}`,
      [`${terms([[a, "x"]])} = ${c} ${b < 0 ? "+" : "-"} ${Math.abs(b)}`, `${terms([[a, "x"]])} = ${c - b}`, `x = \\frac{${c - b}}{${a}}`], fr(x));
  }
  if (kind === "paren") {
    const a = pick([2, 3, 4, 5, -2, -3]), b = nz(-8, 8), c = a * (x + b);
    return done(`li:p:${a}:${b}:${c}`, `${a}(${terms([[1, "x"], [b, ""]])}) = ${c}`,
      [`${terms([[1, "x"], [b, ""]])} = \\frac{${c}}{${a}} = ${c / a}`, `x = ${c / a} ${b < 0 ? "+" : "-"} ${Math.abs(b)}`], fr(x));
  }
  if (kind === "both" || kind === "bothFrac") {
    let a = 0, c = 0, b = 0, d = 0, X = fr(x);
    for (;;) {
      a = nz(-7, 9); c = nz(-7, 9); b = nz(-12, 12);
      if (a === c) continue;
      if (kind === "both") { d = (a - c) * x + b; break; }
      d = nz(-12, 12);
      X = fr(d - b, a - c);
      if (X.d !== 1 && X.d <= 9) break;
    }
    return done(`li:b:${a}:${b}:${c}:${d}`, `${terms([[a, "x"], [b, ""]])} = ${terms([[c, "x"], [d, ""]])}`,
      [`${terms([[a, "x"]])} ${c < 0 ? "+" : "-"} ${Math.abs(c) === 1 ? "" : Math.abs(c)}x = ${d} ${b < 0 ? "+" : "-"} ${Math.abs(b)}`,
       `${terms([[a - c, "x"]])} = ${d - b}`, `x = \\frac{${d - b}}{${a - c}}`], X);
  }
  if (kind === "overA") {                                      // x/a + b = c
    const a = ri(2, 6), k = nz(-6, 6), X = a * k, b = nz(-9, 9), c = k + b;
    return done(`li:oa:${a}:${b}:${c}`, `\\frac{x}{${a}} ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${c}`,
      [`\\frac{x}{${a}} = ${c} ${b < 0 ? "+" : "-"} ${Math.abs(b)} = ${k}`, `x = ${k} \\times ${a}`], fr(X));
  }
  // (ax + b)/c = d
  const a = pick([2, 3, 4, 5]), b = nz(-9, 9), c = pick([2, 3, 4, 5]), d0 = a * x + b;
  if (d0 % c) return linear(lv);
  const d = d0 / c;
  return done(`li:oc:${a}:${b}:${c}`, `\\frac{${terms([[a, "x"], [b, ""]])}}{${c}} = ${d}`,
    [`${terms([[a, "x"], [b, ""]])} = ${d} \\times ${c} = ${d0}`, `${a}x = ${d0} ${b < 0 ? "+" : "-"} ${Math.abs(b)} = ${d0 - b}`, `x = \\frac{${d0 - b}}{${a}}`], fr(x));
};

// ── Systems of two equations ──
export const system: Gen = (lv: Level) => {
  const x = nz(-6, 6), y = nz(-6, 6);
  const ask: [string, string] = ["mpr_system", "Solve the system"];
  const fin = (key: string, show: string, lines: string[]): Problem => ({
    key, ask, tex: show, steps: [show, ...lines, `x = ${amber(`${x}`)},\\quad y = ${amber(`${y}`)}`],
    short: `x = ${x},\\ y = ${y}`, fields: [num("x", fr(x)), num("y", fr(y))],
  });
  const cases = (e1: string, e2: string) => `\\begin{cases} ${e1} \\\\ ${e2} \\end{cases}`;
  if (lv === 1) {                                              // y = mx + q, ax + by = c: substitute
    let m = 0, q = 0, a = 0, b = 0;
    do { m = nz(-4, 4); q = y - m * x; a = nz(-5, 5); b = nz(-5, 5); } while (a + b * m === 0);
    const c = a * x + b * y, e1 = `y = ${terms([[m, "x"], [q, ""]])}`, e2 = `${terms([[a, "x"], [b, "y"]])} = ${c}`;
    return fin(`sy:1:${e1}:${e2}`, cases(e1, e2), [
      `${terms([[a, "x"]])} ${b < 0 ? "-" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}(${terms([[m, "x"], [q, ""]])}) = ${c}`,
      `${terms([[a, "x"], [b * m, "x"], [b * q, ""]])} = ${c}`,
      `${terms([[a + b * m, "x"]])} = ${c - b * q}`,
      `x = ${x},\\quad y = ${fac(m)} \\cdot ${fac(x)} ${q < 0 ? "-" : "+"} ${Math.abs(q)} = ${y}`,
    ]);
  }
  const R = lv === 2 ? 5 : 9;
  let a1 = 0, b1 = 0, a2 = 0, b2 = 0;
  do { a1 = nz(-R, R); b1 = nz(-R, R); a2 = nz(-R, R); b2 = nz(-R, R); } while (a1 * b2 - a2 * b1 === 0 || (lv === 3 && Math.abs(b1) === Math.abs(b2)));
  const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
  const e1 = `${terms([[a1, "x"], [b1, "y"]])} = ${c1}`, e2 = `${terms([[a2, "x"], [b2, "y"]])} = ${c2}`;
  const g = gcd(b1, b2), s = b2 < 0 ? -1 : 1, m1 = s * b2 / g, m2 = s * b1 / g;   // m1·(1) − m2·(2) removes y; m1 > 0
  const A = a1 * m1 - a2 * m2, C = c1 * m1 - c2 * m2;
  const times = (m: number, eq: string) => (m === 1 ? eq : `${m} \\cdot ${eq}`);
  const how = `${times(m1, "(1)")} ${m2 < 0 ? "+" : "-"} ${times(Math.abs(m2), "(2)")}`;
  return fin(`sy:${e1}:${e2}`, cases(`${e1} & (1)`, `${e2} & (2)`), [
    `${how}:\\quad ${terms([[A, "x"]])} = ${C}`,
    `x = \\frac{${C}}{${A}} = ${x}`,
    `(1):\\ ${terms([[b1, "y"]])} = ${c1} ${a1 * x < 0 ? "+" : "-"} ${Math.abs(a1 * x)} = ${c1 - a1 * x}`,
    `y = \\frac{${c1 - a1 * x}}{${b1}} = ${y}`,
  ]);
};

// ── Quadratics ──
const factor = (p: number, q: number) => `(${terms([[p, "x"], [-q, ""]])})`;   // (px − q)
export const quadratic: Gen = (lv: Level) => {
  const ask: [string, string] = ["mpr_roots", "Find both solutions"];
  // (p x − q)(r x − s), roots q/p and s/r, written as a x² + b x + c with no common factor
  let p = 1, q = 0, r = 1, s = 0;
  do {
    q = ri(-9, 9); s = ri(-9, 9);
    if (lv === 2) { p = pick([1, 2, 3]); r = pick([1, 2, 3]); if (p === 1 && r === 1) p = 2; }
    if (lv === 3) { p = ri(1, 4); r = ri(2, 5); }
  } while (q * r === s * p || gcd(p, q) !== 1 || gcd(r, s) !== 1 || (lv === 1 && Math.abs(q * s) > 40));
  // both factors have no common factor, so neither has their product (Gauss): a, b, c share none
  const a = p * r, b = -(p * s + q * r), c = q * s;
  const x1 = fr(q, p), x2 = fr(s, r), show = `${terms([[a, "x^2"], [b, "x"], [c, ""]])} = 0`;
  const end = `x_1 = ${amber(texFrac(x1))},\\quad x_2 = ${amber(texFrac(x2))}`;
  const base = { key: `qu:${show}`, ask, tex: show, unordered: true, short: `${texFrac(x1)},\\ ${texFrac(x2)}`, fields: [num("x_1", x1, true), num("x_2", x2, true)] };
  if (lv < 3) {
    const lines = lv === 1
      ? [`${fac(q)} \\cdot ${fac(s)} = ${c},\\quad ${fac(q)} + ${fac(s)} = ${q + s}`, `${factor(1, q)}${factor(1, s)} = 0`]
      : [`${factor(p, q)}${factor(r, s)} = 0`, `${terms([[p, "x"], [-q, ""]])} = 0,\\quad ${terms([[r, "x"], [-s, ""]])} = 0`];
    return { ...base, steps: [show, ...lines, end] };
  }
  const D = b * b - 4 * a * c, root = Math.round(Math.sqrt(D));
  const plus_ = fr(-b + root, 2 * a), minus_ = fr(-b - root, 2 * a);
  return {
    ...base,
    steps: [show, `a = ${a},\\ b = ${b},\\ c = ${c}`,
      `\\Delta = b^2 - 4ac = ${fac(b)}^2 - 4 \\cdot ${fac(a)} \\cdot ${fac(c)} = ${D}`,
      `\\sqrt{\\Delta} = ${root}`,
      `x = \\frac{${-b} \\pm ${root}}{${2 * a}}`,
      `x_1 = \\frac{${-b + root}}{${2 * a}},\\quad x_2 = \\frac{${-b - root}}{${2 * a}}`,
      `x_1 = ${amber(texFrac(plus_))},\\quad x_2 = ${amber(texFrac(minus_))}`],
  };
};

// ── Exponents and logarithms ──
export const explog: Gen = (lv: Level) => {
  const b = pick([2, 3, 5, 10]), max = b === 2 ? 7 : b === 10 ? 5 : 4;
  if (lv === 1 || (lv === 2 && Math.random() < 0.4)) {
    const k = lv === 1 ? ri(0, max) : -ri(1, b === 10 ? 3 : 3), N = k >= 0 ? `${b ** k}` : `\\frac{1}{${b ** -k}}`;
    const show = `\\log_{${b}} ${N}`;
    return {
      key: `lg:${b}:${k}`, ask: CALC_, tex: show, steps: [show, `= \\log_{${b}} ${b}^{${k}}`, `= ${amber(`${k}`)}`],
      short: `${k}`, fields: [num("", fr(k))],
    };
  }
  if (lv === 2) {                                              // b^(x + c) = b^k
    const k = ri(1, max), c = nz(-4, 4), x = k - c, show = `${b}^{${terms([[1, "x"], [c, ""]])}} = ${b ** k}`;
    return {
      key: `lg:eq:${show}`, ask: ["mpr_solveX", "Solve for x"], tex: show,
      steps: [show, `${b}^{${terms([[1, "x"], [c, ""]])}} = ${b}^{${k}}`, `${terms([[1, "x"], [c, ""]])} = ${k}`, `x = ${amber(`${x}`)}`],
      short: `x = ${x}`, fields: [num("x", fr(x))],
    };
  }
  if (Math.random() < 0.6) {                                  // (r^p)^x = r^q
    const r = pick([2, 3, 5]), lim = r === 2 ? 6 : 3;
    let p = 0, q = 0;
    do { p = ri(1, lim); q = ri(1, lim); } while (p === q || p === 1);
    const x = fr(q, p), show = `${r ** p}^{x} = ${r ** q}`;
    return {
      key: `lg:pw:${show}`, ask: ["mpr_solveX", "Solve for x"], tex: show,
      steps: [show, `(${r}^{${p}})^{x} = ${r}^{${q}}`, `${r}^{${p}x} = ${r}^{${q}}`, `${p}x = ${q}`, `x = ${amber(texFrac(x))}`],
      short: `x = ${texFrac(x)}`, fields: [num("x", x, true)],
    };
  }
  const [base, m, k2] = pick([[6, 4, 9], [6, 2, 18], [6, 3, 12], [10, 2, 50], [10, 4, 25], [10, 5, 20], [10, 20, 50], [12, 3, 48], [12, 8, 18]] as [number, number, number][]);
  const prod = m * k2;
  const kk = Math.round(Math.log(prod) / Math.log(base));
  if (base ** kk !== prod) return explog(lv);
  const show = `\\log_{${base}} ${m} + \\log_{${base}} ${k2}`;
  return {
    key: `lg:sum:${show}`, ask: CALC_, tex: show,
    steps: [show, `= \\log_{${base}} (${m} \\times ${k2})`, `= \\log_{${base}} ${prod}`, `= ${amber(`${kk}`)}`],
    short: `${kk}`, fields: [num("", fr(kk))],
  };
};
const CALC_: [string, string] = ["mpr_calc", "Calculate"];

// ── Sequences ──
export const sequences: Gen = (lv: Level) => {
  const kind = lv === 1 ? "arith" : lv === 2 ? "geo" : pick(["sumA", "sumG"]);
  if (kind === "arith" || kind === "sumA") {
    const a1 = ri(-10, 20), d = nz(-6, 9), N = ri(8, 30), an = a1 + (N - 1) * d;
    const first = [0, 1, 2, 3].map(i => a1 + i * d).join(",\\ ");
    if (kind === "arith") return {
      key: `sq:a:${a1}:${d}:${N}`, ask: ["mpr_seqTerm", "Find the term asked for"], tex: `${first},\\ \\ldots\\qquad a_{${N}} = \\;?`,
      steps: [`d = ${a1 + d} - ${fac(a1)} = ${d}`, `a_n = a_1 + (n - 1)\\,d`, `a_{${N}} = ${a1} + ${N - 1} \\times ${fac(d)}`, `a_{${N}} = ${amber(`${an}`)}`],
      short: `${an}`, fields: [num("", fr(an))],
    };
    const S = N * (a1 + an) / 2;
    return {
      key: `sq:sa:${a1}:${d}:${N}`, ask: ["mpr_seqSum", "Add up the first terms"], tex: `${first},\\ \\ldots\\qquad S_{${N}} = \\;?`,
      steps: [`d = ${d},\\quad a_{${N}} = ${a1} + ${N - 1} \\times ${fac(d)} = ${an}`, `S_n = \\frac{n\\,(a_1 + a_n)}{2}`, `S_{${N}} = \\frac{${N} \\times (${a1} + ${fac(an)})}{2}`, `S_{${N}} = ${amber(`${S}`)}`],
      short: `${S}`, fields: [num("", fr(S))],
    };
  }
  return until(() => {
    const half = kind === "geo" && Math.random() < 0.25;
    const r = half ? fr(1, 2) : fr(pick(kind === "geo" ? [2, 3, -2, -3] : [2, 3])), a1 = half ? 2 ** ri(5, 8) : pick([1, 2, 3, 5, -2]);
    const N = kind === "geo" ? ri(5, 8) : ri(4, 7);
    const term = (i: number) => fr(a1 * r.n ** i, r.d ** i);
    const first = [0, 1, 2, 3].map(i => texFrac(term(i))).join(",\\ "), an = term(N - 1);
    const rTex = texFrac(r);
    if (kind === "geo") return {
      key: `sq:g:${a1}:${rTex}:${N}`, ask: ["mpr_seqTerm", "Find the term asked for"] as [string, string], tex: `${first},\\ \\ldots\\qquad a_{${N}} = \\;?`,
      steps: [`r = \\frac{${texFrac(term(1))}}{${a1}} = ${rTex}`, `a_n = a_1 \\cdot r^{\\,n - 1}`, `a_{${N}} = ${a1} \\cdot \\left(${rTex}\\right)^{${N - 1}}`, `a_{${N}} = ${amber(texFrac(an))}`],
      short: texFrac(an), fields: [num("", an)],
    };
    const S = a1 * (r.n ** N - 1) / (r.n - 1);
    return {
      key: `sq:sg:${a1}:${rTex}:${N}`, ask: ["mpr_seqSum", "Add up the first terms"] as [string, string], tex: `${first},\\ \\ldots\\qquad S_{${N}} = \\;?`,
      steps: [`r = ${rTex}`, `S_n = a_1 \\cdot \\frac{r^{\\,n} - 1}{r - 1}`, `S_{${N}} = ${a1} \\cdot \\frac{${rTex}^{${N}} - 1}{${rTex} - 1} = ${a1} \\cdot ${r.n === 2 ? r.n ** N - 1 : `\\frac{${r.n ** N - 1}}{${r.n - 1}}`}`, `S_{${N}} = ${amber(`${S}`)}`],
      short: `${S}`, fields: [num("", fr(S))],
    };
  }, p => p.fields[0].answer.kind === "num" && Math.abs(p.fields[0].answer.value.n) <= 5000);
};

// ── Binomial theorem ──
const binom = (N: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (N - k + i)) / i; return r; };
/** "2x", "x" — the first term of the bracket. */
const px = (p: number) => (p === 1 ? "x" : `${p}x`);
const sq = (q: number) => (q < 0 ? `- ${-q}` : `+ ${q}`);

/** The coefficient of xᵐ in (px + q)ⁿ, or the constant term of (x + q/x)ⁿ. */
export const binomialCoef: Gen = (lv: Level) => until((): Problem => {
  if (lv === 3 && Math.random() < 0.5) {
    const N = pick([4, 6, 8]), q = nz(-2, 2), k = N / 2, c = binom(N, k), ans = c * q ** k;
    return {
      key: `bn:c:${N}:${q}`, ask: ["mpr_binConst", "Find the term without x (the constant term)"],
      tex: `\\left(x ${sq(q)}\\,\\tfrac{1}{x}\\right)^{${N}}`,
      steps: [
        `T = \\binom{${N}}{k}\\,x^{${N} - k}\\left(\\tfrac{${q}}{x}\\right)^{k} = \\binom{${N}}{k}\\,${fac(q)}^{k}\\,x^{${N} - 2k}`,
        `${N} - 2k = 0 \\;\\Rightarrow\\; k = ${k}`,
        `\\binom{${N}}{${k}} \\cdot ${fac(q)}^{${k}} = ${c} \\cdot ${fac(q ** k)}`,
        `= ${amber(`${ans}`)}`,
      ],
      short: `${ans}`, fields: [num("", fr(ans))],
    };
  }
  const p = lv === 1 ? 1 : ri(1, 3), q = lv === 1 ? nz(-3, 3) : nz(-4, 4);
  const N = lv === 1 ? ri(3, 5) : ri(3, 6), m = ri(1, N - 1), k = N - m, c = binom(N, k), ans = c * p ** m * q ** k;
  return {
    key: `bn:${p}:${q}:${N}:${m}`, ask: ["mpr_binCoef", "Find the number in front of the power of x shown"],
    tex: `(${px(p)} ${sq(q)})^{${N}} \\;=\\; \\cdots + \\boxed{\\,?\\,}\\,x^{${m}} + \\cdots`,
    steps: [
      `T = \\binom{${N}}{k}\\,(${px(p)})^{${N} - k}\\,${fac(q)}^{k}`,
      `${N} - k = ${m} \\;\\Rightarrow\\; k = ${k}`,
      `\\binom{${N}}{${k}} \\cdot ${p}^{${m}} \\cdot ${fac(q)}^{${k}} = ${c} \\cdot ${p ** m} \\cdot ${fac(q ** k)}`,
      `= ${amber(`${ans}`)}`,
    ],
    short: `${ans}`, fields: [num("", fr(ans))],
  };
}, p => p.fields[0].answer.kind === "num" && Math.abs(p.fields[0].answer.value.n) <= 5000);

/** C(n, k) by the falling-product formula. */
export const binomialChoose: Gen = (lv: Level) => {
  const N = lv === 1 ? ri(4, 7) : lv === 2 ? ri(6, 10) : ri(9, 14);
  const k = lv === 1 ? ri(1, 2) : ri(2, Math.min(4, N - 2)), c = binom(N, k);
  const top = Array.from({ length: k }, (_, i) => N - i).join(" \\cdot "), bot = Array.from({ length: k }, (_, i) => k - i).join(" \\cdot ");
  return {
    key: `bc:${N}:${k}`, ask: ["mpr_binChoose", "Work out the binomial coefficient"], tex: `\\binom{${N}}{${k}}`,
    steps: chain([`\\binom{${N}}{${k}} = \\frac{${N}!}{${k}!\\,${N - k}!}`, `\\frac{${top}}{${bot}}`, amber(`${c}`)]),
    short: `${c}`, fields: [num("", fr(c))],
  };
};
