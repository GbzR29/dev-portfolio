"use client";

// Conservation & Rotation 4: gravity and orbits — Newton's law of universal
// gravitation and the inverse square; G and the Cavendish experiment;
// g = G M / R² and weighing the Earth; circular orbits v = √(GM/r);
// Kepler's third law derived, geostationary orbit, weighing the Sun;
// Kepler's three laws; potential energy −G M m / r from the area under F(r);
// escape speed; orbital energy and the orbit paradox; weightlessness.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { OrbitFigure } from "@/components/lesson/figures/physics/OrbitFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

const GM_E = 3.986e14, R_E = 6371;                    // m³/s², km

/** A circular orbit at height h above the Earth: speed and period. */
const orbitNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const rr = (R_E + v.h) * 1000;
  const sp = Math.sqrt(GM_E / rr), T = (2 * Math.PI * rr) / sp;
  const hours = T / 3600;
  const per = hours < 2 ? `${num(T / 60, 0)}\ \text{min}` : `${num(hours, 1)}\ \text{h}`;
  return {
    tex: r`v = \sqrt{\frac{3.986 \times 10^{14}}{${num(rr / 1e6, 3)} \times 10^{6}}} = \amber{${num(sp / 1000, 2)}\ \text{km/s}} \qquad T = \frac{2\pi r}{v} = \amber{${per}}`,
    meter: Math.min(1, hours / 24), meterLabel: `${tx(t, "phGrav_livePeriod", "period")} ${num(hours, 2)} h · ${tx(t, "phGrav_liveScale", "scale 0–24 h")}`,
  };
};

