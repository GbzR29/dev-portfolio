"use client";

// Foundations 3: linear regression — the model with one and with d features
// (dot product, the bias trick); the MSE and why the square; the loss
// surface in parameter space (LossSurface figure); the exact minimum by
// setting the partial derivatives to zero, worked for the deliveries; two
// features worked by hand for the apartments (and what a weight means);
// the gradient in vector form; C++; R² and RMSE; what "linear" allows
// (feature engineering); mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { LossSurfaceFigure } from "@/components/lesson/figures/ai/LossSurfaceFigure";

const r = String.raw;

export function LinearRegressionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "aiLin_intro",
          "Linear regression is the simplest model that learns: the prediction is a weighted sum of the features plus a constant. It is worth studying slowly, because everything later is built on it. A neuron in a neural network computes exactly this weighted sum before bending it; the loss, its gradient and the training loop here are the same ones used for networks with millions of weights. This chapter defines the model, looks at its loss as a surface, finds its lowest point exactly, and computes the gradient that the next chapter follows downhill.")}
      </Lead>

      <Goals t={t} id="aiLin" items={[
        "Make a prediction with a weighted sum of features.",
        "Compute the mean squared error and explain why the errors are squared.",
        "Find the best line exactly, and compute the gradient for any number of features.",
        "Judge how good a fit is with R².",
      ]} />

      <H2>{tx(t, "aiLin_modelTitle", "The model")}</H2>
      <p>
        {tx(t, "aiLin_modelBody",
          "With one feature, the model is the line from the first chapter. With d features, each gets its own weight, and the prediction is the dot product of the weight vector with the feature vector, plus the bias:")}
      </p>
      <Equation label={tx(t, "aiLin_eqModel", "Linear regression with d features")}
        where={[
          [r`\mathbf{x} = (x_1, \dots, x_d)`, tx(t, "aiLin_wX", "the features of one example")],
          [r`\mathbf{w} = (w_1, \dots, w_d)`, tx(t, "aiLin_wW", "the weights: how much the prediction changes per unit of each feature, the others held fixed")],
          [r`b`, tx(t, "aiLin_wB", "the bias (intercept): the prediction when every feature is 0")],
          [r`\mathbf{w}\cdot\mathbf{x}`, tx(t, "aiLin_wDot", "the dot product w₁x₁ + … + w_d x_d (Math track, Dot Product chapter)")],
        ]}>
        {r`\hat y = w_1 x_1 + w_2 x_2 + \dots + w_d x_d + b = \mathbf{w}\cdot\mathbf{x} + b`}
      </Equation>
      <p>
        {tx(t, "aiLin_biasTrick",
          "A common trick adds a constant feature x₀ = 1 to every example; its weight w₀ then plays the role of b, and the model becomes a single dot product. This track keeps b separate in code, which is clearer, but the formulas with and without the trick are the same.")}
      </p>

      <H2>{tx(t, "aiLin_lossTitle", "The loss, and why the square")}</H2>
      <Equation label={tx(t, "aiLin_eqLoss", "Mean squared error over the training set")}
        where={[
          [r`n`, tx(t, "aiLin_wN", "the number of training examples")],
          [r`e_i = \hat y_i - y_i`, tx(t, "aiLin_wE", "the error on example i")],
          [r`L(\mathbf{w}, b)`, tx(t, "aiLin_wL", "the loss, a function of the parameters: the data are fixed numbers during training")],
        ]}>
        {r`L(\mathbf{w}, b) = \frac{1}{n}\sum_{i=1}^{n} e_i^{\,2} = \frac{1}{n}\sum_{i=1}^{n}\left(\mathbf{w}\cdot\mathbf{x}_i + b - y_i\right)^2`}
      </Equation>
      <LessonTable
        headers={[tx(t, "aiLin_tReason", "Reason for the square"), tx(t, "aiLin_tMeaning", "What it means")]}
        rows={[
          [tx(t, "aiLin_q1", "signs do not cancel"), tx(t, "aiLin_q1b", "errors of +2 and −2 add up to 8, not 0.")],
          [tx(t, "aiLin_q2", "big errors weigh more"), tx(t, "aiLin_q2b", "one error of 4 costs 16, as much as sixteen errors of 1. Good when large mistakes are much worse than small ones; bad when the data has a few wild outliers, which then pull the line towards them.")],
          [tx(t, "aiLin_q3", "smooth"), tx(t, "aiLin_q3b", "e² has a derivative everywhere (2e); the absolute error |e| has a corner at 0. Gradient descent needs derivatives.")],
          [tx(t, "aiLin_q4", "a single minimum"), tx(t, "aiLin_q4b", "for a linear model the MSE is a bowl (a convex quadratic): one lowest point, no traps.")],
          [tx(t, "aiLin_q5", "a statistical meaning"), tx(t, "aiLin_q5b", "if the real values scatter around the line with normally distributed noise, minimising the MSE gives the most likely line (maximum likelihood).")],
        ]}
      />
      <p>
        {tx(t, "aiLin_lossUnits",
          "The MSE is in squared units (minutes²), which is hard to read. Its square root, the root mean squared error (RMSE), is back in minutes: for the best delivery line, √0.3 = 0.55 minutes, the typical size of an error.")}
      </p>

      <H2>{tx(t, "aiLin_surfTitle", "The loss as a surface")}</H2>
      <p>
        {tx(t, "aiLin_surfBody",
          "Training does not move the data; it moves the parameters. So picture the loss as a function of the parameters: for the delivery line, a height over the (w, b) plane. Each point of that plane is a whole line through the data, and its height is how badly that line fits. Expanding the square shows the shape: L is a quadratic polynomial in w and b with positive squared terms, a bowl.")}
      </p>
      <LossSurfaceFigure t={t} />

      <H2>{tx(t, "aiLin_exactTitle", "The lowest point, exactly")}</H2>
      <p>
        {tx(t, "aiLin_exactBody",
          "At the bottom of a smooth bowl the surface is flat in every direction: both partial derivatives are zero. Differentiating each squared error with the chain rule (the derivative of e² is 2e times the derivative of e, and ∂e/∂w = x, ∂e/∂b = 1) gives the gradient:")}
      </p>
      <Equation label={tx(t, "aiLin_eqGrad1", "Partial derivatives of the MSE, one feature")}
        where={[
          [r`e_i`, tx(t, "aiLin_wEi", "the error w xᵢ + b − yᵢ at the current parameters")],
          [r`\partial L / \partial w`, tx(t, "aiLin_wDw", "how fast the loss changes when w grows a little, b fixed")],
          [r`\partial L / \partial b`, tx(t, "aiLin_wDb", "the same for b: twice the mean error")],
        ]}>
        {r`\frac{\partial L}{\partial w} = \frac{2}{n}\sum_{i=1}^{n} e_i\,x_i, \qquad \frac{\partial L}{\partial b} = \frac{2}{n}\sum_{i=1}^{n} e_i`}
      </Equation>
      <p>
        {tx(t, "aiLin_solveBody",
          "Setting ∂L/∂b = 0 says the mean error is zero, which gives b = ȳ − w x̄: the best line passes through the point of means (x̄, ȳ). Substituting that into ∂L/∂w = 0 and simplifying gives the slope:")}
      </p>
      <Equation label={tx(t, "aiLin_eqClosed", "Least-squares line, one feature")}
        where={[
          [r`\bar x,\ \bar y`, tx(t, "aiLin_wMeans", "the means of the features and of the labels")],
          [r`S_{xy}`, tx(t, "aiLin_wSxy", "the sum of products of deviations from the means: how x and y move together")],
          [r`S_{xx}`, tx(t, "aiLin_wSxx", "the sum of squared deviations of x: how much x varies")],
        ]}>
        {r`w = \frac{S_{xy}}{S_{xx}} = \frac{\sum (x_i - \bar x)(y_i - \bar y)}{\sum (x_i - \bar x)^2}, \qquad b = \bar y - w\,\bar x`}
      </Equation>
      <H3>{tx(t, "aiLin_workedTitle", "Worked example: the delivery line")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiLin_w1", "Means: x̄ = (1 + 2 + 3 + 4 + 5) / 5 = 3 km; ȳ = (12 + 15 + 20 + 22 + 26) / 5 = 95 / 5 = 19 min.")}</li>
        <li>{tx(t, "aiLin_w2", "Deviations: x − x̄ = −2, −1, 0, 1, 2 and y − ȳ = −7, −4, 1, 3, 7.")}</li>
        <li>{tx(t, "aiLin_w3", "S_xy = (−2)(−7) + (−1)(−4) + 0·1 + 1·3 + 2·7 = 14 + 4 + 0 + 3 + 14 = 35. S_xx = 4 + 1 + 0 + 1 + 4 = 10.")}</li>
        <li>{tx(t, "aiLin_w4", "w = 35 / 10 = 3.5 minutes per km; b = 19 − 3.5 · 3 = 8.5 minutes. The line the first chapter called \"best\".")}</li>
        <li>{tx(t, "aiLin_w5", "Check: at (w, b) = (3.5, 8.5) the errors are 0, 0.5, −1, 0.5, 0. They sum to 0 (so ∂L/∂b = 0), and Σ eᵢxᵢ = 0 + 1 − 3 + 2 + 0 = 0 (so ∂L/∂w = 0).")}</li>
      </ol>

      <H3>{tx(t, "aiLin_twoTitle", "Two features: what a weight means")}</H3>
      <p>
        {tx(t, "aiLin_twoBody",
          "The same conditions with two features give two equations in two unknowns (the normal equations; the Math track's Regression chapter writes them for any d as XᵀX w = Xᵀy). For the apartments, with area a and rooms r, working with deviations from the means (ā = 74, r̄ = 2.5, price mean 319.5):")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "aiLin_t1", "Sums of products of deviations: S_aa = 6496, S_rr = 10.5, S_ar = 238, S_ap = 22790, S_rp = 842.5.")}</li>
        <li>{tx(t, "aiLin_t2", "Equations: 6496 w_a + 238 w_r = 22790 and 238 w_a + 10.5 w_r = 842.5.")}</li>
        <li>{tx(t, "aiLin_t3", "Determinant 6496 · 10.5 − 238² = 11564. w_a = (22790 · 10.5 − 238 · 842.5) / 11564 = 3.35; w_r = (6496 · 842.5 − 238 · 22790) / 11564 = 4.23.")}</li>
        <li>{tx(t, "aiLin_t4", "b = 319.5 − 3.35 · 74 − 4.23 · 2.5 = 60.8. The model: price ≈ 3.35 · area + 4.23 · rooms + 60.8 (thousands).")}</li>
        <li>{tx(t, "aiLin_t5", "Prediction for 70 m² and 1 room: 3.35 · 70 + 4.23 + 60.8 ≈ 300 thousand.")}</li>
      </ol>
      <p>
        {tx(t, "aiLin_twoMeaning",
          "Read the weights carefully. 4.23 is the price of one more room at the same area: splitting the same floor space into more rooms adds little. Fitting price on rooms alone gives S_rp / S_rr = 80.2 per room, because more rooms usually come with more area, and that single weight absorbs the area's effect. A weight always means \"per unit of this feature, the others held fixed\", so it depends on which other features are in the model.")}
      </p>

      <H2>{tx(t, "aiLin_vecTitle", "The gradient for any number of features")}</H2>
      <p>
        {tx(t, "aiLin_vecBody",
          "The one-feature derivatives generalise directly: each weight's partial derivative is twice the mean of error × its feature. Collected into a vector, with X the n × d matrix and e the vector of errors:")}
      </p>
      <Equation label={tx(t, "aiLin_eqGradVec", "Gradient of the MSE, d features")}
        where={[
          [r`\mathbf{e} = \mathbf{X}\mathbf{w} + b - \mathbf{y}`, tx(t, "aiLin_wEvec", "the n errors at the current parameters")],
          [r`\mathbf{X}^{\mathsf T}\mathbf{e}`, tx(t, "aiLin_wXte", "for each feature j, the sum over examples of eᵢ xᵢⱼ")],
        ]}>
        {r`\nabla_{\mathbf{w}} L = \frac{2}{n}\,\mathbf{X}^{\mathsf T}\mathbf{e}, \qquad \frac{\partial L}{\partial b} = \frac{2}{n}\sum_{i} e_i`}
      </Equation>
      <p>
        {tx(t, "aiLin_whyNotExact",
          "If an exact formula exists, why will the next chapter walk downhill instead? Solving the normal equations costs about d³ operations and needs XᵀX to be invertible, which fails when features repeat each other. And the moment the model stops being linear in its parameters (logistic regression, every neural network), there is no formula at all. The gradient, on the other hand, can always be computed.")}
      </p>

      <H2>{tx(t, "aiLin_codeTitle", "In C++")}</H2>
      <CodeBlock lang="cpp" filename="linear.h" t={t}>{`#include "dataset.h"

struct LinearModel {
    std::vector<double> w;             // one weight per feature
    double b = 0.0;                    // bias

    explicit LinearModel(std::size_t d) : w(d, 0.0) {}

    double predict(const double* x) const {                // x points at d features
        double s = b;
        for (std::size_t j = 0; j < w.size(); ++j) s += w[j] * x[j];   // w · x + b
        return s;
    }
};

double mse(const LinearModel& m, const Dataset& ds) {
    double sum = 0.0;
    for (std::size_t i = 0; i < ds.n; ++i) {
        const double e = m.predict(ds.row(i)) - ds.y[i];
        sum += e * e;
    }
    return sum / ds.n;
}

// Gradient of the MSE: gw[j] = (2/n) Σ e_i x_ij,  gb = (2/n) Σ e_i
void mseGradient(const LinearModel& m, const Dataset& ds, std::vector<double>& gw, double& gb) {
    gw.assign(m.w.size(), 0.0);
    gb = 0.0;
    for (std::size_t i = 0; i < ds.n; ++i) {
        const double* x = ds.row(i);
        const double e = m.predict(x) - ds.y[i];
        for (std::size_t j = 0; j < m.w.size(); ++j) gw[j] += e * x[j];
        gb += e;
    }
    for (double& g : gw) g *= 2.0 / ds.n;
    gb *= 2.0 / ds.n;
}

// The exact answer for one feature, to check gradient descent against
LinearModel fitOneFeature(const Dataset& ds) {
    double mx = 0, my = 0;
    for (std::size_t i = 0; i < ds.n; ++i) { mx += ds.at(i, 0) / ds.n; my += ds.y[i] / ds.n; }
    double sxy = 0, sxx = 0;
    for (std::size_t i = 0; i < ds.n; ++i) {
        sxy += (ds.at(i, 0) - mx) * (ds.y[i] - my);
        sxx += (ds.at(i, 0) - mx) * (ds.at(i, 0) - mx);
    }
    LinearModel m(1);
    m.w[0] = sxy / sxx;
    m.b = my - m.w[0] * mx;
    return m;                          // deliveries: w = 3.5, b = 8.5
}`}</CodeBlock>

      <H2>{tx(t, "aiLin_evalTitle", "How good is the fit? R²")}</H2>
      <Equation label={tx(t, "aiLin_eqR2", "Coefficient of determination")}
        where={[
          [r`SS_{\text{res}} = \sum e_i^{\,2}`, tx(t, "aiLin_wSsres", "the squared errors the model leaves")],
          [r`SS_{\text{tot}} = \sum (y_i - \bar y)^2`, tx(t, "aiLin_wSstot", "the squared errors of the dumbest model, always predicting the mean")],
        ]}>
        {r`R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}`}
      </Equation>
      <p>
        {tx(t, "aiLin_r2Ex",
          "For the deliveries SS_res = 1.5 and SS_tot = 49 + 16 + 1 + 9 + 49 = 124, so R² = 1 − 1.5 / 124 = 0.988: the line explains 98.8% of the variation in delivery times. R² = 0 means no better than the mean; on test data it can even be negative. Report it on test data, next to the RMSE, which says how big a typical error is in real units.")}
      </p>

      <H2>{tx(t, "aiLin_linearTitle", "What \"linear\" allows")}</H2>
      <p>
        {tx(t, "aiLin_linearBody",
          "\"Linear\" means linear in the parameters, not in the input. Add the feature x² to the deliveries and ŷ = w₁x + w₂x² + b is a parabola, still fitted by exactly the same formulas and code, because it is still a weighted sum. Products of features (area × has-garden), logarithms, one-hot categories: all are features, and the model stays linear. This is feature engineering, and it is powerful, but a person has to guess the right features. Neural networks, in the third section, learn their own.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "aiLin_overfitNote", "Adding features always lowers the training loss, never raises it: with 5 deliveries and features x, x², x³, x⁴, a polynomial passes through all five points exactly, with a training MSE of 0 and absurd predictions between and beyond them. That is overfitting, and it is why the loss must be judged on data the model has not seen.")}
      </Callout>

      <H2>{tx(t, "aiLin_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "aiLin_tMistake", "Mistake"), tx(t, "aiLin_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "aiLin_e1", "Reading a weight as the effect of a feature on its own"), tx(t, "aiLin_e1b", "it is the effect with the other features held fixed; add or remove a correlated feature and it changes (80.2 versus 4.23 per room).")],
          [tx(t, "aiLin_e2", "Comparing weights of unscaled features"), tx(t, "aiLin_e2b", "a weight per m² and a weight per room are in different units; standardise first if you want to compare importance.")],
          [tx(t, "aiLin_e3", "Summing instead of averaging the squared errors"), tx(t, "aiLin_e3b", "the minimum is the same, but the gradient grows with n, and a learning rate that worked on 100 examples explodes on 10,000. Use the mean.")],
          [tx(t, "aiLin_e4", "Trusting predictions far outside the data"), tx(t, "aiLin_e4b", "the line says 43.5 minutes for 10 km, but nothing in the data says the trend holds there. Extrapolation is a guess.")],
          [tx(t, "aiLin_e5", "Judging the fit by training R²"), tx(t, "aiLin_e5b", "it only goes up as features are added. Use validation or test data.")],
          [tx(t, "aiLin_e6", "Forgetting the bias"), tx(t, "aiLin_e6b", "the line is forced through the origin: 0 km would take 0 minutes, and every prediction shifts. Keep b (or the constant feature).")],
        ]}
      />

      <KeyIdeas t={t} id="aiLin" items={[
        "Linear regression predicts ŷ = w · x + b: a weighted sum of the features plus a bias.",
        "The MSE averages squared errors; it is smooth, penalises large errors most and, for this model, is a bowl with one minimum.",
        "The gradient is ∂L/∂w = (2/n) Σ eᵢxᵢ and ∂L/∂b = (2/n) Σ eᵢ, or ∇L = (2/n) Xᵀe for many features.",
        "With one feature the minimum is w = S_xy / S_xx, b = ȳ − w x̄; for the deliveries, 3.5 min/km and 8.5 min.",
        "A weight is the effect of its feature with the others held fixed, so it depends on which features are in the model.",
        "R² = 1 − SS_res / SS_tot compares the model with always predicting the mean; RMSE gives the typical error in real units.",
        "The model is linear in its parameters, so engineered features (x², products, one-hot) keep it linear, and can also make it overfit.",
      ]} />
    </Article>
  );
}
