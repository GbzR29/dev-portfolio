"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { seeded } from "./mlp";
import { Rnn, makeAdam, memoryTask, seqAccuracy, trainBatch } from "./rnn";

// ── What this figure shows ────────────────────────────────────────────────────
// A 4-unit RNN trained (when the figure opens, in a few milliseconds) on the
// MEMORY task with T = 8: after reading 8 values of ±1 it must say whether the
// FIRST one was +1. The network is drawn unrolled: one copy of the same cell
// per time step, the hidden state h_t passed from each copy to the next.
// Click an input to flip it. "Cut the loop" sets the recurrent weights to 0,
// so each step sees only its own input and the first value is lost.

const STEPS = 8, HID = 4;

function trained() {
  const m = new Rnn(HID, seeded(1)), opt = makeAdam(m.params, 0.02), rng = seeded(101), test = memoryTask(400, STEPS, seeded(99));
  for (let s = 1; s <= 600; s++) {
    trainBatch(m, opt, memoryTask(32, STEPS, rng));
    if (s % 25 === 0 && seqAccuracy(m, test) === 1) break;
  }
  const cut = new Rnn(HID, seeded(1));
  cut.Wh.fill(0); cut.wx.set(m.wx); cut.b.set(m.b); cut.wy.set(m.wy); cut.by.set(m.by);
  return { m, cut, acc: seqAccuracy(m, test), cutAcc: seqAccuracy(cut, test) };
}

const W = 600, H = 250;
const X0 = 46, DX = 64;
const colX = (t: number) => X0 + t * DX;
const Y_IN = 40, Y_CELL = 92, Y_H = 160;

