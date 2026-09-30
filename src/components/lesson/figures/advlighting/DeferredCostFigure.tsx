"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The chapter's cost model with your own numbers. P pixels, overdraw o (how
// many fragments are shaded per pixel on average), L lights, each light
// reaching a fraction a of the screen. Bars count light evaluations per frame
// on a log scale (each grid line is 10× more work):
//   forward             o·P·L
//   deferred, loop      o·P (G-buffer writes) + P·L
//   deferred, volumes   o·P + a·P·L
// The readouts add the price deferred pays instead: G-buffer memory, and the
// bytes the lighting pass reads.

const W = 620, H = 150, LX = 150, RX = 600, BAR = 26, LOG0 = 5, LOG1 = 11;
const RES = { "720": [1280, 720], "1080": [1920, 1080], "2160": [3840, 2160] } as const;
type Res = keyof typeof RES;
const BYTES = 24;                                   // RGBA16F position + RGBA16F normal + RGBA8 albedo/spec + 32-bit depth

const bx = (v: number) => LX + ((Math.log10(Math.max(v, 10 ** LOG0)) - LOG0) / (LOG1 - LOG0)) * (RX - LX);
const big = (v: number) => (v >= 1e9 ? `${f2(v / 1e9, 2)} G` : v >= 1e6 ? `${f2(v / 1e6, 1)} M` : `${f2(v / 1e3, 0)} k`);

export function DeferredCostFigure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figDCost_${k}`, en);
  const [res, setRes] = useState<Res>("1080");
  const [lk, setLk] = useState(Math.log2(100));
  const [o, setO] = useState(2.5);
  const [cov, setCov] = useState(2);                // percent of the screen each light reaches

  const [w, h] = RES[res];
  const P = w * h, nL = Math.round(2 ** lk), a = cov / 100;
  const bars: [string, string, number, string][] = [
    ["fwd", "forward", o * P * nL, C.red],
    ["loop", "deferred, loop all lights", o * P + P * nL, C.amber],
    ["vol", "deferred, light volumes", o * P + a * P * nL, C.green],
  ];

  return (
    <Figure
      title={L("title", "Forward vs deferred: light evaluations per frame")}
      head={<Choice value={res} onChange={setRes} options={[["720", "720p"], ["1080", "1080p"], ["2160", "4K"]] as const} />}
      controls={<>
        <Sliders>
          <Slider label={L("lights", "lights L")} value={lk} min={0} max={10} step={0.05} onChange={setLk} fmt={() => `${nL}`} />
          <Slider label={L("overdraw", "overdraw o")} value={o} min={1} max={6} step={0.1} onChange={setO} fmt={v => `${f2(v, 1)}×`} />
          <Slider label={L("coverage", "screen per light a")} value={cov} min={0.1} max={100} step={0.1} onChange={setCov} fmt={v => `${f2(v, 1)}%`} width="w-28" />
        </Sliders>
        <Row>
          <Readout>P = {w}×{h} = {big(P)}</Readout>
          <Readout color={C.purple}>{L("gbuf", "G-buffer")} {f2((P * BYTES) / 2 ** 20, 1)} MiB</Readout>
          <Readout color={C.amber}>{L("readLoop", "loop reads")} {f2((P * BYTES) / 2 ** 20, 0)} MiB</Readout>
          <Readout color={C.green}>{L("readVol", "volumes read")} {f2((a * P * nL * BYTES) / 2 ** 20, 0)} MiB</Readout>
          <Readout>{L("ratio", "forward ÷ volumes")} {f2(bars[0][2] / bars[2][2], 0)}×</Readout>
        </Row>
      </>}
      note={L("note", "Start at 1080p, overdraw 2.5 and 100 lights each covering 2% of the screen: forward shading does 518 M light evaluations, the lighting loop 212.5 M, light volumes 9.3 M. Drop to a single light and forward wins: deferred still pays for writing and reading a 24-byte-per-pixel G-buffer, which is why games with few lights often stay forward. With volumes each light re-reads the G-buffer for every pixel it covers, so many large, overlapping lights make memory traffic the new bottleneck; tiled and clustered shading (a later chapter) read it once and loop over short per-tile light lists.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {Array.from({ length: LOG1 - LOG0 + 1 }, (_, k) => LOG0 + k).map(e => <g key={e}>
          <line x1={bx(10 ** e)} x2={bx(10 ** e)} y1={12} y2={H - 22} stroke={C.grid} strokeWidth={1} />
          <T x={bx(10 ** e)} y={H - 8} size={8} anchor="middle">10{["⁵", "⁶", "⁷", "⁸", "⁹", "¹⁰", "¹¹"][e - LOG0]}</T>
        </g>)}
        {bars.map(([k, en, v, col], i) => <g key={k}>
          <T x={LX - 8} y={24 + i * (BAR + 12) + BAR / 2 + 3} size={9} anchor="end" color={col}>{L(k, en)}</T>
          <rect x={LX} y={20 + i * (BAR + 12)} width={Math.max(1, bx(v) - LX)} height={BAR} rx={3} fill={col} fillOpacity={0.8} />
          <T x={Math.min(bx(v) + 6, RX - 50)} y={24 + i * (BAR + 12) + BAR / 2 + 3} size={9.5} color={C.fg} bold>{big(v)}</T>
        </g>)}
      </svg>
    </Figure>
  );
}
