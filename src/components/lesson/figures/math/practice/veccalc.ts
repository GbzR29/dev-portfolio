// ── Practice generators: vector calculus ─────────────────────────────────────
// Divergence and curl of polynomial fields at a point, work along segments
// (constant and linear fields, exact through ∫₀¹ t dt = 1/2), work of a
// gradient field from its potential, and Green's theorem on rectangles,
// circles (answers as multiples of π) and the shoelace area of a triangle.
// Every answer is an exact fraction.

import { add, fr, mul, type Frac } from "./frac";
import { nz, ri, type Field, type Gen, type Level, type Problem } from "./problem";

const amber = (s: string | number) => `\\amber{${s}}`;
const F = (x: Frac | number, label = "", suffix?: string): Field => ({ label, suffix, answer: { kind: "num", value: typeof x === "number" ? fr(x) : x } });
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
/** x^i y^j as TeX. */
const mono = (i: number, j: number) => `${i ? (i === 1 ? "x" : `x^{${i}}`) : ""}${j ? (j === 1 ? "y" : `y^{${j}}`) : ""}`;

// ── Divergence and curl ──
export const vfDivCurl: Gen = (lv: Level): Problem => {
  if (lv === 1) {
    const a = ri(-4, 4), b = ri(-4, 4), c = ri(-4, 4), d = ri(-4, 4);
    return {
      key: `vd1:${a}:${b}:${c}:${d}`, ask: ["mpr_vfDC", "Find the divergence and the curl of the field"],
      tex: `\\mathbf F = \\left(${lin([[a, "x"], [b, "y"]])},\\ ${lin([[c, "x"], [d, "y"]])}\\right)`,
      steps: [
        `\\operatorname{div}\\mathbf F = \\tfrac{\\partial P}{\\partial x} + \\tfrac{\\partial Q}{\\partial y} = ${a} + ${par(d)} = ${amber(a + d)}`,
        `\\operatorname{curl}\\mathbf F = \\tfrac{\\partial Q}{\\partial x} - \\tfrac{\\partial P}{\\partial y} = ${c} - ${par(b)} = ${amber(c - b)}`,
      ],
      short: `${a + d},\\ ${c - b}`, fields: [F(a + d, "\\operatorname{div}"), F(c - b, "\\operatorname{curl}")],
    };
  }
  if (lv === 2) {
    // P = p xⁱyʲ, Q = q xᵏyˡ at (x₀, y₀)
    const p = nz(-3, 3), q = nz(-3, 3), i = ri(1, 3), j = ri(0, 2), k = ri(0, 2), l = ri(1, 3), x0 = nz(-2, 2), y0 = nz(-2, 2);
    const Px = p * i * x0 ** (i - 1) * y0 ** j, Qy = q * l * x0 ** k * y0 ** (l - 1);
    const Qx = k ? q * k * x0 ** (k - 1) * y0 ** l : 0, Py = j ? p * j * x0 ** i * y0 ** (j - 1) : 0;
    return {
      key: `vd2:${p}:${i}:${j}:${q}:${k}:${l}:${x0}:${y0}`, ask: ["mpr_vfDCpt", "Find the divergence and the curl at the given point"],
      tex: `\\mathbf F = \\left(${lin([[p, mono(i, j)]])},\\ ${lin([[q, mono(k, l)]])}\\right),\\quad (x_0, y_0) = (${x0}, ${y0})`,
      steps: [
        `\\tfrac{\\partial P}{\\partial x} = ${Px},\\ \\tfrac{\\partial Q}{\\partial y} = ${Qy},\\ \\tfrac{\\partial Q}{\\partial x} = ${Qx},\\ \\tfrac{\\partial P}{\\partial y} = ${Py}`,
        `\\operatorname{div} = ${Px} + ${par(Qy)} = ${amber(Px + Qy)}, \\quad \\operatorname{curl} = ${Qx} - ${par(Py)} = ${amber(Qx - Py)}`,
      ],
      short: `${Px + Qy},\\ ${Qx - Py}`, fields: [F(Px + Qy, "\\operatorname{div}"), F(Qx - Py, "\\operatorname{curl}")],
    };
  }
  // 3D divergence at a point: P = a x²y, Q = b yz, R = c xz²
  const a = nz(-3, 3), b = nz(-3, 3), c = nz(-3, 3), x0 = nz(-2, 2), y0 = nz(-2, 2), z0 = nz(-2, 2);
  const d1 = 2 * a * x0 * y0, d2 = b * z0, d3 = 2 * c * x0 * z0;
  return {
    key: `vd3:${a}:${b}:${c}:${x0}:${y0}:${z0}`, ask: ["mpr_vfDiv3", "Find ∇ · F at the given point"],
    tex: `\\mathbf F = \\left(${lin([[a, "x^{2}y"]])},\\ ${lin([[b, "yz"]])},\\ ${lin([[c, "xz^{2}"]])}\\right),\\quad (x_0, y_0, z_0) = (${x0}, ${y0}, ${z0})`,
    steps: [
      `\\nabla\\cdot\\mathbf F = ${lin([[2 * a, "xy"], [b, "z"], [2 * c, "xz"]])}`,
      `= ${d1} + ${par(d2)} + ${par(d3)} = ${amber(d1 + d2 + d3)}`,
    ],
    short: `${d1 + d2 + d3}`, fields: [F(d1 + d2 + d3)],
  };
};

