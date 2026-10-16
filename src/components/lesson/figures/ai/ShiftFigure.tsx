"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, C, T, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { seeded } from "./mlp";
import { Cnn, Dense, accuracy, epoch, makeAdam, paramTotal, type Adam, type Model } from "./cnn";
import { CLASSES, N, stroke, strokes } from "./cnnData";

// ── What this figure shows ────────────────────────────────────────────────────
// Two networks learn the same task: say which stroke (—, |, /) a 12×12 image
// holds. Every training image has its stroke in the LEFT half. The dense
// network (144 → 32 ReLU → 3, 4 739 parameters) sees each pixel through its
// own weight; the CNN (4 filters 3×3 → ReLU → global max pool → 3, 55
// parameters) slides the same filters everywhere. Slide the test stroke into
// the right half, which neither network has ever seen.

const TRAIN = strokes(300, "left", seeded(1));
const TEST_R = strokes(300, "right", seeded(3));
const MAX_EPOCHS = 40;

type Run = { cnn: Cnn; dense: Dense; oc: Adam; od: Adam; rc: () => number; rd: () => number; epoch: number; acc: { c: [number, number]; d: [number, number] } };

function fresh(): Run {
  const cnn = new Cnn(4, 3, seeded(1)), dense = new Dense(N * N, 32, 3, seeded(1));
  const r: Run = { cnn, dense, oc: makeAdam(cnn.params, 0.003), od: makeAdam(dense.params, 0.003), rc: seeded(11), rd: seeded(12), epoch: 0, acc: { c: [0, 0], d: [0, 0] } };
  score(r);
  return r;
}

function score(r: Run) {
  r.acc = {
    c: [accuracy(r.cnn, TRAIN), accuracy(r.cnn, TEST_R)],
    d: [accuracy(r.dense, TRAIN), accuracy(r.dense, TEST_R)],
  };
}

const CELL = 13, GX = 14, GY = 24;
const BAR_X = GX + N * CELL + 40, BAR_W = 150;

function Bars({ p, x, y, title, color, sub }: { p: Float64Array; x: number; y: number; title: string; color: string; sub: string }) {
  let best = 0;
  for (let c = 1; c < p.length; c++) if (p[c] > p[best]) best = c;
  return (
    <g>
      <T x={x} y={y} size={9.5} color={color} bold>{title}</T>
      <T x={x} y={y + 12} size={8}>{sub}</T>
      {CLASSES.map((name, c) => (
        <g key={c}>
          <T x={x} y={y + 30 + c * 17} size={10} color={C.fg}>{name}</T>
          <rect x={x + 16} y={y + 21 + c * 17} width={BAR_W} height={11} rx={3} fill="var(--card)" stroke={C.muted} strokeOpacity={0.25} />
          <rect x={x + 16} y={y + 21 + c * 17} width={Math.max(1, BAR_W * p[c])} height={11} rx={3} fill={color} fillOpacity={c === best ? 0.85 : 0.35} />
          <T x={x + BAR_W + 46} y={y + 30 + c * 17} size={8.5} anchor="end" color={C.fg}>{(100 * p[c]).toFixed(0)}%</T>
        </g>
      ))}
    </g>
  );
}

