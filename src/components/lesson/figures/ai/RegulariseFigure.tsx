"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, useFrame, useRerender, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { errorRate, seeded, sumSq } from "./mlp";
import { circle, type Pts } from "./nnData";
import { Trainer } from "./trainer";
import { DecisionMap, LossCurve } from "./trainViews";

// ── What this figure shows ────────────────────────────────────────────────────
// Overfitting and three cures, measured. 1100 points from the circle data with
// 10 % of the labels flipped: 100 for training (filled dots, 9 of them have a
// wrong label) and 1000 for validation (8.2 % wrong labels, so no classifier
// can beat 8.2 % there; 300 are drawn as rings). A 2-32-32-1 tanh network
// (1 185 parameters) trained with Adam (η = 0.01, full batch) for 2000 epochs.
// Without help it memorises the 100 points, wrong labels included. The L2
// penalty λ, dropout, and early stopping (the dashed line marks the epoch with
// the lowest validation loss; "best epoch" shows the network saved there).

const ALL = circle(1100, seeded(5), 0.1);
const TRAIN: Pts = { X: ALL.X.slice(0, 100), Y: ALL.Y.slice(0, 100) };
const VAL: Pts = { X: ALL.X.slice(100), Y: ALL.Y.slice(100) };
const VAL_SHOWN: Pts = { X: VAL.X.slice(0, 300), Y: VAL.Y.slice(0, 300) };
const EPOCHS = 2000;
const LAMBDAS = ["0", "0.0003", "0.001", "0.003", "0.01"] as const;
const DROPS = ["0", "0.2", "0.5"] as const;
type Cfg = { l2: (typeof LAMBDAS)[number]; drop: (typeof DROPS)[number] };

const make = (c: Cfg) => new Trainer(
  { train: TRAIN, val: VAL, hidden: [32, 32], act: "tanh", opt: "adam", lr: 0.01, l2: Number(c.l2), dropout: Number(c.drop), batch: 100, seed: 1 }, 2, 9);

const pct = (v: number) => `${(v * 100).toFixed(1)} %`;

export function RegulariseFigure({ t }: { t?: TrackTranslations }) {
  const [cfg, setCfg] = useState<Cfg>({ l2: "0", drop: "0" });
  const [view, setView] = useState<"final" | "best">("final");
  const tr = useRef<Trainer | null>(null);
  if (!tr.current) tr.current = make(cfg);
  const [playing, setPlaying] = useState(false);
  const rerender = useRerender();
  const vis = useVisible<HTMLDivElement>();
  const L = (k: string, en: string) => tx(t, `figAiReg_${k}`, en);

  const set = (patch: Partial<Cfg>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    tr.current = make(next);
    setPlaying(false);
  };

  useFrame(playing && vis.on, () => {
    const T = tr.current!;
    if (T.epoch >= EPOCHS) { setPlaying(false); return; }
    T.run(Math.min(8, EPOCHS - T.epoch));
    rerender();
  });

  const T = tr.current;
  const net = view === "best" ? T.bestNet : T.net;
  const trErr = errorRate(net, TRAIN.X, TRAIN.Y), vaErr = errorRate(net, VAL.X, VAL.Y);

  return (
    <Figure
      title={L("title", "Memorising noise, and three cures")}
      head={<Choice value={view} onChange={setView} options={[["final", L("final", "current network")], ["best", L("best", "best epoch (early stopping)")]] as const} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{L("l2", "L2 penalty λ")}</span>
          <Choice value={cfg.l2} onChange={v => set({ l2: v })} options={LAMBDAS.map(v => [v, v] as const)} />
        </Row>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{L("drop", "dropout p")}</span>
          <Choice value={cfg.drop} onChange={v => set({ drop: v })} options={DROPS.map(v => [v, v] as const)} />
        </Row>
        <Row>
          <Readout>{L("epoch", "epoch")} {T.epoch}</Readout>
          <Readout color={C.purple}>{L("trainErr", "training error")} {pct(trErr)}</Readout>
          <Readout color={C.sky}>{L("valErr", "validation error")} {pct(vaErr)}</Readout>
          <Readout color={C.amber}>{L("bestAt", "lowest validation loss at epoch")} {T.best.epoch} ({pct(T.best.err)})</Readout>
          <Readout>Σw² {sumSq(net).toFixed(0)}</Readout>
        </Row>
      </>}
      note={L("note", "Filled dots are the 100 training points; rings are validation points, which training never sees. 10 % of all labels were flipped at random, so a green dot outside the circle or a red one inside is noise. Press play with no regularisation: the training loss goes to 0 while the validation loss bottoms out near epoch 74 and then climbs, as the network bends its boundary around every noisy point (2000 epochs: 0 % training error, 19.4 % validation error). Now set λ = 0.001: the weights stay small and the boundary stays round (12.9 % validation error). λ = 0.01 is too strong: the network gives up and calls everything \"outside\" (32.7 %). Dropout 0.2 also helps (14.9 %). Or keep no regularisation and look at the best epoch: early stopping keeps the network from epoch 74, with 12.4 %. Nothing can beat 8.2 %, the share of wrong labels among the validation points.")}
    >
      <div ref={vis.ref} className="flex flex-col">
        <div className="grid gap-3 p-3 sm:grid-cols-2 items-center">
          <div className="flex justify-center"><DecisionMap net={net} train={TRAIN} val={VAL_SHOWN} /></div>
          <LossCurve epochs={EPOCHS} label={L("epochs", "epochs (0 – 2000)")}
            marker={T.valLoss.length > 1 ? { epoch: T.best.epoch, label: L("stop", "stop here") } : undefined}
            series={[
              { values: T.trainLoss, color: C.purple, name: L("trainLoss", "training loss") },
              { values: T.valLoss, color: C.sky, name: L("valLoss", "validation loss") },
            ]} />
        </div>
        <Transport t={t} playing={playing} onPlay={() => setPlaying(v => !v)}
          onStep={() => { setPlaying(false); T.run(Math.min(50, EPOCHS - T.epoch)); rerender(); }}
          onReset={() => set({})} readout={`${L("epoch", "epoch")} ${T.epoch} / ${EPOCHS}`} />
      </div>
    </Figure>
  );
}
