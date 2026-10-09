"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, C, T, Handle, plot, Grid, fnPath, useDrag, useFrame, useVisible, clamp, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// secant — a draggable point P = (a, f(a)) and a second point Q a distance h
//          to the right (or left, for negative h). The amber line through both
//          is a secant; its slope is rise over run. The Transport halves h
//          (play keeps shrinking it), so the secant turns into the purple
//          tangent, whose slope is the derivative f′(a). On |x| at a = 0 the
//          left and right secants disagree: no derivative.
// graph  — top: f with its tangent at a. Bottom: the slope of that tangent
//          plotted as a new function, f′. Drag along the top, or play to
//          sweep a from left to right, and watch the bottom curve being traced.
// The lab: shrink h on x², approach from the left, the corner of |x|, then
// the slope graph's zeros, sin → cos and eˣ → eˣ.

type Mode = "secant" | "graph";
type Fn = {
  key: string; label: string; f: (x: number) => number; d: (x: number) => number;
  view: [number, number, number, number]; dview: [number, number]; dstep: number;
};

const W = 560, HB = 130;
const H_MIN = 0.002;                                  // play stops shrinking h here
const FNS: Fn[] = [
  { key: "sq", label: "x²", f: x => x * x, d: x => 2 * x, view: [-2.5, 2.5, -1.5, 5], dview: [-5.5, 5.5], dstep: 2 },
  { key: "cubic", label: "x³ − 3x", f: x => x ** 3 - 3 * x, d: x => 3 * x * x - 3, view: [-2.6, 2.6, -4, 4], dview: [-4, 8], dstep: 2 },
  { key: "sin", label: "sin x", f: Math.sin, d: Math.cos, view: [-4, 4, -1.8, 1.8], dview: [-1.5, 1.5], dstep: 1 },
  { key: "exp", label: "eˣ", f: Math.exp, d: Math.exp, view: [-3, 2, -1, 6], dview: [-1, 6], dstep: 1 },
  { key: "abs", label: "|x|", f: Math.abs, d: x => (x === 0 ? NaN : Math.sign(x)), view: [-2.5, 2.5, -1, 3], dview: [-1.8, 1.8], dstep: 1 },
];
const n3 = (v: number) => (Number.isFinite(v) ? f2(v, 3) : "—").replace("-", "−");
const fmtH = (h: number) => (Math.abs(h) >= 0.01 ? f2(h, 3) : h.toExponential(1)).replace("-", "−");
const fnOf = (key: string) => FNS.find(e => e.key === key)!;
const ends = (fn: Fn) => [fn.view[0] + 0.1, fn.view[1] - 0.1] as const;

