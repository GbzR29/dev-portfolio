"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, C, T, Vec, Handle, plot, useDrag, useFrame, useVisible, clamp, f2, type Plot, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A function of two variables drawn as a contour map: each coloured line joins
// the points where f has one particular value (blue low, orange high). At the
// draggable point P the gradient ∇f = (∂f/∂x, ∂f/∂y) is drawn in red: it points
// straight uphill and crosses the contour at a right angle. A chosen direction
// u (purple) gives the directional derivative ∇f · u, the slope felt walking
// that way; it is largest along ∇f and zero along the contour (green).
// The Transport walks P uphill: each step moves it by 0.15 · ∇f (gradient
// ascent), leaving a trail, until the gradient vanishes at a top.
// The lab: point u up the gradient, then along the contour, climb a hill,
// reach the other hill, and find the saddle's flat point.

type Key = "bowl" | "saddle" | "hills" | "waves";
const FNS: Record<Key, { label: string; f: (x: number, y: number) => number }> = {
  bowl: { label: "x² + y²", f: (x, y) => x * x + y * y },
  saddle: { label: "x² − y²", f: (x, y) => x * x - y * y },
  hills: { label: "two hills", f: (x, y) => 3 * Math.exp(-((x - 1.2) ** 2 + (y - 0.3) ** 2)) + 2 * Math.exp(-((x + 1.4) ** 2 + (y + 0.5) ** 2) / 0.7) },
  waves: { label: "sin x · cos y", f: (x, y) => Math.sin(x) * Math.cos(y) },
};

const W = 560, H = 300, NX = 70, NY = 38, LEVELS = 14;
const ETA = 0.15, MAX_STEP = 0.3, FLAT = 0.03;           // gradient-ascent step size, its cap, and "flat enough"
const START: Pt = { x: 0.2, y: -0.4 };
const s2 = (v: number) => f2(v, 2).replace("-", "−");
const pr = plot({ W, H, x0: -3.5, x1: 3.5, y0: -1.875, y1: 1.875 });
const inBox = (q: Pt) => ({ x: clamp(q.x, -3.3, 3.3), y: clamp(q.y, -1.7, 1.7) });

/** ∇f at q by central differences. */
function grad(f: (x: number, y: number) => number, q: Pt) {
  const h = 1e-4;
  return { x: (f(q.x + h, q.y) - f(q.x - h, q.y)) / (2 * h), y: (f(q.x, q.y + h) - f(q.x, q.y - h)) / (2 * h) };
}
/** One gradient-ascent step from q, capped in length and kept inside the map. */
function ascend(f: (x: number, y: number) => number, q: Pt) {
  const g = grad(f, q), len = Math.hypot(g.x, g.y), k = len * ETA > MAX_STEP ? MAX_STEP / len : ETA;
  return inBox({ x: q.x + k * g.x, y: q.y + k * g.y });
}

/** Contour segments by marching squares, each tagged with its level (0..1). */
function contours(p: Plot, f: (x: number, y: number) => number) {
  const xs = Array.from({ length: NX + 1 }, (_, i) => p.x0 + ((p.x1 - p.x0) * i) / NX);
  const ys = Array.from({ length: NY + 1 }, (_, j) => p.y0 + ((p.y1 - p.y0) * j) / NY);
  const v = ys.map(y => xs.map(x => f(x, y)));
  let lo = Infinity, hi = -Infinity;
  for (const row of v) for (const z of row) { lo = Math.min(lo, z); hi = Math.max(hi, z); }
  const segs: { d: string; s: number }[] = [];
  for (let k = 1; k < LEVELS; k++) {
    const c = lo + ((hi - lo) * k) / LEVELS;
    let d = "";
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      // corners counter-clockwise from bottom-left, and the edges between them
      const q: [number, number, number][] = [[xs[i], ys[j], v[j][i]], [xs[i + 1], ys[j], v[j][i + 1]], [xs[i + 1], ys[j + 1], v[j + 1][i + 1]], [xs[i], ys[j + 1], v[j + 1][i]]];
      const pts: [number, number][] = [];
      for (let e = 0; e < 4; e++) {
        const [ax, ay, az] = q[e], [bx, by, bz] = q[(e + 1) % 4];
        if ((az < c) !== (bz < c)) { const u = (c - az) / (bz - az); pts.push([ax + (bx - ax) * u, ay + (by - ay) * u]); }
      }
      for (let pp = 0; pp + 1 < pts.length; pp += 2)
        d += `M${p.X(pts[pp][0]).toFixed(1)},${p.Y(pts[pp][1]).toFixed(1)}L${p.X(pts[pp + 1][0]).toFixed(1)},${p.Y(pts[pp + 1][1]).toFixed(1)}`;
    }
    segs.push({ d, s: k / LEVELS });
  }
  return segs;
}

