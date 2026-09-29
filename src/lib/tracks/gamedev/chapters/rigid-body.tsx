"use client";

// Physics 3: 2D rigid bodies — the state (x, v, θ, ω), mass and moment of
// inertia, torque as the 2D cross product, the velocity of a point, impulses
// at a contact point with the angular terms in the effective mass, contact
// manifolds for boxes (SAT + clipping), warm starting and the solver loop.

import { Callout, CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ImpulsePointFigure } from "@/components/lesson/figures/gamedev/ImpulsePointFigure";
import { RigidBoxesFigure } from "@/components/lesson/figures/gamedev/RigidBoxesFigure";

const r = String.raw;

export function RigidBodyContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdRb_intro",
          "So far every body has been a point with a mass: it could move, but not turn. A crate knocked at its corner tips over; a plank hit at one end spins; a box sliding down a ramp may topple. A rigid body adds rotation: a body that keeps its shape, so that knowing where its centre is and how far it has turned tells you where every part of it is. This chapter extends the impulse solver of the previous one with an angle, an angular velocity and a moment of inertia, then builds boxes that stack, tip and tumble.")}
      </Lead>

      <H2>{tx(t, "gdRb_stateTitle", "The state of a rigid body")}</H2>
      <p>
        {tx(t, "gdRb_stateBody",
          "In 2D a rigid body needs two more numbers than a particle. Its position is the position of its centre of mass, x; its orientation is an angle θ, which turns the body's local shape into the world. The velocities follow: v for the centre, and the angular velocity ω, in radians per second, positive counter-clockwise. The inertia also comes in a pair. The mass m resists changes of v; the moment of inertia I resists changes of ω, and it depends on how far from the centre the mass sits: the same mass spread out at the rim of a wheel is much harder to spin than packed near the axle.")}
      </p>
      <Equation label={tx(t, "gdRb_eqI", "Moment of inertia")}
        where={[
          [r`m_i,\ r_i`, tx(t, "gdRb_wMi", "a small piece of the body and its distance from the centre of mass; the sum runs over the whole body")],
          [r`\tfrac12 m r^2`, tx(t, "gdRb_wDisk", "a solid disc of radius r")],
          [r`\tfrac1{12} m (w^2 + h^2)`, tx(t, "gdRb_wBox", "a solid rectangle of width w and height h, about its centre")],
          [r`m r^2`, tx(t, "gdRb_wRing", "a thin ring: all the mass at distance r")],
        ]}
        note={tx(t, "gdRb_iNote", "Like the mass, I is stored inverted: 1/I = 0 makes a body that cannot rotate, handy for a player capsule that must stay upright.")}>
        {r`I = \sum_i m_i\,r_i^2 \qquad I_{\text{disc}} = \tfrac12 m r^2 \qquad I_{\text{box}} = \tfrac1{12} m\,(w^2 + h^2) \qquad I_{\text{ring}} = m r^2`}
      </Equation>

      <H2>{tx(t, "gdRb_torqueTitle", "Torque: a force off-centre")}</H2>
      <p>
        {tx(t, "gdRb_torqueBody",
          "A force F applied at a point p does two things. Wherever it acts, it accelerates the centre of mass by F/m, exactly as if it acted at the centre. And it turns the body, by an amount set by the torque τ: the force times its lever arm, the perpendicular distance from the centre to the line of the force. With r the vector from the centre to p, the torque is the 2D cross product r × F, a single number (the z part of the 3D cross product). It is zero when the force points straight through the centre, and largest when it acts at right angles to r.")}
      </p>
      <Equation label={tx(t, "gdRb_eqTorque", "Linear and angular response to a force")}
        where={[
          [r`\mathbf r = \mathbf p - \mathbf x`, tx(t, "gdRb_wR", "the lever arm: from the centre of mass to the point where the force acts")],
          [r`\mathbf r \times \mathbf F = r_x F_y - r_y F_x`, tx(t, "gdRb_wCross", "the 2D cross product: positive when the force turns the body counter-clockwise")],
          [r`\alpha`, tx(t, "gdRb_wAlpha", "the angular acceleration, the rate of change of ω")],
        ]}>
        {r`\mathbf a = \frac{\mathbf F}{m} \qquad \tau = \mathbf r \times \mathbf F \qquad \alpha = \frac{\tau}{I}`}
      </Equation>
      <p>
        {tx(t, "gdRb_pointVelBody",
          "Rotation also changes how fast each point moves. A point at offset r from the centre moves with the centre, plus a circular motion around it: speed ω·‖r‖, perpendicular to r. In 2D that is the vector ω × r = ω·(−r_y, r_x). This is the velocity that matters at a contact: a spinning wheel touching the ground can have a contact point at rest even though its centre moves.")}
      </p>
      <Equation label={tx(t, "gdRb_eqPointVel", "Velocity of a point of the body")}
        where={[
          [r`\omega \times \mathbf r = \omega\,(-r_y,\ r_x)`, tx(t, "gdRb_wWr", "the velocity due to the rotation: r turned 90° counter-clockwise, times ω")],
        ]}>
        {r`\mathbf v_p = \mathbf v + \omega \times \mathbf r`}
      </Equation>

      <H3>{tx(t, "gdRb_integrTitle", "Integrating the rotation")}</H3>
      <p>
        {tx(t, "gdRb_integrBody",
          "The angle is integrated exactly like the position, with the same semi-implicit Euler: first ω += h·τ/I, then θ += h·ω. In 2D the angle simply adds up. In 3D, orientations are quaternions and the update is a small rotation multiplied on, which the Math track's quaternion chapter covers; the rest of this chapter carries over unchanged.")}
      </p>

      <H2>{tx(t, "gdRb_impTitle", "An impulse at a point")}</H2>
      <p>
        {tx(t, "gdRb_impBody",
          "An impulse J applied at a point works like a force applied for an instant. The centre of mass changes velocity by J/m, and the angular velocity changes by (r × J)/I. So where you hit a body does not change how fast its centre moves off; it only decides how much it spins.")}
      </p>
      <Equation label={tx(t, "gdRb_eqImp", "Applying an impulse at a point")}
        where={[
          [r`\mathbf J`, tx(t, "gdRb_wJ", "the impulse, a vector in N·s")],
          [r`\mathbf r`, tx(t, "gdRb_wR2", "from the centre of mass to the point where J is applied")],
        ]}>
        {r`\mathbf v \mathrel{+}= \frac{\mathbf J}{m} \qquad \omega \mathrel{+}= \frac{\mathbf r \times \mathbf J}{I}`}
      </Equation>

      <ImpulsePointFigure t={t} />

      <H3>{tx(t, "gdRb_effTitle", "The collision impulse, with rotation")}</H3>
      <p>
        {tx(t, "gdRb_effBody",
          "Now redo the derivation of the previous chapter at a contact point p, with r_A and r_B from each centre to p. The relative normal velocity is measured at the contact, including the rotation of both bodies. An impulse j·n̂ now changes it twice over: through the linear velocities, by j/m_A + j/m_B as before, and through the rotations, because the impulse also spins each body and the spin moves the contact point. For body A, the impulse changes ω_A by (r_A × n̂)·j/I_A, and that moves the contact point along n̂ by (r_A × n̂)·(r_A × n̂)·j/I_A. So each body adds a term (r × n̂)²/I to the denominator:")}
      </p>
      <Equation label={tx(t, "gdRb_eqJ", "Impulse at a contact, with rotation")}
        where={[
          [r`v_n`, tx(t, "gdRb_wVn", "the relative normal velocity at the contact point: ((v_B + ω_B × r_B) − (v_A + ω_A × r_A)) · n̂")],
          [r`\mathbf r_A \times \hat{\mathbf n}`, tx(t, "gdRb_wRn", "how well the normal can turn body A: 0 when the contact normal points straight through its centre")],
          [r`K_n`, tx(t, "gdRb_wK", "the effective mass's inverse at the contact along n̂: how much one unit of impulse changes v_n there")],
        ]}
        note={tx(t, "gdRb_jNote", "Then apply +j n̂ to B and −j n̂ to A at the contact point, which updates both v and ω of each. Friction works the same way with t̂ in place of n̂ and its own K_t.")}>
        {r`K_n = \frac1{m_A} + \frac1{m_B} + \frac{(\mathbf r_A \times \hat{\mathbf n})^2}{I_A} + \frac{(\mathbf r_B \times \hat{\mathbf n})^2}{I_B} \qquad j = \frac{-(1 + e)\,v_n}{K_n}`}
      </Equation>
      <p>
        {tx(t, "gdRb_effNote",
          "The extra terms make K_n larger, so the same velocity change needs less impulse. Part of the push is spent turning the body instead of stopping it, which is exactly what the figure above showed: an off-centre impulse gives the same velocity to the centre but more total energy, the rest going into rotation.")}
      </p>

      <H2>{tx(t, "gdRb_manifoldTitle", "Contacts between boxes")}</H2>
      <p>
        {tx(t, "gdRb_manifoldBody",
          "A box resting flat on another touches along a whole edge, not at a point. A solver needs points, and two are enough in 2D: one at each end of the touching segment. The Separating Axis Theorem finds the normal: test the two face normals of each box and keep the axis of least overlap. The box that owns that face is the reference; on the other box, the incident edge is the one whose normal points most against the reference normal. Clip the incident edge to the width of the reference face (cut off the parts that stick out past its side planes), and keep the clipped end points that lie below the reference face. Each gives a contact point with its own depth. With two points, a box that rests flat feels two upward impulses and stays level; with one corner touching, the single impulse creates a torque and the box tips.")}
      </p>
      <Equation label={tx(t, "gdRb_eqClip", "Keeping a clipped point")}
        where={[
          [r`\mathbf q`, tx(t, "gdRb_wQ", "an end point of the incident edge after clipping")],
          [r`\mathbf p_{\text{ref}}`, tx(t, "gdRb_wPref", "any point of the reference face, for example its first corner")],
          [r`s`, tx(t, "gdRb_wS", "the signed distance of q above the reference face; the point is a contact only when s ≤ 0, and its depth is −s")],
        ]}>
        {r`s = \hat{\mathbf n}\cdot(\mathbf q - \mathbf p_{\text{ref}}) \le 0 \qquad \text{depth} = -s`}
      </Equation>

      <H3>{tx(t, "gdRb_warmTitle", "Warm starting and the position bias")}</H3>
      <p>
        {tx(t, "gdRb_warmBody",
          "In a tower, the bottom contact must carry the weight of every box above it, and a handful of sweeps of sequential impulses cannot build that impulse up from zero every step. But a resting tower needs nearly the same impulses as in the previous step. Warm starting keeps each contact's accumulated impulses from one step to the next (matched by which features of the two boxes touch) and applies them before the first sweep, so the solver starts close to the answer and only corrects the difference. Box2D also replaces the separate positional correction with a bias velocity: each contact asks for a small separating speed β·max(d − slop, 0)/h in addition to the bounce, so the overlap is removed through the same solver.")}
      </p>
      <Equation label={tx(t, "gdRb_eqBias", "Normal impulse with bounce and position bias")}
        where={[
          [r`b = \frac{\beta}{h}\max(d - \text{slop},\ 0)`, tx(t, "gdRb_wBias", "the bias: the speed at which the solver pushes the bodies apart to remove the overlap d within about 1/β steps")],
          [r`e\,v_n^{0}`, tx(t, "gdRb_wBounce", "the bounce target, from the normal velocity when the contact was found (0 below the restitution threshold)")],
        ]}>
        {r`J_{\text{new}} = \max\!\Big(0,\ J + \frac{-v_n - e\,v_n^{0} + b}{K_n}\Big)`}
      </Equation>

      <RigidBoxesFigure t={t} />

      <CodeBlock lang="cpp" filename="rigidbody.cpp" t={t}>{`struct RigidBody {
    Vec2 pos, vel;  float angle = 0, angVel = 0;
    float invMass, invInertia;             // 0 and 0 for static bodies
};
inline float cross(Vec2 a, Vec2 b) { return a.x * b.y - a.y * b.x; }
inline Vec2  cross(float w, Vec2 r) { return { -w * r.y, w * r.x }; }   // ω × r

Vec2 velocityAt(const RigidBody& b, Vec2 r) { return b.vel + cross(b.angVel, r); }

void applyImpulse(RigidBody& b, Vec2 r, Vec2 J) {
    b.vel    += J * b.invMass;
    b.angVel += cross(r, J) * b.invInertia;
}

struct ContactPoint {
    Vec2 rA, rB, n;  float depth, bounce, bias, kN, kT, jn = 0, jt = 0;
};

void prepare(ContactPoint& c, RigidBody& A, RigidBody& B, const Params& p, float h) {
    float rnA = cross(c.rA, c.n), rnB = cross(c.rB, c.n);
    c.kN = A.invMass + B.invMass + rnA * rnA * A.invInertia + rnB * rnB * B.invInertia;
    Vec2 t = { c.n.y, -c.n.x };
    float rtA = cross(c.rA, t), rtB = cross(c.rB, t);
    c.kT = A.invMass + B.invMass + rtA * rtA * A.invInertia + rtB * rtB * B.invInertia;
    float vn = dot(velocityAt(B, c.rB) - velocityAt(A, c.rA), c.n);
    c.bounce = vn < -p.restThreshold ? p.e * vn : 0.0f;
    c.bias = p.beta / h * std::max(0.0f, c.depth - p.slop);
    // Warm start: re-apply last step's impulses (jn, jt kept from the matching contact)
    Vec2 P = c.n * c.jn + t * c.jt;
    applyImpulse(A, c.rA, -P);  applyImpulse(B, c.rB, P);
}

void solve(ContactPoint& c, RigidBody& A, RigidBody& B, float mu) {
    float vn = dot(velocityAt(B, c.rB) - velocityAt(A, c.rA), c.n);
    float jn = std::max(0.0f, c.jn + (-vn - c.bounce + c.bias) / c.kN);
    Vec2 Pn = c.n * (jn - c.jn);  c.jn = jn;
    applyImpulse(A, c.rA, -Pn);  applyImpulse(B, c.rB, Pn);

    Vec2 t = { c.n.y, -c.n.x };
    float vt = dot(velocityAt(B, c.rB) - velocityAt(A, c.rA), t);
    float jt = std::clamp(c.jt - vt / c.kT, -mu * c.jn, mu * c.jn);
    Vec2 Pt = t * (jt - c.jt);  c.jt = jt;
    applyImpulse(A, c.rA, -Pt);  applyImpulse(B, c.rB, Pt);
}

// Fixed step: gravity into vel → find contacts (SAT + clip) → prepare (warm start)
// → solve all contacts N times → pos += vel*h, angle += angVel*h.`}</CodeBlock>

      <H2>{tx(t, "gdRb_tuneTitle", "Tuning a rigid-body world")}</H2>
      <LessonTable
        headers={[tx(t, "gdRb_tParam", "Parameter"), tx(t, "gdRb_tTypical", "Typical value"), tx(t, "gdRb_tEffect", "Too low / too high")]}
        rows={[
          [tx(t, "gdRb_p1", "step h"), "1/60 – 1/240 s", tx(t, "gdRb_p1e", "large: tunnelling and soft stacks / small: costly")],
          [tx(t, "gdRb_p2", "velocity iterations"), "8 – 10", tx(t, "gdRb_p2e", "stacks sag and slide / cost grows linearly")],
          [tx(t, "gdRb_p3", "position bias β"), "0.1 – 0.3", tx(t, "gdRb_p3e", "bodies sink into each other / jitter and jumps")],
          [tx(t, "gdRb_p4", "slop"), "0.005 – 0.01 m", tx(t, "gdRb_p4e", "contacts flicker on and off / visible overlap")],
          [tx(t, "gdRb_p5", "restitution threshold"), "≈ 1 m/s", tx(t, "gdRb_p5e", "resting bodies buzz / slow drops do not bounce")],
          [tx(t, "gdRb_p6", "mass ratio"), tx(t, "gdRb_p6v", "below about 10:1"), tx(t, "gdRb_p6e", "a heavy box on a light one needs many iterations")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "gdRb_tip", "Before writing your own, know what the engines do: Box2D (2D) and Jolt, PhysX or Bullet (3D) all use this same scheme of semi-implicit Euler, contact manifolds and sequential impulses with warm starting, plus broad phases, sleeping bodies and continuous collision. Writing a small one teaches you what their parameters mean; shipping a game usually means using theirs.")}
      </Callout>

      <KeyIdeas t={t} id="gdRb" items={[
        tx(t, "gdRb_k1", "A 2D rigid body adds an angle θ, an angular velocity ω and a moment of inertia I = Σ m r² to a particle."),
        tx(t, "gdRb_k2", "A force at a point accelerates the centre by F/m and turns the body with torque τ = r × F; an impulse changes v by J/m and ω by (r × J)/I."),
        tx(t, "gdRb_k3", "A point of the body moves at v + ω × r; contacts use that velocity."),
        tx(t, "gdRb_k4", "The contact impulse divides by K = 1/m_A + 1/m_B + (r_A × n)²/I_A + (r_B × n)²/I_B: part of the push goes into rotation."),
        tx(t, "gdRb_k5", "Box contacts come from SAT plus clipping the incident edge against the reference face: up to two points in 2D."),
        tx(t, "gdRb_k6", "Warm starting reuses last step's impulses, and a bias velocity removes overlap through the same solver: together they make stacks stable."),
      ]} />
    </Article>
  );
}
