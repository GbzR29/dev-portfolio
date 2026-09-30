"use client";

// Classic ML 1: logistic regression — classification and why a straight line
// fails; the sigmoid and log-odds; the decision boundary; cross-entropy from
// maximum likelihood and why not MSE; the gradient (p − y)·x derived with the
// chain rule; the exam worked by hand (SigmoidFit figure); two features and
// reading the weights as odds multipliers (LogisticBoundary figure);
// separable data; softmax for several classes; C++ with a stable loss; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { SigmoidFitFigure } from "@/components/lesson/figures/ai/SigmoidFitFigure";
import { LogisticBoundaryFigure } from "@/components/lesson/figures/ai/LogisticBoundaryFigure";

const r = String.raw;

export function LogisticRegressionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiLog_intro",
          "Linear regression predicts a number. Many questions have a yes-or-no answer instead: will this student pass, is this email spam, will this player quit next week? That is classification, and the answer a model should give is not a bare \"yes\" but a probability: \"82% likely to pass\". Logistic regression is the simplest model that does this. It is a linear model with one extra function on top, trained with gradient descent on a new loss, and it is also exactly what one neuron of a neural network computes. This chapter builds it from the ground up and works it by hand on a small exam dataset.")}
      </Lead>

      <H2>{tx(t, "aiLog_whyTitle", "Why not a straight line?")}</H2>
      <p>
        {tx(t, "aiLog_whyBody",
          "Six students wrote down how many hours they studied, and whether they passed (label 1) or failed (label 0): 1 h failed, 2 h failed, 3 h passed, 4 h failed, 5 h passed, 6 h passed. We could fit a line ŷ = wx + b to those 0s and 1s with the previous chapters' tools. The trouble is what the line says: it keeps rising, so a student who studied 12 h gets a \"probability\" above 1, and one who studied 0 h gets one below 0. And a single extreme example, a student who studied 30 h and passed, would tilt the whole line and move the point where it crosses 0.5, even though that student was never in doubt.")}
      </p>
      <p>
        {tx(t, "aiLog_whyFix",
          "What we want is a curve that stays between 0 and 1, rises through 0.5 where the classes meet, and flattens out once the answer is clear. Keep the linear score z = w·x + b, which can be any real number, and squash it into (0, 1) with a fixed function.")}
      </p>

      <H2>{tx(t, "aiLog_sigTitle", "The sigmoid")}</H2>
      <Equation label={tx(t, "aiLog_eqSig", "The logistic (sigmoid) function and the model")}
        where={[
          [r`z`, tx(t, "aiLog_wZ", "the score: w · x + b, a weighted sum of the features plus a bias, as in linear regression")],
          [r`e^{-z}`, tx(t, "aiLog_wExp", "e ≈ 2.718 to the power −z: huge when z is very negative, close to 0 when z is very positive")],
          [r`\sigma(z)`, tx(t, "aiLog_wSig", "sigma of z: always strictly between 0 and 1")],
          [r`p`, tx(t, "aiLog_wP", "the model's probability that the label is 1 (\"pass\") for input x")],
        ]}>
        {r`\sigma(z) = \frac{1}{1 + e^{-z}}, \qquad p = P(y = 1 \mid \mathbf{x}) = \sigma(\mathbf{w}\cdot\mathbf{x} + b)`}
      </Equation>
      <LessonTable
        headers={[tx(t, "aiLog_tProp", "Property"), tx(t, "aiLog_tWhy", "Why it holds, and what it means")]}
        rows={[
          ["σ(0) = 0.5", tx(t, "aiLog_p1", "e⁰ = 1, so σ(0) = 1/2: a score of 0 means \"no idea\".")],
          ["σ(z) → 1, σ(−z) → 0", tx(t, "aiLog_p2", "for large z, e^(−z) vanishes and σ → 1/1. σ(2) = 0.881, σ(5) = 0.993: the curve saturates.")],
          ["σ(−z) = 1 − σ(z)", tx(t, "aiLog_p3", "the curve is symmetric around (0, 0.5): σ(−2) = 0.119 = 1 − 0.881.")],
          ["σ′(z) = σ(z)(1 − σ(z))", tx(t, "aiLog_p4", "differentiate (1 + e^(−z))^(−1): the result is e^(−z) / (1 + e^(−z))², which factors into σ · (1 − σ). Largest (0.25) at z = 0, nearly 0 far away.")],
        ]}
      />
      <H3>{tx(t, "aiLog_oddsTitle", "The score is a log-odds")}</H3>
      <p>
        {tx(t, "aiLog_oddsBody",
          "Solve p = σ(z) for z and you get z = ln(p / (1 − p)). The ratio p / (1 − p) is the odds, as in betting: p = 0.8 means odds of 4 to 1. So the linear part of the model is predicting the logarithm of the odds, the logit. This gives the weights a precise meaning: increasing feature j by 1 adds wⱼ to the log-odds, which multiplies the odds by e^(wⱼ). A score of z = 2 means odds of e² = 7.39 to 1, a probability of 7.39 / 8.39 = 0.881.")}
      </p>
      <Equation label={tx(t, "aiLog_eqLogit", "The logit: the inverse of the sigmoid")}
        where={[
          [r`\frac{p}{1-p}`, tx(t, "aiLog_wOdds", "the odds: how many times more likely a 1 is than a 0")],
          [r`\ln`, tx(t, "aiLog_wLn", "the natural logarithm: it turns the odds, which lie in (0, ∞), into any real number")],
        ]}>
        {r`z = \ln\frac{p}{1 - p} = \mathbf{w}\cdot\mathbf{x} + b`}
      </Equation>

      <H3>{tx(t, "aiLog_boundTitle", "The decision boundary")}</H3>
      <p>
        {tx(t, "aiLog_boundBody",
          "To turn a probability into a decision, pick a threshold, usually 0.5: predict 1 when p ≥ 0.5. Since σ(z) ≥ 0.5 exactly when z ≥ 0, the rule is \"predict 1 when w · x + b ≥ 0\". The points where w · x + b = 0 form the decision boundary: a single point with one feature (x = −b/w), a straight line with two, a flat plane (hyperplane) with more. That is why logistic regression is called a linear classifier: however the probabilities curve, the frontier between the two decisions is always flat.")}
      </p>

      <H2>{tx(t, "aiLog_lossTitle", "The loss: cross-entropy")}</H2>
      <p>
        {tx(t, "aiLog_lossLik",
          "Which w and b are best? Ask how probable the observed labels are under the model. A student who passed was given probability p of passing, and a student who failed was given probability 1 − p of failing. If the students are independent, the probability of the whole set of labels is the product of those numbers, the likelihood. Maximising it means choosing the parameters that make what actually happened as unsurprising as possible. Products of many small numbers underflow, so take the logarithm, which turns the product into a sum and keeps the same maximum; then flip the sign and average, so that it is a loss to minimise:")}
      </p>
      <Equation label={tx(t, "aiLog_eqCE", "Binary cross-entropy (mean negative log-likelihood)")}
        where={[
          [r`y_i \in \{0, 1\}`, tx(t, "aiLog_wY", "the true label of example i")],
          [r`p_i`, tx(t, "aiLog_wPi", "the model's probability of a 1 for example i: σ(w · xᵢ + b)")],
          [r`y_i \ln p_i`, tx(t, "aiLog_wTerm1", "active only when yᵢ = 1: the log of the probability given to the truth")],
          [r`(1 - y_i)\ln(1 - p_i)`, tx(t, "aiLog_wTerm0", "active only when yᵢ = 0: the log of the probability given to a 0")],
        ]}>
        {r`L(\mathbf{w}, b) = -\frac{1}{n}\sum_{i=1}^{n}\Big[\, y_i \ln p_i + (1 - y_i)\ln(1 - p_i) \,\Big]`}
      </Equation>
      <p>
        {tx(t, "aiLog_lossRead",
          "For each example only one of the two terms is non-zero, so each example simply costs −ln(probability the model gave to the right answer):")}
      </p>
      <LessonTable
        headers={[tx(t, "aiLog_tProb", "Probability given to the truth"), tx(t, "aiLog_tCost", "Cost −ln"), tx(t, "aiLog_tMeaning", "Meaning")]}
        rows={[
          ["0.99", "0.010", tx(t, "aiLog_c1", "confident and right: almost free")],
          ["0.9", "0.105", tx(t, "aiLog_c2", "right, fairly sure")],
          ["0.5", "0.693", tx(t, "aiLog_c3", "a coin flip: ln 2, the loss of a model that knows nothing")],
          ["0.1", "2.303", tx(t, "aiLog_c4", "wrong, fairly sure")],
          ["0.01", "4.605", tx(t, "aiLog_c5", "confident and wrong: expensive, and unbounded as the probability goes to 0")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "aiLog_whyNotMse", "Why not the MSE, (p − y)²? Two reasons. With the sigmoid inside, the MSE is no longer a bowl: it has flat plateaus where gradient descent stalls. And its gradient contains the factor σ′(z) = p(1 − p), which is almost 0 when the model is confidently wrong (p ≈ 0 for a true 1). So the worst mistakes would produce the weakest corrections. Cross-entropy's −ln p cancels that factor exactly, as the next section shows, and it is convex in w and b: one minimum, no plateaus.")}
      </Callout>

      <H2>{tx(t, "aiLog_gradTitle", "The gradient")}</H2>
      <p>
        {tx(t, "aiLog_gradChain",
          "Take one example's cost ℓ = −[y ln p + (1 − y) ln(1 − p)] and apply the chain rule through p = σ(z) and z = w · x + b, one link at a time:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiLog_g1", "∂ℓ/∂p = −y/p + (1 − y)/(1 − p): the derivative of −ln p is −1/p, and of −ln(1 − p) is +1/(1 − p). Over a common denominator this is (p − y) / (p(1 − p)).")}</li>
        <li>{tx(t, "aiLog_g2", "∂p/∂z = p(1 − p): the sigmoid's derivative from the table above.")}</li>
        <li>{tx(t, "aiLog_g3", "Multiply: ∂ℓ/∂z = (p − y) / (p(1 − p)) · p(1 − p) = p − y. The awkward factors cancel completely.")}</li>
        <li>{tx(t, "aiLog_g4", "∂z/∂wⱼ = xⱼ and ∂z/∂b = 1, so ∂ℓ/∂wⱼ = (p − y)xⱼ and ∂ℓ/∂b = p − y. Average over the examples:")}</li>
      </ol>
      <Equation label={tx(t, "aiLog_eqGrad", "Gradient of the cross-entropy")}
        where={[
          [r`p_i - y_i`, tx(t, "aiLog_wErr", "the error of example i: between −1 and 1, largest when the model is confidently wrong")],
          [r`x_{ij}`, tx(t, "aiLog_wXij", "feature j of example i: the error is shared out to each weight in proportion to its input")],
        ]}>
        {r`\frac{\partial L}{\partial w_j} = \frac{1}{n}\sum_{i=1}^{n}(p_i - y_i)\,x_{ij}, \qquad \frac{\partial L}{\partial b} = \frac{1}{n}\sum_{i=1}^{n}(p_i - y_i)`}
      </Equation>
      <p>
        {tx(t, "aiLog_gradSame",
          "This is the linear-regression gradient with the prediction replaced by p and without the factor 2. The same training loop works unchanged; only the prediction and the loss differ. Setting ∂L/∂b = 0 also tells us something about the answer: at the optimum Σpᵢ = Σyᵢ, so the predicted probabilities add up to the number of 1s in the data.")}
      </p>

      <H3>{tx(t, "aiLog_workedTitle", "Worked example: the exam")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiLog_w1", "Start at w = b = 0. Every score is 0, every p = 0.5, and each student costs −ln 0.5 = 0.693, so L = 0.693.")}</li>
        <li>{tx(t, "aiLog_w2", "Errors p − y for 1…6 h: 0.5, 0.5, −0.5, 0.5, −0.5, −0.5. Σ(p − y) = 0, so ∂L/∂b = 0. Σ(p − y)x = 0.5 + 1 − 1.5 + 2 − 2.5 − 3 = −3.5, so ∂L/∂w = −3.5 / 6 = −0.583.")}</li>
        <li>{tx(t, "aiLog_w3", "One step with η = 0.5: w = 0 − 0.5 · (−0.583) = 0.292, b stays 0. The loss drops to 0.672: more hours now mean a higher probability of passing.")}</li>
        <li>{tx(t, "aiLog_w4", "Many steps later: w = 1.214, b = −4.249, L = 0.413. The probabilities are 0.046, 0.139, 0.353, 0.647, 0.861, 0.954, and they add up to 3.000, the number of passes, as the gradient promised.")}</li>
        <li>{tx(t, "aiLog_w5", "The boundary is x = −b/w = 4.249 / 1.214 = 3.5 h, exactly halfway between the two surprising students (3 h passed, 4 h failed). Each extra hour multiplies the odds of passing by e^1.214 = 3.37.")}</li>
      </ol>
      <SigmoidFitFigure t={t} />

      <H2>{tx(t, "aiLog_twoTitle", "Two features")}</H2>
      <p>
        {tx(t, "aiLog_twoBody",
          "Fourteen students now report hours studied h and hours slept the night before s. Nothing changes in the method: z = w₁h + w₂s + b, p = σ(z), the same loss and gradient. Gradient descent on standardised features gives, back in hours, p = σ(1.34h + 1.57s − 15.82). Reading it:")}
      </p>
      <ul className="list-disc pl-6 space-y-1.5">
        <li>{tx(t, "aiLog_t1", "Each extra hour of study multiplies the odds of passing by e^1.34 = 3.8; each extra hour of sleep by e^1.57 = 4.8, with the other feature held fixed.")}</li>
        <li>{tx(t, "aiLog_t2", "A student with 4 h of study and 7 h of sleep: z = 1.342 · 4 + 1.575 · 7 − 15.822 = 0.57 (with the weights to three decimals; rounding them to two changes z by 0.04), p = σ(0.57) = 0.64. With 3 h and 6 h: z = −2.35, p = 0.09.")}</li>
        <li>{tx(t, "aiLog_t3", "The boundary is the line 1.34h + 1.57s = 15.82, or s = 10.05 − 0.85h: every hour less of study must be paid for with 0.85 h more sleep to stay at 50%.")}</li>
        <li>{tx(t, "aiLog_t4", "13 of the 14 are classified correctly at threshold 0.5. The student who studied 5 h, slept 7 h and still failed gets p = 0.87; no line can fix that.")}</li>
      </ul>
      <LogisticBoundaryFigure t={t} />
      <Callout type="warn" t={t}>
        {tx(t, "aiLog_separable", "If some line separates the two classes perfectly, there is no finite minimum: making w twice as large keeps every decision the same and pushes every probability closer to 0 or 1, which always lowers the loss a bit more. Gradient descent then lets the weights grow forever and the model becomes absurdly confident. The fix is regularisation, a penalty on large weights, previewed in the next chapter and developed in the Neural Networks section.")}
      </Callout>

      <H2>{tx(t, "aiLog_softTitle", "More than two classes: softmax")}</H2>
      <p>
        {tx(t, "aiLog_softBody",
          "To pick one of K classes (grade A, B or C), give each class its own weight vector and score, z_k = w_k · x + b_k, and turn the K scores into K probabilities that are positive and add up to 1:")}
      </p>
      <Equation label={tx(t, "aiLog_eqSoft", "Softmax and its cross-entropy")}
        where={[
          [r`z_k`, tx(t, "aiLog_wZk", "the score of class k")],
          [r`e^{z_k}`, tx(t, "aiLog_wEzk", "the exponential makes every score positive and exaggerates differences")],
          [r`\sum_j e^{z_j}`, tx(t, "aiLog_wSum", "the sum over all K classes: dividing by it makes the probabilities add up to 1")],
          [r`c`, tx(t, "aiLog_wC", "the true class of the example: only its probability enters the loss")],
        ]}>
        {r`p_k = \frac{e^{z_k}}{\sum_{j=1}^{K} e^{z_j}}, \qquad \ell = -\ln p_c, \qquad \frac{\partial \ell}{\partial z_k} = p_k - [k = c]`}
      </Equation>
      <p>
        {tx(t, "aiLog_softEx",
          "Scores (2, 1, 0) give e² = 7.389, e¹ = 2.718, e⁰ = 1, which sum to 11.107, so the probabilities are 0.665, 0.245, 0.090. If the true class is the first, the cost is −ln 0.665 = 0.408. The gradient has the same shape as before: probability minus the one-hot label ([k = c] is 1 for the true class, 0 otherwise). With K = 2, softmax is exactly the sigmoid of z₁ − z₂. Neural networks for classification end in this same softmax layer.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "aiLog_softStable", "e^z overflows a double above z ≈ 709. Subtracting the largest score from all of them changes nothing (the factor e^(−max) cancels between top and bottom) and keeps every exponent ≤ 0. Always compute softmax that way.")}
      </Callout>

      <H2>{tx(t, "aiLog_codeTitle", "In C++")}</H2>
      <p>
        {tx(t, "aiLog_codeStable",
          "Computing ln p directly fails when p rounds to exactly 0 or 1. Written in terms of the score z, one example's loss is ln(1 + e^z) − yz, and ln(1 + e^z) = max(z, 0) + ln(1 + e^(−|z|)) never overflows. std::log1p computes ln(1 + u) accurately even for tiny u.")}
      </p>
      <CodeBlock lang="cpp" filename="logistic.h" t={t}>{`#include <cmath>
#include "dataset.h"                                      // Dataset from the Data chapter; labels are 0 or 1

inline double sigmoid(double z) { return 1.0 / (1.0 + std::exp(-z)); }

struct LogisticModel {
    std::vector<double> w;
    double b = 0.0;
    explicit LogisticModel(std::size_t d) : w(d, 0.0) {}

    double score(const double* x) const {                 // z = w · x + b, the log-odds
        double z = b;
        for (std::size_t j = 0; j < w.size(); ++j) z += w[j] * x[j];
        return z;
    }
    double proba(const double* x) const { return sigmoid(score(x)); }
    int predict(const double* x, double threshold = 0.5) const { return proba(x) >= threshold; }
};

// Mean cross-entropy, computed from the score so it never takes log(0)
double crossEntropy(const LogisticModel& m, const Dataset& ds) {
    double sum = 0.0;
    for (std::size_t i = 0; i < ds.n; ++i) {
        const double z = m.score(ds.row(i));
        sum += std::max(z, 0.0) + std::log1p(std::exp(-std::abs(z))) - ds.y[i] * z;   // ln(1 + e^z) − y z
    }
    return sum / ds.n;
}

// One epoch of mini-batch gradient descent: the same loop as for linear regression
void trainEpoch(LogisticModel& m, const Dataset& ds, const std::vector<std::size_t>& order,
                std::size_t batch, double lr) {
    std::vector<double> gw(m.w.size());
    for (std::size_t start = 0; start < ds.n; start += batch) {
        const std::size_t end = std::min(start + batch, ds.n);
        std::fill(gw.begin(), gw.end(), 0.0);
        double gb = 0.0;
        for (std::size_t k = start; k < end; ++k) {
            const std::size_t i = order[k];
            const double e = m.proba(ds.row(i)) - ds.y[i];    // p − y
            for (std::size_t j = 0; j < gw.size(); ++j) gw[j] += e * ds.at(i, j);
            gb += e;
        }
        const double scale = 1.0 / double(end - start);    // mean; no factor 2 here
        for (std::size_t j = 0; j < gw.size(); ++j) m.w[j] -= lr * scale * gw[j];
        m.b -= lr * scale * gb;
    }
}
// Exam, 1 feature, 5000 epochs of batch GD with lr = 0.5  →  w = 1.214, b = −4.249`}</CodeBlock>

      <H2>{tx(t, "aiLog_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiLog_tMistake", "Mistake"), tx(t, "aiLog_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiLog_e1", "Training with the MSE"), tx(t, "aiLog_e1b", "plateaus and vanishing corrections for confident mistakes. Use cross-entropy.")],
          [tx(t, "aiLog_e2", "Computing log(p) with p exactly 0 or 1"), tx(t, "aiLog_e2b", "−inf or NaN in the loss. Compute the loss from the score z with log1p, or clamp p to [10⁻¹², 1 − 10⁻¹²].")],
          [tx(t, "aiLog_e3", "Softmax without subtracting the maximum"), tx(t, "aiLog_e3b", "exp overflows to inf and inf/inf is NaN. Subtract max z first.")],
          [tx(t, "aiLog_e4", "Reading p ≥ 0.5 as the only possible rule"), tx(t, "aiLog_e4b", "the threshold is a separate decision that depends on the cost of each kind of mistake (next chapter).")],
          [tx(t, "aiLog_e5", "Labels coded −1/+1"), tx(t, "aiLog_e5b", "the formulas here assume 0/1; with −1 the loss is wrong and the gradient pushes the wrong way. Map labels to 0 and 1.")],
          [tx(t, "aiLog_e6", "Expecting a curved boundary"), tx(t, "aiLog_e6b", "the boundary is always a line (hyperplane). Add engineered features (h², h·s) or use a model that bends: trees, k-NN, neural networks.")],
          [tx(t, "aiLog_e7", "Separable data, no regularisation"), tx(t, "aiLog_e7b", "weights grow without end and probabilities become 0 and 1. Add a penalty on the weights, or stop early.")],
        ]}
      />

      <KeyIdeas t={t} id="aiLog" items={[
        "Classification predicts a category; logistic regression predicts the probability of class 1 as p = σ(w · x + b).",
        "The sigmoid σ(z) = 1 / (1 + e^(−z)) squashes any score into (0, 1); σ(0) = 0.5 and σ′ = σ(1 − σ).",
        "The score is the log-odds: raising feature j by 1 multiplies the odds by e^(wⱼ).",
        "The decision boundary w · x + b = 0 is a point, a line or a hyperplane: logistic regression is a linear classifier.",
        "Cross-entropy, the mean of −ln(probability given to the truth), comes from maximum likelihood and is convex.",
        "Its gradient is (1/n) Σ (pᵢ − yᵢ) xᵢ: the same shape as linear regression, so the same training loop applies.",
        "Softmax extends it to K classes; compute it after subtracting the largest score.",
      ]} />
    </Article>
  );
}
