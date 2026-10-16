"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, C, T } from "@/components/lesson/kit/figure";
import { VOCAB, cosine, farmModel, groupOf } from "./emb";
import { GROUP_COLOR } from "./EmbeddingFigure";

// ── What this figure shows ────────────────────────────────────────────────────
// The embedding table E of a skip-gram model trained on the FARM corpus with
// d = 8 (60 epochs, the chapter's numbers). Multiplying a one-hot vector by E
// picks one row: that row is the word's embedding. Next to the table, the
// cosine of every word with the chosen one, first for the one-hot vectors
// (always 0 between different words) and then for the learned embeddings.

const D = 8;

const ROW = 15, TOP = 30;
const X_ONE = 64, X_E = 116, CW = 22, X_COS1 = X_E + D * CW + 34, X_COS2 = X_COS1 + 92, BAR = 70;
const H = TOP + VOCAB.length * ROW + 12, W = X_COS2 + BAR + 46;

export function LookupFigure({ t }: { t?: TrackTranslations }) {
  const m = useMemo(farmModel, []);
  const [sel, setSel] = useState(VOCAB.indexOf("cat"));
  const L = (k: string, en: string) => tx(t, `figAiLook_${k}`, en);
  const max = m.E.reduce((a, v) => Math.max(a, Math.abs(v)), 1e-9);
  const row = Array.from(m.vec(sel));

  const bar = (x: number, v: number, color: string) => (
    <>
      <line x1={x + BAR / 2} y1={-ROW / 2 + 2} x2={x + BAR / 2} y2={ROW / 2 - 2} stroke={C.muted} strokeOpacity={0.4} />
      <rect x={v >= 0 ? x + BAR / 2 : x + BAR / 2 + (BAR / 2) * v} y={-4} width={Math.max(1, (BAR / 2) * Math.abs(v))} height={8} rx={2} fill={color} fillOpacity={0.75} />
      <T x={x + BAR + 4} y={3} size={7.5} color={C.fg}>{v.toFixed(2)}</T>
    </>
  );

  return (
    <Figure
      title={L("title", "One-hot × E: looking up a row")}
      controls={
        <Row>
          <Readout color={GROUP_COLOR[groupOf(VOCAB[sel])]}>{VOCAB[sel]} → ({row.map(v => v.toFixed(1)).join(", ")})</Readout>
        </Row>
      }
      note={L("note", "Click a word. Its one-hot vector (left) has a single 1, in the word's own row, and 19 zeros. Multiplying it by the 20 × 8 table E adds up the rows of E weighted by the one-hot entries, so all rows vanish except one: the result is simply that row, the word's 8 numbers. That is all an embedding layer does, and it is why libraries implement it as an array lookup instead of a multiplication. Now compare the two cosine columns. Between one-hot vectors the cosine is 1 with the word itself and 0 with every other word: cat is as unrelated to dog as to rice. Between the learned rows it reflects meaning: the other animals come close to 1, foods and drinks fall below 0.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={X_ONE} y={TOP - 14} size={8.5} anchor="middle">{L("onehot", "one-hot")}</T>
        <T x={X_E + (D * CW) / 2} y={TOP - 14} size={8.5} anchor="middle">{L("table", "embedding table E (20 × 8)")}</T>
        <T x={X_COS1 + BAR / 2} y={TOP - 14} size={8.5} anchor="middle">{L("cosOne", "cos, one-hot")}</T>
        <T x={X_COS2 + BAR / 2} y={TOP - 14} size={8.5} anchor="middle">{L("cosEmb", "cos, embedding")}</T>
        {VOCAB.map((w, i) => {
          const on = i === sel, color = GROUP_COLOR[groupOf(w)];
          const y = TOP + i * ROW + ROW / 2;
          return (
            <g key={w} transform={`translate(0 ${y})`} style={{ cursor: "pointer" }} onClick={() => setSel(i)}>
              <rect x={2} y={-ROW / 2} width={W - 4} height={ROW} fill={on ? C.amber : "transparent"} fillOpacity={on ? 0.12 : 0} />
              <T x={44} y={3} size={8.5} anchor="end" color={color} bold={on}>{w}</T>
              <rect x={X_ONE - 6} y={-6} width={12} height={12} rx={2} fill={on ? C.amber : "var(--card)"} stroke={C.muted} strokeOpacity={0.35} />
              <T x={X_ONE} y={3} size={7.5} anchor="middle" color={on ? "#000" : C.muted}>{on ? 1 : 0}</T>
              {Array.from(m.vec(i), (v, k) => (
                <rect key={k} x={X_E + k * CW + 1} y={-ROW / 2 + 1.5} width={CW - 2} height={ROW - 3} rx={2}
                  fill={v >= 0 ? C.teal : C.red} fillOpacity={0.08 + 0.8 * Math.abs(v) / max}
                  stroke={on ? C.amber : "none"} strokeWidth={1.2} />
              ))}
              {bar(X_COS1, on ? 1 : 0, C.muted)}
              {bar(X_COS2, on ? 1 : cosine(m.vec(sel), m.vec(i)), color)}
            </g>
          );
        })}
        <T x={(X_ONE + X_E) / 2 + 2} y={TOP - 2} size={11} anchor="middle" color={C.fg}>×</T>
      </svg>
    </Figure>
  );
}
