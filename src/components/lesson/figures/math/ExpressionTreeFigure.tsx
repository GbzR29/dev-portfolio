"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// An arithmetic expression parsed with the usual precedence rules into a tree:
// each operator is a node whose children are its operands. Evaluating the tree
// bottom-up, left subtree before right subtree, is exactly the order of
// operations. Each "step" collapses one operator into its value, highlighted
// both in the tree and in the written expression.

type Node =
  | { kind: "num"; v: number; paren: boolean; id: number }
  | { kind: "bin"; op: string; l: Node; r: Node; paren: boolean; id: number }
  | { kind: "neg"; x: Node; paren: boolean; id: number };

// ── Parser ────────────────────────────────────────────────────────────────────
// expr  := term (("+" | "−") term)*
// term  := unary (("×" | "÷") unary)*
// unary := "−" unary | power          (−3² = −(3²): the power binds tighter)
// power := primary ("^" unary)?       (right-associative: 2^3^2 = 2^(3^2))

function parse(src: string): Node | null {
  const toks = src.replace(/[−–]/g, "-").replace(/[×·*]/g, "*").replace(/[÷/:]/g, "/").match(/\d+(?:\.\d+)?|[-+*/^()]/g) ?? [];
  if (toks.join("") !== src.replace(/[−–]/g, "-").replace(/[×·*]/g, "*").replace(/[÷/:]/g, "/").replace(/\s+/g, "")) return null;
  let i = 0;
  const peek = () => toks[i];
  const expr = (): Node => {
    let n = term();
    while (peek() === "+" || peek() === "-") { const op = toks[i++]; n = { kind: "bin", op, l: n, r: term(), paren: false, id: 0 }; }
    return n;
  };
  const term = (): Node => {
    let n = unary();
    while (peek() === "*" || peek() === "/") { const op = toks[i++]; n = { kind: "bin", op, l: n, r: unary(), paren: false, id: 0 }; }
    return n;
  };
  const unary = (): Node => {
    if (peek() !== "-") return power();
    i++;
    const x = unary();
    return x.kind === "num" && !x.paren ? { ...x, v: -x.v } : { kind: "neg", x, paren: false, id: 0 };
  };
  const power = (): Node => {
    const base = primary();
    if (peek() !== "^") return base;
    i++;
    return { kind: "bin", op: "^", l: base, r: unary(), paren: false, id: 0 };
  };
  const primary = (): Node => {
    const tk = toks[i++];
    if (tk === "(") { const n = expr(); if (toks[i++] !== ")") throw 0; return { ...n, paren: true }; }
    if (tk !== undefined && /^\d/.test(tk)) return { kind: "num", v: Number(tk), paren: false, id: 0 };
    throw 0;
  };
  try { const n = expr(); return i === toks.length ? n : null; } catch { return null; }
}

// ── Evaluation order and values ───────────────────────────────────────────────

/** Operator nodes in the order they are evaluated (post-order); numbers the ids. */
function order(root: Node) {
  const ops: Node[] = [];
  let id = 0;
  const walk = (n: Node) => {
    if (n.kind === "bin") { walk(n.l); walk(n.r); }
    if (n.kind === "neg") walk(n.x);
    n.id = id++;
    if (n.kind !== "num") ops.push(n);
  };
  walk(root);
  return ops;
}

function value(n: Node): number {
  if (n.kind === "num") return n.v;
  if (n.kind === "neg") return -value(n.x);
  const a = value(n.l), b = value(n.r);
  return n.op === "+" ? a + b : n.op === "-" ? a - b : n.op === "*" ? a * b : n.op === "/" ? a / b : a ** b;
}

const fmt = (v: number) => !Number.isFinite(v) ? (Number.isNaN(v) ? "?" : "∞") : (+v.toFixed(4)).toString().replace("-", "−");
const SYM: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^" };
const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 4 };

// ── Printing with the current step highlighted ────────────────────────────────

type Seg = { s: string; hl: boolean };

