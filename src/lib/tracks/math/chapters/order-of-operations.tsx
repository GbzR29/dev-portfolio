"use client";

// Arithmetic 2: the order of operations — why a convention is needed, the
// precedence levels, left-to-right chains, powers and the minus sign,
// expressions as trees, and how C++ applies (and extends) the same rules.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ExpressionTreeFigure } from "@/components/lesson/figures/math/ExpressionTreeFigure";

const r = String.raw;

export function OrderOfOperationsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mOrd_intro",
          "What is 2 + 3 × 4? Working left to right gives 5 × 4 = 20; doing the multiplication first gives 2 + 12 = 14. Both readings are reasonable, so mathematics needs an agreement about which one is meant, and everyone, from textbooks to calculators to the C++ compiler, uses the same one: the answer is 14. This chapter explains that agreement, where it comes from, how to see any expression as a tree that makes the order obvious, and the places where code adds rules of its own.")}
      </Lead>

      <H2>{tx(t, "mOrd_whyTitle", "Why a convention is needed")}</H2>
      <p>
        {tx(t, "mOrd_whyBody",
          "An expression is a recipe written on one line: numbers joined by operations. A line has no room to show which operation should happen first, so without an agreed rule the same line can mean different recipes. Parentheses remove all doubt, (2 + 3) × 4 or 2 + (3 × 4), but writing them everywhere would be tiring. The order of operations is the rule that says where the invisible parentheses are when you leave them out.")}
      </p>
      <p>
        {tx(t, "mOrd_whyBody2",
          "The rule is not arbitrary. Multiplication is repeated addition, so 3 × 4 is one quantity, \"three fours\", and it should be finished before it takes part in a sum, just as you would read \"2 apples plus 3 boxes of 4 apples\" as 2 + 12. Powers are repeated multiplication, so by the same logic they bind even tighter. Each level is a shorthand for many operations of the level below, and a shorthand is evaluated as one unit.")}
      </p>

      <H2>{tx(t, "mOrd_rulesTitle", "The rules")}</H2>
      <LessonTable
        headers={[tx(t, "mOrd_tLevel", "Level"), tx(t, "mOrd_tOps", "Operations"), tx(t, "mOrd_tHow", "How"), tx(t, "mOrd_tEx", "Example")]}
        rows={[
          ["1", tx(t, "mOrd_l1", "parentheses ( ), brackets [ ], fraction bars, root signs"), tx(t, "mOrd_l1h", "innermost first; each is evaluated to one number"), "(2 + 3) × 4 = 5 × 4 = 20"],
          ["2", tx(t, "mOrd_l2", "powers and roots: x², √x"), tx(t, "mOrd_l2h", "a chain of powers goes right to left"), "2 × 3² = 2 × 9 = 18"],
          ["3", tx(t, "mOrd_l3", "multiplication and division: ×, ÷"), tx(t, "mOrd_l3h", "same level; left to right"), "12 ÷ 3 × 2 = 4 × 2 = 8"],
          ["4", tx(t, "mOrd_l4", "addition and subtraction: +, −"), tx(t, "mOrd_l4h", "same level; left to right"), "10 − 4 + 3 = 6 + 3 = 9"],
        ]}
      />
      <p>
        {tx(t, "mOrd_mnemonic",
          "Schools teach mnemonics such as PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction) or BODMAS (Brackets, Orders, Division/Multiplication, Addition/Subtraction). Their one trap is the letter order: M before D does not mean multiplication before division. They share a level and are done left to right, and the same goes for A and S.")}
      </p>
      <Equation label={tx(t, "mOrd_eqLR", "Same level: left to right")}
        where={[
          [r`a - b + c`, tx(t, "mOrd_wLR1", "means (a − b) + c. 10 − 4 + 3 = 9, not 10 − 7 = 3")],
          [r`a \div b \times c`, tx(t, "mOrd_wLR2", "means (a ÷ b) × c. 12 ÷ 3 × 2 = 8, not 12 ÷ 6 = 2")],
          [r`a \div b \div c`, tx(t, "mOrd_wLR3", "means (a ÷ b) ÷ c = a ÷ (b × c). 8 ÷ 4 ÷ 2 = 1, not 8 ÷ 2 = 4")],
        ]}
        note={tx(t, "mOrd_eqLRNote", "Why left to right is safe: a − b + c is a + (−b) + c, a pure sum, and sums can be regrouped freely. Likewise a ÷ b × c is a × (1/b) × c. Rewriting subtractions as additions of opposites and divisions as multiplications by reciprocals removes the need to remember any direction at all.")}>
        {r`10 - 4 + 3 = (10 - 4) + 3 = 9`}
      </Equation>

      <H3>{tx(t, "mOrd_powTitle", "Powers and the minus sign")}</H3>
      <p>
        {tx(t, "mOrd_powBody",
          "A power applies only to the thing directly in front of it. In 2 × 3² only the 3 is squared. That includes a leading minus sign: −3² means −(3²) = −9, because the minus is \"multiply by −1\" and the power comes first. To square the negative number you must write (−3)² = 9. Chains of powers are the one place where the order is right to left: 2^3^2 means 2^(3^2) = 2⁹ = 512, not (2³)² = 64, because (2³)² can already be written more simply as 2⁶.")}
      </p>
      <Equation label={tx(t, "mOrd_eqPow", "What a power applies to")}
        where={[
          [r`-3^2 = -(3^2) = -9`, tx(t, "mOrd_wNeg", "the square is taken first, then the sign is applied")],
          [r`(-3)^2 = (-3)(-3) = 9`, tx(t, "mOrd_wNegP", "the parentheses make −3 the base, so the minus sign is squared too")],
          [r`2^{3^2} = 2^{9} = 512`, tx(t, "mOrd_wTower", "a tower of powers is read from the top down")],
        ]}>
        {r`-3^2 \neq (-3)^2`}
      </Equation>

      <H3>{tx(t, "mOrd_hiddenTitle", "Hidden parentheses")}</H3>
      <p>
        {tx(t, "mOrd_hiddenBody",
          "Some notations group without printing parentheses. A fraction bar groups everything above it and everything below it: (2 + 4)/(1 + 2) written as a stacked fraction is 6/3 = 2. A root sign groups everything under it: √(9 + 16) = √25 = 5, not √9 + √16 = 7. An exponent written raised groups everything in the raised position: 2 to the power (x + 1). When you type such formulas into code or a calculator on one line, you must add those parentheses yourself, and forgetting them is one of the most common bugs.")}
      </p>
      <Equation label={tx(t, "mOrd_eqBar", "A fraction bar is a pair of parentheses")}
        where={[
          [r`\frac{a + b}{c + d}`, tx(t, "mOrd_wBar", "the numerator and the denominator are each computed first, then divided")],
          [r`(a + b) / (c + d)`, tx(t, "mOrd_wLine", "the same thing on one line. a + b / c + d would mean a + (b/c) + d")],
        ]}>
        {r`\frac{a + b}{c + d} = (a + b) \div (c + d)`}
      </Equation>

      <H2>{tx(t, "mOrd_treeTitle", "Expressions are trees")}</H2>
      <p>
        {tx(t, "mOrd_treeBody",
          "The clearest way to see what an expression means is to draw it as a tree. Each operation is a node with its two operands hanging below it; plain numbers are the leaves. The operation evaluated last sits at the top (the root), and the ones that bind tightest sit lowest. Evaluating means working from the leaves upward: an operation can be done as soon as both of its operands are numbers. This is not just a picture. Compilers and calculators really do parse expressions into such trees (called syntax trees) and then evaluate or translate them bottom-up.")}
      </p>

      <ExpressionTreeFigure t={t} />

      <p>
        {tx(t, "mOrd_treeBody2",
          "Parentheses change the shape of the tree, and that is all they do. In 2 + 3 × 4 the × node sits under the + node; in (2 + 3) × 4 it is the other way round. The rules of precedence are simply the rules for building the tree from a flat line of symbols. When the tree is unclear to you, it is unclear to the next reader of your code too: add the parentheses.")}
      </p>

      <H2>{tx(t, "mOrd_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mOrd_ex1T", "A full evaluation")}</H3>
      <Equation label={tx(t, "mOrd_eqEx1", "One step per line")}
        notes={[
          tx(t, "mOrd_ex1a", "parentheses first: 7 − 3 = 4"),
          tx(t, "mOrd_ex1b", "then the power: 4² = 16"),
          tx(t, "mOrd_ex1c", "then × and ÷, left to right: 5 × 2 = 10, and 16 ÷ 8 = 2 followed by 2 × 3 = 6"),
          tx(t, "mOrd_ex1d", "finally + and −, left to right: 20 − 10 = 10, then 10 + 6 = 16"),
        ]}>
        {r`20 - 5 \times 2 + (7 - 3)^2 \div 8 \times 3 = 20 - 10 + 16 \div 8 \times 3 = 20 - 10 + 6 = 16`}
      </Equation>
      <p>
        {tx(t, "mOrd_ex1Body",
          "The trick for long expressions: first find the terms, the pieces separated by + and − at the top level (outside every parenthesis). Here they are 20, 5 × 2 and (7 − 3)² ÷ 8 × 3. Compute each term on its own, then add and subtract them from left to right: 20 − 10 + 6 = 16.")}
      </p>
      <H3>{tx(t, "mOrd_ex2T", "Damage with a multiplier")}</H3>
      <p>
        {tx(t, "mOrd_ex2",
          "A sword deals a base 10 damage plus 4 from strength, and a critical hit doubles the damage. Written as 10 + 4 × 2 the result is 18: only the strength bonus was doubled. The designer meant (10 + 4) × 2 = 28. Whenever a multiplier should apply to a sum, the sum needs parentheses.")}
      </p>
      <H3>{tx(t, "mOrd_ex3T", "An average")}</H3>
      <p>
        {tx(t, "mOrd_ex3",
          "The average of 4, 8 and 9 is (4 + 8 + 9) ÷ 3 = 21 ÷ 3 = 7. Typed as 4 + 8 + 9 / 3 it becomes 4 + 8 + 3 = 15, because the division only takes the 9. On paper the fraction bar hid the parentheses; on one line you must write them.")}
      </p>

      <H2>{tx(t, "mOrd_codeTitle", "Order of operations in C++")}</H2>
      <p>
        {tx(t, "mOrd_codeBody",
          "C++ uses the same order for the arithmetic operators: *, / and % bind tighter than + and −, and each level is left to right. It has no power operator: ^ is bitwise XOR, so 2 ^ 3 is 1, not 8. Powers are written std::pow(2.0, 3.0) or, for small integer powers, x * x. C++ also has many operators mathematics does not, and some of their precedences surprise people: the comparison == binds tighter than the bitwise &, and << (shift) binds looser than +.")}
      </p>
      <CodeBlock lang="cpp" filename="precedence.cpp" t={t}>{`int a = 2 + 3 * 4;         // 14: * before +
int b = (2 + 3) * 4;       // 20
int c = 12 / 3 * 2;        // 8:  left to right, (12 / 3) * 2
int d = 2 ^ 3;             // 1!  ^ is XOR, not a power
double e = std::pow(2.0, 3.0);   // 8.0
float  sq = x * x;         // x², faster and exact for small powers

float avg = (a + b + c) / 3.0f;   // parentheses: the fraction bar is not there in code

// Precedence traps outside arithmetic
if (flags & MASK == MASK)  { }    // parsed as flags & (MASK == MASK): wrong
if ((flags & MASK) == MASK) { }   // what was meant
int k = 1 << 2 + 1;               // 1 << 3 = 8, because + binds tighter than <<
bool ok = x > 0 && y > 0 || z;    // && before ||: (x > 0 && y > 0) || z`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "mOrd_tip", "Nobody remembers all 17 levels of C++ precedence, and nobody should have to. The rule professionals follow: rely on precedence only for the arithmetic everyone learned in school (× before +). For anything else, bitwise operators, shifts, mixing && with ||, add parentheses. Compilers even warn about some of these (GCC and Clang's -Wparentheses).")}
      </Callout>

      <H2>{tx(t, "mOrd_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mOrd_tWrong", "Wrong"), tx(t, "mOrd_tRight", "Right"), tx(t, "mOrd_tWhy", "Why")]}
        rows={[
          ["2 + 3 × 4 = 20", "2 + 3 × 4 = 14", tx(t, "mOrd_m1", "× before +")],
          ["12 ÷ 3 × 2 = 2", "12 ÷ 3 × 2 = 8", tx(t, "mOrd_m2", "× and ÷ share a level: left to right")],
          ["−3² = 9", "−3² = −9", tx(t, "mOrd_m3", "the power applies to 3 only; write (−3)² to square −3")],
          ["a + b / 2", "(a + b) / 2", tx(t, "mOrd_m4", "the midpoint needs the sum computed first")],
          ["2 ^ 10 == 1024", "(1 << 10) == 1024", tx(t, "mOrd_m5", "in C++ ^ is XOR; powers of two are shifts or std::pow")],
          ["√(a² + b²) = a + b", "√(3² + 4²) = 5 ≠ 7", tx(t, "mOrd_m6", "a root sign groups its whole contents; roots do not split over +")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "mOrd_viral", "The viral puzzles like 6 ÷ 2(1 + 2) are ambiguous on purpose. By the strict rules, 2(1 + 2) is 2 × (1 + 2), and left to right gives 6 ÷ 2 × 3 = 9. But many people, and some calculators, treat a multiplication written without a sign as binding tighter, giving 6 ÷ 6 = 1. The lesson is not which answer is right. It is that well-written mathematics, and well-written code, never depends on that question: write 6 / (2 × 3) or (6 / 2) × 3.")}
      </Callout>

      <KeyIdeas t={t} id="mOrd" items={[
        "Parentheses, then powers, then × and ÷, then + and −.",
        "Operations on the same level go left to right; only chains of powers go right to left.",
        "A power binds only to what is directly before it: −3² = −9, (−3)² = 9.",
        "Fraction bars and root signs are invisible parentheses; add real ones when writing on one line.",
        "Every expression is a tree; evaluation goes from the leaves up, and parentheses change the tree.",
        "In C++, ^ is XOR, and bitwise and logical operators have surprising precedence: parenthesise.",
      ]} />
    </Article>
  );
}
