"use client";

// Calculus 13: line integrals — curves given by a parameter, velocity and arc
// length; integrating a function along a curve (mass of a wire); work as
// ∫ F · dr from a Riemann sum of F · Δr; computing it with a parameter;
// orientation; the same end points with different results; the fundamental
// theorem for line integrals (gradient fields: f(B) − f(A), path
// independence, zero round loops); the curl test and finding a potential;
// the hole counterexample (−y, x)/(x² + y²); conservative forces and energy.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { LineIntegralFigure } from "@/components/lesson/figures/math/LineIntegralFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;
const n = (v: number) => String(+v.toFixed(3)).replace("-", "−");

// ── Live formula: work of (−y, x) round a circle ──────────────────────────────

function circleNumbers(v: Record<string, number>) {
  const R = v.R, W = 2 * Math.PI * R * R;
  return { tex: r`\int_0^{2\pi} R^2\,dt = 2\pi \cdot ${n(R)}^2 = \green{${n(W)}} \qquad \operatorname{curl}\mathbf F \cdot \pi R^2 = 2 \cdot \pi \cdot ${n(R)}^2 = ${n(W)}` };
}

export function LineIntegralsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mLi_intro",
          "Pushing a cart along a straight road with a constant force, the work done is force times distance, or more exactly the dot product F · d. But a real path curves, and a real force changes from place to place: a boat crossing a river with currents, a planet moving through a gravitational field. The line integral handles that: cut the path into tiny straight steps, take F · dr on each, and add them up. This chapter computes such integrals, and finds the fields for which the answer depends only on where the path starts and ends.")}
      </Lead>

      <Goals t={t} id="mLi" items={[
        "Describe a curve with a parameter, and compute its length.",
        "Set up and compute the work ∫ F · dr along a curve.",
        "Use the fundamental theorem for line integrals: for F = ∇f the work is f(B) − f(A).",
        "Test whether a field is conservative and find its potential, knowing when the test can fail.",
      ]} />

      <H2>{tx(t, "mLi_curveTitle", "Curves with a parameter")}</H2>
      <p>
        {tx(t, "mLi_curveBody",
          "To compute along a curve you need a formula that walks along it. A parametrization gives the position r(t) = (x(t), y(t)) as a time t runs over an interval a ≤ t ≤ b. The straight segment from A to B is r(t) = A + t(B − A) for 0 ≤ t ≤ 1. The circle of radius R around the origin is r(t) = (R cos t, R sin t) for 0 ≤ t ≤ 2π, travelled counterclockwise. The derivative r′(t) = (x′(t), y′(t)) is the velocity: it points along the curve, and its length is the speed.")}
      </p>
      <Equation label={tx(t, "mLi_eqLen", "Length of a curve")}
        where={[
          [r`\mathbf r(t)`, tx(t, "mLi_wR", "the point of the curve at parameter t")],
          [r`|\mathbf r'(t)|`, tx(t, "mLi_wSpeed", "the speed √(x′² + y′²): distance covered per unit of t")],
          [r`ds = |\mathbf r'(t)|\,dt`, tx(t, "mLi_wDs", "the length of a tiny piece of the curve, by Pythagoras on (dx, dy)")],
        ]}
        words={tx(t, "mLi_lenWords", "Add speed times time over the whole walk to get the distance walked.")}>
        {r`L = \int_a^b |\mathbf r'(t)|\,dt = \int_a^b \sqrt{x'(t)^2 + y'(t)^2}\,dt`}
      </Equation>
      <p>
        {tx(t, "mLi_lenEx",
          "For the circle, r′(t) = (−R sin t, R cos t), whose length is R, so L = ∫₀^{2π} R dt = 2πR, the formula from the circles chapter, now proved. The same tool integrates any function along a curve: if a wire has density ρ(x, y) per unit length, its mass is ∫ ρ ds.")}
      </p>

      <H2>{tx(t, "mLi_workTitle", "Work: adding F · dr")}</H2>
      <p>
        {tx(t, "mLi_workBody",
          "Cut the path into small steps Δr. Along one step the force hardly changes, so the work on it is about F · Δr: the length of the step times the part of F along it. Push along the motion and it counts fully; push sideways and it counts nothing; push against the motion and it counts negative. Adding all the steps and letting them shrink gives the line integral.")}
      </p>
      <Derivation t={t} label={tx(t, "mLi_eqWorkDer", "From small steps to an ordinary integral")}
        steps={[
          { full: true, tex: r`W \approx \sum_k \mathbf F(\mathbf r_k)\cdot\Delta\mathbf r_k`, why: tx(t, "mLi_w1", "the work on each small step, added up: a Riemann sum") },
          { full: true, tex: r`\Delta\mathbf r_k \approx \mathbf r'(t_k)\,\Delta t`, why: tx(t, "mLi_w2", "a step taken in time Δt has displacement velocity × Δt") },
          { full: true, tex: r`W \approx \sum_k \mathbf F(\mathbf r(t_k))\cdot\mathbf r'(t_k)\,\Delta t`, why: tx(t, "mLi_w3", "now it is a Riemann sum in t") },
          { full: true, tex: r`\green{W = \int_C \mathbf F\cdot d\mathbf r = \int_a^b \mathbf F(\mathbf r(t))\cdot\mathbf r'(t)\,dt}`, why: tx(t, "mLi_w4", "as Δt → 0 the sum becomes an ordinary integral in t") },
        ]} />
      <Equation label={tx(t, "mLi_eqWork", "The line integral of a field")}
        where={[
          [r`C`, tx(t, "mLi_wC", "the curve, with a direction of travel")],
          [r`\mathbf F(\mathbf r(t))`, tx(t, "mLi_wF", "the field at the point reached at time t")],
          [r`\mathbf r'(t)\,dt`, tx(t, "mLi_wDr", "the small step dr")],
          [r`P\,dx + Q\,dy`, tx(t, "mLi_wPdx", "the same thing written in components: F · dr = P dx + Q dy")],
        ]}
        words={tx(t, "mLi_workWords", "At every moment, multiply the push along the direction you are moving by how far you move, and add it all up.")}>
        {r`\int_C \mathbf F\cdot d\mathbf r = \int_C P\,dx + Q\,dy = \int_a^b \big(P\,x'(t) + Q\,y'(t)\big)\,dt`}
      </Equation>
      <Derivation t={t} label={tx(t, "mLi_eqEx1", "F = (−y, x) once round the unit circle")}
        steps={[
          { tex: r`\mathbf r(t) = (\cos t, \sin t),\quad \mathbf r'(t) = (-\sin t, \cos t)`, why: tx(t, "mLi_e1", "counterclockwise, 0 ≤ t ≤ 2π") },
          { tex: r`\mathbf F(\mathbf r(t)) = (-\sin t, \cos t)`, why: tx(t, "mLi_e2", "put x = cos t and y = sin t into (−y, x)") },
          { tex: r`\mathbf F\cdot\mathbf r' = \sin^2 t + \cos^2 t = 1`, why: tx(t, "mLi_e3", "the field points exactly along the circle, with length 1") },
          { tex: r`\green{W = \int_0^{2\pi} 1\,dt = 2\pi}`, why: tx(t, "mLi_e4", "positive: the field pushes with the motion all the way round") },
        ]} />
      <p>
        {tx(t, "mLi_orientBody",
          "Direction matters. Going round the circle clockwise reverses every step dr, so the integral changes sign: −2π. A line integral of a field is taken along an oriented curve; the arrows in the figure show which way.")}
      </p>
      <LiveFormula label={tx(t, "mLi_liveCircle", "Try it: (−y, x) round a circle of radius R")}
        tex={r`\oint_{|\mathbf r| = R} (-y, x)\cdot d\mathbf r = 2\pi R^2`}
        vars={[{ id: "R", label: "R", min: 0.25, max: 3, step: 0.25, value: 1, fmt: n }]}
        compute={circleNumbers}
        note={tx(t, "mLi_liveCircleNote", "On a circle of radius R the field has length R and the path has length 2πR: the work grows like R², like the area enclosed. The curl of (−y, x) is 2, and 2 times the area πR² gives the same number: a first glimpse of Green's theorem.")} />

      <LineIntegralFigure t={t} />

      <H2>{tx(t, "mLi_depTitle", "Same ends, different answers")}</H2>
      <p>
        {tx(t, "mLi_depBody",
          "Go from (1, 0) to (−1, 0) in the field F = (−y, x). Along the upper half of the unit circle, F points along the path all the way, and the work is π. Along the straight segment on the x-axis, y = 0 so F = (0, x), which is vertical, while the motion is horizontal: the work is 0. Same start, same end, different work. For such a field there is no \"energy of a position\": how much work it takes to get somewhere depends on the route.")}
      </p>

      <H2>{tx(t, "mLi_ftcTitle", "Gradient fields: only the ends matter")}</H2>
      <p>
        {tx(t, "mLi_ftcBody",
          "For a gradient field the route never matters. If F = ∇f, then along any path the integrand F(r(t)) · r′(t) is exactly the derivative of f(r(t)) with respect to t, by the chain rule from the partial derivatives chapter. Integrating a derivative gives the change of the function, as in the fundamental theorem of calculus.")}
      </p>
      <Derivation t={t} label={tx(t, "mLi_eqFtcDer", "The fundamental theorem for line integrals")}
        steps={[
          { full: true, tex: r`\frac{d}{dt} f(\mathbf r(t)) = \frac{\partial f}{\partial x}x' + \frac{\partial f}{\partial y}y' = \nabla f(\mathbf r(t))\cdot\mathbf r'(t)`, why: tx(t, "mLi_f1", "the chain rule along a path") },
          { full: true, tex: r`\int_C \nabla f\cdot d\mathbf r = \int_a^b \frac{d}{dt} f(\mathbf r(t))\,dt`, why: tx(t, "mLi_f2", "so the line integral is the integral of a derivative") },
          { full: true, tex: r`\green{= f(\mathbf r(b)) - f(\mathbf r(a)) = f(B) - f(A)}`, why: tx(t, "mLi_f3", "the fundamental theorem of calculus: only the values at the two ends remain") },
        ]} />
      <Equation label={tx(t, "mLi_eqFtc", "Work in a gradient field")}
        where={[
          [r`f`, tx(t, "mLi_wPot", "a potential of the field: a function with ∇f = F")],
          [r`A, B`, tx(t, "mLi_wAB", "the start and end of the path")],
        ]}
        words={tx(t, "mLi_ftcWords", "In a gradient field the work is the change of the potential from start to finish, whichever way you go.")}>
        {r`\mathbf F = \nabla f \;\Longrightarrow\; \int_C \mathbf F\cdot d\mathbf r = f(B) - f(A)`}
      </Equation>
      <p>
        {tx(t, "mLi_consBody",
          "Three consequences, all equivalent for a field defined on a connected region: the work depends only on the end points (path independence); the work round every closed loop is 0 (going there and back cancels); the field is the gradient of some f. Such fields are called conservative because energy is conserved in them: the work done by gravity or by a spring is the drop in potential energy, given back exactly when you return. Friction is not conservative; walking a loop against it always costs work.")}
      </p>

      <H3>{tx(t, "mLi_testTitle", "Testing a field and finding its potential")}</H3>
      <p>
        {tx(t, "mLi_testBody",
          "The previous chapter showed that gradients have zero curl: ∂Q/∂x = ∂P/∂y. That condition is the practical test. When it holds on a region without holes, the field is a gradient, and the potential is found by integrating one component and fixing the rest with the other.")}
      </p>
      <Derivation t={t} label={tx(t, "mLi_eqPot", "F = (2xy + 1, x² + 3y²): test, then find f")}
        steps={[
          { full: true, tex: r`\frac{\partial Q}{\partial x} = 2x = \frac{\partial P}{\partial y}`, why: tx(t, "mLi_p1", "the curl is 0 everywhere, and the plane has no holes: a potential exists") },
          { full: true, tex: r`f = \int (2xy + 1)\,dx = x^2y + x + g(y)`, why: tx(t, "mLi_p2", "integrate P in x; the \"constant\" may still depend on y") },
          { full: true, tex: r`\frac{\partial f}{\partial y} = x^2 + g'(y) = x^2 + 3y^2 \;\Rightarrow\; g(y) = y^3`, why: tx(t, "mLi_p3", "its y-derivative must be Q; that fixes g up to a constant") },
          { full: true, tex: r`\green{f(x, y) = x^2y + x + y^3}`, why: tx(t, "mLi_p4", "check: ∂f/∂x = 2xy + 1 and ∂f/∂y = x² + 3y²") },
        ]} />
      <p>
        {tx(t, "mLi_testUse",
          "Now any work in this field is a subtraction. From (0, 0) to (1, 2): f(1, 2) − f(0, 0) = 2 + 1 + 8 − 0 = 11, whatever the path, even a spiral.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mLi_holeWarn", "The test needs a region without holes. F = (−y, x)/(x² + y²) has ∂Q/∂x = ∂P/∂y everywhere except at the origin, where it is not defined. Yet round the unit circle F · r′ = 1 at every point, so the work is 2π, not 0. The field is the gradient of the polar angle θ locally, but θ jumps by 2π after a full turn, so no single potential works on a loop around the hole. Try it in the figure with the whirl.")}
      </Callout>

      <LessonTable
        headers={[tx(t, "mLi_tField", "Field"), tx(t, "mLi_tCurl", "curl"), tx(t, "mLi_tCons", "conservative?"), tx(t, "mLi_tPot", "potential")]}
        rows={[
          ["(x, y)", "0", tx(t, "mLi_yes", "yes"), "(x² + y²)/2"],
          ["(y, x)", "0", tx(t, "mLi_yes", "yes"), "xy"],
          ["(−y, x)", "2", tx(t, "mLi_no", "no"), "—"],
          ["(y, 0)", "−1", tx(t, "mLi_no", "no"), "—"],
          ["(−y, x)/(x² + y²)", "0", tx(t, "mLi_hole", "not round the origin"), tx(t, "mLi_holeP", "θ, only away from loops round 0")],
        ]}
      />

      <H2>{tx(t, "mLi_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mLi_ex1", "1. F = (y, x) along the parabola r(t) = (t, t²), 0 ≤ t ≤ 1: F · r′ = (t², t) · (1, 2t) = 3t², so W = 1. Quicker: F = ∇(xy), and f(1, 1) − f(0, 0) = 1.")}</p>
      <p>{tx(t, "mLi_ex2", "2. A constant force F along any path from A to B does work F · (B − A), because F = ∇(F · r).")}</p>
      <p>{tx(t, "mLi_ex3", "3. Length of one arch of the cycloid r(t) = (t − sin t, 1 − cos t), 0 ≤ t ≤ 2π: |r′|² = 2 − 2 cos t = 4 sin²(t/2), so L = ∫ 2 sin(t/2) dt = 8.")}</p>
      <p>{tx(t, "mLi_ex4", "4. Gravity near the ground, F = (0, −mg), is ∇(−mgy): the work from height h₁ to h₂ is mg(h₁ − h₂) along a ladder, a slide or a spiral staircase.")}</p>

      <MathPracticeFigure t={t} set="lineIntegrals" />

      <H2>{tx(t, "mLi_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mLi_tWrong", "Wrong"), tx(t, "mLi_tRight", "Right"), tx(t, "mLi_tWhy", "Why")]}
        rows={[
          [tx(t, "mLi_m1w", "work = |F| × length"), "∫ F · dr", tx(t, "mLi_m1", "only the part of F along the motion counts, with its sign")],
          [tx(t, "mLi_m2w", "forgetting r′(t)"), "F(r(t)) · r′(t) dt", tx(t, "mLi_m2", "dr is the step, not dt")],
          [tx(t, "mLi_m3w", "the direction does not matter"), tx(t, "mLi_m3r", "reversing flips the sign"), tx(t, "mLi_m3", "every dr points the other way")],
          [tx(t, "mLi_m4w", "curl 0 ⇒ every loop gives 0"), tx(t, "mLi_m4r", "only without holes"), tx(t, "mLi_m4", "(−y, x)/(x² + y²) gives 2π round the origin")],
          [tx(t, "mLi_m5w", "potential: f = ∫P dx + ∫Q dy"), tx(t, "mLi_m5r", "fix g(y) with Q"), tx(t, "mLi_m5", "adding both integrals counts shared terms twice")],
        ]}
      />

      <KeyIdeas t={t} id="mLi" items={[
        "A curve is walked by r(t); its velocity r′(t) points along it, and its length is ∫ |r′(t)| dt.",
        "Work along an oriented curve: ∫ F · dr = ∫ F(r(t)) · r′(t) dt; reversing the direction flips the sign.",
        "In general the work depends on the route, as for F = (−y, x).",
        "For F = ∇f: ∫ F · dr = f(B) − f(A), the route does not matter and every loop gives 0.",
        "Test: ∂Q/∂x = ∂P/∂y on a region without holes means conservative; find f by integrating P and fixing g(y) with Q.",
        "Holes break the test: (−y, x)/(x² + y²) has zero curl but gives 2π round the origin.",
      ]} />
    </Article>
  );
}
