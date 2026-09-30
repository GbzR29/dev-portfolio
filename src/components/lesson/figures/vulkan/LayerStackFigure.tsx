"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, useRaf } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The path of one Vulkan call: application → loader → (validation layer) →
// driver (ICD) → GPU. With the layer on, a bad call is reported through the
// debug messenger callback, with the VUID of the rule it breaks, and is then
// passed on unchanged: layers report, they do not repair. With the layer off
// the driver receives the bad call and the result is undefined behaviour.

type Case = "ok" | "stype" | "size" | "inuse";
const CASES: Case[] = ["ok", "stype", "size", "inuse"];
const CALL: Record<Case, string> = {
  ok: "vkCreateBuffer(device, &info, nullptr, &buf)",
  stype: "vkCreateBuffer(device, &info, …)   // info.sType = 0",
  size: "vkCreateBuffer(device, &info, …)   // info.size = 0",
  inuse: "vkDestroyBuffer(device, buf, nullptr)   // GPU still reading buf",
};
const VUID: Record<Case, string> = {
  ok: "",
  stype: "Validation Error: [ VUID-VkBufferCreateInfo-sType-sType ] vkCreateBuffer(): pCreateInfo->sType must be VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO.",
  size: "Validation Error: [ VUID-VkBufferCreateInfo-size-00912 ] vkCreateBuffer(): pCreateInfo->size is zero. The Vulkan spec states: size must be greater than 0.",
  inuse: "Validation Error: [ VUID-vkDestroyBuffer-buffer-00922 ] vkDestroyBuffer(): VkBuffer is in use by a VkCommandBuffer. The spec states: all submitted commands that refer to buffer must have completed execution.",
};
const UB: Record<Case, string> = {
  ok: "VK_SUCCESS: the driver creates the buffer. With a correct call, the layer only cost a little CPU time.",
  stype: "The driver reads the struct as whatever it expects and finds a wrong tag: it may ignore fields, fail, or crash. Nothing tells you why.",
  size: "Undefined behaviour: some drivers return an error, some return a handle that fails later in an unrelated place, some appear to work.",
  inuse: "The GPU keeps reading memory that is no longer the buffer's. You might see garbage vertices, a VK_ERROR_DEVICE_LOST much later, or nothing at all on your machine, until it breaks on someone else's.",
};

const W = 560, H = 262, BX = 40, BW = 220, BH = 32;
const STACK = [
  { k: "app", en: "Your application", y: 18 },
  { k: "loader", en: "Vulkan loader (vulkan-1.dll / libvulkan.so)", y: 66 },
  { k: "layer", en: "VK_LAYER_KHRONOS_validation", y: 114 },
  { k: "icd", en: "Driver (ICD)", y: 162 },
  { k: "gpu", en: "GPU", y: 210 },
];

