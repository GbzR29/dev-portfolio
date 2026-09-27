"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A trie (prefix tree) holding a small set of words. Each edge is one letter;
// the letters on the path from the root spell a prefix, and a node with a
// thick green ring ends a stored word. Picking a prefix walks down one letter
// per level (amber); everything below the node it reaches (purple) is the set
// of words with that prefix, which is how autocomplete works. Adding a word
// shares every node of its longest prefix already in the trie.

type TNode = { path: string; ch: string; end: boolean; kids: TNode[] };
type Placed = { n: TNode; x: number; y: number; parent: Placed | null };

const START = ["car", "card", "care", "cat", "do", "dog", "dot"];
const EXTRA = ["cart", "cab", "dots", "zoo"];
const PREFIXES = ["c", "ca", "car", "do", "z", "cx"];

function build(words: string[]): TNode {
  const root: TNode = { path: "", ch: "", end: false, kids: [] };
  for (const w of words) {
    let n = root;
    for (const ch of w) {
      let k = n.kids.find(c => c.ch === ch);
      if (!k) { k = { path: n.path + ch, ch, end: false, kids: [] }; n.kids.push(k); n.kids.sort((a, b) => a.ch.localeCompare(b.ch)); }
      n = k;
    }
    n.end = true;
  }
  return root;
}

function place(root: TNode, W: number): Placed[] {
  const out: Placed[] = [];
  let leaves = 0;
  const countLeaves = (n: TNode): number => (n.kids.length ? n.kids.reduce((s, k) => s + countLeaves(k), 0) : 1);
  const total = countLeaves(root);
  const step = Math.min(64, (W - 40) / Math.max(1, total - 1));
  const x0 = W / 2 - (step * (total - 1)) / 2;
  const walk = (n: TNode, depth: number, parent: Placed | null): Placed => {
    const me: Placed = { n, x: 0, y: 24 + depth * 38, parent };
    out.push(me);
    if (!n.kids.length) me.x = x0 + step * leaves++;
    else {
      const kids = n.kids.map(k => walk(k, depth + 1, me));
      me.x = (kids[0].x + kids[kids.length - 1].x) / 2;
    }
    return me;
  };
  walk(root, 0, null);
  return out;
}

function words(n: TNode, acc: string[] = []): string[] {
  if (n.end) acc.push(n.path);
  n.kids.forEach(k => words(k, acc));
  return acc;
}

const W = 560, H = 230;

export function TrieFigure({ t }: { t?: TrackTranslations }) {
  const [list, setList] = useState<string[]>(START);
  const [prefix, setPrefix] = useState("ca");
  const root = useMemo(() => build(list), [list]);
  const placed = useMemo(() => place(root, W), [root]);

  // Walk the prefix down from the root
  let node: TNode | null = root, depth = 0;
  for (const ch of prefix) {
    const k: TNode | undefined = node!.kids.find(c => c.ch === ch);
    if (!k) { node = null; break; }
    node = k; depth++;
  }
  const matches = node ? words(node) : [];
  const onPath = (p: string) => p.length > 0 && prefix.startsWith(p) && p.length <= depth;
  const below = (p: string) => node !== null && p.startsWith(node.path) && p.length > node.path.length;
  const nodes = placed.length - 1;

  return (
    <Figure
      title={tx(t, "figTrie_title", "A trie of words")}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figTrie_prefix", "prefix")}:</span>
          {PREFIXES.map(p => <Btn key={p} active={prefix === p} onClick={() => setPrefix(p)}>{p}</Btn>)}
        </Row>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figTrie_add", "add")}:</span>
          {EXTRA.map(w => <Btn key={w} active={list.includes(w)} onClick={() => !list.includes(w) && setList([...list, w])}>{w}</Btn>)}
          <Btn onClick={() => setList(START)}>{tx(t, "figTrie_reset", "reset")}</Btn>
        </Row>
        <Row>
          <Readout>{tx(t, "figTrie_words", "words")} = {list.length}</Readout>
          <Readout>{tx(t, "figTrie_nodes", "nodes (without the root)")} = {nodes}</Readout>
          <Readout>{tx(t, "figTrie_letters", "letters in all words")} = {list.reduce((s, w) => s + w.length, 0)}</Readout>
        </Row>
      </>}
      note={tx(t, "figTrie_note", "Finding a prefix of length L takes L steps, one per letter, no matter how many words are stored. Words that share a beginning share its nodes, so the trie needs fewer nodes than the total number of letters. A node marks the end of a word separately from having children: \"car\" is a word and also the start of \"card\" and \"care\".")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {placed.map((p, i) => p.parent && <g key={"e" + i}>
          <line x1={p.parent.x} y1={p.parent.y} x2={p.x} y2={p.y} stroke={onPath(p.n.path) ? C.amber : C.axis} strokeWidth={onPath(p.n.path) ? 2.5 : 1.5} />
        </g>)}
        {placed.map((p, i) => {
          const hot = onPath(p.n.path), sub = below(p.n.path);
          const col = p.n.path === "" ? C.muted : hot ? C.amber : sub ? C.purple : C.sky;
          return <g key={"n" + i}>
            <circle cx={p.x} cy={p.y} r={11} fill={C.bg} />
            <circle cx={p.x} cy={p.y} r={11} fill={col} fillOpacity={hot || sub ? 0.4 : 0.2} stroke={p.n.end ? C.green : col} strokeWidth={p.n.end ? 3 : 1} />
            <T x={p.x} y={p.y + 4} size={11} anchor="middle" color={C.fg} bold>{p.n.path === "" ? "·" : p.n.ch}</T>
          </g>;
        })}
        <T x={16} y={H - 10} size={10} color={node ? C.fg : C.red} bold>
          {node
            ? `"${prefix}" → ${matches.length ? matches.join(", ") : tx(t, "figTrie_noneEnd", "the prefix exists but no word below it")}`
            : `"${prefix}": ${tx(t, "figTrie_missing", "the walk falls off after")} "${prefix.slice(0, depth)}" — ${tx(t, "figTrie_none", "no word starts with it")}`}
        </T>
      </svg>
    </Figure>
  );
}
