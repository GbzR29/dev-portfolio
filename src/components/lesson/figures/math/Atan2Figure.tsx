"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, C, T, plot, Grid, Handle, useDrag, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A pointer at the origin shows the direction of a draggable point. arctan(y / x)
// only knows the ratio, so it cannot tell (1, 1) from (−1, −1): in the left
// half-plane it points exactly the wrong way. atan2(y, x) looks at both signs and returns the full
// angle in (−π, π]. The point's polar coordinates (r, θ) are shown as well.
// The lab: where arctan breaks, straight up, then placing a point from (r, θ).

const p = plot({ W: 560, H: 300, x0: -4.7, x1: 4.7, y0: -2.5, y1: 2.5 });
const toDeg = (a: number) => (a * 180) / Math.PI;
const deg = (a: number) => `${toDeg(a).toFixed(1)}°`;
const arctan = (q: Pt) => (Math.abs(q.x) < 1e-9 ? Math.sign(q.y) * Math.PI / 2 : Math.atan(q.y / q.x));
const quadOf = (q: Pt) => (q.x >= 0 ? (q.y >= 0 ? "I" : "IV") : q.y >= 0 ? "II" : "III");

/** The svg; owns the drag (it is mounted twice while the lab is open). */
function AtStage({ q, setQ }: { q: Pt; setQ: (v: Pt) => void }) {
  const drag = useDrag<"q">(() => "q", (_, s) => {
    const w = p.inv(s);
    setQ({ x: clamp(Math.round(w.x * 20) / 20, -4.5, 4.5), y: clamp(Math.round(w.y * 20) / 20, -2.4, 2.4) });
  });
  const a2 = Math.atan2(q.y, q.x), a1 = arctan(q);
  const wrong = Math.abs(a1 - a2) > 1e-6;
  const barrel = (a: number, len: number) => ({ x: p.X(Math.cos(a) * len), y: p.Y(Math.sin(a) * len) });
  const quad = quadOf(q);
  const arcR = 0.7, large = a2 < 0 ? 0 : a2 > Math.PI ? 1 : 0;
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto cursor-grab">
      <Grid p={p} step={1} />
      {(["I", "II", "III", "IV"] as const).map((n, i) => (
        <T key={n} x={p.X([3.9, -4.4, -4.4, 3.9][i])} y={p.Y([2.1, 2.1, -2.2, -2.2][i])} size={10} color={n === quad ? C.fg : C.axis}>{n}</T>
      ))}
      <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(q.x)} y2={p.Y(q.y)} stroke={C.purple} strokeDasharray="4 3" />
      <line x1={p.X(q.x)} y1={p.Y(0)} x2={p.X(q.x)} y2={p.Y(q.y)} stroke={C.muted} strokeDasharray="2 3" opacity={0.6} />
      <path d={`M${p.X(arcR)},${p.Y(0)} A${arcR * p.sx},${arcR * p.sy} 0 ${large} ${a2 < 0 ? 1 : 0} ${p.X(Math.cos(a2) * arcR)},${p.Y(Math.sin(a2) * arcR)}`} fill="none" stroke={C.green} strokeWidth={2} />
      {/* pointer */}
      {wrong && <line x1={p.X(0)} y1={p.Y(0)} x2={barrel(a1, 1.2).x} y2={barrel(a1, 1.2).y} stroke={C.red} strokeWidth={7} strokeLinecap="round" opacity={0.45} />}
      <line x1={p.X(0)} y1={p.Y(0)} x2={barrel(a2, 1.2).x} y2={barrel(a2, 1.2).y} stroke={C.green} strokeWidth={7} strokeLinecap="round" />
      <circle cx={p.X(0)} cy={p.Y(0)} r={16} fill="var(--code-surface)" stroke={C.fg} strokeWidth={1.5} />
      {wrong && <T x={barrel(a1, 1.45).x} y={barrel(a1, 1.45).y} size={9} anchor="middle" color={C.red}>arctan</T>}
      <T x={barrel(a2, 1.5).x} y={barrel(a2, 1.5).y} size={9} anchor="middle" color={C.green}>atan2</T>
      <Handle x={p.X(q.x)} y={p.Y(q.y)} color={C.amber} r={7} active={drag.dragging === "q"} />
    </svg>
  );
}

