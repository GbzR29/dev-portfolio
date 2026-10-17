"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, useFrame, useVisible, clamp } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { Tex } from "@/components/lesson/Tex";

// ── What this figure shows ────────────────────────────────────────────────────
// gauss     — 1 + 2 + … + n as a staircase of unit squares. Play drops an
//             upside-down copy in from above; the two fit into an
//             n × (n + 1) rectangle, so twice the sum is n(n + 1).
// telescope — a sum whose terms are differences, (a₁ − a₂) + (a₂ − a₃) + ….
//             Each ⏭ cancels one neighbouring pair; at the end only the first
//             and the last piece survive.
// grid      — a double sum Σᵢ Σⱼ i·j as a table. ⏭ adds one more row (or
//             column) total; both orders reach the same number, which is
//             (Σi)(Σj). "Only j ≤ i" keeps the lower triangle.
// The lab walks through all three, with quizzes.

type Mode = "gauss" | "telescope" | "grid";
type Tele = "frac" | "odd";
type Order = "rows" | "cols";

const W = 560;

// ── Telescoping presets ───────────────────────────────────────────────────────
// up = false: the k-th term is piece(k) − piece(k + 1), the sum is first − last.
// up = true:  the k-th term is piece(k + 1) − piece(k), the sum is last − first.
const TELE: Record<Tele, { up: boolean; piece: (k: number) => string; term: string; first: string; last: (n: number) => string; value: (n: number) => string }> = {
  frac: {
    up: false,
    piece: k => `\\tfrac{1}{${k}}`,
    term: String.raw`\frac{1}{k(k+1)} = \frac1k - \frac1{k+1}`,
    first: "1",
    last: n => `\\tfrac{1}{${n + 1}}`,
    value: n => `\\tfrac{${n}}{${n + 1}}`,
  },
  odd: {
    up: true,
    piece: k => `${k * k}`,
    term: String.raw`2k + 1 = (k+1)^2 - k^2`,
    first: "1",
    last: n => `${(n + 1) * (n + 1)}`,
    value: n => `${(n + 1) * (n + 1) - 1}`,
  },
};

// ── Stages ────────────────────────────────────────────────────────────────────

function GaussStage({ n, p, t }: { n: number; p: number; t?: TrackTranslations }) {
  const H = 300;
  const u = Math.min(34, 400 / n, 236 / (n + 1));
  const x0 = (W - n * u) / 2, y0 = H - 34;                  // bottom-left corner of the staircase, centred
  // The copy falls straight down onto its own column: column k of the copy is
  // directly above column k of the staircase, so they meet without overlapping.
  const drop = (1 - p) * (n + 1) * u;
  const cells: React.ReactNode[] = [];
  for (let k = 1; k <= n; k++) {
    for (let j = 0; j < k; j++)
      cells.push(<rect key={`a${k}-${j}`} x={x0 + (k - 1) * u + 1} y={y0 - (j + 1) * u + 1} width={u - 2} height={u - 2} rx={2} fill={C.sky} opacity={0.85} />);
    for (let j = 0; j < n + 1 - k; j++)                     // the copy hangs from the line y = n + 1
      cells.push(<rect key={`b${k}-${j}`} x={x0 + (k - 1) * u + 1} y={y0 - (n + 1) * u + j * u + 1 - drop} width={u - 2} height={u - 2} rx={2} fill={C.amber} opacity={0.85} />);
  }
  const done = p >= 0.999;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={x0 - 6} x2={W - 10} y1={y0} y2={y0} stroke={C.axis} />
      {cells}
      {done && <>
        <rect x={x0} y={y0 - (n + 1) * u} width={n * u} height={(n + 1) * u} fill="none" stroke={C.green} strokeWidth={2} />
        <T x={x0 + (n * u) / 2} y={y0 + 16} anchor="middle" color={C.green} bold>{`n = ${n}`}</T>
        <T x={x0 + n * u + 8} y={y0 - ((n + 1) * u) / 2} color={C.green} bold>{`n + 1 = ${n + 1}`}</T>
      </>}
      <T x={W - 12} y={18} anchor="end" color={C.sky} bold>{`1 + 2 + … + ${n} = ${(n * (n + 1)) / 2}`}</T>
      <T x={W - 12} y={34} anchor="end" color={done ? C.green : C.muted}>{done
        ? `2S = ${n} × ${n + 1} = ${n * (n + 1)}`
        : tx(t, "figSum_drop", "an upside-down copy drops in")}</T>
    </svg>
  );
}