export function LayerStackFigure({ t }: { t?: TrackTranslations }) {
  const [kase, setKase] = useState<Case>("size");
  const [layer, setLayer] = useState(true);
  const [p, setP] = useState(-1);          // -1 idle, 0..1 travelling, 1 done
  const running = p >= 0 && p < 1;
  const ref = useRaf(running, dt => setP(v => Math.min(1, v + dt / 1.6)));

  const stops = STACK.filter(s => layer || s.k !== "layer");
  const seg = p < 0 ? -1 : p * (stops.length - 1);
  const at = Math.floor(Math.max(0, seg)), frac = seg - at;
  const dotY = p < 0 ? -99 : stops[Math.min(at, stops.length - 1)].y + BH / 2 + (at < stops.length - 1 ? frac * (stops[at + 1].y - stops[at].y) : 0);
  const layerY = STACK[2].y;
  const reported = layer && kase !== "ok" && p >= 0 && dotY >= layerY + BH / 2 - 1;
  const done = p >= 1;

  const run = (k: Case = kase, l = layer) => { setKase(k); setLayer(l); setP(0); };

  return (
    <Figure
      title={tx(t, "figVkLayer_title", "One call through the layer stack")}
      head={<Btn active={layer} onClick={() => run(kase, !layer)}>{tx(t, "figVkLayer_toggle", "validation layer")}: {layer ? "on" : "off"}</Btn>}
      controls={<>
        <Row>
          <Choice value={kase} onChange={k => run(k)} options={CASES.map(c => [c, tx(t, `figVkLayer_c_${c}`, { ok: "correct call", stype: "missing sType", size: "size = 0", inuse: "destroy while in use" }[c])] as const)} />
          <Btn onClick={() => run()}>▶ {tx(t, "figVkLayer_call", "call")}</Btn>
        </Row>
        <Row><Readout>{CALL[kase]}</Readout></Row>
        {done && (
          <p className="text-[12.5px] leading-relaxed" style={{ color: kase === "ok" ? C.green : layer ? C.fg : C.red }}>
            {kase !== "ok" && layer
              ? tx(t, "figVkLayer_reported", "The layer reported the bug with the rule it breaks, then passed the call on unchanged: layers report, they do not fix. The driver now does whatever it does with bad input, but you know exactly which line is wrong.")
              : tx(t, `figVkLayer_ub_${kase}`, UB[kase])}
          </p>
        )}
      </>}
      note={tx(t, "figVkLayer_note", "Every Vulkan call first reaches the loader, which forwards it through each enabled layer and then to the driver of the GPU that owns the object. The validation layer checks the call against the thousands of \"Valid Usage\" rules of the specification; each rule has an ID (VUID) you can search for. Switch the layer off to see what happens to the same bug in a release build.")}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {STACK.map(s => {
            const off = s.k === "layer" && !layer;
            return (
              <g key={s.k} opacity={off ? 0.35 : 1}>
                <rect x={BX} y={s.y} width={BW} height={BH} rx={6} fill={s.k === "layer" ? C.amber : s.k === "gpu" ? C.purple : "var(--card)"}
                  fillOpacity={s.k === "layer" || s.k === "gpu" ? 0.18 : 1} stroke={s.k === "layer" ? C.amber : C.axis} strokeDasharray={off ? "5 4" : undefined} />
                <T x={BX + BW / 2} y={s.y + 20} size={9} anchor="middle" color={C.fg} bold={s.k === "layer"}>{tx(t, `figVkLayer_s_${s.k}`, s.en)}</T>
              </g>
            );
          })}
          <line x1={BX + BW / 2} y1={STACK[0].y + BH} x2={BX + BW / 2} y2={STACK[4].y} stroke={C.axis} strokeDasharray="2 3" />
          {p >= 0 && <circle cx={BX + BW / 2} cy={dotY} r={7} fill={kase === "ok" ? C.green : layer && reported ? C.amber : C.red} />}
          {/* Debug messenger callback */}
          <rect x={310} y={layerY - 40} width={232} height={112} rx={8} fill={reported ? C.red : "var(--card)"} fillOpacity={reported ? 0.12 : 1}
            stroke={reported ? C.red : C.axis} opacity={layer ? 1 : 0.35} />
          <T x={322} y={layerY - 22} size={9} bold color={C.fg}>{tx(t, "figVkLayer_cb", "debug messenger callback")}</T>
          {reported
            ? wrap(VUID[kase], 44).slice(0, 6).map((l, i) => <T key={i} x={322} y={layerY - 6 + i * 13} size={8.2} color={C.red}>{l}</T>)
            : <T x={322} y={layerY - 4} size={8.5}>{layer ? (kase === "ok" && done ? tx(t, "figVkLayer_silent", "(silent: nothing to report)") : "…") : tx(t, "figVkLayer_none", "(no layer, no messages)")}</T>}
          {reported && <path d={`M${BX + BW} ${layerY + BH / 2} L310 ${layerY + BH / 2}`} stroke={C.red} strokeWidth={1.5} strokeDasharray="4 3" />}
          {done && <T x={BX + BW + 12} y={STACK[4].y + 20} size={9} bold color={kase === "ok" ? C.green : C.red}>{kase === "ok" ? "VK_SUCCESS" : tx(t, "figVkLayer_undef", "undefined behaviour")}</T>}
        </svg>
      </div>
    </Figure>
  );
}

/** Greedy word wrap for SVG text. */
function wrap(s: string, n: number) {
  const out: string[] = [];
  let line = "";
  for (const w of s.split(" ")) {
    if ((line + " " + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}
