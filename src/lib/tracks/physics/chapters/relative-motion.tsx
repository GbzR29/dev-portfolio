"use client";

// Foundations 4: relative motion — frames of reference; relative position and
// the subscript rule; adding velocities (1D and as vectors); crossing a river
// (fastest vs straight across); flying in a wind; rain on a moving car; the
// Galilean transformation; inertial frames agree on acceleration (Galileo's
// ship), accelerating frames do not; where all this fails: light, and
// relativity.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { RelativeMotionFigure } from "@/components/lesson/figures/physics/RelativeMotionFigure";

const r = String.raw;
const num = (v: number, d = 1) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Heading and ground speed for a plane that must fly due north in a crosswind. */
const windNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const { air, wind } = v;
  if (wind >= air) return { tex: r`\red{\text{${tx(t, "phRel_liveNo", "the wind is as fast as the plane: it cannot hold the course")}}}` };
  const ang = (Math.asin(wind / air) * 180) / Math.PI, ground = Math.sqrt(air * air - wind * wind);
  return {
    tex: r`\sin\alpha = \frac{${num(wind, 0)}}{${num(air, 0)}} \;\Rightarrow\; \alpha = \amber{${num(ang)}^\circ} \qquad v_{\text{${tx(t, "phRel_liveGround", "ground")}}} = \sqrt{${num(air, 0)}^2 - ${num(wind, 0)}^2} = \green{${num(ground, 0)}\ \text{km/h}}`,
    meter: ground / air, meterLabel: `${num((ground / air) * 100, 0)} %`,
  };
};

