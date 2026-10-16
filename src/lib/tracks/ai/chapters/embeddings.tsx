"use client";

// Deep Learning 2: embeddings — words as indices and one-hot vectors (all
// equally unrelated); the embedding table and the lookup (Lookup figure);
// the distributional hypothesis on the FARM corpus (measured contexts);
// skip-gram with a full softmax, its loss and gradient, training live
// (Embedding figure, break it: shuffled words); loss vs dimension; cosine
// similarity; negative sampling; analogies and bias; contextual embeddings
// as the bridge to RNNs and attention; C++ (Vocab, pairs, SkipGram); mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { LookupFigure } from "@/components/lesson/figures/ai/LookupFigure";
import { EmbeddingFigure } from "@/components/lesson/figures/ai/EmbeddingFigure";

const r = String.raw;

export function EmbeddingsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiEmb_intro",
          "A network only reads numbers. A pixel already is one; a word is not. This chapter turns words into vectors in a way that keeps their meaning: words used in similar ways get similar vectors. Those vectors, called embeddings, are learned by the same gradient descent as everything else, from nothing but plain text. They are the first layer of every language model, including the transformers at the end of this section.")}
      </Lead>

      <Goals t={t} id="aiEmb" items={[
        "Explain why one-hot vectors make every pair of words equally unrelated.",
        "Describe an embedding layer as a table lookup and count its parameters.",
        "Train skip-gram embeddings with a softmax and read the result with cosine similarity.",
        "Name what embeddings cannot do (one vector per word, inherited bias) and why that leads to context-aware models.",
      ]} />

      <H2>{tx(t, "aiEmb_oneHotTitle", "Words need numbers")}</H2>
      <p>
        {tx(t, "aiEmb_oneHotBody",
          "First split the text into words and give each distinct word a number: its index in the vocabulary. The FARM corpus of this chapter has 20 distinct words, so the indices run from 0 to 19. An index alone is a bad input: it would tell the network that word 7 lies between words 6 and 8, an order that means nothing. The classic fix is the one-hot vector: as many entries as there are words, all 0 except a single 1 at the word's index.")}
      </p>
      <Equation label={tx(t, "aiEmb_eqOneHot", "Any two different one-hot vectors")}
        where={[
          [r`\mathbf{o}_i`, tx(t, "aiEmb_wOi", "the one-hot vector of word i: 1 at position i, 0 elsewhere; it has V entries")],
          [r`V`, tx(t, "aiEmb_wV", "the vocabulary size: the number of distinct words")],
          [r`i \neq j`, tx(t, "aiEmb_wIj", "two different words")],
        ]}>
        {r`\mathbf{o}_i \cdot \mathbf{o}_j = 0, \qquad \lVert \mathbf{o}_i - \mathbf{o}_j \rVert = \sqrt{2} \qquad (i \neq j)`}
      </Equation>
      <p>
        {tx(t, "aiEmb_oneHotBad",
          "Two problems. One-hot vectors are huge: a real vocabulary has 50 000 words or more, so every word becomes 50 000 numbers. Worse, they are all equally far apart: the dot product of any two different ones is 0 and their distance is always √2. \"Cat\" is exactly as different from \"dog\" as from \"carburettor\". Whatever the network learns about cats, it cannot pass on to dogs.")}
      </p>

      <H2>{tx(t, "aiEmb_tableTitle", "An embedding: a short learned vector per word")}</H2>
      <p>
        {tx(t, "aiEmb_tableBody",
          "Instead, give each word a short vector of d numbers, with d far smaller than V (typically 50 to a few thousand), and store all of them as the rows of a table E with V rows and d columns. The numbers start random and are learned. Getting a word's vector is a lookup: row i of E. Written as maths, the lookup is a multiplication by the one-hot vector.")}
      </p>
      <Equation label={tx(t, "aiEmb_eqLookup", "An embedding layer")}
        where={[
          [r`E`, tx(t, "aiEmb_wE", "the embedding table: V rows (one per word), d columns; its V · d numbers are parameters")],
          [r`\mathbf{o}_i^{\top} E`, tx(t, "aiEmb_wOE", "the one-hot row vector times E: every row of E multiplied by 0 except row i")],
          [r`\mathbf{e}_i`, tx(t, "aiEmb_wEi", "the embedding of word i: row i of E, a vector of d numbers")],
        ]}>
        {r`\mathbf{e}_i = \mathbf{o}_i^{\top} E = E_{i,:}`}
      </Equation>
      <LookupFigure t={t} />
      <p>
        {tx(t, "aiEmb_tableLayer",
          "So an embedding layer is a dense layer with no bias and no activation, fed a one-hot vector, computed the cheap way. Its parameter count is V · d. For GPT-2, the language model of 2019, that is 50 257 tokens × 768 dimensions = 38 597 376 parameters, almost a third of its 124 million. During training only the rows of the words in the current batch get a gradient; the other rows are untouched.")}
      </p>

      <H2>{tx(t, "aiEmb_companyTitle", "Where meaning comes from: the company a word keeps")}</H2>
      <p>
        {tx(t, "aiEmb_companyBody",
          "What should make the vectors of \"cat\" and \"dog\" similar? Not their letters. The answer, from the linguist J. R. Firth in 1957, is \"you shall know a word by the company it keeps\": words that appear in the same contexts tend to mean similar things. This is the distributional hypothesis, and it can be measured. The FARM corpus has 200 sentences built from four patterns, such as \"the cat eats bread\", \"the dog drinks milk\", \"the cow sleeps in the farm\" and \"the horse runs in the park\": 1 000 words, 20 distinct. Count the words that appear up to two places from \"cat\" and from \"dog\".")}
      </p>
      <LessonTable
        headers={[tx(t, "aiEmb_tNeighbour", "Neighbour"), "the", "in", "runs", "sleeps", "eats", "drinks", tx(t, "aiEmb_tFoods", "foods"), tx(t, "aiEmb_tDrinks", "drinks (noun)")]}
        rows={[
          ["cat", "50", "33", "18", "15", "10", "7", "10", "7"],
          ["dog", "50", "23", "17", "6", "11", "16", "11", "16"],
        ]}
      />
      <p>
        {tx(t, "aiEmb_companyRead",
          "The two rows have the same shape: articles, verbs, foods, drinks, places. The row of \"bread\" would look nothing like them: its neighbours are \"eats\" and the animals, never \"in\" or \"runs\". Two words with similar neighbour counts are used alike. The trick of the next section is to have the network discover this by itself.")}
      </p>

      <H2>{tx(t, "aiEmb_sgTitle", "Skip-gram: learning by predicting the neighbours")}</H2>
      <p>
        {tx(t, "aiEmb_sgBody",
          "Word2vec (Mikolov and others at Google, 2013) learns embeddings with a task that needs no labels: from a word, predict the words around it. Slide over the text; at every word (the centre), take each word up to 2 places before or after it (the context) as one training pair. \"The cat eats bread\" gives the pairs (the, cat), (the, eats), (cat, the), (cat, eats), (cat, bread), and so on: 10 pairs. The whole corpus gives 2 800. For each pair the model scores every word of the vocabulary as a possible neighbour of the centre, and a softmax turns the scores into probabilities.")}
      </p>
      <Equation label={tx(t, "aiEmb_eqSg", "The skip-gram model and its loss")}
        where={[
          [r`w`, tx(t, "aiEmb_wW", "the centre word, and c a candidate context word")],
          [r`\mathbf{e}_w`, tx(t, "aiEmb_wEw", "the embedding of the centre word: a row of E")],
          [r`\mathbf{u}_c`, tx(t, "aiEmb_wUc", "the output vector of word c: a row of a second table U, the same shape as E")],
          [r`\mathbf{u}_c \cdot \mathbf{e}_w`, tx(t, "aiEmb_wScore", "the score (logit) of c as a neighbour of w: large when the two vectors point the same way")],
          [r`L`, tx(t, "aiEmb_wL", "the loss of one training pair (w, c_true): the cross-entropy of the CNN chapter")],
        ]}>
        {r`p(c \mid w) = \frac{e^{\,\mathbf{u}_c \cdot \mathbf{e}_w}}{\sum_{c'} e^{\,\mathbf{u}_{c'} \cdot \mathbf{e}_w}}, \qquad L = -\ln p(c_{\text{true}} \mid w)`}
      </Equation>
      <p>
        {tx(t, "aiEmb_sgGrad",
          "The gradient is the softmax's p − [c = c_true] from the CNN chapter, one number per vocabulary word. Each output vector moves by −η times that number times e_w, and the centre's embedding moves by −η times the sum over c of that number times u_c: towards the output vector of the true neighbour, away from the words the model wrongly expected. Words that share neighbours are pulled towards the same output vectors, so they end up pointing the same way. After training the table U is thrown away and E is kept.")}
      </p>
      <EmbeddingFigure t={t} />
      <LessonTable
        headers={[tx(t, "aiEmb_tSetting", "FARM corpus, 60 epochs, learning rate 0.05"), tx(t, "aiEmb_tLoss", "Mean loss")]}
        rows={[
          [tx(t, "aiEmb_l0", "guessing uniformly over 20 words (ln 20)"), "2.996"],
          ["d = 2", "2.251"],
          ["d = 4", "2.047"],
          ["d = 8", "2.025"],
          ["d = 16", "2.024"],
          [tx(t, "aiEmb_l5", "the floor: the best any model can do"), "1.899"],
          [tx(t, "aiEmb_l6", "shuffled words, d = 8"), "2.556"],
        ]}
      />
      <p>
        {tx(t, "aiEmb_sgRead",
          "The loss can never reach 0, because the task is genuinely uncertain: after \"the cat eats\" the corpus picks a food at random. The floor, 1.899, is the loss of the true word frequencies of each context, computed by counting; no model can beat it. Two dimensions get most of the way and eight nearly all of it; beyond that there is nothing left to learn from 20 words. On shuffled words even a perfect model would only reach 2.480, since the neighbours are random, and the embeddings learn nothing worth having.")}
      </p>

      <H2>{tx(t, "aiEmb_cosTitle", "Measuring similarity: the cosine")}</H2>
      <p>
        {tx(t, "aiEmb_cosBody",
          "Similar words point in similar directions, so compare directions, not positions. The cosine of the angle between two vectors does that: it is the dot product divided by both lengths.")}
      </p>
      <Equation label={tx(t, "aiEmb_eqCos", "Cosine similarity")}
        where={[
          [r`\mathbf{a}\cdot\mathbf{b}`, tx(t, "aiEmb_wDot", "the dot product: the sum of a_k · b_k over the d entries")],
          [r`\lVert\mathbf{a}\rVert`, tx(t, "aiEmb_wNorm", "the length of a: the square root of a · a")],
          [r`\theta`, tx(t, "aiEmb_wTheta", "the angle between the two vectors")],
        ]}>
        {r`\cos\theta = \frac{\mathbf{a}\cdot\mathbf{b}}{\lVert\mathbf{a}\rVert\,\lVert\mathbf{b}\rVert} \in [-1, 1]`}
      </Equation>
      <p>
        {tx(t, "aiEmb_cosWorked",
          "For a = (1, 2) and b = (2, 4): a · b = 10, |a| = √5, |b| = √20, and 10/√100 = 1: the same direction, though b is twice as long. For a = (1, 2) and c = (2, −1): a · c = 0, a right angle, unrelated. Dividing by the lengths matters because a frequent word tends to get a longer vector simply from receiving more updates; the cosine ignores that.")}
      </p>
      <LessonTable
        headers={[tx(t, "aiEmb_tPair", "Pair (d = 8)"), tx(t, "aiEmb_tReal", "Real corpus"), tx(t, "aiEmb_tShuf", "Shuffled words")]}
        rows={[
          ["cat – dog", "0.90", "0.86"],
          ["cat – bread", "−0.33", "0.47"],
          ["bread – cheese", "0.95", "−0.03"],
        ]}
      />
      <p>
        {tx(t, "aiEmb_cosRead",
          "On the real corpus the numbers mean something: animals near animals, foods near foods, the two groups apart. On shuffled words they are noise: cat–dog happens to be high, bread–cheese happens to be 0, and nothing follows a pattern.")}
      </p>

      <H3>{tx(t, "aiEmb_negTitle", "Negative sampling: skipping the big softmax")}</H3>
      <p>
        {tx(t, "aiEmb_negBody",
          "The softmax needs one score per vocabulary word for every training pair: fine for 20 words, far too slow for 100 000 words and billions of pairs. Word2vec's practical version turns the task into yes/no questions. For the true pair it raises σ(u_c · e_w), the sigmoid's \"yes, these are neighbours\"; for k words drawn at random from the vocabulary (the negatives, k = 5 to 20) it raises σ(−u_n · e_w), \"no, these are not\". Each pair then costs k + 1 dot products instead of V, and the embeddings come out much the same.")}
      </p>
      <Equation label={tx(t, "aiEmb_eqNeg", "The negative-sampling loss of one pair")}
        where={[
          [r`\sigma`, tx(t, "aiEmb_wSig", "the sigmoid, 1/(1 + e^(−z))")],
          [r`n_1 \ldots n_k`, tx(t, "aiEmb_wNeg", "k random words, usually drawn with probability proportional to their frequency to the power 3/4")],
        ]}>
        {r`L = -\ln \sigma(\mathbf{u}_c \cdot \mathbf{e}_w) - \sum_{j=1}^{k} \ln \sigma(-\mathbf{u}_{n_j} \cdot \mathbf{e}_w)`}
      </Equation>

      <H2>{tx(t, "aiEmb_analogyTitle", "Analogies, and what else embeddings learn")}</H2>
      <p>
        {tx(t, "aiEmb_analogyBody",
          "Trained on billions of words, embeddings show a famous property: relations become directions. The vector from \"man\" to \"woman\" is roughly the same as from \"king\" to \"queen\", so e(king) − e(man) + e(woman) lands nearest to e(queen) (Mikolov and others, 2013). The same works for countries and capitals or for verb tenses. It is less magic than it looks: the result is only right when the three input words are excluded from the search, and many analogies fail.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "aiEmb_bias", "Embeddings learn whatever patterns the text contains, including stereotypes. Bolukbasi and others (2016) found that embeddings trained on news articles completed \"man is to computer programmer as woman is to …\" with \"homemaker\". A model built on such vectors carries the bias into its decisions, for example when ranking job applications. The data is part of the model: audit both.")}
      </Callout>

      <H2>{tx(t, "aiEmb_beyondTitle", "Beyond words, and the limit of one vector per word")}</H2>
      <p>
        {tx(t, "aiEmb_beyondBody",
          "Anything with an identity can be embedded: products and users in a shop (bought together means similar), songs in a playlist, the positions of a sequence, the pieces of a word. A recommender's first layer is usually two embedding tables. Static embeddings have one hard limit, though: one vector per word, whatever the sentence. \"Bank\" gets the same vector in \"the river bank\" and \"the bank closed my account\". Telling them apart requires reading the rest of the sentence, and the next three chapters are about models that do that: the recurrent network reads the words in order, and attention lets every word look at all the others.")}
      </p>

      <H2>{tx(t, "aiEmb_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiEmb_codeBody",
          "A vocabulary, the skip-gram pairs, and the model with its full-softmax training step. On the FARM corpus with d = 8 and 60 epochs it reaches a mean loss of 2.04 and gives cat–dog 0.99, cat–bread −0.12, bread–cheese 0.84 (the exact numbers depend on the random corpus and starting vectors; the pattern does not).")}
      </p>
      <CodeBlock lang="cpp" filename="skipgram.h" t={t}>{`#include <algorithm>
#include <cmath>
#include <map>
#include <random>
#include <string>
#include <utility>
#include <vector>

// The vocabulary: every distinct word gets an index 0, 1, 2…
struct Vocab {
    std::vector<std::string> words;
    std::map<std::string, std::size_t> index;
    std::size_t id(const std::string& w) {
        auto [it, added] = index.try_emplace(w, words.size());
        if (added) words.push_back(w);
        return it->second;
    }
};

// Skip-gram training pairs: each word with every word up to \`window\` places away in its sentence.
std::vector<std::pair<std::size_t, std::size_t>> skipGramPairs(const std::vector<std::vector<std::size_t>>& sentences, std::size_t window) {
    std::vector<std::pair<std::size_t, std::size_t>> out;
    for (const auto& s : sentences)
        for (std::size_t i = 0; i < s.size(); ++i)
            for (std::size_t j = i > window ? i - window : 0; j <= std::min(s.size() - 1, i + window); ++j)
                if (j != i) out.emplace_back(s[i], s[j]);
    return out;
}

// p(context | centre) = softmax over the vocabulary of U[c] · E[centre].
struct SkipGram {
    std::size_t n, d;                                     // vocabulary size, embedding size
    std::vector<double> E;                                // n × d: the embeddings (what we keep)
    std::vector<double> U;                                // n × d: the output vectors (thrown away after training)

    SkipGram(std::size_t words, std::size_t dims, std::mt19937& rng) : n(words), d(dims), E(words * dims), U(words * dims) {
        std::normal_distribution<double> N(0.0, 0.5);
        for (double& v : E) v = N(rng);
        for (double& v : U) v = N(rng);
    }

    const double* vec(std::size_t w) const { return &E[w * d]; }

    // One SGD step on one (centre, context) pair; returns the loss −ln p(context | centre).
    double step(std::size_t w, std::size_t ctx, double lr) {
        double* e = &E[w * d];
        std::vector<double> z(n);
        for (std::size_t c = 0; c < n; ++c) {
            z[c] = 0.0;
            for (std::size_t k = 0; k < d; ++k) z[c] += U[c * d + k] * e[k];   // a score for every word
        }
        const double mx = *std::max_element(z.begin(), z.end());
        double sum = 0.0;
        for (double& v : z) sum += v = std::exp(v - mx);
        std::vector<double> gE(d, 0.0);
        for (std::size_t c = 0; c < n; ++c) {
            const double g = z[c] / sum - (c == ctx ? 1.0 : 0.0);             // p_c − [c = context]
            for (std::size_t k = 0; k < d; ++k) {
                gE[k] += g * U[c * d + k];
                U[c * d + k] -= lr * g * e[k];
            }
        }
        for (std::size_t k = 0; k < d; ++k) e[k] -= lr * gE[k];
        return -std::log(std::max(z[ctx] / sum, 1e-12));
    }
};

// cos θ = a·b / (|a| |b|)
double cosine(const double* a, const double* b, std::size_t d) {
    double ab = 0.0, aa = 0.0, bb = 0.0;
    for (std::size_t k = 0; k < d; ++k) { ab += a[k] * b[k]; aa += a[k] * a[k]; bb += b[k] * b[k]; }
    return ab / std::sqrt(aa * bb);
}`}</CodeBlock>
      <p>
        {tx(t, "aiEmb_codeUse",
          "Training is a loop: shuffle the pairs, call step on each, repeat. Note that step updates U before E using the old e (it reads e[k] while changing U and changes e only at the end), which keeps both updates computed from the same point, as gradient descent requires.")}
      </p>

      <H2>{tx(t, "aiEmb_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiEmb_tMistake", "Mistake"), tx(t, "aiEmb_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiEmb_e1", "Feeding word indices as numbers"), tx(t, "aiEmb_e1b", "the network treats word 8 as \"more\" than word 7. Use one-hot vectors or, better, an embedding lookup.")],
          [tx(t, "aiEmb_e2", "Comparing embeddings by Euclidean distance"), tx(t, "aiEmb_e2b", "frequent words get long vectors and look far from everything. Use the cosine, or normalise the vectors to length 1 first.")],
          [tx(t, "aiEmb_e3", "Using the same table for E and U from the start"), tx(t, "aiEmb_e3b", "a word then scores itself highly as its own neighbour. Keep two tables while training (some models tie them later, with care).")],
          [tx(t, "aiEmb_e4", "Updating e before computing the gradient of U"), tx(t, "aiEmb_e4b", "U's update then uses the new e, a different point. Compute both gradients from the old values, then update.")],
          [tx(t, "aiEmb_e5", "Treating the analogy results as reasoning"), tx(t, "aiEmb_e5b", "they are geometry over word co-occurrence, right only when the inputs are excluded, and wrong often. Evaluate on a real task.")],
          [tx(t, "aiEmb_e6", "Words never seen in training"), tx(t, "aiEmb_e6b", "they have no row. Reserve an \"unknown\" token, or split words into pieces as language models do (Transformers chapter).")],
        ]}
      />

      <KeyIdeas t={t} id="aiEmb" items={[
        "One-hot vectors make all words equally unrelated: any two different ones have dot product 0 and distance √2.",
        "An embedding layer is a V × d table; looking up row i equals multiplying the one-hot vector of word i by the table.",
        "Words that appear in the same contexts mean similar things (the distributional hypothesis).",
        "Skip-gram learns embeddings by predicting each word's neighbours with a softmax over the vocabulary; the gradient is p − [c = true].",
        "Compare embeddings with the cosine, which ignores length: on the FARM corpus cat–dog is 0.90 and cat–bread −0.33.",
        "Negative sampling replaces the softmax over V words with k + 1 sigmoid yes/no questions.",
        "Static embeddings give one vector per word and inherit the biases of their text; context-aware models come next.",
      ]} />
    </Article>
  );
}
