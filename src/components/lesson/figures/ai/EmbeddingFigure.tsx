"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { seeded } from "./mlp";
import { SkipGram, VOCAB, farmCorpus, groupOf, pairs, shuffled, type Group } from "./emb";

// ── What this figure shows ────────────────────────────────────────────────────
// Skip-gram training with 2-dimensional embeddings on the FARM corpus (200
// sentences, 20 words, 2 800 centre/context pairs). Every word starts at a
// random point; each training pair pulls the centre word towards the words it
// appears with. Words used in the same contexts end up together: animals,
// foods, drinks and places form four groups. "Break it" shuffles the words of
// the corpus, so contexts carry no meaning and no groups form.

const REAL = farmCorpus(200, seeded(1));
const PAIRS = { real: pairs(REAL, 2), shuffled: pairs(shuffled(REAL, seeded(7)), 2) };
type Corpus = keyof typeof PAIRS;
const PER_FRAME = 140;                                  // pairs trained per animation frame
const MAX_EPOCHS = 30;
const LR = 0.05;

export const GROUP_COLOR: Record<Group, string> = {
  animal: C.orange, food: C.green, drink: C.sky, place: C.purple, verb: C.pink, other: C.muted,
};

type Run = { m: SkipGram; rng: () => number; done: number; loss: number; acc: number; n: number };
const fresh = (): Run => ({ m: new SkipGram(VOCAB.length, 2, seeded(3)), rng: seeded(4), done: 0, loss: NaN, acc: 0, n: 0 });

const W = 560, H = 330, S = 44;                         // viewBox; pixels per embedding unit

/** Word labels to the right of their dots, pushed down until no two overlap (greedy, top to bottom). */
function placeLabels(pts: { w: string; x: number; y: number }[]) {
  const out: { x: number; y: number; moved: boolean }[] = new Array(pts.length);
  const placed = pts.map(p => ({ x0: p.x - 5, x1: p.x + 5, y: p.y + 5 }));   // the dots are obstacles too
  const order = pts.map((_, i) => i).sort((a, b) => pts[a].y - pts[b].y);
  for (const i of order) {
    const p = pts[i], x = Math.min(p.x + 7, W - 5.6 * p.w.length - 2), x1 = x + 5.6 * p.w.length;
    let y = p.y - 6;
    while (placed.some(q => x < q.x1 + 3 && x1 > q.x0 - 3 && Math.abs(q.y - y) < 10)) y += 10;
    placed.push({ x0: x, x1, y });
    out[i] = { x, y, moved: y - (p.y - 6) > 9 };
  }
  return out;
}

