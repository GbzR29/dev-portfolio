"use client";

// Arithmetic 1: what numbers are, the number line, the four operations and
// what they mean, negative numbers and the sign rules, absolute value and
// distance, and the laws every later manipulation relies on. Also the map of
// the whole track, since this is its first chapter.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { NumberLineFigure } from "@/components/lesson/figures/math/NumberLineFigure";

const r = String.raw;

export function NumberLineContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mNL_intro",
          "Everything in this track, from fractions to quaternions, is built on a handful of ideas about ordinary numbers: what they are, how they are ordered, what the four operations really do, and which rearrangements are always allowed. None of it is difficult, but every later chapter uses it without comment, so it is worth getting completely solid. This chapter starts from counting and ends with the laws of arithmetic, with the number line as the picture that ties it all together.")}
      </Lead>

      <H2>{tx(t, "mNL_countTitle", "Counting and zero")}</H2>
      <p>
        {tx(t, "mNL_countBody",
          "Numbers start as answers to \"how many?\": how many apples are in the bowl, how many people are in the room, how many coins are in the purse. Those answers are 0, 1, 2, 3 and so on, and they are called the natural numbers. Zero is the answer when there are none, and it is a number like any other: you can add it, compare it and store it. (Some books start the natural numbers at 1; this track includes 0, since \"none\" is a perfectly good answer to \"how many?\".)")}
      </p>
      <p>
        {tx(t, "mNL_placeBody",
          "We write numbers with ten digits, 0 to 9, and let the position of a digit decide its worth. In 347 the 7 is worth seven ones, the 4 is worth four tens and the 3 is worth three hundreds: 347 = 3 × 100 + 4 × 10 + 7 × 1. Each position is worth ten times the one to its right. This positional idea, and what happens when the base is 2 or 16 instead of 10, gets its own chapter later in this section.")}
      </p>

      <H2>{tx(t, "mNL_lineTitle", "The number line")}</H2>
      <p>
        {tx(t, "mNL_lineBody",
          "Draw a straight line, mark a point and call it 0. Mark another point to its right and call it 1. The distance between them is the unit, and repeating it gives 2, 3, 4 … further right. Repeating it to the left of 0 gives new points, −1, −2, −3 …, the negative numbers. Every number now has a place on this line, and the line gives a meaning to \"bigger\": a number is greater than another when it lies further to the right. That is why −5 is less than −2 even though 5 is more than 2: −5 is further left.")}
      </p>
      <Equation label={tx(t, "mNL_eqOrder", "Comparing numbers")}
        where={[
          [r`a < b`, tx(t, "mNL_wLt", "a is less than b: a lies to the left of b on the line. The symbol's open side faces the bigger number")],
          [r`a > b`, tx(t, "mNL_wGt", "a is greater than b: a lies to the right of b. It says the same thing as b < a")],
          [r`a \le b`, tx(t, "mNL_wLe", "a is less than or equal to b: to the left of b or exactly on it")],
          [r`a \ge b`, tx(t, "mNL_wGe", "a is greater than or equal to b")],
        ]}
        note={tx(t, "mNL_eqOrderNote", "For any two numbers exactly one of a < b, a = b, a > b is true. Chains are allowed: 0 ≤ t ≤ 1 means t is somewhere between 0 and 1, ends included. A chain must point one way: 1 < x < 5 is fine, but 1 < x > 5 says nothing useful and should be split into two separate statements.")}>
        {r`-3 < -1 < 0 < 2 < 5`}
      </Equation>

      <H2>{tx(t, "mNL_setsTitle", "Kinds of numbers")}</H2>
      <p>
        {tx(t, "mNL_setsBody",
          "Each time an operation produces an answer the existing numbers cannot express, mathematics adds new numbers. Subtracting a bigger number from a smaller one (2 − 5) needs the negative numbers; together with the naturals they form the integers. Sharing 1 cake between 3 people needs fractions; all numbers that can be written as one integer divided by another (not zero) are the rational numbers. Some lengths are not even fractions: the diagonal of a square with side 1 is √2, and no fraction squared gives exactly 2. Filling in every such gap gives the real numbers, one for every point of the number line.")}
      </p>
      <LessonTable
        headers={[tx(t, "mNL_tSet", "Set"), tx(t, "mNL_tSym", "Symbol"), tx(t, "mNL_tEx", "Examples"), tx(t, "mNL_tAdds", "Adds"), tx(t, "mNL_tUse", "Everyday use")]}
        rows={[
          [tx(t, "mNL_n", "Natural numbers"), "ℕ", "0, 1, 2, 3, …", tx(t, "mNL_nA", "counting"), tx(t, "mNL_nU", "counting people, pages, steps")],
          [tx(t, "mNL_z", "Integers"), "ℤ", "…, −2, −1, 0, 1, 2, …", tx(t, "mNL_zA", "negatives: subtraction always works"), tx(t, "mNL_zU", "temperatures below zero, floors below ground, debts")],
          [tx(t, "mNL_q", "Rationals"), "ℚ", "1/2, −3/4, 0.125, 16/9", tx(t, "mNL_qA", "fractions: division (except by 0) always works"), tx(t, "mNL_qU", "half a pizza, ¾ of an hour, a price of 2.35")],
          [tx(t, "mNL_r", "Reals"), "ℝ", "√2, π, e, −0.1", tx(t, "mNL_rA", "the gaps: every point of the line"), tx(t, "mNL_rU", "lengths, areas, time, any measurement")],
        ]}
      />
      <Equation label={tx(t, "mNL_eqNest", "Each set contains the previous one")}
        where={[
          [r`\subset`, tx(t, "mNL_wSub", "\"is contained in\": every natural number is also an integer, every integer is also a rational (5 = 5/1), every rational is also a real")],
          [r`\in`, tx(t, "mNL_wIn", "\"is an element of\": −3 ∈ ℤ reads \"−3 is an integer\"; −3 ∉ ℕ reads \"−3 is not a natural number\"")],
        ]}
        note={tx(t, "mNL_eqNestNote", "Reals that are not rational are called irrational: √2, π, e. Their decimal expansions go on forever without repeating. In practice we write them rounded (√2 ≈ 1.414, π ≈ 3.1416), where ≈ means \"approximately equal to\". The exact value is the point on the line; the digits are only an address that gets more precise the more of them you write.")}>
        {r`\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R}`}
      </Equation>

      <H2>{tx(t, "mNL_opsTitle", "What the four operations mean")}</H2>
      <p>
        {tx(t, "mNL_opsBody",
          "Addition combines amounts: 3 + 4 is what you have after getting 3 and then 4 more. On the number line it is a move: start at 3, walk 4 units right. Subtraction undoes addition: 7 − 4 asks \"what do I add to 4 to get 7?\", and on the line it walks left. Multiplication is repeated addition: 3 × 4 = 4 + 4 + 4, three groups of four. On the line it stretches: the arrow from 0 to 4 becomes three times as long. Division undoes multiplication: 12 ÷ 4 asks \"what times 4 gives 12?\", which is the same as asking how many groups of 4 fit into 12, or how big each share is when 12 is split into 4 equal parts.")}
      </p>
      <LessonTable
        headers={[tx(t, "mNL_tOp", "Operation"), tx(t, "mNL_tRes", "Result is called"), tx(t, "mNL_tMeans", "Means"), tx(t, "mNL_tUndo", "Undone by")]}
        rows={[
          ["a + b", tx(t, "mNL_sum", "sum (a and b are terms)"), tx(t, "mNL_sumM", "move b to the right of a"), tx(t, "mNL_sumU", "subtracting b")],
          ["a − b", tx(t, "mNL_diff", "difference"), tx(t, "mNL_diffM", "move b to the left; how far from b to a"), tx(t, "mNL_diffU", "adding b")],
          ["a × b", tx(t, "mNL_prod", "product (a and b are factors)"), tx(t, "mNL_prodM", "a groups of b; stretch b by a"), tx(t, "mNL_prodU", "dividing by b (if b ≠ 0)")],
          ["a ÷ b", tx(t, "mNL_quot", "quotient (a is the dividend, b the divisor)"), tx(t, "mNL_quotM", "how many b fit in a; size of each of b equal shares"), tx(t, "mNL_quotU", "multiplying by b")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "mNL_div0", "Division by zero is not defined. 12 ÷ 0 would have to be a number that gives 12 when multiplied by 0, and no number does, because anything times 0 is 0. And 0 ÷ 0 fails the other way: every number times 0 gives 0, so no single answer exists. Zero divided by a number is fine, though: 0 ÷ 4 = 0, because 0 × 4 = 0. When a letter appears in a divisor, note which values make the divisor 0 and exclude them: 12 ÷ (x − 3) makes sense for every x except 3.")}
      </Callout>

      <H2>{tx(t, "mNL_negTitle", "Negative numbers and the sign rules")}</H2>
      <p>
        {tx(t, "mNL_negBody",
          "Every number a has an opposite, written −a: the point at the same distance from 0 on the other side. The opposite of 3 is −3 and the opposite of −3 is 3, so −(−3) = 3. The minus sign therefore has two jobs: between two numbers it means subtract, in front of one number it means \"the opposite of\". They are connected by the most useful rule about negatives: subtracting a number is the same as adding its opposite. Once you see subtraction as adding an opposite, every question about signs becomes a question about addition.")}
      </p>
      <Equation label={tx(t, "mNL_eqSub", "Subtraction is adding the opposite")}
        where={[
          [r`-b`, tx(t, "mNL_wOpp", "the opposite of b: same distance from 0, other side. b + (−b) = 0")],
          [r`a - b`, tx(t, "mNL_wSubt", "subtract b from a")],
        ]}
        note={tx(t, "mNL_eqSubNote", "Examples: 3 − 5 = 3 + (−5) = −2. 3 − (−5) = 3 + 5 = 8: removing a debt of 5 is the same as receiving 5. −3 − 5 = −3 + (−5) = −8: already 3 left of zero, walk 5 further left.")}>
        {r`a - b = a + (-b)`}
      </Equation>
      <H3>{tx(t, "mNL_addRuleTitle", "Adding signed numbers by hand")}</H3>
      <p>
        {tx(t, "mNL_addRuleBody",
          "Walking along the line always works, but for bigger numbers two rules are faster. Same signs: add the sizes and keep the common sign, so −8 + (−5) = −13 (two debts make a bigger debt). Different signs: subtract the smaller size from the larger and give the result the sign of the number with the larger size, so −8 + 5 = −3 (8 − 5 = 3, and −8 has the larger size) and 8 + (−5) = 3. For a subtraction, first rewrite it as adding the opposite, then apply these rules.")}
      </p>
      <LessonTable
        headers={[tx(t, "mNL_tCalc", "Calculation"), tx(t, "mNL_tRewrite", "Rewritten as a sum"), tx(t, "mNL_tRule", "Rule used"), tx(t, "mNL_tResult", "Result")]}
        rows={[
          ["−12 − 7", "−12 + (−7)", tx(t, "mNL_r1", "same signs: 12 + 7 = 19, keep −"), "−19"],
          ["−12 − (−7)", "−12 + 7", tx(t, "mNL_r2", "different signs: 12 − 7 = 5, sign of −12"), "−5"],
          ["4 − 15", "4 + (−15)", tx(t, "mNL_r3", "different signs: 15 − 4 = 11, sign of −15"), "−11"],
          ["−3 + 9 − 10", "(−3 + 9) + (−10)", tx(t, "mNL_r4", "left to right: −3 + 9 = 6, then 6 + (−10) = −4"), "−4"],
        ]}
      />
      <p>
        {tx(t, "mNL_signBody",
          "For multiplication, think of multiplying by a negative number as stretching and then flipping to the other side of 0. A positive times a positive stays positive. One flip makes the result negative. Two flips bring it back: a negative times a negative is positive. Division follows the same rules, since it is multiplication by a reciprocal. A handy check: count the minus signs in a product; an even number gives a positive result, an odd number a negative one.")}
      </p>
      <LessonTable
        headers={["×, ÷", tx(t, "mNL_tPos", "positive"), tx(t, "mNL_tNeg", "negative")]}
        rows={[
          [tx(t, "mNL_tPos", "positive"), tx(t, "mNL_pp", "positive: 3 × 4 = 12"), tx(t, "mNL_pn", "negative: 3 × (−4) = −12")],
          [tx(t, "mNL_tNeg", "negative"), tx(t, "mNL_np", "negative: (−3) × 4 = −12"), tx(t, "mNL_nn", "positive: (−3) × (−4) = 12")],
        ]}
      />

      <NumberLineFigure t={t} />

      <H2>{tx(t, "mNL_absTitle", "Absolute value and distance")}</H2>
      <p>
        {tx(t, "mNL_absBody",
          "Often only the size of a number matters, not its side: how far apart two towns on a straight road are, how big a measuring error was, how fast a car is moving regardless of direction. The absolute value |x| keeps the size and drops the sign: it is the distance from x to 0. From it comes the distance between any two numbers, which is the length of the gap between their points, and is never negative.")}
      </p>
      <Equation label={tx(t, "mNL_eqAbs", "Absolute value and distance on the line")}
        where={[
          [r`|x|`, tx(t, "mNL_wAbs", "the absolute value of x: x itself when x is 0 or positive, its opposite −x when x is negative. |−7| = −(−7) = 7")],
          [r`|a - b|`, tx(t, "mNL_wDist", "the distance between a and b. a − b is positive or negative depending on which is further right; the absolute value removes that. |2 − 7| = |−5| = 5 = |7 − 2|")],
        ]}
        note={tx(t, "mNL_eqAbsNote", "Two properties you will use: |a · b| = |a| · |b| (sizes multiply), and |a + b| ≤ |a| + |b|, the triangle inequality: the size of a sum is at most the sum of the sizes, equal only when a and b have the same sign. In 2D and 3D the same idea becomes the length of a vector.")}>
        {r`|x| = \begin{cases} x & \text{if } x \ge 0 \\ -x & \text{if } x < 0 \end{cases} \qquad d(a, b) = |a - b|`}
      </Equation>
      <p>
        {tx(t, "mNL_absUse",
          "Distance also turns \"close to\" into a precise statement. \"x is within 2 of 10\" means |x − 10| ≤ 2, which is every x from 8 to 12. A thermostat set to 20 °C that tolerates 1.5 degrees either way is satisfied exactly when |T − 20| ≤ 1.5, that is, for temperatures from 18.5 °C to 21.5 °C.")}
      </p>

      <H2>{tx(t, "mNL_lawsTitle", "The laws of arithmetic")}</H2>
      <p>
        {tx(t, "mNL_lawsBody",
          "A few rules hold for every number, and they are what make it legal to rearrange calculations, both in your head and in algebra. Order does not matter for + and × (commutative laws). Grouping does not matter for a chain of + or a chain of × (associative laws). Multiplication spreads over addition (distributive law). Adding 0 and multiplying by 1 change nothing (identities). Every number can be cancelled: by adding its opposite, or, if it is not 0, by multiplying by its reciprocal (inverses).")}
      </p>
      <Equation label={tx(t, "mNL_eqLaws", "The laws, for all numbers a, b, c")}
        where={[
          [r`a + b = b + a,\;\; ab = ba`, tx(t, "mNL_wComm", "commutative: swap freely. Subtraction and division are not commutative: 5 − 2 = 3 but 2 − 5 = −3")],
          [r`(a + b) + c = a + (b + c)`, tx(t, "mNL_wAssoc", "associative: regroup freely; the same holds for ×. Again not for − or ÷: (8 − 4) − 2 = 2 but 8 − (4 − 2) = 6")],
          [r`a(b + c) = ab + ac`, tx(t, "mNL_wDist", "distributive: multiplying a sum multiplies each term. Read right to left it is factoring, pulling out a common factor")],
          [r`a + 0 = a,\;\; a \cdot 1 = a`, tx(t, "mNL_wId", "identities: 0 is neutral for +, 1 is neutral for ×. Also a · 0 = 0 for every a")],
          [r`a + (-a) = 0,\;\; a \cdot \tfrac{1}{a} = 1`, tx(t, "mNL_wInv", "inverses: the opposite cancels addition; the reciprocal 1/a cancels multiplication, and exists only when a ≠ 0")],
        ]}
        note={tx(t, "mNL_eqLawsNote", "Mental arithmetic is these laws in action. 17 × 6 = 17 × (5 + 1) = 85 + 17 = 102 (distributive). 25 × 7 × 4 = 25 × 4 × 7 = 100 × 7 = 700 (commutative and associative). 3x + 5x = (3 + 5)x = 8x (distributive, backwards).")}>
        {r`a(b + c) = ab + ac`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "mNL_lawsTip", "The laws are what \"allowed\" means. A step that is one of these laws, or follows from them, never changes the value; a step that is not, such as swapping the two sides of a subtraction or regrouping a division, can. When unsure whether a rearrangement is legal, test it with small numbers first: if it fails for 8, 4 and 2, it is not a law.")}
      </Callout>

      <H2>{tx(t, "mNL_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mNL_ex1T", "A temperature drop")}</H3>
      <p>
        {tx(t, "mNL_ex1", "The morning starts at 4 °C and gets 11 degrees colder. 4 − 11 = 4 + (−11). Walk 4 units left to reach 0, then the remaining 7: the result is −7 °C. The change was −11, and the size of the change is |−11| = 11.")}
      </p>
      <H3>{tx(t, "mNL_ex2T", "Distance between two floors")}</H3>
      <p>
        {tx(t, "mNL_ex2", "A lift goes from floor −3 (three levels below ground) to floor 6. It travels |6 − (−3)| = |6 + 3| = 9 floors. Computed the other way, |−3 − 6| = |−9| = 9: the same, as it must be.")}
      </p>
      <H3>{tx(t, "mNL_ex3T", "Signs in a product")}</H3>
      <p>
        {tx(t, "mNL_ex3", "(−2) × 3 × (−5) × (−1): three minus signs, an odd number, so the result is negative. The sizes multiply: 2 × 3 × 5 × 1 = 30. Answer: −30.")}
      </p>

      <H2>{tx(t, "mNL_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mNL_tWrong", "Wrong"), tx(t, "mNL_tRight", "Right"), tx(t, "mNL_tWhy", "Why")]}
        rows={[
          ["−5 > −2", "−5 < −2", tx(t, "mNL_m1", "−5 is further left on the line; the bigger size does not make it bigger")],
          ["3 − (−2) = 1", "3 − (−2) = 5", tx(t, "mNL_m2", "subtracting a negative is adding its opposite: 3 + 2")],
          ["|a − b| = |a| − |b|", "|−3 − 2| = 5, |−3| − |2| = 1", tx(t, "mNL_m3", "absolute value does not distribute over subtraction (or addition)")],
          ["x ÷ 0 = 0", tx(t, "mNL_m4r", "undefined"), tx(t, "mNL_m4", "no number times 0 gives x; exclude the values that make a divisor 0")],
          ["2 − 5 = 5 − 2", "2 − 5 = −(5 − 2)", tx(t, "mNL_m5", "swapping a subtraction flips the sign of the result")],
        ]}
      />

      <H2>{tx(t, "mNL_trackTitle", "How this track is organised")}</H2>
      <p>
        {tx(t, "mNL_trackBody",
          "This track builds mathematics from arithmetic upward, the way it is done on paper: what each idea means, which steps are allowed, and how to calculate by hand. Every chapter follows the same pattern: the intuition first, then a precise definition with every symbol explained, an interactive figure, worked examples, common mistakes and the key ideas. The programming tracks (OpenGL, GLSL, Game Dev) show how these results are used in code and link back here for the mathematics.")}
      </p>
      <LessonTable
        headers={[tx(t, "mNL_tSection", "Section"), tx(t, "mNL_tTopics", "Topics")]}
        rows={[
          [tx(t, "mNL_s1t", "Arithmetic"), tx(t, "mNL_s1d", "the number line, order of operations, fractions and decimals, ratios and percentages, divisibility and primes, powers and roots, number bases")],
          [tx(t, "mNL_s2t", "Algebra"), tx(t, "mNL_s2d", "expressions, linear equations and inequalities, systems, quadratics, polynomials, functions, exponentials and logarithms, sequences")],
          [tx(t, "mNL_s3t", "Geometry and trigonometry"), tx(t, "mNL_s3d", "angles, triangles, Pythagoras, similarity, areas and volumes, circles, analytic geometry, transformations, the unit circle, identities, polar coordinates, waves")],
          [tx(t, "mNL_s4t", "Linear algebra"), tx(t, "mNL_s4d", "vectors, the dot and cross products, matrices, determinants, inverses, eigenvectors, complex numbers, quaternions")],
          [tx(t, "mNL_s5t", "Calculus"), tx(t, "mNL_s5d", "limits, derivatives and their rules, integrals, the fundamental theorem, series, partial derivatives and gradients, differential equations")],
          [tx(t, "mNL_s6t", "Probability and statistics"), tx(t, "mNL_s6d", "counting, probability, Bayes, random variables and distributions, expectation and variance, sampling, regression")],
        ]}
      />

      <KeyIdeas t={t} id="mNL" items={[
        "The number line places every real number: further right means greater, negatives mirror positives around 0.",
        "ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ: each set adds the numbers an operation needed (negatives, fractions, irrationals).",
        "Subtracting is adding the opposite: a − b = a + (−b). An odd number of minus signs in a product makes it negative.",
        "|x| is the distance from x to 0; |a − b| is the distance between a and b, and is never negative.",
        "Commutative, associative and distributive laws let you rearrange + and ×, never − or ÷.",
        "Division by zero is undefined; 0 divided by a nonzero number is 0.",
      ]} />
    </Article>
  );
}
