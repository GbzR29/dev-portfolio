"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, useDrag, clamp, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A small data set on a 0–100 scale, drawn three ways: a histogram (top, bin
// width on a slider), the raw values as dots (middle, draggable), and a box
// plot of the five-number summary (bottom). The blue line is the mean, the
// green line the median, the amber band mean ± s. Quartiles are the medians
// of the lower and upper halves (leaving out the middle value when n is
// odd), as in the chapter; dots beyond the 1.5·IQR fences are drawn red.

const SETS: Record<string, number[]> = {
  scores: [52, 61, 64, 68, 70, 73, 75, 81, 95],
  skewed: [8, 10, 11, 12, 13, 14, 15, 17, 19, 22, 26, 33, 45, 70],
  bimodal: [18, 22, 24, 25, 27, 29, 30, 66, 69, 71, 72, 74, 77, 80],
};
type SetKey = keyof typeof SETS;
const W = 560, PAD = 24, HIST = 110, DOTS = 60, BOX = 56, H = HIST + DOTS + BOX + 24;
const X = (v: number) => PAD + (v / 100) * (W - 2 * PAD);
const V = (x: number) => ((x - PAD) / (W - 2 * PAD)) * 100;

function median(s: number[]) { const n = s.length, m = n >> 1; return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

/** Five-number summary with quartiles as medians of the halves (middle value left out when n is odd). */
function summary(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b), n = s.length, h = n >> 1;
  return { min: s[0], q1: median(s.slice(0, h)), med: median(s), q3: median(s.slice(n % 2 ? h + 1 : h)), max: s[n - 1] };
}

