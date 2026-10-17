"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T, plot, Grid, fnPath, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A rod (heat) or a string (wave) on 0 ≤ x ≤ 1 with both ends held at 0.
// The initial shape is split into its sine series Σ bₙ sin(nπx), and each
// mode evolves on its own: in the heat equation u_t = u_xx it decays like
// e^(−n²π²t) (fine detail dies first, so corners round off); in the wave
// equation u_tt = u_xx it oscillates like cos(nπt) (the shape returns at
// t = 2). The bars show each mode's amplitude right now. For heat, "solve on
// a grid" runs the explicit finite-difference scheme
//   uᵢ ← uᵢ + r (uᵢ₋₁ − 2uᵢ + uᵢ₊₁),  r = Δt/Δx²,
// next to the exact series (dashed). Break it: r > ½ and the grid solution
// explodes in a zigzag.

type Eq = "heat" | "wave";
type Shape = "block" | "pluck" | "mode1" | "two";
const W = 560, H = 230, HB = 92;
const NM = 60, SHOW = 12, GRID = 30;
const PI = Math.PI;
const pp = plot({ W, H, x0: -0.04, x1: 1.04, y0: -1.25, y1: 1.25 });
const n3 = (v: number) => v.toFixed(3);

const SHAPES: Record<Shape, (x: number) => number> = {
  block: x => (x > 0.35 && x < 0.65 ? 1 : 0),
  pluck: x => (x < 0.3 ? x / 0.3 : (1 - x) / 0.7),
  mode1: x => Math.sin(PI * x),
  two: x => 0.7 * Math.sin(PI * x) + 0.45 * Math.sin(4 * PI * x),
};
/** bₙ = 2 ∫₀¹ f(x) sin(nπx) dx, n = 1 … NM (index 0 unused). */
function sineCoefs(f: (x: number) => number) {
  const M = 3000, b = new Array(NM + 1).fill(0);
  for (let i = 0; i < M; i++) { const x = (i + 0.5) / M, y = (2 * f(x)) / M; for (let n = 1; n <= NM; n++) b[n] += y * Math.sin(n * PI * x); }
  return b.map(v => (Math.abs(v) < 1e-6 ? 0 : v));
}
const factor = (eq: Eq, n: number, t: number) => (eq === "heat" ? Math.exp(-n * n * PI * PI * t) : Math.cos(n * PI * t));
const series = (b: number[], eq: Eq, t: number) => (x: number) => { let s = 0; for (let n = 1; n <= NM; n++) s += b[n] * Math.sin(n * PI * x) * factor(eq, n, t); return s; };
/** f extended to an odd function of period 2: what the sine series converges to. */
const oddExt = (f: (x: number) => number) => (x: number) => { const y = ((((x + 1) % 2) + 2) % 2) - 1; return y >= 0 ? f(y) : -f(-y); };
/** The exact solution without truncation ringing: d'Alembert for waves, f itself at t = 0. */
function exactOf(f: (x: number) => number, b: number[], eq: Eq, t: number) {
  if (eq === "wave") { const F = oddExt(f); return (x: number) => 0.5 * (F(x - t) + F(x + t)); }
  return t === 0 ? f : series(b, eq, t);
}
const initGrid = (f: (x: number) => number) => Array.from({ length: GRID + 1 }, (_, i) => (i === 0 || i === GRID ? 0 : f(i / GRID)));
function stepGrid(u: number[], r: number) {
  const v = u.slice();
  for (let i = 1; i < GRID; i++) v[i] = u[i] + r * (u[i - 1] - 2 * u[i] + u[i + 1]);
  return v;
}

/** The rod as one smooth colour strip: red where hot (u > 0), blue where cold. */
function Rod({ u }: { u: (x: number) => number }) {
  const K = 40, y = pp.Y(-1.12), h = 10;
  return <>
    <defs>
      <linearGradient id="pde-rod" x1="0" x2="1" y1="0" y2="0">
        {Array.from({ length: K + 1 }, (_, i) => {
          const v = Math.max(-1, Math.min(1, u(i / K)));
          return <stop key={i} offset={i / K} stopColor={v >= 0 ? C.red : C.sky} stopOpacity={0.12 + 0.85 * Math.abs(v)} />;
        })}
      </linearGradient>
    </defs>
    <rect x={pp.X(0)} y={y - h / 2} width={pp.X(1) - pp.X(0)} height={h} rx={3} fill="url(#pde-rod)" />
  </>;
}

