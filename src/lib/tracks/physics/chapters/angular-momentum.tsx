"use client";

// Conservation & Rotation 3: angular momentum — L = I ω for a rigid body and
// L = r⊥ p for a moving particle; the right-hand rule; τ = ΔL/Δt;
// conservation when no outside torque acts (skater, diver, cat, pulsar);
// energy is not conserved when the arms come in; rotational collisions;
// Kepler's second law as conservation of L; gyroscopes and precession;
// the Earth–Moon system.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SpinFigure } from "@/components/lesson/figures/physics/SpinFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** A skater pulls in: new spin rate and how much the kinetic energy grows. */
const skaterNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const f2 = (v.I1 * v.f1) / v.I2;
  return {
    tex: r`f_2 = \frac{I_1}{I_2}\, f_1 = \frac{${num(v.I1, 1)}}{${num(v.I2, 1)}} \times ${num(v.f1, 1)} = \amber{${num(f2, 2)}\ \text{${tx(t, "phAng_liveTps", "turns/s")}}} \qquad \frac{K_2}{K_1} = \frac{I_1}{I_2} = ${num(v.I1 / v.I2, 2)}`,
    meter: Math.min(1, f2 / 6), meterLabel: `${num(f2, 2)} ${tx(t, "phAng_liveTps", "turns/s")} · ${tx(t, "phAng_liveScale", "scale 0–6")}`,
  };
};

