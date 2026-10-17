"use client";

// Discrete Mathematics 5: recurrence relations — a rule plus starting values;
// unrolling (the Tower of Hanoi, 2ⁿ − 1, checked by induction); first-order
// linear recurrences and their fixed point; counting with recurrences
// (domino tilings, strings with no two 1s in a row); second-order linear
// recurrences solved with the characteristic equation (two roots, a double
// root, complex roots); Binet's formula for Fibonacci and why Fₙ =
// round(φⁿ/√5); the matrix view (eigenvalues); and a first non-homogeneous
// case.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { RecurrenceFigure } from "@/components/lesson/figures/math/RecurrenceFigure";
import { DominoTilingFigure } from "@/components/lesson/figures/math/DominoTilingFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formulas: the fixed point, and Binet ─────────────────────────────────

const num = (v: number, d = 4) => String(+v.toFixed(d)).replace("-", "−");

function firstOrderNumbers(v: Record<string, number>) {
  const { c, d, a0 } = v;
  if (Math.abs(1 - c) < 1e-9) return { tex: r`c = 1:\ a_n = a_0 + nd = ${num(a0)} + ${num(d)}n` };
  const s = d / (1 - c), a10 = c ** 10 * (a0 - s) + s;
  return {
    tex: r`a^* = \frac{${num(d)}}{1 - ${num(c)}} = ${num(s)} \qquad a_{10} = ${num(c)}^{10}(${num(a0)} - ${num(s)}) + ${num(s)} = \green{${num(a10, 3)}}`,
  };
}

function binetNumbers(v: Record<string, number>) {
  const n = v.n, phi = (1 + Math.sqrt(5)) / 2, psi = (1 - Math.sqrt(5)) / 2;
  const big = phi ** n / Math.sqrt(5), small = psi ** n / Math.sqrt(5);
  return {
    tex: r`\frac{\varphi^{${n}}}{\sqrt5} \approx ${num(big, 4)} \qquad \frac{\psi^{${n}}}{\sqrt5} \approx ${num(small, 4)} \qquad F_{${n}} = \green{${Math.round(big - small)}}`,
  };
}

