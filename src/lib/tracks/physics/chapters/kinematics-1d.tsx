"use client";

// Foundations 2: motion along a line — position, displacement and distance;
// average and instantaneous velocity (the slope of x(t)); acceleration and its
// sign; reading the three graphs (slope one way, area the other); the three
// constant-acceleration equations derived from the graphs; stopping distance;
// free fall and a ball thrown straight up.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MotionGraphsFigure } from "@/components/lesson/figures/physics/MotionGraphsFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Stopping distance: reaction distance plus braking distance. */
const stopNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const v0 = v.kmh / 3.6, react = v0 * v.tr, brake = (v0 * v0) / (2 * v.a);
  return {
    tex: r`v_0 = \frac{${num(v.kmh, 0)}}{3.6} = ${num(v0)}\ \text{m/s} \qquad d = \underbrace{${num(v0)} \times ${num(v.tr)}}_{\text{${tx(t, "phKin1_liveReact", "reaction")}}\ =\ ${num(react)}} + \underbrace{\frac{${num(v0)}^2}{2 \times ${num(v.a)}}}_{\text{${tx(t, "phKin1_liveBrake", "braking")}}\ =\ ${num(brake)}} = \amber{${num(react + brake)}\ \text{m}}`,
    meter: Math.min(1, (react + brake) / 150), meterLabel: `${num(react + brake)} m`,
  };
};

