"use client";

// Dynamics 2: the everyday forces — weight; the normal force (adjusts itself,
// is not always mg; apparent weight in a lift); static and kinetic friction
// with a table of coefficients; the inclined plane derived (critical angle,
// sliding acceleration); tension, ideal ropes and pulleys, the Atwood machine;
// springs and Hooke's law; air drag and terminal velocity.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { InclineFigure } from "@/components/lesson/figures/physics/InclineFigure";
import { ElevatorFigure } from "@/components/lesson/figures/physics/ElevatorFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Acceleration of a block sliding down a slope with kinetic friction. */
const slopeNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const th = (v.deg * Math.PI) / 180, s = Math.sin(th), c = Math.cos(th);
  const a = 9.81 * (s - v.mu * c);
  if (a <= 0) return { tex: r`9.81\,(${num(s, 3)} - ${num(v.mu, 2)} \times ${num(c, 3)}) = ${num(a, 2)} \;\Rightarrow\; \red{\text{${tx(t, "phFor_liveStops", "friction wins: a sliding block slows down and stops")}}}` };
  return {
    tex: r`a = 9.81\,(\underbrace{${num(s, 3)}}_{\sin\theta} - ${num(v.mu, 2)} \times \underbrace{${num(c, 3)}}_{\cos\theta}) = \amber{${num(a, 2)}\ \text{m/s}^2}`,
    meter: a / 9.81, meterLabel: `${num((a / 9.81) * 100, 0)} % ${tx(t, "phFor_liveOfG", "of g")}`,
  };
};