export function PdeFigure({ t }: { t?: TrackTranslations }) {
  const [eq, setEqRaw] = useState<Eq>("heat");
  const [shape, setShapeRaw] = useState<Shape>("block");
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [grid, setGridOn] = useState(false);
  const [r, setRRaw] = useState(0.4);
  const [u, setU] = useState<number[]>(() => initGrid(SHAPES.block));
  const [steps, setSteps] = useState(0);
  const lab = useLab("math-pde");
  const vis = useVisible<HTMLDivElement>();

  const f = SHAPES[shape];
  const b = useMemo(() => sineCoefs(SHAPES[shape]), [shape]);
  const dt = r / (GRID * GRID);
  const useGrid = grid && eq === "heat";
  const tNow = useGrid ? steps * dt : time;
  const exact = exactOf(f, b, eq, tNow);
  const gridMax = Math.max(...u.map(Math.abs));
  const blown = useGrid && gridMax > 2;

  const restart = () => { setPlaying(false); setTime(0); setSteps(0); setU(initGrid(f)); };
  const setEq = (e: Eq) => { setEqRaw(e); setPlaying(false); setTime(0); setSteps(0); setU(initGrid(f)); };
  const setShape = (s: Shape) => { setShapeRaw(s); setPlaying(false); setTime(0); setSteps(0); setU(initGrid(SHAPES[s])); };
  const setR = (v: number) => { setRRaw(v); setPlaying(false); setSteps(0); setU(initGrid(f)); };
  const oneStep = () => { setU(v => stepGrid(v, r)); setSteps(s => s + 1); };

  const T_END = eq === "heat" ? 0.25 : 4;
  useFrame(playing && (vis.on || lab.open), d => {
    if (useGrid) {
      // as many grid steps as keep pace with the clock, at most 4 per frame
      const target = Math.min(T_END, tNow + d * 0.03), k = Math.min(4, Math.max(1, Math.round((target - tNow) / dt)));
      let v = u;
      for (let i = 0; i < k; i++) v = stepGrid(v, r);
      setU(v); setSteps(s => s + k);
      if (target >= T_END || Math.max(...v.map(Math.abs)) > 50) setPlaying(false);
    } else {
      const next = Math.min(T_END, time + d * (eq === "heat" ? 0.03 : 0.5));
      setTime(next);
      if (next >= T_END) setPlaying(false);
    }
  });

  const amps = Array.from({ length: SHOW }, (_, i) => b[i + 1] * factor(eq, i + 1, tNow));
  const view = (
    <div ref={vis.ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <Grid p={pp} step={0.25} labels={false} />
        <path d={fnPath(pp, f, 0, 1, 600)} fill="none" stroke={C.muted} strokeWidth={1.1} strokeDasharray="2 4" />
        {useGrid ? <>
          <path d={fnPath(pp, exact, 0, 1, 400)} fill="none" stroke={C.green} strokeWidth={1.6} strokeDasharray="5 3" />
          <path d={u.map((v, i) => `${i ? "L" : "M"}${pp.X(i / GRID).toFixed(1)},${pp.Y(Math.max(-1.6, Math.min(1.6, v))).toFixed(1)}`).join("")} fill="none" stroke={blown ? C.red : C.amber} strokeWidth={1.8} />
          {u.map((v, i) => Math.abs(v) < 1.6 && <circle key={i} cx={pp.X(i / GRID)} cy={pp.Y(v)} r={2.6} fill={blown ? C.red : C.amber} />)}
        </> : <path d={fnPath(pp, exact, 0, 1, 600)} fill="none" stroke={eq === "heat" ? C.red : C.sky} strokeWidth={2.4} />}
        {eq === "heat" && <Rod u={useGrid ? (x => u[Math.round(x * GRID)]) : exact} />}
        <circle cx={pp.X(0)} cy={pp.Y(0)} r={4} fill={C.fg} />
        <circle cx={pp.X(1)} cy={pp.Y(0)} r={4} fill={C.fg} />
        <T x={8} y={16} size={10.5} color={C.fg} bold>{eq === "heat" ? "uₜ = uₓₓ" : "uₜₜ = uₓₓ"}</T>
        <T x={W - 8} y={16} size={10} anchor="end">{fill(tx(t, "figPde_time", "t = {t}"), { t: n3(tNow) })}</T>
      </svg>
      <svg viewBox={`0 0 ${W} ${HB}`} className="w-full h-auto" style={{ borderTop: "1px solid var(--border)" }}>
        <line x1={30} x2={W - 8} y1={HB / 2} y2={HB / 2} stroke={C.axis} />
        {amps.map((a, i) => {
          const dx = (W - 40) / SHOW, cx = 34 + dx * (i + 0.5), h = Math.max(-1, Math.min(1, a / 1.3)) * (HB / 2 - 12);
          return <g key={i}>
            <rect x={cx - 7} y={Math.min(HB / 2, HB / 2 - h)} width={14} height={Math.max(1, Math.abs(h))} fill={C.purple} opacity={0.85} />
            <T x={cx} y={HB - 2} size={8.5} anchor="middle">{i + 1}</T>
          </g>;
        })}
        <T x={6} y={14} size={9.5} color={C.purple} bold>{tx(t, "figPde_modes", "mode amplitudes")}</T>
      </svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (playing) { setPlaying(false); return; } if (tNow >= T_END - 1e-9 || blown) restart(); setPlaying(true); }}
        playLabel={tx(t, "figPde_play", "run time")}
        onStep={useGrid ? oneStep : undefined}
        onReset={restart}
        readout={useGrid ? fill(tx(t, "figPde_steps", "{n} steps"), { n: steps }) : undefined} />
    </div>
  );

  const name: Record<Shape, string> = {
    block: tx(t, "figPde_block", "block"),
    pluck: tx(t, "figPde_pluck", "pluck"),
    mode1: tx(t, "figPde_mode1", "one mode"),
    two: tx(t, "figPde_two", "two modes"),
  };
  const eqChoice = <Choice value={eq} onChange={setEq} options={[["heat", tx(t, "figPde_heat", "heat")], ["wave", tx(t, "figPde_wave", "wave")]] as const} />;
  const controls = <>
    <div className="flex items-center gap-1.5" style={{ flexWrap: "wrap" }}>{(Object.keys(SHAPES) as Shape[]).map(s => <Btn key={s} active={shape === s} onClick={() => setShape(s)}>{name[s]}</Btn>)}</div>
    {eq === "heat" && <Row>
      <Btn active={grid} onClick={() => { setGridOn(v => !v); restart(); }}>{tx(t, "figPde_grid", "solve on a grid")}</Btn>
      {grid && <Slider label="r = Δt/Δx²" value={r} min={0.1} max={0.7} step={0.01} onChange={setR} fmt={v => v.toFixed(2)} width="w-28" />}
    </Row>}
    <Row>
      {eq === "heat"
        ? <Readout color={C.purple}>{fill(tx(t, "figPde_rateH", "mode n shrinks by e^(−n²π²t): mode 1 to {a}, mode 3 to {b}"), { a: n3(Math.exp(-PI * PI * tNow)), b: n3(Math.exp(-9 * PI * PI * tNow)) })}</Readout>
        : <Readout color={C.purple}>{tx(t, "figPde_rateW", "mode n oscillates as cos(nπt): n times as fast as mode 1")}</Readout>}
      {useGrid && <Readout color={blown ? C.red : r > 0.5 ? C.amber : C.green}>{blown ? tx(t, "figPde_blown", "unstable: the zigzag grows every step") : r > 0.5 ? tx(t, "figPde_risky", "r > ½: watch the high frequencies") : tx(t, "figPde_stable", "r ≤ ½: stable")}</Readout>}
    </Row>
  </>;
  const note = eq === "heat"
    ? tx(t, "figPde_noteH", "The curve is the temperature along a rod whose two ends are kept at 0 (the colour strip shows it as hot and cold). The dotted line is where it started. Press play. Each sine mode cools at its own rate, e^(−n²π²t): mode 2 four times faster than mode 1, mode 3 nine times faster. So sharp corners, which need high modes, vanish almost at once, and after a while only a single sine hump is left, shrinking. Turn on the grid to solve the same equation with a computer's step-by-step rule.")
    : tx(t, "figPde_noteW", "Now the curve is a string tied at both ends. Press play. Each sine mode swings up and down as cos(nπt), mode n exactly n times as fast as mode 1: nothing decays, so the shape never settles. A pluck splits into two bumps running in opposite directions, flips over at the ends, and at t = 2 every mode has completed whole cycles, so the original shape comes back.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figPdeL1_t", "Heat smooths"),
      body: <p>{tx(t, "figPdeL1_b", "The block is a hot middle section with sharp edges. Let time run and watch the edges.")}</p>,
      goal: { text: tx(t, "figPdeL1_g", "Run the heat equation to t ≥ 0.02."), done: eq === "heat" && !useGrid && time >= 0.02 },
      focus: "play",
      setup: () => { setEq("heat"); setGridOn(false); setShape("block"); },
    },
    {
      title: tx(t, "figPdeL2_t", "Quick check"),
      body: <p>{tx(t, "figPdeL2_b", "Look at the bars: the right-hand ones vanished first.")}</p>,
      quiz: {
        q: tx(t, "figPdeL2_q", "How much faster does mode 3 decay than mode 1?"),
        options: ["9 ×", "3 ×", tx(t, "figPdeL2_o3", "the same speed"), "27 ×"],
        answer: 0,
        why: tx(t, "figPdeL2_w", "The rate is n²π²: 9π² against π². Fine detail (large n) is smoothed out fastest."),
      },
    },
    {
      title: tx(t, "figPdeL3_t", "A plucked string"),
      body: <p>{tx(t, "figPdeL3_b", "Switch to the wave equation and the pluck. Let it run past t = 2 and see the shape come back.")}</p>,
      goal: { text: tx(t, "figPdeL3_g", "Wave equation, pluck, t ≥ 2."), done: eq === "wave" && shape === "pluck" && time >= 2 },
      focus: "play",
      setup: () => { setEq("wave"); setShape("pluck"); },
    },
    {
      title: tx(t, "figPdeL4_t", "Quick check"),
      body: <p>{tx(t, "figPdeL4_b", "Mode n oscillates as cos(nπt), with period 2/n.")}</p>,
      quiz: {
        q: tx(t, "figPdeL4_q", "Why does every shape return at t = 2?"),
        options: [tx(t, "figPdeL4_o1", "at t = 2 every mode has done a whole number of cycles"), tx(t, "figPdeL4_o2", "the string loses energy"), tx(t, "figPdeL4_o3", "only mode 1 survives"), tx(t, "figPdeL4_o4", "the ends move")],
        answer: 0,
        why: tx(t, "figPdeL4_w", "cos(nπ · 2) = cos(2nπ) = 1 for every n, so every mode is back where it started. This is why a string has a definite pitch: its overtones are whole multiples of one frequency."),
      },
    },
    {
      title: tx(t, "figPdeL5_t", "On a grid"),
      body: <p>{tx(t, "figPdeL5_b", "Back to heat and the block, and turn on \"solve on a grid\". A computer keeps 31 temperatures and updates each from its neighbours. With r = 0.4 it follows the exact solution (dashed). Run it.")}</p>,
      goal: { text: tx(t, "figPdeL5_g", "Grid with r ≤ 0.5, run for 40 steps."), done: useGrid && r <= 0.5 && steps >= 40 },
      focus: "play",
      setup: () => { setEqRaw("heat"); setShapeRaw("block"); setGridOn(true); setRRaw(0.4); setPlaying(false); setSteps(0); setU(initGrid(SHAPES.block)); },
    },
    {
      title: tx(t, "figPdeL6_t", "Break it"),
      body: <p>{tx(t, "figPdeL6_b", "Raise r above 0.5 (a bigger time step) and run again. Each step overshoots the highest-frequency zigzag a little more, until it explodes.")}</p>,
      goal: { text: tx(t, "figPdeL6_g", "Make the grid solution blow up."), done: blown },
    },
  ];
  const insights: Insight[] = [
    {
      id: "blown", tone: "warn", when: blown,
      title: tx(t, "figPdeI1_t", "Numerical instability"),
      body: tx(t, "figPdeI1_b", "With r > ½ the update multiplies the fastest zigzag by 1 − 4r, which is below −1: it flips sign and grows every step. The equation is fine; the time step is too big. Keep Δt ≤ Δx²/2."),
    },
    {
      id: "one", tone: "info", when: eq === "heat" && !useGrid && time > 0.08,
      title: tx(t, "figPdeI2_t", "One hump left"),
      body: tx(t, "figPdeI2_b", "Every mode but the first is now tiny: whatever the start, a cooling rod ends up shaped like sin(πx), shrinking by e^(−π²t)."),
    },
    {
      id: "back", tone: "ok", when: eq === "wave" && Math.abs(time - 2) < 0.02,
      title: tx(t, "figPdeI3_t", "Back to the start"),
      body: tx(t, "figPdeI3_b", "At t = 2 the string has exactly its initial shape again."),
    },
  ];

  const title = tx(t, "figPde_title", "Heat and waves, mode by mode");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<>{eqChoice}<LabButton lab={lab} t={t} /></>} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{eqChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figPdeR1", "Split the starting shape into sine modes; each mode evolves on its own."),
          tx(t, "figPdeR2", "Heat: mode n decays like e^(−n²π²t), so detail vanishes first and the rod smooths out."),
          tx(t, "figPdeR3", "Waves: mode n oscillates like cos(nπt); nothing decays and the shape returns at t = 2."),
          tx(t, "figPdeR4", "On a grid, the explicit step is stable only if Δt ≤ Δx²/2."),
        ]}
      />
    </>
  );
}
