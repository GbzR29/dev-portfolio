// ── Practice generators: recurrence relations ────────────────────────────────
// Terms computed step by step (first and second order), the fixed point of
// aₙ = c·aₙ₋₁ + d (an exact fraction), the roots of the characteristic
// equation (whole numbers, built backwards from the roots), and the
// constants A, B of the closed form, also built backwards from them.

import { div, fr, sub, texFrac } from "./frac";
import { nz, pick, ri, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const num = (x: number, label = "") => ({ label, answer: { kind: "num" as const, value: fr(x) } });
/** "+ 3", "- 3" after a first term. */
const signed = (c: number) => (c < 0 ? `- ${-c}` : `+ ${c}`);
const term = (c: number, s: string) => (c === 1 ? s : c === -1 ? `-${s}` : `${c}${s}`);
/** c₁s₁ + c₂s₂ + … with zero terms dropped and signs tidied: "2x - 3", "-a_{n-2}". */
function lin(parts: [number, string][]) {
  const out = parts.filter(([c]) => c !== 0).map(([c, s], i) => {
    const a = Math.abs(c), body = s && a === 1 ? s : `${a}${s}`;
    return i === 0 ? (c < 0 ? `-${body}` : body) : `${c < 0 ? "-" : "+"} ${body}`;
  });
  return out.length ? out.join(" ") : "0";
}
const rule2 = (p: number, q: number) => `a_n = ${lin([[p, "a_{n-1}"], [q, "a_{n-2}"]])}`;
/** The characteristic equation x² − px − q = 0. */
const charEq = (p: number, q: number) => `x^2 = ${lin([[p, "x"], [q, ""]])} \\;\\Rightarrow\\; ${lin([[1, "x^2"], [-p, "x"], [-q, ""]])} = 0`;
const par = (v: number) => (v < 0 ? `(${v})` : `${v}`);

// ── Terms, and the fixed point ──
export const recTerms: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const c = pick([2, 3, -2, -1, 2]), d = nz(-5, 5), a0 = ri(-3, 4), k = 4;
    const a = [a0];
    for (let n = 1; n <= k; n++) a.push(c * a[n - 1] + d);
    return {
      key: `rt1:${c}:${d}:${a0}`, ask: ["mpr_recTerm", "Find the term asked for"],
      tex: `a_n = ${term(c, "a_{n-1}")} ${signed(d)},\\quad a_0 = ${a0} \\qquad a_${k} = \\,?`,
      steps: a.slice(1).map((v, i) => `a_${i + 1} = ${c} \\cdot ${par(a[i])} ${signed(d)} = ${i + 1 === k ? amber(v) : v}`),
      short: `${a[k]}`, fields: [num(a[k])],
    };
  }
  if (lv === 2) {
    const p = nz(-2, 3), q = nz(-2, 3), a0 = ri(-2, 3), a1 = ri(-2, 3), k = 5;
    const a = [a0, a1];
    for (let n = 2; n <= k; n++) a.push(p * a[n - 1] + q * a[n - 2]);
    return {
      key: `rt2:${p}:${q}:${a0}:${a1}`, ask: ["mpr_recTerm", "Find the term asked for"],
      tex: `${rule2(p, q)},\\quad a_0 = ${a0},\\ a_1 = ${a1} \\qquad a_${k} = \\,?`,
      steps: a.slice(2).map((v, i) => `a_${i + 2} = ${p} \\cdot ${par(a[i + 1])} ${q < 0 ? "-" : "+"} ${Math.abs(q)} \\cdot ${par(a[i])} = ${i + 2 === k ? amber(v) : v}`),
      short: `${a[k]}`, fields: [num(a[k])],
    };
  }
  // the fixed point a* = d / (1 − c), c a fraction
  const c = pick([fr(1, 2), fr(1, 3), fr(2, 3), fr(3, 4), fr(1, 4), fr(-1, 2), fr(4, 5), fr(3, 2), fr(2)]);
  const d = fr(nz(-20, 30));
  const s = div(d, sub(fr(1), c));
  return {
    key: `rt3:${c.n}/${c.d}:${d.n}`, ask: ["mpr_recFixed", "Find the fixed point a* (a fraction is fine)"],
    tex: `a_n = ${texFrac(c)}\\,a_{n-1} ${signed(d.n)}`,
    steps: [`a^* = c\\,a^* + d \\;\\Rightarrow\\; a^* = \\frac{d}{1 - c}`, `a^* = \\frac{${d.n}}{1 - ${c.n < 0 ? `\\left(${texFrac(c)}\\right)` : texFrac(c)}} = \\frac{${d.n}}{${texFrac(sub(fr(1), c))}} = ${amber(texFrac(s))}`],
    short: texFrac(s), fields: [{ label: "a^*", answer: { kind: "num", value: s } }],
  };
};

