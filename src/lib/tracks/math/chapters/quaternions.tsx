"use client";

// Linear Algebra 9: quaternions — the ways to store a 3D orientation (Euler
// angles and gimbal lock, matrices, axis–angle), Hamilton's i, j, k, the
// product in scalar–vector form (dot and cross), conjugate and inverse, the
// rotation q v q* and why the angle is halved, composing, the double cover,
// nlerp and slerp, conversion to a matrix, a comparison table, and a
// rotation worked by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { QuaternionFigure } from "@/components/lesson/figures/math/QuaternionFigure";

const r = String.raw;
const RAD = Math.PI / 180;
const num = (v: number) => String(Math.round(v * 1000) / 1000).replace("-", "−");
const deg = (v: number) => `${v}°`;
/** A slider label such as vₓ, with a real subscript. */
const comp = (v: string, i: string) => <>{v}<sub>{i}</sub></>;

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Rotation about the z-axis with the fast form v' = v + 2w(u × v) + 2u × (u × v), u = (0, 0, s). */
function rotNumbers(v: Record<string, number>) {
  const w = Math.cos((v.th * RAD) / 2), s = Math.sin((v.th * RAD) / 2);
  // u × v = (−s·v_y, s·v_x, 0); u × (u × v) = (−s²·v_x, −s²·v_y, 0)
  const x = v.x + 2 * w * (-s * v.y) - 2 * s * s * v.x;
  const y = v.y + 2 * w * (s * v.x) - 2 * s * s * v.y;
  return {
    tex: r`\begin{aligned} q &= (\cos ${num(v.th / 2)}^\circ,\ \sin ${num(v.th / 2)}^\circ\cdot(0, 0, 1)) = (${num(w)},\ 0,\ 0,\ ${num(s)}) \\ \mathbf v' &= (${num(v.x)}, ${num(v.y)}, ${num(v.z)}) + 2\cdot ${num(w)}\,(${num(-s * v.y)}, ${num(s * v.x)}, 0) + 2\,(${num(-s * s * v.x)}, ${num(-s * s * v.y)}, 0) = \green{(${num(x)},\ ${num(y)},\ ${num(v.z)})} \end{aligned}`,
  };
}

/** Slerp from no turn to a turn by θ about y; the result turns by tθ about y. */
function slerpNumbers(v: Record<string, number>) {
  const om = v.th / 2, sOm = Math.sin(om * RAD);
  const ka = Math.sin((1 - v.t) * om * RAD) / sOm, kb = Math.sin(v.t * om * RAD) / sOm;
  const qb = [Math.cos(om * RAD), Math.sin(om * RAD)];
  const w = ka + kb * qb[0], y = kb * qb[1];
  return {
    tex: r`\begin{aligned} \Omega &= ${num(om)}^\circ \qquad \frac{\sin(${num((1 - v.t) * om)}^\circ)}{\sin ${num(om)}^\circ} = ${num(ka)} \qquad \frac{\sin(${num(v.t * om)}^\circ)}{\sin ${num(om)}^\circ} = ${num(kb)} \\ q &= ${num(ka)}\,(1, 0, 0, 0) + ${num(kb)}\,(${num(qb[0])}, 0, ${num(qb[1])}, 0) = \green{(${num(w)},\ 0,\ ${num(y)},\ 0)} \end{aligned}`,
    meter: v.t,
    meterLabel: `${num(v.t * v.th)}° / ${num(v.th)}°`,
  };
}