// ── The drawing ───────────────────────────────────────────────────────────────

/** The contour map; owns the drag (it is mounted twice while the lab is open). */
function GradStage({ k, trail, ang, setP }: { k: Key; trail: Pt[]; ang: number; setP: (q: Pt) => void }) {
  const f = FNS[k].f;
  const segs = useMemo(() => contours(pr, f), [f]);
  const drag = useDrag<"p">(q => { setP(inBox(pr.inv(q))); return "p"; }, (_, q) => setP(inBox(pr.inv(q))));
  const p = trail[trail.length - 1];
  const g = grad(f, p), gl = Math.hypot(g.x, g.y);
  const th = (ang * Math.PI) / 180, ux = Math.cos(th), uy = Math.sin(th);
  const P = { x: pr.X(p.x), y: pr.Y(p.y) };
  const gs = gl > 1e-6 ? Math.min(1.4, 0.35 + 0.35 * gl) / gl : 0;          // arrow length in world units, capped
  const tip = (dx: number, dy: number) => ({ x: pr.X(p.x + dx), y: pr.Y(p.y + dy) });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair">
      <line x1={0} x2={W} y1={pr.Y(0)} y2={pr.Y(0)} stroke={C.axis} strokeWidth={1} />
      <line y1={0} y2={H} x1={pr.X(0)} x2={pr.X(0)} stroke={C.axis} strokeWidth={1} />
      {segs.map((sg, i) => <path key={i} d={sg.d} fill="none" stroke={`hsl(${205 - 180 * sg.s} 80% 52%)`} strokeWidth={1.3} opacity={0.85} />)}
      {trail.length > 1 && <polyline points={trail.map(q => `${pr.X(q.x).toFixed(1)},${pr.Y(q.y).toFixed(1)}`).join(" ")} fill="none" stroke={C.fg} strokeWidth={1.6} strokeDasharray="2 3" />}
      {trail.slice(0, -1).map((q, i) => <circle key={i} cx={pr.X(q.x)} cy={pr.Y(q.y)} r={2.2} fill={C.fg} opacity={0.6} />)}
      {gl > 1e-6 && <line x1={pr.X(p.x - (0.9 * -g.y) / gl)} y1={pr.Y(p.y - (0.9 * g.x) / gl)} x2={pr.X(p.x + (0.9 * -g.y) / gl)} y2={pr.Y(p.y + (0.9 * g.x) / gl)} stroke={C.green} strokeWidth={2} strokeDasharray="5 4" />}
      <Vec a={P} b={tip(ux * 0.9, uy * 0.9)} color={C.purple} w={2} />
      {gl > 1e-6 && <Vec a={P} b={tip(g.x * gs, g.y * gs)} color={C.red} w={2.6} />}
      <Handle x={P.x} y={P.y} color={C.fg} active={drag.dragging === "p"} />
      <T x={P.x + 8} y={P.y + 16} color={C.fg} bold>P</T>
      {gl > 1e-6 && <T x={pr.X(p.x + g.x * gs) + 4} y={pr.Y(p.y + g.y * gs) - 4} color={C.red} bold>∇f</T>}
    </svg>
  );
}

