"use client";

// Dynamics 4: work, energy and power — work of a constant force at an angle
// (positive, zero, negative), work as area under F(x); kinetic energy and the
// work–energy theorem derived from kinematics; gravitational and spring
// potential energy (path independence, reference level); conservation of
// mechanical energy; friction turns energy into heat; power P = W/t = F v and
// efficiency.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { EnergyTrackFigure } from "@/components/lesson/figures/physics/EnergyTrackFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Speed on a frictionless track, from the drop below the release height. */
const coasterNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const drop = v.h - v.y;
  if (drop < 0) return { tex: r`h - y = ${num(drop, 0)}\ \text{m} < 0 \;\Rightarrow\; \red{\text{${tx(t, "phWork_liveNever", "it can never get this high")}}}` };
  const sp = Math.sqrt(2 * 9.81 * drop);
  return {
    tex: r`v = \sqrt{2 \times 9.81 \times (${num(v.h, 0)} - ${num(v.y, 0)})} = \amber{${num(sp)}\ \text{m/s}} = ${num(sp * 3.6, 0)}\ \text{km/h}`,
    meter: Math.min(1, sp / 35), meterLabel: `${num(sp * 3.6, 0)} km/h`,
  };
};

export function WorkEnergyContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phWork_intro",
          "Newton's laws can answer every question about motion, but sometimes only with a lot of work: to find how fast a roller coaster goes at the bottom of a twisting drop, you would need the forces at every point along the track. Energy gives the answer in one line. This chapter builds the idea from the second law, step by step: first work, then kinetic and potential energy, then the law that the total never changes. Energy turns out to be one of the most important ideas in all of physics.")}
      </Lead>

      <Goals t={t} id="phWork" items={[
        "Compute the work of a constant force, with the right sign, and read work as an area.",
        "Derive the work–energy theorem from the equations of motion.",
        "Use conservation of mechanical energy to find speeds and heights without knowing the forces.",
        "Account for friction as heat, and compute power and efficiency.",
      ]} />

      <H2>{tx(t, "phWork_workTitle", "Work")}</H2>
      <p>
        {tx(t, "phWork_workBody",
          "In physics, a force does work on an object when the object moves while the force acts on it. Only the part of the force along the motion counts. Pull a suitcase by a slanted handle: the forward part of your pull moves it along, the upward part only lightens it. Work is measured in joules (J): one joule is one newton acting over one metre, 1 J = 1 N·m.")}
      </p>
      <Equation label={tx(t, "phWork_eqWork", "Work of a constant force")}
        where={[
          [r`W`, tx(t, "phWork_wW", "the work done by the force (J)")],
          [r`F`, tx(t, "phWork_wF", "the size of the force (N)")],
          [r`d`, tx(t, "phWork_wD", "the size of the displacement while the force acts (m)")],
          [r`\theta`, tx(t, "phWork_wTheta", "the angle between the force and the displacement")],
          [r`\vec F \cdot \vec d`, tx(t, "phWork_wDot", "the same thing written as a dot product (see the Math track's vectors chapter)")],
        ]}>
        {r`W = F\, d\, \cos\theta = \vec F \cdot \vec d`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phWork_tAngle", "Angle"), tx(t, "phWork_tSign", "Work"), tx(t, "phWork_tExample", "Example")]}
        rows={[
          ["0°", tx(t, "phWork_s1", "positive, F d"), tx(t, "phWork_s1e", "pushing a cart forward; gravity on a falling stone")],
          ["90°", tx(t, "phWork_s2", "zero"), tx(t, "phWork_s2e", "the normal force on a sliding box; the string of a whirled stone")],
          ["180°", tx(t, "phWork_s3", "negative, −F d"), tx(t, "phWork_s3e", "kinetic friction on a sliding box; gravity on a rising ball")],
        ]}
      />
      <p>
        {tx(t, "phWork_zeroBody",
          "Physics work is not effort. Holding a heavy bag still for an hour does no work on it (it does not move), although your muscles tire because their fibres keep twitching. Carrying it across a level room at constant speed does no work on it either: your upward force is perpendicular to the motion.")}
      </p>
      <p>
        {tx(t, "phWork_areaBody",
          "When the force changes along the way, as for a spring, cut the path into short pieces over which the force is nearly constant and add up F Δx. On a graph of F against x, each piece is a thin strip, so the work is the area under the curve, the same idea as displacement being the area under v(t). In calculus that sum is the integral W = ∫ F dx.")}
      </p>

      <H2>{tx(t, "phWork_keTitle", "Kinetic energy and the work–energy theorem")}</H2>
      <p>
        {tx(t, "phWork_keBody",
          "What does work do? Take an object of mass m pushed by a constant net force F over a distance d, along its motion. It accelerates at a = F/m, and the kinematics equation without time links its speeds at the start and end.")}
      </p>
      <Derivation t={t} label={tx(t, "phWork_eqTheorem", "From Newton to energy")}
        steps={[
          { tex: r`v^2 = v_0^2 + 2\,a\,d`, why: tx(t, "phWork_k1", "constant acceleration, from the straight-line motion chapter") },
          { tex: r`\tfrac12 m v^2 = \tfrac12 m v_0^2 + m\,a\,d`, why: tx(t, "phWork_k2", "multiply every term by m/2") },
          { tex: r`\tfrac12 m v^2 - \tfrac12 m v_0^2 = F_{\text{net}}\, d`, why: tx(t, "phWork_k3", "m a is the net force (second law); move the first term to the left") },
          { tex: r`\green{\Delta K = W_{\text{net}}}`, why: tx(t, "phWork_k4", "name ½ m v² the kinetic energy K; the right side is the net work") },
        ]} />
      <Equation label={tx(t, "phWork_eqKE", "Kinetic energy")}
        where={[
          [r`K`, tx(t, "phWork_wK", "the kinetic energy, the energy of motion (J)")],
          [r`m`, tx(t, "phWork_wM", "the mass (kg)")],
          [r`v`, tx(t, "phWork_wV", "the speed (m/s); the direction does not matter, K is never negative")],
        ]}
        words={tx(t, "phWork_keWords", "The net work done on an object equals the change in its kinetic energy.")}
        note={tx(t, "phWork_keNote", "A 1 200 kg car at 50 km/h (13.9 m/s) has K = ½ × 1 200 × 13.9² = 116 kJ; at 100 km/h, four times as much, 463 kJ. The brakes must remove all of it, which is why the braking distance grows with the square of the speed.")}>
        {r`K = \tfrac12\, m\, v^2`}
      </Equation>

      <H2>{tx(t, "phWork_peTitle", "Potential energy")}</H2>
      <p>
        {tx(t, "phWork_peBody",
          "Lift a ball of mass m by a height h at constant speed. You do work m g h on it, and gravity does −m g h. The ball has gained no kinetic energy, but the work is not lost: let go, and gravity gives back exactly m g h of kinetic energy by the time the ball returns. The energy is stored in the position of the ball, as gravitational potential energy.")}
      </p>
      <Equation label={tx(t, "phWork_eqPE", "Gravitational potential energy")}
        where={[
          [r`U`, tx(t, "phWork_wU", "the potential energy (J)")],
          [r`h`, tx(t, "phWork_wH", "the height above a reference level you choose (m)")],
          [r`W_{\text{grav}}`, tx(t, "phWork_wWg", "the work done by gravity when the height changes; going up, it is negative")],
        ]}
        note={tx(t, "phWork_peNote", "Only changes in U matter, so the zero level is yours to pick: the floor, the table, the bottom of the hill. The work of gravity depends only on the start and end heights, not on the path between them; a force with that property is called conservative.")}>
        {r`U = m\,g\,h \qquad W_{\text{grav}} = -\Delta U`}
      </Equation>
      <p>
        {tx(t, "phWork_springPeBody",
          "A spring stores energy too. Stretching it from 0 to x means pulling with a force that grows from 0 to k x, so the work is the area of a triangle under the F(x) line.")}
      </p>
      <Derivation t={t} label={tx(t, "phWork_eqSpring", "Elastic potential energy")}
        steps={[
          { tex: r`W = \text{area under } F = kx \text{ from } 0 \text{ to } x`, why: tx(t, "phWork_e1", "the force changes, so work is an area") },
          { tex: r`= \tfrac12 \cdot x \cdot k x`, why: tx(t, "phWork_e2", "a triangle: half of base x times height k x") },
          { tex: r`\green{U_{\text{spring}} = \tfrac12\, k\, x^2}`, why: tx(t, "phWork_e3", "the same for stretching or squeezing by x") },
        ]} />

      <H2>{tx(t, "phWork_consTitle", "Conservation of mechanical energy")}</H2>
      <p>
        {tx(t, "phWork_consBody",
          "Put the two ideas together. If gravity (or a spring) is the only force doing work, the work–energy theorem says W = ΔK, and potential energy says W = −ΔU. So ΔK = −ΔU: whatever kinetic energy is gained is potential energy lost, and the sum, called the mechanical energy, stays the same. Forces that do no work, like the normal force of a smooth track, do not spoil this.")}
      </p>
      <Equation label={tx(t, "phWork_eqCons", "Conservation of mechanical energy")}
        where={[
          [r`K_i, U_i`, tx(t, "phWork_wKi", "kinetic and potential energy at the start")],
          [r`K_f, U_f`, tx(t, "phWork_wKf", "the same at the end")],
        ]}
        words={tx(t, "phWork_consWords", "Kinetic plus potential energy is the same at every moment, when only gravity and springs do work.")}>
        {r`K_i + U_i = K_f + U_f \qquad \tfrac12 m v_i^2 + m g h_i = \tfrac12 m v_f^2 + m g h_f`}
      </Equation>
      <p>
        {tx(t, "phWork_dropBody",
          "Released from rest at height h, an object reaches the bottom with ½ m v² = m g h, so v = √(2 g h). The mass cancels, and so does the shape of the path: a straight slide, a twisting chute or a free drop all give the same speed at the same depth (only the time differs). That is the power of energy: no forces, no angles, no time needed.")}
      </p>
      <EnergyTrackFigure t={t} />
      <LiveFormula label={tx(t, "phWork_liveCoaster", "Try it: speed on a roller coaster")}
        tex={r`v = \sqrt{2 g\,(h - y)}`}
        vars={[
          { id: "h", label: "h (m)", min: 5, max: 100, step: 1, value: 60, fmt: v => `${num(v, 0)} m` },
          { id: "y", label: "y (m)", min: 0, max: 100, step: 1, value: 5, fmt: v => `${num(v, 0)} m` },
        ]}
        compute={coasterNumbers(t)}
        note={tx(t, "phWork_liveCoasterNote", "A train starting from rest at the top of a 60 m hill passes a point 5 m above the ground at about 33 m/s, 118 km/h, whatever the track does in between. Set y above h: no path can get it there without an engine. Real trains reach a little less because of friction and air.")} />

      <H3>{tx(t, "phWork_fricTitle", "Friction: where the energy goes")}</H3>
      <p>
        {tx(t, "phWork_fricBody",
          "Kinetic friction always does negative work, −f_k d on a sliding object, and that work is not stored: you cannot get it back by sliding the other way. It becomes thermal energy, the random jiggling of atoms, which is why brakes and rubbed hands get warm. Mechanical energy decreases, but the total energy, heat included, is still exactly conserved. Conservation of energy is one of the most thoroughly tested laws in physics; no exception has ever been found.")}
      </p>
      <Equation label={tx(t, "phWork_eqFric", "Energy with friction")}
        where={[
          [r`f_k\, d`, tx(t, "phWork_wFd", "the energy turned into heat by kinetic friction over the sliding distance d (J)")],
        ]}>
        {r`K_i + U_i = K_f + U_f + f_k\, d`}
      </Equation>

      <H2>{tx(t, "phWork_powerTitle", "Power and efficiency")}</H2>
      <p>
        {tx(t, "phWork_powerBody",
          "Two people carry the same box up the same stairs; one runs, one walks. They do the same work, but the runner does it faster. The rate of doing work is the power, measured in watts (W): 1 W = 1 J/s. A horsepower is 746 W.")}
      </p>
      <Equation label={tx(t, "phWork_eqPower", "Power")}
        where={[
          [r`P`, tx(t, "phWork_wP", "the power (W)")],
          [r`W`, tx(t, "phWork_wWork", "the work done (J) in the time Δt (s)")],
          [r`F\,v`, tx(t, "phWork_wFv", "force times speed, for a force along the motion: work F Δx per time Δt")],
        ]}
        note={tx(t, "phWork_powerNote", "A car cruising at 30 m/s against 600 N of air and road resistance needs P = 600 × 30 = 18 kW at the wheels. Because air drag grows as v², the power grows as v³: going 20 % faster costs about 70 % more power.")}>
        {r`P = \frac{W}{\Delta t} = F\, v`}
      </Equation>
      <p>
        {tx(t, "phWork_effBody",
          "No machine turns all the energy it receives into useful work; the rest ends up as heat. The fraction that is useful is the efficiency, η (the Greek letter eta) = useful energy out ÷ energy in. Rough values: a petrol engine 25–35 %, the human body about 25 %, a large electric motor over 90 %. A kilowatt-hour, the unit on electricity bills, is an amount of energy: 1 000 W for 3 600 s, 3.6 million joules.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phWork_food", "A food Calorie (capital C) is 4 184 J. A 250 Calorie chocolate bar holds about a million joules. At 25 % efficiency, climbing stairs turns that into m g h = 260 000 J of lifting: for a 70 kg person, a climb of about 380 m, the height of a 100-storey building.")}
      </Callout>

      <H2>{tx(t, "phWork_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phWork_ex1", "1. You pull a sled 10 m with a rope at 30° above the ground and a 50 N pull. W = 50 × 10 × cos 30° = 433 J. Only the 43 N forward part of the pull does work.")}</p>
      <p>{tx(t, "phWork_ex2", "2. A stone dropped from 20 m: v = √(2 × 9.81 × 20) = 19.8 m/s at the bottom, the same answer the kinematics chapter found from the equations of motion, in one line.")}</p>
      <p>{tx(t, "phWork_ex3", "3. A toy launcher with k = 500 N/m, squeezed 10 cm, fires a 50 g ball straight up. Stored energy: ½ × 500 × 0.1² = 2.5 J. Launch speed: ½ × 0.05 × v² = 2.5 gives v = 10 m/s. Maximum height: 0.05 × 9.81 × h = 2.5 gives h = 5.1 m.")}</p>
      <p>{tx(t, "phWork_ex4", "4. A 2 kg block slides from rest down a 5 m ramp at 30° with μk = 0.2. It drops 2.5 m, releasing 2 × 9.81 × 2.5 = 49.1 J. Friction takes μk m g cos 30° × 5 = 17.0 J as heat. That leaves K = 32.1 J, so v = √(2 × 32.1 / 2) = 5.7 m/s, the same as from a = g (sin θ − μk cos θ) in the forces chapter.")}</p>
      <p>{tx(t, "phWork_ex5", "5. A 70 kg person runs up 3 m of stairs in 4 s. The work against gravity is 70 × 9.81 × 3 = 2 060 J, so the power is 2 060 / 4 = 515 W, about 0.7 horsepower.")}</p>

      <H2>{tx(t, "phWork_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phWork_tWrong", "Wrong"), tx(t, "phWork_tRight", "Right"), tx(t, "phWork_tWhy", "Why")]}
        rows={[
          [tx(t, "phWork_m1w", "work = force × distance, always"), tx(t, "phWork_m1r", "W = F d cos θ"), tx(t, "phWork_m1", "only the part of the force along the motion counts")],
          [tx(t, "phWork_m2w", "holding a heavy weight is work"), tx(t, "phWork_m2r", "no displacement, no work"), tx(t, "phWork_m2", "tiredness is not physical work on the object")],
          [tx(t, "phWork_m3w", "twice the speed, twice the kinetic energy"), tx(t, "phWork_m3r", "four times"), tx(t, "phWork_m3", "K grows with v²")],
          [tx(t, "phWork_m4w", "potential energy has an absolute value"), tx(t, "phWork_m4r", "only differences matter"), tx(t, "phWork_m4", "the zero level is a free choice")],
          [tx(t, "phWork_m5w", "friction destroys energy"), tx(t, "phWork_m5r", "it turns mechanical energy into heat"), tx(t, "phWork_m5", "total energy is always conserved")],
          [tx(t, "phWork_m6w", "kWh is a unit of power"), tx(t, "phWork_m6r", "it is energy: 3.6 MJ"), tx(t, "phWork_m6", "power × time = energy")],
        ]}
      />

      <KeyIdeas t={t} id="phWork" items={[
        "Work W = F d cos θ: positive along the motion, zero across it, negative against it; for a varying force, the area under F(x).",
        "Kinetic energy K = ½ m v²; the net work equals the change in kinetic energy.",
        "Potential energy stores work: m g h for gravity, ½ k x² for a spring; only its changes matter.",
        "With only gravity and springs doing work, K + U stays constant: v = √(2 g h) for any frictionless path.",
        "Friction turns mechanical energy into heat; total energy is always conserved.",
        "Power P = W/Δt = F v, in watts; efficiency is useful energy out over energy in.",
      ]} />
    </Article>
  );
}
