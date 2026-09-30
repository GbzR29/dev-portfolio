"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, C, T, f2, svgPoint } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A 4 × 4 texture sampled over a quad whose UVs run past [0, 1], so the
// address mode decides what lies outside and the filter decides how texels
// blend when magnified. Moving the pointer over the result probes one
// fragment: its uv, the texel coordinate x = u·W − ½, the texels the sampler
// reads after addressing, and their bilinear weights (drawn on the texture).

type Filter = "NEAREST" | "LINEAR";
type Mode = "REPEAT" | "MIRRORED_REPEAT" | "CLAMP_TO_EDGE" | "CLAMP_TO_BORDER";

const TW = 4;
const TEX: [number, number, number][] = [
  [239, 68, 68], [245, 158, 11], [250, 204, 21], [34, 197, 94],
  [236, 72, 153], [240, 240, 240], [30, 30, 30], [20, 184, 166],
  [168, 85, 247], [30, 30, 30], [240, 240, 240], [14, 165, 233],
  [59, 130, 246], [99, 102, 241], [132, 204, 22], [249, 115, 22],
];
const BORDER: [number, number, number] = [0, 0, 0];

/** Texel index after the address mode, or −1 for the border colour. */
function address(i: number, mode: Mode) {
  const n = TW;
  switch (mode) {
    case "REPEAT": return ((i % n) + n) % n;
    case "MIRRORED_REPEAT": { const m = ((i % (2 * n)) + 2 * n) % (2 * n); return m < n ? m : 2 * n - 1 - m; }
    case "CLAMP_TO_EDGE": return Math.min(n - 1, Math.max(0, i));
    case "CLAMP_TO_BORDER": return i < 0 || i >= n ? -1 : i;
  }
}
const texAt = (i: number, j: number) => (i < 0 || j < 0 ? BORDER : TEX[j * TW + i]);

type Tap = { i: number; j: number; w: number };
/** The texels one sample reads, with their weights. */
function taps(u: number, v: number, filter: Filter, mode: Mode): { x: number; y: number; list: Tap[] } {
  const x = u * TW - 0.5, y = v * TW - 0.5;
  if (filter === "NEAREST") {
    return { x, y, list: [{ i: address(Math.floor(u * TW), mode), j: address(Math.floor(v * TW), mode), w: 1 }] };
  }
  const i0 = Math.floor(x), j0 = Math.floor(y), a = x - i0, b = y - j0;
  return {
    x, y, list: [
      { i: address(i0, mode), j: address(j0, mode), w: (1 - a) * (1 - b) },
      { i: address(i0 + 1, mode), j: address(j0, mode), w: a * (1 - b) },
      { i: address(i0, mode), j: address(j0 + 1, mode), w: (1 - a) * b },
      { i: address(i0 + 1, mode), j: address(j0 + 1, mode), w: a * b },
    ],
  };
}
function sample(u: number, v: number, filter: Filter, mode: Mode) {
  const c = [0, 0, 0];
  for (const tp of taps(u, v, filter, mode).list) {
    const col = texAt(tp.i, tp.j);
    for (let k = 0; k < 3; k++) c[k] += tp.w * col[k];
  }
  return `rgb(${c.map(Math.round).join(",")})`;
}

const RES = 40, OX = 16, OY = 22, OS = 240, TX0 = 340, TS = 200;

