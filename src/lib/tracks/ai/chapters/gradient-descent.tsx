"use client";

// Foundations 4: gradient descent — the update rule and why the negative
// gradient; one parameter worked by hand, the factor 1 − 22η and the four
// regimes (LearningRate figure); two parameters: the first step by hand;
// curvature, the Hessian's eigenvalues, the stability limit 2/λmax and the
// condition number, cured by standardising (DescentPath figure); batch,
// mini-batch and stochastic gradient descent; the training loop in C++;
// stopping; gradient checking with finite differences; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { LearningRateFigure } from "@/components/lesson/figures/ai/LearningRateFigure";
import { DescentPathFigure } from "@/components/lesson/figures/ai/DescentPathFigure";

const r = String.raw;

export function GradientDescentContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiGd_intro",
          "In the first chapter you lowered the loss by dragging the line and watching the number. An algorithm cannot see the picture, and a neural network has millions of parameters instead of two, but it can compute the gradient: for every parameter, how the loss would change if that parameter grew a little. Gradient descent takes a small step against it, recomputes, and repeats. It is the optimiser behind almost all of modern machine learning. This chapter works it out by hand on the deliveries, shows exactly when it converges and when it explodes, and writes the training loop the rest of the track reuses.")}
      </Lead>

      <H2>{tx(t, "aiGd_ruleTitle", "The update rule")}</H2>
      <p>
        {tx(t, "aiGd_ruleBody",
          "The gradient ∇L is the vector of partial derivatives. The Math track's Partial Derivatives chapter shows that it points in the direction in which L increases fastest, and its length is that rate of increase. So its opposite, −∇L, is the direction of steepest descent. Gradient descent steps that way, again and again:")}
      </p>
      <Equation label={tx(t, "aiGd_eqRule", "One step of gradient descent")}
        where={[
          [r`\boldsymbol\theta`, tx(t, "aiGd_wTheta", "all the parameters together, e.g. (w, b)")],
          [r`\nabla L(\boldsymbol\theta)`, tx(t, "aiGd_wGrad", "the gradient at the current parameters: (∂L/∂w, ∂L/∂b)")],
          [r`\eta`, tx(t, "aiGd_wEta", "the learning rate (eta): how far to move per unit of gradient, chosen by you")],
          [r`\leftarrow`, tx(t, "aiGd_wArrow", "\"becomes\": every parameter is updated at the same time, from the gradient computed before the step")],
        ]}>
        {r`\boldsymbol\theta \leftarrow \boldsymbol\theta - \eta\,\nabla L(\boldsymbol\theta) \qquad\Longleftrightarrow\qquad w \leftarrow w - \eta\,\frac{\partial L}{\partial w},\quad b \leftarrow b - \eta\,\frac{\partial L}{\partial b}`}
      </Equation>
      <p>
        {tx(t, "aiGd_ruleWhy",
          "The step is proportional to the gradient, so it is large on steep ground and shrinks automatically near the bottom, where the slope goes to zero. The gradient only describes the surface right where you stand, so the step is a bet that the slope stays roughly the same for a short distance. The learning rate says how short, and choosing it is the whole difficulty.")}
      </p>

      <H2>{tx(t, "aiGd_oneTitle", "One parameter, by hand")}</H2>
      <p>
        {tx(t, "aiGd_oneBody",
          "Fix b at its best value 8.5 and let only w move. Every error becomes (w − 3.5)xᵢ + rᵢ, where rᵢ are the best line's errors (0, 0.5, −1, 0.5, 0). Expanding the square and using Σxᵢ² = 55, Σrᵢxᵢ = 0 and Σrᵢ² = 1.5, the loss along w is an exact parabola:")}
      </p>
      <Equation label={tx(t, "aiGd_eqParab", "The delivery loss along w, and its derivative")}
        where={[
          ["11", tx(t, "aiGd_w11", "Σxᵢ² / n = 55 / 5: how sharply the loss curves")],
          ["0.3", tx(t, "aiGd_w03", "the lowest loss, reached at w = 3.5")],
          [r`r = 1 - 22\eta`, tx(t, "aiGd_wR", "the factor that multiplies the distance to the minimum at every step")],
        ]}>
        {r`L(w) = 11\,(w - 3.5)^2 + 0.3, \qquad L'(w) = 22\,(w - 3.5), \qquad w_{k+1} - 3.5 = (1 - 22\eta)\,(w_k - 3.5)`}
      </Equation>
      <p>
        {tx(t, "aiGd_oneDerive",
          "The last equation follows from the update: w_{k+1} = w_k − η · 22 (w_k − 3.5); subtract 3.5 from both sides and factor out (w_k − 3.5). So the gap to the minimum is multiplied by the same number r at every step, and everything depends on r:")}
      </p>
      <LessonTable
        headers={[tx(t, "aiGd_tRange", "Learning rate"), tx(t, "aiGd_tFactor", "Factor r"), tx(t, "aiGd_tBehaviour", "Behaviour")]}
        rows={[
          ["0 < η < 1/22 ≈ 0.045", "0 < r < 1", tx(t, "aiGd_b1", "steady approach from one side; slow when η is small")],
          ["η = 1/22", "r = 0", tx(t, "aiGd_b2", "lands on the minimum in one step")],
          ["1/22 < η < 2/22 ≈ 0.091", "−1 < r < 0", tx(t, "aiGd_b3", "overshoots to the other side every step, but converges")],
          ["η = 2/22", "r = −1", tx(t, "aiGd_b4", "bounces between two points forever")],
          ["η > 2/22", "r < −1", tx(t, "aiGd_b5", "every overshoot is larger: the loss grows without limit (divergence)")],
        ]}
      />
      <H3>{tx(t, "aiGd_workedTitle", "Worked example: three steps with η = 0.01")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiGd_w1", "r = 1 − 22 · 0.01 = 0.78. Start at w₀ = 0: the gap is −3.5 and L = 11 · 12.25 + 0.3 = 135.05.")}</li>
        <li>{tx(t, "aiGd_w2", "Step 1: L′(0) = 22 · (−3.5) = −77, so w₁ = 0 − 0.01 · (−77) = 0.77. Gap −2.73 (= 0.78 · −3.5), L = 11 · 7.45 + 0.3 = 82.3.")}</li>
        <li>{tx(t, "aiGd_w3", "Step 2: gap 0.78 · −2.73 = −2.13, w₂ = 1.37, L = 50.2. Step 3: gap −1.66, w₃ = 1.84, L = 30.6.")}</li>
        <li>{tx(t, "aiGd_w4", "To shrink the gap to 1% of its start takes k steps with 0.78ᵏ = 0.01: k = ln 0.01 / ln 0.78 ≈ 18.5, so 19 steps. With η = 0.04 (r = 0.12) it takes 3.")}</li>
      </ol>
      <LearningRateFigure t={t} />

      <H2>{tx(t, "aiGd_twoTitle", "Two parameters")}</H2>
      <p>
        {tx(t, "aiGd_twoBody",
          "Now both w and b move, using the gradient from the Linear Regression chapter. The first step from (0, 0) with η = 0.01:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiGd_s1", "At w = b = 0 every prediction is 0, so the errors are −12, −15, −20, −22, −26. The loss is (144 + 225 + 400 + 484 + 676) / 5 = 385.8.")}</li>
        <li>{tx(t, "aiGd_s2", "Σ eᵢ = −95 and Σ eᵢxᵢ = −(12 + 30 + 60 + 88 + 130) = −320. So ∂L/∂w = (2/5)(−320) = −128 and ∂L/∂b = (2/5)(−95) = −38.")}</li>
        <li>{tx(t, "aiGd_s3", "Update: w = 0 − 0.01 · (−128) = 1.28 and b = 0 − 0.01 · (−38) = 0.38. Both grow, as they should: the line was far too low.")}</li>
        <li>{tx(t, "aiGd_s4", "New predictions 1.66, 2.94, 4.22, 5.50, 6.78; the loss falls to 228.6. Notice w moved more than three times as far as b: the loss is much more sensitive to w, because w's effect is multiplied by distances up to 5.")}</li>
      </ol>

      <H3>{tx(t, "aiGd_condTitle", "Curvature decides the speed")}</H3>
      <p>
        {tx(t, "aiGd_condBody",
          "With one parameter, the curvature 22 (the second derivative) set the safe learning rate. With several, the curvature is a matrix of second derivatives, the Hessian. For the MSE of a linear model it is constant:")}
      </p>
      <Equation label={tx(t, "aiGd_eqHess", "Hessian of the delivery loss and its eigenvalues")}
        where={[
          [r`\mathbf{H}`, tx(t, "aiGd_wH", "second derivatives: ∂²L/∂w² = (2/n)Σxᵢ², ∂²L/∂w∂b = (2/n)Σxᵢ, ∂²L/∂b² = 2")],
          [r`\lambda_{\max},\ \lambda_{\min}`, tx(t, "aiGd_wLam", "its eigenvalues: the curvature along the steepest and the flattest direction of the bowl (Math track, Eigenvalues chapter)")],
          [r`\kappa`, tx(t, "aiGd_wKappa", "the condition number: how many times steeper the bowl is across than along")],
        ]}>
        {r`\mathbf{H} = \frac{2}{n}\begin{pmatrix} \sum x_i^2 & \sum x_i \\ \sum x_i & n \end{pmatrix} = \begin{pmatrix} 22 & 6 \\ 6 & 2 \end{pmatrix}, \quad \lambda = 12 \pm \sqrt{136} \approx 23.66,\ 0.34, \quad \kappa = \frac{\lambda_{\max}}{\lambda_{\min}} \approx 70`}
      </Equation>
      <p>
        {tx(t, "aiGd_condExplain",
          "Along each eigen-direction gradient descent behaves like the one-parameter case, with that direction's own factor 1 − ηλ. The steep direction limits the learning rate: η must stay below 2 / λ_max = 2 / 23.66 ≈ 0.085 or the steps blow up across the valley. The flat direction then sets the speed: even at η = 0.08 its factor is 1 − 0.08 · 0.34 = 0.973, and shrinking that gap to 1% takes ln 0.01 / ln 0.973 ≈ 168 steps. The number of steps grows roughly in proportion to κ.")}
      </p>
      <p>
        {tx(t, "aiGd_condFix",
          "Standardising the distance, x′ = (x − 3) / √2, gives Σx′ = 0 and Σx′² = 5, so H = (2/5) · diag(5, 5) = 2I: the bowl is perfectly round, κ = 1, every direction has curvature 2. Any η below 1 converges, and η = 1/2 makes the factor 1 − 2 · 0.5 = 0 in every direction: one step lands on the minimum, w′ = 4.95, b′ = 19, which is w = 4.95 / √2 = 3.5 and b = 19 − 3.5 · 3 = 8.5 in the original units. This is the practical reason the Data chapter scales features.")}
      </p>
      <DescentPathFigure t={t} />

      <H2>{tx(t, "aiGd_sgdTitle", "Batch, mini-batch and stochastic")}</H2>
      <p>
        {tx(t, "aiGd_sgdBody",
          "The gradient of the MSE is an average over all n examples. With millions of examples, one exact gradient costs one pass over the whole dataset, for a single small step. But an average over a random handful of examples points roughly the same way, at a tiny fraction of the cost:")}
      </p>
      <Equation label={tx(t, "aiGd_eqBatch", "Mini-batch gradient")}
        where={[
          [r`B`, tx(t, "aiGd_wB", "a batch: a small set of example indices, taken in shuffled order")],
          [r`|B|`, tx(t, "aiGd_wBsize", "the batch size, e.g. 32")],
          [r`\ell_i`, tx(t, "aiGd_wEll", "the loss on example i alone, here (ŷᵢ − yᵢ)²")],
        ]}>
        {r`\mathbf{g}_B = \frac{1}{|B|}\sum_{i \in B} \nabla \ell_i(\boldsymbol\theta) \;\approx\; \nabla L(\boldsymbol\theta), \qquad \boldsymbol\theta \leftarrow \boldsymbol\theta - \eta\,\mathbf{g}_B`}
      </Equation>
      <LessonTable
        headers={[tx(t, "aiGd_tVariant", "Variant"), tx(t, "aiGd_tBatch", "Examples per step"), tx(t, "aiGd_tProsCons", "Trade-off")]}
        rows={[
          [tx(t, "aiGd_v1", "batch gradient descent"), "n", tx(t, "aiGd_v1b", "exact gradient, smooth path; one step per pass over the data, too slow for large n")],
          [tx(t, "aiGd_v2", "mini-batch"), "32–512", tx(t, "aiGd_v2b", "many cheap, slightly noisy steps per pass; matches how CPUs and GPUs like to work (a batch is one matrix product). The default.")],
          [tx(t, "aiGd_v3", "stochastic (SGD)"), "1", tx(t, "aiGd_v3b", "cheapest steps, noisiest path; never settles exactly, keeps jittering around the minimum unless η shrinks over time")],
        ]}
      />
      <p>
        {tx(t, "aiGd_epochBody",
          "An epoch is one pass through the whole training set, in a freshly shuffled order. With n = 5 and batches of 2, an epoch makes 3 updates (2 + 2 + 1 examples). The noise of small batches is not only a cost: in the non-convex losses of neural networks it helps the parameters escape flat regions and poor shallow dips. \"SGD\" is often used loosely for any mini-batch method.")}
      </p>

      <H2>{tx(t, "aiGd_loopTitle", "The training loop in C++")}</H2>
      <CodeBlock lang="cpp" filename="train.cpp" t={t}>{`#include <algorithm>
#include <cstdio>
#include <numeric>
#include <random>
#include "linear.h"

struct TrainConfig {
    double      lr     = 0.1;          // learning rate η
    int         epochs = 100;
    std::size_t batch  = 32;           // examples per update; ds.n gives batch gradient descent
    unsigned    seed   = 1;
};

void train(LinearModel& m, const Dataset& ds, const TrainConfig& cfg) {
    std::mt19937 rng(cfg.seed);
    std::vector<std::size_t> order(ds.n);
    std::iota(order.begin(), order.end(), 0);
    std::vector<double> gw(m.w.size());

    for (int epoch = 0; epoch < cfg.epochs; ++epoch) {
        std::shuffle(order.begin(), order.end(), rng);           // a new order every epoch
        for (std::size_t start = 0; start < ds.n; start += cfg.batch) {
            const std::size_t end = std::min(start + cfg.batch, ds.n);
            std::fill(gw.begin(), gw.end(), 0.0);
            double gb = 0.0;
            for (std::size_t k = start; k < end; ++k) {          // gradient of this batch only
                const std::size_t i = order[k];
                const double* x = ds.row(i);
                const double e = m.predict(x) - ds.y[i];
                for (std::size_t j = 0; j < gw.size(); ++j) gw[j] += e * x[j];
                gb += e;
            }
            const double scale = 2.0 / double(end - start);      // mean over the batch, times 2
            for (std::size_t j = 0; j < gw.size(); ++j) m.w[j] -= cfg.lr * scale * gw[j];
            m.b -= cfg.lr * scale * gb;                          // all updates use the same gradient
        }
        if (epoch % 10 == 0) std::printf("epoch %3d   MSE %.4f\\n", epoch, mse(m, ds));
    }
}

int main() {
    Dataset ds;                                                  // the deliveries, one feature
    ds.n = 5; ds.d = 1;
    ds.X = {1, 2, 3, 4, 5};
    ds.y = {12, 15, 20, 22, 26};
    Standardizer sc; sc.fit(ds); sc.apply(ds);                   // x' = (x − 3) / √2
    LinearModel m(1);
    train(m, ds, {.lr = 0.1, .epochs = 60, .batch = 5});         // batch gradient descent
    // back to km: ŷ = w'(x − μ)/σ + b'  ⇒  w = w'/σ, b = b' − w'μ/σ
    const double w = m.w[0] / sc.sd[0], b = m.b - m.w[0] * sc.mean[0] / sc.sd[0];
    std::printf("w = %.3f min/km, b = %.3f min\\n", w, b);      // 3.500, 8.500
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "aiGd_tChoice", "Choice"), tx(t, "aiGd_tReason", "Reason")]}
        rows={[
          [tx(t, "aiGd_c1", "average over the batch, not sum"), tx(t, "aiGd_c1b", "the size of the gradient, and so the right learning rate, stays the same whatever the batch size; the last, shorter batch is not over-weighted.")],
          [tx(t, "aiGd_c2", "shuffle every epoch"), tx(t, "aiGd_c2b", "a fixed order repeats the same batches, and with sorted data every update is pulled the same way in turn.")],
          [tx(t, "aiGd_c3", "compute the whole gradient, then update"), tx(t, "aiGd_c3b", "updating w before computing b's derivative would use a mix of old and new parameters: a different, unanalysed algorithm.")],
          [tx(t, "aiGd_c4", "η = 0.1 on standardised data"), tx(t, "aiGd_c4b", "the curvature is 2 in every direction, so the factor is 1 − 0.2 = 0.8 per epoch: 60 epochs shrink the gap by 0.8⁶⁰ ≈ 10⁻⁶.")],
        ]}
      />

      <H3>{tx(t, "aiGd_stopTitle", "When to stop")}</H3>
      <p>
        {tx(t, "aiGd_stopBody",
          "Three common rules, often combined: a fixed number of epochs; stop when the loss improves by less than a small tolerance over a few epochs; or stop when the gradient's length is nearly zero (the ground is flat). For models that can overfit, the best rule watches the validation loss and keeps the parameters from the epoch where it was lowest: early stopping, covered with regularisation.")}
      </p>

      <H2>{tx(t, "aiGd_checkTitle", "Checking a gradient")}</H2>
      <p>
        {tx(t, "aiGd_checkBody",
          "A wrong gradient does not crash anything: training just goes nowhere, or somewhere odd. Before trusting hand-written derivatives, compare them with numerical ones. The central difference from the Math track's Derivatives chapter needs only the loss:")}
      </p>
      <Equation label={tx(t, "aiGd_eqNum", "Central-difference estimate of one partial derivative")}
        where={[
          [r`h`, tx(t, "aiGd_wHstep", "a small step, about 10⁻⁵ for doubles: smaller amplifies rounding error, larger the curvature error")],
          [r`\mathbf{e}_j`, tx(t, "aiGd_wEj", "the vector with 1 in position j and 0 elsewhere: only parameter j moves")],
        ]}>
        {r`\frac{\partial L}{\partial \theta_j} \approx \frac{L(\boldsymbol\theta + h\,\mathbf{e}_j) - L(\boldsymbol\theta - h\,\mathbf{e}_j)}{2h}`}
      </Equation>
      <CodeBlock lang="cpp" filename="gradcheck.cpp" t={t}>{`// Compare mseGradient with finite differences at the current parameters.
bool gradCheck(LinearModel m, const Dataset& ds, double h = 1e-5) {    // m by value: we poke it
    std::vector<double> gw; double gb;
    mseGradient(m, ds, gw, gb);
    auto relErr = [](double a, double b) { return std::abs(a - b) / std::max({std::abs(a), std::abs(b), 1e-12}); };
    bool ok = true;
    for (std::size_t j = 0; j < m.w.size(); ++j) {
        const double keep = m.w[j];
        m.w[j] = keep + h; const double up   = mse(m, ds);
        m.w[j] = keep - h; const double down = mse(m, ds);
        m.w[j] = keep;
        const double num = (up - down) / (2 * h);
        std::printf("dL/dw%zu  analytic %.6f  numeric %.6f\\n", j, gw[j], num);
        ok = ok && relErr(gw[j], num) < 1e-6;                    // agree to ~6 significant digits
    }
    return ok;                                                   // (same check for b)
}`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "aiGd_checkTip", "At w = b = 0 on the raw deliveries this prints −128 in both columns, as computed by hand above. For the MSE, which is quadratic, the central difference is exact up to rounding; for neural networks it is only approximate, and the check becomes indispensable in the Backpropagation chapter.")}
      </Callout>

      <H2>{tx(t, "aiGd_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiGd_tMistake", "Mistake"), tx(t, "aiGd_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiGd_e1", "Learning rate too large"), tx(t, "aiGd_e1b", "the loss grows each epoch, then becomes inf or NaN. Divide η by 3 until it falls steadily.")],
          [tx(t, "aiGd_e2", "Learning rate too small"), tx(t, "aiGd_e2b", "the loss falls, but so slowly that training looks stuck. Try η three times larger; the best value is usually just below where it diverges.")],
          [tx(t, "aiGd_e3", "Unscaled features"), tx(t, "aiGd_e3b", "a long, thin valley: a safe η crawls along it. Standardise the features.")],
          [tx(t, "aiGd_e4", "+= instead of −="), tx(t, "aiGd_e4b", "gradient ascent: the loss climbs as fast as it can. The step is against the gradient.")],
          [tx(t, "aiGd_e5", "Updating parameters one by one while computing the gradient"), tx(t, "aiGd_e5b", "later derivatives are computed at already-moved parameters. Compute the full gradient first, then update.")],
          [tx(t, "aiGd_e6", "Not shuffling between epochs"), tx(t, "aiGd_e6b", "with sorted data the batches pull in turn one way and then the other; progress stalls.")],
          [tx(t, "aiGd_e7", "Judging training by the last batch's loss"), tx(t, "aiGd_e7b", "one batch is noisy. Report the loss over the whole training set, or a running average, and the validation loss.")],
        ]}
      />

      <KeyIdeas t={t} id="aiGd" items={[
        "Gradient descent repeats θ ← θ − η∇L: a step against the gradient, the direction of steepest descent.",
        "Near a minimum each step multiplies the distance along each curvature direction by 1 − ηλ; for the deliveries along w, 1 − 22η.",
        "η below 1/λ approaches from one side, between 1/λ and 2/λ zigzags but converges, above 2/λ diverges.",
        "The steepest curvature caps η at 2/λ_max; the flattest sets the speed; their ratio κ is roughly the number of steps needed.",
        "Standardising features makes the bowl rounder (κ = 1 for the deliveries), so the same η converges far faster.",
        "Mini-batch gradient descent estimates the gradient from a few shuffled examples per step; an epoch is one pass over the data.",
        "Verify hand-written gradients against central differences before trusting a training run.",
      ]} />
    </Article>
  );
}
