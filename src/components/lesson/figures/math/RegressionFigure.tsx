"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Btn, Choice, C, T, plot, useDrag, useFrame, useVisible, nearest, clamp, f2, Handle } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A scatter plot of draggable points. "Least squares" draws the line
// ŷ = a + bx that minimises the sum of squared residuals: each residual is
// the vertical gap from a point to the line, and its square is drawn as a
// square with that gap as its side. The Transport turns the line about the
// point of means (x̄, ȳ), from flat (b = 0) to the best slope; the inset in
// the corner draws SSE as a parabola in b and the dot slides down to its
// bottom. "Your line" gives the line two handles to move by hand; try to make
// the total area of the squares, SSE, as small as the least-squares value.
// The readouts show the correlation r, the slope and intercept, SSE and
// R² = 1 − SSE/SST.
// The lab: beat least squares by hand, turn to the best slope, the point of
// means, a curve with r ≈ 0, an outlier, R², regression to the mean.

type Pt = [number, number];
type Mode = "ls" | "mine";
type Id = number | "h0" | "h1";
const PRESETS: Record<string, Pt[]> = {
  positive: [[1, 1.8], [2, 2.6], [3, 3.1], [4, 4.4], [5, 4.6], [6, 5.9], [7, 6.2], [8, 7.5], [9, 7.9]],
  negative: [[1, 8.2], [2, 7.9], [3, 6.4], [4, 6.6], [5, 5.1], [6, 4.2], [7, 4.4], [8, 2.9], [9, 2.2]],
  none: [[1, 5.5], [2, 3.2], [3, 7.1], [4, 4.8], [5, 6.3], [6, 3.9], [7, 6.8], [8, 4.1], [9, 5.6]],
  curve: [[1, 8.5], [2, 5.8], [3, 3.9], [4, 2.8], [5, 2.5], [6, 2.9], [7, 3.8], [8, 5.9], [9, 8.4]],
  outlier: [[1, 2], [2, 2.4], [3, 3.1], [4, 3.3], [5, 4.1], [6, 4.4], [7, 5.1], [8, 5.3], [9, 0.8]],
};
type Preset = keyof typeof PRESETS;
const W = 560, H = 330;
const pl = plot({ W, H, x0: 0, x1: 10, y0: 0, y1: 10 });
const IN = { x: 8, y: 8, w: 150, h: 78 };                    // the SSE(b) inset, in svg pixels

