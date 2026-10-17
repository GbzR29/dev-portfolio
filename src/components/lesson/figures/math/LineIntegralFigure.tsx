"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, Handle, useDrag, useFrame, useVisible, clamp, nearest, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { Axes, FIELDS, FieldArrows, H, W, n2, pv, type Field } from "./vector/fields";

// ── What this figure shows ────────────────────────────────────────────────────
// The work ∫ F · dr along a path: the path is cut into many small steps dr,
// and each step adds F · dr, positive where the field pushes along the path
// (green) and negative where it pushes against it (red). Play sends a bead
// along the path with the running total. In "path" mode the curve from A to B
// bends through a draggable control point, and the straight segment from A to
// B is computed too: for a gradient field the two totals agree whatever the
// shape (only the end points matter), for the vortex they do not. In "loop"
// mode the path is a circle travelled counterclockwise: gradients give 0,
// the vortex gives curl × area. "Break it" adds |F| |dr| instead, ignoring
// the angle between force and motion.

type Mode = "path" | "loop";
const LIST = ["uniform", "source", "hills", "vortex", "shear", "whirl"] as const;
type Id = (typeof LIST)[number];
const N = 400;

type Curve = (u: number) => Pt;
const bez = (a: Pt, c: Pt, b: Pt): Curve => u => ({ x: (1 - u) ** 2 * a.x + 2 * u * (1 - u) * c.x + u * u * b.x, y: (1 - u) ** 2 * a.y + 2 * u * (1 - u) * c.y + u * u * b.y });
const circle = (c: Pt, rad: number): Curve => u => ({ x: c.x + rad * Math.cos(2 * Math.PI * u), y: c.y + rad * Math.sin(2 * Math.PI * u) });

/** Running work along the curve, sampled at N + 1 points (index k ↔ u = k/N). */
function workAlong(f: Field, curve: Curve, abs: boolean) {
  const run = [0], dots: number[] = [];
  let prev = curve(0);
  for (let k = 1; k <= N; k++) {
    const p = curve(k / N), mid = { x: (prev.x + p.x) / 2, y: (prev.y + p.y) / 2 }, F = f.F(mid.x, mid.y);
    const dx = p.x - prev.x, dy = p.y - prev.y;
    const d = abs ? Math.hypot(F.x, F.y) * Math.hypot(dx, dy) : F.x * dx + F.y * dy;
    dots.push(d / Math.max(1e-9, Math.hypot(dx, dy)));        // F · T, the push along the path
    run.push(run[k - 1] + d);
    prev = p;
  }
  return { run, dots };
}

function pathLength(curve: Curve) {
  let L = 0, p = curve(0);
  for (let k = 1; k <= 200; k++) { const q = curve(k / 200); L += Math.hypot(q.x - p.x, q.y - p.y); p = q; }
  return L;
}

type Geo = { a: Pt; b: Pt; c: Pt; centre: Pt; rad: number };

