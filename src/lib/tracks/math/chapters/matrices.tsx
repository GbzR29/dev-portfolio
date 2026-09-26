"use client";

// Linear Algebra 4: matrices — a grid of numbers as a transformation. The
// matrix–vector product (row and column views), columns as the images of the
// unit steps, a gallery of 2 × 2 maps, what "linear" means, multiplication as
// composition and why order matters, the transpose, 3 × 3 rotations, and
// homogeneous coordinates for translation. C++ Mat2/Mat3.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { MatrixFigure } from "@/components/lesson/figures/math/MatrixFigure";

const r = String.raw;

export function MatricesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mMat_intro",
          "The transformations chapter wrote each move as its own rule, and the identities chapter found the rule for rotation by any angle. Look at those rules side by side and they all have the same shape: the new x is some amount of the old x plus some amount of the old y, and likewise for the new y. Four numbers decide everything. Written as a small grid, those four numbers are a matrix, the object that every graphics API uses to move, turn, scale and project geometry. This chapter builds matrices from that one observation.")}
      </Lead>

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
          [r`a, b`, tx(t, "mMat_wAB", "the first row: how much old x and old y go into the new x")],
          [r`c, d`, tx(t, "mMat_wCD", "the second row: how much old x and old y go into the new y")],
          [r`\mathbf{v} = (x, y)`, tx(t, "mMat_wV", "the input vector, written as a column")],
          [r`A\mathbf{v}`, tx(t, "mMat_wAv", "the output: the matrix times the vector")],
        ]}>
        {r`A\mathbf{v} = \begin{bmatrix} a & b \\ c & d \end{bmatrix}\begin{bmatrix} x \\ y \end{bmatrix} = \begin{bmatrix} ax + by \\ cx + dy \end{bmatrix}`}
      </Equation>

      <H2>{tx(t, "mMat_prodTitle", "Two ways to read matrix × vector")}</H2>
      <p>
        {tx(t, "mMat_rowView",
          "Row view: each entry of the result is one row of the matrix dotted with the vector. The first output is (a, b) · (x, y) = ax + by, the second is (c, d) · (x, y) = cx + dy. This is how you compute it by hand, and how a GPU computes it: one dot product per output.")}
      </p>
      <p>
        {tx(t, "mMat_colView",
          "Column view: regroup the same sum by x and y instead. The result is x times the first column (a, c) plus y times the second column (b, d). This is how you understand it: the vector's coordinates are a recipe, and the columns are the ingredients.")}
      </p>
      <Equation label={tx(t, "mMat_eqCols", "Matrix × vector as a mix of the columns")}
        where={[
          [r`(a, c)`, tx(t, "mMat_wCol1", "the first column, scaled by x")],
          [r`(b, d)`, tx(t, "mMat_wCol2", "the second column, scaled by y")],
        ]}
        note={tx(t, "mMat_colsNote", "Example: A = [[2, 1], [0, 3]] and v = (4, −1). Row view: (2·4 + 1·(−1), 0·4 + 3·(−1)) = (7, −3). Column view: 4·(2, 0) + (−1)·(1, 3) = (8, 0) + (−1, −3) = (7, −3). Same answer, two ways of seeing it.")}>
        {r`\begin{bmatrix} a & b \\ c & d \end{bmatrix}\begin{bmatrix} x \\ y \end{bmatrix} = x\begin{bmatrix} a \\ c \end{bmatrix} + y\begin{bmatrix} b \\ d \end{bmatrix}`}
      </Equation>

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
        ]}
        note={tx(t, "mMat_mulNote", "Example: A = [[0, −1], [1, 0]] (quarter turn), B = [[2, 0], [0, 1]] (stretch x). AB: row 1 of A (0, −1) with column 1 of B (2, 0) gives 0; with column 2 (0, 1) gives −1; row 2 (1, 0) gives 2 and 0. AB = [[0, −1], [2, 0]]. BA = [[0, −2], [1, 0]]. Different: stretching and then turning is not the same as turning and then stretching.")}>
        {r`\begin{bmatrix} a & b \\ c & d \end{bmatrix}\begin{bmatrix} e & f \\ g & h \end{bmatrix} = \begin{bmatrix} ae + bg & af + bh \\ ce + dg & cf + dh \end{bmatrix}`}
      </Equation>
      <p>
        {tx(t, "mMat_orderBody",
          "Three rules come with it. Order matters: AB is usually not BA (the figure's second mode shows a turn and a shear disagreeing). The matrix written last is applied first, because (AB)v = A(Bv): read a product right to left. Grouping does not matter: (AB)C = A(BC), so a long chain can be multiplied out once and reused for every vertex. And the identity I changes nothing: AI = IA = A. Sizes must fit: an m × n matrix can multiply an n × p one (the rows of the first are as long as the columns of the second), giving an m × p result.")}
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
          [r`R_z(\theta)`, tx(t, "mMat_wRz", "turns x toward y; z is untouched (third column and row are those of I)")],
          [r`R_x(\theta)`, tx(t, "mMat_wRx", "turns y toward z; x is untouched")],
          [r`R_y(\theta)`, tx(t, "mMat_wRy", "turns z toward x; y is untouched. The sign of sin looks swapped only because z → x is the anticlockwise order seen from +y")],
        ]}>
        {r`R_z = \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix} \quad R_x = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\theta & -\sin\theta \\ 0 & \sin\theta & \cos\theta \end{bmatrix} \quad R_y = \begin{bmatrix} \cos\theta & 0 & \sin\theta \\ 0 & 1 & 0 \\ -\sin\theta & 0 & \cos\theta \end{bmatrix}`}
      </Equation>

      <H2>{tx(t, "mMat_homTitle", "Translation with one extra coordinate")}</H2>
      <p>
        {tx(t, "mMat_homBody",
          "Here is the trick. Give every 2D point a third coordinate that is always 1: (x, y) becomes (x, y, 1). Now use a 3 × 3 matrix whose last column holds the offset (tx, ty). Multiplying out, the new x is 1·x + 0·y + tx·1 = x + tx: the constant 1 picks up the offset. The 2 × 2 corner of the matrix can still rotate, scale and shear, so a single 3 × 3 matrix does any of those plus a translation. These are homogeneous coordinates. In 3D the same trick uses 4 × 4 matrices and points (x, y, z, 1), which is why every graphics API is built on 4 × 4 matrices.")}
      </p>
      <Equation label={tx(t, "mMat_eqHom", "A 2D rotation or scale plus a translation, as one 3 × 3 matrix")}
        where={[
          [r`\begin{bmatrix} a & b \\ c & d \end{bmatrix}`, tx(t, "mMat_wCorner", "the linear part: rotate, scale, shear")],
          [r`(t_x, t_y)`, tx(t, "mMat_wT", "the translation, in the last column")],
          [r`w`, tx(t, "mMat_wW", "the extra coordinate: 1 for a point, 0 for a direction")],
        ]}
        note={tx(t, "mMat_homNote", "With w = 0 the offset is multiplied by 0 and ignored. That is exactly right for directions: moving a spaceship does not change which way its velocity points. So points get w = 1 and vectors w = 0, the distinction from the vectors chapter made precise.")}>
        {r`\begin{bmatrix} a & b & t_x \\ c & d & t_y \\ 0 & 0 & 1 \end{bmatrix}\begin{bmatrix} x \\ y \\ w \end{bmatrix} = \begin{bmatrix} ax + by + t_x w \\ cx + dy + t_y w \\ w \end{bmatrix}`}
      </Equation>
      <p>
        {tx(t, "mMat_trsBody",
          "A typical object's matrix is built as M = T · R · S: scale first (in the object's own space, around its own centre), then rotate, then translate into the world. Read right to left, as always. Putting T first would scale and rotate the offset too, flinging the object away from where you placed it.")}
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
        {tx(t, "mMat_ex3",
          "3. Rotate the point (2, 0) by 90° about (1, 1) with one matrix: translate by (−1, −1), rotate, translate by (1, 1). M = T(1, 1) · R(90°) · T(−1, −1) = [[0, −1, 2], [1, 0, 0], [0, 0, 1]]. M(2, 0, 1) = (0 − 0 + 2, 2 + 0 + 0, 1) = (2, 2). By hand: offset (1, −1), turned to (1, 1), plus the pivot is (2, 2). ✓")}
      </p>

      <H2>{tx(t, "mMat_codeTitle", "Matrices in C++")}</H2>
      <p>
        {tx(t, "mMat_codeBody",
          "A 2 × 2 matrix is four floats. This one stores its columns, the layout OpenGL and GLM use (column-major), so m.c[0] is where î lands. The product with a vector is the column view; the product of two matrices applies the left one to each column of the right one, exactly as derived above.")}
      </p>
      <CodeBlock lang="cpp" filename="mat2.hpp" t={t}>{`#include <cmath>

struct Vec2 { float x, y; };
Vec2 operator+(Vec2 a, Vec2 b) { return { a.x + b.x, a.y + b.y }; }
Vec2 operator*(float k, Vec2 v) { return { k * v.x, k * v.y }; }

// Column-major: c[0] is the image of (1, 0), c[1] the image of (0, 1)
struct Mat2 {
    Vec2 c[2] = { {1, 0}, {0, 1} };             // identity by default

    static Mat2 rotation(float a) {
        float co = std::cos(a), s = std::sin(a);
        return { { { co, s }, { -s, co } } };
    }
    static Mat2 scale(float sx, float sy) { return { { { sx, 0 }, { 0, sy } } }; }

    // Column view: x steps along column 0, y steps along column 1
    Vec2 operator*(Vec2 v) const { return v.x * c[0] + v.y * c[1]; }

    // (A*B) applies B first: its columns are A times B's columns
    Mat2 operator*(const Mat2& b) const { return { { *this * b.c[0], *this * b.c[1] } }; }
};

// Usage: turn by 30 degrees, then stretch x by 2
// Mat2 m = Mat2::scale(2, 1) * Mat2::rotation(0.5236f);
// Vec2 p = m * Vec2{ 1, 0 };`}</CodeBlock>

      <H2>{tx(t, "mMat_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mMat_tWrong", "Wrong"), tx(t, "mMat_tRight", "Right"), tx(t, "mMat_tWhy2", "Why")]}
        rows={[
          ["AB = BA", tx(t, "mMat_m1r", "usually AB ≠ BA"), tx(t, "mMat_m1", "turning then stretching is not stretching then turning")],
          [tx(t, "mMat_m2w", "reading A·B·v left to right"), tx(t, "mMat_m2r", "B acts first, then A"), tx(t, "mMat_m2", "(AB)v = A(Bv): the matrix nearest the vector goes first")],
          [tx(t, "mMat_m3w", "putting î's image in a row"), tx(t, "mMat_m3r", "it is a column"), tx(t, "mMat_m3", "A(1, 0) returns the first column; rows give the transpose")],
          ["M = S · R · T", "M = T · R · S", tx(t, "mMat_m4", "translating first means the rotation and scale also swing the offset")],
          [tx(t, "mMat_m5w", "w = 1 for normals and velocities"), tx(t, "mMat_m5r", "w = 0 for directions"), tx(t, "mMat_m5", "a direction must not be moved by the translation")],
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
