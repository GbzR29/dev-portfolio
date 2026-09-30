"use client";

// Classic ML 2: generalisation — why training error lies (the deliveries with
// polynomials of degree 0–3); underfitting, overfitting and the bias–variance
// decomposition (Overfit figure); parameters vs hyperparameters; k-fold and
// leave-one-out cross-validation worked by hand; a preview of regularisation;
// classification metrics: accuracy and imbalance, the confusion matrix,
// precision, recall, F1, thresholds, ROC and AUC (Threshold figure);
// regression metrics; C++ k-fold and confusion matrix; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { OverfitFigure } from "@/components/lesson/figures/ai/OverfitFigure";
import { ThresholdFigure } from "@/components/lesson/figures/ai/ThresholdFigure";

const r = String.raw;

export function GeneralisationContent({ t }: { t: TrackTranslations }) {
  const prec = tx(t, "aiGen_precision", "precision"), rec = tx(t, "aiGen_recall", "recall");   // metric names inside the formulas
  return (
    <Article>
      <Lead>
        {tx(t, "aiGen_intro",
          "A model is only useful on examples it has never seen: next week's deliveries, tomorrow's emails. Fitting the training data well is easy, and it can even be a bad sign. This chapter is about the gap between the two: how models fail by being too simple or too flexible, how to measure performance honestly with validation and cross-validation, and which numbers to report for a classifier when \"percentage correct\" is misleading. Everything here applies to every model in the rest of the track.")}
      </Lead>

      <H2>{tx(t, "aiGen_lieTitle", "Training error lies")}</H2>
      <p>
        {tx(t, "aiGen_lieBody",
          "Fit polynomials of increasing degree to the five deliveries. Degree 0 is a constant (the mean, 19 min), degree 1 is the line from before, and degrees 2 and 3 add x² and x³ as features. The training MSE can only go down as the degree grows, because each model contains the previous one (set the new weight to 0). To see how each model does on a delivery it has not seen, leave one delivery out, fit on the other four, and predict the one left out; do this for all five and average the squared errors:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGen_tModel", "Model"), tx(t, "aiGen_tTrain", "Training MSE"), tx(t, "aiGen_tLoo", "Left-out errors (min)"), tx(t, "aiGen_tLooMse", "Left-out MSE")]}
        rows={[
          [tx(t, "aiGen_m0", "degree 0 (constant)"), "24.80", "8.75, 5.00, −1.25, −3.75, −8.75", "38.75"],
          [tx(t, "aiGen_m1", "degree 1 (line)"), "0.30", "0.00, 0.71, −1.25, 0.71, 0.00", "0.52"],
          [tx(t, "aiGen_m2", "degree 2"), "0.29", "−1.25, 0.91, −1.67, 0.91, −1.25", "1.51"],
          [tx(t, "aiGen_m3", "degree 3"), "0.29", "−10.00, 2.50, −1.67, 2.50, −10.00", "43.06"],
        ]}
      />
      <p>
        {tx(t, "aiGen_lieRead",
          "The cubic has the lowest training error of all, tied with the parabola, and the worst error on unseen deliveries, worse even than the constant. With four training points a cubic has four coefficients, so it passes through all four exactly and fits their noise along with their trend; asked about the fifth, at the edge, it predicts 2 minutes for 1 km. The line is the model that generalises. None of this is visible in the training column.")}
      </p>

      <H2>{tx(t, "aiGen_ufofTitle", "Underfitting and overfitting")}</H2>
      <LessonTable
        headers={["", tx(t, "aiGen_tSymptom", "Symptom"), tx(t, "aiGen_tCause", "Cause"), tx(t, "aiGen_tCure", "Cures")]}
        rows={[
          [tx(t, "aiGen_under", "underfitting"), tx(t, "aiGen_underS", "training and validation errors both high, and close to each other"), tx(t, "aiGen_underC", "the model is too simple to express the pattern (high bias)"), tx(t, "aiGen_underF", "more features, a more flexible model, less regularisation, train longer")],
          [tx(t, "aiGen_over", "overfitting"), tx(t, "aiGen_overS", "training error low, validation error much higher"), tx(t, "aiGen_overC", "the model is flexible enough to memorise noise (high variance)"), tx(t, "aiGen_overF", "more data, a simpler model, regularisation, early stopping")],
        ]}
      />
      <H3>{tx(t, "aiGen_bvTitle", "Bias and variance")}</H3>
      <p>
        {tx(t, "aiGen_bvBody",
          "Imagine collecting many different training sets from the same source and fitting the same kind of model to each. At a fixed input x, the predictions f̂(x) scatter around their average. The expected squared error on a new example then splits exactly into three parts:")}
      </p>
      <Equation label={tx(t, "aiGen_eqBv", "Bias–variance decomposition of the expected squared error at x")}
        where={[
          [r`f(x)`, tx(t, "aiGen_wF", "the true relationship; a new label is y = f(x) + noise")],
          [r`\hat f(x)`, tx(t, "aiGen_wFhat", "the prediction of a model trained on one random training set")],
          [r`\mathbb{E}[\cdot]`, tx(t, "aiGen_wE", "the average over all the training sets we could have drawn (and over the noise)")],
          [r`\sigma^2`, tx(t, "aiGen_wSigma2", "the variance of the noise: the error no model can remove")],
        ]}>
        {r`\mathbb{E}\big[(y - \hat f(x))^2\big] = \underbrace{\big(\mathbb{E}[\hat f(x)] - f(x)\big)^2}_{\text{bias}^2} + \underbrace{\mathbb{E}\big[(\hat f(x) - \mathbb{E}[\hat f(x)])^2\big]}_{\text{variance}} + \underbrace{\sigma^2}_{\text{noise}}`}
      </Equation>
      <ul className="list-disc pl-6 space-y-1.5">
        <li>{tx(t, "aiGen_bv1", "Bias: how far the average model is from the truth. A straight line fitted to a sine wave is wrong in the same way whatever data it sees. Simple models have high bias.")}</li>
        <li>{tx(t, "aiGen_bv2", "Variance: how much the model changes from one training set to another. A degree-9 polynomial through ten noisy points is a different wild curve every time. Flexible models have high variance.")}</li>
        <li>{tx(t, "aiGen_bv3", "Noise: the part of y that the features cannot explain (traffic, weather, a student's bad day). It sets a floor under every model's error.")}</li>
      </ul>
      <p>
        {tx(t, "aiGen_bvTrade",
          "Making a model more flexible usually lowers the bias and raises the variance. Total error is lowest somewhere in between, and more data moves that point toward more flexible models, because variance shrinks as the training set grows.")}
      </p>
      <OverfitFigure t={t} />

      <H2>{tx(t, "aiGen_valTitle", "Choosing with a validation set")}</H2>
      <p>
        {tx(t, "aiGen_valBody",
          "Parameters (weights, biases) are learned by the optimiser from the training set. Hyperparameters are everything chosen around it: the polynomial degree, the learning rate, the number of epochs, k in k-nearest neighbours, a tree's depth. They cannot be chosen by training error, which always prefers the most flexible option. The procedure is: train one model per candidate setting on the training set, compare them on the validation set, keep the best, and only then, once, measure it on the test set (the Data chapter explains why the test set must stay untouched).")}
      </p>
      <H3>{tx(t, "aiGen_cvTitle", "k-fold cross-validation")}</H3>
      <p>
        {tx(t, "aiGen_cvBody",
          "With little data, a single validation split is wasteful (those examples never help training) and noisy (the score depends on which examples happened to land in it). k-fold cross-validation uses every example for validation exactly once:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiGen_cv1", "Shuffle the data and cut it into k equal folds (k = 5 or 10 is typical).")}</li>
        <li>{tx(t, "aiGen_cv2", "For each fold in turn: train a fresh model on the other k − 1 folds, and measure its error on this fold.")}</li>
        <li>{tx(t, "aiGen_cv3", "Report the average of the k errors (and their spread, which shows how stable the estimate is).")}</li>
        <li>{tx(t, "aiGen_cv4", "Pick the hyperparameters with the best average, then train one final model on all the data with them.")}</li>
      </ol>
      <Equation label={tx(t, "aiGen_eqCv", "Cross-validation error")}
        where={[
          [r`k`, tx(t, "aiGen_wK", "the number of folds")],
          [r`\text{Err}_f`, tx(t, "aiGen_wErrF", "the error measured on fold f by the model trained without fold f")],
        ]}>
        {r`\text{CV} = \frac{1}{k}\sum_{f=1}^{k} \text{Err}_f`}
      </Equation>
      <p>
        {tx(t, "aiGen_cvLoo",
          "With k = n, each fold is a single example: leave-one-out cross-validation, exactly the table at the top of this chapter. For the line, the left-out errors were 0, 0.71, −1.25, 0.71 and 0; their squares 0, 0.51, 1.5625, 0.51 and 0 average to 0.52 min². Leave-one-out costs n trainings, which is fine for five deliveries and far too much for a neural network, where a single validation split is the norm.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "aiGen_regPreview", "Regularisation, previewed: instead of choosing between a flexible and a simple model, keep the flexible one and add a penalty for large weights to the loss, L + λ Σ wⱼ² (L2 or \"ridge\"). Its gradient adds 2λwⱼ to each weight's derivative, pulling every weight a little toward 0 at each step, so the model can only use a large weight where the data insists. λ is one more hyperparameter, chosen by validation. The Neural Networks section develops this, with dropout and early stopping.")}
      </Callout>

      <H2>{tx(t, "aiGen_metricsTitle", "Measuring a classifier")}</H2>
      <H3>{tx(t, "aiGen_accTitle", "When accuracy misleads")}</H3>
      <p>
        {tx(t, "aiGen_accBody",
          "Accuracy, the fraction of correct predictions, is natural but breaks down when one class is rare. Screen 1000 patients of whom 10 are sick. A \"model\" that always says \"healthy\" is 99% accurate and completely useless: it finds none of the sick. A real model that flags 30 patients, 8 of them truly sick, is only 97.6% accurate (22 + 2 mistakes), lower than the useless one, yet it finds 8 of the 10. We need numbers that look at each kind of mistake separately.")}
      </p>
      <H3>{tx(t, "aiGen_cmTitle", "The confusion matrix")}</H3>
      <LessonTable
        headers={["", tx(t, "aiGen_tPredPos", "predicted positive"), tx(t, "aiGen_tPredNeg", "predicted negative")]}
        rows={[
          [tx(t, "aiGen_tActPos", "actually positive"), tx(t, "aiGen_tp", "TP, true positive: a hit"), tx(t, "aiGen_fn", "FN, false negative: a miss")],
          [tx(t, "aiGen_tActNeg", "actually negative"), tx(t, "aiGen_fp", "FP, false positive: a false alarm"), tx(t, "aiGen_tn", "TN, true negative: correctly left alone")],
        ]}
      />
      <Equation label={tx(t, "aiGen_eqMetrics", "Metrics built from the confusion matrix")}
        where={[
          [r`\text{${prec}}`, tx(t, "aiGen_wPrec", "of everything flagged positive, the fraction that really is: how much to trust an alarm")],
          [r`\text{${rec}}`, tx(t, "aiGen_wRec", "of all real positives, the fraction found (also called sensitivity or true-positive rate)")],
          [r`\text{FPR}`, tx(t, "aiGen_wFpr", "false-positive rate: of all real negatives, the fraction wrongly flagged")],
          [r`F_1`, tx(t, "aiGen_wF1", "the harmonic mean of precision and recall: high only when both are high")],
        ]}>
        {r`\text{${prec}} = \frac{TP}{TP + FP}, \quad \text{${rec}} = \frac{TP}{TP + FN}, \quad \text{FPR} = \frac{FP}{FP + TN}, \quad F_1 = \frac{2 \cdot \text{${prec}} \cdot \text{${rec}}}{\text{${prec}} + \text{${rec}}}`}
      </Equation>
      <p>
        {tx(t, "aiGen_metricsEx",
          "For the screening model: TP = 8, FP = 22, FN = 2, TN = 968. Precision 8 / 30 = 0.27 (most alarms are false, so each needs a second test), recall 8 / 10 = 0.8, F₁ = 2 · 0.27 · 0.8 / 1.07 = 0.40. The always-healthy model has recall 0 and F₁ 0, exposing it at once. F₁ uses the harmonic mean rather than the average so that a model cannot hide a terrible recall behind a perfect precision.")}
      </p>
      <H3>{tx(t, "aiGen_thrTitle", "The threshold is a choice")}</H3>
      <p>
        {tx(t, "aiGen_thrBody",
          "A probabilistic classifier gives a score; the threshold turns it into a decision, and moving it trades false alarms for misses. The students' logistic model from the previous chapter, on its 14 students (6 passed):")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGen_tThr", "Threshold"), "TP", "FP", "FN", "TN", tx(t, "aiGen_tPrec", "Precision"), tx(t, "aiGen_tRec", "Recall")]}
        rows={[
          ["0.3", "6", "2", "0", "6", "0.75", "1.00"],
          ["0.5", "6", "1", "0", "7", "0.86", "1.00"],
          ["0.6", "4", "1", "2", "7", "0.80", "0.67"],
          ["0.9", "2", "0", "4", "8", "1.00", "0.33"],
        ]}
      />
      <p>
        {tx(t, "aiGen_thrCost",
          "The right threshold depends on what each mistake costs. A spam filter that deletes a real email (a false positive) does more harm than one that lets a spam through, so it wants high precision and a high threshold. A cancer screening wants high recall and a low threshold, because a missed case costs far more than a follow-up test.")}
      </p>
      <H3>{tx(t, "aiGen_rocTitle", "ROC curve and AUC")}</H3>
      <p>
        {tx(t, "aiGen_rocBody",
          "To judge the scores themselves, independently of any threshold, sweep the threshold from 1 down to 0 and plot recall against the false-positive rate at every step: the ROC curve (receiver operating characteristic, a name from radar). It starts at (0, 0), where nothing is flagged, and ends at (1, 1), where everything is. A perfect model goes straight up to (0, 1) first; random guessing follows the diagonal. The area under it, AUC, has a clean meaning: the probability that a randomly chosen positive gets a higher score than a randomly chosen negative. For the students: of the 6 · 8 = 48 (passed, failed) pairs, the passed student has the higher probability in 44, so AUC = 44 / 48 = 0.92.")}
      </p>
      <ThresholdFigure t={t} />

      <H3>{tx(t, "aiGen_regTitle", "Measuring a regressor")}</H3>
      <LessonTable
        headers={[tx(t, "aiGen_tMetric", "Metric"), tx(t, "aiGen_tFormula", "Formula"), tx(t, "aiGen_tUse", "Reads as")]}
        rows={[
          ["MSE", "(1/n) Σ eᵢ²", tx(t, "aiGen_r1", "the training loss; in squared units (min²), dominated by large errors")],
          ["RMSE", "√MSE", tx(t, "aiGen_r2", "a typical error in the label's own units: the line on the deliveries, √0.3 = 0.55 min")],
          ["MAE", "(1/n) Σ |eᵢ|", tx(t, "aiGen_r3", "the average absolute error; less sensitive to a few outliers")],
          ["R²", "1 − SS_res / SS_tot", tx(t, "aiGen_r4", "the fraction of variation explained, compared with always predicting the mean")],
        ]}
      />

      <H2>{tx(t, "aiGen_codeTitle", "In C++")}</H2>
      <CodeBlock lang="cpp" filename="validate.h" t={t}>{`#include <functional>
#include <numeric>
#include <random>
#include "dataset.h"

// Copy the listed examples into a new Dataset.
Dataset subset(const Dataset& ds, const std::vector<std::size_t>& idx) {
    Dataset out; out.d = ds.d; out.n = idx.size();
    for (std::size_t i : idx) {
        out.X.insert(out.X.end(), ds.row(i), ds.row(i) + ds.d);
        out.y.push_back(ds.y[i]);
    }
    return out;
}

// k-fold cross-validation. fitAndScore trains a FRESH model on train and returns its error on valid.
double crossValidate(const Dataset& ds, std::size_t k, unsigned seed,
                     const std::function<double(const Dataset& train, const Dataset& valid)>& fitAndScore) {
    std::vector<std::size_t> order(ds.n);
    std::iota(order.begin(), order.end(), 0);
    std::mt19937 rng(seed);
    std::shuffle(order.begin(), order.end(), rng);
    double total = 0.0;
    for (std::size_t f = 0; f < k; ++f) {
        std::vector<std::size_t> tr, va;
        for (std::size_t p = 0; p < ds.n; ++p)
            (p % k == f ? va : tr).push_back(order[p]);   // position p goes to fold p mod k
        total += fitAndScore(subset(ds, tr), subset(ds, va));
    }
    return total / k;
}

struct Confusion {
    std::size_t tp = 0, fp = 0, fn = 0, tn = 0;
    void add(int actual, int predicted) {
        if (actual) (predicted ? tp : fn)++;
        else        (predicted ? fp : tn)++;
    }
    double precision() const { return tp + fp ? double(tp) / (tp + fp) : 0.0; }
    double recall()    const { return tp + fn ? double(tp) / (tp + fn) : 0.0; }
    double f1() const { const double p = precision(), r = recall(); return p + r ? 2 * p * r / (p + r) : 0.0; }
};

// Usage: leave-one-out on the deliveries is crossValidate(ds, ds.n, 1, [](auto& tr, auto& va) {
//     LinearModel m = fitOneFeature(tr);  return mse(m, va); });           // 0.517`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "aiGen_tChoice", "Choice"), tx(t, "aiGen_tReason", "Reason")]}
        rows={[
          [tx(t, "aiGen_ch1", "fitAndScore builds a fresh model"), tx(t, "aiGen_ch1b", "reusing a model trained on an earlier fold would carry information from this fold's examples into its training.")],
          [tx(t, "aiGen_ch2", "scaling happens inside fitAndScore"), tx(t, "aiGen_ch2b", "the Standardizer must be fitted on each fold's training part only, or the validation fold leaks into the statistics.")],
          [tx(t, "aiGen_ch3", "fold = position mod k"), tx(t, "aiGen_ch3b", "after shuffling, this gives folds whose sizes differ by at most one.")],
        ]}
      />

      <H2>{tx(t, "aiGen_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiGen_tMistake", "Mistake"), tx(t, "aiGen_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiGen_e1", "Choosing a model by its training error"), tx(t, "aiGen_e1b", "the most flexible model always wins and overfits. Choose on validation or cross-validation error.")],
          [tx(t, "aiGen_e2", "Reporting the validation score as the final result"), tx(t, "aiGen_e2b", "it was used to choose, so it is optimistic. Report the test score, measured once.")],
          [tx(t, "aiGen_e3", "Accuracy on imbalanced classes"), tx(t, "aiGen_e3b", "the majority-class guess looks excellent. Report precision, recall, F₁ or AUC, and the confusion matrix.")],
          [tx(t, "aiGen_e4", "Preprocessing before splitting into folds"), tx(t, "aiGen_e4b", "scaling or feature selection on all the data leaks the validation folds. Do it inside each fold.")],
          [tx(t, "aiGen_e5", "Shuffling time series"), tx(t, "aiGen_e5b", "the model trains on the future and is tested on the past. Validate on the most recent period instead.")],
          [tx(t, "aiGen_e6", "Always using threshold 0.5"), tx(t, "aiGen_e6b", "ignores what each mistake costs. Choose the threshold on validation data for the precision/recall you need.")],
        ]}
      />

      <KeyIdeas t={t} id="aiGen" items={[
        "Training error only goes down as a model gets more flexible; it cannot tell a good model from one that memorised the data.",
        "Underfitting: both errors high (bias). Overfitting: training error low, validation error high (variance).",
        "Expected error = bias² + variance + noise; flexibility trades bias for variance, and more data lowers variance.",
        "Hyperparameters are chosen on validation data; k-fold cross-validation uses every example for validation once.",
        "The confusion matrix separates hits, misses, false alarms and correct rejections.",
        "Precision trusts alarms, recall counts what was found; the threshold trades one for the other according to the cost of each mistake.",
        "The ROC curve shows every threshold at once; AUC is the chance a random positive outscores a random negative.",
      ]} />
    </Article>
  );
}
