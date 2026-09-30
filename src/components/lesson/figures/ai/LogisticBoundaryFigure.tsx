"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, plot, f2 } from "@/components/lesson/kit/figure";
import { STUDENTS, sigmoid, meanStd } from "./data";

// ── What this figure shows ────────────────────────────────────────────────────
// Logistic regression with two features: hours studied and hours slept. The
// background is the model's probability of passing at every point (green
// above 0.5, red below, paler near 0.5). Where w₁h + w₂s + b = 0 the
// probability is exactly 0.5: that set is a straight line, the decision
// boundary. The epochs slider replays gradient descent from w = b = 0, so the
// line can be seen appearing, turning and sharpening; the threshold slider
// moves the line to where p equals the threshold instead of 0.5.

const P = plot({ W: 620, H: 300, x0: 0, x1: 7, y0: 2.5, y1: 10 });
const CELL = 12;                                         // background resolution in viewBox units
const MH = meanStd(STUDENTS.map(r => r[0])), MS = meanStd(STUDENTS.map(r => r[1]));

/** Gradient descent on standardised features (η = 0.5), returned in raw hours. */
function train(epochs: number) {
  let a = 0, c = 0, b = 0;
  for (let ep = 0; ep < epochs; ep++) {
    let ga = 0, gc = 0, gb = 0;
    for (const [h, s, y] of STUDENTS) {
      const zh = (h - MH.m) / MH.sd, zs = (s - MS.m) / MS.sd;
      const e = sigmoid(a * zh + c * zs + b) - y;         // p − y
      ga += e * zh; gc += e * zs; gb += e;
    }
    const n = STUDENTS.length;
    a -= 0.5 * ga / n; c -= 0.5 * gc / n; b -= 0.5 * gb / n;
  }
  // back to hours: a·(h − μ)/σ = (a/σ)·h − aμ/σ
  const w1 = a / MH.sd, w2 = c / MS.sd;
  return { w1, w2, b: b - w1 * MH.m - w2 * MS.m };
}

export function LogisticBoundaryFigure({ t }: { t?: TrackTranslations }) {
  const [lgEp, setLgEp] = useState(Math.log10(300));
  const [thr, setThr] = useState(0.5);
  const L = (k: string, en: string) => tx(t, `figAiBound_${k}`, en);

  const epochs = lgEp <= 0 ? 0 : Math.round(10 ** lgEp);
  const m = useMemo(() => train(epochs), [epochs]);
  const prob = (h: number, s: number) => sigmoid(m.w1 * h + m.w2 * s + m.b);

  let loss = 0, correct = 0;
  for (const [h, s, y] of STUDENTS) {
    const p = Math.min(Math.max(prob(h, s), 1e-12), 1 - 1e-12);
    loss -= y ? Math.log(p) : Math.log(1 - p);
    if ((p >= thr) === (y === 1)) correct++;
  }
  loss /= STUDENTS.length;

  const cells = useMemo(() => {
    const out: { x: number; y: number; p: number }[] = [];
    for (let x = 0; x < P.W; x += CELL)
      for (let y = 0; y < P.H; y += CELL) {
        const q = P.inv({ x: x + CELL / 2, y: y + CELL / 2 });
        out.push({ x, y, p: sigmoid(m.w1 * q.x + m.w2 * q.y + m.b) });
      }
    return out;
  }, [m]);

  // the line where p = thr: w₁h + w₂s + b = ln(thr / (1 − thr))
  const logit = Math.log(thr / (1 - thr));
  const hasLine = Math.hypot(m.w1, m.w2) > 1e-6;
  const sAt = (h: number) => (logit - m.b - m.w1 * h) / m.w2;

  return (
    <Figure
      title={L("title", "A logistic model with two features")}
      head={<>
        <Btn onClick={() => setLgEp(0)}>{L("start", "start")}</Btn>
        <Btn onClick={() => setLgEp(Math.log10(5000))}>{L("trained", "trained")}</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label={L("epochs", "epochs")} value={lgEp} min={0} max={Math.log10(5000)} step={0.01} onChange={setLgEp} fmt={() => `${epochs}`} />
          <Slider label={L("threshold", "threshold")} value={thr} min={0.05} max={0.95} step={0.01} onChange={setThr} />
        </Sliders>
        <Row>
          <Readout>p = σ({f2(m.w1, 2)}·h + {f2(m.w2, 2)}·s {m.b < 0 ? "−" : "+"} {f2(Math.abs(m.b), 2)})</Readout>
          <Readout color={loss < 0.35 ? C.green : loss < 0.6 ? C.amber : C.red}>{L("loss", "cross-entropy")} = {f2(loss, 3)}</Readout>
          <Readout>{L("correct", "correct")} {correct} / {STUDENTS.length}</Readout>
        </Row>
      </>}
      note={L("note", "Green dots passed, red dots failed; h is hours studied, s hours slept. At epoch 0 every weight is 0 and the model says 50% everywhere, so there is no line. Training turns the boundary until it separates the two groups as well as a straight line can, then keeps sharpening the transition (the pale band narrows). The best fit is about p = σ(1.34h + 1.57s − 15.82). Two students cannot be fitted by any line: the one who studied 5 h and slept 7 h but failed, and the one who studied only 2 h but passed. Raising the threshold demands more confidence before predicting \"pass\": the line moves up and right, and fewer students are predicted to pass.")}
    >
      <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto" role="img">
        {cells.map((c, i) => <rect key={i} x={c.x} y={c.y} width={CELL} height={CELL}
          fill={c.p >= 0.5 ? C.green : C.red} fillOpacity={Math.abs(c.p - 0.5) * 0.45} />)}
        {[1, 2, 3, 4, 5, 6].map(x => <T key={x} x={P.X(x)} y={P.H - 4} size={8} anchor="middle">{x} h</T>)}
        {[4, 6, 8].map(y => <T key={y} x={4} y={P.Y(y) + 3} size={8}>{y} h</T>)}
        <T x={P.W - 6} y={P.H - 16} size={9} anchor="end" bold color={C.fg}>{L("studied", "studied →")}</T>
        <T x={22} y={14} size={9} bold color={C.fg}>{L("slept", "↑ slept")}</T>
        {hasLine && (Math.abs(m.w2) > 1e-6
          ? <line x1={P.X(P.x0)} y1={P.Y(sAt(P.x0))} x2={P.X(P.x1)} y2={P.Y(sAt(P.x1))} stroke={C.purple} strokeWidth={2} />
          : <line x1={P.X((logit - m.b) / m.w1)} x2={P.X((logit - m.b) / m.w1)} y1={0} y2={P.H} stroke={C.purple} strokeWidth={2} />)}
        {STUDENTS.map(([h, s, y], i) => <circle key={i} cx={P.X(h)} cy={P.Y(s)} r={6} fill={y ? C.green : C.red} stroke="var(--code-bg)" strokeWidth={1.8} />)}
      </svg>
    </Figure>
  );
}
