// src/lib/tracks/glsl/chapters/effects/texturing.tsx
"use client";

import { Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
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

      <Goals t={t} id="glslTex" items={[
        "Choose between texture, textureLod, textureGrad and texelFetch.",
        "Distort a texture with noise, and scroll layers to suggest motion.",
        "Texture a surface that has no UVs with triplanar projection.",
      ]} />

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
      <p>{tx(t, "glslTex_coordBody", "uv runs 0..1 across the whole texture whatever its size, so on a 256×256 texture uv = (0.5, 0.5) sits at texel coordinate 128. Texel centres are at half-integers: texel i covers u from i/N to (i + 1)/N and its centre is (i + 0.5)/N, so the very first texel's centre is u = 0.5/256 ≈ 0.00195. With GL_LINEAR, a uv between centres blends the four nearest texels by distance; with GL_NEAREST it takes the one it falls in. Outside 0..1 the wrap mode decides: GL_REPEAT keeps the fractional part (u = 1.25 reads like 0.25), GL_CLAMP_TO_EDGE repeats the border texel, GL_MIRRORED_REPEAT flips every other copy. texelFetch takes the integer index directly, (128, 128), and ignores both filtering and wrapping.")}</p>
      <Equation label={tx(t, "glslTex_mipLabel", "How texture() picks a mip level")}
        where={[
          [r`\lambda`, tx(t, "glslTex_wLambda", "the mip level to read: 0 is full size, each +1 halves the width and height")],
          [r`\frac{\partial uv}{\partial x}, \frac{\partial uv}{\partial y}`, tx(t, "glslTex_wDeriv", "how much uv changes to the next pixel right and up (dFdx, dFdy)")],
          [r`N`, tx(t, "glslTex_wN", "texture size in texels")],
        ]}
        note={tx(t, "glslTex_mipNote", "The derivatives come from the 2×2 pixel quad the GPU shades together. fract(uv) jumps from 1 to 0 at a seam, so the derivative there is huge and a 1-pixel line of the smallest mip appears. textureGrad with the derivatives of the unwrapped uv fixes it.")}>
        {r`\lambda = \log_2 \max\!\left( \left\lVert N\,\frac{\partial uv}{\partial x} \right\rVert,\ \left\lVert N\,\frac{\partial uv}{\partial y} \right\rVert \right)`}
      </Equation>
      <p>{tx(t, "glslTex_mipSteps", "N · ∂uv/∂x is how many texels you step over when moving one pixel. Worked with a 1024-texel texture on a wall that covers 256 pixels on screen: uv goes 0..1 over 256 pixels, so ∂uv/∂x = 1/256, times N = 4 texels per pixel, and λ = log₂ 4 = 2. Mip 2 is 256×256, exactly one texel per pixel, so nothing shimmers. Walk closer until the wall covers 2048 pixels and the footprint is 0.5, λ = −1, clamped to 0: magnification, where GL_LINEAR blurs between texels. The max picks the worse axis, so a floor seen at a grazing angle, squashed in y, gets a blurry mip in both directions; anisotropic filtering takes extra samples along the long axis instead.")}</p>

      <H2>{tx(t, "glslTex_projTitle", "Distortion and triplanar projection")}</H2>
      <p>
        {tx(t, "glslTex_projBody",
          "Offsetting uv by a small, smoothly varying vector distorts the image. Scrolling noise gives heat haze, and a normal map gives refraction. When a mesh has no usable UVs (terrain, procedural rocks, anything sculpted), project the texture from the three axes in world space and blend by the normal:")}
      </p>
      <Equation label={tx(t, "glslTex_triLabel", "Triplanar mapping")}
        where={[
          [r`w`, tx(t, "glslTex_wW", "the three blend weights (w_x, w_y, w_z), which add up to 1")],
          [r`p_{zy}, p_{xz}, p_{xy}`, tx(t, "glslTex_wP", "pairs of world-position components used as uv: the projection along X uses (z, y), and so on")],
          [r`\mathbf n`, tx(t, "glslTex_wTN", "the surface normal")],
          [r`k`, tx(t, "glslTex_wK", "blend sharpness: higher = narrower transitions")],
          [r`T(\cdot)`, tx(t, "glslTex_wT", "the texture, sampled with two world coordinates as uv")],
        ]}
        note={tx(t, "glslTex_triNote", "Three texture reads instead of one, but no seams and no stretching on any shape. For normal maps, each projection's tangent frame is different: swizzle the sampled normal per axis (the \"whiteout\" or \"UDN\" blend).")}>
        {r`w = \frac{|\mathbf n|^k}{|n_x|^k + |n_y|^k + |n_z|^k} \qquad c = w_x\,T(p_{zy}) + w_y\,T(p_{xz}) + w_z\,T(p_{xy})`}
      </Equation>
      <p>{tx(t, "glslTex_triSteps", "Worked with a slope whose normal is n = (0.6, 0.8, 0) and k = 4. |n|⁴ = (0.130, 0.410, 0), sum 0.540, so w = (0.24, 0.76, 0): the top projection (along Y, sampled with world x and z) dominates, the side one fills in 24%, and the Z projection, which would be badly stretched here, contributes nothing. With k = 1 the weights would be (0.43, 0.57, 0), a much wider blend that looks smeared; with k = 8 the split becomes (0.09, 0.91, 0), nearly a hard cut. The world position is usually scaled first, e.g. p · 0.5 for one texture repeat every 2 units.")}</p>
      <p>{tx(t, "glslTex_distSteps", "Distortion in numbers: uv + 0.02 · (noise(uv · 4 + t) − 0.5) moves each pixel's lookup by at most ±0.01, which on a 1024-texel texture is about ±10 texels. Larger offsets read far-away texels and the image tears instead of wobbling. Because the noise is smooth, neighbouring pixels move by similar amounts, so straight lines bend into curves rather than breaking.")}</p>
      <ShaderPlayground presets={TEXTURE_PRESETS} t={t} id="glslTex" />
      <Callout type="warn" t={t}>
        {tx(t, "glslTex_warn",
          "Colour textures are stored in sRGB and must be linearised before lighting (or uploaded as GL_SRGB8_ALPHA8 so the hardware does it). Normal, roughness, metallic, AO and height maps are data, already linear, and must not be converted. Mixing the two up is the most common reason a material looks washed out or too dark.")}
      </Callout>

      <H2>{tx(t, "glslTex_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "glslTex_thSymptom", "Symptom"), tx(t, "glslTex_thCause", "Cause"), tx(t, "glslTex_thFix", "Fix")]}
        rows={[
          [tx(t, "glslTex_m1a", "Texture black"), tx(t, "glslTex_m1b", "Min filter uses mipmaps but none were generated"), tx(t, "glslTex_m1c", "glGenerateMipmap, or set GL_LINEAR as the min filter")],
          [tx(t, "glslTex_m2a", "Thin line of wrong colour at a tile seam"), tx(t, "glslTex_m2b", "fract(uv) makes the derivatives jump, so the smallest mip is picked"), tx(t, "glslTex_m2c", "textureGrad with dFdx/dFdy of the unwrapped uv")],
          [tx(t, "glslTex_m3a", "Distant surfaces shimmer and sparkle"), tx(t, "glslTex_m3b", "No mipmaps, or textureLod(…, 0) used everywhere"), tx(t, "glslTex_m3c", "Generate mips; let texture() pick the level")],
          [tx(t, "glslTex_m4a", "Edges bleed the opposite side's colour"), tx(t, "glslTex_m4b", "GL_REPEAT on a texture meant to be clamped (UI, screen buffers)"), tx(t, "glslTex_m4c", "GL_CLAMP_TO_EDGE")],
          [tx(t, "glslTex_m5a", "texelFetch reads garbage"), tx(t, "glslTex_m5b", "Coordinate outside 0..size − 1 (no wrapping is applied)"), tx(t, "glslTex_m5c", "clamp(ivec2, ivec2(0), textureSize(s, 0) − 1)")],
        ]}
      />
      <KeyIdeas t={t} id="glslTex" items={[
        "texture() filters and picks mips from uv derivatives; textureLod/Grad give you control; texelFetch reads exact texels.",
        "Distort by offsetting uv with smooth noise; scroll two layers in different directions.",
        "Triplanar mapping projects along X, Y, Z and blends by |n|^k: seamless without UVs.",
        "Linearise colour textures; leave data textures (normal, roughness…) alone.",
      ]} />
    </Article>
  );
}
