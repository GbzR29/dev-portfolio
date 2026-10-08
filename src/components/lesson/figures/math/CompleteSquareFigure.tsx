"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Sliders, C, T, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Completing the square as a picture. x² + b·x is an x-by-x square plus a
// strip x wide and b long. The Transport plays it in two moves: cut the strip
// in half and swing one half below the square (an L shape: a square of side
// x + b/2 missing a corner of (b/2)²), then fill in that corner.
// So x² + bx = (x + b/2)² − (b/2)². Solving x² + bx = k then only needs a
// square root.

const n = (v: number) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(3)).toString().replace("-", "−");
const STAGES = 2;                                   // 0 whole strip, 1 split and moved, 2 corner added
const W = 560, H = 260, S = 22, X0 = 40, Y0 = 24;

export function CompleteSquareFigure({ t }: { t?: TrackTranslations }) {
  const [b, setB] = useState(6);
  const [x, setX] = useState(4);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-complete-square");
  const vis = useVisible<HTMLDivElement>();

  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (stage >= STAGES) { setPlaying(false); return; }
    const id = setTimeout(() => setStage(stage + 1), scaledMs(1200, speed));
    return () => clearTimeout(id);
  }, [playing, stage, speed, vis.on, lab.open]);

  const h = b / 2;
  const box = (x0: number, y0: number, w: number, hh: number, col: string, label: string, dashed = false) => (
    <g>
      <rect x={x0} y={y0} width={w * S} height={hh * S} fill={col} fillOpacity={dashed ? 0.08 : 0.24} stroke={col} strokeWidth={1.4} strokeDasharray={dashed ? "4 3" : undefined} style={{ transition: "fill-opacity 0.5s ease" }} />
      {w * S > 26 && hh * S > 14 && <T x={x0 + (w * S) / 2} y={y0 + (hh * S) / 2 + 4} size={10} anchor="middle" color={col} bold>{label}</T>}
    </g>
  );
  // The second half of the strip swings from the right of the first half to below the square (a quarter turn).
  const swing = stage >= 1
    ? `translate(${X0}px, ${Y0 + (x + h) * S}px) rotate(-90deg)`
    : `translate(${X0 + (x + h) * S}px, ${Y0}px) rotate(0deg)`;
  const split = stage >= 1, filled = stage >= 2;

  const stageNames = [tx(t, "figCSq_sStrip", "x² + bx"), tx(t, "figCSq_sSplit", "half the strip moved"), tx(t, "figCSq_sCorner", "corner added")];
  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {box(X0, Y0, x, x, C.purple, "x²")}
        {box(X0 + x * S, Y0, h, x, C.sky, `${n(h)}x`)}
        <g style={{ transform: swing, transition: "transform 0.8s ease" }}>
          <rect width={h * S} height={x * S} fill={C.sky} fillOpacity={0.24} stroke={C.sky} strokeWidth={1.4} />
        </g>
        {split
          ? <T x={X0 + (x * S) / 2} y={Y0 + (x + h / 2) * S + 4} size={10} anchor="middle" color={C.sky} bold>{`${n(h)}x`}</T>
          : <T x={X0 + (x + 1.5 * h) * S} y={Y0 + (x * S) / 2 + 4} size={10} anchor="middle" color={C.sky} bold>{`${n(h)}x`}</T>}
        {split && box(X0 + x * S, Y0 + x * S, h, h, C.amber, `${n(h * h)}`, !filled)}
        {split ? <>
          <T x={X0 + ((x + h) * S) / 2} y={Y0 - 8} size={10} anchor="middle" color={C.fg}>{`x + ${n(h)}`}</T>
          <line x1={X0} x2={X0 + (x + h) * S} y1={Y0 - 4} y2={Y0 - 4} stroke={C.axis} />
          {!filled && <T x={X0 + (x + h) * S + 8} y={Y0 + (x + h / 2) * S + 4} size={9.5} color={C.amber}>{tx(t, "figCSq_missing", "← missing (b/2)²")}</T>}
        </> : <>
          <T x={X0 + (x * S) / 2} y={Y0 - 8} size={10} anchor="middle" color={C.fg}>x</T>
          <T x={X0 + (x + b / 2) * S} y={Y0 - 8} size={10} anchor="middle" color={C.fg}>{n(b)}</T>
        </>}
        <T x={X0 - 8} y={Y0 + (x * S) / 2 + 4} size={10} anchor="end" color={C.fg}>x</T>
      </svg>
      <Transport t={t} speed playing={playing}
        onPlay={() => { if (playing) { setPlaying(false); return; } if (stage >= STAGES) setStage(0); setPlaying(true); }}
        playLabel={tx(t, "figCSq_play", "complete the square")}
        onStep={stage < STAGES ? () => { setPlaying(false); setStage(stage + 1); } : undefined}
        onBack={stage > 0 ? () => { setPlaying(false); setStage(stage - 1); } : undefined}
        onReset={() => { setPlaying(false); setStage(0); }}
        readout={stageNames[stage]} />
    </div>
  );

  const controls = <>
    <Sliders>
      <Slider label="b" value={b} min={1} max={8} step={1} onChange={setB} fmt={n} />
      <Slider label="x" value={x} min={1} max={6} step={0.5} onChange={setX} fmt={n} />
    </Sliders>
    <Row>
      <Readout>{`x² + ${n(b)}x = (x + ${n(h)})² − ${n(h * h)}`}</Readout>
      <Readout color={C.amber}>{`x = ${n(x)}: ${n(x * x + b * x)} = ${n((x + h) ** 2)} − ${n(h * h)}`}</Readout>
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figCSqL1_t", "Cut the strip in half"),
      body: <>
        <p>{tx(t, "figCSqL1_b1", "The purple square is x², the blue strip is 6x. Together they are x² + 6x, but they do not make a square.")}</p>
        <p>{tx(t, "figCSqL1_b2", "Step forward: half of the strip swings down below the square.")}</p>
      </>,
      goal: { text: tx(t, "figCSqL1_g", "Move half of the strip."), done: b === 6 && stage >= 1 },
      focus: "step",
      setup: () => { setB(6); setX(4); setStage(0); setPlaying(false); },
    },
    {
      title: tx(t, "figCSqL2_t", "The missing corner"),
      body: <p>{tx(t, "figCSqL2_b", "Now it is almost a square of side x + 3. Only the corner is missing: 3 by 3. Step again to fill it in.")}</p>,
      goal: { text: tx(t, "figCSqL2_g", "Add the corner."), done: b === 6 && stage === 2 },
      focus: "step",
    },
    {
      title: tx(t, "figCSqL3_t", "Quick check"),
      body: <p>{tx(t, "figCSqL3_b", "The corner is always (b/2)².")}</p>,
      quiz: {
        q: tx(t, "figCSqL3_q", "What must be added to x² + 10x to make a perfect square?"),
        options: ["25", "10", "100", "5"],
        answer: 0,
        why: tx(t, "figCSqL3_w", "Half of 10 is 5, and the corner is 5 · 5 = 25: x² + 10x + 25 = (x + 5)²."),
      },
    },
    {
      title: tx(t, "figCSqL4_t", "Another b"),
      body: <p>{tx(t, "figCSqL4_b", "Set b = 8 and run the whole construction. Read the identity in the first readout.")}</p>,
      goal: { text: tx(t, "figCSqL4_g", "b = 8, corner added."), done: b === 8 && stage === 2 },
      focus: "play",
      setup: () => { setB(3); setStage(0); setPlaying(false); },
    },
    {
      title: tx(t, "figCSqL5_t", "Quick check"),
      body: <p>{tx(t, "figCSqL5_b", "Add the corner to both sides of the equation.")}</p>,
      quiz: {
        q: "x² + 6x = 7  ⟹  ?",
        options: ["(x + 3)² = 16", "(x + 3)² = 7", "(x + 6)² = 7", "(x + 3)² = 10"],
        answer: 0,
        why: tx(t, "figCSqL5_w", "The corner is 3² = 9. Adding 9 to both sides: x² + 6x + 9 = 16, and the left side is (x + 3)². So x + 3 = ±4: x = 1 or x = −7."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "corner", tone: "info", when: stage === 1,
      title: tx(t, "figCSqI1_t", "Almost a square"),
      body: fill(tx(t, "figCSqI1_b", "The L shape is a square of side x + {h} with a corner of {h} × {h} = {c} missing: x² + {b}x = (x + {h})² − {c}."), { h: n(h), c: n(h * h), b: n(b) }),
    },
    {
      id: "odd", tone: "info", when: b % 2 === 1,
      title: tx(t, "figCSqI2_t", "An odd b"),
      body: fill(tx(t, "figCSqI2_b", "Half of {b} is {h}, not a whole number. That is fine: the corner is {h}² = {c}, and the identity still holds."), { b: n(b), h: n(h), c: n(h * h) }),
    },
    {
      id: "done", tone: "ok", when: stage === 2,
      title: tx(t, "figCSqI3_t", "A perfect square"),
      body: fill(tx(t, "figCSqI3_b", "x² + {b}x + {c} = (x + {h})². Adding the corner is the step called completing the square; in an equation it must be added to both sides."), { b: n(b), c: n(h * h), h: n(h) }),
    },
  ];

  const title = tx(t, "figCSq_title", "Completing the square");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<LabButton lab={lab} t={t} />}
        controls={controls}
        note={tx(t, "figCSq_note2", "The purple square is x², the blue strip is b·x. Press ▶: the strip is cut into two halves of b/2 and one swings below the square. You get an L shape that is a big square of side x + b/2 with one corner missing. The missing corner is (b/2)², so x² + bx equals the big square minus that corner. Adding the corner to both sides of an equation is exactly the step called completing the square.")}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={controls}
        recap={[
          tx(t, "figCSqR1", "Split the strip bx into two halves and put them on two sides of x²: an L shape."),
          tx(t, "figCSqR2", "The L is a square of side x + b/2 missing a corner of (b/2)²: x² + bx = (x + b/2)² − (b/2)²."),
          tx(t, "figCSqR3", "To solve x² + bx = k, add (b/2)² to both sides and take a square root."),
        ]}
      />
    </>
  );
}
