"use client";

// Dynamics 3: uniform circular motion — period, frequency, angular speed and
// v = ω r; why constant speed on a circle is accelerated; a = v²/r derived
// from the velocity triangle; centripetal force is a role, not a new force;
// "centrifugal force"; flat curves (v_max = √(μ g R)); banked curves; vertical
// circles and the loop; the Moon's acceleration and Newton's test.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { CircularMotionFigure } from "@/components/lesson/figures/physics/CircularMotionFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Fastest safe speed on a flat curve. */
const curveNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const vm = Math.sqrt(v.mu * 9.81 * v.R);
  return {
    tex: r`v_{\max} = \sqrt{${num(v.mu, 2)} \times 9.81 \times ${num(v.R, 0)}} = ${num(vm)}\ \text{m/s} = \amber{${num(vm * 3.6, 0)}\ \text{km/h}}`,
    meter: Math.min(1, (vm * 3.6) / 200), meterLabel: `${num(vm * 3.6, 0)} km/h · ${tx(t, "phCirc_liveScale", "scale 0–200")}`,
  };
};

export function CircularMotionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phCirc_intro",
          "A car on a roundabout, a satellite in orbit, a stone whirled on a string, the drum of a washing machine: circular motion is everywhere. It hides a surprise. Even at perfectly constant speed, an object going round a circle is accelerating, all the time, towards the centre. By the second law, something must then be pulling it inward. This chapter finds how big that acceleration is and what supplies the pull.")}
      </Lead>

      <Goals t={t} id="phCirc" items={[
        "Use period, frequency and angular speed, and convert between them and the speed.",
        "Explain why uniform circular motion is accelerated, and derive a = v²/r.",
        "Identify the real force that plays the centripetal role: tension, friction, gravity or the normal force.",
        "Solve flat and banked curves and the top and bottom of a vertical loop.",
      ]} />

      <H2>{tx(t, "phCirc_describeTitle", "Describing motion on a circle")}</H2>
      <p>
        {tx(t, "phCirc_describeBody",
          "Uniform circular motion means going round a circle of radius r at constant speed v. The time for one full turn is the period T; the number of turns per second is the frequency f = 1/T, measured in hertz (Hz). The angle swept per second is the angular speed ω (the Greek letter omega), measured in radians per second. A radian is the angle whose arc is as long as the radius, so a full turn is 2π rad, and an arc of angle θ has length r θ.")}
      </p>
      <Equation label={tx(t, "phCirc_eqDesc", "Period, frequency, angular speed")}
        where={[
          [r`T`, tx(t, "phCirc_wT", "the period: time for one turn (s)")],
          [r`f`, tx(t, "phCirc_wF", "the frequency: turns per second (Hz = 1/s)")],
          [r`\omega`, tx(t, "phCirc_wW", "the angular speed (rad/s)")],
          [r`v`, tx(t, "phCirc_wV", "the speed along the circle (m/s): one circumference 2πr per period")],
        ]}
        note={tx(t, "phCirc_descNote", "A washing machine spinning at 1 200 turns per minute has f = 20 Hz and ω = 2π × 20 = 126 rad/s. Clothes against its 25 cm drum move at v = 126 × 0.25 = 31 m/s, more than 110 km/h.")}>
        {r`f = \frac{1}{T} \qquad \omega = \frac{2\pi}{T} = 2\pi f \qquad v = \frac{2\pi r}{T} = \omega\, r`}
      </Equation>

      <H2>{tx(t, "phCirc_accTitle", "Why there is an acceleration")}</H2>
      <p>
        {tx(t, "phCirc_accBody",
          "Velocity is a vector: it has a direction as well as a size. On a circle the speed stays the same but the direction keeps turning, so the velocity keeps changing, and a changing velocity is an acceleration. Which way does it point? Take the velocity at two moments a short time Δt apart and draw them from the same point. They have the same length v and differ by the small angle Δθ the object has swept. The arrow from the first tip to the second is the change Δv, and as Δt shrinks it points straight at the centre of the circle.")}
      </p>
      <Derivation t={t} label={tx(t, "phCirc_eqDerive", "The size of the acceleration")}
        steps={[
          { tex: r`\Delta\theta = \frac{v\,\Delta t}{r}`, why: tx(t, "phCirc_d1", "in Δt the object covers an arc v Δt; angle = arc ÷ radius") },
          { tex: r`|\Delta \vec v| \approx v\,\Delta\theta`, why: tx(t, "phCirc_d2", "the two velocity arrows have length v and an angle Δθ between them: the gap between their tips is an arc of that small angle, v Δθ") },
          { tex: r`|\Delta \vec v| \approx v \cdot \frac{v\,\Delta t}{r} = \frac{v^2}{r}\,\Delta t`, why: tx(t, "phCirc_d3", "substitute Δθ from the first line") },
          { tex: r`a = \frac{|\Delta \vec v|}{\Delta t} = \green{\frac{v^2}{r}}`, why: tx(t, "phCirc_d4", "divide by Δt; the approximation becomes exact as Δt → 0") },
        ]} />
      <Equation label={tx(t, "phCirc_eqCentripetal", "Centripetal acceleration")}
        where={[
          [r`a_c`, tx(t, "phCirc_wAc", "the centripetal (\"centre-seeking\") acceleration, pointing to the centre (m/s²)")],
          [r`v`, tx(t, "phCirc_wV2", "the speed (m/s)")],
          [r`r`, tx(t, "phCirc_wR", "the radius of the circle (m)")],
          [r`\omega`, tx(t, "phCirc_wW2", "the angular speed; v = ω r gives the second form")],
        ]}
        words={tx(t, "phCirc_acWords", "Twice as fast means four times the acceleration; a circle half as wide means twice the acceleration at the same speed.")}>
        {r`a_c = \frac{v^2}{r} = \omega^2\, r`}
      </Equation>

      <H2>{tx(t, "phCirc_forceTitle", "Centripetal force is a job, not a force")}</H2>
      <p>
        {tx(t, "phCirc_forceBody",
          "By the second law, an acceleration v²/r towards the centre needs a net force m v²/r towards the centre. This is called the centripetal force, but it is not a new kind of force to add to a free-body diagram. It is a role that some real force, or a combination of forces, has to play. Find out which one in every problem, then write ΣF towards the centre = m v²/r.")}
      </p>
      <Equation label={tx(t, "phCirc_eqForce", "The centripetal condition")}
        where={[
          [r`\Sigma F_{\text{in}}`, tx(t, "phCirc_wFin", "the sum of the force components pointing towards the centre (N)")],
          [r`m`, tx(t, "phCirc_wM", "the mass of the object (kg)")],
        ]}>
        {r`\Sigma F_{\text{in}} = m\,\frac{v^2}{r}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "phCirc_tMotion", "Motion"), tx(t, "phCirc_tSupplier", "Who provides the inward force")]}
        rows={[
          [tx(t, "phCirc_s1", "stone whirled on a string"), tx(t, "phCirc_s1f", "the tension of the string")],
          [tx(t, "phCirc_s2", "car on a flat curve"), tx(t, "phCirc_s2f", "static friction of the road on the tyres")],
          [tx(t, "phCirc_s3", "the Moon around the Earth"), tx(t, "phCirc_s3f", "the Earth's gravity")],
          [tx(t, "phCirc_s4", "clothes in a spinning drum"), tx(t, "phCirc_s4f", "the normal force of the drum wall")],
          [tx(t, "phCirc_s5", "rider at the top of a loop"), tx(t, "phCirc_s5f", "weight plus the normal force of the seat, both downward")],
        ]}
      />
      <CircularMotionFigure t={t} />
      <Callout type="info" t={t}>
        {tx(t, "phCirc_centrifugal", "What about the \"centrifugal force\" that seems to throw you outward in a turning car? Seen from the road, there is none: your body tries to go straight (first law), and the car door pushes you inward to make you turn with it. Seen from inside the car, which is a rotating, accelerating frame, it feels as if a force pushes you out. Like the forward shove in a braking bus, it is a fictitious force: a correction you need only when describing motion from an accelerating frame.")}
      </Callout>

      <H2>{tx(t, "phCirc_flatTitle", "Cars on flat curves")}</H2>
      <p>
        {tx(t, "phCirc_flatBody",
          "On a level road the only sideways force on a car is friction from the road on the tyres. The tyres roll without sliding sideways, so it is static friction, and it can supply at most μs N = μs m g. The curve needs m v²/R. The car stays on its path only while the curve's need does not exceed what friction can give.")}
      </p>
      <Derivation t={t} label={tx(t, "phCirc_eqFlat", "The fastest safe speed on a flat curve")}
        steps={[
          { tex: r`m\,\frac{v^2}{R} \le \mu_s\, m g`, why: tx(t, "phCirc_f1", "needed inward force ≤ the most friction can give; N = mg on level ground") },
          { tex: r`v^2 \le \mu_s\, g\, R`, why: tx(t, "phCirc_f2", "the mass cancels: the same limit for a lorry and a bicycle") },
          { tex: r`\green{v_{\max} = \sqrt{\mu_s\, g\, R}}`, why: tx(t, "phCirc_f3", "square root of both sides") },
        ]} />
      <LiveFormula label={tx(t, "phCirc_liveCurve", "Try it: the speed limit of a curve")}
        tex={r`v_{\max} = \sqrt{\mu_s\, g\, R}`}
        vars={[
          { id: "R", label: "R (m)", min: 10, max: 300, step: 5, value: 50, fmt: v => `${num(v, 0)} m` },
          { id: "mu", label: "μs", min: 0.05, max: 1.1, step: 0.05, value: 0.7, fmt: v => num(v, 2) },
        ]}
        compute={curveNumbers(t)}
        note={tx(t, "phCirc_liveCurveNote", "A 50 m curve on a dry road (μs ≈ 0.7) is safe up to about 67 km/h. When it rains (μs ≈ 0.4) the limit drops to about 50 km/h, and on ice (μs ≈ 0.1) to about 25 km/h. The limit grows only as the square root of the radius: four times the radius doubles it.")} />

      <H2>{tx(t, "phCirc_bankTitle", "Banked curves")}</H2>
      <p>
        {tx(t, "phCirc_bankBody",
          "Racetracks and motorway ramps tilt the road towards the inside of the curve. Then the normal force, which is perpendicular to the road, leans inward and supplies part (or all) of the centripetal force, so the car does not depend on friction alone. At one particular speed, the design speed, no friction is needed at all.")}
      </p>
      <Derivation t={t} label={tx(t, "phCirc_eqBank", "The banking angle with no friction needed")}
        steps={[
          { tex: r`N\cos\theta = m g`, why: tx(t, "phCirc_k1", "vertically nothing accelerates: the upward part of N holds the weight") },
          { tex: r`N\sin\theta = m\,\frac{v^2}{R}`, why: tx(t, "phCirc_k2", "horizontally the inward part of N is the whole centripetal force") },
          { tex: r`\frac{N\sin\theta}{N\cos\theta} = \frac{m v^2 / R}{m g}`, why: tx(t, "phCirc_k3", "divide the second equation by the first: N and m cancel") },
          { tex: r`\green{\tan\theta = \frac{v^2}{g\,R}}`, why: tx(t, "phCirc_k4", "the angle for a given design speed and radius") },
        ]} />
      <p>
        {tx(t, "phCirc_bankEx",
          "A motorway curve of radius 200 m designed for 90 km/h (25 m/s) needs tan θ = 625 / (9.81 × 200) = 0.32, so θ ≈ 18°. Slower cars would slide down the slope without friction; faster ones would slide up and out. Friction covers both within a range of speeds. The steep turns of a velodrome reach 45°.")}
      </p>

      <H2>{tx(t, "phCirc_vertTitle", "Vertical circles: the loop")}</H2>
      <p>
        {tx(t, "phCirc_vertBody",
          "On a roller-coaster loop, gravity points towards the centre at the top and away from it at the bottom, so the seat has to push very differently in the two places. At the top both the weight and the seat's push point down, towards the centre.")}
      </p>
      <Derivation t={t} label={tx(t, "phCirc_eqLoop", "Top and bottom of a loop of radius r")}
        steps={[
          { tex: r`N_{\text{top}} + m g = m\,\frac{v^2}{r}`, why: tx(t, "phCirc_o1", "at the top: both forces point down, towards the centre") },
          { tex: r`N_{\text{top}} \ge 0 \;\Rightarrow\; \green{v_{\text{top}} \ge \sqrt{g\, r}}`, why: tx(t, "phCirc_o2", "a seat can push but not pull: below this speed gravity alone would bend the path tighter than the loop, and the rider would leave the rails") },
          { tex: r`N_{\text{bottom}} - m g = m\,\frac{v^2}{r} \;\Rightarrow\; N_{\text{bottom}} = m\left(g + \frac{v^2}{r}\right)`, why: tx(t, "phCirc_o3", "at the bottom: the seat pushes up (towards the centre), the weight pulls down") },
        ]} />
      <p>
        {tx(t, "phCirc_loopEx",
          "For a loop of radius 10 m, the speed at the top must be at least √(9.81 × 10) = 9.9 m/s. At the bottom, going 20 m/s, the seat pushes with m (9.81 + 40) = 5.1 m g: the rider feels five times heavier, \"5 g\". This is also why a bucket of water swung fast overhead does not spill: at the top the water needs more downward force than its weight, and the bucket provides the rest.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phCirc_clothoid", "Real loops are not circles. They are taller than wide, tighter at the top (where the train is slow) and gentler at the bottom (where it is fast), which keeps the forces on riders below about 4 g.")}
      </Callout>

      <H3>{tx(t, "phCirc_nonUniformTitle", "When the speed changes too")}</H3>
      <p>
        {tx(t, "phCirc_nonUniformBody",
          "If the speed along the circle changes, as on a loop or when a car brakes in a bend, the acceleration has two parts: the centripetal part v²/r towards the centre, which turns the velocity, and a tangential part along the path, which changes the speed. They are at right angles, so the total is √(a_c² + a_t²).")}
      </p>

      <H2>{tx(t, "phCirc_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phCirc_ex1", "1. A 0.2 kg ball on a 0.8 m string makes 2 turns per second on a smooth table. v = 2π × 0.8 × 2 = 10.1 m/s, a = v²/r = 10.1² / 0.8 = 126 m/s², and the string pulls with 0.2 × 126 = 25 N.")}</p>
      <p>{tx(t, "phCirc_ex2", "2. The Moon orbits at r = 3.84 × 10⁸ m once every 27.3 days (2.36 × 10⁶ s). Its speed is 2πr/T = 1 020 m/s and its acceleration v²/r = 0.00272 m/s². Newton noticed that this is g divided by 60², and the Moon is 60 Earth radii away: the pull of gravity weakens with the square of the distance. The gravity chapter starts from here.")}</p>
      <p>{tx(t, "phCirc_ex3", "3. A point on the equator goes round once a day (86 164 s, measured against the stars) on a circle of 6 371 km. ω = 2π / 86 164 = 7.29 × 10⁻⁵ rad/s and a = ω² r = 0.034 m/s². Part of your weight is used up turning you with the Earth, so a scale at the equator reads about 0.35 % less than at a pole.")}</p>

      <H2>{tx(t, "phCirc_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phCirc_tWrong", "Wrong"), tx(t, "phCirc_tRight", "Right"), tx(t, "phCirc_tWhy", "Why")]}
        rows={[
          [tx(t, "phCirc_m1w", "constant speed, so no acceleration"), tx(t, "phCirc_m1r", "a = v²/r towards the centre"), tx(t, "phCirc_m1", "the direction of the velocity changes")],
          [tx(t, "phCirc_m2w", "cut the string and the ball flies outward"), tx(t, "phCirc_m2r", "it flies off along the tangent"), tx(t, "phCirc_m2", "first law: it keeps the velocity it had")],
          [tx(t, "phCirc_m3w", "draw a centripetal force on the free-body diagram"), tx(t, "phCirc_m3r", "draw the real forces; their inward sum is m v²/r"), tx(t, "phCirc_m3", "centripetal is a role, not a kind of force")],
          [tx(t, "phCirc_m4w", "a centrifugal force pushes you out"), tx(t, "phCirc_m4r", "you tend to go straight; the car pushes you in"), tx(t, "phCirc_m4", "centrifugal force only appears in a rotating frame")],
          [tx(t, "phCirc_m5w", "a wider curve needs more force"), tx(t, "phCirc_m5r", "at the same speed it needs less"), tx(t, "phCirc_m5", "a = v²/r falls as r grows")],
        ]}
      />

      <KeyIdeas t={t} id="phCirc" items={[
        "Period T, frequency f = 1/T, angular speed ω = 2π/T, and speed v = ω r.",
        "At constant speed on a circle, the velocity turns, so there is an acceleration v²/r = ω² r pointing to the centre.",
        "The centripetal force is whatever real force supplies m v²/r inward: tension, friction, gravity, a normal force.",
        "If the inward force vanishes, the object leaves along the tangent; centrifugal force exists only in rotating frames.",
        "Flat curve: v_max = √(μs g R). Banked curve with no friction: tan θ = v²/(g R).",
        "Top of a loop: v ≥ √(g r). At the bottom the seat pushes with m (g + v²/r).",
      ]} />
    </Article>
  );
}
