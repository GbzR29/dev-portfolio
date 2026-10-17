// ── Practice generators: partial differential equations ──────────────────────
// Decay rates of heat modes (k = αn², and k/π² = αn²/L² on a rod of length L),
// the steady temperature of a rod, frequencies of wave modes (ω = cn, and
// fₙ = nc/(2L) in Hz), d'Alembert's two half-bumps, and the explicit grid
// step uᵢ + r(uᵢ₋₁ − 2uᵢ + uᵢ₊₁) with its stability limit Δt ≤ Δx²/(2α).
// Every answer is an exact fraction.

import { add, fr, mul, type Frac } from "./frac";
import { pick, ri, type Field, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const F = (x: Frac | number, label = ""): Field => ({ label, answer: { kind: "num", value: typeof x === "number" ? fr(x) : x } });
const tf = (a: Frac) => (a.d === 1 ? `${a.n}` : `${a.n < 0 ? "-" : ""}\\tfrac{${Math.abs(a.n)}}{${a.d}}`);
const par = (v: number) => (v < 0 ? `(${v})` : `${v}`);
const coef = (a: Frac) => (a.n === a.d ? "" : tf(a));

// ── Heat ──
export const pdeHeat: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const a = pick([fr(1), fr(2), fr(3), fr(1, 2), fr(1, 4)]), m = ri(1, 4), k = mul(a, fr(m * m));
    return {
      key: `ph1:${a.n}/${a.d}:${m}`, ask: ["mpr_pdeK", "u = e^(−kt) sin(nx) solves the heat equation. Find k"],
      tex: `u_t = ${coef(a)}\\,u_{xx},\\qquad u = e^{-kt}\\sin ${m === 1 ? "" : m}x`,
      steps: [`u_t = -k\\,u,\\quad u_{xx} = -${m * m}\\,u`, `-k = ${coef(a) || "1"} \\cdot (-${m * m}) \\Rightarrow k = ${amber(tf(k))}`],
      short: tf(k), fields: [F(k, "k")],
    };
  }
  if (lv === 2) {
    const a = ri(1, 4), L = ri(1, 4), m = ri(1, 4), v = fr(a * m * m, L * L);
    return {
      key: `ph2:${a}:${L}:${m}`, ask: ["mpr_pdeKpi", "Mode n of a rod of length L decays like e^(−kt). Find k/π²"],
      tex: `u_t = ${a === 1 ? "" : a}\\,u_{xx},\\quad L = ${L},\\quad n = ${m}`,
      steps: [`k = \\alpha\\left(\\tfrac{n\\pi}{L}\\right)^2 = ${a} \\cdot \\tfrac{${m * m}\\pi^2}{${L * L}}`, `\\tfrac{k}{\\pi^2} = ${amber(tf(v))}`],
      short: tf(v), fields: [F(v, "k/\\pi^2")],
    };
  }
  // steady state: the straight line between the end temperatures
  const A = ri(0, 40) * 5, B = ri(0, 40) * 5, L = pick([2, 4, 5, 10]), x = ri(1, L - 1), v = add(fr(A), fr((B - A) * x, L));
  return {
    key: `ph3:${A}:${B}:${L}:${x}`, ask: ["mpr_pdeSteady", "The ends of the rod are held at fixed temperatures. Find the steady temperature at x"],
    tex: `u(0) = ${A},\\quad u(${L}) = ${B},\\quad x = ${x}`,
    steps: [`u_{xx} = 0 \\Rightarrow u = ${A} + \\tfrac{${B - A}}{${L}}\\,x`, `u(${x}) = ${A} + \\tfrac{${(B - A) * x}}{${L}} = ${amber(tf(v))}`],
    short: tf(v), fields: [F(v, `u(${x})`)],
  };
};

