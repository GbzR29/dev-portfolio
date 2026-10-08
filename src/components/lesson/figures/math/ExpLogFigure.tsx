"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, plot, Grid, fnPath, useDrag, clamp, useVisible, type Plot } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// mirror   — y = bˣ and y = log_b(x) are reflections of each other across the
//            line y = x, because each undoes the other. Drag the point on the
//            exponential; its mirror image lies on the logarithm.
// compound — why e ≈ 2.71828 is special: growing by 100% in one year, split
//            into n compounding steps, gives (1 + 1/n)ⁿ, which approaches e as
//            n grows. The staircase approaches the smooth curve eˣ. The
//            Transport walks n through 1, 2, 4, 12, 52, 365 steps per year.
// The lab walks through both modes.

type Mode = "mirror" | "compound";
const NS = [1, 2, 4, 12, 52, 365];
const P = plot({ W: 560, H: 300, x0: -4.2, x1: 6.2, y0: -3, y1: 6.2 });
const PC = plot({ W: 560, H: 300, x0: -0.1, x1: 2.1, y0: -0.4, y1: 8 });

/** Compound growth with n steps per year over two years, as an SVG path. */
function staircase(pc: Plot, n: number) {
  let d = `M${pc.X(0)},${pc.Y(1)}`, v = 1;
  for (let k = 0; k < 2 * n; k++) {
    const x1 = (k + 1) / n;
    d += ` L${pc.X(x1)},${pc.Y(v)}`;
    v *= 1 + 1 / n;
    d += ` L${pc.X(x1)},${pc.Y(v)}`;
  }
  return d;
}

// ── The mirror drawing (owns its drag: it is mounted twice while the lab is open) ──

function MirrorStage({ base, px, setPx }: { base: number; px: number; setPx: (v: number) => void }) {
  const lb = Math.log(base);
  const expF = (x: number) => base ** x;
  const logF = (x: number) => (x > 0 ? Math.log(x) / lb : NaN);
  const py = expF(px);
  const drag = useDrag<"p">(q => (Math.hypot(q.x - P.X(px), q.y - P.Y(py)) < 16 ? "p" : null),
    (_, q) => setPx(clamp(P.inv(q).x, -4, Math.log(6) / lb)));
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto">
      <Grid p={P} step={1} />
      <line x1={P.X(-3)} y1={P.Y(-3)} x2={P.X(6.2)} y2={P.Y(6.2)} stroke={C.muted} strokeDasharray="5 4" />
      <path d={fnPath(P, expF, P.x0, P.x1, 400)} fill="none" stroke={C.sky} strokeWidth={2.4} />
      <path d={fnPath(P, logF, 0.001, P.x1, 600)} fill="none" stroke={C.amber} strokeWidth={2.4} />
      <line x1={P.X(px)} y1={P.Y(py)} x2={P.X(py)} y2={P.Y(px)} stroke={C.fg} strokeDasharray="2 3" opacity={0.6} />
      <circle cx={P.X(py)} cy={P.Y(px)} r={5} fill={C.amber} />
      <circle cx={P.X(px)} cy={P.Y(py)} r={9} fill={C.sky} opacity={0.2} />
      <circle cx={P.X(px)} cy={P.Y(py)} r={5.5} fill={C.sky} />
      <T x={P.X(-4)} y={P.Y(5.7)} size={10} color={C.sky}>{`y = ${base.toFixed(2)}ˣ`}</T>
      <T x={P.X(3.6)} y={P.Y(-1.2)} size={10} color={C.amber}>{`y = log_${base.toFixed(2)} x`}</T>
      <T x={P.X(4.2)} y={P.Y(5.2)} size={9}>y = x</T>
    </svg>
  );
}

