"use client";

// Trigonometry 5: trigonometric equations — the reverse question (value →
// every angle), the inverse functions and their principal ranges, the general
// solutions of sin x = c, cos x = c and tan x = c, a recipe for picking the
// solutions in an interval, equations with 2x inside, equations solved with
// identities (quadratics in sin x, mixed sin/cos, a sin x + b cos x = c), and
// trigonometric inequalities read off the circle.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TrigEquationFigure } from "@/components/lesson/figures/math/TrigEquationFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formulas: the families of sin x = c, and R sin(x + φ) ────────────────

const DEG = 180 / Math.PI;
const num = (v: number) => String(Math.round(v * 1000) / 1000).replace("-", "−");
const d1 = (v: number) => `${+v.toFixed(1)}`.replace("-", "−");

function familyNumbers(v: Record<string, number>) {
  const { c, k } = v;
  const a = Math.asin(c) * DEG;
  const x1 = a + 360 * k, x2 = 180 - a + 360 * k;
  return {
    tex: r`\alpha = \arcsin(${num(c)}) \approx ${d1(a)}^\circ \qquad x \approx \green{${d1(x1)}^\circ} \quad\text{or}\quad x \approx \green{${d1(x2)}^\circ}`,
  };
}

function harmonicNumbers(v: Record<string, number>) {
  const { a, b } = v;
  const R = Math.hypot(a, b), phi = Math.atan2(b, a) * DEG;
  return {
    tex: r`R = \sqrt{${num(a)}^2 + ${num(b)}^2} \approx \green{${num(R)}} \qquad \cos\varphi = \tfrac{${num(a)}}{R},\ \sin\varphi = \tfrac{${num(b)}}{R} \;\Rightarrow\; \varphi \approx \green{${d1(phi)}^\circ}`,
  };
}

