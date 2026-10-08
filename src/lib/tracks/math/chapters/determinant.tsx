"use client";

// Linear Algebra 5: the determinant — the factor by which a matrix scales
// area (volume in 3D), derived from the parallelogram; its sign as
// orientation and its zero as collapse; the product rule and the determinants
// of the basic moves; 3 × 3 by cofactor expansion and the triple product; and
// the everyday uses: orientation tests, winding, barycentric coordinates.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { DeterminantFigure } from "@/components/lesson/figures/math/DeterminantFigure";

const r = String.raw;
const num = (v: number) => String(Math.round(v * 1000) / 1000).replace("-", "−");
const par = (v: number) => (v < 0 ? `(${num(v)})` : num(v));

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

const detNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const d = v.a * v.d - v.b * v.c;
  const what = d > 0 ? tx(t, "mDet_liveKept", "areas × {k}, orientation kept")
    : d < 0 ? tx(t, "mDet_liveFlip", "areas × {k}, mirrored") : tx(t, "mDet_liveFlat", "collapsed: no inverse");
  return {
    tex: r`\det A = ${par(v.a)}\cdot ${par(v.d)} - ${par(v.b)}\cdot ${par(v.c)} = ${num(v.a * v.d)} - ${par(v.b * v.c)} = \green{${num(d)}} \qquad \text{${what.replace("{k}", num(Math.abs(d)))}}`,
  };
};

/** Weights of P in the triangle A = (0, 0), B = (4, 0), C = (0, 4), whose area is 8. */
function baryNumbers(v: Record<string, number>) {
  const aPBC = (16 - 4 * v.x - 4 * v.y) / 2, aAPC = (4 * v.x) / 2, aABP = (4 * v.y) / 2;
  const u = aPBC / 8, vv = aAPC / 8, w = aABP / 8;
  return {
    tex: r`\begin{gathered} u = \frac{${num(aPBC)}}{8} = \green{${num(u)}} \qquad v = \frac{${num(aAPC)}}{8} = \green{${num(vv)}} \qquad w = \frac{${num(aABP)}}{8} = \green{${num(w)}} \\ u + v + w = ${num(u + vv + w)} \end{gathered}`,
    meter: Math.min(u, vv, w) >= 0 ? 1 : 0,
    meterLabel: Math.min(u, vv, w) >= 0 ? "u, v, w ≥ 0" : "min(u, v, w) < 0",
  };
}

