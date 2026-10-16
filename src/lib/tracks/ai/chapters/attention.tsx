"use client";

// Deep Learning 4: attention — the encoder bottleneck and Bahdanau's fix;
// queries, keys and values; scaled dot-product attention with a worked
// example (Attention figure: drag the query); why ÷√d (measured saturation);
// self-attention with learned projections and its matrix form; the causal
// mask; attention is blind to order (SelfAttn figure: mask, no-scale, shuffle);
// multi-head attention; the n² cost; C++ (attention, multiHead); mistakes.

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { AttentionFigure } from "@/components/lesson/figures/ai/AttentionFigure";
import { SelfAttnFigure } from "@/components/lesson/figures/ai/SelfAttnFigure";

const r = String.raw;

export function AttentionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiAtt_intro",
          "An RNN reads a sentence and squeezes it into one hidden state. Attention takes the opposite approach: keep a vector for every word, and when you need information, look at all of them and take a weighted average, with the weights computed from how relevant each one is right now. It is one formula, a softmax over dot products, and it is the heart of every large language model. This chapter builds it from a single query up to multi-head self-attention.")}
      </Lead>

      <Goals t={t} id="aiAtt" items={[
        "Compute scaled dot-product attention by hand for a small query, keys and values.",
        "Explain why the scores are divided by √d, with measured numbers.",
        "Write self-attention in matrix form, add a causal mask, and split it into heads.",
        "Explain why attention alone cannot see word order, and what it costs for long inputs.",
      ]} />

      <H2>{tx(t, "aiAtt_bottleTitle", "The bottleneck, and the idea")}</H2>
      <p>
        {tx(t, "aiAtt_bottleBody",
          "In the RNN translator of the last chapter, the decoder sees the source sentence only through the encoder's final state: H numbers for the whole sentence, however long. Bahdanau, Cho and Bengio (2014) let the decoder keep all the encoder's states, h₁ to h_T, and, before writing each word, compute a score for every one of them: how useful is source word j for the word I am about to write? A softmax turns the scores into weights, and the decoder reads the weighted average of the states. When it writes \"chat\" in French, the weight on \"cat\" is high and the others are low; the model learns this alignment by itself, with no labels saying which word goes with which.")}
      </p>

      <H2>{tx(t, "aiAtt_qkvTitle", "Queries, keys and values")}</H2>
      <p>
        {tx(t, "aiAtt_qkvBody",
          "The general form uses the vocabulary of a lookup. A query q describes what is being looked for. Each item has a key k, describing what it offers, and a value v, the content handed back. A dictionary returns the value whose key matches the query exactly; attention returns a blend of all the values, weighted by how well each key matches. The match is the dot product, large when two vectors point the same way.")}
      </p>
      <Equation label={tx(t, "aiAtt_eqOne", "Attention of one query")}
        where={[
          [r`\mathbf{q}`, tx(t, "aiAtt_wQ", "the query, a vector of d numbers")],
          [r`\mathbf{k}_j`, tx(t, "aiAtt_wK", "the key of item j, also d numbers, so it can be dotted with q")],
          [r`\mathbf{v}_j`, tx(t, "aiAtt_wV", "the value of item j, the content returned (any size)")],
          [r`s_j`, tx(t, "aiAtt_wS", "the score of item j: the dot product divided by √d")],
          [r`\alpha_j`, tx(t, "aiAtt_wA", "the attention weight of item j: a softmax of the scores, so all α are positive and add up to 1")],
          [r`\mathbf{o}`, tx(t, "aiAtt_wO", "the output: the values averaged with the weights α")],
        ]}>
        {r`s_j = \frac{\mathbf{q}\cdot\mathbf{k}_j}{\sqrt{d}}, \qquad \alpha_j = \frac{e^{s_j}}{\sum_{j'} e^{s_{j'}}}, \qquad \mathbf{o} = \sum_j \alpha_j\,\mathbf{v}_j`}
      </Equation>
      <p>
        {tx(t, "aiAtt_worked",
          "Work it once. Take d = 2, the query q = (2, 0), the keys k₁ = (1, 0), k₂ = (0, 1), k₃ = (1, 1) and the values v₁ = (10, 0), v₂ = (0, 10), v₃ = (5, 5). The dot products are 2, 0 and 2; divided by √2 they become 1.414, 0 and 1.414. The softmax: e^1.414 = 4.11, e⁰ = 1, total 9.23, so α = (0.446, 0.108, 0.446). The output is 0.446 · (10, 0) + 0.108 · (0, 10) + 0.446 · (5, 5) = (6.69, 3.31): mostly the first and third values, because the query points along the first axis and those two keys have a component there.")}
      </p>
      <AttentionFigure t={t} />

      <H2>{tx(t, "aiAtt_sqrtTitle", "Why divide by √d")}</H2>
      <p>
        {tx(t, "aiAtt_sqrtBody",
          "A dot product of d terms grows with d. If the entries of q and k are independent random numbers with mean 0 and variance 1, each product q_i k_i has variance 1, and the sum of d of them has variance d: the scores spread over a range of about ±√d. Large spreads make the softmax extreme, one weight near 1 and the rest near 0. The softmax's slope, ∂α_i/∂s_j = α_i([i = j] − α_j), is then near 0 everywhere, so the gradient through the attention vanishes and the scores stop learning. Dividing by √d brings the spread back to about ±1, whatever d is.")}
      </p>
      <LessonTable
        headers={["d", tx(t, "aiAtt_tStd", "Spread of q·k (measured)"), tx(t, "aiAtt_tScaled", "Largest weight, with ÷√d"), tx(t, "aiAtt_tRaw", "Largest weight, without")]}
        rows={[
          ["2", "1.39", "0.29", "0.37"],
          ["8", "2.76", "0.31", "0.62"],
          ["64", "7.94", "0.32", "0.87"],
          ["512", "23.35", "0.32", "0.95"],
        ]}
      />
      <p>
        {tx(t, "aiAtt_sqrtRead",
          "Measured over 2 000 random queries, each with 10 random keys. The spread is the standard deviation of the scores, close to √d each time (1.41, 2.83, 8, 22.6). With the scaling, the largest of the 10 weights stays around 0.3 whatever d is. Without it, at d = 64 (the size of one head in GPT-2) the largest weight averages 0.87 and at d = 512 it is 0.95: attention has collapsed onto one item before training even starts.")}
      </p>

      <H2>{tx(t, "aiAtt_selfTitle", "Self-attention")}</H2>
      <p>
        {tx(t, "aiAtt_selfBody",
          "In self-attention the queries, keys and values all come from the same sequence. Each word's vector x_i (its embedding) is multiplied by three learned matrices to produce its query, its key and its value. Then every word attends over every word, itself included. The result for word i is a new vector that mixes in information from the words it found relevant: \"it\" can pull in the vector of the noun it refers to, \"bank\" can pull in \"river\" or \"account\". This is how a model builds contextual embeddings, the thing the Embeddings chapter said static vectors cannot do.")}
      </p>
      <Equation label={tx(t, "aiAtt_eqSelf", "Self-attention in matrix form")}
        where={[
          [r`X`, tx(t, "aiAtt_wX", "the input: n rows (one per word), each a vector of d_model numbers")],
          [r`W_Q, W_K, W_V`, tx(t, "aiAtt_wW", "learned matrices, d_model × d each: they turn every row of X into its query, key and value")],
          [r`QK^{\top}`, tx(t, "aiAtt_wQK", "an n × n matrix of all the scores at once: row i, column j is q_i · k_j")],
          [r`\operatorname{softmax}`, tx(t, "aiAtt_wSoft", "applied to each row separately, so each row of weights adds up to 1")],
          [r`M`, tx(t, "aiAtt_wM", "the mask: 0 where looking is allowed, −∞ where it is not (only with the causal mask)")],
        ]}>
        {r`Q = XW_Q,\quad K = XW_K,\quad V = XW_V, \qquad \operatorname{Attention}(Q,K,V) = \operatorname{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d}} + M\right)V`}
      </Equation>
      <p>
        {tx(t, "aiAtt_selfMatrix",
          "The matrix form is why attention suits GPUs: all n queries are handled by two matrix multiplications, with no step waiting for the one before, unlike the RNN. The figure below skips the three learned matrices (each word's query, key and value is just its embedding) to show the mechanics on real numbers.")}
      </p>
      <SelfAttnFigure t={t} />

      <H3>{tx(t, "aiAtt_maskTitle", "The causal mask")}</H3>
      <p>
        {tx(t, "aiAtt_maskBody",
          "A language model learns to predict each word from the words before it. If position 3 could attend to position 4, it would simply copy the answer. The causal mask adds −∞ to every score above the diagonal (a key later than the query); e^(−∞) = 0, so those weights are exactly 0 and the softmax shares the weight among the allowed positions only. With the mask, one pass over a sentence of n words trains n predictions at once, each seeing only its past.")}
      </p>

      <H3>{tx(t, "aiAtt_orderTitle", "Attention is blind to order")}</H3>
      <p>
        {tx(t, "aiAtt_orderBody",
          "Shuffle the words and each word gets exactly the same weights to the same words, only in new places: the output is the old output, shuffled the same way. Mathematically, self-attention is permutation-equivariant. Nothing in the formula knows that one word came before another (the causal mask is the only exception, and it only knows \"before\", not \"how far\"). \"The dog bit the man\" and \"the man bit the dog\" give the same set of vectors. The transformer fixes this by adding a position vector to each word's embedding before the first layer, as the next chapter shows.")}
      </p>

      <H2>{tx(t, "aiAtt_headsTitle", "Multi-head attention")}</H2>
      <p>
        {tx(t, "aiAtt_headsBody",
          "One softmax gives each word one way to spread its attention, but a word often needs several kinds of information at once: which noun \"it\" refers to, which verb this is the object of, what the previous word was. Multi-head attention runs h attentions side by side, each on its own slice of the projections (d_model/h numbers per head), concatenates their outputs and mixes them with one more matrix W_O. GPT-2 small has d_model = 768 and 12 heads of 64.")}
      </p>
      <Equation label={tx(t, "aiAtt_eqHeads", "Multi-head attention")}
        where={[
          [r`h`, tx(t, "aiAtt_wH", "the number of heads")],
          [r`Q_i, K_i, V_i`, tx(t, "aiAtt_wQi", "head i's columns of Q, K and V: d_model/h of them each")],
          [r`\operatorname{concat}`, tx(t, "aiAtt_wCat", "the h outputs placed side by side, back to d_model columns")],
          [r`W_O`, tx(t, "aiAtt_wWo", "a learned d_model × d_model matrix that mixes the heads")],
        ]}>
        {r`\operatorname{MultiHead}(X) = \operatorname{concat}\big(\operatorname{head}_1,\ldots,\operatorname{head}_h\big)\,W_O, \qquad \operatorname{head}_i = \operatorname{Attention}(Q_i, K_i, V_i)`}
      </Equation>
      <p>
        {tx(t, "aiAtt_headsCount",
          "Splitting into heads costs nothing extra: the four matrices hold 4 · d_model² weights however many heads there are; 4 · 768² = 2 359 296 per GPT-2 layer, plus 3 072 biases. Trained heads specialise. Researchers have found heads that attend to the previous word, heads that link a pronoun to its noun, and \"induction heads\" that find an earlier occurrence of the current word and copy what followed it, a mechanism behind in-context learning.")}
      </p>

      <H2>{tx(t, "aiAtt_costTitle", "The cost: n²")}</H2>
      <p>
        {tx(t, "aiAtt_costBody",
          "Every word scores every word, so a sequence of n words needs n² scores per head per layer. For 1 000 tokens that is a million; for 100 000 tokens, ten billion. The memory for the weights grows the same way. This quadratic cost is why language models have a context window, a maximum length they can read, and why so much research goes into cheaper attention (sparse patterns, sliding windows, and FlashAttention, which computes exactly the same result in tiles without ever storing the full n × n matrix).")}
      </p>
      <LessonTable
        headers={[tx(t, "aiAtt_tModel", "Model"), tx(t, "aiAtt_tMix", "How a word reaches a word k places away"), tx(t, "aiAtt_tPar", "Steps in parallel?"), tx(t, "aiAtt_tCost", "Cost per layer")]}
        rows={[
          ["RNN", tx(t, "aiAtt_c1", "through k recurrent steps; the signal fades"), tx(t, "aiAtt_c1p", "no: one step after another"), "n · d²"],
          [tx(t, "aiAtt_c2n", "convolution, kernel k"), tx(t, "aiAtt_c2", "through about n/k stacked layers"), tx(t, "aiAtt_c2p", "yes"), "n · k · d²"],
          [tx(t, "aiAtt_c3n", "self-attention"), tx(t, "aiAtt_c3", "directly, in one layer"), tx(t, "aiAtt_c3p", "yes"), "n² · d"],
        ]}
      />

      <H2>{tx(t, "aiAtt_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiAtt_codeBody",
          "A small matrix type, scaled dot-product attention with an optional causal mask, and multi-head self-attention. On the worked example it prints the weights 0.446, 0.108, 0.446 and the output (6.69, 3.31). With the causal mask, changing the last word of a 5-word input changes the last output row and leaves the first four exactly as they were.")}
      </p>
      <CodeBlock lang="cpp" filename="attention.h" t={t}>{`#include <algorithm>
#include <cmath>
#include <limits>
#include <vector>

// A row-major matrix: rows × cols numbers.
struct Matrix {
    std::size_t rows = 0, cols = 0;
    std::vector<double> a;
    Matrix(std::size_t r, std::size_t c) : rows(r), cols(c), a(r * c, 0.0) {}
    double& operator()(std::size_t i, std::size_t j)       { return a[i * cols + j]; }
    double  operator()(std::size_t i, std::size_t j) const { return a[i * cols + j]; }
};

Matrix matmul(const Matrix& A, const Matrix& B) {        // (n × k)·(k × m) = n × m
    Matrix C(A.rows, B.cols);
    for (std::size_t i = 0; i < A.rows; ++i)
        for (std::size_t k = 0; k < A.cols; ++k)
            for (std::size_t j = 0; j < B.cols; ++j) C(i, j) += A(i, k) * B(k, j);
    return C;
}

// softmax(Q·Kᵀ/√d)·V. Q: n × d, K: m × d, V: m × dv. With \`causal\`, query i only sees keys 0…i.
// \`weights\` receives the n × m attention weights.
Matrix attention(const Matrix& Q, const Matrix& K, const Matrix& V, bool causal, Matrix* weights = nullptr) {
    const double scale = 1.0 / std::sqrt(double(Q.cols));
    Matrix Wt(Q.rows, K.rows);
    for (std::size_t i = 0; i < Q.rows; ++i) {
        double mx = -std::numeric_limits<double>::infinity();
        for (std::size_t j = 0; j < K.rows; ++j) {
            if (causal && j > i) { Wt(i, j) = -std::numeric_limits<double>::infinity(); continue; }   // the future: masked
            double dot = 0.0;
            for (std::size_t k = 0; k < Q.cols; ++k) dot += Q(i, k) * K(j, k);
            Wt(i, j) = dot * scale;
            mx = std::max(mx, Wt(i, j));
        }
        double sum = 0.0;
        for (std::size_t j = 0; j < K.rows; ++j) sum += Wt(i, j) = std::exp(Wt(i, j) - mx);   // e^(−∞) = 0
        for (std::size_t j = 0; j < K.rows; ++j) Wt(i, j) /= sum;
    }
    if (weights) *weights = Wt;
    return matmul(Wt, V);                                 // each output row: a weighted average of V's rows
}

// Multi-head self-attention on X (n × dModel). Wq, Wk, Wv, Wo are dModel × dModel; head h uses
// columns h·dh … (h+1)·dh − 1 of the projections, with dh = dModel / heads.
Matrix multiHead(const Matrix& X, const Matrix& Wq, const Matrix& Wk, const Matrix& Wv, const Matrix& Wo,
                 std::size_t heads, bool causal) {
    const Matrix Q = matmul(X, Wq), K = matmul(X, Wk), V = matmul(X, Wv);
    const std::size_t n = X.rows, dh = X.cols / heads;
    Matrix concat(n, X.cols);
    for (std::size_t h = 0; h < heads; ++h) {
        Matrix q(n, dh), k(n, dh), v(n, dh);              // this head's slice of the columns
        for (std::size_t i = 0; i < n; ++i)
            for (std::size_t c = 0; c < dh; ++c) { q(i, c) = Q(i, h * dh + c); k(i, c) = K(i, h * dh + c); v(i, c) = V(i, h * dh + c); }
        const Matrix out = attention(q, k, v, causal);
        for (std::size_t i = 0; i < n; ++i)
            for (std::size_t c = 0; c < dh; ++c) concat(i, h * dh + c) = out(i, c);   // heads side by side
    }
    return matmul(concat, Wo);                            // mix the heads back together
}`}</CodeBlock>
      <p>
        {tx(t, "aiAtt_codeUse",
          "Training needs the backward pass of attention. It is the chain rule through three familiar pieces: the matrix product with V (as in a dense layer), the row softmax (∂α_i/∂s_j = α_i([i = j] − α_j)), and the product QKᵀ, which sends gradients to both Q and K. Real libraries fuse all of this into one kernel.")}
      </p>

      <H2>{tx(t, "aiAtt_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiAtt_tMistake", "Mistake"), tx(t, "aiAtt_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiAtt_e1", "Forgetting the ÷√d"), tx(t, "aiAtt_e1b", "the softmax saturates (0.87 on one item at d = 64 before any training) and gradients vanish. Divide the scores by √(head size).")],
          [tx(t, "aiAtt_e2", "Softmax over the wrong axis"), tx(t, "aiAtt_e2b", "the weights for each key add up to 1 instead of the weights of each query. Normalise each row: one query, all its keys.")],
          [tx(t, "aiAtt_e3", "Masking with 0 instead of −∞"), tx(t, "aiAtt_e3b", "a score of 0 still gets e⁰ = 1 in the softmax, so the future leaks in. Mask the scores with −∞ (or a very negative number) before the softmax.")],
          [tx(t, "aiAtt_e4", "Masking after the softmax"), tx(t, "aiAtt_e4b", "the remaining weights no longer add up to 1. Mask first, then normalise.")],
          [tx(t, "aiAtt_e5", "Expecting attention to know word order"), tx(t, "aiAtt_e5b", "without positions, any shuffle of the input gives the same outputs, shuffled. Add positional information to the inputs.")],
          [tx(t, "aiAtt_e6", "Head size not dividing d_model"), tx(t, "aiAtt_e6b", "the heads' slices do not tile the columns. Choose h so that d_model/h is a whole number.")],
        ]}
      />

      <KeyIdeas t={t} id="aiAtt" items={[
        "Attention replaces one summary vector with a weighted average over all the vectors, with weights chosen anew for every query.",
        "Scores are q · k / √d; a softmax turns them into weights that add up to 1; the output is the weighted sum of the values.",
        "Dividing by √d keeps the scores' spread near 1; without it the softmax saturates (largest weight 0.87 at d = 64) and gradients vanish.",
        "Self-attention computes Q, K and V from the same sequence: softmax(QKᵀ/√d + M)V, all positions at once.",
        "The causal mask sets future scores to −∞ so each position sees only its past, as a language model must.",
        "Attention is permutation-equivariant: it sees a set, not a sequence, until positions are added.",
        "Multi-head attention runs several attentions on slices of d_model; the cost grows as n² with the sequence length.",
      ]} />
    </Article>
  );
}
