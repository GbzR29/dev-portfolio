"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, C, T, plot, Grid, fnPath, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The area between a curve and the x-axis from a to b, approximated by n
// strips of width Δx = (b − a)/n. Each strip's height is read from the curve
// at its left edge, right edge or midpoint; the trapezoid rule joins the two
// edge heights with a slanted top instead. Strips below the axis count as
// negative (red). The Transport doubles n (1, 2, 4 … 64): every rule
// converges on the exact area, the definite integral, and the readout shows
// by how much each doubling divided the error: about 2 for the left and right
// rules, about 4 for the midpoint and trapezoid rules.
// The lab: bracket a rising curve, see the 2 and the 4, signed area, ln 4.

type Rule = "left" | "right" | "mid" | "trap";
type Fn = { key: string; label: string; f: (x: number) => number; a: number; b: number; exact: number; exactLabel: string; view: [number, number, number, number] };

const W = 560, H = 280, N_MAX = 64;
const FNS: Fn[] = [
  { key: "sq", label: "x² on [0, 2]", f: x => x * x, a: 0, b: 2, exact: 8 / 3, exactLabel: "8/3", view: [-0.25, 2.3, -0.5, 4.5] },
  { key: "sin", label: "sin x on [0, π]", f: Math.sin, a: 0, b: Math.PI, exact: 2, exactLabel: "2", view: [-0.25, 3.5, -0.3, 1.3] },
  { key: "signed", label: "x³ − x on [−1, 1.5]", f: x => x ** 3 - x, a: -1, b: 1.5, exact: 25 / 64, exactLabel: "25/64", view: [-1.3, 1.8, -0.8, 2] },
  { key: "recip", label: "1/x on [1, 4]", f: x => 1 / x, a: 1, b: 4, exact: Math.log(4), exactLabel: "ln 4", view: [-0.2, 4.3, -0.2, 1.3] },
];
const n5 = (v: number) => f2(v, 5).replace("-", "−");
const fnOf = (k: string) => FNS.find(e => e.key === k)!;

/** The rule's estimate plus the strips to draw. */
function strips(fn: Fn, n: number, rule: Rule) {
  const dx = (fn.b - fn.a) / n, out: { x0: number; x1: number; h0: number; h1: number }[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = fn.a + i * dx, x1 = x0 + dx;
    let h0: number, h1: number;
    if (rule === "trap") { h0 = fn.f(x0); h1 = fn.f(x1); }
    else { const h = fn.f(rule === "left" ? x0 : rule === "right" ? x1 : x0 + dx / 2); h0 = h1 = h; }
    sum += ((h0 + h1) / 2) * dx;
    out.push({ x0, x1, h0, h1 });
  }
  return { dx, sum, out };
}

// ── The drawing ───────────────────────────────────────────────────────────────

function RiemannDrawing({ fn, n, rule }: { fn: Fn; n: number; rule: Rule }) {
  const [x0, x1, y0, y1] = fn.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const { out } = strips(fn, n, rule);
  return <>
    <Grid p={pr} step={fn.key === "sq" ? 1 : 0.5} labels major={1} />
    {out.map((s, i) => {
      const pos = s.h0 + s.h1 >= 0, col = pos ? C.sky : C.red;
      return <polygon key={i} points={`${pr.X(s.x0)},${pr.Y(0)} ${pr.X(s.x0)},${pr.Y(s.h0)} ${pr.X(s.x1)},${pr.Y(s.h1)} ${pr.X(s.x1)},${pr.Y(0)}`}
        fill={col} fillOpacity={0.25} stroke={col} strokeWidth={n > 40 ? 0.5 : 1} />;
    })}
    {rule !== "trap" && n <= 32 && out.map((s, i) => {
      const px = rule === "left" ? s.x0 : rule === "right" ? s.x1 : (s.x0 + s.x1) / 2;
      return <circle key={i} cx={pr.X(px)} cy={pr.Y(s.h0)} r={2.6} fill={C.amber} />;
    })}
    <path d={fnPath(pr, fn.f, fn.key === "recip" ? 0.2 : x0)} fill="none" stroke={C.fg} strokeWidth={2} />
    <T x={pr.X(fn.a)} y={pr.Y(0) + 22} color={C.purple} anchor="middle" bold>a</T>
    <T x={pr.X(fn.b)} y={pr.Y(0) + 22} color={C.purple} anchor="middle" bold>b</T>
  </>;
}