export function SamplerFigure({ t }: { t?: TrackTranslations }) {
  const [filter, setFilter] = useState<Filter>("LINEAR");
  const [mode, setMode] = useState<Mode>("REPEAT");
  const [range, setRange] = useState(0.5);
  const [probe, setProbe] = useState<{ u: number; v: number } | null>({ u: 0.4, v: 0.3 });
  const L = (k: string, en: string) => tx(t, `figVkSamp_${k}`, en);

  const u0 = -range, u1 = 1 + range, span = u1 - u0;
  const toUv = (p: number) => u0 + (p / OS) * span;
  const cell = OS / RES;

  const grid = useMemo(() => Array.from({ length: RES * RES }, (_, k) => {
    const px = k % RES, py = Math.floor(k / RES);
    const u = u0 + ((px + 0.5) / RES) * span, v = u0 + ((py + 0.5) / RES) * span;
    return <rect key={k} x={OX + px * cell} y={OY + py * cell} width={cell + 0.3} height={cell + 0.3} fill={sample(u, v, filter, mode)} />;
  }), [filter, mode, u0, span, cell]);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = svgPoint(e.currentTarget, e);
    if (p.x < OX || p.x > OX + OS || p.y < OY || p.y > OY + OS) return;
    setProbe({ u: toUv(p.x - OX), v: toUv(p.y - OY) });
  };
  const pr = probe && taps(probe.u, probe.v, filter, mode);
  // Clamping can send several taps to the same texel: add their weights.
  const merged: Tap[] = [];
  for (const tp of pr?.list ?? []) {
    if (tp.i < 0 || tp.j < 0 || tp.w < 0.001) continue;
    const m = merged.find(o => o.i === tp.i && o.j === tp.j);
    if (m) m.w += tp.w; else merged.push({ ...tp });
  }
  const sq = (uv: number) => OX + ((uv - u0) / span) * OS;
  const ts = TS / TW;

  return (
    <Figure
      title={L("title", "Filtering and addressing, texel by texel")}
      head={<Choice value={filter} onChange={setFilter} options={[["NEAREST", "NEAREST"], ["LINEAR", "LINEAR"]] as const} />}
      controls={<>
        <Row><Choice value={mode} onChange={setMode} options={[["REPEAT", "REPEAT"], ["MIRRORED_REPEAT", "MIRRORED_REPEAT"], ["CLAMP_TO_EDGE", "CLAMP_TO_EDGE"], ["CLAMP_TO_BORDER", "CLAMP_TO_BORDER"]] as const} /></Row>
        <Slider label={L("range", "uv beyond [0,1]")} value={range} min={0} max={1.5} step={0.05} onChange={setRange} width="w-32" />
        {pr && probe && (
          <Row>
            <Readout>uv = ({f2(probe.u)}, {f2(probe.v)})</Readout>
            {filter === "LINEAR" ? <>
              <Readout>x = u·4 − ½ = {f2(pr.x)}</Readout>
              <Readout>y = v·4 − ½ = {f2(pr.y)}</Readout>
            </> : <>
              <Readout>i = ⌊u·4⌋ = {Math.floor(probe.u * TW)}</Readout>
              <Readout>j = ⌊v·4⌋ = {Math.floor(probe.v * TW)}</Readout>
            </>}
            {pr.list.map((tp, k) => (
              <Readout key={k} color={tp.i < 0 || tp.j < 0 ? C.muted : undefined}>
                {tp.i < 0 || tp.j < 0 ? L("border", "border") : `(${tp.i}, ${tp.j})`} × {f2(tp.w)}
              </Readout>
            ))}
          </Row>
        )}
      </>}
      note={L("note", "The left square is a quad whose uv runs from −range to 1 + range; the dashed outline is the [0, 1] square, where the texture appears once. Move the pointer over it (or tap) to probe one fragment. NEAREST reads the single texel under uv; LINEAR takes the four texels around x = u·W − ½, y = v·H − ½ and weights them by how close the sample is to each, which is why the colours blend when the texture is magnified. The address mode is applied to the texel indices: REPEAT wraps them, MIRRORED_REPEAT reflects every other copy, CLAMP_TO_EDGE repeats the edge texels, CLAMP_TO_BORDER returns the border colour (black here). Note the seam at the edge of [0, 1] with LINEAR and CLAMP_TO_BORDER: half of the taps are already border.")}
    >
      <svg viewBox="0 0 560 280" className="w-full h-auto touch-none" role="img" onPointerMove={onMove} onPointerDown={onMove}>
        <g shapeRendering="crispEdges">{grid}</g>
        <rect x={sq(0)} y={sq(0)} width={sq(1) - sq(0)} height={sq(1) - sq(0)} fill="none" stroke="#fff" strokeWidth={1.2} strokeDasharray="4 3" />
        <T x={OX} y={OY - 8} size={8.5}>{L("result", "the quad, sampled")}</T>
        {probe && <circle cx={sq(probe.u)} cy={sq(probe.v)} r={4} fill="none" stroke="#fff" strokeWidth={2} />}

        {/* ── The texture itself, with the taps ── */}
        <T x={TX0} y={OY - 8} size={8.5}>{L("texture", "the 4 × 4 texture")}</T>
        {TEX.map((c, k) => (
          <rect key={k} x={TX0 + (k % TW) * ts} y={OY + Math.floor(k / TW) * ts} width={ts} height={ts} fill={`rgb(${c.join(",")})`} stroke={C.axis} strokeWidth={0.6} />
        ))}
        {[0, 1, 2, 3].map(k => (
          <g key={k}>
            <T x={TX0 + k * ts + ts / 2} y={OY + TS + 13} size={8} anchor="middle">{k}</T>
            <T x={TX0 - 8} y={OY + k * ts + ts / 2 + 3} size={8} anchor="middle">{k}</T>
          </g>
        ))}
        {merged.map(tp => (
          <g key={`${tp.i}-${tp.j}`}>
            <rect x={TX0 + tp.i * ts + 3} y={OY + tp.j * ts + 3} width={ts - 6} height={ts - 6} fill="none" stroke="#fff" strokeWidth={1 + 3 * tp.w} />
            <rect x={TX0 + tp.i * ts + ts / 2 - 17} y={OY + tp.j * ts + ts / 2 - 9} width={34} height={17} rx={4} fill="#000" opacity={0.65} />
            <T x={TX0 + tp.i * ts + ts / 2} y={OY + tp.j * ts + ts / 2 + 4} size={11} anchor="middle" bold color="#fff">{f2(tp.w)}</T>
          </g>
        ))}
      </svg>
    </Figure>
  );
}
