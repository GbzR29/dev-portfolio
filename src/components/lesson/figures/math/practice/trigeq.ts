// ── Practice generators: trigonometric equations ──────────────────────────────
// Every answer is an angle in degrees with 0° ≤ x < 360°, one box per
// solution, typed in any order. The right-hand side is always an exact value
// (0, ±1/2, ±√2/2, ±√3/2, ±1; for tan 0, ±√3/3, ±1, ±√3), so the solutions
// are whole (or half) degrees. Angles are kept as integers in half-degrees,
// which makes the multiple-angle case (sin 2x = c) exact too.

import { fr } from "./frac";
import { pick, ri, type Field, type Gen, type Level, type Problem } from "./problem";

type Fn = "sin" | "cos" | "tan";
/** An exact value: its TeX, its number, and the principal angle in degrees. */
type Val = { tex: string; v: number; deg: number };

const SQ2 = "\\frac{\\sqrt{2}}{2}", SQ3 = "\\frac{\\sqrt{3}}{2}";
const SIN_VALS: Val[] = [
  { tex: "0", v: 0, deg: 0 }, { tex: "\\frac{1}{2}", v: 0.5, deg: 30 }, { tex: SQ2, v: Math.SQRT1_2, deg: 45 },
  { tex: SQ3, v: Math.sqrt(3) / 2, deg: 60 }, { tex: "1", v: 1, deg: 90 },
  { tex: "-\\frac{1}{2}", v: -0.5, deg: -30 }, { tex: `-${SQ2}`, v: -Math.SQRT1_2, deg: -45 },
  { tex: `-${SQ3}`, v: -Math.sqrt(3) / 2, deg: -60 }, { tex: "-1", v: -1, deg: -90 },
];
/** cos x = c: the principal angle is arccos c, in [0°, 180°]. */
const COS_VALS: Val[] = SIN_VALS.map(s => ({ ...s, deg: 90 - s.deg }));
const TAN_VALS: Val[] = [
  { tex: "0", v: 0, deg: 0 }, { tex: "\\frac{\\sqrt{3}}{3}", v: 1 / Math.sqrt(3), deg: 30 }, { tex: "1", v: 1, deg: 45 },
  { tex: "\\sqrt{3}", v: Math.sqrt(3), deg: 60 }, { tex: "-\\frac{\\sqrt{3}}{3}", v: -1 / Math.sqrt(3), deg: -30 },
  { tex: "-1", v: -1, deg: -45 }, { tex: "-\\sqrt{3}", v: -Math.sqrt(3), deg: -60 },
];
const VALS: Record<Fn, Val[]> = { sin: SIN_VALS, cos: COS_VALS, tan: TAN_VALS };
const INV: Record<Fn, string> = { sin: "\\arcsin", cos: "\\arccos", tan: "\\arctan" };

const amber = (s: string) => `\\amber{${s}}`;
const mod = (a: number, m: number) => ((a % m) + m) % m;
/** Half-degrees → "22.5^\circ". */
const dg = (h: number) => `${h % 2 ? (h / 2).toFixed(1) : h / 2}^\\circ`;

/** All u in [0°, 360°·n) with f(u) = c, as half-degrees, sorted. */
function solveU(fn: Fn, deg: number, n = 1): number[] {
  const a = 2 * deg, full = 720 * n, period = fn === "tan" ? 360 : 720;
  const fams = fn === "sin" ? [a, 360 - a] : fn === "cos" ? [a, -a] : [a];
  const out = new Set<number>();
  for (const f of fams) for (let u = mod(f, period); u < full; u += period) out.add(u);
  return [...out].sort((x, y) => x - y);
}

/** The two families, in TeX: x = α + 360°k and x = 180° − α + 360°k (or the cos/tan versions). */
function families(fn: Fn, deg: number, v = "x") {
  const a = `${deg}^\\circ`;
  if (fn === "tan") return `${v} = ${a} + 180^\\circ k`;
  if (fn === "sin") return deg === 90 || deg === -90
    ? `${v} = ${a} + 360^\\circ k`
    : `${v} = ${a} + 360^\\circ k \\quad\\text{or}\\quad ${v} = 180^\\circ - ${deg < 0 ? `(${a})` : a} + 360^\\circ k`;
  return deg === 0 || deg === 180 ? `${v} = ${a} + 360^\\circ k` : `${v} = \\pm ${a} + 360^\\circ k`;
}

