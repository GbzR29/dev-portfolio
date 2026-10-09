"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, fnPath, useDrag, useFrame, useVisible, clamp, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// accumulate — top: f(t) with the signed area from a to x shaded. Bottom:
//              that area as a function of x, the accumulation function A(x).
//              Drag x, or play to sweep it: A grows fastest where f is tall,
//              stalls where f = 0 and falls where f < 0. The slope of A at x
//              (its tangent) always equals the height f(x): the fundamental
//              theorem of calculus.
// family     — every antiderivative of f differs by a constant: F(x) + C.
//              The curves are vertical copies of each other, so at any x they
//              all have the same slope f(x). The constant is fixed by one
//              known value, such as a starting position.
// The lab: the area stalls where f = 0, cancels back to zero, has its
// lowest point where f changes sign, then one starting value fixes C.

type Mode = "accumulate" | "family";
type Fn = { key: string; label: string; f: (x: number) => number; F: (x: number) => number; Flabel: string; view: [number, number, number, number]; Aview: [number, number]; step: number };

const W = 560, HT = 160, HB = 140, A0 = 0;            // the area starts at a = 0
const FNS: Fn[] = [
  { key: "const", label: "f(t) = 1", f: () => 1, F: x => x, Flabel: "x", view: [-0.3, 4.3, -1.3, 1.6], Aview: [-0.8, 4.3], step: 0.25 },
  { key: "lin", label: "f(t) = t", f: x => x, F: x => (x * x) / 2, Flabel: "x²/2", view: [-0.3, 4.3, -0.8, 4.5], Aview: [-1, 8.5], step: 0.25 },
  { key: "cos", label: "f(t) = cos t", f: Math.cos, F: Math.sin, Flabel: "sin x", view: [-0.3, 6.6, -1.4, 1.4], Aview: [-1.4, 1.4], step: Math.PI / 8 },
  { key: "quad", label: "f(t) = t² − 1", f: x => x * x - 1, F: x => (x ** 3) / 3 - x, Flabel: "x³/3 − x", view: [-0.3, 2.6, -1.4, 5.5], Aview: [-1, 3], step: 0.25 },
];
const n3 = (v: number) => f2(v, 3).replace("-", "−");
const fnOf = (k: string) => FNS.find(e => e.key === k)!;
const xMax = (fn: Fn) => fn.view[1] - 0.1;

// ── The drawing ───────────────────────────────────────────────────────────────

