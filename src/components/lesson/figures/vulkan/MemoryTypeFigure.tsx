"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Readout, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The memory heaps and types of four typical GPUs, as
// vkGetPhysicalDeviceMemoryProperties reports them, and findMemoryType run
// on them: the resource decides memoryTypeBits (which types are allowed), the
// toggles decide the wanted property flags, and the loop picks the first type
// that is allowed and has every wanted flag. Each row says why it was
// skipped, so the bit test and the subset test can be followed by eye.

type Flag = "DL" | "HV" | "HC" | "HCA" | "LA";
type Gpu = "discrete" | "rebar" | "integrated" | "mobile";
type Res = "buffer" | "image" | "transient";
type Heap = { name: string; size: string; local: boolean };
type MemType = { heap: number; flags: Flag[]; use: string };

const FLAGS: [Flag, string, string, number][] = [
  ["DL", "DEVICE_LOCAL", C.green, 70],
  ["HV", "HOST_VISIBLE", C.sky, 70],
  ["HC", "HOST_COHERENT", C.teal, 78],
  ["HCA", "HOST_CACHED", C.purple, 66],
  ["LA", "LAZILY_ALLOC", C.amber, 70],
];
const FLAG = Object.fromEntries(FLAGS.map(f => [f[0], f])) as Record<Flag, (typeof FLAGS)[number]>;

const GPUS: Record<Gpu, { heaps: Heap[]; types: MemType[] }> = {
  discrete: {
    heaps: [{ name: "VRAM", size: "8 GiB", local: true }, { name: "system RAM", size: "16 GiB", local: false }, { name: "BAR", size: "256 MiB", local: true }],
    types: [
      { heap: 1, flags: [], use: "uNone" },
      { heap: 0, flags: ["DL"], use: "uVram" },
      { heap: 1, flags: ["HV", "HC"], use: "uUpload" },
      { heap: 1, flags: ["HV", "HC", "HCA"], use: "uReadback" },
      { heap: 2, flags: ["DL", "HV", "HC"], use: "uBar" },
    ],
  },
  rebar: {
    heaps: [{ name: "VRAM", size: "8 GiB", local: true }, { name: "system RAM", size: "16 GiB", local: false }],
    types: [
      { heap: 1, flags: [], use: "uNone" },
      { heap: 0, flags: ["DL"], use: "uVram" },
      { heap: 1, flags: ["HV", "HC"], use: "uUpload" },
      { heap: 1, flags: ["HV", "HC", "HCA"], use: "uReadback" },
      { heap: 0, flags: ["DL", "HV", "HC"], use: "uRebar" },
    ],
  },
  integrated: {
    heaps: [{ name: "shared RAM", size: "16 GiB", local: true }],
    types: [
      { heap: 0, flags: ["DL"], use: "uShared" },
      { heap: 0, flags: ["DL", "HV", "HC"], use: "uSharedHost" },
      { heap: 0, flags: ["DL", "HV", "HC", "HCA"], use: "uReadback" },
    ],
  },
  mobile: {
    heaps: [{ name: "shared RAM", size: "8 GiB", local: true }],
    types: [
      { heap: 0, flags: ["DL", "HV", "HC"], use: "uSharedHost" },
      { heap: 0, flags: ["DL", "HV", "HCA"], use: "uNonCoherent" },
      { heap: 0, flags: ["DL", "LA"], use: "uLazy" },
    ],
  },
};

const USE_EN: Record<string, string> = {
  uNone: "no properties: reserved for resources the driver places itself",
  uVram: "VRAM: the GPU's fastest memory; the CPU cannot map it",
  uUpload: "write-combined RAM: CPU writes fast, GPU reads over PCIe (staging, per-frame data)",
  uReadback: "cached RAM: fast for the CPU to read back GPU results",
  uBar: "the 256 MiB window of VRAM the CPU can write through PCIe",
  uRebar: "Resizable BAR: all of VRAM is CPU-writable",
  uShared: "the same RAM as the CPU; nothing is faster for this GPU",
  uSharedHost: "shared RAM the CPU can map: no copy needed at all",
  uNonCoherent: "cached but not coherent: flush after writing, invalidate before reading",
  uLazy: "may never be allocated: attachments that stay in tile memory",
};

const GPU_LABELS: [Gpu, string][] = [["discrete", "discrete"], ["rebar", "discrete + ReBAR"], ["integrated", "integrated"], ["mobile", "mobile (tiled)"]];

/** memoryTypeBits the resource would report on this GPU. */
function typeBits(types: MemType[], res: Res) {
  let bits = 0;
  types.forEach((m, i) => {
    const lazy = m.flags.includes("LA");
    const ok = res === "buffer" ? !lazy && m.flags.length > 0          // the flagless type is the driver's

      : res === "image" ? m.flags.includes("DL") && !lazy
      : m.flags.includes("DL");
    if (ok) bits |= 1 << i;
  });
  return bits;
}

const W = 640, ROW = 30, Y0 = 70;

