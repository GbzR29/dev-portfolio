// ── FARM as tokens, for the tiny GPT of the Transformers chapter ─────────────
// The vocabulary is the 20 FARM words plus "<s>" (start of sentence) and "."
// (end). Training sentences: farmCorpus(200, seed 1); test: seed 2. A bigram
// model (counts + 0.1) is the baseline that sees only the previous word.

import { seeded } from "./mlp";
import { VOCAB, farmCorpus } from "./emb";
import type { GptCfg } from "./gpt";

export const TOK = [...VOCAB, "<s>", "."];
export const BOS = TOK.indexOf("<s>"), EOS = TOK.indexOf(".");
export const tokId = (w: string) => TOK.indexOf(w);

const encode = (c: string[][]) => c.map(s => [BOS, ...s.map(tokId), EOS]);
export const GPT_TRAIN = encode(farmCorpus(200, seeded(1)));
export const GPT_TEST = encode(farmCorpus(200, seeded(2)));

export const GPT_CFG: GptCfg = { V: TOK.length, P: 8, d: 16, heads: 2, ff: 32 };

/** Bigram counts from the training sentences, each plus 0.1 so nothing has probability 0. */
const counts = TOK.map(() => new Float64Array(TOK.length).fill(0.1));
for (const s of GPT_TRAIN) for (let i = 0; i + 1 < s.length; i++) counts[s[i]][s[i + 1]]++;

/** p(next | previous word) of the bigram model. */
export function bigram(prev: number) {
  const row = counts[prev], tot = row.reduce((a, b) => a + b, 0);
  return row.map(v => v / tot);
}

export function bigramLoss(seqs: number[][]) {
  let l = 0, c = 0;
  for (const s of seqs) for (let i = 0; i + 1 < s.length; i++) { l -= Math.log(bigram(s[i])[s[i + 1]]); c++; }
  return l / c;
}

/** Does a generated sentence follow one of FARM's four patterns? */
export const isValid = (words: string[]) =>
  /^the (cat|dog|cow|horse) (eats (bread|apple|cheese|rice)|drinks (water|milk|juice)|(sleeps|runs) in the (house|farm|park)) \.$/.test(words.join(" "));
