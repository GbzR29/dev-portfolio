"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, C, T, clamp, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A linear equation a·x + b = c·x + d as a balance. Blue boxes are unknowns
// (each weighs x), green squares weigh +1, red squares −1 (think balloons).
// guess — the slider tries a value for x: the beam tilts toward the heavier
//         side and is level only at the solution.
// solve — the Transport solves it the textbook way, one "same thing to both
//         sides" move at a time: remove the x's from the right, remove the
//         constant from the left, then divide by the number of x's.
// The lab: guess the solution, solve step by step, then the equation with no
// solution and the one that divides by a negative number.

type Eq = { a: number; b: number; c: number; d: number };
type Step = { eq: Eq; move: string; div?: number };

const PRESETS: Eq[] = [
  { a: 2, b: 3, c: 0, d: 11 },
  { a: 3, b: -4, c: 1, d: 6 },
  { a: 5, b: 2, c: 2, d: 14 },
  { a: 1, b: 7, c: 3, d: 1 },
  { a: 2, b: 1, c: 2, d: 5 },
];

const n = (v: number) => (Object.is(v, -0) ? 0 : +v.toFixed(3)).toString().replace("-", "−");

/** "3x − 4" — one side of the equation. */
function side(k: number, m: number) {
  const xs = k === 0 ? "" : `${k === 1 ? "" : k === -1 ? "−" : n(k)}x`;
  if (m === 0) return xs || "0";
  if (!xs) return n(m);
  return `${xs} ${m < 0 ? "−" : "+"} ${n(Math.abs(m))}`;
}
const show = (e: Eq) => `${side(e.a, e.b)} = ${side(e.c, e.d)}`;

/** The solving moves, each applied to both sides. */
function solve(e0: Eq, t?: TrackTranslations): Step[] {
  const steps: Step[] = [{ eq: e0, move: tx(t, "figBal_start", "the equation") }];
  let e = { ...e0 };
  if (e.c !== 0) {
    const k = e.c;
    e = { a: e.a - k, b: e.b, c: 0, d: e.d };
    steps.push({ eq: e, move: `${k > 0 ? "−" : "+"} ${side(Math.abs(k), 0)} ${tx(t, "figBal_both", "on both sides")}` });
  }
  if (e.b !== 0) {
    const m = e.b;
    e = { a: e.a, b: 0, c: 0, d: e.d - m };
    steps.push({ eq: e, move: `${m > 0 ? "−" : "+"} ${n(Math.abs(m))} ${tx(t, "figBal_both", "on both sides")}` });
  }
  if (e.a !== 0 && e.a !== 1) {
    const k = e.a;
    e = { a: 1, b: 0, c: 0, d: e.d / k };
    steps.push({ eq: e, move: `÷ ${n(k)} ${tx(t, "figBal_both", "on both sides")}`, div: k });
  }
  return steps;
}

