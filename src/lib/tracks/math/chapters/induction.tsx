"use client";

// Logic & Proof 5: proof by induction — the domino picture; base case and
// inductive step; why it works (the least counterexample); the template;
// sums (Σk, odd numbers, Σk²), divisibility (4ⁿ − 1, n³ − n) and an
// inequality where the base matters (2ⁿ ≥ n²); strong induction (prime
// factorisation, stamps); the classic mistakes: no base case, a step that
// fails at one link (all horses are the same colour), and believing examples
// (n² + n + 41).

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { InductionFigure } from "@/components/lesson/figures/math/InductionFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formula: 2ⁿ against n² ───────────────────────────────────────────────

const powNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const n = v.n, a = 2 ** n, b = n * n, ok = a >= b;
  return {
    tex: r`2^{${n}} = ${a} \;${ok ? r`\ge` : "<"}\; ${b} = ${n}^2 \qquad ${ok ? r`\green{\text{${tx(t, "mInd_liveTrue", "true")}}}` : r`\red{\text{${tx(t, "mInd_liveFalse", "false")}}}`}`,
    meter: Math.min(1, b / a), meterLabel: `n² / 2ⁿ = ${(b / a).toFixed(3)}`,
  };
};

export function InductionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mInd_intro",
          "The summation chapter found 1 + 2 + … + n = n(n + 1)/2 and checked it for n = 4. But the formula claims something for every whole number n, infinitely many statements, and checking examples can never cover them all. Proof by induction can. It is the standard way to prove anything that is indexed by whole numbers: sums, divisibility facts, inequalities, the correctness of a recursive algorithm. The idea fits in one picture: a row of dominoes.")}
      </Lead>

      <Goals t={t} id="mInd" items={[
        "State the two parts of a proof by induction and why together they prove every case.",
        "Write induction proofs for sums, divisibility and inequalities.",
        "Choose the right base case, and use strong induction when one step back is not enough.",
        "Spot the classic broken \"proofs\": no base case, a failing link, or examples instead of a step.",
      ]} />

      <H2>{tx(t, "mInd_domTitle", "Falling dominoes")}</H2>
      <p>
        {tx(t, "mInd_domBody",
          "Line up dominoes, one for each whole number n, so that each one, if it falls, knocks over the next. Push the first. Every domino falls, however long the row: the first falls because you pushed it, the second because the first fell onto it, and so on with no end. Two things were needed, and each alone is useless. A push without the spacing knocks over only one domino. The spacing without a push knocks over none.")}
      </p>
      <p>
        {tx(t, "mInd_domBody2",
          "In a proof, the dominoes are statements P(1), P(2), P(3)…, one for each n. P(n) might be \"1 + 2 + … + n = n(n + 1)/2\". The push is the base case: show that P(1) is true. The spacing is the inductive step: show that whenever P(k) is true for some k, then P(k + 1) is true as well. Note what the step does not do: it does not show P(k) is true. It only shows that truth passes from each case to the next.")}
      </p>
      <Equation label={tx(t, "mInd_eqPrinciple", "The principle of induction")}
        where={[
          [r`P(n)`, tx(t, "mInd_wP", "a statement about the whole number n, true or false for each n")],
          [r`n_0`, tx(t, "mInd_wN0", "the starting value, often 0 or 1")],
          [r`P(k) \Rightarrow P(k+1)`, tx(t, "mInd_wStep", "\"if P(k) then P(k + 1)\": the inductive step, proved for an arbitrary k ≥ n₀")],
        ]}
        words={tx(t, "mInd_principleWords", "If the first statement is true, and each true statement makes the next one true, then all of them are true.")}>
        {r`\Big(P(n_0) \;\wedge\; \forall k \ge n_0:\ P(k) \Rightarrow P(k+1)\Big) \;\Longrightarrow\; \forall n \ge n_0:\ P(n)`}
      </Equation>
      <InductionFigure t={t} />

      <H3>{tx(t, "mInd_whyTitle", "Why it works")}</H3>
      <p>
        {tx(t, "mInd_whyBody",
          "Suppose the base case and the step are both proved, yet some P(n) is false. Among all the n where P fails, take the smallest; call it m. It is not n₀, because P(n₀) is true, so m − 1 ≥ n₀, and P(m − 1) is true because m was the smallest failure. But then the step turns P(m − 1) into P(m), so P(m) is true after all. That contradiction means no failure exists. The argument rests on one property of whole numbers: every non-empty set of them has a smallest element, called the well-ordering principle. It is a proof by contradiction, the method of the proofs chapter.")}
      </p>

      <H2>{tx(t, "mInd_tmplTitle", "The template")}</H2>
      <LessonTable
        headers={[tx(t, "mInd_tPart", "Part"), tx(t, "mInd_tWhat", "What you write")]}
        rows={[
          [tx(t, "mInd_p1", "1. The statement"), tx(t, "mInd_p1w", "Write P(n) clearly, and for which n it is claimed.")],
          [tx(t, "mInd_p2", "2. Base case"), tx(t, "mInd_p2w", "Check P(n₀) by direct calculation.")],
          [tx(t, "mInd_p3", "3. Hypothesis"), tx(t, "mInd_p3w", "\"Assume P(k) holds for some k ≥ n₀.\" This is the inductive hypothesis.")],
          [tx(t, "mInd_p4", "4. Step"), tx(t, "mInd_p4w", "Start from one side of P(k + 1), and steer it until the left side of P(k) appears; replace it using the hypothesis; finish the algebra.")],
          [tx(t, "mInd_p5", "5. Conclusion"), tx(t, "mInd_p5w", "\"By induction, P(n) holds for every n ≥ n₀.\"")],
        ]}
      />

      <H2>{tx(t, "mInd_sumTitle", "Proving sums")}</H2>
      <p>
        {tx(t, "mInd_sumBody",
          "Sums are the natural first target, because the sum up to k + 1 is the sum up to k plus one more term. That is exactly where the hypothesis plugs in. Here is Gauss's formula, done properly.")}
      </p>
      <Derivation t={t} label={tx(t, "mInd_eqGauss", "1 + 2 + … + n = n(n + 1)/2, by induction")}
        steps={[
          { full: true, tex: r`P(n):\ \ 1 + 2 + \dots + n = \frac{n(n+1)}{2}, \quad n \ge 1`, why: tx(t, "mInd_g1", "the statement") },
          { full: true, tex: r`P(1):\ \ 1 = \frac{1 \cdot 2}{2}\ \checkmark`, why: tx(t, "mInd_g2", "base case: both sides are 1") },
          { full: true, tex: r`1 + \dots + k + (k+1) = \amber{\frac{k(k+1)}{2}} + (k+1)`, why: tx(t, "mInd_g3", "inductive step: the sum up to k + 1 is the sum up to k plus k + 1; replace the sum up to k using P(k)") },
          { full: true, tex: r`= \frac{k(k+1) + 2(k+1)}{2} = \frac{(k+1)(k+2)}{2}`, why: tx(t, "mInd_g4", "common denominator, then factor out k + 1") },
          { full: true, tex: r`= \green{\frac{(k+1)\big((k+1)+1\big)}{2}}`, why: tx(t, "mInd_g5", "this is exactly the formula with n = k + 1: P(k + 1) holds") },
        ]} />
      <p>
        {tx(t, "mInd_sumBody2",
          "The amber part is where the hypothesis is used. Every induction proof has such a moment; if you never use P(k), you have either found a direct proof or made a mistake. The same pattern proves that the first n odd numbers add up to n²: 1 + 3 + … + (2k − 1) + (2k + 1) = k² + 2k + 1 = (k + 1)². And it proves the sum of squares from the summation chapter.")}
      </p>
      <Derivation t={t} label={tx(t, "mInd_eqSq", "The step for Σk² = n(n + 1)(2n + 1)/6")}
        steps={[
          { full: true, tex: r`\sum_{i=1}^{k+1} i^2 = \amber{\frac{k(k+1)(2k+1)}{6}} + (k+1)^2`, why: tx(t, "mInd_s1", "split off the last term and use the hypothesis") },
          { full: true, tex: r`= \frac{(k+1)\big(k(2k+1) + 6(k+1)\big)}{6} = \frac{(k+1)(2k^2 + 7k + 6)}{6}`, why: tx(t, "mInd_s2", "factor out (k + 1)/6") },
          { full: true, tex: r`= \green{\frac{(k+1)(k+2)(2k+3)}{6}}`, why: tx(t, "mInd_s3", "2k² + 7k + 6 = (k + 2)(2k + 3): the formula with n = k + 1") },
        ]} />

      <H2>{tx(t, "mInd_divTitle", "Proving divisibility")}</H2>
      <p>
        {tx(t, "mInd_divBody",
          "Claim: 4ⁿ − 1 is divisible by 3 for every n ≥ 1. Base: 4 − 1 = 3. For the step, write 4ᵏ⁺¹ − 1 in terms of 4ᵏ − 1, which the hypothesis says is a multiple of 3, say 3m.")}
      </p>
      <Derivation t={t} label={tx(t, "mInd_eqDiv", "3 divides 4ⁿ − 1")}
        steps={[
          { full: true, tex: r`4^{k+1} - 1 = 4 \cdot 4^k - 1 = 4\,(4^k - 1) + 3`, why: tx(t, "mInd_d1", "add and subtract 4 to make 4ᵏ − 1 appear: 4 · 4ᵏ − 4 + 4 − 1") },
          { full: true, tex: r`= 4 \cdot \amber{3m} + 3`, why: tx(t, "mInd_d2", "the hypothesis: 4ᵏ − 1 = 3m for some whole number m") },
          { full: true, tex: r`= \green{3\,(4m + 1)}`, why: tx(t, "mInd_d3", "a multiple of 3, so P(k + 1) holds") },
        ]} />
      <Callout type="info" t={t}>
        {tx(t, "mInd_modTip", "The modular arithmetic chapter gives a one-line proof: 4 ≡ 1 (mod 3), so 4ⁿ ≡ 1ⁿ = 1 and 4ⁿ − 1 ≡ 0. Induction is not always the shortest route, but it always applies when the claim is indexed by n.")}
      </Callout>

      <H2>{tx(t, "mInd_ineqTitle", "Inequalities, and choosing the base")}</H2>
      <p>
        {tx(t, "mInd_ineqBody",
          "Claim: 2ⁿ ≥ n². Check small cases: n = 1 (2 ≥ 1), n = 2 (4 ≥ 4), n = 3 (8 ≥ 9 is false!), n = 4 (16 ≥ 16), n = 5 (32 ≥ 25). So the claim is false at 3 and must start later. For the step, assume 2ᵏ ≥ k². Then 2ᵏ⁺¹ = 2 · 2ᵏ ≥ 2k², and we need 2k² ≥ (k + 1)², which rearranges to k² ≥ 2k + 1, true once k ≥ 3. So the step works from k = 3 on, but P(3) is false; the first true case from which the step carries on is n = 4. The base must be where the statement is true and the step already works.")}
      </p>
      <Derivation t={t} label={tx(t, "mInd_eqPow", "2ⁿ ≥ n² for n ≥ 4")}
        steps={[
          { full: true, tex: r`P(4):\ \ 2^4 = 16 \ge 16 = 4^2\ \checkmark`, why: tx(t, "mInd_q1", "base case at n = 4") },
          { full: true, tex: r`2^{k+1} = 2 \cdot 2^k \ge 2\,\amber{k^2}`, why: tx(t, "mInd_q2", "step: use the hypothesis 2ᵏ ≥ k²") },
          { full: true, tex: r`2k^2 - (k+1)^2 = k^2 - 2k - 1 = (k-1)^2 - 2 \ge 0 \text{ for } k \ge 3`, why: tx(t, "mInd_q3", "(k − 1)² ≥ 4 once k ≥ 3, so 2k² ≥ (k + 1)²") },
          { full: true, tex: r`2^{k+1} \ge 2k^2 \ge \green{(k+1)^2}`, why: tx(t, "mInd_q4", "chain the two inequalities: P(k + 1)") },
        ]} />
      <LiveFormula label={tx(t, "mInd_livePow", "Try it: 2ⁿ against n²")}
        tex={r`2^n \ \ge\ n^2 \ ?`}
        vars={[{ id: "n", label: "n", min: 1, max: 20, step: 1, value: 3, fmt: v => String(v) }]}
        compute={powNumbers(t)}
        note={tx(t, "mInd_livePowNote", "It starts on the one failure, n = 3. From 4 on the meter only shrinks: 2ⁿ doubles each step while n² grows by less and less in proportion, which is exactly what the inductive step says.")} />

      <H2>{tx(t, "mInd_strongTitle", "Strong induction")}</H2>
      <p>
        {tx(t, "mInd_strongBody",
          "Sometimes P(k + 1) does not follow from P(k) alone but from some earlier case. Strong induction lets the step assume all the previous cases, P(n₀), P(n₀ + 1), …, P(k), at once. It is no stronger logically (the dominoes still fall in order), only more convenient. Example: every whole number n ≥ 2 is a product of primes. Take k + 1. If it is prime, done. If not, k + 1 = a · b with both a and b between 2 and k. Neither a nor b is k, so plain induction does not help, but strong induction says each is a product of primes, and so is their product.")}
      </p>
      <p>
        {tx(t, "mInd_stampBody",
          "A second example: with 4-cent and 5-cent stamps you can pay any amount of 12 cents or more. Base cases 12 = 4 + 4 + 4, 13 = 4 + 4 + 5, 14 = 4 + 5 + 5, 15 = 5 + 5 + 5. Step: for k + 1 ≥ 16, the amount k − 3 is at least 12, so it can be paid, and one more 4-cent stamp pays k + 1. Here the step reaches back four places, so four base cases are needed, one for each starting domino.")}
      </p>

      <H2>{tx(t, "mInd_wrongTitle", "Three broken \"proofs\"")}</H2>
      <H3>{tx(t, "mInd_w1Title", "A step with no base")}</H3>
      <p>
        {tx(t, "mInd_w1Body",
          "\"Every n equals n + 1.\" Step: if k = k + 1, add 1 to both sides: k + 1 = k + 2. The step is perfectly valid. There is just no n for which the statement starts out true, so nothing ever falls. Always check the base case.")}
      </p>
      <H3>{tx(t, "mInd_w2Title", "All horses are the same colour")}</H3>
      <p>
        {tx(t, "mInd_w2Body",
          "\"In any group of n horses, all have the same colour.\" Base: one horse, fine. Step: take k + 1 horses; remove the first, and the remaining k are one colour; remove the last instead, and those k are one colour; the two groups overlap, so all k + 1 share a colour. The flaw is hidden in \"overlap\": going from k = 1 to k + 1 = 2, the two groups are {horse 2} and {horse 1}, which share no horse. One single link fails, so the chain stops at the first domino. A step must work for every k ≥ n₀, including the smallest.")}
      </p>
      <H3>{tx(t, "mInd_w3Title", "Examples instead of a step")}</H3>
      <p>
        {tx(t, "mInd_w3Body",
          "Euler noticed that n² + n + 41 is prime for n = 0, 1, 2, …, 39: forty primes in a row. It is not prime for n = 40, since 40² + 40 + 41 = 40 · 41 + 41 = 41². However many cases you check, without a proof of the step you know nothing about the next case. Use examples to guess a pattern, then prove it.")}
      </p>

      <H2>{tx(t, "mInd_recTitle", "Induction and recursion")}</H2>
      <p>
        {tx(t, "mInd_recBody",
          "Induction is the mirror image of recursion. A recursive definition says how to get the case n + 1 from the case n, plus a starting value; an induction proof shows a property survives each such step. That is why statements about recursively defined objects, such as Fibonacci numbers, factorials or a recursive algorithm, are almost always proved by induction. The Algorithms track proves recursive functions correct exactly this way.")}
      </p>

      <H2>{tx(t, "mInd_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mInd_ex1", "1. Odd numbers: P(n): 1 + 3 + … + (2n − 1) = n². Base: 1 = 1². Step: k² + (2k + 1) = (k + 1)².")}</p>
      <p>{tx(t, "mInd_ex2", "2. n³ − n is divisible by 3. Base: 1 − 1 = 0 = 3 · 0. Step: (k + 1)³ − (k + 1) = (k³ − k) + 3k² + 3k, a multiple of 3 plus 3(k² + k).")}</p>
      <p>{tx(t, "mInd_ex3", "3. Geometric sum: P(n): 1 + 2 + 4 + … + 2ⁿ = 2ⁿ⁺¹ − 1. Base n = 0: 1 = 2 − 1. Step: (2ᵏ⁺¹ − 1) + 2ᵏ⁺¹ = 2 · 2ᵏ⁺¹ − 1 = 2ᵏ⁺² − 1.")}</p>
      <H3>{tx(t, "mInd_ex4Title", "Bernoulli's inequality")}</H3>
      <p>{tx(t, "mInd_ex4", "4. For x ≥ −1 and n ≥ 1: (1 + x)ⁿ ≥ 1 + nx. Base: 1 + x ≥ 1 + x. Step: (1 + x)ᵏ⁺¹ = (1 + x)ᵏ(1 + x) ≥ (1 + kx)(1 + x) = 1 + (k + 1)x + kx² ≥ 1 + (k + 1)x. Multiplying the hypothesis by 1 + x keeps the direction because 1 + x ≥ 0, and kx² ≥ 0 can be dropped.")}</p>

      <MathPracticeFigure t={t} set="induction" />

      <H2>{tx(t, "mInd_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mInd_tWrong", "Wrong"), tx(t, "mInd_tRight", "Right"), tx(t, "mInd_tWhy", "Why")]}
        rows={[
          [tx(t, "mInd_m1w", "skipping the base case"), tx(t, "mInd_m1r", "always check P(n₀)"), tx(t, "mInd_m1", "a valid step can carry a false statement")],
          [tx(t, "mInd_m2w", "assuming P(k + 1) in the step"), tx(t, "mInd_m2r", "assume P(k), prove P(k + 1)"), tx(t, "mInd_m2", "that would assume what you want to prove")],
          [tx(t, "mInd_m3w", "\"assume P(n) for all n\""), tx(t, "mInd_m3r", "\"assume P(k) for one k\""), tx(t, "mInd_m3", "the first is the conclusion, not the hypothesis")],
          [tx(t, "mInd_m4w", "a step that silently needs k ≥ 2"), tx(t, "mInd_m4r", "check the smallest k too"), tx(t, "mInd_m4", "the horses fail at k = 1")],
          [tx(t, "mInd_m5w", "many examples = proof"), tx(t, "mInd_m5r", "examples suggest, induction proves"), tx(t, "mInd_m5", "n² + n + 41 fails at 40")],
        ]}
      />

      <KeyIdeas t={t} id="mInd" items={[
        "Induction proves P(n) for every n ≥ n₀ from two parts: the base case P(n₀) and the step P(k) ⇒ P(k + 1).",
        "Either part alone proves nothing: a step needs a true start, a start needs a step.",
        "It works because a smallest counterexample would contradict the step (well-ordering).",
        "In the step, split P(k + 1) so that P(k) appears, use the hypothesis, finish the algebra.",
        "Pick the base where the statement is true and the step already holds (2ⁿ ≥ n² from n = 4).",
        "Strong induction may assume all earlier cases; it needs as many base cases as the step reaches back.",
        "Examples suggest a pattern; only a proof covers every case.",
      ]} />
    </Article>
  );
}
