"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, C, T, hash2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The texture upload as a chain: pixels decoded on the CPU, the staging
// buffer, the VkImage in VRAM and the sampler that reads it. Every step of
// loadTexture can be unticked; the window shows the texture the fragment
// shader would sample, computed from the mistake (the 3-channel shear is
// the real byte reinterpretation), and the list gives the validation message.

type Step = "channels" | "srgb" | "dstUsage" | "sampledUsage" | "toDst" | "copy" | "toRead";
type Look = "ok" | "washed" | "sheared" | "scrambled" | "black" | "noise";

const STEPS: [Step, string][] = [
  ["channels", "STBI_rgb_alpha"], ["srgb", "R8G8B8A8_SRGB"], ["dstUsage", "TRANSFER_DST"], ["sampledUsage", "SAMPLED"],
  ["toDst", "UNDEFINED → TRANSFER_DST"], ["copy", "vkCmdCopyBufferToImage2"], ["toRead", "→ SHADER_READ_ONLY"],
];

type Msg = { key: string; en: string; kind: "error" | "warn"; look: Look };
const MSGS: Record<Step, Msg> = {
  channels: { key: "mChannels", kind: "warn", look: "sheared", en: "No error. The JPEG has three channels, so without STBI_rgb_alpha stbi_load returns 3 bytes per pixel while the image expects 4. Every texel takes one byte of its neighbour, the colours rotate between channels, rows drift sideways, and the memcpy of w·h·4 bytes reads a quarter past the end of the array." },
  srgb: { key: "mSrgb", kind: "warn", look: "washed", en: "No error. With R8G8B8A8_UNORM the sampler returns the stored bytes unchanged, so the shader treats sRGB-encoded values as linear, and the _SRGB swapchain encodes them a second time: the texture looks pale and washed out." },
  dstUsage: { key: "mDst", kind: "error", look: "noise", en: "vkCmdCopyBufferToImage2: dstImage was not created with VK_IMAGE_USAGE_TRANSFER_DST_BIT. The copy's result is undefined." },
  sampledUsage: { key: "mSampled", kind: "error", look: "black", en: "vkUpdateDescriptorSets: the image view written to a COMBINED_IMAGE_SAMPLER descriptor belongs to an image created without VK_IMAGE_USAGE_SAMPLED_BIT. What the shader reads is undefined, often black." },
  toDst: { key: "mToDst", kind: "error", look: "scrambled", en: "vkCmdCopyBufferToImage2: dstImageLayout is TRANSFER_DST_OPTIMAL but the image is still in VK_IMAGE_LAYOUT_UNDEFINED. The copy writes texels in an arrangement the image is not in." },
  copy: { key: "mCopy", kind: "warn", look: "noise", en: "No error: the image was simply never written. Fresh VRAM holds leftovers of earlier allocations, so the quad shows noise." },
  toRead: { key: "mToRead", kind: "error", look: "scrambled", en: "vkQueueSubmit2: the descriptor expects VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL, but the image is in TRANSFER_DST_OPTIMAL when the fragment shader samples it. Where the two layouts store texels differently (compression, tiling), the shader reads them out of order." },
};
const RANK: Record<Look, number> = { ok: 0, washed: 1, sheared: 2, scrambled: 3, black: 4, noise: 5 };

// ── The texture: 16 × 16 bricks, as the sRGB bytes a PNG would hold ──
const N = 16;
function brick(x: number, y: number): [number, number, number] {
  const row = Math.floor(y / 4), shift = row % 2 ? 4 : 0;
  if (y % 4 === 3 || (x + shift) % 8 === 7) return [196, 190, 176];            // mortar
  const k = hash2(Math.floor((x + shift) / 8), row, 5);
  return [Math.round(150 + 60 * k), Math.round(58 + 30 * k), Math.round(40 + 18 * k)];
}
const RGB = Array.from({ length: N * N }, (_, i) => brick(i % N, Math.floor(i / N)));
const BYTES3 = RGB.flat();                                                      // what stbi_load returns for 3 channels
const encode = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

function texel(look: Look, x: number, y: number): [number, number, number] {
  const i = y * N + x;
  switch (look) {
    case "ok": return RGB[i];
    case "washed": return RGB[i].map(b => Math.round(255 * encode(b / 255))) as [number, number, number];
    case "sheared": {                                                          // texel i reads bytes 4i … 4i+2
      const b = (k: number) => (k < BYTES3.length ? BYTES3[k] : Math.round(255 * hash2(k, 1, 7)));
      return [b(4 * i), b(4 * i + 1), b(4 * i + 2)];
    }
    case "scrambled": {                                                        // 4 × 4 tiles in the wrong places
      const tile = (Math.floor(y / 4) * 4 + Math.floor(x / 4)) * 7 % 16;
      const tx0 = (tile % 4) * 4, ty0 = Math.floor(tile / 4) * 4;
      return RGB[(ty0 + (x % 4)) * N + tx0 + (y % 4)];
    }
    case "black": return [0, 0, 0];
    case "noise": return [0, 1, 2].map(c => Math.round(255 * hash2(i, c, 11))) as [number, number, number];
  }
}

const W = 640, H = 268, BOXW = 128, BOXH = 44, BY = 14;
const BOXES = [{ x: 8, key: "bCpu", en: "pixels (CPU)" }, { x: 176, key: "bStaging", en: "staging buffer" }, { x: 344, key: "bImage", en: "VkImage (VRAM)" }, { x: 504, key: "bSampler", en: "sampler → shader" }];
const WIN = { x: 250, y: 124, s: 128 };

