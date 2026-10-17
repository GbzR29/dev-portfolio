"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T, plot, Grid, fnPath, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { MAX_N, PRESETS, coefs, fOf, meanSqError, partial, type Preset } from "./fourier/fourierModel";

// ── What this figure shows ────────────────────────────────────────────────────
// project — one coefficient at a time. The function f (blue) is multiplied by
//           sin(nx) or cos(nx) (purple); the product (amber) is shaded green
//           where it is positive and red where negative. (1/π) times the net
//           shaded area is the coefficient b_n or a_n: how much of that wave
//           f contains. Odd functions give 0 for every cosine, even functions
//           for every sine.
// build   — the partial sum a₀/2 + Σ (a_n cos nx + b_n sin nx) over two
//           periods, one more term per Transport step. "Break it: drop the
//           cosines" keeps only the sine terms, which is wrong for a function
//           that is not odd.
// Under both: the spectrum, a_n (amber) and b_n (purple) for n = 0 … 12.

type Mode = "project" | "build";
type Kind = "sin" | "cos";
const W = 560, H = 230, HS = 104, SHOW = 12;
const PI = Math.PI;
const pp = plot({ W, H, x0: -PI - 0.2, x1: PI + 0.2, y0: -1.45, y1: 1.45 });
const pb = plot({ W, H, x0: -2 * PI - 0.2, x1: 2 * PI + 0.2, y0: -1.45, y1: 1.45 });
const n3 = (v: number) => (Math.abs(v) < 5e-4 ? "0" : (+v.toFixed(3)).toString().replace("-", "−"));

/** Closed path between the curve g and the x-axis, for shading signed area. */
function areaPath(p: Plot, g: (x: number) => number, a: number, b: number, n = 400) {
  let d = `M${p.X(a).toFixed(1)},${p.Y(0).toFixed(1)}`;
  for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; d += `L${p.X(x).toFixed(1)},${p.Y(g(x)).toFixed(1)}`; }
  return `${d}L${p.X(b).toFixed(1)},${p.Y(0).toFixed(1)}Z`;
}

function PiTicks({ p, k }: { p: Plot; k: number }) {
  const lab = (i: number) => (i === 0 ? "0" : `${i < 0 ? "−" : ""}${Math.abs(i) === 1 ? "" : Math.abs(i)}π`);
  return <>{Array.from({ length: 2 * k + 1 }, (_, i) => i - k).map(i =>
    <T key={i} x={p.X(i * PI)} y={p.Y(0) + 13} size={9} anchor="middle">{lab(i)}</T>)}</>;
}

function ProjectDrawing({ preset, kind, n }: { preset: Preset; kind: Kind; n: number }) {
  const f = fOf(preset);
  const phi = (x: number) => (kind === "sin" ? Math.sin(n * x) : Math.cos(n * x));
  const prod = (x: number) => f(x) * phi(x);
  return <>
    <Grid p={pp} step={PI / 2} labels={false} />
    <PiTicks p={pp} k={1} />
    <path d={areaPath(pp, x => Math.max(0, prod(x)), -PI, PI)} fill={C.green} opacity={0.22} />
    <path d={areaPath(pp, x => Math.min(0, prod(x)), -PI, PI)} fill={C.red} opacity={0.22} />
    <path d={fnPath(pp, phi, -PI, PI, 600)} fill="none" stroke={C.purple} strokeWidth={1.4} opacity={0.75} />
    <path d={fnPath(pp, f, -PI, PI, 1200)} fill="none" stroke={C.sky} strokeWidth={2.2} />
    <path d={fnPath(pp, prod, -PI, PI, 1200)} fill="none" stroke={C.amber} strokeWidth={1.6} />
    <T x={10} y={16} size={10.5} color={C.sky} bold>f(x)</T>
    <T x={52} y={16} size={10.5} color={C.purple} bold>{`${kind} ${n === 1 ? "" : n}x`}</T>
    <T x={122} y={16} size={10.5} color={C.amber} bold>{`f(x) · ${kind} ${n === 1 ? "" : n}x`}</T>
  </>;
}