/** Least-squares slope, intercept and correlation from the sums of the chapter. */
function fit(ps: Pt[]) {
  const n = ps.length, mx = ps.reduce((s, p) => s + p[0], 0) / n, my = ps.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of ps) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  const b = sxx ? sxy / sxx : 0;
  return { mx, my, b, a: my - b * mx, r: sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0, sst: syy, sxy, sxx };
}
type Fit = ReturnType<typeof fit>;
/** SSE of the line through (x̄, ȳ) with slope b: Syy − 2b·Sxy + b²·Sxx. */
const sseOf = (F: Fit, b: number) => F.sst - 2 * b * F.sxy + b * b * F.sxx;

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function RegStage({ pts, setPts, mode, mine, setMine, a, b, squares, F, t }: {
  pts: Pt[]; setPts: (f: (p: Pt[]) => Pt[]) => void; mode: Mode; mine: [number, number]; setMine: (f: (m: [number, number]) => [number, number]) => void;
  a: number; b: number; squares: boolean; F: Fit; t?: TrackTranslations;
}) {
  const line = (x: number) => a + b * x;
  const drag = useDrag<Id>(
    q => {
      const cands: [Id, { x: number; y: number }][] = pts.map((p, i) => [i, { x: pl.X(p[0]), y: pl.Y(p[1]) }]);
      if (mode === "mine") cands.push(["h0", { x: pl.X(1), y: pl.Y(mine[0]) }], ["h1", { x: pl.X(9), y: pl.Y(mine[1]) }]);
      return nearest(q, cands, 16);
    },
    (id, q) => {
      const w = pl.inv(q), y = clamp(w.y, 0, 10);
      if (id === "h0") setMine(m => [y, m[1]]);
      else if (id === "h1") setMine(m => [m[0], y]);
      else setPts(ps => ps.map((p, j) => (j === id ? [clamp(w.x, 0.2, 9.8), y] : p)));
    },
  );

  // The inset: SSE as a function of b for lines through the point of means.
  const span = Math.max(1, 1.5 * Math.abs(F.b)), b0 = F.b - span, b1 = F.b + span;
  const sMax = Math.max(sseOf(F, b0), sseOf(F, b1)), sMin = sseOf(F, F.b);
  const ix = (v: number) => IN.x + 8 + ((v - b0) / (b1 - b0)) * (IN.w - 16);
  const iy = (s: number) => IN.y + IN.h - 12 - ((s - sMin) / (sMax - sMin || 1)) * (IN.h - 30);
  const curve = Array.from({ length: 41 }, (_, i) => { const v = b0 + ((b1 - b0) * i) / 40; return `${i ? "L" : "M"}${ix(v).toFixed(1)},${iy(sseOf(F, v)).toFixed(1)}`; }).join("");
  const bDot = clamp(b, b0, b1);

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-move">
      {[0, 2, 4, 6, 8, 10].map(v => <g key={v}>
        <line x1={pl.X(v)} x2={pl.X(v)} y1={0} y2={H} stroke={C.grid} strokeWidth={0.6} />
        <line x1={0} x2={W} y1={pl.Y(v)} y2={pl.Y(v)} stroke={C.grid} strokeWidth={0.6} />
        <T x={pl.X(v) + 3} y={H - 4} color={C.axis} size={8.5}>{v}</T>
      </g>)}
      {squares && pts.map(([x, y], i) => {
        const e = y - line(x), side = Math.abs(e) * pl.sy;
        return <rect key={i} x={pl.X(x)} y={Math.min(pl.Y(y), pl.Y(line(x)))} width={side} height={side}
          fill={C.amber} opacity={0.18} stroke={C.amber} strokeWidth={0.8} />;
      })}
      {pts.map(([x, y], i) => <line key={i} x1={pl.X(x)} x2={pl.X(x)} y1={pl.Y(y)} y2={pl.Y(line(x))} stroke={C.amber} strokeWidth={1.4} />)}
      <line x1={pl.X(0)} x2={pl.X(10)} y1={pl.Y(line(0))} y2={pl.Y(line(10))} stroke={C.blue} strokeWidth={2.2} />
      {mode === "mine" && <line x1={pl.X(0)} x2={pl.X(10)} y1={pl.Y(F.a)} y2={pl.Y(F.a + 10 * F.b)} stroke={C.blue} strokeWidth={1} strokeDasharray="4 5" opacity={0.5} />}
      <g stroke={C.purple} strokeWidth={1.5}>
        <line x1={pl.X(F.mx) - 7} x2={pl.X(F.mx) + 7} y1={pl.Y(F.my)} y2={pl.Y(F.my)} />
        <line x1={pl.X(F.mx)} x2={pl.X(F.mx)} y1={pl.Y(F.my) - 7} y2={pl.Y(F.my) + 7} />
      </g>
      <T x={pl.X(F.mx) + 8} y={pl.Y(F.my) - 8} color={C.purple}>{"(x̄, ȳ)"}</T>
      {pts.map(([x, y], i) => <circle key={i} cx={pl.X(x)} cy={pl.Y(y)} r={4.5} fill={C.fg} opacity={drag.dragging === i ? 1 : 0.8} />)}
      {mode === "mine" && <>
        <Handle x={pl.X(1)} y={pl.Y(mine[0])} color={C.blue} active={drag.dragging === "h0"} />
        <Handle x={pl.X(9)} y={pl.Y(mine[1])} color={C.blue} active={drag.dragging === "h1"} />
      </>}
      {mode === "ls" && <g pointerEvents="none">
        <rect x={IN.x} y={IN.y} width={IN.w} height={IN.h} rx={6} fill={C.bg} opacity={0.92} stroke={C.grid} />
        <T x={IN.x + 8} y={IN.y + 13} size={9} color={C.amber} bold>{tx(t, "figReg_inset", "SSE for each slope b")}</T>
        <path d={curve} fill="none" stroke={C.amber} strokeWidth={1.6} />
        <line x1={ix(F.b)} x2={ix(F.b)} y1={IN.y + 18} y2={IN.y + IN.h - 10} stroke={C.muted} strokeWidth={0.8} strokeDasharray="3 3" />
        <circle cx={ix(bDot)} cy={iy(sseOf(F, bDot))} r={4} fill={C.blue} />
        <T x={IN.x + IN.w - 8} y={IN.y + IN.h - 2} size={8.5} anchor="end" color={C.muted}>{"b"}</T>
      </g>}
    </svg>
  );
}

