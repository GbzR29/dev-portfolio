"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, C, T, mulberry32, f2 } from "@/components/lesson/kit/figure";
import { sigmoid } from "./data";

// ── What this figure shows ────────────────────────────────────────────────────
// A classifier's probabilities for 40 emails, 12 of them spam (positives). On
// the left, each email is a dot on the probability axis: spam above the line,
// normal mail below. Everything right of the threshold is flagged as spam.
// The confusion matrix counts the four outcomes, and precision, recall and
// the false-positive rate follow from it. On the right, the ROC curve: the
// (false-positive rate, recall) pair for every possible threshold, with the
// current one marked. Sliding the threshold trades one kind of error for the
// other; the model itself does not change.

const NPOS = 12, NNEG = 28;
const S = { x: 20, y: 20, w: 340, h: 170 };             // the probability strip
const R = { x: 410, y: 12, s: 190 };                    // the ROC square

function makeScores() {
  // scores = σ(±1 + 1.4·noise): the two classes overlap, AUC ≈ 0.88
  const rnd = mulberry32(14);
  const g = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const pos = Array.from({ length: NPOS }, () => sigmoid(1 + 1.4 * g()));
  const neg = Array.from({ length: NNEG }, () => sigmoid(-1 + 1.4 * g()));
  return { pos, neg };
}

