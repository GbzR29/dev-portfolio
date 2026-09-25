"use client";

// Vectors: points vs vectors, operations, length and normalisation, linear
// combinations; the dot product (projection, angles, facing, reflection,
// planes); the cross product (normals, handedness, bases, 2D orientation).

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "../../opengl/chapters/lighting-advanced";
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
          "A number can say how fast; it cannot say which way. A vector carries both: a magnitude and a direction, stored as one number per axis. Velocities, forces, offsets, surface normals, light directions and colours are all vectors, and almost every line of graphics and physics code manipulates them. This chapter builds the operations from their geometric meaning, so that each line of vector code draws a picture in your head.")}
      </Lead>

      <H2>{tx(t, "mVec_whatTitle", "Arrows and components")}</H2>
      <p>
        {tx(t, "mVec_whatBody",
          "Picture a vector as an arrow: its length is the magnitude, its heading is the direction, and where you draw it does not matter. An arrow 3 units right and 1 up is the same vector wherever it starts. To compute with it, write down how far it goes along each axis, its components: v = (3, 1) in 2D, v = (3, 1, −2) in 3D. The component form is what code stores; the arrow is what you should imagine.")}
      </p>
      <p>
        {tx(t, "mVec_pointsBody",
          "Points and vectors are both stored as a list of coordinates, but they are different things. A point is a location, a vector is a displacement. Their arithmetic reflects that: point − point = the vector from one to the other; point + vector = a point moved by the vector; vector + vector = the combined displacement. Adding two points (Paris + London) means nothing, with one exception: a weighted average whose weights sum to 1, such as the midpoint ½A + ½B, is again a point. Graphics makes the distinction explicit with the homogeneous coordinate w (1 for points, 0 for vectors), covered in the matrices chapters.")}
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
          [r`\lVert\mathbf v\rVert^2`, tx(t, "mVec_wSq", "the squared length, with no square root. To compare distances (\"is the enemy within 10 m?\"), compare squared values: d² < 100. Squaring preserves order for non-negative numbers, and it saves a square root per test")],
        ]}>
        {r`\lVert\mathbf v\rVert = \sqrt{v_x^2 + v_y^2 + v_z^2}`}
      </Equation>

      <H2>{tx(t, "mVec_normTitle", "Unit vectors and normalising")}</H2>
      <p>
        {tx(t, "mVec_normBody",
          "Often only the direction matters: which way is the player facing, which way is the light coming from, which way does this surface point? A vector of length 1, a unit vector, represents a pure direction; it is written with a hat, v̂. Dividing any non-zero vector by its length gives the unit vector with the same direction. Unit vectors are what make the dot product in the next chapter meaningful as an angle.")}
      </p>
      <Equation label={tx(t, "mVec_eqNorm", "Normalising")}
        where={[
          [r`\hat{\mathbf v}`, tx(t, "mVec_wHat", "the unit vector in the direction of v")],
          [r`\lVert\mathbf v\rVert \neq 0`, tx(t, "mVec_wNonZero", "the zero vector has no direction; dividing by its zero length produces NaN")],
        ]}>
        {r`\hat{\mathbf v} = \frac{\mathbf v}{\lVert\mathbf v\rVert}`}
      </Equation>
      <CodeBlock lang="cpp" filename="vec2.hpp" t={t}>{`struct Vec2 {
    float x = 0, y = 0;
    Vec2 operator+(Vec2 o) const { return { x + o.x, y + o.y }; }
    Vec2 operator-(Vec2 o) const { return { x - o.x, y - o.y }; }
    Vec2 operator*(float k) const { return { x * k, y * k }; }
};
float lengthSq(Vec2 v) { return v.x * v.x + v.y * v.y; }
float length(Vec2 v)   { return std::sqrt(lengthSq(v)); }

Vec2 normalizeOr(Vec2 v, Vec2 fallback) {          // never divide by (almost) zero
    float l2 = lengthSq(v);
    return l2 > 1e-12f ? v * (1.0f / std::sqrt(l2)) : fallback;
}

// Move toward a target at 'speed' units/s, without overshooting it
Vec2 moveTowards(Vec2 pos, Vec2 target, float speed, float dt) {
    Vec2 d = target - pos;
    float dist = length(d), step = speed * dt;
    if (dist <= step) return target;               // arrives this frame
    return pos + d * (step / dist);                // d / dist is the direction
}`}</CodeBlock>

      <H2>{tx(t, "mVec_combTitle", "Linear combinations and bases")}</H2>
      <p>
        {tx(t, "mVec_combBody",
          "Every 2D vector is a mix of two special vectors: î = (1, 0), one step along x, and ĵ = (0, 1), one step along y. The vector (3, 1) literally means 3î + 1ĵ. A pair of vectors that can build every vector this way is a basis, and the components are the recipe. Nothing forces the basis to be î and ĵ: any two non-parallel vectors work, and the same arrow then has a different recipe. Changing basis is what a transformation matrix does, and what converting between world space, a character's local space and the camera's space means. The matrices chapters start from exactly this idea.")}
      </p>
      <Equation label={tx(t, "mVec_eqBasis", "A vector as a linear combination")}
        where={[
          [r`\hat{\mathbf i},\ \hat{\mathbf j}`, tx(t, "mVec_wIJ", "the standard basis vectors along x and y")],
          [r`\mathbf e_1,\ \mathbf e_2`, tx(t, "mVec_wE", "any other basis, for example a character's right and forward directions")],
          [r`c_1, c_2`, tx(t, "mVec_wC", "the components of the same vector in that basis: \"2 steps right, 3 forward\" relative to the character")],
        ]}>
        {r`\mathbf v = v_x\,\hat{\mathbf i} + v_y\,\hat{\mathbf j} = c_1\,\mathbf e_1 + c_2\,\mathbf e_2`}
      </Equation>

      <H2>{tx(t, "mVec_codeTitle", "Vectors in real code")}</H2>
      <p>
        {tx(t, "mVec_codeBody",
          "In practice you will use a library: GLM in C++ (whose types match GLSL: glm::vec2, vec3, vec4), Unity's Vector3, Godot's Vector3, DirectXMath on Windows. They add swizzling (v.xy), component-wise multiplication (a * b multiplies x by x, y by y, useful for colours and scales) and SIMD versions that process four floats in one instruction. Everything in this chapter maps one-to-one onto those APIs.")}
      </p>
      <LessonTable
        headers={[tx(t, "mVec_tSym", "Symptom"), tx(t, "mVec_tCause", "Cause"), tx(t, "mVec_tFix", "Fix")]}
        rows={[
          [tx(t, "mVec_b1", "NaN positions after a collision"), tx(t, "mVec_c1", "normalising a zero-length vector"), tx(t, "mVec_f1", "guard with a length check and a fallback direction")],
          [tx(t, "mVec_b2", "Diagonal movement is faster"), tx(t, "mVec_c2", "input (1, 1) has length √2 ≈ 1.41"), tx(t, "mVec_f2", "normalise the input direction (or clamp its length to 1 for analog sticks)")],
          [tx(t, "mVec_b3", "Enemy rushes when far, crawls when close"), tx(t, "mVec_c3", "velocity = (target − pos) · speed, not normalised"), tx(t, "mVec_f3", "normalise the direction, then multiply by speed")],
          [tx(t, "mVec_b4", "Slow distance checks in a hot loop"), tx(t, "mVec_c4", "a square root per comparison"), tx(t, "mVec_f4", "compare squared lengths")],
          [tx(t, "mVec_b5", "Directions slowly stop being unit length"), tx(t, "mVec_c5", "rounding drift after many rotations"), tx(t, "mVec_f5", "renormalise occasionally")],
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
          "If you learn one vector operation well, make it the dot product. It turns two vectors into a single number that measures how much they point the same way. From that one number come angles, projections, \"is it in front of me?\", \"can the guard see me?\", diffuse lighting, reflections, sliding along walls and the distance to a plane.")}
      </Lead>

      <H2>{tx(t, "mDot_defTitle", "Two definitions, one number")}</H2>
      <p>
        {tx(t, "mDot_defBody",
          "The algebraic definition is what the computer does: multiply matching components and add the products. The geometric definition is what it means: the product of the two lengths and the cosine of the angle between them. That these two are equal is not obvious. It follows from the law of cosines from the trigonometry chapter: the triangle formed by a, b and b − a has sides |a|, |b| and |b − a|, so |b − a|² = |a|² + |b|² − 2|a||b|cos θ. Expanding |b − a|² in components gives |a|² + |b|² − 2(aₓbₓ + a_yb_y). Comparing the two lines, aₓbₓ + a_yb_y = |a||b|cos θ.")}
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
          ["> 0", "< 90°", tx(t, "mDot_m1", "roughly the same direction: in front, facing, lit")],
          ["= 0", "= 90°", tx(t, "mDot_m2", "perpendicular (orthogonal): a sideways relation")],
          ["< 0", "> 90°", tx(t, "mDot_m3", "roughly opposite: behind, facing away, in shadow")],
        ]}
      />

      <H2>{tx(t, "mDot_projTitle", "Projection: the shadow of one vector on another")}</H2>
      <p>
        {tx(t, "mDot_projBody",
          "Shine a light perpendicular to a onto b: the shadow b casts on the line of a is its projection. Its signed length is |b| cos θ, which is the dot product with a unit vector along a. Multiplying that length by â gives the projection as a vector. Subtracting it from b leaves the part of b perpendicular to a. Splitting a vector into \"along\" and \"across\" parts this way is one of the most-used tricks in game physics.")}
      </p>
      <Equation label={tx(t, "mDot_eqProj", "Scalar and vector projection")}
        where={[
          [r`\hat{\mathbf a}`, tx(t, "mDot_wAhat", "the unit vector along a, a / |a|")],
          [r`\mathbf b\cdot\hat{\mathbf a}`, tx(t, "mDot_wScalar", "the scalar projection: the signed length of b's shadow on a")],
          [r`(\mathbf b\cdot\hat{\mathbf a})\,\hat{\mathbf a}`, tx(t, "mDot_wVector", "the vector projection b∥: the shadow as an arrow along a")],
          [r`\mathbf b_\perp = \mathbf b - \mathbf b_\parallel`, tx(t, "mDot_wPerp", "the rest of b, perpendicular to a")],
        ]}
        note={tx(t, "mDot_eqProjNote", "Sliding along a wall is exactly this: remove the part of the velocity along the wall's normal n̂, v − (v · n̂)n̂, and the character slides along the wall instead of stopping dead.")}>
        {r`\mathbf b_\parallel = (\mathbf b\cdot\hat{\mathbf a})\,\hat{\mathbf a} = \frac{\mathbf a\cdot\mathbf b}{\mathbf a\cdot\mathbf a}\,\mathbf a \qquad \mathbf b_\perp = \mathbf b - \mathbf b_\parallel`}
      </Equation>

      <DotFigure t={t} />

      <H2>{tx(t, "mDot_angleTitle", "Angles, and when not to compute them")}</H2>
      <p>
        {tx(t, "mDot_angleBody",
          "Solving the geometric definition for θ gives the angle between two vectors: θ = acos(a · b / (|a||b|)). Two cautions. Rounding can push the fraction to 1.0000001 for parallel vectors, and acos of anything outside [−1, 1] is NaN, so clamp it. And most of the time you do not need the angle at all. To check whether something is within 30° of the forward direction, compare the dot product of the unit vectors with cos 30° ≈ 0.866: a larger cosine means a smaller angle. The cosine is a constant you compute once; acos per test is wasted work.")}
      </p>
      <CodeBlock lang="cpp" filename="dot_uses.cpp" t={t}>{`// Is the target in front of me? (no normalisation needed: only the sign matters)
bool inFront = dot(forward, target - pos) > 0;

// Can the guard see the player? Field of view 'fov', maximum range 'range'
bool canSee(Vec3 guardPos, Vec3 guardForward /*unit*/, Vec3 playerPos, float fov, float range) {
    Vec3  to   = playerPos - guardPos;
    float d2   = dot(to, to);                         // squared distance: a dot product too
    if (d2 > range * range) return false;
    float cosLimit = std::cos(fov * 0.5f);            // compute once per guard in real code
    return dot(guardForward, to) >= cosLimit * std::sqrt(d2);   // avoids normalising 'to'
}

// Angle between two directions, safely
float angleBetween(Vec3 a, Vec3 b) {
    float c = dot(a, b) / std::sqrt(dot(a, a) * dot(b, b));
    return std::acos(std::clamp(c, -1.0f, 1.0f));
}`}</CodeBlock>

      <H2>{tx(t, "mDot_lightTitle", "Lighting and reflection")}</H2>
      <p>
        {tx(t, "mDot_lightBody",
          "The brightness of a matte surface depends on how directly light hits it: a beam hitting at an angle spreads its energy over a larger area. That spreading factor is exactly the cosine between the surface normal n̂ and the direction to the light l̂, so diffuse lighting is max(n̂ · l̂, 0) (Lambert's cosine law; the OpenGL track's lighting chapters build on it). Reflection comes from the projection above: to bounce a direction d off a surface, keep the part along the surface and reverse the part along the normal. Reversing a part means subtracting it twice.")}
      </p>
      <Equation label={tx(t, "mDot_eqReflect", "Reflection")}
        where={[
          [r`\mathbf d`, tx(t, "mDot_wD", "the incoming direction (toward the surface)")],
          [r`\hat{\mathbf n}`, tx(t, "mDot_wN", "the unit surface normal")],
          [r`(\mathbf d\cdot\hat{\mathbf n})\,\hat{\mathbf n}`, tx(t, "mDot_wDn", "the part of d along the normal; it points into the surface, since d·n̂ < 0")],
        ]}
        note={tx(t, "mDot_eqReflectNote", "This is GLSL's reflect(d, n). With a restitution factor it becomes the bounce formula of the Game Dev collision chapter: v − (1 + e)(v · n̂)n̂.")}>
        {r`\mathbf r = \mathbf d - 2\,(\mathbf d\cdot\hat{\mathbf n})\,\hat{\mathbf n}`}
      </Equation>

      <H2>{tx(t, "mDot_planeTitle", "Planes and distances")}</H2>
      <p>
        {tx(t, "mDot_planeBody",
          "A plane is all the points whose projection onto a unit normal n̂ has the same value k: the floor is every point with (0, 1, 0) · p = 0, a wall is every point with (1, 0, 0) · p = 5. For any point p, n̂ · p − k is then its signed distance to the plane: positive on the side the normal points to, negative behind it. That one dot product is how frustum culling decides whether an object is inside the camera's view (six planes), how a character knows whether it is above the water line, and how BSP trees split levels.")}
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
          ["a · b = 0 ⇔ a ⊥ b", tx(t, "mDot_p5", "the test for perpendicular vectors (with a tolerance in floats)")],
        ]}
      />

      <KeyIdeas t={t} id="mDot" items={[
        "a · b = Σ aᵢbᵢ = |a||b| cos θ: how much two vectors agree.",
        "Sign: > 0 same side, 0 perpendicular, < 0 opposite. Often the sign is all you need.",
        "b · â is the shadow of b on a; b − (b · â)â is the part across a (sliding).",
        "Compare cosines instead of angles: dot(f̂, d̂) ≥ cos(fov/2).",
        "Lambert: max(n̂ · l̂, 0). Reflection: d − 2(d · n̂)n̂. Plane distance: n̂ · p − k.",
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
          "The dot product measures how much two vectors agree. The cross product builds something new: a third vector perpendicular to both. That is exactly what you need for the normal of a triangle, the \"right\" direction of a camera, the axis of a rotation or the torque of a force. Its 2D cousin, a single number, answers \"left or right?\" and \"clockwise or counter-clockwise?\", the basis of rasterisers and robust geometry code.")}
      </Lead>

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
          "Two directions are perpendicular to both a and b: a × b and its opposite. Which one you get is fixed by the right-hand rule: point the fingers of your right hand along a, curl them toward b, and your thumb points along a × b. Consequently the order matters: b × a = −(a × b). In OpenGL's right-handed coordinates (x right, y up, z toward the viewer), x × y = z.")}
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
      <H3>{tx(t, "mCross_normalTitle", "Triangle normals")}</H3>
      <p>
        {tx(t, "mCross_normalBody",
          "Two edges of a triangle, B − A and C − A, both lie in its plane, so their cross product is perpendicular to the triangle: its normal. The order of the corners decides which side it points to. With counter-clockwise corners (seen from the front), (B − A) × (C − A) points toward the viewer, which is why winding order decides front faces in OpenGL. Its length is twice the triangle's area, so normalising it after summing over the triangles around a vertex gives an area-weighted vertex normal for free.")}
      </p>
      <CodeBlock lang="cpp" filename="normals.cpp" t={t}>{`glm::vec3 faceNormal(glm::vec3 a, glm::vec3 b, glm::vec3 c) {
    return glm::normalize(glm::cross(b - a, c - a));   // counter-clockwise = front
}
float triangleArea(glm::vec3 a, glm::vec3 b, glm::vec3 c) {
    return 0.5f * glm::length(glm::cross(b - a, c - a));
}`}</CodeBlock>
      <H3>{tx(t, "mCross_basisTitle", "Building a basis: the camera")}</H3>
      <p>
        {tx(t, "mCross_basisBody",
          "A camera needs three perpendicular unit vectors: forward, right and up. You only know forward (toward the target) and roughly which way is up in the world. Crossing forward with world-up gives right, perpendicular to both; crossing right with forward gives the camera's true up. This is exactly what glm::lookAt does (see the OpenGL camera chapter). It fails when forward is parallel to world-up (looking straight up or down): the cross product is zero and there is no \"right\". Cameras avoid it by clamping the pitch below 90°.")}
      </p>
      <Equation label={tx(t, "mCross_eqBasis", "An orthonormal basis from two directions")}
        where={[
          [r`\hat{\mathbf f}`, tx(t, "mCross_wF", "forward, the normalised direction to the target")],
          [r`\mathbf u_{\text{world}}`, tx(t, "mCross_wUw", "the world's up, usually (0, 1, 0)")],
          [r`\hat{\mathbf r}`, tx(t, "mCross_wR", "right: perpendicular to forward and to world-up; normalise it, since f and u_world are not perpendicular in general")],
          [r`\hat{\mathbf u}`, tx(t, "mCross_wU", "the camera's up: already unit length, because r̂ and f̂ are perpendicular unit vectors")],
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
          "The orientation test \"is P left or right of the line A → B?\" is the sign of (B − A) × (P − A). With it: a triangle's winding is the sign of (B − A) × (C − A); a point is inside a triangle when it is on the same side of all three edges (the edge functions a GPU rasteriser evaluates for every pixel); two segments cross when each one's endpoints are on opposite sides of the other; a convex polygon's corners all turn the same way. The steering question \"should I turn left or right to face the target?\" is the sign of forward × toTarget.")}
      </p>
      <CodeBlock lang="cpp" filename="orient.hpp" t={t}>{`float cross2(Vec2 a, Vec2 b) { return a.x * b.y - a.y * b.x; }

// > 0: P left of A→B, < 0: right, 0: on the line
float orient(Vec2 A, Vec2 B, Vec2 P) { return cross2(B - A, P - A); }

bool pointInTriangle(Vec2 P, Vec2 A, Vec2 B, Vec2 C) {
    float d1 = orient(A, B, P), d2 = orient(B, C, P), d3 = orient(C, A, P);
    bool hasNeg = d1 < 0 || d2 < 0 || d3 < 0, hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);                       // all the same sign (or on an edge)
}

bool segmentsCross(Vec2 a, Vec2 b, Vec2 c, Vec2 d) {  // proper crossings only
    return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;
}`}</CodeBlock>

      <H2>{tx(t, "mCross_tripleTitle", "The scalar triple product")}</H2>
      <p>
        {tx(t, "mCross_tripleBody",
          "Combining both products, a · (b × c) is the signed volume of the slanted box (parallelepiped) spanned by the three vectors: b × c is the area of its base times the base's normal, and dotting with a multiplies by the height. It is zero when the three vectors lie in one plane, and its sign tells whether they form a right-handed or left-handed set. It is also the determinant of the 3 × 3 matrix with a, b, c as rows: the first hint of what determinants measure, the subject of the matrices chapters.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mCross_handWarn", "Handedness conventions differ. OpenGL, Blender and most maths texts are right-handed; DirectX, Unity and Unreal are left-handed (Unreal and Blender also use z as up). The cross product formula is the same everywhere, but the picture changes: in a left-handed system a × b follows the left-hand rule. When porting normals, winding orders or camera code between engines, expect exactly one sign to flip.")}
      </Callout>

      <KeyIdeas t={t} id="mCross" items={[
        "a × b is perpendicular to a and b, with length |a||b| sin θ (parallelogram area).",
        "Right-hand rule; order matters: b × a = −(a × b); parallel vectors give zero.",
        "Triangle normal: (B − A) × (C − A); winding decides which side it points to.",
        "Camera basis: right = f × up, up = right × f; degenerate when looking straight up.",
        "2D: aₓb_y − a_ybₓ; its sign answers left/right and clockwise/counter-clockwise.",
      ]} />
    </Article>
  );
}
