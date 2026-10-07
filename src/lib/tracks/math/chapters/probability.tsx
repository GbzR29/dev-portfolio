"use client";

// Probability & Statistics 3: probability — experiments, outcomes, sample
// spaces and events (as sets); equally likely outcomes (ordered pairs for two
// dice); probability as long-run frequency; the three axioms and what follows
// from them (complement, addition rule); the complement trick (de Méré,
// birthdays); counting-based probabilities (cards, lottery); odds; geometric
// probability as a ratio of areas.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DiceFigure } from "@/components/lesson/figures/math/DiceFigure";
import { CardFigure } from "@/components/lesson/figures/math/CardFigure";

const r = String.raw;

export function ProbabilityContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPr_intro",
          "A coin toss, a die, tomorrow's weather: we cannot say what will happen, but we are not completely in the dark either. A die shows six about one time in six, and this is a precise statement, not a vague feeling. Probability is the mathematics that turns \"how likely?\" into a number between 0 (impossible) and 1 (certain), with rules for combining such numbers. This chapter sets up the language (sample spaces and events), the rules (three axioms and their consequences) and the first method for computing probabilities: counting equally likely outcomes.")}
      </Lead>

      <H2>{tx(t, "mPr_spaceTitle", "Experiments, outcomes and events")}</H2>
      <p>
        {tx(t, "mPr_spaceBody",
          "An experiment is anything with an uncertain result that could, at least in principle, be repeated: toss a coin, roll a die, draw a card. Each possible result is an outcome, and the set of all outcomes is the sample space, written Ω (capital omega). For a coin, Ω = {H, T}; for a die, Ω = {1, 2, 3, 4, 5, 6}. An event is any collection of outcomes, a subset of Ω, described by a statement that is either true or false once the experiment is over. \"The die shows an even number\" is the event A = {2, 4, 6}; it happens if the outcome is 2, 4 or 6.")}
      </p>
      <p>
        {tx(t, "mPr_setsBody",
          "Because events are sets, the set operations from counting describe how they combine. \"A or B\" is the union A ∪ B, \"A and B\" is the intersection A ∩ B, and \"not A\" is the complement Aᶜ, all the outcomes of Ω outside A. Two events are mutually exclusive (disjoint) if they cannot happen together: A ∩ B = ∅, the empty set. Rolling a 1 and rolling an even number are mutually exclusive; rolling an even number and rolling more than 3 are not, since 4 and 6 do both.")}
      </p>

      <H2>{tx(t, "mPr_classicTitle", "Equally likely outcomes")}</H2>
      <p>
        {tx(t, "mPr_classicBody",
          "When there is no reason to prefer one outcome over another (a fair coin, a balanced die, a well-shuffled deck), all outcomes are taken as equally likely, and probability becomes counting. The chance of an even number is 3 favourable outcomes out of 6: 3/6 = 1/2.")}
      </p>
      <Equation label={tx(t, "mPr_eqClassic", "Probability with equally likely outcomes")}
        where={[
          [r`P(A)`, tx(t, "mPr_wPA", "the probability of the event A")],
          [r`|A|`, tx(t, "mPr_wA", "the number of outcomes in A (the favourable outcomes)")],
          [r`|\Omega|`, tx(t, "mPr_wOmega", "the number of outcomes in the whole sample space")],
        ]}
        note={tx(t, "mPr_classicNote", "This works only when the outcomes really are equally likely. \"Rain or no rain\" has two outcomes, but that does not make rain 50 % likely.")}>
        {r`P(A) = \frac{|A|}{|\Omega|}`}
      </Equation>
      <H3>{tx(t, "mPr_diceTitle", "Two dice: why the order counts")}</H3>
      <p>
        {tx(t, "mPr_diceBody",
          "Roll two dice and add them. The sums 2 to 12 are 11 outcomes, but they are not equally likely: a sum of 2 needs both dice to show 1, while a sum of 7 happens in many ways. The equally likely outcomes are the ordered pairs (first die, second die), 6 · 6 = 36 of them by the multiplication principle. Imagine one die red and the other blue: (1, 6) and (6, 1) are different outcomes. The sum 7 is {(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)}: 6 outcomes, P = 6/36 = 1/6. The sum 2 is only {(1,1)}: P = 1/36. Even the great mathematician Leibniz once slipped here, claiming that 11 and 12 are equally easy to throw; in fact 11 is {(5,6), (6,5)}, 2/36, twice as likely as 12, which is only {(6,6)}.")}
      </p>

      <DiceFigure t={t} />

      <H2>{tx(t, "mPr_freqTitle", "Probability as long-run frequency")}</H2>
      <p>
        {tx(t, "mPr_freqBody",
          "What does P = 1/6 actually promise? Not that one six comes in every six rolls. Roll 12 times and you may see no six at all, or four. The promise is about the long run: the relative frequency, the number of times the event happened divided by the number of trials, gets closer and closer to 1/6 as the trials pile up. After 10 tosses of a coin, 7 heads (70 %) is quite ordinary; after 10 000 tosses, anything outside 49 % to 51 % would be very surprising. This is the law of large numbers, made precise in the sampling chapter. It is also how probabilities are measured when there is nothing to count, such as the chance that a thumbtack lands point up: throw it a thousand times and look at the frequency.")}
      </p>

      <H2>{tx(t, "mPr_axTitle", "The rules: three axioms")}</H2>
      <p>
        {tx(t, "mPr_axBody",
          "Counting and frequencies both produce numbers that obey the same three rules, and in 1933 Andrey Kolmogorov took those rules as the definition of probability. Everything else follows from them, whatever the probabilities are and wherever they come from.")}
      </p>
      <Equation label={tx(t, "mPr_eqAxioms", "Kolmogorov's axioms")}
        where={[
          [r`P(A) \ge 0`, tx(t, "mPr_wAx1", "no event has a negative probability")],
          [r`P(\Omega) = 1`, tx(t, "mPr_wAx2", "something in the sample space certainly happens")],
          [r`A \cap B = \varnothing`, tx(t, "mPr_wAx3", "A and B are mutually exclusive: then their probabilities simply add (and the same for any sequence of mutually exclusive events)")],
        ]}>
        {r`P(A) \ge 0 \qquad P(\Omega) = 1 \qquad P(A \cup B) = P(A) + P(B) \ \text{ if } A \cap B = \varnothing`}
      </Equation>
      <p>
        {tx(t, "mPr_complBody",
          "First consequence: the complement rule. A and Aᶜ are mutually exclusive and together make up Ω, so P(A) + P(Aᶜ) = P(Ω) = 1, that is P(Aᶜ) = 1 − P(A). In particular P(∅) = 1 − P(Ω) = 0, and since P(Aᶜ) ≥ 0, no probability is above 1. Second consequence: if A is contained in B, then P(A) ≤ P(B), because B is A plus the disjoint extra part B minus A, whose probability is not negative.")}
      </p>
      <p>
        {tx(t, "mPr_addBody",
          "Third consequence: the addition rule for events that may overlap. Split A ∪ B into A and the part of B outside A; these are disjoint. And B itself splits into that same outside part and A ∩ B. Subtracting gives the probability version of inclusion–exclusion.")}
      </p>
      <Equation label={tx(t, "mPr_eqAdd", "The addition rule")}
        where={[
          [r`P(A \cup B)`, tx(t, "mPr_wUnion", "the probability that A or B (or both) happens")],
          [r`P(A \cap B)`, tx(t, "mPr_wInter", "the probability that both happen; it was included in both P(A) and P(B), so it is taken away once")],
        ]}
        note={tx(t, "mPr_addNote", "A card is a heart or a face card (J, Q, K): 13/52 + 12/52 − 3/52 = 22/52 = 11/26 ≈ 0.42. The 3 face cards of hearts would otherwise count twice.")}>
        {r`P(A \cup B) = P(A) + P(B) - P(A \cap B)`}
      </Equation>

      <CardFigure t={t} />

      <H2>{tx(t, "mPr_trickTitle", "The complement trick")}</H2>
      <p>
        {tx(t, "mPr_mereBody",
          "\"At least one\" events are usually painful to count directly and easy through the complement, \"none\". In the 17th century the gambler Chevalier de Méré bet on getting at least one six in 4 rolls of a die. The complement is no six in all 4 rolls: each roll has 5 non-six faces out of 6, so 5⁴ = 625 of the 6⁴ = 1296 equally likely sequences have no six. P(at least one six) = 1 − 625/1296 = 671/1296 ≈ 0.518, a small edge that made him money. He then bet on at least one double six in 24 rolls of two dice, reasoning that 24 is to 36 what 4 is to 6. But 1 − (35/36)²⁴ ≈ 1 − 0.509 = 0.491: he lost in the long run, and his puzzle, sent to Pascal and Fermat, started the mathematics of probability.")}
      </p>
      <H3>{tx(t, "mPr_bdayTitle", "The birthday problem")}</H3>
      <p>
        {tx(t, "mPr_bdayBody",
          "In a room of 23 people, what is the chance that two share a birthday? Ignore 29 February and assume all 365 days equally likely. The complement is \"all birthdays different\". The ordered lists of 23 birthdays number 365²³; lists with all different days number 365 · 364 · … · 343 (23 factors, each person avoiding the days already taken). Their ratio is about 0.493, so P(a shared birthday) ≈ 1 − 0.493 = 0.507, better than even. It feels too high because we picture our own birthday being matched, but there are C(23, 2) = 253 pairs of people, and any one of them may match. With 50 people the chance is about 0.97.")}
      </p>
      <LessonTable
        headers={[tx(t, "mPr_tPeople", "people"), "5", "10", "20", "23", "30", "40", "50", "70"]}
        rows={[[tx(t, "mPr_tShared", "P(shared birthday)"), "0.027", "0.117", "0.411", "0.507", "0.706", "0.891", "0.970", "0.999"]]}
      />

      <H2>{tx(t, "mPr_countTitle", "Probabilities from counting")}</H2>
      <p>
        {tx(t, "mPr_countBody",
          "With the counting chapter's tools, many probabilities are one division away. The lottery that draws 6 of 60 numbers: all C(60, 6) = 50 063 860 sets are equally likely, and one ticket is one set, so P(win) = 1/50 063 860. Buying 7 numbers covers C(7, 6) = 7 sets and multiplies the chance by 7. A full house in poker (three cards of one rank and two of another): choose the rank of the three, 13 ways, and which 3 of its 4 suits, C(4, 3) = 4; then the rank of the pair, 12 ways, and 2 of its 4 suits, C(4, 2) = 6. That is 13 · 4 · 12 · 6 = 3744 hands out of C(52, 5) = 2 598 960, P ≈ 0.00144, about one hand in 694.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mPr_oddsInfo", "Odds are another way of stating the same thing. The odds for A are P(A) : P(Aᶜ), the chance it happens against the chance it does not. A die showing six has probability 1/6 and odds 1 : 5 (\"one to five\"), because for every one favourable outcome there are five unfavourable ones. Back from odds a : b to probability: P = a/(a + b). Odds of 3 : 1 mean P = 3/4.")}
      </Callout>

      <H2>{tx(t, "mPr_geoTitle", "Geometric probability: area instead of count")}</H2>
      <p>
        {tx(t, "mPr_geoBody",
          "Some experiments have infinitely many outcomes: a dart thrown at a board, a point picked at random along a stick. \"Equally likely\" then means that regions of equal size are equally likely, and the count is replaced by length, area or volume: P(A) = area of A / area of Ω. A dart that lands uniformly at random on a square board hits the inscribed circle with probability πr²/(2r)² = π/4 ≈ 0.785; that is how the circle chapter estimated π by throwing darts. Each single point has area 0, so the chance of hitting one exact point is 0, although it is not impossible. In these settings probability 0 means \"never in the long run\", not \"cannot happen\".")}
      </p>
      <p>
        {tx(t, "mPr_meetBody",
          "Two friends agree to meet between 12:00 and 13:00, each arriving at a random moment, and each waits 15 minutes for the other. Measure the times in hours after 12:00 as a point (x, y) in the unit square. They meet when |x − y| ≤ 1/4, a band along the diagonal. Outside it are two corner triangles with legs 3/4, of total area 2 · ½ · (3/4)² = 9/16. So P(meet) = 1 − 9/16 = 7/16 ≈ 0.44.")}
      </p>

      <H2>{tx(t, "mPr_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mPr_ex1", "1. Three coins. Ω has 2³ = 8 equally likely sequences (HHH, HHT, …). Exactly two heads: HHT, HTH, THH, so C(3, 2) = 3 outcomes and P = 3/8.")}</p>
      <p>{tx(t, "mPr_ex2", "2. A drawer holds 5 black socks and 3 white ones; you take 2 in the dark. P(both black) = C(5, 2)/C(8, 2) = 10/28 = 5/14 ≈ 0.36.")}</p>
      <p>{tx(t, "mPr_ex3", "3. Sum of two dice at least 10: sums 10, 11, 12 have 3 + 2 + 1 = 6 outcomes, P = 6/36 = 1/6.")}</p>
      <p>{tx(t, "mPr_ex4", "4. Exactly one ace in a 5-card hand: pick the ace, C(4, 1) = 4, and 4 non-aces, C(48, 4) = 194 580. P = 4 · 194 580/2 598 960 = 778 320/2 598 960 ≈ 0.30.")}</p>
      <p>{tx(t, "mPr_ex5", "5. Among 5 people, P(some shared birthday) = 1 − (364/365)(363/365)(362/365)(361/365) ≈ 1 − 0.973 = 0.027.")}</p>
      <p>{tx(t, "mPr_ex6", "6. A point is chosen at random on a 10 cm stick. The chance that it is within 2 cm of an end: two pieces of length 2, total 4 cm out of 10, P = 0.4.")}</p>

      <H2>{tx(t, "mPr_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mPr_tWrong", "Wrong"), tx(t, "mPr_tRight", "Right"), tx(t, "mPr_tWhy", "Why")]}
        rows={[
          [tx(t, "mPr_m1w", "sum 12 and sum 11 are equally likely"), "1/36 ≠ 2/36", tx(t, "mPr_m1", "use ordered pairs: those are the equally likely outcomes")],
          [tx(t, "mPr_m2w", "P(heart or face) = 13/52 + 12/52"), "13/52 + 12/52 − 3/52", tx(t, "mPr_m2", "the events overlap; the overlap was counted twice")],
          [tx(t, "mPr_m3w", "it either happens or not, so 50 %"), tx(t, "mPr_m3r", "count equally likely outcomes"), tx(t, "mPr_m3", "two outcomes need not be equally likely")],
          [tx(t, "mPr_m4w", "at least one six in 6 rolls: 6 · 1/6 = 1"), "1 − (5/6)⁶ ≈ 0.665", tx(t, "mPr_m4", "adding probabilities of overlapping events can exceed 1; use the complement")],
          [tx(t, "mPr_m5w", "P = 1/6 means one six every six rolls"), tx(t, "mPr_m5r", "the frequency approaches 1/6 in the long run"), tx(t, "mPr_m5", "short runs vary a lot")],
          [tx(t, "mPr_m6w", "odds 1 : 5 mean P = 1/5"), "P = 1/(1 + 5) = 1/6", tx(t, "mPr_m6", "odds compare favourable with unfavourable, not with the total")],
        ]}
      />

      <KeyIdeas t={t} id="mPr" items={[
        "The sample space Ω lists all outcomes; an event is a subset; or, and, not are union, intersection, complement.",
        "With equally likely outcomes P(A) = |A|/|Ω|; for two dice the 36 ordered pairs are the equally likely outcomes.",
        "Probability is the long-run relative frequency; short runs can be far from it.",
        "The axioms: P ≥ 0, P(Ω) = 1, disjoint events add.",
        "P(Aᶜ) = 1 − P(A); P(A ∪ B) = P(A) + P(B) − P(A ∩ B).",
        "\"At least one\" = 1 − P(none): de Méré, birthdays.",
        "With infinitely many outcomes, probability is a ratio of lengths or areas, and single points have probability 0.",
      ]} />
    </Article>
  );
}
