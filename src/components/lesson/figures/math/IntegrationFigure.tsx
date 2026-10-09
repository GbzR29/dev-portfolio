"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, plot, Grid, fnPath, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Parts: a rising curve y = g(x) from x = a to x = b. The area under it (blue)
// is ∫ y dx; the area between it and the y-axis (amber) is ∫ x dy. Together
// with the small corner rectangle a·g(a) they fill the big rectangle b·g(b),
// which is integration by parts: ∫ y dx = [xy] − ∫ x dy.
// Tail / spike: improper integrals. The Transport pushes the limit: b × 10
// per step (tail) or ε ÷ 10 per step (spike). The area under 1/x² out to b
// settles at 1 while the area under 1/x keeps growing like ln b; near 0,
// 1/√x has a finite area from ε to 1 (it tends to 2) while 1/x again does not.
// The lab: the area under ln x up to e, then both limits pushed far.

type Mode = "parts" | "tail" | "spike";
type Curve = "ln" | "sq";
const W = 560, H = 280;
const S_MAX: Record<"tail" | "spike", number> = { tail: 3, spike: 4 };   // b up to 10³, ε down to 10⁻⁴
const n3 = (v: number) => f2(v, 3).replace("-", "−");

const CURVES: Record<Curve, { f: (x: number) => number; a: number; view: [number, number, number, number]; bMax: number;
  blue: (b: number) => number; amber: (b: number) => number }> = {
  // ∫₁ᵇ ln x dx = b ln b − b + 1; ∫₀^{ln b} eʸ dy = b − 1
  ln: { f: Math.log, a: 1, view: [-0.3, 5.3, -0.4, 1.9], bMax: 5,
    blue: b => b * Math.log(b) - b + 1, amber: b => b - 1 },
  // ∫₀.₅ᵇ x² dx = (b³ − 1/8)/3; ∫_{1/4}^{b²} √y dy = (2/3)(b³ − 1/8)
  sq: { f: x => x * x, a: 0.5, view: [-0.2, 2.3, -0.4, 4.6], bMax: 2,
    blue: b => (b ** 3 - 0.125) / 3, amber: b => (2 / 3) * (b ** 3 - 0.125) },
};

// ── The drawings ──────────────────────────────────────────────────────────────

function PartsPlot({ curve, b }: { curve: Curve; b: number }) {
  const cv = CURVES[curve];
  const [x0, x1, y0, y1] = cv.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const a = cv.a, ga = cv.f(a), gb = cv.f(b);
  const N = 80, xs = Array.from({ length: N + 1 }, (_, i) => a + ((b - a) * i) / N);
  const curvePts = xs.map(x => `${pr.X(x)},${pr.Y(cv.f(x))}`).join(" ");
  const blue = `${pr.X(a)},${pr.Y(0)} ${curvePts} ${pr.X(b)},${pr.Y(0)}`;
  const amber = `${pr.X(0)},${pr.Y(ga)} ${curvePts} ${pr.X(0)},${pr.Y(gb)}`;
  return <>
    <Grid p={pr} step={curve === "sq" ? 0.5 : 1} labels major={1} />
    <polygon points={blue} fill={C.sky} fillOpacity={0.28} stroke="none" />
    <polygon points={amber} fill={C.amber} fillOpacity={0.28} stroke="none" />
    {ga > 0 && <rect x={pr.X(0)} y={pr.Y(ga)} width={pr.X(a) - pr.X(0)} height={pr.Y(0) - pr.Y(ga)} fill={C.muted} fillOpacity={0.18} stroke={C.muted} strokeDasharray="3 3" />}
    <rect x={pr.X(0)} y={pr.Y(gb)} width={pr.X(b) - pr.X(0)} height={pr.Y(0) - pr.Y(gb)} fill="none" stroke={C.green} strokeWidth={1.5} strokeDasharray="5 4" />
    <path d={fnPath(pr, cv.f, curve === "ln" ? 0.05 : x0)} fill="none" stroke={C.fg} strokeWidth={2} />
    <T x={pr.X((a + b) / 2)} y={pr.Y(0) - 8} color={C.sky} anchor="middle" bold>∫ y dx</T>
    <T x={pr.X(0) + 8} y={pr.Y((ga + gb) / 2) + (curve === "ln" ? -4 : 0)} color={C.amber} bold>∫ x dy</T>
    <T x={pr.X(b) + 4} y={pr.Y(gb) - 5} color={C.green} bold>{`(b, g(b))`}</T>
  </>;
}

