"use client";

// Physics 2: collision response between two moving bodies — momentum and
// impulse, the restitution law, deriving the impulse magnitude, energy loss,
// inverse mass and static bodies, Coulomb friction, positional correction
// (percent + slop), resting contacts, and sequential impulses for piles.

import { Callout, CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ImpactLineFigure } from "@/components/lesson/figures/gamedev/ImpactLineFigure";
import { BallPitFigure } from "@/components/lesson/figures/gamedev/BallPitFigure";

const r = String.raw;

export function CollisionResponseContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdResp_intro",
          "The collision chapters answered \"do these two shapes overlap, and along which normal?\". Response answers \"so what happens now?\". Against a wall that never moves, the Collision Shapes chapter simply reflected the velocity. When both objects move, the heavier one should barely notice a light one, two equal billiard balls should swap speeds, and a pile of crates should rest instead of sinking or buzzing. All of that follows from one idea, the impulse, and two laws: conservation of momentum and a rule for how bouncy the contact is.")}
      </Lead>

      <Goals t={t} id="gdResp" items={[
        "Resolve a collision with an impulse that conserves momentum.",
        "Set how bouncy a contact is with restitution.",
        "Add friction to a contact.",
        "Keep stacks of objects from sinking and jittering.",
      ]} />

      <H2>{tx(t, "gdResp_impTitle", "Momentum and impulse")}</H2>
      <p>
        {tx(t, "gdResp_impBody",
          "The momentum of a body is its mass times its velocity, p = m·v. A force F acting for a time Δt changes it by F·Δt, the impulse. A real collision is a very large force over a very short time, a few milliseconds of rubber or steel being squashed. A game step is longer than that, so the engine skips the details and applies the whole change at once, as an instantaneous impulse J. By Newton's third law the two bodies push on each other equally and in opposite directions, so A receives −J and B receives +J, and the total momentum does not change.")}
      </p>
      <Equation label={tx(t, "gdResp_eqImp", "An impulse changes the velocities")}
        where={[
          [r`j`, tx(t, "gdResp_wJ", "the size of the impulse, in N·s (kg·m/s); what we need to find")],
          [r`\hat{\mathbf n}`, tx(t, "gdResp_wN", "the unit collision normal, pointing from A to B; the push acts along it (friction comes later)")],
          [r`m_A, m_B`, tx(t, "gdResp_wM", "the two masses; dividing the impulse by the mass gives the change in velocity")],
        ]}
        note={tx(t, "gdResp_impNote", "Adding m_A times the first line to m_B times the second gives m_A v_A′ + m_B v_B′ = m_A v_A + m_B v_B: momentum is conserved for any j.")}>
        {r`\mathbf v_A' = \mathbf v_A - \frac{j}{m_A}\,\hat{\mathbf n} \qquad \mathbf v_B' = \mathbf v_B + \frac{j}{m_B}\,\hat{\mathbf n}`}
      </Equation>

      <H2>{tx(t, "gdResp_restTitle", "Restitution: how bouncy")}</H2>
      <p>
        {tx(t, "gdResp_restBody",
          "Momentum alone does not fix j. The missing rule is Newton's law of restitution. Look at the relative velocity of B with respect to A along the normal, v_n. Before the impact it is negative (they approach). After it, it is reversed and scaled by the coefficient of restitution e, a property of the pair of materials: 0 for clay, which does not bounce at all, about 0.8 for a tennis ball on a court, and 1 for a perfectly elastic collision that loses no energy.")}
      </p>
      <Equation label={tx(t, "gdResp_eqRest", "The restitution law")}
        where={[
          [r`v_n = (\mathbf v_B - \mathbf v_A)\cdot\hat{\mathbf n}`, tx(t, "gdResp_wVn", "the relative normal velocity: negative while the bodies approach, positive while they separate")],
          [r`e`, tx(t, "gdResp_wE", "the coefficient of restitution, between 0 and 1")],
        ]}>
        {r`v_n' = -e\,v_n`}
      </Equation>
      <p>
        {tx(t, "gdResp_deriveBody",
          "Now substitute the two velocity updates into the definition of v_n′. The impulse adds j/m_B along n̂ to B and removes j/m_A from A, so the relative normal velocity grows by j·(1/m_A + 1/m_B). Setting that equal to −e·v_n and solving for j gives the formula at the heart of every impulse-based engine:")}
      </p>
      <Equation label={tx(t, "gdResp_eqJ", "The impulse magnitude")}
        where={[
          [r`-(1 + e)\,v_n`, tx(t, "gdResp_wNum", "how much the relative normal velocity must change: from v_n to −e·v_n")],
          [r`\tfrac1{m_A} + \tfrac1{m_B}`, tx(t, "gdResp_wDen", "how much one unit of impulse changes it. Its inverse is the reduced mass μ = m_A m_B/(m_A + m_B)")],
        ]}
        note={tx(t, "gdResp_jNote", "Apply it only when v_n < 0. If the bodies are already separating, an impulse would glue them together.")}>
        {r`v_n + j\Big(\frac1{m_A} + \frac1{m_B}\Big) = -e\,v_n \quad\Longrightarrow\quad j = \frac{-(1 + e)\,v_n}{\dfrac1{m_A} + \dfrac1{m_B}}`}
      </Equation>
      <p>
        {tx(t, "gdResp_energyBody",
          "Kinetic energy is kept only when e = 1. In general the collision loses ½·μ·v_n²·(1 − e²), where μ is the reduced mass above: all of it for e = 0, when the two bodies end up moving together at the same normal speed. With equal masses and e = 1 the formula gives j = −m·v_n, and the two bodies exchange their normal velocities: the moving ball stops dead and the resting one moves off, as in Newton's cradle.")}
      </p>

      <ImpactLineFigure t={t} />

      <H3>{tx(t, "gdResp_invTitle", "Inverse mass and static bodies")}</H3>
      <p>
        {tx(t, "gdResp_invBody",
          "Engines store the inverse mass 1/m rather than m. Every formula above uses it, and it gives static objects, walls, floors and anything else that must never move, a natural value: 0, an infinite mass. With 1/m_B = 0, B's velocity never changes, j = −(1 + e)·m_A·v_n, and A's new velocity is v_A − (1 + e)(v_A·n̂)n̂ (with n̂ now pointing into the wall): exactly the wall rule of the Collision Shapes chapter. One formula covers both cases, and no code has to divide by zero.")}
      </p>

      <H2>{tx(t, "gdResp_fricTitle", "Friction")}</H2>
      <p>
        {tx(t, "gdResp_fricBody",
          "The normal impulse only acts along n̂. Sliding along the surface is resisted by friction, an impulse along the tangent t̂ (the part of the relative velocity that is perpendicular to the normal, made unit length). First compute the impulse that would stop the sliding completely, just like the normal impulse with e = 0. Then apply Coulomb's law: friction can be at most μ times the normal force, and over the same instant that means at most μ times the normal impulse. If the stopping impulse fits inside that limit, the contact sticks (static friction); if not, it is clamped and the bodies slide (kinetic friction).")}
      </p>
      <Equation label={tx(t, "gdResp_eqFric", "Friction impulse")}
        where={[
          [r`\hat{\mathbf t}`, tx(t, "gdResp_wT", "the unit tangent: the direction of sliding, (v_rel − v_n n̂)/‖v_rel − v_n n̂‖")],
          [r`v_t = \mathbf v_{\text{rel}}\cdot\hat{\mathbf t}`, tx(t, "gdResp_wVt", "the sliding speed along the surface")],
          [r`\mu`, tx(t, "gdResp_wMu", "the coefficient of friction: about 0.05 for ice on ice, 0.5 for wood on wood, 1 for rubber on dry asphalt. Pairs of materials are often combined as √(μ_A μ_B)")],
        ]}>
        {r`j_t = \frac{-v_t}{\dfrac1{m_A} + \dfrac1{m_B}} \qquad j_t \leftarrow \operatorname{clamp}(j_t,\ -\mu\,j,\ \mu\,j)`}
      </Equation>

      <H2>{tx(t, "gdResp_posTitle", "Positional correction")}</H2>
      <p>
        {tx(t, "gdResp_posBody",
          "Impulses fix velocities, but by the time a collision is detected the shapes already overlap by some depth d. If nothing removes it, gravity adds a little more overlap every step and a resting object slowly sinks into the floor. So after the velocities, the engine moves the two bodies apart along n̂, splitting the push by inverse mass so that the lighter body moves more. Two refinements keep it calm. It removes only a percentage of the overlap per step (80% is common), because correcting it all at once makes stacks jitter. And it ignores a small slop, about 1 cm, so that a resting contact keeps touching slightly instead of being pushed out and falling back every step.")}
      </p>
      <Equation label={tx(t, "gdResp_eqPos", "Positional correction")}
        where={[
          [r`d`, tx(t, "gdResp_wD", "the penetration depth reported by collision detection")],
          [r`s`, tx(t, "gdResp_wS", "the slop: overlap below it is left alone (around 0.01 m)")],
          [r`\beta`, tx(t, "gdResp_wBeta", "the share of the remaining overlap removed per step (0.2 to 0.8)")],
        ]}>
        {r`\mathbf c = \frac{\beta\,\max(d - s,\ 0)}{\tfrac1{m_A} + \tfrac1{m_B}}\,\hat{\mathbf n} \qquad \mathbf x_A \mathrel{-}= \frac{\mathbf c}{m_A} \qquad \mathbf x_B \mathrel{+}= \frac{\mathbf c}{m_B}`}
      </Equation>

      <H3>{tx(t, "gdResp_restingTitle", "Resting contact")}</H3>
      <p>
        {tx(t, "gdResp_restingBody",
          "A ball resting on the floor still collides with it every step: gravity gives it a small downward velocity, g·h ≈ 0.16 m/s at 60 Hz, and the contact removes it. With e = 0.8 that would be turned into a small bounce every step, and the ball would buzz. The usual cure is a restitution threshold: when the approach speed is below about 1 m/s, use e = 0 for that contact.")}
      </p>

      <H2>{tx(t, "gdResp_seqTitle", "Many contacts: sequential impulses")}</H2>
      <p>
        {tx(t, "gdResp_seqBody",
          "One contact has an exact answer. A pile does not: the impulse at the bottom depends on the weight of everything above, and fixing one contact changes the velocities at its neighbours. Solving all of them together means solving a system of inequalities (each contact can push but never pull). Erin Catto's sequential impulses, used in Box2D and most game engines, solves it by iteration instead. Each step, sweep over all contacts several times, and at each one apply the impulse that fixes that contact given the current velocities. The small corrections pass forces through the pile a little further with each sweep. Two details make it converge. The impulse is accumulated per contact over the sweeps, and it is the accumulated total that is clamped at zero, so a later sweep may take back part of what an earlier one applied. And the friction limit uses that accumulated normal impulse.")}
      </p>
      <Equation label={tx(t, "gdResp_eqAcc", "One sweep over a contact, with accumulated clamping")}
        where={[
          [r`J`, tx(t, "gdResp_wAccJ", "the total normal impulse applied to this contact so far in this step, starting at 0")],
          [r`\Delta j`, tx(t, "gdResp_wDj", "the impulse actually applied in this sweep; it may be negative, as long as the total stays ≥ 0")],
          [r`v_n^{0}`, tx(t, "gdResp_wVn0", "the normal velocity when the contact was found, fixed for the whole step: the bounce targets −e·v_n⁰, not −e times the latest v_n")],
        ]}>
        {r`J_{\text{new}} = \max\!\Big(0,\ J - \frac{v_n + e\,v_n^{0}}{\tfrac1{m_A} + \tfrac1{m_B}}\Big) \qquad \Delta j = J_{\text{new}} - J \qquad J \leftarrow J_{\text{new}}`}
      </Equation>

      <BallPitFigure t={t} />

      <CodeBlock lang="cpp" filename="contact.cpp" t={t}>{`struct Body { Vec2 pos, vel; float invMass; };
struct Contact {
    Body* a; Body* b;
    Vec2 n;          // unit normal from a to b
    float depth;     // penetration depth
    float bounce;    // e * vn at first touch (0 if slow or separating)
    float jn = 0;    // accumulated normal impulse this step
    float jt = 0;    // accumulated friction impulse this step
};

void prepare(Contact& c, float e, float restThreshold) {
    float vn = dot(c.b->vel - c.a->vel, c.n);
    c.bounce = (vn < -restThreshold) ? e * vn : 0.0f;   // resting contacts do not bounce
}

void solve(Contact& c, float mu) {
    Body& A = *c.a; Body& B = *c.b;
    float k = A.invMass + B.invMass;
    if (k == 0) return;                                  // two static bodies

    // Normal impulse: accumulate, then clamp the total so the contact only pushes
    float vn = dot(B.vel - A.vel, c.n);
    float jnNew = std::max(0.0f, c.jn - (vn + c.bounce) / k);
    float dj = jnNew - c.jn;  c.jn = jnNew;
    A.vel -= c.n * (dj * A.invMass);
    B.vel += c.n * (dj * B.invMass);

    // Friction along the tangent, limited by mu times the normal impulse
    Vec2 t = { -c.n.y, c.n.x };
    float vt = dot(B.vel - A.vel, t);
    float jtNew = std::clamp(c.jt - vt / k, -mu * c.jn, mu * c.jn);
    float dt = jtNew - c.jt;  c.jt = jtNew;
    A.vel -= t * (dt * A.invMass);
    B.vel += t * (dt * B.invMass);
}

void correctPositions(Contact& c, float percent = 0.8f, float slop = 0.01f) {
    Body& A = *c.a; Body& B = *c.b;
    float k = A.invMass + B.invMass;
    if (k == 0) return;
    Vec2 push = c.n * (std::max(c.depth - slop, 0.0f) * percent / k);
    A.pos -= push * A.invMass;
    B.pos += push * B.invMass;
}

// Per fixed step: integrate forces, find contacts, prepare them,
// solve them all 'iterations' times, integrate positions, then correct.`}</CodeBlock>

      <H2>{tx(t, "gdResp_bugsTitle", "Symptoms and causes")}</H2>
      <LessonTable
        headers={[tx(t, "gdResp_tSym", "Symptom"), tx(t, "gdResp_tCause", "Cause"), tx(t, "gdResp_tFix", "Fix")]}
        rows={[
          [tx(t, "gdResp_b1", "objects stick together after touching"), tx(t, "gdResp_b1c", "an impulse applied while they were already separating"), tx(t, "gdResp_b1f", "only resolve when v_n < 0 (or clamp the accumulated impulse at 0)")],
          [tx(t, "gdResp_b2", "resting objects buzz or hop"), tx(t, "gdResp_b2c", "restitution applied to the tiny gravity-per-step velocity"), tx(t, "gdResp_b2f", "e = 0 below a threshold approach speed")],
          [tx(t, "gdResp_b3", "piles slowly sink"), tx(t, "gdResp_b3c", "overlap never removed, or too few iterations"), tx(t, "gdResp_b3f", "positional correction; more iterations")],
          [tx(t, "gdResp_b4", "stacks jitter"), tx(t, "gdResp_b4c", "correcting 100% of the overlap, no slop"), tx(t, "gdResp_b4f", "percent ≈ 0.8, slop ≈ 0.01 m; warm starting (next chapter)")],
          [tx(t, "gdResp_b5", "light objects get launched"), tx(t, "gdResp_b5c", "a large overlap corrected in one step"), tx(t, "gdResp_b5f", "limit the correction per step; avoid spawning objects inside each other")],
          [tx(t, "gdResp_b6", "energy grows in a pile"), tx(t, "gdResp_b6c", "bounce recomputed from the latest v_n on every sweep"), tx(t, "gdResp_b6f", "compute the bounce target once per step, from v_n⁰")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "gdResp_tip", "Impulses still need collision detection that finds the contact before bodies pass through each other. For fast objects, use the swept tests from the Collision Shapes chapter, or several substeps per frame, before resolving.")}
      </Callout>

      <KeyIdeas t={t} id="gdResp" items={[
        tx(t, "gdResp_k1", "A collision is resolved by an instantaneous impulse j along the normal: −j to A, +j to B, so momentum is conserved."),
        tx(t, "gdResp_k2", "Restitution sets the outgoing relative normal speed to −e·v_n, which gives j = −(1 + e)v_n / (1/m_A + 1/m_B)."),
        tx(t, "gdResp_k3", "Store inverse masses: 0 means static, and the wall rule falls out of the general formula."),
        tx(t, "gdResp_k4", "Friction is a tangential impulse that tries to stop sliding, clamped to μ times the normal impulse (Coulomb)."),
        tx(t, "gdResp_k5", "Positional correction removes a share of the overlap beyond a slop; a restitution threshold stops resting contacts from buzzing."),
        tx(t, "gdResp_k6", "Piles are solved by sequential impulses: several sweeps over all contacts, accumulating each contact's impulse and clamping the total at zero."),
      ]} />
    </Article>
  );
}
