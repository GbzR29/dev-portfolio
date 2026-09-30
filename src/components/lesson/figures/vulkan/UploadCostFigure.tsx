"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Slider, Sliders, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Three ways to give a mesh to the GPU, costed with t = S / B: leave it in
// host-visible memory (the GPU reads it over PCIe on every pass), stage it
// once into VRAM, or write it straight into CPU-visible VRAM (Resizable BAR;
// on an integrated GPU, where every type is DEVICE_LOCAL, only the staging
// copy and the direct write are compared). Each bar is the one-time
// upload (hatched) plus the per-frame reads times the number of frames. The
// bandwidths are typical round figures, not measurements of one machine.

type Gpu = "discrete" | "integrated";
const GB = 1e9;
const BW = { vram: 450 * GB, pcie: 25 * GB, cpu: 10 * GB, shared: 60 * GB };
const W = 640, X0 = 150, X1 = 628, ROW = 46, Y0 = 16;

type Strat = { key: string; en: string; once: number; frame: number; color: string };

export function UploadCostFigure({ t }: { t?: TrackTranslations }) {
  const [gpu, setGpu] = useState<Gpu>("discrete");
  const [mib, setMib] = useState(64);
  const [passes, setPasses] = useState(3);
  const [frames, setFrames] = useState(60);
  const L = (k: string, en: string) => tx(t, `figVkUp_${k}`, en);

  const S = mib * 1024 * 1024;
  const ms = (b: number) => (S / b) * 1000;              // t = S / B, in milliseconds
  const strats: Strat[] = gpu === "discrete"
    ? [
        { key: "host", en: "HOST_VISIBLE, read over PCIe", once: ms(BW.cpu), frame: passes * ms(BW.pcie), color: C.red },
        { key: "staging", en: "staging → DEVICE_LOCAL", once: ms(BW.cpu) + ms(BW.pcie), frame: passes * ms(BW.vram), color: C.green },
        { key: "rebar", en: "ReBAR: CPU writes VRAM", once: ms(BW.pcie), frame: passes * ms(BW.vram), color: C.sky },
      ]
    : [
        { key: "staging", en: "staging copy (same RAM)", once: ms(BW.cpu) + 2 * ms(BW.shared), frame: passes * ms(BW.shared), color: C.amber },
        { key: "direct", en: "DEVICE_LOCAL | HOST_VISIBLE", once: ms(BW.cpu), frame: passes * ms(BW.shared), color: C.green },
      ];
  const total = (s: Strat) => s.once + frames * s.frame;
  const maxT = Math.max(...strats.map(total));
  const best = strats.reduce((a, b) => (total(b) < total(a) ? b : a));
  const sx = (v: number) => X0 + (v / maxT) * (X1 - X0);
  const H = Y0 + strats.length * ROW + 18;

  return (
    <Figure
      title={L("title", "What an upload strategy costs")}
      head={<Choice value={gpu} onChange={setGpu} options={[["discrete", L("discrete", "discrete GPU")], ["integrated", L("integrated", "integrated GPU")]] as const} />}
      controls={
        <Sliders>
          <Slider label={L("size", "mesh size")} value={mib} min={1} max={512} step={1} onChange={setMib} fmt={v => `${v} MiB`} />
          <Slider label={L("passes", "passes / frame")} value={passes} min={1} max={4} step={1} onChange={setPasses} fmt={v => `${v}`} />
          <Slider label={L("frames", "frames")} value={frames} min={1} max={600} step={1} onChange={setFrames} fmt={v => `${v}`} />
        </Sliders>
      }
      note={L("note", "Each bar is the total GPU and CPU time spent on the mesh over the chosen number of frames: the hatched part is the one-time upload, the solid part is the reads during drawing, passes × S / B per frame. Assumed bandwidths: VRAM 450 GB/s, PCIe 25 GB/s, CPU memcpy 10 GB/s, shared memory of an integrated GPU 60 GB/s. On a discrete card, leaving the mesh in system RAM looks cheap for one frame and loses from the second frame on; staging and ReBAR end up equal, because both read from VRAM afterwards. On an integrated GPU there is only one memory, so the staging copy is pure overhead: write straight into a DEVICE_LOCAL | HOST_VISIBLE type.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <defs>
          <pattern id="vkup-once" width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={5} stroke={C.fg} strokeWidth={1.4} strokeOpacity={0.5} />
          </pattern>
        </defs>
        {strats.map((s, i) => {
          const y = Y0 + i * ROW, a = sx(s.once), b = sx(total(s));
          return (
            <g key={s.key}>
              <T x={8} y={y + 12} size={8.5} bold color={C.fg}>{L(`s_${s.key}_${gpu}`, s.en)}</T>
              <T x={8} y={y + 25} size={7.5}>{L("once", "once")} {f2(s.once, 1)} ms</T>
              <T x={8} y={y + 36} size={7.5}>{L("perFrame", "per frame")} {f2(s.frame, 2)} ms</T>
              <rect x={X0} y={y + 4} width={Math.max(a - X0, 1)} height={26} fill={s.color} fillOpacity={0.35} />
              <rect x={X0} y={y + 4} width={Math.max(a - X0, 1)} height={26} fill="url(#vkup-once)" />
              <rect x={a} y={y + 4} width={Math.max(b - a, 1)} height={26} fill={s.color} fillOpacity={0.55} />
              <rect x={X0} y={y + 4} width={Math.max(b - X0, 1)} height={26} fill="none" stroke={s.color} strokeWidth={s === best ? 2 : 1} />
              <T x={Math.min(b + 4, X1 - 60)} y={y + 42} size={8.5} bold={s === best} color={s === best ? C.green : C.fg}>
                {f2(total(s), 1)} ms{s === best ? `  ${L("best", "← least")}` : ""}
              </T>
            </g>
          );
        })}
        <line x1={X0} y1={Y0 - 4} x2={X0} y2={H - 14} stroke={C.axis} />
        <T x={X0} y={H - 3} size={7.5}>0</T>
        <T x={X1} y={H - 3} size={7.5} anchor="end">{f2(maxT, 0)} ms · {frames} {L("framesUnit", "frames")}</T>
      </svg>
    </Figure>
  );
}
