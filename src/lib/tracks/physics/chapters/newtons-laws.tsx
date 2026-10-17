"use client";

// Dynamics 1: Newton's three laws — what a force is and how forces add; the
// first law (inertia, Galileo's ramps, why everyday life hides it); the second
// law ΣF = m a, the newton, component form; mass versus weight; the third law
// and its pairs (never on the same body); the problem-solving recipe with the
// free-body diagram; two blocks pushed together.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { NewtonCartFigure } from "@/components/lesson/figures/physics/NewtonCartFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** A car's acceleration from its driving force and mass, and the 0–100 km/h time. */
const carNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const a = v.F / v.m, t100 = 27.78 / a;
  return {
    tex: r`a = \frac{${num(v.F, 0)}\ \text{N}}{${num(v.m, 0)}\ \text{kg}} = \amber{${num(a, 2)}\ \text{m/s}^2} \qquad t_{0\to100} = \frac{27.8\ \text{m/s}}{${num(a, 2)}\ \text{m/s}^2} = \green{${num(t100)}\ \text{s}}`,
    meter: Math.min(1, a / 10), meterLabel: `${num(a / 9.81, 2)} g · ${tx(t, "phNew_liveG", "in units of g")}`,
  };
};

export function NewtonsLawsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phNew_intro",
          "The last section described motion: positions, velocities, accelerations. This one asks why things move the way they do. The answer, published by Isaac Newton in 1687, fits in three short laws. With them you can predict the path of a thrown ball, the pull in a rope, the orbit of the Moon. They hold extremely well for everything bigger than an atom and slower than light, which covers most of daily life and all of engineering.")}
      </Lead>

      <Goals t={t} id="phNew" items={[
        "State Newton's three laws and say what each one means in practice.",
        "Add forces as vectors and use ΣF = m a to find an acceleration, a force or a mass.",
        "Tell mass from weight, and kilograms from newtons.",
        "Find the pair of any force, and explain why the two never cancel.",
      ]} />

      <H2>{tx(t, "phNew_forceTitle", "What a force is")}</H2>
      <p>
        {tx(t, "phNew_forceBody",
          "A force is a push or a pull on an object. It has a size and a direction, so it is a vector, drawn as an arrow. Some forces need contact: your hand on a door, a rope on a sled, the floor under your feet. Others act across empty space: gravity, and the electric and magnetic forces. Forces are measured in newtons (N); holding an apple of 100 g still takes about 1 N. When several forces act on the same object, what matters for its motion is their vector sum, the net force, written ΣF (Σ, the Greek capital sigma, means \"sum of\").")}
      </p>
      <Equation label={tx(t, "phNew_eqNet", "Net force")}
        where={[
          [r`\Sigma\vec F`, tx(t, "phNew_wNet", "the net force: the vector sum of every force on the object (N)")],
          [r`\vec F_1, \vec F_2, \dots`, tx(t, "phNew_wFi", "the individual forces; the arrow on top marks a vector")],
        ]}
        note={tx(t, "phNew_netNote", "Two people push a box east, one with 30 N, the other with 20 N: the net force is 50 N east. If the second pushes west instead, it is 10 N east. Pulling at right angles, 30 N east and 40 N north give √(30² + 40²) = 50 N, pointing between them.")}>
        {r`\Sigma\vec F = \vec F_1 + \vec F_2 + \vec F_3 + \cdots`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phNew_tSituation", "Situation"), tx(t, "phNew_tSize", "Force, roughly")]}
        rows={[
          [tx(t, "phNew_f1", "holding an apple"), "1 N"],
          [tx(t, "phNew_f2", "a person's weight (70 kg)"), "690 N"],
          [tx(t, "phNew_f3", "a car engine at full push"), "5 000 N"],
          [tx(t, "phNew_f4", "the Saturn V rocket at launch"), "35 000 000 N"],
        ]}
      />

      <H2>{tx(t, "phNew_firstTitle", "The first law: inertia")}</H2>
      <p>
        {tx(t, "phNew_firstBody",
          "For two thousand years people followed Aristotle: a moving object stops unless something keeps pushing it. Every cart, every ball rolling on grass seems to agree. Galileo saw past it with a thought experiment. Let a ball roll down one ramp and up another: it climbs to almost the same height. Make the second ramp less steep and the ball rolls farther to reach that height. Make it flat, and the ball has no height to reach: it would roll on for ever. The ball does not stop because motion runs out. It stops because friction and air push on it.")}
      </p>
      <Equation label={tx(t, "phNew_eqFirst", "Newton's first law")}
        where={[
          [r`\Sigma\vec F = 0`, tx(t, "phNew_wZero", "no force at all, or forces that cancel exactly")],
          [r`\vec v`, tx(t, "phNew_wVconst", "the velocity: its size and its direction both stay fixed")],
        ]}
        words={tx(t, "phNew_firstWords", "An object at rest stays at rest, and a moving object keeps moving in a straight line at constant speed, unless a net force acts on it.")}>
        {r`\Sigma\vec F = 0 \;\Longleftrightarrow\; \vec v = \text{constant}`}
      </Equation>
      <p>
        {tx(t, "phNew_inertiaBody",
          "This tendency to keep the same velocity is called inertia. The mass of an object, in kilograms, measures how much inertia it has: a full shopping trolley is harder to start and harder to stop than an empty one. The first law also needs a fair viewpoint: it holds in inertial frames, the ones that are not themselves accelerating, as the relative motion chapter showed. In a braking bus, a ball rolls forward with nothing pushing it; seen from the road, the ball simply keeps going while the bus slows down.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phNew_seatbelt", "A seat belt is the first law in action. In a crash the car stops in a fraction of a second, but your body keeps its speed until something applies a force to it. Better a wide belt across the hips and chest than the steering wheel.")}
      </Callout>

      <H2>{tx(t, "phNew_secondTitle", "The second law: ΣF = m a")}</H2>
      <p>
        {tx(t, "phNew_secondBody",
          "When the net force is not zero, the velocity changes: the object accelerates. Experiments show two simple facts. Double the net force and the acceleration doubles. Double the mass and the acceleration halves. Both together are the second law, the central equation of mechanics. It is a vector equation: the acceleration points in the same direction as the net force, not necessarily in the direction of motion.")}
      </p>
      <Equation label={tx(t, "phNew_eqSecond", "Newton's second law")}
        where={[
          [r`\Sigma\vec F`, tx(t, "phNew_wNet2", "the net force on the object (N)")],
          [r`m`, tx(t, "phNew_wM", "its mass (kg), the measure of its inertia")],
          [r`\vec a`, tx(t, "phNew_wA", "its acceleration (m/s²), in the direction of the net force")],
        ]}
        words={tx(t, "phNew_secondWords", "Acceleration equals net force divided by mass: a = ΣF / m.")}>
        {r`\Sigma\vec F = m\,\vec a`}
      </Equation>
      <p>
        {tx(t, "phNew_newtonBody",
          "The law defines the unit of force. One newton is the net force that gives a 1 kg mass an acceleration of 1 m/s². So 1 N = 1 kg·m/s², exactly the dimensions the units chapter found for force. The first law is the special case ΣF = 0: then a = 0 and the velocity stays constant.")}
      </p>
      <Equation label={tx(t, "phNew_eqComp", "The second law one axis at a time")}
        where={[
          [r`\Sigma F_x`, tx(t, "phNew_wFx", "the sum of the x components of all the forces (N)")],
          [r`a_x`, tx(t, "phNew_wAx", "the x component of the acceleration (m/s²)")],
        ]}
        note={tx(t, "phNew_compNote", "Like projectiles, forces split into independent directions. A box sliding on a floor has ΣF_y = 0 (it does not leave the floor) while ΣF_x decides how it speeds up or slows down.")}>
        {r`\Sigma F_x = m\,a_x \qquad \Sigma F_y = m\,a_y`}
      </Equation>
      <LiveFormula label={tx(t, "phNew_liveCar", "Try it: how quickly does a car reach 100 km/h?")}
        tex={r`a = \frac{F}{m} \qquad t_{0\to100} = \frac{27.8\ \text{m/s}}{a}`}
        vars={[
          { id: "F", label: "F (N)", min: 1000, max: 12000, step: 250, value: 4000, fmt: v => num(v, 0) },
          { id: "m", label: "m (kg)", min: 800, max: 2500, step: 50, value: 1400, fmt: v => num(v, 0) },
        ]}
        compute={carNumbers(t)}
        note={tx(t, "phNew_liveCarNote", "A 1 400 kg car pushed by 4 000 N (after air and road resistance) accelerates at 2.9 m/s² and needs almost 10 s. Add 400 kg of passengers and luggage and it takes 12.5 s. A sports car gets under 3 s with about 1 g, 9.8 m/s². This assumes a constant net force, which a real engine only roughly gives.")} />

      <NewtonCartFigure t={t} />

      <H3>{tx(t, "phNew_weightTitle", "Mass and weight")}</H3>
      <p>
        {tx(t, "phNew_weightBody",
          "Mass and weight are different quantities. Mass, in kilograms, is the amount of inertia and is the same everywhere. Weight is the gravitational force on the object, in newtons. Near the Earth's surface every object in free fall accelerates at g, so by the second law the force causing it must be m g.")}
      </p>
      <Equation label={tx(t, "phNew_eqWeight", "Weight")}
        where={[
          [r`W`, tx(t, "phNew_wW", "the weight: the pull of gravity on the object (N), pointing down")],
          [r`m`, tx(t, "phNew_wM2", "the mass (kg)")],
          [r`g`, tx(t, "phNew_wG", "the acceleration of free fall: 9.81 m/s² on Earth, 1.62 on the Moon, 3.71 on Mars")],
        ]}
        note={tx(t, "phNew_weightNote", "A 70 kg astronaut weighs 70 × 9.81 = 687 N on Earth and 70 × 1.62 = 113 N on the Moon, but has the same 70 kg of mass in both places: just as hard to push sideways. Bathroom scales show kilograms because they divide the force they feel by 9.81.")}>
        {r`W = m\,g`}
      </Equation>
      <p>
        {tx(t, "phNew_fallBody",
          "This explains Galileo's discovery that everything falls with the same acceleration. A body twice as heavy is pulled twice as hard, but it also has twice the inertia: a = W/m = mg/m = g. The mass cancels.")}
      </p>

      <H2>{tx(t, "phNew_thirdTitle", "The third law: forces come in pairs")}</H2>
      <p>
        {tx(t, "phNew_thirdBody",
          "A force is always an interaction between two objects. If A pushes or pulls on B, then B pushes or pulls on A with a force of the same size in the opposite direction, at the same instant. The two forces are of the same kind (both contact, both gravitational…), and, the important part, they act on different objects. That is why they never cancel each other: cancelling only happens between forces on the same object.")}
      </p>
      <Equation label={tx(t, "phNew_eqThird", "Newton's third law")}
        where={[
          [r`\vec F_{\text{A on B}}`, tx(t, "phNew_wAB", "the force that A exerts on B")],
          [r`\vec F_{\text{B on A}}`, tx(t, "phNew_wBA", "the force that B exerts on A")],
        ]}
        words={tx(t, "phNew_thirdWords", "Whatever pushes is pushed back just as hard.")}>
        {r`\vec F_{\text{A on B}} = -\,\vec F_{\text{B on A}}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phNew_tForce", "Force"), tx(t, "phNew_tPartner", "Its pair"), tx(t, "phNew_tEffect", "What it explains")]}
        rows={[
          [tx(t, "phNew_p1", "your foot pushes the ground backwards"), tx(t, "phNew_p1p", "the ground pushes your foot forwards"), tx(t, "phNew_p1e", "walking: the forward force on you comes from the ground")],
          [tx(t, "phNew_p2", "a rocket pushes hot gas down"), tx(t, "phNew_p2p", "the gas pushes the rocket up"), tx(t, "phNew_p2e", "rockets work in empty space; they need no air to push on")],
          [tx(t, "phNew_p3", "the Earth pulls an apple down (1 N)"), tx(t, "phNew_p3p", "the apple pulls the Earth up (1 N)"), tx(t, "phNew_p3e", "the Earth's acceleration is 1 N ÷ 6 × 10²⁴ kg, far too small to notice")],
          [tx(t, "phNew_p4", "a gun pushes a bullet forwards"), tx(t, "phNew_p4p", "the bullet pushes the gun backwards"), tx(t, "phNew_p4e", "recoil")],
        ]}
      />
      <p>
        {tx(t, "phNew_bookBody",
          "A book resting on a table feels two forces: its weight, down, and the table's push, up. They are equal and opposite, but they are not a third-law pair. They act on the same object (the book), they are different kinds of force, and they balance because the book does not accelerate, which is the first law. The pair of the book's weight is the book pulling the Earth up. The pair of the table's push is the book pushing down on the table.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phNew_horse", "The horse-and-cart puzzle: if the cart pulls back on the horse as hard as the horse pulls the cart, how can they move? Look at the forces on the cart alone: the horse pulls it forward and friction holds it back, and if the pull wins the cart accelerates. The horse moves because the ground pushes its hooves forward harder than the cart pulls it back. Each object is decided by the forces on it, never by the forces it exerts.")}
      </Callout>

      <H2>{tx(t, "phNew_recipeTitle", "Solving problems: the free-body diagram")}</H2>
      <p>
        {tx(t, "phNew_recipeBody",
          "Almost every dynamics problem yields to the same five steps. The key step is the second: a free-body diagram is a sketch of one object alone, shown as a dot, with an arrow for every force acting on it, and nothing else. Forces the object exerts on other things do not belong in it.")}
      </p>
      <LessonTable
        headers={[tx(t, "phNew_tStep", "Step"), tx(t, "phNew_tDo", "What to do")]}
        rows={[
          ["1", tx(t, "phNew_r1", "Choose the object (or the group of objects) to study.")],
          ["2", tx(t, "phNew_r2", "Draw its free-body diagram: every force on it, from contact and from gravity.")],
          ["3", tx(t, "phNew_r3", "Choose axes, ideally one along the acceleration.")],
          ["4", tx(t, "phNew_r4", "Write ΣF_x = m a_x and ΣF_y = m a_y.")],
          ["5", tx(t, "phNew_r5", "Solve, then check the units and an extreme case (what if a mass were 0?).")],
        ]}
      />
      <p>
        {tx(t, "phNew_blocksBody",
          "An example: two blocks touch on a frictionless floor, 5 kg on the left and 3 kg on the right. You push the left one with 16 N. How hard does the left block push the right one? Treat both as one object first, then look at the right block on its own.")}
      </p>
      <Derivation t={t} label={tx(t, "phNew_eqBlocks", "Two blocks pushed together")}
        steps={[
          { tex: r`a = \frac{\Sigma F}{m_1 + m_2} = \frac{16}{5 + 3} = 2\ \text{m/s}^2`, why: tx(t, "phNew_b1", "both blocks together: the only horizontal force is your 16 N push") },
          { tex: r`\Sigma F_{\text{right}} = m_2\, a`, why: tx(t, "phNew_b2", "now the 3 kg block alone; the only horizontal force on it is the push P from the left block") },
          { tex: r`P = 3 \times 2 = \green{6\ \text{N}}`, why: tx(t, "phNew_b3", "the force between the blocks") },
          { tex: r`16 - 6 = 5 \times 2 \;\checkmark`, why: tx(t, "phNew_b4", "check with the 5 kg block: your 16 N forward, the right block's 6 N back (third law), net 10 N") },
        ]} />

      <H2>{tx(t, "phNew_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phNew_ex1", "1. A 1 200 kg car brakes from 20 m/s to rest in 4 s. Its acceleration is (0 − 20)/4 = −5 m/s², so the net force is 1 200 × (−5) = −6 000 N: 6 kN against the motion, supplied by the road on the tyres.")}</p>
      <p>{tx(t, "phNew_ex2", "2. You lift a 2 kg bag with a 25 N upward pull. Its weight is 2 × 9.81 = 19.6 N down. The net force is 25 − 19.6 = 5.4 N up, so a = 5.4 / 2 = 2.7 m/s² upward. To hold it still you would need exactly 19.6 N.")}</p>
      <p>{tx(t, "phNew_ex3", "3. A bat hits a 0.145 kg baseball arriving at 40 m/s and sends it back at 50 m/s, in 0.7 ms of contact. The velocity changes by 90 m/s, so a = 90 / 0.0007 ≈ 129 000 m/s² and the average force is 0.145 × 129 000 ≈ 19 000 N, the weight of about two tonnes, for less than a thousandth of a second.")}</p>
      <p>{tx(t, "phNew_ex4", "4. Skaters of 50 kg and 75 kg push each other with 150 N for 0.4 s. Each feels 150 N (third law). The lighter one accelerates at 150/50 = 3 m/s² and leaves at 1.2 m/s; the heavier at 150/75 = 2 m/s² and leaves at 0.8 m/s. Notice 50 × 1.2 = 75 × 0.8 = 60: that equality has a name, momentum, and its own chapter.")}</p>

      <H2>{tx(t, "phNew_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phNew_tWrong", "Wrong"), tx(t, "phNew_tRight", "Right"), tx(t, "phNew_tWhy", "Why")]}
        rows={[
          [tx(t, "phNew_m1w", "a moving object needs a force to keep moving"), tx(t, "phNew_m1r", "it needs a force to change its motion"), tx(t, "phNew_m1", "friction is the hidden force that stops things")],
          [tx(t, "phNew_m2w", "F = m a with just one force"), tx(t, "phNew_m2r", "ΣF = m a, with the net force"), tx(t, "phNew_m2", "every force on the object counts")],
          [tx(t, "phNew_m3w", "action and reaction cancel"), tx(t, "phNew_m3r", "they act on different objects"), tx(t, "phNew_m3", "only forces on the same object can cancel")],
          [tx(t, "phNew_m4w", "weight and normal force are a third-law pair"), tx(t, "phNew_m4r", "they act on the same body; they balance by the first law"), tx(t, "phNew_m4", "the pair of the weight is on the Earth")],
          [tx(t, "phNew_m5w", "my weight is 70 kg"), tx(t, "phNew_m5r", "my mass is 70 kg; my weight is 687 N"), tx(t, "phNew_m5", "weight is a force, measured in newtons")],
          [tx(t, "phNew_m6w", "the acceleration points where the object moves"), tx(t, "phNew_m6r", "it points along the net force"), tx(t, "phNew_m6", "a braking car moves forward and accelerates backward")],
        ]}
      />

      <KeyIdeas t={t} id="phNew" items={[
        "A force is a push or pull with size and direction; what moves an object is the net force ΣF, the vector sum.",
        "First law: with no net force, velocity stays constant (at rest or in a straight line at constant speed).",
        "Second law: ΣF = m a, one axis at a time; 1 N = 1 kg·m/s².",
        "Mass (kg) measures inertia; weight W = m g (N) is the pull of gravity.",
        "Third law: forces come in equal and opposite pairs acting on two different objects, so they never cancel.",
        "Solve problems with a free-body diagram of one object and ΣF = m a along chosen axes.",
      ]} />
    </Article>
  );
}
