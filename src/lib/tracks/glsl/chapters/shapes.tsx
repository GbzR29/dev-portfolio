"use client";

// "Patterns & Transformations" and "Colour" — the Shapes, Patterns & Colour section (SDF and Noise live in index.tsx).

import { Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
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

      <Goals t={t} id="glslPat" items={[
        "Move, rotate and scale a shape by transforming the point instead.",
        "Repeat a shape across the screen with fract, floor and mod.",
        "Give every tile its own random variation.",
      ]} />

      <H2>{tx(t, "glslPat_invTitle", "Transform the point, not the shape")}</H2>
      <Equation label={tx(t, "glslPat_invLabel", "Moving a shape = the inverse transform on p")}
        where={[
          [r`f(p)`, tx(t, "glslPat_wF", "any shape function: an SDF, a pattern, a texture lookup")],
          [r`M`, tx(t, "glslPat_wM", "the transform you want to apply to the shape")],
          [r`M^{-1}`, tx(t, "glslPat_wMinv", "its inverse, the transform that undoes M")],
          [r`o`, tx(t, "glslPat_wO", "offset: where the shape's centre should end up")],
          [r`s`, tx(t, "glslPat_wS", "scale factor (2 = twice as big)")],
        ]}
        note={tx(t, "glslPat_invNote", "That is why the code often looks \"backwards\": to move a shape right by 0.3 you subtract 0.3; to make it twice as big you divide p by 2. For an SDF, divide the result by the scale too, or the distances come out in the wrong units.")}>
        {r`g(p) = f(M^{-1} p) \qquad \text{translate: } f(p - o) \qquad \text{scale: } s\,f(p / s)`}
      </Equation>
      <p>{tx(t, "glslPat_invSteps", "Worked with a circle of radius 0.2, f(p) = length(p) − 0.2, moved to o = (0.3, 0). The pixel at p = (0.3, 0) computes f(p − o) = f(0, 0) = −0.2: inside, in fact at the centre. The pixel at the origin computes f(−0.3, 0) = 0.3 − 0.2 = 0.1: outside. So the circle now sits at x = 0.3, even though we subtracted. Scaling by s = 2: at p = (0.3, 0), f(p/2) = length(0.15, 0) − 0.2 = −0.05, inside, so the radius is now 0.4. Multiplying by s turns −0.05 back into the true distance −0.1 (0.3 − 0.4).")}</p>
      <Equation label={tx(t, "glslPat_rotLabel", "2D rotation")}
        glsl="mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }   // p = rot(a) * p;"
        note={tx(t, "glslPat_rotNote", "GLSL's mat2 constructor fills columns, so mat2(c, s, −s, c) is the matrix on the left. Rotating p by −a rotates the shape by +a. Rotate around a pivot by translating to it first: rot(a) * (p − pivot) + pivot.")}>
        {r`R(\theta) = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix} \qquad p' = R(\theta)\,p`}
      </Equation>
      <p>{tx(t, "glslPat_rotSteps", "θ is the angle in radians, counter-clockwise (π/2 = 90°). Worked with θ = 90°: cos = 0, sin = 1, so p' = (0·x − 1·y, 1·x + 0·y) = (−y, x). The point (1, 0) goes to (0, 1), a quarter-turn counter-clockwise. A rectangle drawn with p' instead of p therefore appears turned the other way, clockwise, which is the \"backwards\" rule again: rotate p by −a to turn the shape by +a.")}</p>

      <H2>{tx(t, "glslPat_repTitle", "Repetition: fract, floor, mod")}</H2>
      <p>
        {tx(t, "glslPat_repBody", "Scaling p by n and keeping only the fractional part gives n × n tiles, each with its own local coordinates in [0, 1). The integer part is the tile's id. Feeding the id to a hash gives each tile its own random parameters, so an infinite, varied pattern costs the same as one tile:")}
      </p>
      <Equation label={tx(t, "glslPat_cellLabel", "Cell id and local coordinates")}
        where={[
          [r`p`, tx(t, "glslPat_wP", "the coordinate in [0, 1] (UV)")],
          [r`n`, tx(t, "glslPat_wNt", "tiles per side")],
          [r`\operatorname{fract}(x)`, tx(t, "glslPat_wFract", "x − floor(x), the part after the decimal point")],
          [r`\operatorname{hash}`, tx(t, "glslPat_wHash", "a function that turns a number into a repeatable pseudo-random value in [0, 1)")],
        ]}
        note={tx(t, "glslPat_cellNote", "mod(p, c) − c/2 is the same idea centred on each cell. It is the \"domain repetition\" that turns one SDF object into an infinite grid in the raymarching chapter.")}>
        {r`\text{id} = \lfloor n\,p \rfloor \qquad \text{local} = \operatorname{fract}(n\,p) - 0.5 \qquad \text{random}_{\text{cell}} = \operatorname{hash}(\text{id})`}
      </Equation>
      <p>{tx(t, "glslPat_cellSteps", "Worked with n = 4 and p = (0.6, 0.3): n·p = (2.4, 1.2), so id = (2, 1), the third column and second row, counting from 0. local = (0.4, 0.2) − 0.5 = (−0.1, −0.3), slightly left of and below that tile's centre. Every one of the 16 tiles sees its own local coordinates in −0.5..0.5, so a circle drawn with length(local) − 0.3 appears 16 times. hash(id) differs per tile, so multiplying the radius by 0.5 + 0.5·hash(id) gives every circle its own size.")}</p>
      <Equation label={tx(t, "glslPat_polarLabel", "Polar coordinates and angular repetition")}
        where={[
          [r`r`, tx(t, "glslPat_wR", "distance from the centre")],
          [r`\theta`, tx(t, "glslPat_wTheta", "angle around the centre, −π … π")],
          [r`N`, tx(t, "glslPat_wN", "number of wedges")],
          [r`\theta'`, tx(t, "glslPat_wTheta2", "the angle folded into the first wedge and mirrored")],
        ]}
        note={tx(t, "glslPat_polarNote", "Folding the angle into one wedge with mod, then mirroring it with abs, makes every wedge a copy of the first, with matching seams: a kaleidoscope. Flowers, gears and radial menus are all this.")}>
        {r`r = \lVert p \rVert \qquad \theta = \operatorname{atan}(p_y, p_x) \qquad \theta' = \left|\operatorname{mod}\!\left(\theta, \tfrac{2\pi}{N}\right) - \tfrac{\pi}{N}\right| \qquad p' = r\,(\cos\theta', \sin\theta')`}
      </Equation>
      <ShaderPlayground presets={PATTERN_PRESETS} t={t} id="glslPat" />
      <Callout type="warn" t={t}>
        {tx(t, "glslPat_aaWarn",
          "Inside each tile, fwidth() still measures in screen pixels, so anti-aliasing with smoothstep(−w, w, d) keeps working at any tile count. Hard-coded edge widths like smoothstep(0.0, 0.01, d) blur tiny tiles and alias big ones. Also avoid fract() on very large coordinates (a timer running for hours): floats lose precision, and patterns start to jitter.")}
      </Callout>
      <p>{tx(t, "glslPat_polarSteps", "Worked with N = 6 (wedges of 60°, π/3): a point at θ = 100° gives mod(100°, 60°) = 40°, minus 30° = 10°, abs = 10°. A point at θ = 80° gives 20° − 30° = −10°, abs = 10° too. Both land on the same θ', so they get the same colour: the two sides of each wedge mirror each other, and the seams match.")}</p>

      <H2>{tx(t, "glslPat_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "glslPat_thSymptom", "Symptom"), tx(t, "glslPat_thCause", "Cause"), tx(t, "glslPat_thFix", "Fix")]}
        rows={[
          [tx(t, "glslPat_m1a", "Shape moves the opposite way"), tx(t, "glslPat_m1b", "Applied the transform to p instead of its inverse"), tx(t, "glslPat_m1c", "Subtract the offset, divide by the scale, rotate by −a")],
          [tx(t, "glslPat_m2a", "Shape rotates around the corner of the screen"), tx(t, "glslPat_m2b", "Rotated around (0, 0), the bottom-left of UV"), tx(t, "glslPat_m2c", "Centre the coordinates first, or rotate around a pivot")],
          [tx(t, "glslPat_m3a", "Scaled SDF has soft or thick edges"), tx(t, "glslPat_m3b", "f(p/s) returned without multiplying by s"), tx(t, "glslPat_m3c", "Return s · f(p / s)")],
          [tx(t, "glslPat_m4a", "Shapes cut off at tile borders"), tx(t, "glslPat_m4b", "Shape larger than half a tile"), tx(t, "glslPat_m4c", "Keep it inside −0.5..0.5, or check neighbouring tiles too")],
          [tx(t, "glslPat_m5a", "Every tile gets the same random value"), tx(t, "glslPat_m5b", "Hashed the local coordinate instead of the id"), tx(t, "glslPat_m5c", "hash(floor(n·p))")],
        ]}
      />

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

      <Goals t={t} id="glslCol" items={[
        "Make a whole gradient from a cosine palette.",
        "Rotate hues and change saturation in HSV.",
        "Mix colours in linear light so gradients stay clean.",
        "Write the common blend modes in one line each.",
      ]} />

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
      <p>{tx(t, "glslCol_palSteps", "a, b, c and d are vec3s, one number per channel, so the formula runs three times, for red, green and blue. 2π turns t into an angle, so c = 1 makes each channel do one full cosine cycle as t goes 0 → 1. Worked with a = b = (0.5, 0.5, 0.5), c = (1, 1, 1), d = (0, 0.33, 0.67): at t = 0 the red angle is 0, cos = 1, red = 0.5 + 0.5 = 1; green is cos(2π·0.33) = −0.48, so 0.26; blue is cos(2π·0.67) = −0.48 too, so 0.26. The colour is (1, 0.26, 0.26), a warm red. Because the phases are a third of a cycle apart, the channels take turns peaking and t sweeps through a rainbow. Keep a + b ≤ 1 and a − b ≥ 0 so no channel leaves 0..1.")}</p>
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
      <p>{tx(t, "glslCol_hsvSteps", "Here h, s and v all run 0..1, and h = 0 is red, 1/3 green, 2/3 blue. Worked with h = 1/6 (yellow), s = 1, v = 1. Red: fract(1/6)·6 − 3 = −2, abs = 2, minus 1 = 1. Green: fract(1/6 + 2/3) = 5/6, ·6 − 3 = 2, abs − 1 = 1. Blue: fract(1/6 + 1/3) = 1/2, ·6 − 3 = 0, abs − 1 = −1, clamped to 0. The result is (1, 1, 0), yellow. With s = 0.5, mix(1, (1, 1, 0), 0.5) = (1, 1, 0.5), a pale yellow. With v = 0.5, everything halves: dark olive. mix(a, b, s) here is a + (b − a)·s, so s = 0 gives white and s = 1 the pure hue.")}</p>

      <H2>{tx(t, "glslCol_linTitle", "Linear light vs sRGB")}</H2>
      <p>
        {tx(t, "glslCol_linBody", "Colour values in textures and on screen are encoded with the sRGB curve, which spends more precision on dark tones where the eye is most sensitive. A stored 0.5 is not half the light: it is about 21%. Any arithmetic that models light (mixing, blurring, lighting, averaging) must happen on linear values:")}
      </p>
      <Equation label={tx(t, "glslCol_srgbLabel", "The sRGB transfer function (exact)")}
        note={tx(t, "glslCol_srgbNote", "pow(c, 2.2) and pow(c, 1/2.2) are close enough for most effects. With GL_SRGB8_ALPHA8 textures and GL_FRAMEBUFFER_SRGB, the hardware applies the exact curve for free on every read and write.")}>
        {r`c_{lin} = \begin{cases} \dfrac{c}{12.92} & c \le 0.04045 \\[4pt] \left(\dfrac{c + 0.055}{1.055}\right)^{2.4} & \text{otherwise} \end{cases} \qquad Y = 0.2126\,\red{R} + 0.7152\,\green{G} + 0.0722\,\blue{B}`}
      </Equation>
      <p>{tx(t, "glslCol_srgbSteps", "c is the stored (sRGB) value of one channel and c_lin the light it stands for. The short straight segment c/12.92 near black avoids an infinitely steep curve at 0; above 0.04045 the power curve takes over, and the constants 0.055 and 1.055 make the two pieces meet smoothly. Worked: c = 0.5 gives ((0.5 + 0.055)/1.055)^2.4 = 0.526^2.4 = 0.214, the \"about 21%\" above. Y is the luminance, the brightness the eye perceives; its weights add up to 1 and favour green because the eye is most sensitive to it, so pure green (0, 1, 0) has Y = 0.72 and pure blue only 0.07.")}</p>
      <p>{tx(t, "glslCol_mixSteps", "Why it matters, with numbers: mixing stored red (1, 0, 0) and green (0, 1, 0) half and half in sRGB gives (0.5, 0.5, 0), which displays as two channels at 21% light: a dark, muddy olive. Mixing in linear space gives the same (0.5, 0.5, 0) in light, which encodes back to sRGB as (0.735, 0.735, 0): a clean, bright yellow. The rule: decode to linear, do the maths, encode to sRGB once at the end.")}</p>

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
      <p>{tx(t, "glslCol_blendSteps", "Worked with a base a = 0.6 and a top layer b = 0.5. Multiply: 0.30, darker. Screen: 1 − 0.4·0.5 = 0.80, lighter. Overlay: a ≥ ½, so 1 − 2·0.4·0.5 = 0.60, unchanged, because a top layer of exactly 0.5 is neutral in overlay; above 0.5 it lightens, below it darkens. That neutral grey is why detail textures for overlay are authored around 50% grey.")}</p>
      <ShaderPlayground presets={COLOR_PRESETS} t={t} id="glslCol" />
      <Callout type="info" t={t}>
        {tx(t, "glslCol_hdrNote", "In a real renderer colours are HDR, unbounded above 1, until tone mapping at the very end (see HDR & Tone Mapping in the OpenGL track). Blend modes built for [0, 1], like screen and overlay, are meant for the final LDR image or for textures, not for lighting values.")}
      </Callout>

      <H2>{tx(t, "glslCol_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "glslCol_thSymptom", "Symptom"), tx(t, "glslCol_thCause", "Cause"), tx(t, "glslCol_thFix", "Fix")]}
        rows={[
          [tx(t, "glslCol_m1a", "Gradients go muddy or dark in the middle"), tx(t, "glslCol_m1b", "Mixed sRGB values directly"), tx(t, "glslCol_m1c", "Decode to linear, mix, encode once")],
          [tx(t, "glslCol_m2a", "Whole image too bright and washed out"), tx(t, "glslCol_m2b", "sRGB encoding applied twice (by hand and by GL_FRAMEBUFFER_SRGB)"), tx(t, "glslCol_m2c", "Encode in exactly one place")],
          [tx(t, "glslCol_m3a", "Palette clips to flat white or black"), tx(t, "glslCol_m3b", "a + b > 1 or a − b < 0 in some channel"), tx(t, "glslCol_m3c", "Keep a ± b inside 0..1")],
          [tx(t, "glslCol_m4a", "Hue jumps when animating it"), tx(t, "glslCol_m4b", "h grows past 1 and is not wrapped, or hue mixed the short way round"), tx(t, "glslCol_m4c", "fract(h); mix hues across the 0/1 seam on purpose")],
          [tx(t, "glslCol_m5a", "Screen or overlay looks wrong on lighting"), tx(t, "glslCol_m5b", "Used on HDR values above 1"), tx(t, "glslCol_m5c", "Apply them after tone mapping")],
        ]}
      />

      <KeyIdeas t={t} id="glslCol" items={[
        "color(t) = a + b·cos(2π(c·t + d)): twelve numbers for a whole gradient.",
        "HSV makes hue rotation and saturation changes one-liners; convert branch-free.",
        "Mix, blur and light in linear space; encode to sRGB only for display.",
        "Blend modes are one line each: multiply darkens, screen lightens, overlay adds contrast.",
      ]} />
    </Article>
  );
}
