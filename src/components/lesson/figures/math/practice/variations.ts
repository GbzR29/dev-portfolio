// ── Practice generators: the calculus of variations ──────────────────────────
// The value of J[y] = ∫₀¹ y′² dx (and ∫ (y′² + y²) dx) for polynomial curves,
// how much a bump with the same ends adds, the Euler–Lagrange equation of
// simple Lagrangians (y″ = const, the boundary-value solution at x = ½, and
// y″ = m·y where the y·y′ term drops out), and the principle of least action
// (acceleration from L = ½ m ẋ² − V(x)). Every answer is an exact fraction.

import { add, div, fr, mul, sub, type Frac } from "./frac";
import { nz, pick, ri, type Field, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const F = (x: Frac | number, label = ""): Field => ({ label, answer: { kind: "num", value: typeof x === "number" ? fr(x) : x } });
const tf = (a: Frac) => (a.d === 1 ? `${a.n}` : `${a.n < 0 ? "-" : ""}\\tfrac{${Math.abs(a.n)}}{${a.d}}`);
const par = (v: number) => (v < 0 ? `(${v})` : `${v}`);
/** c₁s₁ + c₂s₂ … in TeX, dropping zeros and 1s. */
function lin(parts: [number, string][]) {
  const out = parts.filter(([c]) => c !== 0).map(([c, s], i) => {
    const a = Math.abs(c), body = s && a === 1 ? s : `${a}${s}`;
    return i === 0 ? (c < 0 ? `-${body}` : body) : `${c < 0 ? "-" : "+"} ${body}`;
  });
  return out.length ? out.join(" ") : "0";
}

// ── Evaluating a functional ──
export const varJ: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    // y = px² + qx: ∫₀¹ (2px + q)² dx = 4p²/3 + 2pq + q²
    const p = nz(-3, 3), q = ri(-3, 3);
    const v = add(fr(4 * p * p, 3), fr(2 * p * q + q * q));
    return {
      key: `vj1:${p}:${q}`, ask: ["mpr_varJ", "Find the value of the functional for the given curve"],
      tex: `J[y] = \\int_0^1 y'^2\\,dx,\\qquad y = ${lin([[p, "x^2"], [q, "x"]])}`,
      steps: [
        `y' = ${lin([[2 * p, "x"], [q, ""]])}`,
        `\\int_0^1 (${lin([[2 * p, "x"], [q, ""]])})^2 dx = \\tfrac{${4 * p * p}}{3} + ${par(2 * p * q)} + ${q * q} = ${amber(tf(v))}`,
      ],
      short: tf(v), fields: [F(v)],
    };
  }
  if (lv === 2) {
    // y = px + q: ∫₀¹ (p² + (px + q)²) dx = p² + p²/3 + pq + q²
    const p = nz(-3, 3), q = ri(-3, 3);
    const v = add(fr(p * p), add(fr(p * p, 3), fr(p * q + q * q)));
    return {
      key: `vj2:${p}:${q}`, ask: ["mpr_varJ", "Find the value of the functional for the given curve"],
      tex: `J[y] = \\int_0^1 \\left(y'^2 + y^2\\right)dx,\\qquad y = ${lin([[p, "x"], [q, ""]])}`,
      steps: [
        `\\int_0^1 ${p * p}\\,dx = ${p * p}`,
        `\\int_0^1 (${lin([[p, "x"], [q, ""]])})^2 dx = \\tfrac{${p * p}}{3} + ${par(p * q)} + ${q * q}`,
        `J = ${amber(tf(v))}`,
      ],
      short: tf(v), fields: [F(v)],
    };
  }
  // a bump with the same ends: y = Bx + c·x(x − 1) costs c²/3 more than the line
  const B = ri(-3, 3), c = nz(-3, 3), extra = fr(c * c, 3);
  return {
    key: `vj3:${B}:${c}`, ask: ["mpr_varBump", "Both curves join (0, 0) to (1, B). How much larger is J for the bent one?"],
    tex: `J[y] = \\int_0^1 y'^2\\,dx,\\quad y_1 = ${lin([[B, "x"]])},\\quad y_2 = ${lin([[B, "x"]])} ${c < 0 ? "-" : "+"} ${Math.abs(c) === 1 ? "" : Math.abs(c)}x(x - 1)`,
    steps: [
      `J[y_1] = ${B * B}`,
      `y_2' = ${B} + ${par(c)}(2x - 1),\\quad \\int_0^1 (2x - 1)\\,dx = 0`,
      `J[y_2] = ${B * B} + ${c * c}\\int_0^1 (2x - 1)^2 dx = ${B * B} + \\tfrac{${c * c}}{3}`,
      `J[y_2] - J[y_1] = ${amber(tf(extra))}`,
    ],
    short: tf(extra), fields: [F(extra)],
  };
};

