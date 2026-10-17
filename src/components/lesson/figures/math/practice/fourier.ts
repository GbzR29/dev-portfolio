// ── Practice generators: Fourier series ──────────────────────────────────────
// Orthogonality integrals over [−π, π] (answers as multiples of π), reading
// coefficients off a finite trigonometric sum, the coefficients of the
// square wave, of cx and of c|x| (exact through the factor π), products like
// sin²(kx) rewritten as series, Parseval's identity and the complex
// coefficient cₙ = (aₙ − i bₙ)/2. Every answer is an exact fraction.

import { fr, mul, type Frac } from "./frac";
import { nz, pick, ri, type Field, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const F = (x: Frac | number, label = "", suffix?: string): Field => ({ label, suffix, answer: { kind: "num", value: typeof x === "number" ? fr(x) : x } });
const tf = (a: Frac) => (a.d === 1 ? `${a.n}` : `${a.n < 0 ? "-" : ""}\\tfrac{${Math.abs(a.n)}}{${a.d}}`);
const par = (v: number) => (v < 0 ? `(${v})` : `${v}`);
/** "sin 3x", "cos x". */
const wave = (k: "sin" | "cos", n: number) => `\\${k} ${n === 1 ? "" : n}x`;
/** c₁s₁ + c₂s₂ … in TeX, dropping zeros and 1s. */
function lin(parts: [number, string][]) {
  const out = parts.filter(([c]) => c !== 0).map(([c, s], i) => {
    const a = Math.abs(c), body = s && a === 1 ? s : `${a}${s}`;
    return i === 0 ? (c < 0 ? `-${body}` : body) : `${c < 0 ? "-" : "+"} ${body}`;
  });
  return out.length ? out.join(" ") : "0";
}
/** A + (waves), with the sign of the first wave tidied: "3 - 2\cos x". */
function withConst(A: number, parts: [number, string][]) {
  const w = lin(parts);
  return A === 0 ? w : `${A} ${w.startsWith("-") ? `- ${w.slice(1)}` : `+ ${w}`}`;
}

// ── Orthogonality ──
export const fouOrtho: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const k1 = pick(["sin", "cos"] as const), k2 = pick(["sin", "cos"] as const);
    const m = ri(1, 5), n = Math.random() < 0.4 ? m : ri(1, 5), p = nz(-4, 4), q = nz(-4, 4);
    const same = k1 === k2 && m === n, ans = same ? p * q : 0;
    const why = k1 !== k2 ? `\\text{sin} \\times \\text{cos} \\to 0` : same ? `\\int \\${k1}^{2} ${m === 1 ? "" : m}x\\,dx = \\pi` : `${m} \\ne ${n} \\to 0`;
    return {
      key: `fo1:${k1}${m}:${k2}${n}:${p}:${q}`, ask: ["mpr_fouOrtho", "Find the integral as a multiple of π"],
      tex: `\\int_{-\\pi}^{\\pi} ${lin([[p, wave(k1, m)]])} \\cdot ${lin([[q, wave(k2, n)]])}\\,dx`,
      steps: [`${why}`, `${p} \\cdot ${par(q)} \\cdot ${same ? "\\pi" : "0"} = ${amber(same ? `${ans}\\pi` : "0")}`],
      short: same ? `${ans}\\pi` : "0", fields: [F(ans, "", "π")],
    };
  }
  if (lv === 2) {
    // ∫ f · g over a period, f a sum of three waves: only the matching term survives
    const ns = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 3);
    const ks = ns.map(() => pick(["sin", "cos"] as const)), cs = ns.map(() => nz(-5, 5));
    const j = ri(0, 2), hit = Math.random() < 0.75;
    const gk = hit ? ks[j] : (ks[j] === "sin" ? "cos" : "sin"), gn = ns[j];
    const match = ns.findIndex((m, i) => m === gn && ks[i] === gk), ans = match >= 0 ? cs[match] : 0;
    return {
      key: `fo2:${ns.join(",")}:${ks.join(",")}:${cs.join(",")}:${gk}${gn}`, ask: ["mpr_fouPick", "Find ∫ f(x) g(x) dx over [−π, π] as a multiple of π"],
      tex: `f(x) = ${lin(ns.map((m, i) => [cs[i], wave(ks[i], m)] as [number, string]))},\\quad g(x) = ${wave(gk, gn)}`,
      steps: [
        ...ns.map((m, i) => `${cs[i]}\\int_{-\\pi}^{\\pi} ${wave(ks[i], m)}\\,${wave(gk, gn)}\\,dx = ${i === match ? `${cs[i]}\\pi` : "0"}`),
        `${ns.map((_, i) => (i === match ? `${par(cs[i])}\\pi` : "0")).join(" + ")} = ${amber(match >= 0 ? `${ans}\\pi` : "0")}`,
      ],
      short: match >= 0 ? `${ans}\\pi` : "0", fields: [F(ans, "", "π")],
    };
  }
  // a product of waves rewritten as a Fourier series
  const k = ri(1, 3), c = nz(-4, 4) * 2, which = pick(["sin2", "cos2", "sincos"] as const);
  const half = fr(c, 2);
  if (which === "sincos") {
    return {
      key: `fo3:${which}:${k}:${c}`, ask: ["mpr_fouProd", "Write f as a Fourier series and give the coefficient asked for"],
      tex: `f(x) = ${c}\\,${wave("sin", k)}\\,${wave("cos", k)},\\qquad b_{${2 * k}} = \\,?`,
      steps: [`\\sin A \\cos A = \\tfrac12 \\sin 2A`, `f = ${tf(half)}\\,${wave("sin", 2 * k)} \\Rightarrow b_{${2 * k}} = ${amber(tf(half))}`],
      short: tf(half), fields: [F(half, `b_{${2 * k}}`)],
    };
  }
  const s = which === "sin2" ? -1 : 1, a2 = mul(half, fr(s));
  return {
    key: `fo3:${which}:${k}:${c}`, ask: ["mpr_fouProd2", "Write f as a Fourier series: find a₀ and the other non-zero coefficient"],
    tex: `f(x) = ${c}\\,\\${which === "sin2" ? "sin" : "cos"}^{2} ${k === 1 ? "" : k}x`,
    steps: [
      `\\${which === "sin2" ? "sin" : "cos"}^{2} A = \\tfrac12 ${s < 0 ? "-" : "+"} \\tfrac12 \\cos 2A`,
      `f = ${tf(half)} ${s * half.n < 0 ? "-" : "+"} ${tf(fr(Math.abs(half.n), half.d))}\\,${wave("cos", 2 * k)}`,
      `\\tfrac{a_0}{2} = ${tf(half)} \\Rightarrow a_0 = ${amber(c)},\\quad a_{${2 * k}} = ${amber(tf(a2))}`,
    ],
    short: `a_0 = ${c},\\ a_{${2 * k}} = ${tf(a2)}`, fields: [F(c, "a_0"), F(a2, `a_{${2 * k}}`)],
  };
};

