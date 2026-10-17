"use client";

// Conservation & Rotation 1: momentum and collisions — p = m v; Newton's
// second law as F = Δp/Δt; impulse and why soft landings hurt less;
// conservation of momentum derived from the third law; centre of mass and
// its constant velocity; elastic, inelastic and perfectly inelastic
// collisions (the 1D elastic formulas derived); coefficient of restitution;
// the ballistic pendulum; recoil and rockets; collisions in two dimensions.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { CollisionFigure } from "@/components/lesson/figures/physics/CollisionFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Two cars that lock together: common speed and the share of kinetic energy lost. */
const crashNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const u = (v.m1 * v.v1) / (v.m1 + v.m2);
  const lost = v.m2 / (v.m1 + v.m2);
  return {
    tex: r`v = \frac{${num(v.m1, 0)} \times ${num(v.v1, 0)}}{${num(v.m1, 0)} + ${num(v.m2, 0)}} = \amber{${num(u)}\ \text{m/s}} \qquad \text{${tx(t, "phMom_liveLost", "kinetic energy lost")}} = \frac{m_2}{m_1 + m_2} = \red{${num(lost * 100, 0)}\,\%}`,
    meter: lost, meterLabel: `${num(lost * 100, 0)} % ${tx(t, "phMom_liveHeat", "into heat, sound and bent metal")}`,
  };
};

