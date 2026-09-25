"use client";

// "Mipmapping & Texture Compression" (Performance): sampling theory, mip chains, trilinear and anisotropic filtering, block compression.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { MipAnisoFigure } from "@/components/lesson/figures/perf/MipAnisoFigure";
import { Bc1Figure } from "@/components/lesson/figures/perf/Bc1Figure";

const r = String.raw;

export function TextureCompressionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglTexc_intro",
          "Textures are usually the biggest thing in video memory and the biggest consumer of memory bandwidth. Two techniques make them affordable and good-looking. Mipmaps prepare smaller, pre-filtered copies so distant surfaces sample the right amount of detail. Block compression stores texels in fixed-size blocks the GPU decodes on the fly, at a quarter or an eighth of the size. Both are nearly free, and skipping either one is one of the most common reasons a renderer looks noisy or runs out of memory.")}
      </Lead>

      <H2>{tx(t, "oglTexc_aliasTitle", "Why distant textures shimmer")}</H2>
      <p>
        {tx(t, "oglTexc_aliasBody",
          "A pixel on a distant floor covers many texels, but a texture fetch samples at one point. That is the anti-aliasing chapter's sampling problem again. When the texture has detail finer than two pixels (the Nyquist limit), point samples alias. Fine patterns become false coarse patterns (moiré) that crawl as the camera moves. The fix is to low-pass filter the texture before sampling: average all the texels under the pixel. Doing that exactly per pixel is too expensive, so it is done in advance, at a few fixed scales.")}
      </p>

      <H2>{tx(t, "oglTexc_mipTitle", "Mipmaps")}</H2>
      <Equation label={tx(t, "oglTexc_chainLabel", "The mip chain and its memory cost")}
        where={[[r`N`, tx(t, "oglTexc_wN", "the base size; level k has size N / 2ᵏ, down to 1×1")]]}
        note={tx(t, "oglTexc_chainNote", "Each level is a quarter of the previous one, so the whole chain adds only a third to the memory: 1 + ¼ + ¹⁄₁₆ + … = 4/3. \"Mip\" is Latin multum in parvo, \"much in little\" (Williams, 1983).")}>
        {r`\text{levels} = \lfloor \log_2 N \rfloor + 1 \qquad \sum_{k=0}^{\infty} \left(\tfrac14\right)^k = \tfrac43`}
      </Equation>
      <Equation label={tx(t, "oglTexc_lodLabel", "Which level: λ from the pixel's footprint")}
        where={[
          [r`\frac{\partial(u,v)}{\partial x}, \frac{\partial(u,v)}{\partial y}`, tx(t, "oglTexc_wDeriv", "how much the texture coordinate changes to the neighbouring pixel, scaled to texels (the GPU gets them from the 2×2 pixel quad)")],
          [r`P_{max}, P_{min}`, tx(t, "oglTexc_wP", "the longer and shorter side of the pixel's footprint in texture space")],
        ]}
        note={tx(t, "oglTexc_lodNote", "Trilinear filtering picks λ from the longer side and blends the two nearest levels by the fractional part of λ, so there are no visible seams between levels. Using the longer side guarantees no aliasing, but blurs the other direction whenever the footprint is stretched.")}>
        {r`P_x = \left\lVert \frac{\partial(u,v)}{\partial x} \right\rVert \quad P_y = \left\lVert \frac{\partial(u,v)}{\partial y} \right\rVert \qquad \lambda = \log_2 \max(P_x, P_y)`}
      </Equation>
      <H3>{tx(t, "oglTexc_anisoTitle", "Anisotropic filtering")}</H3>
      <p>
        {tx(t, "oglTexc_anisoBody",
          "On a floor seen at a grazing angle, a pixel's footprint is a long thin ellipse: maybe 16 texels along the view, 1 across. Trilinear uses the long side and blurs everything. Anisotropic filtering picks the mip level from the short side instead and takes several samples along the long side:")}
      </p>
      <Equation label={tx(t, "oglTexc_anisoLabel", "Anisotropic sample count and level")}
        where={[[r`A_{max}`, tx(t, "oglTexc_wA", "the anisotropy limit you set (GL_TEXTURE_MAX_ANISOTROPY, typically 16)")]]}>
        {r`n = \min\!\left(\left\lceil \frac{P_{max}}{P_{min}} \right\rceil,\ A_{max}\right) \qquad \lambda = \log_2 \frac{P_{max}}{n}`}
      </Equation>
      <MipAnisoFigure t={t} />
      <CodeBlock lang="cpp" filename="mips_and_aniso.cpp" t={t}>{`glTextureStorage2D(tex, levels, GL_SRGB8_ALPHA8, w, h);      // allocate all levels
glTextureSubImage2D(tex, 0, 0, 0, w, h, GL_RGBA, GL_UNSIGNED_BYTE, pixels);
glGenerateTextureMipmap(tex);                                // box-filters level k → k+1 on the GPU
glTextureParameteri(tex, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);   // trilinear
glTextureParameteri(tex, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTextureParameterf(tex, GL_TEXTURE_MAX_ANISOTROPY, 16.0f);  // core in GL 4.6 (ARB/EXT before)`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglTexc_mipGenTip", "glGenerateMipmap uses a simple box filter. Offline tools can do better with a Kaiser or Lanczos filter, and must downsample colour in linear space. Averaging sRGB values darkens every level, which is the classic cause of textures going dark and muddy in the distance. Normal maps need their own treatment: averaged normals get shorter, and that length is information. Toksvig and LEAN mapping turn it into extra roughness, so shiny bumps don't sparkle in the distance.")}
      </Callout>

      <H2>{tx(t, "oglTexc_compTitle", "Block compression")}</H2>
      <p>
        {tx(t, "oglTexc_compBody",
          "JPEG and PNG are useless to a GPU: to read one texel it would have to decompress the whole image or a large part of it. GPU formats are fixed-rate block codecs. Every 4×4 block takes exactly the same number of bits, so the address of any texel's block is a multiplication, and the texture units decode blocks in hardware as they fetch them. The texture stays compressed in memory and in the caches, so compression saves bandwidth as well as space and usually makes rendering faster.")}
      </p>
      <Equation label={tx(t, "oglTexc_bc1Label", "BC1 (DXT1): 4×4 pixels in 64 bits")}
        where={[
          [r`c_0, c_1`, tx(t, "oglTexc_wC", "two endpoint colours stored as RGB565 (5 bits red, 6 green, 5 blue: 16 bits each)")],
          [r`i_p \in \{0,1,2,3\}`, tx(t, "oglTexc_wI", "a 2-bit index per pixel: 16 × 2 = 32 bits")],
        ]}
        note={tx(t, "oglTexc_bc1Note", "32 + 32 = 64 bits for 16 pixels: 4 bits per pixel against 24 for RGB8, 6:1. Every block's colours lie on a line segment in RGB space, which is why BC1 handles gradients well but struggles with blocks containing three unrelated colours. When c₀ ≤ c₁ the block switches to 3 colours plus transparent black, BC1's 1-bit alpha.")}>
        {r`\text{palette} = \Big\{\, c_0,\ \ c_1,\ \ \tfrac23 c_0 + \tfrac13 c_1,\ \ \tfrac13 c_0 + \tfrac23 c_1 \,\Big\} \qquad \text{pixel}_p = \text{palette}[\,i_p\,]`}
      </Equation>
      <Bc1Figure t={t} />
      <LessonTable
        headers={[tx(t, "oglTexc_thFmt", "Format"), tx(t, "oglTexc_thBpp", "Bits / pixel"), tx(t, "oglTexc_thFor", "Use for")]}
        rows={[
          ["BC1 (DXT1)", "4", tx(t, "oglTexc_f1", "opaque colour; 1-bit alpha")],
          ["BC3 (DXT5)", "8", tx(t, "oglTexc_f2", "colour + smooth alpha (BC1 colour block + BC4 alpha block)")],
          ["BC4", "4", tx(t, "oglTexc_f3", "one channel: roughness, AO, height, masks")],
          ["BC5", "8", tx(t, "oglTexc_f4", "two channels: tangent-space normal maps (x, y; z = √(1 − x² − y²) in the shader)")],
          ["BC6H", "8", tx(t, "oglTexc_f5", "HDR RGB (half float): skyboxes, lightmaps, IBL")],
          ["BC7", "8", tx(t, "oglTexc_f6", "high-quality RGB(A): up to 3 lines per block, many partitions; best quality, slow to encode")],
          ["ETC2 / EAC", "4–8", tx(t, "oglTexc_f7", "mobile (OpenGL ES 3.0 mandatory)")],
          ["ASTC", "0.89–8", tx(t, "oglTexc_f8", "mobile and Apple: block size from 4×4 to 12×12, any bit rate")],
        ]}
      />
      <CodeBlock lang="cpp" filename="compressed_upload.cpp" t={t}>{`// Data comes pre-compressed from the asset pipeline (KTX2 / DDS files), one blob per mip level
glTextureStorage2D(tex, levels, GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM, w, h);   // BC7, sRGB
for (int level = 0; level < levels; ++level)
    glCompressedTextureSubImage2D(tex, level, 0, 0, mipW(level), mipH(level),
                                  GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM, blobSize(level), blob(level));

// Normal map in BC5: reconstruct z in the shader
//   vec2 xy = texture(uNormalBC5, uv).rg * 2.0 - 1.0;
//   vec3 n  = vec3(xy, sqrt(max(1.0 - dot(xy, xy), 0.0)));`}</CodeBlock>
      <Equation label={tx(t, "oglTexc_memLabel", "What it saves, for one 4096² texture")}
        notes={[
          tx(t, "oglTexc_m1", "RGBA8 with mips: 4096² × 4 B × 4/3 ≈ 85 MB."),
          tx(t, "oglTexc_m2", "BC7 with mips: 4096² × 1 B × 4/3 ≈ 21 MB."),
          tx(t, "oglTexc_m3", "BC1 with mips: ≈ 11 MB. A PBR material has 3–5 such maps."),
        ]}>
        {r`\text{bytes} = W \cdot H \cdot \frac{\text{bpp}}{8} \cdot \frac43`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "oglTexc_basisNote", "Every platform has different formats (BCn on desktop and consoles, ASTC/ETC2 on mobile), so shipping one file per platform multiplies downloads. KTX2 with Basis Universal stores a compact intermediate format, supercompressed for downloading, that is transcoded at load time into whatever the GPU supports. That is how glTF and WebGL applications ship compressed textures.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglTexc_pitfalls",
          "Compress normal maps as BC5 (or BC7), never BC1: independent x and y don't lie on a colour line, and the artefacts show as blocky lighting. Pick the sRGB variant for colour and the UNORM variant for data. Textures without mips on minified surfaces waste bandwidth as well as quality, because every fetch pulls a distant, cache-unfriendly block. And a LOD bias below zero sharpens at the cost of shimmering; TAA-based renderers use a small negative bias on purpose.")}
      </Callout>

      <KeyIdeas t={t} id="oglTexc" items={[
        "Minification aliases; mipmaps pre-filter the texture at every power-of-two scale for +33% memory.",
        "λ = log2 of the footprint size; trilinear blends two levels; anisotropic takes up to 16 samples along the long axis.",
        "Downsample colour mips in linear space; handle normal-map mips specially.",
        "Block formats are fixed-rate 4×4 codecs decoded by the texture units: less memory and less bandwidth.",
        "BC1: two RGB565 endpoints + 2-bit indices = 4 bpp; BC5 for normals, BC7 for quality, BC6H for HDR, ASTC/ETC2 on mobile.",
      ]} />
    </Article>
  );
}
