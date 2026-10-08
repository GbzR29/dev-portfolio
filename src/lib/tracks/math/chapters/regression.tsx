"use client";

// Probability & Statistics 9: correlation and linear regression — scatter
// plots (direction, form, strength); covariance and the correlation r as
// the cosine between centred data vectors, so −1 ≤ r ≤ 1; correlation is
// not causation, r only sees straight lines; the least-squares line from
// setting two partial derivatives to zero, b = Sxy/Sxx and a = ȳ − b x̄;
// a full hand calculation; residuals, SSE, R² = r²; interpreting and
// extrapolating; regression to the mean; fitting y = A·e^(kx) through logs;
// the normal equations in matrix form.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { RegressionFigure } from "@/components/lesson/figures/math/RegressionFigure";

const r = String.raw;

export function RegressionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mReg_intro",
          "Often we measure two things on each individual: hours studied and exam score, a person's height and their arm span, the temperature and the number of ice creams sold. The question is how they move together. This chapter measures the strength of a straight-line relationship with one number, the correlation, and finds the straight line that best predicts one variable from the other, the least-squares line. Its derivation uses the partial derivatives of the calculus section and the dot product of the linear algebra section, and the whole method is worked through by hand.")}
      </Lead>

      <Goals t={t} id="mReg" items={[
        "Measure how two variables move together with covariance and correlation.",
        "Fit the least-squares line.",
        "Judge the fit with residuals and R².",
        "Straighten curved data so a line fits it.",
      ]} />

      <H2>{tx(t, "mReg_scatterTitle", "Scatter plots")}</H2>
      <p>
        {tx(t, "mReg_scatterBody",
          "Draw each individual as a point (x, y). Read the cloud for four things. Direction: rising (positive association: larger x goes with larger y) or falling (negative). Form: roughly along a straight line, or curved. Strength: how tightly the points hug that form. Unusual points: individuals far from the pattern. By convention x is the explanatory variable, the one we use to predict, and y the response.")}
      </p>

      <H2>{tx(t, "mReg_corrTitle", "Covariance and correlation")}</H2>
      <p>
        {tx(t, "mReg_covBody",
          "Draw a vertical line at x̄ and a horizontal one at ȳ. They split the plane into four quadrants. For a point in the upper right or lower left, the deviations xᵢ − x̄ and yᵢ − ȳ have the same sign, so their product is positive; in the other two quadrants it is negative. Adding the products tells which quadrants dominate: this sum, Sxy, is positive for a rising cloud, negative for a falling one and near 0 when there is no trend. Divided by n − 1 it is the sample covariance, the data version of Cov(X, Y) from the expectation chapter.")}
      </p>
      <p>
        {tx(t, "mReg_corrWhy",
          "The covariance depends on the units: measure heights in centimetres instead of metres and it grows a hundredfold. To get a pure number, divide by the spreads of x and y. The result is the correlation coefficient.")}
      </p>
      <Equation label={tx(t, "mReg_eqR", "Correlation coefficient")}
        where={[
          [r`S_{xy} = \sum (x_i - \bar x)(y_i - \bar y)`, tx(t, "mReg_wSxy", "the sum of products of deviations")],
          [r`S_{xx},\ S_{yy}`, tx(t, "mReg_wSxx", "the sums of squared deviations of x and of y, the numerators of their variances")],
          [r`r`, tx(t, "mReg_wR", "the correlation: a number from −1 to 1 with no units")],
        ]}
        note={tx(t, "mReg_rNote", "Equivalently r = (1/(n − 1)) Σ zₓ z_y, the average product of the z-scores. Changing units (y → ay + b with a > 0) does not change r; swapping the roles of x and y does not change it either.")}>
        {r`r = \frac{S_{xy}}{\sqrt{S_{xx}\,S_{yy}}}`}
      </Equation>
      <p>
        {tx(t, "mReg_cosBody",
          "Why r stays between −1 and 1: put the x-deviations into one vector u = (x₁ − x̄, …, xₙ − x̄) and the y-deviations into v. Then Sxy = u · v, Sxx = |u|² and Syy = |v|², so r = u · v/(|u||v|), which the dot-product chapter showed is the cosine of the angle between u and v. A cosine lies in [−1, 1]. It equals ±1 only when v is a multiple of u, that is when every yᵢ − ȳ is the same multiple of xᵢ − x̄: all points exactly on a line. r = 0 means the two deviation vectors are perpendicular.")}
      </p>
      <LessonTable
        headers={["r", tx(t, "mReg_tLooks", "what the cloud looks like")]}
        rows={[
          ["1 / −1", tx(t, "mReg_tPerfect", "all points on a rising / falling line")],
          ["±0.9", tx(t, "mReg_tStrong", "a tight band around a line")],
          ["±0.5", tx(t, "mReg_tModerate", "a clear trend with a lot of scatter")],
          ["0", tx(t, "mReg_tNone", "no straight-line trend (there may still be a curved one)")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "mReg_causeWarn", "Correlation is not causation. Across the days of a year, ice-cream sales and drownings are positively correlated, but ice cream does not cause drowning: hot weather drives both. A hidden variable that affects both, like the temperature here, is called a confounder. Only a controlled experiment, in which x is assigned at random, can show that x causes y.")}
      </Callout>
      <p>
        {tx(t, "mReg_curveBody",
          "r only measures straight-line association. Points on the parabola y = x² for x = −2, −1, 0, 1, 2 have r = 0 exactly (the deviations of x are symmetric and the products cancel), although y is completely determined by x. Always look at the scatter plot before trusting r.")}
      </p>

      <H2>{tx(t, "mReg_lsTitle", "The least-squares line")}</H2>
      <p>
        {tx(t, "mReg_lsMotiv",
          "We want a line ŷ = a + bx that predicts y from x. For each point the residual eᵢ = yᵢ − ŷᵢ = yᵢ − (a + bxᵢ) is the vertical miss: how far the actual y is above (positive) or below (negative) the prediction. A good line makes the residuals small. Adding them is no use, since big positive and negative misses would cancel, so, as with the variance, we square them. The least-squares line is the one with the smallest sum of squared errors SSE = Σ eᵢ².")}
      </p>
      <p>
        {tx(t, "mReg_lsDeriv",
          "SSE is a function of the two unknowns a and b: S(a, b) = Σ (yᵢ − a − bxᵢ)². At its minimum both partial derivatives are zero. By the chain rule, ∂S/∂a = Σ 2(yᵢ − a − bxᵢ) · (−1) = 0, which after dividing by −2n says ȳ = a + b x̄: the line passes through the point of means (x̄, ȳ). And ∂S/∂b = Σ 2(yᵢ − a − bxᵢ) · (−xᵢ) = 0. Substitute a = ȳ − b x̄ into the second: Σ xᵢ((yᵢ − ȳ) − b(xᵢ − x̄)) = 0. Since Σ(yᵢ − ȳ) = 0 and Σ(xᵢ − x̄) = 0, the xᵢ in front may be replaced by xᵢ − x̄, which gives Sxy − b Sxx = 0. S is a sum of squares, a bowl-shaped surface, so this single critical point is the minimum.")}
      </p>
      <Equation label={tx(t, "mReg_eqLine", "Least-squares regression line")}
        where={[
          [r`b`, tx(t, "mReg_wB", "the slope: the predicted change in y when x increases by 1")],
          [r`a`, tx(t, "mReg_wA", "the intercept: the predicted y at x = 0")],
          [r`\hat y`, tx(t, "mReg_wYhat", "the predicted (fitted) value of y, read \"y hat\"")],
          [r`r\,\frac{s_y}{s_x}`, tx(t, "mReg_wBr", "the same slope written with the correlation and the two standard deviations")],
        ]}
        note={tx(t, "mReg_lineNote", "The slope has the sign of r. In z-scores the line is simply ẑ_y = r · zₓ.")}>
        {r`\hat y = a + b x \qquad b = \frac{S_{xy}}{S_{xx}} = r\,\frac{s_y}{s_x} \qquad a = \bar y - b\,\bar x`}
      </Equation>

      <RegressionFigure t={t} />

      <H3>{tx(t, "mReg_handTitle", "A complete calculation by hand")}</H3>
      <p>
        {tx(t, "mReg_handIntro",
          "Five students report hours of study x and exam score y: (1, 52), (2, 55), (3, 61), (4, 64), (5, 68). The means are x̄ = 15/5 = 3 and ȳ = 300/5 = 60.")}
      </p>
      <LessonTable
        headers={["x", "y", "x − x̄", "y − ȳ", "(x − x̄)(y − ȳ)", "(x − x̄)²", "(y − ȳ)²"]}
        rows={[
          ["1", "52", "−2", "−8", "16", "4", "64"],
          ["2", "55", "−1", "−5", "5", "1", "25"],
          ["3", "61", "0", "1", "0", "0", "1"],
          ["4", "64", "1", "4", "4", "1", "16"],
          ["5", "68", "2", "8", "16", "4", "64"],
          [tx(t, "mReg_tSum", "sum"), "", "0", "0", "Sxy = 41", "Sxx = 10", "Syy = 170"],
        ]}
      />
      <p>
        {tx(t, "mReg_handEnd",
          "b = 41/10 = 4.1 points per hour; a = 60 − 4.1 · 3 = 47.7. So ŷ = 47.7 + 4.1x. The correlation: r = 41/√(10 · 170) = 41/√1700 ≈ 41/41.23 ≈ 0.994, a very strong positive relationship. Prediction for 3.5 hours: 47.7 + 4.1 · 3.5 ≈ 62.1.")}
      </p>

      <H2>{tx(t, "mReg_residTitle", "Residuals and R²")}</H2>
      <LessonTable
        headers={["x", "1", "2", "3", "4", "5", tx(t, "mReg_tSum2", "sum")]}
        rows={[
          ["ŷ = 47.7 + 4.1x", "51.8", "55.9", "60.0", "64.1", "68.2", ""],
          ["e = y − ŷ", "0.2", "−0.9", "1.0", "−0.1", "−0.2", "0"],
          ["e²", "0.04", "0.81", "1.00", "0.01", "0.04", "SSE = 1.9"],
        ]}
      />
      <p>
        {tx(t, "mReg_residBody",
          "The residuals always add to 0 (that was the equation ∂S/∂a = 0). Plotted against x they should look like patternless scatter; a curve in the residual plot means a straight line was the wrong form. How much does the line explain? Without x, the best prediction of every y would be ȳ, with total squared error SST = Syy = 170. With the line, the error left over is SSE = 1.9. The fraction of the variation explained is R² = 1 − SSE/SST = 1 − 1.9/170 ≈ 0.989. For a straight-line fit R² equals r² (0.994² ≈ 0.989): the square of the correlation is the share of the variance of y accounted for by x.")}
      </p>
      <Equation label={tx(t, "mReg_eqR2", "Coefficient of determination")}
        where={[
          [r`\text{SST} = \sum (y_i - \bar y)^2`, tx(t, "mReg_wSst", "total variation of y around its mean")],
          [r`\text{SSE} = \sum (y_i - \hat y_i)^2`, tx(t, "mReg_wSse", "variation left unexplained by the line")],
        ]}>
        {r`R^2 = 1 - \frac{\text{SSE}}{\text{SST}} = r^2`}
      </Equation>

      <H2>{tx(t, "mReg_useTitle", "Using the line sensibly")}</H2>
      <p>
        {tx(t, "mReg_interpBody",
          "Interpret the slope in units: \"each extra hour of study goes with 4.1 more points, on average\". The intercept is the prediction at x = 0, which only means something if x = 0 lies within or near the data; here 47.7 would be the score with no study, which is plausible, but for a line relating adult height to weight the intercept at height 0 is meaningless. Predicting inside the range of the data is interpolation; predicting far outside it is extrapolation, and it is risky because nothing guarantees the pattern continues: 20 hours of study would predict 129.7 points on a test out of 100.")}
      </p>
      <H3>{tx(t, "mReg_meanTitle", "Regression to the mean")}</H3>
      <p>
        {tx(t, "mReg_meanBody",
          "In z-scores the line is ẑ_y = r zₓ, and |r| < 1 unless the relationship is perfect. So the prediction is always fewer standard deviations from the mean than the x it came from. Francis Galton noticed this in heights: with r ≈ 0.5 between parents and adult children, parents 2 standard deviations above average have children predicted to be only 1 standard deviation above. Nothing pulls the children back; it is simply that an extreme value is partly due to chance, and chance does not repeat. The same effect makes the worst performers in one test improve in the next even without any help, which can make useless treatments look effective.")}
      </p>
      <p>
        {tx(t, "mReg_swapBody",
          "The line for predicting y from x is not the line for predicting x from y. The first minimises vertical misses, the second horizontal ones; its slope in the x–y plane is Syy/Sxy instead of Sxy/Sxx. They coincide only when |r| = 1.")}
      </p>

      <H2>{tx(t, "mReg_curveFitTitle", "Curves that become lines")}</H2>
      <p>
        {tx(t, "mReg_expFitBody",
          "Some curves turn into straight lines after a change of variable, and then the same method applies. If y = A e^(kx), taking logarithms gives ln y = ln A + kx, a straight line in the variables x and ln y. Fit ln y against x by least squares, then read k as the slope and A = e^(intercept). Example: the points (0, 2), (1, 6), (2, 18) have ln y = 0.693, 1.792, 2.890, which rise by exactly 1.099 = ln 3 each step. So k = ln 3, A = e^0.693 = 2, and the curve is y = 2 · 3ˣ. In the same way a power law y = A xᵖ becomes ln y = ln A + p ln x, a line in ln x and ln y.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mReg_matrixTip", "In matrix form, stack the equations a + bxᵢ = yᵢ as Xβ = y, where X has a column of 1s and a column of the xᵢ, and β = (a, b). With more points than unknowns there is no exact solution. The least-squares β solves the normal equations XᵀXβ = Xᵀy, a 2 × 2 system that can be solved with the inverse from the linear algebra section; written out, its two rows are exactly the equations ∂S/∂a = 0 and ∂S/∂b = 0. Adding more columns to X fits several explanatory variables, or a parabola a + bx + cx², by the same recipe.")}
      </Callout>

      <H2>{tx(t, "mReg_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mReg_ex1", "1. Points (1, 3), (2, 5), (3, 4), (4, 8): x̄ = 2.5, ȳ = 5. Sxy = (−1.5)(−2) + (−0.5)(0) + (0.5)(−1) + (1.5)(3) = 3 + 0 − 0.5 + 4.5 = 7; Sxx = 5. b = 1.4, a = 5 − 3.5 = 1.5: ŷ = 1.5 + 1.4x.")}</p>
      <p>{tx(t, "mReg_ex2", "2. For the same points Syy = 4 + 0 + 1 + 9 = 14, so r = 7/√70 ≈ 0.837 and R² = 0.7: the line explains 70% of the variation in y.")}</p>
      <p>{tx(t, "mReg_ex3", "3. Heights of fathers and sons: x̄ = 175, sₓ = 7, ȳ = 177, s_y = 7, r = 0.5. b = 0.5 · 7/7 = 0.5, a = 177 − 0.5 · 175 = 89.5. A 189 cm father (z = 2) predicts 89.5 + 94.5 = 184 cm (z = 1).")}</p>
      <p>{tx(t, "mReg_ex4", "4. If r = −0.8, s_y = 10 and sₓ = 2, the slope is −0.8 · 10/2 = −4: each unit of x goes with 4 fewer units of y on average.")}</p>
      <p>{tx(t, "mReg_ex5", "5. A culture of cells: 100 at t = 0 and 400 at t = 2 hours, growing exponentially. ln y rises from 4.605 to 5.991, slope k = 0.693 per hour = ln 2: the number doubles every hour.")}</p>

      <H2>{tx(t, "mReg_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mReg_tWrong", "Wrong"), tx(t, "mReg_tRight", "Right"), tx(t, "mReg_tWhy", "Why")]}
        rows={[
          [tx(t, "mReg_m1w", "strong correlation, so x causes y"), tx(t, "mReg_m1r", "look for confounders"), tx(t, "mReg_m1", "a third variable can drive both")],
          [tx(t, "mReg_m2w", "r = 0, so x and y are unrelated"), tx(t, "mReg_m2r", "no straight-line relation"), tx(t, "mReg_m2", "a parabola can have r = 0")],
          [tx(t, "mReg_m3w", "minimise the sum of residuals"), tx(t, "mReg_m3r", "minimise the sum of squared residuals"), tx(t, "mReg_m3", "the plain sum is 0 for any line through (x̄, ȳ)")],
          [tx(t, "mReg_m4w", "b = Sxy/Syy"), "b = Sxy/Sxx", tx(t, "mReg_m4", "the slope for y on x divides by the spread of x")],
          [tx(t, "mReg_m5w", "predict far beyond the data"), tx(t, "mReg_m5r", "stay near the observed x range"), tx(t, "mReg_m5", "the pattern may bend or stop")],
          [tx(t, "mReg_m6w", "the x-on-y line by solving ŷ = a + bx for x"), tx(t, "mReg_m6r", "fit x on y separately"), tx(t, "mReg_m6", "it minimises horizontal, not vertical, misses")],
        ]}
      />

      <KeyIdeas t={t} id="mReg" items={[
        "A scatter plot shows direction, form, strength and unusual points; always draw it first.",
        "r = Sxy/√(SxxSyy) is the cosine between the centred data vectors, so −1 ≤ r ≤ 1; it measures only straight-line association.",
        "Correlation is not causation: confounders can drive both variables.",
        "The least-squares line minimises Σ(yᵢ − a − bxᵢ)²: b = Sxy/Sxx = r s_y/s_x and a = ȳ − b x̄; it passes through (x̄, ȳ).",
        "Residuals add to 0; R² = 1 − SSE/SST = r² is the share of the variation of y explained by x.",
        "Predictions regress to the mean: ẑ_y = r zₓ.",
        "Logarithms turn exponential and power laws into straight lines that least squares can fit.",
      ]} />
    </Article>
  );
}
