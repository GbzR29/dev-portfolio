"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, plot, Grid, fnPath, clamp, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// approach — two points close in on x = a from the left and the right. The
//            Transport shrinks the gap h by powers of ten (play glides, ⏭
//            divides by 10). Where the function has a limit, both values
//            settle on the same height L, even when f(a) itself is undefined
//            (the hollow dot). The step, 1/x² and sin(1/x) show the three
//            ways a limit can fail.
// epsilon  — the formal game: pick a tolerance ε round L (green band); the
//            figure finds the widest δ round a (blue band) that keeps the
//            whole curve inside the green band.
// bisect   — the intermediate value theorem at work: a continuous function
//            that is negative at one end and positive at the other must cross
//            zero in between; each ⏭ halves the interval that traps it.
// The lab: shrink h on the hole, meet the three failures, play the ε game,
// then pin the root by bisection.

type Mode = "approach" | "epsilon" | "bisect";
type Fn = {
  key: string; label: string; f: (x: number) => number; a: number; L: number | null;
  view: [number, number, number, number]; n?: number;
};

const W = 560, H = 280;
const K_MAX = 4;                                       // the smallest gap is 10⁻⁴
const START: [number, number] = [1, 2];
const FNS: Fn[] = [
  { key: "hole", label: "(x² − 1)/(x − 1)", f: x => (x * x - 1) / (x - 1), a: 1, L: 2, view: [-1, 3.5, -1, 4.5] },
  { key: "sinc", label: "sin x / x", f: x => Math.sin(x) / x, a: 0, L: 1, view: [-9, 9, -0.6, 1.4] },
  { key: "jump", label: "step", f: x => (x < 1 ? x : x + 1), a: 1, L: null, view: [-1, 3.5, -1, 4.5] },
  { key: "blow", label: "1/x²", f: x => 1 / (x * x), a: 0, L: null, view: [-3, 3, -1, 9] },
  { key: "wiggle", label: "sin(1/x)", f: x => Math.sin(1 / x), a: 0, L: null, view: [-1, 1, -1.6, 1.6], n: 4000 },
];
const g = (x: number) => x * x * x - x - 1;           // bisection target, root ≈ 1.3247
const fmt = (v: number) =>
  (!Number.isFinite(v) ? "—" : Math.abs(v) >= 1e4 ? v.toExponential(2) : v.toFixed(4)).replace("-", "−");
const fmtH = (h: number) => (h >= 0.01 ? h.toFixed(2) : h.toExponential(0)).replace("-", "−");
/** The half of [lo, hi] whose ends still have opposite signs. */
const halved = ([lo, hi]: [number, number]): [number, number] => {
  const m = (lo + hi) / 2;
  return g(lo) * g(m) <= 0 ? [lo, m] : [m, hi];
};

/** Widest δ (to the plot's resolution) with |f(x) − L| < ε for every 0 < |x − a| < δ. */
function deltaFor(fn: Fn, eps: number, maxD: number) {
  const N = 4000;
  for (let i = 1; i <= N; i++) {
    const s = (maxD * i) / N;
    if (Math.abs(fn.f(fn.a - s) - fn.L!) >= eps || Math.abs(fn.f(fn.a + s) - fn.L!) >= eps) return (maxD * (i - 1)) / N;
  }
  return maxD;
}

// ── The drawing ───────────────────────────────────────────────────────────────

