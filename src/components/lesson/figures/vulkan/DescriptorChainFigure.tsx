"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The chain that connects the shader's `layout(set = 0, binding = 0)` and
// `push_constant` block to real bytes: set layout, pipeline layout, buffer,
// descriptor write, and the two recording calls. Pick a bug: the value that
// breaks the chain turns red in its row, and the message says which call the
// validation layer would stop at, and what the frame would show without it.

type Bug = "none" | "binding" | "stage" | "type" | "push" | "usage" | "write" | "bind" | "firstSet";
type Seg = [string] | [string, Bug, string];     // plain text, or text that a bug replaces

const ROWS: { key: string; en: string; lines: Seg[][]; bugs: Bug[] }[] = [
  { key: "rShader", en: "shader", bugs: [], lines: [
    [["layout(set = 0, binding = 0) uniform Camera { mat4 view; mat4 proj; } cam;"]],
    [["layout(push_constant) uniform Push { mat4 model; } pc;      // 64 bytes"]],
  ] },
  { key: "rSetLayout", en: "set layout", bugs: ["binding", "stage", "type"], lines: [
    [["binding = "], ["0", "binding", "1"], [", descriptorType = "], ["UNIFORM_BUFFER", "type", "STORAGE_BUFFER"], [", count = 1,"]],
    [["stageFlags = "], ["VERTEX", "stage", "FRAGMENT"]],
  ] },
  { key: "rPipeLayout", en: "pipeline layout", bugs: ["push"], lines: [
    [["pSetLayouts = { setLayout }       // set 0"]],
    [["pushConstantRange = { VERTEX, offset 0, size "], ["64", "push", "32"], [" }"]],
  ] },
  { key: "rBuffer", en: "buffer", bugs: ["usage"], lines: [
    [["cameraUbo: usage = "], ["UNIFORM_BUFFER", "usage", "TRANSFER_DST"], [", size 128"]],
    [["memory: HOST_VISIBLE | HOST_COHERENT, mapped"]],
  ] },
  { key: "rSet", en: "descriptor set", bugs: ["write"], lines: [
    [["vkAllocateDescriptorSets(pool, setLayout) → cameraSet"]],
    [["vkUpdateDescriptorSets(dstBinding 0 → cameraUbo, range 128)", "write", "// vkUpdateDescriptorSets never called"]],
  ] },
  { key: "rRecord", en: "recording", bugs: ["bind", "firstSet"], lines: [
    [["vkCmdBindDescriptorSets(cmd, GRAPHICS, layout, firstSet = ", "bind", "// vkCmdBindDescriptorSets missing"], ["0", "firstSet", "1"], [", 1, &cameraSet)"]],
    [["vkCmdPushConstants(cmd, layout, VERTEX, 0, 64, &model)"]],
  ] },
];

const MSG: Record<Exclude<Bug, "none">, { at: string; en: string; look: string }> = {
  binding: { at: "vkCreateGraphicsPipelines", look: "lNone", en: "the vertex shader uses set 0, binding 0, which the pipeline layout does not declare (the set layout only has binding 1). The pipeline cannot be created." },
  stage: { at: "vkCreateGraphicsPipelines", look: "lNone", en: "set 0, binding 0 is used by the vertex shader but its stageFlags only allow the fragment stage." },
  type: { at: "vkCreateGraphicsPipelines", look: "lNone", en: "descriptor type mismatch: the shader declares a uniform buffer at set 0, binding 0, the layout declares VK_DESCRIPTOR_TYPE_STORAGE_BUFFER." },
  push: { at: "vkCreateGraphicsPipelines", look: "lNone", en: "the push-constant block is 64 bytes but the layout's range covers only 32; vkCmdPushConstants with size 64 is also out of range." },
  usage: { at: "vkUpdateDescriptorSets", look: "lGarbage", en: "the buffer was not created with VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, so it cannot be written into a UNIFORM_BUFFER descriptor." },
  write: { at: "vkCmdDrawIndexed", look: "lGarbage", en: "set 0, binding 0 is used by the draw but has never been written with vkUpdateDescriptorSets. The matrices come from whatever the descriptor points at, or the device is lost." },
  bind: { at: "vkCmdDrawIndexed", look: "lGarbage", en: "the pipeline layout uses set 0, but no descriptor set is bound at index 0 when the draw is recorded." },
  firstSet: { at: "vkCmdBindDescriptorSets", look: "lGarbage", en: "firstSet (1) + descriptorSetCount (1) is greater than the pipeline layout's setLayoutCount (1). Set 0 stays unbound." },
};

