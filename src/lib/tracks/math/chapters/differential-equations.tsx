"use client";

// Calculus 11: differential equations — equations for an unknown function and
// its rates; order, general solution, initial conditions; slope fields and
// equilibria; exponential growth and decay (half-life); separation of
// variables (Newton's cooling, the logistic curve via partial fractions);
// Euler's method by hand and its error; stability of equilibria and of Euler's
// method itself (h < 2/k); second-order equations: the spring, damping, the
// characteristic equation and its three cases, and the eigenvalue link.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SlopeFieldFigure } from "@/components/lesson/figures/math/SlopeFieldFigure";

const r = String.raw;

export function DifferentialEquationsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mOde_intro",
          "The laws of nature are rarely written as formulas for a quantity. They are written as rules for how fast it changes: a hot drink cools faster the hotter it is, a population grows in proportion to its size, a spring pulls harder the further it is stretched. Such a rule is a differential equation, an equation whose unknown is a whole function and which involves that function's derivatives. The fundamental theorem chapter could integrate an acceleration that was known in advance; here the rate depends on the unknown itself, and a new set of ideas is needed. This chapter closes the Calculus section.")}
      </Lead>

      <Goals t={t} id="mOde" items={[
        "Read a differential equation as a slope field.",
        "Solve growth and decay, and other separable equations.",
        "Follow a solution step by step with Euler's method.",
        "Tell whether a solution settles or runs away, and solve the spring equation.",
      ]} />

      <H2>{tx(t, "mOde_whatTitle", "What a differential equation is")}</H2>
      <p>
        {tx(t, "mOde_whatBody",
          "An ordinary differential equation (ODE) relates an unknown function y(t) of one variable to its derivatives: y′ = −0.5y, or y″ = −4y, or y′ = t − y. \"Ordinary\" means one input variable; with several inputs and partial derivatives it would be a partial differential equation, beyond this course. The order is the highest derivative that appears: y′ = −0.5y is first order, y″ = −4y second order. A solution is a function that makes the equation true for every t. Checking one is just differentiating and substituting: for y = 3e^(−0.5t), y′ = −1.5e^(−0.5t) = −0.5 · 3e^(−0.5t) = −0.5y ✓.")}
      </p>
      <p>
        {tx(t, "mOde_familyBody",
          "An equation usually has a whole family of solutions. Every y = Ce^(−0.5t) works, for any constant C, just as integration produced a family F + C. The formula with the free constant is the general solution. One extra fact, the initial condition y(0) = y₀, picks out one member: here C = y₀. A differential equation together with its initial condition is an initial value problem, and for well-behaved equations it has exactly one solution. A second-order equation needs two facts, typically the starting position and the starting velocity, because its general solution has two constants.")}
      </p>

      <H2>{tx(t, "mOde_fieldTitle", "Slope fields: the equation as a picture")}</H2>
      <p>
        {tx(t, "mOde_fieldBody",
          "A first-order equation in the form y′ = F(t, y) says: at the point (t, y), a solution passing through it has slope F(t, y). So without solving anything, draw a short segment of that slope at many points of the plane. The result, a slope field, shows every solution at once: each one is a curve that follows the segments like a leaf on a stream. Where F(y) = 0 for a constant value y*, the horizontal line y = y* is itself a solution, an equilibrium: a state that, once reached, never changes.")}
      </p>

      <SlopeFieldFigure t={t} />

      <H2>{tx(t, "mOde_expTitle", "Growth and decay: y′ = ky")}</H2>
      <p>
        {tx(t, "mOde_expBody",
          "The simplest law: the rate of change is proportional to the amount. Money earning continuous interest, bacteria with unlimited food, a radioactive sample (each atom has the same chance to decay per second, so the number of decays per second is proportional to the number of atoms). The derivative rules already contain the answer: eᵏᵗ is the function whose derivative is k times itself. So y = y₀eᵏᵗ, with k > 0 for growth and k < 0 for decay.")}
      </p>
      <Equation label={tx(t, "mOde_eqExp", "Exponential growth and decay")}
        where={[
          [r`k`, tx(t, "mOde_wK", "the relative rate: the fraction by which y changes per unit time (per year, per second)")],
          [r`y_0`, tx(t, "mOde_wY0", "the amount at t = 0")],
          [r`T_{1/2}`, tx(t, "mOde_wHalf", "the half-life for k < 0: the time to fall to half; for k > 0 the same formula gives the doubling time")],
        ]}
        note={tx(t, "mOde_halfNote", "From y₀e^(kT) = y₀/2: kT = ln ½ = −ln 2, so T = ln 2/|k|. The half-life does not depend on how much you start with.")}>
        {r`y' = k\,y \quad\Longrightarrow\quad y(t) = y_0\,e^{kt} \qquad T_{1/2} = \frac{\ln 2}{|k|}`}
      </Equation>
      <p>
        {tx(t, "mOde_carbonBody",
          "Radiocarbon dating. Carbon-14 has a half-life of 5730 years. A bone that has lost track of its carbon for 10 000 years keeps a fraction (½)^(10 000/5730) = (½)^1.745 ≈ 0.298 of what it had in life. Backwards: if a sample keeps 60 %, its age is t = 5730 · ln(1/0.6)/ln 2 = 5730 · 0.511/0.693 ≈ 4220 years.")}
      </p>

      <H2>{tx(t, "mOde_sepTitle", "Separation of variables")}</H2>
      <p>
        {tx(t, "mOde_sepBody",
          "When the right side splits into a factor with only t and a factor with only y, y′ = g(t) h(y), the equation can be solved by integration. Divide by h(y): y′/h(y) = g(t). Integrate both sides with respect to t. On the left, y′ dt is dy (substitution, with y as the new variable), so ∫ dy/h(y) = ∫ g(t) dt. Each side is an ordinary integral in one variable; one constant C on either side is enough. Then solve for y if possible. For y′ = ky: ∫ dy/y = ∫ k dt gives ln|y| = kt + C, so y = ±eᶜ · eᵏᵗ = y₀eᵏᵗ, as expected.")}
      </p>
      <Equation label={tx(t, "mOde_eqSep", "Separation of variables")}
        where={[
          [r`g(t)`, tx(t, "mOde_wG", "the part of the rate that depends only on the input t")],
          [r`h(y)`, tx(t, "mOde_wHy", "the part that depends only on the unknown y (values where h(y) = 0 are equilibria, check them separately)")],
        ]}>
        {r`\frac{dy}{dt} = g(t)\,h(y) \quad\Longrightarrow\quad \int \frac{dy}{h(y)} = \int g(t)\,dt`}
      </Equation>
      <H3>{tx(t, "mOde_coolTitle", "Newton's law of cooling")}</H3>
      <p>
        {tx(t, "mOde_coolBody",
          "An object cools at a rate proportional to how much hotter it is than the room: T′ = −k(T − Tₐ), where Tₐ is the room temperature. Separate: ∫ dT/(T − Tₐ) = −∫ k dt, so ln|T − Tₐ| = −kt + C, and T = Tₐ + (T₀ − Tₐ)e^(−kt). The difference from room temperature decays exponentially; the temperature itself approaches Tₐ, the equilibrium. Worked example: coffee at 90 °C in a 20 °C room is 70 °C after 5 minutes. Then 50 = 70e^(−5k), so k = ln(70/50)/5 = 0.3365/5 ≈ 0.0673 per minute. It reaches 40 °C when 20 = 70e^(−kt), t = ln(3.5)/0.0673 = 1.2528/0.0673 ≈ 18.6 minutes.")}
      </p>
      <H3>{tx(t, "mOde_logTitle", "The logistic curve")}</H3>
      <p>
        {tx(t, "mOde_logBody",
          "Real populations cannot grow forever: food and space run out. The logistic equation y′ = ry(1 − y/K) grows like ry when y is small, but the factor (1 − y/K) slows the growth to zero as y approaches K, the carrying capacity. Separate: ∫ dy/(y(1 − y/K)) = ∫ r dt. The left side needs partial fractions from the integration-techniques chapter: 1/(y(1 − y/K)) = K/(y(K − y)) = 1/y + 1/(K − y). So ln|y| − ln|K − y| = rt + C, that is y/(K − y) = Aeʳᵗ. Solving for y gives the S-shaped curve below, with A fixed by the start.")}
      </p>
      <Equation label={tx(t, "mOde_eqLog", "The logistic solution")}
        where={[
          [r`K`, tx(t, "mOde_wKcap", "the carrying capacity: the stable equilibrium the population levels off at")],
          [r`r`, tx(t, "mOde_wR", "the growth rate while the population is still small")],
          [r`A = \frac{K - y_0}{y_0}`, tx(t, "mOde_wAlog", "from the initial value y(0) = y₀")],
        ]}
        note={tx(t, "mOde_logNote", "Growth is fastest at y = K/2, the inflection point of the S. The figure's logistic mode shows it with r = 0.9, K = 3.")}>
        {r`y(t) = \frac{K}{1 + A\,e^{-rt}}`}
      </Equation>

      <H2>{tx(t, "mOde_eulerTitle", "Euler's method: following the arrows")}</H2>
      <p>
        {tx(t, "mOde_eulerBody",
          "Most differential equations cannot be separated or solved by any formula. But the slope field still tells us where to go. Start at (t₀, y₀). The slope there is F(t₀, y₀); walk along that straight line for a short time h, to t₁ = t₀ + h and y₁ = y₀ + h F(t₀, y₀). Read the slope at the new point and repeat. Each step is the tangent-line approximation from the derivatives chapter. The smaller h is, the closer the zig-zag stays to the true curve.")}
      </p>
      <Equation label={tx(t, "mOde_eqEuler", "Euler's method")}
        where={[
          [r`h`, tx(t, "mOde_wH", "the step size in t")],
          [r`F(t_n, y_n)`, tx(t, "mOde_wSlope", "the slope the equation prescribes at the current point")],
        ]}>
        {r`t_{n+1} = t_n + h \qquad y_{n+1} = y_n + h\,F(t_n,\,y_n)`}
      </Equation>
      <p>{tx(t, "mOde_tableBody", "By hand for y′ = y, y(0) = 1, with h = 0.25 up to t = 1 (the exact answer is e ≈ 2.7183). Each step multiplies by 1 + h = 1.25:")}</p>
      <LessonTable
        headers={["n", "tₙ", "yₙ", tx(t, "mOde_tSlope", "slope F = yₙ"), "yₙ₊₁ = yₙ + 0.25 · F", tx(t, "mOde_tExact", "exact eᵗ")]}
        rows={[
          ["0", "0", "1", "1", "1.25", "1"],
          ["1", "0.25", "1.25", "1.25", "1.5625", "1.2840"],
          ["2", "0.5", "1.5625", "1.5625", "1.9531", "1.6487"],
          ["3", "0.75", "1.9531", "1.9531", "2.4414", "2.1170"],
          ["4", "1", "2.4414", "—", "—", "2.7183"],
        ]}
      />
      <p>
        {tx(t, "mOde_errBody",
          "The result 2.4414 is 0.277 short: the curve bends upward while each step uses the slope at its start, which is always too small. With h = 0.125 (8 steps, 1.125⁸) it is 2.5658, 0.153 short: halving the step roughly halves the error. Euler's method is first order: its error is proportional to h. (It is also the left Riemann sum of the integrals chapter, in disguise.) Better methods sample the slope at more points in each step, as the midpoint and Simpson rules did for integrals; the figure's green curve uses one such method with tiny steps.")}
      </p>

      <H2>{tx(t, "mOde_stabTitle", "Stability: settle or run away")}</H2>
      <p>
        {tx(t, "mOde_stabBody",
          "For an equation y′ = F(y) with an equilibrium y* (F(y*) = 0), what happens to a solution that starts close to it? Just above y*, the sign of F decides the direction. If F′(y*) < 0, then F is negative just above y* and positive just below, so solutions are pushed back toward y*: a stable equilibrium, like a ball in a bowl. If F′(y*) > 0 they are pushed away: unstable, like a ball balanced on a hill. For the logistic equation, F = ry(1 − y/K) has F′(0) = r > 0 (extinction is unstable: a few individuals grow) and F′(K) = −r < 0 (the carrying capacity is stable). For cooling, F′(Tₐ) = −k < 0: the room temperature is stable.")}
      </p>
      <H3>{tx(t, "mOde_numTitle", "When the method itself is unstable")}</H3>
      <p>
        {tx(t, "mOde_numBody",
          "Stability also matters for Euler's method. Apply it to decay, y′ = −ky with k > 0: each step gives yₙ₊₁ = yₙ − hk yₙ = (1 − hk) yₙ. So the Euler values are a geometric sequence with ratio 1 − hk. The true solution decays, but the sequence only decays if |1 − hk| < 1, which means 0 < h < 2/k. For h between 1/k and 2/k the ratio is negative, and the values flip sign every step while shrinking. For h > 2/k the ratio is below −1 and they flip and grow without bound. In the figure, with y′ = −0.8y, the limit is 2/0.8 = 2.5.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mOde_stiffWarn", "The faster a process decays (the larger k), the smaller the step Euler's method needs just to stay stable, even when the solution itself has become boring and flat. Equations that mix a very fast process with a slow one are called stiff, and they are solved with methods designed to avoid this limit.")}
      </Callout>

      <H2>{tx(t, "mOde_springTitle", "Second order: springs and oscillation")}</H2>
      <p>
        {tx(t, "mOde_springBody",
          "A mass m on a spring with stiffness c is pulled back by a force −cy when displaced by y (Hooke's law), and force = mass × acceleration, so my″ = −cy, or y″ = −ω²y with ω = √(c/m). We need a function whose second derivative is −ω² times itself. Both cos ωt and sin ωt work: differentiating twice brings down −ω². The general solution combines them with two constants, y = A cos ωt + B sin ωt, and the waves chapter showed that this is one sinusoid, R cos(ωt − φ). The constants come from the two initial conditions: y(0) = A is the starting displacement, and y′(0) = Bω gives B from the starting velocity. The period is 2π/ω, the same whatever the amplitude.")}
      </p>
      <H3>{tx(t, "mOde_dampTitle", "Friction and the characteristic equation")}</H3>
      <p>
        {tx(t, "mOde_dampBody",
          "Add friction proportional to the velocity and the equation becomes y″ + 2γy′ + ω²y = 0, where γ (gamma) measures the damping. Guess y = e^(λt), since exponentials keep their shape when differentiated: y′ = λe^(λt), y″ = λ²e^(λt). Substituting and dividing by e^(λt), which is never zero, leaves a quadratic, the characteristic equation λ² + 2γλ + ω² = 0, with roots λ = −γ ± √(γ² − ω²). The discriminant sorts the motion into three kinds.")}
      </p>
      <Equation label={tx(t, "mOde_eqChar", "Damped oscillator")}
        where={[
          [r`\gamma`, tx(t, "mOde_wGamma", "the damping rate (friction per unit mass, halved)")],
          [r`\omega`, tx(t, "mOde_wOmega", "the natural angular frequency without friction, √(c/m)")],
          [r`\lambda`, tx(t, "mOde_wLambda", "a root of the characteristic equation; e^(λt) is then a solution")],
        ]}>
        {r`y'' + 2\gamma\,y' + \omega^2 y = 0 \quad\Longrightarrow\quad \lambda^2 + 2\gamma\lambda + \omega^2 = 0,\quad \lambda = -\gamma \pm \sqrt{\gamma^2 - \omega^2}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mOde_tCase", "Case"), tx(t, "mOde_tRoots", "Roots"), tx(t, "mOde_tSol", "Solution"), tx(t, "mOde_tLooks", "Looks like")]}
        rows={[
          [tx(t, "mOde_cOver", "γ > ω (overdamped)"), tx(t, "mOde_cOverR", "two negative real roots"), "c₁e^(λ₁t) + c₂e^(λ₂t)", tx(t, "mOde_cOverL", "creeps back to 0 without swinging (a door closer)")],
          [tx(t, "mOde_cCrit", "γ = ω (critical)"), tx(t, "mOde_cCritR", "one double root −γ"), "(c₁ + c₂t)e^(−γt)", tx(t, "mOde_cCritL", "the fastest return without overshooting")],
          [tx(t, "mOde_cUnder", "γ < ω (underdamped)"), "−γ ± iω_d", "e^(−γt)(A cos ω_d t + B sin ω_d t)", tx(t, "mOde_cUnderL", "swings with a shrinking envelope (a plucked string)")],
        ]}
      />
      <p>
        {tx(t, "mOde_complexBody",
          "In the underdamped case the discriminant is negative and the roots are complex: λ = −γ ± iω_d with ω_d = √(ω² − γ²). Euler's formula turns e^((−γ + iω_d)t) = e^(−γt)(cos ω_d t + i sin ω_d t) into the real solutions in the table: the real part of λ is the decay rate of the envelope, the imaginary part the frequency of the swing.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mOde_eigenInfo", "This is the \"settle or explode\" question from the eigenvalues chapter, in continuous time. Write the state as position and velocity, (y, v). Then y′ = v and v′ = −ω²y − 2γv, a matrix [[0, 1], [−ω², −2γ]] applied to (y, v). Its characteristic polynomial det(A − λI) = λ² + 2γλ + ω² is exactly the characteristic equation, so the λ's are the matrix's eigenvalues. For a matrix map applied step by step, the question was whether |λ| < 1; for a differential equation it is whether the real part of every λ is negative. Then every solution settles to 0; if one is positive, solutions run away.")}
      </Callout>

      <H2>{tx(t, "mOde_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mOde_ex1", "1. y′ = 2ty, y(0) = 3: ∫ dy/y = ∫ 2t dt, ln|y| = t² + C, y = 3e^(t²). Check: y′ = 3 · 2t e^(t²) = 2ty ✓.")}</p>
      <p>{tx(t, "mOde_ex2", "2. A town of 20 000 grows 3 % per year continuously: y = 20 000 e^(0.03t). Doubling time ln 2/0.03 ≈ 23.1 years; after 10 years, 20 000 e^(0.3) ≈ 27 000.")}</p>
      <p>{tx(t, "mOde_ex3", "3. Equilibria of y′ = y² − 4: y = ±2. F′(y) = 2y: F′(2) = 4 > 0 unstable, F′(−2) = −4 < 0 stable. Solutions starting between −2 and 2 drift down to −2.")}</p>
      <p>{tx(t, "mOde_ex4", "4. y″ + 9y = 0, y(0) = 2, y′(0) = 6: ω = 3, y = A cos 3t + B sin 3t with A = 2 and 3B = 6, B = 2: y = 2 cos 3t + 2 sin 3t = 2√2 cos(3t − π/4), period 2π/3.")}</p>
      <p>{tx(t, "mOde_ex5", "5. y″ + 2y′ + 5y = 0: λ² + 2λ + 5 = 0, λ = −1 ± 2i. y = e^(−t)(A cos 2t + B sin 2t): swings with frequency 2 inside an envelope shrinking like e^(−t).")}</p>
      <p>{tx(t, "mOde_ex6", "6. Largest stable Euler step for y′ = −20y: h < 2/20 = 0.1. With h = 0.15 the ratio 1 − 3 = −2 doubles the size every step, with alternating sign.")}</p>

      <H2>{tx(t, "mOde_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mOde_tWrong", "Wrong"), tx(t, "mOde_tRight", "Right"), tx(t, "mOde_tWhy", "Why")]}
        rows={[
          [tx(t, "mOde_m1w", "y′ = ky ⇒ y = kt + C"), "y = y₀eᵏᵗ", tx(t, "mOde_m1", "the rate depends on y, not only on t; you cannot just integrate the right side")],
          [tx(t, "mOde_m2w", "ln|y| = kt + C ⇒ y = eᵏᵗ + C"), "y = eᶜ eᵏᵗ = y₀eᵏᵗ", tx(t, "mOde_m2", "e raised to a sum is a product")],
          [tx(t, "mOde_m3w", "one initial condition for y″ = …"), tx(t, "mOde_m3r", "two: position and velocity"), tx(t, "mOde_m3", "a second-order general solution has two constants")],
          [tx(t, "mOde_m4w", "dividing by h(y) and losing y = y*"), tx(t, "mOde_m4r", "check the equilibria separately"), tx(t, "mOde_m4", "h(y*) = 0 cannot be divided by, yet y = y* is a solution")],
          [tx(t, "mOde_m5w", "a smaller h is only about accuracy"), tx(t, "mOde_m5r", "also stability: h < 2/k for decay"), tx(t, "mOde_m5", "too large a step can make Euler explode")],
          [tx(t, "mOde_m6w", "complex roots mean no real solution"), "e^(−γt)(A cos ω_d t + B sin ω_d t)", tx(t, "mOde_m6", "Euler's formula turns them into real oscillations")],
        ]}
      />

      <KeyIdeas t={t} id="mOde" items={[
        "A differential equation relates an unknown function to its derivatives; initial conditions pick one solution.",
        "A slope field draws y′ = F(t, y) as segments; solutions follow them; F = 0 gives equilibria.",
        "y′ = ky ⇒ y = y₀eᵏᵗ; half-life and doubling time are ln 2/|k|.",
        "Separable equations: ∫ dy/h(y) = ∫ g(t) dt; cooling and the logistic curve are solved this way.",
        "Euler's method steps along the slope: yₙ₊₁ = yₙ + hF; its error is proportional to h.",
        "An equilibrium is stable when F′(y*) < 0; Euler on y′ = −ky is stable only for h < 2/k.",
        "y″ + 2γy′ + ω²y = 0: the characteristic roots decide overdamped, critical or oscillating decay; they are eigenvalues.",
      ]} />
    </Article>
  );
}
