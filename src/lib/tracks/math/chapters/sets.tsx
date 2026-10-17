"use client";

// Logic & Proof 1: sets — what a set is, notation (roster, set-builder),
// membership, the empty set, equality; subsets and the power set (2ⁿ);
// union, intersection, difference, complement; the laws of set algebra and
// De Morgan; the number sets and intervals; ordered pairs and the cartesian
// product; counting with inclusion–exclusion; infinite sets compared by
// pairing (ℕ and the evens, ℚ countable, ℝ uncountable by the diagonal).

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { VennFigure } from "@/components/lesson/figures/math/VennFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formula: multiples of a or b up to N ────────────────────────────────

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
function multiplesNumbers(v: Record<string, number>) {
  const { N, a, b } = v, l = (a * b) / gcd(a, b);
  const na = Math.floor(N / a), nb = Math.floor(N / b), nab = Math.floor(N / l);
  return {
    tex: r`\left\lfloor \tfrac{${N}}{${a}} \right\rfloor + \left\lfloor \tfrac{${N}}{${b}} \right\rfloor - \left\lfloor \tfrac{${N}}{${l}} \right\rfloor = ${na} + ${nb} - ${nab} = \green{${na + nb - nab}}`,
    meter: (na + nb - nab) / N, meterLabel: `${na + nb - nab} / ${N}`,
  };
}

