"use client";

// Algebra 3: inequalities — the four order symbols, solution sets on the
// number line and in interval notation, the moves that keep an inequality,
// why multiplying by a negative flips it, compound inequalities, absolute
// value inequalities, and checking a solution with test points.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { InequalityFigure } from "@/components/lesson/figures/math/InequalityFigure";

const r = String.raw;

export function InequalitiesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mIneq_intro",
          "Many questions are not \"exactly how much?\" but \"how much is enough?\" or \"which values are allowed?\". Is the house within walking distance of the school? How many boxes can the lift carry before it is overloaded? What speeds keep a trip under two hours? Those are inequalities. Their answers are not single numbers but whole ranges of numbers, and solving them uses almost exactly the same moves as equations, with one important exception that this chapter explains until it is obvious.")}
      </Lead>

      <H2>{tx(t, "mIneq_symTitle", "The four order symbols")}</H2>
      <p>
        {tx(t, "mIneq_symBody",
          "On the number line, a < b means a lies to the left of b. The small end of the symbol points at the smaller number, the open side faces the larger one. Every pair of real numbers is in exactly one of three relations: a < b, a = b or a > b. The \"or equal\" symbols combine two of them: a ≤ b means a < b or a = b.")}
      </p>
      <LessonTable
        headers={[tx(t, "mIneq_tSym", "Symbol"), tx(t, "mIneq_tRead", "Read"), tx(t, "mIneq_tTrue", "True examples"), tx(t, "mIneq_tFalse", "False example")]}
        rows={[
          ["a < b", tx(t, "mIneq_s1", "a is less than b"), "2 < 5,  −4 < −1", "5 < 5"],
          ["a ≤ b", tx(t, "mIneq_s2", "a is less than or equal to b"), "2 ≤ 5,  5 ≤ 5", "6 ≤ 5"],
          ["a > b", tx(t, "mIneq_s3", "a is greater than b"), "0 > −3", "−3 > 0"],
          ["a ≥ b", tx(t, "mIneq_s4", "a is greater than or equal to b"), "7 ≥ 7", "−1 ≥ 0"],
        ]}
      />
      <p>
        {tx(t, "mIneq_negBody",
          "Negative numbers need care: −4 < −1, even though 4 > 1, because −4 is further left. \"Bigger\" means \"further right on the line\", not \"has more digits\" or \"looks larger\".")}
      </p>

      <H2>{tx(t, "mIneq_setTitle", "Solutions are ranges")}</H2>
      <p>
        {tx(t, "mIneq_setBody",
          "The inequality x < 3 is true for 2, for 2.9, for −100 and for 2.9999…, every number to the left of 3, but not for 3 itself. Its solution set is a ray on the number line. We draw it by shading the ray and marking the boundary with a hollow circle when the boundary is excluded (< or >) or a filled circle when it is included (≤ or ≥). Interval notation writes the same set with brackets: a round bracket means the endpoint is excluded, a square bracket that it is included. ∞ (infinity) is not a number, only a way to say \"no end on this side\", so it always gets a round bracket.")}
      </p>
      <LessonTable
        headers={[tx(t, "mIneq_tIneq", "Inequality"), tx(t, "mIneq_tInterval", "Interval"), tx(t, "mIneq_tPicture", "On the line")]}
        rows={[
          ["x < 3", "(−∞, 3)", tx(t, "mIneq_p1", "hollow circle at 3, shaded to the left")],
          ["x ≥ −2", "[−2, ∞)", tx(t, "mIneq_p2", "filled circle at −2, shaded to the right")],
          ["−1 < x ≤ 4", "(−1, 4]", tx(t, "mIneq_p3", "a segment: hollow at −1, filled at 4")],
          [tx(t, "mIneq_p4a", "every real x"), "(−∞, ∞)", tx(t, "mIneq_p4", "the whole line")],
        ]}
      />

      <H2>{tx(t, "mIneq_movesTitle", "Moves that keep an inequality")}</H2>
      <p>
        {tx(t, "mIneq_movesBody",
          "Adding or subtracting the same number on both sides slides both points along the line by the same amount, so their order does not change: if a < b, then a + 5 < b + 5. Multiplying both sides by the same positive number stretches the line away from 0, which also keeps the order: 2 < 3 gives 4 < 6. So far this is the same as for equations.")}
      </p>
      <p>
        {tx(t, "mIneq_flipBody",
          "Multiplying by a negative number is different. It mirrors the whole number line through 0 (the number-line chapter showed that multiplying by −1 is a flip). A mirror reverses left and right, so the point that was on the left ends on the right: 2 < 3, but −2 > −3. Therefore, whenever you multiply or divide both sides of an inequality by a negative number, you must reverse the symbol. This is not an arbitrary rule to memorise; it is what a mirror does.")}
      </p>
      <Equation label={tx(t, "mIneq_eqMoves", "The rules for inequalities")}
        where={[
          [r`a < b \Rightarrow a + c < b + c`, tx(t, "mIneq_wAdd", "any c, positive or negative: sliding keeps the order")],
          [r`a < b,\ c > 0 \Rightarrow c\,a < c\,b`, tx(t, "mIneq_wPos", "a positive factor stretches the line; the order stays")],
          [r`a < b,\ c < 0 \Rightarrow c\,a > c\,b`, tx(t, "mIneq_wNeg", "a negative factor mirrors the line; the order reverses")],
          [r`c = 0`, tx(t, "mIneq_wZero", "multiplying by 0 gives 0 = 0 on both sides and destroys the information, just as with equations")],
        ]}>
        {r`a < b \;\Longrightarrow\; \begin{cases} c\,a < c\,b & c > 0 \\ c\,a > c\,b & c < 0 \end{cases}`}
      </Equation>

      <InequalityFigure t={t} />

      <H2>{tx(t, "mIneq_solveTitle", "Solving linear inequalities")}</H2>
      <p>
        {tx(t, "mIneq_solveBody",
          "Solve exactly as for an equation: expand brackets, gather x terms on one side and constants on the other, then divide by the coefficient of x. Keep one eye on the sign of every number you multiply or divide by. Then pick one value inside your answer and one outside it and test both in the original inequality; the figure's test point does just that.")}
      </p>
      <Equation label={tx(t, "mIneq_eqEx1", "Solving 3x − 5 < 7")}
        notes={[
          tx(t, "mIneq_e1a", "add 5 to both sides: 3x < 12"),
          tx(t, "mIneq_e1b", "divide both sides by 3, a positive number: the symbol stays, x < 4"),
          tx(t, "mIneq_e1c", "test x = 0 (inside): −5 < 7 ✓. Test x = 5 (outside): 10 < 7 ✗. The answer is (−∞, 4)"),
        ]}>
        {r`3x - 5 < 7 \;\to\; 3x < 12 \;\to\; x < 4`}
      </Equation>
      <Equation label={tx(t, "mIneq_eqEx2", "Solving −2x + 1 ≤ 7")}
        notes={[
          tx(t, "mIneq_e2a", "subtract 1 from both sides: −2x ≤ 6"),
          tx(t, "mIneq_e2b", "divide both sides by −2, a negative number: the symbol flips, x ≥ −3"),
          tx(t, "mIneq_e2c", "test x = 0 (inside): 1 ≤ 7 ✓. Test x = −4 (outside): 9 ≤ 7 ✗. The answer is [−3, ∞)"),
        ]}>
        {r`-2x + 1 \le 7 \;\to\; -2x \le 6 \;\to\; x \ge -3`}
      </Equation>
      <Callout type="tip" t={t}>
        {tx(t, "mIneq_avoidTip", "You can avoid dividing by a negative altogether: move the x terms to the side where their coefficient is positive. From −2x + 1 ≤ 7, add 2x and subtract 7 on both sides: −6 ≤ 2x, so −3 ≤ x. Same answer, no flip to forget.")}
      </Callout>

      <H2>{tx(t, "mIneq_compTitle", "Compound inequalities")}</H2>
      <p>
        {tx(t, "mIneq_compBody",
          "Often a value must stay between two limits: a room temperature between 18 °C and 24 °C, 18 ≤ T ≤ 24. Such a double inequality means both conditions hold at once (an \"and\"), and its solution is a segment, the overlap of two rays. Solve it by applying each move to all three parts at once. An \"or\" condition, like x < −2 or x > 2, is the opposite: the union of two separate rays, the values outside a segment.")}
      </p>
      <Equation label={tx(t, "mIneq_eqComp", "Solving −3 < 2x + 1 ≤ 9")}
        notes={[
          tx(t, "mIneq_c1", "subtract 1 from all three parts: −4 < 2x ≤ 8"),
          tx(t, "mIneq_c2", "divide all three parts by 2: −2 < x ≤ 4, the interval (−2, 4]"),
        ]}>
        {r`-3 < 2x + 1 \le 9 \;\to\; -4 < 2x \le 8 \;\to\; -2 < x \le 4`}
      </Equation>

      <H2>{tx(t, "mIneq_absTitle", "Absolute value: within a distance")}</H2>
      <p>
        {tx(t, "mIneq_absBody",
          "|x − c| is the distance between x and c. So |x − c| < r says \"x is less than r away from c\": a segment centred on c with half-width r. And |x − c| > r says \"x is more than r away\": everything outside that segment. This is the one-dimensional version of \"inside a circle\", and the natural way to write a tolerance: \"10 cm, give or take 2 mm\" is |x − 100| ≤ 2 in millimetres.")}
      </p>
      <Equation label={tx(t, "mIneq_eqAbs", "Absolute value inequalities")}
        where={[
          [r`c`, tx(t, "mIneq_wC", "the centre, the value x is compared to")],
          [r`r`, tx(t, "mIneq_wR", "the allowed distance (a radius), with r > 0")],
          [r`|x - c| < r`, tx(t, "mIneq_wIn", "inside: c − r < x < c + r, an \"and\"")],
          [r`|x - c| > r`, tx(t, "mIneq_wOut", "outside: x < c − r or x > c + r, an \"or\"")],
        ]}
        note={tx(t, "mIneq_eqAbsNote", "Example: a bus stop at kilometre 12 serves everyone living within 3 km of it: |x − 12| ≤ 3 means 9 ≤ x ≤ 15.")}>
        {r`|x - c| < r \;\iff\; c - r < x < c + r`}
      </Equation>

      <H2>{tx(t, "mIneq_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mIneq_ex1T", "How many trips?")}</H3>
      <p>
        {tx(t, "mIneq_ex1",
          "A pile of 250 bricks must be moved, and a wheelbarrow carries 35 bricks per trip. How many trips n leave no bricks behind? 250 − 35n ≤ 0. Add 35n to both sides: 250 ≤ 35n. Divide by 35 (positive): n ≥ 7.14…. Trips come in whole numbers, so the smallest n that works is 8. Check: after 7 trips 250 − 35 · 7 = 5 bricks are still there, after 8 trips 250 − 35 · 8 = −30, so none are ✓. Rounding up, not to the nearest whole number, is what the inequality demands.")}
      </p>
      <H3>{tx(t, "mIneq_ex2T", "A phone plan")}</H3>
      <p>
        {tx(t, "mIneq_ex2",
          "Plan A costs 30 per month plus 0.10 per minute of calls; plan B costs a flat 55. For how many minutes m is plan A cheaper? 30 + 0.10m < 55. Subtract 30: 0.10m < 25. Divide by 0.10 (positive, so the symbol stays): m < 250. Below 250 minutes plan A wins; at exactly 250 both cost 55; above it plan B wins.")}
      </p>

      <H2>{tx(t, "mIneq_testTitle", "Checking with test points")}</H2>
      <p>
        {tx(t, "mIneq_testBody",
          "An inequality has infinitely many solutions, so you cannot check them all. You do not need to. The boundary value, where the two sides are equal, splits the number line into pieces, and on each piece the inequality is either always true or always false. So pick one easy test point on each side of the boundary, plus the boundary itself, and substitute into the original inequality. If the pieces that pass are exactly the ones in your answer, the answer is right.")}
      </p>
      <Equation label={tx(t, "mIneq_eqTest", "Checking −2x + 5 ≥ 1, answer x ≤ 2")}
        notes={[
          tx(t, "mIneq_t1", "boundary x = 2: −4 + 5 = 1 ≥ 1 is true, so 2 belongs to the answer (the dot is filled)"),
          tx(t, "mIneq_t2", "left of it, x = 0: 0 + 5 = 5 ≥ 1 is true, so the left side is in"),
          tx(t, "mIneq_t3", "right of it, x = 3: −6 + 5 = −1 ≥ 1 is false, so the right side is out"),
          tx(t, "mIneq_t4", "exactly the ray x ≤ 2 ✓; had you forgotten to flip the symbol you would have written x ≥ 2, and x = 3 would have caught it"),
        ]}>
        {r`-2x + 5 \ge 1 \;\to\; -2x \ge -4 \;\to\; x \le 2`}
      </Equation>

      <H2>{tx(t, "mIneq_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mIneq_tWrong", "Wrong"), tx(t, "mIneq_tRight", "Right"), tx(t, "mIneq_tWhy", "Why")]}
        rows={[
          ["−2x < 6 → x < −3", "x > −3", tx(t, "mIneq_m1", "dividing by a negative mirrors the line: flip the symbol")],
          ["x < 3 → [−∞, 3]", "(−∞, 3)", tx(t, "mIneq_m2", "∞ is never included, and < excludes 3")],
          ["−5 > −2", "−5 < −2", tx(t, "mIneq_m3", "−5 is further left")],
          ["|x| < 4 → x < ±4", "−4 < x < 4", tx(t, "mIneq_m4", "the distance to 0 is below 4 on both sides")],
          ["3 < x > 7", tx(t, "mIneq_m5r", "x > 7"), tx(t, "mIneq_m5", "a chain must point one way; \"greater than 3 and greater than 7\" is simply x > 7")],
          ["n ≥ 7.14 → n = 7", "n = 8", tx(t, "mIneq_m6", "7 does not satisfy n ≥ 7.14; round towards the solution set")],
        ]}
      />

      <KeyIdeas t={t} id="mIneq" items={[
        "a < b means a is to the left of b on the number line.",
        "Solutions are ranges: rays and segments, written in interval notation.",
        "Adding, subtracting, or multiplying by a positive number keeps the symbol.",
        "Multiplying or dividing by a negative number mirrors the line: flip the symbol.",
        "Double inequalities are \"and\" (a segment); apply each move to all three parts.",
        "|x − c| < r means c − r < x < c + r: within r of c.",
        "Check an answer with one test point on each side of the boundary, and the boundary itself.",
      ]} />
    </Article>
  );
}
