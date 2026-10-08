"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Btn, Row, Readout, Slider, Sliders, C, T, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Algebraic expressions as pieces you can see.
// like — an expression's terms as tiles: an x-bar is one x, a small square is
//        one unit, red means subtracted. The Transport plays "collecting like
//        terms" in two stages: the tiles slide into one row per kind, then
//        each red tile cancels one tile of the same kind. The x slider
//        evaluates both forms to show they are the same expression.
// dist — the distributive law as an area: a rectangle k wide and (x + c) long
//        is the same area as the two rectangles k·x and k·c side by side.
// foil — (x + a)(x + b) as a rectangle split into four parts: x², a·x, b·x, a·b.
// The lab walks through all three modes.

type Mode = "like" | "dist" | "foil";
type Term = { kind: "x" | "1"; sign: 1 | -1 };

const n = (v: number) => (Object.is(v, -0) ? 0 : +v.toFixed(2)).toString().replace("-", "−");
const STAGES = 2;                                   // 0 as written, 1 sorted, 2 pairs cancelled

// Each preset: its terms in written order; the text is built from them.
const PRESETS: Term[][] = [
  [{ kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "x", sign: -1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }],
  [{ kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "1", sign: -1 }, { kind: "1", sign: -1 }, { kind: "1", sign: -1 }, { kind: "x", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }, { kind: "1", sign: 1 }],
  [{ kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "x", sign: 1 }, { kind: "1", sign: 1 }, { kind: "x", sign: -1 }, { kind: "x", sign: -1 }, { kind: "x", sign: -1 }, { kind: "x", sign: -1 }, { kind: "1", sign: 1 }],
];

/** Groups consecutive tiles of the same kind and sign into written terms: "3x + 2 − x + 4". */
function written(terms: Term[]) {
  const groups: { kind: Term["kind"]; count: number }[] = [];
  for (const tm of terms) {
    const g = groups[groups.length - 1];
    const v = tm.sign;
    if (g && g.kind === tm.kind && Math.sign(g.count) === v) g.count += v;
    else groups.push({ kind: tm.kind, count: v });
  }
  return groups.map((g, i) => {
    const abs = Math.abs(g.count);
    const body = g.kind === "x" ? `${abs === 1 ? "" : abs}x` : `${abs}`;
    return i === 0 ? (g.count < 0 ? `−${body}` : body) : `${g.count < 0 ? " − " : " + "}${body}`;
  }).join("");
}

function simplified(nx: number, n1: number) {
  const xs = nx === 0 ? "" : `${nx === 1 ? "" : nx === -1 ? "−" : n(nx)}x`;
  if (n1 === 0) return xs || "0";
  if (!xs) return n(n1);
  return `${xs} ${n1 < 0 ? "−" : "+"} ${n(Math.abs(n1))}`;
}

// ── Tile layout ──
const XW = 16, XL = 64, U = 16, GAP = 6;
const tileW = (tm: Term) => (tm.kind === "x" ? XW : U);

/** Where each tile sits: in written order (stage 0) or sorted by kind and sign (later stages). Also which tiles cancel. */
function layout(terms: Term[], sorted: boolean) {
  if (!sorted) {
    let px = 20;
    return terms.map(tm => { const p = { x: px, y: 50, cancelled: false }; px += tileW(tm) + GAP; return p; });
  }
  const out: { x: number; y: number; cancelled: boolean }[] = [];
  for (const kind of ["x", "1"] as const) {
    const y = kind === "x" ? 30 : 120, w = kind === "x" ? XW : U;
    const pos = terms.filter(tm => tm.kind === kind && tm.sign > 0).length;
    const neg = terms.filter(tm => tm.kind === kind && tm.sign < 0).length;
    const pairs = Math.min(pos, neg);
    let ip = 0, ineg = 0;
    terms.forEach((tm, i) => {
      if (tm.kind !== kind) return;
      if (tm.sign > 0) { out[i] = { x: 20 + ip * (w + GAP), y, cancelled: ip < pairs }; ip++; }
      else { out[i] = { x: 20 + pos * (w + GAP) + 14 + ineg * (w + GAP), y, cancelled: ineg < pairs }; ineg++; }
    });
  }
  return out;
}

