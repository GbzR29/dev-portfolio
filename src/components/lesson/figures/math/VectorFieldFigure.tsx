"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, Handle, useDrag, useFrame, useVisible, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { Axes, FIELDS, FieldArrows, H, W, curlAt, divAt, n2, pv, type Field } from "./vector/fields";

// ── What this figure shows ────────────────────────────────────────────────────
// A plane vector field as a grid of arrows, with dots carried along by it
// (play/pause). The draggable probe measures the field where it stands: the
// arrow F, the divergence (how much flows out of a tiny region, per unit
// area: the ring turns green for a source, red for a sink) and the curl (how
// much the flow circulates, per unit area: the paddle wheel spins
// counterclockwise when it is positive). The shear field is the surprise: all
// arrows point the same way, yet the wheel turns, because the flow is faster
// on one side of it than on the other.

const LIST = ["source", "vortex", "shear", "saddle", "spiral", "hills", "whirl"] as const;
type Id = (typeof LIST)[number];
const N = 150;
const R = 0.42;                                  // probe radius, world units

type Dot = { x: number; y: number; age: number; life: number };
const spawn = (): Dot => ({ x: pv.x0 + Math.random() * (pv.x1 - pv.x0), y: pv.y0 + Math.random() * (pv.y1 - pv.y0), age: 0, life: 2.5 + Math.random() * 3.5 });
const fresh = () => Array.from({ length: N }, spawn);

/** One time step for every dot (capped so the singular whirl cannot fling them). */
function advance(dots: Dot[], f: Field, dt: number) {
  return dots.map(d => {
    const F = f.F(d.x, d.y), m = Math.hypot(F.x, F.y), k = Math.min(1, 0.12 / Math.max(1e-9, m * dt));
    const x = d.x + F.x * dt * k, y = d.y + F.y * dt * k, age = d.age + dt;
    return age > d.life || x < pv.x0 || x > pv.x1 || y < pv.y0 || y > pv.y1 ? spawn() : { ...d, x, y, age };
  });
}

/** The svg; owns the probe drag (it is mounted twice while the lab is open). */
function FieldStage({ field, probe, setProbe, dots, angle }: { field: Field; probe: Pt; setProbe: (p: Pt) => void; dots: Dot[]; angle: number }) {
  const drag = useDrag<"p">(
    q => (Math.hypot(q.x - pv.X(probe.x), q.y - pv.Y(probe.y)) < 34 ? "p" : null),
    (_, q) => { const w = pv.inv(q); setProbe({ x: clamp(w.x, -3.1, 3.1), y: clamp(w.y, -1.6, 1.6) }); });
  const dv = divAt(field, probe.x, probe.y), cu = curlAt(field, probe.x, probe.y);
  const F = field.F(probe.x, probe.y), m = Math.hypot(F.x, F.y);
  const px = pv.X(probe.x), py = pv.Y(probe.y), rr = R * pv.sx;
  const ring = Math.abs(dv) < 0.01 ? C.muted : dv > 0 ? C.green : C.red;
  const L = Math.min(60, 26 + 26 * m);
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <Axes />
      <FieldArrows field={field} />
      {dots.map((d, i) => <circle key={i} cx={pv.X(d.x)} cy={pv.Y(d.y)} r={2.1} fill={C.sky} opacity={Math.min(1, d.age * 2, (d.life - d.age) * 2) * 0.9} />)}
      {/* the probe: ring for divergence, paddle wheel for curl */}
      <circle cx={px} cy={py} r={rr} fill={C.bg} fillOpacity={0.55} stroke={ring} strokeWidth={2.4} />
      {[0, 1, 2, 3].map(k => {
        const a = angle + (k * Math.PI) / 2;
        return <line key={k} x1={px} y1={py} x2={px + Math.cos(a) * rr * 0.82} y2={py - Math.sin(a) * rr * 0.82} stroke={Math.abs(cu) < 0.01 ? C.muted : C.purple} strokeWidth={2.6} strokeLinecap="round" />;
      })}
      {m > 1e-6 && (
        <g stroke={C.amber} fill={C.amber}>
          <line x1={px} y1={py} x2={px + (F.x / m) * L} y2={py - (F.y / m) * L} strokeWidth={2.4} />
          <circle cx={px + (F.x / m) * L} cy={py - (F.y / m) * L} r={3.4} />
        </g>
      )}
      <Handle x={px} y={py} color={C.amber} r={4.5} active={drag.dragging === "p"} />
      <T x={10} y={18} size={11} color={C.fg} bold>{`F = ${field.label}`}</T>
      <T x={10} y={H - 26} size={10.5} color={ring} bold>{`div F = ${n2(dv)}`}</T>
      <T x={10} y={H - 10} size={10.5} color={Math.abs(cu) < 0.01 ? C.muted : C.purple} bold>{`curl F = ${n2(cu)}`}</T>
    </svg>
  );
}

