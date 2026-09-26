"use client";

// Probability & Statistics 1: counting — listing and tree diagrams; the
// multiplication and addition principles; restrictions handled first;
// factorials and permutations (0! = 1); combinations as permutations divided
// by k!; symmetry; Pascal's rule and the binomial theorem; grid paths; the
// order/repetition table; repetition: sequences, multisets (stars and bars),
// words with repeated letters; circular arrangements; inclusion–exclusion.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { CountingFigure } from "@/components/lesson/figures/math/CountingFigure";
import { PascalFigure } from "@/components/lesson/figures/math/PascalFigure";

const r = String.raw;

export function CountingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mCnt_intro",
          "Probability starts with counting. When every outcome of an experiment is equally likely, the probability of an event is the number of outcomes in it divided by the number of outcomes altogether. Counting a few outcomes is easy: just list them. But how many ways can a lottery draw six numbers from sixty, or ten people sit in a row? Listing fails long before those answers, which run into millions. This chapter builds the counting tools that the rest of the Probability & Statistics section uses: the multiplication principle, permutations, combinations, Pascal's triangle and inclusion–exclusion.")}
      </Lead>

      <H2>{tx(t, "mCnt_multTitle", "The multiplication principle")}</H2>
      <p>
        {tx(t, "mCnt_multBody",
          "You own 3 shirts and 4 pairs of trousers. How many outfits can you make? For each shirt there are 4 trousers to go with it, so 3 groups of 4: 3 · 4 = 12. A tree diagram shows why: the first level branches 3 ways (the shirt), and every branch splits again 4 ways (the trousers), so there are 12 leaves at the end. Add 2 pairs of shoes and every one of the 12 leaves splits into 2: 24 outfits.")}
      </p>
      <Equation label={tx(t, "mCnt_eqMult", "The multiplication principle")}
        where={[
          [r`k`, tx(t, "mCnt_wK", "the number of choices made one after another (the stages)")],
          [r`n_i`, tx(t, "mCnt_wNi", "the number of options at stage i, which must be the same whatever was chosen at the earlier stages")],
          [r`N`, tx(t, "mCnt_wN", "the number of complete results: different sequences of choices")],
        ]}
        note={tx(t, "mCnt_multNote", "The options at a stage may change with earlier choices, but their number must not. That is all the principle needs.")}>
        {r`N = n_1 \cdot n_2 \cdot \ldots \cdot n_k`}
      </Equation>
      <p>
        {tx(t, "mCnt_plateBody",
          "A code made of 3 letters followed by 4 digits: 26 options for each letter and 10 for each digit, so 26 · 26 · 26 · 10 · 10 · 10 · 10 = 26³ · 10⁴ = 17 576 · 10 000 = 175 760 000 codes. A four-digit PIN: 10⁴ = 10 000. The answer grows quickly because every new stage multiplies everything that came before.")}
      </p>
      <H3>{tx(t, "mCnt_restrTitle", "Restrictions: deal with the fussy stage first")}</H3>
      <p>
        {tx(t, "mCnt_restrBody",
          "How many four-digit numbers have four different digits? A four-digit number cannot start with 0, so the first digit has 9 options (1 to 9). The second may be anything except the first: 10 − 1 = 9 options (0 is allowed now). The third avoids the two used digits: 8. The fourth: 7. Total 9 · 9 · 8 · 7 = 4536. Had we started with the last digit, its number of options would depend on whether 0 had been used already, and the principle would not apply directly. Rule of thumb: fill the most restricted position first.")}
      </p>
      <H3>{tx(t, "mCnt_addTitle", "The addition principle")}</H3>
      <p>
        {tx(t, "mCnt_addBody",
          "If a task can be done in one way OR another, and no way belongs to both groups, add. To travel between two cities you can take one of 3 buses or one of 2 trains: 3 + 2 = 5 ways. \"And then\" (one choice followed by another) multiplies; \"or\" (one kind of choice instead of the other) adds. When the two groups overlap, adding counts the overlap twice; inclusion–exclusion, at the end of the chapter, repairs that.")}
      </p>

      <H2>{tx(t, "mCnt_permTitle", "Permutations: arranging in order")}</H2>
      <p>
        {tx(t, "mCnt_factBody",
          "In how many orders can 5 different books stand on a shelf? Any of the 5 can go first, then any of the remaining 4, then 3, then 2, then the last one: 5 · 4 · 3 · 2 · 1 = 120. This product has a name, n factorial, written n!. An ordering of all n items is a permutation, and there are n! of them.")}
      </p>
      <LessonTable
        headers={["n", "0", "1", "2", "3", "4", "5", "6", "7", "8", "10"]}
        rows={[["n!", "1", "1", "2", "6", "24", "120", "720", "5040", "40 320", "3 628 800"]]}
      />
      <p>
        {tx(t, "mCnt_zeroBody",
          "Why is 0! = 1? Two reasons that agree. Going down the table, each factorial is the next one divided by its n: 3! = 4!/4, 2! = 3!/3, 1! = 2!/2, so 0! = 1!/1 = 1. And there is exactly one way to arrange nothing: do nothing. Factorials grow faster than any power: a deck of 52 cards can be shuffled into 52! ≈ 8.07 × 10⁶⁷ orders, so a well-shuffled deck is almost certainly in an order no deck has ever been in before.")}
      </p>
      <p>
        {tx(t, "mCnt_pnkBody",
          "Often only some of the items are arranged. Eight runners race; how many ways can gold, silver and bronze be awarded? 8 options for gold, 7 for silver, 6 for bronze: 8 · 7 · 6 = 336. The product stops after k factors. Multiplying and dividing by the missing tail 5 · 4 · 3 · 2 · 1 = 5! writes it with factorials: 8!/5!.")}
      </p>
      <Equation label={tx(t, "mCnt_eqPerm", "Arrangements of k items out of n")}
        where={[
          [r`n`, tx(t, "mCnt_wNperm", "the number of different items available")],
          [r`k`, tx(t, "mCnt_wKperm", "how many are placed in order, each at most once (k ≤ n)")],
          [r`n!`, tx(t, "mCnt_wFact", "n factorial: n · (n − 1) · … · 2 · 1, with 0! = 1")],
        ]}
        note={tx(t, "mCnt_permNote", "With k = n this is n!/0! = n!, all the orders of all the items.")}>
        {r`P(n, k) = n\,(n-1)\cdots(n-k+1) = \frac{n!}{(n-k)!}`}
      </Equation>
      <p>
        {tx(t, "mCnt_roundBody",
          "Around a round table only the order around the table matters, not who sits \"first\": turning everyone one seat to the left changes nothing. Fix one person's seat to remove the turning; the other n − 1 are then arranged in a row. Six people around a table: 5! = 120 arrangements, not 720.")}
      </p>

      <H2>{tx(t, "mCnt_combTitle", "Combinations: choosing without order")}</H2>
      <p>
        {tx(t, "mCnt_combBody",
          "Now choose a committee of 3 from the same 8 people. A committee has no gold or silver: the committee {Ana, Bruno, Carla} is the same whichever order they were picked in. The 336 ordered picks count each committee once for every order of its 3 members, which is 3! = 6 times. So there are 336 / 6 = 56 committees. That is the whole idea of a combination: count in order, then divide by the number of orders of each group.")}
      </p>
      <Equation label={tx(t, "mCnt_eqComb", "Combinations: subsets of size k")}
        where={[
          [r`\binom{n}{k}`, tx(t, "mCnt_wBinom", "read \"n choose k\", also written C(n, k): the number of groups of k items out of n, order ignored")],
          [r`\frac{n!}{(n-k)!}`, tx(t, "mCnt_wOrdered", "the ordered picks, P(n, k)")],
          [r`k!`, tx(t, "mCnt_wKfact", "the number of orders of one group, which were all counted separately")],
        ]}
        note={tx(t, "mCnt_combNote", "By hand, cancel before multiplying: C(8, 3) = (8 · 7 · 6)/(3 · 2 · 1) = 336/6 = 56. The top has k factors counting down from n, the bottom k factors counting down from k.")}>
        {r`\binom{n}{k} = \frac{P(n,k)}{k!} = \frac{n!}{k!\,(n-k)!}`}
      </Equation>
      <p>
        {tx(t, "mCnt_lottoBody",
          "A lottery draws 6 numbers out of 60 and the order of the draw does not matter. C(60, 6) = (60 · 59 · 58 · 57 · 56 · 55)/(6 · 5 · 4 · 3 · 2 · 1) = 36 045 979 200/720 = 50 063 860. One ticket is one of about fifty million equally likely sets.")}
      </p>
      <p>
        {tx(t, "mCnt_symBody",
          "Symmetry: C(n, k) = C(n, n − k). Choosing 3 people to go on a trip is the same as choosing the 5 who stay behind, so C(8, 3) = C(8, 5) = 56. The formula agrees: swapping k and n − k only swaps the two factorials in the denominator. This saves work: C(100, 98) = C(100, 2) = 100 · 99/2 = 4950. The end cases: C(n, 0) = C(n, n) = 1 (one way to choose nothing, one way to choose everything), and C(n, 1) = n.")}
      </p>

      <CountingFigure t={t} />

      <H2>{tx(t, "mCnt_pascalTitle", "Pascal's triangle and the binomial theorem")}</H2>
      <p>
        {tx(t, "mCnt_ruleBody",
          "Here is a way to find C(n, k) with additions only. Single out one of the n items, say Ana. Every group of k either contains Ana or not. Groups with Ana: choose her partners, k − 1 from the other n − 1: C(n − 1, k − 1). Groups without Ana: all k from the other n − 1: C(n − 1, k). The two kinds do not overlap, so add them. Write the numbers in rows, each row starting and ending with 1, and every inner number is the sum of the two above it: Pascal's triangle.")}
      </p>
      <Equation label={tx(t, "mCnt_eqPascal", "Pascal's rule")}
        where={[
          [r`\binom{n-1}{k-1}`, tx(t, "mCnt_wWith", "groups that contain the singled-out item")],
          [r`\binom{n-1}{k}`, tx(t, "mCnt_wWithout", "groups that leave it out")],
        ]}>
        {r`\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}`}
      </Equation>
      <p>
        {tx(t, "mCnt_binomBody",
          "The same numbers appear when a sum is raised to a power. (a + b)³ = (a + b)(a + b)(a + b): multiplying out means picking a or b from each of the 3 brackets and multiplying the picks. The term a²b comes from choosing b in exactly 1 of the 3 brackets, which can be done in C(3, 1) = 3 ways, so its coefficient is 3. In general the coefficient of aⁿ⁻ᵏbᵏ counts the ways to choose which k brackets give b.")}
      </p>
      <Equation label={tx(t, "mCnt_eqBinom", "The binomial theorem")}
        where={[
          [r`\sum_{k=0}^{n}`, tx(t, "mCnt_wSum", "add the terms for k = 0, 1, …, n")],
          [r`\binom{n}{k}`, tx(t, "mCnt_wCoef", "the binomial coefficient: entry k of row n of Pascal's triangle")],
          [r`a^{n-k}\,b^{k}`, tx(t, "mCnt_wTerm", "b chosen from k brackets, a from the other n − k; the powers always add up to n")],
        ]}
        note={tx(t, "mCnt_binomNote", "Row 4 is 1 4 6 4 1, so (a + b)⁴ = a⁴ + 4a³b + 6a²b² + 4ab³ + b⁴. With a = 2x, b = 1 and n = 3: (2x + 1)³ = 8x³ + 3 · 4x² + 3 · 2x + 1 = 8x³ + 12x² + 6x + 1.")}>
        {r`(a+b)^n = \sum_{k=0}^{n} \binom{n}{k}\,a^{\,n-k}\,b^{\,k}`}
      </Equation>
      <p>
        {tx(t, "mCnt_rowSumBody",
          "Put a = b = 1: 2ⁿ = C(n, 0) + C(n, 1) + … + C(n, n). Each row adds up to a power of 2. That is also a count: a subset of n items is built by deciding in or out for each item, 2 options n times, 2ⁿ subsets, and grouping them by size gives the row. And a counting puzzle in disguise: walking on a street grid from one corner to the corner 4 blocks east and 3 blocks north, always east or north, every route is a word of 7 moves with 3 N's, so there are C(7, 3) = 35 shortest routes.")}
      </p>

      <PascalFigure t={t} />

      <H2>{tx(t, "mCnt_repTitle", "When items may repeat")}</H2>
      <p>
        {tx(t, "mCnt_seqBody",
          "With repetition allowed and order mattering, every one of the k positions has all n options again: nᵏ sequences, as with the PIN (10⁴). Order ignored with repetition allowed is less obvious. An ice-cream shop has 5 flavours and you want 3 scoops in a cup, repeats allowed, order irrelevant. Picture the flavours as boxes in a row, separated by 4 bars, and each scoop as a star in its box: ★★|★|||, for instance, is two scoops of flavour 1 and one of flavour 2. Every cup is exactly one row of 3 stars and 4 bars, 7 symbols in all, and the row is fixed by choosing which 3 of the 7 places hold stars: C(7, 3) = 35 cups.")}
      </p>
      <Equation label={tx(t, "mCnt_eqStars", "Stars and bars: multisets")}
        where={[
          [r`n`, tx(t, "mCnt_wNstars", "the number of kinds to choose from (boxes), which need n − 1 bars between them")],
          [r`k`, tx(t, "mCnt_wKstars", "the number of items chosen (stars); any kind may be chosen many times or never")],
        ]}
        note={tx(t, "mCnt_starsNote", "The same count solves x + y + z = 10 in whole numbers x, y, z ≥ 0: 10 stars, 2 bars, C(12, 2) = 66 solutions.")}>
        {r`\binom{n+k-1}{k}`}
      </Equation>
      <p>
        {tx(t, "mCnt_wordBody",
          "Words with repeated letters. BANANA has 6 letters, so 6! = 720 orders if all letters were different. But swapping the three A's among themselves gives the same word, and so does swapping the two N's; each distinct word was counted 3! · 2! · 1! = 12 times. So there are 720/12 = 60 distinct words. MISSISSIPPI: 11 letters with I four times, S four times, P twice and M once: 11!/(4! · 4! · 2! · 1!) = 39 916 800/1152 = 34 650.")}
      </p>
      <p>{tx(t, "mCnt_tableBody", "Every problem in this chapter answers two questions: does the order matter, and may an item repeat? The four answers give four formulas:")}</p>
      <LessonTable
        headers={["", tx(t, "mCnt_tRep", "repetition allowed"), tx(t, "mCnt_tNoRep", "no repetition")]}
        rows={[
          [tx(t, "mCnt_tOrder", "order matters"), tx(t, "mCnt_tSeq", "nᵏ (sequences: PIN codes)"), tx(t, "mCnt_tPerm", "n!/(n − k)! (arrangements: podiums)")],
          [tx(t, "mCnt_tNoOrder", "order does not matter"), tx(t, "mCnt_tMulti", "C(n + k − 1, k) (multisets: ice cream)"), tx(t, "mCnt_tComb", "C(n, k) (subsets: committees)")],
        ]}
      />

      <H2>{tx(t, "mCnt_ieTitle", "Inclusion–exclusion: counting overlaps once")}</H2>
      <p>
        {tx(t, "mCnt_ieBody",
          "How many whole numbers from 1 to 100 are divisible by 2 or by 3? There are 50 multiples of 2 and 33 multiples of 3 (100/3 = 33.3…, rounded down), but 50 + 33 = 83 is too many: the multiples of 6 (6, 12, …, 96, which is 16 numbers) are in both lists and were counted twice. Subtract them once: 50 + 33 − 16 = 67. With three sets, add the three sizes, subtract the three pairwise overlaps, and add back the triple overlap, which the subtraction removed once too often.")}
      </p>
      <Equation label={tx(t, "mCnt_eqIE", "Inclusion–exclusion")}
        where={[
          [r`|A|`, tx(t, "mCnt_wSize", "the number of elements of the set A")],
          [r`A \cup B`, tx(t, "mCnt_wUnion", "the union: elements in A or in B (or both)")],
          [r`A \cap B`, tx(t, "mCnt_wInter", "the intersection: elements in both A and B")],
        ]}
        note={tx(t, "mCnt_ieNote", "Divisible by 2, 3 or 5 among 1 to 100: 50 + 33 + 20 − 16 − 10 − 6 + 3 = 74. The 16, 10 and 6 are the multiples of 6, 10 and 15, and the 3 are the multiples of 30.")}>
        {r`\begin{aligned} |A \cup B| &= |A| + |B| - |A \cap B| \ |A \cup B \cup C| &= |A| + |B| + |C| - |A\cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C| \end{aligned}`}
      </Equation>
      <Callout type="tip" t={t}>
        {tx(t, "mCnt_complTip", "\"At least one\" is usually easier through the complement: count everything, then subtract the cases with none. Committees of 5 from 6 women and 4 men with at least one man: C(10, 5) = 252 committees in all, of which C(6, 5) = 6 have no man, so 252 − 6 = 246.")}
      </Callout>

      <H2>{tx(t, "mCnt_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mCnt_ex1", "1. Passwords of 6 lowercase letters: 26⁶ = 308 915 776. With no letter repeated: 26 · 25 · 24 · 23 · 22 · 21 = 165 765 600, a bit more than half.")}</p>
      <p>{tx(t, "mCnt_ex2", "2. A committee of 5 from 6 women and 4 men with exactly 3 women: choose the women, C(6, 3) = 20, and then the 2 men, C(4, 2) = 6. The two choices are stages, so multiply: 20 · 6 = 120.")}</p>
      <p>{tx(t, "mCnt_ex3", "3. Five-card hands from a 52-card deck: C(52, 5) = (52 · 51 · 50 · 49 · 48)/120 = 311 875 200/120 = 2 598 960.")}</p>
      <p>{tx(t, "mCnt_ex4", "4. Seven books on a shelf with two particular ones side by side: glue the two into one block. Now 6 things are arranged, 6! = 720 ways, and the block itself has 2! = 2 internal orders: 1440.")}</p>
      <p>{tx(t, "mCnt_ex5", "5. Diagonals of an octagon: every pair of the 8 corners gives a segment, C(8, 2) = 28, and 8 of those segments are sides: 28 − 8 = 20 diagonals.")}</p>
      <p>{tx(t, "mCnt_ex6", "6. Handshakes when 10 people all shake hands once: one handshake per pair, C(10, 2) = 45.")}</p>

      <H2>{tx(t, "mCnt_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mCnt_tWrong", "Wrong"), tx(t, "mCnt_tRight", "Right"), tx(t, "mCnt_tWhy", "Why")]}
        rows={[
          [tx(t, "mCnt_m1w", "committees of 3 from 8: 8 · 7 · 6 = 336"), "336/3! = 56", tx(t, "mCnt_m1", "a committee has no order; each one was counted 3! times")],
          [tx(t, "mCnt_m2w", "four-digit numbers with distinct digits: 10 · 9 · 8 · 7"), "9 · 9 · 8 · 7 = 4536", tx(t, "mCnt_m2", "the first digit cannot be 0; place the restricted digit first")],
          ["0! = 0", "0! = 1", tx(t, "mCnt_m3", "one way to arrange nothing; it keeps n! = n · (n − 1)! true for n = 1")],
          [tx(t, "mCnt_m4w", "\"at least one man\": C(4, 1) · C(9, 4) = 504"), "252 − 6 = 246", tx(t, "mCnt_m4", "choosing \"the\" man first counts a committee with two men twice; use the complement")],
          [tx(t, "mCnt_m5w", "divisible by 2 or 3: 50 + 33 = 83"), "50 + 33 − 16 = 67", tx(t, "mCnt_m5", "the multiples of 6 were counted twice")],
          [tx(t, "mCnt_m6w", "adding the options of stages done one after another"), tx(t, "mCnt_m6r", "multiply for \"and then\", add for \"or\""), tx(t, "mCnt_m6", "each option of stage 1 combines with every option of stage 2")],
        ]}
      />

      <KeyIdeas t={t} id="mCnt" items={[
        "Choices made one after another multiply; alternatives that cannot both happen add.",
        "n different items can be ordered in n! ways; arranging k of them gives n!/(n − k)!.",
        "Ignoring order divides by k!: C(n, k) = n!/(k!(n − k)!), and C(n, k) = C(n, n − k).",
        "Pascal's rule C(n, k) = C(n − 1, k − 1) + C(n − 1, k) builds the triangle; its rows are the coefficients of (a + b)ⁿ and add up to 2ⁿ.",
        "Order? Repetition? The four answers give nᵏ, n!/(n − k)!, C(n + k − 1, k) and C(n, k).",
        "Repeated letters: divide n! by the factorial of each repeat count.",
        "Inclusion–exclusion subtracts overlaps once; \"at least one\" is often easier as total minus none.",
      ]} />
    </Article>
  );
}
