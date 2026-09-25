"use client";

// "Text Rendering" (Advanced Techniques): from font outlines to glyph quads, bitmap atlases, SDF and MSDF.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { GlyphMetricsFigure } from "@/components/lesson/figures/tech/GlyphMetricsFigure";
import { SdfTextFigure } from "@/components/lesson/figures/tech/SdfTextFigure";

const r = String.raw;

export function TextContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglText_intro",
          "OpenGL has no idea what a letter is. It draws triangles, so text has to be turned into triangles with textures on them. Every UI label, damage number and subtitle goes through the same pipeline: read the font file, rasterise each glyph once into an atlas texture, then for each string place one textured quad per glyph using the font's metrics. The details decide whether text looks crisp or smudged, and whether it costs one draw call or a thousand.")}
      </Lead>

      <H2>{tx(t, "oglText_fontTitle", "What is inside a font")}</H2>
      <p>
        {tx(t, "oglText_fontBody",
          "A TrueType or OpenType file stores each glyph as outlines: closed curves made of straight lines and quadratic (TrueType) or cubic (CFF) Bézier segments, in abstract \"font units\", typically 1000 or 2048 per em. It also stores metrics (how far to move after each glyph, how high the ascenders go), kerning tables, and for complex scripts the rules for joining and substituting glyphs. A library such as FreeType turns an outline into a bitmap at a requested pixel size and reports the metrics in pixels:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglText_thMetric", "Metric"), tx(t, "oglText_thFT", "FreeType field"), tx(t, "oglText_thMeans", "Meaning")]}
        rows={[
          [tx(t, "oglText_m1", "Bitmap size"), "bitmap.width, bitmap.rows", tx(t, "oglText_m1m", "the glyph's ink box in pixels")],
          [tx(t, "oglText_m2", "Bearing x"), "bitmap_left", tx(t, "oglText_m2m", "from the pen position to the left edge of the ink (can be negative: 'j')")],
          [tx(t, "oglText_m3", "Bearing y"), "bitmap_top", tx(t, "oglText_m3m", "from the baseline up to the top of the ink")],
          [tx(t, "oglText_m4", "Advance"), "advance.x (in 1/64 px!)", tx(t, "oglText_m4m", "how far the pen moves after this glyph; >> 6 to get pixels")],
          [tx(t, "oglText_m5", "Ascender / descender / line gap"), "size->metrics", tx(t, "oglText_m5m", "line height = ascender − descender + line gap")],
          [tx(t, "oglText_m6", "Kerning"), "FT_Get_Kerning / GPOS table", tx(t, "oglText_m6m", "a per-pair adjustment: AV, To, Ta get pulled together")],
        ]}
      />
      <Equation label={tx(t, "oglText_quadLabel", "Placing one glyph's quad")}
        where={[
          [r`(x_{pen}, y_{base})`, tx(t, "oglText_wPen", "pen position on the baseline (y up)")],
          [r`b_x, b_y`, tx(t, "oglText_wB", "bearing x and bearing y of the glyph")],
          [r`w, h`, tx(t, "oglText_wWH", "bitmap width and height")],
          [r`s`, tx(t, "oglText_wS", "scale, if drawing at a size other than the rasterised one")],
          [r`k(g, g')`, tx(t, "oglText_wK", "kerning between this glyph and the next")],
        ]}
        note={tx(t, "oglText_quadNote", "Round the pen position to whole pixels for small bitmap text, or it lands between texels and blurs. For large or SDF text, fractional positions look smoother. The only difference between laying out Latin and Arabic text is that the glyph sequence and positions come from a shaping engine (HarfBuzz) instead of one glyph per character.")}>
        {r`x_0 = x_{pen} + s\,b_x \quad y_1 = y_{base} + s\,b_y \quad x_1 = x_0 + s\,w \quad y_0 = y_1 - s\,h \qquad x_{pen} \mathrel{+}= s\,\big(\text{advance} + k(g, g')\big)`}
      </Equation>
      <GlyphMetricsFigure t={t} />

      <H2>{tx(t, "oglText_atlasTitle", "Glyph atlases and batching")}</H2>
      <p>
        {tx(t, "oglText_atlasBody",
          "Uploading one texture per glyph would mean one texture bind per letter. Instead all glyphs of a font are packed into one atlas texture, usually with a simple shelf or skyline packer. Each glyph remembers its rectangle (its UVs) in the atlas. A whole screen of text then becomes one vertex buffer of quads and a single draw call. Rasterise glyphs on demand the first time a character appears, which is essential for CJK fonts with tens of thousands of glyphs.")}
      </p>
      <CodeBlock lang="cpp" filename="glyph_atlas.cpp" t={t}>{`FT_Set_Pixel_Sizes(face, 0, 48);
glPixelStorei(GL_UNPACK_ALIGNMENT, 1);            // 1-byte rows: glyph widths are not multiples of 4!
for (char32_t c : charsetToBake) {
    FT_Load_Char(face, c, FT_LOAD_RENDER);
    FT_Bitmap& bm = face->glyph->bitmap;
    Rect slot = packer.insert(bm.width + 2, bm.rows + 2);   // 1 px padding: no bleeding under filtering
    glTextureSubImage2D(atlas, 0, slot.x + 1, slot.y + 1, bm.width, bm.rows,
                        GL_RED, GL_UNSIGNED_BYTE, bm.buffer);
    glyphs[c] = { slot, face->glyph->bitmap_left, face->glyph->bitmap_top,
                  float(face->glyph->advance.x >> 6) };       // 26.6 fixed point → pixels
}
// The atlas is single-channel (GL_R8); swizzle it so shaders can read .a or .r
GLint swz[] = { GL_ONE, GL_ONE, GL_ONE, GL_RED };
glTextureParameteriv(atlas, GL_TEXTURE_SWIZZLE_RGBA, swz);`}</CodeBlock>

      <H2>{tx(t, "oglText_sdfTitle", "Signed distance field text")}</H2>
      <p>
        {tx(t, "oglText_sdfBody",
          "A bitmap atlas stores coverage: how much of each texel is ink. Scaled up, bilinear filtering blends coverage between texels into a soft blur; scaled down, it aliases. Valve's 2007 paper (Chris Green) replaced coverage with distance: each texel stores the signed distance from its centre to the nearest outline, normalised so the outline sits at 0.5. Distance varies smoothly and almost linearly across the edge, and bilinear interpolation reproduces linear functions exactly, so the 0.5 crossing, where the edge actually is, survives magnification. A 32 px SDF atlas can draw crisp text at hundreds of pixels.")}
      </p>
      <Equation label={tx(t, "oglText_sdfLabel", "Encoding and rendering an SDF")}
        where={[
          [r`d`, tx(t, "oglText_wD", "signed distance in source pixels: positive inside the glyph, negative outside")],
          [r`\text{spread}`, tx(t, "oglText_wSpread", "the distance range stored (e.g. 8 px): beyond it the value clamps to 0 or 1")],
          [r`s`, tx(t, "oglText_wSv", "the value sampled from the atlas (bilinear)")],
          [r`w`, tx(t, "oglText_wW", "fwidth(s): how much s changes over one screen pixel, so the edge is always one pixel wide")],
        ]}
        note={tx(t, "oglText_sdfNote", "Everything else is a threshold on the same number. Bolder text uses a threshold below 0.5; an outline is a second, lower threshold; a glow is a wide smoothstep toward 0; a drop shadow reads the atlas again at an offset. There is no extra texture and no extra draw call.")}>
        {r`s_{stored} = \operatorname{clamp}\!\left(\frac12 + \frac{d}{2\cdot\text{spread}},\ 0,\ 1\right) \qquad \alpha = \operatorname{smoothstep}(0.5 - w,\ 0.5 + w,\ s)`}
      </Equation>
      <SdfTextFigure t={t} />
      <CodeBlock lang="glsl" filename="sdf_text.frag" t={t}>{`uniform sampler2D uAtlas;       // single-channel SDF
uniform vec4  uColor, uOutlineColor;
uniform float uOutline;         // 0 = none; 0.1 ≈ a fifth of the spread
in  vec2 vUV;
out vec4 FragColor;

void main() {
    float s = texture(uAtlas, vUV).r;
    float w = fwidth(s);                                   // one screen pixel, in distance units
    float fill    = smoothstep(0.5 - w, 0.5 + w, s);
    float outline = smoothstep(0.5 - uOutline - w, 0.5 - uOutline + w, s);
    vec4 col = mix(uOutlineColor, uColor, fill);
    FragColor = vec4(col.rgb, col.a * outline);           // outline alpha covers the fill too
}`}</CodeBlock>

      <H3>{tx(t, "oglText_msdfTitle", "Sharp corners: multi-channel SDF")}</H3>
      <p>
        {tx(t, "oglText_msdfBody",
          "A single distance field cannot represent a sharp corner. Near it, the nearest point of the outline jumps from one edge to the other, and bilinear interpolation rounds the corner off. Viktor Chlumský's MSDF (2015) stores three distance fields in R, G and B, each computed to a different subset of the edges. Near a corner, two channels agree on one edge and the other disagrees. Taking the median of the three recovers the sharp corner, still from one texture fetch:")}
      </p>
      <Equation label={tx(t, "oglText_msdfLabel", "MSDF reconstruction")}
        note={tx(t, "oglText_msdfNote", "msdfgen and msdf-atlas-gen build the atlas offline; the shader change is one line. Most modern engines (and many UI toolkits) use MSDF for anything that scales.")}
        glsl="float median(vec3 v) { return max(min(v.r, v.g), min(max(v.r, v.g), v.b)); }   float s = median(texture(uAtlas, vUV).rgb);">
        {r`s = \operatorname{median}(r, g, b) = \max\big(\min(r, g),\ \min(\max(r, g),\ b)\big)`}
      </Equation>

      <LessonTable
        headers={[tx(t, "oglText_thApproach", "Approach"), tx(t, "oglText_thGood", "Good at"), tx(t, "oglText_thBad", "Weak at")]}
        rows={[
          [tx(t, "oglText_a1", "Bitmap atlas per size"), tx(t, "oglText_a1g", "small UI text with hinting; exact pixel rendering"), tx(t, "oglText_a1b", "scaling, rotation, 3D; one atlas per size")],
          [tx(t, "oglText_a2", "SDF"), tx(t, "oglText_a2g", "any size from one atlas; outlines, glows, shadows for free"), tx(t, "oglText_a2b", "sharp corners round off; tiny sizes look soft")],
          [tx(t, "oglText_a3", "MSDF"), tx(t, "oglText_a3g", "sharp corners at any size"), tx(t, "oglText_a3b", "3-channel atlas; offline generation")],
          [tx(t, "oglText_a4", "GPU curve rendering (Slug, Loop–Blinn)"), tx(t, "oglText_a4g", "exact outlines at every size, no atlas"), tx(t, "oglText_a4b", "complex shaders; patents/licensing for some methods")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglText_pitfalls",
          "Forgetting glPixelStorei(GL_UNPACK_ALIGNMENT, 1) skews every glyph whose width is not a multiple of 4 into a diagonal mess. Blend text with premultiplied alpha, and ideally in linear space, or thin light-on-dark text looks too thin and dark-on-light too bold. Draw text last, without depth writes, after tone mapping and post-processing, so bloom and TAA do not smear it. And treat strings as UTF-8: decode code points before looking up glyphs, or every accent becomes two garbage glyphs.")}
      </Callout>

      <KeyIdeas t={t} id="oglText" items={[
        "Fonts store outlines and metrics; FreeType rasterises glyphs and reports bearing and advance (in 1/64 px).",
        "Layout: quad at pen + bearing, then pen += advance + kerning; shaping engines handle complex scripts.",
        "Pack glyphs into one atlas; a whole screen of text is one vertex buffer and one draw call.",
        "SDF atlases store distance: threshold at 0.5 with fwidth for crisp text at any size, plus outline/glow/shadow for free.",
        "MSDF stores three fields and takes the median to keep sharp corners.",
      ]} />
    </Article>
  );
}