/** The svg; owns the drag of the handles (it is mounted twice while the lab is open). */
function LineStage({ field, mode, geo, setGeo, u, abs }: { field: Field; mode: Mode; geo: Geo; setGeo: (g: Geo) => void; u: number; abs: boolean }) {
  const handles: [string, Pt][] = mode === "path"
    ? [["a", geo.a], ["b", geo.b], ["c", geo.c]]
    : [["centre", geo.centre], ["rad", { x: geo.centre.x + geo.rad, y: geo.centre.y }]];
  const drag = useDrag<string>(
    q => nearest(q, handles.map(([k, p]) => [k, { x: pv.X(p.x), y: pv.Y(p.y) }] as [string, Pt]), 18),
    (k, q) => {
      const w = pv.inv(q), p = { x: clamp(w.x, -3.3, 3.3), y: clamp(w.y, -1.85, 1.85) };
      if (k === "rad") setGeo({ ...geo, rad: clamp(Math.hypot(p.x - geo.centre.x, p.y - geo.centre.y), 0.3, 1.8) });
      else setGeo({ ...geo, [k]: p });
    });
  const curve = mode === "path" ? bez(geo.a, geo.c, geo.b) : circle(geo.centre, geo.rad);
  const { run, dots } = workAlong(field, curve, abs);
  const maxDot = Math.max(1e-9, ...dots.map(Math.abs));
  const k = Math.round(u * N), bead = curve(k / N), Fb = field.F(bead.x, bead.y), mb = Math.hypot(Fb.x, Fb.y);
  const segs = Array.from({ length: N / 4 }, (_, j) => {
    const i = 4 * j, p = curve(i / N), q = curve(Math.min(N, i + 4) / N), s = dots[i] / maxDot;
    const col = abs ? C.amber : Math.abs(s) < 0.08 ? C.muted : s > 0 ? C.green : C.red;
    return <line key={i} x1={pv.X(p.x)} y1={pv.Y(p.y)} x2={pv.X(q.x)} y2={pv.Y(q.y)} stroke={col} strokeWidth={i / N <= u ? 4.6 : 2.4} strokeLinecap="round" opacity={i / N <= u ? 1 : 0.6} />;
  });
  // direction marks along the path
  const marks = [0.25, 0.5, 0.75].map(m => {
    const p = curve(m), q = curve(m + 0.01), dx = pv.X(q.x) - pv.X(p.x), dy = pv.Y(q.y) - pv.Y(p.y), L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const x = pv.X(p.x), y = pv.Y(p.y);
    return <path key={m} d={`M${x + ux * 6},${y + uy * 6} L${x - ux * 4 - uy * 5},${y - uy * 4 + ux * 5} L${x - ux * 4 + uy * 5},${y - uy * 4 - ux * 5} Z`} fill={C.fg} opacity={0.8} />;
  });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <Axes />
      <FieldArrows field={field} opacity={0.4} />
      {mode === "path" && <line x1={pv.X(geo.a.x)} y1={pv.Y(geo.a.y)} x2={pv.X(geo.b.x)} y2={pv.Y(geo.b.y)} stroke={C.sky} strokeWidth={1.6} strokeDasharray="5 5" />}
      {mode === "path" && <g stroke={C.muted} strokeWidth={1} strokeDasharray="2 4">
        <line x1={pv.X(geo.a.x)} y1={pv.Y(geo.a.y)} x2={pv.X(geo.c.x)} y2={pv.Y(geo.c.y)} />
        <line x1={pv.X(geo.b.x)} y1={pv.Y(geo.b.y)} x2={pv.X(geo.c.x)} y2={pv.Y(geo.c.y)} />
      </g>}
      {segs}
      {marks}
      {/* the bead and the field acting on it */}
      {mb > 1e-6 && <line x1={pv.X(bead.x)} y1={pv.Y(bead.y)} x2={pv.X(bead.x) + (Fb.x / mb) * 30} y2={pv.Y(bead.y) - (Fb.y / mb) * 30} stroke={C.purple} strokeWidth={2.4} />}
      <circle cx={pv.X(bead.x)} cy={pv.Y(bead.y)} r={6} fill={C.amber} stroke={C.bg} strokeWidth={2} />
      {handles.map(([kk, p]) => <Handle key={kk} x={pv.X(p.x)} y={pv.Y(p.y)} color={kk === "c" || kk === "rad" ? C.muted : C.sky} active={drag.dragging === kk} />)}
      {mode === "path" && <>
        <T x={pv.X(geo.a.x) + 9} y={pv.Y(geo.a.y) + 16} color={C.sky} bold size={11}>A</T>
        <T x={pv.X(geo.b.x) + 9} y={pv.Y(geo.b.y) + 16} color={C.sky} bold size={11}>B</T>
      </>}
      <T x={10} y={18} size={11} color={C.fg} bold>{`F = ${field.label}`}</T>
      <T x={10} y={H - 10} size={11} color={C.amber} bold>{`${abs ? "∫|F||dr|" : "∫F·dr"} = ${n2(run[k])}`}</T>
    </svg>
  );
}