export function DescriptiveFigure({ t }: { t?: TrackTranslations }) {
  const [set, setSetRaw] = useState<SetKey | "">("scores");
  const [xs, setXs] = useState<number[]>(SETS.scores);
  const [bin, setBin] = useState(10);
  const setSet = (k: SetKey) => { setSetRaw(k); setXs(SETS[k]); };

  const n = xs.length;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const s = Math.sqrt(xs.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1));
  const q = summary(xs), iqr = q.q3 - q.q1, lo = q.q1 - 1.5 * iqr, hi = q.q3 + 1.5 * iqr;
  const inside = xs.filter(v => v >= lo && v <= hi);
  const wLo = Math.min(...inside), wHi = Math.max(...inside);

  // Histogram counts; the tallest bar sets the scale.
  const nb = Math.ceil(100 / bin), counts = new Array(nb).fill(0);
  xs.forEach(v => counts[Math.min(nb - 1, Math.floor(v / bin))]++);
  const cMax = Math.max(...counts);

  // Stack equal values in the dot plot so none hide behind another.
  const seen = new Map<number, number>();
  const dots = xs.map((v, i) => { const k = Math.round(v); const lvl = seen.get(k) ?? 0; seen.set(k, lvl + 1); return { v, i, lvl }; });

  const drag = useDrag<number>(
    p => {
      if (p.y < HIST || p.y > HIST + DOTS) return null;
      let best = -1, bd = 12;
      xs.forEach((v, i) => { const d = Math.abs(X(v) - p.x); if (d < bd) { bd = d; best = i; } });
      return best < 0 ? null : best;
    },
    (i, p) => { setSetRaw(""); setXs(old => old.map((v, j) => (j === i ? Math.round(clamp(V(p.x), 0, 100)) : v))); },
  );

  const yB = HIST + DOTS + 14, bh = 22;
  return (
    <Figure
      title={tx(t, "figDesc_title", "Centre, spread and the box plot")}
      head={<Choice value={set as SetKey} onChange={setSet} options={[
        ["scores", tx(t, "figDesc_scores", "test scores")],
        ["skewed", tx(t, "figDesc_skewed", "skewed")],
        ["bimodal", tx(t, "figDesc_bimodal", "two groups")],
      ]} />}
      controls={<>
        <Slider label={tx(t, "figDesc_bin", "bin width")} value={bin} min={2} max={25} step={1} onChange={setBin} fmt={v => String(v)} />
        <Row>
          <Btn onClick={() => { setSetRaw(""); setXs(v => [...v, 99]); }}>{tx(t, "figDesc_addHigh", "add a value at 99")}</Btn>
          <Btn onClick={() => { setSetRaw(""); setXs(v => (v.length > 3 ? v.slice(0, -1) : v)); }}>{tx(t, "figDesc_remove", "remove last")}</Btn>
        </Row>
        <Row>
          <Readout>{`n = ${n}`}</Readout>
          <Readout color={C.blue}>{`x̄ = ${f2(mean, 1)}`}</Readout>
          <Readout color={C.green}>{`${tx(t, "figDesc_median", "median")} = ${f2(q.med, 1)}`}</Readout>
          <Readout color={C.amber}>{`s = ${f2(s, 1)}`}</Readout>
          <Readout>{`Q1 = ${f2(q.q1, 1)}  Q3 = ${f2(q.q3, 1)}  IQR = ${f2(iqr, 1)}`}</Readout>
        </Row>
      </>}
      note={<>
        {tx(t, "figDesc_note", "Drag one dot far to the right: the mean and s follow it, the median and the box barely move. That is what \"resistant\" means. In the skewed set the mean sits to the right of the median, pulled by the long tail. With two groups the mean lands in the gap where almost no data are, and the histogram, not the summary numbers, shows what is going on. Changing the bin width can hide or invent bumps.")}{" "}
        <span data-mouse-only>{tx(t, "figDesc_drag", "Drag the dots in the middle strip.")}</span>
        <span data-touch-only>{tx(t, "figDesc_dragTouch", "Drag the dots in the middle strip.")}</span>
      </>}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-ew-resize">
        <rect x={X(mean - s)} y={4} width={Math.max(0, X(mean + s) - X(mean - s))} height={HIST + DOTS - 4} fill={C.amber} opacity={0.1} />
        {/* histogram */}
        {counts.map((c, i) => c > 0 && (
          <rect key={i} x={X(i * bin) + 0.5} y={HIST - 6 - (c / cMax) * (HIST - 24)} width={Math.max(0, X(Math.min(100, (i + 1) * bin)) - X(i * bin) - 1)}
            height={(c / cMax) * (HIST - 24)} fill={C.purple} opacity={0.45} />
        ))}
        <line x1={PAD} x2={W - PAD} y1={HIST - 6} y2={HIST - 6} stroke={C.axis} strokeWidth={1} />
        {/* dots */}
        <line x1={PAD} x2={W - PAD} y1={HIST + DOTS - 10} y2={HIST + DOTS - 10} stroke={C.axis} strokeWidth={1} />
        {[0, 20, 40, 60, 80, 100].map(v => <T key={v} x={X(v)} y={HIST + DOTS + 1} anchor="middle" color={C.axis} size={8.5}>{v}</T>)}
        {dots.map(d => <circle key={d.i} cx={X(d.v)} cy={HIST + DOTS - 17 - d.lvl * 9} r={4}
          fill={d.v < lo || d.v > hi ? C.red : C.fg} opacity={drag.dragging === d.i ? 1 : 0.75} />)}
        <line x1={X(mean)} x2={X(mean)} y1={8} y2={yB + bh + 4} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 4" />
        <T x={X(mean) + 4} y={16} color={C.blue} bold>{"x̄"}</T>
        <line x1={X(q.med)} x2={X(q.med)} y1={8} y2={HIST + DOTS - 10} stroke={C.green} strokeWidth={1.5} strokeDasharray="2 3" />
        <T x={X(q.med) - 4} y={28} anchor="end" color={C.green} bold>{tx(t, "figDesc_medLbl", "median")}</T>
        {/* box plot */}
        <line x1={X(wLo)} x2={X(q.q1)} y1={yB + bh / 2} y2={yB + bh / 2} stroke={C.fg} strokeWidth={1.2} />
        <line x1={X(q.q3)} x2={X(wHi)} y1={yB + bh / 2} y2={yB + bh / 2} stroke={C.fg} strokeWidth={1.2} />
        {[wLo, wHi].map((v, i) => <line key={i} x1={X(v)} x2={X(v)} y1={yB + 5} y2={yB + bh - 5} stroke={C.fg} strokeWidth={1.2} />)}
        <rect x={X(q.q1)} y={yB} width={Math.max(0, X(q.q3) - X(q.q1))} height={bh} fill={C.green} fillOpacity={0.15} stroke={C.green} strokeWidth={1.4} />
        <line x1={X(q.med)} x2={X(q.med)} y1={yB} y2={yB + bh} stroke={C.green} strokeWidth={2.4} />
        {xs.filter(v => v < lo || v > hi).map((v, i) => <circle key={i} cx={X(v)} cy={yB + bh / 2} r={3.5} fill="none" stroke={C.red} strokeWidth={1.5} />)}
        <T x={X(q.q1)} y={yB + bh + 13} anchor="middle" color={C.muted} size={8.5}>{"Q1"}</T>
        <T x={X(q.q3)} y={yB + bh + 13} anchor="middle" color={C.muted} size={8.5}>{"Q3"}</T>
      </svg>
    </Figure>
  );
}
