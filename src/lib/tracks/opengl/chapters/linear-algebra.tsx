"use client";

// OpenGL track — "Matrices for 3D" (route id "linear-algebra", kept stable).
// Follows "Vectors for 3D" and is written for the same beginner: what a
// matrix is; matrix × vector by rows (dot products) and by columns ("the
// columns are where the axes land", basis figure, determinant in one
// paragraph); scale, rotation (cos/sin from the unit circle, all three axes)
// and the identity; why 3×3 cannot translate, w = 1 for points and w = 0 for
// directions (homogeneous figure); combining transforms by multiplying
// matrices, worked 2×2 example of why order matters; the matrices in GLM
// (mathlab.cpp continued, float rounding); common mistakes. The MVP pipeline
// itself is taught in "Transformations + GLM".

import { CodeBlock, Callout, H2, H3, IC, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { InteractiveBasis2D } from "@/components/lesson/figures/basis/InteractiveBasis2D";
import { HomogeneousFigure } from "@/components/lesson/figures/HomogeneousFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function LinearAlgebraContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglMat_intro",
          "A model has hundreds or thousands of vertices. To move it, turn it or resize it, every one of them has to change in the same way. A matrix is a compact recipe for such a change, and the GPU applies it to every vertex. This chapter builds that idea one step at a time: what a matrix is, how it changes a vector, the matrices that scale, rotate and move, and how to chain them. It uses the vector operations from the previous chapter, especially the dot product.")}
      </Lead>

      <Goals t={t} id="oglMat" items={[
        "Multiply a matrix by a vector, and read its columns as the new axes.",
        "Build scaling, rotation and translation matrices.",
        "Explain why 3D graphics uses 4 × 4 matrices.",
        "Combine transformations in the right order with GLM.",
      ]} />

      {/* ── WHAT A MATRIX IS ────────────────────────────────────────────── */}
      <H2>{tx(t, "oglMat_whatTitle", "What a matrix is")}</H2>
      <p>
        {tx(t, "oglMat_what1",
          "A matrix is a grid of numbers arranged in rows and columns. A \"3×3 matrix\" has 3 rows and 3 columns; a \"4×4 matrix\" has 4 of each. Rows go across, columns go down.")}
      </p>
      <Equation label={tx(t, "oglMat_gridLabel", "A 3×3 matrix")}
        where={[
          [String.raw`m_{12}`, tx(t, "oglMat_wM12", "the number in row 1, column 2: the first index is the row, the second the column")],
        ]}>
        {String.raw`M \;=\; \begin{bmatrix} m_{11} & m_{12} & m_{13} \\ m_{21} & m_{22} & m_{23} \\ m_{31} & m_{32} & m_{33} \end{bmatrix} \qquad\text{e.g.}\qquad \begin{bmatrix} 1 & 2 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}`}
      </Equation>
      <p>
        {tx(t, "oglMat_what2",
          "On its own a matrix is just numbers. What makes it useful is one operation: multiplying it by a vector. That gives a new vector. So a matrix acts like a machine: a vector goes in, a changed vector comes out. Which change depends on the numbers inside.")}
      </p>

      {/* ── MATRIX × VECTOR ─────────────────────────────────────────────── */}
      <H2>{tx(t, "oglMat_mulTitle", "Multiplying a matrix by a vector")}</H2>
      <p>
        {tx(t, "oglMat_mul1",
          "The matrix is written on the left and the vector on the right: M v. The vector is written standing up, as a column. The rule: each row of the matrix produces one part of the result. That part is the dot product of the row with the vector: multiply matching numbers and add.")}
      </p>
      <Equation label={tx(t, "oglMat_mulLabel", "Matrix times vector, row by row")}
        glm="glm::vec3 r = M * v;">
        {String.raw`\begin{bmatrix} \blue{m_{11}} & \blue{m_{12}} & \blue{m_{13}} \\ \green{m_{21}} & \green{m_{22}} & \green{m_{23}} \\ \amber{m_{31}} & \amber{m_{32}} & \amber{m_{33}} \end{bmatrix}
\begin{pmatrix} x \\ y \\ z \end{pmatrix}
\;=\;
\begin{pmatrix} \blue{m_{11}}x + \blue{m_{12}}y + \blue{m_{13}}z \\ \green{m_{21}}x + \green{m_{22}}y + \green{m_{23}}z \\ \amber{m_{31}}x + \amber{m_{32}}y + \amber{m_{33}}z \end{pmatrix}`}
      </Equation>
      <p>
        {tx(t, "oglMat_mul2",
          "With numbers, using the example matrix above and v = (3, 1, 4):")}
      </p>
      <LessonTable
        headers={[tx(t, "oglMat_tRow", "Row"), tx(t, "oglMat_tDot", "Row · v"), tx(t, "oglMat_tPart", "Result part")]}
        rows={[
          ["(1, 2, 0)", "1×3 + 2×1 + 0×4", "x = 5"],
          ["(0, 1, 0)", "0×3 + 1×1 + 0×4", "y = 1"],
          ["(0, 0, 1)", "0×3 + 0×1 + 1×4", "z = 4"],
        ]}
      />
      <p>
        {tx(t, "oglMat_mul3",
          "So M v = (5, 1, 4). This matrix added twice the y value to x and left y and z alone. It slants shapes sideways, like pushing the top of a deck of cards. That kind of change is called a shear.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglMat_mulSize",
          "The matrix needs as many columns as the vector has parts: a 3×3 matrix takes a vec3, a 4×4 matrix takes a vec4. And the order matters: in GLM and GLSL write M * v, matrix first.")}
      </Callout>

      {/* ── COLUMNS ─────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglMat_colTitle", "The columns are where the axes land")}</H2>
      <p>
        {tx(t, "oglMat_col1",
          "The row rule tells you how to compute. This section tells you how to read a matrix, and how to build one yourself.")}
      </p>
      <p>
        {tx(t, "oglMat_col2",
          "Name the three arrows of length 1 along the axes: î = (1, 0, 0) along x, ĵ = (0, 1, 0) along y, and k̂ = (0, 0, 1) along z. (The hat means a unit vector, as in the previous chapter.) Now multiply the example matrix by î. Every row times (1, 0, 0) just picks the row's first number, so the result is (1, 0, 0), the first column. In the same way, M ĵ is the second column, (2, 1, 0), and M k̂ is the third column, (0, 0, 1).")}
      </p>
      <p>
        {tx(t, "oglMat_col3",
          "So each column says where one axis arrow ends up. And every vector is built from those three arrows: (3, 1, 4) means 3 steps of î, plus 1 step of ĵ, plus 4 steps of k̂. The matrix moves the arrows, so the result is 3 steps of the new î, 1 of the new ĵ and 4 of the new k̂:")}
      </p>
      <Equation label={tx(t, "oglMat_colLabel", "Matrix times vector, column by column")}>
        {String.raw`M\begin{pmatrix} 3 \\ 1 \\ 4 \end{pmatrix} \;=\; 3\begin{pmatrix} \red{1} \\ \red{0} \\ \red{0} \end{pmatrix} + 1\begin{pmatrix} \green{2} \\ \green{1} \\ \green{0} \end{pmatrix} + 4\begin{pmatrix} \blue{0} \\ \blue{0} \\ \blue{1} \end{pmatrix} \;=\; \begin{pmatrix} 5 \\ 1 \\ 4 \end{pmatrix}`}
      </Equation>
      <p>
        {tx(t, "oglMat_col4",
          "The same answer as the row rule, (5, 1, 4). The two rules always agree; they are two ways of reading the same sums. The column view gives you a recipe for building any matrix: decide where each axis arrow should go, and write the three answers as the columns.")}
      </p>
      <p>
        {tx(t, "oglMat_basisTry",
          "The figure shows this in 2D, where a matrix has two columns. Drag the red î and the green ĵ, and the whole grid follows. The numbers in each matrix column are the coordinates of the arrow of the same colour.")}
      </p>
      <p>
        {tx(t, "oglMat_detBody",
          "The figure also shows det(M), the determinant. It is the area of the shaded square after the change (the square started as 1×1). det = 2 means every area doubled. A negative det means space was mirrored, and the F reads backwards. det = 0 means everything was flattened onto a line. That loses information, so no matrix can undo it. 3D works the same way, with volumes instead of areas.")}
      </p>

      <InteractiveBasis2D />

      {/* ── SCALE ───────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglMat_scaleTitle", "Scaling")}</H2>
      <p>
        {tx(t, "oglMat_scale1",
          "Use the recipe. To make a model twice as wide and half as tall, the x arrow should become twice as long, (2, 0, 0); the y arrow half as long, (0, 0.5, 0); and the z arrow should stay (0, 0, 1). Write those as columns:")}
      </p>
      <Equation label={tx(t, "oglMat_scaleLabel", "Scale matrix")}
        glm="glm::mat4 S = glm::scale(glm::mat4(1.0f), glm::vec3(sx, sy, sz));"
        where={[
          [String.raw`\green{s_x},\ \green{s_y},\ \green{s_z}`, tx(t, "oglMat_wS", "how much to stretch along each axis: 1 keeps the size, 2 doubles it, 0.5 halves it, a negative value also mirrors")],
        ]}>
        {String.raw`S \;=\; \begin{bmatrix} \green{s_x} & \muted{0} & \muted{0} \\ \muted{0} & \green{s_y} & \muted{0} \\ \muted{0} & \muted{0} & \green{s_z} \end{bmatrix} \qquad \begin{bmatrix} 2 & \muted{0} & \muted{0} \\ \muted{0} & 0.5 & \muted{0} \\ \muted{0} & \muted{0} & 1 \end{bmatrix}\begin{pmatrix} 1 \\ 4 \\ 3 \end{pmatrix} = \begin{pmatrix} 2 \\ 2 \\ 3 \end{pmatrix}`}
      </Equation>
      <p>
        {tx(t, "oglMat_scale2",
          "With numbers: the vertex (1, 4, 3) becomes (2×1, 0.5×4, 1×3) = (2, 2, 3). When sx, sy and sz are equal, the model keeps its shape and only changes size. That is called a uniform scale.")}
      </p>
      <p>
        {tx(t, "oglMat_identity",
          "With all three set to 1 you get the identity matrix: 1s on the diagonal from top-left to bottom-right, 0s everywhere else. Every axis stays where it is, so it changes nothing, like multiplying a number by 1. In GLM, glm::mat4(1.0f) is the identity. It is the starting point that the other GLM functions build on.")}
      </p>

      {/* ── ROTATE ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglMat_rotTitle", "Rotating")}</H2>
      <p>
        {tx(t, "oglMat_rot1",
          "Start with a rotation around the z axis. That is a turn in the plane of the screen, like the hands of a clock but counter-clockwise. Use the recipe again: where do the axis arrows go when they turn by an angle θ?")}
      </p>
      <p>
        {tx(t, "oglMat_rot2",
          "Picture a circle of radius 1 around the origin. A point on it at angle θ from the x axis has the coordinates (cos θ, sin θ). That is the definition of cosine and sine. So the x arrow (1, 0) turned by θ lands on (cos θ, sin θ). The y arrow starts 90° further round, and lands 90° further too: on (−sin θ, cos θ). The z arrow is the axis of the turn, so it does not move.")}
      </p>
      <Equation label={tx(t, "oglMat_rzLabel", "Rotation by θ around z")}
        glm="glm::mat4 R = glm::rotate(glm::mat4(1.0f), glm::radians(angle), glm::vec3(0, 0, 1));"
        where={[
          [String.raw`\purple{\theta}`, tx(t, "oglMat_wTheta", "the angle to turn; positive turns counter-clockwise when the axis points at you")],
          [String.raw`\purple{\cos\theta},\ \purple{\sin\theta}`, tx(t, "oglMat_wCosSin", "the x and y of the point at angle θ on a circle of radius 1")],
        ]}>
        {String.raw`R_z(\purple{\theta}) \;=\; \begin{bmatrix} \purple{\cos\theta} & \purple{-\sin\theta} & \muted{0} \\ \purple{\sin\theta} & \purple{\cos\theta} & \muted{0} \\ \muted{0} & \muted{0} & 1 \end{bmatrix}`}
      </Equation>
      <p>
        {tx(t, "oglMat_rot3",
          "With numbers, a quarter turn: θ = 90°, so cos θ = 0 and sin θ = 1. Rotate the point (2, 1, 0). Row 1: 0×2 + (−1)×1 + 0×0 = −1. Row 2: 1×2 + 0×1 + 0×0 = 2. Row 3: 0. The result is (−1, 2, 0). Check that it makes sense: the point was right and a little up; after a quarter turn counter-clockwise it is up and a little left. Its distance from the origin is √5 both before and after, because a rotation never changes lengths.")}
      </p>
      <p>
        {tx(t, "oglMat_rot4",
          "Rotations around x and around y are built the same way. Each keeps its own axis fixed and turns the other two, with the same cos and sin pattern:")}
      </p>
      <Equation label={tx(t, "oglMat_rxyLabel", "Rotations around x and y")}
        glm="glm::rotate(glm::mat4(1.0f), glm::radians(angle), glm::vec3(1, 0, 0));   // or (0, 1, 0) for y">
        {String.raw`R_x(\purple{\theta}) = \begin{bmatrix} 1 & \muted{0} & \muted{0} \\ \muted{0} & \purple{\cos\theta} & \purple{-\sin\theta} \\ \muted{0} & \purple{\sin\theta} & \purple{\cos\theta} \end{bmatrix}
\qquad
R_y(\purple{\theta}) = \begin{bmatrix} \purple{\cos\theta} & \muted{0} & \purple{\sin\theta} \\ \muted{0} & 1 & \muted{0} \\ \purple{-\sin\theta} & \muted{0} & \purple{\cos\theta} \end{bmatrix}`}
      </Equation>
      <p>
        {tx(t, "oglMat_rot5",
          "Why does R_y have its minus sign in the bottom row instead of the top? The axes go round in the cycle x → y → z → x. Around z, x turns toward y. Around x, y turns toward z. Around y, z turns toward x. Written in the usual x, y, z order, that last pair is listed backwards, so the sign appears swapped. It is the same rotation.")}
      </p>
      <p>
        {tx(t, "oglMat_rot6",
          "Which way is positive? Use the right-hand rule: point your right thumb along the axis and your fingers curl in the positive direction. Seen with the axis pointing at you, a positive angle turns counter-clockwise.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "oglMat_radians",
          "GLM, GLSL and C++'s sin and cos take angles in radians, not degrees. A full turn is 360° or 2π radians, so 180° = π ≈ 3.14159 and 90° = π/2. glm::radians(90.0f) converts for you. Passing 90.0f directly turns by 90 radians, about 14 full turns plus 117°.")}
      </Callout>
      <p>
        {tx(t, "oglMat_rotAny",
          "glm::rotate can turn around any axis, not only x, y and z: pass any direction as the last argument (GLM normalizes it). Its matrix is longer, but it follows the same rule: the columns are where the axis arrows land.")}
      </p>

      {/* ── TRANSLATE ───────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglMat_transTitle", "Moving (translation), and why 4×4")}</H2>
      <p>
        {tx(t, "oglMat_trans1",
          "Moving a model by an offset (tx, ty, tz) means adding that offset to every vertex. Moving is called translation. It seems like the simplest change of all, but no 3×3 matrix can do it.")}
      </p>
      <p>
        {tx(t, "oglMat_trans2",
          "Here is why. Multiply any 3×3 matrix by the origin (0, 0, 0). By the column rule, the result is 0 × column 1 + 0 × column 2 + 0 × column 3 = (0, 0, 0). The origin always stays put. A translation must move the origin, so it cannot be a 3×3 matrix.")}
      </p>
      <p>
        {tx(t, "oglMat_trans3",
          "The fix is to give every point a fourth part, called w, and set it to 1: the point (x, y, z) is stored as (x, y, z, 1). The matrices become 4×4, and the offset goes in the new fourth column. In the multiplication, that column is multiplied by w = 1 and added to the result:")}
      </p>
      <Equation label={tx(t, "oglMat_transLabel", "Translation matrix, worked out")}
        glm="glm::mat4 T = glm::translate(glm::mat4(1.0f), glm::vec3(tx, ty, tz));"
        where={[
          [String.raw`\amber{t_x},\ \amber{t_y},\ \amber{t_z}`, tx(t, "oglMat_wT", "the offset: how far to move along each axis")],
          [String.raw`\purple{w}`, tx(t, "oglMat_wW", "the fourth part of the vector: 1 for a point")],
        ]}>
        {String.raw`\begin{bmatrix} 1&\muted{0}&\muted{0}&\amber{t_x} \\ \muted{0}&1&\muted{0}&\amber{t_y} \\ \muted{0}&\muted{0}&1&\amber{t_z} \\ \muted{0}&\muted{0}&\muted{0}&1 \end{bmatrix}
\begin{pmatrix} x \\ y \\ z \\ \purple{1} \end{pmatrix}
=
\begin{pmatrix} x + \amber{t_x}\cdot\purple{1} \\ y + \amber{t_y}\cdot\purple{1} \\ z + \amber{t_z}\cdot\purple{1} \\ \purple{1} \end{pmatrix}`}
      </Equation>
      <p>
        {tx(t, "oglMat_trans4",
          "With numbers: move by (5, 0, −2). The point (1, 2, 3, 1) becomes (1 + 5, 2 + 0, 3 − 2, 1) = (6, 2, 1, 1). The fourth row is (0, 0, 0, 1), so w comes out as 1 again, ready for the next matrix.")}
      </p>
      <H3>{tx(t, "oglMat_wTitle", "w = 1 for points, w = 0 for directions")}</H3>
      <p>
        {tx(t, "oglMat_w1",
          "A direction, such as \"up\" or a surface normal, is an arrow without a place. Moving the model should not change which way is up. So directions get w = 0. Then the offset column is multiplied by 0 and adds nothing: (0, 1, 0, 0) moved by (5, 0, −2) is still (0, 1, 0, 0). Rotation and scale still act on it, because they live in the other three columns.")}
      </p>
      <Equation label={tx(t, "oglMat_wLabel", "The same translation T on a point and on a direction")}
        where={[
          [String.raw`\purple{w = 1}`, tx(t, "oglMat_wPos", "a point: the translation applies")],
          [String.raw`\red{w = 0}`, tx(t, "oglMat_wDir", "a direction or normal: the translation does not apply")],
        ]}>
        {String.raw`T\begin{pmatrix} p_x\\p_y\\p_z\\ \purple{1} \end{pmatrix} = \begin{pmatrix} p_x+\amber{t_x}\\p_y+\amber{t_y}\\p_z+\amber{t_z}\\ \purple{1} \end{pmatrix}
\qquad
T\begin{pmatrix} d_x\\d_y\\d_z\\ \red{0} \end{pmatrix} = \begin{pmatrix} d_x\\d_y\\d_z\\ \red{0} \end{pmatrix}`}
      </Equation>
      <p>
        {tx(t, "oglMat_w2",
          "Vectors with this extra w are called homogeneous coordinates. Scale and rotation fit in too: put their 3×3 matrix in the top-left corner of a 4×4, with 0s in the fourth column and row and a 1 in the bottom-right corner. Now all three changes are 4×4 matrices, and they can be chained, as the next section shows.")}
      </p>
      <p>
        {tx(t, "oglMat_homogFig",
          "Why does an extra part make moving possible? It is easiest to see one dimension down: 2D points with a third part w. The figure lifts the flat plane to height w = 1. There, the 3×3 matrix is a shear (the deck-of-cards slant from earlier): the origin of 3D space stays put, but the plane at height 1 slides sideways. Step through it.")}
      </p>

      <HomogeneousFigure t={t} />

      <p>
        {tx(t, "oglMat_vertexShader",
          "This is why the vertex shader writes vec4(aPos, 1.0): it turns the vec3 position into a point with w = 1, so that a 4×4 matrix can move it.")}
      </p>
      <CodeBlock lang="glsl" filename="vertex shader (preview)" t={t}>{`layout (location = 0) in vec3 aPos;
uniform mat4 uModel;          // one 4×4 matrix: scale, rotation and translation together

void main() {
    gl_Position = uModel * vec4(aPos, 1.0);   // w = 1: a point
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglMat_wLater",
          "So far w is always 1 for points. Later, the projection matrix will put a different number in w, and the GPU divides x, y and z by w after the vertex shader. That divide is what makes far things look smaller. The Transformations chapter explains it.")}
      </Callout>

      {/* ── COMBINING ───────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglMat_combTitle", "Combining changes: multiplying matrices")}</H2>
      <p>
        {tx(t, "oglMat_comb1",
          "A model usually needs all three: scale it, then rotate it, then move it into place. You could multiply each vertex by S, then by R, then by T. But matrices can be multiplied together first, into one matrix that does all three. Then each vertex needs one multiplication, and the program sends one matrix to the shader.")}
      </p>
      <Equation label={tx(t, "oglMat_combLabel", "One matrix for three changes")}
        notes={[tx(t, "oglMat_combNote", "Read from right to left: the matrix next to the vector acts first. Here S acts first, then R, then T.")]}>
        {String.raw`T\,\big(R\,(S\,\mathbf{v})\big) \;=\; (T\,R\,S)\,\mathbf{v} \;=\; M\,\mathbf{v} \qquad\text{with}\qquad M = T\,R\,S`}
      </Equation>
      <p>
        {tx(t, "oglMat_comb2",
          "How to multiply two matrices, A B: each column of the result is A times the matching column of B. That is the matrix-times-vector rule from earlier, done once per column. It makes sense with the column view: B says where the axis arrows go, and A then moves those arrows further.")}
      </p>
      <H3>{tx(t, "oglMat_orderTitle", "The order matters")}</H3>
      <p>
        {tx(t, "oglMat_order1",
          "With numbers, in 2D to keep it small. R turns a quarter turn counter-clockwise; S doubles the width. Their columns: R sends x to (0, 1) and y to (−1, 0); S sends x to (2, 0) and keeps y at (0, 1).")}
      </p>
      <Equation label={tx(t, "oglMat_orderLabel", "R S is not S R")}>
        {String.raw`\begin{gathered}
R = \begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix} \qquad S = \begin{bmatrix} 2 & 0 \\ 0 & 1 \end{bmatrix} \\[10pt]
R\,S = \begin{bmatrix} 0 & -1 \\ 2 & 0 \end{bmatrix} \qquad S\,R = \begin{bmatrix} 0 & -2 \\ 1 & 0 \end{bmatrix}
\end{gathered}`}
      </Equation>
      <p>
        {tx(t, "oglMat_order2",
          "Work out the first column of R S: R times S's first column, (2, 0). Row 1: 0×2 + (−1)×0 = 0. Row 2: 1×2 + 0×0 = 2. So (0, 2). For S R: S times R's first column, (0, 1), gives (0, 1). The two results differ.")}
      </p>
      <p>
        {tx(t, "oglMat_order3",
          "Follow the point (1, 0) to see why. R S means S first: (1, 0) is stretched to (2, 0), then turned to (0, 2). S R means R first: (1, 0) is turned to (0, 1), and then stretching the width does nothing to it, because its x is 0. So A B and B A are usually different. Swapping the order of matrices changes the result, and the compiler cannot warn you.")}
      </p>
      <p>
        {tx(t, "oglMat_order4",
          "The usual order for placing a model is M = T R S: scale first, then rotate, then move. Scale and rotation always happen around the origin (0, 0, 0). So they must happen while the model is still centred there, before it is moved. If you move it first and rotate after, it swings around the origin in a wide circle, like a stone on a string. The Transformations chapter has a figure that plays both orders side by side.")}
      </p>

      {/* ── LAB ─────────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglMat_labTitle", "Matrices in GLM: the math lab, continued")}</H2>
      <p>
        {tx(t, "oglMat_lab1",
          "Back to src/mathlab.cpp from the previous chapter. Add one include for the matrix functions, and a print helper for vec4 (points and directions now have four parts):")}
      </p>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp (top of the file)" t={t}>{`#include <glm/gtc/matrix_transform.hpp>   // NEW: glm::translate, glm::rotate, glm::scale

// NEW: prints a vec4. tidy() shows tiny rounding errors such as -4.37114e-08 as 0.
float tidy(float x) { return std::abs(x) < 1e-5f ? 0.0f : x; }

void print(const char* name, glm::vec4 v) {
    std::cout << name << " = (" << tidy(v.x) << ", " << tidy(v.y) << ", "
              << tidy(v.z) << ", " << tidy(v.w) << ")\\n";
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglMat_tLine", "Line"), tx(t, "oglMat_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"#include <glm/gtc/matrix_transform.hpp>"}</IC>, tx(t, "oglMat_l1", "the functions that build matrices. glm/glm.hpp alone has glm::mat4 but not these.")],
          [<IC key="2">{"float tidy(float x)"}</IC>, tx(t, "oglMat_l2", "returns 0 for any number closer to 0 than 0.00001, and the number itself otherwise. std::abs is the absolute value: the number without its minus sign.")],
          [<IC key="3">{"void print(const char*, glm::vec4)"}</IC>, tx(t, "oglMat_l3", "a third print, for four parts. C++ picks it whenever you pass a vec4.")],
        ]}
      />
      <p>
        {tx(t, "oglMat_lab2",
          "Why tidy? Computers store numbers like π with limited precision, so cos(90°) comes out as −0.0000000437 instead of exactly 0. Printed, that looks like -4.37114e-08, which means −4.37114 × 10⁻⁸. It is harmless, but it hides the numbers you want to compare. Then add these lines inside main:")}
      </p>
      <CodeBlock lang="cpp" filename="src/mathlab.cpp (inside main)" t={t}>{`// ── Matrices ──
glm::mat4 I(1.0f);                                  // the identity: changes nothing
glm::vec4 point(1.0f, 4.0f, 3.0f, 1.0f);            // w = 1: a point
print("I * point", I * point);                      // (1, 4, 3, 1)

glm::mat4 S = glm::scale(I, glm::vec3(2.0f, 0.5f, 1.0f));
print("S * point", S * point);                      // (2, 2, 3, 1)

glm::mat4 R = glm::rotate(I, glm::radians(90.0f), glm::vec3(0.0f, 0.0f, 1.0f));
print("R * (2, 1, 0, 1)", R * glm::vec4(2.0f, 1.0f, 0.0f, 1.0f));   // (-1, 2, 0, 1)

glm::mat4 T = glm::translate(I, glm::vec3(5.0f, 0.0f, -2.0f));
print("T * (1, 2, 3, 1)", T * glm::vec4(1.0f, 2.0f, 3.0f, 1.0f));   // (6, 2, 1, 1)
print("T * (0, 1, 0, 0)", T * glm::vec4(0.0f, 1.0f, 0.0f, 0.0f));   // (0, 1, 0, 0): a direction does not move

// ── Order ──
glm::mat4 S2 = glm::scale(I, glm::vec3(2.0f, 1.0f, 1.0f));          // double the width
glm::vec4 onX(1.0f, 0.0f, 0.0f, 1.0f);
print("T * R * S2 * onX", T * R * S2 * onX);        // (5, 2, -2, 1): S2 first, T last
print("S2 * R * T * onX", S2 * R * T * onX);        // (0, 6, -2, 1): T first, S2 last
print("column 3 of T*R*S2", (T * R * S2)[3]);       // (5, 0, -2, 1): the offset`}</CodeBlock>
      <p>
        {tx(t, "oglMat_lab3",
          "Each of these GLM functions takes a matrix as its first argument and returns that matrix times the new one. Starting from I gives the bare scale, rotation or translation matrix. The last line reads one column: in GLM, m[3] is column 3 (counting from 0), the fourth column, where the offset lives. GLM and OpenGL store matrices column by column, which is why m[i] is a column and not a row.")}
      </p>
      <p>
        {tx(t, "oglMat_lab4",
          "Run it. After the vector lines from the previous chapter, you should see:")}
      </p>
      <CodeBlock lang="text" filename="output (the new lines)" t={t}>{`I * point = (1, 4, 3, 1)
S * point = (2, 2, 3, 1)
R * (2, 1, 0, 1) = (-1, 2, 0, 1)
T * (1, 2, 3, 1) = (6, 2, 1, 1)
T * (0, 1, 0, 0) = (0, 1, 0, 0)
T * R * S2 * onX = (5, 2, -2, 1)
S2 * R * T * onX = (0, 6, -2, 1)
column 3 of T*R*S2 = (5, 0, -2, 1)`}</CodeBlock>
      <p>
        {tx(t, "oglMat_lab5",
          "Follow the two \"order\" lines by hand. T R S2: the point (1, 0, 0) is first stretched to (2, 0, 0), then turned to (0, 2, 0), then moved to (5, 2, −2). S2 R T: it is first moved to (6, 0, −2), then turned around the origin to (0, 6, −2), and stretching the width does nothing to an x of 0. Same three matrices, two different places.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "oglMat_labTry",
          "To see the rounding error, change tidy to just return x and run again. The S2 * R * T line now ends in (-5.24537e-07, 6, -2, 1): the 0 has become −0.000000525. Then try glm::radians(45.0f): cos 45° = sin 45° ≈ 0.707, and the point (1, 0, 0, 1) should land on (0.707, 0.707, 0, 1).")}
      </Callout>

      {/* ── MISTAKES ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglMat_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglMat_tMistake", "Mistake"), tx(t, "oglMat_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglMat_e1", "Writing v * M instead of M * v"), tx(t, "oglMat_e1b", "GLM and GLSL accept it but compute something else (they treat v as a row). Put the matrix first.")],
          [tx(t, "oglMat_e2", "Degrees passed as radians"), tx(t, "oglMat_e2b", "glm::rotate(I, 90.0f, axis) turns by 90 radians. Wrap angles in glm::radians.")],
          [tx(t, "oglMat_e3", "Translating before rotating"), tx(t, "oglMat_e3b", "the model orbits around the origin instead of turning in place. Build M = T R S: in GLM calls, translate first, then rotate, then scale.")],
          [tx(t, "oglMat_e4", "w = 0 for a position"), tx(t, "oglMat_e4b", "the translation is ignored, and the model stays at the origin. Positions use vec4(p, 1.0); directions and normals use 0.")],
          [tx(t, "oglMat_e5", "glm::mat4 M; with no argument"), tx(t, "oglMat_e5b", "in GLM 1.0 that is not the identity. Write glm::mat4(1.0f).")],
          [tx(t, "oglMat_e6", "Rotating around an axis of length 0"), tx(t, "oglMat_e6b", "glm::rotate normalizes the axis, and (0, 0, 0) has no direction: the matrix fills with NaN. Pass a real axis.")],
        ]}
      />
      <p>
        {tx(t, "oglMat_next",
          "Next, Transformations + GLM puts these matrices into your program. One matrix per object (the model matrix), one for the camera (the view matrix) and one for perspective (the projection matrix) take every vertex from its model to the screen.")}
      </p>

      <KeyIdeas t={t} id="oglMat" items={[
        "A matrix is a grid of numbers; multiplied by a vector, it gives a changed vector.",
        "Matrix × vector: each row's dot product with the vector gives one part of the result.",
        "The columns are where the axis arrows î, ĵ, k̂ land. To build a matrix, decide where each axis goes and write the answers as columns.",
        "Scale puts the stretch factors on the diagonal; the identity (all 1s) changes nothing.",
        "Rotation by θ sends x to (cos θ, sin θ) and y to (−sin θ, cos θ); angles are in radians, so use glm::radians.",
        "A 3×3 matrix cannot move the origin. Adding w (1 for points, 0 for directions) and a fourth column makes translation a matrix too.",
        "Matrices chain into one: M = T R S acts right to left (S first). Order matters: A B is usually not B A.",
      ]} />
    </Article>
  );
}
