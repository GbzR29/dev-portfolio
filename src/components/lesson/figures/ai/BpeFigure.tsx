"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, C, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// Byte-pair encoding on the classic example of Sennrich and others (2016): the
// words low ×5, lower ×2, newest ×6, widest ×3, each split into characters
// plus an end-of-word mark "_". Every step merges the most frequent adjacent
// pair into a new token. The vocabulary grows by one, the text gets shorter,
// and words never seen in training are still cut into known pieces.

const WORDS: [string, number][] = [["low", 5], ["lower", 2], ["newest", 6], ["widest", 3]];
const UNSEEN = ["lowest", "slow"];
const MAX = 10;

type Seg = string[];
const split = (w: string): Seg => [...w, "_"];

function applyMerge(seg: Seg, [a, b]: [string, string]): Seg {
  const out: Seg = [];
  for (let i = 0; i < seg.length; i++) {
    if (i + 1 < seg.length && seg[i] === a && seg[i + 1] === b) { out.push(a + b); i++; }
    else out.push(seg[i]);
  }
  return out;
}

/** All merges, learned greedily: the most frequent pair (ties: the first one met). */
function learn() {
  let segs = WORDS.map(([w]) => split(w));
  const merges: { pair: [string, string]; count: number }[] = [];
  for (let m = 0; m < MAX; m++) {
    const counts = new Map<string, number>(), order: string[] = [];
    segs.forEach((s, k) => {
      for (let i = 0; i + 1 < s.length; i++) {
        const key = s[i] + "\u0000" + s[i + 1];
        if (!counts.has(key)) order.push(key);
        counts.set(key, (counts.get(key) ?? 0) + WORDS[k][1]);
      }
    });
    let best = "", bc = 0;
    for (const key of order) if (counts.get(key)! > bc) { best = key; bc = counts.get(key)!; }
    if (!best) break;
    const pair = best.split("\u0000") as [string, string];
    merges.push({ pair, count: bc });
    segs = segs.map(s => applyMerge(s, pair));
  }
  return merges;
}
const MERGES = learn();
const BASE = new Set(WORDS.flatMap(([w]) => split(w))).size;

const segAt = (w: string, n: number) => MERGES.slice(0, n).reduce((s, m) => applyMerge(s, m.pair), split(w));

const W = 600, H = 250;

export function BpeFigure({ t }: { t?: TrackTranslations }) {
  const [n, setN] = useState(0);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiBpe_${k}`, en);

  useFrame(playing && vis.on, dt => {
    acc.current += dt;
    if (acc.current < 1) return;
    acc.current = 0;
    setN(v => { if (v >= MERGES.length) { setPlaying(false); return v; } return v + 1; });
  });

  const total = WORDS.reduce((s, [w, f]) => s + f * segAt(w, n).length, 0);

  const chips = (seg: Seg, x: number, y: number, fresh: string | null, dim = false) => {
    let cx = x;
    return seg.map((p, i) => {
      const wd = 8 + 7 * p.length, x0 = cx;
      cx += wd + 3;
      const isNew = fresh !== null && p === fresh;
      return (
        <g key={i} opacity={dim ? 0.85 : 1}>
          <rect x={x0} y={y} width={wd} height={19} rx={4} fill={isNew ? C.amber : "var(--card)"} fillOpacity={isNew ? 0.25 : 1}
            stroke={isNew ? C.amber : C.muted} strokeOpacity={isNew ? 1 : 0.4} />
          <T x={x0 + wd / 2} y={y + 13.5} size={10.5} anchor="middle" color={C.fg}>{p}</T>
        </g>
      );
    });
  };
  const fresh = n > 0 ? MERGES[n - 1].pair.join("") : null;

  return (
    <Figure
      title={L("title", "Byte-pair encoding: merging the most frequent pair")}
      controls={
        <Row>
          <Readout>{L("merges", "merges")} {n}</Readout>
          <Readout>{L("vocab", "vocabulary")} {BASE} + {n} = {BASE + n}</Readout>
          <Readout color={C.purple}>{L("tokens", "tokens in the text")} {total}</Readout>
        </Row>
      }
      note={L("note", "The training text is 16 words: low 5 times, lower 2, newest 6, widest 3. It starts as single characters plus \"_\", the end of a word: 11 distinct symbols, 95 tokens. Each step counts every pair of neighbouring tokens (weighted by how often the word occurs), merges the most frequent pair into one new token, and adds it to the vocabulary. First \"e\"+\"s\" (9 times, from newest and widest), then \"es\"+\"t\", then \"est\"+\"_\": the suffix \"est_\" becomes one token. After 10 merges the text is 28 tokens. The two words on the right never appeared in training, yet they are cut into known pieces: \"lowest\" becomes \"low\" + \"est_\". No word is ever unknown, because in the worst case it falls back to single characters (real tokenizers start from the 256 byte values, so that any text at all can be encoded).")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          <T x={12} y={16} size={8.5}>{L("training", "training words (× how often)")}</T>
          {WORDS.map(([w, f], k) => (
            <g key={w}>
              <T x={12} y={42 + k * 30} size={9.5} color={C.muted}>×{f}</T>
              {chips(segAt(w, n), 40, 28 + k * 30, fresh)}
            </g>
          ))}
          <T x={12} y={170} size={8.5}>{L("unseen", "words never seen in training")}</T>
          {UNSEEN.map((w, k) => <g key={w}>{chips(segAt(w, n), 40 + k * 170, 180, fresh, true)}</g>)}
          <T x={W - 200} y={16} size={8.5}>{L("list", "merges learned, in order")}</T>
          {MERGES.map((m, k) => (
            <g key={k} opacity={k < n ? 1 : 0.25}>
              <T x={W - 200} y={34 + k * 16} size={9} color={k === n - 1 ? C.amber : C.fg} bold={k === n - 1}>
                {k + 1}. {m.pair[0]} + {m.pair[1]} → {m.pair.join("")}
              </T>
              <T x={W - 14} y={34 + k * 16} size={8.5} anchor="end">×{m.count}</T>
            </g>
          ))}
        </svg>
        <Transport t={t} playing={playing} onPlay={() => { if (n >= MERGES.length) setN(0); setPlaying(v => !v); }}
          onStep={() => { setPlaying(false); setN(v => Math.min(MERGES.length, v + 1)); }}
          onBack={() => { setPlaying(false); setN(v => Math.max(0, v - 1)); }}
          onReset={() => { setPlaying(false); setN(0); }}
          readout={`${n} / ${MERGES.length}`} />
      </div>
    </Figure>
  );
}