export function AngularMomentumContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phAng_intro",
          "A figure skater starts a spin with arms wide, pulls them in, and suddenly whirls several times faster. Nobody pushed her. A falling cat turns over and lands on its feet without touching anything. A dying star collapses and ends up spinning hundreds of times a second. All three are the same law at work: the conservation of angular momentum, the rotating twin of the conservation of momentum.")}
      </Lead>

      <Goals t={t} id="phAng" items={[
        "Compute the angular momentum of a spinning body and of a particle moving past a point.",
        "Use τ = ΔL/Δt, and explain why L is conserved when no outside torque acts.",
        "Solve spin-up problems and rotational collisions, and track what happens to the kinetic energy.",
        "Explain Kepler's second law and the precession of a gyroscope with angular momentum.",
      ]} />

      <H2>{tx(t, "phAng_LTitle", "Angular momentum")}</H2>
      <p>
        {tx(t, "phAng_LBody",
          "Momentum is mass times velocity. Its rotating twin is the moment of inertia times the angular velocity: the angular momentum L. A heavy flywheel spinning fast has a lot of it, and is hard to stop or to tilt.")}
      </p>
      <Equation label={tx(t, "phAng_eqL", "Angular momentum of a rigid body")}
        where={[
          [r`L`, tx(t, "phAng_wL", "the angular momentum (kg·m²/s)")],
          [r`I`, tx(t, "phAng_wI", "the moment of inertia about the axis (kg·m²)")],
          [r`\omega`, tx(t, "phAng_wW", "the angular velocity (rad/s)")],
        ]}>
        {r`L = I\, \omega`}
      </Equation>
      <p>
        {tx(t, "phAng_particleBody",
          "A single particle does not have to go in a circle to have angular momentum about a point. A ball flying past a door's hinge carries angular momentum about it: its momentum times the perpendicular distance from the hinge to its line of flight, exactly as torque was force times the lever arm. For a particle on a circle of radius r, the line of flight is always perpendicular to the radius and L = m v r; with v = ω r that is m r² ω, the I ω of one piece.")}
      </p>
      <Equation label={tx(t, "phAng_eqLp", "Angular momentum of a particle about a point")}
        where={[
          [r`r`, tx(t, "phAng_wR", "the distance from the point to the particle (m)")],
          [r`p`, tx(t, "phAng_wP", "the particle's momentum, m v (kg·m/s)")],
          [r`\theta`, tx(t, "phAng_wTh", "the angle between the line from the point and the velocity")],
          [r`r_\perp`, tx(t, "phAng_wRp", "the perpendicular distance from the point to the line of motion")],
        ]}
        note={tx(t, "phAng_vecNote", "Angular momentum is a vector, along the axis. Its direction comes from the right-hand rule: curl the fingers of your right hand the way the body turns, and your thumb points along L. A wheel spinning anticlockwise as you look at it has L pointing towards you. (In vector notation, L = r × p, a cross product.)")}>
        {r`L = r\, p \sin\theta = r_\perp\, m\, v`}
      </Equation>

      <H2>{tx(t, "phAng_tauTitle", "Torque changes angular momentum")}</H2>
      <p>
        {tx(t, "phAng_tauBody",
          "Newton's second law said F = Δp/Δt. The rotating version follows from Σ τ = I α: for a body with fixed I, I α = I Δω/Δt = Δ(I ω)/Δt. This form, torque is the rate of change of angular momentum, turns out to be more general: it still holds when I changes, which is exactly the skater's case.")}
      </p>
      <Equation label={tx(t, "phAng_eqTau", "Torque and angular momentum")}
        where={[
          [r`\sum \tau_{\text{ext}}`, tx(t, "phAng_wTau", "the sum of the torques from outside the system (N·m)")],
          [r`\Delta L / \Delta t`, tx(t, "phAng_wDL", "the rate of change of the total angular momentum")],
        ]}
        words={tx(t, "phAng_tauWords", "An outside torque, acting for a time, changes the angular momentum by torque × time.")}>
        {r`\sum \tau_{\text{ext}} = \frac{\Delta L}{\Delta t}`}
      </Equation>

      <H2>{tx(t, "phAng_consTitle", "Conservation of angular momentum")}</H2>
      <p>
        {tx(t, "phAng_consBody",
          "Inside forces cannot change the total angular momentum, for the same reason they cannot change the total momentum. Two pieces of a body push on each other with equal and opposite forces, and those forces act along the line joining the pieces. Equal forces, opposite directions, same line: same lever arm about any axis, opposite torques. They cancel in pairs. So if no outside torque acts, ΔL = 0.")}
      </p>
      <Equation label={tx(t, "phAng_eqCons", "Conservation of angular momentum")}
        where={[
          [r`I_1, \omega_1`, tx(t, "phAng_wBefore", "moment of inertia and angular velocity before")],
          [r`I_2, \omega_2`, tx(t, "phAng_wAfter", "the same after the body changes shape")],
        ]}
        words={tx(t, "phAng_consWords", "With no outside torque, a body that makes itself more compact spins faster, and one that spreads out spins slower.")}>
        {r`I_1\, \omega_1 = I_2\, \omega_2`}
      </Equation>
      <SpinFigure t={t} />
      <LiveFormula label={tx(t, "phAng_liveSkater", "Try it: a skater pulls her arms in")}
        tex={r`f_2 = \frac{I_1}{I_2}\, f_1`}
        vars={[
          { id: "I1", label: "I₁ (kg·m²)", min: 1, max: 6, step: 0.1, value: 3.5, fmt: v => `${num(v, 1)}` },
          { id: "f1", label: "f₁ (turns/s)", min: 0.2, max: 2, step: 0.1, value: 1, fmt: v => `${num(v, 1)}` },
          { id: "I2", label: "I₂ (kg·m²)", min: 0.6, max: 6, step: 0.1, value: 1, fmt: v => `${num(v, 1)}` },
        ]}
        compute={skaterNumbers(t)}
        note={tx(t, "phAng_liveSkaterNote", "A skater with arms and one leg out has I about 3.5 kg·m²; tucked tight, about 1 kg·m². Starting at one turn per second, she ends at 3.5. Since f is proportional to ω, the same ratio works with turns per second as with radians per second.")} />
      <p>
        {tx(t, "phAng_energyBody",
          "Angular momentum is conserved, but kinetic energy is not. Write K = ½ I ω² as L²/(2I): with L fixed, a smaller I means a larger K. The skater's energy grows by the same factor as her spin rate. It comes from her muscles: the arms tend to fly outwards as she spins, and she must pull them in against that, doing work. Let them out again and the energy goes back, as the arms do work on her body slowing it down.")}
      </p>

      <H3>{tx(t, "phAng_whereTitle", "Where you see it")}</H3>
      <LessonTable
        headers={[tx(t, "phAng_tCase", "Case"), tx(t, "phAng_tWhat", "What happens")]}
        rows={[
          [tx(t, "phAng_e1", "a diver or gymnast"), tx(t, "phAng_e1w", "leaves the board with some L; tucking into a ball cuts I by about 3.5 times and gives the somersaults; opening out stops the spin before entry")],
          [tx(t, "phAng_e2", "a falling cat"), tx(t, "phAng_e2w", "starts with L = 0 and keeps it: it twists the front half one way with legs tucked (small I) and the back half the other way with legs out (large I), then swaps, and ends up turned over")],
          [tx(t, "phAng_e3", "a helicopter"), tx(t, "phAng_e3w", "the engine spins the rotor one way, so the body would spin the other way; the small tail rotor pushes sideways to cancel that torque")],
          [tx(t, "phAng_e4", "a collapsing star"), tx(t, "phAng_e4w", "a core the size of the Earth shrinks to 20 km across; its spin speeds up by the square of the shrink factor, and it becomes a pulsar turning up to hundreds of times a second")],
          [tx(t, "phAng_e5", "water down a drain, a hurricane"), tx(t, "phAng_e5w", "slowly turning water speeds up as it moves inwards")],
        ]}
      />

      <H3>{tx(t, "phAng_colTitle", "Rotational collisions")}</H3>
      <p>
        {tx(t, "phAng_colBody",
          "A child running along the edge of a playground roundabout jumps on. During the jump the roundabout's axle exerts no torque about the axle itself, so the total angular momentum of child + roundabout is conserved, even though the axle pushes sideways. It is a rotating perfectly inelastic collision: angular momentum survives, some kinetic energy does not.")}
      </p>
      <Derivation t={t} label={tx(t, "phAng_eqJump", "A child jumps onto a spinning roundabout")}
        steps={[
          { tex: r`L_{\text{before}} = I_0\, \omega_0 + m\, v\, R`, why: tx(t, "phAng_j1", "the roundabout's I ω, plus the child's m v r⊥ (running tangent to the rim)") },
          { tex: r`L_{\text{after}} = (I_0 + m R^2)\, \omega`, why: tx(t, "phAng_j2", "afterwards the child, a point mass at radius R, turns with it") },
          { tex: r`\green{\omega = \frac{I_0\, \omega_0 + m v R}{I_0 + m R^2}}`, why: tx(t, "phAng_j3", "set them equal") },
        ]} />
      <p>
        {tx(t, "phAng_colNum",
          "A roundabout with I₀ = 400 kg·m² turns at 1 rad/s. A 30 kg child standing still (v = 0) steps on at its 2 m rim: ω = 400 / (400 + 30 × 4) = 0.77 rad/s. Kinetic energy before: 200 J; after: ½ × 520 × 0.77² = 154 J. The rest went into the child's legs and shoes as they were dragged up to speed.")}
      </p>

      <H2>{tx(t, "phAng_keplerTitle", "Planets and equal areas")}</H2>
      <p>
        {tx(t, "phAng_keplerBody",
          "A planet is pulled by the Sun's gravity, a force that always points straight at the Sun. Its line of action passes through the Sun, so about the Sun its lever arm is zero, and so is its torque. The planet's angular momentum about the Sun is therefore conserved, all round its orbit. Kepler found the consequence in 1609, decades before Newton, by poring over the orbit of Mars: the line from the Sun to a planet sweeps out equal areas in equal times.")}
      </p>
      <Derivation t={t} label={tx(t, "phAng_eqArea", "Equal areas from constant L")}
        steps={[
          { tex: r`\Delta A \approx \tfrac12\, r\, (v_\perp\, \Delta t)`, why: tx(t, "phAng_a1", "in a short time the planet sweeps a thin triangle: base r, height the sideways distance v⊥ Δt it covers") },
          { tex: r`\frac{\Delta A}{\Delta t} = \tfrac12\, r\, v_\perp = \frac{L}{2m}`, why: tx(t, "phAng_a2", "r v⊥ is r⊥ v, so m r v⊥ is the angular momentum L") },
          { tex: r`\green{\frac{\Delta A}{\Delta t} = \text{constant}}`, why: tx(t, "phAng_a3", "L and m do not change, so neither does the rate of sweeping area") },
        ]} />
      <p>
        {tx(t, "phAng_keplerBody2",
          "So a planet moves fastest at its closest point to the Sun and slowest at its farthest: r v is the same at both. The Earth is about 3 % closer to the Sun in early January than in early July, and moves about 3 % faster then; that is why the northern winter is a few days shorter than the northern summer. The next chapter puts this inside Newton's full theory of gravity.")}
      </p>

      <H2>{tx(t, "phAng_gyroTitle", "Gyroscopes and precession")}</H2>
      <p>
        {tx(t, "phAng_gyroBody",
          "Because L is a vector, a torque can change its direction without changing its size. Hold a spinning bicycle wheel by one end of its axle and let go of the other end. You expect it to fall. Instead the axle stays nearly level and slowly swings round sideways in a horizontal circle. That swinging is precession.")}
      </p>
      <p>
        {tx(t, "phAng_gyroWhy",
          "Here is why. Gravity pulls the wheel down at its centre, a distance d from your hand, giving a torque. The torque points sideways, horizontal and perpendicular to the axle (by the right-hand rule). Torque is the rate of change of L, so in each moment L gets a small sideways nudge: the axle turns sideways rather than tipping down. The faster the wheel spins, the bigger L is, and the slower it precesses.")}
      </p>
      <Equation label={tx(t, "phAng_eqPrec", "Precession rate of a gyroscope")}
        where={[
          [r`\Omega`, tx(t, "phAng_wOm", "the angular speed of the precession (rad/s), the capital Greek letter omega")],
          [r`m g d`, tx(t, "phAng_wMgd", "the torque of gravity about the support: weight times the distance to the centre of mass (N·m)")],
          [r`I \omega`, tx(t, "phAng_wIw", "the spin angular momentum L")],
        ]}
        note={tx(t, "phAng_precNote", "A 2 kg bicycle wheel of radius 30 cm (a hoop, I = 0.18 kg·m²) spinning at 10 turns per second has L = 0.18 × 62.8 = 11.3 kg·m²/s. Held 20 cm from its centre, the torque is 2 × 9.81 × 0.2 = 3.9 N·m, so Ω = 0.35 rad/s: one full swing round in 18 s.")}>
        {r`\Omega = \frac{\tau}{L} = \frac{m\, g\, d}{I\, \omega}`}
      </Equation>
      <p>
        {tx(t, "phAng_stableBody",
          "With no torque at all, the direction of L stays fixed in space. That is what keeps a thrown rugby ball or an American football pointing along its flight when it spirals, keeps a rifle bullet nose-first (the barrel's grooves set it spinning), and lets a gyroscope inside a ship or a phone sense which way it is turning. The Earth is a gyroscope too: the pull of the Sun and the Moon on its equatorial bulge makes its axis precess once every 26 000 years, so in 12 000 years the bright star Vega, not Polaris, will be the pole star.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phAng_moon", "The Moon raises tides on the Earth, and the friction of the tides slows the Earth's spin: the day gets about 2 milliseconds longer every century. The angular momentum the Earth loses is not destroyed. It goes into the Moon's orbit, which is why the Moon moves about 3.8 cm farther away each year, a distance measured by bouncing lasers off mirrors left on the Moon by the Apollo astronauts.")}
      </Callout>

      <H2>{tx(t, "phAng_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phAng_ex1", "1. A 70 kg runner at 5 m/s passes 2 m from a lamp post. About the post, L = r⊥ m v = 2 × 70 × 5 = 700 kg·m²/s. If she grabs the post with an outstretched arm, she swings round it with that angular momentum.")}</p>
      <p>{tx(t, "phAng_ex2", "2. A diver leaves the board turning at 0.8 turns per second with I = 14 kg·m² (stretched). Tucked, I = 4 kg·m², so she turns at 0.8 × 14 / 4 = 2.8 turns per second.")}</p>
      <p>{tx(t, "phAng_ex3", "3. The Sun, 700 000 km in radius, turns once in about 25 days. Shrink it to 10 km with no loss of angular momentum: I falls by (700 000 / 10)² = 4.9 × 10⁹, and the period by the same factor, to 0.44 ms, about 2 000 turns a second. Real collapsing stars shed much of their angular momentum, and the fastest pulsars known turn about 700 times a second.")}</p>
      <p>{tx(t, "phAng_ex4", "4. A comet passes the Sun at 0.5 AU (astronomical units, the Earth–Sun distance) moving at 60 km/s. At 5 AU, the far end of its orbit, its speed is 60 × 0.5 / 5 = 6 km/s, since r v is the same at both ends, where the velocity is perpendicular to the radius.")}</p>
      <p>{tx(t, "phAng_ex5", "5. A disc of I = 0.2 kg·m² spinning at 30 rad/s is dropped onto an identical disc at rest on the same axle, and they stick. ω = 0.2 × 30 / 0.4 = 15 rad/s. Kinetic energy falls from 90 J to 45 J: half is lost, as for equal masses sticking in a straight line.")}</p>

      <H2>{tx(t, "phAng_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phAng_tWrong", "Wrong"), tx(t, "phAng_tRight", "Right"), tx(t, "phAng_tWhy", "Why")]}
        rows={[
          [tx(t, "phAng_m1w", "a skater's kinetic energy is conserved too"), tx(t, "phAng_m1r", "it increases as she pulls in"), tx(t, "phAng_m1", "K = L²/(2I), and her arms do work")],
          [tx(t, "phAng_m2w", "only spinning things have angular momentum"), tx(t, "phAng_m2r", "anything moving past a point does"), tx(t, "phAng_m2", "L = r⊥ m v about that point")],
          [tx(t, "phAng_m3w", "an axle's force spoils conservation"), tx(t, "phAng_m3r", "not about the axle"), tx(t, "phAng_m3", "a force through the axis has zero torque about it")],
          [tx(t, "phAng_m4w", "a gyroscope defies gravity"), tx(t, "phAng_m4r", "gravity's torque turns L sideways"), tx(t, "phAng_m4", "τ changes the direction of L, so it precesses instead of falling")],
          [tx(t, "phAng_m5w", "planets keep a constant speed"), tx(t, "phAng_m5r", "they keep a constant r v⊥"), tx(t, "phAng_m5", "they are fastest closest to the Sun")],
        ]}
      />

      <KeyIdeas t={t} id="phAng" items={[
        "Angular momentum L = I ω for a rigid body, and L = r⊥ m v for a particle about a point; it is a vector given by the right-hand rule.",
        "Outside torques change it: Σ τ_ext = ΔL/Δt. Inside forces cancel in pairs and cannot.",
        "With no outside torque, I₁ ω₁ = I₂ ω₂: pulling mass in speeds the spin up.",
        "Kinetic energy L²/(2I) is not conserved when I changes: it grows when the mass is pulled in.",
        "Gravity points at the Sun, so a planet's L is constant: it sweeps equal areas in equal times (Kepler's second law).",
        "A torque across L turns it sideways: a gyroscope precesses at Ω = τ / L instead of falling.",
      ]} />
    </Article>
  );
}
