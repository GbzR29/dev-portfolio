"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Slider, Sliders, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// One VBO holding three interleaved vertices, [x y z r g b] each: 18 floats,
// 72 bytes. Two glVertexAttribPointer calls describe it: location 0 (the
// position) and location 1 (the colour), each with a size, a stride and an
// offset. The vertex fetcher reads component k of vertex i from byte
// offset + i · stride + 4k; the brackets show exactly which floats each vertex
// receives, and the triangle is rendered from what was read. Wrong strides and
// offsets scramble it, and reads past the end of the buffer are flagged.
// Components the attribute does not supply default to 0 (and w to 1).

const VERTS = [
  [-0.6, -0.55, 0, 1, 0.27, 0.27],
  [0.65, -0.45, 0, 0.13, 0.77, 0.37],
  [0.0, 0.65, 0, 0.23, 0.51, 0.96],
];
const DATA = VERTS.flat();                                  // 18 floats
const BYTES = DATA.length * 4;                              // 72
const FIELD = ["x", "y", "z", "r", "g", "b"];

type Attr = { size: number; stride: number; offset: number };
type Layout = { pos: Attr; col: Attr };
const PRESETS: Record<string, [string, string, Layout]> = {
  ok: ["figGlLayout_pOk", "correct", { pos: { size: 3, stride: 24, offset: 0 }, col: { size: 3, stride: 24, offset: 12 } }],
  stride12: ["figGlLayout_pStride", "stride 12 (forgot the colour)", { pos: { size: 3, stride: 12, offset: 0 }, col: { size: 3, stride: 12, offset: 12 } }],
  off0: ["figGlLayout_pOff", "colour offset 0", { pos: { size: 3, stride: 24, offset: 0 }, col: { size: 3, stride: 24, offset: 0 } }],
  size2: ["figGlLayout_pSize", "position size 2", { pos: { size: 2, stride: 24, offset: 0 }, col: { size: 3, stride: 24, offset: 12 } }],
  zero: ["figGlLayout_pZero", "stride 0", { pos: { size: 3, stride: 0, offset: 0 }, col: { size: 3, stride: 0, offset: 12 } }],
};

/** What one attribute delivers to vertex i: 4 components (defaults 0, 0, 0, 1) and whether any read ran past the end. */
function fetch(a: Attr, i: number) {
  const stride = a.stride || a.size * 4;                    // 0 means tightly packed
  const out = [0, 0, 0, 1];
  let oob = false;
  for (let k = 0; k < a.size; ++k) {
    const byte = a.offset + i * stride + 4 * k;
    if (byte + 4 > BYTES) { oob = true; out[k] = 0; } else out[k] = DATA[byte / 4];
  }
  return { v: out, oob, start: a.offset + i * stride, stride };
}

const W = 620, CELL = 30, SX = 24, SY = 58;
const VCOL = [C.red, C.green, C.blue];
const CW = 240, CH = 150;

