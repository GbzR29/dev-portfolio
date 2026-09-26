"use client";

// Linear Algebra 9: quaternions — the ways to store a 3D orientation (Euler
// angles and gimbal lock, matrices, axis–angle), Hamilton's i, j, k, the
// product in scalar–vector form (dot and cross), conjugate and inverse, the
// rotation q v q* and why the angle is halved, composing, the double cover,
// nlerp and slerp, conversion to a matrix, a comparison table, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { QuaternionFigure } from "@/components/lesson/figures/math/QuaternionFigure";

const r = String.raw;

export function QuaternionsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mQuat_intro",
          "In 2D an orientation is one angle, and the complex numbers chapter showed that a unit complex number stores it perfectly: multiply to rotate, multiply to combine. 3D is harder. Every engine needs to store which way a camera, a bone or a spaceship is facing, combine rotations, and blend smoothly between two orientations. Three angles break down, matrices are bulky and drift. Quaternions, four numbers invented by William Rowan Hamilton in 1843, do the job best, and are what Unity, Unreal and every animation system use. This chapter builds them from the complex numbers and the dot and cross products.")}
      </Lead>

      <H2>{tx(t, "mQuat_optionsTitle", "Three ways that almost work")}</H2>
      <H3>{tx(t, "mQuat_eulerTitle", "Euler angles and gimbal lock")}</H3>
      <p>
        {tx(t, "mQuat_eulerBody",
          "The obvious way to describe an orientation is three angles: yaw (turn left or right about the vertical axis), pitch (tilt the nose up or down) and roll (tip about the nose), applied in that order. These are Euler angles, and they are great for a human typing values into an editor or for a first-person camera that only yaws and pitches. But each turn happens about an axis that the previous turns have already moved. Pitch the nose straight up (90°) and the roll axis, the nose, now points along the yaw axis. Yaw and roll then do the same thing, and one of the three ways of turning is gone. This is gimbal lock, named after the nested rings (gimbals) of a gyroscope, which physically jam in the same way. Near that pose, small changes in orientation need huge jumps in the angles, and blending two sets of angles takes odd, curving routes.")}
      </p>
      <H3>{tx(t, "mQuat_matTitle", "Rotation matrices")}</H3>
      <p>
        {tx(t, "mQuat_matBody",
          "A 3 × 3 rotation matrix has no gimbal lock: its columns are simply where the three axes point. But it uses nine numbers for three degrees of freedom, so after many multiplications rounding errors make the columns slightly non-perpendicular or non-unit, and the object starts to shear and scale. Repairing that needs re-orthogonalisation. And blending two matrices entry by entry does not give a rotation halfway between them: the average of a matrix and its 180° turn is the zero matrix.")}
      </p>
      <H3>{tx(t, "mQuat_aaTitle", "Axis and angle")}</H3>
      <p>
        {tx(t, "mQuat_aaBody",
          "The eigenvalues chapter proved Euler's rotation theorem: every 3D rotation is one turn by some angle θ about some axis, a unit vector n. So a rotation is naturally four numbers (n and θ) with no gimbal lock. It is ideal for describing a rotation (\"turn 30° about this hinge\") but awkward to compute with: there is no simple rule for combining two axis–angle rotations into one. Quaternions are axis–angle in a form that can be multiplied.")}
      </p>

      <H2>{tx(t, "mQuat_hamTitle", "Hamilton's i, j and k")}</H2>
      <p>
        {tx(t, "mQuat_hamBody",
          "Complex numbers use one imaginary unit to rotate a plane. Hamilton spent years trying to rotate space with two and failed; the breakthrough was to use three, i, j and k, each squaring to −1, together with one extra rule, famously carved into a Dublin bridge: i² = j² = k² = ijk = −1. From it all the products follow. For example, multiply ijk = −1 on the right by k: ijk² = −k, so ij(−1) = −k and ij = k. In the same way jk = i and ki = j. Reversing the order flips the sign: ji = −k, kj = −i, ik = −j. This is exactly the pattern of the cross product of the unit axes, x × y = z but y × x = −z, and it means quaternion multiplication is not commutative, just as 3D rotations do not commute.")}
      </p>
      <Equation label={tx(t, "mQuat_eqRules", "Hamilton's multiplication rules")}
        where={[
          [r`i^2 = j^2 = k^2 = -1`, tx(t, "mQuat_wSq", "each unit on its own behaves like the complex i")],
          [r`ij = k,\ jk = i,\ ki = j`, tx(t, "mQuat_wCyc", "going round the cycle i → j → k gives the next unit, like x × y = z")],
          [r`ji = -k,\ kj = -i,\ ik = -j`, tx(t, "mQuat_wAnti", "going backwards gives a minus sign: order matters")],
        ]}>
        {r`i^2 = j^2 = k^2 = ijk = -1`}
      </Equation>

      <H2>{tx(t, "mQuat_defTitle", "Quaternions and their product")}</H2>
      <p>
        {tx(t, "mQuat_defBody",
          "A quaternion is q = w + xi + yj + zk, four real numbers. It is convenient to split it into a scalar part w and a vector part v = (x, y, z), and write q = (w, v). A quaternion with w = 0 is a pure quaternion and can stand for an ordinary 3D vector. Adding works component by component. For multiplying, expand the two brackets of four terms (sixteen products) using Hamilton's rules and collect them. The result is remarkably tidy: the dot product and the cross product both appear.")}
      </p>
      <Equation label={tx(t, "mQuat_eqMul", "The quaternion product in scalar–vector form")}
        where={[
          [r`w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2`, tx(t, "mQuat_wScal", "the scalar part: the vector parts' products i·i, j·j, k·k each give −1, which is where the minus dot product comes from")],
          [r`w_1\mathbf{v}_2 + w_2\mathbf{v}_1`, tx(t, "mQuat_wMix", "each scalar scales the other's vector")],
          [r`\mathbf{v}_1\times\mathbf{v}_2`, tx(t, "mQuat_wCross", "the mixed products ij = k, ji = −k, … form the cross product; it is why q₁q₂ ≠ q₂q₁")],
        ]}
        note={tx(t, "mQuat_mulNote", "Example: i · j is (0, (1, 0, 0)) times (0, (0, 1, 0)): scalar 0 − 0 = 0, vector 0 + 0 + (1, 0, 0) × (0, 1, 0) = (0, 0, 1). So ij = k. ✓ With the order swapped the cross product flips: ji = −k.")}>
        {r`(w_1, \mathbf{v}_1)(w_2, \mathbf{v}_2) = \big(w_1w_2 - \mathbf{v}_1\cdot\mathbf{v}_2,\ \ w_1\mathbf{v}_2 + w_2\mathbf{v}_1 + \mathbf{v}_1\times\mathbf{v}_2\big)`}
      </Equation>
      <p>
        {tx(t, "mQuat_conjBody",
          "As with complex numbers, the conjugate flips the imaginary part: q* = (w, −v). A quaternion times its conjugate is its squared length: qq* = w² + x² + y² + z² = |q|², a plain number. So the inverse is q⁻¹ = q*/|q|². A unit quaternion, one with |q| = 1, has inverse q⁻¹ = q*, just like a unit complex number.")}
      </p>

      <H2>{tx(t, "mQuat_rotTitle", "Rotating a vector")}</H2>
      <p>
        {tx(t, "mQuat_rotBody",
          "Here is the recipe. To rotate by θ about the unit axis n, build the unit quaternion q = (cos(θ/2), sin(θ/2) n). Write the vector to rotate as a pure quaternion (0, v). Multiply q on the left and q* on the right. The result is again a pure quaternion, and its vector part is v rotated by θ about n. Note the half angle: the vector is multiplied by q twice, once on each side.")}
      </p>
      <Equation label={tx(t, "mQuat_eqRot", "Rotation by a unit quaternion")}
        where={[
          [r`\mathbf{n}`, tx(t, "mQuat_wN", "the axis of rotation, a unit vector")],
          [r`\theta`, tx(t, "mQuat_wTh", "the angle, anticlockwise when looking down the axis toward the origin (right-hand rule)")],
          [r`\cos\frac{\theta}{2},\ \sin\frac{\theta}{2}`, tx(t, "mQuat_wHalf", "half the angle; cos² + sin² = 1 makes q a unit quaternion")],
          [r`q\,\mathbf{v}\,q^*`, tx(t, "mQuat_wSand", "the \"sandwich\": v as a pure quaternion, multiplied by q on the left and its conjugate on the right")],
        ]}
        note={tx(t, "mQuat_rotNote", "Example: 90° about the z-axis. q = (cos 45°, sin 45° · (0, 0, 1)) = (0.707, 0, 0, 0.707). Rotating v = (1, 0, 0) gives (0, 1, 0): x turns toward y, as a quarter turn about z should.")}>
        {r`q = \left(\cos\tfrac{\theta}{2},\ \sin\tfrac{\theta}{2}\,\mathbf{n}\right) \qquad \mathbf{v}' = q\,\mathbf{v}\,q^*`}
      </Equation>

      <QuaternionFigure t={t} />

      <H3>{tx(t, "mQuat_whyTitle", "Why half the angle?")}</H3>
      <p>
        {tx(t, "mQuat_whyBody",
          "Split v into a part along the axis and a part perpendicular to it. The part along n is left alone: q is made only of 1 and n, and n times n commutes, so q n q* = n q q* = n. For the perpendicular part, the product formula gives q v = (−sin(θ/2) n·v, cos(θ/2) v + sin(θ/2) n × v) = (0, cos(θ/2) v + sin(θ/2) n × v), since n · v = 0. Now n × v is v turned 90° about n, so this is v turned by θ/2 about n, exactly as multiplying by cos + i sin turns a complex number. The same calculation shows that multiplying by q* on the right turns the perpendicular part by another θ/2 in the same direction. Half plus half gives θ. Multiplying by q on one side only would mix the scalar part in and not give a pure vector back; the sandwich keeps the result a vector, and the price is splitting the angle between the two sides.")}
      </p>
      <p>
        {tx(t, "mQuat_fastBody",
          "Expanding the sandwich once and for all gives a faster formula that needs no quaternion products at all, just two cross products. With q = (w, u): v' = v + 2w (u × v) + 2 u × (u × v). This is what game engines actually run per vertex or per bone.")}
      </p>

      <H2>{tx(t, "mQuat_combTitle", "Combining and undoing rotations")}</H2>
      <p>
        {tx(t, "mQuat_combBody",
          "Rotate by q₁ and then by q₂: q₂(q₁ v q₁*)q₂* = (q₂q₁) v (q₂q₁)*, using (q₂q₁)* = q₁*q₂*. So the combined rotation is the product q₂q₁, and, as with matrices, the one applied first is written on the right. The product of two unit quaternions is a unit quaternion, and multiplying two costs 16 multiplications against 27 for two 3 × 3 matrices. Undoing a rotation is the conjugate q*: the same axis, negative angle. Rounding still creeps in after many products, but the repair is trivial: divide by the length to make |q| = 1 again.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mQuat_coverNote", "q and −q give the same rotation, since the two minus signs in (−q)v(−q)* cancel. In axis–angle terms, −q is a turn by θ + 360°, which ends in the same place. The figure's first mode shows q changing sign as θ passes 360° while the box returns to its start. Every rotation therefore has exactly two quaternions, which matters when blending: see below.")}
      </Callout>

      <H2>{tx(t, "mQuat_blendTitle", "Blending orientations: nlerp and slerp")}</H2>
      <p>
        {tx(t, "mQuat_blendBody",
          "Animation constantly needs the orientation \"t of the way\" from A to B: between two key frames, when a turret tracks a target, when a camera eases around. Unit quaternions live on the surface of a four-dimensional sphere, and the best path between two of them is the great-circle arc, the 4D version of the shortest route between two cities on a globe. Moving along it at constant speed is slerp (spherical linear interpolation). Its formula weights the two ends by sines, just as a point on an ordinary circle arc is made of the two ends weighted by sines of the angle to each.")}
      </p>
      <Equation label={tx(t, "mQuat_eqSlerp", "Spherical linear interpolation")}
        where={[
          [r`q_a, q_b`, tx(t, "mQuat_wQab", "the start and end orientations, unit quaternions")],
          [r`t`, tx(t, "mQuat_wT", "how far along, from 0 (at q_a) to 1 (at q_b)")],
          [r`\Omega`, tx(t, "mQuat_wOm", "the angle between them in 4D: cos Ω = q_a · q_b, the ordinary dot product of the four components")],
        ]}
        note={tx(t, "mQuat_slerpNote", "Two practical details. If q_a · q_b < 0, negate q_b first: it is the same orientation (double cover) but on the near side, so the blend takes the short way round instead of spinning almost a full turn. And if Ω is tiny, sin Ω is nearly 0; then blend the components linearly and renormalise.")}>
        {r`\operatorname{slerp}(q_a, q_b, t) = \frac{\sin\big((1 - t)\Omega\big)}{\sin\Omega}\,q_a + \frac{\sin(t\,\Omega)}{\sin\Omega}\,q_b`}
      </Equation>
      <p>
        {tx(t, "mQuat_nlerpBody",
          "A cheaper alternative, nlerp, blends the four components as a straight line, (1 − t)q_a + t q_b, and divides by the length. It follows the same arc and ends at the same place, but its speed is slightly uneven (fastest in the middle). For small steps, such as blending animation poses frame by frame, the difference is invisible and nlerp is widely used; for long, even turns use slerp. The figure's third mode compares slerp with blending Euler angles.")}
      </p>

      <H2>{tx(t, "mQuat_matConvTitle", "From quaternion to matrix")}</H2>
      <p>
        {tx(t, "mQuat_matConvBody",
          "The GPU still wants a 4 × 4 matrix, so engines keep orientations as quaternions and convert once per object per frame. The columns of the matrix are the rotated axes, q î q*, q ĵ q* and q k̂ q*; working them out with the fast formula gives the following.")}
      </p>
      <Equation label={tx(t, "mQuat_eqMat", "Rotation matrix of the unit quaternion (w, x, y, z)")}
        where={[
          [r`1 - 2(y^2 + z^2)`, tx(t, "mQuat_wDiag", "diagonal terms: how much each axis stays itself")],
          [r`2(xy \mp wz)`, tx(t, "mQuat_wOff", "off-diagonal terms: how much one axis turns toward another")],
        ]}
        note={tx(t, "mQuat_matNote", "Check with 90° about z, (w, x, y, z) = (0.707, 0, 0, 0.707): the first column is (1 − 2·0.5, 2·0.5, 0) = (0, 1, 0), so î goes to ĵ. ✓")}>
        {r`R = \begin{bmatrix} 1 - 2(y^2 + z^2) & 2(xy - wz) & 2(xz + wy) \\ 2(xy + wz) & 1 - 2(x^2 + z^2) & 2(yz - wx) \\ 2(xz - wy) & 2(yz + wx) & 1 - 2(x^2 + y^2) \end{bmatrix}`}
      </Equation>

      <H2>{tx(t, "mQuat_cmpTitle", "Which one to use")}</H2>
      <LessonTable
        headers={[tx(t, "mQuat_tRep", "Representation"), tx(t, "mQuat_tNum", "Numbers"), tx(t, "mQuat_tGood", "Good for"), tx(t, "mQuat_tBad", "Weak at")]}
        rows={[
          [tx(t, "mQuat_cEuler", "Euler angles"), "3", tx(t, "mQuat_cEulerG", "editors, FPS cameras (yaw + pitch only)"), tx(t, "mQuat_cEulerB", "gimbal lock, blending, combining")],
          [tx(t, "mQuat_cMat", "3 × 3 matrix"), "9", tx(t, "mQuat_cMatG", "transforming many vectors, the GPU"), tx(t, "mQuat_cMatB", "drift, blending, memory")],
          [tx(t, "mQuat_cAA", "axis–angle"), "4", tx(t, "mQuat_cAAG", "describing a turn, angular velocity"), tx(t, "mQuat_cAAB", "combining")],
          [tx(t, "mQuat_cQuat", "unit quaternion"), "4", tx(t, "mQuat_cQuatG", "storing, combining, blending orientations"), tx(t, "mQuat_cQuatB", "not human-readable")],
        ]}
      />

      <H2>{tx(t, "mQuat_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mQuat_ex1",
          "1. Build the quaternion for 120° about the axis (1, 1, 1)/√3. Half angle 60°: q = (cos 60°, sin 60° · (1, 1, 1)/√3) = (0.5, 0.5, 0.5, 0.5). This rotation cycles the axes: x → y → z → x. Check with the matrix: first column (1 − 2(0.25 + 0.25), 2(0.25 + 0.25), 2(0.25 − 0.25)) = (0, 1, 0). ✓")}
      </p>
      <p>
        {tx(t, "mQuat_ex2",
          "2. Combine 90° about z (q₁ = (0.707, 0, 0, 0.707)) followed by 90° about x (q₂ = (0.707, 0.707, 0, 0)). q₂q₁: scalar 0.5 − (0.707, 0, 0)·(0, 0, 0.707) = 0.5; vector 0.707·(0, 0, 0.707) + 0.707·(0.707, 0, 0) + (0.707, 0, 0) × (0, 0, 0.707) = (0.5, 0, 0.5) + (0, −0.5, 0) = (0.5, −0.5, 0.5). So q₂q₁ = (0.5, 0.5, −0.5, 0.5): a single 120° turn (cos 60° = 0.5) about (1, −1, 1)/√3.")}
      </p>
      <p>
        {tx(t, "mQuat_ex3",
          "3. Halfway between no rotation (1, 0, 0, 0) and 90° about y (0.707, 0, 0.707, 0): cos Ω = 0.707, Ω = 45°, weights sin 22.5°/sin 45° = 0.541 each, giving (0.924, 0, 0.383, 0) = (cos 22.5°, sin 22.5° · ŷ): exactly 45° about y. ✓")}
      </p>

      <H2>{tx(t, "mQuat_codeTitle", "Quaternions in C++")}</H2>
      <p>
        {tx(t, "mQuat_codeBody",
          "Everything in this chapter fits in one small struct: the product in scalar–vector form, construction from axis and angle, the fast rotation formula, slerp with the shortest-path and small-angle checks, and normalisation.")}
      </p>
      <CodeBlock lang="cpp" filename="quat.hpp" t={t}>{`#include <cmath>

struct Vec3 { float x, y, z; };
Vec3  operator+(Vec3 a, Vec3 b) { return { a.x + b.x, a.y + b.y, a.z + b.z }; }
Vec3  operator*(float k, Vec3 v) { return { k * v.x, k * v.y, k * v.z }; }
float dot(Vec3 a, Vec3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
Vec3  cross(Vec3 a, Vec3 b) { return { a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x }; }

struct Quat {
    float w = 1; Vec3 v = { 0, 0, 0 };         // identity: no rotation

    static Quat axisAngle(Vec3 n, float theta) {  // n must be unit length
        float h = theta * 0.5f;
        return { std::cos(h), std::sin(h) * n };
    }
    // (w1, v1)(w2, v2) = (w1 w2 - v1.v2, w1 v2 + w2 v1 + v1 x v2)
    Quat operator*(const Quat& q) const {
        return { w * q.w - dot(v, q.v), w * q.v + q.w * v + cross(v, q.v) };
    }
    Quat conj() const { return { w, -1.0f * v }; }   // inverse, for unit quaternions

    // v' = q v q*, expanded: v + 2w(u x v) + 2u x (u x v)
    Vec3 rotate(Vec3 p) const {
        Vec3 t = 2.0f * cross(v, p);
        return p + w * t + cross(v, t);
    }
    void normalize() {
        float l = std::sqrt(w * w + dot(v, v));
        w /= l; v = (1.0f / l) * v;
    }
};

float dot(const Quat& a, const Quat& b) { return a.w * b.w + dot(a.v, b.v); }

Quat slerp(Quat a, Quat b, float t) {
    float d = dot(a, b);
    if (d < 0) { b = { -b.w, -1.0f * b.v }; d = -d; }   // same rotation, shorter way
    float ka, kb;
    if (d > 0.9995f) { ka = 1 - t; kb = t; }            // nearly equal: nlerp
    else {
        float om = std::acos(d), s = std::sin(om);
        ka = std::sin((1 - t) * om) / s;
        kb = std::sin(t * om) / s;
    }
    Quat q = { ka * a.w + kb * b.w, ka * a.v + kb * b.v };
    q.normalize();
    return q;
}

// Usage: turn a bone 30 degrees about its local x axis every second
// bone.rot = Quat::axisAngle({1, 0, 0}, 0.5236f * dt) * bone.rot;
// bone.rot.normalize();`}</CodeBlock>

      <H2>{tx(t, "mQuat_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mQuat_tWrong", "Wrong"), tx(t, "mQuat_tRight", "Right"), tx(t, "mQuat_tWhy", "Why")]}
        rows={[
          ["q = (cos θ, sin θ · n)", "q = (cos θ/2, sin θ/2 · n)", tx(t, "mQuat_m1", "the sandwich applies q twice; the full angle would rotate by 2θ")],
          [tx(t, "mQuat_m2w", "an axis that is not unit length"), tx(t, "mQuat_m2r", "normalise n first"), tx(t, "mQuat_m2", "otherwise |q| ≠ 1 and the rotation also scales")],
          ["q₁q₂ = q₂q₁", tx(t, "mQuat_m3r", "order matters"), tx(t, "mQuat_m3", "q₂q₁ means q₁ first, like matrices")],
          [tx(t, "mQuat_m4w", "slerp without checking the sign"), tx(t, "mQuat_m4r", "negate b if a · b < 0"), tx(t, "mQuat_m4", "otherwise the blend can spin the long way round")],
          [tx(t, "mQuat_m5w", "never renormalising"), tx(t, "mQuat_m5r", "divide by |q| now and then"), tx(t, "mQuat_m5", "rounding slowly turns rotations into rotate-and-scale")],
          [tx(t, "mQuat_m6w", "mixing (w, x, y, z) and (x, y, z, w) order"), tx(t, "mQuat_m6r", "check the library's convention"), tx(t, "mQuat_m6", "GLM's constructor takes w first; Unity and many engines put it last")],
        ]}
      />

      <KeyIdeas t={t} id="mQuat" items={[
        "Euler angles suffer gimbal lock; matrices drift and blend badly; axis–angle is hard to combine.",
        "i² = j² = k² = ijk = −1; ij = k but ji = −k, like the cross product.",
        "(w₁, v₁)(w₂, v₂) = (w₁w₂ − v₁·v₂, w₁v₂ + w₂v₁ + v₁ × v₂).",
        "Rotation by θ about unit n: q = (cos θ/2, sin θ/2 · n), v' = q v q*.",
        "q₂q₁ applies q₁ first; the inverse of a unit quaternion is its conjugate; q and −q are the same rotation.",
        "Slerp blends along the shortest arc at constant speed; nlerp is the cheap approximation.",
      ]} />
    </Article>
  );
}
