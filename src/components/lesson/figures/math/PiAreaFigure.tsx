"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, plot, useRaf, useRerender, mulberry32, lerp } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Why the area of a circle is πr²:
// pizza — cut the circle into n equal slices and lay them in a row, points
//         alternately up and down. The row is about r tall and half the
//         circumference (πr) long; with more slices it becomes a rectangle
//         of area πr · r. The Transport plays the rearrangement.
// darts — throw random points at a 2 × 2 square with a circle of radius 1
//         inside. The share that lands in the circle approaches π/4 (circle
//         area over square area), so 4 × inside / total estimates π. The
//         Transport rains darts (play) or throws 100 at a time (step).
// The lab: rearrange the slices, then estimate π with darts.

type Mode = "pizza" | "darts";
type Darts = { xs: number[]; ys: number[]; inside: number; rng: () => number };
const W = 560, H = 300;
const TAU = Math.PI * 2;
const R = 2;
const MAX_DARTS = 20000;
const pz = plot({ W, H, x0: -1.3, x1: 7.6, y0: -1.3, y1: 3.469 });
const pd = plot({ W, H, x0: -2.867, x1: 2.867, y0: -1.536, y1: 1.536 });
const fresh = (seed: number): Darts => ({ xs: [], ys: [], inside: 0, rng: mulberry32(seed) });

/** Shortest signed turn from angle a to angle b. */
const turnTo = (a: number, b: number) => ((b - a + 3 * Math.PI) % TAU) - Math.PI;

/** Where each slice starts (in the circle) and ends (in the row). */
function makeSlices(n: number) {
  const s = (TAU * R) / n, half = n / 2, out: { a0: number; ax: number; ay: number; phi: number; top: boolean }[] = [];
  for (let q = 0; q < half; q++) {
    // Top half, left to right: crust up, point down on the base line
    out.push({ a0: Math.PI - (q + 0.5) * (TAU / n), ax: (q + 1) * s, ay: 0, phi: Math.PI / 2, top: true });
    // Bottom half, left to right: crust down, point up at height r
    out.push({ a0: Math.PI + (q + 0.5) * (TAU / n), ax: (q + 0.5) * s, ay: R, phi: -Math.PI / 2, top: false });
  }
  return out;
}

// ── The drawings ──────────────────────────────────────────────────────────────

function PizzaDrawing({ n, k, t }: { n: number; k: number; t?: TrackTranslations }) {
  const slices = useMemo(() => makeSlices(n), [n]);
  const h = Math.PI / n, cx = Math.PI, cy = 1;
  return <>
    <line x1={pz.X(-1.3)} y1={pz.Y(0)} x2={pz.X(7.6)} y2={pz.Y(0)} stroke={C.grid} strokeWidth={1} />
    {slices.map((sl, i) => {
      const ax = lerp(cx, sl.ax, k), ay = lerp(cy, sl.ay, k);
      const phi = sl.a0 + turnTo(sl.a0, sl.phi) * k;
      let d = `M${pz.X(ax)},${pz.Y(ay)}`;
      for (let j = 0; j <= 12; j++) {
        const a = phi - h + (2 * h * j) / 12;
        d += `L${pz.X(ax + R * Math.cos(a))},${pz.Y(ay + R * Math.sin(a))}`;
      }
      return <path key={i} d={d + "Z"} fill={sl.top ? C.amber : C.sky} fillOpacity={0.4} stroke={sl.top ? C.amber : C.sky} strokeWidth={1.3} strokeLinejoin="round" />;
    })}
    {k > 0.97 && <>
      <line x1={pz.X(0)} y1={pz.Y(-0.45)} x2={pz.X(Math.PI * R)} y2={pz.Y(-0.45)} stroke={C.pink} strokeWidth={1.4} />
      <T x={pz.X(Math.PI)} y={pz.Y(-0.45) + 14} size={10.5} anchor="middle" color={C.pink} bold>{tx(t, "figPiA_half", "half the crust = πr")}</T>
      <line x1={pz.X(-0.35)} y1={pz.Y(0)} x2={pz.X(-0.35)} y2={pz.Y(R)} stroke={C.green} strokeWidth={1.4} />
      <T x={pz.X(-0.45)} y={pz.Y(1) + 4} size={10.5} anchor="end" color={C.green} bold>r</T>
    </>}
  </>;
}

