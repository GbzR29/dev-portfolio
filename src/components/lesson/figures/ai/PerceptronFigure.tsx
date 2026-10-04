"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, C, T, plot, f2 } from "@/components/lesson/kit/figure";
import { STUDENTS, STUDENTS_CLEAN } from "./data";
import { halfPlane } from "./contours";

// ── What this figure shows ────────────────────────────────────────────────────
// The perceptron learning rule on the students (hours studied h, hours slept
// s). It visits the students in order; when the neuron's answer ŷ is wrong it
// adds (y − ŷ)·x to the weights and (y − ŷ) to the bias, which turns and
// shifts the line towards the student it got wrong (the dashed line is where
// it was before). With the 12 "clean" students a line exists and the rule
// stops after a mistake-free epoch, quickly on centred features, after 804
// epochs on raw hours. With all 14 no line exists: the rule never stops and
// the line keeps jumping. The "pocket" keeps the best weights seen so far.

type Mode = "clean" | "all";
type Feat = "centred" | "raw";
type S = {
  w: [number, number]; b: number;
  i: number; epoch: number; epochMistakes: number; mistakes: number;
  last: { i: number; updated: boolean; prev: [number, number, number] } | null;
  done: boolean;
  pocket: { err: number; w: [number, number]; b: number };
};

const P = plot({ W: 620, H: 300, x0: 0, x1: 7, y0: 2.5, y1: 10 });
const MAX_EPOCHS = 2000;

function setup(mode: Mode, feat: Feat) {
  const data = mode === "clean" ? STUDENTS_CLEAN : STUDENTS;
  const n = data.length;
  const mh = feat === "centred" ? data.reduce((s, r) => s + r[0], 0) / n : 0;
  const ms = feat === "centred" ? data.reduce((s, r) => s + r[1], 0) / n : 0;
  const X = data.map(([h, s]) => [h - mh, s - ms] as [number, number]);
  const Y = data.map(r => r[2]);
  return { data, X, Y, mh, ms };
}
type Setup = ReturnType<typeof setup>;

const errors = (d: Setup, w: [number, number], b: number) =>
  d.X.reduce((e, x, i) => e + (((w[0] * x[0] + w[1] * x[1] + b >= 0) ? 1 : 0) !== d.Y[i] ? 1 : 0), 0);

const fresh = (d: Setup): S => ({
  w: [0, 0], b: 0, i: 0, epoch: 0, epochMistakes: 0, mistakes: 0, last: null, done: false,
  pocket: { err: errors(d, [0, 0], 0), w: [0, 0], b: 0 },
});

/** One visit: the perceptron rule on example s.i. */
function visit(d: Setup, s: S): S {
  if (s.done) return s;
  const x = d.X[s.i], y = d.Y[s.i];
  const yHat = s.w[0] * x[0] + s.w[1] * x[1] + s.b >= 0 ? 1 : 0;
  const e = y - yHat;                                     // +1 missed a pass, −1 missed a fail, 0 right
  const w: [number, number] = [s.w[0] + e * x[0], s.w[1] + e * x[1]];
  const b = s.b + e;
  let pocket = s.pocket;
  if (e !== 0) { const err = errors(d, w, b); if (err < pocket.err) pocket = { err, w, b }; }
  const epochMistakes = s.epochMistakes + (e !== 0 ? 1 : 0);
  const last = { i: s.i, updated: e !== 0, prev: [s.w[0], s.w[1], s.b] as [number, number, number] };
  const endOfPass = s.i === d.X.length - 1;
  if (!endOfPass) return { ...s, w, b, i: s.i + 1, epochMistakes, mistakes: s.mistakes + (e !== 0 ? 1 : 0), last, pocket };
  const epoch = s.epoch + 1;
  return {
    w, b, i: 0, epoch, epochMistakes: 0, mistakes: s.mistakes + (e !== 0 ? 1 : 0), last, pocket,
    done: epochMistakes === 0 || epoch >= MAX_EPOCHS,
  };
}

function visitMany(d: Setup, s: S, epochs: number) {
  const stop = s.epoch + epochs;
  let cur = s;
  while (!cur.done && cur.epoch < stop) cur = visit(d, cur);
  return cur;
}

