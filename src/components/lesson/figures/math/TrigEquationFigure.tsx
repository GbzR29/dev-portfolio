"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, plot, fnPath, useDrag, clamp } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Solving sin x = c (or cos x = c, tan x = c) two ways at once. Left: the unit
// circle, where the level c is a horizontal line for sine (a height), a
// vertical line for cosine (an x) and a point (1, c) on the tangent line for
// tangent; it meets the circle in the angles that solve the equation. Right:
// the graph over two turns each way, with the line y = c crossing the curve
// at every solution. Both panels use the same vertical scale, so for sine and
// tangent the line runs straight from one panel into the other.
// Green dots are the family α + 2kπ (α = arcsin/arccos/arctan c), blue the
// second family (π − α for sine, −α for cosine; tangent has only one, with
// period π). "Break it" hides the second family: the red rings are the
// solutions a calculator alone would miss. The > / < modes shade where the
// inequality holds, on the circle and on the graph.

type Fn = "sin" | "cos" | "tan";
type Rel = "eq" | "gt" | "lt";
const W = 560, H = 270, CW = 190;
const TAU = Math.PI * 2, DEG = 180 / Math.PI;
const YR = (1.35 * H) / CW;                               // same scale in both panels
const pc = plot({ W: CW, H, x0: -1.35, x1: 1.35, y0: -YR, y1: YR });
const pg = plot({ W: W - CW, H, x0: -TAU - 0.45, x1: TAU + 0.45, y0: -YR, y1: YR });
const F: Record<Fn, (x: number) => number> = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
const INV: Record<Fn, (c: number) => number> = { sin: Math.asin, cos: Math.acos, tan: Math.atan };
const CMAX: Record<Fn, number> = { sin: 1.3, cos: 1.3, tan: 1.85 };
const SNAP: Record<Fn, number[]> = {
  sin: [0, 0.5, Math.SQRT1_2, Math.sqrt(3) / 2, 1].flatMap(v => [v, -v]),
  cos: [0, 0.5, Math.SQRT1_2, Math.sqrt(3) / 2, 1].flatMap(v => [v, -v]),
  tan: [0, 1 / Math.sqrt(3), 1, Math.sqrt(3)].flatMap(v => [v, -v]),
};
const fmtDeg = (r: number) => `${+(r * DEG).toFixed(1)}°`.replace("-", "−");
const n3 = (v: number) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3).replace("-", "−");
const mod = (a: number, m: number) => ((a % m) + m) % m;

/** Whether the relation holds at angle x (the graph of tan is undefined at its asymptotes). */
function holds(fn: Fn, rel: Rel, c: number, x: number) {
  if (fn === "tan" && Math.abs(Math.cos(x)) < 1e-9) return false;
  const v = F[fn](x);
  return rel === "gt" ? v > c : rel === "lt" ? v < c : false;
}

/** The solution families: base angles and the period they repeat with. */
function families(fn: Fn, c: number) {
  if (fn !== "tan" && Math.abs(c) > 1 + 1e-12) return { a: null as number | null, b: null as number | null, period: TAU };
  const a = INV[fn](fn === "tan" ? c : clamp(c, -1, 1));
  if (fn === "tan") return { a, b: null, period: Math.PI };
  const b = fn === "sin" ? Math.PI - a : -a;
  return { a, b: Math.abs(mod(b - a + 1e-9, TAU)) < 1e-6 ? null : b, period: TAU };
}

/** Every solution in [0, 2π), sorted, with the family it belongs to. */
function inOneTurn(fn: Fn, c: number) {
  const { a, b, period } = families(fn, c);
  const out: { x: number; fam: "a" | "b" }[] = [];
  const add = (base: number | null, fam: "a" | "b") => {
    if (base === null) return;
    for (let x = mod(base, period); x < TAU - 1e-9; x += period) if (!out.some(o => Math.abs(o.x - x) < 1e-6)) out.push({ x, fam });
  };
  add(a, "a"); add(b, "b");
  return out.sort((p, q) => p.x - q.x);
}

