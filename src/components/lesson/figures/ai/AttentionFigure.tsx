"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, C, T, Handle, Vec, useDrag } from "@/components/lesson/kit/figure";
import { softmax } from "./cnn";

// ── What this figure shows ────────────────────────────────────────────────────
// One query attending over four keys in 2 dimensions. Each key is an arrow and
// carries a value, drawn as a colour. Drag the query: the scores q·kᵢ/√2 go
// through a softmax, and the output is the values mixed in those proportions.
// A long query in a key's direction gives that key almost all the weight; a
// query near the origin gives every key the same weight (a plain average).

const KEYS = [
  { k: [2, 0.4], rgb: [239, 68, 68] },
  { k: [-0.4, 2], rgb: [34, 197, 94] },
  { k: [-1.7, -1.2], rgb: [59, 130, 246] },
  { k: [1.2, -1.8], rgb: [245, 158, 11] },
] as const;
const D = 2;

const PW = 260, S = 40, OX = PW / 2, OY = PW / 2;          // plane: 260×260, 40 px per unit, origin centred
const toPx = (x: number, y: number) => ({ x: OX + S * x, y: OY - S * y });
const W = 600, H = PW;
const TX = PW + 30, BAR = 120;

const rgb = (c: readonly number[]) => `rgb(${c.map(v => Math.round(v)).join(",")})`;

export function AttentionFigure({ t }: { t?: TrackTranslations }) {
  const [q, setQ] = useState<[number, number]>([1.6, 0.6]);
  const L = (k: string, en: string) => tx(t, `figAiAtt_${k}`, en);

  const drag = useDrag<"q">(
    p => (Math.hypot(p.x - toPx(q[0], q[1]).x, p.y - toPx(q[0], q[1]).y) < 22 ? "q" : null),
    (_, p) => setQ([Math.max(-3.1, Math.min(3.1, (p.x - OX) / S)), Math.max(-3.1, Math.min(3.1, (OY - p.y) / S))]),
  );

  const scores = KEYS.map(({ k }) => (q[0] * k[0] + q[1] * k[1]) / Math.sqrt(D));
  const w = softmax(scores);
  const mix = [0, 1, 2].map(c => KEYS.reduce((s, key, i) => s + w[i] * key.rgb[c], 0));
  const qp = toPx(q[0], q[1]);

  return (
    <Figure
      title={L("title", "One query, four keys: drag the query")}
      controls={
        <Row>
          <Readout>q = ({q[0].toFixed(1)}, {q[1].toFixed(1)})</Readout>
          <Readout>|q| = {Math.hypot(q[0], q[1]).toFixed(2)}</Readout>
          <Readout>{L("weights", "weights")} {Array.from(w, v => v.toFixed(2)).join(" + ")} = 1</Readout>
        </Row>
      }
      note={L("note", "The four arrows are keys; each carries a value, shown as its colour. The purple handle is the query: drag it. Each key's score is its dot product with the query divided by √d (d = 2 here): large when the two point the same way, negative when they point apart. The softmax turns the four scores into weights that add up to 1, and the output is the four values mixed in those proportions (the swatch). Point the query at a key and its colour dominates. Make the query longer in that direction: the scores spread apart, the softmax gets sharper, and one key takes almost all the weight. Bring the query to the centre: every score is 0, every weight 1/4, and the output is the plain average. Attention is a soft, learnable lookup: the query says what it is looking for, the keys say what they offer, the values are what is handed back.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <line x1={0} y1={OY} x2={PW} y2={OY} stroke={C.grid} />
        <line x1={OX} y1={0} x2={OX} y2={PW} stroke={C.grid} />
        {KEYS.map(({ k, rgb: c }, i) => {
          const e = toPx(k[0], k[1]);
          return (
            <g key={i}>
              <Vec a={{ x: OX, y: OY }} b={e} color={rgb(c)} w={2.2} opacity={0.35 + 0.65 * w[i]} />
              <T x={e.x + (k[0] >= 0 ? 6 : -6)} y={e.y + (k[1] >= 0 ? -6 : 14)} size={10} anchor={k[0] >= 0 ? "start" : "end"} color={rgb(c)} bold>k{"₁₂₃₄"[i]}</T>
            </g>
          );
        })}
        <Vec a={{ x: OX, y: OY }} b={qp} color={C.purple} w={2.4} dash="5 3" />
        <Handle x={qp.x} y={qp.y} color={C.purple} active={drag.dragging === "q"} />
        <T x={qp.x + 10} y={qp.y - 10} size={10.5} color={C.purple} bold>q</T>

        <T x={TX} y={20} size={8.5}>{L("score", "score q·k/√d")}</T>
        <T x={TX + 112} y={20} size={8.5}>{L("weight", "softmax weight")}</T>
        {KEYS.map(({ rgb: c }, i) => {
          const y = 36 + i * 34;
          return (
            <g key={i}>
              <T x={TX} y={y + 13} size={10} color={rgb(c)} bold>k{"₁₂₃₄"[i]}</T>
              <T x={TX + 70} y={y + 13} size={10} anchor="end" color={C.fg}>{scores[i].toFixed(2)}</T>
              <rect x={TX + 112} y={y + 3} width={BAR} height={14} rx={3} fill="var(--card)" stroke={C.muted} strokeOpacity={0.3} />
              <rect x={TX + 112} y={y + 3} width={Math.max(1, BAR * w[i])} height={14} rx={3} fill={rgb(c)} fillOpacity={0.85} />
              <T x={TX + 112 + BAR + 6} y={y + 14} size={9.5} color={C.fg}>{w[i].toFixed(2)}</T>
            </g>
          );
        })}
        <T x={TX} y={196} size={8.5}>{L("output", "output = Σ weight · value")}</T>
        <rect x={TX} y={204} width={BAR + 112} height={34} rx={6} fill={rgb(mix)} stroke={C.muted} strokeOpacity={0.4} />
        <g>
          {KEYS.map(({ rgb: c }, i) => {
            const x0 = KEYS.slice(0, i).reduce((s, _, j) => s + w[j], 0) * (BAR + 112);
            return <rect key={i} x={TX + x0} y={242} width={Math.max(0, w[i] * (BAR + 112))} height={6} fill={rgb(c)} />;
          })}
        </g>
      </svg>
    </Figure>
  );
}
