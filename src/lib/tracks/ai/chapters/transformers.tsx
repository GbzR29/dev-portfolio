"use client";

// Deep Learning 5: transformers and LLMs — tokens by byte-pair encoding (Bpe
// figure); positions (learned and sinusoidal); the pre-norm block with
// LayerNorm, attention, MLP and residuals; the whole decoder and the
// next-token loss; a tiny GPT trained in the page vs a bigram model
// (TinyGpt figure, measured); generation, temperature, top-k, top-p (measured
// validity); counting GPT-2's 124 439 808 parameters; from pretraining to an
// assistant (fine-tuning, RLHF, KV cache, scaling); C++ (layerNorm, block,
// nextToken, sample); mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { BpeFigure } from "@/components/lesson/figures/ai/BpeFigure";
import { TinyGptFigure } from "@/components/lesson/figures/ai/TinyGptFigure";

const r = String.raw;

export function TransformersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiTf_intro",
          "In 2017 a paper from Google titled \"Attention Is All You Need\" (Vaswani and others) dropped the recurrence altogether and built a translation model from attention, small MLPs and residual connections: the transformer. A year later OpenAI trained its decoder half on plain text to predict the next word, and called it GPT. Scaled up, the same design became GPT-2, GPT-3 and the chat assistants of today. Every piece is already in this track. This chapter assembles them, trains a tiny GPT in the page, counts the parameters of GPT-2 one matrix at a time, and explains how a text predictor becomes an assistant.")}
      </Lead>

      <Goals t={t} id="aiTf" items={[
        "Tokenise text with byte-pair encoding and explain why no word is ever unknown.",
        "Draw a transformer block: LayerNorm, attention, MLP and the two residual connections.",
        "Train a small GPT on next-token prediction and compare it with a bigram model.",
        "Count a GPT's parameters from its sizes, and control generation with temperature, top-k and top-p.",
      ]} />

      <H2>{tx(t, "aiTf_tokTitle", "From text to tokens")}</H2>
      <p>
        {tx(t, "aiTf_tokBody",
          "A model needs a fixed vocabulary. Whole words do not work well: there are too many, new ones appear every day, and \"lowest\" would be unknown even if \"low\" and \"widest\" were known. Single characters work for any text, but make sequences long, and attention costs n². The compromise is subwords, found by byte-pair encoding (BPE; Sennrich and others, 2016, after a 1994 compression method): start from single characters, count every pair of neighbouring tokens in a large text, merge the most frequent pair into a new token, and repeat until the vocabulary has the size you want.")}
      </p>
      <BpeFigure t={t} />
      <p>
        {tx(t, "aiTf_tokGpt2",
          "GPT-2 starts from the 256 possible byte values, so any file, in any language or alphabet, can be encoded, and learns 50 000 merges; with one extra token marking the end of a text, its vocabulary has 50 257 tokens. Common words become a single token, rare words a few pieces, and English text averages about four characters per token. Tokenisation explains some odd behaviour: a model that sees \"strawberry\" as two or three tokens never sees its letters, which is why counting the r's in it was famously hard.")}
      </p>

      <H2>{tx(t, "aiTf_posTitle", "Positions")}</H2>
      <p>
        {tx(t, "aiTf_posBody",
          "Attention cannot tell the order of its inputs, so each token's vector gets a position vector added to it before the first block: x_i = E[token_i] + P[i]. GPT-2 learns P like any embedding table, one row per position, 1 024 rows, which is why it cannot read more than 1 024 tokens at once. The original transformer used fixed sine waves instead, each pair of dimensions turning at its own speed, so that every position has a distinct pattern and nearby positions have similar ones.")}
      </p>
      <Equation label={tx(t, "aiTf_eqPos", "Sinusoidal position encoding (Vaswani and others, 2017)")}
        where={[
          [r`pos`, tx(t, "aiTf_wPos", "the position in the sequence: 0, 1, 2…")],
          [r`i`, tx(t, "aiTf_wI", "which pair of dimensions: 0 … d/2 − 1; dimension 2i gets the sine, 2i + 1 the cosine")],
          [r`d`, tx(t, "aiTf_wD", "the model width, d_model")],
          [r`10000^{2i/d}`, tx(t, "aiTf_wWave", "the wavelength factor: the first pair turns once every 2π ≈ 6 positions, the last almost not at all")],
        ]}>
        {r`P_{pos,\,2i} = \sin\!\left(\frac{pos}{10000^{2i/d}}\right), \qquad P_{pos,\,2i+1} = \cos\!\left(\frac{pos}{10000^{2i/d}}\right)`}
      </Equation>
      <p>
        {tx(t, "aiTf_posModern",
          "Most recent models use rotary position embeddings (RoPE) instead: rather than adding a vector, they rotate each query and key by an angle proportional to its position, so the score q · k depends on how far apart the two tokens are. Either way the point is the same: without positions, \"the dog bit the man\" and \"the man bit the dog\" are the same input.")}
      </p>

      <H2>{tx(t, "aiTf_blockTitle", "The transformer block")}</H2>
      <p>
        {tx(t, "aiTf_blockBody",
          "A block has two sub-layers, each wrapped the same way: normalise, transform, and add the result back to the input. The first sub-layer is multi-head causal self-attention, where tokens exchange information. The second is a small MLP applied to each position separately (the same weights at every position), where each token processes what it has gathered. A GPT is a stack of identical blocks: 12 in GPT-2 small, 96 in GPT-3.")}
      </p>
      <Equation label={tx(t, "aiTf_eqBlock", "One pre-norm block, as in GPT-2")}
        where={[
          [r`x`, tx(t, "aiTf_wX", "the n × d matrix of token vectors, the residual stream")],
          [r`\operatorname{LN}`, tx(t, "aiTf_wLN", "LayerNorm, defined below; each sub-layer has its own")],
          [r`\operatorname{MHA}`, tx(t, "aiTf_wMHA", "masked multi-head self-attention from the Attention chapter")],
          [r`W_1, W_2`, tx(t, "aiTf_wW", "the MLP's weights: d → 4d → d; b₁, b₂ their biases")],
          [r`\operatorname{GELU}`, tx(t, "aiTf_wGelu", "a smooth version of ReLU, x · Φ(x) with Φ the normal distribution's cumulative function; the tiny model below uses ReLU")],
        ]}>
        {r`x \leftarrow x + \operatorname{MHA}\big(\operatorname{LN}_1(x)\big), \qquad x \leftarrow x + W_2\,\operatorname{GELU}\big(W_1\operatorname{LN}_2(x) + b_1\big) + b_2`}
      </Equation>
      <Equation label={tx(t, "aiTf_eqLN", "LayerNorm of one token's vector")}
        where={[
          [r`\mu, \sigma^2`, tx(t, "aiTf_wMu", "the mean and variance of the d numbers of this one vector")],
          [r`\epsilon`, tx(t, "aiTf_wEps", "a tiny constant such as 10⁻⁵, so a constant vector does not divide by 0")],
          [r`\gamma, \beta`, tx(t, "aiTf_wGamma", "a learned scale and shift per dimension, starting at 1 and 0")],
        ]}>
        {r`\operatorname{LN}(x)_j = \gamma_j\,\frac{x_j - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta_j`}
      </Equation>
      <p>
        {tx(t, "aiTf_blockWhy",
          "Each piece has a job. The residual additions are the ResNet trick from the CNN chapter: the gradient flows straight down the stack through the \"+ x\" paths, so 96 blocks train as easily as 2. LayerNorm keeps every vector at a steady scale whatever the blocks before it did, so the next block's weights see inputs of a familiar size (Batch normalisation, common in CNNs, normalises across the examples of a batch instead; LayerNorm uses only the token itself, which works for any batch size and sequence length). Think of x as a shared workspace that runs from the embedding to the output: each block reads it, and adds a correction.")}
      </p>

      <H2>{tx(t, "aiTf_modelTitle", "The whole model and its objective")}</H2>
      <p>
        {tx(t, "aiTf_modelBody",
          "Embeddings plus positions go in; N blocks transform them; a final LayerNorm and one output matrix turn each position's vector into V logits, one per token of the vocabulary; a softmax turns them into the probabilities of the next token. GPT-2 reuses the token embedding table, transposed, as its output matrix (weight tying), so a token's input and output representations are the same vector. Training needs no labels: the text supplies its own answers.")}
      </p>
      <Equation label={tx(t, "aiTf_eqLoss", "The language-modelling loss of one sequence")}
        where={[
          [r`t_1 \ldots t_n`, tx(t, "aiTf_wT", "the tokens of a training text")],
          [r`p_\theta(t_{i+1} \mid t_1 \ldots t_i)`, tx(t, "aiTf_wP", "the probability the model, with parameters θ, gives to the true next token after reading the first i")],
          [r`L`, tx(t, "aiTf_wL", "the mean cross-entropy over all n − 1 predictions")],
        ]}>
        {r`L = -\frac{1}{n-1}\sum_{i=1}^{n-1} \ln p_\theta\!\left(t_{i+1} \mid t_1, \ldots, t_i\right)`}
      </Equation>
      <p>
        {tx(t, "aiTf_modelMask",
          "The causal mask makes this efficient: one forward pass over a text of n tokens produces all n − 1 predictions at once, each from its own prefix, so a single sequence is n − 1 training examples. A model trained this way is a pretrained language model.")}
      </p>

      <H2>{tx(t, "aiTf_tinyTitle", "A tiny GPT, trained in the page")}</H2>
      <p>
        {tx(t, "aiTf_tinyBody",
          "Here is the whole design at a toy size, written out by hand with its backward pass and checked with the gradient check (largest relative error 3 · 10⁻⁸). The tokens are the 20 FARM words plus \"<s>\" (start) and \".\" (end): V = 22. One block, d = 16, 2 heads of 8, an MLP of 32 ReLU units, at most 8 positions: 3 046 parameters. It is trained with Adam (η = 0.01, 10 sentences per batch) on the 200 FARM sentences and tested on 200 new ones.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiTf_tModel", "Model"), tx(t, "aiTf_tLoss", "Test loss per token")]}
        rows={[
          [tx(t, "aiTf_m0", "uniform guess over 22 tokens (ln 22)"), "3.091"],
          [tx(t, "aiTf_m1", "bigram: counts of (previous word, next word)"), "0.871"],
          [tx(t, "aiTf_m2", "tiny GPT, after 20 epochs"), "0.703"],
          [tx(t, "aiTf_m3", "the best possible for this corpus"), "0.657"],
        ]}
      />
      <TinyGptFigure t={t} />
      <p>
        {tx(t, "aiTf_tinyWhy",
          "Where does the bigram lose? On \"the\". Every FARM sentence starts with \"the\" followed by an animal, but in sleeps/runs sentences a second \"the\" is followed by a place. The bigram sees only \"the\", so it can only learn the mixture: two thirds animals, one third places. The transformer looks back at the whole sentence and gives places 0.99 of the probability after \"sleeps in the\". The best possible loss comes from counting what is genuinely random in the generator: which animal (1 in 4), which of the four patterns (1 in 4), and which food (1 in 4), drink or place (1 in 3); everything else is determined. That is 9 ln 4 + 3 ln 3 = 15.77 nats for every 24 predictions, 0.657 per token. The tiny GPT gets within 0.05 of it; its training loss, 0.643, is even a little below, the sign of a model starting to memorise the quirks of its 200 sentences.")}
      </p>

      <H2>{tx(t, "aiTf_genTitle", "Generating text")}</H2>
      <p>
        {tx(t, "aiTf_genBody",
          "To write, the model predicts a distribution for the next token, one token is picked from it and appended, and the loop runs again with the longer text, until an end token or a length limit. Each new token needs a forward pass, which is why answers appear word by word. How the token is picked matters as much as the model.")}
      </p>
      <Equation label={tx(t, "aiTf_eqTemp", "Sampling with a temperature")}
        where={[
          [r`z_i`, tx(t, "aiTf_wZ", "the logit of token i")],
          [r`T`, tx(t, "aiTf_wTemp", "the temperature: 1 leaves the model's probabilities as they are, below 1 sharpens them, above 1 flattens them; T → 0 always picks the top token (greedy)")],
          [r`p_i`, tx(t, "aiTf_wPi", "the original probability of token i; raising it to 1/T and renormalising is the same thing")],
        ]}>
        {r`q_i = \frac{e^{z_i/T}}{\sum_j e^{z_j/T}} = \frac{p_i^{1/T}}{\sum_j p_j^{1/T}}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "aiTf_tTemp", "Temperature"), tx(t, "aiTf_tValid", "Sentences that follow a FARM pattern (500 sampled)")]}
        rows={[
          [tx(t, "aiTf_g0", "0 (greedy)"), tx(t, "aiTf_g0b", "always the same sentence: \"the cow sleeps in the farm .\"")],
          ["0.5", "100 %"],
          ["1", "98 %"],
          ["1.5", "82 %"],
          ["2", "50 %"],
          ["3", "8 %"],
        ]}
      />
      <p>
        {tx(t, "aiTf_genRead",
          "Greedy decoding is correct but dull and repetitive. A temperature near 1 samples what the model actually learned: varied and mostly right. High temperatures give the unlikely tail too much weight, and nonsense like \"the house eats rice\" appears. Two cut-offs keep variety while removing the tail: top-k keeps only the k most likely tokens; top-p (nucleus sampling, Holtzman and others, 2019) keeps the smallest set of top tokens whose probabilities add up to p, say 0.9, so the set is small when the model is sure and large when it is not.")}
      </p>

      <H2>{tx(t, "aiTf_countTitle", "Counting GPT-2's parameters")}</H2>
      <p>
        {tx(t, "aiTf_countBody",
          "Every parameter can be found from four sizes: the vocabulary V, the context length P, the width d and the number of blocks N. In one block, attention has four d × d matrices with their biases (4d² + 4d); the MLP has d × 4d and 4d × d matrices with biases (8d² + 5d); the two LayerNorms have a γ and a β each (4d). That is 12d² + 13d per block.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiTf_tPart", "GPT-2 small: V = 50 257, P = 1 024, d = 768, N = 12"), tx(t, "aiTf_tCount", "Parameters")]}
        rows={[
          [tx(t, "aiTf_p1", "token embeddings, V · d (also the output layer, tied)"), "38 597 376"],
          [tx(t, "aiTf_p2", "position embeddings, P · d"), "786 432"],
          [tx(t, "aiTf_p3", "one block, 12d² + 13d"), "7 087 872"],
          [tx(t, "aiTf_p4", "12 blocks"), "85 054 464"],
          [tx(t, "aiTf_p5", "final LayerNorm, 2d"), "1 536"],
          [tx(t, "aiTf_p6", "total"), "124 439 808"],
        ]}
      />
      <LessonTable
        headers={[tx(t, "aiTf_tModel", "Model"), "d", "N", tx(t, "aiTf_tCount", "Parameters")]}
        rows={[
          ["GPT-2 small", "768", "12", "124 M"],
          ["GPT-2 medium", "1 024", "24", "355 M"],
          ["GPT-2 large", "1 280", "36", "774 M"],
          ["GPT-2 XL", "1 600", "48", "1.56 B"],
          ["GPT-3", "12 288", "96", "175 B"],
        ]}
      />
      <p>
        {tx(t, "aiTf_countRead",
          "The same formula reproduces each published size: GPT-2 medium is 354 823 168 parameters, XL 1 557 611 200. The d² term dominates as models grow: in GPT-3, 96 blocks of 12 · 12 288² weights are 174 billion of its 175. Our tiny GPT is 3 046 parameters; GPT-3 has 57 million times as many, and the same equations.")}
      </p>

      <H2>{tx(t, "aiTf_assistTitle", "From a text predictor to an assistant")}</H2>
      <LessonTable
        headers={[tx(t, "aiTf_tStage", "Stage"), tx(t, "aiTf_tWhatHappens", "What happens")]}
        rows={[
          [tx(t, "aiTf_s1", "Pretraining"), tx(t, "aiTf_s1b", "next-token prediction on an enormous text collection (GPT-3: about 300 billion tokens of web pages, books and Wikipedia). The model learns grammar, facts, styles and some reasoning, because all of them help predict the next token. It continues text; it does not answer questions.")],
          [tx(t, "aiTf_s2", "Supervised fine-tuning"), tx(t, "aiTf_s2b", "the same training on a much smaller set of example conversations written by people: an instruction, then a good answer. The model learns the format of being helpful.")],
          [tx(t, "aiTf_s3", "Learning from preferences (RLHF)"), tx(t, "aiTf_s3b", "people rank several answers to the same prompt; a reward model learns to predict their rankings; the language model is then tuned to produce answers the reward model scores highly (Ouyang and others, 2022). This is the reinforcement learning of the next section of this track.")],
        ]}
      />
      <H3>{tx(t, "aiTf_kvTitle", "Making generation fast: the KV cache")}</H3>
      <p>
        {tx(t, "aiTf_kvBody",
          "With the causal mask, the keys and values of earlier tokens never change when a token is appended. So a generator stores them, the KV cache, and for each new token computes only that token's query, key and value and one row of attention. Generating token n then costs work in proportion to n instead of n². The cache is also why long conversations use a lot of memory: GPT-2 small stores 2 · 12 blocks · 768 numbers per token.")}
      </p>
      <H3>{tx(t, "aiTf_scaleTitle", "Scaling")}</H3>
      <p>
        {tx(t, "aiTf_scaleBody",
          "Kaplan and others (2020) measured that the test loss of these models falls smoothly, as a power law, as parameters, data and compute grow, which is why the models kept getting bigger. Hoffmann and others (2022, \"Chinchilla\") showed that for a fixed compute budget, many models had been too large and trained on too little text, and that about 20 training tokens per parameter is the better balance.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "aiTf_halluc", "A language model is trained to produce likely text, not true text. When it does not know something, the most likely continuation of a confident question is often a confident, fluent, wrong answer: a hallucination. Our tiny GPT does the same at a high temperature (\"the house eats rice\"). Fine-tuning reduces it and tools such as search help, but the objective has not changed: check anything that matters.")}
      </Callout>

      <H2>{tx(t, "aiTf_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiTf_codeBody",
          "LayerNorm, a pre-norm block built on multiHead from the Attention chapter, the next-token probabilities of a whole GPT, and sampling with temperature and top-k. On a model with random weights the probabilities add up to 1.000000, and on a distribution whose top token has p = 0.224, sampling picks that token 100 % of the time at T = 0, 46 % at T = 0.5, 22.4 % at T = 1 and 12 % at T = 2.")}
      </p>
      <CodeBlock lang="cpp" filename="gpt.h" t={t}>{`#include <numeric>
#include <random>
#include "attention.h"                                    // Matrix, matmul, attention, multiHead

// LayerNorm of each row: (x − mean) / √(variance + ε), then × γ + β, one γ and β per column.
Matrix layerNorm(const Matrix& X, const std::vector<double>& g, const std::vector<double>& b) {
    Matrix Y(X.rows, X.cols);
    for (std::size_t i = 0; i < X.rows; ++i) {
        double mean = 0.0, var = 0.0;
        for (std::size_t j = 0; j < X.cols; ++j) mean += X(i, j);
        mean /= double(X.cols);
        for (std::size_t j = 0; j < X.cols; ++j) var += (X(i, j) - mean) * (X(i, j) - mean);
        const double inv = 1.0 / std::sqrt(var / double(X.cols) + 1e-5);
        for (std::size_t j = 0; j < X.cols; ++j) Y(i, j) = g[j] * (X(i, j) - mean) * inv + b[j];
    }
    return Y;
}

struct Block {
    std::size_t heads;
    Matrix Wq, Wk, Wv, Wo;                                // d × d each
    Matrix W1, W2;                                        // d × ff and ff × d (ff = 4d in GPT-2)
    std::vector<double> c1, c2, g1, b1, g2, b2;           // MLP biases, the two LayerNorms
};

// One pre-norm transformer block: x += attention(LN(x)); x += MLP(LN(x)).
Matrix block(const Block& B, Matrix x) {
    const Matrix att = multiHead(layerNorm(x, B.g1, B.b1), B.Wq, B.Wk, B.Wv, B.Wo, B.heads, true);
    for (std::size_t k = 0; k < x.a.size(); ++k) x.a[k] += att.a[k];          // residual
    Matrix h = matmul(layerNorm(x, B.g2, B.b2), B.W1);
    for (std::size_t k = 0; k < h.a.size(); ++k) h.a[k] = std::max(0.0, h.a[k] + B.c1[k % h.cols]);   // ReLU (GPT-2: GELU)
    const Matrix m = matmul(h, B.W2);
    for (std::size_t k = 0; k < x.a.size(); ++k) x.a[k] += m.a[k] + B.c2[k % x.cols];   // residual
    return x;
}

struct Gpt {
    Matrix E, Pos, U;                                     // V × d tokens, P × d positions, d × V output
    std::vector<double> cu, gf, bf;                       // output bias, final LayerNorm
    std::vector<Block> blocks;
};

// The probabilities of the token that follows tokens[0…n−1].
std::vector<double> nextToken(const Gpt& m, const std::vector<std::size_t>& tokens) {
    const std::size_t n = tokens.size(), d = m.E.cols;
    Matrix x(n, d);
    for (std::size_t i = 0; i < n; ++i)
        for (std::size_t j = 0; j < d; ++j) x(i, j) = m.E(tokens[i], j) + m.Pos(i, j);   // token + position
    for (const Block& B : m.blocks) x = block(B, x);
    const Matrix f = layerNorm(x, m.gf, m.bf);
    std::vector<double> z(m.U.cols);
    for (std::size_t v = 0; v < m.U.cols; ++v) {          // only the last row is needed to continue the text
        z[v] = m.cu[v];
        for (std::size_t j = 0; j < d; ++j) z[v] += f(n - 1, j) * m.U(j, v);
    }
    const double mx = *std::max_element(z.begin(), z.end());
    double sum = 0.0;
    for (double& v : z) sum += v = std::exp(v - mx);
    for (double& v : z) v /= sum;
    return z;
}

// Picks the next token: keep the k most likely (k = 0: all), raise to the power 1/T, renormalise, draw.
std::size_t sample(std::vector<double> p, double temperature, std::size_t topK, std::mt19937& rng) {
    std::vector<std::size_t> idx(p.size());
    std::iota(idx.begin(), idx.end(), 0);
    std::sort(idx.begin(), idx.end(), [&](std::size_t a, std::size_t b) { return p[a] > p[b]; });
    if (temperature <= 1e-3) return idx[0];               // T → 0: greedy
    if (topK > 0) for (std::size_t r = topK; r < idx.size(); ++r) p[idx[r]] = 0.0;
    for (double& v : p) v = v > 0.0 ? std::pow(v, 1.0 / temperature) : 0.0;   // p^(1/T) = e^(ln p / T)
    std::discrete_distribution<std::size_t> pick(p.begin(), p.end());          // renormalises for us
    return pick(rng);
}`}</CodeBlock>
      <p>
        {tx(t, "aiTf_codeUse",
          "Generation is a loop around these two functions: tokens = {start}; repeat: p = nextToken(model, tokens); tokens.push_back(sample(p, T, k, rng)); until the end token. Training needs the backward pass of every piece, the chain rule through LayerNorm, attention, the MLP and the residual additions, as in the figure's version; with it, the training loop is the one from the Training chapter.")}
      </p>

      <H2>{tx(t, "aiTf_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiTf_tMistake", "Mistake"), tx(t, "aiTf_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiTf_e1", "Forgetting the position embeddings"), tx(t, "aiTf_e1b", "the model sees a bag of tokens and cannot tell word order. Add P[i] (or rotate queries and keys) before the first block.")],
          [tx(t, "aiTf_e2", "No causal mask in a language model"), tx(t, "aiTf_e2b", "training loss drops to nearly 0 because every position can read its answer; generation then fails. Mask the future.")],
          [tx(t, "aiTf_e3", "Off-by-one between inputs and targets"), tx(t, "aiTf_e3b", "the model learns to copy the current token. Inputs are t₁…t_{n−1}, targets t₂…t_n.")],
          [tx(t, "aiTf_e4", "Generating past the context length"), tx(t, "aiTf_e4b", "there is no position embedding for token P + 1. Keep only the last P tokens (a sliding window) or stop.")],
          [tx(t, "aiTf_e5", "Recomputing every token at every step"), tx(t, "aiTf_e5b", "generation costs n² per token. Cache the keys and values of earlier tokens.")],
          [tx(t, "aiTf_e6", "Treating fluent output as verified"), tx(t, "aiTf_e6b", "the objective rewards likely text, not true text. Check facts, especially numbers, names and citations.")],
        ]}
      />

      <KeyIdeas t={t} id="aiTf" items={[
        "BPE builds a subword vocabulary by repeatedly merging the most frequent pair; starting from bytes, no text is ever unknown.",
        "Positions are added to the token embeddings (learned, sinusoidal or rotary) because attention alone ignores order.",
        "A block is x += MHA(LN(x)); x += MLP(LN(x)): attention mixes tokens, the MLP processes each one, residuals keep gradients flowing.",
        "A GPT is trained to predict the next token; with the causal mask, a sequence of n tokens gives n − 1 training examples in one pass.",
        "A one-block GPT with 3 046 parameters beats a bigram model on FARM (0.703 vs 0.871 per token) because it reads the whole context.",
        "Temperature, top-k and top-p trade variety for reliability: at T = 1 98 % of the tiny GPT's sentences are valid, at T = 3 only 8 %.",
        "A block has 12d² + 13d parameters; GPT-2 small totals 124 439 808. Assistants add fine-tuning and learning from human preferences on top of pretraining.",
      ]} />
    </Article>
  );
}