export function MemoryTypeFigure({ t }: { t?: TrackTranslations }) {
  const [gpu, setGpu] = useState<Gpu>("discrete");
  const [res, setRes] = useState<Res>("buffer");
  const [want, setWant] = useState<Flag[]>(["HV", "HC"]);
  const L = (k: string, en: string) => tx(t, `figVkMem_${k}`, en);

  const { heaps, types } = GPUS[gpu];
  const bits = typeBits(types, res);
  const has = (m: MemType) => want.every(f => m.flags.includes(f));
  const chosen = types.findIndex((m, i) => (bits >> i) & 1 && has(m));
  const H = Y0 + types.length * ROW + 8;
  const toggle = (f: Flag) => setWant(w => (w.includes(f) ? w.filter(x => x !== f) : [...w, f]));

  const status = (m: MemType, i: number): [string, string] => {
    if (!((bits >> i) & 1)) return [L("notAllowed", "bit not set: not allowed"), C.muted];
    const miss = want.filter(f => !m.flags.includes(f));
    if (miss.length) return [`${L("missing", "missing")} ${miss.map(f => FLAG[f][1]).join(", ")}`, C.muted];
    if (i === chosen) return [L("first", "✓ first match: chosen"), C.green];
    return [L("also", "✓ also matches (later)"), C.fg];
  };

  const binary = types.map((_, i) => (bits >> i) & 1).reverse().join("");

  return (
    <Figure
      title={L("title", "Memory heaps, memory types and findMemoryType")}
      head={<Choice value={gpu} onChange={setGpu} options={GPU_LABELS.map(([k, en]) => [k, L(`g_${k}`, en)] as const)} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{L("resource", "resource")}</span>
          <Choice value={res} onChange={setRes} options={[
            ["buffer", L("rBuffer", "vertex buffer")],
            ["image", L("rImage", "texture (optimal tiling)")],
            ["transient", L("rTransient", "transient attachment")],
          ] as const} />
        </Row>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">want</span>
          {FLAGS.map(([f, name]) => <Btn key={f} active={want.includes(f)} onClick={() => toggle(f)}>{name}</Btn>)}
        </Row>
        <Row>
          <Readout>memoryTypeBits = 0b{binary} = {bits}</Readout>
          <Readout color={chosen < 0 ? C.red : C.green}>
            {chosen < 0 ? L("none", "no type matches: drop a wanted flag and try again")
              : `findMemoryType → ${chosen} (${heaps[types[chosen].heap].name})`}
          </Readout>
        </Row>
        {chosen >= 0 && <p className="text-[12.5px] leading-relaxed text-[var(--text-muted)]">{L(types[chosen].use, USE_EN[types[chosen].use])}</p>}
      </>}
      note={L("note", "The top row lists the heaps: physical pools of memory with a size (green border: DEVICE_LOCAL). Each row below is a memory type: the heap it belongs to and its property flags. The resource decides memoryTypeBits, so a texture with optimal tiling is not allowed in plain system RAM, and only a transient attachment may use lazily allocated memory. findMemoryType walks the types from 0 upwards and returns the first one whose bit is set and whose flags contain every wanted flag. Compare the four GPUs: on the discrete card the CPU-mappable memory is system RAM (or a small window of VRAM), on an integrated or mobile GPU everything is DEVICE_LOCAL and most of it is also HOST_VISIBLE, which is why a staging copy only pays off on discrete cards.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {heaps.map((h, i) => {
          const hw = (W - 20) / heaps.length - 8, hx = 10 + i * (hw + 8);
          return (
            <g key={i}>
              <rect x={hx} y={8} width={hw} height={36} rx={6} fill={C.bg} stroke={h.local ? C.green : C.axis} strokeWidth={h.local ? 1.6 : 1} />
              <T x={hx + 10} y={23} size={9} bold color={C.fg}>{`heap ${i}: ${L(`h_${h.name}`, h.name)}`}</T>
              <T x={hx + 10} y={36} size={8}>{h.size}{h.local ? " · DEVICE_LOCAL" : ""}</T>
            </g>
          );
        })}
        <T x={10} y={Y0 - 8} size={8}>type</T>
        <T x={48} y={Y0 - 8} size={8}>bit</T>
        <T x={78} y={Y0 - 8} size={8}>heap</T>
        <T x={140} y={Y0 - 8} size={8}>propertyFlags</T>
        {types.map((m, i) => {
          const y = Y0 + i * ROW, allowed = (bits >> i) & 1, [msg, col] = status(m, i);
          let cx = 140;
          return (
            <g key={i}>
              <rect x={4} y={y} width={W - 8} height={ROW - 4} rx={5}
                fill={i === chosen ? C.green : "transparent"} fillOpacity={0.12}
                stroke={i === chosen ? C.green : C.grid} strokeWidth={i === chosen ? 1.6 : 1} />
              <T x={14} y={y + 17} size={10} bold color={C.fg}>{i}</T>
              <rect x={46} y={y + 6} width={16} height={14} rx={3} fill={allowed ? C.sky : "transparent"} fillOpacity={0.3} stroke={allowed ? C.sky : C.axis} />
              <T x={54} y={y + 17} size={9} anchor="middle" color={C.fg}>{allowed}</T>
              <T x={78} y={y + 17} size={9} color={C.fg}>{m.heap}</T>
              {m.flags.length === 0 && <T x={cx} y={y + 17} size={8.5}>0</T>}
              {m.flags.map(f => {
                const [, name, color, w] = FLAG[f], x0 = cx, wanted = want.includes(f);
                cx += w + 4;
                return (
                  <g key={f}>
                    <rect x={x0} y={y + 5} width={w} height={16} rx={4} fill={color} fillOpacity={wanted ? 0.35 : 0.12} stroke={color} strokeWidth={wanted ? 1.5 : 0.8} />
                    <T x={x0 + w / 2} y={y + 16} size={7.5} anchor="middle" color={C.fg} bold={wanted}>{name}</T>
                  </g>
                );
              })}
              <T x={W - 12} y={y + 17} size={8.5} anchor="end" color={col} bold={i === chosen}>{msg}</T>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
