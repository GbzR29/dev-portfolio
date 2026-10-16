"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Figure } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Measured time for one load that depends on the previous one (p = *p, a
// random cycle of pointers, one per 64-byte line) as the data grows from 4 KiB
// to 256 MiB, on a Ryzen 5 5600X: 32 KiB L1 data cache per core, 512 KiB L2
// per core, 32 MiB L3 shared, then DDR4 memory. The steps of the staircase are
// the cache levels. Clicking a point shows its size, time and the clock cycles
// that time is worth at about 4.6 GHz.

const DATA: [kib: number, ns: number][] = [
  [4, 0.87], [16, 0.87], [32, 0.9], [64, 2.6], [128, 2.61], [256, 2.62], [512, 5.09], [1024, 9.44],
  [2048, 10.83], [4096, 11.43], [8192, 13.99], [16384, 22.76], [32768, 58.37], [65536, 85.92], [262144, 100.5],
];
const GHZ = 4.6;
const BANDS: [label: string, to: number, color: string][] = [
  ["L1", 32, C.green], ["L2", 512, C.sky], ["L3", 32768, C.purple], ["RAM", 262144, C.orange],
];

const W = 640, H = 300, L = 46, R = 34, T = 16, B = 40;
const xOf = (kib: number) => L + ((Math.log2(kib) - 2) / (18 - 2)) * (W - L - R);
const yOf = (ns: number) => T + (1 - (Math.log10(ns) - Math.log10(0.5)) / (Math.log10(200) - Math.log10(0.5))) * (H - T - B);
const size = (kib: number) => (kib >= 1024 ? `${kib / 1024} MiB` : `${kib} KiB`);

export function LatencyFigure({ t }: { t?: TrackTranslations }) {
  const [sel, setSel] = useState(10);
  const [kib, ns] = DATA[sel];
  const level = BANDS.find(b => kib <= b[1]) ?? BANDS[3];

  return (
    <Figure
      title={tx(t, "figAsmLat_title", "How far away is memory?")}
      note={tx(t, "figAsmLat_how", "Measured on a Ryzen 5 5600X: one dependent load at a time, data spread over the size on the bottom axis. Both axes are logarithmic. Click a point.")}
    >
      <div className="p-2 sm:p-3 flex flex-col gap-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={tx(t, "figAsmLat_title", "How far away is memory?")}>
          {BANDS.map(([label, to, color], i) => {
            const from = i === 0 ? 4 : BANDS[i - 1][1];
            return (
              <g key={label}>
                <rect x={xOf(from)} y={T} width={xOf(to) - xOf(from)} height={H - T - B} fill={color} opacity={0.08} />
                <text x={(xOf(from) + xOf(to)) / 2} y={T + 14} textAnchor="middle" fontSize={12} fontWeight={700} fill={color}>{label}</text>
              </g>
            );
          })}
          {[1, 10, 100].map(v => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={yOf(v)} y2={yOf(v)} stroke="var(--code-line)" />
              <text x={L - 6} y={yOf(v) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">{v} ns</text>
            </g>
          ))}
          {[4, 32, 512, 4096, 32768, 262144].map(k => (
            <text key={k} x={xOf(k)} y={H - B + 16} textAnchor="middle" fontSize={11} fill="var(--text-muted)">{size(k)}</text>
          ))}
          <polyline fill="none" stroke="var(--text-main)" strokeWidth={1.5} points={DATA.map(([k, v]) => `${xOf(k)},${yOf(v)}`).join(" ")} />
          {DATA.map(([k, v], i) => (
            <g key={k} onClick={() => setSel(i)} className="cursor-pointer">
              <circle cx={xOf(k)} cy={yOf(v)} r={12} fill="transparent" />
              <circle cx={xOf(k)} cy={yOf(v)} r={i === sel ? 6 : 4} fill={i === sel ? C.amber : "var(--text-main)"} />
            </g>
          ))}
        </svg>
        <p className="font-mono tabular-nums text-[12.5px] text-[var(--text-main)] px-1">
          {tx(t, "figAsmLat_read", "{s}: {n} ns per load, about {c} cycles. Where the data fits: {l}.")
            .replace("{s}", size(kib)).replace("{n}", String(ns)).replace("{c}", String(Math.round(ns * GHZ)))
            .replace("{l}", level[0] === "RAM" ? tx(t, "figAsmLat_ram", "no cache: it comes from RAM") : level[0])}
        </p>
      </div>
    </Figure>
  );
}
