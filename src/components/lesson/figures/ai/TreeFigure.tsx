"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, Slider, C, T, plot, f2 } from "@/components/lesson/kit/figure";
import { STUDENTS } from "./data";

// ── What this figure shows ────────────────────────────────────────────────────
// A decision tree grown on the students with Gini impurity, up to the chosen
// depth. Top: every split is a horizontal or vertical cut, so the regions are
// rectangles, each coloured by the majority of the students inside it.
// Bottom: the tree itself, each question with the Gini impurity of its node,
// each leaf with its vote. Depth 2 captures the real pattern; depth 5 keeps
// cutting until the two noisy students sit in boxes of their own.

type Row3 = readonly [number, number, 0 | 1];
type Node = { n: number; pos: number; gini: number; f?: 0 | 1; th?: number; l?: Node; r?: Node };

const gini = (rows: readonly Row3[]) => {
  if (!rows.length) return 0;
  const p = rows.filter(r => r[2]).length / rows.length;
  return 1 - p * p - (1 - p) * (1 - p);
};

/** Greedy CART: at each node try every threshold halfway between neighbouring values of each feature. */
function grow(rows: readonly Row3[], depth: number): Node {
  const node: Node = { n: rows.length, pos: rows.filter(r => r[2]).length, gini: gini(rows) };
  if (depth === 0 || node.gini === 0) return node;
  let best: { f: 0 | 1; th: number; g: number; L: Row3[]; R: Row3[] } | null = null;
  for (const f of [0, 1] as const) {
    const vals = [...new Set(rows.map(r => r[f]))].sort((a, b) => a - b);
    for (let i = 0; i + 1 < vals.length; i++) {
      const th = (vals[i] + vals[i + 1]) / 2;
      const L = rows.filter(r => r[f] < th), R = rows.filter(r => r[f] >= th);
      const g = (L.length * gini(L) + R.length * gini(R)) / rows.length;   // weighted impurity of the children
      if (!best || g < best.g - 1e-12) best = { f, th, g, L, R };
    }
  }
  if (!best || best.g >= node.gini - 1e-12) return node;              // no split helps
  return { ...node, f: best.f, th: best.th, l: grow(best.L, depth - 1), r: grow(best.R, depth - 1) };
}

const predict = (n: Node, x: Row3): number => (n.l && n.r && n.f !== undefined ? (x[n.f] < n.th! ? predict(n.l, x) : predict(n.r, x)) : +(2 * n.pos > n.n));

const P = plot({ W: 620, H: 250, x0: 0, x1: 7, y0: 2.5, y1: 10 });
const TREE_Y = 272, LEVEL = 44, BOX_W = 80, BOX_H = 30;