export function QuaternionsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mQuat_intro",
          "In 2D an orientation is one angle, and the complex numbers chapter showed that a unit complex number stores it perfectly: multiply to rotate, multiply to combine. 3D is harder. Describing which way an aircraft, a satellite or a spinning top is facing, combining two turns into one, and finding the orientation halfway between two others are all surprisingly awkward. Three angles break down, matrices are bulky and drift. Quaternions, four numbers invented by William Rowan Hamilton in 1843, do the job best, and spacecraft attitude control and robotics rely on them. This chapter builds them from the complex numbers and the dot and cross products.")}
      </Lead>

      <Goals t={t} id="mQuat" items={[
        "Explain what goes wrong with Euler angles and with rotation matrices.",
        "Multiply quaternions and rotate a vector with one.",
        "Combine rotations and undo them.",
        "Blend between orientations with nlerp and slerp, and turn a quaternion into a matrix.",
      ]} />

      <H2>{tx(t, "mQuat_optionsTitle", "Three ways that almost work")}</H2>
      <H3>{tx(t, "mQuat_eulerTitle", "Euler angles and gimbal lock")}</H3>
      <p>
        {tx(t, "mQuat_eulerBody",
          "The obvious way to describe an orientation is three angles: yaw (turn left or right about the vertical axis), pitch (tilt the nose up or down) and roll (tip about the nose), applied in that order. These are Euler angles, and they are easy to picture: pilots describe an aircraft's attitude with exactly these three angles. But each turn happens about an axis that the previous turns have already moved. Pitch the nose straight up (90°) and the roll axis, the nose, now points along the yaw axis. Yaw and roll then do the same thing, and one of the three ways of turning is gone. This is gimbal lock, named after the nested rings (gimbals) of a gyroscope, which physically jam in the same way. Near that pose, small changes in orientation need huge jumps in the angles, and blending two sets of angles takes odd, curving routes.")}
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
        ]}
        words={tx(t, "mQuat_rulesWords", "Each of the three units squares to −1, and so does the product of all three in the order i, j, k.")}>
        {r`i^2 = j^2 = k^2 = ijk = -1`}
      </Equation>
      <Derivation t={t} label={tx(t, "mQuat_eqIJ", "Why ij = k")}
        steps={[
          { tex: r`ijk = -1` },
          { tex: r`\Rightarrow\ ijk\,k = -k`, why: tx(t, "mQuat_j1", "multiply both sides by k on the right") },
          { tex: r`\Rightarrow\ ij\,(-1) = -k`, why: tx(t, "mQuat_j2", "k² = −1") },
          { tex: r`\Rightarrow\ \green{ij = k}`, why: tx(t, "mQuat_j3", "multiply both sides by −1") },
        ]} />

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
        note={tx(t, "mQuat_mulNote", "Example: i · j is (0, (1, 0, 0)) times (0, (0, 1, 0)): scalar 0 − 0 = 0, vector 0 + 0 + (1, 0, 0) × (0, 1, 0) = (0, 0, 1). So ij = k. ✓ With the order swapped the cross product flips: ji = −k.")}
        words={tx(t, "mQuat_mulWords", "The new scalar is the product of the scalars minus the dot product of the vectors. The new vector is each scalar times the other vector, plus the cross product of the two vectors.")}>
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
        note={tx(t, "mQuat_rotNote", "Example: 90° about the z-axis. q = (cos 45°, sin 45° · (0, 0, 1)) = (0.707, 0, 0, 0.707). Rotating v = (1, 0, 0) gives (0, 1, 0): x turns toward y, as a quarter turn about z should.")}
        words={tx(t, "mQuat_rotWords", "Put the cosine of half the angle first and the axis times the sine of half the angle after it. To turn a vector, multiply it by q on the left and by q's conjugate on the right.")}>
        {r`q = \left(\cos\tfrac{\theta}{2},\ \sin\tfrac{\theta}{2}\,\mathbf{n}\right) \qquad \mathbf{v}' = q\,\mathbf{v}\,q^*`}
      </Equation>
      <LiveFormula label={tx(t, "mQuat_liveRot", "Try it: turn a vector about the z-axis")}
        tex={r`q = \left(\cos\tfrac{\theta}{2},\ \sin\tfrac{\theta}{2}\,(0, 0, 1)\right) \qquad \mathbf v' = \mathbf v + 2w\,(\mathbf u\times\mathbf v) + 2\,\mathbf u\times(\mathbf u\times\mathbf v)`}
        vars={[
          { id: "th", label: "θ", min: 0, max: 360, step: 15, value: 90, fmt: deg },
          { id: "x", label: comp("v", "x"), min: -3, max: 3, step: 1, value: 1, fmt: num },
          { id: "y", label: comp("v", "y"), min: -3, max: 3, step: 1, value: 0, fmt: num },
          { id: "z", label: comp("v", "z"), min: -3, max: 3, step: 1, value: 0, fmt: num },
        ]}
        compute={rotNumbers}
        note={tx(t, "mQuat_liveRotNote", "Starts on the example above, worked with the fast formula of the next section (u is q's vector part, w its scalar). Try θ = 180°: w = 0 and v turns to −v in x and y. The z component never changes: it lies along the axis.")} />

      <QuaternionFigure t={t} />

      <H3>{tx(t, "mQuat_whyTitle", "Why half the angle?")}</H3>
      <p>
        {tx(t, "mQuat_whyBody",
          "Split v into a part along the axis and a part perpendicular to it. The part along n is left alone: q is made only of 1 and n, and n times n commutes, so q n q* = n q q* = n. For the perpendicular part, the product formula gives q v = (−sin(θ/2) n·v, cos(θ/2) v + sin(θ/2) n × v) = (0, cos(θ/2) v + sin(θ/2) n × v), since n · v = 0. Now n × v is v turned 90° about n, so this is v turned by θ/2 about n, exactly as multiplying by cos + i sin turns a complex number. The same calculation shows that multiplying by q* on the right turns the perpendicular part by another θ/2 in the same direction. Half plus half gives θ. Multiplying by q on one side only would mix the scalar part in and not give a pure vector back; the sandwich keeps the result a vector, and the price is splitting the angle between the two sides.")}
      </p>
      <p>
        {tx(t, "mQuat_fastBody",
          "Expanding the sandwich once and for all gives a faster formula that needs no quaternion products at all, just two cross products. With q = (w, u): v' = v + 2w (u × v) + 2 u × (u × v). It is also the quickest way to rotate a vector by hand, as the last section shows.")}
      </p>

      <H2>{tx(t, "mQuat_combTitle", "Combining and undoing rotations")}</H2>
      <p>
        {tx(t, "mQuat_combBody2",
          "Rotate by q₁ and then by q₂; the derivation below shows the result is one rotation, by the product q₂q₁. As with matrices, the one applied first is written on the right. The product of two unit quaternions is a unit quaternion, and multiplying two costs 16 multiplications against 27 for two 3 × 3 matrices. Undoing a rotation is the conjugate q*: the same axis, negative angle. Rounding still creeps in after many products, but the repair is trivial: divide by the length to make |q| = 1 again.")}
      </p>
      <Derivation t={t} label={tx(t, "mQuat_eqComb", "Two rotations make one")}
        steps={[
          { tex: r`q_2\,(q_1\,\mathbf v\,q_1^*)\,q_2^*`, why: tx(t, "mQuat_c0", "turn by q₁, then turn the result by q₂") },
          { tex: r`= (q_2q_1)\,\mathbf v\,(q_1^*q_2^*)`, why: tx(t, "mQuat_c1", "grouping does not matter in a product of quaternions") },
          { tex: r`= \green{(q_2q_1)\,\mathbf v\,(q_2q_1)^*}`, why: tx(t, "mQuat_c2", "the conjugate of a product is the product of the conjugates in reverse order: (q₂q₁)* = q₁*q₂*") },
        ]} />
      <Callout type="info" t={t}>
        {tx(t, "mQuat_coverNote", "q and −q give the same rotation, since the two minus signs in (−q)v(−q)* cancel. In axis–angle terms, −q is a turn by θ + 360°, which ends in the same place. The figure's first mode shows q changing sign as θ passes 360° while the box returns to its start. Every rotation therefore has exactly two quaternions, which matters when blending: see below.")}
      </Callout>

      <H2>{tx(t, "mQuat_blendTitle", "Blending orientations: nlerp and slerp")}</H2>
      <p>
        {tx(t, "mQuat_blendBody",
          "Often the orientation \"t of the way\" from A to B is needed: a telescope or a satellite turning smoothly from one star to another, a robot's wrist moving between two poses. Unit quaternions live on the surface of a four-dimensional sphere, and the best path between two of them is the great-circle arc, the 4D version of the shortest route between two cities on a globe. Moving along it at constant speed is slerp (spherical linear interpolation). Its formula weights the two ends by sines, just as a point on an ordinary circle arc is made of the two ends weighted by sines of the angle to each.")}
      </p>
      <Equation label={tx(t, "mQuat_eqSlerp", "Spherical linear interpolation")}
        where={[
          [r`q_a, q_b`, tx(t, "mQuat_wQab", "the start and end orientations, unit quaternions")],
          [r`t`, tx(t, "mQuat_wT", "how far along, from 0 (at q_a) to 1 (at q_b)")],
          [r`\Omega`, tx(t, "mQuat_wOm", "the angle between them in 4D: cos Ω = q_a · q_b, the ordinary dot product of the four components")],
        ]}
        note={tx(t, "mQuat_slerpNote", "Two practical details. If q_a · q_b < 0, negate q_b first: it is the same orientation (double cover) but on the near side, so the blend takes the short way round instead of spinning almost a full turn. And if Ω is tiny, sin Ω is nearly 0; then blend the components linearly and renormalise.")}
        words={tx(t, "mQuat_slerpWords", "Mix the two quaternions with weights given by sines: the start's weight shrinks and the end's grows as t goes from 0 to 1, so that the result moves along the arc at an even speed.")}>
        {r`\operatorname{slerp}(q_a, q_b, t) = \frac{\sin\big((1 - t)\Omega\big)}{\sin\Omega}\,q_a + \frac{\sin(t\,\Omega)}{\sin\Omega}\,q_b`}
      </Equation>
      <LiveFormula label={tx(t, "mQuat_liveSlerp", "Try it: slerp from no turn to a turn about y")}
        tex={r`q_a = (1, 0, 0, 0) \qquad q_b = \left(\cos\tfrac{\theta}{2},\ 0,\ \sin\tfrac{\theta}{2},\ 0\right) \qquad \cos\Omega = q_a\cdot q_b`}
        vars={[
          { id: "th", label: "θ", min: 30, max: 180, step: 15, value: 90, fmt: deg },
          { id: "t", label: "t", min: 0, max: 1, step: 0.05, value: 0.5, fmt: num },
        ]}
        compute={slerpNumbers}
        note={tx(t, "mQuat_liveSlerpNote", "Starts on worked example 3 below: halfway to 90° about y gives (0.924, 0, 0.383, 0), a turn of 45°. The bar is the share of the turn done, and it always equals t: slerp turns at an even speed.")} />
      <p>
        {tx(t, "mQuat_nlerpBody",
          "A cheaper alternative, nlerp, blends the four components as a straight line, (1 − t)q_a + t q_b, and divides by the length. It follows the same arc and ends at the same place, but its speed is slightly uneven (fastest in the middle). For small steps the difference is negligible and nlerp is often used; for long, even turns use slerp. The figure's third mode compares slerp with blending Euler angles.")}
      </p>

      <H2>{tx(t, "mQuat_matConvTitle", "From quaternion to matrix")}</H2>
      <p>
        {tx(t, "mQuat_matConvBody",
          "To rotate many vectors, one matrix product each is quicker than a sandwich each, so a quaternion is often converted into a matrix first. The columns of the matrix are the rotated axes, q î q*, q ĵ q* and q k̂ q*; working them out with the fast formula gives the following.")}
      </p>
      <Equation label={tx(t, "mQuat_eqMat", "Rotation matrix of the unit quaternion (w, x, y, z)")}
        where={[
          [r`1 - 2(y^2 + z^2)`, tx(t, "mQuat_wDiag", "diagonal terms: how much each axis stays itself")],
          [r`2(xy \mp wz)`, tx(t, "mQuat_wOff", "off-diagonal terms: how much one axis turns toward another")],
        ]}
        words={tx(t, "mQuat_matWords", "Each column is one of the three axes turned by the quaternion, written out with the four numbers w, x, y, z.")}
        note={tx(t, "mQuat_matNote", "Check with 90° about z, (w, x, y, z) = (0.707, 0, 0, 0.707): the first column is (1 − 2·0.5, 2·0.5, 0) = (0, 1, 0), so î goes to ĵ. ✓")}>
        {r`R = \begin{bmatrix} 1 - 2(y^2 + z^2) & 2(xy - wz) & 2(xz + wy) \\ 2(xy + wz) & 1 - 2(x^2 + z^2) & 2(yz - wx) \\ 2(xz - wy) & 2(yz + wx) & 1 - 2(x^2 + y^2) \end{bmatrix}`}
      </Equation>

      <H2>{tx(t, "mQuat_cmpTitle", "Which one to use")}</H2>
      <LessonTable
        headers={[tx(t, "mQuat_tRep", "Representation"), tx(t, "mQuat_tNum", "Numbers"), tx(t, "mQuat_tGood", "Good for"), tx(t, "mQuat_tBad", "Weak at")]}
        rows={[
          [tx(t, "mQuat_cEuler", "Euler angles"), "3", tx(t, "mQuat_cEulerG", "describing an attitude to a person (yaw, pitch, roll)"), tx(t, "mQuat_cEulerB", "gimbal lock, blending, combining")],
          [tx(t, "mQuat_cMat", "3 × 3 matrix"), "9", tx(t, "mQuat_cMatG", "transforming many vectors"), tx(t, "mQuat_cMatB", "drift, blending, memory")],
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

      <H2>{tx(t, "mQuat_handTitle", "A rotation by hand")}</H2>
      <p>
        {tx(t, "mQuat_handBody",
          "Rotate v = (1, 0, 0) by 90° about the z-axis with the fast formula v' = v + 2w (u × v) + 2 u × (u × v). The half angle is 45°, so q = (w, u) with w = cos 45° = √2/2 and u = sin 45° · (0, 0, 1) = (0, 0, √2/2). Write s = √2/2; then 2s² = 1 and 2ws = 2s² = 1, which keeps the numbers exact.")}
      </p>
      <LessonTable
        headers={[tx(t, "mQuat_tStep", "Step"), tx(t, "mQuat_tWork", "Working")]}
        rows={[
          ["u × v", "(0, 0, s) × (1, 0, 0) = (0 · 0 − s · 0, s · 1 − 0 · 0, 0 · 0 − 0 · 1) = (0, s, 0)"],
          ["2w (u × v)", "2ws · (0, 1, 0) = (0, 1, 0)"],
          ["u × (u × v)", "(0, 0, s) × (0, s, 0) = (0 · 0 − s · s, s · 0 − 0 · 0, 0 · s − 0 · 0) = (−s², 0, 0)"],
          ["2 u × (u × v)", "(−2s², 0, 0) = (−1, 0, 0)"],
          ["v'", "(1, 0, 0) + (0, 1, 0) + (−1, 0, 0) = (0, 1, 0)"],
        ]}
      />
      <p>
        {tx(t, "mQuat_handCheck",
          "The x-axis has turned onto the y-axis, exactly what a quarter turn anticlockwise about z should do, and it agrees with the first column of the matrix in the previous section. The length is still 1, as it must be for a rotation.")}
      </p>

      <H2>{tx(t, "mQuat_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mQuat_tWrong", "Wrong"), tx(t, "mQuat_tRight", "Right"), tx(t, "mQuat_tWhy", "Why")]}
        rows={[
          ["q = (cos θ, sin θ · n)", "q = (cos θ/2, sin θ/2 · n)", tx(t, "mQuat_m1", "the sandwich applies q twice; the full angle would rotate by 2θ")],
          [tx(t, "mQuat_m2w", "an axis that is not unit length"), tx(t, "mQuat_m2r", "normalise n first"), tx(t, "mQuat_m2", "otherwise |q| ≠ 1 and the rotation also scales")],
          ["q₁q₂ = q₂q₁", tx(t, "mQuat_m3r", "order matters"), tx(t, "mQuat_m3", "q₂q₁ means q₁ first, like matrices")],
          [tx(t, "mQuat_m4w", "slerp without checking the sign"), tx(t, "mQuat_m4r", "negate b if a · b < 0"), tx(t, "mQuat_m4", "otherwise the blend can spin the long way round")],
          [tx(t, "mQuat_m5w", "never renormalising"), tx(t, "mQuat_m5r", "divide by |q| now and then"), tx(t, "mQuat_m5", "rounding slowly turns rotations into rotate-and-scale")],
          [tx(t, "mQuat_m6w", "mixing (w, x, y, z) and (x, y, z, w) order"), tx(t, "mQuat_m6r", "check each source's convention"), tx(t, "mQuat_m6", "books and tables differ: some write the scalar part w first, others last")],
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
