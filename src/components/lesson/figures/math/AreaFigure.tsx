"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, plot, Grid, clamp, useVisible, type Pt } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Where the area formulas come from, one shape at a time, over a grid of unit
// squares:
// rect          — b × h unit squares, counted row by row.
// parallelogram — cut the triangle off one end and slide it to the other: a
//                 rectangle with the same base and height.
// triangle      — a second copy, turned half a turn, completes a
//                 parallelogram; the triangle is half of it.
// trapezoid     — the same trick: two copies make a parallelogram whose base
//                 is the two parallel sides added together.
// The Transport performs the move in two stages: show the piece (the cut, or
// the copy), then move it. The lab builds each formula and checks it.

type Mode = "rect" | "para" | "tri" | "trap";
const STAGES = 2;                                   // 0 shape, 1 piece shown, 2 piece moved
const p = plot({ W: 560, H: 238, x0: -3.5, x1: 16.5, y0: -1.25, y1: 7.25 });
const n1 = (v: number) => (+v.toFixed(2)).toString();
const pts = (ps: Pt[]) => ps.map(q => `${p.X(q.x)},${p.Y(q.y)}`).join(" ");
const fillA = { fill: C.sky, fillOpacity: 0.25, stroke: C.sky, strokeWidth: 2 };
const fillB = { fill: C.amber, fillOpacity: 0.3, stroke: C.amber, strokeWidth: 2 };
const MOVE = "transform 0.9s ease";

/** Area of the shape, and its formula with the numbers in. */
function areaOf(mode: Mode, b: number, h: number, a: number) {
  if (mode === "tri") return { A: (b * h) / 2, formula: `A = b · h / 2 = ${n1(b)} · ${n1(h)} / 2 = ${n1((b * h) / 2)}` };
  if (mode === "trap") return { A: ((a + b) * h) / 2, formula: `A = (a + b) · h / 2 = (${n1(a)} + ${n1(b)}) · ${n1(h)} / 2 = ${n1(((a + b) * h) / 2)}` };
  return { A: b * h, formula: `A = b · h = ${n1(b)} · ${n1(h)} = ${n1(b * h)}` };
}

// ── The drawing ───────────────────────────────────────────────────────────────

