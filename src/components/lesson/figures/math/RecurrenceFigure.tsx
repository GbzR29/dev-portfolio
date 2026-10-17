"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The terms of aₙ = p·aₙ₋₁ + q·aₙ₋₂ as bars, built one at a time (each new bar
// is p times the last plus q times the one before), and the closed form found
// from the characteristic equation x² = px + q drawn as dots on top: they
// land exactly on the bars. With two real roots the closed form is
// A·r₁ⁿ + B·r₂ⁿ, with a double root (A + Bn)·rⁿ, with complex roots ρⁿ times
// a cosine wave. "Break it: only the bigger root" keeps just A·r₁ⁿ: for
// Fibonacci the error shrinks below 1/2, which is why Fₙ = round(φⁿ/√5).

const W = 560, H = 240, N = 12, L = 46, TOP = 34, BOT = H - 40;
const num = (v: number, d = 3) => {
  const s = Math.abs(v) < 5e-7 ? "0" : String(+v.toFixed(d));
  return s.replace("-", "−");
};
const par = (v: number, d = 3) => (v < 0 ? `(${num(v, d)})` : num(v, d));
const pw = (r: number) => `${par(r)}ⁿ`;
const sub = (k: number) => String(k).split("").map(d => "₀₁₂₃₄₅₆₇₈₉"[+d]).join("");
/** c₁·s₁ + c₂·s₂ + … with the real signs and no "1·": "aₙ₋₁ − aₙ₋₂", "x − 1". */
function combo(parts: [number, string][]) {
  const kept = parts.filter(([c]) => Math.abs(c) > 5e-7);
  if (!kept.length) return "0";
  return kept.map(([c, s], i) => {
    const a = Math.abs(c), dot = /^[a-z]$/.test(s) ? "" : "·";      // "3x", but "3·aₙ₋₁"
    const body = !s ? num(a) : Math.abs(a - 1) < 5e-7 ? s : `${num(a)}${dot}${s}`;
    return i === 0 ? (c < 0 ? `−${body}` : body) : `${c < 0 ? " − " : " + "}${body}`;
  }).join("");
}

type Closed = { kind: "real" | "double" | "complex"; at: (n: number) => number; dom: (n: number) => number; text: string; roots: string };

/** The closed form of aₙ = p aₙ₋₁ + q aₙ₋₂ from a₀, a₁. */
export function closedForm(p: number, q: number, a0: number, a1: number): Closed | null {
  const D = p * p + 4 * q;
  if (Math.abs(q) < 1e-12) return null;                     // first order: not this figure's case
  if (D > 1e-12) {
    const s = Math.sqrt(D), r1 = (p + s) / 2, r2 = (p - s) / 2;
    const Bc = (a1 - a0 * r1) / (r2 - r1), Ac = a0 - Bc;
    const big = Math.abs(r1) >= Math.abs(r2);
    return {
      kind: "real",
      at: n => Ac * r1 ** n + Bc * r2 ** n,
      dom: n => (big ? Ac * r1 ** n : Bc * r2 ** n),
      text: `aₙ = ${combo([[Ac, pw(r1)], [Bc, pw(r2)]])}`,
      roots: `r₁ = ${num(r1)},  r₂ = ${num(r2)}`,
    };
  }
  if (D > -1e-12) {
    const r = p / 2, Ac = a0, Bc = a1 / r - a0;
    return {
      kind: "double",
      at: n => (Ac + Bc * n) * r ** n,
      dom: n => (Ac + Bc * n) * r ** n,                    // one root: nothing to drop
      text: `aₙ = (${combo([[Ac, ""], [Bc, "n"]])})·${pw(r)}`,
      roots: `r₁ = r₂ = ${num(r)}`,
    };
  }
  const rho = Math.sqrt(-q), th = Math.acos(Math.max(-1, Math.min(1, p / (2 * rho))));
  const Cc = a0, Dc = (a1 / rho - a0 * Math.cos(th)) / Math.sin(th);
  return {
    kind: "complex",
    at: n => rho ** n * (Cc * Math.cos(n * th) + Dc * Math.sin(n * th)),
    dom: n => rho ** n * (Cc * Math.cos(n * th) + Dc * Math.sin(n * th)),
    text: `aₙ = ${pw(rho)}·(${combo([[Cc, `cos ${num((th * 180) / Math.PI, 1)}°n`], [Dc, `sin ${num((th * 180) / Math.PI, 1)}°n`]])})`,
    roots: `r = ${num(p / 2)} ± ${num(Math.sqrt(-D) / 2)}i`,
  };
}

