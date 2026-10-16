"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, C, T } from "@/components/lesson/kit/figure";
import { VOCAB, farmModel, groupOf } from "./emb";
import { GROUP_COLOR } from "./EmbeddingFigure";
import { attention, mat, row } from "./attn";

// ── What this figure shows ────────────────────────────────────────────────────
// Self-attention over an 8-word sentence. Each word's query, key and value is
// its own d = 8 embedding from the Embeddings chapter (no learned projections
// yet), so the weights are softmax(X·Xᵀ/√8): row i says how much word i looks
// at each word. Switches: the causal mask (no looking ahead), the ÷√d scaling
// (break it), and shuffling the words (the weights move with them unchanged:
// attention alone has no idea of order).

const SENT = "the cat drinks milk the dog eats bread".split(" ");
const PERM = [7, 6, 5, 4, 3, 2, 1, 0];                       // shuffled = the same words reversed

const CELL = 40, X0 = 70, Y0 = 56;
const W = X0 + SENT.length * CELL + 12, H = Y0 + SENT.length * CELL + 10;

export function SelfAttnFigure({ t }: { t?: TrackTranslations }) {
  const m = useMemo(farmModel, []);
  const [causal, setCausal] = useState(false);
  const [scale, setScale] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [sel, setSel] = useState(1);
  const L = (k: string, en: string) => tx(t, `figAiSelf_${k}`, en);

  const words = shuffle ? PERM.map(i => SENT[i]) : SENT;
  const X = mat(words.length, 8, words.flatMap(w => Array.from(m.vec(VOCAB.indexOf(w)))));
  const { weights } = attention(X, X, X, { causal, scale });
  const top = Array.from(row(weights, sel), (v, j) => ({ v, j })).sort((a, b) => b.v - a.v).slice(0, 3);

  return (
    <Figure
      title={L("title", "Self-attention: every word looks at every word")}
      head={<>
        <Btn active={causal} onClick={() => setCausal(v => !v)}>{L("causal", "causal mask")}</Btn>
        <Btn active={!scale} onClick={() => setScale(v => !v)}>{L("noScale", "no ÷√d (break it)")}</Btn>
        <Btn active={shuffle} onClick={() => setShuffle(v => !v)}>{L("shuffle", "shuffle the words")}</Btn>
      </>}
      controls={
        <Row>
          <Readout color={GROUP_COLOR[groupOf(words[sel])]}>
            {words[sel]} → {top.map(o => `${words[o.j]} ${o.v.toFixed(2)}`).join(", ")}
          </Readout>
        </Row>
      }
      note={L("note", "Row i shows how word i spreads its attention: the weights of one softmax, adding up to 1 across the row. Here a word's query, key and value are all its own embedding, so each word looks most at itself and at words used like it: \"cat\" gives 0.32 to itself and 0.29 to \"dog\". Turn on the causal mask: a word may only look at itself and the words before it (grey cells are forbidden), as a language model writing left to right must; \"dog\" now finds \"cat\". Remove the ÷√d: the scores are √8 ≈ 2.8 times larger and the softmax saturates, so \"milk\" puts 1.00 on itself and ignores the rest. Shuffle the words: every word keeps exactly the same weights to the same words, only moved. Attention by itself cannot tell \"the cat eats\" from \"eats the cat\"; the transformer adds positions for that.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={W - 12} y={14} size={8.5} anchor="end">{L("keys", "looked at (keys)")} →</T>
        <T x={8} y={14} size={8.5}>{L("queries", "looking (queries)")} ↓</T>
        {words.map((w, j) => (
          <T key={`c${j}`} x={X0 + j * CELL + CELL / 2} y={Y0 - 10} size={9} anchor="middle" color={GROUP_COLOR[groupOf(w)]}>{w}</T>
        ))}
        {words.map((w, i) => (
          <g key={`r${i}`} style={{ cursor: "pointer" }} onClick={() => setSel(i)}>
            <rect x={2} y={Y0 + i * CELL + 1} width={W - 4} height={CELL - 2} rx={4} fill={C.amber} fillOpacity={i === sel ? 0.1 : 0} />
            <T x={X0 - 8} y={Y0 + i * CELL + CELL / 2 + 3} size={9.5} anchor="end" color={GROUP_COLOR[groupOf(w)]} bold={i === sel}>{w}</T>
            {words.map((_, j) => {
              const v = weights.a[i * words.length + j], masked = causal && j > i;
              return (
                <g key={j}>
                  <rect x={X0 + j * CELL + 1.5} y={Y0 + i * CELL + 1.5} width={CELL - 3} height={CELL - 3} rx={3}
                    fill={masked ? C.muted : C.purple} fillOpacity={masked ? 0.08 : 0.06 + 0.9 * v}
                    stroke={i === sel ? C.amber : "none"} strokeOpacity={0.6} />
                  {!masked && <T x={X0 + j * CELL + CELL / 2} y={Y0 + i * CELL + CELL / 2 + 3} size={8.5} anchor="middle" color={v > 0.45 ? "#fff" : C.fg}>{v.toFixed(2)}</T>}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </Figure>
  );
}
