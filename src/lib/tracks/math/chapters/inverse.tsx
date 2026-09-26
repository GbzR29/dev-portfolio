"use client";

// Linear Algebra 6: inverse matrices and linear systems — undoing a matrix,
// the inverses of the basic moves, the 2 × 2 formula, (AB)⁻¹ = B⁻¹A⁻¹,
// rotations (inverse = transpose), systems as Ax = b, Gaussian and
// Gauss–Jordan elimination with pivoting, change of basis (world ↔ local,
// the view matrix), ill-conditioning, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { InverseFigure } from "@/components/lesson/figures/math/InverseFigure";

const r = String.raw;

export function InverseContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mInv_intro",
          "A matrix moves points. Very often you need to go back: from a point on screen to the point in the world it came from, from the world into a character's own space, from the effect to the cause. The matrix that undoes another is its inverse. Finding it is the same problem as solving a system of linear equations, the problem of the systems chapter, now with any number of unknowns. This chapter covers both, and the elimination method that solves them.")}
      </Lead>

      <H2>{tx(t, "mInv_whatTitle", "What an inverse is")}</H2>
      <p>
        {tx(t, "mInv_whatBody",
          "The inverse of A, written A⁻¹ (\"A inverse\"), is the matrix that undoes A: apply A and then A⁻¹ and every point is back where it started. In symbols, A⁻¹A = I, the identity, and also AA⁻¹ = I (undoing and then redoing also changes nothing). The −1 is borrowed from numbers, where 5⁻¹ = 1/5 undoes multiplication by 5; but there is no dividing by a matrix, only multiplying by its inverse.")}
      </p>
      <p>
        {tx(t, "mInv_existBody",
          "Not every matrix has one. The determinant chapter showed that det A = 0 squashes the plane onto a line or a point, sending many points to the same place. No matrix can then tell which of them to send back, so there is no inverse. A matrix with det A = 0 is called singular; one with det A ≠ 0 is invertible, and its inverse is unique.")}
      </p>

      <H2>{tx(t, "mInv_basicTitle", "Undoing the basic moves")}</H2>
      <p>
        {tx(t, "mInv_basicBody",
          "For the moves of the matrices chapter you can find the inverse without any formula, just by asking what undoes the move.")}
      </p>
      <LessonTable
        headers={[tx(t, "mInv_tMove", "Move"), tx(t, "mInv_tUndo", "Undo"), tx(t, "mInv_tInv", "Inverse matrix")]}
        rows={[
          [tx(t, "mInv_bRot", "rotate by θ"), tx(t, "mInv_bRotU", "rotate by −θ"), "[cos θ  sin θ; −sin θ  cos θ]"],
          [tx(t, "mInv_bScale", "scale by sx, sy"), tx(t, "mInv_bScaleU", "scale by 1/sx, 1/sy"), "[1/sx 0; 0 1/sy]"],
          [tx(t, "mInv_bShear", "shear by k"), tx(t, "mInv_bShearU", "shear by −k"), "[1 −k; 0 1]"],
          [tx(t, "mInv_bFlip", "mirror"), tx(t, "mInv_bFlipU", "mirror again"), tx(t, "mInv_bFlipI", "itself")],
          [tx(t, "mInv_bProj", "flatten onto a line"), tx(t, "mInv_bProjU", "impossible: heights are lost"), tx(t, "mInv_bProjI", "none (det = 0)")],
        ]}
      />

      <H2>{tx(t, "mInv_formulaTitle", "The 2 × 2 formula")}</H2>
      <p>
        {tx(t, "mInv_formulaBody",
          "For a general 2 × 2 matrix there is a short recipe: swap the two diagonal entries a and d, change the signs of b and c, and divide everything by the determinant. To see why, multiply [[d, −b], [−c, a]] by [[a, b], [c, d]]: the top-left entry is da − bc, the top-right db − bd = 0, the bottom-left −ca + ac = 0, the bottom-right −cb + ad. That is (ad − bc) times the identity. Dividing by ad − bc leaves exactly I. The division is only possible when det ≠ 0, as expected.")}
      </p>
      <Equation label={tx(t, "mInv_eq2", "Inverse of a 2 × 2 matrix")}
        where={[
          [r`ad - bc`, tx(t, "mInv_wDet", "the determinant; the inverse exists only if it is not 0")],
          [r`d,\ a`, tx(t, "mInv_wSwap", "the diagonal entries, swapped")],
          [r`-b,\ -c`, tx(t, "mInv_wNeg", "the other two entries, with their signs flipped")],
        ]}
        note={tx(t, "mInv_eq2Note", "Example: A = [[3, 1], [4, 2]], det = 6 − 4 = 2, A⁻¹ = ½[[2, −1], [−4, 3]] = [[1, −0.5], [−2, 1.5]]. Check the first column of A⁻¹A: (1·3 − 0.5·4, −2·3 + 1.5·4) = (1, 0). ✓")}>
        {r`\begin{bmatrix} a & b \\ c & d \end{bmatrix}^{-1} = \frac{1}{ad - bc}\begin{bmatrix} d & -b \\ -c & a \end{bmatrix}`}
      </Equation>

      <H3>{tx(t, "mInv_prodTitle", "Undoing a chain: reverse the order")}</H3>
      <p>
        {tx(t, "mInv_prodBody",
          "To undo \"put on socks, then shoes\" you take off the shoes first. Likewise, AB applies B then A, so undoing it removes A first and then B: (AB)⁻¹ = B⁻¹A⁻¹. Check: B⁻¹A⁻¹AB = B⁻¹(A⁻¹A)B = B⁻¹IB = B⁻¹B = I.")}
      </p>

      <H3>{tx(t, "mInv_orthoTitle", "Rotations: the inverse is the transpose")}</H3>
      <p>
        {tx(t, "mInv_orthoBody",
          "The columns of a rotation matrix are unit vectors at right angles to each other, because a rotation turns î and ĵ without stretching them or changing the angle between them. Now compute RᵀR: its entry (i, j) is row i of Rᵀ, which is column i of R, dotted with column j of R. Unit columns dot themselves to 1; perpendicular columns dot each other to 0. So RᵀR = I, and the inverse of a rotation is just its transpose, no division needed. Matrices like this, with orthonormal columns, are called orthogonal; they include every rotation and mirror, and inverting them costs nothing.")}
      </p>

      <H2>{tx(t, "mInv_sysTitle", "Systems of equations as Ax = b")}</H2>
      <p>
        {tx(t, "mInv_sysBody",
          "The system 3x + y = 9, 4x + 2y = 14 from the style of the systems chapter is a single matrix equation: A = [[3, 1], [4, 2]] holds the coefficients, x = (x, y) the unknowns and b = (9, 14) the right-hand sides, and the system says Ax = b. The column view gives it a picture: find how many steps along each column of A reach the point b. If A is invertible, multiply both sides by A⁻¹: x = A⁻¹b. Here A⁻¹ = [[1, −0.5], [−2, 1.5]] from the example above, so x = (9 − 7, −18 + 21) = (2, 3). Check: 3·2 + 3 = 9 and 4·2 + 2·3 = 14. ✓")}
      </p>

      <InverseFigure t={t} />

      <H2>{tx(t, "mInv_elimTitle", "Gaussian elimination")}</H2>
      <p>
        {tx(t, "mInv_elimBody",
          "For three or more unknowns, formulas become impractical. The method that works for any size is elimination, the systems chapter's method organised. Write the system as a table (the augmented matrix): one row per equation, the coefficients and then the right-hand side. Three row operations never change the solutions, because each one turns true equations into true equations and can itself be undone:")}
      </p>
      <p>
        {tx(t, "mInv_ops",
          "(1) add a multiple of one row to another row; (2) multiply a row by a number that is not 0; (3) swap two rows.")}
      </p>
      <p>
        {tx(t, "mInv_elimSteps",
          "Forward elimination: use the first row to clear the first column below it (make those entries 0), then use the second row to clear the second column below it, and so on. The entry used to clear a column is the pivot. The table is then triangular: the last equation has one unknown, the one above it two, and so on. Back substitution solves the last one and works upwards. Or continue clearing above the diagonal as well and scaling each pivot to 1 (Gauss–Jordan elimination); the right column then is the solution. The figure's second mode performs every step on a 3 × 3 system.")}
      </p>
      <Equation label={tx(t, "mInv_eqAug", "The example system and its augmented matrix")}
        where={[
          [r`[\,A \mid \mathbf{b}\,]`, tx(t, "mInv_wAug", "the coefficients with the right-hand sides attached as an extra column")],
          [r`R_2 \leftarrow R_2 + 1.5R_1`, tx(t, "mInv_wOp", "a row operation: replace row 2 by row 2 plus 1.5 times row 1, chosen so the x entry becomes 0")],
        ]}
        note={tx(t, "mInv_augNote", "After R₂ ← R₂ + 1.5R₁, R₃ ← R₃ + R₁ and R₃ ← R₃ − 4R₂ the table is triangular: 2x + y − z = 8, 0.5y + 0.5z = 1, −z = 1. Back substitution: z = −1, then 0.5y − 0.5 = 1 gives y = 3, then 2x + 3 + 1 = 8 gives x = 2.")}>
        {r`\begin{aligned} 2x + y - z &= 8 \\ -3x - y + 2z &= -11 \\ -2x + y + 2z &= -3 \end{aligned} \qquad \left[\begin{array}{rrr|r} 2 & 1 & -1 & 8 \\ -3 & -1 & 2 & -11 \\ -2 & 1 & 2 & -3 \end{array}\right]`}
      </Equation>
      <Callout type="warn" t={t}>
        {tx(t, "mInv_pivotWarn", "If a pivot is 0 you cannot divide by it: swap in a lower row whose entry in that column is not 0. If every candidate is 0, the matrix is singular. With floats, a tiny pivot is almost as bad as a zero one, because dividing by it magnifies rounding errors. Partial pivoting fixes this: before clearing each column, swap up the row whose entry in that column is largest in size.")}
      </Callout>

      <H3>{tx(t, "mInv_gjTitle", "Finding A⁻¹ by elimination")}</H3>
      <p>
        {tx(t, "mInv_gjBody",
          "Write A and the identity side by side, [A | I], and apply Gauss–Jordan until the left half is I. The right half is then A⁻¹. The reason: the row operations together amount to multiplying by some matrix E; turning A into I means EA = I, so E = A⁻¹, and the same operations turned I into EI = A⁻¹. It works for any size, where the 2 × 2 shortcut does not.")}
      </p>
      <p>
        {tx(t, "mInv_solveVsInv",
          "In code, if you only need to solve Ax = b once, eliminate on [A | b] directly; computing A⁻¹ first takes about three times the work and loses more accuracy. Computing the inverse pays off when the same matrix must be undone for many vectors, such as every vertex or every mouse click.")}
      </p>

      <H2>{tx(t, "mInv_basisTitle", "Change of basis: world and local space")}</H2>
      <p>
        {tx(t, "mInv_basisBody",
          "A character's model matrix M takes points from its own local space (where its feet are at the origin and its nose points along +z) into the world. The columns of M's linear part are the character's right, up and forward directions in world coordinates, and the translation column is its position. The inverse goes the other way: M⁻¹ takes a world point into the character's local space. Want to know if an enemy is in front of the character, and how far to the left? Transform the enemy's position by M⁻¹ and read its local z and x.")}
      </p>
      <p>
        {tx(t, "mInv_viewBody",
          "The camera is the same idea. The camera has a model matrix like any object: where it is and which way it faces. The view matrix, which every vertex goes through before projection, is the inverse of that matrix: it moves the world so the camera sits at the origin looking down its axis. For a rigid transform (rotation R plus translation t) the inverse is cheap: rotations invert by transposing, and undoing \"rotate, then move by t\" means moving back by t first, then rotating back.")}
      </p>
      <Equation label={tx(t, "mInv_eqRigid", "Inverse of a rotation plus translation")}
        where={[
          [r`R`, tx(t, "mInv_wR", "the rotation part (orthogonal, so R⁻¹ = Rᵀ)")],
          [r`\mathbf{t}`, tx(t, "mInv_wT", "the translation, the object's position")],
          [r`-R^{\mathsf T}\mathbf{t}`, tx(t, "mInv_wNewT", "the new translation: move back by t, expressed in the rotated axes")],
        ]}
        note={tx(t, "mInv_rigidNote", "Check: applying the forward transform gives Rp + t; the inverse turns that into Rᵀ(Rp + t) − Rᵀt = p. ✓ This is how look-at functions build the view matrix: the camera's right, up and forward vectors become the rows (transpose) and the position enters as −Rᵀ·position.")}>
        {r`\begin{bmatrix} R & \mathbf{t} \\ \mathbf{0}^{\mathsf T} & 1 \end{bmatrix}^{-1} = \begin{bmatrix} R^{\mathsf T} & -R^{\mathsf T}\mathbf{t} \\ \mathbf{0}^{\mathsf T} & 1 \end{bmatrix}`}
      </Equation>

      <H2>{tx(t, "mInv_condTitle", "Nearly singular matrices")}</H2>
      <p>
        {tx(t, "mInv_condBody",
          "When det A is close to 0 the inverse exists but has huge entries, since it divides by det. The columns are nearly parallel, so the warped grid is a set of long thin cells, and a tiny change in b (a rounding error, a jittery mouse) moves the solution a long way along them. Such a matrix is called ill-conditioned. In practice: compare the determinant (or the pivot) against a small tolerance rather than 0, and treat \"nearly singular\" as \"singular\" when the answer would be meaningless, like intersecting two almost parallel lines.")}
      </p>

      <H2>{tx(t, "mInv_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mInv_ex1",
          "1. Invert [[2, 0], [1, 1]]: det = 2, inverse = ½[[1, 0], [−1, 2]] = [[0.5, 0], [−0.5, 1]]. Geometric check: the matrix scales x by 2 and then shears; the inverse halves x and shears back.")}
      </p>
      <p>
        {tx(t, "mInv_ex2",
          "2. A camera at (5, 0) facing along −x (a turn of 180°) sees the world point (2, 1). Local coordinates: R = rotation by 180° = −I, so Rᵀ = −I and p_local = Rᵀ(p − t) = −(2 − 5, 1 − 0) = (3, −1). The point is 3 units ahead along the camera's own x-axis and 1 unit to its side.")}
      </p>
      <p>
        {tx(t, "mInv_ex3",
          "3. Solve x + 2y = 5, 3x + 6y = 10 with the formula: det = 6 − 6 = 0. No inverse: the first equation times 3 says 3x + 6y = 15, contradicting 10, so there is no solution at all (parallel lines).")}
      </p>

      <H2>{tx(t, "mInv_codeTitle", "Inverses and solving in C++")}</H2>
      <p>
        {tx(t, "mInv_codeBody",
          "inverse2 is the 2 × 2 formula with a tolerance check. solve3 is Gaussian elimination with partial pivoting on the augmented 3 × 4 table, followed by back substitution; the same loop works for any n.")}
      </p>
      <CodeBlock lang="cpp" filename="solve.hpp" t={t}>{`#include <cmath>
#include <array>
#include <optional>
#include <utility>

struct Mat2 { float a, b, c, d; };            // row by row: [a b; c d]

std::optional<Mat2> inverse2(Mat2 m, float eps = 1e-8f) {
    float det = m.a * m.d - m.b * m.c;
    if (std::abs(det) < eps) return std::nullopt;   // singular (or nearly)
    float k = 1.0f / det;
    return Mat2{ m.d * k, -m.b * k, -m.c * k, m.a * k };
}

// Solve A x = b for 3 unknowns. M is the augmented matrix [A | b].
std::optional<std::array<float, 3>> solve3(float M[3][4], float eps = 1e-8f) {
    for (int col = 0; col < 3; ++col) {
        // Partial pivoting: bring up the row with the largest entry
        int best = col;
        for (int r = col + 1; r < 3; ++r)
            if (std::abs(M[r][col]) > std::abs(M[best][col])) best = r;
        if (std::abs(M[best][col]) < eps) return std::nullopt;
        for (int j = 0; j < 4; ++j) std::swap(M[col][j], M[best][j]);

        // Clear the column below the pivot: R_r <- R_r - k * R_col
        for (int r = col + 1; r < 3; ++r) {
            float k = M[r][col] / M[col][col];
            for (int j = col; j < 4; ++j) M[r][j] -= k * M[col][j];
        }
    }
    // Back substitution, last unknown first
    std::array<float, 3> x{};
    for (int r = 2; r >= 0; --r) {
        float s = M[r][3];
        for (int j = r + 1; j < 3; ++j) s -= M[r][j] * x[j];
        x[r] = s / M[r][r];
    }
    return x;
}`}</CodeBlock>

      <H2>{tx(t, "mInv_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mInv_tWrong", "Wrong"), tx(t, "mInv_tRight", "Right"), tx(t, "mInv_tWhy", "Why")]}
        rows={[
          ["(AB)⁻¹ = A⁻¹B⁻¹", "(AB)⁻¹ = B⁻¹A⁻¹", tx(t, "mInv_m1", "undo the last move first")],
          ["x = b / A", "x = A⁻¹b", tx(t, "mInv_m2", "there is no matrix division; and A⁻¹ goes on the left")],
          [tx(t, "mInv_m3w", "inverting a rotation with the general formula"), tx(t, "mInv_m3r", "transpose it"), tx(t, "mInv_m3", "same result, far cheaper and more accurate")],
          [tx(t, "mInv_m4w", "forgetting to negate b and c (2 × 2)"), "[d −b; −c a] / det", tx(t, "mInv_m4", "only the diagonal is swapped; the others change sign")],
          [tx(t, "mInv_m5w", "dividing by a zero or tiny pivot"), tx(t, "mInv_m5r", "swap rows first (pivoting)"), tx(t, "mInv_m5", "a small pivot magnifies rounding errors")],
          [tx(t, "mInv_m6w", "using the model matrix as the view matrix"), tx(t, "mInv_m6r", "view = inverse of the camera's model matrix"), tx(t, "mInv_m6", "the world must move opposite to the camera")],
        ]}
      />

      <KeyIdeas t={t} id="mInv" items={[
        "A⁻¹ undoes A: A⁻¹A = AA⁻¹ = I. It exists exactly when det A ≠ 0.",
        "2 × 2: swap a and d, negate b and c, divide by ad − bc.",
        "(AB)⁻¹ = B⁻¹A⁻¹; a rotation's inverse is its transpose.",
        "A system is Ax = b; its solution is x = A⁻¹b, the recipe of columns that reaches b.",
        "Elimination with row operations and pivoting solves any size; [A | I] → [I | A⁻¹].",
        "World → local and the view matrix are inverses of model matrices.",
      ]} />
    </Article>
  );
}
