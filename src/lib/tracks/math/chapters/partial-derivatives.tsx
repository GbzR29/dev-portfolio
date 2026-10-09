"use client";

// Calculus 9: partial derivatives and the gradient — functions of two
// variables as surfaces and contour maps; partial derivatives as slopes of
// slices, computed by freezing the other variable; mixed partials; the
// gradient, directional derivatives (∇f · u), steepest ascent and why ∇f is
// perpendicular to contours; the tangent plane and error propagation; the
// multivariable chain rule and implicit slopes; critical points and the
// second-derivative test; Lagrange multipliers.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { GradientFigure } from "@/components/lesson/figures/math/GradientFigure";

const r = String.raw;
const num = (v: number, d = 2) => String(+v.toFixed(d)).replace("-", "−");
const par = (v: number, d = 2) => (v < 0 ? `(${num(v, d)})` : num(v, d));

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** The slope of f = x² + xy + y² at (1, 2), where ∇f = (4, 5), along the direction at angle θ. */
function directionNumbers(v: Record<string, number>) {
  const th = (v.a * Math.PI) / 180, ux = Math.cos(th), uy = Math.sin(th);
  const g = Math.hypot(4, 5), d = 4 * ux + 5 * uy, cos = d / g;
  return {
    tex: r`\nabla f \cdot \mathbf u = 4 \cdot ${par(ux)} + 5 \cdot ${par(uy)} = \green{${num(d)}} \qquad |\nabla f|\cos\theta = ${num(g)} \cdot ${par(cos)}`,
    meter: (cos + 1) / 2,
    meterLabel: `cos θ = ${num(cos)}`,
  };
}

/** The tank's worst-case volume error from the errors in r and h. */
function tankNumbers(v: Record<string, number>) {
  const r0 = 5, h0 = 10, { dr, dh } = v;
  const a = 2 * Math.PI * r0 * h0 * dr, b = Math.PI * r0 * r0 * dh, V = Math.PI * r0 * r0 * h0;
  return {
    tex: r`\begin{aligned} dV &= 2\pi \cdot 5 \cdot 10 \cdot ${num(dr)} + \pi \cdot 25 \cdot ${num(dh)} = ${num(a, 1)} + ${num(b, 1)} = \green{${num(a + b, 1)}}\,\text{m}^3 \\ \frac{dV}{V} &= \frac{${num(a + b, 1)}}{${num(V, 1)}} = \amber{${num((100 * (a + b)) / V, 1)}\,\%} \end{aligned}`,
  };
}

