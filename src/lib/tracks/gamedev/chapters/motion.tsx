"use client";

// "Motion & Game Feel": lerp, remap, easing curves, tweens, frame-rate
// independent smoothing, damped springs and trauma-based screen shake.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "../../opengl/chapters/lighting-advanced";
import { EasingFigure } from "@/components/lesson/figures/gamedev/EasingFigure";
import { SmoothingFigure } from "@/components/lesson/figures/gamedev/SmoothingFigure";
import { SpringFigure } from "@/components/lesson/figures/gamedev/SpringFigure";
import { ShakeFigure } from "@/components/lesson/figures/gamedev/ShakeFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Lerp, Easing & Tweening
// ═════════════════════════════════════════════════════════════════════════════

export function EasingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdEase_intro",
          "When a menu slides in, a coin flies to the score counter or the camera glides to a new target, the difference between \"works\" and \"feels good\" is almost never the destination. It is the pacing: how the motion starts, how it stops. This chapter builds that pacing from one tiny function, linear interpolation, and a family of curves that reshape its input.")}
      </Lead>

      <H2>{tx(t, "gdEase_lerpTitle", "Linear interpolation")}</H2>
      <p>
        {tx(t, "gdEase_lerpBody",
          "Linear interpolation, lerp for short, answers the question \"what is t of the way from a to b?\". With t = 0 you are at a, with t = 1 at b, with t = 0.5 exactly halfway. It works on anything you can add and scale: numbers, positions, colours, volumes.")}
      </p>
      <Equation label={tx(t, "gdEase_eqLerp", "Linear interpolation")}
        where={[
          [r`a,\ b`, tx(t, "gdEase_wAB", "the start and end values")],
          [r`t`, tx(t, "gdEase_wT", "the interpolation parameter. In [0, 1] the result lies between a and b; outside it, lerp extrapolates along the same line (t = 2 is as far past b as b is from a)")],
          [r`b - a`, tx(t, "gdEase_wBA", "the full change from start to end; t says how much of it to apply")],
        ]}
        note={tx(t, "gdEase_eqLerpNote", "The two forms are equal algebraically but not in floating point. a + (b − a)t is one multiply and can miss b slightly at t = 1 when a and b differ a lot in size; (1 − t)a + tb returns exactly b at t = 1. C++20 has std::lerp, which guarantees exact endpoints.")}>
        {r`\operatorname{lerp}(a, b, t) = a + (b - a)\,t = (1 - t)\,a + t\,b`}
      </Equation>
      <p>
        {tx(t, "gdEase_invBody",
          "Running it backwards is just as useful. Inverse lerp takes a value v and tells you how far along [a, b] it is. Chaining the two gives remap, which converts a value from one range to another: a health of 35 out of 0–100 to a bar width of 0–240 pixels, a speed of 3–12 m/s to an engine pitch of 0.8–1.6, a distance to a fog amount.")}
      </p>
      <Equation label={tx(t, "gdEase_eqRemap", "Inverse lerp and remap")}
        where={[
          [r`v`, tx(t, "gdEase_wV", "the input value")],
          [r`[a, b]`, tx(t, "gdEase_wIn", "the input range")],
          [r`[c, d]`, tx(t, "gdEase_wOut", "the output range")],
        ]}
        note={tx(t, "gdEase_eqRemapNote", "If a = b the division is by zero: guard it. Clamp t to [0, 1] when the output must stay inside [c, d].")}>
        {r`t = \operatorname{invlerp}(a, b, v) = \frac{v - a}{b - a} \qquad \operatorname{remap}(v) = \operatorname{lerp}\big(c,\ d,\ \operatorname{invlerp}(a, b, v)\big)`}
      </Equation>
      <CodeBlock lang="cpp" filename="lerp.hpp" t={t}>{`constexpr float lerp(float a, float b, float t)    { return a + (b - a) * t; }
constexpr float invLerp(float a, float b, float v) { return (v - a) / (b - a); }
constexpr float remap(float a, float b, float c, float d, float v) {
    return lerp(c, d, invLerp(a, b, v));
}

// Health bar: 35 HP of 100 → 84 px of 240
float width = remap(0.f, 100.f, 0.f, 240.f, 35.f);`}</CodeBlock>

      <H2>{tx(t, "gdEase_easeTitle", "Easing: reshaping time")}</H2>
      <p>
        {tx(t, "gdEase_easeBody",
          "Animate t from 0 to 1 over one second and feed it to lerp, and the object moves at constant speed, starting and stopping instantly. Nothing in the physical world does that: things accelerate and brake. An easing function sits between the clock and the lerp. It takes the linear progress t and returns a reshaped progress, with the one rule that it still starts at 0 and ends at 1. The motion covers the same distance in the same time; only the speed along the way changes.")}
      </p>
      <Equation label={tx(t, "gdEase_eqEase", "An eased animation")}
        where={[
          [r`\tau`, tx(t, "gdEase_wTau", "time since the animation started, in seconds")],
          [r`D`, tx(t, "gdEase_wD", "the animation's duration")],
          [r`t = \tau / D`, tx(t, "gdEase_wLin", "linear progress, clamped to [0, 1]")],
          [r`f`, tx(t, "gdEase_wF", "the easing function, with f(0) = 0 and f(1) = 1. Its slope f′(t) is the speed of the motion relative to linear: f′ = 2 means twice as fast as the linear version at that moment")],
        ]}>
        {r`x(\tau) = \operatorname{lerp}\big(a,\ b,\ f(\tau / D)\big)`}
      </Equation>

      <EasingFigure t={t} />

      <H3>{tx(t, "gdEase_familiesTitle", "In, out and in-out from one curve")}</H3>
      <p>
        {tx(t, "gdEase_familiesBody",
          "The simplest easings are powers: t² (quad), t³ (cubic), t⁴ (quart). They start with zero slope, so the motion begins gently and speeds up: an \"ease-in\". Every other variant can be built from the ease-in curve. Ease-out is the same curve rotated half a turn: run time backwards (1 − t), apply the curve, and flip the result (1 − …). Ease-in-out plays ease-in on the first half of the time and ease-out on the second, each squeezed into half the time and half the distance so they meet at (0.5, 0.5).")}
      </p>
      <Equation label={tx(t, "gdEase_eqVariants", "Deriving the variants")}
        where={[
          [r`f_{\text{in}}`, tx(t, "gdEase_wIn2", "any ease-in curve, for example t³")],
          [r`1 - t`, tx(t, "gdEase_wRev", "time run backwards: 1 at the start, 0 at the end")],
          [r`2t,\ 2 - 2t`, tx(t, "gdEase_wHalf", "each half of the time stretched back to [0, 1] so the whole curve can be reused; the /2 then shrinks its height to half")],
        ]}
        note={tx(t, "gdEase_eqVarNote", "Example: cubic ease-out is 1 − (1 − t)³. At t = 0 its slope is 3: it starts three times faster than linear and then brakes to a stop, which is why it feels \"responsive\". That makes ease-out the right default for things that react to the player, such as a menu opening. Ease-in is right for things leaving (they accelerate away), in-out for things moving between two resting positions.")}>
        {r`f_{\text{out}}(t) = 1 - f_{\text{in}}(1 - t) \qquad f_{\text{inOut}}(t) = \begin{cases} \tfrac12 f_{\text{in}}(2t) & t < \tfrac12 \\[2pt] 1 - \tfrac12 f_{\text{in}}(2 - 2t) & t \ge \tfrac12 \end{cases}`}
      </Equation>
      <p>
        {tx(t, "gdEase_smoothBody",
          "One in-out curve deserves its own name because every shader language has it built in: smoothstep, 3t² − 2t³. Its slope 6t − 6t² is zero at both ends, so a motion made of several smoothstep segments never has a jolt where they join. The quintic 6t⁵ − 15t⁴ + 10t³ also has zero curvature at the ends and appears again in the Perlin noise chapter.")}
      </p>
      <H3>{tx(t, "gdEase_backTitle", "Overshoot: back and elastic")}</H3>
      <p>
        {tx(t, "gdEase_backBody",
          "Some curves deliberately leave the 0–1 band. \"back\" ease-in pulls back before leaving, like winding up a throw, and back ease-out overshoots the target and settles into it, which gives buttons and pop-ups a satisfying snap. elastic adds a decaying oscillation, like a plucked ruler. Robert Penner published most of these curves in 2001 and nearly every tweening library still uses his formulas.")}
      </p>
      <Equation label={tx(t, "gdEase_eqBack", "Back ease-in (Penner)")}
        where={[
          [r`c_1 = 1.70158`, tx(t, "gdEase_wC1", "the overshoot constant. This odd-looking value is chosen so that the curve dips 10% below 0 (and, for ease-out, overshoots 10% above 1). A larger c₁ gives more overshoot")],
          [r`c_3 = c_1 + 1`, tx(t, "gdEase_wC3", "makes f(1) = c₃ − c₁ = 1, so the curve still ends at the target")],
        ]}
        note={tx(t, "gdEase_eqBackNote", "It is a cubic whose t² term is negative: for small t the −c₁t² part wins and the value goes below zero, then the c₃t³ part takes over and pulls it up to 1.")}>
        {r`f(t) = c_3\,t^3 - c_1\,t^2`}
      </Equation>

      <H2>{tx(t, "gdEase_tweenTitle", "Tweens")}</H2>
      <p>
        {tx(t, "gdEase_tweenBody",
          "A tween (from \"in-between\", the frames animators draw between key poses) packages everything above into an object: what to animate, from where, to where, for how long, with which easing. The game creates one and forgets about it; a tween manager updates all active tweens every frame and removes the finished ones. Libraries such as DOTween (Unity), GSAP (web) and Godot's Tween add delays, sequences, loops and callbacks on top, but the core is this small.")}
      </p>
      <CodeBlock lang="cpp" filename="tween.hpp" t={t}>{`struct Tween {
    float* target;                // the value being animated
    float  from, to;
    float  duration, elapsed = 0.f;
    float  (*ease)(float);        // e.g. easeOutCubic
    std::function<void()> onDone; // optional callback

    bool update(float dt) {       // returns false once finished
        elapsed += dt;
        float t = std::min(elapsed / duration, 1.f);
        *target = from + (to - from) * ease(t);
        if (t >= 1.f) { if (onDone) onDone(); return false; }
        return true;
    }
};

float easeOutCubic(float t) { float u = 1.f - t; return 1.f - u * u * u; }

// Tween manager: update all, erase the finished ones
std::erase_if(tweens, [dt](Tween& tw) { return !tw.update(dt); });`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "gdEase_tweenWarn", "Storing a raw pointer to the animated value is fine for a sketch but dangerous in a real game: if the object is destroyed while the tween runs, the tween writes into freed memory. Real tween systems either own the value, hold a handle that can be checked (see the Object Pool chapter), or are cancelled when their owner is destroyed.")}
      </Callout>

      <H2>{tx(t, "gdEase_followTitle", "Following a moving target")}</H2>
      <p>
        {tx(t, "gdEase_followBody",
          "Tweens need a fixed destination and duration. A camera following a player has neither: the target moves every frame. The classic line of code for this is x = lerp(x, target, 0.1): every frame, cover 10% of the remaining distance. It produces a pleasant motion that is fast when far away and gentle when close. It also has a bug. The 10% is per frame, so at 144 FPS the camera takes a 10% bite 144 times per second, and at 30 FPS only 30 times. The figure shows how different that is.")}
      </p>

      <SmoothingFigure t={t} />

      <p>
        {tx(t, "gdEase_deriveBody",
          "To fix it, look at what the line does over many frames. Each frame leaves (1 − k) of the remaining distance, so after n frames (1 − k)ⁿ remains. After one second at F frames per second, (1 − k)^F remains, which depends on F. We want the remaining fraction to depend only on elapsed time, like radioactive decay: a fixed fraction left after each second, whatever happens in between. The function with that property is the exponential e^(−λt). One frame of length dt must then leave e^(−λ·dt), so it must cover 1 − e^(−λ·dt).")}
      </p>
      <Equation label={tx(t, "gdEase_eqDamp", "Frame-rate independent smoothing")}
        where={[
          [r`\lambda`, tx(t, "gdEase_wLambda", "the decay rate, in 1/seconds. Larger λ follows more tightly. After 1/λ seconds, e⁻¹ ≈ 37% of the distance remains")],
          [r`\Delta t`, tx(t, "gdEase_wDt", "this frame's duration")],
          [r`e^{-\lambda\,\Delta t}`, tx(t, "gdEase_wKeep", "the fraction of the remaining distance kept this frame. Two frames of dt/2 keep e^(−λdt/2)·e^(−λdt/2) = e^(−λdt), exactly the same as one frame of dt: that is why it does not depend on the frame rate")],
          [r`T_{1/2} = \tfrac{\ln 2}{\lambda}`, tx(t, "gdEase_wHalf2", "the half-life: the time to cover half the remaining distance. Designers find \"halves the gap every 0.1 s\" easier to tune than a rate; then λ = ln 2 / 0.1 ≈ 6.93")],
          [r`\lambda = -F\ln(1 - k)`, tx(t, "gdEase_wConvert", "converts an old per-frame k tuned at F FPS into the equivalent rate, so an existing feel can be kept. k = 0.1 at 60 FPS gives λ ≈ 6.32")],
        ]}>
        {r`x \leftarrow \operatorname{lerp}\!\left(x,\ \text{target},\ 1 - e^{-\lambda\,\Delta t}\right)`}
      </Equation>
      <CodeBlock lang="cpp" filename="damp.hpp" t={t}>{`// Moves 'current' toward 'target', halving the gap every 'halfLife' seconds,
// at any frame rate. (Freya Holmér's talk "Lerp smoothing is broken" covers
// this derivation in depth.)
float damp(float current, float target, float halfLife, float dt) {
    return target + (current - target) * std::exp2(-dt / halfLife);
}

cam.x = damp(cam.x, player.x, 0.08f, dt);    // tight follow
cam.zoom = damp(cam.zoom, wantedZoom, 0.4f, dt); // lazy zoom`}</CodeBlock>
      <p>
        {tx(t, "gdEase_dampWhy",
          "exp2(−dt/halfLife) is the same number as e^(−λ·dt) with λ = ln 2 / halfLife, written with base 2 so the parameter is the half-life directly. The function returns target + (current − target) × kept, which is the lerp above rearranged.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "gdEase_dampLimit", "Exponential smoothing always lags behind a target that keeps moving, and it can never overshoot, because it has no memory of its own velocity. When you want a follower that carries momentum, catches up with a moving target, or wobbles, you need a spring: next chapter.")}
      </Callout>

      <H2>{tx(t, "gdEase_pitTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "gdEase_tSym", "Symptom"), tx(t, "gdEase_tCause", "Cause"), tx(t, "gdEase_tFix", "Fix")]}
        rows={[
          [tx(t, "gdEase_b1", "Camera floatier on slow PCs"), tx(t, "gdEase_c1", "lerp(x, target, k) with a per-frame k"), tx(t, "gdEase_f1", "use 1 − e^(−λ·dt) or the half-life damp()")],
          [tx(t, "gdEase_b2", "Animation never quite arrives"), tx(t, "gdEase_c2", "exponential smoothing only approaches the target"), tx(t, "gdEase_f2", "snap when |target − x| is below a threshold, or use a tween with a duration")],
          [tx(t, "gdEase_b3", "Tween ends one frame early or late"), tx(t, "gdEase_c3", "t not clamped, or the last frame skipped when elapsed passes the duration"), tx(t, "gdEase_f3", "clamp t to 1 and always write the final value")],
          [tx(t, "gdEase_b4", "Eased rotation spins the long way round"), tx(t, "gdEase_c4", "lerping angles 350° → 10° goes through 180°"), tx(t, "gdEase_f4", "lerp the shortest signed difference (wrap it into −180…180), or slerp quaternions")],
          [tx(t, "gdEase_b5", "Colour fades look muddy in the middle"), tx(t, "gdEase_c5", "lerping sRGB values"), tx(t, "gdEase_f5", "lerp in linear space (or OKLab) and convert back")],
        ]}
      />

      <KeyIdeas t={t} id="gdEase" items={[
        "lerp(a, b, t) = a + (b − a)t; inverse lerp finds t; remap chains them to convert ranges.",
        "An easing f reshapes progress with f(0) = 0, f(1) = 1; its slope is the relative speed.",
        "ease-out = 1 − in(1 − t); ease-in-out = the two halves squeezed together.",
        "Ease-out for things arriving, ease-in for things leaving, in-out between two rests.",
        "lerp(x, target, k) per frame depends on FPS; use 1 − e^(−λ·dt) (or a half-life).",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Springs, Damping & Screen Shake
// ═════════════════════════════════════════════════════════════════════════════

export function SpringsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdSpring_intro",
          "A spring is the most useful piece of physics in game feel. A camera on a spring lags a little behind a sprinting player and then catches up; a UI panel on a spring overshoots and settles; a weapon on a spring sways after the player turns. This chapter derives the damped spring, rewrites it with two parameters a designer can reason about, and ends with the other half of \"juice\": screen shake.")}
      </Lead>

      <H2>{tx(t, "gdSpring_hookeTitle", "Hooke's law plus damping")}</H2>
      <p>
        {tx(t, "gdSpring_hookeBody",
          "A spring pulls its end back toward a rest position with a force proportional to how far it is stretched (Robert Hooke, 1676). On its own that would oscillate forever, so we add damping: a force that opposes velocity, like air resistance or a shock absorber. Newton's second law, force = mass × acceleration, turns the forces into an acceleration.")}
      </p>
      <Equation label={tx(t, "gdSpring_eqForce", "Damped spring")}
        where={[
          [r`x`, tx(t, "gdSpring_wX", "the current position of the object (it could be a camera coordinate, a scale, an angle…)")],
          [r`x_t`, tx(t, "gdSpring_wXt", "the target: where the spring is at rest")],
          [r`k`, tx(t, "gdSpring_wK", "the stiffness: how hard the spring pulls per unit of stretch")],
          [r`c`, tx(t, "gdSpring_wC", "the damping coefficient: how hard it resists per unit of velocity")],
          [r`v = \dot x`, tx(t, "gdSpring_wV", "the velocity; the dot means \"rate of change over time\"")],
          [r`m`, tx(t, "gdSpring_wM", "the mass; heavier objects accelerate less for the same force")],
        ]}>
        {r`F = -k\,(x - x_t) - c\,v \qquad a = \ddot x = \frac{F}{m}`}
      </Equation>

      <H2>{tx(t, "gdSpring_paramTitle", "Frequency and damping ratio")}</H2>
      <p>
        {tx(t, "gdSpring_paramBody",
          "k, c and m are awkward to tune: doubling the mass changes both how fast and how bouncy the spring is. Physicists rewrite the equation with two independent parameters. The angular frequency ω = √(k/m) sets the time scale: how fast the spring reacts. The damping ratio ζ = c / (2√(km)) sets the character: whether it bounces. Substituting k = mω² and c = 2mζω into the equation above, the mass cancels out.")}
      </p>
      <Equation label={tx(t, "gdSpring_eqNorm", "The spring a designer can tune")}
        where={[
          [r`\omega = 2\pi f`, tx(t, "gdSpring_wOmega", "angular frequency in radians per second; f is the frequency in Hz, how many oscillations per second the undamped spring would make. 2π converts turns to radians")],
          [r`\zeta`, tx(t, "gdSpring_wZeta", "the damping ratio (zeta). It is dimensionless: the same ζ looks equally bouncy at any speed")],
          [r`-\omega^2 (x - x_t)`, tx(t, "gdSpring_wPull", "the spring pull, stronger the faster the spring is")],
          [r`-2\zeta\omega\,v`, tx(t, "gdSpring_wDamp", "the damping. The factor 2 makes ζ = 1 land exactly on the boundary between bouncing and not bouncing")],
        ]}>
        {r`\ddot x = -\omega^2\,(x - x_t) - 2\zeta\omega\,\dot x`}
      </Equation>
      <LessonTable
        headers={["ζ", tx(t, "gdSpring_tName", "Name"), tx(t, "gdSpring_tBehaviour", "Behaviour"), tx(t, "gdSpring_tUse", "Typical use")]}
        rows={[
          ["0", tx(t, "gdSpring_n0", "undamped"), tx(t, "gdSpring_b0", "oscillates forever"), tx(t, "gdSpring_u0", "idle bobbing, pendulums (with a separate driver)")],
          ["0 < ζ < 1", tx(t, "gdSpring_n1", "under-damped"), tx(t, "gdSpring_b1", "overshoots, rings, settles"), tx(t, "gdSpring_u1", "UI pop-ups (0.4–0.7), jelly, weapon sway")],
          ["1", tx(t, "gdSpring_n2", "critically damped"), tx(t, "gdSpring_b2", "fastest possible approach with no overshoot"), tx(t, "gdSpring_u2", "cameras, aim assist, anything that must not overshoot")],
          ["> 1", tx(t, "gdSpring_n3", "over-damped"), tx(t, "gdSpring_b3", "creeps in slowly, no overshoot"), tx(t, "gdSpring_u3", "heavy doors, sluggish vehicles")],
        ]}
      />

      <SpringFigure t={t} />

      <Equation label={tx(t, "gdSpring_eqOver", "Two numbers worth knowing")}
        where={[
          [r`M_p`, tx(t, "gdSpring_wMp", "the overshoot of an under-damped spring after a jump of the target, as a fraction of the jump. ζ = 0.5 gives 16%, ζ = 0.7 gives 4.6%")],
          [r`t_s`, tx(t, "gdSpring_wTs", "the settling time: after about 4/(ζω) seconds the spring stays within 2% of the target (because e⁻⁴ ≈ 0.018)")],
        ]}
        note={tx(t, "gdSpring_eqOverNote", "Both come from the exact solution of the equation, a cosine wave inside an exponential envelope e^(−ζωt). The envelope's rate ζω decides how fast things calm down, which is why doubling f halves the settling time without changing the overshoot.")}>
        {r`M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}} \qquad t_s \approx \frac{4}{\zeta\,\omega}`}
      </Equation>

      <H2>{tx(t, "gdSpring_intTitle", "Stepping a spring in code")}</H2>
      <p>
        {tx(t, "gdSpring_intBody",
          "In a game we do not need the exact solution; we advance the spring one step at a time, like any other physics. The standard choice is semi-implicit (symplectic) Euler: compute the acceleration, update the velocity with it, then update the position with the new velocity. Swapping the last two lines gives explicit Euler, which adds a little energy every step and makes an undamped spring grow until it explodes.")}
      </p>
      <CodeBlock lang="cpp" filename="spring.hpp" t={t}>{`struct Spring {
    float x = 0, v = 0;         // position and velocity
    float freq = 2.f;           // f in Hz: how fast it reacts
    float zeta = 0.5f;          // damping ratio: 1 = no overshoot

    void step(float target, float h) {
        float w = 2.f * 3.14159265f * freq;
        float a = -w * w * (x - target) - 2.f * zeta * w * v;
        v += a * h;             // velocity first...
        x += v * h;             // ...then position with the NEW velocity
    }
};

// In the fixed update (see the Game Loop chapter):
camX.step(player.x, h);`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "gdSpring_stability", "Even semi-implicit Euler becomes unstable when ω·h > 2: the spring overshoots further every step and blows up. At h = 1/60 s that means f above about 19 Hz. Stiff springs therefore need a fixed small step, several sub-steps per frame, or an exact integrator. Unity's Mathf.SmoothDamp, for example, is a critically damped spring whose step uses a polynomial approximation of the exact solution (from Game Programming Gems 4), so it stays stable with any dt.")}
      </Callout>
      <p>
        {tx(t, "gdSpring_moving",
          "The big difference from exponential smoothing shows with a moving target. A spring builds up velocity while chasing, so it keeps pace with a target that moves at constant speed instead of trailing further and further behind, and it can anticipate the path a little because of its momentum. Its velocity is also available for free, handy for tilting a camera into turns or stretching a sprite in the direction of motion.")}
      </p>

      <H2>{tx(t, "gdSpring_shakeTitle", "Screen shake with trauma")}</H2>
      <p>
        {tx(t, "gdSpring_shakeBody",
          "Screen shake is the cheapest way to make an impact feel heavy, and also the easiest to overdo. The best-known recipe comes from Squirrel Eiserloh's GDC 2016 talk \"Juicing Your Cameras With Math\". Instead of starting a shake with some duration and strength, every hit adds \"trauma\", a number between 0 and 1. Trauma drains away at a steady rate. The camera's offset and rotation are computed each frame from the current trauma.")}
      </p>
      <Equation label={tx(t, "gdSpring_eqShake", "Trauma-based shake")}
        where={[
          [r`\text{trauma}`, tx(t, "gdSpring_wTrauma", "0 = calm, 1 = maximum. A hit adds to it (clamped to 1), so several small hits stack into a big shake")],
          [r`r`, tx(t, "gdSpring_wR", "the recovery rate in trauma per second; 1 means a full shake lasts one second")],
          [r`\text{shake} = \text{trauma}^2`, tx(t, "gdSpring_wSq", "squaring makes the response non-linear: at trauma 0.3 the shake is only 0.09, at 0.9 it is 0.81. Small hits barely move the camera and big ones are dramatic, and the end of a shake fades out quickly instead of lingering. A cube is even more pronounced")],
          [r`N_i(\tau\,f)`, tx(t, "gdSpring_wN", "a smooth noise signal in [−1, 1] (Perlin noise, see the Procedural chapters), sampled at time × frequency, with a different seed i for the x offset, the y offset and the angle")],
          [r`\text{max}`, tx(t, "gdSpring_wMax", "the largest offset (pixels or units) and the largest angle (a few degrees) the camera may move")],
        ]}>
        {r`\text{trauma} \leftarrow \max(0,\ \text{trauma} - r\,\Delta t) \qquad \text{offset}_i = \text{max}_i \cdot \text{trauma}^2 \cdot N_i(\tau f)`}
      </Equation>

      <ShakeFigure t={t} />

      <p>
        {tx(t, "gdSpring_shakeWhy",
          "Why noise and not rand()? A new random offset every frame teleports the camera to an unrelated place each time, which looks like harsh static, and because it changes once per frame, it shakes twice as fast at 120 FPS as at 60. Noise sampled at time × frequency is continuous, so the camera moves along a smooth random path whose speed is a parameter. It also makes the shake reproducible, useful for replays and for pausing.")}
      </p>
      <CodeBlock lang="cpp" filename="shake.cpp" t={t}>{`void CameraShake::addTrauma(float amount) { trauma = std::min(1.f, trauma + amount); }

void CameraShake::update(float dt) {
    time   += dt;
    trauma  = std::max(0.f, trauma - recovery * dt);
    float s = trauma * trauma;                         // non-linear falloff
    offset.x = maxOffset * s * noise1D(time * freq, 1);
    offset.y = maxOffset * s * noise1D(time * freq, 2);
    angle    = maxAngle  * s * noise1D(time * freq, 3);
}

// Apply on top of the real camera, never to the camera's stored position:
view = cameraMatrix * translate(offset) * rotateZ(angle);`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "gdSpring_shakeTips", "Apply shake as a layer on top of the camera's real transform, so the follow logic never sees it. Rotation sells an impact more than translation, but keep it to a few degrees. In 3D, rotating the camera is usually better than moving it, because moving it can push it through walls. And always ship a \"reduce screen shake\" option: it can cause motion sickness.")}
      </Callout>

      <H2>{tx(t, "gdSpring_feelTitle", "The rest of the juice")}</H2>
      <LessonTable
        headers={[tx(t, "gdSpring_tTech", "Technique"), tx(t, "gdSpring_tHow", "How it works")]}
        rows={[
          [tx(t, "gdSpring_j1", "Hit stop (freeze frames)"), tx(t, "gdSpring_j1b", "pause the simulation for 2–6 frames on a strong hit, so the eye registers the contact; fighting games do this on every blow")],
          [tx(t, "gdSpring_j2", "Squash and stretch"), tx(t, "gdSpring_j2b", "scale a sprite along its velocity (stretch) when moving fast and flatten it on landing, keeping its area constant: sx·sy = 1")],
          [tx(t, "gdSpring_j3", "Anticipation"), tx(t, "gdSpring_j3b", "a short move in the opposite direction before the main action, like the back ease-in")],
          [tx(t, "gdSpring_j4", "Secondary motion"), tx(t, "gdSpring_j4b", "hair, capes, antennas and tails follow the body through springs, so the character keeps moving after it stops")],
          [tx(t, "gdSpring_j5", "Coyote time and jump buffering"), tx(t, "gdSpring_j5b", "accept a jump for ~0.1 s after walking off a ledge, and remember a jump pressed ~0.1 s before landing; players feel it as responsiveness, not as a cheat")],
        ]}
      />

      <KeyIdeas t={t} id="gdSpring" items={[
        "Spring: a = −ω²(x − target) − 2ζω·v, with ω = 2πf.",
        "f sets how fast it reacts; ζ sets how bouncy (1 = fastest without overshoot).",
        "Step it with semi-implicit Euler (velocity, then position), at a fixed step, keeping ω·h well below 2.",
        "Springs carry velocity: they keep up with moving targets and can overshoot; smoothing cannot.",
        "Shake: trauma adds up and drains linearly; offset = max × trauma² × smooth noise.",
      ]} />
    </Article>
  );
}