export function ForcesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phFor_intro",
          "Newton's second law turns forces into motion, but only once you know the forces. This chapter meets the handful that appear in almost every problem on the ground: weight, the push of a surface, friction, the pull of a rope, the push of a spring and the drag of the air. Each one has its own simple rule, and most of the skill lies in drawing them correctly on a free-body diagram.")}
      </Lead>

      <Goals t={t} id="phFor" items={[
        "Find the normal force in a given situation, and know when it is not m g.",
        "Use static and kinetic friction correctly, including when static friction is less than its maximum.",
        "Solve a block on a slope: when it holds, and how fast it slides.",
        "Work with tensions in ropes over pulleys, springs (Hooke's law) and air drag.",
      ]} />

      <H2>{tx(t, "phFor_weightTitle", "Weight")}</H2>
      <p>
        {tx(t, "phFor_weightBody",
          "Weight is the gravitational pull of the Earth, W = m g, pointing down, towards the centre of the Earth. It acts on every part of the object, but for motion it can be drawn as one arrow from the centre of mass. The value of g changes slightly from place to place: 9.78 m/s² at the equator, 9.83 m/s² at the poles, less on top of a mountain. We use 9.81 m/s².")}
      </p>

      <H2>{tx(t, "phFor_normalTitle", "The normal force")}</H2>
      <p>
        {tx(t, "phFor_normalBody",
          "Put a book on a table and the table pushes up on it. This push from a surface, always perpendicular to the surface (\"normal\" means perpendicular), is the normal force N. It comes from the surface being squeezed very slightly, like a stiff spring, and it adjusts itself to whatever is needed to stop the object going through, up to the point where the surface breaks. It is not a fixed formula: you find it from the second law in the direction across the surface.")}
      </p>
      <LessonTable
        headers={[tx(t, "phFor_tCase", "Situation"), tx(t, "phFor_tAcross", "Second law across the surface"), "N"]}
        rows={[
          [tx(t, "phFor_n1", "box resting on a floor"), "N − mg = 0", "mg"],
          [tx(t, "phFor_n2", "you also press down with F"), "N − mg − F = 0", "mg + F"],
          [tx(t, "phFor_n3", "you pull up with F (less than mg)"), "N + F − mg = 0", "mg − F"],
          [tx(t, "phFor_n4", "block on a slope at angle θ"), "N − mg cos θ = 0", "mg cos θ"],
          [tx(t, "phFor_n5", "floor of a lift accelerating up at a"), "N − mg = m a", "m (g + a)"],
        ]}
      />
      <p>
        {tx(t, "phFor_liftBody",
          "The last row is why you feel heavier when a lift starts going up. What you feel as your weight is really the floor pushing on your feet, and a bathroom scale measures exactly that push.")}
      </p>
      <Derivation t={t} label={tx(t, "phFor_eqLift", "The reading of a scale in a lift")}
        steps={[
          { tex: r`\Sigma F_y = N - m g`, why: tx(t, "phFor_l1", "two forces on you, up taken as positive: the scale's push N and your weight") },
          { tex: r`N - m g = m\,a`, why: tx(t, "phFor_l2", "second law; a is the lift's acceleration, positive if upward") },
          { tex: r`\green{N = m\,(g + a)}`, why: tx(t, "phFor_l3", "solve for N: more than mg when a > 0, less when a < 0, zero in free fall (a = −g)") },
        ]} />
      <ElevatorFigure t={t} />

      <H2>{tx(t, "phFor_fricTitle", "Friction")}</H2>
      <p>
        {tx(t, "phFor_fricBody",
          "Friction is the force a surface exerts along itself, opposing sliding. Seen under a microscope, even polished surfaces are mountains and valleys that touch only at their peaks, and those contact points stick together. Friction comes in two kinds, and the difference matters.")}
      </p>
      <p>
        {tx(t, "phFor_staticBody",
          "Static friction acts when the surfaces do not slide. It matches whatever force tries to slide them, exactly, up to a maximum. Push a heavy wardrobe gently: it does not move, because static friction pushes back just as hard. Push harder: friction grows to match. Only when your push exceeds the maximum does the wardrobe start to move.")}
      </p>
      <Equation label={tx(t, "phFor_eqStatic", "Static friction")}
        where={[
          [r`f_s`, tx(t, "phFor_wFs", "the static friction force: whatever is needed to prevent sliding (N)")],
          [r`\mu_s`, tx(t, "phFor_wMus", "the coefficient of static friction, a pure number that depends on the two materials (μ is the Greek letter mu)")],
          [r`N`, tx(t, "phFor_wN", "the normal force pressing the surfaces together (N)")],
        ]}
        note={tx(t, "phFor_staticNote", "Note the ≤ sign: μs N is a ceiling, not the value. A book at rest on a level table feels no friction at all, because nothing tries to slide it.")}>
        {r`f_s \le \mu_s\, N`}
      </Equation>
      <Equation label={tx(t, "phFor_eqKinetic", "Kinetic friction")}
        where={[
          [r`f_k`, tx(t, "phFor_wFk", "the kinetic friction force on a sliding object, opposite to its sliding (N)")],
          [r`\mu_k`, tx(t, "phFor_wMuk", "the coefficient of kinetic friction, usually smaller than μs")],
        ]}
        note={tx(t, "phFor_kineticNote", "To a good approximation f_k does not depend on the sliding speed or on the area in contact. A brick slides the same on its face or on its edge: more area, but less pressure on each part of it.")}>
        {r`f_k = \mu_k\, N`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phFor_tSurfaces", "Surfaces (approximate)"), "μs", "μk"]}
        rows={[
          [tx(t, "phFor_mu1", "rubber tyre on dry concrete"), "1.0", "0.8"],
          [tx(t, "phFor_mu2", "rubber tyre on wet concrete"), "0.7", "0.5"],
          [tx(t, "phFor_mu3", "steel on steel, dry"), "0.74", "0.57"],
          [tx(t, "phFor_mu4", "wood on wood"), "0.5", "0.3"],
          [tx(t, "phFor_mu5", "ice on ice"), "0.1", "0.03"],
          [tx(t, "phFor_mu6", "Teflon on Teflon"), "0.04", "0.04"],
        ]}
      />
      <p>
        {tx(t, "phFor_jumpBody",
          "Because μk < μs, a stuck object that finally breaks free suddenly has more force than it needs, and lurches forward. It is also why ABS brakes help: a rolling tyre grips the road with static friction (the contact patch is momentarily at rest on the road), while a locked, skidding tyre only gets the smaller kinetic friction.")}
      </p>

      <H2>{tx(t, "phFor_slopeTitle", "The inclined plane")}</H2>
      <p>
        {tx(t, "phFor_slopeBody",
          "A block on a slope tilted at angle θ is the classic friction problem. The trick is to tilt the axes too: x along the slope, y across it. Then the normal force and friction each lie on one axis, and only the weight has to be split. The weight makes the same angle θ with the y axis as the slope makes with the ground, so its parts are mg sin θ along the slope (downhill) and mg cos θ into the slope.")}
      </p>
      <Derivation t={t} label={tx(t, "phFor_eqSlope", "When does the block hold?")}
        steps={[
          { tex: r`\Sigma F_y = N - m g\cos\theta = 0 \;\Rightarrow\; N = m g \cos\theta`, why: tx(t, "phFor_s1", "across the slope nothing accelerates") },
          { tex: r`\Sigma F_x = m g \sin\theta - f_s = 0 \;\Rightarrow\; f_s = m g \sin\theta`, why: tx(t, "phFor_s2", "along the slope, at rest: friction must cancel the downhill part of the weight") },
          { tex: r`m g \sin\theta \le \mu_s\, m g \cos\theta`, why: tx(t, "phFor_s3", "it holds only if that friction is within the maximum μs N") },
          { tex: r`\green{\tan\theta \le \mu_s}`, why: tx(t, "phFor_s4", "divide by m g cos θ; the mass cancels") },
        ]} />
      <p>
        {tx(t, "phFor_critBody",
          "So there is a critical angle θc = arctan μs, the same for a pebble and a boulder of the same material. Tilt a book until a coin on it slides, measure the angle, and you have measured μs. Above θc the block slides, and kinetic friction gives it a constant acceleration down the slope.")}
      </p>
      <Equation label={tx(t, "phFor_eqSlide", "Sliding down a slope")}
        where={[
          [r`a`, tx(t, "phFor_wAslide", "the acceleration down the slope (m/s²)")],
          [r`g\sin\theta`, tx(t, "phFor_wGsin", "what gravity alone would give on a frictionless slope")],
          [r`\mu_k\, g\cos\theta`, tx(t, "phFor_wMucos", "what kinetic friction takes away (μk N divided by m)")],
        ]}
        note={tx(t, "phFor_slideNote", "From m a = m g sin θ − μk m g cos θ. With no friction, a = g sin θ: g on a vertical drop, 0 on the flat. Galileo used gentle slopes to slow free fall down enough to time it.")}>
        {r`a = g\,(\sin\theta - \mu_k \cos\theta)`}
      </Equation>
      <InclineFigure t={t} />
      <LiveFormula label={tx(t, "phFor_liveSlope", "Try it: how fast does it slide?")}
        tex={r`a = g\,(\sin\theta - \mu_k \cos\theta)`}
        vars={[
          { id: "deg", label: "θ (°)", min: 0, max: 80, step: 1, value: 30, fmt: v => `${v}°` },
          { id: "mu", label: "μk", min: 0, max: 1, step: 0.02, value: 0.1, fmt: v => num(v, 2) },
        ]}
        compute={slopeNumbers(t)}
        note={tx(t, "phFor_liveSlopeNote", "A skier on a 30° slope with waxed skis (μk ≈ 0.1) accelerates at about 4.1 m/s². Friction and gravity balance when μk = tan θ, here tan 30° = 0.577: at μk = 0.56 the skier still speeds up, slowly; at 0.58 friction wins and a sliding skier slows down and stops.")} />

      <H2>{tx(t, "phFor_tensionTitle", "Tension: ropes and pulleys")}</H2>
      <p>
        {tx(t, "phFor_tensionBody",
          "A rope, string or cable can only pull, and only along its own length. The pull is called the tension T. For an ideal rope (no mass, no stretch) the tension is the same all along it, and an ideal pulley (no mass, no friction) only turns the rope's direction without changing T. This makes ropes a way to carry a force around a corner.")}
      </p>
      <p>
        {tx(t, "phFor_atwoodBody",
          "The Atwood machine is two masses hanging on either side of a pulley, m₂ heavier than m₁. The heavier one goes down, the lighter one up, both with the same size of acceleration because the rope does not stretch. Write the second law for each mass, each with its own positive direction (the way it moves).")}
      </p>
      <Derivation t={t} label={tx(t, "phFor_eqAtwood", "The Atwood machine")}
        steps={[
          { tex: r`m_2 g - T = m_2\, a`, why: tx(t, "phFor_a1", "the heavy mass, positive downward: weight down, tension up") },
          { tex: r`T - m_1 g = m_1\, a`, why: tx(t, "phFor_a2", "the light mass, positive upward: tension up, weight down") },
          { tex: r`(m_2 - m_1)\, g = (m_1 + m_2)\, a`, why: tx(t, "phFor_a3", "add the two equations: T cancels") },
          { tex: r`\green{a = \frac{m_2 - m_1}{m_1 + m_2}\, g}`, why: tx(t, "phFor_a4", "the weight difference drives the total mass") },
          { tex: r`\green{T = \frac{2 m_1 m_2}{m_1 + m_2}\, g}`, why: tx(t, "phFor_a5", "put a back into the second equation, T = m₁(g + a)") },
        ]} />
      <p>
        {tx(t, "phFor_atwoodEx",
          "With 3 kg and 5 kg: a = 2/8 × 9.81 = 2.45 m/s², and T = 2 × 3 × 5/8 × 9.81 = 36.8 N. The tension lies between the two weights (29.4 N and 49.1 N), as it must: it is more than the light mass's weight, so that mass rises, and less than the heavy one's, so that mass falls. Equal masses give a = 0, and two nearly equal masses fall very slowly, which is how George Atwood measured g in 1784.")}
      </p>

      <H2>{tx(t, "phFor_springTitle", "Springs: Hooke's law")}</H2>
      <p>
        {tx(t, "phFor_springBody",
          "Stretch or squeeze a spring and it pushes back, harder the more you deform it. For moderate deformations the force is proportional to the stretch, a rule found by Robert Hooke in 1660. Bathroom scales, car suspensions and the springs in a mattress all work this way.")}
      </p>
      <Equation label={tx(t, "phFor_eqHooke", "Hooke's law")}
        where={[
          [r`F`, tx(t, "phFor_wFspring", "the force the spring exerts (N)")],
          [r`k`, tx(t, "phFor_wK", "the spring constant, its stiffness (N/m): a pen spring about 100 N/m, a car spring about 30 000 N/m")],
          [r`x`, tx(t, "phFor_wX", "the stretch (+) or compression (−) from its natural length (m)")],
        ]}
        note={tx(t, "phFor_hookeNote", "The minus sign says the force always points back towards the natural length: it is a restoring force. Hang a 0.5 kg mass on a 200 N/m spring: it settles where k x = m g, so x = 4.9/200 = 0.025 m, 2.5 cm. Stretched too far, past its elastic limit, a spring deforms for good and the law fails.")}>
        {r`F = -k\,x`}
      </Equation>

      <H3>{tx(t, "phFor_dragTitle", "Air drag and terminal velocity")}</H3>
      <p>
        {tx(t, "phFor_dragBody",
          "An object moving through air has to push the air out of its way, and the air pushes back. For anything bigger and faster than a dust grain, the drag force grows with the square of the speed. A falling object speeds up until the drag equals its weight; from then on the net force is zero and it falls at a constant terminal velocity.")}
      </p>
      <Equation label={tx(t, "phFor_eqDrag", "Air drag and terminal velocity")}
        where={[
          [r`F_D`, tx(t, "phFor_wFd", "the drag force, opposite to the velocity (N)")],
          [r`\rho`, tx(t, "phFor_wRho", "the density of the air, about 1.2 kg/m³ at sea level (ρ is the Greek letter rho)")],
          [r`C_d`, tx(t, "phFor_wCd", "the drag coefficient, set by the shape: about 0.3 for a car, 0.5 for a ball, 1 for a person lying flat")],
          [r`A`, tx(t, "phFor_wArea", "the area the object presents to the flow (m²)")],
          [r`v_t`, tx(t, "phFor_wVt", "the terminal velocity, found by setting F_D = m g")],
        ]}
        note={tx(t, "phFor_dragNote", "An 80 kg skydiver lying flat (C_d ≈ 0.9, A ≈ 0.5 m²) reaches √(2 × 80 × 9.81 / (1.2 × 0.9 × 0.5)) ≈ 54 m/s, about 195 km/h. Opening the parachute multiplies C_d A by more than 100 and brings v_t down to around 5 m/s.")}>
        {r`F_D = \tfrac12\,\rho\, C_d\, A\, v^2 \qquad v_t = \sqrt{\frac{2 m g}{\rho\, C_d\, A}}`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "phFor_fundamental", "Only gravity is a fundamental force here. Normal force, friction, tension, spring force and drag are all the electric forces between atoms, seen in bulk: atoms of two surfaces repel when pressed together, and stick at their contact points. That is why these forces have simple approximate rules, not exact laws.")}
      </Callout>

      <H2>{tx(t, "phFor_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phFor_ex1", "1. A 20 kg crate on a floor with μs = 0.5 and μk = 0.4. N = 20 × 9.81 = 196 N. To start it moving you need more than 0.5 × 196 = 98 N. Push with 100 N: it starts, friction drops to 0.4 × 196 = 78.5 N, and a = (100 − 78.5)/20 = 1.08 m/s². Push with 60 N: nothing moves, and the static friction is exactly 60 N.")}</p>
      <p>{tx(t, "phFor_ex2", "2. A 70 kg person on a scale in a lift that accelerates upward at 2 m/s²: N = 70 × (9.81 + 2) = 827 N, and the scale shows 827 / 9.81 = 84.3 kg. Going down with the same acceleration it shows 70 × 7.81 / 9.81 = 55.7 kg.")}</p>
      <p>{tx(t, "phFor_ex3", "3. A coin on a book starts to slide when the book is tilted to 17°. Then μs = tan 17° = 0.31.")}</p>
      <p>{tx(t, "phFor_ex4", "4. You pull a 10 kg sled on snow (μk = 0.05) with a rope at 30° above the horizontal, with 40 N. The rope lifts as well as pulls: N = mg − 40 sin 30° = 98.1 − 20 = 78.1 N, so friction is 0.05 × 78.1 = 3.9 N. Along the ground: 40 cos 30° − 3.9 = 34.6 − 3.9 = 30.7 N, so a = 3.07 m/s².")}</p>

      <H2>{tx(t, "phFor_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phFor_tWrong", "Wrong"), tx(t, "phFor_tRight", "Right"), tx(t, "phFor_tWhy", "Why")]}
        rows={[
          [tx(t, "phFor_m1w", "N = m g always"), tx(t, "phFor_m1r", "find N from ΣF across the surface"), tx(t, "phFor_m1", "slopes, extra pushes and lifts all change it")],
          [tx(t, "phFor_m2w", "static friction = μs N"), tx(t, "phFor_m2r", "f_s ≤ μs N, only as much as needed"), tx(t, "phFor_m2", "μs N is the maximum")],
          [tx(t, "phFor_m3w", "friction always opposes motion"), tx(t, "phFor_m3r", "it opposes sliding between the surfaces"), tx(t, "phFor_m3", "a car's tyres push the road back, and friction pushes the car forward")],
          [tx(t, "phFor_m4w", "more contact area, more friction"), tx(t, "phFor_m4r", "about the same friction"), tx(t, "phFor_m4", "the force spreads over more area, at less pressure")],
          [tx(t, "phFor_m5w", "the tension equals the hanging weight"), tx(t, "phFor_m5r", "only if the mass does not accelerate"), tx(t, "phFor_m5", "in the Atwood machine T lies between the two weights")],
        ]}
      />

      <KeyIdeas t={t} id="phFor" items={[
        "Weight W = m g points down; g ≈ 9.81 m/s² near the Earth's surface.",
        "The normal force is perpendicular to the surface and takes whatever value the second law requires across it: m g cos θ on a slope, m (g + a) in a lift.",
        "Static friction matches the applied force up to μs N; kinetic friction is μk N, usually smaller.",
        "On a slope, tilt the axes: a block holds while tan θ ≤ μs and slides with a = g (sin θ − μk cos θ).",
        "An ideal rope has the same tension everywhere; in the Atwood machine a = (m₂ − m₁) g / (m₁ + m₂).",
        "Springs pull back with F = −k x; air drag grows as v² and sets a terminal velocity.",
      ]} />
    </Article>
  );
}
