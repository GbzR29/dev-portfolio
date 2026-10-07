"use client";

import { useEffect, useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

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

/**
 * The value a flat expression (numbers with + − × ÷, nothing else) would get if
 * it were read strictly left to right, ignoring precedence; null otherwise.
 */
function naiveLeftToRight(src: string): number | null {
  const s = src.replace(/[−–]/g, "-").replace(/[×·*]/g, "*").replace(/[÷/:]/g, "/").replace(/\s+/g, "");
  if (!/^\d+(?:\.\d+)?(?:[-+*/]\d+(?:\.\d+)?)+$/.test(s)) return null;
  const toks = s.match(/\d+(?:\.\d+)?|[-+*/]/g)!;
  let v = Number(toks[0]);
  for (let i = 1; i < toks.length; i += 2) {
    const b = Number(toks[i + 1]), op = toks[i];
    v = op === "+" ? v + b : op === "-" ? v - b : op === "*" ? v * b : v / b;
  }
  return v;
}

export function ExpressionTreeFigure({ t }: { t?: TrackTranslations }) {
  const [src, setSrc] = useState(PRESETS[2]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);       // expressions evaluated to the end
  const [speed] = useFigureSpeed();
  const lab = useLab("math-expression-tree");
  const vis = useVisible<HTMLDivElement>();
  const tree = useMemo(() => {
    const root = parse(src);
    if (!root) return null;
    return { root, ops: order(root), ...layout(root) };
  }, [src]);
  const load = (s: string) => { setSrc(s); setStep(0); setPlaying(false); };
  const count = tree?.ops.length ?? 0;
  const finished = !!tree && step >= count;

  // Playing collapses one operator per beat
  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (step >= count) { setPlaying(false); return; }
    const id = setTimeout(() => setStep(s => Math.min(count, s + 1)), scaledMs(900, speed));
    return () => clearTimeout(id);
  }, [playing, step, count, speed, vis.on, lab.open]);

  // Remember which expressions were followed to the end (lab goals)
  useEffect(() => {
    if (finished && !seen.includes(src)) setSeen(s => [...s, src]);
  }, [finished, src, seen]);

  const play = () => {
    if (playing) { setPlaying(false); return; }
    if (finished) setStep(0);
    setPlaying(true);
  };

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

  const result = tree ? value(tree.root) : NaN;
  const naive = naiveLeftToRight(src);

  const stage = (
    <div>
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
      <p className="px-4 pb-1 text-center text-[12.5px] min-h-[1.4rem]" style={{ color: !tree ? C.red : curNode ? C.amber : C.green }}>
        {tree ? rule : tx(t, "figExpr_bad", "Could not read that. Use numbers, + − × ÷ ^ and parentheses.")}
      </p>
      {tree && (
        <Transport t={t} speed playing={playing} onPlay={play}
          playLabel={tx(t, "figExpr_play", "evaluate step by step")}
          onStep={step < count ? () => { setPlaying(false); setStep(s => Math.min(count, s + 1)); } : undefined}
          onBack={step > 0 ? () => { setPlaying(false); setStep(s => Math.max(0, s - 1)); } : undefined}
          onReset={() => { setPlaying(false); setStep(0); }}
          readout={`${tx(t, "figExpr_stepN", "step")} ${step} / ${count}`} />
      )}
    </div>
  );

  const pick = (
    <>
      <Row>
        {PRESETS.map(s => <Btn key={s} active={s === src} onClick={() => load(s)}>{s}</Btn>)}
      </Row>
      <Row>
        <input value={src} onChange={e => load(e.target.value)} aria-label={tx(t, "figExpr_input", "expression")}
          className="w-56 px-2 py-1 text-[13px] font-mono rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)]" />
        {tree && finished && <Readout color={C.green}>= {fmt(result)}</Readout>}
      </Row>
    </>
  );

  // ── Lab ──
  const ran = (s: string) => seen.includes(s);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figExprL1_t", "Which goes first?"),
      body: <>
        <p>{tx(t, "figExprL1_b1", "2 + 3 × 4 written as a tree: the × hangs lower than the +, so it is reached first when you work from the bottom up.")}</p>
        <p>{tx(t, "figExprL1_b2", "Press ⏭ to collapse one operation at a time, or ▶ to watch it run.")}</p>
      </>,
      goal: { text: tx(t, "figExprL1_g", "Evaluate 2 + 3 × 4 to the end."), done: ran("2 + 3 × 4") },
      focus: "step",
      setup: () => load("2 + 3 × 4"),
    },
    {
      title: tx(t, "figExprL2_t", "Parentheses change the tree"),
      body: <>
        <p>{tx(t, "figExprL2_b1", "Now (2 + 3) × 4. The parentheses push the + down below the ×: the tree turns upside down, and the answer changes from 14 to 20.")}</p>
        <p>{tx(t, "figExprL2_b2", "That is all parentheses do: they decide the shape of the tree.")}</p>
      </>,
      goal: { text: tx(t, "figExprL2_g", "Evaluate (2 + 3) × 4 to the end."), done: ran("(2 + 3) × 4") },
      focus: "play",
      setup: () => load("(2 + 3) × 4"),
    },
    {
      title: tx(t, "figExprL3_t", "Same level: left to right"),
      body: <>
        <p>{tx(t, "figExprL3_b1", "× and ÷ share a level, and so do + and −. Within a level, work from left to right: the leftmost operation sits lowest in the tree.")}</p>
        <p>{tx(t, "figExprL3_b2", "Watch 8 ÷ 4 ÷ 2. Is it 8 ÷ 2 = 4, or 2 ÷ 2 = 1?")}</p>
      </>,
      goal: { text: tx(t, "figExprL3_g", "Evaluate 8 ÷ 4 ÷ 2 to the end."), done: ran("8 ÷ 4 ÷ 2") },
      focus: "play",
      setup: () => load("8 ÷ 4 ÷ 2"),
    },
    {
      title: tx(t, "figExprL4_t", "Quick check"),
      body: <p>{tx(t, "figExprL4_b", "Subtraction is done left to right too.")}</p>,
      quiz: {
        q: tx(t, "figExprL4_q", "What is 10 − 4 − 3?"),
        options: ["3", "9", "11", "1"],
        answer: 0,
        why: tx(t, "figExprL4_w", "(10 − 4) − 3 = 6 − 3 = 3. Doing the right-hand subtraction first, 10 − (4 − 3) = 9, changes the meaning."),
      },
    },
    {
      title: tx(t, "figExprL5_t", "A minus sign and a power"),
      body: <>
        <p>{tx(t, "figExprL5_b1", "In −3^2 the power is attached to the 3 only: square first, then apply the minus. The result is −9.")}</p>
        <p>{tx(t, "figExprL5_b2", "To square the negative number you need parentheses. Choose (−3)^2 and compare the trees.")}</p>
      </>,
      goal: { text: tx(t, "figExprL5_g", "Evaluate both −3^2 and (−3)^2 to the end."), done: ran("−3^2") && ran("(−3)^2") },
      setup: () => load("−3^2"),
    },
    {
      title: tx(t, "figExprL6_t", "Build your own tree"),
      body: <>
        <p>{tx(t, "figExprL6_b1", "Type in the box. Use the numbers 2, 4, 1 and 3 in this order, any operations, and parentheses where you need them.")}</p>
        <p>{tx(t, "figExprL6_b2", "Make the value 24, and check it by evaluating the tree.")}</p>
      </>,
      goal: { text: tx(t, "figExprL6_g", "An expression with 2, 4, 1, 3 (in order) whose value is 24, evaluated to the end."), done: finished && Math.abs(result - 24) < 1e-9 && src.replace(/[^\d]/g, "") === "2413" },
      hint: tx(t, "figExprL6_h", "Add first inside each pair: (2 + 4) × (1 + 3)."),
      setup: () => load("2 + 4 × 1 + 3"),
    },
    {
      title: tx(t, "figExprL7_t", "Quick check"),
      body: <p>{tx(t, "figExprL7_b", "The famous one from social media. Parentheses first, then × and ÷ from left to right.")}</p>,
      quiz: {
        q: tx(t, "figExprL7_q", "What is 6 ÷ 2 × (1 + 2)?"),
        options: ["9", "1", "6", "3"],
        answer: 0,
        why: tx(t, "figExprL7_w", "1 + 2 = 3 first. Then ÷ and × from left to right: 6 ÷ 2 = 3, and 3 × 3 = 9. Getting 1 means doing the × before the ÷."),
      },
      setup: () => load("6 ÷ 2 × (1 + 2)"),
    },
  ];

  const insights: Insight[] = [
    {
      id: "naive", tone: "warn", when: naive !== null && Math.abs(naive - result) > 1e-9,
      title: tx(t, "figExprI1_t", "Left to right would be wrong here"),
      body: fill(tx(t, "figExprI1_b", "Read strictly from left to right, ignoring the levels, this would give {n}. With × and ÷ first it is {v}."), { n: fmt(naive ?? 0), v: fmt(result) }),
    },
    {
      id: "negpow", tone: "info", when: !!tree && tree.root.kind === "neg" && src.includes("^"),
      title: tx(t, "figExprI2_t", "The power comes before the minus"),
      body: tx(t, "figExprI2_b", "The minus is at the top of the tree: it is applied last, to the result of the power. That is why −3^2 = −9."),
    },
    {
      id: "tower", tone: "info", when: /\^\s*\d+\s*\^/.test(src),
      title: tx(t, "figExprI3_t", "A tower is read from the top"),
      body: tx(t, "figExprI3_b", "A chain of powers is the one place that goes right to left: 2^3^2 = 2^(3^2) = 2⁹ = 512. The upper power hangs lowest in the tree."),
    },
    {
      id: "root", tone: "ok", when: finished,
      title: tx(t, "figExprI4_t", "One number left"),
      body: fill(tx(t, "figExprI4_b", "The last operation was the one at the top of the tree, the root. The value is {v}."), { v: fmt(result) }),
    },
  ];

  const title = tx(t, "figExpr_title", "Order of operations as a tree");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<LabButton lab={lab} t={t} />}
        controls={pick}
        note={tx(t, "figExpr_note2", "Every operator is a node and its two operands hang below it. Operators that bind more tightly (^ before × ÷ before + −) sit lower in the tree, so they are reached first when you evaluate from the bottom up. Press ⏭ to collapse one operator at a time; the amber part of the expression is being computed. Try 2 + 3 × 4 against (2 + 3) × 4, and type your own.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage} controls={pick}
        recap={[
          tx(t, "figExprR1", "An expression is a tree: operations that bind tighter sit lower and are done first."),
          tx(t, "figExprR2", "Parentheses only change the shape of the tree, and with it the answer."),
          tx(t, "figExprR3", "Within a level, work left to right: 8 ÷ 4 ÷ 2 = 1 and 10 − 4 − 3 = 3."),
          tx(t, "figExprR4", "A power binds tighter than a leading minus: −3² = −9, (−3)² = 9."),
        ]}
      />
    </>
  );
}