function DartsDrawing({ d, t }: { d: Darts; t?: TrackTranslations }) {
  const total = d.xs.length;
  const est = total ? (4 * d.inside) / total : 0;
  let inP = "", outP = "";
  for (let i = 0; i < total; i++) {
    const x = pd.X(d.xs[i]).toFixed(1), y = pd.Y(d.ys[i]).toFixed(1);
    const dot = `M${x},${y}h2.4v2.4h-2.4z`;
    if (d.xs[i] * d.xs[i] + d.ys[i] * d.ys[i] <= 1) inP += dot; else outP += dot;
  }
  return <>
    <rect x={pd.X(-1)} y={pd.Y(1)} width={2 * pd.sx} height={2 * pd.sx} fill="none" stroke={C.fg} strokeWidth={1.6} />
    <path d={outP} fill={C.pink} />
    <path d={inP} fill={C.sky} />
    <circle cx={pd.X(0)} cy={pd.Y(0)} r={pd.sx} fill="none" stroke={C.fg} strokeWidth={1.6} />
    <T x={pd.X(1.12)} y={pd.Y(0.9)} size={10} color={C.muted}>{tx(t, "figPiA_sq", "square: 2 × 2 = 4")}</T>
    <T x={pd.X(1.12)} y={pd.Y(0.9) + 15} size={10} color={C.muted}>{tx(t, "figPiA_circ", "circle: π · 1² = π")}</T>
    <T x={pd.X(1.12)} y={pd.Y(0.9) + 30} size={10} color={C.muted}>{tx(t, "figPiA_share", "share inside → π/4")}</T>
    <T x={pd.X(-2.8)} y={pd.Y(0.9)} size={12} color={C.fg} bold>{`π ≈ ${est.toFixed(4)}`}</T>
    <T x={pd.X(-2.8)} y={pd.Y(0.9) + 16} size={9.5} color={C.muted}>{`${tx(t, "figPiA_err", "error")} ${total ? Math.abs(est - Math.PI).toFixed(4) : "–"}`}</T>
  </>;
}