// ── Euler–Lagrange ──
export const varEL: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const a = nz(1, 3), c = nz(-6, 6), v = fr(c, 2 * a);
    return {
      key: `ve1:${a}:${c}`, ask: ["mpr_varYpp", "Write the Euler–Lagrange equation and find y″"],
      tex: `L = ${lin([[a, "y'^2"], [c, "y"]])}`,
      steps: [
        `\\tfrac{\\partial L}{\\partial y} = ${c},\\quad \\tfrac{\\partial L}{\\partial y'} = ${2 * a}y'`,
        `${c} = \\tfrac{d}{dx}(${2 * a}y') = ${2 * a}y''`,
        `y'' = ${amber(tf(v))}`,
      ],
      short: `y'' = ${tf(v)}`, fields: [F(v, "y''")],
    };
  }
  if (lv === 2) {
    // L = y′² + c y, y(0) = 0, y(1) = B: y = (c/4)x² + (B − c/4)x; y(½) = B/2 − c/16
    const c = nz(-8, 8), B = ri(-4, 4);
    const k = fr(c, 4), lin1 = sub(fr(B), k), v = add(mul(k, fr(1, 4)), mul(lin1, fr(1, 2)));
    return {
      key: `ve2:${c}:${B}`, ask: ["mpr_varBvp", "Find the extremal through the two points and give y(1/2)"],
      tex: `J[y] = \\int_0^1 \\left(${lin([[1, "y'^2"], [c, "y"]])}\\right)dx,\\quad y(0) = 0,\\ y(1) = ${B}`,
      steps: [
        `${c} = 2y'' \\Rightarrow y'' = ${tf(fr(c, 2))} \\Rightarrow y = ${tf(k)}x^2 + bx`,
        `y(1) = ${tf(k)} + b = ${B} \\Rightarrow b = ${tf(lin1)}`,
        `y(\\tfrac12) = ${tf(k)}\\cdot\\tfrac14 + ${tf(lin1)}\\cdot\\tfrac12 = ${amber(tf(v))}`,
      ],
      short: tf(v), fields: [F(v, "y(\\tfrac12)")],
    };
  }
  // L = a y′² + b y y′ + k y²: the b-terms cancel, y″ = (k/a) y
  const a = nz(1, 4), b = nz(-5, 5), k = nz(-6, 6), m = fr(k, a);
  return {
    key: `ve3:${a}:${b}:${k}`, ask: ["mpr_varYm", "The Euler–Lagrange equation has the form y″ = m·y. Find m"],
    tex: `L = ${lin([[a, "y'^2"], [b, "yy'"], [k, "y^2"]])}`,
    steps: [
      `\\tfrac{\\partial L}{\\partial y} = ${lin([[b, "y'"], [2 * k, "y"]])},\\quad \\tfrac{\\partial L}{\\partial y'} = ${lin([[2 * a, "y'"], [b, "y"]])}`,
      `${lin([[b, "y'"], [2 * k, "y"]])} = ${lin([[2 * a, "y''"], [b, "y'"]])}`,
      `${2 * k}y = ${2 * a}y'' \\Rightarrow m = ${amber(tf(m))}`,
    ],
    short: tf(m), fields: [F(m, "m")],
  };
};

// ── Least action ──
export const varAction: Gen = (lv: Level): Problem => {
  const m = pick([1, 2, 3, 4]);
  if (lv === 1) {
    const k = nz(1, 12), w2 = fr(k, m);
    return {
      key: `va1:${m}:${k}`, ask: ["mpr_varSpring", "The equation of motion is ẍ = −ω²x. Find ω²"],
      tex: `L = \\tfrac12\\cdot ${m}\\,\\dot x^2 - \\tfrac12\\cdot ${k}\\,x^2`,
      steps: [`\\tfrac{\\partial L}{\\partial x} = -${k}x,\\quad \\tfrac{\\partial L}{\\partial \\dot x} = ${m}\\dot x`, `-${k}x = ${m}\\ddot x \\Rightarrow \\omega^2 = ${amber(tf(w2))}`],
      short: tf(w2), fields: [F(w2, "\\omega^2")],
    };
  }
  // V = c xᵖ + d x: ẍ = −V′(x₀)/m
  const cube = lv === 3, c = nz(-3, 3), d = ri(-6, 6), x0 = nz(-2, 2);
  const Vp = cube ? 3 * c * x0 * x0 + d : 2 * c * x0 + d, acc = div(fr(-Vp), fr(m));
  const V = lin([[c, cube ? "x^3" : "x^2"], [d, "x"]]);
  return {
    key: `va${lv}:${m}:${c}:${d}:${x0}`, ask: ["mpr_varAcc", "Find the acceleration ẍ at the given position"],
    tex: `L = \\tfrac12\\cdot ${m}\\,\\dot x^2 - \\left(${V}\\right),\\qquad x = ${x0}`,
    steps: [
      `${m}\\ddot x = -V'(x) = -\\left(${lin([[cube ? 3 * c : 2 * c, cube ? "x^2" : "x"], [d, ""]])}\\right)`,
      `V'(${x0}) = ${Vp} \\Rightarrow \\ddot x = \\tfrac{${-Vp}}{${m}} = ${amber(tf(acc))}`,
    ],
    short: tf(acc), fields: [F(acc, "\\ddot x")],
  };
};