/** a₀ … a_N by the recurrence itself. */
function terms(p: number, q: number, a0: number, a1: number) {
  const a = [a0, a1];
  for (let n = 2; n <= N; n++) a.push(p * a[n - 1] + q * a[n - 2]);
  return a;
}

const PRESETS = {
  fib: { p: 1, q: 1, a0: 0, a1: 1, name: "Fibonacci" },
  lucas: { p: 1, q: 1, a0: 2, a1: 1, name: "Lucas" },
  pell: { p: 2, q: 1, a0: 0, a1: 1, name: "Pell" },
  pow: { p: 3, q: -2, a0: 0, a1: 1, name: "2ⁿ − 1" },
  line: { p: 2, q: -1, a0: 0, a1: 1, name: "n" },
  wave: { p: 1, q: -1, a0: 1, a1: 1, name: "↺ 6" },
} as const;
type Pid = keyof typeof PRESETS;

export function RecurrenceFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState(1);
  const [q, setQ] = useState(1);
  const [a0, setA0] = useState(0);
  const [a1, setA1] = useState(1);
  const [k, setK] = useState(N);                 // terms shown: a₀ … a_k
  const [playing, setPlaying] = useState(false);
  const [acc, setAcc] = useState(0);
  const [dom, setDom] = useState(false);
  const [preset, setPreset] = useState<Pid | null>("fib");
  const lab = useLab("math-recurrences");
  const vis = useVisible<HTMLDivElement>();

  const a = terms(p, q, a0, a1);
  const cf = closedForm(p, q, a0, a1);
  const hi = Math.max(1, ...a), lo = Math.min(0, ...a);
  const ratio = Math.abs(a[N - 1]) > 1e-9 ? a[N] / a[N - 1] : NaN;
  const err = cf ? Math.max(...a.map((v, n) => Math.abs(v - cf.dom(n)))) : 0;
  const errLast = cf ? Math.abs(a[N] - cf.dom(N)) : 0;
  const load = (id: Pid) => { const s = PRESETS[id]; setP(s.p); setQ(s.q); setA0(s.a0); setA1(s.a1); setPreset(id); setK(N); setPlaying(false); };
  const edit = (f: (v: number) => void) => (v: number) => { f(v); setPreset(null); };

  useFrame(playing && (vis.on || lab.open), dt => {
    const s = acc + dt;
    if (s < 0.45) { setAcc(s); return; }
    setAcc(0);
    if (k >= N) setPlaying(false); else setK(v => v + 1);
  });

  // ── drawing
  // the bars fill [lo, hi] between TOP and BOT, with room above and below for the value labels
  const gw = (W - L - 12) / (N + 1), bw = gw * 0.62;
  const X = (n: number) => L + n * gw + gw / 2, Y = (v: number) => TOP + ((hi - v) / (hi - lo)) * (BOT - TOP), mid = Y(0);
  const view = (
    <div ref={vis.ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1={L - 4} x2={W - 8} y1={mid} y2={mid} stroke={C.axis} strokeWidth={1} />
        <T x={6} y={Y(hi) + 4} size={9} color={C.axis}>{num(hi, 1)}</T>
        {lo < 0 && <T x={6} y={Y(lo) + 4} size={9} color={C.axis}>{num(lo, 1)}</T>}
        <T x={6} y={mid + 4} size={9} color={C.axis}>0</T>
        {a.map((v, n) => {
          const on = n <= k, hot = n === k && k >= 2 && playing;
          const y0 = Math.min(Y(v), mid), h = Math.abs(Y(v) - mid);
          return (
            <g key={n} opacity={on ? 1 : 0.12}>
              <rect x={X(n) - bw / 2} y={y0} width={bw} height={Math.max(h, 0.5)} rx={2} fill={hot ? C.amber : n < 2 ? C.purple : C.sky} opacity={0.85} />
              <T x={X(n)} y={H - 6} anchor="middle" size={9} color={C.axis}>{n}</T>
              {on && <T x={X(n)} y={v >= 0 ? y0 - 8 : y0 + h + 15} anchor="middle" size={Math.abs(v) >= 1000 ? 7.5 : 9} color={C.fg}>{num(v, 2)}</T>}
            </g>
          );
        })}
        {/* the step that made the newest bar */}
        {k >= 2 && k <= N && (
          <T x={L} y={14} size={10.5} color={C.amber} bold>{`a${sub(k)} = ${combo([[p, par(a[k - 1], 2)], [q, par(a[k - 2], 2)]])} = ${num(a[k], 2)}`}</T>
        )}
        {cf && a.map((_, n) => n <= k && (
          <circle key={`c${n}`} cx={X(n)} cy={Y(dom ? cf.dom(n) : cf.at(n))} r={4} fill="none" stroke={dom ? C.red : C.green} strokeWidth={2} />
        ))}
      </svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (k >= N) setK(1); setAcc(0); setPlaying(v => !v); }}
        playLabel={tx(t, "figRec_play", "build the terms")}
        onStep={() => { setPlaying(false); setK(v => Math.min(N, v + 1)); }}
        onBack={() => { setPlaying(false); setK(v => Math.max(1, v - 1)); }}
        onReset={() => { setPlaying(false); setK(1); }}
        readout={`n = ${k}`} />
    </div>
  );

  const controls = <>
    <Row>
      {(Object.keys(PRESETS) as Pid[]).map(id => <Btn key={id} active={preset === id} onClick={() => load(id)}>{PRESETS[id].name}</Btn>)}
    </Row>
    <Sliders>
      <Slider label="p" value={p} min={-2} max={3} step={0.5} onChange={edit(setP)} fmt={v => num(v)} />
      <Slider label="q" value={q} min={-2} max={2} step={0.5} onChange={edit(setQ)} fmt={v => num(v)} />
      <Slider label="a₀" value={a0} min={-3} max={3} step={1} onChange={edit(setA0)} fmt={v => num(v)} />
      <Slider label="a₁" value={a1} min={-3} max={3} step={1} onChange={edit(setA1)} fmt={v => num(v)} />
    </Sliders>
    <Row>
      <Btn active={dom} onClick={() => setDom(v => !v)}>{tx(t, "figRec_break", "break it: only the bigger root")}</Btn>
    </Row>
    <Row>
      <Readout>{`aₙ = ${combo([[p, "aₙ₋₁"], [q, "aₙ₋₂"]])}`}</Readout>
      <Readout color={C.purple}>{`x² = ${combo([[p, "x"], [q, ""]])}:  ${cf ? cf.roots : "—"}`}</Readout>
    </Row>
    <Row>
      <Readout color={dom ? C.red : C.green}>{cf ? cf.text : tx(t, "figRec_first", "q = 0: a first-order recurrence, aₙ = p·aₙ₋₁")}</Readout>
    </Row>
    <Row>
      {Number.isFinite(ratio) && <Readout>{fill(tx(t, "figRec_ratio", "a₁₂ / a₁₁ = {r}"), { r: num(ratio, 5) })}</Readout>}
      {dom && cf && cf.kind === "real" && <Readout color={C.red}>{fill(tx(t, "figRec_err", "largest error: {e};  at n = 12: {l}"), { e: num(err, 4), l: num(errLast, 4) })}</Readout>}
    </Row>
  </>;
  const note = tx(t, "figRec_note", "Purple bars are the two starting values a₀ and a₁; every later bar is p times the bar before it plus q times the one before that. Press play to build them one at a time. The green rings are the closed form from the characteristic equation: they sit exactly on top of the bars, with no recursion at all. Change p and q to see the three cases: two real roots, a double root, complex roots (the terms then oscillate).");

  // ── Lab ──
  const near = (x: number, y: number) => Math.abs(x - y) < 1e-9;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figRecL1_t", "Each term from the two before"),
      body: <p>{tx(t, "figRecL1_b", "This is Fibonacci: p = q = 1, so each term is the sum of the previous two. Press play and watch the amber line do one addition per bar.")}</p>,
      goal: { text: tx(t, "figRecL1_g", "All terms up to a₁₂ = 144 built."), done: preset === "fib" && k === N },
      setup: () => { load("fib"); setK(1); setDom(false); },
    },
    {
      title: tx(t, "figRecL2_t", "Quick check"),
      body: <p>{tx(t, "figRecL2_b", "The last two bars are 89 and 144.")}</p>,
      quiz: {
        q: tx(t, "figRecL2_q", "What is a₁₃?"),
        options: ["233", "288", "199", "377"],
        answer: 0,
        why: tx(t, "figRecL2_w", "89 + 144 = 233."),
      },
    },
    {
      title: tx(t, "figRecL3_t", "The ratio settles"),
      body: <p>{tx(t, "figRecL3_b", "The ratio of consecutive Fibonacci numbers approaches the golden ratio φ = (1 + √5)/2 ≈ 1.618, the bigger root of x² = x + 1. Load Pell (p = 2, q = 1): its ratio approaches its own bigger root, 1 + √2.")}</p>,
      goal: { text: tx(t, "figRecL3_g", "Pell loaded: the ratio is close to 2.41421."), done: preset === "pell" },
    },
    {
      title: tx(t, "figRecL4_t", "Break it"),
      body: <p>{tx(t, "figRecL4_b", "Back to Fibonacci. Keep only the bigger root: the rings show φⁿ/√5 alone. The other root, ψ ≈ −0.618, has size less than 1, so its term dies away.")}</p>,
      goal: { text: tx(t, "figRecL4_g", "Fibonacci with only φⁿ/√5: every error below 1/2."), done: preset === "fib" && dom && err < 0.5 },
      setup: () => { load("fib"); setDom(false); },
    },
    {
      title: tx(t, "figRecL5_t", "New starting values"),
      body: <p>{tx(t, "figRecL5_b", "Same rule, other start. Turn \"only the bigger root\" off and set a₀ = 2, a₁ = 1: the Lucas numbers 2, 1, 3, 4, 7, 11, … The roots stay the same; only A and B change.")}</p>,
      goal: { text: tx(t, "figRecL5_g", "Lucas numbers: A = B = 1, so aₙ = φⁿ + ψⁿ."), done: near(p, 1) && near(q, 1) && a0 === 2 && a1 === 1 && !dom },
      hint: tx(t, "figRecL5_h", "Use the a₀ and a₁ sliders, or the Lucas button."),
    },
    {
      title: tx(t, "figRecL6_t", "A double root"),
      body: <p>{tx(t, "figRecL6_b", "Load \"n\": aₙ = 2aₙ₋₁ − aₙ₋₂ with a₀ = 0, a₁ = 1. Here x² = 2x − 1 has the root 1 twice.")}</p>,
      quiz: {
        q: tx(t, "figRecL6_q", "What closed form do the bars follow?"),
        options: ["aₙ = n", "aₙ = 2ⁿ", "aₙ = 1", "aₙ = n²"],
        answer: 0,
        why: tx(t, "figRecL6_w", "With a double root r the form is (A + Bn)rⁿ; here r = 1, A = 0, B = 1. Each term is the last one plus the same step: 2aₙ₋₁ − aₙ₋₂ = aₙ₋₁ + (aₙ₋₁ − aₙ₋₂)."),
      },
      setup: () => load("line"),
    },
    {
      title: tx(t, "figRecL7_t", "Complex roots"),
      body: <p>{tx(t, "figRecL7_b", "Set p = 1 and q = −1. Then x² = x − 1 has no real roots: x = 1/2 ± (√3/2)i, which are cos 60° ± i sin 60°. The terms repeat every 6 steps, a full turn of 6 × 60°.")}</p>,
      goal: { text: tx(t, "figRecL7_g", "Terms that repeat with period 6."), done: near(p, 1) && near(q, -1) },
      hint: tx(t, "figRecL7_h", "The ↺ 6 button sets it."),
    },
  ];

  const insights: Insight[] = [
    {
      id: "round", tone: "ok", when: dom && cf?.kind === "real" && err < 0.5,
      title: tx(t, "figRecI1_t", "Rounding is enough"),
      body: tx(t, "figRecI1_b", "The smaller root has size below 1, so its term is always less than 1/2 here: rounding the big term alone gives the exact integer."),
    },
    {
      id: "noround", tone: "warn", when: dom && cf?.kind === "real" && err >= 0.5,
      title: tx(t, "figRecI2_t", "The second root still matters"),
      body: tx(t, "figRecI2_b", "Here the smaller root has size 1 or more (or a large coefficient), so its term never fades: dropping it leaves an error that does not go away."),
    },
    {
      id: "complex", tone: "info", when: cf?.kind === "complex",
      title: tx(t, "figRecI3_t", "Complex roots, real terms"),
      body: tx(t, "figRecI3_b", "The roots are a conjugate pair ρ(cos θ ± i sin θ). Their powers combine into ρⁿ times a cosine wave: the terms spin round like a point on a circle of radius ρⁿ."),
    },
  ];

  const title = tx(t, "figRec_title", "Terms, roots and the closed form");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<LabButton lab={lab} t={t} />} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view} controls={controls}
        recap={[
          tx(t, "figRecR1", "aₙ = p aₙ₋₁ + q aₙ₋₂ plus two starting values fixes every term."),
          tx(t, "figRecR2", "Trying aₙ = xⁿ gives the characteristic equation x² = px + q."),
          tx(t, "figRecR3", "Two roots: aₙ = A r₁ⁿ + B r₂ⁿ, with A and B from a₀ and a₁; a double root gives (A + Bn) rⁿ."),
          tx(t, "figRecR4", "The bigger root wins: aₙ₊₁/aₙ → r₁, and Fₙ = round(φⁿ/√5)."),
        ]}
      />
    </>
  );
}
