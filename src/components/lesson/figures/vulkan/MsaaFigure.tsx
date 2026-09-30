"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, C, T, f2, useDrag, nearest, Handle, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A triangle rasterized into an 18 × 10 pixel grid with the standard Vulkan
// sample positions for 1, 2, 4 and 8 samples. Every sample inside the
// triangle is covered (filled dot) and receives the colour the fragment
// shader computed for its pixel; the resolve averages the samples, so an
// edge pixel gets the fraction of the triangle's colour that covers it.
// The readouts count fragment-shader invocations (once per pixel per
// triangle, or once per sample with sample shading) and the memory at 1080p.

type S = "1" | "2" | "4" | "8";
const POS: Record<S, [number, number][]> = {                        // standardSampleLocations
  "1": [[0.5, 0.5]],
  "2": [[0.75, 0.75], [0.25, 0.25]],
  "4": [[0.375, 0.125], [0.875, 0.375], [0.125, 0.625], [0.625, 0.875]],
  "8": [[0.5625, 0.3125], [0.4375, 0.6875], [0.8125, 0.5625], [0.3125, 0.1875], [0.1875, 0.8125], [0.0625, 0.4375], [0.6875, 0.9375], [0.9375, 0.0625]],
};
const GW = 18, GH = 10, CELL = 32, OX = 12, OY = 10;
const W = OX * 2 + GW * CELL, H = OY * 2 + GH * CELL;
const BG = [0.07, 0.08, 0.12], FG = [0.98, 0.55, 0.15];
const rgb = (c: number[]) => `rgb(${c.map(v => Math.round(v * 255)).join(",")})`;

function inside(p: Pt[], x: number, y: number) {
  const e = (a: Pt, b: Pt) => (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
  const s = [e(p[0], p[1]), e(p[1], p[2]), e(p[2], p[0])];
  return s.every(v => v >= 0) || s.every(v => v <= 0);
}

// Coverage of every sample of every pixel; f is the resolved coverage (average of the samples)
function rasterize(tri: Pt[], pos: [number, number][]) {
  const n = pos.length, pixels: { x: number; y: number; cov: boolean[]; f: number }[] = [];
  let pixelsShaded = 0, samplesCovered = 0, edgePixels = 0;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const cov = pos.map(([sx, sy]) => inside(tri, x + sx, y + sy));
    const k = cov.filter(Boolean).length;
    if (k > 0) pixelsShaded++;
    if (k > 0 && k < n) edgePixels++;
    samplesCovered += k;
    pixels.push({ x, y, cov, f: k / n });
  }
  return { pixels, pixelsShaded, samplesCovered, edgePixels };
}

export function MsaaFigure({ t }: { t?: TrackTranslations }) {
  const [samples, setSamples] = useState<S>("4");
  const [sampleShading, setSampleShading] = useState(false);
  const [tri, setTri] = useState<Pt[]>([{ x: 1.3, y: 8.6 }, { x: 16.4, y: 1.2 }, { x: 11.2, y: 9.5 }]);   // in pixels
  const L = (k: string, en: string) => tx(t, `figVkMsaa_${k}`, en);

  const toSvg = (p: Pt) => ({ x: OX + p.x * CELL, y: OY + p.y * CELL });
  const drag = useDrag<number>(
    p => nearest(p, tri.map((v, i) => [i, toSvg(v)] as [number, Pt]), 18),
    (i, p) => setTri(ts => ts.map((v, k) => (k === i ? { x: Math.min(Math.max((p.x - OX) / CELL, 0), GW), y: Math.min(Math.max((p.y - OY) / CELL, 0), GH) } : v))),
  );

  const pos = POS[samples], n = pos.length;
  const { pixels, pixelsShaded, samplesCovered, edgePixels } = rasterize(tri, pos);
  const cells = pixels.map(({ x, y, cov, f }) => (
    <g key={`${x},${y}`}>
      <rect x={OX + x * CELL} y={OY + y * CELL} width={CELL - 1} height={CELL - 1} fill={rgb(BG.map((b, c) => b + (FG[c] - b) * f))} />
      {pos.map(([sx, sy], i) => (
        <circle key={i} cx={OX + (x + sx) * CELL} cy={OY + (y + sy) * CELL} r={n > 4 ? 2 : 2.6}
          fill={cov[i] ? "#fff" : "none"} stroke={cov[i] ? "#fff" : "#94a3b8"} strokeWidth={0.8} strokeOpacity={0.8} />
      ))}
    </g>
  ));
  const invocations = sampleShading ? samplesCovered : pixelsShaded;
  const px1080 = 1920 * 1080;
  const mb = (bytes: number) => f2(bytes / 1e6, 1);
  const pts = tri.map(toSvg);

  return (
    <Figure
      title={L("title", "Multisampling: coverage per sample, shading per pixel")}
      head={<>
        <span className="text-[10px] font-mono text-[var(--text-muted)] self-center">rasterizationSamples</span>
        <Choice value={samples} onChange={setSamples} options={[["1", "1"], ["2", "2"], ["4", "4"], ["8", "8"]] as const} />
      </>}
      controls={<>
        <Row>
          <Btn active={sampleShading} onClick={() => setSampleShading(v => !v)}>{sampleShading ? "☑" : "☐"} sampleShadingEnable</Btn>
        </Row>
        <Row>
          <Readout>{L("inv", "fragment shader runs")} {invocations}</Readout>
          <Readout>{L("covered", "samples covered")} {samplesCovered}</Readout>
          <Readout color={C.amber}>{L("edge", "edge pixels")} {edgePixels}</Readout>
          <Readout>{L("mem", "1080p colour + depth")} {mb(px1080 * n * 8)} MB{n > 1 ? ` + ${mb(px1080 * 4)} MB ${L("resolve", "resolve")}` : ""}</Readout>
        </Row>
      </>}
      note={L("note", "Drag the corners. Each pixel holds rasterizationSamples samples at fixed positions inside it (the dots). Coverage and the depth test are evaluated per sample; a filled dot is inside the triangle. The fragment shader still runs once per pixel the triangle touches, and its colour is written to every covered sample of that pixel. At the end of rendering the resolve averages each pixel's samples, so an edge pixel with 2 of 4 samples covered gets half the triangle's colour. With 1 sample the edge is a staircase; with 4 it gets five shades, with 8 nine. Sample shading runs the shader for every covered sample instead, which also smooths aliasing inside the triangle (a sharp texture, specular highlights) at up to rasterizationSamples times the shading cost.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {cells}
        <polygon points={pts.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={C.amber} strokeWidth={1.2} strokeDasharray="4 3" />
        {pts.map((p, i) => <Handle key={i} x={p.x} y={p.y} color={C.amber} active={drag.dragging === i} />)}
        <T x={W - OX} y={H - 2} size={8} anchor="end">{GW} × {GH} {L("px", "pixels")}</T>
      </svg>
    </Figure>
  );
}