export function RnnStepFigure({ t }: { t?: TrackTranslations }) {
  const nets = useMemo(trained, []);
  const [x, setX] = useState([1, -1, -1, 1, 1, -1, 1, -1]);
  const [mode, setMode] = useState<"loop" | "cut">("loop");
  const [shown, setShown] = useState(STEPS);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiRnn_${k}`, en);

  useFrame(playing && vis.on, dt => {
    acc.current += dt;
    if (acc.current < 0.6) return;
    acc.current = 0;
    setShown(s => { if (s >= STEPS) { setPlaying(false); return s; } return s + 1; });
  });

  const net = mode === "loop" ? nets.m : nets.cut;
  const { h, p } = net.run(x);
  const done = shown >= STEPS;
  const answer = p >= 0.5 ? 1 : 0, truth = x[0] > 0 ? 1 : 0;

  return (
    <Figure
      title={L("title", "An RNN reading a sequence, one step at a time")}
      head={<Choice value={mode} onChange={setMode} options={[["loop", L("loop", "with the loop")], ["cut", L("cut", "cut the loop (break it)")]] as const} />}
      controls={<>
        <Row>
          <Readout>{L("task", "question: was the first value +1?")}</Readout>
          <Readout color={!done ? C.muted : answer === truth ? C.green : C.red}>
            {done ? `p = ${p.toFixed(3)} → ${answer ? L("yes", "yes") : L("no", "no")} (${answer === truth ? L("right", "right") : L("wrong", "wrong")})` : L("reading", "reading…")}
          </Readout>
          <Readout>{L("acc", "on 400 test sequences")} {(100 * (mode === "loop" ? nets.acc : nets.cutAcc)).toFixed(0)}%</Readout>
        </Row>
      </>}
      note={L("note", "Top row: the 8 inputs (click one to flip it). Each box is the same cell with the same weights, drawn once per time step: it mixes the new input with the hidden state it receives from the left, h_t = tanh(W_h·h_{t−1} + w_x·x_t + b). The 4 bars under each box are h_t, from −1 to +1. Step through: within three steps the first and third units lock onto +1 if the first value was +1 (−1 if it was −1) and hold it to the end, while the second unit flips with every new input. Only h_8 reaches the output. Flip the first input and the answer flips; flip any other and it stays. Now cut the loop: with W_h = 0 each step forgets everything before it, h_8 depends only on x_8, and the network is right half the time, a coin toss.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          <defs>
            <marker id="rnnArrow" markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient="auto"><path d="M0,0L7,3.5L0,7z" fill={C.muted} /></marker>
          </defs>
          <T x={8} y={Y_IN + 4} size={9} bold color={C.fg}>x</T>
          <T x={8} y={Y_H + 4} size={9} bold color={C.fg}>h</T>
          {x.map((v, k) => {
            const on = k < shown, cx = colX(k);
            return (
              <g key={k} opacity={on ? 1 : 0.3}>
                <g style={{ cursor: "pointer" }} onClick={() => setX(a => a.map((u, j) => (j === k ? -u : u)))}>
                  <rect x={cx - 17} y={Y_IN - 14} width={34} height={24} rx={5} fill={v > 0 ? C.green : C.red} fillOpacity={0.18}
                    stroke={k === 0 ? C.amber : C.muted} strokeOpacity={k === 0 ? 1 : 0.4} strokeWidth={k === 0 ? 1.8 : 1} />
                  <T x={cx} y={Y_IN + 3} size={10} anchor="middle" color={C.fg} bold>{v > 0 ? "+1" : "−1"}</T>
                </g>
                <line x1={cx} y1={Y_IN + 11} x2={cx} y2={Y_CELL - 16} stroke={C.muted} strokeWidth={1.2} markerEnd="url(#rnnArrow)" />
                <rect x={cx - 21} y={Y_CELL - 15} width={42} height={30} rx={7} fill="var(--card)" stroke={C.teal} strokeWidth={1.6} />
                <T x={cx} y={Y_CELL + 4} size={9} anchor="middle" color={C.teal}>tanh</T>
                {k > 0 && (
                  <line x1={colX(k - 1) + 21} y1={Y_CELL} x2={cx - 23} y2={Y_CELL} stroke={mode === "cut" ? C.red : C.purple}
                    strokeWidth={1.6} strokeDasharray={mode === "cut" ? "3 3" : undefined} markerEnd="url(#rnnArrow)" />
                )}
                <line x1={cx} y1={Y_CELL + 15} x2={cx} y2={Y_H - 26} stroke={C.muted} strokeWidth={1.2} />
                {on && Array.from(h[k], (hv, i) => {
                  const bx = cx - 18 + i * 9.5, mid = Y_H;
                  return <rect key={i} x={bx} y={hv >= 0 ? mid - 22 * hv : mid} width={7.5} height={Math.max(1, 22 * Math.abs(hv))} rx={1.5}
                    fill={hv >= 0 ? C.sky : C.orange} fillOpacity={0.85} />;
                })}
                <line x1={cx - 20} y1={Y_H} x2={cx + 20} y2={Y_H} stroke={C.muted} strokeOpacity={0.5} />
                <T x={cx} y={Y_H + 40} size={8.5} anchor="middle">t = {k + 1}</T>
              </g>
            );
          })}
          <T x={colX(1) / 2 + colX(0) / 2 + 1} y={Y_CELL - 6} size={8} anchor="middle" color={mode === "cut" ? C.red : C.purple}>h</T>
          <T x={(colX(0) + colX(STEPS - 1)) / 2} y={H - 14} size={8.5} anchor="middle" color={mode === "cut" ? C.red : C.purple}>
            {mode === "cut" ? L("cutLabel", "W_h = 0: nothing passes from one step to the next") : L("same", "the same weights W_h, w_x, b at every step")}
          </T>
          <line x1={colX(STEPS - 1) + 21} y1={Y_H} x2={W - 26} y2={Y_H} stroke={C.muted} strokeWidth={1.2} markerEnd="url(#rnnArrow)" opacity={done ? 1 : 0.3} />
          <circle cx={W - 14} cy={Y_H} r={10} fill={done ? (p >= 0.5 ? C.green : C.red) : "var(--card)"} fillOpacity={done ? 0.25 + 0.6 * Math.abs(p - 0.5) * 2 : 1} stroke={C.purple} strokeWidth={1.6} />
          <T x={W - 14} y={Y_H - 16} size={8.5} anchor="middle" color={C.purple}>σ</T>
        </svg>
        <Transport t={t} playing={playing} onPlay={() => { if (shown >= STEPS) setShown(0); setPlaying(v => !v); }}
          onStep={() => { setPlaying(false); setShown(s => Math.min(STEPS, s + 1)); }}
          onBack={() => { setPlaying(false); setShown(s => Math.max(0, s - 1)); }}
          onReset={() => { setPlaying(false); setShown(0); }}
          readout={`t = ${shown} / ${STEPS}`} />
      </div>
    </Figure>
  );
}