// ── The drawings ──────────────────────────────────────────────────────────────

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function DerivStage({ mode, fn, a, h, setA, t }: {
  mode: Mode; fn: Fn; a: number; h: number; setA: (v: number) => void; t?: TrackTranslations;
}) {
  const [x0, x1, y0, y1] = fn.view;
  const HT = mode === "secant" ? 290 : 180;
  const pr = plot({ W, H: HT, x0, x1, y0, y1 });
  const pd = plot({ W, H: HB, x0, x1, y0: fn.dview[0], y1: fn.dview[1] });
  const H = mode === "secant" ? HT : HT + HB;
  const [lo, hi] = ends(fn);
  const setX = (vx: number) => setA(+clamp(pr.inv({ x: vx, y: 0 }).x, lo, hi).toFixed(2));
  const drag = useDrag<"a">(p => { setX(p.x); return "a"; }, (_, p) => setX(p.x));

  const fa = fn.f(a), slope = fn.d(a);
  const line = (x: number, y: number, m: number, col: string, dash?: string, half = 99) =>
    <line x1={pr.X(x - half)} y1={pr.Y(y - m * half)} x2={pr.X(x + half)} y2={pr.Y(y + m * half)} stroke={col} strokeWidth={1.8} strokeDasharray={dash} />;

  let svg: React.ReactNode;
  if (mode === "secant") {
    const b = a + h, fb = fn.f(b), sec = (fb - fa) / h;
    const wide = Math.abs(pr.X(b) - pr.X(a)) > 24;     // room for the h and rise labels
    const right = h > 0 && pr.X(b) < W - 110;
    svg = <>
      <Grid p={pr} step={1} />
      <path d={fnPath(pr, fn.f)} fill="none" stroke={C.sky} strokeWidth={2.2} />
      {Number.isFinite(slope) && line(a, fa, slope, C.purple, "6 4")}
      {line(a, fa, sec, C.amber)}
      <line x1={pr.X(a)} y1={pr.Y(fa)} x2={pr.X(b)} y2={pr.Y(fa)} stroke={C.green} strokeWidth={1.6} strokeDasharray="3 3" />
      <line x1={pr.X(b)} y1={pr.Y(fa)} x2={pr.X(b)} y2={pr.Y(fb)} stroke={C.pink} strokeWidth={1.6} strokeDasharray="3 3" />
      {wide && <>
        <T x={(pr.X(a) + pr.X(b)) / 2} y={pr.Y(fa) + (fb >= fa ? 13 : -6)} color={C.green} anchor="middle" bold>h</T>
        <T x={pr.X(b) + (right ? 5 : -5)} y={(pr.Y(fa) + pr.Y(fb)) / 2 + 3} color={C.pink} anchor={right ? "start" : "end"} bold>{"f(a+h) − f(a)"}</T>
      </>}
      <circle cx={pr.X(b)} cy={pr.Y(fb)} r={4.5} fill={C.amber} />
      {wide && <T x={pr.X(b) + 6} y={pr.Y(fb) - 7} color={C.amber} bold>Q</T>}
      <Handle x={pr.X(a)} y={pr.Y(fa)} color={C.sky} active={drag.dragging === "a"} />
      <T x={pr.X(a) - 8} y={pr.Y(fa) - 9} color={C.sky} anchor="end" bold>P</T>
    </>;
  } else {
    const dCurve = fn.key === "abs"
      ? fnPath(pd, fn.d, x0, -1e-9) + fnPath(pd, fn.d, 1e-9, x1)
      : fnPath(pd, fn.d);
    const traced = fn.key === "abs" && a > 0
      ? fnPath(pd, fn.d, x0, -1e-9) + fnPath(pd, fn.d, 1e-9, a)
      : fnPath(pd, fn.d, x0, a);
    const sign = !Number.isFinite(slope) ? C.muted : slope > 0.01 ? C.green : slope < -0.01 ? C.red : C.amber;
    svg = <>
      <Grid p={pr} step={1} />
      <path d={fnPath(pr, fn.f)} fill="none" stroke={C.sky} strokeWidth={2.2} />
      {Number.isFinite(slope) && line(a, fa, slope, sign, undefined, 0.7)}
      <line x1={pr.X(a)} x2={pr.X(a)} y1={pr.Y(fa)} y2={HT + pd.Y(clamp(slope || 0, pd.y0, pd.y1))} stroke={C.muted} strokeDasharray="3 4" />
      <Handle x={pr.X(a)} y={pr.Y(fa)} color={C.sky} active={drag.dragging === "a"} />
      <T x={6} y={14} color={C.sky} bold>f(x)</T>
      <g transform={`translate(0 ${HT})`}>
        <rect x={0} y={0} width={W} height={HB} fill={C.bg} />
        <line x1={0} x2={W} y1={0} y2={0} stroke={C.axis} />
        <Grid p={pd} step={fn.dstep} />
        <path d={dCurve} fill="none" stroke={C.purple} strokeWidth={1.2} opacity={0.3} />
        <path d={traced} fill="none" stroke={C.purple} strokeWidth={2.4} />
        {Number.isFinite(slope) && <circle cx={pd.X(a)} cy={pd.Y(slope)} r={4.5} fill={sign} />}
        <T x={6} y={14} color={C.purple} bold>{`f′(x): ${tx(t, "figDer_slopeOf", "the slope of f")}`}</T>
      </g>
    </>;
  }
  return <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>;
}

