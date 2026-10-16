"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { seeded } from "./mlp";
import { gptEpoch, gptForward, gptLoss, makeGpt, makeGptAdam, reshape, sampleFrom, type GptAdam, type GptParams } from "./gpt";
import { BOS, EOS, GPT_CFG, GPT_TEST, GPT_TRAIN, TOK, bigram, bigramLoss, isValid } from "./gptData";
import { GROUP_COLOR } from "./EmbeddingFigure";
import { groupOf } from "./emb";

// ── What this figure shows ────────────────────────────────────────────────────
// A real decoder-only transformer (one block, 2 heads, d = 16, 3 046
// parameters) trained live on the FARM sentences to predict the next word.
// Build a prompt by clicking words, read the model's next-word probabilities
// next to a bigram model's (which sees only the previous word), reshape them
// with the temperature and top-k, and let it write sentences.

const EPOCHS = 20;
const BIGRAM_TEST = bigramLoss(GPT_TEST);

type Run = { p: GptParams; opt: GptAdam; rng: () => number; epoch: number; train: number; test: number };
function fresh(): Run {
  const p = makeGpt(GPT_CFG, seeded(3));
  return { p, opt: makeGptAdam(p, 0.01), rng: seeded(4), epoch: 0, train: gptLoss(p, GPT_CFG, GPT_TRAIN), test: gptLoss(p, GPT_CFG, GPT_TEST) };
}

const W = 440, ROWH = 17;
const XW = 62, XB = 70, BAR = 130, XG = XB + BAR + 40, GB = 80;   // word labels end, transformer bars, bigram bars
const tokColor = (w: string) => (w === "<s>" || w === "." ? C.muted : GROUP_COLOR[groupOf(w)]);