export function ExpLogFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("mirror");
  const [base, setBase] = useState(2);
  const [px, setPx] = useState(1.5);
  const [n, setN] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-exp-log");
  const vis = useVisible<HTMLDivElement>();

  // Compound: playing jumps to the next n in NS, one per beat
  const nextN = NS.find(v => v > n);
  const prevN = [...NS].reverse().find(v => v < n);
  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (nextN === undefined) { setPlaying(false); return; }
    const id = setTimeout(() => setN(nextN), scaledMs(1100, speed));
    return () => clearTimeout(id);
  }, [playing, nextN, speed, vis.on, lab.open]);

  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const py = base ** px;
  const stair = staircase(PC, n);
  const oneYear = (1 + 1 / n) ** n;

  const compoundView = (
    <div>
      <svg viewBox={`0 0 ${PC.W} ${PC.H}`} className="w-full h-auto">
        <Grid p={PC} step={0.25} major={1} labels={false} />
        {[1, 2, 3, 4, 5, 6, 7].map(y => <T key={y} x={PC.X(0) - 4} y={PC.Y(y) + 3} size={8} anchor="end">{`${y}`}</T>)}
        {[1, 2].map(x => <T key={x} x={PC.X(x)} y={PC.Y(0) + 12} size={8} anchor="middle">{`${x} ${tx(t, "figExp_year", "yr")}`}</T>)}
        <path d={fnPath(PC, Math.exp, 0, 2, 200)} fill="none" stroke={C.green} strokeWidth={2} />
        <path d={stair} fill="none" stroke={C.sky} strokeWidth={1.8} />
        <line x1={PC.X(1)} x2={PC.X(1)} y1={PC.Y(0)} y2={PC.Y(Math.E)} stroke={C.muted} strokeDasharray="3 3" />
        <circle cx={PC.X(1)} cy={PC.Y(oneYear)} r={4.5} fill={C.sky} />
        <circle cx={PC.X(1)} cy={PC.Y(Math.E)} r={4.5} fill="none" stroke={C.green} strokeWidth={2} />
        <T x={PC.X(1.03)} y={PC.Y(Math.E) - 6} size={9} color={C.green}>e</T>
      </svg>
      <Transport t={t} speed playing={playing}
        onPlay={() => { if (playing) { setPlaying(false); return; } if (nextN === undefined) setN(1); setPlaying(true); }}
        playLabel={tx(t, "figExp_play", "compound more often")}
        onStep={nextN !== undefined ? () => { setPlaying(false); setN(nextN); } : undefined}
        onBack={prevN !== undefined ? () => { setPlaying(false); setN(prevN); } : undefined}
        onReset={() => { setPlaying(false); setN(1); }}
        readout={`n = ${n}`} />
    </div>
  );
  const stage = mode === "mirror" ? <MirrorStage base={base} px={px} setPx={setPx} /> : compoundView;

  const modeChoice = <Choice value={mode} onChange={pick} options={[["mirror", tx(t, "figExp_mirror", "bˣ and log_b x")], ["compound", tx(t, "figExp_compound", "where e comes from")]] as const} />;
  const controls = mode === "mirror" ? <>
    <Slider label={tx(t, "figExp_base", "base b")} value={base} min={1.1} max={5} step={0.05} onChange={setBase} width="w-20" />
    <Row>
      <Readout color={C.sky}>{base.toFixed(2)}^{px.toFixed(2)} = {py.toFixed(3)}</Readout>
      <Readout color={C.amber}>log_{base.toFixed(2)}({py.toFixed(3)}) = {px.toFixed(2)}</Readout>
      <Readout>{tx(t, "figExp_doubling", "multiplies by b every +1 in x")}</Readout>
    </Row>
  </> : <>
    <Slider label={tx(t, "figExp_steps", "steps per year n")} value={Math.min(n, 60)} min={1} max={60} step={1} onChange={v => { setPlaying(false); setN(v); }} fmt={() => `${n}`} width="w-32" />
    <Row>
      <Readout>(1 + 1/{n})^{n} = {oneYear.toFixed(5)}</Readout>
      <Readout color={C.green}>e = 2.71828…</Readout>
      <Readout color={C.muted}>{tx(t, "figExp_gap", "gap")} {(Math.E - oneYear).toFixed(5)}</Readout>
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figExpL1_t", "Undo a power"),
      body: <>
        <p>{tx(t, "figExpL1_b1", "The blue curve is 2ˣ. The amber point is the blue point with its coordinates swapped: it always lands on log₂ x.")}</p>
        <p>{tx(t, "figExpL1_b2", "Drag the blue point to x = 2. Where is the amber one?")}</p>
      </>,
      goal: { text: tx(t, "figExpL1_g", "Blue point at x = 2 on 2ˣ."), done: mode === "mirror" && Math.abs(base - 2) < 1e-6 && Math.abs(px - 2) < 0.05 },
      setup: () => { pick("mirror"); setBase(2); setPx(0.5); },
    },
    {
      title: tx(t, "figExpL2_t", "Quick check"),
      body: <p>{tx(t, "figExpL2_b", "A logarithm answers the question \"which power?\".")}</p>,
      quiz: {
        q: "log₂ 32 = ?",
        options: ["5", "16", "6", "64"],
        answer: 0,
        why: tx(t, "figExpL2_w", "2⁵ = 2·2·2·2·2 = 32, so the power is 5."),
      },
    },
    {
      title: tx(t, "figExpL3_t", "Multiply by b at every step"),
      body: <p>{tx(t, "figExpL3_b2", "Change the base to 3, then drag the point from x = 0 (height 1) to x = 1. One step of 1 to the right multiplied the height by 3; one more step would give 9, above the grid.")}</p>,
      goal: { text: tx(t, "figExpL3_g", "Base 3, point at x = 1."), done: mode === "mirror" && Math.abs(base - 3) < 1e-6 && Math.abs(px - 1) < 0.05 },
      setup: () => { pick("mirror"); setBase(2); setPx(0); },
    },
    {
      title: tx(t, "figExpL4_t", "Quick check"),
      body: <p>{tx(t, "figExpL4_b", "Exponents add when powers multiply. The logarithm carries that rule over.")}</p>,
      quiz: {
        q: "log₁₀(100 · 1000) = ?",
        options: ["5", "6", "100 000", "2 · 3"],
        answer: 0,
        why: tx(t, "figExpL4_w", "log(xy) = log x + log y: 2 + 3 = 5. Check: 100 · 1000 = 100 000 = 10⁵."),
      },
    },
    {
      title: tx(t, "figExpL5_t", "Compound more often"),
      body: <>
        <p>{tx(t, "figExpL5_b1", "Grow by 100% in a year, but in n steps of 1/n each. One step gives 2, two steps 2.25.")}</p>
        <p>{tx(t, "figExpL5_b2", "Play: n becomes 4, 12 (monthly), 52 (weekly), 365 (daily). Watch the blue dot at one year.")}</p>
      </>,
      goal: { text: tx(t, "figExpL5_g", "Reach daily compounding, n = 365."), done: mode === "compound" && n === 365 },
      focus: "play",
      setup: () => { pick("compound"); setN(1); },
    },
    {
      title: tx(t, "figExpL6_t", "Quick check"),
      body: <p>{tx(t, "figExpL6_b", "Look at the gap readout as n grows.")}</p>,
      quiz: {
        q: tx(t, "figExpL6_q", "As n grows without end, (1 + 1/n)ⁿ…"),
        options: [tx(t, "figExpL6_o1", "approaches e ≈ 2.718 and never passes it"), tx(t, "figExpL6_o2", "grows without end"), tx(t, "figExpL6_o3", "approaches 1"), tx(t, "figExpL6_o4", "approaches 3")],
        answer: 0,
        why: tx(t, "figExpL6_w", "Each extra step helps less and less: 2, 2.25, 2.44, 2.61, 2.69, 2.7146… The limit is e, the result of growing continuously."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "neg", tone: "info", when: mode === "mirror" && px < -0.05,
      title: tx(t, "figExpI1_t", "Small, never negative"),
      body: fill(tx(t, "figExpI1_b", "{b}^{x} = {y}: a negative exponent divides, but the result stays positive. So the logarithm of a number between 0 and 1 is negative, and log of 0 or less does not exist."), { b: base.toFixed(2), x: px.toFixed(2), y: py.toFixed(3) }),
    },
    {
      id: "flat", tone: "warn", when: mode === "mirror" && base < 1.3,
      title: tx(t, "figExpI2_t", "A base close to 1"),
      body: tx(t, "figExpI2_b", "The closer b is to 1, the flatter bˣ, and the steeper its mirror log_b x. With b = 1 every power is 1 and no logarithm could undo it: that is why b ≠ 1."),
    },
    {
      id: "one", tone: "info", when: mode === "compound" && n === 1,
      title: tx(t, "figExpI3_t", "Once a year"),
      body: tx(t, "figExpI3_b", "One step of 100%: 1 becomes 2. Nothing is earned on the gain until the year is over."),
    },
    {
      id: "close", tone: "ok", when: mode === "compound" && n >= 52,
      title: tx(t, "figExpI4_t", "Almost continuous"),
      body: fill(tx(t, "figExpI4_b", "With {n} steps the year ends at {v}, only {g} below e. Compounding more often barely helps now: the staircase has become the curve eˣ."), { n, v: oneYear.toFixed(5), g: (Math.E - oneYear).toFixed(5) }),
    },
  ];

  const title = tx(t, "figExp_title", "Exponentials and logarithms");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={mode === "mirror"
          ? tx(t, "figExp_noteMirror", "Drag the blue point along bˣ. Swapping its coordinates, (x, y) → (y, x), reflects it across the dashed line y = x, and the reflected point always lands on the amber logarithm: log_b undoes b to the power of. The exponential passes through (0, 1) for every base because b⁰ = 1, the logarithm through (1, 0). The exponential is always positive, so the logarithm only exists for positive inputs. Every step of +1 to the right multiplies the exponential's height by b: slow at first, then explosive.")
          : tx(t, "figExp_noteCompound", "Start with 1 and grow by 100% per year. Adding the whole 100% once gives 2. Adding 50% twice (compounding) gives 1.5 × 1.5 = 2.25, because the second half-step grows the first one's gain too. Four steps of 25% give 2.44, twelve monthly steps 2.61. More, smaller steps approach a limit: e = 2.71828…, the result of growing continuously. The staircase approaches the smooth curve eˣ, which is the only exponential whose slope at every point equals its own height.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figExpR1", "log_b undoes b to the power of: their graphs are mirror images across y = x."),
          tx(t, "figExpR2", "bˣ is always positive and multiplies by b at every step of 1; so log_b only takes positive inputs."),
          tx(t, "figExpR3", "Compounding n times a year gives (1 + 1/n)ⁿ, which approaches e ≈ 2.718: continuous growth."),
        ]}
      />
    </>
  );
}