export function TreeFigure({ t }: { t?: TrackTranslations }) {
  const [depth, setDepth] = useState(2);
  const L = (k: string, en: string) => tx(t, `figAiTree_${k}`, en);
  const feat = (f: 0 | 1) => (f === 0 ? L("study", "study") : L("sleep", "sleep"));

  const root = useMemo(() => grow(STUDENTS, depth), [depth]);
  const correct = STUDENTS.filter(x => predict(root, x) === x[2]).length;

  // regions: recurse with the bounding box each node covers
  const boxes: { x0: number; x1: number; y0: number; y1: number; pred: number }[] = [];
  const cuts: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const walk = (n: Node, b: { x0: number; x1: number; y0: number; y1: number }) => {
    if (!n.l || !n.r || n.f === undefined || n.th === undefined) { boxes.push({ ...b, pred: +(2 * n.pos > n.n) }); return; }
    if (n.f === 0) {
      cuts.push({ x1: n.th, y1: b.y0, x2: n.th, y2: b.y1 });
      walk(n.l, { ...b, x1: n.th }); walk(n.r, { ...b, x0: n.th });
    } else {
      cuts.push({ x1: b.x0, y1: n.th, x2: b.x1, y2: n.th });
      walk(n.l, { ...b, y1: n.th }); walk(n.r, { ...b, y0: n.th });
    }
  };
  walk(root, { x0: P.x0, x1: P.x1, y0: P.y0, y1: P.y1 });

  // tree layout: leaves spread evenly left to right, parents centred over their children
  const nodes: { n: Node; x: number; y: number }[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number; side: "yes" | "no" }[] = [];
  let leaf = 0;
  const leaves = (n: Node): number => (n.l && n.r ? leaves(n.l) + leaves(n.r) : 1);
  const count = leaves(root), slot = P.W / count;
  const place = (n: Node, d: number): number => {                 // returns the node's x
    const y = TREE_Y + d * LEVEL;
    if (!n.l || !n.r) { const x = slot * (leaf++ + 0.5); nodes.push({ n, x, y }); return x; }
    const xl = place(n.l, d + 1), xr = place(n.r, d + 1);
    const x = (xl + xr) / 2;
    nodes.push({ n, x, y });
    edges.push({ x1: x, y1: y + BOX_H, x2: xl, y2: y + LEVEL, side: "yes" }, { x1: x, y1: y + BOX_H, x2: xr, y2: y + LEVEL, side: "no" });
    return x;
  };
  place(root, 0);
  const maxD = Math.max(...nodes.map(n => (n.y - TREE_Y) / LEVEL));
  const H = TREE_Y + maxD * LEVEL + BOX_H + 6;

  return (
    <Figure
      title={L("title", "A decision tree, grown split by split")}
      controls={<>
        <Slider label={L("depth", "max depth")} value={depth} min={0} max={5} step={1} onChange={setDepth} fmt={v => `${v}`} />
        <Row>
          <Readout>{L("leaves", "leaves")} {count}</Readout>
          <Readout color={correct === STUDENTS.length ? C.amber : C.fg}>{L("train", "training accuracy")} {correct} / {STUDENTS.length}</Readout>
          <Readout color={C.muted}>{L("rootGini", "root Gini")} {f2(root.gini, 3)}</Readout>
        </Row>
      </>}
      note={L("note", "Each internal node asks one question, \"feature < threshold?\"; \"yes\" goes left. Under each question or answer: how many of the node's students passed, out of how many, and its Gini impurity G. The threshold is chosen among the midpoints between neighbouring values, as the one whose two children have the lowest weighted Gini impurity. The first question, sleep < 5.25 h, sends 4 students left (all failed, Gini 0) and 10 right (6 passed, Gini 0.48). Depth 2 already gets 12 of 14 right with three leaves that make sense. Deeper trees get to 14 of 14 by carving thin boxes around the two noisy students: the boxes in the top view that look arbitrary are the overfitting.")}
    >
      <svg viewBox={`0 0 ${P.W} ${H}`} className="w-full h-auto" role="img">
        {boxes.map((b, i) => <rect key={i} x={P.X(b.x0)} y={P.Y(b.y1)} width={P.X(b.x1) - P.X(b.x0)} height={P.Y(b.y0) - P.Y(b.y1)}
          fill={b.pred ? C.green : C.red} fillOpacity={0.14} />)}
        {cuts.map((c, i) => <line key={i} x1={P.X(c.x1)} y1={P.Y(c.y1)} x2={P.X(c.x2)} y2={P.Y(c.y2)} stroke={C.purple} strokeWidth={1.8} />)}
        {[1, 2, 3, 4, 5, 6].map(x => <T key={x} x={P.X(x)} y={P.H - 4} size={8} anchor="middle">{x} h</T>)}
        {[4, 6, 8].map(y => <T key={y} x={4} y={P.Y(y) + 3} size={8}>{y} h</T>)}
        <T x={P.W - 6} y={P.H - 16} size={9} anchor="end" bold color={C.fg}>{L("studied", "studied →")}</T>
        <T x={22} y={14} size={9} bold color={C.fg}>{L("slept", "↑ slept")}</T>
        {STUDENTS.map(([h, s, lab], i) => <circle key={i} cx={P.X(h)} cy={P.Y(s)} r={5.5} fill={lab ? C.green : C.red} stroke="var(--code-bg)" strokeWidth={1.6} />)}

        <line x1={0} x2={P.W} y1={P.H + 6} y2={P.H + 6} stroke={C.grid} />
        {edges.map((e, i) => <g key={`e${i}`}>
          <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={C.axis} strokeWidth={1.2} />
          <T x={(e.x1 + e.x2) / 2 + (e.side === "yes" ? -4 : 4)} y={(e.y1 + e.y2) / 2 + 3} size={7.5} anchor={e.side === "yes" ? "end" : "start"}>
            {e.side === "yes" ? L("yes", "yes") : L("no", "no")}
          </T>
        </g>)}
        {nodes.map((c, i) => {
          const isLeaf = !c.n.l;
          const pred = 2 * c.n.pos > c.n.n;
          return <g key={i}>
            <rect x={c.x - BOX_W / 2} y={c.y} width={BOX_W} height={BOX_H} rx={5}
              fill={isLeaf ? (pred ? C.green : C.red) : "var(--surface)"} fillOpacity={isLeaf ? 0.2 : 1}
              stroke={isLeaf ? (pred ? C.green : C.red) : C.purple} strokeWidth={1.2} />
            <T x={c.x} y={c.y + 12} size={8} anchor="middle" bold color={C.fg}>
              {isLeaf ? (pred ? L("pass", "pass") : L("fail", "fail")) : `${feat(c.n.f!)} < ${c.n.th}`}
            </T>
            <T x={c.x} y={c.y + 24} size={7.5} anchor="middle">{`${c.n.pos}/${c.n.n} · G ${f2(c.n.gini, 2)}`}</T>
          </g>;
        })}
      </svg>
    </Figure>
  );
}