// ── Characteristic roots and the closed form ──
export const recRoots: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    let r1 = 0, r2 = 0;
    do { r1 = nz(-4, 5); r2 = nz(-4, 5); } while (r1 === r2);
    const p = r1 + r2, q = -r1 * r2;
    return {
      key: `rr1:${Math.min(r1, r2)}:${Math.max(r1, r2)}`, ask: ["mpr_recRoots", "Find the two roots of the characteristic equation"],
      tex: rule2(p, q), unordered: true,
      steps: [charEq(p, q), `(x ${signed(-r1)})(x ${signed(-r2)}) = 0`, `x = ${amber(r1)},\\ ${amber(r2)}`],
      short: `${r1},\\ ${r2}`, fields: [num(r1, "r_1"), num(r2, "r_2")],
    };
  }
  if (lv === 2) {
    let r1 = 0, r2 = 0;
    do { r1 = nz(-3, 4); r2 = nz(-3, 4); } while (r1 >= r2);
    const A = nz(-3, 4), B = nz(-3, 4), p = r1 + r2, q = -r1 * r2, a0 = A + B, a1 = A * r1 + B * r2;
    return {
      key: `rr2:${r1}:${r2}:${A}:${B}`, ask: ["mpr_recAB", "Write aₙ = A·r₁ⁿ + B·r₂ⁿ with r₁ < r₂. Find A and B"],
      tex: `${rule2(p, q)},\\quad a_0 = ${a0},\\ a_1 = ${a1}`,
      steps: [
        `${charEq(p, q)}:\\ r_1 = ${r1},\\ r_2 = ${r2}`,
        `A + B = ${a0}, \\quad ${lin([[r1, "A"], [r2, "B"]])} = ${a1}`,
        `A = ${amber(A)},\\ B = ${amber(B)}`,
      ],
      short: `A = ${A},\\ B = ${B}`, fields: [num(A, "A"), num(B, "B")],
    };
  }
  // a double root r: aₙ = (A + Bn) rⁿ
  const r = pick([2, 3, -2, -1, 2]), A = nz(-3, 4), B = nz(-3, 4), p = 2 * r, q = -r * r, a0 = A, a1 = (A + B) * r;
  return {
    key: `rr3:${r}:${A}:${B}`, ask: ["mpr_recDouble", "The characteristic equation has a double root r: aₙ = (A + Bn)·rⁿ. Find A and B"],
    tex: `${rule2(p, q)},\\quad a_0 = ${a0},\\ a_1 = ${a1}`,
    steps: [
      `${lin([[1, "x^2"], [-p, "x"], [-q, ""]])} = (x ${signed(-r)})^2:\\ r = ${r}`,
      `a_0 = A = ${a0}`,
      `a_1 = (A + B) \\cdot ${par(r)} = ${a1} \\;\\Rightarrow\\; A + B = ${A + B}`,
      `A = ${amber(A)},\\ B = ${amber(B)}`,
    ],
    short: `A = ${A},\\ B = ${B}`, fields: [num(A, "A"), num(B, "B")],
  };
};
