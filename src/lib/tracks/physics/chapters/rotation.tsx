"use client";

// Conservation & Rotation 2: rotation of rigid bodies — angle, angular speed
// and angular acceleration, with the kinematics of rotation side by side with
// straight-line motion; torque τ = r F sin θ and the lever arm; static
// equilibrium (two conditions), the seesaw, toppling; moment of inertia
// derived from kinetic energy, a table of shapes, the parallel-axis theorem;
// τ = I α derived; rolling without slipping and the race down a ramp;
// rotational work and power.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TorqueFigure } from "@/components/lesson/figures/physics/TorqueFigure";
import { RollingRaceFigure } from "@/components/lesson/figures/physics/RollingRaceFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** A rope wound round a disc on a fixed axle, pulled with force F. */
const discNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const I = 0.5 * v.M * v.R * v.R, tau = v.F * v.R, a = tau / I;
  const rps = (a * 2) / (2 * Math.PI);                  // turns per second after 2 s
  return {
    tex: r`\alpha = \frac{F R}{\tfrac12 M R^2} = \frac{${num(v.F, 0)} \times ${num(v.R, 2)}}{\tfrac12 \times ${num(v.M, 1)} \times ${num(v.R, 2)}^2} = \frac{${num(tau, 2)}}{${num(I, 3)}} = \amber{${num(a)}\ \text{rad/s}^2}`,
    meter: Math.min(1, a / 200), meterLabel: `${num(rps, 1)} ${tx(t, "phRot_liveTurns", "turns per second after 2 s")}`,
  };
};