export function TinyGptFigure({ t }: { t?: TrackTranslations }) {
  const run = useRef<Run | null>(null);
  if (!run.current) run.current = fresh();
  const [prompt, setPrompt] = useState<number[]>([BOS, TOK.indexOf("the")]);
  const [temp, setTemp] = useState(1);
  const [topK, setTopK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [batch, setBatch] = useState<{ valid: number; n: number; examples: string[] } | null>(null);
  const sampler = useRef(seeded(9));
  const rerender = useRerender();
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiGpt_${k}`, en);

  const trainOne = () => {
    const r = run.current!;
    if (r.epoch >= EPOCHS) return false;
    gptEpoch(r.p, GPT_CFG, r.opt, GPT_TRAIN, 10, r.rng);
    r.epoch++;
    r.train = gptLoss(r.p, GPT_CFG, GPT_TRAIN);
    r.test = gptLoss(r.p, GPT_CFG, GPT_TEST);
    setBatch(null);
    rerender();
    return true;
  };

  useFrame(playing && vis.on, () => { if (!trainOne()) setPlaying(false); });

  const r = run.current;
  const ended = prompt[prompt.length - 1] === EOS || prompt.length >= GPT_CFG.P;
  const f = gptForward(r.p, GPT_CFG, prompt);
  const raw = f.probs[prompt.length - 1];
  const shaped = reshape(raw, temp, topK);
  const big = bigram(prompt[prompt.length - 1]);
  const order = Array.from(shaped, (_, i) => i).sort((a, b) => shaped[b] - shaped[a] || raw[b] - raw[a]).slice(0, 7);

  const add = (tok: number) => { if (!ended) setPrompt(p => [...p, tok]); };
  const writeOne = (start: number[], rng: () => number) => {
    const s = [...start];
    while (s.length < GPT_CFG.P && s[s.length - 1] !== EOS) {
      const pr = gptForward(r.p, GPT_CFG, s).probs[s.length - 1];
      s.push(sampleFrom(reshape(pr, temp, topK), rng));
    }
    return s;
  };
  const sampleMany = () => {
    const rng = seeded(11);
    let valid = 0;
    const examples: string[] = [];
    for (let k = 0; k < 100; k++) {
      const words = writeOne([BOS], rng).slice(1).map(i => TOK[i]);
      if (isValid(words)) valid++;
      if (k < 3) examples.push(words.join(" "));
    }
    setBatch({ valid, n: 100, examples });
  };

  const attnRow = (h: number) => Array.from(f.A[h].subarray((prompt.length - 1) * prompt.length, prompt.length * prompt.length));
  const yEnd = 76 + order.length * ROWH, H = yEnd + 40;

  return (
    <Figure
      title={L("title", "A tiny GPT, trained here on the farm sentences")}
      controls={<>
        <Sliders>
          <Slider label={L("temp", "temperature T")} value={temp} min={0} max={3} step={0.1} onChange={v => { setTemp(v); setBatch(null); }} fmt={v => (v === 0 ? L("greedy", "0 (greedy)") : v.toFixed(1))} />
          <Slider label={L("topk", "top-k")} value={topK} min={0} max={5} step={1} onChange={v => { setTopK(v); setBatch(null); }} fmt={v => (v === 0 ? L("all", "all") : String(v))} />
        </Sliders>
        <Row>
          <Btn onClick={() => add(sampleFrom(shaped, sampler.current))}>{L("next", "sample next word")}</Btn>
          <Btn onClick={() => setPrompt(writeOne(prompt, sampler.current))}>{L("finish", "finish the sentence")}</Btn>
          <Btn onClick={() => setPrompt([BOS])}>{L("clear", "clear")}</Btn>
          <Btn onClick={sampleMany}>{L("many", "write 100 sentences")}</Btn>
        </Row>
        <Row>
          <Readout>{L("epoch", "epoch")} {r.epoch} / {EPOCHS}</Readout>
          <Readout color={C.purple}>{L("loss", "test loss")} {r.test.toFixed(3)}</Readout>
          <Readout>{L("bigram", "bigram")} {BIGRAM_TEST.toFixed(3)}</Readout>
          {batch && <Readout color={C.green}>{batch.valid} / {batch.n} {L("valid", "follow a farm pattern")}</Readout>}
        </Row>
        {batch && <p className="text-[11px] font-mono text-[var(--text-muted)]">{batch.examples.join("  ·  ")}</p>}
      </>}
      note={L("note", "Press play to train (20 epochs over 200 sentences, a few seconds). The chips are the prompt; click a word in the list to append it yourself, or let the model sample one. Purple bars are the transformer's next-word probabilities after the temperature and top-k; grey bars are the bigram model's, which only sees the last word. After \"<s> the\" both expect an animal, but after \"sleeps in the\" only the transformer knows a place must follow: the bigram still spreads its bets over animals and places, because it cannot see past \"the\". The strip under the prompt shows where each of the two heads looks from the last word. Temperature 0 always picks the top word and writes the same sentence every time; around 1 the sentences vary and stay correct; at 2 or 3 the model writes things like \"the house eats rice\". Top-k = 1 is greedy again; top-k = 2 or 3 keeps variety but cuts off the unlikely tail.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {(() => {
            let x = 12;
            return prompt.map((tk, i) => {
              const w = TOK[tk], wd = 10 + 6.2 * w.length, x0 = x;
              x += wd + 6;
              const a0 = attnRow(0)[i] ?? 0, a1 = attnRow(1)[i] ?? 0;
              return (
                <g key={i}>
                  <rect x={x0} y={8} width={wd} height={20} rx={5} fill="var(--card)" stroke={tokColor(w)} strokeOpacity={0.8} />
                  <T x={x0 + wd / 2} y={22} size={10} anchor="middle" color={tokColor(w)}>{w}</T>
                  <rect x={x0} y={31} width={wd} height={4} rx={1} fill={C.sky} fillOpacity={0.08 + 0.92 * a0} />
                  <rect x={x0} y={36} width={wd} height={4} rx={1} fill={C.orange} fillOpacity={0.08 + 0.92 * a1} />
                </g>
              );
            });
          })()}
          <T x={W - 102} y={52} size={7.5} anchor="end">{L("heads", "attention of the last word:")}</T>
          <T x={W - 96} y={52} size={7.5} color={C.sky}>{L("head1", "head 1")}</T>
          <T x={W - 50} y={52} size={7.5} color={C.orange}>{L("head2", "head 2")}</T>
          <T x={12} y={68} size={8.5}>{ended ? L("ended", "the sentence has ended: clear to start again") : L("nextIs", "next word")}</T>
          {!ended && <T x={XB} y={68} size={8.5} color={C.purple}>{L("model", "transformer")}</T>}
          {!ended && <T x={XG} y={68} size={8.5}>{L("bigram", "bigram")}</T>}
          {order.map((i, k) => {
            const y = 76 + k * ROWH, w = TOK[i];
            return (
              <g key={i} style={{ cursor: ended ? undefined : "pointer" }} onClick={() => add(i)} opacity={ended ? 0.4 : 1}>
                <rect x={8} y={y - 2} width={W - 16} height={ROWH - 1} rx={3} fill="transparent" />
                <T x={XW} y={y + 10} size={10} anchor="end" color={tokColor(w)}>{w}</T>
                <rect x={XB} y={y + 1} width={BAR} height={11} rx={3} fill="var(--card)" stroke={C.muted} strokeOpacity={0.25} />
                <rect x={XB} y={y + 1} width={Math.max(1, BAR * shaped[i])} height={11} rx={3} fill={C.purple} fillOpacity={0.8} />
                <T x={XB + BAR + 5} y={y + 10} size={8.5} color={C.fg}>{shaped[i].toFixed(2)}</T>
                <rect x={XG} y={y + 1} width={GB} height={11} rx={3} fill="var(--card)" stroke={C.muted} strokeOpacity={0.25} />
                <rect x={XG} y={y + 1} width={Math.max(1, GB * big[i])} height={11} rx={3} fill={C.muted} fillOpacity={0.6} />
                <T x={XG + GB + 5} y={y + 10} size={8.5}>{big[i].toFixed(2)}</T>
              </g>
            );
          })}
          <T x={12} y={yEnd + 12} size={8.5}>
            {L("raw", "before temperature:")} {order.slice(0, 4).map(i => `${TOK[i]} ${raw[i].toFixed(2)}`).join(", ")}
          </T>
          <T x={12} y={yEnd + 30} size={8.5}>{L("train", "training loss")} {r.train.toFixed(3)} · {L("test", "test loss")} {r.test.toFixed(3)} · {L("floor", "best possible 0.657")}</T>
        </svg>
        <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)}
          onStep={() => { setPlaying(false); trainOne(); }}
          onReset={() => { setPlaying(false); run.current = fresh(); setBatch(null); rerender(); }}
          readout={`${L("epoch", "epoch")} ${r.epoch} / ${EPOCHS}`} />
      </div>
    </Figure>
  );
}
