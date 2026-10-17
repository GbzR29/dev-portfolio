// ── Practice generators: dividing polynomials ────────────────────────────────
// Ruffini's rule (by x − r and by ax − b), the remainder theorem (p(r), a
// missing coefficient that makes x − r a factor, the remainder by
// (x − a)(x − b)), rational roots and Girard's relations. Every problem is
// built backwards from its answer: the quotient and remainder are chosen
// first, or the roots, and the polynomial is multiplied out from them. The
// worked solution shows the device as a TeX table.

import { add, fr, mul, sub, texFrac, type Frac } from "./frac";
import { nz, pick, ri, type Field, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const F = (x: Frac | number, label = ""): Field => ({ label, answer: { kind: "num", value: typeof x === "number" ? fr(x) : x } });
const asF = (xs: number[]) => xs.map(x => fr(x));

/** "2x^3 - 3x^2 + 5x - 7" from coefficients (highest power first). */
export function polyTex(cs: Frac[], v = "x") {
  const deg = cs.length - 1, out: string[] = [];
  cs.forEach((c, i) => {
    if (c.n === 0) return;
    const k = deg - i, abs = fr(Math.abs(c.n), c.d);
    const coef = k > 0 && abs.n === 1 && abs.d === 1 ? "" : texFrac(abs);
    const body = coef + (k === 0 ? "" : k === 1 ? v : `${v}^{${k}}`);
    out.push(out.length === 0 ? (c.n < 0 ? `-${body}` : body) : `${c.n < 0 ? "-" : "+"} ${body}`);
  });
  return out.length ? out.join(" ") : "0";
}
/** (x − r) as TeX. */
const factorTex = (r: Frac) => (r.n === 0 ? "x" : `x ${r.n > 0 ? "-" : "+"} ${texFrac(fr(Math.abs(r.n), r.d))}`);

/** Ruffini's bottom row: quotient coefficients, then the remainder. */
export function ruffiniRow(cs: Frac[], r: Frac) {
  const row = [cs[0]];
  for (let k = 1; k < cs.length; k++) row.push(add(cs[k], mul(row[k - 1], r)));
  return row;
}
/** The device as a TeX array: r | coefficients / products / bottom row. */
function device(cs: Frac[], r: Frac) {
  const row = ruffiniRow(cs, r);
  const prods = cs.map((_, k) => (k === 0 ? "" : texFrac(mul(row[k - 1], r))));
  const bottom = row.map((v, k) => (k === row.length - 1 ? amber(texFrac(v)) : texFrac(v)));
  return `\\begin{array}{r|${"r".repeat(cs.length)}} ${texFrac(r)} & ${cs.map(texFrac).join(" & ")} \\\\ & ${prods.join(" & ")} \\\\ \\hline & ${bottom.join(" & ")} \\end{array}`;
}
/** (x − r) · q(x) + R, multiplied out. */
function build(q: Frac[], r: Frac, R: Frac) {
  const out = [q[0]];
  for (let k = 1; k < q.length; k++) out.push(sub(q[k], mul(q[k - 1], r)));
  out.push(sub(R, mul(q[q.length - 1], r)));
  return out;
}
const qLabels = (deg: number) => Array.from({ length: deg + 1 }, (_, i) => `q_${deg - i}`);

// ── Ruffini: quotient and remainder ──
export const polyRuffini: Gen = (lv: Level): Problem => {
  if (lv < 3) {
    const deg = lv === 1 ? 2 : 3;                                   // quotient degree
    const r = fr(nz(-3, 3));
    const q: Frac[] = [fr(nz(-3, 4)), ...Array.from({ length: deg }, () => fr(ri(-5, 5)))];
    const R = fr(ri(-9, 9));
    let p = build(q, r, R);
    if (lv === 2) {
      // force a missing power: choose q so that one middle coefficient of p is 0
      const k = ri(1, deg);                                          // coefficient index in p (not the leading one)
      q[k] = mul(q[k - 1], r);                                       // p[k] = q[k] − q[k−1]·r = 0
      p = build(q, r, R);
    }
    const row = ruffiniRow(p, r);
    return {
      key: `pr${lv}:${p.map(texFrac).join(",")}:${texFrac(r)}`,
      ask: ["mpr_pdQR", "Divide by the binomial: give the quotient's coefficients and the remainder"],
      tex: `\\left(${polyTex(p)}\\right) \\div \\left(${factorTex(r)}\\right)`,
      steps: [
        device(p, r),
        `q(x) = ${polyTex(row.slice(0, -1))}, \\quad R = ${amber(texFrac(row[row.length - 1]))}`,
      ],
      short: `${polyTex(row.slice(0, -1))};\\ R = ${texFrac(row[row.length - 1])}`,
      fields: [...row.slice(0, -1).map((c, i) => F(c, qLabels(deg)[i])), F(row[row.length - 1], "R")],
    };
  }
  // by ax − b: Ruffini at r = b/a, then divide the quotient by a
  const a = pick([2, 3]), b = nz(-4, 4), r = fr(b, a);
  if (r.d === 1) return polyRuffini(3);
  const q = [fr(nz(-3, 3)), fr(ri(-4, 4)), fr(ri(-4, 4))], R = fr(ri(-6, 6));
  // p = (ax − b) q + R = (x − r) (a q) + R
  const p = build(q.map(c => mul(c, fr(a))), r, R);
  if (p.some(c => c.d !== 1)) return polyRuffini(3);
  const row = ruffiniRow(p, r);
  return {
    key: `pr3:${p.map(texFrac).join(",")}:${a}:${b}`,
    ask: ["mpr_pdQR", "Divide by the binomial: give the quotient's coefficients and the remainder"],
    tex: `\\left(${polyTex(p)}\\right) \\div \\left(${a}x ${b < 0 ? "+" : "-"} ${Math.abs(b)}\\right)`,
    steps: [
      `${a}x ${b < 0 ? "+" : "-"} ${Math.abs(b)} = ${a}\\left(${factorTex(r)}\\right)`,
      device(p, r),
      `\\tfrac{1}{${a}}\\left(${polyTex(row.slice(0, -1))}\\right) = ${amber(polyTex(q))}, \\quad R = ${amber(texFrac(R))}`,
    ],
    short: `${polyTex(q)};\\ R = ${texFrac(R)}`,
    fields: [...q.map((c, i) => F(c, qLabels(2)[i])), F(R, "R")],
  };
};

// ── The remainder theorem ──
export const polyRemainder: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const p = asF([nz(-3, 3), ri(-6, 6), ri(-6, 6), ri(-9, 9)]), r = fr(nz(-3, 3));
    const row = ruffiniRow(p, r), R = row[row.length - 1];
    return {
      key: `pm1:${p.map(texFrac).join(",")}:${texFrac(r)}`,
      ask: ["mpr_pdRem", "Find the remainder of the division"],
      tex: `\\left(${polyTex(p)}\\right) \\div \\left(${factorTex(r)}\\right)`,
      steps: [`R = p(${texFrac(r)})`, `p(${texFrac(r)}) = ${amber(texFrac(R))}`],
      short: texFrac(R), fields: [F(R)],
    };
  }
  if (lv === 2) {
    const a = ri(-6, 6), b = ri(-9, 9), r = nz(-3, 3);
    const k = -(r ** 3 + a * r * r + b * r);
    return {
      key: `pm2:${a}:${b}:${r}`,
      ask: ["mpr_pdK", "Find k so that the binomial divides the polynomial exactly"],
      tex: `\\left(${polyTex(asF([1, a, b, 0]))} + k\\right) \\div \\left(x ${r > 0 ? "-" : "+"} ${Math.abs(r)}\\right)`,
      steps: [`p(${r}) = 0`, `${r ** 3} ${a * r * r < 0 ? "-" : "+"} ${Math.abs(a * r * r)} ${b * r < 0 ? "-" : "+"} ${Math.abs(b * r)} + k = 0`, `k = ${amber(k)}`],
      short: `${k}`, fields: [F(k, "k")],
    };
  }
  // remainder by (x − a)(x − b) is mx + c with ma + c = p(a), mb + c = p(b)
  let a = 0, b = 0;
  do { a = nz(-3, 3); b = nz(-3, 3); } while (a >= b);
  const A = ri(-9, 9), B = ri(-9, 9);
  const m = fr(B - A, b - a), c = sub(fr(A), mul(m, fr(a)));
  return {
    key: `pm3:${a}:${b}:${A}:${B}`,
    ask: ["mpr_pdTwo", "p(x) leaves remainder mx + c when divided by (x − a)(x − b). Find m and c"],
    tex: `p(${a}) = ${A},\\quad p(${b}) = ${B} \\qquad p(x) \\div (${factorTex(fr(a))})(${factorTex(fr(b))})`,
    steps: [
      `p(x) = (${factorTex(fr(a))})(${factorTex(fr(b))})\\,q(x) + mx + c`,
      `x = ${a}:\\ ${a}m + c = ${A}, \\qquad x = ${b}:\\ ${b}m + c = ${B}`,
      `m = \\tfrac{${B} - ${A < 0 ? `(${A})` : A}}{${b} - ${a < 0 ? `(${a})` : a}} =${amber(texFrac(m))}, \\quad c = ${amber(texFrac(c))}`,
    ],
    short: `${texFrac(m)}x + ${texFrac(c)}`, fields: [F(m, "m"), F(c, "c")],
  };
};

