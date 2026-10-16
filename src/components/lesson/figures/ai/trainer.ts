// ── A training run that a figure can advance a few epochs per frame ───────────
// Holds the network, the optimiser, its random stream and the loss history.
// Figures keep one in a ref and replace it when a setting changes.

import { cloneNet, errorRate, makeNet, makeOpt, meanLoss, seeded, trainEpoch, type Act, type Net, type Opt, type OptKind, type Rng } from "./mlp";
import type { Pts } from "./nnData";

export type TrainCfg = {
  train: Pts; val?: Pts;
  hidden: number[]; act: Act;
  opt: OptKind; lr: number; l2?: number; dropout?: number;
  batch: number; seed: number;
};

export class Trainer {
  readonly cfg: TrainCfg;
  net: Net; opt: Opt; rng: Rng;
  epoch = 0;
  trainLoss: number[] = []; valLoss: number[] = [];
  /** Epoch with the lowest validation loss so far (early stopping), its loss and validation error. */
  best = { epoch: 0, loss: Infinity, err: 1 };
  /** A copy of the network at that epoch. */
  bestNet: Net;

  constructor(cfg: TrainCfg, initNetSeed: number, trainSeed: number) {
    this.cfg = cfg;
    this.net = makeNet([2, ...cfg.hidden, 1], cfg.act, seeded(initNetSeed), cfg.act === "relu" ? "he" : "xavier");
    this.opt = makeOpt(this.net, cfg.opt, cfg.lr, cfg.l2 ?? 0);
    this.rng = seeded(trainSeed);
    this.bestNet = this.net;
    this.record();
  }

  private record() {
    const { train, val } = this.cfg;
    this.trainLoss.push(meanLoss(this.net, train.X, train.Y));
    if (val) {
      const v = meanLoss(this.net, val.X, val.Y);
      this.valLoss.push(v);
      if (v < this.best.loss) {
        this.best = { epoch: this.epoch, loss: v, err: errorRate(this.net, val.X, val.Y) };
        this.bestNet = cloneNet(this.net);
      }
    }
  }

  run(epochs: number) {
    const { train, batch, dropout } = this.cfg;
    for (let e = 0; e < epochs; e++) {
      trainEpoch(this.net, this.opt, train.X, train.Y, batch, this.rng, dropout ?? 0);
      this.epoch++;
      this.record();
    }
  }
}