function AreaDrawing({ mode, b, h, s, a, stage }: { mode: Mode; b: number; h: number; s: number; a: number; stage: number }) {
  const moved = stage >= 2, shown = stage >= 1;
  let shapes: React.ReactNode, hx = 0;
  // A half turn about m (world coordinates), as a CSS transform so it animates
  const halfTurn = (m: Pt) => ({ transformOrigin: `${p.X(m.x)}px ${p.Y(m.y)}px`, transform: `rotate(${moved ? -180 : 0}deg)`, transition: MOVE });

  if (mode === "rect") {
    const cols = Math.floor(b), rows = Math.floor(h);
    shapes = <>
      <polygon points={pts([{ x: 0, y: 0 }, { x: b, y: 0 }, { x: b, y: h }, { x: 0, y: h }])} {...fillA} />
      {Array.from({ length: cols * rows }, (_, i) => {
        const x = i % cols, y = Math.floor(i / cols);
        return <T key={i} x={p.X(x + 0.5)} y={p.Y(y + 0.5) + 3} size={8} anchor="middle" color={C.sky}>{i + 1}</T>;
      })}
    </>;
  } else if (mode === "para") {
    const tri = s >= 0 ? [{ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: h }] : [{ x: b + s, y: 0 }, { x: b, y: 0 }, { x: b + s, y: h }];
    const rest = s >= 0 ? [{ x: s, y: 0 }, { x: b, y: 0 }, { x: b + s, y: h }, { x: s, y: h }] : [{ x: 0, y: 0 }, { x: b + s, y: 0 }, { x: b + s, y: h }, { x: s, y: h }];
    const dx = moved ? (s >= 0 ? b : -b) * p.sx : 0;
    shapes = <>
      <polygon points={pts(rest)} {...fillA} />
      <polygon points={pts(tri)} {...(shown ? fillB : fillA)} style={{ transform: `translate(${dx}px, 0px)`, transition: MOVE }} />
    </>;
    hx = s >= 0 ? s : b + s;
  } else if (mode === "tri") {
    const A = { x: 0, y: 0 }, B = { x: b, y: 0 }, Cc = { x: s, y: h };
    shapes = <>
      {shown && <polygon points={pts([A, B, Cc])} {...fillB} strokeDasharray="5 4" style={halfTurn({ x: (b + s) / 2, y: h / 2 })} />}
      <polygon points={pts([A, B, Cc])} {...fillA} />
    </>;
    hx = s;
  } else {
    const P = [{ x: 0, y: 0 }, { x: b, y: 0 }, { x: s + a, y: h }, { x: s, y: h }];
    shapes = <>
      {shown && <polygon points={pts(P)} {...fillB} strokeDasharray="5 4" style={halfTurn({ x: (b + s + a) / 2, y: h / 2 })} />}
      <polygon points={pts(P)} {...fillA} />
      <T x={p.X(s + a / 2)} y={p.Y(h) - 8} size={10} anchor="middle" color={C.pink} bold>{`a = ${n1(a)}`}</T>
    </>;
    hx = s;
  }

  return (
    <svg viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
      <Grid p={p} step={1} labels={false} />
      {shapes}
      {mode !== "rect" && <line x1={p.X(hx)} y1={p.Y(0)} x2={p.X(hx)} y2={p.Y(h)} stroke={C.green} strokeWidth={1.6} strokeDasharray="4 3" />}
      {mode !== "rect" && <path d={`M${p.X(hx) + 8},${p.Y(0)} v-8 h-8`} fill="none" stroke={C.green} strokeWidth={1.2} />}
      <T x={mode === "rect" ? p.X(0) - 6 : p.X(hx) + 5} y={p.Y(h / 2)} size={10} anchor={mode === "rect" ? "end" : "start"} color={C.green} bold>{`h = ${n1(h)}`}</T>
      <T x={p.X(b / 2)} y={p.Y(0) + 15} size={10} anchor="middle" color={C.sky} bold>{`b = ${n1(b)}`}</T>
    </svg>
  );
}