// ── Rational roots and Girard's relations ──
export const polyRoots: Gen = (lv: Level): Problem => {
  let rs: Frac[], lead = 1;
  if (lv === 1) {
    const ints = new Set<number>();
    while (ints.size < 3) ints.add(nz(-4, 4));
    rs = [...ints].map(x => fr(x));
  } else {
    lead = 2;
    const ints = new Set<number>();
    while (ints.size < 2) ints.add(nz(-3, 3));
    rs = [...[...ints].map(x => fr(x)), fr(pick([1, -1, 3, -3]), 2)];
  }
  // a (x − r₁)(x − r₂)(x − r₃)
  const [r1, r2, r3] = rs;
  const s1 = add(add(r1, r2), r3), s2 = add(add(mul(r1, r2), mul(r1, r3)), mul(r2, r3)), s3 = mul(mul(r1, r2), r3);
  const p = [fr(lead), mul(fr(-lead), s1), mul(fr(lead), s2), mul(fr(-lead), s3)];
  if (lv === 3) {
    return {
      key: `pg:${p.map(texFrac).join(",")}`,
      ask: ["mpr_pdGirard", "Without finding the roots, give their sum, the sum of their products in pairs, and their product"],
      tex: polyTex(p) + " = 0",
      unordered: false,
      steps: [
        `ax^3 + bx^2 + cx + d:\\quad r_1 + r_2 + r_3 = -\\tfrac{b}{a}, \\quad r_1r_2 + r_1r_3 + r_2r_3 = \\tfrac{c}{a}, \\quad r_1r_2r_3 = -\\tfrac{d}{a}`,
        `${amber(texFrac(s1))},\\quad ${amber(texFrac(s2))},\\quad ${amber(texFrac(s3))}`,
      ],
      short: `${texFrac(s1)},\\ ${texFrac(s2)},\\ ${texFrac(s3)}`,
      fields: [F(s1, "\\Sigma r"), F(s2, "\\Sigma r_ir_j"), F(s3, "\\Pi r")],
    };
  }
  const first = rs[0];
  const q = ruffiniRow(p, first).slice(0, -1);
  return {
    key: `pq${lv}:${p.map(texFrac).join(",")}`,
    ask: ["mpr_pdRoots", "Find all the roots (they are rational)"],
    tex: polyTex(p) + " = 0", unordered: true,
    steps: [
      lv === 1 ? `x \\in \\{\\pm p\\},\\ p \\mid ${texFrac(p[3])}` : `x \\in \\{\\pm\\tfrac{p}{q}\\}:\\ p \\mid ${texFrac(p[3])},\\ q \\mid ${lead}`,
      `p(${texFrac(first)}) = 0:\\ ${device(p, first)}`,
      `${polyTex(q)} = 0 \\;\\Rightarrow\\; x = ${texFrac(rs[1])},\\ ${texFrac(rs[2])}`,
      `x = ${amber(rs.map(texFrac).join(",\\ "))}`,
    ],
    short: rs.map(texFrac).join(",\\ "),
    fields: rs.map((x, i) => F(x, `x_${i + 1}`)),
  };
};
