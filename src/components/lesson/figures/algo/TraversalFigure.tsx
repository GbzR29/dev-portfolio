"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";
import { layout, leaf, TreeSvg, type BT } from "./treeDraw";

// ── What this figure shows ────────────────────────────────────────────────────
// The four standard ways to visit every node of a binary tree, on the same
// nine-node tree. Pre-order visits a node before its subtrees, in-order
// between them, post-order after them; all three are the same recursion with
// the "visit" line moved. Level-order visits depth by depth with a queue.
// The amber node is being visited, green ones are done. For the recursive
// orders the strip shows the call stack (the path from the root down to the
// current call); for level-order it shows the queue.

type Order = "pre" | "in" | "post" | "level";
type Frame = { cur: string | null; out: string[]; aux: string[] };

const node = (l: string, left: BT | null = null, right: BT | null = null): BT => ({ ...leaf(l.charCodeAt(0), l), left, right });
//        F
//      /   \
//     B     G
//    / \     \
//   A   D     I
//      / \   /
//     C   E H
const TREE = node("F", node("B", node("A"), node("D", node("C"), node("E"))), node("G", null, node("I", node("H"))));

function frames(order: Order): Frame[] {
  const out: Frame[] = [{ cur: null, out: [], aux: [] }];
  const done: string[] = [];
  const visit = (n: BT, path: string[]) => { done.push(n.label!); out.push({ cur: n.label!, out: [...done], aux: path }); };
  if (order === "level") {
    const q: BT[] = [TREE];
    out[0].aux = ["F"];
    while (q.length) {
      const n = q.shift()!;
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
      visit(n, q.map(m => m.label!));
    }
  } else {
    const rec = (n: BT | null, path: string[]) => {
      if (!n) return;
      const p = [...path, n.label!];
      if (order === "pre") visit(n, p);
      rec(n.left, p);
      if (order === "in") visit(n, p);
      rec(n.right, p);
      if (order === "post") visit(n, p);
    };
    rec(TREE, []);
  }
  out.push({ cur: null, out: [...done], aux: [] });
  return out;
}

const W = 560, H = 250;

export function TraversalFigure({ t }: { t?: TrackTranslations }) {
  const [order, setOrder] = useState<Order>("pre");
  const fr = useMemo(() => frames(order), [order]);
  const s = useStepper(fr.length - 1, 800, 250);
  const f = fr[Math.min(fr.length - 1, Math.floor(s.raw + 1e-9))];
  const placed = useMemo(() => layout(TREE, W, 30, 48, 52), []);
  const rule = {
    pre: tx(t, "figTrav_rPre", "visit the node, then its left subtree, then its right subtree"),
    in: tx(t, "figTrav_rIn", "left subtree, then the node, then the right subtree"),
    post: tx(t, "figTrav_rPost", "left subtree, then the right subtree, then the node"),
    level: tx(t, "figTrav_rLevel", "take the front of the queue, visit it, add its children at the back"),
  }[order];

  return (
    <Figure
      title={tx(t, "figTrav_title", "Visiting every node of a tree")}
      head={<Choice value={order} onChange={v => { setOrder(v); s.restart(); }} options={[
        ["pre", tx(t, "figTrav_pre", "pre-order")], ["in", tx(t, "figTrav_in", "in-order")],
        ["post", tx(t, "figTrav_post", "post-order")], ["level", tx(t, "figTrav_level", "level-order")],
      ] as const} />}
      controls={<>
        <StepperControls s={s} />
        <Row><Readout>{rule}</Readout></Row>
      </>}
      note={tx(t, "figTrav_note", "Every order visits each node exactly once, so all four are Θ(n). The three depth-first orders differ only in where the visit happens relative to the two recursive calls; in-order on a binary search tree gives the keys sorted. Level-order needs a queue because the nodes of the next level are discovered long before they are visited.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <TreeSvg placed={placed} style={n => n.label === f.cur ? { fill: C.amber, ring: C.amber } : f.out.includes(n.label!) ? { fill: C.green } : undefined}
          note={n => { const i = f.out.indexOf(n.label!); return i >= 0 ? { text: String(i + 1), color: C.green } : undefined; }} />
        <T x={16} y={H - 34} size={10} color={C.fg} bold>{tx(t, "figTrav_out", "output")}: {f.out.join(" ")}</T>
        <T x={16} y={H - 14} size={10} color={order === "level" ? C.purple : C.pink} bold>
          {order === "level" ? tx(t, "figTrav_queue", "queue (front first)") : tx(t, "figTrav_stack", "call stack (root first)")}: {f.aux.length ? f.aux.join(order === "level" ? " " : " → ") : "—"}
        </T>
      </svg>
    </Figure>
  );
}