export function RiemannFigure({ t }: { t?: TrackTranslations }) {
  const [rule, setRule] = useState<Rule>("left");
  const [key, setKey] = useState("sq");
  const [n, setN] = useState(4);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);                              // time since the last automatic doubling
  const lab = useLab("math-riemann");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && (vis.on || lab.open), dt => {
    if (n >= N_MAX) { setPlaying(false); return; }
    acc.current += dt;
    if (acc.current > 0.9) { acc.current = 0; setN(Math.min(N_MAX, n * 2)); }
  });

  const stop = () => setPlaying(false);
  const nTo = (v: number) => { stop(); setN(Math.max(1, Math.min(N_MAX, v))); };
  const choose = (k: string) => { setKey(k); stop(); };
  const pickRule = (r: Rule) => { setRule(r); stop(); };

  const fn = fnOf(key);
  const { dx, sum } = strips(fn, n, rule);
  const err = sum - fn.exact;
  const prevErr = n > 1 ? strips(fn, n / 2, rule).sum - fn.exact : NaN;
  const ratio = Math.abs(prevErr / err);
  const fmtE = (e: number) => e.toExponential(2).replace(/-/g, "−");

  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto"><RiemannDrawing fn={fn} n={n} rule={rule} /></svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (n >= N_MAX) setN(1); acc.current = 0; setPlaying(p => !p); }}
        playLabel={tx(t, "figRie_double", "keep doubling the strips")}
        onStep={() => nTo(n * 2)}
        onBack={() => nTo(n / 2)}
        onReset={() => nTo(1)}
        readout={`n = ${n}`} />
    </div>
  );
  const ruleChoice = <Choice value={rule} onChange={pickRule} options={[
    ["left", tx(t, "figRie_left", "left")],
    ["right", tx(t, "figRie_right", "right")],
    ["mid", tx(t, "figRie_mid", "midpoint")],
    ["trap", tx(t, "figRie_trap", "trapezoid")],
  ] as const} />;
  const controls = <>
    <Row>{FNS.map(e => <Btn key={e.key} active={key === e.key} onClick={() => choose(e.key)}>{e.label}</Btn>)}</Row>
    <Row>
      <Readout>{`Δx = ${n5(dx)}`}</Readout>
      <Readout color={C.sky}>{`${tx(t, "figRie_sum", "sum of strips")} = ${n5(sum)}`}</Readout>
      <Readout color={C.green}>{`${tx(t, "figRie_exact", "exact")} = ${fn.exactLabel} = ${n5(fn.exact)}`}</Readout>
    </Row>
    <Row>
      <Readout color={Math.abs(err) < 1e-3 ? C.green : C.amber}>{`${tx(t, "figRie_err", "error")} = ${fmtE(err)}`}</Readout>
      {n > 1 && Number.isFinite(ratio) && <Readout color={C.purple}>{fill(tx(t, "figRie_ratio", "doubling n divided the error by {r}"), { r: f2(ratio, 2) })}</Readout>}
    </Row>
  </>;
  const note = tx(t, "figRie_note2", "Each strip is Δx wide; its height is the curve's value at the chosen point, so its area is height × Δx. Blue strips sit above the axis and add; red ones sit below and subtract, so the total is a signed area. Press ⏭ to double n: the staircase hugs the curve and the error shrinks. With the left and right rules each doubling roughly halves the error; with the midpoint and trapezoid rules it divides it by about four, because their over- and under-estimates largely cancel.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figRieL1_t", "Under the curve"),
      body: <>
        <p>{tx(t, "figRieL1_b1", "x² rises on [0, 2]. The left rule reads each strip's height at its left edge, the lowest point of the strip, so the sum falls short of the true area 8/3.")}</p>
        <p>{tx(t, "figRieL1_b2", "Double the strips until the error is below 0.1.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRieL1_g", "|error| < 0.1 with the left rule (now {e})."), { e: fmtE(err) }), done: rule === "left" && key === "sq" && Math.abs(err) < 0.1 },
      hint: tx(t, "figRieL1_h", "Each ⏭ doubles n. The error is about 4/n."),
      focus: "step",
      setup: () => { pickRule("left"); choose("sq"); setN(1); },
    },
    {
      title: tx(t, "figRieL2_t", "Quick check"),
      body: <p>{tx(t, "figRieL2_b", "Watch the purple readout as you double n with the left rule.")}</p>,
      quiz: {
        q: tx(t, "figRieL2_q", "With 1000 strips the left sum is off by about 0.004. Roughly how far off is it with 2000?"),
        options: ["0.002", "0.001", "0.0005", "0.004"],
        answer: 0,
        why: tx(t, "figRieL2_w", "The left rule's error is proportional to Δx: halve the strip width, halve the error. 0.001 would be the midpoint rule's pattern, a quarter."),
      },
    },
    {
      title: tx(t, "figRieL3_t", "A better rule"),
      body: <>
        <p>{tx(t, "figRieL3_b1", "The midpoint rule reads each height at the centre of its strip. Where the curve rises, the piece it misses on the left roughly matches the piece it adds on the right.")}</p>
        <p>{tx(t, "figRieL3_b2", "Get the error below 0.005 with the midpoint rule.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRieL3_g", "|error| < 0.005 with the midpoint rule (now {e})."), { e: fmtE(err) }), done: rule === "mid" && key === "sq" && Math.abs(err) < 0.005 },
      hint: tx(t, "figRieL3_h", "16 strips are enough. The left rule would need about 1000."),
      focus: "step",
      setup: () => { pickRule("mid"); choose("sq"); setN(1); },
    },
    {
      title: tx(t, "figRieL4_t", "Area below the axis"),
      body: <>
        <p>{tx(t, "figRieL4_b1", "x³ − x dips below the axis between −1 and 1. There f(x) is negative, so the strips there (red) subtract.")}</p>
        <p>{tx(t, "figRieL4_b2", "Pick x³ − x and use enough strips to see the red part clearly.")}</p>
      </>,
      goal: { text: tx(t, "figRieL4_g", "x³ − x with n ≥ 8."), done: key === "signed" && n >= 8 },
      setup: () => { pickRule("mid"); choose("sq"); setN(2); },
    },
    {
      title: tx(t, "figRieL5_t", "Quick check"),
      body: <p>{tx(t, "figRieL5_b", "x³ is odd: x³ at −x is minus x³ at x.")}</p>,
      quiz: {
        q: tx(t, "figRieL5_q", "What is ∫ x³ dx from −2 to 2?"),
        options: ["0", "8", "4", "16"],
        answer: 0,
        why: tx(t, "figRieL5_w", "The strips on the left are the mirror images of those on the right, but below the axis: every positive strip cancels a negative one. 8 is the area of one half."),
      },
    },
    {
      title: tx(t, "figRieL6_t", "A logarithm from strips"),
      body: <>
        <p>{tx(t, "figRieL6_b1", "The area under 1/x from 1 to 4 is ln 4 ≈ 1.38629, as the next chapters show.")}</p>
        <p>{tx(t, "figRieL6_b2", "Compute it to within a thousandth with any rule you like.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRieL6_g", "|error| < 0.001 on 1/x (now {e})."), { e: fmtE(err) }), done: key === "recip" && Math.abs(err) < 0.001 },
      hint: tx(t, "figRieL6_h", "The trapezoid or midpoint rule gets there with 32 strips; left or right would need over a thousand."),
    },
  ];

  const rising = key === "sq" || key === "recip";
  const insights: Insight[] = [
    {
      id: "bracket", tone: "info", when: key === "sq" && (rule === "left" || rule === "right") && n <= 16,
      title: tx(t, "figRieI1_t", "Too low, too high"),
      body: tx(t, "figRieI1_b", "x² rises, so every left height is the lowest in its strip and every right height the highest: the left sum is too small, the right sum too big, and the true area is trapped between them."),
    },
    {
      id: "ratio2", tone: "info", when: n >= 4 && (rule === "left" || rule === "right") && rising && ratio > 1.7 && ratio < 2.3,
      title: tx(t, "figRieI2_t", "Error ÷ 2"),
      body: tx(t, "figRieI2_b", "Each doubling of n halves the error of the left and right rules: their error is proportional to the strip width Δx."),
    },
    {
      id: "ratio4", tone: "ok", when: n >= 4 && (rule === "mid" || rule === "trap") && ratio > 3.5 && ratio < 4.5,
      title: tx(t, "figRieI3_t", "Error ÷ 4"),
      body: tx(t, "figRieI3_b", "Each doubling of n divides the error by four: the midpoint and trapezoid errors are proportional to Δx². Twice the work, four times the accuracy."),
    },
    {
      id: "signed", tone: "warn", when: key === "signed",
      title: tx(t, "figRieI4_t", "Signed area"),
      body: tx(t, "figRieI4_b", "The red strips lie below the axis and count as negative. The integral 25/64 is the area above the axis minus the area below, not the total shaded area."),
    },
    {
      id: "close", tone: "ok", when: Math.abs(err) < 1e-3,
      title: tx(t, "figRieI5_t", "Within a thousandth"),
      body: fill(tx(t, "figRieI5_b", "{n} strips give {s}, against the exact {x}. The limit of these sums as n → ∞ is the definite integral."), { n, s: n5(sum), x: n5(fn.exact) }),
    },
  ];

  const title = tx(t, "figRie_title", "Area by thin strips");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{ruleChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{ruleChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figRieR1", "A Riemann sum adds strips of width Δx and height f at a sample point; its limit is the integral."),
          tx(t, "figRieR2", "On a rising curve the left sum is too small and the right sum too big: they bracket the area."),
          tx(t, "figRieR3", "Doubling n halves the left/right error but quarters the midpoint/trapezoid error."),
          tx(t, "figRieR4", "Strips below the axis subtract: the integral is a signed area."),
        ]}
      />
    </>
  );
}