export function RotationContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phRot_intro",
          "So far every object has been a point: we only asked where it was going. Real objects also turn. A wheel, a door, a spinning top and a planet all rotate, and the same push can make them turn a lot or not at all depending on where it is applied. This chapter builds the physics of rotation as a mirror image of straight-line motion: angle for position, torque for force, moment of inertia for mass. Every law you know has a rotating twin.")}
      </Lead>

      <Goals t={t} id="phRot" items={[
        "Describe rotation with angle, angular speed and angular acceleration, and use the rotational kinematics equations.",
        "Compute a torque from the force and its lever arm, and use the two conditions for equilibrium.",
        "Derive the moment of inertia from kinetic energy and use τ = I α.",
        "Explain why a hoop rolls down a ramp more slowly than a ball, using energy.",
      ]} />

      <H2>{tx(t, "phRot_kinTitle", "Describing rotation")}</H2>
      <p>
        {tx(t, "phRot_kinBody",
          "A rigid body is one that keeps its shape. When it turns about a fixed axis, every point moves on a circle, and all points turn through the same angle in the same time. So one angle θ describes the whole body. Its rate of change is the angular speed ω (rad/s), as in the circular motion chapter, and the rate of change of ω is the angular acceleration α (the Greek letter alpha, rad/s²).")}
      </p>
      <p>
        {tx(t, "phRot_kinBody2",
          "Because the definitions have exactly the same form as x, v and a, the equations for constant acceleration carry over letter for letter.")}
      </p>
      <LessonTable
        headers={[tx(t, "phRot_tLine", "Straight line"), tx(t, "phRot_tRot", "Rotation"), tx(t, "phRot_tLink", "Link for a point at radius r")]}
        rows={[
          [tx(t, "phRot_r1a", "position x (m)"), tx(t, "phRot_r1b", "angle θ (rad)"), "s = r θ"],
          [tx(t, "phRot_r2a", "velocity v (m/s)"), tx(t, "phRot_r2b", "angular velocity ω (rad/s)"), "v = r ω"],
          [tx(t, "phRot_r3a", "acceleration a (m/s²)"), tx(t, "phRot_r3b", "angular acceleration α (rad/s²)"), tx(t, "phRot_r3c", "a_t = r α (along the circle)")],
          ["v = v₀ + a t", "ω = ω₀ + α t", ""],
          ["x = x₀ + v₀ t + ½ a t²", "θ = θ₀ + ω₀ t + ½ α t²", ""],
          ["v² = v₀² + 2 a Δx", "ω² = ω₀² + 2 α Δθ", ""],
        ]}
      />
      <p>
        {tx(t, "phRot_fanBody",
          "A fan speeds up from rest to 1 200 turns per minute in 4 s. 1 200 rpm is 20 turns per second, ω = 2π × 20 = 126 rad/s, so α = 126 / 4 = 31.4 rad/s². In those 4 s it turns θ = ½ × 31.4 × 4² = 251 rad, which is 251 / 2π = 40 turns. The tip of a 25 cm blade then moves at v = r ω = 31 m/s.")}
      </p>

      <H2>{tx(t, "phRot_torqueTitle", "Torque")}</H2>
      <p>
        {tx(t, "phRot_torqueBody",
          "Try opening a door by pushing near the hinge: it barely moves. Push at the handle, far from the hinge, and it swings easily. Push along the door, towards the hinge, and nothing turns at all. The turning effect of a force, its torque τ (the Greek letter tau), depends on three things: how hard you push, how far from the axis, and in what direction.")}
      </p>
      <Equation label={tx(t, "phRot_eqTorque", "Torque")}
        where={[
          [r`\tau`, tx(t, "phRot_wTau", "the torque about the axis (N·m)")],
          [r`r`, tx(t, "phRot_wR", "the distance from the axis to where the force acts (m)")],
          [r`F`, tx(t, "phRot_wF", "the size of the force (N)")],
          [r`\theta`, tx(t, "phRot_wTh", "the angle between the line from the axis and the force")],
          [r`r_\perp`, tx(t, "phRot_wRp", "the lever arm: the perpendicular distance from the axis to the line of the force, r sin θ")],
        ]}
        note={tx(t, "phRot_torqueNote", "Two readings of the same product: either the whole force times the lever arm, or the whole distance times the part of the force across it, F sin θ. A torque that would turn the body anticlockwise is usually counted positive, clockwise negative. Torque is measured in newton metres; it is not energy, so it is never written in joules.")}>
        {r`\tau = r\, F \sin\theta = r_\perp\, F`}
      </Equation>
      <TorqueFigure t={t} />
      <p>
        {tx(t, "phRot_wrenchBody",
          "A 40 N pull at the end of a 25 cm spanner, straight across it, gives 10 N·m. A longer spanner gives the same torque for less force, which is why a stuck bolt yields to a length of pipe slipped over the handle. Pull at 30° to the handle instead and you only get 40 × 0.25 × sin 30° = 5 N·m.")}
      </p>

      <H3>{tx(t, "phRot_eqTitle", "Balance: static equilibrium")}</H3>
      <p>
        {tx(t, "phRot_eqBody",
          "A body at rest stays at rest only if two things hold. The net force must be zero, or its centre of mass would start to move. And the net torque about any axis must be zero, or it would start to turn. A bridge, a ladder against a wall and a balanced seesaw all satisfy both.")}
      </p>
      <Equation label={tx(t, "phRot_eqStatic", "The two conditions for equilibrium")}
        where={[
          [r`\sum \vec F`, tx(t, "phRot_wSumF", "the sum of all forces on the body")],
          [r`\sum \tau`, tx(t, "phRot_wSumT", "the sum of all torques, about any point you choose")],
        ]}
        note={tx(t, "phRot_staticNote", "Because the torque sum must vanish about every point, you can pick the most convenient one: a point where an unknown force acts. Its torque about that point is zero, and it drops out of the equation.")}>
        {r`\sum \vec F = 0 \qquad \sum \tau = 0`}
      </Equation>
      <p>
        {tx(t, "phRot_leverBody",
          "On a seesaw with the pivot in the middle, the weights of the two children are the torques that matter: m_A g x_A on one side, m_B g x_B on the other. They balance when m_A x_A = m_B x_B, the law of the lever that Archimedes found 2 200 years ago. A 30 kg child 1 m from the pivot balances a 20 kg child 1.5 m from it. \"Give me a place to stand and I will move the Earth\": with a long enough lever, a small force balances a huge one.")}
      </p>
      <p>
        {tx(t, "phRot_toppleBody",
          "Gravity acts on every part of a body, but for torque it behaves as if all the weight acted at the centre of mass (also called the centre of gravity). A box on a slope, or a person leaning, stays up as long as the centre of mass is above the base of support: the weight's torque about the edge then pushes the body back. Once the centre of mass passes over the edge, the torque reverses and the body topples. That is why racing cars are built low and wide, and why you lean forward when you carry a heavy backpack.")}
      </p>

      <H2>{tx(t, "phRot_inertiaTitle", "Moment of inertia")}</H2>
      <p>
        {tx(t, "phRot_inertiaBody",
          "Mass measures how hard it is to change an object's velocity. For rotation, what matters is not only how much mass there is but how far it is from the axis. To see why, add up the kinetic energy of a spinning body, piece by piece.")}
      </p>
      <Derivation t={t} label={tx(t, "phRot_eqKrot", "Kinetic energy of a rotating body")}
        steps={[
          { tex: r`K = \sum \tfrac12\, m_i\, v_i^2`, why: tx(t, "phRot_k1", "add the kinetic energy of every small piece m_i") },
          { tex: r`= \sum \tfrac12\, m_i\, (\omega\, r_i)^2`, why: tx(t, "phRot_k2", "each piece moves on a circle of radius r_i at v_i = ω r_i, with the same ω for all") },
          { tex: r`= \tfrac12 \Big( \sum m_i\, r_i^2 \Big)\, \omega^2`, why: tx(t, "phRot_k3", "ω is common, so it comes out of the sum") },
          { tex: r`\green{K = \tfrac12\, I\, \omega^2, \quad I = \sum m_i\, r_i^2}`, why: tx(t, "phRot_k4", "the sum depends only on the body and the axis: call it the moment of inertia I") },
        ]} />
      <p>
        {tx(t, "phRot_inertiaBody2",
          "So I plays the role of m in ½ m v². Its unit is kg·m². Because each piece counts with the square of its distance, mass far from the axis counts much more: a piece twice as far out counts four times as much. For solid shapes the sum becomes an integral, and the results are worth knowing.")}
      </p>
      <LessonTable
        headers={[tx(t, "phRot_tBody", "Body (mass M, radius R or length L)"), tx(t, "phRot_tAxis", "Axis"), "I"]}
        rows={[
          [tx(t, "phRot_i1", "thin hoop or ring"), tx(t, "phRot_i1a", "through the centre, perpendicular to it"), "M R²"],
          [tx(t, "phRot_i2", "solid disc or cylinder"), tx(t, "phRot_i2a", "its own axis"), "½ M R²"],
          [tx(t, "phRot_i3", "hollow sphere (thin shell)"), tx(t, "phRot_i3a", "a diameter"), "⅔ M R²"],
          [tx(t, "phRot_i4", "solid ball"), tx(t, "phRot_i4a", "a diameter"), "⅖ M R²"],
          [tx(t, "phRot_i5", "thin rod"), tx(t, "phRot_i5a", "through its middle"), "¹⁄₁₂ M L²"],
          [tx(t, "phRot_i6", "thin rod"), tx(t, "phRot_i6a", "through one end"), "⅓ M L²"],
        ]}
      />
      <p>
        {tx(t, "phRot_paraBody",
          "The last two rows are linked by the parallel-axis theorem: about any axis parallel to one through the centre of mass, at a distance d from it, I = I_cm + M d². For the rod, the end is d = L/2 from the middle, so I = ¹⁄₁₂ M L² + M L²/4 = ⅓ M L². Moving the axis away from the centre of mass always makes I larger.")}
      </p>

      <H3>{tx(t, "phRot_secondTitle", "Newton's second law for rotation")}</H3>
      <p>
        {tx(t, "phRot_secondBody",
          "Torque is to rotation what force is to straight-line motion. Take one small piece of mass m at radius r and push it along its circle with a force F_t.")}
      </p>
      <Derivation t={t} label={tx(t, "phRot_eqTauIa", "From F = m a to τ = I α")}
        steps={[
          { tex: r`F_t = m\, a_t`, why: tx(t, "phRot_s1", "second law along the circle, for one piece") },
          { tex: r`F_t = m\, r\, \alpha`, why: tx(t, "phRot_s2", "a point at radius r has a_t = r α") },
          { tex: r`r\, F_t = m\, r^2\, \alpha`, why: tx(t, "phRot_s3", "multiply by r: on the left is the torque of F_t") },
          { tex: r`\green{\sum \tau = I\, \alpha}`, why: tx(t, "phRot_s4", "add over all pieces; the inside forces cancel in pairs, leaving the outside torques and Σ m r² = I") },
        ]} />
      <LiveFormula label={tx(t, "phRot_liveDisc", "Try it: pull a rope wound round a disc")}
        tex={r`\alpha = \frac{\tau}{I} = \frac{F R}{\tfrac12 M R^2}`}
        vars={[
          { id: "F", label: "F (N)", min: 1, max: 50, step: 1, value: 10, fmt: v => `${num(v, 0)} N` },
          { id: "M", label: "M (kg)", min: 0.5, max: 20, step: 0.5, value: 2, fmt: v => `${num(v, 1)} kg` },
          { id: "R", label: "R (m)", min: 0.05, max: 0.5, step: 0.01, value: 0.2, fmt: v => `${num(v, 2)} m` },
        ]}
        compute={discNumbers(t)}
        note={tx(t, "phRot_liveDiscNote", "A 10 N pull on the rope of a 2 kg disc of radius 20 cm: τ = 2 N·m, I = 0.04 kg·m², α = 50 rad/s². Double the radius and the torque doubles but I quadruples, so α halves: big wheels are harder to spin up. This is why the flywheels that smooth out an engine's pulses are heavy at the rim.")} />

      <H2>{tx(t, "phRot_rollTitle", "Rolling")}</H2>
      <p>
        {tx(t, "phRot_rollBody",
          "A wheel that rolls without slipping turns exactly once for each circumference it travels: the speed of its centre and its spin are locked together, v = ω R. Its kinetic energy has two parts, the motion of the centre of mass and the spin about it. Writing I = c M R², where c is the number from the table (1 for a hoop, ½ for a disc, ⅖ for a ball), both parts can be written with v.")}
      </p>
      <Derivation t={t} label={tx(t, "phRot_eqRoll", "Down a ramp of height h, rolling")}
        steps={[
          { tex: r`K = \tfrac12 M v^2 + \tfrac12 I \omega^2`, why: tx(t, "phRot_r1", "moving plus spinning") },
          { tex: r`= \tfrac12 M v^2 + \tfrac12\, c M R^2 \left(\tfrac{v}{R}\right)^2 = \tfrac12 M v^2 (1 + c)`, why: tx(t, "phRot_r2", "use I = c M R² and ω = v/R: the radius cancels") },
          { tex: r`M g h = \tfrac12 M v^2 (1 + c)`, why: tx(t, "phRot_r3", "energy conservation: rolling without slipping wastes no energy, since the contact point is momentarily at rest") },
          { tex: r`\green{v = \sqrt{\frac{2 g h}{1 + c}} \qquad a = \frac{g \sin\theta}{1 + c}}`, why: tx(t, "phRot_r4", "the mass and the size cancel; only the shape, through c, is left") },
        ]} />
      <RollingRaceFigure t={t} />
      <p>
        {tx(t, "phRot_raceBody",
          "From a ramp 1 m high, a frictionless sliding block reaches √(2 × 9.81) = 4.43 m/s, a ball 3.74 m/s, a disc 3.62 m/s and a hoop 3.13 m/s. The hoop is last because half of its energy goes into spinning. Any ball beats any can of the same shape, whatever their masses and sizes, a race you can run on a kitchen table.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phRot_eggs", "Spin a raw egg and a hard-boiled egg on a table, then stop each briefly with a finger and let go. The boiled egg stays stopped. The raw one starts turning again: its liquid inside kept spinning while you held the shell. A raw egg is also harder to spin up in the first place, because its insides lag behind.")}
      </Callout>

      <H3>{tx(t, "phRot_powerTitle", "Work and power in rotation")}</H3>
      <p>
        {tx(t, "phRot_powerBody",
          "A torque acting through an angle does work, just as a force acting through a distance does: the force F_t moves its point of action through the arc r Δθ, so W = F_t r Δθ = τ Δθ. Dividing by the time gives the power. This is how engines are rated: a car engine giving 300 N·m at 4 000 rpm (ω = 419 rad/s) delivers P = 300 × 419 = 126 kW.")}
      </p>
      <Equation label={tx(t, "phRot_eqPower", "Rotational work and power")}
        where={[
          [r`W`, tx(t, "phRot_wW", "the work done by the torque (J)")],
          [r`\Delta\theta`, tx(t, "phRot_wDth", "the angle turned, in radians")],
          [r`P`, tx(t, "phRot_wP", "the power (W)")],
        ]}>
        {r`W = \tau\, \Delta\theta \qquad P = \tau\, \omega`}
      </Equation>

      <H2>{tx(t, "phRot_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phRot_ex1", "1. A 4 m plank of mass 20 kg rests on two supports at its ends. A 60 kg painter stands 1 m from the left end. Torques about the left end: the right support pushes up with F_R × 4 = 60 × 9.81 × 1 + 20 × 9.81 × 2, so F_R = 245 N. The forces must add to the total weight, 785 N, so F_L = 540 N: the end nearer the painter carries more.")}</p>
      <p>{tx(t, "phRot_ex2", "2. A 2 kg rod 1 m long swings about one end: I = ⅓ × 2 × 1² = 0.67 kg·m². About its middle, I = ¹⁄₁₂ × 2 × 1² = 0.17 kg·m², four times smaller.")}</p>
      <p>{tx(t, "phRot_ex3", "3. A 50 kg flywheel disc of radius 0.3 m spins at 3 000 rpm (314 rad/s). I = ½ × 50 × 0.3² = 2.25 kg·m², and it stores K = ½ × 2.25 × 314² = 111 kJ, enough to lift a car by 9 m.")}</p>
      <p>{tx(t, "phRot_ex4", "4. A solid ball rolls down a 30° slope: a = 9.81 × sin 30° / 1.4 = 3.5 m/s², five sevenths of the 4.9 m/s² it would have sliding without friction.")}</p>
      <p>{tx(t, "phRot_ex5", "5. A merry-go-round (a disc of 200 kg, radius 2 m) is pushed at its rim with 100 N, tangent to it. τ = 200 N·m, I = ½ × 200 × 4 = 400 kg·m², α = 0.5 rad/s². After 10 s, ω = 5 rad/s, nearly one turn a second.")}</p>

      <H2>{tx(t, "phRot_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phRot_tWrong", "Wrong"), tx(t, "phRot_tRight", "Right"), tx(t, "phRot_tWhy", "Why")]}
        rows={[
          [tx(t, "phRot_m1w", "torque = force × distance, always"), tx(t, "phRot_m1r", "τ = r F sin θ"), tx(t, "phRot_m1", "a force along the line to the axis has no torque")],
          [tx(t, "phRot_m2w", "torque in joules"), tx(t, "phRot_m2r", "newton metres"), tx(t, "phRot_m2", "same units on paper, but torque is not energy")],
          [tx(t, "phRot_m3w", "a body has one moment of inertia"), tx(t, "phRot_m3r", "I depends on the axis"), tx(t, "phRot_m3", "a rod is four times harder to turn about its end than its middle")],
          [tx(t, "phRot_m4w", "heavier balls roll down faster"), tx(t, "phRot_m4r", "mass and size cancel"), tx(t, "phRot_m4", "only the shape factor c matters")],
          [tx(t, "phRot_m5w", "forgetting rotational energy"), tx(t, "phRot_m5r", "K = ½ M v² + ½ I ω²"), tx(t, "phRot_m5", "a rolling body spins as well as moves")],
          [tx(t, "phRot_m6w", "using degrees in v = r ω"), tx(t, "phRot_m6r", "radians"), tx(t, "phRot_m6", "the formulas s = r θ and v = r ω assume radians")],
        ]}
      />

      <KeyIdeas t={t} id="phRot" items={[
        "Rotation about a fixed axis uses θ, ω and α, with the same constant-acceleration equations as x, v and a; a point at radius r has v = r ω.",
        "Torque τ = r F sin θ = r⊥ F: only the part of the force across the line to the axis, times the distance, turns a body.",
        "A body in equilibrium has zero net force and zero net torque about every point; it topples when its centre of mass passes over its base.",
        "The moment of inertia I = Σ m r² depends on the axis and grows with the square of the distance; K = ½ I ω².",
        "Newton's second law for rotation: Σ τ = I α.",
        "Rolling without slipping links v = ω R; down a ramp, a = g sin θ / (1 + c), so a ball beats a disc and a disc beats a hoop.",
      ]} />
    </Article>
  );
}
