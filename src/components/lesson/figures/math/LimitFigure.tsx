"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, plot, Grid, fnPath, clamp } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// approach — two points close in on x = a from the left and the right (the
//            slider shrinks the gap h by powers of ten). Where the function
//            has a limit, both values settle on the same height L, even when
//            f(a) itself is undefined (the hollow dot). The step, 1/x² and
//            sin(1/x) show the three ways a limit can fail.
// epsilon  — the formal game: pick a tolerance ε round L (green band); the
//            figure finds the widest δ round a (blue band) that keeps the
//            whole curve inside the green band.
// bisect   — the intermediate value theorem at work: a continuous function
//            that is negative at one end and positive at the other must cross
//            zero in between; halving the interval traps the crossing.

type Mode = "approach" | "epsilon" | "bisect";
type Fn = {
  key: string; label: string; f: (x: number) => number; a: number; L: number | null;
  view: [number, number, number, number]; n?: number;
};

const W = 560, H = 280;
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

/** Widest δ (to the plot's resolution) with |f(x) − L| < ε for every 0 < |x − a| < δ. */
function deltaFor(fn: Fn, eps: number, maxD: number) {
  const N = 4000;
  for (let i = 1; i <= N; i++) {
    const s = (maxD * i) / N;
    if (Math.abs(fn.f(fn.a - s) - fn.L!) >= eps || Math.abs(fn.f(fn.a + s) - fn.L!) >= eps) return (maxD * (i - 1)) / N;
  }
  return maxD;
}