export function AlgebraTilesFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("like");
  const [preset, setPreset] = useState(0);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [x, setX] = useState(2);
  const [k, setK] = useState(3);
  const [c, setC] = useState(2);
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-algebra-tiles");
  const vis = useVisible<HTMLDivElement>();

  // Collecting: playing moves one stage per beat
  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (stage >= STAGES) { setPlaying(false); return; }
    const id = setTimeout(() => setStage(stage + 1), scaledMs(900, speed));
    return () => clearTimeout(id);
  }, [playing, stage, speed, vis.on, lab.open]);

  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const choose = (i: number) => { setPreset(i); setStage(0); setPlaying(false); };

  const W = 560, H = mode === "like" ? 170 : 230;
  const terms = PRESETS[preset];
  const nx = terms.reduce((s, tm) => s + (tm.kind === "x" ? tm.sign : 0), 0);
  const n1 = terms.reduce((s, tm) => s + (tm.kind === "1" ? tm.sign : 0), 0);

  // ── like terms ──
  const likeScene = () => {
    const pos = layout(terms, stage >= 1);
    return terms.map((tm, i) => {
      const col = tm.sign > 0 ? (tm.kind === "x" ? C.sky : C.green) : C.red;
      const w = tileW(tm), h = tm.kind === "x" ? XL : U;
      const faded = stage >= 2 && pos[i].cancelled;
      return (
        <g key={i} style={{ transform: `translate(${pos[i].x}px, ${pos[i].y}px)`, transition: "transform 0.6s ease, opacity 0.5s ease" }} opacity={faded ? 0.2 : 1}>
          <rect width={w} height={h} rx={3} fill={col} fillOpacity={tm.sign > 0 ? 0.35 : 0.12} stroke={col} strokeWidth={1.4} strokeDasharray={tm.sign > 0 ? undefined : "3 2"} />
          <T x={w / 2} y={h / 2 + 3.5} size={9} anchor="middle" color={col} bold>{(tm.sign < 0 ? "−" : "") + (tm.kind === "x" ? "x" : "1")}</T>
        </g>
      );
    });
  };

  // ── area models ──
  const S = 24;                                     // px per unit of length
  const areaRect = (x0: number, y0: number, w: number, h: number, col: string, label: string, key: string) => (
    <g key={key}>
      <rect x={x0} y={y0} width={w * S} height={h * S} fill={col} fillOpacity={0.22} stroke={col} strokeWidth={1.4} />
      {w * S > 28 && h * S > 16 && <T x={x0 + (w * S) / 2} y={y0 + (h * S) / 2 + 4} size={10} anchor="middle" color={col} bold>{label}</T>}
    </g>
  );

  const X0 = 60, Y0 = 30;
  let scene: React.ReactNode = null, readouts: React.ReactNode = null;
  if (mode === "like") {
    scene = likeScene();
    readouts = <>
      <Readout>{written(terms)}</Readout>
      <Readout color={C.amber}>= {simplified(nx, n1)}</Readout>
      <Readout color={C.muted}>x = {n(x)}: {n(terms.reduce((s, tm) => s + tm.sign * (tm.kind === "x" ? x : 1), 0))} = {n(nx * x + n1)}</Readout>
    </>;
  } else if (mode === "dist") {
    scene = <>
      {areaRect(X0, Y0, x, k, C.sky, `${n(k)}·x`, "kx")}
      {areaRect(X0 + x * S, Y0, c, k, C.green, `${n(k)}·${n(c)}`, "kc")}
      <T x={X0 - 8} y={Y0 + (k * S) / 2 + 4} size={10} anchor="end" color={C.fg} bold>{n(k)}</T>
      <T x={X0 + (x * S) / 2} y={Y0 + k * S + 16} size={10} anchor="middle" color={C.sky}>x = {n(x)}</T>
      <T x={X0 + x * S + (c * S) / 2} y={Y0 + k * S + 16} size={10} anchor="middle" color={C.green}>{n(c)}</T>
    </>;
    readouts = <>
      <Readout>{n(k)}(x + {n(c)}) = {n(k)}x + {n(k * c)}</Readout>
      <Readout color={C.amber}>{n(k)} × {n(x + c)} = {n(k * x)} + {n(k * c)} = {n(k * (x + c))}</Readout>
    </>;
  } else {
    scene = <>
      {areaRect(X0, Y0, x, x, C.purple, "x²", "xx")}
      {areaRect(X0 + x * S, Y0, b, x, C.sky, `${n(b)}x`, "bx")}
      {areaRect(X0, Y0 + x * S, x, a, C.sky, `${n(a)}x`, "ax")}
      {areaRect(X0 + x * S, Y0 + x * S, b, a, C.green, n(a * b), "ab")}
      <T x={X0 + (x * S) / 2} y={Y0 - 6} size={10} anchor="middle" color={C.fg}>x</T>
      <T x={X0 + x * S + (b * S) / 2} y={Y0 - 6} size={10} anchor="middle" color={C.fg}>{n(b)}</T>
      <T x={X0 - 8} y={Y0 + (x * S) / 2 + 4} size={10} anchor="end" color={C.fg}>x</T>
      <T x={X0 - 8} y={Y0 + x * S + (a * S) / 2 + 4} size={10} anchor="end" color={C.fg}>{n(a)}</T>
    </>;
    readouts = <>
      <Readout>(x + {n(a)})(x + {n(b)}) = x² + {n(a + b)}x + {n(a * b)}</Readout>
      <Readout color={C.amber}>x = {n(x)}: {n(x + a)} × {n(x + b)} = {n((x + a) * (x + b))}</Readout>
    </>;
  }

  const stageNames = [tx(t, "figTiles_sAsWritten", "as written"), tx(t, "figTiles_sSorted", "sorted by kind"), tx(t, "figTiles_sCancelled", "pairs cancelled")];
  const stageView = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {scene}
        {mode === "like" && stage >= 2 && <>
          <T x={W - 16} y={66} size={10} anchor="end" color={C.sky} bold>{simplified(nx, 0)}</T>
          <T x={W - 16} y={132} size={10} anchor="end" color={C.green} bold>{n(n1)}</T>
          <T x={W - 16} y={H - 12} size={9} anchor="end" color={C.muted}>{tx(t, "figTiles_faded", "faded = cancelled pairs")}</T>
        </>}
      </svg>
      {mode === "like" && (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (stage >= STAGES) setStage(0); setPlaying(true); }}
          playLabel={tx(t, "figTiles_play", "collect like terms")}
          onStep={stage < STAGES ? () => { setPlaying(false); setStage(stage + 1); } : undefined}
          onBack={stage > 0 ? () => { setPlaying(false); setStage(stage - 1); } : undefined}
          onReset={() => { setPlaying(false); setStage(0); }}
          readout={stageNames[stage]} />
      )}
    </div>
  );

  const modeChoice = <Choice value={mode} onChange={pick} options={[["like", tx(t, "figTiles_like", "like terms")], ["dist", tx(t, "figTiles_dist", "distribute")], ["foil", tx(t, "figTiles_foil", "two brackets")]] as const} />;
  const controls = <>
    {mode === "like" && <Row>
      {PRESETS.map((p, i) => <Btn key={i} active={i === preset} onClick={() => choose(i)}>{written(p)}</Btn>)}
    </Row>}
    <Sliders>
      <Slider label="x" value={x} min={0} max={mode === "dist" ? 8 : 5} step={0.5} onChange={setX} fmt={n} />
      {mode === "dist" && <>
        <Slider label="k" value={k} min={1} max={5} step={1} onChange={setK} fmt={n} />
        <Slider label="c" value={c} min={0} max={5} step={1} onChange={setC} fmt={n} />
      </>}
      {mode === "foil" && <>
        <Slider label="a" value={a} min={0} max={3} step={1} onChange={setA} fmt={n} />
        <Slider label="b" value={b} min={0} max={4} step={1} onChange={setB} fmt={n} />
      </>}
    </Sliders>
    <Row>{readouts}</Row>
  </>;
  const note = mode === "like"
    ? tx(t, "figTiles_noteLike2", "Each blue bar is one x, each green square is one unit, and a red dashed tile is one that is subtracted. Press ▶: the tiles are sorted by kind, then every red tile cancels one tile of the same kind, because x − x = 0 and 1 − 1 = 0. What is left is the simplified expression. An x-bar and a unit square never merge: they are different kinds of thing, like metres and seconds. Move the x slider: both forms always give the same number.")
    : mode === "dist"
      ? tx(t, "figTiles_noteDist", "A rectangle k wide and x + c long has area k(x + c). Cut it where x ends and you get two rectangles, k·x and k·c. The total area did not change, so k(x + c) = kx + kc. That is the distributive law: the factor outside the brackets multiplies every term inside.")
      : tx(t, "figTiles_noteFoil", "A square of side x + a by x + b is cut into four pieces: x·x = x², b·x, a·x and a·b. Adding them gives x² + (a + b)x + ab. Every term of the first bracket meets every term of the second exactly once; that is why the two middle pieces are there, and forgetting them is the classic mistake (x + 3)² ≠ x² + 9.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figTilesL1_t", "Sort the tiles"),
      body: <>
        <p>{tx(t, "figTilesL1_b1", "This is 3x + 2 − x + 4 as tiles: a blue bar is one x, a green square is one unit, a red dashed tile is subtracted.")}</p>
        <p>{tx(t, "figTilesL1_b2", "Step through the collection until the opposite pairs cancel.")}</p>
      </>,
      goal: { text: tx(t, "figTilesL1_g", "Reach the stage \"pairs cancelled\"."), done: mode === "like" && preset === 0 && stage === 2 },
      focus: "step",
      setup: () => { pick("like"); choose(0); },
    },
    {
      title: tx(t, "figTilesL2_t", "Quick check"),
      body: <p>{tx(t, "figTilesL2_b", "Count what is left in each row.")}</p>,
      quiz: {
        q: tx(t, "figTilesL2_q", "3x + 2 − x + 4 = ?"),
        options: ["2x + 6", "8x", "4x + 6", "2x + 2"],
        answer: 0,
        why: tx(t, "figTilesL2_w", "The x's: 3 − 1 = 2, so 2x. The units: 2 + 4 = 6. An x and a unit never merge, so 8x is wrong."),
      },
    },
    {
      title: tx(t, "figTilesL3_t", "Same value, always"),
      body: <p>{tx(t, "figTilesL3_b", "The simplified form is not a different expression, only a shorter way to write the same one. Move x and watch both numbers in the readout.")}</p>,
      goal: { text: tx(t, "figTilesL3_g", "Set x = 4."), done: mode === "like" && x === 4 },
      setup: () => { pick("like"); choose(1); setX(1); },
    },
    {
      title: tx(t, "figTilesL4_t", "The x that vanishes"),
      body: <p>{tx(t, "figTilesL4_b", "Pick 4x + 1 − 4x + 1 and collect it. What is left does not depend on x at all.")}</p>,
      goal: { text: tx(t, "figTilesL4_g", "Collect 4x + 1 − 4x + 1 to the end."), done: mode === "like" && preset === 2 && stage === 2 },
      focus: "play",
      setup: () => { pick("like"); choose(0); },
    },
    {
      title: tx(t, "figTilesL5_t", "Distributing as an area"),
      body: <>
        <p>{tx(t, "figTilesL5_b1", "A rectangle k wide and x + c long. Its two pieces are k·x and k·c.")}</p>
        <p>{tx(t, "figTilesL5_b2", "Build 4(x + 3).")}</p>
      </>,
      goal: { text: tx(t, "figTilesL5_g", "k = 4 and c = 3."), done: mode === "dist" && k === 4 && c === 3 },
      setup: () => { pick("dist"); setK(2); setC(1); setX(3); },
    },
    {
      title: tx(t, "figTilesL6_t", "Quick check"),
      body: <p>{tx(t, "figTilesL6_b", "A minus sign in front of the factor is part of the factor.")}</p>,
      quiz: {
        q: "−2(x − 3) = ?",
        options: ["−2x + 6", "−2x − 6", "−2x − 3", "2x − 6"],
        answer: 0,
        why: tx(t, "figTilesL6_w", "The factor −2 multiplies both terms: (−2)·x = −2x and (−2)·(−3) = +6."),
      },
    },
    {
      title: tx(t, "figTilesL7_t", "A square of a sum"),
      body: <>
        <p>{tx(t, "figTilesL7_b1", "Two brackets make four pieces. When both brackets are the same, the big rectangle is a square.")}</p>
        <p>{tx(t, "figTilesL7_b2", "Build (x + 3)², that is (x + 3)(x + 3), and count the pieces.")}</p>
      </>,
      goal: { text: tx(t, "figTilesL7_g", "a = 3 and b = 3."), done: mode === "foil" && a === 3 && b === 3 },
      setup: () => { pick("foil"); setA(1); setB(2); setX(3); },
    },
    {
      title: tx(t, "figTilesL8_t", "Quick check"),
      body: <p>{tx(t, "figTilesL8_b", "Read the four pieces off the square.")}</p>,
      quiz: {
        q: "(x + 3)² = ?",
        options: ["x² + 6x + 9", "x² + 9", "x² + 3x + 9", "2x + 6"],
        answer: 0,
        why: tx(t, "figTilesL8_w", "x² from the corner square, two rectangles of 3x each (6x together) and 3·3 = 9. Forgetting the two rectangles gives the wrong x² + 9."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "vanish", tone: "ok", when: mode === "like" && preset === 2 && stage === 2,
      title: tx(t, "figTilesI1_t", "No x left"),
      body: tx(t, "figTilesI1_b", "Every x-bar cancelled against a red one: 4x − 4x = 0. The expression is just 2, whatever x is. Move x: the value never changes."),
    },
    {
      id: "kinds", tone: "info", when: mode === "like" && stage === 2 && preset !== 2,
      title: tx(t, "figTilesI2_t", "Two rows, two kinds"),
      body: fill(tx(t, "figTilesI2_b", "The x row and the unit row never mix. That is why the answer {s} still has two terms: nothing more can be combined."), { s: simplified(nx, n1) }),
    },
    {
      id: "zeroC", tone: "info", when: mode === "dist" && c === 0,
      title: tx(t, "figTilesI3_t", "Nothing to add"),
      body: tx(t, "figTilesI3_b", "With c = 0 there is only one rectangle: k(x + 0) = kx. The green piece has width 0."),
    },
    {
      id: "square", tone: "ok", when: mode === "foil" && a === b && a > 0,
      title: tx(t, "figTilesI4_t", "A perfect square"),
      body: fill(tx(t, "figTilesI4_b", "(x + {a})² = x² + {m}x + {aa}. The two blue rectangles are equal, {a}x each: that is the 2ab in (a + b)² = a² + 2ab + b²."), { a, m: 2 * a, aa: a * a }),
    },
    {
      id: "oneBracket", tone: "info", when: mode === "foil" && (a === 0 || b === 0),
      title: tx(t, "figTilesI5_t", "Only one bracket left"),
      body: tx(t, "figTilesI5_b", "With a zero, one bracket is just x, and the four pieces shrink to two: it is the distributive law again, x(x + b) = x² + bx."),
    },
  ];

  const title = tx(t, "figTiles_title", "Algebra tiles");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{stageView}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stageView}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figTilesR1", "Only like terms combine: x-tiles with x-tiles, units with units; a subtracted tile cancels one of its kind."),
          tx(t, "figTilesR2", "k(x + c) = kx + kc: one rectangle cut into two has the same area."),
          tx(t, "figTilesR3", "(x + a)(x + b) has four pieces; for (x + a)² the two middle ones give the 2ax."),
        ]}
      />
    </>
  );
}
