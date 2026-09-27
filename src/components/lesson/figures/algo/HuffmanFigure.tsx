"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// Huffman's algorithm on a few letters with their counts. Every step takes the
// two lightest trees of the forest (the chips across the top, lightest first),
// hangs them under a new node whose weight is their sum, and puts that back.
// Leaves sit on the bottom line and every node is drawn at its height, so the
// tree grows upwards. When one tree is left, left edges read 0 and right edges
// 1, and each letter's code is the path from the root; the total size is
// Σ count × code length, compared with a fixed-length code.

type Preset = "book" | "equal" | "skewed";
const PRESETS: Record<Preset, [string, number][]> = {
  book: [["a", 45], ["b", 13], ["c", 12], ["d", 16], ["e", 9], ["f", 5]],
  equal: [["a", 10], ["b", 10], ["c", 10], ["d", 10], ["e", 10], ["f", 10], ["g", 10], ["h", 10]],
  skewed: [["a", 32], ["b", 16], ["c", 8], ["d", 4], ["e", 2], ["f", 1], ["g", 1]],
};

type Node = { w: number; ch?: string; l?: number; r?: number; h: number; born: number };

function huffman(letters: [string, number][]) {
  const nodes: Node[] = letters.map(([ch, w]) => ({ w, ch, h: 0, born: 0 }));
  let forest = nodes.map((_, i) => i);
  const forests = [forest.slice()];
  const byWeight = (a: number, b: number) => nodes[a].w - nodes[b].w || a - b;
  for (let step = 1; forest.length > 1; ++step) {
    forest.sort(byWeight);
    const [l, r] = forest;
    nodes.push({ w: nodes[l].w + nodes[r].w, l, r, h: Math.max(nodes[l].h, nodes[r].h) + 1, born: step });
    forest = [...forest.slice(2), nodes.length - 1];
    forests.push(forest.slice().sort(byWeight));
  }
  forests[0].sort(byWeight);
  const root = nodes.length - 1;

  // Leaves in left-to-right order of the final tree; inner nodes over the middle of their children
  const x = new Array<number>(nodes.length), code = new Array<string>(nodes.length);
  let leaf = 0;
  const place = (i: number, c: string) => {
    code[i] = c;
    const n = nodes[i];
    if (n.l === undefined) { x[i] = leaf++; return; }
    place(n.l, c + "0"); place(n.r!, c + "1");
    x[i] = (x[n.l] + x[n.r!]) / 2;
  };
  place(root, "");
  return { nodes, forests, x, code, leaves: leaf, root };
}

const W = 560, H = 250, BASE = 200, X0 = 40, X1 = 520;

export function HuffmanFigure({ t }: { t?: TrackTranslations }) {
  const [preset, setPreset] = useState<Preset>("book");
  const letters = PRESETS[preset];
  const hf = useMemo(() => huffman(letters), [letters]);
  const merges = hf.forests.length - 1;
  const s = useStepper(merges, 1100, 350);
  const k = Math.min(merges, Math.floor(s.raw + 1e-9));
  const done = k === merges;

  const maxH = hf.nodes[hf.root].h || 1;
  const px = (i: number) => X0 + (hf.leaves > 1 ? (hf.x[i] / (hf.leaves - 1)) * (X1 - X0) : 0);
  const py = (i: number) => BASE - (hf.nodes[i].h / maxH) * (BASE - 70);
  const alive = (i: number) => hf.nodes[i].born <= k;
  const fresh = (i: number) => hf.nodes[i].born === k && k > 0;

  const total = hf.nodes.reduce((sum, n, i) => (n.ch ? sum + n.w * hf.code[i].length : sum), 0);
  const count = letters.reduce((sum, [, w]) => sum + w, 0);
  const fixedBits = Math.ceil(Math.log2(letters.length));

  return (
    <Figure
      title={tx(t, "figHuff_title", "Huffman: merge the two lightest")}
      head={<Choice value={preset} onChange={v => { setPreset(v); s.restart(); }} options={[
        ["book", tx(t, "figHuff_book", "a–f")],
        ["equal", tx(t, "figHuff_equal", "equal counts")],
        ["skewed", tx(t, "figHuff_skewed", "halving counts")],
      ] as const} />}
      controls={<>
        <StepperControls s={s} />
        <Row>
          <Readout>{tx(t, "figHuff_merges", "merges")}: {k} / {merges}</Readout>
          {done && <Readout color={C.green}>Huffman: {total} {tx(t, "figHuff_bits", "bits")}</Readout>}
          <Readout>{tx(t, "figHuff_fixed", "fixed")} {fixedBits} {tx(t, "figHuff_perLetter", "bits/letter")}: {count * fixedBits} {tx(t, "figHuff_bits", "bits")}</Readout>
        </Row>
      </>}
      note={tx(t, "figHuff_note", "The chips on top are the forest, lightest first; the two on the left are the next to merge. Rare letters are merged early and end up deep, with long codes; common letters join late and stay near the root. With equal counts Huffman can do no better than a fixed-length code, and with halving counts the tree becomes a chain.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {/* The forest, as a row of weights */}
        {hf.forests[k].map((i, j) => {
          const n = hf.nodes[i];
          const next = !done && j < 2;
          return (
            <g key={i}>
              <rect x={X0 + j * 58} y={10} width={52} height={22} rx={11}
                fill={next ? C.amber : C.bg} fillOpacity={next ? 0.3 : 1} stroke={next ? C.amber : C.axis} />
              <T x={X0 + j * 58 + 26} y={25} size={9.5} anchor="middle" color={C.fg} bold={next}>
                {n.ch ? `${n.ch}:${n.w}` : n.w}
              </T>
            </g>
          );
        })}

        {/* Edges */}
        {hf.nodes.map((n, i) => n.l !== undefined && alive(i) && [n.l, n.r!].map((c, side) => (
          <g key={`${i}-${side}`}>
            <line x1={px(i)} y1={py(i)} x2={px(c)} y2={py(c)} stroke={fresh(i) ? C.amber : C.axis} strokeWidth={1.5} />
            {done && <T x={(px(i) + px(c)) / 2 + (side ? 5 : -11)} y={(py(i) + py(c)) / 2} size={9} color={C.sky} bold>{side}</T>}
          </g>
        )))}

        {/* Nodes */}
        {hf.nodes.map((n, i) => alive(i) && (
          <g key={i}>
            <circle cx={px(i)} cy={py(i)} r={n.ch ? 14 : 12} fill={n.ch ? C.purple : C.bg} fillOpacity={n.ch ? 0.25 : 1}
              stroke={fresh(i) ? C.amber : n.ch ? C.purple : C.axis} strokeWidth={fresh(i) ? 2 : 1} />
            <T x={px(i)} y={py(i) + 3.5} size={n.ch ? 10 : 9} anchor="middle" color={C.fg} bold={!!n.ch}>{n.ch ?? n.w}</T>
            {n.ch && <T x={px(i)} y={BASE + 26} size={8.5} anchor="middle">{n.w}</T>}
            {n.ch && done && <T x={px(i)} y={BASE + 40} size={9} anchor="middle" color={C.green} bold>{hf.code[i]}</T>}
          </g>
        ))}
      </svg>
    </Figure>
  );
}
