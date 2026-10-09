"use client";

// Linear Algebra 4: matrices — a grid of numbers as a transformation. The
// matrix–vector product (row and column views), columns as the images of the
// unit steps, a gallery of 2 × 2 maps, what "linear" means, multiplication as
// composition and why order matters, the transpose, 3 × 3 rotations, and
// homogeneous coordinates for translation, and products of any size by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MatrixFigure } from "@/components/lesson/figures/math/MatrixFigure";
import { MatrixProduct } from "@/components/lesson/MatrixProduct";
import { bmatrix, linkedProduct } from "@/components/lesson/texMatrix";

const r = String.raw;
const num = (v: number) => String(Math.round(v * 1000) / 1000).replace("-", "−");
const par = (v: number) => (v < 0 ? `(${num(v)})` : num(v));

// ── Linked matrices: point at an entry to see the row and column it comes from ──

const DEF = linkedProduct([["a", "b"], ["c", "d"]], [["x"], ["y"]], [["ax + by"], ["cx + dy"]]);
const MUL = linkedProduct([["a", "b"], ["c", "d"]], [["e", "f"], ["g", "h"]], [["ae + bg", "af + bh"], ["ce + dg", "cf + dh"]]);
const RECT = linkedProduct([[1, 2, 0], [0, 1, 3]], [[2, 1], [0, 1], [1, 0]], [[2, 3], [3, 1]]);
const BY_COLUMN = bmatrix([["a", "b"], ["c", "d"]], (c, _, j) => r`\sym{c${j}}{${c}}`);
const HOMOGENEOUS = bmatrix([["a", "b", "t_x"], ["c", "d", "t_y"], [0, 0, 1]],
  (c, i, j) => (i > 2 ? c : j < 3 ? r`\sym{lin}{${c}}` : r`\sym{t}{${c}}`));
// The axis each rotation leaves alone: its name and its 1 on the diagonal
const ROT_AXIS = (id: string, k: number, rows: string[][]) => bmatrix(rows, (c, i, j) => (i === k && j === k ? r`\sym{${id}}{${c}}` : c));

// ── Live formula: matrix × vector, both readings ──────────────────────────────

const mvNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const X = v.a * v.x + v.b * v.y, Y = v.c * v.x + v.d * v.y;
  const rows = tx(t, "mMat_liveRows", "rows"), cols = tx(t, "mMat_liveCols", "columns");
  return {
    tex: r`\begin{aligned} \text{${rows}: } &\begin{bmatrix} ${par(v.a)}\cdot ${par(v.x)} + ${par(v.b)}\cdot ${par(v.y)} \\ ${par(v.c)}\cdot ${par(v.x)} + ${par(v.d)}\cdot ${par(v.y)} \end{bmatrix} = \green{\begin{bmatrix} ${num(X)} \\ ${num(Y)} \end{bmatrix}} \\[4pt] \text{${cols}: } & ${par(v.x)}\begin{bmatrix} ${num(v.a)} \\ ${num(v.c)} \end{bmatrix} + ${par(v.y)}\begin{bmatrix} ${num(v.b)} \\ ${num(v.d)} \end{bmatrix} = \begin{bmatrix} ${num(v.a * v.x)} \\ ${num(v.c * v.x)} \end{bmatrix} + \begin{bmatrix} ${num(v.b * v.y)} \\ ${num(v.d * v.y)} \end{bmatrix} = \green{\begin{bmatrix} ${num(X)} \\ ${num(Y)} \end{bmatrix}} \end{aligned}`,
  };
};

