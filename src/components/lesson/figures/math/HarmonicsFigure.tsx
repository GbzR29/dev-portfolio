"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, Btn, C, T, plot, Grid, fnPath, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// harmonics — a square or sawtooth wave built by adding sines of 1, 2, 3 …
//             times the base frequency with shrinking amplitudes (a Fourier
//             series). The Transport adds one sine per step. More terms,
//             sharper corners.
// lissajous — x = sin(a·t), y = sin(b·t + φ): two oscillations at right
//             angles; the Transport runs t. Whole-number ratios a : b give
//             closed figures.
// damped    — A·e^(−λt)·sin(2πft): a sine whose amplitude decays
//             exponentially, the shape of a plucked string or a swing coming to rest.
// The lab: build a square wave, see the overshoot, draw a figure eight and a
// circle, then tune the damping.

type Mode = "harmonics" | "lissajous" | "damped";
type Shape = "square" | "saw";
const W = 560, H = 300;
const TAU = Math.PI * 2;
const MAX_TERMS = 40;
const DAMP_A = 1.1;
const n2 = (v: number) => (+v.toFixed(2)).toString();
const ph = plot({ W, H, x0: 0, x1: 2 * TAU, y0: -1.6, y1: 1.6 });
const pl = plot({ W, H, x0: -2.8, x1: 2.8, y0: -1.5, y1: 1.5 });
const pd = plot({ W, H, x0: 0, x1: 3, y0: -1.4, y1: 1.4 });

// Square: (4/π) Σ sin((2k−1)x)/(2k−1).  Sawtooth: (2/π) Σ (−1)^(k+1) sin(kx)/k.
const termOf = (shape: Shape, k: number, x: number) => shape === "square"
  ? (4 / Math.PI) * Math.sin((2 * k - 1) * x) / (2 * k - 1)
  : (2 / Math.PI) * (k % 2 ? 1 : -1) * Math.sin(k * x) / k;
function partialSum(shape: Shape, n: number, x: number) {
  let s = 0;
  for (let k = 1; k <= n; k++) s += termOf(shape, k, x);
  return s;
}
/** The highest point of the partial sum, sampled: shows the overshoot at the corners. */
function peakOf(shape: Shape, n: number) {
  let m = 0;
  for (let i = 1; i < 2000; i++) m = Math.max(m, partialSum(shape, n, (i / 2000) * Math.PI));
  return m;
}

// ── The drawings ──────────────────────────────────────────────────────────────

function HarmonicsDrawing({ shape, n }: { shape: Shape; n: number }) {
  const target = (x: number) => shape === "square" ? (Math.sin(x) >= 0 ? 1 : -1) : ((((x + Math.PI) % TAU) + TAU) % TAU) / Math.PI - 1;
  return <>
    <Grid p={ph} step={Math.PI / 2} labels={false} />
    <path d={fnPath(ph, target, 0, 2 * TAU, 1200)} fill="none" stroke={C.muted} strokeWidth={1.2} strokeDasharray="4 3" />
    {n <= 6 && Array.from({ length: n }, (_, i) => <path key={i} d={fnPath(ph, x => termOf(shape, i + 1, x), 0, 2 * TAU, 500)} fill="none" stroke={C.purple} strokeWidth={1} opacity={0.35} />)}
    <path d={fnPath(ph, x => partialSum(shape, n, x), 0, 2 * TAU, 1500)} fill="none" stroke={C.sky} strokeWidth={2.4} />
  </>;
}

function LissajousDrawing({ la, lb, lph, clock }: { la: number; lb: number; lph: number; clock: number }) {
  const L = 1.3;
  const path = Array.from({ length: 1201 }, (_, i) => { const s = (i / 1200) * TAU; return `${i ? "L" : "M"}${pl.X(L * Math.sin(la * s)).toFixed(1)},${pl.Y(L * Math.sin(lb * s + lph)).toFixed(1)}`; }).join("");
  const P = { x: L * Math.sin(la * clock * 0.4), y: L * Math.sin(lb * clock * 0.4 + lph) };
  return <>
    <Grid p={pl} step={0.5} labels={false} />
    <path d={path} fill="none" stroke={C.sky} strokeWidth={1.8} opacity={0.8} />
    <line x1={pl.X(P.x)} y1={pl.Y(-L - 0.1)} x2={pl.X(P.x)} y2={pl.Y(-L - 0.1) + 8} stroke={C.red} strokeWidth={3} />
    <line x1={pl.X(-L - 0.1)} y1={pl.Y(P.y)} x2={pl.X(-L - 0.1) - 8} y2={pl.Y(P.y)} stroke={C.green} strokeWidth={3} />
    <circle cx={pl.X(P.x)} cy={pl.Y(P.y)} r={6} fill={C.amber} />
  </>;
}