export function LimitFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("approach");
  const [key, setKey] = useState("hole");
  const [k, setK] = useState(0.3);
  const [eps, setEps] = useState(0.4);
  const [iv, setIv] = useState<[number, number][]>([[1, 2]]);

  const chosen = FNS.find(e => e.key === key)!;
  const fn = mode === "epsilon" && chosen.L === null ? FNS[0] : chosen;
  const [x0, x1, y0, y1] = mode === "bisect" ? [0.6, 2.2, -1.8, 5.6] : fn.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const step = x1 - x0 > 10 ? 2 : 1;
  const curve = fn.key === "jump"
    ? fnPath(pr, fn.f, x0, 1 - 1e-9) + fnPath(pr, fn.f, 1, x1)
    : fnPath(pr, fn.f, x0, x1, fn.n ?? 400);
  const dot = (x: number, y: number, col: string, hollow = false, key?: string) =>
    <circle key={key} cx={pr.X(x)} cy={pr.Y(clamp(y, y0, y1))} r={4.5} fill={hollow ? C.bg : col} stroke={col} strokeWidth={1.8} />;
  const fnButtons = <Row>{FNS.filter(e => mode !== "epsilon" || e.L !== null).map(e =>
    <Btn key={e.key} active={fn.key === e.key} onClick={() => setKey(e.key)}>{e.key === "jump" ? tx(t, "figLim_step", "step") : e.label}</Btn>)}</Row>;
  const marks = <>
    {fn.key === "hole" || fn.key === "sinc" ? dot(fn.a, fn.L!, C.sky, true) : null}
    {fn.key === "jump" && <>{dot(1, 1, C.sky, true)}{dot(1, 2, C.sky)}</>}
  </>;

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "approach") {
    const h = 10 ** -k;
    const lv = fn.f(fn.a - h), rv = fn.f(fn.a + h);
    const verdict = fn.L !== null
      ? `${tx(t, "figLim_both", "both sides approach")} L = ${fmt(fn.L)}`
      : fn.key === "jump" ? tx(t, "figLim_vJump", "left → 1, right → 2: no limit")
      : fn.key === "blow" ? tx(t, "figLim_vBlow", "grows without bound: the limit is ∞, not a number")
      : tx(t, "figLim_vWiggle", "keeps swinging between −1 and 1: no limit");
    svg = <>
      <Grid p={pr} step={step} />
      <line x1={pr.X(fn.a)} x2={pr.X(fn.a)} y1={0} y2={H} stroke={C.purple} strokeWidth={1} strokeDasharray="4 4" />
      <path d={curve} fill="none" stroke={C.sky} strokeWidth={2.2} />
      {marks}
      {[[fn.a - h, lv, C.amber], [fn.a + h, rv, C.green]].map(([x, y, col], i) => Number.isFinite(y as number) && <g key={i}>
        <line x1={pr.X(x as number)} x2={pr.X(x as number)} y1={pr.Y(0)} y2={pr.Y(clamp(y as number, y0, y1))} stroke={col as string} strokeDasharray="3 3" />
        {dot(x as number, y as number, col as string)}
      </g>)}
      <T x={pr.X(fn.a) + 5} y={14} color={C.purple} bold>{`a = ${fn.a}`}</T>
    </>;
    controls = <>
      {fnButtons}
      <Slider label={tx(t, "figLim_gap", "gap h")} value={k} min={0} max={4} step={0.1} onChange={setK} fmt={() => fmtH(h)} width="w-16" />
      <Row>
        <Readout color={C.amber}>{`f(a − h) = ${fmt(lv)}`}</Readout>
        <Readout color={C.green}>{`f(a + h) = ${fmt(rv)}`}</Readout>
        <Readout color={C.muted}>{`f(a) = ${fmt(fn.f(fn.a))}`}</Readout>
      </Row>
      <Row><Readout color={fn.L !== null ? C.green : C.red}>{verdict}</Readout></Row>
    </>;
    note = tx(t, "figLim_noteA", "Slide the gap h toward zero: the amber point comes from the left, the green one from the right. For the first two functions f(a) itself is undefined (0/0, the hollow dot), yet both values settle on the same height, which is the limit. The step reaches different heights from each side; 1/x² runs off the top; sin(1/x) swings faster and faster and never settles. In those three cases there is no limit.");
  } else if (mode === "epsilon") {
    const maxD = (x1 - x0) / 2;
    const d = deltaFor(fn, eps, maxD);
    const L = fn.L!;
    svg = <>
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
    const [lo, hi] = iv[iv.length - 1];
    const halve = () => {
      const m = (lo + hi) / 2;
      setIv(s => [...s, g(lo) * g(m) <= 0 ? [lo, m] : [m, hi]]);
    };
    svg = <>
      <rect x={pr.X(lo)} width={Math.max(pr.X(hi) - pr.X(lo), 1)} y={0} height={H} fill={C.amber} fillOpacity={0.12} />
      <Grid p={pr} step={1} />
      <path d={fnPath(pr, g)} fill="none" stroke={C.sky} strokeWidth={2.2} />
      {iv.slice(-12).map(([a, b], i) => <line key={i} x1={pr.X(a)} x2={pr.X(b)} y1={H - 8 - i * 6} y2={H - 8 - i * 6} stroke={C.amber} strokeWidth={2.5} opacity={0.35 + 0.05 * i} />)}
      {dot(lo, g(lo), C.red)}
      {dot(hi, g(hi), C.green)}
    </>;
    controls = <Row>
      <Btn active onClick={halve}>{tx(t, "figLim_halve", "halve the interval")}</Btn>
      <Btn onClick={() => setIv([[1, 2]])}>{tx(t, "figLim_reset", "reset")}</Btn>
      <Readout>{`[${lo.toFixed(6)}, ${hi.toFixed(6)}]`}</Readout>
      <Readout color={C.amber}>{`${tx(t, "figLim_width", "width")} ${(hi - lo).toPrecision(3)}`}</Readout>
      <Readout color={C.red}>{`f(lo) = ${fmt(g(lo))}`}</Readout>
      <Readout color={C.green}>{`f(hi) = ${fmt(g(hi))}`}</Readout>
    </Row>;
    note = tx(t, "figLim_noteB", "f(x) = x³ − x − 1 is negative at x = 1 (red) and positive at x = 2 (green). Its graph is unbroken, so it must cross zero somewhere between. Each press tests the midpoint and keeps the half whose ends still have opposite signs. The bars at the bottom are the intervals so far; every press halves the width, so 20 presses pin the root (1.324718…) to within a millionth.");
  }

  return (
    <Figure
      title={tx(t, "figLim_title", "Approaching a point")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["approach", tx(t, "figLim_mA", "approach")],
        ["epsilon", tx(t, "figLim_mE", "ε and δ")],
        ["bisect", tx(t, "figLim_mB", "bisection")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
