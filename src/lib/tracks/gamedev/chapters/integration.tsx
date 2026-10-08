"use client";

// Physics 1: numerical integration — the state and its derivatives, explicit
// Euler and why it gains energy, semi-implicit (symplectic) Euler, velocity
// and position Verlet, RK4, implicit Euler, stability limits (ω·h), and which
// one a game should use.

import { Callout, CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { IntegratorFigure } from "@/components/lesson/figures/gamedev/IntegratorFigure";
import { StabilityFigure } from "@/components/lesson/figures/gamedev/StabilityFigure";

const r = String.raw;

export function IntegrationContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdInt_intro",
          "Every physics engine is built on one small loop: given where things are and how fast they move now, work out where they will be a moment later. That step is called integration, and the formula that does it is an integrator. The game-loop chapter already met two of them in a jump, and saw that the height came out wrong by an amount that depended on the step. This chapter looks at integrators properly: why the most obvious one quietly adds energy until springs explode and planets fly away, why a one-line change fixes it, and when a more expensive method is worth it.")}
      </Lead>

      <Goals t={t} id="gdInt" items={[
        "Advance a moving object by one step with an integrator.",
        "Explain why explicit Euler gains energy, and fix it by swapping two lines.",
        "Use Verlet and RK4, and say when each is worth it.",
        "Pick a step size that stays stable.",
      ]} />

      <H2>{tx(t, "gdInt_stateTitle", "State and derivatives")}</H2>
      <p>
        {tx(t, "gdInt_stateBody",
          "A moving point is described by its state: its position x and its velocity v. Physics says how the state changes. The velocity is the rate of change of the position, and the acceleration a, which forces decide through Newton's second law a = F/m, is the rate of change of the velocity. If a were constant, the exact answer would be the school formula x + v·t + ½a·t². But forces change as things move: a spring pulls harder the further it is stretched, gravity is stronger closer to a planet. The motion is then the solution of a differential equation, and games do not solve it exactly; they advance it in small steps of a fixed length h.")}
      </p>
      <Equation label={tx(t, "gdInt_eqOde", "The equations of motion")}
        where={[
          [r`\mathbf x(t),\ \mathbf v(t)`, tx(t, "gdInt_wXv", "position and velocity at time t: together, the state")],
          [r`\dot{\mathbf x}`, tx(t, "gdInt_wDot", "a dot means the rate of change with time, the derivative d/dt")],
          [r`\mathbf a(\mathbf x, \mathbf v, t)`, tx(t, "gdInt_wA", "the acceleration: total force divided by mass. It may depend on where the object is (springs, gravity), how fast it moves (drag) and the time (a motor switched on)")],
          [r`h`, tx(t, "gdInt_wH", "the step: the fixed amount of time one update advances, for example 1/60 s")],
        ]}>
        {r`\dot{\mathbf x} = \mathbf v \qquad \dot{\mathbf v} = \mathbf a(\mathbf x, \mathbf v, t)`}
      </Equation>

      <H2>{tx(t, "gdInt_eulerTitle", "Explicit Euler, and where its energy comes from")}</H2>
      <p>
        {tx(t, "gdInt_eulerBody",
          "The first idea is to assume nothing changes during the step: move with the current velocity, and change the velocity with the current acceleration. This is explicit (forward) Euler. Each step makes an error of order h², because it ignores how the velocity changes over the step; over a fixed amount of time there are 1/h steps, so the total error grows like h. A method whose total error shrinks like hⁿ is called n-th order, so Euler is first order: halve the step and the error halves.")}
      </p>
      <Equation label={tx(t, "gdInt_eqEuler", "Explicit Euler")}
        where={[
          [r`\mathbf x_n, \mathbf v_n`, tx(t, "gdInt_wN", "the state after n steps, at time n·h")],
          [r`\mathbf a_n`, tx(t, "gdInt_wAn", "the acceleration evaluated at that state, a(x_n)")],
        ]}>
        {r`\mathbf x_{n+1} = \mathbf x_n + h\,\mathbf v_n \qquad \mathbf v_{n+1} = \mathbf v_n + h\,\mathbf a_n`}
      </Equation>
      <p>
        {tx(t, "gdInt_springBody",
          "Try it on the simplest oscillator, a spring with no friction: a = −ω²x, where ω is the angular frequency (the spring oscillates ω/2π times per second). Its energy E = ½v² + ½ω²x² should stay constant for ever. Put the Euler step into the energy and expand. The cross terms cancel, and what is left is the old energy times a factor that is always larger than 1:")}
      </p>
      <Equation label={tx(t, "gdInt_eqGain", "Explicit Euler on a spring")}
        where={[
          [r`\omega`, tx(t, "gdInt_wOmega", "the spring's angular frequency, √(k/m) for stiffness k and mass m")],
          [r`E_n`, tx(t, "gdInt_wE", "the energy per unit mass after n steps, ½v² + ½ω²x²")],
          [r`1 + \omega^2 h^2`, tx(t, "gdInt_wGain", "the growth per step. With ω = 10 rad/s and h = 1/60 s it is 1.028: +2.8% per step, doubling the energy in about 25 steps, less than half a second")],
        ]}>
        {r`E_{n+1} = \tfrac12\big(v_n - h\omega^2 x_n\big)^2 + \tfrac12\omega^2\big(x_n + h v_n\big)^2 = \big(1 + \omega^2 h^2\big)\,E_n`}
      </Equation>
      <p>
        {tx(t, "gdInt_whyGain",
          "Where does the extra energy come from? On the way out, the spring is slowing the object down, but Euler moves it with the velocity from the start of the step, which is too fast, so it goes a little too far. On the way back the same happens in reverse. Every step errs towards more energy, and the errors add up instead of cancelling.")}
      </p>

      <H2>{tx(t, "gdInt_semiTitle", "Semi-implicit Euler: swap two lines")}</H2>
      <p>
        {tx(t, "gdInt_semiBody",
          "Update the velocity first, then move with the new velocity. It is the same cost and still first order, but its behaviour is completely different: on the spring its energy wobbles slightly around the right value instead of drifting. The reason is geometric. For a force that depends only on position, this step maps the (position, velocity) plane onto itself while preserving areas (its matrix has determinant 1), a property called symplectic that exact mechanics also has. A symplectic method cannot spiral inwards or outwards, so it keeps energy bounded for as long as you run it. This is the integrator most game engines use, Box2D included.")}
      </p>
      <Equation label={tx(t, "gdInt_eqSemi", "Semi-implicit (symplectic) Euler")}
        where={[
          [r`\mathbf v_{n+1}`, tx(t, "gdInt_wVn1", "the new velocity, computed first; the position update then uses it instead of the old one")],
        ]}>
        {r`\mathbf v_{n+1} = \mathbf v_n + h\,\mathbf a(\mathbf x_n) \qquad \mathbf x_{n+1} = \mathbf x_n + h\,\mathbf v_{n+1}`}
      </Equation>

      <H2>{tx(t, "gdInt_verletTitle", "Verlet")}</H2>
      <p>
        {tx(t, "gdInt_verletBody",
          "Velocity Verlet includes the ½a·h² term of the constant-acceleration formula, and updates the velocity with the average of the accelerations at the start and at the end of the step. It is second order (halve h and the error quarters), symplectic like semi-implicit Euler, and time-reversible: run it backwards and it retraces its steps exactly. It needs the acceleration at the new position, but that value is reused as the next step's starting acceleration, so it still costs one force evaluation per step.")}
      </p>
      <Equation label={tx(t, "gdInt_eqVerlet", "Velocity Verlet")}
        where={[
          [r`\mathbf a_{n+1}`, tx(t, "gdInt_wAn1", "the acceleration at the new position x_{n+1}; keep it for the next step")],
        ]}>
        {r`\mathbf x_{n+1} = \mathbf x_n + h\,\mathbf v_n + \tfrac12 h^2\,\mathbf a_n \qquad \mathbf v_{n+1} = \mathbf v_n + \tfrac12 h\,(\mathbf a_n + \mathbf a_{n+1})`}
      </Equation>
      <p>
        {tx(t, "gdInt_posVerletBody",
          "Adding the Taylor expansions of x(t + h) and x(t − h) cancels the velocity and gives position Verlet, which stores no velocity at all: the next position comes from the current and the previous one. The velocity is implicit in the difference x_n − x_{n−1}, so moving a point directly (to satisfy a constraint, such as \"these two points stay 1 m apart\") automatically changes its velocity to match. That makes it the classic choice for ropes, cloth and ragdolls, popularised by Thomas Jakobsen's 2001 paper on the physics of Hitman.")}
      </p>
      <Equation label={tx(t, "gdInt_eqPosVerlet", "Position (Störmer–) Verlet")}
        where={[
          [r`\mathbf x_{n-1}`, tx(t, "gdInt_wPrev", "the position one step ago, stored instead of the velocity")],
          [r`(\mathbf x_n - \mathbf x_{n-1})/h`, tx(t, "gdInt_wImplied", "the velocity the method implies, if you need it (for example for sound or damage)")],
        ]}>
        {r`\mathbf x_{n+1} = 2\,\mathbf x_n - \mathbf x_{n-1} + h^2\,\mathbf a_n`}
      </Equation>

      <H2>{tx(t, "gdInt_rk4Title", "RK4")}</H2>
      <p>
        {tx(t, "gdInt_rk4Body",
          "The classic fourth-order Runge–Kutta method samples the slopes four times per step: at the start, twice at the middle (each using the previous estimate to look ahead) and at the end, then averages them with weights 1, 2, 2, 1. Its error shrinks like h⁴: halve the step and it drops sixteen-fold. It is the right tool when accuracy per step matters, as in orbit predictions, trajectory previews or the black-hole shader of the GLSL track. But it costs four force evaluations per step, and it is not symplectic: its energy decays very slowly, which over a long run turns into a visible loss. In game physics, where collisions and constraints add far larger errors than the integrator, its extra accuracy rarely pays for its cost.")}
      </p>
      <Equation label={tx(t, "gdInt_eqRk4", "RK4 for x″ = a(x)")}
        where={[
          [r`\mathbf k_1 \dots \mathbf k_4`, tx(t, "gdInt_wK", "four estimates of the acceleration: at the start, at the midpoint (twice) and at the end of the step")],
          [r`\mathbf v_1 \dots \mathbf v_4`, tx(t, "gdInt_wVi", "the matching velocity estimates: v₁ = v, v₂ = v + ½h·k₁, v₃ = v + ½h·k₂, v₄ = v + h·k₃")],
        ]}>
        {r`\mathbf x_{n+1} = \mathbf x_n + \tfrac h6(\mathbf v_1 + 2\mathbf v_2 + 2\mathbf v_3 + \mathbf v_4) \qquad \mathbf v_{n+1} = \mathbf v_n + \tfrac h6(\mathbf k_1 + 2\mathbf k_2 + 2\mathbf k_3 + \mathbf k_4)`}
      </Equation>

      <IntegratorFigure t={t} />

      <H2>{tx(t, "gdInt_stabTitle", "Stability: how big can the step be?")}</H2>
      <p>
        {tx(t, "gdInt_stabBody",
          "On the spring, every one of these methods multiplies the state by the same 2 × 2 matrix at every step, and that matrix depends only on the product s = ω·h: how many radians of the spring's oscillation fit in one step. The size of its largest eigenvalue is the factor by which the amplitude changes per step. For explicit Euler it is √(1 + s²), above 1 for any step. For semi-implicit Euler and Verlet it is exactly 1 as long as s ≤ 2, and above 1 beyond that, where they explode. RK4 is stable up to s ≈ 2.83. So a spring that is too stiff for the step will always blow up, whatever the method: stiffness has to be limited to about ω < 2/h, or the step made smaller.")}
      </p>
      <Equation label={tx(t, "gdInt_eqStab", "The stability limit of symplectic Euler and Verlet")}
        where={[
          [r`\omega = \sqrt{k/m}`, tx(t, "gdInt_wOm", "the angular frequency of the stiffest spring (or contact) in the simulation")],
          [r`h`, tx(t, "gdInt_wH2", "the fixed step. At 60 Hz the limit is ω < 120 rad/s, a spring that oscillates about 19 times per second")],
        ]}>
        {r`\omega\,h \le 2 \qquad\Longleftrightarrow\qquad h \le \frac{2}{\omega}`}
      </Equation>
      <p>
        {tx(t, "gdInt_implicitBody",
          "Implicit (backward) Euler turns the problem around: it uses the acceleration at the end of the step, a(x_{n+1}), which requires solving an equation, a linear system for springs. In return, its growth factor 1/√(1 + s²) is below 1 for every step size, so it can never explode. It damps motion instead, draining a little energy every step. Cloth and soft-body solvers use it for their stiffest springs, where stability matters more than bounce.")}
      </p>

      <StabilityFigure t={t} />

      <H3>{tx(t, "gdInt_dragTitle", "Damping and drag")}</H3>
      <p>
        {tx(t, "gdInt_dragBody",
          "Linear drag, a = −c·v, slows everything down. Multiplying the velocity by (1 − c·h) each step is Euler applied to it, and it goes wrong the same way: at c·h > 1 the velocity changes sign every step. The exact answer over one step is v·e^(−c·h), which never overshoots, depends correctly on h, and costs one exp per frame, or none if h is fixed and the factor is computed once. The smoothing chapter used the same exponential for frame-rate independent lerp.")}
      </p>
      <CodeBlock lang="cpp" filename="integrate.cpp" t={t}>{`struct Particle { Vec2 pos, vel, prev, acc; float invMass; Vec2 force; };

// One fixed step with semi-implicit Euler and exact linear damping.
void integrate(Particle& p, Vec2 gravity, float damping, float h) {
    Vec2 acc = gravity + p.force * p.invMass;   // a = g + F/m
    p.vel += acc * h;                           // velocity first...
    p.vel *= std::exp(-damping * h);            // ...damped exactly over the step...
    p.pos += p.vel * h;                         // ...then position, with the new velocity
    p.force = {0, 0};                           // forces are re-accumulated every step
}

// Velocity Verlet: p.acc holds a(x) from the previous step.
void integrateVerlet(Particle& p, Vec2 (*accel)(Vec2), float h) {
    p.pos += p.vel * h + p.acc * (0.5f * h * h);
    Vec2 accNew = accel(p.pos);                 // the one force evaluation of this step
    p.vel += (p.acc + accNew) * (0.5f * h);     // average of the old and new acceleration
    p.acc = accNew;                             // reused as the next step's starting value
}

// Position Verlet: no velocity stored, only the previous position.
void integratePositionVerlet(Particle& p, Vec2 acc, float h) {
    Vec2 next = p.pos * 2.0f - p.prev + acc * (h * h);
    p.prev = p.pos;
    p.pos = next;
}`}</CodeBlock>

      <H2>{tx(t, "gdInt_chooseTitle", "Which one to use")}</H2>
      <LessonTable
        headers={[tx(t, "gdInt_tMethod", "Method"), tx(t, "gdInt_tOrder", "Order"), tx(t, "gdInt_tCost", "Forces per step"), tx(t, "gdInt_tEnergy", "Energy over time"), tx(t, "gdInt_tUse", "Typical use")]}
        rows={[
          [tx(t, "gdInt_r1", "explicit Euler"), "1", "1", tx(t, "gdInt_r1e", "grows every step"), tx(t, "gdInt_r1u", "nothing that oscillates; fine for constant velocity")],
          [tx(t, "gdInt_r2", "semi-implicit Euler"), "1", "1", tx(t, "gdInt_r2e", "bounded, wobbles"), tx(t, "gdInt_r2u", "rigid bodies, most game physics")],
          [tx(t, "gdInt_r3", "velocity Verlet"), "2", "1", tx(t, "gdInt_r3e", "bounded, wobbles less"), tx(t, "gdInt_r3u", "particles, molecular dynamics")],
          [tx(t, "gdInt_r4", "position Verlet"), "2", "1", tx(t, "gdInt_r4e", "bounded"), tx(t, "gdInt_r4u", "ropes, cloth, ragdolls (with constraints)")],
          ["RK4", "4", "4", tx(t, "gdInt_r5e", "slowly decays"), tx(t, "gdInt_r5u", "orbits, previews, anything smooth and accuracy-critical")],
          [tx(t, "gdInt_r6", "implicit Euler"), "1", tx(t, "gdInt_r6c", "a solve"), tx(t, "gdInt_r6e", "always decays"), tx(t, "gdInt_r6u", "very stiff springs, cloth")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "gdInt_tip", "A fixed step makes whichever method you pick behave the same on every machine; a variable step makes even a good method inconsistent. Integrate at a fixed rate with the accumulator from the game-loop chapter, and interpolate for rendering.")}
      </Callout>

      <KeyIdeas t={t} id="gdInt" items={[
        tx(t, "gdInt_k1", "An integrator advances the state (x, v) by a fixed step h, using the acceleration a = F/m."),
        tx(t, "gdInt_k2", "Explicit Euler multiplies a spring's energy by 1 + ω²h² every step: oscillations always grow."),
        tx(t, "gdInt_k3", "Semi-implicit Euler (velocity first, then position) is symplectic: same cost, bounded energy. It is the default for games."),
        tx(t, "gdInt_k4", "Velocity Verlet is second order and symplectic; position Verlet stores the previous position instead of the velocity and suits constraints."),
        tx(t, "gdInt_k5", "RK4 is fourth order but costs four force evaluations and slowly loses energy."),
        tx(t, "gdInt_k6", "Symplectic Euler and Verlet are stable only while ω·h ≤ 2: limit stiffness or shrink the step."),
      ]} />
    </Article>
  );
}