function DampedDrawing({ lam, fd, t }: { lam: number; fd: number; t?: TrackTranslations }) {
  const f = (x: number) => DAMP_A * Math.exp(-lam * x) * Math.sin(TAU * fd * x);
  const env = (x: number) => DAMP_A * Math.exp(-lam * x);
  const half = Math.log(2) / lam;
  return <>
    <Grid p={pd} step={0.25} major={1} labels={false} />
    {[1, 2].map(x => <T key={x} x={pd.X(x)} y={pd.Y(0) + 12} size={8.5} anchor="middle">{`${x} s`}</T>)}
    <path d={fnPath(pd, env)} fill="none" stroke={C.amber} strokeWidth={1.2} strokeDasharray="4 3" />
    <path d={fnPath(pd, x => -env(x))} fill="none" stroke={C.amber} strokeWidth={1.2} strokeDasharray="4 3" />
    <path d={fnPath(pd, f, 0, 3, 1200)} fill="none" stroke={C.sky} strokeWidth={2.2} />
    {half < 3 && <>
      <line x1={pd.X(half)} y1={pd.Y(env(half))} x2={pd.X(half)} y2={pd.Y(0)} stroke={C.pink} strokeWidth={1.2} />
      <T x={pd.X(half) + 4} y={pd.Y(env(half)) - 4} size={9.5} color={C.pink}>{tx(t, "figHar_halfA", "half amplitude")}</T>
    </>}
  </>;
}