export function DerivativeFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("secant");
  const [key, setKey] = useState("sq");
  const [a, setA] = useState(1);
  const [h, setH] = useState(1);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-derivative");
  const vis = useVisible<HTMLDivElement>();

  const fn = fnOf(key);
  const [lo, hi] = ends(fn);
  useFrame(playing && (vis.on || lab.open), dt => {
    if (mode === "secant") {
      if (Math.abs(h) <= H_MIN) setPlaying(false);
      else setH(h * 0.5 ** (dt * 1.5));
    } else {
      if (a >= hi) setPlaying(false);
      else setA(Math.min(hi, a + dt * 0.8));
    }
  });

  const stop = () => setPlaying(false);
  const pick = (m: Mode) => { setMode(m); stop(); };
  const choose = (k: string) => { setKey(k); stop(); const [l, r] = ends(fnOf(k)); setA(v => clamp(v, l, r)); };
  const hTo = (v: number) => { stop(); setH(v); };
  const aTo = (v: number) => { stop(); setA(clamp(+v.toFixed(2), lo, hi)); };
  const ar = +a.toFixed(2);
  const fa = fn.f(ar), slope = fn.d(ar);
  const sec = (fn.f(ar + h) - fa) / h;

  const view = (
    <div>
      <DerivStage mode={mode} fn={fn} a={ar} h={h} setA={v => { stop(); setA(v); }} t={t} />
      {mode === "secant" ? (
        <Transport t={t} playing={playing}
          onPlay={() => { if (Math.abs(h) <= H_MIN) setH(Math.sign(h)); setPlaying(p => !p); }}
          playLabel={tx(t, "figDer_shrink", "shrink h")}
          onStep={() => hTo(h / 2)}
          onBack={() => hTo(clamp(h * 2, -2, 2))}
          onReset={() => hTo(Math.sign(h))}
          readout={`h = ${fmtH(h)}`} />
      ) : (
        <Transport t={t} playing={playing}
          onPlay={() => { if (a >= hi) setA(lo); setPlaying(p => !p); }}
          playLabel={tx(t, "figDer_sweep", "sweep a across")}
          onStep={() => aTo(Math.floor(a * 2 + 1e-6) / 2 + 0.5)}
          onBack={() => aTo(Math.ceil(a * 2 - 1e-6) / 2 - 0.5)}
          onReset={() => aTo(lo)}
          readout={`a = ${n3(ar)}`} />
      )}
    </div>
  );

  const fnButtons = <Row>{FNS.map(e => <Btn key={e.key} active={key === e.key} onClick={() => choose(e.key)}>{e.label}</Btn>)}</Row>;
  let controls: React.ReactNode, note: string;
  if (mode === "secant") {
    controls = <>
      {fnButtons}
      <Row>
        <Btn active={h > 0} onClick={() => hTo(Math.abs(h))}>{tx(t, "figDer_right", "Q on the right")}</Btn>
        <Btn active={h < 0} onClick={() => hTo(-Math.abs(h))}>{tx(t, "figDer_left", "Q on the left")}</Btn>
      </Row>
      <Row>
        <Readout>{`a = ${n3(ar)}`}</Readout>
        <Readout color={C.amber}>{`${tx(t, "figDer_secant", "secant slope")} = (${n3(fn.f(ar + h))} − ${n3(fa)}) / ${fmtH(h)} = ${n3(sec)}`}</Readout>
        <Readout color={C.purple}>{Number.isFinite(slope)
          ? `f′(a) = ${n3(slope)}`
          : tx(t, "figDer_corner", "corner: left slope −1, right slope +1, no f′(0)")}</Readout>
      </Row>
    </>;
    note = tx(t, "figDer_noteS2", "Drag P along the curve. The amber secant joins P to Q; its slope is the rise (pink) over the run h (green): an average rate of change. Press ⏭ to halve h, or play to keep shrinking it: Q slides into P and the secant swings onto the dashed purple tangent. The slope it settles on is the derivative f′(a). h itself never reaches 0, where the formula would be 0/0: the derivative is the limit. Put Q on the left and the same thing happens from the other side, except on |x| at a = 0, where the two sides give slopes −1 and +1.");
  } else {
    const sign = !Number.isFinite(slope) ? C.muted : slope > 0.01 ? C.green : slope < -0.01 ? C.red : C.amber;
    controls = <>
      {fnButtons}
      <Row>
        <Readout color={C.sky}>{`f(a) = ${n3(fa)}`}</Readout>
        <Readout color={sign}>{Number.isFinite(slope) ? `f′(a) = ${n3(slope)}` : tx(t, "figDer_noD", "f′(0) does not exist")}</Readout>
        <Readout color={sign}>{!Number.isFinite(slope) ? tx(t, "figDer_cornerS", "corner")
          : slope > 0.01 ? tx(t, "figDer_up", "rising") : slope < -0.01 ? tx(t, "figDer_down", "falling") : tx(t, "figDer_flat", "flat")}</Readout>
      </Row>
    </>;
    note = tx(t, "figDer_noteG2", "Drag anywhere to move a, or press play to sweep it across. The top curve is f with its tangent at a (green while f rises, red while it falls). The bottom curve records the tangent's slope at every x: that new function is the derivative f′. Where f climbs steeply, f′ is large; where f has a peak or a valley, f′ crosses zero. Look at the special cases: sin x produces cos x, and eˣ produces itself.");
  }
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["secant", tx(t, "figDer_mS", "secant → tangent")],
    ["graph", tx(t, "figDer_mG", "slope graph")],
  ] as const} />;

  // ── Lab ──
  const secM = mode === "secant", graph = mode === "graph";
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figDerL1_t", "Secant into tangent"),
      body: <>
        <p>{tx(t, "figDerL1_b1", "P sits on y = x² at a = 1, and Q is h = 1 to its right. The amber secant through them has slope 3: an average rate.")}</p>
        <p>{tx(t, "figDerL1_b2", "Shrink h and watch the secant's slope.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDerL1_g", "h ≤ 0.01 (secant slope now {s})."), { s: n3(sec) }), done: secM && key === "sq" && h > 0 && h <= 0.01 + 1e-9 },
      hint: tx(t, "figDerL1_h", "Each ⏭ halves h; play keeps halving it."),
      focus: "step",
      setup: () => { pick("secant"); setKey("sq"); setA(1); setH(1); },
    },
    {
      title: tx(t, "figDerL2_t", "Quick check"),
      body: <p>{tx(t, "figDerL2_b", "For x² at a = 1 the secant slope is ((1 + h)² − 1)/h = (2h + h²)/h = 2 + h.")}</p>,
      quiz: {
        q: tx(t, "figDerL2_q", "What is the secant slope when h = 0.1?"),
        options: ["2.1", "2.01", "0.21", "2"],
        answer: 0,
        why: tx(t, "figDerL2_w", "2 + h = 2 + 0.1 = 2.1. Only in the limit h → 0 does it become 2, the derivative. 0.21 is the rise, before dividing by the run."),
      },
    },
    {
      title: tx(t, "figDerL3_t", "From the other side"),
      body: <>
        <p>{tx(t, "figDerL3_b1", "A limit needs both sides. Put Q on the left of P (negative h) and shrink h again.")}</p>
      </>,
      goal: { text: tx(t, "figDerL3_g", "Q on the left, |h| ≤ 0.01."), done: secM && key === "sq" && h < 0 && h >= -0.01 - 1e-9 },
      hint: tx(t, "figDerL3_h", "Press \"Q on the left\", then ⏭ until h is tiny. The slope is 2 + h, now just below 2."),
      setup: () => { pick("secant"); setKey("sq"); setA(1); setH(1); },
    },
    {
      title: tx(t, "figDerL4_t", "A corner"),
      body: <>
        <p>{tx(t, "figDerL4_b1", "|x| has a sharp corner at 0. With Q on the right, every secant from P = (0, 0) has slope +1.")}</p>
        <p>{tx(t, "figDerL4_b2", "Look from the left.")}</p>
      </>,
      goal: { text: tx(t, "figDerL4_g", "|x| at a = 0, Q on the left."), done: secM && key === "abs" && ar === 0 && h < 0 },
      setup: () => { pick("secant"); setKey("abs"); setA(0); setH(0.5); },
    },
    {
      title: tx(t, "figDerL5_t", "Where the slope is zero"),
      body: <>
        <p>{tx(t, "figDerL5_b1", "The slope graph: the bottom curve is f′, the tangent's slope at every point of the top curve.")}</p>
        <p>{tx(t, "figDerL5_b2", "Drag a to the bottom of the valley of x³ − 3x, on the right.")}</p>
      </>,
      goal: { text: tx(t, "figDerL5_g", "f′(a) = 0 (to 0.05) with a > 0."), done: graph && key === "cubic" && ar > 0 && Math.abs(slope) < 0.05 },
      hint: tx(t, "figDerL5_h", "f′(x) = 3x² − 3 is zero at x = 1."),
      setup: () => { pick("graph"); setKey("cubic"); setA(-2.4); },
    },
    {
      title: tx(t, "figDerL6_t", "Quick check"),
      body: <p>{tx(t, "figDerL6_b", "Pick sin x and sweep a across, watching the bottom curve.")}</p>,
      quiz: {
        q: tx(t, "figDerL6_q", "Which function does the slope graph of sin x trace?"),
        options: ["cos x", "−sin x", "sin x", "−cos x"],
        answer: 0,
        why: tx(t, "figDerL6_w", "At x = 0, sin climbs at slope 1 = cos 0; at its peak x = π/2 it is flat, and cos(π/2) = 0. The next chapter proves it from the limit sin x / x → 1."),
      },
      setup: () => { pick("graph"); setKey("sin"); setA(-3.9); },
    },
    {
      title: tx(t, "figDerL7_t", "Its own slope"),
      body: <>
        <p>{tx(t, "figDerL7_b1", "One function is special: at every point its slope equals its height.")}</p>
        <p>{tx(t, "figDerL7_b2", "Pick eˣ and sweep a to the right end. Compare the two curves.")}</p>
      </>,
      goal: { text: tx(t, "figDerL7_g", "eˣ, with a ≥ 1.5."), done: graph && key === "exp" && ar >= 1.5 },
      focus: "play",
      setup: () => { pick("graph"); setKey("sq"); setA(-2.4); },
    },
    {
      title: tx(t, "figDerL8_t", "Quick check"),
      body: <p>{tx(t, "figDerL8_b", "s(t) = t² has slope s′(1) = 2 at the point (1, 1).")}</p>,
      quiz: {
        q: tx(t, "figDerL8_q", "Which line is the tangent there?"),
        options: ["y = 2t − 1", "y = 2t", "y = t + 1", "y = 2t + 1"],
        answer: 0,
        why: tx(t, "figDerL8_w", "y = f(a) + f′(a)(t − a) = 1 + 2(t − 1) = 2t − 1. Check: at t = 1 it gives 1, the point of contact. y = 2t has the right slope but misses the point."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "close", tone: "ok", when: secM && Number.isFinite(slope) && Math.abs(h) <= 0.02,
      title: tx(t, "figDerI1_t", "Secant ≈ tangent"),
      body: fill(tx(t, "figDerI1_b", "The secant's slope {s} differs from f′(a) = {d} by only {e}. Halving h again halves the gap (roughly): the slopes are heading for f′(a)."), {
        s: n3(sec), d: n3(slope), e: n3(Math.abs(sec - slope)) }),
    },
    {
      id: "corner", tone: "warn", when: secM && key === "abs" && ar === 0,
      title: tx(t, "figDerI2_t", "Two slopes, no derivative"),
      body: tx(t, "figDerI2_b", "From the right every secant has slope +1, from the left −1. The two one-sided limits differ, so |x| has no derivative at 0, although it is continuous there."),
    },
    {
      id: "flat", tone: "info", when: graph && Number.isFinite(slope) && Math.abs(slope) < 0.05,
      title: tx(t, "figDerI3_t", "Flat tangent"),
      body: tx(t, "figDerI3_b", "f′(a) = 0: the tangent is horizontal. This is where f stops rising and starts falling (a peak), or the other way round (a valley). The bottom curve crosses zero here."),
    },
    {
      id: "exp", tone: "ok", when: graph && key === "exp",
      title: tx(t, "figDerI4_t", "Its own derivative"),
      body: fill(tx(t, "figDerI4_b", "f(a) = {v} and f′(a) = {v}: for eˣ the slope always equals the height, so the bottom curve is a copy of the top one. This property defines the number e."), { v: n3(fa) }),
    },
    {
      id: "sin", tone: "info", when: graph && key === "sin",
      title: tx(t, "figDerI5_t", "Sine gives cosine"),
      body: fill(tx(t, "figDerI5_b", "At a = {a} the slope of sin is {d}, and cos {a} = {d} too. The traced curve is cos x, shifted a quarter turn ahead of sin x."), { a: n3(ar), d: n3(slope) }),
    },
  ];

  const title = tx(t, "figDer_title", "From secant to tangent");
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
          tx(t, "figDerR1", "A secant's slope (f(a + h) − f(a))/h is an average rate of change."),
          tx(t, "figDerR2", "As h → 0 from both sides it tends to the tangent's slope, the derivative f′(a)."),
          tx(t, "figDerR3", "At a corner the two sides give different slopes: no derivative."),
          tx(t, "figDerR4", "f′ is a new function: zero at peaks and valleys; sin → cos, and eˣ is its own derivative."),
        ]}
      />
    </>
  );
}
