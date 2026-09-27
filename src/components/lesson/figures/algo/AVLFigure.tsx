"use client";

import { useMemo, useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, lerp } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { bstInsert, height, layout, leaf, TreeSvg, type BT } from "./treeDraw";

// ── What this figure shows ────────────────────────────────────────────────────
// "rotate": the one move every balanced tree is built from. A right rotation
// at y lifts its left child x; x's right subtree B changes parent. Only three
// pointers change and the in-order sequence A x B y C stays the same, so the
// search-tree order is kept. A left rotation at x undoes it.
// "avl": keys are inserted one at a time into an AVL tree. The small number
// by each node is its balance factor, height(left) − height(right); when an
// insertion makes it +2 or −2 somewhere, one or two rotations at the lowest
// such node repair it. The readout compares the height with a plain BST that
// received the same keys.

const title = (t?: TrackTranslations) => tx(t, "figAvl_title", "Rotations and AVL trees");
const note = (t?: TrackTranslations) => tx(t, "figAvl_note", "A rotation is O(1): three pointer writes. An AVL insertion walks down once, O(log n), then on the way back up fixes the first unbalanced node with one single or double rotation. Inserting 1, 2, …, 15 in order makes a plain BST a 15-node chain of height 14; the AVL tree ends as a perfect tree of height 3.");

export function AVLFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"rotate" | "avl">("rotate");
  const head = <Choice value={mode} onChange={setMode} options={[["rotate", tx(t, "figAvl_rotate", "rotation")], ["avl", tx(t, "figAvl_avl", "AVL insert")]] as const} />;
  return mode === "rotate" ? <RotateView t={t} head={head} /> : <AvlView t={t} head={head} />;
}

// ── Rotation ──────────────────────────────────────────────────────────────────
type P = { x: number; y: number };
const mix = (a: P, b: P, p: number): P => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });
const POS: Record<string, [P, P]> = {           // [before (y on top), after (x on top)]
  y: [{ x: 280, y: 40 }, { x: 370, y: 100 }],
  x: [{ x: 190, y: 100 }, { x: 280, y: 40 }],
  A: [{ x: 140, y: 150 }, { x: 210, y: 100 }],
  B: [{ x: 240, y: 150 }, { x: 330, y: 150 }],
  C: [{ x: 350, y: 100 }, { x: 420, y: 150 }],
};

function RotateView({ t, head }: { t?: TrackTranslations; head: ReactNode }) {
  const s = useStepper(1, 900, 0);
  const at = (k: string) => mix(POS[k][0], POS[k][1], s.p);
  const edge = (a: P, b: P, color: string = C.axis) => <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={1.8} />;
  const tri = (k: string) => { const p = at(k); return <g key={k}>
    <path d={`M${p.x} ${p.y} l-24 46 h48 z`} fill={k === "B" ? C.pink : C.teal} fillOpacity={0.22} stroke={k === "B" ? C.pink : C.teal} />
    <T x={p.x} y={p.y + 34} size={12} anchor="middle" color={C.fg} bold>{k}</T>
  </g>; };
  const circ = (k: string) => { const p = at(k); return <g key={k}>
    <circle cx={p.x} cy={p.y} r={15} fill={C.bg} />
    <circle cx={p.x} cy={p.y} r={15} fill={C.purple} fillOpacity={0.3} stroke={C.purple} />
    <T x={p.x} y={p.y + 4} size={12} anchor="middle" color={C.fg} bold>{k}</T>
  </g>; };
  const bParent = s.p < 0.5 ? at("x") : at("y");
  const done = s.raw >= 1;

  return (
    <Figure title={title(t)} head={head} note={note(t)} controls={<>
      <Row>
        <Btn active={!done} onClick={s.next}>{tx(t, "figAvl_rotR", "rotate right at y")}</Btn>
        <Btn active={done} onClick={s.prev}>{tx(t, "figAvl_rotL", "rotate left at x")}</Btn>
      </Row>
      <Row><Readout>{tx(t, "figAvl_inorder", "in-order")}: A &lt; x &lt; B &lt; y &lt; C</Readout><Readout color={C.pink}>{tx(t, "figAvl_moves", "B changes parent")}</Readout></Row>
    </>}>
      <svg viewBox="0 0 560 230" className="w-full h-auto" role="img">
        {edge(at("x"), at("y"))}
        {edge(at("x"), at("A"))}
        {edge(at("y"), at("C"))}
        {edge(bParent, at("B"), C.pink)}
        {["A", "B", "C"].map(tri)}
        {["x", "y"].map(circ)}
        <T x={16} y={222} size={10} color={C.fg} bold>
          {done ? tx(t, "figAvl_after", "after: x is the root, y its right child, B is y's left subtree")
                : tx(t, "figAvl_before", "before: y is the root, x its left child, B is x's right subtree")}
        </T>
      </svg>
    </Figure>
  );
}