function BuildDrawing({ preset, N, cos }: { preset: Preset; N: number; cos: boolean }) {
  const f = fOf(preset), c = coefs(preset);
  return <>
    <Grid p={pb} step={PI / 2} labels={false} />
    <PiTicks p={pb} k={2} />
    <path d={fnPath(pb, f, pb.x0, pb.x1, 1600)} fill="none" stroke={C.muted} strokeWidth={1.3} strokeDasharray="4 3" />
    <path d={fnPath(pb, x => partial(c, N, x, cos), pb.x0, pb.x1, 1600)} fill="none" stroke={cos ? C.sky : C.red} strokeWidth={2.3} />
  </>;
}

/** a_n and b_n as paired bars; `upTo` fades the terms not yet added, `mark` rings one bar. */
function Spectrum({ preset, upTo, cos, mark, t }: { preset: Preset; upTo: number; cos: boolean; mark?: [Kind, number]; t?: TrackTranslations }) {
  const c = coefs(preset);
  const x0 = 36, dx = (W - x0 - 14) / (SHOW + 1), mid = HS / 2 + 4, s = (HS / 2 - 14) / 1.3;
  return (
    <svg viewBox={`0 0 ${W} ${HS}`} className="w-full h-auto" style={{ borderTop: "1px solid var(--border)" }}>
      <line x1={x0 - 6} y1={mid} x2={W - 8} y2={mid} stroke={C.axis} strokeWidth={1} />
      <T x={6} y={14} size={9.5} color={C.amber} bold>aₙ</T>
      <T x={6} y={27} size={9.5} color={C.purple} bold>bₙ</T>
      {Array.from({ length: SHOW + 1 }, (_, k) => {
        const cx = x0 + dx * (k + 0.5), on = k <= upTo;
        const bar = (v: number, off: number, col: string, kind: Kind, dropped: boolean) => {
          const h = v * s, ringed = mark && mark[0] === kind && mark[1] === k;
          return (
            <g key={kind}>
              <rect x={cx + off - 5} y={Math.min(mid, mid - h)} width={10} height={Math.max(1, Math.abs(h))}
                fill={col} opacity={dropped ? 0.12 : on ? 0.9 : 0.25} stroke={dropped && Math.abs(v) > 1e-3 ? C.red : "none"} strokeDasharray="2 2" />
              {ringed && <rect x={cx + off - 8} y={Math.min(mid, mid - h) - 3} width={16} height={Math.max(1, Math.abs(h)) + 6} fill="none" stroke={C.fg} strokeWidth={1.3} rx={3} />}
            </g>
          );
        };
        return (
          <g key={k}>
            {bar(c.a[k], -6, C.amber, "cos", !cos)}
            {k > 0 && bar(c.b[k], 6, C.purple, "sin", false)}
            <T x={cx} y={HS - 4} size={9} anchor="middle">{k}</T>
          </g>
        );
      })}
      <T x={W - 10} y={14} size={9} anchor="end">{tx(t, "figFou_spec", "spectrum: how much of each wave")}</T>
    </svg>
  );
}

