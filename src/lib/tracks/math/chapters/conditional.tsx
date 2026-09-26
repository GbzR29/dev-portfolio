"use client";

// Probability & Statistics 3: conditional probability and Bayes — new
// information shrinks the sample space; P(A | B) = P(A ∩ B)/P(B); the
// multiplication rule and tree diagrams (drawing without replacement);
// independence, versus mutually exclusive, pairwise versus mutual, the
// gambler's fallacy; the law of total probability; Bayes' theorem with the
// medical test in natural frequencies, the base rate, odds form and a second
// test; Monty Hall; two-children puzzles.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { CardFigure } from "@/components/lesson/figures/math/CardFigure";
import { BayesFigure } from "@/components/lesson/figures/math/BayesFigure";

const r = String.raw;

export function ConditionalContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mCond_intro",
          "Probabilities change when we learn something. The chance that a card is a king is 4/52, but if you glimpse that it is a face card, it becomes 4/12. The chance that a patient has a disease depends on whether a test came back positive, and by how much is one of the most misunderstood questions in everyday reasoning. This chapter defines conditional probability, uses it to multiply probabilities along the branches of a tree, defines independence precisely, and arrives at Bayes' theorem: the rule for turning evidence into updated probabilities.")}
      </Lead>

      <H2>{tx(t, "mCond_defTitle", "New information shrinks the sample space")}</H2>
      <p>
        {tx(t, "mCond_defBody",
          "Roll two dice. The chance that the sum is 8 is 5/36: the outcomes (2,6), (3,5), (4,4), (5,3), (6,2). Now suppose you are told that the first die shows 3. Only the 6 outcomes (3,1), …, (3,6) are still possible, all still equally likely, and exactly one of them, (3,5), has sum 8. So the probability of \"sum 8\" given \"first die 3\" is 1/6. Knowing B happened does two things: outcomes outside B are thrown away, and the ones inside B are rescaled so that they add up to 1 again. The favourable outcomes are now those of A that are also in B.")}
      </p>
      <Equation label={tx(t, "mCond_eqDef", "Conditional probability")}
        where={[
          [r`P(A \mid B)`, tx(t, "mCond_wAgB", "the probability of A given B: how likely A is once we know that B happened (the bar reads \"given\")")],
          [r`P(A \cap B)`, tx(t, "mCond_wAB", "the probability that both happen: the part of A that survives inside B")],
          [r`P(B)`, tx(t, "mCond_wB", "the probability of the condition, which must not be 0; dividing by it rescales B to total probability 1")],
        ]}
        note={tx(t, "mCond_defNote", "With equally likely outcomes the 1/|Ω| cancels, leaving a count: P(A | B) = |A ∩ B| / |B|. B has become the new sample space.")}>
        {r`P(A \mid B) = \frac{P(A \cap B)}{P(B)}`}
      </Equation>
      <p>
        {tx(t, "mCond_orderBody",
          "The order matters: P(A | B) and P(B | A) are different questions. P(sum 8 | first die 3) = 1/6, but P(first die 3 | sum 8) = 1/5, because among the 5 outcomes with sum 8 exactly one starts with 3. Likewise P(face card | king) = 1, since every king is a face card, while P(king | face card) = 4/12 = 1/3.")}
      </p>

      <CardFigure t={t} />

      <H2>{tx(t, "mCond_multTitle", "The multiplication rule and trees")}</H2>
      <p>
        {tx(t, "mCond_multBody",
          "Multiply the definition by P(B) and it becomes a way to compute \"both\": P(A ∩ B) = P(B) · P(A | B). First B must happen, and then, in the world where B has happened, A must happen too. This is the natural tool for experiments that run in stages. Draw two cards from a deck without putting the first back. P(both aces) = P(first ace) · P(second ace | first ace) = 4/52 · 3/51 = 12/2652 = 1/221. After one ace is gone, 3 aces are left among 51 cards; that is what the conditional probability records.")}
      </p>
      <Equation label={tx(t, "mCond_eqMult", "The multiplication rule")}
        where={[
          [r`P(A_1)`, tx(t, "mCond_wA1", "the probability of the first stage's result")],
          [r`P(A_2 \mid A_1)`, tx(t, "mCond_wA2", "the probability of the second, knowing the first happened; and so on, each stage given all earlier ones")],
        ]}>
        {r`P(A \cap B) = P(B)\,P(A \mid B) \qquad P(A_1 \cap A_2 \cap A_3) = P(A_1)\,P(A_2 \mid A_1)\,P(A_3 \mid A_1 \cap A_2)`}
      </Equation>
      <p>
        {tx(t, "mCond_treeBody",
          "A tree diagram lays this out. Each stage branches into its possible results, and each branch is labelled with its conditional probability; the branches leaving one point add up to 1. Two rules then answer everything: multiply along a path to get the probability of that whole sequence, and add the paths that make up the event you want. Urn with 3 red and 2 blue balls, two draws without replacement. The paths: RR = 3/5 · 2/4 = 6/20, RB = 3/5 · 2/4 = 6/20, BR = 2/5 · 3/4 = 6/20, BB = 2/5 · 1/4 = 2/20, and 6 + 6 + 6 + 2 = 20 ✓. P(second ball red) = RR + BR = 12/20 = 3/5, the same as for the first ball, which makes sense: before looking at anything, the second ball is just as likely as the first to be any of the five.")}
      </p>

      <H2>{tx(t, "mCond_indTitle", "Independence")}</H2>
      <p>
        {tx(t, "mCond_indBody",
          "Sometimes learning B changes nothing about A: P(A | B) = P(A). Then A and B are independent. Multiplying by P(B) turns this into the symmetric form P(A ∩ B) = P(A) P(B), which is the usual definition because it also works when P(B) = 0. In a deck, \"red\" and \"ace\" are independent: P(red) = 1/2, P(ace) = 1/13, and P(red ace) = 2/52 = 1/26 = 1/2 · 1/13. Knowing the card is red leaves the chance of an ace at 2/26 = 1/13. But \"heart\" and \"red\" are dependent: P(heart) = 1/4, while P(heart | red) = 1/2.")}
      </p>
      <Equation label={tx(t, "mCond_eqInd", "Independent events")}
        where={[
          [r`A, B`, tx(t, "mCond_wInd", "two events of the same experiment; independence is a statement about their probabilities, not about any physical connection")],
        ]}
        note={tx(t, "mCond_indNote", "For separate physical experiments with no influence on each other (two different dice, successive coin tosses) independence is assumed, and probabilities of combined results multiply: three sixes in a row has probability (1/6)³ = 1/216.")}>
        {r`P(A \cap B) = P(A)\,P(B) \quad\Longleftrightarrow\quad P(A \mid B) = P(A)`}
      </Equation>
      <Callout type="warn" t={t}>
        {tx(t, "mCond_disjWarn", "Mutually exclusive is not the same as independent; it is almost the opposite. Hearts and spades are mutually exclusive: once you know the card is a spade, the chance of a heart drops to 0. That is the strongest possible dependence. Two events with positive probabilities can never be both mutually exclusive and independent, since then P(A ∩ B) = 0 but P(A) P(B) > 0.")}
      </Callout>
      <p>
        {tx(t, "mCond_fallacyBody",
          "The gambler's fallacy is to believe that after a run of reds at roulette, black is \"due\". The wheel has no memory: the spins are independent, so the next one has exactly the same probabilities as the first. The law of large numbers does not work by compensating for past runs; it works by diluting them, as thousands of further spins swamp a streak of five.")}
      </p>
      <p>
        {tx(t, "mCond_mutualBody",
          "With three or more events, independence means that every product rule holds, for each pair and for the whole group. Checking pairs is not enough. Toss two coins; let A = first is heads, B = second is heads, C = the two coins agree. Each has probability 1/2, and each pair is independent, for instance P(A ∩ C) = P(HH) = 1/4 = 1/2 · 1/2. But P(A ∩ B ∩ C) = P(HH) = 1/4, not 1/8: once A and B are known, C is certain.")}
      </p>

      <H2>{tx(t, "mCond_totalTitle", "The law of total probability")}</H2>
      <p>
        {tx(t, "mCond_totalBody",
          "A factory has two machines. Machine 1 makes 60 % of the parts, of which 2 % are defective; machine 2 makes 40 %, of which 5 % are defective. What share of all parts is defective? Every part comes from exactly one machine, so split by machine and add: P(D) = P(M₁) P(D | M₁) + P(M₂) P(D | M₂) = 0.6 · 0.02 + 0.4 · 0.05 = 0.012 + 0.020 = 0.032. In the tree this is \"add the paths that end in defective\". The events M₁, M₂ form a partition: they do not overlap and together cover everything.")}
      </p>
      <Equation label={tx(t, "mCond_eqTotal", "Law of total probability")}
        where={[
          [r`A_1, \ldots, A_n`, tx(t, "mCond_wPart", "a partition: mutually exclusive events of which exactly one happens")],
          [r`P(B \mid A_i)`, tx(t, "mCond_wBgA", "how likely B is in the case A_i")],
          [r`P(A_i)`, tx(t, "mCond_wAi", "how likely that case is: the weight of its contribution")],
        ]}>
        {r`P(B) = \sum_{i=1}^{n} P(A_i)\,P(B \mid A_i)`}
      </Equation>

      <H2>{tx(t, "mCond_bayesTitle", "Bayes' theorem: reasoning backwards")}</H2>
      <p>
        {tx(t, "mCond_bayesBody",
          "The factory question can be turned around. A part is found to be defective; which machine made it? We know P(D | M₁), the forward direction, and want P(M₁ | D), the backward one. Write P(M₁ ∩ D) with the multiplication rule in both orders: P(D) P(M₁ | D) = P(M₁) P(D | M₁). Divide by P(D): P(M₁ | D) = 0.012/0.032 = 0.375. Although machine 1 makes most of the parts, a defective part more likely came from machine 2 (0.020/0.032 = 0.625), whose defect rate is higher.")}
      </p>
      <Equation label={tx(t, "mCond_eqBayes", "Bayes' theorem")}
        where={[
          [r`P(A)`, tx(t, "mCond_wPrior", "the prior: how likely A was before the evidence")],
          [r`P(B \mid A)`, tx(t, "mCond_wLik", "the likelihood: how likely the evidence B is if A is true")],
          [r`P(B)`, tx(t, "mCond_wEvid", "the total probability of the evidence, usually from the law of total probability: P(A)P(B | A) + P(Aᶜ)P(B | Aᶜ)")],
          [r`P(A \mid B)`, tx(t, "mCond_wPost", "the posterior: how likely A is after seeing B")],
        ]}>
        {r`P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)} = \frac{P(B \mid A)\,P(A)}{P(B \mid A)\,P(A) + P(B \mid A^c)\,P(A^c)}`}
      </Equation>
      <H3>{tx(t, "mCond_testTitle", "The medical test")}</H3>
      <p>
        {tx(t, "mCond_testBody",
          "A disease affects 1 % of a population. A test catches 90 % of sick people (its sensitivity) but also flags 9 % of healthy people (its false positive rate). You test positive. How likely is it that you are sick? Most people, including many doctors in surveys, answer about 90 %. Count 1000 people instead. 10 are sick, and 9 of them test positive. 990 are healthy, and 9 % of them, about 89, also test positive. So 98 people test positive, and only 9 of them are sick: P(sick | +) = 9/98 ≈ 0.092, about 9 %. With the formula: 0.9 · 0.01/(0.9 · 0.01 + 0.09 · 0.99) = 0.009/0.0981 ≈ 0.092.")}
      </p>
      <p>
        {tx(t, "mCond_baseBody",
          "The culprit is the base rate. The disease is so rare that the 9 % of false alarms among the large healthy crowd outnumber the true positives among the few sick people. The test was not useless: it raised the probability from 1 % to 9 %, a ninefold increase. But one positive result from an imperfect test for a rare condition is far from a diagnosis. Try the prevalence slider: at 20 % prevalence the same test gives P(sick | +) ≈ 71 %.")}
      </p>

      <BayesFigure t={t} />

      <H3>{tx(t, "mCond_oddsTitle", "Bayes with odds: multiply by the likelihood ratio")}</H3>
      <p>
        {tx(t, "mCond_oddsBody",
          "In odds form, Bayes' theorem is a single multiplication. Divide Bayes' theorem for A by the same theorem for Aᶜ: the P(B) cancels, and posterior odds = prior odds × likelihood ratio, where the likelihood ratio P(B | A)/P(B | Aᶜ) measures how much more likely the evidence is if A is true. For the test it is 0.9/0.09 = 10. Prior odds 1 : 99 (1 sick for every 99 healthy) become 10 : 99, a probability of 10/109 ≈ 0.092 ✓. A second, independent positive test multiplies again: 100 : 99, a probability of 100/199 ≈ 0.50. Each piece of evidence updates the previous posterior, which becomes the prior for the next.")}
      </p>
      <Equation label={tx(t, "mCond_eqOdds", "Bayes' theorem in odds form")}
        where={[
          [r`\frac{P(A)}{P(A^c)}`, tx(t, "mCond_wPriorOdds", "the prior odds of A")],
          [r`\frac{P(B \mid A)}{P(B \mid A^c)}`, tx(t, "mCond_wLR", "the likelihood ratio: above 1 the evidence favours A, below 1 it counts against A")],
        ]}>
        {r`\frac{P(A \mid B)}{P(A^c \mid B)} = \frac{P(A)}{P(A^c)} \cdot \frac{P(B \mid A)}{P(B \mid A^c)}`}
      </Equation>

      <H2>{tx(t, "mCond_puzzlesTitle", "Two famous puzzles")}</H2>
      <p>
        {tx(t, "mCond_montyBody",
          "Monty Hall. A prize is behind one of three doors. You pick door 1. The host, who knows where the prize is and always opens a door without the prize, opens door 3. Should you switch to door 2? Follow the three equally likely cases. Prize behind 1 (probability 1/3): the host opens 2 or 3, and switching loses. Prize behind 2 (1/3): the host must open 3, and switching wins. Prize behind 3 (1/3): the host must open 2, and switching wins. Switching wins in 2 of the 3 cases, so P(win by switching) = 2/3. The host's choice carries information because he is not allowed to reveal the prize.")}
      </p>
      <p>
        {tx(t, "mCond_kidsBody",
          "Two children. In families with two children, each child equally likely a boy or a girl independently, the sample space is {BB, BG, GB, GG} (older first). Given that at least one child is a girl, three outcomes remain, {BG, GB, GG}, and P(both girls) = 1/3. Given that the older child is a girl, only {GB, GG} remain, and the answer is 1/2. The two conditions sound alike, but they cut the sample space differently, and that is all that matters.")}
      </p>

      <H2>{tx(t, "mCond_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mCond_ex1", "1. Two dice with sum 8: P(doubles | sum 8) = |{(4,4)}|/|{(2,6), (3,5), (4,4), (5,3), (6,2)}| = 1/5.")}</p>
      <p>{tx(t, "mCond_ex2", "2. At least one ace in two cards drawn without replacement: complement \"no ace\" = 48/52 · 47/51 = 2256/2652, so P = 396/2652 = 33/221 ≈ 0.149.")}</p>
      <p>{tx(t, "mCond_ex3", "3. Heart and face card are independent: P(heart ∩ face) = 3/52 and P(heart) P(face) = 1/4 · 12/52 = 3/52 ✓.")}</p>
      <p>{tx(t, "mCond_ex4", "4. In the urn with 3 red and 2 blue, the second ball is red. P(first was red | second red) = RR/(RR + BR) = (6/20)/(12/20) = 1/2.")}</p>
      <p>{tx(t, "mCond_ex5", "5. 5 % of emails are spam. A filter flags 95 % of spam and 2 % of normal mail. P(spam | flagged) = 0.95 · 0.05/(0.95 · 0.05 + 0.02 · 0.95) = 0.0475/0.0665 ≈ 0.714.")}</p>
      <p>{tx(t, "mCond_ex6", "6. A fair coin gives 5 heads in a row. P(heads on the 6th toss | 5 heads) = 1/2: the tosses are independent.")}</p>

      <H2>{tx(t, "mCond_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mCond_tWrong", "Wrong"), tx(t, "mCond_tRight", "Right"), tx(t, "mCond_tWhy", "Why")]}
        rows={[
          [tx(t, "mCond_m1w", "P(sick | +) = P(+ | sick) = 90 %"), tx(t, "mCond_m1r", "≈ 9 % with a 1 % base rate"), tx(t, "mCond_m1", "the two conditionals answer different questions; Bayes links them through the base rate")],
          [tx(t, "mCond_m2w", "mutually exclusive ⇒ independent"), tx(t, "mCond_m2r", "mutually exclusive ⇒ dependent (if both possible)"), tx(t, "mCond_m2", "knowing one happened rules the other out")],
          [tx(t, "mCond_m3w", "P(A ∩ B) = P(A) P(B) always"), "P(A ∩ B) = P(A) P(B | A)", tx(t, "mCond_m3", "the plain product needs independence")],
          [tx(t, "mCond_m4w", "after five reds, black is due"), tx(t, "mCond_m4r", "still the same probability"), tx(t, "mCond_m4", "independent trials have no memory")],
          [tx(t, "mCond_m5w", "two aces with replacement: 4/52 · 3/51"), "4/52 · 4/52", tx(t, "mCond_m5", "3/51 is for drawing without replacement; decide which one the problem describes")],
          [tx(t, "mCond_m6w", "pairwise independent ⇒ independent"), tx(t, "mCond_m6r", "check the triple product too"), tx(t, "mCond_m6", "two coins and \"they agree\" are pairwise but not mutually independent")],
        ]}
      />

      <KeyIdeas t={t} id="mCond" items={[
        "P(A | B) = P(A ∩ B)/P(B): B becomes the new sample space.",
        "P(A | B) and P(B | A) are different numbers.",
        "Multiply along the branches of a tree, add the branches that make up the event.",
        "Independent: P(A ∩ B) = P(A)P(B), i.e. B tells nothing about A; mutually exclusive events are dependent.",
        "Total probability: P(B) = Σ P(Aᵢ)P(B | Aᵢ) over a partition.",
        "Bayes: posterior = likelihood × prior / evidence; base rates matter enormously.",
        "Odds form: posterior odds = prior odds × likelihood ratio; each new piece of evidence multiplies again.",
      ]} />
    </Article>
  );
}