// ── Coefficients ──
export const fouCoef: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const A = nz(-4, 4), B = nz(-5, 5), C = nz(-5, 5), m = ri(1, 4), n = ri(1, 4);
    return {
      key: `fc1:${A}:${B}:${C}:${m}:${n}`, ask: ["mpr_fouRead", "Read the coefficients off the series"],
      tex: `f(x) = ${withConst(A, [[B, wave("cos", m)], [C, wave("sin", n)]])}`,
      steps: [`\\tfrac{a_0}{2} = ${A} \\Rightarrow a_0 = ${amber(2 * A)}`, `a_{${m}} = ${amber(B)},\\quad b_{${n}} = ${amber(C)}`],
      short: `${2 * A},\\ ${B},\\ ${C}`, fields: [F(2 * A, "a_0"), F(B, `a_{${m}}`), F(C, `b_{${n}}`)],
    };
  }
  if (lv === 2) {
    const n = ri(1, 6), c = nz(-3, 3);
    if (Math.random() < 0.5) {
      // square wave of height h: π bₙ = 2h(1 − (−1)ⁿ)/n
      const v = fr(2 * c * (1 - (-1) ** n), n);
      return {
        key: `fc2s:${c}:${n}`, ask: ["mpr_fouSquare", "f is the square wave below, repeated every 2π. Find π bₙ"],
        tex: `f(x) = \\begin{cases} ${-c} & -\\pi < x < 0 \\\\ ${c} & 0 < x < \\pi \\end{cases},\\qquad n = ${n}`,
        steps: [
          `b_n = \\tfrac{2}{\\pi}\\int_0^{\\pi} ${c} \\sin nx\\,dx = \\tfrac{2 \\cdot ${par(c)}}{\\pi} \\cdot \\tfrac{1 - (-1)^{n}}{n}`,
          `\\pi b_{${n}} = \\tfrac{${2 * c} \\cdot ${1 - (-1) ** n}}{${n}} = ${amber(tf(v))}`,
        ],
        short: tf(v), fields: [F(v, `\\pi b_{${n}}`)],
      };
    }
    // f = c x: bₙ = 2c(−1)ⁿ⁺¹/n
    const v = fr(2 * c * (n % 2 ? 1 : -1), n);
    return {
      key: `fc2x:${c}:${n}`, ask: ["mpr_fouSaw", "f(x) = cx on (−π, π), repeated every 2π. Find bₙ"],
      tex: `f(x) = ${c === 1 ? "" : c === -1 ? "-" : c}x,\\qquad n = ${n}`,
      steps: [
        `b_n = \\tfrac{2}{\\pi}\\int_0^{\\pi} ${c === 1 ? "" : c === -1 ? "-" : c}x \\sin nx\\,dx = ${c} \\cdot \\tfrac{2(-1)^{n+1}}{n}`,
        `b_{${n}} = ${amber(tf(v))}`,
      ],
      short: tf(v), fields: [F(v, `b_{${n}}`)],
    };
  }
  // f = c|x|: a₀ = cπ, π aₙ = 2c((−1)ⁿ − 1)/n²
  const n = ri(1, 5), c = nz(-3, 3);
  const v = fr(2 * c * ((-1) ** n - 1), n * n);
  return {
    key: `fc3:${c}:${n}`, ask: ["mpr_fouAbs", "f(x) = c|x| on [−π, π], repeated every 2π. Find bₙ and π aₙ"],
    tex: `f(x) = ${c === 1 ? "" : c === -1 ? "-" : c}|x|,\\qquad n = ${n}`,
    steps: [
      `f \\text{ even} \\Rightarrow b_{${n}} = ${amber(0)}`,
      `a_n = \\tfrac{2}{\\pi}\\int_0^{\\pi} ${c}x \\cos nx\\,dx = \\tfrac{2 \\cdot ${par(c)}}{\\pi} \\cdot \\tfrac{(-1)^{n} - 1}{n^2}`,
      `\\pi a_{${n}} = ${amber(tf(v))}`,
    ],
    short: `0,\\ ${tf(v)}`, fields: [F(0, `b_{${n}}`), F(v, `\\pi a_{${n}}`)],
  };
};

