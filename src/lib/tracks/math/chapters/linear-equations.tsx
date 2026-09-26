"use client";

// Algebra 2: linear equations — what an equation claims, the balance rule,
// inverse operations, solving step by step, variables on both sides,
// brackets and fractions, checking, the three possible outcomes, rearranging
// formulas, and word problems turned into equations.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { BalanceFigure } from "@/components/lesson/figures/math/BalanceFigure";

const r = String.raw;

export function LinearEquationsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mLin_intro",
          "An expression is a value; an equation is a claim: two expressions are equal. \"2x + 3 = 11\" claims that doubling some number and adding 3 gives 11, and solving it means finding every x for which the claim is true. Linear equations, where the unknown appears only to the first power, are the simplest kind and by far the most common: when will the projectile reach the wall, how many coins buy this item, where does the camera have to be. This chapter builds the one rule behind all of them and applies it until it is automatic.")}
      </Lead>

      <H2>{tx(t, "mLin_whatTitle", "What an equation says")}</H2>
      <p>
        {tx(t, "mLin_whatBody",
          "An equation has a left side and a right side joined by =. For most values of the unknown the claim is false: with x = 2, 2x + 3 is 7, not 11. For the value x = 4 it is true: 2 · 4 + 3 = 11. That value is a solution (or root) of the equation. A linear equation in one unknown is one that can be brought to the form a·x + b = 0; \"linear\" because its graph, y = ax + b, is a straight line, and the solution is where that line crosses zero.")}
      </p>
      <Equation label={tx(t, "mLin_eqForm", "The general linear equation")}
        where={[
          [r`x`, tx(t, "mLin_wX", "the unknown; it appears only to the first power (no x², no 1/x, no √x)")],
          [r`a`, tx(t, "mLin_wA", "the coefficient of x, a fixed number. If a = 0 there is no x left and the equation is not really about x at all")],
          [r`b`, tx(t, "mLin_wB", "the constant term, also a fixed number")],
          [r`x = -b/a`, tx(t, "mLin_wSol", "the solution when a ≠ 0: subtract b from both sides, then divide both sides by a")],
        ]}>
        {r`a\,x + b = 0 \quad\Longrightarrow\quad x = -\frac{b}{a} \qquad (a \neq 0)`}
      </Equation>

      <H2>{tx(t, "mLin_balTitle", "The balance rule")}</H2>
      <p>
        {tx(t, "mLin_balBody",
          "Think of an equation as a balance scale in equilibrium. You may do anything you like to it, as long as you do exactly the same to both pans: it stays level. Add 5 to both sides, subtract x from both sides, multiply both sides by 3, divide both sides by 2 (by anything except 0). Each such move produces a new equation with exactly the same solutions as the old one. Solving is choosing moves that make the equation simpler, until it reads x = number.")}
      </p>
      <Equation label={tx(t, "mLin_eqRule", "Moves that keep the solutions")}
        where={[
          [r`A = B \iff A + c = B + c`, tx(t, "mLin_wAdd", "add (or subtract) the same number or expression on both sides")],
          [r`A = B \iff c\,A = c\,B`, tx(t, "mLin_wMul", "multiply (or divide) both sides by the same number c, provided c ≠ 0")],
          [r`\iff`, tx(t, "mLin_wIff", "\"if and only if\": the two equations are true for exactly the same x, so no solution is gained or lost")],
        ]}
        note={tx(t, "mLin_eqRuleNote", "Why c ≠ 0: multiplying both sides of any equation by 0 gives 0 = 0, which is true for every x, so all information about x is destroyed. Dividing by an expression that could be zero, such as x − 2, has the same danger and is the classic way to lose a solution.")}>
        {r`A = B \;\iff\; A + c = B + c \;\iff\; c\,A = c\,B \quad (c \neq 0)`}
      </Equation>

      <BalanceFigure t={t} />

      <H2>{tx(t, "mLin_invTitle", "Undoing operations")}</H2>
      <p>
        {tx(t, "mLin_invBody",
          "Which move should you pick? Look at what was done to x, then undo it in reverse order, like taking off shoes and then socks. In 2x + 3 the recipe was \"multiply by 2, then add 3\", so solving undoes the last step first (subtract 3) and the first step last (divide by 2). Every operation has an inverse that undoes it: + and −, × and ÷, and later squaring and square root, exponential and logarithm.")}
      </p>
      <LessonTable
        headers={[tx(t, "mLin_tDone", "Done to x"), tx(t, "mLin_tUndo", "Undo with"), tx(t, "mLin_tEx", "Example")]}
        rows={[
          [tx(t, "mLin_i1", "add 3"), tx(t, "mLin_i1u", "subtract 3"), "x + 3 = 10 → x = 7"],
          [tx(t, "mLin_i2", "subtract 4"), tx(t, "mLin_i2u", "add 4"), "x − 4 = 1 → x = 5"],
          [tx(t, "mLin_i3", "multiply by 5"), tx(t, "mLin_i3u", "divide by 5"), "5x = 30 → x = 6"],
          [tx(t, "mLin_i4", "divide by 2"), tx(t, "mLin_i4u", "multiply by 2"), "x/2 = 7 → x = 14"],
          [tx(t, "mLin_i5", "negate"), tx(t, "mLin_i5u", "negate (multiply by −1)"), "−x = 4 → x = −4"],
        ]}
      />
      <Equation label={tx(t, "mLin_eqSteps", "Solving 2x + 3 = 11")}
        notes={[
          tx(t, "mLin_s1", "the last thing done to x was + 3, so subtract 3 from both sides: 2x = 8"),
          tx(t, "mLin_s2", "the first thing done was × 2, so divide both sides by 2: x = 4"),
          tx(t, "mLin_s3", "check in the original: 2 · 4 + 3 = 11 ✓"),
        ]}>
        {r`2x + 3 = 11 \;\to\; 2x = 8 \;\to\; x = 4`}
      </Equation>

      <H2>{tx(t, "mLin_bothTitle", "The unknown on both sides")}</H2>
      <p>
        {tx(t, "mLin_bothBody",
          "When x appears on both sides, first gather all the x terms on one side and all the constants on the other, using the same add/subtract moves. It is usually easiest to move the smaller x term, so the coefficient that remains is positive. Then it is an ordinary one-step equation.")}
      </p>
      <Equation label={tx(t, "mLin_eqBoth", "Solving 3x − 4 = x + 6")}
        notes={[
          tx(t, "mLin_b1", "subtract x from both sides: 2x − 4 = 6"),
          tx(t, "mLin_b2", "add 4 to both sides: 2x = 10"),
          tx(t, "mLin_b3", "divide both sides by 2: x = 5"),
          tx(t, "mLin_b4", "check: left 3 · 5 − 4 = 11, right 5 + 6 = 11 ✓"),
        ]}>
        {r`3x - 4 = x + 6 \;\to\; 2x - 4 = 6 \;\to\; 2x = 10 \;\to\; x = 5`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "mLin_moveInfo", "You may have learned \"move a term to the other side and change its sign\". That is a shortcut for adding its opposite to both sides: from 2x − 4 = 6, adding 4 to both sides gives 2x = 6 + 4. The shortcut is fine once you know why it works; when unsure, write the move out in full.")}
      </Callout>

      <H2>{tx(t, "mLin_bracketTitle", "Brackets and fractions")}</H2>
      <p>
        {tx(t, "mLin_bracketBody",
          "Brackets: expand them first with the distributive law, collect like terms on each side, then solve as before. Fractions: multiply both sides by a common denominator (the LCM of the denominators, from the divisibility chapter) to clear them all in one move. Multiply every term, on both sides, not just the ones with fractions.")}
      </p>
      <Equation label={tx(t, "mLin_eqBr", "Brackets: 5(x − 1) = 2(x + 4)")}
        notes={[
          tx(t, "mLin_br1", "expand both sides: 5x − 5 = 2x + 8"),
          tx(t, "mLin_br2", "subtract 2x: 3x − 5 = 8"),
          tx(t, "mLin_br3", "add 5: 3x = 13, divide by 3: x = 13/3 ≈ 4.33. Solutions need not be whole numbers; keep the exact fraction"),
        ]}>
        {r`5x - 5 = 2x + 8 \;\to\; 3x = 13 \;\to\; x = \tfrac{13}{3}`}
      </Equation>
      <Equation label={tx(t, "mLin_eqFr", "Fractions: x/2 + x/3 = 10")}
        notes={[
          tx(t, "mLin_fr1", "the denominators are 2 and 3; lcm(2, 3) = 6, so multiply every term by 6"),
          tx(t, "mLin_fr2", "6 · x/2 = 3x and 6 · x/3 = 2x, and 6 · 10 = 60: 3x + 2x = 60"),
          tx(t, "mLin_fr3", "collect: 5x = 60, so x = 12. Check: 6 + 4 = 10 ✓"),
        ]}>
        {r`\frac{x}{2} + \frac{x}{3} = 10 \;\to\; 3x + 2x = 60 \;\to\; x = 12`}
      </Equation>

      <H2>{tx(t, "mLin_casesTitle", "One, none or infinitely many")}</H2>
      <p>
        {tx(t, "mLin_casesBody",
          "After collecting terms, every linear equation becomes a·x = c. There are exactly three possibilities. If a ≠ 0, divide: one solution, x = c/a. If a = 0 and c ≠ 0, the equation says 0 = c, which is false for every x: no solution (try the last preset in the figure, 2x + 1 = 2x + 5). If a = 0 and c = 0, it says 0 = 0, true for every x: infinitely many solutions, because the two sides were the same expression written differently.")}
      </p>
      <LessonTable
        headers={[tx(t, "mLin_tAfter", "After collecting"), tx(t, "mLin_tMeaning", "Meaning"), tx(t, "mLin_tExample", "Example")]}
        rows={[
          ["a·x = c, a ≠ 0", tx(t, "mLin_c1", "exactly one solution, x = c/a"), "3x + 1 = x + 7 → x = 3"],
          ["0 = c, c ≠ 0", tx(t, "mLin_c2", "no solution: the claim is never true"), "2x + 1 = 2x + 5 → 0 = 4"],
          ["0 = 0", tx(t, "mLin_c3", "every x is a solution (an identity)"), "2(x + 1) = 2x + 2 → 0 = 0"],
        ]}
      />

      <H2>{tx(t, "mLin_formulaTitle", "Rearranging formulas")}</H2>
      <p>
        {tx(t, "mLin_formulaBody",
          "The same moves work when the \"numbers\" are other letters. A formula like v = u + a·t gives the speed v after time t; solving it for t answers a different question, \"how long until I reach speed v?\". Treat every letter except the one you are solving for as a fixed number, and undo operations as before. Note every denominator you divide by: each one is a case (a = 0 here, zero acceleration) where the rearranged formula breaks.")}
      </p>
      <Equation label={tx(t, "mLin_eqRearr", "Solving v = u + a·t for t")}
        where={[
          [r`u`, tx(t, "mLin_wU", "the starting speed")],
          [r`a`, tx(t, "mLin_wAcc", "the constant acceleration (speed gained per second)")],
          [r`t`, tx(t, "mLin_wT", "the time, now the unknown")],
          [r`v`, tx(t, "mLin_wV", "the speed after time t")],
        ]}
        note={tx(t, "mLin_eqRearrNote", "Subtract u from both sides: v − u = a·t. Divide both sides by a (assuming a ≠ 0): t = (v − u)/a. A negative t means the target speed was in the past; code must decide what that means for the game.")}>
        {r`v = u + a\,t \;\;\Longrightarrow\;\; t = \frac{v - u}{a}`}
      </Equation>

      <H2>{tx(t, "mLin_wordTitle", "From words to an equation")}</H2>
      <p>
        {tx(t, "mLin_wordBody",
          "Most real problems arrive as sentences. Translate them in three steps: name the unknown (\"let x be…\", with units), write each phrase as an expression in x, and find the two expressions that must be equal. Then solve and, just as important, check the answer against the original sentence, not your equation, because the translation itself might be wrong.")}
      </p>
      <H3>{tx(t, "mLin_w1T", "Catching up")}</H3>
      <p>
        {tx(t, "mLin_w1",
          "A guard at x = 0 chases a thief who is 30 m ahead. The guard runs at 7 m/s, the thief at 4 m/s. When is the thief caught? Let t be the time in seconds. The guard's position is 7t, the thief's is 30 + 4t, and caught means the positions are equal: 7t = 30 + 4t. Subtract 4t: 3t = 30, so t = 10 s. Check: the guard is at 70 m, the thief at 30 + 40 = 70 m ✓. Notice 3 is the closing speed, 7 − 4: the equation discovered that for us.")}
      </p>
      <H3>{tx(t, "mLin_w2T", "Budget")}</H3>
      <p>
        {tx(t, "mLin_w2",
          "A player has 500 gold, buys a 140-gold shield, and wants to spend the rest on potions at 45 gold each. Let p be the number of potions: 140 + 45p = 500, so 45p = 360 and p = 8. Check: 140 + 360 = 500 ✓. Had the answer been 8.4, the equation would be telling you that only 8 whole potions fit; a real-world answer must still make sense in the real world.")}
      </p>

      <H2>{tx(t, "mLin_codeTitle", "Linear equations in code")}</H2>
      <p>
        {tx(t, "mLin_codeBody",
          "Code rarely solves equations symbolically; instead you solve them once on paper and write the resulting formula, guarding the cases the algebra excluded. Ray tracing, collision tests and animation timing are full of such pre-solved linear equations.")}
      </p>
      <CodeBlock lang="cpp" filename="linear.hpp" t={t}>{`#include <optional>
#include <cmath>

// Solves a·x + b = 0. No value when there is no single solution (a == 0).
std::optional<float> solveLinear(float a, float b) {
    if (std::abs(a) < 1e-8f) return std::nullopt;   // 0 = −b: none or every x
    return -b / a;
}

// When does a point moving at speed v, starting at x0, reach the wall at xw?
// x0 + v·t = xw  →  t = (xw − x0) / v, valid only for v ≠ 0 and t ≥ 0.
std::optional<float> timeToWall(float x0, float v, float xw) {
    auto t = solveLinear(v, x0 - xw);
    if (!t || *t < 0) return std::nullopt;          // never, or it was in the past
    return t;
}`}</CodeBlock>

      <H2>{tx(t, "mLin_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mLin_tWrong", "Wrong"), tx(t, "mLin_tRight", "Right"), tx(t, "mLin_tWhy", "Why")]}
        rows={[
          ["2x + 3 = 11 → 2x = 14", "2x = 8", tx(t, "mLin_m1", "undo + 3 by subtracting 3, on both sides")],
          ["3x = 12 → x = 12 − 3", "x = 12 ÷ 3 = 4", tx(t, "mLin_m2", "3x is 3 times x; undo multiplication with division")],
          ["x/2 + 1 = 5 → x + 1 = 10", "x + 2 = 10", tx(t, "mLin_m3", "multiplying by 2 must multiply every term, including the 1")],
          ["2(x + 3) = 10 → 2x + 3 = 10", "2x + 6 = 10", tx(t, "mLin_m4", "distribute to every term in the bracket")],
          ["x(x − 2) = 3(x − 2) → x = 3", tx(t, "mLin_m5r", "also x = 2"), tx(t, "mLin_m5", "dividing by x − 2 silently assumed x ≠ 2 and lost that solution")],
          [tx(t, "mLin_m6w", "no check"), tx(t, "mLin_m6r", "substitute into the original"), tx(t, "mLin_m6", "a check costs seconds and catches every slip, including in the translation from words")],
        ]}
      />

      <KeyIdeas t={t} id="mLin" items={[
        "An equation is a claim that two expressions are equal; a solution is a value that makes it true.",
        "Do the same thing to both sides: add, subtract, multiply or divide by anything except 0.",
        "Undo what was done to x in reverse order: the last operation first.",
        "Gather x terms on one side, constants on the other; clear fractions with the LCM.",
        "a·x = c has one solution if a ≠ 0, none if 0 = c ≠ 0, every x if 0 = 0.",
        "Rearranging a formula is solving it for another letter; note every denominator you divide by.",
        "Always check the answer in the original equation, or the original sentence.",
      ]} />
    </Article>
  );
}
