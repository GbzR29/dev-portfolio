"use client";

// Logic & Proof 2: propositional logic and quantifiers — propositions; the
// connectives ¬ ∧ ∨ ⊕ → ↔ and their truth tables; why p → q is true when p
// is false; converse, inverse and contrapositive; tautologies, contradictions
// and logical equivalence; De Morgan's laws; the laws of logic next to the
// laws of sets; valid arguments (modus ponens, modus tollens, the chain) and
// two classic fallacies; predicates and the quantifiers ∀ and ∃; negating a
// quantified statement; the order of quantifiers.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TruthTableFigure } from "@/components/lesson/figures/math/TruthTableFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

/** The truth table of p → q, with the letters for true and false of the reader's language. */
const impTable = (T: string, F: string) =>
  r`\begin{array}{cc|c} p & q & p \to q \\ \hline ${T} & ${T} & ${T} \\ ${T} & ${F} & \red{${F}} \\ ${F} & ${T} & ${T} \\ ${F} & ${F} & ${T} \end{array} \qquad p \to q \;\equiv\; \neg p \lor q`;

export function LogicContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mLog_intro",
          "Every theorem is a statement that is true, and every proof is a chain of statements, each following from earlier ones. Logic is the study of that chain: which ways of combining statements are meaningful, and which steps from one to the next are guaranteed to keep truth. It is also the logic of computers (every if, and, or and not in a program) and of everyday arguments, where its mistakes are common. Sets and logic are two views of the same thing, so this chapter keeps pointing back to the last one.")}
      </Lead>

      <Goals t={t} id="mLog" items={[
        "Build truth tables for the connectives ¬, ∧, ∨, → and ↔, and explain why p → q is true when p is false.",
        "Tell an implication from its converse, inverse and contrapositive.",
        "Show two formulas are equivalent with a truth table, and use De Morgan's laws.",
        "Read and negate statements with ∀ and ∃, and see why their order matters.",
      ]} />

      <H2>{tx(t, "mLog_propTitle", "Propositions")}</H2>
      <p>
        {tx(t, "mLog_propBody",
          "A proposition is a statement that is either true or false, never both: \"7 is prime\" (true), \"2 + 2 = 5\" (false), \"every even number above 2 is a sum of two primes\" (nobody knows yet, but it is one or the other). Questions, commands and \"x > 3\" with x unknown are not propositions. Letters p, q, r stand for propositions, and the connectives build bigger ones from them. Their meaning is fixed completely by a truth table: one row for each combination of truth values, T for true and F for false.")}
      </p>
      <LessonTable
        headers={[tx(t, "mLog_tConn", "Connective"), tx(t, "mLog_tRead", "Read"), tx(t, "mLog_tTrue", "True exactly when"), tx(t, "mLog_tSet", "Set version")]}
        rows={[
          ["¬p", tx(t, "mLog_c1", "not p"), tx(t, "mLog_c1t", "p is false"), "Aᶜ"],
          ["p ∧ q", tx(t, "mLog_c2", "p and q"), tx(t, "mLog_c2t", "both are true"), "A ∩ B"],
          ["p ∨ q", tx(t, "mLog_c3", "p or q"), tx(t, "mLog_c3t", "at least one is true"), "A ∪ B"],
          ["p ⊕ q", tx(t, "mLog_c4", "p xor q"), tx(t, "mLog_c4t", "exactly one is true"), "A △ B"],
          ["p → q", tx(t, "mLog_c5", "if p then q"), tx(t, "mLog_c5t", "not (p true and q false)"), "A ⊆ B"],
          ["p ↔ q", tx(t, "mLog_c6", "p if and only if q"), tx(t, "mLog_c6t", "both have the same value"), "A = B"],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "mLog_orTip", "In mathematics \"or\" is inclusive: p ∨ q is true when both are. Everyday speech often means the exclusive or (\"soup or salad\"), which is ⊕.")}
      </Callout>

      <H2>{tx(t, "mLog_impTitle", "Implication")}</H2>
      <p>
        {tx(t, "mLog_impBody",
          "\"If p then q\", written p → q, is the connective that proofs are made of, and the one that surprises people. Think of it as a promise: \"if it rains, I take an umbrella\". The promise is broken in exactly one situation: it rains and I have no umbrella. When it does not rain, I may take an umbrella or not; the promise has not been broken, so it counts as true. That is why p → q is true whenever p is false, a situation called vacuously true. \"Every unicorn in this room is purple\" is true: there is no unicorn to break it.")}
      </p>
      <Equation label={tx(t, "mLog_eqImp", "The truth table of p → q")}
        where={[
          [r`p`, tx(t, "mLog_wP", "the hypothesis (\"it rains\")")],
          [r`q`, tx(t, "mLog_wQ", "the conclusion (\"I take an umbrella\")")],
        ]}
        note={tx(t, "mLog_impNote", "Only the second row is F. Equivalently, p → q has the same table as ¬p ∨ q: either the hypothesis fails, or the conclusion holds.")}
        words={tx(t, "mLog_impWords", "An implication is false only when the hypothesis is true and the conclusion false.")}>
        {impTable(tx(t, "mLog_T", "T"), tx(t, "mLog_F", "F"))}
      </Equation>
      <p>
        {tx(t, "mLog_varBody",
          "Mathematicians say p → q in many ways: \"p implies q\", \"q if p\", \"p only if q\", \"p is sufficient for q\", \"q is necessary for p\". From one implication come three relatives. The converse swaps the parts, q → p. The inverse negates both, ¬p → ¬q. The contrapositive does both, ¬q → ¬p. The contrapositive always has the same truth table as the original; the converse and the inverse do not (they are each other's contrapositive). Check it in the figure.")}
      </p>
      <LessonTable
        headers={[tx(t, "mLog_tName", "Name"), tx(t, "mLog_tForm", "Form"), tx(t, "mLog_tEx", "Example"), tx(t, "mLog_tSame", "Same as p → q?")]}
        rows={[
          [tx(t, "mLog_v1", "implication"), "p → q", tx(t, "mLog_v1e", "if n is divisible by 4, n is even"), "—"],
          [tx(t, "mLog_v2", "converse"), "q → p", tx(t, "mLog_v2e", "if n is even, n is divisible by 4"), tx(t, "mLog_no", "no (n = 6)")],
          [tx(t, "mLog_v3", "inverse"), "¬p → ¬q", tx(t, "mLog_v3e", "if n is not divisible by 4, n is odd"), tx(t, "mLog_no2", "no (n = 6)")],
          [tx(t, "mLog_v4", "contrapositive"), "¬q → ¬p", tx(t, "mLog_v4e", "if n is odd, n is not divisible by 4"), tx(t, "mLog_yes", "yes, always")],
        ]}
      />
      <TruthTableFigure t={t} />

      <H2>{tx(t, "mLog_eqvTitle", "Equivalence, tautologies, De Morgan")}</H2>
      <p>
        {tx(t, "mLog_eqvBody",
          "Two formulas are logically equivalent, written ≡, when they have the same truth value on every row of the table: they say the same thing in different words. A tautology is true on every row (p ∨ ¬p, \"it rains or it does not\"); a contradiction is false on every row (p ∧ ¬p). The most used equivalences are De Morgan's laws, exactly the laws for complements of sets, with \"not\" for the complement, \"and\" for ∩ and \"or\" for ∪.")}
      </p>
      <Equation label={tx(t, "mLog_eqDM", "De Morgan's laws, and the contrapositive")}
        where={[
          [r`\equiv`, tx(t, "mLog_wEq", "\"is logically equivalent to\": same truth value on every row")],
        ]}
        words={tx(t, "mLog_dmWords", "\"Not both\" means \"at least one is false\"; \"neither\" means \"both are false\". Not flips and into or, and or into and.")}>
        {r`\neg(p \land q) \equiv \neg p \lor \neg q \qquad \neg(p \lor q) \equiv \neg p \land \neg q \qquad p \to q \equiv \neg q \to \neg p`}
      </Equation>
      <Derivation t={t} label={tx(t, "mLog_eqContra", "The contrapositive, by algebra instead of a table")}
        steps={[
          { full: true, tex: r`\neg q \to \neg p`, why: tx(t, "mLog_k1", "start from the contrapositive") },
          { full: true, tex: r`\equiv \neg(\neg q) \lor \neg p`, why: tx(t, "mLog_k2", "a → b ≡ ¬a ∨ b, with a = ¬q and b = ¬p") },
          { full: true, tex: r`\equiv q \lor \neg p`, why: tx(t, "mLog_k3", "a double negation cancels") },
          { full: true, tex: r`\equiv \neg p \lor q \equiv \green{p \to q}`, why: tx(t, "mLog_k4", "\"or\" is commutative, then the same rule backwards") },
        ]} />
      <LessonTable
        headers={[tx(t, "mLog_tLaw", "Law"), tx(t, "mLog_tLogic", "Logic"), tx(t, "mLog_tSets", "Sets")]}
        rows={[
          [tx(t, "mLog_l1", "double negation"), "¬¬p ≡ p", "(Aᶜ)ᶜ = A"],
          [tx(t, "mLog_l2", "commutative"), "p ∧ q ≡ q ∧ p", "A ∩ B = B ∩ A"],
          [tx(t, "mLog_l3", "distributive"), "p ∧ (q ∨ r) ≡ (p ∧ q) ∨ (p ∧ r)", "A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)"],
          [tx(t, "mLog_l4", "De Morgan"), "¬(p ∨ q) ≡ ¬p ∧ ¬q", "(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ"],
          [tx(t, "mLog_l5", "excluded middle"), "p ∨ ¬p ≡ T", "A ∪ Aᶜ = U"],
        ]}
      />

      <H2>{tx(t, "mLog_argTitle", "Valid arguments, and two fallacies")}</H2>
      <p>
        {tx(t, "mLog_argBody",
          "An argument is valid when its conclusion cannot be false while its premises are true: every row of the table that makes all premises true also makes the conclusion true. Three valid forms do most of the work in proofs. Two invalid look-alikes do most of the damage in everyday reasoning.")}
      </p>
      <LessonTable
        headers={[tx(t, "mLog_tForm2", "Form"), tx(t, "mLog_tPrem", "Premises"), tx(t, "mLog_tConc", "Conclusion"), tx(t, "mLog_tValid", "Valid?")]}
        rows={[
          [tx(t, "mLog_a1", "modus ponens"), "p → q,  p", "q", tx(t, "mLog_aYes", "yes")],
          [tx(t, "mLog_a2", "modus tollens"), "p → q,  ¬q", "¬p", tx(t, "mLog_aYes", "yes")],
          [tx(t, "mLog_a3", "chain (syllogism)"), "p → q,  q → r", "p → r", tx(t, "mLog_aYes", "yes")],
          [tx(t, "mLog_a4", "affirming the consequent"), "p → q,  q", "p", tx(t, "mLog_aNo1", "no: the converse")],
          [tx(t, "mLog_a5", "denying the antecedent"), "p → q,  ¬p", "¬q", tx(t, "mLog_aNo2", "no: the inverse")],
        ]}
      />
      <p>
        {tx(t, "mLog_fallBody",
          "\"If it rains, the street is wet. The street is wet. So it rained.\" That is affirming the consequent: a street cleaner could have wet it. Valid reasoning from a wet street can only conclude nothing; from a dry street, modus tollens concludes that it did not rain. The four-card task in the figure is the same trap: most people want to turn the even card, which is the converse.")}
      </p>

      <H2>{tx(t, "mLog_quantTitle", "Quantifiers: for all, there exists")}</H2>
      <p>
        {tx(t, "mLog_quantBody",
          "\"x > 3\" is not a proposition until we know x. A statement with a variable, P(x), is a predicate; it becomes a proposition when x is given a value, or when it is quantified. The universal quantifier ∀ (an upside-down A, \"for all\") claims P for every x in some set; the existential quantifier ∃ (a backwards E, \"there exists\") claims P for at least one. Proving ∀ needs an argument that covers every x; disproving it needs only one counterexample. Proving ∃ needs only one example.")}
      </p>
      <Equation label={tx(t, "mLog_eqQuant", "The two quantifiers")}
        where={[
          [r`\forall x \in S`, tx(t, "mLog_wAll", "for every x in the set S")],
          [r`\exists x \in S`, tx(t, "mLog_wEx", "for at least one x in S")],
          [r`P(x)`, tx(t, "mLog_wPx", "a predicate: a statement about x")],
        ]}
        note={tx(t, "mLog_quantNote", "∀x ∈ ℝ: x² ≥ 0 is true. ∃x ∈ ℝ: x² = 2 is true (x = √2). ∃x ∈ ℚ: x² = 2 is false, as the proofs chapter shows.")}>
        {r`\forall x \in S:\ P(x) \qquad\qquad \exists x \in S:\ P(x)`}
      </Equation>
      <H3>{tx(t, "mLog_negTitle", "Negating a quantified statement")}</H3>
      <p>
        {tx(t, "mLog_negBody",
          "\"Not every swan is white\" means \"some swan is not white\": the negation of ∀ is ∃ with the inside negated, and the negation of ∃ is ∀ with the inside negated. This is De Morgan again, stretched over many cases (\"for all\" is a giant \"and\", \"exists\" a giant \"or\"). To negate a long statement, sweep from left to right: flip each quantifier, then negate what is left.")}
      </p>
      <Equation label={tx(t, "mLog_eqNeg", "Negating quantifiers")}
        where={[
          [r`\neg`, tx(t, "mLog_wNot", "\"it is not the case that\"")],
        ]}
        words={tx(t, "mLog_negWords", "It is false that all x have the property exactly when some x lacks it, and false that some x has it exactly when every x lacks it.")}>
        {r`\neg\big(\forall x:\ P(x)\big) \equiv \exists x:\ \neg P(x) \qquad \neg\big(\exists x:\ P(x)\big) \equiv \forall x:\ \neg P(x)`}
      </Equation>
      <Derivation t={t} label={tx(t, "mLog_eqNegEx", "Negating \"every number has a bigger number\"")}
        steps={[
          { full: true, tex: r`\neg\,\big(\forall n \in \mathbb{N}\ \exists m \in \mathbb{N}:\ m > n\big)`, why: tx(t, "mLog_n1", "the statement to negate: for every n there is a bigger m") },
          { full: true, tex: r`\equiv \exists n \in \mathbb{N}\ \neg\big(\exists m \in \mathbb{N}:\ m > n\big)`, why: tx(t, "mLog_n2", "the outer ∀ becomes ∃") },
          { full: true, tex: r`\equiv \exists n \in \mathbb{N}\ \forall m \in \mathbb{N}:\ \neg(m > n)`, why: tx(t, "mLog_n3", "the inner ∃ becomes ∀") },
          { full: true, tex: r`\equiv \green{\exists n \in \mathbb{N}\ \forall m \in \mathbb{N}:\ m \le n}`, why: tx(t, "mLog_n4", "\"there is a largest natural number\": false, so the original is true") },
        ]} />
      <H3>{tx(t, "mLog_orderTitle", "The order of quantifiers")}</H3>
      <p>
        {tx(t, "mLog_orderBody",
          "Swapping different quantifiers changes the meaning. ∀n ∃m: m > n says \"every number has a bigger number\", true, because m may depend on n (take m = n + 1). ∃m ∀n: m > n says \"some single number is bigger than all numbers\", false. In the first, the choice of m comes after n is known; in the second, m must be chosen first, once and for all. The definition of a limit in the Calculus section, \"for every ε there is a δ\", depends on exactly this order.")}
      </p>

      <H2>{tx(t, "mLog_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mLog_ex1", "1. Negate \"every student passed or was absent\": some student did not pass and was not absent. (Flip ∀ to ∃, then De Morgan turns \"or\" into \"and\".)")}</p>
      <p>{tx(t, "mLog_ex2", "2. \"x² = 4 → x = 2\" over the reals is false: x = −2 makes the hypothesis true and the conclusion false. The converse, \"x = 2 → x² = 4\", is true.")}</p>
      <p>{tx(t, "mLog_ex3", "3. (p ∧ q) → p is a tautology: the only way to be false would be p ∧ q true with p false, which is impossible.")}</p>
      <H3>{tx(t, "mLog_ex4Title", "Necessary and sufficient")}</H3>
      <p>{tx(t, "mLog_ex4", "4. \"Being divisible by 4 is sufficient for being even\" is p → q with p = divisible by 4, q = even. \"Being even is necessary for being divisible by 4\" is the same statement. \"Being even is sufficient for being divisible by 4\" is the converse, and false.")}</p>

      <MathPracticeFigure t={t} set="logic" />

      <H2>{tx(t, "mLog_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mLog_tWrong", "Wrong"), tx(t, "mLog_tRight", "Right"), tx(t, "mLog_tWhy", "Why")]}
        rows={[
          [tx(t, "mLog_m1w", "p → q, so q → p"), tx(t, "mLog_m1r", "only ¬q → ¬p follows"), tx(t, "mLog_m1", "the converse is a different claim")],
          [tx(t, "mLog_m2w", "p → q is false when p is false"), tx(t, "mLog_m2r", "it is true (vacuously)"), tx(t, "mLog_m2", "no promise was broken")],
          [tx(t, "mLog_m3w", "¬(p ∧ q) ≡ ¬p ∧ ¬q"), "¬p ∨ ¬q", tx(t, "mLog_m3", "\"not both\" is not \"neither\"")],
          [tx(t, "mLog_m4w", "¬(∀x P) ≡ ∀x ¬P"), "∃x ¬P", tx(t, "mLog_m4", "one counterexample is enough")],
          [tx(t, "mLog_m5w", "swapping ∀ and ∃ freely"), tx(t, "mLog_m5r", "keep their order"), tx(t, "mLog_m5", "∀n ∃m and ∃m ∀n say different things")],
        ]}
      />

      <KeyIdeas t={t} id="mLog" items={[
        "A proposition is true or false; connectives build new ones, defined by truth tables.",
        "p → q is false only when p is true and q is false; it is equivalent to ¬p ∨ q.",
        "The contrapositive ¬q → ¬p is equivalent to p → q; the converse q → p is not.",
        "Two formulas are equivalent when their truth tables agree on every row; De Morgan: ¬(p ∧ q) ≡ ¬p ∨ ¬q.",
        "Logic and sets mirror each other: not, and, or ↔ complement, intersection, union.",
        "Modus ponens, modus tollens and the chain are valid; affirming the consequent and denying the antecedent are not.",
        "¬∀x P ≡ ∃x ¬P and ¬∃x P ≡ ∀x ¬P; the order of different quantifiers matters.",
      ]} />
    </Article>
  );
}