export function EmbeddingFigure({ t }: { t?: TrackTranslations }) {
  const [corpus, setCorpus] = useState<Corpus>("real");
  const run = useRef<Run | null>(null);
  if (!run.current) run.current = fresh();
  const order = useRef<number[]>([]);
  const [sel, setSel] = useState<number | null>(VOCAB.indexOf("cat"));
  const [playing, setPlaying] = useState(false);
  const rerender = useRerender();
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiEmb_${k}`, en);
  const ps = PAIRS[corpus];
  const epochs = run.current.done / ps.length;

  const train = (count: number) => {
    const r = run.current!;
    for (let k = 0; k < count; k++) {
      const i = r.done % ps.length;
      if (i === 0) {                                     // a new epoch: a new shuffled order
        order.current = ps.map((_, j) => j);
        for (let a = order.current.length - 1; a > 0; a--) { const b = Math.floor(r.rng() * (a + 1)); [order.current[a], order.current[b]] = [order.current[b], order.current[a]]; }
        if (r.n) r.loss = r.acc / r.n;
        r.acc = 0; r.n = 0;
      }
      const [w, c] = ps[order.current[i]];
      r.acc += r.m.step(w, c, LR); r.n++;
      r.done++;
    }
    rerender();
  };

  useFrame(playing && vis.on, () => {
    if (run.current!.done >= MAX_EPOCHS * ps.length) { setPlaying(false); return; }
    train(PER_FRAME);
  });

  const reset = (c: Corpus = corpus) => { setPlaying(false); setCorpus(c); run.current = fresh(); rerender(); };

  const m = run.current.m;
  const pts = VOCAB.map((w, i) => ({
    w, i,
    x: Math.max(8, Math.min(W - 8, W / 2 + 40 + S * m.E[2 * i])),
    y: Math.max(8, Math.min(H - 8, H / 2 - S * m.E[2 * i + 1])),
  }));
  const labels = placeLabels(pts);
  const near = sel === null ? [] : pts.filter(p => p.i !== sel)
    .map(p => ({ ...p, d: Math.hypot(m.E[2 * p.i] - m.E[2 * sel], m.E[2 * p.i + 1] - m.E[2 * sel + 1]) }))
    .sort((a, b) => a.d - b.d).slice(0, 3);
  const live = run.current.n ? run.current.acc / run.current.n : run.current.loss;

  return (
    <Figure
      title={L("title", "Words find their places")}
      head={<Choice value={corpus} onChange={c => reset(c)} options={[["real", L("real", "real sentences")], ["shuffled", L("shuffled", "shuffled words (break it)")]] as const} />}
      controls={<>
        <Row>
          {(["animal", "food", "drink", "place", "verb"] as Group[]).map(g => (
            <span key={g} className="text-[10px] font-mono" style={{ color: GROUP_COLOR[g] }}>● {L(g, g)}</span>
          ))}
        </Row>
        <Row>
          <Readout>{L("epoch", "epoch")} {epochs.toFixed(1)}</Readout>
          <Readout>{L("loss", "loss")} {Number.isFinite(live) ? live.toFixed(3) : "—"}</Readout>
          {sel !== null && <Readout color={GROUP_COLOR[groupOf(VOCAB[sel])]}>{L("near", "closest to")} {VOCAB[sel]}: {near.map(n => n.w).join(", ")}</Readout>}
        </Row>
      </>}
      note={L("note", "Each dot is one word's embedding, a point (e₁, e₂) the network can move. Press play: for every word in the corpus, training nudges its point so that it predicts the words around it (2 on each side). Words that appear in the same company receive the same nudges, so they drift together: after a few epochs the animals, foods, drinks and places sit in four separate groups, though nobody told the network which word is which. Click a word to see its three closest neighbours. Now choose \"shuffled words\": the same words in a random order, so a word's neighbours say nothing about it. The loss stays higher and the colours never sort themselves out.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={C.grid} />
          <line x1={W / 2 + 40} y1={0} x2={W / 2 + 40} y2={H} stroke={C.grid} />
          <T x={W - 8} y={H / 2 - 5} size={8.5} anchor="end">e₁</T>
          <T x={W / 2 + 46} y={12} size={8.5}>e₂</T>
          {sel !== null && near.map(n => (
            <line key={n.w} x1={pts[sel].x} y1={pts[sel].y} x2={n.x} y2={n.y} stroke={GROUP_COLOR[groupOf(VOCAB[sel])]} strokeOpacity={0.5} strokeDasharray="3 3" />
          ))}
          {pts.map(p => {
            const color = GROUP_COLOR[groupOf(p.w)];
            const on = p.i === sel;
            const lb = labels[p.i];
            return (
              <g key={p.w} style={{ cursor: "pointer" }} onClick={() => setSel(on ? null : p.i)}>
                {lb.moved && <line x1={p.x} y1={p.y} x2={lb.x - 1} y2={lb.y - 3} stroke={color} strokeOpacity={0.35} />}
                <circle cx={p.x} cy={p.y} r={on ? 6.5 : 4.5} fill={color} fillOpacity={0.85} stroke={on ? C.fg : "none"} strokeWidth={1.5} />
                <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
                <T x={lb.x} y={lb.y} size={9} color={color} bold={on}>{p.w}</T>
              </g>
            );
          })}
        </svg>
        <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)}
          onStep={() => { setPlaying(false); train(ps.length - (run.current!.done % ps.length)); }}
          onReset={() => reset()}
          readout={`${L("epoch", "epoch")} ${epochs.toFixed(1)} / ${MAX_EPOCHS}`} />
      </div>
    </Figure>
  );
}