export function MomentumCollisionsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phMom_intro",
          "A ping-pong ball and a bowling ball roll towards you at the same speed. Both have the same velocity, yet you would much rather stop the first. What makes the second hard to stop is its momentum, mass times velocity. This chapter shows that momentum is the quantity Newton's second law is really about, that the third law makes the total momentum of a system impossible to change from inside, and how that one fact settles every collision, explosion and rocket launch.")}
      </Lead>

      <Goals t={t} id="phMom" items={[
        "Compute momentum and impulse, and explain why a longer stopping time means a smaller force.",
        "Derive conservation of momentum from Newton's third law, and say when it applies.",
        "Use the centre of mass of a system and its constant velocity.",
        "Solve elastic and inelastic collisions in one dimension, and say where the kinetic energy goes.",
      ]} />

      <H2>{tx(t, "phMom_pTitle", "Momentum")}</H2>
      <p>
        {tx(t, "phMom_pBody",
          "The momentum of an object is its mass times its velocity. It is a vector: it points the same way as the velocity, so a ball moving left has negative momentum if right is positive. Its unit is the kilogram metre per second, kg·m/s. A slow heavy object and a fast light one can have the same momentum.")}
      </p>
      <Equation label={tx(t, "phMom_eqP", "Momentum")}
        where={[
          [r`\vec p`, tx(t, "phMom_wP", "the momentum (kg·m/s), a vector")],
          [r`m`, tx(t, "phMom_wM", "the mass (kg)")],
          [r`\vec v`, tx(t, "phMom_wV", "the velocity (m/s), with its direction")],
        ]}>
        {r`\vec p = m\, \vec v`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phMom_tObj", "Object"), tx(t, "phMom_tMV", "Mass × speed"), tx(t, "phMom_tP", "Momentum")]}
        rows={[
          [tx(t, "phMom_o1", "a rifle bullet"), "0.01 kg × 400 m/s", "4 kg·m/s"],
          [tx(t, "phMom_o2", "a tennis serve"), "0.057 kg × 55 m/s", "3.1 kg·m/s"],
          [tx(t, "phMom_o3", "a person walking"), "70 kg × 1.4 m/s", "98 kg·m/s"],
          [tx(t, "phMom_o4", "a car at 90 km/h"), "1 200 kg × 25 m/s", "30 000 kg·m/s"],
          [tx(t, "phMom_o5", "an oil tanker at 25 km/h"), "3 × 10⁸ kg × 7 m/s", "2 × 10⁹ kg·m/s"],
        ]}
      />

      <H2>{tx(t, "phMom_impTitle", "Force changes momentum: impulse")}</H2>
      <p>
        {tx(t, "phMom_impBody",
          "Newton himself wrote the second law in terms of momentum. Acceleration is the change of velocity per unit time, Δv/Δt, so for a constant mass the net force is m Δv/Δt, the change of momentum per unit time. Multiply both sides by Δt and you get the impulse: a force acting for a time changes the momentum by force × time.")}
      </p>
      <Equation label={tx(t, "phMom_eqImp", "Second law and impulse")}
        where={[
          [r`\vec F_{\text{net}}`, tx(t, "phMom_wF", "the net force on the object (N)")],
          [r`\Delta \vec p`, tx(t, "phMom_wDp", "the change of momentum, final minus initial (kg·m/s)")],
          [r`\Delta t`, tx(t, "phMom_wDt", "the time the force acts (s)")],
          [r`\vec J`, tx(t, "phMom_wJ", "the impulse (N·s, the same unit as kg·m/s)")],
        ]}
        words={tx(t, "phMom_impWords", "Force is the rate of change of momentum; force × time is the change of momentum.")}
        note={tx(t, "phMom_impNote", "When the force changes during the contact, as it always does in a collision, the impulse is the area under the graph of F against t, and the average force is that area divided by Δt.")}>
        {r`\vec F_{\text{net}} = \frac{\Delta \vec p}{\Delta t} \qquad \vec J = \vec F_{\text{net}}\, \Delta t = \Delta \vec p`}
      </Equation>
      <p>
        {tx(t, "phMom_softBody",
          "This explains every soft landing. To stop, the momentum must change by a fixed amount, Δp = m v. The force needed is Δp/Δt, so stretching the stopping time shrinks the force. An egg (60 g at 5 m/s, Δp = 0.3 kg·m/s) dropped on a hard floor stops in about a millisecond: 300 N, and it breaks. On a cushion it stops in a tenth of a second: 3 N, and it survives.")}
      </p>
      <LessonTable
        headers={[tx(t, "phMom_tTrick", "What lengthens Δt"), tx(t, "phMom_tWhere", "Where")]}
        rows={[
          [tx(t, "phMom_k1", "crumple zones, seatbelts that stretch, airbags"), tx(t, "phMom_k1w", "cars: a 70 kg person stopping from 50 km/h in 0.1 s feels 9.7 kN; against the dashboard in 0.01 s, ten times that")],
          [tx(t, "phMom_k2", "bending your knees"), tx(t, "phMom_k2w", "jumping down from a wall")],
          [tx(t, "phMom_k3", "moving your hands back as you catch"), tx(t, "phMom_k3w", "catching a hard ball")],
          [tx(t, "phMom_k4", "mats, sand pits, helmets' foam"), tx(t, "phMom_k4w", "gymnastics, long jump, cycling")],
        ]}
      />
      <p>
        {tx(t, "phMom_followBody",
          "The same idea works the other way. A golfer or tennis player follows through: keeping the club or racket in contact with the ball for longer gives a larger impulse, and so a faster ball, for the same force.")}
      </p>

      <H2>{tx(t, "phMom_consTitle", "Conservation of momentum")}</H2>
      <p>
        {tx(t, "phMom_consBody",
          "Now take two objects that push on each other, in a collision, an explosion, or two skaters shoving apart. By the third law, the force of 1 on 2 and the force of 2 on 1 are equal and opposite at every instant, and they act for exactly the same time. So their impulses are equal and opposite too.")}
      </p>
      <Derivation t={t} label={tx(t, "phMom_eqCons", "From the third law to conservation")}
        steps={[
          { tex: r`\vec F_{1\to 2} = -\vec F_{2\to 1}`, why: tx(t, "phMom_c1", "third law: the forces of the pair on each other, at each instant") },
          { tex: r`\vec F_{1\to 2}\, \Delta t = -\vec F_{2\to 1}\, \Delta t`, why: tx(t, "phMom_c2", "both act for the same time Δt, while the objects touch") },
          { tex: r`\Delta \vec p_2 = -\Delta \vec p_1`, why: tx(t, "phMom_c3", "impulse = change of momentum, for each object") },
          { tex: r`\Delta \vec p_1 + \Delta \vec p_2 = 0`, why: tx(t, "phMom_c4", "move everything to one side") },
          { tex: r`\green{\vec p_1 + \vec p_2 = \text{constant}}`, why: tx(t, "phMom_c5", "the total does not change") },
        ]} />
      <Equation label={tx(t, "phMom_eqConsLaw", "Conservation of momentum")}
        where={[
          [r`m_1, m_2`, tx(t, "phMom_wMs", "the two masses (kg)")],
          [r`v_1, v_2`, tx(t, "phMom_wVs", "their velocities before (m/s)")],
          [r`u_1, u_2`, tx(t, "phMom_wUs", "their velocities after (m/s)")],
        ]}
        words={tx(t, "phMom_consWords", "If no outside force acts, the total momentum of a system is the same before and after anything happens inside it.")}
        note={tx(t, "phMom_consNote", "\"No outside force\" is the condition, and it is rarely exactly true. But in a collision the forces between the objects are huge and last only milliseconds, so the impulse of outside forces like friction or gravity in that time is tiny: momentum is conserved through the collision itself to excellent accuracy.")}>
        {r`m_1 v_1 + m_2 v_2 = m_1 u_1 + m_2 u_2`}
      </Equation>
      <p>
        {tx(t, "phMom_anyBody",
          "Nothing in the argument depends on what the forces are: springs, glue, magnets, explosives. Inside forces always come in third-law pairs, so they can move momentum from one part of a system to another but never change the total. That makes conservation of momentum one of the most useful laws in physics: you can use it without knowing anything about the forces.")}
      </p>

      <H3>{tx(t, "phMom_cmTitle", "The centre of mass")}</H3>
      <p>
        {tx(t, "phMom_cmBody",
          "The centre of mass of a system is the mass-weighted average of the positions of its parts. Take its rate of change and you get the mass-weighted average of the velocities, which is the total momentum divided by the total mass. So when the total momentum is constant, the centre of mass moves in a straight line at constant speed, whatever the parts are doing.")}
      </p>
      <Equation label={tx(t, "phMom_eqCm", "Centre of mass")}
        where={[
          [r`x_{\text{cm}}`, tx(t, "phMom_wXcm", "the position of the centre of mass (m)")],
          [r`M`, tx(t, "phMom_wMtot", "the total mass, m₁ + m₂ + … (kg)")],
          [r`v_{\text{cm}}`, tx(t, "phMom_wVcm", "its velocity: the total momentum divided by the total mass")],
        ]}
        note={tx(t, "phMom_cmNote", "A firework shell that bursts in mid-air: the pieces fly every way, but their centre of mass carries on along the same parabola the shell was following, until the first piece hits the ground (only gravity, an outside force, acts on the system).")}>
        {r`x_{\text{cm}} = \frac{m_1 x_1 + m_2 x_2 + \dots}{M} \qquad v_{\text{cm}} = \frac{m_1 v_1 + m_2 v_2 + \dots}{M} = \frac{p_{\text{total}}}{M}`}
      </Equation>

      <H2>{tx(t, "phMom_colTitle", "Collisions")}</H2>
      <p>
        {tx(t, "phMom_colBody",
          "Momentum is conserved in every collision. Kinetic energy is not: some of it can turn into heat, sound and the work of bending things. Collisions are sorted by what happens to it.")}
      </p>
      <LessonTable
        headers={[tx(t, "phMom_tType", "Type"), tx(t, "phMom_tKE", "Kinetic energy"), tx(t, "phMom_tEx", "Examples")]}
        rows={[
          [tx(t, "phMom_c_el", "elastic"), tx(t, "phMom_c_elK", "conserved"), tx(t, "phMom_c_elE", "snooker balls (almost), atoms in a gas, a spacecraft swinging past a planet")],
          [tx(t, "phMom_c_in", "inelastic"), tx(t, "phMom_c_inK", "partly lost"), tx(t, "phMom_c_inE", "a bouncing tennis ball, most car crashes, a football kicked")],
          [tx(t, "phMom_c_pi", "perfectly inelastic"), tx(t, "phMom_c_piK", "the most that can be lost: the objects stick together"), tx(t, "phMom_c_piE", "a bullet stuck in a block, a coupling train wagon, a tackle")],
        ]}
      />

      <H3>{tx(t, "phMom_stickTitle", "Sticking together")}</H3>
      <p>
        {tx(t, "phMom_stickBody",
          "If the two objects end up moving together at one common velocity u, conservation of momentum alone gives the answer: (m₁ + m₂) u = m₁ v₁ + m₂ v₂. Even when they stick, they keep the velocity of the centre of mass, the one bit of motion the collision cannot destroy. All the rest of the kinetic energy, the motion relative to the centre of mass, is lost.")}
      </p>
      <LiveFormula label={tx(t, "phMom_liveCrash", "Try it: a car runs into a parked car and they lock together")}
        tex={r`v = \frac{m_1 v_1}{m_1 + m_2}`}
        vars={[
          { id: "m1", label: "m₁ (kg)", min: 500, max: 3000, step: 100, value: 1500, fmt: v => `${num(v, 0)} kg` },
          { id: "v1", label: "v₁ (m/s)", min: 5, max: 30, step: 1, value: 20, fmt: v => `${num(v, 0)} m/s` },
          { id: "m2", label: "m₂ (kg)", min: 500, max: 3000, step: 100, value: 1000, fmt: v => `${num(v, 0)} kg` },
        ]}
        compute={crashNumbers(t)}
        note={tx(t, "phMom_liveCrashNote", "A 1 500 kg car at 20 m/s hits a parked 1 000 kg car: they move off at 12 m/s, and 40 % of the 300 kJ of kinetic energy, 120 kJ, goes into crumpling metal. The fraction lost is m₂/(m₁ + m₂): a lorry running into a small car loses little energy; a small car running into a lorry loses almost all of it.")} />

      <H3>{tx(t, "phMom_elTitle", "Elastic collisions in one dimension")}</H3>
      <p>
        {tx(t, "phMom_elBody",
          "In an elastic collision both momentum and kinetic energy are conserved. That gives two equations for the two unknown final velocities, and a neat trick solves them.")}
      </p>
      <Derivation t={t} label={tx(t, "phMom_eqElastic", "The elastic collision, solved")}
        steps={[
          { tex: r`m_1 (v_1 - u_1) = m_2 (u_2 - v_2)`, why: tx(t, "phMom_e1", "momentum, with each mass's terms gathered on one side") },
          { tex: r`m_1 (v_1^2 - u_1^2) = m_2 (u_2^2 - v_2^2)`, why: tx(t, "phMom_e2", "kinetic energy, the same way (the ½ cancels)") },
          { tex: r`m_1 (v_1 - u_1)(v_1 + u_1) = m_2 (u_2 - v_2)(u_2 + v_2)`, why: tx(t, "phMom_e3", "difference of squares, a² − b² = (a − b)(a + b)") },
          { tex: r`v_1 + u_1 = u_2 + v_2`, why: tx(t, "phMom_e4", "divide by the first line (allowed when something actually happened, u₁ ≠ v₁)") },
          { tex: r`\green{u_2 - u_1 = -(v_2 - v_1)}`, why: tx(t, "phMom_e5", "rearrange: the speed at which they separate equals the speed at which they approached") },
          { tex: r`u_1 = \frac{(m_1 - m_2)\, v_1 + 2 m_2 v_2}{m_1 + m_2} \qquad u_2 = \frac{(m_2 - m_1)\, v_2 + 2 m_1 v_1}{m_1 + m_2}`, why: tx(t, "phMom_e6", "solve the last line together with momentum") },
        ]} />
      <LessonTable
        headers={[tx(t, "phMom_tCase", "Case (2 at rest)"), tx(t, "phMom_tAfter", "After"), tx(t, "phMom_tSeen", "Where you see it")]}
        rows={[
          [tx(t, "phMom_q1", "equal masses"), tx(t, "phMom_q1a", "1 stops, 2 leaves at v₁: they swap velocities"), tx(t, "phMom_q1s", "snooker, Newton's cradle")],
          [tx(t, "phMom_q2", "heavy hits light"), tx(t, "phMom_q2a", "1 hardly slows, 2 leaves at up to 2 v₁"), tx(t, "phMom_q2s", "a golf club and ball")],
          [tx(t, "phMom_q3", "light hits heavy"), tx(t, "phMom_q3a", "1 bounces back at almost v₁, 2 barely moves"), tx(t, "phMom_q3s", "a ball against a wall")],
        ]}
      />
      <p>
        {tx(t, "phMom_eBody",
          "Real collisions are in between. The coefficient of restitution e measures how bouncy one is: the separation speed divided by the approach speed. e = 1 is elastic, e = 0 means the objects stick, and a tennis ball on a court is about 0.75. A ball dropped from height h and bouncing with restitution e rises to e² h, since the height goes with the speed squared.")}
      </p>
      <Equation label={tx(t, "phMom_eqE", "Coefficient of restitution")}
        where={[
          [r`e`, tx(t, "phMom_wE", "the coefficient of restitution, between 0 and 1")],
          [r`u_2 - u_1`, tx(t, "phMom_wSep", "the speed at which they separate")],
          [r`v_1 - v_2`, tx(t, "phMom_wApp", "the speed at which they approached")],
        ]}>
        {r`e = \frac{u_2 - u_1}{v_1 - v_2}`}
      </Equation>
      <CollisionFigure t={t} />

      <H3>{tx(t, "phMom_balTitle", "The ballistic pendulum")}</H3>
      <p>
        {tx(t, "phMom_balBody",
          "How do you measure the speed of a bullet without electronics? Fire it into a hanging wooden block, where it sticks, and measure how high the block swings. The problem has two stages, and each needs its own law. During the impact, which lasts a fraction of a millisecond, the string has no time to act: momentum is conserved, but kinetic energy is not. During the swing, only gravity does work: energy is conserved, but momentum is not (gravity and the string are outside forces).")}
      </p>
      <Derivation t={t} label={tx(t, "phMom_eqBal", "Bullet speed from the swing height")}
        steps={[
          { tex: r`\tfrac12 (m + M)\, u^2 = (m + M)\, g\, h \;\Rightarrow\; u = \sqrt{2 g h}`, why: tx(t, "phMom_b1", "the swing: kinetic energy of block + bullet becomes height h") },
          { tex: r`m\, v = (m + M)\, u`, why: tx(t, "phMom_b2", "the impact: momentum of the bullet = momentum of block + bullet") },
          { tex: r`\green{v = \frac{m + M}{m} \sqrt{2 g h}}`, why: tx(t, "phMom_b3", "combine the two") },
        ]} />
      <p>
        {tx(t, "phMom_balNum",
          "A 10 g bullet into a 2 kg block that rises 10 cm: u = √(2 × 9.81 × 0.10) = 1.40 m/s, so v = (2.01 / 0.01) × 1.40 = 282 m/s. Only m/(m + M) = 0.5 % of the bullet's kinetic energy survives the impact; the rest goes into splintering wood and heat. Using energy conservation through the impact would give a hopelessly wrong answer.")}
      </p>

      <H2>{tx(t, "phMom_recoilTitle", "Explosions, recoil and rockets")}</H2>
      <p>
        {tx(t, "phMom_recoilBody",
          "An explosion is a collision run backwards: everything starts at rest with zero total momentum, so the pieces must fly apart with momenta that add up to zero. A 4 kg rifle firing a 10 g bullet at 400 m/s recoils at 0.01 × 400 / 4 = 1 m/s. That is recoil, and it is also how a rocket works.")}
      </p>
      <p>
        {tx(t, "phMom_rocketBody",
          "A rocket carries its own reaction mass. Every second it throws a mass Δm/Δt of hot gas backwards at the exhaust speed v_ex, giving that gas momentum; the rocket gets the same momentum forwards. It needs nothing to push against, which is why rockets work in empty space, and best there.")}
      </p>
      <Equation label={tx(t, "phMom_eqThrust", "Rocket thrust")}
        where={[
          [r`F_{\text{thrust}}`, tx(t, "phMom_wTh", "the forward force on the rocket (N)")],
          [r`v_{\text{ex}}`, tx(t, "phMom_wVex", "the speed of the exhaust relative to the rocket (m/s)")],
          [r`\Delta m / \Delta t`, tx(t, "phMom_wRate", "the mass of fuel burned per second (kg/s)")],
        ]}
        note={tx(t, "phMom_thrustNote", "Burning 2 500 kg of propellant per second with a 3 000 m/s exhaust gives 7.5 MN, about the lift-off thrust of a large modern rocket.")}>
        {r`F_{\text{thrust}} = v_{\text{ex}}\, \frac{\Delta m}{\Delta t}`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "phMom_tsiol", "As the fuel burns the rocket gets lighter, so the same thrust accelerates it more and more. Adding up all the small kicks (an integral) gives the rocket equation of Tsiolkovsky, Δv = v_ex ln(m₀/m_f), where m₀ is the mass at the start, m_f at the end, and ln is the natural logarithm. With a 3 km/s exhaust, a rocket that is 90 % fuel (m₀/m_f = 10) gains 3 × ln 10 = 6.9 km/s. Reaching orbit needs about 9.4 km/s, counting losses to gravity and air, which is why rockets are built in stages.")}
      </Callout>

      <H2>{tx(t, "phMom_2dTitle", "Collisions in two dimensions")}</H2>
      <p>
        {tx(t, "phMom_2dBody",
          "Momentum is a vector, so its conservation is really two (or three) laws at once, one for each component. In a glancing collision on a snooker table, the total x-momentum and the total y-momentum are each conserved separately. One famous result: when a ball hits an identical ball at rest elastically and not head-on, the two leave at exactly 90° to each other, as every snooker player knows from the cue ball's path.")}
      </p>
      <Equation label={tx(t, "phMom_eq2d", "Conservation, component by component")}
        where={[
          [r`p_x, p_y`, tx(t, "phMom_wPxy", "the components of the total momentum, each conserved on its own")],
        ]}>
        {r`\sum m\, v_x \text{ (before)} = \sum m\, u_x \text{ (after)} \qquad \sum m\, v_y \text{ (before)} = \sum m\, u_y \text{ (after)}`}
      </Equation>

      <H2>{tx(t, "phMom_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phMom_ex1", "1. A 0.15 kg ball arrives at 30 m/s and is hit straight back at 40 m/s. Taking its first direction as positive, Δp = 0.15 × (−40 − 30) = −10.5 kg·m/s. If the bat touches it for 1.5 ms, the average force is 10.5 / 0.0015 = 7 000 N.")}</p>
      <p>{tx(t, "phMom_ex2", "2. A 2 kg cart at 3 m/s hits a 1 kg cart at rest, elastically. u₁ = (2 − 1)/3 × 3 = 1 m/s and u₂ = 2 × 2/3 × 3 = 4 m/s. Check: momentum 6 = 2 × 1 + 1 × 4, energy 9 J = 1 J + 8 J.")}</p>
      <p>{tx(t, "phMom_ex3", "3. A 60 kg skater at rest throws a 5 kg ball forwards at 6 m/s. Total momentum stays 0: 60 v + 5 × 6 = 0, so she slides back at 0.5 m/s.")}</p>
      <p>{tx(t, "phMom_ex4", "4. A ball dropped from 2 m bounces to 1.28 m. The speeds go as the square root of the heights, so e = √(1.28 / 2) = 0.8.")}</p>
      <p>{tx(t, "phMom_ex5", "5. A 3 kg firework shell at the top of its flight, momentarily at rest, bursts into a 1 kg piece flying east at 20 m/s and a 2 kg piece. The 2 kg piece must carry −20 kg·m/s: 10 m/s west.")}</p>

      <H2>{tx(t, "phMom_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phMom_tWrong", "Wrong"), tx(t, "phMom_tRight", "Right"), tx(t, "phMom_tWhy", "Why")]}
        rows={[
          [tx(t, "phMom_m1w", "ignoring the sign of velocity"), tx(t, "phMom_m1r", "momentum is a vector"), tx(t, "phMom_m1", "a ball bouncing back changes momentum by m(v + u), not m(v − u)")],
          [tx(t, "phMom_m2w", "kinetic energy is conserved in every collision"), tx(t, "phMom_m2r", "only in elastic ones"), tx(t, "phMom_m2", "momentum always is; kinetic energy often turns into heat")],
          [tx(t, "phMom_m3w", "momentum is conserved during the pendulum's swing"), tx(t, "phMom_m3r", "only during the short impact"), tx(t, "phMom_m3", "gravity and the string are outside forces during the swing")],
          [tx(t, "phMom_m4w", "a soft landing reduces the change of momentum"), tx(t, "phMom_m4r", "it spreads the same change over more time"), tx(t, "phMom_m4", "F = Δp / Δt")],
          [tx(t, "phMom_m5w", "a rocket pushes against the air"), tx(t, "phMom_m5r", "it pushes against its own exhaust"), tx(t, "phMom_m5", "it works even better in vacuum")],
        ]}
      />

      <KeyIdeas t={t} id="phMom" items={[
        "Momentum p = m v is a vector; the net force is its rate of change, F = Δp/Δt.",
        "Impulse F Δt = Δp: a longer contact time means a smaller force for the same change of momentum.",
        "By the third law, forces inside a system cancel in pairs, so the total momentum of an isolated system is conserved.",
        "The centre of mass moves at constant velocity, p_total / M, whatever happens inside.",
        "Momentum is conserved in every collision; kinetic energy only in elastic ones. Objects that stick lose the most.",
        "In a 1D elastic collision the objects separate as fast as they approached; e measures how far a real collision falls short.",
      ]} />
    </Article>
  );
}
