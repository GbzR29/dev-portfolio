// ── Practice generators: counting with sets ───────────────────────────────────
// Inclusion–exclusion from given sizes (two and three sets), multiples up to N
// (⌊N/a⌋ + ⌊N/b⌋ − ⌊N/lcm⌋, or the complement), and sizes of power sets and
// cartesian products. The sizes are chosen so that every region of the Venn
// diagram is non-negative.

import { fr } from "./frac";
import { pick, ri, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const num = (x: number) => ({ label: "", answer: { kind: "num" as const, value: fr(x) } });
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

// ── Inclusion–exclusion from sizes ──
export const setUnion: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const both = ri(1, 15), a = both + ri(1, 25), b = both + ri(1, 25), u = a + b - both;
    return {
      key: `su1:${a}:${b}:${both}`, ask: ["mpr_setUnion", "Find the size asked for"],
      tex: `|A| = ${a},\\ |B| = ${b},\\ |A \\cap B| = ${both} \\qquad |A \\cup B| = \\,?`,
      steps: [`|A \\cup B| = |A| + |B| - |A \\cap B|`, `= ${a} + ${b} - ${both} = ${amber(u)}`],
      short: `${u}`, fields: [num(u)],
    };
  }
  if (lv === 2) {
    const both = ri(1, 15), a = both + ri(1, 25), b = both + ri(1, 25), u = a + b - both, total = u + ri(0, 20);
    const neither = total - u;
    return {
      key: `su2:${a}:${b}:${both}:${total}`, ask: ["mpr_setNeither", "How many are in neither set?"],
      tex: `|U| = ${total},\\ |A| = ${a},\\ |B| = ${b},\\ |A \\cap B| = ${both} \\qquad |(A \\cup B)^c| = \\,?`,
      steps: [`|A \\cup B| = ${a} + ${b} - ${both} = ${u}`, `|(A \\cup B)^c| = |U| - |A \\cup B| = ${total} - ${u} = ${amber(neither)}`],
      short: `${neither}`, fields: [num(neither)],
    };
  }
  // three sets: build the 7 regions, then report the sums
  const r = Array.from({ length: 7 }, () => ri(0, 9));        // only A, only B, only C, AB, AC, BC, ABC
  const A = r[0] + r[3] + r[4] + r[6], B = r[1] + r[3] + r[5] + r[6], Cc = r[2] + r[4] + r[5] + r[6];
  const AB = r[3] + r[6], AC = r[4] + r[6], BC = r[5] + r[6], ABC = r[6], u = r.reduce((x, y) => x + y, 0);
  return {
    key: `su3:${r.join(":")}`, ask: ["mpr_setUnion", "Find the size asked for"],
    tex: `|A|=${A},\\ |B|=${B},\\ |C|=${Cc},\\ |A\\cap B|=${AB},\\ |A\\cap C|=${AC},\\ |B\\cap C|=${BC},\\ |A\\cap B\\cap C|=${ABC} \\qquad |A\\cup B\\cup C| = \\,?`,
    steps: [
      `|A\\cup B\\cup C| = |A|+|B|+|C| - |A\\cap B| - |A\\cap C| - |B\\cap C| + |A\\cap B\\cap C|`,
      `= ${A} + ${B} + ${Cc} - ${AB} - ${AC} - ${BC} + ${ABC} = ${amber(u)}`,
    ],
    short: `${u}`, fields: [num(u)],
  };
};

// ── Multiples up to N ──
export const setMultiples: Gen = (lv: Level): Problem => {
  const N = lv === 1 ? pick([20, 30, 50, 60, 100]) : ri(50, 500);
  let a = 0, b = 0;
  do { a = ri(2, lv === 1 ? 5 : 9); b = ri(2, lv === 1 ? 5 : 12); } while (a >= b || b % a === 0);
  const l = (a * b) / gcd(a, b), na = Math.floor(N / a), nb = Math.floor(N / b), nl = Math.floor(N / l), u = na + nb - nl;
  const neither = lv === 3;
  const ans = neither ? N - u : u;
  return {
    key: `sm:${N}:${a}:${b}:${neither}`,
    ask: neither ? ["mpr_setMultNone", "How many of 1, …, N are divisible by neither a nor b?"] : ["mpr_setMult", "How many of 1, …, N are divisible by a or by b?"],
    tex: `N = ${N},\\quad a = ${a},\\quad b = ${b}`,
    steps: [
      `\\left\\lfloor \\tfrac{${N}}{${a}} \\right\\rfloor = ${na},\\quad \\left\\lfloor \\tfrac{${N}}{${b}} \\right\\rfloor = ${nb},\\quad \\operatorname{lcm} = ${l}:\\ \\left\\lfloor \\tfrac{${N}}{${l}} \\right\\rfloor = ${nl}`,
      `${na} + ${nb} - ${nl} = ${neither ? u : amber(u)}`,
      ...(neither ? [`${N} - ${u} = ${amber(ans)}`] : []),
    ],
    short: `${ans}`, fields: [num(ans)],
  };
};

// ── Power sets and products ──
export const setSizes: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const n = ri(2, 10), ans = 2 ** n;
    return {
      key: `sp:${n}`, ask: ["mpr_setPower", "How many subsets does a set with n elements have?"], tex: `|A| = ${n} \\qquad |\\mathcal{P}(A)| = \\,?`,
      steps: [`|\\mathcal{P}(A)| = 2^{|A|}`, `2^{${n}} = ${amber(ans)}`], short: `${ans}`, fields: [num(ans)],
    };
  }
  if (lv === 2) {
    const a = ri(2, 12), b = ri(2, 12), c = ri(2, 6), ans = a * b * c;
    return {
      key: `sx:${a}:${b}:${c}`, ask: ["mpr_setProd", "How many elements does the product have?"], tex: `|A| = ${a},\\ |B| = ${b},\\ |C| = ${c} \\qquad |A \\times B \\times C| = \\,?`,
      steps: [`|A \\times B \\times C| = |A|\\,|B|\\,|C|`, `${a} \\cdot ${b} \\cdot ${c} = ${amber(ans)}`], short: `${ans}`, fields: [num(ans)],
    };
  }
  const n = ri(4, 10), k = ri(1, n - 1);
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return {
    key: `sk:${n}:${k}`, ask: ["mpr_setK", "How many subsets have exactly k elements?"], tex: `|A| = ${n},\\quad k = ${k}`,
    steps: [`\\binom{n}{k} = \\frac{n!}{k!\\,(n-k)!}`, `\\binom{${n}}{${k}} = ${amber(c)}`], short: `${c}`, fields: [num(c)],
  };
};