// ── AVL insertion ─────────────────────────────────────────────────────────────
type Fix = { kind: "LL" | "RR" | "LR" | "RL"; at: number };
const bf = (n: BT) => height(n.left) - height(n.right);
const rotR = (y: BT): BT => { const x = y.left!; return { ...x, right: { ...y, left: x.right } }; };
const rotL = (x: BT): BT => { const y = x.right!; return { ...y, left: { ...x, right: y.left } }; };

function avlInsert(n: BT | null, key: number, log: Fix[]): BT {
  if (!n) return leaf(key);
  if (key < n.key) n = { ...n, left: avlInsert(n.left, key, log) };
  else if (key > n.key) n = { ...n, right: avlInsert(n.right, key, log) };
  else return n;
  const b = bf(n);
  if (b > 1) {
    if (bf(n.left!) >= 0) { log.push({ kind: "LL", at: n.key }); return rotR(n); }
    log.push({ kind: "LR", at: n.key }); return rotR({ ...n, left: rotL(n.left!) });
  }
  if (b < -1) {
    if (bf(n.right!) <= 0) { log.push({ kind: "RR", at: n.key }); return rotL(n); }
    log.push({ kind: "RL", at: n.key }); return rotL({ ...n, right: rotR(n.right!) });
  }
  return n;
}

const SEQS = {
  asc: Array.from({ length: 15 }, (_, i) => i + 1),
  zig: [10, 20, 15, 5, 7, 30, 25, 27, 1, 3, 2, 40],
};

function AvlView({ t, head }: { t?: TrackTranslations; head: ReactNode }) {
  const [seq, setSeq] = useState<keyof typeof SEQS>("asc");
  const [k, setK] = useState(0);
  const keys = SEQS[seq];
  const { avl, plain, fix } = useMemo(() => {
    let avl: BT | null = null, plain: BT | null = null, fix: Fix | null = null;
    for (let i = 0; i < k; ++i) {
      const log: Fix[] = [];
      avl = avlInsert(avl, keys[i], log);
      plain = bstInsert(plain, keys[i]);
      fix = log[0] ?? null;
    }
    return { avl, plain, fix };
  }, [keys, k]);
  const placed = useMemo(() => layout(avl, 560, 24, 42, 34), [avl]);
  const last = k > 0 ? keys[k - 1] : null;
  const fixText = (f: Fix) => ({
    LL: tx(t, "figAvl_LL", "left-left: one right rotation at"),
    RR: tx(t, "figAvl_RR", "right-right: one left rotation at"),
    LR: tx(t, "figAvl_LR", "left-right: left rotation at its child, then right rotation at"),
    RL: tx(t, "figAvl_RL", "right-left: right rotation at its child, then left rotation at"),
  }[f.kind] + " " + f.at);

  return (
    <Figure title={title(t)} head={head} note={note(t)} controls={<>
      <Row>
        <Btn active={seq === "asc"} onClick={() => { setSeq("asc"); setK(0); }}>1, 2, …, 15</Btn>
        <Btn active={seq === "zig"} onClick={() => { setSeq("zig"); setK(0); }}>{tx(t, "figAvl_zig", "zig-zag keys")}</Btn>
      </Row>
      <Row>
        <Btn onClick={() => setK(Math.min(keys.length, k + 1))}>{tx(t, "figAvl_next", "insert next")}{k < keys.length ? ` (${keys[k]})` : ""}</Btn>
        <Btn onClick={() => setK(keys.length)}>{tx(t, "figAvl_all", "insert all")}</Btn>
        <Btn onClick={() => setK(0)}>{tx(t, "figAvl_reset", "reset")}</Btn>
      </Row>
      <Row>
        <Readout>n = {k}</Readout>
        <Readout color={C.green}>{tx(t, "figAvl_hAvl", "AVL height")} = {height(avl)}</Readout>
        <Readout color={C.red}>{tx(t, "figAvl_hPlain", "plain BST height")} = {height(plain)}</Readout>
      </Row>
    </>}>
      <svg viewBox="0 0 560 230" className="w-full h-auto" role="img">
        <TreeSvg placed={placed} r={12}
          style={nd => nd.key === last ? { fill: C.amber, ring: C.amber } : fix && nd.key === fix.at ? { fill: C.purple, ring: C.purple } : undefined}
          note={nd => { const b = bf(nd); return { text: b > 0 ? `+${b}` : String(b), color: b === 0 ? C.muted : C.orange }; }} />
        <T x={16} y={220} size={10} color={fix ? C.purple : C.fg} bold>
          {last === null ? tx(t, "figAvl_start", "empty tree: press insert")
            : `${tx(t, "figAvl_inserted", "inserted")} ${last}: ${fix ? fixText(fix) : tx(t, "figAvl_noFix", "every balance factor is −1, 0 or +1, no rotation")}`}
        </T>
      </svg>
    </Figure>
  );
}
