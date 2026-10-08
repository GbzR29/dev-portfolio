"use client";

// Vectors: points vs vectors, operations, length and normalisation, linear
// combinations; the dot product (projection, angles, facing, reflection,
// planes); the cross product (normals, handedness, bases, 2D orientation).

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { VectorFigure } from "@/components/lesson/figures/math/VectorFigure";
import { DotFigure } from "@/components/lesson/figures/math/DotFigure";
import { CrossFigure } from "@/components/lesson/figures/math/CrossFigure";
import { Cross2DFigure } from "@/components/lesson/figures/math/Cross2DFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Vectors
// ═════════════════════════════════════════════════════════════════════════════

export function VectorsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mVec_intro",
          "A number can say how fast; it cannot say which way. A vector carries both: a magnitude and a direction, stored as one number per axis. Velocities, forces, displacements, winds and currents are all vectors, and geometry and physics are full of them. This chapter builds every operation from its geometric meaning and then computes it by hand, so that each formula draws a picture in your head.")}
      </Lead>

      <Goals t={t} id="mVec" items={[
        "Write a vector as components and draw it as an arrow.",
        "Add, subtract and scale vectors.",
        "Find a vector's length and turn it into a unit vector.",
        "Write any vector as a combination of basis vectors.",
      ]} />

      <H2>{tx(t, "mVec_whatTitle", "Arrows and components")}</H2>
      <p>
        {tx(t, "mVec_whatBody",
          "Picture a vector as an arrow: its length is the magnitude, its heading is the direction, and where you draw it does not matter. An arrow 3 units right and 1 up is the same vector wherever it starts. To compute with it, write down how far it goes along each axis, its components: v = (3, 1) in 2D, v = (3, 1, −2) in 3D. The component form is what you calculate with; the arrow is what you should imagine.")}
      </p>
      <p>
        {tx(t, "mVec_pointsBody",
          "Points and vectors are both stored as a list of coordinates, but they are different things. A point is a location, a vector is a displacement. Their arithmetic reflects that: point − point = the vector from one to the other; point + vector = a point moved by the vector; vector + vector = the combined displacement. Adding two points (Paris + London) means nothing, with one exception: a weighted average whose weights sum to 1, such as the midpoint ½A + ½B, is again a point. The matrices chapter makes the distinction explicit with one extra coordinate, 1 for points and 0 for vectors.")}
      </p>

      <H2>{tx(t, "mVec_opsTitle", "Adding, subtracting and scaling")}</H2>
      <p>
        {tx(t, "mVec_opsBody",
          "All three basic operations work component by component, and each has a simple picture. Adding places the arrows tip to tail: first move by a, then by b. Subtracting b − a gives the arrow from the tip of a to the tip of b. Multiplying by a number (a scalar) stretches the arrow, and a negative number reverses it. Try every mode of the figure.")}
      </p>
      <Equation label={tx(t, "mVec_eqOps", "Component-wise operations")}
        where={[
          [r`\mathbf a + \mathbf b`, tx(t, "mVec_wAdd", "tip to tail; commutative (a + b = b + a, the two paths around the parallelogram)")],
          [r`\mathbf b - \mathbf a`, tx(t, "mVec_wSub", "from a to b: \"to minus from\". Swapping the order reverses the arrow")],
          [r`k\,\mathbf a`, tx(t, "mVec_wScale", "stretch by k along the same line; k < 0 flips the direction")],
        ]}>
        {r`\mathbf a + \mathbf b = (a_x + b_x,\ a_y + b_y) \qquad \mathbf b - \mathbf a = (b_x - a_x,\ b_y - a_y) \qquad k\,\mathbf a = (k\,a_x,\ k\,a_y)`}
      </Equation>

      <VectorFigure t={t} />

      <H2>{tx(t, "mVec_lenTitle", "Length and distance")}</H2>
      <p>
        {tx(t, "mVec_lenBody",
          "A 2D vector's components are the two short sides of a right triangle whose hypotenuse is the vector, so Pythagoras gives its length. In 3D, apply it twice: first across the floor (x and z), then up (y), and the two square roots collapse into one. The distance between two points is the length of the vector between them.")}
      </p>
      <Equation label={tx(t, "mVec_eqLen", "Length (magnitude, norm)")}
        where={[
          [r`\lVert\mathbf v\rVert`, tx(t, "mVec_wNorm", "the length of v; also written |v|")],
          [r`\lVert\mathbf b - \mathbf a\rVert`, tx(t, "mVec_wDist", "the distance between points a and b")],
          [r`\lVert\mathbf v\rVert^2`, tx(t, "mVec_wSq", "the squared length, with no square root. To compare distances (\"is the boat within 10 km of the port?\"), compare squared values: d² < 100. Squaring preserves order for non-negative numbers, and it saves working out a square root")],
        ]}>
        {r`\lVert\mathbf v\rVert = \sqrt{v_x^2 + v_y^2 + v_z^2}`}
      </Equation>

      <H2>{tx(t, "mVec_normTitle", "Unit vectors and normalising")}</H2>
      <p>
        {tx(t, "mVec_normBody",
          "Often only the direction matters: which way is the wind blowing, which way does this road head, which way does this slope face? A vector of length 1, a unit vector, represents a pure direction; it is written with a hat, v̂. Dividing any non-zero vector by its length gives the unit vector with the same direction. Unit vectors are what make the dot product in the next chapter meaningful as an angle.")}
      </p>
      <Equation label={tx(t, "mVec_eqNorm", "Normalising")}
        where={[
          [r`\hat{\mathbf v}`, tx(t, "mVec_wHat", "the unit vector in the direction of v")],
          [r`\lVert\mathbf v\rVert \neq 0`, tx(t, "mVec_wNonZero", "the zero vector has no direction; dividing by its zero length is undefined")],
        ]}>
        {r`\hat{\mathbf v} = \frac{\mathbf v}{\lVert\mathbf v\rVert}`}
      </Equation>
      <p>
        {tx(t, "mVec_normEx",
          "By hand: v = (3, 4) has length √(9 + 16) = 5, so v̂ = (3/5, 4/5) = (0.6, 0.8). Check: 0.6² + 0.8² = 0.36 + 0.64 = 1 ✓. Unit vectors make \"go a given distance in a given direction\" easy. To walk 4 km from A = (1, 2) towards B = (7, 10): the offset is B − A = (6, 8), its length is 10, its direction is (0.6, 0.8), and 4 km along it lands at A + 4 · (0.6, 0.8) = (1 + 2.4, 2 + 3.2) = (3.4, 5.2).")}
      </p>

      <H2>{tx(t, "mVec_combTitle", "Linear combinations and bases")}</H2>
      <p>
        {tx(t, "mVec_combBody",
          "Every 2D vector is a mix of two special vectors: î = (1, 0), one step along x, and ĵ = (0, 1), one step along y. The vector (3, 1) literally means 3î + 1ĵ. A pair of vectors that can build every vector this way is a basis, and the components are the recipe. Nothing forces the basis to be î and ĵ: any two non-parallel vectors work, and the same arrow then has a different recipe. Changing basis is what a transformation matrix does, and it is how \"3 km east, 4 km north\" becomes \"so far along the river, so far across it\". The matrices chapters start from exactly this idea.")}
      </p>
      <Equation label={tx(t, "mVec_eqBasis", "A vector as a linear combination")}
        where={[
          [r`\hat{\mathbf i},\ \hat{\mathbf j}`, tx(t, "mVec_wIJ", "the standard basis vectors along x and y")],
          [r`\mathbf e_1,\ \mathbf e_2`, tx(t, "mVec_wE", "any other basis, for example the directions along and across a river")],
          [r`c_1, c_2`, tx(t, "mVec_wC", "the components of the same vector in that basis: \"2 along the river, 3 across it\"")],
        ]}>
        {r`\mathbf v = v_x\,\hat{\mathbf i} + v_y\,\hat{\mathbf j} = c_1\,\mathbf e_1 + c_2\,\mathbf e_2`}
      </Equation>

      <H2>{tx(t, "mVec_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mVec_ex1",
          "1. A hiker walks 3 km east and then 4 km north. The two displacements add tip to tail: (3, 0) + (0, 4) = (3, 4). She ends √(3² + 4²) = 5 km from the start, although she walked 7 km: lengths do not add unless the arrows point the same way.")}
      </p>
      <p>
        {tx(t, "mVec_ex2",
          "2. The distance between the points (1, 2, 2) and (4, 6, 14): the difference is (3, 4, 12), and √(9 + 16 + 144) = √169 = 13.")}
      </p>
      <p>
        {tx(t, "mVec_ex3",
          "3. Write v = (4, 1) in the basis e₁ = (1, 1), e₂ = (1, −1). We need c₁(1, 1) + c₂(1, −1) = (4, 1), that is c₁ + c₂ = 4 and c₁ − c₂ = 1. Adding the two equations gives 2c₁ = 5, so c₁ = 2.5 and c₂ = 1.5. Check: 2.5 · (1, 1) + 1.5 · (1, −1) = (2.5 + 1.5, 2.5 − 1.5) = (4, 1) ✓.")}
      </p>

      <H2>{tx(t, "mVec_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mVec_tWrong", "Wrong"), tx(t, "mVec_tRight", "Right"), tx(t, "mVec_tWhy", "Why")]}
        rows={[
          ["|(3, 4)| = 3 + 4 = 7", "|(3, 4)| = √(9 + 16) = 5", tx(t, "mVec_m1", "the components are the legs of a right triangle; the length is its hypotenuse")],
          [tx(t, "mVec_m2w", "B − A goes from B to A"), tx(t, "mVec_m2r", "B − A goes from A to B"), tx(t, "mVec_m2", "\"to minus from\": A + (B − A) = B")],
          ["|a + b| = |a| + |b|", "|a + b| ≤ |a| + |b|", tx(t, "mVec_m3", "equal only when a and b point the same way; otherwise the detour is longer")],
          [tx(t, "mVec_m4w", "normalising (0, 0)"), tx(t, "mVec_m4r", "the zero vector has no direction"), tx(t, "mVec_m4", "its length is 0, and dividing by 0 is undefined")],
          [tx(t, "mVec_m5w", "adding two points"), tx(t, "mVec_m5r", "subtract them, or average with weights summing to 1"), tx(t, "mVec_m5", "a sum of places depends on where the origin is; a difference does not")],
        ]}
      />

      <KeyIdeas t={t} id="mVec" items={[
        "A vector is a magnitude and a direction; components are one number per axis.",
        "point − point = vector; point + vector = point; a + b is tip to tail; b − a goes from a to b.",
        "|v| = √(x² + y² + z²); compare squared lengths when you only need an order.",
        "v / |v| is the unit direction; never normalise the zero vector.",
        "Any vector is a linear combination of basis vectors; changing basis is what matrices do.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// The Dot Product
// ═════════════════════════════════════════════════════════════════════════════

export function DotContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mDot_intro",
          "If you learn one vector operation well, make it the dot product. It turns two vectors into a single number that measures how much they point the same way. From that one number come angles, the test for perpendicular lines, projections, the work done by a force, reflections and the distance from a point to a plane.")}
      </Lead>

      <Goals t={t} id="mDot" items={[
        "Compute the dot product in two ways.",
        "Find the angle between two vectors.",
        "Project one vector onto another.",
        "Reflect a direction off a surface, and find a point's distance to a plane.",
      ]} />

      <H2>{tx(t, "mDot_defTitle", "Two definitions, one number")}</H2>
      <p>
        {tx(t, "mDot_defBody",
          "The algebraic definition is how you compute it: multiply matching components and add the products. The geometric definition is what it means: the product of the two lengths and the cosine of the angle between them. That these two are equal is not obvious. It follows from the law of cosines from the trigonometry chapter: the triangle formed by a, b and b − a has sides |a|, |b| and |b − a|, so |b − a|² = |a|² + |b|² − 2|a||b|cos θ. Expanding |b − a|² in components gives |a|² + |b|² − 2(aₓbₓ + a_yb_y). Comparing the two lines, aₓbₓ + a_yb_y = |a||b|cos θ.")}
      </p>
      <Equation label={tx(t, "mDot_eqDef", "The dot product")}
        where={[
          [r`\mathbf a\cdot\mathbf b`, tx(t, "mDot_wDot", "the dot product (also scalar product or inner product): a number, not a vector")],
          [r`\theta`, tx(t, "mDot_wTheta", "the angle between the two vectors, from 0 to π")],
          [r`\cos\theta`, tx(t, "mDot_wCos", "1 when they point the same way, 0 when perpendicular, −1 when opposite")],
        ]}
        note={tx(t, "mDot_eqDefNote", "In 3D add a z term: aₓbₓ + a_yb_y + a_zb_z. For unit vectors the lengths are 1, and the dot product is simply the cosine of the angle between them.")}>
        {r`\mathbf a\cdot\mathbf b = a_x b_x + a_y b_y + a_z b_z = \lVert\mathbf a\rVert\,\lVert\mathbf b\rVert\cos\theta`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mDot_tSign", "a · b"), tx(t, "mDot_tAngle", "Angle"), tx(t, "mDot_tMeaning", "Meaning")]}
        rows={[
          ["> 0", "< 90°", tx(t, "mDot_m1", "roughly the same direction: the angle between them is acute")],
          ["= 0", "= 90°", tx(t, "mDot_m2", "perpendicular (orthogonal): a right angle")],
          ["< 0", "> 90°", tx(t, "mDot_m3", "roughly opposite: the angle is obtuse")],
        ]}
      />

      <H2>{tx(t, "mDot_projTitle", "Projection: the shadow of one vector on another")}</H2>
      <p>
        {tx(t, "mDot_projBody",
          "Shine a light perpendicular to a onto b: the shadow b casts on the line of a is its projection. Its signed length is |b| cos θ, which is the dot product with a unit vector along a. Multiplying that length by â gives the projection as a vector. Subtracting it from b leaves the part of b perpendicular to a. Splitting a vector into \"along\" and \"across\" parts this way is one of the most-used tricks in physics: the weight of a box on a ramp splits into a part along the ramp, which makes it slide, and a part pressing into it.")}
      </p>
      <Equation label={tx(t, "mDot_eqProj", "Scalar and vector projection")}
        where={[
          [r`\hat{\mathbf a}`, tx(t, "mDot_wAhat", "the unit vector along a, a / |a|")],
          [r`\mathbf b\cdot\hat{\mathbf a}`, tx(t, "mDot_wScalar", "the scalar projection: the signed length of b's shadow on a")],
          [r`(\mathbf b\cdot\hat{\mathbf a})\,\hat{\mathbf a}`, tx(t, "mDot_wVector", "the vector projection b∥: the shadow as an arrow along a")],
          [r`\mathbf b_\perp = \mathbf b - \mathbf b_\parallel`, tx(t, "mDot_wPerp", "the rest of b, perpendicular to a")],
        ]}
        note={tx(t, "mDot_eqProjNote", "Example: b = (2, 4) projected on a = (3, 4). a · b = 6 + 16 = 22 and a · a = 25, so b∥ = (22/25)(3, 4) = (2.64, 3.52) and b⊥ = (2, 4) − (2.64, 3.52) = (−0.64, 0.48). Check: b⊥ · a = −1.92 + 1.92 = 0 ✓.")}>
        {r`\mathbf b_\parallel = (\mathbf b\cdot\hat{\mathbf a})\,\hat{\mathbf a} = \frac{\mathbf a\cdot\mathbf b}{\mathbf a\cdot\mathbf a}\,\mathbf a \qquad \mathbf b_\perp = \mathbf b - \mathbf b_\parallel`}
      </Equation>

      <DotFigure t={t} />

      <H2>{tx(t, "mDot_angleTitle", "Angles between vectors")}</H2>
      <p>
        {tx(t, "mDot_angleBody",
          "Solving the geometric definition for θ gives the angle between two vectors: θ = arccos(a · b / (|a||b|)). Example: a = (1, 0, 1) and b = (0, 1, 1). a · b = 0 + 0 + 1 = 1 and |a| = |b| = √2, so cos θ = 1/2 and θ = 60°. Often the angle itself is not needed. Whether it is acute, right or obtuse is just the sign of a · b. And to know whether it is below 30°, compare the cosine with cos 30° ≈ 0.866: on [0°, 180°] the cosine falls as the angle grows, so a larger cosine means a smaller angle.")}
      </p>
      <H3>{tx(t, "mDot_workTitle", "Work done by a force")}</H3>
      <p>
        {tx(t, "mDot_workBody",
          "In physics, a force F moving an object through a displacement d does work W = F · d (in joules, with F in newtons and d in metres). Only the part of the force along the motion counts: pulling a sled 50 m along flat ground with a rope that pulls with 100 N at 30° above the horizontal does W = 100 · 50 · cos 30° ≈ 4330 J. In components, F = (100 cos 30°, 100 sin 30°) ≈ (86.6, 50) and d = (50, 0), so F · d = 86.6 · 50 + 50 · 0 = 4330 J: the upward part of the pull does no work, because the sled does not move up.")}
      </p>

      <H2>{tx(t, "mDot_lightTitle", "Sunlight and reflection")}</H2>
      <p>
        {tx(t, "mDot_lightBody",
          "Sunlight falling on the ground at a slant spreads its energy over a larger area than light falling straight down; that is why winter sunshine warms so little. The fraction that arrives per square metre is the cosine between the surface normal n̂ (the unit vector sticking straight out of the surface) and the unit direction towards the sun l̂: it is n̂ · l̂ when that is positive, and 0 when the sun is behind the surface. This is Lambert's cosine law. Reflection comes from the projection above: a ball bouncing off a wall, or a light ray off a mirror, keeps the part of its direction along the surface and reverses the part along the normal. Reversing a part means subtracting it twice.")}
      </p>
      <Equation label={tx(t, "mDot_eqReflect", "Reflection")}
        where={[
          [r`\mathbf d`, tx(t, "mDot_wD", "the incoming direction (toward the surface)")],
          [r`\hat{\mathbf n}`, tx(t, "mDot_wN", "the unit surface normal")],
          [r`(\mathbf d\cdot\hat{\mathbf n})\,\hat{\mathbf n}`, tx(t, "mDot_wDn", "the part of d along the normal; it points into the surface, since d·n̂ < 0")],
        ]}
        note={tx(t, "mDot_eqReflectNote", "Example: a ray d = (3, −4) hits a floor with n̂ = (0, 1). d · n̂ = −4, so r = (3, −4) − 2 · (−4) · (0, 1) = (3, −4) + (0, 8) = (3, 4): the sideways part is kept, the downward part becomes upward, and the angle of incidence equals the angle of reflection.")}>
        {r`\mathbf r = \mathbf d - 2\,(\mathbf d\cdot\hat{\mathbf n})\,\hat{\mathbf n}`}
      </Equation>

      <H2>{tx(t, "mDot_planeTitle", "Planes and distances")}</H2>
      <p>
        {tx(t, "mDot_planeBody",
          "A plane is all the points whose projection onto a unit normal n̂ has the same value k: the floor is every point with (0, 1, 0) · p = 0, a wall is every point with (1, 0, 0) · p = 5. For any point p, n̂ · p − k is then its signed distance to the plane: positive on the side the normal points to, negative behind it. Example: the plane x + 2y + 2z = 6. Its normal (1, 2, 2) has length 3, so dividing the whole equation by 3 gives n̂ = (1/3, 2/3, 2/3) and k = 2. The point p = (4, 4, 1) has n̂ · p = (4 + 8 + 2)/3 = 14/3, so it lies 14/3 − 2 = 8/3 ≈ 2.67 units from the plane, on the side the normal points to.")}
      </p>
      <Equation label={tx(t, "mDot_eqPlane", "A plane and the signed distance to it")}
        where={[
          [r`\hat{\mathbf n}`, tx(t, "mDot_wPn", "the plane's unit normal")],
          [r`k`, tx(t, "mDot_wK", "the plane's offset: its signed distance from the origin along n̂ (k = n̂ · q for any point q on the plane)")],
          [r`\mathbf p`, tx(t, "mDot_wP", "any point")],
        ]}>
        {r`\text{plane: } \hat{\mathbf n}\cdot\mathbf x = k \qquad \operatorname{dist}(\mathbf p) = \hat{\mathbf n}\cdot\mathbf p - k`}
      </Equation>

      <H3>{tx(t, "mDot_propsTitle", "Properties")}</H3>
      <LessonTable
        headers={[tx(t, "mDot_tProp", "Property"), tx(t, "mDot_tUse2", "What it gives you")]}
        rows={[
          ["a · b = b · a", tx(t, "mDot_p1", "the order does not matter")],
          ["a · (b + c) = a · b + a · c", tx(t, "mDot_p2", "projections of a sum are the sum of projections")],
          ["(k a) · b = k (a · b)", tx(t, "mDot_p3", "scaling one vector scales the result")],
          ["a · a = |a|²", tx(t, "mDot_p4", "squared length for free: the cheapest way to compute it")],
          ["a · b = 0 ⇔ a ⊥ b", tx(t, "mDot_p5", "the test for perpendicular vectors (the zero vector counts as perpendicular to every vector)")],
        ]}
      />

      <KeyIdeas t={t} id="mDot" items={[
        "a · b = Σ aᵢbᵢ = |a||b| cos θ: how much two vectors agree.",
        "Sign: > 0 same side, 0 perpendicular, < 0 opposite. Often the sign is all you need.",
        "b · â is the shadow of b on a; b − (b · â)â is the part across a (sliding).",
        "θ = arccos(a · b / (|a||b|)); to compare angles, compare their cosines.",
        "Work: F · d. Sunlight: n̂ · l̂. Reflection: d − 2(d · n̂)n̂. Plane distance: n̂ · p − k.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// The Cross Product
// ═════════════════════════════════════════════════════════════════════════════

export function CrossContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mCross_intro",
          "The dot product measures how much two vectors agree. The cross product builds something new: a third vector perpendicular to both. That is exactly what you need for the plane through three points, the area of a triangle in space, the axis of a rotation or the torque of a force. Its 2D cousin, a single number, answers \"left or right?\" and \"clockwise or counter-clockwise?\".")}
      </Lead>

      <Goals t={t} id="mCross" items={[
        "Compute the cross product of two 3D vectors.",
        "Use it to find a surface's normal and a parallelogram's area.",
        "Tell left from right, and clockwise from counter-clockwise, with the 2D cross product.",
        "Find a volume with the scalar triple product.",
      ]} />

      <H2>{tx(t, "mCross_defTitle", "Definition")}</H2>
      <p>
        {tx(t, "mCross_defBody",
          "The cross product only exists in 3D (and, as a scalar, in 2D). Each component is built from the other two axes: the x component uses y and z, the y component uses z and x, the z component uses x and y, each as \"this times that minus that times this\". The pattern cycles x → y → z → x.")}
      </p>
      <Equation label={tx(t, "mCross_eqDef", "The cross product")}
        where={[
          [r`\mathbf a\times\mathbf b`, tx(t, "mCross_wCross", "a vector perpendicular to both a and b")],
          [r`\lVert\mathbf a\times\mathbf b\rVert`, tx(t, "mCross_wLen", "its length: |a||b| sin θ, the area of the parallelogram spanned by a and b")],
          [r`\theta`, tx(t, "mCross_wTheta", "the angle between a and b. sin θ is 0 for parallel vectors, so their cross product is the zero vector")],
        ]}
        note={tx(t, "mCross_eqDefNote", "Check perpendicularity with the dot product: a · (a × b) = aₓ(a_yb_z − a_zb_y) + a_y(a_zbₓ − aₓb_z) + a_z(aₓb_y − a_ybₓ) = 0, since every term cancels with another.")}>
        {r`\mathbf a\times\mathbf b = \big(a_y b_z - a_z b_y,\;\; a_z b_x - a_x b_z,\;\; a_x b_y - a_y b_x\big)`}
      </Equation>
      <p>
        {tx(t, "mCross_dirBody",
          "Two directions are perpendicular to both a and b: a × b and its opposite. Which one you get is fixed by the right-hand rule: point the fingers of your right hand along a, curl them toward b, and your thumb points along a × b. Consequently the order matters: b × a = −(a × b). In the usual right-handed axes (x right, y up, z towards you), x × y = z.")}
      </p>

      <CrossFigure t={t} />

      <H3>{tx(t, "mCross_propsTitle", "Properties")}</H3>
      <LessonTable
        headers={[tx(t, "mCross_tProp", "Property"), tx(t, "mCross_tNote", "Note")]}
        rows={[
          ["b × a = −(a × b)", tx(t, "mCross_p1", "anti-commutative: swapping flips the direction")],
          ["a × a = 0", tx(t, "mCross_p2", "parallel vectors span no area")],
          ["a × (b + c) = a × b + a × c", tx(t, "mCross_p3", "distributive")],
          ["(a × b) × c ≠ a × (b × c)", tx(t, "mCross_p4", "not associative: the grouping matters")],
          ["x̂ × ŷ = ẑ, ŷ × ẑ = x̂, ẑ × x̂ = ŷ", tx(t, "mCross_p5", "the cycle of a right-handed basis")],
        ]}
      />

      <H2>{tx(t, "mCross_usesTitle", "What it is used for")}</H2>
      <H3>{tx(t, "mCross_normalTitle", "The plane through three points")}</H3>
      <p>
        {tx(t, "mCross_normalBody",
          "Two edges of a triangle, B − A and C − A, both lie in its plane, so their cross product is perpendicular to the triangle: its normal. The order of the corners decides which side it points to: if the corners run anticlockwise as seen from one side, (B − A) × (C − A) points towards that side. Its length is the area of the parallelogram on the two edges, which is twice the triangle's area. And once the normal n is known, the plane's equation follows: every point x of the plane satisfies n · x = n · A.")}
      </p>
      <p>
        {tx(t, "mCross_normalEx",
          "By hand, for A = (1, 0, 0), B = (0, 2, 0), C = (0, 0, 3). The edges are B − A = (−1, 2, 0) and C − A = (−1, 0, 3). Their cross product, component by component: x = 2 · 3 − 0 · 0 = 6, y = 0 · (−1) − (−1) · 3 = 3, z = (−1) · 0 − 2 · (−1) = 2, so n = (6, 3, 2). Its length is √(36 + 9 + 4) = 7, so the triangle's area is 7/2 = 3.5. The plane: n · A = 6, so 6x + 3y + 2z = 6. Check B: 0 + 6 + 0 = 6 ✓; C: 0 + 0 + 6 = 6 ✓.")}
      </p>
      <H3>{tx(t, "mCross_basisTitle", "Completing a set of perpendicular axes")}</H3>
      <p>
        {tx(t, "mCross_basisBody",
          "Often one direction is given and two more are needed to make three perpendicular axes: a surveyor looking along a sloping road wants the directions \"to the right of the road\" and \"up from the road\". Only the road's direction f is known, plus the rough vertical. Crossing f with the vertical gives a direction perpendicular to both, the right; crossing the right with f gives the true up, perpendicular to the road. It fails when f itself is vertical: the cross product is then zero and \"right\" has no meaning.")}
      </p>
      <Equation label={tx(t, "mCross_eqBasis", "An orthonormal basis from two directions")}
        where={[
          [r`\hat{\mathbf f}`, tx(t, "mCross_wF", "the given direction, normalised")],
          [r`\mathbf u_{\text{world}}`, tx(t, "mCross_wUw", "a rough up direction, usually the vertical (0, 1, 0)")],
          [r`\hat{\mathbf r}`, tx(t, "mCross_wR", "right: perpendicular to f and to the vertical; normalise it, since f and the vertical are not perpendicular in general")],
          [r`\hat{\mathbf u}`, tx(t, "mCross_wU", "the corrected up: already unit length, because r̂ and f̂ are perpendicular unit vectors")],
        ]}>
        {r`\hat{\mathbf r} = \frac{\hat{\mathbf f}\times\mathbf u_{\text{world}}}{\lVert\hat{\mathbf f}\times\mathbf u_{\text{world}}\rVert} \qquad \hat{\mathbf u} = \hat{\mathbf r}\times\hat{\mathbf f}`}
      </Equation>
      <H3>{tx(t, "mCross_physTitle", "Rotation and torque")}</H3>
      <p>
        {tx(t, "mCross_physBody",
          "In physics, a body spinning with angular velocity ω (a vector along the spin axis, with length = radians per second) moves each of its points at velocity ω × r, where r is the point's offset from the axis. A force F applied at offset r from the centre of mass creates a torque τ = r × F: pushing a door far from its hinge (large r) and perpendicular to it (sin θ = 1) turns it best.")}
      </p>

      <H2>{tx(t, "mCross_2dTitle", "The 2D cross product")}</H2>
      <p>
        {tx(t, "mCross_2dBody",
          "Put two 2D vectors into 3D with z = 0 and take their cross product. The x and y components vanish (they involve z) and only the z component is left: aₓb_y − a_ybₓ. That single number is the signed area of the parallelogram spanned by a and b, positive when b is counter-clockwise from a (to its left) and negative when clockwise. It is sometimes called the perp-dot product, because it equals a⊥ · b with a⊥ = (−a_y, aₓ), a rotated 90°.")}
      </p>
      <Equation label={tx(t, "mCross_eq2d", "2D cross product (perp-dot)")}
        where={[
          [r`\mathbf a\times\mathbf b`, tx(t, "mCross_w2d", "a scalar in 2D")],
          [r`> 0,\ < 0,\ = 0`, tx(t, "mCross_wSign", "b is to the left of a (counter-clockwise), to the right (clockwise), or parallel")],
        ]}>
        {r`\mathbf a\times\mathbf b = a_x b_y - a_y b_x = \lVert\mathbf a\rVert\,\lVert\mathbf b\rVert\sin\theta`}
      </Equation>

      <Cross2DFigure t={t} />

      <p>
        {tx(t, "mCross_2dUses",
          "The orientation test \"is P left or right of the line A → B?\" is the sign of (B − A) × (P − A). With it: a triangle's winding is the sign of (B − A) × (C − A); a point is inside a triangle when it is on the same side of all three edges; two segments cross when each one's endpoints are on opposite sides of the other; a convex polygon's corners all turn the same way. A helmsman's question \"do I turn left or right to head for the buoy?\" is the sign of heading × toBuoy.")}
      </p>
      <p>
        {tx(t, "mCross_2dEx",
          "By hand: is P = (1, 3) inside the triangle A = (0, 0), B = (4, 1), C = (1, 4)? Edge A → B: (4, 1) × (1, 3) = 4 · 3 − 1 · 1 = 11 > 0, left. Edge B → C: (C − B) × (P − B) = (−3, 3) × (−3, 2) = (−3) · 2 − 3 · (−3) = −6 + 9 = 3 > 0, left. Edge C → A: (A − C) × (P − C) = (−1, −4) × (0, −1) = (−1)(−1) − (−4) · 0 = 1 > 0, left. All three positive, so P is inside, and the triangle runs anticlockwise.")}
      </p>

      <H2>{tx(t, "mCross_tripleTitle", "The scalar triple product")}</H2>
      <p>
        {tx(t, "mCross_tripleBody",
          "Combining both products, a · (b × c) is the signed volume of the slanted box (parallelepiped) spanned by the three vectors: b × c is the area of its base times the base's normal, and dotting with a multiplies by the height. It is zero when the three vectors lie in one plane, and its sign tells whether they form a right-handed or left-handed set. It is also the determinant of the 3 × 3 matrix with a, b, c as rows: the first hint of what determinants measure, the subject of the matrices chapters.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mCross_handWarn", "Mathematics and physics use right-handed axes. A mirror image of those axes, with z pointing the other way, is left-handed. The cross product formula stays the same in both, but the picture changes: in left-handed axes a × b follows the left-hand rule. When comparing drawings or data from different sources, check which way z points before trusting the direction of a cross product.")}
      </Callout>

      <KeyIdeas t={t} id="mCross" items={[
        "a × b is perpendicular to a and b, with length |a||b| sin θ (parallelogram area).",
        "Right-hand rule; order matters: b × a = −(a × b); parallel vectors give zero.",
        "Plane through A, B, C: n = (B − A) × (C − A), then n · x = n · A.",
        "Perpendicular axes: right = f × up, up = right × f; this fails when f is vertical.",
        "2D: aₓb_y − a_ybₓ; its sign answers left/right and clockwise/counter-clockwise.",
      ]} />
    </Article>
  );
}
