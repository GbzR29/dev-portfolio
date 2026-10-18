"use client";

// Oscillations & Waves 1: simple harmonic motion — equilibrium and restoring
// force, a = −ω² x from Hooke's law, the solution x = A cos(ωt + φ) checked by
// differentiation, period independent of amplitude, the link with uniform
// circular motion, velocity and acceleration through the cycle, energy
// ½kA², the vertical spring, the simple pendulum (small angles, big swings),
// the physical pendulum, and why every stable equilibrium oscillates this way.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ShmFigure } from "@/components/lesson/figures/physics/ShmFigure";
import { BigSwingFigure } from "@/components/lesson/figures/physics/BigSwingFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

const springNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const T = 2 * Math.PI * Math.sqrt(v.m / v.k);
  return {
    tex: r`T = 2\pi \sqrt{\frac{${num(v.m, 2)}}{${num(v.k, 0)}}} = 2\pi \times ${num(Math.sqrt(v.m / v.k), 3)} = \amber{${num(T, 3)}\ \text{s}}`,
    meter: Math.min(1, T / 4), meterLabel: `f = 1/T = ${num(1 / T, 2)} ${tx(t, "phShm_liveHz", "swings per second")}`,
  };
};

const pendulumNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const T = 2 * Math.PI * Math.sqrt(v.L / v.g);
  return {
    tex: r`T = 2\pi \sqrt{\frac{${num(v.L, 2)}}{${num(v.g, 2)}}} = \amber{${num(T, 2)}\ \text{s}}`,
    meter: Math.min(1, T / 10), meterLabel: `${num(60 / T, 1)} ${tx(t, "phShm_livePerMin", "swings per minute")}`,
  };
};