export function Kinematics1dContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phKin1_intro",
          "Kinematics is the description of motion: where something is, how fast it goes, how quickly that speed changes. It does not ask why things move; that is the job of forces, in the next section. Starting with motion along a single straight line keeps every quantity a plain number with a sign. Everything here comes back in two and three dimensions, one direction at a time.")}
      </Lead>

      <Goals t={t} id="phKin1" items={[
        "Tell displacement from distance, and velocity from speed.",
        "Read velocity as the slope of x(t), and displacement as the area under v(t).",
        "Derive and use the three equations of constant acceleration.",
        "Solve free-fall problems, including a ball thrown straight up.",
      ]} />

      <H2>{tx(t, "phKin1_posTitle", "Position and displacement")}</H2>
      <p>
        {tx(t, "phKin1_posBody",
          "To say where something is on a line, pick a point to call zero (the origin) and a direction to call positive. The position x is then the signed distance from the origin: x = 5 m is five metres on the positive side, x = −2 m two metres on the other side. The choice is yours, and a good choice makes the algebra easy; it does not change the physics. The displacement is the change in position between two moments, final minus initial. It has a sign: moving towards negative x gives a negative displacement.")}
      </p>
      <Equation label={tx(t, "phKin1_eqDisp", "Displacement")}
        where={[
          [r`\Delta x`, tx(t, "phKin1_wDx", "the displacement (m); Δ, the Greek capital delta, means \"change in\"")],
          [r`x_f`, tx(t, "phKin1_wXf", "the final position")],
          [r`x_i`, tx(t, "phKin1_wXi", "the initial position")],
        ]}
        note={tx(t, "phKin1_dispNote", "Walk from x = 2 m to x = 7 m and back to x = 4 m. The displacement is 4 − 2 = 2 m. The distance travelled is 5 + 3 = 8 m. Distance counts every metre walked and is never negative; displacement only compares start and end.")}>
        {r`\Delta x = x_f - x_i`}
      </Equation>

      <H2>{tx(t, "phKin1_velTitle", "Velocity")}</H2>
      <p>
        {tx(t, "phKin1_velBody",
          "Average velocity is displacement divided by the time it took. Like displacement it has a sign, which tells the direction. Speed is the size of the velocity, without the sign. On a graph of position against time, the average velocity between two moments is the slope of the straight line joining the two points.")}
      </p>
      <Equation label={tx(t, "phKin1_eqVavg", "Average velocity")}
        where={[
          [r`\bar v`, tx(t, "phKin1_wVbar", "the average velocity (m/s); the bar means \"average\"")],
          [r`\Delta x`, tx(t, "phKin1_wDx2", "the displacement in that interval (m)")],
          [r`\Delta t`, tx(t, "phKin1_wDt", "the length of the interval, t_f − t_i (s)")],
        ]}
        words={tx(t, "phKin1_vavgWords", "How far the position changed, divided by how long it took.")}>
        {r`\bar v = \frac{\Delta x}{\Delta t} = \frac{x_f - x_i}{t_f - t_i}`}
      </Equation>
      <p>
        {tx(t, "phKin1_instBody",
          "A car's speedometer does not show an average over the trip: it shows the velocity right now. That instantaneous velocity is what the average becomes as the interval shrinks to nothing, which is exactly the derivative from the Math track's derivatives chapter. On the graph it is the slope of the tangent line to x(t). You do not need calculus to use it: \"steep x graph\" means fast, \"flat x graph\" means stopped, \"falling x graph\" means moving backwards.")}
      </p>
      <Equation label={tx(t, "phKin1_eqVinst", "Instantaneous velocity")}
        where={[
          [r`v`, tx(t, "phKin1_wV", "the velocity at the instant t (m/s)")],
          [r`\frac{dx}{dt}`, tx(t, "phKin1_wDxdt", "the derivative of position with respect to time: the slope of x(t) at t")],
        ]}>
        {r`v = \lim_{\Delta t \to 0} \frac{\Delta x}{\Delta t} = \frac{dx}{dt}`}
      </Equation>

      <H2>{tx(t, "phKin1_accTitle", "Acceleration")}</H2>
      <p>
        {tx(t, "phKin1_accBody",
          "Acceleration is how fast the velocity changes: the change of velocity per second. A car going from 0 to 20 m/s in 10 s gains 2 m/s every second, so its acceleration is 2 (m/s)/s, written 2 m/s². Just as velocity is the slope of the position graph, acceleration is the slope of the velocity graph.")}
      </p>
      <Equation label={tx(t, "phKin1_eqAcc", "Acceleration")}
        where={[
          [r`a`, tx(t, "phKin1_wA", "the acceleration (m/s²)")],
          [r`\Delta v`, tx(t, "phKin1_wDv", "the change in velocity over the interval (m/s)")],
          [r`\frac{dv}{dt}`, tx(t, "phKin1_wDvdt", "the slope of v(t) at the instant t")],
        ]}>
        {r`\bar a = \frac{\Delta v}{\Delta t} \qquad a = \frac{dv}{dt}`}
      </Equation>
      <p>
        {tx(t, "phKin1_signBody",
          "The sign of the acceleration is not \"speeding up or slowing down\". It is the direction of the change. Whether the object speeds up depends on whether a and v point the same way:")}
      </p>
      <LessonTable
        headers={["v", "a", tx(t, "phKin1_tResult", "What happens"), tx(t, "phKin1_tExample", "Example")]}
        rows={[
          ["+", "+", tx(t, "phKin1_s1", "speeds up, moving forward"), tx(t, "phKin1_s1e", "pressing the accelerator")],
          ["+", "−", tx(t, "phKin1_s2", "slows down, moving forward"), tx(t, "phKin1_s2e", "braking")],
          ["−", "−", tx(t, "phKin1_s3", "speeds up, moving backward"), tx(t, "phKin1_s3e", "a dropped stone, with up as positive")],
          ["−", "+", tx(t, "phKin1_s4", "slows down, moving backward"), tx(t, "phKin1_s4e", "a reversing car braking")],
        ]}
      />

      <H2>{tx(t, "phKin1_graphTitle", "Three linked graphs")}</H2>
      <p>
        {tx(t, "phKin1_graphBody",
          "The three graphs x(t), v(t) and a(t) describe the same motion, and they are linked in both directions. Going down, take slopes: the slope of x is v, the slope of v is a. Going up, take areas: the area between the v graph and the time axis over an interval is the displacement in that interval, because each thin strip of the area is a velocity times a short time, a small distance. Area below the axis counts as negative. In the same way, the area under a(t) is the change in velocity.")}
      </p>
      <MotionGraphsFigure t={t} />
      <LessonTable
        headers={[tx(t, "phKin1_tGraph", "Graph"), tx(t, "phKin1_tSlope", "Its slope is"), tx(t, "phKin1_tArea", "Area under it is")]}
        rows={[
          ["x(t)", "v", "—"],
          ["v(t)", "a", tx(t, "phKin1_tAreaV", "the displacement Δx")],
          ["a(t)", tx(t, "phKin1_tJerk", "the jerk (rarely used)"), tx(t, "phKin1_tAreaA", "the change of velocity Δv")],
        ]}
      />

      <H2>{tx(t, "phKin1_constTitle", "Constant acceleration")}</H2>
      <p>
        {tx(t, "phKin1_constBody",
          "Many motions have a constant acceleration, or nearly: a car pulling away, a train braking, anything falling over short distances. Then the v graph is a straight line and three equations solve every problem. Call the start time 0, the starting position x₀ and the starting velocity v₀. The first equation is the definition of acceleration rearranged: after t seconds the velocity has grown by a every second.")}
      </p>
      <Equation label={tx(t, "phKin1_eqV", "Velocity under constant acceleration")}
        where={[
          [r`v_0`, tx(t, "phKin1_wV0", "the velocity at t = 0 (m/s)")],
          [r`a\,t`, tx(t, "phKin1_wAt", "what the acceleration has added after t seconds")],
        ]}>
        {r`v = v_0 + a\,t`}
      </Equation>
      <p>
        {tx(t, "phKin1_constBody2",
          "The displacement is the area under this straight-line v graph from 0 to t. That shape is a trapezoid: a rectangle of height v₀ and width t, with a triangle of width t and height a t on top.")}
      </p>
      <Derivation t={t} label={tx(t, "phKin1_eqX", "Position under constant acceleration, from the area")}
        steps={[
          { tex: r`x - x_0 = \text{area under } v(t) \text{ from } 0 \text{ to } t` },
          { tex: r`= \underbrace{v_0\, t}_{\text{rectangle}} + \underbrace{\tfrac12 \cdot t \cdot a t}_{\text{triangle}}`, why: tx(t, "phKin1_x1", "rectangle: height v₀ × width t; triangle: half of width t × height a t") },
          { tex: r`= v_0\,t + \tfrac12 a t^2`, why: tx(t, "phKin1_x2", "tidy up the triangle") },
          { tex: r`x = \green{x_0 + v_0\,t + \tfrac12 a\,t^2}`, why: tx(t, "phKin1_x3", "move x₀ to the right side") },
        ]} />
      <p>
        {tx(t, "phKin1_constBody3",
          "The same trapezoid can be read as \"average height times width\": with v rising in a straight line, the average velocity is exactly halfway, (v₀ + v)/2. That only holds for constant acceleration. The third equation removes time altogether, which helps when the question gives distances and speeds but no time, like a braking distance.")}
      </p>
      <Derivation t={t} label={tx(t, "phKin1_eqV2", "The equation without time")}
        steps={[
          { tex: r`x - x_0 = \frac{v_0 + v}{2}\, t`, why: tx(t, "phKin1_v1", "displacement = average velocity × time") },
          { tex: r`t = \frac{v - v_0}{a}`, why: tx(t, "phKin1_v2", "solve v = v₀ + a t for t") },
          { tex: r`x - x_0 = \frac{(v + v_0)(v - v_0)}{2a}`, why: tx(t, "phKin1_v3", "substitute t into the first line") },
          { tex: r`x - x_0 = \frac{v^2 - v_0^2}{2a}`, why: tx(t, "phKin1_v4", "(v + v₀)(v − v₀) = v² − v₀², the difference of squares") },
          { tex: r`\green{v^2 = v_0^2 + 2a\,(x - x_0)}`, why: tx(t, "phKin1_v5", "multiply both sides by 2a and add v₀²") },
        ]} />
      <LessonTable
        headers={[tx(t, "phKin1_tEq", "Equation"), tx(t, "phKin1_tMissing", "Leaves out"), tx(t, "phKin1_tUse", "Use it when")]}
        rows={[
          ["v = v₀ + a t", "x", tx(t, "phKin1_u1", "the question is about speed and time")],
          ["x = x₀ + v₀ t + ½ a t²", "v", tx(t, "phKin1_u2", "you need the position at a given time")],
          ["v² = v₀² + 2a Δx", "t", tx(t, "phKin1_u3", "no time is given or asked")],
          ["Δx = ½ (v₀ + v) t", "a", tx(t, "phKin1_u4", "the acceleration is unknown")],
        ]}
      />

      <H3>{tx(t, "phKin1_stopTitle", "Stopping distance")}</H3>
      <p>
        {tx(t, "phKin1_stopBody",
          "A driver sees danger. For a reaction time (about 1 s) the car keeps its speed v₀, covering v₀ times that time. Then the brakes give a constant deceleration a until v = 0. The third equation with v = 0 gives the braking distance v₀²/(2a). The speed is squared: twice as fast needs four times the braking distance.")}
      </p>
      <Equation label={tx(t, "phKin1_eqStop", "Stopping distance")}
        where={[
          [r`v_0`, tx(t, "phKin1_wV0s", "the speed when the driver sees the danger (m/s)")],
          [r`t_r`, tx(t, "phKin1_wTr", "the reaction time (s)")],
          [r`a`, tx(t, "phKin1_wAb", "the size of the braking deceleration (m/s²): about 7 on a dry road, 3 to 4 on a wet one")],
        ]}>
        {r`d = v_0\, t_r + \frac{v_0^2}{2a}`}
      </Equation>
      <LiveFormula label={tx(t, "phKin1_liveStop", "Try it: how far does the car go before it stops?")}
        tex={r`d = v_0\, t_r + \frac{v_0^2}{2a}`}
        vars={[
          { id: "kmh", label: "v₀ (km/h)", min: 10, max: 150, step: 5, value: 50, fmt: v => num(v, 0) },
          { id: "tr", label: "tᵣ (s)", min: 0.3, max: 2.5, step: 0.1, value: 1, fmt: v => num(v) },
          { id: "a", label: "a (m/s²)", min: 2, max: 9, step: 0.5, value: 7, fmt: v => num(v) },
        ]}
        compute={stopNumbers(t)}
        note={tx(t, "phKin1_liveStopNote", "At 50 km/h on a dry road the car needs about 28 m. At 100 km/h, about 83 m: the reaction part doubles, the braking part quadruples. Set a = 3.5 for a wet road, or tᵣ = 2 s for a distracted driver, and watch the total grow.")} />

      <H2>{tx(t, "phKin1_fallTitle", "Free fall")}</H2>
      <p>
        {tx(t, "phKin1_fallBody",
          "Drop anything near the Earth's surface and, if air resistance is small, it falls with the same constant acceleration whatever its mass: g = 9.81 m/s², directed downward. Galileo argued this around 1600; on the Moon in 1971 the astronaut David Scott dropped a hammer and a feather together and they landed at the same moment. On Earth a feather falls slowly only because of the air. So free fall is just constant acceleration with a = −g, if we take up as positive.")}
      </p>
      <Equation label={tx(t, "phKin1_eqFall", "Free fall, up taken as positive")}
        where={[
          [r`y`, tx(t, "phKin1_wY", "the height (m); we write y for vertical positions")],
          [r`g`, tx(t, "phKin1_wG", "the size of the acceleration of gravity, 9.81 m/s²; the minus sign says it points down")],
        ]}>
        {r`v = v_0 - g\,t \qquad y = y_0 + v_0\,t - \tfrac12 g\,t^2 \qquad v^2 = v_0^2 - 2g\,(y - y_0)`}
      </Equation>
      <p>
        {tx(t, "phKin1_upBody",
          "A ball thrown straight up at v₀ slows down by 9.81 m/s every second, stops for an instant at the top, then falls back, speeding up by the same amount. The motion is symmetric: it takes as long to rise as to fall, and it comes back down at the same speed it left with. At the very top v = 0, but the acceleration is still −g: gravity never switches off. Setting v = 0 in the equations gives the time to the top and the maximum height.")}
      </p>
      <Equation label={tx(t, "phKin1_eqTop", "Time to the top and maximum height")}
        where={[
          [r`t_{\text{top}}`, tx(t, "phKin1_wTtop", "time from launch to the highest point (s)")],
          [r`h_{\max}`, tx(t, "phKin1_wHmax", "height gained above the launch point (m)")],
        ]}
        note={tx(t, "phKin1_topNote", "From v = v₀ − g t = 0 and v² = v₀² − 2g h = 0. Doubling the launch speed doubles the time but quadruples the height.")}>
        {r`t_{\text{top}} = \frac{v_0}{g} \qquad h_{\max} = \frac{v_0^2}{2g}`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "phKin1_airTip", "Real objects in air reach a terminal velocity, where air resistance balances gravity: about 55 m/s for a skydiver lying flat, about 9 m/s for a raindrop. Our equations hold while the speed is well below that. The forces chapter explains why.")}
      </Callout>

      <H2>{tx(t, "phKin1_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phKin1_ex1", "1. A car goes from 0 to 100 km/h in 8 s. 100 km/h = 27.8 m/s, so a = 27.8 / 8 = 3.5 m/s². In those 8 s it covers ½ × 3.5 × 8² = 111 m (or average speed 13.9 m/s × 8 s, the same).")}</p>
      <p>{tx(t, "phKin1_ex2", "2. A stone is dropped from a 20 m bridge (v₀ = 0). From 20 = ½ g t²: t = √(2 × 20 / 9.81) = 2.02 s. It hits the water at v = g t = 19.8 m/s (71 km/h).")}</p>
      <p>{tx(t, "phKin1_ex3", "3. A ball is thrown up at 15 m/s. Top after 15 / 9.81 = 1.53 s, at 15² / (2 × 9.81) = 11.5 m above the hand. Back in the hand after 3.06 s, moving down at 15 m/s.")}</p>
      <H3>{tx(t, "phKin1_ex4Title", "Reading a graph")}</H3>
      <p>{tx(t, "phKin1_ex4", "4. A v(t) graph rises in a straight line from 0 to 10 m/s over 4 s, then stays at 10 m/s for 6 s. Acceleration in the first part: slope 10/4 = 2.5 m/s². Displacement: triangle ½ × 4 × 10 = 20 m plus rectangle 6 × 10 = 60 m, 80 m in total.")}</p>

      <H2>{tx(t, "phKin1_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phKin1_tWrong", "Wrong"), tx(t, "phKin1_tRight", "Right"), tx(t, "phKin1_tWhy", "Why")]}
        rows={[
          [tx(t, "phKin1_m1w", "x = v t when the speed changes"), tx(t, "phKin1_m1r", "x = x₀ + v₀ t + ½ a t²"), tx(t, "phKin1_m1", "v t only works at constant speed")],
          [tx(t, "phKin1_m2w", "negative a means slowing down"), tx(t, "phKin1_m2r", "compare the signs of a and v"), tx(t, "phKin1_m2", "a falling stone has a < 0 and speeds up")],
          [tx(t, "phKin1_m3w", "a = 0 at the top of a throw"), tx(t, "phKin1_m3r", "v = 0, a = −g"), tx(t, "phKin1_m3", "gravity acts all the time")],
          [tx(t, "phKin1_m4w", "average velocity = (v₀ + v)/2 always"), tx(t, "phKin1_m4r", "only for constant acceleration"), tx(t, "phKin1_m4", "in general it is Δx/Δt")],
          [tx(t, "phKin1_m5w", "heavier objects fall faster"), tx(t, "phKin1_m5r", "same g for all, without air"), tx(t, "phKin1_m5", "air resistance causes the difference")],
        ]}
      />

      <KeyIdeas t={t} id="phKin1" items={[
        "Displacement Δx = x_f − x_i has a sign; distance counts every metre and never decreases.",
        "Velocity is the slope of x(t); acceleration is the slope of v(t).",
        "The area under v(t) is the displacement; the area under a(t) is the change in velocity.",
        "Speeding up or slowing down depends on whether a and v have the same sign.",
        "Constant acceleration: v = v₀ + a t, x = x₀ + v₀ t + ½ a t², v² = v₀² + 2a Δx.",
        "Braking distance grows with the square of the speed.",
        "Free fall is constant acceleration g = 9.81 m/s² downward, the same for every mass when air is negligible.",
      ]} />
    </Article>
  );
}
