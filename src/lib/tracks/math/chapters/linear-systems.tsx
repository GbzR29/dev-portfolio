"use client";

// Algebra 5: systems of linear equations — what a solution of a system is,
// the graphical view as crossing lines, substitution, elimination, the three
// possible outcomes, Cramer's rule and the determinant, three unknowns, and
// line intersection in C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { LinesFigure } from "@/components/lesson/figures/math/LinesFigure";

const r = String.raw;

export function LinearSystemsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mSys_intro",
          "One equation can pin down one unknown. Real problems often have several unknowns tied together by several conditions: where do two paths cross, what mix of two potions gives exactly the effect you want, which point lies on two walls at once. A set of equations that must all be true at the same time is a system. This chapter solves systems of two linear equations in two unknowns in three ways (by graph, substitution and elimination), shows why some have no solution or infinitely many, and turns it all into a formula and into code.")}
      </Lead>

      <H2>{tx(t, "mSys_whatTitle", "What a system is")}</H2>
      <p>
        {tx(t, "mSys_whatBody",
          "A single equation with two unknowns, like x + y = 10, has infinitely many solutions: (3, 7), (0, 10), (12.5, −2.5)… every pair that adds to 10. A second condition, say x − y = 4, also has infinitely many. The solution of the system is the pair that satisfies both at once, here (7, 3): 7 + 3 = 10 and 7 − 3 = 4. The curly brace groups the equations and means \"and\".")}
      </p>
      <Equation label={tx(t, "mSys_eqForm", "A system of two linear equations")}
        where={[
          [r`x,\ y`, tx(t, "mSys_wXY", "the two unknowns; the solution is a pair (x, y)")],
          [r`a, b, c, d`, tx(t, "mSys_wCoef", "the coefficients, known numbers multiplying the unknowns")],
          [r`e, f`, tx(t, "mSys_wRhs", "the right-hand sides, also known numbers")],
        ]}>
        {r`\begin{cases} a\,x + b\,y = e \\ c\,x + d\,y = f \end{cases}`}
      </Equation>

      <H2>{tx(t, "mSys_graphTitle", "The picture: two lines")}</H2>
      <p>
        {tx(t, "mSys_graphBody",
          "Every linear equation in x and y describes a straight line: the set of all points (x, y) that make it true. (Solving a x + b y = e for y gives y = (e − a x)/b, a linear function with slope −a/b, as in the functions chapter.) A solution of the system must lie on both lines, so it is where they cross. Two lines in a plane can cross once, never (parallel), or everywhere (the same line), and that is the whole story of what can happen.")}
      </p>

      <LinesFigure t={t} />

      <H2>{tx(t, "mSys_subTitle", "Method 1: substitution")}</H2>
      <p>
        {tx(t, "mSys_subBody",
          "Solve one equation for one unknown, then substitute that expression into the other equation. The other equation then has only one unknown, and you already know how to solve that. Finally put the value back to find the second unknown. Substitution is best when one equation already has a lone x or y with coefficient 1.")}
      </p>
      <Equation label={tx(t, "mSys_eqSub", "Substitution on x + y = 10, x − y = 4")}
        notes={[
          tx(t, "mSys_s1", "solve the first equation for x: x = 10 − y"),
          tx(t, "mSys_s2", "substitute into the second: (10 − y) − y = 4, so 10 − 2y = 4"),
          tx(t, "mSys_s3", "solve: −2y = −6, so y = 3"),
          tx(t, "mSys_s4", "back-substitute: x = 10 − 3 = 7. Check both equations: 7 + 3 = 10 ✓, 7 − 3 = 4 ✓"),
        ]}>
        {r`x = 10 - y \;\to\; (10 - y) - y = 4 \;\to\; y = 3,\; x = 7`}
      </Equation>

      <H2>{tx(t, "mSys_elimTitle", "Method 2: elimination")}</H2>
      <p>
        {tx(t, "mSys_elimBody",
          "If two equations are true, their sum is true too (you add equal things to equal things), and so is any multiple of one of them. Elimination uses that: multiply the equations by numbers chosen so that one unknown has opposite coefficients, then add them, and that unknown vanishes. This is the method computers use (as Gaussian elimination), because it works the same way for any number of equations.")}
      </p>
      <Equation label={tx(t, "mSys_eqElim", "Elimination on 2x + 3y = 12, 5x − 2y = 11")}
        notes={[
          tx(t, "mSys_e1", "to eliminate y, make its coefficients +6 and −6: multiply the first equation by 2 and the second by 3"),
          tx(t, "mSys_e2", "4x + 6y = 24 and 15x − 6y = 33"),
          tx(t, "mSys_e3", "add them: 19x = 57, so x = 3"),
          tx(t, "mSys_e4", "back into the first equation: 6 + 3y = 12, so y = 2. Check the second: 15 − 4 = 11 ✓"),
        ]}>
        {r`\begin{array}{rcl} 4x + 6y &=& 24 \\ 15x - 6y &=& 33 \\ \hline 19x &=& 57 \end{array} \quad\Rightarrow\quad x = 3,\; y = 2`}
      </Equation>
      <Callout type="tip" t={t}>
        {tx(t, "mSys_whichTip", "Which method? Substitution when a coefficient is 1 or −1 (nothing to divide), elimination otherwise. Both always give the same answer; they are the same algebra in a different order. Graphing is for understanding and for a rough estimate, not for exact values.")}
      </Callout>

      <H2>{tx(t, "mSys_casesTitle", "One, none or infinitely many")}</H2>
      <p>
        {tx(t, "mSys_casesBody",
          "When you eliminate and both unknowns disappear, the system is not an ordinary one. If you are left with a false statement like 0 = 5, the lines are parallel: they have the same slope but different intercepts, so no point lies on both. If you are left with 0 = 0, the two equations were the same line in disguise (one is a multiple of the other), and every point on it is a solution.")}
      </p>
      <LessonTable
        headers={[tx(t, "mSys_tSystem", "System"), tx(t, "mSys_tAfter", "After eliminating"), tx(t, "mSys_tLines", "Lines"), tx(t, "mSys_tSol", "Solutions")]}
        rows={[
          ["x + y = 10,  x − y = 4", "2x = 14", tx(t, "mSys_c1", "cross"), tx(t, "mSys_c1s", "one: (7, 3)")],
          ["x + y = 2,  2x + 2y = 9", "0 = 5", tx(t, "mSys_c2", "parallel"), tx(t, "mSys_c2s", "none")],
          ["x + y = 2,  3x + 3y = 6", "0 = 0", tx(t, "mSys_c3", "the same"), tx(t, "mSys_c3s", "infinitely many: every (x, 2 − x)")],
        ]}
      />

      <H2>{tx(t, "mSys_cramerTitle", "A formula: Cramer's rule")}</H2>
      <p>
        {tx(t, "mSys_cramerBody",
          "Doing elimination once with letters instead of numbers gives a formula for any 2 × 2 system. Multiply the first equation by d and the second by b and subtract: the y terms cancel and (ad − bc)x = ed − bf. Similarly for y. The number ad − bc appears in both denominators; it is called the determinant of the system. If it is 0, the formula divides by zero, and that happens exactly when the lines are parallel or identical: the figure shows it in its readout.")}
      </p>
      <Equation label={tx(t, "mAlg_eqCramer", "Cramer's rule for two equations")}
        where={[
          [r`a x + b y = e`, tx(t, "mAlg_wEq1", "the first equation")],
          [r`c x + d y = f`, tx(t, "mAlg_wEq2", "the second equation")],
          [r`ad - bc`, tx(t, "mAlg_wDet", "the determinant; if it is 0 the lines are parallel and the formula divides by zero")],
        ]}
        note={tx(t, "mSys_cramerNote", "Check with 2x + 3y = 12, 5x − 2y = 11: ad − bc = 2(−2) − 3 · 5 = −19. x = (12(−2) − 3 · 11)/(−19) = −57/−19 = 3, and y = (2 · 11 − 12 · 5)/(−19) = −38/−19 = 2 ✓.")}>
        {r`x = \frac{e\,d - b\,f}{a\,d - b\,c}, \qquad y = \frac{a\,f - e\,c}{a\,d - b\,c}`}
      </Equation>
      <p>
        {tx(t, "mSys_detBody",
          "The determinant will return in the linear algebra section, where the coefficients a, b, c, d become a 2 × 2 matrix and ad − bc turns out to measure how much that matrix scales areas. A zero determinant means the matrix squashes the plane onto a line, which is the geometric reason there is no unique solution.")}
      </p>

      <H3>{tx(t, "mSys_threeTitle", "Three unknowns")}</H3>
      <p>
        {tx(t, "mSys_threeBody",
          "With three unknowns you need three equations. Each linear equation in x, y, z is a plane in 3D, and the solution is the point where all three planes meet. The method is the same elimination, applied twice: use two pairs of equations to eliminate the same unknown, which leaves a 2 × 2 system; solve it; then back-substitute. For larger systems this procedure, organised in a table of coefficients, is Gaussian elimination, and it is what numerical libraries run under the hood.")}
      </p>
      <Equation label={tx(t, "mSys_eq3", "A 3 × 3 example")}
        notes={[
          tx(t, "mSys_t1", "add the first two equations: z cancels, 3x + y = 9"),
          tx(t, "mSys_t2", "subtract the first from the third: z cancels again, x + 2y = 8"),
          tx(t, "mSys_t3", "solve the 2 × 2 system 3x + y = 9, x + 2y = 8: x = 2, y = 3"),
          tx(t, "mSys_t4", "back into the first equation: 2 + 3 + z = 6, so z = 1"),
        ]}>
        {r`\begin{cases} x + y + z = 6 \\ 2x - z = 3 \\ 2x + 3y + z = 14 \end{cases} \;\Rightarrow\; (x, y, z) = (2, 3, 1)`}
      </Equation>

      <H2>{tx(t, "mSys_exTitle", "Worked example: a word problem")}</H2>
      <p>
        {tx(t, "mSys_ex1",
          "A shop sells small potions for 3 gold and large ones for 8 gold. A player bought 11 potions for 58 gold. How many of each? Let s be the number of small and l the number of large potions. Counting potions: s + l = 11. Counting gold: 3s + 8l = 58. Substitute s = 11 − l into the second: 33 − 3l + 8l = 58, so 5l = 25, l = 5 and s = 6. Check: 6 + 5 = 11 ✓ and 18 + 40 = 58 ✓. Two unknowns needed two independent facts; with only the total count, the problem would have had many answers.")}
      </p>

      <H2>{tx(t, "mSys_codeTitle", "Intersecting lines in C++")}</H2>
      <p>
        {tx(t, "mSys_codeBody",
          "Line–line intersection is one of the most common geometry routines in games: laser beams against walls, mouse picking in 2D, clipping. Written with Cramer's rule, it is a handful of multiplications, with one check for the parallel case. The tolerance compares the determinant to a small number instead of exactly 0, because floats almost never produce an exact zero.")}
      </p>
      <CodeBlock lang="cpp" filename="lines.hpp" t={t}>{`#include <optional>
#include <cmath>

struct Vec2 { float x, y; };

// Solves  a·x + b·y = e,  c·x + d·y = f.  No value if the lines are parallel.
std::optional<Vec2> solve2x2(float a, float b, float c, float d, float e, float f) {
    float det = a * d - b * c;
    if (std::abs(det) < 1e-8f) return std::nullopt;   // parallel or the same line
    return Vec2{ (e * d - b * f) / det, (a * f - e * c) / det };
}

// Line through p1, p2 as  a·x + b·y = e  (a normal vector (a, b) and a constant)
void lineOf(Vec2 p1, Vec2 p2, float& a, float& b, float& e) {
    a = p2.y - p1.y;
    b = p1.x - p2.x;
    e = a * p1.x + b * p1.y;
}`}</CodeBlock>

      <H2>{tx(t, "mSys_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mSys_tWrong", "Wrong"), tx(t, "mSys_tRight", "Right"), tx(t, "mSys_tWhy", "Why")]}
        rows={[
          [tx(t, "mSys_m1w", "stopping after finding x"), tx(t, "mSys_m1r", "back-substitute for y"), tx(t, "mSys_m1", "the solution is a pair (x, y)")],
          [tx(t, "mSys_m2w", "multiplying only one side of an equation"), tx(t, "mSys_m2r", "multiply every term on both sides"), tx(t, "mSys_m2", "otherwise it is a different equation")],
          [tx(t, "mSys_m3w", "adding equations without matching coefficients"), tx(t, "mSys_m3r", "scale first so one unknown cancels"), tx(t, "mSys_m3", "nothing is eliminated otherwise")],
          [tx(t, "mSys_m4w", "checking in only one equation"), tx(t, "mSys_m4r", "check in both"), tx(t, "mSys_m4", "every point on one line satisfies that equation")],
          ["det == 0.0f", "abs(det) < ε", tx(t, "mSys_m5", "rounding makes nearly parallel lines give a tiny, non-zero determinant and a huge, useless answer")],
        ]}
      />

      <KeyIdeas t={t} id="mSys" items={[
        "A system's solution satisfies every equation at once: for two lines, their crossing point.",
        "Substitution: solve one equation for an unknown and plug it into the other.",
        "Elimination: scale and add equations so one unknown cancels.",
        "0 = number (false) means parallel lines, no solution; 0 = 0 means the same line.",
        "Cramer: x = (ed − bf)/(ad − bc), y = (af − ec)/(ad − bc); ad − bc = 0 means no unique solution.",
        "n unknowns need n independent equations; elimination scales to any size.",
      ]} />
    </Article>
  );
}