// ── Work along a path ──
export const liWork: Gen = (lv: Level): Problem => {
  const A = { x: ri(-3, 3), y: ri(-3, 3) };
  let B = { x: ri(-3, 3), y: ri(-3, 3) };
  while (B.x === A.x && B.y === A.y) B = { x: ri(-3, 3), y: ri(-3, 3) };
  const d = { x: B.x - A.x, y: B.y - A.y };
  if (lv === 1) {
    const p = nz(-4, 4), q = ri(-4, 4), W = p * d.x + q * d.y;
    return {
      key: `lw1:${p}:${q}:${A.x}:${A.y}:${B.x}:${B.y}`, ask: ["mpr_liConst", "Find the work of the constant field from A to B (any path)"],
      tex: `\\mathbf F = (${p}, ${q}),\\quad A = (${A.x}, ${A.y}),\\ B = (${B.x}, ${B.y})`,
      steps: [`W = \\mathbf F\\cdot(B - A) = (${p}, ${q})\\cdot(${d.x}, ${d.y})`, `= ${p}\\cdot${par(d.x)} + ${q}\\cdot${par(d.y)} = ${amber(W)}`],
      short: `${W}`, fields: [F(W)],
    };
  }
  if (lv === 2) {
    // F = (ax + by, cx + dy) along r(t) = A + t d: W = F(A)·d + ½ (M d)·d
    const a = ri(-3, 3), b = ri(-3, 3), c = ri(-3, 3), e = ri(-3, 3);
    const FA = { x: a * A.x + b * A.y, y: c * A.x + e * A.y }, Md = { x: a * d.x + b * d.y, y: c * d.x + e * d.y };
    const W = add(fr(FA.x * d.x + FA.y * d.y), mul(fr(1, 2), fr(Md.x * d.x + Md.y * d.y)));
    return {
      key: `lw2:${a}:${b}:${c}:${e}:${A.x}:${A.y}:${B.x}:${B.y}`, ask: ["mpr_liSeg", "Find the work along the straight segment from A to B"],
      tex: `\\mathbf F = \\left(${lin([[a, "x"], [b, "y"]])},\\ ${lin([[c, "x"], [e, "y"]])}\\right),\\quad A = (${A.x}, ${A.y}),\\ B = (${B.x}, ${B.y})`,
      steps: [
        `\\mathbf r(t) = A + t\\,(${d.x}, ${d.y}),\\ \\mathbf r' = (${d.x}, ${d.y}),\\ 0 \\le t \\le 1`,
        `\\mathbf F(\\mathbf r(t)) = (${FA.x}, ${FA.y}) + t\\,(${Md.x}, ${Md.y})`,
        `W = \\int_0^1 \\big[${FA.x * d.x + FA.y * d.y} + ${Md.x * d.x + Md.y * d.y}\\,t\\big]\\,dt = ${FA.x * d.x + FA.y * d.y} + \\tfrac{${Md.x * d.x + Md.y * d.y}}{2} = ${amber(tf(W))}`,
      ],
      short: tf(W), fields: [F(W)],
    };
  }
  // gradient field of f = c₁x²y + c₂xy + c₃y² + c₄x
  const c1 = ri(-2, 2), c2 = ri(-3, 3), c3 = ri(-2, 2), c4 = ri(-3, 3);
  const f = (x: number, y: number) => c1 * x * x * y + c2 * x * y + c3 * y * y + c4 * x;
  const W = f(B.x, B.y) - f(A.x, A.y);
  const fTex = lin([[c1, "x^{2}y"], [c2, "xy"], [c3, "y^{2}"], [c4, "x"]]);
  return {
    key: `lw3:${c1}:${c2}:${c3}:${c4}:${A.x}:${A.y}:${B.x}:${B.y}`, ask: ["mpr_liGrad", "The field is a gradient. Find the work from A to B (find a potential first)"],
    tex: `\\mathbf F = \\left(${lin([[2 * c1, "xy"], [c2, "y"], [c4, ""]])},\\ ${lin([[c1, "x^{2}"], [c2, "x"], [2 * c3, "y"]])}\\right),\\quad A = (${A.x}, ${A.y}),\\ B = (${B.x}, ${B.y})`,
    steps: [
      `f = ${fTex}`,
      `W = f(B) - f(A) = ${f(B.x, B.y)} - ${par(f(A.x, A.y))} = ${amber(W)}`,
    ],
    short: `${W}`, fields: [F(W)],
  };
};