export function BalanceFigure({ t }: { t?: TrackTranslations }) {
  const [preset, setPreset] = useState(1);
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-balance");
  const vis = useVisible<HTMLDivElement>();
  const e0 = PRESETS[preset];
  const steps = solve(e0, t);
  const last = steps.length - 1;
  const cur = steps[Math.min(step, last)];
  const e = cur.eq;
  const load = (i: number) => { setPreset(i); setStep(0); setPlaying(false); };

  // Solving: playing does one move per beat
  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (step >= last) { setPlaying(false); return; }
    const id = setTimeout(() => setStep(step + 1), scaledMs(1100, speed));
    return () => clearTimeout(id);
  }, [playing, step, last, speed, vis.on, lab.open]);

  const L = e.a * guess + e.b, R = e.c * guess + e.d;
  const tilt = clamp((L - R) * 2.2, -14, 14);       // degrees; positive = left side down
  const noX = e0.a === e0.c;
  const sol = noX ? NaN : (e0.d - e0.b) / (e0.a - e0.c);
  const level = Math.abs(L - R) < 1e-9;

  const W = 560, H = 230, PX = W / 2, PY = 60, ARM = 170;
  const rad = (tilt * Math.PI) / 180;
  const end = (s: -1 | 1) => ({ x: PX + s * ARM * Math.cos(rad), y: PY - s * ARM * Math.sin(rad) });

  // Contents of one pan: x boxes, then +1 and −1 squares, laid out in rows.
  const pan = (k: number, m: number, cx: number, top: number) => {
    const items: { kind: "x" | "+" | "-"; neg?: boolean }[] = [];
    for (let i = 0; i < Math.abs(k); i++) items.push({ kind: "x", neg: k < 0 });
    const whole = Number.isInteger(m);
    if (whole) for (let i = 0; i < Math.abs(m); i++) items.push({ kind: m > 0 ? "+" : "-" });
    const per = 7, sz = 14, gap = 3;
    const rows = Math.ceil(items.length / per) || 1;
    return (
      <g>
        {items.map((it, i) => {
          const r = Math.floor(i / per), col = i % per, inRow = Math.min(per, items.length - r * per);
          const x = cx - (inRow * (sz + gap)) / 2 + col * (sz + gap);
          const y = top - (rows - r) * (sz + gap);
          const color = it.kind === "x" ? (it.neg ? C.red : C.sky) : it.kind === "+" ? C.green : C.red;
          return (
            <g key={i}>
              <rect x={x} y={y} width={sz} height={sz} rx={it.kind === "x" ? 3 : 2} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.2} strokeDasharray={it.kind === "-" ? "3 2" : undefined} />
              <T x={x + sz / 2} y={y + sz / 2 + 3.5} size={8.5} anchor="middle" color={color} bold>{it.kind === "x" ? (it.neg ? "−x" : "x") : it.kind === "+" ? "1" : "−1"}</T>
            </g>
          );
        })}
        {!whole && <T x={cx} y={top - 8} size={11} anchor="middle" color={C.green} bold>{n(m)}</T>}
      </g>
    );
  };

  const drawPan = (s: -1 | 1, k: number, m: number) => {
    const p = end(s), bottom = p.y + 70;
    return (
      <g>
        <line x1={p.x} y1={p.y} x2={p.x - 50} y2={bottom} stroke={C.axis} strokeWidth={1} />
        <line x1={p.x} y1={p.y} x2={p.x + 50} y2={bottom} stroke={C.axis} strokeWidth={1} />
        {pan(k, m, p.x, bottom - 2)}
        <path d={`M${p.x - 66},${bottom} L${p.x + 66},${bottom} L${p.x + 54},${bottom + 8} L${p.x - 54},${bottom + 8} Z`} fill={C.axis} opacity={0.6} />
        <T x={p.x} y={bottom + 24} size={10} anchor="middle" color={C.fg}>{`${side(k, m)} → ${n(k * guess + m)}`}</T>
      </g>
    );
  };

  const stage = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <path d={`M${PX},${PY} L${PX - 16},${H - 12} L${PX + 16},${H - 12} Z`} fill={C.axis} opacity={0.35} />
        <line x1={end(-1).x} y1={end(-1).y} x2={end(1).x} y2={end(1).y} stroke={level ? C.green : C.fg} strokeWidth={3} strokeLinecap="round" />
        <circle cx={PX} cy={PY} r={5} fill={level ? C.green : C.fg} />
        {drawPan(-1, e.a, e.b)}
        {drawPan(1, e.c, e.d)}
        <T x={PX} y={PY - 14} size={14} anchor="middle" color={level ? C.green : C.muted} bold>{level ? "=" : L > R ? ">" : "<"}</T>
      </svg>
      <Transport t={t} speed playing={playing}
        onPlay={() => { if (playing) { setPlaying(false); return; } if (step >= last) setStep(0); setPlaying(true); }}
        playLabel={tx(t, "figBal_play", "solve it")}
        onStep={step < last ? () => { setPlaying(false); setStep(step + 1); } : undefined}
        onBack={step > 0 ? () => { setPlaying(false); setStep(step - 1); } : undefined}
        onReset={() => { setPlaying(false); setStep(0); }}
        readout={`${step} / ${last} · ${cur.move}`} />
    </div>
  );

  const controls = <>
    <Row>
      {PRESETS.map((p, i) => <Btn key={i} active={i === preset} onClick={() => load(i)}>{show(p)}</Btn>)}
    </Row>
    <Slider label={tx(t, "figBal_guess", "try x =")} value={guess} min={-4} max={8} step={0.5} onChange={setGuess} fmt={n} width="w-16" />
    <Row>
      <Readout>{show(e)}</Readout>
      <Readout color={level ? C.green : C.muted}>
        {noX
          ? (e0.b === e0.d ? tx(t, "figBal_all", "every x balances: infinitely many solutions") : tx(t, "figBal_none", "the x's cancel and the constants differ: no x can balance it"))
          : level ? `${tx(t, "figBal_level", "level: x =")} ${n(guess)} ${tx(t, "figBal_isSol", "is the solution")}`
            : `${n(L)} ${L > R ? ">" : "<"} ${n(R)} — ${tx(t, "figBal_solIs", "the solution is x =")} ${n(sol)}`}
      </Readout>
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figBalL1_t", "Level the beam by guessing"),
      body: <>
        <p>{tx(t, "figBalL1_b1", "The balance holds 3x − 4 on the left and x + 6 on the right. Each blue box weighs x; a red square is a balloon that pulls up by 1.")}</p>
        <p>{tx(t, "figBalL1_b2", "Try values of x until the beam is level: that x is the solution.")}</p>
      </>,
      goal: { text: tx(t, "figBalL1_g", "Make the beam level."), done: preset === 1 && step === 0 && level },
      hint: tx(t, "figBalL1_h", "If the left pan is heavier, x is too big; if it is lighter, x is too small."),
      setup: () => { load(1); setGuess(0); },
    },
    {
      title: tx(t, "figBalL2_t", "Quick check"),
      body: <p>{tx(t, "figBalL2_b", "Guessing works, but it is slow. Solving uses moves that cannot break the balance.")}</p>,
      quiz: {
        q: tx(t, "figBalL2_q", "Which move keeps a level balance level?"),
        options: [tx(t, "figBalL2_o1", "take 4 from both pans"), tx(t, "figBalL2_o2", "take 4 from the left pan"), tx(t, "figBalL2_o3", "add x to the right pan"), tx(t, "figBalL2_o4", "double the left pan")],
        answer: 0,
        why: tx(t, "figBalL2_w", "Whatever you do, do it to both pans. Changing one pan alone tips the beam."),
      },
    },
    {
      title: tx(t, "figBalL3_t", "Solve it move by move"),
      body: <p>{tx(t, "figBalL3_b", "Step forward: first the x's leave the right pan, then the balloons leave the left, then the pans are shared out. Watch the equation in the readout.")}</p>,
      goal: { text: tx(t, "figBalL3_g", "Step until x is alone."), done: preset === 1 && step === last },
      focus: "step",
      setup: () => { load(1); setGuess(2); },
    },
    {
      title: tx(t, "figBalL4_t", "The tilt does not change"),
      body: <>
        <p>{tx(t, "figBalL4_b1", "Set x = 2 and step through 5x + 2 = 2x + 14. Look at the beam after each of the first two moves.")}</p>
        <p>{tx(t, "figBalL4_b2", "Taking the same weight from both pans keeps the difference between them, so the beam stays exactly as tilted.")}</p>
      </>,
      goal: { text: tx(t, "figBalL4_g", "Solve 5x + 2 = 2x + 14 to the end."), done: preset === 2 && step === last },
      focus: "play",
      setup: () => { load(2); setGuess(2); },
    },
    {
      title: tx(t, "figBalL5_t", "Quick check"),
      body: <p>{tx(t, "figBalL5_b", "Use the same three moves in your head.")}</p>,
      quiz: {
        q: "4x − 3 = x + 9  ⟹  x = ?",
        options: ["4", "2", "3", "12"],
        answer: 0,
        why: tx(t, "figBalL5_w", "Take x from both sides: 3x − 3 = 9. Add 3: 3x = 12. Divide by 3: x = 4. Check: 16 − 3 = 13 = 4 + 9."),
      },
    },
    {
      title: tx(t, "figBalL6_t", "A balance that never levels"),
      body: <p>{tx(t, "figBalL6_b", "Pick 2x + 1 = 2x + 5. Move x as far as you like, then solve it.")}</p>,
      goal: { text: tx(t, "figBalL6_g", "Solve 2x + 1 = 2x + 5 to the end."), done: preset === 4 && step === last },
      setup: () => { load(0); setGuess(1); },
    },
    {
      title: tx(t, "figBalL7_t", "Quick check"),
      body: <p>{tx(t, "figBalL7_b", "Expand the left side first.")}</p>,
      quiz: {
        q: tx(t, "figBalL7_q", "How many solutions has 2(x + 1) = 2x + 2?"),
        options: [tx(t, "figBalL7_o1", "infinitely many"), tx(t, "figBalL7_o2", "none"), tx(t, "figBalL7_o3", "exactly one, x = 0"), tx(t, "figBalL7_o4", "exactly one, x = 1")],
        answer: 0,
        why: tx(t, "figBalL7_w", "2(x + 1) = 2x + 2 is the same expression on both sides. Removing 2x leaves 2 = 2, true for every x."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "level", tone: "ok", when: level && !noX,
      title: tx(t, "figBalI1_t", "Level"),
      body: fill(tx(t, "figBalI1_b", "With x = {x} both sides weigh {v}. That is exactly what the equation claims, so x = {x} is its solution."), { x: n(guess), v: n(L) }),
    },
    {
      id: "same", tone: "info", when: step > 0 && !cur.div && !level && !noX,
      title: tx(t, "figBalI2_t", "Same tilt as before"),
      body: fill(tx(t, "figBalI2_b", "The move took the same weight from both pans, so the difference between them is still {d}. A move like this never changes which x levels the beam."), { d: n(Math.abs(L - R)) }),
    },
    {
      id: "neg", tone: "warn", when: preset === 3 && step === last,
      title: tx(t, "figBalI3_t", "Dividing by a negative number"),
      body: tx(t, "figBalI3_b", "−2x = −6 was divided by −2: x = 3. For an equation that is fine; any number except 0 works. In the next chapter, inequalities, dividing by a negative number flips the sign < into >."),
    },
    {
      id: "none", tone: "warn", when: noX,
      title: tx(t, "figBalI4_t", "No x can do it"),
      body: tx(t, "figBalI4_b", "Both pans hold the same number of x's, so adding weight to x changes both pans equally. The constants differ, 1 and 5, so one pan is always 4 heavier: no solution."),
    },
  ];

  const title = tx(t, "figBal_title", "An equation is a balance");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<LabButton lab={lab} t={t} />}
        controls={controls}
        note={tx(t, "figBal_note2", "Blue boxes each weigh x, green squares weigh 1 and red dashed squares pull up by 1 (a −1 is a balloon). Move the slider to try values of x: the beam tips toward the heavier side and is level only when both sides have the same value, which is exactly what the equation claims. Then press ⏭: each move does the same thing to both pans, so a level balance stays level, until a single x is left alone on one side. Try the last preset: the x's cancel and the pans can never balance.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={controls}
        recap={[
          tx(t, "figBalR1", "A solution is the x that makes both sides weigh the same: the beam is level."),
          tx(t, "figBalR2", "Doing the same thing to both sides keeps the solutions: add, subtract, multiply or divide by anything except 0."),
          tx(t, "figBalR3", "If the x's cancel, the equation has no solution (0 = 4) or every x is one (0 = 0)."),
        ]}
      />
    </>
  );
}
