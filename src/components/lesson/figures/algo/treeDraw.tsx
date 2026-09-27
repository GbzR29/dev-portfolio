"use client";

import { C, T } from "@/components/lesson/kit/figure";

// ── Binary trees shared by the tree figures ───────────────────────────────────
// A tree is laid out the textbook way: x from the node's in-order position
// (so every left subtree sits to the left of its parent), y from its depth.
// Trees are immutable here: operations return new nodes, so React state can
// hold a root directly.

export type BT = { key: number; label?: string; left: BT | null; right: BT | null };

export type Placed = { node: BT; x: number; y: number; depth: number; parent: Placed | null };

export const leaf = (key: number, label?: string): BT => ({ key, label, left: null, right: null });

/** Height in edges: an empty tree is −1, a single node 0. */
export const height = (n: BT | null): number => (n ? 1 + Math.max(height(n.left), height(n.right)) : -1);
export const size = (n: BT | null): number => (n ? 1 + size(n.left) + size(n.right) : 0);

export function bstInsert(n: BT | null, key: number): BT {
  if (!n) return leaf(key);
  if (key < n.key) return { ...n, left: bstInsert(n.left, key) };
  if (key > n.key) return { ...n, right: bstInsert(n.right, key) };
  return n;
}

export function layout(root: BT | null, W: number, top: number, levelH: number, maxStep = 46, margin = 22): Placed[] {
  const out: Placed[] = [];
  const walk = (n: BT | null, depth: number, parent: Placed | null) => {
    if (!n) return;
    const me: Placed = { node: n, x: 0, y: top + depth * levelH, depth, parent };
    walk(n.left, depth + 1, me);
    out.push(me);
    walk(n.right, depth + 1, me);
  };
  walk(root, 0, null);
  const k = out.length;
  const step = k > 1 ? Math.min(maxStep, (W - 2 * margin) / (k - 1)) : 0;
  const x0 = W / 2 - (step * (k - 1)) / 2;
  out.forEach((p, i) => { p.x = x0 + i * step; });
  return out;
}

export type NodeStyle = { fill?: string; ring?: string; opacity?: number };

/** Draws edges, then nodes. `style` colours a node; `note` writes a small tag beside it. */
export function TreeSvg({ placed, style, note, onPick, r = 13 }: {
  placed: Placed[];
  style?: (n: BT) => NodeStyle | undefined;
  note?: (n: BT) => { text: string; color?: string } | undefined;
  onPick?: (n: BT) => void;
  r?: number;
}) {
  return <g>
    {placed.map((p, i) => p.parent && (
      <line key={"e" + i} x1={p.parent.x} y1={p.parent.y} x2={p.x} y2={p.y} stroke={C.axis} strokeWidth={1.5} />
    ))}
    {placed.map((p, i) => {
      const s = style?.(p.node) ?? {};
      const fill = s.fill ?? C.sky;
      const tag = note?.(p.node);
      return <g key={"n" + i} onClick={onPick ? () => onPick(p.node) : undefined} style={{ cursor: onPick ? "pointer" : undefined }} opacity={s.opacity ?? 1}>
        <circle cx={p.x} cy={p.y} r={r} fill={C.bg} />
        <circle cx={p.x} cy={p.y} r={r} fill={fill} fillOpacity={0.3} stroke={s.ring ?? fill} strokeWidth={s.ring ? 2.2 : 1.2} />
        <T x={p.x} y={p.y + 4} size={r > 11 ? 11 : 9.5} anchor="middle" color={C.fg} bold>{p.node.label ?? p.node.key}</T>
        {tag && <T x={p.x + r + 1} y={p.y - r + 3} size={8} color={tag.color ?? C.muted} bold>{tag.text}</T>}
      </g>;
    })}
  </g>;
}