function renderTriangle(canvas: HTMLCanvasElement, pos: number[][], col: number[][]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(CW, CH);
  const p = pos.map(v => ({ x: ((v[0] + 1) / 2) * CW, y: CH - ((v[1] + 1) / 2) * CH }));
  const e = (a: { x: number; y: number }, b: { x: number; y: number }, x: number, y: number) => (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
  const area = e(p[0], p[1], p[2].x, p[2].y);
  for (let y = 0; y < CH; ++y) for (let x = 0; x < CW; ++x) {
    const o = (y * CW + x) * 4;
    img.data[o] = 16; img.data[o + 1] = 18; img.data[o + 2] = 26; img.data[o + 3] = 255;
    if (Math.abs(area) < 1e-6) continue;
    const w0 = e(p[1], p[2], x + 0.5, y + 0.5) / area, w1 = e(p[2], p[0], x + 0.5, y + 0.5) / area, w2 = 1 - w0 - w1;
    if (w0 < 0 || w1 < 0 || w2 < 0) continue;
    for (let k = 0; k < 3; ++k) img.data[o + k] = Math.round(255 * Math.min(1, Math.max(0, w0 * col[0][k] + w1 * col[1][k] + w2 * col[2][k])));
  }
  ctx.putImageData(img, 0, 0);
}

export function VertexLayoutFigure({ t }: { t?: TrackTranslations }) {
  const [lay, setLay] = useState<Layout>(PRESETS.ok[2]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pos = [0, 1, 2].map(i => fetch(lay.pos, i));
  const col = [0, 1, 2].map(i => fetch(lay.col, i));
  const oob = pos.some(r => r.oob) || col.some(r => r.oob);
  const key = JSON.stringify(lay);

  useEffect(() => {
    if (canvas.current) renderTriangle(canvas.current, pos.map(r => r.v), col.map(r => r.v));
    // pos/col are derived from `lay`; key captures it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = (a: keyof Layout, f: keyof Attr) => (v: number) => setLay(l => ({ ...l, [a]: { ...l[a], [f]: v } }));
  const bracket = (r: ReturnType<typeof fetch>, a: Attr, i: number, above: boolean, color: string) => {
    const x0 = SX + (r.start / 4) * CELL, x1 = Math.min(SX + ((r.start + a.size * 4) / 4) * CELL, SX + (BYTES / 4) * CELL + 42);
    const y = above ? SY - 8 - i * 9 : SY + 44 + i * 9;
    return (
      <g key={`${above}-${i}`}>
        <path d={above ? `M${x0 + 2} ${y + 5} L${x0 + 2} ${y} L${x1 - 2} ${y} L${x1 - 2} ${y + 5}` : `M${x0 + 2} ${y - 5} L${x0 + 2} ${y} L${x1 - 2} ${y} L${x1 - 2} ${y - 5}`}
          fill="none" stroke={r.oob ? C.red : color} strokeWidth={1.8} strokeDasharray={r.oob ? "3 2" : undefined} />
        <T x={x0 - 4} y={y + 3} size={7.5} anchor="end" color={VCOL[i]} bold>v{i}</T>
      </g>
    );
  };

  return (
    <Figure
      title={tx(t, "figGlLayout_title", "Describing a vertex layout")}
      head={<>{Object.entries(PRESETS).map(([k, [key, en, l]]) => (
        <Btn key={k} active={JSON.stringify(l) === JSON.stringify(lay)} onClick={() => setLay(l)}>{tx(t, key, en)}</Btn>
      ))}</>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figGlLayout_posSize", "pos · size")} value={lay.pos.size} min={1} max={4} step={1} onChange={set("pos", "size")} fmt={String} />
          <Slider label={tx(t, "figGlLayout_colSize", "colour · size")} value={lay.col.size} min={1} max={4} step={1} onChange={set("col", "size")} fmt={String} />
          <Slider label={tx(t, "figGlLayout_posStride", "pos · stride")} value={lay.pos.stride} min={0} max={32} step={4} onChange={set("pos", "stride")} fmt={v => `${v} B`} />
          <Slider label={tx(t, "figGlLayout_colStride", "colour · stride")} value={lay.col.stride} min={0} max={32} step={4} onChange={set("col", "stride")} fmt={v => `${v} B`} />
          <Slider label={tx(t, "figGlLayout_posOff", "pos · offset")} value={lay.pos.offset} min={0} max={24} step={4} onChange={set("pos", "offset")} fmt={v => `${v} B`} />
          <Slider label={tx(t, "figGlLayout_colOff", "colour · offset")} value={lay.col.offset} min={0} max={24} step={4} onChange={set("col", "offset")} fmt={v => `${v} B`} />
        </Sliders>
        <pre className="text-[11px] leading-snug font-mono p-3 rounded-lg bg-[var(--code-bg)] border border-[var(--border)] overflow-x-auto text-[var(--text-main)]">
{`glVertexAttribPointer(0, ${lay.pos.size}, GL_FLOAT, GL_FALSE, ${lay.pos.stride}, (void*)${lay.pos.offset});   // aPos
glVertexAttribPointer(1, ${lay.col.size}, GL_FLOAT, GL_FALSE, ${lay.col.stride}, (void*)${lay.col.offset});   // aColor`}
        </pre>
      </>}
      note={tx(t, "figGlLayout_note", "The buffer holds [x y z r g b] for each vertex: 6 floats, 24 bytes, so both attributes need stride 24, and the colour starts 12 bytes into each vertex. Try the presets. With stride 12 each vertex's \"position\" starts where the previous one's colour is, so colours are read as coordinates. Colour offset 0 reads the positions as colours (negative values clamp to black). Position size 2 still works, because the missing z defaults to 0. Stride 0 does not mean \"no stride\": it means tightly packed, the attribute's own size (12 bytes here), which is wrong for interleaved data. Red dashed brackets read past the 72-byte buffer: undefined behaviour, shown here as zeros.")}
    >
      <svg viewBox={`0 0 ${W} 140`} className="w-full h-auto" role="img">
        <T x={SX} y={14} size={8.5} color={C.sky} bold>{tx(t, "figGlLayout_reads0", "location 0 (aPos) reads")}</T>
        {pos.map((r, i) => bracket(r, lay.pos, i, true, C.sky))}
        {DATA.map((v, k) => (
          <g key={k}>
            <rect x={SX + k * CELL + 1} y={SY} width={CELL - 2} height={24} rx={3}
              fill={VCOL[Math.floor(k / 6)]} fillOpacity={k % 6 < 3 ? 0.14 : 0.3} stroke={C.axis} strokeWidth={0.6} />
            <T x={SX + k * CELL + CELL / 2} y={SY + 10} size={7} anchor="middle">{FIELD[k % 6]}</T>
            <T x={SX + k * CELL + CELL / 2} y={SY + 20} size={7.5} anchor="middle" color={C.fg}>{v.toFixed(2)}</T>
          </g>
        ))}
        <rect x={SX + 18 * CELL + 1} y={SY} width={38} height={24} rx={3} fill="none" stroke={C.red} strokeDasharray="3 2" opacity={0.6} />
        <T x={SX + 18 * CELL + 20} y={SY + 15} size={7} anchor="middle" color={C.red}>{tx(t, "figGlLayout_end", "end")}</T>
        {col.map((r, i) => bracket(r, lay.col, i, false, C.pink))}
        <T x={SX} y={134} size={8.5} color={C.pink} bold>{tx(t, "figGlLayout_reads1", "location 1 (aColor) reads")}</T>
        {[0, 24, 48, 72].map(b => <T key={b} x={SX + (b / 4) * CELL} y={SY + 33} size={6.5} anchor="middle">{b}</T>)}
      </svg>
      <div className="flex flex-wrap items-start gap-4 px-4 pb-4">
        <canvas ref={canvas} width={CW} height={CH} className="rounded-lg border border-[var(--border)]" style={{ width: CW, maxWidth: "100%", imageRendering: "auto" }} />
        <table className="font-mono text-[11px] text-[var(--text-main)] border-separate [border-spacing:10px_2px]">
          <thead><tr className="text-[var(--text-muted)]"><td /><td>aPos</td><td>aColor</td></tr></thead>
          <tbody>
            {[0, 1, 2].map(i => (
              <tr key={i}>
                <td style={{ color: VCOL[i] }}>v{i}</td>
                <td style={{ color: pos[i].oob ? C.red : undefined }}>({pos[i].v.slice(0, 3).map(x => x.toFixed(2)).join(", ")})</td>
                <td style={{ color: col[i].oob ? C.red : undefined }}>({col[i].v.slice(0, 3).map(x => x.toFixed(2)).join(", ")})</td>
              </tr>
            ))}
            {oob && <tr><td /><td colSpan={2} style={{ color: C.red }}>{tx(t, "figGlLayout_oob", "reads past the end of the buffer")}</td></tr>}
          </tbody>
        </table>
      </div>
    </Figure>
  );
}