const fields = (hs: number[]): Field[] => hs.map((h, i) => ({
  label: hs.length > 1 ? `x_${i + 1}` : "x", suffix: "°", answer: { kind: "num", value: fr(h, 2) },
}));
const list = (hs: number[]) => hs.map(dg).join(",\\ ");
const ASK: [string, string] = ["mpr_teqAll", "Find every solution with 0° ≤ x < 360°"];

// ── Basic equations: f(x) = c, a·f(x) + b = d, and f(2x) = c ──
export const trigBasic: Gen = (lv: Level): Problem => {
  const fn: Fn = lv === 1 ? pick(["sin", "cos"] as const) : pick(["sin", "cos", "tan"] as const);
  const val = pick(VALS[fn]);
  const f = `\\${fn}`;
  const head = [`\\alpha = ${INV[fn]}\\left(${val.tex}\\right) = ${val.deg}^\\circ`, families(fn, val.deg)];

  if (lv === 3 && fn !== "tan" && val.deg % 45 !== 0) {
    // f(2x) = c: solve for u = 2x over two turns, then halve
    const us = solveU(fn, val.deg, 2), xs = us.map(u => u / 2);
    return {
      key: `tb3:${fn}:${val.deg}`, ask: ASK, tex: `${f}\\,2x = ${val.tex}`, unordered: true,
      steps: [
        `u = 2x, \\quad 0^\\circ \\le u < 720^\\circ`,
        head[0], families(fn, val.deg, "u"),
        `u = ${list(us)}`,
        `x = \\tfrac{u}{2} = ${amber(list(xs))}`,
      ],
      short: list(xs), fields: fields(xs),
    };
  }
  const xs = solveU(fn, val.deg);
  if (lv === 1) {
    return {
      key: `tb1:${fn}:${val.deg}`, ask: ASK, tex: `${f} x = ${val.tex}`, unordered: true,
      steps: [...head, `${amber(list(xs))}`],
      short: list(xs), fields: fields(xs),
    };
  }
  // a·f(x) + b = d with a value that needs isolating first; only the "nice"
  // rational values (0, ±1/2, ±1 for sin/cos; 0, ±1 for tan) are written this way
  const nice = VALS[fn].filter(w => !w.tex.includes("sqrt"));
  const w = pick(nice), a = pick([2, 3, 4]), b = ri(-5, 5);
  const rhsN = a * w.v + b;                              // a·c + b, a whole or half number
  const rhs = Number.isInteger(rhsN) ? `${rhsN}` : `${rhsN < 0 ? "-" : ""}\\frac{${Math.abs(2 * rhsN)}}{2}`;
  const ws = solveU(fn, w.deg);
  return {
    key: `tb2:${fn}:${w.deg}:${a}:${b}`, ask: ASK,
    tex: `${a}${f} x ${b < 0 ? `- ${-b}` : b > 0 ? `+ ${b}` : ""} = ${rhs}`, unordered: true,
    steps: [
      `${a}${f} x = ${rhs} ${b < 0 ? `+ ${-b}` : b > 0 ? `- ${b}` : ""} \\;\\Rightarrow\\; ${f} x = ${w.tex}`,
      `\\alpha = ${INV[fn]}\\left(${w.tex}\\right) = ${w.deg}^\\circ`, families(fn, w.deg),
      `${amber(list(ws))}`,
    ],
    short: list(ws), fields: fields(ws),
  };
};