export function DeterminantContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mDet_intro",
          "The number ad − bc has turned up three times already: as the denominator of Cramer's rule in the systems chapter, as the 2D cross product, and in the shoelace formula for area. It is the determinant of the matrix [[a, b], [c, d]], and it has a clear geometric meaning: how much the matrix scales areas, and whether it flips the plane over. This chapter derives it from a picture and then puts it to work.")}
      </Lead>

      <Goals t={t} id="mDet" items={[
        "Compute a 2 × 2 and a 3 × 3 determinant.",
        "Read the determinant as the factor that scales every area or volume.",
        "Tell from its sign whether a transformation flips things over.",
        "Recognize a determinant of zero as space collapsing.",
      ]} />

      <H2>{tx(t, "mDet_scaleTitle", "Every area is scaled by the same factor")}</H2>
      <p>
        {tx(t, "mDet_scaleBody",
          "A linear map keeps grid lines straight, parallel and evenly spaced. So every little square of the grid becomes the same parallelogram, just moved to a different place. If one unit square becomes a parallelogram of area 3, then every square does, and any shape, which can be covered by tiny squares, also has its area multiplied by 3. One number describes what the matrix does to all areas. To find it, look at the one square that is easiest: the unit square with corners (0, 0), (1, 0), (1, 1), (0, 1). Its sides are î and ĵ, so after the matrix it is the parallelogram spanned by the two columns, (a, c) and (b, d).")}
      </p>

      <H2>{tx(t, "mDet_formulaTitle", "The area of that parallelogram")}</H2>
      <p>
        {tx(t, "mDet_formulaBody2",
          "Draw the parallelogram with corners 0, (a, c), (a + b, c + d) and (b, d), with all four numbers positive, and put the smallest rectangle around it. The parallelogram is what is left of the rectangle once the pieces outside it are cut away.")}
      </p>
      <Derivation t={t} label={tx(t, "mDet_eqBox", "The parallelogram's area, by cutting a rectangle")}
        steps={[
          { tex: r`\text{area}` },
          { tex: r`= (a + b)(c + d) - \text{corners}`, why: tx(t, "mDet_b1", "the surrounding rectangle is a + b wide and c + d tall; remove the pieces outside the parallelogram") },
          { tex: r`= (ac + ad + bc + bd) - (ac + bd + 2bc)`, why: tx(t, "mDet_b2", "the rectangle multiplied out; the corners are two triangles with legs a, c (together ac), two with legs b, d (together bd) and two b × c rectangles (together 2bc)") },
          { tex: r`= \green{ad - bc}`, why: tx(t, "mDet_b3", "ac and bd cancel, and bc − 2bc leaves −bc") },
        ]} />
      <Equation label={tx(t, "mDet_eq2", "The determinant of a 2 × 2 matrix")}
        where={[
          [r`\det A`, tx(t, "mDet_wDet", "the determinant, also written |A|; the signed area of the image of the unit square")],
          [r`ad`, tx(t, "mDet_wAD", "the product of the main diagonal (top left to bottom right)")],
          [r`bc`, tx(t, "mDet_wBC", "the product of the other diagonal, subtracted")],
        ]}
        note={tx(t, "mDet_eq2Note", "Example: [[3, 1], [1, 2]] has det = 3·2 − 1·1 = 5, so it multiplies every area by 5. A circle of area 2 becomes an ellipse of area 10.")}
        words={tx(t, "mDet_eq2Words", "Multiply down the main diagonal, multiply down the other diagonal, and subtract the second product from the first.")}>
        {r`\det\begin{bmatrix} a & b \\ c & d \end{bmatrix} = ad - bc`}
      </Equation>
      <LiveFormula label={tx(t, "mDet_liveDet", "Try it: a 2 × 2 determinant")}
        tex={r`\det\begin{bmatrix} a & b \\ c & d \end{bmatrix} = ad - bc`}
        vars={[
          { id: "a", label: "a", min: -4, max: 4, step: 1, value: 3, fmt: num },
          { id: "b", label: "b", min: -4, max: 4, step: 1, value: 1, fmt: num },
          { id: "c", label: "c", min: -4, max: 4, step: 1, value: 1, fmt: num },
          { id: "d", label: "d", min: -4, max: 4, step: 1, value: 2, fmt: num },
        ]}
        compute={detNumbers(t)}
        note={tx(t, "mDet_liveDetNote", "Starts on the example above. Swap the columns (a ↔ b, c ↔ d): same size, opposite sign. Make the second column a multiple of the first, such as a = 1, c = 2, b = 2, d = 4: the determinant is 0.")} />

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
        note={tx(t, "mDet_eq3Note", "Example: [[2, 0, 1], [1, 3, 0], [0, 1, 4]]. det = 2(3·4 − 0·1) − 0(1·4 − 0·0) + 1(1·1 − 3·0) = 2·12 − 0 + 1 = 25. A zero in the first row saves work: its term vanishes. In general, expand along whichever row or column has the most zeros.")}
        words={tx(t, "mDet_eq3Words", "Walk along the first row. For each entry, cover its row and column, take the 2 × 2 determinant of what is left, and multiply. Add the three results with signs plus, minus, plus.")}>
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
          "Given a line from A to B and a point P, the determinant of the two columns B − A and P − A is positive if P is to the left of the line (walking from A to B), negative if to the right, and zero if P is on the line. It is twice the signed area of triangle ABP. It is the same number as the 2D cross product of the vectors chapter, and it answers many geometric questions: whether a polygon is convex, whether two segments cross, which way a path turns.")}
      </p>
      <Equation label={tx(t, "mDet_eqOrient", "Orientation of three points")}
        where={[
          [r`B - A`, tx(t, "mDet_wBA", "the direction of the line")],
          [r`P - A`, tx(t, "mDet_wPA", "the arrow from the line's start to the point")],
          [r`> 0,\ < 0,\ = 0`, tx(t, "mDet_wSide", "left of the line, right of it, or exactly on it (with y pointing up)")],
        ]}
        words={tx(t, "mDet_orientWords", "Put the line's direction and the arrow to the point side by side as the two columns of a matrix; the sign of its determinant says on which side the point lies.")}>
        {r`\operatorname{orient}(A, B, P) = \det\begin{bmatrix} B_x - A_x & P_x - A_x \\ B_y - A_y & P_y - A_y \end{bmatrix} = (B_x - A_x)(P_y - A_y) - (P_x - A_x)(B_y - A_y)`}
      </Equation>
      <p>
        {tx(t, "mDet_windBody",
          "Apply it to the three corners of a triangle and you get its winding: positive for anticlockwise, negative for clockwise. It also shows what a mirror does: a map with a negative determinant reverses the winding of every triangle, turning anticlockwise corners into clockwise ones, the way a mirror turns a left glove into a right glove. So the sign of the determinant alone tells whether a transformation includes a reflection.")}
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
        note={tx(t, "mDet_baryNote", "Example: A = (0, 0), B = (4, 0), C = (0, 4), P = (1, 1). area(ABC) = 8. area(PBC) = 4, area(APC) = 2, area(ABP) = 2. So u = 0.5, v = 0.25, w = 0.25, and 0.5·(0, 0) + 0.25·(4, 0) + 0.25·(0, 4) = (1, 1). ✓")}
        words={tx(t, "mDet_baryWords", "Each corner's weight is the share of the whole triangle taken by the small triangle on the far side of P from that corner.")}>
        {r`u = \frac{\operatorname{area}(PBC)}{\operatorname{area}(ABC)} \qquad v = \frac{\operatorname{area}(APC)}{\operatorname{area}(ABC)} \qquad w = \frac{\operatorname{area}(ABP)}{\operatorname{area}(ABC)} \qquad P = uA + vB + wC`}
      </Equation>
      <LiveFormula label={tx(t, "mDet_liveBary", "Try it: move P in the example's triangle")}
        tex={r`u = \frac{\operatorname{area}(PBC)}{8} \qquad v = \frac{\operatorname{area}(APC)}{8} \qquad w = \frac{\operatorname{area}(ABP)}{8}`}
        vars={[
          { id: "x", label: tx(t, "mDet_livePx", "P's x"), min: -1, max: 5, step: 0.5, value: 1, fmt: num },
          { id: "y", label: tx(t, "mDet_livePy", "P's y"), min: -1, max: 5, step: 0.5, value: 1, fmt: num },
        ]}
        compute={baryNumbers}
        note={tx(t, "mDet_liveBaryNote", "A = (0, 0), B = (4, 0), C = (0, 4), as in the example. The bar is full while P is inside. Try P = (4, 0): v = 1, P is corner B. Try P = (3, 3): u is negative, because P has crossed the edge BC.")} />
      <p>
        {tx(t, "mDet_gpuBody",
          "The weights blend anything attached to the corners. Suppose the corners of a triangular field have measured heights of 10 m at A, 14 m at B and 12 m at C. The height at P = (1, 1) of the example is estimated as u · 10 + v · 14 + w · 12 = 0.5 · 10 + 0.25 · 14 + 0.25 · 12 = 5 + 3.5 + 3 = 11.5 m. The figure's second mode shows the same blend with colours at the corners.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mDet_epsTip", "For an inside test only the signs matter: P is inside when u, v and w are all at least 0. If one of them is 0, P lies on an edge; if two are 0, P is a corner. The centroid, where the three medians meet, is the point with u = v = w = 1/3.")}
      </Callout>

      <H2>{tx(t, "mDet_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mDet_ex1",
          "1. A drawing is transformed by the matrix [[2, 1], [0, 1.5]]. det = 2·1.5 − 1·0 = 3. A 16 cm × 16 cm square in it (area 256 cm²) becomes a parallelogram of 3 · 256 = 768 cm², and it is not mirrored, since det > 0.")}
      </p>
      <p>
        {tx(t, "mDet_ex2",
          "2. For which k is [[k, 2], [3, 6]] impossible to undo? det = 6k − 6 = 0 when k = 1. Then the columns (1, 3) and (2, 6) are parallel: the second is twice the first.")}
      </p>
      <p>
        {tx(t, "mDet_ex3",
          "3. Is P = (3, 1) left or right of the line from A = (0, 0) to B = (4, 4)? orient = (4 − 0)(1 − 0) − (3 − 0)(4 − 0) = 4 − 12 = −8 < 0: to the right, which fits, since P is below the diagonal y = x.")}
      </p>

      <H2>{tx(t, "mDet_handTitle", "3 × 3 determinants by hand")}</H2>
      <p>
        {tx(t, "mDet_handBody",
          "Expand along the first row: each entry times the 2 × 2 determinant left after deleting its row and column, with signs + − +. For A = [[2, 0, 1], [1, 3, 2], [1, 1, 1]]: the first term is 2 · (3 · 1 − 2 · 1) = 2 · 1 = 2; the second is − 0 · (…) = 0, with no need to work out its minor; the third is + 1 · (1 · 1 − 3 · 1) = −2. Total: 2 + 0 − 2 = 0. So this matrix squashes space flat, and indeed its columns lie in one plane: column 3, (1, 2, 1), is half of column 1, (2, 1, 1), plus half of column 2, (0, 3, 1).")}
      </p>
      <LessonTable
        headers={[tx(t, "mDet_tShort", "Shortcut"), tx(t, "mDet_tHow", "How it works")]}
        rows={[
          [tx(t, "mDet_s1a", "expand along any row or column"), tx(t, "mDet_s1", "the answer is the same; choose the one with the most zeros, since a zero entry kills its whole term. The signs follow the chessboard + − + / − + − / + − +")],
          [tx(t, "mDet_s2a", "triangular matrix"), tx(t, "mDet_s2", "if every entry below the diagonal is 0, the determinant is the product of the diagonal: det [[2, 5, 7], [0, 3, 1], [0, 0, 4]] = 2 · 3 · 4 = 24")],
          [tx(t, "mDet_s3a", "rule of Sarrus (3 × 3 only)"), tx(t, "mDet_s3", "copy the first two columns to the right; add the three products down to the right and subtract the three products up to the right")],
          [tx(t, "mDet_s4a", "two equal or proportional rows"), tx(t, "mDet_s4", "the determinant is 0 straight away: the rows (or columns) lie on one line or plane")],
        ]}
      />

      <H2>{tx(t, "mDet_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mDet_tWrong", "Wrong"), tx(t, "mDet_tRight", "Right"), tx(t, "mDet_tWhy", "Why")]}
        rows={[
          ["det = ab − cd", "det = ad − bc", tx(t, "mDet_m1", "multiply along the diagonals, not along the rows")],
          ["det(A + B) = det A + det B", tx(t, "mDet_m2r", "only det(AB) = det A · det B"), tx(t, "mDet_m2", "area factors multiply when moves are chained; sums have no such rule")],
          ["det(2A) = 2 det A", "det(2A) = 4 det A (2 × 2)", tx(t, "mDet_m3", "both width and height double")],
          [tx(t, "mDet_m4w", "treating a negative det as an error"), tx(t, "mDet_m4r", "it means the map mirrors"), tx(t, "mDet_m4", "the size is |det|; the sign is orientation")],
          [tx(t, "mDet_m5w", "forgetting the minus on the middle term (3 × 3)"), "+ − +", tx(t, "mDet_m5", "cofactor signs alternate like a chessboard")],
          [tx(t, "mDet_m6w", "Sarrus's diagonals on a 4 × 4"), tx(t, "mDet_m6r", "cofactor expansion"), tx(t, "mDet_m6", "the diagonal trick only works for 3 × 3 matrices")],
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