export function Atan2Figure({ t }: { t?: TrackTranslations }) {
  const [q, setQ] = useState<Pt>({ x: -2.2, y: 1.4 });
  const lab = useLab("math-atan2");

  const a2 = Math.atan2(q.y, q.x), a1 = arctan(q);
  const r = Math.hypot(q.x, q.y);
  const wrong = Math.abs(a1 - a2) > 1e-6;

  const view = <AtStage q={q} setQ={setQ} />;
  const controls = <Row>
    <Readout>({q.x.toFixed(2)}, {q.y.toFixed(2)}) · {tx(t, "figAtan_quad", "quadrant")} {quadOf(q)}</Readout>
    <Readout color={wrong ? C.red : C.muted}>arctan(y/x) = {deg(a1)}</Readout>
    <Readout color={C.green}>atan2(y, x) = {deg(a2)}</Readout>
    <Readout color={C.purple}>r = √(x² + y²) = {r.toFixed(2)}</Readout>
  </Row>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figAtanL1_t", "Where arctan breaks"),
      body: <>
        <p>{tx(t, "figAtanL1_b1", "Both pointers agree while the point is on the right. arctan(y/x) only sees the ratio y/x.")}</p>
        <p>{tx(t, "figAtanL1_b2", "Drag the point into the left half and watch the red pointer.")}</p>
      </>,
      goal: { text: tx(t, "figAtanL1_g", "arctan and atan2 disagree."), done: wrong },
      setup: () => setQ({ x: 2, y: 1 }),
    },
    {
      title: tx(t, "figAtanL2_t", "Quick check"),
      body: <p>{tx(t, "figAtanL2_b", "The point (−3, 3) is up and to the left.")}</p>,
      quiz: {
        q: tx(t, "figAtanL2_q", "What is atan2(3, −3)?"),
        options: ["135°", "−45°", "45°", "−135°"],
        answer: 0,
        why: tx(t, "figAtanL2_w", "x < 0 and y > 0 put it in quadrant II; the reference angle is 45°, so 180° − 45° = 135°. arctan(3/−3) = −45° points the opposite way."),
      },
    },
    {
      title: tx(t, "figAtanL3_t", "Straight up"),
      body: <p>{tx(t, "figAtanL3_b", "On the y-axis x = 0, so y/x divides by zero. atan2 still knows the answer. Put the point straight above the origin.")}</p>,
      goal: { text: tx(t, "figAtanL3_g", "x = 0 and y > 0: atan2 = 90°."), done: Math.abs(q.x) < 0.03 && q.y > 0.5 },
      hint: tx(t, "figAtanL3_h", "Drag along the vertical axis; the point snaps to steps of 0.05."),
    },
    {
      title: tx(t, "figAtanL4_t", "From polar to a point"),
      body: <>
        <p>{tx(t, "figAtanL4_b1", "A point can be named by its distance r and its angle θ: (x, y) = (r cos θ, r sin θ).")}</p>
        <p>{tx(t, "figAtanL4_b2", "Place the point at r = 2 and θ = −120°.")}</p>
      </>,
      goal: { text: tx(t, "figAtanL4_g", "r = 2 and θ = −120° (close enough)."), done: Math.abs(r - 2) < 0.08 && Math.abs(toDeg(a2) + 120) < 3 },
      hint: tx(t, "figAtanL4_h", "x = 2 cos(−120°) = −1 and y = 2 sin(−120°) ≈ −1.73."),
    },
    {
      title: tx(t, "figAtanL5_t", "Quick check"),
      body: <p>{tx(t, "figAtanL5_b", "atan2 answers in (−180°, 180°].")}</p>,
      quiz: {
        q: tx(t, "figAtanL5_q", "What is atan2(−5, 0), the direction of (0, −5)?"),
        options: ["−90°", "90°", "270° only", tx(t, "figAtanL5_o4", "undefined")],
        answer: 0,
        why: tx(t, "figAtanL5_w", "Straight down. 270° is the same direction, but atan2 names it in (−180°, 180°], so −90°. Only the origin itself has no direction."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "flip", tone: "warn", when: wrong && r > 0.15,
      title: tx(t, "figAtanI1_t", "Off by half a turn"),
      body: fill(tx(t, "figAtanI1_b", "y/x = {ratio} is the same for this point and its mirror through the origin. arctan answers {a1}, the mirror's direction; atan2 checks x < 0 and answers {a2}."), { ratio: (q.y / q.x).toFixed(2), a1: deg(a1), a2: deg(a2) }),
    },
    {
      id: "vert", tone: "info", when: Math.abs(q.x) < 0.03 && Math.abs(q.y) > 0.15,
      title: tx(t, "figAtanI2_t", "Division by zero"),
      body: tx(t, "figAtanI2_b", "x = 0, so y/x does not exist. atan2 never divides: it sees x = 0 and answers ±90° from the sign of y."),
    },
    {
      id: "origin", tone: "warn", when: r <= 0.15,
      title: tx(t, "figAtanI3_t", "No direction"),
      body: tx(t, "figAtanI3_b", "At the origin r = 0 and every angle names the same point. The direction is undefined; code usually gets 0 from atan2(0, 0), which means nothing."),
    },
  ];

  const title = tx(t, "figAtan_title", "Direction: arctan vs atan2");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<LabButton lab={lab} t={t} />}
        controls={controls}
        note={tx(t, "figAtan_note", "Drag the point. In quadrants I and IV (x > 0) both answers agree. Move it to the left half and arctan(y/x) points the red pointer straight away from the point: y/x is the same number for (x, y) and (−x, −y), so the division has thrown away the information about which side the point is on. atan2 takes y and x separately, checks their signs, and returns the correct angle anywhere, including straight up or down where x = 0 and the division would fail. Together with r it converts Cartesian (x, y) to polar (r, θ); the way back is x = r cos θ, y = r sin θ.")}
      >
        {view}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={controls}
        recap={[
          tx(t, "figAtanR1", "arctan(y/x) cannot tell a point from its mirror through the origin; it is off by 180° whenever x < 0."),
          tx(t, "figAtanR2", "atan2(y, x) uses both signs and covers the whole circle, (−180°, 180°], even where x = 0."),
          tx(t, "figAtanR3", "Polar (r, θ): r = √(x² + y²), θ = atan2(y, x); back with x = r cos θ, y = r sin θ."),
        ]}
      />
    </>
  );
}
