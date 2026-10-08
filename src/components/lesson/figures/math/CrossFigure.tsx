"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, Vec, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { type V3, cross, len, makeProjector, useOrbit, fmtV } from "@/components/lesson/kit/scene3d";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// a × b in 3D (y up, right-handed). a lies along x; b is set by its angle θ
// from a (around the vertical axis) and an elevation. The cross product is
// perpendicular to both, its length is the area of the parallelogram they
// span, |a||b|sin θ, and swapping the order flips it. Drag to orbit.
// The Transport sweeps θ from 0° to 180°: the area grows, peaks at 90° and
// shrinks back to zero.
// The lab: the largest area, a vanishing product, the order, a tilted b, then
// an exact area from the lengths.

const W = 560, H = 320;
const DEG = Math.PI / 180;
const STEP = 15;                    // degrees per Transport step
const dot3 = (u: V3, v: V3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

/** a along x; b at angle θ from a around the vertical axis, tilted up by the elevation. */
function vectors(theta: number, elev: number, la: number, lb: number) {
  const th = theta * DEG, el = elev * DEG;
  const a: V3 = [la, 0, 0];
  const b: V3 = [lb * Math.cos(th) * Math.cos(el), lb * Math.sin(el), -lb * Math.sin(th) * Math.cos(el)];
  return { a, b };
}

// ── The drawing ───────────────────────────────────────────────────────────────

/** The orbiting svg; owns its orbit (it is mounted twice while the lab is open). */
function CrossStage({ a, b, swap, t }: { a: V3; b: V3; swap: boolean; t?: TrackTranslations }) {
  const { orbit, handlers, ref, reset } = useOrbit({ yaw: -0.55, pitch: 0.42, zoom: 1 });
  const P = makeProjector(orbit, W / 2, H / 2 + 55, 46);
  const c = swap ? cross(b, a) : cross(a, b);
  const O = P([0, 0, 0]);
  // Long results are drawn shortened so the arrow stays in view (the readout keeps the true value)
  const lc = len(c), shown = lc > 3.2 ? 3.2 / lc : 1;
  const pa = P(a), pb = P(b), pab = P([a[0] + b[0], a[1] + b[1], a[2] + b[2]]), pc = P([c[0] * shown, c[1] * shown, c[2] * shown]);
  const grid = groundGrid();

  return (
    <div className="relative">
      <svg ref={ref} {...handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab" style={{ touchAction: "none" }}>
        {grid.map(([u, v], i) => { const p0 = P(u), p1 = P(v); return <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={C.grid} />; })}
        {([[[3.4, 0, 0], "x", C.red], [[0, 3, 0], "y", C.green], [[0, 0, 3.4], "z", C.sky]] as [V3, string, string][]).map(([v, n, col]) => {
          const q = P(v);
          return <g key={n}><line x1={O.x} y1={O.y} x2={q.x} y2={q.y} stroke={col} strokeOpacity={0.35} /><T x={q.x + 4} y={q.y} size={9} color={col}>{n}</T></g>;
        })}
        <polygon points={[O, pa, pab, pb].map(q => `${q.x},${q.y}`).join(" ")} fill={C.purple} fillOpacity={0.18} stroke={C.purple} strokeOpacity={0.5} />
        <Vec a={O} b={pa} color={C.red} w={2.6} />
        <Vec a={O} b={pb} color={C.sky} w={2.6} />
        {lc > 0.02 && <Vec a={O} b={pc} color={C.amber} w={3} head={9} />}
        <T x={pa.x + 6} y={pa.y + 12} size={11} bold color={C.red}>a</T>
        <T x={pb.x + 6} y={pb.y - 4} size={11} bold color={C.sky}>b</T>
        {lc > 0.02 && <T x={pc.x + 6} y={pc.y} size={11} bold color={C.amber}>{`${swap ? "b × a" : "a × b"}${shown < 1 ? ` (${tx(t, "figCross_scaled", "drawn at")} ${Math.round(shown * 100)}%)` : ""}`}</T>}
      </svg>
      <div className="absolute top-2 right-2"><Btn onClick={reset}>{tx(t, "figCross_view", "reset view")}</Btn></div>
    </div>
  );
}

function groundGrid() {
  const grid: [V3, V3][] = [];
  for (let i = -3; i <= 3; i++) { grid.push([[i, 0, -3], [i, 0, 3]]); grid.push([[-3, 0, i], [3, 0, i]]); }
  return grid;
}

export function CrossFigure({ t }: { t?: TrackTranslations }) {
  const [rawTheta, setTheta] = useState(70);
  const [elev, setElev] = useState(0);
  const [la, setLa] = useState(2.2);
  const [lb, setLb] = useState(1.8);
  const [swap, setSwap] = useState(false);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-cross");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && (vis.on || lab.open), dt => {
    const next = rawTheta + dt * 40;
    if (next >= 180) { setTheta(180); setPlaying(false); } else setTheta(next);
  });

  const theta = Math.round(rawTheta);
  const turnTo = (d: number) => { setPlaying(false); setTheta(Math.max(0, Math.min(180, d))); };
  const { a, b } = vectors(theta, elev, la, lb);
  const c = swap ? cross(b, a) : cross(a, b);
  const area = len(cross(a, b));
  const angle = Math.acos(Math.max(-1, Math.min(1, dot3(a, b) / (la * lb)))) / DEG;

  const view = (
    <div>
      <CrossStage a={a} b={b} swap={swap} t={t} />
      <Transport t={t} playing={playing}
        onPlay={() => { if (!playing && theta >= 180) setTheta(0); setPlaying(q => !q); }}
        playLabel={tx(t, "figCross_sweep", "sweep the angle")}
        onStep={() => turnTo((Math.floor(theta / STEP) + 1) * STEP)}
        onBack={() => turnTo((Math.ceil(theta / STEP) - 1) * STEP)}
        onReset={() => turnTo(0)}
        readout={`θ = ${theta}° · |a × b| = ${area.toFixed(2)}`} />
    </div>
  );
  const swapBtn = <Btn active={swap} onClick={() => setSwap(s => !s)}>{swap ? "b × a" : "a × b"}</Btn>;
  const controls = <>
    <Sliders>
      <Slider label={tx(t, "figCross_theta", "angle a→b")} value={theta} min={0} max={180} step={1} onChange={turnTo} fmt={v => `${v}°`} />
      <Slider label={tx(t, "figCross_elev", "b elevation")} value={elev} min={-60} max={60} step={1} onChange={setElev} fmt={v => `${v}°`} />
      <Slider label="|a|" value={la} min={0.5} max={3} step={0.1} onChange={setLa} />
      <Slider label="|b|" value={lb} min={0.5} max={3} step={0.1} onChange={setLb} />
    </Sliders>
    <Row>
      <Readout color={C.red}>a = {fmtV(a)}</Readout>
      <Readout color={C.sky}>b = {fmtV(b)}</Readout>
      <Readout color={C.amber}>{swap ? "b × a" : "a × b"} = {fmtV(c)}</Readout>
      <Readout color={C.purple}>|a × b| = |a||b| sin θ = {area.toFixed(2)} ({tx(t, "figCross_angle", "θ")} = {angle.toFixed(0)}°)</Readout>
    </Row>
  </>;

  // ── Lab ──
  const most = la * lb;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figCrossL1_t", "Watch the area"),
      body: <>
        <p>{tx(t, "figCrossL1_b1", "b starts on top of a. The purple parallelogram is flat and a × b is the zero vector.")}</p>
        <p>{tx(t, "figCrossL1_b2", "Sweep the angle with ⏭ and stop where the area is largest.")}</p>
      </>,
      goal: { text: tx(t, "figCrossL1_g", "θ = 90°: |a × b| = |a||b|."), done: theta === 90 && elev === 0 },
      hint: tx(t, "figCrossL1_h", "sin θ is largest, 1, at a right angle: six steps of 15°."),
      focus: "step",
      setup: () => { setTheta(0); setElev(0); setLa(2.2); setLb(1.8); setSwap(false); setPlaying(false); },
    },
    {
      title: tx(t, "figCrossL2_t", "Quick check"),
      body: <p>{tx(t, "figCrossL2_b", "|a| = 2 and |b| = 3, with 30° between them. sin 30° = 1/2.")}</p>,
      quiz: {
        q: tx(t, "figCrossL2_q", "How long is a × b?"),
        options: ["3", "6", "5.2", "1.5"],
        answer: 0,
        why: tx(t, "figCrossL2_w", "|a||b| sin θ = 2 · 3 · ½ = 3, the parallelogram's area. 5.2 = 6 cos 30° is the dot product: cosine for the dot, sine for the cross."),
      },
    },
    {
      title: tx(t, "figCrossL3_t", "Gone flat"),
      body: <>
        <p>{tx(t, "figCrossL3_b1", "Keep sweeping past 90°: the area shrinks again.")}</p>
        <p>{tx(t, "figCrossL3_b2", "Make a and b point in opposite directions.")}</p>
      </>,
      goal: { text: tx(t, "figCrossL3_g", "θ = 180°: a × b = 0."), done: theta === 180 && elev === 0 },
    },
    {
      title: tx(t, "figCrossL4_t", "The order matters"),
      body: <>
        <p>{tx(t, "figCrossL4_b1", "Right hand: fingers along a, curl toward b, the thumb is a × b.")}</p>
        <p>{tx(t, "figCrossL4_b2", "Swap the order and watch the amber arrow.")}</p>
      </>,
      goal: { text: tx(t, "figCrossL4_g", "Show b × a."), done: swap && area > 0.5 },
      setup: () => { setTheta(70); setElev(0); setSwap(false); },
    },
    {
      title: tx(t, "figCrossL5_t", "Always perpendicular"),
      body: <>
        <p>{tx(t, "figCrossL5_b1", "Lift b out of the floor. The product must stay perpendicular to both a and b, so it has to tilt.")}</p>
        <p>{tx(t, "figCrossL5_b2", "Raise b by at least 45° and orbit the view to check the right angles.")}</p>
      </>,
      goal: { text: tx(t, "figCrossL5_g", "Elevation ≥ 45°."), done: elev >= 45 },
    },
    {
      title: tx(t, "figCrossL6_t", "An exact area"),
      body: <>
        <p>{tx(t, "figCrossL6_b1", "At a right angle the area is simply |a| times |b|.")}</p>
        <p>{tx(t, "figCrossL6_b2", "Make a parallelogram of area exactly 6.")}</p>
      </>,
      goal: { text: tx(t, "figCrossL6_g", "|a × b| = 6."), done: Math.abs(area - 6) < 0.01 },
      hint: tx(t, "figCrossL6_h", "θ = 90°, elevation 0, |a| = 3 and |b| = 2."),
      setup: () => { setElev(0); setSwap(false); },
    },
    {
      title: tx(t, "figCrossL7_t", "Quick check"),
      body: <p>{tx(t, "figCrossL7_b", "In right-handed axes x̂ × ŷ = ẑ.")}</p>,
      quiz: {
        q: tx(t, "figCrossL7_q", "What is ŷ × x̂?"),
        options: ["−ẑ", "ẑ", "0", "x̂"],
        answer: 0,
        why: tx(t, "figCrossL7_w", "Swapping the order flips the result: ŷ × x̂ = −(x̂ × ŷ) = −ẑ. The product is 0 only for parallel vectors."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "flat", tone: "warn", when: area < 0.01,
      title: tx(t, "figCrossI1_t", "No area, no direction"),
      body: tx(t, "figCrossI1_b", "a and b lie on one line, so the parallelogram is flat and sin θ = 0. Every direction across the line is perpendicular to both, so the product cannot pick one: it is the zero vector."),
    },
    {
      id: "max", tone: "ok", when: Math.abs(angle - 90) < 0.5,
      title: tx(t, "figCrossI2_t", "As big as it gets"),
      body: fill(tx(t, "figCrossI2_b", "At 90° sin θ = 1, so |a × b| = |a||b| = {m}: the parallelogram is a rectangle."), { m: most.toFixed(2) }),
    },
    {
      id: "swap", tone: "info", when: swap && area > 0.01,
      title: tx(t, "figCrossI3_t", "Opposite thumb"),
      body: tx(t, "figCrossI3_b", "b × a has the same length and points the other way: b × a = −(a × b). The cross product is not commutative."),
    },
    {
      id: "tilt", tone: "info", when: Math.abs(elev) >= 20 && area > 0.01,
      title: tx(t, "figCrossI4_t", "Still at right angles"),
      body: fill(tx(t, "figCrossI4_b", "(a × b) · a = {da} and (a × b) · b = {db}: zero both times, whatever the tilt."), { da: dot3(c, a).toFixed(2), db: dot3(c, b).toFixed(2) }),
    },
  ];

  const title = tx(t, "figCross_title", "The cross product in 3D");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{swapBtn}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={tx(t, "figCross_note2", "Drag to orbit the view, or press play to sweep the angle. The amber arrow is perpendicular to both a and b, and its length equals the area of the purple parallelogram they span, |a||b| sin θ: largest at 90°, zero when a and b are parallel (0° or 180°), because a flat parallelogram has no area and there is no unique perpendicular direction. Its direction follows the right-hand rule: point your right hand's fingers along a, curl them toward b, and the thumb gives a × b. Swap the order: the arrow flips, because b × a = −(a × b). Tilt b up with the elevation slider: the result tilts too, always staying perpendicular to both.")}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{swapBtn}</Row>{controls}</>}
        recap={[
          tx(t, "figCrossR1", "a × b is perpendicular to both a and b."),
          tx(t, "figCrossR2", "Its length |a||b| sin θ is the parallelogram's area: largest at 90°, zero for parallel vectors."),
          tx(t, "figCrossR3", "Right-hand rule; swapping the order flips it: b × a = −(a × b)."),
        ]}
      />
    </>
  );
}
