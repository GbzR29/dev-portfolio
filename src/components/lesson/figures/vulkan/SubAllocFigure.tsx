"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A linear sub-allocator filling one 64 KiB VkDeviceMemory block. Every
// resource is placed at alignUp(end of the previous one, its alignment); the
// gap that rounding creates is padding (red hatching). The table repeats the
// arithmetic row by row. Sorting by alignment, largest first, shows how the
// order of placement changes the waste, and the readouts compare the single
// vkAllocateMemory call with one call per resource.

type Kind = "vertex" | "uniform" | "index" | "texture";
const KINDS: Record<Kind, { size: number; align: number; color: string; en: string }> = {
  vertex:  { size: 3000,  align: 16,   color: C.sky,    en: "vertex buffer" },
  uniform: { size: 200,   align: 256,  color: C.purple, en: "uniform buffer" },
  index:   { size: 1200,  align: 4,    color: C.teal,   en: "index buffer" },
  texture: { size: 16384, align: 4096, color: C.amber,  en: "texture" },
};
const ORDER: Kind[] = ["vertex", "uniform", "index", "texture"];
const START: Kind[] = ["vertex", "uniform", "index", "uniform", "texture"];
const BLOCK = 65536, MAX = 9;
const W = 640, BX = 10, BW = W - 20, BY = 22, BH = 34, TY = BY + BH + 34, ROW = 15;

const alignUp = (o: number, a: number) => (o + a - 1) & ~(a - 1);
const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

export function SubAllocFigure({ t }: { t?: TrackTranslations }) {
  const [items, setItems] = useState<Kind[]>(START);
  const [sorted, setSorted] = useState(false);
  const L = (k: string, en: string) => tx(t, `figVkSub_${k}`, en);

  const order = sorted
    ? items.map((k, i) => ({ k, i })).sort((a, b) => KINDS[b.k].align - KINDS[a.k].align || a.i - b.i)
    : items.map((k, i) => ({ k, i }));

  // ── Placement ──
  let end = 0;
  const placed = order.map(({ k, i }) => {
    const { size, align } = KINDS[k];
    const off = alignUp(end, align);
    const row = { k, n: i + 1, prev: end, off, pad: off - end, size, fits: off + size <= BLOCK };
    if (row.fits) end = off + size;
    return row;
  });
  const fitting = placed.filter(p => p.fits);
  const used = fitting.reduce((s, p) => s + p.size, 0);
  const padding = fitting.reduce((s, p) => s + p.pad, 0);
  const sx = (b: number) => BX + (b / BLOCK) * BW;
  const H = TY + 8 + (placed.length + 1) * ROW;

  const add = (k: Kind) => setItems(v => (v.length < MAX ? [...v, k] : v));

  return (
    <Figure
      title={L("title", "Sub-allocating one memory block")}
      head={<>
        <Btn active={!sorted} onClick={() => setSorted(false)}>{L("asCreated", "as created")}</Btn>
        <Btn active={sorted} onClick={() => setSorted(true)}>{L("sorted", "largest alignment first")}</Btn>
      </>}
      controls={<>
        <Row>
          {ORDER.map(k => (
            <Btn key={k} onClick={() => add(k)}>+ {L(`k_${k}`, KINDS[k].en)} ({fmt(KINDS[k].size)} B, align {fmt(KINDS[k].align)})</Btn>
          ))}
          <Btn onClick={() => setItems(v => v.slice(0, -1))}>{L("undo", "undo")}</Btn>
          <Btn onClick={() => setItems(START)}>{L("reset", "reset")}</Btn>
        </Row>
        <Row>
          <Readout>{L("used", "used")} {fmt(used)} B</Readout>
          <Readout color={padding ? C.red : undefined}>{L("padding", "padding")} {fmt(padding)} B</Readout>
          <Readout>{L("free", "free")} {fmt(BLOCK - end)} B</Readout>
          <Readout>vkAllocateMemory: 1 × 64 KiB {L("vs", "instead of")} {items.length}</Readout>
        </Row>
      </>}
      note={L("note", "The bar is one 64 KiB allocation. Each resource is placed right after the previous one, rounded up to its own alignment with alignUp(o, a) = (o + a − 1) & ~(a − 1); the red hatching is the padding that rounding leaves. Uniform buffers must start at a multiple of minUniformBufferOffsetAlignment (256 here, a common value), and images often need 4 KiB or even 64 KiB. Add a few resources and watch the table: the texture after small buffers wastes almost a whole alignment step. Placing the most-aligned resources first reduces padding, which is one of the tricks real allocators like VMA use, together with free lists and separate blocks per memory type.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <defs>
          <pattern id="vksub-pad" width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={5} stroke={C.red} strokeWidth={2} />
          </pattern>
        </defs>
        <T x={BX} y={BY - 7} size={8.5} color={C.fg} bold>VkDeviceMemory · 65 536 B</T>
        <rect x={BX} y={BY} width={BW} height={BH} fill={C.bg} stroke={C.axis} />
        {[0, 16384, 32768, 49152, 65536].map(b => (
          <g key={b}>
            <line x1={sx(b)} y1={BY + BH} x2={sx(b)} y2={BY + BH + 4} stroke={C.axis} />
            <T x={sx(b)} y={BY + BH + 13} size={7.5} anchor={b === 0 ? "start" : b === BLOCK ? "end" : "middle"}>{b === 0 ? "0" : `${b / 1024} KiB`}</T>
          </g>
        ))}
        {fitting.map((p, j) => (
          <g key={j}>
            {p.pad > 0 && <rect x={sx(p.prev)} y={BY + 1} width={Math.max(sx(p.off) - sx(p.prev), 1)} height={BH - 2} fill="url(#vksub-pad)" opacity={0.7} />}
            <rect x={sx(p.off)} y={BY + 1} width={Math.max(sx(p.off + p.size) - sx(p.off), 2)} height={BH - 2}
              fill={KINDS[p.k].color} fillOpacity={0.45} stroke={KINDS[p.k].color} />
            {sx(p.off + p.size) - sx(p.off) > 16 && <T x={(sx(p.off) + sx(p.off + p.size)) / 2} y={BY + BH / 2 + 3} size={8} anchor="middle" color={C.fg}>{p.n}</T>}
          </g>
        ))}

        {/* ── The arithmetic, one row per resource ── */}
        {["#", L("resource", "resource"), L("prevEnd", "o = previous end"), "a", "alignUp(o, a)", L("padding", "padding"), L("size", "size")].map((h, i) => (
          <T key={i} x={[BX, 30, 150, 270, 330, 450, 540][i]} y={TY} size={8} bold>{h}</T>
        ))}
        {placed.map((p, j) => {
          const y = TY + (j + 1) * ROW, col = p.fits ? C.fg : C.red;
          return (
            <g key={j}>
              <T x={BX} y={y} size={8.5} color={KINDS[p.k].color} bold>{p.n}</T>
              <T x={30} y={y} size={8.5} color={col}>{L(`k_${p.k}`, KINDS[p.k].en)}</T>
              <T x={150} y={y} size={8.5} color={col}>{fmt(p.prev)}</T>
              <T x={270} y={y} size={8.5} color={col}>{fmt(KINDS[p.k].align)}</T>
              <T x={330} y={y} size={8.5} color={col} bold>{p.fits ? fmt(p.off) : L("full", "does not fit")}</T>
              <T x={450} y={y} size={8.5} color={p.pad ? C.red : col}>{p.fits ? fmt(p.pad) : "–"}</T>
              <T x={540} y={y} size={8.5} color={col}>{fmt(p.size)}</T>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
