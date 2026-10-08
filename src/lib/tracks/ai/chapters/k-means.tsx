"use client";

// Classic ML 5: k-means — unsupervised learning and clustering; the
// objective (inertia); Lloyd's algorithm, assign and update, and why each
// step lowers J; seven points worked by hand from a bad start; local minima,
// restarts and k-means++; choosing k with the elbow (KMeans figure); what
// k-means assumes (round, similar clusters, scaled features); uses such as
// colour quantisation; C++ with k-means++; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { KMeansFigure } from "@/components/lesson/figures/ai/KMeansFigure";

const r = String.raw;

export function KMeansContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiKm_intro",
          "Every model so far learned from labels: the delivery time, pass or fail. Often there are no labels at all, just data: players' play sessions, the colours of an image, customers' purchases. Unsupervised learning looks for structure in the data alone, and the most basic structure is groups of similar examples, clusters. k-means finds k clusters with a two-step loop simple enough to run by hand, and it is still one of the most used algorithms in practice. This chapter defines what it optimises, runs it by hand, shows how it gets stuck and how k-means++ avoids that, and covers how to choose k.")}
      </Lead>

      <Goals t={t} id="aiKm" items={[
        "Group data without labels into clusters with Lloyd's algorithm.",
        "Run k-means by hand and spot a bad result caused by a bad start.",
        "Start better with k-means++ and choose k.",
        "Say which shapes of clusters k-means can find and which it cannot.",
      ]} />

      <H2>{tx(t, "aiKm_goalTitle", "What a good clustering is")}</H2>
      <p>
        {tx(t, "aiKm_goalBody",
          "k-means describes each cluster by one point, its centroid (its centre of mass), and wants every example to be close to the centroid of its cluster. \"Close\" is measured by squared distance, and the total over all examples is the objective, called inertia or the within-cluster sum of squares:")}
      </p>
      <Equation label={tx(t, "aiKm_eqJ", "The k-means objective")}
        where={[
          [r`\mathbf{x}_i`, tx(t, "aiKm_wXi", "example i, a vector of d features; there are n examples")],
          [r`\boldsymbol\mu_j`, tx(t, "aiKm_wMu", "the centroid of cluster j, for j = 1 … k")],
          [r`c_i`, tx(t, "aiKm_wCi", "the cluster example i is assigned to (a number from 1 to k)")],
          [r`\lVert \cdot \rVert^2`, tx(t, "aiKm_wNorm", "squared Euclidean distance: the sum of squared differences of the features")],
        ]}>
        {r`J(c, \boldsymbol\mu) = \sum_{i=1}^{n} \lVert \mathbf{x}_i - \boldsymbol\mu_{c_i} \rVert^2`}
      </Equation>
      <p>
        {tx(t, "aiKm_goalHard",
          "J has two kinds of unknowns: the assignments c (which cluster each example is in) and the centroids μ. Finding the best of both at once is NP-hard. But each one is easy if the other is fixed, and that is the whole trick.")}
      </p>

      <H2>{tx(t, "aiKm_lloydTitle", "Lloyd's algorithm")}</H2>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiKm_l1", "Start: choose k initial centroids, for example k examples picked at random.")}</li>
        <li>{tx(t, "aiKm_l2", "Assign: put every example in the cluster of its nearest centroid.")}</li>
        <li>{tx(t, "aiKm_l3", "Update: move every centroid to the mean of the examples assigned to it.")}</li>
        <li>{tx(t, "aiKm_l4", "Repeat 2 and 3 until no assignment changes.")}</li>
      </ol>
      <H3>{tx(t, "aiKm_whyTitle", "Why J can only go down")}</H3>
      <ul className="list-disc pl-6 space-y-1.5">
        <li>{tx(t, "aiKm_why1", "Assign step, with the centroids fixed: each example's term ‖xᵢ − μ_cᵢ‖² is chosen as the smallest of its k options, so no term can grow.")}</li>
        <li>{tx(t, "aiKm_why2", "Update step, with the assignments fixed: for one cluster, the point m that minimises Σ‖xᵢ − m‖² is the mean. Setting the gradient −2Σ(xᵢ − m) to zero gives m = (1/n_j) Σ xᵢ. It is the same reason the best constant prediction under the MSE is the mean (the degree-0 model in the Generalisation chapter predicts 19 min, the average delivery).")}</li>
        <li>{tx(t, "aiKm_why3", "J never increases and there are only finitely many ways to assign n examples to k clusters, so the algorithm must stop, usually after a few dozen iterations. It stops at a local minimum: no single step can improve it, but a different start might have found a lower J.")}</li>
      </ul>

      <H2>{tx(t, "aiKm_workedTitle", "Worked example: seven points, a bad start")}</H2>
      <p>
        {tx(t, "aiKm_workedBody",
          "Seven examples: A (1, 1), B (2, 1), C (1, 2) in one corner and D (5, 4), E (6, 5), F (5, 6), G (4, 5) in the other. With k = 2, start badly, with both centroids in the first group: μ₁ = A = (1, 1), μ₂ = B = (2, 1).")}
      </p>
      <LessonTable
        headers={[tx(t, "aiKm_tStep", "Step"), "μ₁", "μ₂", tx(t, "aiKm_tClusters", "Clusters"), "J"]}
        rows={[
          [tx(t, "aiKm_r0", "assign"), "(1, 1)", "(2, 1)", "{A, C} · {B, D, E, F, G}", "105"],
          [tx(t, "aiKm_r1", "update, assign"), "(1, 1.5)", "(4.4, 4.2)", "{A, B, C} · {D, E, F, G}", "9.75"],
          [tx(t, "aiKm_r2", "update, assign"), "(1.33, 1.33)", "(5, 5)", "{A, B, C} · {D, E, F, G}", "5.33"],
        ]}
      />
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiKm_w1", "Assign. C is at squared distance 0 + 1 = 1 from μ₁ and 1 + 1 = 2 from μ₂, so it joins μ₁. Every point of the far group is nearer to μ₂ = (2, 1), which is slightly closer to them. J = 0 (A) + 1 (C) + 0 (B) + 18 (D: 3² + 3²) + 32 (E) + 34 (F) + 20 (G) = 105.")}</li>
        <li>{tx(t, "aiKm_w2", "Update. μ₁ = mean of A and C = (1, 1.5). μ₂ = mean of B, D, E, F, G = ((2 + 5 + 6 + 5 + 4)/5, (1 + 4 + 5 + 6 + 5)/5) = (4.4, 4.2): it has been dragged halfway out by the far group.")}</li>
        <li>{tx(t, "aiKm_w3", "Assign. B is now at squared distance 1 + 0.25 = 1.25 from μ₁ and 2.4² + 3.2² = 16 from μ₂, so it switches to cluster 1. The clusters are now the two natural groups; J = 9.75.")}</li>
        <li>{tx(t, "aiKm_w4", "Update. μ₁ = (4/3, 4/3) = (1.33, 1.33), μ₂ = (20/4, 20/4) = (5, 5). Assign again: nothing changes, so the algorithm has converged, with J = 5.33.")}</li>
      </ol>

      <H2>{tx(t, "aiKm_initTitle", "Local minima and k-means++")}</H2>
      <p>
        {tx(t, "aiKm_initBody",
          "Here the bad start recovered. With more clusters it often does not: two centroids that start in the same blob split it between them, and some other centroid is left covering two blobs. No single step can fix that, because moving one centroid across empty space would first make J worse. Two remedies are used together: run k-means several times from different starts and keep the lowest J, and start from well-spread centroids with k-means++:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiKm_pp1", "Pick the first centroid uniformly at random among the examples.")}</li>
        <li>{tx(t, "aiKm_pp2", "For every example compute D(x), its distance to the nearest centroid chosen so far.")}</li>
        <li>{tx(t, "aiKm_pp3", "Pick the next centroid at random, with each example's probability proportional to D(x)²: far-away examples are much more likely to be chosen.")}</li>
        <li>{tx(t, "aiKm_pp4", "Repeat until there are k centroids, then run Lloyd's algorithm as usual.")}</li>
      </ol>
      <Equation label={tx(t, "aiKm_eqPP", "k-means++: probability of choosing x as the next centroid")}
        where={[
          [r`D(\mathbf{x})`, tx(t, "aiKm_wD", "the distance from x to the closest centroid already chosen")],
          [r`\sum_{\mathbf{x}'} D(\mathbf{x}')^2`, tx(t, "aiKm_wSum", "the same quantity summed over all examples, so the probabilities add up to 1")],
        ]}>
        {r`P(\mathbf{x}) = \frac{D(\mathbf{x})^2}{\sum_{\mathbf{x}'} D(\mathbf{x}')^2}`}
      </Equation>
      <p>
        {tx(t, "aiKm_ppEx",
          "In the example, if A is picked first, D² is 0 for A, 1 for B and C, and 25, 41, 41 and 25 for D, E, F and G (E: 5² + 4²). The total is 134, so the second centroid falls in the far group with probability 132/134 = 98.5%. Squaring matters: it makes the distant groups far more likely than the many nearby points combined. k-means++ also comes with a guarantee: on average its result is within a factor of O(log k) of the best possible J.")}
      </p>

      <H2>{tx(t, "aiKm_kTitle", "Choosing k")}</H2>
      <p>
        {tx(t, "aiKm_kBody",
          "J cannot be used to choose k directly: more centroids always fit better, down to J = 0 with k = n (every example its own cluster). Common approaches:")}
      </p>
      <ul className="list-disc pl-6 space-y-1.5">
        <li>{tx(t, "aiKm_k1", "The elbow: plot the best J against k. It falls steeply while each new cluster splits a real group, then flattens once new clusters only split groups that were already fine. In the figure below: 1010, 243, 108, 42, then 35, 30: the bend is at k = 4.")}</li>
        <li>{tx(t, "aiKm_k2", "The silhouette: for each example, compare a, its mean distance to its own cluster, with b, its mean distance to the nearest other cluster: s = (b − a) / max(a, b), from −1 (wrong cluster) to 1 (well placed). Pick the k with the highest average s.")}</li>
        <li>{tx(t, "aiKm_k3", "The use: often k is set by the application. A palette of 16 colours needs k = 16; three difficulty tiers need k = 3.")}</li>
      </ul>
      <KMeansFigure t={t} />

      <H2>{tx(t, "aiKm_assumeTitle", "What k-means assumes")}</H2>
      <LessonTable
        headers={[tx(t, "aiKm_tAssume", "Assumption"), tx(t, "aiKm_tBreaks", "When it breaks")]}
        rows={[
          [tx(t, "aiKm_a1", "clusters are round blobs"), tx(t, "aiKm_a1b", "long, curved or ring-shaped groups are cut by straight boundaries (each centroid's region is a Voronoi cell, always convex).")],
          [tx(t, "aiKm_a2", "clusters have similar sizes and spreads"), tx(t, "aiKm_a2b", "a big diffuse group next to a small tight one gets split, and part of it is handed to the small one.")],
          [tx(t, "aiKm_a3", "features are on comparable scales"), tx(t, "aiKm_a3b", "a feature in thousands dominates every distance. Standardise first, as for k-NN.")],
          [tx(t, "aiKm_a4", "the mean is a sensible summary"), tx(t, "aiKm_a4b", "outliers pull the centroid far away. k-medoids uses an actual example as the centre and is more robust.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "aiKm_uses", "Uses: colour quantisation (cluster an image's pixels in RGB with k = 16 and replace each pixel by its centroid: a 16-colour palette), grouping players by play style for matchmaking or analysis, compressing vectors into a codebook (vector quantisation, a cousin of the embeddings in the Deep Learning section), and as a quick first look at any unlabelled dataset.")}
      </Callout>

      <H2>{tx(t, "aiKm_codeTitle", "In C++")}</H2>
      <CodeBlock lang="cpp" filename="kmeans.h" t={t}>{`#include <limits>
#include <random>
#include "dataset.h"                                      // labels (y) unused: unsupervised

struct KMeans {
    std::size_t k, d;
    std::vector<double> centroids;                        // k × d, row-major like Dataset::X
    std::vector<std::size_t> assign;                      // cluster of each example

    static double dist2(const double* a, const double* b, std::size_t d) {
        double s = 0; for (std::size_t j = 0; j < d; ++j) s += (a[j] - b[j]) * (a[j] - b[j]); return s;
    }
    std::size_t nearest(const double* x) const {
        std::size_t best = 0; double bd = std::numeric_limits<double>::max();
        for (std::size_t c = 0; c < k; ++c) {
            const double dd = dist2(x, &centroids[c * d], d);
            if (dd < bd) { bd = dd; best = c; }
        }
        return best;
    }

    void initPlusPlus(const Dataset& ds, std::mt19937& rng) {
        const std::size_t first = std::uniform_int_distribution<std::size_t>(0, ds.n - 1)(rng);
        centroids.assign(ds.row(first), ds.row(first) + d);   // first centroid: a random example
        std::vector<double> D2(ds.n);
        for (std::size_t c = 1; c < k; ++c) {
            for (std::size_t i = 0; i < ds.n; ++i) {       // squared distance to the nearest chosen centroid
                D2[i] = std::numeric_limits<double>::max();
                for (std::size_t p = 0; p < c; ++p) D2[i] = std::min(D2[i], dist2(ds.row(i), &centroids[p * d], d));
            }
            std::discrete_distribution<std::size_t> pick(D2.begin(), D2.end());   // P(i) ∝ D2[i]
            const std::size_t i = pick(rng);
            centroids.insert(centroids.end(), ds.row(i), ds.row(i) + d);
        }
    }

    // Lloyd's algorithm; returns the final inertia J.
    double fit(const Dataset& ds, unsigned seed, int maxIter = 100) {
        d = ds.d;
        std::mt19937 rng(seed);
        initPlusPlus(ds, rng);
        assign.assign(ds.n, k);                           // k = "no cluster yet", so the first pass always changes
        for (int it = 0; it < maxIter; ++it) {
            bool changed = false;
            for (std::size_t i = 0; i < ds.n; ++i) {      // assign
                const std::size_t c = nearest(ds.row(i));
                if (c != assign[i]) { assign[i] = c; changed = true; }
            }
            if (!changed) break;
            std::vector<double> sum(k * d, 0.0);          // update: mean of each cluster
            std::vector<std::size_t> count(k, 0);
            for (std::size_t i = 0; i < ds.n; ++i) {
                for (std::size_t j = 0; j < d; ++j) sum[assign[i] * d + j] += ds.at(i, j);
                count[assign[i]]++;
            }
            for (std::size_t c = 0; c < k; ++c)
                if (count[c]) for (std::size_t j = 0; j < d; ++j) centroids[c * d + j] = sum[c * d + j] / count[c];
        }
        double J = 0;
        for (std::size_t i = 0; i < ds.n; ++i) J += dist2(ds.row(i), &centroids[assign[i] * d], d);
        return J;
    }
};
// Keep the best of several seeds: for (unsigned s = 0; s < 10; ++s) { KMeans m{4}; double J = m.fit(ds, s); … }`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "aiKm_tChoice", "Choice"), tx(t, "aiKm_tReason", "Reason")]}
        rows={[
          [tx(t, "aiKm_ch1", "std::discrete_distribution"), tx(t, "aiKm_ch1b", "draws index i with probability D2[i] / ΣD2 directly; the chosen centroids have D2 = 0 and are never picked twice.")],
          [tx(t, "aiKm_ch2", "stop when no assignment changes"), tx(t, "aiKm_ch2b", "then the next update would give the same means: the algorithm has converged exactly, with no tolerance to tune.")],
          [tx(t, "aiKm_ch3", "an empty cluster keeps its centroid"), tx(t, "aiKm_ch3b", "the mean of no examples is undefined. Libraries often move it to the example farthest from its centroid instead.")],
        ]}
      />

      <H2>{tx(t, "aiKm_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiKm_tMistake", "Mistake"), tx(t, "aiKm_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiKm_e1", "A single random start"), tx(t, "aiKm_e1b", "a poor local minimum, different every run. Use k-means++ and keep the best of several runs.")],
          [tx(t, "aiKm_e2", "Choosing k by the lowest J"), tx(t, "aiKm_e2b", "J always falls as k grows. Use the elbow, the silhouette or the application's needs.")],
          [tx(t, "aiKm_e3", "Unscaled features"), tx(t, "aiKm_e3b", "the clusters just slice the feature with the biggest numbers. Standardise.")],
          [tx(t, "aiKm_e4", "Reading the cluster numbers as meaningful"), tx(t, "aiKm_e4b", "\"cluster 2\" in one run can be \"cluster 0\" in the next. Describe clusters by their centroids and members.")],
          [tx(t, "aiKm_e5", "Expecting k-means to find any shape"), tx(t, "aiKm_e5b", "it only finds convex, roughly round groups. For chains and rings use density-based methods (DBSCAN) or clustering on a graph of neighbours.")],
        ]}
      />

      <KeyIdeas t={t} id="aiKm" items={[
        "Unsupervised learning finds structure without labels; clustering groups similar examples.",
        "k-means minimises J, the sum of squared distances from each example to its cluster's centroid.",
        "Lloyd's algorithm alternates assigning each example to the nearest centroid and moving each centroid to its cluster's mean.",
        "Neither step can increase J, so it always converges, but only to a local minimum that depends on the start.",
        "k-means++ picks starting centroids with probability ∝ D(x)², spreading them out; run several times and keep the lowest J.",
        "J always decreases with k; choose k with the elbow, the silhouette or the application.",
        "k-means assumes round clusters of similar size in scaled features.",
      ]} />
    </Article>
  );
}