export function GravityOrbitsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phGrav_intro",
          "The circular motion chapter ended with Newton's test: the Moon's acceleration towards the Earth is 3 600 times smaller than an apple's, and the Moon is 60 times farther from the Earth's centre. 60² = 3 600. The same force that drops the apple holds the Moon, weakened by the square of the distance. This chapter turns that insight into the law of universal gravitation and uses it, with the conservation laws of the last three chapters, to explain orbits, weigh the Earth and the Sun, and find the speed needed to leave the Earth for good.")}
      </Lead>

      <Goals t={t} id="phGrav" items={[
        "Use Newton's law of gravitation, and find g and the mass of a planet from it.",
        "Derive the speed and period of a circular orbit and Kepler's third law.",
        "Explain why gravitational potential energy is −G M m / r, and derive the escape speed.",
        "Describe Kepler's three laws and what an orbit is: falling while missing the ground.",
      ]} />

      <H2>{tx(t, "phGrav_lawTitle", "Universal gravitation")}</H2>
      <p>
        {tx(t, "phGrav_lawBody",
          "Every pair of masses in the universe attracts each other. The force is along the line between them, proportional to each mass, and inversely proportional to the square of the distance between their centres. Newton published it in 1687, and it was the first law of physics that claimed to hold everywhere, on the Earth and in the heavens alike.")}
      </p>
      <Equation label={tx(t, "phGrav_eqLaw", "Newton's law of gravitation")}
        where={[
          [r`F`, tx(t, "phGrav_wF", "the size of the attraction on each of the two masses (N); equal and opposite, by the third law")],
          [r`G`, tx(t, "phGrav_wG", "the gravitational constant, 6.674 × 10⁻¹¹ N·m²/kg²")],
          [r`m_1, m_2`, tx(t, "phGrav_wM", "the two masses (kg)")],
          [r`r`, tx(t, "phGrav_wR", "the distance between their centres (m)")],
        ]}
        note={tx(t, "phGrav_lawNote", "G is tiny. Two 70 kg people 1 m apart attract each other with 6.674 × 10⁻¹¹ × 70 × 70 / 1² = 3.3 × 10⁻⁷ N, the weight of a speck of dust. Gravity only becomes noticeable when one of the masses is the size of a moon or a planet.")}>
        {r`F = \frac{G\, m_1\, m_2}{r^2}`}
      </Equation>
      <p>
        {tx(t, "phGrav_whyBody",
          "Why the square? Picture the influence of a mass spreading out evenly in all directions. At a distance r it is shared over a sphere of area 4π r². Twice as far, the sphere has four times the area, so each square metre gets a quarter as much. Light and sound from a point source fade the same way. Newton also proved a property that makes the law easy to use: a uniform ball, or a ball made of uniform shells like the Earth, attracts everything outside it as if all its mass were at its centre.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phGrav_cavendish", "In 1798 Henry Cavendish measured G in a shed in London. He hung a rod with two small lead balls from a thin wire, brought two large lead balls close to them, and measured how much the gravitational pull twisted the wire, by a fraction of a degree. Knowing G, he could work out the mass of the Earth from g, which is why the experiment became known as weighing the world.")}
      </Callout>

      <H3>{tx(t, "phGrav_gTitle", "Where g comes from")}</H3>
      <p>
        {tx(t, "phGrav_gBody",
          "An object of mass m at the Earth's surface is r = R from the centre, and its weight m g is the gravitational pull of the Earth. Set them equal and m cancels: every object falls with the same acceleration, as Galileo found, because the pull is proportional to the very mass that resists it.")}
      </p>
      <Derivation t={t} label={tx(t, "phGrav_eqG", "The acceleration of gravity")}
        steps={[
          { tex: r`m\, g = \frac{G\, M\, m}{R^2}`, why: tx(t, "phGrav_g1", "the weight is the gravitational force at the surface") },
          { tex: r`\green{g = \frac{G M}{R^2}}`, why: tx(t, "phGrav_g2", "m cancels") },
          { tex: r`M = \frac{g R^2}{G} = \frac{9.81 \times (6.371 \times 10^6)^2}{6.674 \times 10^{-11}} = 5.97 \times 10^{24}\ \text{kg}`, why: tx(t, "phGrav_g3", "turned round, it weighs the Earth") },
        ]} />
      <LessonTable
        headers={[tx(t, "phGrav_tBody", "Body"), tx(t, "phGrav_tG", "g at the surface"), tx(t, "phGrav_tW", "a 70 kg person weighs")]}
        rows={[
          [tx(t, "phGrav_b1", "the Moon"), "1.62 m/s²", "113 N"],
          [tx(t, "phGrav_b2", "Mars"), "3.71 m/s²", "260 N"],
          [tx(t, "phGrav_b3", "the Earth"), "9.81 m/s²", "687 N"],
          [tx(t, "phGrav_b4", "Jupiter (cloud tops)"), "24.8 m/s²", "1 740 N"],
          [tx(t, "phGrav_b5", "the Sun (surface)"), "274 m/s²", "19 200 N"],
        ]}
      />
      <p>
        {tx(t, "phGrav_heightBody",
          "Away from the surface, g falls with the square of the distance from the centre: g(r) = g × (R/r)². At the height of the International Space Station, 400 km up, r = 6 771 km and g is still 9.81 × (6 371 / 6 771)² = 8.7 m/s², 89 % of its value on the ground. The astronauts float not because gravity is missing but because they are falling, as the next sections show.")}
      </p>

      <H2>{tx(t, "phGrav_orbitTitle", "Orbits: falling round the Earth")}</H2>
      <p>
        {tx(t, "phGrav_orbitBody",
          "Newton explained orbits with a thought experiment. Put a cannon on a very tall mountain and fire a ball sideways. It falls to the ground some distance away. Fire it faster and it lands farther. The Earth is round, so the ground curves away under the ball as it falls. At just the right speed, the ground curves away exactly as fast as the ball falls, and it never lands: it is in orbit. An orbit is free fall that keeps missing the ground.")}
      </p>
      <Derivation t={t} label={tx(t, "phGrav_eqCirc", "The speed of a circular orbit")}
        steps={[
          { tex: r`\frac{G M m}{r^2} = \frac{m\, v^2}{r}`, why: tx(t, "phGrav_c1", "gravity is the centripetal force: it supplies m v²/r towards the centre") },
          { tex: r`\green{v = \sqrt{\frac{G M}{r}}}`, why: tx(t, "phGrav_c2", "m cancels: any satellite at that radius moves at that speed, a spanner as well as a space station") },
        ]} />
      <OrbitFigure t={t} />
      <LiveFormula label={tx(t, "phGrav_liveOrbit", "Try it: a circular orbit at height h above the Earth")}
        tex={r`v = \sqrt{\frac{G M}{R + h}} \qquad T = \frac{2\pi (R + h)}{v}`}
        vars={[
          { id: "h", label: "h (km)", min: 200, max: 40000, step: 10, value: 400, fmt: v => `${num(v, 0)} km` },
        ]}
        compute={orbitNumbers(t)}
        note={tx(t, "phGrav_liveOrbitNote", "At 400 km, the Space Station's height, v = 7.67 km/s, about 27 600 km/h, and one lap takes 92 minutes: the crew sees 16 sunrises a day. Slide h up to 35 790 km: the period becomes one day, and the satellite keeps pace with the turning Earth.")} />

      <H3>{tx(t, "phGrav_keplerTitle", "Kepler's third law")}</H3>
      <p>
        {tx(t, "phGrav_keplerBody",
          "The period is the time for one lap of the circle, T = 2π r / v. Put in the orbital speed and something remarkable falls out: the square of the period is proportional to the cube of the radius, for every body orbiting the same central mass.")}
      </p>
      <Derivation t={t} label={tx(t, "phGrav_eqKepler3", "Period and radius")}
        steps={[
          { tex: r`T = \frac{2\pi r}{v} = 2\pi r \sqrt{\frac{r}{G M}}`, why: tx(t, "phGrav_k1", "one circumference at the orbital speed") },
          { tex: r`T^2 = \frac{4\pi^2 r^2 \cdot r}{G M}`, why: tx(t, "phGrav_k2", "square both sides") },
          { tex: r`\green{T^2 = \frac{4 \pi^2}{G M}\, r^3}`, why: tx(t, "phGrav_k3", "the constant depends only on the central mass M") },
        ]} />
      <LessonTable
        headers={[tx(t, "phGrav_tPlanet", "Planet"), tx(t, "phGrav_tA", "Distance a (AU)"), tx(t, "phGrav_tT", "Period T (years)"), "T² / a³"]}
        rows={[
          [tx(t, "phGrav_p1", "Mercury"), "0.387", "0.241", "1.00"],
          [tx(t, "phGrav_p2", "Earth"), "1.000", "1.000", "1.00"],
          [tx(t, "phGrav_p3", "Mars"), "1.524", "1.881", "1.00"],
          [tx(t, "phGrav_p4", "Jupiter"), "5.203", "11.86", "1.00"],
          [tx(t, "phGrav_p5", "Neptune"), "30.07", "164.8", "1.00"],
        ]}
      />
      <p>
        {tx(t, "phGrav_keplerUse",
          "Measured in years and astronomical units (1 AU is the Earth–Sun distance, 1.496 × 10⁸ km), T² / a³ is 1 for every planet. Kepler found this pattern in 1619 from the numbers alone; Newton's law explains it. Turned round, it weighs whatever sits at the centre: with the Earth's orbit, r = 1.496 × 10¹¹ m and T = 3.156 × 10⁷ s, M = 4π² r³ / (G T²) = 1.99 × 10³⁰ kg for the Sun. The same trick, applied to stars orbiting the centre of our galaxy, revealed a black hole of 4 million solar masses there.")}
      </p>
      <p>
        {tx(t, "phGrav_geoBody",
          "A geostationary satellite orbits once per sidereal day (23 h 56 min, one turn of the Earth relative to the stars), above the equator, so it hangs over one spot and a dish on the ground can point at it without moving. Kepler's third law gives r = (G M T² / 4π²)^(1/3) = 42 160 km from the centre, 35 790 km above the ground.")}
      </p>

      <H3>{tx(t, "phGrav_laws3Title", "Kepler's three laws")}</H3>
      <LessonTable
        headers={[tx(t, "phGrav_tLaw", "Law"), tx(t, "phGrav_tSays", "What it says"), tx(t, "phGrav_tFrom", "Where it comes from")]}
        rows={[
          [tx(t, "phGrav_l1", "1. ellipses"), tx(t, "phGrav_l1s", "every planet moves on an ellipse with the Sun at one focus"), tx(t, "phGrav_l1f", "the inverse-square law: other force laws give orbits that do not close")],
          [tx(t, "phGrav_l2", "2. equal areas"), tx(t, "phGrav_l2s", "the line Sun–planet sweeps equal areas in equal times"), tx(t, "phGrav_l2f", "conservation of angular momentum: gravity points at the Sun, so it has no torque about it")],
          [tx(t, "phGrav_l3", "3. periods"), tx(t, "phGrav_l3s", "T² is proportional to a³, a being half the long axis of the ellipse"), tx(t, "phGrav_l3f", "the inverse-square law, derived above for circles")],
        ]}
      />
      <p>
        {tx(t, "phGrav_ellipseBody",
          "An ellipse is a stretched circle: the set of points whose distances to two fixed points, the foci, add up to the same value. Its shape is measured by the eccentricity e, 0 for a circle and close to 1 for a long thin ellipse. The Earth's orbit has e = 0.017, nearly a circle; Halley's comet has e = 0.97 and swings from inside Venus's orbit out beyond Neptune's.")}
      </p>

      <H2>{tx(t, "phGrav_energyTitle", "Gravitational potential energy")}</H2>
      <p>
        {tx(t, "phGrav_energyBody",
          "U = m g h assumed g constant, which is fine for a ladder but wrong for a rocket. Far from the Earth the force weakens, so lifting gets easier. The work needed to move a mass m from a distance r all the way out to infinity is the area under the force curve F(r) = G M m / r² from r to infinity. That area is finite, because the curve falls off quickly, and it equals G M m / r (it is the integral ∫ G M m / r² dr, see the Math track's integrals chapter). It is natural to put the zero of potential energy at infinity, where the masses no longer feel each other.")}
      </p>
      <Derivation t={t} label={tx(t, "phGrav_eqU", "Potential energy far from the surface")}
        steps={[
          { tex: r`W_{r \to \infty} = \int_r^{\infty} \frac{G M m}{r'^2}\, dr' = \frac{G M m}{r}`, why: tx(t, "phGrav_u1", "the work you must do against gravity to pull m free: the area under F(r)") },
          { tex: r`U(\infty) - U(r) = \frac{G M m}{r}`, why: tx(t, "phGrav_u2", "that work is stored as potential energy") },
          { tex: r`\green{U(r) = -\frac{G M m}{r}}`, why: tx(t, "phGrav_u3", "with U(∞) = 0: negative everywhere, rising towards zero far away") },
          { tex: r`U(R + h) - U(R) \approx \frac{G M m}{R^2}\, h = m\, g\, h`, why: tx(t, "phGrav_u4", "for h much smaller than R the new formula gives back the old one") },
        ]} />
      <p>
        {tx(t, "phGrav_negBody",
          "A negative energy can look strange, but only differences matter, and the minus sign has a clear meaning: a mass near the Earth is in an energy hole, and it takes a positive amount of energy, G M m / r, to climb out.")}
      </p>

      <H3>{tx(t, "phGrav_escTitle", "Escape speed")}</H3>
      <p>
        {tx(t, "phGrav_escBody",
          "Throw something upwards fast enough and it never comes back: it slows down forever but never stops. The minimum speed is the one whose kinetic energy just pays for the climb out of the hole, leaving the object with zero speed at infinity.")}
      </p>
      <Derivation t={t} label={tx(t, "phGrav_eqEsc", "The escape speed")}
        steps={[
          { tex: r`\tfrac12 m v^2 - \frac{G M m}{R} = 0 + 0`, why: tx(t, "phGrav_e1", "energy conservation: at the surface, and far away with no speed left") },
          { tex: r`\green{v_{\text{esc}} = \sqrt{\frac{2 G M}{R}} = \sqrt{2}\, v_{\text{circ}}}`, why: tx(t, "phGrav_e2", "m cancels; it is √2 times the speed of a circular orbit at the same radius") },
        ]} />
      <p>
        {tx(t, "phGrav_escNum",
          "From the Earth's surface, v_esc = √(2 × 3.986 × 10¹⁴ / 6.371 × 10⁶) = 11.2 km/s; from the Moon, only 2.4 km/s, which is why the Apollo lunar module could take off with a small engine. The direction does not matter (if nothing is in the way), since energy is not a vector. If a body were squeezed so small that v_esc reached the speed of light, not even light could leave: a black hole. Setting v_esc = c gives the radius R = 2 G M / c², where c = 3 × 10⁸ m/s is the speed of light; for the Earth it is 9 mm, a marble holding the whole planet.")}
      </p>

      <H3>{tx(t, "phGrav_orbEnTitle", "The energy of an orbit")}</H3>
      <p>
        {tx(t, "phGrav_orbEnBody",
          "In a circular orbit v² = G M / r, so the kinetic energy is ½ m v² = G M m / (2r), exactly half the size of the potential energy. The total is E = K + U = −G M m / (2r): negative, a bound orbit. A satellite with a negative total energy is trapped; with zero or positive energy it escapes.")}
      </p>
      <Equation label={tx(t, "phGrav_eqOrbE", "Energy of a circular orbit")}
        where={[
          [r`K`, tx(t, "phGrav_wK", "the kinetic energy, G M m / (2r)")],
          [r`U`, tx(t, "phGrav_wU", "the potential energy, −G M m / r")],
          [r`E`, tx(t, "phGrav_wE", "the total; for an ellipse, r is replaced by the semi-major axis a")],
        ]}
        note={tx(t, "phGrav_paradox", "The orbit paradox: to catch up with a space station ahead of you in the same orbit, fire your engine backwards, against your motion. You lose energy, drop to a lower orbit, and there you move faster (v = √(G M / r) grows as r shrinks), so you overtake. Air drag does the same to a low satellite: it loses energy, sinks, and speeds up.")}>
        {r`E = K + U = \frac{G M m}{2r} - \frac{G M m}{r} = -\frac{G M m}{2r}`}
      </Equation>

      <H3>{tx(t, "phGrav_weightTitle", "Weightlessness")}</H3>
      <p>
        {tx(t, "phGrav_weightBody",
          "The elevator chapter showed that a scale reads zero when you and it fall together. A spacecraft in orbit is falling all the time, and so are the astronauts inside, with the same acceleration g(r). Nothing presses them against the floor: they are weightless, while gravity at their height is still nearly 90 % of its strength on the ground. Training aircraft give the same feeling for about 25 s at a time by flying a parabola, the path a freely falling object would follow.")}
      </p>

      <H2>{tx(t, "phGrav_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phGrav_ex1", "1. The Moon's mass is 7.35 × 10²² kg and its radius 1 737 km. g = 6.674 × 10⁻¹¹ × 7.35 × 10²² / (1.737 × 10⁶)² = 1.63 m/s², about a sixth of the Earth's.")}</p>
      <p>{tx(t, "phGrav_ex2", "2. The Moon orbits at 384 400 km in 27.3 days. Kepler's third law for the Earth gives M = 4π² × (3.844 × 10⁸)³ / (6.674 × 10⁻¹¹ × (2.36 × 10⁶)²) = 6.0 × 10²⁴ kg, the Earth's mass again, found from a completely different measurement.")}</p>
      <p>{tx(t, "phGrav_ex3", "3. Mars is 1.524 AU from the Sun. T = 1.524^(3/2) = 1.88 years: a Martian year lasts 687 Earth days.")}</p>
      <p>{tx(t, "phGrav_ex4", "4. Raising a 1 000 kg satellite from the ground to a 400 km orbit needs the potential energy difference G M m (1/R − 1/r) = 3.986 × 10¹⁴ × 1 000 × (1/6.371 × 10⁶ − 1/6.771 × 10⁶) = 3.7 GJ, plus the orbit's kinetic energy ½ × 1 000 × 7 670² = 29.4 GJ. Getting up is the easy part; getting the speed is eight times harder.")}</p>
      <p>{tx(t, "phGrav_ex5", "5. Halley's comet has a period of 76 years. Its semi-major axis is a = 76^(2/3) = 17.9 AU. Its closest point is 0.59 AU, so its farthest is 2a − 0.59 = 35.3 AU, beyond Neptune.")}</p>

      <H2>{tx(t, "phGrav_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phGrav_tWrong", "Wrong"), tx(t, "phGrav_tRight", "Right"), tx(t, "phGrav_tWhy", "Why")]}
        rows={[
          [tx(t, "phGrav_m1w", "there is no gravity in space"), tx(t, "phGrav_m1r", "orbiting astronauts are falling"), tx(t, "phGrav_m1", "g at the Space Station is 8.7 m/s²")],
          [tx(t, "phGrav_m2w", "r is the height above the ground"), tx(t, "phGrav_m2r", "r is measured from the centre"), tx(t, "phGrav_m2", "add the planet's radius")],
          [tx(t, "phGrav_m3w", "a heavier satellite needs a faster orbit"), tx(t, "phGrav_m3r", "the mass cancels"), tx(t, "phGrav_m3", "v = √(G M / r) depends only on the central mass")],
          [tx(t, "phGrav_m4w", "U = m g h always"), tx(t, "phGrav_m4r", "U = −G M m / r"), tx(t, "phGrav_m4", "m g h only works when h is much smaller than R")],
          [tx(t, "phGrav_m5w", "the heavier body pulls harder"), tx(t, "phGrav_m5r", "the forces are equal"), tx(t, "phGrav_m5", "third law: the Earth pulls the apple exactly as hard as the apple pulls the Earth")],
        ]}
      />

      <KeyIdeas t={t} id="phGrav" items={[
        "Any two masses attract with F = G m₁ m₂ / r², along the line between their centres; G = 6.674 × 10⁻¹¹ N·m²/kg².",
        "At a planet's surface g = G M / R², the same for every mass; turned round, it weighs the planet.",
        "An orbit is free fall that keeps missing the ground; a circular one has v = √(G M / r), independent of the satellite's mass.",
        "Kepler's third law, T² = 4π² r³ / (G M), weighs the central body from any orbit around it.",
        "The potential energy is U = −G M m / r, zero at infinity; near the ground it reduces to m g h.",
        "Escape speed √(2 G M / R) is √2 times the circular speed: 11.2 km/s from the Earth.",
      ]} />
    </Article>
  );
}
