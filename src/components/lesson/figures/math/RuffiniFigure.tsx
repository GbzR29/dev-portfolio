"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { eq, fr, lcm, mul, type Frac } from "./practice/frac";
import { candidates, evaluate, factorText, fracText, polyText, ruffini } from "./polyDivModel";

// ── What this figure shows ────────────────────────────────────────────────────
// Ruffini's rule (the Briot–Ruffini device, synthetic division) for p(x) ÷
// (x − r), one move at a time: bring the first coefficient down, multiply it
// by r and write the product under the next coefficient (amber arrow), add the
// column (green arrow), and repeat. The bottom row is the quotient's
// coefficients and, in the last box, the remainder, which always equals p(r).
// The chips are the rational root theorem's candidates ±p/q: try them until a
// remainder is 0, then "divide out" to keep going with the smaller quotient.
// "Break it: skip the 0 coefficients" drops the missing powers' columns, and
// the answer comes out wrong.

const W = 560, H = 196, X0 = 112, YT = 52, YP = 96, YL = 116, YB = 146;
const PRESETS: number[][] = [
  [2, -3, 0, 5, -7],
  [1, -6, 11, -6],
  [2, -3, -3, 2],
  [1, 0, -3, 2],
  [3, 4, -5, -2],
  [1, 0, 0, 0, -1],
];
const STEP = 0.7;

/** The same polynomial with whole-number coefficients (times the lcm of the denominators). */
const whole = (cs: Frac[]) => {
  const m = cs.reduce((a, c) => lcm(a, c.d), 1);
  return cs.map(c => mul(c, fr(m)).n);
};