export function TextureUploadFigure({ t }: { t?: TrackTranslations }) {
  const [on, setOn] = useState<Record<Step, boolean>>({ channels: true, srgb: true, dstUsage: true, sampledUsage: true, toDst: true, copy: true, toRead: true });
  const L = (k: string, en: string) => tx(t, `figVkTex_${k}`, en);

  const broken = STEPS.map(([s]) => s).filter(s => !on[s]);
  const look = broken.reduce<Look>((w, s) => (RANK[MSGS[s].look] > RANK[w] ? MSGS[s].look : w), "ok");
  const linkOk = [on.channels, on.copy && on.dstUsage && on.toDst, on.toRead && on.sampledUsage];
  const layoutAtDraw = !on.copy && !on.toDst ? "UNDEFINED" : on.toRead ? "SHADER_READ_ONLY_OPTIMAL" : "TRANSFER_DST_OPTIMAL";
  const cell = WIN.s / N;

  return (
    <Figure
      title={L("title", "Break the texture upload: untick a step")}
      controls={<>
        <Row>{STEPS.map(([s, label]) => <Btn key={s} active={on[s]} onClick={() => setOn(v => ({ ...v, [s]: !v[s] }))}>{on[s] ? "☑" : "☐"} {label}</Btn>)}</Row>
        {broken.length === 0
          ? <p className="text-[12.5px] leading-relaxed" style={{ color: C.green }}>{L("ok", "Every step is in place: four bytes per pixel reach the staging buffer, the image is in TRANSFER_DST_OPTIMAL for the copy and in SHADER_READ_ONLY_OPTIMAL when it is sampled, and the _SRGB format decodes the colours to linear. The validation layer is silent.")}</p>
          : broken.map(s => (
            <p key={s} className="text-[12.5px] leading-relaxed font-mono" style={{ color: MSGS[s].kind === "warn" ? C.amber : C.red }}>
              {MSGS[s].kind === "error" ? "Validation Error: " : ""}{L(MSGS[s].key, MSGS[s].en)}
            </p>
          ))}
      </>}
      note={L("note", "The top row is the path the pixels take; the square is the texture the fragment shader would sample. Three of the mistakes give no error at all: a missing alpha channel shears the image (computed here from the real bytes), a UNORM format washes it out, and a skipped copy shows old VRAM. The layout mistakes are caught by the layer, and on the GPU they scramble the texels only where the layouts really differ, so on some cards they seem to work. Untick several at once: the worst one decides the picture.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <defs>
          <marker id="vktex-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.axis} />
          </marker>
        </defs>
        {BOXES.map((b, i) => (
          <g key={b.key}>
            <rect x={b.x} y={BY} width={BOXW} height={BOXH} rx={6} fill={C.bg} stroke={i === 2 ? C.green : C.axis} />
            <T x={b.x + BOXW / 2} y={BY + 26} size={8.5} anchor="middle" color={C.fg} bold>{L(b.key, b.en)}</T>
          </g>
        ))}
        {[["memcpy", 0], ["copy", 1], [L("readLink", "layout → sample"), 2]].map(([label, i]) => {
          const a = BOXES[i as number].x + BOXW, b = BOXES[(i as number) + 1].x, ok = linkOk[i as number];
          return (
            <g key={i}>
              <line x1={a + 2} y1={BY + BOXH / 2} x2={b - 3} y2={BY + BOXH / 2} stroke={ok ? C.axis : C.red} strokeWidth={ok ? 1.4 : 2} strokeDasharray={ok ? undefined : "4 3"} markerEnd="url(#vktex-arrow)" />
              <T x={(a + b) / 2} y={BY + BOXH + 14} size={7.5} anchor="middle" color={ok ? C.muted : C.red} bold={!ok}>{label}</T>
            </g>
          );
        })}
        <T x={BOXES[2].x + BOXW / 2} y={BY + BOXH + 28} size={7.5} anchor="middle" color={on.toRead ? C.muted : C.red}>{layoutAtDraw}</T>
        <T x={BOXES[1].x + BOXW / 2} y={BY + BOXH + 28} size={7.5} anchor="middle" color={on.channels ? C.muted : C.amber}>{on.channels ? "w·h·4 B" : L("short", "w·h·3 B, read as w·h·4")}</T>

        {/* ── The sampled texture ── */}
        <rect x={WIN.x - 3} y={WIN.y - 3} width={WIN.s + 6} height={WIN.s + 6} rx={3} fill="none"
          stroke={look === "ok" ? C.axis : look === "washed" || look === "sheared" ? C.amber : C.red} strokeWidth={look === "ok" ? 1 : 1.8} />
        <g shapeRendering="crispEdges">
          {Array.from({ length: N * N }, (_, i) => {
            const x = i % N, y = Math.floor(i / N), [r, g, b] = texel(look, x, y);
            return <rect key={i} x={WIN.x + x * cell} y={WIN.y + y * cell} width={cell} height={cell} fill={`rgb(${r},${g},${b})`} />;
          })}
        </g>
        <T x={WIN.x + WIN.s / 2} y={WIN.y - 8} size={8} anchor="middle">{L("sampled", "what the shader samples")}</T>
        <T x={WIN.x + WIN.s + 14} y={WIN.y + WIN.s / 2} size={9} bold color={look === "ok" ? C.green : look === "washed" || look === "sheared" ? C.amber : C.red}>
          {L(`look_${look}`, { ok: "correct", washed: "washed out", sheared: "sheared, wrong colours", scrambled: "texels out of order", black: "undefined (black)", noise: "undefined (noise)" }[look])}
        </T>
      </svg>
    </Figure>
  );
}