export function FourierFigure({ t }: { t?: TrackTranslations }) {
  const [preset, setPreset] = useState<Preset>("square");
  const [mode, setMode] = useState<Mode>("project");
  const [kind, setKind] = useState<Kind>("sin");
  const [n, setNRaw] = useState(1);
  const [N, setNBuild] = useState(1);
  const [cos, setCos] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-fourier");
  const c = coefs(preset);

  // Build: one more term per tick, quickly once the shape is clear
  useEffect(() => {
    if (!playing || mode !== "build") return;
    if (N >= MAX_N) { setPlaying(false); return; }
    const id = setTimeout(() => setNBuild(N + 1), scaledMs(N < 8 ? 650 : 150, speed));
    return () => clearTimeout(id);
  }, [playing, mode, N, speed]);
  // Project: walk through n = 0 … 12
  useEffect(() => {
    if (!playing || mode !== "project") return;
    if (n >= SHOW) { setPlaying(false); return; }
    const id = setTimeout(() => setNRaw(n + 1), scaledMs(900, speed));
    return () => clearTimeout(id);
  }, [playing, mode, n, speed]);

  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const setN = (v: number) => { setPlaying(false); setNRaw(Math.max(kind === "sin" ? 1 : 0, Math.min(SHOW, v))); };
  const setTerms = (v: number) => { setPlaying(false); setNBuild(Math.max(1, Math.min(MAX_N, v))); };
  const pickKind = (k: Kind) => { setKind(k); if (k === "sin" && n === 0) setNRaw(1); };
  const coef = kind === "sin" ? c.b[n] : c.a[n];
  const err = mode === "build" ? meanSqError(preset, N, cos) : 0;
  const errFull = mode === "build" ? meanSqError(preset, N, true) : 0;
  const isOdd = c.a.every(v => v === 0), isEven = c.b.every(v => v === 0);

  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {mode === "project" ? <ProjectDrawing preset={preset} kind={kind} n={n} /> : <BuildDrawing preset={preset} N={N} cos={cos} />}
      </svg>
      <Spectrum preset={preset} upTo={mode === "build" ? N : SHOW} cos={mode === "project" || cos} mark={mode === "project" ? [kind, n] : undefined} t={t} />
      {mode === "build" ? (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (N >= MAX_N) setNBuild(1); setPlaying(true); }}
          playLabel={tx(t, "figFou_playB", "add terms")}
          onStep={N < MAX_N ? () => setTerms(N + 1) : undefined}
          onBack={N > 1 ? () => setTerms(N - 1) : undefined}
          onReset={() => setTerms(1)}
          readout={fill(tx(t, "figFou_upTo", "n up to {n}"), { n: N })} />
      ) : (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (n >= SHOW) setNRaw(kind === "sin" ? 1 : 0); setPlaying(true); }}
          playLabel={tx(t, "figFou_playP", "next n")}
          onStep={n < SHOW ? () => setN(n + 1) : undefined}
          onBack={n > (kind === "sin" ? 1 : 0) ? () => setN(n - 1) : undefined}
          onReset={() => setN(kind === "sin" ? 1 : 0)}
          readout={`n = ${n}`} />
      )}
    </div>
  );

  const name: Record<Preset, string> = {
    square: tx(t, "figFou_square", "square"),
    saw: tx(t, "figFou_saw", "sawtooth"),
    triangle: tx(t, "figFou_triangle", "triangle"),
    halfwave: tx(t, "figFou_half", "half sine"),
    pulse: tx(t, "figFou_pulse", "pulse"),
  };
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["project", tx(t, "figFou_mProject", "find a coefficient")],
    ["build", tx(t, "figFou_mBuild", "add them up")],
  ] as const} />;
  const controls = <>
    <div className="flex items-center gap-1.5" style={{ flexWrap: "wrap" }}>{PRESETS.map(p => <Btn key={p} active={preset === p} onClick={() => setPreset(p)}>{name[p]}</Btn>)}</div>
    {mode === "project" ? <>
      <Row>
        <Btn active={kind === "sin"} onClick={() => pickKind("sin")}>sin nx</Btn>
        <Btn active={kind === "cos"} onClick={() => pickKind("cos")}>cos nx</Btn>
        <Slider label="n" value={n} min={kind === "sin" ? 1 : 0} max={SHOW} step={1} onChange={setN} fmt={String} width="w-24" />
      </Row>
      <Row>
        <Readout color={C.amber}>{`${kind === "sin" ? "b" : "a"}${n} = (1/π) ∫ f(x) ${kind} ${n === 1 ? "" : n}x dx = ${n3(coef)}`}</Readout>
        <Readout color={coef === 0 ? C.muted : C.green}>{coef === 0 ? tx(t, "figFou_cancel", "green and red cancel exactly") : tx(t, "figFou_net", "net area ≠ 0: f contains this wave")}</Readout>
      </Row>
    </> : <>
      <Row>
        <Slider label={tx(t, "figFou_terms", "terms N")} value={N} min={1} max={MAX_N} step={1} onChange={setTerms} fmt={String} width="w-24" />
        <Btn active={!cos} onClick={() => setCos(v => !v)}>{tx(t, "figFou_break", "break it: drop the cosines")}</Btn>
      </Row>
      <Row>
        <Readout color={cos ? C.sky : C.red}>{fill(tx(t, "figFou_err", "mean squared error {e}"), { e: err.toFixed(4) })}</Readout>
        {!cos && <Readout color={C.muted}>{fill(tx(t, "figFou_errFull", "with the cosines: {e}"), { e: errFull.toFixed(4) })}</Readout>}
      </Row>
    </>}
  </>;
  const note = mode === "project"
    ? tx(t, "figFou_noteP", "Multiply the function by one sine or cosine and look at the product: green where it is above the axis, red where it is below. The coefficient is the net area divided by π. When f and the wave rise and fall together the green wins and the coefficient is large; when they have nothing in common the green and red cancel exactly and the coefficient is 0. The bars below show every coefficient at once: the spectrum.")
    : tx(t, "figFou_noteB", "The dashed line is the function, repeated every 2π; the blue curve adds the first N terms of its series. Each new term has a higher frequency and fixes finer detail. Jumps (square, sawtooth, pulse) keep a small overshoot beside them and converge slowly; the triangle and the half sine have no jumps and are matched almost at once. Break it: dropping the cosines is fine for an odd function, but not for one that is not.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figFouL1_t", "Measure one wave"),
      body: <>
        <p>{tx(t, "figFouL1_b1", "The square wave times sin x is positive everywhere: both are negative on the left and positive on the right. All green, no red.")}</p>
        <p>{tx(t, "figFouL1_b2", "Read b₁, then step to n = 2.")}</p>
      </>,
      goal: { text: tx(t, "figFouL1_g", "Square wave, sin nx, n = 2."), done: preset === "square" && mode === "project" && kind === "sin" && n === 2 },
      focus: "step",
      setup: () => { setPreset("square"); pick("project"); setKind("sin"); setNRaw(1); },
    },
    {
      title: tx(t, "figFouL2_t", "Quick check"),
      body: <p>{tx(t, "figFouL2_b", "With n = 2 the green and red have equal size. The same happens for n = 4, 6, 8…")}</p>,
      quiz: {
        q: tx(t, "figFouL2_q", "Which sines does the square wave contain?"),
        options: [tx(t, "figFouL2_o1", "only the odd ones: sin x, sin 3x, sin 5x …"), tx(t, "figFouL2_o2", "only the even ones"), tx(t, "figFouL2_o3", "all of them, equally"), tx(t, "figFouL2_o4", "only sin x")],
        answer: 0,
        why: tx(t, "figFouL2_w", "b_n = 4/(nπ) for odd n and 0 for even n: 4/π ≈ 1.273, then 4/(3π) ≈ 0.424, 4/(5π) ≈ 0.255…"),
      },
    },
    {
      title: tx(t, "figFouL3_t", "No cosines at all"),
      body: <p>{tx(t, "figFouL3_b", "Switch to cos nx. The square wave is odd (f(−x) = −f(x)) and every cosine is even, so their product is odd: whatever is green on one side is red on the other. Check a few n.")}</p>,
      goal: { text: tx(t, "figFouL3_g", "Square wave, cos nx with n ≥ 3: still 0."), done: preset === "square" && mode === "project" && kind === "cos" && n >= 3 },
    },
    {
      title: tx(t, "figFouL4_t", "Add them up"),
      body: <p>{tx(t, "figFouL4_b", "Switch to \"add them up\" and the triangle wave. Add terms one at a time and compare with the square: the triangle has no jumps, so its coefficients shrink like 1/n² instead of 1/n.")}</p>,
      goal: { text: tx(t, "figFouL4_g", "Triangle, N ≥ 5, error below 0.0005."), done: preset === "triangle" && mode === "build" && N >= 5 && err < 5e-4 },
      setup: () => { setPreset("triangle"); pick("build"); setNBuild(1); setCos(true); },
      focus: "step",
    },
    {
      title: tx(t, "figFouL5_t", "Break it"),
      body: <p>{tx(t, "figFouL5_b", "Choose the half sine, which is neither odd nor even. Turn on \"drop the cosines\". The curve no longer matches, however many terms you add: the missing a₀ and aₙ carry part of the function.")}</p>,
      goal: { text: tx(t, "figFouL5_g", "Half sine without cosines, N ≥ 10."), done: preset === "halfwave" && mode === "build" && !cos && N >= 10 },
      setup: () => { setPreset("halfwave"); pick("build"); setNBuild(4); setCos(true); },
    },
    {
      title: tx(t, "figFouL6_t", "Quick check"),
      body: <p>{tx(t, "figFouL6_b", "The first term of the series is a₀/2, and a₀ = (1/π) ∫ f(x) dx over a period of length 2π.")}</p>,
      quiz: {
        q: tx(t, "figFouL6_q", "What does a₀/2 measure?"),
        options: [tx(t, "figFouL6_o1", "the average height of f over one period"), tx(t, "figFouL6_o2", "the highest value of f"), tx(t, "figFouL6_o3", "the period"), tx(t, "figFouL6_o4", "the slope of f at 0")],
        answer: 0,
        why: tx(t, "figFouL6_w", "a₀/2 = (1/2π) ∫ f dx: the integral divided by the length of the period, which is the mean value. The half sine's average is 1/π ≈ 0.318."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "odd", tone: "info", when: mode === "project" && kind === "cos" && isOdd,
      title: tx(t, "figFouI1_t", "An odd function"),
      body: tx(t, "figFouI1_b", "f(−x) = −f(x): times an even cosine the product is odd, and its area over [−π, π] is 0. Odd functions are pure sine series."),
    },
    {
      id: "even", tone: "info", when: mode === "project" && kind === "sin" && isEven,
      title: tx(t, "figFouI2_t", "An even function"),
      body: tx(t, "figFouI2_b", "f(−x) = f(x): every sine coefficient is 0. Even functions are pure cosine series."),
    },
    {
      id: "drop", tone: "warn", when: mode === "build" && !cos && !isOdd,
      title: tx(t, "figFouI3_t", "Missing terms"),
      body: fill(tx(t, "figFouI3_b", "This function has cosine terms, so a sine series alone cannot match it: the error stays near {e} instead of falling."), { e: err.toFixed(3) }),
    },
    {
      id: "gibbs", tone: "info", when: mode === "build" && cos && N >= 20 && (preset === "square" || preset === "saw" || preset === "pulse"),
      title: tx(t, "figFouI4_t", "The overshoot stays"),
      body: tx(t, "figFouI4_b", "Beside a jump the sum overshoots by about 9% of the jump, however many terms you add (the Gibbs phenomenon). The area of the bump shrinks, so the error still goes to 0."),
    },
  ];

  const title = tx(t, "figFou_title", "Fourier coefficients: measure, then rebuild");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<>{modeChoice}<LabButton lab={lab} t={t} /></>} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figFouR1", "A coefficient is an average of f times one wave: (1/π) ∫ f(x) sin(nx) dx is the net signed area."),
          tx(t, "figFouR2", "Waves that f does not contain give 0: odd functions have no cosines, even functions no sines."),
          tx(t, "figFouR3", "Adding the terms rebuilds f; smooth functions converge fast, jumps slowly and with an overshoot."),
          tx(t, "figFouR4", "a₀/2 is the average of f; a function that is neither odd nor even needs both families."),
        ]}
      />
    </>
  );
}
