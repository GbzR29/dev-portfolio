"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A blur kernel built from a Gaussian. Left: the 1D weights (bars) for taps
// −N…N, normalised to sum to 1, over the continuous bell curve they sample.
// Right: the 2D kernel, the outer product of the 1D kernel with itself, which
// is what one horizontal pass followed by one vertical pass applies. The
// readouts give how much of the bell the taps cover (the rest is cut off) and
// the sample counts: one 2D pass, two 1D passes, and two 1D passes using
// bilinear filtering to read two taps per fetch. "Chapter weights" loads the
// five numbers from blur.frag: binomial row 12 without its two outer entries
// on each side, a Gaussian with σ ≈ 1.73.

const W = 620, H = 230, BX0 = 24, BX1 = 400, BY0 = 196, BY1 = 22, GX = 430, GY = 22, GS = 174;
const OLD = [0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216];

/** Abramowitz–Stegun 7.1.26, |error| < 1.5e-7. */
function erf(x: number) {
  const s = Math.sign(x), a = Math.abs(x), k = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-a * a);
  return s * y;
}

export function GaussKernelFigure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figGauss_${k}`, en);
  const [sigma, setSigma] = useState(1.73);
  const [N, setN] = useState(4);
  const [chapter, setChapter] = useState(true);

  const n = chapter ? 4 : N;
  const s = chapter ? Math.sqrt(3) : sigma;
  const raw = Array.from({ length: n + 1 }, (_, i) => Math.exp(-(i * i) / (2 * s * s)));
  const norm = raw[0] + 2 * raw.slice(1).reduce((a, b) => a + b, 0);
  const w = chapter ? OLD : raw.map(v => v / norm);          // w[i] for tap ±i
  const taps = Array.from({ length: 2 * n + 1 }, (_, k) => w[Math.abs(k - n)]);
  const covered = erf((n + 0.5) / (s * Math.SQRT2));
  const size = 2 * n + 1;
  const wmax = w[0];

  const bw = (BX1 - BX0) / size;
  const by = (v: number) => BY0 - (v / wmax) * (BY0 - BY1) * 0.92;
  let bell = "";
  for (let i = 0; i <= 120; i++) {
    const xx = -n - 0.5 + (i / 120) * size;
    const v = Math.exp(-(xx * xx) / (2 * s * s)) / norm;
    bell += `${i ? "L" : "M"}${(BX0 + (xx + n + 0.5) * bw).toFixed(1)},${by(v).toFixed(1)}`;
  }
  const cell = GS / size;

  return (
    <Figure
      title={L("title", "A Gaussian blur kernel, 1D and 2D")}
      head={<Btn active={chapter} onClick={() => setChapter(v => !v)}>{chapter ? "☑" : "☐"} {L("chapter", "chapter weights")}</Btn>}
      controls={<>
        {!chapter && <Sliders>
          <Slider label="σ (px)" value={sigma} min={0.5} max={6} step={0.05} onChange={setSigma} />
          <Slider label={L("radius", "taps each side N")} value={N} min={1} max={12} step={1} onChange={setN} fmt={v => `${v}`} width="w-28" />
        </Sliders>}
        <Row>
          <Readout>{L("kernel", "kernel")} {size} × {size}</Readout>
          <Readout color={covered < 0.99 ? C.red : C.green}>{L("covered", "bell covered")} {f2(covered * 100, 1)}%</Readout>
          <Readout>w₀ = {f2(w[0], 4)}</Readout>
          <Readout>Σw = {f2(w[0] + 2 * w.slice(1).reduce((a, b) => a + b, 0), 4)}</Readout>
        </Row>
        <Row>
          <Readout color={C.red}>{L("pass2d", "one 2D pass")} {size * size}</Readout>
          <Readout color={C.sky}>{L("sep", "two 1D passes")} {2 * size}</Readout>
          <Readout color={C.green}>{L("bilinear", "with bilinear pairs")} {2 * (1 + 2 * Math.ceil(n / 2))}</Readout>
        </Row>
      </>}
      note={L("note", "Each bar is the weight of one neighbour; the bars add up to 1, so a flat area keeps its brightness. σ sets the width of the bell: about 68% of it lies within ±σ and 99.7% within ±3σ, so the taps must reach about 3σ each side or the bell is cut off (red readout) and the blur looks boxy. Try σ = 4 with N = 4. The right-hand grid is what the two 1D passes apply together: every cell is w[x]·w[y], the same numbers a single 2D pass would need (2N + 1)² samples for. The chapter's five weights come from Pascal's triangle (row 12, the outer two entries each side dropped) and match a Gaussian with σ = √3 ≈ 1.73. The counts are samples per pixel.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <line x1={BX0} x2={BX1} y1={BY0} y2={BY0} stroke={C.axis} strokeWidth={1.5} />
        {taps.map((v, k) => <g key={k}>
          <rect x={BX0 + k * bw + bw * 0.15} y={by(v)} width={bw * 0.7} height={BY0 - by(v)} fill={C.sky} fillOpacity={0.75} />
          {size <= 13 && <T x={BX0 + (k + 0.5) * bw} y={BY0 + 12} size={8} anchor="middle">{k - n}</T>}
          {size <= 9 && <T x={BX0 + (k + 0.5) * bw} y={by(v) - 4} size={7.5} anchor="middle" color={C.fg}>{f2(v, 3)}</T>}
        </g>)}
        <path d={bell} fill="none" stroke={C.amber} strokeWidth={1.8} />
        {[1, 2, 3].map(m => m * s <= n + 0.5 && <g key={m}>
          {[-1, 1].map(sg => <line key={sg} x1={BX0 + (sg * m * s + n + 0.5) * bw} x2={BX0 + (sg * m * s + n + 0.5) * bw}
            y1={BY1} y2={BY0} stroke={C.purple} strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.7} />)}
          <T x={BX0 + (m * s + n + 0.5) * bw + 3} y={BY1 + 8 + m * 10} size={8} color={C.purple}>{m}σ</T>
        </g>)}
        <T x={BX0} y={H - 6} size={8.5}>{L("offset", "tap offset (pixels)")}</T>
        {taps.map((wy, j) => taps.map((wx, i) => <rect key={`${i}-${j}`} x={GX + i * cell} y={GY + j * cell} width={cell + 0.3} height={cell + 0.3}
          fill={C.amber} fillOpacity={Math.min(1, (wx * wy) / (wmax * wmax))} />))}
        <rect x={GX} y={GY} width={GS} height={GS} fill="none" stroke={C.axis} strokeWidth={1} />
        <T x={GX + GS / 2} y={GY + GS + 16} size={8.5} anchor="middle">{L("grid", "2D kernel = w[x] · w[y]")}</T>
      </svg>
    </Figure>
  );
}
