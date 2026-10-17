"use client";

// Calculus 16: the calculus of variations — functionals (a number from a whole
// curve); varying a curve by εη with fixed ends; the Euler–Lagrange equation
// derived step by step (integration by parts, the fundamental lemma); the
// shortest path; the Beltrami identity; the brachistochrone and the cycloid;
// the soap film between two rings (the catenary); and the principle of least
// action, which turns L = T − V into Newton's law, ready for the Physics track.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { VariationFigure } from "@/components/lesson/figures/math/VariationFigure";
import { BrachistochroneFigure } from "@/components/lesson/figures/math/BrachistochroneFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

export function CalculusOfVariationsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mVar_intro",
          "Ordinary calculus finds the number x that makes f(x) smallest: set f′(x) = 0. The calculus of variations asks the same question one level up: which whole curve makes some quantity smallest? Which path between two points is shortest? Down which slide does a ball arrive soonest? Which shape does a soap film take? The answer is again \"set a derivative to zero\", and it produces a differential equation, the Euler–Lagrange equation, whose solution is the best curve. The same equation is the starting point of modern physics.")}
      </Lead>

      <Goals t={t} id="mVar" items={[
        "Explain what a functional is and how to compute one for a given curve.",
        "Derive the Euler–Lagrange equation by varying the curve with a bump that vanishes at the ends.",
        "Solve classic problems: the shortest path, the brachistochrone (with the Beltrami identity) and the soap film.",
        "Use the principle of least action to recover Newton's second law from L = T − V.",
      ]} />

      <H2>{tx(t, "mVar_funTitle", "Functionals: a number from a whole curve")}</H2>
      <p>
        {tx(t, "mVar_funBody",
          "A function takes a number and gives a number. A functional takes a whole function y(x) and gives a number. Almost every one we meet is an integral of an expression built from x, the height y and the slope y′. That expression is called the Lagrangian and written L(x, y, y′).")}
      </p>
      <Equation label={tx(t, "mVar_eqFun", "A functional")}
        where={[
          [r`y`, tx(t, "mVar_wY", "the curve, any smooth function with the given end values y(a) = A and y(b) = B")],
          [r`L(x, y, y')`, tx(t, "mVar_wL", "the Lagrangian: what each small piece of the curve costs, depending on where it is, how high and how steep")],
          [r`J[y]`, tx(t, "mVar_wJ", "the total cost; square brackets say that J depends on the whole function y, not on one number")],
        ]}
        words={tx(t, "mVar_funWords", "Walk along the curve, add up the cost of every small piece, and you get one number for the whole curve.")}>
        {r`J[y] = \int_a^b L\big(x,\,y(x),\,y'(x)\big)\,dx`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mVar_tQ", "Question"), "L(x, y, y′)", tx(t, "mVar_tAns", "Best curve")]}
        rows={[
          [tx(t, "mVar_q1", "shortest path between two points"), "√(1 + y′²)", tx(t, "mVar_a1", "straight line")],
          [tx(t, "mVar_q2", "fastest slide from rest (brachistochrone)"), "√(1 + y′²) / √(2gy)", tx(t, "mVar_a2", "cycloid")],
          [tx(t, "mVar_q3", "soap film between two rings (least area)"), "2π y √(1 + y′²)", tx(t, "mVar_a3", "catenary, y = c cosh(x/c)")],
          [tx(t, "mVar_q4", "motion of a particle (least action)"), "½ m ẋ² − V(x)", tx(t, "mVar_a4", "Newton's law, m ẍ = −V′(x)")],
        ]}
      />
      <p>
        {tx(t, "mVar_funEx",
          "Example: the length of y = x² from x = 0 to 1 is ∫₀¹ √(1 + 4x²) dx ≈ 1.479, longer than the straight segment to (1, 1), of length √2 ≈ 1.414. Each piece of the curve has length ds = √(dx² + dy²) = √(1 + y′²) dx by Pythagoras, which is where the first Lagrangian comes from.")}
      </p>

      <H2>{tx(t, "mVar_varyTitle", "Varying the curve")}</H2>
      <p>
        {tx(t, "mVar_varyBody",
          "Suppose y is the best curve. Pick any other function η(x), a bump, that is zero at both ends, η(a) = η(b) = 0, and form the nearby curve y + εη, where ε is a small number. It still runs from A to B. Now J(y + εη) depends only on the number ε: it is an ordinary function, and since y is the best curve it is smallest at ε = 0. So its derivative there is 0, for every bump η. That single condition is enough to find y.")}
      </p>

      <VariationFigure t={t} />

      <H2>{tx(t, "mVar_elTitle", "The Euler–Lagrange equation")}</H2>
      <p>
        {tx(t, "mVar_elBody",
          "Differentiate J(y + εη) with respect to ε. The variable ε enters L through y (as y + εη) and through y′ (as y′ + εη′), so the chain rule of the partial derivatives chapter gives two terms. One of them contains η′ instead of η; integrating it by parts moves the derivative onto the other factor, and the end terms vanish because η is zero at both ends.")}
      </p>
      <Derivation t={t} label={tx(t, "mVar_eqElDer", "From dJ/dε = 0 to a differential equation")}
        steps={[
          { full: true, tex: r`\frac{d}{d\varepsilon} J[y + \varepsilon\eta]\Big|_{\varepsilon = 0} = \int_a^b \Big(\frac{\partial L}{\partial y}\,\eta + \frac{\partial L}{\partial y'}\,\eta'\Big)\,dx`, why: tx(t, "mVar_e1", "the chain rule: y changes at rate η and y′ at rate η′ as ε changes") },
          { full: true, tex: r`\int_a^b \frac{\partial L}{\partial y'}\,\eta'\,dx = \Big[\frac{\partial L}{\partial y'}\,\eta\Big]_a^b - \int_a^b \frac{d}{dx}\Big(\frac{\partial L}{\partial y'}\Big)\,\eta\,dx`, why: tx(t, "mVar_e2", "integration by parts, ∫ u v′ = [u v] − ∫ u′ v, with u = ∂L/∂y′ and v = η") },
          { full: true, tex: r`\Big[\frac{\partial L}{\partial y'}\,\eta\Big]_a^b = 0`, why: tx(t, "mVar_e3", "η(a) = η(b) = 0: the ends do not move") },
          { full: true, tex: r`\int_a^b \Big(\frac{\partial L}{\partial y} - \frac{d}{dx}\frac{\partial L}{\partial y'}\Big)\,\eta(x)\,dx = 0 \quad\text{for every } \eta`, why: tx(t, "mVar_e4", "put the two terms together") },
          { full: true, tex: r`\frac{\partial L}{\partial y} - \frac{d}{dx}\frac{\partial L}{\partial y'} = 0`, why: tx(t, "mVar_e5", "if the bracket were positive somewhere, a bump η sitting only there would make the integral positive; so the bracket is 0 everywhere (the fundamental lemma of the calculus of variations)") },
        ]} />
      <Equation label={tx(t, "mVar_eqEl", "The Euler–Lagrange equation")}
        where={[
          [r`\frac{\partial L}{\partial y}`, tx(t, "mVar_wLy", "how the cost of a piece changes if it is raised, with its slope held fixed")],
          [r`\frac{\partial L}{\partial y'}`, tx(t, "mVar_wLyp", "how the cost changes if the piece is tilted, with its height held fixed")],
          [r`\frac{d}{dx}`, tx(t, "mVar_wDx", "the ordinary derivative along the curve: x, y(x) and y′(x) all change together")],
        ]}
        note={tx(t, "mVar_elNote", "A curve that satisfies it is called stationary (or an extremal): nearby curves do not change J to first order. Like f′(x) = 0, it can be a minimum, a maximum or neither; in the problems below it is a minimum.")}
        words={tx(t, "mVar_elWords", "Along the best curve, the gain from raising a piece is exactly balanced by the rate at which the gain from tilting it changes.")}>
        {r`\frac{\partial L}{\partial y} = \frac{d}{dx}\left(\frac{\partial L}{\partial y'}\right)`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "mVar_partial", "Treat y and y′ as two separate variables when you take ∂L/∂y and ∂L/∂y′, as if L were a function of three independent letters x, y, p. Only afterwards replace them by y(x) and y′(x), and take d/dx along the curve.")}
      </Callout>

      <H3>{tx(t, "mVar_lineTitle", "First test: the shortest path")}</H3>
      <Derivation t={t} label={tx(t, "mVar_eqLine", "L = √(1 + y′²)")}
        steps={[
          { tex: r`\frac{\partial L}{\partial y} = 0, \qquad \frac{\partial L}{\partial y'} = \frac{y'}{\sqrt{1 + y'^2}}`, why: tx(t, "mVar_l1", "L does not contain y at all; differentiate √(1 + p²) with respect to p") },
          { tex: r`\frac{d}{dx}\left(\frac{y'}{\sqrt{1 + y'^2}}\right) = 0 \;\Rightarrow\; \frac{y'}{\sqrt{1 + y'^2}} = C`, why: tx(t, "mVar_l2", "Euler–Lagrange: something with zero derivative is a constant") },
          { tex: r`y' = \text{constant} \;\Rightarrow\; \green{y = mx + c}`, why: tx(t, "mVar_l3", "p/√(1 + p²) is increasing, so it equals C for only one slope p") },
        ]} />
      <p>
        {tx(t, "mVar_lineBody",
          "A straight line, of course. But notice what happened: nobody compared curves one by one. The equation found the answer from the Lagrangian alone. Whenever L does not contain y, ∂L/∂y′ is a constant along the best curve; physicists call such a constant a conserved quantity.")}
      </p>

      <H3>{tx(t, "mVar_beltTitle", "A shortcut when L has no x: the Beltrami identity")}</H3>
      <p>
        {tx(t, "mVar_beltBody",
          "Many Lagrangians depend on y and y′ but not on x itself. Then there is a first integral: an expression that stays constant along the best curve, which saves one integration.")}
      </p>
      <Equation label={tx(t, "mVar_eqBelt", "The Beltrami identity (L without x)")}
        where={[
          [r`C`, tx(t, "mVar_wC", "a constant, fixed by the end points")],
          [r`y'\,\frac{\partial L}{\partial y'}`, tx(t, "mVar_wYp", "the slope times the tilt sensitivity of L")],
        ]}
        note={tx(t, "mVar_beltNote", "Proof: differentiate L − y′ ∂L/∂y′ along the curve. The chain rule gives L_y y′ + L_{y′} y″ − y″ L_{y′} − y′ d/dx(L_{y′}) = y′ (L_y − d/dx L_{y′}), which is 0 by Euler–Lagrange.")}
        words={tx(t, "mVar_beltWords", "If the cost does not depend on where along x you are, one combination of L and its slope never changes along the best curve.")}>
        {r`L - y'\,\frac{\partial L}{\partial y'} = C`}
      </Equation>

      <H2>{tx(t, "mVar_brachTitle", "The brachistochrone")}</H2>
      <p>
        {tx(t, "mVar_brachBody",
          "In 1696 Johann Bernoulli challenged the mathematicians of Europe: a bead slides without friction from A to a lower point B. Which track gets it there in the least time? Brachistochrone is Greek for \"shortest time\". Measure y downwards from A. A bead that has fallen a height y has speed v = √(2gy), from conservation of energy (½mv² = mgy), and it covers the piece ds in time ds / v.")}
      </p>
      <Derivation t={t} label={tx(t, "mVar_eqBrach", "Solving the brachistochrone")}
        steps={[
          { full: true, tex: r`T[y] = \int \frac{ds}{v} = \int_0^{x_B} \frac{\sqrt{1 + y'^2}}{\sqrt{2g\,y}}\,dx`, why: tx(t, "mVar_br1", "time = length / speed, piece by piece; g ≈ 9.81 m/s² is the acceleration of gravity") },
          { full: true, tex: r`\frac{\sqrt{1 + y'^2}}{\sqrt y} - y'\cdot\frac{y'}{\sqrt y\,\sqrt{1 + y'^2}} = C`, why: tx(t, "mVar_br2", "Beltrami, since L has no x (the constant √(2g) has been dropped)") },
          { full: true, tex: r`\frac{1}{\sqrt y\,\sqrt{1 + y'^2}} = C \;\Rightarrow\; y\,(1 + y'^2) = k`, why: tx(t, "mVar_br3", "common denominator: (1 + y′²) − y′² = 1; then square and write k = 1/C²") },
          { full: true, tex: r`x = r(\theta - \sin\theta),\quad y = r(1 - \cos\theta)`, why: tx(t, "mVar_br4", "this curve solves it with k = 2r (check: y′ = sin θ / (1 − cos θ), and 1 + y′² = 2/(1 − cos θ)): a cycloid") },
        ]} />
      <p>
        {tx(t, "mVar_cycloid",
          "A cycloid is the path of a point on the rim of a wheel of radius r rolling along a line, here rolling along the underside of the ceiling through A. θ is the angle the wheel has turned. The radius r and the final angle are fixed by B. The time to reach the point at angle θ turns out to be θ √(r/g).")}
      </p>

      <BrachistochroneFigure t={t} />

      <H3>{tx(t, "mVar_soapTitle", "The soap film: a catenary")}</H3>
      <p>
        {tx(t, "mVar_soapBody",
          "Dip two parallel rings in soapy water and pull them apart: the film between them takes the shape of least area, because surface tension pulls it as tight as possible. Rotate the curve y(x) about the x-axis; a band of width ds sweeps an area 2πy ds. So L = y √(1 + y′²), up to the constant 2π, with no x in it. Beltrami gives y / √(1 + y′²) = c, so y′ = √(y² − c²)/c, and separating variables gives y = c cosh((x − d)/c). This curve is the catenary, also the shape of a hanging chain; cosh u = (eᵘ + e⁻ᵘ)/2 is the hyperbolic cosine.")}
      </p>

      <H2>{tx(t, "mVar_actionTitle", "The principle of least action")}</H2>
      <p>
        {tx(t, "mVar_actionBody",
          "Now let the curve be the motion of a particle: its position x(t) at each time t. Take as Lagrangian the kinetic energy minus the potential energy, L = T − V = ½ m ẋ² − V(x), where ẋ = dx/dt is the velocity (a dot means a derivative with respect to time) and m is the mass. The integral of L over time is called the action. The principle of least action says that the actual motion between two given positions at two given times is the one that makes the action stationary.")}
      </p>
      <Derivation t={t} label={tx(t, "mVar_eqNewton", "Euler–Lagrange for L = ½ m ẋ² − V(x)")}
        steps={[
          { tex: r`\frac{\partial L}{\partial x} = -V'(x), \qquad \frac{\partial L}{\partial \dot x} = m\dot x`, why: tx(t, "mVar_n1", "the same rules as before, with t in the role of x and x in the role of y") },
          { tex: r`-V'(x) = \frac{d}{dt}\big(m\dot x\big) = m\ddot x`, why: tx(t, "mVar_n2", "the Euler–Lagrange equation") },
          { tex: r`\green{m\ddot x = F}, \quad F = -V'(x)`, why: tx(t, "mVar_n3", "Newton's second law: the force is minus the slope of the potential energy") },
        ]} />
      <p>
        {tx(t, "mVar_actionUse",
          "For a spring, V = ½ k x², so m ẍ = −k x, the oscillator of the differential equations chapter. Why bother, when Newton's law was already known? Because the action works in any coordinates (angles, distances along a curve, many particles at once): write T and V, and Euler–Lagrange gives the equations of motion, one per coordinate. The Physics track builds its advanced mechanics on exactly this, and the same idea, with other Lagrangians, gives light, relativity and quantum fields.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mVar_fermat", "Light follows the same kind of rule. Fermat's principle: light goes between two points along the path of least time. With speed v₁ in air and v₂ in water, minimising the time gives Snell's law of refraction, sin θ₁ / v₁ = sin θ₂ / v₂.")}
      </Callout>

      <H2>{tx(t, "mVar_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mVar_ex1", "1. J[y] = ∫₀¹ y′² dx for y = x² is ∫₀¹ 4x² dx = 4/3. For the straight line y = x with the same ends it is 1, smaller, as Euler–Lagrange predicts: L = y′² gives y″ = 0.")}</p>
      <p>{tx(t, "mVar_ex2", "2. L = y′² + 2y: ∂L/∂y = 2 and ∂L/∂y′ = 2y′, so 2 = 2y″, y″ = 1, and y = x²/2 + cx + d.")}</p>
      <p>{tx(t, "mVar_ex3", "3. L = y′² − y²: −2y = 2y″, so y″ = −y and y = A cos x + B sin x, waves again.")}</p>
      <p>{tx(t, "mVar_ex4", "4. A falling ball: L = ½ m ż² − m g z (z = height). ∂L/∂z = −mg, d/dt(m ż) = m z̈, so z̈ = −g: constant acceleration downwards.")}</p>

      <MathPracticeFigure t={t} set="variations" />

      <H2>{tx(t, "mVar_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mVar_tWrong", "Wrong"), tx(t, "mVar_tRight", "Right"), tx(t, "mVar_tWhy", "Why")]}
        rows={[
          [tx(t, "mVar_m1w", "∂L/∂y′ with y′ depending on y"), tx(t, "mVar_m1r", "y and y′ independent letters"), tx(t, "mVar_m1", "the link between them only enters through d/dx")],
          [tx(t, "mVar_m2w", "∂/∂x instead of d/dx in the second term"), "d/dx", tx(t, "mVar_m2", "the derivative is taken along the curve, using the chain rule")],
          [tx(t, "mVar_m3w", "bumps that move the end points"), "η(a) = η(b) = 0", tx(t, "mVar_m3", "otherwise the boundary term from integrating by parts remains")],
          [tx(t, "mVar_m4w", "stationary means minimum"), tx(t, "mVar_m4r", "it can be a min, max or saddle"), tx(t, "mVar_m4", "as with f′(x) = 0, only the first-order change vanishes")],
          [tx(t, "mVar_m5w", "fastest = shortest"), tx(t, "mVar_m5r", "cycloid, not line"), tx(t, "mVar_m5", "the time depends on the speed, which depends on the height")],
        ]}
      />

      <KeyIdeas t={t} id="mVar" items={[
        "A functional J[y] = ∫ L(x, y, y′) dx gives one number for a whole curve.",
        "Vary the best curve by εη with η = 0 at the ends: dJ/dε must be 0 at ε = 0 for every η.",
        "Integration by parts turns that into the Euler–Lagrange equation ∂L/∂y = d/dx (∂L/∂y′).",
        "If L has no y, ∂L/∂y′ is constant; if L has no x, L − y′ ∂L/∂y′ is constant (Beltrami).",
        "Length gives straight lines, slide time the cycloid, least area the catenary.",
        "With L = T − V, Euler–Lagrange is Newton's law m ẍ = −V′(x): the principle of least action.",
      ]} />
    </Article>
  );
}
