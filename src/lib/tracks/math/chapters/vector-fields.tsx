"use client";

// Calculus 12: vector fields — an arrow at every point; drawing fields and
// their flow lines; gradient fields; divergence as outflow per unit area
// (derived from a tiny square); curl as circulation per unit area (the
// paddle wheel), with the shear and the whirl as the two surprises; the 3D
// versions ∇·F and ∇×F; the identities curl(∇f) = 0 and div(curl F) = 0; the
// Laplacian. Sets up line integrals and the theorems of Green, Gauss and Stokes.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { VectorFieldFigure } from "@/components/lesson/figures/math/VectorFieldFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;
const n = (v: number) => String(+v.toFixed(2)).replace("-", "−");

// ── Live formula: div and curl of a linear field ──────────────────────────────

function linearNumbers(v: Record<string, number>) {
  const { a, b, c, d } = v;
  return {
    tex: r`\operatorname{div}\mathbf F = ${n(a)} + ${n(d)} = \green{${n(a + d)}} \qquad \operatorname{curl}\mathbf F = ${n(c)} - ${n(b)} = \green{${n(c - b)}}`,
  };
}

export function VectorFieldsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mVf_intro",
          "A function of two variables gives a number at every point of the plane: a height, a temperature. Many things need more than a number. The wind at each point of a map has a direction and a strength, and so does the current in a river, the force of gravity around a planet or the pull of a magnet. A vector field attaches an arrow to every point. This chapter shows how to draw fields, follow them, and measure two things about them at each point: how much the flow spreads out (the divergence) and how much it swirls (the curl).")}
      </Lead>

      <Goals t={t} id="mVf" items={[
        "Read and sketch a vector field, its flow lines, and the gradient field of a function.",
        "Compute the divergence and say what it means: outflow per unit area.",
        "Compute the curl and say what it means: circulation per unit area, the turning of a paddle wheel.",
        "Use the identities curl(∇f) = 0 and div(curl F) = 0, and the 3D formulas.",
      ]} />

      <H2>{tx(t, "mVf_whatTitle", "An arrow at every point")}</H2>
      <p>
        {tx(t, "mVf_whatBody",
          "A vector field in the plane is a rule F that gives a vector F(x, y) for every point (x, y). Its two components are ordinary functions of two variables, usually called P and Q, so F(x, y) = (P(x, y), Q(x, y)). To draw it, pick a grid of points and draw at each one an arrow in the direction of F there, longer where F is stronger. For F = (x, y) the arrow at each point points straight away from the origin, and grows with the distance. For F = (−y, x) the arrow is the position vector turned a quarter turn counterclockwise, so the arrows go round the origin.")}
      </p>
      <Equation label={tx(t, "mVf_eqField", "A vector field in the plane")}
        where={[
          [r`(x, y)`, tx(t, "mVf_wPt", "a point of the plane")],
          [r`P(x, y)`, tx(t, "mVf_wP", "the horizontal component of the arrow at that point")],
          [r`Q(x, y)`, tx(t, "mVf_wQ", "the vertical component")],
        ]}
        words={tx(t, "mVf_fieldWords", "At each point, the field gives an arrow: how far it goes across and how far up.")}>
        {r`\mathbf F(x, y) = \big(P(x, y),\ Q(x, y)\big)`}
      </Equation>
      <p>
        {tx(t, "mVf_flowBody",
          "Think of F as the velocity of a fluid. A speck of dust dropped at a point moves with the arrow there, then with the arrow at its new position, and so on. Its path is a flow line (or integral curve): a curve whose tangent at every point is the field's arrow. Finding one means solving x′ = P(x, y), y′ = Q(x, y), the kind of differential equation of the differential equations chapter. For (−y, x) the flow lines are circles around the origin; for (x, y) they are rays leaving it.")}
      </p>
      <H3>{tx(t, "mVf_gradTitle", "Gradient fields")}</H3>
      <p>
        {tx(t, "mVf_gradBody",
          "Every function f(x, y) gives a vector field, its gradient ∇f = (∂f/∂x, ∂f/∂y), from the partial derivatives chapter. Its arrows point uphill, at right angles to the contour lines, and are longest where the slope is steepest. Fields that are gradients are called conservative, and f is called a potential of the field; the next chapter explains the name. Not every field is a gradient: (−y, x) is not, as the end of this chapter will show.")}
      </p>

      <VectorFieldFigure t={t} />

      <H2>{tx(t, "mVf_divTitle", "Divergence: how much flows out")}</H2>
      <p>
        {tx(t, "mVf_divBody",
          "Draw a tiny square with sides h around a point and ask: does more fluid leave the square than enter it? Fluid crosses the right side at the rate P times the side's length, and the left side likewise; only P carries fluid across vertical sides. If P is larger on the right than on the left, more leaves through the right than enters through the left. The same goes for Q on the top and bottom.")}
      </p>
      <Derivation t={t} label={tx(t, "mVf_eqDivDer", "Outflow from a tiny square, per unit area")}
        steps={[
          { full: true, tex: r`\text{right} - \text{left} \approx \big[P(x + \tfrac h2, y) - P(x - \tfrac h2, y)\big]\,h \approx \frac{\partial P}{\partial x}\,h \cdot h`, why: tx(t, "mVf_d1", "the flow out through the right side minus the flow in through the left; the difference of P across a width h is about ∂P/∂x · h") },
          { full: true, tex: r`\text{top} - \text{bottom} \approx \frac{\partial Q}{\partial y}\,h \cdot h`, why: tx(t, "mVf_d2", "the same for the top and bottom sides, with Q") },
          { full: true, tex: r`\frac{\text{net outflow}}{\text{area}} \approx \frac{(\partial P/\partial x + \partial Q/\partial y)\,h^2}{h^2}`, why: tx(t, "mVf_d3", "add the two and divide by the area h²") },
          { full: true, tex: r`\green{\operatorname{div}\mathbf F = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y}}`, why: tx(t, "mVf_d4", "the approximation becomes exact as h → 0") },
        ]} />
      <Equation label={tx(t, "mVf_eqDiv", "The divergence")}
        where={[
          [r`\partial P/\partial x`, tx(t, "mVf_wPx", "how fast the horizontal flow grows to the right")],
          [r`\partial Q/\partial y`, tx(t, "mVf_wQy", "how fast the vertical flow grows upward")],
          [r`\nabla\cdot\mathbf F`, tx(t, "mVf_wNabla", "another way to write it: the dot product of ∇ = (∂/∂x, ∂/∂y) with F")],
        ]}
        words={tx(t, "mVf_divWords", "Add how much the across-part grows going across and how much the up-part grows going up: that is how much the flow spreads out from each point.")}>
        {r`\operatorname{div}\mathbf F = \nabla\cdot\mathbf F = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y}`}
      </Equation>
      <p>
        {tx(t, "mVf_divEx",
          "Positive divergence marks a source: more leaves than arrives, as from a tap. Negative marks a sink, like a drain. Zero means as much arrives as leaves; such a field is called incompressible, the right model for water. For F = (x, y)/2: ∂P/∂x = 1/2, ∂Q/∂y = 1/2, div F = 1 everywhere. For F = (−y, x)/2: P does not depend on x and Q does not depend on y, so div F = 0, as expected of a flow that only goes round.")}
      </p>

      <H2>{tx(t, "mVf_curlTitle", "Curl: how much it swirls")}</H2>
      <p>
        {tx(t, "mVf_curlBody",
          "Now go round the same tiny square counterclockwise and add up how much the flow pushes along the way: the circulation. Along the bottom side you move right, so P helps; along the top you move left, so P works against you. Along the right side you move up, Q helps; along the left you move down, Q works against you.")}
      </p>
      <Derivation t={t} label={tx(t, "mVf_eqCurlDer", "Circulation round a tiny square, per unit area")}
        steps={[
          { full: true, tex: r`\text{bottom} - \text{top} \approx \big[P(x, y - \tfrac h2) - P(x, y + \tfrac h2)\big]\,h \approx -\frac{\partial P}{\partial y}\,h^2`, why: tx(t, "mVf_c1", "P counts along the bottom (moving right) and against you along the top (moving left)") },
          { full: true, tex: r`\text{right} - \text{left} \approx \frac{\partial Q}{\partial x}\,h^2`, why: tx(t, "mVf_c2", "Q counts along the right side (moving up) and against you along the left (moving down)") },
          { full: true, tex: r`\green{\operatorname{curl}\mathbf F = \frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}}`, why: tx(t, "mVf_c3", "add, divide by h² and let h → 0: circulation per unit area, counterclockwise positive") },
        ]} />
      <Equation label={tx(t, "mVf_eqCurl", "The curl in the plane")}
        where={[
          [r`\partial Q/\partial x`, tx(t, "mVf_wQx", "how fast the upward flow grows to the right: it turns a wheel counterclockwise")],
          [r`\partial P/\partial y`, tx(t, "mVf_wPy", "how fast the rightward flow grows upward: it turns a wheel clockwise")],
        ]}
        note={tx(t, "mVf_curlNote", "A tiny paddle wheel placed in the flow spins with angular speed curl F / 2.")}
        words={tx(t, "mVf_curlWords", "If the flow pushes up harder on the right than on the left, and right harder below than above, a little wheel is turned counterclockwise.")}>
        {r`\operatorname{curl}\mathbf F = \frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}`}
      </Equation>
      <LessonTable
        headers={["F", "div F", "curl F", tx(t, "mVf_tWhat", "what it looks like")]}
        rows={[
          ["(x, y)", "2", "0", tx(t, "mVf_r1", "a source: straight out, no swirl")],
          ["(−y, x)", "0", "2", tx(t, "mVf_r2", "rigid rotation: round, no spreading")],
          ["(x, −y)", "0", "0", tx(t, "mVf_r3", "a saddle: in along y, out along x, balanced")],
          ["(y, 0)", "0", "−1", tx(t, "mVf_r4", "shear: straight lines, yet it turns a wheel")],
          ["(−y, x)/(x² + y²)", "0", tx(t, "mVf_r5c", "0 (except at 0)"), tx(t, "mVf_r5", "a whirl: circles, but no small region rotates")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "mVf_curlWarn", "Curl is not \"the flow lines curve\". Shear has straight flow lines and non-zero curl: the flow above a wheel is faster than below it. The whirl has circular flow lines and zero curl: the fast inner flow and the slow outer flow push a wheel equally both ways. Try both in the figure.")}
      </Callout>
      <LiveFormula label={tx(t, "mVf_liveLin", "Try it: F = (ax + by, cx + dy)")}
        tex={r`\mathbf F = (ax + by,\ cx + dy):\quad \operatorname{div}\mathbf F = a + d,\quad \operatorname{curl}\mathbf F = c - b`}
        vars={[
          { id: "a", label: "a", min: -2, max: 2, step: 0.5, value: 1, fmt: n },
          { id: "b", label: "b", min: -2, max: 2, step: 0.5, value: -1, fmt: n },
          { id: "c", label: "c", min: -2, max: 2, step: 0.5, value: 1, fmt: n },
          { id: "d", label: "d", min: -2, max: 2, step: 0.5, value: 1, fmt: n },
        ]}
        compute={linearNumbers}
        note={tx(t, "mVf_liveLinNote", "For a linear field the divergence is the trace a + d of its matrix and the curl is c − b. b = c makes the matrix symmetric and the curl 0: such a field is a gradient. a = −d makes it incompressible.")} />

      <H2>{tx(t, "mVf_3dTitle", "In three dimensions")}</H2>
      <p>
        {tx(t, "mVf_3dBody",
          "A field in space has three components, F = (P, Q, R). The divergence gains a third term. The curl becomes a vector: the axis about which the flow rotates, with length equal to the circulation per unit area round that axis. It is the cross product of ∇ with F, computed like the determinant in the cross product chapter. A plane field is a space field with R = 0 and no z: its curl points straight up, and the plane curl above is its z-component.")}
      </p>
      <Equation label={tx(t, "mVf_eq3d", "Divergence and curl in space")}
        where={[
          [r`\nabla`, tx(t, "mVf_w3Nabla", "the operator (∂/∂x, ∂/∂y, ∂/∂z), used like a vector")],
          [r`\nabla\cdot\mathbf F`, tx(t, "mVf_w3Div", "a number at each point: outflow per unit volume")],
          [r`\nabla\times\mathbf F`, tx(t, "mVf_w3Curl", "a vector at each point: the axis and amount of local rotation")],
        ]}
        words={tx(t, "mVf_3dWords", "Divergence is still the sum of how each component grows in its own direction; curl collects, for each axis, how the field turns around it.")}>
        {r`\nabla\cdot\mathbf F = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y} + \frac{\partial R}{\partial z}, \qquad \nabla\times\mathbf F = \left(\frac{\partial R}{\partial y} - \frac{\partial Q}{\partial z},\ \frac{\partial P}{\partial z} - \frac{\partial R}{\partial x},\ \frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}\right)`}
      </Equation>

      <H2>{tx(t, "mVf_idTitle", "Two identities")}</H2>
      <p>
        {tx(t, "mVf_idBody",
          "A gradient field never swirls. In the plane, F = ∇f has P = ∂f/∂x and Q = ∂f/∂y, and the curl is the difference of the two mixed second derivatives, which are equal (the partial derivatives chapter). This gives a quick test: a field with non-zero curl somewhere cannot be a gradient.")}
      </p>
      <Derivation t={t} label={tx(t, "mVf_eqGrad", "curl(∇f) = 0")}
        steps={[
          { full: true, tex: r`\mathbf F = \nabla f \;\Rightarrow\; P = \frac{\partial f}{\partial x},\quad Q = \frac{\partial f}{\partial y}`, why: tx(t, "mVf_i1", "the components of a gradient") },
          { full: true, tex: r`\operatorname{curl}\mathbf F = \frac{\partial^2 f}{\partial x\,\partial y} - \frac{\partial^2 f}{\partial y\,\partial x}`, why: tx(t, "mVf_i2", "∂Q/∂x differentiates f by y then x; ∂P/∂y by x then y") },
          { full: true, tex: r`\green{= 0}`, why: tx(t, "mVf_i3", "the mixed partials are equal for smooth f (Schwarz's theorem)") },
        ]} />
      <p>
        {tx(t, "mVf_idBody2",
          "So (−y, x) is not a gradient: its curl is 2. In space the same calculation shows ∇×(∇f) = 0, and a second identity holds: ∇·(∇×F) = 0, the curl of any field has zero divergence. Finally, the divergence of a gradient, ∇·∇f = ∂²f/∂x² + ∂²f/∂y², is the Laplacian ∇²f. It measures how much f at a point differs from its average around the point, and it is the heart of the heat and wave equations of the partial differential equations chapter.")}
      </p>

      <H2>{tx(t, "mVf_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mVf_ex1", "1. F = (x²y, xy²): div F = 2xy + 2xy = 4xy, curl F = y² − x². At (1, 2): div 8, curl 3.")}</p>
      <p>{tx(t, "mVf_ex2", "2. F = (eˣ cos y, −eˣ sin y): div F = eˣ cos y − eˣ cos y = 0 and curl F = −eˣ sin y + eˣ sin y = 0. It is both incompressible and a gradient (of eˣ cos y).")}</p>
      <p>{tx(t, "mVf_ex3", "3. F = (y, x): curl F = 1 − 1 = 0, and indeed F = ∇(xy).")}</p>
      <p>{tx(t, "mVf_ex4", "4. In space, F = (yz, xz, xy) = ∇(xyz), so ∇ × F = (x − x, y − y, z − z) = 0.")}</p>

      <MathPracticeFigure t={t} set="vectorFields" />

      <H2>{tx(t, "mVf_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mVf_tWrong", "Wrong"), tx(t, "mVf_tRight", "Right"), tx(t, "mVf_tWhy", "Why")]}
        rows={[
          [tx(t, "mVf_m1w", "div F = ∂P/∂y + ∂Q/∂x"), "∂P/∂x + ∂Q/∂y", tx(t, "mVf_m1", "each component is differentiated along its own direction")],
          [tx(t, "mVf_m2w", "curl F = ∂P/∂y − ∂Q/∂x"), "∂Q/∂x − ∂P/∂y", tx(t, "mVf_m2", "the other order flips the sign: counterclockwise is positive")],
          [tx(t, "mVf_m3w", "curved flow lines ⇒ non-zero curl"), tx(t, "mVf_m3r", "look at a tiny wheel"), tx(t, "mVf_m3", "the whirl circles with curl 0; shear is straight with curl ≠ 0")],
          [tx(t, "mVf_m4w", "div F is a vector"), tx(t, "mVf_m4r", "a number"), tx(t, "mVf_m4", "a dot product gives a number; the 3D curl is the vector")],
          [tx(t, "mVf_m5w", "longer arrows ⇒ larger divergence"), tx(t, "mVf_m5r", "how the arrows change"), tx(t, "mVf_m5", "a strong uniform field has divergence 0")],
        ]}
      />

      <KeyIdeas t={t} id="mVf" items={[
        "A vector field F = (P, Q) puts an arrow at every point; flow lines follow the arrows.",
        "Gradient fields ∇f point uphill, across the contour lines; they are called conservative.",
        "div F = ∂P/∂x + ∂Q/∂y is the net outflow per unit area: positive at sources, negative at sinks.",
        "curl F = ∂Q/∂x − ∂P/∂y is the circulation per unit area, the spin of a tiny paddle wheel.",
        "Curl is about rotation of small regions, not curved flow lines: shear has curl, the whirl (−y, x)/r² does not.",
        "curl(∇f) = 0 and div(curl F) = 0; div(∇f) is the Laplacian ∇²f.",
      ]} />
    </Article>
  );
}