function LimitDrawing({ mode, fn, h, eps, iv }: { mode: Mode; fn: Fn; h: number; eps: number; iv: [number, number][] }) {
  const [x0, x1, y0, y1] = mode === "bisect" ? [0.6, 2.2, -1.8, 5.6] : fn.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const step = x1 - x0 > 10 ? 2 : 1;
  const curve = fn.key === "jump"
    ? fnPath(pr, fn.f, x0, 1 - 1e-9) + fnPath(pr, fn.f, 1, x1)
    : fnPath(pr, fn.f, x0, x1, fn.n ?? 400);
  const dot = (x: number, y: number, col: string, hollow = false) =>
    <circle cx={pr.X(x)} cy={pr.Y(clamp(y, y0, y1))} r={4.5} fill={hollow ? C.bg : col} stroke={col} strokeWidth={1.8} />;
  const marks = <>
    {fn.key === "hole" || fn.key === "sinc" ? dot(fn.a, fn.L!, C.sky, true) : null}
    {fn.key === "jump" && <>{dot(1, 1, C.sky, true)}{dot(1, 2, C.sky)}</>}
  </>;

  if (mode === "approach") {
    const lv = fn.f(fn.a - h), rv = fn.f(fn.a + h);
    return <>
      <Grid p={pr} step={step} />
      <line x1={pr.X(fn.a)} x2={pr.X(fn.a)} y1={0} y2={H} stroke={C.purple} strokeWidth={1} strokeDasharray="4 4" />
      <path d={curve} fill="none" stroke={C.sky} strokeWidth={2.2} />
      {marks}
      {([[fn.a - h, lv, C.amber], [fn.a + h, rv, C.green]] as const).map(([x, y, col], i) => Number.isFinite(y) && <g key={i}>
        <line x1={pr.X(x)} x2={pr.X(x)} y1={pr.Y(0)} y2={pr.Y(clamp(y, y0, y1))} stroke={col} strokeDasharray="3 3" />
        {dot(x, y, col)}
      </g>)}
      <T x={pr.X(fn.a) + 5} y={14} color={C.purple} bold>{`a = ${fn.a}`}</T>
    </>;
  }
  if (mode === "epsilon") {
    const d = deltaFor(fn, eps, (x1 - x0) / 2);
    const L = fn.L!;
    return <>
      <rect x={0} width={W} y={pr.Y(L + eps)} height={pr.Y(L - eps) - pr.Y(L + eps)} fill={C.green} fillOpacity={0.12} />
      <rect y={0} height={H} x={pr.X(fn.a - d)} width={pr.X(fn.a + d) - pr.X(fn.a - d)} fill={C.sky} fillOpacity={0.12} />
      <Grid p={pr} step={step} />
      {[L + eps, L - eps].map((y, i) => <line key={i} x1={0} x2={W} y1={pr.Y(y)} y2={pr.Y(y)} stroke={C.green} strokeDasharray="5 4" />)}
      {[fn.a - d, fn.a + d].map((x, i) => <line key={i} y1={0} y2={H} x1={pr.X(x)} x2={pr.X(x)} stroke={C.sky} strokeDasharray="5 4" />)}
      <path d={curve} fill="none" stroke={C.muted} strokeWidth={1.6} />
      <path d={fnPath(pr, fn.f, fn.a - d, fn.a + d)} fill="none" stroke={C.amber} strokeWidth={3} />
      {marks}
      <T x={6} y={pr.Y(L + eps) - 4} color={C.green} bold>{"L + ε"}</T>
      <T x={6} y={pr.Y(L - eps) + 12} color={C.green} bold>{"L − ε"}</T>
      <T x={pr.X(fn.a + d) + 4} y={14} color={C.sky} bold>{"a + δ"}</T>
      <T x={pr.X(fn.a - d) - 4} y={14} color={C.sky} bold anchor="end">{"a − δ"}</T>
    </>;
  }
  const [lo, hi] = iv[iv.length - 1];
  return <>
    <rect x={pr.X(lo)} width={Math.max(pr.X(hi) - pr.X(lo), 1)} y={0} height={H} fill={C.amber} fillOpacity={0.12} />
    <Grid p={pr} step={1} />
    <path d={fnPath(pr, g)} fill="none" stroke={C.sky} strokeWidth={2.2} />
    {iv.slice(-12).map(([a, b], i) => <line key={i} x1={pr.X(a)} x2={pr.X(b)} y1={H - 8 - i * 6} y2={H - 8 - i * 6} stroke={C.amber} strokeWidth={2.5} opacity={0.35 + 0.05 * i} />)}
    {dot(lo, g(lo), C.red)}
    {dot(hi, g(hi), C.green)}
  </>;
}