function print(n: Node, done: Set<number>, cur: number, min = 0, hl = false): Seg[] {
  const on = hl || n.id === cur;
  const wrap = (segs: Seg[], need: boolean) => need ? [{ s: "(", hl: on }, ...segs, { s: ")", hl: on }] : segs;
  if (n.kind === "num" || done.has(n.id)) {
    const v = n.kind === "num" ? n.v : value(n);
    return wrap([{ s: fmt(v), hl: on }], (v < 0 && min > 1) || (n.kind === "num" && n.paren));
  }
  if (n.kind === "neg") return wrap([{ s: "−", hl: on }, ...print(n.x, done, cur, 4, on)], n.paren || min > 1);
  const P = PREC[n.op], right = n.op === "^";
  const segs = [...print(n.l, done, cur, right ? P + 1 : P, on), { s: ` ${SYM[n.op]} `.replace(" ^ ", "^"), hl: on }, ...print(n.r, done, cur, right ? P : P + 1, on)];
  return wrap(segs, n.paren || P < min);
}

// ── Tree layout ───────────────────────────────────────────────────────────────

type Placed = { n: Node; x: number; d: number; parent: Placed | null };

function layout(root: Node) {
  const out: Placed[] = [];
  let col = 0;
  const walk = (n: Node, d: number, parent: Placed | null) => {
    const me: Placed = { n, x: 0, d, parent };
    if (n.kind === "bin") { walk(n.l, d + 1, me); me.x = col++; walk(n.r, d + 1, me); }
    else if (n.kind === "neg") { me.x = col++; walk(n.x, d + 1, me); }
    else me.x = col++;
    out.push(me);
  };
  walk(root, 0, null);
  return { nodes: out, cols: col, depth: Math.max(...out.map(p => p.d)) };
}

const PRESETS = ["2 + 3 × 4", "(2 + 3) × 4", "2 + 3 × 4^2", "10 − 4 − 3", "8 ÷ 4 ÷ 2", "2^3^2", "−3^2", "(−3)^2", "6 ÷ 2 × (1 + 2)"];

