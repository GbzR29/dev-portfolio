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
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { RegressionFigure } from "@/components/lesson/figures/math/RegressionFigure";

const r = String.raw;

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

const num = (v: number, d = 2) => String(Number(v.toFixed(d)));
const signed = (v: number, d = 2) => (v < 0 ? `- ${num(-v, d)}` : `+ ${num(v, d)}`);

/** Fathers and sons: x̄ = 175, ȳ = 177, sₓ = s_y = 7 cm; the line, a prediction and its z-scores. */
function heightNumbers(v: Record<string, number>) {
  const { rr, x } = v, mx = 175, my = 177, s = 7;
  const b = rr * (s / s), a = my - b * mx, y = a + b * x, zx = (x - mx) / s, zy = (y - my) / s;
  return {
    tex: r`\begin{aligned} &b = ${num(rr)} \cdot \frac{7}{7} = ${num(b)} \qquad a = 177 - ${num(b)} \cdot 175 = ${num(a, 1)} \\[4pt] &\hat y = ${num(a, 1)} ${signed(b)} \cdot ${x} = \green{${num(y, 1)}\ \text{cm}} \\[4pt] &z_x = \frac{${x} - 175}{7} = ${num(zx)} \;\Rightarrow\; \hat z_y = ${num(rr)} \cdot ${num(zx)} = \amber{${num(zy)}} \end{aligned}`,
  };
}

