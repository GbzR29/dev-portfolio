"use client";

// Calculus 14: the theorems of Green, Gauss and Stokes — Green's theorem
// proved by cutting the region into cells whose inner edges cancel; checked
// on the disk; area as a line integral (ellipse, the shoelace formula); the
// flux form (divergence theorem in the plane); the divergence theorem in
// space (flux through a sphere, Gauss's law); Stokes' theorem with its
// orientation and the freedom to choose the surface; holes; and the one idea
// behind all of them: the integral of a derivative over a region equals the
// integral over its boundary.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { GreenFigure } from "@/components/lesson/figures/math/GreenFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;
const n = (v: number) => String(+v.toFixed(3)).replace("-", "−");

// ── Live formula: the area of an ellipse from its boundary ────────────────────

function ellipseNumbers(v: Record<string, number>) {
  const { a, b } = v;
  return { tex: r`\tfrac12\int_0^{2\pi} ab\,(\cos^2 t + \sin^2 t)\,dt = \pi \cdot ${n(a)} \cdot ${n(b)} = \green{${n(Math.PI * a * b)}}` };
}

export function GreenStokesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mGs_intro",
          "The fundamental theorem of calculus says that integrating a derivative over an interval only needs the two end points: ∫ₐᵇ f′(x) dx = f(b) − f(a). The previous chapter extended it to paths: the work of a gradient only needs the path's two ends. This chapter finishes the story. Green's theorem turns a circulation round the edge of a plane region into an integral of the curl over the inside; the divergence theorem does the same for flow out of a region; Stokes' theorem does it for any surface in space. They are among the most used results in physics, and one picture explains all of them.")}
      </Lead>

      <Goals t={t} id="mGs" items={[
        "State Green's theorem and explain it by cutting the region into small cells.",
        "Use it to compute circulations and areas, including the area inside a curve.",
        "State and use the divergence theorem, in the plane and in space.",
        "State Stokes' theorem with the right orientation, and see the common pattern of all these theorems.",
      ]} />

      <H2>{tx(t, "mGs_greenTitle", "Green's theorem")}</H2>
      <p>
        {tx(t, "mGs_greenBody",
          "Take a region D of the plane with boundary curve C, travelled counterclockwise, so that D is always on your left. The vector fields chapter found that the circulation round a tiny square is about curl F times its area. Now fill D with tiny squares. Add up all their circulations. Every edge shared by two squares is travelled twice, once in each direction, so its two contributions cancel. Only the edges on the outside survive, and together they are exactly C.")}
      </p>
      <Derivation t={t} label={tx(t, "mGs_eqGreenDer", "Why the edge equals the inside")}
        steps={[
          { full: true, tex: r`\oint_C \mathbf F\cdot d\mathbf r = \sum_{\text{cells}} \oint_{\partial(\text{cell})} \mathbf F\cdot d\mathbf r`, why: tx(t, "mGs_g1", "the inner edges are walked twice in opposite directions and cancel; ∂ means \"the boundary of\"") },
          { full: true, tex: r`\oint_{\partial(\text{cell})} \mathbf F\cdot d\mathbf r \approx \operatorname{curl}\mathbf F \cdot \Delta A`, why: tx(t, "mGs_g2", "a tiny cell's circulation is curl × area, from the definition of the curl") },
          { full: true, tex: r`\sum_{\text{cells}} \operatorname{curl}\mathbf F\,\Delta A \;\longrightarrow\; \iint_D \operatorname{curl}\mathbf F\,dA`, why: tx(t, "mGs_g3", "a Riemann sum for the double integral; as the cells shrink, the approximation becomes exact") },
        ]} />
      <Equation label={tx(t, "mGs_eqGreen", "Green's theorem")}
        where={[
          [r`D`, tx(t, "mGs_wD", "a region of the plane, on which F is smooth (no holes where F is undefined)")],
          [r`C = \partial D`, tx(t, "mGs_wC", "its boundary, travelled counterclockwise (the region on the left)")],
          [r`\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}`, tx(t, "mGs_wCurl", "the curl of F = (P, Q): circulation per unit area")],
        ]}
        words={tx(t, "mGs_greenWords", "How much the field pushes you round the edge equals the total swirl inside.")}>
        {r`\oint_C P\,dx + Q\,dy = \iint_D \left(\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}\right) dA`}
      </Equation>
      <Derivation t={t} label={tx(t, "mGs_eqCheck", "Check: F = (−y, x) on the unit disk")}
        steps={[
          { tex: r`\oint_C = 2\pi`, why: tx(t, "mGs_c1", "computed in the line integrals chapter: F · r′ = 1 all the way round") },
          { tex: r`\operatorname{curl}\mathbf F = 1 - (-1) = 2`, why: tx(t, "mGs_c2", "∂Q/∂x = 1, ∂P/∂y = −1") },
          { tex: r`\iint_D 2\,dA = 2 \cdot \pi \cdot 1^2 = \green{2\pi}`, why: tx(t, "mGs_c3", "the same number, by an entirely different calculation") },
        ]} />

      <GreenFigure t={t} />

      <H3>{tx(t, "mGs_areaTitle", "Areas from the boundary")}</H3>
      <p>
        {tx(t, "mGs_areaBody",
          "Choose a field whose curl is 1 everywhere, such as F = (−y, x)/2. Then the right side of Green's theorem is ∬ 1 dA, the area of D, and the left side is a line integral round the edge. So you can find an area by walking its boundary, which is how a planimeter, a mechanical instrument dragged round the outline of a shape on a map, measures land.")}
      </p>
      <Equation label={tx(t, "mGs_eqArea", "Area as a line integral")}
        where={[
          [r`\tfrac12(x\,dy - y\,dx)`, tx(t, "mGs_wArea", "F · dr for F = (−y, x)/2, whose curl is 1")],
        ]}
        note={tx(t, "mGs_areaNote", "For a polygon, walking each straight side gives the shoelace formula of the perimeter and area chapter: ½ Σ (xᵢyᵢ₊₁ − xᵢ₊₁yᵢ).")}
        words={tx(t, "mGs_areaWords", "Walk round the edge adding up x times the step up minus y times the step across, and half of the total is the area enclosed.")}>
        {r`\text{Area}(D) = \frac12 \oint_C x\,dy - y\,dx`}
      </Equation>
      <LiveFormula label={tx(t, "mGs_liveEll", "Try it: the ellipse x = a cos t, y = b sin t")}
        tex={r`\tfrac12\oint x\,dy - y\,dx = \pi a b`}
        vars={[
          { id: "a", label: "a", min: 0.5, max: 4, step: 0.5, value: 2, fmt: n },
          { id: "b", label: "b", min: 0.5, max: 4, step: 0.5, value: 1, fmt: n },
        ]}
        compute={ellipseNumbers}
        note={tx(t, "mGs_liveEllNote", "x dy − y dx = a cos t · b cos t dt + b sin t · a sin t dt = ab dt. Half of 2πab is πab: with a = b = R it is the circle's πR².")} />

      <H2>{tx(t, "mGs_fluxTitle", "Flux and the divergence theorem in the plane")}</H2>
      <p>
        {tx(t, "mGs_fluxBody",
          "Instead of the push along the edge, measure the flow across it. Let n be the unit normal pointing out of D. The flux ∮ F · n ds is the amount of fluid leaving D per unit time. The same cell argument works: what leaves one cell through a shared edge enters its neighbour, so inner edges cancel, and each tiny cell's outflow is div F times its area.")}
      </p>
      <Equation label={tx(t, "mGs_eqFlux", "The divergence theorem in the plane")}
        where={[
          [r`\mathbf n`, tx(t, "mGs_wN", "the outward unit normal of the boundary")],
          [r`ds`, tx(t, "mGs_wDs", "a small piece of boundary length")],
          [r`\operatorname{div}\mathbf F`, tx(t, "mGs_wDiv", "∂P/∂x + ∂Q/∂y: outflow per unit area")],
        ]}
        words={tx(t, "mGs_fluxWords", "What flows out through the edge is the total of all the sources inside minus the sinks.")}>
        {r`\oint_C \mathbf F\cdot\mathbf n\,ds = \iint_D \operatorname{div}\mathbf F\,dA`}
      </Equation>
      <p>
        {tx(t, "mGs_fluxEx",
          "For F = (x, y) on the unit disk: on the circle F = n, so F · n = 1 and the flux is the length 2π. Inside, div F = 2 and ∬ 2 dA = 2π. It is Green's theorem in disguise: the outward normal is the tangent turned a quarter turn, and turning F = (P, Q) a quarter turn into (−Q, P) turns its flux into a circulation and its divergence into a curl.")}
      </p>

      <H2>{tx(t, "mGs_gaussTitle", "The divergence theorem in space")}</H2>
      <p>
        {tx(t, "mGs_gaussBody",
          "In space, a solid region V is bounded by a closed surface S, like a ball by its sphere. Cut V into tiny boxes: what leaves one box through a shared face enters the next, so only the outer faces count, and each box produces div F times its volume. This is the divergence theorem, also called Gauss's theorem.")}
      </p>
      <Equation label={tx(t, "mGs_eqGauss", "The divergence theorem (Gauss)")}
        where={[
          [r`S = \partial V`, tx(t, "mGs_wS", "the closed surface enclosing the solid V")],
          [r`\mathbf n\,dS`, tx(t, "mGs_wNdS", "a small piece of surface, with area dS and outward normal n")],
          [r`\nabla\cdot\mathbf F`, tx(t, "mGs_wDiv3", "∂P/∂x + ∂Q/∂y + ∂R/∂z: outflow per unit volume")],
        ]}
        words={tx(t, "mGs_gaussWords", "The total flow out through the closed surface equals the total of the sources inside.")}>
        {r`\oiint_S \mathbf F\cdot\mathbf n\,dS = \iiint_V \nabla\cdot\mathbf F\,dV`}
      </Equation>
      <Derivation t={t} label={tx(t, "mGs_eqSphere", "F = (x, y, z) through the sphere of radius R")}
        steps={[
          { full: true, tex: r`\text{on } S:\ \mathbf n = \tfrac{(x, y, z)}{R},\quad \mathbf F\cdot\mathbf n = \tfrac{x^2 + y^2 + z^2}{R} = R`, why: tx(t, "mGs_s1", "the field points straight out and has length R on the sphere") },
          { full: true, tex: r`\oiint_S R\,dS = R \cdot 4\pi R^2 = 4\pi R^3`, why: tx(t, "mGs_s2", "a constant times the sphere's area, 4πR²") },
          { full: true, tex: r`\iiint_V 3\,dV = 3 \cdot \tfrac43\pi R^3 = \green{4\pi R^3}`, why: tx(t, "mGs_s3", "∇ · F = 1 + 1 + 1 = 3, times the ball's volume") },
        ]} />
      <Callout type="info" t={t}>
        {tx(t, "mGs_gaussTip", "This is how Gauss's law of electricity works: the electric flux out of any closed surface equals the charge inside divided by a constant, because the field's divergence is the charge density. The same law holds for gravity, and for heat flowing out of a body.")}
      </Callout>

      <H2>{tx(t, "mGs_stokesTitle", "Stokes' theorem")}</H2>
      <p>
        {tx(t, "mGs_stokesBody",
          "Green's theorem lives in a flat region. Stokes' theorem lets the region bend: S is any surface in space whose edge is the closed curve C, like a soap film on a bent wire loop. The circulation round C equals the flux of the curl through S. Orientation is fixed by the right-hand rule: curl the fingers of your right hand in the direction you travel round C, and your thumb gives the side of S that the normal n points to.")}
      </p>
      <Equation label={tx(t, "mGs_eqStokes", "Stokes' theorem")}
        where={[
          [r`S`, tx(t, "mGs_wSurf", "a surface whose boundary is the closed curve C")],
          [r`\nabla\times\mathbf F`, tx(t, "mGs_wCurl3", "the curl, a vector: the axis and amount of local rotation")],
          [r`\mathbf n`, tx(t, "mGs_wNs", "the unit normal of S, on the side given by the right-hand rule")],
        ]}
        words={tx(t, "mGs_stokesWords", "The swirl round the rim of any surface equals the total swirl passing through the surface.")}>
        {r`\oint_C \mathbf F\cdot d\mathbf r = \iint_S (\nabla\times\mathbf F)\cdot\mathbf n\,dS`}
      </Equation>
      <p>
        {tx(t, "mGs_stokesEx",
          "Take F = (−y, x, 0) and C the unit circle in the xy-plane, counterclockwise seen from above. Its curl is (0, 0, 2). For the flat disk, n = (0, 0, 1) and the flux of the curl is 2 · π = 2π. For the upper half of the unit sphere, which has the same edge, the flux of the constant vector (0, 0, 2) is 2 times the area of its shadow on the plane, again 2π. Any surface with that rim gives the same answer, which is often the trick: choose the easiest surface. With S flat and in the plane, Stokes' theorem is exactly Green's.")}
      </p>

      <H2>{tx(t, "mGs_bigTitle", "One theorem in five costumes")}</H2>
      <LessonTable
        headers={[tx(t, "mGs_tName", "Theorem"), tx(t, "mGs_tInside", "Derivative, integrated over…"), tx(t, "mGs_tEdge", "…equals, over the boundary")]}
        rows={[
          [tx(t, "mGs_b1", "fundamental theorem of calculus"), tx(t, "mGs_b1i", "f′ on an interval [a, b]"), "f(b) − f(a)"],
          [tx(t, "mGs_b2", "gradient theorem"), tx(t, "mGs_b2i", "∇f · dr along a path"), "f(B) − f(A)"],
          [tx(t, "mGs_b3", "Green"), tx(t, "mGs_b3i", "curl F over a plane region"), tx(t, "mGs_b3e", "∮ F · dr round its edge")],
          [tx(t, "mGs_b4", "Stokes"), tx(t, "mGs_b4i", "(∇ × F) · n over a surface"), tx(t, "mGs_b4e", "∮ F · dr round its rim")],
          [tx(t, "mGs_b5", "divergence (Gauss)"), tx(t, "mGs_b5i", "∇ · F over a solid"), tx(t, "mGs_b5e", "∯ F · n dS over its surface")],
        ]}
      />
      <p>
        {tx(t, "mGs_bigBody",
          "In each row the inside is cut into small pieces, each piece's contribution is a difference across the piece, and neighbours cancel, leaving only the outer boundary. Mathematicians write all five as one formula, ∫ over Ω of dω = ∫ over ∂Ω of ω, the generalized Stokes theorem. The boundary of a boundary is always empty, which is why curl(∇f) = 0 and div(curl F) = 0.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mGs_holeWarn", "All these theorems need the field to be smooth on the whole region. The whirl (−y, x)/(x² + y²) has zero curl wherever it is defined, yet circulates 2π round the origin: Green's theorem cannot be applied to a region containing the origin, where the field blows up. Try it in the figure.")}
      </Callout>

      <H2>{tx(t, "mGs_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mGs_ex1", "1. ∮ (xy dx + x² dy) round the square [0, 1] × [0, 1], counterclockwise: the curl is 2x − x = x, and ∬ x dA = 1/2. Walking the four sides gives the same: 0 + 1 − 1/2 + 0 = 1/2.")}</p>
      <p>{tx(t, "mGs_ex2", "2. The flux of F = (x³, y³) out of the unit disk: div F = 3(x² + y²) = 3r², and ∬ 3r² · r dr dθ = 2π · 3/4 = 3π/2.")}</p>
      <p>{tx(t, "mGs_ex3", "3. A field with curl 0 on a region without holes circulates 0 round every closed curve in it: Green's theorem is the proof of the potential test of the previous chapter.")}</p>
      <p>{tx(t, "mGs_ex4", "4. Area of the triangle with corners (0, 0), (4, 0), (0, 3) by the shoelace formula: ½ |0·0 − 4·0 + 4·3 − 0·0 + 0·0 − 0·3| = 6.")}</p>

      <MathPracticeFigure t={t} set="greenStokes" />

      <H2>{tx(t, "mGs_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mGs_tWrong", "Wrong"), tx(t, "mGs_tRight", "Right"), tx(t, "mGs_tWhy", "Why")]}
        rows={[
          [tx(t, "mGs_m1w", "boundary walked clockwise"), tx(t, "mGs_m1r", "counterclockwise (region on the left)"), tx(t, "mGs_m1", "the other way gives the opposite sign")],
          [tx(t, "mGs_m2w", "curl = ∂P/∂y − ∂Q/∂x"), "∂Q/∂x − ∂P/∂y", tx(t, "mGs_m2", "the order fixes the sign of the circulation")],
          [tx(t, "mGs_m3w", "applying Green over a hole of F"), tx(t, "mGs_m3r", "F smooth on all of D"), tx(t, "mGs_m3", "the whirl gives 2π, not 0")],
          [tx(t, "mGs_m4w", "inward normal in the flux"), tx(t, "mGs_m4r", "outward normal"), tx(t, "mGs_m4", "flux counts what leaves")],
          [tx(t, "mGs_m5w", "Stokes depends on the surface"), tx(t, "mGs_m5r", "only on its rim"), tx(t, "mGs_m5", "any surface with the same boundary gives the same flux of the curl")],
        ]}
      />

      <KeyIdeas t={t} id="mGs" items={[
        "Green: ∮ P dx + Q dy round the counterclockwise edge = ∬ (∂Q/∂x − ∂P/∂y) dA over the inside.",
        "The proof: cut the region into cells; inner edges cancel; each cell gives curl × area.",
        "Area = ½ ∮ x dy − y dx: an area from its boundary (ellipse πab, shoelace formula for polygons).",
        "Divergence theorem: outflow through the boundary = ∬ div F dA in the plane, ∭ ∇ · F dV in space.",
        "Stokes: ∮ F · dr round a rim = flux of ∇ × F through any surface with that rim, oriented by the right-hand rule.",
        "All are one idea: the integral of a derivative over a region equals an integral over its boundary; F must be smooth inside.",
      ]} />
    </Article>
  );
}