export function RuffiniFigure({ t }: { t?: TrackTranslations }) {
  const [pi, setPi] = useState(0);
  const [stack, setStack] = useState<Frac[][]>([PRESETS[0].map(c => fr(c))]);   // divided-out history
  const [r, setR] = useState<Frac>(fr(2));
  const [s, setS] = useState(99);                     // moves done (clamped to the total)
  const [playing, setPlaying] = useState(false);
  const [acc, setAcc] = useState(0);
  const [skip, setSkip] = useState(false);
  const [tried, setTried] = useState<string[]>([]);
  const [outs, setOuts] = useState<string[]>([]);      // roots divided out, in order
  const lab = useLab("math-ruffini");
  const vis = useVisible<HTMLDivElement>();

  const coefs = stack[stack.length - 1];
  const hasZero = coefs.slice(1).some(c => c.n === 0);
  const used = skip && hasZero ? coefs.filter((c, i) => i === 0 || c.n !== 0) : coefs;
  const res = ruffini(used, r);
  const truth = evaluate(coefs, r);
  const n = used.length - 1, total = 1 + 2 * n, done = Math.min(s, total);
  const finished = done >= total;
  const R = res.remainder, zeroR = R.n === 0;
  const wrong = skip && hasZero && !eq(R, truth);
  const cands = candidates(whole(coefs));
  const key = (f: Frac) => `${f.n}/${f.d}`;

  const reset = (cs: Frac[][]) => { setStack(cs); setS(99); setPlaying(false); setTried([]); setOuts([]); };
  const load = (i: number) => { setPi(i); reset([PRESETS[i].map(c => fr(c))]); setSkip(false); };
  const pickR = (f: Frac) => { setR(f); setS(99); setPlaying(false); setTried(ts => (ts.includes(key(f)) ? ts : [...ts, key(f)])); };
  const divideOut = () => {
    if (!zeroR || skip || coefs.length < 3) return;
    setStack(st => [...st, res.quotient]);
    setOuts(o => [...o, fracText(r)]);
    setS(99); setTried([]);
  };
  const undoDivide = () => { if (stack.length > 1) { setStack(st => st.slice(0, -1)); setOuts(o => o.slice(0, -1)); setS(99); } };

  useFrame(playing && (vis.on || lab.open), dt => {
    const a = acc + dt;
    if (a < STEP) { setAcc(a); return; }
    setAcc(0);
    if (done >= total) setPlaying(false); else setS(done + 1);
  });

  // ── which cells are filled after `done` moves: move 0 brings down column 0,
  // then column k gets its product at move 2k − 1 and its sum at move 2k
  const bottomOn = (k: number) => (k === 0 ? done >= 1 : done >= 2 * k + 1);
  const prodOn = (k: number) => k > 0 && done >= 2 * k;
  const cur = done === 0 ? null : done === 1 ? { k: 0, what: "down" as const } : { k: Math.floor(done / 2), what: done % 2 === 0 ? "mul" as const : "add" as const };
  const cw = Math.min(78, (W - X0 - 20) / (n + 1)), cx = (k: number) => X0 + cw / 2 + k * cw;
  const caption = !cur ? tx(t, "figRuf_c0", "press play: bring down, multiply, add")
    : cur.what === "down" ? fill(tx(t, "figRuf_cDown", "bring down the first coefficient: {a}"), { a: fracText(res.row[0]) })
    : cur.what === "mul" ? fill(tx(t, "figRuf_cMul", "multiply: {a} × {r} = {p}, write it under {c}"), { a: fracText(res.row[cur.k - 1]), r: fracText(r), p: fracText(res.products[cur.k]!), c: fracText(used[cur.k]) })
    : fill(tx(t, "figRuf_cAdd", "add the column: {c} + {p} = {s}"), { c: fracText(used[cur.k]), p: fracText(res.products[cur.k]!), s: fracText(res.row[cur.k]) });

  const box = (k: number, y: number, text: string, color: string, strong = false) => (
    <text x={cx(k)} y={y} textAnchor="middle" fontSize={text.length > 5 ? 12 : 15} fontWeight={strong ? 700 : 500} fill={color}>{text}</text>
  );
  const view = (
    <div ref={vis.ref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <T x={14} y={18} size={10.5} color={C.muted}>{`p(x) = ${polyText(used)}`}</T>
        {/* the frame: r on the left, a vertical bar, the line above the result */}
        <text x={X0 - 40} y={YT} textAnchor="middle" fontSize={16} fontWeight={700} fill={C.purple}>{fracText(r)}</text>
        <line x1={X0 - 12} x2={X0 - 12} y1={YT - 22} y2={YB + 12} stroke={C.fg} strokeWidth={1.6} />
        <line x1={X0 - 12} x2={cx(n) + cw / 2} y1={YL} y2={YL} stroke={C.fg} strokeWidth={1.6} />
        {/* the remainder's box */}
        <rect x={cx(n) - cw / 2 + 6} y={YB - 22} width={cw - 12} height={32} rx={6} fill="none"
          stroke={!finished ? C.axis : wrong ? C.red : zeroR ? C.green : C.amber} strokeWidth={finished ? 2 : 1.2} strokeDasharray={finished ? undefined : "4 4"} />
        {used.map((c, k) => (
          <g key={k}>
            {box(k, YT, fracText(c), C.fg, true)}
            {prodOn(k) && <>
              {box(k, YP, fracText(res.products[k]!), C.amber)}
              <text x={cx(k) - cw / 2 + 6} y={YP} fontSize={11} fill={C.muted}>+</text>
            </>}
            {bottomOn(k) && box(k, YB, fracText(res.row[k]), k === n ? (wrong ? C.red : zeroR ? C.green : C.amber) : C.sky, true)}
          </g>
        ))}
        {/* the move being made */}
        {cur && cur.what === "mul" && (
          <g stroke={C.amber} strokeWidth={1.8} fill="none">
            <path d={`M${cx(cur.k - 1) + 10},${YB - 14} L${cx(cur.k) - 12},${YP + 6}`} />
            <path d={`M${cx(cur.k) - 12},${YP + 6} l-1,8 M${cx(cur.k) - 12},${YP + 6} l-8,2`} />
          </g>
        )}
        {cur && cur.what === "add" && (
          <g stroke={C.green} strokeWidth={1.8} fill="none">
            <path d={`M${cx(cur.k) + cw / 2 - 10},${YT + 6} L${cx(cur.k) + cw / 2 - 10},${YB - 6}`} />
            <path d={`M${cx(cur.k) + cw / 2 - 10},${YB - 6} l-4,-7 M${cx(cur.k) + cw / 2 - 10},${YB - 6} l4,-7`} />
          </g>
        )}
        {cur && cur.what === "down" && (
          <g stroke={C.sky} strokeWidth={1.8} fill="none">
            <path d={`M${cx(0) + 18},${YT + 6} L${cx(0) + 18},${YB - 6} l-4,-7 M${cx(0) + 18},${YB - 6} l4,-7`} />
          </g>
        )}
        <T x={14} y={H - 8} size={10.5} color={cur?.what === "mul" ? C.amber : cur?.what === "add" ? C.green : C.muted} bold>{caption}</T>
      </svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (finished) setS(0); setAcc(0); setPlaying(v => !v); }}
        playLabel={tx(t, "figRuf_play", "run the device")}
        onStep={() => { setPlaying(false); setS(Math.min(total, done + 1)); }}
        onBack={() => { setPlaying(false); setS(Math.max(0, done - 1)); }}
        onReset={() => { setPlaying(false); setS(0); }}
        readout={`${done} / ${total}`} />
    </div>
  );

  const result = finished
    ? (wrong
      ? fill(tx(t, "figRuf_wrong", "wrong: remainder {a}, but p({r}) = {b}"), { a: fracText(R), r: fracText(r), b: fracText(truth) })
      : zeroR
        ? fill(tx(t, "figRuf_exact", "remainder 0: p(x) = ({f})({q})"), { f: factorText(r), q: polyText(res.quotient) })
        : fill(tx(t, "figRuf_rem", "quotient {q}, remainder {a} = p({r})"), { q: polyText(res.quotient), a: fracText(R), r: fracText(r) }))
    : tx(t, "figRuf_running", "the device is running…");
  const controls = <>
    <Row>
      {PRESETS.map((p, i) => <Btn key={i} active={pi === i} onClick={() => load(i)}>{polyText(p.map(c => fr(c)))}</Btn>)}
    </Row>
    <Sliders>
      <Slider label="r" value={r.d === 1 ? r.n : r.n / r.d} min={-4} max={4} step={1} onChange={v => pickR(fr(Math.round(v)))} fmt={() => fracText(r)} />
    </Sliders>
    <Row>
      <span className="text-[11px] text-[var(--text-muted)] self-center">{tx(t, "figRuf_cands", "rational candidates ±p/q:")}</span>
      {cands.map(f => {
        const k = key(f), on = tried.includes(k), root = evaluate(coefs, f).n === 0;
        return <Btn key={k} active={eq(f, r)} onClick={() => pickR(f)}>
          <span style={{ color: on ? (root ? C.green : C.red) : undefined }}>{fracText(f)}</span>
        </Btn>;
      })}
    </Row>
    <Row>
      <Btn onClick={divideOut}>{fill(tx(t, "figRuf_divide", "divide out ({f})"), { f: factorText(r) })}</Btn>
      <Btn onClick={undoDivide}>{tx(t, "figRuf_undo", "undo")}</Btn>
      {hasZero && <Btn active={skip} onClick={() => setSkip(v => !v)}>{tx(t, "figRuf_break", "break it: skip the 0 coefficients")}</Btn>}
    </Row>
    <Row>
      <Readout color={!finished ? undefined : wrong ? C.red : zeroR ? C.green : C.amber}>{result}</Readout>
    </Row>
    {outs.length > 0 && <Row>
      <Readout color={C.purple}>{fill(tx(t, "figRuf_outs", "roots divided out: {l}; left: {q}"), { l: outs.join(", "), q: polyText(coefs) })}</Readout>
    </Row>}
  </>;
  const note = tx(t, "figRuf_note", "The top row holds the coefficients, from the highest power down, with 0 for any missing power. Press play: the first coefficient comes down, then each move multiplies the last bottom number by r (amber) and adds it to the next column (green). The bottom row is the quotient, one degree lower, and the boxed number is the remainder, which is always p(r). Choose r with the slider or try the candidates p/q; when the remainder is 0, divide that factor out and continue with the quotient.");

  // ── Lab ──
  const is = (f: Frac, a: number, b = 1) => eq(f, fr(a, b));
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figRufL1_t", "Bring down, multiply, add"),
      body: <>
        <p>{tx(t, "figRufL1_b1", "Divide 2x⁴ − 3x³ + 5x − 7 by (x − 2). The missing x² already has its 0 in the top row.")}</p>
        <p>{tx(t, "figRufL1_b2", "Press play and follow the arrows to the end.")}</p>
      </>,
      goal: { text: tx(t, "figRufL1_g", "The device finished: quotient 2x³ + x² + 2x + 9, remainder 11."), done: pi === 0 && stack.length === 1 && is(r, 2) && finished && !skip },
      setup: () => { load(0); setR(fr(2)); setS(0); },
    },
    {
      title: tx(t, "figRufL2_t", "Quick check"),
      body: <p>{tx(t, "figRufL2_b", "The remainder theorem says the boxed number is p(2).")}</p>,
      quiz: {
        q: tx(t, "figRufL2_q", "What is p(2) for p(x) = 2x⁴ − 3x³ + 5x − 7?"),
        options: ["11", "9", "−7", "0"],
        answer: 0,
        why: tx(t, "figRufL2_w", "32 − 24 + 10 − 7 = 11: the same number the device ended on, without computing a single power."),
      },
    },
    {
      title: tx(t, "figRufL3_t", "Break it"),
      body: <p>{tx(t, "figRufL3_b", "Turn on \"skip the 0 coefficients\": the device now treats 2x⁴ − 3x³ + 5x − 7 as if it had only four columns.")}</p>,
      goal: { text: tx(t, "figRufL3_g", "A wrong remainder, in red."), done: pi === 0 && skip && wrong },
      setup: () => { load(0); setR(fr(2)); },
    },
    {
      title: tx(t, "figRufL4_t", "Hunting a root"),
      body: <>
        <p>{tx(t, "figRufL4_b1", "Load x³ − 6x² + 11x − 6. Any whole-number root must divide 6, so the candidates are ±1, ±2, ±3, ±6.")}</p>
        <p>{tx(t, "figRufL4_b2", "Try candidates until the remainder is 0.")}</p>
      </>,
      goal: { text: tx(t, "figRufL4_g", "A remainder of 0: (x − r) is a factor."), done: pi === 1 && stack.length === 1 && zeroR && finished },
      setup: () => { load(1); setR(fr(-1)); setSkip(false); },
    },
    {
      title: tx(t, "figRufL5_t", "Divide it out"),
      body: <p>{tx(t, "figRufL5_b", "Press \"divide out\". The cubic is replaced by the quotient, a quadratic, and the hunt goes on there. Find a root of the quadratic and divide it out too.")}</p>,
      goal: { text: tx(t, "figRufL5_g", "Two roots divided out; the linear quotient that is left gives the third: 1, 2 and 3."), done: pi === 1 && outs.length >= 2 && coefs.length === 2 },
      hint: tx(t, "figRufL5_h", "After the first division the quadratic is x² − 5x + 6 (or similar): try its candidates the same way."),
    },
    {
      title: tx(t, "figRufL6_t", "A fraction as root"),
      body: <p>{tx(t, "figRufL6_b", "2x³ − 3x² − 3x + 2: now the leading coefficient is 2, so fractions p/q with q = 2 join the candidates. Find the root 1/2.")}</p>,
      goal: { text: tx(t, "figRufL6_g", "r = 1/2 with remainder 0."), done: pi === 2 && stack.length === 1 && is(r, 1, 2) && zeroR },
      setup: () => { load(2); setR(fr(0)); },
    },
    {
      title: tx(t, "figRufL7_t", "A double root"),
      body: <p>{tx(t, "figRufL7_b", "x³ − 3x + 2: divide out (x − 1), then try 1 again on the quotient. A root that divides out twice is a double root.")}</p>,
      goal: { text: tx(t, "figRufL7_g", "1 divided out twice: x³ − 3x + 2 = (x − 1)²(x + 2)."), done: pi === 3 && outs.filter(o => o === "1").length >= 2 },
      setup: () => { load(3); setR(fr(1)); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "skip", tone: "warn", when: wrong,
      title: tx(t, "figRufI1_t", "A missing column"),
      body: tx(t, "figRufI1_b", "Each column stands for one power of x. Dropping the 0 shifts every later coefficient to the wrong power, so the multiplications by r happen too few times."),
    },
    {
      id: "root", tone: "ok", when: finished && zeroR && !skip,
      title: tx(t, "figRufI2_t", "A root, and a factor"),
      body: fill(tx(t, "figRufI2_b", "p({r}) = 0, so ({f}) divides p(x) exactly: the bottom row, without its last 0, is the other factor."), { r: fracText(r), f: factorText(r) }),
    },
    {
      id: "nocand", tone: "info", when: finished && !zeroR && !cands.some(f => eq(f, r)) && !skip,
      title: tx(t, "figRufI3_t", "Not a candidate"),
      body: tx(t, "figRufI3_b", "This r is not one of the ±p/q candidates, so it cannot be a rational root. The division still works: you get a quotient and the remainder p(r)."),
    },
  ];

  const title = tx(t, "figRuf_title", "Ruffini's rule (Briot–Ruffini)");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<LabButton lab={lab} t={t} />} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view} controls={controls}
        recap={[
          tx(t, "figRufR1", "Write every coefficient, 0 for missing powers; bring the first one down."),
          tx(t, "figRufR2", "Multiply the last bottom number by r, add it to the next column; repeat."),
          tx(t, "figRufR3", "The bottom row is the quotient (one degree lower); the last number is the remainder, p(r)."),
          tx(t, "figRufR4", "Remainder 0 means (x − r) is a factor; rational roots are among ±p/q; divide out and continue."),
        ]}
      />
    </>
  );
}
