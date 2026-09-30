"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Sliders, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Where vertex data lives and what it costs the GPU to read it every frame.
// A discrete GPU has its own memory (VRAM) with very high bandwidth, reached
// from the CPU through the PCIe bus, which is much slower. An integrated GPU
// shares the system RAM. Bandwidths are typical round numbers: PCIe 4.0 x16
// ≈ 25 GB/s in practice, dual-channel DDR5 ≈ 60 GB/s, GDDR6 VRAM ≈ 450 GB/s.

type Where = "vram" | "pcie" | "shared";
const BW: Record<Where, number> = { vram: 450, pcie: 25, shared: 60 };   // GB/s
const PCIE = 25;

const W = 620, H = 150;

export function UploadFigure({ t }: { t?: TrackTranslations }) {
  const [where, setWhere] = useState<Where>("vram");
  const [logMb, setLogMb] = useState(2);          // 100 MB
  const mb = 10 ** logMb;
  const readMs = (mb / 1000 / BW[where]) * 1000;                   // one full read per frame
  const uploadMs = where === "shared" ? (mb / 1000 / BW.shared) * 1000 : (mb / 1000 / PCIE) * 1000;
  const inVram = where === "vram";
  const onGpuSide = where !== "pcie";
  const traffic = Math.min(14, 2 + Math.log10(1 + (mb * 60) / 100) * 4);

  return (
    <Figure
      title={tx(t, "figGlUp_title", "Where vertex data lives, and what reading it costs")}
      head={<Choice value={where} onChange={setWhere} options={[
        ["vram", tx(t, "figGlUp_vram", "VBO in VRAM")],
        ["pcie", tx(t, "figGlUp_pcie", "left in system RAM")],
        ["shared", tx(t, "figGlUp_shared", "integrated GPU")],
      ] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figGlUp_size", "vertex data")} value={logMb} min={-1} max={3} step={0.05} onChange={setLogMb}
            fmt={() => (mb < 1 ? `${f2(mb * 1000, 0)} KB` : `${f2(mb, mb < 10 ? 1 : 0)} MB`)} />
        </Sliders>
        <Row>
          <Readout>{tx(t, "figGlUp_upload", "one-time upload")}: {where === "pcie" ? "—" : `${f2(uploadMs, 2)} ms`}</Readout>
          <Readout color={readMs > 16.7 ? C.red : readMs > 1 ? C.amber : C.green}>{tx(t, "figGlUp_read", "GPU reads it once per frame")}: {f2(readMs, 2)} ms</Readout>
          <Readout>{tx(t, "figGlUp_bw", "bandwidth")}: {BW[where]} GB/s</Readout>
        </Row>
      </>}
      note={tx(t, "figGlUp_note", "Typical round numbers, not a benchmark. On a discrete card the fastest place for vertex data is the card's own memory, VRAM: the GPU reads it at hundreds of gigabytes per second. Data left in system RAM must cross the PCIe bus every time it is read, more than ten times slower. glBufferData lets the driver put the buffer where the GPU reads it fastest, so the slow crossing happens once, at upload, instead of every frame. An integrated GPU has no VRAM: it shares the system RAM with the CPU, so there is no bus to cross, but the bandwidth is shared and lower.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {/* CPU side */}
        <rect x={16} y={20} width={200} height={110} rx={10} fill="var(--card)" stroke={C.axis} />
        <T x={116} y={38} size={9.5} anchor="middle" bold color={C.fg}>{where === "shared" ? tx(t, "figGlUp_chip", "CPU + GPU chip, system RAM") : tx(t, "figGlUp_cpu", "CPU + system RAM")}</T>
        <rect x={40} y={52} width={152} height={30} rx={4} fill={C.sky} fillOpacity={0.2} stroke={C.sky} />
        <T x={116} y={71} size={8.5} anchor="middle" color={C.fg}>float vertices[] ({tx(t, "figGlUp_yours", "yours")})</T>
        {!inVram && <>
          <rect x={40} y={90} width={152} height={30} rx={4} fill={C.amber} fillOpacity={0.3} stroke={C.amber} />
          <T x={116} y={109} size={8.5} anchor="middle" color={C.fg}>{tx(t, "figGlUp_buffer", "buffer data")}</T>
        </>}
        {/* The bus */}
        {where !== "shared" && <>
          <rect x={216} y={62} width={188} height={16} fill={C.axis} fillOpacity={0.25} />
          <T x={310} y={56} size={8.5} anchor="middle">PCIe · ≈ {PCIE} GB/s</T>
          {where === "pcie" && <line x1={220} y1={70} x2={400} y2={70} stroke={C.red} strokeWidth={traffic} strokeOpacity={0.7} />}
          {where === "pcie" && <T x={310} y={96} size={8.5} anchor="middle" color={C.red}>{tx(t, "figGlUp_every", "every frame")}</T>}
          {inVram && <T x={310} y={96} size={8.5} anchor="middle" color={C.green}>{tx(t, "figGlUp_once", "crossed once, at upload")}</T>}
        </>}
        {/* GPU side */}
        {where !== "shared" && <>
          <rect x={404} y={20} width={200} height={110} rx={10} fill="var(--card)" stroke={C.axis} />
          <T x={504} y={38} size={9.5} anchor="middle" bold color={C.fg}>{tx(t, "figGlUp_gpu", "GPU + VRAM")}</T>
          {inVram && <>
            <rect x={428} y={52} width={152} height={30} rx={4} fill={C.green} fillOpacity={0.25} stroke={C.green} />
            <T x={504} y={71} size={8.5} anchor="middle" color={C.fg}>VBO · ≈ {BW.vram} GB/s</T>
          </>}
          <T x={504} y={112} size={8.5} anchor="middle">{tx(t, "figGlUp_cores", "shader cores")}</T>
        </>}
        {where === "shared" && <>
          <rect x={260} y={20} width={344} height={110} rx={10} fill="none" stroke={C.axis} strokeDasharray="4 3" />
          <T x={432} y={70} size={9} anchor="middle" color={C.fg}>{tx(t, "figGlUp_sharedText", "no bus: the GPU reads system RAM directly")}</T>
          <T x={432} y={86} size={8.5} anchor="middle">≈ {BW.shared} GB/s, {tx(t, "figGlUp_sharedWith", "shared with the CPU")}</T>
          <line x1={216} y1={105} x2={260} y2={105} stroke={C.amber} strokeWidth={3} />
        </>}
        {onGpuSide && where === "vram" && <line x1={504} y1={82} x2={504} y2={100} stroke={C.green} strokeWidth={3} />}
      </svg>
    </Figure>
  );
}
