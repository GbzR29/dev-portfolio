"use client";

// Classic ML 4: decision trees — a tree of yes/no questions; predicting by
// walking down; impurity (Gini, entropy) and the gain of a split; the
// students' root and second split worked by hand; greedy CART and its cost;
// depth, pruning and overfitting (Tree figure); instability under
// leave-one-out; regression trees on the deliveries; forests and boosting;
// C++ builder; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { TreeFigure } from "@/components/lesson/figures/ai/TreeFigure";

const r = String.raw;

export function DecisionTreesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiTree_intro",
          "A decision tree is a flowchart of yes-or-no questions: \"slept less than 5.25 h?\", then \"studied less than 3.25 h?\", until it reaches an answer. People read it like a set of rules, it handles features in any units without scaling, and it draws boundaries no straight line could. Learning a tree means choosing the questions, and there is a simple, greedy way to do it: at every step, ask the question that best separates the classes. This chapter measures \"best\" with impurity, grows a tree on the students by hand, and shows why a lone tree overfits so easily and what forests do about it.")}
      </Lead>

      <H2>{tx(t, "aiTree_howTitle", "How a tree predicts")}</H2>
      <p>
        {tx(t, "aiTree_howBody",
          "Every internal node holds one test of the form \"feature j < threshold\". To predict, start at the root, answer its test, follow the \"yes\" branch or the \"no\" branch, and repeat until a leaf. The leaf holds the answer: the majority class of the training examples that ended there (for classification) or their average label (for regression). Each test cuts the space along one axis, so the regions a tree carves are rectangles (boxes in more dimensions), and the boundary is a staircase of horizontal and vertical segments.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "aiTree_noScale", "A test compares one feature with a threshold. Measure sleep in minutes instead of hours and the threshold becomes 315 instead of 5.25, but the same students go the same way. That is why trees, unlike k-NN and gradient-trained models, need no feature scaling.")}
      </Callout>

      <H2>{tx(t, "aiTree_impTitle", "Impurity: how mixed is a node?")}</H2>
      <p>
        {tx(t, "aiTree_impBody",
          "A good question produces children that are each mostly one class. To compare questions we need a number for \"how mixed\" a group is: zero when every example has the same label, largest when the classes are equally represented. Two are common:")}
      </p>
      <Equation label={tx(t, "aiTree_eqImp", "Gini impurity and entropy of a node")}
        where={[
          [r`p_c`, tx(t, "aiTree_wPc", "the fraction of the node's examples that have class c")],
          [r`G`, tx(t, "aiTree_wG", "Gini impurity: the chance that two examples drawn at random (with replacement) from the node have different labels")],
          [r`H`, tx(t, "aiTree_wH", "entropy, in bits: roughly the average number of yes/no questions needed to learn the label; 1 bit is one fair coin flip")],
        ]}>
        {r`G = 1 - \sum_{c} p_c^{\,2}, \qquad H = -\sum_{c} p_c \log_2 p_c`}
      </Equation>
      <p>
        {tx(t, "aiTree_impEx",
          "For two classes with p = 1/2 each, G = 1 − 1/4 − 1/4 = 0.5 and H = 1 bit, both at their maximum; a pure node gives 0 for both. Where does G come from? Draw two examples: they have the same label with probability Σ p_c² (both of class c, summed over c), so they differ with probability 1 − Σ p_c².")}
      </p>
      <H3>{tx(t, "aiTree_gainTitle", "The gain of a split")}</H3>
      <Equation label={tx(t, "aiTree_eqGain", "Impurity decrease of a split into left and right children")}
        where={[
          [r`n, n_L, n_R`, tx(t, "aiTree_wN", "the number of examples in the node and in its two children")],
          [r`I(\cdot)`, tx(t, "aiTree_wI", "the impurity measure, Gini or entropy")],
          [r`\frac{n_L}{n}`, tx(t, "aiTree_wFrac", "each child's impurity counts in proportion to its size: a pure child of one example is worth little")],
        ]}>
        {r`\Delta I = I(\text{node}) - \left( \frac{n_L}{n}\, I(\text{left}) + \frac{n_R}{n}\, I(\text{right}) \right)`}
      </Equation>
      <p>
        {tx(t, "aiTree_gainBody",
          "The best split is the one with the largest decrease, or equivalently the lowest weighted impurity of the children. With entropy, ΔI is called information gain.")}
      </p>

      <H2>{tx(t, "aiTree_workedTitle", "Growing the students' tree by hand")}</H2>
      <p>
        {tx(t, "aiTree_workedBody",
          "The 14 students: 6 passed, 8 failed. The root's Gini is 1 − (6/14)² − (8/14)² = 1 − (36 + 64)/196 = 0.490. The candidate thresholds are the midpoints between neighbouring values of each feature (between 5 h and 5.5 h of sleep, 5.25), 18 in all. Three of them:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiTree_tSplit", "Split"), tx(t, "aiTree_tLeft", "Left (yes)"), tx(t, "aiTree_tRight", "Right (no)"), tx(t, "aiTree_tWeighted", "Weighted Gini")]}
        rows={[
          [tx(t, "aiTree_sp1", "sleep < 5.25"), tx(t, "aiTree_sp1l", "4 students, 0 passed: G = 0"), tx(t, "aiTree_sp1r", "10, 6 passed: G = 1 − 0.36 − 0.16 = 0.48"), "(4·0 + 10·0.48) / 14 = 0.343"],
          [tx(t, "aiTree_sp2", "study < 5.25"), tx(t, "aiTree_sp2l", "12, 4 passed: G = 1 − 1/9 − 4/9 = 0.444"), tx(t, "aiTree_sp2r", "2, 2 passed: G = 0"), "(12·0.444 + 0) / 14 = 0.381"],
          [tx(t, "aiTree_sp3", "study < 3.25"), tx(t, "aiTree_sp3l", "6, 1 passed: G = 1 − 1/36 − 25/36 = 0.278"), tx(t, "aiTree_sp3r", "8, 5 passed: G = 1 − 25/64 − 9/64 = 0.469"), "(6·0.278 + 8·0.469) / 14 = 0.387"],
        ]}
      />
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiTree_s1", "Root: sleep < 5.25 wins, a decrease of 0.490 − 0.343 = 0.147. Its left child holds the four students who slept badly, all failed: a pure leaf, \"fail\". (Entropy agrees: 0.985 bits drop to 0.694, an information gain of 0.292.)")}</li>
        <li>{tx(t, "aiTree_s2", "The right child (10 students, 6 passed, G = 0.48) is split the same way, on its own 10 students only. The best test is now study < 3.25: 4 students with 1 pass (G = 0.375) and 6 with 5 passes (G = 0.278), weighted (4·0.375 + 6·0.278)/10 = 0.317.")}</li>
        <li>{tx(t, "aiTree_s3", "At depth 2 the tree reads: slept under 5.25 h → fail; otherwise, studied under 3.25 h → fail (3 of 4); otherwise → pass (5 of 6). It gets 12 of 14 right, and the two mistakes are the two noisy students.")}</li>
        <li>{tx(t, "aiTree_s4", "Keep going and the tree isolates them: study < 5.25 and sleep < 7.75 wrap the student who studied 5 h and slept 7 h in a box of their own. At depth 5 every leaf is pure and the training accuracy is 14 of 14.")}</li>
      </ol>
      <TreeFigure t={t} />

      <H2>{tx(t, "aiTree_algoTitle", "The algorithm (CART)")}</H2>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiTree_g1", "If the node is pure, too small, or at the maximum depth, make it a leaf.")}</li>
        <li>{tx(t, "aiTree_g2", "Otherwise, for every feature and every midpoint threshold, compute the weighted impurity of the two children.")}</li>
        <li>{tx(t, "aiTree_g3", "Keep the best split (if it lowers the impurity at all), send each example left or right, and repeat on each child with its own examples.")}</li>
      </ol>
      <p>
        {tx(t, "aiTree_algoBody",
          "This is greedy: each question is the best one right now, with no look-ahead, so the final tree is not guaranteed to be the best tree (finding that is NP-hard). It is fast, though. Sort the node's examples by a feature once, then sweep the thresholds from left to right, moving one example at a time from the right-hand counts to the left-hand counts: every candidate costs O(1), so a node costs O(d · n log n), dominated by the sort.")}
      </p>

      <H2>{tx(t, "aiTree_overTitle", "Depth, pruning and overfitting")}</H2>
      <p>
        {tx(t, "aiTree_overBody",
          "A tree can always grow until every leaf is pure (unless two examples have identical features and different labels). Then the training error is 0 and the tree has memorised the noise. Trees are therefore always limited, with hyperparameters chosen by validation:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiTree_tKnob", "Hyperparameter"), tx(t, "aiTree_tEffect", "Effect")]}
        rows={[
          [tx(t, "aiTree_h1", "maximum depth"), tx(t, "aiTree_h1b", "at most that many questions per prediction; depth 2 for the students.")],
          [tx(t, "aiTree_h2", "minimum examples per leaf"), tx(t, "aiTree_h2b", "a leaf must summarise at least m examples (e.g. 5), so no leaf exists for a single noisy example.")],
          [tx(t, "aiTree_h3", "minimum impurity decrease"), tx(t, "aiTree_h3b", "a split must be worth at least this much gain.")],
          [tx(t, "aiTree_h4", "pruning"), tx(t, "aiTree_h4b", "grow the full tree, then remove the splits whose removal does not hurt the validation error; cost-complexity pruning adds α · (number of leaves) to the error and increases α step by step.")],
        ]}
      />
      <H3>{tx(t, "aiTree_varTitle", "Trees are unstable")}</H3>
      <p>
        {tx(t, "aiTree_varBody",
          "A single tree has high variance: small changes in the data change it a lot. Remove one student and regrow the tree: in 9 of the 14 cases the root question changes (a different feature or a different threshold), and everything below it changes with it. Because the first split decides which examples every later split sees, one different choice near the top produces a different tree. The next section turns this weakness into a strength.")}
      </p>

      <H2>{tx(t, "aiTree_regTitle", "Regression trees")}</H2>
      <p>
        {tx(t, "aiTree_regBody",
          "For a numeric label, a leaf predicts the mean of its examples, and the impurity of a node is the variance of its labels, the MSE of predicting that mean. On the five deliveries (variance 24.8), the best first split is distance < 2.5 km: the left leaf holds 12 and 15 (mean 13.5, variance 2.25), the right leaf 20, 22 and 26 (mean 22.67, variance 6.22). Weighted: (2 · 2.25 + 3 · 6.22) / 5 = 4.63. The prediction is a step function, 13.5 min up to 2.5 km and 22.67 min beyond: flat inside each box and unable to extrapolate, since 10 km still gets 22.67 min, where the line predicted 43.5.")}
      </p>

      <H2>{tx(t, "aiTree_ensTitle", "Many trees: forests and boosting")}</H2>
      <LessonTable
        headers={[tx(t, "aiTree_tMethod", "Method"), tx(t, "aiTree_tHow", "How"), tx(t, "aiTree_tWhy", "Why it works")]}
        rows={[
          [tx(t, "aiTree_m1", "random forest"), tx(t, "aiTree_m1h", "train hundreds of deep trees, each on a bootstrap sample (n examples drawn with replacement) and choosing each split among a random subset of features (about √d); average their votes."), tx(t, "aiTree_m1w", "each tree overfits differently; averaging many roughly independent errors cancels most of the variance while keeping the low bias.")],
          [tx(t, "aiTree_m2", "gradient boosting"), tx(t, "aiTree_m2h", "train shallow trees one after another, each fitted to the errors (residuals) the sum of the previous ones still makes; add each with a small weight (learning rate)."), tx(t, "aiTree_m2w", "each tree corrects what is left; it is gradient descent in the space of functions. The usual winner on tabular data.")],
        ]}
      />

      <H2>{tx(t, "aiTree_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiTree_codeBody",
          "The nodes live in one vector and refer to their children by index, which is compact and easy to copy. The builder works on a list of example indices, splitting it in place with std::partition. The split search sorts by each feature and sweeps the thresholds with running counts, as described above.")}
      </p>
      <CodeBlock lang="cpp" filename="tree.h" t={t}>{`#include <algorithm>
#include <numeric>
#include "dataset.h"                                     // labels 0/1

struct TreeNode {
    int feature = -1;                                    // -1: a leaf
    double threshold = 0.0;
    int left = -1, right = -1;                           // indices into Tree::nodes
    int prediction = 0;                                  // majority label (leaves)
};

struct Tree {
    std::vector<TreeNode> nodes;
    std::size_t maxDepth = 3, minLeaf = 1;

    static double gini(double pos, double n) { const double p = pos / n; return 1 - p * p - (1 - p) * (1 - p); }

    int build(const Dataset& ds, std::vector<std::size_t>::iterator first,
              std::vector<std::size_t>::iterator last, std::size_t depth) {
        const std::size_t n = last - first;
        double pos = 0; for (auto it = first; it != last; ++it) pos += ds.y[*it];
        const int id = int(nodes.size());
        nodes.push_back({});
        nodes[id].prediction = 2 * pos > n;
        if (depth == maxDepth || pos == 0 || pos == n || n < 2 * minLeaf) return id;

        double bestScore = gini(pos, n) * n;                 // weighted impurity to beat (times n)
        int bestF = -1; double bestT = 0;
        std::vector<std::size_t> idx(first, last);
        for (std::size_t f = 0; f < ds.d; ++f) {
            std::sort(idx.begin(), idx.end(), [&](auto a, auto b) { return ds.at(a, f) < ds.at(b, f); });
            double leftPos = 0;
            for (std::size_t k = 1; k < n; ++k) {               // left = first k examples in sorted order
                leftPos += ds.y[idx[k - 1]];
                const double a = ds.at(idx[k - 1], f), b = ds.at(idx[k], f);
                if (a == b || k < minLeaf || n - k < minLeaf) continue;   // no threshold between equal values
                const double score = gini(leftPos, k) * k + gini(pos - leftPos, n - k) * (n - k);
                if (score < bestScore - 1e-12) { bestScore = score; bestF = int(f); bestT = (a + b) / 2; }
            }
        }
        if (bestF < 0) return id;                            // no split lowers the impurity
        auto mid = std::partition(first, last, [&](auto i) { return ds.at(i, bestF) < bestT; });
        nodes[id].feature = bestF; nodes[id].threshold = bestT;
        const int l = build(ds, first, mid, depth + 1);      // build() may grow nodes: index, don't keep references
        const int r = build(ds, mid, last, depth + 1);
        nodes[id].left = l; nodes[id].right = r;
        return id;
    }

    void fit(const Dataset& ds) {
        std::vector<std::size_t> all(ds.n);
        std::iota(all.begin(), all.end(), 0);
        nodes.clear();
        build(ds, all.begin(), all.end(), 0);
    }

    int predict(const double* x) const {
        int i = 0;
        while (nodes[i].feature >= 0) i = x[nodes[i].feature] < nodes[i].threshold ? nodes[i].left : nodes[i].right;
        return nodes[i].prediction;
    }
};
// Students, maxDepth = 2: sleep < 5.25 → fail; else study < 3.25 → fail; else pass. 12 / 14 correct.`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "aiTree_tChoice", "Choice"), tx(t, "aiTree_tReason", "Reason")]}
        rows={[
          [tx(t, "aiTree_ch1", "children by index, not pointer"), tx(t, "aiTree_ch1b", "push_back may reallocate the vector, which would leave pointers (and references like nodes[id] held across the recursive call) dangling.")],
          [tx(t, "aiTree_ch2", "scores multiplied by n"), tx(t, "aiTree_ch2b", "comparing n_L·G_L + n_R·G_R avoids a division per candidate and ranks splits the same way.")],
          [tx(t, "aiTree_ch3", "skip equal neighbouring values"), tx(t, "aiTree_ch3b", "no threshold can separate two examples with the same feature value.")],
        ]}
      />

      <H2>{tx(t, "aiTree_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiTree_tMistake", "Mistake"), tx(t, "aiTree_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiTree_e1", "Growing without limits"), tx(t, "aiTree_e1b", "100% training accuracy and boxes around every noisy example. Limit depth or leaf size, chosen by validation.")],
          [tx(t, "aiTree_e2", "Reading one tree's structure as the truth"), tx(t, "aiTree_e2b", "a slightly different dataset gives a different tree. Check stability, or use a forest and its feature importances.")],
          [tx(t, "aiTree_e3", "Expecting smooth predictions or extrapolation"), tx(t, "aiTree_e3b", "a regression tree is a step function and repeats its edge leaves outside the data.")],
          [tx(t, "aiTree_e4", "Unweighted child impurity"), tx(t, "aiTree_e4b", "a split that peels off one pure example looks perfect. Weight each child by its size.")],
          [tx(t, "aiTree_e5", "One-hot encoding a feature with hundreds of categories"), tx(t, "aiTree_e5b", "each category becomes a rare 0/1 feature that is almost never chosen. Group rare categories, or use a tree that splits categories directly.")],
        ]}
      />

      <KeyIdeas t={t} id="aiTree" items={[
        "A decision tree asks \"feature < threshold?\" at each node and answers at a leaf with the majority (or mean) of its training examples.",
        "Its regions are axis-aligned boxes; feature scaling makes no difference.",
        "Impurity measures how mixed a node is: Gini 1 − Σ p_c², entropy −Σ p_c log₂ p_c; both are 0 for a pure node.",
        "The best split minimises the size-weighted impurity of the children; for the students, sleep < 5.25 (0.490 → 0.343).",
        "CART grows the tree greedily and recursively; sorting and sweeping makes each node cost O(d · n log n).",
        "Unlimited trees memorise noise and are unstable; limit depth or leaf size, or prune.",
        "Random forests average many decorrelated trees to cut variance; gradient boosting adds shallow trees that fix the remaining errors.",
      ]} />
    </Article>
  );
}
