"use client";

// Classic ML 3: k-nearest neighbours — learning by remembering; the algorithm
// for classification and regression; distances (Euclidean, Manhattan) and why
// scaling matters; the students worked by hand; the apartments by k-NN
// regression and distance weighting; choosing k (Knn figure, leave-one-out);
// decision boundaries and Voronoi cells; cost and search structures; the
// curse of dimensionality (Dimension figure); C++ with nth_element; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { KnnFigure } from "@/components/lesson/figures/ai/KnnFigure";
import { DimensionFigure } from "@/components/lesson/figures/ai/DimensionFigure";

const r = String.raw;

export function KNearestNeighboursContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiKnn_intro",
          "The models so far compress the training data into a few parameters and then throw the data away. k-nearest neighbours does the opposite: it keeps every example and learns nothing in advance. To predict for a new input, it finds the k training examples most similar to it and lets them vote. It is the simplest learning algorithm there is, it draws boundaries of any shape, and it makes the role of distance, scaling and dimension impossible to ignore.")}
      </Lead>

      <H2>{tx(t, "aiKnn_algoTitle", "The algorithm")}</H2>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiKnn_a1", "Training: store the n examples (xᵢ, yᵢ). That is all.")}</li>
        <li>{tx(t, "aiKnn_a2", "Prediction for a query q: compute the distance from q to every stored example.")}</li>
        <li>{tx(t, "aiKnn_a3", "Keep the k examples with the smallest distances: the neighbourhood N_k(q).")}</li>
        <li>{tx(t, "aiKnn_a4", "Classification: predict the most common label among them. Regression: predict the average of their labels.")}</li>
      </ol>
      <Equation label={tx(t, "aiKnn_eqPred", "k-NN prediction")}
        where={[
          [r`N_k(\mathbf{q})`, tx(t, "aiKnn_wNk", "the indices of the k training examples closest to the query q")],
          [r`[y_i = c]`, tx(t, "aiKnn_wIverson", "1 if example i has label c, 0 otherwise: summing it counts the votes for class c")],
          [r`\arg\max_c`, tx(t, "aiKnn_wArgmax", "the class c with the largest count")],
        ]}>
        {r`\hat y_{\text{class}} = \arg\max_c \sum_{i \in N_k(\mathbf{q})} [y_i = c], \qquad \hat y_{\text{regr}} = \frac{1}{k}\sum_{i \in N_k(\mathbf{q})} y_i`}
      </Equation>
      <p>
        {tx(t, "aiKnn_lazy",
          "Because all the work is postponed to prediction time, k-NN is called a lazy or instance-based learner. It has no weights and no training loop, but it still has hyperparameters: k, and the definition of distance.")}
      </p>

      <H2>{tx(t, "aiKnn_distTitle", "Distance")}</H2>
      <Equation label={tx(t, "aiKnn_eqDist", "Euclidean and Manhattan distance between two examples")}
        where={[
          [r`a_j,\ b_j`, tx(t, "aiKnn_wAb", "feature j of the two examples being compared")],
          [r`d`, tx(t, "aiKnn_wD", "the number of features")],
        ]}>
        {r`\lVert \mathbf{a} - \mathbf{b} \rVert_2 = \sqrt{\sum_{j=1}^{d} (a_j - b_j)^2}, \qquad \lVert \mathbf{a} - \mathbf{b} \rVert_1 = \sum_{j=1}^{d} |a_j - b_j|`}
      </Equation>
      <p>
        {tx(t, "aiKnn_distBody",
          "Euclidean distance is the straight line, the usual default. Manhattan distance adds up the differences feature by feature, like walking a city grid; a single very different feature weighs less in it than in the Euclidean sum of squares. Either way, every feature's difference is added to every other's, so the units must be comparable: the Data chapter showed that, unscaled, the apartment with the most similar number of square metres wins even if it has three more rooms. Standardise the features first, unless, as for the students (hours studied and hours slept), they already share a unit and a similar spread.")}
      </p>

      <H2>{tx(t, "aiKnn_clsTitle", "Classification by hand")}</H2>
      <p>
        {tx(t, "aiKnn_clsBody",
          "Take the 14 students from the Logistic Regression chapter and a new one who studied 4 h and slept 6 h: q = (4, 6). The five nearest:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiKnn_tStudent", "Student (study, sleep)"), tx(t, "aiKnn_tDist", "Distance to (4, 6)"), tx(t, "aiKnn_tLabel", "Label")]}
        rows={[
          ["(4.5, 6.5)", "√(0.5² + 0.5²) = 0.71", tx(t, "aiKnn_pass", "pass")],
          ["(3, 7)", "√(1² + 1²) = 1.41", tx(t, "aiKnn_fail", "fail")],
          ["(5, 7)", "√(1² + 1²) = 1.41", tx(t, "aiKnn_fail", "fail")],
          ["(5.5, 5.5)", "√(1.5² + 0.5²) = 1.58", tx(t, "aiKnn_pass", "pass")],
          ["(2, 6)", "√(2² + 0²) = 2.00", tx(t, "aiKnn_fail", "fail")],
        ]}
      />
      <ul className="list-disc pl-6 space-y-1.5">
        <li>{tx(t, "aiKnn_k1", "k = 1: the single nearest passed, so the prediction is pass.")}</li>
        <li>{tx(t, "aiKnn_k3", "k = 3: one pass, two fails, so fail. One of those fails is the \"noisy\" student (5, 7), who studied and slept well and still failed.")}</li>
        <li>{tx(t, "aiKnn_k5", "k = 5: two passes, three fails, so fail again.")}</li>
      </ul>
      <p>
        {tx(t, "aiKnn_clsRead",
          "The logistic model gave this student p = 0.64 (pass). Different models, different answers near the border, and k itself changes the answer. With two classes, an odd k avoids tied votes.")}
      </p>

      <H2>{tx(t, "aiKnn_regTitle", "Regression: the apartments again")}</H2>
      <p>
        {tx(t, "aiKnn_regBody",
          "Predict the price of the query apartment Q (70 m², 1 room) from its neighbours among A–J, after standardising both features with μ and σ from the Data chapter (Q becomes (−0.16, −1.46)). The nearest are C (distance 0.71, price 240), F (1.00, 320) and D (1.05, 275), then B (1.30) and A (1.37).")}
      </p>
      <ul className="list-disc pl-6 space-y-1.5">
        <li>{tx(t, "aiKnn_r1", "k = 1: 240, simply C's price.")}</li>
        <li>{tx(t, "aiKnn_r3", "k = 3: (240 + 320 + 275) / 3 = 278.3.")}</li>
        <li>{tx(t, "aiKnn_r5", "k = 5: adding B (230) and A (180) pulls it down to 249.0: the neighbourhood has grown to include much smaller flats.")}</li>
        <li>{tx(t, "aiKnn_rLin", "For comparison, the linear model from the Linear Regression chapter says 3.35 · 70 + 4.23 · 1 + 60.8 = 299.5.")}</li>
      </ul>
      <H3>{tx(t, "aiKnn_wTitle", "Weighting by distance")}</H3>
      <p>
        {tx(t, "aiKnn_wBody",
          "A plain average gives the farthest of the k neighbours as much say as the nearest. Weighting each neighbour by 1 / distance fixes that:")}
      </p>
      <Equation label={tx(t, "aiKnn_eqW", "Distance-weighted k-NN regression")}
        where={[
          [r`d_i`, tx(t, "aiKnn_wDi", "the distance from the query to neighbour i")],
          [r`1/d_i`, tx(t, "aiKnn_wInv", "its weight: near neighbours count more (use a small minimum distance to avoid dividing by 0)")],
        ]}>
        {r`\hat y = \frac{\sum_{i \in N_k} y_i / d_i}{\sum_{i \in N_k} 1 / d_i}`}
      </Equation>
      <p>
        {tx(t, "aiKnn_wEx",
          "For k = 3: the weights are 1/0.71 = 1.42, 1/1.00 = 1.01 and 1/1.05 = 0.95; the weighted average is (1.42 · 240 + 1.01 · 320 + 0.95 · 275) / 3.37 = 273.7, closer to C's price than the plain 278.3. For classification, the same weights are added up per class instead of counting one vote each.")}
      </p>

      <H2>{tx(t, "aiKnn_kTitle", "Choosing k")}</H2>
      <p>
        {tx(t, "aiKnn_kBody",
          "k controls the flexibility. With k = 1 every training example is its own nearest neighbour, so the training error is always 0, and every noisy example gets its own little island in the decision regions: overfitting. With k = n every query gets the same answer, the majority class: underfitting. In between, cross-validation decides. Leave-one-out on the 14 students (predict each from the other 13):")}
      </p>
      <LessonTable
        headers={["k", "1", "3", "5", "7", "9", "11", "13"]}
        rows={[[tx(t, "aiKnn_tErr", "errors out of 14"), "8", "6", "4", "6", "6", "9", "6"]]}
      />
      <p>
        {tx(t, "aiKnn_kRead",
          "k = 5 is best here, with 10 of 14 right. The numbers jump around because 14 examples are very few; with more data the curve is smoother, typically U-shaped. The regions k-NN draws have no fixed shape: with k = 1 the plane is cut into Voronoi cells, one per training example (every point in a cell is closer to that example than to any other), and the boundary follows the cells' edges.")}
      </p>
      <KnnFigure t={t} />

      <H2>{tx(t, "aiKnn_costTitle", "The cost of being lazy")}</H2>
      <LessonTable
        headers={["", tx(t, "aiKnn_tKnn", "k-NN"), tx(t, "aiKnn_tLinear", "linear / logistic model")]}
        rows={[
          [tx(t, "aiKnn_c1", "training"), tx(t, "aiKnn_c1a", "nothing: store the data"), tx(t, "aiKnn_c1b", "many passes of gradient descent")],
          [tx(t, "aiKnn_c2", "memory"), tx(t, "aiKnn_c2a", "all n × d numbers, forever"), tx(t, "aiKnn_c2b", "d + 1 numbers")],
          [tx(t, "aiKnn_c3", "one prediction"), tx(t, "aiKnn_c3a", "n distances of d terms: O(n·d)"), tx(t, "aiKnn_c3b", "one dot product: O(d)")],
          [tx(t, "aiKnn_c4", "shape of the boundary"), tx(t, "aiKnn_c4a", "any shape"), tx(t, "aiKnn_c4b", "a straight line (hyperplane)")],
        ]}
      />
      <p>
        {tx(t, "aiKnn_costBody",
          "A million stored examples means a million distances per prediction. Space-partitioning structures avoid most of them: a k-d tree splits the space by one feature at a time, like a binary search, and prunes whole regions that cannot contain a closer point. They work well up to about ten dimensions. Beyond that, approximate nearest-neighbour methods (hashing, graphs of neighbours) trade a little accuracy for speed; they are what searches through the embedding vectors of the Deep Learning section.")}
      </p>

      <H2>{tx(t, "aiKnn_curseTitle", "The curse of dimensionality")}</H2>
      <p>
        {tx(t, "aiKnn_curseBody",
          "k-NN rests on one assumption: examples that are close are similar. In many dimensions, closeness itself breaks down. Suppose the data is spread evenly over the unit cube and we want a neighbourhood holding 1% of it. In one dimension that is an interval of length 0.01. In d dimensions it is a small cube whose volume is 0.01, so its side is 0.01^(1/d):")}
      </p>
      <LessonTable
        headers={["d", "1", "2", "3", "10", "100"]}
        rows={[[tx(t, "aiKnn_tSide", "side of the cube"), "0.010", "0.100", "0.215", "0.631", "0.955"]]}
      />
      <p>
        {tx(t, "aiKnn_curseRead",
          "In 100 dimensions the \"local\" neighbourhood spans 95% of the range of every feature: it is not local at all. Equivalently, the distances from a point to all the others bunch up around the same value, and the nearest neighbour is hardly nearer than the farthest. Raw images have thousands of dimensions, which is why k-NN on pixels works poorly, and why the Deep Learning section first learns a compact representation (an embedding) in which distance means something again.")}
      </p>
      <DimensionFigure t={t} />

      <H2>{tx(t, "aiKnn_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiKnn_codeBody",
          "Sorting all n distances costs O(n log n), but only the k smallest are needed. std::nth_element rearranges the array so that the k smallest come first, in any order, in O(n) on average. Squared distances give the same ordering as distances, so the square root is skipped.")}
      </p>
      <CodeBlock lang="cpp" filename="knn.h" t={t}>{`#include <algorithm>
#include <map>
#include "dataset.h"

struct Neighbour { double dist2; std::size_t index; };

// The k training examples nearest to q (squared Euclidean distance), unordered.
std::vector<Neighbour> nearestK(const Dataset& train, const double* q, std::size_t k) {
    std::vector<Neighbour> all(train.n);
    for (std::size_t i = 0; i < train.n; ++i) {
        double s = 0.0;
        const double* x = train.row(i);
        for (std::size_t j = 0; j < train.d; ++j) s += (x[j] - q[j]) * (x[j] - q[j]);
        all[i] = {s, i};
    }
    k = std::min(k, train.n);
    std::nth_element(all.begin(), all.begin() + k, all.end(),   // k smallest first, O(n) on average
                     [](const Neighbour& a, const Neighbour& b) { return a.dist2 < b.dist2; });
    all.resize(k);
    return all;
}

int knnClassify(const Dataset& train, const double* q, std::size_t k) {
    std::map<int, int> votes;                                     // label → count
    for (const Neighbour& n : nearestK(train, q, k)) votes[int(train.y[n.index])]++;
    return std::max_element(votes.begin(), votes.end(),
                            [](auto& a, auto& b) { return a.second < b.second; })->first;
}

double knnRegress(const Dataset& train, const double* q, std::size_t k) {
    double sum = 0.0;
    const auto nb = nearestK(train, q, k);
    for (const Neighbour& n : nb) sum += train.y[n.index];
    return sum / nb.size();
}
// Apartments, standardised with the training Standardizer, Q = (70, 1):
//   knnRegress(train, q, 1) = 240,  k = 3 → 278.3,  k = 5 → 249.0`}</CodeBlock>

      <H2>{tx(t, "aiKnn_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiKnn_tMistake", "Mistake"), tx(t, "aiKnn_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiKnn_e1", "Unscaled features"), tx(t, "aiKnn_e1b", "the feature with the largest numbers decides alone who is near. Standardise with training statistics.")],
          [tx(t, "aiKnn_e2", "Judging k by training error"), tx(t, "aiKnn_e2b", "k = 1 always scores 100% on the training set. Use cross-validation.")],
          [tx(t, "aiKnn_e3", "Even k with two classes"), tx(t, "aiKnn_e3b", "ties with no rule to break them. Use an odd k, or break ties by the nearest neighbour or by distance weights.")],
          [tx(t, "aiKnn_e4", "Many irrelevant features"), tx(t, "aiKnn_e4b", "each adds noise to every distance and the useful features are drowned out. Select features, or learn a representation first.")],
          [tx(t, "aiKnn_e5", "Leaving the query in the training set when evaluating"), tx(t, "aiKnn_e5b", "it finds itself at distance 0 and copies its own label. Evaluate on held-out data, or skip the example itself (leave-one-out).")],
          [tx(t, "aiKnn_e6", "A full sort per query"), tx(t, "aiKnn_e6b", "O(n log n) where O(n) is enough. Use nth_element, or a k-d tree for many queries in few dimensions.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "aiKnn_tip", "k-NN is a good first baseline: no training, no learning rate, and a score that any cleverer model must beat to justify its complexity.")}
      </Callout>

      <KeyIdeas t={t} id="aiKnn" items={[
        "k-NN stores the training data and predicts from the k nearest examples: majority vote to classify, average to regress.",
        "Distance adds up differences across features, so features must be on comparable scales.",
        "Weighting neighbours by 1/distance lets the nearest ones count more.",
        "Small k follows every example, noise included (overfitting); large k tends to the majority (underfitting); choose k by cross-validation.",
        "k-NN draws boundaries of any shape; with k = 1 they are the edges of Voronoi cells.",
        "Training is free but each prediction costs O(n·d); k-d trees and approximate search speed it up.",
        "In high dimensions all distances look alike (the curse of dimensionality), so k-NN needs few features or a learned representation.",
      ]} />
    </Article>
  );
}