/** An exponential through two measurements, by the straight line through their logarithms. */
function expNumbers(v: Record<string, number>) {
  const { y0, y1, t1 } = v, k = (Math.log(y1) - Math.log(y0)) / t1, dbl = Math.LN2 / k;
  return {
    tex: r`\begin{aligned} &\ln ${y0} = ${num(Math.log(y0), 3)} \qquad \ln ${y1} = ${num(Math.log(y1), 3)} \\[4pt] &k = \frac{${num(Math.log(y1), 3)} - ${num(Math.log(y0), 3)}}{${t1}} = \green{${num(k, 4)}} \\[4pt] &y = ${y0}\, e^{${num(k, 4)}\,t} \qquad \frac{\ln 2}{k} = \amber{${Number.isFinite(dbl) ? num(dbl, 2) : r`\infty`}} \end{aligned}`,
  };
}

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
        words={tx(t, "mReg_rWords", "Add up the products of the deviations, then divide by the spreads of x and y so that the units cancel. The result says how closely the points follow a straight line, and whether it rises or falls.")}
        note={tx(t, "mReg_rNote", "Equivalently r = (1/(n − 1)) Σ zₓ z_y, the average product of the z-scores. Changing units (y → ay + b with a > 0) does not change r; swapping the roles of x and y does not change it either.")}>
        {r`r = \frac{S_{xy}}{\sqrt{S_{xx}\,S_{yy}}}`}
      </Equation>
      <p>
        {tx(t, "mReg_cosIntro",
          "Why does r always stay between −1 and 1? Because it is a cosine in disguise. Treat the n deviations of x as one vector with n components, and the deviations of y as another.")}
      </p>
      <Derivation t={t} label={tx(t, "mReg_eqCosDer", "The correlation is a cosine")}
        steps={[
          { full: true, tex: r`\mathbf u = (x_1 - \bar x,\ \dots,\ x_n - \bar x) \qquad \mathbf v = (y_1 - \bar y,\ \dots,\ y_n - \bar y)`, why: tx(t, "mReg_cd1", "the centred data vectors: one component per individual") },
          { full: true, tex: r`\mathbf u \cdot \mathbf v = S_{xy} \qquad |\mathbf u|^2 = S_{xx} \qquad |\mathbf v|^2 = S_{yy}`, why: tx(t, "mReg_cd2", "the dot product multiplies matching components and adds them, which is exactly the sum of products of deviations; a vector dotted with itself gives the sum of squares") },
          { full: true, tex: r`r = \frac{\mathbf u \cdot \mathbf v}{|\mathbf u|\,|\mathbf v|} = \cos\theta`, why: tx(t, "mReg_cd3", "put these into the formula for r. The dot-product chapter showed u · v = |u||v| cos θ, where θ is the angle between the vectors") },
          { full: true, tex: r`\green{-1 \le r \le 1}`, why: tx(t, "mReg_cd4", "a cosine lies in [−1, 1]. It is ±1 only when v is a multiple of u, so every yᵢ − ȳ is the same multiple of xᵢ − x̄: all points exactly on a line. r = 0 means the two vectors are perpendicular") },
        ]} />
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
        {tx(t, "mReg_lsIntro",
          "SSE is a function of the two unknowns a and b. At its lowest point both partial derivatives are zero, as in the partial-derivatives chapter. Setting them to zero gives two equations, one for each unknown.")}
      </p>
      <Derivation t={t} label={tx(t, "mReg_eqLsDer", "The least-squares line from two partial derivatives")}
        steps={[
          { full: true, tex: r`S(a, b) = \sum (y_i - a - b x_i)^2`, why: tx(t, "mReg_ld1", "the sum of squared residuals, for any intercept a and slope b") },
          { full: true, tex: r`\frac{\partial S}{\partial a} = \sum 2\,(y_i - a - b x_i)\cdot(-1) = 0`, why: tx(t, "mReg_ld2", "chain rule: the derivative of the square is 2 times the bracket, times the derivative of the bracket with respect to a, which is −1") },
          { full: true, tex: r`\sum y_i - n\,a - b \sum x_i = 0 \;\Rightarrow\; \green{\bar y = a + b\,\bar x}`, why: tx(t, "mReg_ld3", "divide by −2 and split the sum (a is added n times), then divide by n: the line passes through the point of means (x̄, ȳ)") },
          { full: true, tex: r`\frac{\partial S}{\partial b} = \sum 2\,(y_i - a - b x_i)\cdot(-x_i) = 0`, why: tx(t, "mReg_ld4", "the same with respect to b: the bracket's derivative is now −xᵢ") },
          { full: true, tex: r`\sum x_i\big[(y_i - \bar y) - b\,(x_i - \bar x)\big] = 0`, why: tx(t, "mReg_ld5", "divide by −2 and put in a = ȳ − b x̄: then yᵢ − a − bxᵢ = (yᵢ − ȳ) − b(xᵢ − x̄)") },
          { full: true, tex: r`\sum (x_i - \bar x)\big[(y_i - \bar y) - b\,(x_i - \bar x)\big] = 0`, why: tx(t, "mReg_ld6", "subtract x̄ times the sum of the brackets, which is 0 − b · 0 = 0 because deviations add to 0. This changes nothing but turns xᵢ into xᵢ − x̄") },
          { full: true, tex: r`S_{xy} - b\,S_{xx} = 0 \;\Rightarrow\; \green{b = \frac{S_{xy}}{S_{xx}}}`, why: tx(t, "mReg_ld7", "multiply out the two sums. S is a sum of squares, a bowl-shaped surface, so this one flat point is its minimum") },
        ]} />
      <Equation label={tx(t, "mReg_eqLine", "Least-squares regression line")}
        where={[
          [r`b`, tx(t, "mReg_wB", "the slope: the predicted change in y when x increases by 1")],
          [r`a`, tx(t, "mReg_wA", "the intercept: the predicted y at x = 0")],
          [r`\hat y`, tx(t, "mReg_wYhat", "the predicted (fitted) value of y, read \"y hat\"")],
          [r`r\,\frac{s_y}{s_x}`, tx(t, "mReg_wBr", "the same slope written with the correlation and the two standard deviations")],
        ]}
        words={tx(t, "mReg_lineWords", "The slope is how x and y vary together divided by how x varies on its own. Then the line is placed so that it passes through the point of means.")}
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
        ]}
        words={tx(t, "mReg_r2Words", "Compare the error left by the line with the error of simply guessing the mean. The part that disappeared is the share explained by x, and for a straight line it is the correlation squared.")}>
        {r`R^2 = 1 - \frac{\text{SSE}}{\text{SST}} = r^2`}
      </Equation>
      <Derivation t={t} label={tx(t, "mReg_eqR2Der", "Why R² is the square of the correlation")}
        steps={[
          { full: true, tex: r`\text{SSE} = \sum \big[(y_i - \bar y) - b\,(x_i - \bar x)\big]^2`, why: tx(t, "mReg_rd1", "each residual, with a = ȳ − b x̄ put in, as in the derivation of the line") },
          { full: true, tex: r`= S_{yy} - 2b\,S_{xy} + b^2 S_{xx}`, why: tx(t, "mReg_rd2", "expand (P − bQ)² = P² − 2bPQ + b²Q² and add term by term. This is the parabola in b drawn in the figure's inset") },
          { full: true, tex: r`= S_{yy} - 2\,\frac{S_{xy}^2}{S_{xx}} + \frac{S_{xy}^2}{S_{xx}} = S_{yy} - \frac{S_{xy}^2}{S_{xx}}`, why: tx(t, "mReg_rd3", "put in b = Sxy/Sxx. For the students: 170 − 41²/10 = 170 − 168.1 = 1.9, the SSE of the table") },
          { full: true, tex: r`R^2 = 1 - \frac{\text{SSE}}{S_{yy}} = \frac{S_{xy}^2}{S_{xx}\,S_{yy}} = \green{r^2}`, why: tx(t, "mReg_rd4", "SST is Syy. Divide, and what is left is the square of r = Sxy/√(SxxSyy)") },
        ]} />

      <H2>{tx(t, "mReg_useTitle", "Using the line sensibly")}</H2>
      <p>
        {tx(t, "mReg_interpBody",
          "Interpret the slope in units: \"each extra hour of study goes with 4.1 more points, on average\". The intercept is the prediction at x = 0, which only means something if x = 0 lies within or near the data; here 47.7 would be the score with no study, which is plausible, but for a line relating adult height to weight the intercept at height 0 is meaningless. Predicting inside the range of the data is interpolation; predicting far outside it is extrapolation, and it is risky because nothing guarantees the pattern continues: 20 hours of study would predict 129.7 points on a test out of 100.")}
      </p>
      <H3>{tx(t, "mReg_meanTitle", "Regression to the mean")}</H3>
      <Derivation t={t} label={tx(t, "mReg_eqZDer", "The line in z-scores")}
        steps={[
          { full: true, tex: r`b = \frac{S_{xy}}{S_{xx}} = r\,\frac{\sqrt{S_{xx} S_{yy}}}{S_{xx}} = r\,\sqrt{\frac{S_{yy}}{S_{xx}}} = r\,\frac{s_y}{s_x}`, why: tx(t, "mReg_zd1", "Sxy = r√(SxxSyy) from the formula for r; and s_y/sₓ = √(Syy/(n − 1))/√(Sxx/(n − 1)), where the n − 1 cancel") },
          { full: true, tex: r`\hat y - \bar y = b\,(x - \bar x) = r\,\frac{s_y}{s_x}\,(x - \bar x)`, why: tx(t, "mReg_zd2", "the line through (x̄, ȳ) with slope b, written as distances from the means") },
          { full: true, tex: r`\frac{\hat y - \bar y}{s_y} = r\,\frac{x - \bar x}{s_x} \;\Rightarrow\; \green{\hat z_y = r\, z_x}`, why: tx(t, "mReg_zd3", "divide both sides by s_y: each side is now a distance from the mean measured in standard deviations, a z-score") },
        ]} />
      <p>
        {tx(t, "mReg_meanBody",
          "In z-scores the line is ẑ_y = r zₓ, and |r| < 1 unless the relationship is perfect. So the prediction is always fewer standard deviations from the mean than the x it came from. Francis Galton noticed this in heights: with r ≈ 0.5 between parents and adult children, parents 2 standard deviations above average have children predicted to be only 1 standard deviation above. Nothing pulls the children back; it is simply that an extreme value is partly due to chance, and chance does not repeat. The same effect makes the worst performers in one test improve in the next even without any help, which can make useless treatments look effective.")}
      </p>
      <LiveFormula label={tx(t, "mReg_liveHeight", "Try it: predicting a son's height")}
        tex={r`\hat y = a + b\,x \qquad b = r\,\frac{s_y}{s_x} \qquad \hat z_y = r\,z_x`}
        vars={[
          { id: "rr", label: "r", min: -1, max: 1, step: 0.05, value: 0.5, fmt: v => v.toFixed(2) },
          { id: "x", label: tx(t, "mReg_liveFather", "father (cm)"), min: 150, max: 200, step: 1, value: 189, fmt: v => String(v) },
        ]}
        compute={heightNumbers}
        note={tx(t, "mReg_liveHeightNote", "The data of worked example 3: x̄ = 175, ȳ = 177, both standard deviations 7 cm. The start is the 189 cm father, z = 2, whose son is predicted at z = 1. Set r = 1 and the son is as extreme as the father; set r = 0 and every son is predicted at the average, 177 cm.")} />
      <p>
        {tx(t, "mReg_swapBody",
          "The line for predicting y from x is not the line for predicting x from y. The first minimises vertical misses, the second horizontal ones; its slope in the x–y plane is Syy/Sxy instead of Sxy/Sxx. They coincide only when |r| = 1.")}
      </p>

      <H2>{tx(t, "mReg_curveFitTitle", "Curves that become lines")}</H2>
      <p>
        {tx(t, "mReg_expFitBody",
          "Some curves turn into straight lines after a change of variable, and then the same method applies. If y = A e^(kx), taking logarithms gives ln y = ln A + kx, a straight line in the variables x and ln y. Fit ln y against x by least squares, then read k as the slope and A = e^(intercept). Example: the points (0, 2), (1, 6), (2, 18) have ln y = 0.693, 1.792, 2.890, which rise by exactly 1.099 = ln 3 each step. So k = ln 3, A = e^0.693 = 2, and the curve is y = 2 · 3ˣ. In the same way a power law y = A xᵖ becomes ln y = ln A + p ln x, a line in ln x and ln y.")}
      </p>
      <LiveFormula label={tx(t, "mReg_liveExp", "Try it: an exponential through two measurements")}
        tex={r`\ln y = \ln A + k\,t \qquad k = \frac{\ln y_1 - \ln y_0}{t_1}`}
        vars={[
          { id: "y0", label: <>y<sub>0</sub></>, min: 10, max: 500, step: 10, value: 100, fmt: v => String(v) },
          { id: "y1", label: <>y<sub>1</sub></>, min: 10, max: 2000, step: 10, value: 400, fmt: v => String(v) },
          { id: "t1", label: <>t<sub>1</sub></>, min: 0.5, max: 10, step: 0.5, value: 2, fmt: v => String(v) },
        ]}
        compute={expNumbers}
        note={tx(t, "mReg_liveExpNote", "The start is worked example 5: 100 cells at t = 0 and 400 at t = 2 hours give k = ln 2 per hour, so ln 2/k = 1 hour is the doubling time. With only two points the line through the logarithms is exact; with more, least squares fits it. Make y₁ smaller than y₀ and k turns negative: then ln 2/|k| is the half-life.")} />
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