export function RelativeMotionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phRel_intro",
          "You sit still in a train doing 300 km/h. Are you moving? To the person next to you, no. To someone on the platform, very fast. To an astronaut watching the Earth spin and orbit, even faster. All three are right. Position and velocity only mean something relative to a chosen reference, and this chapter shows how to translate a motion from one reference to another. It is also the door to Newton's laws and, much later, to Einstein's relativity.")}
      </Lead>

      <Goals t={t} id="phRel" items={[
        "Say what a frame of reference is, and read the subscript notation v_AB.",
        "Add relative velocities, in a line and as vectors.",
        "Solve river-crossing and crosswind problems.",
        "Explain why all inertial frames agree on accelerations, and where that stops being true.",
      ]} />

      <H2>{tx(t, "phRel_frameTitle", "Frames of reference")}</H2>
      <p>
        {tx(t, "phRel_frameBody",
          "A frame of reference is a point of view you can do measurements from: an origin, a set of axes and a clock, all attached to some object. The platform is one frame, the train another, the river water a third. Every position, velocity and path in the last three chapters was measured in some frame, usually the ground, without saying so. Change the frame and those numbers change. A ball dropped in a train falls straight down for the passenger but traces a parabola for someone on the platform, as the figure below shows.")}
      </p>

      <H2>{tx(t, "phRel_posTitle", "Relative position and the subscript rule")}</H2>
      <p>
        {tx(t, "phRel_posBody",
          "Write r_AB for \"the position of A relative to B\": the arrow from B to A. If you know where A is relative to B, and where B is relative to C, then A relative to C is the two arrows end to end. The inner letters match and cancel, like a chain: A to B, then B to C, gives A to C. Reversing the order reverses the arrow: r_BA = −r_AB.")}
      </p>
      <Equation label={tx(t, "phRel_eqPos", "Positions chain together")}
        where={[
          [r`\vec r_{AB}`, tx(t, "phRel_wRab", "position of A relative to B: the arrow from B to A")],
          [r`\vec r_{BC}`, tx(t, "phRel_wRbc", "position of B relative to C")],
          [r`\vec r_{AC}`, tx(t, "phRel_wRac", "position of A relative to C")],
        ]}
        words={tx(t, "phRel_posWords", "Where A is seen from C equals where A is seen from B, plus where B is seen from C.")}>
        {r`\vec r_{AC} = \vec r_{AB} + \vec r_{BC} \qquad \vec r_{BA} = -\vec r_{AB}`}
      </Equation>

      <H2>{tx(t, "phRel_velTitle", "Adding velocities")}</H2>
      <p>
        {tx(t, "phRel_velBody",
          "Velocity is how fast position changes, so the same chain holds for velocities. Take the rate of change of every term of the position rule:")}
      </p>
      <Derivation t={t} label={tx(t, "phRel_eqVelDer", "From positions to velocities")}
        steps={[
          { tex: r`\vec r_{AC} = \vec r_{AB} + \vec r_{BC}`, why: tx(t, "phRel_d1", "the position chain, true at every instant") },
          { tex: r`\frac{d\vec r_{AC}}{dt} = \frac{d\vec r_{AB}}{dt} + \frac{d\vec r_{BC}}{dt}`, why: tx(t, "phRel_d2", "the rate of change of a sum is the sum of the rates") },
          { tex: r`\green{\vec v_{AC} = \vec v_{AB} + \vec v_{BC}}`, why: tx(t, "phRel_d3", "each rate of change of a position is a velocity") },
        ]} />
      <p>
        {tx(t, "phRel_1dBody",
          "In a straight line the arrows are signed numbers. A passenger walks forward at 1.5 m/s in a train moving at 30 m/s: relative to the ground, 31.5 m/s. Walking backward: 30 − 1.5 = 28.5 m/s. Two cars approach head-on, each at 25 m/s relative to the road: relative to one driver, the other comes at 25 + 25 = 50 m/s, which is why head-on crashes are so violent. Overtaking a lorry at 25 m/s while you do 28 m/s, you gain only 3 m/s on it, which is why overtaking takes so long.")}
      </p>
      <LessonTable
        headers={[tx(t, "phRel_tCase", "Situation"), tx(t, "phRel_tLink1", "first link"), tx(t, "phRel_tLink2", "second link"), tx(t, "phRel_tResult", "result")]}
        rows={[
          [tx(t, "phRel_c1", "walker W relative to the ground G, in train T"), "v_WT = +1.5", "v_TG = +30", "v_WG = +31.5 m/s"],
          [tx(t, "phRel_c2", "walking backward in the same train"), "v_WT = −1.5", "v_TG = +30", "v_WG = +28.5 m/s"],
          [tx(t, "phRel_c3", "car A seen from car B, head-on (A at +25, B at −25 on the road R)"), "v_AR = +25", "v_RB = −v_BR = +25", "v_AB = +50 m/s"],
          [tx(t, "phRel_c4", "your car C overtaking a lorry L"), "v_CR = +28", "v_RL = −25", "v_CL = +3 m/s"],
        ]}
      />

      <H2>{tx(t, "phRel_riverTitle", "Crossing a river")}</H2>
      <p>
        {tx(t, "phRel_riverBody",
          "A boat's engine drives it through the water with velocity v_BW (boat relative to water), in whatever direction it points. The water flows relative to the shore with velocity u = v_WS. What the people on the shore see is the sum, v_BS = v_BW + u. The two vectors are at an angle, so they add tip to tail as in the projectiles chapter: split each into an across part and an along-the-river part.")}
      </p>
      <Equation label={tx(t, "phRel_eqRiver", "A boat crossing a river of width d")}
        where={[
          [r`v_b`, tx(t, "phRel_wVb", "the boat's speed relative to the water (m/s)")],
          [r`\varphi`, tx(t, "phRel_wPhi", "the heading: the angle between where the boat points and straight across; positive downstream")],
          [r`u`, tx(t, "phRel_wU", "the speed of the current relative to the shore (m/s)")],
          [r`d`, tx(t, "phRel_wD", "the width of the river (m)")],
        ]}
        note={tx(t, "phRel_riverNote", "Only the across part of the velocity brings the boat closer to the far bank, so only it sets the crossing time. The current never helps or hinders the crossing; it only carries the boat sideways.")}>
        {r`\underbrace{v_b\cos\varphi}_{\text{across}} \qquad \underbrace{u + v_b\sin\varphi}_{\text{along}} \qquad t = \frac{d}{v_b\cos\varphi} \qquad \text{drift} = (u + v_b\sin\varphi)\, t`}
      </Equation>
      <p>
        {tx(t, "phRel_riverBody2",
          "Two strategies follow. To cross as fast as possible, point straight across (φ = 0): all of the engine goes into the across part, t = d / v_b, and the current carries you u·t downstream. To land right opposite the start, point upstream at the angle where the upstream part of your velocity cancels the current exactly, v_b sin φ = −u. The crossing then takes longer, d / √(v_b² − u²), and is only possible if the boat is faster than the current.")}
      </p>
      <RelativeMotionFigure t={t} />
      <Derivation t={t} label={tx(t, "phRel_eqOpp", "Landing right opposite")}
        steps={[
          { tex: r`u + v_b\sin\varphi = 0`, why: tx(t, "phRel_o1", "no motion along the river, as seen from the shore") },
          { tex: r`\sin\varphi = -\frac{u}{v_b}`, why: tx(t, "phRel_o2", "the minus sign: the boat points upstream; it needs u < v_b, since a sine cannot exceed 1") },
          { tex: r`v_b\cos\varphi = v_b\sqrt{1 - \sin^2\varphi} = \sqrt{v_b^2 - u^2}`, why: tx(t, "phRel_o3", "the across speed, from sin² + cos² = 1") },
          { tex: r`t = \green{\frac{d}{\sqrt{v_b^2 - u^2}}}`, why: tx(t, "phRel_o4", "width over across speed: always longer than d / v_b") },
        ]} />

      <H3>{tx(t, "phRel_windTitle", "Flying in a wind")}</H3>
      <p>
        {tx(t, "phRel_windBody",
          "Pilots face the same problem in the air. The airspeed is the plane's speed relative to the air; the wind is the air's velocity relative to the ground. To fly due north in a wind blowing from the west, the pilot points the nose a little into the wind, by an angle α with sin α = wind / airspeed. The plane then flies slightly sideways relative to its own nose, a \"crab\", and its ground speed is less than its airspeed.")}
      </p>
      <LiveFormula label={tx(t, "phRel_liveWind", "Try it: holding a course due north")}
        tex={r`\sin\alpha = \frac{v_{\text{wind}}}{v_{\text{air}}} \qquad v_{\text{ground}} = \sqrt{v_{\text{air}}^2 - v_{\text{wind}}^2}`}
        vars={[
          { id: "air", label: tx(t, "phRel_liveAir", "airspeed (km/h)"), min: 100, max: 900, step: 10, value: 250, fmt: v => num(v, 0) },
          { id: "wind", label: tx(t, "phRel_liveWindV", "crosswind (km/h)"), min: 0, max: 200, step: 5, value: 50, fmt: v => num(v, 0) },
        ]}
        compute={windNumbers(t)}
        note={tx(t, "phRel_liveWindNote", "A small plane at 250 km/h in a 50 km/h crosswind points 11.5° into the wind and makes 245 km/h over the ground. An airliner at 850 km/h barely notices the same wind: 3.4°.")} />

      <H3>{tx(t, "phRel_rainTitle", "Rain on a moving car")}</H3>
      <p>
        {tx(t, "phRel_rainBody",
          "Rain falls straight down at about 8 m/s. Drive at 20 m/s and, relative to the car, the rain has a horizontal velocity of −20 m/s as well: the car's velocity, reversed. So it seems to come at you slanted, at an angle θ from the vertical with tan θ = 20/8, θ ≈ 68°. That is why the windscreen gets soaked while the rear window stays almost dry, and why running in the rain does not keep you drier per second, only for fewer seconds.")}
      </p>

      <H2>{tx(t, "phRel_galTitle", "The Galilean transformation")}</H2>
      <p>
        {tx(t, "phRel_galBody",
          "Put the velocity rule into one formula. Frame S′ (say, the train) moves at constant velocity V along x relative to frame S (the platform), and their origins coincide at t = 0. An event at position x and time t in S is at x′ = x − V t in S′. Both frames read the same clock time. Taking rates of change gives velocities and accelerations.")}
      </p>
      <Equation label={tx(t, "phRel_eqGal", "From frame S to frame S′ moving at constant V")}
        where={[
          [r`x,\ t`, tx(t, "phRel_wXt", "position and time of an event, measured in S")],
          [r`x',\ t'`, tx(t, "phRel_wXtp", "the same event measured in S′")],
          [r`V`, tx(t, "phRel_wVf", "the constant velocity of S′ relative to S")],
        ]}
        words={tx(t, "phRel_galWords", "Positions shift by how far the moving frame has travelled; velocities shift by the frame's velocity; accelerations do not change at all.")}>
        {r`x' = x - V t \qquad t' = t \qquad v' = v - V \qquad a' = a`}
      </Equation>
      <p>
        {tx(t, "phRel_inertBody",
          "The last equation is the important one. Because V is constant, it has no rate of change, so every frame moving steadily relative to another measures the same accelerations. Galileo described it in 1632: shut yourself below deck in a ship sailing smoothly, and no experiment with butterflies, dripping water or a thrown ball tells you whether the ship moves. Frames in which a free object keeps its velocity are called inertial frames, and the next chapter's laws of motion hold in exactly these frames.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phRel_accTip", "A braking bus is not an inertial frame. A ball on the floor rolls forward although nothing pushes it, because the floor slows down under it. To keep Newton's laws working inside such a frame you must invent \"fictitious\" forces, like the forward push you feel when the bus brakes. They appear in the circular-motion chapter (the centrifugal force) and the general-relativity chapter (gravity itself).")}
      </Callout>

      <H2>{tx(t, "phRel_lightTitle", "Where this breaks: light")}</H2>
      <p>
        {tx(t, "phRel_lightBody",
          "The rule v′ = v − V is so natural that it was taken for granted for 250 years. Then experiments around 1900 showed that light does not obey it: light from a source moving towards you, or away, always arrives at the same speed c = 299 792 458 m/s, in every frame. Einstein took that fact seriously in 1905, and the cost was the assumption t′ = t: moving clocks tick slowly and moving rulers shrink. At everyday speeds the corrections are far too small to notice (at 300 km/h, about one part in 10¹³), so the Galilean rules are excellent for everything until the relativity section.")}
      </p>

      <H2>{tx(t, "phRel_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phRel_ex1", "1. A swimmer at 1.2 m/s crosses a 40 m river with a 0.9 m/s current. Straight across: 40 / 1.2 = 33 s, landing 0.9 × 33 = 30 m downstream. To land opposite: sin φ = 0.9 / 1.2 = 0.75, φ = 49° upstream, across speed √(1.2² − 0.9²) = 0.79 m/s, time 40 / 0.79 = 50 s.")}</p>
      <p>{tx(t, "phRel_ex2", "2. A moving walkway runs at 0.8 m/s. A traveller walks on it at 1.4 m/s relative to the walkway. Relative to the floor: 2.2 m/s. Walking the wrong way: 1.4 − 0.8 = 0.6 m/s, still making progress, but slowly.")}</p>
      <p>{tx(t, "phRel_ex3", "3. Train A runs east at 30 m/s, train B west at 20 m/s on the next track. B relative to A: v_BA = v_BG − v_AG = (−20) − (+30) = −50 m/s, so a passenger in A sees B rush west at 50 m/s.")}</p>
      <H3>{tx(t, "phRel_ex4Title", "A slower boat")}</H3>
      <p>{tx(t, "phRel_ex4", "4. A boat at 2 m/s in a 3 m/s current cannot land opposite (it would need sin φ = 1.5). Its shortest-drift heading points upstream at sin φ = −v_b/u = −2/3 (42° up from straight across): the drift is then the smallest possible, but it is never zero.")}</p>

      <H2>{tx(t, "phRel_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phRel_tWrong", "Wrong"), tx(t, "phRel_tRight", "Right"), tx(t, "phRel_tWhy", "Why")]}
        rows={[
          [tx(t, "phRel_m1w", "a velocity without saying relative to what"), tx(t, "phRel_m1r", "name the frame: v of A relative to B"), tx(t, "phRel_m1", "the number changes with the frame")],
          [tx(t, "phRel_m2w", "v_AB = v_BA"), tx(t, "phRel_m2r", "v_AB = −v_BA"), tx(t, "phRel_m2", "reversing the view reverses the arrow")],
          [tx(t, "phRel_m3w", "adding speeds at an angle as numbers"), tx(t, "phRel_m3r", "add the vectors, by components"), tx(t, "phRel_m3", "3 + 4 m/s at 90° is 5 m/s, not 7")],
          [tx(t, "phRel_m4w", "a current slows the crossing"), tx(t, "phRel_m4r", "only the across speed sets the time"), tx(t, "phRel_m4", "the current is along the river")],
          [tx(t, "phRel_m5w", "different frames see different accelerations"), tx(t, "phRel_m5r", "inertial frames all agree on a"), tx(t, "phRel_m5", "a constant V has no rate of change")],
        ]}
      />

      <KeyIdeas t={t} id="phRel" items={[
        "Positions and velocities are always relative to a frame of reference.",
        "Subscripts chain: r_AC = r_AB + r_BC and v_AC = v_AB + v_BC; reversing gives v_BA = −v_AB.",
        "At an angle, relative velocities add as vectors, by components.",
        "A river's current never changes the crossing time, only the drift; landing opposite needs the boat faster than the current.",
        "Galilean transformation: x′ = x − V t, v′ = v − V, a′ = a.",
        "All inertial frames agree on accelerations, so the laws of motion are the same in each.",
        "Light breaks v′ = v − V; fixing that is special relativity.",
      ]} />
    </Article>
  );
}
