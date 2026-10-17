// ── Practice generators: summation ────────────────────────────────────────────
// Closed forms with linearity (Σk, Σk², constants), telescoping sums of
// 1/(k(k + 1)) and friends, and finite geometric sums. Same rule as the other
// generators: every number is an exact fraction, and the worked lines are
// built from the same numbers as the answer.

import { add, div, fr, mul, pow, sub, texFrac, type Frac } from "./frac";
import { nz, pick, ri, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const num = (x: Frac) => ({ label: "", answer: { kind: "num" as const, value: x } });
const S1 = (n: number) => (n * (n + 1)) / 2;
const S2 = (n: number) => (n * (n + 1) * (2 * n + 1)) / 6;
/** "+ 3", "- 3" for a coefficient after the first term. */
const signed = (c: number) => (c < 0 ? `- ${-c}` : `+ ${c}`);
const sum = (lo: number | string, hi: number | string, body: string) => `\\sum_{k=${lo}}^{${hi}} ${body}`;

// ── Closed forms and linearity ──
export const sumClosed: Gen = (lv: Level): Problem => {
  const ask: [string, string] = ["mpr_sumEval", "Find the value of the sum"];
  if (lv === 1) {
    const n = ri(8, 60), ans = S1(n);
    return {
      key: `sc1:${n}`, ask, tex: sum(1, n, "k"),
      steps: [`\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}`, `\\frac{${n} \\cdot ${n + 1}}{2} = ${amber(ans)}`],
      short: `${ans}`, fields: [num(fr(ans))],
    };
  }
  if (lv === 2) {
    const n = ri(5, 30), a = nz(-5, 9), b = nz(-9, 9), ans = a * S1(n) + b * n;
    return {
      key: `sc2:${n}:${a}:${b}`, ask, tex: sum(1, n, `(${a}k ${signed(b)})`),
      steps: [
        `= ${a}\\sum_{k=1}^{${n}} k ${signed(b)} \\cdot ${n}`,
        `= ${a} \\cdot ${S1(n)} ${signed(b * n)}`,
        `= ${amber(ans)}`,
      ],
      short: `${ans}`, fields: [num(fr(ans))],
    };
  }
  const n = ri(4, 15), a = nz(-3, 4), b = ri(-6, 6), c = ri(-9, 9);
  const ans = a * S2(n) + b * S1(n) + c * n;
  const body = `${a === 1 ? "" : a === -1 ? "-" : a}k^2${b ? ` ${signed(b)}k` : ""}${c ? ` ${signed(c)}` : ""}`;
  return {
    key: `sc3:${n}:${a}:${b}:${c}`, ask, tex: sum(1, n, `(${body})`),
    steps: [
      `\\sum k^2 = \\frac{n(n+1)(2n+1)}{6} = \\frac{${n} \\cdot ${n + 1} \\cdot ${2 * n + 1}}{6} = ${S2(n)}, \\quad \\sum k = ${S1(n)}`,
      `= ${a} \\cdot ${S2(n)}${b ? ` ${signed(b)} \\cdot ${S1(n)}` : ""}${c ? ` ${signed(c)} \\cdot ${n}` : ""}`,
      `= ${amber(ans)}`,
    ],
    short: `${ans}`, fields: [num(fr(ans))],
  };
};

// ── Telescoping ──
export const sumTelescope: Gen = (lv: Level): Problem => {
  const ask: [string, string] = ["mpr_sumTele", "Find the value (a fraction is fine)"];
  if (lv === 1) {
    const n = ri(3, 40), ans = fr(n, n + 1);
    return {
      key: `st1:${n}`, ask, tex: sum(1, n, "\\frac{1}{k(k+1)}"),
      steps: [
        `\\frac{1}{k(k+1)} = \\frac1k - \\frac{1}{k+1}`,
        `\\left(1 - \\tfrac12\\right) + \\left(\\tfrac12 - \\tfrac13\\right) + \\dots + \\left(\\tfrac{1}{${n}} - \\tfrac{1}{${n + 1}}\\right)`,
        `= 1 - \\frac{1}{${n + 1}} = ${amber(texFrac(ans))}`,
      ],
      short: texFrac(ans), fields: [num(ans)],
    };
  }
  if (lv === 2) {
    const m = ri(2, 9), n = ri(m + 2, m + 30), ans = sub(fr(1, m), fr(1, n + 1));
    return {
      key: `st2:${m}:${n}`, ask, tex: sum(m, n, "\\frac{1}{k(k+1)}"),
      steps: [
        `\\frac{1}{k(k+1)} = \\frac1k - \\frac{1}{k+1}`,
        `\\left(\\tfrac{1}{${m}} - \\tfrac{1}{${m + 1}}\\right) + \\dots + \\left(\\tfrac{1}{${n}} - \\tfrac{1}{${n + 1}}\\right) = \\frac{1}{${m}} - \\frac{1}{${n + 1}}`,
        `= ${amber(texFrac(ans))}`,
      ],
      short: texFrac(ans), fields: [num(ans)],
    };
  }
  // 1/(k(k + 2)) = ½(1/k − 1/(k + 2)): two pieces survive at each end
  const n = ri(3, 20);
  const ans = mul(fr(1, 2), sub(add(fr(1), fr(1, 2)), add(fr(1, n + 1), fr(1, n + 2))));
  return {
    key: `st3:${n}`, ask, tex: sum(1, n, "\\frac{1}{k(k+2)}"),
    steps: [
      `\\frac{1}{k(k+2)} = \\frac12\\left(\\frac1k - \\frac{1}{k+2}\\right)`,
      `\\frac12\\left[\\left(1 - \\tfrac13\\right) + \\left(\\tfrac12 - \\tfrac14\\right) + \\left(\\tfrac13 - \\tfrac15\\right) + \\dots + \\left(\\tfrac{1}{${n}} - \\tfrac{1}{${n + 2}}\\right)\\right]`,
      `\\frac12\\left(1 + \\frac12 - \\frac{1}{${n + 1}} - \\frac{1}{${n + 2}}\\right) = ${amber(texFrac(ans))}`,
    ],
    short: texFrac(ans), fields: [num(ans)],
  };
};

// ── Geometric sums ──
export const sumGeometric: Gen = (lv: Level): Problem => {
  const ask: [string, string] = ["mpr_sumGeo", "Find the value (a fraction is fine)"];
  const r = lv === 1 ? fr(pick([2, 3])) : lv === 2 ? fr(pick([2, 3, -2])) : fr(1, pick([2, 3]));
  const a = lv === 1 ? 1 : ri(1, 5), n = lv === 1 ? ri(3, 9) : lv === 2 ? ri(3, 7) : ri(3, 6);
  const top = sub(pow(r, n + 1), fr(1)), bottom = sub(r, fr(1));
  const fixed = mul(fr(a), div(top, bottom));
  const rt = texFrac(r), rp = r.d === 1 && r.n < 0 ? `(${rt})` : r.d === 1 ? rt : `\\left(${rt}\\right)`;
  return {
    key: `sg:${a}:${r.n}/${r.d}:${n}`, ask, tex: sum(0, n, `${a === 1 ? "" : a + " \\cdot "}${rp}^k`),
    steps: [
      `\\sum_{k=0}^{n} a r^k = a\\,\\frac{r^{n+1} - 1}{r - 1}`,
      `${a === 1 ? "" : a}\\frac{${rp}^{${n + 1}} - 1}{${rt} - 1} = ${a === 1 ? "" : a}\\frac{${texFrac(top)}}{${texFrac(bottom)}}`,
      `= ${amber(texFrac(fixed))}`,
    ],
    short: texFrac(fixed), fields: [num(fixed)],
  };
};
