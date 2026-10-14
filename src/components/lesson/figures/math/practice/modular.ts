// ── Practice generators: modular arithmetic ───────────────────────────────────
// Reducing sums and products mod n, powers mod n by their cycle, and inverses
// and linear congruences. Same rule as the other generators: the answer is
// chosen or computed first and the worked lines come from the same numbers.

import { fr } from "./frac";
import { nz, pick, ri, type Gen, type Level, type Problem } from "./problem";

const mod = (a: number, n: number) => ((a % n) + n) % n;
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const amber = (s: string | number) => `\\amber{${s}}`;
const num = (x: number) => ({ label: "", answer: { kind: "num" as const, value: fr(x) } });
const pmod = (n: number) => `\\pmod{${n}}`;

// ── Reducing ──
export const modReduce: Gen = (lv: Level): Problem => {
  const n = lv === 1 ? ri(3, 12) : ri(5, 13);
  if (lv === 1) {
    const a = ri(20, 250), q = Math.floor(a / n), r = a % n;
    return {
      key: `mr:${a}:${n}`, ask: ["mpr_modReduce", "Find the remainder mod n (between 0 and n − 1)"], tex: `${a} \\bmod ${n}`,
      steps: [`${a} = ${q} \\times ${n} + ${r}`, `${a} \\equiv ${amber(r)} ${pmod(n)}`], short: `${r}`, fields: [num(r)],
    };
  }
  if (lv === 2) {
    const a = ri(30, 199), b = ri(30, 199), c = ri(10, 99), ra = a % n, rb = b % n, rc = c % n, ans = mod(ra * rb + rc, n);
    return {
      key: `mr2:${a}:${b}:${c}:${n}`, ask: ["mpr_modReduce", "Find the remainder mod n (between 0 and n − 1)"], tex: `(${a} \\cdot ${b} + ${c}) \\bmod ${n}`,
      steps: [`${a} \\equiv ${ra},\\quad ${b} \\equiv ${rb},\\quad ${c} \\equiv ${rc} ${pmod(n)}`, `${ra} \\cdot ${rb} + ${rc} = ${ra * rb + rc}`, `${ra * rb + rc} \\equiv ${amber(ans)} ${pmod(n)}`],
      short: `${ans}`, fields: [num(ans)],
    };
  }
  const a = ri(10, 99), ans = mod(-a, n), q = Math.floor(-a / n);
  return {
    key: `mr3:${a}:${n}`, ask: ["mpr_modReduce", "Find the remainder mod n (between 0 and n − 1)"], tex: `-${a} \\bmod ${n}`,
    steps: [`-${a} = (${q}) \\times ${n} + ${ans}`, `-${a} \\equiv ${amber(ans)} ${pmod(n)}`],
    short: `${ans}`, fields: [num(ans)],
  };
};

// ── Powers ──
/** The powers a¹, a², … mod n until the value returns to a¹ (gcd(a, n) = 1). */
function cycleOf(a: number, n: number) {
  const out = [mod(a, n)];
  for (let x = mod(a * a, n); x !== out[0] && out.length < n; x = mod(x * a, n)) out.push(x);
  return out;
}

export const modPower: Gen = (lv: Level): Problem => {
  for (;;) {
    const n = lv === 1 ? 10 : lv === 2 ? pick([5, 7, 11, 13]) : ri(6, 15);
    const a = lv === 1 ? pick([2, 3, 7, 9, 13, 17]) : ri(2, n - 1), k = lv === 1 ? ri(12, 99) : ri(20, 200);
    if (gcd(a, n) !== 1) continue;
    const cyc = cycleOf(a, n), L = cyc.length, r = k % L, ans = cyc[(r + L - 1) % L];
    const list = cyc.map((v, i) => `${a}^{${i + 1}} \\equiv ${v}`).join(",\\ ");
    return {
      key: `mp:${a}:${k}:${n}`, ask: lv === 1 ? ["mpr_modLast", "Find the last digit"] : ["mpr_modPow", "Find the remainder mod n"],
      tex: lv === 1 ? `${a}^{${k}}` : `${a}^{${k}} \\bmod ${n}`,
      steps: [
        `${list} \\ ${pmod(n)}`,
        `${k} = ${Math.floor(k / L)} \\times ${L} + ${r}`,
        r === 0 ? `${a}^{${k}} = (${a}^{${L}})^{${k / L}} \\equiv 1^{${k / L}} = ${amber(ans)} ${pmod(n)}` : `${a}^{${k}} = (${a}^{${L}})^{${Math.floor(k / L)}} \\cdot ${a}^{${r}} \\equiv ${a}^{${r}} \\equiv ${amber(ans)} ${pmod(n)}`,
      ],
      short: `${ans}`, fields: [num(ans)],
    };
  }
};

// ── Inverses and linear congruences ──
export const modInverse: Gen = (lv: Level): Problem => {
  for (;;) {
    const n = lv === 1 ? pick([5, 7, 9, 11]) : pick([7, 11, 13, 17, 19, 26]), a = ri(2, n - 1);
    if (gcd(a, n) !== 1) continue;
    let inv = 1;
    while (mod(a * inv, n) !== 1) inv++;
    if (lv < 3) return {
      key: `mi:${a}:${n}`, ask: ["mpr_modInv", "Find x between 0 and n − 1"], tex: `${a}x \\equiv 1 ${pmod(n)}`,
      steps: [`${a} \\cdot ${inv} = ${a * inv} = ${Math.floor((a * inv) / n)} \\times ${n} + 1`, `x \\equiv ${amber(inv)} ${pmod(n)}`],
      short: `${inv}`, fields: [num(inv)],
    };
    const b = nz(1, n - 1), x = mod(inv * b, n);
    return {
      key: `ml:${a}:${b}:${n}`, ask: ["mpr_modInv", "Find x between 0 and n − 1"], tex: `${a}x \\equiv ${b} ${pmod(n)}`,
      steps: [`${a}^{-1} \\equiv ${inv} \\quad (${a} \\cdot ${inv} = ${a * inv} \\equiv 1)`, `x \\equiv ${inv} \\cdot ${b} = ${inv * b}`, `x \\equiv ${amber(x)} ${pmod(n)}`],
      short: `${x}`, fields: [num(x)],
    };
  }
};
