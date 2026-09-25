"use client";

// "Patterns & Transformations" and "Colour" — the Shapes, Patterns & Colour section (SDF and Noise live in index.tsx).

import { Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "../../opengl/chapters/lighting-advanced";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { PaletteFigure } from "@/components/lesson/glsl/PaletteFigure";
import { PATTERN_PRESETS, COLOR_PRESETS } from "../presets/basics";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Patterns & transformations
// ═════════════════════════════════════════════════════════════════════════════

export function PatternsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslPat_intro",
          "A fragment shader never moves a shape. It moves the space the shape is evaluated in. To draw a circle to the right, you ask whether the point p − offset is inside a circle at the origin. To rotate, scale, repeat or mirror anything, you transform p before evaluating the shape, and every one of those transforms is a line or two of GLSL.")}
      </Lead>

      <H2>{tx(t, "glslPat_invTitle", "Transform the point, not the shape")}</H2>
      <Equation label={tx(t, "glslPat_invLabel", "Moving a shape = the inverse transform on p")}
        where={[
          [r`f(p)`, tx(t, "glslPat_wF", "any shape function: an SDF, a pattern, a texture lookup")],
          [r`M`, tx(t, "glslPat_wM", "the transform you want to apply to the shape")],
        ]}
        note={tx(t, "glslPat_invNote", "That is why the code often looks \"backwards\": to move a shape right by 0.3 you subtract 0.3; to make it twice as big you divide p by 2. For an SDF, divide the result by the scale too, or the distances come out in the wrong units.")}>
        {r`g(p) = f(M^{-1} p) \qquad \text{translate: } f(p - o) \qquad \text{scale: } s\,f(p / s)`}
      </Equation>
      <Equation label={tx(t, "glslPat_rotLabel", "2D rotation")}
        glsl="mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }   // p = rot(a) * p;"
        note={tx(t, "glslPat_rotNote", "GLSL's mat2 constructor fills columns, so mat2(c, s, −s, c) is the matrix on the left. Rotating p by −a rotates the shape by +a. Rotate around a pivot by translating to it first: rot(a) * (p − pivot) + pivot.")}>
        {r`R(\theta) = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix} \qquad p' = R(\theta)\,p`}
      </Equation>

      <H2>{tx(t, "glslPat_repTitle", "Repetition: fract, floor, mod")}</H2>
      <p>
        {tx(t, "glslPat_repBody", "Scaling p by n and keeping only the fractional part gives n × n tiles, each with its own local coordinates in [0, 1). The integer part is the tile's id. Feeding the id to a hash gives each tile its own random parameters, so an infinite, varied pattern costs the same as one tile:")}
      </p>
      <Equation label={tx(t, "glslPat_cellLabel", "Cell id and local coordinates")}
        note={tx(t, "glslPat_cellNote", "mod(p, c) − c/2 is the same idea centred on each cell. It is the \"domain repetition\" that turns one SDF object into an infinite grid in the raymarching chapter.")}>
        {r`\text{id} = \lfloor n\,p \rfloor \qquad \text{local} = \operatorname{fract}(n\,p) - 0.5 \qquad \text{random}_{\text{cell}} = \operatorname{hash}(\text{id})`}
      </Equation>
      <Equation label={tx(t, "glslPat_polarLabel", "Polar coordinates and angular repetition")}
        where={[[r`N`, tx(t, "glslPat_wN", "number of wedges")]]}
        note={tx(t, "glslPat_polarNote", "Folding the angle into one wedge with mod, then mirroring it with abs, makes every wedge a copy of the first, with matching seams: a kaleidoscope. Flowers, gears and radial menus are all this.")}>
        {r`r = \lVert p \rVert \qquad \theta = \operatorname{atan}(p_y, p_x) \qquad \theta' = \left|\operatorname{mod}\!\left(\theta, \tfrac{2\pi}{N}\right) - \tfrac{\pi}{N}\right| \qquad p' = r\,(\cos\theta', \sin\theta')`}
      </Equation>
      <ShaderPlayground presets={PATTERN_PRESETS} t={t} id="glslPat" />
      <Callout type="warn" t={t}>
        {tx(t, "glslPat_aaWarn",
          "Inside each tile, fwidth() still measures in screen pixels, so anti-aliasing with smoothstep(−w, w, d) keeps working at any tile count. Hard-coded edge widths like smoothstep(0.0, 0.01, d) blur tiny tiles and alias big ones. Also avoid fract() on very large coordinates (a timer running for hours): floats lose precision, and patterns start to jitter.")}
      </Callout>

      <KeyIdeas t={t} id="glslPat" items={[
        "Shaders move space, not shapes: apply the inverse transform to p.",
        "mat2(c, s, −s, c) rotates; divide by the scale, and multiply SDFs back by it.",
        "fract gives local tile coordinates, floor gives the tile id, hash(id) gives per-tile randomness.",
        "Polar coordinates with mod and abs on the angle make radial and kaleidoscopic symmetry.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Colour
// ═════════════════════════════════════════════════════════════════════════════

export function ColorContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslCol_intro",
          "A shader's last line writes a colour, and most shaders spend much of their creativity choosing it. This chapter covers generating gradients from four vectors, working in HSV when you want to rotate hues, mixing in linear light so gradients don't turn muddy, and the blend modes artists know from image editors.")}
      </Lead>

      <H2>{tx(t, "glslCol_palTitle", "Cosine palettes")}</H2>
      <Equation label={tx(t, "glslCol_palLabel", "Íñigo Quílez's procedural palette")}
        where={[
          [r`a`, tx(t, "glslCol_wA", "centre (the average colour)")],
          [r`b`, tx(t, "glslCol_wB", "amplitude (the contrast per channel)")],
          [r`c`, tx(t, "glslCol_wC", "frequency: how many times each channel cycles over t ∈ [0, 1]")],
          [r`d`, tx(t, "glslCol_wD", "phase: where each channel starts")],
        ]}>
        {r`\text{color}(t) = a + b \cdot \cos\!\big(2\pi\,(c\,t + d)\big)`}
      </Equation>
      <PaletteFigure t={t} />

      <H2>{tx(t, "glslCol_hsvTitle", "HSV: hue, saturation, value")}</H2>
      <p>
        {tx(t, "glslCol_hsvBody",
          "RGB is how the screen works. HSV is how people describe colour: which hue, how vivid, how bright. Converting to HSV makes some operations trivial. Rotating the hue is an addition. Desaturating multiplies one number. Picking evenly spaced hues for a chart is a loop. Branchless conversions exist in both directions:")}
      </p>
      <Equation label={tx(t, "glslCol_hsvLabel", "HSV → RGB, branch-free")}
        note={tx(t, "glslCol_hsvNote", "The three shifted triangle waves are exactly the R, G and B curves around the hue circle. Clamped to [0, 1], blended toward white by (1 − s) and scaled by v, they give the colour.")}
        glsl="vec3 p = abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);  rgb = v * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), s);">
        {r`\text{rgb} = v \cdot \operatorname{mix}\!\Big(\mathbf 1,\ \operatorname{clamp}\big(|6\operatorname{fract}(h + (0, \tfrac23, \tfrac13)) - 3| - 1,\ 0,\ 1\big),\ s\Big)`}
      </Equation>

      <H2>{tx(t, "glslCol_linTitle", "Linear light vs sRGB")}</H2>
      <p>
        {tx(t, "glslCol_linBody", "Colour values in textures and on screen are encoded with the sRGB curve, which spends more precision on dark tones where the eye is most sensitive. A stored 0.5 is not half the light: it is about 21%. Any arithmetic that models light (mixing, blurring, lighting, averaging) must happen on linear values:")}
      </p>
      <Equation label={tx(t, "glslCol_srgbLabel", "The sRGB transfer function (exact)")}
        note={tx(t, "glslCol_srgbNote", "pow(c, 2.2) and pow(c, 1/2.2) are close enough for most effects. With GL_SRGB8_ALPHA8 textures and GL_FRAMEBUFFER_SRGB, the hardware applies the exact curve for free on every read and write.")}>
        {r`c_{lin} = \begin{cases} \dfrac{c}{12.92} & c \le 0.04045 \\[4pt] \left(\dfrac{c + 0.055}{1.055}\right)^{2.4} & \text{otherwise} \end{cases} \qquad Y = 0.2126\,\red{R} + 0.7152\,\green{G} + 0.0722\,\blue{B}`}
      </Equation>

      <H2>{tx(t, "glslCol_blendTitle", "Blend modes")}</H2>
      <LessonTable
        headers={[tx(t, "glslCol_thMode", "Mode"), tx(t, "glslCol_thFormula", "Formula (a = base, b = top)"), tx(t, "glslCol_thUse", "Use")]}
        rows={[
          ["multiply", "a · b", tx(t, "glslCol_b1", "shadows, dirt, AO, tinting: only darkens")],
          ["screen", "1 − (1 − a)(1 − b)", tx(t, "glslCol_b2", "glows, light leaks: only lightens")],
          ["overlay", "a < ½ ? 2ab : 1 − 2(1 − a)(1 − b)", tx(t, "glslCol_b3", "contrast, texture detail over a base colour")],
          ["soft light", "(1 − 2b)a² + 2ba", tx(t, "glslCol_b4", "a gentler overlay")],
          ["add (linear dodge)", "min(a + b, 1)", tx(t, "glslCol_b5", "light: fire, sparks, bloom (unclamped in HDR)")],
        ]}
      />
      <ShaderPlayground presets={COLOR_PRESETS} t={t} id="glslCol" />
      <Callout type="info" t={t}>
        {tx(t, "glslCol_hdrNote", "In a real renderer colours are HDR, unbounded above 1, until tone mapping at the very end (see HDR & Tone Mapping in the OpenGL track). Blend modes built for [0, 1], like screen and overlay, are meant for the final LDR image or for textures, not for lighting values.")}
      </Callout>

      <KeyIdeas t={t} id="glslCol" items={[
        "color(t) = a + b·cos(2π(c·t + d)): twelve numbers for a whole gradient.",
        "HSV makes hue rotation and saturation changes one-liners; convert branch-free.",
        "Mix, blur and light in linear space; encode to sRGB only for display.",
        "Blend modes are one line each: multiply darkens, screen lightens, overlay adds contrast.",
      ]} />
    </Article>
  );
}