export function ShiftFigure({ t }: { t?: TrackTranslations }) {
  const run = useRef<Run | null>(null);
  if (!run.current) run.current = fresh();
  const [cls, setCls] = useState<"0" | "1" | "2">("1");
  const [cx, setCx] = useState(4);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);
  const rerender = useRerender();
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiShift_${k}`, en);

  const train = (n: number) => {
    const r = run.current!;
    for (let i = 0; i < n && r.epoch < MAX_EPOCHS; i++) {
      epoch(r.cnn, r.oc, TRAIN, 10, r.rc);
      epoch(r.dense, r.od, TRAIN, 10, r.rd);
      r.epoch++;
    }
    score(r);
    rerender();
  };

  useFrame(playing && vis.on, dt => {
    acc.current += dt;
    if (acc.current < 0.3) return;
    acc.current = 0;
    if (run.current!.epoch >= MAX_EPOCHS) { setPlaying(false); return; }
    train(1);
  });

  const r = run.current;
  const img = stroke(Number(cls), 6, cx);
  const inTrain = cx <= 5;
  const pct = (v: number) => `${(100 * v).toFixed(0)}%`;
  const H = GY + 216;

  const model = (m: Model, name: string, color: string, y: number, a: [number, number]) => (
    <Bars p={m.predict(img)} x={BAR_X} y={y} title={name} color={color}
      sub={`${paramTotal(m).toLocaleString("en-US").replace(",", " ")} ${L("params", "params")} · ${L("left", "left")} ${pct(a[0])} · ${L("right", "right")} ${pct(a[1])}`} />
  );

  return (
    <Figure
      title={L("title", "Shift the stroke: dense network vs CNN")}
      head={<Choice value={cls} onChange={setCls} options={[["0", "—"], ["1", "|"], ["2", "/"]] as const} />}
      controls={<>
        <Slider label={L("column", "stroke column")} value={cx} min={2} max={9} step={1} onChange={setCx} fmt={v => `${v}`} width="w-28" />
        <Row>
          <Readout>{L("epoch", "epoch")} {r.epoch}</Readout>
          <Readout color={inTrain ? C.green : C.amber}>{inTrain ? L("seen", "a position like the training images") : L("unseen", "a position never seen in training")}</Readout>
        </Row>
      </>}
      note={L("note", "Press play to train both networks on 300 strokes, all in the left half (the shaded columns). After about 10 epochs both get every training image right. Now drag the stroke to the right. The CNN does not care: its filters slide over the whole image and the max pool keeps only the strongest match, wherever it is, so it scores 100 % on 300 right-half test strokes. The dense network has a separate weight for every pixel, and the pixels of the right half never carried a stroke in training, so it guesses: under 50 % right on the test strokes, where chance is 33 %. A vertical stroke in column 7 comes out as a horizontal one. The CNN does this with 55 parameters; the dense network has 4 739.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <svg viewBox={`0 0 ${BAR_X + BAR_W + 58} ${H}`} className="w-full h-auto" role="img">
          <T x={GX} y={GY - 10} size={9}>{L("test", "test image")} 12×12</T>
          <rect x={GX} y={GY} width={8 * CELL} height={N * CELL} fill={C.green} fillOpacity={0.09} />
          {Array.from(img.px, (v, k) => (
            <rect key={k} x={GX + (k % N) * CELL + 0.5} y={GY + Math.floor(k / N) * CELL + 0.5} width={CELL - 1} height={CELL - 1}
              fill={C.fg} fillOpacity={0.04 + 0.85 * v} />
          ))}
          <rect x={GX} y={GY} width={N * CELL} height={N * CELL} fill="none" stroke={C.muted} strokeOpacity={0.4} />
          <T x={GX + 4 * CELL} y={GY + N * CELL + 14} size={8} anchor="middle" color={C.green}>{L("trainZone", "training strokes")}</T>
          {model(r.dense, L("dense", "dense network"), C.purple, GY + 2, r.acc.d)}
          {model(r.cnn, "CNN", C.teal, GY + 86, r.acc.c)}
          <T x={BAR_X} y={GY + 172} size={8.5}>{L("filters", "the CNN's 4 learned filters")}</T>
          {Array.from({ length: 4 }, (_, f) => {
            const fw = r.cnn.filters.subarray(f * 9, f * 9 + 9);
            const mx = fw.reduce((a, v) => Math.max(a, Math.abs(v)), 1e-9);
            return Array.from(fw, (v, k) => (
              <rect key={`${f}-${k}`} x={BAR_X + f * 44 + (k % 3) * 11} y={GY + 178 + Math.floor(k / 3) * 11} width={10} height={10} rx={1.5}
                fill={v >= 0 ? C.teal : C.red} fillOpacity={0.1 + 0.85 * Math.abs(v) / mx} />
            ));
          })}
        </svg>
        <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)}
          onStep={() => { setPlaying(false); train(1); }}
          onReset={() => { setPlaying(false); run.current = fresh(); rerender(); }}
          readout={`${L("epoch", "epoch")} ${r.epoch} / ${MAX_EPOCHS}`} />
      </div>
    </Figure>
  );
}
