"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The post-processing pass needs geometry that covers every pixel once. Left:
// clip space, with the screen as the square [-1, 1]². A quad is two triangles
// sharing a diagonal; the alternative is one triangle with corners (-1,-1),
// (3,-1), (-1,3), whose hypotenuse passes exactly through the screen's corner
// (1, 1). Its vertices come from gl_VertexID alone, and the parts outside the
// screen are clipped away before any fragment exists.
// Right: a 16×10 screen in the 2×2 pixel blocks the GPU shades together.
// Blocks crossed by the quad's diagonal are shaded once per triangle (red);
// the readout counts them exactly at a real resolution.

type Mode = "quad" | "tri";
type V = [number, number];

const QUAD: V[] = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
const TRI: V[] = [[-1, -1], [3, -1], [-1, 3]];
const uv = (p: V): V => [(p[0] + 1) / 2, (p[1] + 1) / 2];

const S = 48, px = (x: number) => 14 + (x + 1.3) * S, py = (y: number) => 220 - (y + 1.3) * S;
const GW = 16, GH = 10, CELL = 22, GX = 254, GY = 4;
const RES = { "720": [1280, 720], "1080": [1920, 1080], "2160": [3840, 2160] } as const;
type Res = keyof typeof RES;

/** For every 2×2 block of a w×h screen: does the lower and/or upper triangle of the quad cover a pixel centre? */
function blocks(w: number, h: number) {
  const k = h / w;
  const out: { both: boolean; lower: boolean }[] = [];
  let both = 0;
  for (let by = 0; by < h / 2; by++) for (let bx = 0; bx < w / 2; bx++) {
    let lo = false, up = false;
    for (let j = 0; j < 4; j++) {
      const x = bx * 2 + (j & 1) + 0.5, y = by * 2 + (j >> 1) + 0.5;
      if (y < x * k) lo = true; else up = true;
    }
    if (lo && up) both++;
    if (w <= GW) out.push({ both: lo && up, lower: lo });
  }
  return { out, both };
}

export function FullscreenTriFigure({ t }: { t?: TrackTranslations }) {
  const L = (k: string, en: string) => tx(t, `figFsTri_${k}`, en);
  const [mode, setMode] = useState<Mode>("quad");
  const [res, setRes] = useState<Res>("1080");
  const small = useMemo(() => blocks(GW, GH), []);
  const [w, h] = RES[res];
  const big = useMemo(() => blocks(w, h).both, [w, h]);
  const verts = mode === "quad" ? QUAD : TRI;
  const quad = mode === "quad";

  return (
    <Figure
      title={L("title", "Covering the screen: quad or one triangle")}
      head={<Choice value={mode} onChange={setMode} options={[["quad", L("quad", "quad: 2 triangles")], ["tri", L("tri", "1 big triangle")]] as const} />}
      controls={<>
        <Row>
          <Choice value={res} onChange={setRes} options={[["720", "720p"], ["1080", "1080p"], ["2160", "4K"]] as const} />
          <Readout>{L("pixels", "pixels")} {(w * h).toLocaleString("en-US")}</Readout>
          <Readout color={quad ? C.red : C.green}>{L("twice", "blocks shaded twice")} {quad ? big.toLocaleString("en-US") : 0}</Readout>
          <Readout color={quad ? C.red : C.green}>{L("extra", "extra invocations")} {quad ? `${(big * 4).toLocaleString("en-US")} (${f2((big * 4 * 100) / (w * h), 2)}%)` : "0"}</Readout>
        </Row>
        <div className="font-mono text-[10.5px] text-[var(--text-muted)] flex flex-wrap gap-x-4">
          {verts.map((p, i) => (
            <span key={i} className="whitespace-nowrap">
              id {i}: pos ({p[0]}, {p[1]}) · uv ({uv(p)[0]}, {uv(p)[1]})
            </span>
          ))}
        </div>
      </>}
      note={L("note", "With the triangle, gl_VertexID 0, 1, 2 gives TexCoord (0,0), (2,0), (0,2) through two bit tricks, and position = TexCoord × 2 − 1. The screen square is exactly the part where TexCoord runs from 0 to 1, so the texture is sampled 1:1 and the rest is clipped away for free. The quad covers the same pixels, but GPUs run the fragment shader on 2×2 blocks (they need neighbours for texture derivatives), and every block the shared diagonal cuts through is run once for each triangle, with the pixels outside each triangle thrown away. At 1080p that is 720 blocks, about 0.14% extra work: small, so the real win of the triangle is that it needs no vertex buffer at all.")}
    >
      <svg viewBox="0 0 620 226" className="w-full h-auto" role="img">
        {/* clip space */}
        <line x1={px(-1.3)} x2={px(3.2)} y1={py(0)} y2={py(0)} stroke={C.grid} />
        <line x1={px(0)} x2={px(0)} y1={py(-1.3)} y2={py(3.2)} stroke={C.grid} />
        <polygon points={verts.slice(0, 3).map(p => `${px(p[0])},${py(p[1])}`).join(" ")}
          fill={C.sky} fillOpacity={0.18} stroke={C.sky} strokeWidth={1.5} />
        {quad && <polygon points={verts.slice(3).map(p => `${px(p[0])},${py(p[1])}`).join(" ")}
          fill={C.purple} fillOpacity={0.18} stroke={C.purple} strokeWidth={1.5} />}
        <rect x={px(-1)} y={py(1)} width={2 * S} height={2 * S} fill="none" stroke={C.fg} strokeWidth={2} />
        <T x={px(0.25)} y={py(-0.75)} size={8.5} color={C.fg}>{L("screen", "screen")}</T>
        {(quad ? [[-1, -1], [1, -1], [1, 1], [-1, 1]] as V[] : TRI).map((p, i) => (
          <g key={i}>
            <circle cx={px(p[0])} cy={py(p[1])} r={3.5} fill={C.amber} />
            <T x={px(p[0]) + 5} y={py(p[1]) + (p[1] > 0 ? 12 : -5)} size={8}>{`(${p[0]}, ${p[1]})`}</T>
          </g>
        ))}
        {/* pixel blocks */}
        {small.out.map((b, i) => {
          const bx = i % (GW / 2), by = Math.floor(i / (GW / 2));
          const twice = quad && b.both;
          return <rect key={i} x={GX + bx * 2 * CELL + 1} y={GY + (GH / 2 - 1 - by) * 2 * CELL + 1} width={2 * CELL - 2} height={2 * CELL - 2} rx={3}
            fill={twice ? C.red : quad ? (b.lower ? C.sky : C.purple) : C.sky} fillOpacity={twice ? 0.55 : 0.2} />;
        })}
        {Array.from({ length: GW + 1 }, (_, i) => <line key={`v${i}`} x1={GX + i * CELL} x2={GX + i * CELL} y1={GY} y2={GY + GH * CELL} stroke="var(--border)" strokeWidth={i % 2 ? 0.5 : 1.2} />)}
        {Array.from({ length: GH + 1 }, (_, i) => <line key={`h${i}`} x1={GX} x2={GX + GW * CELL} y1={GY + i * CELL} y2={GY + i * CELL} stroke="var(--border)" strokeWidth={i % 2 ? 0.5 : 1.2} />)}
        {quad && <line x1={GX} y1={GY + GH * CELL} x2={GX + GW * CELL} y2={GY} stroke={C.fg} strokeWidth={1.5} />}
      </svg>
    </Figure>
  );
}