export function ThresholdFigure({ t }: { t?: TrackTranslations }) {
  const [thr, setThr] = useState(0.5);
  const L = (k: string, en: string) => tx(t, `figAiRoc_${k}`, en);
  const { pos, neg } = useMemo(makeScores, []);

  const TP = pos.filter(p => p >= thr).length, FN = NPOS - TP;
  const FP = neg.filter(p => p >= thr).length, TN = NNEG - FP;
  const precision = TP + FP ? TP / (TP + FP) : 1, recall = TP / NPOS, fpr = FP / NNEG;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const acc = (TP + TN) / (NPOS + NNEG);

  const { roc, auc } = useMemo(() => {
    const ths = [1.01, ...[...pos, ...neg].sort((a, b) => b - a), 0];
    const pts = ths.map(th => [neg.filter(p => p >= th).length / NNEG, pos.filter(p => p >= th).length / NPOS] as [number, number]);
    let wins = 0;                                         // AUC = P(random spam scores above random normal mail)
    for (const p of pos) for (const q of neg) wins += p > q ? 1 : p === q ? 0.5 : 0;
    return { roc: pts, auc: wins / (NPOS * NNEG) };
  }, [pos, neg]);

  const sx = (p: number) => S.x + p * S.w;
  const rx = (v: number) => R.x + v * R.s, ry = (v: number) => R.y + R.s - v * R.s;
  const jitter = (i: number, n: number) => ((i * 11) % n) / n;   // spread dots vertically so they do not overlap

  const cell = (label: string, n: number, color: string) => (
    <span className="px-2 py-1 rounded-md border border-[var(--border)] text-[11px] font-mono text-center" style={{ color }}>{label} {n}</span>
  );

  return (
    <Figure
      title={L("title", "Threshold, confusion matrix and ROC curve")}
      head={<>
        <Btn onClick={() => setThr(0.5)}>0.5</Btn>
        <Btn onClick={() => setThr(0.2)}>{L("catchAll", "catch all spam")}</Btn>
        <Btn onClick={() => setThr(0.9)}>{L("noFalse", "never lose real mail")}</Btn>
      </>}
      controls={<>
        <Slider label={L("threshold", "threshold")} value={thr} min={0.01} max={0.99} step={0.01} onChange={setThr} />
        <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5 max-w-sm items-center text-[10px] text-[var(--text-muted)]">
          <span />
          <span className="text-center">{L("predSpam", "flagged as spam")}</span>
          <span className="text-center">{L("predOk", "let through")}</span>
          <span>{L("isSpam", "spam")}</span>{cell("TP", TP, C.green)}{cell("FN", FN, C.red)}
          <span>{L("isOk", "normal")}</span>{cell("FP", FP, C.red)}{cell("TN", TN, C.green)}
        </div>
        <Row>
          <Readout>{L("accuracy", "accuracy")} {f2(acc, 3)}</Readout>
          <Readout color={C.sky}>{L("precision", "precision")} {f2(precision, 3)}</Readout>
          <Readout color={C.amber}>{L("recall", "recall")} {f2(recall, 3)}</Readout>
          <Readout>F1 {f2(f1, 3)}</Readout>
          <Readout color={C.muted}>{L("fpr", "false-positive rate")} {f2(fpr, 3)}</Readout>
          <Readout color={C.purple}>AUC {f2(auc, 3)}</Readout>
        </Row>
      </>}
      note={L("note", "Dots above the axis are spam, dots below are normal mail; their position is the probability the model gave them. Everything right of the purple threshold is flagged. Precision = TP / (TP + FP) asks \"of what I flagged, how much was spam?\"; recall = TP / (TP + FN) asks \"of all the spam, how much did I catch?\". A low threshold catches every spam but also flags real mail (recall up, precision down); a high one flags only sure cases (precision up, recall down). The ROC curve plots recall against the false-positive rate FP / (FP + TN) for every threshold; the diagonal is guessing at random, and the area under the curve (AUC) is the chance that a random spam gets a higher score than a random normal email.")}
    >
      <svg viewBox="0 0 620 222" className="w-full h-auto" role="img">
        <rect x={sx(thr)} y={S.y} width={S.x + S.w - sx(thr)} height={S.h} fill={C.purple} fillOpacity={0.08} />
        <line x1={S.x} x2={S.x + S.w} y1={S.y + S.h / 2} y2={S.y + S.h / 2} stroke={C.axis} />
        {[0, 0.25, 0.5, 0.75, 1].map(p => <T key={p} x={sx(p)} y={S.y + S.h + 14} size={8} anchor="middle">{p}</T>)}
        <T x={S.x} y={S.y - 6} size={8.5} bold color={C.green}>{L("spamRow", "spam ▲")}</T>
        <T x={S.x} y={S.y + S.h + 26} size={8.5} bold color={C.fg}>{L("okRow", "normal ▼")}</T>
        {pos.map((p, i) => <circle key={`p${i}`} cx={sx(p)} cy={S.y + S.h / 2 - 12 - jitter(i, NPOS) * (S.h / 2 - 20)} r={4.5}
          fill={C.green} fillOpacity={p >= thr ? 1 : 0.35} stroke={p >= thr ? "none" : C.red} strokeWidth={1.5} />)}
        {neg.map((p, i) => <circle key={`n${i}`} cx={sx(p)} cy={S.y + S.h / 2 + 12 + jitter(i, NNEG) * (S.h / 2 - 20)} r={4.5}
          fill={C.sky} fillOpacity={p >= thr ? 0.35 : 1} stroke={p >= thr ? C.red : "none"} strokeWidth={1.5} />)}
        <line x1={sx(thr)} x2={sx(thr)} y1={S.y - 2} y2={S.y + S.h + 2} stroke={C.purple} strokeWidth={2} />

        <rect x={R.x} y={R.y} width={R.s} height={R.s} fill="none" stroke={C.axis} />
        <line x1={rx(0)} y1={ry(0)} x2={rx(1)} y2={ry(1)} stroke={C.muted} strokeDasharray="4 4" />
        <path d={roc.map(([a, b], i) => `${i ? "L" : "M"}${rx(a).toFixed(1)},${ry(b).toFixed(1)}`).join("")} fill="none" stroke={C.purple} strokeWidth={2} />
        <circle cx={rx(fpr)} cy={ry(recall)} r={5} fill={C.amber} stroke="var(--code-bg)" strokeWidth={1.5} />
        <T x={R.x + R.s / 2} y={R.y + R.s + 14} size={8} anchor="middle">{L("fprAxis", "false-positive rate →")}</T>
        <T x={R.x - 6} y={R.y + 10} size={8} anchor="end">{L("recallAxis", "recall")}</T>
        <T x={R.x - 6} y={R.y + 20} size={8} anchor="end">↑</T>
      </svg>
    </Figure>
  );
}