export function PiAreaFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("pizza");
  const [n, setN] = useState(8);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const darts = useRef<Darts>(fresh(7));
  const rerender = useRerender();
  const lab = useLab("math-pi-area");

  const throwDarts = (count: number) => {
    const d = darts.current;
    for (let i = 0; i < count && d.xs.length < MAX_DARTS; i++) {
      const x = d.rng() * 2 - 1, y = d.rng() * 2 - 1;
      d.xs.push(x); d.ys.push(y);
      if (x * x + y * y <= 1) d.inside++;
    }
    if (d.xs.length >= MAX_DARTS) setPlaying(false);
    rerender();
  };
  // One loop drives both modes: the slices glide into the row, or the darts rain
  const ref = useRaf(playing, dt => {
    if (mode === "darts") { throwDarts(40); return; }
    const nk = Math.min(1, k + dt * 0.55);
    setK(nk);
    if (nk >= 1) setPlaying(false);
  });

  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const resetDarts = () => { setPlaying(false); darts.current = fresh(Math.floor(Math.random() * 1e9)); rerender(); };
  const d = darts.current, total = d.xs.length;
  const est = total ? (4 * d.inside) / total : 0;

  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {mode === "pizza" ? <PizzaDrawing n={n} k={k} t={t} /> : <DartsDrawing d={d} t={t} />}
      </svg>
      {mode === "pizza" ? (
        <Transport t={t} playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (k >= 1) setK(0); setPlaying(true); }}
          playLabel={tx(t, "figPiA_play", "rearrange the slices")}
          onStep={k < 1 ? () => { setPlaying(false); setK(1); } : undefined}
          onBack={k > 0 ? () => { setPlaying(false); setK(0); } : undefined}
          onReset={() => { setPlaying(false); setK(0); }}
          readout={k >= 1 ? tx(t, "figPiA_sRow", "a row: πr by r") : k > 0 ? tx(t, "figPiA_sMoving", "moving…") : tx(t, "figPiA_sCircle", "the circle")} />
      ) : (
        <Transport t={t} playing={playing}
          onPlay={() => setPlaying(v => !v)}
          playLabel={tx(t, "figPiA_rain", "rain darts")}
          onStep={() => throwDarts(100)}
          onReset={resetDarts}
          readout={`${total} ${tx(t, "figPiA_darts", "darts")}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["pizza", tx(t, "figPiA_mPizza", "pizza")],
    ["darts", tx(t, "figPiA_mDarts", "darts")],
  ] as const} />;
  const controls = mode === "pizza" ? <>
    <Slider label={tx(t, "figPiA_n", "slices")} value={n} min={4} max={48} step={2} onChange={setN} fmt={v => String(v)} width="w-20" />
    <Row>
      <Readout color={C.pink}>{tx(t, "figPiA_w", "width ≈ half of 2πr = πr")}</Readout>
      <Readout color={C.green}>{tx(t, "figPiA_h", "height ≈ r")}</Readout>
      <Readout>{tx(t, "figPiA_a", "area ≈ πr · r = πr²")}</Readout>
    </Row>
  </> : <>
    <Row>
      <Btn onClick={() => throwDarts(1)}>+1</Btn>
      <Btn onClick={() => throwDarts(1000)}>+1000</Btn>
    </Row>
    <Row>
      <Readout color={C.sky}>{`${tx(t, "figPiA_in", "inside")} = ${d.inside}`}</Readout>
      <Readout>{`${tx(t, "figPiA_total", "total")} = ${total}`}</Readout>
      <Readout color={C.green}>{`4 · ${d.inside} / ${total || 1} = ${est.toFixed(4)}`}</Readout>
    </Row>
  </>;
  const note = mode === "pizza"
    ? tx(t, "figPiA_noteZ2", "Cut the circle into equal slices and press play: they are laid side by side, crust up and crust down alternately. Half the slices carry the top half of the crust, so the row's wavy top is half the circumference, πr; the bottom is the other half. Each slice is r long, so the row is r tall. Few slices give a bumpy parallelogram; add slices and the bumps flatten into a rectangle πr wide and r tall. Nothing was added or removed, so the circle's area is πr · r = πr².")
    : tx(t, "figPiA_noteD2", "Press play to rain darts that land anywhere in the square with equal chance. The circle (radius 1, area π) covers π/4 ≈ 78.5% of the square (area 4), so about that share of the darts land inside, and four times that share estimates π. A dart is inside when x² + y² ≤ 1, which is Pythagoras again. The estimate wobbles and improves slowly: 100 times more darts give only about 10 times less error. This is the Monte Carlo method, and path tracers estimate lighting in exactly this way.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figPiAL1_t", "Unpeel the pizza"),
      body: <>
        <p>{tx(t, "figPiAL1_b1", "The circle is cut into 8 slices. Amber slices carry the top half of the crust, blue ones the bottom half.")}</p>
        <p>{tx(t, "figPiAL1_b2", "Press play: the slices are laid in a row, points alternately up and down.")}</p>
      </>,
      goal: { text: tx(t, "figPiAL1_g", "Lay the slices in a row."), done: mode === "pizza" && k >= 1 },
      focus: "play",
      setup: () => { pick("pizza"); setN(8); setK(0); },
    },
    {
      title: tx(t, "figPiAL2_t", "Flatten the bumps"),
      body: <p>{tx(t, "figPiAL2_b", "With 8 slices the row is bumpy. Add slices and watch the row turn into a rectangle: half the crust (πr) wide and one slice (r) tall.")}</p>,
      goal: { text: tx(t, "figPiAL2_g", "At least 32 slices, laid in a row."), done: mode === "pizza" && n >= 32 && k >= 1 },
    },
    {
      title: tx(t, "figPiAL3_t", "Quick check"),
      body: <p>{tx(t, "figPiAL3_b", "The rectangle is πr wide and r tall.")}</p>,
      quiz: {
        q: tx(t, "figPiAL3_q", "What is the area of a circle of radius 3?"),
        options: ["9π ≈ 28.3", "6π ≈ 18.8", "3π ≈ 9.4", "36π ≈ 113"],
        answer: 0,
        why: tx(t, "figPiAL3_w", "π · 3² = 9π ≈ 28.3. 6π is the circumference 2πr: a length, not an area."),
      },
    },
    {
      title: tx(t, "figPiAL4_t", "Rain darts"),
      body: <>
        <p>{tx(t, "figPiAL4_b1", "A completely different way to find π. Darts land anywhere in the 2 × 2 square; the circle covers π/4 of it.")}</p>
        <p>{tx(t, "figPiAL4_b2", "Press play and let at least 2000 darts fall. Watch the estimate wobble and settle.")}</p>
      </>,
      goal: { text: tx(t, "figPiAL4_g", "Throw 2000 darts or more."), done: mode === "darts" && total >= 2000 },
      focus: "play",
      setup: () => { pick("darts"); resetDarts(); },
    },
    {
      title: tx(t, "figPiAL5_t", "Quick check"),
      body: <p>{tx(t, "figPiAL5_b", "Out of 1000 darts, 790 land inside the circle.")}</p>,
      quiz: {
        q: tx(t, "figPiAL5_q", "What estimate of π does that give?"),
        options: ["3.16", "0.79", "3.14", "7.9"],
        answer: 0,
        why: tx(t, "figPiAL5_w", "The share inside is 790 / 1000 = 0.79, which estimates π/4. Times 4: 3.16."),
      },
    },
    {
      title: tx(t, "figPiAL6_t", "Quick check"),
      body: <p>{tx(t, "figPiAL6_b", "Random estimates improve slowly: the error shrinks with the square root of the number of darts.")}</p>,
      quiz: {
        q: tx(t, "figPiAL6_q", "To make the typical error 10 times smaller, how many more darts do you need?"),
        options: ["100 times", "10 times", "20 times", "1000 times"],
        answer: 0,
        why: tx(t, "figPiAL6_w", "√100 = 10. That is why path tracers need so many samples per pixel before the noise goes away."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "bumpy", tone: "info", when: mode === "pizza" && k >= 1 && n < 16,
      title: tx(t, "figPiAI1_t", "Still bumpy"),
      body: fill(tx(t, "figPiAI1_b", "With {n} slices the row is a scalloped parallelogram. Its area is exactly the circle's, but it is not yet a clean rectangle. Add slices."), { n }),
    },
    {
      id: "rect", tone: "ok", when: mode === "pizza" && k >= 1 && n >= 32,
      title: tx(t, "figPiAI2_t", "Almost a rectangle"),
      body: tx(t, "figPiAI2_b", "πr wide, r tall: πr · r = πr². With infinitely many slices it would be exactly a rectangle."),
    },
    {
      id: "est", tone: "info", when: mode === "darts" && total >= 100,
      title: tx(t, "figPiAI3_t", "How close?"),
      body: fill(tx(t, "figPiAI3_b", "{n} darts, {i} inside: π ≈ 4 · {i} / {n} = {e}, off by {err}."), { n: total, i: d.inside, e: est.toFixed(4), err: Math.abs(est - Math.PI).toFixed(4) }),
    },
  ];

  const title = tx(t, "figPiA_title", "The area of a circle");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figPiAR1", "Slices of a circle rearrange into a rectangle πr wide and r tall, so its area is πr²."),
          tx(t, "figPiAR2", "Random darts estimate π: four times the share that lands inside the circle."),
          tx(t, "figPiAR3", "Random estimates converge slowly: 100 times the samples for 10 times less error."),
        ]}
      />
    </>
  );
}
