// src/lib/tracks/glsl/chapters/effects/texturing.tsx
"use client";

import { Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { TEXTURE_PRESETS } from "../../presets/texturing";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Texturing
// ═════════════════════════════════════════════════════════════════════════════

export function TexturingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslTex_intro",
          "texture(sampler, uv) looks like an array read, but it is one of the most sophisticated operations a GPU does. It picks a mip level from how fast uv changes across neighbouring pixels, blends four texels (or eight, or sixteen with anisotropy), and handles wrapping. Knowing what it does lets you bend it: distort the UV, project textures without UVs, or read exact texels when filtering would get in the way.")}
      </Lead>

      <H2>{tx(t, "glslTex_funcTitle", "The sampling functions")}</H2>
      <LessonTable
        headers={[tx(t, "glslTex_thFn", "Function"), tx(t, "glslTex_thDoes", "What it does")]}
        rows={[
          ["texture(s, uv)", tx(t, "glslTex_f1", "filtered read; mip level from the screen-space derivatives of uv (fragment shader only)")],
          ["textureLod(s, uv, lod)", tx(t, "glslTex_f2", "filtered read at an explicit mip level: works in any stage, and inside loops or branches")],
          ["textureGrad(s, uv, dx, dy)", tx(t, "glslTex_f3", "you supply the derivatives: keeps mips correct after a UV discontinuity (fract, atlases)")],
          ["texelFetch(s, ivec2, lod)", tx(t, "glslTex_f4", "one exact texel by integer coordinate, no filtering, no wrapping: data textures, lookups")],
          ["textureSize(s, lod)", tx(t, "glslTex_f5", "the texture's size in texels at that mip, as an ivec2")],
        ]}
      />
      <Equation label={tx(t, "glslTex_mipLabel", "How texture() picks a mip level")}
        where={[
          [r`\frac{\partial uv}{\partial x}, \frac{\partial uv}{\partial y}`, tx(t, "glslTex_wDeriv", "how much uv changes to the next pixel right and up (dFdx, dFdy)")],
          [r`N`, tx(t, "glslTex_wN", "texture size in texels")],
        ]}
        note={tx(t, "glslTex_mipNote", "The derivatives come from the 2×2 pixel quad the GPU shades together. fract(uv) jumps from 1 to 0 at a seam, so the derivative there is huge and a 1-pixel line of the smallest mip appears. textureGrad with the derivatives of the unwrapped uv fixes it.")}>
        {r`\lambda = \log_2 \max\!\left( \left\lVert N\,\frac{\partial uv}{\partial x} \right\rVert,\ \left\lVert N\,\frac{\partial uv}{\partial y} \right\rVert \right)`}
      </Equation>

      <H2>{tx(t, "glslTex_projTitle", "Distortion and triplanar projection")}</H2>
      <p>
        {tx(t, "glslTex_projBody",
          "Offsetting uv by a small, smoothly varying vector distorts the image. Scrolling noise gives heat haze, and a normal map gives refraction. When a mesh has no usable UVs (terrain, procedural rocks, anything sculpted), project the texture from the three axes in world space and blend by the normal:")}
      </p>
      <Equation label={tx(t, "glslTex_triLabel", "Triplanar mapping")}
        where={[
          [r`\mathbf n`, tx(t, "glslTex_wTN", "the surface normal")],
          [r`k`, tx(t, "glslTex_wK", "blend sharpness: higher = narrower transitions")],
          [r`T(\cdot)`, tx(t, "glslTex_wT", "the texture, sampled with two world coordinates as uv")],
        ]}
        note={tx(t, "glslTex_triNote", "Three texture reads instead of one, but no seams and no stretching on any shape. For normal maps, each projection's tangent frame is different: swizzle the sampled normal per axis (the \"whiteout\" or \"UDN\" blend).")}>
        {r`w = \frac{|\mathbf n|^k}{|n_x|^k + |n_y|^k + |n_z|^k} \qquad c = w_x\,T(p_{zy}) + w_y\,T(p_{xz}) + w_z\,T(p_{xy})`}
      </Equation>
      <ShaderPlayground presets={TEXTURE_PRESETS} t={t} id="glslTex" />
      <Callout type="warn" t={t}>
        {tx(t, "glslTex_warn",
          "Colour textures are stored in sRGB and must be linearised before lighting (or uploaded as GL_SRGB8_ALPHA8 so the hardware does it). Normal, roughness, metallic, AO and height maps are data, already linear, and must not be converted. Mixing the two up is the most common reason a material looks washed out or too dark.")}
      </Callout>
      <KeyIdeas t={t} id="glslTex" items={[
        "texture() filters and picks mips from uv derivatives; textureLod/Grad give you control; texelFetch reads exact texels.",
        "Distort by offsetting uv with smooth noise; scroll two layers in different directions.",
        "Triplanar mapping projects along X, Y, Z and blends by |n|^k: seamless without UVs.",
        "Linearise colour textures; leave data textures (normal, roughness…) alone.",
      ]} />
    </Article>
  );
}