export function GradientFigure({ t }: { t?: TrackTranslations }) {
  const [key, setKey] = useState<Key>("hills");
  const [trail, setTrail] = useState<Pt[]>([START]);   // where P has been; the last entry is P
  const [ang, setAng] = useState(30);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);                                 // time since the last automatic step
  const lab = useLab("math-gradient");
  const vis = useVisible<HTMLDivElement>();

  const f = FNS[key].f;
  const p = trail[trail.length - 1];
  const g = grad(f, p), gl = Math.hypot(g.x, g.y);
  const flat = gl < FLAT;
  useFrame(playing && (vis.on || lab.open), dt => {
    if (flat || trail.length > 80) { setPlaying(false); return; }
    acc.current += dt;
    if (acc.current > 0.25) { acc.current = 0; setTrail(s => [...s, ascend(f, s[s.length - 1])]); }
  });

  const stop = () => setPlaying(false);
  const setP = (q: Pt) => { stop(); setTrail([q]); };
  const choose = (k: Key) => { setKey(k); stop(); setTrail(s => [s[s.length - 1]]); };
  const th = (ang * Math.PI) / 180, ux = Math.cos(th), uy = Math.sin(th);
  const du = g.x * ux + g.y * uy;
  // the angle between u and ∇f, in degrees (0 = along it)
  const off = gl > 1e-6 ? Math.abs(((((ang - (Math.atan2(g.y, g.x) * 180) / Math.PI) % 360) + 540) % 360) - 180) : 90;

  const view = (
    <div>
      <GradStage k={key} trail={trail} ang={ang} setP={setP} />
      <Transport t={t} playing={playing}
        onPlay={() => { acc.current = 0; setPlaying(q => !q); }}
        playLabel={tx(t, "figGrad_climb", "climb along the gradient")}
        onStep={() => { stop(); setTrail(s => [...s, ascend(f, s[s.length - 1])]); }}
        onBack={() => { stop(); setTrail(s => (s.length > 1 ? s.slice(0, -1) : s)); }}
        onReset={() => { stop(); setTrail(s => [s[0]]); }}
        readout={`${tx(t, "figGrad_steps", "steps")}: ${trail.length - 1} · f = ${s2(f(p.x, p.y))}`} />
    </div>
  );
  const fnChoice = <>{(Object.keys(FNS) as Key[]).map(k => <Btn key={k} active={key === k} onClick={() => choose(k)}>{k === "hills" ? tx(t, "figGrad_hills", "two hills") : FNS[k].label}</Btn>)}</>;
  const controls = <>
    <Slider label={tx(t, "figGrad_dir", "direction u")} value={ang} min={-180} max={180} step={1} onChange={setAng} fmt={v => `${v}°`} />
    <Row>
      <Readout>{`P = (${s2(p.x)}, ${s2(p.y)})  f = ${s2(f(p.x, p.y))}`}</Readout>
      <Readout color={C.red}>{`∇f = (${s2(g.x)}, ${s2(g.y)})  |∇f| = ${s2(gl)}`}</Readout>
      <Readout color={C.purple}>{`∇f · u = ${s2(du)}`}</Readout>
    </Row>
  </>;
  const note = <>
    {tx(t, "figGrad_note2", "Each line is a level curve: f has the same value all along it, like a contour line on a hiking map. The red gradient arrow points uphill by the steepest route and always crosses the contour at a right angle; its length is the steepest slope. Turn the purple direction u: the slope ∇f · u is largest along the gradient, zero along the green contour direction, and most negative straight downhill. Press ⏭ to step P uphill along the gradient, or play to keep climbing: the steps shrink as the ground flattens, and stop at a top.")}{" "}
    <span data-mouse-only>{tx(t, "figGrad_drag", "Click or drag to move P.")}</span>
    <span data-touch-only>{tx(t, "figGrad_dragTouch", "Tap or drag to move P.")}</span>
  </>;

  // ── Lab ──
  const top = trail.length > 1 && flat;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figGradL1_t", "Steepest uphill"),
      body: <>
        <p>{tx(t, "figGradL1_b1", "The red arrow is the gradient at P. The purple arrow u is a direction you choose; ∇f · u is the slope you would feel walking that way.")}</p>
        <p>{tx(t, "figGradL1_b2", "Turn u until that slope is as large as it can be.")}</p>
      </>,
      goal: { text: fill(tx(t, "figGradL1_g", "∇f · u = |∇f| (u within 3° of ∇f; now {d}°)."), { d: Math.round(off) }), done: key === "hills" && gl > 0.1 && off < 3 },
      hint: tx(t, "figGradL1_h", "Point u the same way as the red arrow."),
      setup: () => { choose("hills"); setTrail([START]); setAng(150); },
    },
    {
      title: tx(t, "figGradL2_t", "A level walk"),
      body: <>
        <p>{tx(t, "figGradL2_b1", "Now find a direction in which the height does not change at all.")}</p>
      </>,
      goal: { text: fill(tx(t, "figGradL2_g", "∇f · u = 0 (to 0.03; now {s})."), { s: s2(du) }), done: key === "hills" && gl > 0.1 && Math.abs(du) < 0.03 },
      hint: tx(t, "figGradL2_h", "At right angles to the red arrow, along the green dashed contour: 90° away."),
    },
    {
      title: tx(t, "figGradL3_t", "Quick check"),
      body: <p>{tx(t, "figGradL3_b", "At some point |∇f| = 5. You walk in a direction 60° away from the gradient.")}</p>,
      quiz: {
        q: tx(t, "figGradL3_q", "What slope do you feel?"),
        options: ["2.5", "5", "4.33", "0"],
        answer: 0,
        why: tx(t, "figGradL3_w", "∇f · u = |∇f| cos θ = 5 · cos 60° = 5 · 0.5 = 2.5. 4.33 is 5 · sin 60°."),
      },
    },
    {
      title: tx(t, "figGradL4_t", "Climb the hill"),
      body: <>
        <p>{tx(t, "figGradL4_b1", "Gradient ascent: take a small step along ∇f, look again, repeat. The steps shrink as the slope eases off.")}</p>
        <p>{tx(t, "figGradL4_b2", "Climb from P until the ground is flat.")}</p>
      </>,
      goal: { text: tx(t, "figGradL4_g", "|∇f| < 0.03 after climbing."), done: key === "hills" && top },
      focus: "play",
      setup: () => { choose("hills"); setTrail([START]); },
    },
    {
      title: tx(t, "figGradL5_t", "The other hill"),
      body: <>
        <p>{tx(t, "figGradL5_b1", "Gradient ascent only finds the top nearest to where it starts. The smaller hill is on the left.")}</p>
        <p>{tx(t, "figGradL5_b2", "Drag P to a new start and climb to the left-hand top.")}</p>
      </>,
      goal: { text: tx(t, "figGradL5_g", "A top with x < 0."), done: key === "hills" && top && p.x < 0 },
      hint: tx(t, "figGradL5_h", "Start anywhere left of x ≈ −0.3, for example (−2, 0)."),
    },
    {
      title: tx(t, "figGradL6_t", "Flat, but not a top"),
      body: <>
        <p>{tx(t, "figGradL6_b1", "On the saddle x² − y² the ground rises along x and falls along y.")}</p>
        <p>{tx(t, "figGradL6_b2", "Put P where the gradient vanishes.")}</p>
      </>,
      goal: { text: tx(t, "figGradL6_g", "|∇f| < 0.05 on the saddle."), done: key === "saddle" && gl < 0.05 },
      hint: tx(t, "figGradL6_h", "∇f = (2x, −2y) is zero only at the origin."),
      setup: () => { choose("saddle"); setTrail([{ x: 1.5, y: 1 }]); },
    },
    {
      title: tx(t, "figGradL7_t", "Quick check"),
      body: <p>{tx(t, "figGradL7_b", "f = x³ − 3x + y² has a critical point at (−1, 0), with fₓₓ = −6, f_yy = 2, fₓᵧ = 0.")}</p>,
      quiz: {
        q: tx(t, "figGradL7_q", "What kind of point is it?"),
        options: [tx(t, "figGradL7_o1", "a saddle"), tx(t, "figGradL7_o2", "a minimum"), tx(t, "figGradL7_o3", "a maximum"), tx(t, "figGradL7_o4", "the test says nothing")],
        answer: 0,
        why: tx(t, "figGradL7_w", "D = fₓₓ f_yy − fₓᵧ² = −6 · 2 − 0 = −12 < 0: it bends down along x and up along y, a saddle."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "steep", tone: "ok", when: gl > 0.1 && off < 3,
      title: tx(t, "figGradI1_t", "Steepest ascent"),
      body: fill(tx(t, "figGradI1_b", "u points along ∇f, so cos θ = 1 and the slope is the gradient's full length, {g}. No direction climbs faster."), { g: s2(gl) }),
    },
    {
      id: "level", tone: "info", when: gl > 0.1 && Math.abs(du) < 0.03,
      title: tx(t, "figGradI2_t", "Along the contour"),
      body: tx(t, "figGradI2_b", "u is at right angles to ∇f, so ∇f · u = 0: walking this way the height does not change. That is the direction of the contour line, which is why the gradient is perpendicular to it."),
    },
    {
      id: "down", tone: "warn", when: gl > 0.1 && off > 177,
      title: tx(t, "figGradI3_t", "Straight downhill"),
      body: tx(t, "figGradI3_b", "u points against ∇f: cos θ = −1, the steepest descent, the way water would run. Gradient descent, used to train neural networks, steps this way."),
    },
    {
      id: "top", tone: "ok", when: top && key !== "saddle",
      title: tx(t, "figGradI4_t", "A top"),
      body: fill(tx(t, "figGradI4_b", "After {n} steps the gradient has vanished at f = {f}. Gradient ascent stops at the nearest top, which need not be the highest one."), { n: trail.length - 1, f: s2(f(p.x, p.y)) }),
    },
    {
      id: "flat", tone: "info", when: gl < 0.05 && key === "saddle",
      title: tx(t, "figGradI5_t", "Flat, yet a saddle"),
      body: tx(t, "figGradI5_b", "∇f = 0 here, but this is no top: uphill along x, downhill along y. The second-derivative test tells them apart: D = 2 · (−2) − 0 = −4 < 0."),
    },
  ];

  const title = tx(t, "figGrad_title", "Contours and the gradient");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{fnChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{fnChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figGradR1", "∇f points uphill by the steepest route; its length is that slope."),
          tx(t, "figGradR2", "The slope along a unit vector u is ∇f · u = |∇f| cos θ: zero along contours, so ∇f is perpendicular to them."),
          tx(t, "figGradR3", "Stepping along ∇f again and again climbs to the nearest top, where ∇f = 0."),
          tx(t, "figGradR4", "∇f = 0 can also be a saddle; the second-derivative test decides."),
        ]}
      />
    </>
  );
}
