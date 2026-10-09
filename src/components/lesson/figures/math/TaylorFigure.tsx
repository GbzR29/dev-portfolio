"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Sliders, Btn, C, T, plot, Grid, fnPath, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A function (grey) and its Taylor polynomial of degree n around a centre a
// (amber): the polynomial whose value and first n derivatives at a match the
// function's. The Transport adds one term at a time (⏭) or keeps adding them
// (play), so the polynomial hugs the curve over a wider stretch. For eˣ and
// sin x that stretch grows forever; for ln(1 + x) and 1/(1 − x) it stops at
// the interval of convergence (shaded), whose half-width is the distance from
// a to the point where the function breaks down.
// The lab: copy sin 1.5 to three decimals, reach far out on eˣ, watch
// 1/(1 − x) diverge outside its band, then move the band with the centre.

type Key = "sin" | "exp" | "ln" | "geo";
type Fn = {
  label: string; f: (x: number) => number; coef: (k: number, a: number) => number;
  a: [number, number, number]; view: [number, number, number, number]; x: number;
  /** Interval of convergence around a, if it is not the whole line. */
  conv?: (a: number) => [number, number];
};

const fact = (k: number) => { let p = 1; for (let i = 2; i <= k; i++) p *= i; return p; };
const W = 560, H = 290, N_MAX = 15;

const FNS: Record<Key, Fn> = {
  sin: { label: "sin x", f: Math.sin, coef: (k, a) => Math.sin(a + (k * Math.PI) / 2) / fact(k), a: [-3, 3, 0], view: [-7.5, 7.5, -2.6, 2.6], x: 1.5 },
  exp: { label: "eˣ", f: Math.exp, coef: (k, a) => Math.exp(a) / fact(k), a: [-2, 1.5, 0], view: [-4.5, 3, -1.5, 8], x: 1 },
  ln: {
    label: "ln(1 + x)", f: x => Math.log(1 + x), a: [-0.5, 1.5, 0], view: [-1.5, 3.8, -3, 2], x: 0.5,
    coef: (k, a) => (k === 0 ? Math.log(1 + a) : ((k % 2 ? 1 : -1) / (k * (1 + a) ** k))),
    conv: a => [-1, 1 + 2 * a],
  },
  geo: {
    label: "1/(1 − x)", f: x => 1 / (1 - x), a: [-1, 0.6, 0], view: [-3.2, 2.2, -2, 6], x: 0.5,
    coef: (k, a) => 1 / (1 - a) ** (k + 1),
    conv: a => [2 * a - 1, 1],
  },
};

const taylor = (fn: Fn, n: number, a: number) => {
  const c = Array.from({ length: n + 1 }, (_, k) => fn.coef(k, a));
  return (x: number) => { let s = 0, p = 1; for (let k = 0; k <= n; k++) { s += c[k] * p; p *= x - a; } return s; };
};
const s4 = (v: number) => (Number.isFinite(v) ? (Math.abs(v) >= 1e4 ? v.toExponential(2) : f2(v, 5)) : "—").replace("-", "−");
const sub = (n: number) => String(n).split("").map(c => "₀₁₂₃₄₅₆₇₈₉"[+c]).join("");

// ── The drawing ───────────────────────────────────────────────────────────────

function TaylorDrawing({ k, n, a, x }: { k: Key; n: number; a: number; x: number }) {
  const fn = FNS[k];
  const [x0, x1, y0, y1] = fn.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const conv = fn.conv?.(a);
  return <>
    {conv && <rect x={pr.X(Math.max(x0, conv[0]))} y={0} width={pr.X(Math.min(x1, conv[1])) - pr.X(Math.max(x0, conv[0]))} height={H} fill={C.green} fillOpacity={0.08} />}
    <Grid p={pr} step={1} labels major={1} />
    <path d={fnPath(pr, fn.f, k === "ln" ? -0.999 : x0, k === "geo" ? 0.999 : x1, 400)} fill="none" stroke={C.fg} strokeWidth={2} opacity={0.55} />
    {k === "geo" && <path d={fnPath(pr, fn.f, 1.001, x1)} fill="none" stroke={C.fg} strokeWidth={2} opacity={0.55} />}
    <path d={fnPath(pr, taylor(fn, n, a), x0, x1, 400)} fill="none" stroke={C.amber} strokeWidth={2.2} />
    <line x1={pr.X(x)} x2={pr.X(x)} y1={0} y2={H} stroke={C.purple} strokeDasharray="3 4" />
    <circle cx={pr.X(a)} cy={pr.Y(fn.f(a))} r={4.5} fill={C.amber} stroke="var(--code-bg)" strokeWidth={1.5} />
    <T x={pr.X(a) + 7} y={pr.Y(fn.f(a)) + 14} color={C.amber} bold>a</T>
    <T x={pr.X(x) + 4} y={12} color={C.purple}>x</T>
    <T x={8} y={H - 8} color={C.amber} bold>{`T${sub(n)}`}</T>
  </>;
}

