// ── Expression trees with worked steps ────────────────────────────────────────
// A practice expression is built as a tree (never parsed from text), drawn as
// TeX, and evaluated one operation per line in the order taught in the
// lessons: brackets first (innermost, leftmost), then powers, then × and ÷
// left to right, then + and − left to right. Each line colours the number it
// just produced. Fractions show their work: unlike denominators are first
// rewritten over the lcd, a ÷ b becomes a × 1/b, and a result that can be
// reduced appears unreduced first, then in lowest terms.

import { add, div, fr, gcd, isInt, lcm, mul, pow, sub, texFrac, type Frac } from "./frac";

export type Op = "+" | "-" | "*" | "/" | "^" | "over";
export type Node =
  | { k: "num"; v: Frac; show?: [number, number]; simp?: boolean; fresh?: boolean }
  | { k: "var"; name: string }
  | { k: "bin"; op: Op; l: Node; r: Node; imp?: boolean }      // imp: written side by side, 3x, 2(x + 1)
  | { k: "par"; e: Node };

// ── Building ──
export const n = (a: number | Frac, d = 1): Node => ({ k: "num", v: typeof a === "number" ? fr(a, d) : a });
export const v = (name: string): Node => ({ k: "var", name });
export const par = (e: Node): Node => ({ k: "par", e });
const bin = (op: Op) => (l: Node, r: Node): Node => ({ k: "bin", op, l, r });
export const plus = bin("+"), minus = bin("-"), times = bin("*"), divide = bin("/"), power = bin("^"), over = bin("over");
/** Written side by side: 3x, 2(x + 1), 4x². */
export const imp = (l: Node, r: Node): Node => ({ k: "bin", op: "*", l, r, imp: true });

// ── Drawing ──
const negative = (a: Node) => a.k === "num" && (a.show ? a.show[0] < 0 : a.v.n < 0);
const fracLike = (a: Node) => a.k === "num" && (a.show ? a.show[1] !== 1 : !isInt(a.v));

function numTex(a: Extract<Node, { k: "num" }>) {
  const s = a.show ? (a.show[1] === 1 ? `${a.show[0]}` : `${a.show[0] < 0 ? "-" : ""}\\frac{${Math.abs(a.show[0])}}{${a.show[1]}}`) : texFrac(a.v);
  return a.fresh ? `\\amber{${s}}` : s;
}
const wrap = (s: string) => `\\left(${s}\\right)`;

/** TeX of a tree. `first`: this node starts its group, so a leading minus needs no brackets. */
export function tex(a: Node, first = true): string {
  switch (a.k) {
    case "num": return negative(a) && !first ? wrap(numTex(a)) : numTex(a);
    case "var": return a.name;
    case "par": return wrap(tex(a.e));
    case "bin": {
      const L = tex(a.l, first), R = tex(a.r, false);
      switch (a.op) {
        case "+": return `${L} + ${R}`;
        case "-": return `${L} - ${R}`;
        case "/": return `${L} \\div ${R}`;
        case "over": return `\\frac{${tex(a.l)}}{${tex(a.r)}}`;
        case "^": {
          const base = a.l.k === "var" || (a.l.k === "num" && !negative(a.l) && !fracLike(a.l)) ? tex(a.l) : a.l.k === "par" ? tex(a.l) : wrap(tex(a.l));
          return `${base}^{${tex(a.r)}}`;
        }
        case "*": {
          const sideBySide = a.imp && (a.r.k === "var" || a.r.k === "par" || (a.r.k === "bin" && (a.r.op === "^" || a.r.imp) && a.r.l.k === "var"));
          if (!sideBySide) return `${L} \\times ${R}`;
          if (a.l.k === "num" && a.l.v.d === 1 && !a.l.show) {      // 1x → x, -1x → -x
            if (a.l.v.n === 1) return tex(a.r, first);
            if (a.l.v.n === -1) return first ? `-${tex(a.r, false)}` : wrap(`-${tex(a.r, false)}`);
          }
          return `${L}${tex(a.r)}`;
        }
      }
    }
  }
}

// ── Evaluating ──
export function value(a: Node): Frac {
  switch (a.k) {
    case "num": return a.v;
    case "var": throw new Error(`unbound variable ${a.name}`);
    case "par": return value(a.e);
    case "bin": {
      const l = value(a.l), r = value(a.r);
      switch (a.op) {
        case "+": return add(l, r);
        case "-": return sub(l, r);
        case "*": return mul(l, r);
        case "/": case "over": return div(l, r);
        case "^": if (r.d !== 1) throw new Error("fractional power"); return pow(l, r.n);
      }
    }
  }
}

/** Replace variables by numbers. */
export function subst(a: Node, vals: Record<string, Node>): Node {
  switch (a.k) {
    case "num": return a;
    case "var": return vals[a.name] ?? a;
    case "par": return { ...a, e: subst(a.e, vals) };
    case "bin": return { ...a, l: subst(a.l, vals), r: subst(a.r, vals) };
  }
}

// ── One line of work ──
const shown = (a: Extract<Node, { k: "num" }>): [number, number] => a.show ?? [a.v.n, a.v.d];
/** A result: shown unreduced first when reducing it is a step of its own. */
function result(num: number, den: number): Node {
  if (den < 0) { num = -num; den = -den; }
  const v = fr(num, den);
  return den !== 1 && gcd(num, den) > 1
    ? { k: "num", v, show: [num, den], simp: true, fresh: true }
    : { k: "num", v, fresh: true };
}