// ── Parseval and the complex form ──
export const fouParseval: Gen = (lv: Level): Problem => {
  const A = ri(-3, 3), ns = [1, 2, 3, 4].sort(() => Math.random() - 0.5).slice(0, 2);
  const ks = ns.map(() => pick(["sin", "cos"] as const)), cs = ns.map(() => nz(-4, 4));
  const fTex = withConst(A, ns.map((m, i) => [cs[i], wave(ks[i], m)] as [number, string]));
  const sum = 2 * A * A + cs.reduce((s, c) => s + c * c, 0);
  const steps = [
    `a_0 = ${2 * A} \\Rightarrow \\tfrac{a_0^2}{2} = ${2 * A * A}`,
    `${cs.map(c => `${par(c)}^2`).join(" + ")} = ${cs.reduce((s, c) => s + c * c, 0)}`,
  ];
  if (lv === 1) {
    return {
      key: `fp1:${A}:${ns.join(",")}:${ks.join(",")}:${cs.join(",")}`, ask: ["mpr_fouPar", "Use Parseval: find (1/π) ∫ f(x)² dx over [−π, π]"],
      tex: `f(x) = ${fTex}`,
      steps: [...steps, `${2 * A * A} + ${sum - 2 * A * A} = ${amber(sum)}`],
      short: `${sum}`, fields: [F(sum)],
    };
  }
  if (lv === 2) {
    return {
      key: `fp2:${A}:${ns.join(",")}:${ks.join(",")}:${cs.join(",")}`, ask: ["mpr_fouParPi", "Find ∫ f(x)² dx over [−π, π] as a multiple of π"],
      tex: `f(x) = ${fTex}`,
      steps: [...steps, `\\int f^2\\,dx = \\pi\\,(${2 * A * A} + ${sum - 2 * A * A}) = ${amber(`${sum}\\pi`)}`],
      short: `${sum}\\pi`, fields: [F(sum, "", "π")],
    };
  }
  // cₙ = (aₙ − i bₙ)/2
  const a = ri(-6, 6), b = nz(-6, 6), n = ri(1, 5);
  const re = fr(a, 2), im = fr(-b, 2);
  return {
    key: `fp3:${a}:${b}:${n}`, ask: ["mpr_fouCx", "Find the complex coefficient cₙ (real and imaginary parts)"],
    tex: `a_{${n}} = ${a},\\ b_{${n}} = ${b} \\qquad c_{${n}} = \\,?`,
    steps: [`c_n = \\tfrac{a_n - i\\,b_n}{2} = \\tfrac{${a} - ${par(b)}\\,i}{2}`, `\\operatorname{Re} = ${amber(tf(re))},\\quad \\operatorname{Im} = ${amber(tf(im))}`],
    short: `${tf(re)} ${im.n < 0 ? "-" : "+"} ${tf(fr(Math.abs(im.n), im.d))}\\,i`, fields: [F(re, "\\operatorname{Re}"), F(im, "\\operatorname{Im}")],
  };
};

