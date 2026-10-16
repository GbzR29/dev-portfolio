"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { errorRate, seeded, type Act, type OptKind } from "./mlp";
import { circle, spiral, xorCloud, type Pts } from "./nnData";
import { Trainer } from "./trainer";
import { DecisionMap, LossCurve } from "./trainViews";

// ── What this figure shows ────────────────────────────────────────────────────
// A small network trained live on 200 points, in the spirit of the TensorFlow
// Playground. Choose the data, the hidden layers, the activation, the optimiser
// and its learning rate; press play and watch the decision regions form and
// the loss fall. Every setting change starts a fresh network; "new start" draws
// different starting weights with the same settings.

type DataName = "circle" | "xor" | "spiral";
const DATA: Record<DataName, Pts> = {
  circle: circle(200, seeded(11)),
  xor: xorCloud(200, seeded(12)),
  spiral: spiral(200, seeded(13)),
};
const LAYERS = { "2": [2], "3": [3], "8": [8], "8-8": [8, 8], "16-16": [16, 16] } as const;
type Layers = keyof typeof LAYERS;
const RATES: Record<OptKind, readonly string[]> = { sgd: ["0.03", "0.3", "3"], adam: ["0.003", "0.03", "0.3"], momentum: [], rmsprop: [] };
const MAX_EPOCHS = 1500;

type Cfg = { data: DataName; layers: Layers; act: Act; opt: OptKind; lr: string; start: number };

const make = (c: Cfg) => new Trainer(
  { train: DATA[c.data], hidden: [...LAYERS[c.layers]], act: c.act, opt: c.opt, lr: Number(c.lr), batch: 20, seed: 1 }, c.start, 2);

export function PlaygroundFigure({ t }: { t?: TrackTranslations }) {
  const [cfg, setCfg] = useState<Cfg>({ data: "circle", layers: "8", act: "tanh", opt: "adam", lr: "0.03", start: 1 });
  const tr = useRef<Trainer | null>(null);
  if (!tr.current) tr.current = make(cfg);
  const [playing, setPlaying] = useState(false);
  const rerender = useRerender();
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiPlay_${k}`, en);

  const set = (patch: Partial<Cfg>) => {
    const next = { ...cfg, ...patch };
    if (patch.opt && !patch.lr) next.lr = RATES[patch.opt][1];
    setCfg(next);
    tr.current = make(next);
    setPlaying(false);
  };

  useFrame(playing && vis.on, () => {
    const T = tr.current!;
    if (T.epoch >= MAX_EPOCHS) { setPlaying(false); return; }
    T.run(3);
    rerender();
  });

  const T = tr.current;
  const data = DATA[cfg.data];
  const err = errorRate(T.net, data.X, data.Y);
  const loss = T.trainLoss[T.trainLoss.length - 1];

  return (
    <Figure
      title={L("title", "Train a network yourself")}
      head={<Choice value={cfg.data} onChange={d => set({ data: d })} options={[["circle", L("circle", "circle")], ["xor", "XOR"], ["spiral", L("spiral", "spiral")]] as const} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{L("hidden", "hidden layers")}</span>
          <Choice value={cfg.layers} onChange={v => set({ layers: v })} options={(Object.keys(LAYERS) as Layers[]).map(k => [k, k] as const)} />
        </Row>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{L("act", "activation")}</span>
          <Choice value={cfg.act} onChange={v => set({ act: v })} options={[["tanh", "tanh"], ["relu", "ReLU"], ["sigmoid", "sigmoid"]] as const} />
        </Row>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{L("opt", "optimiser")}</span>
          <Choice value={cfg.opt} onChange={v => set({ opt: v })} options={[["sgd", "SGD"], ["adam", "Adam"]] as const} />
          <span className="text-[10px] font-mono text-[var(--text-muted)] ml-2">η</span>
          <Choice value={cfg.lr} onChange={v => set({ lr: v })} options={RATES[cfg.opt].map(r => [r, r] as const)} />
          <button type="button" onClick={() => set({ start: cfg.start + 1 })}
            className="px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]">
            {L("newStart", "new start")}
          </button>
        </Row>
        <Row>
          <Readout>{L("epoch", "epoch")} {T.epoch}</Readout>
          <Readout>{L("loss", "loss")} {loss.toFixed(3)}</Readout>
          <Readout color={err === 0 ? C.green : C.fg}>{L("wrong", "wrong")} {Math.round(err * data.X.length)} / {data.X.length}</Readout>
        </Row>
      </>}
      note={L("note", "Shading is the network's answer at every point of the plane (green: class 1, red: class 0; paler means less sure). The circle needs at least 3 hidden neurons: with 2, the network can only combine two straight edges, and about a quarter of the points stay wrong whatever you do. With 8 tanh neurons and Adam it is solved in about 70 epochs. Try SGD with η = 3 on the circle: the loss jumps up and down for hundreds of epochs. The spiral needs two hidden layers. With 8-8, tanh and Adam it sits on a plateau near 0.66 for about 900 epochs before it suddenly solves it; press \"new start\" and the same settings with other starting weights finish in about 200. Sigmoid with 16-16 and Adam waits about 250 epochs; with SGD it is still stuck after 1500.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <div className="grid gap-3 p-3 sm:grid-cols-2 items-center">
          <div className="flex justify-center"><DecisionMap net={T.net} train={data} /></div>
          <LossCurve series={[{ values: T.trainLoss, color: C.purple, name: L("trainLoss", "training loss") }]}
            epochs={Math.max(200, T.epoch)} label={L("epochs", "epochs")} />
        </div>
        <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)}
          onStep={() => { setPlaying(false); T.run(10); rerender(); }}
          onReset={() => set({})} readout={`${L("epoch", "epoch")} ${T.epoch}`} />
      </div>
    </Figure>
  );
}
