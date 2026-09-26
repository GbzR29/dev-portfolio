"use client";

// Linear Algebra 5: the determinant — the factor by which a matrix scales
// area (volume in 3D), derived from the parallelogram; its sign as
// orientation and its zero as collapse; the product rule and the determinants
// of the basic moves; 3 × 3 by cofactor expansion and the triple product; and
// the everyday uses: orientation tests, winding, barycentric coordinates.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DeterminantFigure } from "@/components/lesson/figures/math/DeterminantFigure";

const r = String.raw;

export function DeterminantContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mDet_intro",
          "The number ad − bc has turned up three times already: as the denominator of Cramer's rule in the systems chapter, as the 2D cross product, and in the shoelace formula for area. It is the determinant of the matrix [[a, b], [c, d]], and it has a clear geometric meaning: how much the matrix scales areas, and whether it flips the plane over. This chapter derives it from a picture and then puts it to work.")}
      </Lead>

      <H2>{tx(t, "mDet_scaleTitle", "Every area is scaled by the same factor")}</H2>
      <p>
        {tx(t, "mDet_scaleBody",
          "A linear map keeps grid lines straight, parallel and evenly spaced. So every little square of the grid becomes the same parallelogram, just moved to a different place. If one unit square becomes a parallelogram of area 3, then every square does, and any shape, which can be covered by tiny squares, also has its area multiplied by 3. One number describes what the matrix does to all areas. To find it, look at the one square that is easiest: the unit square with corners (0, 0), (1, 0), (1, 1), (0, 1). Its sides are î and ĵ, so after the matrix it is the parallelogram spanned by the two columns, (a, c) and (b, d).")}
      </p>

      <H2>{tx(t, "mDet_formulaTitle", "The area of that parallelogram")}</H2>
      <p>
        {tx(t, "mDet_formulaBody",
          "Draw the parallelogram with corners 0, (a, c), (a + b, c + d) and (b, d), with all four numbers positive, and put the smallest rectangle around it: it is (a + b) wide and (c + d) tall, area ac + ad + bc + bd. The parts of the rectangle outside the parallelogram are two right triangles with legs a and c (together ac), two with legs b and d (together bd), and two small b × c rectangles in the corners (together 2bc). Subtract them all: ac + ad + bc + bd − ac − bd − 2bc = ad − bc.")}
      </p>
      <Equation label={tx(t, "mDet_eq2", "The determinant of a 2 × 2 matrix")}
        where={[
          [r`\det A`, tx(t, "mDet_wDet", "the determinant, also written |A|; the signed area of the image of the unit square")],
          [r`ad`, tx(t, "mDet_wAD", "the product of the main diagonal (top left to bottom right)")],
          [r`bc`, tx(t, "mDet_wBC", "the product of the other diagonal, subtracted")],
        ]}
        note={tx(t, "mDet_eq2Note", "Example: [[3, 1], [1, 2]] has det = 3·2 − 1·1 = 5, so it multiplies every area by 5. A circle of area 2 becomes an ellipse of area 10.")}>
        {r`\det\begin{bmatrix} a & b \\ c & d \end{bmatrix} = ad - bc`}
      </Equation>

      <H2>{tx(t, "mDet_signTitle", "The sign: kept or flipped")}</H2>
      <p>
        {tx(t, "mDet_signBody",
          "The formula can give a negative number, and that is not an error. Going from the first column to the second anticlockwise (the short way round), as î to ĵ does, gives a positive determinant. If the matrix puts the second column clockwise from the first, the plane has been flipped over like a page, and the determinant is negative. The mirror [[−1, 0], [0, 1]] has det = −1: areas are unchanged, orientation reversed. Letters read backwards, anticlockwise corners become clockwise, and the winding order from the area chapter swaps. This is the same sign as the 2D cross product of the two columns, and the same sign as the shoelace sum.")}
      </p>

      <H2>{tx(t, "mDet_zeroTitle", "Zero: the plane collapses")}</H2>
      <p>
        {tx(t, "mDet_zeroBody",
          "det A = 0 means the unit square has become a shape with no area: the two columns lie on the same line through the origin (one is a multiple of the other), or one is zero. Then the whole plane is squashed onto that line, or onto the single point 0. Many different points land on the same spot, so there is no way to tell where a point came from: the matrix cannot be undone. This is the geometric reason behind the systems chapter's rule that ad − bc = 0 means no unique solution.")}
      </p>

      <DeterminantFigure t={t} />

      <H2>{tx(t, "mDet_rulesTitle", "Rules that follow from the meaning")}</H2>
      <p>
        {tx(t, "mDet_rulesBody",
          "Because the determinant is a scale factor, doing two matrices in a row multiplies their factors: det(AB) = det A · det B. Scaling by 2 and then by 3 scales area by 6. From this and the gallery of basic moves, most rules can be read off without algebra.")}
      </p>
      <LessonTable
        headers={[tx(t, "mDet_tMat", "Matrix"), "det", tx(t, "mDet_tMeaning", "Meaning")]}
        rows={[
          [tx(t, "mDet_rId", "identity I"), "1", tx(t, "mDet_rIdM", "nothing changes")],
          [tx(t, "mDet_rRot", "rotation"), "cos² θ + sin² θ = 1", tx(t, "mDet_rRotM", "turning never changes area")],
          [tx(t, "mDet_rScale", "scale sx, sy"), "sx · sy", tx(t, "mDet_rScaleM", "width times height factors")],
          [tx(t, "mDet_rShear", "shear [1 k; 0 1]"), "1", tx(t, "mDet_rShearM", "Cavalieri: sliding layers keeps area")],
          [tx(t, "mDet_rFlip", "mirror"), "−1", tx(t, "mDet_rFlipM", "same area, flipped")],
          [tx(t, "mDet_rK", "kA (n × n)"), "kⁿ · det A", tx(t, "mDet_rKM", "each of the n directions is scaled by k")],
          [tx(t, "mDet_rT", "Aᵀ"), "det A", tx(t, "mDet_rTM", "swapping rows and columns keeps ad − bc")],
          [tx(t, "mDet_rInv", "A⁻¹"), "1 / det A", tx(t, "mDet_rInvM", "the undo must shrink by what A grew")],
        ]}
      />

      <H2>{tx(t, "mDet_3dTitle", "3 × 3: scaling volume")}</H2>
      <p>
        {tx(t, "mDet_3dBody",
          "In 3D, the unit cube becomes the slanted box (parallelepiped) spanned by the three columns, and the determinant is its signed volume. The cross product chapter already computed that volume: a · (b × c), the scalar triple product. Written out, it is a sum of 2 × 2 determinants. Take each entry of the first row, multiply it by the determinant of the 2 × 2 matrix left when you cross out that entry's row and column (its minor), and alternate the signs +, −, +. This is cofactor expansion along the first row.")}
      </p>
      <Equation label={tx(t, "mDet_eq3", "The determinant of a 3 × 3 matrix")}
        where={[
          [r`a, b, c`, tx(t, "mDet_wRow", "the first row, each used as a weight")],
          [r`\begin{vmatrix} e & f \\ h & i \end{vmatrix}`, tx(t, "mDet_wMinor", "the minor of a: delete row 1 and column 1, take the 2 × 2 determinant ei − fh")],
          [r`+,\ -,\ +`, tx(t, "mDet_wSigns", "the alternating signs of a chessboard pattern starting with + in the top-left corner")],
        ]}
        note={tx(t, "mDet_eq3Note", "Example: [[2, 0, 1], [1, 3, 0], [0, 1, 4]]. det = 2(3·4 − 0·1) − 0(1·4 − 0·0) + 1(1·1 − 3·0) = 2·12 − 0 + 1 = 25. A zero in the first row saves work: its term vanishes. In general, expand along whichever row or column has the most zeros.")}>
        {r`\det\begin{bmatrix} a & b & c \\ d & e & f \\ g & h & i \end{bmatrix} = a\begin{vmatrix} e & f \\ h & i \end{vmatrix} - b\begin{vmatrix} d & f \\ g & i \end{vmatrix} + c\begin{vmatrix} d & e \\ g & h \end{vmatrix}`}
      </Equation>
      <p>
        {tx(t, "mDet_3dSign",
          "The sign has the same meaning as in 2D: positive if the three columns form a right-handed set like x, y, z, negative if the matrix mirrors space (turning a right hand into a left hand), zero if all three columns lie in one plane and space is squashed flat.")}
      </p>

      <H2>{tx(t, "mDet_usesTitle", "What determinants are used for")}</H2>
      <H3>{tx(t, "mDet_orientTitle", "Which side of a line? The orientation test")}</H3>
      <p>
        {tx(t, "mDet_orientBody",
          "Given a line from A to B and a point P, the determinant of the two columns B − A and P − A is positive if P is to the left of the line (walking from A to B), negative if to the right, and zero if P is on the line. It is twice the signed area of triangle ABP. This one test, called orient2d, is the core of convex hulls, polygon triangulation, segment intersection and the GPU's rasteriser, which runs it for every pixel against a triangle's three edges.")}
      </p>
      <Equation label={tx(t, "mDet_eqOrient", "Orientation of three points")}
        where={[
          [r`B - A`, tx(t, "mDet_wBA", "the direction of the line")],
          [r`P - A`, tx(t, "mDet_wPA", "the arrow from the line's start to the point")],
          [r`> 0,\ < 0,\ = 0`, tx(t, "mDet_wSide", "left of the line, right of it, or exactly on it (with y pointing up)")],
        ]}>
        {r`\operatorname{orient}(A, B, P) = \det\begin{bmatrix} B_x - A_x & P_x - A_x \\ B_y - A_y & P_y - A_y \end{bmatrix} = (B_x - A_x)(P_y - A_y) - (P_x - A_x)(B_y - A_y)`}
      </Equation>
      <p>
        {tx(t, "mDet_windBody",
          "Apply it to the three corners of a triangle and you get its winding: positive for anticlockwise, negative for clockwise. That is backface culling. It also explains a classic bug: a model scaled by −1 on one axis has a transform with negative determinant, which reverses the winding of every triangle, so the GPU culls the front faces instead of the back ones. Engines check the sign of the determinant and flip the culling mode when it is negative.")}
      </p>

      <H3>{tx(t, "mDet_baryTitle", "Barycentric coordinates")}</H3>
      <p>
        {tx(t, "mDet_baryBody",
          "The triangles chapter promised a way to describe a point inside a triangle as a mix of its corners. Here it is. A point P splits triangle ABC into three smaller triangles: PBC (opposite A), APC (opposite B) and ABP (opposite C). Divide each one's signed area by the whole area and you get three weights u, v, w. They add up to 1, and P = uA + vB + wC exactly. The closer P is to a corner, the bigger that corner's triangle and weight: at A itself, u = 1 and v = w = 0.")}
      </p>
      <Equation label={tx(t, "mDet_eqBary", "Barycentric weights from signed areas")}
        where={[
          [r`\operatorname{area}(PBC)`, tx(t, "mDet_wArea", "signed area, half the orientation determinant; the sub-triangle opposite A")],
          [r`u + v + w = 1`, tx(t, "mDet_wSum", "the three pieces make up the whole triangle")],
          [r`u, v, w \ge 0`, tx(t, "mDet_wIn", "true exactly when P is inside the triangle (or on its edge)")],
        ]}
        note={tx(t, "mDet_baryNote", "Example: A = (0, 0), B = (4, 0), C = (0, 4), P = (1, 1). area(ABC) = 8. area(PBC) = 4, area(APC) = 2, area(ABP) = 2. So u = 0.5, v = 0.25, w = 0.25, and 0.5·(0, 0) + 0.25·(4, 0) + 0.25·(0, 4) = (1, 1). ✓")}>
        {r`u = \frac{\operatorname{area}(PBC)}{\operatorname{area}(ABC)} \qquad v = \frac{\operatorname{area}(APC)}{\operatorname{area}(ABC)} \qquad w = \frac{\operatorname{area}(ABP)}{\operatorname{area}(ABC)} \qquad P = uA + vB + wC`}
      </Equation>
      <p>
        {tx(t, "mDet_gpuBody",
          "This is how a GPU fills a triangle. For every pixel it computes u, v, w (the three edge tests it already runs, divided by the total). If one is negative the pixel is outside and skipped. Otherwise every value attached to the corners, colour, texture coordinates, normals, depth, is blended with the same weights: colour = u · colourA + v · colourB + w · colourC. The figure's second mode shows that blend.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mDet_epsTip", "Use the signs of the orientation determinants, not the areas' sizes, for inside tests, and be careful at exactly 0: a pixel on an edge shared by two triangles must be drawn by one of them only. GPUs use a \"top-left rule\" to decide ties, so shared edges never get drawn twice or left out.")}
      </Callout>

      <H2>{tx(t, "mDet_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mDet_ex1",
          "1. A sprite is drawn with the matrix [[2, 1], [0, 1.5]]. det = 2·1.5 − 1·0 = 3. A 16 × 16 sprite (area 256 pixels²) covers 768 pixels² on screen, and it is not mirrored, since det > 0.")}
      </p>
      <p>
        {tx(t, "mDet_ex2",
          "2. For which k is [[k, 2], [3, 6]] impossible to undo? det = 6k − 6 = 0 when k = 1. Then the columns (1, 3) and (2, 6) are parallel: the second is twice the first.")}
      </p>
      <p>
        {tx(t, "mDet_ex3",
          "3. Is P = (3, 1) left or right of the line from A = (0, 0) to B = (4, 4)? orient = (4 − 0)(1 − 0) − (3 − 0)(4 − 0) = 4 − 12 = −8 < 0: to the right, which fits, since P is below the diagonal y = x.")}
      </p>

      <H2>{tx(t, "mDet_codeTitle", "Determinants in C++")}</H2>
      <p>
        {tx(t, "mDet_codeBody",
          "Each function is one formula from this chapter. barycentric returns false when the triangle has no area (its determinant is 0), because dividing by it would produce infinities.")}
      </p>
      <CodeBlock lang="cpp" filename="det.hpp" t={t}>{`struct Vec2 { float x, y; };
struct Vec3 { float x, y, z; };

float det2(float a, float b, float c, float d) { return a * d - b * c; }

// Columns c0, c1, c2 of a 3x3 matrix: expansion along the first row
float det3(Vec3 c0, Vec3 c1, Vec3 c2) {
    return c0.x * det2(c1.y, c2.y, c1.z, c2.z)
         - c1.x * det2(c0.y, c2.y, c0.z, c2.z)
         + c2.x * det2(c0.y, c1.y, c0.z, c1.z);
}

// > 0: p is left of a->b, < 0: right, 0: on the line (twice the signed area)
float orient(Vec2 a, Vec2 b, Vec2 p) {
    return det2(b.x - a.x, p.x - a.x, b.y - a.y, p.y - a.y);
}

// Weights (u, v, w) with p = u*a + v*b + w*c; false if the triangle is flat
bool barycentric(Vec2 a, Vec2 b, Vec2 c, Vec2 p, float& u, float& v, float& w) {
    float area = orient(a, b, c);
    if (area == 0.0f) return false;
    u = orient(p, b, c) / area;               // sub-triangle opposite a
    v = orient(a, p, c) / area;               // opposite b
    w = 1.0f - u - v;                          // the three always sum to 1
    return true;
}

bool insideTriangle(Vec2 a, Vec2 b, Vec2 c, Vec2 p) {
    float u, v, w;
    return barycentric(a, b, c, p, u, v, w) && u >= 0 && v >= 0 && w >= 0;
}`}</CodeBlock>

      <H2>{tx(t, "mDet_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mDet_tWrong", "Wrong"), tx(t, "mDet_tRight", "Right"), tx(t, "mDet_tWhy", "Why")]}
        rows={[
          ["det = ab − cd", "det = ad − bc", tx(t, "mDet_m1", "multiply along the diagonals, not along the rows")],
          ["det(A + B) = det A + det B", tx(t, "mDet_m2r", "only det(AB) = det A · det B"), tx(t, "mDet_m2", "area factors multiply when moves are chained; sums have no such rule")],
          ["det(2A) = 2 det A", "det(2A) = 4 det A (2 × 2)", tx(t, "mDet_m3", "both width and height double")],
          [tx(t, "mDet_m4w", "treating a negative det as an error"), tx(t, "mDet_m4r", "it means the map mirrors"), tx(t, "mDet_m4", "the size is |det|; the sign is orientation")],
          [tx(t, "mDet_m5w", "forgetting the minus on the middle term (3 × 3)"), "+ − +", tx(t, "mDet_m5", "cofactor signs alternate like a chessboard")],
          ["if (det == 0)", "if (std::abs(det) < eps)", tx(t, "mDet_m6", "with floats a nearly flat matrix gives a tiny non-zero value")],
        ]}
      />

      <KeyIdeas t={t} id="mDet" items={[
        "A linear map scales every area by the same factor, the determinant.",
        "2 × 2: det = ad − bc, the signed area of the parallelogram of the columns.",
        "Negative: the plane is mirrored. Zero: it collapses and the matrix cannot be undone.",
        "det(AB) = det A · det B; rotations and shears have det 1.",
        "3 × 3: signed volume, the triple product, computed by cofactor expansion.",
        "Orientation tests, winding and barycentric weights are all 2 × 2 determinants.",
      ]} />
    </Article>
  );
}
