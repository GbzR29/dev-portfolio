// ── Model of the containers figure ────────────────────────────────────────────
// The same keys stored three ways: a std::vector searched front to back, a
// std::map (a red-black tree; this one is built with Okasaki's insertion,
// which gives a valid red-black tree though not always the exact shape
// libstdc++ builds) and a std::unordered_map (buckets of chains, FNV-1a hash,
// bucket count doubling when the load factor passes 1; real implementations
// use their own hash and, in libstdc++, prime bucket counts).

export const ITEMS = [
  "sword", "shield", "potion", "bow", "arrow", "helm", "ring", "map", "torch", "key",
  "rope", "gem", "boots", "cloak", "lamp", "bomb", "coin", "axe", "wand", "orb",
];
export const MISSING = "dragon";

// ── Red-black tree ────────────────────────────────────────────────────────────

export type RB = { color: "R" | "B"; key: string; left: RB | null; right: RB | null } | null;

const node = (color: "R" | "B", left: RB, key: string, right: RB): RB => ({ color, key, left, right });

function balance(color: "R" | "B", l: RB, key: string, r: RB): RB {
  if (color === "B") {
    if (l?.color === "R" && l.left?.color === "R")
      return node("R", node("B", l.left.left, l.left.key, l.left.right), l.key, node("B", l.right, key, r));
    if (l?.color === "R" && l.right?.color === "R")
      return node("R", node("B", l.left, l.key, l.right.left), l.right.key, node("B", l.right.right, key, r));
    if (r?.color === "R" && r.left?.color === "R")
      return node("R", node("B", l, key, r.left.left), r.left.key, node("B", r.left.right, r.key, r.right));
    if (r?.color === "R" && r.right?.color === "R")
      return node("R", node("B", l, key, r.left), r.key, node("B", r.right.left, r.right.key, r.right.right));
  }
  return node(color, l, key, r);
}

function ins(t: RB, key: string): RB {
  if (!t) return node("R", null, key, null);
  if (key < t.key) return balance(t.color, ins(t.left, key), t.key, t.right);
  if (key > t.key) return balance(t.color, t.left, t.key, ins(t.right, key));
  return t;
}

export function rbInsert(t: RB, key: string): RB {
  const r = ins(t, key)!;
  return { ...r, color: "B" };
}

/** Keys visited from the root while looking for key. */
export function rbPath(t: RB, key: string): string[] {
  const path: string[] = [];
  while (t) {
    path.push(t.key);
    if (key === t.key) break;
    t = key < t.key ? t.left : t.right;
  }
  return path;
}

export type Placed = { key: string; color: "R" | "B"; x: number; y: number; px?: number; py?: number };

/** x = in-order rank, y = depth; each node also carries its parent's position. */
export function rbLayout(t: RB): { nodes: Placed[]; depth: number } {
  const nodes: Placed[] = [];
  let rank = 0, depth = 0;
  const walk = (n: RB, d: number) => {
    if (!n) return;
    const me: Placed = { key: n.key, color: n.color, x: 0, y: d };
    walk(n.left, d + 1);
    me.x = rank++;
    nodes.push(me);
    depth = Math.max(depth, d);
    walk(n.right, d + 1);
  };
  walk(t, 0);
  // second pass for parent coordinates (the in-order rank is only known after the walk)
  const pos = new Map(nodes.map(n => [n.key, n]));
  const link = (n: RB, parent?: Placed) => {
    if (!n) return;
    const me = pos.get(n.key)!;
    if (parent) { me.px = parent.x; me.py = parent.y; }
    link(n.left, me); link(n.right, me);
  };
  link(t);
  return { nodes, depth };
}

// ── Hash table ────────────────────────────────────────────────────────────────

export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

export function bucketCount(n: number): number {
  let b = 8;
  while (n > b) b *= 2;              // keep the load factor n / b at most 1
  return b;
}

export function buckets(keys: string[]): string[][] {
  const b = bucketCount(keys.length);
  const out: string[][] = Array.from({ length: b }, () => []);
  for (const k of keys) out[fnv1a(k) % b].push(k);
  return out;
}