/** Both panels; owns the drag (it is mounted twice while the lab is open). */
function AccStage({ mode, fn, x, c, setX, t }: {
  mode: Mode; fn: Fn; x: number; c: number; setX: (v: number) => void; t?: TrackTranslations;
}) {
  const [x0, x1, y0, y1] = fn.view;
  const pt = plot({ W, H: HT, x0, x1, y0, y1 });
  const pb = plot({ W, H: HB, x0, x1, y0: fn.Aview[0] - (mode === "family" ? 2 : 0), y1: fn.Aview[1] + (mode === "family" ? 2 : 0) });
  const move = (vx: number) => setX(+clamp(pt.inv({ x: vx, y: 0 }).x, A0, xMax(fn)).toFixed(2));
  const drag = useDrag<"x">(p => { move(p.x); return "x"; }, (_, p) => move(p.x));

  const A = (s: number) => fn.F(s) - fn.F(A0);
  const fx = fn.f(x), Ax = A(x);
  const area = (lo: number, hi: number, pos: boolean) => {
    // the region between the curve and the axis, clipped to one sign
    const N = 120, pts: string[] = [`${pt.X(lo)},${pt.Y(0)}`];
    for (let i = 0; i <= N; i++) {
      const s = lo + ((hi - lo) * i) / N, v = fn.f(s);
      pts.push(`${pt.X(s)},${pt.Y(pos ? Math.max(v, 0) : Math.min(v, 0))}`);
    }
    pts.push(`${pt.X(hi)},${pt.Y(0)}`);
    return pts.join(" ");
  };
  const tangent = (y: number) =>
    <line x1={pb.X(x - 0.7)} y1={pb.Y(y - 0.7 * fx)} x2={pb.X(x + 0.7)} y2={pb.Y(y + 0.7 * fx)} stroke={C.amber} strokeWidth={1.8} />;
  const Cs = [-2, -1, 0, 1, 2];

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${HT + HB}`} className="w-full h-auto">
      <Grid p={pt} step={1} />
      {mode === "accumulate" && x > A0 && <>
        <polygon points={area(A0, x, true)} fill={C.sky} fillOpacity={0.3} />
        <polygon points={area(A0, x, false)} fill={C.red} fillOpacity={0.3} />
      </>}
      <path d={fnPath(pt, fn.f)} fill="none" stroke={C.fg} strokeWidth={2} />
      <line x1={pt.X(x)} x2={pt.X(x)} y1={pt.Y(0)} y2={pt.Y(fx)} stroke={C.amber} strokeWidth={2.5} />
      <Handle x={pt.X(x)} y={pt.Y(fx)} color={C.amber} active={drag.dragging === "x"} />
      <T x={6} y={14} color={C.fg} bold>{fn.label}</T>
      <g transform={`translate(0 ${HT})`}>
        <rect x={0} y={0} width={W} height={HB} fill={C.bg} />
        <line x1={0} x2={W} y1={0} y2={0} stroke={C.axis} />
        <Grid p={pb} step={1} />
        {mode === "accumulate" ? <>
          <path d={fnPath(pb, A, x0, x1)} fill="none" stroke={C.purple} strokeWidth={1.2} opacity={0.3} />
          <path d={fnPath(pb, A, A0, x)} fill="none" stroke={C.purple} strokeWidth={2.4} />
          {tangent(Ax)}
          <circle cx={pb.X(x)} cy={pb.Y(Ax)} r={4.5} fill={C.purple} />
          <T x={6} y={14} color={C.purple} bold>{`A(x): ${tx(t, "figAcc_areaSoFar", "the area from 0 to x")}`}</T>
        </> : <>
          {Cs.map(k => <path key={k} d={fnPath(pb, s => fn.F(s) + k)} fill="none" stroke={C.purple} strokeWidth={1.1} opacity={0.3} />)}
          <path d={fnPath(pb, s => fn.F(s) + c)} fill="none" stroke={C.purple} strokeWidth={2.4} />
          {Cs.map(k => <g key={k} opacity={0.5}>{tangent(fn.F(x) + k)}</g>)}
          {tangent(fn.F(x) + c)}
          <circle cx={pb.X(x)} cy={pb.Y(fn.F(x) + c)} r={4.5} fill={C.purple} />
          <T x={6} y={14} color={C.purple} bold>{`F(x) + C = ${fn.Flabel} + C`}</T>
        </>}
      </g>
    </svg>
  );
}

export function AccumulationFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("accumulate");
  const [key, setKey] = useState("cos");
  const [x, setX] = useState(1.2);
  const [c, setC] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-accumulate");
  const vis = useVisible<HTMLDivElement>();

  const fn = fnOf(key);
  const end = xMax(fn);
  useFrame(playing && (vis.on || lab.open), dt => {
    if (x >= end) setPlaying(false);
    else setX(Math.min(end, x + dt * 0.8));
  });

  const stop = () => setPlaying(false);
  const pick = (m: Mode) => { setMode(m); stop(); };
  const choose = (k: string) => { setKey(k); stop(); setX(v => Math.min(v, xMax(fnOf(k)))); };
  const xTo = (v: number) => { stop(); setX(clamp(+v.toFixed(2), A0, end)); };
  const xr = +x.toFixed(2);
  const fx = fn.f(xr), Ax = fn.F(xr) - fn.F(A0);

  const view = (
    <div>
      <AccStage mode={mode} fn={fn} x={xr} c={c} setX={v => { stop(); setX(v); }} t={t} />
      <Transport t={t} playing={playing}
        onPlay={() => { if (x >= end) setX(A0); setPlaying(p => !p); }}
        playLabel={tx(t, "figAcc_sweep", "sweep x to the right")}
        onStep={() => xTo((Math.floor(x / fn.step + 0.02) + 1) * fn.step)}
        onBack={() => xTo((Math.ceil(x / fn.step - 0.02) - 1) * fn.step)}
        onReset={() => xTo(A0)}
        readout={`x = ${n3(xr)}`} />
    </div>
  );

  const fnButtons = <Row>{FNS.map(e => <Btn key={e.key} active={key === e.key} onClick={() => choose(e.key)}>{e.label}</Btn>)}</Row>;
  let controls: React.ReactNode, note: string;
  if (mode === "accumulate") {
    controls = <>
      {fnButtons}
      <Row>
        <Readout color={C.purple}>{`A(x) = ${n3(Ax)}`}</Readout>
        <Readout color={C.amber}>{`${tx(t, "figAcc_slopeA", "slope of A at x")} = ${n3(fx)}`}</Readout>
        <Readout color={C.fg}>{`f(x) = ${n3(fx)}`}</Readout>
        <Readout color={C.green}>{`F(x) − F(0) = ${fn.Flabel.replace(/x/g, n3(xr))} − ${n3(fn.F(A0))} = ${n3(Ax)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figAcc_noteA2", "Drag anywhere to move x, or press play to sweep it. The shaded region is the area under f from 0 to x (red parts count negative), and the bottom curve records it: A(x). Watch the amber pieces: the height of f at x (top) always equals the slope of A at x (bottom). Where f is big, the area grows fast; where f = 0, it momentarily stops growing (A has a flat tangent); where f < 0, the area shrinks. The green readout gets the same number without adding any strips: an antiderivative F evaluated at the two ends.");
  } else {
    controls = <>
      {fnButtons}
      <Slider label={tx(t, "figAcc_const", "constant C")} value={c} min={-2} max={2} step={0.1} onChange={setC} width="w-20" />
      <Row>
        <Readout color={C.purple}>{`F(0) + C = ${n3(fn.F(0) + c)}`}</Readout>
        <Readout color={C.amber}>{`${tx(t, "figAcc_slopeAll", "slope of every curve at x")} = f(x) = ${n3(fx)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figAcc_noteF", "The bottom curves are F(x) + C for several constants C: the same curve slid up or down. Sliding does not change steepness, so at any x all of them have the same tangent slope f(x) (the parallel amber pieces). Knowing only f therefore fixes F up to that shift. One extra fact pins it down: if you know the value at x = 0 (a starting position, say), the slider C is set by it.");
  }
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["accumulate", tx(t, "figAcc_mA", "accumulate")],
    ["family", tx(t, "figAcc_mF", "plus C")],
  ] as const} />;

  // ── Lab ──
  const acc = mode === "accumulate";
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figAccL1_t", "The area stalls"),
      body: <>
        <p>{tx(t, "figAccL1_b1", "The bottom curve is the area under cos t from 0 to x. Its slope (amber, bottom) is always the height of cos at x (amber, top).")}</p>
        <p>{tx(t, "figAccL1_b2", "Move x to the first place where the area stops growing.")}</p>
      </>,
      goal: { text: tx(t, "figAccL1_g", "f(x) = 0: A has a flat tangent."), done: acc && key === "cos" && Math.abs(fx) < 0.03 && xr < 3 },
      hint: tx(t, "figAccL1_h", "cos t reaches 0 at t = π/2 ≈ 1.57."),
      focus: "step",
      setup: () => { pick("accumulate"); choose("cos"); setX(0); },
    },
    {
      title: tx(t, "figAccL2_t", "Quick check"),
      body: <p>{tx(t, "figAccL2_b", "An antiderivative of cos x is sin x.")}</p>,
      quiz: {
        q: tx(t, "figAccL2_q", "What is the area under cos t from 0 to π/2?"),
        options: ["1", "0", "π/2", "2"],
        answer: 0,
        why: tx(t, "figAccL2_w", "sin(π/2) − sin 0 = 1 − 0 = 1. That is the purple height where the curve turned flat."),
      },
    },
    {
      title: tx(t, "figAccL3_t", "Back to zero"),
      body: <>
        <p>{tx(t, "figAccL3_b1", "Past π/2 cos is negative: the new strips are red and subtract.")}</p>
        <p>{tx(t, "figAccL3_b2", "Keep going until the total area is back to zero.")}</p>
      </>,
      goal: { text: fill(tx(t, "figAccL3_g", "A(x) = 0 with x > 0 (now {a})."), { a: n3(Ax) }), done: acc && key === "cos" && xr > 1 && Math.abs(Ax) < 0.02 },
      hint: tx(t, "figAccL3_h", "At x = π ≈ 3.14 the red part equals the blue part: sin π = 0."),
      focus: "step",
    },
    {
      title: tx(t, "figAccL4_t", "The lowest point"),
      body: <>
        <p>{tx(t, "figAccL4_b1", "Now f(t) = t² − 1. It starts negative, so the area first goes down, then comes back up.")}</p>
        <p>{tx(t, "figAccL4_b2", "Find the x where A is at its lowest.")}</p>
      </>,
      goal: { text: tx(t, "figAccL4_g", "The minimum of A."), done: acc && key === "quad" && Math.abs(fx) < 0.03 },
      hint: tx(t, "figAccL4_h", "A′ = f, so A's lowest point is where f changes from − to +: t² − 1 = 0, x = 1."),
      setup: () => { pick("accumulate"); choose("quad"); setX(0); },
    },
    {
      title: tx(t, "figAccL5_t", "Quick check"),
      body: <p>{tx(t, "figAccL5_b", "√(1 + t³) has no antiderivative made of the usual functions.")}</p>,
      quiz: {
        q: tx(t, "figAccL5_q", "What is d/dx ∫₀ˣ √(1 + t³) dt at x = 2?"),
        options: ["3", "2", "9", tx(t, "figAccL5_o4", "it cannot be computed")],
        answer: 0,
        why: tx(t, "figAccL5_w", "Part 1: the area grows at the height of the curve, √(1 + 2³) = √9 = 3. No antiderivative needed."),
      },
    },
    {
      title: tx(t, "figAccL6_t", "Fix the constant"),
      body: <>
        <p>{tx(t, "figAccL6_b1", "Velocity v(t) = t. Every F(x) = x²/2 + C has that slope, so the velocity alone cannot say where the object is.")}</p>
        <p>{tx(t, "figAccL6_b2", "It started at position 1. Choose the C that matches.")}</p>
      </>,
      goal: { text: tx(t, "figAccL6_g", "F(0) + C = 1."), done: mode === "family" && key === "lin" && Math.abs(fn.F(0) + c - 1) < 0.05 },
      setup: () => { pick("family"); choose("lin"); setC(-1); setX(1.5); },
    },
    {
      title: tx(t, "figAccL7_t", "Quick check"),
      body: <p>{tx(t, "figAccL7_b", "A cart moves with velocity v(t) = 2t m/s and is at s = 3 m when t = 0.")}</p>,
      quiz: {
        q: tx(t, "figAccL7_q", "Where is it at t = 2 s?"),
        options: ["7 m", "4 m", "3 m", "8 m"],
        answer: 0,
        why: tx(t, "figAccL7_w", "s(t) = t² + C, and s(0) = 3 gives C = 3. s(2) = 4 + 3 = 7. 4 m is only the change, forgetting where it started."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "stall", tone: "info", when: acc && xr > 0.05 && Math.abs(fx) < 0.03,
      title: tx(t, "figAccI1_t", "The area stalls"),
      body: tx(t, "figAccI1_b", "f(x) = 0: the strip at the moving edge has no height, so for an instant the area does not grow. The bottom curve has a flat tangent here."),
    },
    {
      id: "shrink", tone: "warn", when: acc && fx < -0.03,
      title: tx(t, "figAccI2_t", "Shrinking"),
      body: fill(tx(t, "figAccI2_b", "f(x) = {f} < 0: the new strips lie below the axis and subtract, so A goes down at rate {f}."), { f: n3(fx) }),
    },
    {
      id: "zero", tone: "ok", when: acc && xr > 1 && Math.abs(Ax) < 0.02,
      title: tx(t, "figAccI3_t", "Cancelled out"),
      body: tx(t, "figAccI3_b", "The red area below the axis now equals the blue area above it, so the signed total is 0, though plenty of area is shaded."),
    },
    {
      id: "rect", tone: "info", when: acc && key === "const",
      title: tx(t, "figAccI4_t", "A rectangle"),
      body: fill(tx(t, "figAccI4_b", "Height 1, width x: A(x) = x, a straight line of slope 1, the height of f. Here A = {a}."), { a: n3(Ax) }),
    },
    {
      id: "family", tone: "info", when: mode === "family",
      title: tx(t, "figAccI5_t", "Same slope, every copy"),
      body: fill(tx(t, "figAccI5_b", "Each curve is F + C for a different C, and all their tangents at x are parallel, with slope f(x) = {f}. Only a starting value picks one out."), { f: n3(fx) }),
    },
  ];

  const title = tx(t, "figAcc_title", "Area that accumulates");
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
          tx(t, "figAccR1", "A(x) = ∫₀ˣ f(t) dt grows at the rate f(x): the slope of the area is the height of the curve."),
          tx(t, "figAccR2", "Where f = 0 the area stalls; where f < 0 it shrinks; its peaks and valleys sit where f changes sign."),
          tx(t, "figAccR3", "Any antiderivative F gives the area as F(x) − F(0), with no strips."),
          tx(t, "figAccR4", "Antiderivatives differ by a constant C; one known value fixes it."),
        ]}
      />
    </>
  );
}