function ImproperPlot({ mode, lim }: { mode: "tail" | "spike"; lim: number }) {
  const tail = mode === "tail";
  const pr = tail ? plot({ W, H, x0: -0.4, x1: 10.4, y0: -0.25, y1: 1.6 }) : plot({ W, H, x0: -0.08, x1: 1.25, y0: -1, y1: 12 });
  const good = tail ? (x: number) => 1 / (x * x) : (x: number) => 1 / Math.sqrt(x);
  const bad = (x: number) => 1 / x;
  const lo = tail ? 1 : lim, hi = tail ? Math.min(lim, pr.x1) : 1;
  const area = (f: (x: number) => number, top: number) => {
    const N = 120, pts = Array.from({ length: N + 1 }, (_, i) => { const x = lo + ((hi - lo) * i) / N; return `${pr.X(x)},${pr.Y(Math.min(f(x), top))}`; });
    return `${pr.X(lo)},${pr.Y(0)} ${pts.join(" ")} ${pr.X(hi)},${pr.Y(0)}`;
  };
  return <>
    <Grid p={pr} step={1} labels major={1} />
    <polygon points={area(bad, pr.y1 + 5)} fill={C.red} fillOpacity={0.16} />
    <polygon points={area(good, pr.y1 + 5)} fill={C.sky} fillOpacity={0.3} />
    <path d={fnPath(pr, bad, tail ? 0.3 : 0.004)} fill="none" stroke={C.red} strokeWidth={1.8} />
    <path d={fnPath(pr, good, tail ? 0.3 : 0.004)} fill="none" stroke={C.sky} strokeWidth={2} />
    {tail && lim > pr.x1 && <T x={pr.X(pr.x1) - 4} y={pr.Y(0) - 8} color={C.muted} anchor="end">{`→ b = ${f2(lim, 0)}`}</T>}
    <T x={pr.X(tail ? 2.2 : 0.5)} y={pr.Y(tail ? 0.6 : 2.6)} color={C.red} bold>1/x</T>
    <T x={pr.X(tail ? 1.3 : 0.3)} y={pr.Y(tail ? 1.1 : 1.1)} color={C.sky} bold>{tail ? "1/x²" : "1/√x"}</T>
  </>;
}