// ── Green's theorem ──
export const gsGreen: Gen = (lv: Level): Problem => {
  const a = ri(-3, 3), b = ri(-3, 3), c = ri(-3, 3), e = ri(-3, 3);
  const field = `\\mathbf F = \\left(${lin([[a, "x"], [b, "y"]])},\\ ${lin([[c, "x"], [e, "y"]])}\\right)`;
  if (lv === 1) {
    const w = ri(1, 5), h = ri(1, 5), flux = Math.random() < 0.5, k = flux ? a + e : c - b, ans = k * w * h;
    return {
      key: `gg1:${a}:${b}:${c}:${e}:${w}:${h}:${flux}`,
      ask: flux ? ["mpr_gsFlux", "Find the outward flux through the boundary of the rectangle"] : ["mpr_gsCirc", "Find the counterclockwise circulation round the rectangle"],
      tex: `${field},\\quad [0, ${w}] \\times [0, ${h}]`,
      steps: flux
        ? [`\\oint \\mathbf F\\cdot\\mathbf n\\,ds = \\iint \\operatorname{div}\\mathbf F\\,dA`, `\\operatorname{div}\\mathbf F = ${a} + ${par(e)} = ${a + e}`, `${a + e} \\cdot ${w * h} = ${amber(ans)}`]
        : [`\\oint \\mathbf F\\cdot d\\mathbf r = \\iint \\operatorname{curl}\\mathbf F\\,dA`, `\\operatorname{curl}\\mathbf F = ${c} - ${par(b)} = ${c - b}`, `${c - b} \\cdot ${w * h} = ${amber(ans)}`],
      short: `${ans}`, fields: [F(ans)],
    };
  }
  if (lv === 2) {
    const R = ri(1, 4), k = c - b, ans = k * R * R;
    return {
      key: `gg2:${a}:${b}:${c}:${e}:${R}`, ask: ["mpr_gsCircPi", "Find the counterclockwise circulation round the circle of radius R about the origin, as a multiple of π"],
      tex: `${field},\\quad R = ${R}`,
      steps: [`\\operatorname{curl}\\mathbf F = ${c} - ${par(b)} = ${k}`, `\\iint_D ${k}\\,dA = ${k} \\cdot \\pi \\cdot ${R}^2 = ${amber(`${ans}\\pi`)}`],
      short: `${ans}\\pi`, fields: [F(ans, "", "π")],
    };
  }
  // the shoelace area of a triangle (a polygon's area from its boundary)
  const P = [{ x: ri(-4, 4), y: ri(-4, 4) }, { x: ri(-4, 4), y: ri(-4, 4) }, { x: ri(-4, 4), y: ri(-4, 4) }];
  const s = P.reduce((acc, p, i) => { const q = P[(i + 1) % 3]; return acc + p.x * q.y - q.x * p.y; }, 0);
  if (s === 0) return gsGreen(3);
  const area = fr(Math.abs(s), 2);
  return {
    key: `gg3:${P.map(p => `${p.x},${p.y}`).join(";")}`, ask: ["mpr_gsShoe", "Find the area of the triangle from ½ ∮ x dy − y dx (the shoelace formula)"],
    tex: P.map(p => `(${p.x}, ${p.y})`).join(",\\ "),
    steps: [
      `\\tfrac12 \\left|\\sum (x_i y_{i+1} - x_{i+1} y_i)\\right|`,
      `\\tfrac12 \\left|${P.map((p, i) => { const q = P[(i + 1) % 3]; return `(${p.x}\\cdot${par(q.y)} - ${par(q.x)}\\cdot${par(p.y)})`; }).join(" + ")}\\right| = \\tfrac12 \\cdot ${Math.abs(s)} = ${amber(tf(area))}`,
    ],
    short: tf(area), fields: [F(area)],
  };
};
