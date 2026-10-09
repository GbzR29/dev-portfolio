"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

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
// The Transport runs repeated, independent tests on the people who tested
// positive: each ⏭ makes the last posterior the new prior (the prevalence).
// The lab: guess first, count the positives, the base rate, the false alarm
// rate as the lever, a second test.

const N = 1000, ROWS = 20, CELL = 11, W = 560, H = ROWS * CELL + 10;
const pct = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
const MAX_TESTS = 6;

/** P(sick | +) for a prior p. */
const posterior = (p: number, sens: number, fpr: number) => (p * sens) / (p * sens + (1 - p) * fpr);

export function BayesFigure({ t }: { t?: TrackTranslations }) {
  const [prev, setPrevRaw] = useState(0.01);
  const [sens, setSens] = useState(0.9);
  const [fpr, setFpr] = useState(0.09);
  const [mode, setMode] = useState<"people" | "tree">("people");
  const [posOnly, setPosOnly] = useState(false);
  const [priors, setPriors] = useState<number[]>([]);        // earlier prevalences, one per extra test
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);
  const lab = useLab("math-bayes");
  const vis = useVisible<HTMLDivElement>();

  const sick = Math.round(N * prev), tp = Math.round(sick * sens);
  const healthy = N - sick, fp = Math.round(healthy * fpr);
  const exact = posterior(prev, sens, fpr);
  const tests = priors.length + 1;

  // Moving a slider by hand starts a fresh first test.
  const setPrev = (v: number) => { setPrevRaw(v); setPriors([]); setPlaying(false); };
  const testAgain = () => { if (exact >= 0.999 || tests >= MAX_TESTS) return false; setPriors([...priors, prev]); setPrevRaw(exact); return true; };
  const undo = () => { if (!priors.length) return; setPrevRaw(priors[priors.length - 1]); setPriors(priors.slice(0, -1)); };
  const restart = () => { if (priors.length) setPrevRaw(priors[0]); setPriors([]); };
  useFrame(playing && (vis.on || lab.open), dt => {
    acc.current += dt;
    if (acc.current > 1.3) { acc.current = 0; if (!testAgain()) setPlaying(false); }
  });
  const stop = () => setPlaying(false);
  const setAll = (p: number, se: number, fa: number) => { setPrev(p); setSens(se); setFpr(fa); };

  const kind = (i: number) => (i < tp ? "tp" : i < sick ? "fn" : i < sick + fp ? "fp" : "tn");

  const view = (
    <div>
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
      <Transport t={t} playing={playing}
        onPlay={() => { if (tests >= MAX_TESTS || exact >= 0.999) restart(); acc.current = 0; setPlaying(p => !p); }}
        playLabel={tx(t, "figBayes_keepTesting", "keep testing the positives again")}
        onStep={() => { stop(); testAgain(); }}
        onBack={() => { stop(); undo(); }}
        onReset={() => { stop(); restart(); }}
        readout={fill(tx(t, "figBayes_testNo", "test {n}"), { n: tests })} />
    </div>
  );

  const head = <>
    <Choice value={mode} onChange={setMode} options={[["people", tx(t, "figBayes_people", "1000 people")], ["tree", tx(t, "figBayes_tree", "tree")]]} />
    {mode === "people" && <Btn active={posOnly} onClick={() => setPosOnly(v => !v)}>{tx(t, "figBayes_posOnly", "positives only")}</Btn>}
  </>;
  const controls = <>
    <Slider label={tx(t, "figBayes_prev", "prevalence")} value={prev} min={0.001} max={0.99} step={0.001} onChange={setPrev} fmt={pct} width="w-28" />
    <Slider label={tx(t, "figBayes_sens", "sensitivity")} value={sens} min={0.5} max={1} step={0.01} onChange={v => { setSens(v); setPriors([]); }} fmt={pct} width="w-28" />
    <Slider label={tx(t, "figBayes_fpr", "false positive rate")} value={fpr} min={0} max={0.3} step={0.005} onChange={v => { setFpr(v); setPriors([]); }} fmt={pct} width="w-28" />
    <Row>
      <Readout color={C.red}>{`${tx(t, "figBayes_tp", "sick & +")}: ${tp}`}</Readout>
      <Readout color={C.amber}>{`${tx(t, "figBayes_fp", "healthy & +")}: ${fp}`}</Readout>
      <Readout>{`P(${tx(t, "figBayes_sick", "sick")} | +) ≈ ${tp}/(${tp} + ${fp}) = ${tp + fp ? f2(tp / (tp + fp), 3) : "—"}`}</Readout>
      <Readout color={C.green}>{`${tx(t, "figBayes_exact", "exact")}: ${f2(exact, 3)}`}</Readout>
    </Row>
  </>;
  const note = tx(t, "figBayes_note2", "The question a patient asks is not \"how often does the test catch the disease?\" (the sensitivity) but \"I tested positive: how likely is it that I am sick?\". Count it: of everyone who tests positive, what share is red? With 1 % prevalence, 90 % sensitivity and 9 % false positives, about 9 people are true positives and about 89 are false alarms, so a positive result means only about a 9 % chance of disease. Press ⏭ to test the positives a second time: the 9 % becomes the new prevalence, and a second positive lifts it to about 50 %.");

  // ── Lab ──
  const post = f2(exact, 3);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figBayesL1_t", "Guess first"),
      body: <p>{tx(t, "figBayesL1_b", "1 person in 100 has the disease. The test catches 90 % of sick people and wrongly flags 9 % of healthy ones. Don't look at the readouts yet.")}</p>,
      quiz: {
        q: tx(t, "figBayesL1_q", "You test positive. Roughly how likely is it that you are sick?"),
        options: ["9 %", "90 %", "50 %", "1 %"],
        answer: 0,
        why: tx(t, "figBayesL1_w", "Of 1000 people, 10 are sick and 9 of them test positive; 990 are healthy and about 89 of them test positive too. Only 9 of the 98 positives are sick: about 9 %. 90 % is the sensitivity, a different question."),
      },
      setup: () => { stop(); setAll(0.01, 0.9, 0.09); setMode("people"); setPosOnly(false); },
    },
    {
      title: tx(t, "figBayesL2_t", "Only the positives"),
      body: <>
        <p>{tx(t, "figBayesL2_b1", "A positive result tells you that you are one of the coloured dots, red or amber. Everyone else is no longer possible.")}</p>
        <p>{tx(t, "figBayesL2_b2", "Turn on \"positives only\" and compare the two colours.")}</p>
      </>,
      goal: { text: tx(t, "figBayesL2_g", "Positives only, in the people view."), done: posOnly && mode === "people" },
      hint: tx(t, "figBayesL2_h", "About 9 red dots against about 89 amber ones."),
    },
    {
      title: tx(t, "figBayesL3_t", "The base rate"),
      body: <>
        <p>{tx(t, "figBayesL3_b1", "The test stays the same; only the prevalence changes, as when a doctor tests only patients who already have symptoms.")}</p>
        <p>{tx(t, "figBayesL3_b2", "Raise the prevalence until a positive result means at least a 50 % chance of being sick.")}</p>
      </>,
      goal: { text: fill(tx(t, "figBayesL3_g", "P(sick | +) ≥ 0.5 with the same test (now {p})."), { p: post }), done: exact >= 0.5 && sens === 0.9 && fpr === 0.09 },
      hint: tx(t, "figBayesL3_h", "Around 9 % prevalence the red and amber groups are the same size."),
      setup: () => { stop(); setAll(0.01, 0.9, 0.09); },
    },
    {
      title: tx(t, "figBayesL4_t", "The real lever"),
      body: <>
        <p>{tx(t, "figBayesL4_b1", "Back to 1 % prevalence. This time improve the test instead.")}</p>
        <p>{tx(t, "figBayesL4_b2", "Get P(sick | +) to at least 0.5 by changing the test's two numbers.")}</p>
      </>,
      goal: { text: fill(tx(t, "figBayesL4_g", "1 % prevalence and P(sick | +) ≥ 0.5 (now {p})."), { p: post }), done: Math.abs(prev - 0.01) < 1e-6 && exact >= 0.5 },
      hint: tx(t, "figBayesL4_h", "Even 100 % sensitivity only gives 0.10. The amber crowd shrinks only with the false positive rate: bring it below 1 %."),
      setup: () => { stop(); setAll(0.01, 0.9, 0.09); },
    },
    {
      title: tx(t, "figBayesL5_t", "Quick check"),
      body: <p>{tx(t, "figBayesL5_b", "With a rare disease almost everyone tested is healthy.")}</p>,
      quiz: {
        q: tx(t, "figBayesL5_q", "At 1 % prevalence, which change makes a positive result more convincing?"),
        options: [
          tx(t, "figBayesL5_o1", "false positive rate 9 % → 1 %"),
          tx(t, "figBayesL5_o2", "sensitivity 90 % → 99 %"),
          tx(t, "figBayesL5_o3", "both help the same"),
          tx(t, "figBayesL5_o4", "neither changes it"),
        ],
        answer: 0,
        why: tx(t, "figBayesL5_w", "The false alarms come from the 990 healthy people: cutting their rate from 9 % to 1 % removes about 79 amber dots and lifts P(sick | +) to about 0.48. Better sensitivity adds less than one red dot: 0.092 becomes 0.100."),
      },
    },
    {
      title: tx(t, "figBayesL6_t", "Test again"),
      body: <>
        <p>{tx(t, "figBayesL6_b1", "Send everyone who tested positive for a second, independent test. Among them the share of sick people is no longer 1 % but about 9 %: yesterday's posterior is today's prior.")}</p>
        <p>{tx(t, "figBayesL6_b2", "Press ⏭ to run the second test.")}</p>
      </>,
      goal: { text: fill(tx(t, "figBayesL6_g", "A second test (now test {n}, P(sick | +) = {p})."), { n: tests, p: post }), done: tests >= 2 },
      hint: tx(t, "figBayesL6_h", "Each positive multiplies the odds by 0.9/0.09 = 10: 1 : 99 becomes 10 : 99, then 100 : 99, about 50 %."),
      focus: "step",
      setup: () => { stop(); setAll(0.01, 0.9, 0.09); setPosOnly(false); },
    },
    {
      title: tx(t, "figBayesL7_t", "The same numbers as a tree"),
      body: <>
        <p>{tx(t, "figBayesL7_b1", "The tree shows the same calculation with probabilities: multiply along each path, then compare the two \"+\" paths.")}</p>
        <p>{tx(t, "figBayesL7_b2", "Switch to the tree view.")}</p>
      </>,
      goal: { text: tx(t, "figBayesL7_g", "The tree view is shown."), done: mode === "tree" },
      setup: () => { stop(); setAll(0.01, 0.9, 0.09); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "base", tone: "warn", when: prev < 0.05 && exact < 0.5 && fpr > 0,
      title: tx(t, "figBayesI1_t", "False alarms win"),
      body: fill(tx(t, "figBayesI1_b", "The healthy crowd is so large that its few false alarms ({f}) outnumber the true positives ({s}). A positive result means only {p}."), { f: fp, s: tp, p: post }),
    },
    {
      id: "nofp", tone: "ok", when: fpr === 0,
      title: tx(t, "figBayesI2_t", "No false alarms"),
      body: tx(t, "figBayesI2_b", "With a false positive rate of 0, every positive is a sick person: P(sick | +) = 1, however rare the disease."),
    },
    {
      id: "again", tone: "info", when: tests >= 2,
      title: tx(t, "figBayesI3_t", "Evidence piles up"),
      body: fill(tx(t, "figBayesI3_b", "Test {n}: the prevalence among the people still being tested is now {q}, the posterior of the previous test. One more positive lifts it to {p}."), { n: tests, q: pct(prev), p: post }),
    },
    {
      id: "half", tone: "info", when: tests === 1 && exact > 0.45 && exact < 0.55,
      title: tx(t, "figBayesI4_t", "A coin flip"),
      body: tx(t, "figBayesI4_b", "Red and amber are about the same size: after a positive result, sick and healthy are about equally likely."),
    },
  ];

  const title = tx(t, "figBayes_title", "Bayes: who really is sick?");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{head}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{head}</Row>{controls}</>}
        recap={[
          tx(t, "figBayesR1", "P(sick | +) is the share of sick people among everyone who tests positive, not the sensitivity."),
          tx(t, "figBayesR2", "With a rare condition the false alarms from the large healthy group can outnumber the true positives."),
          tx(t, "figBayesR3", "The false positive rate, not the sensitivity, decides how convincing a positive is for a rare disease."),
          tx(t, "figBayesR4", "A second independent test uses the first posterior as its prior: evidence accumulates."),
        ]}
      />
    </>
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
