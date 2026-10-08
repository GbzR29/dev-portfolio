"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Vec, Handle, plot, Grid, useDrag, useFrame, useVisible, nearest, f2, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The basic vector operations, with draggable arrows:
//   add       a + b: tip to tail, and the parallelogram that shows a + b = b + a
//   subtract  b − a: the arrow from a's tip to b's tip ("from a to b")
//   scale     k·a: same line, length × |k|, flipped when k < 0
//   normalize a / |a|: same direction, length 1 (on the unit circle)
//   target    a walker heading for a goal: direction = normalize(G − W).
//             The Transport makes the walker walk at the chosen speed.
// The lab: a sum, the triangle inequality, "to minus from", a reversed
// stretch, the zero vector, then the walk to the goal.

type Mode = "add" | "sub" | "scale" | "norm" | "target";
const p = plot({ W: 560, H: 300, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const S = (v: Pt) => ({ x: p.X(v.x), y: p.Y(v.y) });
const O = S({ x: 0, y: 0 });
const len = (v: Pt) => Math.hypot(v.x, v.y);
const r1 = (v: number) => Math.round(v * 10) / 10;

// ── The drawing ───────────────────────────────────────────────────────────────

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function VecStage({ mode, a, b, k, speed, setA, setB }: {
  mode: Mode; a: Pt; b: Pt; k: number; speed: number; setA: (v: Pt) => void; setB: (v: Pt) => void;
}) {
  const handles: [string, Pt][] = mode === "scale" || mode === "norm" ? [["a", a]] : [["a", a], ["b", b]];
  const drag = useDrag<string>(q => nearest(q, handles.map(([id, v]) => [id, S(v)] as [string, Pt]), 16),
    (id, q) => {
      const w = p.inv(q), v = { x: Math.max(-5.4, Math.min(5.4, r1(w.x))), y: Math.max(-2.9, Math.min(2.9, r1(w.y))) };
      (id === "a" ? setA : setB)(v);
    });

  const add = { x: a.x + b.x, y: a.y + b.y }, sub = { x: b.x - a.x, y: b.y - a.y };
  const sc = { x: a.x * k, y: a.y * k };
  const la = len(a), nrm = la > 1e-9 ? { x: a.x / la, y: a.y / la } : { x: 0, y: 0 };
  // target mode: a = walker position, b = goal position
  const toP = { x: b.x - a.x, y: b.y - a.y }, dist = len(toP);
  const dir = dist > 1e-9 ? { x: toP.x / dist, y: toP.y / dist } : { x: 0, y: 0 };

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto cursor-grab">
      <Grid p={p} step={1} />
      {mode === "add" && <>
        <Vec a={S(a)} b={S(add)} color={C.sky} dash="5 4" opacity={0.5} />
        <Vec a={S(b)} b={S(add)} color={C.red} dash="5 4" opacity={0.5} />
        <Vec a={O} b={S(add)} color={C.green} w={2.8} />
        <Vec a={O} b={S(a)} color={C.red} />
        <Vec a={O} b={S(b)} color={C.sky} />
        <T x={S(add).x + 8} y={S(add).y - 6} size={10} bold color={C.green}>a + b</T>
      </>}
      {mode === "sub" && <>
        <Vec a={O} b={S(a)} color={C.red} />
        <Vec a={O} b={S(b)} color={C.sky} />
        <Vec a={S(a)} b={S(b)} color={C.amber} w={2.8} />
        <Vec a={O} b={S(sub)} color={C.amber} dash="4 3" opacity={0.45} />
        <T x={(S(a).x + S(b).x) / 2 + 8} y={(S(a).y + S(b).y) / 2} size={10} bold color={C.amber}>b − a</T>
      </>}
      {mode === "scale" && <>
        <line x1={p.X(-a.x * 3)} y1={p.Y(-a.y * 3)} x2={p.X(a.x * 3)} y2={p.Y(a.y * 3)} stroke={C.muted} strokeDasharray="3 4" opacity={0.5} />
        <Vec a={O} b={S(sc)} color={C.green} w={4} opacity={0.75} />
        <Vec a={O} b={S(a)} color={C.red} />
        <T x={S(sc).x + 8} y={S(sc).y + 14} size={10} bold color={C.green}>{`${f2(k)}·a`}</T>
      </>}
      {mode === "norm" && <>
        <circle cx={O.x} cy={O.y} r={p.sx} fill="none" stroke={C.muted} strokeDasharray="4 3" />
        <Vec a={O} b={S(a)} color={C.red} />
        <Vec a={O} b={S(nrm)} color={C.green} w={3.2} />
        <T x={S(nrm).x + 6} y={S(nrm).y - 8} size={10} bold color={C.green}>â</T>
      </>}
      {mode === "target" && <>
        {dist > 0.05 && <Vec a={S(a)} b={S(b)} color={C.amber} dash="5 4" opacity={0.7} />}
        {dist > 0.05 && <Vec a={S(a)} b={S({ x: a.x + dir.x * speed, y: a.y + dir.y * speed })} color={C.green} w={3} />}
        <circle cx={S(b).x} cy={S(b).y} r={9} fill={C.sky} />
        <circle cx={S(a).x} cy={S(a).y} r={9} fill={C.red} />
        <T x={S(b).x + 12} y={S(b).y + 4} size={10} bold color={C.sky}>G</T>
        <T x={S(a).x + 12} y={S(a).y - 8} size={10} bold color={C.red}>W</T>
      </>}
      {mode !== "target" && handles.map(([id, v]) => <Handle key={id} x={S(v).x} y={S(v).y} color={id === "a" ? C.red : C.sky} r={4.5} active={drag.dragging === id} />)}
      {mode !== "target" && <T x={S(a).x + 8} y={S(a).y + 14} size={10} bold color={C.red}>a</T>}
      {(mode === "add" || mode === "sub") && <T x={S(b).x + 8} y={S(b).y - 6} size={10} bold color={C.sky}>b</T>}
    </svg>
  );
}

export function VectorFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("add");
  const [a, setRawA] = useState<Pt>({ x: 3, y: 1 });
  const [b, setB] = useState<Pt>({ x: 1, y: 2.5 });
  const [k, setK] = useState(1.5);
  const [speed, setSpeed] = useState(1.5);
  const [walked, setWalked] = useState(0);              // seconds walked since the walker was placed
  const [start, setStart] = useState<Pt>({ x: 3, y: 1 }); // where the walker stood before walking
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-vectors");
  const vis = useVisible<HTMLDivElement>();

  // Dragging a places the walker anew
  const setA = (v: Pt) => { setRawA(v); setStart(v); setWalked(0); setPlaying(false); };
  const toG = { x: b.x - a.x, y: b.y - a.y }, dist = len(toG);
  const dir = dist > 1e-9 ? { x: toG.x / dist, y: toG.y / dist } : { x: 0, y: 0 };
  /** Walks `dt` seconds toward the goal, stopping on it. */
  const walk = (dt: number) => {
    const d = Math.min(dist, speed * dt);
    setRawA({ x: a.x + dir.x * d, y: a.y + dir.y * d });
    setWalked(w => w + dt);
    if (d >= dist - 1e-9) setPlaying(false);
  };
  useFrame(playing && mode === "target" && (vis.on || lab.open), walk);

  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const backToStart = () => { setPlaying(false); setRawA(start); setWalked(0); };

  const la = len(a), lb = len(b);
  const add = { x: a.x + b.x, y: a.y + b.y }, sub = { x: b.x - a.x, y: b.y - a.y };
  const sc = { x: a.x * k, y: a.y * k };
  const nrm = la > 1e-9 ? { x: a.x / la, y: a.y / la } : { x: 0, y: 0 };
  const near = (u: Pt, v: Pt) => Math.abs(u.x - v.x) < 0.051 && Math.abs(u.y - v.y) < 0.051;

  const view = (
    <div>
      <VecStage mode={mode} a={a} b={b} k={k} speed={speed} setA={setA} setB={setB} />
      {mode === "target" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (dist < 0.01) return; setPlaying(q => !q); }}
          playLabel={tx(t, "figVec_walk", "walk")}
          onStep={() => { setPlaying(false); walk(1); }}
          onReset={backToStart}
          readout={`t = ${walked.toFixed(1)} s · ${tx(t, "figVec_dist", "distance")} = ${f2(dist)}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[["add", "a + b"], ["sub", "b − a"], ["scale", "k · a"], ["norm", "a / |a|"], ["target", tx(t, "figVec_target", "move to target")]] as const} />;
  const controls = <>
    {mode === "scale" && <Slider label="k" value={k} min={-2} max={2} step={0.05} onChange={setK} width="w-10" />}
    {mode === "target" && <Slider label={tx(t, "figVec_speed", "speed")} value={speed} min={0.2} max={4} step={0.1} onChange={setSpeed} width="w-16" fmt={v => `${v.toFixed(1)} u/s`} />}
    <Row>
      {mode !== "target" && <Readout color={C.red}>a = ({f2(a.x, 1)}, {f2(a.y, 1)}) · |a| = {f2(la)}</Readout>}
      {(mode === "add" || mode === "sub") && <Readout color={C.sky}>b = ({f2(b.x, 1)}, {f2(b.y, 1)}) · |b| = {f2(lb)}</Readout>}
      {mode === "add" && <Readout color={C.green}>a + b = ({f2(add.x, 1)}, {f2(add.y, 1)}) · |a + b| = {f2(len(add))}</Readout>}
      {mode === "sub" && <Readout color={C.amber}>b − a = ({f2(sub.x, 1)}, {f2(sub.y, 1)}) · {tx(t, "figVec_dist", "distance")} = {f2(len(sub))}</Readout>}
      {mode === "scale" && <Readout color={C.green}>{f2(k)} · a = ({f2(sc.x)}, {f2(sc.y)}) · |k·a| = {f2(len(sc))}</Readout>}
      {mode === "norm" && <Readout color={C.green}>â = ({f2(nrm.x, 3)}, {f2(nrm.y, 3)}) · |â| = {f2(len(nrm), 3)}</Readout>}
      {mode === "target" && <>
        <Readout color={C.amber}>G − W = ({f2(toG.x, 1)}, {f2(toG.y, 1)})</Readout>
        <Readout color={C.green}>{tx(t, "figVec_dir", "direction")} = ({f2(dir.x, 3)}, {f2(dir.y, 3)})</Readout>
        <Readout color={C.sky}>{tx(t, "figVec_vel", "velocity")} = {tx(t, "figVec_dir", "direction")} × {speed.toFixed(1)}</Readout>
      </>}
    </Row>
  </>;
  const note = {
    add: tx(t, "figVec_noteAdd", "Drag the tips. To add, put b's tail on a's tip: the sum goes from the start of a to the end of b. Doing it the other way round (a on b's tip, dashed) lands in the same place: the two paths form a parallelogram whose diagonal is a + b. In components it is just (aₓ + bₓ, a_y + b_y). Note |a + b| ≤ |a| + |b|: a detour is never shorter."),
    sub: tx(t, "figVec_noteSub", "b − a is the arrow that goes from the tip of a to the tip of b: \"where b is, seen from a\". If a and b are positions, b − a is the displacement between them and its length is their distance. Remember the order: \"to minus from\"."),
    scale: tx(t, "figVec_noteScale", "Multiplying by a number k (a scalar) stretches the vector along its own line: k = 2 doubles it, k = 0.5 halves it, k = −1 reverses it, k = 0 collapses it to the zero vector. Both components are multiplied by k, so the direction (the ratio between them) is kept."),
    norm: tx(t, "figVec_noteNorm", "Dividing a vector by its own length gives a unit vector: same direction, length exactly 1, so its tip is on the unit circle. Unit vectors (written with a hat, â) represent pure directions: which way something faces, which way a surface points, which way light travels. Drag a to the origin: the zero vector has no direction, and normalising it would mean dividing by zero."),
    target: tx(t, "figVec_noteTarget2", "The red dot is a walker W, the blue one a goal G. G − W points from the walker to the goal; its length is the distance. Normalising it keeps only the direction, and multiplying by the speed gives a velocity, the green arrow: how far the walker moves in one second. Press play, or ⏭ for one second at a time. The walker covers the same distance every second, near the goal or far from it. Without the normalisation it would rush when far away and crawl when close."),
  }[mode];

  // ── Lab ──
  const sumLen = len(add);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figVecL1_t", "Tip to tail"),
      body: <>
        <p>{tx(t, "figVecL1_b1", "a = (3, 1) stays put. The green arrow is a + b: walk along a, then along b.")}</p>
        <p>{tx(t, "figVecL1_b2", "Drag b so that the sum lands on (4, 3).")}</p>
      </>,
      goal: { text: tx(t, "figVecL1_g", "a + b = (4, 3)."), done: mode === "add" && near(add, { x: 4, y: 3 }) },
      hint: tx(t, "figVecL1_h", "b = (4, 3) − (3, 1). Subtract component by component."),
      setup: () => { pick("add"); setA({ x: 3, y: 1 }); setB({ x: -1, y: 2 }); },
    },
    {
      title: tx(t, "figVecL2_t", "No shortcut is longer"),
      body: <>
        <p>{tx(t, "figVecL2_b1", "|a + b| is the straight route; |a| + |b| is the detour along a and then b. The straight route is never longer.")}</p>
        <p>{tx(t, "figVecL2_b2", "Make the two equal: |a + b| = |a| + |b|.")}</p>
      </>,
      goal: { text: tx(t, "figVecL2_g", "|a + b| = |a| + |b| (to 0.01), with b not zero."), done: mode === "add" && lb > 0.2 && Math.abs(sumLen - la - lb) < 0.01 },
      hint: tx(t, "figVecL2_h", "The detour costs nothing only when b points exactly the same way as a. Try b = (1.5, 0.5), half of a."),
    },
    {
      title: tx(t, "figVecL3_t", "Quick check"),
      body: <p>{tx(t, "figVecL3_b", "A hiker walks 3 km east, then 4 km north.")}</p>,
      quiz: {
        q: tx(t, "figVecL3_q", "How far from the start does the hiker end?"),
        options: ["5 km", "7 km", "1 km", "12 km"],
        answer: 0,
        why: tx(t, "figVecL3_w", "(3, 0) + (0, 4) = (3, 4), and √(3² + 4²) = 5. Lengths add up (7 km walked) only when the arrows point the same way."),
      },
    },
    {
      title: tx(t, "figVecL4_t", "To minus from"),
      body: <>
        <p>{tx(t, "figVecL4_b1", "a = (2, 1). The amber arrow b − a goes from the tip of a to the tip of b.")}</p>
        <p>{tx(t, "figVecL4_b2", "Place b so that b − a points straight up, 2 units long.")}</p>
      </>,
      goal: { text: tx(t, "figVecL4_g", "b − a = (0, 2)."), done: mode === "sub" && near(sub, { x: 0, y: 2 }) },
      hint: tx(t, "figVecL4_h", "b = a + (0, 2) = (2, 3)."),
      setup: () => { pick("sub"); setA({ x: 2, y: 1 }); setB({ x: -2, y: 2 }); },
    },
    {
      title: tx(t, "figVecL5_t", "Stretch and flip"),
      body: <>
        <p>{tx(t, "figVecL5_b1", "k · a keeps a's line. Its length is |k| times |a|, and a negative k turns it around.")}</p>
        <p>{tx(t, "figVecL5_b2", "Make k · a twice as long as a, pointing the other way.")}</p>
      </>,
      goal: { text: tx(t, "figVecL5_g", "k = −2."), done: mode === "scale" && Math.abs(k + 2) < 0.01 },
      setup: () => { pick("scale"); setA({ x: 2, y: 1 }); setK(1); },
    },
    {
      title: tx(t, "figVecL6_t", "Quick check"),
      body: <p>{tx(t, "figVecL6_b", "Normalising divides each component by the length.")}</p>,
      quiz: {
        q: tx(t, "figVecL6_q", "What is the unit vector in the direction of (3, 4)?"),
        options: ["(0.6, 0.8)", "(3/7, 4/7)", "(1, 1)", "(0.75, 1)"],
        answer: 0,
        why: tx(t, "figVecL6_w", "|(3, 4)| = √(9 + 16) = 5, so (3/5, 4/5) = (0.6, 0.8). Check: 0.36 + 0.64 = 1. Dividing by 3 + 4 = 7 gives a vector of the right direction but length ≈ 0.71."),
      },
    },
    {
      title: tx(t, "figVecL7_t", "The one vector with no direction"),
      body: <>
        <p>{tx(t, "figVecL7_b1", "â always sits on the dashed unit circle, wherever a points.")}</p>
        <p>{tx(t, "figVecL7_b2", "Drag a onto the origin and watch â.")}</p>
      </>,
      goal: { text: tx(t, "figVecL7_g", "|a| = 0."), done: mode === "norm" && la < 0.05 },
      setup: () => { pick("norm"); setA({ x: 2, y: 1.5 }); },
    },
    {
      title: tx(t, "figVecL8_t", "Walk to the goal"),
      body: <>
        <p>{tx(t, "figVecL8_b1", "The walker W moves along the unit direction toward G, at the chosen speed.")}</p>
        <p>{tx(t, "figVecL8_b2", "Press play and let the walker arrive. The readout counts the seconds.")}</p>
      </>,
      goal: { text: tx(t, "figVecL8_g", "W reaches G."), done: mode === "target" && dist < 0.01 && walked > 0 },
      focus: "play",
      setup: () => { pick("target"); setB({ x: 3, y: 2 }); setA({ x: -3, y: -2 }); setSpeed(2); },
    },
    {
      title: tx(t, "figVecL9_t", "Quick check"),
      body: <p>{tx(t, "figVecL9_b", "A = (1, 2) and B = (7, 10). B − A = (6, 8), 10 km long.")}</p>,
      quiz: {
        q: tx(t, "figVecL9_q", "Where do you stand after 4 km from A toward B?"),
        options: ["(3.4, 5.2)", "(5, 6)", "(2.4, 3.2)", "(4.6, 6.8)"],
        answer: 0,
        why: tx(t, "figVecL9_w", "The direction is (6, 8) / 10 = (0.6, 0.8). Four km of it is (2.4, 3.2), added to the start A: (1 + 2.4, 2 + 3.2) = (3.4, 5.2). (2.4, 3.2) is only the step, not the position."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "straight", tone: "ok", when: mode === "add" && lb > 0.2 && la > 0.2 && Math.abs(sumLen - la - lb) < 0.01,
      title: tx(t, "figVecI1_t", "Same direction, no detour"),
      body: fill(tx(t, "figVecI1_b", "a and b point the same way, so the parallelogram is flat and |a + b| = {s} = |a| + |b|. Any other angle makes the sum shorter."), { s: f2(sumLen) }),
    },
    {
      id: "cancel", tone: "info", when: mode === "add" && la > 0.2 && sumLen < 0.05,
      title: tx(t, "figVecI2_t", "Back where you started"),
      body: tx(t, "figVecI2_b", "b = −a: walking along a and then along b returns to the origin. a + b is the zero vector."),
    },
    {
      id: "same", tone: "info", when: mode === "sub" && len(sub) < 0.05,
      title: tx(t, "figVecI3_t", "Zero distance"),
      body: tx(t, "figVecI3_b", "b = a, so b − a = (0, 0): the two points coincide and the distance between them is 0."),
    },
    {
      id: "flip", tone: "info", when: mode === "scale" && k < 0,
      title: tx(t, "figVecI4_t", "Negative k turns it around"),
      body: fill(tx(t, "figVecI4_b", "k = {k}: both components change sign, so the arrow points the opposite way along the same line, {f} times as long."), { k: f2(k), f: f2(Math.abs(k)) }),
    },
    {
      id: "kzero", tone: "warn", when: mode === "scale" && Math.abs(k) < 0.01,
      title: tx(t, "figVecI5_t", "Collapsed"),
      body: tx(t, "figVecI5_b", "0 · a = (0, 0). Every vector times zero is the zero vector, and no k can bring the direction back."),
    },
    {
      id: "zero", tone: "warn", when: mode === "norm" && la < 0.05,
      title: tx(t, "figVecI6_t", "Nothing to normalise"),
      body: tx(t, "figVecI6_b", "|a| = 0, and a / |a| would divide by zero. The zero vector has no direction, so it has no unit vector: always check the length before you normalise."),
    },
    {
      id: "arrived", tone: "ok", when: mode === "target" && dist < 0.01 && walked > 0,
      title: tx(t, "figVecI7_t", "Arrived"),
      body: fill(tx(t, "figVecI7_b", "{d} units at {v} units per second took {s} s: time = distance ÷ speed, because the unit direction made every second cover the same ground."), { d: f2(len({ x: b.x - start.x, y: b.y - start.y })), v: speed.toFixed(1), s: walked.toFixed(1) }),
    },
  ];

  const title = tx(t, "figVec_opsTitle", "Vector operations");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figVecR1", "a + b is tip to tail; the straight route is never longer than the detour, |a + b| ≤ |a| + |b|."),
          tx(t, "figVecR2", "b − a goes from a to b: to minus from. Its length is the distance."),
          tx(t, "figVecR3", "k · a stays on a's line; |k| scales the length and a negative k reverses it."),
          tx(t, "figVecR4", "a / |a| is the unit direction; the zero vector has none."),
          tx(t, "figVecR5", "Position + distance × unit direction: a walk at constant speed."),
        ]}
      />
    </>
  );
}
