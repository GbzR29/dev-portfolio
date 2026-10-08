// src/lib/tracks/glsl/chapters/effects/stylized.tsx
"use client";

import { Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { STYLE_PRESETS } from "../../presets/stylized";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Toon, dissolve, hologram
// ═════════════════════════════════════════════════════════════════════════════

export function StylizedContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslSty_intro",
          "Stylised shaders break physical rules on purpose, and each one is built from the same few quantities as realistic lighting: N·L, N·V, N·H, a noise value and a threshold. Quantise them, compare them, or add them up in unusual ways, and you get cartoons, disintegration and sci-fi projections.")}
      </Lead>

      <Goals t={t} id="glslSty" items={[
        "Cut lighting into bands for toon shading, with outlines.",
        "Dissolve an object with noise and a glowing edge.",
        "Build a hologram from Fresnel, scanlines and flicker.",
      ]} />

      <H2>{tx(t, "glslSty_toonTitle", "Toon shading")}</H2>
      <Equation label={tx(t, "glslSty_toonLabel", "Quantised lighting")}
        where={[
          [r`\vN, \vL, \vV, \vH`, tx(t, "glslSty_wVecs", "unit vectors at the fragment: surface normal, direction to the light, direction to the camera, and the half vector normalize(L + V)")],
          [r`n`, tx(t, "glslSty_wN", "number of light bands")],
          [r`\lfloor x \rfloor`, tx(t, "glslSty_wFloor", "floor: the largest whole number not above x (floor(2.7) = 2)")],
          [r`s`, tx(t, "glslSty_wS", "highlight size: how far below 1 N·H may fall and still be lit (0.02 = a small dot)")],
          [r`\epsilon`, tx(t, "glslSty_wEps", "the fwidth of the quantity: one pixel of smoothing, so bands never alias")],
          [r`p`, tx(t, "glslSty_wP", "rim exponent: larger p squeezes the rim into a thinner line at the silhouette")],
        ]}
        note={tx(t, "glslSty_toonNote", "Games often replace the floor() with a 1D \"ramp\" texture indexed by N·L, so artists can paint the bands and their colours. Outlines are drawn separately: an inverted hull (the back faces, pushed out along the normals, as in the Stencil chapter), or edge detection on depth and normals in post.")}>
        {r`\text{toon} = \frac{\lfloor n\,(\vN\cdot\vL) \rfloor}{n} \qquad \text{spec} = \operatorname{smoothstep}(1 - s - \epsilon,\ 1 - s,\ \vN\cdot\vH) \qquad \text{rim} = (1 - \vN\cdot\vV)^p`}
      </Equation>
      <p>{tx(t, "glslSty_toonSteps", "Why it works: N·L is a smooth ramp from 1 (surface faces the light) to 0 (surface edge-on to it). Multiplying by n stretches that ramp to 0..n, floor() chops it into whole steps, and dividing by n brings it back to 0..1, now in n flat levels. Worked with n = 3: N·L = 0.9 gives floor(2.7)/3 = 2/3; N·L = 0.5 gives floor(1.5)/3 = 1/3; N·L = 0.3 gives floor(0.9)/3 = 0. Every point between 0.334 and 0.666 gets exactly 1/3, which is the flat cartoon look. Only N·L = 1 exactly reaches level 3/3, so many shaders use floor(n·x)/(n − 1) or clamp the result to make the brightest band reachable.")}</p>
      <p>{tx(t, "glslSty_specSteps", "The highlight uses the same idea with a single cut. N·H is 1 when the half vector lines up with the normal, the centre of a Blinn-Phong highlight. With s = 0.02, smoothstep(0.98 − ε, 0.98, N·H) is 0 below 0.98 and 1 above, so the highlight becomes a hard-edged spot instead of a soft glow. The rim term needs no light at all: N·V is 1 where the surface faces you and 0 at the silhouette, so (1 − N·V) is 0 at the centre and 1 at the edge. With p = 4, a point where N·V = 0.5 gives 0.5⁴ = 0.06 (almost nothing) while N·V = 0.1 gives 0.9⁴ = 0.66: only the outer rim lights up.")}</p>

      <H2>{tx(t, "glslSty_dissTitle", "Dissolve")}</H2>
      <p>
        {tx(t, "glslSty_dissBody",
          "Give every point of the surface a random but smooth value, from noise in object or world space, and discard fragments whose value is below a threshold. Animating the threshold from 0 to 1 eats the object away. A band just above the threshold is the burning edge:")}
      </p>
      <Equation label={tx(t, "glslSty_dissLabel", "Threshold and edge")}
        where={[[r`n(p)`, tx(t, "glslSty_wNoise", "noise at the surface point")], [r`\tau`, tx(t, "glslSty_wTau", "threshold (the animated amount)")], [r`w`, tx(t, "glslSty_wW", "edge width")]]}>
        {r`\text{discard if } n(p) < \tau \qquad \text{edge} = 1 - \operatorname{smoothstep}\big(0,\ w,\ n(p) - \tau\big)`}
      </Equation>
      <p>{tx(t, "glslSty_dissSteps", "Worked with τ = 0.4 and w = 0.05. A point whose noise is 0.3 has n − τ = −0.1 < 0 and is discarded: it leaves a hole. A point at 0.42 has n − τ = 0.02; smoothstep(0, 0.05, 0.02) ≈ 0.35, so edge = 0.65 and the point glows strongly. A point at 0.6 has n − τ = 0.2, past the edge width, so smoothstep gives 1, edge = 0 and the point keeps its normal colour. As τ climbs from 0 to 1, the holes grow and the glowing band follows their border. The edge colour is usually added, e.g. colour + edge · vec3(4.0, 1.5, 0.3), where values above 1 feed bloom.")}</p>
      <p>{tx(t, "glslSty_dissSpace", "The noise must be sampled in object space (or from a texture via the mesh UV), not in screen space. Screen-space noise stays fixed while the object moves, so the holes would slide across the surface instead of being part of it.")}</p>

      <H2>{tx(t, "glslSty_holoTitle", "Hologram")}</H2>
      <p>
        {tx(t, "glslSty_holoBody",
          "A hologram is light without a surface. It is drawn with additive blending and depth writes off, so front and back faces add up like glowing gas. The Fresnel term brightens silhouettes, and scanlines are a sine of the world-space height. A band scrolls up, and a random flicker sells the effect.")}
      </p>
      <p>{tx(t, "glslSty_holoSteps", "The pieces, term by term. Fresnel is the rim term again, (1 − N·V)ᵖ, which makes edges bright and the centre see-through, like a glass bubble. Scanlines: sin(y · k − t · speed) · 0.5 + 0.5, where y is the world-space height, k sets how many lines per unit (k = 200 gives a line every 2π/200 ≈ 0.031 units) and the − t term makes them scroll upward. Flicker multiplies everything by something like 0.9 + 0.1 · noise(t · 20): a 10% brightness jitter about 20 times a second. Additive blending (glBlendFunc(GL_ONE, GL_ONE)) means the final pixel is the background plus the hologram, so overlapping layers only ever get brighter and the order of drawing does not matter.")}</p>
      <ShaderPlayground presets={STYLE_PRESETS} t={t} id="glslSty" />
      <LessonTable
        headers={[tx(t, "glslSty_thEffect", "Effect"), tx(t, "glslSty_thIngredients", "Ingredients"), tx(t, "glslSty_thState", "Render state")]}
        rows={[
          [tx(t, "glslSty_e1", "Toon"), "floor(N·L·n), step(N·H), (1 − N·V)ᵖ", tx(t, "glslSty_e1s", "opaque; outline pass or post edge detection")],
          [tx(t, "glslSty_e2", "Dissolve"), "noise(p) < τ → discard, edge band", tx(t, "glslSty_e2s", "opaque, culling off to see inside; discard disables early-Z")],
          [tx(t, "glslSty_e3", "Hologram"), "Fresnel + sin(y·k − t) + flicker", tx(t, "glslSty_e3s", "additive (ONE, ONE), depth write off, culling off")],
          [tx(t, "glslSty_e4", "Force field"), tx(t, "glslSty_e4i", "Fresnel + intersection glow (scene depth − fragment depth)"), tx(t, "glslSty_e4s", "additive, needs the depth texture")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "glslSty_warn", "discard switches off early depth testing for that shader, because the GPU cannot know before shading whether the fragment survives. Use it only on the objects that need it, and draw them after the opaque geometry. For dissolve transitions on whole screens, alpha-to-coverage or dithering keep the depth pre-pass working.")}
      </Callout>

      <H2>{tx(t, "glslSty_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "glslSty_thSymptom", "Symptom"), tx(t, "glslSty_thCause", "Cause"), tx(t, "glslSty_thFix", "Fix")]}
        rows={[
          [tx(t, "glslSty_m1a", "Toon bands have jagged, crawling edges"), tx(t, "glslSty_m1b", "A hard floor() step changes value within one pixel"), tx(t, "glslSty_m1c", "Blend over one pixel with fwidth, as in the formula")],
          [tx(t, "glslSty_m2a", "Light side dark, shadow side lit"), tx(t, "glslSty_m2b", "L points from the light to the surface instead of towards the light"), tx(t, "glslSty_m2c", "L = normalize(lightPos − fragPos)")],
          [tx(t, "glslSty_m3a", "Dissolve holes slide as the object moves"), tx(t, "glslSty_m3b", "Noise sampled in screen space"), tx(t, "glslSty_m3c", "Sample it in object space or with the mesh UV")],
          [tx(t, "glslSty_m4a", "Hologram hides objects behind it"), tx(t, "glslSty_m4b", "Depth writes still on, so it fills the depth buffer"), tx(t, "glslSty_m4c", "glDepthMask(GL_FALSE) while drawing it, after the opaque objects")],
          [tx(t, "glslSty_m5a", "Rim glows across the whole object"), tx(t, "glslSty_m5b", "Normal not normalised after interpolation, or exponent p too small"), tx(t, "glslSty_m5c", "normalize(N) in the fragment shader; raise p")],
        ]}
      />
      <KeyIdeas t={t} id="glslSty" items={[
        "Toon: quantise N·L into bands, threshold N·H for a hard highlight, (1 − N·V) for rim and outline.",
        "Dissolve: discard where noise < threshold; a thin band above it glows.",
        "Hologram: additive blending, no depth writes, Fresnel + scanlines + flicker.",
        "discard disables early-Z: use it sparingly.",
      ]} />
    </Article>
  );
}