export function AreaFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("rect");
  const [b, setB] = useState(6), [h, setH] = useState(4), [sh, setSh] = useState(2), [top, setTop] = useState(3);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-area");
  const vis = useVisible<HTMLDivElement>();
  const s = clamp(sh, -b, b);
  const a = Math.min(top, b + 4);

  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (stage >= STAGES) { setPlaying(false); return; }
    const id = setTimeout(() => setStage(stage + 1), scaledMs(stage === 0 ? 400 : 1100, speed));
    return () => clearTimeout(id);
  }, [playing, stage, speed, vis.on, lab.open]);

  const pick = (m: Mode) => { setMode(m); setStage(0); setPlaying(false); };
  const set = (m: Mode, nb: number, nh: number, ns: number, na = 3) => { pick(m); setB(nb); setH(nh); setSh(ns); setTop(na); };
  const { A, formula } = areaOf(mode, b, h, a);

  const stageNames: Record<Exclude<Mode, "rect">, string[]> = {
    para: [tx(t, "figArea_sPara0", "the parallelogram"), tx(t, "figArea_sPara1", "cut off the triangle"), tx(t, "figArea_sPara2", "slid across: a rectangle")],
    tri: [tx(t, "figArea_sTri0", "the triangle"), tx(t, "figArea_sTri1", "a copy"), tx(t, "figArea_sTri2", "turned: a parallelogram")],
    trap: [tx(t, "figArea_sTrap0", "the trapezoid"), tx(t, "figArea_sTrap1", "a copy"), tx(t, "figArea_sTrap2", "turned: a parallelogram")],
  };
  const view = (
    <div>
      <AreaDrawing mode={mode} b={b} h={h} s={s} a={a} stage={stage} />
      {mode !== "rect" && (
        <Transport t={t} speed playing={playing}
          onPlay={() => { if (playing) { setPlaying(false); return; } if (stage >= STAGES) setStage(0); setPlaying(true); }}
          playLabel={tx(t, "figArea_play", "rearrange")}
          onStep={stage < STAGES ? () => { setPlaying(false); setStage(stage + 1); } : undefined}
          onBack={stage > 0 ? () => { setPlaying(false); setStage(stage - 1); } : undefined}
          onReset={() => { setPlaying(false); setStage(0); }}
          readout={stageNames[mode][stage]} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["rect", tx(t, "figArea_mRect", "rectangle")],
    ["para", tx(t, "figArea_mPara", "parallelogram")],
    ["tri", tx(t, "figArea_mTri", "triangle")],
    ["trap", tx(t, "figArea_mTrap", "trapezoid")],
  ] as const} />;
  const controls = <>
    <Sliders>
      <Slider label={tx(t, "figArea_b", "base b")} value={b} min={1} max={8} step={0.5} onChange={setB} fmt={n1} />
      <Slider label={tx(t, "figArea_h", "height h")} value={h} min={1} max={6} step={0.5} onChange={setH} fmt={n1} />
      {mode !== "rect" && <Slider label={tx(t, "figArea_s", "lean")} value={sh} min={-3} max={3} step={0.5} onChange={setSh} fmt={n1} />}
      {mode === "trap" && <Slider label={tx(t, "figArea_a", "top a")} value={top} min={0.5} max={5} step={0.5} onChange={setTop} fmt={n1} />}
    </Sliders>
    <Row><Readout color={C.green}>{formula}</Readout></Row>
  </>;
  const note = mode === "rect" ? tx(t, "figArea_noteR", "Area counts unit squares. A rectangle b units wide and h units tall has h rows of b squares each, so b · h squares. With a fractional side the last row or column holds pieces of squares, and the formula still counts them exactly.")
    : mode === "para" ? tx(t, "figArea_noteP2", "A parallelogram leans, but press play: the triangle cut from one end fits exactly onto the other end, and the shape becomes a rectangle with the same base b and the same height h. No area was added or lost, so the parallelogram's area is b · h too. The height is the straight up-and-down distance (dashed), not the slanted side. Change the lean: the area never changes.")
      : mode === "tri" ? tx(t, "figArea_noteT2", "Press play: a copy of the triangle turns half a turn around the middle of its right side. The two copies fit together into a parallelogram with base b and height h, whose area is b · h. The triangle is exactly half of it: ½ · b · h. Any side can be the base, as long as the height is measured perpendicular to that side, from the opposite corner.")
        : tx(t, "figArea_noteZ2", "A trapezoid has two parallel sides, a and b. Press play: a half-turned copy, placed against its slanted side, completes a parallelogram. Its base is a + b (the copy's short side continues the original's long side) and its height is h, so the two copies have area (a + b) · h and one of them has half of that.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figAreaL1_t", "Count the squares"),
      body: <>
        <p>{tx(t, "figAreaL1_b1", "Each grid square is one unit of area. A rectangle b wide and h tall is h rows of b squares.")}</p>
        <p>{tx(t, "figAreaL1_b2", "Find a rectangle that covers exactly 12 squares and is not 6 by 2.")}</p>
      </>,
      goal: { text: tx(t, "figAreaL1_g", "A = 12, with b ≠ 6."), done: mode === "rect" && b * h === 12 && b !== 6 },
      hint: tx(t, "figAreaL1_h", "12 = 3 · 4 = 4 · 3 = 2 · 6. Half units count too: 8 · 1.5 = 12."),
      setup: () => set("rect", 6, 2, 0),
    },
    {
      title: tx(t, "figAreaL2_t", "Cut and slide"),
      body: <p>{tx(t, "figAreaL2_b", "A parallelogram is a leaning rectangle. Press play: a triangle is cut off one end and slides to the other.")}</p>,
      goal: { text: tx(t, "figAreaL2_g", "Turn the parallelogram into a rectangle."), done: mode === "para" && stage === STAGES },
      focus: "play",
      setup: () => set("para", 6, 4, 2),
    },
    {
      title: tx(t, "figAreaL3_t", "Lean the other way"),
      body: <p>{tx(t, "figAreaL3_b", "Drag the lean slider below zero. The slanted sides get longer, but watch the area readout.")}</p>,
      goal: { text: tx(t, "figAreaL3_g", "Make the lean negative."), done: mode === "para" && sh < 0 },
    },
    {
      title: tx(t, "figAreaL4_t", "Half a parallelogram"),
      body: <p>{tx(t, "figAreaL4_b", "Now a triangle. Step forward twice: a copy appears, then turns half a turn around the middle of the right side.")}</p>,
      goal: { text: tx(t, "figAreaL4_g", "Complete the parallelogram."), done: mode === "tri" && stage === STAGES },
      focus: "step",
      setup: () => set("tri", 6, 4, 2),
    },
    {
      title: tx(t, "figAreaL5_t", "Quick check"),
      body: <p>{tx(t, "figAreaL5_b", "A triangular sail has a 4 m base and is 6 m tall.")}</p>,
      quiz: {
        q: tx(t, "figAreaL5_q", "What is its area?"),
        options: ["12 m²", "24 m²", "10 m²", "6 m²"],
        answer: 0,
        why: tx(t, "figAreaL5_w", "½ · 4 · 6 = 12 m². 24 m² is the whole parallelogram, two sails."),
      },
    },
    {
      title: tx(t, "figAreaL6_t", "From trapezoid to parallelogram"),
      body: <>
        <p>{tx(t, "figAreaL6_b1", "A trapezoid has two parallel sides, a on top and b at the bottom. Play the move once to see why the formula has a + b.")}</p>
        <p>{tx(t, "figAreaL6_b2", "Then make the top as long as the bottom.")}</p>
      </>,
      goal: { text: tx(t, "figAreaL6_g", "a = b."), done: mode === "trap" && a === b },
      setup: () => set("trap", 4, 3, 1, 2),
    },
    {
      title: tx(t, "figAreaL7_t", "Quick check"),
      body: <p>{tx(t, "figAreaL7_b", "A trapezoid with parallel sides 3 and 7, 4 apart.")}</p>,
      quiz: {
        q: tx(t, "figAreaL7_q", "What is its area?"),
        options: ["20", "40", "28", "10"],
        answer: 0,
        why: tx(t, "figAreaL7_w", "½ · (3 + 7) · 4 = ½ · 10 · 4 = 20: the average of the parallel sides, 5, times the height, 4."),
      },
    },
  ];

  const slant = Math.hypot(s, h);
  const insights: Insight[] = [
    {
      id: "slant", tone: "info", when: mode === "para" && s !== 0,
      title: tx(t, "figAreaI1_t", "Height, not the slanted side"),
      body: fill(tx(t, "figAreaI1_b", "The slanted side is {sl} long, but the height is still {h}. Leaning moves area from one end to the other; it never adds any. The area stays {b} · {h} = {A}."), { sl: n1(slant), h: n1(h), b: n1(b), A: n1(A) }),
    },
    {
      id: "out", tone: "info", when: mode === "tri" && (s < 0 || s > b),
      title: tx(t, "figAreaI2_t", "The height falls outside"),
      body: tx(t, "figAreaI2_b", "The top corner is past the end of the base, so the triangle is obtuse and the dashed height lands on the base's extension. The formula ½ · b · h still holds."),
    },
    {
      id: "eq", tone: "ok", when: mode === "trap" && a === b,
      title: tx(t, "figAreaI3_t", "It is a parallelogram"),
      body: fill(tx(t, "figAreaI3_b", "With a = b both pairs of sides are parallel. The formula agrees: ½ · ({b} + {b}) · {h} = {b} · {h} = {A}."), { b: n1(b), h: n1(h), A: n1(A) }),
    },
  ];

  const title = tx(t, "figArea_title", "Where area formulas come from");
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
          tx(t, "figAreaR1", "Area counts unit squares: a rectangle is b · h."),
          tx(t, "figAreaR2", "A parallelogram is a rectangle with a piece moved: b · h, with h measured straight across."),
          tx(t, "figAreaR3", "A triangle is half a parallelogram, ½ · b · h; a trapezoid is half of two copies, ½ · (a + b) · h."),
        ]}
      />
    </>
  );
}