export function PerceptronFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("clean");
  const [feat, setFeat] = useState<Feat>("centred");
  const d = useMemo(() => setup(mode, feat), [mode, feat]);
  const [st, setSt] = useState<S>(() => fresh(setup("clean", "centred")));
  const L = (k: string, en: string) => tx(t, `figAiPerc_${k}`, en);

  const restart = (m: Mode, f: Feat) => { setMode(m); setFeat(f); setSt(fresh(setup(m, f))); };

  // a line w·(x − μ) + b = 0 in raw hours: s = (−b + w₁μh + w₂μs − w₁h) / w₂
  const line = (w: [number, number], b: number, color: string, dash?: string) => {
    const c = b - w[0] * d.mh - w[1] * d.ms;
    if (Math.hypot(w[0], w[1]) < 1e-9) return null;
    if (Math.abs(w[1]) > 1e-9) {
      const sAt = (h: number) => (-c - w[0] * h) / w[1];
      return <line x1={P.X(P.x0)} y1={P.Y(sAt(P.x0))} x2={P.X(P.x1)} y2={P.Y(sAt(P.x1))} stroke={color} strokeWidth={2} strokeDasharray={dash} />;
    }
    const h = -c / w[0];
    return <line x1={P.X(h)} x2={P.X(h)} y1={0} y2={P.H} stroke={color} strokeWidth={2} strokeDasharray={dash} />;
  };

  // shade the side the neuron calls "pass": a polygon of the view clipped to w·(x − μ) + b ≥ 0
  const passSide = halfPlane((h, s) => st.w[0] * (h - d.mh) + st.w[1] * (s - d.ms) + st.b, P.x0, P.x1, P.y0, P.y1).poly;

  const err = errors(d, st.w, st.b);
  const raw = { w1: st.w[0], w2: st.w[1], b: st.b - st.w[0] * d.mh - st.w[1] * d.ms };
  const current = st.done ? -1 : st.i;

  return (
    <Figure
      title={L("title", "The perceptron rule, one student at a time")}
      head={<>
        <Choice value={mode} onChange={m => restart(m, feat)} options={[["clean", L("clean", "12 students")], ["all", L("all", "all 14")]] as const} />
        <Choice value={feat} onChange={f => restart(mode, f)} options={[["centred", L("centred", "centred")], ["raw", L("raw", "raw hours")]] as const} />
      </>}
      controls={<>
        <Row>
          <Btn onClick={() => setSt(s => visit(d, s))}>{L("one", "next student")}</Btn>
          <Btn onClick={() => setSt(s => visitMany(d, s, 1))}>{L("pass", "one epoch")}</Btn>
          <Btn onClick={() => setSt(s => visitMany(d, s, 100))}>{L("hundred", "100 epochs")}</Btn>
          <Btn onClick={() => setSt(fresh(d))}>{L("reset", "reset")}</Btn>
        </Row>
        <Row>
          <Readout>{L("epoch", "epochs")} {st.epoch}</Readout>
          <Readout>{L("mistakes", "updates")} {st.mistakes}</Readout>
          <Readout color={err === 0 ? C.green : C.fg}>{L("wrong", "wrong now")} {err} / {d.X.length}</Readout>
          <Readout>z = {f2(raw.w1, 2)}·h + {f2(raw.w2, 2)}·s {raw.b < 0 ? "−" : "+"} {f2(Math.abs(raw.b), 2)}</Readout>
          {mode === "all" && <Readout color={C.amber}>{L("pocket", "pocket: best")} {st.pocket.err} {L("wrongShort", "wrong")}</Readout>}
          {st.done && <Readout color={err === 0 ? C.green : C.red}>
            {err === 0 ? L("converged", "stopped: an epoch with no mistakes") : L("gaveUp", `stopped after ${MAX_EPOCHS} epochs`)}
          </Readout>}
        </Row>
      </>}
      note={L("note", "Green dots passed, red dots failed. The neuron predicts \"pass\" on the shaded side of the purple line. The student in the dashed ring is the next one to be checked; when the neuron gets a student wrong, the line jumps (the dashed line is where it was) by adding that student's features to the weights, or subtracting them for a missed fail. With 12 students and centred features the rule finishes in 2 epochs and 3 updates. Switch to raw hours: the same data now needs 804 epochs and 1807 updates, because the line has to end far from the origin and the bias only moves by 1 per update. With all 14 students no line exists, so it never finishes; the pocket remembers the best weights it has met (the amber dotted line: 1 wrong with centred features).")}
    >
      <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto" role="img">
        {passSide.length >= 3 && <polygon points={passSide.map(([h, s]) => `${P.X(h)},${P.Y(s)}`).join(" ")} fill={C.green} fillOpacity={0.1} />}
        {st.last?.updated && line([st.last.prev[0], st.last.prev[1]], st.last.prev[2], C.muted, "5 4")}
        {mode === "all" && line(st.pocket.w, st.pocket.b, C.amber, "2 3")}
        {line(st.w, st.b, C.purple)}
        {feat === "centred" && <g>
          <path d={`M${P.X(d.mh) - 5},${P.Y(d.ms)}h10M${P.X(d.mh)},${P.Y(d.ms) - 5}v10`} stroke={C.muted} strokeWidth={1.4} />
          <T x={P.X(d.mh) + 7} y={P.Y(d.ms) + 12} size={8}>{L("mean", "mean")}</T>
        </g>}
        {[1, 2, 3, 4, 5, 6].map(x => <T key={x} x={P.X(x)} y={P.H - 4} size={8} anchor="middle">{x} h</T>)}
        {[4, 6, 8].map(y => <T key={y} x={4} y={P.Y(y) + 3} size={8}>{y} h</T>)}
        <T x={P.W - 6} y={P.H - 16} size={9} anchor="end" bold color={C.fg}>{L("studied", "studied →")}</T>
        <T x={22} y={14} size={9} bold color={C.fg}>{L("slept", "↑ slept")}</T>
        {d.data.map(([h, s, y], i) => {
          const wrong = ((st.w[0] * d.X[i][0] + st.w[1] * d.X[i][1] + st.b >= 0) ? 1 : 0) !== y;
          const justFixed = st.last?.updated && st.last.i === i;
          return (
            <g key={i}>
              {i === current && <circle cx={P.X(h)} cy={P.Y(s)} r={11} fill="none" stroke={C.amber} strokeWidth={1.8} strokeDasharray="3 2" />}
              {justFixed && <circle cx={P.X(h)} cy={P.Y(s)} r={11} fill="none" stroke={C.purple} strokeWidth={1.8} />}
              <circle cx={P.X(h)} cy={P.Y(s)} r={6} fill={y ? C.green : C.red} stroke={wrong ? C.fg : "var(--code-bg)"} strokeWidth={wrong ? 2.4 : 1.8} />
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
