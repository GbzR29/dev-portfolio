"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A grey ramp stored as sRGB bytes (what a PNG holds) travels through the
// texture's format (decode or not), the shader's lighting (× light), and the
// swapchain's format (encode or not). The top strip is the correct result,
// the bottom strip what this combination shows; the readouts follow byte 128
// through every stage. Swatches are filled with the final byte, which the
// browser, like the monitor, interprets as sRGB.

type Fmt = "SRGB" | "UNORM";
const decode = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const encode = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const toByte = (v: number) => Math.round(255 * Math.min(1, Math.max(0, v)));

const RAMP = [0, 32, 64, 96, 128, 160, 192, 224, 255];
const W = 640, SW = 64, X0 = 32, Y1 = 34, Y2 = 104, SH = 40;

function run(byte: number, tex: Fmt, swap: Fmt, light: number) {
  const sampled = tex === "SRGB" ? decode(byte / 255) : byte / 255;   // what texture() returns
  const lit = sampled * light;                                        // what the shader writes
  const stored = swap === "SRGB" ? encode(lit) : lit;                 // what lands in the image
  return { sampled, lit, stored, out: toByte(stored) };
}

export function SrgbFigure({ t }: { t?: TrackTranslations }) {
  const [tex, setTex] = useState<Fmt>("SRGB");
  const [swap, setSwap] = useState<Fmt>("SRGB");
  const [light, setLight] = useState(1);
  const L = (k: string, en: string) => tx(t, `figVkSrgb_${k}`, en);

  const good = RAMP.map(b => run(b, "SRGB", "SRGB", light).out);
  const got = RAMP.map(b => run(b, tex, swap, light).out);
  const worst = Math.max(...got.map((g, i) => Math.abs(g - good[i])));
  const probe = run(128, tex, swap, light);

  const verdict = worst <= 1
    ? (tex === "SRGB" ? L("vOk", "correct: decoded to linear, lit in linear, encoded once for the display")
      : L("vLucky", "matches only because the shader does no maths: the bytes pass through untouched. Dim the light to see it break"))
    : tex === "UNORM" && swap === "SRGB" ? L("vWashed", "washed out: the sRGB bytes are treated as linear and encoded a second time")
      : tex === "SRGB" && swap === "UNORM" ? L("vDark", "too dark: decoded to linear but never encoded again")
        : L("vShade", "wrong shading: the maths runs on encoded values, so dimming darkens the midtones far too much");

  const strip = (vals: number[], y: number, label: string) => (
    <g>
      <T x={X0} y={y - 6} size={8.5}>{label}</T>
      {vals.map((v, i) => (
        <g key={i}>
          <rect x={X0 + i * SW} y={y} width={SW - 2} height={SH} fill={`rgb(${v},${v},${v})`} stroke={C.axis} strokeWidth={0.5} />
          <T x={X0 + i * SW + SW / 2 - 1} y={y + SH + 11} size={7.5} anchor="middle">{v}</T>
        </g>
      ))}
    </g>
  );

  return (
    <Figure
      title={L("title", "sRGB bytes through the texture and the swapchain")}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{L("texFmt", "texture")}</span>
          <Choice value={tex} onChange={setTex} options={[["SRGB", "R8G8B8A8_SRGB"], ["UNORM", "R8G8B8A8_UNORM"]] as const} />
        </Row>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{L("swapFmt", "swapchain")}</span>
          <Choice value={swap} onChange={setSwap} options={[["SRGB", "B8G8R8A8_SRGB"], ["UNORM", "B8G8R8A8_UNORM"]] as const} />
        </Row>
        <Slider label={L("light", "light ×")} value={light} min={0} max={1} step={0.05} onChange={setLight} />
        <Row>
          <Readout>{L("byte", "byte")} 128</Readout>
          <Readout>texture() → {f2(probe.sampled, 3)}</Readout>
          <Readout>× {f2(light)} → {f2(probe.lit, 3)}</Readout>
          <Readout>{L("stored", "stored")} {f2(probe.stored, 3)} → {probe.out}</Readout>
          <Readout color={Math.abs(probe.out - run(128, "SRGB", "SRGB", light).out) <= 1 ? C.green : C.red}>{L("should", "should be")} {run(128, "SRGB", "SRGB", light).out}</Readout>
        </Row>
        <p className="text-[12.5px] leading-relaxed" style={{ color: worst <= 1 ? (tex === "SRGB" ? C.green : C.amber) : C.red }}>{verdict}</p>
      </>}
      note={L("note", "The texture's bytes are sRGB-encoded, as every photo and painted texture is. With an _SRGB image format the sampler decodes them to linear light before the shader sees them; with the _SRGB swapchain the GPU encodes the shader's linear output again when it is written. Both conversions, or neither, give the same bytes at light 1, which is why the UNORM + UNORM mistake survives a first test; lower the light and only the all-sRGB path halves the brightness the way light really does. Data textures (normal maps, roughness, masks) are not colours, so they use _UNORM.")}
    >
      <svg viewBox={`0 0 ${W} 164`} className="w-full h-auto" role="img">
        {strip(good, Y1, L("correct", "correct (SRGB texture → SRGB swapchain)"))}
        {strip(got, Y2, L("actual", "this combination"))}
        {got.map((g, i) => Math.abs(g - good[i]) > 1 && (
          <line key={i} x1={X0 + i * SW + 4} y1={Y2 + SH + 16} x2={X0 + i * SW + SW - 6} y2={Y2 + SH + 16} stroke={C.red} strokeWidth={2} />
        ))}
      </svg>
    </Figure>
  );
}