function TeleStage({ preset, n, cut }: { preset: Tele; n: number; cut: number }) {
  const P = TELE[preset];
  // Term k holds piece(k) and piece(k + 1). After `cut` steps, piece(j) for j = 2 … cut + 1 is gone from both terms it is in.
  const gone = (j: number) => j >= 2 && j <= cut + 1;
  const show = (j: number, col: string) => (gone(j) ? `\\muted{\\cancel{${P.piece(j)}}}` : `\\${col}{${P.piece(j)}}`);
  const terms = Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    return P.up
      ? `\\left(${show(k + 1, "green")} - ${show(k, "red")}\\right)`
      : `\\left(${show(k, "green")} - ${show(k + 1, "red")}\\right)`;
  });
  const result = P.up
    ? `= \\green{${P.last(n)}} - \\red{${P.first}} = \\amber{${P.value(n)}}`
    : `= \\green{${P.first}} - \\red{${P.last(n)}} = \\amber{${P.value(n)}}`;
  const done = cut >= n - 1;
  return (
    <div className="px-4 py-6 min-h-[220px] flex flex-col justify-center gap-4 text-[var(--text-main)]">
      <div className="text-center text-[15px]"><Tex>{P.term}</Tex></div>
      <div className="flex flex-wrap justify-center items-center gap-x-1 gap-y-3 text-[17px]">
        {terms.map((s, i) => <span key={i} className="whitespace-nowrap"><Tex>{(i ? "+\\," : "") + s}</Tex></span>)}
      </div>
      <div className="text-center text-[17px]">
        <Tex>{done ? result : `= \\;?`}</Tex>
      </div>
    </div>
  );
}

function GridStage({ n, m, shown, order, tri, t }: { n: number; m: number; shown: number; order: Order; tri: boolean; t?: TrackTranslations }) {
  const cell = Math.min(46, 360 / (m + 1.6), 230 / (n + 1.6));
  const x0 = 70, y0 = 36, H = y0 + (n + 1.6) * cell + 10;
  const inside = (i: number, j: number) => !tri || j <= i;
  const rowSum = (i: number) => Array.from({ length: m }, (_, j) => (inside(i, j + 1) ? i * (j + 1) : 0)).reduce((a, b) => a + b, 0);
  const colSum = (j: number) => Array.from({ length: n }, (_, i) => (inside(i + 1, j) ? (i + 1) * j : 0)).reduce((a, b) => a + b, 0);
  const lines = order === "rows" ? n : m;
  let total = 0;
  for (let k = 1; k <= Math.min(shown, lines); k++) total += order === "rows" ? rowSum(k) : colSum(k);
  const cells: React.ReactNode[] = [];
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const on = inside(i, j), lit = order === "rows" ? i <= shown : j <= shown;
    cells.push(<g key={`${i}-${j}`}>
      <rect x={x0 + (j - 1) * cell + 1} y={y0 + (i - 1) * cell + 1} width={cell - 2} height={cell - 2} rx={4}
        fill={!on ? "transparent" : lit ? C.purple : C.sky} opacity={!on ? 1 : lit ? 0.35 : 0.14} stroke={on ? "none" : C.grid} strokeDasharray="3 3" />
      {on && <T x={x0 + (j - 0.5) * cell} y={y0 + (i - 0.5) * cell + 4} anchor="middle" color={C.fg} size={11}>{i * j}</T>}
    </g>);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <T x={x0 - 10} y={y0 - 12} anchor="end" color={C.muted}>i \ j</T>
      {Array.from({ length: m }, (_, j) => <T key={`c${j}`} x={x0 + (j + 0.5) * cell} y={y0 - 12} anchor="middle" color={C.amber} bold>{j + 1}</T>)}
      {Array.from({ length: n }, (_, i) => <T key={`r${i}`} x={x0 - 12} y={y0 + (i + 0.5) * cell + 4} anchor="end" color={C.green} bold>{i + 1}</T>)}
      {cells}
      {order === "rows" && Array.from({ length: Math.min(shown, n) }, (_, i) =>
        <T key={`rs${i}`} x={x0 + m * cell + 10} y={y0 + (i + 0.5) * cell + 4} color={C.purple} bold>{`= ${rowSum(i + 1)}`}</T>)}
      {order === "cols" && Array.from({ length: Math.min(shown, m) }, (_, j) =>
        <T key={`cs${j}`} x={x0 + (j + 0.5) * cell} y={y0 + n * cell + 18} anchor="middle" color={C.purple} bold>{`${colSum(j + 1)}`}</T>)}
      <T x={W - 12} y={18} anchor="end" color={C.purple} bold>{`${tx(t, "figSum_soFar", "total so far")} = ${total}`}</T>
    </svg>
  );
}