// ── Quadratics in sin x or cos x ──
// Two roots s₁, s₂ (as halves) give (d₁s − n₁)(d₂s − n₂) = 0 with whole
// coefficients. A root outside [−1, 1] gives no angle. Level 3 writes the
// equation with cos²x, which has to be replaced by 1 − sin²x first.
const ROOTS = [-2, -1, -0.5, 0, 0.5, 1, 2, 3];
const ROOT_TEX: Record<string, string> = { "-0.5": "-\\frac{1}{2}", "0.5": "\\frac{1}{2}" };
const rootTex = (r: number) => ROOT_TEX[String(r)] ?? String(r);
/** Coefficients of a(s − r₁)(s − r₂), scaled to whole numbers. */
function quad(r1: number, r2: number) {
  const [n1, d1] = Number.isInteger(r1) ? [r1, 1] : [2 * r1, 2];
  const [n2, d2] = Number.isInteger(r2) ? [r2, 1] : [2 * r2, 2];
  return { A: d1 * d2, B: -(d1 * n2 + d2 * n1), C: n1 * n2, f1: [d1, n1], f2: [d2, n2] };
}
/** "3s^2 - 2s + 1" with s → the given TeX. */
function poly(A: number, B: number, C: number, s: string, s2 = `${s}^2`) {
  const term = (c: number, v: string, first: boolean) => {
    if (c === 0) return "";
    const abs = Math.abs(c), co = abs === 1 && v ? "" : `${abs}`;
    return `${first ? (c < 0 ? "-" : "") : c < 0 ? " - " : " + "}${co}${v}`;
  };
  const a = term(A, s2, true);
  return `${a}${term(B, s, !a)}${term(C, "", !a && !B)}` || "0";
}
const factor = ([d, n]: number[], s: string) => (d === 1 ? (n === 0 ? s : `(${s} ${n < 0 ? "+" : "-"} ${Math.abs(n)})`) : `(${d}${s} ${n < 0 ? "+" : "-"} ${Math.abs(n)})`);

export const trigQuadratic: Gen = (lv: Level): Problem => {
  const fn: Fn = lv === 3 ? "sin" : pick(["sin", "cos"] as const);
  const ok = (r: number) => r >= -1 && r <= 1;
  let r1 = 0, r2 = 0;
  for (;;) {
    r1 = pick(ROOTS); r2 = pick(ROOTS);
    if (r1 === r2 || !ok(r1)) continue;
    if (lv === 3 && quad(r1, r2).B === 0) continue;       // keep the sin x term: the equation really mixes sin and cos
    if (lv === 1 && !ok(r2)) continue;                    // level 1: both roots give angles
    if (lv === 2 && ok(r2) && Math.random() < 0.6) continue; // level 2: usually one root is out of range
    break;
  }
  const { A, B, C, f1, f2 } = quad(r1, r2);
  const s = `\\${fn} x`, s2 = `\\${fn}^2 x`;
  const hs = [...new Set([r1, r2].filter(ok).flatMap(r => solveU(fn, Math.round((fn === "sin" ? Math.asin(r) : Math.acos(r)) * 180 / Math.PI))))].sort((x, y) => x - y);
  const lines: string[] = [];
  let tex = `${poly(A, B, C, s, s2)} = 0`;
  if (lv === 3) {
    // A sin² + B sin + C = 0  ⇔  −A cos² + B sin + (C + A) = 0
    tex = `${poly(-A, B, C + A, s, "\\cos^2 x")} = 0`;
    lines.push(`\\cos^2 x = 1 - \\sin^2 x \\;\\Rightarrow\\; ${poly(A, B, C, s, s2)} = 0`);
  }
  lines.push(`${factor(f1, "s")}\\,${factor(f2, "s")} = 0, \\quad s = ${s}`);
  lines.push(`s = ${rootTex(r1)} \\quad\\text{or}\\quad s = ${rootTex(r2)}${ok(r2) ? "" : ` \\;(|${rootTex(r2)}| > 1:\\ \\varnothing)`}`);
  lines.push(amber(list(hs)));
  return {
    key: `tq${lv}:${fn}:${r1}:${r2}`, ask: ASK, tex, unordered: true,
    steps: lines, short: list(hs), fields: fields(hs),
  };
};