export function TrigEquationsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mTeq_intro",
          "So far every trigonometry question went one way: given an angle, find its sine. A trigonometric equation asks the reverse: given the value, find every angle that has it. That question has more than one answer, and usually infinitely many, because sine and cosine repeat every turn and take each value twice in a turn. This chapter shows how to find all of them without missing any, how to use the identities of the previous chapter to bring harder equations down to simple ones, and how to solve inequalities like sin x > 1/2 by looking at the unit circle.")}
      </Lead>

      <Goals t={t} id="mTeq" items={[
        "Use arcsin, arccos and arctan, and know which angle each one returns.",
        "Write the general solution of sin x = c, cos x = c and tan x = c.",
        "List every solution in an interval, including equations with 2x or x/2 inside.",
        "Solve harder equations with identities, and solve trigonometric inequalities.",
      ]} />

      <H2>{tx(t, "mTeq_manyTitle", "One value, many angles")}</H2>
      <p>
        {tx(t, "mTeq_manyBody",
          "Take sin x = 1/2. On the unit circle, sin x is the height of the point at angle x. So the question is: which points of the circle are at height 1/2? Draw the horizontal line y = 1/2. It cuts the circle in two points. One is at 30°, from the 30-60-90 triangle. The other is its mirror image in the y-axis, at 180° − 30° = 150°: mirroring keeps the height, as the identity sin(180° − θ) = sin θ says. Then going round once more, 360° later, lands on the same two points again. So the solutions are 30°, 150°, 390°, 510°, … and also −210°, −330°, …: two families, each repeating every 360°.")}
      </p>
      <p>
        {tx(t, "mTeq_manyBody2",
          "On the graph of sin x, the same thing looks like the horizontal line y = 1/2 crossing the wave again and again: twice per period. Both pictures appear in the figure below; keep them side by side in your head, because the circle is the easiest place to find the angles and the graph is the easiest place to see how they repeat.")}
      </p>

      <H2>{tx(t, "mTeq_invTitle", "The inverse functions give one answer each")}</H2>
      <p>
        {tx(t, "mTeq_invBody",
          "A function must return one output for each input. Sine is not one-to-one (many angles have the same sine), so its inverse has to choose. The convention is to keep a stretch of angles on which sine takes every value from −1 to 1 exactly once, and to return angles only from there. That stretch is the principal range. For sine it is −90° to 90°: the right half of the circle, where the height goes once from the bottom to the top. For cosine it is 0° to 180°, the upper half, where the x goes once from right to left. For tangent it is strictly between −90° and 90°, because tan is undefined at ±90°.")}
      </p>
      <Equation label={tx(t, "mTeq_eqRanges", "The inverse functions and their ranges")}
        where={[
          [r`\arcsin c`, tx(t, "mTeq_wAsin", "the angle in [−90°, 90°] whose sine is c; defined only for −1 ≤ c ≤ 1; written sin⁻¹ on calculators")],
          [r`\arccos c`, tx(t, "mTeq_wAcos", "the angle in [0°, 180°] whose cosine is c; defined only for −1 ≤ c ≤ 1")],
          [r`\arctan c`, tx(t, "mTeq_wAtan", "the angle in (−90°, 90°) whose tangent is c; defined for every real c")],
        ]}
        note={tx(t, "mTeq_rangesNote", "In radians the ranges are [−π/2, π/2], [0, π] and (−π/2, π/2). sin⁻¹ means the inverse function, not 1/sin: 1/sin x has its own name, csc x.")}
        words={tx(t, "mTeq_rangesWords", "Each inverse answers with the one angle from its own half of the circle: arcsin and arctan from the right half, arccos from the upper half.")}>
        {r`\sin(\arcsin c) = c \qquad \cos(\arccos c) = c \qquad \tan(\arctan c) = c`}
      </Equation>
      <Callout type="warn" t={t}>
        {tx(t, "mTeq_invWarn", "The other order is a trap: arcsin(sin x) = x only when x is already in [−90°, 90°]. arcsin(sin 150°) = arcsin(1/2) = 30°, not 150°. The inverse cannot know which of the angles you started from, so it always answers with the one in its range.")}
      </Callout>

      <H2>{tx(t, "mTeq_genTitle", "The general solution")}</H2>
      <p>
        {tx(t, "mTeq_genBody",
          "The general solution is a formula that lists every solution, with a whole number k counting the extra turns. Each one is built the same way: the calculator's angle α, the second angle in the same turn from a symmetry of the circle, and then the period added k times. Here k is any integer: 0, ±1, ±2, …")}
      </p>
      <Derivation t={t} label={tx(t, "mTeq_eqSinDer", "Every solution of sin x = c")}
        steps={[
          { full: true, tex: r`\alpha = \arcsin c, \qquad -1 \le c \le 1`, why: tx(t, "mTeq_d1", "one solution, in [−90°, 90°]; if |c| > 1 there is none, because no point of the unit circle is higher than 1") },
          { full: true, tex: r`\sin(180^\circ - \alpha) = \sin\alpha = c`, why: tx(t, "mTeq_d2", "mirroring in the y-axis keeps the height: a second solution in the same turn") },
          { full: true, tex: r`\sin(\theta + 360^\circ k) = \sin\theta`, why: tx(t, "mTeq_d3", "whole turns change nothing: sine has period 360°") },
          { full: true, tex: r`\green{x = \alpha + 360^\circ k \quad\text{or}\quad x = 180^\circ - \alpha + 360^\circ k}`, why: tx(t, "mTeq_d4", "these are all: a horizontal line meets the circle in at most two points, so one turn has no other solution") },
        ]} />
      <p>
        {tx(t, "mTeq_cosTanBody",
          "Cosine is the x coordinate, so the line is vertical: x = c meets the circle at α and at its mirror image in the x-axis, −α. Tangent is the slope of the radius; the line through the centre with that slope meets the circle at two opposite points, 180° apart, so tangent repeats every 180° and has a single family.")}
      </p>
      <Equation label={tx(t, "mTeq_eqGeneral", "General solutions")}
        where={[
          [r`k`, tx(t, "mTeq_wK", "any integer; each value of k is one more (or one fewer) turn")],
          [r`\alpha`, tx(t, "mTeq_wAlpha", "arcsin c, arccos c or arctan c: the principal angle")],
          [r`360^\circ k`, tx(t, "mTeq_wPeriod", "the period of sine and cosine, 2πk in radians; for tangent the period is 180° = π")],
        ]}
        note={tx(t, "mTeq_genNote", "Special values give one family instead of two: sin x = 1 only at 90° + 360°k, sin x = 0 at 180°k, cos x = −1 only at 180° + 360°k.")}
        words={tx(t, "mTeq_genWords", "Take the calculator's angle, add the mirror angle that has the same sine (or cosine), then add any number of whole turns.")}>
        {r`\begin{aligned} \sin x = c:&\quad x = \alpha + 360^\circ k \ \text{ or } \ x = 180^\circ - \alpha + 360^\circ k \\ \cos x = c:&\quad x = \pm\alpha + 360^\circ k \\ \tan x = c:&\quad x = \alpha + 180^\circ k \end{aligned}`}
      </Equation>
      <LiveFormula label={tx(t, "mTeq_liveFam", "Try it: the two families of sin x = c")}
        tex={r`x = \arcsin c + 360^\circ k \quad\text{or}\quad x = 180^\circ - \arcsin c + 360^\circ k`}
        vars={[
          { id: "c", label: "c", min: -1, max: 1, step: 0.05, value: 0.5, fmt: num },
          { id: "k", label: "k", min: -2, max: 2, step: 1, value: 0, fmt: v => String(v).replace("-", "−") },
        ]}
        compute={familyNumbers}
        note={tx(t, "mTeq_liveFamNote", "k = 0 gives the two solutions of the first turn; k = 1 adds 360° to both. Try c = −0.5: α is negative (−30°), and the second family gives 210°. At c = 1 both families land on 90°.")} />

      <TrigEquationFigure t={t} />

      <H2>{tx(t, "mTeq_recipeTitle", "Solving in an interval, step by step")}</H2>
      <p>
        {tx(t, "mTeq_recipeBody",
          "Most problems ask for the solutions in a given interval, often 0° ≤ x < 360°. The recipe has four steps. 1. Isolate the trigonometric function, as you would isolate x in a linear equation. 2. Find α with the inverse function (or from the special triangles). 3. Write both families. 4. Try k = 0, 1, −1, … and keep the values that fall in the interval.")}
      </p>
      <Derivation t={t} label={tx(t, "mTeq_eqEx1", "Solve 2 sin x + 1 = 0 with 0° ≤ x < 360°")}
        steps={[
          { tex: r`\sin x = -\tfrac12`, why: tx(t, "mTeq_e1", "subtract 1, divide by 2") },
          { tex: r`\alpha = \arcsin(-\tfrac12) = -30^\circ`, why: tx(t, "mTeq_e2", "sin 30° = 1/2 and sine is odd, so the calculator's angle is −30°") },
          { tex: r`x = -30^\circ + 360^\circ k \quad\text{or}\quad x = 210^\circ + 360^\circ k`, why: tx(t, "mTeq_e3", "the second family: 180° − (−30°) = 210°") },
          { tex: r`x = \green{210^\circ} \ \text{ or } \ x = \green{330^\circ}`, why: tx(t, "mTeq_e4", "−30° is outside the interval; k = 1 gives 330°; k = 0 in the second family gives 210°") },
        ]} />
      <p>
        {tx(t, "mTeq_checkBody",
          "Check the signs on the circle: sine is negative below the x-axis, in quadrants III and IV, and 210° and 330° are exactly there, each 30° away from the x-axis. A quick sketch like this catches most mistakes.")}
      </p>

      <H3>{tx(t, "mTeq_multTitle", "When the angle is 2x or x/2")}</H3>
      <p>
        {tx(t, "mTeq_multBody",
          "In sin 2x = c the unknown inside the sine is 2x, not x. Call it u = 2x and solve for u first. The trap is the interval: if 0° ≤ x < 360°, then 0° ≤ u < 720°, two full turns, so u has twice as many solutions. Dividing by 2 at the end gives x. In the same way sin(x/2) = c has u in [0°, 180°), half a turn, and fewer solutions.")}
      </p>
      <Derivation t={t} label={tx(t, "mTeq_eqEx2", "Solve cos 2x = 1/2 with 0° ≤ x < 360°")}
        steps={[
          { tex: r`u = 2x, \quad 0^\circ \le u < 720^\circ`, why: tx(t, "mTeq_u1", "the new unknown and its interval: double the old one") },
          { tex: r`u = \pm 60^\circ + 360^\circ k`, why: tx(t, "mTeq_u2", "arccos(1/2) = 60°, and the cosine family is ±α") },
          { tex: r`u = 60^\circ,\ 300^\circ,\ 420^\circ,\ 660^\circ`, why: tx(t, "mTeq_u3", "every value of the families that falls in [0°, 720°)") },
          { tex: r`x = \green{30^\circ,\ 150^\circ,\ 210^\circ,\ 330^\circ}`, why: tx(t, "mTeq_u4", "x = u/2: four solutions, twice as many as for cos x = 1/2") },
        ]} />

      <H2>{tx(t, "mTeq_idTitle", "Using identities")}</H2>
      <p>
        {tx(t, "mTeq_idBody",
          "Harder equations are solved by rewriting them, with the identities of the previous chapter, until only one trigonometric function of one angle is left. Three patterns cover most of them.")}
      </p>
      <H3>{tx(t, "mTeq_quadTitle", "A quadratic in disguise")}</H3>
      <p>
        {tx(t, "mTeq_quadBody",
          "In 2 sin² x − sin x − 1 = 0 (sin² x means (sin x)²), sin x plays the role of the unknown of a quadratic. Write s = sin x, solve 2s² − s − 1 = 0 by factoring or the quadratic formula, then solve sin x = s for each root. A root outside [−1, 1] gives no angle and is dropped.")}
      </p>
      <Derivation t={t} label={tx(t, "mTeq_eqQuad", "Solve 2 sin² x − sin x − 1 = 0 with 0° ≤ x < 360°")}
        steps={[
          { tex: r`2s^2 - s - 1 = (2s + 1)(s - 1) = 0, \quad s = \sin x`, why: tx(t, "mTeq_q1", "factor: the product is 0 when one of the factors is 0") },
          { tex: r`\sin x = -\tfrac12 \quad\text{or}\quad \sin x = 1`, why: tx(t, "mTeq_q2", "the two roots, both between −1 and 1") },
          { tex: r`x = 210^\circ,\ 330^\circ \quad\text{or}\quad x = 90^\circ`, why: tx(t, "mTeq_q3", "the first worked example, and the top of the circle") },
          { tex: r`x = \green{90^\circ,\ 210^\circ,\ 330^\circ}`, why: tx(t, "mTeq_q4", "all three") },
        ]} />
      <p>
        {tx(t, "mTeq_mixBody",
          "If sine and cosine are mixed, the Pythagorean identity swaps one for the other. In 2 cos² x + 3 sin x − 3 = 0, replace cos² x by 1 − sin² x: 2 − 2 sin² x + 3 sin x − 3 = 0, that is 2 sin² x − 3 sin x + 1 = 0, a quadratic in sin x with roots 1 and 1/2, so x = 90°, 30°, 150°.")}
      </p>
      <H3>{tx(t, "mTeq_facTitle", "Factor, do not divide")}</H3>
      <p>
        {tx(t, "mTeq_facBody",
          "Solve sin 2x = sin x. The double-angle formula gives 2 sin x cos x = sin x. It is tempting to divide both sides by sin x and get cos x = 1/2. That loses every solution where sin x = 0, because dividing by zero is not allowed. Move everything to one side and factor instead: sin x (2 cos x − 1) = 0. Then sin x = 0 gives 0° and 180°, and cos x = 1/2 gives 60° and 300°: four solutions, not two.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mTeq_divWarn", "Dividing an equation by an expression that can be zero throws away the solutions where it is zero. Squaring both sides does the opposite: it can add solutions that do not solve the original equation. After squaring, always substitute each answer back.")}
      </Callout>

      <H3>{tx(t, "mTeq_harmTitle", "a sin x + b cos x = c")}</H3>
      <p>
        {tx(t, "mTeq_harmBody",
          "A sum of a sine and a cosine of the same angle is a single shifted sine. This is the angle-sum formula read backwards: R sin(x + φ) = R cos φ · sin x + R sin φ · cos x. Matching the coefficients with a sin x + b cos x needs R cos φ = a and R sin φ = b, so (a, b) is the point at distance R and angle φ: R = √(a² + b²) and φ is the angle of that point, from atan2 in the polar chapter. The equation then becomes sin(x + φ) = c/R, which is a basic one.")}
      </p>
      <Equation label={tx(t, "mTeq_eqHarm", "One sine instead of two terms")}
        where={[
          [r`a, b`, tx(t, "mTeq_wAB", "the coefficients of sin x and cos x")],
          [r`R = \sqrt{a^2 + b^2}`, tx(t, "mTeq_wR", "the amplitude: the distance of the point (a, b) from the origin")],
          [r`\varphi`, tx(t, "mTeq_wPhi", "the phase: the angle of the point (a, b), so that cos φ = a/R and sin φ = b/R")],
        ]}
        words={tx(t, "mTeq_harmWords", "Treat (a, b) as a point: its distance from the origin is the height of the new wave, and its angle is how far the wave is shifted.")}>
        {r`a\sin x + b\cos x = R\,\sin(x + \varphi)`}
      </Equation>
      <LiveFormula label={tx(t, "mTeq_liveHarm", "Try it: amplitude and phase")}
        tex={r`a\sin x + b\cos x = R\,\sin(x + \varphi)`}
        vars={[
          { id: "a", label: "a", min: -3, max: 3, step: 0.5, value: 1, fmt: num },
          { id: "b", label: "b", min: -3, max: 3, step: 0.5, value: 1, fmt: num },
        ]}
        compute={harmonicNumbers}
        note={tx(t, "mTeq_liveHarmNote", "a = b = 1 gives R = √2 ≈ 1.414 and φ = 45°: sin x + cos x = √2 sin(x + 45°). So sin x + cos x can never be bigger than √2, and sin x + cos x = 2 has no solution.")} />
      <Derivation t={t} label={tx(t, "mTeq_eqEx3", "Solve sin x + cos x = 1 with 0° ≤ x < 360°")}
        steps={[
          { tex: r`\sqrt2\,\sin(x + 45^\circ) = 1`, why: tx(t, "mTeq_h1", "R = √(1 + 1) = √2, and the point (1, 1) is at 45°") },
          { tex: r`\sin(x + 45^\circ) = \tfrac{1}{\sqrt2} = \tfrac{\sqrt2}{2}`, why: tx(t, "mTeq_h2", "divide by √2") },
          { tex: r`x + 45^\circ = 45^\circ \ \text{ or } \ 135^\circ \quad (+\,360^\circ k)`, why: tx(t, "mTeq_h3", "arcsin(√2/2) = 45°, and 180° − 45° = 135°") },
          { tex: r`x = \green{0^\circ} \ \text{ or } \ x = \green{90^\circ}`, why: tx(t, "mTeq_h4", "subtract 45°; check: sin 0° + cos 0° = 0 + 1 and sin 90° + cos 90° = 1 + 0") },
        ]} />

      <H2>{tx(t, "mTeq_ineqTitle", "Trigonometric inequalities")}</H2>
      <p>
        {tx(t, "mTeq_ineqBody",
          "To solve sin x > 1/2, first solve the equation sin x = 1/2: in one turn, 30° and 150°. These points cut the circle into arcs, and on each arc the inequality is either true everywhere or false everywhere, because sine can only cross 1/2 at those points. Test one angle in each arc, or just look: the points higher than the line y = 1/2 are the arc from 30° to 150°. So 30° < x < 150°, plus 360°k for every turn. The figure's > and < modes shade these arcs.")}
      </p>
      <LessonTable
        headers={[tx(t, "mTeq_tIneq", "Inequality"), tx(t, "mTeq_tCuts", "Equation's solutions"), tx(t, "mTeq_tSol", "Solution in [0°, 360°)")]}
        rows={[
          ["sin x > 1/2", "30°, 150°", "30° < x < 150°"],
          ["cos x ≤ 0", "90°, 270°", "90° ≤ x ≤ 270°"],
          ["cos x < 1/2", "60°, 300°", "60° < x < 300°"],
          ["tan x > 1", tx(t, "mTeq_tTanCuts", "45°, 225°; undefined at 90°, 270°"), "45° < x < 90° ∪ 225° < x < 270°"],
          ["sin x ≥ −1", tx(t, "mTeq_tAll", "270° (touching)"), tx(t, "mTeq_tEvery", "every x")],
        ]}
      />
      <p>
        {tx(t, "mTeq_ineqTan",
          "For tangent the cutting points must also include the angles where tangent is undefined, 90° and 270°: the graph jumps from +∞ to −∞ there, so the sign can change without passing through the value. With ≤ or ≥ the end points that solve the equation are included; with < or > they are not.")}
      </p>

      <H2>{tx(t, "mTeq_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mTeq_ex1", "1. tan x = −√3 for 0° ≤ x < 360°: α = arctan(−√3) = −60°, family −60° + 180°k, so x = 120° and x = 300°.")}</p>
      <p>{tx(t, "mTeq_ex2", "2. 4 cos² x = 3 for 0° ≤ x < 360°: cos x = ±√3/2. cos x = √3/2 gives 30° and 330°; cos x = −√3/2 gives 150° and 210°. Do not forget the minus root of the square.")}</p>
      <p>{tx(t, "mTeq_ex3", "3. sin x = 0.3 for 0° ≤ x < 360°: no special angle, so use a calculator: α = arcsin 0.3 ≈ 17.46°, and the second solution is 180° − 17.46° ≈ 162.54°.")}</p>
      <p>{tx(t, "mTeq_ex4", "4. In radians: cos x = 0 means x = π/2 + πk, the top and the bottom of the circle, every half turn.")}</p>

      <MathPracticeFigure t={t} set="trigEquations" />

      <H2>{tx(t, "mTeq_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mTeq_tWrong", "Wrong"), tx(t, "mTeq_tRight", "Right"), tx(t, "mTeq_tWhy", "Why")]}
        rows={[
          [tx(t, "mTeq_m1w", "sin x = 1/2 ⇒ x = 30°"), "30°, 150° (+360°k)", tx(t, "mTeq_m1", "the calculator gives one angle; the mirror angle and the extra turns are yours to add")],
          [tx(t, "mTeq_m2w", "cos x = c ⇒ x = 180° − α"), "x = ±α", tx(t, "mTeq_m2", "180° − α is the sine's mirror; cosine mirrors in the x-axis")],
          [tx(t, "mTeq_m3w", "tan x = c with period 360°"), tx(t, "mTeq_m3r", "period 180°"), tx(t, "mTeq_m3", "opposite points of the circle have the same tangent")],
          [tx(t, "mTeq_m4w", "sin 2x = c, solutions only in one turn of 2x"), tx(t, "mTeq_m4r", "2x ranges over two turns"), tx(t, "mTeq_m4", "change the interval together with the unknown")],
          [tx(t, "mTeq_m5w", "dividing by sin x"), tx(t, "mTeq_m5r", "factor sin x out"), tx(t, "mTeq_m5", "the solutions with sin x = 0 are lost otherwise")],
          [tx(t, "mTeq_m6w", "sin x = 2 ⇒ x = arcsin 2"), tx(t, "mTeq_m6r", "no solution"), tx(t, "mTeq_m6", "sine never leaves [−1, 1]")],
        ]}
      />

      <KeyIdeas t={t} id="mTeq" items={[
        "arcsin and arctan return an angle in [−90°, 90°], arccos in [0°, 180°]; arcsin(sin x) = x only inside that range.",
        "sin x = c: x = α + 360°k or 180° − α + 360°k. cos x = c: x = ±α + 360°k. tan x = c: x = α + 180°k.",
        "sin x = c and cos x = c have no solution when |c| > 1; tan x = c always has.",
        "To solve in an interval: isolate, find α, write both families, then try k = 0, ±1, …",
        "For sin 2x = c, solve for u = 2x over a doubled interval, then halve.",
        "Use identities to leave one function of one angle; factor instead of dividing; a sin x + b cos x = R sin(x + φ) with R = √(a² + b²).",
        "Inequalities: solve the equation, then the inequality holds on whole arcs between those solutions (and tangent's asymptotes).",
      ]} />
    </Article>
  );
}