export function RegressionFigure({ t }: { t?: TrackTranslations }) {
  const [pts, setPtsRaw] = useState<Pt[]>(PRESETS.positive);
  const [preset, setPresetRaw] = useState<Preset | "">("positive");
  const [mode, setModeRaw] = useState<Mode>("ls");
  const [mine, setMine] = useState<[number, number]>([3, 6]); // heights of your line at x = 1 and x = 9
  const [squares, setSquares] = useState(true);
  const [turn, setTurn] = useState(1);                         // how far the line has turned to the best slope
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-regression");
  const vis = useVisible<HTMLDivElement>();

  const setPreset = (k: Preset) => { setPresetRaw(k); setPtsRaw(PRESETS[k]); };
  const setPts = (f: (p: Pt[]) => Pt[]) => { setPresetRaw(""); setPtsRaw(f); };
  const setMode = (m: Mode) => { setPlaying(false); setModeRaw(m); };
  /** A lab step's starting state. */
  const go = (k: Preset, m: Mode, tu = 1) => { setPlaying(false); setPreset(k); setModeRaw(m); setTurn(tu); setMine([3, 6]); setSquares(true); };

  const F = fit(pts);
  const [a, b] = mode === "ls" ? [F.my - turn * F.b * F.mx, turn * F.b] : [mine[0] - (mine[1] - mine[0]) / 8, (mine[1] - mine[0]) / 8];
  const sse = pts.reduce((s, [x, y]) => s + (y - a - b * x) ** 2, 0);
  const sseLs = sseOf(F, F.b);

  useFrame(playing && (vis.on || lab.open), dt => {
    const next = Math.min(1, turn + dt * 0.35);
    setTurn(next);
    if (next >= 1) setPlaying(false);
  });
  const stops = [0, 0.25, 0.5, 0.75, 1];

  const view = (
    <div>
      <RegStage pts={pts} setPts={setPts} mode={mode} mine={mine} setMine={setMine} a={a} b={b} squares={squares} F={F} t={t} />
      {mode === "ls" && <Transport t={t} playing={playing}
        onPlay={() => { if (playing) { setPlaying(false); return; } if (turn >= 1) setTurn(0); setPlaying(true); }}
        playLabel={tx(t, "figReg_turnPlay", "turn the line to the best slope")}
        onStep={() => { setPlaying(false); setTurn(stops.find(v => v > turn + 1e-6) ?? 1); }}
        onBack={() => { setPlaying(false); setTurn([...stops].reverse().find(v => v < turn - 1e-6) ?? 0); }}
        onReset={() => { setPlaying(false); setTurn(0); }}
        readout={`b = ${f2(b)} · SSE = ${f2(sse)}`} />}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["ls", tx(t, "figReg_ls", "least squares")],
    ["mine", tx(t, "figReg_mine", "your line")],
  ]} />;
  const controls = <>
    <Row><Choice value={preset as Preset} onChange={setPreset} options={[
      ["positive", tx(t, "figReg_positive", "rising")],
      ["negative", tx(t, "figReg_negative", "falling")],
      ["none", tx(t, "figReg_none", "no relation")],
      ["curve", tx(t, "figReg_curve", "curve")],
      ["outlier", tx(t, "figReg_outlier", "one outlier")],
    ]} /></Row>
    <Row>
      <Btn active={squares} onClick={() => setSquares(v => !v)}>{tx(t, "figReg_squares", "show squared residuals")}</Btn>
      <Btn onClick={() => setPts(ps => (ps.length < 20 ? [...ps, [0.5 + 9 * Math.random(), 1 + 8 * Math.random()]] : ps))}>{tx(t, "figReg_add", "add a point")}</Btn>
      <Btn onClick={() => setPts(ps => (ps.length > 3 ? ps.slice(0, -1) : ps))}>{tx(t, "figReg_remove", "remove a point")}</Btn>
    </Row>
    <Row>
      <Readout color={C.blue}>{`ŷ = ${f2(a)} ${b < 0 ? "−" : "+"} ${f2(Math.abs(b))}x`}</Readout>
      <Readout color={C.purple}>{`r = ${f2(F.r, 3)}`}</Readout>
      <Readout color={C.amber}>{`SSE = ${f2(sse)}${mode === "mine" || turn < 1 ? `  (${tx(t, "figReg_best", "best")} ${f2(sseLs)})` : ""}`}</Readout>
      <Readout>{`R² = 1 − SSE/SST = ${f2(1 - sse / (F.sst || 1), 3)}`}</Readout>
    </Row>
  </>;
  const note = <>
    {tx(t, "figReg_note2", "The least-squares line always passes through the point of means (x̄, ȳ), marked by the cross. Press ▶ to turn it there from flat to the best slope: the inset draws SSE against the slope b, a parabola, and the dot slides down to its bottom. On \"curve\" r is close to 0 although x and y are closely related: r only measures straight-line association. On \"one outlier\" a single point drags the whole line. In \"your line\" no position of the handles beats the least-squares SSE.")}{" "}
    <span data-mouse-only>{tx(t, "figReg_drag", "Drag the points (and, in \"your line\", the two blue handles).")}</span>
    <span data-touch-only>{tx(t, "figReg_dragTouch", "Drag the points (and, in \"your line\", the two blue handles).")}</span>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figRegL1_t", "Beat it by hand"),
      body: <>
        <p>{tx(t, "figRegL1_b1", "Each amber square has a residual, the vertical miss of a point, as its side. SSE is their total area.")}</p>
        <p>{tx(t, "figRegL1_b2", "Drag the two blue handles to make SSE as small as you can. The dashed line is the least-squares answer.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRegL1_g", "SSE within 10% of the best (now {s}, best {b})."), { s: f2(sse), b: f2(sseLs) }), done: mode === "mine" && sse <= 1.1 * sseLs },
      hint: tx(t, "figRegL1_h", "Aim the line through the purple cross (x̄, ȳ) first, then tilt it until the squares above and below balance."),
      setup: () => go("positive", "mine"),
    },
    {
      title: tx(t, "figRegL2_t", "Turn to the bottom"),
      body: <>
        <p>{tx(t, "figRegL2_b1", "Now the line is flat, through the point of means. Its SSE is Syy, the total variation of y.")}</p>
        <p>{tx(t, "figRegL2_b2", "Press ▶: the line turns about (x̄, ȳ) and the dot in the corner slides down the parabola SSE(b). Where does it stop?")}</p>
      </>,
      goal: { text: fill(tx(t, "figRegL2_g", "Reach the best slope (now b = {b}, SSE = {s})."), { b: f2(b), s: f2(sse) }), done: mode === "ls" && turn >= 1 },
      focus: "play",
      setup: () => go("positive", "ls", 0),
    },
    {
      title: tx(t, "figRegL3_t", "Quick check"),
      body: <p>{tx(t, "figRegL3_b", "Setting ∂S/∂a = 0 gave the equation ȳ = a + b x̄.")}</p>,
      quiz: {
        q: tx(t, "figRegL3_q", "Which point does every least-squares line pass through?"),
        options: [tx(t, "figRegL3_o1", "the point of means (x̄, ȳ)"), tx(t, "figRegL3_o2", "the origin (0, 0)"), tx(t, "figRegL3_o3", "the first and the last data point"), tx(t, "figRegL3_o4", "the data point with the largest y")],
        answer: 0,
        why: tx(t, "figRegL3_w", "ȳ = a + b x̄ says exactly that the line's height at x̄ is ȳ. Drag any point and watch the cross: the line follows it."),
      },
    },
    {
      title: tx(t, "figRegL4_t", "r only sees lines"),
      body: <>
        <p>{tx(t, "figRegL4_b1", "Choose the \"curve\" data: y falls and then rises again, a clear pattern.")}</p>
        <p>{tx(t, "figRegL4_b2", "Read r and R². What does the best straight line look like?")}</p>
      </>,
      goal: { text: fill(tx(t, "figRegL4_g", "Show the curve (now r = {r})."), { r: f2(F.r, 3) }), done: preset === "curve" && mode === "ls" },
      setup: () => go("positive", "ls"),
    },
    {
      title: tx(t, "figRegL5_t", "One point drags the line"),
      body: <>
        <p>{tx(t, "figRegL5_b1", "Eight points rise neatly, but the last one sits far below them. Its big square pulls the line down.")}</p>
        <p>{tx(t, "figRegL5_b2", "Drag that point back into line with the others.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRegL5_g", "r ≥ 0.95 (now {r})."), { r: f2(F.r, 3) }), done: mode === "ls" && F.r >= 0.95 },
      hint: tx(t, "figRegL5_h", "The point at x = 9 belongs near y = 5.7, where the others are heading."),
      setup: () => go("outlier", "ls"),
    },
    {
      title: tx(t, "figRegL6_t", "Quick check"),
      body: <p>{tx(t, "figRegL6_b", "Across many towns, the correlation between the number of doctors and the number of illnesses reported is r = 0.8.")}</p>,
      quiz: {
        q: tx(t, "figRegL6_q", "What does R² tell you here?"),
        options: [tx(t, "figRegL6_o1", "64% of the variation in illnesses goes with the number of doctors"), tx(t, "figRegL6_o2", "doctors cause 80% of the illnesses"), tx(t, "figRegL6_o3", "80% of the points lie on the line"), tx(t, "figRegL6_o4", "the line is right 64% of the time")],
        answer: 0,
        why: tx(t, "figRegL6_w", "R² = r² = 0.64: the share of the variation of y that the line accounts for. It says nothing about causes: bigger towns simply have more of both, a confounder."),
      },
    },
    {
      title: tx(t, "figRegL7_t", "Quick check"),
      body: <p>{tx(t, "figRegL7_b", "Fathers' and sons' heights have r = 0.5. A father is 2 standard deviations above the average height.")}</p>,
      quiz: {
        q: tx(t, "figRegL7_q", "How far above average is his son predicted to be?"),
        options: [tx(t, "figRegL7_o1", "1 standard deviation"), tx(t, "figRegL7_o2", "2 standard deviations"), tx(t, "figRegL7_o3", "0.25 standard deviations"), tx(t, "figRegL7_o4", "4 standard deviations")],
        answer: 0,
        why: tx(t, "figRegL7_w", "In z-scores the line is ẑ_y = r · zₓ = 0.5 · 2 = 1: regression to the mean. The prediction is closer to average because part of the father's height was chance."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "curve", tone: "warn", when: preset === "curve",
      title: tx(t, "figRegI1_t", "A pattern r cannot see"),
      body: fill(tx(t, "figRegI1_b", "r = {r}, yet y clearly depends on x. The best straight line is nearly flat and R² is close to 0: always look at the scatter plot."), { r: f2(F.r, 3) }),
    },
    {
      id: "outlier", tone: "warn", when: preset === "outlier",
      title: tx(t, "figRegI2_t", "An influential point"),
      body: tx(t, "figRegI2_b", "Squaring makes big misses count a lot: one point far from the others has a huge square, and the line tilts to shrink it. Check whether such a point is a mistake before trusting the fit."),
    },
    {
      id: "close", tone: "ok", when: mode === "mine" && sse <= 1.1 * sseLs,
      title: tx(t, "figRegI3_t", "Almost least squares"),
      body: fill(tx(t, "figRegI3_b", "Your SSE {s} is within 10% of the best, {b}. Calculus finds the exact bottom in one step: b = Sxy/Sxx, a = ȳ − b x̄."), { s: f2(sse), b: f2(sseLs) }),
    },
    {
      id: "notYet", tone: "info", when: mode === "ls" && turn > 0 && turn < 1,
      title: tx(t, "figRegI4_t", "Still on the way down"),
      body: fill(tx(t, "figRegI4_b", "With slope {b} the squares add to {s}, {d} more than the best. Every line through (x̄, ȳ) has SSE = Syy − 2b·Sxy + b²·Sxx, a parabola in b."), { b: f2(b), s: f2(sse), d: f2(sse - sseLs) }),
    },
    {
      id: "flat", tone: "info", when: mode === "ls" && turn >= 1 && Math.abs(F.r) < 0.2 && preset !== "curve",
      title: tx(t, "figRegI5_t", "Almost no straight-line relation"),
      body: tx(t, "figRegI5_b", "r is near 0, so the best slope is near 0: knowing x barely improves the prediction ȳ, and R² is small."),
    },
  ];

  const title = tx(t, "figReg_title", "Least squares: fitting a line");
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
          tx(t, "figRegR1", "Least squares makes the total area of the squared residuals as small as possible."),
          tx(t, "figRegR2", "The best line passes through (x̄, ȳ); among those lines, SSE is a parabola in the slope with its bottom at b = Sxy/Sxx."),
          tx(t, "figRegR3", "r measures only straight-line association, and a single outlier can drag it and the line."),
          tx(t, "figRegR4", "R² = r² is the share of the variation of y explained; it says nothing about causes."),
          tx(t, "figRegR5", "In z-scores the prediction is r · zₓ: closer to the mean than x was."),
        ]}
      />
    </>
  );
}