export function IntegrationFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("parts");
  const [curve, setCurve] = useState<Curve>("ln");
  const [b, setB] = useState(3.5);
  const [s, setS] = useState(0);             // tail: b = 10^s; spike: ε = 10^(−s)
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-integration");
  const vis = useVisible<HTMLDivElement>();
  const sMax = mode === "parts" ? 0 : S_MAX[mode];
  useFrame(playing && (vis.on || lab.open), dt => {
    if (s >= sMax) setPlaying(false);
    else setS(Math.min(sMax, s + dt * 0.6));
  });

  const stop = () => setPlaying(false);
  const pick = (m: Mode) => { setMode(m); stop(); setS(0.5); };
  const sTo = (v: number) => { stop(); setS(Math.max(0, Math.min(sMax, v))); };
  const cv = CURVES[curve];
  const bb = Math.min(b, cv.bMax);
  const big = bb * cv.f(bb), small = cv.a * cv.f(cv.a);
  const lim = mode === "tail" ? 10 ** s : 10 ** -s;
  const fmtLim = mode === "tail" ? f2(lim, lim < 10 ? 2 : 0) : lim.toExponential(1).replace("-", "−");

  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {mode === "parts" ? <PartsPlot curve={curve} b={bb} /> : <ImproperPlot mode={mode} lim={lim} />}
      </svg>
      {mode !== "parts" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (s >= sMax) setS(0.5); setPlaying(p => !p); }}
          playLabel={mode === "tail" ? tx(t, "figIbp_pushB", "push b out") : tx(t, "figIbp_pushE", "push ε toward 0")}
          onStep={() => sTo(Math.floor(s + 1e-6) + 1)}
          onBack={() => sTo(Math.ceil(s - 1e-6) - 1)}
          onReset={() => sTo(0.5)}
          readout={`${mode === "tail" ? "b" : "ε"} = ${fmtLim}`} />
      )}
    </div>
  );

  const controls = mode === "parts" ? <>
    <Row>
      <Btn active={curve === "ln"} onClick={() => { setCurve("ln"); setB(3.5); }}>y = ln x</Btn>
      <Btn active={curve === "sq"} onClick={() => { setCurve("sq"); setB(1.6); }}>y = x²</Btn>
    </Row>
    <Slider label="b" value={bb} min={cv.a + 0.05} max={cv.bMax} step={0.01} onChange={setB} width="w-10" />
    <Row>
      <Readout color={C.sky}>{`∫ y dx = ${n3(cv.blue(bb))}`}</Readout>
      <Readout color={C.amber}>{`∫ x dy = ${n3(cv.amber(bb))}`}</Readout>
      <Readout color={C.green}>{`b·g(b) − a·g(a) = ${n3(big)} − ${n3(small)} = ${n3(big - small)}`}</Readout>
    </Row>
  </> : <Row>
    {mode === "tail" ? <>
      <Readout color={C.sky}>{`∫₁ᵇ dx/x² = 1 − 1/b = ${n3(1 - 1 / lim)}`}</Readout>
      <Readout color={C.red}>{`∫₁ᵇ dx/x = ln b = ${n3(Math.log(lim))}`}</Readout>
    </> : <>
      <Readout color={C.sky}>{`∫ε¹ dx/√x = 2 − 2√ε = ${n3(2 - 2 * Math.sqrt(lim))}`}</Readout>
      <Readout color={C.red}>{`∫ε¹ dx/x = −ln ε = ${n3(-Math.log(lim))}`}</Readout>
    </>}
  </Row>;
  const note = mode === "parts"
    ? tx(t, "figIbp_noteParts", "The blue area under the curve and the amber area beside it fill the big dashed rectangle, b × g(b), except for the small grey corner a × g(a). So one area is the rectangle minus the other: ∫ y dx = [xy] − ∫ x dy. That is integration by parts. For y = ln x the amber area is easy (sideways the curve is x = eʸ), which is how ∫ ln x dx is found.")
    : mode === "tail"
      ? tx(t, "figIbp_noteTail2", "Press ⏭ to multiply b by 10, or play to push it out smoothly. Both curves shrink toward the axis, but at different speeds. The area under 1/x² approaches 1 and never passes it, so ∫₁^∞ dx/x² = 1. The area under 1/x grows without bound, only slowly: each time b is multiplied by 10 it gains another ln 10 ≈ 2.3.")
      : tx(t, "figIbp_noteSpike2", "Press ⏭ to divide ε by 10. Both curves shoot up to infinity at x = 0, yet the area under 1/√x from ε to 1 approaches 2: the spike is tall but thin enough. The area under 1/x grows without bound, like −ln ε.");
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["parts", tx(t, "figIbp_parts", "by parts")],
    ["tail", tx(t, "figIbp_tail", "to infinity")],
    ["spike", tx(t, "figIbp_spike", "near zero")],
  ] as const} />;

  // ── Lab ──
  const parts = mode === "parts";
  const blueA = cv.blue(bb);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figIbpL1_t", "One unit of area"),
      body: <>
        <p>{tx(t, "figIbpL1_b1", "By parts, the area under ln x from 1 to b is b ln b − b + 1: the rectangle minus the amber area beside the curve.")}</p>
        <p>{tx(t, "figIbpL1_b2", "Move b until the blue area is exactly 1.")}</p>
      </>,
      goal: { text: fill(tx(t, "figIbpL1_g", "∫₁ᵇ ln x dx = 1 (now {a})."), { a: n3(blueA) }), done: parts && curve === "ln" && Math.abs(blueA - 1) < 0.01 },
      hint: tx(t, "figIbpL1_h", "At b = e ≈ 2.72: e · 1 − e + 1 = 1."),
      setup: () => { pick("parts"); setCurve("ln"); setB(4); },
    },
    {
      title: tx(t, "figIbpL2_t", "Quick check"),
      body: <p>{tx(t, "figIbpL2_b", "You want ∫ x eˣ dx by parts: ∫ u dv = uv − ∫ v du.")}</p>,
      quiz: {
        q: tx(t, "figIbpL2_q", "Which choice makes the new integral easier?"),
        options: ["u = x, dv = eˣ dx", "u = eˣ, dv = x dx", "u = x eˣ, dv = dx", tx(t, "figIbpL2_o4", "parts cannot do it")],
        answer: 0,
        why: tx(t, "figIbpL2_w", "x becomes 1 when differentiated and eˣ stays eˣ when integrated: ∫ x eˣ dx = x eˣ − ∫ eˣ dx = (x − 1)eˣ + C. The other way round raises the power: x²/2 · eˣ − ∫ x²/2 · eˣ dx."),
      },
    },
    {
      title: tx(t, "figIbpL3_t", "Out to infinity"),
      body: <>
        <p>{tx(t, "figIbpL3_b1", "Both 1/x² and 1/x shrink toward 0 as x grows. Push b far out and compare their areas.")}</p>
      </>,
      goal: { text: tx(t, "figIbpL3_g", "b = 1000."), done: mode === "tail" && s >= 3 - 1e-6 },
      focus: "step",
      setup: () => { pick("tail"); },
    },
    {
      title: tx(t, "figIbpL4_t", "Quick check"),
      body: <p>{tx(t, "figIbpL4_b", "∫₁ᵇ x⁻³ dx = [−1/(2x²)]₁ᵇ = ½ − 1/(2b²).")}</p>,
      quiz: {
        q: tx(t, "figIbpL4_q", "What is ∫₁^∞ x⁻³ dx?"),
        options: ["½", "⅓", "1", tx(t, "figIbpL4_o4", "it diverges")],
        answer: 0,
        why: tx(t, "figIbpL4_w", "1/(2b²) → 0, leaving ½. The p-test agrees: p = 3 > 1, value 1/(p − 1) = ½."),
      },
    },
    {
      title: tx(t, "figIbpL5_t", "A spike with finite area"),
      body: <>
        <p>{tx(t, "figIbpL5_b1", "Near 0, 1/√x and 1/x both shoot up to infinity. Push the left end ε toward 0.")}</p>
      </>,
      goal: { text: tx(t, "figIbpL5_g", "ε = 0.0001."), done: mode === "spike" && s >= 4 - 1e-6 },
      focus: "step",
      setup: () => { pick("spike"); },
    },
    {
      title: tx(t, "figIbpL6_t", "Quick check"),
      body: <p>{tx(t, "figIbpL6_b", "The p-test near 0: ∫₀¹ x⁻ᵖ dx converges when p < 1, with value 1/(1 − p).")}</p>,
      quiz: {
        q: tx(t, "figIbpL6_q", "What is ∫₀¹ x^(−1/3) dx?"),
        options: ["3/2", "3", "2/3", tx(t, "figIbpL4_o4", "it diverges")],
        answer: 0,
        why: tx(t, "figIbpL6_w", "p = ⅓ < 1, so it converges to 1/(1 − ⅓) = 3/2. Directly: [(3/2) x^(2/3)]₀¹ = 3/2."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "e", tone: "ok", when: parts && curve === "ln" && Math.abs(blueA - 1) < 0.01,
      title: tx(t, "figIbpI1_t", "b = e"),
      body: tx(t, "figIbpI1_b", "b ln b − b + 1 = 1 exactly when b ln b = b, so ln b = 1 and b = e. The amber area beside the curve is then e − 1."),
    },
    {
      id: "rect", tone: "info", when: parts && Math.abs(blueA - 1) >= 0.01,
      title: tx(t, "figIbpI2_t", "The rectangle adds up"),
      body: fill(tx(t, "figIbpI2_b", "Blue {u} + amber {v} = {s}, the big rectangle minus the grey corner. Knowing either area gives the other: that is integration by parts."), {
        u: n3(blueA), v: n3(cv.amber(bb)), s: n3(big - small) }),
    },
    {
      id: "tail", tone: "warn", when: mode === "tail" && s >= 2 - 1e-6,
      title: tx(t, "figIbpI3_t", "Slow, but unbounded"),
      body: fill(tx(t, "figIbpI3_b", "At b = {b} the area under 1/x² is {g}, almost 1, while ln b = {l} keeps climbing by 2.3 for every factor of 10. 1/x shrinks, but not fast enough."), {
        b: fmtLim, g: n3(1 - 1 / lim), l: n3(Math.log(lim)) }),
    },
    {
      id: "spike", tone: "ok", when: mode === "spike" && s >= 2 - 1e-6,
      title: tx(t, "figIbpI4_t", "Tall but thin"),
      body: fill(tx(t, "figIbpI4_b", "At ε = {e} the area under 1/√x is {g}, closing in on 2: the spike is infinitely tall, yet its area is finite. 1/x's area, {l}, has no limit."), {
        e: fmtLim, g: n3(2 - 2 * Math.sqrt(lim)), l: n3(-Math.log(lim)) }),
    },
  ];

  const title = tx(t, "figIbp_title", "Areas that trade places");
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
          tx(t, "figIbpR1", "Area under the curve plus area beside it fill a rectangle: ∫ u dv = uv − ∫ v du."),
          tx(t, "figIbpR2", "An improper integral is a limit: integrate on a safe interval, then push the end out (or in)."),
          tx(t, "figIbpR3", "∫₁^∞ x⁻ᵖ converges for p > 1; ∫₀¹ x⁻ᵖ converges for p < 1; 1/x fails both."),
        ]}
      />
    </>
  );
}