/** The inequality's solution set in [0°, 360°), as interval text. */
function intervals(fn: Fn, rel: Rel, c: number) {
  const cuts = [0, ...inOneTurn(fn, c).map(s => s.x), ...(fn === "tan" ? [Math.PI / 2, 1.5 * Math.PI] : []), TAU]
    .sort((p, q) => p - q).filter((v, i, xs) => i === 0 || v - xs[i - 1] > 1e-9);
  const runs: [number, number][] = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    if (!holds(fn, rel, c, (cuts[i] + cuts[i + 1]) / 2)) continue;
    const last = runs[runs.length - 1];
    // merge across a cut that is itself in the set (a touching point is not, an asymptote is not)
    if (last && Math.abs(last[1] - cuts[i]) < 1e-9 && holds(fn, rel, c, cuts[i])) last[1] = cuts[i + 1];
    else runs.push([cuts[i], cuts[i + 1]]);
  }
  return runs.map(([p, q]) => `${p === 0 && holds(fn, rel, c, 0) ? "[" : "("}${fmtDeg(p)}, ${fmtDeg(q)})`);
}

// ── The drawing ───────────────────────────────────────────────────────────────

/** The svg; owns the drag (it is mounted twice while the lab is open). */
function TeqStage({ fn, c, setC, rel, both }: { fn: Fn; c: number; setC: (v: number) => void; rel: Rel; both: boolean }) {
  const drag = useDrag<"c">(
    () => "c",
    (_, q) => {
      const v = fn === "cos" && q.x < CW ? pc.inv(q).x : pc.inv(q).y;
      const m = CMAX[fn], raw = clamp(v, -m, m);
      const snap = SNAP[fn].find(s => Math.abs(s - raw) < 0.025);
      setC(snap ?? Math.round(raw * 100) / 100);
    });
  const { a, b, period } = families(fn, c);
  const X = pc.X, Y = pc.Y, GX = (x: number) => CW + pg.X(x), GY = pg.Y;
  const f = F[fn];

  // solutions in the graph window
  const dots: { x: number; fam: "a" | "b" }[] = [];
  for (const [base, fam] of [[a, "a"], [b, "b"]] as const) {
    if (base === null) continue;
    for (let k = -4; k <= 4; k++) { const x = base + k * period; if (x >= pg.x0 && x <= pg.x1) dots.push({ x, fam }); }
  }
  // where the inequality holds, as runs along the graph
  const runs: [number, number][] = [];
  if (rel !== "eq") {
    let start: number | null = null;
    const N = 900;
    for (let i = 0; i <= N; i++) {
      const x = pg.x0 + ((pg.x1 - pg.x0) * i) / N, on = holds(fn, rel, c, x);
      if (on && start === null) start = x;
      if ((!on || i === N) && start !== null) { runs.push([start, x]); start = null; }
    }
  }
  const arcs: string[] = [];
  if (rel !== "eq") {
    let d = "", pen = false;
    for (let i = 0; i <= 360; i++) {
      const th = (i / 360) * TAU, on = holds(fn, rel, c, th);
      if (on) { d += `${pen ? "L" : "M"}${X(Math.cos(th)).toFixed(1)},${Y(Math.sin(th)).toFixed(1)}`; pen = true; } else pen = false;
    }
    arcs.push(d);
  }
  const pts = [[a, "a"], [b, "b"]].filter(([v]) => v !== null) as [number, "a" | "b"][];
  if (fn === "tan" && a !== null) pts.push([a + Math.PI, "a"]);
  const colOf = (fam: "a" | "b") => (fam === "a" ? C.green : both ? C.sky : C.red);
  const line = fn === "cos"
    ? <line x1={X(c)} x2={X(c)} y1={0} y2={H} stroke={C.amber} strokeWidth={1.8} strokeDasharray="5 4" />
    : null;                                              // sine and tangent: the graph line runs across both panels

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* ── circle panel ── */}
      <line x1={0} x2={CW} y1={Y(0)} y2={Y(0)} stroke={C.axis} strokeWidth={1} />
      <line x1={X(0)} x2={X(0)} y1={0} y2={H} stroke={C.axis} strokeWidth={1} />
      <circle cx={X(0)} cy={Y(0)} r={pc.sx} fill="none" stroke={C.muted} strokeWidth={1.3} />
      {arcs.map((d, i) => <path key={i} d={d} fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" opacity={0.55} />)}
      {fn === "tan" && <>
        <line x1={X(1)} x2={X(1)} y1={0} y2={H} stroke={C.muted} strokeWidth={1} />
        {a !== null && <line x1={X(-1.35 * Math.cos(a))} y1={Y(-1.35 * Math.sin(a))} x2={X(1)} y2={Y(c)} stroke={C.fg} strokeWidth={1} opacity={0.6} />}
        <circle cx={X(1)} cy={Y(c)} r={3.5} fill={C.amber} />
      </>}
      {line}
      {a !== null && <path d={`M${X(0.28)},${Y(0)} A${0.28 * pc.sx},${0.28 * pc.sy} 0 ${a > Math.PI ? 1 : 0} ${a >= 0 ? 0 : 1} ${X(0.28 * Math.cos(a))},${Y(0.28 * Math.sin(a))}`} fill="none" stroke={C.purple} strokeWidth={2} />}
      {pts.map(([th, fam], i) => (
        <g key={i}>
          <line x1={X(0)} y1={Y(0)} x2={X(Math.cos(th))} y2={Y(Math.sin(th))} stroke={colOf(fam)} strokeWidth={1.6} strokeDasharray={fam === "b" && !both ? "3 3" : undefined} />
          {fam === "b" && !both
            ? <circle cx={X(Math.cos(th))} cy={Y(Math.sin(th))} r={5} fill="none" stroke={C.red} strokeWidth={1.8} strokeDasharray="2 2" />
            : <circle cx={X(Math.cos(th))} cy={Y(Math.sin(th))} r={4.5} fill={colOf(fam)} />}
        </g>
      ))}
      {a !== null && <T x={X(0.34 * Math.cos(a / 2)) + 2} y={Y(0.34 * Math.sin(a / 2)) + 3} color={C.purple} bold>α</T>}
      {a === null && <T x={8} y={16} color={C.red} bold>|c| &gt; 1</T>}

      {/* ── graph panel ── */}
      <line x1={CW} x2={CW} y1={0} y2={H} stroke={C.grid} strokeWidth={1} />
      <rect x={GX(0)} y={0} width={GX(TAU) - GX(0)} height={H} fill={C.sky} opacity={0.05} />
      {runs.map(([p, q], i) => <g key={i}>
        <rect x={GX(p)} y={0} width={GX(q) - GX(p)} height={H} fill={C.green} opacity={0.1} />
        <line x1={GX(p)} x2={GX(q)} y1={GY(0)} y2={GY(0)} stroke={C.green} strokeWidth={4} opacity={0.7} />
      </g>)}
      <line x1={CW} x2={W} y1={GY(0)} y2={GY(0)} stroke={C.axis} strokeWidth={1} />
      <line x1={GX(0)} x2={GX(0)} y1={0} y2={H} stroke={C.axis} strokeWidth={1} />
      {[-2, -1, 1, 2].map(k => <T key={k} x={GX(k * Math.PI)} y={H - 8} size={9} anchor="middle" color={C.axis}>{`${k === 1 ? "" : k === -1 ? "−" : k}π`.replace("-", "−")}</T>)}
      <T x={GX(Math.PI)} y={12} size={9} anchor="middle" color={C.sky}>{"0 ≤ x < 2π"}</T>
      {fn === "tan" && [-1.5, -0.5, 0.5, 1.5].map(k => <line key={k} x1={GX(k * Math.PI)} x2={GX(k * Math.PI)} y1={0} y2={H} stroke={C.muted} strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />)}
      <g transform={`translate(${CW},0)`}>
        <path d={fnPath(pg, f, pg.x0, pg.x1, fn === "tan" ? 1600 : 400)} fill="none" stroke={C.fg} strokeWidth={2} />
      </g>
      <line x1={fn === "cos" ? CW : 0} x2={W} y1={GY(c)} y2={GY(c)} stroke={C.amber} strokeWidth={1.8} strokeDasharray="5 4" />
      {dots.map((d, i) => d.fam === "b" && !both
        ? <circle key={i} cx={GX(d.x)} cy={GY(c)} r={5} fill="none" stroke={C.red} strokeWidth={1.8} strokeDasharray="2 2" />
        : <circle key={i} cx={GX(d.x)} cy={GY(c)} r={4.5} fill={colOf(d.fam)} stroke={a !== null && Math.abs(d.x - a) < 1e-9 ? C.purple : "none"} strokeWidth={2.5} />)}
      <T x={CW + 8} y={14} color={C.amber} bold>{`${fn} x ${rel === "gt" ? ">" : rel === "lt" ? "<" : "="} ${n3(c)}`}</T>
    </svg>
  );
}