export function SetsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mSet_intro",
          "A set is a collection of things, considered as one object. That sounds too simple to need a chapter, but sets are the language the rest of mathematics is written in: the domain of a function, the solutions of an equation, the outcomes of a dice roll, the points of a plane are all sets. This chapter gives the notation, the operations and their laws, a way of counting with overlaps, and a first look at infinity, where comparing sizes gets surprising.")}
      </Lead>

      <Goals t={t} id="mSet" items={[
        "Read and write sets in roster and set-builder notation, and use ∈, ⊆ and ∅.",
        "Compute unions, intersections, differences and complements, and draw them as Venn diagrams.",
        "Use the laws of set algebra, De Morgan's laws and inclusion–exclusion.",
        "Form cartesian products and power sets, and compare infinite sets by pairing.",
      ]} />

      <H2>{tx(t, "mSet_whatTitle", "What a set is")}</H2>
      <p>
        {tx(t, "mSet_whatBody",
          "A set is determined by its elements, nothing else. Writing the elements between braces is the roster notation: {2, 3, 5, 7} is the set of primes below 10. Order does not matter and repeats do not count, so {3, 2, 2, 5, 7} is the same set. Two sets are equal exactly when they have the same elements. Membership is written with ∈: 3 ∈ {2, 3, 5, 7} (\"3 is an element of\"), 4 ∉ {2, 3, 5, 7}. The set with no elements at all is the empty set, ∅ or {}. The number of elements of a finite set A is its cardinality, |A|.")}
      </p>
      <p>
        {tx(t, "mSet_builderBody",
          "Listing is impossible for big or infinite sets, so set-builder notation describes the elements by a rule instead: {x ∈ ℤ | x² < 10} reads \"the set of integers x such that x² < 10\", which is {−3, −2, −1, 0, 1, 2, 3}. The part before the bar says where x comes from, the part after says which ones to keep. Some books write a colon instead of the bar.")}
      </p>
      <Equation label={tx(t, "mSet_eqBuilder", "Set-builder notation")}
        where={[
          [r`x \in S`, tx(t, "mSet_wS", "x runs through the set S (here the integers ℤ)")],
          [r`\mid`, tx(t, "mSet_wBar", "\"such that\"")],
          [r`P(x)`, tx(t, "mSet_wP", "the condition that decides whether x is kept")],
        ]}
        words={tx(t, "mSet_builderWords", "All the x from S for which the condition is true.")}>
        {r`\{\,x \in S \mid P(x)\,\} \qquad \text{e.g.}\quad \{\,x \in \mathbb{Z} \mid x^2 < 10\,\} = \{-3, \dots, 3\}`}
      </Equation>

      <H2>{tx(t, "mSet_subTitle", "Subsets and the power set")}</H2>
      <p>
        {tx(t, "mSet_subBody",
          "A is a subset of B, written A ⊆ B, when every element of A is also in B. {2, 3} ⊆ {1, 2, 3}. Every set is a subset of itself, and ∅ is a subset of every set (it has no element that could fail to be in B). To prove A = B one usually proves A ⊆ B and B ⊆ A separately. The power set P(A) is the set of all subsets of A. A set with n elements has 2ⁿ subsets: building a subset means deciding, for each element, in or out, which is n independent yes/no choices. It also follows from the binomial theorem, since the subsets with k elements number C(n, k) and their total is (1 + 1)ⁿ.")}
      </p>
      <Equation label={tx(t, "mSet_eqPower", "Counting subsets")}
        where={[
          [r`\mathcal{P}(A)`, tx(t, "mSet_wPow", "the power set: the set of all subsets of A")],
          [r`\binom{n}{k}`, tx(t, "mSet_wChoose", "the number of subsets with exactly k elements")],
        ]}
        note={tx(t, "mSet_powerNote", "A = {a, b, c}: the 8 subsets are ∅, {a}, {b}, {c}, {a, b}, {a, c}, {b, c}, {a, b, c}, that is 1 + 3 + 3 + 1.")}>
        {r`|\mathcal{P}(A)| = 2^{|A|} = \sum_{k=0}^{n} \binom{n}{k}`}
      </Equation>

      <H2>{tx(t, "mSet_opsTitle", "Operations")}</H2>
      <p>
        {tx(t, "mSet_opsBody",
          "Four operations build new sets from old. The union A ∪ B holds what is in A or in B (or both: \"or\" in mathematics is never exclusive). The intersection A ∩ B holds what is in both. The difference A − B (also written A \\ B) holds what is in A but not in B. And when all the sets in a discussion live inside a fixed universe U, the complement Aᶜ holds everything in U that is not in A. Two sets with an empty intersection are called disjoint.")}
      </p>
      <LessonTable
        headers={[tx(t, "mSet_tOp", "Operation"), tx(t, "mSet_tSym", "Symbol"), tx(t, "mSet_tDef", "x belongs when…"), tx(t, "mSet_tEx", "A = {1, 2, 3, 4}, B = {3, 4, 5}")]}
        rows={[
          [tx(t, "mSet_o1", "union"), "A ∪ B", tx(t, "mSet_o1d", "x ∈ A or x ∈ B"), "{1, 2, 3, 4, 5}"],
          [tx(t, "mSet_o2", "intersection"), "A ∩ B", tx(t, "mSet_o2d", "x ∈ A and x ∈ B"), "{3, 4}"],
          [tx(t, "mSet_o3", "difference"), "A − B", tx(t, "mSet_o3d", "x ∈ A and x ∉ B"), "{1, 2}"],
          [tx(t, "mSet_o4", "complement (U = {1, …, 6})"), "Aᶜ", tx(t, "mSet_o4d", "x ∈ U and x ∉ A"), "{5, 6}"],
          [tx(t, "mSet_o5", "symmetric difference"), "A △ B", tx(t, "mSet_o5d", "in exactly one of them"), "{1, 2, 5}"],
        ]}
      />
      <VennFigure t={t} />

      <H3>{tx(t, "mSet_lawsTitle", "The laws of set algebra")}</H3>
      <p>
        {tx(t, "mSet_lawsBody",
          "Union and intersection behave much like addition and multiplication: both are commutative and associative, and intersection distributes over union. Unlike numbers, union also distributes over intersection. The most useful pair are De Morgan's laws, which say how a complement passes through a union or an intersection: it flips one into the other.")}
      </p>
      <Equation label={tx(t, "mSet_eqLaws", "Distributive laws and De Morgan's laws")}
        where={[
          [r`\cap,\ \cup`, tx(t, "mSet_wCapCup", "intersection (\"and\") and union (\"or\")")],
          [r`^{c}`, tx(t, "mSet_wComp", "complement within the universe U")],
        ]}
        words={tx(t, "mSet_lawsWords", "Not in A or B means: not in A and not in B. Not in both means: missing from at least one.")}>
        {r`A \cap (B \cup C) = (A \cap B) \cup (A \cap C) \qquad (A \cup B)^c = A^c \cap B^c \qquad (A \cap B)^c = A^c \cup B^c`}
      </Equation>
      <Derivation t={t} label={tx(t, "mSet_eqDM", "Proving (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ, element by element")}
        steps={[
          { full: true, tex: r`x \in (A \cup B)^c`, why: tx(t, "mSet_d1", "take any element of the left side") },
          { full: true, tex: r`\iff x \notin A \cup B`, why: tx(t, "mSet_d2", "definition of the complement") },
          { full: true, tex: r`\iff \text{not } (x \in A \text{ or } x \in B)`, why: tx(t, "mSet_d3", "definition of the union") },
          { full: true, tex: r`\iff x \notin A \text{ and } x \notin B`, why: tx(t, "mSet_d4", "\"not (p or q)\" is \"not p and not q\" (De Morgan for logic, next chapter)") },
          { full: true, tex: r`\iff \green{x \in A^c \cap B^c}`, why: tx(t, "mSet_d5", "definitions of complement and intersection; every step went both ways, so the sets are equal") },
        ]} />

      <H2>{tx(t, "mSet_numTitle", "The number sets")}</H2>
      <p>
        {tx(t, "mSet_numBody",
          "The number systems of the Arithmetic section are sets, each inside the next. ℕ = {0, 1, 2, …} are the natural numbers (some authors start at 1). ℤ = {…, −2, −1, 0, 1, 2, …} the integers, from the German Zahlen. ℚ the rationals, fractions p/q of integers with q ≠ 0, from \"quotient\". ℝ the reals, every point of the number line, including √2 and π. ℂ the complex numbers of the Linear Algebra section. Intervals are subsets of ℝ: [a, b] includes both ends, (a, b) excludes them, and [a, b) includes only a.")}
      </p>
      <Equation label={tx(t, "mSet_eqNum", "The number sets, nested")}
        where={[
          [r`\mathbb{N}\subset\mathbb{Z}`, tx(t, "mSet_wNZ", "every natural number is an integer, but −1 is not natural")],
          [r`\mathbb{Q}\subset\mathbb{R}`, tx(t, "mSet_wQR", "every fraction is a real number, but √2 is not a fraction (proved in the proofs chapter)")],
        ]}>
        {r`\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R} \subset \mathbb{C}`}
      </Equation>

      <H2>{tx(t, "mSet_prodTitle", "Ordered pairs and the cartesian product")}</H2>
      <p>
        {tx(t, "mSet_prodBody",
          "In a set, order does not matter: {1, 2} = {2, 1}. Often it must: a point (3, 5) is not the point (5, 3). An ordered pair (a, b) records a first and a second entry. The cartesian product A × B is the set of all ordered pairs with the first entry from A and the second from B, named after Descartes, whose coordinate plane is exactly ℝ × ℝ = ℝ². Each element of A pairs with each element of B, so the sizes multiply.")}
      </p>
      <Equation label={tx(t, "mSet_eqProd", "The cartesian product")}
        where={[
          [r`(a, b)`, tx(t, "mSet_wPair", "an ordered pair: (a, b) = (c, d) only when a = c and b = d")],
          [r`|A|\,|B|`, tx(t, "mSet_wSize", "one pair for every choice of a and of b")],
        ]}
        note={tx(t, "mSet_prodNote", "{H, T} × {1, …, 6}: the 12 outcomes of tossing a coin and rolling a die.")}>
        {r`A \times B = \{\,(a, b) \mid a \in A,\ b \in B\,\} \qquad |A \times B| = |A|\,|B|`}
      </Equation>

      <H2>{tx(t, "mSet_ieTitle", "Counting with overlaps: inclusion–exclusion")}</H2>
      <p>
        {tx(t, "mSet_ieBody",
          "Adding |A| and |B| counts the elements of the overlap twice, once in each set. Subtracting |A ∩ B| once fixes it. With three sets the pairwise overlaps are subtracted, but then the elements in all three have been added three times and subtracted three times, so they are added back once. The pattern continues, alternating signs: include, exclude, include. The Probability chapter uses exactly the same rule for P(A or B).")}
      </p>
      <Equation label={tx(t, "mSet_eqIE", "Inclusion–exclusion")}
        where={[
          [r`|A \cap B|`, tx(t, "mSet_wOverlap", "the overlap, counted twice by |A| + |B|")],
          [r`|A \cap B \cap C|`, tx(t, "mSet_wTriple", "the elements in all three: added 3 times, removed 3 times, so added back once")],
        ]}>
        {r`|A \cup B| = |A| + |B| - |A \cap B| \qquad |A \cup B \cup C| = |A| + |B| + |C| - |A\cap B| - |A\cap C| - |B\cap C| + |A\cap B\cap C|`}
      </Equation>
      <LiveFormula label={tx(t, "mSet_liveMult", "Try it: numbers up to N divisible by a or by b")}
        tex={r`|A \cup B| = \left\lfloor \frac{N}{a} \right\rfloor + \left\lfloor \frac{N}{b} \right\rfloor - \left\lfloor \frac{N}{\operatorname{lcm}(a,b)} \right\rfloor`}
        vars={[
          { id: "N", label: "N", min: 10, max: 1000, step: 10, value: 100, fmt: v => String(v) },
          { id: "a", label: "a", min: 2, max: 12, step: 1, value: 2, fmt: v => String(v) },
          { id: "b", label: "b", min: 2, max: 12, step: 1, value: 3, fmt: v => String(v) },
        ]}
        compute={multiplesNumbers}
        note={tx(t, "mSet_liveMultNote", "⌊N/a⌋ counts the multiples of a up to N (the floor ⌊ ⌋ rounds down). A number divisible by both a and b is divisible by their lcm, which is why the lcm is subtracted. Up to 100: 50 + 33 − 16 = 67 numbers are divisible by 2 or 3. Try a = 4, b = 6: the overlap is the multiples of 12, not of 24.")} />

      <H2>{tx(t, "mSet_infTitle", "Comparing infinite sets")}</H2>
      <p>
        {tx(t, "mSet_infBody",
          "Two finite sets have the same size when their elements can be paired off one to one with none left over: that is what counting is. Georg Cantor used the same test for infinite sets, and found surprises. The even numbers are a part of ℕ, yet n ↔ 2n pairs them perfectly with ℕ, so there are \"as many\" evens as natural numbers. A set that can be listed as a first, second, third… element is called countable. ℤ is countable (0, 1, −1, 2, −2, …), and so, more surprisingly, is ℚ: list the fractions by the size of p + q.")}
      </p>
      <p>
        {tx(t, "mSet_diagBody",
          "But ℝ is not countable. Suppose someone claims a complete list of the reals between 0 and 1, written as decimals. Build a new number: its first decimal digit differs from the first digit of the first number on the list, its second differs from the second digit of the second number, and so on down the diagonal (use 5 where the digit is not 5, and 4 where it is). This number differs from every number on the list in at least one place, so the list was not complete. No list can be. There are strictly more real numbers than natural numbers: infinities come in different sizes.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mSet_paradoxTip", "Sets cannot be anything at all. Bertrand Russell asked about \"the set of all sets that are not members of themselves\": it is a member of itself exactly when it is not. Modern set theory avoids this by only building sets from existing ones (for example with set-builder notation always choosing x from a set S that already exists).")}
      </Callout>

      <H2>{tx(t, "mSet_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mSet_ex1", "1. In a class of 30, 18 study French, 12 study German and 5 study both. Studying at least one: 18 + 12 − 5 = 25. Neither: 30 − 25 = 5.")}</p>
      <p>{tx(t, "mSet_ex2", "2. {x ∈ ℝ | x² − 5x + 6 = 0} = {2, 3}, the roots of the quadratic. {x ∈ ℝ | x² < 0} = ∅.")}</p>
      <p>{tx(t, "mSet_ex3", "3. A = {1, 2}, B = {x, y, z}: A × B = {(1, x), (1, y), (1, z), (2, x), (2, y), (2, z)}, 2 · 3 = 6 pairs. B × A has 6 pairs too, but different ones: (x, 1) ≠ (1, x).")}</p>
      <H3>{tx(t, "mSet_ex4Title", "Three overlapping sets")}</H3>
      <p>{tx(t, "mSet_ex4", "4. Numbers from 1 to 100 divisible by 2, 3 or 5: 50 + 33 + 20 − 16 − 10 − 6 + 3 = 74. So 26 numbers are divisible by none of them (they are 1 and the numbers whose prime factors are all 7 or more).")}</p>

      <MathPracticeFigure t={t} set="setCounting" />

      <H2>{tx(t, "mSet_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mSet_tWrong", "Wrong"), tx(t, "mSet_tRight", "Right"), tx(t, "mSet_tWhy", "Why")]}
        rows={[
          [tx(t, "mSet_m1w", "∅ = {∅}"), tx(t, "mSet_m1r", "∅ has no element, {∅} has one"), tx(t, "mSet_m1", "a box holding an empty box is not empty")],
          [tx(t, "mSet_m2w", "2 ⊆ {1, 2}"), "2 ∈ {1, 2}, {2} ⊆ {1, 2}", tx(t, "mSet_m2", "∈ is for elements, ⊆ for sets")],
          [tx(t, "mSet_m3w", "|A ∪ B| = |A| + |B|"), tx(t, "mSet_m3r", "subtract |A ∩ B|"), tx(t, "mSet_m3", "only true for disjoint sets")],
          [tx(t, "mSet_m4w", "(A ∪ B)ᶜ = Aᶜ ∪ Bᶜ"), "Aᶜ ∩ Bᶜ", tx(t, "mSet_m4", "the complement swaps ∪ and ∩")],
          [tx(t, "mSet_m5w", "{1, 2} = (1, 2)"), tx(t, "mSet_m5r", "a set ignores order, a pair does not"), "{1, 2} = {2, 1}, (1, 2) ≠ (2, 1)"],
        ]}
      />

      <KeyIdeas t={t} id="mSet" items={[
        "A set is determined by its elements; order and repeats do not matter. ∈ is membership, ⊆ is subset, ∅ is the empty set.",
        "Set-builder notation {x ∈ S | P(x)} keeps the elements of S that satisfy P.",
        "A set with n elements has 2ⁿ subsets.",
        "Union = or, intersection = and, difference = and not, complement = not.",
        "De Morgan: (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ and (A ∩ B)ᶜ = Aᶜ ∪ Bᶜ.",
        "|A ∪ B| = |A| + |B| − |A ∩ B|; with more sets, alternate the signs.",
        "|A × B| = |A||B|. Infinite sets are compared by pairing: ℕ, ℤ and ℚ are countable, ℝ is not.",
      ]} />
    </Article>
  );
}