export function TaylorFigure({ t }: { t?: TrackTranslations }) {
  const [key, setKey] = useState<Key>("sin");
  const [n, setN] = useState(1);
  const [a, setA] = useState(0);
  const [x, setX] = useState(1.5);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);                               // time since the last automatic term
  const lab = useLab("math-taylor");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && (vis.on || lab.open), dt => {
    if (n >= N_MAX) { setPlaying(false); return; }
    acc.current += dt;
    if (acc.current > 0.8) { acc.current = 0; setN(Math.min(N_MAX, n + 1)); }
  });

  const stop = () => setPlaying(false);
  const nTo = (v: number) => { stop(); setN(Math.max(0, Math.min(N_MAX, v))); };
  const pick = (k: Key) => { setKey(k); setA(FNS[k].a[2]); setX(FNS[k].x); stop(); };

  const fn = FNS[key];
  const [x0, x1] = fn.view;
  const conv = fn.conv?.(a);
  const fx = fn.f(x), tn = taylor(fn, n, a)(x);
  const err = Math.abs(fx - tn);
  const inside = !conv || (x > conv[0] && x < conv[1]);

  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto"><TaylorDrawing k={key} n={n} a={a} x={x} /></svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (n >= N_MAX) setN(0); acc.current = 0; setPlaying(p => !p); }}
        playLabel={tx(t, "figTay_add", "keep adding terms")}
        onStep={() => nTo(n + 1)}
        onBack={() => nTo(n - 1)}
        onReset={() => nTo(0)}
        readout={`${tx(t, "figTay_n", "degree n")} = ${n}`} />
    </div>
  );
  const fnChoice = <>{(Object.keys(FNS) as Key[]).map(k => <Btn key={k} active={key === k} onClick={() => pick(k)}>{FNS[k].label}</Btn>)}</>;
  const controls = <>
    <Sliders>
      <Slider label={tx(t, "figTay_a", "centre a")} value={a} min={fn.a[0]} max={fn.a[1]} step={0.05} onChange={setA} />
      <Slider label={tx(t, "figTay_x", "test x")} value={x} min={x0 + 0.1} max={x1 - 0.1} step={0.05} onChange={setX} />
    </Sliders>
    <Row>
      <Readout>{`f(x) = ${s4(fx)}`}</Readout>
      <Readout color={C.amber}>{`T${sub(n)}(x) = ${s4(tn)}`}</Readout>
      <Readout color={err < 1e-3 ? C.green : C.red}>{`${tx(t, "figTay_err", "error")} = ${Number.isFinite(err) ? err.toExponential(1).replace("-", "−") : "—"}`}</Readout>
      {conv && <Readout color={inside ? C.green : C.red}>{inside ? tx(t, "figTay_in", "inside the interval of convergence") : tx(t, "figTay_out", "outside: more terms make it worse")}</Readout>}
    </Row>
  </>;
  const note = tx(t, "figTay_note2", "Press ⏭ to add one term. Degree 0 is a flat line at the right height, degree 1 the tangent line, degree 2 adds the bend, and every extra term copies one more derivative at a. For sin x and eˣ the copy stays good further and further out, without limit. For ln(1 + x) and 1/(1 − x) the copy is good only inside the green band: it reaches from a to the point where the function breaks down (x = −1 or x = 1) and equally far on the other side. Move the centre a and watch the band change.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figTayL1_t", "Copy the sine"),
      body: <>
        <p>{tx(t, "figTayL1_b1", "The amber polynomial copies sin x at a = 0: same value, same slope, same bend, and so on. The purple line is the test point x = 1.5.")}</p>
        <p>{tx(t, "figTayL1_b2", "Add terms until the copy is right to three decimals at x.")}</p>
      </>,
      goal: { text: fill(tx(t, "figTayL1_g", "error < 0.001 at x = 1.5 (now {e})."), { e: err.toExponential(1).replace("-", "−") }), done: key === "sin" && Math.abs(x - 1.5) < 0.01 && err < 1e-3 },
      hint: tx(t, "figTayL1_h", "Even-degree terms of sine are 0, so the error only drops on odd steps. Degree 7 does it."),
      focus: "step",
      setup: () => { pick("sin"); setN(1); },
    },
    {
      title: tx(t, "figTayL2_t", "Quick check"),
      body: <p>{tx(t, "figTayL2_b", "The coefficient of xᵏ is f⁽ᵏ⁾(0)/k!. For sine, the third derivative is −cos, and −cos 0 = −1.")}</p>,
      quiz: {
        q: tx(t, "figTayL2_q", "What is the coefficient of x³ in the series of sin x?"),
        options: ["−1/6", "−1/3", "1/6", "−1"],
        answer: 0,
        why: tx(t, "figTayL2_w", "−1/3! = −1/6. Forgetting the factorial gives −1; dividing by 3 instead of 3! gives −1/3."),
      },
    },
    {
      title: tx(t, "figTayL3_t", "Far from the centre"),
      body: <>
        <p>{tx(t, "figTayL3_b1", "The series of eˣ converges everywhere, but far from a = 0 it needs more terms.")}</p>
        <p>{tx(t, "figTayL3_b2", "Move the test point to x = 2.5 and add terms until the error is below 0.01.")}</p>
      </>,
      goal: { text: fill(tx(t, "figTayL3_g", "x ≥ 2.5 and error < 0.01 (now {e})."), { e: err.toExponential(1).replace("-", "−") }), done: key === "exp" && x >= 2.5 - 1e-9 && err < 0.01 },
      hint: tx(t, "figTayL3_h", "The x slider first, then ⏭. Around degree 9."),
      setup: () => { pick("exp"); setN(2); },
    },
    {
      title: tx(t, "figTayL4_t", "Outside the band"),
      body: <>
        <p>{tx(t, "figTayL4_b1", "1/(1 − x) = 1 + x + x² + … only while |x| < 1, the green band. Put the test point outside it, at x = −1.5, and add terms.")}</p>
      </>,
      goal: { text: tx(t, "figTayL4_g", "x outside the band, degree ≥ 6."), done: key === "geo" && !inside && x < 0 && n >= 6 },
      hint: tx(t, "figTayL4_h", "Watch the error readout: it grows with every term instead of shrinking."),
      setup: () => { pick("geo"); setN(1); },
    },
    {
      title: tx(t, "figTayL5_t", "Quick check"),
      body: <p>{tx(t, "figTayL5_b", "The band reaches from the centre to the nearest point where the function breaks down. 1/(1 − x) breaks down at x = 1.")}</p>,
      quiz: {
        q: tx(t, "figTayL5_q", "Centred at a = −0.5, what is the radius of convergence?"),
        options: ["1.5", "1", "0.5", "∞"],
        answer: 0,
        why: tx(t, "figTayL5_w", "The distance from −0.5 to 1 is 1.5, so the series converges on (−2, 1). Move a in the figure to see the band."),
      },
    },
    {
      title: tx(t, "figTayL6_t", "Move the centre"),
      body: <>
        <p>{tx(t, "figTayL6_b1", "ln(1 + x) breaks down at x = −1. Centred at 0 its band is (−1, 1).")}</p>
        <p>{tx(t, "figTayL6_b2", "Move the centre to a = 1. Where does the band reach now?")}</p>
      </>,
      goal: { text: tx(t, "figTayL6_g", "a = 1: the band is (−1, 3)."), done: key === "ln" && Math.abs(a - 1) < 0.03 },
      setup: () => { pick("ln"); setN(4); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "flat", tone: "info", when: n === 0,
      title: tx(t, "figTayI1_t", "Degree 0"),
      body: tx(t, "figTayI1_b", "Only the value at a is copied: a flat line at height f(a)."),
    },
    {
      id: "tangent", tone: "info", when: n === 1,
      title: tx(t, "figTayI2_t", "Degree 1"),
      body: tx(t, "figTayI2_b", "Value and slope copied: this is the tangent line f(a) + f′(a)(x − a) of the derivatives chapter."),
    },
    {
      id: "out", tone: "warn", when: !inside && n >= 3,
      title: tx(t, "figTayI3_t", "Diverging"),
      body: fill(tx(t, "figTayI3_b", "x is outside the band, so the terms grow instead of shrinking: at degree {n} the error is {e}, and each new term makes it worse."), { n, e: s4(err) }),
    },
    {
      id: "good", tone: "ok", when: inside && err < 1e-4 && n >= 2,
      title: tx(t, "figTayI4_t", "A close copy"),
      body: fill(tx(t, "figTayI4_b", "{n} derivatives copied at a, and at x the polynomial is off by only {e}."), { n, e: err.toExponential(1).replace("-", "−") }),
    },
  ];

  const title = tx(t, "figTay_title", "Polynomials that copy a function");
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
          tx(t, "figTayR1", "The Taylor polynomial copies f and its first n derivatives at a, with coefficients f⁽ᵏ⁾(a)/k!."),
          tx(t, "figTayR2", "More terms copy further out; far from a you need more of them."),
          tx(t, "figTayR3", "Some series only work inside a band reaching to where the function breaks down; outside, more terms make it worse."),
        ]}
      />
    </>
  );
}
