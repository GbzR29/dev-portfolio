"use client";

// Logic & Proof 3: proofs — what a proof is (and is not); definitions as the
// starting point; direct proof; proof by contrapositive; proof by
// contradiction (√2 is irrational, infinitely many primes); proof by cases;
// disproof by counterexample; existence proofs, constructive and not;
// uniqueness; "if and only if" in two directions; how to write a proof.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ProofOrderFigure } from "@/components/lesson/figures/math/ProofOrderFigure";

const r = String.raw;

export function ProofsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPrf_intro",
          "A proof is an argument that leaves no room for doubt: starting from definitions and facts already established, every step follows by valid logic, and the last step is the claim. Measurements, pictures and a thousand examples can make a claim believable; only a proof makes it certain, for every case at once and forever. This chapter collects the handful of strategies that nearly every proof uses, each shown on a classic theorem, and ends with how to write one down.")}
      </Lead>

      <Goals t={t} id="mPrf" items={[
        "Write a direct proof from the definitions.",
        "Prove a statement through its contrapositive, or by contradiction.",
        "Split a proof into cases, and disprove a claim with one counterexample.",
        "Prove an \"if and only if\", an existence and a uniqueness claim, and write proofs that others can follow.",
      ]} />

      <H2>{tx(t, "mPrf_defTitle", "Start from the definitions")}</H2>
      <p>
        {tx(t, "mPrf_defBody",
          "Most proofs at this level are short once the words are replaced by their definitions, because the definitions are what you can calculate with. An integer n is even when n = 2k for some integer k, and odd when n = 2k + 1. An integer a divides b (a | b) when b = a·k for some integer k. A real number is rational when it equals p/q for integers p and q with q ≠ 0, and irrational otherwise. \"Some integer k\" is important: every proof must say where its letters come from.")}
      </p>
      <LessonTable
        headers={[tx(t, "mPrf_tWord", "Word"), tx(t, "mPrf_tMeans", "Means"), tx(t, "mPrf_tEx", "Example")]}
        rows={[
          [tx(t, "mPrf_w1", "n is even"), tx(t, "mPrf_w1m", "n = 2k for some integer k"), "14 = 2 · 7"],
          [tx(t, "mPrf_w2", "n is odd"), tx(t, "mPrf_w2m", "n = 2k + 1 for some integer k"), "15 = 2 · 7 + 1"],
          [tx(t, "mPrf_w3", "a divides b"), tx(t, "mPrf_w3m", "b = a·k for some integer k"), "3 | 12, 12 = 3 · 4"],
          [tx(t, "mPrf_w4", "x is rational"), tx(t, "mPrf_w4m", "x = p/q, integers p, q, q ≠ 0"), "0.75 = 3/4"],
        ]}
      />

      <H2>{tx(t, "mPrf_directTitle", "Direct proof")}</H2>
      <p>
        {tx(t, "mPrf_directBody",
          "To prove \"if P then Q\" directly, assume P, translate it with the definitions, and calculate until Q appears. Assuming P is not cheating: an implication only claims something in the situations where P holds (the logic chapter's truth table), so those are the only situations to check.")}
      </p>
      <Derivation t={t} label={tx(t, "mPrf_eqDirect", "If a | b and b | c, then a | c")}
        steps={[
          { full: true, tex: r`b = a\,k \quad\text{and}\quad c = b\,l \quad (k, l \in \mathbb{Z})`, why: tx(t, "mPrf_d1", "assume the hypotheses and write them with the definition of \"divides\"") },
          { full: true, tex: r`c = (a\,k)\,l`, why: tx(t, "mPrf_d2", "substitute b = a k into c = b l") },
          { full: true, tex: r`c = a\,(k\,l)`, why: tx(t, "mPrf_d3", "regroup the product") },
          { full: true, tex: r`k\,l \in \mathbb{Z} \;\Rightarrow\; \green{a \mid c} \quad \blacksquare`, why: tx(t, "mPrf_d4", "a product of integers is an integer, so c is a times an integer: that is the definition of a | c") },
        ]} />

      <H2>{tx(t, "mPrf_contraTitle", "Proof by contrapositive")}</H2>
      <p>
        {tx(t, "mPrf_contraBody",
          "Sometimes the hypothesis gives you nothing to work with. \"If n² is even then n is even\": knowing n² = 2k says little about n, since √(2k) is not an integer formula. The contrapositive, \"if n is odd then n² is odd\", has the same truth table (logic chapter) and starts from something useful: n = 2k + 1. Proving it proves the original.")}
      </p>
      <Derivation t={t} label={tx(t, "mPrf_eqContra", "If n² is even, then n is even")}
        steps={[
          { full: true, tex: r`\text{${tx(t, "mPrf_c0", "contrapositive: n odd ⇒ n² odd")}}`, why: tx(t, "mPrf_c1", "announce the strategy, so the reader knows what is being proved") },
          { full: true, tex: r`n = 2k + 1 \quad (k \in \mathbb{Z})`, why: tx(t, "mPrf_c2", "assume n is odd") },
          { full: true, tex: r`n^2 = 4k^2 + 4k + 1 = 2\,(2k^2 + 2k) + 1`, why: tx(t, "mPrf_c3", "square it and pull out a factor 2 from all but the last term") },
          { full: true, tex: r`\green{n^2 \text{ ${tx(t, "mPrf_c4", "is odd")}}} \quad \blacksquare`, why: tx(t, "mPrf_c5", "2k² + 2k is an integer, so n² has the form 2 × integer + 1") },
        ]} />

      <H2>{tx(t, "mPrf_contradTitle", "Proof by contradiction")}</H2>
      <p>
        {tx(t, "mPrf_contradBody",
          "To prove a statement S, assume S is false and reason from there until you reach something impossible, such as a number that is both even and odd. Since valid steps never lead from truths to an impossibility, the assumption was false, so S is true. This is the method of choice for negative statements (\"not rational\", \"no largest prime\"), which give nothing to calculate with directly.")}
      </p>
      <Derivation t={t} label={tx(t, "mPrf_eqSqrt2", "√2 is irrational")}
        steps={[
          { full: true, tex: r`\sqrt{2} = \frac{p}{q}, \quad p, q \in \mathbb{Z} \text{ ${tx(t, "mPrf_s0", "with no common factor")}}`, why: tx(t, "mPrf_s1", "assume the opposite: √2 is rational, and write the fraction in lowest terms") },
          { full: true, tex: r`2 = \frac{p^2}{q^2} \;\Rightarrow\; p^2 = 2q^2`, why: tx(t, "mPrf_s2", "square and multiply by q²") },
          { full: true, tex: r`p^2 \text{ ${tx(t, "mPrf_s3", "even")}} \;\Rightarrow\; p \text{ ${tx(t, "mPrf_s3", "even")}}: \quad p = 2r`, why: tx(t, "mPrf_s4", "p² = 2 × q² is even; by the previous proof, p is even") },
          { full: true, tex: r`4r^2 = 2q^2 \;\Rightarrow\; q^2 = 2r^2 \;\Rightarrow\; q \text{ ${tx(t, "mPrf_s3", "even")}}`, why: tx(t, "mPrf_s5", "substitute p = 2r and divide by 2; the same argument makes q even") },
          { full: true, tex: r`\red{2 \mid p \text{ ${tx(t, "mPrf_s6", "and")} } 2 \mid q} \quad \blacksquare`, why: tx(t, "mPrf_s7", "p and q share the factor 2, but they had no common factor: a contradiction, so √2 is irrational") },
        ]} />
      <p>
        {tx(t, "mPrf_primesBody",
          "Euclid's proof that there are infinitely many primes, around 300 BC, is the other classic. Suppose the primes are only p₁, p₂, …, pₖ. Let N = p₁ · p₂ · … · pₖ + 1. N is bigger than 1, so it has some prime factor p (the Divisibility chapter). But dividing N by any pᵢ leaves remainder 1, so p is none of them, and the list was incomplete. Note what the proof does not say: N need not be prime itself. 2 · 3 · 5 · 7 · 11 · 13 + 1 = 30031 = 59 · 509.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mPrf_contraVsTip", "A proof by contrapositive is a special, tidier kind of contradiction proof: assuming P and not Q, it derives not P. When you finish a contradiction proof, check whether the contradiction is just \"not P\"; if so, rewrite it as a contrapositive, which is easier to read.")}
      </Callout>

      <ProofOrderFigure t={t} />

      <H2>{tx(t, "mPrf_casesTitle", "Proof by cases")}</H2>
      <p>
        {tx(t, "mPrf_casesBody",
          "When different situations need different arguments, split them up: prove the claim in each case, and make sure the cases together cover everything. Even and odd is the most common split; signs (x < 0, x = 0, x > 0) and remainders mod 3 are others. Example: n² + n = n(n + 1) is always even, because if n is even the first factor is even, and if n is odd the second one is.")}
      </p>
      <Equation label={tx(t, "mPrf_eqCases", "Proof by cases, in logic")}
        where={[
          [r`C_1 \lor C_2`, tx(t, "mPrf_wCases", "the cases cover every possibility (here: n even or n odd)")],
          [r`C_i \to Q`, tx(t, "mPrf_wEach", "the claim Q is proved separately in each case")],
        ]}
        words={tx(t, "mPrf_casesWords", "If one of the cases always happens, and each case leads to Q, then Q.")}>
        {r`\big(C_1 \lor C_2\big) \land \big(C_1 \to Q\big) \land \big(C_2 \to Q\big) \;\Longrightarrow\; Q`}
      </Equation>

      <H2>{tx(t, "mPrf_counterTitle", "Disproof by counterexample")}</H2>
      <p>
        {tx(t, "mPrf_counterBody",
          "To show a \"for all\" statement is false, one example where it fails is enough: that is the negation of ∀ from the logic chapter. \"Every odd number is prime\": 9. \"n² + n + 41 is always prime\": n = 40. \"(a + b)² = a² + b²\": a = b = 1 gives 4 ≠ 2. A good counterexample is simple and checked completely. The reverse is never true: examples can disprove a \"for all\" but never prove it.")}
      </p>

      <H2>{tx(t, "mPrf_existTitle", "Existence and uniqueness")}</H2>
      <p>
        {tx(t, "mPrf_existBody",
          "To prove \"there exists an x with property P\", the most convincing way is to show one: a constructive proof. \"There is a prime between 20 and 25\": 23. Sometimes a proof shows that something must exist without finding it. A famous example: there are irrational numbers a and b with aᵇ rational. Look at √2^√2. If it is rational, take a = b = √2. If it is irrational, take a = √2^√2 and b = √2: then aᵇ = √2^(√2 · √2) = √2² = 2. Either way such a pair exists, and we never needed to know which case is true.")}
      </p>
      <p>
        {tx(t, "mPrf_uniqueBody",
          "\"Exactly one\" means two things: there is at least one (existence), and there are not two (uniqueness). The standard uniqueness argument assumes two objects with the property and proves they are equal. Example: the equation 3x + 5 = 11 has exactly one solution. Existence: x = 2 works. Uniqueness: if 3x + 5 = 11 and 3y + 5 = 11, subtracting gives 3(x − y) = 0, so x = y.")}
      </p>

      <H2>{tx(t, "mPrf_iffTitle", "\"If and only if\"")}</H2>
      <p>
        {tx(t, "mPrf_iffBody",
          "P ↔ Q claims two implications, P → Q and Q → P, and a proof must do both directions, often by different methods. Example: n is even if and only if n² is even. (⇒) If n = 2k, then n² = 4k² = 2(2k²), even: a direct proof. (⇐) If n² is even, then n is even: the contrapositive proof above. Writing \"(⇒)\" and \"(⇐)\" at the start of each half tells the reader which direction is being done.")}
      </p>

      <H2>{tx(t, "mPrf_writeTitle", "Writing a proof")}</H2>
      <LessonTable
        headers={[tx(t, "mPrf_tRule", "Rule"), tx(t, "mPrf_tWhy2", "Why")]}
        rows={[
          [tx(t, "mPrf_r1", "State what you are proving, and the method if it is not direct."), tx(t, "mPrf_r1w", "The reader must know where you are going.")],
          [tx(t, "mPrf_r2", "Introduce every letter: \"let n be an odd integer\", \"for some integer k\"."), tx(t, "mPrf_r2w", "An unexplained letter is a hole in the argument.")],
          [tx(t, "mPrf_r3", "Use full sentences; formulas are part of them."), tx(t, "mPrf_r3w", "Words like \"so\", \"since\" and \"therefore\" carry the logic.")],
          [tx(t, "mPrf_r4", "Justify each step that is not plain algebra."), tx(t, "mPrf_r4w", "\"by the previous lemma\", \"since 2 divides p²\"…")],
          [tx(t, "mPrf_r5", "Say when you are done (■ or \"which proves the claim\")."), tx(t, "mPrf_r5w", "The reader should not wonder whether more is coming.")],
        ]}
      />

      <H2>{tx(t, "mPrf_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mPrf_ex1", "1. Direct: the product of two odd numbers is odd. (2m + 1)(2n + 1) = 4mn + 2m + 2n + 1 = 2(2mn + m + n) + 1.")}</p>
      <p>{tx(t, "mPrf_ex2", "2. Contrapositive: if x² − 6x + 5 is even, then x is odd. Contrapositive: if x = 2k, then x² − 6x + 5 = 4k² − 12k + 5 = 2(2k² − 6k + 2) + 1, odd.")}</p>
      <p>{tx(t, "mPrf_ex3", "3. Contradiction: there is no largest even number. If E were the largest, E + 2 would be even and larger.")}</p>
      <H3>{tx(t, "mPrf_ex4Title", "Cases with remainders")}</H3>
      <p>{tx(t, "mPrf_ex4", "4. Every square leaves remainder 0 or 1 when divided by 3. Write n = 3k, 3k + 1 or 3k + 2. Then n² = 9k², 9k² + 6k + 1 or 9k² + 12k + 4 = 3(3k² + 4k + 1) + 1. Remainders 0, 1, 1. So no square ends in remainder 2, and, for example, 3k + 2 is never a perfect square.")}</p>

      <H2>{tx(t, "mPrf_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mPrf_tWrong", "Wrong"), tx(t, "mPrf_tRight", "Right"), tx(t, "mPrf_tWhy", "Why")]}
        rows={[
          [tx(t, "mPrf_m1w", "checking a few examples"), tx(t, "mPrf_m1r", "an argument for every case"), tx(t, "mPrf_m1", "examples cannot prove a \"for all\"")],
          [tx(t, "mPrf_m2w", "proving the converse"), tx(t, "mPrf_m2r", "prove P ⇒ Q, or ¬Q ⇒ ¬P"), tx(t, "mPrf_m2", "Q ⇒ P is a different statement")],
          [tx(t, "mPrf_m3w", "a = 2k and b = 2k for two evens"), tx(t, "mPrf_m3r", "a = 2k, b = 2l"), tx(t, "mPrf_m3", "the same letter forces a = b")],
          [tx(t, "mPrf_m4w", "starting from the conclusion"), tx(t, "mPrf_m4r", "start from the hypothesis"), tx(t, "mPrf_m4", "reaching a truth from the claim proves nothing")],
          [tx(t, "mPrf_m5w", "only one direction of an \"iff\""), tx(t, "mPrf_m5r", "prove ⇒ and ⇐"), tx(t, "mPrf_m5", "↔ is two implications")],
        ]}
      />

      <KeyIdeas t={t} id="mPrf" items={[
        "A proof starts from definitions and known facts and reaches the claim by valid steps; examples are not proofs.",
        "Direct proof: assume the hypothesis, apply the definitions, calculate towards the conclusion.",
        "Contrapositive: prove ¬Q ⇒ ¬P instead of P ⇒ Q; the two are equivalent.",
        "Contradiction: assume the claim is false and derive an impossibility (√2 irrational, infinitely many primes).",
        "Cases must cover every possibility; one counterexample disproves a \"for all\".",
        "Existence: show an example (or force one to exist); uniqueness: two solutions must be equal; ↔ needs both directions.",
        "Introduce every letter, justify each step, and mark the end.",
      ]} />
    </Article>
  );
}