export function TrigEquationFigure({ t }: { t?: TrackTranslations }) {
  const [fn, setFn] = useState<Fn>("sin");
  const [c, setC] = useState(0.5);
  const [rel, setRel] = useState<Rel>("eq");
  const [both, setBoth] = useState(true);
  const lab = useLab("math-trig-equations");

  const sols = inOneTurn(fn, c);
  const { a } = families(fn, c);
  const shown = sols.filter(s => both || s.fam === "a");
  const ivs = rel === "eq" ? [] : intervals(fn, rel, c);
  const inv = fn === "sin" ? "arcsin" : fn === "cos" ? "arccos" : "arctan";
  const general = fn === "tan" ? "x = α + 180°·k" : fn === "sin" ? "x = α + 360°·k  |  x = 180° − α + 360°·k" : "x = ±α + 360°·k";
  const pickFn = (k: Fn) => { setFn(k); setC(k === "tan" ? 1 : 0.5); };

  const view = <TeqStage fn={fn} c={c} setC={setC} rel={rel} both={both} />;
  const fnChoice = <Choice value={fn} onChange={pickFn} options={[["sin", "sin x = c"], ["cos", "cos x = c"], ["tan", "tan x = c"]] as const} />;
  const controls = <>
    <Row>
      <Choice value={rel} onChange={setRel} options={[["eq", "="], ["gt", ">"], ["lt", "<"]] as const} />
      <Btn active={!both} onClick={() => setBoth(v => !v)}>{tx(t, "figTeq_break", "break it: only the calculator's answer")}</Btn>
    </Row>
    <Sliders>
      <Slider label="c" value={c} min={-CMAX[fn]} max={CMAX[fn]} step={0.01} onChange={setC} fmt={n3} />
    </Sliders>
    <Row>
      <Readout color={C.purple}>{a === null ? tx(t, "figTeq_noAlpha", "no angle: |c| > 1") : `α = ${inv}(${n3(c)}) = ${fmtDeg(a)}`}</Readout>
      {a !== null && <Readout>{general}</Readout>}
    </Row>
    <Row>
      <Readout color={shown.length ? C.green : C.red}>{rel === "eq"
        ? (sols.length
          ? fill(tx(t, "figTeq_sols", "in [0°, 360°): {list}"), { list: shown.map(s => fmtDeg(s.x)).join(", ") })
          : tx(t, "figTeq_none", "no solution"))
        : (ivs.length ? fill(tx(t, "figTeq_ivs", "holds on {list}"), { list: ivs.join(" ∪ ") }) : tx(t, "figTeq_never", "holds nowhere"))}</Readout>
      {!both && sols.length > shown.length && <Readout color={C.red}>{fill(tx(t, "figTeq_missed", "missed: {list}"), { list: sols.filter(s => s.fam === "b").map(s => fmtDeg(s.x)).join(", ") })}</Readout>}
    </Row>
  </>;
  const note = tx(t, "figTeq_note", "Drag up and down (or use the slider) to move the level c. On the circle, sin x = c is a horizontal line at height c, cos x = c a vertical line at x = c, and tan x = c the line from the centre through (1, c) on the tangent line. Where it meets the circle are the solutions in one turn; the graph shows them repeating every turn. The green dots come from α, the one angle arcsin, arccos or arctan gives you; the blue dots are the second family, which your calculator never shows. Move c past 1 and the line misses the circle: no solution. Choose > or < to shade where the inequality holds.");

  // ── Lab ──
  const near = (v: number) => Math.abs(c - v) < 0.006;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figTeqL1_t", "One value, two angles"),
      body: <>
        <p>{tx(t, "figTeqL1_b1", "The amber line is the level c. Every place it crosses the sine curve is a solution of sin x = c.")}</p>
        <p>{tx(t, "figTeqL1_b2", "Move the line to c = 1/2.")}</p>
      </>,
      goal: { text: tx(t, "figTeqL1_g", "sin x = 0.5: two angles in one turn, 30° and 150°."), done: fn === "sin" && rel === "eq" && near(0.5) },
      hint: tx(t, "figTeqL1_h", "Drag; the line clicks onto 0.500."),
      setup: () => { setFn("sin"); setRel("eq"); setBoth(true); setC(0.2); },
    },
    {
      title: tx(t, "figTeqL2_t", "Quick check"),
      body: <p>{tx(t, "figTeqL2_b", "Each turn adds the same two angles again, 360° later.")}</p>,
      quiz: {
        q: tx(t, "figTeqL2_q", "How many solutions does sin x = 1/2 have with 0° ≤ x < 720°?"),
        options: ["4", "2", "1", "∞"],
        answer: 0,
        why: tx(t, "figTeqL2_w", "30°, 150°, then 390° and 510° in the second turn."),
      },
    },
    {
      title: tx(t, "figTeqL3_t", "Break it"),
      body: <>
        <p>{tx(t, "figTeqL3_b1", "A calculator's sin⁻¹ returns one angle, from −90° to 90°. That is the green family only.")}</p>
        <p>{tx(t, "figTeqL3_b2", "Turn on \"break it\" and see what it misses.")}</p>
      </>,
      goal: { text: tx(t, "figTeqL3_g", "Only the calculator's family shown."), done: fn === "sin" && !both && near(0.5) },
      setup: () => { setFn("sin"); setRel("eq"); setBoth(true); setC(0.5); },
    },
    {
      title: tx(t, "figTeqL4_t", "Out of reach"),
      body: <p>{tx(t, "figTeqL4_b", "Turn the second family back on. Now raise the line above the circle.")}</p>,
      goal: { text: tx(t, "figTeqL4_g", "sin x = c with no solution at all."), done: fn === "sin" && Math.abs(c) > 1 },
      hint: tx(t, "figTeqL4_h", "Above c = 1 the line misses the circle and the wave."),
      setup: () => { setFn("sin"); setRel("eq"); setBoth(true); setC(0.5); },
    },
    {
      title: tx(t, "figTeqL5_t", "Cosine: a mirror in the x-axis"),
      body: <>
        <p>{tx(t, "figTeqL5_b1", "For cosine the level is an x, so the line is vertical. Its two crossings are mirror images: α and −α.")}</p>
        <p>{tx(t, "figTeqL5_b2", "Solve cos x = −1/2.")}</p>
      </>,
      goal: { text: tx(t, "figTeqL5_g", "cos x = −0.5: 120° and 240°."), done: fn === "cos" && rel === "eq" && near(-0.5) },
      setup: () => { setFn("cos"); setRel("eq"); setBoth(true); setC(0.3); },
    },
    {
      title: tx(t, "figTeqL6_t", "Tangent: one family"),
      body: <p>{tx(t, "figTeqL6_b", "The line through the centre and (1, c) meets the circle at two opposite points, 180° apart. So tan x = c has one family with period 180°. Solve tan x = −1.")}</p>,
      goal: { text: tx(t, "figTeqL6_g", "tan x = −1: 135° and 315°."), done: fn === "tan" && rel === "eq" && near(-1) },
      setup: () => { setFn("tan"); setRel("eq"); setBoth(true); setC(1); },
    },
    {
      title: tx(t, "figTeqL7_t", "Inequalities"),
      body: <p>{tx(t, "figTeqL7_b", "Back to sine. Choose > and set c = 1/2: the shaded arc is where the point is higher than the line.")}</p>,
      goal: { text: tx(t, "figTeqL7_g", "sin x > 1/2 shaded."), done: fn === "sin" && rel === "gt" && near(0.5) },
      setup: () => { setFn("sin"); setRel("eq"); setBoth(true); setC(0.5); },
    },
    {
      title: tx(t, "figTeqL8_t", "Quick check"),
      body: <p>{tx(t, "figTeqL8_b", "Read the shaded part of one turn.")}</p>,
      quiz: {
        q: tx(t, "figTeqL8_q", "For 0° ≤ x < 360°, when is cos x < 1/2?"),
        options: ["60° < x < 300°", "0° ≤ x < 60°", "x > 60°", "120° < x < 240°"],
        answer: 0,
        why: tx(t, "figTeqL8_w", "cos x = 1/2 at 60° and 300°; between them the point is left of the line x = 1/2."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "none", tone: "warn", when: fn !== "tan" && Math.abs(c) > 1,
      title: tx(t, "figTeqI1_t", "No solution"),
      body: tx(t, "figTeqI1_b", "Sine and cosine never leave [−1, 1]: a point on the unit circle has no coordinate bigger than 1."),
    },
    {
      id: "touch", tone: "info", when: fn !== "tan" && Math.abs(Math.abs(c) - 1) < 1e-9,
      title: tx(t, "figTeqI2_t", "The two families merge"),
      body: tx(t, "figTeqI2_b", "At c = ±1 the line only touches the circle. Both angles are the same point, so there is one solution per turn."),
    },
    {
      id: "break", tone: "warn", when: !both && sols.length > shown.length,
      title: tx(t, "figTeqI3_t", "Half the answers are gone"),
      body: tx(t, "figTeqI3_b", "arcsin and arccos return one angle each. The other solution in the turn, 180° − α for sine or −α for cosine, has to be added by hand."),
    },
    {
      id: "tan", tone: "info", when: fn === "tan",
      title: tx(t, "figTeqI4_t", "Every c works"),
      body: tx(t, "figTeqI4_b", "Tangent takes every real value, so tan x = c always has solutions, one every 180°. The dashed lines are where tan is undefined."),
    },
  ];

  const title = tx(t, "figTeq_title", "Solving sin x = c on the circle and the graph");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{fnChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{fnChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figTeqR1", "sin x = c has two solutions per turn when |c| < 1: α and 180° − α, with α = arcsin c."),
          tx(t, "figTeqR2", "cos x = c: ±α with α = arccos c. tan x = c: α + 180°k, one family."),
          tx(t, "figTeqR3", "Add 360°k (180°k for tan) to get every solution; |c| > 1 gives none for sin and cos."),
          tx(t, "figTeqR4", "An inequality holds on arcs between the solutions of the equation: solve the equation first, then test the arcs."),
        ]}
      />
    </>
  );
}