export function VectorFieldFigure({ t }: { t?: TrackTranslations }) {
  const [id, setId] = useState<Id>("source");
  const [probe, setProbe] = useState<Pt>({ x: 1.2, y: 0.6 });
  const [dots, setDots] = useState<Dot[]>(fresh);
  const [angle, setAngle] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visited, setVisited] = useState<string[]>(["source"]);
  const lab = useLab("math-vector-fields");
  const vis = useVisible<HTMLDivElement>();
  const field = FIELDS[id];
  const dv = divAt(field, probe.x, probe.y), cu = curlAt(field, probe.x, probe.y);

  useFrame(playing && (vis.on || lab.open), dt => {
    setDots(ds => advance(ds, field, dt));
    setAngle(a => a + cu * dt);                 // the wheel turns at ω = curl / 2; drawn twice as fast to be visible
  });
  const pick = (k: Id) => { setId(k); setDots(fresh()); setVisited(v => (v.includes(k) ? v : [...v, k])); };

  const view = (
    <div ref={vis.ref}>
      <FieldStage field={field} probe={probe} setProbe={setProbe} dots={dots} angle={angle} />
      <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)} playLabel={tx(t, "figVf_play", "let it flow")}
        onReset={() => setDots(fresh())} readout={`(${n2(probe.x, 1)}, ${n2(probe.y, 1)})`} />
    </div>
  );
  const F = field.F(probe.x, probe.y);
  const controls = <>
    <Row>
      {LIST.map(k => <Btn key={k} active={id === k} onClick={() => pick(k)}>{FIELDS[k].label}</Btn>)}
    </Row>
    <Row>
      <Readout color={C.amber}>{`F(${n2(probe.x, 1)}, ${n2(probe.y, 1)}) = (${n2(F.x)}, ${n2(F.y)})`}</Readout>
      <Readout color={Math.abs(dv) < 0.01 ? undefined : dv > 0 ? C.green : C.red}>{`div F = ∂P/∂x + ∂Q/∂y = ${n2(dv)}`}</Readout>
      <Readout color={Math.abs(cu) < 0.01 ? undefined : C.purple}>{`curl F = ∂Q/∂x − ∂P/∂y = ${n2(cu)}`}</Readout>
    </Row>
    <Row>
      <Readout>{Math.abs(dv) < 0.01
        ? tx(t, "figVf_noDiv", "as much flows in as out here")
        : dv > 0 ? tx(t, "figVf_src", "a source: more flows out than in") : tx(t, "figVf_sink", "a sink: more flows in than out")}</Readout>
      <Readout>{Math.abs(cu) < 0.01
        ? tx(t, "figVf_noCurl", "the wheel does not turn")
        : cu > 0 ? tx(t, "figVf_ccw", "the wheel turns counterclockwise") : tx(t, "figVf_cw", "the wheel turns clockwise")}</Readout>
    </Row>
  </>;
  const note = tx(t, "figVf_note", "Each arrow shows the direction of F at its point (longer means stronger); the blue dots drift along with the field. Drag the probe. Its ring is green where the divergence is positive (a source: more leaves than arrives), red where it is negative (a sink). Its paddle wheel spins counterclockwise where the curl is positive and clockwise where it is negative; the faster it turns, the larger the curl.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figVfL1_t", "Arrows everywhere"),
      body: <p>{tx(t, "figVfL1_b", "F = (x, y)/2 points away from the origin, and grows with distance. Drag the probe around: the ring stays green, because every small region loses more than it gains.")}</p>,
      goal: { text: tx(t, "figVfL1_g", "The probe moved to the left half."), done: id === "source" && probe.x < -0.5 },
      setup: () => { pick("source"); setProbe({ x: 1.2, y: 0.6 }); },
    },
    {
      title: tx(t, "figVfL2_t", "Quick check"),
      body: <p>{tx(t, "figVfL2_b", "For F = (P, Q) = (x/2, y/2): ∂P/∂x = 1/2 and ∂Q/∂y = 1/2.")}</p>,
      quiz: {
        q: tx(t, "figVfL2_q", "What is div F, and does it depend on the point?"),
        options: [tx(t, "figVfL2_o1", "1, the same everywhere"), tx(t, "figVfL2_o2", "it grows with the distance"), "0", tx(t, "figVfL2_o4", "1/2")],
        answer: 0,
        why: tx(t, "figVfL2_w", "1/2 + 1/2 = 1 at every point: the arrows are longer far away, but every unit of area produces the same outflow."),
      },
    },
    {
      title: tx(t, "figVfL3_t", "A whirlpool"),
      body: <p>{tx(t, "figVfL3_b", "Switch to F = (−y, x)/2. The dots circle the origin; drag the probe away from the centre and watch the wheel.")}</p>,
      goal: { text: tx(t, "figVfL3_g", "The vortex, with the probe at least 1 away from the origin: the wheel still turns."), done: id === "vortex" && Math.hypot(probe.x, probe.y) > 1 },
    },
    {
      title: tx(t, "figVfL4_t", "Straight arrows, turning wheel"),
      body: <>
        <p>{tx(t, "figVfL4_b1", "Now F = (0.6y, 0): every arrow is horizontal, so nothing seems to rotate.")}</p>
        <p>{tx(t, "figVfL4_b2", "Put the probe on the x-axis and look at the wheel.")}</p>
      </>,
      goal: { text: tx(t, "figVfL4_g", "Shear, probe near y = 0: the wheel turns clockwise."), done: id === "shear" && Math.abs(probe.y) < 0.3 },
      hint: tx(t, "figVfL4_h", "The flow above the wheel moves right, below it moves left: the wheel is pushed round."),
    },
    {
      title: tx(t, "figVfL5_t", "Quick check"),
      body: <p>{tx(t, "figVfL5_b", "For F = (0.6y, 0): P = 0.6y and Q = 0.")}</p>,
      quiz: {
        q: tx(t, "figVfL5_q", "What is curl F = ∂Q/∂x − ∂P/∂y?"),
        options: ["−0.6", "0", "0.6", "1.2"],
        answer: 0,
        why: tx(t, "figVfL5_w", "∂Q/∂x = 0 and ∂P/∂y = 0.6, so the curl is −0.6: clockwise, as the wheel showed."),
      },
    },
    {
      title: tx(t, "figVfL6_t", "A gradient never swirls"),
      body: <p>{tx(t, "figVfL6_b", "The hills field is the gradient of a landscape: it points uphill. Drag the probe anywhere: the curl stays 0, while the divergence changes sign between the hill and the hollow.")}</p>,
      goal: { text: tx(t, "figVfL6_g", "Hills field, probe where the divergence is negative (a red ring)."), done: id === "hills" && dv < -0.05 },
      hint: tx(t, "figVfL6_h", "Uphill arrows converge on a peak: try the top of the right-hand hill."),
      setup: () => { pick("hills"); setProbe({ x: -1.3, y: -0.3 }); },
    },
    {
      title: tx(t, "figVfL7_t", "Circling without curl"),
      body: <p>{tx(t, "figVfL7_b", "F = (−y, x)/(x² + y²) also circles the origin, but it is weaker far away. Keep the probe away from the centre: the wheel stands still. The flow goes round, yet no small region rotates.")}</p>,
      goal: { text: tx(t, "figVfL7_g", "The whirl, probe at least 1 from the origin: curl 0."), done: id === "whirl" && Math.hypot(probe.x, probe.y) > 1 && Math.abs(cu) < 0.02 },
      setup: () => { pick("whirl"); setProbe({ x: 1.5, y: 0.5 }); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "shear", tone: "info", when: id === "shear",
      title: tx(t, "figVfI1_t", "Rotation without circles"),
      body: tx(t, "figVfI1_b", "Curl measures rotation of a tiny wheel, not whether the flow lines are curved. In shear the flow lines are straight, but the speed changes across them, and that turns the wheel."),
    },
    {
      id: "whirl", tone: "info", when: id === "whirl",
      title: tx(t, "figVfI2_t", "Curved flow, zero curl"),
      body: tx(t, "figVfI2_b", "Here the flow lines are circles, yet the curl is 0 everywhere except at the origin, where the field is not defined. The faster inner flow and the slower outer flow cancel exactly."),
    },
    {
      id: "grad", tone: "ok", when: field.pot !== undefined && visited.length > 2,
      title: tx(t, "figVfI3_t", "A gradient field"),
      body: tx(t, "figVfI3_b", "This field is the gradient of a function, so its curl is 0 at every point: the mixed partial derivatives of the function are equal."),
    },
  ];

  const title = tx(t, "figVf_title", "A vector field: flow, divergence and curl");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<LabButton lab={lab} t={t} />} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view} controls={controls}
        recap={[
          tx(t, "figVfR1", "A vector field attaches an arrow F = (P, Q) to every point; things carried by it follow its flow lines."),
          tx(t, "figVfR2", "div F = ∂P/∂x + ∂Q/∂y: outflow per unit area; positive at sources, negative at sinks."),
          tx(t, "figVfR3", "curl F = ∂Q/∂x − ∂P/∂y: circulation per unit area; it spins a tiny paddle wheel."),
          tx(t, "figVfR4", "Curl is about speed changing across the flow: shear has curl, the whirl (−y, x)/r² has none away from 0, gradients never do."),
        ]}
      />
    </>
  );
}
