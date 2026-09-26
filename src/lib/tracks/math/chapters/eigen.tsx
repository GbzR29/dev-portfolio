"use client";

// Linear Algebra 7: eigenvalues and eigenvectors — directions a matrix only
// stretches; examples read off the basic moves; the characteristic equation
// det(A − λI) = 0 as a quadratic; trace and determinant; real, repeated and
// complex cases; symmetric matrices; repeated application and power
// iteration; the rotation axis of a 3D rotation; uses; C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { EigenFigure } from "@/components/lesson/figures/math/EigenFigure";

const r = String.raw;

export function EigenContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mEig_intro",
          "A matrix usually turns vectors as well as stretching them. But most matrices have a few special directions where they do not turn anything: a vector pointing that way comes out pointing the same way (or exactly backwards), only longer or shorter. These are the eigenvectors, and the stretch factors are the eigenvalues (from the German eigen, \"own\": the matrix's own directions). They reveal what a matrix really does, predict what happens when it is applied over and over, and find the axis of any 3D rotation.")}
      </Lead>

      <H2>{tx(t, "mEig_defTitle", "The definition")}</H2>
      <p>
        {tx(t, "mEig_defBody",
          "A non-zero vector v is an eigenvector of the square matrix A if A just scales it: Av = λv for some number λ (the Greek letter lambda), which is the eigenvalue belonging to v. If λ = 2, v comes out twice as long; if λ = 0.5, half as long; if λ = −1, the same length but reversed; if λ = 0, it is squashed to nothing. Any multiple of an eigenvector is also one (A(kv) = kAv = kλv = λ(kv)), so what really matters is the line through the origin in that direction, the eigen-direction. The zero vector is excluded, since A0 = λ0 for every λ and would tell us nothing.")}
      </p>
      <Equation label={tx(t, "mEig_eqDef", "Eigenvector and eigenvalue")}
        where={[
          [r`A`, tx(t, "mEig_wA", "a square matrix (2 × 2, 3 × 3, …): input and output must have the same size to compare directions")],
          [r`\mathbf{v} \neq \mathbf{0}`, tx(t, "mEig_wV", "the eigenvector: a direction the matrix does not turn")],
          [r`\lambda`, tx(t, "mEig_wL", "the eigenvalue: the stretch factor along that direction (negative means flipped)")],
        ]}>
        {r`A\mathbf{v} = \lambda\mathbf{v}`}
      </Equation>

      <H2>{tx(t, "mEig_seeTitle", "Seeing them in the basic moves")}</H2>
      <p>
        {tx(t, "mEig_seeBody",
          "For the moves of the matrices chapter you can find the eigenvectors just by thinking about which directions are left alone.")}
      </p>
      <LessonTable
        headers={[tx(t, "mEig_tMove", "Matrix"), tx(t, "mEig_tVec", "Eigen-directions"), tx(t, "mEig_tVal", "Eigenvalues")]}
        rows={[
          [tx(t, "mEig_sScale", "scale [sx 0; 0 sy]"), tx(t, "mEig_sScaleV", "the x-axis and the y-axis"), "sx, sy"],
          [tx(t, "mEig_sFlip", "mirror in the y-axis"), tx(t, "mEig_sFlipV", "x-axis (flipped), y-axis (kept)"), "−1, 1"],
          [tx(t, "mEig_sProj", "flatten onto the x-axis"), tx(t, "mEig_sProjV", "x-axis (kept), y-axis (crushed)"), "1, 0"],
          [tx(t, "mEig_sShear", "shear [1 k; 0 1]"), tx(t, "mEig_sShearV", "only the x-axis"), tx(t, "mEig_sShearL", "1 (twice)")],
          [tx(t, "mEig_sRot", "rotation by 40°"), tx(t, "mEig_sRotV", "none: every direction turns"), tx(t, "mEig_sRotL", "no real ones")],
          [tx(t, "mEig_sId", "identity, or kI"), tx(t, "mEig_sIdV", "every direction"), "1 (or k)"],
        ]}
      />

      <EigenFigure t={t} />

      <H2>{tx(t, "mEig_findTitle", "Finding them: det(A − λI) = 0")}</H2>
      <p>
        {tx(t, "mEig_findBody",
          "Move everything in Av = λv to one side. Since λv = λIv, it becomes (A − λI)v = 0: the matrix A − λI (A with λ subtracted from each diagonal entry) sends the non-zero vector v to 0. A matrix that sends a non-zero vector to 0 squashes the plane, so its determinant must be 0. That gives an equation with only λ in it, the characteristic equation. For a 2 × 2 matrix, expanding the determinant gives a quadratic in λ, solved with the quadratic formula.")}
      </p>
      <Equation label={tx(t, "mEig_eqChar", "The characteristic equation of a 2 × 2 matrix")}
        where={[
          [r`A - \lambda I`, tx(t, "mEig_wAL", "A with λ subtracted from a and d")],
          [r`\operatorname{tr} A = a + d`, tx(t, "mEig_wTr", "the trace: the sum of the diagonal entries")],
          [r`\det A = ad - bc`, tx(t, "mEig_wDet", "the determinant")],
          [r`\lambda_{1,2}`, tx(t, "mEig_wRoots", "the two roots: the eigenvalues")],
        ]}
        note={tx(t, "mEig_charNote", "(a − λ)(d − λ) − bc expands to λ² − aλ − dλ + ad − bc, which is λ² − (a + d)λ + (ad − bc). The quadratic formula with coefficients 1, −tr and det gives the roots.")}>
        {r`\det\begin{bmatrix} a - \lambda & b \\ c & d - \lambda \end{bmatrix} = \lambda^2 - (\operatorname{tr} A)\,\lambda + \det A = 0 \quad\Rightarrow\quad \lambda = \frac{\operatorname{tr} A \pm \sqrt{(\operatorname{tr} A)^2 - 4\det A}}{2}`}
      </Equation>
      <p>
        {tx(t, "mEig_vecBody",
          "Once λ is known, the eigenvector is any non-zero solution of (A − λI)v = 0. Because the determinant is 0, the two rows of A − λI are multiples of each other, so there is really only one equation, (a − λ)x + by = 0. Any vector perpendicular to the row (a − λ, b) solves it, for example v = (b, λ − a), or (λ − d, c) if that first one comes out as (0, 0).")}
      </p>

      <H3>{tx(t, "mEig_exTitle", "A full example")}</H3>
      <p>
        {tx(t, "mEig_exBody",
          "A = [[2, 1], [1, 2]]. tr = 4, det = 4 − 1 = 3, so λ² − 4λ + 3 = 0, which factors as (λ − 3)(λ − 1) = 0: λ₁ = 3, λ₂ = 1. For λ = 3: A − 3I = [[−1, 1], [1, −1]], and v = (1, 3 − 2) = (1, 1). Check: A(1, 1) = (3, 3) = 3·(1, 1). ✓ For λ = 1: v = (1, 1 − 2) = (1, −1). Check: A(1, −1) = (1, −1). ✓ So this matrix stretches the diagonal direction by 3 and leaves the other diagonal alone: seen along its own axes, it is just a scale.")}
      </p>

      <H3>{tx(t, "mEig_vietaTitle", "Two quick checks: trace and determinant")}</H3>
      <p>
        {tx(t, "mEig_vietaBody",
          "For any quadratic λ² − sλ + p with roots λ₁ and λ₂, the roots add to s and multiply to p (expand (λ − λ₁)(λ − λ₂) to see it). So the eigenvalues add up to the trace and multiply to the determinant. In the example: 3 + 1 = 4 = tr and 3 · 1 = 3 = det. The second fact has a geometric meaning: stretching by 3 in one direction and by 1 in another scales area by 3, which is what the determinant measures.")}
      </p>
      <Equation label={tx(t, "mEig_eqVieta", "Eigenvalues, trace and determinant")}
        where={[
          [r`\lambda_1 + \lambda_2`, tx(t, "mEig_wSum", "equals the trace a + d")],
          [r`\lambda_1\lambda_2`, tx(t, "mEig_wProd", "equals the determinant: the area factor is the product of the stretches")],
        ]}>
        {r`\lambda_1 + \lambda_2 = \operatorname{tr} A \qquad \lambda_1\lambda_2 = \det A`}
      </Equation>

      <H2>{tx(t, "mEig_casesTitle", "Three possible outcomes")}</H2>
      <p>
        {tx(t, "mEig_casesBody",
          "The number under the square root, (tr A)² − 4 det A, is the discriminant from the quadratics chapter, and it decides the outcome. Positive: two different real eigenvalues and two eigen-directions (the symmetric and general matrices in the figure). Zero: one repeated eigenvalue; there may be a whole plane of eigenvectors (kI) or only one line (the shear). Negative: no real solutions, so no direction survives unturned. That is the rotation. For rotation by θ, tr = 2 cos θ and det = 1, and the formula gives λ = cos θ ± √(cos² θ − 1) = cos θ ± √(−sin² θ). The square root of a negative number is not a real number, which is exactly where the next chapter, complex numbers, begins.")}
      </p>

      <H2>{tx(t, "mEig_symTitle", "Symmetric matrices: always perpendicular axes")}</H2>
      <p>
        {tx(t, "mEig_symBody",
          "A matrix equal to its own transpose (b = c in the 2 × 2 case) is symmetric. Symmetric matrices are the best-behaved of all: their eigenvalues are always real and their eigenvectors are always perpendicular (the spectral theorem). For 2 × 2 you can check the first claim: the discriminant is (a + d)² − 4(ad − b²) = (a − d)² + 4b², a sum of squares, never negative. Geometrically, a symmetric matrix is a stretch along two perpendicular axes, possibly different amounts along each, and it turns the unit circle into an ellipse whose axes are the eigenvectors and whose half-lengths are |λ₁| and |λ₂|. Symmetric matrices show up whenever something is measured in pairs of directions: the inertia of a rigid body, the spread of a cloud of points, the curvature of a surface.")}
      </p>

      <H2>{tx(t, "mEig_powerTitle", "Applying a matrix again and again")}</H2>
      <p>
        {tx(t, "mEig_powerBody",
          "Eigenvectors make repeated application easy. If v₁ and v₂ are eigenvectors, any vector can be written as x = c₁v₁ + c₂v₂. Then Ax = c₁λ₁v₁ + c₂λ₂v₂, and after n applications Aⁿx = c₁λ₁ⁿv₁ + c₂λ₂ⁿv₂. Each part is simply multiplied by its own eigenvalue n times. The part with the larger |λ| grows faster and soon dominates, so Aⁿx lines up with that eigenvector. This is power iteration, the figure's second mode, and it also tells you whether a repeated process settles or explodes: if every |λ| < 1 everything shrinks to 0, if any |λ| > 1 it blows up.")}
      </p>
      <Equation label={tx(t, "mEig_eqPower", "Repeated application along the eigenvectors")}
        where={[
          [r`c_1, c_2`, tx(t, "mEig_wC", "how much of each eigenvector the starting vector contains")],
          [r`\lambda_1^n, \lambda_2^n`, tx(t, "mEig_wLn", "each part is scaled by its eigenvalue once per step")],
        ]}
        note={tx(t, "mEig_fibNote", "Example: the Fibonacci step (F(n+1), F(n)) → (F(n+1) + F(n), F(n+1)) is the matrix [[1, 1], [1, 0]]. Its eigenvalues solve λ² − λ − 1 = 0: λ = (1 ± √5)/2 ≈ 1.618 and −0.618. The second shrinks away, so Fibonacci numbers grow by a factor of 1.618, the golden ratio, per step, as the sequences chapter observed.")}>
        {r`A^n(c_1\mathbf{v}_1 + c_2\mathbf{v}_2) = c_1\lambda_1^n\,\mathbf{v}_1 + c_2\lambda_2^n\,\mathbf{v}_2`}
      </Equation>
      <Callout type="tip" t={t}>
        {tx(t, "mEig_stabTip", "This is also why some physics simulations blow up. One step of a simple integrator is a matrix applied to (position, velocity). If a spring is stiff or the time step too big, that matrix gets an eigenvalue larger than 1 in size, and every frame multiplies the error by it. The Calculus section returns to this when it covers numerical integration.")}
      </Callout>

      <H2>{tx(t, "mEig_3dTitle", "In 3D: the axis of a rotation")}</H2>
      <p>
        {tx(t, "mEig_3dBody",
          "For a 3 × 3 matrix, det(A − λI) = 0 is a cubic equation. A cubic always has at least one real root (its graph must cross the axis, going from −∞ to +∞), so a 3 × 3 matrix always has at least one real eigenvector. For a rotation that eigenvector has λ = 1: it is the line the rotation leaves exactly in place, the axis of rotation. This proves Euler's rotation theorem: every 3D rotation, however it was built, is a single turn about one axis. The quaternions chapter is built on that fact.")}
      </p>

      <H2>{tx(t, "mEig_usesTitle", "Where eigenvectors are used")}</H2>
      <p>
        {tx(t, "mEig_usesBody",
          "Tight bounding boxes: the covariance matrix of a mesh's vertices (a symmetric matrix measuring how the points spread in each pair of directions) has eigenvectors along the directions of greatest and least spread; a box aligned to them fits a rotated object far better than an axis-aligned one. This is principal component analysis (PCA), also used to compress data and in machine learning. Rigid-body physics: the inertia tensor's eigenvectors are the principal axes a body spins about smoothly. Vibration: the eigenvectors of a system of springs are its modes, the shapes in which it can wobble. And Google's original PageRank was the dominant eigenvector of the web's link matrix, found by power iteration.")}
      </p>

      <H2>{tx(t, "mEig_moreTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mEig_ex1",
          "1. A = [[4, 1], [2, 3]]. tr = 7, det = 12 − 2 = 10, λ² − 7λ + 10 = (λ − 5)(λ − 2). λ = 5: v = (1, 5 − 4) = (1, 1); A(1, 1) = (5, 5) ✓. λ = 2: v = (1, 2 − 4) = (1, −2); A(1, −2) = (2, −4) ✓.")}
      </p>
      <p>
        {tx(t, "mEig_ex2",
          "2. A = [[0, −1], [1, 0]] (a quarter turn). tr = 0, det = 1, λ² + 1 = 0. No real solutions: a quarter turn changes every direction. In the next chapter λ = ±i.")}
      </p>
      <p>
        {tx(t, "mEig_ex3",
          "3. A = [[3, 0], [0, 3]] = 3I. λ² − 6λ + 9 = (λ − 3)², one repeated eigenvalue 3, and every vector is an eigenvector: a uniform scale turns nothing.")}
      </p>

      <H2>{tx(t, "mEig_codeTitle", "Eigenvalues in C++")}</H2>
      <p>
        {tx(t, "mEig_codeBody",
          "eigen2 solves the characteristic quadratic and reports whether the roots are real. powerIteration finds the dominant eigenvector of any matrix by applying it repeatedly and renormalising, then reads the eigenvalue as v · Av (for a unit v with Av = λv, v · Av = λ).")}
      </p>
      <CodeBlock lang="cpp" filename="eigen2.hpp" t={t}>{`#include <cmath>

struct Vec2 { float x, y; };
struct Mat2 { float a, b, c, d; };                  // [a b; c d]

Vec2 mul(Mat2 m, Vec2 v) { return { m.a * v.x + m.b * v.y, m.c * v.x + m.d * v.y }; }

// Roots of  l^2 - tr*l + det = 0. Returns false if they are complex.
bool eigen2(Mat2 m, float& l1, float& l2) {
    float tr = m.a + m.d, det = m.a * m.d - m.b * m.c;
    float disc = tr * tr - 4 * det;
    if (disc < 0) return false;                      // a rotation-like matrix
    float s = std::sqrt(disc);
    l1 = (tr + s) / 2;  l2 = (tr - s) / 2;
    return true;
}

// Eigenvector for a known eigenvalue l: perpendicular to a row of (A - l I)
Vec2 eigvec(Mat2 m, float l) {
    Vec2 v = { m.b, l - m.a };
    if (std::abs(v.x) + std::abs(v.y) < 1e-6f) v = { l - m.d, m.c };
    if (std::abs(v.x) + std::abs(v.y) < 1e-6f) v = { 1, 0 };   // A = l I
    float n = std::sqrt(v.x * v.x + v.y * v.y);
    return { v.x / n, v.y / n };
}

// Dominant eigenvector by repeated application; lambda = v . Av
Vec2 powerIteration(Mat2 m, float& lambda, int steps = 50) {
    Vec2 v = { 1, 0.3f };                            // any start not on the other eigenvector
    for (int i = 0; i < steps; ++i) {
        Vec2 w = mul(m, v);
        float n = std::sqrt(w.x * w.x + w.y * w.y);
        v = { w.x / n, w.y / n };
    }
    Vec2 w = mul(m, v);
    lambda = v.x * w.x + v.y * w.y;
    return v;
}`}</CodeBlock>

      <H2>{tx(t, "mEig_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mEig_tWrong", "Wrong"), tx(t, "mEig_tRight", "Right"), tx(t, "mEig_tWhy", "Why")]}
        rows={[
          [tx(t, "mEig_m1w", "v = 0 as an eigenvector"), tx(t, "mEig_m1r", "v must be non-zero"), tx(t, "mEig_m1", "A0 = λ0 for every λ, so it says nothing")],
          ["det(A) − λ = 0", "det(A − λI) = 0", tx(t, "mEig_m2", "λ is subtracted from each diagonal entry before taking the determinant")],
          [tx(t, "mEig_m3w", "expecting every matrix to have real eigenvectors"), tx(t, "mEig_m3r", "check the discriminant"), tx(t, "mEig_m3", "rotations turn every direction")],
          [tx(t, "mEig_m4w", "eigenvalues of A + B = sums of eigenvalues"), tx(t, "mEig_m4r", "not in general"), tx(t, "mEig_m4", "A and B usually have different eigenvectors")],
          [tx(t, "mEig_m5w", "power iteration on a matrix with |λ₁| = |λ₂|"), tx(t, "mEig_m5r", "it never settles"), tx(t, "mEig_m5", "neither part outgrows the other (mirror, rotation)")],
        ]}
      />

      <KeyIdeas t={t} id="mEig" items={[
        "Av = λv: an eigenvector is a direction A does not turn; λ is the stretch along it.",
        "Find λ from det(A − λI) = 0; for 2 × 2 that is λ² − (tr A)λ + det A = 0.",
        "The eigenvalues add to the trace and multiply to the determinant.",
        "Negative discriminant: no real eigenvectors, as for rotations.",
        "Symmetric matrices have real eigenvalues and perpendicular eigenvectors.",
        "Aⁿ multiplies each eigen-part by λⁿ: the largest |λ| dominates and decides stability.",
        "Every 3D rotation has an eigenvector with λ = 1: its axis.",
      ]} />
    </Article>
  );
}
