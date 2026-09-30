"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The queue families a GPU reports (typical layouts, not exact values for any
// one driver), each with its capability flags, its number of queues and
// whether it can present to our window. The chapter's selection rules are
// applied live: graphics, present (the same family when possible), and, for
// later chapters, a dedicated transfer family and an async-compute family.
// The resulting VkDeviceQueueCreateInfo list has one entry per distinct family.

type Fam = { flags: string; count: number; present: boolean };
type Gpu = "nvidia" | "amd" | "intel" | "mobile" | "split";
const GPUS: Record<Gpu, Fam[]> = {
  nvidia: [
    { flags: "GCTS", count: 16, present: true },
    { flags: "TS", count: 2, present: false },
    { flags: "CTS", count: 8, present: true },
    { flags: "V", count: 1, present: false },
  ],
  amd: [
    { flags: "GCTS", count: 1, present: true },
    { flags: "CTS", count: 4, present: true },
    { flags: "TS", count: 2, present: false },
  ],
  intel: [{ flags: "GCT", count: 1, present: true }],
  mobile: [{ flags: "GCT", count: 2, present: true }],
  split: [
    { flags: "GCT", count: 1, present: false },
    { flags: "CT", count: 1, present: true },
  ],
};
const GPU_LABEL: Record<Gpu, string> = {
  nvidia: "discrete, NVIDIA-like", amd: "discrete, AMD-like", intel: "integrated", mobile: "mobile", split: "rare: split present",
};
const FLAG: Record<string, [string, string]> = {
  G: ["GRAPHICS", C.red], C: ["COMPUTE", C.sky], T: ["TRANSFER", C.green], S: ["SPARSE", C.muted], V: ["VIDEO_DECODE", C.purple],
};

const NONE = -1;
function pick(fams: Fam[]) {
  const has = (f: Fam, c: string) => f.flags.includes(c);
  let graphics = fams.findIndex(f => has(f, "G") && f.present);
  if (graphics === NONE) graphics = fams.findIndex(f => has(f, "G"));
  const present = graphics !== NONE && fams[graphics].present ? graphics : fams.findIndex(f => f.present);
  let transfer = fams.findIndex(f => has(f, "T") && !has(f, "G") && !has(f, "C"));
  if (transfer === NONE) transfer = fams.findIndex(f => has(f, "T") && !has(f, "G"));
  if (transfer === NONE) transfer = graphics;
  const compute = fams.findIndex(f => has(f, "C") && !has(f, "G"));
  return { graphics, present, transfer, compute };
}

const W = 600, ROW = 46, Y0 = 34;

export function QueueFamilyFigure({ t }: { t?: TrackTranslations }) {
  const [gpu, setGpu] = useState<Gpu>("nvidia");
  const fams = GPUS[gpu];
  const r = pick(fams);
  const unique = [...new Set([r.graphics, r.present])].filter(i => i !== NONE);
  const H = Y0 + fams.length * ROW + 18;

  const roles = (i: number) => [
    i === r.graphics && ["graphics", C.red],
    i === r.present && ["present", C.amber],
    i === r.transfer && i !== r.graphics && ["transfer", C.green],
    i === r.compute && ["async compute", C.sky],
  ].filter(Boolean) as [string, string][];

  return (
    <Figure
      title={tx(t, "figVkQueue_title", "Queue families and which ones we pick")}
      head={<Choice value={gpu} onChange={setGpu} options={(Object.keys(GPUS) as Gpu[]).map(g => [g, tx(t, `figVkQueue_g_${g}`, GPU_LABEL[g])] as const)} />}
      controls={<>
        <Row>
          <Readout color={C.red}>graphics = {r.graphics}</Readout>
          <Readout color={C.amber}>present = {r.present}</Readout>
          <Readout color={C.green}>transfer = {r.transfer}{r.transfer === r.graphics ? ` (${tx(t, "figVkQueue_shared", "shared")})` : ""}</Readout>
          <Readout color={C.sky}>async compute = {r.compute === NONE ? "—" : r.compute}</Readout>
        </Row>
        <Row>
          <Readout>{unique.length} × VkDeviceQueueCreateInfo {`{ ${unique.map(i => `family ${i}`).join(", ")} }`}</Readout>
        </Row>
      </>}
      note={tx(t, "figVkQueue_note", "Each row is a queue family: a set of identical hardware queues with the same abilities. G, C, T, S and V are the capability flags; the small squares are the queues in the family; the screen icon means vkGetPhysicalDeviceSurfaceSupportKHR said yes for our window. Graphics and present almost always land on the same family, so one queue does both. Dedicated transfer and compute families are separate hardware engines that can copy or compute while the graphics queue draws; later chapters use them. The layouts are typical examples, not exact values for any specific driver: always query, never assume.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={14} y={20} size={8.5}>{tx(t, "figVkQueue_family", "family")}</T>
        <T x={62} y={20} size={8.5}>{tx(t, "figVkQueue_flags", "queueFlags")}</T>
        <T x={236} y={20} size={8.5}>queueCount</T>
        <T x={452} y={20} size={8.5}>{tx(t, "figVkQueue_role", "our use")}</T>
        {fams.map((f, i) => {
          const y = Y0 + i * ROW, picked = unique.includes(i);
          return (
            <g key={`${gpu}-${i}`}>
              <rect x={6} y={y} width={W - 12} height={ROW - 8} rx={6} fill={picked ? C.red : "var(--card)"} fillOpacity={picked ? 0.08 : 1}
                stroke={picked ? C.red : C.axis} strokeOpacity={picked ? 0.6 : 1} />
              <T x={24} y={y + 24} size={13} bold anchor="middle" color={C.fg}>{i}</T>
              {[...f.flags].map((c, k) => (
                <g key={c}>
                  <rect x={46 + k * 42} y={y + 9} width={38} height={20} rx={4} fill={FLAG[c][1]} fillOpacity={0.22} stroke={FLAG[c][1]} />
                  <T x={65 + k * 42} y={y + 23} size={10} bold anchor="middle" color={C.fg}>{c}</T>
                </g>
              ))}
              {Array.from({ length: f.count }, (_, q) => (
                <rect key={q} x={236 + (q % 8) * 13} y={y + 6 + Math.floor(q / 8) * 13} width={10} height={10} rx={2} fill={C.fg} fillOpacity={0.55} />
              ))}
              <T x={236 + Math.min(f.count, 8) * 13 + 6} y={y + 17} size={9}>×{f.count}</T>
              {/* present support: a small screen */}
              <g opacity={f.present ? 1 : 0.25}>
                <rect x={394} y={y + 9} width={26} height={16} rx={2} fill="none" stroke={f.present ? C.amber : C.axis} strokeWidth={1.5} />
                <line x1={402} y1={y + 29} x2={412} y2={y + 29} stroke={f.present ? C.amber : C.axis} strokeWidth={1.5} />
                {!f.present && <line x1={392} y1={y + 29} x2={422} y2={y + 7} stroke={C.red} strokeWidth={1.5} />}
              </g>
              {roles(i).map(([name, col], k) => (
                <T key={name} x={452} y={y + 14 + k * 11} size={9} bold color={col}>{tx(t, `figVkQueue_r_${name.replace(" ", "")}`, name)}</T>
              ))}
            </g>
          );
        })}
        <T x={14} y={H - 8} size={8}>G {FLAG.G[0]} · C {FLAG.C[0]} · T {FLAG.T[0]} · S {FLAG.S[0]} · V {FLAG.V[0]}</T>
      </svg>
    </Figure>
  );
}
