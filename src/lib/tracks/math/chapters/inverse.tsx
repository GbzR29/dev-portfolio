"use client";

// Linear Algebra 6: inverse matrices and linear systems — undoing a matrix,
// the inverses of the basic moves, the 2 × 2 formula, (AB)⁻¹ = B⁻¹A⁻¹,
// rotations (inverse = transpose), systems as Ax = b, Gaussian and
// Gauss–Jordan elimination with pivoting, change of basis (map ↔ local
// coordinates), ill-conditioning, and a 3 × 3 inverse by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { InverseFigure } from "@/components/lesson/figures/math/InverseFigure";

const r = String.raw;

export function InverseContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mInv_intro",
          "A matrix moves points. Very often you need to go back: from a point on a map back to the place on the ground, from a coded message back to the plain one, from the effect to the cause. The matrix that undoes another is its inverse. Finding it is the same problem as solving a system of linear equations, the problem of the systems chapter, now with any number of unknowns. This chapter covers both, and the elimination method that solves them.")}
      </Lead>

      <Goals t={t} id="mInv" items={[
        "Invert a 2 × 2 matrix with the formula.",
        "Solve a system Ax = b with Gaussian elimination.",
        "Convert between world and local coordinates with a change of basis.",
        "Spot a nearly singular matrix before it causes trouble.",
      ]} />

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
        {tx(t, "mInv_pivotWarn", "If a pivot is 0 you cannot divide by it: swap in a lower row whose entry in that column is not 0. If every candidate is 0, the matrix is singular. When working with rounded decimals, a tiny pivot is almost as bad as a zero one, because dividing by it magnifies the rounding errors. Partial pivoting fixes this: before clearing each column, swap up the row whose entry in that column is largest in size.")}
      </Callout>

      <H3>{tx(t, "mInv_gjTitle", "Finding A⁻¹ by elimination")}</H3>
      <p>
        {tx(t, "mInv_gjBody",
          "Write A and the identity side by side, [A | I], and apply Gauss–Jordan until the left half is I. The right half is then A⁻¹. The reason: the row operations together amount to multiplying by some matrix E; turning A into I means EA = I, so E = A⁻¹, and the same operations turned I into EI = A⁻¹. It works for any size, where the 2 × 2 shortcut does not.")}
      </p>
      <p>
        {tx(t, "mInv_solveVsInv",
          "If you only need to solve Ax = b once, eliminate on [A | b] directly; computing A⁻¹ first takes about three times the work. The inverse pays off when the same matrix must be undone for many right-hand sides: the same three mixtures combined to reach one target amount, then another, then another. Each new target then costs only one matrix–vector product.")}
      </p>

      <H2>{tx(t, "mInv_basisTitle", "Change of basis: map and local coordinates")}</H2>
      <p>
        {tx(t, "mInv_basisBody",
          "A surveyor sets up local axes on a plot of land: the origin at a corner post, the first axis along the fence, the second perpendicular to it. A matrix M (in the homogeneous form of the matrices chapter) takes local coordinates to map coordinates: the columns of its linear part are the two local axes written in map coordinates, and its translation column is the corner post. The inverse goes the other way: M⁻¹ takes a map point into local coordinates. How far along the fence does a tree stand, and how far from it? Transform the tree's map position by M⁻¹ and read the two numbers.")}
      </p>
      <p>
        {tx(t, "mInv_viewBody",
          "When the local axes are perpendicular unit vectors, M is a rigid transform, a rotation plus a translation, and nothing is stretched. For a rigid transform (rotation R plus translation t) the inverse is cheap: rotations invert by transposing, and undoing \"rotate, then move by t\" means moving back by t first, then rotating back.")}
      </p>
      <Equation label={tx(t, "mInv_eqRigid", "Inverse of a rotation plus translation")}
        where={[
          [r`R`, tx(t, "mInv_wR", "the rotation part (orthogonal, so R⁻¹ = Rᵀ)")],
          [r`\mathbf{t}`, tx(t, "mInv_wT", "the translation, the object's position")],
          [r`-R^{\mathsf T}\mathbf{t}`, tx(t, "mInv_wNewT", "the new translation: move back by t, expressed in the rotated axes")],
        ]}
        note={tx(t, "mInv_rigidNote", "Check: applying the forward transform gives Rp + t; the inverse turns that into Rᵀ(Rp + t) − Rᵀt = p. ✓ In words: the local axes become the rows of the inverse, and the corner post enters as −Rᵀt.")}>
        {r`\begin{bmatrix} R & \mathbf{t} \\ \mathbf{0}^{\mathsf T} & 1 \end{bmatrix}^{-1} = \begin{bmatrix} R^{\mathsf T} & -R^{\mathsf T}\mathbf{t} \\ \mathbf{0}^{\mathsf T} & 1 \end{bmatrix}`}
      </Equation>

      <H2>{tx(t, "mInv_condTitle", "Nearly singular matrices")}</H2>
      <p>
        {tx(t, "mInv_condBody",
          "When det A is close to 0 the inverse exists but has huge entries, since it divides by det. The columns are nearly parallel, so the warped grid is a set of long thin cells, and a tiny change in b (a rounding error, a slightly wrong measurement) moves the solution a long way along them. Such a matrix is called ill-conditioned. In practice: when det A is tiny compared with the entries, distrust the answer, and treat \"nearly singular\" as \"singular\" when the answer would be meaningless, like the crossing point of two almost parallel lines.")}
      </p>

      <H2>{tx(t, "mInv_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mInv_ex1",
          "1. Invert [[2, 0], [1, 1]]: det = 2, inverse = ½[[1, 0], [−1, 2]] = [[0.5, 0], [−0.5, 1]]. Geometric check: the matrix scales x by 2 and then shears; the inverse halves x and shears back.")}
      </p>
      <p>
        {tx(t, "mInv_ex2",
          "2. A plot's local axes are the map axes turned by 180°, with the corner post at (5, 0). A tree stands at the map point (2, 1). Local coordinates: R = rotation by 180° = −I, so Rᵀ = −I and p_local = Rᵀ(p − t) = −(2 − 5, 1 − 0) = (3, −1). The tree is 3 m along the fence and 1 m to the negative side of it.")}
      </p>
      <p>
        {tx(t, "mInv_ex3",
          "3. Solve x + 2y = 5, 3x + 6y = 10 with the formula: det = 6 − 6 = 0. No inverse: the first equation times 3 says 3x + 6y = 15, contradicting 10, so there is no solution at all (parallel lines).")}
      </p>

      <H2>{tx(t, "mInv_handTitle", "A 3 × 3 inverse by hand")}</H2>
      <p>
        {tx(t, "mInv_handBody",
          "Invert A = [[1, 0, 2], [0, 1, 0], [1, 0, 3]] with [A | I]. First check that it can be done: expanding along the middle row, det A = 1 · (1 · 3 − 2 · 1) = 1, not 0. Then clear the columns one at a time, writing down each row operation.")}
      </p>
      <LessonTable
        headers={[tx(t, "mInv_tOp", "Operation"), tx(t, "mInv_tTable", "[A | I] afterwards, row by row")]}
        rows={[
          [tx(t, "mInv_h0", "start"), "[1 0 2 | 1 0 0]   [0 1 0 | 0 1 0]   [1 0 3 | 0 0 1]"],
          ["R₃ ← R₃ − R₁", "[1 0 2 | 1 0 0]   [0 1 0 | 0 1 0]   [0 0 1 | −1 0 1]"],
          ["R₁ ← R₁ − 2R₃", "[1 0 0 | 3 0 −2]   [0 1 0 | 0 1 0]   [0 0 1 | −1 0 1]"],
        ]}
      />
      <p>
        {tx(t, "mInv_handCheck",
          "The left half is I, so A⁻¹ = [[3, 0, −2], [0, 1, 0], [−1, 0, 1]]. Check two entries of AA⁻¹: row 1 of A with column 1 of A⁻¹ is 1 · 3 + 0 + 2 · (−1) = 1 ✓, and row 3 with column 3 is 1 · (−2) + 0 + 3 · 1 = 1 ✓. Now any system with this matrix is one product away. For Ax = (4, 5, 7): x = A⁻¹(4, 5, 7) = (12 − 14, 5, −4 + 7) = (−2, 5, 3). Check the first equation: −2 + 0 + 2 · 3 = 4 ✓.")}
      </p>

      <H2>{tx(t, "mInv_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mInv_tWrong", "Wrong"), tx(t, "mInv_tRight", "Right"), tx(t, "mInv_tWhy", "Why")]}
        rows={[
          ["(AB)⁻¹ = A⁻¹B⁻¹", "(AB)⁻¹ = B⁻¹A⁻¹", tx(t, "mInv_m1", "undo the last move first")],
          ["x = b / A", "x = A⁻¹b", tx(t, "mInv_m2", "there is no matrix division; and A⁻¹ goes on the left")],
          [tx(t, "mInv_m3w", "inverting a rotation with the general formula"), tx(t, "mInv_m3r", "transpose it"), tx(t, "mInv_m3", "same result, with no arithmetic at all")],
          [tx(t, "mInv_m4w", "forgetting to negate b and c (2 × 2)"), "[d −b; −c a] / det", tx(t, "mInv_m4", "only the diagonal is swapped; the others change sign")],
          [tx(t, "mInv_m5w", "dividing by a zero or tiny pivot"), tx(t, "mInv_m5r", "swap rows first (pivoting)"), tx(t, "mInv_m5", "a small pivot magnifies rounding errors")],
          [tx(t, "mInv_m6w", "no zero entries, so A⁻¹ exists"), tx(t, "mInv_m6r", "A⁻¹ exists exactly when det A ≠ 0"), tx(t, "mInv_m6", "[[1, 2], [2, 4]] has no zeros, but det = 4 − 4 = 0")],
        ]}
      />

      <KeyIdeas t={t} id="mInv" items={[
        "A⁻¹ undoes A: A⁻¹A = AA⁻¹ = I. It exists exactly when det A ≠ 0.",
        "2 × 2: swap a and d, negate b and c, divide by ad − bc.",
        "(AB)⁻¹ = B⁻¹A⁻¹; a rotation's inverse is its transpose.",
        "A system is Ax = b; its solution is x = A⁻¹b, the recipe of columns that reaches b.",
        "Elimination with row operations and pivoting solves any size; [A | I] → [I | A⁻¹].",
        "Map → local coordinates is M⁻¹; a rigid inverse is Rᵀ with translation −Rᵀt.",
      ]} />
    </Article>
  );
}