function combine(a: Extract<Node, { k: "bin" }>): Node {
  const l = a.l as Extract<Node, { k: "num" }>, r = a.r as Extract<Node, { k: "num" }>;
  const [ln, ld] = shown(l), [rn, rd] = shown(r);
  switch (a.op) {
    case "+": case "-": {
      if (ld !== rd) {                                          // rewrite both over the lcd
        const L = lcm(ld, rd);
        return { ...a, l: { k: "num", v: l.v, show: [ln * (L / ld), L], fresh: true }, r: { k: "num", v: r.v, show: [rn * (L / rd), L], fresh: true } };
      }
      return result(a.op === "+" ? ln + rn : ln - rn, ld);
    }
    case "*": return ld === 1 && rd === 1 ? { k: "num", v: mul(l.v, r.v), fresh: true } : result(ln * rn, ld * rd);
    case "/": case "over":
      if (a.op === "over" && ld === 1 && rd === 1) return { k: "num", v: fr(ln, rn), fresh: true };   // 30/100 → 3/10: the bar is already a fraction
      if (ld === 1 && rd === 1) return ln % rn === 0 ? { k: "num", v: fr(ln / rn), fresh: true } : result(ln, rn);   // 12 ÷ 4 = 3; 6 ÷ 4 = 6/4 = 3/2
      return { k: "bin", op: "*", l: { ...l, fresh: false }, r: { k: "num", v: div(fr(1), r.v), fresh: true } };   // ÷ b → × 1/b
    case "^": {
      if (r.v.d !== 1) throw new Error("fractional power");
      return { k: "num", v: pow(l.v, r.v.n), fresh: true };
    }
  }
}

const isNum = (a: Node): a is Extract<Node, { k: "num" }> => a.k === "num";
type Step = { node: Node; done: boolean };

/** Reduce the first pending fraction, else the first non-numeric bracket, else the first op of the given tier. */
function first(a: Node, pick: (b: Extract<Node, { k: "bin" }>) => boolean): Step {
  if (a.k === "bin") {
    const L = first(a.l, pick);
    if (L.done) return { node: { ...a, l: L.node }, done: true };
    const R = first(a.r, pick);
    if (R.done) return { node: { ...a, r: R.node }, done: true };
    if (isNum(a.l) && isNum(a.r) && pick(a)) return { node: combine(a), done: true };
  }
  return { node: a, done: false };
}

function simplifyPending(a: Node): Step {
  if (a.k === "num") return a.simp ? { node: { k: "num", v: a.v, fresh: true }, done: true } : { node: a, done: false };
  if (a.k === "par") { const s = simplifyPending(a.e); return { node: { ...a, e: s.node }, done: s.done }; }
  if (a.k === "bin") {
    const L = simplifyPending(a.l), R = simplifyPending(a.r);
    return { node: { ...a, l: L.node, r: R.node }, done: L.done || R.done };
  }
  return { node: a, done: false };
}

/** Brackets (and the top and bottom of a fraction bar) are worked out first, innermost leftmost. */
function inGroups(a: Node): Step {
  if (a.k === "par") {
    if (isNum(a.e)) return { node: a.e, done: true };          // (5) → 5
    const inner = inGroups(a.e);
    if (inner.done) return { node: unwrap({ ...a, e: inner.node }), done: true };
    return { node: unwrap({ ...a, e: tier(a.e) }), done: true };
  }
  if (a.k === "bin") {
    if (a.op === "over") {
      for (const side of ["l", "r"] as const) {
        if (isNum(a[side])) continue;
        const inner = inGroups(a[side]);
        return { node: { ...a, [side]: inner.done ? inner.node : tier(a[side]) }, done: true };
      }
    }
    const L = inGroups(a.l);
    if (L.done) return { node: { ...a, l: L.node }, done: true };
    const R = inGroups(a.r);
    if (R.done) return { node: { ...a, r: R.node }, done: true };
  }
  return { node: a, done: false };
}
const unwrap = (a: Extract<Node, { k: "par" }>): Node => (isNum(a.e) ? a.e : a);

/** One operation of a bracket-free expression, by the order of operations. */
function tier(a: Node): Node {
  for (const ops of [["^"], ["*", "/", "over"], ["+", "-"]] as Op[][]) {
    const s = first(a, b => ops.includes(b.op));
    if (s.done) return s.node;
  }
  throw new Error("nothing left to evaluate");
}

function unfresh(a: Node): Node {
  if (a.k === "num") return a.fresh ? { ...a, fresh: false } : a;
  if (a.k === "par") return { ...a, e: unfresh(a.e) };
  if (a.k === "bin") return { ...a, l: unfresh(a.l), r: unfresh(a.r) };
  return a;
}

/** TeX lines, the expression first, then one per operation, down to a single number. */
export function workLines(a: Node): string[] {
  const lines = [tex(a)];
  for (let guard = 0; guard < 40 && !(isNum(a) && !a.simp); guard++) {
    a = unfresh(a);
    const s = simplifyPending(a);
    if (s.done) a = s.node;
    else {
      const g = inGroups(a);
      a = g.done ? g.node : tier(a);
    }
    lines.push(tex(a));
  }
  return lines;
}