export function LimitFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("approach");
  const [key, setKey] = useState("hole");
  const [k, setK] = useState(0);                   // the gap is h = 10⁻ᵏ
  const [eps, setEps] = useState(0.4);
  const [iv, setIv] = useState<[number, number][]>([START]);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);                           // time since the last automatic halving
  const lab = useLab("math-limit");
  const vis = useVisible<HTMLDivElement>();

  const [lo, hi] = iv[iv.length - 1];
  const width = hi - lo;
  useFrame(playing && (vis.on || lab.open), dt => {
    if (mode === "approach") {
      if (k >= K_MAX) setPlaying(false);
      else setK(Math.min(K_MAX, k + dt * 0.7));
    } else if (mode === "bisect") {
      if (width < 1e-6) { setPlaying(false); return; }
      acc.current += dt;
      if (acc.current > 0.6) { acc.current = 0; setIv(s => [...s, halved(s[s.length - 1])]); }
    }
  });

  const chosen = FNS.find(e => e.key === key)!;
  const fn = mode === "epsilon" && chosen.L === null ? FNS[0] : chosen;
  const h = 10 ** -k;
  const stop = () => setPlaying(false);
  const pick = (m: Mode) => { setMode(m); stop(); };
  const choose = (kk: string) => { setKey(kk); setK(0); stop(); };
  const gapTo = (v: number) => { stop(); setK(clamp(v, 0, K_MAX)); };
  const halve = () => { stop(); setIv(s => [...s, halved(s[s.length - 1])]); };

  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto"><LimitDrawing mode={mode} fn={fn} h={h} eps={eps} iv={iv} /></svg>
      {mode === "approach" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (k >= K_MAX) setK(0); setPlaying(p => !p); }}
          playLabel={tx(t, "figLim_shrink", "shrink the gap")}
          onStep={() => gapTo(Math.floor(k + 1e-6) + 1)}
          onBack={() => gapTo(Math.ceil(k - 1e-6) - 1)}
          onReset={() => gapTo(0)}
          readout={`h = ${fmtH(h)}`} />
      )}
      {mode === "bisect" && (
        <Transport t={t} playing={playing}
          onPlay={() => { acc.current = 0; setPlaying(p => !p); }}
          playLabel={tx(t, "figLim_halve", "halve the interval")}
          onStep={halve}
          onBack={() => { stop(); setIv(s => (s.length > 1 ? s.slice(0, -1) : s)); }}
          onReset={() => { stop(); setIv([START]); }}
          readout={`${tx(t, "figLim_halvings", "halvings")}: ${iv.length - 1} · ${tx(t, "figLim_width", "width")} ${width.toPrecision(3)}`} />
      )}
    </div>
  );

  const fnButtons = <Row>{FNS.filter(e => mode !== "epsilon" || e.L !== null).map(e =>
    <Btn key={e.key} active={fn.key === e.key} onClick={() => choose(e.key)}>{e.key === "jump" ? tx(t, "figLim_step", "step") : e.label}</Btn>)}</Row>;

  let controls: React.ReactNode, note: string;
  if (mode === "approach") {
    const lv = fn.f(fn.a - h), rv = fn.f(fn.a + h);
    const verdict = fn.L !== null
      ? `${tx(t, "figLim_both", "both sides approach")} L = ${fmt(fn.L)}`
      : fn.key === "jump" ? tx(t, "figLim_vJump", "left → 1, right → 2: no limit")
      : fn.key === "blow" ? tx(t, "figLim_vBlow", "grows without bound: the limit is ∞, not a number")
      : tx(t, "figLim_vWiggle", "keeps swinging between −1 and 1: no limit");
    controls = <>
      {fnButtons}
      <Row>
        <Readout color={C.amber}>{`f(a − h) = ${fmt(lv)}`}</Readout>
        <Readout color={C.green}>{`f(a + h) = ${fmt(rv)}`}</Readout>
        <Readout color={C.muted}>{`f(a) = ${fmt(fn.f(fn.a))}`}</Readout>
      </Row>
      <Row><Readout color={fn.L !== null ? C.green : C.red}>{verdict}</Readout></Row>
    </>;
    note = tx(t, "figLim_noteA2", "Press play, or ⏭, to shrink the gap h toward zero: the amber point comes from the left, the green one from the right. For the first two functions f(a) itself is undefined (0/0, the hollow dot), yet both values settle on the same height, which is the limit. The step reaches different heights from each side; 1/x² runs off the top; sin(1/x) swings faster and faster and never settles. In those three cases there is no limit.");
  } else if (mode === "epsilon") {
    const [x0, x1] = fn.view;
    const d = deltaFor(fn, eps, (x1 - x0) / 2);
    controls = <>
      {fnButtons}
      <Slider label={tx(t, "figLim_tol", "tolerance ε")} value={eps} min={0.02} max={1} step={0.01} onChange={setEps} width="w-20" />
      <Row>
        <Readout color={C.green}>{`ε = ${eps.toFixed(2)}`}</Readout>
        <Readout color={C.sky}>{`δ = ${d.toFixed(3)}`}</Readout>
        <Readout color={C.amber}>{tx(t, "figLim_okE", "every x within δ of a lands within ε of L")}</Readout>
      </Row>
    </>;
    note = tx(t, "figLim_noteE", "This is what \"f(x) approaches L\" means precisely. You choose how close to L you insist on being, the tolerance ε (the green band). The figure answers with a distance δ round a (the blue band) such that every x inside it, except a itself, has its curve point inside the green band (the amber piece). Make ε as small as you like: a working δ always exists; it just gets smaller. For the step function no δ could work once ε is below 0.5, which is why it has no limit.");
  } else {
    controls = <Row>
      <Readout>{`[${lo.toFixed(6)}, ${hi.toFixed(6)}]`}</Readout>
      <Readout color={C.red}>{`f(lo) = ${fmt(g(lo))}`}</Readout>
      <Readout color={C.green}>{`f(hi) = ${fmt(g(hi))}`}</Readout>
    </Row>;
    note = tx(t, "figLim_noteB2", "f(x) = x³ − x − 1 is negative at x = 1 (red) and positive at x = 2 (green). Its graph is unbroken, so it must cross zero somewhere between. Each ⏭ tests the midpoint and keeps the half whose ends still have opposite signs. The bars at the bottom are the intervals so far; every step halves the width, so 20 steps pin the root (1.324718…) to within a millionth.");
  }
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["approach", tx(t, "figLim_mA", "approach")],
    ["epsilon", tx(t, "figLim_mE", "ε and δ")],
    ["bisect", tx(t, "figLim_mB", "bisection")],
  ] as const} />;

  // ── Lab ──
  const appr = mode === "approach";
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figLimL1_t", "Close in on the hole"),
      body: <>
        <p>{tx(t, "figLimL1_b1", "f(x) = (x² − 1)/(x − 1) gives 0/0 at x = 1: there is no value there, only a hollow dot.")}</p>
        <p>{tx(t, "figLimL1_b2", "Shrink the gap h. The amber point comes from the left, the green one from the right.")}</p>
      </>,
      goal: { text: tx(t, "figLimL1_g", "h = 0.001 or smaller."), done: appr && key === "hole" && k >= 3 - 1e-6 },
      hint: tx(t, "figLimL1_h", "Each ⏭ divides h by 10. Three presses."),
      focus: "step",
      setup: () => { pick("approach"); choose("hole"); },
    },
    {
      title: tx(t, "figLimL2_t", "Quick check"),
      body: <p>{tx(t, "figLimL2_b", "Both readouts now sit next to 2, yet f(1) is shown as —.")}</p>,
      quiz: {
        q: tx(t, "figLimL2_q", "What is the limit of (x² − 1)/(x − 1) as x → 1?"),
        options: ["2", tx(t, "figLimL2_o2", "none: f(1) is undefined"), "0", "1"],
        answer: 0,
        why: tx(t, "figLimL2_w", "For x ≠ 1 the fraction cancels to x + 1, which heads for 2. The limit asks where the values go, not what happens at x = 1 itself."),
      },
    },
    {
      title: tx(t, "figLimL3_t", "Two different answers"),
      body: <>
        <p>{tx(t, "figLimL3_b1", "A limit can fail. The first way: the two sides head for different heights.")}</p>
        <p>{tx(t, "figLimL3_b2", "Pick the step and shrink h until the gap is tiny.")}</p>
      </>,
      goal: { text: tx(t, "figLimL3_g", "The step, with h = 0.01 or smaller."), done: appr && key === "jump" && k >= 2 - 1e-6 },
      setup: () => { pick("approach"); choose("hole"); },
    },
    {
      title: tx(t, "figLimL4_t", "Never settling"),
      body: <>
        <p>{tx(t, "figLimL4_b1", "The other two failures: 1/x² runs off to infinity, and sin(1/x) swings faster and faster.")}</p>
        <p>{tx(t, "figLimL4_b2", "Pick sin(1/x) and step h down. Watch the two readouts jump around instead of settling.")}</p>
      </>,
      goal: { text: tx(t, "figLimL4_g", "sin(1/x), with h = 0.001 or smaller."), done: appr && key === "wiggle" && k >= 3 - 1e-6 },
      focus: "step",
    },
    {
      title: tx(t, "figLimL5_t", "The ε game"),
      body: <>
        <p>{tx(t, "figLimL5_b1", "Now the precise version. You demand f(x) within ε of L (green band); the figure answers with a δ round a (blue band) that guarantees it.")}</p>
        <p>{tx(t, "figLimL5_b2", "Be strict: make ε small, and check that a δ still exists.")}</p>
      </>,
      goal: { text: tx(t, "figLimL5_g", "ε = 0.1 or smaller."), done: mode === "epsilon" && eps <= 0.1 + 1e-9 },
      hint: tx(t, "figLimL5_h", "Drag the tolerance slider to the left. δ shrinks with it, but never reaches 0."),
      setup: () => { pick("epsilon"); setKey("hole"); setEps(0.6); },
    },
    {
      title: tx(t, "figLimL6_t", "Quick check"),
      body: <p>{tx(t, "figLimL6_b", "For the hole function, f(x) = x + 1 when x ≠ 1, so |f(x) − 2| = |x − 1|.")}</p>,
      quiz: {
        q: tx(t, "figLimL6_q", "The challenger asks for ε = 0.05. Which is the widest δ that works?"),
        options: ["0.05", "0.1", "0.025", tx(t, "figLimL6_o4", "no δ works")],
        answer: 0,
        why: tx(t, "figLimL6_w", "|f(x) − 2| is exactly |x − 1|, so keeping x within 0.05 of 1 keeps f(x) within 0.05 of 2. δ = ε works for every ε, which is why the limit is 2. 0.025 also works, but it is not the widest."),
      },
    },
    {
      title: tx(t, "figLimL7_t", "Trap the root"),
      body: <>
        <p>{tx(t, "figLimL7_b1", "f(x) = x³ − x − 1 is negative at 1 and positive at 2. It is continuous, so it crosses zero in between.")}</p>
        <p>{tx(t, "figLimL7_b2", "Halve the interval until it is narrower than 0.01.")}</p>
      </>,
      goal: { text: fill(tx(t, "figLimL7_g", "Width below 0.01 (now {w})."), { w: width.toPrecision(3) }), done: mode === "bisect" && width < 0.01 },
      hint: tx(t, "figLimL7_h", "1 → ½ → ¼ → … ; 2⁷ = 128, so seven halvings bring it to 1/128 ≈ 0.008."),
      focus: "step",
      setup: () => { pick("bisect"); setIv([START]); },
    },
    {
      title: tx(t, "figLimL8_t", "Quick check"),
      body: <p>{tx(t, "figLimL8_b", "Bisection starts with an interval of width 1.")}</p>,
      quiz: {
        q: tx(t, "figLimL8_q", "How many halvings make it narrower than 0.001?"),
        options: ["10", "1000", "3", "100"],
        answer: 0,
        why: tx(t, "figLimL8_w", "After n halvings the width is 1/2ⁿ. 2⁹ = 512 is not enough, 2¹⁰ = 1024 is: 1/1024 < 0.001. Each halving buys about 0.3 decimal digits."),
      },
    },
  ];

  const lv = fn.f(fn.a - h), rv = fn.f(fn.a + h);
  const insights: Insight[] = [
    {
      id: "settle", tone: "ok", when: appr && fn.L !== null && k >= 3 - 1e-6,
      title: tx(t, "figLimI1_t", "Settled"),
      body: fill(tx(t, "figLimI1_b", "Both sides are within {e} of L = {L}, and they keep closing in as h shrinks. That is all a limit asks; f(a) itself never entered."), {
        e: fmt(Math.max(Math.abs(lv - fn.L!), Math.abs(rv - fn.L!))), L: fmt(fn.L!) }),
    },
    {
      id: "jump", tone: "warn", when: appr && key === "jump",
      title: tx(t, "figLimI2_t", "The sides disagree"),
      body: tx(t, "figLimI2_b", "From the left the values head for 1, from the right for 2. Both one-sided limits exist, but they differ, so the two-sided limit does not, even though the step has a value at x = 1."),
    },
    {
      id: "blow", tone: "warn", when: appr && key === "blow" && k >= 1,
      title: tx(t, "figLimI3_t", "Running away"),
      body: fill(tx(t, "figLimI3_b", "At h = {h}, 1/h² is already {v}. The values pass every number you name: we write the limit as ∞, which means it does not exist as a number."), { h: fmtH(h), v: fmt(rv) }),
    },
    {
      id: "wiggle", tone: "warn", when: appr && key === "wiggle" && k >= 2,
      title: tx(t, "figLimI4_t", "No settling"),
      body: tx(t, "figLimI4_b", "Near 0, 1/x races through whole turns, so sin(1/x) runs from −1 to 1 and back infinitely often. However small h is, the readouts can be anywhere in [−1, 1]."),
    },
    {
      id: "small", tone: "info", when: appr && key === "sinc" && k >= 1,
      title: tx(t, "figLimI5_t", "Small angles"),
      body: tx(t, "figLimI5_b", "sin x / x is already very close to 1 for small x (in radians): that is why sin x ≈ x for small angles."),
    },
    {
      id: "strict", tone: "ok", when: mode === "epsilon" && eps <= 0.05 + 1e-9,
      title: tx(t, "figLimI6_t", "Still winnable"),
      body: tx(t, "figLimI6_b", "A stricter ε only forces a smaller δ. As long as a δ exists for every ε > 0, however tiny, the limit is L."),
    },
    {
      id: "million", tone: "ok", when: mode === "bisect" && width < 1e-6,
      title: tx(t, "figLimI7_t", "A millionth"),
      body: fill(tx(t, "figLimI7_b", "{n} halvings: the root lies in an interval narrower than a millionth, round 1.324718. Slow, but it cannot fail while the function is continuous."), { n: iv.length - 1 }),
    },
  ];

  const title = tx(t, "figLim_title", "Approaching a point");
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
          tx(t, "figLimR1", "The limit is where f(x) heads as x → a from both sides; f(a) itself plays no part."),
          tx(t, "figLimR2", "A limit fails when the sides disagree, the values blow up, or they never settle."),
          tx(t, "figLimR3", "Precisely: for every tolerance ε there is a distance δ that keeps f(x) within ε of L."),
          tx(t, "figLimR4", "A continuous function that changes sign has a root between; each halving traps it twice as tightly."),
        ]}
      />
    </>
  );
}