export function SimpleHarmonicContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phShm_intro",
          "A child on a swing, a guitar string, a car bouncing on its springs, the quartz crystal in a watch and the atoms in every solid all do the same thing: they move back and forth around a resting place, over and over, in equal times. This chapter finds the one law behind all of them, a restoring force that grows with the distance from equilibrium, and shows that it always produces the same motion: a sine wave in time, with a period that does not depend on how big the swing is.")}
      </Lead>

      <Goals t={t} id="phShm" items={[
        "Explain what a restoring force is and why it makes a body overshoot and oscillate.",
        "Show that x = A cos(ωt + φ) solves a = −ω² x, and use T = 2π√(m/k).",
        "Track position, velocity, acceleration and energy through one cycle.",
        "Derive the period of a pendulum for small swings, and say when the formula fails.",
      ]} />

      <H2>{tx(t, "phShm_whyTitle", "What makes something oscillate")}</H2>
      <p>
        {tx(t, "phShm_whyBody",
          "Every oscillation starts from an equilibrium: a position where the forces balance, like a ball resting at the bottom of a bowl. Push the ball up one side and a force appears that pulls it back towards the bottom. That is a restoring force: it always points towards equilibrium.")}
      </p>
      <p>
        {tx(t, "phShm_whyBody2",
          "The restoring force alone would only bring the ball back. What makes it oscillate is inertia. By the time the ball reaches the bottom it is moving fast, the force there is zero, and nothing stops it: it rolls up the other side. Now the force points back the other way, slows it down, stops it and sends it back. Force and inertia take turns, and the motion repeats.")}
      </p>

      <H2>{tx(t, "phShm_eqTitle", "The equation of simple harmonic motion")}</H2>
      <p>
        {tx(t, "phShm_eqBody",
          "Take a block of mass m on a frictionless floor, tied to a wall by a spring. Measure its position x from the point where the spring is relaxed. Hooke's law (from the forces chapter) says the spring pulls with F = −k x: twice the stretch, twice the force, and the minus sign means the force points back towards x = 0. Newton's second law, F = m a, then gives the acceleration.")}
      </p>
      <Equation label={tx(t, "phShm_eqShm", "Simple harmonic motion")}
        where={[
          [r`a`, tx(t, "phShm_wA", "the acceleration of the block (m/s²)")],
          [r`x`, tx(t, "phShm_wX", "the displacement from equilibrium (m)")],
          [r`k`, tx(t, "phShm_wK", "the spring constant, its stiffness (N/m)")],
          [r`m`, tx(t, "phShm_wM", "the mass (kg)")],
          [r`\omega`, tx(t, "phShm_wW", "the angular frequency, defined by ω² = k/m (rad/s)")],
        ]}
        words={tx(t, "phShm_eqWords", "The acceleration always points back towards equilibrium and is proportional to the distance from it.")}
        note={tx(t, "phShm_eqNote", "Any motion whose acceleration is a fixed negative number times the displacement is called simple harmonic motion (SHM). The spring is only the first example; the pendulum, a floating log bobbing in water and an atom in a crystal all obey the same equation with their own ω.")}>
        {r`a = -\frac{k}{m}\, x = -\omega^2 x`}
      </Equation>

      <H3>{tx(t, "phShm_solTitle", "The solution: a cosine in time")}</H3>
      <p>
        {tx(t, "phShm_solBody",
          "We need a function x(t) whose second derivative is −ω² times itself. The cosine has exactly that property: differentiate cos twice and you get −cos back. (Derivatives are explained in the Math track: v = dx/dt is the rate of change of position, a = dv/dt the rate of change of velocity.) So try x = A cos(ωt + φ) and check.")}
      </p>
      <Derivation t={t} label={tx(t, "phShm_eqCheck", "Checking that a cosine works")}
        steps={[
          { tex: r`x(t) = A \cos(\omega t + \varphi)`, why: tx(t, "phShm_c1", "the guess: a cosine of amplitude A, angular frequency ω and phase φ") },
          { tex: r`v(t) = \frac{dx}{dt} = -A\,\omega \sin(\omega t + \varphi)`, why: tx(t, "phShm_c2", "the derivative of cos u is −sin u, times the derivative of u = ωt + φ, which is ω") },
          { tex: r`a(t) = \frac{dv}{dt} = -A\,\omega^2 \cos(\omega t + \varphi)`, why: tx(t, "phShm_c3", "the derivative of −sin u is −cos u, again times ω") },
          { tex: r`\green{a = -\omega^2\, x}`, why: tx(t, "phShm_c4", "the last line is −ω² times the first: the guess works for any A and φ, as long as ω² = k/m") },
        ]} />
      <LessonTable
        headers={[tx(t, "phShm_tQty", "Quantity"), tx(t, "phShm_tSym", "Symbol"), tx(t, "phShm_tMeans", "What it means"), tx(t, "phShm_tUnit", "Unit")]}
        rows={[
          [tx(t, "phShm_q1", "amplitude"), "A", tx(t, "phShm_q1m", "the largest displacement; set by how far you pull it"), "m"],
          [tx(t, "phShm_q2", "angular frequency"), "ω = √(k/m)", tx(t, "phShm_q2m", "how fast the angle ωt + φ advances; set by the system"), "rad/s"],
          [tx(t, "phShm_q3", "period"), "T = 2π/ω", tx(t, "phShm_q3m", "the time for one full cycle, there and back"), "s"],
          [tx(t, "phShm_q4", "frequency"), "f = 1/T = ω/2π", tx(t, "phShm_q4m", "cycles per second"), tx(t, "phShm_q4u", "Hz (hertz)")],
          [tx(t, "phShm_q5", "phase constant"), "φ", tx(t, "phShm_q5m", "where in the cycle it is at t = 0; φ = 0 means released from x = A"), "rad"],
        ]}
      />
      <Equation label={tx(t, "phShm_eqPeriod", "Period of a mass on a spring")}
        where={[
          [r`T`, tx(t, "phShm_wT", "the period, the time for one full cycle (s)")],
          [r`m`, tx(t, "phShm_wM2", "the mass on the spring (kg)")],
          [r`k`, tx(t, "phShm_wK2", "the spring constant (N/m)")],
        ]}
        words={tx(t, "phShm_periodWords", "A heavier mass swings more slowly, a stiffer spring faster, and the size of the swing does not matter.")}
        note={tx(t, "phShm_periodNote", "The amplitude A does not appear. A big swing travels farther, but the force is proportionally bigger too, so it moves proportionally faster and takes exactly the same time. This property, isochronism, is what makes oscillators good clocks.")}>
        {r`T = \frac{2\pi}{\omega} = 2\pi \sqrt{\frac{m}{k}}`}
      </Equation>
      <ShmFigure t={t} />
      <LiveFormula label={tx(t, "phShm_liveSpring", "Try it: the period of a mass on a spring")}
        tex={r`T = 2\pi \sqrt{\frac{m}{k}}`}
        vars={[
          { id: "m", label: "m (kg)", min: 0.05, max: 10, step: 0.05, value: 0.5, fmt: v => `${num(v, 2)} kg` },
          { id: "k", label: "k (N/m)", min: 5, max: 1000, step: 5, value: 200, fmt: v => `${num(v, 0)} N/m` },
        ]}
        compute={springNumbers(t)}
        note={tx(t, "phShm_liveSpringNote", "A 0.5 kg mass on a 200 N/m spring: ω = √400 = 20 rad/s, T = 0.31 s, about three swings a second. Four times the mass doubles the period; four times the stiffness halves it.")} />

      <H3>{tx(t, "phShm_circleTitle", "The shadow of a circle")}</H3>
      <p>
        {tx(t, "phShm_circleBody",
          "Why does the angle ωt appear in a motion along a straight line? Picture a point going round a circle of radius A at the steady angular speed ω, as in the circular motion chapter. Its x coordinate is A cos ωt. Its acceleration points to the centre with size ω² A, and the x part of that is −ω² x. So the shadow of uniform circular motion on a diameter is exactly simple harmonic motion. That is why ω is called an angular frequency even when nothing turns: it is the angular speed of the imagined point whose shadow the oscillator follows. In the figure above, the amber point is that imagined point.")}
      </p>

      <H3>{tx(t, "phShm_cycleTitle", "Velocity and acceleration through one cycle")}</H3>
      <p>
        {tx(t, "phShm_cycleBody",
          "Velocity and acceleration take turns being large. At the ends of the swing the block stops for an instant, but the spring is stretched most, so the acceleration is largest. At the centre the spring is relaxed and the acceleration is zero, but the block is moving fastest.")}
      </p>
      <LessonTable
        headers={[tx(t, "phShm_tWhere", "Where"), tx(t, "phShm_tX", "Position x"), tx(t, "phShm_tV", "Velocity v"), tx(t, "phShm_tAcc", "Acceleration a")]}
        rows={[
          [tx(t, "phShm_p1", "right end"), "+A", "0", "−ω² A " + tx(t, "phShm_p1a", "(largest, to the left)")],
          [tx(t, "phShm_p2", "centre, moving left"), "0", "−ω A " + tx(t, "phShm_p2a", "(fastest)"), "0"],
          [tx(t, "phShm_p3", "left end"), "−A", "0", "+ω² A " + tx(t, "phShm_p3a", "(largest, to the right)")],
          [tx(t, "phShm_p4", "centre, moving right"), "0", "+ω A " + tx(t, "phShm_p2a", "(fastest)"), "0"],
        ]}
      />

      <H2>{tx(t, "phShm_energyTitle", "Energy in simple harmonic motion")}</H2>
      <p>
        {tx(t, "phShm_energyBody",
          "With no friction, the total energy stays the same. It sloshes between the kinetic energy of the block, ½ m v², and the elastic energy stored in the spring, ½ k x² (the work done stretching it, from the work and energy chapter).")}
      </p>
      <Derivation t={t} label={tx(t, "phShm_eqEnergy", "The energy of an oscillator")}
        steps={[
          { tex: r`E = \tfrac12 m v^2 + \tfrac12 k x^2`, why: tx(t, "phShm_e1", "kinetic plus spring energy at any moment") },
          { tex: r`= \tfrac12 m A^2 \omega^2 \sin^2(\cdot) + \tfrac12 k A^2 \cos^2(\cdot)`, why: tx(t, "phShm_e2", "put in x and v from the solution; (·) stands for ωt + φ") },
          { tex: r`= \tfrac12 k A^2 \left(\sin^2(\cdot) + \cos^2(\cdot)\right)`, why: tx(t, "phShm_e3", "m ω² = k, so both terms carry ½ k A²") },
          { tex: r`\green{E = \tfrac12 k A^2}`, why: tx(t, "phShm_e4", "sin² + cos² = 1 at every moment: the total is constant, and grows with the square of the amplitude") },
        ]} />
      <p>
        {tx(t, "phShm_energyBody2",
          "Setting ½ m v² + ½ k x² = ½ k A² and solving for v gives the speed at any position: v = ω √(A² − x²). At the centre that is ω A, the top speed. A 0.5 kg block on a 200 N/m spring pulled out 5 cm stores ½ × 200 × 0.05² = 0.25 J, and passes through the centre at 20 × 0.05 = 1 m/s.")}
      </p>

      <H3>{tx(t, "phShm_vertTitle", "A spring hanging vertically")}</H3>
      <p>
        {tx(t, "phShm_vertBody",
          "Hang the block from the spring instead. Gravity stretches the spring by Δ = m g / k before anything moves: that is the new equilibrium. Measured from there, gravity and the extra stretch cancel exactly, and the restoring force is again −k x. So a vertical spring oscillates with the same period as a horizontal one; gravity only moves the centre of the motion. There is a neat consequence: since k/m = g/Δ, the period is T = 2π√(Δ/g). A car whose body sinks 10 cm when you load it bounces with T = 2π√(0.1/9.81) = 0.63 s, whatever it weighs.")}
      </p>

      <H2>{tx(t, "phShm_pendTitle", "The simple pendulum")}</H2>
      <p>
        {tx(t, "phShm_pendBody",
          "A simple pendulum is a small heavy bob on a light string of length L. Pulled aside by an angle θ, the bob moves along an arc, and its distance along that arc from the bottom is s = L θ. Two forces act: the tension, which points along the string and cannot speed the bob along the arc, and gravity m g. The part of gravity along the arc is m g sin θ, pointing back down. That is the restoring force.")}
      </p>
      <Derivation t={t} label={tx(t, "phShm_eqPend", "The pendulum for small swings")}
        steps={[
          { tex: r`m\, \frac{d^2 s}{dt^2} = -m g \sin\theta`, why: tx(t, "phShm_d1", "second law along the arc; only gravity's component along it counts") },
          { tex: r`L\, \frac{d^2 \theta}{dt^2} = -g \sin\theta`, why: tx(t, "phShm_d2", "s = L θ with L fixed, and the mass cancels") },
          { tex: r`\frac{d^2 \theta}{dt^2} \approx -\frac{g}{L}\, \theta`, why: tx(t, "phShm_d3", "for small angles in radians, sin θ ≈ θ (see the table below)") },
          { tex: r`\green{\omega = \sqrt{\frac{g}{L}}, \qquad T = 2\pi \sqrt{\frac{L}{g}}}`, why: tx(t, "phShm_d4", "this is the SHM equation with ω² = g/L") },
        ]} />
      <LessonTable
        headers={[tx(t, "phShm_tAngle", "Angle"), tx(t, "phShm_tRad", "θ in radians"), "sin θ", tx(t, "phShm_tErr", "Error of sin θ ≈ θ")]}
        rows={[
          ["5°", "0.0873", "0.0872", "0.13%"],
          ["10°", "0.1745", "0.1736", "0.51%"],
          ["20°", "0.3491", "0.3420", "2.1%"],
          ["45°", "0.7854", "0.7071", "11%"],
          ["90°", "1.5708", "1.0000", "57%"],
        ]}
      />
      <p>
        {tx(t, "phShm_pendBody2",
          "The period depends only on the length and on g: not on the mass, and, for small swings, not on the amplitude. Galileo is said to have noticed this in 1583 by timing a swaying lamp in Pisa cathedral against his pulse. A pendulum with T = 2 s, one tick each way per second, needs L = g T²/(4π²) = 0.994 m: the \"seconds pendulum\" of grandfather clocks. The same pendulum on the Moon (g = 1.62 m/s²) would take 4.9 s.")}
      </p>
      <LiveFormula label={tx(t, "phShm_livePend", "Try it: the period of a pendulum")}
        tex={r`T = 2\pi \sqrt{\frac{L}{g}}`}
        vars={[
          { id: "L", label: "L (m)", min: 0.1, max: 5, step: 0.01, value: 0.99, fmt: v => `${num(v, 2)} m` },
          { id: "g", label: "g (m/s²)", min: 1.6, max: 24.8, step: 0.01, value: 9.81, fmt: v => `${num(v, 2)} m/s²` },
        ]}
        compute={pendulumNumbers(t)}
        note={tx(t, "phShm_livePendNote", "Try g = 1.62 (the Moon), 3.71 (Mars) and 24.8 (Jupiter's cloud tops). A clock made for Earth runs slow on the Moon. Since T grows with √L, a pendulum four times longer takes twice as long.")} />

      <H3>{tx(t, "phShm_bigTitle", "Big swings")}</H3>
      <p>
        {tx(t, "phShm_bigBody",
          "The approximation sin θ ≈ θ overstates the restoring force, since sin θ is always a little less than θ. So a real pendulum swinging wide is pulled back more weakly than the formula assumes and takes longer. For moderate amplitudes θ₀ (in radians) a good correction is T ≈ T₀ (1 + θ₀²/16): 20° gives 0.8% longer, 60° about 7%. Clocks keep their swings small and constant for that reason.")}
      </p>
      <BigSwingFigure t={t} />

      <H3>{tx(t, "phShm_physTitle", "The physical pendulum")}</H3>
      <p>
        {tx(t, "phShm_physBody",
          "A real swinging object, like a leg, a rod or a swinging door sign, is not a point on a string. If it hangs from a pivot at a distance d above its centre of mass, gravity's torque is −m g d sin θ and the rotation law τ = I α (rotation chapter) gives the same SHM equation with ω² = m g d / I. So T = 2π√(I/(m g d)). A 1 m rod swinging from one end has I = ⅓ m L² and d = L/2, so T = 2π√(2L/3g) = 1.64 s, quicker than a 1 m simple pendulum (2.01 s) because part of its mass sits close to the pivot.")}
      </p>

      <H2>{tx(t, "phShm_everyTitle", "Why simple harmonic motion is everywhere")}</H2>
      <p>
        {tx(t, "phShm_everyBody",
          "Plot the potential energy U(x) of almost anything near a stable equilibrium and you find the bottom of a valley. Zoom in close enough and the bottom of any smooth valley looks like a parabola, U ≈ ½ k (x − x₀)², where k is the curvature of the valley at its lowest point (the second derivative of U; the Taylor series in the Math track says why). A parabola-shaped energy is exactly a spring. So every system nudged slightly from a stable equilibrium oscillates harmonically: atoms in a molecule, a ship rolling in waves, the quartz crystal in a watch (which vibrates 32 768 = 2¹⁵ times a second, so 15 halvings give one tick per second), and, in later chapters, the electric charge in a circuit and the electromagnetic field itself.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phShm_limit", "Simple harmonic motion is the small-amplitude limit. When the swing grows, the valley stops looking like a parabola, the period starts to depend on the amplitude, and new behaviour appears, as with the big pendulum swings above. The next chapter adds the two things every real oscillator also has: friction that drains the energy, and outside pushes that pump it back in.")}
      </Callout>

      <H2>{tx(t, "phShm_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phShm_ex1", "1. A 0.5 kg block on a 200 N/m spring is pulled 5 cm and released. ω = √(200/0.5) = 20 rad/s, T = 2π/20 = 0.314 s, f = 3.18 Hz. Top speed ω A = 1 m/s at the centre; largest acceleration ω² A = 20 m/s², about 2 g, at the ends.")}</p>
      <p>{tx(t, "phShm_ex2", "2. Same block, where is it 0.1 s after release? x = 0.05 cos(20 × 0.1) = 0.05 cos(2 rad) = −0.021 m: it has passed the centre and is 2.1 cm on the other side.")}</p>
      <p>{tx(t, "phShm_ex3", "3. A mass bounces on a spring with T = 0.8 s. What mass quadruples the period? T grows as √m, so 16 times the mass. To double the period you need four times the mass.")}</p>
      <p>{tx(t, "phShm_ex4", "4. A pendulum takes 3.0 s per cycle. L = g T²/(4π²) = 9.81 × 9/39.5 = 2.24 m.")}</p>
      <p>{tx(t, "phShm_ex5", "5. A spring sags 4.9 cm when a mass is hung on it. Without knowing m or k: T = 2π√(0.049/9.81) = 0.44 s.")}</p>

      <H2>{tx(t, "phShm_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phShm_tWrong", "Wrong"), tx(t, "phShm_tRight", "Right"), tx(t, "phShm_tWhy", "Why")]}
        rows={[
          [tx(t, "phShm_m1w", "a bigger swing takes longer"), tx(t, "phShm_m1r", "the period ignores A (small swings)"), tx(t, "phShm_m1", "the force grows with x, so the speed grows in step")],
          [tx(t, "phShm_m2w", "a heavier bob swings slower"), tx(t, "phShm_m2r", "T = 2π√(L/g), no mass"), tx(t, "phShm_m2", "weight and inertia both grow with m and cancel")],
          [tx(t, "phShm_m3w", "acceleration is zero at the ends"), tx(t, "phShm_m3r", "velocity is zero there; acceleration is largest"), tx(t, "phShm_m3", "the spring is stretched most at the ends")],
          [tx(t, "phShm_m4w", "ω is the frequency"), tx(t, "phShm_m4r", "f = ω / 2π"), tx(t, "phShm_m4", "ω is in rad/s; one cycle is 2π radians")],
          [tx(t, "phShm_m5w", "sin θ ≈ θ with θ in degrees"), tx(t, "phShm_m5r", "radians only"), tx(t, "phShm_m5", "sin 10° ≈ 0.17, not 10")],
          [tx(t, "phShm_m6w", "gravity changes a vertical spring's period"), tx(t, "phShm_m6r", "only the centre moves"), tx(t, "phShm_m6", "measured from the new equilibrium, the force is still −k x")],
        ]}
      />

      <KeyIdeas t={t} id="phShm" items={[
        "An oscillation needs an equilibrium, a restoring force pointing back to it, and inertia that carries the body past it.",
        "Simple harmonic motion: a = −ω² x. Its solution is x = A cos(ωt + φ), the shadow of uniform circular motion.",
        "For a mass on a spring ω = √(k/m) and T = 2π√(m/k); the period does not depend on the amplitude.",
        "Speed is largest at the centre (ω A), acceleration largest at the ends (ω² A); the energy ½ k A² stays constant.",
        "A pendulum has T = 2π√(L/g) for small swings, independent of mass; wide swings take longer.",
        "Near any stable equilibrium the potential energy looks like a parabola, so small oscillations are always harmonic.",
      ]} />
    </Article>
  );
}