export function RecurrencesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mRec_intro",
          "Many sequences are easiest to describe by how each term comes from the ones before it: the next Fibonacci number is the sum of the previous two, a savings account next year is this year's plus interest, the moves to solve a puzzle with n pieces are twice those for n − 1, plus one. Such a rule is a recurrence relation. It makes computing the hundredth term slow, one step at a time. This chapter turns recurrences into closed formulas that give any term directly, and shows that counting problems lead to recurrences again and again.")}
      </Lead>

      <Goals t={t} id="mRec" items={[
        "Write a recurrence with its starting values, and unroll simple ones into a formula.",
        "Solve first-order linear recurrences aₙ = c·aₙ₋₁ + d.",
        "Find a recurrence for a counting problem by looking at how the last step can go.",
        "Solve aₙ = p·aₙ₋₁ + q·aₙ₋₂ with the characteristic equation, including Binet's formula for Fibonacci.",
      ]} />

      <H2>{tx(t, "mRec_whatTitle", "A rule and a start")}</H2>
      <p>
        {tx(t, "mRec_whatBody",
          "A recurrence relation gives each term aₙ of a sequence from earlier terms. On its own it does not fix the sequence: aₙ = 2aₙ₋₁ fits 1, 2, 4, 8, … and 3, 6, 12, 24, … alike. You also need initial conditions, enough starting values to get going. A rule that looks back k steps needs k of them. The order of a recurrence is how far back it looks: aₙ = 2aₙ₋₁ is first order, Fibonacci, Fₙ = Fₙ₋₁ + Fₙ₋₂ with F₀ = 0, F₁ = 1, is second order. Solving a recurrence means finding a closed form: a formula for aₙ in terms of n alone.")}
      </p>
      <LessonTable
        headers={[tx(t, "mRec_tRule", "Recurrence"), tx(t, "mRec_tStart", "Start"), tx(t, "mRec_tTerms", "Terms"), tx(t, "mRec_tClosed", "Closed form")]}
        rows={[
          ["aₙ = aₙ₋₁ + 3", "a₀ = 2", "2, 5, 8, 11, …", "aₙ = 2 + 3n"],
          ["aₙ = 2aₙ₋₁", "a₀ = 3", "3, 6, 12, 24, …", "aₙ = 3 · 2ⁿ"],
          ["aₙ = n · aₙ₋₁", "a₀ = 1", "1, 1, 2, 6, 24, …", "aₙ = n!"],
          ["Fₙ = Fₙ₋₁ + Fₙ₋₂", "F₀ = 0, F₁ = 1", "0, 1, 1, 2, 3, 5, 8, …", tx(t, "mRec_tBinet", "Binet's formula, below")],
        ]}
      />
      <p>
        {tx(t, "mRec_whatBody2",
          "The first two rows are the arithmetic and geometric sequences of the sequences chapter, now written as rules.")}
      </p>

      <H2>{tx(t, "mRec_hanoiTitle", "Unrolling: the Tower of Hanoi")}</H2>
      <p>
        {tx(t, "mRec_hanoiBody",
          "The puzzle: n discs of different sizes sit on one of three pegs, largest at the bottom. Move them all to another peg, one disc at a time, never putting a disc on a smaller one. Let Hₙ be the fewest moves for n discs. The largest disc must move at some point, and at that moment the other n − 1 discs must all sit on the third peg. Getting them there takes Hₙ₋₁ moves, the big disc takes 1, and putting the n − 1 back on top of it takes Hₙ₋₁ more. So Hₙ = 2Hₙ₋₁ + 1, with H₁ = 1 (or H₀ = 0).")}
      </p>
      <Derivation t={t} label={tx(t, "mRec_eqUnroll", "Unroll Hₙ = 2Hₙ₋₁ + 1")}
        steps={[
          { full: true, tex: r`H_n = 2H_{n-1} + 1 = 2(2H_{n-2} + 1) + 1 = 4H_{n-2} + 2 + 1`, why: tx(t, "mRec_u1", "replace Hₙ₋₁ by its own rule") },
          { full: true, tex: r`= 8H_{n-3} + 4 + 2 + 1 = \dots = 2^k H_{n-k} + (2^{k-1} + \dots + 2 + 1)`, why: tx(t, "mRec_u2", "keep going: after k steps the pattern is clear") },
          { full: true, tex: r`= 2^n H_0 + (2^{n-1} + \dots + 2 + 1) = 0 + (2^n - 1)`, why: tx(t, "mRec_u3", "take k = n to reach H₀ = 0; the geometric sum 1 + 2 + … + 2ⁿ⁻¹ is 2ⁿ − 1") },
          { full: true, tex: r`\green{H_n = 2^n - 1}`, why: tx(t, "mRec_u4", "64 discs would need 2⁶⁴ − 1 ≈ 1.8 × 10¹⁹ moves") },
        ]} />
      <Callout type="info" t={t}>
        {tx(t, "mRec_checkTip", "Unrolling guesses a pattern from a few steps (the \"…\"). Induction proves it: H₀ = 2⁰ − 1 = 0, and if Hₙ₋₁ = 2ⁿ⁻¹ − 1, then Hₙ = 2(2ⁿ⁻¹ − 1) + 1 = 2ⁿ − 1. Recurrences and induction fit together exactly: the recurrence is the inductive step.")}
      </Callout>

      <H2>{tx(t, "mRec_firstTitle", "First-order linear recurrences")}</H2>
      <p>
        {tx(t, "mRec_firstBody",
          "Hanoi is one case of aₙ = c·aₙ₋₁ + d, where c and d are fixed numbers: an account that earns interest (c = 1.05) and receives a deposit (d) every year, a medicine of which a fraction is cleared each day while a new dose comes in. The trick is the fixed point: the value a* that the rule leaves unchanged, a* = c·a* + d, so a* = d/(1 − c) when c ≠ 1. Measure every term from it.")}
      </p>
      <Derivation t={t} label={tx(t, "mRec_eqFirst", "Solve aₙ = c·aₙ₋₁ + d (c ≠ 1)")}
        steps={[
          { full: true, tex: r`a^* = c\,a^* + d \;\Rightarrow\; a^* = \frac{d}{1 - c}`, why: tx(t, "mRec_f1", "the fixed point: if the sequence ever hits it, it stays there") },
          { full: true, tex: r`a_n - a^* = (c\,a_{n-1} + d) - (c\,a^* + d) = c\,(a_{n-1} - a^*)`, why: tx(t, "mRec_f2", "subtract the two equations: the d's cancel") },
          { full: true, tex: r`a_n - a^* = c^n (a_0 - a^*)`, why: tx(t, "mRec_f3", "the distance from a* is a geometric sequence with ratio c") },
          { full: true, tex: r`\green{a_n = c^n (a_0 - a^*) + a^*}`, why: tx(t, "mRec_f4", "add a* back") },
        ]} />
      <p>
        {tx(t, "mRec_firstBody2",
          "This also says what happens in the long run. If −1 < c < 1, cⁿ shrinks to 0 and aₙ settles at a*, whatever it started from: the daily medicine level approaches d/(1 − c). If c > 1 the distance from a* grows geometrically. Hanoi has c = 2, d = 1, so a* = −1 and Hₙ = 2ⁿ(0 + 1) − 1, as before.")}
      </p>
      <LiveFormula label={tx(t, "mRec_liveFirst", "Try it: aₙ = c·aₙ₋₁ + d")}
        tex={r`a_n = c^n (a_0 - a^*) + a^*, \qquad a^* = \frac{d}{1-c}`}
        vars={[
          { id: "c", label: "c", min: -1.5, max: 2, step: 0.1, value: 0.5, fmt: v => num(v, 2) },
          { id: "d", label: "d", min: -5, max: 10, step: 1, value: 4, fmt: v => num(v, 2) },
          { id: "a0", label: "a₀", min: -10, max: 20, step: 1, value: 0, fmt: v => num(v, 2) },
        ]}
        compute={firstOrderNumbers}
        note={tx(t, "mRec_liveFirstNote", "With c = 0.5 and d = 4 the terms head for a* = 8 from any start. Push c above 1 and they run away from a*; make c negative and they jump from side to side of it.")} />

      <H2>{tx(t, "mRec_countTitle", "Counting with recurrences")}</H2>
      <p>
        {tx(t, "mRec_countBody",
          "Recurrences appear by themselves in counting: describe the last step, and what is left is the same problem, smaller. In how many ways Tₙ can a 2 × n strip be tiled with 1 × 2 dominoes? Look at the right end. Either one domino stands upright in the last column, and the rest is any tiling of a 2 × (n − 1) strip; or the last column is covered by two dominoes lying flat, one above the other, which also cover the column before it, and the rest is any tiling of a 2 × (n − 2) strip. One domino lying flat alone is impossible: the square below or above it could then only be covered by another flat domino in the same two columns. So Tₙ = Tₙ₋₁ + Tₙ₋₂, with T₁ = 1 and T₂ = 2: the Fibonacci numbers, shifted, Tₙ = Fₙ₊₁.")}
      </p>

      <DominoTilingFigure t={t} />

      <p>
        {tx(t, "mRec_stringBody",
          "Another one: how many strings of n bits (0s and 1s) have no two 1s next to each other? Call it Sₙ. Look at the last bit. If it is 0, anything allowed of length n − 1 can come before it. If it is 1, the bit before must be 0, and anything allowed of length n − 2 comes before that. So Sₙ = Sₙ₋₁ + Sₙ₋₂ again, with S₁ = 2 (0 and 1) and S₂ = 3 (00, 01, 10): Sₙ = Fₙ₊₂.")}
      </p>

      <H2>{tx(t, "mRec_secondTitle", "Second order: the characteristic equation")}</H2>
      <p>
        {tx(t, "mRec_secondBody",
          "Now solve aₙ = p·aₙ₋₁ + q·aₙ₋₂ for any fixed numbers p and q (with q ≠ 0). First-order recurrences gave powers cⁿ, so try a power: aₙ = xⁿ for some number x ≠ 0. That turns the recurrence into an ordinary equation.")}
      </p>
      <Derivation t={t} label={tx(t, "mRec_eqChar", "From the recurrence to the characteristic equation")}
        steps={[
          { full: true, tex: r`x^n = p\,x^{n-1} + q\,x^{n-2}`, why: tx(t, "mRec_c1", "put aₙ = xⁿ into the recurrence") },
          { full: true, tex: r`x^2 = p\,x + q`, why: tx(t, "mRec_c2", "divide by xⁿ⁻²: the characteristic equation, a quadratic") },
          { full: true, tex: r`r_{1,2} = \frac{p \pm \sqrt{p^2 + 4q}}{2}`, why: tx(t, "mRec_c3", "its roots, by the quadratic formula applied to x² − px − q = 0") },
          { full: true, tex: r`a_n = A\,r_1^{\,n} + B\,r_2^{\,n}`, why: tx(t, "mRec_c4", "each root gives a solution, and so does any combination: the recurrence is linear, so sums and multiples of solutions are solutions") },
          { full: true, tex: r`\green{A + B = a_0, \qquad A\,r_1 + B\,r_2 = a_1}`, why: tx(t, "mRec_c5", "choose A and B to match the two starting values: a linear system, solvable when r₁ ≠ r₂") },
        ]} />
      <Equation label={tx(t, "mRec_eqSol", "Solving aₙ = p·aₙ₋₁ + q·aₙ₋₂")}
        where={[
          [r`r_1, r_2`, tx(t, "mRec_wRoots", "the roots of the characteristic equation x² = px + q")],
          [r`A, B`, tx(t, "mRec_wAB", "constants fixed by the starting values a₀ and a₁")],
          [r`\rho, \theta`, tx(t, "mRec_wPolar", "for complex roots ρ(cos θ ± i sin θ): their size and angle, as in the complex numbers chapter")],
        ]}
        words={tx(t, "mRec_solWords", "Find the roots of x² = px + q. Two different real roots: a mix of their powers. One double root: its powers times a straight line in n. Complex roots: a growing or shrinking wave.")}>
        {r`a_n = \begin{cases} A\,r_1^{\,n} + B\,r_2^{\,n} & r_1 \ne r_2 \text{ real} \\ (A + Bn)\,r^n & r_1 = r_2 = r \\ \rho^n (C\cos n\theta + D\sin n\theta) & r = \rho(\cos\theta \pm i\sin\theta) \end{cases}`}
      </Equation>
      <p>
        {tx(t, "mRec_doubleBody",
          "Why the extra n for a double root? Then p² + 4q = 0, so r = p/2 and q = −r². Check that n·rⁿ works: p(n − 1)rⁿ⁻¹ + q(n − 2)rⁿ⁻² = 2r(n − 1)rⁿ⁻¹ − r²(n − 2)rⁿ⁻² = (2n − 2 − n + 2)rⁿ = n·rⁿ. Yes. The two solutions rⁿ and n·rⁿ are enough to match any two starting values.")}
      </p>

      <RecurrenceFigure t={t} />

      <H3>{tx(t, "mRec_binetTitle", "Binet's formula for Fibonacci")}</H3>
      <Derivation t={t} label={tx(t, "mRec_eqBinet", "Solve Fₙ = Fₙ₋₁ + Fₙ₋₂, F₀ = 0, F₁ = 1")}
        steps={[
          { tex: r`x^2 = x + 1`, why: tx(t, "mRec_b1", "the characteristic equation, with p = q = 1") },
          { tex: r`\varphi = \frac{1 + \sqrt5}{2} \approx 1.618, \qquad \psi = \frac{1 - \sqrt5}{2} \approx -0.618`, why: tx(t, "mRec_b2", "its roots; φ (phi) is the golden ratio, ψ (psi) the other root") },
          { tex: r`A + B = 0, \qquad A\varphi + B\psi = 1`, why: tx(t, "mRec_b3", "the starting values F₀ = 0 and F₁ = 1") },
          { tex: r`A = \frac{1}{\varphi - \psi} = \frac{1}{\sqrt5}, \qquad B = -\frac{1}{\sqrt5}`, why: tx(t, "mRec_b4", "B = −A, then A(φ − ψ) = 1, and φ − ψ = √5") },
          { tex: r`\green{F_n = \frac{\varphi^n - \psi^n}{\sqrt5}}`, why: tx(t, "mRec_b5", "Binet's formula: irrational numbers on the right, a whole number every time") },
        ]} />
      <p>
        {tx(t, "mRec_roundBody",
          "Since |ψ| < 1, the term ψⁿ/√5 is always smaller than 1/√5 ≈ 0.447 in size, and it shrinks fast. So Fₙ is the whole number nearest to φⁿ/√5. The ratio of consecutive terms tends to the bigger root: Fₙ₊₁/Fₙ → φ. Every second-order recurrence with a dominant root behaves the same way: in the long run, aₙ grows like A·r₁ⁿ.")}
      </p>
      <LiveFormula label={tx(t, "mRec_liveBinet", "Try it: Fₙ from Binet's formula")}
        tex={r`F_n = \frac{\varphi^n - \psi^n}{\sqrt5}`}
        vars={[{ id: "n", label: "n", min: 0, max: 40, step: 1, value: 10, fmt: v => String(v) }]}
        compute={binetNumbers}
        note={tx(t, "mRec_liveBinetNote", "At n = 10 the big term is 55.0036 and the small one 0.0036: subtract and you get exactly 55. By n = 40 the small term is about 10⁻⁹.")} />

      <H3>{tx(t, "mRec_matTitle", "The same roots as eigenvalues")}</H3>
      <p>
        {tx(t, "mRec_matBody",
          "A second-order recurrence is a first-order one for pairs. Put the last two terms in a vector: (aₙ, aₙ₋₁) = M·(aₙ₋₁, aₙ₋₂), where M has rows (p, q) and (1, 0). Then (aₙ, aₙ₋₁) = Mⁿ⁻¹·(a₁, a₀). The characteristic polynomial of M, det(M − λI) = λ² − pλ − q, is the same as the recurrence's: the roots r₁ and r₂ are the eigenvalues of M (eigen chapter), and powers of M grow like powers of its biggest eigenvalue.")}
      </p>

      <H3>{tx(t, "mRec_nonhomTitle", "Adding a constant")}</H3>
      <p>
        {tx(t, "mRec_nonhomBody",
          "A recurrence with an extra constant, aₙ = p·aₙ₋₁ + q·aₙ₋₂ + d, is handled like the first-order case: find a constant solution a* = p·a* + q·a* + d, that is a* = d/(1 − p − q) when p + q ≠ 1, and the differences aₙ − a* obey the plain recurrence. Hanoi fits too: Hₙ = 2Hₙ₋₁ + 1 has a* = −1, and Hₙ + 1 = 2ⁿ.")}
      </p>

      <H2>{tx(t, "mRec_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mRec_ex1", "1. aₙ = 5aₙ₋₁ − 6aₙ₋₂, a₀ = 2, a₁ = 5. Roots of x² = 5x − 6: 2 and 3. A + B = 2 and 2A + 3B = 5 give A = B = 1: aₙ = 2ⁿ + 3ⁿ. Check a₂ = 5 · 5 − 6 · 2 = 13 = 4 + 9.")}</p>
      <p>{tx(t, "mRec_ex2", "2. aₙ = 4aₙ₋₁ − 4aₙ₋₂, a₀ = 1, a₁ = 4. Double root 2: aₙ = (A + Bn)2ⁿ with A = 1 and 2(1 + B) = 4, B = 1: aₙ = (1 + n)2ⁿ.")}</p>
      <p>{tx(t, "mRec_ex3", "3. Each year 10% of a lake's fish die and 200 are added: aₙ = 0.9aₙ₋₁ + 200. The fixed point is 200/0.1 = 2000 fish, the long-run level from any start.")}</p>
      <p>{tx(t, "mRec_ex4", "4. Climbing n stairs taking 1 or 2 steps at a time: the last move is a single step (from stair n − 1) or a double one (from n − 2), so Cₙ = Cₙ₋₁ + Cₙ₋₂, C₁ = 1, C₂ = 2: Cₙ = Fₙ₊₁, and 10 stairs can be climbed in 89 ways.")}</p>

      <MathPracticeFigure t={t} set="recurrences" />

      <H2>{tx(t, "mRec_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mRec_tWrong", "Wrong"), tx(t, "mRec_tRight", "Right"), tx(t, "mRec_tWhy", "Why")]}
        rows={[
          [tx(t, "mRec_m1w", "a rule with no starting values"), tx(t, "mRec_m1r", "k starting values for order k"), tx(t, "mRec_m1", "the same rule fits many sequences")],
          [tx(t, "mRec_m2w", "characteristic equation x² + px + q = 0"), "x² − px − q = 0", tx(t, "mRec_m2", "move every term of x² = px + q to one side; signs change")],
          [tx(t, "mRec_m3w", "double root: A·rⁿ + B·rⁿ"), "(A + Bn)·rⁿ", tx(t, "mRec_m3", "A·rⁿ + B·rⁿ is a single solution, too few to fit two starting values")],
          [tx(t, "mRec_m4w", "A and B from the recurrence"), tx(t, "mRec_m4r", "A and B from a₀ and a₁"), tx(t, "mRec_m4", "the roots come from the rule, the constants from the start")],
          [tx(t, "mRec_m5w", "Tₙ for tilings starts at T₁ = 1, T₂ = 1"), "T₂ = 2", tx(t, "mRec_m5", "two upright or two flat: check small cases by hand")],
        ]}
      />

      <KeyIdeas t={t} id="mRec" items={[
        "A recurrence gives each term from earlier ones; with k starting values for order k it fixes the sequence.",
        "Unroll a recurrence to guess the closed form, then prove it by induction: Hanoi needs 2ⁿ − 1 moves.",
        "aₙ = c·aₙ₋₁ + d: aₙ = cⁿ(a₀ − a*) + a* with the fixed point a* = d/(1 − c).",
        "Counting problems give recurrences by splitting on the last step: domino tilings and bit strings give Fibonacci.",
        "aₙ = p·aₙ₋₁ + q·aₙ₋₂: solve x² = px + q; aₙ = A r₁ⁿ + B r₂ⁿ, or (A + Bn)rⁿ for a double root.",
        "Fₙ = (φⁿ − ψⁿ)/√5 = round(φⁿ/√5), and Fₙ₊₁/Fₙ → φ, the bigger root.",
        "The roots are the eigenvalues of the 2 × 2 matrix that moves the pair of last terms one step on.",
      ]} />
    </Article>
  );
}
