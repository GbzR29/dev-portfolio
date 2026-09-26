"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Bayes' theorem as a head count. A test for a disease is given to 1000
// people (50 columns of 20). The prevalence is the share who have the disease, the sensitivity
// the share of sick people it flags, the false positive rate the share of
// healthy people it wrongly flags. Red dots are sick people who test positive,
// hollow red dots sick people it misses, amber dots healthy people who test
// positive, grey dots healthy negatives. Among everyone who tests positive
// (red + amber), the red share is P(sick | positive). With a rare disease the
// amber crowd is larger than the red one, even for a good test. The tree mode
// shows the same numbers as probabilities multiplied along branches.

const N = 1000, ROWS = 20, CELL = 11, W = 560, H = ROWS * CELL + 10;
const pct = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;

export function BayesFigure({ t }: { t?: TrackTranslations }) {
  const [prev, setPrev] = useState(0.01);
  const [sens, setSens] = useState(0.9);
  const [fpr, setFpr] = useState(0.09);
  const [mode, setMode] = useState<"people" | "tree">("people");
  const [posOnly, setPosOnly] = useState(false);

  const sick = Math.round(N * prev), tp = Math.round(sick * sens);
  const healthy = N - sick, fp = Math.round(healthy * fpr);
  const exact = (prev * sens) / (prev * sens + (1 - prev) * fpr);

  const kind = (i: number) => (i < tp ? "tp" : i < sick ? "fn" : i < sick + fp ? "fp" : "tn");

  return (
    <Figure
      title={tx(t, "figBayes_title", "Bayes: who really is sick?")}
      head={<>
        <Choice value={mode} onChange={setMode} options={[["people", tx(t, "figBayes_people", "1000 people")], ["tree", tx(t, "figBayes_tree", "tree")]]} />
        {mode === "people" && <Btn active={posOnly} onClick={() => setPosOnly(v => !v)}>{tx(t, "figBayes_posOnly", "positives only")}</Btn>}
      </>}
      controls={<>
        <Slider label={tx(t, "figBayes_prev", "prevalence")} value={prev} min={0.001} max={0.5} step={0.001} onChange={setPrev} fmt={pct} width="w-28" />
        <Slider label={tx(t, "figBayes_sens", "sensitivity")} value={sens} min={0.5} max={1} step={0.01} onChange={setSens} fmt={pct} width="w-28" />
        <Slider label={tx(t, "figBayes_fpr", "false positive rate")} value={fpr} min={0} max={0.3} step={0.005} onChange={setFpr} fmt={pct} width="w-28" />
        <Row>
          <Readout color={C.red}>{`${tx(t, "figBayes_tp", "sick & +")}: ${tp}`}</Readout>
          <Readout color={C.amber}>{`${tx(t, "figBayes_fp", "healthy & +")}: ${fp}`}</Readout>
          <Readout>{`P(${tx(t, "figBayes_sick", "sick")} | +) ≈ ${tp}/(${tp} + ${fp}) = ${tp + fp ? f2(tp / (tp + fp), 3) : "—"}`}</Readout>
          <Readout color={C.green}>{`${tx(t, "figBayes_exact", "exact")}: ${f2(exact, 3)}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figBayes_note", "The question a patient asks is not \"how often does the test catch the disease?\" (the sensitivity) but \"I tested positive: how likely is it that I am sick?\". Count it: of everyone who tests positive, what share is red? With 1 % prevalence, 90 % sensitivity and 9 % false positives, about 9 people are true positives and about 89 are false alarms, so a positive result means only about a 9 % chance of disease. Raise the prevalence and watch the answer climb.")}
    >
      {mode === "people" ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {Array.from({ length: N }, (_, i) => {
            const k = kind(i), x = 10 + Math.floor(i / ROWS) * CELL + CELL / 2, y = 5 + (i % ROWS) * CELL + CELL / 2;
            const hide = posOnly && (k === "fn" || k === "tn");
            const fill = k === "tp" ? C.red : k === "fp" ? C.amber : k === "tn" ? C.muted : "none";
            return <circle key={i} cx={x} cy={y} r={4} fill={fill} stroke={k === "fn" ? C.red : "none"} strokeWidth={1.3}
              opacity={hide ? 0.08 : k === "tn" ? 0.35 : 1} />;
          })}
        </svg>
      ) : (
        <TreeView prev={prev} sens={sens} fpr={fpr} t={t} />
      )}
    </Figure>
  );
}

/** The two-level probability tree: condition first, then the test result. */
function TreeView({ prev, sens, fpr, t }: { prev: number; sens: number; fpr: number; t?: TrackTranslations }) {
  const TH = 230, root = { x: 30, y: 115 }, mid = [{ x: 200, y: 60 }, { x: 200, y: 170 }];
  const leaves = [{ x: 360, y: 30 }, { x: 360, y: 90 }, { x: 360, y: 140 }, { x: 360, y: 200 }];
  const pSick = [prev, 1 - prev], pPos = [sens, fpr];
  const edge = (a: { x: number; y: number }, b: { x: number; y: number }, label: string, col: string) => (
    <g key={`${a.x}${a.y}${b.y}`}>
      <line x1={a.x} y1={a.y} x2={b.x - 8} y2={b.y} stroke={col} strokeWidth={1.6} />
      <T x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 5} anchor="middle" color={col}>{label}</T>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} ${TH}`} className="w-full h-auto">
      <circle cx={root.x} cy={root.y} r={5} fill={C.fg} />
      {mid.map((m, i) => edge(root, m, pct(pSick[i]), C.muted))}
      {mid.map((m, i) => <T key={`m${i}`} x={m.x} y={m.y + 4} bold color={i === 0 ? C.red : C.fg}>{i === 0 ? tx(t, "figBayes_sick", "sick") : tx(t, "figBayes_healthy", "healthy")}</T>)}
      {leaves.map((l, j) => {
        const i = j >> 1, pos = j % 2 === 0, m = mid[i];
        const pr = pos ? pPos[i] : 1 - pPos[i], prod = pSick[i] * pr;
        const col = pos ? (i === 0 ? C.red : C.amber) : C.muted;
        return <g key={`l${j}`}>
          {edge({ x: m.x + 48, y: m.y }, l, pct(pr), col)}
          <T x={l.x} y={l.y + 4} bold color={col}>{pos ? "+" : "−"}</T>
          <T x={l.x + 16} y={l.y + 4} color={col}>{`${f2(pSick[i], 3)} × ${f2(pr, 3)} = ${f2(prod, 4)}`}</T>
        </g>;
      })}
    </svg>
  );
}