export function LineIntegralFigure({ t }: { t?: TrackTranslations }) {
  const [id, setId] = useState<Id>("uniform");
  const [mode, setMode] = useState<Mode>("path");
  const [geo, setGeo] = useState<Geo>({ a: { x: -2.2, y: -1 }, b: { x: 2, y: 0.8 }, c: { x: -0.6, y: 1.6 }, centre: { x: 0.6, y: 0 }, rad: 1.2 });
  const [u, setU] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [abs, setAbs] = useState(false);
  const lab = useLab("math-line-integrals");
  const vis = useVisible<HTMLDivElement>();
  const field = FIELDS[id];

  const curve = mode === "path" ? bez(geo.a, geo.c, geo.b) : circle(geo.centre, geo.rad);
  const W1 = workAlong(field, curve, abs).run[N];
  const Wline = workAlong(field, bez(geo.a, { x: (geo.a.x + geo.b.x) / 2, y: (geo.a.y + geo.b.y) / 2 }, geo.b), abs).run[N];
  const potDiff = field.pot ? field.pot(geo.b.x, geo.b.y) - field.pot(geo.a.x, geo.a.y) : null;
  const length = pathLength(curve);
  const straight = Math.hypot(geo.b.x - geo.a.x, geo.b.y - geo.a.y);
  const aroundOrigin = mode === "loop" && Math.hypot(geo.centre.x, geo.centre.y) < geo.rad;

  useFrame(playing && (vis.on || lab.open), dt => {
    const next = u + dt / 3;
    if (next >= 1) { setU(1); setPlaying(false); } else setU(next);
  });
  const pick = (k: Id) => { setId(k); setU(1); setPlaying(false); };

  const view = (
    <div ref={vis.ref}>
      <LineStage field={field} mode={mode} geo={geo} setGeo={g => { setGeo(g); setU(1); }} u={u} abs={abs} />
      <Transport t={t} playing={playing}
        onPlay={() => { if (u >= 1) setU(0); setPlaying(v => !v); }}
        playLabel={tx(t, "figLi_play", "send the bead")}
        onStep={() => { setPlaying(false); setU(v => Math.min(1, v + 0.1)); }}
        onBack={() => { setPlaying(false); setU(v => Math.max(0, v - 0.1)); }}
        onReset={() => { setPlaying(false); setU(0); }}
        readout={`${Math.round(u * 100)}%`} />
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={m => { setMode(m); setU(1); }} options={[["path", tx(t, "figLi_mPath", "from A to B")], ["loop", tx(t, "figLi_mLoop", "closed loop")]] as const} />;
  const controls = <>
    <Row>
      {LIST.map(k => <Btn key={k} active={id === k} onClick={() => pick(k)}>{FIELDS[k].label}</Btn>)}
    </Row>
    <Row>
      <Btn active={abs} onClick={() => setAbs(v => !v)}>{tx(t, "figLi_break", "break it: add |F|·|dr|")}</Btn>
    </Row>
    <Row>
      <Readout color={C.amber}>{fill(mode === "path" ? tx(t, "figLi_wCurve", "work along the curve: {w}") : tx(t, "figLi_wLoop", "work round the loop: {w}"), { w: n2(W1) })}</Readout>
      {mode === "path" && <Readout color={C.sky}>{fill(tx(t, "figLi_wLine", "along the straight segment: {w}"), { w: n2(Wline) })}</Readout>}
      {mode === "path" && potDiff !== null && !abs && <Readout color={C.green}>{fill(tx(t, "figLi_pot", "f(B) − f(A) = {w}"), { w: n2(potDiff) })}</Readout>}
    </Row>
    <Row>
      <Readout>{fill(tx(t, "figLi_len", "length of the path: {l}"), { l: n2(length) })}</Readout>
      <Readout color={field.pot ? C.green : C.purple}>{field.pot ? tx(t, "figLi_cons", "a gradient field: only the end points matter") : tx(t, "figLi_notCons", "not a gradient field: the path matters")}</Readout>
    </Row>
  </>;
  const note = tx(t, "figLi_note", "The path is coloured by how the field acts on it: green where F pushes along the direction of travel, red where it pushes against it, grey where it pushes across. Drag A, B and the grey control point to reshape the path (the dashed blue line is the straight route for comparison), or switch to a closed loop and drag its centre and size. Play sends a bead along the path while the total grows.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figLiL1_t", "Work in a steady wind"),
      body: <>
        <p>{tx(t, "figLiL1_b1", "The field is uniform: the same push F = (1, 0.4) everywhere. Press play and watch the total grow along the curve.")}</p>
        <p>{tx(t, "figLiL1_b2", "Then drag the grey control point to make the path much longer.")}</p>
      </>,
      goal: { text: tx(t, "figLiL1_g", "A curve at least 1.5 times as long as the straight segment, with the same work."), done: id === "uniform" && mode === "path" && length > 1.5 * straight },
      setup: () => { pick("uniform"); setMode("path"); setAbs(false); },
    },
    {
      title: tx(t, "figLiL2_t", "Quick check"),
      body: <p>{tx(t, "figLiL2_b", "For a constant F, the work is F · (B − A): only the displacement counts.")}</p>,
      quiz: {
        q: tx(t, "figLiL2_q", "F = (1, 0.4). The path goes from (0, 0) to (2, −1), by any route. What is the work?"),
        options: ["1.6", "2.4", "2", tx(t, "figLiL2_o4", "it depends on the route")],
        answer: 0,
        why: tx(t, "figLiL2_w", "F · (2, −1) = 1·2 + 0.4·(−1) = 1.6."),
      },
    },
    {
      title: tx(t, "figLiL3_t", "When the route matters"),
      body: <p>{tx(t, "figLiL3_b", "Switch to the vortex (−y, x)/2. Bend the curve to go round the other side of the origin from the straight line and compare the two totals.")}</p>,
      goal: { text: tx(t, "figLiL3_g", "Vortex: the curve and the straight segment differ by more than 1."), done: id === "vortex" && mode === "path" && !abs && Math.abs(W1 - Wline) > 1 },
      hint: tx(t, "figLiL3_h", "Pull the control point far below the origin, so the curve passes on the other side."),
      setup: () => { pick("vortex"); setMode("path"); setAbs(false); },
    },
    {
      title: tx(t, "figLiL4_t", "Round a loop"),
      body: <p>{tx(t, "figLiL4_b", "Choose \"closed loop\". In the vortex every step of the circle goes with the flow, so the work is positive. Make the circle bigger.")}</p>,
      goal: { text: tx(t, "figLiL4_g", "Vortex loop of radius at least 1.5."), done: id === "vortex" && mode === "loop" && geo.rad >= 1.5 },
    },
    {
      title: tx(t, "figLiL5_t", "Quick check"),
      body: <p>{tx(t, "figLiL5_b", "For F = (−y, x)/2 round a circle of radius R: F has length R/2 and always points along the circle, whose length is 2πR.")}</p>,
      quiz: {
        q: tx(t, "figLiL5_q", "What is the work round the circle?"),
        options: ["πR²", "2πR", "0", "πR"],
        answer: 0,
        why: tx(t, "figLiL5_w", "(R/2) · 2πR = πR²: the curl, 1, times the area enclosed. The next chapter turns that into Green's theorem."),
      },
    },
    {
      title: tx(t, "figLiL6_t", "Gradients give zero round a loop"),
      body: <p>{tx(t, "figLiL6_b", "Switch to the hills field, a gradient. Move and resize the loop anywhere: the green and red parts cancel and the total stays 0.")}</p>,
      goal: { text: tx(t, "figLiL6_g", "A loop in the hills field: work 0."), done: id === "hills" && mode === "loop" && Math.abs(W1) < 0.01 },
      setup: () => { pick("hills"); setMode("loop"); },
    },
    {
      title: tx(t, "figLiL7_t", "Break it"),
      body: <p>{tx(t, "figLiL7_b", "Turn on \"add |F|·|dr|\": every step now counts as positive, whatever the angle. In the hills loop the total is no longer 0.")}</p>,
      goal: { text: tx(t, "figLiL7_g", "|F|·|dr| summed round the loop: clearly positive."), done: abs && mode === "loop" && W1 > 0.1 },
    },
    {
      title: tx(t, "figLiL8_t", "A hole in the plane"),
      body: <p>{tx(t, "figLiL8_b", "The whirl (−y, x)/(x² + y²) has zero curl away from the origin. Turn off the break-it, then put a loop round the origin, then one beside it.")}</p>,
      goal: { text: tx(t, "figLiL8_g", "Whirl loop around the origin: work 2π ≈ 6.28, whatever its size."), done: id === "whirl" && mode === "loop" && !abs && aroundOrigin },
      setup: () => { pick("whirl"); setMode("loop"); setAbs(false); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "abs", tone: "warn", when: abs,
      title: tx(t, "figLiI1_t", "Work is not force times distance"),
      body: tx(t, "figLiI1_b", "Only the part of F along the motion does work: F · dr = |F| |dr| cos θ. Ignoring the angle counts pushes against the motion, and sideways pushes, as if they helped."),
    },
    {
      id: "cons", tone: "ok", when: !abs && mode === "path" && potDiff !== null,
      title: tx(t, "figLiI2_t", "Path independence"),
      body: tx(t, "figLiI2_b", "F = ∇f, so the work is f(B) − f(A) for every path from A to B: the fundamental theorem for line integrals."),
    },
    {
      id: "hole", tone: "info", when: id === "whirl" && mode === "loop" && !abs,
      title: aroundOrigin ? tx(t, "figLiI3_t", "2π round the hole") : tx(t, "figLiI3_t2", "0 beside the hole"),
      body: tx(t, "figLiI3_b", "The curl is 0 everywhere the field is defined, yet a loop around the origin gives 2π. Zero curl only guarantees a potential in a region without holes; the origin is a hole."),
    },
  ];

  const title = tx(t, "figLi_title", "Work along a path");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<>{modeChoice}<LabButton lab={lab} t={t} /></>} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figLiR1", "The work along a path adds F · dr over tiny steps: only the push along the motion counts."),
          tx(t, "figLiR2", "For a gradient field F = ∇f the work is f(B) − f(A): the route does not matter and every loop gives 0."),
          tx(t, "figLiR3", "For other fields the route matters; round a loop the work measures the swirl inside."),
          tx(t, "figLiR4", "Zero curl gives a potential only where there are no holes: the whirl gives 2π round the origin."),
        ]}
      />
    </>
  );
}
