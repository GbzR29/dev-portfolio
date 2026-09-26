"use client";

import { useId, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T, plot, fnPath } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The common growth rates on one plot, n from 1 to a chosen maximum, either on
// ordinary axes (where the fast ones shoot off the top) or with a logarithmic
// vertical axis (where every curve fits and 2ⁿ becomes a straight line). Under
// the plot, the time each one takes for a chosen n at 10⁹ simple operations per
// second, computed with logarithms so that 2^1 000 000 does not overflow.

type Fn = { id: string; label: string; color: string; log10: (n: number) => number };
const LOG10_2 = Math.log10(2);
// log10(n!) by Stirling, exact enough for a readout: n ln n − n + ½ ln(2πn)
const log10Fact = (n: number) => (n < 2 ? 0 : (n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n)) / Math.LN10);

const FNS: Fn[] = [
  { id: "1",     label: "1",       color: C.muted,  log10: () => 0 },
  { id: "log",   label: "log n",   color: C.teal,   log10: n => Math.log10(Math.max(1, Math.log2(Math.max(n, 1)))) },
  { id: "n",     label: "n",       color: C.sky,    log10: n => Math.log10(n) },
  { id: "nlog",  label: "n log n", color: C.green,  log10: n => Math.log10(n * Math.max(1, Math.log2(Math.max(n, 1)))) },
  { id: "n2",    label: "n²",      color: C.amber,  log10: n => 2 * Math.log10(n) },
  { id: "n3",    label: "n³",      color: C.orange, log10: n => 3 * Math.log10(n) },
  { id: "2n",    label: "2ⁿ",      color: C.red,    log10: n => n * LOG10_2 },
  { id: "fact",  label: "n!",      color: C.purple, log10: log10Fact },
];

/** "3.2 ms", "17 min", "≈ 10^293 years" from log10 of a duration in seconds. */
function fmtTime(L: number) {
  const s = 10 ** L;
  if (L < -6) return `${(s * 1e9).toPrecision(2)} ns`;
  if (L < -3) return `${(s * 1e6).toPrecision(2)} µs`;
  if (L < 0) return `${(s * 1e3).toPrecision(2)} ms`;
  if (s < 60) return `${s.toPrecision(2)} s`;
  if (s < 3600) return `${(s / 60).toPrecision(2)} min`;
  if (s < 86400) return `${(s / 3600).toPrecision(2)} h`;
  if (s < 3.156e7) return `${(s / 86400).toPrecision(2)} days`;
  const Ly = L - Math.log10(3.156e7);
  const years = Ly < 6 ? `${Math.round(10 ** Ly).toLocaleString("en-US")} years` : `≈ 10^${Math.floor(Ly)} years`;
  return Ly > Math.log10(1.38e10) ? `${years} (> age of the universe)` : years;
}

const W = 560, H = 250;

export function GrowthFigure({ t }: { t?: TrackTranslations }) {
  const clip = useId();
  const [scale, setScale] = useState<"lin" | "log">("lin");
  const [xMax, setXMax] = useState(20);
  const [nExp, setNExp] = useState(3);
  const [on, setOn] = useState<Record<string, boolean>>({ "1": true, log: true, n: true, nlog: true, n2: true, n3: false, "2n": true, fact: false });

  const yMaxLin = xMax * 4;
  const yMaxLog = 12;
  const p = plot({ W, H, x0: 0, x1: xMax, y0: 0, y1: scale === "lin" ? yMaxLin : yMaxLog });
  const val = (f: Fn) => (n: number) => (scale === "lin" ? 10 ** f.log10(n) : f.log10(n));
  const n = 10 ** nExp;

  const yTicks = scale === "lin"
    ? Array.from({ length: 5 }, (_, k) => (yMaxLin / 4) * k)
    : Array.from({ length: yMaxLog / 3 + 1 }, (_, k) => k * 3);

  return (
    <Figure
      title={tx(t, "figGrowth_title", "How fast each cost grows")}
      head={<Choice value={scale} onChange={setScale} options={[["lin", tx(t, "figGrowth_lin", "ordinary axes")], ["log", tx(t, "figGrowth_log", "log scale")]] as const} />}
      controls={<>
        <Row>
          {FNS.map(f => (
            <Btn key={f.id} active={on[f.id]} onClick={() => setOn(o => ({ ...o, [f.id]: !o[f.id] }))}>
              <span style={{ color: f.color }}>■</span> {f.label}
            </Btn>
          ))}
        </Row>
        <Slider label={tx(t, "figGrowth_xmax", "plot up to n =")} value={xMax} min={8} max={100} step={1} onChange={setXMax} fmt={v => `${v}`} />
        <Slider label={tx(t, "figGrowth_n", "time for n =")} value={nExp} min={1} max={9} step={1} onChange={setNExp} fmt={v => `10^${v}`} />
        <div className="grid gap-1.5 sm:grid-cols-2">
          {FNS.filter(f => on[f.id]).map(f => (
            <Readout key={f.id} color={f.color}>{f.label}: {fmtTime(f.log10(n) - 9)}</Readout>
          ))}
        </div>
      </>}
      note={scale === "lin"
        ? tx(t, "figGrowth_noteLin", "On ordinary axes the difference is brutal: by n = 20, n² is 400 and 2ⁿ is over a million, far above the top of the plot, while log n has barely reached 4. Drag \"plot up to\" to the right and watch n log n peel away from n too, only much more slowly. The table below turns operation counts into time on a machine doing a billion simple steps per second.")
        : tx(t, "figGrowth_noteLog", "With a logarithmic vertical axis each gridline is 1000 times the one below it (10³, 10⁶, 10⁹…), so every curve fits. Polynomials (n, n², n³) become gently rising curves with n³ three times as steep as n, while 2ⁿ becomes a straight line that climbs 0.3 of a power of ten per step and crosses all of them. n! bends upward even faster than 2ⁿ.")}
    >
      <svg viewBox={`-34 -8 ${W + 50} ${H + 30}`} className="w-full h-auto">
        {yTicks.map(y => <g key={y}>
          <line x1={0} x2={W} y1={p.Y(y)} y2={p.Y(y)} stroke={C.grid} />
          <T x={-4} y={p.Y(y) + 3} size={8} anchor="end">{scale === "lin" ? `${y}` : `10^${y}`}</T>
        </g>)}
        {Array.from({ length: 5 }, (_, k) => Math.round((xMax / 4) * k)).map(x => (
          <T key={x} x={p.X(x)} y={H + 14} size={8} anchor="middle">{x}</T>
        ))}
        <clipPath id={clip}><rect x={0} y={0} width={W} height={H} /></clipPath>
        <line x1={0} x2={W} y1={H} y2={H} stroke={C.axis} />
        <line x1={0} x2={0} y1={0} y2={H} stroke={C.axis} />
        <T x={W} y={H + 14} size={8.5} anchor="end">n</T>
        {FNS.filter(f => on[f.id]).map(f => {
          const v = val(f);
          // label where the curve leaves the plot, or at its right end
          let lx = xMax;
          for (let x = 1; x <= xMax; x += xMax / 400) if (v(x) > p.y1) { lx = x; break; }
          const ly = Math.min(p.y1, v(lx));
          return <g key={f.id}>
            <path d={fnPath(p, v, 1, xMax, 400)} clipPath={`url(#${clip})`} fill="none" stroke={f.color} strokeWidth={2} />
            <T x={Math.min(p.X(lx) + 4, W - 36)} y={Math.max(10, p.Y(ly) - 4)} size={9} color={f.color} bold>{f.label}</T>
          </g>;
        })}
      </svg>
    </Figure>
  );
}
