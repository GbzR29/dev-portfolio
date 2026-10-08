"use client";

// Foundations 2: data — examples, features and labels; an example as a
// vector and a dataset as a matrix (with the row-major C++ layout); kinds of
// features and one-hot encoding; why scale, min-max and standardisation with
// worked numbers (FeatureScale figure); train / validation / test splits,
// shuffling and data leakage, with the C++ to do them; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { FeatureScaleFigure } from "@/components/lesson/figures/ai/FeatureScaleFigure";

const r = String.raw;

export function DataContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiData_intro",
          "A model can only learn from what it is shown, and it sees the world only as numbers. Before any learning, the data has to be turned into a table of numbers the model can use: each example described by the same list of measurements, in comparable units, with part of it locked away for honest testing. Most real machine-learning work is this step. This chapter sets up the vocabulary, the C++ data structure the rest of the track uses, and the two operations almost every project needs: scaling and splitting.")}
      </Lead>

      <Goals t={t} id="aiData" items={[
        "Turn a set of examples into a table of numbers a model can use.",
        "Encode categories as numbers the right way.",
        "Scale features so they can be compared.",
        "Split data into training, validation and test sets, and say why.",
      ]} />

      <H2>{tx(t, "aiData_vocabTitle", "Examples, features and labels")}</H2>
      <p>
        {tx(t, "aiData_vocabBody",
          "Here is a small dataset: ten apartments, each described by its area and number of rooms, with the price it sold for. It is the running example for regression with several inputs.")}
      </p>
      <LessonTable
        headers={["", tx(t, "aiData_tArea", "area (m²)"), tx(t, "aiData_tRooms", "rooms"), tx(t, "aiData_tPrice", "price (thousands)")]}
        rows={[
          ["A", "35", "1", "180"], ["B", "48", "2", "230"], ["C", "52", "1", "240"], ["D", "60", "2", "275"], ["E", "68", "3", "300"],
          ["F", "75", "2", "320"], ["G", "82", "3", "350"], ["H", "95", "3", "390"], ["I", "105", "4", "430"], ["J", "120", "4", "480"],
        ]}
      />
      <LessonTable
        headers={[tx(t, "aiData_tTerm", "Term"), tx(t, "aiData_tMeaning", "Meaning"), tx(t, "aiData_tHere", "Here")]}
        rows={[
          [tx(t, "aiData_v1", "example (sample, instance)"), tx(t, "aiData_v1m", "one thing the model learns from"), tx(t, "aiData_v1h", "one apartment, one row")],
          [tx(t, "aiData_v2", "feature (input, attribute)"), tx(t, "aiData_v2m", "one measurement describing an example"), tx(t, "aiData_v2h", "area, rooms: two features")],
          [tx(t, "aiData_v3", "label (target)"), tx(t, "aiData_v3m", "the answer the model should predict"), tx(t, "aiData_v3h", "price")],
          [tx(t, "aiData_v4", "n"), tx(t, "aiData_v4m", "the number of examples"), "10"],
          [tx(t, "aiData_v5", "d"), tx(t, "aiData_v5m", "the number of features (the dimension)"), "2"],
        ]}
      />

      <H2>{tx(t, "aiData_vecTitle", "An example is a vector, a dataset is a matrix")}</H2>
      <p>
        {tx(t, "aiData_vecBody",
          "Once every example is described by the same d numbers, it is a point in d-dimensional space, a vector. Everything from the Math track's Vectors chapter now applies: the distance between two apartments, the dot product with a vector of weights. Stacking the n example vectors as rows gives the feature matrix X; the labels form a vector y:")}
      </p>
      <Equation label={tx(t, "aiData_eqX", "The dataset as a matrix and a vector")}
        where={[
          [r`\mathbf{x}_i`, tx(t, "aiData_wXi", "example i as a vector of its d features (a row of X)")],
          [r`x_{ij}`, tx(t, "aiData_wXij", "feature j of example i: row i, column j")],
          [r`\mathbf{X}`, tx(t, "aiData_wX", "the n × d feature matrix")],
          [r`\mathbf{y}`, tx(t, "aiData_wY", "the n labels")],
        ]}>
        {r`\mathbf{X} = \begin{pmatrix} x_{11} & \cdots & x_{1d} \\ \vdots & & \vdots \\ x_{n1} & \cdots & x_{nd} \end{pmatrix} = \begin{pmatrix} 35 & 1 \\ 48 & 2 \\ \vdots & \vdots \\ 120 & 4 \end{pmatrix}, \qquad \mathbf{y} = \begin{pmatrix} 180 \\ 230 \\ \vdots \\ 480 \end{pmatrix}`}
      </Equation>
      <p>
        {tx(t, "aiData_layoutBody",
          "In C++ the matrix is one contiguous array in row-major order, as in the Algorithms track's Memory chapter: feature j of example i sits at X[i·d + j]. One allocation, and walking an example's features walks consecutive memory, which the cache likes.")}
      </p>
      <CodeBlock lang="cpp" filename="dataset.h" t={t}>{`#include <vector>
#include <cstddef>

struct Dataset {
    std::size_t n = 0;                 // examples
    std::size_t d = 0;                 // features per example
    std::vector<double> X;             // n × d, row-major: feature j of example i is X[i * d + j]
    std::vector<double> y;             // n labels

    double&       at(std::size_t i, std::size_t j)       { return X[i * d + j]; }
    double        at(std::size_t i, std::size_t j) const { return X[i * d + j]; }
    const double* row(std::size_t i) const               { return &X[i * d]; }   // example i
};

Dataset apartments() {
    Dataset ds;
    ds.n = 10; ds.d = 2;
    ds.X = {35,1, 48,2, 52,1, 60,2, 68,3, 75,2, 82,3, 95,3, 105,4, 120,4};
    ds.y = {180, 230, 240, 275, 300, 320, 350, 390, 430, 480};
    return ds;
}`}</CodeBlock>

      <H2>{tx(t, "aiData_kindsTitle", "Kinds of features")}</H2>
      <LessonTable
        headers={[tx(t, "aiData_tKind", "Kind"), tx(t, "aiData_tEx", "Example"), tx(t, "aiData_tHow", "How it becomes numbers")]}
        rows={[
          [tx(t, "aiData_k1", "numeric"), tx(t, "aiData_k1e", "area, distance, age"), tx(t, "aiData_k1h", "as it is, usually scaled (below)")],
          [tx(t, "aiData_k2", "boolean"), tx(t, "aiData_k2e", "has a balcony"), tx(t, "aiData_k2h", "0 or 1")],
          [tx(t, "aiData_k3", "ordinal (ordered categories)"), tx(t, "aiData_k3e", "condition: poor < fair < good"), tx(t, "aiData_k3h", "0, 1, 2, when the steps are roughly equal")],
          [tx(t, "aiData_k4", "categorical (no order)"), tx(t, "aiData_k4e", "district: North, South, Centre"), tx(t, "aiData_k4h", "one-hot: one 0/1 feature per category")],
          [tx(t, "aiData_k5", "raw signals"), tx(t, "aiData_k5e", "an image, a sound, a sentence"), tx(t, "aiData_k5h", "pixels or samples directly, or learned codes (embeddings, Deep Learning section)")],
        ]}
      />
      <H3>{tx(t, "aiData_onehotTitle", "Why one-hot, and not 0, 1, 2")}</H3>
      <p>
        {tx(t, "aiData_onehotBody",
          "Coding North = 0, South = 1, Centre = 2 invents facts that are not true: that Centre is \"twice\" South, and that North is closer to South than to Centre. A linear model would then have to price districts along a straight line. One-hot encoding gives each category its own feature instead: North = (1, 0, 0), South = (0, 1, 0), Centre = (0, 0, 1). Every pair of districts is now at the same distance, √2, and a linear model gets one separate weight per district, the price effect of being there.")}
      </p>

      <H2>{tx(t, "aiData_scaleTitle", "Scaling: making features comparable")}</H2>
      <p>
        {tx(t, "aiData_scaleBody",
          "Area runs from 35 to 120; rooms from 1 to 4. Any algorithm that measures distance treats a difference of 1 m² exactly like a difference of 1 room, which is absurd, and the result depends on the units: measure area in cm² and it swamps everything. Gradient descent suffers too, as chapter 4 shows: features with large values make the loss surface a long, narrow valley. The cure is to put every feature on a comparable scale. Two recipes:")}
      </p>
      <Equation label={tx(t, "aiData_eqScale", "Min-max scaling and standardisation of feature j")}
        where={[
          [r`x_{ij}`, tx(t, "aiData_wRaw", "the raw value of feature j for example i")],
          [r`\min_j,\ \max_j`, tx(t, "aiData_wMinMax", "the smallest and largest value of feature j in the training data")],
          [r`\mu_j`, tx(t, "aiData_wMu", "the mean of feature j over the training data")],
          [r`\sigma_j`, tx(t, "aiData_wSigma", "its standard deviation: the square root of the mean squared distance from μⱼ")],
        ]}>
        {r`x'_{ij} = \frac{x_{ij} - \min_j}{\max_j - \min_j} \in [0, 1], \qquad z_{ij} = \frac{x_{ij} - \mu_j}{\sigma_j}`}
      </Equation>
      <p>
        {tx(t, "aiData_scaleWhich",
          "Min-max maps each feature to [0, 1] but is thrown off by a single extreme value. Standardisation gives each feature mean 0 and standard deviation 1, so a value of z = −1.5 reads as \"1.5 standard deviations below average\"; it is the usual default.")}
      </p>
      <H3>{tx(t, "aiData_workedTitle", "Worked example: standardising the apartments")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiData_w1", "Area: the ten values sum to 740, so μ = 74 m². Deviations from 74: −39, −26, −22, −14, −6, 1, 8, 21, 31, 46; their squares sum to 6496; the mean square is 649.6 and σ = √649.6 = 25.49 m².")}</li>
        <li>{tx(t, "aiData_w2", "Rooms: the values sum to 25, so μ = 2.5; the squared deviations are 2.25 or 0.25 and sum to 10.5; σ = √1.05 = 1.025.")}</li>
        <li>{tx(t, "aiData_w3", "Apartment A (35 m², 1 room) becomes z = ((35 − 74) / 25.49, (1 − 2.5) / 1.025) = (−1.53, −1.46): small on both counts, by about the same amount.")}</li>
        <li>{tx(t, "aiData_w4", "A query apartment Q of 70 m² and 1 room. Raw distances: to E (68 m², 3 rooms) √(2² + 2²) = 2.8, to C (52 m², 1 room) √(18² + 0²) = 18. E looks far closer, only because 2 m² and 2 rooms count the same.")}</li>
        <li>{tx(t, "aiData_w5", "Standardised: Q = (−0.16, −1.46), E = (−0.24, 0.49), C = (−0.86, −1.46). Now Q–E = √(0.08² + 1.95²) = 1.95 and Q–C = √(0.71² + 0²) = 0.71. C, with the same number of rooms and a similar area, is the nearest, as common sense says.")}</li>
      </ol>
      <FeatureScaleFigure t={t} />
      <Callout type="info" t={t}>
        {tx(t, "aiData_notAlways", "Not every model needs scaling. Decision trees (Classic Machine Learning section) only compare one feature at a time with a threshold, so units do not matter to them. Distance-based methods (k-nearest neighbours, k-means) and everything trained by gradient descent, which includes every neural network, do need it.")}
      </Callout>

      <H2>{tx(t, "aiData_splitTitle", "Training, validation and test sets")}</H2>
      <p>
        {tx(t, "aiData_splitBody",
          "To measure generalisation, some examples must never be seen during training. The data is shuffled and cut into parts:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiData_tSet", "Set"), tx(t, "aiData_tShare", "Typical share"), tx(t, "aiData_tUse", "Used for")]}
        rows={[
          [tx(t, "aiData_s1", "training"), "60–80%", tx(t, "aiData_s1u", "fitting the parameters: the optimiser sees only these")],
          [tx(t, "aiData_s2", "validation"), "10–20%", tx(t, "aiData_s2u", "choosing between models and settings (learning rate, model size); looked at many times")],
          [tx(t, "aiData_s3", "test"), "10–20%", tx(t, "aiData_s3u", "one final, honest estimate of performance on new data; looked at once, at the end")],
        ]}
      />
      <p>
        {tx(t, "aiData_splitWhy",
          "Why three sets and not two? Every decision made by looking at a set leaks a little information about it into the model. Choose the learning rate by its score on the test set and that score is no longer an unbiased estimate: you picked the setting that happened to do well there. The validation set absorbs those decisions and the test set stays clean. With very little data, k-fold cross-validation (Classic Machine Learning section) reuses every example for validation in turn.")}
      </p>
      <H3>{tx(t, "aiData_leakTitle", "Data leakage")}</H3>
      <p>
        {tx(t, "aiData_leakBody",
          "Leakage is any way information from the validation or test examples reaches training. The classic case is scaling: computing μ and σ on the whole dataset, then splitting, lets the test examples shift the statistics the model is trained with. Always split first, compute the scaling statistics on the training set only, and apply those same numbers to validation, test and every future example. Other leaks: duplicates that land in both sets, and features that are only known after the fact (predicting a delivery time from the time the customer rated it).")}
      </p>
      <CodeBlock lang="cpp" filename="dataset.cpp" t={t}>{`#include <algorithm>
#include <cmath>
#include <numeric>
#include <random>

// Shuffle the examples, then put the first (1 − testFraction) in train and the rest in test.
void shuffleSplit(const Dataset& all, double testFraction, unsigned seed, Dataset& train, Dataset& test) {
    std::vector<std::size_t> order(all.n);
    std::iota(order.begin(), order.end(), 0);                  // 0, 1, …, n − 1
    std::mt19937 rng(seed);                                    // fixed seed: the same split every run
    std::shuffle(order.begin(), order.end(), rng);
    const std::size_t nTest = std::size_t(std::round(all.n * testFraction));
    train = {}; test = {};
    train.d = test.d = all.d;
    for (std::size_t k = 0; k < all.n; ++k) {
        Dataset& dst = (k < all.n - nTest) ? train : test;
        const std::size_t i = order[k];
        dst.X.insert(dst.X.end(), all.row(i), all.row(i) + all.d);   // copy the row
        dst.y.push_back(all.y[i]);
        dst.n++;
    }
}

struct Standardizer {
    std::vector<double> mean, sd;
    void fit(const Dataset& train) {                           // statistics from the TRAINING set only
        mean.assign(train.d, 0.0); sd.assign(train.d, 0.0);
        for (std::size_t i = 0; i < train.n; ++i)
            for (std::size_t j = 0; j < train.d; ++j) mean[j] += train.at(i, j) / train.n;
        for (std::size_t i = 0; i < train.n; ++i)
            for (std::size_t j = 0; j < train.d; ++j) sd[j] += std::pow(train.at(i, j) - mean[j], 2) / train.n;
        for (double& s : sd) s = (s > 0) ? std::sqrt(s) : 1.0;  // a constant feature: avoid dividing by 0
    }
    void apply(Dataset& data) const {                          // the same numbers for every set
        for (std::size_t i = 0; i < data.n; ++i)
            for (std::size_t j = 0; j < data.d; ++j) data.at(i, j) = (data.at(i, j) - mean[j]) / sd[j];
    }
};

// Usage: split first, then fit on train, then apply everywhere.
//   Dataset train, test;  shuffleSplit(apartments(), 0.2, 42, train, test);
//   Standardizer sc;  sc.fit(train);  sc.apply(train);  sc.apply(test);`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "aiData_tChoice", "Choice"), tx(t, "aiData_tReason", "Reason")]}
        rows={[
          [tx(t, "aiData_c1", "shuffle before splitting"), tx(t, "aiData_c1b", "data files are often sorted (by date, by price). Cutting a sorted file puts all the expensive apartments in the test set, which then measures something the model never saw.")],
          [tx(t, "aiData_c2", "a fixed seed"), tx(t, "aiData_c2b", "the same split every run, so a change in the score comes from a change in the model, not from luck in the split.")],
          [tx(t, "aiData_c3", "σ computed with n, not n − 1"), tx(t, "aiData_c3b", "for scaling it makes no practical difference; n matches the definition used above. The Math track's Descriptive Statistics chapter explains the n − 1 version.")],
          [tx(t, "aiData_c4", "labels are not scaled here"), tx(t, "aiData_c4b", "optional for regression; if you scale the labels, remember to unscale the predictions.")],
        ]}
      />

      <H2>{tx(t, "aiData_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiData_tMistake", "Mistake"), tx(t, "aiData_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiData_e1", "Categories coded 0, 1, 2"), tx(t, "aiData_e1b", "the model assumes an order and equal spacing that do not exist. One-hot encode unordered categories.")],
          [tx(t, "aiData_e2", "Scaling statistics from the whole dataset"), tx(t, "aiData_e2b", "leakage: the test score comes out a little too good. Fit the scaler on the training set only.")],
          [tx(t, "aiData_e3", "Forgetting to scale new inputs at prediction time"), tx(t, "aiData_e3b", "the model receives raw numbers it was never trained on and its predictions are nonsense. Save the scaler with the model and apply it to every input.")],
          [tx(t, "aiData_e4", "Splitting a sorted file without shuffling"), tx(t, "aiData_e4b", "training and test cover different ranges; the test error measures extrapolation. Shuffle first (or split by time on purpose, for forecasting).")],
          [tx(t, "aiData_e5", "Tuning on the test set"), tx(t, "aiData_e5b", "the final number is optimistic. Tune on validation; look at the test set once.")],
          [tx(t, "aiData_e6", "A constant feature and σ = 0"), tx(t, "aiData_e6b", "division by zero, NaN everywhere. Drop the feature or use σ = 1.")],
        ]}
      />

      <KeyIdeas t={t} id="aiData" items={[
        "An example is described by d features and, in supervised learning, a label; n examples form an n × d matrix X and a label vector y.",
        "In C++ the matrix is one row-major array: feature j of example i is X[i·d + j].",
        "Unordered categories become one-hot vectors; ordered ones may become 0, 1, 2 when the steps are even.",
        "Distance-based methods and gradient descent need features on comparable scales: min-max to [0, 1] or standardisation to mean 0, deviation 1.",
        "Scaling can change which examples are nearest, and therefore what a model predicts.",
        "Shuffle, then split into training, validation and test sets; tune on validation, report on test once.",
        "Compute scaling statistics on the training set only and reuse them for every other input: anything else leaks test information.",
      ]} />
    </Article>
  );
}