// ── The figure ────────────────────────────────────────────────────────────────

export function SummationFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("gauss");
  const [n, setN] = useState(6);
  const [p, setP] = useState(0);
  const [preset, setPreset] = useState<Tele>("frac");
  const [tn, setTn] = useState(5);
  const [cut, setCut] = useState(0);
  const [gn, setGn] = useState(4);
  const [gm, setGm] = useState(5);
  const [shown, setShown] = useState(0);
  const [order, setOrder] = useState<Order>("rows");
  const [tri, setTri] = useState(false);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-summation");
  const vis = useVisible<HTMLDivElement>();

  const lines = order === "rows" ? gn : gm;
  // play: the copy drops (gauss), or one cancellation / one line total every 0.7 s
  const [acc, setAcc] = useState(0);
  useFrame(playing && (vis.on || lab.open), dt => {
    if (mode === "gauss") {
      if (p >= 1) { setPlaying(false); return; }
      setP(v => Math.min(1, v + dt * 0.6));
      return;
    }
    const a = acc + dt;
    if (a < 0.7) { setAcc(a); return; }
    setAcc(0);
    if (mode === "telescope") { if (cut >= tn - 1) setPlaying(false); else setCut(c => c + 1); }
    else { if (shown >= lines) setPlaying(false); else setShown(s => s + 1); }
  });

  const stop = () => setPlaying(false);
  const pick = (m: Mode) => { setMode(m); stop(); };
  const total = mode === "gauss" ? 1 : mode === "telescope" ? tn - 1 : lines;
  const pos = mode === "gauss" ? p : mode === "telescope" ? cut : shown;
  const setPos = (v: number) => {
    stop();
    if (mode === "gauss") setP(clamp(v, 0, 1));
    else if (mode === "telescope") setCut(clamp(v, 0, tn - 1));
    else setShown(clamp(v, 0, lines));
  };
  const stepSize = mode === "gauss" ? 0.25 : 1;

  // Grid totals, for readouts and the lab
  const inside = (i: number, j: number) => !tri || j <= i;
  let gridTotal = 0;
  for (let i = 1; i <= gn; i++) for (let j = 1; j <= gm; j++) if (inside(i, j)) gridTotal += i * j;
  const gaussDone = p >= 0.999, teleDone = cut >= tn - 1, gridDone = shown >= lines;

  const stageOf = () => mode === "gauss" ? <GaussStage n={n} p={p} t={t} />
    : mode === "telescope" ? <TeleStage preset={preset} n={tn} cut={cut} />
      : <GridStage n={gn} m={gm} shown={shown} order={order} tri={tri} t={t} />;

  const view = (
    <div>
      {stageOf()}
      <Transport t={t} playing={playing}
        onPlay={() => { if (pos >= total) setPos(0); setPlaying(v => !v); }}
        playLabel={mode === "gauss" ? tx(t, "figSum_playG2", "drop the copy in") : mode === "telescope" ? tx(t, "figSum_playT", "cancel the pairs") : tx(t, "figSum_playD", "add the lines")}
        onStep={() => setPos(pos + stepSize)}
        onBack={() => setPos(pos - stepSize)}
        onReset={() => setPos(0)}
        readout={mode === "gauss" ? `${Math.round(p * 100)}%` : `${pos} / ${total}`} />
    </div>
  );

  let controls: React.ReactNode, note: string;
  if (mode === "gauss") {
    controls = <>
      <Sliders><Slider label="n" value={n} min={1} max={12} step={1} onChange={v => { stop(); setN(v); setP(0); }} fmt={v => String(v)} /></Sliders>
      <Row>
        <Readout color={C.sky}>{`S = ${(n * (n + 1)) / 2}`}</Readout>
        <Readout color={C.green}>{`n(n + 1)/2 = ${n}·${n + 1}/2 = ${(n * (n + 1)) / 2}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figSum_noteG2", "The blue staircase has columns of 1, 2, …, n squares: its area is the sum 1 + 2 + … + n. Press play: an upside-down copy drops in from above and fills the gaps exactly. Together they make a rectangle n wide and n + 1 tall, so twice the sum is n(n + 1). Change n: the rectangle always closes.");
  } else if (mode === "telescope") {
    controls = <>
      <Row>
        <Choice value={preset} onChange={v => { stop(); setPreset(v); setCut(0); }} options={[
          ["frac", "1/(k(k+1))"],
          ["odd", "2k + 1"],
        ] as const} />
      </Row>
      <Sliders><Slider label={tx(t, "figSum_terms", "terms n")} value={tn} min={2} max={8} step={1} onChange={v => { stop(); setTn(v); setCut(0); }} fmt={v => String(v)} /></Sliders>
    </>;
    note = tx(t, "figSum_noteT", "Each term is a difference of two pieces, green minus red. The red piece of one term is the green piece of the next, so the two cancel. Press ⏭ to cancel one neighbouring pair at a time. When every pair is gone, only the very first piece and the very last one are left: a sum of n terms collapses to one subtraction.");
  } else {
    controls = <>
      <Row>
        <Choice value={order} onChange={v => { stop(); setOrder(v); setShown(0); }} options={[
          ["rows", tx(t, "figSum_byRows", "row by row (i outside)")],
          ["cols", tx(t, "figSum_byCols", "column by column (j outside)")],
        ] as const} />
        <Btn active={tri} onClick={() => { stop(); setTri(v => !v); setShown(0); }}>{tx(t, "figSum_tri", "only j ≤ i")}</Btn>
      </Row>
      <Sliders>
        <Slider label={tx(t, "figSum_rowsN", "rows i ≤")} value={gn} min={2} max={6} step={1} onChange={v => { stop(); setGn(v); setShown(0); }} fmt={v => String(v)} />
        <Slider label={tx(t, "figSum_colsM", "columns j ≤")} value={gm} min={2} max={6} step={1} onChange={v => { stop(); setGm(v); setShown(0); }} fmt={v => String(v)} />
      </Sliders>
      <Row>
        <Readout color={C.purple}>{`ΣΣ i·j = ${gridTotal}`}</Readout>
        {!tri && <Readout color={C.green}>{`(Σi)(Σj) = ${(gn * (gn + 1)) / 2} × ${(gm * (gm + 1)) / 2} = ${((gn * (gn + 1)) / 2) * ((gm * (gm + 1)) / 2)}`}</Readout>}
      </Row>
    </>;
    note = tx(t, "figSum_noteD", "A double sum adds every cell of a table; here cell (i, j) holds i·j. Press ⏭ to add one row total at a time, then switch to columns and do it again: the same cells, so the same grand total. That is why the order of two finite sums can be swapped. Because i·j splits into a factor of i times a factor of j, the total is also (1 + … + n)(1 + … + m). Tick \"only j ≤ i\" for a triangle: then the inner sum's end depends on the outer index.");
  }

  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["gauss", tx(t, "figSum_mG", "Gauss's staircase")],
    ["telescope", tx(t, "figSum_mT", "telescoping")],
    ["grid", tx(t, "figSum_mD", "double sum")],
  ] as const} />;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figSumL1_t", "Two staircases"),
      body: <>
        <p>{tx(t, "figSumL1_b1", "The staircase has columns of 1, 2, …, 10 squares, so its area is 1 + 2 + … + 10.")}</p>
        <p>{tx(t, "figSumL1_b2", "Drop the upside-down copy in and look at the shape the two make.")}</p>
      </>,
      goal: { text: tx(t, "figSumL1_g", "The copy fully in place, with n = 10."), done: mode === "gauss" && n === 10 && gaussDone },
      focus: "play",
      setup: () => { pick("gauss"); setN(10); setP(0); },
    },
    {
      title: tx(t, "figSumL2_t", "Quick check"),
      body: <p>{tx(t, "figSumL2_b", "Two staircases of 1 to n make an n × (n + 1) rectangle.")}</p>,
      quiz: {
        q: tx(t, "figSumL2_q", "What is 1 + 2 + … + 20?"),
        options: ["210", "200", "420", "220"],
        answer: 0,
        why: tx(t, "figSumL2_w", "20 × 21 / 2 = 210. 420 is the whole rectangle, twice the sum; 200 forgets that the rectangle is n + 1 tall."),
      },
    },
    {
      title: tx(t, "figSumL3_t", "A collapsing sum"),
      body: <>
        <p>{tx(t, "figSumL3_b1", "1/(1·2) + 1/(2·3) + 1/(3·4) + … looks hopeless. But 1/(k(k + 1)) = 1/k − 1/(k + 1), so every term is a difference.")}</p>
        <p>{tx(t, "figSumL3_b2", "Cancel all the pairs.")}</p>
      </>,
      goal: { text: tx(t, "figSumL3_g", "Every pair cancelled (1/(k(k+1)), any n)."), done: mode === "telescope" && preset === "frac" && teleDone },
      focus: "step",
      setup: () => { pick("telescope"); setPreset("frac"); setTn(5); setCut(0); },
    },
    {
      title: tx(t, "figSumL4_t", "Quick check"),
      body: <p>{tx(t, "figSumL4_b", "After cancelling, the sum of the first n terms is 1 − 1/(n + 1).")}</p>,
      quiz: {
        q: tx(t, "figSumL4_q", "What is 1/(1·2) + 1/(2·3) + … + 1/(99·100)?"),
        options: ["99/100", "1/100", "1", "100/99"],
        answer: 0,
        why: tx(t, "figSumL4_w", "n = 99 terms: 1 − 1/100 = 99/100. However many terms you add, the sum stays below 1, and it tends to 1."),
      },
    },
    {
      title: tx(t, "figSumL5_t", "Odd numbers"),
      body: <>
        <p>{tx(t, "figSumL5_b1", "(k + 1)² − k² = 2k + 1, an odd number. So 3 + 5 + 7 + … is also a telescoping sum, of squares.")}</p>
        <p>{tx(t, "figSumL5_b2", "Pick 2k + 1 with n = 6 and cancel everything: 3 + 5 + … + 13 collapses to 7² − 1².")}</p>
      </>,
      goal: { text: tx(t, "figSumL5_g", "2k + 1, n = 6, every pair cancelled."), done: mode === "telescope" && preset === "odd" && tn === 6 && teleDone },
      setup: () => { pick("telescope"); setPreset("odd"); setTn(4); setCut(0); },
    },
    {
      title: tx(t, "figSumL6_t", "Rows, then columns"),
      body: <>
        <p>{tx(t, "figSumL6_b1", "The table holds i·j for i up to 4 and j up to 5. Add it row by row: each row total is one inner sum.")}</p>
        <p>{tx(t, "figSumL6_b2", "Then switch to columns and add it again.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSumL6_g", "All {k} columns added (grand total {s})."), { k: gm, s: gridTotal }), done: mode === "grid" && order === "cols" && gridDone && !tri },
      setup: () => { pick("grid"); setGn(4); setGm(5); setOrder("rows"); setTri(false); setShown(0); },
    },
    {
      title: tx(t, "figSumL7_t", "Quick check"),
      body: <p>{tx(t, "figSumL7_b", "Without the triangle, the 4 × 5 table of i·j adds up to (1 + 2 + 3 + 4)(1 + 2 + 3 + 4 + 5).")}</p>,
      quiz: {
        q: tx(t, "figSumL7_q", "What is that total?"),
        options: ["150", "20", "25", "120"],
        answer: 0,
        why: tx(t, "figSumL7_w", "10 × 15 = 150, the same as the grand total the figure found both ways. 20 counts the cells, not their values."),
      },
    },
    {
      title: tx(t, "figSumL8_t", "Using the rules"),
      body: <p>{tx(t, "figSumL8_b", "Linearity splits a sum: Σ(3k + 2) = 3·Σk + Σ2.")}</p>,
      quiz: {
        q: tx(t, "figSumL8_q", "What is Σ (3k + 2) for k = 1 to 10?"),
        options: ["185", "167", "320", "57"],
        answer: 0,
        why: tx(t, "figSumL8_w", "3 · 55 + 10 · 2 = 165 + 20 = 185. 167 adds the 2 only once; the constant is added once per term, ten times."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "rect", tone: "ok", when: mode === "gauss" && gaussDone,
      title: tx(t, "figSumI1_t", "Twice the sum is a rectangle"),
      body: fill(tx(t, "figSumI1_b", "{n} × {m} = {a} squares, two staircases' worth. One staircase is half: {s}."), { n, m: n + 1, a: n * (n + 1), s: (n * (n + 1)) / 2 }),
    },
    {
      id: "tele", tone: "ok", when: mode === "telescope" && teleDone,
      title: tx(t, "figSumI2_t", "Only the ends survive"),
      body: tx(t, "figSumI2_b", "Every inner piece appeared once with + and once with −. What is left is the first piece minus the last: a sum of n terms became one subtraction."),
    },
    {
      id: "swap", tone: "info", when: mode === "grid" && gridDone,
      title: tx(t, "figSumI3_t", "Same cells, same total"),
      body: fill(tx(t, "figSumI3_b", "Rows or columns, the table adds up to {s}. A finite double sum can be taken in either order."), { s: gridTotal }),
    },
  ];

  const title = tx(t, "figSum_title", "Three ways to tame a sum");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls} note={note}>
        <div ref={vis.ref}>{view}</div>
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figSumR1", "1 + 2 + … + n = n(n + 1)/2: two staircases make an n × (n + 1) rectangle."),
          tx(t, "figSumR2", "A sum of differences telescopes: only the first and the last piece survive."),
          tx(t, "figSumR3", "A finite double sum can be added in either order; Σᵢ Σⱼ aᵢ bⱼ = (Σaᵢ)(Σbⱼ)."),
          tx(t, "figSumR4", "Linearity: constants come out, sums split, and a constant c added n times gives n·c."),
        ]}
      />
    </>
  );
}