export function ExpressionTreeFigure({ t }: { t?: TrackTranslations }) {
  const [src, setSrc] = useState(PRESETS[2]);
  const [step, setStep] = useState(0);
  const tree = useMemo(() => {
    const root = parse(src);
    if (!root) return null;
    return { root, ops: order(root), ...layout(root) };
  }, [src]);
  const load = (s: string) => { setSrc(s); setStep(0); };

  const W = 560;
  const ops = tree?.ops ?? [];
  const done = new Set(ops.slice(0, step).map(o => o.id));
  const cur = step < ops.length ? ops[step].id : -1;
  const segs = tree ? print(tree.root, done, cur) : [];
  const H = tree ? 36 + tree.depth * 46 + 24 : 80;
  const gx = (c: number) => tree ? 30 + (tree.cols === 1 ? 0.5 : c / (tree.cols - 1)) * (W - 60) : 0;
  const gy = (d: number) => 26 + d * 46;
  const hidden = (p: Placed) => { for (let q = p.parent; q; q = q.parent) if (done.has(q.n.id)) return true; return false; };

  const curNode = step < ops.length ? ops[step] : null;
  const inParen = (() => { if (!tree || !curNode) return false; const pl = tree.nodes.find(p => p.n === curNode); for (let q: Placed | null = pl ?? null; q; q = q.parent) if (q.n.paren) return true; return false; })();
  const op = curNode?.kind === "bin" ? curNode.op : "";
  const rule = !curNode ? tx(t, "figExpr_doneRule", "done: one number is left")
    : inParen ? tx(t, "figExpr_rParen", "inside parentheses: evaluated before anything outside them")
      : curNode.kind === "neg" ? tx(t, "figExpr_rNeg", "the minus sign applies after the power it is attached to")
        : op === "^" ? tx(t, "figExpr_rPow", "powers before × and ÷; a chain of powers is done right to left")
          : op === "*" || op === "/" ? tx(t, "figExpr_rMul", "× and ÷ before + and −, left to right")
            : tx(t, "figExpr_rAdd", "+ and − last, left to right");

  return (
    <Figure
      title={tx(t, "figExpr_title", "Order of operations as a tree")}
      controls={<>
        <Row>
          {PRESETS.map(s => <Btn key={s} active={s === src} onClick={() => load(s)}>{s}</Btn>)}
        </Row>
        <Row>
          <input value={src} onChange={e => load(e.target.value)} aria-label={tx(t, "figExpr_input", "expression")}
            className="w-52 px-2 py-1 text-[12px] font-mono rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)]" />
          <Btn onClick={() => setStep(s => Math.max(0, s - 1))}>{tx(t, "figExpr_back", "◀ back")}</Btn>
          <Btn active onClick={() => setStep(s => Math.min(ops.length, s + 1))}>{tx(t, "figExpr_step", "step ▶")}</Btn>
          <Btn onClick={() => setStep(0)}>{tx(t, "figExpr_reset", "reset")}</Btn>
          {tree && <Readout>{tx(t, "figExpr_stepN", "step")} {step} / {ops.length}</Readout>}
        </Row>
        {tree ? <Readout color={curNode ? C.amber : C.green}>{rule}</Readout>
          : <Readout color={C.red}>{tx(t, "figExpr_bad", "Could not read that. Use numbers, + − × ÷ ^ and parentheses.")}</Readout>}
      </>}
      note={tx(t, "figExpr_note", "The parser turns the text into a tree: every operator is a node and its two operands hang below it. Operators that bind more tightly (^ before × ÷ before + −) end up lower in the tree, so they are reached first when you evaluate from the bottom up. Press step to collapse one operator at a time; the amber part of the expression is what is being computed. Try the pairs 2 + 3 × 4 / (2 + 3) × 4 and −3^2 / (−3)^2, and type your own.")}
    >
      <div className="px-4 pt-3 pb-1 font-mono text-[15px] text-[var(--text-main)] text-center min-h-[2rem]">
        {segs.map((g, i) => <span key={i} style={g.hl ? { color: C.amber, fontWeight: 700 } : undefined}>{g.s}</span>)}
      </div>
      {tree && (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {tree.nodes.map((pl, i) => pl.parent && (
            <line key={`e${i}`} x1={gx(pl.parent.x)} y1={gy(pl.parent.d)} x2={gx(pl.x)} y2={gy(pl.d)}
              stroke={C.axis} strokeWidth={1.2} opacity={hidden(pl) || done.has(pl.parent.n.id) ? 0.2 : 1} />
          ))}
          {tree.nodes.map((pl, i) => {
            const n = pl.n, isOp = n.kind !== "num", isDone = done.has(n.id), isCur = n.id === cur;
            const faded = hidden(pl);
            const x = gx(pl.x), y = gy(pl.d);
            const label = !isOp || isDone ? fmt(value(n)) : n.kind === "neg" ? "−( )" : SYM[n.op];
            const col = isCur ? C.amber : isDone ? C.green : isOp ? C.sky : C.fg;
            const w = Math.max(26, label.length * 8 + 12);
            return (
              <g key={`n${i}`} opacity={faded ? 0.2 : 1}>
                {isOp && !isDone
                  ? <circle cx={x} cy={y} r={14} fill="var(--surface)" stroke={col} strokeWidth={isCur ? 2.6 : 1.5} />
                  : <rect x={x - w / 2} y={y - 12} width={w} height={24} rx={6} fill="var(--surface)" stroke={col} strokeWidth={isDone ? 2 : 1} />}
                <T x={x} y={y + 4} size={11} anchor="middle" color={col} bold={isOp}>{label}</T>
              </g>
            );
          })}
          {curNode && <T x={W - 10} y={H - 8} size={9} anchor="end" color={C.amber}>{`${fmt(value(curNode))} ${tx(t, "figExpr_next", "← next result")}`}</T>}
        </svg>
      )}
    </Figure>
  );
}