export function PartialDerivativesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPar_intro",
          "Most quantities depend on more than one thing. The area of a rectangle depends on its width and its height; the volume of a cylinder on its radius and its height; the height of the ground on both map coordinates; the temperature in a room on where you stand. Calculus with several inputs starts from one simple idea: change one input at a time, hold the others still, and use the one-variable derivative you already know. Put those slopes together into a vector and it points uphill.")}
      </Lead>

      <Goals t={t} id="mPar" items={[
        "Take partial derivatives of a function of two variables.",
        "Find the gradient and the slope in any direction.",
        "Estimate how errors in the inputs spread to the output.",
        "Find peaks, valleys and saddles, with or without a constraint.",
      ]} />

      <H2>{tx(t, "mPar_fnTitle", "Functions of two variables")}</H2>
      <p>
        {tx(t, "mPar_fnBody",
          "A function f(x, y) takes a point of the plane and returns a number. Its graph is the surface z = f(x, y): above each point (x, y) of the floor, a point at height f(x, y). A surface is hard to draw on paper, so maps use contour lines (level curves) instead: the curve where f(x, y) = c, for a few evenly spaced values c. A hiking map is exactly this, with f the height of the ground. For the bowl f = x² + y² the level curves are circles x² + y² = c around the origin; for the saddle f = x² − y² they are hyperbolas, and the surface rises along x but falls along y, like a horse's saddle or a mountain pass.")}
      </p>

      <H2>{tx(t, "mPar_partTitle", "Partial derivatives: one input at a time")}</H2>
      <p>
        {tx(t, "mPar_partBody",
          "Freeze y at some value b. Then f(x, b) is an ordinary function of x alone: geometrically, the curve where the surface is cut by the vertical plane y = b. Its slope at x = a is the partial derivative of f with respect to x, written ∂f/∂x or fₓ. The curly ∂ (read \"partial\") warns that other variables exist and are being held fixed. The partial derivative with respect to y is the same with the roles swapped: freeze x, move y.")}
      </p>
      <Equation label={tx(t, "mPar_eqPart", "Partial derivatives")}
        where={[
          [r`\frac{\partial f}{\partial x} = f_x`, tx(t, "mPar_wFx", "the slope when only x moves (y held fixed): the east–west slope on a map")],
          [r`\frac{\partial f}{\partial y} = f_y`, tx(t, "mPar_wFy", "the slope when only y moves (x held fixed): the north–south slope")],
          [r`h`, tx(t, "mPar_wH", "the small step, in one input only")],
        ]}
        words={tx(t, "mPar_partWords", "Nudge one input, keep the other frozen, and take the ordinary slope.")}>
        {r`f_x(a,b) = \lim_{h\to 0}\frac{f(a+h,\,b) - f(a,\,b)}{h} \qquad f_y(a,b) = \lim_{h\to 0}\frac{f(a,\,b+h) - f(a,\,b)}{h}`}
      </Equation>
      <H3>{tx(t, "mPar_howTitle", "Computing them: treat the other letter as a number")}</H3>
      <p>
        {tx(t, "mPar_howBody2",
          "No new rules are needed. To find fₓ, pretend y is a constant, like 3 or 7, and differentiate in x with the usual rules. Take f = x²y + 3y³ + sin(xy), term by term.")}
      </p>
      <Derivation t={t} label={tx(t, "mPar_eqHow", "Both partial derivatives of x²y + 3y³ + sin(xy)")}
        steps={[
          { tex: r`\frac{\partial}{\partial x}\big(x^2 y\big) = 2xy`, full: true, why: tx(t, "mPar_h1", "y is a constant factor in front of x²") },
          { tex: r`\frac{\partial}{\partial x}\big(3y^3\big) = 0`, full: true, why: tx(t, "mPar_h2", "no x at all: a pure constant") },
          { tex: r`\frac{\partial}{\partial x}\sin(xy) = \cos(xy) \cdot y`, full: true, why: tx(t, "mPar_h3", "chain rule: the x-derivative of the inside xy is y") },
          { tex: r`f_x = \green{2xy + y\cos(xy)}`, full: true, why: tx(t, "mPar_h4", "add the three pieces") },
          { tex: r`f_y = \green{x^2 + 9y^2 + x\cos(xy)}`, full: true, why: tx(t, "mPar_h5", "the same with the roles swapped: x² is the constant now, 3y³ gives 9y², and the inside xy has y-derivative x") },
        ]} />
      <p>
        {tx(t, "mPar_cylBody",
          "For the cylinder V = πr²h: ∂V/∂r = 2πrh and ∂V/∂h = πr². Each has a meaning. Growing the height by a thin layer dh adds a disc of area πr², so ∂V/∂h is the area of the lid. Growing the radius by dr adds a thin shell of area 2πrh, the side wall, so ∂V/∂r is the area of the wall.")}
      </p>
      <H3>{tx(t, "mPar_secondTitle", "Second partial derivatives")}</H3>
      <p>
        {tx(t, "mPar_secondBody",
          "Each partial derivative is again a function of x and y, so it can be differentiated again, in either variable: fₓₓ, f_yy, and the mixed ones fₓᵧ (first x, then y) and fᵧₓ. For f = x³y² + x: fₓ = 3x²y² + 1, f_y = 2x³y; fₓₓ = 6xy², f_yy = 2x³; fₓᵧ = 6x²y and fᵧₓ = 6x²y. The two mixed derivatives agree. That is not luck: for every function whose second partial derivatives are continuous, the order does not matter (Schwarz's, or Clairaut's, theorem). It halves the work and gives a free check.")}
      </p>

      <H2>{tx(t, "mPar_gradTitle", "The gradient and the slope in any direction")}</H2>
      <p>
        {tx(t, "mPar_dirBody2",
          "fₓ and f_y are the slopes due east and due north. What is the slope if you walk in some other direction, given by a unit vector u = (u₁, u₂)? Take a small step of length s along u.")}
      </p>
      <Derivation t={t} label={tx(t, "mPar_eqDir", "The slope in any direction")}
        steps={[
          { tex: r`\Delta x = s\,u_1, \qquad \Delta y = s\,u_2`, full: true, why: tx(t, "mPar_d1", "a step of length s along u moves both inputs") },
          { tex: r`\Delta f \approx f_x\,s\,u_1 + f_y\,s\,u_2`, full: true, why: tx(t, "mPar_d2", "local linearity: each change contributes its own slope times its own step") },
          { tex: r`\frac{\Delta f}{s} \approx f_x u_1 + f_y u_2`, full: true, why: tx(t, "mPar_d3", "divide by the distance walked") },
          { tex: r`D_{\mathbf u} f = \green{(f_x, f_y)\cdot(u_1, u_2)}`, full: true, why: tx(t, "mPar_d4", "it is a dot product, of u with the vector of partial derivatives") },
        ]} />
      <p>
        {tx(t, "mPar_dirBody3",
          "That vector (fₓ, f_y) is called the gradient of f and written ∇f (read \"grad f\" or \"nabla f\").")}
      </p>
      <Equation label={tx(t, "mPar_eqGrad", "Gradient and directional derivative")}
        where={[
          [r`\nabla f`, tx(t, "mPar_wGrad", "the gradient: the vector of partial derivatives, one for each input")],
          [r`\mathbf{u}`, tx(t, "mPar_wU", "a unit vector (length 1) giving the direction of travel")],
          [r`D_{\mathbf u}f`, tx(t, "mPar_wDu", "the directional derivative: the slope felt walking along u")],
          [r`\theta`, tx(t, "mPar_wTheta", "the angle between u and ∇f, from the dot product's cosine formula")],
        ]}
        words={tx(t, "mPar_gradWords", "The gradient lists the slopes along each axis; the slope in any direction is the gradient's length times the cosine of the angle between them.")}>
        {r`\nabla f = \Big(\frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y}\Big) \qquad D_{\mathbf u} f = \nabla f\cdot\mathbf u = |\nabla f|\cos\theta`}
      </Equation>
      <LiveFormula label={tx(t, "mPar_liveDir", "Try it: walking round the point (1, 2) of x² + xy + y²")}
        tex={r`\nabla f(1, 2) = (4, 5) \qquad \mathbf u = (\cos\alpha, \sin\alpha) \qquad D_{\mathbf u} f = \nabla f \cdot \mathbf u`}
        vars={[{ id: "a", label: tx(t, "mPar_liveAng", "direction α (degrees)"), min: -180, max: 180, step: 1, value: 53, fmt: v => `${v}°` }]}
        compute={directionNumbers}
        note={tx(t, "mPar_liveDirNote", "Starts on worked example 2, u = (0.6, 0.8): slope 6.4. The largest slope, √41 ≈ 6.40, is at α ≈ 51°, along ∇f. At α ≈ −39° or 141° you walk along the contour and the slope is 0; at α ≈ −129° you go straight downhill.")} />
      <p>
        {tx(t, "mPar_steepBody",
          "The last form says everything. cos θ is largest, 1, when u points the same way as ∇f: the gradient is the direction of steepest ascent, and the slope that way is |∇f|. It is −1 straight opposite: −∇f is steepest descent, the way water runs. And cos θ = 0 at right angles to ∇f: walking that way the height does not change at all, which means you are walking along a contour line. So the gradient is always perpendicular to the level curves. On a map, where contour lines are close together the ground is steep and ∇f is long.")}
      </p>

      <GradientFigure t={t} />

      <H2>{tx(t, "mPar_planeTitle", "The tangent plane and error propagation")}</H2>
      <p>
        {tx(t, "mPar_planeBody",
          "In one variable, near a point the curve looks like its tangent line. In two variables, near a point the surface looks like a tilted plane, the tangent plane, and the change in f is the sum of the two one-variable changes. This linear approximation is the practical heart of the chapter.")}
      </p>
      <Equation label={tx(t, "mPar_eqPlane", "Linear approximation")}
        where={[
          [r`(a, b)`, tx(t, "mPar_wAB", "the known point where f and its partials are computed")],
          [r`dx,\ dy`, tx(t, "mPar_wDxy", "small changes in the inputs")],
          [r`df`, tx(t, "mPar_wDf", "the resulting change in f: each input's slope times its own change, added")],
        ]}
        words={tx(t, "mPar_planeWords", "The change in f is about the x-slope times the change in x, plus the y-slope times the change in y.")}>
        {r`f(a + dx,\ b + dy) \approx f(a,b) + f_x(a,b)\,dx + f_y(a,b)\,dy \qquad df = f_x\,dx + f_y\,dy`}
      </Equation>
      <H3>{tx(t, "mPar_errTitle", "How measurement errors add up")}</H3>
      <p>
        {tx(t, "mPar_errBody",
          "A cylindrical tank is measured as r = 5 m and h = 10 m, each possibly off by up to 0.1 m and 0.2 m. The volume is V = π · 25 · 10 = 250π ≈ 785 m³. The worst-case error is dV = |∂V/∂r| dr + |∂V/∂h| dh = 2π · 5 · 10 · 0.1 + π · 25 · 0.2 = 10π + 5π = 15π ≈ 47 m³, about 6 %. Dividing by V shows the pattern: dV/V = 2 dr/r + dh/h = 2 · 2 % + 2 % = 6 %. The radius counts twice because it is squared: in a product of powers, relative errors add, each multiplied by its power.")}
      </p>
      <LiveFormula label={tx(t, "mPar_liveTank", "Try it: how sure is the tank's volume?")}
        tex={r`dV = 2\pi r h\,dr + \pi r^2\,dh \qquad (r = 5,\ h = 10)`}
        vars={[
          { id: "dr", label: tx(t, "mPar_liveDr", "error in r, dr (m)"), min: 0, max: 0.3, step: 0.01, value: 0.1, fmt: v => num(v) },
          { id: "dh", label: tx(t, "mPar_liveDh", "error in h, dh (m)"), min: 0, max: 0.6, step: 0.02, value: 0.2, fmt: v => num(v) },
        ]}
        compute={tankNumbers}
        note={tx(t, "mPar_liveTankNote", "Starts on the example: 31.4 + 15.7 = 47.1 m³, 6 %. Each metre of error in r costs 2πrh ≈ 314 m³, each metre in h only πr² ≈ 78.5 m³. Halve dr to 0.05 and the error drops to 4 %; halving dh instead only brings it to 5 %.")} />

      <H2>{tx(t, "mPar_chainTitle", "The chain rule along a path")}</H2>
      <p>
        {tx(t, "mPar_chainBody",
          "Walk along a path (x(t), y(t)) across the map. How fast does the height f change with time? In a short time dt, x changes by x′ dt and y by y′ dt, and the linear approximation adds up their effects. So df/dt = fₓ x′ + f_y y′ = ∇f · v, where v = (x′, y′) is your velocity. Walking around the bowl f = x² + y² on the circle x = cos t, y = sin t: ∇f = (2x, 2y), v = (−sin t, cos t), and ∇f · v = −2 cos t sin t + 2 sin t cos t = 0. You never climb, because the circle is a contour.")}
      </p>
      <Equation label={tx(t, "mPar_eqChain", "Chain rule and implicit slope")}
        where={[
          [r`\mathbf v = (x', y')`, tx(t, "mPar_wV", "the velocity along the path")],
          [r`-f_x / f_y`, tx(t, "mPar_wImp", "the slope of the level curve f = c, wherever f_y ≠ 0")],
        ]}
        words={tx(t, "mPar_chainWords", "Moving along a path, f changes at the rate of the gradient dotted with your velocity; along a contour that rate is zero, which gives the contour's slope.")}
        note={tx(t, "mPar_impNote", "The second formula comes from the first: along a level curve f does not change, so 0 = fₓ + f_y · dy/dx. For the circle x² + y² = 25 it gives dy/dx = −2x/2y = −x/y, the result the rules chapter found by implicit differentiation.")}>
        {r`\frac{d}{dt}f\big(x(t),y(t)\big) = f_x\,x' + f_y\,y' = \nabla f\cdot\mathbf v \qquad \frac{dy}{dx}\Big|_{f=c} = -\frac{f_x}{f_y}`}
      </Equation>

      <H2>{tx(t, "mPar_extTitle", "Tops, bottoms and saddles")}</H2>
      <p>
        {tx(t, "mPar_extBody",
          "At a highest or lowest point in the middle of a region, the surface is level in every direction, so both partial derivatives are zero: ∇f = 0. Such a point is a critical point. But there is a third kind of level point that one variable never showed: the saddle, uphill along one direction and downhill along another, like x² − y² at the origin. To tell them apart, look at the second derivatives. They are collected in a symmetric 2 × 2 matrix, the Hessian, and its determinant decides.")}
      </p>
      <Equation label={tx(t, "mPar_eqTest", "The second-derivative test")}
        where={[
          [r`D`, tx(t, "mPar_wD", "the determinant of the Hessian matrix [[fₓₓ, fₓᵧ], [fₓᵧ, f_yy]], at the critical point")],
          [r`D > 0,\ f_{xx} > 0`, tx(t, "mPar_wMin", "bends up in every direction: a local minimum")],
          [r`D > 0,\ f_{xx} < 0`, tx(t, "mPar_wMax", "bends down in every direction: a local maximum")],
          [r`D < 0`, tx(t, "mPar_wSad", "bends up one way and down another: a saddle")],
        ]}
        words={tx(t, "mPar_testWords", "Multiply the two pure second derivatives and subtract the square of the mixed one: positive means a bowl or a dome, negative a saddle.")}
        note={tx(t, "mPar_testNote", "D = 0 decides nothing (x⁴ + y⁴ and x⁴ − y⁴ both have D = 0 at the origin, a minimum and a saddle). In eigenvalue terms from the Linear Algebra section: D is the product of the Hessian's two eigenvalues, the curvatures along its two eigenvector directions; same signs means a bowl or a dome, opposite signs a saddle.")}>
        {r`D = f_{xx}\,f_{yy} - f_{xy}^{\,2}`}
      </Equation>
      <p>
        {tx(t, "mPar_extEx2", "Example: f = x³ − 3x + y².")}
      </p>
      <Derivation t={t} label={tx(t, "mPar_eqExt", "Classifying the critical points of x³ − 3x + y²")}
        steps={[
          { tex: r`f_x = 3x^2 - 3 = 0, \quad f_y = 2y = 0 \;\Rightarrow\; (1, 0),\ (-1, 0)`, full: true, why: tx(t, "mPar_e1", "step 1: set both partial derivatives to zero; x = ±1, y = 0") },
          { tex: r`f_{xx} = 6x, \quad f_{yy} = 2, \quad f_{xy} = 0`, full: true, why: tx(t, "mPar_e2", "step 2: the second derivatives") },
          { tex: r`(1, 0): \; D = 6 \cdot 2 - 0 = 12 > 0,\ f_{xx} = 6 > 0 \;\Rightarrow\; \green{\text{${tx(t, "mPar_eMin", "min")}}},\ f = -2`, full: true, why: tx(t, "mPar_e3", "step 3: bends up in every direction") },
          { tex: r`(-1, 0): \; D = -6 \cdot 2 = -12 < 0 \;\Rightarrow\; \red{\text{${tx(t, "mPar_eSaddle", "saddle")}}}`, full: true, why: tx(t, "mPar_e4", "bends down along x and up along y") },
        ]} />

      <H2>{tx(t, "mPar_lagTitle", "Optimising with a constraint")}</H2>
      <p>
        {tx(t, "mPar_lagBody",
          "Often the inputs are not free: find the largest rectangle with a fixed perimeter, the cheapest can with a fixed volume. The constraint is a curve g(x, y) = c, and we want the highest value of f along it. Walk along the curve and watch the contours of f you cross. While you cross them you are still climbing or descending; at the best point the curve just touches a contour without crossing it. Touching curves share a tangent, so their perpendiculars, the two gradients, are parallel: ∇f = λ ∇g for some number λ (the Greek letter lambda, called the Lagrange multiplier).")}
      </p>
      <Equation label={tx(t, "mPar_eqLag", "Lagrange multipliers")}
        where={[
          [r`g(x,y) = c`, tx(t, "mPar_wG", "the constraint curve the point must stay on")],
          [r`\lambda`, tx(t, "mPar_wLam", "an unknown number; it also measures how much the best f improves if c is raised by one")],
        ]}
        note={tx(t, "mPar_lagNote", "Two gradient equations plus the constraint: three equations for the three unknowns x, y, λ.")}
        words={tx(t, "mPar_lagWords", "At the best point on the constraint curve, the gradient of f and the gradient of the constraint point the same way (or exactly opposite).")}>
        {r`\nabla f = \lambda\,\nabla g, \qquad g(x,y) = c`}
      </Equation>
      <p>
        {tx(t, "mPar_lagEx2",
          "The fence from \"Using derivatives\" again: 20 m of fence for three sides of a pen against a wall, width x on the two short sides and length y opposite the wall. Maximise f = xy subject to g = 2x + y = 20.")}
      </p>
      <Derivation t={t} label={tx(t, "mPar_eqLagEx", "The fence by Lagrange multipliers")}
        steps={[
          { tex: r`\nabla f = (y,\ x), \qquad \nabla g = (2,\ 1)`, full: true, why: tx(t, "mPar_l1", "the two gradients") },
          { tex: r`y = 2\lambda, \qquad x = \lambda \;\Rightarrow\; y = 2x`, full: true, why: tx(t, "mPar_l2", "∇f = λ∇g, one equation per component; eliminate λ") },
          { tex: r`2x + 2x = 20 \;\Rightarrow\; x = 5,\ y = 10`, full: true, why: tx(t, "mPar_l3", "put y = 2x into the constraint") },
          { tex: r`f = 5 \cdot 10 = \green{50\ \text{m}^2}`, full: true, why: tx(t, "mPar_l4", "the same answer as before, without solving the constraint for one variable first") },
        ]} />
      <Callout type="tip" t={t}>
        {tx(t, "mPar_moreTip", "Everything here works the same with three or more inputs. f(x, y, z) has three partial derivatives, a gradient with three components that is perpendicular to the level surfaces f = c, and a 3 × 3 Hessian. Only the pictures stop, because a function of three variables would need four dimensions to draw.")}
      </Callout>

      <H2>{tx(t, "mPar_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mPar_ex1", "1. f = x² e^(3y): fₓ = 2x e^(3y), f_y = 3x² e^(3y).")}</p>
      <p>{tx(t, "mPar_ex2", "2. f = x² + xy + y² at (1, 2): ∇f = (2x + y, x + 2y) = (4, 5), steepest slope √41 ≈ 6.40. Along u = (3/5, 4/5): 4 · 0.6 + 5 · 0.8 = 6.4, almost the steepest, because u nearly points along ∇f.")}</p>
      <p>{tx(t, "mPar_ex3", "3. Tangent-plane estimate of √(x² + y²) at (3.02, 3.97) from (3, 4): f = 5, fₓ = x/f = 0.6, f_y = y/f = 0.8. f ≈ 5 + 0.6 · 0.02 + 0.8 · (−0.03) = 4.988 (true 4.98812).")}</p>
      <p>{tx(t, "mPar_ex4", "4. A rectangle 8 cm × 5 cm, each side measured to ±0.1 cm: A = 40 cm², dA = 5 · 0.1 + 8 · 0.1 = 1.3 cm² (3.25 %).")}</p>
      <p>{tx(t, "mPar_ex5", "5. f = x² + y² − 2x + 6y: ∇f = (2x − 2, 2y + 6) = 0 at (1, −3); fₓₓ = f_yy = 2, fₓᵧ = 0, D = 4 > 0: a minimum, f(1, −3) = −10 (completing the square gives the same: (x − 1)² + (y + 3)² − 10).")}</p>
      <p>{tx(t, "mPar_ex6", "6. The point of the line x + 2y = 5 closest to the origin: minimise x² + y², ∇ = (2x, 2y) = λ(1, 2), so y = 2x; then 5x = 5, the point (1, 2), distance √5.")}</p>

      <H2>{tx(t, "mPar_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mPar_tWrong", "Wrong"), tx(t, "mPar_tRight", "Right"), tx(t, "mPar_tWhy", "Why")]}
        rows={[
          ["∂/∂x (x²y) = 2xy + x²", "2xy", tx(t, "mPar_m1", "y is a constant when differentiating in x; its derivative is 0")],
          ["∂/∂y (5x³) = 15x²", "0", tx(t, "mPar_m2", "no y at all: a constant as far as y is concerned")],
          [tx(t, "mPar_m3w", "D_u f with a non-unit u"), tx(t, "mPar_m3r", "divide u by its length first"), tx(t, "mPar_m3", "otherwise the slope is scaled by |u|")],
          [tx(t, "mPar_m4w", "∇f is tangent to the contour"), tx(t, "mPar_m4r", "perpendicular to it"), tx(t, "mPar_m4", "along the contour f does not change: ∇f · u = 0")],
          [tx(t, "mPar_m5w", "∇f = 0 means a max or a min"), tx(t, "mPar_m5r", "or a saddle"), tx(t, "mPar_m5", "check D = fₓₓf_yy − fₓᵧ²")],
          [tx(t, "mPar_m6w", "relative error of r²h is dr/r + dh/h"), "2 dr/r + dh/h", tx(t, "mPar_m6", "each relative error is multiplied by its power")],
        ]}
      />

      <KeyIdeas t={t} id="mPar" items={[
        "A partial derivative is an ordinary derivative with every other input frozen.",
        "Mixed partials agree: fₓᵧ = fᵧₓ for smooth functions.",
        "The gradient ∇f = (fₓ, f_y) points uphill by the steepest route; its length is that slope.",
        "The slope along a unit vector u is ∇f · u; it is zero along contours, so ∇f ⊥ contours.",
        "df = fₓ dx + f_y dy: the tangent plane, and the rule for how errors add up.",
        "Critical points have ∇f = 0; D = fₓₓf_yy − fₓᵧ² separates minima, maxima and saddles.",
        "With a constraint g = c, the best point has ∇f = λ∇g.",
      ]} />
    </Article>
  );
}