// ── Waves ──
export const pdeWave: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const c = ri(1, 6), m = ri(1, 5);
    return {
      key: `pw1:${c}:${m}`, ask: ["mpr_pdeOmega", "u = sin(nx) cos(ωt) solves the wave equation. Find ω > 0"],
      tex: `u_{tt} = ${c * c === 1 ? "" : c * c}\\,u_{xx},\\qquad u = \\sin ${m === 1 ? "" : m}x\\,\\cos \\omega t`,
      steps: [`u_{tt} = -\\omega^2 u,\\quad u_{xx} = -${m * m}\\,u`, `\\omega^2 = ${c * c} \\cdot ${m * m} \\Rightarrow \\omega = ${amber(c * m)}`],
      short: `${c * m}`, fields: [F(c * m, "\\omega")],
    };
  }
  if (lv === 2) {
    const L = pick([1, 2, 4, 5]), c = pick([100, 200, 300, 340, 400]), m = ri(1, 5), f = fr(m * c, 2 * L);
    return {
      key: `pw2:${L}:${c}:${m}`, ask: ["mpr_pdeHz", "A string of length L (m) carries waves at speed c (m/s). Find the frequency of mode n in Hz"],
      tex: `L = ${L},\\quad c = ${c},\\quad n = ${m}`,
      steps: [`f_n = \\tfrac{nc}{2L} = \\tfrac{${m} \\cdot ${c}}{${2 * L}}`, `= ${amber(tf(f))}`],
      short: tf(f), fields: [F(f, `f_{${m}}`)],
    };
  }
  // d'Alembert: a bump at x₀ released from rest splits into x₀ ± ct
  const x0 = ri(-5, 5), c = ri(1, 4), t = ri(1, 4);
  return {
    key: `pw3:${x0}:${c}:${t}`, ask: ["mpr_pdeDal", "A bump centred at x₀ is released from rest on a long string. Where are the centres of the two halves at time t?"],
    tex: `x_0 = ${x0},\\quad c = ${c},\\quad t = ${t}`,
    steps: [`u = \\tfrac12 f(x - ct) + \\tfrac12 f(x + ct)`, `x_0 \\pm ct = ${x0} \\pm ${c * t} \\Rightarrow ${amber(x0 - c * t)},\\ ${amber(x0 + c * t)}`],
    short: `${x0 - c * t},\\ ${x0 + c * t}`, fields: [F(x0 - c * t), F(x0 + c * t)], unordered: true,
  };
};

// ── The grid ──
export const pdeGrid: Gen = (lv: Level): Problem => {
  const r = pick([fr(1, 4), fr(1, 2), fr(1, 3), fr(1, 5)]);
  if (lv === 1) {
    const a = ri(-4, 8), b = ri(-4, 8), c = ri(-4, 8), d = a - 2 * b + c, v = add(fr(b), mul(r, fr(d)));
    return {
      key: `pg1:${r.n}/${r.d}:${a}:${b}:${c}`, ask: ["mpr_pdeStep", "Do one explicit step of the heat equation at the middle point"],
      tex: `r = ${tf(r)},\\qquad u_{i-1}, u_i, u_{i+1} = ${a},\\ ${b},\\ ${c}`,
      steps: [`u_{i-1} - 2u_i + u_{i+1} = ${a} - ${2 * b} + ${par(c)} = ${d}`, `u_i^{\\text{new}} = ${b} + ${tf(r)} \\cdot ${par(d)} = ${amber(tf(v))}`],
      short: tf(v), fields: [F(v, "u_i^{\\text{new}}")],
    };
  }
  if (lv === 2) {
    // three interior points between fixed zero ends
    const u = [0, ri(0, 6), ri(0, 6), ri(0, 6), 0];
    const out = [1, 2, 3].map(i => add(fr(u[i]), mul(r, fr(u[i - 1] - 2 * u[i] + u[i + 1]))));
    return {
      key: `pg2:${r.n}/${r.d}:${u.join(",")}`, ask: ["mpr_pdeStep3", "The ends stay at 0. Do one explicit step for the three inside points"],
      tex: `r = ${tf(r)},\\qquad u = (0,\\ ${u[1]},\\ ${u[2]},\\ ${u[3]},\\ 0)`,
      steps: [1, 2, 3].map((i, k) => `u_${i} \\to ${u[i]} + ${tf(r)}(${u[i - 1]} - ${2 * u[i]} + ${u[i + 1]}) = ${amber(tf(out[k]))}`),
      short: out.map(tf).join(",\\ "), fields: out.map((v, k) => F(v, `u_${k + 1}`)),
    };
  }
  // the largest stable time step
  const a = pick([fr(1), fr(2), fr(1, 2), fr(4)]), dx = pick([fr(1, 2), fr(1, 4), fr(1, 10), fr(1, 5)]);
  const dt = mul(mul(dx, dx), fr(a.d, 2 * a.n));
  return {
    key: `pg3:${a.n}/${a.d}:${dx.n}/${dx.d}`, ask: ["mpr_pdeDt", "Find the largest time step for which the explicit scheme is stable"],
    tex: `u_t = ${coef(a) || ""}\\,u_{xx},\\qquad \\Delta x = ${tf(dx)}`,
    steps: [`r = \\tfrac{\\alpha\\,\\Delta t}{\\Delta x^2} \\le \\tfrac12 \\Rightarrow \\Delta t \\le \\tfrac{\\Delta x^2}{2\\alpha}`, `\\Delta t = \\tfrac{${tf(mul(dx, dx))}}{2 \\cdot ${tf(a)}} = ${amber(tf(dt))}`],
    short: tf(dt), fields: [F(dt, "\\Delta t")],
  };
};