const W = 640, LX = 128, RH = 36, Y0 = 10;
const H = Y0 + ROWS.length * RH + 6;

export function DescriptorChainFigure({ t }: { t?: TrackTranslations }) {
  const [bug, setBug] = useState<Bug>("none");
  const L = (k: string, en: string) => tx(t, `figVkDesc_${k}`, en);
  const m = bug === "none" ? null : MSG[bug];

  const line = (segs: Seg[], y: number) => {
    // A bug that removes the whole call replaces the line with its comment.
    const gone = segs.find(s => s.length === 3 && s[1] === bug && s[2].startsWith("//"));
    if (gone) return <T x={LX + 8} y={y} size={8.5} color={C.red} bold>{gone[2]}</T>;
    return <T x={LX + 8} y={y} size={8.5} color={C.fg}>
      {segs.map((s, i) => {
        const broken = s.length === 3 && s[1] === bug;
        return <tspan key={i} fill={broken ? C.red : undefined} fontWeight={broken ? 700 : undefined}>{broken ? s[2] : s[0]}</tspan>;
      })}
    </T>;
  };

  return (
    <Figure
      title={L("title", "From layout(set, binding) to bytes: break a link")}
      head={<Choice value={bug} onChange={setBug} options={[
        ["none", L("bNone", "no bug")], ["binding", "binding"], ["stage", "stageFlags"], ["type", "type"], ["push", "push range"],
        ["usage", "usage"], ["write", L("bWrite", "no update")], ["bind", L("bBind", "no bind")], ["firstSet", "firstSet"],
      ] as const} />}
      controls={m
        ? <p className="text-[12.5px] leading-relaxed font-mono" style={{ color: C.red }}>
            Validation Error [{m.at}]: {L(`m_${bug}`, m.en)}<br />
            <span className="text-[var(--text-muted)]">{L(m.look, m.look === "lNone" ? "Without the layer: pipeline creation may fail or the driver may crash; nothing is drawn." : "Without the layer: the quads land anywhere or vanish, and the device may be lost.")}</span>
          </p>
        : <p className="text-[12.5px] leading-relaxed" style={{ color: C.green }}>{L("ok", "Every link holds: the set layout matches the shader's set, binding, type and stage; the pipeline layout holds it and a 64-byte push range; the buffer can be a uniform buffer; the set points at it; and both are bound or pushed before each draw.")}</p>}
      note={L("note", "Read the rows top to bottom: each object is built from the one above and must agree with it. The first four bugs break the agreement between the shader and the layouts, so they are caught when the pipeline is created. A wrong usage bit is caught when the descriptor is written. The last three only show at draw time, when the layer checks what is actually bound. None of them is reported without the validation layer.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {ROWS.map((row, i) => {
          const y = Y0 + i * RH, broken = row.bugs.includes(bug);
          return (
            <g key={row.key}>
              <rect x={4} y={y} width={W - 8} height={RH - 6} rx={5} fill={broken ? C.red : C.bg} fillOpacity={broken ? 0.08 : 1} stroke={broken ? C.red : C.grid} />
              <T x={12} y={y + 18} size={9} bold color={broken ? C.red : C.fg}>{broken ? "✗ " : "✓ "}{L(row.key, row.en)}</T>
              {line(row.lines[0], y + 12)}
              {row.lines[1] && line(row.lines[1], y + 25)}
              {i > 0 && <line x1={LX - 10} y1={y - 6} x2={LX - 10} y2={y} stroke={broken ? C.red : C.axis} strokeWidth={broken ? 2 : 1} />}
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