export function MatricesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mMat_intro",
          "The transformations chapter wrote each move as its own rule, and the identities chapter found the rule for rotation by any angle. Look at those rules side by side and they all have the same shape: the new x is some amount of the old x plus some amount of the old y, and likewise for the new y. Four numbers decide everything. Written as a small grid, those four numbers are a matrix, one of the central objects of mathematics, used wherever quantities are mixed in straight proportion. This chapter builds matrices from that one observation.")}
      </Lead>

      <Goals t={t} id="mMat" items={[
        "Multiply a matrix by a vector, in two ways.",
        "Read a matrix's columns as the places where the axes land.",
        "Multiply matrices to chain transformations.",
        "Add an extra coordinate so that moving a point is a matrix too.",
      ]} />

      <H2>{tx(t, "mMat_shapeTitle", "One shape for every rule")}</H2>
      <p>
        {tx(t, "mMat_shapeBody",
          "Here are rules you already know. Scaling by 2 horizontally: x' = 2x, y' = y. Mirroring in the y-axis: x' = −x, y' = y. The quarter turn: x' = −y, y' = x. Rotation by θ: x' = cos θ · x − sin θ · y, y' = sin θ · x + cos θ · y. Each one is of the form x' = ax + by, y' = cx + dy for some numbers a, b, c, d (in the quarter turn a = 0, b = −1, c = 1, d = 0). So instead of a different formula for each move, we can store the four numbers and use one formula for all of them.")}
      </p>

      <H2>{tx(t, "mMat_whatTitle", "What a matrix is")}</H2>
      <p>
        {tx(t, "mMat_whatBody",
          "A matrix is a rectangular grid of numbers, written between square brackets. A matrix with m rows and n columns is called an m × n matrix (\"m by n\"), rows first. The number in row i and column j is the entry a_ij: a₁₂ is in the first row, second column. A vector can be written as a matrix with one column, a column vector. The four numbers of our rules become a 2 × 2 matrix, with the numbers that build x' in the first row and those that build y' in the second.")}
      </p>
      <Equation label={tx(t, "mMat_eqDef", "A 2 × 2 matrix acting on a vector")}
        where={[
          [r`A`, tx(t, "mMat_wA", "the matrix: a name for the whole grid, written as a capital letter")],
          [r`\sym{r1}{a, b}`, tx(t, "mMat_wAB", "the first row: how much old x and old y go into the new x")],
          [r`\sym{r2}{c, d}`, tx(t, "mMat_wCD", "the second row: how much old x and old y go into the new y")],
          [r`\sym{c1}{\mathbf{v} = (x, y)}`, tx(t, "mMat_wV", "the input vector, written as a column")],
          [r`A\mathbf{v}`, tx(t, "mMat_wAv", "the output: the matrix times the vector")],
        ]}
        words={tx(t, "mMat_defWords", "The new x is a times the old x plus b times the old y; the new y is c times the old x plus d times the old y. The first row builds x', the second builds y'.")}>
        {r`A\mathbf{v} = ${DEF.a}${DEF.b} = ${DEF.c}`}
      </Equation>

      <H2>{tx(t, "mMat_prodTitle", "Two ways to read matrix × vector")}</H2>
      <p>
        {tx(t, "mMat_rowView",
          "Row view: each entry of the result is one row of the matrix dotted with the vector. The first output is (a, b) · (x, y) = ax + by, the second is (c, d) · (x, y) = cx + dy. This is how you compute it by hand: one dot product per output.")}
      </p>
      <p>
        {tx(t, "mMat_colView",
          "Column view: regroup the same sum by x and y instead. The result is x times the first column (a, c) plus y times the second column (b, d). This is how you understand it: the vector's coordinates are a recipe, and the columns are the ingredients.")}
      </p>
      <Equation label={tx(t, "mMat_eqCols", "Matrix × vector as a mix of the columns")}
        where={[
          [r`\sym{c1}{(a, c)}`, tx(t, "mMat_wCol1", "the first column, scaled by x")],
          [r`\sym{c2}{(b, d)}`, tx(t, "mMat_wCol2", "the second column, scaled by y")],
        ]}
        note={tx(t, "mMat_colsNote", "Example: A = [[2, 1], [0, 3]] and v = (4, −1). Row view: (2·4 + 1·(−1), 0·4 + 3·(−1)) = (7, −3). Column view: 4·(2, 0) + (−1)·(1, 3) = (8, 0) + (−1, −3) = (7, −3). Same answer, two ways of seeing it.")}
        words={tx(t, "mMat_colsWords", "Take x copies of the first column and y copies of the second column, and add them.")}>
        {r`${BY_COLUMN}\begin{bmatrix} \sym{c1}{x} \\ \sym{c2}{y} \end{bmatrix} = \sym{c1}{x\begin{bmatrix} a \\ c \end{bmatrix}} + \sym{c2}{y\begin{bmatrix} b \\ d \end{bmatrix}}`}
      </Equation>
      <LiveFormula label={tx(t, "mMat_liveMv", "Try it: matrix × vector, read both ways")}
        tex={r`\begin{bmatrix} a & b \\ c & d \end{bmatrix}\begin{bmatrix} x \\ y \end{bmatrix} = \begin{bmatrix} ax + by \\ cx + dy \end{bmatrix} = x\begin{bmatrix} a \\ c \end{bmatrix} + y\begin{bmatrix} b \\ d \end{bmatrix}`}
        vars={[
          { id: "a", label: "a", min: -3, max: 3, step: 1, value: 2, fmt: num },
          { id: "b", label: "b", min: -3, max: 3, step: 1, value: 1, fmt: num },
          { id: "c", label: "c", min: -3, max: 3, step: 1, value: 0, fmt: num },
          { id: "d", label: "d", min: -3, max: 3, step: 1, value: 3, fmt: num },
          { id: "x", label: "x", min: -5, max: 5, step: 1, value: 4, fmt: num },
          { id: "y", label: "y", min: -5, max: 5, step: 1, value: -1, fmt: num },
        ]}
        compute={mvNumbers(t)}
        note={tx(t, "mMat_liveMvNote", "Starts on the example above. Set x = 1 and y = 0: the result is the first column. Set a = d = 0, b = −1, c = 1: the quarter turn, (x, y) → (−y, x).")} />

      <H2>{tx(t, "mMat_colsTitle", "The columns are where the axes land")}</H2>
      <p>
        {tx(t, "mMat_colsBody",
          "Put v = (1, 0) into the column view: the result is 1 · (a, c) + 0 · (b, d) = (a, c), the first column. Put in (0, 1) and you get the second column. So the columns of a matrix are simply where the two unit steps î = (1, 0) and ĵ = (0, 1) end up. The vectors chapter showed that every vector is x î + y ĵ; the matrix sends it to x (new î) + y (new ĵ). Knowing where two arrows go tells you where every point goes. This is the single most useful fact about matrices: to build a matrix, ask where the axes should land and write those two vectors as the columns.")}
      </p>

      <MatrixFigure t={t} />

      <H3>{tx(t, "mMat_galleryTitle", "A gallery of 2 × 2 matrices")}</H3>
      <p>
        {tx(t, "mMat_galleryBody",
          "Each matrix below was built by asking where î and ĵ go. Rotation sends î to (cos θ, sin θ) and ĵ to (−sin θ, cos θ), as the identities chapter found; those are its columns.")}
      </p>
      <LessonTable
        headers={[tx(t, "mMat_tMove", "Move"), tx(t, "mMat_tMatrix", "Matrix [row 1; row 2]"), tx(t, "mMat_tWhy", "Where î and ĵ go")]}
        rows={[
          [tx(t, "mMat_gId", "identity (do nothing)"), "[1 0; 0 1]", tx(t, "mMat_gIdW", "they stay put; written I")],
          [tx(t, "mMat_gScale", "scale by sx, sy"), "[sx 0; 0 sy]", tx(t, "mMat_gScaleW", "î stretched to (sx, 0), ĵ to (0, sy)")],
          [tx(t, "mMat_gRot", "rotate by θ"), "[cos θ  −sin θ; sin θ  cos θ]", tx(t, "mMat_gRotW", "both turn by θ")],
          [tx(t, "mMat_gShear", "shear along x"), "[1 k; 0 1]", tx(t, "mMat_gShearW", "î stays, ĵ leans over to (k, 1)")],
          [tx(t, "mMat_gFlip", "mirror in the y-axis"), "[−1 0; 0 1]", tx(t, "mMat_gFlipW", "î flips to (−1, 0), ĵ stays")],
          [tx(t, "mMat_gProj", "flatten onto the x-axis"), "[1 0; 0 0]", tx(t, "mMat_gProjW", "î stays, ĵ collapses to (0, 0)")],
        ]}
      />

      <H2>{tx(t, "mMat_linearTitle", "What \"linear\" means")}</H2>
      <p>
        {tx(t, "mMat_linearBody",
          "A transformation that a matrix can do is called a linear map. It obeys two rules: transforming a sum gives the sum of the transformed parts, A(u + v) = Au + Av, and transforming a scaled vector gives the scaled result, A(kv) = k(Av). Both follow from the formula (expand a(x₁ + x₂) + b(y₁ + y₂) and regroup). Geometrically they mean: straight lines stay straight, parallel lines stay parallel, evenly spaced points stay evenly spaced, and the origin stays at the origin, since A(0, 0) = (0, 0). The figure's warped grid shows all four.")}
      </p>
      <Derivation t={t} label={tx(t, "mMat_eqLin", "Why a matrix respects sums")}
        steps={[
          { tex: r`A(\mathbf u + \mathbf v)\ \text{(first entry)}` },
          { tex: r`= a(x_1 + x_2) + b(y_1 + y_2)`, why: tx(t, "mMat_l1", "u + v = (x₁ + x₂, y₁ + y₂); the first row of A builds the new x from it") },
          { tex: r`= (a x_1 + b y_1) + (a x_2 + b y_2)`, why: tx(t, "mMat_l2", "multiply out the brackets and regroup the terms of u and of v") },
          { tex: r`= \green{(A\mathbf u)_1 + (A\mathbf v)_1}`, why: tx(t, "mMat_l3", "each bracket is the first entry of A applied to one vector; the second entry works the same way with c and d") },
        ]} />
      <Callout type="info" t={t}>
        {tx(t, "mMat_transNote", "Translation, moving everything by (3, 2), is not linear: it moves the origin, and no a, b, c, d can do that, because ax + by with x = y = 0 is always 0. The last section of this chapter shows the standard trick that lets matrices translate anyway.")}
      </Callout>

      <H2>{tx(t, "mMat_mulTitle", "Multiplying matrices: one move after another")}</H2>
      <p>
        {tx(t, "mMat_mulBody",
          "Apply B to v, then apply A to the result: A(Bv). Is there one matrix that does both at once? Use the columns rule: find where î and ĵ end up. î goes to B's first column, and then A sends that to A times B's first column. Likewise for ĵ. So the combined matrix, written AB, has as its columns A times each column of B. Computing each entry, the entry in row i, column j of AB is row i of A dotted with column j of B.")}
      </p>
      <Equation label={tx(t, "mMat_eqMul", "The product of two 2 × 2 matrices")}
        where={[
          [r`AB`, tx(t, "mMat_wAB2", "the matrix that applies B first, then A")],
          [r`(AB)_{ij}`, tx(t, "mMat_wIJ", "the entry in row i, column j: row i of A dotted with column j of B")],
          [r`\sym{e21}{ce + dg}`, tx(t, "mMat_wE21", "one entry, (AB)₂₁: row 2 of A, (c, d), dotted with column 1 of B, (e, g). Point at any other entry to see its row and its column")],
        ]}
        words={tx(t, "mMat_mulWords", "Each entry of the product is a row of the left matrix dotted with a column of the right matrix, taken where that row and that column cross.")}
        note={tx(t, "mMat_mulNote", "Example: A = [[0, −1], [1, 0]] (quarter turn), B = [[2, 0], [0, 1]] (stretch x). AB: row 1 of A (0, −1) with column 1 of B (2, 0) gives 0; with column 2 (0, 1) gives −1; row 2 (1, 0) gives 2 and 0. AB = [[0, −1], [2, 0]]. BA = [[0, −2], [1, 0]]. Different: stretching and then turning is not the same as turning and then stretching.")}>
        {r`${MUL.a}${MUL.b} = ${MUL.c}`}
      </Equation>
      <MatrixProduct t={t} label={tx(t, "mMat_liveMul", "Try it: a product, one entry at a time")}
        presets={[
          { name: tx(t, "mMat_pTurnStretch", "turn · stretch"), A: [[0, -1], [1, 0]], B: [[2, 0], [0, 1]] },
          { name: tx(t, "mMat_pMirrorShear", "mirror · shear"), A: [[-1, 0], [0, 1]], B: [[1, 1], [0, 1]], names: ["F", "S"] },
          { name: "2 × 3 · 3 × 2", A: [[1, 2, 0], [0, 1, 3]], B: [[2, 1], [0, 1], [1, 0]] },
          { name: tx(t, "mMat_pShop", "shopping"), A: [[2, 1, 0], [1, 2, 3]], B: [[3, 2], [4, 5], [1, 1]], names: ["Q", "P"] },
        ]}
        note={tx(t, "mMat_liveMulNote", "Starts on the example above: a quarter turn after a stretch. Play it to the end, then press ⇄ BA: the same two matrices in the other order give a different product. The other presets are the worked examples further down. Type any number in A or B, and click an entry of the product to see how it is made.")} />
      <p>
        {tx(t, "mMat_orderBody",
          "Three rules come with it. Order matters: AB is usually not BA (the figure's second mode shows a turn and a shear disagreeing). The matrix written last is applied first, because (AB)v = A(Bv): read a product right to left. Grouping does not matter: (AB)C = A(BC), so a long chain can be multiplied out once and then applied to every point. And the identity I changes nothing: AI = IA = A. Sizes must fit: an m × n matrix can multiply an n × p one (the rows of the first are as long as the columns of the second), giving an m × p result.")}
      </p>

      <H2>{tx(t, "mMat_tTitle", "The transpose")}</H2>
      <p>
        {tx(t, "mMat_tBody",
          "The transpose Aᵀ swaps rows and columns: the entry in row i, column j moves to row j, column i, so the first row becomes the first column. A column vector transposed is a row vector, and the dot product can be written as a matrix product: u · v = uᵀv (a 1 × n row times an n × 1 column is a 1 × 1 matrix, one number). Transposing a product reverses it: (AB)ᵀ = BᵀAᵀ. The inverse chapter will show that for a rotation, the transpose is also the undo.")}
      </p>

      <H2>{tx(t, "mMat_3dTitle", "3 × 3 matrices and 3D")}</H2>
      <p>
        {tx(t, "mMat_3dBody",
          "Nothing changes in 3D except the size. A 3 × 3 matrix has three columns: where the unit steps along x, y and z land. Rotating about the z-axis turns x and y exactly as in 2D and leaves z alone, so its matrix is the 2D rotation with an extra row and column of the identity. Rotations about x and y are built the same way: the axis of rotation is the column that stays (1, 0, 0) or (0, 1, 0), and the other two turn.")}
      </p>
      <Equation label={tx(t, "mMat_eqRot3", "Rotations about the three axes")}
        where={[
          [r`\sym{rz}{R_z(\theta)}`, tx(t, "mMat_wRz", "turns x toward y; z is untouched (third column and row are those of I)")],
          [r`\sym{rx}{R_x(\theta)}`, tx(t, "mMat_wRx", "turns y toward z; x is untouched")],
          [r`\sym{ry}{R_y(\theta)}`, tx(t, "mMat_wRy", "turns z toward x; y is untouched. The sign of sin looks swapped only because z → x is the anticlockwise order seen from +y")],
        ]}
        words={tx(t, "mMat_rot3Words", "Each one is the 2D rotation placed on the two axes that turn, with a 1 on the axis that stays put and zeros beside it.")}>
        {r`\sym{rz}{R_z} = ${ROT_AXIS("rz", 3, [[r`\cos\theta`, r`-\sin\theta`, "0"], [r`\sin\theta`, r`\cos\theta`, "0"], ["0", "0", "1"]])} \quad \sym{rx}{R_x} = ${ROT_AXIS("rx", 1, [["1", "0", "0"], ["0", r`\cos\theta`, r`-\sin\theta`], ["0", r`\sin\theta`, r`\cos\theta`]])} \quad \sym{ry}{R_y} = ${ROT_AXIS("ry", 2, [[r`\cos\theta`, "0", r`\sin\theta`], ["0", "1", "0"], [r`-\sin\theta`, "0", r`\cos\theta`]])}`}
      </Equation>

      <H2>{tx(t, "mMat_homTitle", "Translation with one extra coordinate")}</H2>
      <p>
        {tx(t, "mMat_homBody",
          "Here is the trick. Give every 2D point a third coordinate that is always 1: (x, y) becomes (x, y, 1). Now use a 3 × 3 matrix whose last column holds the offset (tx, ty). Multiplying out, the new x is 1·x + 0·y + tx·1 = x + tx: the constant 1 picks up the offset. The 2 × 2 corner of the matrix can still rotate, scale and shear, so a single 3 × 3 matrix does any of those plus a translation. These are homogeneous coordinates. In 3D the same trick uses 4 × 4 matrices and points (x, y, z, 1), which is why 4 × 4 matrices are the standard way to describe where an object sits and how it is turned in space, from robotics to surveying.")}
      </p>
      <Equation label={tx(t, "mMat_eqHom", "A 2D rotation or scale plus a translation, as one 3 × 3 matrix")}
        where={[
          [r`\sym{lin}{\begin{bmatrix} a & b \\ c & d \end{bmatrix}}`, tx(t, "mMat_wCorner", "the linear part: rotate, scale, shear")],
          [r`\sym{t}{(t_x, t_y)}`, tx(t, "mMat_wT", "the translation, in the last column")],
          [r`\sym{w}{w}`, tx(t, "mMat_wW", "the extra coordinate: 1 for a point, 0 for a direction")],
        ]}
        words={tx(t, "mMat_homWords", "The corner of the matrix turns, scales or shears as before; the last column adds the offset, multiplied by w, so points (w = 1) are moved and directions (w = 0) are not.")}
        note={tx(t, "mMat_homNote", "With w = 0 the offset is multiplied by 0 and ignored. That is exactly right for directions: carrying a compass to another town does not change which way north is. So points get w = 1 and vectors w = 0, the distinction from the vectors chapter made precise.")}>
        {r`${HOMOGENEOUS}\begin{bmatrix} x \\ y \\ \sym{w}{w} \end{bmatrix} = \begin{bmatrix} \sym{lin}{ax + by} + \sym{t}{t_x}\,\sym{w}{w} \\ \sym{lin}{cx + dy} + \sym{t}{t_y}\,\sym{w}{w} \\ \sym{w}{w} \end{bmatrix}`}
      </Equation>
      <p>
        {tx(t, "mMat_trsBody",
          "Placing a shape on a plan is usually done as M = T · R · S: scale first (around the shape's own centre, at the origin), then rotate, then translate into place. Read right to left, as always. Putting T first would scale and rotate the offset too, moving the shape away from where you meant to put it.")}
      </p>

      <H2>{tx(t, "mMat_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mMat_ex1",
          "1. Build the matrix that turns 90° anticlockwise and doubles the size. î must go to (0, 2) and ĵ to (−2, 0), so A = [[0, −2], [2, 0]]. Check: A(1, 1) = (0 − 2, 2 + 0) = (−2, 2), which is (1, 1) turned a quarter and doubled.")}
      </p>
      <p>
        {tx(t, "mMat_ex2",
          "2. Shear then mirror: S = [[1, 1], [0, 1]], F = [[−1, 0], [0, 1]]. Shear first means F·S = [[−1·1 + 0·0, −1·1 + 0·1], [0·1 + 1·0, 0·1 + 1·1]] = [[−1, −1], [0, 1]]. Applied to (0, 1): (−1, 1). By hand: shear gives (1, 1), mirror gives (−1, 1). ✓")}
      </p>
      <p>
        {tx(t, "mMat_ex3b",
          "3. Rotate the point (2, 0) by 90° about (1, 1) with one matrix: translate by (−1, −1), rotate, translate by (1, 1).")}
      </p>
      <Derivation t={t} label={tx(t, "mMat_eqEx3", "A turn about a pivot as one matrix")}
        steps={[
          { tex: r`M = T(1, 1)\, R(90^\circ)\, T(-1, -1)`, why: tx(t, "mMat_x1", "read right to left: move the pivot to the origin, turn, move it back") },
          { tex: r`= \begin{bmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \\ 0 & 0 & 1 \end{bmatrix}\begin{bmatrix} 0 & -1 & 1 \\ 1 & 0 & -1 \\ 0 & 0 & 1 \end{bmatrix}`, why: tx(t, "mMat_x2", "first multiply the turn [0 −1; 1 0] by T(−1, −1): its last column becomes R(−1, −1) = (1, −1)") },
          { tex: r`= \begin{bmatrix} 0 & -1 & 2 \\ 1 & 0 & 0 \\ 0 & 0 & 1 \end{bmatrix}`, why: tx(t, "mMat_x3", "then T(1, 1) adds (1, 1) to that last column: (2, 0)") },
          { full: true, tex: r`M\begin{bmatrix} 2 \\ 0 \\ 1 \end{bmatrix} = \begin{bmatrix} 0 - 0 + 2 \\ 2 + 0 + 0 \\ 1 \end{bmatrix} = \green{\begin{bmatrix} 2 \\ 2 \\ 1 \end{bmatrix}}`, why: tx(t, "mMat_x4", "apply it to the point (2, 0) with w = 1. By hand: offset (1, −1) from the pivot, turned to (1, 1), plus the pivot gives (2, 2) ✓") },
        ]} />

      <H2>{tx(t, "mMat_handTitle", "Multiplying by hand, any size")}</H2>
      <p>
        {tx(t, "mMat_handBody",
          "Matrices need not be square. An m × n matrix has m rows and n columns, and the rule is the same as for 2 × 2: the entry in row i, column j of AB is row i of A dotted with column j of B. A neat way to lay it out is to write B above and to the right of A; each entry of the product then sits exactly where its row of A and its column of B cross. Take A (2 × 3) and B (3 × 2):")}
      </p>
      <Equation label={tx(t, "mMat_eqRect", "A 2 × 3 matrix times a 3 × 2 matrix")}
        where={[
          [r`\sym{e11}{2} = 1 \cdot 2 + 2 \cdot 0 + 0 \cdot 1`, tx(t, "mMat_wR1", "row 1 of A dotted with column 1 of B")],
          [r`\sym{e12}{3} = 1 \cdot 1 + 2 \cdot 1 + 0 \cdot 0`, tx(t, "mMat_wR2", "row 1 with column 2")],
          [r`\sym{e21}{3} = 0 \cdot 2 + 1 \cdot 0 + 3 \cdot 1`, tx(t, "mMat_wR3", "row 2 with column 1")],
          [r`\sym{e22}{1} = 0 \cdot 1 + 1 \cdot 1 + 3 \cdot 0`, tx(t, "mMat_wR4", "row 2 with column 2")],
        ]}
        note={tx(t, "mMat_rectNote", "The other order, BA, is a 3 × 3 matrix: [[2, 5, 3], [0, 1, 3], [1, 2, 0]]. So AB and BA need not even have the same size.")}>
        {r`${RECT.a}${RECT.b} = ${RECT.c}`}
      </Equation>
      <p>
        {tx(t, "mMat_shopBody",
          "Matrix products appear wherever amounts are combined with rates. Two friends shop for bread, milk and eggs: Ana buys 2, 1 and 0, Bruno 1, 2 and 3. Shop X charges 3, 4 and 1 per item, shop Y charges 2, 5 and 1. Put the purchases as rows of Q (2 × 3) and the prices of each shop as columns of P (3 × 2). Then QP (2 × 2) lists what each friend pays in each shop: Ana in X pays 2 · 3 + 1 · 4 + 0 · 1 = 10, in Y 2 · 2 + 1 · 5 + 0 = 9; Bruno in X pays 3 + 8 + 3 = 14, in Y 2 + 10 + 3 = 15. Each entry is a row of amounts dotted with a column of prices.")}
      </p>

      <H2>{tx(t, "mMat_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mMat_tWrong", "Wrong"), tx(t, "mMat_tRight", "Right"), tx(t, "mMat_tWhy2", "Why")]}
        rows={[
          ["AB = BA", tx(t, "mMat_m1r", "usually AB ≠ BA"), tx(t, "mMat_m1", "turning then stretching is not stretching then turning")],
          [tx(t, "mMat_m2w", "reading A·B·v left to right"), tx(t, "mMat_m2r", "B acts first, then A"), tx(t, "mMat_m2", "(AB)v = A(Bv): the matrix nearest the vector goes first")],
          [tx(t, "mMat_m3w", "putting î's image in a row"), tx(t, "mMat_m3r", "it is a column"), tx(t, "mMat_m3", "A(1, 0) returns the first column; rows give the transpose")],
          ["M = S · R · T", "M = T · R · S", tx(t, "mMat_m4", "translating first means the rotation and scale also swing the offset")],
          [tx(t, "mMat_m5w", "w = 1 for a velocity or a direction"), tx(t, "mMat_m5r", "w = 0 for directions"), tx(t, "mMat_m5", "a direction must not be moved by the translation")],
          [tx(t, "mMat_m6w", "multiplying a 2 × 3 by a 2 × 3"), tx(t, "mMat_m6r", "inner sizes must match"), tx(t, "mMat_m6", "(m × n)(n × p): each row must be as long as each column")],
        ]}
      />

      <KeyIdeas t={t} id="mMat" items={[
        "A matrix stores a linear rule: new x = ax + by, new y = cx + dy.",
        "Matrix × vector: each output is a row dotted with the vector, or equally x·column 1 + y·column 2.",
        "The columns are where the unit steps land; build a matrix by choosing them.",
        "Linear maps keep lines straight, parallel and evenly spaced, and fix the origin.",
        "AB means B first, then A; order matters, grouping does not.",
        "Homogeneous coordinates (w = 1 points, w = 0 directions) let one matrix translate as well.",
      ]} />
    </Article>
  );
}