export function HarmonicsFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("harmonics");
  const [shape, setShape] = useState<Shape>("square");
  const [n, setN] = useState(3);
  const [la, setLa] = useState(1), [lb, setLb] = useState(2), [lph, setLph] = useState(0);
  const [lam, setLam] = useState(1.2), [fd, setFd] = useState(3);
  const [clock, setClock] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-harmonics");
  const vis = useVisible<HTMLDivElement>();
  const awake = vis.on || lab.open;

  // Lissajous: time runs continuously
  useFrame(playing && mode === "lissajous" && awake, dt => setClock(c => (c + dt) % (TAU * 10)));
  // Harmonics: one more sine per tick, quickly once the shape is clear
  useEffect(() => {
    if (!playing || mode !== "harmonics" || !awake) return;
    if (n >= MAX_TERMS) { setPlaying(false); return; }
    const id = setTimeout(() => setN(n + 1), scaledMs(n < 8 ? 700 : 160, speed));
    return () => clearTimeout(id);
  }, [playing, mode, awake, n, speed]);

  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const setTerms = (v: number) => { setPlaying(false); setN(Math.max(1, Math.min(MAX_TERMS, v))); };
  const half = Math.log(2) / lam;
  const peak = mode === "harmonics" && shape === "square" ? peakOf("square", n) : 0;

  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {mode === "harmonics" ? <HarmonicsDrawing shape={shape} n={n} />
          : mode === "lissajous" ? <LissajousDrawing la={la} lb={lb} lph={lph} clock={clock} />
            : <DampedDrawing lam={lam} fd={fd} t={t} />}
      </svg>
      {mode === "harmonics" && (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (n >= MAX_TERMS) setN(1); setPlaying(true); }}
          playLabel={tx(t, "figHar_play", "add sines")}
          onStep={n < MAX_TERMS ? () => setTerms(n + 1) : undefined}
          onBack={n > 1 ? () => setTerms(n - 1) : undefined}
          onReset={() => setTerms(1)}
          readout={fill(tx(t, "figHar_count", "{n} sines"), { n })} />
      )}
      {mode === "lissajous" && (
        <Transport t={t} playing={playing}
          onPlay={() => setPlaying(v => !v)}
          playLabel={tx(t, "figHar_playL", "run time")}
          onReset={() => { setPlaying(false); setClock(0); }}
          readout={`${la} : ${lb}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["harmonics", tx(t, "figHar_mHarm", "harmonics")],
    ["lissajous", tx(t, "figHar_mLiss", "Lissajous")],
    ["damped", tx(t, "figHar_mDamp", "damped")],
  ] as const} />;
  const terms = shape === "square" ? "sin x + sin 3x/3 + sin 5x/5 + …" : "sin x − sin 2x/2 + sin 3x/3 − …";
  const controls = mode === "harmonics" ? <>
    <Row>
      <Btn active={shape === "square"} onClick={() => setShape("square")}>{tx(t, "figHar_square", "square")}</Btn>
      <Btn active={shape === "saw"} onClick={() => setShape("saw")}>{tx(t, "figHar_saw", "sawtooth")}</Btn>
    </Row>
    <Slider label={tx(t, "figHar_terms", "sines added")} value={n} min={1} max={MAX_TERMS} step={1} onChange={setTerms} fmt={String} width="w-24" />
    <Row><Readout color={C.sky}>{`${shape === "square" ? "4/π" : "2/π"} · (${terms})`}</Readout></Row>
  </> : mode === "lissajous" ? <>
    <Sliders>
      <Slider label="a" value={la} min={1} max={6} step={1} onChange={setLa} fmt={String} width="w-6" />
      <Slider label="b" value={lb} min={1} max={6} step={1} onChange={setLb} fmt={String} width="w-6" />
      <Slider label="φ" value={lph} min={0} max={Math.PI} step={0.01} onChange={setLph} fmt={v => `${n2(v / Math.PI)}π`} width="w-6" />
    </Sliders>
    <Row><Readout color={C.sky}>{`x = sin(${la}t), y = sin(${lb}t + ${n2(lph / Math.PI)}π)`}</Readout></Row>
  </> : <>
    <Sliders>
      <Slider label={tx(t, "figHar_decay", "decay λ")} value={lam} min={0} max={4} step={0.05} onChange={setLam} fmt={v => `${n2(v)}/s`} />
      <Slider label={tx(t, "figHar_freq", "frequency f")} value={fd} min={0.5} max={8} step={0.25} onChange={setFd} fmt={v => `${n2(v)} Hz`} />
    </Sliders>
    <Row>
      <Readout color={C.sky}>{`y = ${DAMP_A} · e^(−${n2(lam)}t) · sin(2π · ${n2(fd)} t)`}</Readout>
      <Readout color={C.pink}>{`${tx(t, "figHar_halfLife", "half-life")} ln 2 / λ = ${lam > 0 ? n2(half) + " s" : "∞"}`}</Readout>
    </Row>
  </>;
  const note = mode === "harmonics"
    ? tx(t, "figHar_noteH2", "The dashed line is the target shape; the blue curve is the sum of the first few sines (the faint purple ones are the individual terms). Press play or step to add one sine at a time. Each extra sine has a higher frequency and a smaller amplitude and fixes finer detail. With one term it is just a sine; with forty, the corners are sharp, apart from a small overshoot that never goes away (the Gibbs phenomenon). Fourier showed that practically any repeating signal can be built this way, which is how audio compression and equalisers think about sound.")
    : mode === "lissajous"
      ? tx(t, "figHar_noteL", "The amber point moves left and right as sin(a·t) (red tick) and up and down as sin(b·t + φ) (green tick), two independent oscillations at right angles. Its path is a Lissajous figure. When a : b is a ratio of whole numbers the path closes; a = b gives an ellipse (or a line, or a circle when φ = π/2), and 1 : 2 gives a figure eight. An oscilloscope draws exactly these when it compares two electrical signals.")
      : tx(t, "figHar_noteD", "Multiply a sine by a shrinking exponential (the exponents chapter's e^(−λt)) and the wave dies away inside the dashed envelope. λ sets how fast: the amplitude halves every ln 2 / λ seconds. With λ = 0 it rings forever. This is the shape of a plucked string, a door spring settling and a car's suspension after a bump: a big jolt that quickly calms down.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figHarL1_t", "Build a square wave"),
      body: <>
        <p>{tx(t, "figHarL1_b1", "Only odd sines: sin x, then sin 3x/3, then sin 5x/5… Each one is faster and smaller.")}</p>
        <p>{tx(t, "figHarL1_b2", "Add sines one at a time until the corners start to look square.")}</p>
      </>,
      goal: { text: tx(t, "figHarL1_g", "At least 5 sines."), done: mode === "harmonics" && shape === "square" && n >= 5 },
      focus: "step",
      setup: () => { pick("harmonics"); setShape("square"); setN(1); },
    },
    {
      title: tx(t, "figHarL2_t", "Quick check"),
      body: <p>{tx(t, "figHarL2_b", "The pattern: odd multiples of x, divided by the same number.")}</p>,
      quiz: {
        q: tx(t, "figHarL2_q", "Which term comes after sin x + sin 3x/3 + sin 5x/5?"),
        options: ["sin 7x / 7", "sin 6x / 6", "sin 7x / 49", "7 sin x"],
        answer: 0,
        why: tx(t, "figHarL2_w", "The square wave uses only odd harmonics, each with amplitude 1/k: next is k = 7."),
      },
    },
    {
      title: tx(t, "figHarL3_t", "The overshoot that stays"),
      body: <p>{tx(t, "figHarL3_b", "Keep adding. The flat parts get flatter, but next to each jump the sum overshoots. Play until there are 30 sines or more and watch that bump.")}</p>,
      goal: { text: tx(t, "figHarL3_g", "30 sines or more."), done: mode === "harmonics" && n >= 30 },
      focus: "play",
    },
    {
      title: tx(t, "figHarL4_t", "A figure eight"),
      body: <>
        <p>{tx(t, "figHarL4_b1", "Now x and y oscillate separately: x = sin(at), y = sin(bt + φ).")}</p>
        <p>{tx(t, "figHarL4_b2", "Make y go twice as fast as x.")}</p>
      </>,
      goal: { text: tx(t, "figHarL4_g", "a : b = 1 : 2 with φ = 0."), done: mode === "lissajous" && la * 2 === lb && lph < 0.01 },
      hint: tx(t, "figHarL4_h", "a = 1 and b = 2 (or 2 and 4, or 3 and 6)."),
      setup: () => { pick("lissajous"); setLa(1); setLb(1); setLph(0); },
    },
    {
      title: tx(t, "figHarL5_t", "A circle"),
      body: <p>{tx(t, "figHarL5_b", "With a = b the path is an ellipse. Give y a quarter cycle of head start and it becomes the unit circle: (sin, cos) again.")}</p>,
      goal: { text: tx(t, "figHarL5_g", "a = b and φ = π/2."), done: mode === "lissajous" && la === lb && Math.abs(lph - Math.PI / 2) < 0.02 },
      hint: tx(t, "figHarL5_h", "φ = 0.50π on the slider."),
    },
    {
      title: tx(t, "figHarL6_t", "Damping"),
      body: <>
        <p>{tx(t, "figHarL6_b1", "Multiplying by e^(−λt) shrinks the wave by the same fraction every second. The amplitude halves every ln 2 / λ seconds.")}</p>
        <p>{tx(t, "figHarL6_b2", "Set the damping so the amplitude halves every half second.")}</p>
      </>,
      goal: { text: tx(t, "figHarL6_g", "Half-life = 0.5 s (within 0.02 s)."), done: mode === "damped" && Math.abs(half - 0.5) < 0.02 },
      hint: tx(t, "figHarL6_h", "λ = ln 2 / 0.5 ≈ 1.39."),
      setup: () => { pick("damped"); setLam(0.5); setFd(3); },
    },
    {
      title: tx(t, "figHarL7_t", "Quick check"),
      body: <p>{tx(t, "figHarL7_b", "e^(−λt) with λ = 0 is e⁰ = 1 for every t.")}</p>,
      quiz: {
        q: tx(t, "figHarL7_q", "What happens with λ = 0?"),
        options: [tx(t, "figHarL7_o1", "it rings forever at full height"), tx(t, "figHarL7_o2", "it stops at once"), tx(t, "figHarL7_o3", "it grows without limit"), tx(t, "figHarL7_o4", "its frequency drops")],
        answer: 0,
        why: tx(t, "figHarL7_w", "The envelope stays at 1, so nothing shrinks: a perfect, frictionless oscillation. A negative λ would make it grow."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "one", tone: "info", when: mode === "harmonics" && n === 1,
      title: tx(t, "figHarI1_t", "Just a sine"),
      body: tx(t, "figHarI1_b", "One term is the base frequency alone. Every extra harmonic corrects the shape a little more."),
    },
    {
      id: "gibbs", tone: "warn", when: mode === "harmonics" && shape === "square" && n >= 20,
      title: tx(t, "figHarI2_t", "Gibbs overshoot"),
      body: fill(tx(t, "figHarI2_b", "The peak is {peak} instead of 1. More sines squeeze the bump closer to the jump, but it never shrinks below about 9% of the jump's height."), { peak: peak.toFixed(3) }),
    },
    {
      id: "ellipse", tone: "ok", when: mode === "lissajous" && la === lb,
      title: tx(t, "figHarI3_t", "Equal speeds"),
      body: tx(t, "figHarI3_b", "With a = b both motions share one rhythm: the path is a line (φ = 0), an ellipse, or the circle at φ = π/2."),
    },
    {
      id: "ring", tone: "info", when: mode === "damped" && lam === 0,
      title: tx(t, "figHarI4_t", "No damping"),
      body: tx(t, "figHarI4_b", "λ = 0: the envelope is flat at 1 and the wave rings forever. Real swings always lose a little energy."),
    },
  ];

  const title = tx(t, "figHar_title", "Combining waves");
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
          tx(t, "figHarR1", "Adding harmonics with the right amplitudes builds square and sawtooth waves: a Fourier series."),
          tx(t, "figHarR2", "Near a jump the sum always overshoots by about 9%, however many sines are added."),
          tx(t, "figHarR3", "Two oscillations at right angles trace Lissajous figures; whole-number ratios close up."),
          tx(t, "figHarR4", "A e^(−λt) sin(…) dies away; the amplitude halves every ln 2 / λ seconds."),
        ]}
      />
    </>
  );
}
