"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, C, T } from "@/components/lesson/kit/figure";
import { bstInsert, height, layout, size, TreeSvg, type BT } from "./treeDraw";

// ── What this figure shows ────────────────────────────────────────────────────
// A binary search tree: every key in a node's left subtree is smaller, every
// key in its right subtree is bigger. The slider picks a key to search for;
// the amber path is the search, one comparison per level, ending on the key
// (green) or on an empty spot where it would be inserted. Tapping a node
// deletes it and names which of the three deletion cases applied. Inserting
// keys in sorted order shows the tree degenerating into a list.

const BALANCED = [50, 30, 70, 20, 40, 60, 80, 35, 65];
const SORTED = [10, 20, 30, 40, 50, 60, 70];
const MAX = 15;

const build = (keys: number[]) => keys.reduce<BT | null>((r, k) => bstInsert(r, k), null);

type DelCase = "leaf" | "one" | "two";
function bstRemove(n: BT | null, key: number, info: { c?: DelCase; succ?: number }): BT | null {
  if (!n) return null;
  if (key < n.key) return { ...n, left: bstRemove(n.left, key, info) };
  if (key > n.key) return { ...n, right: bstRemove(n.right, key, info) };
  if (!n.left && !n.right) { info.c = "leaf"; return null; }
  if (!n.left || !n.right) { info.c = "one"; return n.left ?? n.right; }
  let m = n.right;                                   // successor: leftmost of the right subtree
  while (m.left) m = m.left;
  info.c = "two"; info.succ = m.key;
  return { ...n, key: m.key, right: bstRemove(n.right, m.key, {}) };
}

function searchPath(n: BT | null, key: number): { path: number[]; found: boolean } {
  const path: number[] = [];
  while (n) {
    path.push(n.key);
    if (key === n.key) return { path, found: true };
    n = key < n.key ? n.left : n.right;
  }
  return { path, found: false };
}

const W = 560, H = 250;

export function BSTFigure({ t }: { t?: TrackTranslations }) {
  const [root, setRoot] = useState<BT | null>(() => build(BALANCED));
  const [target, setTarget] = useState(35);
  const [msg, setMsg] = useState<string | null>(null);
  const n = size(root), h = height(root);
  const levelH = Math.min(44, (H - 80) / Math.max(1, h));
  const placed = useMemo(() => layout(root, W, 22, levelH), [root, levelH]);
  const { path, found } = searchPath(root, target);

  const insertRandom = () => {
    if (n >= MAX) return;
    let k = 0;
    do k = 1 + Math.floor(Math.random() * 99); while (searchPath(root, k).found);
    setRoot(bstInsert(root, k));
    setMsg(`${tx(t, "figBst_inserted", "inserted")} ${k}: ${tx(t, "figBst_insHow", "search for it, attach it where the search fell off")}`);
  };
  const remove = (node: BT) => {
    const info: { c?: DelCase; succ?: number } = {};
    setRoot(bstRemove(root, node.key, info));
    setMsg(info.c === "leaf" ? `${node.key}: ${tx(t, "figBst_leaf", "a leaf, simply removed")}`
      : info.c === "one" ? `${node.key}: ${tx(t, "figBst_one", "one child, which takes its place")}`
      : `${node.key}: ${tx(t, "figBst_two", "two children; replaced by its successor")} ${info.succ}`);
  };

  return (
    <Figure
      title={tx(t, "figBst_title", "A binary search tree")}
      controls={<>
        <Row>
          <Btn onClick={insertRandom}>{tx(t, "figBst_insert", "insert a random key")}</Btn>
          <Btn onClick={() => { setRoot(build(BALANCED)); setMsg(null); }}>{tx(t, "figBst_reset", "reset")}</Btn>
          <Btn onClick={() => { setRoot(build(SORTED)); setMsg(tx(t, "figBst_sortedMsg", "10, 20, …, 70 inserted in order: every key goes right")); }}>{tx(t, "figBst_sorted", "insert 10…70 in order")}</Btn>
        </Row>
        <Slider label={tx(t, "figBst_search", "search for")} value={target} min={1} max={99} step={1} onChange={setTarget} fmt={v => String(v)} />
        <Row>
          <Readout>n = {n}</Readout>
          <Readout>{tx(t, "figBst_height", "height")} = {h}</Readout>
          <Readout color={found ? C.green : C.red}>{tx(t, "figBst_comparisons", "comparisons")}: {path.length} · {found ? tx(t, "figBst_found", "found") : tx(t, "figBst_notFound", "not found")}</Readout>
        </Row>
      </>}
      note={tx(t, "figBst_note", "Searching, inserting and deleting all walk one root-to-leaf path, so each costs O(h), where h is the height. With keys arriving in a mixed order h stays near log₂ n; in sorted order every new key becomes a right child and the tree turns into a linked list with h = n − 1. Tap any node to delete it.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <TreeSvg placed={placed} onPick={remove}
          style={nd => nd.key === target ? { fill: C.green, ring: C.green } : path.includes(nd.key) ? { fill: C.amber, ring: C.amber } : undefined} />
        <T x={16} y={H - 24} size={10} color={C.fg} bold>{msg ?? tx(t, "figBst_tap", "tap a node to delete it")}</T>
        <T x={16} y={H - 8} size={9}>{tx(t, "figBst_path", "path")}: {path.join(" → ")}</T>
      </svg>
    </Figure>
  );
}
